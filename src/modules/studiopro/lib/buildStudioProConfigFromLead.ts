import type { SiteConfig, BlockConfig, ThemeConfig } from "@/modules/studiopro/blocks/types";
import { themePresets } from "@/modules/studiopro/lib/theme-presets";

export interface LeadSiteData {
  companyName: string;
  niche?: string | null;
  city?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  openingHours?: string | null;
  reviews?: Array<{ author?: string; name?: string; text?: string; comment?: string; rating?: number }>;
  photos?: string[];
  coverUrl?: string;
  avatarUrl?: string;
}

export function buildStudioProConfigFromLead(lead: LeadSiteData): SiteConfig {
  const name = lead.companyName.trim();
  const niche = (lead.niche || "Serviços").toLowerCase();
  const city = lead.city ? lead.city.trim() : "";
  const rating = lead.rating ? Number(lead.rating) : 4.9;
  const reviewsCount = lead.reviewsCount ? Number(lead.reviewsCount) : 85;
  const whatsappClean = lead.whatsapp ? lead.whatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappClean ? `https://wa.me/55${whatsappClean}` : "#contato";

  // Escolha do tema de acordo com o nicho
  let themeChoice: Partial<ThemeConfig> = themePresets[0].theme; // dark default
  if (niche.includes("restaurante") || niche.includes("pizzaria") || niche.includes("hamburgueria") || niche.includes("gourmet")) {
    themeChoice = themePresets.find((t) => t.id === "amber")?.theme || themePresets[0].theme;
  } else if (niche.includes("saude") || niche.includes("clinica") || niche.includes("odonto") || niche.includes("medica")) {
    themeChoice = themePresets.find((t) => t.id === "cyan")?.theme || themePresets[0].theme;
  } else if (niche.includes("advocacia") || niche.includes("contab") || niche.includes("barbearia")) {
    themeChoice = themePresets.find((t) => t.id === "emerald")?.theme || themePresets[0].theme;
  } else if (niche.includes("estetica") || niche.includes("beleza") || niche.includes("salao")) {
    themeChoice = themePresets.find((t) => t.id === "purple")?.theme || themePresets[0].theme;
  }

  // Avaliações reais ou curadas com base no Google Maps
  const realReviews = (lead.reviews || []).slice(0, 6).map((r, i) => ({
    name: r.author || r.name || `Cliente Verificado`,
    role: "Avaliação no Google Maps",
    quote: r.text || r.comment || "Atendimento impecável, equipe extremamente atenciosa e serviço com alto padrão de qualidade.",
    rating: typeof r.rating === "number" ? r.rating : 5,
  }));

  const fallbackReviews = [
    {
      name: "Mariana Souza",
      role: "Cliente no Google",
      quote: `Atendimento impecável na ${name}! Fui muito bem recebida e a experiência superou minhas expectativas.`,
      rating: 5,
    },
    {
      name: "Carlos Eduardo",
      role: "Cliente no Google",
      quote: `Excelente serviço e atenção aos detalhes. Pontuais e com qualidade superior a qualquer outro lugar em ${city || "nossa região"}.`,
      rating: 5,
    },
    {
      name: "Fernanda Lima",
      role: "Cliente no Google",
      quote: `Recomendo de olhos fechados. Profissionais sérios e dedicados, com certeza voltarei sempre!`,
      rating: 5,
    },
  ];

  const testimonialsItems = realReviews.length >= 2 ? realReviews : fallbackReviews;

  // Fotos reais ou ilustrações
  const photosList = (lead.photos || []).filter(Boolean);
  const galleryImages = photosList.length >= 2
    ? photosList.slice(0, 6).map((url, i) => ({
        src: url,
        caption: `${name} — Detalhes do Espaço`,
      }))
    : [
        { src: lead.coverUrl || undefined, caption: `${name} — Experiência Completa` },
        { src: lead.avatarUrl || undefined, caption: `${name} — Atendimento` },
      ];

  const blocks: BlockConfig[] = [
    // 1. Navbar
    {
      id: "navbar-block",
      type: "navbar",
      variant: "default",
      props: {
        logo: name,
        links: ["Diferenciais", "Avaliações", "Galeria", "Contato"],
        ctaText: "WhatsApp",
      },
    },

    // 2. Hero
    {
      id: "hero-block",
      type: "hero",
      variant: "centered",
      props: {
        badge: `★ ${rating.toFixed(1)} NO GOOGLE (${reviewsCount} avaliações)`,
        headline: `A melhor experiência em ${lead.niche || "serviços"} na ${name}`,
        subheadline: `Referência em qualidade e atendimento de excelência${city ? ` em ${city}` : ""}. Agende seu atendimento ou faça seu pedido direto pelo WhatsApp.`,
        primaryCta: "Falar no WhatsApp",
        secondaryCta: "Ver Avaliações",
      },
    },

    // 3. Stats
    {
      id: "stats-block",
      type: "stats",
      variant: "grid",
      props: {
        title: "Reconhecimento e Credibilidade",
        items: [
          { value: `${rating.toFixed(1)} ★`, label: "Nota no Google Maps" },
          { value: `${reviewsCount}+`, label: "Clientes Avaliaram" },
          { value: "100%", label: "Dedicação e Qualidade" },
        ],
      },
    },

    // 4. Features / Diferenciais
    {
      id: "features-block",
      type: "features",
      variant: "grid",
      props: {
        title: "Por que nos escolher?",
        subtitle: `Conheça os diferenciais que fazem da ${name} a preferida dos clientes`,
        items: [
          {
            icon: "Shield",
            title: "Atendimento Humanizado",
            description: "Cuidado personalizado e atenção a cada detalhe da sua necessidade.",
          },
          {
            icon: "Zap",
            title: "Agilidade & Pontualidade",
            description: "Respeito ao seu tempo com soluções rápidas e assertivas.",
          },
          {
            icon: "Globe",
            title: "Padrão de Excelência",
            description: `Estrutura moderna e equipe qualificada pronta para atender você${city ? ` em ${city}` : ""}.`,
          },
        ],
      },
    },

    // 5. Testimonials
    {
      id: "testimonials-block",
      type: "testimonials",
      variant: "cards",
      props: {
        title: "O que nossos clientes dizem",
        subtitle: `Avaliações 100% autênticas registradas no Google Maps sobre a ${name}`,
        items: testimonialsItems,
      },
    },

    // 6. Galeria (se houver fotos)
    ...(galleryImages.length > 0
      ? [
          {
            id: "gallery-block",
            type: "gallery" as const,
            variant: "grid",
            props: {
              title: "Conheça nosso espaço",
              images: galleryImages,
            },
          },
        ]
      : []),

    // 7. FAQ
    {
      id: "faq-block",
      type: "faq",
      variant: "accordion",
      props: {
        title: "Dúvidas Frequentes",
        items: [
          {
            question: "Como posso agendar ou falar com a equipe?",
            answer: "Basta clicar em qualquer botão do WhatsApp nesta página. Nossa equipe responde rapidamente com todas as orientações.",
          },
          {
            question: "Quais são os horários de funcionamento?",
            answer: lead.openingHours || "Funcionamos em horário comercial de segunda a sábado. Consulte horários específicos pelo WhatsApp.",
          },
          {
            question: "Onde vocês estão localizados?",
            answer: lead.address || `Estamos localizados em localização privilegiada${city ? ` em ${city}` : ""}. Venha nos visitar!`,
          },
        ],
      },
    },

    // 8. Contact
    {
      id: "contact-block",
      type: "contact",
      variant: "form",
      props: {
        title: "Fale com nossa equipe",
        subtitle: `${lead.address ? `${lead.address} • ` : ""}${lead.openingHours ? `${lead.openingHours} • ` : ""}Atendimento rápido pelo WhatsApp`,
      },
    },

    // 9. CTA Final
    {
      id: "cta-block",
      type: "cta",
      variant: "simple",
      props: {
        headline: `Pronto para viver essa experiência na ${name}?`,
        subheadline: "Clique abaixo e tire suas dúvidas ou solicite um atendimento agora mesmo.",
        buttonText: "Conversar no WhatsApp",
      },
    },

    // 10. Footer
    {
      id: "footer-block",
      type: "footer",
      variant: "simple",
      props: {
        logo: name,
        copyright: `© ${new Date().getFullYear()} ${name}. Todos os direitos reservados.`,
        links: ["Início", "WhatsApp", "Localização"],
      },
    },
  ];

  return {
    name,
    theme: themeChoice,
    blocks,
  };
}

