import { GoogleGenAI } from "@google/genai";
import { getResolvedGeminiKeyFn } from "@/modules/ai/gemini-admin.functions";

export interface MultimodalAttachment {
  name: string;
  mimeType: string;
  dataBase64: string; // base64 puro sem data:...;base64,
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: MultimodalAttachment[];
}

export interface GenerationStep {
  step: "briefing" | "planning" | "generating" | "complete" | "error";
  message: string;
}

export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    const localKey =
      localStorage.getItem("eialink_gemini_api_key") ||
      localStorage.getItem("openpage-gemini-key") ||
      localStorage.getItem("gemini_api_key");
    if (localKey && localKey.trim().length > 10) return localKey.trim();
  }

  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 10) return envKey.trim();
  }

  return "";
}

import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a chave de forma assíncrona, sincronizando do Supabase (user_metadata)
 * caso o navegador/dispositivo ainda não a tenha em cache local.
 */
export async function resolveCreativeStudioApiKeyAsync(customKey?: string): Promise<string> {
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }

  const local = getGeminiApiKey();
  if (local) return local;

  // 1. Tenta recuperar dos metadados do usuário logado no Supabase (sincronização Desktop <-> Mobile)
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userKey = userData?.user?.user_metadata?.gemini_api_key;
    if (userKey && typeof userKey === "string" && userKey.trim().length > 10) {
      const clean = userKey.trim();
      if (typeof window !== "undefined") {
        localStorage.setItem("eialink_gemini_api_key", clean);
        localStorage.setItem("openpage-gemini-key", clean);
      }
      return clean;
    }
  } catch (authErr) {
    console.warn("[CreativeEngine] Não foi possível obter chave via auth metadata:", authErr);
  }

  // 2. Busca a chave salva pelo endpoint do servidor
  try {
    const remote = await getResolvedGeminiKeyFn();
    if (remote?.apiKey && remote.apiKey.trim().length > 10) {
      const clean = remote.apiKey.trim();
      if (typeof window !== "undefined") {
        localStorage.setItem("eialink_gemini_api_key", clean);
        localStorage.setItem("openpage-gemini-key", clean);
      }
      return clean;
    }
  } catch (err) {
    console.warn("[CreativeEngine] Falha ao sincronizar chave remota do servidor:", err);
  }

  throw new Error(
    "Chave da API do Google AI Studio não encontrada. Configure sua chave no painel de Configurações.",
  );
}

/**
 * Cria ou retorna cliente oficial do Google AI Studio usando @google/genai
 */
export async function createGoogleAiClientAsync(customKey?: string) {
  const key = await resolveCreativeStudioApiKeyAsync(customKey);
  return new GoogleGenAI({ apiKey: key });
}

