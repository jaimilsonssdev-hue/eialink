import type { CinematicPageData } from "./types";

export const LUXURY_PALETTES = [
  { id: "graphite", name: "Grafite & Titânio", bg: "#09090b", accent: "#d4d4d8", glow: "rgba(212, 212, 216, 0.12)" },
  { id: "slate", name: "Ardósia & Prata", bg: "#0b0d10", accent: "#94a3b8", glow: "rgba(148, 163, 184, 0.12)" },
  { id: "champagne", name: "Champagne Sóbrio", bg: "#0c0a09", accent: "#d4af37", glow: "rgba(212, 175, 55, 0.12)" },
  { id: "sage", name: "Oliva & Sálvia", bg: "#090b09", accent: "#84a98c", glow: "rgba(132, 169, 140, 0.12)" },
  { id: "bronze", name: "Ébano & Bronze", bg: "#080707", accent: "#c29b7f", glow: "rgba(194, 155, 127, 0.12)" },
  { id: "obsidian", name: "Obsidiana Pura", bg: "#050505", accent: "#a1a1aa", glow: "rgba(161, 161, 170, 0.12)" },
];

export function createDefaultCinematicData(
  businessName = "",
  niche = "",
  whatsapp = "",
  address = "",
  rating = 5.0
): CinematicPageData {
  return {
    businessName,
    niche,
    whatsapp,
    address,
    rating,
    openingHours: "",
    archetype: "luxury-editorial",
    theme: {
      bg: "#09090b",
      accent: "#d4d4d8",
      secondaryAccent: "#a1a1aa",
      fontHeading: "sans",
      parallaxEnabled: true,
      borderStyle: "glass",
    },
    hero: {
      title: "",
      subtitle: "",
      tagline: "",
      floatingBadge: "",
      backgroundImage: "",
      ctaText: "Entrar em Contato",
      ctaLink: "#contato",
    },
    marquee: [],
    bentoGrid: [],
    manifesto: undefined,
    comparison: undefined,
    gallery: [],
    highlights: [],
    faq: [],
  };
}
