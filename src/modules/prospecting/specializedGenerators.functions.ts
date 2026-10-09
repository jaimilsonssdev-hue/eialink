import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";
import { resolveGeminiApiKeyAsync } from "@/modules/ai/google-ai.service";

export type ProspectNicheCategory = "food" | "shop" | "barber" | "service" | "industry";

export interface NicheActionMeta {
  category: ProspectNicheCategory;
  label: string;
  buttonLabel: string;
  icon: string;
  buttonClass: string;
  loadingLabel: string;
}

/**
 * Classificação rigorosa de nicho para o radar de prospecção.
 * Barbearias e Indústrias/Fábricas são estritamente isoladas com layouts próprios.
 */
export function getProspectNicheCategory(niche?: string | null, name?: string | null): NicheActionMeta {
  const text = `${niche ?? ""} ${name ?? ""}`.toLowerCase();

  // 1. Barbearia & Barber Shop (Prioridade máxima isolada)
  const isBarber = /barbea|barbeir|barber|navalha|\bbarba\b|degrad[eê]|\bfade\b|cabelo\s*masculino/i.test(text);
  if (isBarber) {
    return {
      category: "barber",
      label: "Site Barbearia",
      buttonLabel: "Gerar Barbearia",
      icon: "✂️",
      buttonClass: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
      loadingLabel: "Gerando Barbearia com Agenda",
    };
  }

  // 2. Indústria, Fábrica, B2B, Energia Solar & Manufatura (ex: Fábrica DSun)
  const isIndustry = /f[aá]brica|ind[uú]stria|solar|fotovolt|distribuidor|usinagem|caldeiraria|manufatura|pain[eé]is|metal[uú]rgica|\bdsun\b/i.test(text);
  if (isIndustry) {
    return {
      category: "industry",
      label: "Fábrica & B2B",
      buttonLabel: "Gerar Fábrica/B2B",
      icon: "🏭",
      buttonClass: "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
      loadingLabel: "Montando Site Industrial & Orçamento B2B",
    };
  }

  // 3. Gastronomia, Restaurantes, Delivery e Alimentação
  const isFood = /restauran|lanche|burger|hamburguer|pizza|pizzaria|a[cç]a[ií]|sorvet|delivery|comida|marmita|a[cç]ougue|padaria|confeitaria|sushi|japon[eê]s|churrasco|espetinho|pastel|hot\s*dog|choperia|cervejaria|\bbar\b(?!\s*be)/i.test(text);
  if (isFood) {
    const isIceCream = /sorvet|a[cç]a[ií]|gelato/i.test(text);
    return {
      category: "food",
      label: isIceCream ? "Cardápio Sorveteria" : "Cardápio Delivery",
      buttonLabel: isIceCream ? "Gerar Sorveteria" : "Gerar Cardápio",
      icon: isIceCream ? "🍦" : "🍔",
      buttonClass: isIceCream
        ? "border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"
        : "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20",
      loadingLabel: isIceCream ? "Montando Cardápio de Sorvetes & Açaí" : "Montando Cardápio Delivery Interativo",
    };
  }

  // 4. Comércio, Lojas de Varejo e Vitrines
  const isShop = /loja|moda|roupa|calcado|calçado|otica|ótica|boutique|bijuteria|reloj|acessorio|eletr[oô]nic|celular|smartphone|farmacia|drogaria|pet\s*shop|floricultura|moveis|móveis|colch[oõ]es|auto\s*pe[cç]as/i.test(text);
  if (isShop) {
    return {
      category: "shop",
      label: "Loja & Vitrine",
      buttonLabel: "Gerar Catálogo",
      icon: "🛍️",
      buttonClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
      loadingLabel: "Montando Loja com Sacola",
    };
  }

  // 5. Serviços em Geral, Clínicas, Saúde e Consultórios
  return {
    category: "service",
    label: "Site Profissional",
    buttonLabel: "Gerar Site",
    icon: "🌐",
    buttonClass: "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
    loadingLabel: "Criando Site com Agenda & WhatsApp",
  };
}

export interface ItemOption {
  name: string;
  price: number;
}

export interface SubNicheItem {
  title: string;
  desc: string;
  price: number;
  originalPrice?: number;
  img: string;
  badge?: string;
  category: string;
  isFeatured?: boolean;
  options?: ItemOption[];
}

export interface SubNicheInfo {
  subType: string;
  title: string;
  photos: string[];
  categories: string[];
  items: SubNicheItem[];
}

export function getSubNicheData(
  category: ProspectNicheCategory,
  niche: string,
  businessName: string,
  userPhotos?: string[],
): SubNicheInfo {
  const combined = `${niche} ${businessName}`.toLowerCase();
  const hasUserPhotos = userPhotos && userPhotos.length > 0;

  if (category === "food") {
    // 1. Sorveteria & Açaí
    if (/sorvet|gelat|picol[eé]|aça[ií]|acai/i.test(combined)) {
      const photos = hasUserPhotos
        ? userPhotos
        : [
            "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
          ];
      return {
        subType: "icecream",
        title: "Sorveteria & Açaí Artesanal",
        photos,
        categories: ["Todos", "Taças Especiais", "Açaí na Tigela", "Cascões & Gelatos", "Milk Shakes"],
        items: [
          {
            title: "Taça Suprema de Ninho com Nutella",
            desc: "Gelato artesanal cremoso, generosa camada de Nutella, morangos selecionados e leite Ninho.",
            price: 28.9,
            img: photos[1] || photos[0],
            badge: "Mais Pedido ⭐",
            category: "Taças Especiais",
          },
          {
            title: "Tigela de Açaí Especial 500ml",
            desc: "Açaí cremoso batido na hora, fatias de banana, morango, granola crocante e leite condensado.",
            price: 24.5,
            img: photos[2] || photos[0],
            badge: "Destaque",
            category: "Açaí na Tigela",
          },
          {
            title: "Cascão Gourmet Waffle Recheado",
            desc: "Cascão crocante artesanal recheado com calda quente de chocolate e 2 bolas de gelato à sua escolha.",
            price: 18.0,
            img: photos[0],
            badge: "Artesanal",
            category: "Cascões & Gelatos",
          },
          {
            title: "Milk Shake Belga Cremoso 400ml",
            desc: "Batido na hora com sorvete de chocolate belga premium, chantilly fresco e calda trufada.",
            price: 22.0,
            img: photos[3] || photos[0],
            badge: "Refrescante",
            category: "Milk Shakes",
          },
        ],
      };
    }

    // 2. Pizzaria
    if (/pizza/i.test(combined)) {
      const photos = hasUserPhotos
        ? userPhotos
        : [
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
          ];
      return {
        subType: "pizza",
        title: "Pizzaria Artesanal no Forno a Lenha",
        photos,
        categories: ["Todos", "Mais Pedidas", "Especiais", "Pizzas Doces"],
        items: [
          {
            title: "Pizza Calabresa Especial com Catupiry",
            desc: "Massa de fermentação lenta 48h, molho de tomate pelati, calabresa defumada artesanal e Catupiry legítimo.",
            price: 49.9,
            img: photos[0],
            badge: "Top 1 🏆",
            category: "Mais Pedidas",
          },
          {
            title: "Pizza Quatro Queijos Premium",
            desc: "Muçarela especial, provolone defumado, gorgonzola italiano e Catupiry gratinado.",
            price: 54.9,
            img: photos[2] || photos[0],
            badge: "Clássica",
            category: "Especiais",
          },
          {
            title: "Pizza Doce Nutella com Morango",
            desc: "Creme de avelã Nutella pura com fatias generosas de morango fresco e castanhas crocantes.",
            price: 42.0,
            img: photos[1] || photos[0],
            badge: "Sobremesa",
            category: "Pizzas Doces",
          },
        ],
      };
    }

    // 3. Japonês & Sushi
    if (/sushi|japon|oriental|poke|temaki/i.test(combined)) {
      const photos = hasUserPhotos
        ? userPhotos
        : [
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
          ];
      return {
        subType: "japanese",
        title: "Culinária Japonesa & Sushi Bar",
        photos,
        categories: ["Todos", "Combinados", "Temakis", "Hot Rolls"],
        items: [
          {
            title: "Combinado Salmão Especial 20 Peças",
            desc: "8 sashimis de salmão maçaricado, 4 niguiris com azeite trufado, 4 uramakis e 4 hossomakis.",
            price: 69.9,
            img: photos[0],
            badge: "Mais Vendido ⭐",
            category: "Combinados",
          },
          {
            title: "Temaki Salmão Completo com Cream Cheese",
            desc: "Alga nori crocante, salmão fresco em cubos, cream cheese Philadelphia e cebolinha verde.",
            price: 29.9,
            img: photos[1] || photos[0],
            badge: "Individual",
            category: "Temakis",
          },
          {
            title: "Hot Roll Philadelphia 10 Unidades",
            desc: "Enrolado empanado crocante recheado de salmão com cream cheese, finalizado com molho tarê e gergelim.",
            price: 32.0,
            img: photos[2] || photos[0],
            badge: "Crocante",
            category: "Hot Rolls",
          },
        ],
      };
    }

    // 4. Padrão Burger / Hamburgueria
    const photos = hasUserPhotos
      ? userPhotos
      : [
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        ];
    return {
      subType: "burger",
      title: "Hamburgueria Artesanal & Delivery",
      photos,
      categories: ["Todos", "Smash Burgers", "Combos Artesanais", "Porções & Batatas"],
      items: [
        {
          title: "Smash Burger Duplo Cheddar",
          desc: "2 blends de 90g prensados na chapa, queijo cheddar derretido, cebola caramelizada e maionese defumada no pão brioche.",
          price: 34.9,
          img: photos[1] || photos[0],
          badge: "Mais Pedido ⭐",
          category: "Smash Burgers",
        },
        {
          title: "Combo Artesanal Bacon & Fritas",
          desc: "Blend 160g suculento, fatias de bacon crocante, queijo prato, picles e molho especial + Batata Frita individual.",
          price: 46.9,
          img: photos[2] || photos[0],
          badge: "Combo Completo",
          category: "Combos Artesanais",
        },
        {
          title: "Batata Rústica com Costela Desfiada",
          desc: "Porção generosa de batatas rústicas com tempero da casa, costela desfiada na cerveja preta e fondue de queijo.",
          price: 36.0,
          img: photos[0],
          badge: "Para Compartilhar",
          category: "Porções & Batatas",
        },
      ],
    };
  }

  if (category === "barber") {
    const photos = hasUserPhotos
      ? userPhotos
      : [
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
        ];
    return {
      subType: "barber",
      title: "Barbearia Clássica & Estilo Masculino",
      photos,
      categories: ["Todos", "Cortes de Cabelo", "Barba & Terapia", "Combos VIP"],
      items: [
        {
          title: "Corte Fade / Degradê na Navalha",
          desc: "Corte moderno personalizado com técnica de tesoura e máquina, acabamento preciso na navalha e pomada modeladora.",
          price: 45.0,
          img: photos[1] || photos[0],
          badge: "Destaque",
          category: "Cortes de Cabelo",
        },
        {
          title: "Barba Terapia com Toalha Quente",
          desc: "Modelagem completa da barba, esfoliação facial, vapor de ozônio, toalha quente aromática e óleo hidratante.",
          price: 40.0,
          img: photos[2] || photos[0],
          badge: "Relaxamento",
          category: "Barba & Terapia",
        },
        {
          title: "Combo VIP: Cabelo + Barba + Sobrancelha",
          desc: "Experiência completa de cuidado masculino com corte, barba terapia, alinhamento de sobrancelha e cerveja cortesia.",
          price: 75.0,
          img: photos[0],
          badge: "Mais Procurado ⭐",
          category: "Combos VIP",
        },
      ],
    };
  }

  // Indústria, Fábrica, Energia Solar & B2B
  if (category === "industry") {
    const isSolar = /solar|fotovolt|pain[eé]is|energia|dsun/i.test(combined);
    const photos = hasUserPhotos
      ? userPhotos
      : isSolar
      ? [
          "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1545208942-e1c9c916524b?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80",
        ]
      : [
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        ];

    return {
      subType: isSolar ? "solar" : "industry",
      title: isSolar ? "Fabricação & Soluções em Energia Solar B2B" : "Indústria & Manufatura de Alta Precisão",
      photos,
      categories: ["Todos", "Equipamentos & Módulos", "Sistemas & Soluções", "Projetos de Engenharia"],
      items: isSolar
        ? [
            {
              title: "Módulos Fotovoltaicos Monocristalinos Tier 1",
              desc: "Painéis solares de alta eficiência energética (550W+), tecnologia half-cell e garantia de performance de 25 anos.",
              price: 680.0,
              img: photos[0],
              badge: "Alta Eficiência ⚡",
              category: "Equipamentos & Módulos",
            },
            {
              title: "Inversores Fotovoltaicos On-Grid e Híbridos Trifásicos",
              desc: "Equipamentos com certificação Inmetro, monitoramento inteligente via Wi-Fi e proteção contra surtos.",
              price: 3450.0,
              img: photos[1] || photos[0],
              badge: "Garantia 10 Anos",
              category: "Sistemas & Soluções",
            },
            {
              title: "Estruturas de Fixação em Alumínio Estrutural e Aço Galvanizado",
              desc: "Suportes reforçados com alta resistência a intempéries e ventos fortes, adequados para solo e telhados industriais.",
              price: 490.0,
              img: photos[2] || photos[0],
              badge: "Norma NBR",
              category: "Equipamentos & Módulos",
            },
            {
              title: "Projeto de Engenharia Turnkey & Homologação",
              desc: "Dimensionamento técnico, elaboração de ART, memorial descritivo e aprovação completa junto à concessionária de energia.",
              price: 1800.0,
              img: photos[3] || photos[0],
              badge: "Corporativo B2B",
              category: "Projetos de Engenharia",
            },
          ]
        : [
            {
              title: "Equipamentos Industriais Sob Demanda",
              desc: "Fabricação sob medida conforme desenho técnico e rigorosos padrões de controle de qualidade.",
              price: 2500.0,
              img: photos[0],
              badge: "ISO 9001",
              category: "Equipamentos & Módulos",
            },
            {
              title: "Manufatura & Usinagem de Precisão",
              desc: "Processos industriais de alta repetibilidade com maquinário CNC de última geração e tolerâncias micrométricas.",
              price: 1200.0,
              img: photos[1] || photos[0],
              badge: "Alta Precisão",
              category: "Sistemas & Soluções",
            },
          ],
    };
  }

  // Demais nichos (Clínicas, Consultórios, Serviços em Geral)
  const photos = hasUserPhotos
    ? userPhotos
    : [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      ];
  return {
    subType: "service",
    title: "Serviços Especializados de Excelência",
    photos,
    categories: ["Todos", "Atendimento Especializado", "Procedimentos"],
    items: [
      {
        title: "Avaliação & Diagnóstico Personalizado",
        desc: "Análise minuciosa com equipe qualificada e direcionamento sob medida para sua necessidade.",
        price: 150.0,
        img: photos[0],
        badge: "Principal",
        category: "Atendimento Especializado",
      },
      {
        title: "Procedimento Especializado de Alta Performance",
        desc: "Execução com protocolos avançados, tecnologia moderna e total conforto e segurança.",
        price: 250.0,
        img: photos[1] || photos[0],
        badge: "Recomendado",
        category: "Procedimentos",
      },
    ],
  };
}

