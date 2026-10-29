import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchCompatibleBusinessImages } from "@/modules/media/unsplash.functions";
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
  getAvailableGeminiModels,
} from "@/modules/ai/google-ai.service";
import {
  buildCardapioAiSystemPrompt,
  sanitizeCardapioPhotosForNiche,
  type CardapioData,
} from "@/modules/cardapio/cardapioAiService";
import { generateIfoodCardapioHtml } from "@/modules/cardapio/cardapioGenerator";
import type { LojaData } from "@/modules/loja/lojaAiService";
import {
  provisionPlatformToolsForNiche,
  detectNicheCategory,
  NICHE_CONFIGS,
} from "@/modules/prospecting/nicheProvisioner";
import {
  injectEiaLinkFeatureRuntime,
  applyFeaturesToHtml,
  type EiaLinkFeatureFlags,
} from "@/lib/eialinkFeatureRuntime";

function wireAgendaIntoHtml(html: string, slug: string, ctaLabel: string): string {
  if (!html || !slug) return html;
  const targetHref = `/agendar/${slug}`;
  let out = html
    .replace(/href=["']\/agendar\/[^"']*["']/gi, `href="${targetHref}" data-action="agendar"`)
    .replace(
      /href=["']#(?:agendar|agenda|booking|agendamento|contato|marcar)["']/gi,
      `href="${targetHref}" data-action="agendar"`,
    );

  out = out.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi, (fullMatch, attrs, inner) => {
    const plainText = String(inner)
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();
    if (
      /agendar|agendamento|marcar\s+consulta|marcar\s+hor[aá]rio|reservar\s+hor[aá]rio|avalia[cç][aã]o|escolha\s+seu\s+hor[aá]rio/i.test(
        plainText,
      )
    ) {
      let updatedAttrs = String(attrs);
      if (/href=["'][^"']*["']/i.test(updatedAttrs)) {
        updatedAttrs = updatedAttrs.replace(/href=["'][^"']*["']/i, `href="${targetHref}"`);
      } else {
        updatedAttrs += ` href="${targetHref}"`;
      }
      if (!/data-action=/i.test(updatedAttrs)) {
        updatedAttrs += ` data-action="agendar"`;
      }
      return `<a${updatedAttrs}>${inner}</a>`;
    }
    return fullMatch;
  });

  const hasBookingTrigger =
    /\/agendar\//i.test(out) ||
    /data-action=["']agendar["']/i.test(out) ||
    />[^<]*(?:agendar|agendamento|marcar\s+consulta|marcar\s+hor[aá]rio)[^<]*</i.test(out);

  if (!hasBookingTrigger) {
    const label = ctaLabel || "🗓️ Agendar Horário";
    const floatingCta = `
<div id="eialink-booking-cta-bar" style="position:fixed;bottom:20px;left:20px;z-index:9990;">
  <a href="${targetHref}" data-action="agendar" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:9999px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-family:sans-serif;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 10px 25px rgba(16,185,129,0.4);">
    <span>${label}</span>
  </a>
</div>`;
    if (/<\/body>/i.test(out)) {
      out = out.replace(/<\/body>/i, `${floatingCta}\n</body>`);
    } else {
      out += floatingCta;
    }
  }

  return out;
}

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

    const { error } = await supabase.from("payment_gateway_settings" as any).upsert(
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
  SURGICAL_EDIT_SYSTEM_PROMPT,
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
      leadContext?: {
        name?: string;
        niche?: string;
        address?: string;
        rating?: number | null;
        reviewsCount?: number | null;
        photos?: string[];
      };
      clientGeminiKey?: string;
      businessAddress?: string;
      businessWhatsapp?: string;
      businessSlug?: string;
      niche?: string;
      city?: string;
      rating?: number;
      reviewsCount?: number;
      photos?: string[];
      isRegeneration?: boolean;
      attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>;
      conversationHistory?: Array<{ role: string; content: string }>;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    let resolvedKey = input.apiKey?.trim() || input.clientGeminiKey?.trim();
    if (!resolvedKey) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        resolvedKey = userData?.user?.user_metadata?.gemini_api_key;
      } catch (authErr) {
        console.warn("[Studio] Falha ao extrair chave de user_metadata:", authErr);
      }
    }
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }
    if (!resolvedKey) {
      throw new Error("Chave do Google AI Studio não configurada. Configure no painel Admin.");
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    let effectiveHtml = (input.existingHtml || "").trim();
    let dbPage: {
      id: string;
      slug: string;
      display_name: string;
      whatsapp: string | null;
      social_links: Record<string, any> | null;
    } | null = null;

    try {
      if (input.projectId) {
        const { data } = await supabase
          .from("bio_pages")
          .select("id, slug, display_name, whatsapp, social_links")
          .eq("id", input.projectId)
          .maybeSingle();
        dbPage = data as any;
      }
      if (!dbPage && input.businessSlug) {
        const { data } = await supabase
          .from("bio_pages")
          .select("id, slug, display_name, whatsapp, social_links")
          .eq("slug", input.businessSlug)
          .maybeSingle();
        dbPage = data as any;
      }
      if (!dbPage && input.projectName) {
        const { data } = await supabase
          .from("bio_pages")
          .select("id, slug, display_name, whatsapp, social_links")
          .eq("user_id", userId)
          .eq("display_name", input.projectName)
          .maybeSingle();
        dbPage = data as any;
      }
      if (input.isRegeneration) {
        effectiveHtml = "";
      } else if (dbPage && !effectiveHtml) {
        const rawSocial = (dbPage.social_links as Record<string, any>) || {};
        effectiveHtml = rawSocial.custom_html || "";
      }
    } catch (loadErr) {
      console.warn("[Studio] Falha ao recuperar dados base da página:", loadErr);
    }

    const dbSocial = (dbPage?.social_links as Record<string, any>) || {};
    const effectiveProjectName = input.projectName || dbPage?.display_name || "Site Criativo";
    const effectiveNiche = input.niche || dbSocial.niche || dbSocial.niche_category || "";
    const effectiveWhatsapp = input.businessWhatsapp || dbPage?.whatsapp || dbSocial.whatsapp || "";
    const effectiveAddress = input.businessAddress || dbSocial.address || "";
    const effectiveCity = input.city || dbSocial.city || "";

    let userPrompt = input.briefingOrPrompt;

    // Injeta metadados de ferramentas do ecossistema EiaLink calibrados por nicho
    const detectedCategory = detectNicheCategory(effectiveNiche, effectiveProjectName);
    const nicheConfig = NICHE_CONFIGS[detectedCategory];
    const candidateSlug =
      dbPage?.slug || input.businessSlug || slugify(effectiveProjectName || "empresa");
    const ctaUrl = nicheConfig.ctaUrl(candidateSlug);
    const ctaLabel = nicheConfig.ctaLabel;

    const isModification = Boolean(
      effectiveHtml && effectiveHtml.length > 50 && !input.isRegeneration,
    );

    const promptLower = input.briefingOrPrompt.toLowerCase();
    const isTurnOffVerb =
      /\b(desligar|desconectar|desativar|remover|tirar|ocultar|esconder)\b/i.test(promptLower);
    const isTurnOnVerb =
      /\b(conectar|ligar|implementar|ativar|vincular|integrar|colocar|adicionar|configurar|habilitar)\b/i.test(
        promptLower,
      );

    const mentionsAgenda =
      /\b(agenda|agendamento|agendar|hor[aá]rios?|marcar\s*consulta|marcar\s*hor[aá]rio|reserva|bot[aã]o\s*de\s*agendar|abrir\s*modal|conectar\s*agenda)\b/i.test(
        promptLower,
      );
    const mentionsDeals =
      /\b(mural\s*de\s*ofertas|mural|ofertas?|cupom|cupons|promo[cç][aã]o|promo[cç][oõ]es)\b/i.test(
        promptLower,
      );
    const mentionsLoyalty =
      /\b(fidelidade|clube\s*vip|clube\s*de\s*pontos|programa\s*de\s*pontos|pontos\s*vip)\b/i.test(
        promptLower,
      );
    const mentionsConcierge =
      /\b(atendente|assistente\s*virtual|chat\s*online|concierge|rob[oô]\s*de\s*atendimento)\b/i.test(
        promptLower,
      );

    const isFeatureCommand =
      isModification &&
      (isTurnOnVerb ||
        isTurnOffVerb ||
        /\b(conectar|ligar|funcionar|corrigir|arrumar|ajustar|abrir|ativar|implementar|vincular)\b/i.test(
          promptLower,
        )) &&
      (mentionsAgenda || mentionsDeals || mentionsLoyalty || mentionsConcierge);

    // Se o usuário pediu explicitamente para conectar/ligar/implementar ou desligar/desconectar
    // Agenda, Mural de Ofertas, Fidelidade ou Atendente Virtual em um site existente:
    if (isFeatureCommand && effectiveHtml) {
      const enableTarget = !isTurnOffVerb;
      const currentFlags: EiaLinkFeatureFlags = {
        agenda_enabled: dbSocial.agenda_enabled !== false,
        ai_concierge_enabled: dbSocial.ai_concierge_enabled !== false,
        deals_enabled: dbSocial.deals_enabled !== false && dbSocial.mural_ofertas_enabled !== false,
        loyalty_enabled:
          dbSocial.loyalty_enabled !== false && dbSocial.fidelidade_enabled !== false,
        gps_enabled: dbSocial.gps_enabled !== false,
        whatsapp_enabled: dbSocial.whatsapp_enabled !== false,
      };

      const statusLines: string[] = [];
      const bookingCategory = nicheConfig.isBooking ? detectedCategory : "service";
      const bookingConfig = NICHE_CONFIGS[bookingCategory];

      let wiredHtml = effectiveHtml;

      if (mentionsAgenda) {
        currentFlags.agenda_enabled = enableTarget;
        if (enableTarget) {
          wiredHtml = wireAgendaIntoHtml(wiredHtml, candidateSlug, bookingConfig.ctaLabel);
          statusLines.push(
            `- 🗓️ **Agenda Online:** ATIVADA em \`/agendar/${candidateSlug}\` com serviços de exemplo (${bookingConfig.services.map((s) => `${s.name} R$ ${s.price}`).join(", ")})`,
          );
        } else {
          statusLines.push(`- 🗓️ **Agenda Online:** DESCONECTADA / OCULTADA do site`);
        }
      }

      if (mentionsDeals) {
        currentFlags.deals_enabled = enableTarget;
        statusLines.push(
          enableTarget
            ? `- 🔥 **Mural de Ofertas & Cupom Relâmpago:** CONECTADO e ATIVO no site com oferta promocional de exemplo e resgate de cupom instantâneo`
            : `- 🔥 **Mural de Ofertas & Cupom Relâmpago:** DESLIGADO do site`,
        );
      }

      if (mentionsLoyalty) {
        currentFlags.loyalty_enabled = enableTarget;
        statusLines.push(
          enableTarget
            ? `- 👑 **Clube de Fidelidade & Pontos VIP:** CONECTADO e ATIVO no site com carteira de pontos demonstrativa e resgate de prêmios do nicho`
            : `- 👑 **Clube de Fidelidade & Pontos VIP:** DESLIGADO do site`,
        );
      }

      if (mentionsConcierge) {
        currentFlags.ai_concierge_enabled = enableTarget;
        statusLines.push(
          enableTarget
            ? `- 💬 **Atendente Virtual Inteligente 24/7:** CONECTADO e ATIVO no site (responde preços, serviços, ofertas, localização e agenda horários)`
            : `- 💬 **Atendente Virtual Inteligente:** DESLIGADO do site`,
        );
      }

      wiredHtml = applyFeaturesToHtml(wiredHtml, currentFlags);
      wiredHtml = injectEiaLinkFeatureRuntime(wiredHtml, {
        slug: candidateSlug,
        businessName: effectiveProjectName,
        whatsapp: effectiveWhatsapp,
        address: effectiveAddress,
        niche: effectiveNiche || bookingConfig.label,
        features: currentFlags,
      });

      let savedPageId = dbPage?.id || input.projectId;
      let savedSlug = candidateSlug;

      try {
        const curLoyalty = (dbSocial.loyalty_settings as Record<string, any>) || {};
        const updatedSocial = {
          ...dbSocial,
          custom_html: wiredHtml,
          niche: effectiveNiche || bookingConfig.label,
          niche_category: bookingCategory,
          ...currentFlags,
          mural_ofertas_enabled: currentFlags.deals_enabled,
          fidelidade_enabled: currentFlags.loyalty_enabled,
          booking_enabled: currentFlags.agenda_enabled,
          booking_active: currentFlags.agenda_enabled,
          booking_url: `/agendar/${savedSlug}`,
          loyalty_settings: {
            ...curLoyalty,
            isActive: currentFlags.loyalty_enabled,
          },
          is_demo: true,
          creative_studio_project: {
            id: savedPageId || `proj-${Date.now()}`,
            name: effectiveProjectName,
            briefing: input.briefingOrPrompt,
            html: wiredHtml,
            updatedAt: Date.now(),
          },
        };

        if (dbPage) {
          await supabase
            .from("bio_pages")
            .update({
              display_name: effectiveProjectName,
              whatsapp: effectiveWhatsapp || undefined,
              social_links: updatedSocial,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", dbPage.id);
          savedPageId = dbPage.id;
          savedSlug = dbPage.slug;
        } else {
          const uniqueSlug =
            input.businessSlug || `${candidateSlug}-${Date.now().toString(36).slice(-4)}`;
          const claimToken = dbSocial.claim_token || crypto.randomUUID();
          const { data: created } = await supabase
            .from("bio_pages")
            .insert({
              user_id: userId,
              display_name: effectiveProjectName,
              slug: uniqueSlug,
              template_id: "site-maquina",
              published: true,
              whatsapp: effectiveWhatsapp || null,
              description: "[DEMO] Página demonstrativa de prospecção",
              social_links: {
                ...updatedSocial,
                claim_token: claimToken,
              },
            })
            .select("id, slug")
            .single();
          savedPageId = created?.id;
          savedSlug = created?.slug || uniqueSlug;
        }

        if (savedPageId && savedSlug) {
          const provClient = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ? getServiceSupabaseClient() : supabase;
          await provisionPlatformToolsForNiche({
            supabase: provClient,
            pageId: savedPageId,
            slug: savedSlug,
            businessName: effectiveProjectName,
            niche: effectiveNiche || bookingConfig.label,
            city: effectiveCity,
            whatsapp: effectiveWhatsapp,
            address: effectiveAddress,
            rating: input.rating || dbSocial.google_rating,
            reviewsCount: input.reviewsCount || dbSocial.reviews_count,
          });
        }
      } catch (err) {
        console.warn("[Studio] Aviso ao persistir ferramentas no site:", err);
      }

      return {
        ok: true,
        html: wiredHtml,
        explanation: `✅ **Recursos e ferramentas atualizados no site com sucesso!**\n\n${statusLines.join("\n")}\n\n💡 Você já pode testar clicando nos botões flutuantes na prévia ao lado ou ligar/desligar qualquer ferramenta a qualquer momento no botão **"Recursos"** no topo do editor!`,
        pageId: savedPageId,
        slug: savedSlug,
      };
    }

    const businessContextParts: string[] = [];
    if (effectiveProjectName) businessContextParts.push(`Nome Oficial: "${effectiveProjectName}"`);
    if (effectiveNiche)
      businessContextParts.push(
        `Nicho de Atuação: "${effectiveNiche}" (Categoria: ${nicheConfig.label})`,
      );
    if (effectiveCity) businessContextParts.push(`Cidade / Região: "${effectiveCity}"`);
    if (effectiveAddress)
      businessContextParts.push(
        `Endereço Verificado (usar no Mapa/GPS/Waze): "${effectiveAddress}"`,
      );
    if (effectiveWhatsapp)
      businessContextParts.push(
        `WhatsApp Oficial (usar no botão pulsante e CTAs): "${effectiveWhatsapp}"`,
      );
    if (nicheConfig.isBooking) {
      businessContextParts.push(
        `SISTEMA DE AGENDAMENTO ONLINE EIALINK: 100% ATIVO E INTEGRADO no link "${ctaUrl}".`,
      );
      businessContextParts.push(
        `O botão de ação principal (CTA) do Hero e das seções de serviços DEVE SER "${ctaLabel}" apontando diretamente para "${ctaUrl}".`,
      );
      if (nicheConfig.services.length > 0) {
        businessContextParts.push(
          `Serviços oficiais do negócio: ${nicheConfig.services.map((s) => `${s.name} (R$ ${s.price}, ${s.duration_minutes}min)`).join("; ")}. IMPORTANTE: Apresente estes serviços seguindo fielmente a diagramação do arquétipo estrutural (ex: lista editorial, bento cards, timeline ou tabela moderna).`,
        );
      }
    } else {
      businessContextParts.push(
        `CTA PRINCIPAL DE CONVERSÃO: Botão "${ctaLabel}" apontando para "${ctaUrl}".`,
      );
    }
    if (input.rating)
      businessContextParts.push(
        `Avaliação no Google Maps: ${input.rating} estrelas (${input.reviewsCount || 80} avaliações reais)`,
      );
    if (input.photos && input.photos.length > 0) {
      businessContextParts.push(
        `FOTOS REAIS DA EMPRESA PARA USAR NO SITE (PRIORIDADE TOTAL):\n${input.photos.slice(0, 6).map((url, i) => `- Foto Real ${i + 1}: ${url}`).join("\n")}`,
      );
    } else {
      // Se não houver fotos reais anexadas, busca fotos compatíveis em tempo real via IA/DDG/Unsplash
      try {
        const foundPromise = searchCompatibleBusinessImages(
          effectiveNiche || "geral",
          effectiveProjectName,
          8,
        );
        const found = (await Promise.race([
          foundPromise,
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2000)),
        ])) || [];
        if (found && found.length > 0) {
          businessContextParts.push(
            `BANCO DE IMAGENS COMPATÍVEIS BUSCADAS EM TEMPO REAL PARA ESTE NEGÓCIO:\n${found.map((img, i) => `- Foto ${i + 1} [${img.role.toUpperCase()} - ${img.label}]: ${img.url}`).join("\n")}\nDIRETRIZ CRÍTICA DE IMAGENS: Distribua estas fotos pelos blocos (Hero, Espaço, Procedimentos, Equipe, Detalhes). NUNCA invente links fictícios e NUNCA repita a mesma foto.`,
          );
        }
      } catch (e) {
        console.warn("[StudioServer] Aviso ao buscar fotos compatíveis:", e);
      }
    }

    if (businessContextParts.length > 0) {
      userPrompt += `\n\n[DADOS DE INTEGRAÇÃO DO ECOSSISTEMA EIALINK]:\n${businessContextParts.join("\n")}\nPor favor, certifique-se de preencher a seção de Localização (com iframe e botões de GPS Waze/Maps), o botão de ação principal ("${ctaLabel}") apontando para "${ctaUrl}" e o WhatsApp flutuante utilizando estes dados reais!`;
    }

    if (input.isRegeneration) {
      userPrompt += `\n\n[DIRETRIZ DE REINVENÇÃO TOTAL & TROCA DE MODELO]:
O usuário solicitou explicitamente TROCAR O MODELO e criar uma PROPOSTA DE DESIGN COMPLETAMENTE NOVA, DIFERENTE E SURPREENDENTE.
NÃO repita a mesma estrutura, ordem de blocos, hero ou paleta de cores.
Experimente um formato e layout inovador (ex: se era clássico/cards, use um Split moderno, Bento Grid, Neobrutalismo pop com sombras duras, ou Glassmorphism translúcido com luzes neon).
Surpreenda com uma organização criativa e única que valorize a marca do cliente ao máximo!`;
    }

    if (isModification) {
      userPrompt = `[SOLICITAÇÃO DE ALTERAÇÃO NO SITE EXISTENTE]:
O usuário solicitou o seguinte ajuste no site:
"${input.briefingOrPrompt}"

[INSTRUÇÃO OBRIGATÓRIA E INEGOCIÁVEL PARA O COPILOTO]:
Você DEVE APLICAR ESSA ALTERAÇÃO DIRETAMENTE NO CÓDIGO HTML FORNECIDO ABAIXO.
Preserve toda a estrutura, ferramentas integradas, textos e seções que não foram solicitadas para mudar, e aplique o ajuste com precisão no código (ex: novas cores, novos textos, novo bloco, estilo de botões, imagens, etc.).

É ABSOLUTAMENTE PROIBIDO responder apenas texto conversacional sem o código HTML!
Você DEVE OBRIGATORIAMENTE estruturar sua resposta exatamente no seguinte formato:
<<<EXPLANATION>>>
Sua mensagem conversacional explicando amigavelmente o que foi alterado para o usuário
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... código HTML5 completo atualizado de ponta a ponta com a alteração solicitada ...
</html>
<<<END_HTML>>>

HTML ATUAL DA PÁGINA PARA MODIFICAÇÃO:
${effectiveHtml}`;
    } else if (input.conversationHistory && input.conversationHistory.length > 0) {
      const recentHistory = input.conversationHistory
        .slice(-4)
        .map((m) => `${m.role === "user" ? "Usuário" : "Copiloto"}: ${m.content}`)
        .join("\n");
      userPrompt = `[HISTÓRICO DA CONVERSA]:\n${recentHistory}\n\n[SOLICITAÇÃO ATUAL]:\n${userPrompt}`;
    }

    const serverParts: any[] = [];
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        serverParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    serverParts.push({ text: userPrompt });

    // Estrutura turnos multi-turn oficiais de acordo com o Google AI Studio
    const contents: any[] = [];
    if (!isModification && input.conversationHistory && input.conversationHistory.length > 0) {
      for (const msg of input.conversationHistory.slice(-6)) {
        contents.push({
          role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({ role: "user", parts: serverParts });

    let responseText = "";
    let lastCapturedError: any = null;
    const candidateModels = await getAvailableGeminiModels(resolvedKey);

    for (const modelToTry of candidateModels) {
      if (responseText) break;
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config: {
            systemInstruction: isModification
              ? SURGICAL_EDIT_SYSTEM_PROMPT
              : CODE_GENERATION_SYSTEM_PROMPT,
            temperature: isModification ? 0.2 : 0.85,
            maxOutputTokens: 32768,
          },
        });
        const text = response.text?.trim() || "";
        if (text && text.length > 50) {
          responseText = text;
          break;
        }
      } catch (sdkErr: any) {
        lastCapturedError = sdkErr;
        console.warn(
          `[StudioServer] generateContent com ${modelToTry} falhou:`,
          sdkErr?.message || sdkErr,
        );
      }
    }

    if (!responseText) {
      const errDetails =
        lastCapturedError?.message ||
        (typeof lastCapturedError === "object"
          ? JSON.stringify(lastCapturedError)
          : "Erro de resposta");
      const lower = String(errDetails).toLowerCase();
      if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
        throw new Error(
          `Modelo do Google AI Studio inexistente ou indisponível para a sua chave: ${errDetails}`,
        );
      }
      if (
        lower.includes("429") ||
        lower.includes("quota") ||
        lower.includes("resource_exhausted")
      ) {
        throw new Error(
          `Limite de cota atingido no Google AI Studio: ${errDetails}. Aguarde alguns instantes ou verifique o faturamento da sua chave.`,
        );
      }
      throw new Error(`Falha na API Google AI Studio: ${errDetails}. Tente clicar novamente.`);
    }

    let raw = responseText.trim();
    let explanation = "";
    let cleanHtml = "";

    if (raw.includes("<<<HTML>>>")) {
      const parts = raw.split("<<<HTML>>>");
      explanation = parts[0].replace("<<<EXPLANATION>>>", "").trim();
      cleanHtml = parts[1].replace("<<<END_HTML>>>", "").trim();
    } else if (raw.includes("<<<EXPLANATION>>>")) {
      const withoutTag = raw.replace("<<<EXPLANATION>>>", "").trim();
      const htmlBlockMatch = withoutTag.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
      if (htmlBlockMatch && htmlBlockMatch[1]) {
        cleanHtml = htmlBlockMatch[1].trim();
        explanation = withoutTag.replace(/```(?:html)?\s*[\s\S]*?\s*```/gi, "").trim();
      } else {
        const docMatch =
          withoutTag.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i) ||
          withoutTag.match(/(<html[\s\S]*<\/html>)/i);
        if (docMatch && docMatch[1]) {
          cleanHtml = docMatch[1].trim();
          explanation = withoutTag.replace(docMatch[1], "").trim();
        } else {
          explanation = withoutTag;
          cleanHtml = "";
        }
      }
    } else {
      // Extração de blocos de código se não veio a tag <<<HTML>>>
      const htmlBlockMatch = raw.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
      if (
        htmlBlockMatch &&
        htmlBlockMatch[1] &&
        /<(?:!doctype|html|body|div)/i.test(htmlBlockMatch[1])
      ) {
        cleanHtml = htmlBlockMatch[1].trim();
        explanation = raw.replace(/```(?:html)?\s*[\s\S]*?\s*```/gi, "").trim();
      } else {
        const docMatch =
          raw.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i) || raw.match(/(<html[\s\S]*<\/html>)/i);
        if (docMatch && docMatch[1]) {
          cleanHtml = docMatch[1].trim();
          explanation = raw.replace(docMatch[1], "").trim();
        } else {
          cleanHtml = raw;
        }
      }
    }

    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.replace(/^```html\s*/i, "");
    } else if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.replace(/^```\s*/, "");
    }
    if (cleanHtml.endsWith("```")) {
      cleanHtml = cleanHtml.replace(/```\s*$/, "");
    }
    cleanHtml = cleanHtml.trim();

    // Verificação se o retorno contém código HTML real e completo (com </html>)
    const hasValidHtmlTags =
      /<(?:!doctype|html|body|div|section|main|head)/i.test(cleanHtml) &&
      /<\/html>/i.test(cleanHtml);
    if (!hasValidHtmlTags) {
      if (isModification && effectiveHtml) {
        console.warn(
          "[StudioServer] IA retornou HTML incompleto ou apenas texto. Executando síntese de código...",
        );
        try {
          const retryRes = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `O usuário solicitou o ajuste: "${input.briefingOrPrompt}".
Sua explicação para o usuário: "${explanation || cleanHtml}".
Agora retorne OBRIGATORIAMENTE apenas o código HTML5 completo atualizado (de <!DOCTYPE html> até </html>) aplicando o ajuste acima no seguinte código:
${effectiveHtml}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction:
                "Você é um gerador de código HTML. Retorne estritamente o código HTML5 completo até </html>, sem markdown, sem explicações adicionais.",
              temperature: 0.5,
              maxOutputTokens: 32768,
              abortSignal: AbortSignal.timeout(45000),
            },
          });
          const retryText = retryRes.text?.trim() || "";
          const retryBlockMatch = retryText.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
          const candidateRetry = (retryBlockMatch ? retryBlockMatch[1].trim() : retryText)
            .replace(/^```(?:html)?\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();
          if (
            /<(?:!doctype|html|body|div)/i.test(candidateRetry) &&
            /<\/html>/i.test(candidateRetry)
          ) {
            if (!explanation) explanation = cleanHtml;
            cleanHtml = candidateRetry;
          } else {
            throw new Error(
              "A IA falhou duas vezes em gerar o código HTML completo (com </html>). O site atual foi mantido sem alterações. Tente reformular o pedido.",
            );
          }
        } catch (retryErr: any) {
          throw new Error(
            retryErr?.message ||
              "A IA falhou duas vezes ao atualizar o HTML do site. Nenhuma alteração foi salva.",
          );
        }
      } else {
        throw new Error(
          "A resposta da IA veio truncada ou sem a tag de fechamento </html>. Tente gerar novamente.",
        );
      }
    }

    if (!explanation) {
      explanation = isModification
        ? "✨ Ajuste aplicado com sucesso! Atualizei o site com as modificações que você pediu. Veja a prévia na tela ao lado."
        : "🚀 Site gerado com sucesso! Já estruturei com design moderno, alta conversão e ferramentas integradas.";
    }

    let savedPageId = dbPage?.id || input.projectId;
    let savedSlug = dbPage?.slug || candidateSlug;

    try {
      const pageName = effectiveProjectName;
      const slugCandidate = slugify(pageName);

      const existing = dbPage;
      if (!existing) {
        savedSlug = input.businessSlug || `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
      }

      // Se o nicho usa agendamento, garante que todos os botões de agendar estejam conectados ao /agendar/{savedSlug}
      if (nicheConfig.isBooking) {
        cleanHtml = wireAgendaIntoHtml(cleanHtml, savedSlug, nicheConfig.ctaLabel);
      }
      cleanHtml = injectEiaLinkFeatureRuntime(cleanHtml, {
        slug: savedSlug,
        businessName: pageName,
        whatsapp: effectiveWhatsapp,
        address: effectiveAddress,
      });

      const existingSocial = (existing?.social_links as any) || {};
      const updatedSocial = {
        ...existingSocial,
        custom_html: cleanHtml,
        // Limpa heranças de cardápio ou agenda para permitir que o site institucional assuma 100% da visualização
        is_cardapio_page: false,
        cardapio_data: null,
        cardapioData: null,
        is_agenda_page: false,
        agenda_data: null,
        agendaData: null,
        niche: effectiveNiche || existingSocial.niche,
        city: effectiveCity || existingSocial.city,
        google_rating: input.rating || existingSocial.google_rating || 4.9,
        reviews_count: input.reviewsCount || existingSocial.reviews_count || 85,
        is_demo: true,
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
              display_name: pageName,
              template_id: "site-maquina",
              whatsapp: effectiveWhatsapp || undefined,
              social_links: updatedSocial,
              updated_at: new Date().toISOString(),
            } as any)
          .eq("id", existing.id);
        savedPageId = existing.id;
        savedSlug = existing.slug;
      } else {
        const claimToken = existingSocial.claim_token || crypto.randomUUID();
        const { data: created } = await supabase
          .from("bio_pages")
          .insert({
            user_id: userId,
            display_name: pageName,
            slug: savedSlug,
            template_id: "site-maquina",
            published: true,
            whatsapp: effectiveWhatsapp || null,
            description: "[DEMO] Página demonstrativa de prospecção",
            social_links: {
              ...updatedSocial,
              claim_token: claimToken,
            },
          })
          .select("id, slug")
          .single();
        savedPageId = created?.id;
        savedSlug = created?.slug || savedSlug;
      }

      // Provisiona automaticamente as ferramentas da plataforma para este nicho
      if (savedPageId && savedSlug) {
        try {
          const provClient = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ? getServiceSupabaseClient() : supabase;
          await provisionPlatformToolsForNiche({
            supabase: provClient,
            pageId: savedPageId,
            slug: savedSlug,
            businessName: pageName,
            niche: effectiveNiche,
            city: effectiveCity,
            whatsapp: effectiveWhatsapp,
            address: effectiveAddress,
            rating: input.rating,
            reviewsCount: input.reviewsCount,
          });
        } catch (provErr) {
          console.warn("[Studio] Erro ao auto-provisionar ferramentas do nicho:", provErr);
        }
      }
    } catch (dbErr) {
      console.warn("[Studio] Erro ao sincronizar bio_page no banco:", dbErr);
    }

    return {
      ok: true,
      html: cleanHtml,
      explanation,
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
      leadContext?: {
        name?: string;
        niche?: string;
        address?: string;
        rating?: number | null;
        reviewsCount?: number | null;
        photos?: string[];
      };
      attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      try {
        const { data: userData } = await context.supabase.auth.getUser();
        resolvedKey = userData?.user?.user_metadata?.gemini_api_key;
      } catch (authErr) {
        console.warn("[Studio] Falha ao extrair chave de user_metadata no briefing:", authErr);
      }
    }
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

    const userParts: any[] = [];
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        userParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    userParts.push({ text: input.prompt });

    let briefingText = "";
    let lastBriefingError: any = null;
    const briefingModels = await getAvailableGeminiModels(resolvedKey);

    for (const m of briefingModels) {
      if (briefingText) break;
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: [...formattedHistory, { role: "user", parts: userParts }],
          config: {
            systemInstruction: BRIEFING_SYSTEM_PROMPT,
            temperature: 0.65,
            maxOutputTokens: 8192,
          },
        });
        const text = response.text?.trim() || "";
        if (text && text.length > 20) {
          briefingText = text;
          break;
        }
      } catch (err: any) {
        lastBriefingError = err;
        console.warn(`[StudioServer] Falha no briefing com ${m}:`, err?.message || err);
      }
    }

    if (!briefingText) {
      const errMsg = lastBriefingError?.message || String(lastBriefingError || "Erro desconhecido");
      const lower = errMsg.toLowerCase();
      if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
        throw new Error(`Modelo do Google AI Studio inexistente ou indisponível: ${errMsg}`);
      }
      if (
        lower.includes("429") ||
        lower.includes("quota") ||
        lower.includes("resource_exhausted")
      ) {
        throw new Error(`Limite de cota atingido no Google AI Studio: ${errMsg}`);
      }
      throw new Error(`Falha ao gerar o plano no Google AI Studio: ${errMsg}`);
    }

    return {
      ok: true,
      briefing: briefingText,
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
        eialinkPageId?: string;
        slug?: string;
        messages?: any[];
      };
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;
    const proj = input.project;

    let existing: any = null;
    if (proj.eialinkPageId) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, social_links")
        .eq("id", proj.eialinkPageId)
        .maybeSingle();
      existing = data;
    }
    if (!existing && proj.slug) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, social_links")
        .eq("slug", proj.slug)
        .maybeSingle();
      existing = data;
    }
    if (!existing && proj.name) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, social_links")
        .eq("user_id", userId)
        .eq("display_name", proj.name)
        .maybeSingle();
      existing = data;
    }

    const existingSocial = (existing?.social_links as any) || {};
    const existingHtml =
      existingSocial.custom_html ||
      existingSocial.creative_studio_project?.html ||
      "";

    // BLINDAGEM CONTRA SOBREESCRITA VAZIA:
    // Se o HTML enviado for vazio ou incompleto (< 50 caracteres) e o banco já tiver HTML válido,
    // PRESERVA o HTML do banco! Nunca zera uma página válida.
    const incomingHtml = (proj.html || "").trim();
    const safeHtml = incomingHtml.length > 50 ? incomingHtml : existingHtml;

    const safeProj = {
      ...proj,
      html: safeHtml,
      updatedAt: Date.now(),
    };

    const updatedSocial = {
      ...existingSocial,
      custom_html: safeHtml,
      creative_studio_project: safeProj,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      let updateRes = await supabase
        .from("bio_pages")
        .update({
          social_links: updatedSocial,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", existing.id);

      if (updateRes.error && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        const serviceClient = getServiceSupabaseClient();
        updateRes = await serviceClient
          .from("bio_pages")
          .update({
            social_links: updatedSocial,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
      }

      return { success: true, pageId: existing.id, slug: existing.slug };
    } else {
      const slugCandidate = slugify(proj.name || "site-criativo");
      const uniqueSlug = proj.slug || `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
      let insertRes = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          display_name: proj.name || "Site Criativo",
          slug: uniqueSlug,
          template_id: "site-maquina",
          published: true,
          social_links: updatedSocial,
        } as any)
        .select("id, slug")
        .single();

      if (insertRes.error && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        const serviceClient = getServiceSupabaseClient();
        insertRes = await serviceClient
          .from("bio_pages")
          .insert({
            user_id: userId,
            display_name: proj.name || "Site Criativo",
            slug: uniqueSlug,
            template_id: "site-maquina",
            published: true,
            social_links: updatedSocial,
          } as any)
          .select("id, slug")
          .single();
      }

      return { success: true, pageId: insertRes.data?.id, slug: insertRes.data?.slug || uniqueSlug };
    }
  });

/**
 * 8.1 Salva Cardápio Studio no Supabase com permissão e persistência garantida
 */
export const saveCardapioStudioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { cardapio: CardapioData; pageId?: string }) => d)
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;
    const { cardapio, pageId } = input;

    let targetPage: any = null;
    if (pageId) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, display_name, social_links")
        .eq("id", pageId)
        .maybeSingle();
      targetPage = data;
    }

    if (!targetPage && cardapio.slug) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, display_name, social_links")
        .eq("slug", cardapio.slug)
        .maybeSingle();
      targetPage = data;
    }

    if (!targetPage && cardapio.restaurantName) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, display_name, social_links")
        .eq("user_id", userId)
        .eq("display_name", cardapio.restaurantName)
        .maybeSingle();
      targetPage = data;
    }

    const rawSlug = cardapio.slug || slugify(cardapio.restaurantName || "cardapio-online");
    let slug = targetPage?.slug || rawSlug;

    if (!targetPage) {
      const { data: slugCheck } = await supabase
        .from("bio_pages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugCheck) {
        slug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const generatedCustomHtml = generateIfoodCardapioHtml(cardapio, { slug });

    const existingSocial = (targetPage?.social_links as Record<string, any>) || {};
    const updatedSocial = {
      ...existingSocial,
      is_cardapio_page: true,
      cardapio_data: cardapio,
      address: cardapio.address,
      opening_hours: cardapio.openingHours,
      delivery_fee: cardapio.deliveryFee,
      min_order: cardapio.minOrder,
      logo_url: cardapio.logoUrl,
      background_color: cardapio.backgroundColor,
      button_color: cardapio.buttonColor,
      custom_font: cardapio.customFont,
      visual_effect: cardapio.visualEffect,
      custom_html: generatedCustomHtml,
      updated_at: new Date().toISOString(),
    };

    const updatePayload = {
      display_name: cardapio.restaurantName,
      description: cardapio.tagline || cardapio.description,
      whatsapp: cardapio.whatsapp || null,
      template_id: "cardapio-pro",
      published: true,
      social_links: updatedSocial,
      updated_at: new Date().toISOString(),
    };

    if (targetPage) {
      let updateRes = await supabase
        .from("bio_pages")
        .update(updatePayload as any)
        .eq("id", targetPage.id)
        .select("id, slug");

      if (
        (updateRes.error || !updateRes.data || updateRes.data.length === 0) &&
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
      ) {
        const serviceClient = getServiceSupabaseClient();
        updateRes = await serviceClient
          .from("bio_pages")
          .update(updatePayload as any)
          .eq("id", targetPage.id)
          .select("id, slug");
      }

      if (updateRes.error) {
        throw new Error(`Erro ao atualizar cardápio: ${updateRes.error.message}`);
      }

      const row = updateRes.data?.[0] || targetPage;
      return {
        success: true,
        pageId: row.id,
        slug: row.slug,
        publicUrl: `/p/${row.slug}`,
      };
    } else {
      const insertPayload = {
        user_id: userId,
        slug,
        display_name: cardapio.restaurantName,
        description: cardapio.tagline || cardapio.description,
        whatsapp: cardapio.whatsapp || null,
        template_id: "cardapio-pro",
        published: true,
        social_links: updatedSocial,
      };

      let insertRes = await supabase
        .from("bio_pages")
        .insert(insertPayload as any)
        .select("id, slug")
        .single();

      if (insertRes.error && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        const serviceClient = getServiceSupabaseClient();
        insertRes = await serviceClient
          .from("bio_pages")
          .insert(insertPayload as any)
          .select("id, slug")
          .single();
      }

      if (insertRes.error || !insertRes.data) {
        throw new Error(
          `Erro ao criar cardápio: ${insertRes.error?.message || "Falha na inserção"}`,
        );
      }

      return {
        success: true,
        pageId: insertRes.data.id,
        slug: insertRes.data.slug,
        publicUrl: `/p/${insertRes.data.slug}`,
      };
    }
  });

/**
 * 8.2 Salva Loja Studio no Supabase com persistência garantida
 */
export const saveLojaStudioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { loja: LojaData; pageId?: string }) => d)
  .handler(async ({ data: input, context }) => {
    const supabase = context.supabase;
    const userId = context.userId;
    const { loja, pageId } = input;

    let targetPage: any = null;
    if (pageId) {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, slug, social_links")
        .eq("id", pageId)
        .maybeSingle();
      targetPage = data;
    }

    const rawSlug = slugify(loja.storeName || "loja-online");
    let slug = targetPage?.slug || rawSlug;

    if (!targetPage) {
      const { data: slugCheck } = await supabase
        .from("bio_pages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugCheck) {
        slug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const existingSocial = (targetPage?.social_links as Record<string, any>) || {};
    const updatedSocial = {
      ...existingSocial,
      is_store_page: true,
      store_data: loja,
      address: loja.address,
      shipping_info: loja.shippingInfo,
      opening_hours: loja.openingHours,
      logo_url: loja.logoUrl,
      background_color: loja.backgroundColor,
      updated_at: new Date().toISOString(),
    };

    if (targetPage) {
      const { error } = await supabase
        .from("bio_pages")
        .update({
          display_name: loja.storeName,
          description: loja.tagline || loja.description,
          whatsapp: loja.whatsapp || null,
          template_id: "storefront",
          published: true,
          social_links: updatedSocial,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetPage.id);

      if (error) {
        throw new Error(`Erro ao atualizar loja: ${error.message}`);
      }

      return {
        success: true,
        pageId: targetPage.id,
        slug: targetPage.slug,
        publicUrl: `/p/${targetPage.slug}`,
      };
    } else {
      const { data: created, error } = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          slug,
          display_name: loja.storeName,
          description: loja.tagline || loja.description,
          whatsapp: loja.whatsapp || null,
          template_id: "storefront",
          published: true,
          social_links: updatedSocial,
        })
        .select("id, slug")
        .single();

      if (error) {
        throw new Error(`Erro ao criar loja: ${error.message}`);
      }

      return {
        success: true,
        pageId: created.id,
        slug: created.slug,
        publicUrl: `/p/${created.slug}`,
      };
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
      .select("id, display_name, slug, social_links, updated_at, created_at")
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
          name: csp?.name || row.display_name || "Site Criativo",
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

/**
 * 10. Copiloto IA Server-Side para o Cardápio Studio com Google Gemini
 */
export const processCardapioAiStudioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      userMessage: string;
      currentCardapio: CardapioData;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>;
      apiKey?: string;
      leadContext?: {
        name?: string;
        niche?: string;
        address?: string;
        rating?: number | null;
        reviewsCount?: number | null;
        photos?: string[];
      };
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      try {
        const { data: userData } = await context.supabase.auth.getUser();
        resolvedKey = userData?.user?.user_metadata?.gemini_api_key;
      } catch (authErr) {
        console.warn("[CardapioServer] Falha ao extrair user_metadata:", authErr);
      }
    }
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }
    if (!resolvedKey) {
      throw new Error(
        "Chave do Google AI Studio não encontrada. Configure sua chave no painel de Configurações.",
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const targetNiche = input.leadContext?.niche || input.currentCardapio?.niche || "gastronomia";
    const systemPrompt = buildCardapioAiSystemPrompt(targetNiche);
    const _unusedPrompt = `Você é o Diretor de Criação & Growth de Gastronomia do EIA Link.
Você atua como um Especialista Sênior em Cardápios Inteligentes estilo iFood, focado em alta conversão e experiência de usuário impecável.

SEU TOM DE VOZ:
- Seja prestativo, ágil, simpático e empolgado ("Fala, mestre!", "Perfeito! Já fiz esse ajuste", "Ficou sensacional").
- Fale com entusiasmo sobre os pratos e gastronomia.

REGRAS CRÍTICAS DE RESPOSTA:
1. SEMPRE responda o que você fez de forma clara e amigável.
2. SEMPRE QUE HOUVER QUALQUER MODIFICAÇÃO SOLICITADA (novos itens, mudança de preços, cor de destaque "buttonColor", cor de fundo "backgroundColor", logotipo "logoUrl", slogan, categorias, etc.), você DEVE OBRIGATORIAMENTE incluir no final da resposta o bloco JSON completo com os dados atualizados envolto em \`\`\`json e \`\`\`.
3. O JSON deve seguir a estrutura exata do cardápio existente:
{
  "restaurantName": "...",
  "niche": "...",
  "tagline": "...",
  "description": "...",
  "whatsapp": "...",
  "address": "...",
  "deliveryFee": "...",
  "minOrder": 25,
  "openingHours": "...",
  "themeColor": "orange",
  "buttonColor": "#f97316",
  "backgroundColor": "#09090b",
  "logoUrl": "...",
  "styleVariant": "ifood-modern",
  "visualEffect": "glassmorphism",
  "categories": [
    { "id": "todos", "name": "Todos", "icon": "🍽️" },
    ...
  ],
  "items": [
    {
      "id": "item-1",
      "name": "...",
      "description": "...",
      "price": 35.9,
      "category": "...",
      "isPopular": true,
      "badge": "Mais Pedido ⭐",
      "image": "..."
    }
  ]
}
4. Nunca devolva JSON quebrado. Preços devem ser números. Mantenha os itens existentes a menos que o usuário peça para remover.`;

    const formattedContents: any[] = [];

    // Contexto com cardápio atual
    if (
      input.currentCardapio &&
      Array.isArray(input.currentCardapio.items) &&
      input.currentCardapio.items.length > 0
    ) {
      formattedContents.push({
        role: "user",
        parts: [
          {
            text: `[ESTADO ATUAL DO CARDÁPIO]:\n${JSON.stringify(input.currentCardapio, null, 2)}\nUse esse estado como base para editar, adicionar ou refinar o que o usuário pedir.`,
          },
        ],
      });
      formattedContents.push({
        role: "model",
        parts: [
          {
            text: `Entendido perfeitamente! Tenho o cardápio do "${input.currentCardapio.restaurantName}" pronto para ser atualizado.`,
          },
        ],
      });
    }

    // Histórico
    if (input.history && input.history.length > 0) {
      for (const msg of input.history.slice(-6)) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Mensagem atual do usuário com anexos
    const currentParts: any[] = [];
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    currentParts.push({ text: input.userMessage });
    formattedContents.push({
      role: "user",
      parts: currentParts,
    });

    let rawText = "";
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 16384,
        },
      });
      rawText = res.text?.trim() || "";
    } catch (err: any) {
      console.warn("[CardapioCopilot] Erro com gemini-2.5-flash:", err?.message || err);
      try {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: formattedContents,
          config: { systemInstruction: systemPrompt, temperature: 0.6, maxOutputTokens: 16384 },
        });
        rawText = fallbackRes.text?.trim() || "";
      } catch (fbErr: any) {
        console.warn(
          "[CardapioCopilot] Erro no fallback gemini-2.5-flash-lite:",
          fbErr?.message || fbErr,
        );
      }
    }

    if (!rawText) {
      throw new Error("Não foi possível obter resposta da IA no momento. Tente novamente.");
    }

    // Extrai o JSON
    let updatedCardapio: CardapioData | null = null;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    let jsonStringCandidate = jsonMatch ? jsonMatch[1].trim() : "";

    if (!jsonStringCandidate) {
      const braceMatch = rawText.match(
        /(\{[\s\S]*"(?:restaurantName|items|backgroundColor|themeColor)"[\s\S]*\})/i,
      );
      if (braceMatch) {
        jsonStringCandidate = braceMatch[1].trim();
      }
    }

    if (jsonStringCandidate) {
      try {
        const parsed = JSON.parse(jsonStringCandidate);
        if (
          parsed &&
          (parsed.restaurantName ||
            Array.isArray(parsed.items) ||
            parsed.backgroundColor ||
            parsed.logoUrl)
        ) {
          updatedCardapio = sanitizeCardapioPhotosForNiche(
            {
              ...input.currentCardapio,
              ...parsed,
              rating: input.leadContext?.rating ?? input.currentCardapio?.rating ?? null,
              reviewsCount:
                input.leadContext?.reviewsCount ?? input.currentCardapio?.reviewsCount ?? null,
              categories:
                Array.isArray(parsed.categories) && parsed.categories.length > 0
                  ? parsed.categories
                  : input.currentCardapio.categories,
              items:
                Array.isArray(parsed.items) && parsed.items.length > 0
                  ? parsed.items
                  : input.currentCardapio.items,
              features: {
                ...(input.currentCardapio.features || {}),
                ...(parsed.features || {}),
              },
            },
            input.leadContext?.photos,
          );
          if (false)
            updatedCardapio = {
              ...input.currentCardapio,
              ...parsed,
              categories:
                Array.isArray(parsed.categories) && parsed.categories.length > 0
                  ? parsed.categories
                  : input.currentCardapio.categories,
              items:
                Array.isArray(parsed.items) && parsed.items.length > 0
                  ? parsed.items
                  : input.currentCardapio.items,
              features: {
                ...(input.currentCardapio.features || {}),
                ...(parsed.features || {}),
              },
            };
        }
      } catch (parseErr) {
        console.warn("[CardapioServer] Falha no parse do JSON retornado:", parseErr);
      }
    }

    const conversationalText = rawText
      .replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, "")
      .replace(/\{[\s\S]*"(?:restaurantName|items)"[\s\S]*\}/gi, "")
      .trim();

    return {
      replyText:
        conversationalText || "Alteração realizada com sucesso! O cardápio foi atualizado na tela.",
      updatedCardapio,
    };
  });

