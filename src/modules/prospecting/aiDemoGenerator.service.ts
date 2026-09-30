/**
 * aiDemoGenerator.service.ts
 * 
 * Esteira Inteligente: Google Places ➔ IA Gemini ➔ Site Pronto
 * Conecta os dados reais raspados do Google (nome, endereço, notas, avaliações, horários)
 * diretamente à IA Gemini para diagnosticar a especialidade autêntica da empresa,
 * redigir copywriting magnético, sugerir 3 a 5 serviços de alta procura e montar
 * a página pronta para demonstração comercial.
 */

import { getSavedGeminiKey } from "./GeminiAuditorService";
import {
  detectNicheKey,
  getPresetForCompany,
  NICHE_GALLERIES,
} from "./nichePresets";

export interface ScrapedCompanyPayload {
  companyName: string;
  city?: string | null;
  niche?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  openingHours?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  reviews?: Array<{ author?: string; text?: string; rating?: number }> | null;
  photos?: string[] | null;
}

export interface AiPageBlueprint {
  detectedSpecialty: string; // Ex: "Clínica de Estética Corporal e Pós-Operatório"
  nicheKey: string;          // Ex: "estetica_corporal"
  headline: string;          // Headline magnética e autêntica
  manifesto: string;         // Copy persuasiva sobre a empresa
  theme: string;             // Ex: "gold", "noir", "emerald", "rose", etc.
  differentials: string[];   // 3 a 4 diferenciais extraídos das avaliações e dados reais
  services: Array<{
    name: string;
    description: string;
    category?: string;
    price?: number | null;
    image_url?: string | null;
  }>;
  testimonials: Array<{
    author: string;
    text: string;
    rating: number;
  }>;
  whatsappMessage: string;
  source: "gemini" | "niche_preset_fallback";
}

/**
 * Modelos preferenciais do Gemini para geração ultra-rápida e precisa em JSON
 */
const PREFERRED_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];

/**
 * Gera o blueprint completo de uma página de demonstração a partir dos dados raspados do Google.
 * Tenta sintetizar via IA Gemini e, caso a chave não esteja configurada ou ocorra timeout/falha,
 * recorre imediatamente ao fallback determinístico de presets com os dados reais de reviews.
 */
export async function generateAiPageBlueprintFromScrapedData(
  payload: ScrapedCompanyPayload
): Promise<AiPageBlueprint> {
  const companyName = payload.companyName.trim() || "Empresa";
  const city = payload.city?.trim() || "sua região";
  const apiKey = getSavedGeminiKey();

  if (apiKey) {
    try {
      const aiResult = await requestGeminiBlueprint(payload, apiKey);
      if (aiResult) {
        return enrichBlueprintImages(aiResult, payload);
      }
    } catch (err) {
      console.warn("[aiDemoGenerator] Falha ou timeout no Gemini, aplicando fallback heurístico:", err);
    }
  }

  // Fallback Determinístico Blindado com os Presets Refinados e Reviews do Google
  return generateDeterministicFallbackBlueprint(payload);
}

/**
 * Realiza a chamada REST estruturada à API do Google Gemini
 */
