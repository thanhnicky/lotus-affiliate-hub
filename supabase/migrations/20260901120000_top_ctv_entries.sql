-- Admin-managed "TOP CTV" entries for homepage display.
-- Admin manually fills in display info (name, code, revenue, orders).
-- Public can read active entries; only admin can write.

CREATE TABLE IF NOT EXISTS public.top_ctv_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank integer NOT NULL DEFAULT 0,
  display_name text NOT NULL,
  affiliate_code text NOT NULL DEFAULT '',
  revenue_label text NOT NULL DEFAULT '',
  orders_label text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast public read of active entries ordered by rank
CREATE INDEX IF NOT EXISTS idx_top_ctv_active_rank
  ON public.top_ctv_entries (is_active, rank)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.top_ctv_entries ENABLE ROW LEVEL SECURITY;

-- Public can read active entries
CREATE POLICY "Public read active top ctv"
ON public.top_ctv_entries
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin can read/write all
CREATE POLICY "Admin all top ctv"
ON public.top_ctv_entries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
  )
);

-- Grants
GRANT SELECT ON public.top_ctv_entries TO anon, authenticated;
GRANT ALL ON public.top_ctv_entries TO authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_top_ctv_updated ON public.top_ctv_entries;
CREATE TRIGGER trg_top_ctv_updated
  BEFORE UPDATE ON public.top_ctv_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
