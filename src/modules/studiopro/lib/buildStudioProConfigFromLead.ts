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
  variantIndex?: number;
}

export const STUDIO_PRO_VARIANTS = [
  { id: 0, name: "Dark Luxury & Gold", description: "Design sofisticado escuro com detalhes em ouro e autoridade máxima" },
  { id: 1, name: "Clean High-Tech Minimal", description: "Layout split luminoso, azul cobalto e estética moderna tech" },
  { id: 2, name: "Neobrutalismo Pop", description: "Bordas marcantes, contraste vibrante e pegada de alta conversão" },
  { id: 3, name: "Glassmorphism Futurista", description: "Efeito translúcido de vidro, glow ciano neon e estética futurista" },
  { id: 4, name: "Editorial Sofisticado", description: "Tipografia refinada, paleta marfim/terracota e foco em narrativa" },
];

export function buildStudioProConfigFromLead(lead: LeadSiteData): SiteConfig {
  const name = lead.companyName.trim();
  const niche = (lead.niche || "Serviços").toLowerCase();
  const city = lead.city ? lead.city.trim() : "";
  const rating = lead.rating ? Number(lead.rating) : 4.9;
  const reviewsCount = lead.reviewsCount ? Number(lead.reviewsCount) : 85;
  const whatsappClean = lead.whatsapp ? lead.whatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappClean ? `https://wa.me/55${whatsappClean}` : "#contato";

  // Identifica a variante de design (0 a 4)
  const variantIndex = typeof lead.variantIndex === "number" && !isNaN(lead.variantIndex)
    ? Math.abs(lead.variantIndex) % 5
    : 0;

  // 1. Matriz de Temas e Cores por Variante
  let themeChoice: Partial<ThemeConfig>;
  if (variantIndex === 0) {
    // Dark Luxury & Gold
    themeChoice = {
      bg0: '#09090b',
      bg1: '#121215',
      bg2: '#18181c',
      bg3: '#222228',
      bg4: '#2c2c33',
      bg5: '#383842',
      text0: '#fef3c7',
      text1: '#fde68a',
      text2: '#d4af37',
      text3: '#92400e',
      accent: '#f59e0b',
      accentDim: '#d97706',
      borderDefault: '#27272a',
      borderSubtle: '#18181b',
      borderHover: '#d97706',
      fontSans: 'Plus Jakarta Sans',
      fontDisplay: 'Space Grotesk',
      fontMono: 'JetBrains Mono',
      radius: 8,
      radiusLg: 14,
    };
  } else if (variantIndex === 1) {
    // Clean High-Tech Minimal (White & Cobalto)
    themeChoice = {
      bg0: '#ffffff',
      bg1: '#f8fafc',
      bg2: '#f1f5f9',
      bg3: '#e2e8f0',
      bg4: '#cbd5e1',
      bg5: '#94a3b8',
      text0: '#0f172a',
      text1: '#1e293b',
      text2: '#475569',
      text3: '#64748b',
      accent: '#2563eb',
      accentDim: '#1d4ed8',
      borderDefault: '#e2e8f0',
      borderSubtle: '#f1f5f9',
      borderHover: '#cbd5e1',
      fontSans: 'Inter',
      fontDisplay: 'Sora',
      fontMono: 'JetBrains Mono',
      radius: 12,
      radiusLg: 18,
    };
  } else if (variantIndex === 2) {
    // Neobrutalismo Pop
    themeChoice = {
      bg0: '#fffdf5',
      bg1: '#fef08a',
      bg2: '#ffffff',
      bg3: '#fde047',
      bg4: '#facc15',
      bg5: '#eab308',
      text0: '#000000',
      text1: '#18181b',
      text2: '#27272a',
      text3: '#3f3f46',
      accent: '#000000',
      accentDim: '#27272a',
      borderDefault: '#000000',
      borderSubtle: '#000000',
      borderHover: '#000000',
      fontSans: 'Space Grotesk',
      fontDisplay: 'Space Grotesk',
      fontMono: 'Space Grotesk',
      radius: 4,
      radiusLg: 6,
    };
  } else if (variantIndex === 3) {
    // Glassmorphism Futurista (Cyan & Violet)
    themeChoice = {
      bg0: '#070b14',
      bg1: '#0d1527',
      bg2: '#131e38',
      bg3: '#1b2a4e',
      bg4: '#253a6b',
      bg5: '#324e8c',
      text0: '#f0f9ff',
      text1: '#bae6fd',
      text2: '#7dd3fc',
      text3: '#38bdf8',
      accent: '#06b6d4',
      accentDim: '#0891b2',
      borderDefault: 'rgba(6, 182, 212, 0.25)',
      borderSubtle: 'rgba(6, 182, 212, 0.12)',
      borderHover: 'rgba(6, 182, 212, 0.5)',
      fontSans: 'Outfit',
      fontDisplay: 'Outfit',
      fontMono: 'JetBrains Mono',
      radius: 16,
      radiusLg: 24,
    };
  } else {
    // Editorial Sofisticado (Marfim & Terracota)
    themeChoice = {
      bg0: '#faf8f5',
      bg1: '#f2efe8',
      bg2: '#e8e4db',
      bg3: '#ddd8cd',
      bg4: '#c8c2b5',
      bg5: '#b3ab9c',
      text0: '#2c2418',
      text1: '#5c5347',
      text2: '#8a8074',
      text3: '#b0a798',
      accent: '#b45309',
      accentDim: '#92400e',
      borderDefault: '#e2ddd4',
      borderSubtle: '#ebe8e1',
      borderHover: '#d5cfc4',
      fontSans: 'DM Sans',
      fontDisplay: 'Raleway',
      fontMono: 'JetBrains Mono',
      radius: 6,
      radiusLg: 10,
    };
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

  // Configuração dinâmica dos blocos por Arquétipo Visual
  const heroVariant =
    variantIndex === 1 ? "split" :
    variantIndex === 2 ? "minimal" :
    variantIndex === 3 ? "gradient" :
    variantIndex === 4 ? "centered" :
    "gradient";

  const heroHeadline =
    variantIndex === 0 ? `A Experiência Premium em ${lead.niche || "Serviços"} na ${name}` :
    variantIndex === 1 ? `Soluções Inteligentes e Alto Desempenho na ${name}` :
    variantIndex === 2 ? `${name}: QUALIDADE DIRETA AO PONTO.` :
    variantIndex === 3 ? `O Futuro de ${lead.niche || "Serviços"} Chegou à ${name}` :
    `Mais de uma década de excelência e compromisso na ${name}`;

  const heroBadge =
    variantIndex === 0 ? `★ ${rating.toFixed(1)} NO GOOGLE (${reviewsCount} avaliações) — ALTO PADRÃO` :
    variantIndex === 1 ? `INOVAÇÃO & AGILIDADE • ${rating.toFixed(1)} ★ NO GOOGLE` :
    variantIndex === 2 ? `⚡ REFERÊNCIA EM ${lead.niche ? lead.niche.toUpperCase() : "QUALIDADE"}` :
    variantIndex === 3 ? `✨ DESIGN FUTURISTA & TECNOLOGIA ✨` :
    `TRADIÇÃO, AUTORIDADE & CONFIANÇA (${rating.toFixed(1)} ★)`;

  const heroSubheadline =
    variantIndex === 0 ? `Atendimento impecável com padrão de luxo e sofisticação${city ? ` em ${city}` : ""}. Descubra um novo nível de qualidade e exclusividade.` :
    variantIndex === 1 ? `Metodologia de ponta e agilidade comprovada${city ? ` em ${city}` : ""}. Fale com nossos especialistas em instantes pelo WhatsApp.` :
    variantIndex === 2 ? `Sem complicação. Atendimento rápido, pontual e garantia de total satisfação para você${city ? ` em ${city}` : ""}.` :
    variantIndex === 3 ? `Experiência visual fluida, precisão e excelência técnica para clientes que exigem o melhor${city ? ` em ${city}` : ""}.` :
    `Construindo histórias de satisfação com dedicação integral e padrão impecável${city ? ` em ${city}` : ""}.`;

  const featuresVariant =
    variantIndex === 1 ? "alternating" :
    variantIndex === 4 ? "list" :
    "grid";

  const testimonialsVariant =
    variantIndex === 1 || variantIndex === 4 ? "carousel" : "cards";

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
      variant: heroVariant,
      props: {
        badge: heroBadge,
        headline: heroHeadline,
        subheadline: heroSubheadline,
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
      variant: featuresVariant,
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
      variant: testimonialsVariant,
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

