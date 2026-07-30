-- A message belongs to a specific BioLink, never to the visitor.
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;

ALTER TABLE public.bio_pages
  ADD CONSTRAINT bio_pages_whatsapp_message_length
  CHECK (whatsapp_message IS NULL OR char_length(whatsapp_message) <= 1000);