export function enrichItemsWithOptions(items: SubNicheItem[], subType: string): SubNicheItem[] {
  return items.map((it, idx) => {
    const isFeatured = idx < 2 || Boolean(it.badge?.includes("Mais") || it.badge?.includes("Top") || it.badge?.includes("1"));
    if (it.options && it.options.length > 0) {
      return { ...it, isFeatured };
    }

    let defaultOptions: ItemOption[] = [];
    if (subType === "icecream") {
      defaultOptions = [
        { name: "Leite Ninho Extra", price: 3.0 },
        { name: "Nutella Pura Especial", price: 5.0 },
        { name: "Morangos Frescos Selecionados", price: 4.0 },
        { name: "Granola Crocante Tradicional", price: 2.0 },
        { name: "Paçoca Artesanal Triturada", price: 2.5 },
      ];
    } else if (subType === "burger") {
      defaultOptions = [
        { name: "Bacon Crocante Duplo", price: 5.0 },
        { name: "Cheddar Melt Cremoso Extra", price: 4.0 },
        { name: "Maionese Especial da Casa (Pote)", price: 3.5 },
        { name: "Cebola Caramelizada", price: 3.0 },
        { name: "Batata Frita Individual Crocante", price: 9.9 },
      ];
    } else if (subType === "pizza") {
      defaultOptions = [
        { name: "Borda Catupiry Legítimo Recheada", price: 12.0 },
        { name: "Borda Cheddar Cremoso Recheada", price: 10.0 },
        { name: "Bacon Crocante Salpicado Extra", price: 6.0 },
        { name: "Parmesão Italiano Gratinado", price: 5.0 },
      ];
    } else if (subType === "japanese") {
      defaultOptions = [
        { name: "Cream Cheese Philadelphia Extra", price: 5.0 },
        { name: "Molho Tarê Artesanal (Pote)", price: 3.0 },
        { name: "Gengibre e Wasabi Extra", price: 4.0 },
        { name: "Crispy de Couve Crocante", price: 3.5 },
      ];
    } else if (subType === "clothing" || subType === "fashion" || subType === "shop" || subType === "store") {
      defaultOptions = [
        { name: "Embalagem Especial com Laço para Presente", price: 5.0 },
        { name: "Sacola Ecológica Reforçada", price: 3.5 },
        { name: "Cartão de Dedicatória com Mensagem", price: 2.5 },
      ];
    } else {
      defaultOptions = [
        { name: "Complemento Especial da Casa", price: 4.0 },
        { name: "Molho / Acompanhamento Extra", price: 3.5 },
        { name: "Bebida Refrigerante Lata Gelada", price: 6.0 },
      ];
    }

    return {
      ...it,
      isFeatured,
      options: defaultOptions,
    };
  });
}

export interface GenerateSpecializedInput {
  companyId?: string;
  businessName: string;
  niche: string;
  city: string;
  whatsapp?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  instagram?: string;
  photos?: string[];
  forceCategory?: ProspectNicheCategory;
  clientGeminiKey?: string;
}

/**
 * Endpoint de Servidor Dedicado: 'Clicou, Gerou'
 * Identifica o nicho, consulta o Gemini para textos e produtos hiperpersonalizados,
 * e gera o site completo com agenda funcional, catálogo e carrinho interativo.
 */
