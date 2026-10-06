import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const OWNER_EMAIL = "jaimilsonvendas@gmail.com";

function getServiceSupabase() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type AuthContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: Record<string, unknown>;
};

async function assertAdmin(context: AuthContext) {
  if ((context.claims["email"] as string | undefined)?.toLowerCase() === OWNER_EMAIL) {
    return;
  }

  const { data: roles, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);

  if (error)
    throw new Error(`Não foi possível verificar permissões administrativas: ${error.message}`);
  if (!roles?.some((role) => role.role === "admin")) {
    throw new Error(
      "Acesso negado: apenas administradores podem alterar a chave compartilhada do Gemini.",
    );
  }
}

function getRequiredServiceSupabase() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error(
      "Configuração segura do banco indisponível. Configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
    );
  }
  return supabase;
}

/**
 * Resolve a chave de API do Google Gemini com segurança no servidor:
 * 1. Configuração de pagamento privada (acesso exclusivo ao service role)
 * 2. Variável de ambiente (GEMINI_API_KEY ou GOOGLE_AI_STUDIO_KEY)
 * A chave nunca é exposta no frontend público.
 */
export async function resolveGeminiApiKey(): Promise<string | null> {
  const envKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_AI_STUDIO_KEY"];
  if (envKey && envKey.trim()) return envKey.trim();

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("payment_gateway_settings")
    .select("gemini_api_key")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(`Não foi possível ler a configuração do Gemini: ${error.message}`);
  return data?.gemini_api_key?.trim() || null;
}

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/**
 * Consulta o status da chave configurada no banco (sem expor o valor real para o cliente).
 */
export const getGeminiApiKeyStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = await resolveGeminiApiKey();
    return {
      configured: Boolean(key),
      masked: key ? maskKey(key) : "",
      isFromEnv: Boolean(process.env["GEMINI_API_KEY"] || process.env["GOOGLE_AI_STUDIO_KEY"]),
    };
  });

/**
 * Testa qualquer chave do Google AI Studio diretamente na API oficial de modelos da Google.
 * Não exige prefixos específicos (aceita qualquer chave emitida pelo Google AI Studio ou Google Cloud).
 */
export const testGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { apiKey?: string }) => d)
  .handler(async ({ data }) => {
    const candidateKey = data?.apiKey?.trim() || (await resolveGeminiApiKey());
    if (!candidateKey) {
      return { ok: false, message: "Nenhuma chave foi informada ou encontrada no banco." };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let resp: Response;
      try {
        resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
          method: "GET",
          signal: controller.signal,
          headers: { "x-goog-api-key": candidateKey },
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!resp.ok) {
        if (resp.status === 400 || resp.status === 403) {
          return {
            ok: false,
            message:
              "A Google recusou a chave. Verifique se copiou a chave completa no Google AI Studio.",
          };
        }
        return { ok: false, message: `Erro ao validar com a Google (HTTP ${resp.status}).` };
      }

      const resData = (await resp.json()) as { models?: Array<{ name: string }> };
      const hasGemini = resData.models?.some((m) => m.name.includes("gemini")) ?? false;

      return {
        ok: true,
        message: hasGemini
          ? "Chave validada com sucesso! Acesso aos modelos Gemini confirmado."
          : "Chave válida com o Google AI Studio.",
      };
    } catch (err: unknown) {
      return {
        ok: false,
        message:
          err instanceof Error && err.name === "AbortError"
            ? "Tempo limite ao conectar com a Google."
            : err instanceof Error
              ? err.message
              : "Falha na conexão.",
      };
    }
  });

/**
 * Salva ou remove a chave compartilhada do Gemini. O segredo fica na tabela
 * protegida de configurações e só pode ser alterado por administradores.
 */
export const saveGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { apiKey: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rawKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
    const supabase = getRequiredServiceSupabase();

    if (!rawKey) {
      const { error } = await supabase
        .from("payment_gateway_settings")
        .update({ gemini_api_key: null, updated_at: new Date().toISOString() })
        .eq("id", "default");
      if (error) throw new Error(`Não foi possível remover a chave do Gemini: ${error.message}`);

      return {
        success: true,
        configured: false,
        message: "Chave compartilhada do Gemini removida.",
      };
    }

    if (rawKey.length < 10) {
      throw new Error(
        "A chave informada é muito curta para ser uma chave válida do Google AI Studio.",
      );
    }

    try {
      const testResp = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        method: "GET",
        headers: { "x-goog-api-key": rawKey },
        signal: AbortSignal.timeout(12000),
      });
      if (!testResp.ok) {
        throw new Error(
          "A Google recusou esta chave. Verifique no Google AI Studio se ela está ativa.",
        );
      }
    } catch (apiErr: unknown) {
      throw new Error(
        apiErr instanceof Error ? apiErr.message : "Não foi possível validar a chave com a Google.",
      );
    }

    const { error } = await supabase
      .from("payment_gateway_settings")
      .update({ gemini_api_key: rawKey, updated_at: new Date().toISOString() })
      .eq("id", "default");
    if (error) throw new Error(`Não foi possível salvar a chave do Gemini: ${error.message}`);

    return {
      success: true,
      configured: true,
      masked: maskKey(rawKey),
      message: "Chave compartilhada salva com segurança. Acesso generativo ativo para o Studio.",
    };
  });
