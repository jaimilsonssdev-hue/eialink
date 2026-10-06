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
import { detectNicheKey, getPresetForCompany, NICHE_GALLERIES } from "./nichePresets";
import { supabase } from "@/integrations/supabase/client";
import { requestGemini } from "@/modules/ai/gemini-gateway";

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
  instagram?: string | null;
  reviews?: Array<{ author?: string; text?: string; rating?: number }> | null;
  photos?: string[] | null;
}

export interface NicheArchetypeConfig {
  archetype: "luxury-editorial" | "clean-biotech" | "cyber-tech" | "dark-brutalist" | "neo-pop-d2c";
  theme: {
    bg: string;
    accent: string;
    secondaryAccent: string;
    fontHeading: "serif" | "sans" | "display" | "mono";
    parallaxEnabled: boolean;
    borderStyle: "glass" | "sharp" | "pill" | "subtle";
  };
}

export interface AiPageBlueprint {
  detectedSpecialty: string; // Ex: "Clínica de Estética Corporal e Pós-Operatório"
  nicheKey: string; // Ex: "estetica_corporal"
  headline: string; // Headline magnética e autêntica
  manifesto: string; // Copy persuasiva sobre a empresa
  theme: string; // Ex: "gold", "noir", "emerald", "rose", etc.
  differentials: string[]; // 3 a 4 diferenciais extraídos das avaliações e dados reais
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
const PREFERRED_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

/**
 * Gera o blueprint completo de uma página de demonstração a partir dos dados raspados do Google.
 * Tenta sintetizar via IA Gemini e, caso a chave não esteja configurada ou ocorra timeout/falha,
 * recorre imediatamente ao fallback determinístico de presets com os dados reais de reviews.
 */
export async function generateAiPageBlueprintFromScrapedData(
  payload: ScrapedCompanyPayload,
): Promise<AiPageBlueprint> {
  const companyName = payload.companyName.trim() || "Empresa";
  const city = payload.city?.trim() || "sua região";
  const apiKey = getSavedGeminiKey();

  // Busca inteligência adicional do Instagram via Jina se link ou perfil foi informado
  let instagramSnippet = "";
  if (payload.instagram) {
    try {
      const intel = await fetchJinaBusinessIntelligence({
        companyName,
        city,
        instagram: payload.instagram,
      });
      instagramSnippet = intel.instagramSnippet || "";
    } catch {
      // Silencioso
    }
  }

  try {
    const aiResult = await requestGeminiBlueprint(payload, apiKey || undefined, instagramSnippet);
    if (aiResult) {
      return enrichBlueprintImages(aiResult, payload);
    }
  } catch (err) {
    console.warn("[aiDemoGenerator] Falha no gateway Gemini, aplicando fallback heurístico:", err);
  }

  // Fallback Determinístico Blindado com os Presets Refinados e Reviews do Google
  return generateDeterministicFallbackBlueprint(payload);
}

/**
 * Realiza a chamada REST estruturada à API do Google Gemini
 */
async function requestGeminiBlueprint(
  payload: ScrapedCompanyPayload,
  apiKey: string | undefined,
  instagramSnippet = "",
): Promise<AiPageBlueprint | null> {
  const reviewsSummary = (payload.reviews || [])
    .filter((r) => r.text && r.text.trim().length > 5)
    .slice(0, 5)
    .map(
      (r, i) =>
        `[Review ${i + 1} - ${r.author || "Cliente"} (${r.rating || 5}★)]: "${r.text?.trim()}"`,
    )
    .join("\n");

  const prompt = `
Você é o Diretor Criativo e Especialista em Posicionamento de Marcas da EIA Digital.
Analise a ficha REAL do Google Maps e presença online desta empresa e crie um blueprint completo de site profissional de altíssima conversão.

DADOS REAIS DA EMPRESA:
- Nome da Empresa: "${payload.companyName}"
- Nicho / Categoria Informada: "${payload.niche || "Não informado"}"
- Cidade / Localização: "${payload.city || "Brasil"}"
- Endereço Completo: "${payload.address || "Localização central"}"
- Avaliação Google: ${payload.rating || 5.0} estrelas (${payload.reviewsCount || 10} avaliações)
- Horário de Funcionamento: "${payload.openingHours || "Segunda a Sábado"}"
- Presença no Instagram (Snippet): "${instagramSnippet || "Não informado"}"
- Avaliações Reais de Clientes no Google:
${reviewsSummary || "Nenhuma avaliação textual detalhada, empresa bem avaliada."}

DIRETRIZES CRÍTICAS DE DESIGN EDITORIAL E COPYWRITING (SKILL CREATIVE-SITE-CRAFT):
1. COPYWRITING SENSORIAL DE ALTA CONVERSÃO:
   - ZERO clichês vazios como "o melhor da cidade", "qualidade garantida", "venha conferir", "atendimento diferenciado".
   - Prove com números e fatos: nota ${payload.rating || 5.0} no Google, pontualidade, atendimento com hora marcada sem filas, ambiente climatizado.
   - Detalhes sensoriais do nicho: para comida, ingredientes frescos e processos artesanais; para clínica/saúde, rigor e segurança; para barbearia, precisão e conforto.

2. ESPECIALIDADE AUTÊNTICA (ZERO ERRO):
   - Se o nome inclui "Corpus", "Corporal", "Drenagem", "Lipo", classifique como "estetica_corporal". NUNCA coloque manicure ou cílios para clínicas corporais!
   - Nichos aceitos: "estetica_corporal", "estetica_facial", "spa", "beleza", "barbearia", "clinica", "odonto", "nutricao", "psicologia", "advocacia", "restaurante", "delivery", "sorveteria", "loja", "petshop", "fitness", "oficina", "automotivo", "seguros", "costura", "tecnologia", "autonomo", "pessoal", "geral".

3. HEADLINE & MANIFESTO:
   - Headline: Frase marcante, elegante e objetiva destacando o principal benefício e a cidade.
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
      const response = await requestGemini(supabase, {
        action: "generateContent",
        model,
        ...(apiKey ? { apiKeyOverride: apiKey } : {}),
        payload: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        },
      });

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
          manifesto:
            parsed.manifesto ||
            `Bem-vindo à ${payload.companyName}. Excelência e dedicação em cada atendimento.`,
          theme: parsed.theme || "emerald",
          differentials:
            Array.isArray(parsed.differentials) && parsed.differentials.length > 0
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
          testimonials:
            Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
              ? parsed.testimonials.map((t: any) => ({
                  author: t.author || "Cliente Google",
                  text: t.text || "Excelente atendimento e profissionais incríveis!",
                  rating: typeof t.rating === "number" ? t.rating : 5,
                }))
              : buildTestimonialsFromReviews(payload.reviews),
          whatsappMessage:
            parsed.whatsappMessage ||
            `Olá! Gostaria de saber mais sobre os serviços da ${payload.companyName}.`,
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
  reviews?: Array<{ author?: string; text?: string; rating?: number }> | null,
): Array<{ author: string; text: string; rating: number }> {
  if (reviews && reviews.length > 0) {
    const valid = reviews
      .filter((r) => r.text && r.text.trim().length > 8)
      .slice(0, 3)
      .map((r) => ({
        author: r.author?.trim() || "Cliente Google",
        text:
          r.text?.trim() ||
          "Atendimento impecável, equipe extremamente atenciosa e resultado maravilhoso!",
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
function generateDeterministicFallbackBlueprint(payload: ScrapedCompanyPayload): AiPageBlueprint {
  const companyName = payload.companyName.trim() || "Sua Empresa";
  const city = payload.city?.trim() || "sua região";
  const nicheKey = detectNicheKey(payload.niche, companyName);
  const preset = getPresetForCompany(nicheKey, companyName);

  const headline = preset.generateHeadline(companyName, city);
  const manifesto = preset.generateDescription(companyName, city);

  const ratingText = payload.rating
    ? `Nota ${payload.rating} no Google Maps`
    : "Reconhecimento comprovado pelos clientes";
  const reviewsCountText = payload.reviewsCount
    ? `Mais de ${payload.reviewsCount} clientes atendidos`
    : "Atendimento humanizado";

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
  payload: ScrapedCompanyPayload,
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

/**
 * Extrai inteligência de presença online (Instagram e Google) via Jina Reader sem necessidade de login.
 */
export async function fetchJinaBusinessIntelligence(params: {
  companyName: string;
  city?: string | null;
  instagram?: string | null;
}): Promise<{
  bioText?: string;
  instagramSnippet?: string;
}> {
  const { instagram } = params;
  let instagramSnippet = "";

  if (instagram) {
    const cleanHandle = instagram
      .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "")
      .replace(/[\/\?#].*$/, "")
      .replace(/^@/, "")
      .trim();

    if (cleanHandle) {
      try {
        const query = `site:instagram.com/${cleanHandle} "${cleanHandle}"`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`;
        const jinaUrl = `https://r.jina.ai/${googleUrl}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(jinaUrl, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9",
            "x-locale": "pt-BR",
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const text = await res.text();
          const bioMatches = text.match(
            /(?:seguidores|publicações|posts|stories)[^\n\r]*[\n\r]+([^\n\r]{20,250})/i,
          );
          if (bioMatches && bioMatches[1]) {
            instagramSnippet = bioMatches[1].trim();
          } else {
            const genericSnippet = text.match(/Instagram\s*·\s*[^\n\r]+[\n\r]+([^\n\r]{20,250})/i);
            if (genericSnippet && genericSnippet[1]) {
              instagramSnippet = genericSnippet[1].trim();
            }
          }
        }
      } catch (igErr) {
        console.warn("[JinaIntelligence] Falha ao extrair snippet do Instagram:", igErr);
      }
    }
  }

  return { instagramSnippet };
}

/**
 * Mapeia o nicho para o arquétipo visual e paleta de cores correspondente.
 * Elimina o visual monótono cinza garantindo design editorial de alto padrão.
 */
export function resolveNicheArchetype(nicheKey: string): NicheArchetypeConfig {
  const key = (nicheKey || "").toLowerCase();

  // 1. clean-biotech: Saúde, clínicas, estética, odontologia, fisioterapia, psicologia
  if (
    key.includes("odonto") ||
    key.includes("dent") ||
    key.includes("clinic") ||
    key.includes("estetica") ||
    key.includes("dermato") ||
    key.includes("saude") ||
    key.includes("psico") ||
    key.includes("fisio") ||
    key.includes("nutri")
  ) {
    return {
      archetype: "clean-biotech",
      theme: {
        bg: "#070b0c",
        accent: "#10b981", // Esmeralda suave e nobre
        secondaryAccent: "#06b6d4", // Ciano clínico
        fontHeading: "sans",
        parallaxEnabled: true,
        borderStyle: "glass",
      },
    };
  }

  // 2. cyber-tech: Barbearia contemporânea, oficinas, automotivo, tecnologia, engenharia
  if (
    key.includes("barbearia") ||
    key.includes("barber") ||
    key.includes("oficina") ||
    key.includes("auto") ||
    key.includes("car") ||
    key.includes("tec") ||
    key.includes("soft") ||
    key.includes("eletro")
  ) {
    const isBarber = key.includes("barbe");
    return {
      archetype: "cyber-tech",
      theme: {
        bg: "#06090e",
        accent: isBarber ? "#f59e0b" : "#00f0ff", // Barbearia âmbar/couro ou tech cyan
        secondaryAccent: isBarber ? "#d97706" : "#38bdf8",
        fontHeading: isBarber ? "display" : "mono",
        parallaxEnabled: true,
        borderStyle: "sharp",
      },
    };
  }

  // 3. luxury-editorial: Alta gastronomia, restaurantes, bistrôs, advocacia, joalheria, spa de luxo
  if (
    key.includes("restaurante") ||
    key.includes("bistro") ||
    key.includes("advoc") ||
    key.includes("direito") ||
    key.includes("joia") ||
    key.includes("luxo") ||
    key.includes("imobil") ||
    key.includes("arquitet") ||
    key.includes("spa")
  ) {
    return {
      archetype: "luxury-editorial",
      theme: {
        bg: "#0a0a0c",
        accent: "#f59e0b", // Âmbar nobre / ouro
        secondaryAccent: "#d4af37", // Champagne
        fontHeading: "serif",
        parallaxEnabled: true,
        borderStyle: "glass",
      },
    };
  }

  // 4. neo-pop-d2c: Lanches, delivery, burger, pizza, açaí, sorvetes, moda jovem, fitness
  if (
    key.includes("delivery") ||
    key.includes("burger") ||
    key.includes("pizza") ||
    key.includes("lanche") ||
    key.includes("sorv") ||
    key.includes("acai") ||
    key.includes("fit") ||
    key.includes("acad") ||
    key.includes("loja") ||
    key.includes("bebida")
  ) {
    const isBeautyOrStore = key.includes("loja");
    const isFitness = key.includes("fit") || key.includes("acad");
    return {
      archetype: "neo-pop-d2c",
      theme: {
        bg: "#070709",
        accent: isFitness ? "#ccff00" : isBeautyOrStore ? "#ec4899" : "#ff5500", // Neon volt, pink fashion ou fogo quente delivery
        secondaryAccent: "#fbbf24",
        fontHeading: "display",
        parallaxEnabled: true,
        borderStyle: "pill",
      },
    };
  }

  // 5. dark-brutalist (default sóbrio de impacto)
  return {
    archetype: "dark-brutalist",
    theme: {
      bg: "#09090b",
      accent: "#ffffff",
      secondaryAccent: "#a1a1aa",
      fontHeading: "display",
      parallaxEnabled: true,
      borderStyle: "subtle",
    },
  };
}

/**
 * Gera cartões de Bento Grid estruturados e persuasivos
 */
export function generateNicheBentoCards(
  companyName: string,
  nicheKey: string,
  city?: string | null,
  rating?: number | null,
  reviewsCount?: number | null,
  differentials?: string[],
): Array<{
  id: string;
  title: string;
  description: string;
  badge?: string;
  size: "large" | "medium";
}> {
  const starsText = rating ? `★ ${rating.toFixed(1)} no Google Maps` : "Reconhecimento Comprovado";
  const countText = reviewsCount
    ? `Mais de ${reviewsCount} clientes atendidos e avaliados`
    : "Avaliações 5 estrelas verificadas";

  const diff1 =
    differentials?.[0] ||
    `${starsText} com nota máxima. Atendimento com hora marcada e pontualidade.`;
  const diff2 =
    differentials?.[1] ||
    "Ambiente exclusivo com climatização, conforto acústico e total privacidade.";
  const diff3 =
    differentials?.[2] ||
    "Protocolos modernos com produtos rigorosamente certificados e acompanhamento pós-atendimento.";
  const diff4 =
    differentials?.[3] ||
    `Localização de fácil acesso em ${city || "região central"} com comodidade e agilidade.`;

  return [
    {
      id: "bento-1",
      title: "Autoridade & Confiança",
      description: `${diff1} ${countText}.`,
      badge: "5 Estrelas",
      size: "large",
    },
    {
      id: "bento-2",
      title: "Conforto & Estrutura",
      description: diff2,
      badge: "Exclusivo",
      size: "medium",
    },
    {
      id: "bento-3",
      title: "Rigor & Segurança",
      description: diff3,
      badge: "Garantia",
      size: "medium",
    },
    {
      id: "bento-4",
      title: "Acesso & Agilidade",
      description: diff4,
      size: "medium",
    },
  ];
}

/**
 * Gera FAQ interativo do nicho
 */
export function generateNicheFaq(
  companyName: string,
  nicheKey: string,
  city?: string | null,
  address?: string | null,
): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Como funciona o agendamento ou pedido na ${companyName}?`,
      answer:
        "O atendimento é 100% humanizado e direto pelo WhatsApp. Basta clicar nos botões desta página para conversar com nossa equipe e escolher seu horário ou produto com confirmação imediata.",
    },
    {
      question: "Quais são as opções de pagamento aceitas?",
      answer:
        "Aceitamos PIX, cartões de crédito e débito, e condições especiais de parcelamento para planos e procedimentos.",
    },
    {
      question: "Onde o estabelecimento está localizado?",
      answer: address
        ? `Estamos localizados em ${address}, com estacionamento e acesso facilitado.`
        : `Estamos localizados em área central de ${city || "nossa cidade"}, com ambiente climatizado e acessibilidade.`,
    },
    {
      question: "Preciso agendar com antecedência?",
      answer:
        "Recomendamos o agendamento prévio pelo WhatsApp para garantir seu horário sem tempo de espera, embora atendamos encaixes conforme disponibilidade do dia.",
    },
  ];
}

