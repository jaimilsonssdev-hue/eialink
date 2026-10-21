export const ACTIVE_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export type ActiveGeminiModel = (typeof ACTIVE_GEMINI_MODELS)[number];

export function formatGeminiErrorMessage(status: number, rawMessage: string, modelName: string): string {
  const lower = (rawMessage || "").toLowerCase();
  if (status === 404 || lower.includes("not found") || lower.includes("not_found") || lower.includes("is not supported")) {
    return `O modelo "${modelName}" não existe ou não está disponível para a sua chave no Google AI Studio (HTTP 404).`;
  }
  if (status === 429 || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit")) {
    return `Limite de cota atingido no Google AI Studio para o modelo "${modelName}" (HTTP 429). Aguarde alguns instantes ou verifique o faturamento da sua chave.`;
  }
  if (status === 400 || status === 403 || lower.includes("api_key_invalid") || lower.includes("api key not valid")) {
    return "Chave de API inválida, expirada ou sem permissão no Google AI Studio.";
  }
  return `Erro na API do Google Gemini (${modelName} - HTTP ${status}): ${rawMessage || "Falha desconhecida"}`;
}

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
    const { data, error } = await supabase
      .from("payment_gateway_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const dbKey = (data as any)?.gemini_api_key;
      if (dbKey && typeof dbKey === "string" && dbKey.trim().length > 5) {
        return dbKey.trim();
      }
    }
  } catch (err) {
    // Silencia erro para não quebrar a cadeia de resolução
  }

  return null;
}

export interface GeminiInteractionsOptions {
  apiKey?: string;
  model?: string; // Default: "gemini-2.5-flash"
  input: string | any;
  systemInstruction?: string;
  temperature?: number;
  attachments?: Array<{
    name?: string;
    mimeType: string;
    dataBase64: string;
  }>;
}

/**
 * Executa requisição na API oficial do Google AI Studio com gemini-2.5-flash e fallback único (gemini-2.5-flash-lite)
 */
export async function callGeminiInteractionsApi(
  options: GeminiInteractionsOptions,
): Promise<{ ok: boolean; text: string; error?: string }> {
  const apiKey = await resolveGeminiApiKeyAsync(options.apiKey);
  if (!apiKey) {
    return { ok: false, text: "", error: "Nenhuma chave do Google AI Studio configurada." };
  }

  const primaryModel =
    options.model && options.model !== "gemini-3.8-flash"
      ? options.model
      : ACTIVE_GEMINI_MODELS[0];
  const fallbackModel = ACTIVE_GEMINI_MODELS[1];
  const modelsToTry =
    primaryModel === fallbackModel ? [primaryModel] : [primaryModel, fallbackModel];

  const parts: any[] = [];
  if (options.attachments && options.attachments.length > 0) {
    for (const att of options.attachments) {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  parts.push({
    text: typeof options.input === "string" ? options.input : JSON.stringify(options.input),
  });

  let lastError = "";
  for (const model of modelsToTry) {
    try {
      const cleanModel = model.replace(/^models\//, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            ...(options.systemInstruction
              ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } }
              : {}),
            generationConfig: {
              temperature: options.temperature ?? 0.6,
            },
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (res.ok) {
        const data = await res.json();
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (outputText) {
          return { ok: true, text: outputText };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const rawMsg = errData?.error?.message || `HTTP ${res.status}`;
        lastError = formatGeminiErrorMessage(res.status, rawMsg, cleanModel);
        if (res.status === 400 || res.status === 403) {
          return { ok: false, text: "", error: lastError };
        }
      }
    } catch (err: any) {
      lastError = `Falha ao chamar o modelo "${model}": ${err?.message || "erro de rede"}`;
    }
  }

  return {
    ok: false,
    text: "",
    error: lastError || "Não foi possível obter resposta do Google AI Studio.",
  };
}

/**
 * Valida a chave diretamente contra a API oficial da Google em tempo real
 * usando gemini-2.5-flash como modelo principal e um único fallback.
 */
export async function testGoogleGeminiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, message: "Nenhuma chave foi informada." };
  }

  let lastErrorMessage = "";
  for (const model of ACTIVE_GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
          }),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (res.ok) {
        return {
          ok: true,
          message: `Google AI Studio conectado com sucesso! Modelo ${model} 100% operacional.`,
        };
      }

      const errData = await res.json().catch(() => ({}));
      const rawMsg = errData?.error?.message || `A Google recusou a chave (HTTP ${res.status}).`;
      lastErrorMessage = formatGeminiErrorMessage(res.status, rawMsg, model);

      if (res.status === 400 || res.status === 403) {
        return { ok: false, message: lastErrorMessage };
      }
    } catch (err: any) {
      lastErrorMessage = `Falha na conexão com o Google AI Studio (${model}): ${err?.message || "erro de rede"}`;
    }
  }

  return {
    ok: false,
    message:
      lastErrorMessage ||
      "Google recusou o acesso à API. Verifique se sua chave do Google AI Studio está correta.",
  };
}

/**
 * Chama a API oficial do Google Gemini (v1beta) com gemini-2.5-flash como primeiro modelo e um único fallback.
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

  const requestedModel =
    options.model && options.model !== "gemini-3.8-flash"
      ? options.model
      : ACTIVE_GEMINI_MODELS[0];
  const fallbackModel = ACTIVE_GEMINI_MODELS[1];
  const modelsToTry: string[] =
    requestedModel === fallbackModel
      ? [requestedModel]
      : [requestedModel, fallbackModel];

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

      const errBody = await res.text();
      let parsedMsg = "";
      try {
        const jsonErr = JSON.parse(errBody);
        parsedMsg = jsonErr?.error?.message || "";
      } catch {
        parsedMsg = errBody.slice(0, 200);
      }

      lastStatus = res.status;
      lastError = formatGeminiErrorMessage(res.status, parsedMsg, cleanModel);
      console.warn(`[GoogleAiService] ${lastError}`);

      if (res.status === 400 || res.status === 403) {
        return {
          ok: false,
          status: res.status,
          error: lastError,
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
