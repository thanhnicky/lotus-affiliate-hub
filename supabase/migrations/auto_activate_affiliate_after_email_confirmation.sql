-- Migration: Tự động kích hoạt tài khoản CTV trong bảng public.affiliates sau khi xác thực email
-- Mục đích: Chuyển status từ 'pending' sang 'active' khi auth.users.email_confirmed_at được cập nhật

CREATE OR REPLACE FUNCTION public.activate_affiliate_after_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Chỉ tự động kích hoạt nếu tài khoản đang ở trạng thái 'pending' và có vai trò 'affiliate'
  -- Không kích hoạt tài khoản 'suspended' và không thay đổi tài khoản 'admin'
  UPDATE public.affiliates
  SET
    status = 'active',
    approved_at = NOW()
  WHERE
    user_id = NEW.id
    AND status = 'pending'
    AND role = 'affiliate';

  RETURN NEW;
END;
$$;

-- Xóa trigger cũ nếu tồn tại
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Tạo trigger kích hoạt khi email_confirmed_at chuyển từ NULL sang NOT NULL
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.activate_affiliate_after_email_confirmation();

/*
================================================================================
CÂU LỆNH KIỂM TRA SAU KHI CHẠY MIGRATION (COPY VÀO SQL EDITOR ĐỂ KIỂM TRA):
================================================================================

SELECT
  u.id AS user_id,
  u.email,
  u.email_confirmed_at,
  a.affiliate_code,
  a.status AS affiliate_status,
  a.role AS affiliate_role,
  a.approved_at,
  a.created_at
FROM auth.users u
LEFT JOIN public.affiliates a ON a.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;
*/
