import type { OpenPageSiteConfig, SiteTheme, ThemePreset } from "./schema";

export const THEME_PRESETS: Record<ThemePreset, SiteTheme> = {
  "luxury-gold": {
    preset: "luxury-gold",
    bg: "#0a0a0c",
    cardBg: "#121217",
    textColor: "#fafafa",
    textMuted: "#a1a1aa",
    accent: "#f59e0b",
    accentHover: "#d97706",
    border: "rgba(255, 255, 255, 0.08)",
    fontHeading: "serif",
    fontBody: "sans",
    borderRadius: "xl",
    glassEffect: true,
  },
  "dark-minimal": {
    preset: "dark-minimal",
    bg: "#09090b",
    cardBg: "#18181b",
    textColor: "#ffffff",
    textMuted: "#71717a",
    accent: "#ffffff",
    accentHover: "#e4e4e7",
    border: "rgba(255, 255, 255, 0.12)",
    fontHeading: "sans",
    fontBody: "sans",
    borderRadius: "md",
    glassEffect: false,
  },
  "clean-health": {
    preset: "clean-health",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    textColor: "#0f172a",
    textMuted: "#64748b",
    accent: "#0ea5e9",
    accentHover: "#0284c7",
    border: "#e2e8f0",
    fontHeading: "sans",
    fontBody: "sans",
    borderRadius: "xl",
    glassEffect: true,
  },
  "cyber-neon": {
    preset: "cyber-neon",
    bg: "#030712",
    cardBg: "#0f172a",
    textColor: "#f8fafc",
    textMuted: "#94a3b8",
    accent: "#10b981",
    accentHover: "#059669",
    border: "rgba(16, 185, 129, 0.2)",
    fontHeading: "mono",
    fontBody: "sans",
    borderRadius: "md",
    glassEffect: true,
  },
  "warm-gourmet": {
    preset: "warm-gourmet",
    bg: "#0c0a09",
    cardBg: "#1c1917",
    textColor: "#fafaf9",
    textMuted: "#a8a29e",
    accent: "#ea580c",
    accentHover: "#c2410c",
    border: "rgba(255, 255, 255, 0.08)",
    fontHeading: "serif",
    fontBody: "sans",
    borderRadius: "xl",
    glassEffect: true,
  },
  "rose-beauty": {
    preset: "rose-beauty",
    bg: "#181114",
    cardBg: "#23181d",
    textColor: "#fff1f2",
    textMuted: "#fda4af",
    accent: "#fb7185",
    accentHover: "#f43f5e",
    border: "rgba(251, 113, 133, 0.15)",
    fontHeading: "serif",
    fontBody: "sans",
    borderRadius: "full",
    glassEffect: true,
  },
};

