-- Allow marking an approved commission as paid (admin transferred the money
-- to the affiliate), and undoing a paid mark back to approved if it was set
-- by mistake. The existing admin_update_commission_status function only
-- handled pending -> approved/cancelled; this replaces it with one that also
-- handles approved <-> paid.
--
-- paid is bookkeeping-only on the order row: the commission was already
-- moved out of pending_earnings when it was approved, so the affiliate's
-- balance is not touched here. total_earnings is also left alone (the
-- commission was real, it just got paid out).

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

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới được cập nhật hoa hồng';
  END IF;

  IF p_status NOT IN ('approved', 'cancelled', 'paid') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn hàng';
  END IF;
  IF v_order.affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Đơn hàng này không có cộng tác viên để duyệt hoa hồng';
  END IF;

  -- pending -> approved: move commission from pending_earnings to available.
  IF v_order.commission_status = 'pending' AND p_status = 'approved' THEN
    UPDATE public.affiliates
      SET pending_earnings = GREATEST(COALESCE(pending_earnings, 0) - v_order.commission_amount, 0)
      WHERE id = v_order.affiliate_id;

  -- pending -> cancelled: commission never happened, undo everything.
  ELSIF v_order.commission_status = 'pending' AND p_status = 'cancelled' THEN
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

  -- approved -> paid: bookkeeping only, balance already adjusted at approval.
  ELSIF v_order.commission_status = 'approved' AND p_status = 'paid' THEN
    NULL;

  -- paid -> approved: undo the paid mark, balance is already correct for approved.
  ELSIF v_order.commission_status = 'paid' AND p_status = 'approved' THEN
    NULL;

  -- approved -> cancelled: undo the approval (move commission back to pending)
  -- then cancel. This is an edge case: admin approved by mistake and wants to
  -- cancel instead. Re-add to pending_earnings first, then remove entirely.
  ELSIF v_order.commission_status = 'approved' AND p_status = 'cancelled' THEN
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

  ELSE
    RAISE EXCEPTION 'Không thể chuyển từ % sang %', v_order.commission_status, p_status;
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
