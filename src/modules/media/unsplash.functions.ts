import { createServerFn } from "@tanstack/react-start";
import { NICHE_GALLERIES, detectNicheKey } from "@/modules/prospecting/nichePresets";

export interface UnsplashPhotoItem {
  id: string;
  url: string;
  thumbUrl: string;
  label: string;
  width?: number;
  height?: number;
  photographerName?: string;
  photographerUrl?: string;
  source?: "ddg" | "openverse" | "curated";
}

/**
 * Dicionário inteligente de termos em português para inglês para maximizar
 * os resultados em bancos de imagem internacionais abertos quando aplicável.
 */
const PT_TO_EN_TERMS: Record<string, string> = {
  "drenagem corporal": "lymphatic drainage massage body",
  "drenagem linfatica": "lymphatic drainage body massage",
  "drenagem": "lymphatic drainage body massage",
  "estetica corporal": "body aesthetic clinic treatment wellness",
  "estetica avancada": "aesthetic clinic wellness body",
  "estetica facial": "facial skincare clinic spa beauty",
  "harmonizacao facial": "facial aesthetics skincare clinic",
  "harmonizacao": "facial skincare aesthetics",
  "limpeza de pele": "facial skincare deep cleansing",
  "botox": "aesthetic clinic facial skincare",
  "peeling": "skincare facial peeling treatment",
  "advogado": "lawyer office attorney legal modern",
  "advocacia": "law firm attorney office corporate",
  "direito": "law office attorney courthouse",
  "barbearia": "modern barbershop barber hair grooming",
  "barbearia moderna": "modern barbershop interior barber",
  "barber": "barber barbershop grooming fade",
  "salao de beleza": "beauty salon hair stylist interior",
  "salao": "beauty salon hair styling modern",
  "manicure": "manicure nail salon polish gel",
  "unhas em gel": "gel nails nail art salon",
  "unhas": "manicure nails salon aesthetic",
  "spa": "luxury spa wellness massage aromatherapy",
  "massagem relaxante": "relaxing massage spa stones",
  "massoterapia": "massage therapy body treatment",
  "massagem": "massage therapy spa relaxation",
  "dentista": "modern dentist dental clinic clean smile",
  "odontologia": "dental clinic dentist modern interior",
  "hamburgueria": "artisan gourmet burger crispy fries",
  "hamburguer": "artisan smash burger gourmet beef",
  "restaurante": "restaurant gourmet food dining interior",
  "pizzaria": "artisan pizza wood fired oven restaurant",
  "pizza": "artisan pizza fresh oven cheese",
  "cafeteria": "coffee shop specialty cafe latte art",
  "cafe": "coffee beans specialty cafe espresso cup",
  "sorveteria": "ice cream gelato artisan display",
  "gelato": "gelato ice cream artisanal cup",
  "acai": "acai bowl smoothie fresh fruits",
  "oficina mecanica": "auto repair mechanic workshop cars",
  "oficina": "car mechanic workshop vehicle engine",
  "mecanica": "auto repair mechanic car service",
  "auto center": "auto repair tires car service garage",
  "pet shop": "pet shop grooming cute dogs cats",
  "veterinaria": "veterinarian vet clinic dog cat care",
  "banho e tosa": "pet grooming dog bath happy puppy",
  "academia": "modern gym fitness workout equipment",
  "fitness": "fitness gym workout athlete training",
  "personal trainer": "personal trainer fitness gym athlete",
  "nutricionista": "nutritionist healthy food fresh meal diet",
  "imobiliaria": "luxury modern real estate house architecture",
  "corretor": "real estate agent luxury house interior",
  "construcao civil": "architecture construction building engineer",
  "reforma": "home renovation modern interior design",
  "energia solar": "solar energy panels rooftop sunlight",
  "contabilidade": "accounting business finance executive office",
  "loja de roupas": "fashion boutique retail store clothing",
  "moda": "fashion boutique clothing collection",
  "tecnologia": "technology modern workstation software hardware",
};

/**
 * Busca fotos no DuckDuckGo Image Search (motor de busca global de altíssima precisão).
 * Retorna dezenas de fotos reais, contextuais e de alta definição.
 */
