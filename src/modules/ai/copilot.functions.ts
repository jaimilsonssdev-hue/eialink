import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  PremiumBetaProposalSchema,
  type PremiumBetaProposal,
} from "./premiumProposal.schema";
import {
  adaptProposalToExistingStructures,
  type AdaptedProposalResult,
} from "./premiumProposal.adapter";

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
  .middleware([requireSupabaseAuth])
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
    const supabaseAdmin = (context as any)?.supabase;
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
   - 'testimonials': 2 a 3 depoimentos convincentes com notas 5 estrelas e feedbacks humanizados de clientes reais do nicho.

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
Nome Atual: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

${data.videoUrl ? `LINK DE VÍDEO INFORMADO: ${data.videoUrl}\n` : ""}
${
  fileDescriptions
    ? `ARQUIVOS MULTIMODAIS ANEXADOS (${preparedFiles.length} arquivo(s)):\n${fileDescriptions}\n`
    : ""
}
${data.briefing?.trim() ? `BRIEFING / INFORMAÇÕES ADICIONAIS:\n"""\n${data.briefing}\n"""\n` : ""}
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
        if (isRealImageUrl(candidate)) {
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<PremiumProposalResponse> => {
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
    const supabaseAdmin = (context as any)?.supabase;
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
     * 'testimonials': 2 a 3 depoimentos convincentes do nicho com nota 5 estrelas.
     * 'video': Se vídeo fornecido, configure esta seção.
     * 'contact_map': Endereço, telefone, WhatsApp e cidade.
     * 'whatsapp_cta': Chamada de fechamento irresistível para o WhatsApp.

5. FORMATO DA RESPOSTA:
   - Retorne EXCLUSIVAMENTE o objeto JSON válido estruturado de acordo com o Schema v2, sem nenhum texto antes ou depois.`;

    const userPrompt = `DADOS ATUAIS DO SITE:
Nome Atual: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

${data.videoUrl ? `LINK DE VÍDEO INFORMADO: ${data.videoUrl}\n` : ""}
${
  fileDescriptions
    ? `ARQUIVOS MULTIMODAIS ANEXADOS (${preparedFiles.length} arquivo(s)):\n${fileDescriptions}\n`
    : "Nenhum arquivo multimodal anexado.\n"
}
${data.briefing?.trim() ? `BRIEFING / INFORMAÇÕES DO CLIENTE:\n"""\n${data.briefing}\n"""\n` : ""}

Como Diretor de Arte e Arquiteto de Produto:
1. Registre os fatos confirmados em 'strategy.confirmedFacts'.
2. Aloue 100% dos arquivos fornecidos em 'mediaAssignments' e nas seções correspondentes.
3. Extraia o catálogo de serviços/produtos com preços reais em 'catalogItems'.
4. Monte a composição ordenada das seções usando apenas os blocos homologados.
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
        return candidate.trim();
      }

      if (parsedJson.pagePatch) {
        parsedJson.pagePatch.avatarUrl = resolveFileUrl(parsedJson.pagePatch.avatarUrl);
        parsedJson.pagePatch.coverUrl = resolveFileUrl(parsedJson.pagePatch.coverUrl);
      }

      if (Array.isArray(parsedJson.catalogItems)) {
        parsedJson.catalogItems = parsedJson.catalogItems.map((item: any) => ({
          ...item,
          imageUrl: resolveFileUrl(item.imageUrl),
        }));
      }

      if (Array.isArray(parsedJson.sections)) {
        parsedJson.sections = parsedJson.sections.map((sec: any) => ({
          ...sec,
          media: Array.isArray(sec.media)
            ? sec.media.map((m: any) => ({
                ...m,
                url: resolveFileUrl(m.url) || m.url,
              }))
            : [],
        }));
      }

      if (Array.isArray(parsedJson.mediaAssignments)) {
        parsedJson.mediaAssignments = parsedJson.mediaAssignments.map((a: any) => ({
          ...a,
          assignedUrl: resolveFileUrl(a.assignedUrl) || a.assignedUrl,
        }));
      }

      const validatedProposal = PremiumBetaProposalSchema.parse(parsedJson);

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

export const fetchBusinessFromUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof fetchUrlInputSchema>) => fetchUrlInputSchema.parse(data))
  .handler(async ({ data, context }: any): Promise<FetchedBusinessData> => {
    const supabaseAdmin = (context as any)?.supabase;
    const userId = (context as any)?.userId || "drive-assets";

    let target = data.url.trim();
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
      target.includes("maps.app.goo.gl") ||
      target.includes("goo.gl/maps");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // TRATAMENTO EXCLUSIVO DE LINKS DO GOOGLE DRIVE
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
          } catch {
            // fallback
          }
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
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "x-locale": "pt-BR",
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
        const titleMatch = text.match(/Title:\s*([^\n\r]+)/i);
        if (titleMatch) {
          const raw = titleMatch[1].replace(/\s*-\s*Google Maps.*/i, "").trim();
          if (
            !raw.toLowerCase().includes("antes de ir para o google") &&
            !raw.toLowerCase().includes("google search") &&
            !raw.toLowerCase().includes("google maps") &&
            !raw.toLowerCase().includes("fazer login")
          ) {
            name = raw;
          }
        }

        const ratingMatch = text.match(/(\d[.,]\d)\s*★|\b(\d[.,]\d)\s*estrelas/i);
        const rating = ratingMatch
          ? parseFloat((ratingMatch[1] || ratingMatch[2]).replace(",", "."))
          : undefined;

        const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

        const addressMatch = text.match(/(?:Endereço|Address):\s*([^\n\r]+)/i) ||
                             text.match(/📍\s*([^\n\r]+)/);
        const address = addressMatch ? addressMatch[1].trim() : undefined;

        const cleanSnippet = text
          .replace(/Antes de ir para o Google[\s\S]*?(?:Aceitar tudo|Concordo)/i, "")
          .replace(/Google LLC[\s\S]*/i, "")
          .slice(0, 3500)
          .trim();

        const briefing = `[DADOS REAIS DO GOOGLE MAPS / GOOGLE MEU NEGÓCIO]:
${name ? `- Nome Comercial Confirmado: ${name}\n` : ""}${rating ? `- Avaliação: ${rating} estrelas no Google Maps ⭐\n` : ""}${
          phone ? `- Telefone / WhatsApp: ${phone}\n` : ""
        }${address ? `- Endereço Físico: ${address}\n` : ""}
Resumo de Avaliações e Informações Públicas:
${cleanSnippet || "Empresa indexada no Google Maps."}`;

        return {
          source: "google_maps",
          name: name || undefined,
          phone,
          address,
          rating,
          formattedBriefing: briefing,
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
  });
