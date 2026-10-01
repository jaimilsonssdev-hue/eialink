export interface DirectoryCategory {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  keywords: string[];
  bannerCover: string;
}

export const DIRECTORY_CATEGORIES: DirectoryCategory[] = [
  {
    id: "todas",
    label: "Todas as Categorias",
    shortLabel: "Tudo",
    icon: "Sparkles",
    description: "Todas as oportunidades e profissionais da cidade",
    keywords: [],
    bannerCover: "/template-assets/niche-covers/business-eialink-cover.webp",
  },
  {
    id: "gastronomia",
    label: "Gastronomia & Delivery",
    shortLabel: "Gastronomia",
    icon: "UtensilsCrossed",
    description: "Pizzarias, hamburguerias, restaurantes e deliveries",
    keywords: ["pizza", "pizzaria", "burger", "hamburguer", "lanche", "restaurante", "sushi", "marmita", "churrasco", "acai", "comida", "doces", "confeitaria"],
    bannerCover: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  },
  {
    id: "beleza",
    label: "Beleza, Cabelo & Estética",
    shortLabel: "Beleza",
    icon: "Scissors",
    description: "Barbearias, manicures, cabeleireiros e estética avançada",
    keywords: ["manicure", "pedicure", "unhas", "barbearia", "barbeiro", "salao", "cabeleireiro", "corte", "sobrancelhas", "maquiagem", "estetica", "depilacao", "cilios"],
    bannerCover: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  },
  {
    id: "reformas",
    label: "Casa, Reformas & Manutenção",
    shortLabel: "Reformas & Manutenção",
    icon: "Wrench",
    description: "Eletricistas, encanadores, pintores, marcenaria e refrigeração",
    keywords: ["eletricista", "encanador", "pedreiro", "pintor", "ar condicionado", "climatizacao", "marceneiro", "marcenaria", "serralheiro", "chaveiro", "vidraceiro", "reforma", "limpeza", "diarista"],
    bannerCover: "/template-assets/niche-covers/business-eialink-cover.webp",
  },
  {
    id: "saude",
    label: "Saúde, Odonto & Terapias",
    shortLabel: "Saúde & Odonto",
    icon: "HeartPulse",
    description: "Dentistas, fisioterapeutas, psicólogos e consultórios",
    keywords: ["dentista", "odontologia", "dente", "fisioterapia", "psicologo", "nutricionista", "medico", "terapia", "podologia", "clinica", "massagem"],
    bannerCover: "/template-assets/niche-covers/clinic-eialink-cover.webp",
  },
  {
    id: "automotivo",
    label: "Automotivo & Socorro 24h",
    shortLabel: "Automotivo",
    icon: "Car",
    description: "Mecânica, guincho, autoelétrica, lavajato e pneus",
    keywords: ["mecanica", "oficina", "guincho", "auto eletrica", "lavajato", "estetica automotiva", "pneus", "balanceamento", "funilaria", "moto"],
    bannerCover: "/template-assets/niche-covers/business-eialink-cover.webp",
  },
  {
    id: "profissionais",
    label: "Serviços Profissionais & TI",
    shortLabel: "Profissionais",
    icon: "Briefcase",
    description: "Advogados, contadores, fotógrafos, assistência técnica e tecnologia",
    keywords: ["advogado", "advocacia", "contador", "contabilidade", "fotografo", "fotografia", "assistencia tecnica", "celular", "computador", "ti", "design", "marketing"],
    bannerCover: "/template-assets/niche-covers/law-eialink-cover.webp",
  },
  {
    id: "fitness",
    label: "Fitness, Academias & Lutas",
    shortLabel: "Fitness",
    icon: "Dumbbell",
    description: "Personal trainers, academias, crossfit, pilates e lutas",
    keywords: ["academia", "personal", "treino", "crossfit", "pilates", "musculacao", "luta", "jiu jitsu", "boxe", "danca"],
    bannerCover: "/template-assets/niche-covers/academy-eialink-cover.webp",
  },
  {
    id: "comercio",
    label: "Lojas & Varejo da Cidade",
    shortLabel: "Lojas & Comércio",
    icon: "ShoppingBag",
    description: "Lojas de roupas, calçados, celulares, presentes e pet shop",
    keywords: ["loja", "roupas", "moda", "calcados", "acessorios", "presentes", "pet shop", "veterinaria", "otica", "farmacia"],
    bannerCover: "/template-assets/niche-covers/store-eialink-cover.webp",
  },
];

export const CATEGORIES = DIRECTORY_CATEGORIES;
export type DealCategory = DirectoryCategory;

export function getCategoryById(id: string): DirectoryCategory {
  return DIRECTORY_CATEGORIES.find((c) => c.id === id) || DIRECTORY_CATEGORIES[0];
}

export function findCategoryByKeyword(term?: string): DirectoryCategory {
  if (!term) return DIRECTORY_CATEGORIES[0];
  const clean = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const cat of DIRECTORY_CATEGORIES) {
    if (cat.id === "todas") continue;
    for (const kw of cat.keywords) {
      if (clean.includes(kw)) {
        return cat;
      }
    }
  }

  return DIRECTORY_CATEGORIES[0];
}


