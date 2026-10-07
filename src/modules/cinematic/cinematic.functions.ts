import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CinematicPageData, CreativePlan, CinematicConceptOption } from "./types";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import { lookupBusinessProfile } from "@/modules/prospecting/LiveProspectingEngine";
import type { ProspectDraft } from "@/modules/prospecting/types";
import { requestGemini, SITE_BUILDER_MODELS } from "@/modules/ai/gemini-gateway";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSupabaseServerClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://gctwvvnjcxnsjiovhmsv.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 1. Extração rica do Google Maps para o Cinematic Studio
 */
export const lookupMapsForCinematicFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { urlOrQuery: string }) => d)
  .handler(async ({ data }) => {
    const raw = (data.urlOrQuery || "").trim();
    if (!raw) {
      throw new Error("Por favor, cole um link do Google Maps ou o nome do estabelecimento.");
    }

    const clean = normalizeBusinessQuery(raw);
    let profiles: ProspectDraft[] = [];
    try {
      profiles = await lookupBusinessProfile(clean.query || raw);
    } catch (err) {
      console.warn("[CinematicStudio] Erro na busca remota do Maps:", err);
    }

    const first = profiles[0];
    const firstAny = first as any;
    const name = first?.name || clean.name || raw.replace(/^https?:\/\/[^\s]+/gi, "").trim();
    const address =
      firstAny?.address ||
      firstAny?.placeDetails?.address ||
      (first?.city ? `Brasil - ${first.city}` : clean.city ? `Brasil - ${clean.city}` : undefined);
    const whatsapp = first?.whatsapp || first?.phone || undefined;
    const rating = first?.rating || 4.9;
    const reviewsCount = first?.reviews_count || 128;
    const niche = first?.niche || "Experiência Exclusiva";
    const openingHours =
      firstAny?.openingHours ||
      firstAny?.placeDetails?.openingHours ||
      "Consulte horários para reservas";
    const photos: string[] = firstAny?.photos || firstAny?.placeDetails?.photos || [];

    return {
      name,
      address,
      whatsapp,
      rating,
      reviewsCount,
      niche,
      openingHours,
      photos,
      fromLink: clean.fromLink,
    };
  });

/**
 * 2. Direção de Arte e Refinamento por IA (Gemini) para Scrollytelling
 */
