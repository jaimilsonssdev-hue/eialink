CREATE TABLE public.page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX page_blocks_page_position_idx ON public.page_blocks (bio_page_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_blocks TO authenticated;
GRANT SELECT ON public.page_blocks TO anon;
GRANT ALL ON public.page_blocks TO service_role;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads enabled blocks" ON public.page_blocks FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.published));
CREATE POLICY "owners read blocks" ON public.page_blocks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND (b.user_id = auth.uid() OR b.published OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "owners insert blocks" ON public.page_blocks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
CREATE POLICY "owners update blocks" ON public.page_blocks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
CREATE POLICY "owners delete blocks" ON public.page_blocks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.bio_pages b WHERE b.id = bio_page_id AND b.user_id = auth.uid()));
CREATE TRIGGER page_blocks_updated BEFORE UPDATE ON public.page_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
