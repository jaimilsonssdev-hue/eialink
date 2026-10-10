import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Copy,
  Dumbbell,
  ExternalLink,
  Eye,
  HeartPulse,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Target,
  Trash2,
  UserCheck,
  UtensilsCrossed,
  X,
  Dog,
  Wrench,
  Compass,
  Calculator,
  PenTool,
  Glasses,
  Brain,
  ShieldCheck,
  Laptop,
  Sun,
  UserRound,
  Briefcase,
  Wine,
  Zap,
  ChevronDown,
  Clapperboard,
  Smartphone,
  Share2,
  LayoutGrid,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageService, type OwnedPage } from "@/modules/page/services/PageService";
import { TransferPageModal } from "@/components/prospecting/TransferPageModal";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { UpgradePrompt } from "@/modules/billing/components/UpgradePrompt";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { publicPageUrl } from "@/lib/public-page-url";
import { lookupBusinessProfile } from "@/modules/prospecting/LiveProspectingEngine";
import { lookupBusinessProfileFn } from "@/modules/prospecting/prospecting.functions";
import { getPresetForCompany, getVariantsForNiche } from "@/modules/prospecting/nichePresets";
import type { ProspectDraft } from "@/modules/prospecting/types";
import { normalizeBusinessLink, normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";

export const Route = createFileRoute("/_authenticated/pages")({
  component: PagesWorkspace,
  head: () => ({ meta: [{ title: "Meus Biolinks — EIA Link" }] }),
});

interface NicheQuickOption {
  key: string;
  name: string;
  description: string;
  icon: typeof Stethoscope;
  color: string;
  bgLight: string;
}

const NICHE_OPTIONS: NicheQuickOption[] = [
  {
    key: "barbearia",
    name: "Barbearia",
    description: "Cortes degradê, barba terapia na toalha quente e agendamento",
    icon: Scissors,
    color: "text-amber-400",
    bgLight: "bg-amber-500/10 border-amber-500/20",
  },
  {
    key: "beleza",
    name: "Salão & Estética",
    description: "Unhas em gel, sobrancelhas, escovas, estética facial e agendamento",
    icon: Sparkles,
    color: "text-pink-400",
    bgLight: "bg-pink-500/10 border-pink-500/20",
  },
  {
    key: "bebidas",
    name: "Adega & Bebidas",
    description: "Cervejas, chopp, destilados, gelo, carvão e delivery WhatsApp",
    icon: Wine,
    color: "text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "loja",
    name: "Lojas & E-commerce",
    description: "Moda, calçados, bolsas, acessórios e catálogo online",
    icon: ShoppingBag,
    color: "text-indigo-400",
    bgLight: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    key: "delivery",
    name: "Delivery & Lanches",
    description: "Pizzas, hambúrgueres artesanais, marmitex e pedidos rápidos",
    icon: UtensilsCrossed,
    color: "text-amber-400",
    bgLight: "bg-amber-500/10 border-amber-500/20",
  },
  {
    key: "restaurante",
    name: "Restaurantes",
    description: "Bistrôs, gastronomia executiva, pratos à la carte e reservas",
    icon: UtensilsCrossed,
    color: "text-orange-400",
    bgLight: "bg-orange-500/10 border-orange-500/20",
  },
  {
    key: "sorveteria",
    name: "Sorveteria & Açaí",
    description: "Gelatos artesanais, taças de sorvete, açaí gourmet e sobremesas",
    icon: Sun,
    color: "text-cyan-400",
    bgLight: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    key: "oficina",
    name: "Oficina & Auto Center",
    description: "Mecânica preventiva, injeção, pneus, suspensão e socorro",
    icon: Wrench,
    color: "text-red-400",
    bgLight: "bg-red-500/10 border-red-500/20",
  },
  {
    key: "clinica",
    name: "Saúde & Clínica",
    description: "Consultórios médicos, especialistas, exames e saúde integrada",
    icon: HeartPulse,
    color: "text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "psicologia",
    name: "Terapeutas & Psicólogos",
    description: "Psicologia clínica, psicanálise, acolhimento e terapia online",
    icon: Brain,
    color: "text-teal-400",
    bgLight: "bg-teal-500/10 border-teal-500/20",
  },
  {
    key: "petshop",
    name: "Pet Shop & Ração",
    description: "Banho, tosa, rações premium, veterinária e acessórios",
    icon: Dog,
    color: "text-yellow-400",
    bgLight: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    key: "advocacia",
    name: "Advogado & Jurídico",
    description: "Direito civil, trabalhista, previdenciário e empresarial",
    icon: Scale,
    color: "text-blue-400",
    bgLight: "bg-blue-500/10 border-blue-500/20",
  },
  {
    key: "odontologia",
    name: "Dentista & Odonto",
    description: "Implantes, clareamento a laser, ortodontia e estética dental",
    icon: Stethoscope,
    color: "text-cyan-400",
    bgLight: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    key: "construcao",
    name: "Construção Civil",
    description: "Obras residenciais, reformas, engenharia e acabamentos",
    icon: Building2,
    color: "text-orange-500",
    bgLight: "bg-orange-500/10 border-orange-500/20",
  },
  {
    key: "imobiliaria",
    name: "Imobiliária",
    description: "Casas em condomínio, apartamentos e assessoria imobiliária",
    icon: Compass,
    color: "text-indigo-400",
    bgLight: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    key: "seguros",
    name: "Corretora de Seguros",
    description: "Seguro auto, residencial, vida, patrimonial e planos de saúde",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "autonomo",
    name: "Profissional Autônomo",
    description: "Prestadores de serviços, técnicos, reparos e maridos de aluguel",
    icon: Briefcase,
    color: "text-slate-400",
    bgLight: "bg-slate-500/10 border-slate-500/20",
  },
  {
    key: "pessoal",
    name: "Página Pessoal",
    description: "Criadores de conteúdo, palestrantes, consultores e biolink",
    icon: UserRound,
    color: "text-purple-400",
    bgLight: "bg-purple-500/10 border-purple-500/20",
  },
  {
    key: "fitness",
    name: "Fitness & Personal",
    description: "Academias, musculação, personal trainers e studios de treino",
    icon: Dumbbell,
    color: "text-rose-400",
    bgLight: "bg-rose-500/10 border-rose-500/20",
  },
  {
    key: "nutricao",
    name: "Nutricionista",
    description: "Reeducação alimentar, emagrecimento consciente e bioimpedância",
    icon: Sparkles,
    color: "text-lime-400",
    bgLight: "bg-lime-500/10 border-lime-500/20",
  },
  {
    key: "costura",
    name: "Costureira & Ateliê",
    description: "Ajustes, reformas de roupas, vestidos sob medida e alfaiataria",
    icon: Scissors,
    color: "text-pink-400",
    bgLight: "bg-pink-500/10 border-pink-500/20",
  },
  {
    key: "tecnologia",
    name: "Tecnologia & TI",
    description: "Assistência técnica, notebooks, celulares e redes",
    icon: Laptop,
    color: "text-sky-400",
    bgLight: "bg-sky-500/10 border-sky-500/20",
  },
  {
    key: "geral",
    name: "Empresas Gerais",
    description: "Apresentação corporativa e contato ágil para outros ramos",
    icon: Briefcase,
    color: "text-violet-400",
    bgLight: "bg-violet-500/10 border-violet-500/20",
  },
];

function PagesWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("odontologia");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [wizardName, setWizardName] = useState("");
  const [wizardWhatsapp, setWizardWhatsapp] = useState("");
  const [wizardCity, setWizardCity] = useState("");
  const [wizardInstagram, setWizardInstagram] = useState("");
  const [wizardPhotos, setWizardPhotos] = useState<string[]>([]);
  const [wizardAvatarUrl, setWizardAvatarUrl] = useState<string | null>(null);
  const [isCreatingWizard, setIsCreatingWizard] = useState(false);
  const [creationEngine, setCreationEngine] = useState<"express" | "premium" | "cinematic">("express");

  // Studio Fast State
  const [fastInput, setFastInput] = useState("");
  const [isFastCreating, setIsFastCreating] = useState(false);
  const [fastMode, setFastMode] = useState<"express" | "ai" | null>(null);
  const [fastFeedback, setFastFeedback] = useState<string | null>(null);

  // Auto-importador do Perfil do Google Maps / Link
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found_full" | "found_name" | "error">("idle");
  const [lookupResults, setLookupResults] = useState<ProspectDraft[]>([]);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [viewMode, setViewMode] = useState<"selector" | "grid">("selector");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const isOwner = data.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setIsAdmin(isOwner || !!roles?.some((r) => r.role === "admin"));
    });
  }, []);

  const access = usePlanAccess();
  const pages = useQuery({
    queryKey: ["owned-bio-pages"],
    queryFn: () => PageService.listOwnedPages(),
  });

  const demoPages = useQuery({
    queryKey: ["admin-demo-pages-count"],
    enabled: isAdmin,
    queryFn: () => PageService.listDemoPages(),
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId: string) => PageService.deletePage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-bio-pages"] });
    },
    onError: (err) => {
      alert(`Erro ao excluir página: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    },
    onSettled: () => setDeletingId(null),
  });

  function handleDeletePage(pageId: string, pageName: string) {
    if (
      confirm(
        `Tem certeza que deseja excluir permanentemente a página "${pageName}"? Esta ação removerá os dados vinculados e não pode ser desfeita.`,
      )
    ) {
      setDeletingId(pageId);
      deleteMutation.mutate(pageId);
    }
  }

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
  const [officialLoadingId, setOfficialLoadingId] = useState<string | null>(null);

  async function handleMakeOfficial(pageOrId: OwnedPage | string) {
    const pageId = typeof pageOrId === "string" ? pageOrId : pageOrId.id;
    const confirmed = window.confirm(
      "Você tem certeza de que deseja tornar esta página oficial da sua conta?\n\nIsso remove a tarja de demonstração e a torna pública definitiva."
    );
    if (!confirmed) return;

    setOfficialLoadingId(pageId);
    try {
      await PageService.makePageOfficial(pageId);
      void pages.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao tornar oficial.";
      alert(msg);
    } finally {
      setOfficialLoadingId(null);
    }
  }

  async function handleRevokeOfficial(pageOrId: OwnedPage | string) {
    const pageId = typeof pageOrId === "string" ? pageOrId : pageOrId.id;
    const confirmed = window.confirm(
      "Deseja revogar a oficialização desta página e retornar ao status de demonstração?\n\nA página voltará a exibir a tarja de demo."
    );
    if (!confirmed) return;

    setOfficialLoadingId(pageId);
    try {
      await PageService.revokePageOfficial(pageId);
      void pages.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao revogar oficialização.";
      alert(msg);
    } finally {
      setOfficialLoadingId(null);
    }
  }

  function handleOpenTransfer(page: OwnedPage) {
    const isDemo = Boolean((page.social_links as any)?.is_demo);
    setTransferModalData({
      isOpen: true,
      page: {
        id: page.id,
        displayName: page.display_name,
        slug: page.slug,
        phone: page.whatsapp,
        instagram: (page.social_links as any)?.instagram || null,
        isDemo,
      },
    });
  }

  function handleCopyUrl(slug: string) {
    const isCustom = Boolean(access.data?.isPro && access.data.features.custom_domain);
    const url = publicPageUrl(slug, isCustom);
    void navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function handleMagicCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!wizardName.trim()) return;

    const pageLimit = access.data?.limits.bio_pages ?? 1;
    if (pageLimit !== -1 && (pages.data?.length ?? 0) >= pageLimit) {
      setCreationError("Seu plano atingiu o limite de Biolinks. Faça upgrade para criar novas páginas.");
      setIsWizardOpen(false);
      return;
    }

    setIsCreatingWizard(true);
    setCreationError(null);
    try {
      const page = await PageService.createProspectDemoPage({
        companyName: wizardName.trim(),
        whatsapp: wizardWhatsapp.trim() || null,
        niche: selectedNiche,
        city: wizardCity.trim() || null,
        instagram: wizardInstagram.trim() || null,
        photos: wizardPhotos.length > 0 ? wizardPhotos : null,
        avatarUrl: wizardAvatarUrl || null,
        variantIndex: selectedVariantIndex,
        isDemo: false, // Página definitiva do cliente
        preferredTemplateId:
          creationEngine === "premium" || creationEngine === "cinematic"
            ? "cinematic-glass"
            : "site-maquina",
      });

      await pages.refetch();
      setIsWizardOpen(false);
      navigate({
        to: "/studio",
        search: { page: page.id },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a página.";
      setCreationError(message);
    } finally {
      setIsCreatingWizard(false);
    }
  }

  async function createBlankPage() {
    const pageLimit = access.data?.limits.bio_pages ?? 1;
    if (pageLimit !== -1 && (pages.data?.length ?? 0) >= pageLimit) {
      setCreationError("Seu plano permite um Biolink. Faça upgrade para criar outras páginas.");
      return;
    }
    setIsCreatingBlank(true);
    setCreationError(null);
    try {
      const page = await PageService.createPage({
        displayName: "Minha nova página",
        templateId: "default",
      });
      await pages.refetch();
      navigate({ to: "/studio", search: { page: page.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a página.";
      setCreationError(message);
    } finally {
      setIsCreatingBlank(false);
    }
  }

  async function handleLookupProfile() {
    const q = lookupQuery.trim();
    if (!q) return;

    // Extração e normalização reativa imediata do link
    const cleanExtracted = normalizeBusinessQuery(q);
    if (cleanExtracted.name && cleanExtracted.fromLink) {
      setWizardName(cleanExtracted.name);
      if (cleanExtracted.city) setWizardCity(cleanExtracted.city);
    }

    setIsLookingUp(true);
    setLookupStatus("loading");
    setLookupFeedback(null);
    setLookupResults([]);

    try {
      let results: ProspectDraft[] = [];
      try {
        results = await lookupBusinessProfile(q);
      } catch (err) {
        console.warn("[Lookup] Falha na busca direta no cliente, tentando via servidor:", err);
        results = await lookupBusinessProfileFn({ data: { query: q } });
      }

      if (results.length === 1) {
        applyProfileData(results[0]);
        setLookupStatus("found_full");
        setLookupFeedback(`Perfil completo de "${results[0].name}" carregado com sucesso!`);
      } else if (results.length > 1) {
        setLookupResults(results);
        setLookupStatus("found_full");
        setLookupFeedback(`${results.length} empresas encontradas. Clique na sua abaixo para preencher.`);
      } else {
        // Se a busca remota não encontrou, utiliza o nome extraído limpo como fallback (nunca URL)
        const fallbackName = cleanExtracted.name || (!/^https?:\/\//i.test(q) ? q : "");
        if (fallbackName) {
          setWizardName(fallbackName);
          if (cleanExtracted.city) setWizardCity(cleanExtracted.city);
          const preset = getPresetForCompany(null, fallbackName);
          setSelectedNiche(preset.nicheKey);
          setLookupStatus("found_name");
          setLookupFeedback(
            cleanExtracted.fromLink
              ? `Nome "${fallbackName}" identificado a partir do link!`
              : "Nome preenchido! Complete os campos abaixo para gerar sua página."
          );
        } else {
          setLookupStatus("error");
          setLookupFeedback("Link reconhecido, mas não foi possível extrair o perfil. Digite o nome da empresa abaixo.");
        }
      }
    } catch (err) {
      const fallbackName = cleanExtracted.name || (!/^https?:\/\//i.test(q) ? q : "");
      if (fallbackName) {
        setWizardName(fallbackName);
        if (cleanExtracted.city) setWizardCity(cleanExtracted.city);
        const preset = getPresetForCompany(null, fallbackName);
        setSelectedNiche(preset.nicheKey);
        setLookupStatus("found_name");
        setLookupFeedback(`Nome "${fallbackName}" aproveitado do link.`);
      } else {
        setLookupStatus("error");
        setLookupFeedback(err instanceof Error ? err.message : "Erro ao pesquisar perfil.");
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  function applyProfileData(profile: ProspectDraft) {
    setWizardName(profile.name);
    if (profile.whatsapp || profile.phone) {
      setWizardWhatsapp(profile.whatsapp || profile.phone || "");
    }
    if (profile.city) {
      setWizardCity(profile.city);
    }
    if (profile.instagram) {
      setWizardInstagram(profile.instagram);
    }
    if (profile.photos && profile.photos.length > 0) {
      setWizardPhotos(profile.photos);
    }
    if (profile.avatar_url) {
      setWizardAvatarUrl(profile.avatar_url);
    }
    const preset = getPresetForCompany(profile.niche, profile.name);
    setSelectedNiche(preset.nicheKey);
    setLookupResults([]);
    setLookupStatus("found_full");
  }

  function openWizardWithNiche(nicheKey: string) {
    setSelectedNiche(nicheKey);
    setSelectedVariantIndex(0);
    setLookupQuery("");
    setLookupResults([]);
    setLookupFeedback(null);
    setLookupStatus("idle");
    setIsWizardOpen(true);
  }

  async function handleFastCreate(mode: "express" | "ai") {
    const raw = fastInput.trim();
    if (!raw) {
      if (mode === "ai") {
        navigate({ to: "/studio" });
        return;
      }
      setCreationError("Por favor, cole um link do Google Maps ou digite o nome da empresa.");
      return;
    }

    const pageLimit = access.data?.limits.bio_pages ?? 1;
    if (pageLimit !== -1 && (pages.data?.length ?? 0) >= pageLimit) {
      setCreationError("Seu plano atingiu o limite de Biolinks. Faça upgrade para criar novas páginas.");
      return;
    }

    setIsFastCreating(true);
    setFastMode(mode);
    setFastFeedback("Analisando dados do negócio...");
    setCreationError(null);

    try {
      const normalized = normalizeBusinessLink(raw);
      const query = normalized.searchTerm || raw;

      let companyName = query;
      let city = normalized.suggestedCity || "";
      let whatsapp: string | null = null;
      let nicheKey = "odontologia";
      let photos: string[] | null = null;
      let avatarUrl: string | null = null;
      let instagram: string | null = null;

      try {
        setFastFeedback("Identificando perfil, fotos e nicho...");
        let results: ProspectDraft[] = [];
        try {
          results = await lookupBusinessProfile(raw);
        } catch {
          results = await lookupBusinessProfileFn({ data: { query: raw } });
        }

        if (results && results.length > 0) {
          const lead = results[0];
          companyName = lead.name || companyName;
          city = lead.city || city;
          whatsapp = lead.whatsapp || lead.phone || null;
          photos = lead.photos || null;
          avatarUrl = lead.avatar_url || null;
          instagram = lead.instagram || null;
          const preset = getPresetForCompany(lead.niche, lead.name);
          nicheKey = preset.nicheKey;
        } else {
          const preset = getPresetForCompany(null, companyName);
          nicheKey = preset.nicheKey;
        }
      } catch (err) {
        console.warn("[FastCreate] Busca remota indisponível, usando inteligência local:", err);
        const preset = getPresetForCompany(null, companyName);
        nicheKey = preset.nicheKey;
      }

      setFastFeedback(mode === "ai" ? "Extraindo fotos do Instagram e construindo site..." : "Construindo página express...");

      const page = await PageService.createProspectDemoPage({
        companyName,
        whatsapp,
        niche: nicheKey,
        city: city || null,
        instagram,
        photos,
        avatarUrl,
        variantIndex: 0,
        isDemo: false,
        preferredTemplateId: mode === "ai" ? "cinematic-glass" : "site-maquina",
      });

      await pages.refetch();
      navigate({ to: "/studio", search: { page: page.id } });
    } catch (err: any) {
      console.error("[FastCreate] Erro ao criar página rápida:", err);
      setCreationError(err?.message || "Não foi possível criar a página rápida. Tente novamente.");
    } finally {
      setIsFastCreating(false);
      setFastMode(null);
      setFastFeedback(null);
    }
  }

  if (pages.isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
      </div>
    );
  }

  if (pages.isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400" role="alert">
        Não foi possível carregar seus Biolinks: {pages.error.message}
      </div>
    );
  }

  const pageList = pages.data ?? [];
  const publishedCount = pageList.filter((p) => p.published).length;
  const activePage = pageList.find((p) => p.id === selectedPageId) || pageList[0] || null;

  return (
    <div className="space-y-8 pb-16">
      {/* Header com estilo Padrão Ouro */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10 px-3 py-0.5 text-xs font-semibold text-[color:var(--primary)] mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Seu Portfólio Digital
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Meus Biolinks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas páginas, crie novas experiências de alta conversão ou personalize o visual do seu negócio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCreationEngine("premium");
              setIsWizardOpen(true);
            }}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            title="Criar uma nova página exclusiva com direção de arte gerada por IA"
          >
            <Sparkles className="h-4 w-4" />
            <span>Criar Página com IA</span>
          </button>
          <button
            onClick={() => {
              setCreationEngine("express");
              setIsWizardOpen(true);
            }}
            disabled={isCreatingWizard || access.isLoading}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            Criar Página Inteligente (30s)
          </button>
          <button
            onClick={() => void createBlankPage()}
            disabled={isCreatingBlank || access.isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 hover:bg-card px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Criar página em branco para personalizar do zero"
          >
            {isCreatingBlank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Em branco
          </button>
        </div>
      </header>

      {/* PAINEL STUDIO FAST — CRIAÇÃO EXECUTIVA EM 1 CLIQUE */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Studio Fast
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mt-1">
                Crie ou importe sua página em segundos
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Cole o link do Google Maps, busca do Google ou digite o nome do seu negócio para gerar um site profissional com fotos e serviços:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border border-border/80 bg-surface/90 p-2 shadow-inner focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary)]/20 transition-all">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={fastInput}
                  onChange={(e) => setFastInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleFastCreate("express");
                    }
                  }}
                  placeholder="Cole o link do Google Maps, busca do Google ou nome da empresa..."
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  disabled={isFastCreating}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleFastCreate("express")}
                  disabled={isFastCreating || !fastInput.trim()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                  title="Geração relâmpago baseada em template pronto, sem consumo de tokens"
                >
                  {isFastCreating && fastMode === "express" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  ) : (
                    <Zap className="h-4 w-4 fill-slate-950 text-slate-950" />
                  )}
                  <span>⚡ Criar Express</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleFastCreate("ai")}
                  disabled={isFastCreating}
                  className="flex-1 sm:flex-initial btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                  title="Criação guiada com direção de arte e Copiloto de IA"
                >
                  {isFastCreating && fastMode === "ai" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>✨ Criar com IA Studio</span>
                </button>
              </div>
            </div>

            {fastFeedback && (
              <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--primary)] animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{fastFeedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* Efeito de luz decorativo de fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[color:var(--primary)]/10 blur-3xl" />
      </section>

      {/* Configuração Manual Passo a Passo (Sanfona recolhida) */}
      <details className="group rounded-2xl border border-border/70 bg-card/50 overflow-hidden transition-all duration-200">
        <summary className="cursor-pointer p-4 px-5 text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors select-none">
          <span className="flex items-center gap-2">
            <span>Ou configure manualmente passo a passo por nicho</span>
            <span className="text-xs font-normal text-muted-foreground/70">(opcional)</span>
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
        </summary>

        <div className="p-5 pt-2 border-t border-border/40 space-y-4">
          <p className="text-xs text-muted-foreground">
            Escolha uma das estruturas prontas abaixo para abrir o assistente detalhado com modelos e dados específicos:
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {NICHE_OPTIONS.map((niche) => {
              const Icon = niche.icon;
              return (
                <button
                  key={niche.key}
                  type="button"
                  onClick={() => openWizardWithNiche(niche.key)}
                  className="group/item text-left p-3.5 rounded-xl border border-border/70 bg-surface/60 hover:border-[color:var(--primary)]/50 hover:bg-surface-elevated transition-all flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg border ${niche.bgLight} ${niche.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover/item:text-[color:var(--primary)] transition-colors">
                      {niche.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {niche.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* Erros e Alertas */}
      {creationError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400" role="alert">
          {creationError}
        </div>
      )}
      {creationError?.includes("upgrade") && <UpgradePrompt compact />}

      {/* Estatísticas Rápidas */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Total de Páginas</p>
          <p className="mt-1 text-2xl font-bold font-display">{pageList.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Publicadas & No Ar</p>
          <p className="mt-1 text-2xl font-bold font-display text-emerald-400">{publishedCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Plano Atual</p>
          <p className="mt-1 text-sm font-bold font-display flex items-center gap-1.5 text-[color:var(--primary)]">
            {access.data?.isPro ? "⭐ EIA Link PRO (Ilimitado)" : "EIA Link Essencial"}
          </p>
        </div>
      </section>

      {/* Alerta de Isolamento de Prospecção (Exclusivo Admin) */}
      {isAdmin && (demoPages.data?.length ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {demoPages.data!.length} {demoPages.data!.length === 1 ? "demonstração de cliente isolada" : "demonstrações de clientes isoladas"} na Área Administrativa
              </p>
              <p className="text-xs text-muted-foreground">
                Suas páginas pessoais abaixo estão limpas e organizadas. Todas as demos de clientes geradas ficam salvas com segurança no Super Admin.
              </p>
            </div>
          </div>
          <Link
            to="/admin/prospeccao"
            search={{ tab: "demos" } as any}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 self-start sm:self-auto shadow"
          >
            <span>Gerenciar Demos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Grid de Páginas do Usuário */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Suas Páginas Criadas</h2>
            <p className="text-xs text-muted-foreground">
              {pageList.length} {pageList.length === 1 ? "página cadastrada" : "páginas cadastradas no sistema"}
            </p>
          </div>
          {pageList.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "selector" ? "grid" : "selector")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-surface-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer self-start sm:self-auto"
            >
              {viewMode === "selector" ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Ver todas em grade</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  <span>Recolher em seletor</span>
                </>
              )}
            </button>
          )}
        </div>

        {pageList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nenhum Biolink criado ainda</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Elimine a barreira técnica! Use nosso Criador Inteligente para gerar um site profissional com fotos, vitrine e agendamento em apenas 30 segundos.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCreationEngine("premium");
                  setIsWizardOpen(true);
                }}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Criar Página com IA</span>
              </button>
              <button
                onClick={() => {
                  setCreationEngine("express");
                  setIsWizardOpen(true);
                }}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" /> Criar Rápido (30s)
              </button>
            </div>
          </div>
        ) : viewMode === "selector" && activePage ? (
          <div className="space-y-3">
            {/* Seletor Compacto Elegante */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-card/60 p-3 rounded-2xl border border-border">
              <div className="relative flex-1">
                <select
                  value={activePage.id}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border/80 bg-surface px-4 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-white shadow-2xs transition-all cursor-pointer pr-10"
                >
                  {pageList.map((page, idx) => (
                    <option key={page.id} value={page.id} className="bg-card text-foreground py-1">
                      {idx + 1}. {page.display_name} — {page.published ? "✓ Publicado (No Ar)" : "📝 Rascunho"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="text-xs text-muted-foreground px-2 sm:text-right shrink-0">
                Página <b>{pageList.findIndex((p) => p.id === activePage.id) + 1}</b> de <b>{pageList.length}</b>
              </div>
            </div>

            {/* Card Focado da Página com Opções: Ver, Compartilhar, Editar */}
            {(() => {
              const template = TemplateService.get(activePage.template_id ?? undefined);
              const isCustom = Boolean(access.data?.isPro && access.data.features.custom_domain);
              const publicUrl = publicPageUrl(activePage.slug, isCustom);

              return (
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-md transition-all space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Informações da Página & Capa/Avatar */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border border-border bg-muted shrink-0 shadow-sm">
                        {activePage.avatar_url || activePage.cover_url ? (
                          <img
                            src={activePage.avatar_url || activePage.cover_url || ""}
                            alt={activePage.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-black text-xl">
                            {activePage.display_name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground truncate">
                            {activePage.display_name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              activePage.published
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${activePage.published ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {activePage.published ? "Publicado" : "Rascunho"}
                          </span>
                          <span className="rounded-full bg-surface-elevated border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {template.name}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {activePage.description || "Página profissional completa e pronta para converter visitantes em clientes."}
                        </p>

                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-surface px-2.5 py-0.5 rounded-lg border border-border/60">
                          <span>eialink.com.br/p/{activePage.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões Principais de Ação: Ver, Compartilhar, Editar */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
                      {/* 1. Ver */}
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                        title="Ver página ao vivo no navegador"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </a>

                      {/* 2. Compartilhar */}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(activePage.slug)}
                        className="btn-secondary flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        title="Copiar link para compartilhar"
                      >
                        {copiedSlug === activePage.slug ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4" />
                            <span>Compartilhar</span>
                          </>
                        )}
                      </button>

                      {/* 3. Editar no Studio (Admin) ou Editor Seguro (Lojista) */}
                      {isAdmin ? (
                        <Link
                          to="/studio-pro"
                          search={{ page: activePage.id }}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                          title="Abrir página no Estúdio Criativo (Super Admin)"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Editar no Studio</span>
                        </Link>
                      ) : (
                        <Link
                          to="/builder"
                          search={{ page: activePage.id }}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all cursor-pointer"
                          title="Editar textos, fotos e produtos da sua página"
                        >
                          <Pencil className="h-4 w-4" />
                          <span>Editar Conteúdo</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeletePage(activePage.id, activePage.display_name)}
                        disabled={deletingId === activePage.id}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-rose-500/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 text-xs transition-colors cursor-pointer"
                        title="Excluir página permanentemente"
                      >
                        {deletingId === activePage.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageList.map((page) => {
              const template = TemplateService.get(page.template_id ?? undefined);
              const isCustom = Boolean(access.data?.isPro && access.data.features.custom_domain);
              const publicUrl = publicPageUrl(page.slug, isCustom);

              return (
                <article
                  key={page.id}
                  className="group rounded-2xl border border-border bg-card hover:border-[color:var(--primary)]/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[color:var(--primary)]/5 flex flex-col overflow-hidden"
                >
                  {/* Capa com Proporção 16:9 */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {page.cover_url ? (
                      <img
                        src={page.cover_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-muted-foreground">
                        <Sparkles className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Status Pill & Demo Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md ${
                          page.published
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${page.published ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        {page.published ? "Publicado" : "Rascunho"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        title="Aplicativo PWA oficial pronto para instalação no celular"
                      >
                        <Smartphone className="h-3 w-3" />
                        PWA
                      </span>
                    </div>

                    {/* Template Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-black/50 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-md">
                        {template.name}
                      </span>
                    </div>

                    {/* Avatar sobreposto */}
                    <div className="absolute -bottom-4 left-4 h-12 w-12 rounded-full border-2 border-card bg-surface overflow-hidden shadow-lg">
                      {page.avatar_url ? (
                        <img src={page.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-[color:var(--primary)] text-white font-bold text-lg">
                          {page.display_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-4 pt-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-[color:var(--primary)] transition-colors">
                        {page.display_name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {page.description || "Página profissional completa e pronta para converter visitantes em clientes."}
                      </p>
                    </div>

                    {/* Link Rápido com Copiar */}
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-elevated/40 border border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                      <span className="truncate font-mono text-[11px]">
                        eialink.com.br/p/{page.slug}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(page.slug)}
                        className="hover:text-foreground text-[color:var(--primary)] flex items-center gap-1 font-medium transition-colors"
                        title="Copiar link público"
                      >
                        {copiedSlug === page.slug ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Ações do Card */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
                      {isAdmin ? (
                        <Link
                          to="/studio-pro"
                          search={{ page: page.id }}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold transition-all shadow-xs"
                          title="Abrir no Estúdio Criativo (Super Admin)"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Editar no Studio
                        </Link>
                      ) : (
                        <Link
                          to="/builder"
                          search={{ page: page.id }}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2 text-xs font-bold transition-all shadow-xs"
                          title="Editar textos, fotos e produtos da sua página"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar Conteúdo
                        </Link>
                      )}


                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-surface-elevated text-foreground p-2 text-xs transition-colors"
                        title="Abrir página no navegador"
                        aria-label={`Abrir ${page.display_name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      {isAdmin && !(page.social_links as any)?.is_demo && (
                        <button
                          type="button"
                          onClick={() => handleRevokeOfficial(page.id)}
                          disabled={officialLoadingId === page.id}
                          className="inline-flex items-center justify-center rounded-xl border border-border bg-card hover:border-amber-500/40 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 p-2 text-xs transition-colors"
                          title="Revogar Oficialização (Voltar para Demonstração)"
                          aria-label="Revogar Oficialização"
                        >
                          {officialLoadingId === page.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeletePage(page.id, page.display_name)}
                        disabled={deletingId === page.id}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card hover:border-rose-500/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 p-2 text-xs transition-colors"
                        title="Excluir página permanentemente"
                        aria-label={`Excluir ${page.display_name}`}
                      >
                        {deletingId === page.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Mágico: Configuração em 30 Segundos */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--primary)] uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" /> Criador Inteligente em 30 Segundos
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mt-0.5">
                  Gerar Minha Página Pronta
                </h3>
                <p className="text-xs text-muted-foreground">
                  Preencha os dados ou cole o link do Google Maps para gerar fotos, textos e serviços automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMagicCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* Preenchimento Inteligente via Google Maps / Link (Barra Expandida no Topo) */}
                <div className="rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--primary)]">
                      <Search className="h-4 w-4 shrink-0" />
                      <span>Puxar Perfil Automático (Google Maps ou Link)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[color:var(--primary)]/20 text-[color:var(--primary)] px-2.5 py-0.5 rounded-full">
                      Mágico
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Cole o link do Google Maps (ex: <i>maps.app.goo.gl/...</i> ou <i>/maps/place/...</i>) ou digite o nome do negócio:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        value={lookupQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLookupQuery(val);
                          const clean = normalizeBusinessQuery(val);
                          if (clean.name && clean.fromLink) {
                            setWizardName(clean.name);
                            if (clean.city) setWizardCity(clean.city);
                          }
                        }}
                        placeholder="Cole o link do Google Maps ou nome da empresa..."
                        className="input-field w-full pl-9 pr-3 text-xs sm:text-sm py-2.5"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleLookupProfile();
                          }
                        }}
                      />
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupProfile}
                      disabled={isLookingUp || !lookupQuery.trim()}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                        lookupStatus === "found_full"
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : lookupStatus === "found_name"
                            ? "bg-amber-600 hover:bg-amber-500 text-slate-950"
                            : "btn-primary hover:scale-[1.02]"
                      }`}
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                        </>
                      ) : lookupStatus === "found_full" ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-white" /> Perfil Puxado!
                        </>
                      ) : lookupStatus === "found_name" ? (
                        <>
                          <Check className="h-4 w-4 text-slate-950" /> Nome Aproveitado
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Puxar Dados
                        </>
                      )}
                    </button>
                  </div>

                  {lookupFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
                        lookupStatus === "found_full"
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium"
                          : lookupStatus === "found_name"
                            ? "bg-amber-500/15 border border-amber-500/30 text-amber-200 font-medium"
                            : lookupStatus === "error"
                              ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                              : "bg-surface-elevated/40 text-foreground"
                      }`}
                    >
                      {lookupStatus === "found_full" && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
                      {lookupStatus === "found_name" && <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
                      <span>{lookupFeedback}</span>
                    </div>
                  )}

                  {lookupResults.length > 0 && (
                    <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
                      {lookupResults.map((lead, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            applyProfileData(lead);
                            setLookupStatus("found_full");
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-border/70 bg-card hover:border-[color:var(--primary)] hover:bg-[color:var(--primary)]/10 transition-all flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <div className="truncate">
                            <span className="font-bold text-foreground block truncate">{lead.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {[lead.city, lead.phone || lead.whatsapp, lead.rating ? `⭐ ${lead.rating}` : null].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-[color:var(--primary)] bg-[color:var(--primary)]/15 px-2.5 py-1 rounded-lg">
                            Usar este
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid Organizado de 2 Colunas no Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Coluna 1: Ramo & Dados do Negócio */}
                  <div className="space-y-4">
                    {/* Seleção de Nicho */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        1. Qual é o nicho do seu negócio?
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {NICHE_OPTIONS.map((niche) => {
                          const isSelected = selectedNiche === niche.key;
                          const Icon = niche.icon;
                          return (
                            <button
                              key={niche.key}
                              type="button"
                              onClick={() => setSelectedNiche(niche.key)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)] shadow-sm"
                                  : "border-border bg-surface-elevated/20 text-muted-foreground hover:border-border/80 hover:text-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{niche.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nome do Negócio */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        2. Nome da sua Empresa ou Marca <span className="text-rose-400">*</span>
                      </label>
                      <input
                        value={wizardName}
                        onChange={(e) => setWizardName(e.target.value)}
                        placeholder="Ex: Dra. Juliana Estética, Barbearia Vintage..."
                        className="input-field w-full text-xs sm:text-sm"
                        required
                      />
                    </div>

                    {/* WhatsApp & Cidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          3. WhatsApp de Atendimento
                        </label>
                        <input
                          value={wizardWhatsapp}
                          onChange={(e) => setWizardWhatsapp(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="input-field w-full text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          4. Cidade (opcional)
                        </label>
                        <input
                          value={wizardCity}
                          onChange={(e) => setWizardCity(e.target.value)}
                          placeholder="Ex: Salvador, BA"
                          className="input-field w-full text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Formato de Criação & Estilo Visual */}
                  <div className="space-y-4">
                    {/* Escolha do motor de criação */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        5. Formato & Experiência de Criação
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setCreationEngine("express")}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            creationEngine === "express"
                              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 ring-2 ring-[color:var(--primary)]/40 shadow-sm"
                              : "border-border bg-surface-elevated/20 hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Máquina Express
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
                              Rápido
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Modelo pronto preenchido com as informações e fotos reais do negócio em segundos.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreationEngine("premium")}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            creationEngine === "premium"
                              ? "border-[color:var(--primary)] bg-surface-elevated ring-2 ring-[color:var(--primary)]/40 shadow-sm"
                              : "border-border bg-surface-elevated/20 hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <Sparkles className="h-3.5 w-3.5 text-foreground" /> Premium com IA
                            </span>
                            <span className="text-[10px] font-semibold text-foreground uppercase px-2 py-0.5 rounded bg-surface">
                              Copiloto
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Cria a página e abre o assistente de IA com curadoria e direção de arte sob medida.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreationEngine("cinematic")}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                            creationEngine === "cinematic"
                              ? "border-amber-500 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent ring-2 ring-amber-500/50 shadow-md"
                              : "border-border bg-surface-elevated/20 hover:border-amber-500/40 hover:bg-amber-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <Clapperboard className="h-3.5 w-3.5 text-amber-400" /> 🎬 Scrollytelling Cinematográfico
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm">
                              Luxo & Parallax
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Narrativa imersiva em 4 capítulos em tela cheia, efeito Parallax GPU a 60 FPS e iluminação de estúdio no padrão Apple.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Seleção do Modelo Visual ou Preview do Scrollytelling */}
                    <div>
                      {creationEngine === "cinematic" ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Estrutura Narrativa em 4 Capítulos
                            </span>
                            <span className="text-[10px] text-amber-400 font-medium">60 FPS GPU</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                              <span className="font-bold text-amber-200 block">Capítulo I</span>
                              <span className="text-muted-foreground">A Origem & Paixão</span>
                            </div>
                            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                              <span className="font-bold text-amber-200 block">Capítulo II</span>
                              <span className="text-muted-foreground">O Preparo Artesanal</span>
                            </div>
                            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                              <span className="font-bold text-amber-200 block">Capítulo III</span>
                              <span className="text-muted-foreground">A Extração Nobre</span>
                            </div>
                            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                              <span className="font-bold text-amber-200 block">Capítulo IV</span>
                              <span className="text-muted-foreground">Pedir no WhatsApp</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                            <span>6. Estilo Visual (3 Modelos do Nicho)</span>
                            <span className="text-[11px] font-semibold text-[color:var(--primary)]">
                              Modelo {selectedVariantIndex + 1} de 3
                            </span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {getVariantsForNiche(selectedNiche).map((variant, idx) => {
                              const isSelected = selectedVariantIndex === idx;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedVariantIndex(idx)}
                                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                                    isSelected
                                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 ring-2 ring-[color:var(--primary)]/40 shadow-sm"
                                      : "border-border bg-surface-elevated/20 hover:border-border/80"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[color:var(--primary)]/20 text-[color:var(--primary)]">
                                        Mod. {idx + 1}
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-foreground line-clamp-1">
                                      {variant.modelName}
                                    </p>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground capitalize mt-1 block">
                                    {variant.theme}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Fixo */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-t border-border/60 bg-muted/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWizard || !wizardName.trim()}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer ${
                    creationEngine === "cinematic"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-amber-500/20"
                      : creationEngine === "premium"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20"
                        : "btn-primary shadow-[color:var(--primary)]/20"
                  }`}
                >
                  {isCreatingWizard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando Página...
                    </>
                  ) : creationEngine === "cinematic" ? (
                    <>
                      <Clapperboard className="h-4 w-4" /> Gerar Scrollytelling de Luxo
                    </>
                  ) : creationEngine === "premium" ? (
                    <>
                      <Sparkles className="h-4 w-4" /> Criar com IA Studio
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" /> Criar Minha Página Pronta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModalData && (
        <TransferPageModal
          isOpen={transferModalData.isOpen}
          onClose={() => setTransferModalData(null)}
          page={transferModalData.page}
          onSuccess={() => {
            void pages.refetch();
          }}
        />
      )}
    </div>
  );
}