export const refineCinematicWithAiFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { currentData: CinematicPageData; userInstruction: string }) => d)
  .handler(async ({ data, context }) => {
    const { currentData, userInstruction } = data;
    const instruction = (userInstruction || "").trim();

    if (!instruction) {
      return currentData;
    }

    try {
      const prompt = `Você é um Arquiteto de Software e Diretor Criativo Sênior internacional (padrão v0, Lovable, Awwwards) para marcas de alto impacto e ultra-luxo.
O usuário está refinando a Landing Page Cinematográfica com narrativa de Scrollytelling e arquitetura modular Bento para o negócio "${currentData.businessName}" (Nicho: "${currentData.niche}").

DADOS ATUAIS DA PÁGINA:
${JSON.stringify(currentData, null, 2)}

INSTRUÇÃO DE DIREÇÃO DE ARTE DO USUÁRIO:
"""
${instruction}
"""

BÍBLIA DE DIREÇÃO DE ARTE, ARQUÉTIPOS & REGRAS DE OURO (QA ESTÉTICO):

1. CLASSIFICAÇÃO AUTÔNOMA DO ARQUÉTIPO VISUAL ("archetype"):
   Analise o nicho e o pedido do usuário e escolha com precisão cirúrgica um dos 5 arquétipos:
   - "neo-pop-d2c": Bebidas, energéticos, suplementos, hamburguerias, fitness, streetwear. Paleta: bg #070709, accent #ccff00 (volt neon) ou #ff0055, fontHeading: "display", borderStyle: "pill".
   - "luxury-editorial": Alta gastronomia, cafés especiais, bistrôs, vinhedos, joalherias, arquitetura de luxo. Paleta: bg #0a0a0c, accent #f59e0b (âmbar nobre) ou #d97706, fontHeading: "serif", borderStyle: "glass".
   - "clean-biotech": Clínicas estéticas, dermatologia, odontologia de precisão, spas, longevidade. Paleta: bg #070b0c, accent #10b981 (esmeralda suave) ou #06b6d4, fontHeading: "sans", borderStyle: "glass".
   - "cyber-tech": Software, inteligência artificial, barbearias industriais, estúdios de engenharia. Paleta: bg #06090e, accent #00f0ff (cyan) ou #38bdf8, fontHeading: "mono", borderStyle: "sharp".
   - "dark-brutalist": Tatuagem, arte autoral, moda avant-garde, advocacia disruptiva. Paleta: bg #09090b, accent #ffffff (titânio P&B), fontHeading: "display", borderStyle: "subtle".

2. GERAÇÃO DOS NOVOS BLOCOS MODULARES:
   - "marquee": 4 a 6 frases curtas de alta vibração com ícones ("⚡", "💎", "🌿", "🔥", "★") rolando em loop.
   - "bentoGrid": 3 a 5 cartões assimétricos (1 large, 2 medium, 1-2 small) com métricas reais ou de posicionamento (ex: "Nota 4.9 no Google", "Produção 100% Artesanal", "Mais de 12 mil atendimentos").
   - "comparison": tabela comparativa destacando o diferencial inegociável do negócio vs. concorrência padrão.
   - "faq": 3 a 4 perguntas reais e esclarecedoras que clientes desse nicho fazem com respostas diretas e sofisticadas.
   - "hero": Tagline curta e imponente em caixa alta + Título magnético e poético + Subtítulo envolvente + floatingBadge (ex: "★ 4.9 NO GOOGLE").

3. COPYWRITING SENSORIAL & QA RESTRITIVO (ZERO CLICHÊS):
   - Proibido terminantemente: "o melhor da cidade", "qualidade garantida", "venha conferir", "excelência no atendimento".
   - Substitua por vocabulário tátil, de herança e precisão: aroma da brasa, silêncio acústico, colheita seletiva, calibragem milimétrica, tempo de maturação, luz natural.
   
4. MODO DELTA INTELIGENTE (PRESERVAÇÃO ESTRITA DE DADOS REAIS):
   - Mantenha RIGOROSAMENTE INALTERADOS: "whatsapp", "address", "rating", "openingHours", "businessName" e fotos reais já carregadas ("gallery", "hero.backgroundImage" e "hero.backgroundVideo").
   - NUNCA invente telefones falsos, novos endereços ou substitua fotos reais por placeholders caso fotos reais já existam.
   - Modifique APENAS os campos solicitados pelo usuário (ex: cores do tema, copy de manifesto, headline, tipografia ou lista de serviços).

5. DIRETRIZES DE ENGENHARIA VISUAL & MOTION (PADRÃO REEBOK NANO X3):
   - Para produtos físicos, fitness, tecnologia e streetwear: priorize taglines em estilo blueprint/HUD (ex: "[SPEC::01] RESPOSTA DINÂMICA"), títulos com tipografia de impacto em caixa alta e bullets com dados de engenharia comprováveis.
   - Para serviços de alto padrão, clínicas e gastronomia: priorize o padrão "Quiet Luxury", com elegância silenciosa, tipografia com serifa clássica e vocabulário sensorial tátil.

RETORNE RIGOROSAMENTE E APENAS O JSON NO FORMATO DE CinematicPageData VÁLIDO (SEM BLOCOS DE CÓDIGO MARKDOWN OU COMENTÁRIOS):
{
  "businessName": "${currentData.businessName}",
  "niche": "${currentData.niche}",
  "whatsapp": "${currentData.whatsapp}",
  "address": "${currentData.address || ""}",
  "rating": ${currentData.rating || 4.9},
  "openingHours": "${currentData.openingHours || ""}",
  "archetype": "luxury-editorial",
  "theme": {
    "bg": "#0a0a0c",
    "accent": "#f59e0b",
    "secondaryAccent": "#fbbf24",
    "fontHeading": "serif",
    "parallaxEnabled": true,
    "borderStyle": "glass"
  },
  "hero": {
    "title": "string",
    "subtitle": "string",
    "tagline": "string",
    "floatingBadge": "string",
    "backgroundImage": "${currentData.hero.backgroundImage}",
    ${currentData.hero.backgroundVideo ? `"backgroundVideo": "${currentData.hero.backgroundVideo}",` : ""}
    "ctaText": "string",
    "ctaLink": "#manifesto"
  },
  "marquee": [
    { "id": "m1", "text": "string", "icon": "⚡" }
  ],
  "bentoGrid": [
    { "id": "b1", "title": "string", "subtitle": "string", "description": "string", "size": "large", "metric": "string", "badge": "string" }
  ],
  "manifesto": {
    "headline": "string",
    "bodyText": "string",
    "quote": "string",
    "author": "string"
  },
  "comparison": {
    "headline": "string",
    "usLabel": "string",
    "othersLabel": "string",
    "rows": [
      { "feature": "string", "us": true, "others": false }
    ]
  },
  "highlights": [...],
  "gallery": [...],
  "faq": [
    { "question": "string", "answer": "string" }
  ]
}`;

      const models = SITE_BUILDER_MODELS;
      for (const model of models) {
        try {
          const resp = await requestGemini(context.supabase, {
            action: "generateContent",
            model,
            payload: {
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
            },
          }, context.accessToken);

          if (resp.ok) {
            const resJson = await resp.json();
            const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput) {
              const parsed = JSON.parse(textOutput) as CinematicPageData;
              if (parsed.hero) {
                return {
                  ...currentData,
                  ...parsed,
                  id: currentData.id,
                  businessName: currentData.businessName || parsed.businessName,
                  whatsapp: currentData.whatsapp || parsed.whatsapp,
                  address: currentData.address || parsed.address,
                  hero: {
                    ...currentData.hero,
                    ...parsed.hero,
                    backgroundImage:
                      currentData.hero.backgroundImage || parsed.hero.backgroundImage,
                    backgroundVideo:
                      currentData.hero.backgroundVideo || parsed.hero.backgroundVideo,
                  },
                  gallery:
                    parsed.gallery && parsed.gallery.length > 0
                      ? parsed.gallery
                      : currentData.gallery,
                };
              }
            }
          }
        } catch (modelErr) {
          console.warn(`[CinematicAi] Falha com modelo ${model}:`, modelErr);
        }
      }
    } catch (err) {
      console.warn("[CinematicAi] Erro na chamada com IA:", err);
    }
    // Heurística Fallback inteligente com Matriz de Arquétipos
    const lower = instruction.toLowerCase();
    const updated = JSON.parse(JSON.stringify(currentData)) as CinematicPageData;

    if (
      lower.includes("neo") ||
      lower.includes("pop") ||
      lower.includes("jovem") ||
      lower.includes("burger") ||
      lower.includes("bebida") ||
      lower.includes("fitness")
    ) {
      updated.archetype = "neo-pop-d2c";
      updated.theme.accent = "#ccff00";
      updated.theme.secondaryAccent = "#ff0055";
      updated.theme.bg = "#070709";
      updated.theme.fontHeading = "display";
      updated.theme.borderStyle = "pill";
      updated.hero.tagline = "ENERGY & HIGH VIBE";
      updated.hero.title = `Sabor de Alta Voltagem na ${updated.businessName}`;
      updated.hero.subtitle =
        "Fórmulas puras, intensidade máxima e atitude autêntica sem concessões.";
      updated.hero.floatingBadge = "⚡ EDIÇÃO LIMITADA 2026";
      updated.marquee = [
        { id: "m1", text: "ZERO COMPROMISSOS COM O MEDÍOCRE", icon: "⚡" },
        { id: "m2", text: "INTENSIDADE MÁXIMA 24/7", icon: "🔥" },
        { id: "m3", text: "DESIGN QUE PULSA", icon: "💎" },
        { id: "m4", text: "ENERGIA LIMPA E DIRETA", icon: "🚀" },
      ];
    } else if (
      lower.includes("tech") ||
      lower.includes("cyber") ||
      lower.includes("software") ||
      lower.includes("dados") ||
      lower.includes("barbearia")
    ) {
      updated.archetype = "cyber-tech";
      updated.theme.accent = "#00f0ff";
      updated.theme.secondaryAccent = "#38bdf8";
      updated.theme.bg = "#06090e";
      updated.theme.fontHeading = "mono";
      updated.theme.borderStyle = "sharp";
      updated.hero.tagline = "[SYS::01] HIGH PRECISION ENGINE";
      updated.hero.title = `A Nova Dimensão da ${updated.businessName}`;
      updated.hero.subtitle =
        "Arquitetura avançada, corte milimétrico e velocidade computacional aplicada ao mundo real.";
      updated.hero.floatingBadge = "STATUS: ONLINE 99.99%";
      updated.marquee = [
        { id: "m1", text: "SISTEMAS CALIBRADOS", icon: "⚙️" },
        { id: "m2", text: "LATÊNCIA ULTRA-BAIXA", icon: "⚡" },
        { id: "m3", text: "PRECISÃO MILIMÉTRICA", icon: "📐" },
        { id: "m4", text: "SEGURANÇA CRIPTOGRAFADA", icon: "🛡️" },
      ];
    } else if (
      lower.includes("clínica") ||
      lower.includes("estética") ||
      lower.includes("dermatologia") ||
      lower.includes("odonto") ||
      lower.includes("spa")
    ) {
      updated.archetype = "clean-biotech";
      updated.theme.accent = "#10b981";
      updated.theme.secondaryAccent = "#06b6d4";
      updated.theme.bg = "#070b0c";
      updated.theme.fontHeading = "sans";
      updated.theme.borderStyle = "glass";
      updated.hero.tagline = "CIÊNCIA, LONGEVIDADE & EQUILÍBRIO";
      updated.hero.title = `A Harmonização Natural na ${updated.businessName}`;
      updated.hero.subtitle =
        "Protocolos regenerativos de ponta desenhados para realçar sua essência com sutileza e rigor biomédico.";
      updated.hero.floatingBadge = "CERTIFICAÇÃO INTERNACIONAL";
      updated.marquee = [
        { id: "m1", text: "TECNOLOGIA BIOCELULAR", icon: "🌿" },
        { id: "m2", text: "SEGURANÇA FARMACOLÓGICA", icon: "🧪" },
        { id: "m3", text: "RESULTADOS PREVISÍVEIS", icon: "✨" },
        { id: "m4", text: "ATENDIMENTO INDIVIDUALIZADO", icon: "🩺" },
      ];
    } else if (
      lower.includes("brutal") ||
      lower.includes("tatuagem") ||
      lower.includes("tattoo") ||
      lower.includes("arte") ||
      lower.includes("preto")
    ) {
      updated.archetype = "dark-brutalist";
      updated.theme.accent = "#ffffff";
      updated.theme.secondaryAccent = "#a1a1aa";
      updated.theme.bg = "#09090b";
      updated.theme.fontHeading = "display";
      updated.theme.borderStyle = "subtle";
      updated.hero.tagline = "ESTÉTICA CRUA & SEM FILTROS";
      updated.hero.title = `A Marca Perpétua da ${updated.businessName}`;
      updated.hero.subtitle =
        "Sem ornamentos descartáveis. Apenas contraste visceral, técnica implacável e assinatura única.";
      updated.hero.floatingBadge = "ZERO COMPLACÊNCIA";
      updated.marquee = [
        { id: "m1", text: "TRAÇO DEFINITIVO", icon: "⚔️" },
        { id: "m2", text: "PIGMENTO PURO", icon: "🌑" },
        { id: "m3", text: "SEM ILUSÕES", icon: "👁️" },
        { id: "m4", text: "AUTENTICIDADE CRUA", icon: "⚡" },
      ];
    } else {
      updated.archetype = "luxury-editorial";
      updated.theme.accent = "#f59e0b";
      updated.theme.secondaryAccent = "#fbbf24";
      updated.theme.bg = "#0a0a0c";
      updated.theme.fontHeading = "serif";
      updated.theme.borderStyle = "glass";
      updated.hero.title = `A Experiência Autêntica na ${updated.businessName}`;
      updated.hero.subtitle = `${instruction.slice(0, 1).toUpperCase() + instruction.slice(1)}. Onde cada detalhe sensorial é lapidado com maestria.`;
      if (updated.manifesto) {
        updated.manifesto.bodyText = `${updated.manifesto.bodyText} Nosso compromisso permanente: ${instruction}.`;
      }
    }

    return updated;
  });

