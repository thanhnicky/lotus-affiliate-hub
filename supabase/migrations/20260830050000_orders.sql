-- Orders + commission approval workflow.
--
-- Order value comes from the landing page's OrderForm, which currently only
-- reaches Google Sheets (via Google Apps Script), not Supabase. Until that
-- pipeline is replaced, orders here are created either by an admin manually,
-- or by an automation (Pipedream/Zapier) reading the sheet and POSTing to
-- /api/affiliate/sync-order. Both paths funnel through admin_create_order so
-- the commission math and affiliate_links/affiliates bookkeeping only exist
-- in one place.

CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Client-generated at submit time (OrderForm) and carried into Google
  -- Sheets, so re-running the sheet sync never double-counts a commission.
  external_reference text NOT NULL UNIQUE,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  -- Snapshot of the code claimed at order time, kept even when it didn't
  -- resolve to a real affiliate, so admins can see what the sheet said.
  affiliate_code text,
  order_value numeric NOT NULL CHECK (order_value > 0),
  -- Locked from affiliates.commission_rate when the order is created, so a
  -- later rate change never rewrites the commission on past orders.
  commission_rate numeric,
  commission_amount numeric NOT NULL DEFAULT 0,
  customer_name text,
  customer_phone text,
  status public.order_status NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'manual',
  note text,
  created_by uuid REFERENCES public.affiliates(id),
  approved_by uuid REFERENCES public.affiliates(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_affiliate_idx ON public.orders (affiliate_id, created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (status, created_at DESC);

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Affiliates see only their own orders.
CREATE POLICY "own orders select" ON public.orders
  FOR SELECT TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Admins see every order, including ones with no matching affiliate.
CREATE POLICY "admin orders select all" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid() AND a.role = 'admin'));

-- No INSERT/UPDATE/DELETE policy for authenticated: all writes go through the
-- SECURITY DEFINER functions below, which check the caller is an admin (or,
-- for creation only, the service role used by the sync endpoint) and keep the
-- commission math atomic with the order row itself.

CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_external_reference text,
  p_affiliate_code text,
  p_order_value numeric,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_campaign_slug text DEFAULT NULL,
  p_source text DEFAULT 'manual'
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_affiliate public.affiliates;
  v_link public.affiliate_links;
  v_commission numeric := 0;
  v_code text;
  v_row public.orders;
BEGIN
  SELECT id INTO v_caller_id FROM public.affiliates WHERE user_id = auth.uid();
  SELECT EXISTS(
    SELECT 1 FROM public.affiliates WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Callable by an admin from the portal, or by the sync endpoint using the
  -- service role key. Never by a plain affiliate.
  IF NOT (v_is_admin OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới được tạo đơn hàng';
  END IF;

  IF p_order_value IS NULL OR p_order_value <= 0 THEN
    RAISE EXCEPTION 'Giá trị đơn hàng không hợp lệ';
  END IF;
  IF p_external_reference IS NULL OR trim(p_external_reference) = '' THEN
    RAISE EXCEPTION 'Thiếu mã định danh đơn hàng';
  END IF;

  -- Idempotent: a repeated sync run (or an admin resubmitting the same form)
  -- returns the existing order untouched instead of double-counting it.
  SELECT * INTO v_row FROM public.orders WHERE external_reference = p_external_reference;
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

  IF v_affiliate.id IS NOT NULL THEN
    v_commission := round(p_order_value * COALESCE(v_affiliate.commission_rate, 0), 2);
  END IF;

  INSERT INTO public.orders (
    external_reference, affiliate_id, affiliate_link_id, affiliate_code,
    order_value, commission_rate, commission_amount,
    customer_name, customer_phone, status, source, created_by
  ) VALUES (
    p_external_reference, v_affiliate.id, v_link.id, v_code,
    p_order_value, v_affiliate.commission_rate, v_commission,
    NULLIF(trim(COALESCE(p_customer_name, '')), ''),
    NULLIF(trim(COALESCE(p_customer_phone, '')), ''),
    'pending', COALESCE(NULLIF(trim(p_source), ''), 'manual'), v_caller_id
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
          total_revenue = COALESCE(total_revenue, 0) + p_order_value
      WHERE id = v_link.id;
  END IF;

  RETURN v_row;
END; $$;
REVOKE ALL ON FUNCTION public.admin_create_order(text, text, numeric, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_order(text, text, numeric, text, text, text, text)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_note text DEFAULT NULL
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_order public.orders;
BEGIN
  SELECT id INTO v_caller_id FROM public.affiliates WHERE user_id = auth.uid();
  SELECT EXISTS(
    SELECT 1 FROM public.affiliates WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Approval is always a deliberate human action, never automated.
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới được duyệt đơn hàng';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn hàng';
  END IF;
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Đơn hàng đã được xử lý trước đó';
  END IF;

  IF v_order.affiliate_id IS NOT NULL THEN
    IF p_status = 'approved' THEN
      -- Moves the commission from "pending" to "available to withdraw"
      -- without touching total_earnings.
      UPDATE public.affiliates
        SET pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - v_order.commission_amount, 0)
        WHERE id = v_order.affiliate_id;
    ELSE
      -- Rejected: the commission never happened, so remove it entirely, and
      -- undo the conversion/revenue this order had added to its link.
      UPDATE public.affiliates
        SET total_earnings = GREATEST(COALESCE(total_earnings, 0) - v_order.commission_amount, 0),
            pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - v_order.commission_amount, 0)
        WHERE id = v_order.affiliate_id;

      IF v_order.affiliate_link_id IS NOT NULL THEN
        UPDATE public.affiliate_links
          SET conversions = GREATEST(COALESCE(conversions, 0) - 1, 0),
              total_revenue = GREATEST(COALESCE(total_revenue, 0) - v_order.order_value, 0)
          WHERE id = v_order.affiliate_link_id;
      END IF;
    END IF;
  END IF;

  UPDATE public.orders
    SET status = p_status::public.order_status,
        note = COALESCE(NULLIF(trim(COALESCE(p_note, '')), ''), note),
        approved_by = v_caller_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

  RETURN v_order;
END; $$;
REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) TO authenticated;
