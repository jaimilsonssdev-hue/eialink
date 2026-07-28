CREATE TABLE public.catalog_items (
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
CREATE INDEX catalog_items_page_position_idx ON public.catalog_items (bio_page_id, position);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages catalog items" ON public.catalog_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.user_id = auth.uid()));
CREATE POLICY "public reads active catalog items" ON public.catalog_items FOR SELECT TO anon USING (active = true AND EXISTS (SELECT 1 FROM public.bio_pages WHERE bio_pages.id = catalog_items.bio_page_id AND bio_pages.published = true));
