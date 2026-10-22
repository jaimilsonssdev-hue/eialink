import { GoogleGenAI } from "@google/genai";
import { resolveCreativeStudioApiKeyAsync } from "@/modules/studiopro/lib/creativeEngineService";
import { supabase } from "@/integrations/supabase/client";

export interface CardapioAddonOption {
  name: string;
  price: number;
}

export interface CardapioItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
  isPopular?: boolean;
  options?: CardapioAddonOption[];
}

export interface CardapioCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface CardapioData {
  restaurantName: string;
  niche:
    | "delivery"
    | "hamburgueria"
    | "pizzaria"
    | "sorveteria"
    | "acai"
    | "bistro"
    | "japones"
    | "churrascaria"
    | "italiana"
    | "padaria"
    | "lanchonete"
    | "restaurante"
    | "geral"
    | string;
  tagline: string;
  description: string;
  whatsapp: string;
  address?: string;
  deliveryFee?: string;
  minOrder?: number;
  openingHours?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  categories: CardapioCategory[];
  items: CardapioItem[];
  themeColor: "amber" | "orange" | "rose" | "emerald" | "violet" | "red" | string;
  styleVariant: "ifood-modern" | "bistro-dark" | "fresh-clean" | string;
  visualEffect?: "glassmorphism" | "neobrutalism" | "elegante" | "parallax" | "clean";
  customFont?: string;
  buttonColor?: string;
  bannerImage?: string;
  backgroundColor?: string;
  logoUrl?: string;
  slug?: string;
  features?: {
    search?: boolean;
    deliveryCep?: boolean;
    cart?: boolean;
    popularSection?: boolean;
    pix?: boolean;
    card?: boolean;
    money?: boolean;
  };
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

const BURGER_PHOTO_IDS = [
  "photo-1568901346375-23c9450c58cd",
  "photo-1586190848861-99aa4a171e90",
  "photo-1550547660-d9450f859349",
];

const NICHE_PHOTO_BANK: Record<
  string,
  { banner: string; logo: string; items: string[] }
> = {
  churrascaria: {
    banner: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    ],
  },
  japones: {
    banner: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    ],
  },
  italiana: {
    banner: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80",
    ],
  },
  padaria: {
    banner: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    ],
  },
  pizzaria: {
    banner: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    ],
  },
  acai: {
    banner: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80",
    ],
  },
  sorveteria: {
    banner: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?auto=format&fit=crop&w=600&q=80",
    ],
  },
  lanchonete: {
    banner: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    ],
  },
  hamburgueria: {
    banner: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    ],
  },
  restaurante: {
    banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    items: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
    ],
  },
};