export function createGoogleAiClient(customKey?: string) {
  const key = customKey || getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Chave da API do Google AI Studio não encontrada. Configure sua chave em Configurações.",
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

export const BRIEFING_SYSTEM_PROMPT = `Você é o Diretor Criativo, Copywriter de Elite e Arquiteto Frontend Principal do "Estúdio Criativo" no EIA Link.
Você pensa como um Webdesigner Premiado (padrão Awwwards / Lovable), escreve como um Copywriter Milionário de Conversão e estrutura tudo como um Engenheiro Sênior.

SEU TOM DE VOZ E POSTURA:
- Converse de forma descontraída, empolgada, humana e muito perspicaz ("Fala, mestre!", "Excelente ideia!", "Deixa comigo, vou estruturar uma página que vai passar uma autoridade absurda").
- NADA de respostas robóticas, protocolares ou respostas automáticas genéricas. Mostre que você entendeu a essência da marca!
- Se o usuário enviar imagens, logos, panfletos ou fotos, analise tudo com sua visão multimodal: extraia as cores, a proposta de valor, os diferenciais e use no planejamento.

OBJETIVO DO BRIEFING:
Apresentar de forma empolgante, visual e estruturada a estratégia da página:
1. 🎯 **Proposta Única de Valor & Posicionamento**: Como essa página vai destacar o cliente da concorrência local.
2. 🎨 **Identidade Visual & Cores Sugeridas**: Paleta moderna de alto contraste (ex: grafite profundo #09090b, toques em esmeralda, dourado ou neon, tipografia limpa e impactante).
3. 📐 **Estrutura das Seções Matadoras**:
   - Hero com headline magnética e botão de ação direto no WhatsApp
   - Prova social, autoridade e diferenciais exclusivos
   - Vitrine de serviços / produtos com chamadas atraentes
   - Localização interativa (GPS Google Maps + Waze)
   - Contato / Concierge ágil
4. 💬 Uma pergunta convidativa no final: *"O que achou dessa direção? Quer aprovar para gerarmos o código ou prefere ajustar algum detalhe antes?"*`;

export const CODE_GENERATION_SYSTEM_PROMPT = `Você é o Arquiteto Frontend Principal do "Estúdio Criativo".
Você gera sites web COMPLETOS, MODERNOS e VISUALMENTE ESPETACULARES em um único arquivo HTML autocontido no padrão de design do Lovable.dev e Awwwards, já totalmente integrado com o ecossistema de ferramentas de negócios EiaLink.

DIRETRIZES TÉCNICAS E DE DESIGN:
1. **Tecnologia**:
   - Documento HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>)
   - Utilize Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Importe fontes modernas do Google Fonts (Inter, Plus Jakarta Sans, Outfit ou Playfair Display):
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
   - Importe Lucide Icons via unpkg:
     <script src="https://unpkg.com/lucide@latest"></script>

2. **Estética Lovable / Moderna (Grafite Profundo)**:
   - Fundo base: tons de grafite e ardósia sofisticados (#09090b, #0f172a, #18181b), NÃO preto chapado morto.
   - Detalhes de luz suave (radial-gradients, glassmorphism com backdrop-blur, bordas translúcidas border-white/10).
   - Efeitos de hover suaves (transition-all duration-300, group-hover:scale-105).
   - Sombras atmosféricas (shadow-2xl, shadow-emerald-500/10 ou cor de destaque correspondente).

3. **Imagens de Alta Resolução Reais**:
   - Utilize imagens temáticas de alta qualidade do Unsplash através de URLs diretas e estáveis com palavras-chave pertinentes:
     https://images.unsplash.com/photo-... ou utilize a CDN Unsplash com parâmetros formatados: https://images.unsplash.com/photo-[id]?auto=format&fit=crop&w=1200&q=80
   - NUNCA use placeholders cinzas como "placeholder.com". Sempre use fotos reais do nicho especificado.

4. **FERRAMENTAS NATIVAS E INTEGRALIDADE DE NEGÓCIO (OBRIGATÓRIO)**:
   - **Agendamento Online**:
     Inclua um botão e seção de agendamento em destaque: "🗓️ Agendar Horário Online" com badge "Disponibilidade em Tempo Real". Se houver slug da empresa, use o link nativo "/agendar/{slug}" ou link âncora suave.
   - **Localização Interativa & GPS (Google Maps + Waze)**:
     Crie uma seção elegante de "Onde Estamos / Localização" contendo:
     * Card visual com endereço completo e horários de funcionamento.
     * Iframe responsivo do Google Maps: <iframe src="https://maps.google.com/maps?q={ENDERECO_OU_NOME_EMPRESA}&output=embed" class="w-full h-64 rounded-2xl border border-white/10" loading="lazy"></iframe>
     * Dois botões de rota GPS com ícones:
       - "📍 Traçar Rota no Google Maps" (apontando para https://www.google.com/maps/dir/?api=1&destination={ENDERECO_URL_ENCODED})
       - "🚗 Abrir no Waze" (apontando para https://waze.com/ul?q={ENDERECO_URL_ENCODED})
   - **WhatsApp Oficial com Botão Flutuante Pulsante**:
     Adicione um botão fixo no canto inferior direito (<div class="fixed bottom-6 right-6 z-50">) com ícone de mensagem/WhatsApp, efeito pulsante (animate-bounce ou pulse) e link direto:
     https://wa.me/{NUMERO_WHATSAPP}?text=Olá,%20gostaria%20de%20mais%20informações!
   - **Concierge & Atendimento Ágil**:
     Seção com chamadas claras para falar com o especialista ou assistente virtual.

5. **Interatividade com Script Inline**:
   - Ao final do <body>, adicione:
     <script>
       lucide.createIcons();
     </script>

6. **FORMATO DA RESPOSTA**:
   - Retorne EXCLUSIVAMENTE o código HTML bruto da página.
   - NÃO adicione blocos de markdown como \`\`\`html ou comentários fora do código.
   - O código deve iniciar diretamente com <!DOCTYPE html> e terminar com </html>.`;

/**
 * Etapa 1: Planejar e montar o Briefing Estruturado
 */
export async function planSiteBriefing(
  prompt: string,
  history: ChatMessage[] = [],
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<string> {
  const client = await createGoogleAiClientAsync(apiKey);

  const formattedHistory = history.map((msg) => {
    const parts: any[] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    parts.push({ text: msg.content });
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const currentUserParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentUserParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentUserParts.push({ text: prompt });

  const briefingModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
  let briefingText = "";

  for (const modelCandidate of briefingModels) {
    try {
      const response = await client.models.generateContent({
        model: modelCandidate,
        contents: [
          ...formattedHistory,
          { role: "user", parts: currentUserParts },
        ],
        config: {
          systemInstruction: BRIEFING_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });
      briefingText = response.text?.trim() || "";
      if (briefingText) break;
    } catch (err) {
      console.warn(`[CreativeEngine] Falha no briefing com ${modelCandidate}:`, err);
    }
  }

  return briefingText || "Plano estratégico elaborado com sucesso.";
}

/**
 * Etapa 2: Gerar ou Refinar o Site Completo em HTML/Tailwind nativo
 * Implementa backoff exponencial e contingência automática com modelos Gemini oficiais
 */
export async function generateSiteHtml(
  briefingOrPrompt: string,
  existingHtml?: string,
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<string> {
  const client = await createGoogleAiClientAsync(apiKey);

  let userPrompt = briefingOrPrompt;
  if (existingHtml && existingHtml.length > 50) {
    userPrompt = `MODIFICAÇÃO NO SITE EXISTENTE:
O usuário solicitou o seguinte ajuste:
"${briefingOrPrompt}"

Aqui está o código HTML atual da página que deve ser modificado preservando todo o restante da estrutura e melhorando com o novo ajuste:
${existingHtml}

Retorne o HTML completo atualizado com a alteração solicitada.`;
  }

  const currentUserParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentUserParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentUserParts.push({ text: userPrompt });

  let raw = "";
  let lastCapturedError: any = null;
  // Modelos oficiais do Google AI Studio: 3.8 Flash (primário) e 3.5 Flash Lite / 2.0 Flash (contingência)
  const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const modelCandidate of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await client.models.generateContent({
          model: modelCandidate,
          contents: [{ role: "user", parts: currentUserParts }],
          config: {
            systemInstruction: CODE_GENERATION_SYSTEM_PROMPT,
            temperature: 0.7,
            thinkingConfig: {
              thinkingLevel: "low" as any,
            },
          },
        });

        raw = response.text?.trim() || "";
        if (raw) break;
      } catch (err: any) {
        lastCapturedError = err;
        const errStr = JSON.stringify(err || {});
        const status = err?.status || err?.code;
        const isTransient =
          status === 503 ||
          status === 429 ||
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("high demand");

        if (isTransient && attempts < maxAttempts - 1) {
          attempts++;
          // Backoff exponencial com jitter: 1.2s -> 2.5s -> 4s
          const delayMs = Math.round(1200 * Math.pow(2, attempts - 1) + Math.random() * 400);
          console.warn(`[CreativeEngine] Tentativa ${attempts} de ${maxAttempts} para ${modelCandidate}. Aguardando ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Erro não transitório ou esgotadas as tentativas para este modelo, passa para o próximo modelo
        console.warn(`[CreativeEngine] Modelo ${modelCandidate} falhou, chaveando contingência:`, err?.message || err);
        break;
      }
    }

    if (raw) break;
  }

  if (!raw) {
    const errorDetails =
      lastCapturedError?.message ||
      (typeof lastCapturedError === "object" ? JSON.stringify(lastCapturedError) : "Falha na geração");
    throw new Error(
      `Não foi possível gerar o site no Google AI Studio: ${errorDetails}. Por favor, clique novamente para tentar a geração.`,
    );
  }
  
  // Limpeza de possíveis envoltórios markdown
  if (raw.startsWith("```html")) {
    raw = raw.replace(/^```html\s*/i, "");
  } else if (raw.startsWith("```")) {
    raw = raw.replace(/^```\s*/, "");
  }
  if (raw.endsWith("```")) {
    raw = raw.replace(/```\s*$/, "");
  }

  return raw.trim();
}

