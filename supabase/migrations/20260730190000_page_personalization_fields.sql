-- Page-level customization used by the unified visual editor.
-- Existing rows keep their current public rendering through NULL fallbacks.
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS whatsapp_button_label text,
  ADD COLUMN IF NOT EXISTS whatsapp_button_subtitle text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bio_pages.whatsapp_button_label IS
  'Optional visitor-facing label for the primary WhatsApp action.';
COMMENT ON COLUMN public.bio_pages.whatsapp_button_subtitle IS
  'Optional supporting copy for the primary WhatsApp action.';
COMMENT ON COLUMN public.bio_pages.social_links IS
  'Optional social profile URLs keyed by network; legacy instagram remains supported.';
