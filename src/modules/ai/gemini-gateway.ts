import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const gatewayUrl = "https://nitzhrmcbotdriajaxhw.supabase.co/functions/v1/gemini-gateway";
const gatewayPublishableKey = "sb_publishable_wSndRFAjfVECz_RjpTa-LQ_qvKyX2GM";

export const SITE_BUILDER_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"] as const;

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

  let response: Response;
  try {
    response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        apikey: gatewayPublishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
  const result = await invokeGeminiGateway<{
    ok: boolean;
    status: number;
    payload?: unknown;
    message?: string;
  }>(supabase, body, accessToken);
  const payload = result.payload ?? {
    error: { message: result.message || "Falha na API Gemini." },
  };
  return new Response(JSON.stringify(payload), {
    status: result.status || (result.ok ? 200 : 502),
    headers: { "Content-Type": "application/json" },
  });
}
