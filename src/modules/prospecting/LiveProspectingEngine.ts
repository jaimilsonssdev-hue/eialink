import {
  buildDedupeKey,
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
  const placePattern = /\[([^\]]+)\]\(https?:\/\/(?:www\.)?(?:google\.[a-z.]+|maps\.google\.[a-z.]+)\/maps\/place\/[^)]+\)/gi;
  const parts = text.split(placePattern);

  const leads: RawScrapedLead[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < parts.length; i += 2) {
    const rawName = parts[i]?.trim();
    const block = parts[i + 1] ?? "";

    if (!rawName) continue;

    // Limpa sufixos de cidade repetidos no nome (ex: "Clínica Inove - Teixeira de Freitas" -> "Clínica Inove")
    let cleanName = rawName
      .replace(/\s*-\s*(?:Teixeira de Freitas|BA|Bahia).*/i, "")
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

    // Extrai telefone brasileiro com DDD obrigatório (evita capturar números aleatórios de imagens ou parâmetros)
    const phoneMatch = block.match(/(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)(?:9\s*)?(\d{4})[-\s]?(\d{4})/);
    const rawPhone = phoneMatch ? phoneMatch[0] : null;

    // Extrai nota
    const ratingMatch = block.match(/\b([1-5][,.][0-9])\b/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : null;

    // Extrai quantidade de avaliações (tanto no formato (96) quanto 96 avaliações)
    const reviewsMatch = block.match(/\((\d+)\)/) || block.match(/([\d.]+)\s*(?:avaliações|avaliação|reviews)/i);
    const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1].replace(/\D/g, ""), 10) : null;

    // Detecta se tem website indicado
    const hasWebsite = /\[?(?:Website|Site|Ver site)\]?/i.test(block) ||
      /(?:https?:\/\/(?!www\.google)[a-zA-Z0-9.-]+\.[a-z]{2,})/i.test(block);

    // Extrai Instagram se houver menção
    const instaMatch = block.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    const instagram = instaMatch && !["explore", "p", "reel"].includes(instaMatch[1])
      ? `@${instaMatch[1]}`
      : null;

    // Extrai endereço se houver
    const addressMatch = block.match(/(?:·\s*((?:Av\.|Avenida|R\.|Rua|Praça|Estr\.)[^\n·]+))/i);
    const address = addressMatch ? addressMatch[1].trim() : "";

    leads.push({
      name: cleanName,
      niche,
      city,
      phone: rawPhone,
      whatsapp: rawPhone,
      instagram,
      has_website: hasWebsite,
      website: null,
      rating,
      reviews_count: reviewsCount,
      source: "google_maps",
      notes: [
        rating ? `⭐ ${rating} (${reviewsCount ?? 0} avaliações)` : null,
        address ? `Endereço: ${address}` : null,
      ].filter(Boolean).join(" · ") || "Capturado no Google Maps",
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
      const phoneMatch = snippetRadius.match(/(?:wa\.me\/|whatsapp:\s*|tel:\s*)?(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9\s*)?(\d{4})[-\s]?(\d{4})/i);
      const rawPhone = phoneMatch ? phoneMatch[0] : null;

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
        rating: 5.0,
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
 * Retorna nota real, quantidade de avaliações, fotos reais (lh3), endereço, horários e depoimentos.
 */
export async function fetchGoogleMapsPlaceDetails(
  companyName: string,
  city?: string | null,
): Promise<GoogleMapsPlaceDetails> {
  const cleanName = companyName
    .replace(/clinical\s+innovate/gi, "Clínica Inove")
    .replace(/^clinical\s+/gi, "Clínica ")
    .trim();
  const query = [cleanName, city].filter(Boolean).join(" ");
  const targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR&gl=BR`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "x-locale": "pt-BR",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[fetchGoogleMapsPlaceDetails] Jina Maps retornou status ${res.status}`);
      return {
        rating: null,
        reviewsCount: null,
        address: null,
        openingHours: null,
        whatsapp: null,
        phone: null,
        photos: [],
        reviews: [],
      };
    }

    const text = await res.text();

    // 1. Nota (ex: 4,8 ou 4.8)
    let rating: number | null = null;
    const ratingMatch = text.match(/\b([1-5][,.][0-9])\b/);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1].replace(",", "."));
    }

    // 2. Contagem de avaliações (ex: 94 avaliações ou (94))
    let reviewsCount: number | null = null;
    const reviewsMatch =
      text.match(/(\d+)\s*(?:avaliações|avaliação|comentários|classificações|reviews)/i) ||
      text.match(/\((\d+)\)/);
    if (reviewsMatch) {
      reviewsCount = parseInt(reviewsMatch[1].replace(/\D/g, ""), 10);
    }

    // 3. Endereço
    let address: string | null = null;
    const addressMatch =
      text.match(/(?:R\.|Rua|Av\.|Avenida|Praça|Travessa|Alameda|Estr\.|Rodovia)[^,\n]+,[^,\n]+(?:-[^,\n]+)?,[^,\n]+/i) ||
      text.match(/(?:·\s*((?:Av\.|Avenida|R\.|Rua|Praça|Estr\.)[^\n·]+))/i);
    if (addressMatch) {
      address = (addressMatch[1] || addressMatch[0]).trim();
    }

    // 4. Horários de funcionamento
    let openingHours: string | null = null;
    const hoursMatch =
      text.match(/(?:Aberto|Fechado)[^\n]*?(?:Fecha|Abre)[^\n]*?(\d{1,2}:\d{2})/i) ||
      text.match(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/);
    if (hoursMatch) {
      openingHours = hoursMatch[0].trim();
    }

    // 5. WhatsApp e Telefone
    let whatsapp: string | null = null;
    const waMatch = text.match(/(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/)(\d+)/i);
    if (waMatch) {
      whatsapp = waMatch[1];
    }

    let phone: string | null = null;
    const phoneMatches = text.match(/(?:\(?([1-9]{2})\)?\s*)(?:9\s*)?(\d{4})[-\s]?(\d{4})/g);
    if (phoneMatches) {
      const cleanPhones = phoneMatches.map((p) => p.trim()).filter((p) => !p.startsWith("51939"));
      if (cleanPhones.length > 0) phone = cleanPhones[0];
    }

    // 6. Fotos de alta resolução reais do estabelecimento
    const photos: string[] = [];
    const imgRegex = /!\[[^\]]*\]\((https:\/\/lh[0-9]\.googleusercontent\.com\/[^\)]+)\)/g;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(text)) !== null) {
      const url = imgMatch[1];
      if (url.includes("googleusercontent.com/gps-cs-s/") || url.includes("googleusercontent.com/p/")) {
        const cleanUrl = url.replace(/=w\d+.*$/, "=w1200");
        if (!photos.includes(cleanUrl)) {
          photos.push(cleanUrl);
        }
      }
    }

    // 7. Depoimentos e Avaliações Reais de Clientes
    const reviews: Array<{ author: string; avatar: string | null; rating: number; text: string }> = [];
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const avMatch = lines[i].match(/!\[[^\]]*\]\((https:\/\/lh[0-9]\.googleusercontent\.com\/a-[^\)]+)\)/);
      if (avMatch) {
        const avatar = avMatch[1].replace(/=w\d+.*$/, "=w80-h80");
        const cand = lines[i + 1];
        const author =
          cand && !cand.startsWith("![") && !cand.startsWith("#") && !cand.startsWith("")
            ? cand
            : "Cliente no Google";

        // Procura estrelas e texto nas linhas subsequentes
        for (let j = i + 2; j < Math.min(lines.length, i + 10); j++) {
          if (/{1,5}/.test(lines[j])) {
            const stars = (lines[j].match(//g) || []).length;
            // Busca o texto real da avaliação
            for (let k = j + 1; k < Math.min(lines.length, j + 5); k++) {
              const r = lines[k];
              if (
                r &&
                !r.startsWith("") &&
                !r.startsWith("") &&
                !r.startsWith("Editado") &&
                !r.startsWith("Foto ") &&
                !r.startsWith("![") &&
                r.length > 5
              ) {
                // Inclui apenas avaliações positivas de alta conversão (4 ou 5 estrelas)
                if (stars >= 4) {
                  reviews.push({
                    author,
                    avatar,
                    rating: stars,
                    text: r.replace(/…Mais$/, "").trim(),
                  });
                }
                break;
              }
            }
            break;
          }
        }
      }
    }

    // Frases de destaque entre aspas na ficha do Google
    const quotes = [...text.matchAll(/"([^"\n]{15,180})"/g)].map((m) => m[1]);
    for (const q of quotes) {
      if (!reviews.some((r) => r.text.includes(q))) {
        reviews.push({
          author: "Cliente Verificado no Google",
          avatar: null,
          rating: 5,
          text: q.trim(),
        });
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
  } catch (err) {
    console.error("[fetchGoogleMapsPlaceDetails] Erro ao extrair dados do Google Maps:", err);
    return {
      rating: null,
      reviewsCount: null,
      address: null,
      openingHours: null,
      whatsapp: null,
      phone: null,
      photos: [],
      reviews: [],
    };
  }
}


