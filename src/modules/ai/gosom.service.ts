import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";
import type { FetchedBusinessData } from "./copilot.functions";

const execFileAsync = promisify(execFile);

interface GosomAddress {
  borough?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country_code?: string;
}

interface GosomReview {
  Name?: string;
  Rating?: number;
  Description?: string;
  Images?: string[];
}

interface GosomResultItem {
  title?: string;
  category?: string;
  phone?: string;
  address?: string;
  complete_address?: GosomAddress;
  review_rating?: number;
  review_count?: number;
  description?: string;
  thumbnail?: string;
  photos?: string[];
  user_reviews?: GosomReview[];
}

function getBinaryPath(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), "tools", "google_maps_scraper.exe"),
    path.resolve(process.cwd(), "tools", "google_maps_scraper"),
    path.resolve(process.cwd(), "..", "tools", "google_maps_scraper.exe"),
    path.resolve(process.cwd(), "eialink", "tools", "google_maps_scraper.exe"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function resolveQueryFromUrl(raw: string): Promise<string> {
  let target = raw.trim();

  // Expande links encurtados do Google Maps (maps.app.goo.gl ou goo.gl/maps)
  if (target.includes("maps.app.goo.gl") || target.includes("goo.gl/maps")) {
    try {
      const res = await fetch(target, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(7000),
      });
      if (res.url && res.url !== target) {
        target = res.url;
      }
    } catch (e) {
      console.warn("[GosomService] Aviso ao expandir link curto:", e);
    }
  }

  // 1. Extrai nome do path /maps/place/<nome>/
  const placeMatch = target.match(/\/maps\/place\/([^/@?&]+)/i);
  if (placeMatch && placeMatch[1]) {
    const decoded = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
    if (decoded && !decoded.startsWith("@") && !decoded.toLowerCase().includes("google")) {
      return decoded;
    }
  }

  // 2. Extrai da query ?q=<nome>
  const qMatch = target.match(/[?&]q=([^&]+)/i);
  if (qMatch && qMatch[1]) {
    const decoded = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
    if (decoded && !decoded.startsWith("@") && !decoded.toLowerCase().includes("google")) {
      return decoded;
    }
  }

  // 3. Extrai de /maps/search/<nome>/
  const searchMatch = target.match(/\/maps\/search\/([^/@?&]+)/i);
  if (searchMatch && searchMatch[1]) {
    const decoded = decodeURIComponent(searchMatch[1]).replace(/\+/g, " ").trim();
    if (decoded && !decoded.startsWith("@") && !decoded.toLowerCase().includes("google")) {
      return decoded;
    }
  }

  // Se não for URL, é o próprio termo
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    return target;
  }

  return target;
}

