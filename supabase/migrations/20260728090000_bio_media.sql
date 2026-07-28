ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_position TEXT NOT NULL DEFAULT 'center' CHECK (cover_position IN ('top', 'center', 'bottom')),
  ADD COLUMN IF NOT EXISTS cover_fit TEXT NOT NULL DEFAULT 'cover' CHECK (cover_fit IN ('cover', 'contain')),
  ADD COLUMN IF NOT EXISTS cover_overlay BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cover_overlay_opacity INTEGER NOT NULL DEFAULT 45 CHECK (cover_overlay_opacity BETWEEN 0 AND 100);

INSERT INTO storage.buckets (id, name, public)
VALUES ('bio-media', 'bio-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users upload their bio media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update their bio media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete their bio media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "public reads bio media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bio-media');
