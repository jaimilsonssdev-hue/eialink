/**
 * Motor de Provisionamento Automático de Ferramentas por Nicho.
 * Garante que qualquer site gerado (via Radar de Prospecção, Estúdio Criativo ou Agente)
 * nasça com as ferramentas reais da plataforma EiaLink já ativas e populadas no banco:
 * - Agenda Online (`booking_settings`, `booking_availability`, `booking_services`)
 * - Agente de Atendimento Virtual (`social_links.chat_flow`)
 * - Links reais amarrados (/agendar/{slug}, /cardapio/{slug}, /loja/{slug})
 */

export type NicheCategoryType =
  "barber" | "healthcare" | "beauty" | "auto" | "food" | "shop" | "service" | "industry";

export interface NicheServicePreset {
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
  badge?: string;
}

export interface NicheProvisionConfig {
  category: NicheCategoryType;
  label: string;
  isBooking: boolean;
  ctaUrl: (slug: string) => string;
  ctaLabel: string;
  services: NicheServicePreset[];
  chatWelcome: (businessName: string) => string;
  chatOptions: Array<{ label: string; action: string }>;
}

export const NICHE_CONFIGS: Record<NicheCategoryType, NicheProvisionConfig> = {
  barber: {
    category: "barber",
    label: "Barbearia & Barber Shop",
    isBooking: true,
    ctaUrl: (slug) => `/agendar/${slug}`,
    ctaLabel: "🗓️ Agendar Horário",
    services: [
      {
        name: "Corte Degradê / Social",
        duration_minutes: 40,
        price: 45,
        description: "Corte na tesoura e máquina com finalização impecável e penteado.",
        badge: "Mais Pedido ⭐",
      },
      {
        name: "Barboterapia Tradicional",
        duration_minutes: 30,
        price: 35,
        description: "Toalha quente, hidratação profunda, esfoliação e lâmina descartável.",
        badge: "Relaxante",
      },
      {
        name: "Combo Cabelo + Barba VIP",
        duration_minutes: 60,
        price: 70,
        description: "Experiência completa com corte personalizado e barboterapia no vapor.",
        badge: "Melhor Custo",
      },
      {
        name: "Acabamento & Sobrancelha",
        duration_minutes: 20,
        price: 20,
        description: "Alinhamento de contorno da barba, nuca e sobrancelha navalhada.",
      },
    ],
    chatWelcome: (name) =>
      `Olá! Seja bem-vindo(a) à ${name}. Como podemos transformar seu visual hoje? Agende seu horário online em poucos segundos!`,
    chatOptions: [
      { label: "🗓️ Agendar Horário Online", action: "booking" },
      { label: "📍 Localização & Como Chegar", action: "location" },
      { label: "💬 Falar no WhatsApp", action: "whatsapp" },
    ],
  },

  healthcare: {
    category: "healthcare",
    label: "Saúde & Odontologia",
    isBooking: true,
    ctaUrl: (slug) => `/agendar/${slug}`,
    ctaLabel: "🗓️ Agendar Consulta",
    services: [
      {
        name: "Avaliação & Planejamento do Sorriso",
        duration_minutes: 30,
        price: 0,
        description:
          "Diagnóstico completo, avaliação clínica e planejamento estético personalizado.",
        badge: "Gratuito",
      },
      {
        name: "Lentes em Resina Composta (por elemento)",
        duration_minutes: 60,
        price: 450,
        description:
          "Transformação estética com resina de alta estratificação e acabamento natural.",
        badge: "Mais Procurado ⭐",
      },
      {
        name: "Clareamento a Laser / Fotoativado",
        duration_minutes: 60,
        price: 650,
        description: "Procedimento de consultório para iluminar o sorriso com tecnologia de ponta.",
        badge: "Destaque",
      },
      {
        name: "Limpeza & Profilaxia Profunda",
        duration_minutes: 45,
        price: 150,
        description: "Remoção de tártaro, ultrassom, polimento profilático e aplicação de flúor.",
        badge: "Essencial",
      },
      {
        name: "Harmonização & Procedimentos Clínicos",
        duration_minutes: 45,
        price: 250,
        description: "Tratamento clínico e estético de alta precisão com materiais premium.",
      },
    ],
    chatWelcome: (name) =>
      `Olá! Bem-vindo(a) à ${name}. Estamos prontos para cuidar do seu bem-estar. Agende sua consulta ou tire dúvidas conosco!`,
    chatOptions: [
      { label: "🗓️ Agendar Consulta Online", action: "booking" },
      { label: "📍 Endereço da Clínica", action: "location" },
      { label: "💬 Falar com a Recepção", action: "whatsapp" },
    ],
  },

  beauty: {
    category: "beauty",
    label: "Estética & Beleza",
    isBooking: true,
    ctaUrl: (slug) => `/agendar/${slug}`,
    ctaLabel: "🗓️ Agendar Horário",
    services: [
      {
        name: "Limpeza de Pele Profunda",
        duration_minutes: 60,
        price: 160,
        description: "Extração de cravos, vapor de ozônio, hidratação profunda e máscara calmante.",
        badge: "Mais Procurado",
      },
      {
        name: "Drenagem Linfática Corporal",
        duration_minutes: 50,
        price: 130,
        description: "Redução de inchaço, ativação da circulação e relaxamento corporal.",
        badge: "Bem-Estar",
      },
      {
        name: "Design de Sobrancelhas & Lash",
        duration_minutes: 45,
        price: 80,
        description: "Mapeamento facial personalizado para realçar o olhar.",
        badge: "Express",
      },
      {
        name: "Massagem Relaxante com Aromaterapia",
        duration_minutes: 60,
        price: 150,
        description: "Alívio de tensões musculares com óleos essenciais terapêuticos.",
      },
    ],
    chatWelcome: (name) =>
      `Olá, que bom ter você aqui na ${name}! Pronta(o) para seu momento de autocuidado? Reserve seu horário online!`,
    chatOptions: [
      { label: "🗓️ Agendar Procedimento", action: "booking" },
      { label: "📍 Onde Estamos", action: "location" },
      { label: "💬 Conversar no WhatsApp", action: "whatsapp" },
    ],
  },

  auto: {
    category: "auto",
    label: "Oficina & Auto Center",
    isBooking: true,
    ctaUrl: (slug) => `/agendar/${slug}`,
    ctaLabel: "🗓️ Agendar Revisão",
    services: [
      {
        name: "Revisão Preventiva & Check-up de Itens",
        duration_minutes: 60,
        price: 120,
        description: "Inspeção completa de freios, suspensão, pneus, fluidos e iluminação.",
        badge: "Segurança ⭐",
      },
      {
        name: "Troca de Óleo e Filtros",
        duration_minutes: 40,
        price: 90,
        description: "Troca rápida de óleo especificado pelo fabricante e substituição de filtros.",
        badge: "Rápido",
      },
      {
        name: "Alinhamento 3D & Balanceamento",
        duration_minutes: 45,
        price: 110,
        description: "Ajuste milimétrico de geometria e balanceamento das rodas.",
        badge: "Recomendado",
      },
      {
        name: "Diagnóstico Eletrônico Computadorizado",
        duration_minutes: 30,
        price: 80,
        description: "Varredura completa via scanner automotivo para identificar falhas.",
      },
    ],
    chatWelcome: (name) =>
      `Olá! Bem-vindo(a) à ${name}. Seu carro em mãos de especialistas. Agende sua revisão ou traga seu veículo para diagnóstico!`,
    chatOptions: [
      { label: "🗓️ Agendar Serviço / Revisão", action: "booking" },
      { label: "📍 Localização da Oficina", action: "location" },
      { label: "💬 Orçamento no WhatsApp", action: "whatsapp" },
    ],
  },

  food: {
    category: "food",
    label: "Gastronomia & Restaurantes",
    isBooking: false,
    ctaUrl: (slug) => `/cardapio/${slug}`,
    ctaLabel: "🍕 Ver Cardápio & Pedir",
    services: [],
    chatWelcome: (name) =>
      `Olá! Seja bem-vindo(a) ao ${name}. Deu fome? Veja nosso cardápio completo ou faça seu pedido com entrega rápida!`,
    chatOptions: [
      { label: "🍕 Ver Cardápio Online", action: "cardapio" },
      { label: "🛵 Fazer Pedido no WhatsApp", action: "whatsapp" },
      { label: "📍 Horários e Localização", action: "location" },
    ],
  },

  shop: {
    category: "shop",
    label: "Lojas & Varejo",
    isBooking: false,
    ctaUrl: (slug) => `/loja/${slug}`,
    ctaLabel: "🛍️ Ver Catálogo de Produtos",
    services: [],
    chatWelcome: (name) =>
      `Olá! Seja muito bem-vindo(a) à ${name}. Conheça nossas novidades e promoções exclusivas da coleção!`,
    chatOptions: [
      { label: "🛍️ Ver Catálogo / Vitrine", action: "shop" },
      { label: "📍 Endereço da Loja", action: "location" },
      { label: "💬 Atendimento VIP WhatsApp", action: "whatsapp" },
    ],
  },

  industry: {
    category: "industry",
    label: "Indústria & B2B",
    isBooking: false,
    ctaUrl: (slug) => `#orcamento`,
    ctaLabel: "🏭 Solicitar Orçamento B2B",
    services: [],
    chatWelcome: (name) =>
      `Olá! Bem-vindo(a) à ${name}. Atendemos indústrias e empresas com soluções sob medida. Como podemos atender seu projeto?`,
    chatOptions: [
      { label: "📋 Solicitar Orçamento B2B", action: "whatsapp" },
      { label: "📍 Onde Estamos", action: "location" },
      { label: "💬 Falar com Especialista", action: "whatsapp" },
    ],
  },

  service: {
    category: "service",
    label: "Serviços Especializados",
    isBooking: true,
    ctaUrl: (slug) => `/agendar/${slug}`,
    ctaLabel: "🗓️ Agendar Atendimento",
    services: [
      {
        name: "Atendimento Inicial & Diagnóstico",
        duration_minutes: 45,
        price: 0,
        description: "Entendimento da sua demanda e apresentação da melhor solução.",
        badge: "Primeiro Passo",
      },
      {
        name: "Consultoria Especializada",
        duration_minutes: 60,
        price: 200,
        description: "Sessão dedicada com especialista para resolver seu desafio pontual.",
        badge: "Personalizado",
      },
      {
        name: "Visita Técnica / Orçamento no Local",
        duration_minutes: 60,
        price: 80,
        description: "Avaliação técnica no local com proposta comercial detalhada.",
      },
    ],
    chatWelcome: (name) =>
      `Olá! Seja bem-vindo(a) à ${name}. Temos a solução ideal para o que você precisa. Agende um horário ou fale conosco!`,
    chatOptions: [
      { label: "🗓️ Agendar Horário Online", action: "booking" },
      { label: "📍 Localização da Empresa", action: "location" },
      { label: "💬 Falar no WhatsApp", action: "whatsapp" },
    ],
  },
};

