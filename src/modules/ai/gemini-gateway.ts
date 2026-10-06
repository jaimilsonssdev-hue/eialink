import { FunctionsHttpError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type GeminiGatewayRequest =
  | { action: "status" }
  | { action: "save"; apiKey: string }
  | { action: "test"; apiKey?: string }
  | {
      action: "generateContent";
      model: string;
      payload: Record<string, unknown>;
      apiKeyOverride?: string;
    }
  | {
      action: "interactions";
      model: string;
      payload: Record<string, unknown>;
      apiKeyOverride?: string;
    };

export async function invokeGeminiGateway<T>(
  supabase: SupabaseClient<Database>,
  body: GeminiGatewayRequest,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("gemini-gateway", { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = error.context.clone();
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      if (payload?.error || payload?.message) {
        throw new Error(payload.error || payload.message);
      }
    }
    throw new Error(`Gateway Gemini indisponível: ${error.message}`);
  }
  if (data === null) {
    throw new Error("O gateway Gemini retornou uma resposta vazia.");
  }
  return data;
}

export async function requestGemini(
  supabase: SupabaseClient<Database>,
  body: Extract<GeminiGatewayRequest, { action: "generateContent" | "interactions" }>,
): Promise<Response> {
  const result = await invokeGeminiGateway<{
    ok: boolean;
    status: number;
    payload?: unknown;
    message?: string;
  }>(supabase, body);
  const payload = result.payload ?? {
    error: { message: result.message || "Falha na API Gemini." },
  };
  return new Response(JSON.stringify(payload), {
    status: result.status || (result.ok ? 200 : 502),
    headers: { "Content-Type": "application/json" },
  });
}
