-- EIA Link SaaS foundation. This migration is additive and keeps existing
-- profiles, BioLinks, roles and service requests intact.

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  whatsapp_message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS bio_page_id UUID REFERENCES public.bio_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS professional_service_id UUID REFERENCES public.professional_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'growth',
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS professional_services_active_position_idx ON public.professional_services(active, position);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs(created_at DESC);

CREATE TRIGGER plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER professional_services_updated BEFORE UPDATE ON public.professional_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (slug, name, description, price_cents, billing_interval, limits, features, position)
VALUES
  ('free', 'Grátis', 'Para publicar uma presença profissional essencial.', 0, 'monthly',
    '{"bio_pages": 1, "links": 5, "catalog_items": 3, "templates": 1}'::jsonb,
    '{"whatsapp": true, "analytics": true, "custom_domain": false}'::jsonb, 0),
  ('pro', 'Pro', 'Para negócios que precisam vender e crescer.', 2900, 'monthly',
    '{"bio_pages": 3, "links": 30, "catalog_items": 100, "templates": -1}'::jsonb,
    '{"whatsapp": true, "analytics": true, "custom_domain": true}'::jsonb, 1),
  ('catalog', 'Catálogo', 'Plano focado em uma vitrine digital completa.', 4900, 'monthly',
    '{"bio_pages": 5, "links": 50, "catalog_items": 250, "templates": -1}'::jsonb,
    '{"whatsapp": true, "analytics": true, "custom_domain": true}'::jsonb, 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.professional_services (slug, title, description, whatsapp_message, position)
VALUES
  ('site-profissional', 'Site profissional', 'Uma presença completa para fortalecer sua marca.', 'Olá! Quero conhecer a criação de site profissional.', 0),
  ('catalogo-digital', 'Catálogo digital', 'Apresente até centenas de produtos de forma organizada.', 'Olá! Quero conhecer o catálogo digital.', 1),
  ('loja-virtual', 'Loja virtual', 'Venda online com pagamentos e pedidos centralizados.', 'Olá! Quero conhecer a loja virtual.', 2),
  ('automacao-whatsapp', 'Automação WhatsApp', 'Ganhe tempo com atendimento estruturado.', 'Olá! Quero conhecer a automação de WhatsApp.', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subscriptions (user_id, plan_id, status, billing_interval)
SELECT profile.id, plan.id, 'active', 'monthly'
FROM public.profiles profile
CROSS JOIN public.plans plan
WHERE plan.slug = 'free'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.assign_free_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id, status, billing_interval)
  SELECT NEW.id, id, 'active', 'monthly' FROM public.plans WHERE slug = 'free'
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_free_subscription ON public.profiles;
CREATE TRIGGER profiles_assign_free_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_free_subscription();

GRANT SELECT ON public.plans, public.professional_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans, public.subscriptions, public.professional_services, public.admin_audit_logs TO authenticated;
GRANT ALL ON public.plans, public.subscriptions, public.professional_services, public.admin_audit_logs TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read active plans" ON public.plans
  FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage plans" ON public.plans
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "authenticated users read active services" ON public.professional_services
  FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage professional services" ON public.professional_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert audit logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());
