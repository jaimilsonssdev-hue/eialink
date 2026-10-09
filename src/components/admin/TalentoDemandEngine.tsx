import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Building2, ClipboardCheck, FileText, Flame, Plus, Search, Target, Trash2 } from "lucide-react";

type Lead = {
  id: string; company_name: string; category: string | null; city: string | null; state: string | null;
  phone: string | null; website: string | null; instagram: string | null; rating: number | null;
  review_count: number | null; opportunity_score: number; opportunity_reason: string | null;
  stage: string; notes: string | null; next_action: string | null; next_action_at: string | null;
};

const stages = [
  ["new", "Novo"], ["qualified", "Qualificado"], ["contacted", "Contatado"], ["replied", "Respondeu"],
  ["diagnostic", "Diagnóstico"], ["proposal", "Proposta"], ["negotiation", "Negociação"], ["won", "Ganho"], ["lost", "Perdido"],
];
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const scoreReason = (x: { website?: string | null; phone?: string | null; rating?: number | null; review_count?: number | null }) => {
  let score = 45; const reasons: string[] = [];
  if (!x.website) { score += 22; reasons.push("sem site identificado"); }
  if (x.phone) { score += 10; reasons.push("telefone disponível"); }
  if ((x.rating ?? 0) >= 4) { score += 8; reasons.push("boa avaliação"); }
  if ((x.review_count ?? 0) > 20) { score += 8; reasons.push("negócio com avaliações"); }
  return { score: Math.min(100, score), reason: reasons.length ? reasons.join(" • ") : "sinais comerciais ainda insuficientes" };
};

