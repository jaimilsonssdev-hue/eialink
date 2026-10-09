import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";
import { resolveGeminiApiKeyAsync } from "@/modules/ai/google-ai.service";

export type ProspectNicheCategory = "food" | "shop" | "barber" | "service";

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
 * Barbearias são estritamente isoladas ANTES de checagens gastronômicas (evitando colisão com 'bar').
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

  // 2. Gastronomia, Restaurantes, Delivery e Alimentação
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

  // 3. Comércio, Lojas de Varejo e Vitrines
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

  // 4. Serviços em Geral, Clínicas, Saúde e Consultórios
  return {
    category: "service",
    label: "Site Profissional",
    buttonLabel: "Gerar Site",
    icon: "🌐",
    buttonClass: "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
    loadingLabel: "Criando Site com Agenda & WhatsApp",
  };
}

export interface SubNicheItem {
  title: string;
  desc: string;
  price: number;
  img: string;
  badge?: string;
  category: string;
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
        theme: category === "food" ? "amber" : category === "barber" ? "dark" : category === "shop" ? "rose" : "emerald",
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
          agenda_enabled: true,
          booking_active: true,
          ai_chat_enabled: true,
          ai_concierge_enabled: true,
          whatsapp_enabled: true,
          gps_enabled: true,
          assistant_name: `${data.businessName} - Atendente`,
          assistant_prompt: `Você é a atendente virtual oficial da empresa "${data.businessName}", localizada em ${destinationAddress}.
Seu papel é recepcionar os clientes com cordialidade, tirar dúvidas sobre o cardápio/serviços e direcionar para o WhatsApp (${cleanWhatsapp}) ou agendamento online (/agendar/${finalSlug}).`,
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

    // 5. Cadastra agenda pronta: booking_settings, booking_availability, booking_services
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

