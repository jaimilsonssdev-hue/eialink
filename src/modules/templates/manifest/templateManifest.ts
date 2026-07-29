import { defaultTheme } from "../themes/defaultTheme";
import type { TemplateDefinition, ThemeTokens } from "../types";

type TemplateInput = Omit<TemplateDefinition, "version" | "status" | "theme"> & {
  theme: Partial<ThemeTokens> & Pick<ThemeTokens, "colors">;
};

const theme = (colors: ThemeTokens["colors"], fontFamily = "inherit"): ThemeTokens => ({
  ...defaultTheme,
  colors,
  typography: { ...defaultTheme.typography, fontFamily },
});

const badgeByCategory: Record<TemplateDefinition["category"], TemplateDefinition["badge"]> = {
  minimal: "Novo",
  creator: "Popular",
  business: "Mais usado",
  restaurant: "Novo",
  beauty: "Novo",
  store: "Popular",
  portfolio: "Novo",
  premium: "Premium",
};

const bestForByCategory: Record<TemplateDefinition["category"], string> = {
  minimal: "perfis objetivos",
  creator: "criadores e influenciadores",
  business: "serviços profissionais",
  store: "lojas e catálogos",
  restaurant: "restaurantes e pedidos",
  beauty: "beleza e bem-estar",
  portfolio: "portfólios criativos",
  premium: "marcas que buscam sofisticação",
};

const define = (template: TemplateInput): TemplateDefinition => ({
  ...template,
  badge: template.badge ?? badgeByCategory[template.category],
  bestFor: template.bestFor ?? bestForByCategory[template.category],
  version: "1.0.0",
  status: "active",
  theme: theme(template.theme.colors, template.theme.typography?.fontFamily),
});

const displayFont = '"DM Sans", "Inter", ui-sans-serif, system-ui, sans-serif';

