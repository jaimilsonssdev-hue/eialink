import type { CinematicPageData } from "./types";

export const LUXURY_PALETTES = [
  { id: "amber", name: "Âmbar & Ouro Nobre", bg: "#0a0a0c", accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)" },
  { id: "emerald", name: "Esmeralda Imperial", bg: "#070c0a", accent: "#10b981", glow: "rgba(16, 185, 129, 0.15)" },
  { id: "rose", name: "Champagne & Rosé", bg: "#0c0809", accent: "#fb7185", glow: "rgba(251, 113, 133, 0.15)" },
  { id: "violet", name: "Violeta Profundo", bg: "#09070f", accent: "#a855f7", glow: "rgba(168, 85, 247, 0.15)" },
  { id: "platinum", name: "Platina & Diamante", bg: "#080809", accent: "#e2e8f0", glow: "rgba(226, 232, 240, 0.15)" },
  { id: "neopop", name: "Neo-Pop Volt & Pink", bg: "#08080a", accent: "#ccff00", glow: "rgba(204, 255, 0, 0.2)" },
  { id: "cyber", name: "Cyber Matrix Cyan", bg: "#05080c", accent: "#00f0ff", glow: "rgba(0, 240, 255, 0.2)" },
];

export function createDefaultCinematicData(
  businessName = "Café & Torrefação Grão Real",
  niche = "Cafeteria & Confeitaria Fina",
  whatsapp = "5511999999999",
  address = "Alameda Lorena, 1420 - Jardins, São Paulo",
  rating = 4.9
): CinematicPageData {
  return {
    businessName,
    niche,
    whatsapp,
    address,
    rating,
    openingHours: "Terça a Domingo das 08h às 20h",
    archetype: "luxury-editorial",
    theme: {
      bg: "#0a0a0c",
      accent: "#f59e0b",
      secondaryAccent: "#fbbf24",
      fontHeading: "serif",
      parallaxEnabled: true,
      borderStyle: "glass",
    },
    hero: {
      title: "O Ritual da Alta Gastronomia Sensorial",
      subtitle:
        "Onde cada detalhe, torra artesanal e extração minuciosa transformam ingredientes nobres em uma experiência cinematográfica inesquecível.",
      tagline: "EXPERIÊNCIA EXCLUSIVA",
      floatingBadge: "★ 4.9 NO GOOGLE (1.2k avaliações)",
      backgroundImage:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=85",
      ctaText: "Viver a Experiência VIP",
      ctaLink: "#manifesto",
    },
    marquee: [
      { id: "m1", text: "TORRA ARTESANAL DIÁRIA", icon: "☕" },
      { id: "m2", text: "MICROLOTES ACIMA DE 1.200M", icon: "⛰️" },
      { id: "m3", text: "CONFEITARIA AUTORAL FRANCESA", icon: "✨" },
      { id: "m4", text: "EXPERIÊNCIA SENSORIAL IMERSIVA", icon: "💎" },
      { id: "m5", text: "NOTAS FLORAIS E CARAMELO PURO", icon: "🌿" },
    ],
    bentoGrid: [
      {
        id: "b1",
        title: "Origem & Altitude",
        subtitle: "Colheita Manual Selecionada",
        description: "Grãos arábica estritamente cultivados a mais de 1.200m de altitude com solo vulcânico e clima ameno.",
        size: "large",
        metric: "1.200m",
        badge: "Pureza Geográfica",
        imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "b2",
        title: "Avaliação Máxima",
        subtitle: "Consistência Reconhecida",
        description: "Mais de 1.200 clientes avaliaram a experiência sensorial com nota máxima no Google.",
        size: "medium",
        metric: "4.9 ★",
        badge: "Google Reviews",
        accentBg: true,
      },
      {
        id: "b3",
        title: "Métodos Especiais",
        description: "V60, Chemex, Aeropress e Prensa Francesa calibrados individualmente por baristas certificados.",
        size: "medium",
        metric: "100%",
        badge: "Artesanal",
      },
      {
        id: "b4",
        title: "Harmonização Autoral",
        description: "Cada xícara é servida acompanhada de um perfil sensorial com notas de frutas e flores.",
        size: "small",
        badge: "Sommelier",
      },
    ],
    manifesto: {
      headline: "Nossa Obsessão Pelo Perfeito Não Aceita Atalhos.",
      bodyText:
        "Nascemos da convicção de que o verdadeiro luxo mora na autenticidade. Cada lote colhido a mais de 1.200 metros de altitude, cada método de extração manual e cada receita autoral são pensados para despertar sensações adormecidas. Não servimos apenas sabores; conduzimos você por uma jornada contemplativa onde o tempo desacelera.",
      quote:
        "O verdadeiro valor do trabalho artesanal reside no respeito sagrado pelo tempo e pela matéria-prima.",
      author: "Mestre Torrefador & Chef Fundador",
    },
    comparison: {
      headline: "O Nosso Padrão vs. O Convencional",
      usLabel: "Experiência Grão Real",
      othersLabel: "Mercado Tradicional",
      rows: [
        { feature: "Grãos de Microlotes Especiais (84+ pontos SCA)", us: true, others: false },
        { feature: "Torra Fresca Artesanal Semanal", us: true, others: false },
        { feature: "Extração Manual sob Demanda na Mesa", us: true, others: "Apenas máquina automática" },
        { feature: "Confeitaria de Fermentação Lenta Sem Conservantes", us: true, others: false },
        { feature: "Atmosfera Imersiva com Design Acústico", us: true, others: false },
      ],
    },
    gallery: [
      {
        id: "g1",
        url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85",
        caption: "A precisão da extração manual a 92°C com notas de caramelo e jasmim",
        category: "Extração",
      },
      {
        id: "g2",
        url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
        caption: "Ambiente intimista desenhado para momentos de silêncio e conexão nobre",
        category: "Atmosfera",
      },
      {
        id: "g3",
        url: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=1200&q=85",
        caption: "Confeitaria artesanal de fermentação lenta com frutas vermelhas frescas",
        category: "Confeitaria",
      },
      {
        id: "g4",
        url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85",
        caption: "Grãos de microlotes selecionados a dedo nas montanhas da Mantiqueira",
        category: "Origem",
      },
    ],
    highlights: [
      {
        id: "h1",
        title: "Ritual Geisha Mantiqueira",
        description:
          "Café especial de altitude extrema com notas florais de bergamota e mel silvestre, extraído sob medida na mesa.",
        price: "R$ 38,00",
        badge: "Assinatura",
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "h2",
        title: "Torta Ópera Noir 70%",
        description:
          "Camadas finíssimas de biscuit joconde embebido em café, ganache de cacau de origem e folha de ouro comestível.",
        price: "R$ 42,00",
        badge: "Autoral",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "h3",
        title: "Cold Brew Infusion OAK",
        description:
          "Extração a frio maturada por 18 horas em barris de carvalho tostado, servida sobre esfera de gelo cristalino.",
        price: "R$ 34,00",
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
      },
    ],
    faq: [
      {
        question: "É necessário fazer reserva com antecedência?",
        answer: "Para o ritual sensorial guiado na mesa sugerimos reserva pelo WhatsApp, mas também acolhemos mesas por ordem de chegada com todo o conforto.",
      },
      {
        question: "Vocês possuem opções sem glúten ou veganas?",
        answer: "Sim, nossa confeitaria autoral oferece criações diárias sem glúten, leites vegetais artesanais e opções 100% plant-based.",
      },
      {
        question: "Posso adquirir os grãos de café torrados para levar?",
        answer: "Com certeza! Moemos sob medida para o seu método de preparo caseiro ou entregamos o pacote selado com data de torra recente.",
      },
      {
        question: "Realizam eventos privados ou degustações corporativas?",
        answer: "Disponibilizamos nosso salão intimista e a equipe de baristas para experiências exclusivas de degustação e reuniões fechadas.",
      },
    ],
  };
}
