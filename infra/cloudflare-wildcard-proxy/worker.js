/**
 * EIA Link — proxy wildcard de subdomínios.
 *
 * Encaminha  cliente01.eialink.com.br/*  ->  https://eialink.com.br/p/cliente01/*
 * mantendo o domínio raiz e o www intactos.
 *
 * Deploy: Cloudflare Workers, com rota `*.eialink.com.br/*` e um
 * registro DNS `*` (CNAME proxied) apontando para o domínio raiz.
 */

const ROOT_DOMAIN = "eialink.com.br";
const ORIGIN = "https://eialink.com.br";

/** Subdomínios reservados que nunca representam um cliente. */
const RESERVED = new Set(["www", "app", "admin", "api", "mail", "cdn", "static", "assets"]);

/** Extrai o slug do cliente a partir do Host, ou null quando não há subdomínio de cliente. */
function slugFromHost(hostname) {
  const host = hostname.toLowerCase().replace(/:\d+$/, "");
  if (host === ROOT_DOMAIN || !host.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const label = host.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!label || label.includes(".")) return null;
  if (RESERVED.has(label)) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(label)) return null;
  return label;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const slug = slugFromHost(url.hostname);

    const target = new URL(url.pathname + url.search, ORIGIN);

    // Somente a raiz do subdomínio vira a bio; assets e demais rotas passam direto.
    if (slug && (url.pathname === "/" || url.pathname === "")) {
      target.pathname = `/p/${slug}`;
    }

    const proxied = new Request(target, request);
    proxied.headers.set("X-Forwarded-Host", url.hostname);

    const response = await fetch(proxied, { redirect: "manual" });
    const out = new Response(response.body, response);
    out.headers.delete("content-security-policy");
    return out;
  },
};
