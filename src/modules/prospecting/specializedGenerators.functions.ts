import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";
import { resolveGeminiApiKeyAsync } from "@/modules/ai/google-ai.service";

export type ProspectNicheCategory = "food" | "shop" | "barber" | "service";

export interface NicheActionMeta {
  category: ProspectNicheCategory;
  label: string;
  icon: string;
  badgeClass: string;
  buttonLabel: string;
  buttonClass: string;
  loadingLabel: string;
}

export function getProspectNicheCategory(niche?: string | null, name?: string | null): NicheActionMeta {
  const combined = `${niche || ""} ${name || ""}`.toLowerCase();

  // 1. Nicho Barbearia & Cuidado Masculino (Prioridade absoluta antes de qualquer verificação de bar/comida)
  if (/barbea|barbeir|barber|corte masculino|salao masculino|navalha|barba e cabelo/i.test(combined)) {
    return {
      category: "barber",
      label: "Site Barbearia",
      icon: "✂️",
      badgeClass: "border-amber-600/40 bg-amber-600/10 text-amber-300",
      buttonLabel: "Gerar Barbearia ✂️",
      buttonClass: "border-amber-600/50 bg-amber-600/15 text-amber-300 hover:bg-amber-600/25",
      loadingLabel: "Gerando Site Barbearia...",
    };
  }

  // 2. Nicho Gastronomia, Restaurante e Delivery (estilo iFood)
  // IMPORTANTE: Não deve dar match em 'barbearia'! Usar \bbar\b para bar isolado e checar ausência de barbearia.
  if (
    !/barbea|barbeir|barber/i.test(combined) &&
    (/hamburg|burger|pizza|lanche|restaurante|delivery|aça[ií]|acai|pastel|doceria|confeitaria|sorvet|gelat|picol[eé]|caf[eé]|churrasc|espet|sushi|comida|marmita|gastronom|choperia|padaria|alimento|bistr[oô]|pizzaria|hamburgueria/i.test(
      combined,
    ) ||
      /\bbar\b/i.test(combined))
  ) {
    const isIceCream = /sorvet|gelat|picol[eé]|aça[ií]|acai/i.test(combined);
    const isPizza = /pizza/i.test(combined);
    const isBurger = /hamburg|burger/i.test(combined);

    return {
      category: "food",
      label: isIceCream ? "Cardápio Sorveteria" : isPizza ? "Cardápio Pizzaria" : isBurger ? "Cardápio Burger" : "Cardápio Delivery",
      icon: isIceCream ? "🍦" : isPizza ? "🍕" : "🍔",
      badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      buttonLabel: isIceCream ? "Gerar Cardápio Sorveteria 🍦" : isPizza ? "Gerar Cardápio Pizzaria 🍕" : isBurger ? "Gerar Cardápio Burger 🍔" : "Gerar Cardápio iFood 🍔",
      buttonClass: "border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
      loadingLabel: "Gerando Cardápio Delivery...",
    };
  }

  // 3. Nicho Loja, Varejo, Moda e E-commerce (estilo Vitrine/Catálogo)
  if (
    /loja|roupa|moda|vestu[aá]rio|cal[cç]ado|sapato|boutique|[oó]tica|joia|semijoia|acess[oó]rio|celular|eletr[oô]nic|perfum|cosm[eé]tic|varejo|kids|bijuteria|lingerie|praia|otica/i.test(
      combined,
    )
  ) {
    return {
      category: "shop",
      label: "Catálogo & Loja",
      icon: "🛍️",
      badgeClass: "border-pink-500/40 bg-pink-500/10 text-pink-300",
      buttonLabel: "Gerar Loja 🛍️",
      buttonClass: "border-pink-500/50 bg-pink-500/15 text-pink-300 hover:bg-pink-500/25",
      loadingLabel: "Gerando Loja & Catálogo...",
    };
  }

  // 4. Nicho Serviços de Agendamento (Salão de Beleza Feminino, Estética, Clínicas)
  if (/est[eé]tica|beleza|sal[aã]o|spa|unha|manicure|cabelo|sobrancelha|c[ií]lios/i.test(combined)) {
    return {
      category: "service",
      label: "Site Estética & Beleza",
      icon: "✨",
      badgeClass: "border-rose-500/40 bg-rose-500/10 text-rose-300",
      buttonLabel: "Gerar Site Beleza ✨",
      buttonClass: "border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
      loadingLabel: "Gerando Site Beleza...",
    };
  }

  // 5. Demais nichos (Clínicas, Consultórios, Serviços, SaaS, etc.)
  return {
    category: "service",
    label: "Site Pro",
    icon: "⚡",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    buttonLabel: "Gerar Site Pro ⚡",
    buttonClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
    loadingLabel: "Gerando Site Pro...",
  };
}

