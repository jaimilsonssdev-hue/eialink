import { GoogleGenAI } from "@google/genai";

export interface CompanyData {
  name: string;
  category: string;
  address: string;
  phone?: string;
  rating?: number;
  reviews_summary?: string[]; // Principais comentários do Google Maps
  amenities?: string[]; // Atributos (ex: "Ar condicionado", "Acessível")
}

export interface GenerateLandingPageOptions {
  companyData: CompanyData;
  userStylePrompt?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Resolve a melhor chave disponível para a API do Google AI Studio:
 * 1. Chave explícita informada no parâmetro
 * 2. Variável de ambiente do processo ou do Vite
 */
function resolveApiKey(override?: string): string {
  if (override && override.trim().length > 5) {
    return override.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 5) {
      return envKey.trim();
    }
  }
  throw new Error(
    "Nenhuma chave da API do Google AI Studio foi fornecida ou configurada no ambiente (GEMINI_API_KEY).",
  );
}

/**
 * Prompt de sistema configurado para atuação de nível sênior em CRO, Copywriting e Design.
 */
const SYSTEM_INSTRUCTION = `Você é o Diretor Criativo e Arquiteto Frontend Principal de uma Agência Boutique de Design e Copywriting Premium, especializada em Landing Pages de altíssima conversão.

SUAS REGRAS RÍGIDAS E INVIOLÁVEIS:

1. COPYWRITING BASEADO EM DADOS REAIS (PROIBIDO TEXTO GENÉRICO OU LOREM IPSUM):
   - É estritamente proibido usar clichês ("o melhor da região", "serviço diferenciado", "qualidade garantida") ou qualquer placeholder genérico.
   - Utilize ativamente todos os dados extraídos do Google Maps em 'companyData':
     * Título e Headline da Hero: Reescreva uma proposta única de valor (UVP) magnética e de alto impacto que faça o cliente querer agir imediatamente.
     * Seção Sobre / História: Fundamentada obrigatoriamente na essência da empresa e no sentimento dos comentários reais das avaliações do Google.
     * Prova Social e Destaques: Destaque explicitamente as forças da empresa que os clientes elogiaram nas reviews (ex: agilidade, acolhimento, sabor autêntico, pontualidade, precisão técnica).
     * Atributos e Comodidades: Incorpore os itens de amenities (ex: Estacionamento, Ar-Condicionado, Acessibilidade) como selos/badges de conveniência que reduzem a fricção de compra.

2. DIREÇÃO DE ARTE E DESIGN SYSTEM REFLETINDO O NICHO:
   - Restauração / Gastronomia Noturna / Bares: Paleta imersiva escura, contrastes quentes (âmbar, dourado, vinho), tipografia refinada e fotos apetitosas com sensação de exclusividade.
   - Saúde / Clínicas Médicas / Odontologia / Estética: Tons claros, higiênicos, serenos e profissionais (branco gelo, azul suave, esmeralda ou cinza titânio), tipografia limpa sans-serif e foco em credibilidade e biossegurança.
   - Serviços Corporativos / Advocacia / Consultoria: Tons sóbrios, autoridade sólida, linhas precisas e prova social robusta.
   - Estilo Visual Moderno: Utilize Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e classes utilitárias nativas para criar um layout responsivo impecável.
   - Efeitos Avançados:
     * Aplique Glassmorphism sofisticado (ex: 'backdrop-blur-md bg-white/10 border border-white/20' ou 'bg-zinc-950/70 border-zinc-800').
     * Se o usuário pedir microinterações ou animações dinâmicas, injete Anime.js via CDN (<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>) com scripts funcionais no final do body.

3. ESTRUTURA COMPLETA DA LANDING PAGE:
   - Header fixo com marca e botão de conversão direta para WhatsApp/Telefone.
   - Hero Section impactante com Headline poderosa, Subtítulo persuasivo, Badge de nota do Google (ex: "★ 4.9 no Google Maps") e CTA destacado.
   - Grid de Diferenciais / Destaques baseado nas virtudes apontadas pelos clientes reais.
   - Vitrine de Serviços / Produtos / Cardápio com valores ou opções claras.
   - Seção de Depoimentos / Avaliações reais do Maps formatadas em cards elegantes.
   - Selos de Conveniência (Amenities).
   - Localização & Contato com endereço completo, horário e botão direto para o WhatsApp ('https://wa.me/55...').
   - Footer elegante e profissional.

4. FORMATO DE SAÍDA OBRIGATÓRIO:
   - Retorne APENAS o código HTML5 completo, válido e 100% autocontido.
   - Comece impreterivelmente na primeira linha com '<!DOCTYPE html>'.
   - Termine na última linha com '</html>'.
   - É TOTALMENTE PROIBIDO incluir qualquer texto explicativo, saudações, notas ou blocos de código Markdown (NÃO coloque \`\`\`html ou \`\`\`). Retorne apenas o HTML cru.`;

