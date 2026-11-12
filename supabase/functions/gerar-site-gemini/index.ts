import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type HeroVariant = "hero_split" | "hero_full_dark" | "hero_editorial";
export type ServicesVariant = "grid_cards" | "lista_precos";
export type Palette = "emerald_gold" | "rose_nude" | "dark_amber" | "navy_blue";

export interface ModularSiteServiceItem {
  title: string;
  description: string;
}

export interface ModularSiteConfig {
  hero_variant: HeroVariant;
  services_variant: ServicesVariant;
  palette: Palette;
  headline: string;
  subheadline: string;
  services: ModularSiteServiceItem[];
  whatsapp_msg: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveApiKey(): Promise<string | null> {
  const envKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (envKey) return envKey;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey) {
      const client = createClient(supabaseUrl, serviceRoleKey);
      const { data } = await client
        .from("payment_gateway_settings")
        .select("gemini_api_key")
        .eq("id", "default")
        .maybeSingle();
      const dbKey = (data?.gemini_api_key as string | null)?.trim();
      if (dbKey) return dbKey;
    }
  } catch (err) {
    console.warn("[gerar-site-gemini] Falha ao consultar fallback do banco:", err);
  }

  return null;
}

function sanitizeAndValidateConfig(raw: any, name: string, niche: string, city: string): ModularSiteConfig {
  const validHero: HeroVariant[] = ["hero_split", "hero_full_dark", "hero_editorial"];
  const validServices: ServicesVariant[] = ["grid_cards", "lista_precos"];
  const validPalettes: Palette[] = ["emerald_gold", "rose_nude", "dark_amber", "navy_blue"];

  let hero_variant: HeroVariant = validHero.includes(raw?.hero_variant)
    ? raw.hero_variant
    : "hero_split";

  let services_variant: ServicesVariant = validServices.includes(raw?.services_variant)
    ? raw.services_variant
    : "grid_cards";

  let palette: Palette = validPalettes.includes(raw?.palette)
    ? raw.palette
    : "dark_amber";

  // Se o nicho sugerir uma paleta mais harmônica por padrão:
  const n = (niche || "").toLowerCase();
  if (!raw?.palette) {
    if (n.includes("odonto") || n.includes("dent") || n.includes("clinica")) palette = "navy_blue";
    else if (n.includes("estetica") || n.includes("salao") || n.includes("beleza") || n.includes("spa")) palette = "rose_nude";
    else if (n.includes("auto") || n.includes("mecanic") || n.includes("barber")) palette = "dark_amber";
    else if (n.includes("clima") || n.includes("ar")) palette = "navy_blue";
    else palette = "emerald_gold";
  }

  let headline = String(raw?.headline || `Excelência e Atendimento Premium em ${niche}`).trim();
  if (headline.length > 70) headline = headline.slice(0, 67).trim() + "...";

  let subheadline = String(raw?.subheadline || `Experiência comprovada e serviços sob medida para você em ${city}.`).trim();
  if (subheadline.length > 140) subheadline = subheadline.slice(0, 137).trim() + "...";

  let servicesList: ModularSiteServiceItem[] = [];
  if (Array.isArray(raw?.services) && raw.services.length > 0) {
    servicesList = raw.services
      .filter((s: any) => s && typeof s.title === "string" && s.title.trim())
      .map((s: any) => ({
        title: String(s.title).trim().slice(0, 45),
        description: String(s.description || "").trim().slice(0, 110),
      }))
      .slice(0, 6);
  }

  if (servicesList.length < 4) {
    const fallbackServices: Record<string, ModularSiteServiceItem[]> = {
      odonto: [
        { title: "Avaliação Completa", description: "Diagnóstico detalhado com planejamento estético e funcional." },
        { title: "Profilaxia e Limpeza", description: "Prevenção avançada e remoção de placas com máxima suavidade." },
        { title: "Clareamento Dental", description: "Tecnologia a laser e moldeiras para um sorriso brilhante e natural." },
        { title: "Restaurações Estéticas", description: "Resinas de alta durabilidade com tonalidade natural do dente." },
      ],
      estetica: [
        { title: "Limpeza de Pele Profunda", description: "Extração suave, hidratação profunda e renovação celular." },
        { title: "Massagem Relaxante", description: "Alívio de tensões musculares com óleos essenciais de alta pureza." },
        { title: "Drenagem Linfática", description: "Redução de inchaço, retenção de líquidos e melhora da circulação." },
        { title: "Harmonização e Skincare", description: "Protocolos personalizados para realçar sua beleza natural." },
      ],
      automotivo: [
        { title: "Revisão Geral Preventiva", description: "Checkup completo de suspensão, freios, fluidos e motor." },
        { title: "Alinhamento e Balanceamento", description: "Precisão computadorizada para maior estabilidade e segurança." },
        { title: "Troca de Óleo e Filtros", description: "Lubrificantes recomendados pela montadora para máxima vida útil." },
        { title: "Diagnóstico Computadorizado", description: "Scanner eletrônico de ponta para injeção e módulos do veículo." },
      ],
      climatizacao: [
        { title: "Instalação Residencial e Comercial", description: "Montagem técnica padrão fabricante com teste de estanqueidade." },
        { title: "Higienização Antibacteriana", description: "Limpeza profunda de filtros e serpentinas com ar puro." },
        { title: "Manutenção Preventiva (PMOC)", description: "Planos de manutenção periódica para empresas e clínicas." },
        { title: "Carga de Gás e Reparos", description: "Correção de vazamentos e reposição de fluido refrigerante ecológico." },
      ],
      gastronomia: [
        { title: "Especialidades da Casa", description: "Pratos artesanais elaborados com ingredientes nobres e frescos." },
        { title: "Entradas e Petiscos", description: "Combinações exclusivas para compartilhar momentos inesquecíveis." },
        { title: "Sobremesas Artesanais", description: "Doces finos com receitas de família e toque contemporâneo." },
        { title: "Carta de Bebidas e Drinks", description: "Coquetelaria autoral, sucos naturais e cervejas selecionadas." },
      ],
      comercio: [
        { title: "Novidades e Lançamentos", description: "Peças selecionadas com as principais tendências da estação." },
        { title: "Atendimento Personalizado", description: "Consultoria exclusiva para ajudar você a encontrar o produto ideal." },
        { title: "Embalagens para Presente", description: "Embalagens elegantes e personalizadas para momentos especiais." },
        { title: "Garantia e Suporte Pós-Venda", description: "Segurança total na sua compra com troca fácil e ágil." },
      ],
    };

    const key = Object.keys(fallbackServices).find((k) => n.includes(k)) || "comercio";
    const defaults = fallbackServices[key];
    while (servicesList.length < 4) {
      servicesList.push(defaults[servicesList.length % defaults.length]);
    }
  }

  let whatsapp_msg = String(
    raw?.whatsapp_msg ||
      `Olá! Vi o site oficial da ${name} e gostaria de saber mais informações e agendar um atendimento.`,
  ).trim();

  return {
    hero_variant,
    services_variant,
    palette,
    headline,
    subheadline,
    services: servicesList,
    whatsapp_msg,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Utilize POST." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").trim();
    const niche = (body?.niche || "Serviços").trim();
    const city = (body?.city || "Brasil").trim();
    const nicheSlug = (body?.niche_slug || slugify(niche)).trim();

    if (!name) {
      return jsonResponse({ error: "O nome da empresa é obrigatório." }, 400);
    }

    const apiKey = (await resolveApiKey()) || body?.apiKey?.trim();
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY não configurada. Defina a variável de ambiente GEMINI_API_KEY no Supabase.",
        },
        500,
      );
    }

    // Regra 4: Usar Deno.env.get("GEMINI_MODEL") com default para gemini-3.8-flash
    const modelEnv = Deno.env.get("GEMINI_MODEL")?.trim();
    const model = (modelEnv || "gemini-3.8-flash").replace(/^models\//, "");

    const prompt = `Você é um Diretor de Arte e Copywriter sênior do Eia Link.
Sua missão é selecionar a melhor combinação de design e redigir o copywriting perfeito para a presença digital de luxo da seguinte empresa:

Empresa: "${name}"
Nicho de Atuação: "${niche}" (slug: "${nicheSlug}")
Cidade / Região: "${city}"

DIRETRIZES DA DIREÇÃO DE ARTE:
1. "hero_variant": Escolha a variante que melhor valoriza o tipo de negócio:
   - "hero_split": Ideal para empresas com forte apelo visual e serviços práticos (odonto, estética, automotivo, climatização).
   - "hero_full_dark": Ideal para marcas com atmosfera imersiva, gastronômica, barbearias ou luxo noturno.
   - "hero_editorial": Ideal para clínicas exclusivas, estética refinada, consultoria ou marcas premium.

2. "services_variant":
   - "grid_cards": Cards modernos e visuais com foto e botão individual.
   - "lista_precos": Lista refinada e limpa estilo menu de alta gastronomia ou tratamentos premium.

3. "palette":
   - "emerald_gold": Sofisticação, finanças, gastronomia nobre, sustentabilidade.
   - "rose_nude": Estética, beleza, spa, odontologia humanizada, autocuidado.
   - "dark_amber": Automotivo, barbearia, hamburgueria, energia, industrial.
   - "navy_blue": Odontologia técnica, climatização, corporativo, medicina, engenharia.

4. "headline": Frase de impacto irresistível com no MÁXIMO 70 caracteres.
5. "subheadline": Frase explicativa persuasiva com no MÁXIMO 140 caracteres.
6. "services": Entre 4 e 6 serviços principais autênticos com "title" (até 45 caracteres) e "description" (até 110 caracteres).
7. "whatsapp_msg": Mensagem natural de primeiro contato para o cliente abrir no WhatsApp.

Retorne EXCLUSIVAMENTE o JSON estruturado conforme o schema solicitado.`;

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            hero_variant: {
              type: "STRING",
              enum: ["hero_split", "hero_full_dark", "hero_editorial"],
            },
            services_variant: {
              type: "STRING",
              enum: ["grid_cards", "lista_precos"],
            },
            palette: {
              type: "STRING",
              enum: ["emerald_gold", "rose_nude", "dark_amber", "navy_blue"],
            },
            headline: {
              type: "STRING",
              description: "Headline magnética de até 70 caracteres",
            },
            subheadline: {
              type: "STRING",
              description: "Subheadline clara de até 140 caracteres",
            },
            services: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                },
                required: ["title", "description"],
              },
            },
            whatsapp_msg: {
              type: "STRING",
              description: "Mensagem pré-formatada para o WhatsApp",
            },
          },
          required: [
            "hero_variant",
            "services_variant",
            "palette",
            "headline",
            "subheadline",
            "services",
            "whatsapp_msg",
          ],
        },
      },
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      const fallbackModel = "gemini-3.5-flash";
      console.warn(`[gerar-site-gemini] ${model} retornou HTTP ${response.status}. Tentando fallback ${fallbackModel}...`);
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(30_000),
      }).catch(() => null);

      if (fallbackResponse && fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[gerar-site-gemini] Erro Google AI (HTTP ${response.status}):`, errText);
      // Fallback seguro determinístico para não quebrar o fluxo
      const fallbackConfig = sanitizeAndValidateConfig({}, name, niche, city);
      return jsonResponse({
        success: true,
        fallback: true,
        model,
        site_config: fallbackConfig,
      });
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(candidateText);
    } catch {
      const match = candidateText.match(/\{[\s\S]*\}/);
      if (match) parsedJson = JSON.parse(match[0]);
    }

    const site_config = sanitizeAndValidateConfig(parsedJson, name, niche, city);

    return jsonResponse({
      success: true,
      model,
      site_config,
    });
  } catch (error) {
    console.error("[gerar-site-gemini] Erro geral:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro ao gerar configuração do site.",
      },
      500,
    );
  }
});