/**
 * 3. Salvar & Publicar a Landing Page Cinematográfica no Supabase
 */
export const saveCinematicPageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { data: CinematicPageData; pageId?: string; publish?: boolean }) => d)
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;
    const { data, pageId, publish = true } = input;
    const baseSlug = slugify(data.businessName || "pagina-cinematica");
    const suffix = crypto.randomUUID().slice(0, 5);
    const resolvedSlug = pageId ? undefined : `${baseSlug}-${suffix}`;

    const effectiveFont = (data.theme as any)?.fontFamily || data.theme?.fontHeading || "sans";
    const effectiveMode =
      data.theme?.mode ||
      (data.theme?.bg?.includes("#fff") || data.theme?.bg?.includes("#f8") ? "light" : "dark");
    const effectiveRadius =
      (data.theme as any)?.borderRadius || data.theme?.borderStyle || "rounded";
    const effectiveBoxEffect = (data.theme as any)?.boxEffect || "glass";
    const effectiveArchetype = data.archetype || (data.theme as any)?.archetype || "cinematic";

    const customThemeObj = {
      parallax: Boolean(data.theme.parallaxEnabled),
      hero_style: "cinematic",
      font: effectiveFont,
      fontFamily: effectiveFont,
      font_pair: effectiveFont,
      primary: data.theme.accent,
      accent: data.theme.accent,
      background: data.theme.bg,
      bg: data.theme.bg,
      mode: effectiveMode,
      archetype: effectiveArchetype,
      headingStyle: (data.theme as any)?.headingStyle || "default",
      borderRadius: effectiveRadius,
      border_radius:
        effectiveRadius === "sharp" ? "0px" : effectiveRadius === "pill" ? "28px" : "16px",
      boxEffect: effectiveBoxEffect,
    };

    const socialLinks = {
      is_demo: false,
      cinematic_data: {
        ...data,
        archetype: effectiveArchetype,
        theme: {
          ...data.theme,
          archetype: effectiveArchetype,
          fontFamily: effectiveFont,
          mode: effectiveMode,
          borderRadius: effectiveRadius,
          boxEffect: effectiveBoxEffect,
        },
      },
      niche: data.niche,
      address: data.address,
      opening_hours: data.openingHours,
      google_rating: data.rating,
      archetype: effectiveArchetype,
      theme: customThemeObj,
      custom_theme: customThemeObj,
    };

    let savedId = pageId;
    let savedSlug = "";

    if (savedId) {
      const { data: updated, error } = await supabase
        .from("bio_pages")
        .update({
          display_name: data.businessName || data.hero?.headline || "Minha Empresa",
          whatsapp: data.whatsapp || null,
          template_id: "cinematic-glass",
          cover_url: data.hero.backgroundImage,
          avatar_url: data.avatarUrl || null,
          description: data.hero.subtitle ? data.hero.subtitle.slice(0, 300) : null,
          published: publish,
          motion_enabled: true,
          motion_entrance: "rise",
          motion_ambient: "spotlight",
          motion_cta: "glow",
          social_links: socialLinks as any,
        })
        .eq("id", savedId)
        .eq("user_id", userId)
        .select("id, slug")
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar página: ${error.message}`);
      }
      savedSlug = updated.slug;
    } else {
      const { data: created, error } = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          display_name: data.businessName || data.hero?.headline || "Minha Empresa",
          slug: resolvedSlug!,
          whatsapp: data.whatsapp || null,
          template_id: "cinematic-glass",
          cover_url: data.hero.backgroundImage,
          avatar_url: data.avatarUrl || null,
          description: data.hero.subtitle ? data.hero.subtitle.slice(0, 300) : null,
          published: publish,
          theme: "midnight",
          motion_enabled: true,
          motion_entrance: "rise",
          motion_ambient: "spotlight",
          motion_cta: "glow",
          social_links: socialLinks as any,
        })
        .select("id, slug")
        .single();

      if (error || !created) {
        throw new Error(`Erro ao criar página: ${error?.message || "falha desconhecida"}`);
      }
      savedId = created.id;
      savedSlug = created.slug;
    }

    // Sincroniza os itens na tabela catalog_items (para alimentar catálogo, loja e pedidos nativamente)
    if (savedId && data.highlights && Array.isArray(data.highlights)) {
      const { error: deleteError } = await supabase
        .from("catalog_items")
        .delete()
        .eq("page_id", savedId);
      if (deleteError) {
        throw new Error(`Erro ao substituir os itens do catálogo: ${deleteError.message}`);
      }

      if (data.highlights.length > 0) {
        const catalogRows = data.highlights.map((item, idx) => {
          const rawPrice = item.price
            ? parseFloat(item.price.replace(/[^\d,.-]/g, "").replace(",", "."))
            : 0;
          return {
            page_id: savedId,
            title: item.title,
            description: item.description,
            price: isNaN(rawPrice) ? 0 : rawPrice,
            image_url: item.image || null,
            badge: item.badge || null,
            is_available: true,
            display_order: idx,
          };
        });
        const { error: insertError } = await supabase.from("catalog_items").insert(catalogRows);
        if (insertError) {
          throw new Error(`Erro ao salvar os itens do catálogo: ${insertError.message}`);
        }
      }
    }

    return {
      success: true,
      pageId: savedId,
      slug: savedSlug,
      publicUrl: `/p/${savedSlug}`,
    };
  });

/**
 * 4. Elaboração de Plano Criativo & Pitch de Conceitos (Opções A e B)
 */
/**
 * 4. Agente Diretor de Arte & Tech Lead Generativo
 * Reconhece intenções:
 * - "conversation": Troca de ideias, consultoria, responde dúvidas e debate design/ferramentas sem mexer no site
 * - "direct_update": Aplica mudanças cirúrgicas ao vivo na hora (deconstrução Anime.js, cores, blueprints, copy, cardápio)
 * - "proposal_plan": Gera Opções A e B quando o usuário pede explicitamente propostas/conceitos novos
 */
export const createCreativePitchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      businessName: string;
      niche: string;
      userMessage: string;
      currentData: CinematicPageData;
      conversationHistory?: Array<{ sender: "user" | "agent"; text: string }>;
      apiKey?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }): Promise<import("./types").CreativePitchResponse> => {
    const { businessName, niche, userMessage, currentData, conversationHistory = [] } = input;
    const instruction = (userMessage || "").trim();
    let lastProviderError = "O Gemini não retornou uma resposta válida.";

    try {
      const systemPrompt = `Você é o Agente Diretor de Arte Criativo, Arquiteto de Software e Parceiro de Design da plataforma EIA Link.
Você é uma IA generativa de altíssimo nível (com a mesma profundidade, naturalidade e fluidez que o Claude 3.7 Sonnet e ChatGPT 4o).
Você está dialogando em tempo real com o usuário no Cinematic Studio para conceber, debater e refinar a experiência digital de alta conversão do negócio "${businessName}" (Nicho: "${niche}").

ESTADO ATUAL DA PÁGINA (CinematicPageData):
${JSON.stringify(currentData, null, 2)}

SUA CAIXA DE FERRAMENTAS & RECURSOS NO SISTEMA:
1. ANIME.JS v4 & VISTA EXPLODIDA EM CAMADAS ('deconstruction'):
   - Permite ativar uma seção cinematográfica de "Vista Explodida" em camadas interativas com animação de desconstrução (Anime.js).
   - Exemplos ricos por nicho:
     * Arquitetura / Imobiliária: Fachada da casa -> Planta baixa estrutural (Cotas Técnicas, Elétrica/Hidráulica, Radier, Cobertura).
     * Gastronomia: Hambúrguer montado -> Camadas explodidas (Pão brioche selado, Cheddar inglês derretido, Blend 180g na brasa, Bacon artesanal defumado).
     * Automotivo / Mecânica: Veículo montado -> Chassi tubular, Motor V8 aspirado, Suspensão independente, Tração integral.
     * Saúde / Odontologia: Sorriso -> Arcada dentária, Implante osseointegrado, Guia cirúrgico digital.
     * Produtos / Calçados: Estilo Reebok NANO X3 -> Cabedal respirável, Entressola Floatride, Chassi TPU de estabilidade.
   - Quando o usuário pedir para criar/adicionar uma vista explodida, planta baixa ou desconstrução, configure o objeto 'deconstruction' com:
     headline, tagline, subtitle, category ("architecture" | "gastronomy" | "automotive" | "biotech" | "custom"), layers (array com 4 a 5 camadas com id, tag, icon, name, detail).

2. TECHNICAL BLUEPRINT ('blueprint') - ESTILO REEBOK NANO X3 / RAIO-X TÉCNICO:
   - Seção de especificações técnicas milimétricas com callouts flutuantes com coordenadas X/Y e tags [SPEC::01].
   - Campos: headline, tagline, subtitle, specs (array de callouts com id, tag, title, description, position).

3. MOTION LIBRARIES (Three.js, GSAP, Parallax GPU):
   - Capacidade de profundidade 3D (Three.js), scroll suave (GSAP) e parallax imersivo na capa ('theme.parallaxEnabled: true').

4. DESIGN SYSTEM & ESTÉTICA DE ALTO PADRÃO:
   - Padrão Lendora CRM SaaS: fundos escuros nobres (#09090b, #0a0a0c, #121217), bordas sutis com brilho suave (border-white/10), glassmorphism, tipografia limpa.
   - 5 Arquétipos: luxury-editorial (âmbar #f59e0b), clean-biotech (esmeralda #10b981), cyber-tech (ciano elétrico #00f0ff), dark-brutalist (titânio #ffffff), neo-pop-d2c (neon #ccff00).

5. COPYWRITING SENSORIAL (ZERO CLICHÊS):
   - Proibido usar "o melhor da cidade", "qualidade garantida". Use números reais, descrições sensoriais de dar água na boca ou autoridade técnica inquestionável.

CLASSIFICAÇÃO DE INTENÇÃO (INTENT RECOGNITION):
Analise o contexto e a mensagem do usuário e responda sob UMA das 3 modalidades:

MODALIDADE A: "conversation" (Dúvidas, Opiniões, Brainstorming, Consultoria de Design)
- Ative quando o usuário fizer perguntas, pedir sua opinião ("o que você acha?", "qual biblioteca usar?", "como podemos animar?", "dá pra fazer isso com animejs?", "me dá ideias", "como ficaria uma clínica?").
- AJA COMO UM PARCEIRO E TECH LEAD: converse abertamente com inteligência real, analise alternativas, cite as ferramentas do sistema (Anime.js, Three.js, GSAP, Lendora UI, Reebok NANO X3), proponha caminhos e pergunte como o usuário prefere proceder.
- NÃO altere os dados do site sem o comando dele.
- Retorne no JSON:
  {
    "actionType": "conversation",
    "agentMessage": "Sua resposta analítica, detalhada, empática e inspiradora conversando de igual para igual...",
    "suggestions": ["Sim, crie a vista explodida agora", "Mude as cores para preto grafite", "Me mostre mais ideias"]
  }

MODALIDADE B: "direct_update" (Instrução Direta, Modificação ou Criação Específica)
- Ative quando o usuário der um comando de alteração ou refinamento ("mude a cor para preto carvão e dourado", "adicione a seção de desconstrução da planta da casa com animejs", "coloque um menu com 4 opções gourmet", "troque a headline para algo focado em agendamento VIP", "ative o blueprint de raio-x", "coloque estilo escuro minimalista").
- APLIQUE AS ALTERAÇÕES DIRETAMENTE EM 'updatedData' (apenas os campos de CinematicPageData que mudaram ou foram adicionados).
- Retorne no JSON:
  {
    "actionType": "direct_update",
    "agentMessage": "Explicação elegante e empolgante do que você acabou de aplicar na página ao vivo...",
    "updatedData": {
      // Exemplo de campos que você alterou ou adicionou:
      // "theme": { "bg": "#0a0a0c", "accent": "#f59e0b", ... },
      // "hero": { "title": "...", "subtitle": "...", ... },
      // "deconstruction": { "headline": "...", "category": "architecture", "layers": [ ... ] },
      // "blueprint": { "headline": "...", "specs": [ ... ] },
      // "highlights": [ ... ]
    },
    "suggestions": ["Próximo ajuste", "Testar outra cor"]
  }

MODALIDADE C: "proposal_plan" (Geração de Novas Alternativas Conceituais / Pitch Completo)
- Ative SOMENTE quando o usuário pedir expressamente novos conceitos do zero ("crie duas opções conceituais", "proponha novos conceitos do zero", "quero ver duas abordagens diferentes").
- Retorne no JSON:
  {
    "actionType": "proposal_plan",
    "agentMessage": "Mensagem apresentando as duas propostas conceituais...",
    "plan": {
      "id": "plan_${Date.now()}",
      "conceptSummary": "...",
      "rationale": "...",
      "recommendedSections": [...],
      "options": [ { "id": "option_a", ... }, { "id": "option_b", ... } ]
    }
  }

RETORNE RIGOROSAMENTE E APENAS O JSON VÁLIDO.`;

      // Monta histórico de conversação com alternância correta de turnos (user / model)
      const validHistory = conversationHistory.filter((h) => h.text && h.text.trim().length > 0);
      const contentsPayload: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

      for (const turn of validHistory.slice(-8)) {
        const geminiRole = turn.sender === "agent" ? "model" : "user";
        const last = contentsPayload[contentsPayload.length - 1];
        if (last && last.role === geminiRole) {
          last.parts[0].text += `\n${turn.text}`;
        } else {
          contentsPayload.push({ role: geminiRole, parts: [{ text: turn.text }] });
        }
      }

      // Adiciona o turno atual do usuário
      if (
        contentsPayload.length > 0 &&
        contentsPayload[contentsPayload.length - 1].role === "user"
      ) {
        contentsPayload[contentsPayload.length - 1].parts[0].text += `\n${instruction}`;
      } else {
        contentsPayload.push({ role: "user", parts: [{ text: instruction }] });
      }

      const models = SITE_BUILDER_MODELS;
      for (const model of models) {
        try {
          const resp = await requestGemini(context.supabase, {
            action: "generateContent",
            model,
            apiKeyOverride: input.apiKey || undefined,
            knowledgeQuery: `${instruction}\n${businessName}\n${niche}`,
            payload: {
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: contentsPayload,
              generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
            },
          }, context.accessToken);

          if (resp.ok) {
            const resJson = await resp.json();
            const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput) {
              let cleaned = textOutput.trim();
              if (cleaned.startsWith("```json")) {
                cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
              } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
              }

              let parsed: any = null;
              try {
                parsed = JSON.parse(cleaned);
              } catch {
                const match = cleaned.match(/\{[\s\S]*\}/);
                if (match) {
                  try {
                    parsed = JSON.parse(match[0]);
                  } catch (e) {
                    console.warn("[CreativePitch] Falha ao parsear regex json:", e);
                  }
                }
              }

              if (parsed && (parsed.actionType || parsed.agentMessage)) {
                return {
                  actionType: parsed.actionType || "conversation",
                  agentMessage: parsed.agentMessage || textOutput,
                  updatedData: parsed.updatedData,
                  plan: parsed.plan,
                  suggestions: parsed.suggestions || [
                    "Aplicar essas alterações na página",
                    "Ativar seção com Anime.js",
                    "Refinar direção de arte",
                  ],
                };
              }

              // Se o Gemini gerou resposta conversacional direta sem JSON estrito:
              if (textOutput.trim().length > 5) {
                return {
                  actionType: "conversation",
                  agentMessage: textOutput
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim(),
                  suggestions: [
                    "Aplicar essas ideias no site",
                    "Ativar vista explodida (Anime.js)",
                    "Ajustar paleta de cores",
                  ],
                };
              }
            } else {
              lastProviderError = `Gemini retornou resposta vazia (${model}).`;
            }
          } else {
            const errBody = await resp.text();
            lastProviderError = `Gemini recusou a solicitação (HTTP ${resp.status}): ${errBody.slice(0, 500)}`;
            console.warn(`[CreativePitch] Erro HTTP ${resp.status} no modelo ${model}:`, errBody);
            if (resp.status === 400 || resp.status === 403) {
              if (errBody.includes("API_KEY_INVALID") || errBody.includes("API key not valid")) {
                return {
                  actionType: "conversation",
                  agentMessage: `⚠️ **A chave do Google Gemini conectada não é válida ou foi revogada.**\n\nPor favor, gere uma nova chave gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey) e clique em **🔑 Conectar IA** no topo da tela para atualizar.`,
                  suggestions: ["Abrir Google AI Studio", "Como pegar chave gratuita"],
                };
              }
              lastProviderError = `Gemini retornou conteúdo sem formato de resposta reconhecido (${model}).`;
            }
          }
        } catch (modelErr) {
          lastProviderError =
            modelErr instanceof Error ? modelErr.message : "Falha ao consultar o Gemini.";
          console.warn(`[CreativePitch] Falha com modelo ${model}:`, modelErr);
        }
      }
    } catch (err) {
      console.warn("[CreativePitch] Erro na chamada com IA:", err);
      throw new Error(
        `Não foi possível consultar o Gemini para editar o site: ${
          err instanceof Error ? err.message : "falha desconhecida"
        }`,
      );
    }

    console.warn(`[CreativePitch] Gemini não retornou resposta válida (${lastProviderError}). Executando fallback heurístico inteligente.`);

    // Heurística Fallback inteligente com Intent Classification se a API falhar
    const isQuestion = /\?|o que você acha|qual|como|opini|ideia|pense|dá pra|consegue|expli/i.test(
      instruction,
    );
    const isDeconstruction =
      /desconstru|planta|explodida|animejs|anime\.js|camada|camadas|hamb[uú]rguer|carro|ve[ií]culo|cl[ií]nica|odonto|casa/i.test(
        instruction,
      );
    const isBlueprint = /blueprint|raio-x|raio x|especificaç|specs|reebok/i.test(instruction);
    const isColorOrTheme =
      /cor|cores|paleta|fundo|preto|dourado|azul|verde|clean|escuro|claro|dark|light|tema/i.test(
        instruction,
      );
    const isProposal = /opç[õo]es|propostas|conceito|conceitos|pitch|duas opç/i.test(instruction);

    // 1. Fallback Conversacional (Responde e debate ideias)
    if (isQuestion && !isDeconstruction && !isProposal) {
      return {
        actionType: "conversation",
        agentMessage: `Excelente reflexão! No sistema nós temos o ecossistema perfeito para isso: podemos orquestrar o **Anime.js v4** para animações de física e desconstrução em camadas (como plantas baixas, cortes gastronômicos ou mecânica), o **Three.js** para rotação 3D interativa de produtos e a estética refinada do **Lendora CRM** com fundos em grafite profundo e bordas de vidro acetinado.

Se você quiser, posso ativar agora mesmo a seção de **Vista Explodida com Anime.js** ou ajustar a direção de arte da página. O que prefere que façamos primeiro?`,
        suggestions: [
          "Ativar seção de Vista Explodida (Anime.js)",
          "Ajustar paleta para estilo Lendora CRM",
          "Reescrever a headline com copywriting sensorial",
        ],
      };
    }

    // 2. Fallback de Atualização Direta - Deconstrução com Anime.js
    if (isDeconstruction) {
      const isArchitecture = /casa|planta|im[oó]vel|arquitetura/i.test(instruction);
      const isBurger = /hamb[uú]rguer|burger|lanche|comida/i.test(instruction);
      const isCar = /carro|ve[ií]culo|auto|moto/i.test(instruction);

      const category = isArchitecture
        ? "architecture"
        : isBurger
          ? "gastronomy"
          : isCar
            ? "automotive"
            : "custom";
      const headline = isArchitecture
        ? "Engenharia Arquitetônica Desconstruída"
        : isBurger
          ? "Arquitetura do Sabor em Camadas"
          : isCar
            ? "Engenharia e Performance Desconstruída"
            : "Precisão Estrutural em Camadas";

      const layers = isArchitecture
        ? [
            {
              id: "l_1",
              tag: "[CAMADA 01]",
              icon: "🏛️",
              name: "Cobertura & Conforto Térmico",
              detail: "Isolamento termoacústico e telhado com captação solar.",
            },
            {
              id: "l_2",
              tag: "[CAMADA 02]",
              icon: "📐",
              name: "Planta Baixa & Layout dos Ambientes",
              detail: "Integração fluida de espaços com iluminação natural.",
            },
            {
              id: "l_3",
              tag: "[CAMADA 03]",
              icon: "⚙️",
              name: "Infraestrutura Hidráulica & Automação",
              detail: "Tubulações inteligentes embutidas com redundância.",
            },
            {
              id: "l_4",
              tag: "[CAMADA 04]",
              icon: "🧱",
              name: "Fundações & Radier Estrutural",
              detail: "Cálculo milimétrico de carga para durabilidade de décadas.",
            },
          ]
        : isBurger
          ? [
              {
                id: "l_1",
                tag: "[CAMADA 01]",
                icon: "🍞",
                name: "Pão Brioche Selado na Manteiga",
                detail: "Massa leve e dourada com fermentação artesanal.",
              },
              {
                id: "l_2",
                tag: "[CAMADA 02]",
                icon: "🧀",
                name: "Cheddar Inglês Cremoso",
                detail: "Queijo derretido no ponto exato sobre a carne.",
              },
              {
                id: "l_3",
                tag: "[CAMADA 03]",
                icon: "🥩",
                name: "Blend Especial 180g na Brasa",
                detail: "Corte nobre com crostinha defumada e suculência máxima.",
              },
              {
                id: "l_4",
                tag: "[CAMADA 04]",
                icon: "🥓",
                name: "Bacon Crocante Artesanal",
                detail: "Fatias espessas defumadas por 8 horas em lenha nobre.",
              },
            ]
          : [
              {
                id: "l_1",
                tag: "[CAMADA 01]",
                icon: "✨",
                name: "Camada Superior & Acabamento",
                detail: "Superfície de alta precisão com acabamento aeroespacial.",
              },
              {
                id: "l_2",
                tag: "[CAMADA 02]",
                icon: "⚙️",
                name: "Mecanismo Central Ativo",
                detail: "Distribuição inteligente de força e absorção de impacto.",
              },
              {
                id: "l_3",
                tag: "[CAMADA 03]",
                icon: "🔬",
                name: "Núcleo de Engenharia & Rigidez",
                detail: "Estrutura principal projetada para máxima eficiência.",
              },
            ];

      return {
        actionType: "direct_update",
        agentMessage: `Pronto! Ativei ao vivo no Studio a seção de **Vista Explodida com Anime.js** (${headline}). As camadas foram sincronizadas com controles de interatividade para o cliente visualizar a estrutura técnica em detalhes.`,
        updatedData: {
          deconstruction: {
            headline,
            tagline: "VISTA EXPLODIDA INTERATIVA • ANIME.JS",
            subtitle:
              "Clique nas camadas para explorar cada elemento estrutural em detalhe e profundidade.",
            category,
            layers,
          },
        },
        suggestions: ["Ajustar as cores da página", "Reescrever a headline principal"],
      };
    }

    // 3. Fallback de Atualização Direta - Tema e Cores
    if (isColorOrTheme && !isProposal) {
      const isGold = /dourad|ouro|gold|luxo/i.test(instruction);
      const isBlue = /azul|blue|ciano/i.test(instruction);
      const isGreen = /verde|green|esmeralda/i.test(instruction);
      const isLight = /claro|light|branco/i.test(instruction);

      const accent = isGold ? "#f59e0b" : isBlue ? "#00f0ff" : isGreen ? "#10b981" : "#f59e0b";
      const bg = isLight ? "#f8fafc" : "#09090b";

      return {
        actionType: "direct_update",
        agentMessage: `Apliquei a nova paleta de design diretamente na sua página ao vivo! O fundo foi ajustado para ${isLight ? "modo claro editorial" : "modo escuro Lendora CRM (#09090b)"} com acento em ${accent}.`,
        updatedData: {
          theme: {
            ...currentData.theme,
            bg,
            accent,
            borderStyle: "glass",
            mode: isLight ? "light" : "dark",
          },
        },
        suggestions: ["Ativar Vista Explodida (Anime.js)", "Ajustar textos do Hero"],
      };
    }

    // 4. Fallback de Proposta Conceitual Completa (Opção A e Opção B)
    const planId = `plan_${Date.now()}`;
    const optionA: CinematicConceptOption = {
      id: "option_a",
      name: "Atmosfera Nobre & Herança Sensorial",
      tagline: "CLÁSSICO SENSORIAL",
      palette: { bg: "#0a0a0c", accent: "#f59e0b", cardBg: "#121217" },
      typography: "serif",
      vibe: "Elegante, intimista com acabamento refinado e acolhedor.",
      heroHeadline: `A Excelência Autêntica da ${businessName}`,
      previewData: {
        ...currentData,
        archetype: "luxury-editorial",
        theme: {
          ...currentData.theme,
          bg: "#0a0a0c",
          accent: "#f59e0b",
          fontHeading: "serif",
          borderStyle: "glass",
        },
        hero: {
          ...currentData.hero,
          title: `A Excelência Autêntica da ${businessName}`,
          subtitle:
            "Onde o tempo desacelera para dar lugar à contemplação dos sentidos, atendimento com hora marcada e à excelência autoral.",
          floatingBadge: "★ 4.9 NO GOOGLE • EXCLUSIVIDADE",
        },
      },
    };

    const optionB: CinematicConceptOption = {
      id: "option_b",
      name: "Vanguarda Tecnológica & Linhas Puras",
      tagline: "MINIMALISMO ARROJADO",
      palette: { bg: "#070709", accent: "#38bdf8", cardBg: "#0f0f14" },
      typography: "sans",
      vibe: "Estética contemporânea, rigor milimétrico e alta autoridade.",
      heroHeadline: `A Nova Assinatura da ${businessName}`,
      previewData: {
        ...currentData,
        archetype: "cyber-tech",
        theme: {
          ...currentData.theme,
          bg: "#070709",
          accent: "#38bdf8",
          fontHeading: "sans",
          borderStyle: "pill",
        },
        hero: {
          ...currentData.hero,
          title: `A Nova Assinatura da ${businessName}`,
          subtitle:
            "Design contemporâneo, rigor milimétrico e precisão para quem não aceita o comum. Atendimento com agendamento direto.",
          floatingBadge: "● VAGAS PARA ESTA SEMANA",
        },
      },
    };

    return {
      actionType: "proposal_plan",
      agentMessage: `Analisei o posicionamento da ${businessName} e estruturei duas abordagens conceituais exclusivas. A Opção A traz uma narrativa contemplativa e calorosa com tipografia editorial. A Opção B aposta em contraste contemporâneo e linhas puras. Você pode espiar a prévia de qualquer uma no canvas ao vivo ou aprovar a sua favorita para aplicá-la em definitivo.`,
      plan: {
        id: planId,
        conceptSummary: `Direção de arte sob medida com 2 variações conceituais para a ${businessName}.`,
        rationale: `Harmonização entre estética visual de padrão internacional e gatilhos de conversão VIP.`,
        recommendedSections: [
          "Hero Cinematográfico com Parallax GPU",
          "Marquee Contínuo",
          "Bento Grid de Pilares de Distinção",
          "Manifesto de Essência",
          "Galeria em Tela Cheia com Lightbox",
          "Criações em Destaque",
          "Comparativo de Vantagens",
          "FAQ & Ação VIP no WhatsApp",
        ],
        options: [optionA, optionB],
      },
      suggestions: [
        "Aprovar Opção A",
        "Aprovar Opção B",
        "Ativar seção de Vista Explodida (Anime.js)",
      ],
    };
  });

