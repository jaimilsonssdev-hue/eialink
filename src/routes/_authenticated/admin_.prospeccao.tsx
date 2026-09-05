import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar,
  Upload,
  Flame,
  ArrowLeft,
  MessageCircle,
  Trash2,
  Pencil,
  Plus,

  Check,
  CheckCircle,
  CheckCircle2,
  UserCheck,
  Share2,
  Search,
  Sparkles,
  Globe2,
  ExternalLink,
  Loader2,
  Instagram,
  RotateCcw,
  X,
  Copy,
} from "lucide-react";

import { runLiveProspecting } from "@/modules/prospecting/prospecting.functions";
import { searchGoogleMapsAndInstagram } from "@/modules/prospecting/LiveProspectingEngine";
import { PageService } from "@/modules/page/services/PageService";
import { TransferPageModal } from "@/components/prospecting/TransferPageModal";
import { NICHE_PRESETS_VARIANTS, detectNicheKey } from "@/modules/prospecting/nichePresets";

import { ProspectingService } from "@/modules/prospecting/ProspectingService";

import { buildPreview, type CsvRowPreview } from "@/modules/prospecting/csv";
import {
  buildDedupeKey,
  normalizeName,
  normalizePhone,
  normalizeText,
  normalizeWebsite,
  priorityFromScore,
  scoreCompany,
} from "@/modules/prospecting/scoring";
import {
  CHANNEL_LABEL,
  OUTCOME_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type ProspectChannel,
  type ProspectOutcome,
  type ProspectPriority,
  type ProspectStatus,
  type ProspectedCompany,
  type ProspectDraft,
} from "@/modules/prospecting/types";