/**
 * Constrói a mensagem estruturada do usuário realizando o merge dos dados do Google Maps com o estilo solicitado.
 */
function buildUserMessage(companyData: CompanyData, userStylePrompt?: string): string {
  const reviewsFormatted = companyData.reviews_summary && companyData.reviews_summary.length > 0
    ? companyData.reviews_summary.map((r, i) => `  ${i + 1}. "${r}"`).join("\n")
    : "  Nenhum comentário específico fornecido; baseie-se na alta reputação e excelência do nicho.";

  const amenitiesFormatted = companyData.amenities && companyData.amenities.length > 0
    ? companyData.amenities.join(", ")
    : "Não especificados.";

  return `Por favor, crie uma Landing Page única, completa e de altíssima conversão para a seguinte empresa, incorporando todos os dados do Google Maps no design e no copywriting:

--- DADOS DA EMPRESA (EXTRAÍDOS DO GOOGLE MAPS) ---
• Nome Comercial: ${companyData.name}
• Categoria / Nicho: ${companyData.category}
• Endereço Físico: ${companyData.address}
• Telefone / WhatsApp: ${companyData.phone || "A combinar no fechamento"}
• Avaliação no Google: ${companyData.rating ? `${companyData.rating} de 5.0 estrelas` : "5.0 estrelas (Destaque local)"}
• Comodidades & Atributos (Amenities): ${amenitiesFormatted}

• Resumo dos Principais Comentários e Reviews de Clientes Reais:
${reviewsFormatted}

--- DIRETRIZES DE ESTILO ADICIONAIS DO USUÁRIO ---
${userStylePrompt ? userStylePrompt.trim() : "Crie com design moderno, responsivo para celulares e computadores, e copywriting irresistível voltado a gerar agendamentos e vendas imediatas."}

Lembre-se: Retorne estritamente o código HTML5 autocontido iniciando em <!DOCTYPE html>, sem nenhum bloco de Markdown ou texto antes/depois.`;
}

/**
 * Remove eventuais tags de markdown (\`\`\`html) caso o modelo as gere acidentalmente.
 */
function cleanHtmlOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.replace(/^```html\s*/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Gera uma Landing Page completa e autocontida utilizando o SDK oficial @google/genai
 * e o modelo Google Gemini 3.8 Flash.
 */
export async function generateLandingPage(
  options: GenerateLandingPageOptions,
): Promise<string> {
  const { companyData, userStylePrompt, apiKey, model = "gemini-3.8-flash" } = options;

  const resolvedKey = resolveApiKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: resolvedKey });

  const userContent = buildUserMessage(companyData, userStylePrompt);

  const response = await ai.models.generateContent({
    model,
    contents: userContent,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.65,
    },
  });

  const outputText = response.text;
  if (!outputText || outputText.trim().length === 0) {
    throw new Error("O Google Gemini retornou uma resposta vazia para a geração da página.");
  }

  return cleanHtmlOutput(outputText);
}