/**
 * Identifica a categoria exata de nicho cruzando nome da empresa e categoria do lead
 */
export function detectNicheCategory(
  niche?: string | null,
  name?: string | null,
): NicheCategoryType {
  const cleanNiche = (niche ?? "").trim().toLowerCase();
  const text = `${cleanNiche} ${name ?? ""}`.trim().toLowerCase();
  if (!text) {
    return "service";
  }

  // 1. Barbearia
  if (
    /barbea|barbeir|barber|navalha|\bbarba\b|degrad[eê]|\bfade\b|cabelo\s*masculino/i.test(text)
  ) {
    return "barber";
  }

  // 2. Saúde & Odonto
  if (
    /odonto|dent|sorriso|cl[ií]nica|consult[oó]rio|\bdr\b|\bdra\b|doutor|doutora|m[eé]dic|pediatr|oftalmo|fisioter|psic[oó]l|terapeuta|nutri|sa[uú]de|ortoped|dermatolog|resina|lentes?\s*(?:de|em)?\s*resina|facetas?|clareamento|implante|harmoniza[cç][aã]o/i.test(
      text,
    )
  ) {
    return "healthcare";
  }

  // 3. Estética & Beleza
  if (
    /est[eé]tica|beleza|sal[aã]o|manicure|pedicure|lash|c[ií]lios|sobrancelha|depila|massagem|spa|bronze|maquiagem/i.test(
      text,
    )
  ) {
    return "beauty";
  }

  // 4. Mecânica & Auto Center
  if (
    /oficina|mec[aâ]nica|auto\s*center|autocenter|funilaria|pintura\s*auto|pneus|borracharia|lava\s*jato|lava\s*r[aá]pido|est[eé]tica\s*automotiva/i.test(
      text,
    )
  ) {
    return "auto";
  }

  // 5. Gastronomia & Alimentação
  if (
    /restauran|lanche|burger|hamburguer|pizza|pizzaria|a[cç]a[ií]|sorvet|delivery|comida|marmita|a[cç]ougue|padaria|confeitaria|sushi|japon[eê]s|churrasco|espetinho|pastel|hot\s*dog|choperia|cervejaria|\bbar\b(?!\s*be)/i.test(
      text,
    )
  ) {
    return "food";
  }

  // 6. Lojas & Varejo
  if (
    /loja|moda|roupa|calcado|calçado|otica|ótica|boutique|bijuteria|reloj|acessorio|eletr[oô]nic|celular|smartphone|farmacia|drogaria|pet\s*shop|floricultura|moveis|móveis|colch[oõ]es|auto\s*pe[cç]as/i.test(
      text,
    )
  ) {
    return "shop";
  }

  // 7. Indústria & B2B
  if (
    /f[aá]brica|ind[uú]stria|solar|fotovolt|distribuidor|usinagem|caldeiraria|manufatura|metal[uú]rgica|\bdsun\b/i.test(
      text,
    )
  ) {
    return "industry";
  }

  return "service";
}

