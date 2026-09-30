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
        const prompt = `Você é um Diretor de Arte e Copywriter de Luxo internacional para marcas de prestígio.
O usuário está construindo uma Landing Page Cinematográfica com narrativa de Scrollytelling para o negócio "${currentData.businessName}" (Nicho: "${currentData.niche}").

DADOS ATUAIS DA PÁGINA:
${JSON.stringify(currentData, null, 2)}

INSTRUÇÃO DE DIREÇÃO DE ARTE DO USUÁRIO:
"""
${instruction}
"""

SUA MISSÃO:
Reescreva e refine os textos da página (hero, manifesto com headline e citação, destaques com títulos e descrições nobres, cores e tipografia) para atender com perfeição ao pedido do usuário.
- Se o usuário pedir um tom específico (ex: "intimista noturno", "minimalista solar", "rústico artesanal", "moda italiana"), adeque a paleta de cores (accent hexadecimal e bg escuro), a tipografia ('serif' para luxo/clássico, 'sans' para moderno/minimalista, 'display' para imponente/impacto) e todo o vocabulário sensorial.
- Mantenha imagens existentes a menos que não façam sentido, ou sugira URLs de imagens de alta resolução do Unsplash pertinentes ao nicho se apropriado.
- NÃO invente telefones ou endereços; preserve whatsapp e endereço existentes.

RETORNE RIGOROSAMENTE E APENAS O JSON NO FORMATO DE CinematicPageData VÁLIDO, SEM TEXTO ADICIONAL OU MARKDOWN CODEBLOCK:
{
  "businessName": "${currentData.businessName}",
  "niche": "${currentData.niche}",
  "whatsapp": "${currentData.whatsapp}",
  "address": "${currentData.address || ""}",
  "rating": ${currentData.rating || 4.9},
  "openingHours": "${currentData.openingHours || ""}",
  "theme": {
    "bg": "#0a0a0c",
    "accent": "#f59e0b",
    "fontHeading": "serif",
    "parallaxEnabled": true
  },
  "hero": {
    "title": "string",
    "subtitle": "string",
    "tagline": "string",
    "backgroundImage": "string",
    "ctaText": "string",
    "ctaLink": "#manifesto"
  },
  "manifesto": {
    "headline": "string",
    "bodyText": "string",
    "quote": "string",
    "author": "string"
  },
  "gallery": [...],
  "highlights": [...]
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
                if (parsed.hero && parsed.manifesto) {
                  return {
                    ...currentData,
                    ...parsed,
                    id: currentData.id,
                    businessName: currentData.businessName || parsed.businessName,
                    whatsapp: currentData.whatsapp || parsed.whatsapp,
                    address: currentData.address || parsed.address,
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

    // Heurística Fallback elegante caso a IA esteja offline ou sem chave
    const lower = instruction.toLowerCase();
    const updated = JSON.parse(JSON.stringify(currentData)) as CinematicPageData;

    if (lower.includes("rústico") || lower.includes("vinho") || lower.includes("madeira") || lower.includes("noturno")) {
      updated.theme.accent = "#d97706";
      updated.theme.bg = "#0c0a09";
      updated.theme.fontHeading = "serif";
      updated.hero.tagline = "ATMOSFERA ÍNTIMA & ARTESANAL";
      updated.hero.title = `O Resgate das Raízes na ${updated.businessName}`;
      updated.hero.subtitle =
        "Cozinha autoral de fogo e tempo, rótulos selecionados e um ambiente acolhedor talhado em madeira nobre e pedra.";
      updated.manifesto.headline = "A Tradição do Tempo e o Calor da Terra.";
      updated.manifesto.bodyText =
        "Acreditamos que os melhores momentos nascem ao redor de uma mesa bem posta, onde o aroma da brasa e o tinir das taças criam memórias indeléveis. Cada ingrediente carrega a assinatura de pequenos produtores dedicados.";
      updated.manifesto.quote = "Na simplicidade da terra encontramos a mais alta sofisticação.";
    } else if (lower.includes("minimalista") || lower.includes("solar") || lower.includes("claro") || lower.includes("clean")) {
      updated.theme.accent = "#e2e8f0";
      updated.theme.bg = "#09090b";
      updated.theme.fontHeading = "sans";
      updated.hero.tagline = "ESTÉTICA PURA & CONTEMPORÂNEA";
      updated.hero.title = `O Minimalismo em Sua Forma Mais Serena`;
      updated.manifesto.headline = "Menos Ruído, Mais Essência.";
      updated.manifesto.quote = "O essencial não precisa gritar para ser inesquecível.";
    } else if (lower.includes("moda") || lower.includes("ateliê") || lower.includes("costura") || lower.includes("estética")) {
      updated.theme.accent = "#fb7185";
      updated.theme.bg = "#0d090a";
      updated.theme.fontHeading = "serif";
      updated.hero.tagline = "ALTA COSTURA & VISAGISMO EXCLUSIVO";
      updated.hero.title = `A Assinatura da Sua Própria Elegância`;
      updated.manifesto.headline = "Cada Traço, Uma Obra de Arte.";
      updated.manifesto.quote = "A verdadeira elegância consiste em permanecer você mesmo com distinção.";
    } else {
      updated.hero.title = `A Experiência Definitiva em ${updated.businessName}`;
      updated.hero.subtitle = `${instruction.slice(0, 1).toUpperCase() + instruction.slice(1)}. Criado com maestria para encantar seus sentidos.`;
      updated.manifesto.bodyText = `${updated.manifesto.bodyText} Nosso compromisso permanente: ${instruction}.`;
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

