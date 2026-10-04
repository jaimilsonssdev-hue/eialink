export const CINEMATIC_SCHEMA_VERSION = 2;

export type VisualArchetype =
  | "neobrutalism"     // Neobrutalismo pop com bordas sólidas, sombras 3D duras, badges tipo sticker e botões táteis
  | "editorial"        // Editorial Suíço e Quiet Luxury com serifa refinada, linhas finas de 1px e elegância de revista
  | "bento"            // Bento High-Tech com cantos super arredondados, gradientes no texto e badges estilo chip
  | "cinematic"        // Vidro fosco profundo (glassmorphism), reflexos e iluminação neon envolvente
  | "neo-pop-d2c"      // Gigi Energy Drink: alta energia, neon, marquee veloz, contraste pulsante
  | "luxury-editorial" // Evasion / Café: ébano, dourado/âmbar, fontes nobres serifadas, vídeo imersivo
  | "clean-biotech"    // Biometic: cantos 3xl, vidro fosco acetinado, esmeralda/ciano, abas
  | "cyber-tech"       // Compute-11: grid sutil, tags [01], bordas luminosas, modo escuro profundo
  | "dark-brutalist";  // Brutalist Void: tipografia display gigante, linhas finas de corte, P&B

export interface CinematicHero {
  title: string;
  subtitle: string;
  tagline: string;
  backgroundImage: string;
  backgroundVideo?: string; // Vídeo em loop de alta definição (MP4/WebM)
  ctaText: string;
  ctaLink: string;
  floatingBadge?: string; // Ex: "★ 4.9 NO GOOGLE" ou "NOVA FÓRMULA 2026"
}

export interface MarqueeItem {
  id: string;
  text: string;
  icon?: string; // Ex: "⚡", "🌿", "💎"
}

export interface BentoCard {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  size: "small" | "medium" | "large" | "full"; // Controla o grid assimétrico
  badge?: string;
  metric?: string; // Ex: "100%", "4.9", "+12k"
  imageUrl?: string;
  accentBg?: boolean;
}

export interface ComparisonRow {
  feature: string;
  us: string | boolean;
  others: string | boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CinematicManifesto {
  headline: string;
  bodyText: string;
  quote?: string;
  author?: string;
}

export interface CinematicGalleryItem {
  id: string;
  url: string;
  caption?: string;
  category?: string;
}

export interface CinematicHighlight {
  id: string;
  title: string;
  description: string;
  price?: string;
  badge?: string;
  image?: string;
}

export interface CinematicPageData {
  id?: string;
  businessName: string;
  niche: string;
  whatsapp: string;
  address?: string;
  rating?: number;
  openingHours?: string;
  archetype: VisualArchetype;
  theme: {
    bg: string;
    accent: string;
    secondaryAccent?: string;
    fontHeading: "serif" | "sans" | "display" | "mono";
    parallaxEnabled: boolean;
    borderStyle: "glass" | "sharp" | "pill" | "subtle";
    headingStyle?: "default" | "uppercase" | "italic" | "gradient";
    archetype?: VisualArchetype;
    mode?: "dark" | "light";
    fontFamily?: string;
    boxEffect?: "glass" | "solid" | "glow";
    borderRadius?: "rounded" | "pill" | "sharp";
  };
  hero: CinematicHero;
  manifesto?: CinematicManifesto;
  marquee?: MarqueeItem[];
  bentoGrid?: BentoCard[];
  highlights: CinematicHighlight[];
  comparison?: {
    headline: string;
    usLabel: string;
    othersLabel: string;
    rows: ComparisonRow[];
  };
  gallery: CinematicGalleryItem[];
  faq?: FaqItem[];
}

export interface CinematicConceptOption {
  id: "option_a" | "option_b";
  name: string;
  tagline: string;
  palette: {
    bg: string;
    accent: string;
    cardBg: string;
  };
  typography: "serif" | "sans" | "display" | "mono";
  vibe: string;
  heroHeadline: string;
  previewData: Partial<CinematicPageData>;
}

export interface CreativePlan {
  id: string;
  conceptSummary: string;
  rationale: string;
  recommendedSections: string[];
  options: [CinematicConceptOption, CinematicConceptOption];
}

export interface StudioChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  plan?: CreativePlan; // Presente quando o agente faz uma proposta de design
  appliedOptionId?: string; // Registra qual opção o usuário aprovou
  meta?: {
    name?: string;
    rating?: number;
    address?: string;
    openingHours?: string;
    photoCount?: number;
    thumbnails?: string[];
  };
}

