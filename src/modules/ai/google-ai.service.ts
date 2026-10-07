export const ACTIVE_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export type ActiveGeminiModel = (typeof ACTIVE_GEMINI_MODELS)[number];

export interface GoogleAiRequestOptions {
  apiKey?: string;
  model?: ActiveGeminiModel | string;
  systemPrompt?: string;
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  temperature?: number;
  responseMimeType?: "application/json" | "text/plain";
}

export interface GoogleAiResponse {
  ok: boolean;
  text?: string;
  json?: unknown;
  modelUsed?: string;
  error?: string;
  status?: number;
}

import { createClient } from "@supabase/supabase-js";

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

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolve a melhor chave disponível para o Google AI Studio:
 * 1. Chave passada pelo cliente (override)
 * 2. Variável de ambiente do processo ou Vite
 */
export function resolveGeminiApiKey(override?: string): string | null {
  if (override && override.trim().length > 5) {
    return override.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 5) {
      return envKey.trim();
    }
  }
  return null;
}

/**
 * Resolve a chave de forma assíncrona, consultando também o banco de dados Supabase
 * se nenhuma chave local ou de ambiente for encontrada.
 */
export async function resolveGeminiApiKeyAsync(override?: string): Promise<string | null> {
  const quick = resolveGeminiApiKey(override);
  if (quick) return quick;

  try {
    const supabase = getServiceSupabaseClient();
    const { data } = await supabase
      .from("payment_gateway_settings")
      .select("gemini_api_key")
      .eq("id", "default")
      .maybeSingle();

    const dbKey = (data as any)?.gemini_api_key;
    if (dbKey && typeof dbKey === "string" && dbKey.trim().length > 5) {
      return dbKey.trim();
    }
  } catch (err) {
    console.warn("[GoogleAiService] Não foi possível consultar chave no banco:", err);
  }

  return null;
}

/**
 * Valida a chave diretamente contra a API oficial da Google em tempo real.
 */
export async function testGoogleGeminiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, message: "Nenhuma chave foi informada." };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `A Google recusou a chave (HTTP ${res.status}).`;
      return { ok: false, message: msg };
    }

    const data = await res.json().catch(() => ({}));
    const models = Array.isArray(data?.models) ? data.models : [];
    const hasGemini = models.some((m: { name?: string }) => m.name?.includes("gemini"));

    return {
      ok: true,
      message: hasGemini
        ? "Chave do Google AI Studio validada com sucesso! Modelos Gemini operacionais."
        : "Chave validada com o Google AI Studio.",
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Falha de rede ao contatar a Google.",
    };
  }
}

/**
 * Chama a API oficial do Google Gemini (v1beta) com fallback automático entre modelos ativos.
 */
export async function callGoogleAi(options: GoogleAiRequestOptions): Promise<GoogleAiResponse> {
  const apiKey = await resolveGeminiApiKeyAsync(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      status: 401,
      error: "Nenhuma chave do Google Gemini foi fornecida ou configurada no sistema.",
    };
  }

  // Modelos prioritários atuais da Google
  const modelsToTry: string[] = options.model
    ? [options.model, ...ACTIVE_GEMINI_MODELS.filter((m) => m !== options.model)]
    : [...ACTIVE_GEMINI_MODELS];

  let lastError = "Nenhum modelo respondeu.";
  let lastStatus = 500;

  for (const model of modelsToTry) {
    try {
      const cleanModel = model.replace(/^models\//, "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

      const payload: Record<string, unknown> = {
        contents: options.contents,
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
        },
      };

      if (options.systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: options.systemPrompt }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        let parsedJson: unknown = null;
        if (options.responseMimeType === "application/json" || text.trim().startsWith("{")) {
          try {
            const cleanText = text
              .trim()
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/, "")
              .replace(/```\s*$/, "");
            parsedJson = JSON.parse(cleanText);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                parsedJson = JSON.parse(match[0]);
              } catch {
                // parse falhou
              }
            }
          }
        }

        return {
          ok: true,
          status: 200,
          text,
          json: parsedJson,
          modelUsed: cleanModel,
        };
      }

      // Se deu erro (ex: modelo não encontrado ou cota), captura e tenta o próximo
      const errBody = await res.text();
      let parsedMsg = "";
      try {
        const jsonErr = JSON.parse(errBody);
        parsedMsg = jsonErr?.error?.message || "";
      } catch {
        parsedMsg = errBody.slice(0, 200);
      }

      lastError = `Modelo ${cleanModel} retornou ${res.status}: ${parsedMsg || "Erro desconhecido"}`;
      lastStatus = res.status;
      console.warn(`[GoogleAiService] ${lastError}`);

      // Se a chave for comprovadamente inválida, não adianta tentar outros modelos
      if (res.status === 400 && (errBody.includes("API_KEY_INVALID") || errBody.includes("API key not valid"))) {
        return {
          ok: false,
          status: 400,
          error: "A chave de API informada é inválida ou expirou no Google AI Studio.",
        };
      }
    } catch (netErr) {
      lastError = netErr instanceof Error ? netErr.message : "Falha na requisição";
      console.warn(`[GoogleAiService] Erro ao tentar modelo ${model}:`, netErr);
    }
  }

  return {
    ok: false,
    status: lastStatus,
    error: lastError,
  };
}
