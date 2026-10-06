// gosom.service depende de binários do sistema: carregado sob demanda no servidor.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requestGemini } from "./gemini-gateway";
import { PremiumBetaProposalSchema, type PremiumBetaProposal } from "./premiumProposal.schema";
import {
  adaptProposalToExistingStructures,
  type AdaptedProposalResult,
} from "./premiumProposal.adapter";
import { detectNicheKey, NICHE_GALLERIES } from "@/modules/prospecting/nichePresets";
import { generateAiImage } from "@/modules/media/services/AiImageService";

function getSupabaseServerClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://gctwvvnjcxnsjiovhmsv.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AiCopilotResult {
  display_name?: string;
  niche?: string;
  city?: string;
  address?: string;
  description?: string;
  whatsapp_message?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  template_id?: string;
  custom_theme?: {
    primary: string;
    background: string;
    text: string;
    title?: string;
    card_bg: string;
    border_color: string;
    mode: "dark" | "light";
    /** Efeito imersivo de profundidade ao rolar a página (disponível em qualquer modelo). */
    parallax?: boolean;
    hero_style?: "split" | "cinematic" | "editorial" | "bento" | string;
    border_radius?: string;
    hue?: number;
    font_pair?: string;
  };
  differentials?: Array<{
    title: string;
    desc: string;
    icon: "shield" | "heart" | "award" | "sparkles" | "check";
  }>;
  testimonials?: Array<{
    id: string;
    author: string;
    role: string;
    rating: number;
    text: string;
  }>;
  about_section?: {
    enabled: boolean;
    title: string;
    text: string;
    highlights: string[];
  };
  suggested_services?: Array<{
    name: string;
    description: string;
    price?: number;
    image_url?: string | null;
  }>;
  curated_photos?: Array<{
    url: string;
    name?: string;
    role: "logo" | "cover" | "product" | "discard";
    scores: {
      authority: number;
      quality: number;
      positioning: number;
    };
    critique: string;
  }>;
  video_embed?: {
    enabled: boolean;
    url: string;
    title: string;
    caption?: string;
  };
}

const nullableString = z.preprocess((val) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return String(val);
}, z.string().optional());

const nullableNumber = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? undefined : parsed;
}, z.number().optional());

const copilotFileInputSchema = z.object({
  name: z.preprocess((val) => (val ? String(val).trim() : "imagem"), z.string().default("imagem")),
  mimeType: z.preprocess(
    (val) => (val ? String(val).trim() : "image/jpeg"),
    z.string().default("image/jpeg"),
  ),
  base64: z.string(),
  publicUrl: nullableString,
  role: z.preprocess(
    (val) => {
      if (!val || typeof val !== "string") return undefined;
      const clean = val.trim().toLowerCase();
      if (["logo", "cover", "product", "general"].includes(clean)) return clean;
      return undefined;
    },
    z.enum(["logo", "cover", "product", "general"]).optional(),
  ),
});

const copilotContextSchema = z.preprocess(
  (val) => (val && typeof val === "object" ? val : undefined),
  z
    .object({
      displayName: nullableString,
      niche: nullableString,
      city: nullableString,
      servicesCount: nullableNumber,
    })
    .optional(),
);

const copilotInputSchema = z
  .object({
    briefing: z.preprocess((val) => {
      if (val === null || val === undefined) return "";
      return typeof val === "string" ? val : String(val);
    }, z.string().max(25000).default("")),
    files: z.preprocess(
      (val) => (Array.isArray(val) ? val : []),
      z.array(copilotFileInputSchema).default([]),
    ),
    videoUrl: nullableString,
    currentContext: copilotContextSchema,
    overrideApiKey: nullableString,
    aiGatewayUrl: nullableString,
    avoidDirectionId: nullableString,
  })
  .refine(
    (data) =>
      (data.briefing && data.briefing.trim().length >= 3) ||
      (data.files && data.files.length > 0) ||
      (data.videoUrl && data.videoUrl.trim().length > 0),
    {
      message:
        "Forneça ao menos um briefing em texto, fotos/documentos anexos ou um link de vídeo.",
    },
  );

