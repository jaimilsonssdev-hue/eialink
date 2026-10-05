import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const GEMINI_KEY_FEATURE = "gemini_api_key";

function getServiceSupabase() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

/**
 * Resolve a chave de API do Google Gemini com segurança no servidor:
 * 1. Banco de Dados (Supabase plans.features["gemini_api_key"])
 * 2. Variável de ambiente (GEMINI_API_KEY ou GOOGLE_AI_STUDIO_KEY)
 * A chave nunca é exposta no frontend público.
 */
export async function resolveGeminiApiKey(): Promise<string | null> {
  const envKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_AI_STUDIO_KEY"] ||
    (process.env as any)["VITE_GEMINI_API_KEY"];
  if (envKey && envKey.trim()) return envKey.trim();

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  try {
    const { data: plan } = await supabase
      .from("plans")
      .select("features")
      .eq("slug", "pro")
      .maybeSingle();

    if (plan?.features && typeof plan.features === "object") {
      const features = plan.features as Record<string, unknown>;
      const saved = features[GEMINI_KEY_FEATURE];
      if (typeof saved === "string" && saved.trim()) return saved.trim();
    }
  } catch (err) {
    console.warn("[gemini-admin] Não foi possível ler a chave do banco:", err);
  }
  return null;
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

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(candidateKey)}`,
        {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      clearTimeout(timeout);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.warn(`[gemini-admin] Validação Google AI falhou [${resp.status}]:`, errorText);
        if (resp.status === 400 || resp.status === 403) {
          return {
            ok: false,
            message: "A Google recusou a chave. Verifique se copiou a chave completa no Google AI Studio.",
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
    } catch (err: any) {
      return {
        ok: false,
        message: err.name === "AbortError" ? "Tempo limite ao conectar com a Google." : err.message || "Falha na conexão.",
      };
    }
  });

/**
 * Salva ou remove a chave do Gemini com segurança permanente no banco de dados (Supabase).
 * Apenas usuários autenticados podem salvar.
 */
export const saveGeminiApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { apiKey: string }) => d)
  .handler(async ({ data }) => {
    const rawKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";

    // Se for remover
    if (!rawKey) {
      const supabase = getServiceSupabase();
      if (!supabase) throw new Error("Banco de dados indisponível.");

      const { data: plans } = await supabase
        .from("plans")
        .select("id, features")
        .in("slug", ["pro", "free"]);

      for (const plan of plans ?? []) {
        const current =
          plan.features && typeof plan.features === "object"
            ? (plan.features as Record<string, unknown>)
            : {};
        const next = { ...current };
        delete next[GEMINI_KEY_FEATURE];

        await supabase
          .from("plans")
          .update({ features: next as unknown as Database["public"]["Tables"]["plans"]["Update"]["features"] })
          .eq("id", plan.id);
      }

      return { success: true, configured: false, message: "Chave da IA removida do banco de dados." };
    }

    if (rawKey.length < 10) {
      throw new Error("A chave informada é muito curta para ser uma chave válida do Google AI Studio.");
    }

    // Valida a chave na API do Google antes de salvar
    try {
      const testResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawKey)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!testResp.ok) {
        const errText = await testResp.text();
        console.warn("[gemini-admin] Chave inválida antes de salvar:", errText);
        throw new Error("A Google recusou esta chave. Verifique no Google AI Studio se ela está ativa.");
      }
    } catch (apiErr: any) {
      throw new Error(apiErr.message || "Não foi possível validar a chave com a Google.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { data: plans } = await supabase
      .from("plans")
      .select("id, features")
      .in("slug", ["pro", "free"]);

    for (const plan of plans ?? []) {
      const current =
        plan.features && typeof plan.features === "object"
          ? (plan.features as Record<string, unknown>)
          : {};
      const next = { ...current, [GEMINI_KEY_FEATURE]: rawKey };

      await supabase
        .from("plans")
        .update({ features: next as unknown as Database["public"]["Tables"]["plans"]["Update"]["features"] })
        .eq("id", plan.id);
    }

    return {
      success: true,
      configured: true,
      masked: maskKey(rawKey),
      message: "Chave salva com sucesso no banco de dados! Acesso generativo ativo para o Studio.",
    };
  });
