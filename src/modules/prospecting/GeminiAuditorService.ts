import type { ProspectedCompany } from "./types";

export interface CompanyAuditResult {
  companyName: string;
  niche: string;
  city: string;
  rating: number | null;
  reviewsCount: number | null;
  hasWebsite: boolean;
  demoUrl: string | null;
  strengths: string[];
  vulnerabilities: string[];
  consultativePitch: string;
  executiveSummary: string;
  source: "gemini" | "heuristic_fallback";
  modelUsed?: string;
}

export const GEMINI_KEY_STORAGE = "eialink_gemini_api_key";
export const GEMINI_KEY_UPDATED_EVENT = "eialink:gemini_key_updated";

/**
 * Obtém a chave da API do Gemini armazenada com segurança no navegador ou variável de ambiente.
 */
export function getSavedGeminiKey(): string | null {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(GEMINI_KEY_STORAGE);
    if (local && local.trim()) return local.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return envKey ? String(envKey).trim() : null;
}

/**
 * Salva a chave da API do Gemini no armazenamento local seguro do navegador.
 */
export function saveGeminiKey(key: string): void {
  if (typeof window === "undefined") return;
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(GEMINI_KEY_STORAGE, clean);
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
  window.dispatchEvent(new CustomEvent(GEMINI_KEY_UPDATED_EVENT, { detail: { key: clean } }));
}

/**
 * Remove a chave da API do Gemini do armazenamento local.
 */
export function removeGeminiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
  window.dispatchEvent(new CustomEvent(GEMINI_KEY_UPDATED_EVENT, { detail: { key: "" } }));
}

/**
 * Testa a conexão com a API do Gemini usando uma chamada de verificação leve.
 */
export async function testGeminiKey(key: string): Promise<{ ok: boolean; message: string }> {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { ok: false, message: "A chave não pode estar em branco." };
  }
  if (!cleanKey.startsWith("AIza")) {
    return { ok: false, message: "Formato inválido. Chaves do Google AI Studio geralmente começam com 'AIzaSy...'." };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Responda apenas com a palavra OK." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errorMsg = errBody?.error?.message || `Erro HTTP ${response.status}`;
      if (response.status === 400 || response.status === 403) {
        return { ok: false, message: `Chave recusada pelo Google: ${errorMsg}` };
      }
      return { ok: false, message: `Falha na verificação: ${errorMsg}` };
    }

    return { ok: true, message: "Conexão com a API do Google Gemini validada com sucesso! 🚀" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido de rede.";
    return { ok: false, message: `Não foi possível conectar ao Google AI: ${msg}` };
  }
}

/**
 * Gera auditoria heurística inteligente local (Fallback 100% resiliente sem dependência de API externa).
 */
export function generateHeuristicAudit(company: ProspectedCompany, demoUrl?: string): CompanyAuditResult {
  const name = company.name;
  const niche = company.niche || "Negócio Local";
  const city = company.city || "sua região";
  const rating = company.rating;
  const reviews = company.reviews_count ?? 0;
  const hasWebsite = Boolean(company.has_website && !company.website?.includes("wa.me"));

  const matchDemo = demoUrl || company.notes?.match(/https?:\/\/[^\s)]+/)?.[0] || null;

  const strengths: string[] = [];
  const vulnerabilities: string[] = [];

  // Avaliação de Forças
  if (rating && rating >= 4.5 && reviews >= 10) {
    strengths.push(`Excelente reputação no Google Maps: nota ${rating.toFixed(1)} com ${reviews} avaliações reais de clientes.`);
  } else if (rating && rating >= 4.0) {
    strengths.push(`Avaliação positiva consolidada no Google Maps (nota ${rating.toFixed(1)}).`);
  } else {
    strengths.push(`Ponto comercial ativo e indexado na busca do Google em ${city}.`);
  }

  if (company.whatsapp || company.phone) {
    strengths.push("Canal direto de atendimento via telefone/WhatsApp cadastrado para contato rápido.");
  }
  if (company.instagram) {
    strengths.push(`Presença social ativa com perfil público no Instagram (${company.instagram}).`);
  }

  // Avaliação de Vulnerabilidades
  if (!hasWebsite) {
    vulnerabilities.push("Ausência de site institucional ou página oficial para apresentar serviços, fotos e diferenciais de forma profissional.");
    vulnerabilities.push("Perda diária de clientes que pesquisam no Google pelo celular e priorizam concorrentes que oferecem agendamento em 1 clique.");
  } else {
    vulnerabilities.push("Página atual não possui fluxo otimizado de conversão para agendamentos imediatos no WhatsApp.");
  }

  vulnerabilities.push("Atendimento manual que gera demora na resposta fora do horário comercial, reduzindo a taxa de conversão de novos contatos.");

  const executiveSummary = `${name} possui ótima reputação local (${rating ? `nota ${rating} com ${reviews} avaliações` : "empresa ativa em " + city}), porém ${
    !hasWebsite ? "não possui presença digital oficial nem botão de agendamento ágil" : "sua estrutura digital atual não retém clientes que buscam atendimento rápido no WhatsApp"
  }. Há uma oportunidade imediata de aumentar o faturamento em 25% a 40% com um biolink moderno de alta conversão.`;

  const consultativePitch = matchDemo
    ? `Olá! Estive analisando a presença da ${name} no Google em ${city}.
Parabéns pelo trabalho ${rating ? `(nota ${rating} com ${reviews} avaliações)` : "e reputação na região"}! 👏

Notei um ponto crítico que pode estar custando clientes todos os dias: vocês ainda não possuem uma página oficial com agendamento direto pelo celular, fazendo muitos pacientes/clientes desistirem e irem para concorrentes.

Para ajudar, montei uma sugestão exclusiva e sem compromisso para vocês verem na prática como resolver isso:
👉 ${matchDemo}

Posso te mostrar em 2 minutos como isso agiliza os atendimentos no seu WhatsApp?`
    : `Olá! Estive analisando a presença digital da ${name} no Google em ${city}.
Parabéns pela reputação do negócio ${rating ? `(nota ${rating} com ${reviews} avaliações)` : "na região"}! 👏

Notei uma oportunidade imediata: muitos clientes pesquisam por ${niche} no Google pelo celular, mas como vocês ainda não têm um site próprio com botão de agendamento automático, muitos acabam indo para concorrentes.

Preparei um diagnóstico prático de como profissionalizar a presença digital de vocês e receber agendamentos prontos no WhatsApp. Posso te enviar?`;

  return {
    companyName: name,
    niche,
    city,
    rating,
    reviewsCount: reviews,
    hasWebsite,
    demoUrl: matchDemo,
    strengths,
    vulnerabilities,
    consultativePitch,
    executiveSummary,
    source: "heuristic_fallback",
  };
}

