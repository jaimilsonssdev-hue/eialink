import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { invokeGeminiGateway } from "./gemini-gateway";

export const getGeminiApiKeyStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    invokeGeminiGateway<{
      configured: boolean;
      masked: string;
      isFromEnv: boolean;
    }>(context.supabase, { action: "status" }, context.accessToken),
  );

export const testGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { apiKey?: string }) => data)
  .handler(async ({ data, context }) =>
    invokeGeminiGateway<{ ok: boolean; message: string }>(
      context.supabase,
      {
        action: "test",
        apiKey: data.apiKey?.trim() || undefined,
      },
      context.accessToken,
    ),
  );

export const saveGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { apiKey: string }) => data)
  .handler(async ({ data, context }) =>
    invokeGeminiGateway<{
      success: boolean;
      configured: boolean;
      masked?: string;
      message: string;
    }>(
      context.supabase,
      {
        action: "save",
        apiKey: data.apiKey,
      },
      context.accessToken,
    ),
  );
