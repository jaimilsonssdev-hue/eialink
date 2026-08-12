-- Per-page motion preferences. Existing pages retain the gentle default.
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS motion_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS motion_entrance text NOT NULL DEFAULT 'gentle',
  ADD COLUMN IF NOT EXISTS motion_cta text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS motion_ambient text NOT NULL DEFAULT 'soft';

ALTER TABLE public.bio_pages
  DROP CONSTRAINT IF EXISTS bio_pages_motion_entrance_check,
  DROP CONSTRAINT IF EXISTS bio_pages_motion_cta_check,
  DROP CONSTRAINT IF EXISTS bio_pages_motion_ambient_check;

ALTER TABLE public.bio_pages
  ADD CONSTRAINT bio_pages_motion_entrance_check
    CHECK (motion_entrance IN ('gentle', 'rise', 'none')),
  ADD CONSTRAINT bio_pages_motion_cta_check
    CHECK (motion_cta IN ('none', 'pulse', 'glow')),
  ADD CONSTRAINT bio_pages_motion_ambient_check
    CHECK (motion_ambient IN ('none', 'soft', 'spotlight'));

COMMENT ON COLUMN public.bio_pages.motion_enabled IS 'Whether presentation animations are enabled for this BioLink.';
COMMENT ON COLUMN public.bio_pages.motion_entrance IS 'Page entrance preference: gentle, rise or none.';
COMMENT ON COLUMN public.bio_pages.motion_cta IS 'Primary CTA effect: none, pulse or glow.';
COMMENT ON COLUMN public.bio_pages.motion_ambient IS 'Cover/background ambient effect: none, soft or spotlight.';
