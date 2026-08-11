-- Eialink freemium model. Additive: no BioLink, catalog item or profile is deleted.
-- Existing accounts are intentionally kept on Pro so the current product remains intact.

DO $$
DECLARE
  essential_id uuid;
  pro_monthly_id uuid;
BEGIN
  SELECT id INTO essential_id FROM public.plans WHERE slug IN ('free', 'essential') ORDER BY created_at LIMIT 1;
  IF essential_id IS NULL THEN
    INSERT INTO public.plans (slug, name, description, price_cents, billing_interval, limits, features, position)
    VALUES ('essential', 'Eialink Essencial', 'Para publicar sua presença profissional gratuitamente.', 0, 'monthly',
      '{"bio_pages":1,"links":4,"catalog_items":0,"templates":1}'::jsonb,
      '{"whatsapp":true,"analytics":false,"custom_domain":false,"catalog":false,"premium_templates":false,"advanced_appearance":false,"remove_branding":false}'::jsonb, 0)
    RETURNING id INTO essential_id;
  ELSE
    UPDATE public.plans
    SET slug = 'essential', name = 'Eialink Essencial',
        description = 'Para publicar sua presença profissional gratuitamente.',
        price_cents = 0, billing_interval = 'monthly', position = 0,
        limits = '{"bio_pages":1,"links":4,"catalog_items":0,"templates":1}'::jsonb,
        features = '{"whatsapp":true,"analytics":false,"custom_domain":false,"catalog":false,"premium_templates":false,"advanced_appearance":false,"remove_branding":false}'::jsonb,
        active = true
    WHERE id = essential_id;
  END IF;

  SELECT id INTO pro_monthly_id FROM public.plans WHERE slug IN ('pro', 'pro-monthly') ORDER BY created_at LIMIT 1;
  IF pro_monthly_id IS NULL THEN
    INSERT INTO public.plans (slug, name, description, price_cents, billing_interval, limits, features, position)
    VALUES ('pro-monthly', 'Eialink Pro', 'Para negócios que querem vender, medir resultados e crescer.', 1990, 'monthly',
      '{"bio_pages":-1,"links":-1,"catalog_items":-1,"templates":-1}'::jsonb,
      '{"whatsapp":true,"analytics":true,"custom_domain":true,"catalog":true,"premium_templates":true,"advanced_appearance":true,"remove_branding":true}'::jsonb, 1)
    RETURNING id INTO pro_monthly_id;
  ELSE
    UPDATE public.plans
    SET slug = 'pro-monthly', name = 'Eialink Pro',
        description = 'Para negócios que querem vender, medir resultados e crescer.',
        price_cents = 1990, billing_interval = 'monthly', position = 1,
        limits = '{"bio_pages":-1,"links":-1,"catalog_items":-1,"templates":-1}'::jsonb,
        features = '{"whatsapp":true,"analytics":true,"custom_domain":true,"catalog":true,"premium_templates":true,"advanced_appearance":true,"remove_branding":true}'::jsonb,
        active = true
    WHERE id = pro_monthly_id;
  END IF;

  INSERT INTO public.plans (slug, name, description, price_cents, billing_interval, limits, features, position)
  VALUES ('pro-yearly', 'Eialink Pro anual', 'O Eialink Pro com economia no plano anual.', 19700, 'yearly',
    '{"bio_pages":-1,"links":-1,"catalog_items":-1,"templates":-1}'::jsonb,
    '{"whatsapp":true,"analytics":true,"custom_domain":true,"catalog":true,"premium_templates":true,"advanced_appearance":true,"remove_branding":true}'::jsonb, 2)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
    billing_interval = EXCLUDED.billing_interval, limits = EXCLUDED.limits, features = EXCLUDED.features,
    active = true, position = EXCLUDED.position;

  -- Historical "Catálogo" is consolidated into Pro. It is retained only as an inactive record.
  UPDATE public.plans SET active = false, position = 99 WHERE slug = 'catalog';
  UPDATE public.subscriptions
    SET plan_id = pro_monthly_id, status = 'active', billing_interval = 'monthly', notes = COALESCE(notes, 'Migrado para Eialink Pro na adoção do modelo freemium.')
    WHERE plan_id <> essential_id;
  -- Every account that existed before this migration keeps the current product as Pro.
  UPDATE public.subscriptions
    SET plan_id = pro_monthly_id, status = 'active', billing_interval = 'monthly', notes = COALESCE(notes, 'Conta existente preservada no Eialink Pro.')
    WHERE plan_id = essential_id;
