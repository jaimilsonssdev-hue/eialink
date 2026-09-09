import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  MoreHorizontal,
  Building2,
  MessageSquareQuote,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { runLiveProspecting } from "@/modules/prospecting/prospecting.functions";
import { validateProspectingSearch } from "@/modules/prospecting/validation";
import { useActionCooldown } from "@/hooks/useActionCooldown";
import { searchGoogleMapsAndInstagram } from "@/modules/prospecting/LiveProspectingEngine";
import { PageService } from "@/modules/page/services/PageService";
import { TransferPageModal } from "@/components/prospecting/TransferPageModal";
import { LeadTemperatureBadge } from "@/components/prospecting/LeadTemperatureBadge";
import { CnpjLookupCard } from "@/components/prospecting/CnpjLookupCard";
import { CopyConfigModal } from "@/components/prospecting/CopyConfigModal";
import {
  buildWhatsAppMessage,
  buildInstagramMessage,
  COPY_TEMPLATES_UPDATED_EVENT,
} from "@/modules/prospecting/copyTemplates";
import { POPULAR_CNAES } from "@/modules/prospecting/cnaePresets";
import { NICHE_PRESETS_VARIANTS, detectNicheKey } from "@/modules/prospecting/nichePresets";

import { ProspectingService } from "@/modules/prospecting/ProspectingService";

import { buildPreview, type CsvRowPreview } from "@/modules/prospecting/csv";
import {
  buildDedupeKey,
  formatPhone,
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

  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-8 max-w-2xl mx-auto my-12 text-rose-400 bg-zinc-950 border border-rose-500/30 rounded-xl font-mono text-xs whitespace-pre-wrap">
      <p className="font-bold text-sm mb-2 text-rose-300">Erro no Radar de Prospecção:</p>
      {error?.stack || error?.message || String(error)}
    </div>
  ),

  component: ProspectingPage,
});

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as ProspectStatus[];
const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABEL) as ProspectChannel[];
const OUTCOME_OPTIONS = Object.keys(OUTCOME_LABEL) as ProspectOutcome[];

const PRIORITY_STYLE: Record<ProspectPriority, string> = {
  alta: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  media: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
  baixa: "bg-muted/60 text-muted-foreground border border-border/60",
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
  const text = buildWhatsAppMessage(company);
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
  return buildInstagramMessage(company);
}

function ProspectingPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ProspectStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | ProspectPriority>("all");
  const [siteFilter, setSiteFilter] = useState<"all" | "no_website" | "has_website">("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<CsvRowPreview[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<ProspectedCompany | null>(null);
  const [copiedInstagramCompanyId, setCopiedInstagramCompanyId] = useState<string | null>(null);
  const { canRun: canRunAction, remainingSeconds: remainingCooldown } = useActionCooldown(3000);

  // Estados da Varredura Automática (Google Maps + Instagram)
  const [searchNiche, setSearchNiche] = useState("Clínica");
  const [searchCity, setSearchCity] = useState("Teixeira de Freitas, BA");
  const [isSearching, setIsSearching] = useState(false);
  const [liveResults, setLiveResults] = useState<ProspectDraft[]>([]);
  const [liveSiteFilter, setLiveSiteFilter] = useState<"no_website" | "has_website" | "all">("no_website");
  const [selectedLiveIndices, setSelectedLiveIndices] = useState<Set<number>>(new Set());

  const [creatingPageId, setCreatingPageId] = useState<string | null>(null);
  const [regeneratingPageId, setRegeneratingPageId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [instaModalCompany, setInstaModalCompany] = useState<ProspectedCompany | null>(null);
  const [whatsModalCompany, setWhatsModalCompany] = useState<ProspectedCompany | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [, setCopyTemplatesVersion] = useState(0);

  useEffect(() => {
    const handleTemplatesUpdated = () => {
      setCopyTemplatesVersion((v) => v + 1);
    };
    window.addEventListener(COPY_TEMPLATES_UPDATED_EVENT, handleTemplatesUpdated);
    return () => {
      window.removeEventListener(COPY_TEMPLATES_UPDATED_EVENT, handleTemplatesUpdated);
    };
  }, []);
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


  const [prospectEngine, setProspectEngine] = useState<"maps" | "cnae" | "utilities" | "demos">(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "demos" || tab === "cnae" || tab === "utilities") return tab;
    }
    return "maps";
  });
  const [entryTab, setEntryTab] = useState<"csv" | "manual">("csv");
  const [demoSearch, setDemoSearch] = useState("");
  const [copiedDemoId, setCopiedDemoId] = useState<string | null>(null);
  const [copiedPitchDemoId, setCopiedPitchDemoId] = useState<string | null>(null);
  const [deletingDemoId, setDeletingDemoId] = useState<string | null>(null);
  const [makingOfficialDemoId, setMakingOfficialDemoId] = useState<string | null>(null);

  const demoPagesQuery = useQuery({
    queryKey: ["admin-demo-pages"],
    queryFn: () => PageService.listDemoPages(),
  });
  const demoPages = useMemo(() => demoPagesQuery.data ?? [], [demoPagesQuery.data]);

  const demoPagesBySlug = useMemo(() => {
    const map = new Map<string, OwnedPage>();
    for (const p of demoPages) {
      if (p.slug) map.set(p.slug.toLowerCase().trim(), p);
    }
    return map;
  }, [demoPages]);

  const demoPagesByName = useMemo(() => {
    const map = new Map<string, OwnedPage>();
    for (const p of demoPages) {
      if (p.display_name) map.set(p.display_name.toLowerCase().trim(), p);
    }
    return map;
  }, [demoPages]);

  const filteredDemos = useMemo(() => {
    const term = demoSearch.trim().toLowerCase();
    if (!term) return demoPages;
    return demoPages.filter((p) => {
      const name = (p.display_name || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const model = ((p.social_links as any)?.model_variant || "").toLowerCase();
      return name.includes(term) || slug.includes(term) || model.includes(term);
    });
  }, [demoPages, demoSearch]);

  async function handleDeleteDemo(pageId: string, pageName: string) {
    if (!window.confirm(`Deseja realmente excluir a página demonstrativa de "${pageName}"? Esta ação removerá a demo do ar e não pode ser desfeita.`)) return;
    setDeletingDemoId(pageId);
    try {
      await PageService.deletePage(pageId);
      setFeedback(`Página demonstrativa de "${pageName}" excluída com sucesso.`);
      invalidate();
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Erro ao excluir demonstração.");
    } finally {
      setDeletingDemoId(null);
    }
  }

  async function handleMakeDemoOfficialDirect(page: typeof demoPages[0]) {
    setMakingOfficialDemoId(page.id);
    try {
      await PageService.makePageOfficial(page.id);
      setFeedback(`🎉 Demonstração de "${page.display_name}" tornada oficial! A página agora é definitiva.`);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["owned-bio-pages"] });
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Erro ao tornar oficial.");
    } finally {
      setMakingOfficialDemoId(null);
    }
  }

  function handleCopyDemoUrl(slug: string, id: string) {
    const url = `https://eialink.com.br/p/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopiedDemoId(id);
    setTimeout(() => setCopiedDemoId(null), 2000);
  }

  function handleCopyDemoPitch(page: typeof demoPages[0]) {
    const url = `https://eialink.com.br/p/${page.slug}`;
    const pitch = buildWhatsAppMessage({
      name: page.display_name,
      notes: `Demo: ${url} [Modelo: ${(page.social_links as any)?.model_variant || ""}]`,
      rating: (page.social_links as any)?.google_rating,
      reviews_count: (page.social_links as any)?.reviews_count,
      whatsapp: page.whatsapp,
    } as any);
    void navigator.clipboard.writeText(pitch);
    setCopiedPitchDemoId(page.id);
    setTimeout(() => setCopiedPitchDemoId(null), 2000);
  }

  async function handleAddCnpjCompany(draft: Parameters<typeof ProspectingService.create>[0]) {
    try {
      await createMutation.mutateAsync(draft);
      setFeedback(`Empresa "${draft.name}" adicionada ao radar com sucesso.`);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "Erro ao adicionar empresa." };
    }
  }

  const companiesQuery = useQuery({
    queryKey: ["prospecting", "companies"],
    queryFn: ProspectingService.list,
  });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["prospecting", "companies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-demo-pages"] });
    queryClient.invalidateQueries({ queryKey: ["admin-demo-pages-count"] });
  };

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

  const clearRadarMutation = useMutation({
    mutationFn: async () => {
      await ProspectingService.clearAll();
    },
    onSuccess: () => {
      setFeedback("Todas as oportunidades foram limpas do radar com sucesso.");
      invalidate();
    },
    onError: (error: Error) => setFeedback(`Erro ao limpar o radar: ${error.message}`),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchStatus = statusFilter === "all" || company.status === statusFilter;
      const matchPriority = priorityFilter === "all" || company.priority === priorityFilter;
      const matchSite =
        siteFilter === "all" ||
        (siteFilter === "no_website" ? !company.has_website : company.has_website);
      const matchTerm =
        !term ||
        [company.name, company.niche, company.city, company.whatsapp]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchStatus && matchPriority && matchSite && matchTerm;
    });
  }, [companies, priorityFilter, search, statusFilter, siteFilter]);

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

  const displayedLiveResults = useMemo(() => {
    return liveResults.filter((lead) => {
      if (liveSiteFilter === "no_website") return !lead.has_website;
      if (liveSiteFilter === "has_website") return lead.has_website;
      return true;
    });
  }, [liveResults, liveSiteFilter]);

  // Auto-backfill inteligente: sincroniza notas de empresas antigas vinculando ID e Modelo reais
  useEffect(() => {
    if (!companiesQuery.data?.length || !demoPages.length) return;

    let hasUpdates = false;
    const backfill = async () => {
      for (const company of companiesQuery.data!) {
        const notes = company.notes || "";
        const urlMatch = notes.match(/https?:\/\/[^\s)]+/);
        const hasId = notes.includes("(id:");
        if (urlMatch && !hasId) {
          const url = urlMatch[0];
          const slugMatch = url.match(/\/p\/([^/?#\s)]+)/);
          const slug = slugMatch ? slugMatch[1].toLowerCase() : null;
          const matched = (slug ? demoPagesBySlug.get(slug) : null) || demoPagesByName.get(company.name.toLowerCase().trim());
          if (matched) {
            const modelVariant = (matched.social_links as any)?.model_variant || "Design Pro";
            const clean = notes
              .replace(/Demo:\s*https?:\/\/[^\s)]+(?:\s*\[Modelo:[^\]]+\])?(?:\s*\(id:[a-f0-9-]+\))?/gi, "")
              .replace(/https?:\/\/eialink\.com\.br\/p\/[^\s)]+/gi, "")
              .replace(/\n\s*\n/g, "\n")
              .trim();
            const updatedNotes = clean
              ? `${clean}\nDemo: https://eialink.com.br/p/${matched.slug} [Modelo: ${modelVariant}] (id:${matched.id})`
              : `Demo: https://eialink.com.br/p/${matched.slug} [Modelo: ${modelVariant}] (id:${matched.id})`;
            try {
              await ProspectingService.updateNotes(company.id, updatedNotes);
              hasUpdates = true;
            } catch (e) {
              console.warn("Aviso no auto-backfill de demo:", e);
            }
          }
        }
      }
      if (hasUpdates) {
        invalidate();
      }
    };

    void backfill();
  }, [companiesQuery.data, demoPages, demoPagesBySlug, demoPagesByName]);

  async function handleFile(file: File) {
    setFeedback(null);
    const content = await file.text();
    const keys = await ProspectingService.listDedupeKeys();
    setPreview(buildPreview(content, keys));
  }

  const importable = (preview ?? []).filter((row) => row.draft && !row.duplicateOf);

  async function handleLiveSearch(event: React.FormEvent) {
    event.preventDefault();
    if (isSearching) return;

    // Validação estrita dos campos digitados (bloqueia scripts e caracteres suspeitos)
    const validation = validateProspectingSearch({
      niche: searchNiche,
      city: searchCity,
      limit: 15,
    });
    if (!validation.ok) {
      setFeedback(validation.message);
      return;
    }

    // Trava de 3 segundos contra cliques repetidos
    if (!canRunAction("live-search")) {
      setFeedback(
        `Aguarde ${remainingCooldown("live-search")}s antes de disparar uma nova varredura.`,
      );
      return;
    }

    const { niche, city } = validation.data;
    setIsSearching(true);
    setFeedback(null);
    try {
      let results: ProspectDraft[] = [];
      try {
        // Tentativa 1: Execução direta no cliente (super rápida, sem intermediação de servidor)
        results = await searchGoogleMapsAndInstagram(niche, city, 15);
      } catch (clientErr) {
        console.warn("[Prospecção] Execução direta no cliente falhou, tentando via servidor:", clientErr);
        // Tentativa 2: Fallback para RPC do servidor caso o navegador bloqueie por adblocker
        results = await runLiveProspecting({
          data: { niche, city, limit: 15 },
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
      const cidMatch = company.notes?.match(/CID:\s*([0-9a-fx:]+)/i);
      const page = await PageService.createProspectDemoPage({
        companyName: company.name,
        whatsapp: company.whatsapp ?? company.phone,
        niche: company.niche,
        city: company.city,
        instagram: company.instagram,
        rating: company.rating,
        reviewsCount: company.reviews_count,
        cid: cidMatch ? cidMatch[1] : null,
      });
      const modelVariant = (page.social_links as any)?.model_variant || "Design Pro";
      const url = `https://eialink.com.br/p/${page.slug}`;
      const newNotes = company.notes
        ? `${company.notes}\nDemo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`
        : `Demo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`;

      const companyUpdates: Partial<ProspectedCompany> = { notes: newNotes };
      if (page.whatsapp && !company.whatsapp) {
        companyUpdates.whatsapp = page.whatsapp;
        companyUpdates.phone = page.whatsapp;
      }
      await ProspectingService.updateCompany(company.id, companyUpdates);
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
      const demoInfo = parseDemoInfo(company);
      const nicheKey = detectNicheKey(company.niche, company.name);
      const variants = NICHE_PRESETS_VARIANTS[nicheKey] || NICHE_PRESETS_VARIANTS.geral;

      // Identifica o modelo atual anotado ou da página encontrada
      const currentModelName = demoInfo.modelName;
      const currentIndex = currentModelName
        ? variants.findIndex((v) => v.modelName.toLowerCase() === currentModelName.toLowerCase())
        : -1;

      // Avança sequencialmente para o próximo modelo (0 -> 1 -> 2 -> 0)
      const nextIndex = (currentIndex + 1) % variants.length;
      const nextVariant = variants[nextIndex];

      // Remove a página demo anterior para manter tudo limpo
      const oldPageId = demoInfo.pageId || (demoInfo.slug ? demoPagesBySlug.get(demoInfo.slug)?.id : null);
      if (oldPageId) {
        try {
          await PageService.deletePage(oldPageId);
        } catch (e) {
          console.warn("Aviso ao remover demo anterior:", e);
        }
      }

      // Gera a nova demonstração com o novo design
      const cidMatch = company.notes?.match(/CID:\s*([0-9a-fx:]+)/i);
      const page = await PageService.createProspectDemoPage({
        companyName: company.name,
        whatsapp: company.whatsapp ?? company.phone,
        niche: company.niche,
        city: company.city,
        instagram: company.instagram,
        variantIndex: nextIndex,
        rating: company.rating,
        reviewsCount: company.reviews_count,
        cid: cidMatch ? cidMatch[1] : null,
      });

      const modelVariant = (page.social_links as any)?.model_variant || nextVariant.modelName;
      const url = `https://eialink.com.br/p/${page.slug}`;

      // Limpa qualquer linha anterior de Demo das notas
      const cleanNotes = (company.notes || "")
        .replace(/Demo:\s*https?:\/\/[^\s)]+(?:\s*\[Modelo:[^\]]+\])?(?:\s*\(id:[a-f0-9-]+\))?/gi, "")
        .replace(/https?:\/\/eialink\.com\.br\/p\/[^\s)]+/gi, "")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      const newNotes = cleanNotes
        ? `${cleanNotes}\nDemo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`
        : `Demo: ${url} [Modelo: ${modelVariant}] (id:${page.id})`;

      const companyUpdates: Partial<ProspectedCompany> = { notes: newNotes };
      if (page.whatsapp && !company.whatsapp) {
        companyUpdates.whatsapp = page.whatsapp;
        companyUpdates.phone = page.whatsapp;
      }
      await ProspectingService.updateCompany(company.id, companyUpdates);
      setFeedback(`🎨 Modelo alterado para "${modelVariant}" para ${company.name}! O novo link já está pronto.`);
      invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao trocar modelo da página.";
      setFeedback(message);
    } finally {
      setRegeneratingPageId(null);
    }
  }

  async function handleRegenerateDemoForPage(page: OwnedPage) {
    const linkedCompany = companiesQuery.data?.find((c) => {
      const demo = parseDemoInfo(c);
      return demo.pageId === page.id || demo.slug === page.slug?.toLowerCase();
    });

    if (linkedCompany) {
      await handleRegenerateDemo(linkedCompany);
      return;
    }

    setRegeneratingPageId(page.id);
    setFeedback(null);
    try {
      const nicheKey = detectNicheKey(null, page.display_name);
      const variants = NICHE_PRESETS_VARIANTS[nicheKey] || NICHE_PRESETS_VARIANTS.geral;
      const currentModel = (page.social_links as any)?.model_variant || "";
      const currentIndex = variants.findIndex((v) => v.modelName.toLowerCase() === currentModel.toLowerCase());
      const nextIndex = (currentIndex + 1) % variants.length;
      const nextVariant = variants[nextIndex];

      try {
        await PageService.deletePage(page.id);
      } catch (e) {
        console.warn("Aviso ao remover demo:", e);
      }

      const newPage = await PageService.createProspectDemoPage({
        companyName: page.display_name,
        whatsapp: page.whatsapp,
        city: (page.social_links as any)?.address || "sua região",
        instagram: page.instagram,
        variantIndex: nextIndex,
        rating: (page.social_links as any)?.google_rating,
        reviewsCount: (page.social_links as any)?.reviews_count,
        cid: (page.social_links as any)?.cid || null,
      });

      const modelVariant = (newPage.social_links as any)?.model_variant || nextVariant.modelName;
      setFeedback(`🎨 Modelo de "${page.display_name}" alterado para "${modelVariant}" com sucesso!`);
      invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao trocar modelo da demonstração.";
      setFeedback(message);
    } finally {
      setRegeneratingPageId(null);
    }
  }

  async function handleInstagramApproach(company: ProspectedCompany) {
    if (!canRunAction(`direct-${company.id}`)) {
      setFeedback(
        `Aguarde ${remainingCooldown(`direct-${company.id}`)}s para abrir o Direct novamente.`,
      );
      return;
    }
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

  function parseDemoInfo(input?: ProspectedCompany | string | null) {
    if (!input) return { url: null, pageId: null, slug: null, modelName: null, page: undefined };
    const notes = typeof input === "string" ? input : (input.notes || "");
    const company = typeof input === "object" ? input : null;

    // 1. URL da demo nas notas ou website
    const urlMatch = notes.match(/https?:\/\/[^\s)]+/) || (company?.website?.includes("/p/") ? [company.website] : null);
    let url = urlMatch ? urlMatch[0] : null;

    // 2. Extrai slug da URL se existir
    const slugMatch = url ? url.match(/\/p\/([^/?#\s)]+)/) : null;
    let slug = slugMatch ? slugMatch[1].toLowerCase().trim() : null;

    // 3. ID da página: a partir de (id:uuid), pelo slug em demoPagesBySlug ou pelo nome da empresa
    const idMatch = notes.match(/\(id:([a-f0-9-]+)\)/i);
    let pageId = idMatch ? idMatch[1] : null;

    let matchedPage: OwnedPage | undefined;
    if (pageId) {
      matchedPage = demoPages.find((p) => p.id === pageId);
    } else if (slug) {
      matchedPage = demoPagesBySlug.get(slug);
      if (matchedPage) pageId = matchedPage.id;
    }

    if (!pageId && company?.name) {
      matchedPage = demoPagesByName.get(company.name.toLowerCase().trim());
      if (matchedPage) {
        pageId = matchedPage.id;
        if (!url) url = `https://eialink.com.br/p/${matchedPage.slug}`;
        if (!slug) slug = matchedPage.slug.toLowerCase().trim();
      }
    }

    // 4. Modelo da página
    const modelMatch = notes.match(/\[Modelo:\s*([^\]]+)\]/i);
    const modelName = modelMatch
      ? modelMatch[1].trim()
      : ((matchedPage?.social_links as any)?.model_variant || null);

    return {
      url,
      pageId,
      slug,
      modelName,
      page: matchedPage,
    };
  }

  function isOfficialCompany(company: ProspectedCompany) {
    return Boolean(company.notes?.includes("[Página Oficializada]") || company.status === "cliente");
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

  function handleOpenTransfer(company: ProspectedCompany, pageId: string, pageUrl: string) {
    const isDemo = company.notes?.includes("Demo:") && !company.notes?.includes("[Página Oficializada]");
    setTransferModalData({
      isOpen: true,
      page: {
        id: pageId,
        displayName: company.name,
        slug: pageUrl.split("/p/")[1] || "",
        phone: company.whatsapp ?? company.phone,
        instagram: company.instagram,
        isDemo,
      },
    });
  }

  async function handleDeleteCompany(company: ProspectedCompany) {
    if (!window.confirm(`Tem certeza que deseja remover "${company.name}" do radar de prospecção?`)) return;
    try {
      await removeMutation.mutateAsync(company.id);
      setFeedback(`"${company.name}" foi removida do radar.`);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erro ao remover empresa.");
    }
  }

  async function handleClearAllRadar() {
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir TODOS os ${companies.length} contatos do radar de prospecção? Esta ação não pode ser desfeita.`)) return;
    try {
      await clearRadarMutation.mutateAsync();
      setFeedback("Todos os contatos foram removidos do radar.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erro ao limpar o radar.");
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
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Super Admin
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="font-display text-2xl font-bold flex items-center gap-2 text-foreground">
              <Radar className="h-6 w-6 text-primary" /> Radar de Prospecção
            </h1>
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-md shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Ops • Radar Ativo</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Motor de demanda ativa: varredura no Google e Instagram, modelos demonstrativos e conversão no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCopyModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:border-primary/40"
            title="Personalizar mensagens e copys globais de abordagem para WhatsApp e Instagram"
          >
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            <span>Configurar Copys / Mensagens</span>
          </button>
        </div>
      </header>

      {feedback && (
        <div className="rounded-xl border border-border bg-surface-elevated/60 px-4 py-3 text-sm">
          {feedback}
        </div>
      )}

      {/* Linha Superior: 4 Mini-Cards Geométricos de KPIs Rápidos */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Leads no Radar",
            value: metrics.total,
            sub: "Total catalogado",
            icon: Radar,
            color: "text-purple-400",
          },
          {
            label: "Prioridade Alta",
            value: metrics.high,
            sub: "Oportunidades quentes",
            icon: Flame,
            color: "text-amber-400",
          },
          {
            label: "Sem Site (Alvos)",
            value: companies.filter((c) => !c.has_website).length,
            sub: "Oportunidades limpas",
            icon: Globe2,
            color: "text-emerald-400",
          },
          {
            label: "Trabalhados Hoje",
            value: metrics.todayDone,
            sub: "Abordagens realizadas",
            icon: CheckCircle2,
            color: "text-blue-400",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="border-border bg-card shadow-xs transition-all hover:border-border/80"
            >
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground mt-1">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 font-normal mt-0.5">{item.sub}</p>
                </div>
                <div className="h-10 w-10 shrink-0 rounded-xl border border-border/80 bg-background/50 flex items-center justify-center transition-colors">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Ataque de hoje */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" /> Ataque de Hoje
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            As 10 melhores oportunidades ainda não trabalhadas hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
          {attackList.map((company) => {
            const demo = parseDemoInfo(company);
            return (
              <li
                key={company.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 px-4 py-3 sm:px-5 sm:py-3.5 transition-all shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LeadTemperatureBadge score={company.score} />
                    <p className="font-semibold text-foreground tracking-tight text-sm truncate">{company.name}</p>
                  </div>
                  <p className="truncate text-xs font-normal text-muted-foreground mt-1">
                    {[company.niche, company.city].filter(Boolean).join(" · ") || "Sem detalhes"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  {demo.url ? (
                    <>
                      <HoverCard openDelay={150} closeDelay={150}>
                        <HoverCardTrigger asChild>
                          <a
                            href={demo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                            title="Ver Página Pro no ar"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>Ver</span>
                          </a>
                        </HoverCardTrigger>
                        <HoverCardContent align="end" className="w-80 border-border bg-popover text-popover-foreground backdrop-blur-md p-4 shadow-2xl space-y-3 z-50">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-xs font-semibold text-foreground">Modelo Demonstrativo</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono">EIA Link</span>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-background/80 p-3 space-y-1">
                            <p className="text-xs font-bold text-foreground tracking-tight">{company.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {[company.niche, company.city].filter(Boolean).join(" · ")}
                            </p>
                            <div className="pt-2 flex items-center justify-between text-[11px]">
                              <span className="text-emerald-400 font-medium">WhatsApp Pronto</span>
                              <span className="text-purple-400 font-mono">Online</span>
                            </div>
                          </div>
                          <div className="pt-1">
                            <a
                              href={demo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              Abrir página em nova aba <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      {demo.pageId && (
                        <Link
                          to="/builder"
                          search={{ page: demo.pageId }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                          title="Editar no Construtor"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>Editar</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 text-primary dark:text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary/25 shadow-[0_0_14px_-3px_rgba(168,85,247,0.4)] transition-all"
                      onClick={() => void handleGenerateDemo(company)}
                      disabled={creatingPageId === company.id}
                      title="Gerar modelo demonstrativo para prospecção"
                    >
                      {creatingPageId === company.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary dark:text-white" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                      )}
                      <span>{creatingPageId === company.id ? "Gerando..." : "Gerar Demo 🪄"}</span>
                    </button>
                  )}

                  {whatsappLink(company) ? (
                    <a
                      href={whatsappLink(company)!}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (!canRunAction(`whats-${company.id}`)) {
                          e.preventDefault();
                          setFeedback(
                            `Aguarde ${remainingCooldown(`whats-${company.id}`)}s para enviar novamente para ${company.name}.`,
                          );
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                        company.status === "contatado"
                          ? "border border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium hover:bg-amber-500/20 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]"
                          : demo.url && (company.status === "novo")
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 shadow-[0_0_14px_-3px_rgba(16,185,129,0.3)]"
                            : "border border-border/60 bg-transparent text-muted-foreground font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                      }`}
                      title={company.status === "contatado" ? `Follow-up via WhatsApp com ${company.name}` : `Enviar proposta via WhatsApp para ${company.name}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-current" />
                      <span>{company.status === "contatado" ? "Follow-up" : "WhatsApp"}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWhatsModalCompany(company)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                        demo.url && (company.status === "novo")
                          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 shadow-[0_0_14px_-3px_rgba(16,185,129,0.3)]"
                          : "border border-border/60 bg-transparent text-muted-foreground font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                      }`}
                      title={`Definir WhatsApp e enviar proposta para ${company.name}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-current" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleInstagramApproach(company)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all"
                    title={
                      copiedInstagramCompanyId === company.id
                        ? "Mensagem copiada!"
                        : company.instagram
                          ? `Copiar pitch e abrir Direct de @${cleanInstagramHandle(company.instagram)}`
                          : "Definir perfil e abrir Direct no Instagram com mensagem pronta"
                    }
                  >
                    {copiedInstagramCompanyId === company.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Instagram className="h-3.5 w-3.5 text-muted-foreground/70" />
                    )}
                    <span>
                      {copiedInstagramCompanyId === company.id
                        ? "Copiado!"
                        : "Direct IG"}
                    </span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title="Mais opções"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {/* Opção Trocar Modelo / Gerar Modelo universal para TODAS as empresas */}
                      <DropdownMenuItem
                        onClick={() => void handleRegenerateDemo(company)}
                        disabled={regeneratingPageId === company.id || creatingPageId === company.id}
                        className="cursor-pointer text-xs text-purple-300 hover:text-purple-200 focus:text-purple-200 focus:bg-purple-500/10 font-medium"
                      >
                        {regeneratingPageId === company.id || creatingPageId === company.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-purple-400" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 mr-2 text-purple-400" />
                        )}
                        <span>
                          {regeneratingPageId === company.id
                            ? "Trocando modelo..."
                            : demo.url
                              ? "Trocar Modelo"
                              : "Gerar / Escolher Modelo"}
                        </span>
                      </DropdownMenuItem>

                      {demo.url && (
                        <>
                          {demo.pageId && (
                            <DropdownMenuItem
                              onClick={() => void handleMakeOfficial(company, demo.pageId!)}
                              disabled={actionLoadingId === demo.pageId || isOfficialCompany(company)}
                              className="cursor-pointer text-xs"
                            >
                              {actionLoadingId === demo.pageId ? (
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-teal-400" />
                              ) : (
                                <CheckCircle className={`h-3.5 w-3.5 mr-2 ${isOfficialCompany(company) ? "text-emerald-400" : "text-muted-foreground"}`} />
                              )}
                              <span>{isOfficialCompany(company) ? "Página Oficializada" : "Tornar Oficial"}</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleOpenTransfer(company, demo.pageId || "", demo.url!)}
                            className="cursor-pointer text-xs"
                          >
                            <Share2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <span>Entregar / Transferir</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setActiveCompany(company)}
                        className="cursor-pointer text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span>Registrar Abordagem</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => handleDeleteCompany(company)}
                        className="cursor-pointer text-xs text-rose-400 hover:text-rose-300 focus:text-rose-400 focus:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                        <span>Remover do Radar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}

          {!attackList.length && (
            <li className="text-sm text-muted-foreground">
              Nenhuma oportunidade pendente. Importe uma nova lista.
            </li>
          )}
        </ul>
        </CardContent>
      </Card>

      {/* Central de Captação Ativa: Seletor das Duas Ferramentas Principais + Utilitários */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProspectEngine("maps")}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                prospectEngine === "maps"
                  ? "bg-primary text-white shadow-md shadow-primary/20 border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Globe2 className="h-4 w-4 text-purple-300" />
              <span>Ferramenta 1: Radar Google Maps & Local</span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium">
                ⚡ Tempo Real
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProspectEngine("cnae")}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                prospectEngine === "cnae"
                  ? "bg-primary text-white shadow-md shadow-primary/20 border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Building2 className="h-4 w-4 text-purple-300" />
              <span>Ferramenta 2: Radar CNAE & Base CNPJ</span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium">
                🏛️ Receita Federal
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProspectEngine("utilities")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                prospectEngine === "utilities"
                  ? "bg-muted text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Importar CSV / Manual</span>
            </button>

            <button
              type="button"
              onClick={() => setProspectEngine("demos")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                prospectEngine === "demos"
                  ? "bg-primary text-white shadow-md shadow-primary/20 border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span>Demos de Clientes</span>
              <span className="inline-flex items-center rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold">
                {demoPages.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground px-2 hidden lg:block">
            {prospectEngine === "maps" && "Varredura local no Google Maps e Instagram com filtro automático de quem tem ou não tem site."}
            {prospectEngine === "cnae" && "Auditoria de atividades econômicas e CNPJs oficiais com dados de sócios (QSA) e filtro de site."}
            {prospectEngine === "utilities" && "Importe planilhas externas com deduplicação ou cadastre oportunidades avulsas."}
            {prospectEngine === "demos" && "Gerenciador exclusivo de páginas demonstrativas geradas para clientes locais."}
          </div>
        </div>

        {/* FERRAMENTA 1: GOOGLE MAPS & INSTAGRAM (FULL WIDTH) */}
        {prospectEngine === "maps" && (
          <Card className="w-full border-border bg-card shadow-xs">
            <CardHeader className="pb-4 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" /> Ferramenta 1: Radar Google Maps & Local
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Varredura em tempo real para encontrar comércios e serviços locais, identificando automaticamente quem já tem site e quem está sem site.
                </CardDescription>
              </div>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                ⚡ Tempo Real & Sem Bloqueios
              </span>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Sugestões Rápidas de CNAE / Nichos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> CNAEs Quentes:
                </span>
                {POPULAR_CNAES.slice(0, 8).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSearchNiche(item.niche)}
                    className={`px-2.5 py-1 rounded-full border text-[11px] whitespace-nowrap transition-all ${
                      searchNiche.toLowerCase().includes(item.niche.toLowerCase())
                        ? "border-primary bg-primary/15 text-primary dark:text-white font-semibold shadow-xs"
                        : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                    title={`${item.title} (CNAE ${item.code})`}
                  >
                    {item.niche} <span className="opacity-60 text-[10px]">[{item.code.split("-")[0]}]</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleLiveSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5">
                  <input
                    value={searchNiche}
                    onChange={(e) => setSearchNiche(e.target.value)}
                    placeholder="Nicho (ex: Clínica, Barbearia, Dentista)"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                    disabled={isSearching}
                    required
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Cidade (ex: São Paulo, SP)"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                    disabled={isSearching}
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full h-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-white transition-all shadow-sm"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" /> Varrer Oportunidades
                      </>
                    )}
                  </button>
                </div>
              </form>

              {isSearching && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-xs sm:text-sm">Varrendo Google Maps e perfis públicos do Instagram...</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Identificando empresas sem site, avaliações reais e números de WhatsApp.</p>
                  </div>
                </div>
              )}

              {liveResults && liveResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  {/* Abas de Filtro de Site na Varredura */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setLiveSiteFilter("no_website")}
                        className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 ${
                          liveSiteFilter === "no_website"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🔥 Sem Site ({liveResults.filter((r) => !r.has_website).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveSiteFilter("has_website")}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                          liveSiteFilter === "has_website"
                            ? "bg-muted text-foreground border border-border shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🌐 Com Site ({liveResults.filter((r) => r.has_website).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveSiteFilter("all")}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                          liveSiteFilter === "all"
                            ? "bg-muted text-foreground border border-border shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todas ({liveResults.length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                        onClick={() => {
                          const displayedIndices = displayedLiveResults.map((r) => liveResults.indexOf(r));
                          const allDisplayedSelected = displayedIndices.length > 0 && displayedIndices.every((i) => selectedLiveIndices.has(i));
                          const next = new Set(selectedLiveIndices);
                          if (allDisplayedSelected) {
                            displayedIndices.forEach((i) => next.delete(i));
                          } else {
                            displayedIndices.forEach((i) => next.add(i));
                          }
                          setSelectedLiveIndices(next);
                        }}
                      >
                        {displayedLiveResults.length > 0 && displayedLiveResults.every((r) => selectedLiveIndices.has(liveResults.indexOf(r)))
                          ? "Desmarcar visíveis"
                          : "Selecionar visíveis"}
                      </button>
                      <button
                        type="button"
                        onClick={handleImportLive}
                        disabled={selectedLiveIndices.size === 0 || importMutation.isPending}
                        className="rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                      >
                        {importMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        Importar {selectedLiveIndices.size} para o Radar
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-auto rounded-xl border border-border bg-background/30">
                    <Table>
                      <TableHeader className="bg-muted/40 sticky top-0 z-10">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="px-3.5 py-2.5 w-8">
                            <input
                              type="checkbox"
                              className="rounded border-border bg-background"
                              checked={
                                displayedLiveResults.length > 0 &&
                                displayedLiveResults.every((r) => selectedLiveIndices.has(liveResults.indexOf(r)))
                              }
                              onChange={(e) => {
                                const displayedIndices = displayedLiveResults.map((r) => liveResults.indexOf(r));
                                const next = new Set(selectedLiveIndices);
                                if (e.target.checked) {
                                  displayedIndices.forEach((i) => next.add(i));
                                } else {
                                  displayedIndices.forEach((i) => next.delete(i));
                                }
                                setSelectedLiveIndices(next);
                              }}
                            />
                          </TableHead>
                          <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Empresa</TableHead>
                          <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">WhatsApp</TableHead>
                          <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Instagram</TableHead>
                          <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Status do Site</TableHead>
                          <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/40">
                        {displayedLiveResults.map((lead) => {
                          const globalIndex = liveResults.indexOf(lead);
                          const isSelected = selectedLiveIndices.has(globalIndex);
                          return (
                            <TableRow
                              key={lead.dedupe_key || globalIndex}
                              className={`transition-colors border-border/40 ${isSelected ? "bg-primary/10" : "hover:bg-muted/20"}`}
                            >
                              <TableCell className="px-3.5 py-2.5">
                                <input
                                  type="checkbox"
                                  className="rounded border-border bg-background"
                                  checked={isSelected}
                                  onChange={() => {
                                    const next = new Set(selectedLiveIndices);
                                    if (next.has(globalIndex)) next.delete(globalIndex);
                                    else next.add(globalIndex);
                                    setSelectedLiveIndices(next);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="px-3.5 py-2.5">
                                <p className="font-semibold text-foreground tracking-tight text-xs sm:text-sm">{lead.name}</p>
                                <p className="text-[11px] font-normal text-muted-foreground/80 mt-0.5">
                                  {lead.rating ? `⭐ ${lead.rating} (${lead.reviews_count ?? 0} avaliações)` : lead.source}
                                </p>
                              </TableCell>
                              <TableCell className="px-3.5 py-2.5 text-xs font-mono">
                                {lead.whatsapp ? (
                                  <a
                                    href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium hover:underline"
                                    title="Abrir WhatsApp no celular ou web"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{formatPhone(lead.whatsapp)}</span>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3.5 py-2.5 text-xs">
                                {lead.instagram ? (
                                  <a
                                    href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-normal text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                                  >
                                    <Instagram className="h-3 w-3 text-muted-foreground/70" />
                                    <span>{lead.instagram}</span>
                                  </a>
                                ) : (
                                  <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${lead.name}" "${lead.city}"`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-transparent px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all"
                                    title="Buscar Instagram desta empresa"
                                  >
                                    <Instagram className="h-3 w-3 text-muted-foreground/70" />
                                    <span>Achar perfil</span>
                                  </a>
                                )}
                              </TableCell>
                              <TableCell className="px-3.5 py-2.5 whitespace-nowrap">
                                {lead.has_website ? (
                                  <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                                    Já tem site
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                                    ⭐ Sem site
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-3.5 py-2.5">
                                <span className="font-semibold text-xs sm:text-sm tabular-nums text-foreground">{lead.score}</span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FERRAMENTA 2: RADAR CNAE & BASE CNPJ (FULL WIDTH) */}
        {prospectEngine === "cnae" && (
          <Card className="w-full border-border bg-card shadow-xs">
            <CardHeader className="pb-4 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Ferramenta 2: Radar CNAE & Base CNPJ (Receita Federal)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Auditoria inteligente por Atividade Econômica (CNAE) e CNPJs: filtre empresas sem site e descubra sócios decisores (QSA).
                </CardDescription>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                🏛️ Dados Oficiais da Receita
              </span>
            </CardHeader>
            <CardContent>
              <CnpjLookupCard onAddCompany={handleAddCnpjCompany} />
            </CardContent>
          </Card>
        )}

        {/* UTILITÁRIOS: IMPORTAR CSV E CADASTRO MANUAL (2 COLUNAS) */}
        {prospectEngine === "utilities" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Importar CSV */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Importar Lista via CSV
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Suba sua planilha de leads. Reconhece nome, nicho, cidade, telefone, whatsapp, instagram e site.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-background/40 hover:bg-background/70 cursor-pointer transition-all">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <span className="text-xs text-foreground font-medium">Clique para selecionar o arquivo .csv</span>
                  <span className="text-[11px] text-muted-foreground/80">Deduplicação e pontuação automáticas</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                </label>

                {preview && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium">{importable.length} nova(s)</span>
                      <span className="text-muted-foreground">
                        {preview.filter((r) => r.duplicateOf).length} dup · {preview.filter((r) => r.error).length} erro
                      </span>
                    </div>

                    <div className="max-h-56 overflow-auto rounded-xl border border-border bg-background/40">
                      <Table>
                        <TableHeader className="bg-muted/40 text-[11px]">
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="px-3 py-2 text-[11px] uppercase font-semibold text-muted-foreground">Empresa</TableHead>
                            <TableHead className="px-3 py-2 text-[11px] uppercase font-semibold text-muted-foreground">Cidade</TableHead>
                            <TableHead className="px-3 py-2 text-[11px] uppercase font-semibold text-muted-foreground">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/40">
                          {preview.map((row) => (
                            <TableRow key={row.line} className="hover:bg-muted/20 border-border/40 transition-colors">
                              <TableCell className="px-3 py-2 font-medium text-foreground truncate max-w-[140px]">
                                {row.draft?.name ?? `Linha ${row.line}`}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-muted-foreground truncate max-w-[100px]">
                                {row.draft?.city ?? "—"}
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                {row.error ? (
                                  <span className="text-rose-400">Erro</span>
                                ) : row.duplicateOf ? (
                                  <span className="text-amber-400">Dup</span>
                                ) : (
                                  <span className="text-emerald-400">Pronta</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50 shadow-sm"
                        disabled={!importable.length || importMutation.isPending}
                        onClick={() =>
                          importMutation.mutate(importable.map((row) => row.draft!).filter(Boolean))
                        }
                      >
                        {importMutation.isPending ? "Importando..." : `Importar ${importable.length} leads`}
                      </button>
                      <button
                        className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setPreview(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Cadastro Manual */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Cadastro Manual de Oportunidade
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Cadastre um lead diretamente no seu Radar de Prospecção com cálculo imediato de score.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Nome da Empresa *</label>
                    <input
                      name="name"
                      placeholder="Ex: Consultório Odontológico Sorrir Mais"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Nicho</label>
                      <input
                        name="niche"
                        placeholder="Ex: Dentista, Barbearia"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Cidade</label>
                      <input
                        name="city"
                        placeholder="Ex: Curitiba, PR"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">WhatsApp / Telefone</label>
                      <input
                        name="whatsapp"
                        placeholder="(41) 99999-9999"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Site (se houver)</label>
                      <input
                        name="website"
                        placeholder="Ex: www.clinica.com.br"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-sm mt-2"
                  >
                    {createMutation.isPending ? "Salvando..." : "Salvar no Radar"}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FERRAMENTA 4: GERENCIADOR EXCLUSIVO DE DEMOS DE CLIENTES */}
        {prospectEngine === "demos" && (
          <Card className="w-full border-border bg-card shadow-xs">
            <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" /> Central de Demonstrações Ativas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Páginas demonstrativas de clientes geradas no sistema. Elas ficam 100% isoladas aqui e não aparecem nos seus Biolinks pessoais.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                  <Sparkles className="h-3.5 w-3.5" /> {demoPages.length} {demoPages.length === 1 ? "demo cadastrada" : "demos cadastradas"}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Barra de Busca e Filtro de Demos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    value={demoSearch}
                    onChange={(e) => setDemoSearch(e.target.value)}
                    placeholder="Filtrar por empresa, modelo ou link..."
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                  {demoSearch && (
                    <button
                      type="button"
                      onClick={() => setDemoSearch("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground self-start sm:self-center">
                  Exibindo {filteredDemos.length} de {demoPages.length} demonstrações
                </p>
              </div>

              {filteredDemos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Nenhuma página demonstrativa encontrada</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      {demoSearch
                        ? "Nenhum resultado corresponde aos termos da sua pesquisa."
                        : "Use o Radar Google Maps ou Radar CNAE para encontrar oportunidades e clique em 'Gerar Demo' para criar demonstrações prontas."}
                    </p>
                  </div>
                  {!demoSearch && (
                    <button
                      type="button"
                      onClick={() => setProspectEngine("maps")}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-xs font-semibold shadow transition-all"
                    >
                      <Globe2 className="h-4 w-4" /> Abrir Radar Google Maps
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-background/40">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa & Slug</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modelo Visual</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link Demonstrativo</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Criação</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações de Venda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/40">
                      {filteredDemos.map((page) => {
                        const modelVariant = (page.social_links as any)?.model_variant || "Design Pro";
                        const googleRating = (page.social_links as any)?.google_rating;
                        const reviewsCount = (page.social_links as any)?.reviews_count;
                        const publicUrl = `https://eialink.com.br/p/${page.slug}`;

                        return (
                          <TableRow key={page.id} className="hover:bg-muted/20 border-border/40 transition-colors">
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {page.avatar_url ? (
                                  <img
                                    src={page.avatar_url}
                                    alt=""
                                    className="h-9 w-9 rounded-xl object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-500/20">
                                    {page.display_name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[200px]">
                                    {page.display_name}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {googleRating && (
                                      <span className="text-[10px] text-amber-400 font-medium">
                                        ⭐ {googleRating} {reviewsCount ? `(${reviewsCount})` : ""}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      /{page.slug}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-medium text-purple-300">
                                <Sparkles className="h-3 w-3 text-purple-400" />
                                {modelVariant}
                              </span>
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-xs text-muted-foreground hover:text-purple-300 underline-offset-2 hover:underline truncate max-w-[180px] sm:max-w-[240px]"
                                  title={publicUrl}
                                >
                                  {publicUrl}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyDemoUrl(page.slug, page.id)}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Copiar link da demonstração"
                                >
                                  {copiedDemoId === page.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(page.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Visualizar Demo */}
                                <a
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-transparent px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                                  title="Abrir demonstração em nova aba"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">Ver</span>
                                </a>

                                {/* Copiar Pitch WhatsApp */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyDemoPitch(page)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold transition-all"
                                  title="Copiar mensagem com link para envio no WhatsApp"
                                >
                                  {copiedPitchDemoId === page.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Pitch WhatsApp</span>
                                    </>
                                  )}
                                </button>

                                {/* Personalizar no Builder */}
                                <Link
                                  to="/builder"
                                  search={{ page: page.id }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-transparent px-2.5 py-1.5 text-xs text-muted-foreground hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all"
                                  title="Ajustar dados e fotos no Builder"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">Editar</span>
                                </Link>

                                {/* Dropdown Menu de Mais Ações */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                      title="Mais opções da demo"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem
                                      onClick={() => void handleRegenerateDemoForPage(page)}
                                      disabled={regeneratingPageId === page.id}
                                      className="cursor-pointer text-xs text-purple-300 hover:text-purple-200 focus:text-purple-200 focus:bg-purple-500/10 font-medium"
                                    >
                                      {regeneratingPageId === page.id ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-purple-400" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                      )}
                                      <span>Trocar Modelo</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => void handleMakeDemoOfficialDirect(page)}
                                      disabled={makingOfficialDemoId === page.id}
                                      className="cursor-pointer text-xs"
                                    >
                                      {makingOfficialDemoId === page.id ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-teal-400" />
                                      ) : (
                                        <CheckCircle className="h-3.5 w-3.5 mr-2 text-teal-400" />
                                      )}
                                      <span>Tornar Oficial</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setTransferModalData({
                                          isOpen: true,
                                          page: {
                                            id: page.id,
                                            displayName: page.display_name,
                                            slug: page.slug,
                                            phone: page.whatsapp,
                                            instagram: (page.social_links as any)?.instagram || null,
                                            isDemo: true,
                                          },
                                        });
                                      }}
                                      className="cursor-pointer text-xs"
                                    >
                                      <Share2 className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                      <span>Entregar / Transferir</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() => void handleDeleteDemo(page.id, page.display_name)}
                                      disabled={deletingDemoId === page.id}
                                      className="cursor-pointer text-xs text-rose-400 hover:text-rose-300 focus:text-rose-400 focus:bg-rose-500/10"
                                    >
                                      {deletingDemoId === page.id ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-rose-400" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                                      )}
                                      <span>Excluir Demonstração</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Pipeline */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                Pipeline de Prospecção
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
                  {companies.length} {companies.length === 1 ? "lead" : "leads"}
                </span>
              </CardTitle>
              {companies.length > 0 && (
                <button
                  onClick={handleClearAllRadar}
                  disabled={clearRadarMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 text-xs font-medium transition-colors"
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
                placeholder="Buscar empresa, nicho..."
                className="h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 sm:w-48 transition-colors"
              />
              <select
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 sm:w-auto transition-colors"
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
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 sm:w-auto transition-colors"
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
              <select
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 sm:w-auto transition-colors"
                value={siteFilter}
                onChange={(event) => setSiteFilter(event.target.value as typeof siteFilter)}
              >
                <option value="all">Todos os sites</option>
                <option value="no_website">🔥 Apenas Sem Site</option>
                <option value="has_website">🌐 Apenas Com Site</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Empresa</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Temperatura</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Etapa</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Último contato</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => {
                  const demo = parseDemoInfo(company);
                  const isOfficial = company.notes?.includes("[Página Oficializada]") || company.status === "cliente";
                  return (
                    <TableRow key={company.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-semibold text-foreground tracking-tight text-sm">{company.name}</p>
                        <div className="text-xs font-normal text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span>
                            {[company.niche, company.city, company.has_website ? "tem site" : "sem site"]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>

                          {(company.whatsapp || company.phone) ? (
                            <a
                              href={whatsappLink(company) || `https://wa.me/${(company.whatsapp || company.phone)?.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-mono hover:underline font-medium"
                              title="Abrir WhatsApp direto no celular ou web"
                            >
                              <MessageCircle className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                              <span>{formatPhone(company.whatsapp || company.phone)}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWhatsModalCompany(company)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-emerald-400 transition-colors"
                              title="Definir WhatsApp da empresa"
                            >
                              <MessageCircle className="h-2.5 w-2.5" /> + Inserir WhatsApp
                            </button>
                          )}
                          {company.instagram ? (
                            <a
                              href={`https://instagram.com/${company.instagram.replace("@", "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-pink-400 font-normal transition-colors"
                            >
                              <Instagram className="h-3 w-3 text-muted-foreground/70" /> {company.instagram}
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${company.name}" "${company.city || ""}"`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-pink-400 transition-colors"
                              title="Achar perfil no Instagram"
                            >
                              <Instagram className="h-2.5 w-2.5" /> Achar @IG
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <LeadTemperatureBadge score={company.score} />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          className="h-8 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted/40 focus:ring-1 focus:ring-primary/40 transition-colors"
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
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs font-normal text-muted-foreground whitespace-nowrap">
                        {company.last_contacted_at
                          ? new Date(company.last_contacted_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {demo.url ? (
                            <>
                              <HoverCard openDelay={150} closeDelay={150}>
                                <HoverCardTrigger asChild>
                                  <a
                                    href={demo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                                    title="Ver Página Pro no ar"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70" />
                                    <span>Ver</span>
                                  </a>
                                </HoverCardTrigger>
                                <HoverCardContent align="end" className="w-80 border-border bg-popover text-popover-foreground backdrop-blur-md p-4 shadow-2xl space-y-3 z-50">
                                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                      <span className="text-xs font-semibold text-foreground">Modelo Demonstrativo</span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground font-mono">EIA Link</span>
                                  </div>
                                  <div className="rounded-lg border border-border/70 bg-background/80 p-3 space-y-1">
                                    <p className="text-xs font-bold text-foreground tracking-tight">{company.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {[company.niche, company.city].filter(Boolean).join(" · ")}
                                    </p>
                                    <div className="pt-2 flex items-center justify-between text-[11px]">
                                      <span className="text-emerald-400 font-medium">WhatsApp Pronto</span>
                                      <span className="text-purple-400 font-mono">Online</span>
                                    </div>
                                  </div>
                                  <div className="pt-1">
                                    <a
                                      href={demo.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                                    >
                                      Abrir página em nova aba <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                              {demo.pageId && (
                                <Link
                                  to="/builder"
                                  search={{ page: demo.pageId }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                                  title="Editar no Construtor"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground/70" />
                                  <span>Editar</span>
                                </Link>
                              )}
                            </>
                          ) : (
                            <button
                              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 text-primary dark:text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary/25 shadow-[0_0_14px_-3px_rgba(168,85,247,0.4)] transition-all"
                              onClick={() => void handleGenerateDemo(company)}
                              disabled={creatingPageId === company.id}
                              title="Gerar modelo demonstrativo para prospecção"
                            >
                              {creatingPageId === company.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary dark:text-white" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                              )}
                              <span>{creatingPageId === company.id ? "Gerando..." : "Gerar Demo 🪄"}</span>
                            </button>
                          )}

                          {whatsappLink(company) ? (
                            <a
                              href={whatsappLink(company)!}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (!canRunAction(`whats-${company.id}`)) {
                                  e.preventDefault();
                                  setFeedback(
                                    `Aguarde ${remainingCooldown(`whats-${company.id}`)}s para enviar novamente para ${company.name}.`,
                                  );
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                                company.status === "contatado"
                                  ? "border border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium hover:bg-amber-500/20 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]"
                                  : demo.url && (company.status === "novo")
                                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 shadow-[0_0_14px_-3px_rgba(16,185,129,0.3)]"
                                    : "border border-border/60 bg-transparent text-muted-foreground font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                              }`}
                              title={company.status === "contatado" ? `Follow-up via WhatsApp com ${company.name}` : `Enviar proposta via WhatsApp para ${company.name}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-current" />
                              <span>{company.status === "contatado" ? "Follow-up" : "WhatsApp"}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWhatsModalCompany(company)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                                demo.url && (company.status === "novo")
                                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 shadow-[0_0_14px_-3px_rgba(16,185,129,0.3)]"
                                  : "border border-border/60 bg-transparent text-muted-foreground font-medium hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                              }`}
                              title={`Definir WhatsApp e enviar proposta para ${company.name}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-current" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleInstagramApproach(company)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-transparent text-muted-foreground px-2.5 py-1.5 text-xs font-medium hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all"
                            title={
                              copiedInstagramCompanyId === company.id
                                ? "Mensagem copiada!"
                                : company.instagram
                                  ? `Copiar pitch e abrir Direct de @${cleanInstagramHandle(company.instagram)}`
                                  : "Definir perfil e abrir Direct no Instagram com mensagem pronta"
                            }
                          >
                            {copiedInstagramCompanyId === company.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Instagram className="h-3.5 w-3.5 text-muted-foreground/70" />
                            )}
                            <span>
                              {copiedInstagramCompanyId === company.id
                                ? "Copiado!"
                                : "Direct IG"}
                            </span>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                title="Mais opções"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {/* Opção Trocar Modelo / Gerar Modelo universal para TODAS as empresas */}
                                <DropdownMenuItem
                                  onClick={() => void handleRegenerateDemo(company)}
                                  disabled={regeneratingPageId === company.id || creatingPageId === company.id}
                                  className="cursor-pointer text-xs text-purple-300 hover:text-purple-200 focus:text-purple-200 focus:bg-purple-500/10 font-medium"
                                >
                                  {regeneratingPageId === company.id || creatingPageId === company.id ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-purple-400" />
                                  ) : (
                                    <RotateCcw className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                  )}
                                  <span>
                                    {regeneratingPageId === company.id
                                      ? "Trocando modelo..."
                                      : demo.url
                                        ? "Trocar Modelo"
                                        : "Gerar / Escolher Modelo"}
                                  </span>
                                </DropdownMenuItem>

                                {demo.url && (
                                  <>
                                    {demo.pageId && (
                                      <DropdownMenuItem
                                        onClick={() => void handleMakeOfficial(company, demo.pageId!)}
                                        disabled={actionLoadingId === demo.pageId || isOfficial}
                                        className="cursor-pointer text-xs"
                                      >
                                        {actionLoadingId === demo.pageId ? (
                                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-teal-400" />
                                        ) : (
                                          <CheckCircle className={`h-3.5 w-3.5 mr-2 ${isOfficial ? "text-emerald-400" : "text-muted-foreground"}`} />
                                        )}
                                        <span>{isOfficial ? "Página Oficializada" : "Tornar Oficial"}</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem
                                      onClick={() => handleOpenTransfer(company, demo.pageId || "", demo.url!)}
                                      className="cursor-pointer text-xs"
                                    >
                                      <Share2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                      <span>Entregar / Transferir</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                onClick={() => setActiveCompany(company)}
                                className="cursor-pointer text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>Registrar Abordagem</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDeleteCompany(company)}
                                className="cursor-pointer text-xs text-rose-400 hover:text-rose-300 focus:text-rose-400 focus:bg-rose-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                                <span>Remover do Radar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma empresa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      <CopyConfigModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
      />
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
  const [pitch, setPitch] = useState(() => buildWhatsAppMessage(company));
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
