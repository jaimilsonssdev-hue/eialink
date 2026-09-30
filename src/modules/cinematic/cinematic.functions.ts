import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CinematicPageData } from "./types";
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
   - Preserve estritamente WhatsApp, endereço, nota de avaliações, nome da empresa e fotos reais enviadas.
   - Preserve 'backgroundVideo' no hero se já existir.

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

