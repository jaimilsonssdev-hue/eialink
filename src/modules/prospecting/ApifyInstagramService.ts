/**
 * ApifyInstagramService.ts
 * 
 * Integração Oficial com a API do Apify para raspagem autêntica do Instagram:
 * - Busca perfil completo: nome real, biografia, telefone, categoria, avatar em alta definição
 * - Extrai fotos reais do feed (6 a 12 posts) em alta resolução
 * - Extrai legendas dos posts para identificar produtos, serviços e diferenciais
 * - Alimenta o Studio e a Esteira de Criação de Sites com o acervo visual autêntico do cliente
 */

export interface ApifyInstagramPost {
  id?: string;
  url?: string;
  imageUrl: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
}

export interface ApifyInstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  externalUrl?: string | null;
  profilePicUrl?: string | null;
  profilePicUrlHD?: string | null;
  followersCount?: number | null;
  postsCount?: number | null;
  businessCategory?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessAddress?: string | null;
  whatsapp?: string | null;
  photos: string[];
  posts: ApifyInstagramPost[];
  source: "apify" | "public_fallback";
}

export const APIFY_TOKEN_STORAGE = "eialink_apify_api_token";
export const APIFY_TOKEN_UPDATED_EVENT = "eialink:apify_token_updated";

/**
 * Obtém o token do Apify armazenado no navegador ou nas variáveis de ambiente.
 */
export function getSavedApifyToken(): string | null {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(APIFY_TOKEN_STORAGE);
    if (local && local.trim()) return local.trim();
  }
  const envToken = (import.meta as any).env?.VITE_APIFY_API_TOKEN;
  return envToken ? String(envToken).trim() : null;
}

/**
 * Salva o token do Apify no armazenamento local seguro do navegador.
 */
export function saveApifyToken(token: string): void {
  if (typeof window === "undefined") return;
  const clean = token.trim();
  if (clean) {
    localStorage.setItem(APIFY_TOKEN_STORAGE, clean);
  } else {
    localStorage.removeItem(APIFY_TOKEN_STORAGE);
  }
  window.dispatchEvent(new CustomEvent(APIFY_TOKEN_UPDATED_EVENT, { detail: { token: clean } }));
}

/**
 * Remove o token do Apify do armazenamento local.
 */
export function removeApifyToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(APIFY_TOKEN_STORAGE);
  window.dispatchEvent(new CustomEvent(APIFY_TOKEN_UPDATED_EVENT, { detail: { token: "" } }));
}

/**
 * Extrai o nome de usuário (handle) limpo a partir de qualquer formato de link ou arroba.
 * Ex: "https://www.instagram.com/clinicainove/?hl=pt-br" -> "clinicainove"
 * Ex: "@clinicainove" -> "clinicainove"
 * Ex: "clinicainove" -> "clinicainove"
 */
export function extractInstagramHandle(input: string): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/(?:https?:\/\/(?:www\.)?instagram\.com\/|@)([a-zA-Z0-9._]+)/i);
  if (urlMatch) {
    const handle = urlMatch[1].replace(/[/_.]+$/, "");
    if (!["explore", "p", "reel", "stories", "accounts", "direct"].includes(handle.toLowerCase())) {
      return handle;
    }
  }

  // Se já for apenas o handle sem arroba nem pontuação estranha
  if (/^[a-zA-Z0-9._]{3,30}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extrai número de telefone/WhatsApp a partir de texto (bio ou links de WhatsApp)
 */
function extractPhoneFromText(text?: string | null): string | null {
  if (!text) return null;

  // 1. Link wa.me ou api.whatsapp.com
  const waLinkMatch = text.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d{10,13})/i);
  if (waLinkMatch) return waLinkMatch[1];

  // 2. Número brasileiro formatado
  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/);
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 13) {
      return digits.startsWith("55") ? digits : `55${digits}`;
    }
  }

  return null;
}

/**
 * Consulta perfil e fotos do Instagram utilizando a API do Apify (Instagram Scraper).
 */
