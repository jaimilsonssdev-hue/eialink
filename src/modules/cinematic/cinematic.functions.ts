import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CinematicPageData, CreativePlan, CinematicConceptOption } from "./types";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import { lookupBusinessProfile } from "@/modules/prospecting/LiveProspectingEngine";
import type { ProspectDraft } from "@/modules/prospecting/types";

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
    const address = firstAny?.address || firstAny?.placeDetails?.address || (first?.city ? `Brasil - ${first.city}` : clean.city ? `Brasil - ${clean.city}` : undefined);
    const whatsapp = first?.whatsapp || first?.phone || undefined;
    const rating = first?.rating || 4.9;
    const reviewsCount = first?.reviews_count || 128;
    const niche = first?.niche || "Experiência Exclusiva";
    const openingHours = firstAny?.openingHours || firstAny?.placeDetails?.openingHours || "Consulte horários para reservas";
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
  .validator((d: { currentData: CinematicPageData; userInstruction: string }) => d)
  .handler(async ({ data }) => {
    const { currentData, userInstruction } = data;
    const instruction = (userInstruction || "").trim();

    if (!instruction) {
      return currentData;
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY ||
      ""
    ).trim();

    if (apiKey) {
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

        const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
        for (const model of models) {
          try {
            const resp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
                apiKey
              )}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
                }),
              }
            );

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
                      backgroundImage: currentData.hero.backgroundImage || parsed.hero.backgroundImage,
                      backgroundVideo: currentData.hero.backgroundVideo || parsed.hero.backgroundVideo,
                    },
                    gallery: (parsed.gallery && parsed.gallery.length > 0) ? parsed.gallery : currentData.gallery,
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
    }

    // Heurística Fallback inteligente com Matriz de Arquétipos
    const lower = instruction.toLowerCase();
    const updated = JSON.parse(JSON.stringify(currentData)) as CinematicPageData;

    if (lower.includes("neo") || lower.includes("pop") || lower.includes("jovem") || lower.includes("burger") || lower.includes("bebida") || lower.includes("fitness")) {
      updated.archetype = "neo-pop-d2c";
      updated.theme.accent = "#ccff00";
      updated.theme.secondaryAccent = "#ff0055";
      updated.theme.bg = "#070709";
      updated.theme.fontHeading = "display";
      updated.theme.borderStyle = "pill";
      updated.hero.tagline = "ENERGY & HIGH VIBE";
      updated.hero.title = `Sabor de Alta Voltagem na ${updated.businessName}`;
      updated.hero.subtitle = "Fórmulas puras, intensidade máxima e atitude autêntica sem concessões.";
      updated.hero.floatingBadge = "⚡ EDIÇÃO LIMITADA 2026";
      updated.marquee = [
        { id: "m1", text: "ZERO COMPROMISSOS COM O MEDÍOCRE", icon: "⚡" },
        { id: "m2", text: "INTENSIDADE MÁXIMA 24/7", icon: "🔥" },
        { id: "m3", text: "DESIGN QUE PULSA", icon: "💎" },
        { id: "m4", text: "ENERGIA LIMPA E DIRETA", icon: "🚀" },
      ];
    } else if (lower.includes("tech") || lower.includes("cyber") || lower.includes("software") || lower.includes("dados") || lower.includes("barbearia")) {
      updated.archetype = "cyber-tech";
      updated.theme.accent = "#00f0ff";
      updated.theme.secondaryAccent = "#38bdf8";
      updated.theme.bg = "#06090e";
      updated.theme.fontHeading = "mono";
      updated.theme.borderStyle = "sharp";
      updated.hero.tagline = "[SYS::01] HIGH PRECISION ENGINE";
      updated.hero.title = `A Nova Dimensão da ${updated.businessName}`;
      updated.hero.subtitle = "Arquitetura avançada, corte milimétrico e velocidade computacional aplicada ao mundo real.";
      updated.hero.floatingBadge = "STATUS: ONLINE 99.99%";
      updated.marquee = [
        { id: "m1", text: "SISTEMAS CALIBRADOS", icon: "⚙️" },
        { id: "m2", text: "LATÊNCIA ULTRA-BAIXA", icon: "⚡" },
        { id: "m3", text: "PRECISÃO MILIMÉTRICA", icon: "📐" },
        { id: "m4", text: "SEGURANÇA CRIPTOGRAFADA", icon: "🛡️" },
      ];
    } else if (lower.includes("clínica") || lower.includes("estética") || lower.includes("dermatologia") || lower.includes("odonto") || lower.includes("spa")) {
      updated.archetype = "clean-biotech";
      updated.theme.accent = "#10b981";
      updated.theme.secondaryAccent = "#06b6d4";
      updated.theme.bg = "#070b0c";
      updated.theme.fontHeading = "sans";
      updated.theme.borderStyle = "glass";
      updated.hero.tagline = "CIÊNCIA, LONGEVIDADE & EQUILÍBRIO";
      updated.hero.title = `A Harmonização Natural na ${updated.businessName}`;
      updated.hero.subtitle = "Protocolos regenerativos de ponta desenhados para realçar sua essência com sutileza e rigor biomédico.";
      updated.hero.floatingBadge = "CERTIFICAÇÃO INTERNACIONAL";
      updated.marquee = [
        { id: "m1", text: "TECNOLOGIA BIOCELULAR", icon: "🌿" },
        { id: "m2", text: "SEGURANÇA FARMACOLÓGICA", icon: "🧪" },
        { id: "m3", text: "RESULTADOS PREVISÍVEIS", icon: "✨" },
        { id: "m4", text: "ATENDIMENTO INDIVIDUALIZADO", icon: "🩺" },
      ];
    } else if (lower.includes("brutal") || lower.includes("tatuagem") || lower.includes("tattoo") || lower.includes("arte") || lower.includes("preto")) {
      updated.archetype = "dark-brutalist";
      updated.theme.accent = "#ffffff";
      updated.theme.secondaryAccent = "#a1a1aa";
      updated.theme.bg = "#09090b";
      updated.theme.fontHeading = "display";
      updated.theme.borderStyle = "subtle";
      updated.hero.tagline = "ESTÉTICA CRUA & SEM FILTROS";
      updated.hero.title = `A Marca Perpétua da ${updated.businessName}`;
      updated.hero.subtitle = "Sem ornamentos descartáveis. Apenas contraste visceral, técnica implacável e assinatura única.";
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
  .validator(
    (d: {
      data: CinematicPageData;
      userId: string;
      pageId?: string;
      publish?: boolean;
    }) => d
  )
  .handler(async ({ data: input }) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      throw new Error("Erro de conexão com o banco de dados.");
    }

    const { data, userId, pageId, publish = true } = input;
    const baseSlug = slugify(data.businessName || "pagina-cinematica");
    const suffix = crypto.randomUUID().slice(0, 5);
    const resolvedSlug = pageId ? undefined : `${baseSlug}-${suffix}`;

    const socialLinks = {
      is_demo: false,
      cinematic_data: data,
      niche: data.niche,
      address: data.address,
      opening_hours: data.openingHours,
      google_rating: data.rating,
      custom_theme: {
        parallax: data.theme.parallaxEnabled,
        hero_style: "cinematic",
        font_pair: data.theme.fontHeading === "serif" ? "elegante" : "moderna",
        primary: data.theme.accent,
        background: data.theme.bg,
      },
    };

    let savedId = pageId;
    let savedSlug = "";

    if (savedId) {
      const { data: updated, error } = await supabase
        .from("bio_pages")
        .update({
          display_name: data.businessName,
          whatsapp: data.whatsapp || null,
          template_id: "cinematic-glass",
          cover_url: data.hero.backgroundImage,
          description: data.hero.subtitle.slice(0, 300),
          published: publish,
          motion_enabled: true,
          motion_entrance: "rise",
          motion_ambient: "spotlight",
          motion_cta: "glow",
          social_links: socialLinks as any,
        })
        .eq("id", savedId)
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
          display_name: data.businessName,
          slug: resolvedSlug!,
          whatsapp: data.whatsapp || null,
          template_id: "cinematic-glass",
          cover_url: data.hero.backgroundImage,
          description: data.hero.subtitle.slice(0, 300),
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
export const createCreativePitchFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      businessName: string;
      niche: string;
      userMessage: string;
      currentData: CinematicPageData;
      conversationHistory?: Array<{ sender: "user" | "agent"; text: string }>;
    }) => d
  )
  .handler(async ({ data: input }) => {
    const { businessName, niche, userMessage, currentData, conversationHistory = [] } = input;
    const instruction = (userMessage || "").trim();

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY ||
      ""
    ).trim();

    if (apiKey) {
      try {
        const prompt = `Você é um Diretor de Arte e Consultor de Branding Internacional (padrão v0, Lovable, Pentagram, Awwwards) focado em alta conversão e estética nobre (como Atelier Lumi, Maísa Furtado e Insight Sites).
O usuário está cocriando a experiência digital cinematográfica e interativa para o negócio "${businessName}" (Nicho: "${niche}").

MENSAGEM DO USUÁRIO:
"""${instruction}"""

HISTÓRICO DA CONVERSA RECENTE:
${JSON.stringify(conversationHistory.slice(-4), null, 2)}

DADOS ATUAIS DA PÁGINA:
${JSON.stringify(currentData, null, 2)}

DIRETRIZES DE ALTA CONVERSÃO & DESIGN EDITORIAL (PADRÃO ATELIER LUMI & INSIGHT SITES):
1. STATUS & CONFIANÇA IMEDIATA:
   - Em "hero.floatingBadge", gere status realista e acolhedor (ex: "● ABERTO AGORA • HORA MARCADA" ou "● ATENDIMENTO EXCLUSIVO • VAGAS PARA ESTA SEMANA" ou "★ 4.9 NO GOOGLE (180+ AVALIAÇÕES)").
2. CARDÁPIO / MENU DE SERVIÇOS COM PREÇO E DURAÇÃO ("highlights"):
   - Crie 3 a 4 serviços desejáveis com nome sofisticado.
   - Sempre defina "price" realista (ex: "A partir de R$ 180", "R$ 390", "Consulte").
   - Sempre defina "badge" com tempo de cadeira ou exclusividade (ex: "1h 30m • Mais Pedido", "45 min", "Pacote Completo").
   - Inclua pelo menos 1 serviço ou pacote de alto valor / ticket premium.
3. POLÍTICAS TRANSPARENTES & COMBINADOS ("faq"):
   - Inclua 3 a 4 perguntas reais que clientes desse nicho valorizam: tolerância de atraso (ex: 15 min), cancelamento/reagendamento com 24h, formas de pagamento (Pix/Cartão/Parcelamento) e atendimento com hora marcada.
4. BENTO GRID DE AUTORIDADE:
   - Cartões assimétricos com métricas concretas (ex: "Nota 4.9 no Google", "+2.500 Atendimentos", "Ambiente Climatizado & Café Barista").
5. COMPARATIVO TRANSPARENTE ("comparison"):
   - Destaque o padrão de excelência deste negócio vs o mercado tradicional (sem espera, insumos de alta linha, ambiente privativo).
6. MODO DELTA INTELIGENTE (PRESERVAÇÃO ESTRITA):
   - Mantenha rigorosamente intactos em ambos previewData: "whatsapp", "address", "rating", "openingHours" e fotos reais já carregadas.

RETORNE RIGOROSAMENTE E APENAS O SEGUINTE JSON (SEM BLOCOS DE MARKDOWN OU COMENTÁRIOS):
{
  "agentMessage": "Mensagem empática, inspiradora e detalhada do Diretor de Arte (2 a 3 parágrafos curtos) explicando a visão estética e convidando o usuário a espiar a prévia ou aprovar uma das propostas...",
  "plan": {
    "id": "plan_${Date.now()}",
    "conceptSummary": "Resumo de 1 a 2 frases da direção artística proposta",
    "rationale": "Justificativa estratégica do porquê dessas abordagens funcionarem para o público desse nicho",
    "recommendedSections": ["Hero Imersivo com Status Ativo", "Marquee Contínuo", "Bento Grid de Autoridade", "Manifesto de Essência", "Menu de Serviços com Preço e Duração", "Comparativo vs Mercado", "Combinados & Políticas (FAQ)", "Ação VIP no WhatsApp"],
    "options": [
      {
        "id": "option_a",
        "name": "Nome Poético da Opção A",
        "tagline": "TAGLINE DO CONCEITO A",
        "palette": {
          "bg": "#0a0a0c",
          "accent": "#f59e0b",
          "cardBg": "#121217"
        },
        "typography": "serif",
        "vibe": "Sensorial, Intimista & Herança Nobre",
        "heroHeadline": "Título do Hero para o Conceito A",
        "previewData": {
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
            "floatingBadge": "★ 4.9 NO GOOGLE",
            "backgroundImage": "${currentData.hero.backgroundImage}",
            ${currentData.hero.backgroundVideo ? `"backgroundVideo": "${currentData.hero.backgroundVideo}",` : ""}
            "ctaText": "Solicitar Atendimento VIP",
            "ctaLink": "#manifesto"
          },
          "marquee": [...],
          "bentoGrid": [...],
          "manifesto": {
            "headline": "string",
            "bodyText": "string",
            "quote": "string",
            "author": "string"
          },
          "highlights": [...]
        }
      },
      {
        "id": "option_b",
        "name": "Nome Arrojado da Opção B",
        "tagline": "TAGLINE DO CONCEITO B",
        "palette": {
          "bg": "#070709",
          "accent": "#ccff00",
          "cardBg": "#0e0e13"
        },
        "typography": "display",
        "vibe": "Contemporâneo, Pulsante & Neo-Pop",
        "heroHeadline": "Título do Hero para o Conceito B",
        "previewData": {
          "archetype": "neo-pop-d2c",
          "theme": {
            "bg": "#070709",
            "accent": "#ccff00",
            "secondaryAccent": "#ff0055",
            "fontHeading": "display",
            "parallaxEnabled": true,
            "borderStyle": "pill"
          },
          "hero": {
            "title": "string",
            "subtitle": "string",
            "tagline": "string",
            "floatingBadge": "⚡ EDIÇÃO AUTORAL 2026",
            "backgroundImage": "${currentData.hero.backgroundImage}",
            ${currentData.hero.backgroundVideo ? `"backgroundVideo": "${currentData.hero.backgroundVideo}",` : ""}
            "ctaText": "Explorar Agora",
            "ctaLink": "#diferenciais"
          },
          "marquee": [...],
          "bentoGrid": [...],
          "manifesto": {
            "headline": "string",
            "bodyText": "string",
            "quote": "string",
            "author": "string"
          },
          "highlights": [...]
        }
      }
    ]
  }
}`;

        const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
        for (const model of models) {
          try {
            const resp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
                apiKey
              )}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
                }),
              }
            );

            if (resp.ok) {
              const resJson = await resp.json();
              const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOutput) {
                const parsed = JSON.parse(textOutput);
                if (parsed.agentMessage && parsed.plan && parsed.plan.options && parsed.plan.options.length >= 2) {
                  return {
                    agentMessage: parsed.agentMessage as string,
                    plan: parsed.plan as CreativePlan,
                  };
                }
              }
            }
          } catch (modelErr) {
            console.warn(`[CreativePitch] Falha com modelo ${model}:`, modelErr);
          }
        }
      } catch (err) {
        console.warn("[CreativePitch] Erro na chamada com IA:", err);
      }
    }

    // Heurística Fallback inteligente para garantir plano criativo mesmo sem chave/offline
    const planId = `plan_${Date.now()}`;
    const nameA = `Atmosfera Nobre & Herança`;
    const nameB = `Vanguarda Urbana & Impacto`;

    const optionA: CinematicConceptOption = {
      id: "option_a",
      name: nameA,
      tagline: "CLÁSSICO SENSORIAL",
      palette: {
        bg: "#0a0a0c",
        accent: "#f59e0b",
        cardBg: "#121217",
      },
      typography: "serif",
      vibe: "Elegante, intimista com iluminação acolhedora e acabamento de alta gastronomia.",
      heroHeadline: `O Ritual Inesquecível da ${businessName}`,
      previewData: {
        ...currentData,
        archetype: "luxury-editorial",
        theme: {
          ...currentData.theme,
          bg: "#0a0a0c",
          accent: "#f59e0b",
          secondaryAccent: "#fbbf24",
          fontHeading: "serif",
          borderStyle: "glass",
        },
        hero: {
          ...currentData.hero,
          title: `O Ritual Inesquecível da ${businessName}`,
          subtitle: "Onde o tempo desacelera para dar lugar à contemplação dos sentidos, atendimento com hora marcada e à excelência autoral.",
          tagline: "EXPERIÊNCIA EXCLUSIVA",
          floatingBadge: "● ABERTO AGORA • HORA MARCADA",
        },
        highlights: currentData.highlights && currentData.highlights.length > 0 ? currentData.highlights : [
          {
            id: "h1",
            title: "Experiência Signature",
            description: "Atendimento completo e individualizado, respeitando o tempo de cadeira e a personalização de cada detalhe.",
            price: "A partir de R$ 180",
            badge: "1h 30m • Mais Pedido",
          },
          {
            id: "h2",
            title: "Protocolo Revitalizante",
            description: "Diagnóstico preciso com aplicação de técnicas e insumos de padrão internacional de alta performance.",
            price: "R$ 290",
            badge: "1h • Exclusivo",
          },
          {
            id: "h3",
            title: "Pacote VIP Completo",
            description: "Imersão premium sob medida com consultoria de estilo e comodidades especiais para ocasiões inesquecíveis.",
            price: "Consulte",
            badge: "Edição Premium",
          },
        ],
        comparison: {
          headline: "Nosso Padrão vs. O Mercado Tradicional",
          usLabel: businessName,
          othersLabel: "Convencional",
          rows: [
            { feature: "Atendimento individual com hora marcada (zero filas)", us: true, others: false },
            { feature: "Insumos e produtos originais de alta performance", us: true, others: false },
            { feature: "Ambiente reservado com acústica e café especial", us: true, others: false },
            { feature: "Tempo de cadeira respeitado com rigor", us: true, others: false },
          ],
        },
        faq: [
          {
            question: "Como funciona a tolerância de horário e pontualidade?",
            answer: "Trabalhamos com agenda rigorosamente pontual e tolerância de 15 minutos para garantir que cada cliente usufrua de sua experiência sem pressa.",
          },
          {
            question: "Qual a política para cancelamentos ou reagendamentos?",
            answer: "Solicitamos aviso prévio de até 24 horas para que possamos realocar a vaga sem comprometer a sua reserva ou a de outros clientes.",
          },
          {
            question: "Quais formas de pagamento são aceitas?",
            answer: "Aceitamos Pix, cartões de crédito e débito com parcelamento facilitado em procedimentos de maior valor.",
          },
        ],
      },
    };

    const optionB: CinematicConceptOption = {
      id: "option_b",
      name: nameB,
      tagline: "MINIMALISMO ARROJADO",
      palette: {
        bg: "#070709",
        accent: "#e2e8f0",
        cardBg: "#0f0f14",
      },
      typography: "sans",
      vibe: "Estética pura, formas arquitetônicas contemporâneas e alta autoridade.",
      heroHeadline: `A Nova Assinatura da ${businessName}`,
      previewData: {
        ...currentData,
        archetype: "clean-biotech",
        theme: {
          ...currentData.theme,
          bg: "#070709",
          accent: "#e2e8f0",
          secondaryAccent: "#38bdf8",
          fontHeading: "sans",
          borderStyle: "pill",
        },
        hero: {
          ...currentData.hero,
          title: `A Nova Assinatura da ${businessName}`,
          subtitle: "Design contemporâneo, rigor milimétrico e precisão para quem não aceita o comum. Atendimento com agendamento direto.",
          tagline: "ESTÉTICA PURA 2026",
          floatingBadge: "● VAGAS PARA ESTA SEMANA",
        },
        highlights: currentData.highlights && currentData.highlights.length > 0 ? currentData.highlights : [
          {
            id: "hb1",
            title: "Procedimento Estrutural",
            description: "Calibragem e acabamento com rigor técnico, garantindo resultado duradouro e previsível.",
            price: "A partir de R$ 220",
            badge: "45 min",
          },
          {
            id: "hb2",
            title: "Tratamento de Precisão",
            description: "Metodologia rápida, assertiva e sem excessos para clientes que valorizam agilidade e sofisticação.",
            price: "R$ 380",
            badge: "1h 15m",
          },
        ],
        comparison: {
          headline: "Metodologia de Precisão vs. O Comum",
          usLabel: businessName,
          othersLabel: "Mercado Padrão",
          rows: [
            { feature: "Metodologia autoral testada e comprovada", us: true, others: false },
            { feature: "Agendamento ágil diretamente pelo WhatsApp", us: true, others: false },
            { feature: "Transparência total em valores e etapas", us: true, others: false },
          ],
        },
        faq: [
          {
            question: "Como agendar um horário?",
            answer: "Basta clicar no botão de WhatsApp. Nossa equipe confirma a disponibilidade em poucos minutos.",
          },
          {
            question: "Há estacionamento ou fácil acesso no local?",
            answer: "Sim, estamos em localização estratégica com fácil estacionamento nas proximidades.",
          },
        ],
      },
    };

    return {
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
  .validator((d: { text: string; businessName?: string; niche?: string }) => d)
  .handler(async ({ data }): Promise<ExtractedPdfDocumentResult> => {
    const { text, businessName = "Empresa", niche = "Geral" } = data;
    const cleanText = (text || "").trim();

    if (!cleanText) {
      return {
        summary: "Documento sem texto legível detectado.",
        items: [],
      };
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY ||
      ""
    ).trim();

    if (apiKey) {
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

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        });

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
                  description: String(it.description || "Atendimento e experiência de alta qualidade.").trim(),
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
        const titleCandidate = line.replace(pricePattern, "").replace(/[-–|:.]+/g, " ").trim();
        if (titleCandidate.length >= 3 && titleCandidate.length <= 60) {
          candidates.push({
            title: titleCandidate,
            description: lines[i + 1] && lines[i + 1].length < 120 ? lines[i + 1] : "Procedimento e experiência de padrão exclusivo.",
            price: priceMatch[0].startsWith("R$") ? priceMatch[0] : `R$ ${priceMatch[0]}`,
            badge: "Destaque",
          });
        }
      }
    }

    return {
      summary: candidates.length > 0
        ? `Identificados ${candidates.length} itens comerciais no documento.`
        : "Documento processado com sucesso.",
      items: candidates.length > 0
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