export const generateSpecializedProspectSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: GenerateSpecializedInput) => input)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const category = data.forceCategory || getProspectNicheCategory(data.niche, data.businessName).category;
    const subNiche = getSubNicheData(category, data.niche, data.businessName, data.photos);

    const slugBase = (data.businessName || "pagina")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalSlug = `${slugBase}-${randomSuffix}`;
    const cleanWhatsapp = (data.whatsapp || "").replace(/\D/g, "");
    const destinationAddress = data.address || `${data.city}, Brasil`;
    const encodedAddress = encodeURIComponent(destinationAddress);

    // 1. Resolve chave do Gemini do cliente / auth / env
    let apiKey: string | undefined = (data.clientGeminiKey || "").trim() || undefined;
    if (!apiKey) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        apiKey = userData?.user?.user_metadata?.gemini_api_key;
      } catch {
        // fallback
      }
    }
    if (!apiKey) {
      apiKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }

    // 2. Aciona o Gemini para enriquecer itens e títulos de forma inteligente em JSON
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `Você é um Estrategista Especialista em Negócios Locais, Cardápios e Serviços.
Gere informações estruturadas em JSON estrito para a empresa "${data.businessName}", atuando no nicho "${data.niche}" (Subtipo: ${subNiche.subType}) em "${data.city}".
O JSON deve ter EXATAMENTE este formato:
{
  "title": "Título apetitoso ou marcante do estabelecimento",
  "categories": ["Todos", "Categoria 1", "Categoria 2", "Categoria 3"],
  "items": [
    {
      "title": "Nome autêntico e específico do item/serviço",
      "desc": "Descrição apetitosa e envolvente com ingredientes ou detalhes técnicos",
      "price": 29.90,
      "category": "Categoria 1",
      "badge": "Mais Pedido ⭐"
    }
  ]
}
Regras:
1. Gere entre 4 a 6 itens estritamente condizentes com a especialidade "${subNiche.title}".
2. Se for Sorveteria/Açaí, NUNCA gere hambúrguer ou pizza! Gere taças, açaí, picolés e gelatos.
3. Se for Barbearia, gere cortes, barba terapia, combos e tratamentos.
4. A primeira categoria de "categories" DEVE ser "Todos".`;

        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini 12s")), 12000),
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response.text?.trim() || "";
        const parsed = JSON.parse(text);

        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          subNiche.items = parsed.items.map((it: any, idx: number) => ({
            title: it.title || "Item Especial",
            desc: it.desc || "",
            price: typeof it.price === "number" ? it.price : 25.0,
            img: subNiche.photos[idx % subNiche.photos.length],
            badge: it.badge || undefined,
            category: it.category || subNiche.categories[1] || "Destaques",
          }));
          if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            subNiche.categories = parsed.categories[0] === "Todos" ? parsed.categories : ["Todos", ...parsed.categories];
          }
          if (parsed.title) subNiche.title = parsed.title;
        }
      } catch (geminiErr) {
        console.warn("[SpecializedGenerators] Gemini fallback para acervo de alta fidelidade:", geminiErr);
      }
    }

    // 3. Constrói o HTML com base na arquitetura determinística 100% interativa
    let generatedHtml = "";
    subNiche.items = enrichItemsWithOptions(subNiche.items, subNiche.subType);

    if (category === "food") {
      generatedHtml = buildFoodDeliveryHtml({
        businessName: data.businessName,
        city: data.city,
        cleanWhatsapp,
        destinationAddress,
        encodedAddress,
        rating: data.rating ?? 4.9,
        reviewsCount: data.reviewsCount ?? 120,
        subNiche,
        finalSlug,
      });
    } else if (category === "barber") {
      generatedHtml = buildBarberShopHtml({
        businessName: data.businessName,
        city: data.city,
        cleanWhatsapp,
        destinationAddress,
        encodedAddress,
        rating: data.rating ?? 4.9,
        reviewsCount: data.reviewsCount ?? 80,
        subNiche,
        finalSlug,
      });
    } else if (category === "shop") {
      generatedHtml = buildShopCatalogHtml({
        businessName: data.businessName,
        city: data.city,
        niche: data.niche,
        cleanWhatsapp,
        destinationAddress,
        encodedAddress,
        subNiche,
        finalSlug,
      });
    } else if (category === "industry") {
      generatedHtml = buildIndustryB2bHtml({
        businessName: data.businessName,
        city: data.city,
        niche: data.niche,
        cleanWhatsapp,
        destinationAddress,
        encodedAddress,
        rating: data.rating ?? 4.9,
        reviewsCount: data.reviewsCount ?? 120,
        subNiche,
        finalSlug,
      });
    } else {
      generatedHtml = buildServiceProHtml({
        businessName: data.businessName,
        city: data.city,
        niche: data.niche,
        cleanWhatsapp,
        destinationAddress,
        encodedAddress,
        rating: data.rating ?? 4.9,
        subNiche,
        finalSlug,
      });
    }

    // 4. Salva a página na tabela bio_pages
    const templateId =
      category === "food"
        ? "restaurant-menu"
        : category === "barber"
        ? "site-maquina"
        : category === "shop"
        ? "store-showcase"
        : "site-maquina";

    const isBookingNiche = category === "barber" || category === "service";

    const assistantPrompt = category === "industry"
      ? `Você é o especialista comercial da empresa "${data.businessName}". Seu papel é atender empresas e parceiros com excelência, tirar dúvidas técnicas sobre equipamentos, energia solar e soluções industriais, e encaminhar solicitações de orçamento para o WhatsApp (${cleanWhatsapp}).`
      : category === "food"
      ? `Você é a atendente virtual oficial da empresa "${data.businessName}". Seu papel é recepcionar os clientes com cordialidade, tirar dúvidas sobre o cardápio e encaminhar pedidos para a sacola online ou WhatsApp (${cleanWhatsapp}).`
      : category === "barber"
      ? `Você é o assistente virtual da barbearia "${data.businessName}". Seu papel é tirar dúvidas sobre cortes e barba e direcionar para o agendamento online (/agendar/${finalSlug}) ou WhatsApp (${cleanWhatsapp}).`
      : `Você é a atendente virtual oficial da empresa "${data.businessName}", localizada em ${destinationAddress}.
Seu papel é recepcionar os clientes com cordialidade, tirar dúvidas sobre os serviços e direcionar para o WhatsApp (${cleanWhatsapp}) ou agendamento online (/agendar/${finalSlug}).`;

    const { data: page, error: pageErr } = await supabase
      .from("bio_pages")
      .insert({
        user_id: context.userId,
        slug: finalSlug,
        display_name: data.businessName,
        description: `${data.niche} em ${data.city}. Conheça nossos produtos e serviços e fale conosco.`,
        whatsapp: cleanWhatsapp,
        published: true,
        template_id: templateId,
        theme: category === "food" ? "amber" : category === "barber" ? "dark" : category === "shop" ? "rose" : category === "industry" ? "sky" : "emerald",
        social_links: {
          is_demo: true,
          category,
          sub_type: subNiche.subType,
          niche: data.niche,
          city: data.city,
          address: destinationAddress,
          google_rating: data.rating || 4.9,
          reviews_count: data.reviewsCount || 120,
          photos: subNiche.photos,
          custom_html: generatedHtml,
          agenda_enabled: isBookingNiche,
          booking_active: isBookingNiche,
          ai_chat_enabled: true,
          ai_concierge_enabled: true,
          whatsapp_enabled: true,
          gps_enabled: true,
          assistant_name: `${data.businessName} - Atendente`,
          assistant_prompt: assistantPrompt,
          suggested_services: subNiche.items.map((it) => ({
            name: it.title,
            description: it.desc,
            price: it.price,
            image_url: it.img,
            badge: it.badge || "Destaque",
          })),
        } as any,
      })
      .select("id, slug")
      .single();

    if (pageErr) {
      console.error("[generateSpecializedProspectSiteFn] Erro ao salvar página:", pageErr);
      throw new Error(`Falha ao salvar página: ${pageErr.message}`);
    }

    // 5. Cadastra agenda pronta apenas se for nicho de serviço com agendamento
    if (isBookingNiche) {
      try {
        await (supabase as any).from("booking_settings").insert({
          bio_page_id: page.id,
          active: true,
          timezone: "America/Sao_Paulo",
          slot_interval_minutes: 30,
          min_notice_hours: 1,
          max_days_ahead: 30,
        });

        const weekdays = [1, 2, 3, 4, 5, 6];
        await (supabase as any).from("booking_availability").insert(
          weekdays.map((day) => ({
            bio_page_id: page.id,
            weekday: day,
            start_time: "08:00",
            end_time: day === 6 ? "13:00" : "18:00",
            active: true,
          })),
        );

        const bookingServices = subNiche.items.slice(0, 6).map((item, idx) => ({
          bio_page_id: page.id,
          name: item.title,
          description: item.desc,
          duration_minutes: category === "barber" ? (item.title.toLowerCase().includes("combo") ? 60 : 35) : 30,
          price: item.price,
          position: idx,
          active: true,
        }));
        await (supabase as any).from("booking_services").insert(bookingServices);
      } catch (bookingErr) {
        console.warn("[generateSpecializedProspectSiteFn] Aviso ao popular agenda:", bookingErr);
      }
    }

    // 6. Cadastra produtos no catálogo para visualização e edição no dashboard
    try {
      const catalogInserts = subNiche.items.map((item, idx) => ({
        bio_page_id: page.id,
        name: item.title,
        description: item.desc,
        price: item.price,
        image_url: item.img || null,
        button_label: isBookingNiche
          ? "Agendar"
          : category === "industry"
          ? "Solicitar Orçamento"
          : "Adicionar à Sacola",
        button_url: isBookingNiche ? `/agendar/${page.slug}` : null,
        type: category === "food" || category === "shop" || category === "industry" ? "product" : "service",
        position: idx,
        active: true,
      }));
      await (supabase as any).from("catalog_items").insert(catalogInserts);
    } catch (catalogErr) {
      console.warn("[generateSpecializedProspectSiteFn] Aviso ao popular catálogo:", catalogErr);
    }

    // 7. Atualiza lead na prospecção com o link gerado
    if (data.companyId) {
      try {
        await supabase
          .from("prospected_companies")
          .update({
            notes: `[Demo Gerada: /p/${finalSlug}] [Modelo: ${templateId}]`,
            status: "contatado" as any,
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", data.companyId);
      } catch (leadErr) {
        console.warn("[generateSpecializedProspectSiteFn] Aviso ao atualizar lead:", leadErr);
      }
    }

    return {
      success: true,
      pageId: page.id,
      slug: page.slug,
      url: `/p/${page.slug}`,
      category,
      subType: subNiche.subType,
    };
  });

/**
 * Construtor HTML Especializado para Delivery & Cardápios estilo iFood
 * Inclui: Modal de Produto com Adicionais, Carrossel de Destaques, Faixa de Cupons, Fidelidade e Sacola Interativa
 */
