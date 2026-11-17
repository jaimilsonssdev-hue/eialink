import { supabase } from "@/integrations/supabase/client";
import {
  getGeminiApiKey,
  resolveCreativeStudioApiKeyAsync,
} from "@/modules/studiopro/lib/creativeEngineService";
import { generateCreativeSiteFn } from "@/modules/studio/studio.functions";

export interface GeminiSiteChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface GenerateGeminiSiteParams {
  name: string;
  niche: string;
  city: string;
  phone?: string | null;
  endereco?: string | null;
  nota_google?: number | null;
  total_avaliacoes?: number | null;
  photos?: string[];
  prompt?: string;
  currentHtml?: string;
  messages?: Array<{ role: "user" | "assistant" | "model"; content: string }>;
}

export interface GenerateGeminiSiteResult {
  html: string;
  explanation: string;
  suggestions: string[];
  model: string;
}

export async function generateGeminiSiteWithStudio(
  params: GenerateGeminiSiteParams,
): Promise<GenerateGeminiSiteResult> {
  // 1. Resolve a chave da API de forma assíncrona, sincronizando do Supabase Auth e Banco se necessário
  let clientKey = getGeminiApiKey();
  if (!clientKey) {
    try {
      clientKey = await resolveCreativeStudioApiKeyAsync();
    } catch (err) {
      console.warn("[geminiSiteStudio] Chave não resolvida localmente, prosseguindo com credenciais de servidor:", err);
    }
  }

  const payload = {
    name: params.name,
    niche: params.niche,
    city: params.city,
    niche_slug: params.niche,
    phone: params.phone || "",
    whatsapp: params.phone || "",
    endereco: params.endereco || "",
    nota_google: params.nota_google ?? 4.9,
    total_avaliacoes: params.total_avaliacoes ?? 50,
    photos: params.photos || [],
    prompt: params.prompt || "",
    current_html: params.currentHtml || "",
    messages: params.messages || [],
    apiKey: clientKey || undefined,
  };

  let resData: any = null;
  let lastErr: any = null;

  // 1. Tenta via supabase.functions.invoke na Edge Function oficial
  try {
    const { data, error } = await supabase.functions.invoke("gerar-site-gemini", {
      body: payload,
    });
    if (!error && data?.html) {
      resData = data;
    } else if (error) {
      lastErr = error;
    }
  } catch (invErr) {
    lastErr = invErr;
  }

  // 2. Fallback via fetch direto para a Edge Function
  if (!resData) {
    try {
      const response = await fetch(
        "https://nitzhrmcbotdriajaxhw.supabase.co/functions/v1/gerar-site-gemini",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "sb_publishable_wSndRFAjfVECz_RjpTa-LQ_qvKyX2GM",
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        resData = await response.json();
      } else {
        const textErr = await response.text().catch(() => "");
        throw new Error(textErr || `HTTP ${response.status}`);
      }
    } catch (directErr) {
      console.warn("[geminiSiteStudio] Falha no fetch direto:", directErr);
      if (!lastErr) lastErr = directErr;
    }
  }

  // 3. Fallback de altíssima segurança: Motor de Servidor (generateCreativeSiteFn)
  // Caso a Edge Function não tenha a chave configurada em suas secrets de nuvem,
  // aciona a função de servidor do TanStack Start que possui acesso direto aos bancos e credenciais!
  if (!resData?.html) {
    try {
      console.info("[geminiSiteStudio] Acionando fallback resiliente via servidor Node.js...");
      const fullPrompt = [
        params.prompt || `Crie um site moderno e completo para ${params.name} (${params.niche}) em ${params.city}.`,
        params.endereco ? `Endereço Google: ${params.endereco}` : "",
        params.phone ? `WhatsApp: ${params.phone}` : "",
        params.nota_google ? `Avaliação Google: ${params.nota_google} estrelas (${params.total_avaliacoes || 45} avaliações)` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const serverRes = await generateCreativeSiteFn({
        data: {
          briefingOrPrompt: fullPrompt,
          existingHtml: params.currentHtml || undefined,
          projectName: params.name,
          niche: params.niche,
          city: params.city,
          businessAddress: params.endereco || undefined,
          businessWhatsapp: params.phone || undefined,
          rating: params.nota_google ? Number(params.nota_google) : 4.9,
          reviewsCount: params.total_avaliacoes ? Number(params.total_avaliacoes) : 45,
          photos: params.photos || undefined,
          apiKey: clientKey || undefined,
          clientGeminiKey: clientKey || undefined,
          conversationHistory: params.messages?.map((m) => ({
            role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
            content: m.content,
          })),
        },
      });

      if (serverRes?.html && serverRes.html.length > 50) {
        resData = {
          html: serverRes.html,
          explanation: serverRes.explanation || "Site gerado pelo Google Gemini 3.8 Flash através do motor seguro de servidor.",
          suggestions: [
            "✨ Otimizar cores e tipografia editorial",
            "💬 Adicionar botão de WhatsApp flutuante",
            "⭐ Destacar depoimentos do Google",
            "📍 Adicionar mapa interativo e horários",
          ],
          model: "gemini-3.8-flash",
        };
      }
    } catch (serverErr) {
      console.warn("[geminiSiteStudio] Falha no fallback de servidor:", serverErr);
      if (!lastErr) lastErr = serverErr;
    }
  }

  if (resData?.html) {
    return {
      html: resData.html,
      explanation: resData.explanation || "Site gerado com padrão de agência digital.",
      suggestions: Array.isArray(resData.suggestions) ? resData.suggestions : [],
      model: resData.model || "gemini-3.8-flash",
    };
  }

  throw new Error(
    lastErr?.message || "Não foi possível gerar o site no momento. Verifique sua chave da API do Google AI Studio.",
  );
}