async function requestGeminiBlueprint(
  payload: ScrapedCompanyPayload,
  apiKey: string
): Promise<AiPageBlueprint | null> {
  const reviewsSummary = (payload.reviews || [])
    .filter((r) => r.text && r.text.trim().length > 5)
    .slice(0, 5)
    .map((r, i) => `[Review ${i + 1} - ${r.author || "Cliente"} (${r.rating || 5}★)]: "${r.text?.trim()}"`)
    .join("\n");

  const prompt = `
Você é o Diretor Criativo e Especialista em Posicionamento de Marcas da EIA Digital.
Analise a ficha REAL do Google Maps desta empresa e crie um blueprint completo de site profissional de alta conversão.

DADOS REAIS DA EMPRESA:
- Nome da Empresa: "${payload.companyName}"
- Nicho / Categoria Informada: "${payload.niche || "Não informado"}"
- Cidade / Localização: "${payload.city || "Brasil"}"
- Endereço Completo: "${payload.address || "Localização central"}"
- Avaliação Google: ${payload.rating || 5.0} estrelas (${payload.reviewsCount || 10} avaliações)
- Horário de Funcionamento: "${payload.openingHours || "Segunda a Sábado"}"
- Avaliações Reais de Clientes no Google:
${reviewsSummary || "Nenhuma avaliação textual detalhada, empresa bem avaliada."}

DIRETRIZES CRÍTICAS DE INTELIGÊNCIA:
1. ESPECIALIDADE AUTÊNTICA (ZERO ERRO):
   - Analise com cuidado o nome e os comentários reais dos clientes.
   - Se o nome inclui "Corpus", "Corporal", "Drenagem", "Lipo", "Massagem" ou os clientes elogiam drenagens e tratamentos corporais, classifique como "estetica_corporal". NUNCA coloque manicure, unhas ou cílios para clínicas corporais ou de emagrecimento!
   - Se o foco for "Facial", "Botox", "Harmonização", classifique como "estetica_facial".
   - Se for "Odonto" ou "Dentista", classifique como "odonto".
   - Se for "Barbearia", classifique como "barbearia".
   - Nichos aceitos no campo "nicheKey": "estetica_corporal", "estetica_facial", "spa", "beleza", "barbearia", "clinica", "odonto", "nutricao", "psicologia", "advocacia", "restaurante", "delivery", "sorveteria", "loja", "petshop", "fitness", "construcao", "imobiliaria", "automotivo", "seguros", "costura", "tecnologia", "autonomo", "pessoal", "geral".

2. HEADLINE & MANIFESTO:
   - Headline: Frase marcante, elegante e objetiva destacando o principal benefício e a localização.
   - Manifesto: Texto persuasivo de 2 parágrafos reforçando autoridade, segurança e atendimento de excelência.

3. SERVIÇOS (3 a 5 serviços reais de alta procura):
   - Serviços condizentes com a especialidade real.
   - Cada serviço deve ter: "name", "description" (1 a 2 frases claras e persuasivas), "category" e "price" (número estimado ou null se sob consulta).

4. DIFERENCIAIS (3 a 4 itens):
   - Pontos fortes reais baseados na nota do Google, experiência do cliente, higiene, pontualidade e estrutura.

5. DEPOIMENTOS (2 a 3 depoimentos autênticos):
   - Baseados nas avaliações reais de clientes fornecidas acima (ou síntese fidedigna com os nomes dos clientes reais).

6. TEMA VISUAL:
   - Escolha o tema que mais valoriza o negócio: "gold" (luxo/ouro), "noir" (escuro/sofisticado), "emerald" (saúde/bem-estar/verde nobre), "rose" (beleza/delicadeza), "ocean" (corporativo/azul profundo), "minimal" (clean).

7. RETORNO OBRIGATÓRIO EM FORMATO JSON:
Responda APENAS com um objeto JSON válido seguindo esta estrutura exata:
{
  "detectedSpecialty": "string",
  "nicheKey": "string",
  "headline": "string",
  "manifesto": "string",
  "theme": "string",
  "differentials": ["string", "string", "string"],
  "services": [
    {
      "name": "string",
      "description": "string",
      "category": "string",
      "price": 120
    }
  ],
  "testimonials": [
    {
      "author": "string",
      "text": "string",
      "rating": 5
    }
  ],
  "whatsappMessage": "string"
}
`.trim();

  for (const model of PREFERRED_GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanJson);

      if (parsed && parsed.headline && parsed.services && Array.isArray(parsed.services)) {
        return {
          detectedSpecialty: parsed.detectedSpecialty || payload.niche || "Especialidade Premium",
          nicheKey: parsed.nicheKey || detectNicheKey(payload.niche, payload.companyName),
          headline: parsed.headline,
          manifesto: parsed.manifesto || `Bem-vindo à ${payload.companyName}. Excelência e dedicação em cada atendimento.`,
          theme: parsed.theme || "emerald",
          differentials: Array.isArray(parsed.differentials) && parsed.differentials.length > 0
            ? parsed.differentials
            : [
                `Avaliação ${payload.rating || 5.0} estrelas no Google`,
                "Atendimento humanizado e personalizado",
                "Ambiente climatizado e estrutura moderna",
              ],
          services: parsed.services.map((srv: any) => ({
            name: srv.name || "Serviço Especializado",
            description: srv.description || "Atendimento com máxima excelência e cuidado.",
            category: srv.category || "Serviços",
            price: typeof srv.price === "number" ? srv.price : null,
            image_url: srv.image_url || null,
          })),
          testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
            ? parsed.testimonials.map((t: any) => ({
                author: t.author || "Cliente Google",
                text: t.text || "Excelente atendimento e profissionais incríveis!",
                rating: typeof t.rating === "number" ? t.rating : 5,
              }))
            : buildTestimonialsFromReviews(payload.reviews),
          whatsappMessage: parsed.whatsappMessage || `Olá! Gostaria de saber mais sobre os serviços da ${payload.companyName}.`,
          source: "gemini",
        };
      }
    } catch {
      // Tenta o próximo modelo do Gemini silenciosamente
    }
  }

  return null;
}