export const generateCopilotSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<AiCopilotResult> => {
    function isRealImageUrl(url?: string | null): boolean {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        if (trimmed.includes("example.com") || trimmed.includes("via.placeholder.com"))
          return false;
        return true;
      }
      return false;
    }

    // 0. PREPARAÇÃO & PERSISTÊNCIA DAS IMAGENS ENVIADAS (Storage Supabase ou Data URL infalível)
    const supabaseAdmin = (context as any)?.supabase || getSupabaseServerClient();
    const userId = (context as any)?.userId || "copilot-assets";

    const preparedFiles: Array<{
      name: string;
      mimeType: string;
      base64: string;
      publicUrl: string;
      role?: "logo" | "cover" | "product" | "general";
    }> = [];

    for (const f of data.files || []) {
      const cleanBase64 = f.base64 ? f.base64.replace(/^data:[^;]+;base64,/, "").trim() : "";
      let finalUrl = f.publicUrl;

      // Se a imagem ainda não tem URL pública válida mas temos o base64, persiste no Storage
      if (!isRealImageUrl(finalUrl) && cleanBase64) {
        if (supabaseAdmin) {
          try {
            const ext = f.mimeType.includes("png")
              ? "png"
              : f.mimeType.includes("webp")
                ? "webp"
                : "jpg";
            const path = `${userId}/${crypto.randomUUID()}.${ext}`;
            const buffer = Buffer.from(cleanBase64, "base64");

            const { error: upErr } = await supabaseAdmin.storage
              .from("bio-media")
              .upload(path, buffer, {
                contentType: f.mimeType || "image/jpeg",
                upsert: true,
              });

            if (!upErr) {
              const { data: pubData } = supabaseAdmin.storage.from("bio-media").getPublicUrl(path);
              if (pubData?.publicUrl) {
                finalUrl = pubData.publicUrl;
              }
            }
          } catch (uploadErr) {
            console.warn("Aviso ao persistir arquivo no storage via servidor:", uploadErr);
          }
        }

        // Se o storage não estiver acessível, usa Data URL que renderiza 100% no navegador sem quebrar
        if (!isRealImageUrl(finalUrl)) {
          finalUrl = `data:${f.mimeType || "image/jpeg"};base64,${cleanBase64}`;
        }
      }

      if (isRealImageUrl(finalUrl)) {
        preparedFiles.push({
          name: f.name,
          mimeType: f.mimeType,
          base64: cleanBase64,
          publicUrl: finalUrl!,
          role: f.role,
        });
      }
    }

    // Auto-extração caso o usuário tenha colado link do Google Maps, Drive ou Instagram no texto do briefing
    if (preparedFiles.length < 2 && data.briefing) {
      const urlMatch = data.briefing.match(/https?:\/\/[^\s"'<>]+/);
      if (urlMatch) {
        const foundUrl = urlMatch[0];
        if (
          foundUrl.includes("maps.app.goo.gl") ||
          foundUrl.includes("google.com/maps") ||
          foundUrl.includes("goo.gl/maps") ||
          foundUrl.includes("share.google") ||
          foundUrl.includes("drive.google.com") ||
          foundUrl.includes("instagram.com")
        ) {
          try {
            const extracted = await internalFetchBusinessFromUrl(foundUrl, context);
            if (extracted.importedImages && extracted.importedImages.length > 0) {
              for (const img of extracted.importedImages) {
                if (img.publicUrl && isRealImageUrl(img.publicUrl)) {
                  preparedFiles.push({
                    name: img.name,
                    mimeType: img.mimeType,
                    base64: img.base64 ? img.base64.replace(/^data:[^;]+;base64,/, "").trim() : "",
                    publicUrl: img.publicUrl,
                    role: img.role,
                  });
                }
              }
            }
            if (extracted.formattedBriefing) {
              data.briefing = `${extracted.formattedBriefing}\n\n${data.briefing}`;
            }
            if (extracted.name) {
              if (!data.currentContext) data.currentContext = {};
              data.currentContext.displayName = extracted.name;
              data.currentContext.niche = undefined;
            }
            if (extracted.address && data.currentContext) {
              data.currentContext.city = extracted.address;
            }
          } catch (autoErr) {
            console.warn("Aviso ao auto-extrair mídias da URL do briefing:", autoErr);
          }
        }
      }
    }

    const systemPrompt = `[INSTRUÇÃO DE SISTEMA OBRIGATÓRIA - MODO CINEMATOGRÁFICO PREMIUM]
Você é o Diretor de Arte, Designer Front-End de Elite, Copywriter de Resposta Direta e Estrategista Comercial da plataforma EIA Link.
Sua missão é analisar o briefing, fotos, logotipos e eventuais cardápios/catálogos em PDF para gerar uma estrutura visual de Landing Page cinematográfica, minimalista e de altíssimo padrão visual e de conversão para o negócio do cliente.

REGRAS DE OURO DA GERAÇÃO (DIREÇÃO DE ARTE EXCLUSIVA & ZERO SITES CLONES):
1. DIREÇÃO DE ARTE & IDENTIDADE VISUAL POR NICHO (FIM DOS SITES PRETOS IGUAIS):
   - PROIBIDO gerar sites com a mesma cara ou a mesma paleta para nichos diferentes.
   - NUNCA force o mesmo fundo #030712 e cartões #0b0f19 para todos os negócios!
   - Identifique a cor de maior destaque da marca pelo logotipo ou fotos (ou use a cor nobre do nicho).
   - Defina a atmosfera cromática de acordo com o nicho:
     * GASTRONOMIA, CHURRASCARIA, BURGER, PIZZARIA & BARES:
       Tons quentes de fogo, brasa ou bistrô: background "#140f0c" (Charcoal Ember) ou "#1c1917" (Smoked Stone); card_bg "#221713" ou "#292524"; border_color "#3f271c" ou "#44403c"; primary "#ea580c" (Laranja Brasa) ou "#d97706" (Âmbar Dourado) ou "#dc2626"; title "#ffffff"; text "#fed7aa" ou "#e7e5e4"; mode "dark".
     * SAÚDE, CLÍNICAS MÉDICAS, ODONTOLOGIA & PSICOLOGIA:
       Estética límpida, higiênica e humanizada de alta confiança:
       Light Mode: mode "light", background "#f8fafc", card_bg "#ffffff", border_color "#e2e8f0", primary "#0284c7" (Azul Médico) ou "#0d9488" (Teal Clínico), title "#0f172a", text "#334155".
       Dark Mode: mode "dark", background "#070e1c", card_bg "#0e1a33", border_color "#1d335f", primary "#38bdf8", title "#ffffff", text "#cbd5e1".
     * BELEZA, ESTÉTICA AVANÇADA, SALÕES & SPAS:
       Tons luxuosos de rosê, vinho ou esmeralda VIP: background "#140d14", card_bg "#221422", border_color "#3d213c", primary "#ec4899" (Rose Gold) ou "#f43f5e", title "#ffffff", text "#fce7f3"; mode "dark".
     * ADVOCACIA, JURÍDICO, CONTABILIDADE & FINANÇAS:
       Tons sóbrios de prestígio corporativo: background "#070c18", card_bg "#0e182e", border_color "#1d2f57", primary "#d97706" (Ouro Imperial) ou "#3b82f6" (Azul Corporativo), title "#ffffff", text "#e2e8f0"; mode "dark".
     * BARBEARIA & ESTILO MASCULINO:
       Tons vintage e couro: background "#101114", card_bg "#1a1c22", border_color "#2d313c", primary "#f59e0b", title "#ffffff", text "#e2e8f0"; mode "dark".
     * PET SHOP & VETERINÁRIA:
       Tons naturais e vida: background "#071510", card_bg "#0e261d", border_color "#1a4636", primary "#10b981", title "#ffffff", text "#d1fae5"; mode "dark".
     * OFICINAS MECÂNICAS & AUTO:
       Tons industriais e precisão: background "#0c0e12", card_bg "#151820", border_color "#282e3c", primary "#ea580c" ou "#eab308", title "#ffffff", text "#e2e8f0"; mode "dark".

2. DADOS REAIS DO NEGÓCIO (SUBSTITUIÇÃO TOTAL DOS PLACEHOLDERS DO MODELO BASE):
   - 'display_name': O nome comercial REAL da empresa extraído do logotipo, briefing, URL ou documentos (ex: "Dr. João Silva", "Hamburgueria do Chefe", "Studio Bella"). NUNCA mantenha nomes genéricos como "Policlínica RMed" ou "Empresa Local".
   - 'niche': O nicho exato do negócio (ex: "clinica", "odontologia", "restaurante", "hamburgueria", "advocacia", "beleza", "salao", "fitness", "petshop", etc.).
   - 'city': A cidade ou região real onde a empresa atua (ex: "São Paulo - SP", "Belo Horizonte", "Curitiba").
   - 'address': O endereço real se identificado no briefing/documento/mapa.
   - 'description': Headline magnética de alta conversão (120 a 240 caracteres) adaptada ao negócio real.
   - 'whatsapp_message': Mensagem personalizada de abertura no WhatsApp direcionada ao nome e serviço do negócio.

3. EDIÇÃO SOB DEMANDA (PEDIDOS ESPECÍFICOS DO USUÁRIO):
   - EFEITO IMERSIVO (PARALLAX) & SCROLLYTELLING CINEMATOGRÁFICO:
     * Quando o usuário pedir um site "cinematográfico", "scrollytelling", "narrativa", "capítulos", "história", "imersivo", "estilo café estilo/apple" ou for um nicho sensorial de prestígio (alta gastronomia, cafeteria especial, estética VIP, studios, marcas exclusivas):
       - Defina 'creativeDirection.id': "cinematic-glass".
       - Defina 'creativeDirection.heroStyle': "cinematic".
       - Defina 'creativeDirection.motionIntensity': "cinematic".
       - Defina 'custom_theme.parallax': true.
       - Defina a tipografia ('custom_theme.font_pair'): "elegante" (serifas nobres com itálico na headline) ou "moderna".
       - Escreva copies narrativas, sensoriais e poéticas nos blocos de história, diferenciais e serviços, dividindo a jornada em momentos de ritual, origem, processo e consagração, evitando clichês vazios.
     * 'custom_theme.parallax' (true | false) liga o efeito de profundidade ao rolar a página e funciona em QUALQUER modelo. Defina true sempre que o usuário pedir algo "imersivo", "com parallax", "cinematográfico" ou "com profundidade". Defina false se o usuário pedir uma página estática ou sóbria.

4. BENTO GRIDS & DIFERENCIAIS DE ALTA AUTORIDADE (ZERO CLICHÊS):
   - PROIBIDO usar clichês vazios como "Compromisso com excelência", "Atendimento exclusivo", "Qualidade garantida" ou "Diferencial 1".
   - Gere rigorosamente 3 a 4 diferenciais imponentes e curtos organizados no formato Bento Grid, usando terminologia autêntica e concreta do nicho (cortes nobres, maturação, buffet com sushi, escaneamento 3D, visagismo, etc.).
   - Ícones válidos da biblioteca: "shield", "sparkles", "award", "check", "heart".

5. COPYWRITING BRASILEIRO DE ALTA CONVERSÃO (ZERO FORMALISMO ROBÓTICO):
   - PROIBIÇÃO TOTAL de clichês corporativos vazios como "Compromisso com excelência", "Atendimento personalizado", "Qualidade garantida", "Ambiente acolhedor" ou "Tradição e modernidade".
   - Todo texto deve usar princípios de Resposta Direta (Direct Response) adaptados ao mercado brasileiro:
     * HEADLINE ('description'): 1 ou 2 frases magnéticas combinando desejo imediato + quebra de objeção principal + menção à cidade se houver.
       Exemplos reais vencedores:
       - Gastronomia/Burger: "Picanha e smash artesanal na brasa viva, queijo derretendo e entrega rápida e quentinha na sua porta."
       - Odontologia/Clínica: "Volte a sorrir com confiança: implantes sem dor e alinhadores invisíveis com os melhores especialistas da região."
       - Estética/Beleza: "Realce sua beleza natural com protocolos modernos e atendimento VIP focado na sua autoestima."
       - Advocacia/Serviços: "Seus direitos defendidos com agilidade e clareza, sem termos complicados e com suporte direto no WhatsApp."
     * WHATSAPP ('whatsapp_message'): Mensagem natural, cordial e sem atrito, pronta para o cliente só apertar 'enviar'.
       Exemplo: "Olá! Vi o site de vocês e gostaria de agendar um horário / tirar uma dúvida sobre [Serviço Principal]. Pode me ajudar?"
     * BOTÃO PRINCIPAL: Rótulos de ação diretos e atraentes: "Chamar no WhatsApp", "Reservar Minha Mesa", "Pedir Agora no WhatsApp", "Agendar Avaliação", "Consultar Horários".
   - 'testimonials': PROIBIDO inventar depoimentos fictícios. Se o briefing contiver depoimentos reais do Google Maps, use-os com as palavras reais do cliente. Caso contrário, omita.

6. CATÁLOGO DE SERVIÇOS & PRATOS COM APELO SENSORIAL:
   - 'suggested_services': Liste os itens reais da empresa com nomes saborosos e atraentes, descrições vendedoras que explicam o que está incluso, fotos reais e preços realistas.

7. REGRAS CRÍTICAS E OBRIGATÓRIAS PARA URLs DE FOTOS:
   - Ao preencher 'avatar_url', 'cover_url', 'suggested_services[i].image_url' e 'curated_photos[i].url':
     * Use RIGOROSAMENTE as URLs fornecidas na lista de arquivos em [URL: "..."] ou o nome exato do arquivo.
     * NUNCA invente links externos ou nomes soltos de arquivos (ex: "logo.png" ou "foto.jpg" são estritamente proibidos se não existirem na lista de arquivos).
     * 'avatar_url': Atribua OBRIGATORIAMENTE a URL da imagem de logotipo.
     * 'cover_url': Atribua OBRIGATORIAMENTE a URL da foto de maior presença e impacto.
     * 'suggested_services[i].image_url': Atribua a URL das fotos de produtos/pratos.
     * 'curated_photos': Preencha a lista com as fotos avaliadas, suas respectivas URLs, scores (authority, quality, positioning de 0 a 100) e critique de Diretor de Arte.

8. VÍDEO INSTITUCIONAL:
   - Se o campo videoUrl foi preenchido ou mencionado, configure 'video_embed' com enabled=true, a url indicada, título magnético e legenda convidativa.

9. MÁXIMA ECONOMIA DE TOKENS E SAÍDA PURA:
   - Não gaste tokens com explicações, saudações ou código markdown extra.
   - Retorne RIGOROSAMENTE E APENAS O OBJETO JSON VÁLIDO obedecendo o schema, sem nenhum texto antes ou depois.`;

    // Validacao de dados minimos para evitar geracao completamente inventada
    const _hasBriefing = data.briefing && data.briefing.trim().length > 20;
    const _hasFiles = preparedFiles.length > 0;
    const _hasContext =
      data.currentContext?.displayName && data.currentContext.displayName !== "Empresa Local";
    if (!_hasBriefing && !_hasFiles && !_hasContext) {
      throw new Error(
        "Dados insuficientes para gerar o site. Forneca ao menos: nome do negocio, descricao, " +
          "ou fotos do estabelecimento. Dica: cole o link do Google Maps ou Instagram do negocio.",
      );
    }

    const fileDescriptions = preparedFiles
      .map((f, idx) => {
        let roleHint = "";
        if (f.role === "logo" || f.name.toLowerCase().includes("logo")) {
          roleHint = ` [Papel sugerido: LOGOTIPO da Empresa -> Atribua esta URL exata a 'avatar_url']`;
        } else if (
          f.role === "cover" ||
          f.name.toLowerCase().includes("capa") ||
          f.name.toLowerCase().includes("banner")
        ) {
          roleHint = ` [Papel sugerido: CAPA PRINCIPAL / HERO -> Atribua esta URL exata a 'cover_url']`;
        } else if (
          f.role === "product" ||
          f.name.toLowerCase().includes("prato") ||
          f.name.toLowerCase().includes("pagina")
        ) {
          roleHint = ` [Papel sugerido: FOTO DE PRATO/SERVIÇO -> Atribua esta URL ao respectivo item em 'suggested_services[i].image_url']`;
        }
        return `- Arquivo #${idx + 1}: "${f.name}" (${f.mimeType}) [URL: "${f.publicUrl}"]${roleHint}`;
      })
      .join("\n");

    const userPrompt = `DADOS ATUAIS DO SITE:
Nome Comercial do Cliente / Empresa a Gerar: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

${data.videoUrl ? `LINK DE VÍDEO INFORMADO: ${data.videoUrl}\n` : ""}
${
  fileDescriptions
    ? `ARQUIVOS MULTIMODAIS ANEXADOS (${preparedFiles.length} arquivo(s)):\n${fileDescriptions}\n`
    : ""
}
${data.briefing?.trim() ? `BRIEFING / INFORMAÇÕES ADICIONAIS:\n"""\n${data.briefing}\n"""\n` : ""}
REGRA ABSOLUTA DE IDENTIDADE DO CLIENTE: O site deve ser gerado 100% para o CLIENTE/EMPRESA informado no briefing e nos links. NUNCA misture ou utilize o nicho, produtos ou nome de sites anteriores do usuário.

REGRA CRITICA DE HONESTIDADE: Use APENAS os dados fornecidos acima. NAO invente endereco, telefone, servicos, precos, anos de experiencia, numero de clientes, depoimentos ou certificacoes ausentes do briefing. Dados ausentes = campo null ou secao omitida.

Analise todos os dados e arquivos anexados. Como Diretor de Arte, avalie o score de cada foto (Autoridade, Qualidade e Posicionamento) em 'curated_photos', aloque as fotos vencedoras nos lugares certos ('avatar_url', 'cover_url', 'image_url' de serviços usando as URLs fornecidas), extraia todos os itens e preços de eventuais PDFs e gere a estrutura JSON completa.`;

    // Monta o payload multimodal com as partes inline_data dos arquivos + prompt de texto
    const promptParts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [];

    if (preparedFiles.length > 0) {
      for (const file of preparedFiles) {
        if (file.base64) {
          promptParts.push({
            inline_data: {
              mime_type: file.mimeType,
              data: file.base64,
            },
          });
        }
      }
    }

    promptParts.push({ text: userPrompt });

    let lastError = "";
    let rawContent: string | null = null;

    const finalModelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

    const errorLogs: string[] = [];

    // 1. Tenta a API generateContent nos modelos suportados
    for (const modelName of finalModelsToTry) {
      try {
        const response = await requestGemini(context.supabase, {
          action: "generateContent",
          model: modelName,
          apiKeyOverride: data.overrideApiKey || undefined,
          payload: {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: "user",
                parts: promptParts,
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            parsedError = errorJson.error?.message || errorText;
          } catch {
            // raw text
          }
          const errItem = `Modelo ${modelName} (${response.status}): ${parsedError}`;
          lastError = errItem;
          errorLogs.push(errItem);
          continue;
        }

        const payload = await response.json();
        const candidate = payload.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // Em modelos de raciocínio (Gemini 3.5 e 2.5), partes com `thought: true` contêm
        // a cadeia de reflexão interna. Extraímos o JSON real das partes de conteúdo (`!p.thought`).
        const nonThoughtParts = parts.filter(
          (p: any) => !p.thought && typeof p.text === "string" && p.text.trim(),
        );
        let text = "";
        if (nonThoughtParts.length > 0) {
          text = nonThoughtParts.map((p: any) => p.text).join("\n");
        } else {
          // Fallback se nenhuma parte possuir a flag thought
          const textParts = parts.filter((p: any) => typeof p.text === "string" && p.text.trim());
          text = textParts.map((p: any) => p.text).join("\n");
        }

        if (text) {
          rawContent = text;
          break;
        } else {
          const finishReason = candidate?.finishReason || "UNKNOWN";
          const errItem = `Modelo ${modelName}: resposta vazia (finishReason: ${finishReason})`;
          lastError = errItem;
          errorLogs.push(errItem);
        }
      } catch (err: any) {
        const errItem = `Modelo ${modelName} falhou: ${err?.message || String(err)}`;
        lastError = errItem;
        errorLogs.push(errItem);
      }
    }

    // 2. Fallback: Interactions API caso generateContent falhe
    if (!rawContent) {
      const interactionModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
      for (const modelName of interactionModels) {
        try {
          const response = await requestGemini(context.supabase, {
            action: "interactions",
            model: modelName,
            apiKeyOverride: data.overrideApiKey || undefined,
            payload: {
              model: modelName,
              system_instruction: systemPrompt,
              input: userPrompt,
              response_mime_type: "application/json",
            },
          });

          if (!response.ok) {
            const errText = await response.text();
            let parsedErr = errText;
            try {
              const errObj = JSON.parse(errText);
              parsedErr = errObj.error?.message || errText;
            } catch {
              // raw
            }
            const errItem = `Interactions API (${modelName} - ${response.status}): ${parsedErr}`;
            lastError = errItem;
            errorLogs.push(errItem);
            continue;
          }

          const payload = await response.json();
          let text = payload.output_text;
          if (!text && Array.isArray(payload.steps)) {
            for (let i = payload.steps.length - 1; i >= 0; i--) {
              const step = payload.steps[i];
              if (step?.content && Array.isArray(step.content)) {
                for (const part of step.content) {
                  if (!part.thought && (part.type === "text" || !part.type) && part.text) {
                    text = part.text;
                    break;
                  }
                }
              }
              if (text) break;
            }
          }

          if (text) {
            rawContent = text;
            break;
          }
        } catch (err: any) {
          const errItem = `Interactions API (${modelName}) falhou: ${err?.message || String(err)}`;
          lastError = errItem;
          errorLogs.push(errItem);
        }
      }
    }

    if (!rawContent) {
      const detailMsg =
        errorLogs.length > 0
          ? errorLogs.join(" | ")
          : lastError || "Nenhum modelo respondeu com sucesso";
      throw new Error(
        `Não foi possível gerar com a API do Google AI Studio. Detalhe: ${detailMsg}. Certifique-se de que sua chave de API está ativa no console do Google AI Studio.`,
      );
    }

    try {
      let cleanJson = rawContent.trim();
      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1].trim();
      } else {
        cleanJson = cleanJson
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
      }
      const parsed: AiCopilotResult = JSON.parse(cleanJson);

      // Blindagem matemática WCAG de contraste do tema gerado pela IA
      if (parsed.custom_theme) {
        const calcLum = (hex?: string) => {
          if (!hex || !hex.startsWith("#") || hex.length < 7) return 150;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return (r * 299 + g * 587 + b * 114) / 1000;
        };

        const bgLum = calcLum(parsed.custom_theme.background);
        const isDark = parsed.custom_theme.mode === "dark" || bgLum < 128;

        parsed.custom_theme = {
          ...parsed.custom_theme,
          mode: isDark ? "dark" : "light",
          background: isDark
            ? parsed.custom_theme.background && calcLum(parsed.custom_theme.background) < 90
              ? parsed.custom_theme.background
              : "#0a0c10"
            : parsed.custom_theme.background && calcLum(parsed.custom_theme.background) > 160
              ? parsed.custom_theme.background
              : "#f8fafc",
          title: isDark ? "#ffffff" : "#0f172a",
          text: isDark
            ? calcLum(parsed.custom_theme.text) > 130
              ? parsed.custom_theme.text
              : "#e2e8f0"
            : calcLum(parsed.custom_theme.text) < 100
              ? parsed.custom_theme.text
              : "#334155",
          card_bg: parsed.custom_theme.card_bg || (isDark ? "#12161f" : "#ffffff"),
          border_color: parsed.custom_theme.border_color || (isDark ? "#1f293d" : "#e2e8f0"),
        };
      }

      // NORMALIZAÇÃO RIGOROSA DOS SERVIÇOS E PREÇOS EXTRAÍDOS PELA IA:
      if (Array.isArray(parsed.suggested_services)) {
        parsed.suggested_services = parsed.suggested_services.map((svc: any) => {
          let cleanPrice: number | null = null;
          if (typeof svc.price === "number") {
            cleanPrice = isNaN(svc.price) ? null : svc.price;
          } else if (typeof svc.price === "string") {
            const cleanStr = svc.price.replace(/[^\d.,]/g, "").replace(",", ".");
            const num = parseFloat(cleanStr);
            cleanPrice = !isNaN(num) ? num : null;
          }
          return {
            ...svc,
            name: String(svc.name || "Serviço"),
            description: String(svc.description || ""),
            price: cleanPrice,
            image_url: svc.image_url || null,
          };
        });
      }

      // RESOLUÇÃO DETERMINÍSTICA E INFALÍVEL DE FOTOS DO USUÁRIO:
      // Mapeia referências retornadas pelo Gemini (URLs, nomes de arquivo, números de arquivo)
      // para URLs perenes e reais das fotos enviadas, garantindo que NENHUMA foto fique quebrada.
      function resolveFileUrl(candidate?: string | null): string | null {
        if (!candidate || typeof candidate !== "string") return null;
        const cleanCandidate = candidate.trim().toLowerCase();

        // 1. URL pública exata de um dos nossos arquivos
        const exact = preparedFiles.find((f) => f.publicUrl === candidate.trim());
        if (exact?.publicUrl) return exact.publicUrl;

        // 2. Por nome do arquivo (ou correspondência parcial)
        const byName = preparedFiles.find((f) => {
          const fn = f.name.toLowerCase();
          return (
            fn === cleanCandidate || cleanCandidate.includes(fn) || fn.includes(cleanCandidate)
          );
        });
        if (byName?.publicUrl) return byName.publicUrl;

        // 3. Por menção a número de arquivo (#1, Arquivo #1, file 1, etc.)
        const numMatch = cleanCandidate.match(/(?:arquivo|file|foto|imagem|#)\s*#?(\d+)/i);
        if (numMatch) {
          const idx = parseInt(numMatch[1], 10) - 1;
          if (idx >= 0 && idx < preparedFiles.length) {
            return preparedFiles[idx].publicUrl;
          }
        }

        // 4. URL externa real e válida (Google Maps, Unsplash, Supabase, CDN) ou data:/blob:
        if (
          candidate.startsWith("https://") ||
          candidate.startsWith("http://") ||
          candidate.startsWith("data:image/") ||
          candidate.startsWith("blob:")
        ) {
          if (
            !candidate.includes("example.com") &&
            !candidate.includes("URL_") &&
            !candidate.includes("placeholder")
          ) {
            return candidate.trim();
          }
        }
        return null;
      }

      if (preparedFiles.length > 0) {
        // 1. Logo (avatar_url)
        let resolvedAvatar = resolveFileUrl(parsed.avatar_url);
        if (!resolvedAvatar) {
          const logoCandidate =
            preparedFiles.find((f) => f.role === "logo" || f.name.toLowerCase().includes("logo")) ||
            preparedFiles[0];
          resolvedAvatar = logoCandidate?.publicUrl || null;
        }
        parsed.avatar_url = resolvedAvatar;

        // 2. Capa Principal / Hero (cover_url)
        let resolvedCover = resolveFileUrl(parsed.cover_url);
        if (!resolvedCover) {
          const coverCandidate =
            preparedFiles.find(
              (f) =>
                (f.role === "cover" ||
                  f.name.toLowerCase().includes("capa") ||
                  f.name.toLowerCase().includes("banner")) &&
                f.publicUrl !== parsed.avatar_url,
            ) ||
            preparedFiles.find((f) => f.publicUrl !== parsed.avatar_url) ||
            preparedFiles[0];
          resolvedCover = coverCandidate?.publicUrl || null;
        }
        parsed.cover_url = resolvedCover;

        // 3. Catálogo / Serviços / Pratos
        if (Array.isArray(parsed.suggested_services) && parsed.suggested_services.length > 0) {
          const servicePool = preparedFiles.filter(
            (f) => f.publicUrl !== parsed.avatar_url && f.publicUrl !== parsed.cover_url,
          );
          let poolIdx = 0;
          for (const svc of parsed.suggested_services) {
            let resolvedSvcImg = resolveFileUrl(svc.image_url);
            if (!resolvedSvcImg && poolIdx < servicePool.length) {
              resolvedSvcImg = servicePool[poolIdx].publicUrl;
              poolIdx++;
            }
            svc.image_url = resolvedSvcImg || null;
          }
        }

        // 4. Curadoria Completa das Fotos
        if (Array.isArray(parsed.curated_photos) && parsed.curated_photos.length > 0) {
          parsed.curated_photos = parsed.curated_photos
            .map((item, idx) => {
              let itemUrl = resolveFileUrl(item.url) || resolveFileUrl(item.name);
              if (!itemUrl && idx < preparedFiles.length) {
                itemUrl = preparedFiles[idx].publicUrl;
              }
              return {
                ...item,
                url: itemUrl || preparedFiles[0]?.publicUrl || "",
                name: item.name || preparedFiles[idx]?.name || `Foto ${idx + 1}`,
              };
            })
            .filter((item) => Boolean(item.url));
        } else {
          parsed.curated_photos = preparedFiles.map((f) => ({
            url: f.publicUrl,
            name: f.name,
            role:
              f.publicUrl === parsed.avatar_url
                ? "logo"
                : f.publicUrl === parsed.cover_url
                  ? "cover"
                  : "product",
            scores: {
              authority: 92,
              quality: 94,
              positioning: 90,
            },
            critique:
              f.publicUrl === parsed.avatar_url
                ? "Logotipo identificado e incorporado como identidade oficial da marca."
                : f.publicUrl === parsed.cover_url
                  ? "Foto com maior presença e impacto, alocada na Capa Hero cinematográfica."
                  : "Foto inserida no catálogo de produtos/serviços de alta conversão.",
          }));
        }
      }

      return parsed;
    } catch {
      throw new Error("Não foi possível decodificar o JSON estruturado gerado pelo Gemini.");
    }
  });

export interface PremiumProposalResponse {
  proposal: PremiumBetaProposal;
  adapted: AdaptedProposalResult;
}

export const generatePremiumProposalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    function isRealImageUrl(url?: string | null): boolean {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        if (trimmed.includes("example.com") || trimmed.includes("via.placeholder.com"))
          return false;
        return true;
      }
      return false;
    }

    // 0. Preparação & Persistência das Imagens
    const supabaseAdmin = (context as any)?.supabase || getSupabaseServerClient();
    const userId = (context as any)?.userId || "premium-assets";

    const preparedFiles: Array<{
      name: string;
      mimeType: string;
      base64: string;
      publicUrl: string;
      role?: "logo" | "cover" | "product" | "general";
    }> = [];

    for (const f of data.files || []) {
      const cleanBase64 = f.base64 ? f.base64.replace(/^data:[^;]+;base64,/, "").trim() : "";
      let finalUrl = f.publicUrl;

      if (!isRealImageUrl(finalUrl) && cleanBase64) {
        if (supabaseAdmin) {
          try {
            const ext = f.mimeType.includes("png")
              ? "png"
              : f.mimeType.includes("webp")
                ? "webp"
                : "jpg";
            const path = `${userId}/${crypto.randomUUID()}.${ext}`;
            const buffer = Buffer.from(cleanBase64, "base64");

            const { error: upErr } = await supabaseAdmin.storage
              .from("bio-media")
              .upload(path, buffer, {
                contentType: f.mimeType || "image/jpeg",
                upsert: true,
              });

            if (!upErr) {
              const { data: pubData } = supabaseAdmin.storage.from("bio-media").getPublicUrl(path);
              if (pubData?.publicUrl) {
                finalUrl = pubData.publicUrl;
              }
            }
          } catch (uploadErr) {
            console.warn("Aviso ao persistir arquivo no storage via servidor:", uploadErr);
          }
        }

        if (!isRealImageUrl(finalUrl)) {
          finalUrl = `data:${f.mimeType || "image/jpeg"};base64,${cleanBase64}`;
        }
      }

      if (isRealImageUrl(finalUrl)) {
        preparedFiles.push({
          name: f.name,
          mimeType: f.mimeType,
          base64: cleanBase64,
          publicUrl: finalUrl!,
          role: f.role,
        });
      }
    }

    // Auto-extração caso o usuário tenha colado link do Google Maps, Drive ou Instagram no texto do briefing
    if (preparedFiles.length < 2 && data.briefing) {
      const urlMatch = data.briefing.match(/https?:\/\/[^\s"'<>]+/);
      if (urlMatch) {
        const foundUrl = urlMatch[0];
        if (
          foundUrl.includes("maps.app.goo.gl") ||
          foundUrl.includes("google.com/maps") ||
          foundUrl.includes("goo.gl/maps") ||
          foundUrl.includes("drive.google.com") ||
          foundUrl.includes("instagram.com")
        ) {
          try {
            const extracted = await internalFetchBusinessFromUrl(foundUrl, context);
            if (extracted.importedImages && extracted.importedImages.length > 0) {
              for (const img of extracted.importedImages) {
                if (img.publicUrl && isRealImageUrl(img.publicUrl)) {
                  preparedFiles.push({
                    name: img.name,
                    mimeType: img.mimeType,
                    base64: img.base64 ? img.base64.replace(/^data:[^;]+;base64,/, "").trim() : "",
                    publicUrl: img.publicUrl,
                    role: img.role,
                  });
                }
              }
            }
            if (extracted.formattedBriefing) {
              data.briefing = `${extracted.formattedBriefing}\n\n${data.briefing}`;
            }
            if (extracted.name) {
              if (!data.currentContext) data.currentContext = {};
              data.currentContext.displayName = extracted.name;
              data.currentContext.niche = undefined;
            }
            if (extracted.address && data.currentContext) {
              data.currentContext.city = extracted.address;
            }
          } catch (autoErr) {
            console.warn("Aviso ao auto-extrair mídias da URL do briefing:", autoErr);
          }
        }
      }
    }

    const fileDescriptions = preparedFiles
      .map((f, idx) => {
        let roleHint = "";
        if (f.role === "logo" || f.name.toLowerCase().includes("logo")) {
          roleHint = ` [Papel sugerido: LOGOTIPO -> avatarUrl]`;
        } else if (
          f.role === "cover" ||
          f.name.toLowerCase().includes("capa") ||
          f.name.toLowerCase().includes("banner")
        ) {
          roleHint = ` [Papel sugerido: CAPA PRINCIPAL -> coverUrl e seção hero]`;
        } else if (
          f.role === "product" ||
          f.name.toLowerCase().includes("prato") ||
          f.name.toLowerCase().includes("servico")
        ) {
          roleHint = ` [Papel sugerido: PRODUTO/SERVIÇO -> catalogItems e catalog_carousel]`;
        }
        return `- Arquivo #${idx + 1}: "${f.name}" (${f.mimeType}) [URL: "${f.publicUrl}"]${roleHint}`;
      })
      .join("\n");

    // Semente criativa: garante variedade entre gerações (e entre "Gerar outra versão")
    const ART_DIRECTIONS = [
      {
        id: "editorial-luxo",
        brief:
          "Editorial de luxo: muito respiro, tipografia serifada elegante (fontPair 'elegante'), paleta sóbria com um único acento metálico (ouro, champagne ou cobre), motion 'subtle'.",
      },
      {
        id: "neon-noturno",
        brief:
          "Neon noturno: fundo quase preto com leve tom da cor principal, acento vibrante saturado (ciano, magenta, lima ou laranja elétrico), fontPair 'marcante', motion 'cinematic'.",
      },
      {
        id: "minimal-claro",
        brief:
          "Minimal claro: mode 'light', fundo off-white quente ou frio, texto grafite, acento único e contido, fontPair 'moderna', motion 'subtle'.",
      },
      {
        id: "organico-quente",
        brief:
          "Orgânico quente: tons terrosos (argila, oliva, areia, terracota), sensação artesanal e acolhedora, fontPair 'elegante' ou 'moderna', motion 'standard'.",
      },
      {
        id: "brutalista-bold",
        brief:
          "Brutalista bold: alto contraste, cores chapadas fortes, bordas retas (radius '4px'), títulos enormes, fontPair 'marcante', motion 'standard'.",
      },
      {
        id: "cinematografico",
        brief:
          "Cinematográfico: fotos em destaque total, fundo profundo com gradiente da cor principal, acento quente, fontPair 'elegante' ou 'marcante', motion 'cinematic'.",
      },
      {
        id: "corporativo-confianca",
        brief:
          "Corporativo de confiança: azuis/verdes profundos ou grafite com acento sóbrio, fontPair 'corporativa', layout organizado, motion 'subtle'.",
      },
      {
        id: "vibrante-pop",
        brief:
          "Vibrante pop: energia jovem, 2 cores complementares alegres, radius '24px', fontPair 'marcante', motion 'standard'.",
      },
    ];
    const availableDirections = ART_DIRECTIONS.filter((d) => d.id !== data.avoidDirectionId);
    const chosenDirection =
      availableDirections[Math.floor(Math.random() * availableDirections.length)];

    const systemPrompt = `[INSTRUÇÃO MESTRE - GERADOR PREMIUM BETA NÍVEL 2 - COMPOSIÇÃO LIVRE CONTROLADA]
Você é um Arquiteto Sênior de Produto, Diretor de Arte de Elite e Copywriter Especialista da plataforma EIA Link.
Sua missão é transformar o briefing, fotos e dados do negócio do cliente em uma PROPOSTA ESTRUTURADA DE SITE DE ALTO PADRÃO (Schema Version 2).

NÃO reconstrua o sistema do zero.
NÃO escreva nem execute React, HTML, CSS ou JavaScript arbitrário.
Apenas escolha, ordene e configure blocos aprovados do sistema.

REGRAS INEGOCIÁVEIS DE ANCORAGEM (GROUNDING RIGOROSO):
1. PROIBIÇÃO TOTAL DE INVENÇÃO:
   - Se o usuário forneceu dados reais (nome da empresa, nicho, cidade, telefone, endereço, pratos/serviços), use-os EXATAMENTE como fornecidos.
   - Preencha 'strategy.confirmedFacts' listando cada fato comprovado pelos dados de entrada.
   - NUNCA invente fatos externos que não existam (ex: não invente que a empresa tem 20 anos de tradição, não invente endereço falso, não invente nomes de pratos que não existem).
   - Se faltarem informações críticas, liste-as em 'strategy.missingInformation' (ex: "Preços exatos ausentes", "Endereço físico não informado").
   - Qualquer copy inferida para valorizar a página deve ser listada em 'audit.unconfirmedContent' para ciência do usuário.

2. ATRIBUIÇÃO DE TODAS AS MÍDIAS FORNECIDAS (ZERO FOTOS PERDIDAS):
   - Para CADA arquivo listado em 'ARQUIVOS MULTIMODAIS ANEXADOS', crie OBRIGATORIAMENTE uma entrada em 'mediaAssignments'.
   - Atribua a URL exata do arquivo fornecida em [URL: "..."] à seção correspondente ('hero', 'differentials', 'catalog_carousel', 'about', 'testimonials').
   - Atribua o papel correto: 'logo' (avatarUrl), 'cover' (coverUrl e hero), 'product' (catalogItems e catalog_carousel), 'ambient' (about/galeria).
   - Avalie 'qualityScore' (0 a 100) e forneça um breve 'reasoning' de Diretor de Arte para cada foto.

3. DIREÇÃO DE ARTE ÚNICA (FIM DOS SITES CLONES):
   - DIREÇÃO SORTEADA PARA ESTA GERAÇÃO (obrigatória, adapte ao negócio): ${chosenDirection.brief}
   - Crie um conceito criativo com nome curto e autoral em 'creativeDirection.concept' (ex.: "Navalha & Couro", "Brasa Noturna", "Sorriso de Vidro").
   - 'creativeDirection.id' deve ser "${chosenDirection.id}".
   - Crie uma PALETA PRÓPRIA em hex (primary, background, card_bg, border_color, title, text). NÃO use paletas genéricas nem o preto #030712. Derive a cor principal do segmento, das fotos e do nome do negócio.
   - Contraste obrigatório: texto e título legíveis sobre o fundo (WCAG AA).
   - 'theme.fontPair': um de "moderna" | "elegante" | "marcante" | "corporativa".
   - 'theme.radius': entre "4px" e "28px" coerente com a direção.
   - 'creativeDirection.heroStyle': um de "fullscreen-photo" | "split" | "centered-minimal" | "overlay-gradient".
    - 'creativeDirection.motionIntensity': "subtle" | "standard" | "cinematic".
    - 'theme.parallax': true | false. Ative (true) o efeito imersivo de profundidade quando o negócio for visual e premium (gastronomia, estética, barbearia, moda, arquitetura, academia, eventos) ou quando o usuário pedir algo imersivo/cinematográfico. Use false para páginas sóbrias ou institucionais com poucas fotos.
   - Escolha e ORDENE as seções de forma estratégica para este negócio (não siga sempre a mesma ordem). Desative seções sem dados reais.

4. COPYWRITING BRASILEIRO DE ALTA CONVERSÃO (ZERO CLICHÊS CORPORATIVOS):
   - PROIBIÇÃO ABSOLUTA de frases vazias como "Compromisso com excelência", "Atendimento exclusivo", "Qualidade garantida", "Diferencial 1", "Diferencial 2", "Nome do Produto ou Serviço".
   - Todo texto deve usar princípios de Resposta Direta (Direct Response) adaptados ao mercado brasileiro:
     * Headline magnética, humana e direta ao ponto, focada no resultado concreto do cliente (ex: "Sua mesa reservada e os melhores cortes na brasa", "Volte a sorrir sem medo: implantes e próteses sem dor").
     * Mensagem de WhatsApp pré-configurada amigável, sem frieza corporativa.
     * Rótulos de botão comerciais e atraentes ("Chamar no WhatsApp", "Reservar Mesa no WhatsApp", "Pedir Agora", "Agendar Avaliação Gratuita").
   - Grounding com fatos reais: absorva nomes de pratos, especialidades, localização, nota de avaliações do Google e anos de atuação presentes no briefing/mapas.
   - 'catalogItems': Crie itens reais e específicos do negócio com descrições apetitosas ou explicativas do benefício real.
   - 'differentials': 3 a 4 pilares concretos com ícones aprovados ("shield", "sparkles", "award", "check", "heart") destacando conveniência, segurança, velocidade ou exclusividade.
   - 'about': Conte a história real do estabelecimento ou os pilares práticos de atendimento.
   - 'faq': 4 a 5 perguntas reais que quebram as principais dúvidas do cliente final (reservas, prazos, formas de pagamento, estacionamento, etc.).

5. FORMATO DA RESPOSTA:
   - Retorne EXCLUSIVAMENTE o objeto JSON válido estruturado de acordo com o Schema v2 (use camelCase exatamente como no exemplo abaixo), sem nenhum texto antes ou depois:

{
  "schemaVersion": 2,
  "generator": "premium-beta",
  "status": "proposal",
  "strategy": {
    "businessType": "Restaurante / Clínica / etc.",
    "niche": "restaurante",
    "city": "Cidade Real",
    "audience": "Famílias e apreciadores de carnes nobres",
    "primaryGoal": "whatsapp",
    "primaryCta": "Reservar Mesa no WhatsApp",
    "tone": "Sensorial, acolhedor e imponente",
    "confirmedFacts": ["Rodízio completo com mais de 30 cortes", "Buffet com sushi e frutos do mar", "Localizado em frente à praia"],
    "missingInformation": ["Valores exatos de bebidas ausentes"]
  },
  "creativeDirection": {
    "id": "ID_DA_DIRECAO_SORTEADA",
    "name": "Nome da direção de arte",
    "referenceIds": [],
    "visualPrinciples": ["Atmosfera acolhedora de brasa", "Foco visual em cortes nobres", "Tipografia de alta legibilidade"],
    "motionIntensity": "standard",
    "concept": "NOME_DO_CONCEITO_AUTORAL",
    "heroStyle": "overlay-gradient"
  },
  "theme": {
    "paletteId": null,
    "fontPair": "elegante",
    "primary": "#HEX_PROPRIO",
    "background": "#HEX_PROPRIO",
    "card_bg": "#HEX_PROPRIO",
    "border_color": "#HEX_PROPRIO",
    "title": "#HEX_PROPRIO",
    "text": "#HEX_PROPRIO",
    "mode": "dark",
    "radius": "16px",
    "density": "comfortable",
    "parallax": true
  },
  "pagePatch": {
    "displayName": "Nome Real da Empresa",
    "description": "Headline magnética e sensorial escrita especificamente para o negócio e cidade",
    "whatsapp": "55...",
    "whatsappMessage": "Olá! Gostaria de reservar uma mesa / agendar um horário...",
    "whatsappButtonLabel": "Chamar no WhatsApp",
    "avatarUrl": "URL_DO_LOGO_SE_HOUVER",
    "coverUrl": "URL_DA_CAPA_SE_HOUVER",
    "seo": {
      "metaTitle": "Nome Real da Empresa | Especialidade Principal",
      "metaDescription": "Descrição SEO atrativa e otimizada"
    }
  },
  "links": [],
  "catalogItems": [
    {
      "name": "Item Principal Específico do Negócio",
      "description": "Descrição detalhada, sensorial e convidativa",
      "price": 89.9,
      "imageUrl": "URL_DA_FOTO_DO_PRODUTO",
      "category": "Destaques",
      "buttonLabel": "Reservar Mesa / Pedir"
    }
  ],
  "sections": [
    {
      "id": "hero-section",
      "type": "hero",
      "variant": "cinematic-fullscreen",
      "enabled": true,
      "position": 0,
      "source": "bio_pages",
      "title": "Título Imponente Específico do Nicho",
      "subtitle": "Subtítulo convincente destacando variedade, qualidade e convite",
      "content": {},
      "media": [{ "url": "URL_DA_FOTO_DE_CAPA", "role": "cover" }]
    },
    {
      "id": "differentials-section",
      "type": "differentials",
      "variant": "bento-grid",
      "enabled": true,
      "position": 1,
      "source": "custom",
      "title": "Nossos Diferenciais Exclusivos",
      "content": {
        "items": [
          { "title": "Diferencial Real 1", "description": "Explicação técnica e autêntica", "icon": "award" },
          { "title": "Diferencial Real 2", "description": "Explicação técnica e autêntica", "icon": "sparkles" },
          { "title": "Diferencial Real 3", "description": "Explicação técnica e autêntica", "icon": "shield" }
        ]
      },
      "media": []
    },
    {
      "id": "catalog-section",
      "type": "catalog_carousel",
      "variant": "modern-carousel",
      "enabled": true,
      "position": 2,
      "source": "catalog_items",
      "title": "Destaques do Cardápio / Serviços",
      "subtitle": "Opções selecionadas preparadas com rigor e excelência",
      "content": {},
      "media": []
    },
    {
      "id": "about-section",
      "type": "about",
      "variant": "story-split",
      "enabled": true,
      "position": 3,
      "source": "custom",
      "title": "Nossa Trajetória & Propósito",
      "subtitle": "Dedicação diária aos nossos clientes",
      "content": {
        "story": "História autêntica do negócio baseada no briefing e dados reais coletados.",
        "highlights": ["Destaque estrutural 1", "Destaque de atendimento 2", "Destaque de matéria-prima 3"]
      },
      "media": []
    },
    {
      "id": "testimonials-section",
      "type": "testimonials",
      "variant": "quote-cards",
      "enabled": false,
      "position": 4,
      "source": "custom",
      "title": "O que nossos clientes dizem",
      "content": {
        "testimonials": []
      },
      "media": []
    },
    {
      "id": "contact-section",
      "type": "contact_map",
      "variant": "compact-info",
      "enabled": true,
      "position": 5,
      "source": "custom",
      "title": "Venha nos Visitar ou Fale Conosco",
      "content": {},
      "media": []
    },
    {
      "id": "cta-section",
      "type": "whatsapp_cta",
      "variant": "floating-action",
      "enabled": true,
      "position": 6,
      "source": "custom",
      "title": "Pronto para ter a melhor experiência?",
      "subtitle": "Fale agora mesmo com nossa equipe e tire suas dúvidas.",
      "content": {},
      "media": []
    }
  ],
  "mediaAssignments": [
    {
      "fileName": "foto.jpg",
      "assignedUrl": "URL_EXATA_DO_ARQUIVO",
      "assignedSectionId": "hero",
      "assignedRole": "cover",
      "qualityScore": 95,
      "reasoning": "Foto de alta definição com enquadramento cinematográfico ideal para capa."
    }
  ],
  "audit": {
    "criticalIssues": [],
    "warnings": [],
    "suggestions": [],
    "unconfirmedContent": []
  }
}`;

    const userPrompt = `DADOS ATUAIS DO SITE:
Nome Comercial do Cliente / Empresa a Gerar: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

${data.videoUrl ? `LINK DE VÍDEO INFORMADO: ${data.videoUrl}\n` : ""}
${
  fileDescriptions
    ? `ARQUIVOS MULTIMODAIS ANEXADOS (${preparedFiles.length} arquivo(s)):\n${fileDescriptions}\n`
    : "Nenhum arquivo multimodal anexado.\n"
}
${data.briefing?.trim() ? `BRIEFING / INFORMAÇÕES DO CLIENTE:\n"""\n${data.briefing}\n"""\n` : ""}

REGRA ABSOLUTA DE IDENTIDADE DO CLIENTE: O site deve ser gerado 100% para o CLIENTE/EMPRESA informado no briefing e nos links. NUNCA misture ou utilize o nicho, produtos ou nome de sites anteriores do usuário.

REGRA CRITICA DE HONESTIDADE: Use APENAS os dados fornecidos acima. NAO invente endereco, telefone, servicos, precos, depoimentos ou certificacoes. Dados ausentes vao para missingInformation. Secoes sem dados ficam com enabled:false.

Como Diretor de Arte e Arquiteto de Produto de Elite:
1. Registre os fatos confirmados em 'strategy.confirmedFacts'.
2. Aloue 100% dos arquivos fornecidos em 'mediaAssignments' e nas seções correspondentes.
3. Crie o catálogo de serviços/produtos concretos e irresistíveis para ESTE negócio específico em 'catalogItems' com botões adequados (ex: "Reservar Mesa" para restaurantes, "Agendar Avaliação" para clínicas).
4. Aplique a paleta cromática e direção de arte coerente com o nicho específico (Gastronomia, Saúde, Beleza, Advocacia, etc.) NUNCA gerando o mesmo tema escuro genérico.
5. HABILIDADE SCROLLYTELLING CINEMATOGRÁFICO: Se o usuário pedir estilo "cinematográfico", "scrollytelling", "narrativa", "capítulos", "história", "imersivo", "café estilo" ou for nicho de alta experiência sensorial/gastronomia/beleza VIP, defina creativeDirection.id="cinematic-glass", heroStyle="cinematic", motionIntensity="cinematic", custom_theme.parallax=true e font_pair="elegante".
6. Escreva copywriting persuasivo, sensorial e sem clichês em todas as seções (hero, diferenciais bento grid, história e faq).
7. Monte a composição ordenada das seções usando apenas os blocos homologados.
8. Retorne a resposta exclusivamente em JSON válido do Schema v2.`;

    const promptParts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [];

    if (preparedFiles.length > 0) {
      for (const file of preparedFiles) {
        if (file.base64) {
          promptParts.push({
            inline_data: {
              mime_type: file.mimeType,
              data: file.base64,
            },
          });
        }
      }
    }

    promptParts.push({ text: userPrompt });

    const finalModelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

    let rawContent: string | null = null;
    let lastError = "";
    let fatalError: string | null = null;
    const errorLogs: string[] = [];

    for (const modelName of finalModelsToTry) {
      try {
        const response = await requestGemini(context.supabase, {
          action: "generateContent",
          model: modelName,
          apiKeyOverride: data.overrideApiKey || undefined,
          payload: {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: "user",
                parts: promptParts,
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.95,
            },
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedError = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            parsedError = errorJson.error?.message || errorText;
          } catch {}
          const errItem = `Modelo ${modelName} (${response.status}): ${parsedError}`;
          lastError = errItem;
          errorLogs.push(errItem);
          // Erros de chave/requisição valem para todos os modelos: para aqui e economiza cota
          if ([400, 401, 403].includes(response.status)) {
            fatalError =
              response.status === 400 && !/api key/i.test(parsedError)
                ? `Requisição recusada pelo Google AI Studio: ${parsedError}`
                : "Chave do Google AI Studio inválida ou sem permissão. Confira a chave colada no painel.";
            break;
          }
          if (response.status === 429) {
            lastError =
              "Cota gratuita do Google AI Studio atingida no momento. Aguarde alguns minutos e tente novamente.";
          }
          continue;
        }

        const payload = await response.json();
        const candidate = payload.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        const nonThoughtParts = parts.filter(
          (p: any) => !p.thought && typeof p.text === "string" && p.text.trim(),
        );
        let text = "";
        if (nonThoughtParts.length > 0) {
          text = nonThoughtParts.map((p: any) => p.text).join("\n");
        } else {
          const textParts = parts.filter((p: any) => typeof p.text === "string" && p.text.trim());
          text = textParts.map((p: any) => p.text).join("\n");
        }

        if (text) {
          rawContent = text;
          break;
        } else {
          const finishReason = candidate?.finishReason || "UNKNOWN";
          const errItem = `Modelo ${modelName}: resposta vazia (finishReason: ${finishReason})`;
          lastError = errItem;
          errorLogs.push(errItem);
        }
      } catch (err: any) {
        const errItem = `Modelo ${modelName} falhou: ${err?.message || String(err)}`;
        lastError = errItem;
        errorLogs.push(errItem);
      }
    }

    if (fatalError) throw new Error(fatalError);

    if (!rawContent) {
      const detailMsg =
        errorLogs.length > 0
          ? errorLogs.join(" | ")
          : lastError || "Nenhum modelo respondeu com sucesso";
      throw new Error(
        `Não foi possível gerar a Proposta Premium. Detalhe: ${detailMsg}. Certifique-se de que sua chave de API está ativa no Google AI Studio.`,
      );
    }

    try {
      let cleanJson = rawContent.trim();
      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1].trim();
      } else {
        cleanJson = cleanJson
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
      }

      const parsedJson = JSON.parse(cleanJson);

      function resolveFileUrl(candidate?: string | null): string | null {
        if (!candidate || typeof candidate !== "string") return null;
        const cleanCandidate = candidate.trim().toLowerCase();
        const exact = preparedFiles.find((f) => f.publicUrl === candidate.trim());
        if (exact?.publicUrl) return exact.publicUrl;
        const byName = preparedFiles.find(
          (f) =>
            f.name.toLowerCase() === cleanCandidate ||
            cleanCandidate.includes(f.name.toLowerCase()) ||
            f.name.toLowerCase().includes(cleanCandidate),
        );
        if (byName?.publicUrl) return byName.publicUrl;
        const numMatch = cleanCandidate.match(/#?(\d+)/);
        if (numMatch) {
          const idx = parseInt(numMatch[1], 10) - 1;
          if (idx >= 0 && idx < preparedFiles.length) {
            return preparedFiles[idx].publicUrl;
          }
        }
        // Aceita URLs web válidas (Google Maps, Unsplash, CDN, Supabase) ou data:/blob:
        if (
          candidate.startsWith("https://") ||
          candidate.startsWith("http://") ||
          candidate.startsWith("data:image/") ||
          candidate.startsWith("blob:")
        ) {
          if (
            !candidate.includes("example.com") &&
            !candidate.includes("URL_") &&
            !candidate.includes("placeholder")
          ) {
            return candidate.trim();
          }
        }
        return null;
      }

      const validatedProposal = PremiumBetaProposalSchema.parse(parsedJson);

      const briefingLower = (data.briefing || "").toLowerCase();
      const wantsPhotoChange =
        briefingLower.includes("trocar as fotos") ||
        briefingLower.includes("trocar foto") ||
        briefingLower.includes("novas fotos") ||
        briefingLower.includes("nova foto") ||
        briefingLower.includes("fotos melhores") ||
        briefingLower.includes("foto melhor") ||
        briefingLower.includes("mudar foto") ||
        briefingLower.includes("mudar as fotos") ||
        briefingLower.includes("gerar foto") ||
        briefingLower.includes("gerar fotos") ||
        briefingLower.includes("outras fotos") ||
        briefingLower.includes("imagem nova") ||
        briefingLower.includes("imagens novas");

      const isRestructure =
        briefingLower.includes("reestruturar") ||
        briefingLower.includes("refazer") ||
        briefingLower.includes("novo site") ||
        briefingLower.includes("mudar tudo") ||
        briefingLower.includes("transformar") ||
        briefingLower.includes("redesenhar") ||
        briefingLower.includes("novo modelo") ||
        briefingLower.includes("outro modelo") ||
        briefingLower.includes("mudar modelo") ||
        briefingLower.includes("novo layout") ||
        briefingLower.includes("mudar layout") ||
        briefingLower.includes("layout");

      const shouldRegeneratePhotos = wantsPhotoChange || isRestructure;

      const detectedNicheKey = detectNicheKey(
        validatedProposal.strategy?.niche || data.currentContext?.niche,
        validatedProposal.pagePatch?.displayName || data.currentContext?.displayName,
      );
      const nicheGallery =
        NICHE_GALLERIES[detectedNicheKey] || NICHE_GALLERIES.geral || NICHE_GALLERIES.loja;

      if (validatedProposal.pagePatch) {
        let avatar = resolveFileUrl(validatedProposal.pagePatch.avatarUrl);
        let cover = resolveFileUrl(validatedProposal.pagePatch.coverUrl);

        if (shouldRegeneratePhotos || !cover) {
          try {
            const aiImg = await generateAiImage({
              niche: detectedNicheKey,
              companyName:
                validatedProposal.pagePatch.displayName ||
                data.currentContext?.displayName ||
                "Empresa",
              currentUsageCount: 0,
              type: "cover",
            });
            cover = aiImg.url;
          } catch (err) {
            console.warn(
              "[Copilot] Falha ao gerar imagem de capa por IA, usando fallback da galeria:",
              err,
            );
            if (nicheGallery?.covers && nicheGallery.covers.length > 0) {
              cover =
                nicheGallery.covers[Math.floor(Math.random() * nicheGallery.covers.length)].url;
            }
          }
        }

        validatedProposal.pagePatch.avatarUrl = avatar;
        validatedProposal.pagePatch.coverUrl = cover;
      }

      if (Array.isArray(validatedProposal.catalogItems)) {
        for (let i = 0; i < validatedProposal.catalogItems.length; i++) {
          const item = validatedProposal.catalogItems[i];
          let itemImg = resolveFileUrl(item.imageUrl);
          if (shouldRegeneratePhotos || !itemImg) {
            try {
              const aiImg = await generateAiImage({
                niche: detectedNicheKey,
                companyName:
                  validatedProposal.pagePatch?.displayName ||
                  data.currentContext?.displayName ||
                  "Empresa",
                currentUsageCount: 0,
                type: "product",
                itemName: item.name || `Item ${i + 1}`,
                details: item.description,
              });
              itemImg = aiImg.url;
            } catch (err) {
              console.warn(`[Copilot] Falha ao gerar imagem IA para o item ${item.name}:`, err);
              const covers = nicheGallery?.covers || [];
              if (covers.length > 0) {
                itemImg = covers[(i + 1) % covers.length]?.url || covers[0]?.url;
              }
            }
          }
          item.imageUrl = itemImg;
        }
      }

      if (Array.isArray(validatedProposal.sections)) {
        validatedProposal.sections = validatedProposal.sections.map((sec: any) => ({
          ...sec,
          media: Array.isArray(sec.media)
            ? sec.media.map((m: any) => ({
                ...m,
                url: resolveFileUrl(m.url) || m.url,
              }))
            : [],
        }));
      }

      if (Array.isArray(validatedProposal.mediaAssignments)) {
        validatedProposal.mediaAssignments = validatedProposal.mediaAssignments.map((a: any) => ({
          ...a,
          assignedUrl: resolveFileUrl(a.assignedUrl) || a.assignedUrl,
        }));
      }

      const adapted = adaptProposalToExistingStructures(
        validatedProposal,
        data.currentContext as any,
      );

      return {
        proposal: validatedProposal,
        adapted,
      };
    } catch (parseErr: any) {
      console.error("Erro ao validar Proposta Premium v2:", parseErr);
      throw new Error(
        `A IA gerou a proposta mas o esquema apresentou divergência: ${parseErr.message}`,
      );
    }
  });

