ALTER TABLE public.bio_pages DROP CONSTRAINT IF EXISTS bio_pages_user_id_key;
DROP INDEX IF EXISTS public.bio_pages_user_id_key;
CREATE INDEX IF NOT EXISTS bio_pages_user_updated_at_idx ON public.bio_pages (user_id, updated_at DESC);