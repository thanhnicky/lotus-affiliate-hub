-- Allow anon (public) to read active landing pages so the homepage
-- can display product thumbnails without requiring login.
-- Previously only authenticated users could read landing_pages, which
-- caused the homepage to fall back to the static product list on
-- mobile/incognito where the user is not logged in.

CREATE POLICY "Public read active landing pages"
ON public.landing_pages
FOR SELECT
TO anon, authenticated
USING (is_active = true);
