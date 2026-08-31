-- orders already existed in the database (created outside this repo's
-- migration history, 0 rows, no application code depends on it yet) with a
-- fuller schema than first assumed: order_code (unique), customer_name/phone/
-- email, total/discount/final_amount, order_status + payment_status (both
-- separate from commission_status), products jsonb, shipping_address, notes.
-- This migration hardens it in place instead of creating a duplicate table.

-- Harden grants first. RLS is already enabled with only one SELECT policy, so
-- anon and authenticated currently have no real write access despite these
-- grants -- but leaving `anon` with ALL (including INSERT/UPDATE/DELETE/
-- TRUNCATE) on a table holding customer PII and commission amounts is a live
-- risk the moment a policy is added carelessly. No other table in this
-- project grants anything to anon.
REVOKE ALL ON public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.orders FROM authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- The existing "Affiliate reads own attributed orders" policy already covers
-- affiliates. This adds the missing admin visibility into every order,
-- including ones with no matching affiliate.
CREATE POLICY "admin reads all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid() AND a.role = 'admin'));

-- No INSERT/UPDATE/DELETE policy for authenticated: all writes go through the
-- SECURITY DEFINER functions below, which check the caller is an admin (or,
-- for creation only, the service role used by the sync endpoint) and keep the
-- commission math atomic with the order row itself.

CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_order_code text,
  p_affiliate_code text,
  p_final_amount numeric,
  p_customer_name text,
  p_customer_phone text,
  p_total_amount numeric DEFAULT NULL,
  p_discount_amount numeric DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_campaign_slug text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_products jsonb DEFAULT NULL,
  p_shipping_address text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean;
  v_affiliate public.affiliates;
  v_link public.affiliate_links;
  v_commission numeric := 0;
  v_code text;
  v_row public.orders;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.affiliates WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Callable by an admin from the portal, or by the sync endpoint using the
  -- service role key. Never by a plain affiliate.
  IF NOT (v_is_admin OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới được tạo đơn hàng';
  END IF;

  IF p_order_code IS NULL OR trim(p_order_code) = '' THEN
    RAISE EXCEPTION 'Thiếu mã đơn hàng';
  END IF;
  IF p_final_amount IS NULL OR p_final_amount <= 0 THEN
    RAISE EXCEPTION 'Giá trị đơn hàng không hợp lệ';
  END IF;
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Thiếu tên khách hàng';
  END IF;
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
    RAISE EXCEPTION 'Thiếu số điện thoại khách hàng';
  END IF;

  -- Idempotent on order_code (already UNIQUE on this table), so a repeated
  -- sync run or an admin resubmitting the same form returns the existing
  -- order untouched instead of double-counting it.
  SELECT * INTO v_row FROM public.orders WHERE order_code = trim(p_order_code);
  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_code := NULLIF(upper(trim(COALESCE(p_affiliate_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT * INTO v_affiliate FROM public.affiliates WHERE affiliate_code = v_code;
  END IF;

  -- An order with no matching affiliate is still recorded (per product
  -- decision) so admins can see every order, but nothing is credited to
  -- anyone and affiliate_links is left untouched.
  IF v_affiliate.id IS NOT NULL AND p_campaign_slug IS NOT NULL THEN
    SELECT * INTO v_link FROM public.affiliate_links
      WHERE affiliate_id = v_affiliate.id AND campaign_slug = p_campaign_slug
      LIMIT 1;
  END IF;

  -- Commission is computed on final_amount (post-discount, what the customer
  -- actually pays), not the pre-discount total_amount.
  IF v_affiliate.id IS NOT NULL THEN
    v_commission := round(p_final_amount * COALESCE(v_affiliate.commission_rate, 0), 2);
  END IF;

  INSERT INTO public.orders (
    order_code, customer_name, customer_phone, customer_email,
    total_amount, discount_amount, final_amount,
    affiliate_id, affiliate_link_id, commission_rate, commission_amount, commission_status,
    payment_method, products, shipping_address, notes
  ) VALUES (
    trim(p_order_code), trim(p_customer_name), trim(p_customer_phone),
    NULLIF(trim(COALESCE(p_customer_email, '')), ''),
    COALESCE(p_total_amount, p_final_amount), COALESCE(p_discount_amount, 0), p_final_amount,
    v_affiliate.id, v_link.id, v_affiliate.commission_rate, v_commission,
    CASE WHEN v_affiliate.id IS NOT NULL THEN 'pending' ELSE NULL END,
    NULLIF(trim(COALESCE(p_payment_method, '')), ''), p_products,
    NULLIF(trim(COALESCE(p_shipping_address, '')), ''),
    NULLIF(trim(COALESCE(p_notes, '')), '')
  ) RETURNING * INTO v_row;

  IF v_affiliate.id IS NOT NULL THEN
    UPDATE public.affiliates
      SET total_earnings = COALESCE(total_earnings, 0) + v_commission,
          pending_earnings = COALESCE(pending_earnings, 0) + v_commission
      WHERE id = v_affiliate.id;
  END IF;

  IF v_link.id IS NOT NULL THEN
    UPDATE public.affiliate_links
      SET conversions = COALESCE(conversions, 0) + 1,
          total_revenue = COALESCE(total_revenue, 0) + p_final_amount
      WHERE id = v_link.id;
  END IF;

  RETURN v_row;
END; $$;
REVOKE ALL ON FUNCTION public.admin_create_order(
  text, text, numeric, text, text, numeric, numeric, text, text, text, jsonb, text, text
) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_order(
  text, text, numeric, text, text, numeric, numeric, text, text, text, jsonb, text, text
) TO authenticated, service_role;

-- Named for the commission_status column specifically (distinct from the
-- unrelated order_status/payment_status fulfillment fields on this table,
-- which this feature does not touch). Uses the existing check-constrained
-- values: 'approved' or 'cancelled' (there is no 'rejected' value here).
CREATE OR REPLACE FUNCTION public.admin_update_commission_status(
  p_order_id uuid,
  p_status text,
  p_note text DEFAULT NULL
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean;
  v_order public.orders;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.affiliates WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Approval is always a deliberate human action, never automated.
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới được duyệt hoa hồng';
  END IF;

  IF p_status NOT IN ('approved', 'cancelled') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn hàng';
  END IF;
  IF v_order.affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Đơn hàng này không có cộng tác viên để duyệt hoa hồng';
  END IF;
  IF v_order.commission_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Hoa hồng của đơn hàng này đã được xử lý trước đó';
  END IF;

  IF p_status = 'approved' THEN
    -- Moves the commission from "pending" to "available to withdraw" without
    -- touching total_earnings.
    UPDATE public.affiliates
      SET pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - v_order.commission_amount, 0)
      WHERE id = v_order.affiliate_id;
  ELSE
    -- Cancelled: the commission never happened, so remove it entirely, and
    -- undo the conversion/revenue this order had added to its link.
    UPDATE public.affiliates
      SET total_earnings = GREATEST(COALESCE(total_earnings, 0) - v_order.commission_amount, 0),
          pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - v_order.commission_amount, 0)
      WHERE id = v_order.affiliate_id;

    IF v_order.affiliate_link_id IS NOT NULL THEN
      UPDATE public.affiliate_links
        SET conversions = GREATEST(COALESCE(conversions, 0) - 1, 0),
            total_revenue = GREATEST(COALESCE(total_revenue, 0) - v_order.final_amount, 0)
        WHERE id = v_order.affiliate_link_id;
    END IF;
  END IF;

  UPDATE public.orders
    SET commission_status = p_status,
        notes = COALESCE(NULLIF(trim(COALESCE(p_note, '')), ''), notes),
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

  RETURN v_order;
END; $$;
REVOKE ALL ON FUNCTION public.admin_update_commission_status(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_commission_status(uuid, text, text) TO authenticated;
