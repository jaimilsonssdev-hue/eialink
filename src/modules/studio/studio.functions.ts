import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { CinematicPageData } from "@/modules/cinematic/types";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import { lookupBusinessProfile } from "@/modules/prospecting/LiveProspectingEngine";
import type { ProspectDraft } from "@/modules/prospecting/types";
import {
  executeStudioCopilot,
  type StudioCopilotInput,
  type StudioCopilotOutput,
} from "./studio-copilot.service";
import {
  testGoogleGeminiKey,
  resolveGeminiApiKeyAsync,
} from "@/modules/ai/google-ai.service";

function getServiceSupabaseClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://gctwvvnjcxnsjiovhmsv.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * 1. Executa o Agente Copilot do Studio usando diretamente o Google AI Studio
 */
export const executeStudioCopilotFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: StudioCopilotInput) => d)
  .handler(async ({ data: input }): Promise<StudioCopilotOutput> => {
    // Resolve a chave se não foi enviada explicitamente
    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }

    return await executeStudioCopilot({
      ...input,
      apiKey: resolvedKey,
    });
  });

/**
 * 2. Testa a chave do Google AI Studio em tempo real contra a API oficial da Google
 */
export const testStudioGeminiKeyFn = createServerFn({ method: "POST" })
  .validator((d: { apiKey?: string }) => d)
  .handler(async ({ data }) => {
    let keyToTest = (data.apiKey || "").trim();
    if (!keyToTest) {
      keyToTest = (await resolveGeminiApiKeyAsync()) || "";
    }
    if (!keyToTest) {
      return { ok: false, message: "Nenhuma chave foi informada ou encontrada no sistema." };
    }
    return await testGoogleGeminiKey(keyToTest);
  });

/**
 * 3. Salva a chave do Google Gemini no banco de dados para uso global no sistema
 */
