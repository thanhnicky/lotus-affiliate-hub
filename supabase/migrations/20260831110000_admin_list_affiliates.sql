-- Admin: list all affiliates with order stats (count, approved, pending/available/paid
-- commission, last order date). SECURITY DEFINER, admin-only.

CREATE OR REPLACE FUNCTION public.admin_list_affiliates()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  affiliate_code text,
  full_name text,
  phone text,
  email text,
  zalo_id text,
  bank_name text,
  bank_account text,
  bank_holder text,
  status text,
  role text,
  commission_rate numeric,
  total_earnings numeric,
  pending_earnings numeric,
  paid_earnings numeric,
  created_at timestamptz,
  approved_at timestamptz,
  order_count bigint,
  approved_order_count bigint,
  pending_commission numeric,
  available_commission numeric,
  paid_commission numeric,
  last_order_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Không có quyền truy cập.';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.affiliate_code,
    a.full_name,
    a.phone,
    COALESCE(u.email::text, ''),
    COALESCE(a.zalo_id, ''),
    COALESCE(a.bank_name, ''),
    COALESCE(a.bank_account, ''),
    COALESCE(a.bank_holder, ''),
    a.status,
    COALESCE(a.role, 'affiliate'),
    COALESCE(a.commission_rate, 0),
    COALESCE(a.total_earnings, 0),
    COALESCE(a.pending_earnings, 0),
    COALESCE(a.paid_earnings, 0),
    a.created_at,
    a.approved_at::timestamptz,
    COALESCE(o.order_count, 0),
    COALESCE(o.approved_order_count, 0),
    COALESCE(o.pending_commission, 0),
    COALESCE(o.available_commission, 0),
    COALESCE(o.paid_commission, 0),
    o.last_order_at
  FROM public.affiliates a
  LEFT JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS order_count,
      COUNT(*) FILTER (WHERE commission_status IN ('approved', 'paid')) AS approved_order_count,
      COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0) AS pending_commission,
      COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'approved'), 0) AS available_commission,
      COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) AS paid_commission,
      MAX(orders.created_at) AS last_order_at
    FROM public.orders
    WHERE affiliate_id = a.id
  ) o ON TRUE
  ORDER BY o.paid_commission DESC NULLS LAST, o.order_count DESC NULLS LAST, a.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_affiliates() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_affiliates() TO authenticated;
