import { GoogleGenAI } from "@google/genai";
import type { OpenPageSiteConfig } from "./schema";
import { createDefaultSiteConfig, THEME_PRESETS } from "./defaultSite";
import type { CompanyData } from "@/services/geminiService";

export interface GenerateSiteFromAiOptions {
  companyData: CompanyData;
  stylePrompt?: string;
  apiKey?: string;
  currentConfig?: OpenPageSiteConfig;
}

function resolveApiKey(override?: string): string {
  if (override && override.trim().length > 5) {
    return override.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 5) {
      return envKey.trim();
    }
  }
  throw new Error(
    "Nenhuma chave da API do Google AI Studio configurada. Conecte sua chave para ativar a geração.",
  );
}

/**
 * Prompt de sistema estrito para o Gemini gerar o OpenPageSiteConfig em JSON.
 */
const SYSTEM_PROMPT = `Você é o Arquiteto de IA do OpenPage Studio no EIA Link.
Sua missão é gerar um objeto JSON completo seguindo rigorosamente a interface OpenPageSiteConfig.

REGRAS RÍGIDAS DE ENGENHARIA DE PROMPT E CRO:
1. USE DADOS REAIS DO GOOGLE MAPS:
   - Extraia das reviews reais as virtudes citadas pelos clientes (agilidade, cordialidade, pontualidade, precisão).
   - Headline da Hero deve ser um soco no estômago de alta conversão para o nicho (sem clichês como "o melhor da cidade").
   - Crie 3 a 5 itens de serviços com títulos específicos, descrições vendedoras e valores estimados realistas para o Brasil (em R$).
   - O 'badge' da Hero deve destacar a nota real (ex: "★ 4.9 NO GOOGLE").
   - As comodidades e amenidades devem se transformar em selos claros.

2. ESCOLHA DO TEMA:
   - Gastronomia/Restaurante: "warm-gourmet" ou "luxury-gold"
   - Clínica médica/Odonto/Saúde: "clean-health"
   - Barbearia/Escritório de Luxo: "luxury-gold" ou "dark-minimal"
   - Estética/Beleza: "rose-beauty"
   - Tecnologia/Academia: "cyber-neon"

3. ESTRUTURA DO JSON RETORNADO:
Deve conter:
{
  "version": 1,
  "updatedAt": "...",
  "meta": { "businessName": "...", "niche": "...", "whatsapp": "...", "address": "...", "rating": 4.9, "reviewsCount": 128 },
  "theme": { ... },
  "sections": [
    { "type": "hero", ... },
    { "type": "services", ... },
    { "type": "story", ... },
    { "type": "reviews", ... },
    { "type": "gallery", ... },
    { "type": "faq", ... },
    { "type": "contact", ... }
  ]
}

RETORNE EXCLUSIVAMENTE O JSON VÁLIDO. ZERO TEXTO FORA DO JSON.`;

/**
 * Gera um site completo no padrão OpenPage JSON-First a partir dos dados do Maps.
 */
export async function generateSiteWithGemini(
  options: GenerateSiteFromAiOptions,
): Promise<OpenPageSiteConfig> {
  const { companyData, stylePrompt, apiKey, currentConfig } = options;

  const key = resolveApiKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const baseConfig = currentConfig || createDefaultSiteConfig(companyData.name, companyData.category, companyData.phone);

  const reviewsFormatted = (companyData.reviews_summary || [])
    .map((r, i) => `Review ${i + 1}: "${r}"`)
    .join("\n");

  const amenitiesFormatted = (companyData.amenities || []).join(", ");

  const prompt = `Crie a configuração JSON de Landing Page de alta conversão para esta empresa:
Nome: ${companyData.name}
Nicho: ${companyData.category}
Endereço: ${companyData.address}
Telefone/WhatsApp: ${companyData.phone || baseConfig.meta.whatsapp}
Nota Google: ${companyData.rating || 4.9}
Comentários dos Clientes:
${reviewsFormatted || "Padrão de excelência e satisfação comprovada."}
Comodidades: ${amenitiesFormatted || "Atendimento personalizado"}
${stylePrompt ? `Instruções de estilo adicionais: ${stylePrompt}` : ""}

Retorne o JSON completo estruturado.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    let cleanJson = text;
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(cleanJson) as OpenPageSiteConfig;
    if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      return {
        ...parsed,
        version: 1,
        updatedAt: new Date().toISOString(),
        meta: {
          ...baseConfig.meta,
          ...parsed.meta,
          businessName: companyData.name || parsed.meta.businessName,
          whatsapp: companyData.phone || parsed.meta.whatsapp || baseConfig.meta.whatsapp,
          address: companyData.address || parsed.meta.address,
          rating: companyData.rating || parsed.meta.rating,
        },
      };
    }
  } catch (err) {
    console.warn("[OpenPage Generator] Falha no Gemini, mesclando dados no template:", err);
  }

  // Fallback determinístico seguro caso a IA oscile:
  return {
    ...baseConfig,
    updatedAt: new Date().toISOString(),
    meta: {
      ...baseConfig.meta,
      businessName: companyData.name,
      niche: companyData.category,
      whatsapp: companyData.phone || baseConfig.meta.whatsapp,
      address: companyData.address || baseConfig.meta.address,
      rating: companyData.rating || 4.9,
    },
    sections: baseConfig.sections.map((sec) => {
      if (sec.type === "hero") {
        return {
          ...sec,
          badge: `★ ${companyData.rating || "4.9"} NO GOOGLE (100+ AVALIAÇÕES)`,
          headline: `A EXPERIÊNCIA DE ALTO PADRÃO NA ${companyData.name.toUpperCase()}`,
          subheadline: `Referência em ${companyData.category}. Atendimento exclusivo e resultados que superam suas expectativas.`,
        };
      }
      if (sec.type === "contact") {
        return {
          ...sec,
          whatsapp: companyData.phone || sec.whatsapp,
          address: companyData.address || sec.address,
        };
      }
      return sec;
    }),
  };
}

/**
 * Refina ou edita o site via chat com Copilot no padrão OpenPage JSON-First.
 */
export async function refineSiteWithCopilot(
  currentConfig: OpenPageSiteConfig,
  instruction: string,
  apiKey?: string,
): Promise<{ config: OpenPageSiteConfig; message: string }> {
  const key = resolveApiKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const prompt = `CONFIGURAÇÃO ATUAL DO SITE (JSON):
${JSON.stringify(currentConfig, null, 2)}

INSTRUÇÃO DO USUÁRIO:
"${instruction}"

Aplique a instrução acima diretamente no JSON do site.
Retorne um JSON com:
{
  "message": "Explicação resumida do que foi alterado para o usuário",
  "updatedConfig": { ...objeto completo OpenPageSiteConfig atualizado... }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o Copilot de edição de sites JSON do OpenPage. Retorne sempre JSON válido.",
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    let clean = text;
    if (clean.startsWith("```json")) clean = clean.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    else if (clean.startsWith("```")) clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "");

    const parsed = JSON.parse(clean);
    if (parsed.updatedConfig && Array.isArray(parsed.updatedConfig.sections)) {
      return {
        config: parsed.updatedConfig,
        message: parsed.message || "Site atualizado com sucesso!",
      };
    }
  } catch (err: any) {
    console.warn("[OpenPage Copilot] Falha na edição:", err);
  }

  return {
    config: currentConfig,
    message: "Não consegui processar a alteração no momento. Você pode editar manualmente no painel ao lado!",
  };
}

