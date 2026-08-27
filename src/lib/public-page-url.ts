const ROOT_DOMAIN = "eialink.com.br";

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "mail",
  "cdn",
  "static",
  "assets",
]);

export function normalizePageSlug(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "minha-pagina"
  );
}

export function subdomainValidationMessage(value: string) {
  const slug = normalizePageSlug(value);
  if (RESERVED_SUBDOMAINS.has(slug)) return "Este endereço é reservado pelo Eialink.";
  if (slug.length < 3) return "Escolha um endereço com pelo menos 3 caracteres.";
  return null;
}

export function pageSlugFromHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/:\d+$/, "");
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const slug = host.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!slug || slug.includes(".") || RESERVED_SUBDOMAINS.has(slug)) return null;
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug) ? slug : null;
}

export function publicPageUrl(slug: string, useProfessionalSubdomain: boolean) {
  const safeSlug = normalizePageSlug(slug);
  if (useProfessionalSubdomain) return `https://${safeSlug}.${ROOT_DOMAIN}`;
  const origin = typeof window === "undefined" ? `https://${ROOT_DOMAIN}` : window.location.origin;
  return `${origin}/p/${safeSlug}`;
}
