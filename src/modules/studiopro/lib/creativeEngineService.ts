import { GoogleGenAI } from "@google/genai";
import { getResolvedGeminiKeyFn } from "@/modules/ai/gemini-admin.functions";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
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

/**
 * Resolve a chave de forma assíncrona, sincronizando do banco de dados Supabase
 * caso o navegador/dispositivo ainda não a tenha em cache local.
 */
export async function resolveCreativeStudioApiKeyAsync(customKey?: string): Promise<string> {
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }

  const local = getGeminiApiKey();
  if (local) return local;

  // Busca a chave salva no banco de dados do superadmin
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
    console.warn("[CreativeEngine] Falha ao sincronizar chave remota do banco:", err);
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

const BRIEFING_SYSTEM_PROMPT = `Você é o Diretor Criativo e Estrategista Digital do "Estúdio Criativo", especializado em criar sites modernos, impactantes e de altíssima conversão (padrão Lovable / Awwwards).

Seu objetivo nesta etapa NÃO é gerar o código ainda, mas sim montar um PLANEJAMENTO / BRIEFING ESTRATÉGICO e claro para o usuário aprovar ou refinar.

Formato da sua resposta:
Responda sempre em Português (Brasil) de forma elegante e estruturada com:
1. 🎯 **Conceito & Proposta de Valor**: Uma visão clara de como o site vai posicionar a marca.
2. 🎨 **Identidade Visual & Cores**: Sugestão de paleta (ex: grafite profundo, detalhes em esmeralda/dourado, tipografia limpa).
3. 📐 **Estrutura de Seções**:
   - Hero com CTA magnético
   - Diferenciais & Prova de autoridade
   - Vitrine de serviços / produtos com preços/valores se aplicável
   - Depoimentos reais de clientes
   - Seção de contato / agendamento / WhatsApp
4. 💬 Uma pergunta convidativa no final: *"Deseja aprovar este conceito para gerarmos o site ou gostaria de fazer algum ajuste?"*

Seja conciso, direto e profissional.`;

const CODE_GENERATION_SYSTEM_PROMPT = `Você é o Arquiteto Frontend Principal do "Estúdio Criativo".
Você gera sites web COMPLETOS, MODERNOS e VISUALMENTE ESPETACULARES em um único arquivo HTML autocontido no padrão de design do Lovable.dev e Awwwards.

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

4. **Elementos de Alta Conversão**:
   - Botão de WhatsApp em destaque e flutuante no canto inferior direito com animação de pulso.
   - Chamadas para Ação (CTAs) claras e diretas.
   - Seção de depoimentos com estrelas e fotos de pessoas.
   - Cabeçalho (Navbar) fixo com backdrop-blur-md e links de âncora suaves.
   - Rodapé completo com copyright e links de contato.

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
): Promise<string> {
  const client = await createGoogleAiClientAsync(apiKey);

  const formattedHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const response = await client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      ...formattedHistory,
      { role: "user", parts: [{ text: prompt }] },
    ],
    config: {
      systemInstruction: BRIEFING_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  return response.text?.trim() || "Plano estratégico elaborado com sucesso.";
}

/**
 * Etapa 2: Gerar ou Refinar o Site Completo em HTML/Tailwind nativo
 */
export async function generateSiteHtml(
  briefingOrPrompt: string,
  existingHtml?: string,
  apiKey?: string,
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

  const response = await client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: CODE_GENERATION_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  let raw = response.text?.trim() || "";
  
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

