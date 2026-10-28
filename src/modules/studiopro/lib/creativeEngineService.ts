import { GoogleGenAI } from "@google/genai";
import { getResolvedGeminiKeyFn } from "@/modules/ai/gemini-admin.functions";
import { getAvailableGeminiModels } from "@/modules/ai/google-ai.service";

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

2. **Diretrizes de Exclusividade e Anti-Template (CADA SITE DEVE SER ÚNICO)**:
   - NUNCA repita sempre a mesma fórmula arquitetônica (ex: topbar verde idêntica + hero de 2 colunas com imagem arredondada à direita + 4 cards).
   - Varie o estilo arquitetônico do Hero e da página:
     * Hero Editorial / Magazine: Tipografia de alta escala (Playfair Display, Syne ou Outfit), diagramação de revista de luxo, espaços negativos arejados e recortes elegantes.
     * Hero Imersivo / Full-bleed: Fotografia cinematográfica ampla com overlay gradiente sofisticado e tipografia marcante.
     * Hero Bento Grid / Mosaico: Grid assimétrico dinâmico de 3 ou 4 blocos de imagens, detalhes, reputação e chamada.
     * Hero Split Contemporâneo 60/40: Bloco de texto expressivo com cartões flutuantes interativos e estatísticas integradas.
   - Varie o cabeçalho: Crie navbars contemporâneas (ex: Navbar flutuante tipo pill centralizada com 'max-w-4xl mx-auto rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg border border-black/5', ou header minimalista transparente integrado ao hero, SEM topbars genéricas repetitivas).
   - Varie a paleta de cores: Explore Champagne Dourado & Grafite Nobre, Azul Índigo Real & Polar, Marfim & Terracota Acolhedor, Charcoal & Ouro Acetinado, Verde Eucalipto Profundo & Creme, etc. Evite fixar sempre na mesma cor verde-hospitalar.

3. **Imagens de Alta Resolução Reais e Compatíveis**:
   - Utilize as imagens compatíveis fornecidas no prompt do briefing (ou fotos reais do Google Meu Negócio se houver).
   - NUNCA invente URLs do Unsplash com IDs aleatórios fictícios (evita erro 404 de imagem quebrada).
   - NUNCA use repetidamente a foto antiga da cadeira odontológica (photo-1629909613654-28e377c37b09). Use sempre as fotos compatíveis buscadas ou fotos temáticas exclusivas.
   - Distribua as fotos nos seus papéis corretos: Hero (foto panorâmica imersiva), Espaço/Ambiente (foto do espaço físico), Serviços/Procedimentos (fotos das soluções/tratamentos), Equipe (foto humanizada de atendimento) e Detalhes (close-up com alta definição).
   - NUNCA use placeholders cinzas como "placeholder.com".

4. **FERRAMENTAS NATIVAS E INTEGRALIDADE DE NEGÓCIO (OBRIGATÓRIO)**:
   - **Agendamento Online**:
     Inclua um botão e seção de agendamento em destaque: "🗓️ Agendar Consulta" ou "🗓️ Agendar Horário Online" com badge "Disponibilidade em Tempo Real". Use SEMPRE o link nativo 'href="/agendar/{slug}"' e atributo 'data-action="agendar"'. NUNCA aponte o botão de agendamento para WhatsApp nem use links mortos '#'.
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

6. **FORMATO DA RESPOSTA (COPILOTO + CÓDIGO HTML)**:
Sua resposta deve conter OBRIGATORIAMENTE duas partes separadas por marcadores claros:
<<<EXPLANATION>>>
Escreva uma mensagem conversacional, simpática, prestativa e humana como Copiloto AI para o usuário no chat (em português do Brasil).
Diga exatamente o que você fez ou alterou no site (por exemplo: cores ajustadas, títulos melhorados, novas seções, layout aprimorado ou botões configurados). Deixe um convite aberto para ele conferir na tela ao lado ou pedir novos ajustes.
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... Código HTML5 completo, moderno e autocontido da página ...
</html>`;

export const SURGICAL_EDIT_SYSTEM_PROMPT = `Você é o Arquiteto Copiloto Especialista em Edição Cirúrgica de Código HTML5 do "Estúdio Criativo".
Sua ÚNICA missão é aplicar com precisão CIRÚRGICA e ESTRITA a alteração solicitada pelo usuário no código HTML5/Tailwind existente, SEM redesenhar o site do zero, SEM alterar o tema ou a paleta de cores e SEM desconfigurar a identidade já aprovada.

REGRAS DE OURO PARA EDIÇÃO CIRÚRGICA:
1. **PRESERVAÇÃO INTEGRAL DE IDENTIDADE VISUAL**:
   - Mantenha RIGOROSAMENTE o mesmo tema de cores (se a página era clara/branca, continue 100% clara/branca; se era escura, continue escura).
   - Mantenha a mesma tipografia, a mesma estrutura de seções, as fotos do Unsplash existentes e todos os blocos que NÃO foram expressamente pedidos para mudar.
   - NUNCA substitua o site por um modelo genérico escuro de 'sua região' ou mude imagens para outros nichos.
   - Modifique APENAS o elemento, texto, botão, estilo ou seção que o usuário especificou na solicitação.

