import { GoogleGenAI } from "@google/genai";
import { resolveCreativeStudioApiKeyAsync } from "@/modules/studiopro/lib/creativeEngineService";
import { supabase } from "@/integrations/supabase/client";

export interface CardapioItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
  isPopular?: boolean;
}

export interface CardapioCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface CardapioData {
  restaurantName: string;
  niche: "delivery" | "hamburgueria" | "pizzaria" | "sorveteria" | "acai" | "bistro" | "japones" | "geral";
  tagline: string;
  description: string;
  whatsapp: string;
  address?: string;
  deliveryFee?: string;
  minOrder?: number;
  openingHours?: string;
  categories: CardapioCategory[];
  items: CardapioItem[];
  themeColor: "amber" | "orange" | "rose" | "emerald" | "violet" | "red";
  styleVariant: "ifood-modern" | "bistro-dark" | "fresh-clean";
}

export interface CardapioAiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  attachments?: Array<{
    name: string;
    mimeType: string;
    dataBase64: string;
  }>;
}

const CARDAPIO_AI_SYSTEM_PROMPT = `Você é o Diretor de Criação & Growth de Gastronomia do "Gerador de Cardápios Inteligentes" do EIA Link.
Você combina a experiência de um Webdesigner Premiado, um Copywriter de Conversão de Apps de Delivery (estilo iFood) e um Programador Sênior.

SEU TOM DE VOZ:
- Seja descontraído, empolgado, humano e muito profissional. Nada de respostas frias, burocráticas ou robóticas.
- Trate o usuário como um parceiro de negócios ("Fala, mestre!", "Show de bola!", "Deixa comigo que vou transformar esse cardápio numa máquina de vendas").
- Sempre comente sobre os pratos de forma apetitosa e atraente.

SEUS SUPERPODERES:
1. **Multimodalidade Absoluta**: Se o usuário mandar fotos de cardápio impresso, foto de cardápio de parede, fotos de pratos ou PDF, você analisa visualmente cada item, detecta o nome do prato, a descrição sensorial, o preço em reais e a categoria.
2. **Copywriting Gastronômico**: Se os pratos não tiverem descrição, invente descrições de dar água na boca ("Blend artesanal 180g selado no ponto perfeito com queijo derretido...").
3. **Estruturação JSON Estrita**:
Sempre que for sugerir ou atualizar o cardápio, retorne no final da sua mensagem amigável um bloco JSON cercado por \`\`\`json { ... } \`\`\` com a seguinte estrutura completa:

\`\`\`json
{
  "restaurantName": "Nome do Estabelecimento",
  "niche": "hamburgueria",
  "tagline": "Slogan magnético e apetitoso",
  "description": "Texto curto de apresentação da casa",
  "whatsapp": "5511999999999",
  "address": "Rua Exemplo, 123",
  "deliveryFee": "A partir de R$ 5,00",
  "minOrder": 20.0,
  "openingHours": "Terça a Domingo das 18h às 23h30",
  "themeColor": "orange",
  "styleVariant": "ifood-modern",
  "categories": [
    { "id": "todos", "name": "Todos", "icon": "🍽️" },
    { "id": "destaques", "name": "Mais Pedidos", "icon": "⭐" },
    { "id": "principais", "name": "Pratos Principais", "icon": "🍔" },
    { "id": "bebidas", "name": "Bebidas", "icon": "🥤" }
  ],
  "items": [
    {
      "id": "item-1",
      "name": "Burger Especial da Casa",
      "description": "Blend artesanal 180g, queijo cheddar cremoso, bacon crocante e maionese defumada no pão brioche amanteigado.",
      "price": 38.9,
      "category": "principais",
      "badge": "Mais Pedido ⭐",
      "isPopular": true
    }
  ]
}
\`\`\`

Regras de ouro:
- A primeira categoria de "categories" deve ser sempre "Todos".
- Os preços devem ser numéricos (ex: 38.9).
- Cores válidas: "amber", "orange", "rose", "emerald", "violet", "red".
- Formato de styleVariant: "ifood-modern", "bistro-dark", "fresh-clean".
- Mantenha sempre o diálogo envolvente na primeira parte da resposta e o JSON atualizado na segunda parte.`;

/**
 * Executa o chat multimodal do Cardápio Studio com Gemini 3.8 Flash
 */