/**
 * 11. Copiloto IA Server-Side para a Loja Virtual & Catálogo com Google Gemini
 */
export const processLojaAiStudioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      userMessage: string;
      currentLoja: LojaData;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>;
      apiKey?: string;
      leadContext?: {
        name?: string;
        niche?: string;
        address?: string;
        rating?: number | null;
        reviewsCount?: number | null;
        photos?: string[];
      };
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    let resolvedKey = input.apiKey?.trim();
    if (!resolvedKey) {
      try {
        const { data: userData } = await context.supabase.auth.getUser();
        resolvedKey = userData?.user?.user_metadata?.gemini_api_key;
      } catch (authErr) {
        console.warn("[LojaServer] Falha ao extrair user_metadata:", authErr);
      }
    }
    if (!resolvedKey) {
      resolvedKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }
    if (!resolvedKey) {
      throw new Error(
        "Chave do Google AI Studio não encontrada. Configure sua chave no painel de Configurações.",
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const systemPrompt = `Você é o Diretor de E-commerce & Varejo Digital do EIA Link.
Você é especialista em Catálogos Online e Lojas Virtuais de alta conversão integradas com WhatsApp.

REGRAS DE RESPOSTA:
1. Responda de forma ágil, profissional e animada.
2. SEMPRE QUE HOUVER QUALQUER MODIFICAÇÃO SOLICITADA (produtos, preços, cores de fundo "backgroundColor", cor de botão "buttonColor", logotipo "logoUrl", slogan, categorias, variações de tamanho/cor, etc.), retorne no final o bloco JSON completo atualizado entre \`\`\`json e \`\`\`.
3. Estrutura JSON esperada:
{
  "storeName": "...",
  "niche": "...",
  "tagline": "...",
  "description": "...",
  "whatsapp": "...",
  "address": "...",
  "shippingInfo": "...",
  "openingHours": "...",
  "themeColor": "blue",
  "buttonColor": "#3b82f6",
  "backgroundColor": "#09090b",
  "logoUrl": "...",
  "styleVariant": "store-modern",
  "visualEffect": "glassmorphism",
  "categories": [
    { "id": "todos", "name": "Todos", "icon": "🛍️" },
    ...
  ],
  "items": [
    {
      "id": "prod-1",
      "name": "...",
      "description": "...",
      "price": 149.9,
      "category": "...",
      "isPopular": true,
      "badge": "Lançamento",
      "variations": ["P", "M", "G"],
      "image": "..."
    }
  ]
}`;

    const formattedContents: any[] = [];

    if (input.currentLoja) {
      formattedContents.push({
        role: "user",
        parts: [
          {
            text: `[ESTADO ATUAL DA LOJA]:\n${JSON.stringify(input.currentLoja, null, 2)}\nUse esse estado como base para editar, adicionar ou refinar o que o usuário pedir.`,
          },
        ],
      });
      formattedContents.push({
        role: "model",
        parts: [
          {
            text: `Entendido perfeitamente! Tenho o catálogo da "${input.currentLoja.storeName}" pronto para ser atualizado.`,
          },
        ],
      });
    }

    if (input.history && input.history.length > 0) {
      for (const msg of input.history.slice(-6)) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const currentParts: any[] = [];
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    currentParts.push({ text: input.userMessage });
    formattedContents.push({
      role: "user",
      parts: currentParts,
    });

    let rawText = "";
    let lastLojaError: any = null;
    const lojaModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"] as const;
    for (const modelToTry of lojaModels) {
      if (rawText) break;
      try {
        const res = await ai.models.generateContent({
          model: modelToTry,
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.6,
            maxOutputTokens: 16384,
            maxOutputTokens: 16384,
          },
        });
        rawText = res.text?.trim() || "";
      } catch (err: any) {
        lastLojaError = err;
        console.warn(`[LojaServer] Erro com ${modelToTry}:`, err?.message || err);
      }
    }

    if (!rawText) {
      const errMsg = lastLojaError?.message || String(lastLojaError || "Erro desconhecido");
      const lower = errMsg.toLowerCase();
      if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
        throw new Error(`Modelo do Google AI Studio inexistente ou indisponível: ${errMsg}`);
      }
      if (
        lower.includes("429") ||
        lower.includes("quota") ||
        lower.includes("resource_exhausted")
      ) {
        throw new Error(`Limite de cota atingido no Google AI Studio: ${errMsg}`);
      }
      throw new Error(`Não foi possível obter resposta da IA: ${errMsg}`);
    }

    let updatedLoja: LojaData | null = null;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    let jsonStringCandidate = jsonMatch ? jsonMatch[1].trim() : "";

    if (!jsonStringCandidate) {
      const braceMatch = rawText.match(
        /(\{[\s\S]*"(?:storeName|items|backgroundColor|themeColor)"[\s\S]*\})/i,
      );
      if (braceMatch) {
        jsonStringCandidate = braceMatch[1].trim();
      }
    }

    if (jsonStringCandidate) {
      try {
        const parsed = JSON.parse(jsonStringCandidate);
        if (
          parsed &&
          (parsed.storeName ||
            Array.isArray(parsed.items) ||
            parsed.backgroundColor ||
            parsed.logoUrl)
        ) {
          updatedLoja = {
            ...input.currentLoja,
            ...parsed,
            categories:
              Array.isArray(parsed.categories) && parsed.categories.length > 0
                ? parsed.categories
                : input.currentLoja.categories,
            items:
              Array.isArray(parsed.items) && parsed.items.length > 0
                ? parsed.items
                : input.currentLoja.items,
            features: {
              ...(input.currentLoja.features || {}),
              ...(parsed.features || {}),
            },
          };
        }
      } catch (parseErr) {
        console.warn("[LojaServer] Falha no parse do JSON retornado:", parseErr);
      }
    }

    const conversationalText = rawText
      .replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, "")
      .replace(/\{[\s\S]*"(?:storeName|items)"[\s\S]*\}/gi, "")
      .trim();

    return {
      replyText: conversationalText || "Catálogo atualizado com sucesso!",
      updatedLoja,
    };
  });
