-- affiliate_leads already existed in the database (created outside this repo's
-- migration history, 0 rows, no application code depends on it yet). This
-- migration extends it in place instead of recreating it, and hardens grants
-- that were left wider than every other table in this schema.

-- Harden grants first. RLS is already enabled with zero policies, so anon and
-- authenticated currently have no real access despite these grants — but
-- leaving `anon` with ALL (including INSERT/UPDATE/DELETE/TRUNCATE) on a table
-- that will hold customer PII is a live risk the moment any policy is added
-- carelessly. No other table in this project grants anything to anon.
REVOKE ALL ON public.affiliate_leads FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.affiliate_leads FROM authenticated;
GRANT SELECT ON public.affiliate_leads TO authenticated;
GRANT ALL ON public.affiliate_leads TO service_role;

-- Lead touchpoint type. Distinct from the pre-existing lead_status column,
-- which tracks sales follow-up workflow (new/contacted/... — untouched here).
CREATE TYPE public.affiliate_lead_type AS ENUM ('form_submit','zalo_click','phone_click','email_click');

-- Table has 0 rows (verified before writing this migration), so NOT NULL can
-- be added directly without a backfill step.
ALTER TABLE public.affiliate_leads
  ADD COLUMN affiliate_code text NOT NULL,
  ADD COLUMN lead_type public.affiliate_lead_type NOT NULL,
  ADD COLUMN province text,
  ADD COLUMN district text,
  ADD COLUMN product_interest text,
  ADD COLUMN area_sqm numeric;

-- Duplicate lookup performed by the track-lead endpoint (30 minute window).
CREATE INDEX affiliate_leads_dedupe_idx
  ON public.affiliate_leads (visitor_id, affiliate_link_id, lead_type, created_at DESC);
-- Manual lookup/QA by affiliate_code.
CREATE INDEX idx_affiliate_leads_code
  ON public.affiliate_leads (affiliate_code);

-- No SELECT policy existed yet (0 policies, despite RLS being enabled), so
-- affiliates could not see their own leads at all. This lets an affiliate read
-- only their own leads for follow-up; there is still no INSERT/UPDATE/DELETE
-- policy, so lead_data can only ever be written by the server via service_role.
CREATE POLICY "own leads select" ON public.affiliate_leads
  FOR SELECT TO authenticated USING (auth.uid() = affiliate_id);
