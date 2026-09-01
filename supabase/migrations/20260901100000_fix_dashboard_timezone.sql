-- Fix: admin dashboard RPCs used UTC midnight for month boundaries,
-- but the UI displays dates in Vietnam time (UTC+7). Orders created
-- between 17:00 UTC (00:00 VN) and 24:00 UTC of the last day of the
-- previous month were displayed as "month X" on the orders page but
-- not counted in month X by the dashboard RPC.
--
-- Fix: use Asia/Ho_Chi_Minh timezone for month start/end.
-- Also: count approved/paid commission as delivered, add revenue columns.
-- Must DROP first because return type changed (added total_revenue, delivered_revenue).

DROP FUNCTION IF EXISTS public.admin_dashboard_stats(text);
DROP FUNCTION IF EXISTS public.admin_dashboard_breakdown(text);

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats(p_month text DEFAULT NULL)
RETURNS TABLE (
  total_clicks bigint,
  total_leads bigint,
  total_orders bigint,
  delivered_orders bigint,
  total_revenue numeric,
  delivered_revenue numeric,
  pending_commission numeric,
  available_commission numeric,
  paid_commission numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Không có quyền truy cập.';
  END IF;

  IF p_month IS NOT NULL AND p_month <> '' THEN
    -- Use Vietnam timezone so month boundaries match the UI
    v_start := ((p_month || '-01')::date AT TIME ZONE 'Asia/Ho_Chi_Minh');
    v_end := v_start + interval '1 month';
  ELSE
    v_start := '1970-01-01'::timestamptz;
    v_end := now() + interval '1 day';
  END IF;

  SELECT COALESCE(SUM(clicks), 0) INTO total_clicks FROM public.affiliate_links;

  SELECT COUNT(*) INTO total_leads
  FROM public.affiliate_leads
  WHERE created_at >= v_start AND created_at < v_end;

  SELECT COUNT(*) INTO total_orders
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end;

  -- Delivered orders: either order_status is delivered/completed,
  -- or commission has been approved/paid (admin approval implies delivered)
  SELECT COUNT(*) INTO delivered_orders
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end
    AND (
      order_status IN ('delivered', 'completed', 'giao_thanh_cong')
      OR commission_status IN ('approved', 'paid')
    );

  -- Total revenue (all orders in period)
  SELECT COALESCE(SUM(final_amount), 0) INTO total_revenue
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end;

  -- Delivered revenue (orders that are delivered/approved/paid)
  SELECT COALESCE(SUM(final_amount), 0) INTO delivered_revenue
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end
    AND (
      order_status IN ('delivered', 'completed', 'giao_thanh_cong')
      OR commission_status IN ('approved', 'paid')
    );

  SELECT COALESCE(SUM(commission_amount), 0) INTO pending_commission
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end
    AND commission_status = 'pending';

  SELECT COALESCE(SUM(commission_amount), 0) INTO available_commission
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end
    AND commission_status = 'approved';

  SELECT COALESCE(SUM(commission_amount), 0) INTO paid_commission
  FROM public.orders
  WHERE created_at >= v_start AND created_at < v_end
    AND commission_status = 'paid';

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats(text) TO authenticated;

-- ─── Breakdown: same timezone fix ───

CREATE OR REPLACE FUNCTION public.admin_dashboard_breakdown(p_month text DEFAULT NULL)
RETURNS TABLE (
  affiliate_id uuid,
  affiliate_code text,
  affiliate_name text,
  clicks bigint,
  leads bigint,
  orders bigint,
  delivered_orders bigint,
  total_revenue numeric,
  delivered_revenue numeric,
  pending_commission numeric,
  available_commission numeric,
  paid_commission numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Không có quyền truy cập.';
  END IF;

  IF p_month IS NOT NULL AND p_month <> '' THEN
    v_start := ((p_month || '-01')::date AT TIME ZONE 'Asia/Ho_Chi_Minh');
    v_end := v_start + interval '1 month';
  ELSE
    v_start := '1970-01-01'::timestamptz;
    v_end := now() + interval '1 day';
  END IF;

  RETURN QUERY
  SELECT
    a.id AS affiliate_id,
    a.affiliate_code,
    a.full_name AS affiliate_name,
    COALESCE(lc.clicks, 0)::bigint AS clicks,
    COALESCE(lc.leads, 0)::bigint AS leads,
    COALESCE(oc.orders, 0)::bigint AS orders,
    COALESCE(oc.delivered, 0)::bigint AS delivered_orders,
    COALESCE(oc.total_revenue, 0)::numeric AS total_revenue,
    COALESCE(oc.delivered_revenue, 0)::numeric AS delivered_revenue,
    COALESCE(oc.pending, 0)::numeric AS pending_commission,
    COALESCE(oc.available, 0)::numeric AS available_commission,
    COALESCE(oc.paid, 0)::numeric AS paid_commission
  FROM public.affiliates a
  LEFT JOIN (
    SELECT
      al.affiliate_id,
      SUM(al.clicks)::bigint AS clicks,
      COUNT(le.id)::bigint AS leads
    FROM public.affiliate_links al
    LEFT JOIN public.affiliate_leads le
      ON le.affiliate_link_id = al.id
      AND le.created_at >= v_start AND le.created_at < v_end
    GROUP BY al.affiliate_id
  ) lc ON lc.affiliate_id = a.id
  LEFT JOIN (
    SELECT
      o.affiliate_id,
      COUNT(*)::bigint AS orders,
      COUNT(*) FILTER (WHERE o.order_status IN ('delivered','completed','giao_thanh_cong') OR o.commission_status IN ('approved','paid'))::bigint AS delivered,
      COALESCE(SUM(o.final_amount), 0)::numeric AS total_revenue,
      COALESCE(SUM(o.final_amount) FILTER (WHERE o.order_status IN ('delivered','completed','giao_thanh_cong') OR o.commission_status IN ('approved','paid')), 0)::numeric AS delivered_revenue,
      COALESCE(SUM(o.commission_amount) FILTER (WHERE o.commission_status = 'pending'), 0)::numeric AS pending,
      COALESCE(SUM(o.commission_amount) FILTER (WHERE o.commission_status = 'approved'), 0)::numeric AS available,
      COALESCE(SUM(o.commission_amount) FILTER (WHERE o.commission_status = 'paid'), 0)::numeric AS paid
    FROM public.orders o
    WHERE o.created_at >= v_start AND o.created_at < v_end
    GROUP BY o.affiliate_id
  ) oc ON oc.affiliate_id = a.id
  WHERE a.role = 'affiliate'
  ORDER BY oc.orders DESC NULLS LAST, lc.clicks DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_breakdown(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_breakdown(text) TO authenticated;