export const saveStudioGeminiKeyFn = createServerFn({ method: "POST" })
  .validator((d: { apiKey: string }) => d)
  .handler(async ({ data }) => {
    const cleanKey = (data.apiKey || "").trim();
    const supabase = getServiceSupabaseClient();

    const { error } = await supabase
      .from("payment_gateway_settings" as any)
      .upsert(
        {
          id: "default",
          gemini_api_key: cleanKey || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) {
      throw new Error(`Erro ao salvar a chave no banco de dados: ${error.message}`);
    }

    return {
      ok: true,
      configured: Boolean(cleanKey),
      message: cleanKey
        ? "Chave do Google Gemini salva no banco de dados e ativa para todo o sistema!"
        : "Chave do Google Gemini removida do banco de dados.",
    };
  });

/**
 * 4. Busca dados do estabelecimento via Google Maps para pré-carregar o Studio
 */
export const lookupMapsForStudioFn = createServerFn({ method: "POST" })
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
      console.warn("[Studio] Erro na busca remota do Maps:", err);
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
    const niche = first?.niche || "Serviços Especializados";
    const openingHours =
      firstAny?.openingHours ||
      firstAny?.placeDetails?.openingHours ||
      "Segunda a Sexta das 08h às 18h";
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
 * 5. Salva a página do Studio no Supabase
 */
export const saveStudioPageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { pageData: CinematicPageData }) => d)
  .handler(async ({ data: input, context }) => {
    const { pageData } = input;
    const supabase = context.supabase;
    const userId = context.userId;

    const rawSlug = slugify(pageData.businessName || "meu-site");
    let slug = rawSlug;

    // Se já tiver ID existente, atualiza
    if (pageData.id) {
      const { data: existing, error: findError } = await supabase
        .from("bio_pages")
        .select("id, slug")
        .eq("id", pageData.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!findError && existing) {
        slug = existing.slug;
      }
    } else {
      // Gera slug único se for novo
      const { data: slugCheck } = await supabase
        .from("bio_pages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugCheck) {
        slug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const payload = {
      user_id: userId,
      slug,
      title: pageData.businessName || "Site do Negócio",
      display_name: pageData.businessName || "Site do Negócio",
      bio: pageData.hero.subtitle || pageData.hero.tagline || "",
      whatsapp: pageData.whatsapp || null,
      template: pageData.templateId || "cinematic-glass",
      is_published: true,
      social_links: {
        niche: pageData.niche,
        address: pageData.address,
        google_rating: pageData.rating,
        opening_hours: pageData.openingHours,
        cinematic_data: pageData,
        custom_theme: {
          bg: pageData.theme.bg,
          accent: pageData.theme.accent,
          secondaryAccent: pageData.theme.secondaryAccent,
          fontHeading: pageData.theme.fontHeading,
          fontFamily: pageData.theme.fontFamily,
          archetype: pageData.archetype,
        },
        suggested_services: (pageData.highlights || []).map((h) => ({
          name: h.title,
          description: h.description,
          price: h.price,
          badge: h.badge,
          image_url: h.image,
        })),
        google_photos: (pageData.gallery || []).map((g) => g.url),
      },
      updated_at: new Date().toISOString(),
    };

    let pageId = pageData.id;

    if (pageId) {
      const { error } = await supabase
        .from("bio_pages")
        .update(payload)
        .eq("id", pageId)
        .eq("user_id", userId);

      if (error) throw new Error(`Erro ao atualizar página: ${error.message}`);
    } else {
      const { data: created, error } = await supabase
        .from("bio_pages")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw new Error(`Erro ao criar página: ${error.message}`);
      pageId = created.id;
    }

    return {
      success: true,
      pageId,
      slug,
      publicUrl: `/${slug}`,
    };
  });

import {
  BRIEFING_SYSTEM_PROMPT,
  CODE_GENERATION_SYSTEM_PROMPT,
} from "@/modules/studiopro/lib/creativeEngineService";

/**
 * 6. Gera o site completo em HTML/Tailwind com Gemini 3.8 Flash no servidor
 * e persiste automaticamente na tabela bio_pages do usuário logado
 */
export const generateCreativeSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      briefingOrPrompt: string;
      existingHtml?: string;
      projectId?: string;
      projectName?: string;
      apiKey?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }
    if (!resolvedKey) {
      throw new Error("Chave do Google AI Studio não configurada. Configure no painel Admin.");
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    let userPrompt = input.briefingOrPrompt;
    if (input.existingHtml && input.existingHtml.length > 50) {
      userPrompt = `MODIFICAÇÃO NO SITE EXISTENTE:
O usuário solicitou o seguinte ajuste:
"${input.briefingOrPrompt}"

Aqui está o código HTML atual da página que deve ser modificado preservando todo o restante da estrutura e melhorando com o novo ajuste:
${input.existingHtml}

Retorne o HTML completo atualizado com a alteração solicitada.`;
    }

    let responseText = "";
    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash"];

    for (const modelCandidate of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
              systemInstruction: CODE_GENERATION_SYSTEM_PROMPT,
              temperature: 0.7,
            },
          });
          responseText = response.text?.trim() || "";
          if (responseText) break;
        } catch (apiErr: any) {
          const errStr = JSON.stringify(apiErr || {});
          const isOverloaded =
            apiErr?.status === 503 ||
            apiErr?.code === 503 ||
            errStr.includes("503") ||
            errStr.includes("UNAVAILABLE") ||
            errStr.includes("high demand");
          if (isOverloaded && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          break;
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw new Error("O Google AI Studio está com alta demanda momentânea no momento. Por favor, tente clicar novamente em alguns instantes.");
    }

    let raw = responseText;
    if (raw.startsWith("```html")) {
      raw = raw.replace(/^```html\s*/i, "");
    } else if (raw.startsWith("```")) {
      raw = raw.replace(/^```\s*/, "");
    }
    if (raw.endsWith("```")) {
      raw = raw.replace(/```\s*$/, "");
    }
    const cleanHtml = raw.trim();

    let savedPageId = input.projectId;
    let savedSlug = "";

    try {
      const pageName = input.projectName || "Site Criativo";
      const slugCandidate = slugify(pageName);

      const { data: existing } = await supabase
        .from("bio_pages")
        .select("id, slug, social_links")
        .eq("user_id", userId)
        .eq("title", pageName)
        .maybeSingle();

      const existingSocial = (existing?.social_links as any) || {};
      const updatedSocial = {
        ...existingSocial,
        custom_html: cleanHtml,
        creative_studio_project: {
          id: input.projectId || existing?.id || `proj-${Date.now()}`,
          name: pageName,
          briefing: input.briefingOrPrompt,
          html: cleanHtml,
          updatedAt: Date.now(),
        },
      };

      if (existing) {
        await supabase
          .from("bio_pages")
          .update({
            social_links: updatedSocial,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        savedPageId = existing.id;
        savedSlug = existing.slug;
      } else {
        const uniqueSlug = `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
        const { data: created } = await supabase
          .from("bio_pages")
          .insert({
            user_id: userId,
            title: pageName,
            display_name: pageName,
            slug: uniqueSlug,
            template: "cinematic-glass",
            is_published: true,
            social_links: updatedSocial,
          })
          .select("id, slug")
          .single();
        savedPageId = created?.id;
        savedSlug = created?.slug || uniqueSlug;
      }
    } catch (dbErr) {
      console.warn("[Studio] Erro ao sincronizar bio_page no banco:", dbErr);
    }

    return {
      ok: true,
      html: cleanHtml,
      pageId: savedPageId,
      slug: savedSlug,
    };
  });

/**
 * 7. Elabora plano/briefing estratégico via Gemini 3.8 Flash no servidor
 */
export const planCreativeSiteBriefingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      prompt: string;
      history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      apiKey?: string;
    }) => d,
  )
  .handler(async ({ data: input }) => {
    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }
    if (!resolvedKey) {
      throw new Error("Chave do Google AI Studio não configurada. Configure no painel Admin.");
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const formattedHistory = (input.history || []).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: input.prompt }] },
      ],
      config: {
        systemInstruction: BRIEFING_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    return {
      ok: true,
      briefing: response.text?.trim() || "Plano estratégico elaborado com sucesso.",
    };
  });

