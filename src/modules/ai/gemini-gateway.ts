import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const gatewayUrl = "https://nitzhrmcbotdriajaxhw.supabase.co/functions/v1/gemini-gateway";
const gatewayPublishableKey = "sb_publishable_wSndRFAjfVECz_RjpTa-LQ_qvKyX2GM";

export const SITE_BUILDER_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;
const retryableGeminiStatuses = new Set([408, 429, 500, 502, 503, 504]);
const maxGeminiAttempts = 2;

async function callGoogleGeminiDirect(
  apiKey: string,
  model: string,
  payload: Record<string, unknown>,
): Promise<Response | null> {
  try {
    const cleanModel = model.replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    return res;
  } catch (err) {
    console.warn("[GoogleGeminiDirect] Falha na chamada direta:", err);
    return null;
  }
}

export type GeminiGatewayRequest =
  | { action: "status" }
  | { action: "save"; apiKey: string }
  | { action: "test"; apiKey?: string }
  | { action: "knowledgeList" }
  | {
      action: "knowledgeSave";
      source: {
        id?: string;
        title: string;
        kind: "skill" | "reference";
        content: string;
        tags: string[];
        active: boolean;
      };
    }
  | { action: "knowledgeDelete"; id: string }
  | {
      action: "generateContent";
      model: string;
      payload: Record<string, unknown>;
      apiKeyOverride?: string;
      knowledgeQuery?: string;
    }
  | {
      action: "interactions";
      model: string;
      payload: Record<string, unknown>;
      apiKeyOverride?: string;
      knowledgeQuery?: string;
    };

export async function invokeGeminiGateway<T>(
  supabase: SupabaseClient<Database>,
  body: GeminiGatewayRequest,
  accessToken?: string,
): Promise<T> {
  const sessionResult = accessToken ? null : await supabase.auth.getSession();
  if (sessionResult?.error) {
    throw new Error(
      `Não foi possível recuperar a sessão para o Gateway Gemini: ${sessionResult.error.message}`,
    );
  }
  const token = accessToken || sessionResult?.data.session?.access_token;
  if (!token) {
    throw new Error("Sessão autenticada necessária para acessar o Gateway Gemini.");
  }

  // Remove knowledgeQuery to avoid edge function crashing when ai_knowledge_sources table is absent
  const payloadToSend =
    body && typeof body === "object" && "knowledgeQuery" in body
      ? { ...body, knowledgeQuery: undefined }
      : body;

  let response: Response;
  try {
    response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        apikey: gatewayPublishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadToSend),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(
      `Gateway Gemini indisponível: ${error instanceof Error ? error.message : "falha de rede"}`,
    );
  }

  const result = (await response.json().catch(() => null)) as
    (T & { error?: string; message?: string }) | null;
  if (!response.ok) {
    throw new Error(
      result?.error || result?.message || `Gateway Gemini indisponível (HTTP ${response.status}).`,
    );
  }
  if (result === null) {
    throw new Error("O gateway Gemini retornou uma resposta vazia.");
  }
  return result;
}

export async function requestGemini(
  supabase: SupabaseClient<Database>,
  body: Extract<GeminiGatewayRequest, { action: "generateContent" | "interactions" }>,
  accessToken?: string,
): Promise<Response> {
  // 1. Tenta chamada direta e ultra-rápida se houver chave fornecida ou no ambiente
  const directKey =
    body.apiKeyOverride?.trim() ||
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY?.trim()) ||
    null;

  if (directKey && body.action === "generateContent") {
    const directRes = await callGoogleGeminiDirect(directKey, body.model, body.payload);
    if (directRes && (directRes.ok || directRes.status === 400 || directRes.status === 403)) {
      return directRes;
    }
  }

  // 2. Fallback: Gateway com tolerância e tempo de resposta controlado
  let result: {
    ok: boolean;
    status: number;
    payload?: unknown;
    message?: string;
  } = { ok: false, status: 503, message: "Gateway indisponível" };

  try {
    for (let attempt = 0; attempt < maxGeminiAttempts; attempt++) {
      result = await invokeGeminiGateway<{
        ok: boolean;
        status: number;
        payload?: unknown;
        message?: string;
      }>(supabase, body, accessToken);
      if (
        result.ok ||
        !retryableGeminiStatuses.has(result.status) ||
        attempt >= maxGeminiAttempts - 1
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  } catch (err) {
    result = {
      ok: false,
      status: 503,
      message: err instanceof Error ? err.message : "Falha ao consultar gateway da IA.",
    };
  }

  const payload = result.payload ?? {
    error: { message: result.message || "Falha na API Gemini." },
  };
  return new Response(JSON.stringify(payload), {
    status: result.status || (result.ok ? 200 : 502),
    headers: { "Content-Type": "application/json" },
  });
}
