/**
 * Presets de Nicho Profissionais para Geração de Páginas PRO no Radar de Prospecção.
 * Inspirado na Máquina de Sites, entrega uma experiência completa de site moderno.
 */

export interface NicheServicePreset {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url: string;
}

export interface NichePreset {
  nicheKey: string;
  template_id: string;
  theme: string;
  cover_url: string;
  avatar_url: string;
  generateHeadline: (companyName: string, city: string) => string;
  generateDescription: (companyName: string, city: string) => string;
  whatsapp_button_label: string;
  whatsapp_message: (companyName: string) => string;
  services: NicheServicePreset[];
}

const PRESETS: Record<string, NichePreset> = {
  odontologia: {
    nicheKey: "odontologia",
    template_id: "clinic-care",
    theme: "ocean",
    cover_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Referência em Odontologia & Estética Dental em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} oferece tratamentos odontológicos avançados, clareamento, implantes e cuidados preventivos completos em ${city}. Agende seu atendimento com conforto e tecnologia.`,
    whatsapp_button_label: "Agendar Avaliação Odontológica",
    whatsapp_message: (company) => `Olá! Conheci a página da ${company} e gostaria de agendar uma avaliação odontológica.`,
    services: [
      {
        name: "Clareamento Dental a Laser",
        description: "Técnicas modernas para devolver o brilho e a clareza natural do seu sorriso com total conforto e segurança.",
        price: 450,
        duration_minutes: 45,
        image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Implantes & Reabilitação Oral",
        description: "Recupere sua mastigação e confiança com próteses e implantes seguros com materiais de padrão internacional.",
        price: 1800,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Check-up & Profilaxia Completa",
        description: "Limpeza detalhada, remoção de tártaro e diagnóstico preventivo completo da saúde bucal da sua família.",
        price: 180,
        duration_minutes: 30,
        image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  clinica: {
    nicheKey: "clinica",
    template_id: "clinic-care",
    theme: "aurora",
    cover_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Medicina Integrada & Cuidados Especializados em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} conta com corpo clínico experiente, estrutura moderna e atendimento humanizado em ${city}. Cuidamos da sua saúde e da sua família.`,
    whatsapp_button_label: "Agendar Consulta Médica",
    whatsapp_message: (company) => `Olá! Vi a página da ${company} e gostaria de agendar uma consulta.`,
    services: [
      {
        name: "Consultas Médicas Especializadas",
        description: "Avaliação clínica detalhada com corpo médico capacitado em ambiente acolhedor e seguro.",
        price: 250,
        duration_minutes: 40,
        image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Exames Diagnósticos & Preventivos",
        description: "Agilidade na realização de procedimentos para início imediato do seu plano terapêutico.",
        price: 150,
        duration_minutes: 30,
        image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Acompanhamento Terapêutico Contínuo",
        description: "Planos de cuidado contínuo focados no seu bem-estar, disposição e qualidade de vida permanente.",
        price: 200,
        duration_minutes: 45,
        image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  estetica: {
    nicheKey: "estetica",
    template_id: "beauty-glow",
    theme: "sunset",
    cover_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Estética Avançada, Beleza & Bem-Estar em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} é especialista em realçar sua beleza natural com protocolos personalizados e tecnologias de ponta em ${city}. Viva uma experiência única de autocuidado.`,
    whatsapp_button_label: "Agendar Procedimento Estético",
    whatsapp_message: (company) => `Olá! Vi os tratamentos da ${company} e gostaria de agendar um horário.`,
    services: [
      {
        name: "Harmonização & Rejuvenescimento",
        description: "Protocolos elegantes que valorizam seus traços e estimulam colágeno com naturalidade e precisão.",
        price: 850,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c8?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Limpeza de Pele Profunda com Peeling",
        description: "Desintoxicação celular profunda, extração de impurezas e hidratação intensa com dermocosméticos selecionados.",
        price: 160,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Protocolos Corporais & Redução",
        description: "Tecnologias focadas em tonificação muscular, melhora da circulação e firmeza da pele.",
        price: 320,
        duration_minutes: 50,
        image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  barbearia: {
    nicheKey: "barbearia",
    template_id: "spotlight-neon",
    theme: "midnight",
    cover_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Cortes de Precisão & Estilo Masculino em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} traz o melhor da barbearia clássica e moderna em ${city}: ambiente exclusivo, profissionais experientes e atendimento com hora marcada.`,
    whatsapp_button_label: "Agendar Horário na Cadeira",
    whatsapp_message: (company) => `Fala pessoal da ${company}! Gostaria de agendar um horário para corte e barba.`,
    services: [
      {
        name: "Corte de Cabelo Estilizado",
        description: "Degradê de precisão, tesoura e acabamento impecável alinhado ao seu estilo pessoal.",
        price: 45,
        duration_minutes: 35,
        image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Barba Terapia com Toalha Quente",
        description: "Alinhamento com navalha, esfoliação facial, hidratação profunda de fios e óleo essencial relaxante.",
        price: 40,
        duration_minutes: 30,
        image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Combo VIP (Corte + Barba + Sobrancelha)",
        description: "A experiência completa de cuidado masculino com direito a café especial e atendimento premium.",
        price: 75,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  advocacia: {
    nicheKey: "advocacia",
    template_id: "law-authority",
    theme: "midnight",
    cover_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Advocacia Estratégica & Soluções Jurídicas em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} atua com rigor técnico, ética e proximidade na defesa dos seus direitos e do patrimônio da sua família em ${city}.`,
    whatsapp_button_label: "Falar com Advogado Especialista",
    whatsapp_message: (company) => `Olá! Gostaria de agendar uma consulta jurídica com a equipe da ${company}.`,
    services: [
      {
        name: "Direito Civil & Planejamento Sucessório",
        description: "Inventários, regularização imobiliária, contratos e soluções ágeis para a segurança da sua família.",
        price: 350,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Assessoria Empresarial & Contratos",
        description: "Blindagem de riscos e conformidade jurídica preventiva para empresas e empreendedores.",
        price: 500,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  restaurante: {
    nicheKey: "restaurante",
    template_id: "restaurant-flavor",
    theme: "sunset",
    cover_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Gastronomia Autêntica & Sabor Inconfundível em ${city}`,
    generateDescription: (company, city) =>
      `Na ${company}, cada prato é preparado com ingredientes selecionados e muito carinho em ${city}. Faça sua reserva ou peça pelo WhatsApp!`,
    whatsapp_button_label: "Fazer Pedido / Reservar Mesa",
    whatsapp_message: (company) => `Olá! Vi o cardápio da ${company} e gostaria de fazer um pedido.`,
    services: [
      {
        name: "Pratos da Casa & Especialidades",
        description: "Receitas consagradas com ingredientes frescos, porções generosas e sabor marcante.",
        price: 68,
        duration_minutes: 30,
        image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Pizzas & Forno Artesanal",
        description: "Massa de fermentação natural, queijo nobre e combinações irresistíveis assadas no ponto certo.",
        price: 59,
        duration_minutes: 25,
        image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  academia: {
    nicheKey: "academia",
    template_id: "academy-performance",
    theme: "forest",
    cover_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Treinamento de Performance, Saúde & Energia em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} oferece estrutura completa de treino, musculação, personal trainers e aulas dinâmicas em ${city}. Supere seus limites!`,
    whatsapp_button_label: "Agendar Aula Experimental Grátis",
    whatsapp_message: (company) => `Olá! Gostaria de agendar uma aula experimental na ${company}.`,
    services: [
      {
        name: "Plano Mensal - Acesso Livre",
        description: "Musculação completa, área cardiovascular e vestiários climatizados com apoio de instrutores.",
        price: 119,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Personal Trainer Individual",
        description: "Periodização sob medida, acompanhamento biométrico e foco total nos seus objetivos de performance.",
        price: 350,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },

  geral: {
    nicheKey: "geral",
    template_id: "spotlight-neon",
    theme: "aurora",
    cover_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    avatar_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
    generateHeadline: (company, city) => `Soluções de Excelência & Atendimento Dedicado em ${city}`,
    generateDescription: (company, city) =>
      `A ${company} oferece serviços de alta qualidade e compromisso com o cliente em ${city}. Entre em contato para saber mais.`,
    whatsapp_button_label: "Falar Conosco no WhatsApp",
    whatsapp_message: (company) => `Olá! Vi a página da ${company} e gostaria de solicitar um orçamento.`,
    services: [
      {
        name: "Atendimento & Orçamento Rápido",
        description: "Análise sob medida para suas necessidades com agilidade e condições especiais.",
        price: 150,
        duration_minutes: 30,
        image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Consultoria & Serviços Especializados",
        description: "Equipe qualificada pronta para entregar o melhor resultado para você.",
        price: 350,
        duration_minutes: 60,
        image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
};

/**
 * Identifica o nicho por palavras-chave no nicho ou nome da empresa.
 */
export function getPresetForCompany(nicheRaw?: string | null, companyNameRaw?: string | null): NichePreset {
  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();

  if (/odonto|dent|sorris|oral|dente|protese/i.test(combined)) {
    return PRESETS.odontologia;
  }
  if (/est[eé]tic|beleza|spa|lash|unha|sobrancelha|pele|make|harmoniz/i.test(combined)) {
    return PRESETS.estetica;
  }
  if (/barbe|barba|cabelo|barber|fade/i.test(combined)) {
    return PRESETS.barbearia;
  }
  if (/cl[ií]nic|m[eé]dic|sa[uú]de|doutor|dra?\b|pediatr|oftalm|fisioter|psic[oó]l|terap/i.test(combined)) {
    return PRESETS.clinica;
  }
  if (/advoc|advogad|jur[ií]d|direito|lei|oab/i.test(combined)) {
    return PRESETS.advocacia;
  }
  if (/pizz|restauran|burger|hamburg|lanche|comida|gastr|caf[eé]|bistr[oô]/i.test(combined)) {
    return PRESETS.restaurante;
  }
  if (/academ|fitness|cross|trein|personal|gym/i.test(combined)) {
    return PRESETS.academia;
  }

  return PRESETS.geral;
}

