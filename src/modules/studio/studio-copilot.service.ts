import { callGoogleAi } from "@/modules/ai/google-ai.service";
import { detectNicheCategory, getNicheDirectives } from "@/modules/ai/niche-prompts";
import type { CinematicPageData } from "@/modules/cinematic/types";

export interface StudioCopilotInput {
  businessName: string;
  niche: string;
  userMessage: string;
  currentData: CinematicPageData;
  conversationHistory?: Array<{ sender: "user" | "agent"; text: string }>;
  apiKey?: string;
}

export interface StudioCopilotOutput {
  actionType: "conversation" | "direct_update";
  agentMessage: string;
  updatedData?: Partial<CinematicPageData>;
  suggestions: string[];
}

/**
 * Agente Copilot do Studio:
 * Cria e refina sites de alta conversão, únicos e modernos para negócios locais e serviços.
 * Comunica-se diretamente via API oficial do Google AI Studio (Gemini 2.5/2.0).
 */
export async function executeStudioCopilot(
  input: StudioCopilotInput,
): Promise<StudioCopilotOutput> {
  const {
    businessName,
    niche,
    userMessage,
    currentData,
    conversationHistory = [],
    apiKey,
  } = input;

  const instruction = (userMessage || "").trim();
  const nicheCategory = detectNicheCategory(niche, businessName, instruction);
  const nicheDirectives = getNicheDirectives(nicheCategory, businessName);

  const systemPrompt = `Você é o Diretor Criativo e Especialista em CRO (Otimização de Conversão) do Studio EIA Link.
Sua missão é conceber e refinar um site único, sofisticado e de altíssima conversão para o negócio "${businessName}" (Nicho: "${niche}").

DIRETRIZES DE DESIGN & COPYWRITING:
1. ESTRUTURA VENDEDORA: Todo elemento deve guiar o visitante para a ação (agendamento, contato via WhatsApp, compra ou pedido).
2. COPYWRITING INTELIGENTE E ESPECÍFICO: Proibido clichês genéricos como "o melhor da região" ou "atendimento diferenciado". Use textos com benefícios claros, gatilhos de autoridade, dor do cliente e transformação real.
3. ESTÉTICA MODERNA:
   - Paletas elegantes e harmoniosas com bom contraste (fundos nobres escuros ou claros limpos).
   - Tipografia refinada (serif, sans ou display).
   - Componentes visuais fortes: Hero marcante, Destaques/Serviços com preços claros, Galeria de ambiente e trabalhos, Seção de Prova Social e FAQ.

${nicheDirectives}

DADOS ATUAIS DA PÁGINA DO CLIENTE:
${JSON.stringify(currentData, null, 2)}

CLASSIFICAÇÃO DE RESPOSTA (Retorne SEMPRE e APENAS JSON válido):
{
  "actionType": "direct_update" | "conversation",
  "agentMessage": "Sua resposta clara, objetiva e profissional para o usuário.",
  "updatedData": { ... }, // OBRIGATÓRIO quando actionType for "direct_update". Contenha APENAS os campos de CinematicPageData que foram alterados ou criados.
  "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"] // 3 próximos passos práticos que o usuário pode pedir.
}

REGRAS DE INTENÇÃO:
- "direct_update": Use SEMPRE que o usuário pedir para alterar, trocar, adicionar, reescrever, mudar cores, criar novos textos, atualizar preços, etc. (Ex: "mude a cor para dourado", "reescreva a hero", "adicione um serviço de drenagem por R$ 120", "troque o slogan").
  Preencha 'updatedData' com os campos atualizados de forma completa e válida (hero, theme, highlights, etc.).
- "conversation": Use quando o usuário fizer perguntas, pedir conselhos, tirar dúvidas conceituais ("o que você acha dessa cor?", "como atrair mais clientes nesse nicho?", "qual seção você recomenda agora?").
  Neste caso, responda com riqueza estratégica e não altere os dados ainda.`;

  // Monta histórico de turnos para a API do Gemini
  const validHistory = conversationHistory.filter((h) => h.text && h.text.trim().length > 0);
  const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  for (const turn of validHistory.slice(-8)) {
    const role = turn.sender === "agent" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${turn.text}`;
    } else {
      contents.push({ role, parts: [{ text: turn.text }] });
    }
  }

  // O Google Gemini exige que o primeiro turno de contents seja 'user'
  while (contents.length > 0 && contents[0].role === "model") {
    contents.shift();
  }

  // Adiciona a instrução atual do usuário
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: instruction || "Olá, como podemos melhorar este site?" }] });
  } else if (contents[contents.length - 1].role === "user") {
    if (instruction && !contents[contents.length - 1].parts[0].text.includes(instruction)) {
      contents[contents.length - 1].parts[0].text += `\n${instruction}`;
    }
  } else {
    contents.push({ role: "user", parts: [{ text: instruction || "Olá, como podemos melhorar este site?" }] });
  }

  const aiRes = await callGoogleAi({
    apiKey,
    systemPrompt,
    contents,
    temperature: 0.5,
    responseMimeType: "application/json",
  });

  if (!aiRes.ok) {
    // Se a chave não estiver configurada
    if (aiRes.status === 401 || aiRes.error?.includes("Nenhuma chave")) {
      return {
        actionType: "conversation",
        agentMessage: `Olá! Para que eu possa gerar copies exclusivas, paletas sob medida e refinar o site do seu negócio com inteligência artificial, conecte sua chave gratuita do **Google AI Studio** pelo botão no topo ou no modal de conexão. Ela é 100% gratuita no site [aistudio.google.com](https://aistudio.google.com/app/apikey). Enquanto isso, você pode editar todos os textos, fotos e serviços manualmente no painel ao lado!`,
        suggestions: [
          "Conectar chave Google AI",
          "Editar textos da Hero manualmente",
          "Alterar cores no seletor",
        ],
      };
    }

    return {
      actionType: "conversation",
      agentMessage: `Tive uma oscilação na conexão com a inteligência do Google AI Studio (${aiRes.error || "verifique sua chave"}). Você pode verificar a chave no topo ou continuar personalizando o site com as ferramentas manuais ao lado!`,
      suggestions: [
        "Testar chave no topo",
        "Ajustar Hero manualmente",
        "Adicionar serviços na vitrine",
      ],
    };
  }

  // Tenta parsear a resposta JSON
  if (aiRes.json && typeof aiRes.json === "object") {
    const parsed = aiRes.json as any;
    if (parsed.actionType || parsed.agentMessage) {
      return {
        actionType: parsed.actionType === "direct_update" ? "direct_update" : "conversation",
        agentMessage: parsed.agentMessage || "Apliquei as melhorias solicitadas no site!",
        updatedData: parsed.updatedData,
        suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
          ? parsed.suggestions
          : ["Ajustar paleta de cores", "Reescrever chamada da Hero", "Adicionar novo serviço"],
      };
    }
  }

  // Fallback caso texto tenha vindo como string pura
  if (aiRes.text) {
    let cleanText = aiRes.text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    try {
      const parsed = JSON.parse(cleanText);
      return {
        actionType: parsed.actionType === "direct_update" ? "direct_update" : "conversation",
        agentMessage: parsed.agentMessage || "Alterações processadas com sucesso!",
        updatedData: parsed.updatedData,
        suggestions: parsed.suggestions || [
          "Ajustar paleta de cores",
          "Reescrever a chamada principal",
          "Adicionar novo serviço",
        ],
      };
    } catch {
      return {
        actionType: "conversation",
        agentMessage: cleanText,
        suggestions: [
          "Aplicar essas sugestões no site",
          "Mudar cores e tipografia",
          "Adicionar novo serviço",
        ],
      };
    }
  }

  return {
    actionType: "conversation",
    agentMessage: "Analisei as informações do seu negócio. O que você gostaria de ajustar agora na página?",
    suggestions: [
      "Mudar cor principal",
      "Melhorar a Headline da capa",
      "Cadastrar novos serviços com preços",
    ],
  };
}

