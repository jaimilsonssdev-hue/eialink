export type ThemePreset =
  | "dark-minimal"   // Preto ébano, tipografia limpa, acento branco/titânio
  | "luxury-gold"    // Preto carvão, âmbar/dourado nobre, alta sofisticação
  | "clean-health"   // Branco gelo/titânio, esmeralda ou azul médico, calmo e higiênico
  | "cyber-neon"     // Fundo escuro profundo, ciano/verde neon, alta tecnologia
  | "warm-gourmet"   // Tons terrosos, bordô/laranja acolhedor para gastronomia
  | "rose-beauty";   // Nude, rosé e champanhe para clínicas de estética e salões

export interface SiteTheme {
  preset: ThemePreset;
  bg: string;
  cardBg: string;
  textColor: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  fontHeading: "sans" | "serif" | "mono";
  fontBody: "sans" | "serif" | "mono";
  borderRadius: "none" | "md" | "xl" | "full";
  glassEffect: boolean;
}

export interface SiteMeta {
  businessName: string;
  niche: string;
  whatsapp: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: string;
  logoUrl?: string;
}

export interface HeroSection {
  type: "hero";
  id: string;
  badge?: string; // Ex: "★ 4.9 NO GOOGLE (120+ AVALIAÇÕES)"
  headline: string;
  subheadline: string;
  tagline?: string;
  ctaText: string;
  ctaWhatsAppMessage?: string;
  secondaryCtaText?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  stats?: Array<{ label: string; value: string }>;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  badge?: string;
  imageUrl?: string;
  highlighted?: boolean;
}

export interface ServicesSection {
  type: "services";
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  items: ServiceItem[];
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  role?: string;
  date?: string;
  avatarUrl?: string;
}

export interface ReviewsSection {
  type: "reviews";
  id: string;
  title: string;
  subtitle: string;
  overallRating: number;
  totalReviews: number;
  items: ReviewItem[];
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  isCover?: boolean;
}

export interface GallerySection {
  type: "gallery";
  id: string;
  title: string;
  subtitle: string;
  photos: GalleryPhoto[];
}

export interface StorySection {
  type: "story";
  id: string;
  title: string;
  headline: string;
  paragraphs: string[];
  quote?: string;
  highlightValues?: string[];
  imageUrl?: string;
}

export interface AmenitiesSection {
  type: "amenities";
  id: string;
  title: string;
  subtitle?: string;
  items: Array<{ id: string; name: string; icon?: string }>;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSection {
  type: "faq";
  id: string;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export interface ContactSection {
  type: "contact";
  id: string;
  title: string;
  subtitle: string;
  whatsapp: string;
  phone?: string;
  address?: string;
  openingHours?: string;
  googleMapsUrl?: string;
  ctaText: string;
}

export type SectionBlock =
  | HeroSection
  | ServicesSection
  | StorySection
  | ReviewsSection
  | GallerySection
  | AmenitiesSection
  | FaqSection
  | ContactSection;

/**
 * Single Source of Truth do Site (OpenPage JSON-First Architecture)
 */
export interface OpenPageSiteConfig {
  version: 1;
  id?: string;
  meta: SiteMeta;
  theme: SiteTheme;
  sections: SectionBlock[];
  updatedAt: string;
}