export async function processCardapioAiChat(
  history: CardapioAiMessage[],
  newMessage: string,
  attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>,
  currentCardapio?: CardapioData | null,
  apiKey?: string,
): Promise<{ replyText: string; updatedCardapio: CardapioData | null }> {
  const key = await resolveCreativeStudioApiKeyAsync(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const formattedContents: any[] = [];

  // Se houver cardápio atual, injeta como contexto para o modelo saber o estado atual
  if (currentCardapio) {
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: `[ESTADO ATUAL DO CARDÁPIO]:\n${JSON.stringify(currentCardapio, null, 2)}\nUse esse estado como base para editar, adicionar ou refinar o que o usuário pedir.`,
        },
      ],
    });
    formattedContents.push({
      role: "model",
      parts: [
        {
          text: `Entendido perfeitamente! Tenho o cardápio do "${currentCardapio.restaurantName}" na ponta da língua. Como você quer turbinar ou ajustar ele agora?`,
        },
      ],
    });
  }

  // Histórico anterior
  for (const msg of history) {
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
    formattedContents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    });
  }

  // Mensagem atual do usuário
  const currentParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentParts.push({ text: newMessage });
  formattedContents.push({
    role: "user",
    parts: currentParts,
  });

  const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash"];
  let rawText = "";

  for (const model of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: {
          systemInstruction: CARDAPIO_AI_SYSTEM_PROMPT,
          temperature: 0.6,
        },
      });
      rawText = res.text?.trim() || "";
      if (rawText) break;
    } catch (err) {
      console.warn(`[CardapioAiService] Falha com modelo ${model}:`, err);
    }
  }

  if (!rawText) {
    throw new Error("A IA do Cardápio não conseguiu processar sua solicitação no momento. Tente novamente.");
  }

  // Extrai o JSON se existir
  let updatedCardapio: CardapioData | null = null;
  const jsonMatch = rawText.match(/```json([\s\S]*?)```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.restaurantName && Array.isArray(parsed.items)) {
        updatedCardapio = parsed as CardapioData;
      }
    } catch (parseErr) {
      console.warn("[CardapioAiService] Erro ao fazer parse do JSON retornado:", parseErr);
    }
  }

  // Limpa o bloco JSON do texto de resposta do chat para ficar agradável e limpo na conversa
  const conversationalText = rawText.replace(/```json[\s\S]*?```/i, "").trim();

  return {
    replyText: conversationalText || "Prontinho! Atualizei o cardápio com os dados que você pediu. Dê uma olhada na prévia ao lado!",
    updatedCardapio,
  };
}

/**
 * Cria ou salva o cardápio diretamente como uma página pública no Supabase (bio_pages)
 */
export async function saveCardapioToBioPage(
  cardapio: CardapioData,
  existingPageId?: string,
): Promise<{ success: boolean; pageId: string; slug: string; publicUrl: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error("Usuário não autenticado para salvar cardápio.");
  }
  const userId = userData.user.id;

  const rawSlug = cardapio.restaurantName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = rawSlug || "cardapio-online";

  // Se não existir ID, verifica se já existe o slug e adiciona sufixo
  if (!existingPageId) {
    const { data: slugCheck } = await supabase
      .from("bio_pages")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugCheck) {
      slug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const payload = {
    user_id: userId,
    slug,
    display_name: cardapio.restaurantName,
    description: cardapio.tagline || cardapio.description,
    whatsapp: cardapio.whatsapp || null,
    template_id: "cardapio-pro",
    published: true,
    social_links: {
      is_cardapio_page: true,
      cardapio_data: cardapio,
      address: cardapio.address,
      opening_hours: cardapio.openingHours,
      delivery_fee: cardapio.deliveryFee,
      min_order: cardapio.minOrder,
    },
    updated_at: new Date().toISOString(),
  };

  let pageId = existingPageId;
  if (pageId) {
    const { error } = await supabase
      .from("bio_pages")
      .update(payload)
      .eq("id", pageId)
      .eq("user_id", userId);
    if (error) throw new Error(`Erro ao atualizar cardápio: ${error.message}`);
  } else {
    const { data: created, error } = await supabase
      .from("bio_pages")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`Erro ao salvar cardápio: ${error.message}`);
    pageId = created.id;
  }

  return {
    success: true,
    pageId: pageId!,
    slug,
    publicUrl: `/p/${slug}`,
  };
}

