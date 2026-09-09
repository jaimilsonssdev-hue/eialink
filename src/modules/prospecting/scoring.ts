import type { ProspectDraft, ProspectPriority } from "./types";

/** Nichos com maior conversão histórica para presença digital. */
const PRIORITY_NICHES = [
  "restaurante",
  "pizzaria",
  "lanchonete",
  "clinica",
  "clínica",
  "odonto",
  "estetica",
  "estética",
  "salao",
  "salão",
  "barbearia",
  "advocacia",
  "advogado",
  "pet",
  "academia",
  "loja",
  "imobiliaria",
  "imobiliária",
];

export function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(value: string | null | undefined) {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  return clean.length ? clean : null;
}

export function normalizeName(value: string | null | undefined) {
  let clean = normalizeText(value);
  if (!clean) return null;

  // Desfaz traduções indevidas de proxies internacionais (ex: "Clinical Innovate" -> "Clínica Inove")
  if (/clinical\s+innovate/i.test(clean)) {
    clean = clean.replace(/clinical\s+innovate/gi, "Clínica Inove");
  } else if (/^clinical\s+/i.test(clean)) {
    clean = clean.replace(/^clinical\s+/i, "Clínica ");
  }

  return clean
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word) => (word.length > 2 ? word[0].toLocaleUpperCase("pt-BR") + word.slice(1) : word))
    .join(" ");
}

/** Retorna somente dígitos com DDI 55 quando reconhecível. */
export function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const national = digits.startsWith("55") ? digits.slice(2) : digits;
  if (national.length < 10 || national.length > 11) return null;
  return `55${national}`;
}

/** Formata telefone para exibição visual limpa: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX. */
export function formatPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  return value;
}

/** Extrai telefone/WhatsApp brasileiro com DDD de textos variados (Maps, Instagram, links wa.me, etc). */
export function extractBrazilianPhone(text: string | null | undefined): string | null {
  if (!text) return null;

  // 1. Links diretos de WhatsApp (wa.me/5573998106161 ou api.whatsapp.com/send?phone=557399810-6161)
  const waMatch = text.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?(?:[^&]*&)*phone=)(?:55)?([1-9]{2}[-\s.]?9?[-\s.]?\d{4}[-\s.]?\d{4})/i);
  if (waMatch) {
    const digits = waMatch[1].replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 11) {
      return `55${digits}`;
    }
  }

  // 2. Telefone com DDD entre parênteses: (73) 99148-7816 ou (73) 9 9849-0524 ou (73) 3291-4288
  const parenMatch = text.match(/\(?([1-9]{2})\)\s*(?:9\s*)?(\d{4})[-\s.]?(\d{4})/);
  if (parenMatch) {
    const rawMatch = parenMatch[0];
    const digits = rawMatch.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 11) {
      return `55${digits}`;
    }
  }

  // 3. Telefone com prefixo internacional: +55 73 99148-7816 ou +55 73 3291-4288
  const ddiMatch = text.match(/\+55\s*\(?([1-9]{2})\)?\s*(?:9\s*)?(\d{4})[-\s.]?(\d{4})/);
  if (ddiMatch) {
    const rawMatch = ddiMatch[0];
    const digits = rawMatch.replace(/\D/g, "").replace(/^55/, "");
    if (digits.length >= 10 && digits.length <= 11) {
      return `55${digits}`;
    }
  }

  // 4. Telefone rotulado: Telefone: 73 99148-7816 ou Tel: 73 99148-7816 ou Contato: ...
  const labeledMatch = text.match(/(?:Telefone|Tel|Fone|WhatsApp|Contato)\s*:\s*(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)(?:9\s*)?(\d{4})[-\s.]?(\d{4})/i);
  if (labeledMatch) {
    const rawMatch = labeledMatch[0];
    const digits = rawMatch.replace(/\D/g, "").replace(/^55/, "");
    if (digits.length >= 10 && digits.length <= 11) {
      return `55${digits}`;
    }
  }

  return null;
}

export function normalizeInstagram(value: string | null | undefined) {
  const clean = normalizeText(value);
  if (!clean) return null;
  const handle = clean
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?].*$/, "")
    .replace(/^@/, "")
    .toLowerCase();
  return handle ? `@${handle}` : null;
}

export function normalizeWebsite(value: string | null | undefined) {
  const clean = normalizeText(value);
  if (!clean) return null;
  const withProtocol = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    if (/instagram\.com|facebook\.com|linktr\.ee/i.test(url.hostname)) return null;
    return url.origin + (url.pathname === "/" ? "" : url.pathname);
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string | null | undefined) {
  const clean = normalizeText(value)?.toLowerCase() ?? null;
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return null;
  return clean;
}

export function normalizeNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildDedupeKey(
  inputOrName:
    | string
    | {
        name: string;
        city?: string | null;
        whatsapp?: string | null;
        phone?: string | null;
        instagram?: string | null;
      },
  cityArg?: string | null,
  phoneArg?: string | null,
) {
  let name = "";
  let city: string | null = null;
  let phone: string | null = null;
  let instagram: string | null = null;

  if (typeof inputOrName === "object" && inputOrName !== null) {
    name = inputOrName.name || "";
    city = inputOrName.city ?? null;
    phone = inputOrName.whatsapp ?? inputOrName.phone ?? null;
    instagram = inputOrName.instagram ?? null;
  } else {
    name = String(inputOrName || "");
    city = cityArg ?? null;
    phone = phoneArg ?? null;
  }

  if (phone) return `tel:${phone}`;
  if (instagram) return `ig:${instagram.replace("@", "")}`;
  const slug = stripAccents(`${name} ${city ?? ""}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `nome:${slug}`;
}


/**
 * Score determinístico 0-100: quanto maior, maior a dor de presença digital
 * combinada com capacidade de compra demonstrada.
 */
export function scoreCompany(
  input: Pick<
    ProspectDraft,
    | "name"
    | "niche"
    | "city"
    | "whatsapp"
    | "phone"
    | "email"
    | "instagram"
    | "website"
    | "has_website"
    | "rating"
    | "reviews_count"
  >,
) {
  let score = 0;

  // Dor principal: não tem site próprio.
  score += input.has_website || input.website ? 5 : 30;

  // Canal de abordagem direto.
  if (input.whatsapp || input.phone) score += 20;
  else if (input.email) score += 8;

  // Presença social ativa indica interesse em marketing.
  if (input.instagram) score += 10;

  const reviews = input.reviews_count ?? 0;
  if (reviews >= 100) score += 15;
  else if (reviews >= 30) score += 10;
  else if (reviews >= 5) score += 5;

  const rating = input.rating ?? 0;
  if (rating >= 4.5) score += 10;
  else if (rating >= 4) score += 7;
  else if (rating >= 3) score += 3;

  const niche = stripAccents((input.niche ?? "").toLowerCase());
  if (PRIORITY_NICHES.some((item) => niche.includes(stripAccents(item)))) score += 15;

  if (input.city) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function priorityFromScore(score: number): ProspectPriority {
  if (score >= 70) return "alta";
  if (score >= 45) return "media";
  return "baixa";
}