export const Route = createFileRoute("/_authenticated/admin_/prospeccao")({
  head: () => ({
    meta: [
      { title: "Radar de Prospecção — EIA Digital" },
      {
        name: "description",
        content:
          "Motor interno de demanda: importe listas, priorize empresas por score e registre abordagens.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const isOwner = u.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
    if (isOwner) return;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },


  component: ProspectingPage,
});

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as ProspectStatus[];
const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABEL) as ProspectChannel[];
const OUTCOME_OPTIONS = Object.keys(OUTCOME_LABEL) as ProspectOutcome[];

const PRIORITY_STYLE: Record<ProspectPriority, string> = {
  alta: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
  media: "bg-[color:var(--primary)]/15 text-[color:var(--primary)]",
  baixa: "bg-surface-elevated text-muted-foreground",
};

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function whatsappLink(company: ProspectedCompany) {
  const phone = company.whatsapp ?? company.phone;
  if (!phone) return null;
  const matchDemo = company.notes?.match(/https?:\/\/[^\s]+/);
  const demoUrl = matchDemo ? matchDemo[0] : null;

  const text = demoUrl
    ? `Olá, ${company.name}! Aqui é da EIA Link. Montei uma sugestão exclusiva de presença digital para vocês no ar: ${demoUrl} . Posso te mostrar como funciona para receber agendamentos direto no WhatsApp?`
    : `Olá, ${company.name}! Aqui é da EIA Link. Vi que a empresa ainda não tem uma página profissional na internet e preparei uma sugestão gratuita de presença digital para vocês. Posso te mostrar?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function cleanInstagramHandle(ig?: string | null): string | null {
  if (!ig) return null;
  const cleaned = ig
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/$/, "")
    .trim();
  return cleaned || null;
}

function buildInstagramPitch(company: ProspectedCompany) {
  const matchDemo = company.notes?.match(/https?:\/\/[^\s]+/);
  const demoUrl = matchDemo ? matchDemo[0] : null;

  return demoUrl
    ? `Olá, ${company.name}! 👋 Vi o perfil de vocês no Instagram. Montei uma sugestão exclusiva de presença digital oficial para vocês no ar: ${demoUrl} . Posso te mostrar como funciona para receber agendamentos direto no WhatsApp e no Direct?`
    : `Olá, ${company.name}! 👋 Vi o perfil de vocês no Instagram. Vi que a empresa ainda não tem um site ou biolink oficial e preparei uma sugestão gratuita de presença digital para vocês. Posso te mostrar?`;
}

function ProspectingPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ProspectStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | ProspectPriority>("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<CsvRowPreview[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<ProspectedCompany | null>(null);
  const [copiedInstagramCompanyId, setCopiedInstagramCompanyId] = useState<string | null>(null);

  // Estados da Varredura Automática (Google Maps + Instagram)
  const [searchNiche, setSearchNiche] = useState("Clínica");
  const [searchCity, setSearchCity] = useState("Teixeira de Freitas, BA");
  const [isSearching, setIsSearching] = useState(false);
  const [liveResults, setLiveResults] = useState<ProspectDraft[]>([]);
  const [selectedLiveIndices, setSelectedLiveIndices] = useState<Set<number>>(new Set());

  const [creatingPageId, setCreatingPageId] = useState<string | null>(null);
  const [regeneratingPageId, setRegeneratingPageId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [instaModalCompany, setInstaModalCompany] = useState<ProspectedCompany | null>(null);
  const [whatsModalCompany, setWhatsModalCompany] = useState<ProspectedCompany | null>(null);
  const [transferModalData, setTransferModalData] = useState<{
    isOpen: boolean;
    page: {
      id: string;
      displayName: string;
      slug: string;
      phone?: string | null;
      email?: string | null;
      instagram?: string | null;
      isDemo?: boolean;
    };
  } | null>(null);


  const companiesQuery = useQuery({
    queryKey: ["prospecting", "companies"],
    queryFn: ProspectingService.list,
  });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["prospecting", "companies"] });

  const importMutation = useMutation({
    mutationFn: (drafts: Parameters<typeof ProspectingService.importMany>[0]) =>
      ProspectingService.importMany(drafts),
    onSuccess: ({ inserted }) => {
      setFeedback(`${inserted} empresa(s) importada(s) com sucesso.`);
      setPreview(null);
      invalidate();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProspectStatus }) =>
      ProspectingService.updateStatus(id, status),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => ProspectingService.remove(id),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: ProspectingService.create,
    onSuccess: () => {
      setFeedback("Empresa adicionada ao radar.");
      invalidate();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchStatus = statusFilter === "all" || company.status === statusFilter;
      const matchPriority = priorityFilter === "all" || company.priority === priorityFilter;
      const matchTerm =
        !term ||
        [company.name, company.niche, company.city, company.whatsapp]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchStatus && matchPriority && matchTerm;
    });
  }, [companies, priorityFilter, search, statusFilter]);

  const metrics = useMemo(() => {
    const untouched = companies.filter((item) => item.status === "novo");
    return {
      total: companies.length,
      high: companies.filter((item) => item.priority === "alta").length,
      untouched: untouched.length,
      answered: companies.filter((item) =>
        ["respondeu", "reuniao", "proposta", "cliente"].includes(item.status),
      ).length,
      clients: companies.filter((item) => item.status === "cliente").length,
      todayDone: companies.filter((item) => isToday(item.last_contacted_at)).length,
    };
  }, [companies]);

  const attackList = useMemo(
    () =>
      companies
        .filter(
          (item) =>
            ["novo", "contatado", "respondeu"].includes(item.status) &&
            !isToday(item.last_contacted_at),
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    [companies],
  );

  async function handleFile(file: File) {
    setFeedback(null);
    const content = await file.text();
    const keys = await ProspectingService.listDedupeKeys();
    setPreview(buildPreview(content, keys));
  }

  const importable = (preview ?? []).filter((row) => row.draft && !row.duplicateOf);

  async function handleLiveSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!searchNiche.trim() || !searchCity.trim()) return;
    setIsSearching(true);
    setFeedback(null);
    try {
      let results: ProspectDraft[] = [];
      try {
        // Tentativa 1: Execução direta no cliente (super rápida, sem intermediação de servidor)
        results = await searchGoogleMapsAndInstagram(searchNiche.trim(), searchCity.trim(), 15);
      } catch (clientErr) {
        console.warn("[Prospecção] Execução direta no cliente falhou, tentando via servidor:", clientErr);
        // Tentativa 2: Fallback para RPC do servidor caso o navegador bloqueie por adblocker
        results = await runLiveProspecting({
          data: { niche: searchNiche.trim(), city: searchCity.trim(), limit: 15 },
        });
      }

      setLiveResults(results);
      setSelectedLiveIndices(new Set(results.map((_, i) => i)));
      if (results.length === 0) {
        setFeedback(
          "Nenhuma empresa encontrada com esses termos. Verifique se digitou o nicho comum (ex: Dentista, Clínica, Barbearia) e o nome da cidade.",
        );
      } else {
        setFeedback(`Varredura concluída! ${results.length} empresa(s) localizada(s) em tempo real.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao realizar a varredura.";
      setFeedback(message);
    } finally {
      setIsSearching(false);
    }
  }


  function handleImportLive() {
    if (!liveResults || !liveResults.length) return;
    const selected = liveResults.filter((_, i) => selectedLiveIndices.has(i));
    if (!selected.length) return;
    importMutation.mutate(selected);
    setLiveResults([]);
  }

  async function handleGenerateDemo(company: ProspectedCompany) {
    setCreatingPageId(company.id);
    setFeedback(null);
    try {
      const page = await PageService.createProspectDemoPage({
        companyName: company.name,
        whatsapp: company.whatsapp ?? company.phone,
        niche: company.niche,
        city: company.city,
        instagram: company.instagram,
      });
      const modelVariant = (page.social_links as any)?.model_variant || "Design Pro";
      const url = `https://eialink.com.br/p/${page.slug}`;
      const newNotes = company.notes
        ? `${company.notes}\nDemo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`
        : `Demo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`;
      await ProspectingService.updateNotes(company.id, newNotes);
      setFeedback(`🎉 Página gerada no modelo "${modelVariant}" para ${company.name}! O link já foi anexado para envio no WhatsApp e no Instagram.`);
      invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao gerar página de demonstração.";
      setFeedback(message);
    } finally {
      setCreatingPageId(null);
    }
  }

  async function handleRegenerateDemo(company: ProspectedCompany) {
    setRegeneratingPageId(company.id);
    setFeedback(null);
    try {
      const demoInfo = parseDemoInfo(company.notes);
      const nicheKey = detectNicheKey(company.niche, company.name);
      const variants = NICHE_PRESETS_VARIANTS[nicheKey] || NICHE_PRESETS_VARIANTS.geral;

      // Identifica o modelo atual anotado
      const currentModelMatch = company.notes?.match(/\[Modelo:\s*([^\]]+)\]/i);
      const currentModelName = currentModelMatch ? currentModelMatch[1].trim() : null;
      const currentIndex = currentModelName
        ? variants.findIndex((v) => v.modelName.toLowerCase() === currentModelName.toLowerCase())
        : -1;

      // Avança sequencialmente para o próximo modelo (0 -> 1 -> 2 -> 0)
      const nextIndex = (currentIndex + 1) % variants.length;
      const nextVariant = variants[nextIndex];

      // Remove a página demo anterior para manter tudo limpo
      if (demoInfo.pageId) {
        try {
          await PageService.deletePage(demoInfo.pageId);
        } catch (e) {
          console.warn("Aviso ao remover demo anterior:", e);
        }
      }

      // Gera a nova demonstração com o novo design
      const page = await PageService.createProspectDemoPage({
        companyName: company.name,
        whatsapp: company.whatsapp ?? company.phone,
        niche: company.niche,
        city: company.city,
        instagram: company.instagram,
        variantIndex: nextIndex,
      });

      const modelVariant = (page.social_links as any)?.model_variant || nextVariant.modelName;
      const url = `https://eialink.com.br/p/${page.slug}`;

      // Limpa a linha anterior de Demo das notas
      const cleanNotes = (company.notes || "")
        .replace(/Demo:\s*https?:\/\/[^\s)]+(?:\s*\[Modelo:[^\]]+\])?(?:\s*\(id:[a-f0-9-]+\))?/gi, "")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      const newNotes = cleanNotes
        ? `${cleanNotes}\nDemo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`
        : `Demo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`;

      await ProspectingService.updateNotes(company.id, newNotes);
      setFeedback(`🎨 Modelo alterado para "${modelVariant}" para ${company.name}! O novo link já está pronto.`);
      invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao trocar modelo da página.";
      setFeedback(message);
    } finally {
      setRegeneratingPageId(null);
    }
  }

  async function handleInstagramApproach(company: ProspectedCompany) {
    const handle = cleanInstagramHandle(company.instagram);
    if (!handle) {
      // Abre o modal dedicado para digitar o @perfil, visualizar o pitch e enviar
      setInstaModalCompany(company);
      return;
    }

    const pitch = buildInstagramPitch(company);
    try {
      await navigator.clipboard.writeText(pitch);
      setCopiedInstagramCompanyId(company.id);
      setTimeout(() => setCopiedInstagramCompanyId(null), 4000);
      setFeedback(`📋 Mensagem de abordagem copiada! Abrindo o Direct no Instagram de @${handle}... Basta tocar no campo e colar 📲`);
    } catch (e) {
      console.warn("Aviso ao copiar para área de transferência:", e);
    }

    // Abre o direct oficial no app / web
    window.open(`https://ig.me/m/${handle}`, "_blank", "noopener,noreferrer");
  }

  function parseDemoInfo(notes?: string | null) {
    if (!notes) return { url: null, pageId: null };
    const urlMatch = notes.match(/https?:\/\/[^\s)]+/);
    const idMatch = notes.match(/\(id:([a-f0-9-]+)\)/i);
    return {
      url: urlMatch ? urlMatch[0] : null,
      pageId: idMatch ? idMatch[1] : null,
    };
  }

  async function handleMakeOfficial(company: ProspectedCompany, pageId: string) {
    setActionLoadingId(pageId);
    setFeedback(null);
    try {
      await PageService.makePageOfficial(pageId);
      const newNotes = company.notes
        ? `${company.notes}\n[Página Oficializada]`
        : "[Página Oficializada]";
      await ProspectingService.updateNotes(company.id, newNotes);
      await ProspectingService.updateStatus(company.id, "cliente");
      setFeedback(`🎉 Página de "${company.name}" tornada oficial! A tarja de demonstração foi removida e a empresa marcada como cliente.`);
      invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao oficializar página.";
      setFeedback(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleOpenTransfer(company: ProspectedCompany, pageId: string, demoUrl: string) {
    const slugMatch = demoUrl.match(/\/p\/([^/?#\s]+)/);
    const slug = slugMatch ? slugMatch[1] : company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setTransferModalData({
      isOpen: true,
      page: {
        id: pageId,
        displayName: company.name,
        slug,
        phone: company.whatsapp || company.phone,
        instagram: company.instagram,
        isDemo: true,
      },
    });
  }

  const deleteCompanyMutation = useMutation({
    mutationFn: async ({ companyId, pageId }: { companyId: string; pageId?: string | null }) => {
      await ProspectingService.remove(companyId);
      if (pageId) {
        await PageService.deletePage(pageId).catch((e) => console.warn("Aviso ao excluir página vinculada:", e));
      }
    },
    onSuccess: () => {
      setFeedback("Oportunidade removida do radar.");
      invalidate();
    },
    onError: (err) => {
      setFeedback(`Erro ao remover: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    },
  });

  const clearRadarMutation = useMutation({
    mutationFn: async () => {
      await ProspectingService.clearAll();
    },
    onSuccess: () => {
      setFeedback("Todas as oportunidades foram limpas do radar com sucesso.");
      invalidate();
    },
    onError: (err) => {
      setFeedback(`Erro ao limpar radar: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    },
  });

  function handleDeleteCompany(company: ProspectedCompany) {
    const { pageId } = parseDemoInfo(company.notes);
    let message = `Deseja remover "${company.name}" do radar de prospecção?`;
    if (pageId) {
      message += " A página de demonstração criada para ela também será excluída permanentemente.";
    }
    if (confirm(message)) {
      deleteCompanyMutation.mutate({ companyId: company.id, pageId });
    }
  }

  function handleClearAllRadar() {
    if (confirm("Tem certeza que deseja limpar TODAS as oportunidades salvas no Radar de Prospecção? Esta ação é irreversível.")) {
      clearRadarMutation.mutate();
    }
  }



  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = normalizeName(String(form.get("name") ?? ""));
    if (!name) {
      setFeedback("Informe o nome da empresa.");
      return;
    }
    const whatsapp = normalizePhone(String(form.get("whatsapp") ?? ""));
    const website = normalizeWebsite(String(form.get("website") ?? ""));
    const city = normalizeText(String(form.get("city") ?? ""));
    const base = {
      name,
      niche: normalizeText(String(form.get("niche") ?? "")),
      city,
      state: null,
      phone: whatsapp,
      whatsapp,
      email: null,
      instagram: null,
      website,
      has_website: Boolean(website),
      rating: null,
      reviews_count: null,
      notes: null,
      source: "manual",
      status: "novo" as const,
    };
    const score = scoreCompany(base);
    createMutation.mutate({
      ...base,
      score,
      priority: priorityFromScore(score),
      dedupe_key: buildDedupeKey({
        name: base.name,
        city: base.city,
        whatsapp: base.whatsapp,
        phone: base.phone,
        instagram: null,
      }),
    });
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Super Admin
          </Link>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 mt-1">
            <Radar className="h-6 w-6 text-[color:var(--accent)]" /> Radar de Prospecção
          </h1>
          <p className="text-sm text-muted-foreground">
            Motor de demanda: importe listas, priorize por score e registre cada abordagem.
          </p>
        </div>
      </header>

      {feedback && (
        <div className="rounded-xl border border-border bg-surface-elevated/60 px-4 py-3 text-sm">
          {feedback}
        </div>
      )}

      {/* Radar */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Empresas", value: metrics.total },
          { label: "Prioridade alta", value: metrics.high },
          { label: "Sem abordagem", value: metrics.untouched },
          { label: "Em conversa", value: metrics.answered },
          { label: "Clientes", value: metrics.clients },
          { label: "Contatos hoje", value: metrics.todayDone },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-display text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Ataque de hoje */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 text-[color:var(--accent)]" /> Ataque de Hoje
        </h2>
        <p className="text-sm text-muted-foreground">
          As 10 melhores oportunidades ainda não trabalhadas hoje.
        </p>
        <ul className="mt-4 space-y-2">
          {attackList.map((company) => (
            <li
              key={company.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/60 p-3 sm:py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[company.priority]}`}>
                    Score {company.score}
                  </span>
                  <p className="font-semibold text-foreground truncate">{company.name}</p>
                </div>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {[company.niche, company.city].filter(Boolean).join(" · ") || "Sem detalhes"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                {(() => {
                  const demo = parseDemoInfo(company.notes);
                  if (demo.url) {
                    return (
                      <>
                        <a
                          href={demo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-400 px-2 py-1 text-xs hover:bg-emerald-500/25 transition-colors"
                          title="Ver Página Pro no ar"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Ver
                        </a>
                        {demo.pageId && (
                          <>
                            <Link
                              to="/builder"
                              search={{ page: demo.pageId }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/50 bg-blue-500/15 text-blue-400 px-2 py-1 text-xs hover:bg-blue-500/25 transition-colors"
                              title="Editar no Construtor"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleRegenerateDemo(company)}
                              disabled={regeneratingPageId === company.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-purple-500/50 bg-purple-500/15 text-purple-300 px-2 py-1 text-xs hover:bg-purple-500/25 transition-all"
                              title="Alternar entre os 3 modelos visuais de alta conversão para esta empresa"
                            >
                              {regeneratingPageId === company.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              {regeneratingPageId === company.id ? "Trocando..." : "Trocar Modelo"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTransfer(company, demo.pageId!, demo.url!)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-300 px-2 py-1 text-xs hover:bg-amber-500/25 transition-all"
                              title="Entregar e Oficializar página para o cliente"
                            >
                              <Share2 className="h-3.5 w-3.5" /> Entregar
                            </button>
                          </>
                        )}
                      </>
                    );
                  }
                  return (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)] px-2 py-1 text-xs transition-all hover:bg-[color:var(--primary)]/25"
                      onClick={() => void handleGenerateDemo(company)}
                      disabled={creatingPageId === company.id}
                    >
                      {creatingPageId === company.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {creatingPageId === company.id ? "Gerando..." : "Gerar Página"}
                    </button>
                  );
                })()}
                {whatsappLink(company) ? (
                  <a
                    href={whatsappLink(company)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-2 py-1 text-xs hover:bg-emerald-500/20 transition-colors"
                    title={`Enviar proposta via WhatsApp para ${company.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWhatsModalCompany(company)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-surface-elevated text-emerald-400 px-2 py-1 text-xs hover:bg-emerald-500/15 transition-colors"
                    title={`Definir WhatsApp e enviar proposta para ${company.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleInstagramApproach(company)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                    !whatsappLink(company)
                      ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-sm hover:opacity-90"
                      : "border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"
                  }`}
                  title={
                    copiedInstagramCompanyId === company.id
                      ? "Mensagem copiada!"
                      : company.instagram
                        ? `Copiar pitch e abrir Direct de @${cleanInstagramHandle(company.instagram)}`
                        : "Definir perfil e abrir Direct no Instagram com mensagem pronta"
                  }
                >
                  {copiedInstagramCompanyId === company.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <Instagram className="h-3.5 w-3.5 text-pink-400" />
                  )}
                  {copiedInstagramCompanyId === company.id
                    ? "Copiado!"
                    : company.instagram
                      ? `Direct (@${cleanInstagramHandle(company.instagram)})`
                      : "Direct IG"}
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                  onClick={() => setActiveCompany(company)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registrar
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                  onClick={() => handleDeleteCompany(company)}
                  title="Remover oportunidade do radar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}

          {!attackList.length && (
            <li className="text-sm text-muted-foreground">
              Nenhuma oportunidade pendente. Importe uma nova lista.
            </li>
          )}
        </ul>
      </section>

      {/* Varredura Automática (Google Maps & Instagram) */}
      <section className="rounded-2xl border border-[color:var(--primary)]/30 bg-card p-5 space-y-4 shadow-lg shadow-[color:var(--primary)]/5">

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2 text-foreground">
              <Globe2 className="h-5 w-5 text-[color:var(--primary)]" /> Varredura Automática (Google Maps & Instagram)
            </h2>
            <p className="text-sm text-muted-foreground">
              Busque empresas reais e perfis comerciais sem site na cidade desejada em tempo real.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ⚡ Tempo Real & Sem Bloqueios
          </span>
        </div>

        <form onSubmit={handleLiveSearch} className="grid gap-3 sm:grid-cols-5">
          <input
            value={searchNiche}
            onChange={(e) => setSearchNiche(e.target.value)}
            placeholder="Nicho (ex: Clínica, Dentista, Barbearia)"
            className="input-field sm:col-span-2"
            disabled={isSearching}
            required
          />
          <input
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Cidade (ex: Teixeira de Freitas, BA)"
            className="input-field sm:col-span-2"
            disabled={isSearching}
            required
          />
          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Iniciar Varredura
              </>
            )}
          </button>
        </form>

        {isSearching && (
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface-elevated/40 p-4 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--primary)]" />
            <div>
              <p className="font-medium text-foreground">Varrendo o Google Maps e perfis públicos do Instagram...</p>
              <p className="text-xs">Identificando empresas sem site, avaliações reais e números de WhatsApp.</p>
            </div>
          </div>
        )}

        {liveResults && liveResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {liveResults.length} empresa(s) localizada(s) · {selectedLiveIndices.size} selecionada(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => {
                    if (selectedLiveIndices.size === liveResults.length) {
                      setSelectedLiveIndices(new Set());
                    } else {
                      setSelectedLiveIndices(new Set(liveResults.map((_, i) => i)));
                    }
                  }}
                >
                  {selectedLiveIndices.size === liveResults.length ? "Desmarcar todas" : "Selecionar todas"}
                </button>
                <button
                  type="button"
                  onClick={handleImportLive}
                  disabled={selectedLiveIndices.size === 0 || importMutation.isPending}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-all"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {importMutation.isPending
                    ? "Salvando..."
                    : `Importar ${selectedLiveIndices.size} para o Radar`}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedLiveIndices.size === liveResults.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLiveIndices(new Set(liveResults.map((_, i) => i)));
                          } else {
                            setSelectedLiveIndices(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-3 py-2">Empresa</th>
                    <th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Instagram</th>
                    <th className="px-3 py-2">Status do Site</th>
                    <th className="px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {liveResults.map((lead, index) => {
                    const isSelected = selectedLiveIndices.has(index);
                    return (
                      <tr
                        key={lead.dedupe_key || index}
                        className={`border-t border-border/60 transition-colors ${isSelected ? "bg-[color:var(--primary)]/5" : "opacity-75"}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const next = new Set(selectedLiveIndices);
                              if (next.has(index)) next.delete(index);
                              else next.add(index);
                              setSelectedLiveIndices(next);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.rating ? `⭐ ${lead.rating} (${lead.reviews_count ?? 0} avaliações)` : lead.source}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-xs font-mono">
                          {lead.whatsapp || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {lead.instagram ? (
                            <a
                              href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-pink-400 hover:text-pink-300 transition-colors"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                              <span>{lead.instagram}</span>
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${lead.name}" "${lead.city}"`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 text-[11px] font-medium text-pink-400 hover:bg-pink-500/20 transition-all"
                              title="Buscar Instagram desta empresa"
                            >
                              <Instagram className="h-3 w-3" />
                              <span>Achar perfil</span>
                            </a>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {lead.has_website ? (
                            <span className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                              Já tem site
                            </span>
                          ) : (
                            <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                              ⭐ Sem site (Oportunidade)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-sm">
                          {lead.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Importação CSV */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Upload className="h-5 w-5" /> Importar lista (CSV)
        </h2>
        <p className="text-sm text-muted-foreground">
          Colunas reconhecidas: nome, nicho, cidade, estado, telefone, whatsapp, email, instagram,
          site, nota, avaliações, observação. Os dados são normalizados, deduplicados e pontuados
          antes de salvar.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {preview && (
          <div className="space-y-3">
            <p className="text-sm">
              {importable.length} nova(s) · {preview.filter((r) => r.duplicateOf).length}{" "}
              duplicada(s) · {preview.filter((r) => r.error).length} com erro
            </p>
            <div className="max-h-80 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Empresa</th>
                    <th className="px-3 py-2">Nicho</th>
                    <th className="px-3 py-2">Cidade</th>
                    <th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.line} className="border-t border-border/60">
                      <td className="px-3 py-2">{row.draft?.name ?? `Linha ${row.line}`}</td>
                      <td className="px-3 py-2">{row.draft?.niche ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.city ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.whatsapp ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.score ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {row.error
                          ? row.error
                          : row.duplicateOf
                            ? `Duplicada (${row.duplicateOf})`
                            : "Pronta para importar"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)]"
                style={{ background: "var(--gradient-primary)" }}
                disabled={!importable.length || importMutation.isPending}
                onClick={() =>
                  importMutation.mutate(importable.map((row) => row.draft!).filter(Boolean))
                }
              >
                {importMutation.isPending ? "Importando..." : `Importar ${importable.length}`}
              </button>
              <button
                className="rounded-xl border border-border px-4 py-2 text-sm"
                onClick={() => setPreview(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Cadastro manual */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Adicionar empresa
        </h2>
        <form onSubmit={handleManualSubmit} className="mt-3 grid gap-3 sm:grid-cols-5">
          <input name="name" placeholder="Nome" className="input-field" />
          <input name="niche" placeholder="Nicho" className="input-field" />
          <input name="city" placeholder="Cidade" className="input-field" />
          <input name="whatsapp" placeholder="WhatsApp" className="input-field" />
          <input name="website" placeholder="Site (se tiver)" className="input-field" />
          <button
            type="submit"
            className="rounded-xl border border-border px-4 py-2 text-sm sm:col-span-5 sm:w-fit"
          >
            Salvar no radar
          </button>
        </form>
      </section>

      {/* Pipeline */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              Pipeline
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {companies.length} {companies.length === 1 ? "lead" : "leads"}
              </span>
            </h2>
            {companies.length > 0 && (
              <button
                onClick={handleClearAllRadar}
                disabled={clearRadarMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 text-xs font-medium transition-colors"
                title="Limpar toda a lista de prospecção"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearRadarMutation.isPending ? "Limpando..." : "Limpar Radar"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
              className="input-field flex-1 sm:w-48 text-xs"
            />
            <select
              className="input-field text-xs flex-1 sm:w-auto"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="all">Todas as etapas</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <select
              className="input-field text-xs flex-1 sm:w-auto"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
            >
              <option value="all">Todas as prioridades</option>
              {(Object.keys(PRIORITY_LABEL) as ProspectPriority[]).map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Etapa</th>
                <th className="px-3 py-2">Último contato</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>
                        {[company.niche, company.city, company.has_website ? "tem site" : "sem site"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {company.instagram ? (
                        <a
                          href={`https://instagram.com/${company.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-pink-400 hover:text-pink-300 font-medium"
                        >
                          <Instagram className="h-3 w-3" /> {company.instagram}
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${company.name}" "${company.city || ""}"`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-pink-400"
                          title="Achar perfil no Instagram"
                        >
                          <Instagram className="h-2.5 w-2.5" /> Achar @IG
                        </a>
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-semibold">{company.score}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLE[company.priority]}`}
                    >
                      {PRIORITY_LABEL[company.priority]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input-field"
                      value={company.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          id: company.id,
                          status: event.target.value as ProspectStatus,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {company.last_contacted_at
                      ? new Date(company.last_contacted_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="min-w-[280px] flex flex-wrap items-center gap-1.5 py-1">
                      {(() => {
                        const demo = parseDemoInfo(company.notes);
                        if (demo?.url) {
                          const isOfficial = company.notes?.includes("[Página Oficializada]") || company.status === "cliente";
                          return (
                            <>
                              <a
                                href={demo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-400 px-2 py-1 text-xs hover:bg-emerald-500/25 transition-colors"
                                title="Ver página no navegador"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Ver
                              </a>
                              {demo.pageId && (
                                <>
                                  <Link
                                    to="/builder"
                                    search={{ page: demo.pageId }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/50 bg-blue-500/15 text-blue-400 px-2 py-1 text-xs hover:bg-blue-500/25 transition-colors"
                                    title="Editar página no Construtor"
                                  >
                                    <Pencil className="h-3.5 w-3.5" /> Editar
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => void handleRegenerateDemo(company)}
                                    disabled={regeneratingPageId === company.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-purple-500/50 bg-purple-500/15 text-purple-300 px-2 py-1 text-xs hover:bg-purple-500/25 transition-colors"
                                    title="Alternar entre os 3 modelos visuais de alta conversão"
                                  >
                                    {regeneratingPageId === company.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    )}
                                    {regeneratingPageId === company.id ? "Trocando..." : "Trocar Modelo"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleMakeOfficial(company, demo.pageId!)}
                                    disabled={actionLoadingId === demo.pageId || isOfficial}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
                                      isOfficial
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default"
                                        : "border-teal-500/50 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25"
                                    }`}
                                    title={isOfficial ? "Página já está oficial" : "Tornar Oficial (remove tarja de demonstração e marca como cliente)"}
                                  >
                                    {actionLoadingId === demo.pageId ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    )}
                                    {isOfficial ? "Oficial" : "Tornar Oficial"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTransfer(company, demo.pageId!, demo.url!)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-purple-500/50 bg-purple-500/15 text-purple-300 px-2 py-1 text-xs hover:bg-purple-500/25 transition-colors"
                                    title="Entregar para o cliente no WhatsApp ou transferir por e-mail"
                                  >
                                    <UserCheck className="h-3.5 w-3.5 text-purple-400" /> Entregar
                                  </button>
                                </>
                              )}
                            </>
                          );
                        }
                        return (
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)] px-2 py-1 text-xs transition-all hover:bg-[color:var(--primary)]/25"
                            onClick={() => void handleGenerateDemo(company)}
                            disabled={creatingPageId === company.id}
                          >
                            {creatingPageId === company.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {creatingPageId === company.id ? "Gerando..." : "Gerar Página"}
                          </button>
                        );
                      })()}
                      {whatsappLink(company) ? (
                        <a
                          href={whatsappLink(company)!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-2 py-1 text-xs hover:bg-emerald-500/20 transition-colors"
                          title={`Enviar proposta via WhatsApp para ${company.name}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWhatsModalCompany(company)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-surface-elevated text-emerald-400 px-2 py-1 text-xs hover:bg-emerald-500/15 transition-colors"
                          title={`Definir WhatsApp e enviar proposta para ${company.name}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleInstagramApproach(company)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                          !whatsappLink(company)
                            ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-sm hover:opacity-90"
                            : "border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"
                        }`}
                        title={
                          copiedInstagramCompanyId === company.id
                            ? "Mensagem copiada!"
                            : company.instagram
                              ? `Copiar pitch e abrir Direct de @${cleanInstagramHandle(company.instagram)}`
                              : "Definir perfil e abrir Direct no Instagram com mensagem pronta"
                        }
                      >
                        {copiedInstagramCompanyId === company.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                        ) : (
                          <Instagram className="h-3.5 w-3.5 text-pink-400" />
                        )}
                        {copiedInstagramCompanyId === company.id
                          ? "Copiado!"
                          : "Direct IG"}
                      </button>
                      <button
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => setActiveCompany(company)}
                      >
                        Abordagem
                      </button>
                      <button
                        className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                        onClick={() => handleDeleteCompany(company)}
                        aria-label={`Remover ${company.name}`}
                        title="Remover oportunidade do radar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {activeCompany && (
        <ActivityDialog
          company={activeCompany}
          onClose={() => setActiveCompany(null)}
          onSaved={() => {
            setActiveCompany(null);
            setFeedback("Abordagem registrada.");
            invalidate();
          }}
        />
      )}

      {transferModalData && (
        <TransferPageModal
          isOpen={transferModalData.isOpen}
          onClose={() => setTransferModalData(null)}
          page={transferModalData.page}
          onSuccess={() => {
            setFeedback("Página oficializada/transferida com sucesso!");
            invalidate();
          }}
        />
      )}

      {instaModalCompany && (
        <InstaApproachModal
          company={instaModalCompany}
          onClose={() => setInstaModalCompany(null)}
          onSuccess={() => {
            invalidate();
            setFeedback(`📸 Abordagem via Instagram Direct iniciada para ${instaModalCompany.name}!`);
          }}
        />
      )}

      {whatsModalCompany && (
        <WhatsApproachModal
          company={whatsModalCompany}
          onClose={() => setWhatsModalCompany(null)}
          onSuccess={() => {
            invalidate();
            setFeedback(`💬 Abordagem via WhatsApp iniciada para ${whatsModalCompany.name}!`);
          }}
        />
      )}
    </div>
  );
}

function ActivityDialog({
  company,
  onClose,
  onSaved,
}: {
  company: ProspectedCompany;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [channel, setChannel] = useState<ProspectChannel>("whatsapp");
  const [outcome, setOutcome] = useState<ProspectOutcome>("enviado");
  const [status, setStatus] = useState<ProspectStatus>(
    company.status === "novo" ? "contatado" : company.status,
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["prospecting", "activities", company.id],
    queryFn: () => ProspectingService.listActivities(company.id),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      ProspectingService.registerActivity({
        companyId: company.id,
        channel,
        outcome,
        notes: notes.trim() || null,
        status,
      }),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-lg font-bold">Registrar abordagem</h3>
        <p className="text-sm text-muted-foreground">{company.name}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            className="input-field"
            value={channel}
            onChange={(event) => setChannel(event.target.value as ProspectChannel)}
          >
            {CHANNEL_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {CHANNEL_LABEL[item]}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as ProspectOutcome)}
          >
            {OUTCOME_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {OUTCOME_LABEL[item]}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProspectStatus)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="input-field w-full"
          rows={3}
          placeholder="Observações da conversa"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {error && <p className="text-sm text-[color:var(--destructive)]">{error}</p>}

        <div className="max-h-40 overflow-auto text-xs text-muted-foreground space-y-1">
          {(historyQuery.data ?? []).map((activity) => (
            <p key={activity.id}>
              {new Date(activity.created_at).toLocaleString("pt-BR")} ·{" "}
              {CHANNEL_LABEL[activity.channel]} · {OUTCOME_LABEL[activity.outcome]}
              {activity.notes ? ` · ${activity.notes}` : ""}
            </p>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded-xl border border-border px-4 py-2 text-sm" onClick={onClose}>
            Fechar
          </button>
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)]"
            style={{ background: "var(--gradient-primary)" }}
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface InstaApproachModalProps {
  company: ProspectedCompany;
  onClose: () => void;
  onSuccess?: () => void;
}

function InstaApproachModal({ company, onClose, onSuccess }: InstaApproachModalProps) {
  const [handle, setHandle] = useState(cleanInstagramHandle(company.instagram) || "");
  const [pitch, setPitch] = useState(buildInstagramPitch(company));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanHandle = cleanInstagramHandle(handle);

  function handleCopyPitch() {
    void navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendDirect() {
    setSaving(true);
    try {
      if (cleanHandle && cleanHandle !== company.instagram) {
        await ProspectingService.updateCompany(company.id, { instagram: cleanHandle });
      }
      void navigator.clipboard.writeText(pitch);
      setCopied(true);

      const url = cleanHandle
        ? `https://ig.me/m/${cleanHandle}`
        : "https://www.instagram.com/direct/inbox/";
      window.open(url, "_blank", "noopener,noreferrer");

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("Erro ao salvar instagram:", e);
      const url = cleanHandle ? `https://ig.me/m/${cleanHandle}` : "https://www.instagram.com/direct/inbox/";
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                Abordagem no Instagram Direct
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{company.name}</span>
                {[company.niche, company.city].filter(Boolean).length > 0 && (
                  <span> · {[company.niche, company.city].filter(Boolean).join(" · ")}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dica de Prospecção */}
        <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-3 text-xs text-foreground/90 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-pink-400">
            <Sparkles className="h-4 w-4" /> Envio rápido em 2 passos:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            1. Digite ou confirme o usuário do Instagram da empresa.<br />
            2. Ao clicar no botão, o pitch é <strong>copiado automaticamente</strong> e o Direct é aberto direto no aplicativo ou navegador para colar e enviar.
          </p>
        </div>

        {/* Campo Usuário Instagram */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Perfil do Instagram da Empresa
            </label>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${company.name}" "${company.city || ""}"`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-pink-400 hover:underline flex items-center gap-1"
            >
              <Search className="h-3 w-3" /> Buscar perfil no Google
            </a>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">@</span>
            <input
              type="text"
              placeholder="ex: clinica.sorrisos"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="input-field w-full pl-7 text-xs font-mono"
            />
          </div>
        </div>

        {/* Preview do Pitch */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pitch de Abordagem Pronto
            </label>
            <button
              type="button"
              onClick={handleCopyPitch}
              className="text-xs text-pink-400 hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar mensagem"}
            </button>
          </div>
          <textarea
            rows={4}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="input-field w-full text-xs font-sans resize-none"
          />
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSendDirect()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-pink-500/20 transition-all"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Instagram className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Copiar Pitch & Abrir Direct 📲"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WhatsApproachModalProps {
  company: ProspectedCompany;
  onClose: () => void;
  onSuccess?: () => void;
}

function WhatsApproachModal({ company, onClose, onSuccess }: WhatsApproachModalProps) {
  const initialPhone = company.whatsapp || company.phone || "";
  const [phone, setPhone] = useState(initialPhone);
  const [pitch, setPitch] = useState(() => {
    const demo = company.notes?.match(/https?:\/\/[^\s]+/);
    const demoUrl = demo ? demo[0] : null;
    return demoUrl
      ? `Olá, ${company.name}! Aqui é da EIA Link. Montei uma sugestão exclusiva de presença digital para vocês no ar: ${demoUrl} . Posso te mostrar como funciona para receber agendamentos direto no WhatsApp?`
      : `Olá, ${company.name}! Aqui é da EIA Link. Vi que a empresa ainda não tem uma página profissional na internet e preparei uma sugestão de presença digital para vocês. Posso te mostrar?`;
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCopyPitch() {
    void navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleOpenWhatsApp() {
    setError(null);
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      setError("Por favor, digite um telefone com DDD válido (ex: 73999998888 ou (73) 99999-8888).");
      return;
    }

    setSaving(true);
    try {
      if (cleanPhone !== company.whatsapp) {
        await ProspectingService.updateCompany(company.id, {
          whatsapp: cleanPhone,
          phone: cleanPhone,
        });
      }

      void navigator.clipboard.writeText(pitch);
      setCopied(true);

      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitch)}`;
      window.open(url, "_blank", "noopener,noreferrer");

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error("Erro ao salvar WhatsApp:", err);
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitch)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                Abordagem no WhatsApp
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{company.name}</span>
                {[company.niche, company.city].filter(Boolean).length > 0 && (
                  <span> · {[company.niche, company.city].filter(Boolean).join(" · ")}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dica */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-foreground/90 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="h-4 w-4" /> Conexão Imediata em 2 passos:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            1. Digite ou confirme o WhatsApp com DDD da empresa.<br />
            2. Ao clicar no botão, o número será salvo no cadastro da empresa e a conversa será aberta com a mensagem pronta de abordagem.
          </p>
        </div>

        {/* Campo WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              WhatsApp / Telefone com DDD
            </label>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${company.name} ${company.city || ""} telefone whatsapp`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Search className="h-3 w-3" /> Buscar telefone no Google
            </a>
          </div>
          <input
            type="text"
            placeholder="ex: (73) 99999-9999 ou 73999999999"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            className="input-field w-full text-xs font-mono"
          />
          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        </div>

        {/* Preview do Pitch */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mensagem Pronta de Abordagem
            </label>
            <button
              type="button"
              onClick={handleCopyPitch}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiada!" : "Copiar mensagem"}
            </button>
          </div>
          <textarea
            rows={4}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="input-field w-full text-xs font-sans resize-none"
          />
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleOpenWhatsApp()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar e Iniciar WhatsApp 📲"}
          </button>
        </div>
      </div>
    </div>
  );
}