    // 6. Cadastra produtos no catálogo para visualização e edição no dashboard
    try {
      const catalogInserts = subNiche.items.map((item, idx) => ({
        bio_page_id: page.id,
        name: item.title,
        description: item.desc,
        price: item.price,
        image_url: item.img || null,
        button_label: category === "barber" || category === "service" ? "Agendar" : "Adicionar à Sacola",
        button_url: category === "barber" || category === "service" ? `/agendar/${page.slug}` : null,
        type: category === "food" || category === "shop" ? "product" : "service",
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
 * Construtor HTML Especializado para Delivery & Cardápios com Carrinho Interativo
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

  <div class="max-w-xl mx-auto px-4 -mt-16 relative z-10">
    <!-- Card Principal do Estabelecimento -->
    <div class="bg-zinc-900/95 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
      <div class="flex items-center gap-2 mb-1">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 Aberto Agora</span>
        <span class="text-xs text-zinc-400">⏱️ 30-45 min</span>
        <span class="text-xs text-zinc-400">🛵 Entrega R$ 5,00</span>
      </div>
      <h1 class="text-2xl font-bold text-white tracking-tight">${businessName}</h1>
      <p class="text-xs text-zinc-400 mt-1">${subNiche.title} · ${destinationAddress}</p>
      <div class="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
        <span class="text-amber-400 font-semibold">★ ${rating} (${reviewsCount} avaliações no Google)</span>
        <div class="flex items-center gap-3">
          <a href="/agendar/${finalSlug}" target="_top" class="text-amber-400 hover:underline font-bold">🗓️ Reservar Mesa</a>
          <a href="https://wa.me/${cleanWhatsapp}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">WhatsApp →</a>
        </div>
      </div>
    </div>

    <!-- Navegação de Categorias Funcional -->
    <div class="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="category-pills">
      ${subNiche.categories
        .map(
          (cat, idx) =>
            `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              idx === 0
                ? "bg-amber-500 text-black font-bold shadow-md"
                : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
            }">${cat}</button>`,
        )
        .join("")}
    </div>

    <!-- Itens do Cardápio Interativos com data-category -->
    <div class="mt-4 space-y-3" id="products-container">
      ${subNiche.items
        .map(
          (item, idx) => `
        <div class="product-card flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-white/10 gap-3 hover:border-amber-500/30 transition-all" data-category="${item.category || ''}">
          <div class="flex-1 min-w-0">
            ${item.badge ? `<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">${item.badge}</span>` : ""}
            <h3 class="font-bold text-sm text-zinc-100 mt-0.5">${item.title}</h3>
            <p class="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">${item.desc}</p>
            <div class="mt-2.5 flex items-center gap-3">
              <span class="font-bold text-emerald-400 text-sm">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <button type="button" onclick="addToCart(${idx})" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1">
                <span>+ Adicionar</span>
              </button>
            </div>
          </div>
          <img src="${item.img}" class="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10" alt="${item.title}">
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

  <!-- Modal / Drawer da Sacola & Checkout WhatsApp -->
  <div id="cart-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          <label class="block text-zinc-400 mb-1 font-semibold">Observações do Pedido (opcional):</label>
          <input id="client-notes" type="text" placeholder="Ex: Sem cebola, troco para 50..." class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
      </div>

      <!-- Botão Concluir no WhatsApp -->
      <button type="button" onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];
    let isDeliveryMode = true;

    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-amber-500 text-black font-bold shadow-md';
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

    function addToCart(idx) {
      const item = availableItems[idx];
      if (!item) return;
      const found = cart.find(i => i.title === item.title);
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ title: item.title, price: Number(item.price), img: item.img, qty: 1 });
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

    function renderCart() {
      const floatingBar = document.getElementById('cart-floating-bar');
      const countEl = document.getElementById('cart-count');
      const totalEl = document.getElementById('cart-total');
      const itemsList = document.getElementById('cart-items-list');
      const subtotalEl = document.getElementById('modal-subtotal');
      const feeEl = document.getElementById('modal-delivery-fee');
      const modalTotalEl = document.getElementById('modal-total');

      const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
      const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const deliveryFee = isDeliveryMode && subtotal > 0 ? 5.0 : 0.0;
      const total = subtotal > 0 ? subtotal + deliveryFee : 0;

      if (floatingBar) {
        floatingBar.style.display = totalItems > 0 ? 'block' : 'none';
      }
      if (countEl) countEl.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
      if (totalEl) totalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (subtotalEl) subtotalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (feeEl) feeEl.innerText = isDeliveryMode ? 'R$ 5,00' : 'Grátis (Retirada)';
      if (modalTotalEl) modalTotalEl.innerText = 'R$ ' + total.toFixed(2).replace('.', ',');

      if (itemsList) {
        if (cart.length === 0) {
          itemsList.innerHTML = '<p class="text-zinc-500 text-center py-6 text-xs">Sua sacola está vazia.</p>';
        } else {
          itemsList.innerHTML = cart.map((item, idx) => \`
            <div class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-white/5 gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-white truncate">\${item.title}</h4>
                <p class="text-xs text-emerald-400 font-semibold mt-0.5">R$ \${(item.price * item.qty).toFixed(2).replace('.', ',')}</p>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="updateQty(\${idx}, -1)" class="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95">-</button>
                <span class="text-xs font-bold text-white w-5 text-center">\${item.qty}</span>
                <button type="button" onclick="updateQty(\${idx}, 1)" class="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95">+</button>
              </div>
            </div>
          \`).join('');
        }
      }
    }

    function openCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.add('hidden');
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

      let msg = '🍔 *NOVO PEDIDO - ' + storeName.toUpperCase() + '*\\n\\n';
      if (clientName) msg += '👤 *Cliente:* ' + clientName + '\\n';
      msg += '🛵 *Tipo:* ' + (isDeliveryMode ? 'Entrega no Endereço' : 'Retirada no Balcão') + '\\n';
      if (isDeliveryMode && clientAddress) {
        msg += '📍 *Endereço:* ' + clientAddress + '\\n';
      }
      msg += '💳 *Pagamento:* ' + paymentMethod + '\\n';
      if (notes) msg += '📝 *Obs:* ' + notes + '\\n';
      msg += '\\n📋 *ITENS ESCOLHIDOS:*\\n';

      let subtotal = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        msg += '• ' + item.qty + 'x ' + item.title + ' (R$ ' + itemTotal.toFixed(2).replace('.', ',') + ')\\n';
      });

      const deliveryFee = isDeliveryMode ? 5.0 : 0.0;
      const total = subtotal + deliveryFee;
      if (deliveryFee > 0) {
        msg += '\\n🛵 *Taxa de Entrega:* R$ 5,00';
      } else {
        msg += '\\n🏪 *Retirada:* Sem taxa de entrega';
      }
      msg += '\\n💰 *TOTAL:* R$ ' + total.toFixed(2).replace('.', ',') + '\\n\\n';
      msg += 'Por favor, confirme meu pedido!';

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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Vitrine & Loja</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-28">
  <header class="p-4 border-b border-white/10 flex items-center justify-between max-w-2xl mx-auto">
    <div class="font-bold text-lg tracking-tight text-white">${businessName}</div>
    <a href="https://wa.me/${cleanWhatsapp}" target="_blank" class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-semibold">Atendimento</a>
  </header>
  <main class="max-w-2xl mx-auto px-4 pt-6 space-y-6">
    <div class="relative h-48 rounded-2xl overflow-hidden border border-white/10">
      <img src="${subNiche.photos[0]}" class="w-full h-full object-cover" alt="${businessName}">
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent flex items-end p-4">
        <div>
          <span class="text-xs bg-pink-500 text-white font-bold px-2 py-0.5 rounded">Coleção Exclusiva</span>
          <h1 class="text-xl font-bold text-white mt-1">Destaques da Semana em ${city}</h1>
        </div>
      </div>
    </div>

    <!-- Categorias -->
    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      ${subNiche.categories
        .map(
          (cat, idx) =>
            `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              idx === 0
                ? "bg-pink-500 text-white font-bold shadow-md"
                : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
            }">${cat}</button>`,
        )
        .join("")}
    </div>

    <!-- Grade de Produtos -->
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3" id="products-grid">
        ${subNiche.items
          .map(
            (p, idx) => `
          <div class="product-card p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 flex flex-col justify-between" data-category="${p.category || ''}">
            <img src="${p.img}" class="w-full h-32 rounded-xl object-cover" alt="${p.title}">
            <div>
              <h3 class="text-xs font-bold text-white truncate">${p.title}</h3>
              <p class="text-[11px] text-zinc-400 line-clamp-2">${p.desc}</p>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs font-bold text-emerald-400">R$ ${p.price.toFixed(2).replace(".", ",")}</span>
              <button type="button" onclick="addToCart(${idx})" class="text-[11px] bg-pink-500 hover:bg-pink-400 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer active:scale-95">Comprar</button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
      <h3 class="font-bold text-sm text-white">📍 Visite Nossa Loja Física</h3>
      <p class="text-xs text-zinc-400">${destinationAddress}</p>
      <div class="grid grid-cols-2 gap-2 pt-2">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" class="py-2 rounded-xl bg-zinc-800 text-center text-xs font-semibold text-zinc-200">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" target="_blank" class="py-2 rounded-xl bg-zinc-800 text-center text-xs font-semibold text-cyan-400">Waze</a>
      </div>
    </div>
  </main>

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

  <!-- Modal Sacola -->
  <div id="cart-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <span>🛍️ Sua Sacola de Compras</span>
        </h2>
        <button type="button" onclick="closeCartModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm cursor-pointer">✕</button>
      </div>
      <div id="cart-items-list" class="space-y-2"></div>
      <div class="p-3 rounded-2xl bg-zinc-950/80 border border-white/5 flex justify-between text-sm font-bold text-white">
        <span>Total a Pagar:</span>
        <span id="modal-total" class="text-pink-400 font-black">R$ 0,00</span>
      </div>
      <button type="button" onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];

    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-pink-500 text-white font-bold shadow-md';
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

    function addToCart(idx) {
      const item = availableItems[idx];
      if (!item) return;
      const found = cart.find(i => i.title === item.title);
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ title: item.title, price: Number(item.price), qty: 1 });
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
      const modalTotalEl = document.getElementById('modal-total');

      const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
      const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

      if (floatingBar) floatingBar.style.display = totalItems > 0 ? 'block' : 'none';
      if (countEl) countEl.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
      if (totalEl) totalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (modalTotalEl) modalTotalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');

      if (itemsList) {
        if (cart.length === 0) {
          itemsList.innerHTML = '<p class="text-zinc-500 text-center py-6 text-xs">Sua sacola está vazia.</p>';
        } else {
          itemsList.innerHTML = cart.map((item, idx) => \`
            <div class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-white/5 gap-3">
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
          \`).join('');
        }
      }
    }

    function openCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeCartModal() {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.add('hidden');
    }

    function checkoutWhatsApp(phone, storeName) {
      if (cart.length === 0) {
        alert('Adicione itens à sua sacola antes de continuar.');
        return;
      }
      let msg = '🛍️ *NOVO PEDIDO - ' + storeName.toUpperCase() + '*\\n\\n📋 *PRODUTOS:*\n';
      let total = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        msg += '• ' + item.qty + 'x ' + item.title + ' (R$ ' + itemTotal.toFixed(2).replace('.', ',') + ')\\n';
      });
      msg += '\\n💰 *TOTAL:* R$ ' + total.toFixed(2).replace('.', ',') + '\\n\\nOlá! Gostaria de finalizar a compra destes itens.';
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
