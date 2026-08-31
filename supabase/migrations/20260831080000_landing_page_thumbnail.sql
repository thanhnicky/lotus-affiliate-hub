-- Add thumbnail_url to landing_pages so the CTV create-link page can show
-- a visual card per landing page instead of a plain dropdown.
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS thumbnail_url text;
