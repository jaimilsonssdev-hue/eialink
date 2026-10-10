export const ACTIVE_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
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
 * Valida a chave diretamente contra a API oficial da Google em tempo real
 * acionando especificamente o modelo gemini-3.8-flash.
 */
export async function testGoogleGeminiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, message: "Nenhuma chave foi informada." };
  }

  try {
    const testModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash"];
    let lastErrData: any = null;
    let res: Response | null = null;

    for (const model of testModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 2 },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        return {
          ok: true,
          message: `Google AI Studio conectado com sucesso! Modelo ${model} 100% operacional.`,
        };
      }

      lastErrData = await res.json().catch(() => ({}));
      // Se for chave comprovadamente inválida, interrompe de imediato
      if (res.status === 400 || res.status === 403) {
        const msg = lastErrData?.error?.message || "";
        if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
          return { ok: false, message: "Chave de API inválida ou revogada no Google AI Studio." };
        }
      }
    }

    if (res && res.ok) {
      return {
        ok: true,
        message: "Google AI Studio conectado com sucesso!",
      };
    }

    const errData = await res.json().catch(() => ({}));
    const rawMsg = errData?.error?.message || `A Google recusou a chave (HTTP ${res.status}).`;

    // Se for erro de autenticação ou chave inválida
    if (res.status === 400 || res.status === 403) {
      if (rawMsg.includes("API_KEY_INVALID") || rawMsg.includes("API key not valid")) {
        return { ok: false, message: "Chave de API inválida ou revogada no Google AI Studio." };
      }
      return { ok: false, message: `Google recusou o acesso: ${rawMsg}` };
    }

    // Se o modelo responder quota ou outro status
    if (res.status === 429) {
      return { ok: true, message: "Chave válida no Google AI Studio (limite de taxa temporário atingido)." };
    }

    return { ok: false, message: rawMsg };
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
