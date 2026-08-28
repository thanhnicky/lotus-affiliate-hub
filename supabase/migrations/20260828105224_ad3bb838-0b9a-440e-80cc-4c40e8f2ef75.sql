REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.lock_profile_privileged_fields() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_affiliate_link(uuid, text, text) FROM public, anon;