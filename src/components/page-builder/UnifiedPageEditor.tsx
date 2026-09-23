import {
  CheckCircle2,
  Circle,
  Eye,
  ExternalLink,
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Loader2,
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
  HeartPulse,
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
  Brain,
  Sun,
  Dog,
  Wrench,
  Building2,
  Compass,
  Calculator,
  PenTool,
  Glasses,
  ShieldCheck,
  Laptop,
  Megaphone,
  Wine,
  Bot,
  Zap,
  Search,
  Flame,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { FreeLinkRenderer } from "@/components/public-profile/FreeLinkRenderer";
import type { PublicBio, PublicLink } from "@/components/public-profile/types";
import { MediaUploader } from "./MediaUploader";
import { ColorPickerControl } from "./ColorPickerControl";
import { SectionsEditor } from "./SectionsEditor";
import { ModularSections } from "@/components/public-profile/ModularSections";
import { CatalogEditor } from "@/modules/products/components/CatalogEditor";
import { ChatFlowEditor } from "./ChatFlowEditor";
import { ProductCarouselManager } from "@/components/dashboard/ProductCarouselManager";
import { SeoEditor } from "./SeoEditor";
import { AiCopilotModal } from "./AiCopilotModal";
import type { AiCopilotResult } from "@/modules/ai/copilot.functions";
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
import { getPresetForCompany, getVariantsForNiche, isProductCatalogNiche, type NichePreset } from "@/modules/prospecting/nichePresets";
import type { Tables } from "@/integrations/supabase/types";

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
> & { id?: string };

type EditorTab = "visual" | "carousel" | "sections" | "profile" | "contact" | "catalog" | "seo";

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
    id: "site-maquina",
    templateId: "site-maquina",
    nicheKey: "geral",
    nicheCategory: "Site Institucional",
    title: "Site Institucional Máquina de Sites",
    subtitle: "Landing Page completa: Parallax, Glassmorphism, barra utilitária, 5 heroes assinadas, vitrine bento grid, diferenciais de bairro e Google Maps embed",
    theme: "ocean",
    icon: Globe2,
    isGold: true,
  },
  {
    id: "impacto",
    templateId: "impact-showcase",
    nicheKey: "geral",
    nicheCategory: "Modelo VIP",
    title: "Modelo VIP",
    subtitle: "Halo luminoso, selo de qualidade, diferenciais em vidro, vitrine de serviços e rota Google Maps",
    theme: "ocean",
    icon: Zap,
    isGold: true,
  },
  {
    id: "atendente-ia",
    templateId: "ai-chat-agent",
    nicheKey: "geral",
    nicheCategory: "Atendente Virtual",
    title: "Atendente Virtual",
    subtitle: "Chat interativo estilo Typebot: perguntas e respostas personalizáveis, triagem e fotos",
    theme: "forest",
    icon: Bot,
    isGold: true,
  },
  {
    id: "marketing",
    templateId: "cinematic-glass",
    nicheKey: "marketing",
    nicheCategory: "Marketing & Tráfego",
    title: "Marketing Digital & Tráfego",
    subtitle: "Agências, gestores de tráfego, social media, lançamentos e negócios digitais",
    theme: "midnight",
    icon: Megaphone,
    isGold: true,
  },
  {
    id: "loja",
    templateId: "store-showcase",
    nicheKey: "loja",
    nicheCategory: "Lojas e E-commerce",
    title: "Lojas & E-commerce",
    subtitle: "Catálogo completo com categorias, carrinho e pedidos organizados no WhatsApp",
    theme: "aurora",
    icon: ShoppingBag,
    isGold: true,
  },
  {
    id: "delivery",
    templateId: "store-showcase",
    nicheKey: "delivery",
    nicheCategory: "Delivery e Lanches",
    title: "Delivery & Lanches Rápidos",
    subtitle: "Pizzas, hambúrgueres artesanais, combos, carrinho interativo e pedidos no WhatsApp estilo iFood",
    theme: "sunset",
    icon: UtensilsCrossed,
    isGold: true,
  },
  {
    id: "restaurante",
    templateId: "restaurant-menu",
    nicheKey: "restaurante",
    nicheCategory: "Restaurantes e Gastronomia",
    title: "Restaurante & Gastronomia",
    subtitle: "Cardápio apetitoso com fotos, pratos à la carte e reservas",
    theme: "sunset",
    icon: UtensilsCrossed,
    isGold: true,
  },
  {
    id: "sorveteria",
    templateId: "cinematic-glass",
    nicheKey: "sorveteria",
    nicheCategory: "Sorveteria e Açaí",
    title: "Sorveteria, Açaí & Gelatos",
    subtitle: "Gelatos artesanais, taças de sorvete, açaí gourmet e sobremesas geladas",
    theme: "ocean",
    icon: Sun,
    isGold: true,
  },
  {
    id: "bebidas",
    templateId: "cinematic-glass",
    nicheKey: "bebidas",
    nicheCategory: "Bebidas e Adegas",
    title: "Adega, Bebidas & Distribuidora",
    subtitle: "Cervejas trincando, chopp, vinhos, destilados, gelo e delivery com carrinho",
    theme: "amber",
    icon: Wine,
    isGold: true,
  },
  {
    id: "barbearia",
    templateId: "cinematic-glass",
    nicheKey: "barbearia",
    nicheCategory: "Barbearias e Estilo",
    title: "Barbearia & Barber Shop",
    subtitle: "Cortes modernos, degradê na navalha, barba terapia e agendamento online",
    theme: "midnight",
    icon: Scissors,
    isGold: true,
  },
  {
    id: "beleza",
    templateId: "beauty-glam",
    nicheKey: "beleza",
    nicheCategory: "Beleza e Estética",
    title: "Salão de Beleza, Estética & Nails",
    subtitle: "Unhas em gel, sobrancelhas, escova, hidratação e estética facial",
    theme: "sunset",
    icon: Sparkles,
    isGold: true,
  },
  {
    id: "oficina",
    templateId: "business-modern",
    nicheKey: "oficina",
    nicheCategory: "Oficinas Mecânicas",
    title: "Oficina Mecânica & Auto Center",
    subtitle: "Revisão preventiva, socorro rápido, suspensão e diagnóstico veicular",
    theme: "midnight",
    icon: Wrench,
    isGold: true,
  },
  {
    id: "clinica",
    templateId: "clinic-care",
    nicheKey: "clinica",
    nicheCategory: "Clínicas e Saúde",
    title: "Saúde & Clínica Médica",
    subtitle: "Autoridade médica com corpo clínico e consultas humanizadas",
    theme: "ocean",
    icon: HeartPulse,
    isGold: true,
  },
  {
    id: "psicologia",
    templateId: "therapy-wellbeing",
    nicheKey: "psicologia",
    nicheCategory: "Psicologia e Terapias",
    title: "Terapeutas & Psicólogos",
    subtitle: "Acolhimento humanizado, saúde emocional e sessões presenciais/online",
    theme: "forest",
    icon: Brain,
    isGold: true,
  },
  {
    id: "petshop",
    templateId: "store-showcase",
    nicheKey: "petshop",
    nicheCategory: "Pet Shop e Ração",
    title: "Pet Shop & Casa de Ração",
    subtitle: "Banho, tosa, rações premium, vacinas e cuidados completos para seu pet",
    theme: "forest",
    icon: Dog,
    isGold: true,
  },
  {
    id: "advocacia",
    templateId: "law-authority",
    nicheKey: "advocacia",
    nicheCategory: "Advocacia e Jurídico",
    title: "Advogado & Jurídico",
    subtitle: "Presença corporativa, autoridade jurídica e contato ágil",
    theme: "midnight",
    icon: Scale,
    isGold: true,
  },
  {
    id: "contabilidade",
    templateId: "business-modern",
    nicheKey: "contabilidade",
    nicheCategory: "Contabilidade & Finanças",
    title: "Contabilidade & Consultoria Financeira",
    subtitle: "Abertura de empresas, BPO financeiro, planejamento tributário e assessoria contábil",
    theme: "forest",
    icon: Calculator,
    isGold: true,
  },
  {
    id: "odontologia",
    templateId: "clinic-care",
    nicheKey: "odontologia",
    nicheCategory: "Odontologia",
    title: "Dentista & Odontologia",
    subtitle: "Estrutura moderna, estética dental, implantes e agendamento",
    theme: "ocean",
    icon: Stethoscope,
    isGold: true,
  },
  {
    id: "energia_solar",
    templateId: "business-modern",
    nicheKey: "energia_solar",
    nicheCategory: "Energia Solar",
    title: "Energia Solar & Sustentabilidade",
    subtitle: "Projetos fotovoltaicos, economia de até 95%, homologação e instalação rápida",
    theme: "amber",
    icon: Sun,
    isGold: true,
  },
  {
    id: "construcao",
    templateId: "business-modern",
    nicheKey: "construcao",
    nicheCategory: "Construção Civil",
    title: "Construção Civil & Reformas",
    subtitle: "Obras residenciais e comerciais, reformas, engenharia e acabamentos",
    theme: "amber",
    icon: Building2,
    isGold: true,
  },
  {
    id: "imobiliaria",
    templateId: "business-modern",
    nicheKey: "imobiliaria",
    nicheCategory: "Imobiliárias e Corretores",
    title: "Imobiliária & Corretores",
    subtitle: "Imóveis exclusivos, lançamentos e assessoria de compra/venda",
    theme: "ocean",
    icon: Compass,
    isGold: true,
  },
  {
    id: "seguros",
    templateId: "business-modern",
    nicheKey: "seguros",
    nicheCategory: "Corretora de Seguros",
    title: "Corretora de Seguros",
    subtitle: "Seguro auto, residencial, vida, empresarial e planos de saúde sob medida",
    theme: "ocean",
    icon: ShieldCheck,
    isGold: true,
  },
  {
    id: "autonomo",
    templateId: "business-modern",
    nicheKey: "autonomo",
    nicheCategory: "Profissionais Autônomos",
    title: "Profissional Autônomo & Serviços",
    subtitle: "Técnicos, reparos, instalações elétricas e prestadores de serviços",
    theme: "midnight",
    icon: Briefcase,
    isGold: true,
  },
  {
    id: "pessoal",
    templateId: "portfolio-studio",
    nicheKey: "pessoal",
    nicheCategory: "Página Pessoal",
    title: "Página Pessoal & Portfólio",
    subtitle: "Criadores de conteúdo, palestrantes, consultores e link na bio oficial",
    theme: "aurora",
    icon: UserRound,
    isGold: true,
  },
  {
    id: "fitness",
    templateId: "academy-performance",
    nicheKey: "fitness",
    nicheCategory: "Fitness e Treino",
    title: "Fitness & Personal Trainer",
    subtitle: "Academias, treinos de musculação, personal trainer e studio fitness",
    theme: "forest",
    icon: Dumbbell,
    isGold: true,
  },
  {
    id: "nutricao",
    templateId: "therapy-wellbeing",
    nicheKey: "nutricao",
    nicheCategory: "Nutrição e Saúde",
    title: "Nutricionista & Dietas",
    subtitle: "Reeducação alimentar, emagrecimento consciente e nutrição clínica",
    theme: "forest",
    icon: Sparkles,
    isGold: true,
  },
  {
    id: "costura",
    templateId: "portfolio-studio",
    nicheKey: "costura",
    nicheCategory: "Costura e Ateliê",
    title: "Costureira & Ateliê de Moda",
    subtitle: "Ajustes, reformas de roupas, vestidos sob medida e alta costura",
    theme: "sunset",
    icon: Scissors,
    isGold: true,
  },
  {
    id: "tecnologia",
    templateId: "spotlight-neon",
    nicheKey: "tecnologia",
    nicheCategory: "Tecnologia e TI",
    title: "Tecnologia & Informática",
    subtitle: "Assistência técnica em notebooks, celulares, redes e suporte de TI",
    theme: "midnight",
    icon: Laptop,
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
    nicheCategory: "Biolink Simples",
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
    id: "carousel",
    label: "Carrossel Instagram",
    description: "Fotos de produtos e pedidos",
    icon: Flame,
  },
  {
    id: "sections",
    label: "Seções & Mídia",
    description: "Vídeo, depoimentos e história",
    icon: Layers,
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
  {
    id: "seo",
    label: "Google & SEO",
    description: "Indexação e Rich Snippets",
    icon: Search,
  },
];