END $$;

CREATE OR REPLACE FUNCTION public.assign_free_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id, status, billing_interval)
  SELECT NEW.id, id, 'active', 'monthly' FROM public.plans WHERE slug = 'essential'
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_plan_limits(_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.limits, '{"bio_pages":1,"links":4,"catalog_items":0,"templates":1}'::jsonb)
  FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active', 'trialing')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_plan_features(_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.features, '{}'::jsonb)
  FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active', 'trialing')
  LIMIT 1;
$$;

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
  IF ((TG_OP = 'INSERT' AND NEW.template_id IS NOT NULL AND NEW.template_id <> 'default')
      OR (TG_OP = 'UPDATE' AND NEW.template_id IS DISTINCT FROM OLD.template_id AND NEW.template_id <> 'default'))
     AND COALESCE((public.current_plan_features(auth.uid())->>'premium_templates')::boolean, false) = false THEN
    RAISE EXCEPTION 'Este visual é exclusivo do Eialink Pro.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_bio_link_plan_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    allowed_count := COALESCE((public.current_plan_limits(auth.uid())->>'links')::integer, 4);
    IF allowed_count <> -1 AND (SELECT count(*) FROM public.bio_links WHERE bio_page_id = NEW.bio_page_id) >= allowed_count THEN
      RAISE EXCEPTION 'O Eialink Essencial permite até % links. Faça upgrade para adicionar mais.', allowed_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_catalog_plan_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE((public.current_plan_features(auth.uid())->>'catalog')::boolean, false) = false THEN
    RAISE EXCEPTION 'O Catálogo é um recurso do Eialink Pro.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_bio_page_plan_limit ON public.bio_pages;
CREATE TRIGGER enforce_bio_page_plan_limit BEFORE INSERT OR UPDATE OF template_id ON public.bio_pages
FOR EACH ROW EXECUTE FUNCTION public.enforce_bio_page_plan_limit();
DROP TRIGGER IF EXISTS enforce_bio_link_plan_limit ON public.bio_links;
CREATE TRIGGER enforce_bio_link_plan_limit BEFORE INSERT ON public.bio_links
FOR EACH ROW EXECUTE FUNCTION public.enforce_bio_link_plan_limit();
DROP TRIGGER IF EXISTS enforce_catalog_plan_access ON public.catalog_items;
CREATE TRIGGER enforce_catalog_plan_access BEFORE INSERT OR UPDATE ON public.catalog_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_catalog_plan_access();

COMMENT ON FUNCTION public.current_plan_limits(uuid) IS 'Freemium plan limits. Keep enforcement in the database as well as the UI.';

-- Public pages need only this yes/no capability; subscriptions themselves remain private.
CREATE OR REPLACE FUNCTION public.page_has_pro_plan(_bio_page_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((p.features->>'remove_branding')::boolean, false)
  FROM public.bio_pages b
  JOIN public.subscriptions s ON s.user_id = b.user_id
  JOIN public.plans p ON p.id = s.plan_id
  WHERE b.id = _bio_page_id AND s.status IN ('active', 'trialing')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.page_has_pro_plan(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS funnel_events_type_created_idx ON public.funnel_events(event_type, created_at DESC);
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.funnel_events TO anon, authenticated;
GRANT SELECT ON public.funnel_events TO authenticated;
CREATE POLICY "anyone may register funnel events" ON public.funnel_events FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "admins read funnel events" ON public.funnel_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