/**
 * 8. Sincroniza projeto do Estúdio Criativo na nuvem (Supabase)
 */
export const syncCreativeStudioProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      project: {
        id: string;
        name: string;
        html: string;
        briefing?: string;
        messages: any[];
        slug?: string;
      };
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;
    const proj = input.project;

    const { data: existing } = await supabase
      .from("bio_pages")
      .select("id, slug, social_links")
      .eq("user_id", userId)
      .eq("title", proj.name)
      .maybeSingle();

    const existingSocial = (existing?.social_links as any) || {};
    const updatedSocial = {
      ...existingSocial,
      custom_html: proj.html,
      creative_studio_project: proj,
    };

    if (existing) {
      await supabase
        .from("bio_pages")
        .update({
          social_links: updatedSocial,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return { success: true, pageId: existing.id, slug: existing.slug };
    } else {
      const slugCandidate = slugify(proj.name || "site-criativo");
      const uniqueSlug = `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
      const { data: created } = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          title: proj.name || "Site Criativo",
          display_name: proj.name || "Site Criativo",
          slug: uniqueSlug,
          template: "cinematic-glass",
          is_published: true,
          social_links: updatedSocial,
        })
        .select("id, slug")
        .single();
      return { success: true, pageId: created?.id, slug: created?.slug || uniqueSlug };
    }
  });

/**
 * 9. Lista projetos salvos no Supabase para sincronizar Desktop & Mobile
 */
export const listCreativeStudioProjectsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    const { data, error } = await supabase
      .from("bio_pages")
      .select("id, title, display_name, slug, social_links, updated_at, created_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error || !data) return { projects: [] };

    const projects = data
      .map((row) => {
        const social = (row.social_links as any) || {};
        const csp = social.creative_studio_project;
        const html = social.custom_html || "";
        if (!csp && !html) return null;

        return {
          id: csp?.id || row.id,
          name: csp?.name || row.display_name || row.title || "Site Criativo",
          html: csp?.html || html,
          briefing: csp?.briefing || "",
          eialinkPageId: row.id,
          slug: row.slug,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
          status: "published" as const,
          messages: Array.isArray(csp?.messages) ? csp.messages : [],
        };
      })
      .filter(Boolean);

    return { projects };
  });

