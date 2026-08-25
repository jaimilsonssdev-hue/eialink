-- Three compact visual choices are included in the Eialink Free plan.
UPDATE public.plans
SET limits = jsonb_set(limits, '{templates}', '3'::jsonb, true)
WHERE slug IN ('essential', 'free');

CREATE OR REPLACE FUNCTION public.enforce_bio_page_plan_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    allowed_count := COALESCE((public.current_plan_limits(auth.uid())->>'bio_pages')::integer, 1);
    IF allowed_count <> -1 AND (SELECT count(*) FROM public.bio_pages WHERE user_id = auth.uid()) >= allowed_count THEN
      RAISE EXCEPTION 'Seu plano atual permite apenas % BioLink(s). Faça upgrade para criar mais páginas.', allowed_count;
    END IF;
  END IF;

  IF ((TG_OP = 'INSERT' AND NEW.template_id IS NOT NULL
       AND NEW.template_id NOT IN ('default', 'free-showcase', 'free-social'))
      OR (TG_OP = 'UPDATE' AND NEW.template_id IS DISTINCT FROM OLD.template_id
       AND NEW.template_id NOT IN ('default', 'free-showcase', 'free-social')))
     AND COALESCE((public.current_plan_features(auth.uid())->>'premium_templates')::boolean, false) = false THEN
    RAISE EXCEPTION 'Este visual é exclusivo do Eialink Pro.';
  END IF;
  RETURN NEW;
END;
$$;

-- Keep uploaded profile and catalog media publicly readable on published pages.
UPDATE storage.buckets SET public = true WHERE id = 'bio-media';
DROP POLICY IF EXISTS "public reads bio media" ON storage.objects;
CREATE POLICY "public reads bio media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'bio-media');
