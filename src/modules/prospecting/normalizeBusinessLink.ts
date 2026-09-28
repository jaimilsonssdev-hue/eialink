/**
 * Normaliza qualquer coisa que o usuário cole no campo de busca:
 * - link do app Google Maps (maps.app.goo.gl)
 * - link tradicional do Maps (google.com/maps/place/... ou ?q=...)
 * - link de BUSCA do Google copiado do celular (google.com/search?...&q=Nome...)
 * - texto simples ("Ateliê Jéssica G em Teixeira de Freitas")
 *
 * O Google bloqueia a leitura direta de URLs de busca móvel (tráfego incomum),
 * por isso extraímos apenas o nome do negócio e consultamos o Maps por ele.
 */

const TRACKING_PARAMS = new Set([
  "num", "client", "hs", "sca_esv", "cs", "sxsrf", "si", "hl", "sa", "ved",
  "biw", "bih", "dpr", "source", "ei", "oq", "gs_lp", "sclient", "uact",
  "entry", "g_ep", "shorturl", "utm_source", "utm_medium", "utm_campaign",
]);

export interface NormalizedBusinessQuery {
  /** Nome do negócio, já limpo */
  name: string;
  /** Cidade, quando detectada no texto */
  city: string;
  /** Consulta completa pronta para o Maps */
  query: string;
  /** true quando a entrada era uma URL do Google */
  fromLink: boolean;
}

function decodePlus(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value.replace(/\+/g, " ");
  }
}

function cleanName(raw: string): string {
  return raw
    .replace(/[#?].*$/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .slice(0, 120)
    .trim();
}

function splitCity(text: string): { name: string; city: string } {
  const match = text.match(/^(.+?)\s+(?:em|na|no|-|–|\|)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{2,40})$/i);
  if (match) {
    return { name: match[1].trim(), city: match[2].trim() };
  }
  return { name: text, city: "" };
}

export function normalizeBusinessQuery(input: string): NormalizedBusinessQuery {
  const trimmed = (input || "").trim();
  if (!trimmed) return { name: "", city: "", query: "", fromLink: false };

  const isLink = /^https?:\/\//i.test(trimmed) || /^(www\.)?(google\.[a-z.]+|maps\.app\.goo\.gl|g\.co)\//i.test(trimmed);

  if (!isLink) {
    const { name, city } = splitCity(cleanName(trimmed));
    return { name, city, query: [name, city].filter(Boolean).join(" "), fromLink: false };
  }

  const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let extracted = "";

  // 1. /maps/place/Nome+Do+Negocio
  const placeMatch = url.match(/\/maps\/place\/([^/@?#]+)/i);
  if (placeMatch) extracted = decodePlus(placeMatch[1]);

  // 2. /maps/search/Nome
  if (!extracted) {
    const searchPath = url.match(/\/maps\/search\/([^/@?#]+)/i);
    if (searchPath) extracted = decodePlus(searchPath[1]);
  }

  // 3. Parâmetro q= (busca do celular, busca do Maps, links encurtados expandidos)
  if (!extracted) {
    const qMatch = url.match(/[?&]q=([^&#]+)/i);
    if (qMatch) extracted = decodePlus(qMatch[1]);
  }

  // 4. Parâmetro query= (Maps api=1)
  if (!extracted) {
    const queryMatch = url.match(/[?&]query=([^&#]+)/i);
    if (queryMatch) extracted = decodePlus(queryMatch[1]);
  }

  // 5. Último recurso: qualquer parâmetro textual que não seja rastreador
  if (!extracted) {
    const params = [...url.matchAll(/[?&]([a-z_]+)=([^&#]+)/gi)];
    for (const [, key, value] of params) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) continue;
      const candidate = decodePlus(value);
      if (/[A-Za-zÀ-ÿ]{3,}/.test(candidate) && !/^https?:/i.test(candidate)) {
        extracted = candidate;
        break;
      }
    }
  }

  const { name, city } = splitCity(cleanName(extracted));
  return {
    name,
    city,
    query: [name, city].filter(Boolean).join(" "),
    fromLink: true,
  };
}

/** Atalho: devolve só a consulta pronta (ou o texto original quando nada foi extraído). */
export function toBusinessSearchQuery(input: string): string {
  const result = normalizeBusinessQuery(input);
  return result.query || cleanName(input || "");
}

/** Compatibilidade e atalho para o extrator universal de links de negócio */
export function normalizeBusinessLink(input: string) {
  const q = normalizeBusinessQuery(input);
  return {
    searchTerm: q.query || q.name,
    suggestedCity: q.city,
    ...q,
  };
}

