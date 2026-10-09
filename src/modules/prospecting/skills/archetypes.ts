/**
 * Skill de Arquétipos Visuais e Direção de Arte por Nicho
 * Garante que cada site gerado nasça com identidade visual própria, sem cara de IA genérica.
 */

export interface ArchetypeVisualSpec {
  themeName: string;
  palette: {
    bg: string;
    cardBg: string;
    accent: string;
    accentGlow: string;
    text: string;
    textMuted: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingStyle: string;
    badgeStyle: string;
  };
  marqueePhrases: string[];
  proofBadges: string[];
  ctaCopy: {
    primary: string;
    secondary: string;
    whatsappGreeting: string;
  };
}

export const ARCHETYPES: Record<string, ArchetypeVisualSpec> = {
  // 1. GASTRONOMIA, DELIVERY, HAMBURGUERIA, PIZZARIA, AÇAÍ
  food: {
    themeName: "Dark Gourmet & Street Food",
    palette: {
      bg: "#09090b",
      cardBg: "#121215",
      accent: "#f59e0b", // Âmbar apetitoso
      accentGlow: "rgba(245, 158, 11, 0.25)",
      text: "#ffffff",
      textMuted: "#a1a1aa",
      border: "rgba(255, 255, 255, 0.08)",
    },
    typography: {
      fontFamily: "sans-serif",
      headingStyle: "font-black tracking-tight",
      badgeStyle: "bg-amber-500 text-black font-black uppercase text-[10px] px-2 py-0.5 rounded-md",
    },
    marqueePhrases: [
      "🔥 PREPARADO NA HORA",
      "🚀 ENTREGA RÁPIDA & EMBALAGEM TÉRMICA",
      "🌿 INGREDIENTES FRESCOS SELECIONADOS",
      "⭐ RECEITA EXCLUSIVA DA CASA",
      "🏆 ELEITO O FAVORITO DA REGIÃO",
    ],
    proofBadges: ["Entrega Expressa 🛵", "Embalagem Selada 🔒", "Atendimento Ágil 💬"],
    ctaCopy: {
      primary: "Fazer Pedido Agora",
      secondary: "Ver Cardápio Completo",
      whatsappGreeting: "Olá! Gostaria de fazer um pedido pelo cardápio online.",
    },
  },

  // 2. LOJAS, VAREJO, BOUTIQUES, MODA, ÓTICA, ELETRÔNICOS
  shop: {
    themeName: "Modern Luxury & Boutique Chic",
    palette: {
      bg: "#09090b",
      cardBg: "#141419",
      accent: "#ec4899", // Rosa vibrante / magenta fashion
      accentGlow: "rgba(236, 72, 153, 0.25)",
      text: "#ffffff",
      textMuted: "#a1a1aa",
      border: "rgba(255, 255, 255, 0.1)",
    },
    typography: {
      fontFamily: "sans-serif",
      headingStyle: "font-extrabold tracking-tight",
      badgeStyle: "bg-pink-500 text-white font-black uppercase text-[10px] px-2 py-0.5 rounded-md shadow",
    },
    marqueePhrases: [
      "✨ COLEÇÃO EXCLUSIVA 2026",
      "💳 PARCELAMENTO EM ATÉ 10X SEM JUROS",
      "📦 ENVIAMOS PARA TODO O BRASIL",
      "🎁 EMBALAGEM ESPECIAL PARA PRESENTE",
      "💎 PRODUTOS 100% ORIGINAIS",
    ],
    proofBadges: ["Troca Fácil em até 7 Dias 🔄", "Garantia de Autenticidade 💎", "Envio Seguro 📦"],
    ctaCopy: {
      primary: "Comprar pelo WhatsApp",
      secondary: "Ver Catálogo Completo",
      whatsappGreeting: "Olá! Gostaria de finalizar a compra dos itens selecionados.",
    },
  },

  // 3. BARBEARIAS, CABELEIREIROS & CUIDADOS MASCULINOS
  barber: {
    themeName: "Vintage Fade & Dark Barber",
    palette: {
      bg: "#0a0a0d",
      cardBg: "#141418",
      accent: "#f59e0b", // Ouro envelhecido
      accentGlow: "rgba(245, 158, 11, 0.2)",
      text: "#ffffff",
      textMuted: "#a1a1aa",
      border: "rgba(255, 255, 255, 0.1)",
    },
    typography: {
      fontFamily: "sans-serif",
      headingStyle: "font-black tracking-wider uppercase",
      badgeStyle: "bg-amber-500 text-black font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-md",
    },
    marqueePhrases: [
      "✂️ CORTES CLÁSSICOS & DEGRADÊ PERFEITO",
      "🍺 CERVEJA GELADA CORTESIA",
      "🔥 BARBA TERAPIA COM TOALHA QUENTE",
      "⏰ ATENDIMENTO COM HORA MARCADA",
      "💈 OS MELHORES PROFISSIONAIS DA CIDADE",
    ],
    proofBadges: ["Sem Fila de Espera ⏱️", "Ambiente Climatizado ❄️", "Produtos Importados 💈"],
    ctaCopy: {
      primary: "Agendar Horário Online",
      secondary: "Falar no WhatsApp",
      whatsappGreeting: "Olá! Gostaria de agendar um horário na barbearia.",
    },
  },

  // 4. INDÚSTRIA, FABRICAÇÃO, ENERGIA SOLAR, B2B
  industry: {
    themeName: "High-Tech Industrial & Corporate Precision",
    palette: {
      bg: "#090d16",
      cardBg: "#0f172a",
      accent: "#38bdf8", // Sky blue industrial
      accentGlow: "rgba(56, 189, 248, 0.2)",
      text: "#ffffff",
      textMuted: "#94a3b8",
      border: "rgba(56, 189, 248, 0.15)",
    },
    typography: {
      fontFamily: "sans-serif",
      headingStyle: "font-black tracking-tight",
      badgeStyle: "bg-sky-500 text-slate-950 font-black uppercase text-[10px] px-2.5 py-0.5 rounded-md",
    },
    marqueePhrases: [
      "⚙️ ENGENHARIA DE ALTA PERFORMANCE",
      "📑 FATURAMENTO PARA EMPRESAS (PJ)",
      "🛡️ GARANTIA ESTENDIDA DE FÁBRICA",
      "📦 PRONTA ENTREGA & DISTRIBUIÇÃO NACIONAL",
      "⚡ HOMOLOGAÇÃO TÉCNICA GARANTIDA",
    ],
    proofBadges: ["Projetos Personalizados 📐", "Suporte Técnico Dedicado 🛠️", "Certificação Inmetro 📜"],
    ctaCopy: {
      primary: "Solicitar Cotação B2B",
      secondary: "Falar com Engenheiro Técnico",
      whatsappGreeting: "Olá! Gostaria de solicitar um orçamento corporativo para nossa empresa.",
    },
  },

  // 5. SERVIÇOS PROFISSIONAIS, CLÍNICAS, SAÚDE, CONSULTÓRIOS
  service: {
    themeName: "Clinical Authority & Human Health",
    palette: {
      bg: "#09090b",
      cardBg: "#111827",
      accent: "#10b981", // Esmeralda saúde & confiança
      accentGlow: "rgba(16, 185, 129, 0.2)",
      text: "#ffffff",
      textMuted: "#9ca3af",
      border: "rgba(255, 255, 255, 0.1)",
    },
    typography: {
      fontFamily: "sans-serif",
      headingStyle: "font-bold tracking-tight",
      badgeStyle: "bg-emerald-500 text-slate-950 font-black uppercase text-[10px] px-2 py-0.5 rounded-md",
    },
    marqueePhrases: [
      "🩺 ATENDIMENTO HUMANIZADO & ESPECIALIZADO",
      "🗓️ AGENDAMENTO CONVENIENTE ONLINE",
      "✨ PROTOCOLOS MODERNOS & TECNOLOGIA AVANÇADA",
      "🏥 CONSULTÓRIO COM MÁXIMO CONFORTO & PRIVACIDADE",
    ],
    proofBadges: ["Profissionais Credenciados 🎓", "Pontualidade Rigorosa ⏰", "Atendimento Personalizado 🤝"],
    ctaCopy: {
      primary: "Agendar Minha Consulta",
      secondary: "Tirar Dúvidas no WhatsApp",
      whatsappGreeting: "Olá! Gostaria de agendar uma consulta.",
    },
  },
};

/**
 * Retorna o arquétipo visual completo para a categoria solicitada
 */
export function getVisualArchetype(category: string): ArchetypeVisualSpec {
  return ARCHETYPES[category] || ARCHETYPES.service;
}