export function TalentoDemandEngine() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "prospect" | "diagnostic" | "proposal">("overview");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [diagnostic, setDiagnostic] = useState({ presence: 5, acquisition: 5, conversion: 5, whatsapp: 5, local: 5, retention: 5, notes: "" });
  const [proposal, setProposal] = useState({ title: "", objective: "", scope: "", deliverables: "", deadline: "", investment: "", terms: "", valid_until: "" });

  const leads = useQuery({ queryKey: ["talento-leads"], queryFn: async () => {
    const { data, error } = await supabase.from("talento_leads").select("*").order("opportunity_score", { ascending: false });
    if (error) throw error; return (data ?? []) as Lead[];
  }});
  const diagnostics = useQuery({ queryKey: ["talento-diagnostics"], queryFn: async () => {
    const { data, error } = await supabase.from("talento_diagnostics").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  }});
  const proposals = useQuery({ queryKey: ["talento-proposals"], queryFn: async () => {
    const { data, error } = await supabase.from("talento_proposals").select("*, talento_leads(company_name)").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  }});

  const upsertLead = useMutation({ mutationFn: async (lead: Partial<Lead> & { company_name: string }) => {
    const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Sessão expirada");
    const { data, error } = await supabase.from("talento_leads").insert({ ...lead, owner_id: u.user.id }).select().single();
    if (error) throw error; return data;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["talento-leads"] }) });
  const updateLead = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
    const { error } = await supabase.from("talento_leads").update(patch).eq("id", id); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["talento-leads"] }) });
  const saveDiagnostic = useMutation({ mutationFn: async () => {
    if (!selected) throw new Error("Selecione uma empresa");
    const scores = [diagnostic.presence, diagnostic.acquisition, diagnostic.conversion, diagnostic.whatsapp, diagnostic.local, diagnostic.retention];
    const labels = ["Presença Digital", "Aquisição", "Conversão", "WhatsApp/Atendimento", "Google/Local", "Recorrência"];
    const lowest = scores.indexOf(Math.min(...scores));
    const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Sessão expirada");
    const payload = { owner_id: u.user.id, lead_id: selected.id, presence_score: diagnostic.presence, acquisition_score: diagnostic.acquisition, conversion_score: diagnostic.conversion, whatsapp_score: diagnostic.whatsapp, local_score: diagnostic.local, retention_score: diagnostic.retention, main_bottleneck: labels[lowest], opportunity: `Corrigir o gargalo de ${labels[lowest].toLowerCase()} e transformar a atenção existente em oportunidade comercial.`, recommended_service: labels[lowest] === "Google/Local" ? "Google / SEO Local" : labels[lowest] === "WhatsApp/Atendimento" ? "WhatsApp e Automação" : labels[lowest] === "Aquisição" ? "Aquisição Local" : "Site / Landing Page", notes: diagnostic.notes };
    const { data, error } = await supabase.from("talento_diagnostics").insert(payload).select().single(); if (error) throw error;
    await supabase.from("talento_leads").update({ stage: "diagnostic", next_action: "Preparar proposta", next_action_at: new Date().toISOString() }).eq("id", selected.id);
    return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["talento-diagnostics"] }); qc.invalidateQueries({ queryKey: ["talento-leads"] }); setTab("proposal"); } });
  const saveProposal = useMutation({ mutationFn: async () => {
    if (!selected) throw new Error("Selecione uma empresa");
    const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Sessão expirada");
    const cents = Math.max(0, Math.round(Number(proposal.investment.replace(",", ".")) * 100) || 0);
    const { data, error } = await supabase.from("talento_proposals").insert({ owner_id: u.user.id, lead_id: selected.id, title: proposal.title || `Proposta — ${selected.company_name}`, objective: proposal.objective, scope: proposal.scope, deliverables: proposal.deliverables, deadline: proposal.deadline, investment_cents: cents, terms: proposal.terms, valid_until: proposal.valid_until || null, status: "sent" }).select().single();
    if (error) throw error;
    await supabase.from("talento_leads").update({ stage: "proposal", next_action: "Fazer follow-up da proposta", next_action_at: new Date(Date.now() + 3 * 86400000).toISOString() }).eq("id", selected.id);
    return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["talento-proposals"] }); qc.invalidateQueries({ queryKey: ["talento-leads"] }); setTab("overview"); } });

  const attack = useMemo(() => (leads.data ?? []).filter(x => !["won", "lost"].includes(x.stage)).slice(0, 10), [leads.data]);
  const metrics = useMemo(() => {
    const all = leads.data ?? []; const count = (s: string) => all.filter(x => x.stage === s).length;
    return { total: all.length, contacted: count("contacted") + count("replied") + count("diagnostic") + count("proposal") + count("negotiation") + count("won"), diagnostics: count("diagnostic") + (diagnostics.data?.length ?? 0), proposals: count("proposal") + (proposals.data?.length ?? 0), won: count("won") };
  }, [leads.data, diagnostics.data, proposals.data]);

  async function addManual() {
    if (!query.trim()) return;
    const s = scoreReason({}); await upsertLead.mutateAsync({ company_name: query.trim(), city: city || null, opportunity_score: s.score, opportunity_reason: s.reason, stage: "new" });
    setQuery("");
  }

  async function searchGoogle() {
    // Provider intentionally server-side. Until a Places key is configured, give a safe manual fallback.
    if (!query.trim()) return;
    const s = scoreReason({});
    await upsertLead.mutateAsync({ company_name: query.trim(), category: "Busca manual", city: city || null, source: "manual-search", opportunity_score: s.score, opportunity_reason: "Pesquisa criada como ponto de partida; conecte Google Places no servidor para resultados automáticos." , stage: "new" });
    setQuery("");
  }

  const tabs = [["overview", "Visão geral", BarChart3], ["prospect", "Prospecção", Search], ["diagnostic", "Diagnóstico", ClipboardCheck], ["proposal", "Propostas", FileText]] as const;
  return <section className="mt-8 space-y-5">
    <div className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated to-background p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Talento Demand Engine</p><h2 className="mt-1 text-2xl font-bold">Transforme foco em demanda.</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Encontre empresas, priorize oportunidades, diagnostique gargalos e gere propostas sem sair do admin.</p></div>
        <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--accent)]/10 px-3 py-2 text-sm font-semibold"><Target className="h-4 w-4"/> Gargalo: {metrics.total === 0 ? "começar prospecção" : metrics.contacted < Math.max(5, metrics.total / 2) ? "gerar conversas" : metrics.proposals === 0 ? "gerar propostas" : "fechar"}</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "btn-primary" : "btn-secondary"}><Icon className="h-4 w-4"/>{label}</button>)}</div>
    </div>

    {tab === "overview" && <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Empresas" value={metrics.total}/><Metric label="Abordadas" value={metrics.contacted}/><Metric label="Diagnósticos" value={metrics.diagnostics}/><Metric label="Propostas" value={metrics.proposals}/><Metric label="Vendas" value={metrics.won}/>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="🔥 Ataque de hoje" subtitle="As oportunidades com maior score primeiro.">{attack.length ? attack.map(x => <LeadRow key={x.id} lead={x} onOpen={() => { setSelected(x); setTab("diagnostic"); }} onStage={stage => updateLead.mutate({ id: x.id, patch: { stage } })}/>) : <Empty text="Comece uma busca e adicione suas primeiras empresas."/>}</Panel>
        <Panel title="🎯 Próxima ação" subtitle="Uma operação simples vence um CRM cheio."><div className="space-y-3 text-sm"><Action n="1" t="Encontrar 10 empresas" done={metrics.total >= 10}/><Action n="2" t="Abordar 5 empresas" done={metrics.contacted >= 5}/><Action n="3" t="Fazer 1 diagnóstico" done={metrics.diagnostics >= 1}/><Action n="4" t="Enviar 1 proposta" done={metrics.proposals >= 1}/></div></Panel>
      </div>
    </>}

    {tab === "prospect" && <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Panel title="🔎 Radar de prospecção" subtitle="Comece simples. O conector Google fica pronto para ativação server-side.">
        <label className="text-xs text-muted-foreground">Empresa, segmento ou busca<input className="input-base mt-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: clínicas odontológicas"/></label>
        <label className="mt-3 block text-xs text-muted-foreground">Cidade<input className="input-base mt-1" value={city} onChange={e => setCity(e.target.value)} placeholder="Teixeira de Freitas"/></label>
        <div className="mt-4 grid gap-2"><button className="btn-primary" onClick={searchGoogle} disabled={upsertLead.isPending}><Search className="h-4 w-4"/> Criar oportunidade de busca</button><button className="btn-secondary" onClick={addManual}><Plus className="h-4 w-4"/> Adicionar empresa manualmente</button></div>
        <p className="mt-3 text-xs text-muted-foreground">Não fazemos scraping de Instagram. O perfil pode ser adicionado no diagnóstico e uma integração oficial pode ser ligada depois.</p>
      </Panel>
      <Panel title="Lista de prospecção" subtitle={`${leads.data?.length ?? 0} empresas no radar`}>
        <div className="space-y-2">{(leads.data ?? []).map(x => <LeadRow key={x.id} lead={x} onOpen={() => { setSelected(x); setTab("diagnostic"); }} onStage={stage => updateLead.mutate({ id: x.id, patch: { stage } })}/>)}</div>
      </Panel>
    </div>}

    {tab === "diagnostic" && <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <Panel title="🩺 Selecionar empresa" subtitle="O diagnóstico existe para descobrir o problema antes de vender.">{(leads.data ?? []).slice(0, 20).map(x => <button key={x.id} onClick={() => setSelected(x)} className={`mb-2 flex w-full items-center justify-between rounded-xl border p-3 text-left ${selected?.id === x.id ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-border"}`}><span className="font-medium">{x.company_name}</span><span className="text-xs font-bold">{x.opportunity_score}</span></button>)}</Panel>
      <Panel title={selected ? `Diagnóstico — ${selected.company_name}` : "Diagnóstico"} subtitle="Dê uma nota de 0 a 10 e deixe o sistema destacar o menor índice.">{selected ? <><div className="grid gap-3 sm:grid-cols-2">{([["presence","Presença Digital"],["acquisition","Aquisição"],["conversion","Oferta / Conversão"],["whatsapp","WhatsApp / Atendimento"],["local","Google / Local"],["retention","Recorrência"]] as const).map(([k,l]) => <label key={k} className="text-xs text-muted-foreground">{l}<input type="range" min="0" max="10" value={diagnostic[k]} onChange={e => setDiagnostic(d => ({...d,[k]: Number(e.target.value)}))} className="mt-2 w-full"/><span className="text-sm font-bold text-foreground">{diagnostic[k]}/10</span></label>)}</div><textarea className="input-base mt-4 min-h-24" value={diagnostic.notes} onChange={e => setDiagnostic(d => ({...d,notes:e.target.value}))} placeholder="Observações e evidências encontradas..."/><button className="btn-primary mt-4 w-full" onClick={() => saveDiagnostic.mutate()} disabled={saveDiagnostic.isPending}>{saveDiagnostic.isPending ? "Salvando…" : "Salvar diagnóstico e preparar proposta"}</button></> : <Empty text="Escolha uma empresa à esquerda."/>}</Panel>
    </div>}

    {tab === "proposal" && <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Panel title="📑 Nova proposta" subtitle={selected ? `Para ${selected.company_name}` : "Selecione uma empresa no diagnóstico"}>{selected ? <div className="space-y-3">{([['title','Título'],['objective','Objetivo'],['scope','Escopo'],['deliverables','Entregáveis'],['deadline','Prazo'],['investment','Investimento (R$)'],['terms','Condições'],['valid_until','Validade']] as const).map(([k,l]) => <label key={k} className="block text-xs text-muted-foreground">{l}{k === 'valid_until' ? <input className="input-base mt-1" type="date" value={proposal[k]} onChange={e => setProposal(p=>({...p,[k]:e.target.value}))}/> : <input className="input-base mt-1" value={proposal[k]} onChange={e => setProposal(p=>({...p,[k]:e.target.value}))}/>}</label>)}<button className="btn-primary w-full" onClick={() => saveProposal.mutate()} disabled={saveProposal.isPending}>{saveProposal.isPending ? "Enviando…" : "Gerar e registrar proposta"}</button></div> : <Empty text="Volte ao diagnóstico e escolha uma empresa."/>}</Panel>
      <Panel title="Propostas recentes" subtitle="Acompanhe o dinheiro que saiu do diagnóstico.">{(proposals.data ?? []).map((p: any) => <div key={p.id} className="mb-2 flex items-center justify-between rounded-xl border border-border p-3"><div><div className="font-medium">{p.title}</div><div className="text-xs text-muted-foreground">{p.talento_leads?.company_name ?? "Empresa"} • {money(p.investment_cents)}</div></div><span className="rounded-full bg-[color:var(--accent)]/10 px-2 py-1 text-xs font-semibold">{p.status}</span></div>)}</Panel>
    </div>}
    {(leads.error || diagnostics.error || proposals.error || saveDiagnostic.error || saveProposal.error) && <p className="text-sm text-red-500">{String((leads.error || diagnostics.error || proposals.error || saveDiagnostic.error || saveProposal.error)?.message ?? "Erro")}</p>}
  </section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="card-surface"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></div>; }
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <section className="card-surface"><div className="mb-4"><h3 className="font-bold">{title}</h3>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{children}</section>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>; }
function Action({ n, t, done }: { n: string; t: string; done: boolean }) { return <div className="flex items-center gap-3 rounded-xl border border-border p-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[color:var(--success)]/20 text-[color:var(--success)]" : "bg-surface-elevated"}`}>{done ? "✓" : n}</span><span className={done ? "line-through text-muted-foreground" : ""}>{t}</span></div>; }
function LeadRow({ lead, onOpen, onStage }: { lead: Lead; onOpen: () => void; onStage: (stage: string) => void }) { return <div className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={onOpen} className="min-w-0 text-left"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 shrink-0 text-[color:var(--accent)]"/><span className="truncate font-semibold">{lead.company_name}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${lead.opportunity_score >= 80 ? "bg-red-500/10 text-red-500" : lead.opportunity_score >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-surface-elevated text-muted-foreground"}`}>{lead.opportunity_score}</span></div><div className="mt-1 text-xs text-muted-foreground">{[lead.category,lead.city,lead.phone].filter(Boolean).join(" • ")}</div><div className="mt-1 text-[11px] text-muted-foreground">{lead.opportunity_reason}</div></button><div className="flex items-center gap-2"><select className="input-base py-2 text-xs" value={lead.stage} onChange={e=>onStage(e.target.value)}>{stages.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button className="btn-secondary p-2" onClick={onOpen} title="Diagnóstico"><ClipboardCheck className="h-4 w-4"/></button></div></div>; }
