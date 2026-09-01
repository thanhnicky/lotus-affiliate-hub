-- Admin: dashboard stats across ALL affiliates.
-- Returns: total clicks, total leads, total orders, delivered orders,
-- pending commission, available commission, paid commission.
-- SECURITY DEFINER, admin-only.
-- p_period: 'all' | 'week' | 'month'

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats(p_period text DEFAULT 'all')
RETURNS TABLE (
  total_clicks bigint,
  total_leads bigint,
  total_orders bigint,
  delivered_orders bigint,
  pending_commission numeric,
  available_commission numeric,
  paid_commission numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start_date timestamptz;
BEGIN
  -- Admin-only check
  IF NOT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Không có quyền truy cập.';
  END IF;

  -- Determine date range
  v_start_date := CASE
    WHEN p_period = 'week' THEN now() - interval '7 days'
    WHEN p_period = 'month' THEN now() - interval '30 days'
    ELSE '1970-01-01'::timestamptz
  END;

  -- Total clicks (from affiliate_links, sum of clicks column)
  -- Note: clicks are cumulative counters, not timestamped events.
  -- For period filtering we'd need a clicks log table. For now,
  -- total_clicks reflects all-time. Orders/leads are date-filtered.
  SELECT COALESCE(SUM(clicks), 0) INTO total_clicks FROM public.affiliate_links;

  -- Total leads (from affiliate_leads, filtered by period)
  SELECT COUNT(*) INTO total_leads
  FROM public.affiliate_leads
  WHERE created_at >= v_start_date;

  -- Total orders (filtered by period)
  SELECT COUNT(*) INTO total_orders
  FROM public.orders
  WHERE created_at >= v_start_date;

  -- Delivered orders (order_status = 'delivered' or 'completed')
  SELECT COUNT(*) INTO delivered_orders
  FROM public.orders
  WHERE created_at >= v_start_date
    AND order_status IN ('delivered', 'completed', 'giao_thanh_cong');

  -- Pending commission (status = pending)
  SELECT COALESCE(SUM(commission_amount), 0) INTO pending_commission
  FROM public.orders
  WHERE created_at >= v_start_date
    AND commission_status = 'pending';

  -- Available commission (status = approved, can be withdrawn)
  SELECT COALESCE(SUM(commission_amount), 0) INTO available_commission
  FROM public.orders
  WHERE created_at >= v_start_date
    AND commission_status = 'approved';

  -- Paid commission (status = paid)
  SELECT COALESCE(SUM(commission_amount), 0) INTO paid_commission
  FROM public.orders
  WHERE created_at >= v_start_date
    AND commission_status = 'paid';

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats(text) TO authenticated;