export async function fetchInstagramProfileViaApify(
  handleOrUrl: string,
  overrideToken?: string
): Promise<ApifyInstagramProfile | null> {
  const handle = extractInstagramHandle(handleOrUrl);
  if (!handle) return null;

  const token = (overrideToken || getSavedApifyToken() || "").trim();
  if (!token) {
    console.info("[ApifyInstagramService] Token do Apify não configurado. Use saveApifyToken() ou configure VITE_APIFY_API_TOKEN.");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s de tolerância para scraping

    // Actor oficial: apify/instagram-scraper
    // Endpoint síncrono que aguarda e retorna os itens do dataset em uma única requisição HTTP
    const endpoint = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=40`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        usernames: [handle],
        resultsLimit: 12,
        resultsType: "posts",
        searchType: "user",
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ApifyInstagramService] Resposta com erro ${response.status}:`, await response.text().catch(() => ""));
      return null;
    }

    const items = await response.json();
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    // Primeiro item com metadados do proprietário / perfil
    const firstItem = items[0] || {};
    const owner = firstItem.owner || {};

    const fullName = firstItem.ownerFullName || owner.fullName || firstItem.fullName || handle;
    const biography = firstItem.ownerBiography || firstItem.biography || owner.biography || "";
    const externalUrl = firstItem.externalUrl || owner.externalUrl || null;
    const profilePicHD = firstItem.ownerProfilePicUrlHD || firstItem.profilePicUrlHD || firstItem.profilePicUrl || owner.profilePicUrl || null;
    const followersCount = firstItem.ownerFollowersCount || firstItem.followersCount || owner.followersCount || null;
    const postsCount = firstItem.ownerPostsCount || firstItem.postsCount || null;
    const businessCategory = firstItem.businessCategoryName || firstItem.category || null;

    // Extrai fotos reais dos posts
    const photos: string[] = [];
    const posts: ApifyInstagramPost[] = [];

    for (const item of items) {
      const imgUrl = item.displayUrl || item.imageUrl || item.thumbnailUrl;
      if (imgUrl && typeof imgUrl === "string") {
        if (!photos.includes(imgUrl)) {
          photos.push(imgUrl);
        }

        posts.push({
          id: item.id || item.shortCode,
          url: item.url || (item.shortCode ? `https://instagram.com/p/${item.shortCode}` : undefined),
          imageUrl: imgUrl,
          caption: item.caption || "",
          likesCount: typeof item.likesCount === "number" ? item.likesCount : undefined,
          commentsCount: typeof item.commentsCount === "number" ? item.commentsCount : undefined,
          timestamp: item.timestamp,
        });
      }

      // Se for post carrossel (sidecar), extrai as fotos filhas
      if (Array.isArray(item.images)) {
        for (const subImg of item.images) {
          if (typeof subImg === "string" && !photos.includes(subImg)) {
            photos.push(subImg);
          }
        }
      }
    }

    const detectedPhone =
      extractPhoneFromText(firstItem.businessPhoneNumber) ||
      extractPhoneFromText(externalUrl) ||
      extractPhoneFromText(biography);

    return {
      username: handle,
      fullName: fullName.trim() || handle,
      biography: biography.trim(),
      externalUrl,
      profilePicUrl: profilePicHD,
      profilePicUrlHD: profilePicHD,
      followersCount,
      postsCount,
      businessCategory,
      businessPhone: detectedPhone,
      businessEmail: firstItem.businessEmail || null,
      businessAddress: firstItem.businessAddress || null,
      whatsapp: detectedPhone,
      photos: photos.slice(0, 12),
      posts: posts.slice(0, 12),
      source: "apify",
    };
  } catch (err) {
    console.error("[ApifyInstagramService] Erro ao consultar Apify:", err);
    return null;
  }
}

/**
 * Testa se um token da API Apify é válido consultando os dados do usuário.
 */
export async function testApifyToken(token: string): Promise<{ ok: boolean; message: string; username?: string }> {
  const clean = token.trim();
  if (!clean) return { ok: false, message: "Token vazio. Cole seu token da Apify." };

  try {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(clean)}`);
    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, message: "Token inválido ou não autorizado pela Apify." };
      }
      return { ok: false, message: `Erro HTTP ${res.status} ao validar token na Apify.` };
    }
    const data = await res.json();
    const username = data?.data?.username || data?.data?.email || "Usuário Apify";
    return { ok: true, message: `Conexão bem-sucedida! Conta conectada: ${username}`, username };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao conectar com a API da Apify.";
    return { ok: false, message: `Falha na conexão: ${msg}` };
  }
}

