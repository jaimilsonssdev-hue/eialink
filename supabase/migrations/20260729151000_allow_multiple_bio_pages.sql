-- A user can own multiple biolinks. Ownership continues to be enforced by RLS.
-- Slugs remain globally unique; only the one-page-per-user legacy constraint is removed.
ALTER TABLE public.bio_pages
  DROP CONSTRAINT IF EXISTS bio_pages_user_id_key;

DROP INDEX IF EXISTS public.bio_pages_user_id_key;

CREATE INDEX IF NOT EXISTS bio_pages_user_updated_at_idx
  ON public.bio_pages (user_id, updated_at DESC);
