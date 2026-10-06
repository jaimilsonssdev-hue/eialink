import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedModels = new Set(["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"]);
const superAdminEmail = "jaimilsonvendas@gmail.com";
const maxPayloadBytes = 1_000_000;
// Gemini storage is in this project; user sessions remain owned by the original auth project.
const authProjectUrl = "https://gctwvvnjcxnsjiovhmsv.supabase.co";
const authProjectPublishableKey = "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";

type GatewayAction =
  | { action: "status" }
  | { action: "save"; apiKey: string }
  | { action: "test"; apiKey?: string }
  | {
      action: "generateContent" | "interactions";
      model: string;
      payload: Record<string, unknown>;
      apiKeyOverride?: string;
    };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskKey(key: string) {
  return key.length <= 8 ? "••••••••" : `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

function getSecretKey() {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;
  throw new Error("A chave secreta do Supabase não está disponível na Edge Function.");
}

async function getConfiguredKey(adminClient: ReturnType<typeof createClient>) {
  const { data, error } = await adminClient
    .from("payment_gateway_settings")
    .select("gemini_api_key")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(`Não foi possível ler a configuração do Gemini: ${error.message}`);
  return (data?.gemini_api_key as string | null)?.trim() || null;
}

async function testKey(apiKey: string) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    method: "GET",
    headers: { "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return jsonResponse({ error: "Autenticação obrigatória." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("Configuração do banco de dados do Gateway indisponível.");
    }

    const userClient = createClient(authProjectUrl, authProjectPublishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) {
      return jsonResponse({ error: "Sessão inválida. Entre novamente." }, 401);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > maxPayloadBytes) {
      return jsonResponse({ error: "A solicitação excede o limite permitido." }, 413);
    }

    let body: GatewayAction;
    try {
      body = (await request.json()) as GatewayAction;
    } catch {
      return jsonResponse({ error: "O corpo da solicitação deve ser um JSON válido." }, 400);
    }
    if (!body || typeof body !== "object" || typeof body.action !== "string") {
      return jsonResponse({ error: "Ação inválida." }, 400);
    }

    const adminClient = createClient(supabaseUrl, getSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const isSuperAdmin = authData.user.email?.toLowerCase() === superAdminEmail;

    if (body.action === "status") {
      const key = await getConfiguredKey(adminClient);
      return jsonResponse({
        configured: Boolean(key),
        masked: key ? maskKey(key) : "",
        isFromEnv: false,
      });
    }

    if (body.action === "save") {
      if (!isSuperAdmin) {
        return jsonResponse(
          { error: "Apenas o superadministrador pode alterar a chave Gemini." },
          403,
        );
      }
      if (typeof body.apiKey !== "string") {
        return jsonResponse({ error: "A chave informada é inválida." }, 400);
      }
      const apiKey = body.apiKey.trim();
      if (apiKey && apiKey.length < 10) {
        return jsonResponse({ error: "A chave informada é muito curta." }, 400);
      }
      if (apiKey) {
        const { response } = await testKey(apiKey);
        if (!response.ok) {
          return jsonResponse(
            { error: `A Google recusou a chave (HTTP ${response.status}).` },
            400,
          );
        }
      }

      const { error } = await adminClient.from("payment_gateway_settings").upsert(
        {
          id: "default",
          gemini_api_key: apiKey || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) {
        throw new Error(
          `Não foi possível ${apiKey ? "salvar" : "remover"} a chave: ${error.message}`,
        );
      }
      return jsonResponse({
        success: true,
        configured: Boolean(apiKey),
        masked: apiKey ? maskKey(apiKey) : "",
        message: apiKey
          ? "Chave validada e salva com segurança no Supabase."
          : "Chave compartilhada removida do Supabase.",
      });
    }

    if (body.action === "test") {
      if (body.apiKey !== undefined && typeof body.apiKey !== "string") {
        return jsonResponse({ ok: false, message: "A chave informada é inválida." }, 400);
      }
      const apiKey = body.apiKey?.trim() || (await getConfiguredKey(adminClient));
      if (!apiKey) return jsonResponse({ ok: false, message: "Nenhuma chave Gemini configurada." });
      const { response, payload } = await testKey(apiKey);
      if (!response.ok) {
        return jsonResponse({
          ok: false,
          message: `A Google recusou a chave (HTTP ${response.status}).`,
        });
      }
      const models = (payload as { models?: Array<{ name?: string }> }).models || [];
      return jsonResponse({
        ok: true,
        message: models.some((model) => model.name?.includes("gemini"))
          ? "Chave validada; modelos Gemini disponíveis."
          : "Chave validada com a Google.",
      });
    }

    if (body.action === "generateContent" || body.action === "interactions") {
      if (!allowedModels.has(body.model)) {
        return jsonResponse({ ok: false, status: 400, message: "Modelo Gemini não permitido." });
      }
      if (body.apiKeyOverride !== undefined && typeof body.apiKeyOverride !== "string") {
        return jsonResponse({ ok: false, status: 400, message: "Chave de API inválida." });
      }
      if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
        return jsonResponse({ ok: false, status: 400, message: "Solicitação Gemini inválida." });
      }
      const payloadSize = new TextEncoder().encode(JSON.stringify(body.payload)).byteLength;
      if (payloadSize > maxPayloadBytes) {
        return jsonResponse({
          ok: false,
          status: 413,
          message: "A solicitação Gemini excede o limite permitido.",
        });
      }
      const apiKey = body.apiKeyOverride?.trim() || (await getConfiguredKey(adminClient));
      if (!apiKey) {
        return jsonResponse({
          ok: false,
          status: 503,
          message: "A chave compartilhada do Gemini ainda não foi configurada no painel admin.",
        });
      }

      const endpoint =
        body.action === "generateContent"
          ? `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent`
          : "https://generativelanguage.googleapis.com/v1beta/interactions";
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body.payload),
        signal: AbortSignal.timeout(90000),
      });
      const payload = await upstream.json().catch(() => ({}));
      return jsonResponse({
        ok: upstream.ok,
        status: upstream.status,
        payload,
        message: upstream.ok
          ? undefined
          : (payload as { error?: { message?: string } }).error?.message ||
            `Erro da API Google (HTTP ${upstream.status}).`,
      });
    }

    return jsonResponse({ error: "Ação não reconhecida." }, 400);
  } catch (error) {
    console.error(
      "[gemini-gateway] request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Falha interna no gateway Gemini.",
      },
      500,
    );
  }
});