/**
 * Gera tabela comparativa de transparência
 */
export function generateNicheComparison(
  companyName: string,
  nicheKey: string,
): {
  headline: string;
  usLabel: string;
  othersLabel: string;
  rows: Array<{ feature: string; us: boolean | string; others: boolean | string }>;
} {
  return {
    headline: `O Padrão ${companyName} vs. O Mercado Convencional`,
    usLabel: companyName,
    othersLabel: "Convencional",
    rows: [
      {
        feature: "Atendimento com hora marcada e sem atrasos",
        us: true,
        others: false,
      },
      {
        feature: "Equipe especializada com processos certificados",
        us: true,
        others: false,
      },
      {
        feature: "Ambiente higienizado, climatizado e confortável",
        us: true,
        others: "Variável",
      },
      {
        feature: "Transparência total em valores e procedimentos",
        us: true,
        others: false,
      },
      {
        feature: "Suporte e acompanhamento direto no WhatsApp",
        us: true,
        others: false,
      },
    ],
  };
}

/**
 * Gera badges para marquee em alta velocidade
 */
export function generateNicheMarquee(
  companyName: string,
  nicheKey: string,
  rating?: number | null,
): string[] {
  return [
    `★ ${rating || 4.9} AVALIAÇÃO GOOGLE`,
    "ATENDIMENTO VIP WHATSAPP",
    "ESTRUTURA CLIMATIZADA",
    "PONTUALIDADE E SEGURANÇA",
    "GARANTIA DE SATISFAÇÃO",
    `${companyName.toUpperCase()}`,
  ];
}
