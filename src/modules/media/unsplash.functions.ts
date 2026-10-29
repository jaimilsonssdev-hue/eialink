import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
        signal: AbortSignal.timeout(1800),
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
        signal: AbortSignal.timeout(1800),
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
        signal: AbortSignal.timeout(1800),
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
  .middleware([requireSupabaseAuth])
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


export interface CompatibleBusinessImage {
  id: string;
  url: string;
  thumbUrl: string;
  label: string;
  role: "hero" | "ambient" | "service" | "team" | "detail" | "tech";
  source: "ddg" | "unsplash" | "curated" | "openverse";
}

/**
 * Busca de Imagens Compatíveis em Tempo Real para o Gerador de Sites IA:
 * 1. Constrói buscas altamente direcionadas para o nicho e nome da empresa.
 * 2. Consulta a web (DuckDuckGo Image Search com preferência para fontes de alta qualidade/Unsplash).
 * 3. Mescla com o acervo rotativo de nicho com rotação dinâmica (seed).
 * 4. Atribui papéis de design para orientar a IA na diagramação (Hero, Espaço, Serviços, Equipe, Detalhes).
 */
export async function searchCompatibleBusinessImages(
  niche: string,
  businessName?: string,
  count = 8,
): Promise<CompatibleBusinessImage[]> {
  const detectedKey = detectNicheKey(niche, businessName);
  const safeCount = Math.min(Math.max(count || 8, 4), 16);

  // Termos específicos por nicho para busca web precisa
  const nicheKeywords: Record<string, string[]> = {
    odontologia: [
      "consultorio odontologico moderno recepcao",
      "estetica dental sorriso perfeito clareamento",
      "escaneamento 3d odontologia digital",
      "dentista atendimento humanizado paciente",
    ],
    clinica: [
      "clinica medica consultorio moderno recepcao",
      "atendimento humanizado saude medico",
      "equipamentos medicos alta tecnologia exame",
    ],
    estetica_corporal: [
      "estetica corporal drenagem linfatica massoterapia",
      "clinica estetica bem estar corporal",
      "massagem modeladora relaxante spa",
    ],
    estetica_facial: [
      "harmonizacao facial limpeza de pele skincare",
      "estetica facial glow rejuvenescimento",
      "clinica estetica facial profissional",
    ],
    spa: [
      "spa luxo massagem relaxante aromaterapia",
      "terapia spa pedras quentes bem estar",
      "ambiente zen silencio massoterapia",
    ],
    barbearia: [
      "barbearia moderna cadeira vintage navalha",
      "corte degrade fade barba cabelo masculino",
      "barber shop interior luz neon madeira",
    ],
    beleza: [
      "salao de beleza iluminado bancada espelho",
      "studio unhas manicure gel nail art",
      "hair stylist corte escova penteado",
    ],
    advocacia: [
      "escritorio advocacia corporativo sala reuniao",
      "advogado direito consultoria juridica",
      "biblioteca juridica direito moderno",
    ],
    oficina: [
      "oficina mecanica auto center elevador carros",
      "manutencao veicular motor diagnostico pneus",
    ],
    petshop: [
      "banho e tosa pet shop tosa higienica",
      "veterinaria clinica filhote pet care",
    ],
    fitness: [
      "academia moderna musculacao pesos halteres",
      "treino funcional personal trainer saude",
    ],
    restaurante: [
      "restaurante gastronomia prato gourmet",
      "interior restaurante moderno mesas jantar",
    ],
  };

  const queries = nicheKeywords[detectedKey] || [
    `${niche} ambiente moderno recepcao`,
    `${niche} atendimento profissional alta resolucao`,
  ];

  const normalizedLower = (niche || "").toLowerCase().trim();
  const enMappedQuery = PT_TO_EN_TERMS[normalizedLower] || PT_TO_EN_TERMS[detectedKey] || niche;

  const foundWebPhotos: UnsplashPhotoItem[] = [];

  try {
    const q1 = `${queries[0]} site:unsplash.com`;
    const q2 = queries[1] ? `${queries[1]} site:unsplash.com` : `${niche} servicos`;
    
    // Dispara busca concorrente em DuckDuckGo E na API oficial do Openverse
    const fetchGroup = Promise.allSettled([
      searchDuckDuckGoImages(q1, 8),
      searchDuckDuckGoImages(q2, 6),
      searchOpenverseImages(enMappedQuery, 8),
      searchOpenverseImages(`${enMappedQuery} interior`, 6),
    ]);
    const settledList = (await Promise.race([
      fetchGroup,
      new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2200)),
    ])) || [];
    const ddg1 = settledList[0];
    const ddg2 = settledList[1];
    const ov1 = settledList[2];
    const ov2 = settledList[3];

    if (ddg1.status === "fulfilled" && Array.isArray(ddg1.value)) {
      foundWebPhotos.push(...ddg1.value);
    }
    if (ddg2.status === "fulfilled" && Array.isArray(ddg2.value)) {
      foundWebPhotos.push(...ddg2.value);
    }
    if (ov1.status === "fulfilled" && Array.isArray(ov1.value)) {
      foundWebPhotos.push(...ov1.value);
    }
    if (ov2.status === "fulfilled" && Array.isArray(ov2.value)) {
      foundWebPhotos.push(...ov2.value);
    }
  } catch (err) {
    console.warn("[searchCompatibleBusinessImages] Busca na web falhou:", err);
  }

  // O pool curado já garante variedade máxima sem atrasar a geração

  // Galeria curada do nicho com shuffle determinístico pela semente do nome
  const gallery = NICHE_GALLERIES[detectedKey] || NICHE_GALLERIES.geral;
  const allCurated = [...(gallery.covers || []), ...(gallery.avatars || [])];

  // Seed hash para variar a seleção entre empresas diferentes
  const seedString = `${businessName || ""}-${niche}`;
  const seedNum = Math.abs(
    seedString.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0),
  );

  // Rotação determinística do pool curado
  const rotatedCurated = allCurated.slice().sort((a, b) => {
    const hashA = (a.id.charCodeAt(a.id.length - 1) + seedNum) % 17;
    const hashB = (b.id.charCodeAt(b.id.length - 1) + seedNum) % 17;
    return hashA - hashB;
  });

  // Limpa e formata URLs para CDN de alta resolução
  const cleanUrl = (url: string) => {
    if (url.includes("unsplash.com") && !url.includes("auto=format")) {
      return `${url.split("?")[0]}?auto=format&fit=crop&w=1200&q=80`;
    }
    return url;
  };

  const pool: Array<{ url: string; label: string; source: "ddg" | "unsplash" | "curated" | "openverse" }> = [];
  const seenUrls = new Set<string>();

  // 1. Adiciona fotos encontradas na web
  for (const item of foundWebPhotos) {
    const formatted = cleanUrl(item.url);
    if (!seenUrls.has(formatted) && formatted.startsWith("http")) {
      seenUrls.add(formatted);
      pool.push({
        url: formatted,
        label: item.label || `${niche} de alta resolução`,
        source: item.source || "ddg",
      });
    }
  }

  // 2. Completa com a galeria curada rotacionada
  for (const item of rotatedCurated) {
    const formatted = cleanUrl(item.url);
    if (!seenUrls.has(formatted)) {
      seenUrls.add(formatted);
      pool.push({
        url: formatted,
        label: item.label,
        source: "curated",
      });
    }
  }

  const selected = pool.slice(0, safeCount);
  const roles: CompatibleBusinessImage["role"][] = [
    "hero",
    "ambient",
    "service",
    "service",
    "team",
    "detail",
    "tech",
    "detail",
  ];

  return selected.map((item, idx) => ({
    id: `compat-${idx}-${Date.now()}`,
    url: item.url,
    thumbUrl: item.url.replace("w=1200", "w=400"),
    label: item.label,
    role: roles[idx % roles.length],
    source: item.source,
  }));
}

export const searchCompatibleBusinessImagesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { niche: string; businessName?: string; count?: number }) => d)
  .handler(async ({ data }): Promise<CompatibleBusinessImage[]> => {
    return searchCompatibleBusinessImages(data.niche, data.businessName, data.count);
  });
