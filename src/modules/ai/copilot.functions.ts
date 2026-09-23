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
   - 'suggested_services': Liste os principais serviços ou pratos da empresa com nomes refinados, descrições atrativas e valores numéricos realistas (especialmente ao extrair de cardápios, PDFs ou briefing).

5. CURADORIA VISUAL DE FOTOS E DIRETOR DE ARTE (AVALIAÇÃO DE AUTORIDADE, QUALIDADE E POSICIONAMENTO):
   - Para CADA arquivo de imagem anexado ou importado (Google Drive, PDF, Upload):
     * Avalie com critério de Diretor de Arte:
       - 'scores.authority' (0 a 100): Presença e postura profissional, olhar focado na câmera, ambiente de alto valor (consultório, estúdio, escritório executivo, bancada impecável) vs. fotos amadoras/selfies caseiras.
       - 'scores.quality' (0 a 100): Resolução, nitidez, iluminação equilibrada e ausência de ruídos ou pixelização excessiva do WhatsApp.
       - 'scores.positioning' (0 a 100): Aderência ao nicho (gastronomia apetitosa, medicina empática e higiênica, advocacia nobre).
       - 'role': Classifique o papel ideal: 'logo' (símbolo/vetor de marca), 'cover' (foto com maior autoridade e impacto para a Capa Hero), 'product' (fotos de procedimentos, pratos ou produtos para o Carrossel), ou 'discard' (foto de baixa resolução, ilegível ou amadora que rebaixa o valor percebido).
       - 'critique': Frase concisa explicando o motivo da escolha (ex: "Excelente nitidez e autoridade no consultório médico, ideal para a Capa principal.").
     * Preencha a lista 'curated_photos' contendo { url, name, role, scores: { authority, quality, positioning }, critique }.
   - Alocação automática e obrigatória no site:
     * 'avatar_url': Atribua OBRIGATORIAMENTE a melhor imagem com papel 'logo'.
     * 'cover_url': Atribua OBRIGATORIAMENTE a foto com maior score combinado de Autoridade e Qualidade (papel 'cover').
     * 'suggested_services[i].image_url': Atribua as fotos com papel 'product' aos serviços/pratos correspondentes (Carrossel).

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
Analise todos os dados e arquivos anexados. Como Diretor de Arte, avalie o score de cada foto (Autoridade, Qualidade e Posicionamento) em 'curated_photos', aloque as fotos vencedoras nos lugares certos ('avatar_url', 'cover_url', 'image_url' de serviços), extraia todos os itens e preços de eventuais PDFs e gere a estrutura JSON completa.`;

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
  .handler(async ({ data }): Promise<FetchedBusinessData> => {
    let target = data.url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      if (target.startsWith("@") || (!target.includes(".") && !target.includes("/"))) {
        target = `https://www.instagram.com/${target.replace(/^@/, "")}/`;
      } else {
        target = `https://${target}`;
      }
    }

    const isGoogleDrive =
      target.includes("drive.google.com") ||
      target.includes("docs.google.com");

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
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              }
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
            "O arquivo do Google Drive não pôde ser baixado. Verifique se o compartilhamento está configurado como 'Qualquer pessoa com o link' (leitor) no Google Drive."
          );
        }

        clearTimeout(timeout);
        const base64Data = `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
        const ext = mimeType.includes("pdf") ? "pdf" : mimeType.includes("png") ? "png" : "jpg";

        return {
          source: "google_drive",
          name: `Foto Google Drive (${fileId.slice(0, 6)})`,
          formattedBriefing: `[ARQUIVO IMPORTADO DO GOOGLE DRIVE]: Arquivo de mídia obtido diretamente do Google Drive com alta definição para curadoria visual e alocação da IA.`,
          importedImages: [
            {
              name: `drive-arquivo-${fileId.slice(0, 8)}.${ext}`,
              mimeType,
              base64: base64Data,
              publicUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
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
                driveFiles = apiData.files.filter((f: any) =>
                  (f.mimeType || "").startsWith("image/") || (f.mimeType || "").includes("pdf")
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
                folderHtml.matchAll(/\["([a-zA-Z0-9_-]{28,})","([^"]+\.(?:jpg|jpeg|png|webp|pdf))"/gi)
              );
              for (const match of jsonBlobMatches) {
                uniqueIds.add(match[1]);
                driveFiles.push({
                  id: match[1],
                  name: match[2],
                  mimeType: match[2].endsWith(".pdf") ? "application/pdf" : "image/jpeg",
                });
              }

              const idMatches = Array.from(folderHtml.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{25,})/g)).map(
                (m) => m[1]
              );
              const dataIdMatches = Array.from(folderHtml.matchAll(/data-id="([a-zA-Z0-9_-]{25,})"/g)).map(
                (m) => m[1]
              );

              for (const id of [...idMatches, ...dataIdMatches]) {
                if (id !== folderId && !uniqueIds.has(id)) {
                  uniqueIds.add(id);
                  driveFiles.push({ id, name: `drive-foto-${id.slice(0, 6)}.jpg`, mimeType: "image/jpeg" });
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
                importedImages.push({
                  name: item.name || `drive-foto-${item.id.slice(0, 6)}.jpg`,
                  mimeType: mime,
                  base64: `data:${mime};base64,${Buffer.from(buf).toString("base64")}`,
                  publicUrl: `https://lh3.googleusercontent.com/d/${item.id}`,
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
            "Não foi possível acessar as fotos desta pasta do Google Drive. Verifique se o compartilhamento da pasta está configurado como 'Qualquer pessoa com o link' (leitor) no Google Drive."
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
        "Link do Google Drive não reconhecido. Use o link de compartilhamento de um arquivo individual ou de uma pasta pública do Google Drive."
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

