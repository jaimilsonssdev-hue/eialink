DROP POLICY IF EXISTS "public reads bio media" ON storage.objects;

CREATE POLICY "owners read their bio media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'bio-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "public reads published bio media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'bio-media'
  AND EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.published = true
      AND (storage.foldername(storage.objects.name))[1] = (b.user_id)::text
  )
);