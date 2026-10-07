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