function buildFoodDeliveryHtml(opts: {
  businessName: string;
  city: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  rating: number;
  reviewsCount: number;
  subNiche: SubNicheInfo;
  finalSlug: string;
}): string {
  const { businessName, cleanWhatsapp, destinationAddress, encodedAddress, rating, reviewsCount, subNiche, finalSlug } = opts;
  const itemsJson = JSON.stringify(subNiche.items);

  // Seleciona itens em destaque para o carrossel superior
  const featuredItems = subNiche.items.filter((it, idx) => it.isFeatured || idx < 3);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>Cardápio Digital — ${businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-28 selection:bg-amber-500 selection:text-black">
  <!-- Banner de Capa -->
  <div class="relative h-44 sm:h-56 bg-zinc-900 overflow-hidden">
    <img src="${subNiche.photos[0]}" class="w-full h-full object-cover opacity-60" alt="${businessName}">
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
  </div>

  <div class="max-w-xl mx-auto px-4 -mt-14 relative z-10 space-y-4">
    <!-- Card Principal do Estabelecimento (Estilo iFood) -->
    <div class="bg-zinc-900/95 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-2xl relative">
      <div class="flex items-center gap-3">
        <div class="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-950 overflow-hidden shadow-xl shrink-0 -mt-10 relative z-20">
          <img src="${subNiche.photos[1] || subNiche.photos[0]}" class="w-full h-full object-cover" alt="Logo">
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">🟢 Aberto Agora</span>
            <span class="text-[11px] text-zinc-400">⏱️ 30-45 min</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight truncate">${businessName}</h1>
        </div>
      </div>

      <p class="text-xs text-zinc-400 mt-2.5">${subNiche.title} · ${destinationAddress}</p>

      <div class="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
        <span class="text-amber-400 font-bold flex items-center gap-1">
          <span>★</span> ${rating} <span class="text-zinc-500 font-normal">(${reviewsCount} avaliações)</span>
        </span>
        <div class="flex items-center gap-3">
          <span class="text-emerald-400 font-semibold flex items-center gap-1">🛵 Entrega R$ 5,00</span>
          <a href="https://wa.me/${cleanWhatsapp}" target="_blank" class="text-zinc-300 hover:text-white hover:underline flex items-center gap-1 text-[11px]">WhatsApp →</a>
        </div>
      </div>
    </div>

    <!-- Faixa de Cupom de Boas-Vindas -->
    <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg shrink-0 border border-amber-500/30">
          🎟️
        </div>
        <div class="min-w-0">
          <div class="text-xs font-black text-white flex items-center gap-1.5">
            <span>10% OFF no seu Pedido</span>
            <span class="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">Novo</span>
          </div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Cupom: <span class="font-mono font-bold text-amber-300">BEMVINDO10</span></div>
        </div>
      </div>
      <button type="button" id="btn-coupon" onclick="toggleWelcomeCoupon()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md">
        Aplicar
      </button>
    </div>

    <!-- Banner do Programa de Fidelidade Integrado -->
    <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-base shrink-0 border border-purple-500/30">
          🎁
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-white truncate">Clube de Fidelidade & Pontos</div>
          <div class="text-[10px] text-zinc-400">Ganhe 1 ponto a cada R$ 1 gasto aqui</div>
        </div>
      </div>
      <button type="button" onclick="openLoyaltyModal()" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold transition-all shrink-0 cursor-pointer">
        Ver Saldo
      </button>
    </div>

    <!-- Carrossel de Destaques (Mais Vendidos da Casa) -->
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2.5 px-0.5">
        <div class="flex items-center gap-1.5">
          <span class="text-base">⭐</span>
          <h2 class="text-sm font-black text-white tracking-tight">Mais Pedidos da Casa</h2>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">Destaques</span>
        </div>
        <span class="text-[10px] text-zinc-500 font-medium">Toque para ver</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
        ${featuredItems
          .map(
            (item) => {
              const originalIdx = subNiche.items.findIndex(it => it.title === item.title);
              return `
          <div onclick="openProductDetailModal(${originalIdx >= 0 ? originalIdx : 0})" class="snap-start w-56 shrink-0 rounded-2xl bg-zinc-900/90 border border-white/10 p-3 flex flex-col justify-between hover:border-amber-500/40 transition-all cursor-pointer group shadow-lg">
            <div class="space-y-2">
              <div class="relative h-28 rounded-xl overflow-hidden bg-zinc-950">
                <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${item.title}">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-black uppercase tracking-wider shadow-md">Mais Vendido 🏆</span>
              </div>
              <div>
                <h3 class="font-bold text-xs text-zinc-100 line-clamp-1">${item.title}</h3>
                <p class="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">${item.desc}</p>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
              <span class="font-black text-emerald-400 text-xs">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] font-bold group-hover:bg-amber-500 group-hover:text-black transition-colors">+ Opções</span>
            </div>
          </div>
        `;
            }
          )
          .join("")}
      </div>
    </div>

    <!-- Navegação de Categorias Funcional -->
    <div class="pt-2">
      <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="category-pills">
        <button type="button" onclick="filterCategory('Todos', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-amber-500 text-black font-bold shadow-md">Todos</button>
        <button type="button" onclick="filterCategory('Mais Pedidos', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">🔥 Mais Pedidos</button>
        ${subNiche.categories
          .filter(c => c !== "Todos")
          .map(
            (cat) =>
              `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">${cat}</button>`,
          )
          .join("")}
      </div>
    </div>

    <!-- Itens do Cardápio Interativos com Layout iFood -->
    <div class="space-y-3" id="products-container">
      ${subNiche.items
        .map(
          (item, idx) => `
        <div onclick="openProductDetailModal(${idx})" class="product-card flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-white/10 gap-3 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm" data-category="${item.category || ''}" data-featured="${item.isFeatured ? 'true' : 'false'}">
          <div class="flex-1 min-w-0">
            ${item.badge ? `<span class="text-[9px] font-black text-amber-400 uppercase tracking-wider">${item.badge}</span>` : ""}
            <h3 class="font-bold text-sm text-zinc-100 mt-0.5 group-hover:text-amber-300 transition-colors">${item.title}</h3>
            <p class="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">${item.desc}</p>
            <div class="mt-2.5 flex items-center gap-3">
              <span class="font-black text-emerald-400 text-sm">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <span class="text-[11px] font-bold text-amber-400 group-hover:underline flex items-center gap-0.5">
                <span>Personalizar & Adicionar</span>
                <span>→</span>
              </span>
            </div>
          </div>
          <div class="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950">
            <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${item.title}">
            <div class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-md">+</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>

    <!-- Localização & GPS -->
    <div class="mt-8 p-4 rounded-2xl bg-zinc-900 border border-white/10">
      <h3 class="font-bold text-sm text-zinc-100 mb-1">📍 Localização & Horários</h3>
      <p class="text-xs text-zinc-400 mb-3">${destinationAddress}</p>
      <div class="grid grid-cols-2 gap-2">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="py-2 px-3 rounded-xl bg-zinc-800 text-center text-xs font-semibold hover:bg-zinc-700 text-zinc-200 transition-all">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="py-2 px-3 rounded-xl bg-cyan-500/10 text-center text-xs font-semibold hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all">Waze</a>
      </div>
    </div>
  </div>

  <!-- Barra Flutuante Reativa da Sacola -->
  <div id="cart-floating-bar" style="display: none;" class="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40 transition-all duration-300">
    <button type="button" onclick="openCartModal()" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-500 text-black font-bold text-sm shadow-2xl hover:bg-emerald-400 transition-all cursor-pointer">
      <div class="flex items-center gap-2">
        <span class="text-base">🛍️</span>
        <span id="cart-count">1 item</span>
      </div>
      <div class="flex items-center gap-2">
        <span id="cart-total" class="font-black">R$ 0,00</span>
        <span>· Ver Sacola →</span>
      </div>
    </button>
  </div>

  <!-- MODAL 1: DETALHES DO PRODUTO ESTILO IFOOD (Foto Grande, Adicionais e Observação) -->
  <div id="product-detail-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Capa do Produto com Botão Fechar -->
      <div class="relative h-48 sm:h-56 bg-zinc-950 shrink-0">
        <img id="detail-modal-img" src="" class="w-full h-full object-cover" alt="">
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40"></div>
        <button type="button" onclick="closeProductDetailModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center text-sm cursor-pointer z-10">✕</button>
        <div class="absolute bottom-3 left-4 right-4">
          <span id="detail-modal-badge" class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black uppercase tracking-wider inline-block mb-1">Destaque</span>
          <h2 id="detail-modal-title" class="text-lg sm:text-xl font-black text-white leading-tight"></h2>
        </div>
      </div>

      <!-- Conteúdo com Scroll: Descrição + Opcionais + Obs -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        <div>
          <p id="detail-modal-desc" class="text-xs sm:text-sm text-zinc-300 leading-relaxed"></p>
          <div class="mt-2 text-sm font-black text-emerald-400">
            A partir de: <span id="detail-modal-base-price">R$ 0,00</span>
          </div>
        </div>

        <!-- Seção de Adicionais & Complementos -->
        <div id="detail-addons-section" class="pt-3 border-t border-white/10 space-y-2.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>✨ Adicionais & Acompanhamentos</span>
            </h3>
            <span class="text-[10px] text-zinc-400">Opcional</span>
          </div>
          <div id="detail-addons-list" class="space-y-2"></div>
        </div>

        <!-- Observações do Item -->
        <div class="pt-3 border-t border-white/10 space-y-1.5">
          <label class="block text-xs font-bold text-white">Alguma observação?</label>
          <textarea id="detail-item-notes" rows="2" placeholder="Ex: Sem talher plástico, caprichar na calda, bem gelado..." class="w-full p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"></textarea>
        </div>
      </div>

      <!-- Rodapé Fixo do Modal de Produto (Quantidade + Botão Adicionar) -->
      <div class="p-4 bg-zinc-950 border-t border-white/10 flex items-center gap-3 shrink-0">
        <div class="flex items-center gap-2 bg-zinc-800 rounded-xl p-1 border border-white/10">
          <button type="button" onclick="changeDetailQty(-1)" class="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95">-</button>
          <span id="detail-qty-display" class="w-6 text-center text-xs font-black text-white">1</span>
          <button type="button" onclick="changeDetailQty(1)" class="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95">+</button>
        </div>
        <button type="button" onclick="confirmAddProductToCart()" class="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-between cursor-pointer active:scale-95">
          <span>Adicionar ao Pedido</span>
          <span id="detail-total-btn-price" class="font-black">R$ 0,00</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: SACOLA & CHECKOUT WHATSAPP -->
  <div id="cart-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <span>🛍️ Sua Sacola de Pedido</span>
        </h2>
        <button type="button" onclick="closeCartModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm cursor-pointer">✕</button>
      </div>

      <!-- Tipo de Pedido: Entrega vs Retirada -->
      <div class="flex gap-2">
        <label class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer" id="label-delivery">
          <input type="radio" name="delivery-type" value="delivery" checked onchange="toggleDelivery(true)" class="hidden">
          <span>🛵 Entrega (+R$ 5)</span>
        </label>
        <label class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer" id="label-pickup">
          <input type="radio" name="delivery-type" value="pickup" onchange="toggleDelivery(false)" class="hidden">
          <span>🏪 Retirar no Balcão</span>
        </label>
      </div>

      <!-- Lista de Itens Adicionados -->
      <div id="cart-items-list" class="space-y-2"></div>

      <!-- Cupom Aplicado na Sacola -->
      <div id="cart-coupon-row" style="display: none;" class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
        <span class="flex items-center gap-1.5 font-bold">
          <span>🎟️</span>
          <span>Cupom BEMVINDO10 (10% OFF)</span>
        </span>
        <span id="modal-coupon-discount" class="font-black">- R$ 0,00</span>
      </div>

      <!-- Subtotal e Total -->
      <div class="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5 text-xs">
        <div class="flex justify-between text-zinc-400">
          <span>Subtotal:</span>
          <span id="modal-subtotal" class="text-zinc-200 font-semibold">R$ 0,00</span>
        </div>
        <div class="flex justify-between text-zinc-400">
          <span>Taxa de Entrega:</span>
          <span id="modal-delivery-fee" class="text-emerald-400 font-semibold">R$ 5,00</span>
        </div>
        <div class="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
          <span>Total a Pagar:</span>
          <span id="modal-total" class="text-emerald-400 font-black">R$ 5,00</span>
        </div>
      </div>

      <!-- Dados do Cliente -->
      <div class="space-y-2.5 text-xs">
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Seu Nome:</label>
          <input id="client-name" type="text" placeholder="Ex: João Silva" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div id="address-container">
          <label class="block text-zinc-400 mb-1 font-semibold">Endereço de Entrega:</label>
          <input id="client-address" type="text" placeholder="Rua, número, bairro e ponto de referência" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Forma de Pagamento:</label>
          <select id="client-payment" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500">
            <option value="Pix">PIX (Chave enviada no WhatsApp)</option>
            <option value="Cartão de Crédito">Cartão de Crédito na Entrega</option>
            <option value="Cartão de Débito">Cartão de Débito na Entrega</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Observações Gerais do Pedido:</label>
          <input id="client-notes" type="text" placeholder="Ex: Troco para 50, tocar campainha..." class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
      </div>

      <!-- Botão Concluir no WhatsApp -->
      <button type="button" onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <!-- MODAL 3: CONSULTA DO CLUBE DE FIDELIDADE -->
  <div id="loyalty-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4">
    <div class="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/10 p-5 space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="font-bold text-white text-sm flex items-center gap-2">
          <span>🎁 Clube de Fidelidade</span>
        </h3>
        <button type="button" onclick="closeLoyaltyModal()" class="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs">✕</button>
      </div>
      <div class="space-y-2 text-xs text-zinc-300">
        <p>A cada <strong>R$ 1,00</strong> em compras você ganha <strong>1 ponto</strong>.</p>
        <div class="p-3 rounded-xl bg-zinc-800 border border-white/5 space-y-1">
          <div class="font-bold text-amber-300">Prêmios para Resgate:</div>
          <div class="text-[11px] text-zinc-400">• 50 pts: Bebida ou Sobremesa Grátis</div>
          <div class="text-[11px] text-zinc-400">• 100 pts: R$ 15,00 de Desconto no Pedido</div>
        </div>
        <div class="pt-2">
          <label class="block text-[11px] text-zinc-400 mb-1">Consulte seus pontos pelo WhatsApp:</label>
          <input id="loyalty-phone-input" type="tel" placeholder="(DDD) 99999-9999" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500">
        </div>
      </div>
      <button type="button" onclick="checkLoyaltyPoints()" class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md">
        Verificar Saldo
      </button>
      <div id="loyalty-result" class="text-center text-xs text-purple-300 font-bold pt-1" style="display: none;"></div>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];
    let isDeliveryMode = true;
    let isCouponApplied = false;

    // Estado do produto aberto no modal
    let activeProductIdx = null;
    let activeProductQty = 1;

    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-amber-500 text-black font-bold shadow-md';
      }

      document.querySelectorAll('.product-card').forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        const isFeatured = card.getAttribute('data-featured') === 'true';

        if (cat === 'Todos' || !cat) {
          card.style.display = 'flex';
        } else if (cat === 'Mais Pedidos') {
          card.style.display = isFeatured ? 'flex' : 'none';
        } else if (itemCat.toLowerCase() === cat.toLowerCase()) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Modal de Detalhes do Produto estilo iFood
    function openProductDetailModal(idx) {
      const item = availableItems[idx];
      if (!item) return;

      activeProductIdx = idx;
      activeProductQty = 1;

      document.getElementById('detail-modal-img').src = item.img;
      document.getElementById('detail-modal-title').innerText = item.title;
      document.getElementById('detail-modal-desc').innerText = item.desc;
      document.getElementById('detail-modal-base-price').innerText = 'R$ ' + item.price.toFixed(2).replace('.', ',');
      document.getElementById('detail-qty-display').innerText = '1';
      document.getElementById('detail-item-notes').value = '';

      const badgeEl = document.getElementById('detail-modal-badge');
      if (item.badge) {
        badgeEl.innerText = item.badge;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }

      // Renderiza os adicionais/opcionais
      const addonsList = document.getElementById('detail-addons-list');
      const addons = item.options || [];
      if (addons.length === 0) {
        document.getElementById('detail-addons-section').style.display = 'none';
      } else {
        document.getElementById('detail-addons-section').style.display = 'block';
        addonsList.innerHTML = addons.map((opt, oIdx) => \`
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/80 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" data-name="\${opt.name}" data-price="\${opt.price}" onchange="recalculateProductModalPrice()" class="addon-checkbox w-4 h-4 rounded text-amber-500 accent-amber-500 focus:ring-0">
              <span class="text-xs text-zinc-200 font-medium">\${opt.name}</span>
            </div>
            <span class="text-xs font-bold text-amber-400">+ R$ \${opt.price.toFixed(2).replace('.', ',')}</span>
          </label>
        \`).join('');
      }

      recalculateProductModalPrice();

      const modal = document.getElementById('product-detail-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeProductDetailModal() {
      const modal = document.getElementById('product-detail-modal');
      if (modal) modal.style.display = 'none';
    }

    function changeDetailQty(delta) {
      activeProductQty = Math.max(1, activeProductQty + delta);
      document.getElementById('detail-qty-display').innerText = activeProductQty;
      recalculateProductModalPrice();
    }

    function recalculateProductModalPrice() {
      if (activeProductIdx === null) return;
      const item = availableItems[activeProductIdx];
      let unitPrice = item.price;

      document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
        unitPrice += Number(cb.getAttribute('data-price') || 0);
      });

      const total = unitPrice * activeProductQty;
      document.getElementById('detail-total-btn-price').innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
    }

    function confirmAddProductToCart() {
      if (activeProductIdx === null) return;
      const item = availableItems[activeProductIdx];

      const selectedAddons = [];
      let unitPrice = item.price;

      document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
        const name = cb.getAttribute('data-name');
        const price = Number(cb.getAttribute('data-price') || 0);
        selectedAddons.push({ name, price });
        unitPrice += price;
      });

      const itemNotes = (document.getElementById('detail-item-notes')?.value || '').trim();

      cart.push({
        title: item.title,
        basePrice: item.price,
        unitPrice,
        price: unitPrice,
        qty: activeProductQty,
        img: item.img,
        addons: selectedAddons,
        notes: itemNotes
      });

      closeProductDetailModal();
      renderCart();

      // Feedback visual rápido
      const floatingBar = document.getElementById('cart-floating-bar');
      if (floatingBar) {
        floatingBar.classList.add('scale-105');
        setTimeout(() => floatingBar.classList.remove('scale-105'), 200);
      }
    }

    function updateQty(idx, delta) {
      if (!cart[idx]) return;
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
      renderCart();
    }

    function toggleDelivery(isDelivery) {
      isDeliveryMode = isDelivery;
      const labelDelivery = document.getElementById('label-delivery');
      const labelPickup = document.getElementById('label-pickup');
      const addressBox = document.getElementById('address-container');

      if (isDelivery) {
        if (labelDelivery) labelDelivery.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer';
        if (labelPickup) labelPickup.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer';
        if (addressBox) addressBox.style.display = 'block';
      } else {
        if (labelDelivery) labelDelivery.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer';
        if (labelPickup) labelPickup.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer';
        if (addressBox) addressBox.style.display = 'none';
      }
      renderCart();
    }

    function toggleWelcomeCoupon() {
      isCouponApplied = !isCouponApplied;
      const btn = document.getElementById('btn-coupon');
      if (btn) {
        if (isCouponApplied) {
          btn.innerText = '✓ Aplicado';
          btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md';
        } else {
          btn.innerText = 'Aplicar';
          btn.className = 'px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md';
        }
      }
      renderCart();
    }

    function renderCart() {
      const floatingBar = document.getElementById('cart-floating-bar');
      const countEl = document.getElementById('cart-count');
      const totalEl = document.getElementById('cart-total');
      const itemsList = document.getElementById('cart-items-list');
      const subtotalEl = document.getElementById('modal-subtotal');
      const feeEl = document.getElementById('modal-delivery-fee');
      const modalTotalEl = document.getElementById('modal-total');
      const couponRow = document.getElementById('cart-coupon-row');
      const couponDiscountEl = document.getElementById('modal-coupon-discount');

      const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
      const subtotal = cart.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);

      const discount = isCouponApplied ? (subtotal * 0.10) : 0;
      const deliveryFee = isDeliveryMode && subtotal > 0 ? 5.0 : 0.0;
      const total = subtotal > 0 ? Math.max(0, subtotal - discount + deliveryFee) : 0;

      if (floatingBar) {
        floatingBar.style.display = totalItems > 0 ? 'block' : 'none';
      }
      if (countEl) countEl.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
      if (totalEl) totalEl.innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
      if (subtotalEl) subtotalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (feeEl) feeEl.innerText = isDeliveryMode ? 'R$ 5,00' : 'Grátis (Retirada)';
      if (modalTotalEl) modalTotalEl.innerText = 'R$ ' + total.toFixed(2).replace('.', ',');

      if (couponRow) {
        couponRow.style.display = isCouponApplied && subtotal > 0 ? 'flex' : 'none';
        if (couponDiscountEl) couponDiscountEl.innerText = '- R$ ' + discount.toFixed(2).replace('.', ',');
      }

      if (itemsList) {
        if (cart.length === 0) {
          itemsList.innerHTML = '<p class="text-zinc-500 text-center py-6 text-xs">Sua sacola está vazia.</p>';
        } else {
          itemsList.innerHTML = cart.map((item, idx) => \`
            <div class="p-3 rounded-2xl bg-zinc-800/80 border border-white/5 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-bold text-white truncate">\${item.title}</h4>
                  <p class="text-xs text-emerald-400 font-black mt-0.5">R$ \${(item.unitPrice * item.qty).toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="updateQty(\${idx}, -1)" class="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95">-</button>
                  <span class="text-xs font-bold text-white w-5 text-center">\${item.qty}</span>
                  <button type="button" onclick="updateQty(\${idx}, 1)" class="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95">+</button>
                </div>
              </div>
              \${item.addons && item.addons.length > 0 ? \`
                <div class="text-[10px] text-zinc-400 pl-2 border-l border-amber-500/30 space-y-0.5">
                  \${item.addons.map(a => \`<div>+ \${a.name} (+R$ \${a.price.toFixed(2).replace('.', ',')})</div>\`).join('')}
                </div>
              \` : ''}
              \${item.notes ? \`
                <div class="text-[10px] text-amber-300/80 italic pl-2 border-l border-white/10">
                  Obs: \${item.notes}
                </div>
              \` : ''}
            </div>
          \`).join('');
        }
      }
    }

    function openCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.style.display = 'none';
    }

    // Modal de Fidelidade
    function openLoyaltyModal() {
      const modal = document.getElementById('loyalty-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeLoyaltyModal() {
      const modal = document.getElementById('loyalty-modal');
      if (modal) modal.style.display = 'none';
    }

    function checkLoyaltyPoints() {
      const phone = (document.getElementById('loyalty-phone-input')?.value || '').trim();
      const res = document.getElementById('loyalty-result');
      if (phone.length < 10) {
        alert('Por favor, digite seu WhatsApp com DDD.');
        return;
      }
      if (res) {
        res.style.display = 'block';
        res.innerHTML = '🎉 Você possui <strong>45 pontos</strong> acumulados nesta loja!<br><span class="text-[11px] text-zinc-400 font-normal">Faltam apenas 5 pontos para resgatar sua recompensa!</span>';
      }
    }

    function checkoutWhatsApp(phone, storeName) {
      if (cart.length === 0) {
        alert('Adicione itens à sua sacola antes de continuar.');
        return;
      }
      const clientName = (document.getElementById('client-name')?.value || '').trim();
      const clientAddress = (document.getElementById('client-address')?.value || '').trim();
      const paymentMethod = document.getElementById('client-payment')?.value || 'Pix';
      const notes = (document.getElementById('client-notes')?.value || '').trim();

      const isSweet = /a[cç]a[ií]|sorvet|gelat|doce/i.test(storeName);
      const isPizza = /pizza/i.test(storeName);
      const headerEmoji = isSweet ? '🍧' : isPizza ? '🍕' : '🍔';

      let msg = headerEmoji + ' *NOVO PEDIDO - ' + storeName.toUpperCase() + '*\\n\\n';
      if (clientName) msg += '👤 *Cliente:* ' + clientName + '\\n';
      msg += '🛵 *Tipo:* ' + (isDeliveryMode ? 'Entrega no Endereço' : 'Retirada no Balcão') + '\\n';
      if (isDeliveryMode && clientAddress) {
        msg += '📍 *Endereço:* ' + clientAddress + '\\n';
      }
      msg += '💳 *Pagamento:* ' + paymentMethod + '\\n';
      if (notes) msg += '📝 *Obs Geral:* ' + notes + '\\n';
      msg += '\\n📋 *ITENS ESCOLHIDOS:*\\n';

      let subtotal = 0;
      cart.forEach(item => {
        const itemTotal = item.unitPrice * item.qty;
        subtotal += itemTotal;
        msg += '• ' + item.qty + 'x ' + item.title + ' (R$ ' + itemTotal.toFixed(2).replace('.', ',') + ')\\n';
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach(a => {
            msg += '   + ' + a.name + '\\n';
          });
        }
        if (item.notes) {
          msg += '   Obs: ' + item.notes + '\\n';
        }
      });

      const discount = isCouponApplied ? (subtotal * 0.10) : 0;
      const deliveryFee = isDeliveryMode ? 5.0 : 0.0;
      const total = subtotal - discount + deliveryFee;

      msg += '\\n💵 *Subtotal:* R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (isCouponApplied) {
        msg += '\\n🎟️ *Cupom BEMVINDO10 (-10%):* -R$ ' + discount.toFixed(2).replace('.', ',');
      }
      if (deliveryFee > 0) {
        msg += '\\n🛵 *Taxa de Entrega:* R$ 5,00';
      } else {
        msg += '\\n🏪 *Retirada:* Sem taxa de entrega';
      }
      msg += '\\n💰 *TOTAL A PAGAR:* R$ ' + total.toFixed(2).replace('.', ',') + '\\n\\n';
      msg += 'Por favor, confirme meu pedido!';

      const cleanPhone = phone.replace(/\\D/g, '');
      const url = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    }

    // Fechar modais ao clicar no fundo escuro
    ['product-detail-modal', 'cart-modal', 'loyalty-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function(e) {
          if (e.target === this) this.style.display = 'none';
        });
      }
    });

    // Previne que links hash # quebrem o iframe
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Construtor HTML Especializado para Barbearias com Agendamento Online
 */
function buildBarberShopHtml(opts: {
  businessName: string;
  city: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  rating: number;
  reviewsCount: number;
  subNiche: SubNicheInfo;
  finalSlug: string;
}): string {
  const { businessName, city, cleanWhatsapp, destinationAddress, encodedAddress, rating, reviewsCount, subNiche, finalSlug } = opts;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Barbearia & Agendamento</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0a0d] text-zinc-100 font-sans pb-24 selection:bg-amber-500 selection:text-black">
  <!-- TopBar -->
  <header class="p-4 border-b border-white/10 flex items-center justify-between max-w-4xl mx-auto">
    <div class="flex items-center gap-2">
      <span class="text-xl">✂️</span>
      <span class="font-bold text-base sm:text-lg tracking-wider text-white uppercase">${businessName}</span>
    </div>
    <a href="/agendar/${finalSlug}" target="_top" class="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-md">
      Agendar Horário
    </a>
  </header>

  <!-- Hero Section -->
  <section class="max-w-4xl mx-auto px-4 pt-10 pb-8 text-center space-y-4">
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
      <span>★ ${rating} no Google (${reviewsCount} avaliações)</span>
      <span>·</span>
      <span>Cerveja Cortesia 🍺</span>
    </div>
    <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
      Estilo, Precisão & Tradição Masculina em <span class="text-amber-400">${city}</span>
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
      Cortes clássicos, fades perfeitos e barba terapia com toalha quente. Atendimento com hora marcada e máximo conforto.
    </p>
    <div class="pt-3 flex flex-wrap items-center justify-center gap-3">
      <a href="/agendar/${finalSlug}" target="_top" class="px-6 py-3.5 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2">
        <span>🗓️ Agendar Meu Horário Online</span>
      </a>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de agendar um horário na ${businessName}.`)}" target="_blank" class="px-6 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2">
        <span>Falar no WhatsApp</span>
      </a>
    </div>
  </section>

  <!-- Foto Hero -->
  <div class="max-w-4xl mx-auto px-4 mb-10">
    <div class="relative h-64 sm:h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <img src="${subNiche.photos[0]}" class="w-full h-full object-cover" alt="${businessName}">
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-transparent"></div>
    </div>
  </div>

  <!-- Tabela de Serviços & Valores -->
  <section class="max-w-4xl mx-auto px-4 py-6">
    <h2 class="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Nossos Serviços & Valores</h2>
    <p class="text-xs text-zinc-400 text-center mb-6">Escolha o serviço desejado e reserve seu horário online</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      ${subNiche.items
        .map(
          (service) => `
        <div class="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all">
          <div class="flex-1 min-w-0">
            ${service.badge ? `<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">${service.badge}</span>` : ""}
            <h3 class="font-bold text-sm text-white mt-0.5">${service.title}</h3>
            <p class="text-xs text-zinc-400 mt-1 line-clamp-2">${service.desc}</p>
            <div class="mt-2 font-black text-amber-400 text-sm">R$ ${service.price.toFixed(2).replace(".", ",")}</div>
          </div>
          <a href="/agendar/${finalSlug}" target="_top" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shrink-0">
            Agendar
          </a>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>

  <!-- Diferenciais VIP -->
  <section class="max-w-4xl mx-auto px-4 py-8">
    <div class="p-6 rounded-3xl bg-zinc-900 border border-white/10">
      <h3 class="text-base font-bold text-white mb-4 text-center">A Experiência na ${businessName}</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div class="p-3 rounded-xl bg-zinc-800/60 border border-white/5 space-y-1">
          <span class="text-xl">🍺</span>
          <div class="font-bold text-white">Bebida Cortesia</div>
          <p class="text-[11px] text-zinc-400">Cerveja gelada ou café</p>
        </div>
        <div class="p-3 rounded-xl bg-zinc-800/60 border border-white/5 space-y-1">
          <span class="text-xl">♨️</span>
          <div class="font-bold text-white">Toalha Quente</div>
          <p class="text-[11px] text-zinc-400">Barboterapia relaxante</p>
        </div>
        <div class="p-3 rounded-xl bg-zinc-800/60 border border-white/5 space-y-1">
          <span class="text-xl">🎱</span>
          <div class="font-bold text-white">Espaço Lounge</div>
          <p class="text-[11px] text-zinc-400">Sinuca e climatizado</p>
        </div>
        <div class="p-3 rounded-xl bg-zinc-800/60 border border-white/5 space-y-1">
          <span class="text-xl">⏱️</span>
          <div class="font-bold text-white">Pontualidade</div>
          <p class="text-[11px] text-zinc-400">Sem esperas na fila</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Localização -->
  <section class="max-w-4xl mx-auto px-4 py-6">
    <div class="p-6 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 class="text-lg font-bold text-white">📍 Onde Estamos</h2>
          <p class="text-xs text-zinc-400">${destinationAddress}</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all">Google Maps</a>
          <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-semibold transition-all">Waze</a>
        </div>
      </div>
      <iframe src="https://maps.google.com/maps?q=${encodedAddress}&output=embed" class="w-full h-56 rounded-2xl border border-white/10" loading="lazy"></iframe>
    </div>
  </section>

  <!-- Botão Flutuante WhatsApp -->
  <div class="fixed bottom-5 right-5 z-50">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de agendar um atendimento na ${businessName}.`)}" target="_blank" class="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl hover:scale-105 transition-all">
      <span>WhatsApp Oficial</span>
    </a>
  </div>
</body>
</html>`;
}

/**
 * Construtor HTML de Loja & Vitrine com Sacola Interativa
 */
function buildShopCatalogHtml(opts: {
  businessName: string;
  city: string;
  niche: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  subNiche: SubNicheInfo;
  finalSlug: string;
}): string {
  const { businessName, city, niche, cleanWhatsapp, destinationAddress, encodedAddress, subNiche, finalSlug } = opts;
  const itemsJson = JSON.stringify(subNiche.items);
  const featuredItems = subNiche.items.filter((item, idx) => item.isFeatured || idx < 3);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Vitrine & Loja Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-32 selection:bg-pink-500 selection:text-white">
  <!-- TopBar do Estabelecimento -->
  <header class="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
    <div class="max-w-2xl mx-auto flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
          🛍️
        </div>
        <div class="min-w-0">
          <h1 class="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">${businessName}</h1>
          <div class="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-emerald-400 font-semibold">Loja Aberta Agora</span>
            <span>· ${city}</span>
          </div>
        </div>
      </div>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Estou visitando o catálogo da ${businessName} e gostaria de tirar uma dúvida.`)}" target="_blank" class="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all shrink-0 flex items-center gap-1.5">
        <span>💬 Falar no WhatsApp</span>
      </a>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 pt-4 space-y-5">
    <!-- Banner Principal da Coleção -->
    <div class="relative h-44 sm:h-52 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <img src="${subNiche.photos[0]}" class="w-full h-full object-cover" alt="${businessName}">
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex items-end p-4 sm:p-6">
        <div>
          <span class="inline-flex items-center gap-1 text-[11px] bg-pink-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-lg">
            ✨ Coleção Exclusiva & Novidades
          </span>
          <h2 class="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-md">Tendências & Destaques da Semana</h2>
          <p class="text-xs text-zinc-300 drop-shadow line-clamp-1 mt-0.5">Entregamos com rapidez em ${city} ou retire em nossa loja</p>
        </div>
      </div>
    </div>

    <!-- Faixa de Cupom de Boas-Vindas Interativa -->
    <div id="coupon-banner" class="p-3.5 bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border border-pink-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-2xl shrink-0">🎟️</span>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-black text-pink-300 uppercase tracking-wide">CUPOM DE BOAS-VINDAS:</span>
            <span class="bg-pink-500 text-white font-mono font-black text-xs px-2 py-0.5 rounded shadow">PRIMEIRACOMPRA</span>
          </div>
          <p class="text-[11px] text-zinc-400 mt-0.5">Ganhe <strong class="text-white">10% OFF</strong> na sua primeira compra pelo catálogo online.</p>
        </div>
      </div>
      <button type="button" id="btn-apply-coupon" onclick="applyCoupon('PRIMEIRACOMPRA', 0.10)" class="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shrink-0 transition-all shadow-md active:scale-95 cursor-pointer">
        Aplicar
      </button>
    </div>

    <!-- Clube de Fidelidade VIP -->
    <div class="p-3.5 bg-zinc-900/90 border border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-md hover:border-pink-500/30 transition-all">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-xl p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">💎</span>
        <div class="min-w-0">
          <h3 class="text-xs font-bold text-white">Clube de Fidelidade VIP</h3>
          <p class="text-[11px] text-zinc-400">Suas compras acumulam pontos que valem brindes e descontos.</p>
        </div>
      </div>
      <button type="button" onclick="openLoyaltyModal()" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-pink-400 font-bold text-xs border border-pink-500/30 shrink-0 transition-all cursor-pointer">
        Meus Pontos
      </button>
    </div>

    <!-- Seção de Destaques em Carrossel Horizontal -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
          <span>🏆 Mais Vendidos & Destaques</span>
        </h3>
        <span class="text-[11px] text-pink-400 font-semibold">Deslize para ver →</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 scroll-smooth">
        ${featuredItems
          .map((item, originalIdx) => {
            const actualIdx = subNiche.items.findIndex(it => it.title === item.title);
            const idxToUse = actualIdx >= 0 ? actualIdx : originalIdx;
            return `
          <div onclick="openProductDetailModal(${idxToUse})" class="w-48 shrink-0 bg-zinc-900 border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between hover:border-pink-500/50 transition-all cursor-pointer group shadow-lg active:scale-95">
            <div class="relative h-28 rounded-xl overflow-hidden mb-2 bg-zinc-800">
              <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${item.title}">
              <span class="absolute top-1.5 left-1.5 bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
                Mais Vendido 🏆
              </span>
            </div>
            <div>
              <h4 class="text-xs font-bold text-white line-clamp-1 group-hover:text-pink-300 transition-colors">${item.title}</h4>
              <p class="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">${item.desc}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span class="text-xs font-black text-pink-400">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <span class="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-md font-bold">Ver +</span>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    </div>

    <!-- Filtro de Categorias em Pills -->
    <div class="space-y-2">
      <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Navegar por Categorias</h3>
      <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
        ${subNiche.categories
          .map(
            (cat, idx) =>
              `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                idx === 0
                  ? "bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20"
                  : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
              }">${cat}</button>`,
          )
          .join("")}
      </div>
    </div>

    <!-- Grade de Produtos com Clique para Modal de Detalhes -->
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3" id="products-grid">
        ${subNiche.items
          .map(
            (p, idx) => `
          <div onclick="openProductDetailModal(${idx})" class="product-card p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 flex flex-col justify-between hover:border-pink-500/40 transition-all cursor-pointer group active:scale-95" data-category="${p.category || ''}">
            <div class="relative h-36 rounded-xl overflow-hidden bg-zinc-800">
              <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${p.title}">
              ${p.badge ? `<span class="absolute top-2 left-2 text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-md shadow">${p.badge}</span>` : ""}
            </div>
            <div class="flex-1">
              <h4 class="text-xs font-bold text-white line-clamp-1 group-hover:text-pink-300 transition-colors">${p.title}</h4>
              <p class="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">${p.desc}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-white/5">
              <span class="text-xs font-black text-pink-400">R$ ${p.price.toFixed(2).replace(".", ",")}</span>
              <span class="text-[11px] bg-pink-500 hover:bg-pink-400 text-white font-bold px-2.5 py-1 rounded-lg transition-all shadow">
                Comprar
              </span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <!-- Informações da Loja Física -->
    <div class="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
      <h3 class="font-bold text-sm text-white flex items-center gap-1.5">
        <span>📍 Visite Nossa Loja Física</span>
      </h3>
      <p class="text-xs text-zinc-400">${destinationAddress}</p>
      <div class="grid grid-cols-2 gap-2 pt-2">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-center text-xs font-semibold text-zinc-200 transition-all border border-white/5">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-center text-xs font-semibold text-cyan-400 transition-all border border-white/5">Waze</a>
      </div>
    </div>
  </main>

  <!-- Modal de Detalhes do Produto & Variações -->
  <div id="product-detail-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
      <!-- Imagem Header do Modal -->
      <div class="relative h-56 sm:h-64 bg-zinc-950 shrink-0">
        <img id="detail-modal-img" src="" class="w-full h-full object-cover" alt="Produto">
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30"></div>
        <button type="button" onclick="closeProductDetailModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm cursor-pointer z-10">✕</button>
        <div class="absolute bottom-3 left-4 right-4">
          <span id="detail-modal-badge" class="inline-block text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-md mb-1 shadow"></span>
          <h3 id="detail-modal-title" class="text-lg font-black text-white leading-tight drop-shadow"></h3>
        </div>
      </div>

      <!-- Corpo com Detalhes, Variações e Observações -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        <p id="detail-modal-desc" class="text-xs text-zinc-300 leading-relaxed"></p>

        <!-- Preço Base -->
        <div class="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
          <span class="text-xs text-zinc-400">Preço do Produto:</span>
          <span id="detail-modal-base-price" class="text-sm font-black text-pink-400"></span>
        </div>

        <!-- Opcionais / Variações -->
        <div id="detail-modal-options-wrapper" class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Adicionais & Embalagem</h4>
            <span class="text-[10px] text-zinc-400">Opcional</span>
          </div>
          <div id="detail-modal-options-list" class="space-y-1.5"></div>
        </div>

        <!-- Observações do Pedido (Ex: Tamanho / Cor) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-zinc-300">Tamanho, Cor ou Observações Especiais:</label>
          <textarea id="detail-modal-obs" rows="2" placeholder="Ex: Tamanho M, cor preta ou mensagem para presente..." class="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"></textarea>
        </div>
      </div>

      <!-- Rodapé do Modal com Quantidade e Adicionar -->
      <div class="p-4 bg-zinc-950 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl p-1 shrink-0">
          <button type="button" onclick="updateDetailQty(-1)" class="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer text-sm">-</button>
          <span id="detail-modal-qty" class="text-xs font-black text-white w-6 text-center">1</span>
          <button type="button" onclick="updateDetailQty(1)" class="w-8 h-8 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center cursor-pointer text-sm">+</button>
        </div>

        <button type="button" id="btn-add-detail-to-cart" onclick="confirmAddToCart()" class="flex-1 py-3 px-4 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-between cursor-pointer active:scale-95">
          <span>Adicionar à Sacola</span>
          <span id="detail-modal-total-btn">R$ 0,00</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Barra Flutuante Reativa da Sacola -->
  <div id="cart-floating-bar" style="display: none;" class="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40 transition-all duration-300">
    <button type="button" onclick="openCartModal()" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-pink-500 text-white font-bold text-sm shadow-2xl hover:bg-pink-400 transition-all cursor-pointer">
      <div class="flex items-center gap-2">
        <span class="text-base">🛍️</span>
        <span id="cart-count">1 item</span>
      </div>
      <div class="flex items-center gap-2">
        <span id="cart-total" class="font-black">R$ 0,00</span>
        <span>· Ver Sacola →</span>
      </div>
    </button>
  </div>

  <!-- Modal da Sacola de Compras -->
  <div id="cart-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <span>🛍️ Sua Sacola de Compras</span>
        </h2>
        <button type="button" onclick="closeCartModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm cursor-pointer">✕</button>
      </div>
      <div id="cart-items-list" class="space-y-2"></div>
      
      <!-- Resumo de Valores & Cupom -->
      <div class="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5 text-xs">
        <div class="flex justify-between text-zinc-400">
          <span>Subtotal:</span>
          <span id="modal-subtotal" class="text-white font-semibold">R$ 0,00</span>
        </div>
        <div id="modal-discount-row" style="display: none;" class="flex justify-between text-emerald-400 font-semibold">
          <span id="modal-discount-label">Desconto de Cupom (10%):</span>
          <span id="modal-discount-val">- R$ 0,00</span>
        </div>
        <div class="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
          <span>Total a Pagar:</span>
          <span id="modal-total" class="text-pink-400 font-black">R$ 0,00</span>
        </div>
      </div>

      <button type="button" onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <!-- Modal do Clube de Fidelidade -->
  <div id="loyalty-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4">
    <div class="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/10 p-5 space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <span>💎 Clube de Fidelidade</span>
        </h3>
        <button type="button" onclick="closeLoyaltyModal()" class="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs">✕</button>
      </div>
      <p class="text-xs text-zinc-300">Digite seu WhatsApp para conferir seu saldo de pontos e benefícios disponíveis:</p>
      <input type="tel" id="loyalty-phone" placeholder="(DDD) 99999-9999" class="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500">
      <button type="button" onclick="queryLoyaltyPoints('${cleanWhatsapp}', '${businessName}')" class="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs transition-all">
        Consultar Meu Saldo
      </button>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];
    let currentDetailItem = null;
    let currentDetailQty = 1;
    let selectedOptions = [];
    let appliedCoupon = null;

    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20';
      }

      document.querySelectorAll('.product-card').forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        if (cat === 'Todos' || !cat || itemCat.toLowerCase() === cat.toLowerCase() || itemCat === '') {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Modal de Detalhes do Produto
    function openProductDetailModal(idx) {
      const item = availableItems[idx];
      if (!item) return;

      currentDetailItem = item;
      currentDetailQty = 1;
      selectedOptions = [];

      document.getElementById('detail-modal-img').src = item.img;
      document.getElementById('detail-modal-title').innerText = item.title;
      document.getElementById('detail-modal-desc').innerText = item.desc;
      document.getElementById('detail-modal-base-price').innerText = 'R$ ' + Number(item.price).toFixed(2).replace('.', ',');
      document.getElementById('detail-modal-obs').value = '';
      document.getElementById('detail-modal-qty').innerText = '1';

      const badgeEl = document.getElementById('detail-modal-badge');
      if (item.badge) {
        badgeEl.innerText = item.badge;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }

      const optionsWrapper = document.getElementById('detail-modal-options-wrapper');
      const optionsList = document.getElementById('detail-modal-options-list');

      if (item.options && item.options.length > 0) {
        optionsWrapper.style.display = 'block';
        optionsList.innerHTML = item.options.map((opt, optIdx) => \`
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-white/5 hover:border-pink-500/30 cursor-pointer transition-all">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" onchange="toggleOption(\${optIdx})" class="w-4 h-4 rounded text-pink-500 focus:ring-0 focus:outline-none accent-pink-500">
              <span class="text-xs text-white font-medium">\${opt.name}</span>
            </div>
            <span class="text-xs font-bold text-pink-400">+ R$ \${Number(opt.price).toFixed(2).replace('.', ',')}</span>
          </label>
        \`).join('');
      } else {
        optionsWrapper.style.display = 'none';
        optionsList.innerHTML = '';
      }

      recalculateDetailModal();
      const modal = document.getElementById('product-detail-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeProductDetailModal() {
      const modal = document.getElementById('product-detail-modal');
      if (modal) modal.style.display = 'none';
      currentDetailItem = null;
    }

    function toggleOption(optIdx) {
      if (!currentDetailItem || !currentDetailItem.options) return;
      const opt = currentDetailItem.options[optIdx];
      const existsIndex = selectedOptions.findIndex(o => o.name === opt.name);
      if (existsIndex >= 0) {
        selectedOptions.splice(existsIndex, 1);
      } else {
        selectedOptions.push(opt);
      }
      recalculateDetailModal();
    }

    function updateDetailQty(delta) {
      currentDetailQty = Math.max(1, currentDetailQty + delta);
      document.getElementById('detail-modal-qty').innerText = String(currentDetailQty);
      recalculateDetailModal();
    }

    function recalculateDetailModal() {
      if (!currentDetailItem) return;
      const basePrice = Number(currentDetailItem.price);
      const optionsTotal = selectedOptions.reduce((acc, o) => acc + Number(o.price), 0);
      const singleUnitPrice = basePrice + optionsTotal;
      const totalPrice = singleUnitPrice * currentDetailQty;
      document.getElementById('detail-modal-total-btn').innerText = 'R$ ' + totalPrice.toFixed(2).replace('.', ',');
    }

    function confirmAddToCart() {
      if (!currentDetailItem) return;
      const obs = (document.getElementById('detail-modal-obs').value || '').trim();
      const optionsTotal = selectedOptions.reduce((acc, o) => acc + Number(o.price), 0);
      const unitPrice = Number(currentDetailItem.price) + optionsTotal;

      cart.push({
        title: currentDetailItem.title,
        basePrice: Number(currentDetailItem.price),
        price: unitPrice,
        qty: currentDetailQty,
        options: [...selectedOptions],
        obs,
      });

      closeProductDetailModal();
      renderCart();
    }

    function applyCoupon(code, discountRate) {
      appliedCoupon = { code, rate: discountRate };
      const btn = document.getElementById('btn-apply-coupon');
      if (btn) {
        btn.innerText = '✓ Aplicado!';
        btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-black text-xs shrink-0 shadow-md';
      }
      renderCart();
    }

    function updateQty(idx, delta) {
      if (!cart[idx]) return;
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
      renderCart();
    }

    function renderCart() {
      const floatingBar = document.getElementById('cart-floating-bar');
      const countEl = document.getElementById('cart-count');
      const totalEl = document.getElementById('cart-total');
      const itemsList = document.getElementById('cart-items-list');
      const subtotalEl = document.getElementById('modal-subtotal');
      const discountRow = document.getElementById('modal-discount-row');
      const discountValEl = document.getElementById('modal-discount-val');
      const modalTotalEl = document.getElementById('modal-total');

      const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
      const rawSubtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
      let discountAmount = 0;

      if (appliedCoupon && rawSubtotal > 0) {
        discountAmount = rawSubtotal * appliedCoupon.rate;
      }
      const finalTotal = Math.max(0, rawSubtotal - discountAmount);

      if (floatingBar) floatingBar.style.display = totalItems > 0 ? 'block' : 'none';
      if (countEl) countEl.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
      if (totalEl) totalEl.innerText = 'R$ ' + finalTotal.toFixed(2).replace('.', ',');
      if (subtotalEl) subtotalEl.innerText = 'R$ ' + rawSubtotal.toFixed(2).replace('.', ',');

      if (discountRow) {
        if (discountAmount > 0) {
          discountRow.style.display = 'flex';
          discountValEl.innerText = '- R$ ' + discountAmount.toFixed(2).replace('.', ',');
        } else {
          discountRow.style.display = 'none';
        }
      }

      if (modalTotalEl) modalTotalEl.innerText = 'R$ ' + finalTotal.toFixed(2).replace('.', ',');

      if (itemsList) {
        if (cart.length === 0) {
          itemsList.innerHTML = '<p class="text-zinc-500 text-center py-6 text-xs">Sua sacola está vazia.</p>';
        } else {
          itemsList.innerHTML = cart.map((item, idx) => \`
            <div class="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-1.5">
              <div class="flex items-center justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-bold text-white truncate">\${item.title}</h4>
                  <p class="text-xs text-pink-400 font-semibold mt-0.5">R$ \${(item.price * item.qty).toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="updateQty(\${idx}, -1)" class="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer">-</button>
                  <span class="text-xs font-bold text-white w-5 text-center">\${item.qty}</span>
                  <button type="button" onclick="updateQty(\${idx}, 1)" class="w-7 h-7 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer">+</button>
                </div>
              </div>
              \${item.options && item.options.length > 0 ? \`
                <div class="text-[10px] text-zinc-400 pl-1 border-l-2 border-pink-500/50">
                  \${item.options.map(o => '+ ' + o.name + ' (R$ ' + Number(o.price).toFixed(2).replace('.', ',') + ')').join('<br>')}
                </div>
              \` : ''}
              \${item.obs ? \`
                <div class="text-[10px] text-amber-300 italic pl-1">
                  Obs: \${item.obs}
                </div>
              \` : ''}
            </div>
          \`).join('');
        }
      }
    }

    function openCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.style.display = 'none';
    }

    function openLoyaltyModal() {
      const modal = document.getElementById('loyalty-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeLoyaltyModal() {
      const modal = document.getElementById('loyalty-modal');
      if (modal) modal.style.display = 'none';
    }

    function queryLoyaltyPoints(phone, storeName) {
      const inputPhone = (document.getElementById('loyalty-phone').value || '').trim();
      const msg = '💎 *CONSULTA DE FIDELIDADE - ' + storeName.toUpperCase() + '*\\n\\nOlá! Gostaria de consultar meu saldo de pontos no programa de fidelidade da loja.' + (inputPhone ? (' Meu número: ' + inputPhone) : '');
      const cleanPhone = phone.replace(/\\D/g, '');
      window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
      closeLoyaltyModal();
    }

    function checkoutWhatsApp(phone, storeName) {
      if (cart.length === 0) {
        alert('Adicione itens à sua sacola antes de continuar.');
        return;
      }
      let msg = '🛍️ *NOVO PEDIDO - ' + storeName.toUpperCase() + '*\\n\\n📋 *PRODUTOS DA SACOLA:*\n';
      let rawSubtotal = 0;
      cart.forEach((item, i) => {
        const itemTotal = item.price * item.qty;
        rawSubtotal += itemTotal;
        msg += (i + 1) + '. *' + item.qty + 'x ' + item.title + '* — R$ ' + itemTotal.toFixed(2).replace('.', ',') + '\\n';
        if (item.options && item.options.length > 0) {
          item.options.forEach(opt => {
            msg += '   + ' + opt.name + ' (R$ ' + Number(opt.price).toFixed(2).replace('.', ',') + ')\\n';
          });
        }
        if (item.obs) {
          msg += '   _Obs: ' + item.obs + '_\\n';
        }
        msg += '\\n';
      });

      msg += '---------------------------------\\n';
      msg += '💵 *Subtotal:* R$ ' + rawSubtotal.toFixed(2).replace('.', ',') + '\\n';

      let discountAmount = 0;
      if (appliedCoupon && rawSubtotal > 0) {
        discountAmount = rawSubtotal * appliedCoupon.rate;
        msg += '🎟️ *Cupom (' + appliedCoupon.code + '):* - R$ ' + discountAmount.toFixed(2).replace('.', ',') + '\\n';
      }

      const finalTotal = Math.max(0, rawSubtotal - discountAmount);
      msg += '💰 *TOTAL A PAGAR:* R$ ' + finalTotal.toFixed(2).replace('.', ',') + '\\n\\n';
      msg += '📍 *Olá! Gostaria de confirmar e finalizar a compra destes itens.*';

      const cleanPhone = phone.replace(/\\D/g, '');
      window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
    }
  </script>
</body>
</html>`;
}

/**
 * Construtor HTML de Serviços / Clínicas / Estética
 */
function buildServiceProHtml(opts: {
  businessName: string;
  city: string;
  niche: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  rating: number;
  subNiche: SubNicheInfo;
  finalSlug: string;
}): string {
  const { businessName, city, niche, cleanWhatsapp, destinationAddress, encodedAddress, rating, subNiche, finalSlug } = opts;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Atendimento Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-emerald-500 selection:text-black">
  <header class="p-4 border-b border-white/10 flex items-center justify-between max-w-4xl mx-auto">
    <div class="font-bold text-lg tracking-tight text-white">${businessName}</div>
    <a href="/agendar/${finalSlug}" target="_top" class="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all shadow-md">
      Agendar Consulta
    </a>
  </header>

  <section class="max-w-4xl mx-auto px-4 pt-10 pb-8 text-center space-y-4">
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
      <span>★ ${rating} no Google</span>
      <span>·</span>
      <span>Atendimento Exclusivo</span>
    </div>
    <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
      Excelência e Cuidado Especializado em <span class="text-emerald-400">${city}</span>
    </h1>
    <p class="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
      Atendimento exclusivo em ${niche}. Agende seu horário online ou fale diretamente conosco.
    </p>
    <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
      <a href="/agendar/${finalSlug}" target="_top" class="px-6 py-3.5 rounded-2xl bg-emerald-500 text-black font-black text-sm shadow-xl hover:bg-emerald-400 transition-all flex items-center gap-2">
        <span>🗓️ Agendar Horário Online</span>
      </a>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Vim pelo site da ${businessName} e gostaria de informações.`)}" target="_blank" class="px-6 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2">
        <span>Falar no WhatsApp</span>
      </a>
    </div>
  </section>

  <div class="max-w-4xl mx-auto px-4 mb-10">
    <div class="relative h-64 sm:h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <img src="${subNiche.photos[0]}" class="w-full h-full object-cover" alt="${businessName}">
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
    </div>
  </div>

  <section class="max-w-4xl mx-auto px-4 py-6">
    <h2 class="text-xl sm:text-2xl font-bold text-white mb-6 text-center">Nossos Principais Serviços</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      ${subNiche.items
        .map(
          (service) => `
        <div class="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
          ${service.badge ? `<span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">${service.badge}</span>` : ""}
          <h3 class="text-lg font-bold text-white">${service.title}</h3>
          <p class="text-xs text-zinc-400 leading-relaxed">${service.desc}</p>
          <div class="pt-2 flex items-center justify-between">
            <span class="text-sm font-bold text-emerald-400">R$ ${service.price.toFixed(2).replace(".", ",")}</span>
            <a href="/agendar/${finalSlug}" target="_top" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all">Agendar →</a>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>

  <section class="max-w-4xl mx-auto px-4 py-6">
    <div class="p-6 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 class="text-lg font-bold text-white">📍 Onde Estamos</h2>
          <p class="text-xs text-zinc-400">${destinationAddress}</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all">Google Maps</a>
          <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-semibold transition-all">Waze</a>
        </div>
      </div>
      <iframe src="https://maps.google.com/maps?q=${encodedAddress}&output=embed" class="w-full h-56 rounded-2xl border border-white/10" loading="lazy"></iframe>
    </div>
  </section>

  <div class="fixed bottom-5 right-5 z-50">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Vim pelo site da ${businessName} e gostaria de agendar um atendimento.`)}" target="_blank" class="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl hover:scale-105 transition-all">
      <span>Atendimento no WhatsApp</span>
    </a>
  </div>
</body>
</html>`;
}

/**
 * Construtor HTML Especializado para Indústrias, Fábricas e Energia Solar (B2B Corporativo)
 */
function buildIndustryB2bHtml(opts: {
  businessName: string;
  city: string;
  niche: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  rating: number;
  reviewsCount: number;
  subNiche: SubNicheInfo;
  finalSlug: string;
}): string {
  const { businessName, city, cleanWhatsapp, destinationAddress, encodedAddress, rating, reviewsCount, subNiche } = opts;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Indústria, Equipamentos & Soluções B2B</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#090d16] text-zinc-100 font-sans pb-24 selection:bg-sky-500 selection:text-black">
  <!-- Topbar Corporativa B2B -->
  <header class="border-b border-white/10 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-30">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-sm">
          🏭
        </div>
        <div>
          <span class="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">${businessName}</span>
          <span class="text-[10px] text-sky-400 font-medium">Fabricação & Fornecimento B2B</span>
        </div>
      </div>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de falar com o departamento comercial da ${businessName}.`)}" target="_blank" class="px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
        <span>Falar com Comercial</span>
        <span>→</span>
      </a>
    </div>
  </header>

  <!-- Hero Industrial de Alto Impacto -->
  <section class="relative overflow-hidden pt-8 pb-12 border-b border-white/5">
    <div class="absolute inset-0 opacity-20 pointer-events-none">
      <img src="${subNiche.photos[0]}" class="w-full h-full object-cover filter blur-sm" alt="${businessName}">
    </div>
    <div class="max-w-5xl mx-auto px-4 relative z-10">
      <div class="max-w-2xl space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
          <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>Fornecimento Direto de Fábrica · ${city} e Região</span>
        </div>
        <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Soluções de Engenharia, Equipamentos e Alta Performance Industrial
        </h1>
        <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Atendemos empresas, instaladores e indústrias com produtos certificados, suporte técnico de engenharia e garantia estendida de fábrica.
        </p>
        <div class="pt-2 flex flex-wrap gap-3">
          <a href="#cotacao-b2b" class="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2">
            <span>📋 Solicitar Cotação B2B</span>
          </a>
          <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de consultar o catálogo técnico e preços corporativos da ${businessName}.`)}" target="_blank" class="px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2">
            <span>💬 WhatsApp Direto</span>
          </a>
        </div>
      </div>

      <!-- Métricas / Selos de Credibilidade -->
      <div class="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-center space-y-1">
          <div class="text-sky-400 text-lg">🏭</div>
          <div class="font-extrabold text-sm text-white">Fabricação Direta</div>
          <div class="text-[10px] text-zinc-400">Sem intermediários</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-center space-y-1">
          <div class="text-sky-400 text-lg">🛡️</div>
          <div class="font-extrabold text-sm text-white">Garantia Técnica</div>
          <div class="text-[10px] text-zinc-400">Laudo & Certificação</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-center space-y-1">
          <div class="text-sky-400 text-lg">🚚</div>
          <div class="font-extrabold text-sm text-white">Pronta Entrega</div>
          <div class="text-[10px] text-zinc-400">Logística Ágil</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-center space-y-1">
          <div class="text-sky-400 text-lg">⭐</div>
          <div class="font-extrabold text-sm text-white">${rating} / 5.0</div>
          <div class="text-[10px] text-zinc-400">${reviewsCount} avaliações Google</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Catálogo de Equipamentos & Soluções -->
  <section class="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Catálogo Técnico & Equipamentos</h2>
        <p class="text-xs text-zinc-400 mt-0.5">Selecione uma solução para solicitar proposta comercial com especificação completa</p>
      </div>
    </div>

    <!-- Filtro de Categorias -->
    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="industry-categories">
      ${subNiche.categories
        .map(
          (cat, idx) =>
            `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              idx === 0
                ? "bg-sky-500 text-black font-bold shadow-md"
                : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
            }">${cat}</button>`,
        )
        .join("")}
    </div>

    <!-- Grid de Produtos Técnicos -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="products-grid">
      ${subNiche.items
        .map(
          (item) => `
        <div class="product-card flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-sky-500/40 transition-all gap-4" data-category="${item.category || ''}">
          <div class="space-y-3">
            <div class="relative h-44 rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
              <img src="${item.img}" class="w-full h-full object-cover" alt="${item.title}">
              ${item.badge ? `<span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-black uppercase tracking-wider">${item.badge}</span>` : ""}
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-white">${item.title}</h3>
              <p class="text-xs text-zinc-400 mt-1 leading-relaxed">${item.desc}</p>
            </div>
          </div>
          <div class="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] text-zinc-500 block uppercase font-bold">Faixa / Cotação</span>
              <span class="font-bold text-sky-400 text-sm">Sob Consulta B2B</span>
            </div>
            <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de solicitar um orçamento corporativo e ficha técnica para o equipamento: *${item.title}* na empresa ${businessName}.`)}" target="_blank" class="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-black border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5">
              <span>Solicitar Cotação</span>
              <span>→</span>
            </a>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>

  <!-- Seção de Cotação Corporativa Direta -->
  <section id="cotacao-b2b" class="max-w-5xl mx-auto px-4 py-8">
    <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-[#0e1626] border border-sky-500/20 shadow-2xl space-y-6">
      <div class="max-w-xl space-y-2">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30 uppercase tracking-wider">Atendimento Comercial B2B</span>
        <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">Precisa de um Projeto ou Grande Volume?</h2>
        <p class="text-xs sm:text-sm text-zinc-300">Nossa equipe de engenharia e vendas técnicas prepara uma proposta detalhada com prazos, condições corporativas e especificações completas.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <input id="quote-company" type="text" placeholder="Nome da Sua Empresa / Responsável" class="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500">
        <input id="quote-city" type="text" placeholder="Cidade / Estado da Instalação" class="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500">
        <button type="button" onclick="sendCorporateQuote('${cleanWhatsapp}', '${businessName}')" class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
          <span>Enviar Pedido de Cotação</span>
          <span>→</span>
        </button>
      </div>
    </div>
  </section>

  <!-- Localização da Fábrica / Planta Industrial -->
  <section class="max-w-5xl mx-auto px-4 py-8">
    <div class="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>📍 Planta Industrial & Atendimento Comercial</span>
          </h2>
          <p class="text-xs text-zinc-400 mt-0.5">${destinationAddress}</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all">Google Maps</a>
          <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-semibold transition-all">Waze</a>
        </div>
      </div>
      <iframe src="https://maps.google.com/maps?q=${encodedAddress}&output=embed" class="w-full h-56 rounded-2xl border border-white/10" loading="lazy"></iframe>
    </div>
  </section>

  <!-- Botão Flutuante de Contato Comercial -->
  <div class="fixed bottom-5 right-5 z-40">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de falar com o atendimento comercial da ${businessName}.`)}" target="_blank" class="flex items-center gap-2 px-4 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer">
      <span>💬 Falar no WhatsApp</span>
    </a>
  </div>

  <script>
    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-sky-500 text-black font-bold shadow-md';
      }

      document.querySelectorAll('.product-card').forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        if (cat === 'Todos' || !cat || itemCat.toLowerCase() === cat.toLowerCase() || itemCat === '') {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function sendCorporateQuote(phone, company) {
      const clientCompany = (document.getElementById('quote-company')?.value || '').trim();
      const clientCity = (document.getElementById('quote-city')?.value || '').trim();

      let msg = '🏭 *SOLICITAÇÃO DE COTAÇÃO B2B - ' + company.toUpperCase() + '*\\n\\n';
      if (clientCompany) msg += '🏢 *Empresa / Solicitante:* ' + clientCompany + '\\n';
      if (clientCity) msg += '📍 *Localização da Demanda:* ' + clientCity + '\\n';
      msg += '\\nOlá! Gostaria de uma cotação e atendimento comercial para aquisição de equipamentos e projetos.';

      const cleanPhone = phone.replace(/\\D/g, '');
      const url = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    }

    // Previne que links hash # quebrem o iframe
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>`;
}
