/**
 * Motor de Provisionamento Automático de Ferramentas por Nicho.
 * Garante que qualquer site gerado (via Radar de Prospecção, Estúdio Criativo ou Agente)
 * nasça com as ferramentas reais da plataforma EiaLink já ativas e populadas no banco:
 * - Agenda Online (`booking_settings`, `booking_availability`, `booking_services`)
 * - Agente de Atendimento Virtual (`social_links.chat_flow`)
 * - Links reais amarrados (/agendar/{slug}, /cardapio/{slug}, /loja/{slug})
 */

export type NicheCategoryType = "barber" | "healthcare" | "beauty" | "auto" | "food" | "shop" | "service" | "industry";

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
      { name: "Corte Degradê / Social", duration_minutes: 40, price: 45, description: "Corte na tesoura e máquina com finalização impecável e penteado.", badge: "Mais Pedido ⭐" },
      { name: "Barboterapia Tradicional", duration_minutes: 30, price: 35, description: "Toalha quente, hidratação profunda, esfoliação e lâmina descartável.", badge: "Relaxante" },
      { name: "Combo Cabelo + Barba VIP", duration_minutes: 60, price: 70, description: "Experiência completa com corte personalizado e barboterapia no vapor.", badge: "Melhor Custo" },
      { name: "Acabamento & Sobrancelha", duration_minutes: 20, price: 20, description: "Alinhamento de contorno da barba, nuca e sobrancelha navalhada." },
    ],
    chatWelcome: (name) => `Olá! Seja bem-vindo(a) à ${name}. Como podemos transformar seu visual hoje? Agende seu horário online em poucos segundos!`,
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
      { name: "Avaliação & Check-up Inicial", duration_minutes: 30, price: 0, description: "Diagnóstico completo, planejamento personalizado e acolhimento.", badge: "Gratuito" },
      { name: "Limpeza & Profilaxia Profunda", duration_minutes: 45, price: 150, description: "Remoção de placa, ultrassom, polimento e aplicação de flúor.", badge: "Essencial" },
      { name: "Clareamento a Laser / Estética", duration_minutes: 60, price: 650, description: "Procedimento seguro para renovar a estética com tecnologia de ponta.", badge: "Destaque" },
      { name: "Restauração & Procedimentos Clínicos", duration_minutes: 45, price: 180, description: "Tratamento de alta precisão com materiais estéticos premium." },
    ],
    chatWelcome: (name) => `Olá! Bem-vindo(a) à ${name}. Estamos prontos para cuidar do seu bem-estar. Agende sua consulta ou tire dúvidas conosco!`,
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
      { name: "Limpeza de Pele Profunda", duration_minutes: 60, price: 160, description: "Extração de cravos, vapor de ozônio, hidratação profunda e máscara calmante.", badge: "Mais Procurado" },
      { name: "Drenagem Linfática Corporal", duration_minutes: 50, price: 130, description: "Redução de inchaço, ativação da circulação e relaxamento corporal.", badge: "Bem-Estar" },
      { name: "Design de Sobrancelhas & Lash", duration_minutes: 45, price: 80, description: "Mapeamento facial personalizado para realçar o olhar.", badge: "Express" },
      { name: "Massagem Relaxante com Aromaterapia", duration_minutes: 60, price: 150, description: "Alívio de tensões musculares com óleos essenciais terapêuticos." },
    ],
    chatWelcome: (name) => `Olá, que bom ter você aqui na ${name}! Pronta(o) para seu momento de autocuidado? Reserve seu horário online!`,
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
      { name: "Revisão Preventiva & Check-up de Itens", duration_minutes: 60, price: 120, description: "Inspeção completa de freios, suspensão, pneus, fluidos e iluminação.", badge: "Segurança ⭐" },
      { name: "Troca de Óleo e Filtros", duration_minutes: 40, price: 90, description: "Troca rápida de óleo especificado pelo fabricante e substituição de filtros.", badge: "Rápido" },
      { name: "Alinhamento 3D & Balanceamento", duration_minutes: 45, price: 110, description: "Ajuste milimétrico de geometria e balanceamento das rodas.", badge: "Recomendado" },
      { name: "Diagnóstico Eletrônico Computadorizado", duration_minutes: 30, price: 80, description: "Varredura completa via scanner automotivo para identificar falhas." },
    ],
    chatWelcome: (name) => `Olá! Bem-vindo(a) à ${name}. Seu carro em mãos de especialistas. Agende sua revisão ou traga seu veículo para diagnóstico!`,
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
    chatWelcome: (name) => `Olá! Seja bem-vindo(a) ao ${name}. Deu fome? Veja nosso cardápio completo ou faça seu pedido com entrega rápida!`,
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
    chatWelcome: (name) => `Olá! Seja muito bem-vindo(a) à ${name}. Conheça nossas novidades e promoções exclusivas da coleção!`,
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
    chatWelcome: (name) => `Olá! Bem-vindo(a) à ${name}. Atendemos indústrias e empresas com soluções sob medida. Como podemos atender seu projeto?`,
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
      { name: "Atendimento Inicial & Diagnóstico", duration_minutes: 45, price: 0, description: "Entendimento da sua demanda e apresentação da melhor solução.", badge: "Primeiro Passo" },
      { name: "Consultoria Especializada", duration_minutes: 60, price: 200, description: "Sessão dedicada com especialista para resolver seu desafio pontual.", badge: "Personalizado" },
      { name: "Visita Técnica / Orçamento no Local", duration_minutes: 60, price: 80, description: "Avaliação técnica no local com proposta comercial detalhada." },
    ],
    chatWelcome: (name) => `Olá! Seja bem-vindo(a) à ${name}. Temos a solução ideal para o que você precisa. Agende um horário ou fale conosco!`,
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
export function detectNicheCategory(niche?: string | null, name?: string | null): NicheCategoryType {
  const text = `${niche ?? ""} ${name ?? ""}`.toLowerCase();

  // 1. Barbearia
  if (/barbea|barbeir|barber|navalha|\bbarba\b|degrad[eê]|\bfade\b|cabelo\s*masculino/i.test(text)) {
    return "barber";
  }

  // 2. Saúde & Odonto
  if (/odonto|dent|sorriso|cl[ií]nica\s*odonto|m[eé]dic|pediatr|oftalmo|fisioter|psic[oó]l|terapeuta|nutri|sa[uú]de|ortoped|dermatolog/i.test(text)) {
    return "healthcare";
  }

  // 3. Estética & Beleza
  if (/est[eé]tica|beleza|sal[aã]o|manicure|pedicure|lash|c[ií]lios|sobrancelha|depila|massagem|spa|bronze|maquiagem/i.test(text)) {
    return "beauty";
  }

  // 4. Mecânica & Auto Center
  if (/oficina|mec[aâ]nica|auto\s*center|autocenter|funilaria|pintura\s*auto|pneus|borracharia|lava\s*jato|lava\s*r[aá]pido|est[eé]tica\s*automotiva/i.test(text)) {
    return "auto";
  }

  // 5. Gastronomia & Alimentação
  if (/restauran|lanche|burger|hamburguer|pizza|pizzaria|a[cç]a[ií]|sorvet|delivery|comida|marmita|a[cç]ougue|padaria|confeitaria|sushi|japon[eê]s|churrasco|espetinho|pastel|hot\s*dog|choperia|cervejaria|\bbar\b(?!\s*be)/i.test(text)) {
    return "food";
  }

  // 6. Lojas & Varejo
  if (/loja|moda|roupa|calcado|calçado|otica|ótica|boutique|bijuteria|reloj|acessorio|eletr[oô]nic|celular|smartphone|farmacia|drogaria|pet\s*shop|floricultura|moveis|móveis|colch[oõ]es|auto\s*pe[cç]as/i.test(text)) {
    return "shop";
  }

  // 7. Indústria & B2B
  if (/f[aá]brica|ind[uú]stria|solar|fotovolt|distribuidor|usinagem|caldeiraria|manufatura|metal[uú]rgica|\bdsun\b/i.test(text)) {
    return "industry";
  }

  return "service";
}

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
}

/**
 * Provisiona no Supabase as tabelas e metadados reais correspondentes ao nicho.
 * Se for agendamento: booking_settings, booking_availability, booking_services.
 * Em todos: social_links.chat_flow (robô de atendimento).
 */
export async function provisionPlatformToolsForNiche(options: ProvisionNicheOptions): Promise<ProvisionResult> {
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
      await supabase
        .from("booking_settings")
        .upsert(
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

      const existingNames = new Set((existingServices || []).map((s: any) => String(s.name).trim().toLowerCase()));

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

  // 2. Provisiona o Agente de Atendimento / Chatbot nos metadados da página
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
        url: opt.action === "booking" ? ctaUrl : opt.action === "whatsapp" && whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, "")}` : undefined,
      })),
      nicheCategory: category,
      autoTriggerSeconds: 4,
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
  } catch (chatErr) {
    console.warn("[NicheProvisioner] Erro ao provisionar chat_flow:", chatErr);
  }

  return {
    category,
    label: config.label,
    isBooking: config.isBooking,
    ctaUrl,
    ctaLabel,
    servicesCreated,
    chatConfigured,
  };
}

