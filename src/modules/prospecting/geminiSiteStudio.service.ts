import { supabase } from "@/integrations/supabase/client";
import { getGeminiApiKey } from "@/modules/studiopro/lib/creativeEngineService";

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
  const clientKey = getGeminiApiKey();

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

  // 1. Tenta via supabase.functions.invoke
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

  if (resData?.html) {
    return {
      html: resData.html,
      explanation: resData.explanation || "Site gerado com padrão de agência digital.",
      suggestions: Array.isArray(resData.suggestions) ? resData.suggestions : [],
      model: resData.model || "gemini-3.8-flash",
    };
  }

  throw new Error(
    lastErr?.message || "Não foi possível gerar o site no momento. Tente novamente.",
  );
}
