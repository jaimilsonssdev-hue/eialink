import { GoogleGenAI } from "@google/genai";
import { resolveCreativeStudioApiKeyAsync } from "@/modules/studiopro/lib/creativeEngineService";
import { supabase } from "@/integrations/supabase/client";

export interface LojaProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  variations?: string[]; // Ex: ["P", "M", "G"] ou ["Preto", "Branco"]
  isPopular?: boolean;
}

export interface LojaCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface LojaData {
  storeName: string;
  niche: string;
  tagline: string;
  description: string;
  whatsapp: string;
  address?: string;
  shippingInfo?: string; // Ex: "Frete grátis acima de R$ 199 / Entrega local rápida"
  openingHours?: string;
  themeColor?: string;
  styleVariant?: "store-modern" | "boutique-minimal" | "showcase-bold";
  categories: LojaCategory[];
  items: LojaProductItem[];
}

export interface LojaAiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>;
  timestamp: number;
}

const LOJA_SYSTEM_PROMPT = `Você é o Diretor Criativo e Especialista em E-commerce & Varejo do EIA Link.
Sua missão é ajudar o lojista a construir um Catálogo Virtual / Loja Online de altíssima conversão para vendas via WhatsApp, PIX e redes sociais.

Suas diretrizes:
1. Tom de voz: Descontraído, amigável, direto ao ponto e focado em aumentar vendas e autoridade do lojista.
2. Capacidade Multimodal: Você é capaz de analisar fotos de produtos, vitrines, prateleiras, etiquetas de preço, tabelas do Excel ou catálogos em PDF enviados pelo usuário. Extraia com precisão nomes dos produtos, descrições vendedoras, preços e fotos.
3. Se o usuário pedir alterações ("adiciona um tênis", "muda o preço para R$ 99", "cria uma categoria de calçados"), você deve responder amigavelmente no texto E OBRIGATORIAMENTE retornar um bloco JSON com o schema atualizado da loja.
4. O bloco JSON DEVE estar estritamente delimitado por:
\`\`\`json
{
  "storeName": "Nome da Loja",
  "niche": "moda_feminina",
  "tagline": "Slogan de impacto",
  "description": "Apresentação da loja",
  "whatsapp": "5511999999999",
  "address": "Rua Comercial, 123 - Centro",
  "shippingInfo": "Entrega expressa ou retirada no balcão",
  "openingHours": "Segunda a Sábado das 09h às 19h",
  "themeColor": "blue",
  "styleVariant": "store-modern",
  "categories": [
    { "id": "todos", "name": "Todos", "icon": "🛍️" },
    { "id": "novidades", "name": "Novidades", "icon": "✨" }
  ],
  "items": [
    {
      "id": "prod-1",
      "name": "Vestido Midi Floral",
      "description": "Tecido fluido premium com caimento impecável.",
      "price": 149.9,
      "category": "novidades",
      "badge": "Lançamento",
      "isPopular": true,
      "variations": ["P", "M", "G"],
      "image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
    }
  ]
}
\`\`\`

Dê ideias de combos promocionais, títulos chamativos e categorias bem organizadas.`;

export async function processLojaAiChat(
  history: LojaAiMessage[],
  newMessage: string,
  attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>,
  currentLoja?: LojaData | null,
  apiKey?: string,
): Promise<{ replyText: string; updatedLoja: LojaData | null }> {
  const key = await resolveCreativeStudioApiKeyAsync(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const formattedContents: any[] = [];

  if (currentLoja) {
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: `[ESTADO ATUAL DA LOJA]:\n${JSON.stringify(currentLoja, null, 2)}\nUse esse estado como base para editar ou acrescentar produtos.`,
        },
      ],
    });
    formattedContents.push({
      role: "model",
      parts: [
        {
          text: `Perfeito! Já conheço os produtos e a proposta da loja "${currentLoja.storeName}". Como vamos turbinar a vitrine agora?`,
        },
      ],
    });
  }

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
      const response = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: {
          systemInstruction: LOJA_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      rawText = response.text || "";
      if (rawText.trim().length > 0) break;
    } catch (e: any) {
      console.warn(`Tentativa no modelo ${model} falhou:`, e?.message);
    }
  }

  if (!rawText) {
    throw new Error("Não foi possível gerar a resposta com a IA no momento. Verifique sua chave de API ou conexão.");
  }

  let updatedLoja: LojaData | null = null;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.storeName && Array.isArray(parsed.items)) {
        updatedLoja = parsed;
      }
    } catch (parseErr) {
      console.warn("Falha ao parsear JSON da Loja:", parseErr);
    }
  }

  const cleanReply = rawText
    .replace(/```(?:json)?\s*[\s\S]*?\s*```/g, "")
    .trim();

  return {
    replyText: cleanReply || "Vitrine e catálogo atualizados com sucesso!",
    updatedLoja,
  };
}

export async function saveLojaToBioPage(
  loja: LojaData,
  existingPageId?: string,
): Promise<{ success: boolean; pageId: string; slug: string; publicUrl: string }> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const rawSlug = loja.storeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = rawSlug || "loja-online";

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
    display_name: loja.storeName,
    description: loja.tagline || loja.description,
    whatsapp: loja.whatsapp || null,
    template_id: "storefront",
    published: true,
    social_links: {
      is_store_page: true,
      store_data: loja,
      address: loja.address,
      shipping_info: loja.shippingInfo,
      opening_hours: loja.openingHours,
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
    if (error) throw new Error(`Erro ao atualizar loja: ${error.message}`);
  } else {
    const { data: created, error } = await supabase
      .from("bio_pages")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`Erro ao salvar loja: ${error.message}`);
    pageId = created.id;
  }

  return {
    success: true,
    pageId: pageId!,
    slug,
    publicUrl: `/p/${slug}`,
  };
}
