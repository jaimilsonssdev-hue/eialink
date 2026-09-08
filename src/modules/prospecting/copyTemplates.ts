import type { ProspectedCompany } from "./types";

export interface ProspectingCopyTemplates {
  whatsappWithDemo: string;
  whatsappWithoutDemo: string;
  instagramWithDemo: string;
  instagramWithoutDemo: string;
}

export const COPY_TEMPLATES_STORAGE_KEY = "eialink_prospecting_copy_templates";
export const COPY_TEMPLATES_UPDATED_EVENT = "eialink:copy_templates_updated";

/**
 * Templates padrão de alta conversão recomendados.
 */
export function getDefaultCopyTemplates(): ProspectingCopyTemplates {
  return {
    whatsappWithDemo:
      "Olá, {empresa}! Vi o perfil de vocês no Google Maps em {cidade}. {contexto_google}Reparei que ainda não possuem um site profissional próprio. Tomei a liberdade de montar uma página demonstrativa moderna para vocês: {link_demo}. O que acharam?",
    whatsappWithoutDemo:
      "Olá, {empresa}! Vi o perfil de vocês no Google Maps em {cidade}. {contexto_google}Reparei que ainda não possuem um site profissional próprio. Gostaria de preparar uma demonstração gratuita de página para vocês receberem agendamentos direto no WhatsApp. Posso te enviar?",
    instagramWithDemo:
      "Olá, {empresa}! 👋 Vi o perfil de vocês aqui no Instagram. {contexto_google}Montei uma sugestão exclusiva de presença digital oficial para vocês no ar: {link_demo}. Posso te mostrar como funciona para receber agendamentos direto no WhatsApp e no Direct?",
    instagramWithoutDemo:
      "Olá, {empresa}! 👋 Vi o perfil de vocês aqui no Instagram. {contexto_google}Reparei que ainda não possuem um site ou biolink oficial e preparei uma sugestão gratuita de presença digital para vocês. Posso te mostrar?",
  };
}

/**
 * Obtém os templates salvos pelo usuário no localStorage (ou retorna os padrões).
 */
export function getSavedCopyTemplates(): ProspectingCopyTemplates {
  if (typeof window === "undefined") return getDefaultCopyTemplates();

  try {
    const raw = localStorage.getItem(COPY_TEMPLATES_STORAGE_KEY);
    if (!raw) return getDefaultCopyTemplates();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultCopyTemplates();
    return {
      whatsappWithDemo: parsed.whatsappWithDemo || defaults.whatsappWithDemo,
      whatsappWithoutDemo: parsed.whatsappWithoutDemo || defaults.whatsappWithoutDemo,
      instagramWithDemo: parsed.instagramWithDemo || defaults.instagramWithDemo,
      instagramWithoutDemo: parsed.instagramWithoutDemo || defaults.instagramWithoutDemo,
    };
  } catch {
    return getDefaultCopyTemplates();
  }
}

/**
 * Salva os novos templates no localStorage e notifica a aplicação.
 */
export function saveCopyTemplates(templates: ProspectingCopyTemplates): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COPY_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent(COPY_TEMPLATES_UPDATED_EVENT, { detail: templates }));
  } catch (err) {
    console.warn("Erro ao salvar templates de copy:", err);
  }
}

/**
 * Restaura os templates originais padrão.
 */
export function resetCopyTemplates(): ProspectingCopyTemplates {
  const defaults = getDefaultCopyTemplates();
  saveCopyTemplates(defaults);
  return defaults;
}

export interface PitchContext {
  name: string;
  city?: string | null;
  niche?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  demoUrl?: string | null;
  modelVariant?: string | null;
}

/**
 * Interpola tags dinâmicas dentro de um texto de template.
 * Tags suportadas:
 * - {empresa}: Nome da empresa
 * - {cidade}: Cidade (ou "sua região")
 * - {nicho}: Ramo de atuação
 * - {nota}: Nota real no Google (ex: 3.8 ou "ótima")
 * - {avaliacoes}: Contagem de avaliações (ex: 93 ou "várias")
 * - {contexto_google}: Frase contextual sobre nota e avaliações se existirem
 * - {link_demo}: URL da página de demonstração
 * - {modelo}: Nome da variante visual gerada
 */