export interface NicheDealPreset {
  title: (businessName: string) => string;
  description: (businessName: string) => string;
  original_price: number;
  deal_price: number;
  discount_badge: string;
}

export const NICHE_DEAL_PRESETS: Record<NicheCategoryType, NicheDealPreset> = {
  healthcare: {
    title: (name) => `Avaliação & Planejamento Especializado com 35% OFF na ${name}`,
    description: () => "Atendimento prioritário com diagnóstico completo e planejamento personalizado.",
    original_price: 200,
    deal_price: 130,
    discount_badge: "35% OFF",
  },
  barber: {
    title: (name) => `Combo Barba + Cabelo VIP com 30% OFF na ${name}`,
    description: () => "Experiência completa com toalha quente, corte moderno e acabamento navalhado.",
    original_price: 70,
    deal_price: 49,
    discount_badge: "30% OFF",
  },
  beauty: {
    title: (name) => `Primeira Sessão de Procedimento VIP com 40% OFF na ${name}`,
    description: () => "Tratamento estético exclusivo com profissionais especialistas e produtos premium.",
    original_price: 150,
    deal_price: 90,
    discount_badge: "40% OFF",
  },
  auto: {
    title: (name) => `Check-up Preventivo 20 Itens com 50% OFF na ${name}`,
    description: () => "Revisão detalhada de suspensão, freios, fluidos e segurança para o seu veículo.",
    original_price: 180,
    deal_price: 90,
    discount_badge: "50% OFF",
  },
  food: {
    title: (name) => `Combo Degustação Especial com 25% OFF na ${name}`,
    description: () => "Prato ou combo artesanal selecionado da casa para você saborear.",
    original_price: 80,
    deal_price: 60,
    discount_badge: "25% OFF",
  },
  shop: {
    title: (name) => `Cupom de R$ 30 OFF na Primeira Compra na ${name}`,
    description: () => "Válido para compras a partir de R$ 100 na loja física ou online.",
    original_price: 100,
    deal_price: 70,
    discount_badge: "R$ 30 OFF",
  },
  service: {
    title: (name) => `Diagnóstico & Orçamento Prioritário Sem Custo na ${name}`,
    description: () => "Análise técnica rápida e atendimento prioritário com condições facilitadas.",
    original_price: 120,
    deal_price: 60,
    discount_badge: "50% OFF",
  },
  industry: {
    title: (name) => `Consultoria Técnica e Visita Especializada na ${name}`,
    description: () => "Visita técnica inicial e plano executivo sem compromisso.",
    original_price: 250,
    deal_price: 150,
    discount_badge: "40% OFF",
  },
};

