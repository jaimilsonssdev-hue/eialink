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

const define = (template: TemplateInput): TemplateDefinition => ({
  ...template,
  badge:
    template.badge ??
    (
      {
        creator: "Popular",
        business: "Mais usado",
        restaurant: "Novo",
        clinic: "Novo",
        beauty: "Novo",
        store: "Popular",
      } as Partial<Record<TemplateDefinition["category"], TemplateDefinition["badge"]>>
    )[template.category],
  bestFor:
    template.bestFor ??
    {
      minimal: "perfis objetivos",
      creator: "criadores e influenciadores",
      business: "serviÃ§os profissionais",
      store: "lojas e catÃ¡logos",
      restaurant: "restaurantes e pedidos",
      clinic: "clÃ­nicas e consultÃ³rios",
      beauty: "beleza e bem-estar",
      portfolio: "portfÃ³lios criativos",
      premium: "marcas que buscam sofisticaÃ§Ã£o",
    }[template.category],
  version: "1.0.0",
  status: "active",
  theme: theme(template.theme.colors, template.theme.typography?.fontFamily),
});

export const templateManifest: TemplateDefinition[] = [
  define({
    id: "default",
    slug: "default",
    name: "ClÃ¡ssico",
    description: "O visual atual da sua pÃ¡gina.",
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
    name: "Negócio moderno",
    description: "Profissional e acessível para serviços.",
    category: "business",
    theme: {
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#0f172a",
        muted: "#475569",
        primary: "#2563eb",
      },
    },
    layout: "business",
    components: ["banner", "profile", "links", "pix", "footer"],
    componentVariants: {
      banner: "compact",
      profile: "business",
      links: "elevated",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  }),
  define({
    id: "business-classic",
    slug: "business-classic",
    name: "Executivo",
    description: "SÃ³brio e confiÃ¡vel para atendimento profissional.",
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
    description: "Destaque seus links e canais de venda.",
    category: "store",
    theme: {
      colors: {
        background: "#ecfdf5",
        surface: "#ffffff",
        text: "#064e3b",
        muted: "#047857",
        primary: "#059669",
      },
    },
    layout: "storefront",
    components: ["banner", "profile", "links", "pix"],
    componentVariants: {
      banner: "compact",
      profile: "business",
      links: "elevated",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  }),
  define({
    id: "restaurant-menu",
    slug: "restaurant-menu",
    name: "Sabor",
    description: "Quente e convidativo para reservas e cardÃ¡pio.",
    category: "restaurant",
    theme: {
      colors: {
        background: "#fff7ed",
        surface: "#fffbeb",
        text: "#7c2d12",
        muted: "#9a3412",
        primary: "#dc2626",
      },
    },
    layout: "restaurant",
    components: ["banner", "profile", "links", "pix"],
    componentVariants: {
      banner: "compact",
      profile: "overlapping-banner",
      links: "elevated",
      pix: "highlighted",
      footer: "discreet",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
  }),
  define({
    id: "clinic-care",
    slug: "clinic-care",
    name: "Cuidado",
    description: "ApresentaÃ§Ã£o clara e confiÃ¡vel para clÃ­nicas e dentistas.",
    category: "clinic",
    badge: "Novo",
    bestFor: "clÃ­nicas, dentistas e consultÃ³rios",
    theme: {
      colors: {
        background: "#eef7f7",
        surface: "#ffffff",
        text: "#183b42",
        muted: "#55767b",
        primary: "#177e89",
      },
    },
    layout: "clinic",
    components: ["banner", "profile", "links", "pix"],
    componentVariants: {
      banner: "default",
      profile: "business",
      links: "minimal",
      pix: "highlighted",
    },
    supportedFeatures: ["profile", "links", "whatsapp", "pix"],
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
    name: "EstÃºdio",
    description: "Uma vitrine autoral para portfÃ³lios e projetos.",
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
