import {
  CheckCircle2,
  Circle,
  Eye,
  ExternalLink,
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Palette,
  Save,
  Sparkles,
  UserRound,
  WalletCards,
  Youtube,
  X,
  Star,
  MessageSquareHeart,
  Wand2,
  Stethoscope,
  Scissors,
  Scale,
  Dumbbell,
  UtensilsCrossed,
  Briefcase,
  Layers,
  Phone,
  ShoppingBag,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { FreeLinkRenderer } from "@/components/public-profile/FreeLinkRenderer";
import type { PublicBio, PublicLink } from "@/components/public-profile/types";
import type { Tables } from "@/integrations/supabase/types";
import { MediaUploader } from "./MediaUploader";
import { CatalogEditor } from "@/modules/products/components/CatalogEditor";
import { parseSocialLinks } from "@/lib/social-links";
import {
  freeTemplateBase,
  freeTemplateWithOptions,
  freeTypographyFromTemplate,
  freeAccentFromTemplate,
  freeButtonShapeFromTemplate,
  FREE_ACCENTS,
  FREE_BUTTON_SHAPES,
  type FreeTypography,
  type FreeAccent,
  type FreeButtonShape,
} from "@/lib/free-layout-options";
import { commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import type { PlanAccess } from "@/modules/billing/types";
import {
  normalizePageSlug,
  publicPageUrl,
  subdomainValidationMessage,
} from "@/lib/public-page-url";
import type { CatalogItem } from "@/modules/products/types";
import { getPresetForCompany } from "@/modules/prospecting/nichePresets";

type BioForm = Pick<
  Tables<"bio_pages">,
  | "slug"
  | "display_name"
  | "description"
  | "avatar_url"
  | "whatsapp"
  | "whatsapp_message"
  | "whatsapp_button_label"
  | "whatsapp_button_subtitle"
  | "pix_key"
  | "instagram"
  | "social_links"
  | "published"
  | "theme"
  | "cover_url"
  | "cover_position"
  | "cover_fit"
  | "cover_overlay"
  | "cover_overlay_opacity"
  | "template_id"
  | "motion_enabled"
  | "motion_entrance"
  | "motion_cta"
  | "motion_ambient"
>;

type EditorTab = "visual" | "profile" | "contact" | "catalog";

type EditableLink = Pick<PublicLink, "id" | "title" | "url" | "active" | "position">;

export interface NicheModelConfig {
  id: string;
  templateId: string;
  nicheKey: string;
  nicheCategory: string;
  title: string;
  subtitle: string;
  theme: string;
  icon: typeof Stethoscope;
  isGold: boolean;
}

export const NICHE_MODELS: NicheModelConfig[] = [
  {
    id: "odontologia",
    templateId: "clinic-care",
    nicheKey: "odontologia",
    nicheCategory: "Clínicas e Saúde",
    title: "Odontologia & Clínica Médica",
    subtitle: "Estrutura médica de alto padrão, tratamentos e agendamento",
    theme: "ocean",
    icon: Stethoscope,
    isGold: true,
  },
  {
    id: "estetica",
    templateId: "beauty-glow",
    nicheKey: "estetica",
    nicheCategory: "Estética e Beleza",
    title: "Estética, Beleza & Spa",
    subtitle: "Visual glow sofisticado, procedimentos e catálogo elegante",
    theme: "sunset",
    icon: Sparkles,
    isGold: true,
  },
  {
    id: "barbearia",
    templateId: "spotlight-neon",
    nicheKey: "barbearia",
    nicheCategory: "Barbearias e Salões",
    title: "Barbearia Dark & Cortes",
    subtitle: "Visual dark moderno com cortes, barba e agendamento",
    theme: "midnight",
    icon: Scissors,
    isGold: true,
  },
  {
    id: "advocacia",
    templateId: "law-authority",
    nicheKey: "advocacia",
    nicheCategory: "Advogados e Consultores",
    title: "Advocacia & Consultoria",
    subtitle: "Presença corporativa, autoridade jurídica e contato ágil",
    theme: "midnight",
    icon: Scale,
    isGold: true,
  },
  {
    id: "academia",
    templateId: "academy-performance",
    nicheKey: "academia",
    nicheCategory: "Academias e Fitness",
    title: "Academia, Fitness & Studio",
    subtitle: "Performance esportiva, planos de treino e aula experimental",
    theme: "forest",
    icon: Dumbbell,
    isGold: true,
  },
  {
    id: "restaurante",
    templateId: "restaurant-menu",
    nicheKey: "restaurante",
    nicheCategory: "Restaurantes e Alimentação",
    title: "Restaurante & Gastronomia",
    subtitle: "Cardápio apetitoso com fotos e pedidos via WhatsApp",
    theme: "sunset",
    icon: UtensilsCrossed,
    isGold: true,
  },
  {
    id: "geral",
    templateId: "business-modern",
    nicheKey: "geral",
    nicheCategory: "Serviços e Negócios",
    title: "Empresas & Serviços Gerais",
    subtitle: "Apresentação corporativa clara para prestadores e comércio",
    theme: "aurora",
    icon: Briefcase,
    isGold: true,
  },
  {
    id: "free",
    templateId: "default",
    nicheKey: "geral",
    nicheCategory: "Outros",
    title: "Página de Links Simples (Free)",
    subtitle: "Layout minimalista para links de redes e bio clássica",
    theme: "mono",
    icon: Layers,
    isGold: false,
  },
];

const TABS: Array<{
  id: EditorTab;
  label: string;
  description: string;
  icon: typeof Palette;
}> = [
  {
    id: "visual",
    label: "Visual & Modelo",
    description: "Nicho, fotos e cores",
    icon: Palette,
  },
  {
    id: "profile",
    label: "Sobre o Negócio",
    description: "Nome, bio e link",
    icon: UserRound,
  },
  {
    id: "contact",
    label: "WhatsApp & Contato",
    description: "Triagem, 5 estrelas e redes",
    icon: Phone,
  },
  {
    id: "catalog",
    label: "Serviços & Preços",
    description: "Catálogo e links extras",
    icon: ShoppingBag,
  },
];

const THEMES = [
  {
    id: "ocean",
    label: "Oceano",
    description: "Azul profissional & Turquesa",
    gradientStyle: "linear-gradient(135deg, #0ea5e9, #10b981, #0369a1)",
  },
  {
    id: "sunset",
    label: "Pôr do Sol",
    description: "Dourado quente, Beleza & Rosa",
    gradientStyle: "linear-gradient(135deg, #ff6a3d, #ffcf3d, #d13a76)",
  },
  {
    id: "midnight",
    label: "Noite Dark",
    description: "Dark sofisticado & Grafite",
    gradientStyle: "linear-gradient(135deg, #1e293b, #334155, #050810)",
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Ciano vibrante & Violeta",
    gradientStyle: "linear-gradient(135deg, #6b3fff, #00d4ff, #ff4d9d)",
  },
  {
    id: "forest",
    label: "Floresta",
    description: "Verde esmeralda & Saúde",
    gradientStyle: "linear-gradient(135deg, #16a34a, #65a30d, #04140a)",
  },
  {
    id: "mono",
    label: "Claro Minimal",
    description: "Fundo claro limpo & Elegante",
    gradientStyle: "linear-gradient(135deg, #f6f5f2, #e2e8f0, #cbd5e1)",
  },
];

const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram", placeholder: "@seuperfil", icon: Instagram },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/suapagina",
    icon: Facebook,
  },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@seuperfil", icon: Palette },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/seuperfil",
    icon: Linkedin,
  },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@seucanal", icon: Youtube },
  { id: "website", label: "Seu site", placeholder: "https://seusite.com.br", icon: Globe2 },
] as const;