export const NICHE_LOYALTY_REWARDS: Record<NicheCategoryType, Array<{ id: string; title: string; description: string; pointsCost: number; badge?: string }>> = {
  healthcare: [
    { id: "rew-1", title: "Kit de Higiene Oral Premium", description: "Kit completo de cuidados dentários de alta qualidade.", pointsCost: 60, badge: "Mais Fácil" },
    { id: "rew-2", title: "Profilaxia & Polimento Cortesia", description: "Sessão de limpeza profilática preventiva para manutenção.", pointsCost: 150, badge: "Destaque" },
    { id: "rew-3", title: "Voucher de R$ 150 em Procedimento", description: "Desconto direto em clareamento ou procedimentos estéticos.", pointsCost: 300, badge: "Super Prêmio" },
  ],
  barber: [
    { id: "rew-1", title: "Acabamento & Sobrancelha Navalhada", description: "Alinhamento de contorno da barba e nuca.", pointsCost: 50, badge: "Mais Fácil" },
    { id: "rew-2", title: "Barboterapia Tradicional Cortesia", description: "Toalha quente, hidratação e esfoliação no vapor.", pointsCost: 120, badge: "Destaque" },
    { id: "rew-3", title: "Corte VIP à sua Escolha", description: "Um corte completo com lavagem e penteado.", pointsCost: 220, badge: "Super Prêmio" },
  ],
  beauty: [
    { id: "rew-1", title: "Esfoliação ou Hidratação Labial", description: "Revitalização express com produtos profissionais.", pointsCost: 60, badge: "Mais Fácil" },
    { id: "rew-2", title: "Design de Sobrancelhas VIP", description: "Mapeamento facial e alinhamento personalizado.", pointsCost: 140, badge: "Destaque" },
    { id: "rew-3", title: "Revitalização Facial Completa", description: "Sessão de cuidados faciais profundos e máscara calmante.", pointsCost: 280, badge: "Super Prêmio" },
  ],
  auto: [
    { id: "rew-1", title: "Cristalização de Para-brisa", description: "Tratamento hidrorrepelente para visibilidade na chuva.", pointsCost: 60, badge: "Mais Fácil" },
    { id: "rew-2", title: "Alinhamento e Balanceamento", description: "Serviço preventivo para estabilidade e conservação de pneus.", pointsCost: 150, badge: "Destaque" },
    { id: "rew-3", title: "Oxi-Sanitização do Ar-Condicionado", description: "Eliminação profunda de fungos, odores e bactérias da cabine.", pointsCost: 260, badge: "Super Prêmio" },
  ],
  food: [
    { id: "rew-1", title: "Bebida ou Café Especial", description: "Refrigerante lata, suco natural ou café barista à sua escolha.", pointsCost: 50, badge: "Mais Fácil" },
    { id: "rew-2", title: "Sobremesa da Casa", description: "Deliciosa sobremesa artesanal ou porção especial do cardápio.", pointsCost: 120, badge: "Destaque" },
    { id: "rew-3", title: "Prato Principal ou Pizza Tradicional", description: "Um prato principal individual ou pizza clássica do cardápio.", pointsCost: 250, badge: "Super Prêmio" },
  ],
  shop: [
    { id: "rew-1", title: "Brinde ou Acessório da Loja", description: "Um mimo especial da coleção para complementar sua compra.", pointsCost: 60, badge: "Mais Fácil" },
    { id: "rew-2", title: "Cupom de R$ 30 de Desconto", description: "Desconto direto para sua próxima compra na loja.", pointsCost: 140, badge: "Destaque" },
    { id: "rew-3", title: "Cupom de R$ 80 de Desconto", description: "Desconto especial em qualquer peça ou produto da loja.", pointsCost: 280, badge: "Super Prêmio" },
  ],
  service: [
    { id: "rew-1", title: "Mimo Exclusivo de Boas-Vindas", description: "Cortesia especial em agradecimento pela parceria.", pointsCost: 50, badge: "Mais Fácil" },
    { id: "rew-2", title: "Cupom de R$ 50 OFF no Próximo Serviço", description: "Abatimento direto na contratação de nova solução.", pointsCost: 150, badge: "Destaque" },
    { id: "rew-3", title: "Atendimento Prioritário com Cortesia VIP", description: "Visita e diagnóstico técnico sem qualquer custo.", pointsCost: 280, badge: "Super Prêmio" },
  ],
  industry: [
    { id: "rew-1", title: "Relatório Técnico Cortesia", description: "Documentação preventiva sem custo adicional.", pointsCost: 70, badge: "Mais Fácil" },
    { id: "rew-2", title: "Desconto de 10% no Próximo Projeto", description: "Bônus especial aplicável ao orçamento aprovado.", pointsCost: 180, badge: "Destaque" },
    { id: "rew-3", title: "Consultoria Executiva Presencial", description: "Sessão presencial com engenheiro ou especialista técnico.", pointsCost: 320, badge: "Super Prêmio" },
  ],
};

