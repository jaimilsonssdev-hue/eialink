import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchGoogleMapsPlaceDetails,
  type GoogleMapsPlaceDetails,
} from "@/modules/prospecting/LiveProspectingEngine";
import { resolvePlacesApiKey } from "@/modules/prospecting/places-admin.functions";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const DIRECT_URL = "https://places.googleapis.com";


const SAFE_TEXT = /^[\p{L}\p{N}\s.,'&()\-/ºª+]{2,120}$/u;

function sanitize(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 120);
  return SAFE_TEXT.test(trimmed) ? trimmed : trimmed.replace(/[^\p{L}\p{N}\s.,'&()\-/]/gu, "").slice(0, 120);
}

interface PlacesPhoto {
  name?: string;
}

interface PlacesReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; photoUri?: string };
}

interface PlacesResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: PlacesPhoto[];
  reviews?: PlacesReview[];
}

interface PlacesTransport {
  base: string;
  headers: (fieldMask?: string) => Record<string, string>;
}

/**
 * Define como falar com a Places API:
 * 1º) chave própria salva no painel Super Admin (funciona em qualquer domínio);
 * 2º) conexão gerenciada da Lovable (apenas em previews *.lovable.app).
 */
async function resolveTransport(): Promise<PlacesTransport | null> {
  const ownKey = await resolvePlacesApiKey();
  if (ownKey) {
    return {
      base: DIRECT_URL,
      headers: (fieldMask?: string) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": ownKey,
        };
        if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
        return headers;
      },
    };
  }

  const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey || !lovableKey) return null;

  return {
    base: `${GATEWAY_URL}/places`,
    headers: (fieldMask?: string) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apiKey,
        "Content-Type": "application/json",
      };
      if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
      return headers;
    },
  };
}

/**
 * Resolve as fotos reais (URL pública) da ficha oficial do Google Places.
 */
async function resolvePhotoUrls(
  photos: PlacesPhoto[],
  transport: PlacesTransport,
  limit = 6,
): Promise<string[]> {
  const urls: string[] = [];
  for (const photo of photos.slice(0, limit)) {
    if (!photo?.name) continue;
    try {
      const res = await fetch(
        `${transport.base}/v1/${photo.name}/media?maxWidthPx=1200&skipHttpRedirect=true`,
        { headers: transport.headers() },
      );
      if (!res.ok) {
        console.warn(`[places] Foto indisponível [${res.status}]: ${await res.text()}`);
        continue;
      }
      const body = (await res.json()) as { photoUri?: string };
      if (body?.photoUri) urls.push(body.photoUri);
    } catch (err) {
      console.warn("[places] Falha ao resolver foto:", err);
    }
  }
  return urls;
}

/**
 * Busca a ficha oficial do estabelecimento via Google Places API (New).
 * Retorna null quando não há chave configurada ou não há correspondência.
 */
export async function fetchOfficialPlaceDetails(
  companyName: string,
  city?: string | null,
): Promise<(GoogleMapsPlaceDetails & { source: "google_places" }) | null> {
  const transport = await resolveTransport();
  if (!transport) return null;

  const normalized = normalizeBusinessQuery(companyName || "");
  const textQuery = [
    sanitize(normalized.name || companyName),
    sanitize(city || normalized.city),
  ].filter(Boolean).join(" ");
  if (!textQuery) return null;

  const searchRes = await fetch(`${transport.base}/v1/places:searchText`, {
    method: "POST",
    headers: transport.headers(
      "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount",
    ),
    body: JSON.stringify({ textQuery, languageCode: "pt-BR", regionCode: "BR", pageSize: 1 }),
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    console.error(`[places] Busca falhou [${searchRes.status}]: ${errorBody}`);
    return null;
  }

  const searchBody = (await searchRes.json()) as { places?: PlacesResult[] };
  const match = searchBody.places?.[0];
  if (!match?.id) return null;

  const detailsRes = await fetch(`${transport.base}/v1/places/${match.id}?languageCode=pt-BR`, {
    headers: transport.headers(
      "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,rating,userRatingCount,regularOpeningHours.weekdayDescriptions,photos,reviews",
    ),
  });

  if (!detailsRes.ok) {
    const errorBody = await detailsRes.text();
    console.error(`[places] Detalhes falharam [${detailsRes.status}]: ${errorBody}`);
    return null;
  }

  const details = (await detailsRes.json()) as PlacesResult;

  const phoneDigits = (details.nationalPhoneNumber || details.internationalPhoneNumber || "").replace(/\D/g, "");
  const photos = await resolvePhotoUrls(details.photos ?? [], transport);

  const reviews = (details.reviews ?? [])
    .filter((r) => (r.text?.text || r.originalText?.text || "").trim().length > 0)
    .slice(0, 5)
    .map((r) => ({
      author: r.authorAttribution?.displayName?.trim() || "Cliente Google",
      avatar: r.authorAttribution?.photoUri || null,
      rating: typeof r.rating === "number" ? r.rating : 5,
      text: (r.text?.text || r.originalText?.text || "").trim().slice(0, 400),
    }));

  return {
    source: "google_places",
    rating: typeof details.rating === "number" ? details.rating : null,
    reviewsCount: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
    address: details.formattedAddress || null,
    openingHours: details.regularOpeningHours?.weekdayDescriptions?.join(" · ") || null,
    whatsapp: phoneDigits ? (phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`) : null,
    phone: details.nationalPhoneNumber || null,
    photos,
    reviews,
  };
}


/**
 * Ponto único de coleta de dados reais do estabelecimento.
 * 1º: Google Places oficial (dados verificados). 2º: leitura pública como reserva.
 */
export const fetchPlaceDetailsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companyName: string; city?: string | null; cid?: string | null }) => {
    const companyName = sanitize(data?.companyName);
    if (!companyName) throw new Error("Nome do negócio inválido.");
    return {
      companyName,
      city: sanitize(data?.city) || null,
      cid: typeof data?.cid === "string" ? data.cid.slice(0, 64) : null,
    };
  })
  .handler(async ({ data }) => {
    try {
      const official = await fetchOfficialPlaceDetails(data.companyName, data.city);
      if (official && (official.rating !== null || official.address || official.photos.length > 0)) {
        return official;
      }
    } catch (err) {
      console.warn("[places] Consulta oficial indisponível:", err);
    }

    const fallback = await fetchGoogleMapsPlaceDetails(data.companyName, data.city, data.cid);
    return { ...fallback, source: "public_reader" as const };
  });