function socialValues(value: BioForm["social_links"]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function UnifiedPageEditor({
  initialBio,
  initialLinks,
  initialProducts = [],
  defaults,
  planAccess,
  onSave,
}: {
  initialBio: BioForm;
  initialLinks: EditableLink[];
  initialProducts?: CatalogItem[];
  defaults: { displayName: string; whatsapp: string; instagram: string; niche: string };
  planAccess?: PlanAccess;
  onSave(data: {
    bio: BioForm;
    links: EditableLink[];
    products: CatalogItem[];
    niche: string;
  }): Promise<{ products: CatalogItem[] }>;
}) {
  const initialTemplate = useMemo(() => {
    if (initialBio.template_id) return initialBio.template_id;
    const preset = getPresetForCompany(defaults.niche, defaults.displayName);
    return preset.template_id || "clinic-care";
  }, [initialBio.template_id, defaults.niche, defaults.displayName]);

  const [bio, setBio] = useState<BioForm>(() => ({
    ...initialBio,
    template_id: initialBio.template_id || initialTemplate,
    theme: initialBio.theme || (getPresetForCompany(defaults.niche, defaults.displayName).theme) || "ocean",
  }));
  const [links, setLinks] = useState<EditableLink[]>(initialLinks);
  const [products, setProducts] = useState<CatalogItem[]>(initialProducts);
  const [niche, setNiche] = useState(defaults.niche);
  const [activeTab, setActiveTab] = useState<EditorTab>("visual");

  const [draftTemplate, setDraftTemplate] = useState(() => bio.template_id || "clinic-care");
  const [freeTypography, setFreeTypography] = useState<FreeTypography>(() =>
    freeTypographyFromTemplate(bio.template_id),
  );
  const [freeAccent, setFreeAccent] = useState<FreeAccent>(() =>
    freeAccentFromTemplate(bio.template_id),
  );
  const [freeShape, setFreeShape] = useState<FreeButtonShape>(() =>
    freeButtonShapeFromTemplate(bio.template_id),
  );

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      bio,
      links: initialLinks,
      products: initialProducts,
      niche: defaults.niche,
    }),
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const snapshot = JSON.stringify({ bio, links, products, niche });
  const hasPendingChanges = snapshot !== savedSnapshot;

  const setupSteps = [
    {
      id: "profile",
      label: "Apresente seu negócio",
      help: "Nome e descrição",
      complete: bio.display_name.trim().length >= 2 && Boolean(bio.description?.trim()),
    },
    {
      id: "contact",
      label: "Conecte o WhatsApp",
      help: "Canal principal de contato",
      complete: (bio.whatsapp ?? "").replace(/\D/g, "").length >= 10,
    },
    {
      id: "catalog",
      label: "Serviços ou Links",
      help: "Catálogo ou links da página",
      complete: products.length > 0 || links.some((link) => link.title.trim() && link.url.replace("https://", "").trim()),
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.complete).length;

  const previewBio = useMemo(
    () =>
      ({
        id: "preview",
        user_id: "preview",
        created_at: "",
        updated_at: "",
        ...bio,
        display_name: bio.display_name || defaults.displayName || "Seu Negócio",
        slug: bio.slug || "minha-pagina",
      }) as PublicBio,
    [bio, defaults.displayName],
  );

  const previewLinks = useMemo(
    () =>
      links.map(
        (link) =>
          ({
            ...link,
            bio_page_id: "preview",
            created_at: "",
            updated_at: "",
            icon: null,
          }) as PublicLink,
      ),
    [links],
  );

  const hasProfessionalSubdomain = Boolean(planAccess?.isPro && planAccess.features.custom_domain);
  const normalizedSlug = normalizePageSlug(bio.slug || bio.display_name);
  const pageUrl = publicPageUrl(normalizedSlug, hasProfessionalSubdomain);
  const addressError = hasProfessionalSubdomain
    ? subdomainValidationMessage(bio.slug || bio.display_name)
    : null;

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasPendingChanges]);

  const updateBio = (patch: Partial<BioForm>) => setBio((current) => ({ ...current, ...patch }));

  const addLink = () => {
    if ((planAccess?.limits.links ?? 4) !== -1 && links.length >= (planAccess?.limits.links ?? 4)) {
      setValidationMessage(
        "O plano atual permite até 4 links. Faça upgrade para adicionar links ilimitados.",
      );
      setSaveState("error");
      return;
    }
    setLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "Novo link",
        url: "https://",
        active: true,
        position: current.length,
      },
    ]);
  };

  const updateLink = (id: string, patch: Partial<EditableLink>) =>
    setLinks((current) => current.map((link) => (link.id === id ? { ...link, ...patch } : link)));

  const removeLink = (id: string) =>
    setLinks((current) => current.filter((link) => link.id !== id));

  const activeNicheModel = useMemo(() => {
    const currentTemplate = bio.template_id || draftTemplate || "clinic-care";
    return (
      NICHE_MODELS.find(
        (m) =>
          m.templateId === currentTemplate ||
          (m.templateId === "clinic-care" && currentTemplate.includes("clinic")) ||
          (m.templateId === "beauty-glow" && currentTemplate.includes("beauty")) ||
          (m.templateId === "spotlight-neon" && (currentTemplate.includes("spotlight") || currentTemplate.includes("neon"))) ||
          (m.templateId === "law-authority" && currentTemplate.includes("law")) ||
          (m.templateId === "academy-performance" && currentTemplate.includes("academy")) ||
          (m.templateId === "restaurant-menu" && currentTemplate.includes("restaurant")) ||
          (m.templateId === "business-modern" && (currentTemplate.includes("business") || currentTemplate.includes("store")))
      ) || NICHE_MODELS[0]
    );
  }, [bio.template_id, draftTemplate]);

  const selectNicheModel = (model: NicheModelConfig) => {
    setDraftTemplate(model.templateId);
    setNiche(model.nicheCategory);
    updateBio({
      template_id: model.templateId,
      theme: model.theme,
    });
  };

  const applyNicheDefaults = (nicheKey: string) => {
    const preset = getPresetForCompany(nicheKey, bio.display_name);
    if (!preset) return;

    const patch: Partial<BioForm> = {
      cover_url: preset.cover_url,
      avatar_url: preset.avatar_url,
      whatsapp_button_label: preset.whatsapp_button_label,
      theme: preset.theme,
    };
    if (!bio.description || bio.description.trim().length === 0 || bio.description === defaults.displayName) {
      patch.description = preset.generateDescription(bio.display_name || defaults.displayName || "Nossa Empresa", "sua cidade");
    }
    if (!bio.whatsapp_message || bio.whatsapp_message.trim().length === 0) {
      patch.whatsapp_message = preset.whatsapp_message(bio.display_name || defaults.displayName || "Nossa Empresa");
    }
    updateBio(patch);

    if (preset.services && preset.services.length > 0) {
      const newProducts: CatalogItem[] = preset.services.map((s, idx) => ({
        id: `service-${crypto.randomUUID()}`,
        type: "service",
        name: s.name,
        description: s.description,
        price: s.price,
        image_url: s.image_url,
        button_label: "Agendar",
        button_url: null,
        position: idx,
        active: true,
      }));
      setProducts(newProducts);
    }
  };

  async function save() {
    if (addressError) {
      setValidationMessage(addressError);
      setSaveState("error");
      return;
    }
    const socialValidation = parseSocialLinks(bio.social_links);
    if (!socialValidation.success) {
      setValidationMessage(
        socialValidation.error.issues[0]?.message ?? "Revise os links das redes sociais.",
      );
      setSaveState("error");
      return;
    }
    setValidationMessage(undefined);
    setSaving(true);
    setSaveState("idle");
    try {
      const result = await onSave({
        bio: { ...bio, slug: normalizedSlug },
        links,
        products,
        niche,
      });
      setProducts(result.products);
      setBio((current) => ({
        ...current,
        slug: normalizePageSlug(current.slug || current.display_name),
      }));
      setSavedSnapshot(
        JSON.stringify({
          bio: { ...bio, slug: normalizedSlug },
          links,
          products: result.products,
          niche,
        }),
      );
      setSaveState("success");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Save failed", error);
      setValidationMessage(
        error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.",
      );
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  const isFreeTemplate =
    !previewBio.template_id ||
    previewBio.template_id === "default" ||
    previewBio.template_id.startsWith("free-");

  return (
    <div className="premium-builder space-y-5">
      {/* Barra de Ações Superior */}
      <header className="builder-topbar sticky top-0 z-20 -mx-6 flex flex-wrap items-center justify-between gap-3 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="builder-heading">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
            Minha Página Bio Link
          </p>
          <h1 className="mt-1 text-2xl font-bold">Edite, confira e publique.</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Alterações pendentes
            </span>
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="btn-secondary xl:hidden"
          >
            <Eye className="h-4 w-4" /> Ver prévia
          </button>
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary hidden sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
          {hasPendingChanges || saveState === "error" ? (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Salvando..."
                : saveState === "error"
                  ? "Tentar novamente"
                  : "Salvar e publicar"}
            </button>
          ) : (
            <span className="builder-save-status">
              <CheckCircle2 aria-hidden /> Salvo
            </span>
          )}
        </div>
      </header>

      {/* Barra de Progresso e Prontidão */}
      <section className="editor-readiness" aria-label="Progresso da página">
        <div className="editor-readiness-copy">
          <span className={completedSetupSteps === 3 ? "is-ready" : ""}>
            {completedSetupSteps === 3 ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />}
          </span>
          <div>
            <b>
              {completedSetupSteps === 3
                ? "Sua página está pronta para converter clientes"
                : "Complete os passos para ativar sua página"}
            </b>
            <small>{completedSetupSteps}/3 itens essenciais configurados</small>
          </div>
        </div>
        <div className="editor-readiness-track" aria-hidden="true">
          <span style={{ width: `${(completedSetupSteps / 3) * 100}%` }} />
        </div>
      </section>

      {/* Layout Principal: Painel de Controle (4 Abas) + Prévia Celular */}
      <div className="builder-layout">
        <section className="builder-control-panel">
          {/* Navegação Principal das 4 Abas */}
          <nav className="editor-workflow" aria-label="Etapas de edição">
            {TABS.map((tab, index) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={active ? "is-active" : ""}
                  aria-current={active ? "step" : undefined}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSaveState("idle");
                    if (window.matchMedia("(max-width: 900px)").matches) {
                      window.setTimeout(
                        () => inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                        0,
                      );
                    }
                  }}
                >
                  <span>{index + 1}</span>
                  <b className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 hidden sm:inline opacity-80" />
                    {tab.label}
                  </b>
                  <small>{tab.description}</small>
                </button>
              );
            })}
          </nav>

          {/* Painel com o Conteúdo da Aba Ativa */}
          <aside ref={inspectorRef} className="builder-inspector card-surface">
            {/* ABA 1: VISUAL & MODELO */}
            {activeTab === "visual" && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                    Design & Personalização
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Modelo do Nicho & Estilo Visual</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione o nicho do seu negócio. Todos os nichos utilizam o Padrão Ouro completo com serviços, avaliações e agendamento.
                  </p>
                </div>

                {/* 1. Grade de Nichos / Modelos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">
                      1. Escolha o Nicho e Modelo
                    </label>
                    <span className="text-xs text-[color:var(--primary)] font-medium">
                      Ativo: {activeNicheModel.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {NICHE_MODELS.map((model) => {
                      const Icon = model.icon;
                      const isSelected =
                        draftTemplate === model.templateId ||
                        bio.template_id === model.templateId ||
                        (model.id === "odontologia" && (draftTemplate.includes("clinic") || bio.template_id?.includes("clinic")));
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => selectNicheModel(model)}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary),transparent_60%)]"
                              : "border-border hover:border-[color:var(--primary)]/50 hover:bg-surface-elevated/40"
                          }`}
                        >
                          <div
                            className={`mt-0.5 rounded-lg p-2 ${
                              isSelected
                                ? "bg-[color:var(--primary)] text-white"
                                : "bg-surface-elevated text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-sm truncate">{model.title}</p>
                              {model.isGold ? (
                                <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                                  Ouro
                                </span>
                              ) : (
                                <span className="shrink-0 rounded bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Free
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {model.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Banner de 1-Clique para Fotos & Serviços Recomendados */}
                  {activeNicheModel.nicheKey !== "geral" && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                          <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
                          <span>Fotos e Serviços Recomendados de {activeNicheModel.title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Preencher capa, avatar e catálogo com fotos profissionais do Unsplash e tratamentos deste nicho.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyNicheDefaults(activeNicheModel.nicheKey)}
                        className="btn-primary shrink-0 text-xs py-2 px-3 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Aplicar Fotos & Catálogo</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Cores e Paleta do Tema */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">
                    2. Paleta de Cores do Tema
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEMES.map((theme) => {
                      const isSelected = (bio.theme || "aurora") === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => updateBio({ theme: theme.id })}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary),transparent_60%)]"
                              : "border-border hover:border-[color:var(--primary)]/50"
                          }`}
                        >
                          <span
                            className="h-6 w-6 shrink-0 rounded-full border border-white/20 shadow-sm"
                            style={{ background: theme.gradientStyle }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs truncate">{theme.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{theme.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Fotos e Logotipo do Negócio */}
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      3. Fotos do Seu Negócio & Logotipo
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toque nas opções recomendadas do Unsplash ou envie do seu dispositivo (qualquer tamanho).
                    </p>
                  </div>

                  <MediaUploader
                    label="Imagem de Capa (Topo da Página)"
                    value={bio.cover_url}
                    variant="cover"
                    templateId={draftTemplate}
                    niche={niche}
                    onChange={(cover_url) => updateBio({ cover_url })}
                  />

                  <MediaUploader
                    label="Foto de Perfil ou Logotipo da Empresa"
                    value={bio.avatar_url}
                    variant="avatar"
                    templateId={draftTemplate}
                    niche={niche}
                    onChange={(avatar_url) => updateBio({ avatar_url })}
                  />

                  <details className="editor-advanced-settings">
                    <summary>Ajustes avançados da capa</summary>
                    <div className="space-y-4 pt-4">
                      <Field label="Posição da imagem">
                        <select
                          className="input-base"
                          value={bio.cover_position}
                          onChange={(event) => updateBio({ cover_position: event.target.value })}
                        >
                          <option value="top">Topo</option>
                          <option value="center">Centro</option>
                          <option value="bottom">Base</option>
                        </select>
                      </Field>
                      <Field label="Ajuste">
                        <select
                          className="input-base"
                          value={bio.cover_fit}
                          onChange={(event) => updateBio({ cover_fit: event.target.value })}
                        >
                          <option value="cover">Preencher a capa</option>
                          <option value="contain">Mostrar a imagem inteira</option>
                        </select>
                      </Field>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={bio.cover_overlay}
                          onChange={(event) => updateBio({ cover_overlay: event.target.checked })}
                        />
                        Melhorar leitura com sobreposição escura
                      </label>
                      {bio.cover_overlay && (
                        <Field label={`Opacidade da sobreposição (${bio.cover_overlay_opacity}%)`}>
                          <input
                            className="w-full"
                            type="range"
                            min="0"
                            max="100"
                            value={bio.cover_overlay_opacity}
                            onChange={(event) =>
                              updateBio({ cover_overlay_opacity: Number(event.target.value) })
                            }
                          />
                        </Field>
                      )}
                    </div>
                  </details>
                </div>

                {/* 4. Animações e Movimento */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-semibold text-foreground">
                    4. Efeitos e Animações
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated p-3.5 text-sm">
                    <div>
                      <b className="block text-sm">Ativar animações suaves na página</b>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Efeitos elegantes de entrada ao carregar no celular do visitante.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={bio.motion_enabled ?? true}
                      onChange={(event) => updateBio({ motion_enabled: event.target.checked })}
                      className="h-4 w-4 rounded border-border text-[color:var(--primary)]"
                    />
                  </label>
                </div>

                {/* Se for página Free, exibe opções adicionais de personalização */}
                {isFreeTemplate && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <Field label="Tipografia dos cards (Página Free)">
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["modern", "Moderna", "font-sans"],
                            ["elegant", "Elegante", "font-serif"],
                            ["strong", "Marcante", "font-display"],
                          ] as const
                        ).map(([id, label, fontClass]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setFreeTypography(id);
                              updateBio({
                                template_id: freeTemplateWithOptions(draftTemplate, {
                                  typography: id,
                                  accent: freeAccent,
                                  shape: freeShape,
                                }),
                              });
                            }}
                            className={`${fontClass} rounded-lg border px-2 py-2 text-xs transition-all ${
                              freeTypography === id
                                ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
                                : "border-border hover:border-[color:var(--primary)]/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Cor de destaque do botão (Free)">
                      <div className="grid grid-cols-5 gap-2">
                        {FREE_ACCENTS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            aria-label={option.label}
                            onClick={() => {
                              setFreeAccent(option.id);
                              updateBio({
                                template_id: freeTemplateWithOptions(draftTemplate, {
                                  typography: freeTypography,
                                  accent: option.id,
                                  shape: freeShape,
                                }),
                              });
                            }}
                            className={`rounded-lg border p-1.5 transition-all ${
                              freeAccent === option.id
                                ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                                : "border-border hover:border-[color:var(--primary)]/50"
                            }`}
                          >
                            <span
                              className="block h-5 w-full rounded-md"
                              style={{
                                background: `linear-gradient(110deg, ${option.colors[0]}, ${option.colors[1]}, ${option.colors[2]})`,
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Formato dos botões (Free)">
                      <div className="grid grid-cols-3 gap-2">
                        {FREE_BUTTON_SHAPES.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setFreeShape(option.id);
                              updateBio({
                                template_id: freeTemplateWithOptions(draftTemplate, {
                                  typography: freeTypography,
                                  accent: freeAccent,
                                  shape: option.id,
                                }),
                              });
                            }}
                            className={`border px-2 py-2 text-xs transition-all ${
                              option.id === "pill"
                                ? "rounded-full"
                                : option.id === "square"
                                  ? "rounded-none"
                                  : "rounded-lg"
                            } ${
                              freeShape === option.id
                                ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
                                : "border-border hover:border-[color:var(--primary)]/50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: SOBRE O NEGÓCIO */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                    Sobre o Negócio
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Apresentação da Marca</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nome comercial, descrição e link exclusivo da sua página.
                  </p>
                </div>

                <Field label="Nome da Empresa / Profissional">
                  <input
                    className="input-base"
                    value={bio.display_name}
                    placeholder={defaults.displayName || "Ex: Clínica Odontológica Sorriso"}
                    onChange={(event) => updateBio({ display_name: event.target.value })}
                  />
                </Field>

                <Field label="Descrição / Bio do Negócio">
                  <textarea
                    className="input-base min-h-28 resize-y"
                    rows={4}
                    value={bio.description ?? ""}
                    placeholder="Conte resumidamente o que sua empresa oferece, seus diferenciais e especialidades."
                    onChange={(event) => updateBio({ description: event.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta mensagem fica visível com destaque logo abaixo do logotipo na sua página.
                  </p>
                </Field>

                <Field
                  label={hasProfessionalSubdomain ? "Seu Subdomínio Profissional" : "Endereço da Página (Link personalizado)"}
                >
                  <div className="flex items-center rounded-xl border border-border bg-surface-elevated/40 focus-within:border-[color:var(--primary)] overflow-hidden">
                    <span className="px-3 text-xs text-muted-foreground bg-surface-elevated border-r border-border py-2.5 whitespace-nowrap">
                      {hasProfessionalSubdomain ? "https://" : "eialink.com.br/p/"}
                    </span>
                    <input
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                      value={bio.slug}
                      placeholder="minha-empresa"
                      onChange={(event) => updateBio({ slug: event.target.value })}
                      aria-invalid={Boolean(addressError)}
                    />
                    {hasProfessionalSubdomain && (
                      <span className="px-3 text-xs text-muted-foreground bg-surface-elevated border-l border-border py-2.5 whitespace-nowrap">
                        .eialink.com.br
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-xs ${addressError ? "text-[color:var(--destructive)]" : "text-muted-foreground"}`}
                  >
                    {addressError ??
                      (hasProfessionalSubdomain
                        ? `Seu link oficial: https://${normalizedSlug}.eialink.com.br`
                        : `Seu link oficial: https://eialink.com.br/p/${normalizedSlug}`)}
                  </p>
                </Field>
              </div>
            )}

            {/* ABA 3: WHATSAPP & CONTATO */}
            {activeTab === "contact" && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                    Canais de Contato
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">WhatsApp, Reputação & Redes</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure seu WhatsApp, filtro de avaliações 5 estrelas e redes sociais.
                  </p>
                </div>

                <Field label="WhatsApp Principal (com DDD)">
                  <input
                    className="input-base"
                    value={bio.whatsapp ?? ""}
                    placeholder={defaults.whatsapp || "5511999999999"}
                    onChange={(event) => updateBio({ whatsapp: event.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Apenas números, incluindo o código do país (55) e o DDD. Ex: 5511998765432
                  </p>
                </Field>

                <Field label="Mensagem Inicial do WhatsApp">
                  <textarea
                    className="input-base min-h-20 resize-y"
                    value={bio.whatsapp_message ?? ""}
                    maxLength={1000}
                    placeholder="Olá! Conheci a página de vocês e gostaria de agendar um atendimento."
                    onChange={(event) => updateBio({ whatsapp_message: event.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta mensagem já virá preenchida no celular do cliente quando ele clicar em falar com você.
                  </p>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Texto do Botão Principal">
                    <input
                      className="input-base"
                      value={bio.whatsapp_button_label ?? ""}
                      maxLength={60}
                      placeholder="Agendar Consulta / Atendimento"
                      onChange={(event) => updateBio({ whatsapp_button_label: event.target.value })}
                    />
                  </Field>
                  <Field label="Texto de Apoio do Botão">
                    <input
                      className="input-base"
                      value={bio.whatsapp_button_subtitle ?? ""}
                      maxLength={80}
                      placeholder="Resposta rápida no WhatsApp"
                      onChange={(event) => updateBio({ whatsapp_button_subtitle: event.target.value })}
                    />
                  </Field>
                </div>

                {/* Módulo de Reputação & Avaliações Google Maps */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>Filtro 5 Estrelas (Google Maps)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Estimula avaliações 5 estrelas no Google e direciona insatisfações direto para seu WhatsApp.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean((bio.social_links as Record<string, unknown>)?.google_review_enabled)}
                      onChange={(e) => {
                        const current = (bio.social_links as Record<string, unknown>) || {};
                        updateBio({
                          social_links: {
                            ...current,
                            google_review_enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-border text-[color:var(--primary)]"
                    />
                  </div>

                  {Boolean((bio.social_links as Record<string, unknown>)?.google_review_enabled) && (
                    <Field label="Link direto de avaliação do Google da sua empresa">
                      <input
                        className="input-base"
                        value={((bio.social_links as Record<string, unknown>)?.google_review_url as string) || ""}
                        placeholder="https://g.page/r/.../review ou deixe em branco para busca automática"
                        onChange={(e) => {
                          const current = (bio.social_links as Record<string, unknown>) || {};
                          updateBio({
                            social_links: {
                              ...current,
                              google_review_url: e.target.value,
                            },
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe vazio para o sistema gerar automaticamente uma busca no Google pelo nome do seu negócio.
                      </p>
                    </Field>
                  )}
                </div>

                {/* Módulo de Triagem Inteligente de WhatsApp */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <MessageSquareHeart className="h-4 w-4 text-emerald-400" />
                        <span>Triagem Inteligente de WhatsApp</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Apresenta 2 perguntas rápidas antes de abrir o WhatsApp para já qualificar o lead.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean((bio.social_links as Record<string, unknown>)?.triage_enabled)}
                      onChange={(e) => {
                        const current = (bio.social_links as Record<string, unknown>) || {};
                        updateBio({
                          social_links: {
                            ...current,
                            triage_enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-border text-[color:var(--primary)]"
                    />
                  </div>
                  {Boolean((bio.social_links as Record<string, unknown>)?.triage_enabled) && (
                    <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                      <p>✅ O cliente seleciona o serviço desejado e o melhor período (manhã/tarde) antes de abrir a conversa.</p>
                      <p>✅ Se escolher agendamento, oferece atalho para a sua agenda online integrada.</p>
                    </div>
                  )}
                </div>

                {/* Redes Sociais */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-semibold text-foreground">
                    Redes Sociais & Links Externos
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SOCIAL_NETWORKS.map(({ id, label, placeholder, icon: Icon }) => {
                      const values = socialValues(bio.social_links);
                      const value =
                        id === "instagram" ? (values.instagram ?? bio.instagram ?? "") : (values[id] ?? "");
                      return (
                        <Field key={id} label={label}>
                          <div className="relative">
                            <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[color:var(--primary)]" />
                            <input
                              className="input-base pl-9"
                              value={value}
                              placeholder={
                                id === "instagram" ? defaults.instagram || placeholder : placeholder
                              }
                              onChange={(event) => {
                                const next = { ...values };
                                const nextValue = event.target.value.trim();
                                if (nextValue) next[id] = nextValue;
                                else delete next[id];
                                updateBio({
                                  social_links: next,
                                  ...(id === "instagram" ? { instagram: event.target.value.trim() } : {}),
                                });
                              }}
                            />
                          </div>
                        </Field>
                      );
                    })}
                  </div>
                </div>

                {/* Chave Pix */}
                <Field label="Chave Pix (Opcional)">
                  <input
                    className="input-base"
                    value={bio.pix_key ?? ""}
                    placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória"
                    onChange={(event) => updateBio({ pix_key: event.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Visitantes poderão copiar sua chave Pix com 1 toque na página.
                  </p>
                </Field>
              </div>
            )}

            {/* ABA 4: SERVIÇOS & PREÇOS */}
            {activeTab === "catalog" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                      Catálogo & Serviços
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Serviços, Preços & Links</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Apresente seus principais serviços com valores e fotos em destaque.
                    </p>
                  </div>
                  {products.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const preset = getPresetForCompany(activeNicheModel.nicheKey, bio.display_name);
                        if (preset?.services) {
                          setProducts(
                            preset.services.map((s, idx) => ({
                              id: `service-${crypto.randomUUID()}`,
                              type: "service",
                              name: s.name,
                              description: s.description,
                              price: s.price,
                              image_url: s.image_url,
                              button_label: "Agendar",
                              button_url: null,
                              position: idx,
                              active: true,
                            }))
                          );
                        }
                      }}
                      className="btn-secondary shrink-0 text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                      <span>Importar Serviços do Nicho</span>
                    </button>
                  )}
                </div>

                {/* Editor do Catálogo de Produtos e Serviços */}
                <div className="rounded-xl border border-border bg-surface-elevated/20 p-4">
                  <CatalogEditor
                    items={products}
                    onChange={setProducts}
                    maxItems={planAccess?.isPro ? -1 : 3}
                  />
                </div>

                {/* Links e Botões Adicionais */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Links e Botões Adicionais</h3>
                      <p className="text-xs text-muted-foreground">
                        Botões com links externos (ex: Site institucional, Catálogo em PDF, Localização).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addLink}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Novo Link</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {links.map((link) => (
                      <div key={link.id} className="rounded-xl border border-border bg-surface-elevated/40 p-3 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            className="input-base text-sm"
                            value={link.title}
                            placeholder="Título do botão"
                            onChange={(event) => updateLink(link.id, { title: event.target.value })}
                          />
                          <input
                            className="input-base text-sm"
                            value={link.url}
                            placeholder="https://..."
                            onChange={(event) => updateLink(link.id, { url: event.target.value })}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.active}
                              onChange={(event) => updateLink(link.id, { active: event.target.checked })}
                              className="rounded border-border text-[color:var(--primary)]"
                            />
                            Exibir na página
                          </label>
                          <button
                            type="button"
                            className="text-xs text-[color:var(--destructive)] hover:underline flex items-center gap-1"
                            onClick={() => removeLink(link.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {saveState === "error" && (
              <p role="alert" className="mt-4 text-sm text-[color:var(--destructive)]">
                {validationMessage ||
                  "Não foi possível salvar. Confira sua conexão e tente novamente."}
              </p>
            )}
          </aside>
        </section>

        {/* Prévia Interativa do Celular em Tempo Real */}
        <main
          ref={previewRef}
          className={`builder-preview-stage min-w-0 xl:order-none ${previewOpen ? "is-mobile-open" : ""}`}
        >
          <div className="builder-preview-mobile-header">
            <div>
              <b>Prévia da sua página</b>
              <small>As mudanças aparecem aqui na hora</small>
            </div>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar prévia">
              <X aria-hidden />
            </button>
          </div>
          <p className="builder-preview-label mb-3 text-center text-sm font-medium text-muted-foreground">
            Sua página enquanto você edita (Tempo Real)
          </p>
          <div
            className={`editor-phone-preview bio-theme ${previewBio.theme || "aurora"} mx-auto max-w-[25rem] overflow-hidden bg-background`}
          >
            {isFreeTemplate ? (
              <FreeLinkRenderer
                bio={previewBio}
                links={previewLinks.filter((link) => link.active)}
                onTrack={() => undefined}
                onShare={() => undefined}
                products={products}
              />
            ) : (
              <TemplateRenderer
                bio={previewBio}
                links={previewLinks.filter((link) => link.active)}
                onTrack={() => undefined}
                onShare={() => undefined}
                products={products}
                bookingUrl={`/agendar/${previewBio.slug}`}
                motionLevel={previewBio.motion_enabled === false ? "off" : "pro"}
              />
            )}
          </div>
        </main>
      </div>

      {saveState === "success" && bio.published && (
        <section className="card-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Seu Eialink está publicado e ativo!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quer que a nossa equipe avalie ou configure sua presença comercial estrategicamente?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="btn-secondary"
              href={commercialWhatsAppUrl("help")}
              target="_blank"
              rel="noreferrer"
            >
              Falar com Especialista
            </a>
            <a
              className="btn-primary"
              href={commercialWhatsAppUrl("pro")}
              target="_blank"
              rel="noreferrer"
            >
              Conhecer o Pro
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