export function createDefaultSiteConfig(
  businessName = "Sua Marca",
  niche = "Serviços Especializados",
  whatsapp = "",
): OpenPageSiteConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    meta: {
      businessName,
      niche,
      whatsapp: whatsapp || "11999998888",
      phone: whatsapp,
      address: "Atendimento presencial e online",
      rating: 4.9,
      reviewsCount: 128,
      openingHours: "Segunda a Sexta das 08h às 18h",
    },
    theme: THEME_PRESETS["luxury-gold"],
    sections: [
      {
        type: "hero",
        id: "hero-1",
        badge: "★ 4.9 NO GOOGLE (120+ AVALIAÇÕES)",
        headline: "EXCELÊNCIA EM CADA DETALHE PARA QUEM NÃO ACEITA O COMUM",
        subheadline:
          "Soluções exclusivas e personalizadas para você alcançar resultados extraordinários com conforto e agilidade.",
        tagline: "Experiência de alto padrão com atendimento humanizado e transparente.",
        ctaText: "Agendar Atendimento VIP",
        ctaWhatsAppMessage: "Olá! Gostaria de agendar um atendimento.",
        secondaryCtaText: "Conhecer Serviços",
        backgroundImage:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
        stats: [
          { label: "Clientes Atendidos", value: "+2.500" },
          { label: "Satisfação Google", value: "4.9 / 5" },
          { label: "Anos de Experiência", value: "8 Anos" },
        ],
      },
      {
        type: "services",
        id: "services-1",
        title: "NOSSOS SERVIÇOS EM DESTAQUE",
        subtitle: "Procedimentos e soluções executados com equipamentos de última geração.",
        badge: "CARDÁPIO DE EXPERIÊNCIAS",
        items: [
          {
            id: "srv-1",
            title: "Atendimento Premium Personalizado",
            description:
              "Diagnóstico detalhado e planejamento sob medida para atender às suas necessidades exclusivas.",
            price: "R$ 180,00",
            duration: "50 min",
            badge: "Mais Procurado",
            highlighted: true,
          },
          {
            id: "srv-2",
            title: "Plano Completo de Alta Performance",
            description:
              "Acompanhamento intensivo com suporte prioritário e garantia total de satisfação.",
            price: "R$ 350,00",
            duration: "90 min",
            badge: "Completo",
          },
          {
            id: "srv-3",
            title: "Consultoria Especializada Express",
            description:
              "Solução prática e direcionada para quem precisa de agilidade sem abrir mão do padrão de excelência.",
            price: "R$ 120,00",
            duration: "30 min",
          },
        ],
      },
      {
        type: "story",
        id: "story-1",
        title: "SOBRE NÓS",
        headline: "UMA TRAJETÓRIA CONSTRUÍDA SOBRE CONFIANÇA E RESULTADOS REAIS",
        paragraphs: [
          "Nascemos com o propósito de transformar a experiência do cliente em algo memorável. Cada detalhe do nosso espaço e atendimento foi pensado para oferecer tranquilidade, eficiência e precisão.",
          "Nossa equipe é formada por especialistas com ampla vivência prática e constante atualização técnica, garantindo que você tenha acesso ao que há de mais avançado no mercado.",
        ],
        quote: "O nosso compromisso diário é superar as expectativas de cada pessoa que confia em nosso trabalho.",
        highlightValues: [
          "Pontualidade e Respeito ao Seu Tempo",
          "Tecnologia e Procedimentos Seguros",
          "Ambiente Confortável e Climatizado",
        ],
      },
      {
        type: "reviews",
        id: "reviews-1",
        title: "O QUE NOSSOS CLIENTES DIZEM",
        subtitle: "Avaliações autênticas retiradas diretamente do Google Maps.",
        overallRating: 4.9,
        totalReviews: 128,
        items: [
          {
            id: "rev-1",
            author: "Mariana Silveira",
            rating: 5,
            comment:
              "Simplesmente impecável! Desde a recepção até a finalização do serviço, o atendimento foi atencioso e o resultado superou o que eu esperava.",
            role: "Cliente Verificada",
          },
          {
            id: "rev-2",
            author: "Carlos Henrique",
            rating: 5,
            comment:
              "Profissionais muito qualificados e transparentes. Explicaram tudo com clareza e entregaram dentro do prazo com máxima qualidade.",
            role: "Cliente Verificado",
          },
          {
            id: "rev-3",
            author: "Fernanda Costa",
            rating: 5,
            comment:
              "Espaço incrível, muito limpo e bem localizado. Com certeza voltarei mais vezes e recomendo para todos!",
            role: "Cliente Verificada",
          },
        ],
      },
      {
        type: "gallery",
        id: "gallery-1",
        title: "CONHEÇA NOSSO ESPAÇO",
        subtitle: "Fotos reais do ambiente preparado para receber você com todo conforto.",
        photos: [
          {
            id: "ph-1",
            url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            caption: "Ambiente Principal",
            isCover: true,
          },
          {
            id: "ph-2",
            url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
            caption: "Recepção e Espera",
          },
          {
            id: "ph-3",
            url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
            caption: "Salas de Atendimento",
          },
        ],
      },
      {
        type: "faq",
        id: "faq-1",
        title: "DÚVIDAS FREQUENTES",
        subtitle: "Respostas claras para as principais perguntas dos nossos clientes.",
        items: [
          {
            id: "faq-1",
            question: "Como funciona o agendamento?",
            answer:
              "Você clica no botão de agendamento via WhatsApp, informa o melhor dia e horário para você e nossa equipe confirma instantaneamente.",
          },
          {
            id: "faq-2",
            question: "Quais são as formas de pagamento?",
            answer:
              "Aceitamos Pix com desconto, cartões de crédito em até 12x e cartões de débito.",
          },
          {
            id: "faq-3",
            question: "O local possui estacionamento?",
            answer:
              "Sim, contamos com convênio de estacionamento no local para o seu total conforto e segurança.",
          },
        ],
      },
      {
        type: "contact",
        id: "contact-1",
        title: "FALE CONOSCO E AGENDE AGORA",
        subtitle: "Estamos prontos para esclarecer qualquer dúvida e agendar sua visita.",
        whatsapp: whatsapp || "11999998888",
        phone: whatsapp || "11999998888",
        address: "Av. Paulista, 1000 - São Paulo, SP",
        openingHours: "Segunda a Sexta: 08h às 19h | Sábados: 08h às 14h",
        ctaText: "Iniciar Conversa no WhatsApp",
      },
    ],
  };
}

