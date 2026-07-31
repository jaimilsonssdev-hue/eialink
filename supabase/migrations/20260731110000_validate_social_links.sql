-- Keep the JSON column intentionally small and predictable for all public renderers.
CREATE OR REPLACE FUNCTION public.is_valid_social_links(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    jsonb_typeof(value) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each_text(value) AS entry(key, val)
      WHERE entry.key NOT IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'website')
        OR length(entry.val) = 0
        OR length(entry.val) > 500
        OR (
          entry.key = 'instagram'
          AND entry.val !~ '^@?[A-Za-z0-9._]{1,30}$'
          AND entry.val !~ '^https://[^[:space:]]+$'
        )
        OR (
          entry.key <> 'instagram'
          AND entry.val !~ '^https://[^[:space:]]+$'
        )
    );
$$;

ALTER TABLE public.bio_pages
  DROP CONSTRAINT IF EXISTS bio_pages_social_links_shape;

ALTER TABLE public.bio_pages
  ADD CONSTRAINT bio_pages_social_links_shape
  CHECK (public.is_valid_social_links(social_links));
