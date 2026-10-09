-- Talento Demand Engine: private admin-only operational data.
create table if not exists public.talento_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('week','month')),
  target_diagnostics integer not null default 5,
  target_proposals integer not null default 3,
  target_sales integer not null default 1,
  target_revenue_cents integer not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, period)
);

create table if not exists public.talento_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  category text,
  city text,
  state text,
  address text,
  phone text,
  website text,
  instagram text,
  google_maps_url text,
  source text not null default 'manual',
  source_id text,
  rating numeric,
  review_count integer,
  opportunity_score integer not null default 0 check (opportunity_score between 0 and 100),
  opportunity_reason text,
  stage text not null default 'new' check (stage in ('new','qualified','contacted','replied','diagnostic','proposal','negotiation','won','lost')),
  notes text,
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, source, source_id)
);

create table if not exists public.talento_diagnostics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.talento_leads(id) on delete cascade,
  presence_score integer not null default 0,
  acquisition_score integer not null default 0,
  conversion_score integer not null default 0,
  whatsapp_score integer not null default 0,
  local_score integer not null default 0,
  retention_score integer not null default 0,
  main_bottleneck text,
  opportunity text,
  recommended_service text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talento_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  default_price_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talento_proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.talento_leads(id) on delete cascade,
  diagnostic_id uuid references public.talento_diagnostics(id) on delete set null,
  public_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  title text not null,
  objective text,
  scope text,
  deliverables text,
  deadline text,
  investment_cents integer not null default 0,
  terms text,
  valid_until date,
  status text not null default 'draft' check (status in ('draft','sent','viewed','interested','accepted','rejected','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talento_proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.talento_proposals(id) on delete cascade,
  event_type text not null check (event_type in ('viewed','interested','accepted','rejected','whatsapp')),
  created_at timestamptz not null default now()
);

create index if not exists talento_leads_owner_stage_idx on public.talento_leads(owner_id, stage);
create index if not exists talento_leads_score_idx on public.talento_leads(owner_id, opportunity_score desc);
create index if not exists talento_proposals_owner_status_idx on public.talento_proposals(owner_id, status);

alter table public.talento_goals enable row level security;
alter table public.talento_leads enable row level security;
alter table public.talento_diagnostics enable row level security;
alter table public.talento_services enable row level security;
alter table public.talento_proposals enable row level security;
alter table public.talento_proposal_events enable row level security;

create policy "admins manage talento goals" on public.talento_goals for all using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins manage talento leads" on public.talento_leads for all using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins manage talento diagnostics" on public.talento_diagnostics for all using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins manage talento services" on public.talento_services for all using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins manage talento proposals" on public.talento_proposals for all using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')) with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "admins read proposal events" on public.talento_proposal_events for select using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
create policy "public insert proposal events" on public.talento_proposal_events for insert with check (true);

-- Safe public read is handled by a server route using the random token; do not add a public table policy.
insert into public.talento_services (owner_id, name, description, default_price_cents)
select u.id, v.name, v.description, v.price
from auth.users u
cross join (values
  ('Site / Landing Page','Página estratégica focada em conversão.',120000),
  ('Aquisição Local','Estrutura para gerar descoberta e contatos locais.',150000),
  ('WhatsApp e Automação','Organização e automação do atendimento comercial.',180000),
  ('Google / SEO Local','Otimização da presença e descoberta no Google.',90000),
  ('Diagnóstico de Crescimento','Diagnóstico comercial e plano de ação.',0)
) v(name,description,price)
where exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin')
and not exists (select 1 from public.talento_services s where s.owner_id=u.id);
