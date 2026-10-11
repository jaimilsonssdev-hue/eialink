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
import type { CardapioData } from "@/modules/cardapio/cardapioAiService";
import type { LojaData } from "@/modules/loja/lojaAiService";

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

    let resolvedKey = input.apiKey?.trim();
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
    if (!effectiveHtml && (input.projectId || input.businessSlug)) {
      try {
        let dbPage: any = null;
        if (input.projectId) {
          const { data } = await supabase
            .from("bio_pages")
            .select("custom_html, social_links")
            .eq("id", input.projectId)
            .maybeSingle();
          dbPage = data;
        }
        if (!dbPage && input.businessSlug) {
          const { data } = await supabase
            .from("bio_pages")
            .select("custom_html, social_links")
            .eq("slug", input.businessSlug)
            .maybeSingle();
          dbPage = data;
        }
        if (dbPage) {
          const rawSocial = (dbPage.social_links as Record<string, any>) || {};
          effectiveHtml = dbPage.custom_html || rawSocial.custom_html || "";
        }
      } catch (loadErr) {
        console.warn("[Studio] Falha ao recuperar HTML base da página:", loadErr);
      }
    }

    let userPrompt = input.briefingOrPrompt;

    // Injeta metadados de ferramentas do ecossistema EiaLink
    const businessContextParts: string[] = [];
    if (input.projectName) businessContextParts.push(`Nome Oficial: "${input.projectName}"`);
    if (input.niche) businessContextParts.push(`Nicho de Atuação: "${input.niche}"`);
    if (input.city) businessContextParts.push(`Cidade / Região: "${input.city}"`);
    if (input.businessAddress) businessContextParts.push(`Endereço Verificado (usar no Mapa/GPS/Waze): "${input.businessAddress}"`);
    if (input.businessWhatsapp) businessContextParts.push(`WhatsApp Oficial (usar no botão pulsante e CTAs): "${input.businessWhatsapp}"`);
    if (input.businessSlug) businessContextParts.push(`Link de Agendamento Online da plataforma: "/agendar/${input.businessSlug}"`);
    if (input.rating) businessContextParts.push(`Avaliação no Google Maps: ${input.rating} estrelas (${input.reviewsCount || 80} avaliações reais)`);
    if (input.photos && input.photos.length > 0) {
      businessContextParts.push(`Fotos reais da empresa para usar no site: ${input.photos.slice(0, 6).join(", ")}`);
    }

    if (businessContextParts.length > 0) {
      userPrompt += `\n\n[DADOS DE INTEGRAÇÃO DO ECOSSISTEMA EIALINK]:\n${businessContextParts.join("\n")}\nPor favor, certifique-se de preencher a seção de Localização (com iframe e botões de GPS Waze/Maps), o botão de Agendamento Online e o WhatsApp flutuante utilizando estes dados reais!`;
    }

    if (input.isRegeneration) {
      userPrompt += `\n\n[DIRETRIZ DE REINVENÇÃO TOTAL & TROCA DE MODELO]:
O usuário solicitou explicitamente TROCAR O MODELO e criar uma PROPOSTA DE DESIGN COMPLETAMENTE NOVA, DIFERENTE E SURPREENDENTE.
NÃO repita a mesma estrutura, ordem de blocos, hero ou paleta de cores.
Experimente um formato e layout inovador (ex: se era clássico/cards, use um Split moderno, Bento Grid, Neobrutalismo pop com sombras duras, ou Glassmorphism translúcido com luzes neon).
Surpreenda com uma organização criativa e única que valorize a marca do cliente ao máximo!`;
    }

    const isModification = Boolean(effectiveHtml && effectiveHtml.length > 50 && !input.isRegeneration);

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
    // Modelos oficiais do Google AI Studio para geração de código e raciocínio
    const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview"];

    for (const modelCandidate of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents,
            config: {
              systemInstruction: CODE_GENERATION_SYSTEM_PROMPT,
              temperature: 0.7,
              thinkingConfig: {
                thinkingLevel: "low" as any,
              },
            },
          });
          responseText = response.text?.trim() || "";
          if (responseText) break;
        } catch (apiErr: any) {
          lastCapturedError = apiErr;
          const errStr = JSON.stringify(apiErr || {});
          const status = apiErr?.status || apiErr?.code;
          const isTransient =
            status === 503 ||
            status === 429 ||
            errStr.includes("503") ||
            errStr.includes("UNAVAILABLE") ||
            errStr.includes("RESOURCE_EXHAUSTED");

          if (isTransient && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          console.warn(`[StudioServer] Modelo ${modelCandidate} falhou, tentando contingência:`, apiErr?.message || apiErr);
          break;
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      const errDetails = lastCapturedError?.message || (typeof lastCapturedError === "object" ? JSON.stringify(lastCapturedError) : "Erro de resposta");
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
      const parts = raw.split("<<<EXPLANATION>>>");
      explanation = parts[1].trim();
      cleanHtml = parts[0].trim();
    } else {
      // Extração de blocos de código se não veio a tag <<<HTML>>>
      const htmlBlockMatch = raw.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
      if (htmlBlockMatch && htmlBlockMatch[1] && /<(?:!doctype|html|body|div)/i.test(htmlBlockMatch[1])) {
        cleanHtml = htmlBlockMatch[1].trim();
        explanation = raw.replace(/```(?:html)?\s*[\s\S]*?\s*```/gi, "").trim();
      } else {
        const docMatch = raw.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i) || raw.match(/(<html[\s\S]*<\/html>)/i);
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

    // Verificação se o retorno contém código HTML real ou se a IA retornou apenas texto explicativo
    const hasValidHtmlTags = /<(?:!doctype|html|body|div|section|main|head)/i.test(cleanHtml);
    if (!hasValidHtmlTags && isModification && effectiveHtml) {
      console.warn("[StudioServer] IA retornou apenas texto sem código HTML. Executando síntese de código...");
      try {
        const retryRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `O usuário solicitou o ajuste: "${input.briefingOrPrompt}".
Sua explicação para o usuário: "${cleanHtml}".
Agora retorne OBRIGATORIAMENTE apenas o código HTML5 completo atualizado (de <!DOCTYPE html> até </html>) aplicando o ajuste acima no seguinte código:
${effectiveHtml}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: "Você é um gerador de código HTML. Retorne estritamente o código HTML5 completo, sem markdown, sem explicações adicionais.",
            temperature: 0.5,
          },
        });
        const retryText = retryRes.text?.trim() || "";
        const retryBlockMatch = retryText.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
        const candidateRetry = retryBlockMatch ? retryBlockMatch[1].trim() : retryText;
        if (/<(?:!doctype|html|body|div)/i.test(candidateRetry)) {
          explanation = cleanHtml;
          cleanHtml = candidateRetry;
        } else {
          explanation = cleanHtml;
          cleanHtml = effectiveHtml;
        }
      } catch (retryErr) {
        console.warn("[StudioServer] Falha no retry forçado, preservando HTML existente:", retryErr);
        explanation = cleanHtml;
        cleanHtml = effectiveHtml;
      }
    }

    if (!explanation) {
      explanation = isModification
        ? "✨ Ajuste aplicado com sucesso! Atualizei o site com as modificações que você pediu. Veja a prévia na tela ao lado."
        : "🚀 Site gerado com sucesso! Já estruturei com design moderno, alta conversão e ferramentas integradas.";
    }

    let savedPageId = input.projectId;
    let savedSlug = "";

    try {
      const pageName = input.projectName || "Site Criativo";
      const slugCandidate = slugify(pageName);

      let existing: { id: string; slug: string; social_links: any } | null = null;
      if (input.projectId) {
        const { data: byId } = await supabase
          .from("bio_pages")
          .select("id, slug, social_links")
          .eq("id", input.projectId)
          .maybeSingle();
        existing = byId as any;
      }
      if (!existing && input.businessSlug) {
        const { data: bySlug } = await supabase
          .from("bio_pages")
          .select("id, slug, social_links")
          .eq("slug", input.businessSlug)
          .maybeSingle();
        existing = bySlug as any;
      }
      if (!existing && pageName) {
        const { data: byName } = await supabase
          .from("bio_pages")
          .select("id, slug, social_links")
          .eq("user_id", userId)
          .eq("display_name", pageName)
          .maybeSingle();
        existing = byName as any;
      }

      const existingSocial = (existing?.social_links as any) || {};
      const updatedSocial = {
        ...existingSocial,
        custom_html: cleanHtml,
        niche: input.niche || existingSocial.niche,
        city: input.city || existingSocial.city,
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
            whatsapp: input.businessWhatsapp || undefined,
            custom_html: cleanHtml,
            social_links: updatedSocial,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
        savedPageId = existing.id;
        savedSlug = existing.slug;
      } else {
        const uniqueSlug = input.businessSlug || `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
        const { data: created } = await supabase
          .from("bio_pages")
          .insert({
            user_id: userId,
            display_name: pageName,
            slug: uniqueSlug,
            template_id: "site-maquina",
            published: true,
            whatsapp: input.businessWhatsapp || null,
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

    const briefingModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview"];
    let briefingText = "";

    for (const modelCandidate of briefingModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents: [
            ...formattedHistory,
            { role: "user", parts: userParts },
          ],
          config: {
            systemInstruction: BRIEFING_SYSTEM_PROMPT,
            temperature: 0.7,
            thinkingConfig: {
              thinkingLevel: "low" as any,
            },
          },
        });
        briefingText = response.text?.trim() || "";
        if (briefingText) break;
      } catch (err) {
        console.warn(`[StudioServer] Falha no briefing com ${modelCandidate}:`, err);
      }
    }

    return {
      ok: true,
      briefing: briefingText || "Plano estratégico elaborado com sucesso.",
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
    const updatedSocial = {
      ...existingSocial,
      custom_html: proj.html,
      creative_studio_project: proj,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("bio_pages")
        .update({
          custom_html: proj.html,
          social_links: updatedSocial,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", existing.id);
      return { success: true, pageId: existing.id, slug: existing.slug };
    } else {
      const slugCandidate = slugify(proj.name || "site-criativo");
      const uniqueSlug = proj.slug || `${slugCandidate}-${Date.now().toString(36).slice(-4)}`;
      const { data: created } = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          display_name: proj.name || "Site Criativo",
          slug: uniqueSlug,
          template_id: "site-maquina",
          published: true,
          custom_html: proj.html,
          social_links: updatedSocial,
        } as any)
        .select("id, slug")
        .single();
      return { success: true, pageId: created?.id, slug: created?.slug || uniqueSlug };
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
        .select("id, slug, social_links")
        .eq("id", pageId)
        .maybeSingle();
      targetPage = data;
    }

    const rawSlug = slugify(cardapio.restaurantName || "cardapio-online");
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
      is_cardapio_page: true,
      cardapio_data: cardapio,
      address: cardapio.address,
      opening_hours: cardapio.openingHours,
      delivery_fee: cardapio.deliveryFee,
      min_order: cardapio.minOrder,
      logo_url: cardapio.logoUrl,
      background_color: cardapio.backgroundColor,
      updated_at: new Date().toISOString(),
    };

    if (targetPage) {
      const { error } = await supabase
        .from("bio_pages")
        .update({
          display_name: cardapio.restaurantName,
          description: cardapio.tagline || cardapio.description,
          whatsapp: cardapio.whatsapp || null,
          template_id: "cardapio-pro",
          published: true,
          social_links: updatedSocial,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetPage.id);

      if (error) {
        throw new Error(`Erro ao atualizar cardápio: ${error.message}`);
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
          display_name: cardapio.restaurantName,
          description: cardapio.tagline || cardapio.description,
          whatsapp: cardapio.whatsapp || null,
          template_id: "cardapio-pro",
          published: true,
          social_links: updatedSocial,
        })
        .select("id, slug")
        .single();

      if (error) {
        throw new Error(`Erro ao criar cardápio: ${error.message}`);
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

