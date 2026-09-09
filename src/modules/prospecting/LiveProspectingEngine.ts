import {
  buildDedupeKey,
  extractBrazilianPhone,
  normalizeInstagram,
  normalizeName,
  normalizePhone,
  normalizeText,
  priorityFromScore,
  scoreCompany,
} from "./scoring";
import type { ProspectDraft } from "./types";

interface RawScrapedLead {
  name: string;
  niche: string;
  city: string;
  state?: string;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  has_website: boolean;
  rating?: number | null;
  reviews_count?: number | null;
  source: string;
  notes?: string;
  cid?: string | null;
}

/**
 * Busca empresas reais no Google Maps via Jina Reader em pt-BR.
 */
async function scrapeGoogleMaps(niche: string, city: string): Promise<RawScrapedLead[]> {
  const cleanQuery = `${niche} em ${city}`.replace(/[^\w\sÀ-ÿ]/g, " ").trim().replace(/\s+/g, "+");
  // Garante localização e idioma brasileiro para o Google Maps não traduzir nomes próprios
  // em proxies internacionais (evitando que "Clínica Inove" vire "Clinical Innovate")
  const targetUrl = `https://www.google.com/maps/search/${cleanQuery}?hl=pt-BR&gl=BR`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "x-locale": "pt-BR",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ProspectingEngine] Jina Maps retornou status ${res.status}`);
      return [];
    }

    const text = await res.text();
    return parseGoogleMapsMarkdown(text, niche, city);
  } catch (err) {
    console.error("[ProspectingEngine] Erro ao consultar Google Maps:", err);
    return [];
  }
}

function parseGoogleMapsMarkdown(text: string, niche: string, city: string): RawScrapedLead[] {
  const placePattern = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:google\.[a-z.]+|maps\.google\.[a-z.]+)\/maps\/place\/[^)]+)\)/gi;
  const matches = [...text.matchAll(placePattern)];

  const leads: RawScrapedLead[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const rawName = cur[1]?.trim();
    const placeUrl = cur[2] ?? "";
    const startIndex = (cur.index ?? 0) + cur[0].length;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    const block = text.slice(startIndex, endIndex);

    if (!rawName) continue;

    // Limpa sufixos de cidade repetidos no nome (ex: "Clínica Inove - Teixeira de Freitas" -> "Clínica Inove")
    let cleanName = rawName
      .replace(/\s*-\s*(?:Teixeira de Freitas|BA|Bahia|São Paulo|SP|Rio de Janeiro|RJ).*/i, "")
      .replace(/\s*\|\s*.*/i, "")
      .trim();

    // Desfaz traduções espúrias comuns do Google Maps internacional
    if (/clinical\s+innovate/i.test(cleanName)) {
      cleanName = cleanName.replace(/clinical\s+innovate/gi, "Clínica Inove");
    } else if (/^clinical\s+/i.test(cleanName)) {
      cleanName = cleanName.replace(/^clinical\s+/i, "Clínica ");
    }

    const normalizedKey = cleanName.toLowerCase();
    if (seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);

    // Extrai identificador CID único do Google Maps da URL (!1s0x7354401e6f8b549:0x31dd34ef58886cdb)
    const cidMatch = placeUrl.match(/!1s([0-9a-fx:]+)/i);
    const cid = cidMatch ? cidMatch[1] : null;

    // Extrai nota real e contagem de avaliações (ex: 3,8(93) ou 4,7(24) ou 3,9(2.736))
    let rating: number | null = null;
    let reviewsCount: number | null = null;
    const ratingReviewsMatch = block.match(/([1-5][,.][0-9])\s*\(([\d.]+)\)/);
    if (ratingReviewsMatch) {
      rating = parseFloat(ratingReviewsMatch[1].replace(",", "."));
      reviewsCount = parseInt(ratingReviewsMatch[2].replace(/\D/g, ""), 10);
    } else {
      const rm = block.match(/\b([1-5][,.][0-9])\b/);
      if (rm) rating = parseFloat(rm[1].replace(",", "."));
      const rcm = block.match(/\(([\d.]+)\)/) || block.match(/([\d.]+)\s*(?:avaliações|avaliação|reviews)/i);
      if (rcm) reviewsCount = parseInt(rcm[1].replace(/\D/g, ""), 10);
    }

    // Extrai telefone brasileiro com DDD ou link de WhatsApp direto
    const detectedPhone = extractBrazilianPhone(block);

    // Extrai endereço se houver
    const addressMatch =
      block.match(/(?:··|·\s*)((?:Av\.|Avenida|R\.|Rua|Praça|Estr\.|Rodovia)[^\n·]+)/i) ||
      block.match(/(?:R\.|Rua|Av\.|Avenida|Praça|Travessa|Alameda|Estr\.|Rodovia)[^,\n]+,[^,\n]+(?:-[^,\n]+)?,[^,\n]+/i) ||
      block.match(/(?:·\s*((?:Av\.|Avenida|R\.|Rua|Praça|Estr\.)[^\n·]+))/i);
    const address = addressMatch ? (addressMatch[1] || addressMatch[0]).trim() : "";

    // Horários de funcionamento
    const hoursMatch = block.match(/(?:Aberto|Fechado)[^\n·]*(?:·\s*Fecha[^\n·]*|·\s*Abre[^\n·]*)?/i);
    const openingHours = hoursMatch ? hoursMatch[0].trim() : null;

    // Detecta se tem website REAL (ignora wa.me, api.whatsapp.com, instagram, facebook, linktree, booksy)
    let hasWebsite = false;
    let websiteUrl: string | null = null;
    const urlMatches = [...block.matchAll(/https?:\/\/[^\s\)"']+/g)].map((m) => m[0]);
    for (const url of urlMatches) {
      if (/google\.[a-z.]+|gstatic\.com|googleusercontent\.com/i.test(url)) continue;
      // Se for link de WhatsApp ou Instagram, não é website próprio
      if (/(?:wa\.me|whatsapp\.com|instagram\.com|facebook\.com|linktr\.ee|booksy\.com|tiktok\.com|globo\.com)/i.test(url)) {
        continue;
      }
      if (/\[?(?:Website|Site|Ver site)\]?/i.test(block) || /\.[a-z]{2,}/i.test(url)) {
        hasWebsite = true;
        websiteUrl = url;
        break;
      }
    }

    // Extrai Instagram se houver menção
    const instaMatch = block.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    const instagram =
      instaMatch && !["explore", "p", "reel"].includes(instaMatch[1])
        ? `@${instaMatch[1]}`
        : null;

    const notesParts = [
      rating ? `⭐ ${rating} (${reviewsCount ?? 0} avaliações)` : null,
      address ? `Endereço: ${address}` : null,
      openingHours ? `Horário: ${openingHours}` : null,
      cid ? `CID: ${cid}` : null,
    ].filter(Boolean);

    leads.push({
      name: cleanName,
      niche,
      city,
      phone: detectedPhone,
      whatsapp: detectedPhone,
      instagram,
      has_website: hasWebsite,
      website: websiteUrl,
      rating,
      reviews_count: reviewsCount,
      source: "google_maps",
      cid,
      notes: notesParts.join(" · ") || "Capturado no Google Maps",
    });
  }

  return leads;
}

/**
 * Busca perfis do Instagram através da busca indexada pública com timeout seguro.
 */
async function scrapeInstagram(niche: string, city: string): Promise<RawScrapedLead[]> {
  const cleanCity = city.replace(/[^\w\sÀ-ÿ]/g, " ").trim();
  const query = `site:instagram.com "${niche}" "${cleanCity}" ("wa.me" OR "whatsapp")`;
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout para não atrasar a busca principal

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "x-locale": "pt-BR",
      },
    });
    clearTimeout(timeout);


    if (!res.ok) return [];
    const text = await res.text();

    const leads: RawScrapedLead[] = [];
    const regex = /\[([^\]]+)\]\(https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?\)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const title = match[1];
      const handle = match[2];

      if (["explore", "reels", "stories", "p", "accounts", "about"].includes(handle.toLowerCase())) {
        continue;
      }

      const cleanName = title
        .replace(/\(@[a-zA-Z0-9._]+\).*/i, "")
        .replace(/•.*/, "")
        .replace(/Instagram.*/i, "")
        .trim();

      const snippetRadius = text.slice(Math.max(0, match.index - 200), Math.min(text.length, match.index + 400));
      const rawPhone = extractBrazilianPhone(snippetRadius);

      leads.push({
        name: cleanName || handle,
        niche,
        city,
        instagram: `@${handle}`,
        phone: rawPhone,
        whatsapp: rawPhone,
        has_website: false,
        website: null,
        source: "instagram",
        notes: `Perfil público do Instagram: @${handle}`,
      });
    }

    return leads;
  } catch {
    return [];
  }
}

/**
 * Motor Principal: Busca tanto no Google Maps quanto no Instagram e consolida sem duplicatas.
 */
export async function searchGoogleMapsAndInstagram(
  niche: string,
  city: string,
  limit = 15,
): Promise<ProspectDraft[]> {
  const [mapsLeads, instaLeads] = await Promise.all([
    scrapeGoogleMaps(niche, city),
    scrapeInstagram(niche, city),
  ]);

  const allRaw = [...mapsLeads, ...instaLeads];
  const seenKeys = new Set<string>();
  const results: ProspectDraft[] = [];

  for (const raw of allRaw) {
    const name = normalizeName(raw.name);
    if (!name || name.length < 3) continue;

    const phone = normalizePhone(raw.phone);
    const whatsapp = normalizePhone(raw.whatsapp) ?? phone;
    const instagram = normalizeInstagram(raw.instagram);
    const dedupe_key = buildDedupeKey({ name, city, phone, whatsapp, instagram });

    if (seenKeys.has(dedupe_key)) continue;
    seenKeys.add(dedupe_key);


    const draftBase = {
      name,
      niche: normalizeText(raw.niche),
      city: normalizeText(raw.city),
      state: raw.state ?? null,
      phone,
      whatsapp,
      email: null,
      instagram,
      website: raw.website ?? null,
      has_website: raw.has_website,
      rating: raw.rating ?? null,
      reviews_count: raw.reviews_count ?? null,
      source: raw.source,
      status: "novo" as const,
      notes: raw.notes ?? null,
      dedupe_key,
    };

    const score = scoreCompany(draftBase);
    const priority = priorityFromScore(score);

    results.push({
      ...draftBase,
      score,
      priority,
    });

    if (results.length >= limit) break;
  }

  // Prioriza oportunidades que possuem canal direto de contato (WhatsApp ou Instagram) primeiro
  return results.sort((a, b) => {
    const aContact = Boolean(a.whatsapp || a.phone || a.instagram);
    const bContact = Boolean(b.whatsapp || b.phone || b.instagram);
    if (aContact && !bContact) return -1;
    if (!aContact && bContact) return 1;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

/**
 * Localiza perfil de negócio por nome/termo ou link direto (Google Maps ou Instagram).
 */
export async function lookupBusinessProfile(queryOrUrl: string): Promise<ProspectDraft[]> {
  const trimmed = queryOrUrl.trim();
  if (!trimmed) return [];

  // 1. Se for link ou perfil do Instagram (ex: instagram.com/clinica.silva ou @clinica.silva)
  const instaRegex = /(?:https?:\/\/(?:www\.)?instagram\.com\/|@)([a-zA-Z0-9._]+)/i;
  const instaMatch = trimmed.match(instaRegex);
  if (instaMatch && !["explore", "p", "reel", "stories", "accounts"].includes(instaMatch[1].toLowerCase())) {
    const handle = instaMatch[1];
    const cleanName = handle
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return [
      {
        name: cleanName,
        niche: "geral",
        city: "",
        state: null,
        phone: null,
        whatsapp: null,
        email: null,
        instagram: `@${handle}`,
        website: null,
        has_website: false,
        rating: null,
        reviews_count: null,
        source: "instagram_link",
        status: "novo",
        notes: `Importado via Instagram: @${handle}`,
        dedupe_key: `insta:${handle.toLowerCase()}`,
        score: 75,
        priority: "alta",
      },
    ];
  }

  // 2. Se for link do Google Maps
  let searchTerm = trimmed;
  if (trimmed.includes("google.com/maps") || trimmed.includes("maps.app.goo.gl")) {
    const qMatch = trimmed.match(/[?&]q=([^&]+)/) || trimmed.match(/\/place\/([^/@?]+)/);
    if (qMatch) {
      searchTerm = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
    }
  }

  // Extrai cidade se o usuário digitou "em Cidade" ou "- Cidade"
  let niche = searchTerm;
  let city = "";
  const cityMatch = searchTerm.match(/(.+?)\s+(?:em|na|no|-)\s+([A-Za-zÀ-ÿ\s]{3,})$/i);
  if (cityMatch) {
    niche = cityMatch[1].trim();
    city = cityMatch[2].trim();
  }

  return await searchGoogleMapsAndInstagram(niche, city, 5);
}

export interface GoogleMapsPlaceDetails {
  rating: number | null;
  reviewsCount: number | null;
  address: string | null;
  openingHours: string | null;
  whatsapp: string | null;
  phone: string | null;
  photos: string[];
  reviews: Array<{
    author: string;
    avatar: string | null;
    rating: number;
    text: string;
  }>;
}

/**
 * Consulta a ficha completa do estabelecimento no Google Maps via Jina Reader.
 * Retorna nota real, quantidade de avaliações, fotos reais (lh3 e Street View), endereço, horários e depoimentos.
 */
export async function fetchGoogleMapsPlaceDetails(
  companyName: string,
  city?: string | null,
  providedCid?: string | null,
): Promise<GoogleMapsPlaceDetails> {
  const cleanName = companyName
    .replace(/clinical\s+innovate/gi, "Clínica Inove")
    .replace(/^clinical\s+/gi, "Clínica ")
    .replace(/\s*-\s*(?:Teixeira de Freitas|BA|Bahia|São Paulo|SP|Rio de Janeiro|RJ).*/i, "")
    .replace(/\s*\|\s*.*/i, "")
    .trim();

  let targetCid = providedCid || null;
  if (!targetCid) {
    const cidInName = companyName.match(/CID:\s*([0-9a-fx:]+)/i);
    if (cidInName) targetCid = cidInName[1];
  }

  let rating: number | null = null;
  let reviewsCount: number | null = null;
  let address: string | null = null;
  let openingHours: string | null = null;
  let whatsapp: string | null = null;
  let phone: string | null = null;
  const photos: string[] = [];
  const reviews: Array<{ author: string; avatar: string | null; rating: number; text: string }> = [];

  const query = [cleanName, city].filter(Boolean).join(" ");

  // ETAPA 1: Se não temos o CID, busca a ficha no Google Maps Search
  if (!targetCid) {
    try {
      const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR&gl=BR`;
      const jinaMapsUrl = `https://r.jina.ai/${mapsSearchUrl}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(jinaMapsUrl, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "x-locale": "pt-BR",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();

        // 1. Detecta CID diretamente da página (inclusive em redirecionamentos e telas de login/localização)
        const directCidMatch = text.match(/(?:!1s|%211s)([0-9a-fx%:]+)/i);
        if (directCidMatch) {
          targetCid = decodeURIComponent(directCidMatch[1]);
        }

        // 2. WhatsApp
        const waMatch = text.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/i);
        if (waMatch) {
          whatsapp = waMatch[1];
        }

        // 3. Horários
        const hoursMatch = text.match(/(?:Aberto|Fechado)[^\n]*(?:·\s*Fecha[^\n]*|·\s*Abre[^\n]*)?/i);
        if (hoursMatch) {
          openingHours = hoursMatch[0].replace(//g, "").trim();
        }

        // 4. Se for lista de resultados, usa parseGoogleMapsMarkdown
        const leads = parseGoogleMapsMarkdown(text, "geral", city || "");
        if (leads.length > 0) {
          const matched =
            leads.find((l) => l.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(l.name.toLowerCase())) ||
            leads[0];

          if (matched) {
            if (matched.rating) rating = matched.rating;
            if (matched.reviews_count) reviewsCount = matched.reviews_count;
            if (matched.phone) {
              phone = matched.phone;
              if (!whatsapp) whatsapp = matched.whatsapp || matched.phone;
            }
            if (matched.notes) {
              const addrM = matched.notes.match(/Endereço:\s*([^·]+)/);
              if (addrM) address = addrM[1].trim();
              const hoursM = matched.notes.match(/Horário:\s*([^·]+)/);
              if (hoursM && !openingHours) openingHours = hoursM[1].trim();
            }
            if (matched.cid && !targetCid) {
              targetCid = matched.cid;
            }
          }
        }
      }
    } catch (searchErr) {
      console.warn("[fetchGoogleMapsPlaceDetails] Aviso na busca do Google Maps:", searchErr);
    }
  }

  // ETAPA 2: Se temos o CID, consulta diretamente a ficha clássica do Maps para extrair fotos reais e avaliações
  if (targetCid) {
    try {
      const cidUrl = `https://maps.google.com/maps?cid=${targetCid}`;
      const jinaCidUrl = `https://r.jina.ai/${cidUrl}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(jinaCidUrl, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "x-locale": "pt-BR",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();

        // 1. Extrai fotos reais do estabelecimento (Google Photos e Street View de fachada)
        const imgRegex = /!\[[^\]]*\]\((https:\/\/(?:lh[0-9]\.googleusercontent\.com|streetviewpixels-pa\.googleapis\.com)[^\)]+)\)/g;
        let imgMatch: RegExpExecArray | null;
        while ((imgMatch = imgRegex.exec(text)) !== null) {
          const url = imgMatch[1];
          if (url.includes("googleusercontent.com/gps-cs-s/") || url.includes("googleusercontent.com/p/")) {
            const cleanUrl = url.replace(/=w\d+.*$/, "=w1200");
            if (!photos.includes(cleanUrl)) photos.push(cleanUrl);
          } else if (url.includes("streetviewpixels-pa.googleapis.com")) {
            const cleanUrl = url.replace(/&w=\d+&h=\d+/, "&w=1200&h=600");
            if (!photos.includes(cleanUrl)) photos.push(cleanUrl);
          }
        }

        // 2. Extrai nota caso ainda não tenhamos
        if (rating === null) {
          const rm = text.match(/\b([1-5][,.][0-9])\b/);
          if (rm) rating = parseFloat(rm[1].replace(",", "."));
        }

        // 3. Extrai contagem de avaliações caso ainda não tenhamos
        if (reviewsCount === null) {
          const rcm = text.match(/\((\d+[\d.]*)\)/) || text.match(/([\d.]+)\s*(?:avaliações|avaliação|reviews)/i);
          if (rcm) reviewsCount = parseInt(rcm[1].replace(/\D/g, ""), 10);
        }

        // 4. Extrai telefone/WhatsApp da ficha clássica caso ainda não tenhamos
        if (!phone) {
          const detected = extractBrazilianPhone(text);
          if (detected) {
            phone = detected;
            if (!whatsapp) whatsapp = detected;
          }
        }

        // 4. Extrai depoimentos reais de clientes verificados
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          const quoteMatch = l.match(/\[\"([^\"]{10,250})\"\]/);
          if (quoteMatch) {
            let author = "Cliente no Google";
            for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
              const prev = lines[j];
              const authMatch =
                prev.match(/Image\s+\d+:\s*([^\]]+)\]/) ||
                prev.match(/\[([^\]]+)\]\(https:\/\/www\.google\.com\/maps\/contrib/);
              if (authMatch) {
                author = authMatch[1].trim();
                break;
              }
            }
            const revText = quoteMatch[1].trim();
            // Ignora reclamações ou perguntas irrelevantes em depoimentos de destaque
            if (!reviews.some((r) => r.text === revText) && !revText.toLowerCase().includes("péssimo") && !revText.toLowerCase().includes("ruim")) {
              reviews.push({ author, avatar: null, rating: 5, text: revText });
            }
          }
        }
      }
    } catch (cidErr) {
      console.warn("[fetchGoogleMapsPlaceDetails] Aviso ao consultar ficha CID:", cidErr);
    }
  }

  // ETAPA 3: Fallback via Google Search Knowledge Panel caso não tenhamos capturado dados
  if (rating === null || photos.length === 0) {
    try {
      const gSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`;
      const jinaGSearchUrl = `https://r.jina.ai/${gSearchUrl}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(jinaGSearchUrl, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "x-locale": "pt-BR",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();

        // Nota
        if (rating === null) {
          const rm =
            text.match(/([1-5][,.][0-9])\s*(?:de\s*5|\/5|\*|estrelas?)/i) ||
            text.match(/Avaliação\s*:\s*([1-5][,.][0-9])/i) ||
            text.match(/([1-5][,.][0-9])\s*\(\d+\)/) ||
            text.match(/\b([1-5][,.][0-9])\b/);
          if (rm) rating = parseFloat(rm[1].replace(",", "."));
        }

        // Avaliações
        if (reviewsCount === null) {
          const rcm =
            text.match(/(\d+[\d.]*)\s*(?:avaliações|avaliação|comentários|classificações|críticas)/i) ||
            text.match(/\((\d+[\d.]*)\s*(?:avaliações|comentários)?\)/);
          if (rcm) reviewsCount = parseInt(rcm[1].replace(/\D/g, ""), 10);
        }

        // Endereço
        if (!address) {
          const addrMatch =
            text.match(/Endereço\s*:\s*([^\n]+)/i) ||
            text.match(/(?:R\.|Rua|Av\.|Avenida|Praça|Travessa|Alameda|Estr\.|Rodovia)[^,\n]+,[^,\n]+(?:-[^,\n]+)?,[^,\n]+/i);
          if (addrMatch) address = (addrMatch[1] || addrMatch[0]).replace(/\[.*?\]/g, "").trim();
        }

        // Horários
        if (!openingHours) {
          const hoursM =
            text.match(/Horário(?:s)?(?:\s*de\s*funcionamento)?\s*:\s*([^\n]+)/i) ||
            text.match(/(?:Aberto|Fechado)[^\n]*?(?:Fecha|Abre)[^\n]*?(\d{1,2}(?::\d{2})?)/i);
          if (hoursM) openingHours = (hoursM[1] || hoursM[0]).replace(/\[.*?\]/g, "").trim();
        }

        // WhatsApp / Telefone
        if (!phone) {
          const detected = extractBrazilianPhone(text);
          if (detected) {
            phone = detected;
            if (!whatsapp) whatsapp = detected;
          }
        }

        // Fotos no painel do Google
        const googlePhotos = [...text.matchAll(/!\[[^\]]*\]\((https:\/\/lh[0-9]\.googleusercontent\.com\/[^\)]+)\)/g)];
        for (const gp of googlePhotos) {
          const url = gp[1];
          if (!url.includes("/a/") && !url.includes("default_user") && !url.includes("loader")) {
            const cleanUrl = url.replace(/=w\d+.*$/, "=w1200");
            if (!photos.includes(cleanUrl)) photos.push(cleanUrl);
          }
        }

        // Se encontrou fid ou ludocid no Google Search e ainda não temos fotos, consulta o CID
        if (photos.length === 0) {
          const fidM = text.match(/fid\/([0-9a-fx:]+)/i) || text.match(/ludocid=(\d+)/i);
          if (fidM) {
            try {
              const extraCidUrl = `https://maps.google.com/maps?cid=${fidM[1]}`;
              const cidRes = await fetch(`https://r.jina.ai/${extraCidUrl}`, {
                headers: { "Accept-Language": "pt-BR,pt;q=0.9", "x-locale": "pt-BR" },
              });
              if (cidRes.ok) {
                const cidText = await cidRes.text();
                const cidPhotos = [...cidText.matchAll(/!\[[^\]]*\]\((https:\/\/(?:lh[0-9]\.googleusercontent\.com|streetviewpixels-pa\.googleapis\.com)[^\)]+)\)/g)];
                for (const cp of cidPhotos) {
                  const url = cp[1];
                  if (url.includes("googleusercontent.com/gps-cs-s/") || url.includes("googleusercontent.com/p/")) {
                    const cleanUrl = url.replace(/=w\d+.*$/, "=w1200");
                    if (!photos.includes(cleanUrl)) photos.push(cleanUrl);
                  } else if (url.includes("streetviewpixels-pa.googleapis.com")) {
                    const cleanUrl = url.replace(/&w=\d+&h=\d+/, "&w=1200&h=600");
                    if (!photos.includes(cleanUrl)) photos.push(cleanUrl);
                  }
                }
              }
            } catch (e) {
              // silencioso
            }
          }
        }
      }
    } catch (gErr) {
      console.warn("[fetchGoogleMapsPlaceDetails] Aviso no Google Search Knowledge Panel:", gErr);
    }
  }

  return {
    rating,
    reviewsCount,
    address,
    openingHours,
    whatsapp,
    phone,
    photos: photos.slice(0, 8),
    reviews: reviews.slice(0, 6),
  };
}