export interface SubNicheItem {
  title: string;
  desc: string;
  price: number;
  img: string;
  badge?: string;
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
        categories: ["🍨 Mais Pedidos", "🍧 Taças Especiais", "🍇 Açaí na Tigela", "🥤 Milk Shakes & Picolés"],
        items: [
          {
            title: "Taça Suprema de Ninho com Nutella",
            desc: "Gelato artesanal cremoso, generosa camada de Nutella, morangos selecionados e leite Ninho.",
            price: 28.9,
            img: photos[1] || photos[0],
            badge: "Mais Pedido ⭐",
          },
          {
            title: "Tigela de Açaí Especial 500ml",
            desc: "Açaí cremoso batido na hora, fatias de banana, morango, granola crocante e leite condensado.",
            price: 24.5,
            img: photos[2] || photos[0],
            badge: "Destaque",
          },
          {
            title: "Cascão Gourmet Waffle Recheado",
            desc: "Cascão crocante artesanal recheado com calda quente de chocolate e 2 bolas de gelato à sua escolha.",
            price: 18.0,
            img: photos[0],
            badge: "Artesanal",
          },
          {
            title: "Milk Shake Belga Cremoso 400ml",
            desc: "Batido na hora com sorvete de chocolate belga premium, chantilly fresco e calda trufada.",
            price: 22.0,
            img: photos[3] || photos[0],
            badge: "Refrescante",
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
        categories: ["🍕 Mais Pedidas", "🔥 Especiais da Casa", "🧀 Tradicionais", "🍫 Doces"],
        items: [
          {
            title: "Pizza Calabresa Especial com Catupiry",
            desc: "Massa de fermentação lenta 48h, molho de tomate pelati, calabresa defumada artesanal e Catupiry legítimo.",
            price: 49.9,
            img: photos[0],
            badge: "Top 1 🏆",
          },
          {
            title: "Pizza Quatro Queijos Premium",
            desc: "Muçarela especial, provolone defumado, gorgonzola italiano e Catupiry gratinado.",
            price: 54.9,
            img: photos[2] || photos[0],
            badge: "Clássica",
          },
          {
            title: "Pizza Doce Nutella com Morango",
            desc: "Creme de avelã Nutella pura com fatias generosas de morango fresco e castanhas crocantes.",
            price: 42.0,
            img: photos[1] || photos[0],
            badge: "Sobremesa",
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
        categories: ["🍱 Combinados", "🥢 Temakis", "🔥 Hot Rolls", "🥟 Entradas"],
        items: [
          {
            title: "Combinado Salmão Especial 20 Peças",
            desc: "8 sashimis de salmão maçaricado, 4 niguiris com azeite trufado, 4 uramakis e 4 hossomakis.",
            price: 69.9,
            img: photos[0],
            badge: "Mais Vendido ⭐",
          },
          {
            title: "Temaki Salmão Completo com Cream Cheese",
            desc: "Alga nori crocante, salmão fresco em cubos, cream cheese Philadelphia e cebolinha verde.",
            price: 29.9,
            img: photos[1] || photos[0],
            badge: "Individual",
          },
          {
            title: "Hot Roll Philadelphia 10 Unidades",
            desc: "Enrolado empanado crocante recheado de salmão com cream cheese, finalizado com molho tarê e gergelim.",
            price: 32.0,
            img: photos[2] || photos[0],
            badge: "Crocante",
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
      categories: ["🍔 Smash Burgers", "🔥 Artesanais", "🍟 Porções", "🥤 Bebidas"],
      items: [
        {
          title: "Smash Burger Duplo Cheddar",
          desc: "2 blends de 90g prensados na chapa, queijo cheddar derretido, cebola caramelizada e maionese defumada no pão brioche.",
          price: 34.9,
          img: photos[1] || photos[0],
          badge: "Mais Pedido ⭐",
        },
        {
          title: "Combo Artesanal Bacon & Fritas",
          desc: "Blend 160g suculento, fatias de bacon crocante, queijo prato, picles e molho especial + Batata Frita individual.",
          price: 46.9,
          img: photos[2] || photos[0],
          badge: "Combo Completo",
        },
        {
          title: "Batata Rústica com Costela Desfiada",
          desc: "Porção generosa de batatas rústicas com tempero da casa, costela desfiada na cerveja preta e fondue de queijo.",
          price: 36.0,
          img: photos[0],
          badge: "Para Compartilhar",
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
      categories: ["✂️ Cortes de Cabelo", "🧔 Barba & Terapia", "🔥 Combos VIP", "💆 Cuidados"],
      items: [
        {
          title: "Corte Fade / Degradê na Navalha",
          desc: "Corte moderno personalizado com técnica de tesoura e máquina, acabamento preciso na navalha e pomada modeladora.",
          price: 45.0,
          img: photos[1] || photos[0],
          badge: "Destaque",
        },
        {
          title: "Barba Terapia com Toalha Quente",
          desc: "Modelagem completa da barba, esfoliação facial, vapor de ozônio, toalha quente aromática e óleo hidratante.",
          price: 40.0,
          img: photos[2] || photos[0],
          badge: "Relaxamento",
        },
        {
          title: "Combo VIP: Cabelo + Barba + Sobrancelha",
          desc: "Experiência completa de cuidado masculino com corte, barba terapia, alinhamento de sobrancelha e bebida inclusa.",
          price: 75.0,
          img: photos[0],
          badge: "Mais Procurado ⭐",
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
    categories: ["🗓️ Atendimento Especializado", "⭐ Procedimentos"],
    items: [
      {
        title: "Consulta & Diagnóstico Personalizado",
        desc: "Avaliação minuciosa com equipe qualificada e direcionamento sob medida para sua necessidade.",
        price: 150.0,
        img: photos[0],
        badge: "Principal",
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
 * Identifica o nicho, dispara o gerador especializado correspondente (Cardápio Delivery, Loja, Barbearia ou Site Pro)
 * com dados reais, salva na nuvem e retorna a rota pronta.
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

    // 1. Resolve chave do Gemini: primeiro do client (se fornecida), depois auth metadata, depois banco/env
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

    let generatedHtml = "";
    const realPhotos = subNiche.photos;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let systemInstruction = "";
        let promptTask = "";

        if (category === "food") {
          systemInstruction = `Você é um Arquiteto Frontend Especialista em Cardápios Digitais e Delivery estilo iFood / Anota AI.
Gere um arquivo HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>) autocontido, ultra responsivo, com Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS OBRIGATÓRIOS DO CARDÁPIO DIGITAL ESTILO IFOOD:
1. IDENTIDADE ESTRITA DO SUB-NICHO:
   - Especialidade do estabelecimento: "${subNiche.title}" (Subtipo: ${subNiche.subType}).
   - Se for Sorveteria/Açaí, NUNCA coloque hambúrguer ou pizza! Gere taças, açaí, milk shakes, picolés.
   - Se for Pizzaria, coloque pizzas doces e salgadas. Se for Hamburgueria, coloque smash burgers e porções.
2. Header com banner visual de capa do nicho, foto/logo, nome da empresa ("${data.businessName}"), badge "🟢 Aberto Agora", tempo médio ("30 - 45 min"), avaliação ("⭐ ${data.rating ?? 4.9} (${data.reviewsCount ?? 120} avaliações)"), taxa de entrega ("Entrega Grátis ou a partir de R$ 5,00").
3. Navegação Sticky de Categorias com chips deslizáveis correspondentes ao nicho: ${JSON.stringify(subNiche.categories)}.
4. Lista de itens do cardápio em layout iFood: Card horizontal com imagem apetitosa na direita, título destacado, ingredientes/descrição, preço em destaque verde/âmbar (ex: R$ 34,90), e botão "+ Adicionar" com evento onClick para colocar no carrinho.
5. CARRINHO DE COMPRAS INTERATIVO E SELECIONÁVEL EM VANILLA JS PURO:
   - Os itens DEVEM poder ser adicionados à sacola clicando no botão "+ Adicionar" de cada card.
   - Barra flutuante animada no rodapé: "🛍️ Ver Sacola (X itens) • R$ XX,XX" que aparece assim que há itens no carrinho.
   - Modal/Drawer da Sacola: lista itens com botões "+" e "-" para alterar quantidade, subtotal, taxa de entrega, opção (Entrega ou Retirada), forma de pagamento (Pix, Cartão, Dinheiro), campo de Nome e Endereço.
   - Botão final pulsante: "Concluir Pedido no WhatsApp" que monta uma mensagem detalhada e abre https://wa.me/${cleanWhatsapp}?text=... com todo o pedido estruturado!
6. Seção de Localização com Iframe do Google Maps e botões "Traçar Rota no Google Maps" e "Abrir no Waze".
7. Adicione a tag <base target="_top"> no <head>.
8. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere o cardápio digital completo interativo estilo iFood para:
Nome: "${data.businessName}"
Especialidade: "${subNiche.title}" (Subtipo: ${subNiche.subType})
Cidade: "${data.city}"
WhatsApp Oficial: "${cleanWhatsapp}"
Endereço: "${destinationAddress}"
Fotos e Itens de Referência: ${JSON.stringify(subNiche.items)}`;
        } else if (category === "barber") {
          systemInstruction = `Você é um Arquiteto Frontend Especialista em Barbearias Modernas e Cuidado Masculino Premium.
Gere um arquivo HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>) autocontido, ultra responsivo, com Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS OBRIGATÓRIOS DO SITE DE BARBEARIA:
1. Design visual escuro, elegante e masculino (tons grafite #0a0a0d, detalhes dourados/âmbar, texturas refinadas).
2. Hero impactante com foto de barbearia estilosa, badge "★ ${data.rating ?? 4.9} no Google (${data.reviewsCount ?? 80} avaliações)" e botão de destaque "🗓️ Agendar Horário Online".
3. Tabela / Grid de Serviços com preços claros e botão "Reservar":
   - Corte Fade / Degradê na Navalha (R$ 45,00)
   - Barba Terapia com Toalha Quente (R$ 40,00)
   - Combo VIP Cabelo + Barba (R$ 75,00)
   - Pigmentação & Sobrancelha (R$ 30,00)
4. MÓDULO DE AGENDAMENTO DE HORÁRIO INTERATIVO EM VANILLA JS:
   - Seletor de Serviço, Barbeiro e Período (Manhã / Tarde / Noite).
   - Botão "Confirmar Agendamento no WhatsApp" que dispara para https://wa.me/${cleanWhatsapp} com a solicitação pronta ou link para /agendar/${finalSlug}.
5. Seção de Diferenciais: Cerveja gelada, Toalha quente aromática, Mesa de sinuca, Ambiente 100% climatizado.
6. Seção de Localização com Google Maps e botões GPS (Google Maps e Waze).
7. Botão flutuante de WhatsApp no canto inferior direito.
8. Adicione <base target="_top"> no <head>.
9. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere o site profissional da Barbearia para:
Nome: "${data.businessName}"
Cidade: "${data.city}"
WhatsApp: "${cleanWhatsapp}"
Endereço: "${destinationAddress}"
Fotos de Referência: ${JSON.stringify(subNiche.photos)}`;
        } else if (category === "shop") {
          systemInstruction = `Você é um Arquiteto Frontend Especialista em E-commerce, Lojas e Vitrines de Produtos modernas.
Gere um arquivo HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>) autocontido, ultra responsivo, com Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS OBRIGATÓRIOS DA LOJA & VITRINE:
1. Header elegante com nome da loja ("${data.businessName}"), barra de busca e ícone de Sacola de Compras interativa.
2. Grade de produtos moderna com preços, parcelamento e botão "Adicionar à Sacola".
3. Carrinho / Sacola de Compras funcional em Vanilla JS que abre gaveta lateral e fecha pedido no WhatsApp https://wa.me/${cleanWhatsapp}.
4. Seção de Localização com Google Maps e Waze.
5. Adicione <base target="_top"> no <head>.
6. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere a vitrine virtual para "${data.businessName}", atuando em ${data.niche} em ${data.city}.
WhatsApp: ${cleanWhatsapp}.
Endereço: ${destinationAddress}.`;
        } else {
          systemInstruction = `Você é um Arquiteto Frontend Principal do Estúdio Criativo.
Gere um site institucional cinematográfico, com alta conversão, responsivo, com Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS:
1. Hero de alto impacto com foto temática, badge de nota ("★ ${data.rating ?? 4.9} no Google") e CTA para agendamento online.
2. Seção de Serviços / Especialidades em cards modernos.
3. Seção "🗓️ Agendar Horário Online" vinculada ao WhatsApp ou link de agendamento rápido /agendar/${finalSlug}.
4. Seção de Localização com mapa do Google Maps e botões de GPS Waze e Google Maps.
5. Botão flutuante pulsante de WhatsApp no canto inferior direito.
6. Adicione a tag <base target="_top"> no <head>.
7. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere o site profissional para "${data.businessName}", atuando em ${data.niche} em ${data.city}.
WhatsApp: ${cleanWhatsapp}.
Endereço: ${destinationAddress}.`;
        }

        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\n${promptTask}` }] }],
          config: {
            temperature: 0.3,
            thinkingConfig: { thinkingLevel: "low" as any },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini 15s")), 15000),
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response.text?.trim() || "";
        generatedHtml = text.replace(/^```html\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
      } catch (geminiErr) {
        console.warn("[SpecializedGenerators] Gemini 3.8 Flash não respondeu em tempo ou deu erro, ativando fallback garantido:", geminiErr);
      }
    }

    // 2. Fallbacks de contingência 100% interativos e contextualizados por sub-nicho caso a IA falhe ou não haja chave
    if (!generatedHtml || generatedHtml.length < 100) {
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
    }

    // 3. Salva a página oficial no banco de dados na tabela bio_pages
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
          photos: realPhotos,
          custom_html: generatedHtml,
          agenda_enabled: true,
          ai_concierge_enabled: true,
          whatsapp_enabled: true,
          gps_enabled: true,
        } as any,
      })
      .select("id, slug")
      .single();

    if (pageErr) {
      console.error("[generateSpecializedProspectSiteFn] Erro ao salvar página:", pageErr);
      throw new Error(`Falha ao salvar página: ${pageErr.message}`);
    }

    // 4. Se houver lead na prospecção, atualiza notas com a demo gerada
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
    };
  });

/**
 * Construtor HTML de Cardápio Delivery com Carrinho Interativo 100% Funcional em Vanilla JS
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
}): string {
  const { businessName, cleanWhatsapp, destinationAddress, encodedAddress, rating, reviewsCount, subNiche } = opts;
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
        <a href="https://wa.me/${cleanWhatsapp}" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">WhatsApp Oficial →</a>
      </div>
    </div>

    <!-- Navegação de Categorias -->
    <div class="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      ${subNiche.categories
        .map(
          (cat, idx) =>
            `<button class="px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              idx === 0 ? "bg-amber-500 text-black font-bold shadow-md" : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
            }">${cat}</button>`,
        )
        .join("")}
    </div>

    <!-- Itens do Cardápio Interativos -->
    <div class="mt-4 space-y-3">
      ${subNiche.items
        .map(
          (item, idx) => `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-white/10 gap-3 hover:border-amber-500/30 transition-all">
          <div class="flex-1 min-w-0">
            ${item.badge ? `<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">${item.badge}</span>` : ""}
            <h3 class="font-bold text-sm text-zinc-100 mt-0.5">${item.title}</h3>
            <p class="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">${item.desc}</p>
            <div class="mt-2.5 flex items-center gap-3">
              <span class="font-bold text-emerald-400 text-sm">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <button onclick="addToCart(${idx})" class="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-transform active:scale-95 shadow-sm">
                + Adicionar
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
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" class="py-2 px-3 rounded-xl bg-zinc-800 text-center text-xs font-semibold hover:bg-zinc-700 text-zinc-200 transition-all">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" class="py-2 px-3 rounded-xl bg-cyan-500/10 text-center text-xs font-semibold hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all">Waze</a>
      </div>
    </div>
  </div>

  <!-- Barra Flutuante Reativa da Sacola (aparece quando há itens) -->
  <div id="cart-floating-bar" style="display: none;" class="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40">
    <button onclick="openCartModal()" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-500 text-black font-bold text-sm shadow-2xl hover:bg-emerald-400 transition-all animate-bounce">
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
        <button onclick="closeCartModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm">✕</button>
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
          <span class="text-emerald-400 font-semibold">R$ 5,00</span>
        </div>
        <div class="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
          <span>Total a Pagar:</span>
          <span id="modal-total" class="text-emerald-400 font-black">R$ 5,00</span>
        </div>
      </div>

      <!-- Dados de Entrega do Cliente -->
      <div class="space-y-2.5 text-xs">
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Seu Nome Completo:</label>
          <input id="client-name" type="text" placeholder="Ex: Lucas Silva" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Endereço de Entrega ou "Vou Retirar":</label>
          <input id="client-address" type="text" placeholder="Rua, número e bairro" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Forma de Pagamento:</label>
          <select id="client-payment" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500">
            <option value="Pix">PIX (Chave enviada no WhatsApp)</option>
            <option value="Cartão de Crédito / Débito">Cartão de Crédito ou Débito na Entrega</option>
            <option value="Dinheiro">Dinheiro (com troco)</option>
          </select>
        </div>
      </div>

      <!-- Botão Disparar Pedido no WhatsApp -->
      <button onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];

    function addToCart(idx) {
      const item = availableItems[idx];
      if (!item) return;
      const found = cart.find(i => i.title === item.title);
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ title: item.title, price: item.price, img: item.img, qty: 1 });
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
      const modalTotalEl = document.getElementById('modal-total');

      const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
      const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const deliveryFee = 5.0;
      const total = subtotal > 0 ? subtotal + deliveryFee : 0;

      if (floatingBar) {
        floatingBar.style.display = totalItems > 0 ? 'block' : 'none';
      }
      if (countEl) countEl.innerText = totalItems + (totalItems === 1 ? ' item' : ' itens');
      if (totalEl) totalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
      if (subtotalEl) subtotalEl.innerText = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
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
                <button onclick="updateQty(\${idx}, -1)" class="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center justify-center">-</button>
                <span class="text-xs font-bold text-white w-5 text-center">\${item.qty}</span>
                <button onclick="updateQty(\${idx}, 1)" class="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">+</button>
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

      let msg = '*NOVO PEDIDO - ' + storeName.toUpperCase() + '*\\n\\n';
      if (clientName) msg += '👤 *Cliente:* ' + clientName + '\\n';
      if (clientAddress) msg += '📍 *Endereço:* ' + clientAddress + '\\n';
      msg += '💳 *Pagamento:* ' + paymentMethod + '\\n\\n';
      msg += '📋 *ITENS ESCOLHIDOS:*\\n';

      let subtotal = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        msg += '• ' + item.qty + 'x ' + item.title + ' (R$ ' + itemTotal.toFixed(2).replace('.', ',') + ')\\n';
      });

      const total = subtotal + 5.0;
      msg += '\\n🛵 *Taxa de Entrega:* R$ 5,00';
      msg += '\\n💰 *TOTAL DO PEDIDO:* R$ ' + total.toFixed(2).replace('.', ',') + '\\n\\n';
      msg += 'Por favor, confirme meu pedido!';

      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    }
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
    <a href="/agendar/${finalSlug}" class="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-md">
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
      <a href="/agendar/${finalSlug}" class="px-6 py-3.5 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2">
        <span>🗓️ Agendar Meu Horário Online</span>
      </a>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de agendar um horário na ${businessName}.`)}" class="px-6 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2">
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
    <p class="text-xs text-zinc-400 text-center mb-6">Escolha o serviço desejado e reserve seu horário</p>

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
          <a href="/agendar/${finalSlug}" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shrink-0">
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
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all">Google Maps</a>
          <a href="https://waze.com/ul?q=${encodedAddress}" class="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-semibold transition-all">Waze</a>
        </div>
      </div>
      <iframe src="https://maps.google.com/maps?q=${encodedAddress}&output=embed" class="w-full h-56 rounded-2xl border border-white/10" loading="lazy"></iframe>
    </div>
  </section>

  <!-- Botão Flutuante WhatsApp -->
  <div class="fixed bottom-5 right-5 z-50">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Gostaria de agendar um atendimento na ${businessName}.`)}" class="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl hover:scale-105 transition-all">
      <span>WhatsApp Oficial</span>
    </a>
  </div>
</body>
</html>`;
}

/**
 * Construtor HTML de Loja & Vitrine com Sacola
 */
function buildShopCatalogHtml(opts: {
  businessName: string;
  city: string;
  niche: string;
  cleanWhatsapp: string;
  destinationAddress: string;
  encodedAddress: string;
  subNiche: SubNicheInfo;
}): string {
  const { businessName, city, niche, cleanWhatsapp, destinationAddress, encodedAddress, subNiche } = opts;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${businessName} — Vitrine & Loja</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-24">
  <header class="p-4 border-b border-white/10 flex items-center justify-between max-w-2xl mx-auto">
    <div class="font-bold text-lg tracking-tight text-white">${businessName}</div>
    <a href="https://wa.me/${cleanWhatsapp}" class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-semibold">Atendimento</a>
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
    <div class="space-y-3">
      <h2 class="text-sm font-bold text-zinc-300 uppercase tracking-wider">Produtos em Destaque</h2>
      <div class="grid grid-cols-2 gap-3">
        ${subNiche.items
          .map(
            (p) => `
          <div class="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
            <img src="${p.img}" class="w-full h-32 rounded-xl object-cover" alt="${p.title}">
            <h3 class="text-xs font-bold text-white truncate">${p.title}</h3>
            <p class="text-[11px] text-zinc-400 line-clamp-2">${p.desc}</p>
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs font-bold text-emerald-400">R$ ${p.price.toFixed(2).replace(".", ",")}</span>
              <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no produto ${p.title} da ${businessName}.`)}" class="text-[11px] bg-white text-black font-bold px-2.5 py-1 rounded-lg hover:bg-zinc-200">Comprar</a>
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
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" class="py-2 rounded-xl bg-zinc-800 text-center text-xs font-semibold text-zinc-200">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" class="py-2 rounded-xl bg-zinc-800 text-center text-xs font-semibold text-cyan-400">Waze</a>
      </div>
    </div>
  </main>
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
    <a href="/agendar/${finalSlug}" class="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all shadow-md">
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
      Atendimento exclusivo em ${niche}. Agende seu horário ou tire suas dúvidas diretamente conosco.
    </p>
    <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
      <a href="/agendar/${finalSlug}" class="px-6 py-3.5 rounded-2xl bg-emerald-500 text-black font-black text-sm shadow-xl hover:bg-emerald-400 transition-all flex items-center gap-2">
        <span>🗓️ Agendar Horário Online</span>
      </a>
      <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Vim pelo site da ${businessName} e gostaria de informações.`)}" class="px-6 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2">
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
          <div class="pt-2">
            <a href="/agendar/${finalSlug}" class="text-xs text-emerald-400 font-semibold hover:underline">Reservar Horário →</a>
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
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all">Google Maps</a>
          <a href="https://waze.com/ul?q=${encodedAddress}" class="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-semibold transition-all">Waze</a>
        </div>
      </div>
      <iframe src="https://maps.google.com/maps?q=${encodedAddress}&output=embed" class="w-full h-56 rounded-2xl border border-white/10" loading="lazy"></iframe>
    </div>
  </section>

  <div class="fixed bottom-5 right-5 z-50">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Vim pelo site da ${businessName} e gostaria de agendar um atendimento.`)}" class="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-black font-bold text-xs shadow-2xl hover:scale-105 transition-all">
      <span>Atendimento no WhatsApp</span>
    </a>
  </div>
</body>
</html>`;
}
