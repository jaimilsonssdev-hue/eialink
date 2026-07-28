-- page_blocks
CREATE TABLE IF NOT EXISTS public.page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_blocks_page_position_idx ON public.page_blocks (bio_page_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_blocks TO authenticated;
GRANT SELECT ON public.page_blocks TO anon;
GRANT ALL ON public.page_blocks TO service_role;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public reads enabled blocks" ON public.page_blocks;
CREATE POLICY "public reads enabled blocks" ON public.page_blocks FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.published));
DROP POLICY IF EXISTS "owners read blocks" ON public.page_blocks;
CREATE POLICY "owners read blocks" ON public.page_blocks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND (b.user_id = auth.uid() OR b.published OR public.has_role(auth.uid(), 'admin'))));
DROP POLICY IF EXISTS "owners insert blocks" ON public.page_blocks;
CREATE POLICY "owners insert blocks" ON public.page_blocks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
DROP POLICY IF EXISTS "owners update blocks" ON public.page_blocks;
CREATE POLICY "owners update blocks" ON public.page_blocks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
DROP POLICY IF EXISTS "owners delete blocks" ON public.page_blocks;
CREATE POLICY "owners delete blocks" ON public.page_blocks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
DROP TRIGGER IF EXISTS page_blocks_updated ON public.page_blocks;
CREATE TRIGGER page_blocks_updated BEFORE UPDATE ON public.page_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- bio_pages cover + template fields
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_position TEXT NOT NULL DEFAULT 'center' CHECK (cover_position IN ('top', 'center', 'bottom')),
  ADD COLUMN IF NOT EXISTS cover_fit TEXT NOT NULL DEFAULT 'cover' CHECK (cover_fit IN ('cover', 'contain')),
  ADD COLUMN IF NOT EXISTS cover_overlay BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cover_overlay_opacity INTEGER NOT NULL DEFAULT 45 CHECK (cover_overlay_opacity BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS template_id TEXT;

-- storage.objects policies for bio-media bucket
DROP POLICY IF EXISTS "users upload their bio media" ON storage.objects;
CREATE POLICY "users upload their bio media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "users update their bio media" ON storage.objects;
CREATE POLICY "users update their bio media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "users delete their bio media" ON storage.objects;
CREATE POLICY "users delete their bio media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "public reads bio media" ON storage.objects;
CREATE POLICY "public reads bio media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bio-media');

-- catalog_items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  image_url TEXT,
  button_label TEXT NOT NULL DEFAULT 'Saiba mais',
  button_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_items_page_position_idx ON public.catalog_items (bio_page_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT SELECT ON public.catalog_items TO anon;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages catalog items" ON public.catalog_items;
CREATE POLICY "owner manages catalog items" ON public.catalog_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.user_id = auth.uid()));
DROP POLICY IF EXISTS "public reads active catalog items" ON public.catalog_items;
CREATE POLICY "public reads active catalog items" ON public.catalog_items FOR SELECT TO anon USING (active = true AND EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.published = true));
DROP TRIGGER IF EXISTS catalog_items_updated ON public.catalog_items;
CREATE TRIGGER catalog_items_updated BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';