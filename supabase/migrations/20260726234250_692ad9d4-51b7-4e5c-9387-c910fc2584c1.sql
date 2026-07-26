
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- helper updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  company_name TEXT NOT NULL,
  niche TEXT,
  city TEXT,
  state TEXT,
  instagram TEXT,
  has_website BOOLEAN DEFAULT false,
  main_goal TEXT,
  lead_score INTEGER NOT NULL DEFAULT 5,
  lgpd_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para criar role default no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ bio_pages ============
CREATE TABLE public.bio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  whatsapp TEXT,
  pix_key TEXT,
  instagram TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_pages TO authenticated;
GRANT SELECT ON public.bio_pages TO anon;
GRANT ALL ON public.bio_pages TO service_role;
ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published bio" ON public.bio_pages FOR SELECT TO anon USING (published = true);
CREATE POLICY "auth read own or published" ON public.bio_pages FOR SELECT TO authenticated USING (published = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own bio insert" ON public.bio_pages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own bio update" ON public.bio_pages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own bio delete" ON public.bio_pages FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER bio_pages_updated BEFORE UPDATE ON public.bio_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX bio_pages_slug_idx ON public.bio_pages (slug);

-- ============ bio_links ============
CREATE TABLE public.bio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_links TO authenticated;
GRANT SELECT ON public.bio_links TO anon;
GRANT ALL ON public.bio_links TO service_role;
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active links of published bio" ON public.bio_links FOR SELECT TO anon USING (
  active = true AND EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.published = true)
);
CREATE POLICY "auth read links" ON public.bio_links FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND (b.user_id = auth.uid() OR b.published = true OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "own links insert" ON public.bio_links FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())
);
CREATE POLICY "own links update" ON public.bio_links FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())
);
CREATE POLICY "own links delete" ON public.bio_links FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())
);
CREATE TRIGGER bio_links_updated BEFORE UPDATE ON public.bio_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ analytics_events ============
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_id UUID,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert event" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "owner reads events" ON public.analytics_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE INDEX analytics_events_bio_idx ON public.analytics_events (bio_page_id, created_at DESC);

-- ============ service_requests ============
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests select" ON public.service_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own requests insert" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin updates requests" ON public.service_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
