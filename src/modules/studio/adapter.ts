import type { CinematicPageData } from "@/modules/cinematic/types";
import type { OpenPageSiteConfig, SectionBlock } from "./schema";
import { THEME_PRESETS } from "./defaultSite";

/**
 * Converte dados do Studio (CinematicPageData) para o padrão OpenPage JSON-First (OpenPageSiteConfig)
 */
export function cinematicToOpenPage(data: CinematicPageData): OpenPageSiteConfig {
  const sections: SectionBlock[] = [];

  // 1. Hero
  sections.push({
    type: "hero",
    id: "hero-main",
    badge: data.hero.floatingBadge || (data.rating ? `★ ${data.rating} NO GOOGLE` : undefined),
    headline: data.hero.title,
    subheadline: data.hero.subtitle,
    tagline: data.hero.tagline,
    ctaText: data.hero.ctaText || "Agendar Atendimento",
    ctaWhatsAppMessage: "Olá! Gostaria de agendar um atendimento.",
    backgroundImage: data.hero.backgroundImage,
    backgroundVideo: data.hero.backgroundVideo,
    stats: [
      { label: "Avaliação Google", value: `${data.rating || 4.9} / 5` },
      { label: "Clientes Atendidos", value: "+1.200" },
      { label: "Satisfação", value: "100%" },
    ],
  });

  // 2. Serviços / Destaques
  if (data.highlights && data.highlights.length > 0) {
    sections.push({
      type: "services",
      id: "services-main",
      title: "SERVIÇOS EM DESTAQUE",
      subtitle: "Soluções planejadas para entregar a melhor experiência e resultado.",
      badge: "EXPERIÊNCIAS & PROCEDIMENTOS",
      items: data.highlights.map((h, i) => ({
        id: h.id || `srv-${i}`,
        title: h.title,
        description: h.description,
        price: h.price,
        badge: h.badge,
        imageUrl: h.image,
        highlighted: i === 0,
      })),
    });
  }

  // 3. Manifesto / Sobre
  if (data.manifesto && (data.manifesto.headline || data.manifesto.bodyText)) {
    sections.push({
      type: "story",
      id: "story-main",
      title: "SOBRE NÓS",
      headline: data.manifesto.headline || "COMPROMISSO COM A EXCELÊNCIA",
      paragraphs: data.manifesto.bodyText ? data.manifesto.bodyText.split("\n\n") : [],
      quote: data.manifesto.quote,
    });
  }

  // 4. Galeria de Fotos
  if (data.gallery && data.gallery.length > 0) {
    sections.push({
      type: "gallery",
      id: "gallery-main",
      title: "NOSSO ESPAÇO & TRABALHOS",
      subtitle: "Conheça o ambiente e a estrutura do nosso atendimento.",
      photos: data.gallery.map((g, i) => ({
        id: g.id || `ph-${i}`,
        url: g.url,
        caption: g.caption,
        isCover: data.hero.backgroundImage === g.url,
      })),
    });
  }

  // 5. FAQ
  if (data.faq && data.faq.length > 0) {
    sections.push({
      type: "faq",
      id: "faq-main",
      title: "DÚVIDAS FREQUENTES",
      subtitle: "Principais esclarecimentos sobre nossos atendimentos.",
      items: data.faq.map((f, i) => ({
        id: `faq-${i}`,
        question: f.question,
        answer: f.answer,
      })),
    });
  }

  // 6. Contato
  sections.push({
    type: "contact",
    id: "contact-main",
    title: "AGENDE SUA VISITA",
    subtitle: "Fale diretamente com nossa equipe no WhatsApp para reservar seu horário.",
    whatsapp: data.whatsapp,
    address: data.address,
    openingHours: data.openingHours || "Segunda a Sexta das 08h às 18h",
    ctaText: "Chamar no WhatsApp",
  });

  return {
    version: 1,
    id: data.id,
    updatedAt: new Date().toISOString(),
    meta: {
      businessName: data.businessName,
      niche: data.niche,
      whatsapp: data.whatsapp,
      address: data.address,
      rating: data.rating,
      openingHours: data.openingHours,
    },
    theme: {
      preset: "luxury-gold",
      bg: data.theme.bg || "#0a0a0c",
      cardBg: "#121217",
      textColor: "#fafafa",
      textMuted: "#a1a1aa",
      accent: data.theme.accent || "#f59e0b",
      accentHover: "#d97706",
      border: "rgba(255, 255, 255, 0.08)",
      fontHeading: data.theme.fontHeading === "serif" ? "serif" : data.theme.fontHeading === "mono" ? "mono" : "sans",
      fontBody: "sans",
      borderRadius: "xl",
      glassEffect: true,
    },
    sections,
  };
}

/**
 * Converte dados do OpenPage (OpenPageSiteConfig) para o padrão do Studio (CinematicPageData)
 */
export function openPageToCinematic(config: OpenPageSiteConfig, currentBase?: CinematicPageData): CinematicPageData {
  const heroSection = config.sections.find((s) => s.type === "hero") as import("./schema").HeroSection | undefined;
  const servicesSection = config.sections.find((s) => s.type === "services") as import("./schema").ServicesSection | undefined;
  const gallerySection = config.sections.find((s) => s.type === "gallery") as import("./schema").GallerySection | undefined;
  const storySection = config.sections.find((s) => s.type === "story") as import("./schema").StorySection | undefined;
  const faqSection = config.sections.find((s) => s.type === "faq") as import("./schema").FaqSection | undefined;

  return {
    ...(currentBase || ({} as any)),
    id: config.id || currentBase?.id,
    businessName: config.meta.businessName,
    niche: config.meta.niche,
    whatsapp: config.meta.whatsapp,
    address: config.meta.address,
    rating: config.meta.rating,
    openingHours: config.meta.openingHours,
    archetype: "editorial",
    theme: {
      ...(currentBase?.theme || ({} as any)),
      bg: config.theme.bg,
      accent: config.theme.accent,
      fontHeading: config.theme.fontHeading === "serif" ? "serif" : "sans",
      borderStyle: "glass",
      parallaxEnabled: true,
    },
    hero: {
      title: heroSection?.headline || config.meta.businessName,
      subtitle: heroSection?.subheadline || "",
      tagline: heroSection?.tagline || "",
      backgroundImage: heroSection?.backgroundImage || currentBase?.hero?.backgroundImage || "",
      backgroundVideo: heroSection?.backgroundVideo,
      ctaText: heroSection?.ctaText || "Agendar no WhatsApp",
      ctaLink: `https://wa.me/55${config.meta.whatsapp.replace(/\D/g, "")}`,
      floatingBadge: heroSection?.badge,
    },
    highlights: (servicesSection?.items || []).map((srv) => ({
      id: srv.id,
      title: srv.title,
      description: srv.description,
      price: srv.price,
      badge: srv.badge,
      image: srv.imageUrl,
    })),
    gallery: (gallerySection?.photos || []).map((ph) => ({
      id: ph.id,
      url: ph.url,
      caption: ph.caption,
    })),
    manifesto: storySection
      ? {
          headline: storySection.headline,
          bodyText: storySection.paragraphs.join("\n\n"),
          quote: storySection.quote,
        }
      : currentBase?.manifesto,
    faq: (faqSection?.items || []).map((f) => ({
      question: f.question,
      answer: f.answer,
    })),
  };
}

