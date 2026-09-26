import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  PremiumBetaProposalSchema,
  type PremiumBetaProposal,
} from "./premiumProposal.schema";
import {
  adaptProposalToExistingStructures,
  type AdaptedProposalResult,
} from "./premiumProposal.adapter";

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
  custom_theme?: {
    primary: string;
    background: string;
    text: string;
    title?: string;
    card_bg: string;
    border_color: string;
    mode: "dark" | "light";
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
  mimeType: z.preprocess((val) => (val ? String(val).trim() : "image/jpeg"), z.string().default("image/jpeg")),
  base64: z.string(),
  publicUrl: nullableString,
  role: z.preprocess((val) => {
    if (!val || typeof val !== "string") return undefined;
    const clean = val.trim().toLowerCase();
    if (["logo", "cover", "product", "general"].includes(clean)) return clean;
    return undefined;
  }, z.enum(["logo", "cover", "product", "general"]).optional()),
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
    files: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(copilotFileInputSchema).default([])),
    videoUrl: nullableString,
    currentContext: copilotContextSchema,
    overrideApiKey: nullableString,
    aiGatewayUrl: nullableString,
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
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<AiCopilotResult> => {
    // RESOLUÇÃO SEGURA DA CHAVE NO SERVIDOR:
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY;

    const resolvedKey = (data.overrideApiKey || serverKey || "").trim();

    if (!resolvedKey) {
      throw new Error(
        "Chave da API do Google AI Studio não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente do servidor ou insira sua chave no campo do Copiloto.",
      );
    }

    function isRealImageUrl(url?: string | null): boolean {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        if (trimmed.includes("example.com") || trimmed.includes("via.placeholder.com")) return false;
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
              const { data: pubData } = supabaseAdmin.storage
                .from("bio-media")
                .getPublicUrl(path);
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
            if ((extracted.city || extracted.address) && data.currentContext) {
              data.currentContext.city = extracted.city || extracted.address;
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

REGRAS DE OURO DA GERAÇÃO (ESTÉTICA CINEMATOGRÁFICA DE LUXO & EXTRAÇÃO PRECISA):
1. IDENTIFICAÇÃO E EXTRAÇÃO INTELIGENTE DA COR DA MARCA:
   - 'custom_theme.primary': IDENTIFICAÇÃO OBRIGATÓRIA DA COR DA MARCA. Analise minuciosamente o logotipo anexado e/ou as fotos do estabelecimento/uniforme/ambiente. Identifique a cor primária predominante da marca em formato HEX (ex: azul royal #1d4ed8, verde esmeralda #059669, bordô/vermelho #dc2626, dourado/âmbar #d97706, roxo elétrico #7c3aed, etc.). Se não houver logo com cor identificável, use a cor mais nobre que represente o nicho do negócio. Esta cor primária ditará botões de ação (CTAs), brilhos (glows), estrelas e badges do site.
   - 'custom_theme.mode': "dark" (SEMPRE Dark Mode cinematográfico para criar alto valor percebido e sofisticação).
   - 'custom_theme.background': "#030712" (Dark Zinc ultra profundo / Obsidian cinematográfico de fundo).
   - 'custom_theme.card_bg': "#0b0f19" (Dark Navy elegante para superfícies, cartões e Bento Grids).
   - 'custom_theme.border_color': "#1e293b" (bordas finas semi-transparentes estilo glassmorphism border-white/10).
   - 'custom_theme.title': "#ffffff" (Branco puro, imponente, alto contraste e autoridade).
   - 'custom_theme.text': "#cbd5e1" (Cinza claro suave, legibilidade cristalina em telas AMOLED e IPS).
   - REGRA INEGOCIÁVEL: NUNCA gere fundo claro ou texto escuro. O visual deve ser imersivo, limpo e cinematográfico.

2. DADOS REAIS DO NEGÓCIO (SUBSTITUIÇÃO TOTAL DOS PLACEHOLDERS DO MODELO BASE):
   - 'display_name': O nome comercial REAL da empresa extraído do logotipo, briefing, URL ou documentos (ex: "Dr. João Silva", "Hamburgueria do Chefe", "Studio Bella"). NUNCA mantenha nomes genéricos como "Policlínica RMed" ou "Empresa Local".
   - 'niche': O nicho exato do negócio (ex: "clinica", "odontologia", "restaurante", "hamburgueria", "advocacia", "beleza", "salao", "fitness", "petshop", etc.).
   - 'city': A cidade ou região real onde a empresa atua (ex: "São Paulo - SP", "Belo Horizonte", "Curitiba").
   - 'address': O endereço real se identificado no briefing/documento/mapa.
   - 'description': Headline magnética de alta conversão (120 a 240 caracteres) adaptada ao negócio real.
   - 'whatsapp_message': Mensagem personalizada de abertura no WhatsApp direcionada ao nome e serviço do negócio.

3. EDIÇÃO SOB DEMANDA (PEDIDOS ESPECÍFICOS DO USUÁRIO):
   - Se o usuário forneceu pedidos ou instruções no briefing (ex: "mude apenas as cores", "altere o texto para X", "adicione o prato Y"), OBEDEÇA fielmente ao pedido solicitado, preservando a harmonia do restante do site.

4. BENTO GRIDS & DIFERENCIAIS DE AUTORIDADE:
   - 'differentials': Gere rigorosamente 3 a 4 diferenciais imponentes e curtos organizados no formato Bento Grid.
   - Foque nos maiores ativos de confiança (ex: "Garantia Blindada", "Atendimento Sem Filas", "Tecnologia de Precisão").
   - Ícones válidos da biblioteca: "shield", "sparkles", "award", "check", "heart".

5. COPYWRITING PERSUASIVO & PERSUASÃO COMERCIAL:
   - 'description': Headline magnética de alta conversão (120 a 240 caracteres) com tracking-tight e senso de exclusividade, focada no resultado concreto do cliente. NUNCA use clichês ou placeholders como "Texto aqui".
   - 'whatsapp_message': Mensagem de abertura comercial persuasiva e natural, pronta para iniciar uma conversa de vendas sem fricção (ex: "Olá! Vi o atendimento exclusivo no site e gostaria de agendar uma consulta...").
   - 'testimonials': PROIBIDO gerar depoimentos ficticios. Se o briefing contiver depoimentos reais, use-os exatamente. Caso contrario, OMITA esta secao e registre como pendencia.

6. CATÁLOGO DE SERVIÇOS & CARROSSEL:
   - 'suggested_services': Liste os principais serviços ou pratos da empresa com nomes refinados, descrições atrativas e valores numéricos realistas (especialmente ao extrair de cardápios, PDFs ou briefing).

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
    const _hasContext = data.currentContext?.displayName && data.currentContext.displayName !== "Empresa Local";
    if (!_hasBriefing && !_hasFiles && !_hasContext) {
      throw new Error(
        "Dados insuficientes para gerar o site. Forneca ao menos: nome do negocio, descricao, " +
        "ou fotos do estabelecimento. Dica: cole o link do Google Maps ou Instagram do negocio."
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

    const defaultEndpoint = "https://generativelanguage.googleapis.com";
    const customGateway = (
      data.aiGatewayUrl ||
      process.env.AI_GATEWAY_URL ||
      process.env.CLOUDFLARE_AI_GATEWAY ||
      process.env.CF_AI_GATEWAY ||
      ""
    )
      .trim()
      .replace(/\/+$/, "");

    // Se houver um AI Gateway (Cloudflare AI Gateway) configurado, usa-o; caso contrário, usa o endpoint oficial do Google
    const apiBase = customGateway || defaultEndpoint;

    // Modelos Google Gemini de alta performance em ordem estrita de velocidade, compatibilidade e suporte ativo:
    // gemini-3.5-flash é o modelo padrão recomendado pelo Google AI Studio
    const finalModelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ];

    const errorLogs: string[] = [];

    // 1. Tenta a API generateContent nos modelos suportados
    for (const modelName of finalModelsToTry) {
      try {
        const response = await fetch(
          `${apiBase}/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            resolvedKey,
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": resolvedKey,
              ...(customGateway
                ? {
                    "cf-aig-metadata": JSON.stringify({
                      app: "eialink",
                      service: "copilot-generate",
                      model: modelName,
                    }),
                  }
                : {}),
            },
            body: JSON.stringify({
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
            }),
          },
        );

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
          const textParts = parts.filter(
            (p: any) => typeof p.text === "string" && p.text.trim(),
          );
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
      const interactionModels = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
      ];
      for (const modelName of interactionModels) {
        try {
          const response = await fetch(
            `${apiBase}/v1beta/interactions?key=${encodeURIComponent(
              resolvedKey,
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": resolvedKey,
                "api-revision": "2026-05-20",
                ...(customGateway
                  ? {
                      "cf-aig-metadata": JSON.stringify({
                        app: "eialink",
                        service: "copilot-interactions",
                        model: modelName,
                      }),
                    }
                  : {}),
              },
              body: JSON.stringify({
                model: modelName,
                system_instruction: systemPrompt,
                input: userPrompt,
                response_mime_type: "application/json",
              }),
            },
          );

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
      const detailMsg = errorLogs.length > 0 ? errorLogs.join(" | ") : (lastError || "Nenhum modelo respondeu com sucesso");
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
          mode: "dark",
          background: isDark
            ? bgLum < 80
              ? parsed.custom_theme.background
              : "#030712"
            : "#030712",
          title: "#ffffff",
          text: isDark
            ? calcLum(parsed.custom_theme.text) > 130
              ? parsed.custom_theme.text
              : "#cbd5e1"
            : "#cbd5e1",
          card_bg: isDark ? parsed.custom_theme.card_bg || "#0b0f19" : "#0b0f19",
          border_color: isDark ? parsed.custom_theme.border_color || "#1e293b" : "#1e293b",
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
          return fn === cleanCandidate || cleanCandidate.includes(fn) || fn.includes(cleanCandidate);
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

        // 4. URL externa real e válida
        // Bloqueia fotos externas inventadas pela IA: aceita apenas se for data: ou blob:
        if (candidate.startsWith("data:image/") || candidate.startsWith("blob:")) {
          return candidate.trim();
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
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY;

    const resolvedKey = (data.overrideApiKey || serverKey || "").trim();

    if (!resolvedKey) {
      throw new Error(
        "Chave da API do Google AI Studio não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente do servidor ou insira sua chave no campo do Copiloto.",
      );
    }

    function isRealImageUrl(url?: string | null): boolean {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        if (trimmed.includes("example.com") || trimmed.includes("via.placeholder.com")) return false;
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
              const { data: pubData } = supabaseAdmin.storage
                .from("bio-media")
                .getPublicUrl(path);
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
            if ((extracted.city || extracted.address) && data.currentContext) {
              data.currentContext.city = extracted.city || extracted.address;
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

3. DIREÇÃO DE ARTE CINEMATOGRÁFICA DE LUXO (WCAG DARK MODE):
   - 'theme.mode': "dark" (SEMPRE Dark Mode cinematográfico para criar alto valor percebido e autoridade).
   - 'theme.background': "#030712" (Dark Zinc / Obsidian profundo).
   - 'theme.card_bg': "#0b0f19" (Dark Navy elegante para superfícies e cartões Bento Grid).
   - 'theme.border_color': "#1e293b" (bordas finas com transparência sutil).
   - 'theme.title': "#ffffff" (Branco puro, alta autoridade e contraste).
   - 'theme.text': "#cbd5e1" (Cinza claro suave e altamente legível).
   - 'theme.primary': IDENTIFIQUE a cor de maior destaque da marca a partir do logotipo ou fotos em formato HEX (ex: azul royal, verde esmeralda, dourado, vinho, etc.).
   - 'theme.radius': "16px".

4. COMPOSIÇÃO DE BLOCOS HOMOLOGADOS DO SISTEMA:
   - Organize uma sequência lógica de alta conversão usando os tipos de blocos suportados:
     * 'hero': Título imponente, subtítulo magnético, CTA para WhatsApp e imagem de capa.
     * 'differentials': 3 a 4 pilares em Bento Grid (ícones válidos: "shield", "sparkles", "award", "check", "heart").
     * 'catalog_carousel': Carrossel de serviços/produtos em destaque com nome, descrição, preço e foto.
     * 'about': História do negócio, propósito e 3 a 4 destaques com checkmarks.
     * 'testimonials': PROIBIDO. Use enabled:false se nao houver depoimentos reais no briefing. Nunca fabrique nomes de clientes, notas ou textos.
     * 'video': Se vídeo fornecido, configure esta seção.
     * 'contact_map': Endereço, telefone, WhatsApp e cidade.
     * 'whatsapp_cta': Chamada de fechamento irresistível para o WhatsApp.

5. FORMATO DA RESPOSTA:
   - Retorne EXCLUSIVAMENTE o objeto JSON válido estruturado de acordo com o Schema v2 (use camelCase exatamente como no exemplo abaixo), sem nenhum texto antes ou depois:

{
  "schemaVersion": 2,
  "generator": "premium-beta",
  "status": "proposal",
  "strategy": {
    "businessType": "...",
    "niche": "...",
    "city": "...",
    "audience": "...",
    "primaryGoal": "whatsapp",
    "primaryCta": "Falar no WhatsApp",
    "tone": "Profissional e sofisticado",
    "confirmedFacts": ["Fato confirmado 1"],
    "missingInformation": ["Informação faltante"]
  },
  "creativeDirection": {
    "id": "cinematic-noir",
    "name": "Cinematográfico Premium",
    "referenceIds": [],
    "visualPrinciples": ["Tipografia imponente", "Contraste escuro profundo", "Foco visual nas fotos"],
    "motionIntensity": "subtle"
  },
  "theme": {
    "paletteId": null,
    "primary": "#10b981",
    "background": "#030712",
    "card_bg": "#0b0f19",
    "border_color": "#1e293b",
    "title": "#ffffff",
    "text": "#cbd5e1",
    "mode": "dark",
    "radius": "16px",
    "density": "comfortable"
  },
  "pagePatch": {
    "displayName": "Nome da Empresa",
    "description": "Descrição magnética da empresa",
    "whatsapp": "55...",
    "whatsappMessage": "Olá! Gostaria de mais informações.",
    "whatsappButtonLabel": "Chamar no WhatsApp",
    "avatarUrl": "URL_DO_LOGO_SE_HOUVER",
    "coverUrl": "URL_DA_CAPA_SE_HOUVER",
    "seo": {
      "metaTitle": "Nome da Empresa | Especialidade",
      "metaDescription": "Descrição SEO otimizada"
    }
  },
  "links": [],
  "catalogItems": [
    {
      "name": "Nome do Produto ou Serviço",
      "description": "Descrição detalhada e atraente",
      "price": 59.9,
      "imageUrl": "URL_DA_FOTO_DO_PRODUTO",
      "category": "Destaques",
      "buttonLabel": "Pedir no WhatsApp"
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
      "title": "Título Imponente do Hero",
      "subtitle": "Subtítulo convincente e focado na proposta de valor",
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
      "title": "Por que nos escolher",
      "content": {
        "items": [
          { "title": "Diferencial 1", "description": "Explicação do diferencial", "icon": "shield" },
          { "title": "Diferencial 2", "description": "Explicação do diferencial", "icon": "sparkles" },
          { "title": "Diferencial 3", "description": "Explicação do diferencial", "icon": "award" }
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
      "title": "Nossos Destaques",
      "subtitle": "Conheça nossas opções preparadas com máxima dedicação",
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
      "title": "Nossa História & Propósito",
      "subtitle": "Compromisso com excelência",
      "content": {
        "story": "Texto contando sobre a dedicação, tradição ou qualidade do negócio.",
        "highlights": ["Atendimento de excelência", "Ingredientes / materiais selecionados", "Experiência comprovada"]
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

REGRA ABSOLUTA DE IDENTIDADE DO CLIENTE: O site deve ser gerado 100% para o CLIENTE/EMPRESA informado no briefing e nos links (${data.currentContext?.displayName || "Empresa"}). NUNCA misture ou utilize o nicho, produtos ou nome de sites anteriores do usuário. Este é um novo cliente.

REGRA DE HONESTIDADE E CONVERSÃO COMERCIAL: Use os dados reais da empresa confirmados (nome, localização, telefone). Se não houver cardápio ou lista de preços exatos informados no briefing, sugira em 'catalogItems' os principais serviços ou pratos típicos e consagrados para este nicho com valores de mercado plausíveis ou "A consultar", garantindo uma estrutura de alto padrão pronta para entrega e conversão. Não gere depoimentos fictícios (deixe testimonials vazio ou desabilitado caso não haja depoimentos reais no briefing).

Como Diretor de Arte e Arquiteto de Produto:
1. Registre os fatos confirmados em 'strategy.confirmedFacts'.
2. Aloue 100% dos arquivos fornecidos em 'mediaAssignments' e nas seções correspondentes.
3. Estruture o catálogo de serviços/produtos em 'catalogItems'.
4. Monte a composição ordenada das seções usando os blocos homologados com visual cinematográfico.
5. Retorne a resposta em JSON válido do Schema v2.`;

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

    const defaultEndpoint = "https://generativelanguage.googleapis.com";
    const customGateway = (
      data.aiGatewayUrl ||
      process.env.AI_GATEWAY_URL ||
      process.env.CLOUDFLARE_AI_GATEWAY ||
      process.env.CF_AI_GATEWAY ||
      ""
    )
      .trim()
      .replace(/\/+$/, "");

    const apiBase = customGateway || defaultEndpoint;

    const finalModelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ];

    let rawContent: string | null = null;
    let lastError = "";
    const errorLogs: string[] = [];

    for (const modelName of finalModelsToTry) {
      try {
        const response = await fetch(
          `${apiBase}/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            resolvedKey,
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": resolvedKey,
              ...(customGateway
                ? {
                    "cf-aig-metadata": JSON.stringify({
                      app: "eialink",
                      service: "copilot-premium-proposal",
                      model: modelName,
                    }),
                  }
                : {}),
            },
            body: JSON.stringify({
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
                temperature: 0.5,
              },
            }),
          },
        );

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
          const textParts = parts.filter(
            (p: any) => typeof p.text === "string" && p.text.trim(),
          );
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

    if (!rawContent) {
      const detailMsg = errorLogs.length > 0 ? errorLogs.join(" | ") : (lastError || "Nenhum modelo respondeu com sucesso");
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
        // Bloqueia fotos externas inventadas: aceita apenas data: ou blob:
        if (candidate.startsWith("data:image/") || candidate.startsWith("blob:")) {
          return candidate.trim();
        }
        return null;
      }

      const validatedProposal = PremiumBetaProposalSchema.parse(parsedJson);

      if (validatedProposal.pagePatch) {
        validatedProposal.pagePatch.avatarUrl = resolveFileUrl(validatedProposal.pagePatch.avatarUrl);
        validatedProposal.pagePatch.coverUrl = resolveFileUrl(validatedProposal.pagePatch.coverUrl);
      }

      if (Array.isArray(validatedProposal.catalogItems)) {
        validatedProposal.catalogItems = validatedProposal.catalogItems.map((item: any) => ({
          ...item,
          imageUrl: resolveFileUrl(item.imageUrl),
        }));
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
      throw new Error(`A IA gerou a proposta mas o esquema apresentou divergência: ${parseErr.message}`);
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

async function expandGoogleMapsUrl(shortUrl: string): Promise<string> {
  // 1. Tenta redirecionamento manual para inspecionar o header Location diretamente
  try {
    const res = await fetch(shortUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    const loc = res.headers.get("location");
    if (loc) {
      if (loc.includes("consent.google.com")) {
        try {
          const continueParam = new URL(loc).searchParams.get("continue");
          if (continueParam) return decodeURIComponent(continueParam);
        } catch {}
      }
      return loc;
    }
  } catch {}

  // 2. Tenta redirecionamento follow com cookie de consentimento
  try {
    const resFollow = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Cookie: "SOCS=CAESHAgBEhJnd3NfMjAyNDA2MTAtMF9SQzIaAmVuIAEaBgiA_L20Bg;",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (resFollow.url && resFollow.url !== shortUrl) {
      if (resFollow.url.includes("consent.google.com")) {
        try {
          const continueParam = new URL(resFollow.url).searchParams.get("continue");
          if (continueParam) return decodeURIComponent(continueParam);
        } catch {}
      }
      return resFollow.url;
    }
  } catch {}

  return shortUrl;
}

async function reverseGeocodeCoords(lat: number, lon: number): Promise<{
  city?: string;
  address?: string;
  fullAddress?: string;
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "EIALink-Copilot/1.0 (gerador de sites; suporte@eialink.com.br)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.municipality ||
        data.address?.village ||
        data.address?.suburb;
      const state = data.address?.state;
      const road = data.address?.road;
      const shortAddr = [road, city, state].filter(Boolean).join(", ");
      return {
        fullAddress: data.display_name,
        city: city ? (state ? `${city} - ${state}` : city) : undefined,
        address: shortAddr || data.display_name,
      };
    }
  } catch {}
  return null;
}

async function extractGoogleMapsBusiness(
  inputUrl: string,
  context?: any,
): Promise<FetchedBusinessData> {
  const supabaseAdmin = (context as any)?.supabase || getSupabaseServerClient();
  const userId = (context as any)?.userId || "maps-assets";

  let target = inputUrl.trim();
  if (target.includes("maps.app.goo.gl") || target.includes("goo.gl/maps")) {
    target = await expandGoogleMapsUrl(target);
  }

  let name = "";
  let address = "";
  let city = "";
  let rating: number | undefined;
  let reviewsCount: number | undefined;
  let phone: string | undefined;
  let coords: { lat: number; lon: number } | null = null;
  const candidatePhotoUrls = new Set<string>();

  // 1. Extração de coordenadas na URL
  const coordMatch =
    target.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    target.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
  if (coordMatch) {
    coords = { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) };
  }

  // 2. Extração do Nome e Endereço direto da URL (Taxa de acerto imediata de 100%):
  // Padrão A: ?q=Nome+Do+Lugar,Endereco...
  const qMatch = target.match(/[?&]q=([^&]+)/i);
  if (qMatch) {
    const rawQ = decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim();
    const parts = rawQ.split(/,\s*/);
    if (
      parts.length > 0 &&
      parts[0] &&
      !parts[0].startsWith("@") &&
      !parts[0].toLowerCase().includes("google")
    ) {
      name = parts[0];
      if (parts.length > 1) {
        address = parts.slice(1).join(", ");
      }
    }
  }

  // Padrão B: /maps/place/Nome+Do+Lugar/
  if (!name) {
    const placeMatch = target.match(/\/maps\/place\/([^/@?&]+)/i);
    if (placeMatch) {
      const extracted = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ").trim();
      if (
        extracted &&
        !extracted.startsWith("@") &&
        !extracted.toLowerCase().includes("google")
      ) {
        name = extracted;
      }
    }
  }

  // 3. Busca HTML direto do Google Maps para metadados adicionais, fotos e fallback
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Cookie: "SOCS=CAESHAgBEhJnd3NfMjAyNDA2MTAtMF9SQzIaAmVuIAEaBgiA_L20Bg;",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const html = await res.text();

      // Nome via preview link oficial
      if (!name) {
        const previewMatch = html.match(/\/maps\/preview\/place\?[^"]*q=([^&"]+)/i);
        if (previewMatch) {
          const raw = decodeURIComponent(previewMatch[1]).replace(/\+/g, " ").trim();
          if (raw && !raw.toLowerCase().includes("google")) name = raw;
        }
      }

      // Nome via dump interno do Google
      if (!name) {
        const dumpMatch =
          html.match(/\[null,null,\[null,"([^"]+)"\]\]/) ||
          html.match(/\[null,"([^"]+)",\[\[\d+/);
        if (dumpMatch && dumpMatch[1]) {
          const raw = dumpMatch[1].replace(/\\u[\dA-F]{4}/gi, (m) =>
            String.fromCharCode(parseInt(m.replace(/\\u/g, ""), 16)),
          );
          if (raw && !raw.toLowerCase().includes("google")) name = raw;
        }
      }

      // Coordenadas via HTML caso não estivessem na URL
      if (!coords) {
        const cMatch =
          html.match(/\[null,\[2,(-?\d+\.\d+),(-?\d+\.\d+)/) ||
          html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
        if (cMatch) {
          coords = {
            lat: parseFloat(cMatch[2] || cMatch[1]),
            lon: parseFloat(cMatch[1] || cMatch[2]),
          };
        }
      }

      // Avaliação ⭐ e avaliações
      const rm =
        html.match(/\["(\d[.,]\d)",\s*(\d+)/) ||
        html.match(/(\d[.,]\d)\s*★|\b(\d[.,]\d)\s*estrelas/i);
      if (rm) {
        rating = parseFloat(rm[1].replace(",", "."));
        if (rm[2]) reviewsCount = parseInt(rm[2].replace(/\D/g, ""), 10);
      }

      // Telefone
      const pm = html.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
      if (pm) phone = pm[0].trim();

      // Captura fotos de estabelecimentos presentes no HTML (googleusercontent)
      const guUrls =
        html.match(
          /https?:\/\/[^\s\)\"']*(?:googleusercontent\.com|lh3\.google\.com)[^\s\)\"']*/gi,
        ) || [];
      for (const u of guUrls) {
        if (u.includes("/a/") || u.includes("/a-/") || u.includes("default-user")) continue;
        if (
          u.includes("/AF1Qip") ||
          u.includes("/grass-cs/") ||
          u.includes("/grass-proxy/") ||
          u.includes("/gps-cs-s/") ||
          u.includes("/p/AF1Qip") ||
          (u.includes("=w") && !u.includes("@")) ||
          (u.includes("=s") && u.includes("googleusercontent") && !u.includes("/a/"))
        ) {
          candidatePhotoUrls.add(u);
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao buscar HTML direto do Google Maps:", err);
  }

  // 4. Se tiver coordenadas, busca endereço e cidade refinados via OpenStreetMap
  if (coords) {
    const geo = await reverseGeocodeCoords(coords.lat, coords.lon);
    if (geo) {
      if (!address || address.length < 5) address = geo.address || geo.fullAddress || "";
      if (!city) city = geo.city || "";
    }
  }

  // 5. Se o nome tiver sufixos como " - Google Maps", limpa
  if (name) {
    name = name
      .replace(/\s*[-–—]\s*(?:Google Maps|Google|Avaliações|Reviews).*/i, "")
      .trim();
  }

  // 6. Processa até 6 fotos capturadas do estabelecimento (se houver)
  const importedImages: Array<{
    name: string;
    mimeType: string;
    base64: string;
    publicUrl?: string;
    role?: "logo" | "cover" | "product" | "general";
  }> = [];

  const targetPhotos = Array.from(candidatePhotoUrls).slice(0, 6);
  for (let i = 0; i < targetPhotos.length; i++) {
    const rawPhotoUrl = targetPhotos[i];
    const variations: string[] = [];
    if (rawPhotoUrl.includes("googleusercontent.com")) {
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
        const res = await fetch(vUrl, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const cType = res.headers.get("content-type") || "";
          if (cType.startsWith("image/")) {
            imgRes = res;
            successfulUrl = vUrl;
            break;
          }
        }
      } catch {}
    }

    if (imgRes) {
      try {
        const mime = imgRes.headers.get("content-type") || "image/jpeg";
        const buf = await imgRes.arrayBuffer();
        let filePubUrl = successfulUrl;

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

  const finalName = name || "Empresa Local";
  const briefing = `[DADOS REAIS CONFIRMADOS DO GOOGLE MAPS]:
- Nome Comercial do Cliente: ${finalName}
${city ? `- Cidade / Região de Atuação: ${city}\n` : ""}${address ? `- Endereço Físico: ${address}\n` : ""}${
    phone ? `- WhatsApp / Telefone: ${phone}\n` : ""
  }${rating ? `- Avaliação: ${rating} estrelas ⭐ (${reviewsCount ?? 0} avaliações)\n` : ""}${
    importedImages.length > 0
      ? `- Fotos Reais do Estabelecimento: ${importedImages.length} foto(s) anexada(s).\n`
      : ""
  }
ATENÇÃO PARA A IA: Esta é a empresa real do cliente (${finalName}). Gere o site completo, sofisticado e profissional exclusivamente para esta empresa, criando serviços de alta conversão alinhados ao seu nicho e localização.`;

  return {
    source: "google_maps",
    name: name || undefined,
    city: city || undefined,
    address: address || undefined,
    phone,
    rating,
    reviewsCount,
    formattedBriefing: briefing,
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
  const isGoogle =
    target.includes("google.com/maps") ||
    target.includes("google.com.br/maps") ||
    target.includes("maps.google.com") ||
    target.includes("maps.app.goo.gl") ||
    target.includes("goo.gl/maps") ||
    target.includes("google.com/search") ||
    target.includes("google.com.br/search");

  // ROTA 1: GOOGLE MAPS - Extrator dedicado, ultrarrápido, 100% gratuito e livre de falhas
  if (isGoogle) {
    return extractGoogleMapsBusiness(target, context);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);

  // ROTA 2: GOOGLE DRIVE (Arquivos e Pastas)
  if (isGoogleDrive) {
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY;

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
      } catch {}

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
        } catch {}
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
      if (serverKey) {
        try {
          const apiUrl = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents+and+trashed%3Dfalse&fields=files(id%2Cname%2CmimeType)&pageSize=25&key=${encodeURIComponent(serverKey)}`;
          const apiRes = await fetch(apiUrl, { signal: controller.signal });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData.files)) {
              driveFiles = apiData.files.filter(
                (f: any) =>
                  (f.mimeType || "").startsWith("image/") || (f.mimeType || "").includes("pdf"),
              );
            }
          }
        } catch {}
      }

      // 2. Extração via página pública caso a API não esteja ativa
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
        } catch {}
      }

      // 3. Download das imagens em lote
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
        } catch {}
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

  // INSTAGRAM: leitura pública do perfil (sem login). Se falhar, cai no leitor genérico abaixo.
  if (isInstagram) {
    const handle = (target.match(/instagram\.com\/([a-zA-Z0-9._]+)/i)?.[1] ?? "").replace(/\/$/, "");
    if (handle && !["p", "reel", "reels", "stories", "explore"].includes(handle.toLowerCase())) {
      try {
        const igRes = await fetch(
          `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
          {
            headers: {
              "x-ig-app-id": "936619743392459",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(10000),
          },
        );
        const igJson: any = igRes.ok ? await igRes.json().catch(() => null) : null;
        const u = igJson?.data?.user;
        if (u) {
          const bio: string = u.biography ?? "";
          const name: string = (u.full_name || handle).trim();
          const phoneFromBio = bio.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\s?\d{4}[-\s]?\d{4}/)?.[0];
          const phone: string | undefined =
            (u.business_contact_method !== "UNKNOWN" && u.business_phone_number) ||
            phoneFromBio?.trim() ||
            undefined;
          let city: string | undefined;
          try {
            city = u.business_address_json ? JSON.parse(u.business_address_json)?.city_name : undefined;
          } catch {
            city = undefined;
          }
          const followers = u.edge_followed_by?.count;
          const posts: any[] = u.edge_owner_to_timeline_media?.edges ?? [];
          const captions = posts
            .map((e) => e?.node?.edge_media_to_caption?.edges?.[0]?.node?.text)
            .filter(Boolean)
            .slice(0, 6)
            .map((t: string) => `- ${t.slice(0, 220).replace(/\s+/g, " ")}`)
            .join("\n");

          // Baixa foto de perfil (logo) e fotos recentes. Cada falha é individual.
          const photoUrls: Array<{ url: string; role: "logo" | "cover" | "general" }> = [];
          if (u.profile_pic_url_hd || u.profile_pic_url)
            photoUrls.push({ url: u.profile_pic_url_hd || u.profile_pic_url, role: "logo" });
          posts
            .map((e) => e?.node)
            .filter((n) => n?.display_url)
            .slice(0, 8)
            .forEach((n, i) => photoUrls.push({ url: n.display_url, role: i === 0 ? "cover" : "general" }));

          const downloaded = await Promise.all(
            photoUrls.map(async (p, i) => {
              try {
                const r = await fetch(p.url, { signal: AbortSignal.timeout(8000) });
                const type = r.headers.get("content-type") || "image/jpeg";
                if (!r.ok || !type.startsWith("image/")) return null;
                const buf = await r.arrayBuffer();
                if (buf.byteLength > 4 * 1024 * 1024) return null;
                return {
                  name: `instagram-${handle}-${i}.jpg`,
                  mimeType: type,
                  base64: Buffer.from(buf).toString("base64"),
                  role: p.role,
                };
              } catch {
                return null;
              }
            }),
          );
          const importedImages = downloaded.filter((x): x is NonNullable<typeof x> => Boolean(x));

          clearTimeout(timeout);
          const briefing = [
            `[DADOS COLETADOS DO PERFIL DO INSTAGRAM @${handle}]:`,
            `Nome Comercial: ${name}`,
            `Instagram: @${handle}`,
            u.category_name ? `Categoria: ${u.category_name}` : "",
            city ? `Cidade: ${city}` : "",
            phone ? `WhatsApp/Telefone Encontrado: ${phone}` : "",
            u.business_email ? `E-mail: ${u.business_email}` : "",
            u.external_url ? `Site/Link: ${u.external_url}` : "",
            typeof followers === "number" ? `Seguidores: ${followers}` : "",
            bio ? `Bio original:\n${bio}` : "",
            captions ? `Legendas recentes (use para entender serviços/produtos, não invente fatos):\n${captions}` : "",
            `Fotos importadas: ${importedImages.length}`,
          ]
            .filter(Boolean)
            .join("\n");

          return {
            source: "instagram",
            name,
            niche: u.category_name || undefined,
            city,
            phone,
            formattedBriefing: briefing,
            importedImages,
          };
        }
      } catch (igErr) {
        console.warn("Leitura pública do Instagram falhou, usando leitor genérico:", igErr);
      }
    }
  }

  // DEMAIS LINKS WEB VIA JINA READER OU FETCH DIRETO
  try {

    const jinaUrl = `https://r.jina.ai/${target}`;
    let text = "";

    try {
      const res = await fetch(jinaUrl, {
        signal: controller.signal,
        headers: {
          "Accept-Language": "pt-BR,pt;q=0.9",
          "x-locale": "pt-BR",
          "x-timeout": "15",
        },
      });
      if (res.ok) {
        text = await res.text();
      }
    } catch {}

    // Fallback para fetch direto de HTML se o Jina falhar
    if (!text) {
      try {
        const directRes = await fetch(target, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9",
          },
        });
        if (directRes.ok) {
          text = await directRes.text();
        }
      } catch {}
    }

    clearTimeout(timeout);

    if (isInstagram) {
      const handleMatch = target.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      const handle = handleMatch ? handleMatch[1] : "";

      let name = handle;
      const titleMatch = text.match(/Title:\s*([^\n\r]+)/i) || text.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        name = titleMatch[1]
          .replace(/\(@[a-zA-Z0-9._]+\).*/i, "")
          .replace(/•.*/, "")
          .replace(/Instagram.*/i, "")
          .trim();
      }

      const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      const briefing = `[DADOS COLETADOS DO PERFIL DO INSTAGRAM @${handle}]:
- Nome Comercial do Cliente: ${name || handle}
- Instagram: @${handle}
${phone ? `- WhatsApp / Telefone Encontrado: ${phone}\n` : ""}${text ? `Informações do Perfil:\n${text.slice(0, 2500)}` : ""}`;

      return {
        source: "instagram",
        name: name || handle,
        phone,
        formattedBriefing: briefing,
      };
    }

    const titleMatch = text.match(/Title:\s*([^\n\r]+)/i) || text.match(/<title>([^<]+)<\/title>/i);
    const name = titleMatch ? titleMatch[1].trim() : "Empresa";
    const briefing = `[DADOS EXTRAÍDOS DO LINK ${target}]:
- Título da Página: ${name}
- Conteúdo Identificado:
${text.slice(0, 3000)}`;

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
  .inputValidator((data: z.infer<typeof fetchUrlInputSchema>) => fetchUrlInputSchema.parse(data))
  .handler(async ({ data, context }: any): Promise<FetchedBusinessData> => {
    return internalFetchBusinessFromUrl(data.url, context);
  });