2. **CONTROLE E PRESERVAÇÃO DAS FERRAMENTAS DO SISTEMA**:
   - Se o usuário pediu ajuste na Agenda (ex: 'conectar agenda', 'abrir modal', 'mudar botão de agendar'):
     Mantenha/atualize os botões de agendamento com href="/agendar/{slug}" e data-action="agendar".
   - Preserve sempre:
     * Botão flutuante de WhatsApp (wa.me)
     * Seção de localização (Google Maps + botões Waze/Maps)
     * Scripts de runtime (#eialink-runtime) e Lucide Icons

3. **FORMATO OBRIGATÓRIO DA RESPOSTA**:
Sua resposta DEVE conter impreterivelmente as duas partes separadas por marcadores:
<<<EXPLANATION>>>
Escreva uma mensagem conversacional, simpática e objetiva no chat explicando exatamente o que foi modificado cirurgicamente (em português do Brasil).
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... Código HTML5 completo, limpo e autocontido com a modificação cirúrgica aplicada ...
</html>
<<<END_HTML>>>`;

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

  // Tenta com gemini-2.5-flash como modelo principal e um único fallback (gemini-2.5-flash-lite)
  let briefingText = "";
  let lastError: any = null;
  const candidateModels = await getAvailableGeminiModels(apiKey);

  for (const modelToTry of candidateModels) {
    if (briefingText) break;
    try {
      const response = await client.models.generateContent({
        model: modelToTry,
        contents: [...formattedHistory, { role: "user", parts: currentUserParts }],
        config: {
          systemInstruction: BRIEFING_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });
      const text = response.text?.trim() || "";
      if (text) {
        briefingText = text;
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[CreativeEngine] Falha no briefing com ${modelToTry}:`, err?.message || err);
    }
  }

  if (!briefingText) {
    const rawMsg = lastError?.message || String(lastError || "Erro desconhecido");
    const lower = rawMsg.toLowerCase();
    if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
      throw new Error(
        `Modelo do Google AI Studio inexistente ou indisponível para a sua chave (${rawMsg}).`,
      );
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      throw new Error(
        `Limite de cota atingido no Google AI Studio (${rawMsg}). Aguarde alguns instantes ou verifique o faturamento da sua chave.`,
      );
    }
    throw new Error(`Falha ao gerar briefing no Google AI Studio: ${rawMsg}`);
  }

  return briefingText;
}

/**
 * Etapa 2: Gerar ou Refinar o Site Completo em HTML/Tailwind nativo
 * Conecta com o modelo gemini-2.5-flash como principal e um único fallback (gemini-2.5-flash-lite)
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

  const candidateModels = await getAvailableGeminiModels(apiKey);

  for (const modelToTry of candidateModels) {
    if (raw) break;
    try {
      const response = await client.models.generateContent({
        model: modelToTry,
        contents: [{ role: "user", parts: currentUserParts }],
        config: {
          systemInstruction: CODE_GENERATION_SYSTEM_PROMPT,
          temperature: 0.65,
        },
      });

      const text = response.text?.trim() || "";
      if (text && text.length > 50) {
        raw = text;
        break;
      }
    } catch (sdkErr: any) {
      lastCapturedError = sdkErr;
      console.warn(`[CreativeEngine] Falha ao gerar com ${modelToTry}:`, sdkErr?.message || sdkErr);
    }
  }

  if (!raw) {
    const errorDetails =
      lastCapturedError?.message ||
      (typeof lastCapturedError === "object"
        ? JSON.stringify(lastCapturedError)
        : "Falha na geração");
    const lower = String(errorDetails).toLowerCase();
    if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
      throw new Error(
        `Modelo do Google AI Studio inexistente ou indisponível para a sua chave: ${errorDetails}`,
      );
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      throw new Error(
        `Limite de cota atingido no Google AI Studio: ${errorDetails}. Aguarde alguns instantes ou verifique o faturamento da sua chave.`,
      );
    }
    throw new Error(
      `Não foi possível gerar o site no Google AI Studio: ${errorDetails}. Por favor, clique novamente para tentar a geração.`,
    );
  }

  let cleanHtml = raw;
  if (cleanHtml.includes("<<<HTML>>>")) {
    const parts = cleanHtml.split("<<<HTML>>>");
    cleanHtml = parts[1].trim();
  }

  // Limpeza de possíveis envoltórios markdown
  if (cleanHtml.startsWith("```html")) {
    cleanHtml = cleanHtml.replace(/^```html\s*/i, "");
  } else if (cleanHtml.startsWith("```")) {
    cleanHtml = cleanHtml.replace(/^```\s*/, "");
  }
  if (cleanHtml.endsWith("```")) {
    cleanHtml = cleanHtml.replace(/```\s*$/, "");
  }

  return cleanHtml.trim();
}

export async function generateSiteWithCopilot(
  briefingOrPrompt: string,
  existingHtml?: string,
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<{ html: string; explanation: string }> {
  const html = await generateSiteHtml(briefingOrPrompt, existingHtml, apiKey, attachments);
  return {
    html,
    explanation: existingHtml
      ? "✨ Ajuste aplicado no site com sucesso! Veja a prévia atualizada na tela ao lado."
      : "🎉 Site construído com sucesso! Veja a prévia e solicite novos ajustes se desejar.",
  };
}