export interface ProvisionNicheOptions {
  supabase: any;
  pageId: string;
  slug: string;
  businessName: string;
  niche?: string | null;
  city?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

export interface ProvisionResult {
  category: NicheCategoryType;
  label: string;
  isBooking: boolean;
  ctaUrl: string;
  ctaLabel: string;
  servicesCreated: number;
  chatConfigured: boolean;
  dealCreated?: boolean;
  loyaltyConfigured?: boolean;
}

/**
 * Provisiona no Supabase as tabelas e metadados reais correspondentes ao nicho.
 * Se for agendamento: booking_settings, booking_availability, booking_services.
 * Em todos: social_links.chat_flow (robô de atendimento).
 */
export async function provisionPlatformToolsForNiche(
  options: ProvisionNicheOptions,
): Promise<ProvisionResult> {
  const {
    supabase,
    pageId,
    slug,
    businessName,
    niche,
    city,
    whatsapp,
    address,
    rating,
    reviewsCount,
  } = options;

  const category = detectNicheCategory(niche, businessName);
  const config = NICHE_CONFIGS[category];
  const ctaUrl = config.ctaUrl(slug);
  const ctaLabel = config.ctaLabel;

  let servicesCreated = 0;
  let chatConfigured = false;

  // 1. Provisiona Agenda Online no banco se for nicho de agendamento
  if (config.isBooking) {
    try {
      // 1.1 booking_settings
      await supabase.from("booking_settings").upsert(
        {
          bio_page_id: pageId,
          active: true,
          timezone: "America/Sao_Paulo",
          min_notice_hours: 1,
          max_days_ahead: 30,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bio_page_id" },
      );

      // 1.2 booking_availability (Segunda a Sábado, 09h às 19h)
      const availabilityRows = [1, 2, 3, 4, 5, 6].map((weekday) => ({
        bio_page_id: pageId,
        weekday,
        start_time: "09:00",
        end_time: "19:00",
        active: true,
      }));
      await supabase
        .from("booking_availability")
        .upsert(availabilityRows, { onConflict: "bio_page_id,weekday" });

      // 1.3 booking_services (serviços com duração e preço)
      const { data: existingServices } = await supabase
        .from("booking_services")
        .select("id, name")
        .eq("bio_page_id", pageId);

      const existingNames = new Set(
        (existingServices || []).map((s: any) => String(s.name).trim().toLowerCase()),
      );

      let pos = 1;
      for (const s of config.services) {
        if (!existingNames.has(s.name.trim().toLowerCase())) {
          await supabase.from("booking_services").insert({
            bio_page_id: pageId,
            name: s.name,
            duration_minutes: s.duration_minutes,
            price: s.price,
            description: s.description,
            position: pos,
            active: true,
          });
          servicesCreated++;
        }
        pos++;
      }
    } catch (bookingErr) {
      console.warn("[NicheProvisioner] Erro ao provisionar agenda:", bookingErr);
    }
  }

  // 2. Provisiona Oferta Real no Mural de Ofertas (daily_deals) se ainda não existir
  let dealCreated = false;
  try {
    const { data: pageRow } = await supabase
      .from("bio_pages")
      .select("user_id, cover_url")
      .eq("id", pageId)
      .maybeSingle();

    const { data: existingDeal } = await supabase
      .from("daily_deals")
      .select("id")
      .eq("bio_page_id", pageId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!existingDeal && pageRow?.user_id) {
      const dealPreset = NICHE_DEAL_PRESETS[category] || NICHE_DEAL_PRESETS.service;
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: dealErr } = await supabase.from("daily_deals").insert({
        bio_page_id: pageId,
        user_id: pageRow.user_id,
        title: dealPreset.title(businessName),
        description: dealPreset.description(businessName),
        original_price: dealPreset.original_price,
        deal_price: dealPreset.deal_price,
        discount_badge: dealPreset.discount_badge,
        image_url: pageRow.cover_url || null,
        city: city || "Teixeira de Freitas",
        niche: niche || config.label,
        is_active: true,
        starts_at: now.toISOString(),
        expires_at: expires.toISOString(),
        max_claims: 30,
        claims_count: 0,
        clicks_count: 0,
      });

      if (!dealErr) {
        dealCreated = true;
      } else {
        console.warn("[NicheProvisioner] Aviso ao criar oferta do nicho:", dealErr);
      }
    }
  } catch (dealCatch) {
    console.warn("[NicheProvisioner] Exceção ao provisionar oferta:", dealCatch);
  }

  // 3. Provisiona Agente de Atendimento e Programa de Fidelidade nos metadados da página
  let loyaltyConfigured = false;
  try {
    const { data: pageData } = await supabase
      .from("bio_pages")
      .select("social_links")
      .eq("id", pageId)
      .maybeSingle();

    const currentSocial = (pageData?.social_links as Record<string, any>) || {};

    const chatFlow = {
      enabled: true,
      assistantName: `${businessName} - Atendente`,
      welcomeMessage: config.chatWelcome(businessName),
      options: config.chatOptions.map((opt) => ({
        label: opt.label,
        action: opt.action,
        url:
          opt.action === "booking"
            ? ctaUrl
            : opt.action === "whatsapp" && whatsapp
              ? `https://wa.me/55${whatsapp.replace(/\D/g, "")}`
              : undefined,
      })),
      nicheCategory: category,
      autoTriggerSeconds: 4,
    };

    const loyaltySettings = currentSocial.loyalty_settings || {
      businessPageId: pageId,
      isActive: true,
      pointsRatio: 1,
      pointsExpirationDays: 180,
      allowThermalPrint: true,
      rewards: NICHE_LOYALTY_REWARDS[category] || NICHE_LOYALTY_REWARDS.service,
      tiers: [
        { name: "Bronze", minPoints: 0, perk: "Acesso ao catálogo de recompensas", color: "#cd7f32" },
        { name: "Prata", minPoints: 150, perk: "5% de bônus em todos os pontos acumulados", color: "#94a3b8" },
        { name: "Ouro", minPoints: 400, perk: "Atendimento ou mimo de cortesia em toda visita", color: "#f59e0b" },
        { name: "Diamante", minPoints: 1000, perk: "Atendimento VIP exclusivo e prioritário", color: "#38bdf8" },
      ],
      missions: [
        {
          id: "mis-1",
          title: "Avaliação 5 Estrelas no Google",
          description: `Avalie o atendimento da ${businessName} no Google Maps e ganhe 30 pontos na hora.`,
          pointsReward: 30,
          actionType: "google_review",
          badge: "⭐ Avaliação",
        },
        {
          id: "mis-2",
          title: "Post nos Stories marcando nosso @",
          description: `Poste um Story e marque o Instagram oficial da ${businessName} para ganhar 50 pontos.`,
          pointsReward: 50,
          actionType: "instagram_story",
          badge: "📸 Instagram",
        },
        {
          id: "mis-3",
          title: "Visita em Dias Especiais",
          description: "Agende ou consuma às terças ou quartas-feiras e ganhe pontos adicionais.",
          pointsReward: 20,
          actionType: "weekday_visit",
          badge: "⚡ Terça & Quarta",
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const updatedSocial = {
      ...currentSocial,
      niche_category: category,
      booking_enabled: config.isBooking,
      booking_active: config.isBooking,
      booking_url: config.isBooking ? ctaUrl : undefined,
      cta_url: ctaUrl,
      cta_label: ctaLabel,
      chat_flow: chatFlow,
      ai_assistant_enabled: true,
      loyalty_enabled: true,
      fidelidade_enabled: true,
      loyalty_settings: loyaltySettings,
      city: city || currentSocial.city,
      address: address || currentSocial.address,
      google_rating: rating || currentSocial.google_rating || 4.9,
      reviews_count: reviewsCount || currentSocial.reviews_count || 85,
    };

    await supabase
      .from("bio_pages")
      .update({
        social_links: updatedSocial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId);

    chatConfigured = true;
    loyaltyConfigured = true;
  } catch (chatErr) {
    console.warn("[NicheProvisioner] Erro ao provisionar chat_flow e loyalty:", chatErr);
  }

  return {
    category,
    label: config.label,
    isBooking: config.isBooking,
    ctaUrl,
    ctaLabel,
    servicesCreated,
    chatConfigured,
    dealCreated,
    loyaltyConfigured,
  };
}