export function detectCardapioSubNiche(niche?: string, restaurantName?: string): string {
  const combined = `${niche || ""} ${restaurantName || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/churrasc|parrill|espetinh|picanh|costel|assad|carnes/.test(combined)) return "churrascaria";
  if (/japon|sushi|temaki|sashimi|oriental|poke|yakisoba/.test(combined)) return "japones";
  if (/italian|cantina|massa|pasta|lasanh|nhoque|risoto|trattoria/.test(combined)) return "italiana";
  if (/padaria|panificadora|confeitaria|bolo|doceria|doce|croissant|cafe|cafeteria/.test(combined)) return "padaria";
  if (/pizz/.test(combined)) return "pizzaria";
  if (/acai/.test(combined)) return "acai";
  if (/sorvet|gelat|picole/.test(combined)) return "sorveteria";
  if (/hamburg|burger|smash|artesanal/.test(combined)) return "hamburgueria";
  if (/lanchonete|lanche|salgad|pastel|cachorro/.test(combined)) return "lanchonete";
  return "restaurante";
}

export function getCardapioNichePhotos(
  niche?: string,
  restaurantName?: string,
): { banner: string; logo: string; items: string[] } {
  const subKey = detectCardapioSubNiche(niche, restaurantName);
  return NICHE_PHOTO_BANK[subKey] || NICHE_PHOTO_BANK.restaurante;
}

function isBurgerPhotoUrl(url?: string): boolean {
  if (!url) return false;
  return BURGER_PHOTO_IDS.some((id) => url.includes(id));
}

export function sanitizeCardapioPhotosForNiche(
  cardapio: CardapioData,
  leadPhotos?: string[],
): CardapioData {
  const subNiche = detectCardapioSubNiche(cardapio.niche, cardapio.restaurantName);
  const isBurgerNiche = subNiche === "hamburgueria";
  const fallbackBank = getCardapioNichePhotos(cardapio.niche, cardapio.restaurantName);
  const validLeadPhotos = (leadPhotos || []).filter(
    (u) => typeof u === "string" && u.startsWith("http"),
  );

  let bannerImage = cardapio.bannerImage || "";
  if (!bannerImage || (!isBurgerNiche && isBurgerPhotoUrl(bannerImage))) {
    bannerImage = validLeadPhotos[0] || fallbackBank.banner;
  }

  let logoUrl = cardapio.logoUrl || "";
  if (!logoUrl || (!isBurgerNiche && isBurgerPhotoUrl(logoUrl))) {
    logoUrl = validLeadPhotos[1] || validLeadPhotos[0] || fallbackBank.logo;
  }

  const sanitizedItems = (cardapio.items || []).map((item, idx) => {
    let img = item.image || "";
    if (!img || (!isBurgerNiche && isBurgerPhotoUrl(img))) {
      img =
        validLeadPhotos.length > 0
          ? validLeadPhotos[idx % validLeadPhotos.length]
          : fallbackBank.items[idx % fallbackBank.items.length];
    }
    const cleanOptions = Array.isArray(item.options)
      ? item.options
          .filter((o) => o && typeof o.name === "string" && o.name.trim())
          .map((o) => ({ name: o.name.trim(), price: Number(o.price) || 0 }))
      : [];

    return {
      ...item,
      id: item.id || `item-${idx + 1}`,
      price: Number(item.price) || 0,
      image: img,
      options: cleanOptions,
    };
  });

  const categories =
    Array.isArray(cardapio.categories) && cardapio.categories.length > 0
      ? cardapio.categories
      : [
          { id: "todos", name: "Todos", icon: "🍽️" },
          ...Array.from(new Set(sanitizedItems.map((it) => it.category).filter(Boolean))).map(
            (catName, i) => ({
              id: `cat-${i + 1}`,
              name: catName,
              icon: "🍽️",
            }),
          ),
        ];

  if (!categories.some((c) => c.name.toLowerCase() === "todos")) {
    categories.unshift({ id: "todos", name: "Todos", icon: "🍽️" });
  }

  return {
    ...cardapio,
    niche: cardapio.niche || subNiche,
    bannerImage,
    logoUrl,
    categories,
    items: sanitizedItems,
  };
}

export function buildCardapioAiSystemPrompt(niche?: string): string {
  const effectiveNiche = (niche || "gastronomia").trim();
  return `Você é o Diretor de Criação & Growth de Gastronomia do "Gerador de Cardápios Inteligentes" do EIA Link.
Você é especialista no segmento de "${effectiveNiche}" e projeta cardápios digitais de alta conversão estilo iFood.

SEU TOM DE VOZ:
- Seja prestativo, empolgado, humano e profissional.
- Comente sobre os pratos de forma apetitosa e coerente com o nicho "${effectiveNiche}".

REGRAS OBRIGATÓRIAS:
1. **Fidelidade ao Nicho ("${effectiveNiche}")**:
   - Gere categorias, de **8 a 12 itens** com nome, descrição apetitosa e preço realista em R$ típicos especificamente do nicho "${effectiveNiche}" (ex.: churrascaria, restaurante japonês, culinária italiana, padaria/confeitaria, pizzaria, açaí/sorveteria, lanchonete, hamburgueria, bistrô, etc.).
   - Inclua em cada item um array \`"options"\` com adicionais/acompanhamentos coerentes com a categoria daquele prato (ou \`[]\` quando o item não tiver adicionais, como bebidas em lata).
   - NUNCA gere itens ou fotos de hambúrguer se o nicho não for hamburgueria.
   - NUNCA invente avaliações, notas ou depoimentos falsos.
2. **Multimodalidade**: Se o usuário enviar fotos de cardápio impresso ou PDF, extraia fielmente os itens, descrições, preços e categorias.
3. **Estruturação JSON Estrita**:
   SEMPRE que criar ou alterar o cardápio, inclua no final da resposta o bloco JSON completo entre \`\`\`json e \`\`\`:

\`\`\`json
{
  "restaurantName": "Nome do Estabelecimento",
  "niche": "${effectiveNiche}",
  "tagline": "Slogan autêntico para ${effectiveNiche}",
  "description": "Apresentação curta da especialidade da casa",
  "whatsapp": "5511999999999",
  "address": "Endereço do estabelecimento",
  "deliveryFee": "A partir de R$ 5,00",
  "minOrder": 25.0,
  "openingHours": "Terça a Domingo das 18h às 23h",
  "themeColor": "orange",
  "buttonColor": "#f97316",
  "backgroundColor": "#09090b",
  "styleVariant": "ifood-modern",
  "categories": [
    { "id": "todos", "name": "Todos", "icon": "🍽️" },
    { "id": "destaques", "name": "Mais Pedidos", "icon": "⭐" },
    { "id": "cat-1", "name": "Categoria Típica 1", "icon": "🍽️" }
  ],
  "items": [
    {
      "id": "item-1",
      "name": "Prato Típico do Nicho ${effectiveNiche}",
      "description": "Descrição sensorial autêntica com ingredientes típicos de ${effectiveNiche}.",
      "price": 45.9,
      "category": "Categoria Típica 1",
      "badge": "Mais Pedido ⭐",
      "isPopular": true,
      "options": [
        { "name": "Adicional coerente com o prato", "price": 6.0 }
      ]
    }
  ]
}
\`\`\`

Regras de ouro:
- A primeira categoria de "categories" deve ser sempre "Todos".
- O campo "category" de cada item deve corresponder exatamente ao "name" de uma das categorias listadas em "categories".
- Os preços devem ser numéricos (ex: 45.9).`;
}

