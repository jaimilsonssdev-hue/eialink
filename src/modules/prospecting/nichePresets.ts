/**
 * Presets de Nicho Profissionais para Geração de Páginas PRO no Radar de Prospecção.
 * Suporta pelo menos 3 modelos visuais distintos de alta conversão por nicho (sorteados aleatoriamente),
 * garantindo que páginas geradas para diferentes clientes do mesmo nicho não fiquem iguais.
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
  modelName: string; // Ex: "Autoridade Especialista", "Dark Spotlight VIP", "Vitrine Executiva Clean"
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

export interface CuratedPhoto {
  id: string;
  url: string;
  label: string;
}

export const NICHE_GALLERIES: Record<string, { covers: CuratedPhoto[]; avatars: CuratedPhoto[] }> = {
  odontologia: {
    covers: [
      { id: "odonto-1", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80", label: "Consultório Odontológico Moderno" },
      { id: "odonto-2", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80", label: "Sorriso Perfeito" },
      { id: "odonto-3", url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80", label: "Tecnologia Odonto" },
      { id: "odonto-4", url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80", label: "Recepção Dental Clean" },
    ],
    avatars: [
      { id: "odonto-av-1", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80", label: "Dentista" },
      { id: "odonto-av-2", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Especialista" },
    ],
  },
  clinica: {
    covers: [
      { id: "clinica-1", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80", label: "Clínica Clean Acolhedora" },
      { id: "clinica-2", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80", label: "Atendimento Humanizado" },
      { id: "clinica-3", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80", label: "Consultório Integrado" },
      { id: "clinica-4", url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80", label: "Espaço Saúde & Bem-estar" },
    ],
    avatars: [
      { id: "clinica-av-1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Médico" },
      { id: "clinica-av-2", url: "https://images.unsplash.com/photo-1594824813581-22e38c92a9c3?auto=format&fit=crop&w=400&q=80", label: "Médica" },
    ],
  },
  estetica: {
    covers: [
      { id: "estetica-1", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", label: "Espaço Estética Glow" },
      { id: "estetica-2", url: "https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c8?auto=format&fit=crop&w=1200&q=80", label: "Harmonização & Skincare" },
      { id: "estetica-3", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80", label: "Tratamento Facial" },
      { id: "estetica-4", url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80", label: "Massagem & Spa" },
    ],
    avatars: [
      { id: "estetica-av-1", url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80", label: "Esteticista" },
      { id: "estetica-av-2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Dra. Estética" },
    ],
  },
  barbearia: {
    covers: [
      { id: "barba-1", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80", label: "Cadeiras de Barbearia Vintage" },
      { id: "barba-2", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80", label: "Corte Degradê na Tesoura" },
      { id: "barba-3", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80", label: "Barboterapia com Toalha Quente" },
      { id: "barba-4", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80", label: "Espaço Masculino Dark" },
    ],
    avatars: [
      { id: "barba-av-1", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80", label: "Barbeiro Master" },
      { id: "barba-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Estilo Masculino" },
    ],
  },
  advocacia: {
    covers: [
      { id: "adv-1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", label: "Escritório Jurídico Moderno" },
      { id: "adv-2", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80", label: "Balança da Justiça e Direito" },
      { id: "adv-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Sede Corporativa" },
      { id: "adv-4", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80", label: "Biblioteca Jurídica" },
    ],
    avatars: [
      { id: "adv-av-1", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80", label: "Advogado" },
      { id: "adv-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Advogada" },
    ],
  },
  restaurante: {
    covers: [
      { id: "rest-1", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80", label: "Ambiente Bistrô & Gastronomia" },
      { id: "rest-2", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", label: "Prato Gourmet da Casa" },
      { id: "rest-3", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", label: "Pizza no Forno a Lenha" },
      { id: "rest-4", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80", label: "Mesa Posta Iluminada" },
    ],
    avatars: [
      { id: "rest-av-1", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80", label: "Restaurante" },
      { id: "rest-av-2", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Chef de Cozinha" },
    ],
  },
  academia: {
    covers: [
      { id: "acad-1", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80", label: "Studio Fitness & Performance" },
      { id: "acad-2", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80", label: "Área de Musculação Premium" },
      { id: "acad-3", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80", label: "Treinamento Funcional" },
      { id: "acad-4", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80", label: "Equipamentos de Cardio" },
    ],
    avatars: [
      { id: "acad-av-1", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80", label: "Personal Trainer" },
      { id: "acad-av-2", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80", label: "Instrutora" },
    ],
  },
  geral: {
    covers: [
      { id: "geral-1", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80", label: "Escritório & Negócios" },
      { id: "geral-2", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", label: "Vitrine & Loja" },
      { id: "geral-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Edifício Corporativo" },
    ],
    avatars: [
      { id: "geral-av-1", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80", label: "Negócios" },
    ],
  },
};

/**
 * Matriz de Modelos por Nicho: Cada nicho tem pelo menos 3 modelos visuais de alta conversão.
 * Modelo 1: Autoridade Especialista (Layout vertical específico do nicho)
 * Modelo 2: Dark Spotlight VIP (Layout dark com efeitos de iluminação e modernidade)
 * Modelo 3: Vitrine Executiva Clean (Layout em cards objetivos de alta conversão)
 */
