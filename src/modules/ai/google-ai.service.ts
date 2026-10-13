export const ACTIVE_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
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
  model?: string; // Default: "gemini-3.8-flash"
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
 * Executa requisição na nova Interactions API oficial do Google AI Studio com gemini-3.8-flash
 */
export async function callGeminiInteractionsApi(
  options: GeminiInteractionsOptions,
): Promise<{ ok: boolean; text: string; error?: string }> {
  const apiKey = await resolveGeminiApiKeyAsync(options.apiKey);
  if (!apiKey) {
    return { ok: false, text: "", error: "Nenhuma chave do Google AI Studio configurada." };
  }

  const model = options.model || "gemini-3.8-flash";

  // 1. Tenta via SDK oficial @google/genai com ai.interactions.create
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    let interactionInput: any = options.input;
    if (options.attachments && options.attachments.length > 0) {
      const parts: any[] = [];
      for (const att of options.attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
      if (typeof options.input === "string") {
        parts.push({ text: options.input });
      }
      interactionInput = { parts };
    }

    const interaction = await ai.interactions.create({
      model,
      input: interactionInput,
      ...(options.systemInstruction ? { system_instruction: options.systemInstruction } : {}),
      ...(options.temperature !== undefined ? { generation_config: { temperature: options.temperature } } : {}),
    });

    const outputText = (interaction as any).output_text || "";
    if (outputText) {
      return { ok: true, text: outputText };
    }

    const steps = (interaction as any).steps;
    if (Array.isArray(steps)) {
      for (const step of steps) {
        if (step.type === "model_output" && Array.isArray(step.content)) {
          const textPart = step.content.find((c: any) => c.type === "text" && c.text);
          if (textPart?.text) {
            return { ok: true, text: textPart.text };
          }
        }
      }
    }
  } catch (sdkErr: any) {
    console.warn(`[GoogleAiService] ai.interactions.create falhou com ${model}:`, sdkErr?.message || sdkErr);
  }

  // 2. Fallback REST para o endpoint oficial /v1beta/interactions com Api-Revision: 2026-05-20
  try {
    const restPayload: any = {
      model,
      input: typeof options.input === "string" ? options.input : JSON.stringify(options.input),
      ...(options.systemInstruction ? { system_instruction: options.systemInstruction } : {}),
      ...(options.temperature !== undefined ? { generation_config: { temperature: options.temperature } } : {}),
    };

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify(restPayload),
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.output_text) {
        return { ok: true, text: data.output_text };
      }
      if (Array.isArray(data.steps)) {
        for (const step of data.steps) {
          if (step.type === "model_output" && Array.isArray(step.content)) {
            const textPart = step.content.find((c: any) => c.type === "text" && c.text);
            if (textPart?.text) {
              return { ok: true, text: textPart.text };
            }
          }
        }
      }
    }
  } catch (restErr: any) {
    console.warn("[GoogleAiService] Falha no REST interactions:", restErr?.message || restErr);
  }

  return {
    ok: false,
    text: "",
    error: `Não foi possível obter resposta com ${model} na Interactions API.`,
  };
}

/**
 * Valida a chave diretamente contra a API oficial da Google em tempo real
 * acionando especificamente a Interactions API com o modelo gemini-3.8-flash.
 */
export async function testGoogleGeminiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { ok: false, message: "Nenhuma chave foi informada." };
  }

  // 1. Testa primeiramente via Interactions API oficial com gemini-3.8-flash
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": cleanKey,
        "Content-Type": "application/json",
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: "ping",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      return {
        ok: true,
        message: "Google AI Studio conectado com sucesso via Interactions API! Modelo gemini-3.8-flash 100% operacional.",
      };
    }

    const errData = await res.json().catch(() => ({}));
    const rawMsg = errData?.error?.message || `A Google recusou a chave (HTTP ${res.status}).`;

    if (res.status === 400 || res.status === 403) {
      if (rawMsg.includes("API_KEY_INVALID") || rawMsg.includes("API key not valid")) {
        return { ok: false, message: "Chave de API inválida ou revogada no Google AI Studio." };
      }
    }

    if (res.status === 429) {
      return { ok: true, message: "Chave válida no Google AI Studio (limite de taxa temporário atingido)." };
    }
  } catch (err) {
    console.warn("[GoogleAiService] Verificação REST falhou, testando via SDK:", err);
  }

  // 2. Testa via SDK oficial @google/genai com ai.interactions.create
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "ping",
    });

    if (interaction?.output_text !== undefined || interaction?.id) {
      return {
        ok: true,
        message: "Google AI Studio conectado com sucesso via SDK! Modelo gemini-3.8-flash 100% operacional.",
      };
    }
  } catch (sdkErr: any) {
    const msg = sdkErr?.message || "";
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      return { ok: false, message: "Chave de API inválida ou revogada no Google AI Studio." };
    }
  }

  return {
    ok: false,
    message: "Google recusou o acesso à API. Verifique se sua chave do Google AI Studio está correta.",
  };
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

  // Tenta prioritariamente via Interactions API oficial com gemini-3.8-flash
  const wantsFlash38 = !options.model || options.model === "gemini-3.8-flash";
  if (wantsFlash38) {
    try {
      const combinedInput = options.contents
        .map((c) => c.parts.map((p) => p.text).join("\n"))
        .join("\n\n");

      const interResult = await callGeminiInteractionsApi({
        apiKey,
        model: "gemini-3.8-flash",
        input: combinedInput,
        systemInstruction: options.systemPrompt,
        temperature: options.temperature,
      });

      if (interResult.ok && interResult.text) {
        let parsedJson: unknown = null;
        if (options.responseMimeType === "application/json" || interResult.text.trim().startsWith("{")) {
          try {
            const cleanText = interResult.text
              .trim()
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/, "")
              .replace(/```\s*$/, "");
            parsedJson = JSON.parse(cleanText);
          } catch {
            const match = interResult.text.match(/\{[\s\S]*\}/);
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
          text: interResult.text,
          json: parsedJson,
          modelUsed: "gemini-3.8-flash",
        };
      }
    } catch (interErr) {
      console.warn("[GoogleAiService] Falha na chamada da Interactions API com gemini-3.8-flash:", interErr);
    }
  }

  // Modelos de contingência da Google
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
