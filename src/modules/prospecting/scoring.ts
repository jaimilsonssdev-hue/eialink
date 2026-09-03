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
  const clean = normalizeText(value);
  if (!clean) return null;
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
