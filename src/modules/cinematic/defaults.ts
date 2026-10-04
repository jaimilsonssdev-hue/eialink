import type { CinematicPageData } from "./types";
import { getPresetForCompany, NICHE_GALLERIES } from "../prospecting/nichePresets";
import {
  resolveNicheArchetype,
  generateNicheBentoCards,
  generateNicheFaq,
  generateNicheComparison,
  generateNicheMarquee,
} from "../prospecting/aiDemoGenerator.service";

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
  const safeName = businessName.trim() || "Sua Marca";
  const effectiveNiche = niche || "geral";
  const preset = getPresetForCompany(effectiveNiche, safeName);
  const archetypeConfig = resolveNicheArchetype(effectiveNiche);

  const nicheGallery = NICHE_GALLERIES[effectiveNiche] || NICHE_GALLERIES.geral;
  const covers = nicheGallery?.covers || NICHE_GALLERIES.geral.covers;

  const gallery = covers.slice(0, 6).map((c, i) => ({
    id: `g-${i}`,
    url: c.url,
    caption: c.label || `${safeName} - Experiência`,
    category: "Ambiente",
  }));

  const highlights = preset.services.slice(0, 3).map((srv, idx) => ({
    id: `hl-${idx}`,
    title: srv.name,
    description: srv.description,
    price: srv.price ? `R$ ${srv.price.toFixed(2)}` : undefined,
    badge: idx === 0 ? "Mais Pedido" : "Assinatura VIP",
    image: covers[idx % covers.length]?.url || srv.image_url,
  }));

  const cleanPhone = (whatsapp || "").replace(/\D/g, "");
  const ctaLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(preset.whatsapp_message(safeName))}` : "#contato";

  return {
    businessName: safeName,
    niche: effectiveNiche,
    whatsapp,
    address,
    rating,
    openingHours: "Segunda a Sábado com Hora Marcada",
    archetype: archetypeConfig.archetype,
    theme: archetypeConfig.theme,
    hero: {
      title: preset.generateHeadline(safeName, "sua região"),
      subtitle: preset.generateDescription(safeName, "sua região"),
      tagline: effectiveNiche.toUpperCase(),
      floatingBadge: `★ ${rating.toFixed(1)} NO GOOGLE`,
      backgroundImage: covers[0]?.url || preset.cover_url,
      ctaText: preset.whatsapp_button_label || "Falar no WhatsApp",
      ctaLink,
    },
    marquee: generateNicheMarquee(safeName, effectiveNiche, rating),
    marqueeSpeed: 45,
    bentoGrid: generateNicheBentoCards(safeName, effectiveNiche, null, rating, 48),
    manifesto: preset.generateDescription(safeName, "sua região"),
    comparison: generateNicheComparison(safeName, effectiveNiche),
    gallery,
    highlights,
    faq: generateNicheFaq(safeName, effectiveNiche, null, address),
  };
}
