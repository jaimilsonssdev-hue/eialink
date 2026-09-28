import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const OWNER_EMAIL = "jaimilsonvendas@gmail.com";

export const PLACES_KEY_FEATURE = "google_places_api_key";

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
 * Lê a chave própria do Google Maps / Places salva pelo Super Admin.
 * Usada no servidor — nunca exposta ao navegador.
 */
export async function resolvePlacesApiKey(): Promise<string | null> {
  const envKey = process.env["GOOGLE_PLACES_API_KEY"];
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
      const saved = features[PLACES_KEY_FEATURE];
      if (typeof saved === "string" && saved.trim()) return saved.trim();
    }
  } catch (err) {
    console.warn("[places-admin] Não foi possível ler a chave salva:", err);
  }
  return null;
}

async function assertAdmin(context: {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: Record<string, unknown>;
}) {
  const isOwner = (context.claims["email"] as string)?.toLowerCase() === OWNER_EMAIL;
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const isAdmin = isOwner || Boolean(roles?.some((r) => r.role === "admin"));
  if (!isAdmin) throw new Error("Acesso restrito a administradores.");
}

function maskKey(key: string) {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/** Status da chave (sem expor o valor completo). */
export const getPlacesApiKeyStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const key = await resolvePlacesApiKey();
    return {
      configured: Boolean(key),
      masked: key ? maskKey(key) : "",
      isFromEnv: Boolean(process.env["GOOGLE_PLACES_API_KEY"]),
    };
  });

/** Salva (ou remove) a chave própria do Google Maps / Places. */
export const savePlacesApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { apiKey: string }) => {
    const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
    if (apiKey && !/^[A-Za-z0-9_\-]{20,120}$/.test(apiKey)) {
      throw new Error("Formato de chave inválido. Copie a chave completa do Google Cloud.");
    }
    return { apiKey };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);

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
      if (data.apiKey) next[PLACES_KEY_FEATURE] = data.apiKey;
      else delete next[PLACES_KEY_FEATURE];

      await supabase.from("plans").update({ features: next }).eq("id", plan.id);
    }

    return { success: true, configured: Boolean(data.apiKey) };
  });

/** Testa a chave fazendo uma consulta real na Places API (New). */
export const testPlacesApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);

    const key = await resolvePlacesApiKey();
    if (!key) {
      return { ok: false, message: "Nenhuma chave salva ainda." };
    }

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
        body: JSON.stringify({
          textQuery: "padaria em Salvador",
          languageCode: "pt-BR",
          regionCode: "BR",
          pageSize: 1,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[places-admin] Teste falhou [${res.status}]: ${body}`);
        if (res.status === 403) {
          return {
            ok: false,
            message:
              "A chave foi recusada. Ative a 'Places API (New)' no Google Cloud e confira as restrições da chave.",
          };
        }
        return { ok: false, message: `O Google recusou a consulta (código ${res.status}).` };
      }

      const body = (await res.json()) as { places?: unknown[] };
      return {
        ok: true,
        message: `Conexão funcionando. ${body.places?.length ? "Consulta de teste retornou resultado." : "Sem resultados no teste, mas a chave é válida."}`,
      };
    } catch (err) {
      console.error("[places-admin] Erro no teste:", err);
      return { ok: false, message: "Não foi possível falar com o Google agora. Tente novamente." };
    }
  });
