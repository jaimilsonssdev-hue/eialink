-- The free Eialink is a compact link page with a small catalog.
UPDATE public.plans
SET limits = jsonb_set(limits, '{catalog_items}', '3'::jsonb, true),
    features = jsonb_set(features, '{catalog}', 'true'::jsonb, true),
    description = 'Link simples para reunir contatos, redes e até 3 produtos ou serviços.'
WHERE slug IN ('essential', 'free');

CREATE OR REPLACE FUNCTION public.enforce_catalog_plan_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  allowed_count integer;
BEGIN
  IF COALESCE((public.current_plan_features(auth.uid())->>'catalog')::boolean, false) = false THEN
    RAISE EXCEPTION 'O Catálogo não está disponível no seu plano atual.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    allowed_count := COALESCE((public.current_plan_limits(auth.uid())->>'catalog_items')::integer, 0);
    IF allowed_count <> -1
       AND (SELECT count(*) FROM public.catalog_items WHERE bio_page_id = NEW.bio_page_id) >= allowed_count THEN
      RAISE EXCEPTION 'Seu plano permite até % produtos ou serviços. Faça upgrade para adicionar mais.', allowed_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_catalog_plan_access() IS
  'Enforces catalog availability and per-plan item limits without deleting saved items.';