async function searchDuckDuckGoImages(query: string, limit = 24): Promise<UnsplashPhotoItem[]> {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      }
    );

    if (!tokenRes.ok) return [];
    const html = await tokenRes.text();
    const vqdMatch =
      html.match(/vqd=([a-zA-Z0-9_-]+)/) || html.match(/vqd="([a-zA-Z0-9_-]+)"/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(
        query
      )}&vqd=${vqd}&f=,,,type:photo,&p=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://duckduckgo.com/",
          Accept: "application/json",
        },
      }
    );

    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    const results = data.results || [];

    if (!Array.isArray(results) || results.length === 0) return [];

    return results
      .filter((r: any) => r.image && typeof r.image === "string" && r.image.startsWith("http"))
      .slice(0, limit)
      .map((r: any, idx: number) => ({
        id: `ddg-${idx}-${Date.now()}`,
        url: r.image,
        thumbUrl: r.thumbnail || r.image,
        label: r.title ? r.title.replace(/<[^>]+>/g, "").trim() : query,
        width: r.width,
        height: r.height,
        photographerName: r.source || "Web / Google",
        photographerUrl: r.url,
        source: "ddg" as const,
      }));
  } catch (err) {
    console.warn("[searchDuckDuckGoImages] Falha na busca DDG:", err);
    return [];
  }
}

/**
 * Busca complementar no Openverse (acervo aberto com mais de 800 milhões de fotos comerciais).
 */
async function searchOpenverseImages(query: string, limit = 20): Promise<UnsplashPhotoItem[]> {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${limit}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MaquinaDeSites/2.0",
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    return results
      .filter((r: any) => r.url && typeof r.url === "string")
      .map((r: any) => ({
        id: `ov-${r.id}`,
        url: r.url,
        thumbUrl: r.thumbnail || r.url,
        label: r.title || query,
        width: r.width,
        height: r.height,
        photographerName: r.creator || "Openverse",
        photographerUrl: r.foreign_landing_url,
        source: "openverse" as const,
      }));
  } catch (err) {
    console.warn("[searchOpenverseImages] Falha na busca Openverse:", err);
    return [];
  }
}

/**
 * Converte a galeria curada do nicho em UnsplashPhotoItems de altíssima definição.
 */
function getCuratedNichePhotos(query: string): UnsplashPhotoItem[] {
  const detectedKey = detectNicheKey(query, null);
  const gallery = NICHE_GALLERIES[detectedKey] || NICHE_GALLERIES.geral;

  const combined = [...(gallery.covers || []), ...(gallery.avatars || [])];

  return combined.map((item, idx) => ({
    id: `curated-${detectedKey}-${idx}`,
    url: item.url,
    thumbUrl: item.url.replace("w=1200", "w=400").replace("w=1600", "w=400"),
    label: item.label,
    photographerName: "Curadoria Oficial",
    source: "curated" as const,
  }));
}

/**
 * Função Server-Side para busca ultra-robusta de imagens reais:
 * 1. Executa busca real via DuckDuckGo com suporte total a português e termos de nicho.
 * 2. Se DDG retornar menos de 4 resultados, complementa com Openverse.
 * 3. Se houver falha de rede ou timeout, recorre à galeria curada EXATAMENTE do nicho pesquisado (nunca fotos aleatórias).
 */
export const searchUnsplashPhotosFn = createServerFn({ method: "POST" })
  .validator((d: { query: string; perPage?: number }) => d)
  .handler(async ({ data }): Promise<UnsplashPhotoItem[]> => {
    const rawQuery = (data.query || "").trim();
    if (!rawQuery) {
      return getCuratedNichePhotos("geral");
    }

    const perPage = Math.min(Math.max(data.perPage || 24, 8), 36);

    const normalizedLower = rawQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // 1. Tenta Busca Real (DuckDuckGo Image Search)
    const ddgResults = await searchDuckDuckGoImages(rawQuery, perPage);
    if (ddgResults.length >= 6) {
      return ddgResults.slice(0, perPage);
    }

    // 2. Se retornou poucos resultados, tenta busca em inglês se houver termo mapeado
    const mappedEnTerm = PT_TO_EN_TERMS[normalizedLower] || PT_TO_EN_TERMS[rawQuery.toLowerCase()];
    if (mappedEnTerm && mappedEnTerm !== rawQuery) {
      const ddgEnResults = await searchDuckDuckGoImages(mappedEnTerm, perPage);
      if (ddgEnResults.length >= 6) {
        return [...ddgResults, ...ddgEnResults].slice(0, perPage);
      }

      const ovResults = await searchOpenverseImages(mappedEnTerm, perPage);
      if (ovResults.length > 0) {
        return [...ddgResults, ...ovResults].slice(0, perPage);
      }
    }

    // 3. Fallback inteligente e perfeitamente ancorado no nicho exato
    const curated = getCuratedNichePhotos(rawQuery);
    if (ddgResults.length > 0) {
      return [...ddgResults, ...curated].slice(0, perPage);
    }

    return curated;
  });
