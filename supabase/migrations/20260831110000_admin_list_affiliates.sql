-- Admin: list all affiliates with order stats (count, approved, paid commission,
-- last order date). SECURITY DEFINER, admin-only.
-- Returns one row per affiliate with aggregated order metrics.

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
  paid_commission numeric,
  last_order_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Admin-only check.
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
    COALESCE(a.email, ''),
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
    a.approved_at,
    COALESCE(o.order_count, 0),
    COALESCE(o.approved_order_count, 0),
    COALESCE(o.paid_commission, 0),
    o.last_order_at
  FROM public.affiliates a
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS order_count,
      COUNT(*) FILTER (WHERE commission_status IN ('approved', 'paid')) AS approved_order_count,
      COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) AS paid_commission,
      MAX(created_at) AS last_order_at
    FROM public.orders
    WHERE affiliate_id = a.id
  ) o ON TRUE
  ORDER BY o.paid_commission DESC NULLS LAST, o.order_count DESC NULLS LAST, a.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_affiliates() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_affiliates() TO authenticated;
