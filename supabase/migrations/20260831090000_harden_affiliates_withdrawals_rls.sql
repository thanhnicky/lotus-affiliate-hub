-- Harden RLS + policies for affiliates and withdrawals.
-- These two tables predate the affiliate-hub migrations (created via Supabase
-- UI or Lovable), so their RLS/policies are not in the migration history.
-- This migration is idempotent: it enables RLS, revokes anon, and creates the
-- expected policies only if they don't already exist.

-- ============ affiliates ============

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Revoke anon access entirely.
REVOKE ALL ON public.affiliates FROM anon;

-- Authenticated can SELECT (policies below will scope it).
-- Revoke DML that authenticated should not have; writes go through RPCs.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.affiliates FROM authenticated;
GRANT SELECT ON public.affiliates TO authenticated;

-- service_role keeps full access.
GRANT ALL ON public.affiliates TO service_role;

-- Policy: a user can read their own affiliate row (matched by user_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'affiliates' AND policyname = 'own affiliate select'
  ) THEN
    CREATE POLICY "own affiliate select" ON public.affiliates
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: an admin can read all affiliate rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'affiliates' AND policyname = 'admin reads all affiliates'
  ) THEN
    CREATE POLICY "admin reads all affiliates" ON public.affiliates
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid() AND a.role = 'admin')
      );
  END IF;
END $$;

-- ============ withdrawals ============

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Revoke anon access entirely.
REVOKE ALL ON public.withdrawals FROM anon;

-- Authenticated can SELECT only (policies below scope it).
-- Withdrawals are created/updated via service_role or admin RPCs, not by the
-- client directly, so we don't grant INSERT/UPDATE/DELETE to authenticated.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.withdrawals FROM authenticated;
GRANT SELECT ON public.withdrawals TO authenticated;

-- service_role keeps full access.
GRANT ALL ON public.withdrawals TO service_role;

-- Policy: a CTV can read their own withdrawals (matched by affiliate_id ->
-- affiliates.user_id = auth.uid()). We join to affiliates because withdrawals
-- stores affiliate_id (the affiliate row's id), not the auth user id directly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'withdrawals' AND policyname = 'own withdrawals select'
  ) THEN
    CREATE POLICY "own withdrawals select" ON public.withdrawals
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.affiliates a
          WHERE a.id = affiliate_id AND a.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: an admin can read all withdrawals.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'withdrawals' AND policyname = 'admin reads all withdrawals'
  ) THEN
    CREATE POLICY "admin reads all withdrawals" ON public.withdrawals
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid() AND a.role = 'admin')
      );
  END IF;
END $$;