export function interpolatePitch(
  template: string,
  ctx: PitchContext,
): string {
  const empresa = ctx.name || "empresa";
  const cidade = ctx.city || "sua região";
  const nicho = ctx.niche || "seu segmento";
  const demoUrl = ctx.demoUrl || "";
  const modelo = ctx.modelVariant || "Design Pro";

  const hasRating = ctx.rating !== null && ctx.rating !== undefined && !isNaN(ctx.rating);
  const hasReviews = ctx.reviewsCount !== null && ctx.reviewsCount !== undefined && !isNaN(ctx.reviewsCount);

  // Formata o contexto do Google de maneira natural
  let contextoGoogle = "";
  if (hasRating && hasReviews) {
    contextoGoogle = `Vocês já têm nota ${ctx.rating} com ${ctx.reviewsCount} avaliações no Google, mas `;
  } else if (hasRating) {
    contextoGoogle = `Vocês já contam com nota ${ctx.rating} no Google, mas `;
  } else if (hasReviews) {
    contextoGoogle = `Vocês já contam com ${ctx.reviewsCount} avaliações no Google, mas `;
  }

  // Substitutos simples para as tags individuais
  const notaStr = hasRating ? ctx.rating!.toString() : "ótima";
  const avaliacoesStr = hasReviews ? ctx.reviewsCount!.toString() : "várias";

  let result = template
    .replace(/\{empresa\}/gi, empresa)
    .replace(/\{cidade\}/gi, cidade)
    .replace(/\{nicho\}/gi, nicho)
    .replace(/\{contexto_google\}/gi, contextoGoogle)
    .replace(/\{nota\}/gi, notaStr)
    .replace(/\{avaliacoes\}/gi, avaliacoesStr)
    .replace(/\{link_demo\}/gi, demoUrl)
    .replace(/\{modelo\}/gi, modelo);

  // Capitaliza início de frases após pontuação se a tag anterior estiver vazia
  result = result.replace(/([.!?]\s+)([a-zà-ÿ])/g, (_, sep, letter) => `${sep}${letter.toUpperCase()}`);

  // Limpeza de espaços duplos remanescentes
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
}

/**
 * Constrói a mensagem para envio no WhatsApp para uma empresa prospectada.
 */
export function buildWhatsAppMessage(
  company: ProspectedCompany,
  customTemplate?: string,
): string {
  const matchDemo = company.notes?.match(/https?:\/\/[^\s)]+/);
  const demoUrl = matchDemo ? matchDemo[0] : null;

  const modelMatch = company.notes?.match(/\[Modelo:\s*([^\]]+)\]/i);
  const modelVariant = modelMatch ? modelMatch[1] : "Design Pro";

  const templates = customTemplate ? null : getSavedCopyTemplates();
  const template =
    customTemplate ||
    (demoUrl ? templates!.whatsappWithDemo : templates!.whatsappWithoutDemo);

  return interpolatePitch(template, {
    name: company.name,
    city: company.city,
    niche: company.niche,
    rating: company.rating,
    reviewsCount: company.reviews_count,
    demoUrl,
    modelVariant,
  });
}

/**
 * Constrói o pitch para abordagem no Instagram Direct para uma empresa prospectada.
 */
export function buildInstagramMessage(
  company: ProspectedCompany,
  customTemplate?: string,
): string {
  const matchDemo = company.notes?.match(/https?:\/\/[^\s)]+/);
  const demoUrl = matchDemo ? matchDemo[0] : null;

  const modelMatch = company.notes?.match(/\[Modelo:\s*([^\]]+)\]/i);
  const modelVariant = modelMatch ? modelMatch[1] : "Design Pro";

  const templates = customTemplate ? null : getSavedCopyTemplates();
  const template =
    customTemplate ||
    (demoUrl ? templates!.instagramWithDemo : templates!.instagramWithoutDemo);

  return interpolatePitch(template, {
    name: company.name,
    city: company.city,
    niche: company.niche,
    rating: company.rating,
    reviewsCount: company.reviews_count,
    demoUrl,
    modelVariant,
  });
}
