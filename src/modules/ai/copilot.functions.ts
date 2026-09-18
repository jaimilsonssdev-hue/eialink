import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface AiCopilotResult {
  display_name?: string;
  description?: string;
  whatsapp_message?: string;
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
  }>;
}

const copilotInputSchema = z.object({
  briefing: z.string().min(3, "Briefing deve conter pelo menos 3 caracteres.").max(10000),
  currentContext: z
    .object({
      displayName: z.string().optional(),
      niche: z.string().optional(),
      city: z.string().optional(),
      servicesCount: z.number().optional(),
    })
    .optional(),
  overrideApiKey: z.string().optional(),
});

export const generateCopilotSiteFn = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof copilotInputSchema>) => copilotInputSchema.parse(data))
  .handler(async ({ data }): Promise<AiCopilotResult> => {
    // RESOLUÇÃO SEGURA DA CHAVE NO SERVIDOR:
    // 1. Prioridade máxima: Variável de ambiente do servidor (NUNCA exposta ao bundle client-side)
    // 2. Chave opcional informada pelo usuário/admin na sessão caso o servidor não possua a variável
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_KEY ||
      (process.env as any).VITE_GEMINI_API_KEY;

    const resolvedKey = (data.overrideApiKey || serverKey || "").trim();

    if (!resolvedKey) {
      throw new Error(
        "Chave da API do Google AI Studio não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente do servidor ou insira sua chave segura no campo do Copiloto."
      );
    }

    const systemPrompt = `Você é o Diretor de Arte, Especialista em UX e Redator Publicitário da plataforma "Máquina de Sites".
Sua tarefa é receber um briefing bruto com informações de um negócio (posts do Instagram, biografia, serviços, fotos, preferências de cor ou histórico da empresa) e gerar uma estrutura de dados de altíssima conversão.

REGRAS ESTRITAS DE ARQUITETURA E DESIGN:
1. JAMAIS altere ou invente propriedades de layout estrutural (como template_id ou layout). Você deve alterar APENAS dados de texto, cores harmônicas, diferenciais, depoimentos e catálogo.
2. TEXTOS PERSUASIVOS (Copywriting): A 'description' deve ter entre 120 e 240 caracteres, ser magnética, direta e sem clichês corporativos vazios.
3. CORES INTELIGENTES:
   - 'primary': Cor vibrante de destaque para botões e detalhes (em HEX, ex: #0ea5e9, #10b981, #f97316).
   - 'background': Fundo cinematográfico escuro (#070a12, #0b0c10) ou claro limpo (#ffffff, #fafafa).
   - 'text': Contraste impecável com o fundo (#f8fafc para escuro ou #0f172a para claro).
   - 'card_bg': Fundo translúcido para os cards de links e vitrines (ex: "rgba(255, 255, 255, 0.04)" ou "#ffffff").
   - 'border_color': Contorno sutil e elegante (ex: "rgba(255, 255, 255, 0.12)" ou "rgba(14, 165, 233, 0.25)").
   - 'mode': "dark" ou "light".
4. DIFERENCIAIS: Gere exatamente 3 ou 4 diferenciais que passem confiança e autoridade real.
5. DEPOIMENTOS: Crie de 2 a 3 depoimentos que soem como clientes reais e satisfeitos, com notas 5 estrelas.
6. SERVIÇOS: Se o briefing mencionar serviços ou cardápio, extraia ou formate os 3 a 6 principais com nome e descrição apetitosa/técnica.

RETORNE RIGOROSAMENTE UM OBJETO JSON VÁLIDO SEM NENHUM TEXTO OU MARKDOWN ADICIONAL FORA DO JSON.`;

    const userPrompt = `DADOS ATUAIS DO SITE:
Nome Atual: ${data.currentContext?.displayName || "Empresa Local"}
Nicho: ${data.currentContext?.niche || "Geral"}
Cidade / Região: ${data.currentContext?.city || "Brasil"}

BRIEFING BRUTO ENVIADO PELO USUÁRIO:
"""
${data.briefing}
"""

Gere a estrutura JSON completa para transformar este site em uma referência comercial de alto padrão.`;

    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.5-flash",
      "gemini-1.5-pro",
    ];

    let lastError = "";
    let rawContent: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            resolvedKey
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }],
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

    if (!rawContent) {
      throw new Error(
        `Não foi possível gerar com a API do Google AI Studio. Detalhe: ${lastError}. Certifique-se de que sua chave de API está ativa no console do Google AI Studio.`
      );
    }

    try {
      const parsed: AiCopilotResult = JSON.parse(rawContent);
      return parsed;
    } catch {
      throw new Error("Não foi possível decodificar o JSON estruturado gerado pelo Gemini.");
    }
  });

