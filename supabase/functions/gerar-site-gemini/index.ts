import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function cleanDigits(val?: string | null): string {
  if (!val) return "";
  let digits = String(val).replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function resolveApiKey(): Promise<string | null> {
  const envKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (envKey) return envKey;

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
    console.warn("[gerar-site-gemini] Falha ao consultar fallback do banco:", err);
  }

  return null;
}

/**
 * Gerador de fallback determinístico de altíssima qualidade de agência digital,
 * garantindo que nunca retorne vazio caso ocorra instabilidade temporária na API do Gemini.
 */
function generateAgencyQualityFallbackHtml(params: {
  name: string;
  niche: string;
  nicheSlug: string;
  city: string;
  phone: string;
  endereco: string;
  rating: number;
  reviewsCount: number;
}): string {
  const { name, niche, nicheSlug, city, phone, endereco, rating, reviewsCount } = params;
  const escapedName = escapeHtml(name);
  const escapedCity = escapeHtml(city);
  const escapedEndereco = escapeHtml(endereco || city);
  const cleanPhone = cleanDigits(phone);
  const waBaseUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "#contato";
  const mapsQuery = encodeURIComponent(`${name} ${endereco || city}`.trim());
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const isDarkNiche = [
    "automotivo",
    "mecanic",
    "barber",
    "oficina",
    "engenharia",
    "industrial",
    "climatizacao",
  ].some((k) => nicheSlug.includes(k) || niche.toLowerCase().includes(k));

  const isHealthNiche = [
    "odonto",
    "dent",
    "clinic",
    "medic",
    "saude",
    "hospital",
  ].some((k) => nicheSlug.includes(k) || niche.toLowerCase().includes(k));

  const theme = isDarkNiche
    ? {
        bg: "bg-zinc-950",
        bodyText: "text-zinc-50",
        mutedText: "text-zinc-400",
        cardBg: "bg-zinc-900/90",
        cardBorder: "border-zinc-800",
        accentText: "text-amber-400",
        accentBg: "bg-amber-500 hover:bg-amber-400 text-zinc-950",
        badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        headerBg: "bg-zinc-950/80 border-zinc-800/80",
        secBg: "bg-zinc-900/40",
      }
    : isHealthNiche
    ? {
        bg: "bg-slate-50",
        bodyText: "text-slate-900",
        mutedText: "text-slate-600",
        cardBg: "bg-white",
        cardBorder: "border-slate-200/80",
        accentText: "text-teal-600",
        accentBg: "bg-teal-600 hover:bg-teal-500 text-white",
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
        headerBg: "bg-white/80 border-slate-200/80",
        secBg: "bg-slate-100/60",
      }
    : {
        bg: "bg-stone-50",
        bodyText: "text-stone-900",
        mutedText: "text-stone-600",
        cardBg: "bg-white",
        cardBorder: "border-stone-200/80",
        accentText: "text-emerald-600",
        accentBg: "bg-emerald-600 hover:bg-emerald-500 text-white",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        headerBg: "bg-white/80 border-stone-200/80",
        secBg: "bg-stone-100/60",
      };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedName} | Site Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Plus Jakarta Sans', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3, h4, .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="${theme.bg} ${theme.bodyText} antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white">

  <!-- HEADER FIXO -->
  <header class="sticky top-0 z-40 backdrop-blur-md ${theme.headerBg} border-b transition-all">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
          ${escapedName.charAt(0)}
        </div>
        <div>
          <span class="font-display font-bold text-lg sm:text-xl tracking-tight block leading-tight">${escapedName}</span>
          <span class="text-xs ${theme.mutedText} flex items-center gap-1.5 font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Atendimento Aberto em ${escapedCity}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre os serviços da ${name}.`)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm ${theme.accentBg} transition-all shadow-md active:scale-95">
          <svg class="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.56 5.37L2 22l4.75-1.52a9.96 9.96 0 005.281 1.5c5.536 0 10.031-4.495 10.031-10.031S17.567 2 12.031 2zm0 18.25c-1.63 0-3.15-.47-4.46-1.28l-.32-.2-3.29 1.05 1.07-3.21-.21-.34a8.19 8.19 0 01-1.25-4.24c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"/></svg>
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <div class="max-w-3xl mx-auto text-center space-y-6">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md ${theme.badgeBg}">
          <span class="text-amber-400">★★★★★</span>
          <span>Avaliação Oficial Google: ${rating} (${reviewsCount} avaliações verificadas)</span>
        </div>
        <h1 class="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Excelência, Precisão e Confiança em <span class="${theme.accentText}">${niche}</span>
        </h1>
        <p class="text-base sm:text-xl ${theme.mutedText} max-w-2xl mx-auto leading-relaxed">
          Atendimento personalizado com padrão de excelência em ${escapedCity}. Soluções completas com suporte direto e agilidade garantida.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Vi o site oficial da ${name} e gostaria de agendar um atendimento.`)}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold ${theme.accentBg} transition-all shadow-xl hover:scale-105 active:scale-95">
            <svg class="w-5 h-5 fill-currentColor" viewBox="0 0 24 24"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.56 5.37L2 22l4.75-1.52a9.96 9.96 0 005.281 1.5c5.536 0 10.031-4.495 10.031-10.031S17.567 2 12.031 2zm0 18.25c-1.63 0-3.15-.47-4.46-1.28l-.32-.2-3.29 1.05 1.07-3.21-.21-.34a8.19 8.19 0 01-1.25-4.24c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"/></svg>
            <span>Agendar Atendimento</span>
          </a>
          <a href="#localizacao" class="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold border ${theme.cardBorder} hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <span>Como Chegar</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- NÚMEROS E DIFERENCIAIS -->
  <section class="py-12 border-y ${theme.cardBorder} ${theme.secBg}">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div class="p-4">
          <div class="font-display text-3xl sm:text-4xl font-extrabold ${theme.accentText}">${rating} ★</div>
          <div class="text-xs sm:text-sm ${theme.mutedText} mt-1 font-medium">Nota no Google</div>
        </div>
        <div class="p-4">
          <div class="font-display text-3xl sm:text-4xl font-extrabold ${theme.accentText}">100%</div>
          <div class="text-xs sm:text-sm ${theme.mutedText} mt-1 font-medium">Foco em Qualidade</div>
        </div>
        <div class="p-4">
          <div class="font-display text-3xl sm:text-4xl font-extrabold ${theme.accentText}">Ágil</div>
          <div class="text-xs sm:text-sm ${theme.mutedText} mt-1 font-medium">Resposta Imediata</div>
        </div>
        <div class="p-4">
          <div class="font-display text-3xl sm:text-4xl font-extrabold ${theme.accentText}">${reviewsCount}+</div>
          <div class="text-xs sm:text-sm ${theme.mutedText} mt-1 font-medium">Clientes Atendidos</div>
        </div>
      </div>
    </div>
  </section>

  <!-- SERVIÇOS -->
  <section id="servicos" class="py-20 sm:py-28">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
      <div class="max-w-2xl mx-auto text-center space-y-3">
        <h2 class="font-display text-3xl sm:text-4xl font-bold tracking-tight">Nossas Especialidades</h2>
        <p class="${theme.mutedText} text-sm sm:text-base">Serviços executados com equipamentos modernos e protocolo rigoroso.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-7 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="font-display font-bold text-xl">Atendimento Personalizado</h3>
          <p class="text-sm ${theme.mutedText} leading-relaxed">Diagnóstico detalhado e planejamento sob medida para o seu caso específico.</p>
          <a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de consultar detalhes sobre Atendimento Personalizado na ${name}.`)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold ${theme.accentText} hover:underline pt-2">
            Solicitar Informações →
          </a>
        </div>

        <div class="rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-7 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="font-display font-bold text-xl">Execução Especializada</h3>
          <p class="text-sm ${theme.mutedText} leading-relaxed">Profissionais experientes dedicados a entregar os melhores resultados técnicos.</p>
          <a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de consultar detalhes sobre Execução Especializada na ${name}.`)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold ${theme.accentText} hover:underline pt-2">
            Solicitar Informações →
          </a>
        </div>

        <div class="rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-7 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="font-display font-bold text-xl">Agendamento Prioritário</h3>
          <p class="text-sm ${theme.mutedText} leading-relaxed">Horários flexíveis e confirmação ágil direto no canal oficial de atendimento.</p>
          <a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de consultar horários para agendamento na ${name}.`)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold ${theme.accentText} hover:underline pt-2">
            Solicitar Informações →
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- LOCALIZAÇÃO & COMO CHEGAR -->
  <section id="localizacao" class="py-16 border-t ${theme.cardBorder} ${theme.secBg}">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-5 space-y-5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${theme.badgeBg}">
            <span>📍 Ponto Físico & Atendimento</span>
          </div>
          <h2 class="font-display text-3xl font-bold tracking-tight">Onde Estamos</h2>
          <p class="text-sm sm:text-base ${theme.mutedText} leading-relaxed">
            Localização privilegiada de fácil acesso em ${escapedCity}. Venha nos visitar ou trace sua rota pelo Google Maps.
          </p>
          <div class="p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg} space-y-2">
            <div class="font-bold text-sm">${escapedName}</div>
            <div class="text-xs ${theme.mutedText}">${escapedEndereco}</div>
            ${phone ? `<div class="text-xs font-semibold ${theme.accentText}">Tel/WhatsApp: ${escapeHtml(phone)}</div>` : ""}
          </div>
          <div>
            <a href="${mapsSearchUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm ${theme.accentBg} transition-all shadow-md active:scale-95">
              <span>Abrir no Google Maps / Como Chegar</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
          </div>
        </div>
        <div class="lg:col-span-7">
          <div class="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border ${theme.cardBorder} shadow-lg">
            <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- RODAPÉ LIMPO E WHITE-LABEL -->
  <footer class="py-10 border-t ${theme.cardBorder} text-center text-xs ${theme.mutedText} mt-auto">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-2">
      <div class="font-bold text-sm ${theme.bodyText}">${escapedName}</div>
      <div>${escapedEndereco} · ${escapedCity}</div>
      <div class="text-[11px] opacity-75">© ${new Date().getFullYear()} ${escapedName}. Todos os direitos reservados.</div>
    </div>
  </footer>

  <!-- BOTÃO FLUTUANTE DE WHATSAPP -->
  ${
    cleanPhone
      ? `<a href="${waBaseUrl}?text=${encodeURIComponent(`Olá! Vi o site oficial da ${name} e gostaria de atendimento.`)}" target="_blank" rel="noreferrer" class="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 font-bold text-sm tracking-wide" aria-label="Falar no WhatsApp">
          <svg class="w-6 h-6 fill-currentColor" viewBox="0 0 24 24"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.56 5.37L2 22l4.75-1.52a9.96 9.96 0 005.281 1.5c5.536 0 10.031-4.495 10.031-10.031S17.567 2 12.031 2zm0 18.25c-1.63 0-3.15-.47-4.46-1.28l-.32-.2-3.29 1.05 1.07-3.21-.21-.34a8.19 8.19 0 01-1.25-4.24c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"/></svg>
          <span class="hidden sm:inline">WhatsApp</span>
        </a>`
      : ""
  }

