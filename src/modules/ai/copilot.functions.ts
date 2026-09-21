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
2. REGRAS INEGOCIÁVEIS DE CONTRASTE & HARMONIA (WCAG):
   - 'custom_theme.mode': Defina "light" (padrão elegante e limpo) ou "dark" (moderno e imersivo).
   - 'custom_theme.primary': Cor marcante da identidade visual da empresa (ex: verde médico #059669, azul royal #1d4ed8, dourado #d97706, etc.).
   - Se 'mode' === 'light':
     * 'background': "#ffffff" (ou tom ultra-suave como "#f8fafc").
     * 'title': OBRIGATORIAMENTE tom escuro de alta autoridade ("#0f172a", "#111827", "#020617").
     * 'text': OBRIGATORIAMENTE cinza escuro legível ("#334155" ou "#475569").
     * 'card_bg': "#ffffff".
     * 'border_color': "#e2e8f0".
   - Se 'mode' === 'dark':
     * 'background': "#0b0f19" (ou "#090d16").
     * 'title': OBRIGATORIAMENTE tom claro ("#ffffff" ou "#f8fafc").
     * 'text': OBRIGATORIAMENTE tom cinza claro legível ("#cbd5e1" ou "#e2e8f0").
     * 'card_bg': "#131b2e".
     * 'border_color': "#1e293b".
   - CRÍTICO: NUNCA gere 'title' escuro com 'background' escuro, nem 'title' claro com 'background' claro! Garanta legibilidade cristalina em todas as telas.
3. DISTRIBUIÇÃO INTELIGENTE DE FOTOS E RECORTE DE LOGOS:
   - Se houver fotos ou imagens anexadas (ou extraídas de PDF) com URLs públicas:
     * 'avatar_url': Atribua OBRIGATORIAMENTE a URL da imagem com tag/papel de Logotipo ('logo') ou o melhor recorte de logo/rosto.
     * 'cover_url': Atribua OBRIGATORIAMENTE a URL da foto de Capa/Banner ('cover') ou banner principal da empresa.
     * 'suggested_services[i].image_url': Se houver fotos específicas de pratos (ex: hambúrguer, açaí, pizza), produtos ou procedimentos estéticos/médicos ('product'), atribua a respectiva URL pública diretamente ao item correspondente do catálogo!
4. EXTRAÇÃO SEMÂNTICA PROFUNDA DE PDFS (Cardápios, Catálogos e Tabelas de Preço):
   - Se houver texto extraído do PDF (ou imagens do documento):
     * Mapeie TODOS os pratos/serviços reais encontrados: nomes exatos, descrições fiéis com ingredientes e preços numéricos em reais (R$).
     * Não resuma nem invente pratos se o PDF já fornecer os produtos reais da empresa.
     * Extraia telefones, WhatsApp, endereço, horário de atendimento e diferenciais presentes no PDF para 'differentials' e 'about_section'.
5. VÍDEO INSTITUCIONAL:
   - Se o campo videoUrl foi preenchido ou mencionado, configure 'video_embed' com enabled=true, a url indicada, um título magnético (ex: "Conheça por Dentro Nossa Estrutura") e uma legenda convidativa.
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
            ? (bgLum < 128 ? parsed.custom_theme.background : "#0b0f19")
            : (bgLum >= 128 ? parsed.custom_theme.background : "#ffffff"),
          title: isDark
            ? (calcLum(parsed.custom_theme.title) > 130 ? parsed.custom_theme.title : "#ffffff")
            : (calcLum(parsed.custom_theme.title) < 130 ? parsed.custom_theme.title : "#0f172a"),
          text: isDark
            ? (calcLum(parsed.custom_theme.text) > 130 ? parsed.custom_theme.text : "#cbd5e1")
            : (calcLum(parsed.custom_theme.text) < 130 ? parsed.custom_theme.text : "#334155"),
          card_bg: isDark ? (parsed.custom_theme.card_bg || "#131b2e") : (parsed.custom_theme.card_bg || "#ffffff"),
          border_color: isDark ? (parsed.custom_theme.border_color || "#1e293b") : (parsed.custom_theme.border_color || "#e2e8f0"),
        };
      }

      return parsed;
    } catch {
      throw new Error("Não foi possível decodificar o JSON estruturado gerado pelo Gemini.");
    }
  });

