import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProspectLeadItem {
  nome: string;
  telefone: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  nota_google: number | null;
  total_avaliacoes: number | null;
  niche_slug: string;
}

const ALLOWED_NICHES = [
  "clinica",
  "odontologia",
  "estetica",
  "automotivo",
  "climatizacao",
  "servicos",
] as const;

type AllowedNiche = (typeof ALLOWED_NICHES)[number];

function resolveAllowedNicheSlug(raw: unknown, fallback?: string): string {
  const text = String(raw || fallback || "servicos").toLowerCase().trim();
  const slug = slugify(text);
  if (ALLOWED_NICHES.includes(slug as AllowedNiche)) return slug;
  if (slug.includes("odont") || slug.includes("dent")) return "odontologia";
  if (slug.includes("clinic") || slug.includes("medic") || slug.includes("saude") || slug.includes("terap")) return "clinica";
  if (slug.includes("estet") || slug.includes("beleza") || slug.includes("salao") || slug.includes("barber") || slug.includes("unha") || slug.includes("sobrancelh")) return "estetica";
  if (slug.includes("auto") || slug.includes("mecanic") || slug.includes("car") || slug.includes("oficina") || slug.includes("pneu")) return "automotivo";
  if (slug.includes("clima") || slug.includes("ar") || slug.includes("refriger") || slug.includes("condicionad")) return "climatizacao";
  return "servicos";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePhoneBR(phoneRaw: unknown): string | null {
  if (typeof phoneRaw !== "string" && typeof phoneRaw !== "number") return null;
  const digits = String(phoneRaw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return digits.startsWith("55") ? digits : `55${digits}`;
  }
  return null;
}

function parseCoordinate(coord: unknown): number | null {
  if (typeof coord === "number" && !isNaN(coord)) return coord;
  if (typeof coord === "string") {
    const parsed = parseFloat(coord.replace(",", "."));
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function parseRating(val: unknown): number | null {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(",", "."));
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function parseReviewsCount(val: unknown): number | null {
  if (typeof val === "number" && !isNaN(val)) return Math.round(val);
  if (typeof val === "string") {
    const digits = val.replace(/\D/g, "");
    if (digits) return parseInt(digits, 10);
  }
  return null;
}

function extractJsonLeads(rawText: string): unknown[] {
  if (!rawText) return [];

  // 1. Tenta extrair bloco de código ```json ... ```
  const matchFence = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateText = matchFence ? matchFence[1].trim() : rawText.trim();

  // 2. Tenta parse direto
  try {
    const parsed = JSON.parse(candidateText);
    if (Array.isArray(parsed?.leads)) return parsed.leads;
    if (Array.isArray(parsed)) return parsed;
  } catch (_e) {
    // 3. Fallback: localiza o primeiro '{' e o último '}'
    const start = candidateText.indexOf("{");
    const end = candidateText.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        const sliced = candidateText.slice(start, end + 1);
        const parsed = JSON.parse(sliced);
        if (Array.isArray(parsed?.leads)) return parsed.leads;
      } catch (_e2) {
        // Fallback para array '[' e ']'
        const arrStart = candidateText.indexOf("[");
        const arrEnd = candidateText.lastIndexOf("]");
        if (arrStart !== -1 && arrEnd > arrStart) {
          try {
            const arrParsed = JSON.parse(candidateText.slice(arrStart, arrEnd + 1));
            if (Array.isArray(arrParsed)) return arrParsed;
          } catch (_e3) {
            // Continua
          }
        }
      }
    }
  }

  return [];
}

async function resolveApiKey(): Promise<string | null> {
  // 1. Deno.env.get("GEMINI_API_KEY") como solicitado na regra obrigatória
  const envKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (envKey) return envKey;

  // 2. Fallback caso esteja na tabela payment_gateway_settings
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey) {
      const client = createClient(supabaseUrl, serviceRoleKey);
      const { data } = await client
        .from("payment_gateway_settings")
        .select("gemini_api_key")
        .eq("id", "default")
        .maybeSingle();
      const dbKey = (data?.gemini_api_key as string | null)?.trim();
      if (dbKey) return dbKey;
    }
  } catch (err) {
    console.warn("[prospectar-gemini] Falha ao consultar fallback do banco:", err);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Utilize POST." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const niche = (body?.niche || "").trim();
    const city = (body?.city || "").trim();

    if (!niche || !city) {
      return jsonResponse(
        { error: "Os campos 'niche' e 'city' são obrigatórios para a prospecção." },
        400,
      );
    }

    const nicheSlug = resolveAllowedNicheSlug(niche);

    // Regra 2: Chave e modelo via Deno.env
    const apiKey = (await resolveApiKey()) || body?.apiKey?.trim();
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY não configurada. Defina a variável de ambiente GEMINI_API_KEY no Supabase ou configure a chave no painel administrativo.",
        },
        500,
      );
    }

    // Regra 2: Deno.env.get("GEMINI_MODEL") com default para gemini-3.8-flash
    const modelEnv = Deno.env.get("GEMINI_MODEL")?.trim();
    const model = (modelEnv || "gemini-3.8-flash").replace(/^models\//, "");

    // Regra: Prompt instruindo busca no Google de empresas reais sem domínio próprio (.com/.com.br)
    const prompt = `Você é um especialista em inteligência de prospecção comercial B2B.
Sua tarefa é encontrar empresas REAIS e ATIVAS localizadas em "${city}" que operam no nicho/segmento de "${niche}" utilizando a ferramenta de busca do Google (Google Search).

CRITÉRIOS OBRIGATÓRIOS DE QUALIFICAÇÃO:
1. As empresas encontradas NÃO PODEM ter domínio próprio (.com, .com.br ou qualquer site institucional exclusivo).
2. Aceite APENAS empresas sem website cadastrado, ou cujo único canal digital informado seja perfil do Instagram, Linktree ou link direto de WhatsApp.
3. Não invente dados fictícios. Busque empresas reais presentes no Google e ativas na cidade de "${city}".

FORMATO ESTRITO DE RESPOSTA:
Retorne ESTRITAMENTE um objeto JSON válido (sem qualquer texto introdutório, sem explicações, sem formatação markdown fora do JSON):
{
  "leads": [
    {
      "nome": "Nome comercial oficial da empresa",
      "telefone": "5511999998888",
      "endereco": "Endereço físico completo com logradouro, número e bairro",
      "latitude": -23.55052,
      "longitude": -46.633308,
      "niche_slug": "${nicheSlug}",
      "avaliacao": 4.8,
      "total_avaliacoes": 42
    }
  ]
}

REGRAS DOS CAMPOS:
- "nome": Nome comercial oficial verificado da empresa.
- "telefone": Número de telefone/WhatsApp com DDD no padrão 55 + DDD (2 dígitos) + número (8 ou 9 dígitos), APENAS NÚMEROS (ex: "5511987654321"). Se não encontrar, retorne null.
- "endereco": Endereço físico completo com rua, número e bairro da cidade de ${city}.
- "latitude": Coordenada numérica decimal de latitude (ex: -23.55052) ou null se não disponível.
- "longitude": Coordenada numérica decimal de longitude (ex: -46.633308) ou null se não disponível.
- "niche_slug": Escolha ESTRITAMENTE entre: "clinica", "odontologia", "estetica", "automotivo", "climatizacao", "servicos".
- "avaliacao": Nota de avaliação dos clientes no Google (número decimal de 1.0 a 5.0) ou null.
- "total_avaliacoes": Quantidade total de avaliações recebidas no Google (inteiro) ou null.

Encontre entre 5 e 15 empresas qualificadas reais que atendam a todos os critérios acima.`;

    // Regra: Usar APENAS tools: [{ googleSearch: {} }] com temperature: 0.1 (combinar com googleMaps causa erro 400 no Gemini)
    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.1,
      },
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(45_000),
    });

    // Se o modelo principal falhar temporariamente por sobrecarga, usa fallback oficial permitido
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      const fallbackModel = "gemini-3.5-flash";
      console.warn(`[prospectar-gemini] ${model} retornou HTTP ${response.status}. Tentando fallback com ${fallbackModel}...`);
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(45_000),
      }).catch(() => null);

      if (fallbackResponse && fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[prospectar-gemini] Erro Google AI (HTTP ${response.status}):`, errorText);
      return jsonResponse(
        {
          error: `Erro ao comunicar com o Google Gemini (HTTP ${response.status}). Verifique a chave de API e tente novamente.`,
          details: errorText,
        },
        502,
      );
    }

    const responseData = await response.json();
    const candidate = responseData?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const textOutput = parts
      .map((part: { text?: string }) => part.text || "")
      .join("\n")
      .trim();

    const rawLeads = extractJsonLeads(textOutput);

    // Mapeamento e higienização estrita dos leads
    const leads: ProspectLeadItem[] = rawLeads
      .filter((item: any) => item && typeof item === "object" && typeof item.nome === "string" && item.nome.trim())
      .map((item: any) => {
        const nome = String(item.nome).trim();
        const telefone = normalizePhoneBR(item.telefone || item.whatsapp || item.phone);
        const endereco = item.endereco ? String(item.endereco).trim() : null;
        const latitude = parseCoordinate(item.latitude);
        const longitude = parseCoordinate(item.longitude);
        const nota_google = parseRating(item.avaliacao ?? item.nota_google ?? item.rating);
        const total_avaliacoes = parseReviewsCount(item.total_avaliacoes ?? item.reviews_count);
        const finalNicheSlug = resolveAllowedNicheSlug(item.niche_slug, nicheSlug);

        return {
          nome,
          telefone,
          endereco,
          latitude,
          longitude,
          nota_google,
          total_avaliacoes,
          niche_slug: finalNicheSlug,
        };
      });

    // Se o cliente autenticado pediu para salvar diretamente ou se credenciais estiverem no ambiente
    let savedCount = 0;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceRoleKey && leads.length > 0 && body.saveToDatabase !== false) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const rowsToInsert = leads.map((lead) => {
          const dedupeKey = `${slugify(lead.nome)}_${slugify(city)}_${lead.telefone || slugify(lead.endereco || "")}`.slice(0, 160);
          return {
            name: lead.nome,
            niche: lead.niche_slug || niche,
            niche_slug: lead.niche_slug,
            city,
            phone: lead.telefone,
            telefone: lead.telefone,
            whatsapp: lead.telefone,
            endereco: lead.endereco,
            latitude: lead.latitude,
            longitude: lead.longitude,
            rating: lead.nota_google,
            nota_google: lead.nota_google,
            reviews_count: lead.total_avaliacoes,
            total_avaliacoes: lead.total_avaliacoes,
            has_website: false,
            source: "gemini-search",
            priority: (lead.nota_google && lead.nota_google >= 4.5) ? "alta" : "media",
            status: "novo",
            score: Math.min(100, Math.round(((lead.nota_google || 4.0) * 15) + (lead.telefone ? 25 : 0))),
            dedupe_key: dedupeKey,
            notes: `[Gemini + Search] ${lead.endereco || ""}`.trim(),
          };
        });

        const { data: insertedData, error: insertError } = await adminClient
          .from("prospected_companies")
          .upsert(rowsToInsert, { onConflict: "dedupe_key", ignoreDuplicates: true })
          .select("id");

        if (insertError) {
          console.warn("[prospectar-gemini] Aviso ao gravar leads no banco:", insertError.message);
        } else {
          savedCount = insertedData?.length ?? 0;
        }
      }
    } catch (saveErr) {
      console.warn("[prospectar-gemini] Erro não-bloqueante no salvamento:", saveErr);
    }

    return jsonResponse({
      success: true,
      niche,
      city,
      niche_slug: nicheSlug,
      model,
      count: leads.length,
      savedCount,
      leads,
    });
  } catch (error) {
    console.error("[prospectar-gemini] Erro geral:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro interno ao executar prospecção com Gemini.",
      },
      500,
    );
  }
});