/**
 * Constrói depoimentos limpos a partir das avaliações reais do Google
 */
function buildTestimonialsFromReviews(
  reviews?: Array<{ author?: string; text?: string; rating?: number }> | null
): Array<{ author: string; text: string; rating: number }> {
  if (reviews && reviews.length > 0) {
    const valid = reviews
      .filter((r) => r.text && r.text.trim().length > 8)
      .slice(0, 3)
      .map((r) => ({
        author: r.author?.trim() || "Cliente Google",
        text: r.text?.trim() || "Atendimento impecável, equipe extremamente atenciosa e resultado maravilhoso!",
        rating: r.rating || 5,
      }));

    if (valid.length > 0) return valid;
  }

  return [
    {
      author: "Mariana Costa",
      text: "Atendimento impecável! O cuidado e profissionalismo da equipe superaram todas as minhas expectativas.",
      rating: 5,
    },
    {
      author: "Rodrigo Almeida",
      text: "Ambiente agradável, pontualidade britânica e profissionais muito qualificados. Recomendo de olhos fechados!",
      rating: 5,
    },
  ];
}

/**
 * Gera fallback instantâneo e determinístico utilizando os presets curados do nicho
 */
function generateDeterministicFallbackBlueprint(
  payload: ScrapedCompanyPayload
): AiPageBlueprint {
  const companyName = payload.companyName.trim() || "Sua Empresa";
  const city = payload.city?.trim() || "sua região";
  const nicheKey = detectNicheKey(payload.niche, companyName);
  const preset = getPresetForCompany(nicheKey, companyName);

  const headline = preset.generateHeadline(companyName, city);
  const manifesto = preset.generateDescription(companyName, city);

  const ratingText = payload.rating ? `Nota ${payload.rating} no Google Maps` : "Reconhecimento comprovado pelos clientes";
  const reviewsCountText = payload.reviewsCount ? `Mais de ${payload.reviewsCount} clientes atendidos` : "Atendimento humanizado";

  const differentials = [
    ratingText,
    reviewsCountText,
    "Protocolos e procedimentos personalizados",
    "Localização de fácil acesso e estrutura completa",
  ];

  const gallery = NICHE_GALLERIES[nicheKey] || NICHE_GALLERIES.geral;
  const covers = gallery?.covers || NICHE_GALLERIES.geral.covers;

  const services = preset.services.slice(0, 4).map((srv, idx) => ({
    name: srv.name,
    description: srv.description,
    category: srv.category || "Destaques",
    price: srv.price || null,
    image_url: covers[idx % covers.length]?.url || srv.image_url,
  }));

  const testimonials = buildTestimonialsFromReviews(payload.reviews);

  return {
    detectedSpecialty: preset.modelName || "Serviço Especializado",
    nicheKey,
    headline,
    manifesto,
    theme: preset.theme || "emerald",
    differentials,
    services,
    testimonials,
    whatsappMessage: preset.whatsapp_message(companyName),
    source: "niche_preset_fallback",
  };
}

/**
 * Enriquece os serviços com imagens em alta definição caso a IA não tenha retornado URLs
 */
function enrichBlueprintImages(
  blueprint: AiPageBlueprint,
  payload: ScrapedCompanyPayload
): AiPageBlueprint {
  const gallery = NICHE_GALLERIES[blueprint.nicheKey] || NICHE_GALLERIES.geral;
  const covers = gallery?.covers || NICHE_GALLERIES.geral.covers;

  const enrichedServices = blueprint.services.map((srv, idx) => {
    if (srv.image_url && srv.image_url.startsWith("http")) {
      return srv;
    }
    // Utiliza fotos reais do Google se disponíveis, ou galeria curada em HD do nicho
    const fallbackPhoto =
      payload.photos && payload.photos[idx]
        ? payload.photos[idx]
        : covers[idx % covers.length]?.url;

    return {
      ...srv,
      image_url: fallbackPhoto,
    };
  });

  return {
    ...blueprint,
    services: enrichedServices,
  };
}
