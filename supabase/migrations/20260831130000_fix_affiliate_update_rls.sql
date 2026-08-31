-- Fix: CTV couldn't update own profile (bank info, phone, etc.)
-- Two issues:
--   1. Old UPDATE policy had overly strict WITH CHECK requiring
--      role='affiliate' AND status IN ('pending','active'), which
--      caused 403 errors for valid CTVs.
--   2. Missing GRANT UPDATE on affiliates table for authenticated.
--
-- Replaced with a simple policy: user can update their own row
-- (user_id = auth.uid()), no extra constraints.

DROP POLICY IF EXISTS "Affiliate updates permitted own profile" ON public.affiliates;

CREATE POLICY "Affiliate updates own profile"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

GRANT UPDATE ON public.affiliates TO authenticated;
