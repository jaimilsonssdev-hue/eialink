import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    const systemPrompt = `Você é o Diretor de Arte, Especialista em UX, Copywriter e Estrategista Comercial da plataforma "Máquina de Sites".
Sua tarefa é analisar o briefing, as imagens e/ou os documentos em anexo (como fotos do estabelecimento, cardápios em PDF, tabelas de serviços e folders) e gerar uma estrutura de dados completa de altíssima conversão para a landing page do cliente.

DIRETRIZES MULTIMODAIS E DE DESIGN:
1. ARQUITETURA INTOCÁVEL: JAMAIS altere o template_id ou estruture propriedades fora do schema. Você altera estritamente textos, cores, distribuição de fotos, serviços e diferenciais.
2. DISTRIBUIÇÃO INTELIGENTE DE FOTOS E RECORTE DE LOGOS:
   - Se houver fotos ou imagens anexadas (ou extraídas de PDF) com URLs públicas:
     * 'avatar_url': Atribua OBRIGATORIAMENTE a URL da imagem com tag/papel de Logotipo ('logo') ou o melhor recorte de logo/rosto.
     * 'cover_url': Atribua OBRIGATORIAMENTE a URL da foto de Capa/Banner ('cover') ou banner principal da empresa.
     * 'suggested_services[i].image_url': Se houver fotos específicas de pratos (ex: hambúrguer, pizza), produtos ou procedimentos estéticos/médicos ('product'), atribua a respectiva URL pública diretamente ao item correspondente do catálogo!
3. EXTRAÇÃO SEMÂNTICA DE PDFS (Cardápios, Catálogos e Tabelas de Preço):
   - Se houver documento PDF anexado, examine atentamente todo o texto, tabelas, pratos e valores.
   - Extraia TODOS os produtos/serviços reais com seus nomes exatos, descrições detalhadas e preços numéricos em reais (R$) para 'suggested_services'.
   - Identifique horários de atendimento, regras de agendamento e diferenciais presentes no PDF para compor os 'differentials' e o FAQ.
4. VÍDEO INSTITUCIONAL:
   - Se o campo videoUrl foi preenchido ou mencionado, configure 'video_embed' com enabled=true, a url indicada, um título magnético (ex: "Conheça por Dentro Nossa Estrutura") e uma legenda convidativa.
5. PALETA DE CORES DA MARCA (custom_theme):
   - Extraia as cores predominantes das fotos ou logotipo e construa um tema equilibrado ('primary', 'background', 'text', 'card_bg', 'border_color', 'mode').
6. COPYWRITING:
   - 'description': Headline magnética de alta conversão (120 a 240 caracteres).
   - 'whatsapp_message': Mensagem persuasiva de abertura para o WhatsApp comercial.
   - 'differentials': Exatamente 3 a 4 diferenciais de autoridade.
   - 'testimonials': 2 a 3 depoimentos convincentes com notas 5 estrelas.

RETORNE RIGOROSAMENTE UM OBJETO JSON VÁLIDO SEM NENHUM TEXTO OU MARKDOWN ADICIONAL FORA DO JSON.`;

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
      return parsed;
    } catch {
      throw new Error("Não foi possível decodificar o JSON estruturado gerado pelo Gemini.");
    }
  });