export const templateManifest: TemplateDefinition[] = [
  define({
    id: "default",
    slug: "default",
    name: "Clássico",
    description: "O visual atual da sua página.",
    category: "minimal",
    theme: {
      colors: {
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#0f172a",
        muted: "#64748b",
        primary: "#6b3fff",
      },
    },
    layout: "vertical",
    components: ["banner", "profile", "links", "pix", "footer"],
    componentVariants: {
      banner: "default",
      profile: "default",
      links: "default",
      pix: "default",
      footer: "default",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  }),
  define({
    id: "minimal-light",
    slug: "minimal-light",
    name: "Essencial",
    description: "Leve, claro e direto ao ponto.",
    category: "minimal",
    theme: {
      colors: {
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#0f172a",
        muted: "#64748b",
        primary: "#4f46e5",
      },
    },
    layout: "minimal",
    components: ["profile", "links", "footer"],
    componentVariants: { profile: "default", links: "minimal", footer: "discreet" },
    supportedFeatures: ["profile", "links", "socials"],
  }),
  define({
    id: "minimal-ink",
    slug: "minimal-ink",
    name: "Noite",
    description: "Minimalismo escuro com presença marcante.",
    category: "minimal",
    theme: {
      colors: {
        background: "#111827",
        surface: "#1f2937",
        text: "#f9fafb",
        muted: "#cbd5e1",
        primary: "#a78bfa",
      },
    },
    layout: "minimal",
    components: ["profile", "links", "footer"],
    componentVariants: { profile: "business", links: "glass", footer: "discreet" },
    supportedFeatures: ["profile", "links", "socials"],
  }),
  define({
    id: "creator-bold",
    slug: "creator-bold",
    name: "Criador em foco",
    description: "Visual expressivo para conteúdo e comunidade.",
    category: "creator",
    theme: {
      colors: {
        background: "#fff7ed",
        surface: "#ffffff",
        text: "#431407",
        muted: "#9a3412",
        primary: "#ea580c",
      },
    },
    layout: "creator",
    components: ["banner", "profile", "links", "footer"],
    componentVariants: {
      banner: "compact",
      profile: "overlapping-banner",
      links: "elevated",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "socials", "whatsapp"],
  }),
  define({
    id: "creator-soft",
    slug: "creator-soft",
    name: "Criador leve",
    description: "Uma apresentação acolhedora para sua audiência.",
    category: "creator",
    theme: {
      colors: {
        background: "#fdf2f8",
        surface: "#ffffff",
        text: "#500724",
        muted: "#9d174d",
        primary: "#db2777",
      },
    },
    layout: "cards",
    components: ["banner", "profile", "links", "pix", "footer"],
    componentVariants: {
      banner: "compact",
      profile: "overlapping-banner",
      links: "glass",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "socials", "pix"],
  }),
  define({
    id: "business-modern",
    slug: "business-modern",
    name: "Clínica moderna",
    description: "Visual claro e humano para clínicas, consultórios e dentistas.",
    category: "business",
    badge: "Novo",
    bestFor: "clínicas, consultórios e profissionais de saúde",
    theme: {
      colors: {
        background: "#f5f9ff",
        surface: "#ffffff",
        text: "#0b2545",
        muted: "#4b6584",
        primary: "#0e7c86",
      },
      typography: { fontFamily: displayFont } as ThemeTokens["typography"],
    },
    layout: "clinic",
    components: ["profile", "links", "pix", "footer"],
    componentVariants: {},
    supportedFeatures: ["profile", "links", "whatsapp", "pix", "services"],
  }),
  define({
    id: "business-classic",
    slug: "business-classic",
    name: "Executivo",
    description: "Sóbrio e confiável para atendimento profissional.",
    category: "business",
    theme: {
      colors: {
        background: "#f1f5f9",
        surface: "#ffffff",
        text: "#172554",
        muted: "#475569",
        primary: "#1d4ed8",
      },
    },
    layout: "vertical",
    components: ["banner", "profile", "links", "pix", "footer"],
    componentVariants: {
      banner: "default",
      profile: "business",
      links: "minimal",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  }),
  define({
    id: "store-showcase",
    slug: "store-showcase",
    name: "Vitrine",
    description: "Pequena loja online com produtos em destaque.",
    category: "store",
    badge: "Novo",
    bestFor: "lojas, revendedoras e catálogos de produtos",
    theme: {
      colors: {
        background: "#fafaf7",
        surface: "#ffffff",
        text: "#111827",
        muted: "#6b7280",
        primary: "#111827",
      },
      typography: { fontFamily: displayFont } as ThemeTokens["typography"],
    },
    layout: "storefront",
    components: ["profile", "links", "pix", "footer"],
    componentVariants: {},
    supportedFeatures: ["profile", "links", "whatsapp", "pix", "products"],
  }),
  define({
    id: "restaurant-menu",
    slug: "restaurant-menu",
    name: "Sabor",
    description: "Cardápio editorial e quente para restaurantes e cafés.",
    category: "restaurant",
    badge: "Novo",
    bestFor: "restaurantes, cafés e delivery",
    theme: {
      colors: {
        background: "#1a0f0a",
        surface: "#241611",
        text: "#fef3c7",
        muted: "#d6b48a",
        primary: "#e0b060",
      },
      typography: { fontFamily: displayFont } as ThemeTokens["typography"],
    },
    layout: "restaurant",
    components: ["profile", "links", "pix", "footer"],
    componentVariants: {},
    supportedFeatures: ["profile", "links", "whatsapp", "pix", "menu"],
  }),
  define({
    id: "beauty-glow",
    slug: "beauty-glow",
    name: "Aura",
    description: "Delicado e sofisticado para beleza e bem-estar.",
    category: "beauty",
    theme: {
      colors: {
        background: "#fdf2f8",
        surface: "#ffffff",
        text: "#701a75",
        muted: "#a21caf",
        primary: "#c026d3",
      },
    },
    layout: "vertical",
    components: ["banner", "profile", "links", "pix", "footer"],
    componentVariants: {
      banner: "compact",
      profile: "overlapping-banner",
      links: "glass",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "socials", "pix"],
  }),
  define({
    id: "portfolio-studio",
    slug: "portfolio-studio",
    name: "Estúdio",
    description: "Uma vitrine autoral para portfólios e projetos.",
    category: "portfolio",
    theme: {
      colors: {
        background: "#18181b",
        surface: "#27272a",
        text: "#fafafa",
        muted: "#d4d4d8",
        primary: "#facc15",
      },
    },
    layout: "creator",
    components: ["banner", "profile", "links", "footer"],
    componentVariants: {
      banner: "default",
      profile: "business",
      links: "glass",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "socials"],
  }),
];
