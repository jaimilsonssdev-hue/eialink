CREATE TABLE public.prospected_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  niche text,
  city text,
  state text,
  phone text,
  whatsapp text,
  email text,
  instagram text,
  website text,
  has_website boolean NOT NULL DEFAULT false,
  rating numeric,
  reviews_count integer,
  source text NOT NULL DEFAULT 'manual',
  score integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'baixa',
  status text NOT NULL DEFAULT 'novo',
  notes text,
  dedupe_key text NOT NULL,
  last_contacted_at timestamptz,
  next_action_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prospected_companies_priority_check CHECK (priority IN ('alta','media','baixa')),
  CONSTRAINT prospected_companies_status_check CHECK (status IN ('novo','contatado','respondeu','reuniao','proposta','cliente','descartado')),
  CONSTRAINT prospected_companies_score_check CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT prospected_companies_dedupe_key_unique UNIQUE (dedupe_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospected_companies TO authenticated;
GRANT ALL ON public.prospected_companies TO service_role;
ALTER TABLE public.prospected_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prospected companies"
  ON public.prospected_companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX prospected_companies_score_idx ON public.prospected_companies (score DESC);
CREATE INDEX prospected_companies_status_idx ON public.prospected_companies (status);

CREATE TRIGGER prospected_companies_updated
  BEFORE UPDATE ON public.prospected_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.prospecting_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.prospected_companies(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  outcome text NOT NULL DEFAULT 'enviado',
  message text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prospecting_activities_channel_check CHECK (channel IN ('whatsapp','instagram','email','telefone','presencial','outro')),
  CONSTRAINT prospecting_activities_outcome_check CHECK (outcome IN ('enviado','respondeu','sem_resposta','agendou','fechou','descartado'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospecting_activities TO authenticated;
GRANT ALL ON public.prospecting_activities TO service_role;
ALTER TABLE public.prospecting_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prospecting activities"
  ON public.prospecting_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX prospecting_activities_company_idx ON public.prospecting_activities (company_id, created_at DESC);