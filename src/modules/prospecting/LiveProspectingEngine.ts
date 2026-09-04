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
  const targetUrl = `https://www.google.com/maps/search/${cleanQuery}`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
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
    const cleanName = rawName
      .replace(/\s*-\s*(?:Teixeira de Freitas|BA|Bahia).*/i, "")
      .replace(/\s*\|\s*.*/i, "")
      .trim();

    const normalizedKey = cleanName.toLowerCase();
    if (seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);

    // Extrai telefone brasileiro com DDD
    const phoneMatch = block.match(/(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9\s*)?(\d{4})[-\s]?(\d{4})/);
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
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout para não atrasar a busca principal

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
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

  // Prioriza oportunidades de alta conversão (sem site e com WhatsApp primeiro)
  return results.sort((a, b) => b.score - a.score);
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

