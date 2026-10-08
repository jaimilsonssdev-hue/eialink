import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { invokeGeminiGateway } from "./gemini-gateway";
import {
  testGoogleGeminiKey,
  resolveGeminiApiKeyAsync,
} from "./google-ai.service";
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

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export const getGeminiApiKeyStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      return await invokeGeminiGateway<{
        configured: boolean;
        masked: string;
        isFromEnv: boolean;
      }>(context.supabase, { action: "status" }, context.accessToken);
    } catch (err) {
      console.warn("[GeminiAdmin] Fallback para status direto no banco:", err);
      const dbKey = await resolveGeminiApiKeyAsync();
      return {
        configured: Boolean(dbKey),
        masked: dbKey ? maskKey(dbKey) : "",
        isFromEnv: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
      };
    }
  });

export const testGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { apiKey?: string }) => data)
  .handler(async ({ data, context }) => {
    let keyToTest = (data.apiKey || "").trim();
    if (!keyToTest) {
      keyToTest = (await resolveGeminiApiKeyAsync()) || "";
    }
    if (!keyToTest) {
      return { ok: false, message: "Nenhuma chave foi informada ou configurada no sistema." };
    }
    // Testa em tempo real contra o modelo gemini-3.8-flash oficial
    return await testGoogleGeminiKey(keyToTest);
  });

export const saveGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { apiKey: string }) => data)
  .handler(async ({ data, context }) => {
    const cleanKey = (data.apiKey || "").trim();

    // 1. Valida primeiro contra o Google se estiver definindo uma chave
    if (cleanKey) {
      const testResult = await testGoogleGeminiKey(cleanKey);
      if (!testResult.ok) {
        throw new Error(testResult.message);
      }
    }

    // 2. Tenta salvar pelo gateway
    try {
      const res = await invokeGeminiGateway<{
        success: boolean;
        configured: boolean;
        masked?: string;
        message: string;
      }>(
        context.supabase,
        {
          action: "save",
          apiKey: cleanKey,
        },
        context.accessToken,
      );
      return res;
    } catch (gatewayErr) {
      console.warn("[GeminiAdmin] Gateway inacessível, salvando direto via Service Role:", gatewayErr);
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
        throw new Error(`Falha ao gravar no banco: ${error.message}`);
      }

      return {
        success: true,
        configured: Boolean(cleanKey),
        masked: cleanKey ? maskKey(cleanKey) : "",
        message: cleanKey
          ? "Chave do Google Gemini (3.8 Flash) validada e salva no banco de dados!"
          : "Chave do Google Gemini removida do banco de dados.",
      };
    }
  });

/**
 * Retorna a chave real do Google AI Studio para módulos autorizados (como o Estúdio Criativo)
 * permitindo que funcione em qualquer dispositivo (incluindo mobile) sem depender do localStorage.
 */
export const getResolvedGeminiKeyFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await resolveGeminiApiKeyAsync();
    return {
      apiKey: key || null,
      configured: Boolean(key),
    };
  });

