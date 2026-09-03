/**
 * Utilitário de Atribuição e Rastreamento de Origem de Leads (Sem dependência de Meta API)
 */

export interface LeadAttribution {
  source: "instagram" | "google" | "facebook" | "tiktok" | "ads" | "qr_code" | "direct";
  label: string;
  tag: string;
}

/**
 * Detecta a origem do visitante analisando parâmetros de URL (UTMs) e o referrer do navegador.
 */
export function detectLeadAttribution(): LeadAttribution {
  if (typeof window === "undefined") {
    return { source: "direct", label: "Acesso Direto", tag: "[Via Link]" };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = (urlParams.get("utm_source") || urlParams.get("ref") || urlParams.get("src") || "").toLowerCase();
  const utmMedium = (urlParams.get("utm_medium") || "").toLowerCase();
  const referrer = (document.referrer || "").toLowerCase();

  // 1. Anúncios pagos
  if (utmMedium.includes("cpc") || utmMedium.includes("paid") || utmSource.includes("ads") || urlParams.has("gclid") || urlParams.has("fbclid")) {
    return { source: "ads", label: "Anúncios Patrocinados", tag: "[Via Anúncio]" };
  }

  // 2. QR Code / Balcão
  if (utmSource.includes("qr") || utmSource.includes("balcao") || utmSource.includes("mesa") || utmSource.includes("display")) {
    return { source: "qr_code", label: "QR Code / Balcão Físico", tag: "[Via QR Code Balcão]" };
  }

  // 3. Instagram
  if (utmSource.includes("insta") || utmSource.includes("ig") || referrer.includes("instagram.com")) {
    return { source: "instagram", label: "Instagram", tag: "[Via Instagram]" };
  }

  // 4. Google (Maps / Orgânico)
  if (utmSource.includes("google") || utmSource.includes("maps") || referrer.includes("google.")) {
    return { source: "google", label: "Google Maps / Busca", tag: "[Via Google]" };
  }

  // 5. TikTok
  if (utmSource.includes("tiktok") || referrer.includes("tiktok.com")) {
    return { source: "tiktok", label: "TikTok", tag: "[Via TikTok]" };
  }

  // 6. Facebook
  if (utmSource.includes("facebook") || referrer.includes("facebook.com")) {
    return { source: "facebook", label: "Facebook", tag: "[Via Facebook]" };
  }

  // 7. Padrão: Direto ou Link compartilhado
  return { source: "direct", label: "Acesso Direto / Bio", tag: "[Via Bio]" };
}

/**
 * Injeta a tag de origem no início da mensagem pré-configurada do WhatsApp.
 */
export function buildAttributedWhatsAppUrl(
  phone: string,
  baseMessage?: string | null,
  customPrefix?: string,
): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "#";

  const attribution = detectLeadAttribution();
  const tag = customPrefix || attribution.tag;
  const message = baseMessage?.trim() || "Olá! Gostaria de mais informações.";

  // Evita duplicar a tag se já estiver presente
  const fullMessage = message.startsWith("[") ? message : `${tag} ${message}`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(fullMessage)}`;
}
