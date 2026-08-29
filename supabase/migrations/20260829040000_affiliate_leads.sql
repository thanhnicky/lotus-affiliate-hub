CREATE TYPE public.affiliate_lead_type AS ENUM ('form_submit','zalo_click','phone_click','email_click');

CREATE TABLE public.affiliate_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  affiliate_link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  affiliate_code text NOT NULL,
  visitor_id uuid NOT NULL,
  lead_type public.affiliate_lead_type NOT NULL,
  lead_source text NOT NULL,
  -- Customer details typed into the landing page form. Written only by the
  -- tracking endpoint via service_role; readable only by the owning affiliate.
  lead_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Portal listing: newest leads of one affiliate.
CREATE INDEX affiliate_leads_affiliate_created_idx
  ON public.affiliate_leads (affiliate_id, created_at DESC);
-- Per-link reporting.
CREATE INDEX affiliate_leads_link_idx
  ON public.affiliate_leads (affiliate_link_id);
-- Duplicate lookup performed by the track-lead endpoint.
CREATE INDEX affiliate_leads_dedupe_idx
  ON public.affiliate_leads (visitor_id, affiliate_link_id, lead_type, created_at DESC);

GRANT SELECT ON public.affiliate_leads TO authenticated;
GRANT ALL ON public.affiliate_leads TO service_role;

ALTER TABLE public.affiliate_leads ENABLE ROW LEVEL SECURITY;

-- Affiliates may read their own leads so they can follow up. No INSERT/UPDATE/
-- DELETE policy exists for authenticated, so the PII in lead_data can only ever
-- be written by the server using the service role.
CREATE POLICY "own leads select" ON public.affiliate_leads
  FOR SELECT TO authenticated USING (auth.uid() = affiliate_id);
