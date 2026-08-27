import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/proposta/$token")({ component: ProposalPage });

type Proposal = { proposal_id: string; company_name: string; title: string; objective: string | null; scope: string | null; deliverables: string | null; deadline: string | null; investment_cents: number; terms: string | null; valid_until: string | null; status: string };

function ProposalPage() {
  const { token } = Route.useParams();
  const { data, isLoading } = Route.useLoaderData();
  const proposal = (data ?? null) as Proposal | null;
  useEffect(() => { if (proposal) void supabase.from("talento_proposal_events").insert({ proposal_id: proposal.proposal_id, event_type: "viewed" }); }, [proposal]);
  if (isLoading) return <main className="min-h-screen grid place-items-center p-6">Carregando proposta…</main>;
  if (!proposal) return <main className="min-h-screen grid place-items-center p-6"><div className="card-surface max-w-lg text-center"><h1 className="text-xl font-bold">Proposta não encontrada</h1><p className="mt-2 text-sm text-muted-foreground">O link pode estar inválido ou a proposta não está mais disponível.</p></div></main>;
  const whatsapp = "";
  return <main className="min-h-screen bg-background px-4 py-10"><article className="mx-auto max-w-3xl card-surface space-y-7"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Proposta comercial</p><h1 className="mt-2 text-3xl font-bold">{proposal.title}</h1><p className="mt-1 text-muted-foreground">Preparada para {proposal.company_name}</p></div><Block title="Objetivo" text={proposal.objective}/><Block title="Escopo" text={proposal.scope}/><Block title="Entregáveis" text={proposal.deliverables}/><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-surface-elevated p-4"><div className="text-xs text-muted-foreground">Investimento</div><div className="mt-1 text-2xl font-bold">{(proposal.investment_cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div></div><div className="rounded-2xl bg-surface-elevated p-4"><div className="text-xs text-muted-foreground">Prazo</div><div className="mt-1 font-semibold">{proposal.deadline || "A combinar"}</div></div></div>{proposal.terms && <Block title="Condições" text={proposal.terms}/>} {proposal.valid_until && <p className="text-xs text-muted-foreground">Validade: {new Date(proposal.valid_until+"T12:00:00").toLocaleDateString("pt-BR")}</p>}<div className="flex flex-wrap gap-3 border-t border-border pt-5"><a href={whatsapp || "#"} onClick={e=>{ if(!whatsapp) e.preventDefault(); }} className="btn-primary"><MessageCircle className="h-4 w-4"/> Tenho interesse / falar no WhatsApp</a><span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4"/> Proposta digital</span></div></article></main>;
}

function Block({ title, text }: { title: string; text: string | null }) { if (!text) return null; return <section><h2 className="font-semibold">{title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{text}</p></section>; }

export const loader = async ({ params }: { params: { token: string } }) => {
  const { data, error } = await supabase.rpc("get_talento_public_proposal", { p_token: params.token });
  if (error) throw error;
  return { data: data?.[0] ?? null };
};