</body>
</html>`;
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
    const name = (body?.name || "").trim();
    const niche = (body?.niche || "Serviços").trim();
    const city = (body?.city || "Brasil").trim();
    const nicheSlug = (body?.niche_slug || slugify(niche)).trim();
    const phone = (body?.phone || body?.whatsapp || body?.telefone || "").trim();
    const endereco = (body?.endereco || body?.address || "").trim();
    const rating = typeof body?.nota_google === "number" ? body.nota_google : (typeof body?.rating === "number" ? body.rating : 4.9);
    const reviewsCount = typeof body?.total_avaliacoes === "number" ? body.total_avaliacoes : (typeof body?.reviews_count === "number" ? body.reviews_count : 48);
    const customPrompt = (body?.prompt || body?.custom_instructions || body?.instructions || "").trim();
    const currentHtml = (body?.current_html || body?.currentHtml || "").trim();
    const photos: string[] = Array.isArray(body?.photos) ? body.photos.filter((p: unknown) => typeof p === "string" && (p as string).startsWith("http")) : [];
    const chatHistory = Array.isArray(body?.messages) ? body.messages : [];

    if (!name) {
      return jsonResponse({ error: "O nome da empresa é obrigatório." }, 400);
    }

    const apiKey = (await resolveApiKey()) || body?.apiKey?.trim();
    if (!apiKey) {
      // Fallback gracioso se a chave não estiver configurada no ambiente
      const fallbackHtml = generateAgencyQualityFallbackHtml({
        name,
        niche,
        nicheSlug,
        city,
        phone,
        endereco,
        rating,
        reviewsCount,
      });
      return jsonResponse({
        success: true,
        fallback: true,
        model: "deterministic-agency",
        html: fallbackHtml,
        explanation: "Site gerado com o padrão de agência digital de alta conversão.",
        suggestions: [
          "Mudar para tema escuro e dourado",
          "Adicionar tabela de preços dos serviços",
          "Destacar mais as avaliações do Google",
        ],
      });
    }

    // Regra 1: Deno.env.get("GEMINI_MODEL") com default para gemini-3.8-flash
    const modelEnv = Deno.env.get("GEMINI_MODEL")?.trim();
    const model = (modelEnv || "gemini-3.8-flash").replace(/^models\//, "");

    const cleanPhone = cleanDigits(phone);
    const waBaseUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "#contato";
    const mapsQuery = encodeURIComponent(`${name} ${endereco || city}`.trim());
    const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`;
    const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    // Monta fotos reais do Google Meu Negócio se existirem
    const photosContext = photos.length > 0
      ? `\n- Fotos Reais do Google Meu Negócio / Instagram (${photos.length} fotos disponíveis): ${photos.slice(0, 6).join(", ")}`
      : "";

    let systemPrompt = "";
    let userPrompt = "";

    const isRefinement = Boolean(currentHtml && currentHtml.length > 100 && customPrompt);

    if (isRefinement) {
      // MODO COPILOTO / REFINAMENTO CONVERSACIONAL (Estilo Gemini / Claude Artifacts / ChatGPT Canvas)
      systemPrompt = `Você é o Arquiteto Copiloto Especialista em Criação e Refinamento de Sites HTML5 do "Estúdio Criativo Gemini".
Sua missão é atender com total liberdade criativa e máxima qualidade técnica as instruções do usuário para o site da empresa.

DADOS REAIS DA EMPRESA (GOOGLE MEU NEGÓCIO):
- Nome Oficial: "${name}"
- Nicho / Especialidade: "${niche}" (${nicheSlug})
- Cidade e Região: "${city}"
- WhatsApp / Contato: "${phone || "Disponível no WhatsApp"}" (${waBaseUrl})
- Endereço Físico Completo: "${endereco || city}"
- Avaliação Google Oficial: ${rating} ★ (${reviewsCount} avaliações reais)
- Google Maps Iframe: "${mapsEmbedUrl}"
- Google Maps Rota: "${mapsSearchUrl}"${photosContext}

DIRETRIZES DE REFINAMENTO:
1. Aplique com perfeição as alterações solicitadas pelo usuário (ex: alterar cores, adicionar seções, ofertas, depoimentos, tabela de preços, botões de ação, FAQs, novos blocos).
2. Mantenha o código HTML5 completo, responsivo com Tailwind CSS (CDN), limpo, moderno e sem dependências externas quebradas.
3. Se for trocar paleta ou estilo, siga o padrão de agência premiada (WCAG AAA de alto contraste).
4. Preserve o link oficial de WhatsApp (${waBaseUrl}) e iframe do Google Maps.

FORMATO OBRIGATÓRIO DE RESPOSTA:
<<<EXPLANATION>>>
Escreva uma resposta conversacional e simpática no chat (em português do Brasil) explicando o que você criou/ajustou no site conforme as instruções.
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... código HTML5 completo e funcional ...
</html>
<<<END_HTML>>>
<<<SUGGESTIONS>>>
["Sugestão 1 de melhoria", "Sugestão 2 de melhoria", "Sugestão 3 de melhoria"]
<<<END_SUGGESTIONS>>>`;

      userPrompt = `CÓDIGO HTML ATUAL DO SITE:
${currentHtml}

INSTRUÇÕES DO USUÁRIO:
"${customPrompt}"

Aplique as instruções solicitadas e retorne a explicação, o código HTML5 completo atualizado e 3 novas sugestões no formato estrito.`;
    } else {
      // MODO GERAÇÃO INICIAL COM MÁXIMA LIBERDADE CRIATIVA E PADRÃO DE AGÊNCIA
      systemPrompt = `Você é o Diretor de Arte e Desenvolvedor Front-end sênior de uma agência digital premiada de alta conversão.
Sua missão é criar um site HTML5 + Tailwind CSS COMPLETO, moderno, luxuoso e de altíssima conversão para a empresa a partir dos dados do Google Meu Negócio e das instruções fornecidas.

DADOS REAIS DA EMPRESA (GOOGLE MEU NEGÓCIO):
- Nome Oficial: "${name}"
- Nicho / Segmento: "${niche}" (${nicheSlug})
- Cidade / Região: "${city}"
- Telefone / WhatsApp: "${phone || "Disponível no WhatsApp"}"
- Endereço Físico Completo: "${endereco || city}"
- Avaliação Google Oficial: ${rating} ★ (${reviewsCount} avaliações no Google)
- Link WhatsApp Direto: "${waBaseUrl}"
- Iframe Oficial Google Maps: "${mapsEmbedUrl}"
- Link Botão Como Chegar Google Maps: "${mapsSearchUrl}"${photosContext}

DIRETRIZES DE ARQUITETURA E QUALIDADE VISUAL:
1. HEAD & TIPOGRAFIA:
   - Inclua no <head> meta viewport, title "${name} | Site Oficial", Tailwind CDN (https://cdn.tailwindcss.com), fontes Inter e Plus Jakarta Sans via Google Fonts.
   - Script Tailwind estendendo as fontes 'sans' e 'display'.
2. PALETA ADAPTATIVA COM CONTRASTE WCAG AAA:
   - Se Saúde/Odonto/Clínica: Fundo claro (#F8FAFC), cards brancos, texto escuro (#0F172A), destaques em Esmeralda/Teal ou Azul Real.
   - Se Automotivo/Mecânica/Barbearia/Climatização/Engenharia: Dark premium (#09090B / bg-zinc-950), cards #18181B, texto branco puro, acentos em Âmbar/Dourado (#F59E0B).
   - Se Estética/Beleza/Spa: Fundo claro luxuoso ou dark champagne, acentos em Rose Nude/Dourado suave.
   - NUNCA coloque texto claro sobre fundo claro ou texto escuro sobre fundo escuro.
3. ZERO IMAGENS QUEBRADAS:
   - Use gradientes modernos, cards com efeito vidro fosco (backdrop-blur-md), badges oficiais do Google (${rating} ★ com ${reviewsCount} avaliações) e ícones SVG inline estilizados para cada diferencial e serviço.
   ${photos.length > 0 ? `- Se desejar usar imagens reais, use EXCLUSIVAMENTE as fotos fornecidas: ${photos.slice(0, 4).join(", ")}.` : "- É PROIBIDO inventar URLs aleatórias de imagens externas."}
4. ESTRUTURA COMPLETA DE CONVERSÃO:
   - Header Fixo com indicador de atendimento aberto em ${city} e botão de WhatsApp.
   - Hero Section com badge de confiança Google, headline magnética, subheadline e CTA principal para WhatsApp (${waBaseUrl}).
   - Seção de Métricas / Números de credibilidade (Nota ${rating} ★ no Google, Atendimento Ágil, etc.).
   - Grid com 4 a 6 Serviços Específicos com cards, descrições persuasivas e botões individuais de WhatsApp.
   - Seção de Localização "Onde Estamos" com endereço completo e iframe responsivo Google Maps (${mapsEmbedUrl}) + botão "Como Chegar" (${mapsSearchUrl}).
   - Botão flutuante de WhatsApp fixo no canto inferior direito.
   - Rodapé 100% white-label sem marca d'água de IA.

FORMATO OBRIGATÓRIO DE RESPOSTA:
<<<EXPLANATION>>>
Escreva uma apresentação simpática e objetiva no chat explicando a estratégia visual e de conversão adotada para a empresa.
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... código HTML5 completo e autocontido ...
</html>
<<<END_HTML>>>
<<<SUGGESTIONS>>>
["Sugestão 1 de melhoria", "Sugestão 2 de melhoria", "Sugestão 3 de melhoria"]
<<<END_SUGGESTIONS>>>`;

      userPrompt = customPrompt
        ? `Por favor, crie o site oficial para a empresa "${name}" considerando os dados do Google Meu Negócio e as seguintes instruções personalizadas: "${customPrompt}".`
        : `Por favor, crie o site oficial completo e de alta conversão para a empresa "${name}" utilizando todos os dados do Google Meu Negócio.`;
    }

    // Monta o histórico de chat formatado para a API do Gemini
    const contents: any[] = [];
    if (chatHistory.length > 0) {
      for (const m of chatHistory.slice(-8)) {
        contents.push({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
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
      signal: AbortSignal.timeout(60_000),
    });

    // Se o modelo principal falhar temporariamente por sobrecarga, usa fallback oficial permitido (3.5-flash)
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      const fallbackModel = "gemini-3.5-flash";
      console.warn(`[gerar-site-gemini] ${model} retornou HTTP ${response.status}. Tentando fallback ${fallbackModel}...`);
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(60_000),
      }).catch(() => null);

      if (fallbackResponse && fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[gerar-site-gemini] Erro Google AI (HTTP ${response.status}):`, errText);
      const fallbackHtml = generateAgencyQualityFallbackHtml({
        name,
        niche,
        nicheSlug,
        city,
        phone,
        endereco,
        rating,
        reviewsCount,
      });
      return jsonResponse({
        success: true,
        fallback: true,
        model,
        html: fallbackHtml,
        explanation: "Site gerado com o padrão de agência digital de alta conversão.",
        suggestions: [
          "Mudar para tema escuro e dourado",
          "Adicionar tabela de preços dos serviços",
          "Destacar mais as avaliações do Google",
        ],
      });
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let rawText = candidateText.trim();
    let explanation = "";
    let htmlOutput = "";
    let suggestions: string[] = [];

    // Extrai <<<EXPLANATION>>>, <<<HTML>>>, <<<SUGGESTIONS>>>
    if (rawText.includes("<<<HTML>>>")) {
      const explMatch = rawText.match(/<<<EXPLANATION>>>([\s\S]*?)<<<HTML>>>/i);
      if (explMatch) explanation = explMatch[1].trim();

      const htmlMatch = rawText.match(/<<<HTML>>>([\s\S]*?)(?:<<<END_HTML>>>|$)/i);
      if (htmlMatch) htmlOutput = htmlMatch[1].trim();

      const suggMatch = rawText.match(/<<<SUGGESTIONS>>>([\s\S]*?)(?:<<<END_SUGGESTIONS>>>|$)/i);
      if (suggMatch) {
        try {
          const parsedSugg = JSON.parse(suggMatch[1].trim());
          if (Array.isArray(parsedSugg)) suggestions = parsedSugg;
        } catch (_) {}
      }
    } else {
      htmlOutput = rawText;
    }

    // Limpa blocos de markdown e espaços extras
    if (htmlOutput.startsWith("```")) {
      htmlOutput = htmlOutput.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    // Se a saída não parecer um HTML válido, usa o fallback de agência
    if (!htmlOutput.includes("<html") || htmlOutput.length < 150) {
      console.warn("[gerar-site-gemini] Resposta Gemini incompleta, aplicando fallback de agência.");
      htmlOutput = generateAgencyQualityFallbackHtml({
        name,
        niche,
        nicheSlug,
        city,
        phone,
        endereco,
        rating,
        reviewsCount,
      });
    }

    if (suggestions.length === 0) {
      suggestions = [
        "Mudar cores para tema escuro e dourado",
        "Adicionar tabela de preços dos serviços",
        "Destacar mais a localização no Google Maps",
      ];
    }

    if (!explanation) {
      explanation = isRefinement
        ? "Apliquei as alterações solicitadas no código do seu site."
        : `Criei o site oficial de alta conversão para ${name} com base nos dados do Google Meu Negócio.`;
    }

    return jsonResponse({
      success: true,
      model,
      html: htmlOutput,
      explanation,
      suggestions,
    });
  } catch (error) {
    console.error("[gerar-site-gemini] Erro geral:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro ao gerar site com Gemini.",
      },
      500,
    );
  }
});