export const NICHE_PRESETS_VARIANTS: Record<string, NichePreset[]> = {
  odontologia: [
    {
      nicheKey: "odontologia",
      modelName: "Autoridade Especialista",
      template_id: "clinic-care",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.odontologia.covers[0].url,
      avatar_url: NICHE_GALLERIES.odontologia.avatars[0].url,
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
    {
      nicheKey: "odontologia",
      modelName: "Dark Spotlight VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.odontologia.covers[2].url,
      avatar_url: NICHE_GALLERIES.odontologia.avatars[1].url,
      generateHeadline: (company, city) => `Odontologia Digital & Tecnologia Avançada em ${city}`,
      generateDescription: (company, city) =>
        `Experiência odontológica de alto padrão na ${company}. Procedimentos sem dor, diagnóstico em alta definição e resultados estéticos impecáveis em ${city}.`,
      whatsapp_button_label: "Falar com Especialista no WhatsApp",
      whatsapp_message: (company) => `Olá! Vi o atendimento VIP da ${company} e gostaria de agendar uma consulta.`,
      services: [
        {
          name: "Lentes de Contato Dental & Facetas",
          description: "Harmonização do sorriso com lâminas ultrafinas de porcelana pura para máxima estética e durabilidade.",
          price: 1200,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Alinhadores Invisíveis",
          description: "Ortodontia estética e discreta sem fios metálicos. Planejamento 3D do seu sorriso.",
          price: 2500,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Estética Gengival & Harmonização",
          description: "Correção de assimetrias do sorriso com procedimentos rápidos e recuperação imediata.",
          price: 600,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "odontologia",
      modelName: "Vitrine Sorriso Clean",
      template_id: "store-showcase",
      theme: "aurora",
      cover_url: NICHE_GALLERIES.odontologia.covers[1].url,
      avatar_url: NICHE_GALLERIES.odontologia.avatars[0].url,
      generateHeadline: (company, city) => `Cuidado Dental Humanizado & Prevenção em ${city}`,
      generateDescription: (company, city) =>
        `Cuidamos do seu sorriso com transparência e acolhimento na ${company}. Conheça nossos procedimentos mais procurados e marque online sem burocracia.`,
      whatsapp_button_label: "Agendar Horário Online",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um horário com a equipe da ${company}.`,
      services: [
        {
          name: "Check-up Preventivo da Família",
          description: "Exame clínico com câmera intraoral e profilaxia completa para adultos e crianças.",
          price: 190,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Tratamento de Canal em Sessão Única",
          description: "Tecnologia mecanizada que garante tratamento rápido, seguro e sem dor.",
          price: 550,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  clinica: [
    {
      nicheKey: "clinica",
      modelName: "Medicina Integrada",
      template_id: "clinic-care",
      theme: "aurora",
      cover_url: NICHE_GALLERIES.clinica.covers[0].url,
      avatar_url: NICHE_GALLERIES.clinica.avatars[0].url,
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
      ],
    },
    {
      nicheKey: "clinica",
      modelName: "Spotlight Saúde Premium",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.clinica.covers[2].url,
      avatar_url: NICHE_GALLERIES.clinica.avatars[1].url,
      generateHeadline: (company, city) => `Diagnóstico de Precisão & Especialistas em ${city}`,
      generateDescription: (company, city) =>
        `Na ${company}, sua saúde é prioridade máxima com tecnologia avançada, agilidade nos exames e acompanhamento contínuo em ${city}.`,
      whatsapp_button_label: "Falar com Recepção no WhatsApp",
      whatsapp_message: (company) => `Olá! Gostaria de informações sobre consultas e exames na ${company}.`,
      services: [
        {
          name: "Check-up Clínico Executivo",
          description: "Avaliação médica completa e testes laboratoriais em tempo recorde.",
          price: 490,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Telemedicina & Segunda Opinião",
          description: "Consultas online com especialistas renomados no conforto da sua residência.",
          price: 220,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "clinica",
      modelName: "Espaço Cuidado & Bem-Estar",
      template_id: "therapy-wellbeing",
      theme: "forest",
      cover_url: NICHE_GALLERIES.clinica.covers[3].url,
      avatar_url: NICHE_GALLERIES.clinica.avatars[0].url,
      generateHeadline: (company, city) => `Saúde Integral, Longevidade & Bem-Estar em ${city}`,
      generateDescription: (company, city) =>
        `Uma abordagem acolhedora e preventiva na ${company}. Cuidamos do seu equilíbrio físico e mental em ${city}.`,
      whatsapp_button_label: "Agendar Horário com a Equipe",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma consulta integrativa na ${company}.`,
      services: [
        {
          name: "Nutrologia & Medicina Preventiva",
          description: "Planos de longevidade, reposição vitamínica e otimização metabólica.",
          price: 320,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Fisioterapia & Reabilitação Funcional",
          description: "Alívio de dores, postura e mobilidade com profissionais especializados.",
          price: 180,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  estetica: [
    {
      nicheKey: "estetica",
      modelName: "Beleza Glow & Sofisticação",
      template_id: "beauty-glow",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.estetica.covers[0].url,
      avatar_url: NICHE_GALLERIES.estetica.avatars[0].url,
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
      ],
    },
    {
      nicheKey: "estetica",
      modelName: "Dark Luxury Skincare",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.estetica.covers[1].url,
      avatar_url: NICHE_GALLERIES.estetica.avatars[1].url,
      generateHeadline: (company, city) => `Clínica de Estética & Alta Tecnologia em ${city}`,
      generateDescription: (company, city) =>
        `Tecnologias consagradas mundialmente na ${company} para corpo e rosto. Protocolos exclusivos para resultados rápidos e duradouros em ${city}.`,
      whatsapp_button_label: "Falar com Especialista no WhatsApp",
      whatsapp_message: (company) => `Olá! Gostaria de consultar os protocolos exclusivos da ${company}.`,
      services: [
        {
          name: "Laser Fracionado & Estimuladores",
          description: "Firmeza imediata da pele, redução de poros e linhas de expressão com tecnologia laser.",
          price: 750,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Remodelamento Corporal de Alta Definição",
          description: "Eliminação de gordura localizada e tonificação simultânea com tecnologia magnética.",
          price: 490,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "estetica",
      modelName: "Vitrine Bem-Estar & Spa",
      template_id: "store-showcase",
      theme: "aurora",
      cover_url: NICHE_GALLERIES.estetica.covers[3].url,
      avatar_url: NICHE_GALLERIES.estetica.avatars[0].url,
      generateHeadline: (company, city) => `Seu Refúgio de Beleza, Relaxamento & Spa em ${city}`,
      generateDescription: (company, city) =>
        `Desconecte da rotina na ${company}. Massagens relaxantes, drenagem linfática e cuidados corporais que renovam sua energia em ${city}.`,
      whatsapp_button_label: "Reservar Sessão de Spa",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma sessão de spa/massagem na ${company}.`,
      services: [
        {
          name: "Massagem Relaxante com Óleos Essenciais",
          description: "Alívio profundo de tensões musculares em ambiente aromatizado com pedras quentes.",
          price: 180,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Drenagem Linfática Método Exclusivo",
          description: "Eliminação de retenção hídrica, melhora do contorno e sensação de leveza imediata.",
          price: 150,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  barbearia: [
    {
      nicheKey: "barbearia",
      modelName: "Dark Barber VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.barbearia.covers[3].url,
      avatar_url: NICHE_GALLERIES.barbearia.avatars[0].url,
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
      ],
    },
    {
      nicheKey: "barbearia",
      modelName: "Barbearia Clássica Vintage",
      template_id: "business-classic",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.barbearia.covers[0].url,
      avatar_url: NICHE_GALLERIES.barbearia.avatars[1].url,
      generateHeadline: (company, city) => `Tradição, Navalha Afiada & Cuidado em ${city}`,
      generateDescription: (company, city) =>
        `A experiência clássica de um clube masculino na ${company}. Cerveja gelada, café especial e os melhores barbeiros de ${city}.`,
      whatsapp_button_label: "Garantir Meu Horário",
      whatsapp_message: (company) => `Opa! Quero agendar um horário na ${company}.`,
      services: [
        {
          name: "Combo Completo (Corte + Barboterapia)",
          description: "O serviço completo com navalha, toalha quente e massagem capilar.",
          price: 75,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "barbearia",
      modelName: "Studio Fade & Streetwear",
      template_id: "store-showcase",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.barbearia.covers[1].url,
      avatar_url: NICHE_GALLERIES.barbearia.avatars[0].url,
      generateHeadline: (company, city) => `Tendências Urbanas, Pigmentação & Freestyle em ${city}`,
      generateDescription: (company, city) =>
        `No ${company}, seu corte tem personalidade. Platinado, risquinhos de precisão e acabamento perfeito em ${city}.`,
      whatsapp_button_label: "Marcar no WhatsApp Agora",
      whatsapp_message: (company) => `Salve! Quero agendar um corte na ${company}.`,
      services: [
        {
          name: "Degradê Navalhado & Freestyle",
          description: "Corte moderno com navalhete e desenho alinhado.",
          price: 50,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  advocacia: [
    {
      nicheKey: "advocacia",
      modelName: "Autoridade Jurídica & Rigor",
      template_id: "law-authority",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.advocacia.covers[1].url,
      avatar_url: NICHE_GALLERIES.advocacia.avatars[0].url,
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
    {
      nicheKey: "advocacia",
      modelName: "Spotlight Advocacia Corporativa",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.advocacia.covers[2].url,
      avatar_url: NICHE_GALLERIES.advocacia.avatars[1].url,
      generateHeadline: (company, city) => `Consultoria Jurídica de Alto Nível em ${city}`,
      generateDescription: (company, city) =>
        `Soluções jurídicas seguras e inteligentes para empresas e pessoas físicas na ${company}. Atendimento ágil e consultoria especializada em ${city}.`,
      whatsapp_button_label: "Agendar Análise Preliminar",
      whatsapp_message: (company) => `Olá! Gostaria de uma avaliação jurídica com a ${company}.`,
      services: [
        {
          name: "Defesa Trabalhista & Previdenciária",
          description: "Garantia de direitos e cálculos precisos para aposentadorias e litígios.",
          price: 300,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "advocacia",
      modelName: "Consultoria Legal Moderna",
      template_id: "business-modern",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.advocacia.covers[0].url,
      avatar_url: NICHE_GALLERIES.advocacia.avatars[0].url,
      generateHeadline: (company, city) => `Defesa dos Seus Direitos com Agilidade em ${city}`,
      generateDescription: (company, city) =>
        `Comunicação clara, sem juridiquês e foco na resolução do seu caso. Fale agora mesmo com nossa equipe na ${company}.`,
      whatsapp_button_label: "Conversar no WhatsApp",
      whatsapp_message: (company) => `Olá! Preciso de orientação jurídica com a equipe da ${company}.`,
      services: [
        {
          name: "Direito de Família & Sucessões",
          description: "Divórcios, pensão alimentícia, guarda e acordos com discrição e serenidade.",
          price: 350,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  restaurante: [
    {
      nicheKey: "restaurante",
      modelName: "Cardápio Gastronômico Gourmet",
      template_id: "restaurant-menu",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.restaurante.covers[0].url,
      avatar_url: NICHE_GALLERIES.restaurante.avatars[0].url,
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
    {
      nicheKey: "restaurante",
      modelName: "Spotlight Night & Lounge",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.restaurante.covers[3].url,
      avatar_url: NICHE_GALLERIES.restaurante.avatars[1].url,
      generateHeadline: (company, city) => `Bistrô, Drinks Especiais & Boas Experiências em ${city}`,
      generateDescription: (company, city) =>
        `O melhor ponto de encontro gastronômico de ${city}. Drinks autorais, petiscos nobres e música boa na ${company}.`,
      whatsapp_button_label: "Reservar Mesa / Lounge",
      whatsapp_message: (company) => `Olá! Gostaria de reservar uma mesa na ${company}.`,
      services: [
        {
          name: "Drinks Autorais & Coquetelaria",
          description: "Coquetéis clássicos e criações do bartender com destilados premium.",
          price: 34,
          duration_minutes: 15,
          image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "restaurante",
      modelName: "Delivery Rápido & Cardápio Digital",
      template_id: "store-showcase",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.restaurante.covers[2].url,
      avatar_url: NICHE_GALLERIES.restaurante.avatars[0].url,
      generateHeadline: (company, city) => `Sabor Quente na Sua Casa com Entrega Ágil em ${city}`,
      generateDescription: (company, city) =>
        `Peça online com facilidade na ${company}. Embalagens térmicas que preservam a crocância e o sabor até a sua mesa em ${city}.`,
      whatsapp_button_label: "Pedir pelo Delivery WhatsApp",
      whatsapp_message: (company) => `Olá! Quero fazer um pedido no delivery da ${company}.`,
      services: [
        {
          name: "Combo Família Especial",
          description: "Prato principal completo para 3 a 4 pessoas com sobremesa e bebida inclusos.",
          price: 119,
          duration_minutes: 35,
          image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  academia: [
    {
      nicheKey: "academia",
      modelName: "Performance & Força",
      template_id: "academy-performance",
      theme: "forest",
      cover_url: NICHE_GALLERIES.academia.covers[1].url,
      avatar_url: NICHE_GALLERIES.academia.avatars[0].url,
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
          description: "Treino 100% individualizado para ganho de massa, emagrecimento saudável e postura correta.",
          price: 250,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "academia",
      modelName: "Dark Fitness Studio",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.academia.covers[0].url,
      avatar_url: NICHE_GALLERIES.academia.avatars[1].url,
      generateHeadline: (company, city) => `Studio Fitness Exclusivo & Alta Intensidade em ${city}`,
      generateDescription: (company, city) =>
        `Ambiente motivador com música, luz e treino de ponta na ${company}. Metodologias modernas que aceleram seus resultados em ${city}.`,
      whatsapp_button_label: "Garantir Vaga no WhatsApp",
      whatsapp_message: (company) => `Olá! Quero conhecer o studio ${company} e agendar um treino.`,
      services: [
        {
          name: "Treinamento Funcional & HIIT",
          description: "Queima calórica intensa com circuitos dinâmicos em pequenos grupos.",
          price: 140,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "academia",
      modelName: "Treino & Saúde Integrada",
      template_id: "store-showcase",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.academia.covers[2].url,
      avatar_url: NICHE_GALLERIES.academia.avatars[0].url,
      generateHeadline: (company, city) => `Qualidade de Vida, Movimento & Disposição em ${city}`,
      generateDescription: (company, city) =>
        `Mais saúde para sua rotina na ${company}. Planos acessíveis com avaliação física periódica e suporte total em ${city}.`,
      whatsapp_button_label: "Ver Planos e Horários",
      whatsapp_message: (company) => `Olá! Gostaria de consultar os planos da ${company}.`,
      services: [
        {
          name: "Plano Anual Fidelidade",
          description: "Economize garantindo seu plano anual com todas as modalidades inclusas.",
          price: 89,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  geral: [
    {
      nicheKey: "geral",
      modelName: "Presença Corporativa Pro",
      template_id: "business-modern",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.geral.covers[0].url,
      avatar_url: NICHE_GALLERIES.geral.avatars[0].url,
      generateHeadline: (company, city) => `Excelência & Confiança nos Serviços em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} é sinônimo de credibilidade e atendimento ágil em ${city}. Entre em contato direto pelo WhatsApp ou solicite um orçamento online.`,
      whatsapp_button_label: "Falar Conosco no WhatsApp",
      whatsapp_message: (company) => `Olá! Gostaria de mais informações sobre os serviços da ${company}.`,
      services: [
        {
          name: "Atendimento & Orçamento Rápido",
          description: "Análise sob medida para suas necessidades com agilidade e condições especiais.",
          price: 150,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
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
    {
      nicheKey: "geral",
      modelName: "Spotlight VIP Multiuso",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.geral.covers[2].url,
      avatar_url: NICHE_GALLERIES.geral.avatars[0].url,
      generateHeadline: (company, city) => `Soluções Modernas & Resultados de Alto Nível em ${city}`,
      generateDescription: (company, city) =>
        `Conheça as soluções inovadoras da ${company}. Foco total em qualidade, agilidade e satisfação dos nossos clientes em ${city}.`,
      whatsapp_button_label: "Iniciar Atendimento VIP",
      whatsapp_message: (company) => `Olá! Vi a apresentação da ${company} e gostaria de conversar.`,
      services: [
        {
          name: "Serviço Premium Exclusivo",
          description: "Atendimento prioritário com acompanhamento dedicado do início ao fim.",
          price: 500,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "geral",
      modelName: "Vitrine Digital de Alta Conversão",
      template_id: "store-showcase",
      theme: "aurora",
      cover_url: NICHE_GALLERIES.geral.covers[1].url,
      avatar_url: NICHE_GALLERIES.geral.avatars[0].url,
      generateHeadline: (company, city) => `Tudo o que Você Precisa em um Só Lugar em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} facilita seu dia a dia com soluções práticas e seguras em ${city}. Veja nossos principais destaques e fale conosco em 1 clique.`,
      whatsapp_button_label: "Fazer Pedido / Contratar",
      whatsapp_message: (company) => `Olá! Gostaria de contratar os serviços da ${company}.`,
      services: [
        {
          name: "Pacote de Serviços Essenciais",
          description: "O melhor custo-benefício para resolver sua necessidade com rapidez.",
          price: 220,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],
};

/**
 * Compatibilidade legada com `PRESETS[nicheKey]` (aponta para o Modelo 1 de cada nicho)
 */
export const PRESETS: Record<string, NichePreset> = {
  odontologia: NICHE_PRESETS_VARIANTS.odontologia[0],
  clinica: NICHE_PRESETS_VARIANTS.clinica[0],
  estetica: NICHE_PRESETS_VARIANTS.estetica[0],
  barbearia: NICHE_PRESETS_VARIANTS.barbearia[0],
  advocacia: NICHE_PRESETS_VARIANTS.advocacia[0],
  restaurante: NICHE_PRESETS_VARIANTS.restaurante[0],
  academia: NICHE_PRESETS_VARIANTS.academia[0],
  geral: NICHE_PRESETS_VARIANTS.geral[0],
};

/**
 * Detecta a chave do nicho com base no texto do nicho ou nome da empresa.
 */
export function detectNicheKey(nicheRaw?: string | null, companyNameRaw?: string | null): string {
  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();

  if (/odonto|dent|sorris|oral|dente|protese/i.test(combined)) return "odontologia";
  if (/est[eé]tic|beleza|spa|lash|unha|sobrancelha|pele|make|harmoniz/i.test(combined)) return "estetica";
  if (/barbe|barba|cabelo|barber|fade/i.test(combined)) return "barbearia";
  if (/cl[ií]nic|m[eé]dic|sa[uú]de|doutor|dra?\b|pediatr|oftalm|fisioter|psic[oó]l|terap/i.test(combined)) return "clinica";
  if (/advoc|advogad|jur[ií]d|direito|lei|oab/i.test(combined)) return "advocacia";
  if (/pizz|restauran|burger|hamburg|lanche|comida|gastr|caf[eé]|bistr[oô]/i.test(combined)) return "restaurante";
  if (/academ|fitness|cross|trein|personal|gym/i.test(combined)) return "academia";

  return "geral";
}

/**
 * Identifica o preset para a empresa.
 * Se variantIndex não for informado, sorteia aleatoriamente entre os 3 modelos disponíveis,
 * garantindo que empresas diferentes do mesmo nicho recebam designs, capas e temas únicos!
 */
export function getPresetForCompany(
  nicheRaw?: string | null,
  companyNameRaw?: string | null,
  variantIndex?: number,
): NichePreset {
  const key = detectNicheKey(nicheRaw, companyNameRaw);
  const variants = NICHE_PRESETS_VARIANTS[key] || NICHE_PRESETS_VARIANTS.geral;

  if (typeof variantIndex === "number" && variantIndex >= 0 && variantIndex < variants.length) {
    return variants[variantIndex];
  }

  // Sorteia aleatoriamente entre os 3 modelos disponíveis para diversidade total
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
}

/**
 * Retorna a galeria de fotos curadas para o nicho.
 */
export function getGalleryForNiche(nicheKey?: string | null): { covers: CuratedPhoto[]; avatars: CuratedPhoto[] } {
  if (!nicheKey) return NICHE_GALLERIES.geral;
  const key = detectNicheKey(nicheKey, null);
  return NICHE_GALLERIES[key] || NICHE_GALLERIES.geral;
}