const fetchUrlInputSchema = z.object({
  url: z.string().min(3, "URL inválida"),
});

export interface FetchedBusinessData {
  source: "google_maps" | "instagram" | "google_drive" | "generic";
  name?: string;
  niche?: string;
  city?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  formattedBriefing: string;
  importedImages?: Array<{
    name: string;
    mimeType: string;
    base64: string;
    publicUrl?: string;
    role?: "logo" | "cover" | "product" | "general";
  }>;
}

export async function resolveGoogleMapsTargetUrl(rawUrl: string): Promise<string> {
  let current = rawUrl.trim();
  if (
    current.includes("maps.app.goo.gl") ||
    current.includes("goo.gl/maps") ||
    current.includes("share.google")
  ) {
    try {
      const followRes = await fetch(current, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (followRes.url && followRes.url !== current) {
        current = followRes.url;
      }

      if (current.includes("consent.google.com") || current.includes("continue=")) {
        const match = current.match(/continue=([^&]+)/i);
        if (match && match[1]) {
          current = decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      console.warn("[resolveGoogleMapsTargetUrl] Aviso ao resolver link curto:", e);
    }
  }

  // Se o link redirecionou para uma busca do Google (comum em share.google e mobile search),
  // e temos o parâmetro 'q' (nome da empresa), transforma direto em URL de busca do Google Maps!
  if (
    (current.includes("google.com/search") || current.includes("google.com.br/search")) &&
    !current.includes("/maps")
  ) {
    const qMatch = current.match(/[?&]q=([^&]+)/i);
    if (qMatch && qMatch[1]) {
      const extractedQuery = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
      if (extractedQuery) {
        current = `https://www.google.com/maps/search/${encodeURIComponent(extractedQuery)}?hl=pt-BR`;
      }
    }
  }

  return current;
}

export async function extractGoogleMapsSearchUniversal(
  target: string,
  context?: any,
): Promise<FetchedBusinessData> {
  const supabaseAdmin = (context as any)?.supabase || getSupabaseServerClient();
  const userId = (context as any)?.userId || "maps-assets";

  let urlOrQuery = await resolveGoogleMapsTargetUrl(target);

  // 2. Extrai termo de busca do Maps ou detecta se já é URL de Place
  let searchQuery = "";
  const placeMatch = urlOrQuery.match(/\/maps\/place\/([^/@?&]+)/i);
  const qMatch = urlOrQuery.match(/[?&]q=([^&]+)/i);
  const searchMatch = urlOrQuery.match(/\/maps\/search\/([^/@?&]+)/i);

  if (placeMatch && placeMatch[1]) {
    searchQuery = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
  } else if (qMatch && qMatch[1]) {
    searchQuery = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
  } else if (searchMatch && searchMatch[1]) {
    searchQuery = decodeURIComponent(searchMatch[1]).replace(/\+/g, " ").trim();
  } else if (!urlOrQuery.startsWith("http://") && !urlOrQuery.startsWith("https://")) {
    searchQuery = urlOrQuery;
  }

  if (searchQuery.startsWith("@")) searchQuery = "";
  const queryToSearch = searchQuery || urlOrQuery;

  // Se já temos a URL completa de um Place específico, usamos ela diretamente no Jina Reader!
  let jinaUrl = "";
  if (
    urlOrQuery.includes("google.com/maps/place/") ||
    urlOrQuery.includes("google.com.br/maps/place/")
  ) {
    console.log(`[UniversalMaps] Acessando Place direto no Google Maps: "${urlOrQuery}"`);
    jinaUrl = `https://r.jina.ai/${urlOrQuery}`;
  } else {
    console.log(`[UniversalMaps] Buscando termo no Google Maps Search: "${queryToSearch}"`);
    const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryToSearch)}?hl=pt-BR`;
    jinaUrl = `https://r.jina.ai/${mapsSearchUrl}`;
  }

  let text = "";
  try {
    const res = await fetch(jinaUrl, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        "x-timeout": "25",
        "x-with-images-summary": "true",
        "x-with-links-summary": "true",
      },
      signal: AbortSignal.timeout(28000),
    });
    if (res.ok) {
      text = await res.text();
    }
  } catch (jinaErr) {
    console.warn(
      "[UniversalMaps] Falha ao consultar Jina Reader para Google Maps Search:",
      jinaErr,
    );
  }

  // 3. Extração dos Campos Estruturados sem depender de glifos especiais
  let name = "";
  const titleHeaderMatch = text.match(/Title:\s*([^-\n\r]+)(?: - Google Maps)?/i);
  if (titleHeaderMatch && titleHeaderMatch[1]) {
    const raw = titleHeaderMatch[1].trim();
    if (
      !raw.toLowerCase().includes("google maps") &&
      !raw.toLowerCase().includes("pesquisa google") &&
      !raw.toLowerCase().includes("resultados")
    ) {
      name = raw;
    }
  }

  if (!name) {
    const placeLinkMatch = text.match(
      /\[([^\n\r\]]+)\]\(https:\/\/www\.google\.com\/maps\/place\//,
    );
    if (placeLinkMatch && placeLinkMatch[1]) {
      name = placeLinkMatch[1].trim();
    }
  }

  if (!name) {
    const h1Match = text.match(/#\s*([^\n\r]+)/);
    if (h1Match) {
      const raw = h1Match[1].trim();
      if (
        !raw.toLowerCase().includes("google maps") &&
        !raw.toLowerCase().includes("pesquisa google") &&
        !raw.toLowerCase().includes("resultados")
      ) {
        name = raw;
      }
    }
  }
  if (!name && searchQuery) name = searchQuery;

  let rating: number | undefined;
  let reviewsCount: number | undefined;
  let niche: string | undefined;

  const ratingBlockMatch =
    text.match(/(\d[.,]\d)\s*\n+([^\n\r·]+)·/i) ||
    text.match(/(\d[.,]\d)\s*(?:estrelas|stars|★|⭐)/i) ||
    text.match(/\b([3-5][.,]\d)\b/);

  if (ratingBlockMatch) {
    rating = parseFloat(ratingBlockMatch[1].replace(",", "."));
    if (ratingBlockMatch[2]) {
      niche = ratingBlockMatch[2].replace(/[^\w\sÀ-ÿ]/g, "").trim();
    }
  }

  const reviewsMatch =
    text.match(/\(([0-9.,]+)\s*(?:avaliações|reviews|comentários)/i) ||
    text.match(/([0-9.,]+)\s+avaliações/i);
  if (reviewsMatch) {
    reviewsCount = parseInt(reviewsMatch[1].replace(/\D/g, ""), 10);
  }

  let address: string | undefined;
  const addrMatch =
    text.match(/\s*\n+([^\n\r]+)/) ||
    text.match(
      /(?:Endereço|Localização)?[:\s]*((?:Av\.|Rua|Alameda|Travessa|Praça|Estrada|Rodovia|Rod\.|Av\b|R\.)\s*[^,\n\r]+(?:,\s*[^,\n\r]+){1,4})/i,
    ) ||
    text.match(/([^\n\r,]+,\s*\d+[^,\n\r]*(?:,\s*[^\n\r]+)?\s*-\s*[A-Z]{2})/i);

  if (addrMatch) {
    address = (addrMatch[1] || addrMatch[0]).replace(/^(?:Endereço|Localização)[:\s]*/i, "").trim();
  }

  let phone: string | undefined;
  const telMatch =
    text.match(/tel:([+\d]+)/) ||
    text.match(/\s*\n+([+\d\s-]+)/) ||
    text.match(
      /(?:Telefone|Contato|Tel|WhatsApp|Ligar)?[:\s]*(\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9\s*)?(\d{4,5})[-\s]?(\d{4})/i,
    );

  if (telMatch) {
    phone = (telMatch[1] || telMatch[0])
      .replace(/^(?:Telefone|Contato|Tel|WhatsApp|Ligar)[:\s]*/i, "")
      .trim();
  }

  let description: string | undefined;
  const descMatch =
    text.match(/Compartilhar\s*\n+([^\n\r]+)/) || text.match(/Visão geral\s*\n+([^\n\r]+)/);
  if (descMatch) {
    const rawDesc = descMatch[1].trim();
    if (!rawDesc.startsWith("[") && rawDesc.length > 10) {
      description = rawDesc;
    }
  }

  // Extração e Otimização de Fotos Reais em Ultra Alta Resolução (1600x1200)
  const rawPhotos =
    text.match(
      /https?:\/\/[^\s\)\"']*(?:googleusercontent\.com|googleapis\.com\/v1\/thumbnail|ggpht\.com)[^\s\)\"']*/gi,
    ) || [];
  const blocked = [
    "/a/",
    "/a-/",
    "/al/",
    "default_user",
    "loader",
    "mapslogo",
    "tactile",
    "cleardot",
  ];
  const candidatePhotos: string[] = [];

  for (const p of rawPhotos) {
    if (blocked.some((b) => p.includes(b))) continue;
    let hd = p;
    if (p.includes("googleapis.com/v1/thumbnail")) {
      hd = p.replace(/&w=\d+&h=\d+/, "&w=1600&h=1200");
    } else if (p.includes("googleusercontent.com")) {
      hd = p.replace(/=w\d+.*$/, "=w1600-h1200-k-no");
      if (!hd.includes("=w1600")) hd += "=w1600-h1200-k-no";
    }
    if (!candidatePhotos.includes(hd)) candidatePhotos.push(hd);
  }

  // 4. Download & Persistência das Fotos com Redundância de Bucket
  const importedImages: NonNullable<FetchedBusinessData["importedImages"]> = [];
  const targetBucket = "bio_media";
  const fallbackBucket = "bio-media";

  for (let i = 0; i < Math.min(candidatePhotos.length, 6); i++) {
    const photoUrl = candidatePhotos[i];
    try {
      const imgRes = await fetch(photoUrl, { signal: AbortSignal.timeout(8000) });
      if (imgRes.ok) {
        const mime = imgRes.headers.get("content-type") || "image/jpeg";
        const buf = await imgRes.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        let publicUrl = photoUrl;

        if (supabaseAdmin) {
          try {
            const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
            const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

            let { error: upErr } = await supabaseAdmin.storage
              .from(targetBucket)
              .upload(storagePath, Buffer.from(buf), {
                contentType: mime,
                upsert: true,
              });

            let usedBucket = targetBucket;
            if (upErr) {
              const retry = await supabaseAdmin.storage
                .from(fallbackBucket)
                .upload(storagePath, Buffer.from(buf), {
                  contentType: mime,
                  upsert: true,
                });
              if (!retry.error) {
                upErr = null;
                usedBucket = fallbackBucket;
              }
            }

            if (!upErr) {
              const { data: pubData } = supabaseAdmin.storage
                .from(usedBucket)
                .getPublicUrl(storagePath);
              if (pubData?.publicUrl) {
                publicUrl = pubData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn("[UniversalMaps] Erro ao persistir foto no storage:", storageErr);
          }
        }

        importedImages.push({
          name: `maps-foto-${i + 1}.jpg`,
          mimeType: mime,
          base64: `data:${mime};base64,${b64}`,
          publicUrl,
          role: i === 0 ? "cover" : i < 3 ? "product" : "general",
        });
      }
    } catch (downErr) {
      console.warn(`[UniversalMaps] Aviso ao baixar foto ${i + 1}:`, downErr);
    }
  }

  // 5. Briefing Estruturado
  const finalName = name || searchQuery || "Empresa";
  const formattedBriefing = `[DADOS REAIS E CONFIRMADOS DO GOOGLE MAPS / GOOGLE MEU NEGÓCIO]:
- Nome Comercial Oficial: ${finalName}
${niche ? `- Nicho / Ramo de Atuação: ${niche}\n` : ""}${
    rating ? `- Avaliação dos Clientes: ${rating} estrelas no Google Maps ⭐\n` : ""
  }${phone ? `- Telefone / WhatsApp: ${phone}\n` : ""}${
    address ? `- Endereço Físico: ${address}\n` : ""
  }${description ? `- Descrição / Diferenciais: ${description}\n` : ""}${
    importedImages.length > 0
      ? `- Fotos Reais Obtidas: ${importedImages.length} fotos em alta resolução do estabelecimento.\n`
      : ""
  }
DIRETRIZ CRÍTICA PARA A IA:
Estes são os dados OFICIAIS e REAIS da empresa do cliente acima. Substitua integralmente qualquer informação de empresas anteriores ou perfis pessoais. Construa o site, textos de autoridade, serviços e prova social exclusivamente baseados nesta empresa.`;

  return {
    source: "google_maps",
    name: finalName,
    niche,
    address,
    city: address,
    phone,
    rating,
    formattedBriefing,
    importedImages,
  };
}

export async function internalFetchBusinessFromUrl(
  rawUrl: string,
  context?: any,
): Promise<FetchedBusinessData> {
  const supabaseAdmin = (context as any)?.supabase || getSupabaseServerClient();
  const userId = (context as any)?.userId || "drive-assets";

  let target = rawUrl.trim();
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    if (target.startsWith("@") || (!target.includes(".") && !target.includes("/"))) {
      target = `https://www.instagram.com/${target.replace(/^@/, "")}/`;
    } else {
      target = `https://${target}`;
    }
  }

  const isGoogleDrive = target.includes("drive.google.com") || target.includes("docs.google.com");

  const isInstagram = target.includes("instagram.com");
  let isGoogle =
    target.includes("google.com/maps") ||
    target.includes("google.com.br/maps") ||
    target.includes("maps.google.com") ||
    target.includes("maps.app.goo.gl") ||
    target.includes("goo.gl/maps") ||
    target.includes("share.google") ||
    target.includes("google.com/search") ||
    target.includes("google.com.br/search");

  // Expande links curtos do Google Maps para obter coordenadas e nome do local
  if (
    target.includes("maps.app.goo.gl") ||
    target.includes("goo.gl/maps") ||
    target.includes("share.google")
  ) {
    target = await resolveGoogleMapsTargetUrl(target);
    isGoogle = true;
  }

  // 1. TENTA O SCRAPER LOCAL GOSOM SE HOUVER BINÁRIO (ex: ambiente desktop)
  if (isGoogle) {
    try {
      const { runGosomScraper } = await import("./gosom.service");
      const gosomData = await runGosomScraper(target, {
        supabase: supabaseAdmin,
        userId,
      });
      if (gosomData && gosomData.name) {
        console.log(`[Copilot] Sucesso total com Gosom Scraper para: ${gosomData.name}`);
        return gosomData;
      }
    } catch (gosomErr) {
      console.warn(
        "[Copilot] Gosom Scraper indisponível, usando motor universal Google Maps Search:",
        gosomErr,
      );
    }

    // 2. MOTOR UNIVERSAL VIA GOOGLE MAPS SEARCH (Funciona 100% no Lovable, Cloud, Linux e Web)
    return await extractGoogleMapsSearchUniversal(target, {
      supabase: supabaseAdmin,
      userId,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);

  // TRATAMENTO EXCLUSIVO DE LINKS DO GOOGLE DRIVE
  if (isGoogleDrive) {
    const fileMatch = target.match(/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{20,})/i);
    const folderMatch = target.match(/(?:folders\/)([a-zA-Z0-9_-]{20,})/i);

    // Caso A: Arquivo Individual no Google Drive
    if (fileMatch) {
      const fileId = fileMatch[1];
      let buffer: ArrayBuffer | null = null;
      let mimeType = "image/jpeg";

      try {
        const lh3Res = await fetch(`https://lh3.googleusercontent.com/d/${fileId}`, {
          signal: controller.signal,
        });
        if (lh3Res.ok && (lh3Res.headers.get("content-type") || "").startsWith("image/")) {
          buffer = await lh3Res.arrayBuffer();
          mimeType = lh3Res.headers.get("content-type") || "image/jpeg";
        }
      } catch {
        // fallback
      }

      if (!buffer) {
        try {
          const dlRes = await fetch(
            `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
            {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            },
          );
          const cType = (dlRes.headers.get("content-type") || "").toLowerCase();
          if (dlRes.ok && !cType.includes("text/html")) {
            buffer = await dlRes.arrayBuffer();
            mimeType = cType;
          }
        } catch {
          // fallback
        }
      }

      if (!buffer) {
        clearTimeout(timeout);
        throw new Error(
          "O arquivo do Google Drive não pôde ser baixado. Verifique se o compartilhamento está configurado como 'Qualquer pessoa com o link' (leitor) no Google Drive.",
        );
      }

      clearTimeout(timeout);
      const base64Data = `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
      const ext = mimeType.includes("pdf") ? "pdf" : mimeType.includes("png") ? "png" : "jpg";

      let finalPublicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      if (supabaseAdmin) {
        try {
          const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabaseAdmin.storage
            .from("bio-media")
            .upload(storagePath, Buffer.from(buffer), {
              contentType: mimeType,
              upsert: true,
            });
          if (!upErr) {
            const { data: pubData } = supabaseAdmin.storage
              .from("bio-media")
              .getPublicUrl(storagePath);
            if (pubData?.publicUrl) {
              finalPublicUrl = pubData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn("Aviso ao persistir arquivo do drive no storage:", storageErr);
        }
      }

      return {
        source: "google_drive",
        name: `Foto Google Drive (${fileId.slice(0, 6)})`,
        formattedBriefing: `[ARQUIVO IMPORTADO DO GOOGLE DRIVE]: Arquivo de mídia obtido diretamente do Google Drive com alta definição para curadoria visual e alocação da IA.`,
        importedImages: [
          {
            name: `drive-arquivo-${fileId.slice(0, 8)}.${ext}`,
            mimeType,
            base64: base64Data,
            publicUrl: finalPublicUrl,
            role: "general",
          },
        ],
      };
    }

    // Caso B: Pasta Pública no Google Drive
    if (folderMatch) {
      const folderId = folderMatch[1];
      let driveFiles: Array<{ id: string; name: string; mimeType: string }> = [];

      // 1. Tenta API oficial se houver chave do Google
      // Extrai metadados da página pública quando o link aponta para uma pasta.
      if (driveFiles.length === 0) {
        try {
          const folderRes = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
            },
          });
          if (folderRes.ok) {
            const folderHtml = await folderRes.text();
            const uniqueIds = new Set<string>();

            const jsonBlobMatches = Array.from(
              folderHtml.matchAll(
                /\["([a-zA-Z0-9_-]{28,})","([^"]+\.(?:jpg|jpeg|png|webp|pdf))"/gi,
              ),
            );
            for (const match of jsonBlobMatches) {
              uniqueIds.add(match[1]);
              driveFiles.push({
                id: match[1],
                name: match[2],
                mimeType: match[2].endsWith(".pdf") ? "application/pdf" : "image/jpeg",
              });
            }

            const idMatches = Array.from(
              folderHtml.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{25,})/g),
            ).map((m) => m[1]);
            const dataIdMatches = Array.from(
              folderHtml.matchAll(/data-id="([a-zA-Z0-9_-]{25,})"/g),
            ).map((m) => m[1]);

            for (const id of [...idMatches, ...dataIdMatches]) {
              if (id !== folderId && !uniqueIds.has(id)) {
                uniqueIds.add(id);
                driveFiles.push({
                  id,
                  name: `drive-foto-${id.slice(0, 6)}.jpg`,
                  mimeType: "image/jpeg",
                });
              }
            }
          }
        } catch {
          // fallback
        }
      }

      // 3. Download das imagens em lote (limite seguro de até 12 fotos)
      const importedImages: Array<{
        name: string;
        mimeType: string;
        base64: string;
        publicUrl?: string;
        role?: "logo" | "cover" | "product" | "general";
      }> = [];

      for (const item of driveFiles.slice(0, 12)) {
        try {
          const imgRes = await fetch(`https://lh3.googleusercontent.com/d/${item.id}`, {
            signal: controller.signal,
          });
          if (imgRes.ok) {
            const mime = imgRes.headers.get("content-type") || item.mimeType || "image/jpeg";
            if (mime.startsWith("image/")) {
              const buf = await imgRes.arrayBuffer();
              let filePubUrl = `https://lh3.googleusercontent.com/d/${item.id}`;

              if (supabaseAdmin) {
                try {
                  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
                  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
                  const { error: upErr } = await supabaseAdmin.storage
                    .from("bio-media")
                    .upload(storagePath, Buffer.from(buf), {
                      contentType: mime,
                      upsert: true,
                    });
                  if (!upErr) {
                    const { data: pubData } = supabaseAdmin.storage
                      .from("bio-media")
                      .getPublicUrl(storagePath);
                    if (pubData?.publicUrl) {
                      filePubUrl = pubData.publicUrl;
                    }
                  }
                } catch (sErr) {
                  console.warn("Aviso ao persistir foto da pasta no storage:", sErr);
                }
              }

              importedImages.push({
                name: item.name || `drive-foto-${item.id.slice(0, 6)}.jpg`,
                mimeType: mime,
                base64: `data:${mime};base64,${Buffer.from(buf).toString("base64")}`,
                publicUrl: filePubUrl,
                role: "general",
              });
            }
          }
        } catch {
          // continua para o próximo
        }
      }

      clearTimeout(timeout);

      if (importedImages.length === 0) {
        throw new Error(
          "Não foi possível acessar as fotos desta pasta do Google Drive. Verifique se o compartilhamento da pasta está configurado como 'Qualquer pessoa com o link' (leitor) no Google Drive.",
        );
      }

      return {
        source: "google_drive",
        name: `Pasta Google Drive (${importedImages.length} fotos)`,
        formattedBriefing: `[PASTA DO GOOGLE DRIVE IMPORTADA]: ${importedImages.length} foto(s) de alta resolução importada(s) com sucesso diretamente para avaliação e curadoria da IA.`,
        importedImages,
      };
    }

    clearTimeout(timeout);
    throw new Error(
      "Link do Google Drive não reconhecido. Use o link de compartilhamento de um arquivo individual ou de uma pasta pública do Google Drive.",
    );
  }

  try {
    const jinaUrl = `https://r.jina.ai/${target}`;
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        // Headers otimizados para extrair mais dados do Google Maps via Jina Reader
        "Accept-Language": "pt-BR,pt;q=0.9",
        "x-locale": "pt-BR",
        "x-with-generated-alt": "true", // gera alt text para imagens
        "x-with-links-summary": "true", // inclui links que podem conter URLs de fotos
        "x-timeout": "25",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Serviço de leitura retornou status ${res.status}`);
    }

    const text = await res.text();

    if (isInstagram) {
      const handleMatch = target.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      const handle = handleMatch ? handleMatch[1] : "";

      let name = handle;
      const titleMatch = text.match(/Title:\s*([^\n\r]+)/i);
      if (titleMatch) {
        name = titleMatch[1]
          .replace(/\(@[a-zA-Z0-9._]+\).*/i, "")
          .replace(/•.*/, "")
          .replace(/Instagram.*/i, "")
          .trim();
      }

      const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      const briefing = `[DADOS COLETADOS DO PERFIL DO INSTAGRAM @${handle}]:\nNome Comercial: ${name || handle}\nInstagram: @${handle}\n${
        phone ? `WhatsApp/Telefone Encontrado: ${phone}\n` : ""
      }Informações do Perfil:\n${text.slice(0, 3000)}`;

      return {
        source: "instagram",
        name: name || handle,
        phone,
        formattedBriefing: briefing,
      };
    }

    if (isGoogle) {
      let name = "";
      // Prioridade 1: Extrai nome diretamente do path /maps/place/Nome+Do+Lugar/ da URL
      const placeMatch = target.match(/\/maps\/place\/([^/@?&]+)/i);
      if (placeMatch) {
        const extracted = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
        if (
          extracted &&
          !extracted.match(/^[@\d]/) &&
          !extracted.toLowerCase().includes("google")
        ) {
          name = extracted;
        }
      }
      // Prioridade 2: Se for URL com query ?q=Nome+Do+Lugar
      if (!name) {
        const qMatch = target.match(/[?&]q=([^&]+)/i);
        if (qMatch) {
          const extracted = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
          if (
            extracted &&
            !extracted.match(/^[@\d\-]/) &&
            !extracted.toLowerCase().includes("google")
          ) {
            name = extracted;
          }
        }
      }
      const titleMatch = text.match(/Title:\s*([^\n\r]+)/i);
      if (titleMatch) {
        const raw = titleMatch[1]
          .replace(/\s*-\s*Google Maps.*/i, "")
          .replace(/\s*-\s*Pesquisa Google.*/i, "")
          .trim();
        if (
          !raw.toLowerCase().includes("antes de ir para o google") &&
          !raw.toLowerCase().includes("google search") &&
          !raw.toLowerCase().includes("google maps") &&
          !raw.toLowerCase().includes("fazer login")
        ) {
          name = raw;
        }
      }

      // Extrai nome da URL expandida — varios formatos suportados (gratis, sem API)
      if (!name) {
        // Formato 1: /maps/place/Nome+do+Lugar/
        const placeMatch = target.match(/\/maps\/place\/([^/@?&]+)/i);
        if (placeMatch) {
          const extracted = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
          if (extracted && !extracted.match(/^[@\d]/)) name = extracted;
        }
      }
      if (!name) {
        // Formato 2: ?q=Nome+do+Lugar (links tipo maps.google.com?q=...)
        const qMatch = target.match(/[?&]q=([^&]+)/i);
        if (qMatch) {
          const extracted = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
          if (extracted && !extracted.match(/^[@\d\-]/)) name = extracted;
        }
      }

      let ratingMatch = text.match(/(\d[.,]\d)\s*★|\b(\d[.,]\d)\s*estrelas/i);
      let rating = ratingMatch
        ? parseFloat((ratingMatch[1] || ratingMatch[2]).replace(",", "."))
        : undefined;

      let reviewsCountMatch =
        text.match(/\(([\d.]+)\s*avaliações?\)/i) || text.match(/\(([\d.]+)\)/);
      let reviewsCount = reviewsCountMatch
        ? parseInt(reviewsCountMatch[1].replace(/\D/g, ""), 10)
        : undefined;

      let phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
      let phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      let addressMatch =
        text.match(/(?:Endereço|Address):\s*([^\n\r]+)/i) || text.match(/📍\s*([^\n\r]+)/);
      let address = addressMatch ? addressMatch[1].trim() : undefined;

      // EXTRAÇÃO AVANÇADA DE FOTOS REAIS DO GOOGLE MAPS
      const candidatePhotoUrls = new Set<string>();

      function addCandidatePhotos(rawBlob: string) {
        if (!rawBlob) return;
        // Captura URLs do Google (googleusercontent e lh3.google)
        const guUrls =
          rawBlob.match(
            /https?:\/\/[^\s\)\"']*(?:googleusercontent\.com|lh3\.google\.com)[^\s\)\"']*/gi,
          ) || [];
        for (const u of guUrls) {
          // Excluir fotos de perfil de usuario
          if (u.includes("/a/") || u.includes("/a-/") || u.includes("default-user")) continue;
          // Incluir padroes atuais de fotos de estabelecimentos (atualizado 2024-2026)
          if (
            u.includes("/AF1Qip") ||
            u.includes("/grass-cs/") ||
            u.includes("/grass-proxy/") ||
            u.includes("/gps-cs-s/") ||
            u.indexOf("/p/AF1Qip") !== -1 ||
            (u.includes("=w") && u.indexOf("@") === -1) ||
            (u.includes("=s") && u.includes("googleusercontent") && u.indexOf("/a/") === -1)
          ) {
            candidatePhotoUrls.add(u);
          }
        }
      }

      // 1. Extrai fotos da página do Maps capturada pelo Jina
      addCandidatePhotos(text);

      // 2. Estrategia de extracao GRATUITA: meta tags diretas + Nominatim OSM
      //    Sem custo, sem chave de API necessaria.
      //    O Google Maps serve og:title e og:description no HTML inicial (sem JS).
      if (!name || !address || !rating) {
        try {
          const directRes = await fetch(target, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
              "Accept-Language": "pt-BR,pt;q=0.9",
              Accept: "text/html,application/xhtml+xml",
            },
            signal: AbortSignal.timeout(8000),
            redirect: "follow",
          });

          if (directRes.ok) {
            const rawHtml = await directRes.text();

            // Extrai nome do link preview oficial do Maps se disponivel
            if (!name) {
              const previewMatch = rawHtml.match(/href="\/maps\/preview\/place\?[^"]*q=([^&"]+)/i);
              if (previewMatch) {
                const raw = decodeURIComponent(previewMatch[1]).replace(/\+/g, " ").trim();
                if (raw && !raw.toLowerCase().includes("google")) name = raw;
              }
            }

            // og:title geralmente contem: "Nome do Lugar - Google Maps"
            if (!name) {
              const ogTitleMatch =
                rawHtml.match(
                  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
                ) ||
                rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
              if (ogTitleMatch) {
                const raw = ogTitleMatch[1]
                  .replace(/\s*[-–—]\s*Google Maps.*/i, "")
                  .replace(/\s*[-–—]\s*Google.*/i, "")
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, "&")
                  .replace(/&quot;/g, '"')
                  .trim();
                if (
                  raw &&
                  raw.length > 2 &&
                  !raw.toLowerCase().includes("google") &&
                  !raw.toLowerCase().includes("login")
                ) {
                  name = raw;
                }
              }
            }

            // og:description geralmente contem: "4,7 ★ · Clinica odontologica · R. Exemplo, 123"
            if (!address || !rating) {
              const ogDescMatch =
                rawHtml.match(
                  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
                ) ||
                rawHtml.match(
                  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
                );
              if (ogDescMatch) {
                const desc = ogDescMatch[1].replace(/&#39;/g, "'").replace(/&amp;/g, "&");
                if (!rating) {
                  const rm = desc.match(/(\d[.,]\d)\s*(?:\*|estrelas?|[\u2605\u2B50])/i);
                  if (rm) rating = parseFloat(rm[1].replace(",", "."));
                }
                if (!address) {
                  const addrRegex = new RegExp(
                    "(?:[\u00B7\u2022|]|^)\\s*((?:R\\.|Rua|Av\\.|Avenida|Alameda|Trav\\.|Travessa|Est\\.|Estrada)[^\u00B7\u2022|\r\n]+)",
                    "i",
                  );
                  const addrM = desc.match(addrRegex);
                  if (addrM) address = addrM[1].trim();
                }
              }
            }

            // og:image: foto principal do estabelecimento direto do Google Maps (gratuito)
            const ogImageMatch =
              rawHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (ogImageMatch && ogImageMatch[1]) {
              const imgUrl = ogImageMatch[1].trim();
              if (
                imgUrl.startsWith("http") &&
                !imgUrl.includes("maps/vt/") &&
                !imgUrl.includes("default-user")
              ) {
                candidatePhotoUrls.add(imgUrl);
              }
            }

            // Também extrai quaisquer fotos presentes no HTML cru inicial
            addCandidatePhotos(rawHtml);

            // <title> como fallback
            if (!name) {
              const titleEl = rawHtml.match(/<title[^>]*>([\s\S]*?<\/title>)/i);
              if (titleEl) {
                const raw = titleEl[1]
                  .replace(/<\/title>/i, "")
                  .replace(/\s*[-–—]\s*Google Maps.*/i, "")
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, "&")
                  .trim();
                if (raw && raw.length > 2 && !raw.toLowerCase().includes("google")) {
                  name = raw;
                }
              }
            }
          }
        } catch (directErr) {
          console.warn("Aviso na busca direta de meta tags:", directErr);
        }
      }

      // Nominatim (OpenStreetMap) — gratuito, sem chave, para enriquecer endereco
      if (!address && name) {
        try {
          const nominatimQuery = encodeURIComponent(name + (address ? " " + address : ""));
          const nominatimRes = await fetch(
            "https://nominatim.openstreetmap.org/search?q=" +
              nominatimQuery +
              "&format=json&addressdetails=1&limit=1&accept-language=pt-BR",
            {
              headers: {
                "User-Agent":
                  "EIALink-Copiloto/1.0 (aplicacao de geracao de sites; contato: suporte@eialink.com.br)",
                "Accept-Language": "pt-BR,pt;q=0.9",
              },
              signal: AbortSignal.timeout(6000),
            },
          );
          if (nominatimRes.ok) {
            const nominatimData = await nominatimRes.json();
            const place = nominatimData[0];
            if (place?.display_name) {
              address = address || place.display_name;
            }
          }
        } catch (nomErr) {
          console.warn("Aviso no Nominatim:", nomErr);
        }
      }

      // 3. Processa e baixa até 8 fotos em alta definição com persistência
      const importedImages: Array<{
        name: string;
        mimeType: string;
        base64: string;
        publicUrl?: string;
        role?: "logo" | "cover" | "product" | "general";
      }> = [];

      const targetPhotos = Array.from(candidatePhotoUrls).slice(0, 8);

      for (let i = 0; i < targetPhotos.length; i++) {
        const rawPhotoUrl = targetPhotos[i];
        const variations: string[] = [];
        if (rawPhotoUrl.includes("googleusercontent.com")) {
          // =w1200-h800-k-no é o formato comprovado para gps-cs-s que entrega alta definição sem 400
          variations.push(rawPhotoUrl.replace(/=(?:w\d+-h\d+.*|s\d+.*|p-.*)$/, "=w1200-h800-k-no"));
          variations.push(rawPhotoUrl.replace(/=(?:w\d+-h\d+.*|s\d+.*|p-.*)$/, "=s1200"));
          variations.push(rawPhotoUrl);
        } else {
          variations.push(rawPhotoUrl);
        }

        let imgRes: Response | null = null;
        let successfulUrl = rawPhotoUrl;

        for (const vUrl of variations) {
          try {
            const res = await fetch(vUrl, { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
              const cType = res.headers.get("content-type") || "";
              if (cType.startsWith("image/")) {
                imgRes = res;
                successfulUrl = vUrl;
                break;
              }
            }
          } catch {
            // tenta próxima variação
          }
        }

        if (imgRes) {
          try {
            const mime = imgRes.headers.get("content-type") || "image/jpeg";
            const buf = await imgRes.arrayBuffer();
            let filePubUrl = successfulUrl;

            // Tenta persistir no Supabase Storage para garantir URL própria permanente
            if (supabaseAdmin) {
              try {
                const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
                const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
                const { error: upErr } = await supabaseAdmin.storage
                  .from("bio-media")
                  .upload(storagePath, Buffer.from(buf), {
                    contentType: mime,
                    upsert: true,
                  });
                if (!upErr) {
                  const { data: pubData } = supabaseAdmin.storage
                    .from("bio-media")
                    .getPublicUrl(storagePath);
                  if (pubData?.publicUrl) {
                    filePubUrl = pubData.publicUrl;
                  }
                }
              } catch (sErr) {
                console.warn("Aviso ao persistir foto do Maps no storage:", sErr);
              }
            }

            const role: "cover" | "product" | "general" =
              i === 0 ? "cover" : i < 3 ? "product" : "general";

            importedImages.push({
              name: `maps-foto-${i + 1}.jpg`,
              mimeType: mime,
              base64: `data:${mime};base64,${Buffer.from(buf).toString("base64")}`,
              publicUrl: filePubUrl,
              role,
            });
          } catch (downErr) {
            console.warn(`Aviso ao ler foto ${i + 1} do Google Maps:`, downErr);
          }
        }
      }

      // Detecta qualidade dos dados extraidos para avisar a IA
      const hasConfirmedName = !!(
        name &&
        name.length > 2 &&
        !name.toLowerCase().includes("google maps") &&
        !name.toLowerCase().includes("google search")
      );
      const dataFieldCount = [
        hasConfirmedName,
        !!phone,
        !!address,
        candidatePhotoUrls.size > 0,
      ].filter(Boolean).length;
      const missingWarning =
        dataFieldCount < 2
          ? "\n\nAVISO CRITICO PARA A IA: A extracao automatica retornou dados insuficientes (" +
            dataFieldCount +
            " campo(s) confirmado(s)). " +
            "Voce DEVE: registrar campos ausentes em missingInformation, NAO inventar nome/endereco/servicos/precos, " +
            "gerar apenas hero + whatsapp_cta, e solicitar ao usuario que preencha os dados manualmente."
          : "";

      const cleanSnippet = text
        .replace(/Antes de ir para o Google[\s\S]*?(?:Aceitar tudo|Concordo)/i, "")
        .replace(/Google LLC[\s\S]*/i, "")
        .slice(0, 3500)
        .trim();

      const briefing = `[DADOS REAIS DO GOOGLE MAPS / GOOGLE MEU NEGÓCIO]:
${name ? `- Nome Comercial Confirmado: ${name}\n` : ""}${rating ? `- Avaliação: ${rating} estrelas no Google Maps ⭐ (${reviewsCount ?? 0} avaliações)\n` : ""}${
        phone ? `- Telefone / WhatsApp: ${phone}\n` : ""
      }${address ? `- Endereço Físico: ${address}\n` : ""}${
        importedImages.length > 0
          ? `- Fotos Reais do Google Maps: ${importedImages.length} foto(s) em alta resolução capturada(s) para o site.\n`
          : ""
      }
Resumo de Avaliações e Informações Públicas:
${cleanSnippet || "Empresa indexada no Google Maps."}${missingWarning || ""}`;

      return {
        source: "google_maps",
        name: name || undefined,
        phone,
        address,
        rating,
        reviewsCount,
        formattedBriefing: briefing,
        importedImages,
      };
    }

    const titleMatch = text.match(/Title:\s*([^\n\r]+)/i);
    const name = titleMatch ? titleMatch[1].trim() : "Empresa";
    const briefing = `[DADOS EXTRAÍDOS DO LINK ${target}]:\nTítulo: ${name}\nConteúdo da Página:\n${text.slice(
      0,
      3000,
    )}`;

    return {
      source: "generic",
      name,
      formattedBriefing: briefing,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    throw new Error(
      `Não foi possível extrair dados automaticamente do link informado: ${err?.message || err}`,
    );
  }
}

export const fetchBusinessFromUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof fetchUrlInputSchema>) => fetchUrlInputSchema.parse(data))
  .handler(async ({ data, context }: any): Promise<FetchedBusinessData> => {
    return internalFetchBusinessFromUrl(data.url, context);
  });

export const chatCopilotEditInputSchema = z.object({
  currentBio: z.record(z.any()),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
  instruction: z.string().min(1),
  overrideApiKey: z.string().optional(),
  aiGatewayUrl: z.string().optional(),
});

export interface ChatCopilotEditResponse {
  assistantReply: string;
  patch: Record<string, any>;
  suggestions?: string[];
}

export const chatCopilotEditFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof chatCopilotEditInputSchema>) =>
    chatCopilotEditInputSchema.parse(data),
  )
  .handler(async ({ data, context }: any): Promise<ChatCopilotEditResponse> => {
    const currentBio = data.currentBio || {};
    const socialLinks = (currentBio.social_links as Record<string, any>) || {};

    const simplifiedState = {
      display_name: currentBio.display_name,
      description: currentBio.description,
      avatar_url: currentBio.avatar_url,
      cover_url: currentBio.cover_url,
      whatsapp: currentBio.whatsapp,
      whatsapp_message: currentBio.whatsapp_message || socialLinks.whatsapp_message,
      niche: currentBio.niche || socialLinks.niche,
      custom_theme: socialLinks.custom_theme || currentBio.custom_theme,
      differentials: socialLinks.differentials || [],
      about_section: socialLinks.about_section || null,
      suggested_services: socialLinks.suggested_services || [],
      video_embed: socialLinks.video_embed || null,
      links: (currentBio.links || []).map((l: any) => ({ title: l.title, url: l.url })),
    };

    // 1. EXTRAÇÃO INTELIGENTE DE LINKS ENVIADOS NO CHAT
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urlMatch = data.instruction.match(urlRegex);
    let extractedContextInfo = "";
    let extractedImages: Array<{ publicUrl: string; name?: string; role?: string }> = [];

    if (urlMatch && urlMatch.length > 0) {
      const foundUrl = urlMatch[0];
      try {
        console.log(`[chatCopilotEditFn] Link detectado na instrução: ${foundUrl}`);
        const extracted = await internalFetchBusinessFromUrl(foundUrl, context);
        if (extracted) {
          if (extracted.importedImages && extracted.importedImages.length > 0) {
            extractedImages = extracted.importedImages.map((img) => ({
              publicUrl: img.publicUrl,
              name: img.name,
              role: img.role,
            }));
          }
          extractedContextInfo = `
[DADOS REAIS EXTRAÍDOS DO LINK ENVIADO (${foundUrl})]:
- Nome do Estabelecimento: ${extracted.name || "Não identificado"}
- Nicho / Categoria: ${extracted.niche || "Comércio Local"}
- Cidade / Região: ${extracted.city || "Região local"}
- Endereço Completo: ${extracted.address || "Local não especificado"}
- Telefone / WhatsApp: ${extracted.phone || "Não informado"}
- Avaliação Google: ${extracted.rating ? `${extracted.rating} estrelas (${extracted.reviewsCount || 0} avaliações)` : "Sem avaliações"}
- Resumo / Descrição: ${extracted.description || extracted.formattedBriefing || ""}
- Fotos Reais Importadas em Alta Resolução (${extractedImages.length}): ${extractedImages.map((img) => img.publicUrl).join(", ")}
`;
        }
      } catch (scrapeErr) {
        console.warn("[chatCopilotEditFn] Aviso ao extrair dados do link enviado:", scrapeErr);
      }
    } else {
      // 2. DETECÇÃO DE PEDIDOS DE BUSCA DE EMPRESA/LOCAL SEM LINK EXPLÍCITO
      const isSearchIntent =
        /(?:puxa|busca|procure|pesquise|pega|procura|extrai|encontre)\s+(?:as\s+informaç|os\s+dados|fotos?|informações|sobre|da\s+empresa|do\s+restaurante|da\s+loja)/i.test(
          data.instruction,
        );
      if (isSearchIntent) {
        try {
          const queryClean = data.instruction
            .replace(
              /(?:puxa|busca|procure|pesquise|pega|procura|extrai|encontre)\s+(?:as\s+informaç[^\s]*|os\s+dados|fotos?|informações|sobre|da\s+empresa|do\s+restaurante|da\s+loja)?/gi,
              "",
            )
            .trim();
          if (queryClean.length >= 3) {
            console.log(`[chatCopilotEditFn] Intenção de busca detectada: "${queryClean}"`);
            const extracted = await extractGoogleMapsSearchUniversal(queryClean, context);
            if (extracted && extracted.name) {
              if (extracted.importedImages && extracted.importedImages.length > 0) {
                extractedImages = extracted.importedImages.map((img) => ({
                  publicUrl: img.publicUrl,
                  name: img.name,
                  role: img.role,
                }));
              }
              extractedContextInfo = `
[DADOS ENCONTRADOS NO GOOGLE MAPS PARA "${queryClean}"]:
- Nome do Estabelecimento: ${extracted.name}
- Nicho / Categoria: ${extracted.niche || "Comércio Local"}
- Endereço: ${extracted.address || ""}
- Telefone / WhatsApp: ${extracted.phone || ""}
- Avaliação: ${extracted.rating ? `${extracted.rating} estrelas` : ""}
- Fotos Reais Importadas (${extractedImages.length}): ${extractedImages.map((img) => img.publicUrl).join(", ")}
`;
            }
          }
        } catch (searchErr) {
          console.warn("[chatCopilotEditFn] Falha na busca automática:", searchErr);
        }
      }
    }

    const systemPrompt = `[COPILOTO CRIATIVO EIALINK - CHAT DE EDIÇÃO CIRÚRGICA AO VIVO]
Você é o Copiloto Criativo e Designer de Elite do EiaLink em uma conversa direta com o usuário.
O usuário está visualizando a página dele ao vivo enquanto conversa com você.

ESTADO ATUAL DA PÁGINA DO USUÁRIO:
${JSON.stringify(simplifiedState, null, 2)}

SUAS REGRAS DE OURO:
1. Responda em Português do Brasil com entusiasmo, simpatia e brevidade (1 a 3 frases amigáveis) em 'assistantReply'.
2. EDIÇÃO CIRÚRGICA (ZERO PERDA DE DADOS):
   - Altere RIGOROSAMENTE APENAS o que o usuário pediu para mudar ou os dados da empresa extraídos.
   - NUNCA reinicie o site e NUNCA apague dados que o usuário não mencionou.
   - Se o usuário pediu para mudar a cor, altere apenas 'custom_theme'.
   - Se o usuário pediu para mudar o texto/headline, altere apenas 'description'.
   - Se pediu para mudar o WhatsApp, altere apenas 'whatsapp' ou 'whatsapp_message'.
   - Se pediu para adicionar ou alterar um serviço, faça a alteração em 'suggested_services'.
3. COPYWRITING BRASILEIRO DE ALTA CONVERSÃO:
   - Se o usuário pedir para melhorar textos ou fornecer dados de empresa, use linguagem magnética, direta, humana e vendedora (Direct Response), sem jargões corporativos chatos.
4. RETORNE RIGOROSAMENTE E APENAS O SEGUINTE JSON VÁLIDO:
{
  "assistantReply": "Mensagem simpática explicando de forma clara o que você ajustou na página...",
  "patch": {
    // APENAS OS CAMPOS QUE MUDARAM. Exemplos:
    // "display_name": "Novo Nome",
    // "description": "Nova Headline Magnética",
    // "whatsapp": "5511999999999",
    // "whatsapp_message": "Nova mensagem de WhatsApp",
    // "avatar_url": "https://...",
    // "cover_url": "https://...",
    // "custom_theme": { "primary": "#f59e0b", "background": "#0b0c10", "mode": "dark" },
    // "suggested_services": [ ... ],
    // "differentials": [ ... ]
  },
  "suggestions": ["Sugestão rápida 1 para o usuário clicar", "Sugestão rápida 2"]
}`;

    const userPromptText = extractedContextInfo
      ? `INSTRUÇÃO ATUAL DO USUÁRIO: "${data.instruction}"\n\n${extractedContextInfo}\n\nIMPORTANTE: Foram obtidos dados reais e fotos da empresa. Atualize a página do usuário aplicando esses dados:
- Altere 'display_name' para o nome da empresa.
- Crie uma headline vendedora e atraente em 'description'.
- Se houver telefone/WhatsApp, atualize 'whatsapp' e crie uma mensagem de contato em 'whatsapp_message'.
- Se houver fotos reais importadas, defina a foto de logo em 'avatar_url' e a melhor foto de capa/ambiente em 'cover_url'. Se houver mais fotos, adicione ou atualize 'suggested_services' com essas fotos e nomes reais.
- Adicione 3 diferenciais competitivos em 'differentials'.
- No 'assistantReply', responda com entusiasmo e simpatia explicando detalhadamente que você puxou as informações e fotos reais do estabelecimento direto do Google e aplicou na página dele!`
      : `INSTRUÇÃO ATUAL DO USUÁRIO: "${data.instruction}"\n\nAplique a alteração necessária e responda com o JSON de patch.`;

    // Garante que o histórico começa com papel "user" e alterna corretamente (regra estrita da API Gemini)
    const historyList = (data.messages || []).filter(
      (m: any) => m.content && m.content.trim().length > 0,
    );
    const firstUserIdx = historyList.findIndex((m: any) => m.role === "user");
    const validHistory = firstUserIdx >= 0 ? historyList.slice(firstUserIdx) : [];

    const formattedHistory: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];
    for (const m of validHistory.slice(-6)) {
      const geminiRole = m.role === "assistant" ? "model" : "user";
      const last = formattedHistory[formattedHistory.length - 1];
      if (last && last.role === geminiRole) {
        last.parts[0].text += `\n${m.content}`;
      } else {
        formattedHistory.push({ role: geminiRole, parts: [{ text: m.content }] });
      }
    }

    const contents: any[] = [];
    if (formattedHistory.length > 0) {
      if (formattedHistory[formattedHistory.length - 1].role === "user") {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${userPromptText}`;
        contents.push(...formattedHistory);
      } else {
        contents.push(...formattedHistory, { role: "user", parts: [{ text: userPromptText }] });
      }
    } else {
      contents.push({ role: "user", parts: [{ text: userPromptText }] });
    }

    // Modelos oficiais ativos do Google Gemini
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

    let rawContent: string | null = null;
    const errorLogs: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        const response = await requestGemini(context.supabase, {
          action: "generateContent",
          model: modelName,
          apiKeyOverride: data.overrideApiKey || undefined,
          payload: {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 3000,
              responseMimeType: "application/json",
            },
          },
        });

        if (response.ok) {
          const resJson = await response.json();
          const candidate = resJson.candidates?.[0];
          const part = candidate?.content?.parts?.find((p: any) => p.text && !p.thought);
          if (part?.text) {
            rawContent = part.text.trim();
            break;
          }
        } else {
          const errText = await response.text();
          errorLogs.push(`[${modelName} HTTP ${response.status}]: ${errText.slice(0, 200)}`);
        }
      } catch (err: any) {
        errorLogs.push(`[${modelName} Falha]: ${err?.message || err}`);
      }
    }

    if (!rawContent) {
      throw new Error(
        `Não foi possível obter resposta do Assistente de IA: ${errorLogs.join(" | ")}`,
      );
    }

    try {
      const parsed = JSON.parse(rawContent);
      const patch = parsed.patch || {};

      // Fallback de segurança para garantir que as fotos importadas vão para o patch se a IA não tiver setado
      if (extractedImages.length > 0) {
        if (!patch.avatar_url && !currentBio.avatar_url) {
          patch.avatar_url = extractedImages[0].publicUrl;
        }
        if (!patch.cover_url && !currentBio.cover_url && extractedImages.length > 1) {
          patch.cover_url = extractedImages[1].publicUrl;
        }
      }

      return {
        assistantReply:
          parsed.assistantReply ||
          "Ajustei os detalhes da sua página conforme solicitado! Veja como ficou na prévia ao lado.",
        patch,
        suggestions: parsed.suggestions || [
          "Mudar paleta para tons dourados",
          "Tornar a headline mais vendedora",
          "Adicionar botão com WhatsApp",
        ],
      };
    } catch {
      return {
        assistantReply: "Fiz o ajuste solicitado! Veja a atualização ao lado.",
        patch: {},
        suggestions: [],
      };
    }
  });
