create or replace function public.get_talento_public_proposal(p_token text)
returns table (
  proposal_id uuid,
  company_name text,
  title text,
  objective text,
  scope text,
  deliverables text,
  deadline text,
  investment_cents integer,
  terms text,
  valid_until date,
  status text
)
language sql
security definer
set search_path = public
as $$
  select p.id, l.company_name, p.title, p.objective, p.scope, p.deliverables,
         p.deadline, p.investment_cents, p.terms, p.valid_until, p.status
  from public.talento_proposals p
  join public.talento_leads l on l.id = p.lead_id
  where p.public_token = p_token
  limit 1;
$$;
revoke all on function public.get_talento_public_proposal(text) from public;
grant execute on function public.get_talento_public_proposal(text) to anon, authenticated;
