import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AiCopilotResult {
  display_name?: string;
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
  video_embed?: {
    enabled: boolean;
    url: string;
    title: string;
    caption?: string;
  };
}

const copilotFileInputSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  base64: z.string(),
  publicUrl: z.string().optional(),
  role: z.enum(["logo", "cover", "product", "general"]).optional(),
});

const copilotInputSchema = z
  .object({
    briefing: z.string().max(20000).optional().default(""),
    files: z.array(copilotFileInputSchema).optional().default([]),
    videoUrl: z.string().optional(),
    currentContext: z
      .object({
        displayName: z.string().optional(),
        niche: z.string().optional(),
        city: z.string().optional(),
        servicesCount: z.number().optional(),
      })
      .optional(),
    overrideApiKey: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.briefing && data.briefing.trim().length >= 3) ||
      (data.files && data.files.length > 0) ||
      (data.videoUrl && data.videoUrl.trim().length > 0),
    {
      message:
        "Forneça ao menos um briefing em texto, fotos/documentos anexos ou um link de vídeo.",
    }
  );

export const generateCopilotSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data }): Promise<AiCopilotResult> => {
    // RESOLUÇÃO SEGURA DA CHAVE NO SERVIDOR:
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY;

    const resolvedKey = (data.overrideApiKey || serverKey || "").trim();

    if (!resolvedKey) {
      throw new Error(
        "Chave da API do Google AI Studio não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente do servidor ou insira sua chave no campo do Copiloto."
      );
    }

    const systemPrompt = `[INSTRUÇÃO DE SISTEMA OBRIGATÓRIA - MODO CINEMATOGRÁFICO PREMIUM]
Você é o Diretor de Arte, Designer Front-End de Elite, Copywriter de Resposta Direta e Estrategista Comercial da plataforma EIA Link.
Sua missão é analisar o briefing, fotos, logotipos e eventuais cardápios/catálogos em PDF para gerar uma estrutura visual de Landing Page cinematográfica, minimalista e de altíssimo padrão visual e de conversão para o negócio do cliente.

REGRAS DE OURO DA GERAÇÃO (ESTÉTICA CINEMATOGRÁFICA DE LUXO):
1. PALETA ESTRITAMENTE DARK MODE PREMIUM:
   - 'custom_theme.mode': "dark" (SEMPRE Dark Mode cinematográfico para criar alto valor percebido e sofisticação).
   - 'custom_theme.background': "#030712" (Dark Zinc ultra profundo / Obsidian cinematográfico de fundo).
   - 'custom_theme.card_bg': "#0b0f19" (Dark Navy elegante para superfícies, cartões e Bento Grids).
   - 'custom_theme.primary': "#7c3aed" (Violet elétrico cinematográfico de alto impacto visual) por padrão. Caso o nicho exija uma identidade clássica (ex: verde médico #10b981 para saúde/odonto, âmbar dourado #f59e0b para gastronomia gourmet), você pode usar esse acento primário, mantendo estritamente o background "#030712" e card_bg "#0b0f19".
   - 'custom_theme.border_color': "#1e293b" (bordas finas semi-transparentes estilo glassmorphism border-white/10).
   - 'custom_theme.title': "#ffffff" (Branco puro, imponente, alto contraste e autoridade).
   - 'custom_theme.text': "#cbd5e1" (Cinza claro suave, legibilidade cristalina em telas AMOLED e IPS).
   - REGRA INEGOCIÁVEL: NUNCA gere fundo claro ou texto escuro. O visual deve ser imersivo, limpo e cinematográfico.

2. BENTO GRIDS & DIFERENCIAIS DE AUTORIDADE:
   - 'differentials': Gere rigorosamente 3 a 4 diferenciais imponentes e curtos organizados no formato Bento Grid.
   - Foque nos maiores ativos de confiança (ex: "Garantia Blindada", "Atendimento Sem Filas", "Tecnologia de Precisão").
   - Ícones válidos da biblioteca: "shield", "sparkles", "award", "check", "heart".

3. COPYWRITING PERSUASIVO & PERSUASÃO COMERCIAL:
   - 'description': Headline magnética de alta conversão (120 a 240 caracteres) com tracking-tight e senso de exclusividade, focada no resultado concreto do cliente. NUNCA use clichês ou placeholders como "Texto aqui".
   - 'whatsapp_message': Mensagem de abertura comercial persuasiva e natural, pronta para iniciar uma conversa de vendas sem fricção (ex: "Olá! Vi o atendimento exclusivo no site e gostaria de agendar uma consulta...").
   - 'testimonials': 2 a 3 depoimentos convincentes com notas 5 estrelas e feedbacks humanizados de clientes reais do nicho.

4. CATÁLOGO DE SERVIÇOS & CARROSSEL:
   - 'suggested_services': Liste os principais serviços ou pratos da empresa com nomes refinados, descrições atrativas e valores numéricos realistas (especialmente ao extrair de cardápios ou tabelas de preços em PDF).

5. DISTRIBUIÇÃO MULTIMODAL INTELIGENTE (FOTOS E RECORTE DE LOGOS):
   - Se houver fotos ou imagens anexadas (ou extraídas de PDF) com URLs públicas:
     * 'avatar_url': Atribua OBRIGATORIAMENTE a URL da imagem de Logotipo ('logo') ou melhor recorte.
     * 'cover_url': Atribua OBRIGATORIAMENTE a URL da foto de Capa/Banner ('cover') ou banner principal.
     * 'suggested_services[i].image_url': Se houver fotos específicas de pratos ou produtos ('product'), atribua diretamente ao respectivo item do catálogo!

6. VÍDEO INSTITUCIONAL:
   - Se o campo videoUrl foi preenchido ou mencionado, configure 'video_embed' com enabled=true, a url indicada, título magnético e legenda convidativa.

7. MÁXIMA ECONOMIA DE TOKENS E SAÍDA PURA:
   - Não gaste tokens com explicações, saudações ou código markdown extra.
   - Retorne RIGOROSAMENTE E APENAS O OBJETO JSON VÁLIDO obedecendo o schema, sem nenhum texto antes ou depois.`;

    const fileDescriptions = (data.files || [])
      .map((f, idx) => {
        let roleHint = "";
        if (f.role === "logo" || f.name.toLowerCase().includes("logo")) {
          roleHint = ` [IMPORTANTE: Logotipo da Empresa -> Atribua esta URL pública a 'avatar_url']`;
        } else if (f.role === "cover" || f.name.toLowerCase().includes("capa") || f.name.toLowerCase().includes("banner")) {
          roleHint = ` [IMPORTANTE: Banner/Capa Principal -> Atribua esta URL pública a 'cover_url']`;
        } else if (f.role === "product" || f.name.toLowerCase().includes("prato") || f.name.toLowerCase().includes("pagina")) {
          roleHint = ` [IMPORTANTE: Foto de Prato/Serviço -> Atribua esta URL ao respectivo item em 'suggested_services[i].image_url']`;
        }
        return `- Arquivo #${idx + 1}: "${f.name}" (${f.mimeType})${
          f.publicUrl ? ` [URL Pública: "${f.publicUrl}"]` : ""
        }${roleHint}`;
      })
      .join("\n");

    const userPrompt = `DADOS ATUAIS DO SITE:
Nome Atual: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

${data.videoUrl ? `LINK DE VÍDEO INFORMADO: ${data.videoUrl}\n` : ""}
${
  fileDescriptions
    ? `ARQUIVOS MULTIMODAIS ANEXADOS (${data.files?.length} arquivo(s)):\n${fileDescriptions}\n`
    : ""
}
${
  data.briefing?.trim()
    ? `BRIEFING / INFORMAÇÕES ADICIONAIS:\n"""\n${data.briefing}\n"""\n`
    : ""
}
Analise todos os dados e arquivos anexados. Aloque as fotos nos lugares certos ('avatar_url', 'cover_url', 'image_url' de serviços), extraia todos os itens e preços de eventuais PDFs e gere a estrutura JSON completa.`;

    // Monta o payload multimodal com as partes inline_data dos arquivos + prompt de texto
    const promptParts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [];

    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, "").trim();
        promptParts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    promptParts.push({ text: userPrompt });

    let lastError = "";
    let rawContent: string | null = null;

    // 1. Descoberta dinâmica dos modelos disponíveis para a chave informada
    let activeModels: string[] = [];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(resolvedKey)}`
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData.models)) {
          activeModels = listData.models
            .filter(
              (m: any) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes("generateContent")
            )
            .map((m: any) => (m.name || "").replace(/^models\//, ""))
            .filter((m: string) => !m.includes("2.5-flash-lite"));
        }
      } else {
        const errText = await listRes.text();
        try {
          const errObj = JSON.parse(errText);
          if (listRes.status === 400 || listRes.status === 403) {
            throw new Error(
              `Chave do Google AI Studio inválida ou sem permissão (${listRes.status}): ${errObj.error?.message || errText}`
            );
          }
        } catch (e: any) {
          if (e.message?.startsWith("Chave do Google")) throw e;
        }
      }
    } catch (e: any) {
      if (e.message?.startsWith("Chave do Google")) throw e;
      // segue para os candidatos recomendados se a listagem falhar por CORS/rede
    }

    const preferredPriority = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    const candidateModels = [
      ...preferredPriority.filter((m) => activeModels.includes(m)),
      ...activeModels.filter((m) => !preferredPriority.includes(m)),
    ];

    const finalModelsToTry =
      candidateModels.length > 0
        ? candidateModels
        : [
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
          ];

    // 2. Tenta a API generateContent nos modelos suportados
    for (const modelName of finalModelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            resolvedKey
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": resolvedKey,
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
          }
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
          lastError = `Modelo ${modelName} (${response.status}): ${parsedError}`;
          continue;
        }

        const payload = await response.json();
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          rawContent = text;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    // 3. Fallback: Interactions API recomendada pela Google para novas contas
    if (!rawContent) {
      const interactionModels = [
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];
      for (const modelName of interactionModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(
              resolvedKey
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": resolvedKey,
                "api-revision": "2026-05-20",
              },
              body: JSON.stringify({
                model: modelName,
                system_instruction: systemPrompt,
                input: userPrompt,
                response_mime_type: "application/json",
              }),
            }
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
            lastError = `Interactions API (${modelName} - ${response.status}): ${parsedErr}`;
            continue;
          }

          const payload = await response.json();
          let text = payload.output_text;
          if (!text && Array.isArray(payload.steps)) {
            for (let i = payload.steps.length - 1; i >= 0; i--) {
              const step = payload.steps[i];
              if (step?.content && Array.isArray(step.content)) {
                for (const part of step.content) {
                  if (part.type === "text" && part.text) {
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
          lastError = err?.message || String(err);
        }
      }
    }

    if (!rawContent) {
      throw new Error(
        `Não foi possível gerar com a API do Google AI Studio. Detalhe: ${lastError}. Certifique-se de que sua chave de API está ativa no console do Google AI Studio.`
      );
    }

    try {
      const cleanJson = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
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
            ? (bgLum < 80 ? parsed.custom_theme.background : "#030712")
            : "#030712",
          title: "#ffffff",
          text: isDark
            ? (calcLum(parsed.custom_theme.text) > 130 ? parsed.custom_theme.text : "#cbd5e1")
            : "#cbd5e1",
          card_bg: isDark ? (parsed.custom_theme.card_bg || "#0b0f19") : "#0b0f19",
          border_color: isDark ? (parsed.custom_theme.border_color || "#1e293b") : "#1e293b",
        };
      }

      return parsed;
    } catch {
      throw new Error("Não foi possível decodificar o JSON estruturado gerado pelo Gemini.");
    }
  });


const fetchUrlInputSchema = z.object({
  url: z.string().min(3, "URL inválida"),
});

export interface FetchedBusinessData {
  source: "google_maps" | "instagram" | "generic";
  name?: string;
  niche?: string;
  city?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  formattedBriefing: string;
}

export const fetchBusinessFromUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof fetchUrlInputSchema>) => fetchUrlInputSchema.parse(data))
  .handler(async ({ data }): Promise<FetchedBusinessData> => {
    let target = data.url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      if (target.startsWith("@") || (!target.includes(".") && !target.includes("/"))) {
        target = `https://www.instagram.com/${target.replace(/^@/, "")}/`;
      } else {
        target = `https://${target}`;
      }
    }

    const isInstagram = target.includes("instagram.com");
    const isGoogle =
      target.includes("google.com/maps") ||
      target.includes("maps.app.goo.gl") ||
      target.includes("goo.gl/maps");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

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
          name = titleMatch[1].replace(/\s*-\s*Google Maps.*/i, "").trim();
        }

        const ratingMatch = text.match(/(\d[.,]\d)\s*★|\b(\d[.,]\d)\s*estrelas/i);
        const rating = ratingMatch
          ? parseFloat((ratingMatch[1] || ratingMatch[2]).replace(",", "."))
          : undefined;

        const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

        const briefing = `[DADOS COLETADOS DO GOOGLE MEU NEGÓCIO / MAPS]:\nNome da Empresa: ${
          name || "Empresa Local"
        }\n${rating ? `Nota de Avaliação no Google: ${rating} estrelas ⭐\n` : ""}${
          phone ? `Telefone / WhatsApp Comercial: ${phone}\n` : ""
        }Dados e Comentários Públicos:\n${text.slice(0, 3500)}`;

        return {
          source: "google_maps",
          name: name || undefined,
          phone,
          rating,
          formattedBriefing: briefing,
        };
      }

      const titleMatch = text.match(/Title:\s*([^\n\r]+)/i);
      const name = titleMatch ? titleMatch[1].trim() : "Empresa";
      const briefing = `[DADOS EXTRAÍDOS DO LINK ${target}]:\nTítulo: ${name}\nConteúdo da Página:\n${text.slice(
        0,
        3000
      )}`;

      return {
        source: "generic",
        name,
        formattedBriefing: briefing,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(
        `Não foi possível extrair dados automaticamente do link informado: ${
          err?.message || err
        }`
      );
    }
  });