/**
 * Executa o chat multimodal do Cardápio Studio com Gemini 2.5 Flash
 */
export async function processCardapioAiChat(
  history: CardapioAiMessage[],
  newMessage: string,
  attachments?: Array<{ name: string; mimeType: string; dataBase64: string }>,
  currentCardapio?: CardapioData | null,
  apiKey?: string,
  leadPhotos?: string[],
): Promise<{ replyText: string; updatedCardapio: CardapioData | null }> {
  const key = await resolveCreativeStudioApiKeyAsync(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const formattedContents: any[] = [];

  if (currentCardapio && currentCardapio.items && currentCardapio.items.length > 0) {
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
          text: `Entendido! Tenho o cardápio do "${currentCardapio.restaurantName}" pronto para atualizar.`,
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

  const systemPrompt = buildCardapioAiSystemPrompt(currentCardapio?.niche);
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  let rawText = "";
  let lastErr: any = null;

  for (const model of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 16384,
        },
      });
      rawText = res.text?.trim() || "";
      if (rawText) break;
    } catch (err) {
      lastErr = err;
      console.warn(`[CardapioAiService] Falha com modelo ${model}:`, err);
    }
  }

  if (!rawText) {
    throw new Error(
      lastErr?.message ||
        "A IA do Cardápio não conseguiu processar sua solicitação no momento. Tente novamente.",
    );
  }

  let updatedCardapio: CardapioData | null = null;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let jsonStringCandidate = jsonMatch ? jsonMatch[1].trim() : "";

  if (!jsonStringCandidate) {
    const braceMatch = rawText.match(
      /(\{[\s\S]*"(?:restaurantName|items|backgroundColor|themeColor)"[\s\S]*\})/i,
    );
    if (braceMatch) {
      jsonStringCandidate = braceMatch[1].trim();
    }
  }

  if (jsonStringCandidate) {
    try {
      const parsed = JSON.parse(jsonStringCandidate);
      if (
        parsed &&
        (parsed.restaurantName ||
          Array.isArray(parsed.items) ||
          parsed.backgroundColor ||
          parsed.logoUrl)
      ) {
        const merged: CardapioData = currentCardapio
          ? {
              ...currentCardapio,
              ...parsed,
              categories:
                Array.isArray(parsed.categories) && parsed.categories.length > 0
                  ? parsed.categories
                  : currentCardapio.categories,
              items:
                Array.isArray(parsed.items) && parsed.items.length > 0
                  ? parsed.items
                  : currentCardapio.items,
              features: {
                ...(currentCardapio.features || {}),
                ...(parsed.features || {}),
              },
            }
          : (parsed as CardapioData);

        updatedCardapio = sanitizeCardapioPhotosForNiche(merged, leadPhotos);
      }
    } catch (parseErr) {
      console.warn("[CardapioAiService] Erro ao fazer parse do JSON retornado:", parseErr);
    }
  }

  const conversationalText = rawText
    .replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, "")
    .replace(/\{[\s\S]*"(?:restaurantName|items)"[\s\S]*\}/gi, "")
    .trim();

  return {
    replyText:
      conversationalText ||
      "Prontinho! Atualizei o cardápio com os dados solicitados. Confira a prévia ao lado!",
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

  const rawSlug = (cardapio.restaurantName || "cardapio-online")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = rawSlug || "cardapio-online";

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
