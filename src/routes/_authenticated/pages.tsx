import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Copy,
  Dumbbell,
  ExternalLink,
  Eye,
  HeartPulse,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageService } from "@/modules/page/services/PageService";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { UpgradePrompt } from "@/modules/billing/components/UpgradePrompt";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { publicPageUrl } from "@/lib/public-page-url";

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
    key: "odontologia",
    name: "Odontologia",
    description: "Clínicas odontológicas, dentistas e estética dental",
    icon: Stethoscope,
    color: "text-cyan-400",
    bgLight: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    key: "estetica",
    name: "Estética & Beleza",
    description: "Salões, clínicas de estética, spa, lash e unhas",
    icon: Sparkles,
    color: "text-pink-400",
    bgLight: "bg-pink-500/10 border-pink-500/20",
  },
  {
    key: "barbearia",
    name: "Barbearia",
    description: "Barbearias modernas, corte, barba e estúdios",
    icon: Scissors,
    color: "text-amber-400",
    bgLight: "bg-amber-500/10 border-amber-500/20",
  },
  {
    key: "clinica",
    name: "Clínica & Saúde",
    description: "Consultórios médicos, fisioterapia e saúde integral",
    icon: HeartPulse,
    color: "text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "advocacia",
    name: "Advocacia",
    description: "Escritórios jurídicos e consultoria especializada",
    icon: Scale,
    color: "text-blue-400",
    bgLight: "bg-blue-500/10 border-blue-500/20",
  },
  {
    key: "restaurante",
    name: "Gastronomia",
    description: "Restaurantes, pizzarias, cafés e delivery",
    icon: UtensilsCrossed,
    color: "text-orange-400",
    bgLight: "bg-orange-500/10 border-orange-500/20",
  },
  {
    key: "academia",
    name: "Academia & Treino",
    description: "Academias, studios fitness e personal trainers",
    icon: Dumbbell,
    color: "text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "geral",
    name: "Comércio & Serviços",
    description: "Lojas, consultores e serviços locais",
    icon: ShoppingBag,
    color: "text-purple-400",
    bgLight: "bg-purple-500/10 border-purple-500/20",
  },
];

function PagesWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("odontologia");
  const [wizardName, setWizardName] = useState("");
  const [wizardWhatsapp, setWizardWhatsapp] = useState("");
  const [wizardCity, setWizardCity] = useState("");
  const [isCreatingWizard, setIsCreatingWizard] = useState(false);

  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);

  const access = usePlanAccess();
  const pages = useQuery({
    queryKey: ["owned-bio-pages"],
    queryFn: () => PageService.listOwnedPages(),
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
        isDemo: false, // Página definitiva do cliente
      });

      await pages.refetch();
      setIsWizardOpen(false);
      navigate({ to: "/builder", search: { page: page.id } });
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
      navigate({ to: "/builder", search: { page: page.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a página.";
      setCreationError(message);
    } finally {
      setIsCreatingBlank(false);
    }
  }

  function openWizardWithNiche(nicheKey: string) {
    setSelectedNiche(nicheKey);
    setIsWizardOpen(true);
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWizardOpen(true)}
            disabled={isCreatingWizard || access.isLoading}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-[color:var(--primary)]/20 transition-all hover:scale-[1.02]"
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

      {/* Grid de Páginas do Usuário */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Suas Páginas Criadas</h2>
          <span className="text-xs text-muted-foreground">
            {pageList.length} {pageList.length === 1 ? "página cadastrada" : "páginas cadastradas"}
          </span>
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
            <button
              onClick={() => setIsWizardOpen(true)}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" /> Criar Minha Primeira Página Agora
            </button>
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

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
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
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Link
                        to="/builder"
                        search={{ page: page.id }}
                        className="flex-1 btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>

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

      {/* Galeria de Criação Rápida por Nicho (Zero Barreira Técnica) */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <span className="text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
            Criação Rápida Sem Esforço
          </span>
          <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
            Comece com uma Estrutura Pronta para o Seu Negócio
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione o seu ramo abaixo para gerar uma página com fotos HD, serviços sugeridos e agendamento automático em 1 clique:
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NICHE_OPTIONS.map((niche) => {
            const Icon = niche.icon;
            return (
              <button
                key={niche.key}
                onClick={() => openWizardWithNiche(niche.key)}
                className="group text-left p-4 rounded-xl border border-border bg-surface-elevated/30 hover:border-[color:var(--primary)]/40 hover:bg-surface-elevated/80 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl border ${niche.bgLight} ${niche.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-[color:var(--primary)] transition-colors">
                    {niche.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {niche.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal Mágico: Configuração em 30 Segundos */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--primary)]">
                  <Sparkles className="h-3.5 w-3.5" /> Criador Inteligente em 30 Segundos
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-1">
                  Gerar Minha Página Pronta
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha apenas o básico. Criaremos as fotos, textos e serviços para você!
                </p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMagicCreate} className="space-y-4">
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
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
                            : "border-border bg-surface-elevated/20 text-muted-foreground hover:border-border/80"
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
                  2. Nome da sua Empresa ou Marca
                </label>
                <input
                  value={wizardName}
                  onChange={(e) => setWizardName(e.target.value)}
                  placeholder="Ex: Dra. Juliana Estética, Barbearia Vintage..."
                  className="input-field w-full"
                  required
                  autoFocus
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
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    4. Cidade (opcional)
                  </label>
                  <input
                    value={wizardCity}
                    onChange={(e) => setWizardCity(e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWizard || !wizardName.trim()}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold shadow-lg shadow-[color:var(--primary)]/20"
                >
                  {isCreatingWizard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando Página...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Criar Minha Página Pronta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