const THEMES = [
  {
    id: "ocean",
    label: "Oceano",
    description: "Azul profissional & Turquesa",
    gradientStyle: "linear-gradient(135deg, #0ea5e9, #10b981, #0369a1)",
    primary: "#0ea5e9",
    background: "#070f1e",
    text: "#f8fafc",
    card_bg: "rgba(15, 23, 42, 0.65)",
    border_color: "rgba(14, 165, 233, 0.25)",
  },
  {
    id: "sunset",
    label: "Pôr do Sol",
    description: "Dourado quente, Beleza & Rosa",
    gradientStyle: "linear-gradient(135deg, #ff6a3d, #ffcf3d, #d13a76)",
    primary: "#f97316",
    background: "#0c0a09",
    text: "#fffbeb",
    card_bg: "rgba(28, 25, 23, 0.70)",
    border_color: "rgba(249, 115, 22, 0.25)",
  },
  {
    id: "midnight",
    label: "Noite Dark",
    description: "Dark sofisticado & Grafite",
    gradientStyle: "linear-gradient(135deg, #1e293b, #334155, #050810)",
    primary: "#6366f1",
    background: "#0a0a0c",
    text: "#ffffff",
    card_bg: "rgba(18, 18, 20, 0.75)",
    border_color: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Ciano vibrante & Violeta",
    gradientStyle: "linear-gradient(135deg, #6b3fff, #00d4ff, #ff4d9d)",
    primary: "#8b5cf6",
    background: "#09080f",
    text: "#f8fafc",
    card_bg: "rgba(22, 17, 36, 0.70)",
    border_color: "rgba(139, 92, 246, 0.25)",
  },
  {
    id: "forest",
    label: "Floresta",
    description: "Verde esmeralda & Saúde",
    gradientStyle: "linear-gradient(135deg, #16a34a, #65a30d, #04140a)",
    primary: "#10b981",
    background: "#06130b",
    text: "#f0fdf4",
    card_bg: "rgba(6, 25, 14, 0.70)",
    border_color: "rgba(16, 185, 129, 0.25)",
  },
  {
    id: "mono",
    label: "Claro Minimal",
    description: "Fundo claro limpo & Elegante",
    gradientStyle: "linear-gradient(135deg, #f6f5f2, #e2e8f0, #cbd5e1)",
    primary: "#0f172a",
    background: "#f8fafc",
    text: "#0f172a",
    card_bg: "#ffffff",
    border_color: "rgba(15, 23, 42, 0.15)",
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
  initialTab,
  defaults,
  planAccess,
  onSave,
}: {
  initialBio: BioForm;
  initialLinks: EditableLink[];
  initialProducts?: CatalogItem[];
  initialTab?: EditorTab;
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
    const socialNiche = (initialBio.social_links as Record<string, any>)?.niche;
    const targetNiche = socialNiche || defaults.niche;
    const preset = getPresetForCompany(targetNiche, defaults.displayName);
    return preset.template_id || (isProductCatalogNiche(targetNiche) ? "restaurant-menu" : "business-modern");
  }, [initialBio.template_id, initialBio.social_links, defaults.niche, defaults.displayName]);

  const [bio, setBio] = useState<BioForm>(() => {
    const socialNiche = (initialBio.social_links as Record<string, any>)?.niche;
    const targetNiche = socialNiche || defaults.niche;
    return {
      ...initialBio,
      template_id: initialBio.template_id || initialTemplate,
      theme: initialBio.theme || (getPresetForCompany(targetNiche, defaults.displayName).theme) || "ocean",
    };
  });
  const [links, setLinks] = useState<EditableLink[]>(initialLinks);
  const [products, setProducts] = useState<CatalogItem[]>(initialProducts);
  const [niche, setNiche] = useState<string>(() => (initialBio.social_links as Record<string, any>)?.niche || defaults.niche || "");
  const [selectedNicheId, setSelectedNicheId] = useState<string>(() => {
    const socialData = (initialBio.social_links as Record<string, any>) || {};
    const currentNiche = socialData.niche || defaults.niche || "";
    const match = NICHE_MODELS.find((m) => m.nicheKey === currentNiche || m.id === currentNiche);
    return match?.id || (isProductCatalogNiche(currentNiche) ? "delivery" : "beleza");
  });
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<EditorTab>(() => initialTab || "visual");

  useEffect(() => {
    setActiveTab(initialTab || "visual");
  }, [initialTab]);

  const [draftTemplate, setDraftTemplate] = useState(() => bio.template_id || initialTemplate);
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
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-builder"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      if (u.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com") return true;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      return !!roles?.some((r) => r.role === "admin");
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
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
      complete: (bio?.display_name || "").trim().length >= 2 && Boolean(bio.description?.trim()),
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
  const normalizedSlug = normalizePageSlug(bio?.slug || bio?.display_name || "");
  const pageUrl = publicPageUrl(normalizedSlug, hasProfessionalSubdomain);
  const addressError = hasProfessionalSubdomain
    ? subdomainValidationMessage(bio?.slug || bio?.display_name || "")
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

  const updateBio = (patch: Partial<BioForm>) => {
    setBio((current) => ({ ...current, ...patch }));
    if ((patch.avatar_url !== undefined || patch.cover_url !== undefined) && bio.id) {
      void supabase
        .from("bio_pages")
        .update({
          ...(patch.avatar_url !== undefined ? { avatar_url: patch.avatar_url } : {}),
          ...(patch.cover_url !== undefined ? { cover_url: patch.cover_url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bio.id);
    }
  };

  const handleApplyCopilotResult = (result: AiCopilotResult) => {
    const currentSocial = (bio.social_links as Record<string, any>) || {};

    const customTheme = result.custom_theme
      ? {
          primary: result.custom_theme.primary,
          background: result.custom_theme.background,
          text: result.custom_theme.text,
          card_bg: result.custom_theme.card_bg,
          border_color: result.custom_theme.border_color,
          mode: result.custom_theme.mode,
        }
      : currentSocial.custom_theme;

    const tokensDesign = customTheme
      ? {
          ...(currentSocial.tokens_design || {}),
          fundo_valores: {
            cor_gradiente_1: customTheme.background || "#0b0c10",
            cor_gradiente_2: customTheme.primary || "#1f2937",
            blur_sobreposicao: "8px",
            imagem_url: bio.cover_url || "",
          },
          estilo_botoes: {
            cor_fundo_card: customTheme.card_bg || "rgba(255, 255, 255, 0.04)",
            cor_borda: customTheme.border_color || "rgba(255, 255, 255, 0.12)",
            cor_texto: customTheme.text || "#ffffff",
            cor_destaque: customTheme.primary || "#6366f1",
            raio_borda: currentSocial.tokens_design?.estilo_botoes?.raio_borda || "16px",
          },
        }
      : currentSocial.tokens_design;

    const updatedSocial: Record<string, any> = {
      ...currentSocial,
      custom_theme: customTheme,
      tokens_design: tokensDesign,
    };

    if (result.differentials && result.differentials.length > 0) {
      updatedSocial.differentials = result.differentials;
    }
    if (result.testimonials && result.testimonials.length > 0) {
      updatedSocial.testimonials = result.testimonials;
      updatedSocial.show_testimonials = true;
    }
    if (result.about_section) {
      updatedSocial.about_section = result.about_section;
    }
    if (result.video_embed) {
      updatedSocial.video_embed = result.video_embed;
    }

    const patch: Partial<BioForm> = {
      display_name: result.display_name || bio.display_name,
      description: result.description || bio.description,
      whatsapp_message: result.whatsapp_message || bio.whatsapp_message,
      avatar_url: result.avatar_url || bio.avatar_url,
      cover_url: result.cover_url || bio.cover_url,
      social_links: updatedSocial as any,
    };

    updateBio(patch);

    if (result.suggested_services && result.suggested_services.length > 0) {
      const newItems: CatalogItem[] = result.suggested_services.map((svc, idx) => ({
        id: crypto.randomUUID(),
        bio_page_id: bio.id || "preview",
        type: "service",
        name: svc.name,
        description: svc.description,
        price: svc.price ? Number(svc.price) : null,
        promotional_price: null,
        image_url: svc.image_url || null,
        category: "Destaques",
        button_label: "Saiba mais",
        button_url: null,
        active: true,
        position: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      setProducts(newItems);
    }

    toast.success("Alterações do Copiloto IA aplicadas com sucesso! Clique em 'Salvar' para publicar.");
  };

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
    // 1. Prioridade máxima: ID explícito do modelo de nicho selecionado
    if (selectedNicheId) {
      const byId = NICHE_MODELS.find((m) => m.id === selectedNicheId);
      if (byId) return byId;
    }

    // 2. Prioridade secundária: nicho canônico configurado
    const socialData = (bio.social_links as Record<string, any>) || {};
    const currentNicheKey = niche || socialData.niche || defaults.niche;
    if (currentNicheKey) {
      const byKey = NICHE_MODELS.find((m) => m.nicheKey === currentNicheKey);
      if (byKey) return byKey;
    }

    // 3. Fallback por template apenas se não houver nicho explícito
    const currentTemplate = draftTemplate || bio.template_id;
    if (currentTemplate) {
      const byTemplate = NICHE_MODELS.find((m) => m.templateId === currentTemplate);
      if (byTemplate) return byTemplate;
    }

    return NICHE_MODELS.find((m) => m.id === "beleza") || NICHE_MODELS[0];
  }, [selectedNicheId, niche, bio.social_links, defaults.niche, draftTemplate, bio.template_id]);

  const [autoSyncServices, setAutoSyncServices] = useState<boolean>(true);

  const applyPresetVariant = (
    preset: NichePreset,
    updateServices = autoSyncServices,
    variantIndex?: number
  ) => {
    if (variantIndex !== undefined) {
      setSelectedVariantIndex(variantIndex);
    }
    setDraftTemplate(preset.template_id);
    setNiche(preset.nicheKey);

    const currentSocial = (bio.social_links as Record<string, any>) || {};
    const themeMeta = THEMES.find((t) => t.id === preset.theme) || THEMES[0];

    // Isolamento estrito de nichos com Pure State Reset:
    // Se o nicho selecionado for diferente do nicho anterior gravado em social_links,
    // eliminamos o cache de diferenciais, badges e avaliações do nicho anterior
    // para impedir qualquer vazamento de textos (ex: textos de academia vazando para marketing).
    const previousNiche = currentSocial.niche || niche;
    const isDifferentNiche = Boolean(previousNiche && previousNiche !== preset.nicheKey);

    const cleanedSocial: Record<string, any> = { ...currentSocial };
    if (isDifferentNiche) {
      delete cleanedSocial.differentials;
      delete cleanedSocial.vip_badge;
      delete cleanedSocial.differentials_title;
      delete cleanedSocial.testimonials;
    }

    const patch: Partial<BioForm> = {
      template_id: preset.template_id,
      theme: preset.theme,
      whatsapp_button_label: preset.whatsapp_button_label,
      social_links: {
        ...cleanedSocial,
        niche: preset.nicheKey,
        model_variant: preset.modelName,
        // Sincroniza cores e design tokens diretamente com o tema do novo modelo
        custom_theme: {
          primary: themeMeta.primary,
          background: themeMeta.background,
          text: themeMeta.text,
          card_bg: themeMeta.card_bg,
          border_color: themeMeta.border_color,
          mode: themeMeta.id === "mono" ? "light" : "dark",
        },
        tokens_design: {
          layout_esqueleto:
            preset.template_id === "restaurant-menu" || preset.template_id.includes("store")
              ? "bento_grid"
              : "list_vertical_premium",
          estilo_layout:
            preset.nicheKey === "loja" || preset.nicheKey === "delivery" || preset.nicheKey === "restaurante"
              ? "bento"
              : preset.nicheKey === "advocacia" || preset.nicheKey === "contabilidade"
                ? "minimal"
                : "glassmorphism",
          tipo_fundo: "mesh_gradient",
          fundo_valores: {
            cor_gradiente_1: themeMeta.background,
            cor_gradiente_2: themeMeta.primary,
            blur_sobreposicao: "8px",
            imagem_url: preset.cover_url,
          },
          estilo_botoes: {
            cor_fundo_card: themeMeta.card_bg,
            cor_borda: themeMeta.border_color,
            cor_texto: themeMeta.text,
            cor_destaque: themeMeta.primary,
            raio_borda: "16px",
          },
        },
      },
    };

    const companyDisplayName = bio.display_name || defaults.displayName || "Sua Empresa";
    patch.description = preset.generateDescription(companyDisplayName, "sua cidade");
    patch.whatsapp_message = preset.whatsapp_message(companyDisplayName);

    // Protege imagens personalizadas do cliente: NUNCA sobrescreve se o usuário já fez upload próprio
    const hasCustomCover = Boolean(
      bio.cover_url &&
      !bio.cover_url.includes("template-assets") &&
      !bio.cover_url.includes("unsplash.com")
    );
    const hasCustomAvatar = Boolean(
      bio.avatar_url &&
      !bio.avatar_url.includes("template-assets") &&
      !bio.avatar_url.includes("unsplash.com")
    );

    if (!hasCustomCover && (!bio.cover_url || bio.cover_url.includes("template-assets") || bio.cover_url.includes("unsplash.com"))) {
      patch.cover_url = preset.cover_url;
    }
    if (!hasCustomAvatar && (!bio.avatar_url || bio.avatar_url.includes("template-assets") || bio.avatar_url.includes("unsplash.com"))) {
      patch.avatar_url = preset.avatar_url;
    }

    updateBio(patch);

    if (updateServices) {
      const isStore = preset.template_id === "store-showcase" || preset.nicheKey === "loja";
      const servicesList =
        preset.services && preset.services.length > 0
          ? preset.services
          : (getPresetForCompany(preset.nicheKey, companyDisplayName).services || []);

      const newProducts: CatalogItem[] = servicesList.map((s, idx) => ({
        id: `draft-${crypto.randomUUID()}`,
        type: isStore ? "product" : "service",
        name: s.name,
        category: s.category || (isStore ? "Novidades" : null),
        description: s.description,
        price: s.price,
        image_url: s.image_url,
        button_label: isStore ? "Adicionar" : "Agendar",
        button_url: null,
        position: idx,
        active: true,
      }));
      setProducts(newProducts);
    }
  };

  const selectNicheModel = (model: NicheModelConfig) => {
    setSelectedNicheId(model.id);
    setNiche(model.nicheKey);
    setDraftTemplate(model.templateId);
    setSelectedVariantIndex(0);

    const variants = getVariantsForNiche(model.nicheKey);
    const targetVariant = variants[0] || getPresetForCompany(model.nicheKey, bio.display_name);
    if (targetVariant) {
      applyPresetVariant(targetVariant, true, 0);
    }
  };

  const applyNicheDefaults = (nicheKey: string) => {
    const preset = getPresetForCompany(nicheKey, bio.display_name);
    if (!preset) return;
    applyPresetVariant(preset, true);
  };

  async function save() {
    if (addressError) {
      setValidationMessage(addressError);
      setSaveState("error");
      toast.error(`Ajuste o endereço da página: ${addressError}`);
      setActiveTab("profile");
      return;
    }
    const socialValidation = parseSocialLinks(bio.social_links);
    if (!socialValidation.success) {
      const errorMsg =
        socialValidation.error.issues[0]?.message ?? "Revise os links das redes sociais.";
      setValidationMessage(errorMsg);
      setSaveState("error");
      toast.error(`Atenção ao salvar: ${errorMsg}`);
      setActiveTab("contact");
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
      toast.success("Tudo salvo e publicado com sucesso!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Save failed", error);
      const errorMsg =
        error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.";
      setValidationMessage(errorMsg);
      setSaveState("error");
      toast.error(`Erro ao salvar: ${errorMsg}`);
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
      {/* Barra de Ações e Status Superior Unificada e Proporcional */}
      <header className="builder-header-unified card-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="h-3 w-3" />
                  Página Bio Link
                </span>
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium truncate max-w-[220px] sm:max-w-xs"
                >
                  <span>eialink.com.br/p/{bio.slug || "sua-pagina"}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                </a>
              </div>
              <h1 className="mt-1 text-lg sm:text-xl font-bold text-foreground truncate">
                {bio.display_name || "Minha Página"}
              </h1>
            </div>
          </div>

          {/* Status de Prontidão Compacto e Ações */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Indicador de Prontidão Compacto */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                completedSetupSteps === 3
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
              }`}
            >
              {completedSetupSteps === 3 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span>
                {completedSetupSteps === 3
                  ? "Pronta para converter"
                  : `${completedSetupSteps}/3 etapas configuradas`}
              </span>
            </div>

            {hasPendingChanges && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Alterações pendentes
              </span>
            )}

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="btn-secondary xl:hidden text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" /> Prévia
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                title="Ajustar cores, textos, diferenciais e serviços com Inteligência Artificial (Exclusivo Super Admin)"
              >
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span>Copiloto IA (Admin)</span>
              </button>
            )}

            <a
              href={pageUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary hidden sm:inline-flex text-xs py-2 px-3 items-center gap-1.5"
            >
              <ExternalLink className="h-4 w-4" /> Ver página
            </a>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className={`text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm rounded-xl font-bold transition-all cursor-pointer ${
                hasPendingChanges || saveState === "error"
                  ? "btn-primary"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : saveState === "error" ? (
                <>
                  <Save className="h-4 w-4 text-rose-200" />
                  <span>Tentar novamente</span>
                </>
              ) : hasPendingChanges ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar e publicar</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Tudo salvo ✓</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

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
                    try {
                      const url = new URL(window.location.href);
                      if (tab.id === "visual") {
                        url.searchParams.delete("tab");
                      } else {
                        url.searchParams.set("tab", tab.id);
                      }
                      window.history.replaceState({}, "", url.toString());
                    } catch {}
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

                {/* 0. Seletor de Formato da Página: Site Institucional vs BioLink vs Loja */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-primary" />
                      <span>Formato da Presença Comercial</span>
                    </label>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {bio.template_id === "site-maquina"
                        ? "Site Institucional Completo"
                        : bio.template_id === "storefront" || bio.template_id === "store-showcase"
                        ? "Loja / Delivery App"
                        : "BioLink de Bolso"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Escolha o objetivo principal desta página. O motor do Máquina de Sites oferece presença completa, enquanto o BioLink foca em conversão rápida.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateBio({ template_id: "site-maquina" });
                        toast.success("Formato alterado para: Site Institucional (Padrão Máquina de Sites)");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bio.template_id === "site-maquina"
                          ? "border-2 border-primary bg-primary/15 text-foreground shadow-md font-bold ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🖥️</span>
                        {bio.template_id === "site-maquina" && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">✓ Ativo</span>
                        )}
                      </div>
                      <div className="text-xs font-bold">Site / Landing Page</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Padrão Máquina de Sites: Hero, Prova Social, FAQ e Mapa</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateBio({ template_id: "default" });
                        toast.success("Formato alterado para: BioLink de Alta Conversão");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bio.template_id !== "site-maquina" &&
                        bio.template_id !== "storefront" &&
                        bio.template_id !== "store-showcase"
                          ? "border-2 border-primary bg-primary/15 text-foreground shadow-md font-bold ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">📱</span>
                        {bio.template_id !== "site-maquina" &&
                         bio.template_id !== "storefront" &&
                         bio.template_id !== "store-showcase" && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">✓ Ativo</span>
                        )}
                      </div>
                      <div className="text-xs font-bold">BioLink de Bolso</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Compacto, direto para o Instagram e WhatsApp em 1 clique</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateBio({ template_id: "store-showcase" });
                        toast.success("Formato alterado para: Delivery & Loja Virtual (App / PWA)");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bio.template_id === "storefront" || bio.template_id === "store-showcase"
                          ? "border-2 border-primary bg-primary/15 text-foreground shadow-md font-bold ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🛍️</span>
                        {(bio.template_id === "storefront" || bio.template_id === "store-showcase") && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">✓ Ativo</span>
                        )}
                      </div>
                      <div className="text-xs font-bold">Delivery / Loja App</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Sensação de iFood com sacola flutuante e instalação PWA</div>
                    </button>
                  </div>
                </div>

                {/* 1. Grade de Nichos / Modelos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">
                      1. Escolha o Nicho e Modelo
                    </label>
                    <span className="text-xs text-muted-foreground font-medium">
                      Ativo: <span className="text-foreground">{activeNicheModel.title}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {NICHE_MODELS.map((model) => {
                      const Icon = model.icon;
                      const isSelected = activeNicheModel.id === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => selectNicheModel(model)}
                          className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 ${
                            isSelected
                              ? "border-2 border-primary bg-primary/15 shadow-sm ring-2 ring-primary/30 text-foreground"
                              : "border-border bg-card hover:border-primary/50 hover:bg-muted/30 text-foreground shadow-2xs"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                : "border-border bg-muted/60 text-slate-700 dark:text-muted-foreground group-hover:text-primary group-hover:border-primary/40"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? "text-primary font-bold" : "text-foreground group-hover:text-primary"}`}>
                                {model.title}
                              </p>
                              {isSelected && (
                                <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-bold shrink-0">✓ Ativo</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                              {model.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 1.1 Seleção dos 3 Modelos Visuais Exclusivos do Nicho */}
                  <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--primary)] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Modelos Visuais de {activeNicheModel.title}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Cada nicho possui 3 identidades completas com layout, textos e serviços exclusivos.
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none shrink-0">
                        <input
                          type="checkbox"
                          checked={autoSyncServices}
                          onChange={(e) => setAutoSyncServices(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-border text-[color:var(--primary)]"
                        />
                        <span>Sincronizar serviços</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {getVariantsForNiche(activeNicheModel.nicheKey).map((variant, idx) => {
                        const currentSocial = (bio.social_links as Record<string, any>) || {};
                        const isVariantSelected =
                          selectedVariantIndex === idx ||
                          currentSocial.model_variant === variant.modelName ||
                          (bio.template_id === variant.template_id && bio.theme === variant.theme);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyPresetVariant(variant, autoSyncServices, idx)}
                            className={`p-3 rounded-xl border text-left transition-all duration-150 relative flex flex-col justify-between ${
                              isVariantSelected
                                ? "border-2 border-primary bg-primary/15 shadow-sm ring-2 ring-primary/30 text-foreground"
                                : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground shadow-2xs"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/15 text-primary">
                                  Modelo {idx + 1}
                                </span>
                                <span className="text-[10px] text-muted-foreground capitalize font-medium">
                                  {variant.theme}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                                {variant.modelName}
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                                {variant.generateHeadline(bio.display_name || defaults.displayName || "Sua Empresa", "sua cidade")}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{variant.services?.length || 3} serviços</span>
                              <span className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${isVariantSelected ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"}`}>
                                {isVariantSelected ? "✓ Ativo" : "Aplicar"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banner de 1-Clique para Fotos & Serviços Recomendados */}
                  {activeNicheModel.nicheKey !== "geral" && (
                    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 text-foreground">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Fotos e Serviços Recomendados de {activeNicheModel.title}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Preencher capa, avatar e catálogo com fotos do Unsplash e tratamentos deste nicho.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyNicheDefaults(activeNicheModel.nicheKey)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-card hover:bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 transition-colors shrink-0 shadow-2xs"
                      >
                        <Wand2 className="h-3.5 w-3.5 text-primary" />
                        <span>Aplicar ao Catálogo</span>
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
                          onClick={() => {
                            const currentSocial = (bio.social_links as Record<string, any>) || {};
                            updateBio({
                              theme: theme.id,
                              social_links: {
                                ...currentSocial,
                                custom_theme: {
                                  primary: theme.primary,
                                  background: theme.background,
                                  text: theme.text,
                                  card_bg: theme.card_bg,
                                  border_color: theme.border_color,
                                  mode: theme.id === "mono" ? "light" : "dark",
                                },
                                tokens_design: {
                                  ...(currentSocial.tokens_design || {}),
                                  fundo_valores: {
                                    ...(currentSocial.tokens_design?.fundo_valores || {}),
                                    cor_gradiente_1: theme.background,
                                    cor_gradiente_2: theme.primary,
                                  },
                                  estilo_botoes: {
                                    ...(currentSocial.tokens_design?.estilo_botoes || {}),
                                    cor_destaque: theme.primary,
                                    cor_texto: theme.text,
                                    cor_fundo_card: theme.card_bg,
                                    cor_borda: theme.border_color,
                                  },
                                },
                              },
                            });
                          }}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-2 border-primary bg-primary/15 text-foreground ring-2 ring-primary/30 shadow-sm font-semibold"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground shadow-2xs"
                          }`}
                        >
                          <span
                            className="h-5 w-5 shrink-0 rounded-full border border-white/20 shadow-xs"
                            style={{ background: theme.gradientStyle }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-xs truncate text-foreground">{theme.label}</p>
                              {isSelected && <span className="text-[10px] text-primary font-bold">✓ Ativo</span>}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate font-normal">{theme.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Seletor Livre de Cores Hex & Design Tokens (Recolhido para simplificar o uso diário) */}
                  <details className="group rounded-xl border border-border/80 bg-card/40 p-3.5 mt-2 transition-all">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between select-none">
                      <span className="flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        <span>Personalização Avançada de Cores e Fundo (Opcional)</span>
                      </span>
                      <span className="text-[11px] text-primary group-open:hidden">Editar cores livres</span>
                      <span className="text-[11px] text-muted-foreground hidden group-open:inline">Recolher</span>
                    </summary>
                    <div className="pt-3 mt-2 border-t border-border/60">
                      <ColorPickerControl
                        value={(bio.social_links as Record<string, any>)?.custom_theme}
                        currentThemeId={bio.theme || "aurora"}
                        onChange={(customTheme) => {
                          const currentSocial = (bio.social_links as Record<string, any>) || {};
                          const tokensDesign = customTheme
                            ? {
                                layout_esqueleto: customTheme.layout_esqueleto || "list_vertical_premium",
                                tipo_fundo: customTheme.mode === "gradient" ? "mesh_gradient" : customTheme.mode === "light" ? "solido" : "mesh_gradient",
                                fundo_valores: {
                                  cor_gradiente_1: customTheme.background || customTheme.gradient_1 || "#0b0c10",
                                  cor_gradiente_2: customTheme.gradient_2 || customTheme.primary || "#1f2937",
                                  blur_sobreposicao: "8px",
                                  imagem_url: bio.cover_url || "",
                                },
                                estilo_botoes: {
                                  cor_fundo_card: customTheme.card_bg || (customTheme.mode === "light" ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
                                  cor_borda: customTheme.border_color || (customTheme.mode === "light" ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.12)"),
                                  cor_texto: customTheme.text || (customTheme.mode === "light" ? "#0f172a" : "#ffffff"),
                                  cor_destaque: customTheme.primary || "#6366f1",
                                  raio_borda: customTheme.border_radius || "16px",
                                },
                              }
                            : undefined;

                          updateBio({
                            social_links: {
                              ...currentSocial,
                              custom_theme: customTheme,
                              tokens_design: tokensDesign,
                            } as any,
                          });
                        }}
                      />
                    </div>
                  </details>
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
                    niche={niche || activeNicheModel.nicheKey}
                    companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                    aiUsageCount={Number((bio.social_links as Record<string, any>)?.ai_images_count) || 0}
                    onAiUsageIncrement={() => {
                      const currentSocial = (bio.social_links as Record<string, any>) || {};
                      const count = Number(currentSocial.ai_images_count) || 0;
                      updateBio({
                        social_links: {
                          ...currentSocial,
                          ai_images_count: count + 1,
                        },
                      });
                    }}
                    onChange={(cover_url) => updateBio({ cover_url })}
                  />

                  <MediaUploader
                    label="Foto de Perfil ou Logotipo da Empresa"
                    value={bio.avatar_url}
                    variant="avatar"
                    templateId={draftTemplate}
                    niche={niche || activeNicheModel.nicheKey}
                    companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                    aiUsageCount={Number((bio.social_links as Record<string, any>)?.ai_images_count) || 0}
                    onAiUsageIncrement={() => {
                      const currentSocial = (bio.social_links as Record<string, any>) || {};
                      const count = Number(currentSocial.ai_images_count) || 0;
                      updateBio({
                        social_links: {
                          ...currentSocial,
                          ai_images_count: count + 1,
                        },
                      });
                    }}
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

            {/* ABA 2: CARROSSEL DE PRODUTOS & DESTAQUES ESTILO INSTAGRAM */}
            {activeTab === "carousel" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Vitrine Interativa de Fotos
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Carrossel de Produtos & Destaques (Estilo Instagram)</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre até 10 fotos deslizantes com formato 4:5 vertical, preço, etiqueta de destaque e botão de pedido direto no WhatsApp.
                  </p>
                </div>

                <ProductCarouselManager
                  bio={bio as any}
                  companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                  bioPageId={bio.id}
                  socialLinks={(bio.social_links as Record<string, any>) || {}}
                  onUpdateSocialLinks={(social_links) => updateBio({ social_links })}
                />
              </div>
            )}

            {/* ABA: SEÇÕES & MÍDIA */}
            {activeTab === "sections" && (
              <SectionsEditor
                nicheKey={niche || activeNicheModel.nicheKey}
                companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                socialLinks={(bio.social_links as Record<string, any>) || {}}
                onUpdateSocialLinks={(social_links) => updateBio({ social_links })}
                coverUrl={bio.cover_url}
                avatarUrl={bio.avatar_url}
                onUpdateCover={(cover_url) => updateBio({ cover_url })}
                onUpdateAvatar={(avatar_url) => updateBio({ avatar_url })}
                templateId={draftTemplate}
                bioPageId={bio.id}
                aiUsageCount={Number((bio.social_links as Record<string, any>)?.ai_images_count) || 0}
                onAiUsageIncrement={() => {
                  const currentSocial = (bio.social_links as Record<string, any>) || {};
                  const count = Number(currentSocial.ai_images_count) || 0;
                  updateBio({
                    social_links: {
                      ...currentSocial,
                      ai_images_count: count + 1,
                    },
                  });
                }}
              />
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
                    Nome comercial, logotipo, fotos da marca, descrição e link exclusivo da sua página.
                  </p>
                </div>

                {/* 📸 Logotipo & Imagens da Marca */}
                <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      📸 Logotipo & Imagens da Marca
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Suba a identidade visual da sua empresa para destacar sua marca no topo e em todas as seções.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <MediaUploader
                        label="Logotipo da Marca (Ícone Oficial do App PWA & Cabeçalho)"
                        value={bio.avatar_url}
                        variant="avatar"
                        templateId={draftTemplate}
                        niche={niche || activeNicheModel.nicheKey}
                        companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                        aiUsageCount={Number((bio.social_links as Record<string, any>)?.ai_images_count) || 0}
                        onAiUsageIncrement={() => {
                          const currentSocial = (bio.social_links as Record<string, any>) || {};
                          const count = Number(currentSocial.ai_images_count) || 0;
                          updateBio({
                            social_links: {
                              ...currentSocial,
                              ai_images_count: count + 1,
                            },
                          });
                        }}
                        onChange={(avatar_url) => updateBio({ avatar_url })}
                      />
                      <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span>📲</span>
                        <span>Este logotipo será usado como ícone do aplicativo na tela inicial do celular do cliente.</span>
                      </p>
                    </div>

                    <div>
                      <MediaUploader
                        label="Imagem de Capa (Hero / Banner Principal)"
                        value={bio.cover_url}
                        variant="cover"
                        templateId={draftTemplate}
                        niche={niche || activeNicheModel.nicheKey}
                        companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                        aiUsageCount={Number((bio.social_links as Record<string, any>)?.ai_images_count) || 0}
                        onAiUsageIncrement={() => {
                          const currentSocial = (bio.social_links as Record<string, any>) || {};
                          const count = Number(currentSocial.ai_images_count) || 0;
                          updateBio({
                            social_links: {
                              ...currentSocial,
                              ai_images_count: count + 1,
                            },
                          });
                        }}
                        onChange={(cover_url) => updateBio({ cover_url })}
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Foto principal exibida em destaque no topo da página.
                      </p>
                    </div>
                  </div>
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

                {/* Módulo de Atendente Virtual Interativo (Typebot Simplificado) */}
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Bot className="h-4 w-4 text-sky-400" />
                        <span>Atendente Virtual (Typebot Simplificado)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bio.template_id === "ai-chat-agent"
                          ? "Sua página está no modelo Atendente Virtual. Personalize o fluxo de atendimento, botões e respostas automáticas:"
                          : "Ativa um botão flutuante com atendente virtual que tira dúvidas, apresenta serviços e monta o orçamento passo a passo."}
                      </p>
                    </div>
                    {bio.template_id !== "ai-chat-agent" && (
                      <input
                        type="checkbox"
                        checked={Boolean((bio.social_links as Record<string, unknown>)?.ai_chat_enabled)}
                        onChange={(e) => {
                          const current = (bio.social_links as Record<string, unknown>) || {};
                          updateBio({
                            social_links: {
                              ...current,
                              ai_chat_enabled: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-border text-[color:var(--primary)]"
                      />
                    )}
                  </div>
                  {(Boolean((bio.social_links as Record<string, unknown>)?.ai_chat_enabled) || bio.template_id === "ai-chat-agent") && (
                    <div className="pt-2">
                      <ChatFlowEditor
                        value={(bio.social_links as Record<string, any>)?.chat_flow}
                        onChange={(newFlow) => {
                          const current = (bio.social_links as Record<string, any>) || {};
                          updateBio({
                            social_links: {
                              ...current,
                              chat_flow: newFlow,
                            } as any,
                          });
                        }}
                        companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                      />
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
                                const current =
                                  bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links)
                                    ? bio.social_links
                                    : {};
                                const next = { ...current } as Record<string, unknown>;
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

            {/* ABA 4: SERVIÇOS & PREÇOS / PRODUTOS & CATÁLOGO */}
            {activeTab === "catalog" && (
              <div className="space-y-6">
                {(() => {
                  const isStore = activeNicheModel.nicheKey === "loja" || activeNicheModel.templateId.includes("store");
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                          {isStore ? "Catálogo & Vitrine da Loja" : "Catálogo & Serviços"}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold">
                          {isStore ? "Produtos, Categorias & Preços" : "Serviços, Preços & Links"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isStore
                            ? "Cadastre os produtos da sua loja com categorias, fotos e valores para venda com carrinho."
                            : "Apresente seus principais serviços com valores e fotos em destaque."}
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
                                  id: `draft-${crypto.randomUUID()}`,
                                  type: isStore ? "product" : "service",
                                  name: s.name,
                                  category: s.category || (isStore ? "Novidades" : null),
                                  description: s.description,
                                  price: s.price,
                                  image_url: s.image_url,
                                  button_label: isStore ? "Adicionar" : "Agendar",
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
                          <span>{isStore ? "Importar Produtos da Loja" : "Importar Serviços do Nicho"}</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Editor do Catálogo de Produtos e Serviços */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
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

            {/* ABA 6: GOOGLE & SEO */}
            {activeTab === "seo" && (
              <SeoEditor
                value={(bio.social_links as Record<string, any>)?.seo}
                onChange={(newSeo) => {
                  const current = (bio.social_links as Record<string, any>) || {};
                  updateBio({
                    social_links: {
                      ...current,
                      seo: newSeo,
                    } as any,
                  });
                }}
                companyName={bio.display_name || defaults.displayName || "Sua Empresa"}
                nicheKey={niche || (bio.social_links as any)?.niche}
                city={(bio.social_links as any)?.address}
                slug={bio.slug || "minha-pagina"}
                rating={(bio.social_links as any)?.google_rating}
                reviewsCount={(bio.social_links as any)?.reviews_count}
              />
            )}

            {saveState === "error" && (
              <p role="alert" className="mt-4 text-sm text-[color:var(--destructive)]">
                {validationMessage ||
                  "Não foi possível salvar. Confira sua conexão e tente novamente."}
              </p>
            )}
          </aside>
        </section>

        {/* Prévia Interativa do Celular em Tempo Real (Coluna 40% Fixa) */}
        <main
          ref={previewRef}
          className={`builder-preview-stage min-w-0 ${previewOpen ? "is-mobile-open" : ""}`}
        >
          {/* Header Mobile da Gaveta */}
          <div className="builder-preview-mobile-header">
            <div>
              <b>Prévia da sua página</b>
              <small>As mudanças aparecem aqui na hora</small>
            </div>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar prévia">
              <X aria-hidden />
            </button>
          </div>

          {/* Badge Minimalista de Status */}
          <div className="hidden lg:inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full border border-[#1f1f23] bg-zinc-950/80 text-[11px] font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Prévia em Tempo Real</span>
          </div>

          {/* Mockup do smartphone: no mobile exibe 100% tela cheia nativa; no desktop exibe o mockup do iPhone */}
          <div className="editor-phone-preview-wrapper relative flex items-center justify-center w-full h-full my-auto py-0 lg:py-1">
            {/* Sombra de profundidade e brilho ambiente suave para efeito de flutuação */}
            <div className="hidden lg:block absolute -inset-4 bg-gradient-to-b from-primary/10 via-purple-600/5 to-transparent rounded-[3.2rem] blur-2xl -z-10 pointer-events-none opacity-60" />

            {(() => {
              const previewSocial = (previewBio.social_links as Record<string, any>) || {};
              const previewCustomTheme = previewSocial?.custom_theme;
              const previewTokens = previewSocial?.tokens_design;
              const activeThemeMeta = THEMES.find((t) => t.id === (previewBio.theme || "aurora")) || THEMES[0];

              const previewCustomPrimary = previewCustomTheme?.primary || previewTokens?.estilo_botoes?.cor_destaque || activeThemeMeta.primary;
              const previewCustomBg = previewCustomTheme?.background || previewTokens?.fundo_valores?.cor_gradiente_1 || activeThemeMeta.background;
              const previewCustomText = previewCustomTheme?.text || previewTokens?.estilo_botoes?.cor_texto || activeThemeMeta.text;
              const previewCustomCard = previewCustomTheme?.card_bg || previewTokens?.estilo_botoes?.cor_fundo_card || activeThemeMeta.card_bg;
              const previewCustomBorder = previewCustomTheme?.border_color || previewTokens?.estilo_botoes?.cor_borda || activeThemeMeta.border_color;
              const previewCustomRadius = previewCustomTheme?.border_radius || previewTokens?.estilo_botoes?.raio_borda || "16px";
              const isPreviewLight = previewCustomTheme?.mode === "light" || previewBio.theme === "mono";

              // Chave estável para evitar remontagens desnecessárias e perda de rolagem na prévia
              const stableTemplateKey = previewBio.template_id || "default";

              return (
                <div
                  key="phone-preview-container"
                  className={`editor-phone-preview bio-theme ${previewBio.theme || "aurora"} relative w-full lg:w-[310px] xl:w-[330px] h-full lg:h-[min(650px,calc(100vh-10rem))] rounded-none lg:rounded-[2.8rem] border-0 lg:border-[6px] border-[#18181b] shadow-none lg:shadow-2xl shadow-black/90 ring-0 lg:ring-1 ring-white/10 overflow-hidden flex flex-col transition-all`}
                  data-custom-primary={Boolean(previewCustomPrimary) ? "true" : undefined}
                  data-custom-text={Boolean(previewCustomText) ? "true" : undefined}
                  data-custom-bg={Boolean(previewCustomBg) ? "true" : undefined}
                  data-custom-card={Boolean(previewCustomCard) ? "true" : undefined}
                  data-custom-border={Boolean(previewCustomBorder) ? "true" : undefined}
                  style={{
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                    // Tailwind v4 Tokens Bridge
                    "--primary": previewCustomPrimary,
                    "--primary-foreground": "#ffffff",
                    "--primary-glow": previewCustomPrimary,
                    "--foreground": previewCustomText,
                    "--card": previewCustomCard || (isPreviewLight ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
                    "--card-foreground": previewCustomText,
                    "--border": previewCustomBorder || (isPreviewLight ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),
                    "--radius": previewCustomRadius || "16px",
                    color: previewCustomText,

                    // Tokens Nativos
                    "--cor-destaque": previewCustomPrimary,
                    "--cor-principal": previewCustomPrimary,
                    "--cor-texto": previewCustomText,
                    "--cor-fundo-card": previewCustomCard || (isPreviewLight ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
                    "--cor-borda": previewCustomBorder || (isPreviewLight ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),
                    "--raio-borda": previewCustomRadius || "16px",

                    "--bio-fg": previewCustomText,
                    "--bio-muted": isPreviewLight ? "rgba(15, 23, 42, 0.72)" : `color-mix(in srgb, ${previewCustomText} 70%, transparent)`,
                    "--bio-card": previewCustomCard || (isPreviewLight ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
                    "--bio-border": previewCustomBorder || (isPreviewLight ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),

                    ...(previewCustomPrimary ? { "--template-primary": previewCustomPrimary, "--free-link-accent": previewCustomPrimary } : {}),
                    ...(previewCustomBg ? { "--template-bg": previewCustomBg, background: previewCustomBg } : {}),
                    ...(previewCustomText ? { "--template-text": previewCustomText } : {}),
                  } as React.CSSProperties}
                >
                  {/* Dynamic Island / Notch minimalista (Apenas Desktop) */}
                  <div className="dynamic-island hidden lg:flex absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#111114] border border-white/5 rounded-full z-30 pointer-events-none items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/10 ml-auto mr-2" />
                  </div>

                  {/* Área rolável: no mobile rola fluidamente tela cheia, sem travar o toque */}
                  <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pt-2 lg:pt-7 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain">
                    {isFreeTemplate ? (
                      <FreeLinkRenderer
                        bio={previewBio}
                        links={previewLinks.filter((link) => link.active)}
                        onTrack={() => undefined}
                        onShare={() => undefined}
                        products={products}
                        supplemental={<ModularSections bio={previewBio} onTrack={() => undefined} hideProductCarouselIfInLayout={true} />}
                      />
                    ) : (
                      <TemplateRenderer
                        key={stableTemplateKey}
                        bio={previewBio}
                        links={previewLinks.filter((link) => link.active)}
                        onTrack={() => undefined}
                        onShare={() => undefined}
                        products={products}
                        bookingUrl={`/agendar/${previewBio.slug}`}
                        motionLevel={previewBio.motion_enabled === false ? "off" : "pro"}
                        supplemental={
                          <ModularSections
                            bio={previewBio}
                            onTrack={() => undefined}
                            hideProductCarouselIfInLayout={previewBio.template_id === "site-maquina"}
                            hideTestimonialsIfInLayout={previewBio.template_id === "site-maquina"}
                          />
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })()}
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

      <AiCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentContext={{
          displayName: bio.display_name,
          niche: niche || activeNicheModel.nicheKey,
          city: (bio.social_links as any)?.address || (bio.social_links as any)?.city,
        }}
        onApply={handleApplyCopilotResult}
      />
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