export interface ExtractedServiceItem {
  title: string;
  description: string;
  price?: string;
  badge?: string;
}

export interface ExtractedPdfDocumentResult {
  summary: string;
  items: ExtractedServiceItem[];
}

/**
 * 5. Extração e Estruturação de Cardápios, Tabelas de Preços e Catálogos de Documentos PDF
 */
export const extractServicesFromPdfTextFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { text: string; businessName?: string; niche?: string }) => d)
  .handler(async ({ data, context }): Promise<ExtractedPdfDocumentResult> => {
    const { text, businessName = "Empresa", niche = "Geral" } = data;
    const cleanText = (text || "").trim();

    if (!cleanText) {
      return {
        summary: "Documento sem texto legível detectado.",
        items: [],
      };
    }

    try {
      const prompt = `Você é um Especialista em Extração e Estruturação de Cardápios, Tabelas de Preços e Catálogos Comerciais da EIA Digital.
Analise com atenção o texto abaixo, extraído diretamente de um documento comercial (cardápio, tabela de procedimentos, folder ou catálogo):

TEXTO DO DOCUMENTO:
"""
${cleanText.slice(0, 16000)}
"""

DADOS DA EMPRESA:
- Nome: "${businessName}"
- Nicho: "${niche}"

SUA MISSÃO:
1. Identifique os 3 a 6 principais itens ou serviços de maior valor comercial no documento.
2. Para cada item, extraia:
   - "title": Nome claro, profissional e comercial do prato, serviço ou procedimento (sem códigos numéricos soltos).
   - "description": Descrição atraente e sensorial em 1 a 2 frases concisas destacando o benefício ou os ingredientes/técnica.
   - "price": Preço formatado em moeda (ex: "R$ 150,00", "R$ 49,90", "A partir de R$ 90,00" ou "Sob Consulta" se não houver valor explícito).
   - "badge": Selo curto de destaque de 1 a 2 palavras (ex: "Mais Pedido", "Especialidade", "Destaque", "Exclusivo", "Novo").
3. "summary": Uma frase síntese descrevendo o que foi lido do documento (ex: "Cardápio com foco em cortes nobres e entradas artesanais" ou "Tabela de procedimentos estéticos faciais e corporais").

RETORNE RIGOROSAMENTE APENAS O SEGUINTE JSON (SEM BLOCOS DE MARKDOWN OU TEXTOS ADICIONAIS):
{
  "summary": "string",
  "items": [
    {
      "title": "string",
      "description": "string",
      "price": "string",
      "badge": "string"
    }
  ]
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await requestGemini(context.supabase, {
        action: "generateContent",
        model: "gemini-2.5-flash",
        payload: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        },
      }, context.accessToken);

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const cleanJson = raw
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return {
              summary: parsed.summary || `Serviços extraídos do documento de ${businessName}.`,
              items: parsed.items.map((it: any) => ({
                title: String(it.title || "Item Especializado").trim(),
                description: String(
                  it.description || "Atendimento e experiência de alta qualidade.",
                ).trim(),
                price: it.price ? String(it.price).trim() : "Sob Consulta",
                badge: it.badge ? String(it.badge).trim() : "Destaque",
              })),
            };
          }
        }
      }
    } catch (geminiErr) {
      console.warn("[cinematic.functions] Falha na síntese do documento com Gemini:", geminiErr);
    }

    // Fallback heurístico inteligente caso não haja API ou ocorra falha de rede
    const lines = cleanText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    const pricePattern = /(?:R\$\s*[\d.,]+|\b\d+[,.]\d{2}\b)/i;
    const candidates: ExtractedServiceItem[] = [];

    for (let i = 0; i < lines.length && candidates.length < 5; i++) {
      const line = lines[i];
      const priceMatch = line.match(pricePattern);
      if (priceMatch) {
        const titleCandidate = line
          .replace(pricePattern, "")
          .replace(/[-–|:.]+/g, " ")
          .trim();
        if (titleCandidate.length >= 3 && titleCandidate.length <= 60) {
          candidates.push({
            title: titleCandidate,
            description:
              lines[i + 1] && lines[i + 1].length < 120
                ? lines[i + 1]
                : "Procedimento e experiência de padrão exclusivo.",
            price: priceMatch[0].startsWith("R$") ? priceMatch[0] : `R$ ${priceMatch[0]}`,
            badge: "Destaque",
          });
        }
      }
    }

    return {
      summary:
        candidates.length > 0
          ? `Identificados ${candidates.length} itens comerciais no documento.`
          : "Documento processado com sucesso.",
      items:
        candidates.length > 0
          ? candidates
          : [
              {
                title: "Procedimento Especializado",
                description: "Atendimento completo com rigor e excelência técnica.",
                price: "Sob Consulta",
                badge: "Principal",
              },
            ],
    };
  });
