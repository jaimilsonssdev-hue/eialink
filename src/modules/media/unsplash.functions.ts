import { createServerFn } from "@tanstack/react-start";

export interface UnsplashPhotoItem {
  id: string;
  url: string;
  thumbUrl: string;
  label: string;
  width?: number;
  height?: number;
  photographerName?: string;
  photographerUrl?: string;
}

const PT_TO_EN_TERMS: Record<string, string> = {
  "drenagem corporal": "lymphatic drainage massage body",
  "drenagem linfatica": "lymphatic drainage body massage",
  "drenagem": "lymphatic drainage body massage",
  "estetica corporal": "body aesthetic clinic treatment",
  "estetica avancada": "aesthetic clinic wellness body",
  "estetica facial": "facial skincare clinic spa",
  "harmonizacao facial": "facial aesthetics skincare clinic",
  "harmonizacao": "facial skincare aesthetics",
  "limpeza de pele": "facial skincare deep cleansing",
  "botox": "aesthetic clinic facial skincare",
  "peeling": "skincare facial peeling treatment",
  "advogado": "lawyer office attorney legal",
  "advocacia": "law firm attorney office",
  "direito": "law office attorney courthouse",
  "barbearia": "barbershop barber hair",
  "barbearia moderna": "modern barbershop barber",
  "barber": "barber barbershop grooming",
  "salao de beleza": "beauty salon hair stylist",
  "salao": "beauty salon hair styling",
  "manicure": "manicure nail salon polish",
  "unhas em gel": "gel nails nail art salon",
  "unhas": "manicure nails salon aesthetic",
  "spa": "luxury spa wellness massage",
  "massagem relaxante": "relaxing massage spa stones",
  "massoterapia": "massage therapy body treatment",
  "massagem": "massage therapy spa relaxation",
  "dentista": "dentist dental clinic smile",
  "odontologia": "dental clinic dentist",
  "hamburgueria": "artisan burger gourmet",
  "hamburguer": "artisan burger gourmet beef",
  "restaurante": "restaurant gourmet food dining",
  "pizzaria": "artisan pizza restaurant oven",
  "pizza": "pizza artisan fresh oven",
  "cafeteria": "coffee shop specialty cafe latte",
  "cafe": "coffee beans specialty cafe espresso",
  "sorveteria": "ice cream gelato artisan",
  "gelato": "gelato ice cream artisanal",
  "acai": "acai bowl smoothie fruits berry",
  "oficina mecanica": "auto repair mechanic workshop",
  "oficina": "car mechanic workshop engine",
  "mecanica": "auto repair mechanic car",
  "auto center": "auto repair tires car service",
  "pet shop": "pet shop dogs cats grooming",
  "veterinaria": "veterinarian vet clinic dog cat",
  "banho e tosa": "pet grooming dog bath",
  "academia": "gym fitness workout training",
  "fitness": "fitness gym workout athlete",
  "personal trainer": "personal trainer fitness gym",
  "nutricionista": "nutritionist healthy food diet",
  "imobiliaria": "real estate luxury home architecture",
  "corretor": "real estate agent house luxury",
  "construcao civil": "architecture construction building",
  "reforma": "home renovation interior design",
  "energia solar": "solar energy panels rooftop",
  "contabilidade": "accounting business finance office",
  "loja de roupas": "fashion store boutique clothing",
  "moda": "fashion boutique luxury clothing",
  "tecnologia": "technology coding modern workspace computer",
};

// Fallback curated HD photos for resilient zero-failure searches
const CURATED_FALLBACKS: Record<string, UnsplashPhotoItem[]> = {
  estetica_corporal: [
    {
      id: "ec-1",
      url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80",
      label: "Drenagem Linfática & Massoterapia",
    },
    {
      id: "ec-2",
      url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80",
      label: "Tratamento Corporal & Bem-Estar",
    },
    {
      id: "ec-3",
      url: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=400&q=80",
      label: "Massagem Modeladora Corporal",
    },
    {
      id: "ec-4",
      url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80",
      label: "Protocolos de Estética Avançada",
    },
    {
      id: "ec-5",
      url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
      label: "Clínica de Estética & Alta Tecnologia",
    },
    {
      id: "ec-6",
      url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80",
      label: "Cuidado e Relaxamento Corporal",
    },
  ],
  advogado: [
    {
      id: "adv-1",
      url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
      label: "Balança da Justiça & Símbolo Jurídico",
    },
    {
      id: "adv-2",
      url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=400&q=80",
      label: "Biblioteca Jurídica & Código de Leis",
    },
    {
      id: "adv-3",
      url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80",
      label: "Escritório de Advocacia Corporativo",
    },
    {
      id: "adv-4",
      url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80",
      label: "Acordo Jurídico & Aperto de Mãos",
    },
  ],
  barbearia: [
    {
      id: "barb-1",
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
      label: "Cadeira de Barbearia Clássica",
    },
    {
      id: "barb-2",
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80",
      label: "Navalha de Precisão & Tesoura",
    },
    {
      id: "barb-3",
      url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80",
      label: "Barber Club Moderno",
    },
    {
      id: "barb-4",
      url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
      thumbUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80",
      label: "Corte e Barbaterapia",
    },
  ],
};

export const searchUnsplashPhotosFn = createServerFn({ method: "POST" })
  .validator((d: { query: string; perPage?: number }) => d)
  .handler(async ({ data }): Promise<UnsplashPhotoItem[]> => {
    const rawQuery = (data.query || "").trim();
    if (!rawQuery) return [];

    const normalizedLower = rawQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const perPage = Math.min(Math.max(data.perPage || 12, 4), 24);

    // Mapeia para inglês se houver tradução otimizada
    const mappedQuery = PT_TO_EN_TERMS[normalizedLower] || PT_TO_EN_TERMS[rawQuery.toLowerCase()] || rawQuery;

    try {
      const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(mappedQuery)}&per_page=${perPage}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const json = await response.json();
        const results = json.results || [];
        if (Array.isArray(results) && results.length > 0) {
          return results.slice(0, perPage).map((p: any) => ({
            id: p.id,
            url: p.urls?.regular || p.urls?.full || p.urls?.small,
            thumbUrl: p.urls?.small || p.urls?.thumb || p.urls?.regular,
            label: p.alt_description || p.description || rawQuery,
            width: p.width,
            height: p.height,
            photographerName: p.user?.name,
            photographerUrl: p.user?.links?.html,
          }));
        }
      }
    } catch (err) {
      console.warn("[searchUnsplashPhotosFn] Erro ao buscar no Unsplash:", err);
    }

    // Fallback inteligente
    for (const [key, list] of Object.entries(CURATED_FALLBACKS)) {
      if (normalizedLower.includes(key) || key.includes(normalizedLower)) {
        return list;
      }
    }

    return CURATED_FALLBACKS.estetica_corporal;
  });