/**
 * Executa a Auditoria Completa da Empresa via Google Gemini com Fallback Heurístico transparente.
 */
export async function auditCompany(
  company: ProspectedCompany,
  demoUrl?: string,
): Promise<CompanyAuditResult> {
  const apiKey = getSavedGeminiKey();
  const matchDemo = demoUrl || company.notes?.match(/https?:\/\/[^\s)]+/)?.[0] || null;

  // Se não houver chave configurada, executa o motor nativo imediatamente
  if (!apiKey) {
    return generateHeuristicAudit(company, matchDemo || undefined);
  }

  const prompt = `Você é um Consultor Especialista em Crescimento de Negócios Locais e Auditor de Presença Digital (AI SDR).
Sua missão é analisar os dados reais de uma empresa extraídos do Google Maps e gerar um mini-diagnóstico consultivo, focado em ajudar o dono do negócio a faturar mais e parar de perder clientes para a concorrência.

DADOS REAIS DA EMPRESA:
- Nome da Empresa: ${company.name}
- Nicho / Ramo de Atuação: ${company.niche || "Serviços locais"}
- Cidade / Região: ${company.city || "Brasil"}
- Avaliação Google Maps: ${company.rating ? `${company.rating} estrelas` : "Não informada"}
- Número de Avaliações: ${company.reviews_count ?? 0}
- Possui Site Próprio: ${company.has_website ? "Sim" : "Não (Não tem site oficial)"}
- Instagram: ${company.instagram || "Não informado"}
- Link Demonstrativo Pronto Criado por Nós: ${matchDemo || "Nenhum ainda"}
- Observações adicionais do Maps: ${company.notes || "Nenhuma"}

INSTRUÇÕES OBRIGATÓRIAS:
1. NÃO soe como um vendedor desesperado ou robótico. Aja como um especialista consultivo que fez uma análise respeitosa e encontrou dinheiro sendo deixado na mesa.
2. Identifique de 2 a 3 PONTOS FORTES reais (ex: reputação excelente, boas avaliações, localização estratégica).
3. Identifique de 2 a 3 GARGALOS CRÍTICOS DE VENDA (ex: falta de site mobile, sem agendador 24h no WhatsApp, clientes que pesquisam no Maps e desistem por falta de cardápio/catálogo/preços claros).
4. Escreva um PITCH CONSULTIVO pronto para ser enviado no WhatsApp ou Instagram Direct pelo celular:
   - Cordial, personalizado com o nome da empresa e métricas reais do Google Maps.
   - Apontar o gargalo com respeito e propor a demonstração gratuita como solução (${matchDemo ? `incluindo o link ${matchDemo}` : "oferecendo mostrar a solução"}).
   - Finalizar com uma pergunta curta de baixo atrito ("Posso te mostrar em 2 minutos?").

Retorne a resposta EXCLUSIVAMENTE em formato JSON válido com as seguintes chaves:
{
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "vulnerabilities": ["gargalo 1", "gargalo 2"],
  "executiveSummary": "Resumo em 2 frases do diagnóstico",
  "consultativePitch": "Texto completo da mensagem para WhatsApp com quebras de linha"
}`;

  const models = ["gemini-1.5-flash", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(jsonStr);

      return {
        companyName: company.name,
        niche: company.niche || "Negócio Local",
        city: company.city || "sua região",
        rating: company.rating,
        reviewsCount: company.reviews_count ?? 0,
        hasWebsite: Boolean(company.has_website),
        demoUrl: matchDemo,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
          ? parsed.strengths
          : ["Boa autoridade local cadastrada no Google."],
        vulnerabilities: Array.isArray(parsed.vulnerabilities) && parsed.vulnerabilities.length > 0
          ? parsed.vulnerabilities
          : ["Falta de presença digital otimizada para celular."],
        executiveSummary: parsed.executiveSummary || `Diagnóstico gerado para ${company.name}.`,
        consultativePitch: parsed.consultativePitch || "",
        source: "gemini",
        modelUsed: model,
      };
    } catch {
      // continua para o próximo modelo ou fallback
    }
  }

  return generateHeuristicAudit(company, matchDemo || undefined);
}
