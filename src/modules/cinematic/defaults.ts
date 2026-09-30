import type { CinematicPageData } from "./types";

export const LUXURY_PALETTES = [
  { id: "amber", name: "Âmbar & Ouro Nobre", bg: "#0a0a0c", accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)" },
  { id: "emerald", name: "Esmeralda Imperial", bg: "#070c0a", accent: "#10b981", glow: "rgba(16, 185, 129, 0.15)" },
  { id: "rose", name: "Champagne & Rosé", bg: "#0c0809", accent: "#fb7185", glow: "rgba(251, 113, 133, 0.15)" },
  { id: "violet", name: "Violeta Profundo", bg: "#09070f", accent: "#a855f7", glow: "rgba(168, 85, 247, 0.15)" },
  { id: "platinum", name: "Platina & Diamante", bg: "#080809", accent: "#e2e8f0", glow: "rgba(226, 232, 240, 0.15)" },
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
    theme: {
      bg: "#0a0a0c",
      accent: "#f59e0b",
      fontHeading: "serif",
      parallaxEnabled: true,
    },
    hero: {
      title: "O Ritual da Alta Gastronomia Sensorial",
      subtitle:
        "Onde cada detalhe, torra artesanal e extração minuciosa transformam ingredientes nobres em uma experiência cinematográfica inesquecível.",
      tagline: "EXPERIÊNCIA EXCLUSIVA",
      backgroundImage:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=85",
      ctaText: "Viver a Experiência VIP",
      ctaLink: "#manifesto",
    },
    manifesto: {
      headline: "Nossa Obsessão Pelo Perfeito Não Aceita Atalhos.",
      bodyText:
        "Nascemos da convicção de que o verdadeiro luxo mora na autenticidade. Cada lote colhido a mais de 1.200 metros de altitude, cada método de extração manual e cada receita autoral são pensados para despertar sensações adormecidas. Não servimos apenas sabores; conduzimos você por uma jornada contemplativa onde o tempo desacelera.",
      quote:
        "O verdadeiro valor do trabalho artesanal reside no respeito sagrado pelo tempo e pela matéria-prima.",
      author: "Mestre Torrefador & Chef Fundador",
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
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "h2",
        title: "Torta Ópera Noir 70%",
        description:
          "Camadas finíssimas de biscuit joconde embebido em café, ganache de cacau de origem e folha de ouro comestível.",
        price: "R$ 42,00",
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
  };
}
