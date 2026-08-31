-- Allow admin_create_order to accept an explicit affiliate_link_id (UUID)
-- instead of only resolving the link via campaign_slug. The Pipedream sync
-- from Google Sheets sends the affiliate_link_id that the landing page
-- captured, which is more reliable than guessing from campaign_slug.
--
-- If p_affiliate_link_id is provided AND belongs to the matched affiliate,
-- use it directly. Otherwise fall back to the campaign_slug lookup.

CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_order_code text,
  p_affiliate_code text DEFAULT NULL,
  p_final_amount numeric DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_total_amount numeric DEFAULT NULL,
  p_discount_amount numeric DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_campaign_slug text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_products jsonb DEFAULT NULL,
  p_shipping_address text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_affiliate_link_id uuid DEFAULT NULL
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

  -- Idempotent on order_code.
  SELECT * INTO v_row FROM public.orders WHERE order_code = trim(p_order_code);
  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_code := NULLIF(upper(trim(COALESCE(p_affiliate_code, ''))), '');
  IF v_code IS NOT NULL THEN
    SELECT * INTO v_affiliate FROM public.affiliates WHERE affiliate_code = v_code;
  END IF;

  -- Resolve the affiliate link. Prefer an explicit affiliate_link_id (sent
  -- by the Pipedream sync from the Sheet), then fall back to campaign_slug.
  IF v_affiliate.id IS NOT NULL AND p_affiliate_link_id IS NOT NULL THEN
    SELECT * INTO v_link FROM public.affiliate_links
      WHERE id = p_affiliate_link_id AND affiliate_id = v_affiliate.id
      LIMIT 1;
  ELSIF v_affiliate.id IS NOT NULL AND p_campaign_slug IS NOT NULL THEN
    SELECT * INTO v_link FROM public.affiliate_links
      WHERE affiliate_id = v_affiliate.id AND campaign_slug = p_campaign_slug
      LIMIT 1;
  END IF;

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
REVOKE ALL ON FUNCTION public.admin_create_order FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_order TO authenticated, service_role;
