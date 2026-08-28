CREATE TYPE public.ctv_status AS ENUM ('pending','active','suspended');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  affiliate_code text NOT NULL UNIQUE,
  status public.ctv_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.lock_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.status := OLD.status;
  NEW.affiliate_code := OLD.affiliate_code;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_lock_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.lock_profile_privileged_fields();

CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  base_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.landing_pages TO authenticated;
GRANT ALL ON public.landing_pages TO service_role;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active landing pages readable" ON public.landing_pages FOR SELECT TO authenticated USING (is_active);

CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  channel text NOT NULL,
  campaign text NOT NULL DEFAULT '',
  link_code text NOT NULL UNIQUE,
  full_url text NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_links TO authenticated;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own links select" ON public.affiliate_links FOR SELECT TO authenticated USING (auth.uid() = affiliate_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code text;
BEGIN
  LOOP
    code := 'LT' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.affiliate_code = code);
  END LOOP;
  INSERT INTO public.profiles (id, full_name, phone, email, affiliate_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, ''),
    code
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_affiliate_link(
  p_landing_page_id uuid,
  p_channel text,
  p_campaign text DEFAULT ''
) RETURNS public.affiliate_links
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_page public.landing_pages;
  v_code text;
  v_url text;
  v_row public.affiliate_links;
  v_campaign text := COALESCE(NULLIF(trim(p_campaign), ''), '');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy hồ sơ cộng tác viên'; END IF;
  IF v_profile.status <> 'active' THEN RAISE EXCEPTION 'Tài khoản chưa được duyệt'; END IF;
  IF p_channel IS NULL OR trim(p_channel) = '' THEN RAISE EXCEPTION 'Vui lòng chọn kênh chia sẻ'; END IF;
  SELECT * INTO v_page FROM public.landing_pages WHERE id = p_landing_page_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Landing page không hợp lệ'; END IF;

  LOOP
    v_code := lower(substr(md5(gen_random_uuid()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_links l WHERE l.link_code = v_code);
  END LOOP;

  v_url := v_page.base_url
    || CASE WHEN position('?' in v_page.base_url) > 0 THEN '&' ELSE '?' END
    || 'ref=' || v_profile.affiliate_code
    || '&utm_source=' || trim(p_channel)
    || '&utm_medium=affiliate'
    || CASE WHEN v_campaign <> '' THEN '&utm_campaign=' || replace(v_campaign, ' ', '-') ELSE '' END
    || '&lc=' || v_code;

  INSERT INTO public.affiliate_links (affiliate_id, landing_page_id, channel, campaign, link_code, full_url)
  VALUES (v_uid, p_landing_page_id, trim(p_channel), v_campaign, v_code, v_url)
  RETURNING * INTO v_row;
  RETURN v_row;
END; $$;
REVOKE ALL ON FUNCTION public.create_affiliate_link(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_affiliate_link(uuid, text, text) TO authenticated;

INSERT INTO public.landing_pages (slug, name, description, base_url) VALUES
('son-noi-that-lotus', 'Sơn nội thất Lotus Premium', 'Sơn nội thất cao cấp, lau chùi dễ dàng, an toàn cho gia đình.', 'https://lotuspaint.vn/son-noi-that'),
('son-ngoai-that-lotus', 'Sơn ngoại thất Lotus Weather Shield', 'Chống thấm, chống nắng mưa, bền màu 10 năm.', 'https://lotuspaint.vn/son-ngoai-that'),
('son-lot-chong-kiem', 'Sơn lót chống kiềm Lotus', 'Ngăn kiềm hoá, tăng độ bám dính cho lớp sơn phủ.', 'https://lotuspaint.vn/son-lot'),
('son-chong-tham-lotus', 'Chống thấm Lotus Max', 'Giải pháp chống thấm tường, sân thượng, nhà vệ sinh.', 'https://lotuspaint.vn/chong-tham');