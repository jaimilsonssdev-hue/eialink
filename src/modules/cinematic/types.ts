export const CINEMATIC_SCHEMA_VERSION = 1;

export interface CinematicHero {
  title: string;
  subtitle: string;
  tagline: string;
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
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
  theme: {
    bg: string;
    accent: string;
    fontHeading: "serif" | "sans" | "display";
    parallaxEnabled: boolean;
  };
  hero: CinematicHero;
  manifesto: CinematicManifesto;
  gallery: CinematicGalleryItem[];
  highlights: CinematicHighlight[];
}