async function processPhotos(
  place: GosomResultItem,
  supabaseAdmin?: any,
  userId = "maps-assets",
): Promise<FetchedBusinessData["importedImages"]> {
  const photoUrls = new Set<string>();

  if (place.thumbnail && place.thumbnail.startsWith("http")) {
    photoUrls.add(place.thumbnail);
  }

  if (Array.isArray(place.photos)) {
    for (const p of place.photos) {
      if (typeof p === "string" && p.startsWith("http")) photoUrls.add(p);
    }
  }

  if (Array.isArray(place.user_reviews)) {
    for (const r of place.user_reviews) {
      if (Array.isArray(r.Images)) {
        for (const img of r.Images) {
          if (typeof img === "string" && img.startsWith("http")) {
            photoUrls.add(img);
          }
        }
      }
    }
  }

  const candidateList = Array.from(photoUrls).slice(0, 8);
  const importedImages: NonNullable<FetchedBusinessData["importedImages"]> = [];

  for (let i = 0; i < candidateList.length; i++) {
    const rawUrl = candidateList[i];
    let highResUrl = rawUrl;
    if (rawUrl.includes("googleusercontent.com")) {
      highResUrl = rawUrl.replace(/=(?:w\d+-h\d+.*|s\d+.*|p-.*)$/, "=w1200-h800-k-no");
    }

    try {
      let imgRes: Response | null = null;
      let finalFetchUrl = highResUrl;
      try {
        imgRes = await fetch(highResUrl, { signal: AbortSignal.timeout(10000) });
      } catch {
        imgRes = await fetch(rawUrl, { signal: AbortSignal.timeout(10000) });
        finalFetchUrl = rawUrl;
      }

      if (imgRes && imgRes.ok) {
        const mime = imgRes.headers.get("content-type") || "image/jpeg";
        const buf = await imgRes.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        let publicUrl = finalFetchUrl;

        if (supabaseAdmin) {
          try {
            const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
            const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabaseAdmin.storage
              .from("bio-media")
              .upload(storagePath, Buffer.from(buf), {
                contentType: mime,
                upsert: true,
              });
            if (!upErr) {
              const { data: pubData } = supabaseAdmin.storage
                .from("bio-media")
                .getPublicUrl(storagePath);
              if (pubData?.publicUrl) {
                publicUrl = pubData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn("[GosomService] Erro ao persistir foto no storage:", storageErr);
          }
        }

        importedImages.push({
          name: `maps-foto-${i + 1}.jpg`,
          mimeType: mime,
          base64: `data:${mime};base64,${b64}`,
          publicUrl,
          role: i === 0 ? "cover" : i < 3 ? "product" : "general",
        });
      }
    } catch (e) {
      console.warn(`[GosomService] Aviso ao processar foto ${i + 1}:`, e);
    }
  }

  return importedImages;
}

function formatGosomBriefing(place: GosomResultItem, importedImagesCount: number): string {
  const city = place.complete_address?.city
    ? `${place.complete_address.city}${place.complete_address.state ? ` - ${place.complete_address.state}` : ""}`
    : undefined;

  const reviewsSnippet = (place.user_reviews || [])
    .slice(0, 4)
    .filter((r) => r.Description && r.Description.trim().length > 10)
    .map((r) => `"${r.Description?.trim()}" (${r.Name || "Cliente"}, ${r.Rating || 5}★)`)
    .join("\n\n");

  return `[DADOS REAIS E CONFIRMADOS DO GOOGLE MAPS / GOOGLE MEU NEGÓCIO]:
- Nome Comercial Oficial: ${place.title || "Empresa"}
${place.category ? `- Nicho / Ramo de Atuação: ${place.category}\n` : ""}${
    place.phone ? `- Telefone / WhatsApp: ${place.phone}\n` : ""
  }${place.address ? `- Endereço Físico Completo: ${place.address}\n` : ""}${
    city ? `- Cidade / Região: ${city}\n` : ""
  }${
    place.review_rating
      ? `- Avaliação dos Clientes: ${place.review_rating} estrelas no Google Maps ⭐ (${place.review_count ?? 0} avaliações reais)\n`
      : ""
  }${
    place.description ? `- Descrição / Diferenciais: ${place.description}\n` : ""
  }${
    importedImagesCount > 0
      ? `- Fotos Reais Obtidas: ${importedImagesCount} fotos em alta resolução do estabelecimento e produtos.\n`
      : ""
  }
Depoimentos Reais de Clientes:
${reviewsSnippet || "Avaliações positivas de clientes no Google."}

DIRETRIZ CRÍTICA PARA A IA:
Estes são os dados OFICIAIS e REAIS da empresa do cliente acima. Substitua integralmente qualquer informação de empresas anteriores ou perfis pessoais. Construa o site, textos de autoridade, serviços e prova social exclusivamente baseados nesta empresa.`;
}

export async function runGosomScraper(
  queryOrUrl: string,
  context?: any,
): Promise<FetchedBusinessData | null> {
  const binaryPath = getBinaryPath();
  if (!binaryPath) {
    console.warn("[GosomService] Binário google_maps_scraper não encontrado no ambiente. Usando fallback HTTP.");
    return null;
  }

  const resolvedQuery = await resolveQueryFromUrl(queryOrUrl);
  if (!resolvedQuery || resolvedQuery.length < 2) {
    console.warn("[GosomService] Não foi possível resolver um termo de busca válido a partir de:", queryOrUrl);
    return null;
  }

  const randomId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tmpIn = path.join(os.tmpdir(), `gosom_in_${randomId}.txt`);
  const tmpOut = path.join(os.tmpdir(), `gosom_out_${randomId}.json`);

  try {
    fs.writeFileSync(tmpIn, resolvedQuery.trim(), "utf8");

    console.log(`[GosomService] Executando scraper nativo para termo: "${resolvedQuery.trim()}"`);

    const args = [
      "-input", tmpIn,
      "-results", tmpOut,
      "-json",
      "-depth", "1",
      "-lang", "pt",
      "-c", "1",
    ];

    await execFileAsync(binaryPath, args, {
      timeout: 75000,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!fs.existsSync(tmpOut)) {
      console.warn("[GosomService] Arquivo de resultados não foi gerado.");
      return null;
    }

    const rawOutput = fs.readFileSync(tmpOut, "utf8").trim();
    if (!rawOutput) {
      console.warn("[GosomService] Arquivo de resultados vazio.");
      return null;
    }

    let place: GosomResultItem | null = null;
    try {
      const parsed = JSON.parse(rawOutput);
      place = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      // Formato NDJSON (JSON Lines): seleciona o primeiro objeto valido
      const firstValidLine = rawOutput
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.startsWith("{") && l.endsWith("}"));
      if (firstValidLine) {
        place = JSON.parse(firstValidLine);
      }
    }

    if (!place || !place.title) {
      console.warn("[GosomService] Nenhum local retornado no JSON.");
      return null;
    }

    const supabaseAdmin = context?.supabase;
    const userId = context?.userId || "gosom-assets";

    const importedImages = await processPhotos(place, supabaseAdmin, userId);

    const city = place.complete_address?.city
      ? `${place.complete_address.city}${place.complete_address.state ? ` - ${place.complete_address.state}` : ""}`
      : undefined;

    const formattedBriefing = formatGosomBriefing(place, importedImages?.length || 0);

    return {
      source: "google_maps",
      name: place.title,
      niche: place.category,
      city: city || place.address,
      phone: place.phone,
      address: place.address,
      rating: place.review_rating ? Number(place.review_rating) : undefined,
      reviewsCount: place.review_count ? Number(place.review_count) : undefined,
      formattedBriefing,
      importedImages,
    };
  } catch (err: any) {
    console.error("[GosomService] Erro ao executar scraper local:", err?.message || err);
    return null;
  } finally {
    try {
      if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    } catch {}
    try {
      if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    } catch {}
  }
}