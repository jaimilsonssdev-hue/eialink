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
  if (!raw) return "";
  return raw
    .replace(/https?:\/\/[^\s]+/gi, "") // Remove qualquer URL embutida
    .replace(/[#?].*$/, "")             // Remove hashes e query strings restantes
    .replace(/@[-0-9.,zZ+]+/gi, "")     // Remove coordenadas de zoom do Maps (@-17.5342921,-39.7397753,17z)
    .replace(/\b(?:entry|g_ep|shorturl|g_st|hl|gl|ved|sa)=[^&\s]+/gi, "") // Remove parâmetros de tracking
    .replace(/\s{2,}/g, " ")
    .replace(/^["'\s\-–|:]+|["'\s\-–|:]+$/g, "")
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

  // Decodifica componentes codificados imediatamente (ex: Ateli%C3%AA+J%C3%A9ssica -> Ateliê Jéssica)
  const decodedInput = decodePlus(trimmed);

  const isLink =
    /^https?:\/\//i.test(trimmed) ||
    /^(www\.)?(google\.[a-z.]+|maps\.app\.goo\.gl|g\.co)\//i.test(trimmed) ||
    /\/maps\/place\//i.test(trimmed);

  if (!isLink) {
    const { name, city } = splitCity(cleanName(decodedInput));
    return { name, city, query: [name, city].filter(Boolean).join(" "), fromLink: false };
  }

  const url = decodedInput.startsWith("http") ? decodedInput : `https://${decodedInput}`;
  let extracted = "";

  // 1. /maps/place/Nome+Do+Negocio ou /maps/place/Nome/@...
  const placeMatch = url.match(/\/maps\/place\/([^/?#]+)/i);
  if (placeMatch) {
    let segment = placeMatch[1];
    if (segment.includes("@")) {
      segment = segment.split("@")[0];
    }
    extracted = cleanName(segment);
  }

  // 2. /maps/search/Nome
  if (!extracted) {
    const searchPath = url.match(/\/maps\/search\/([^/?#]+)/i);
    if (searchPath) {
      let segment = searchPath[1];
      if (segment.includes("@")) segment = segment.split("@")[0];
      extracted = cleanName(segment);
    }
  }

  // 3. Parâmetro q= ou query= (busca do celular, busca do Maps, links encurtados expandidos)
  if (!extracted) {
    const qMatch = url.match(/[?&](?:q|query)=([^&#]+)/i);
    if (qMatch) extracted = cleanName(qMatch[1]);
  }

  // 4. Se a URL veio acompanhada de texto antes ou depois (ex: "Ateliê Jéssica https://maps.app.goo.gl/...")
  if (!extracted) {
    const textWithoutUrl = cleanName(decodedInput);
    if (textWithoutUrl && !/^https?:/i.test(textWithoutUrl) && textWithoutUrl.length >= 3) {
      extracted = textWithoutUrl;
    }
  }

  // 5. Último recurso: qualquer parâmetro textual que não seja rastreador
  if (!extracted) {
    const params = [...url.matchAll(/[?&]([a-z_]+)=([^&#]+)/gi)];
    for (const [, key, value] of params) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) continue;
      const candidate = cleanName(value);
      if (/[A-Za-zÀ-ÿ]{3,}/.test(candidate) && !/^https?:/i.test(candidate)) {
        extracted = candidate;
        break;
      }
    }
  }

  // REGRA CRÍTICA: Nunca permitir que uma URL HTTP/HTTPS seja considerada nome
  if (/^https?:\/\//i.test(extracted) || /^www\./i.test(extracted)) {
    extracted = "";
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

