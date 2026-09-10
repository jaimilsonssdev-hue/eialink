/**
 * Presets de Nicho Profissionais para Geração de Páginas PRO no Radar de Prospecção.
 * Suporta pelo menos 3 modelos visuais distintos de alta conversão por nicho (sorteados aleatoriamente),
 * garantindo que páginas geradas para diferentes clientes do mesmo nicho não fiquem iguais.
 */

export interface NicheServicePreset {
  name: string;
  category?: string;
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
      { id: "odonto-2", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80", label: "Sorriso & Estética Dental" },
      { id: "odonto-3", url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80", label: "Tecnologia Odontológica Avançada" },
      { id: "odonto-4", url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80", label: "Recepção Dental Clean" },
    ],
    avatars: [
      { id: "odonto-av-1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Dr. Dentista Especialista" },
      { id: "odonto-av-2", url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=400&q=80", label: "Dra. Cirurgiã-Dentista" },
    ],
  },
  clinica: {
    covers: [
      { id: "clinica-1", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80", label: "Recepção Médica Acolhedora" },
      { id: "clinica-2", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80", label: "Atendimento Humanizado" },
      { id: "clinica-3", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80", label: "Consultório de Saúde Integrada" },
      { id: "clinica-4", url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80", label: "Espaço Saúde & Bem-estar" },
    ],
    avatars: [
      { id: "clinica-av-1", url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80", label: "Dr. Médico Especialista" },
      { id: "clinica-av-2", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Clínica" },
    ],
  },
  psicologia: {
    covers: [
      { id: "psi-1", url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=80", label: "Consultório & Acolhimento Terapêutico" },
      { id: "psi-2", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80", label: "Espaço de Escuta & Conforto" },
      { id: "psi-3", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80", label: "Equilíbrio Mental & Mindfulness" },
      { id: "psi-4", url: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80", label: "Apoio Emocional & Diálogo" },
    ],
    avatars: [
      { id: "psi-av-1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", label: "Dra. Psicóloga Clínica" },
      { id: "psi-av-2", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80", label: "Dr. Terapeuta & Psicanalista" },
    ],
  },
  estetica: {
    covers: [
      { id: "estetica-1", url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80", label: "Espaço Estética Glow" },
      { id: "estetica-2", url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80", label: "Harmonização & Skincare Facial" },
      { id: "estetica-3", url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80", label: "Spa Relaxante & Massagem" },
      { id: "estetica-4", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80", label: "Tratamentos Corporais Avançados" },
    ],
    avatars: [
      { id: "estetica-av-1", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Dra. Esteta & Biomédica" },
      { id: "estetica-av-2", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", label: "Especialista em Pele & Glow" },
    ],
  },
  salao: {
    covers: [
      { id: "salao-1", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", label: "Studio Hair & Visagismo" },
      { id: "salao-2", url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80", label: "Tratamento Capilar & Mechas" },
      { id: "salao-3", url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80", label: "Escova & Finalização Glow" },
      { id: "salao-4", url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80", label: "Espelhos & Bancadas do Salão" },
    ],
    avatars: [
      { id: "salao-av-1", url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400&q=80", label: "Hair Stylist Especialista" },
      { id: "salao-av-2", url: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80", label: "Visagista Capilar" },
    ],
  },
  barbearia: {
    covers: [
      { id: "barba-1", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80", label: "Cadeiras de Barbearia Vintage" },
      { id: "barba-2", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80", label: "Corte na Tesoura & Degradê" },
      { id: "barba-3", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80", label: "Barboterapia com Toalha Quente" },
      { id: "barba-4", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80", label: "Studio Masculino Dark" },
    ],
    avatars: [
      { id: "barba-av-1", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80", label: "Barbeiro Master" },
      { id: "barba-av-2", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80", label: "Barbeiro & Visagista" },
    ],
  },
  advocacia: {
    covers: [
      { id: "adv-1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", label: "Escritório Jurídico Moderno" },
      { id: "adv-2", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80", label: "Balança da Justiça & Direito" },
      { id: "adv-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Sede Corporativa Jurídica" },
      { id: "adv-4", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80", label: "Biblioteca & Jurisprudência" },
    ],
    avatars: [
      { id: "adv-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Dr. Advogado Sênior" },
      { id: "adv-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Dra. Advogada Especialista" },
    ],
  },
  restaurante: {
    covers: [
      { id: "rest-1", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80", label: "Ambiente Bistrô & Gastronomia" },
      { id: "rest-2", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", label: "Prato Gourmet da Casa" },
      { id: "rest-3", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", label: "Pizza no Forno a Lenha" },
      { id: "rest-4", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80", label: "Mesa Posta & Salão Gastronômico" },
    ],
    avatars: [
      { id: "rest-av-1", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Chef Executivo de Cozinha" },
      { id: "rest-av-2", url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80", label: "Chef Confeiteira / Gastróloga" },
    ],
  },
  academia: {
    covers: [
      { id: "acad-1", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80", label: "Studio Fitness & Performance" },
      { id: "acad-2", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80", label: "Área de Musculação Premium" },
      { id: "acad-3", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80", label: "Treinamento Funcional & Agilidade" },
      { id: "acad-4", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80", label: "Equipamentos Cardio & Alta Intensidade" },
    ],
    avatars: [
      { id: "acad-av-1", url: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80", label: "Personal Trainer" },
      { id: "acad-av-2", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", label: "Treinadora & Coach Fitness" },
    ],
  },
  petshop: {
    covers: [
      { id: "pet-1", url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80", label: "Clínica Veterinária & Pet Care" },
      { id: "pet-2", url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80", label: "Banho & Tosa com Cuidado" },
      { id: "pet-3", url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80", label: "Consultório Veterinário Moderno" },
      { id: "pet-4", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80", label: "Espaço Pet Shop & Acessórios" },
    ],
    avatars: [
      { id: "pet-av-1", url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Veterinária" },
      { id: "pet-av-2", url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=400&q=80", label: "Especialista Pet & Groomer" },
    ],
  },
  oficina: {
    covers: [
      { id: "auto-1", url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80", label: "Centro Automotivo Moderno" },
      { id: "auto-2", url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80", label: "Estética Automotiva & Detailing" },
      { id: "auto-3", url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80", label: "Mecânica Preventiva & Elevador" },
      { id: "auto-4", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80", label: "Alinhamento & Pneus de Precisão" },
    ],
    avatars: [
      { id: "auto-av-1", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", label: "Mecânico Chefe Especialista" },
      { id: "auto-av-2", url: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=400&q=80", label: "Técnico em Injeção & Diagnóstico" },
    ],
  },
  imobiliaria: {
    covers: [
      { id: "imob-1", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", label: "Residências de Alto Padrão" },
      { id: "imob-2", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", label: "Casas & Lançamentos Exclusivos" },
      { id: "imob-3", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", label: "Condomínios & Mansões" },
      { id: "imob-4", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80", label: "Consultoria Imobiliária & Investimentos" },
    ],
    avatars: [
      { id: "imob-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Corretor de Imóveis Alto Padrão" },
      { id: "imob-av-2", url: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=400&q=80", label: "Corretora Consultora Imobiliária" },
    ],
  },
  arquitetura: {
    covers: [
      { id: "arq-1", url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80", label: "Design de Interiores Sofisticado" },
      { id: "arq-2", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80", label: "Fachadas Contemporâneas & Luz" },
      { id: "arq-3", url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80", label: "Projetos Arquitetônicos & Plantas" },
      { id: "arq-4", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80", label: "Ambiente Integrado Minimalista" },
    ],
    avatars: [
      { id: "arq-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Arquiteta & Urbanista" },
      { id: "arq-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Arquiteto e Designer de Interiores" },
    ],
  },
  contabilidade: {
    covers: [
      { id: "cont-1", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80", label: "Planejamento Tributário & Finanças" },
      { id: "cont-2", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80", label: "BPO Financeiro & Gestão Fiscal" },
      { id: "cont-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Sede Corporativa Contábil" },
      { id: "cont-4", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80", label: "Relatórios Estratégicos & Análises" },
    ],
    avatars: [
      { id: "cont-av-1", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Contador & Perito Fiscal" },
      { id: "cont-av-2", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80", label: "Contadora & Consultora Tributária" },
    ],
  },
  tatuagem: {
    covers: [
      { id: "tat-1", url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=80", label: "Studio Tattoo & Arte na Pele" },
      { id: "tat-2", url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=1200&q=80", label: "Tatuagem Fineline & Realismo" },
      { id: "tat-3", url: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1200&q=80", label: "Body Piercing & Studio Dark" },
      { id: "tat-4", url: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?auto=format&fit=crop&w=1200&q=80", label: "Bancada & Arte do Estúdio Tattoo" },
    ],
    avatars: [
      { id: "tat-av-1", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80", label: "Tattoo Artist Especialista" },
      { id: "tat-av-2", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80", label: "Tatuadora Fineline" },
    ],
  },
  otica: {
    covers: [
      { id: "oti-1", url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80", label: "Óculos de Grau & Sol Elegantes" },
      { id: "oti-2", url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&q=80", label: "Exame Visual & Consultório Ótico" },
      { id: "oti-3", url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1200&q=80", label: "Armações de Grife & Lentes" },
      { id: "oti-4", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80", label: "Showroom da Ótica" },
    ],
    avatars: [
      { id: "oti-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Consultora Ótica de Moda & Visão" },
      { id: "oti-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Optometrista & Especialista em Lentes" },
    ],
  },
  geral: {
    covers: [
      { id: "geral-1", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80", label: "Escritório & Negócios Modernos" },
      { id: "geral-2", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", label: "Vitrine & Loja Comercial" },
      { id: "geral-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Edifício Corporativo" },
      { id: "geral-4", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80", label: "Equipe e Consultoria" },
    ],
    avatars: [
      { id: "geral-av-1", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Consultor de Negócios" },
      { id: "geral-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Gestora Comercial" },
    ],
  },
  loja: {
    covers: [
      { id: "loja-1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", label: "Loja & Vitrine Conceito" },
      { id: "loja-2", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80", label: "Moda & Compras Fashion" },
      { id: "loja-3", url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80", label: "Boutique & Coleção Exclusiva" },
      { id: "loja-4", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80", label: "Vitrine Moderna & Tendências" },
    ],
    avatars: [
      { id: "loja-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Diretora Criativa / Lojista" },
      { id: "loja-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Gerente de Atendimento & Vendas" },
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
      modelName: "Sorriso & Cuidado Humanizado",
      template_id: "therapy-wellbeing",
      theme: "serenity",
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
        {
          name: "Lentes de Contato Dental & Facetas",
          description: "Planejamento digital com laminados cerâmicos ultrarresistentes para harmonia e beleza do sorriso.",
          price: 1200,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Ultrassonografia & Diagnóstico por Imagem",
          description: "Laudos precisos e rápidos com equipamentos digitais de última geração para acompanhamento completo.",
          price: 220,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Acompanhamento Cardiológico Preventivo",
          description: "Eletrocardiograma, teste ergométrico e orientação preventiva para saúde cardiovascular.",
          price: 350,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Sessão de Psicologia Clínica & Acolhimento",
          description: "Espaço confidencial para autoconhecimento, manejo de ansiedade e saúde emocional com terapeutas credenciados.",
          price: 160,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  psicologia: [
    {
      nicheKey: "psicologia",
      modelName: "Acolhimento & Psicoterapia Humanizada",
      template_id: "therapy-wellbeing",
      theme: "forest",
      cover_url: NICHE_GALLERIES.psicologia.covers[0].url,
      avatar_url: NICHE_GALLERIES.psicologia.avatars[0].url,
      generateHeadline: (company, city) => `Psicologia Clínica & Acolhimento Emocional em ${city}`,
      generateDescription: (company, city) =>
        `O ${company} é um espaço seguro e acolhedor em ${city}. Apoio profissional para superar a ansiedade, desenvolver autoconhecimento e recuperar seu bem-estar emocional.`,
      whatsapp_button_label: "Agendar Primeira Sessão",
      whatsapp_message: (company) => `Olá! Conheci a página do ${company} e gostaria de agendar uma sessão de psicoterapia.`,
      services: [
        {
          name: "Psicoterapia Individual Humanizada",
          description: "Sessões focadas no alívio de ansiedade, estresse, luto e fortalecimento da autoestima com escuta atenta.",
          price: 180,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[0].url,
        },
        {
          name: "Terapia de Casal & Relações Saudáveis",
          description: "Espaço mediado para alinhar comunicação, resolver conflitos e fortalecer laços afetivos.",
          price: 250,
          duration_minutes: 60,
          image_url: NICHE_GALLERIES.psicologia.covers[3].url,
        },
        {
          name: "Atendimento Psicológico Online",
          description: "Consultas por videoconferência com total sigilo profissional e a mesma presença acolhedora.",
          price: 160,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[1].url,
        },
      ],
    },
    {
      nicheKey: "psicologia",
      modelName: "Saúde Mental & Psicanálise Contemporânea",
      template_id: "therapy-wellbeing",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.psicologia.covers[1].url,
      avatar_url: NICHE_GALLERIES.psicologia.avatars[1].url,
      generateHeadline: (company, city) => `Psicanálise & Desenvolvimento Pessoal em ${city}`,
      generateDescription: (company, city) =>
        `Na ${company}, proporcionamos um percurso terapêutico profundo em ${city} para investigar padrões inconscientes, tratar angústias e viver com mais leveza.`,
      whatsapp_button_label: "Conversar com o Terapeuta",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma entrevista inicial com a equipe da ${company}.`,
      services: [
        {
          name: "Sessão de Análise & Investigação Psíquica",
          description: "Investigação profunda de bloqueios emocionais, medos e padrões de repetição inconscientes.",
          price: 200,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[1].url,
        },
        {
          name: "Acompanhamento em Transições & Luto",
          description: "Suporte especializado para momentos de mudança, perdas afetivas e crises existenciais.",
          price: 190,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[2].url,
        },
        {
          name: "Entrevista Inicial de Acolhimento",
          description: "Primeiro encontro para compreender suas demandas e planejar o processo terapêutico.",
          price: 150,
          duration_minutes: 45,
          image_url: NICHE_GALLERIES.psicologia.covers[0].url,
        },
      ],
    },
    {
      nicheKey: "psicologia",
      modelName: "Terapia Integrativa & Bem-Estar Emocional",
      template_id: "therapy-wellbeing",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.psicologia.covers[2].url,
      avatar_url: NICHE_GALLERIES.psicologia.avatars[0].url,
      generateHeadline: (company, city) => `Terapia Cognitiva & Regulação Emocional em ${city}`,
      generateDescription: (company, city) =>
        `Na ${company}, aliamos abordagens contemporâneas como TCC e mindfulness em ${city} para reestruturar pensamentos e promover clareza mental duradoura.`,
      whatsapp_button_label: "Agendar Consulta de Bem-Estar",
      whatsapp_message: (company) => `Olá! Vi a página da ${company} e gostaria de agendar uma consulta terapêutica.`,
      services: [
        {
          name: "Terapia Cognitivo-Comportamental (TCC)",
          description: "Foco prático na identificação de crenças disfuncionais e desenvolvimento de habilidades emocionais.",
          price: 190,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[2].url,
        },
        {
          name: "Manejo de Estresse & Burnout Laboral",
          description: "Estratégias para profissionais sob sobrecarga, exaustão mental e crises de pânico.",
          price: 210,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[3].url,
        },
        {
          name: "Orientação e Hábitos de Autocuidado",
          description: "Construção de rotinas saudáveis, higiene do sono e equilíbrio emocional para o dia a dia.",
          price: 170,
          duration_minutes: 50,
          image_url: NICHE_GALLERIES.psicologia.covers[1].url,
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
        {
          name: "Drenagem Linfática Facial & Corporal",
          description: "Desinchaço imediato, estímulo da circulação e eliminação de toxinas com manobras suaves e revigorantes.",
          price: 180,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Depilação a Laser Definitiva (Áreas VIP)",
          description: "Pele lisa, sem pelos e sem irritação com ponteira resfriada ultraconfortável.",
          price: 290,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c8?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "estetica",
      modelName: "Bem-Estar & Spa Serenity",
      template_id: "therapy-wellbeing",
      theme: "sage",
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
        {
          name: "Revitalização Facial com Máscara de Ouro & LED",
          description: "Nutrição celular avançada, efeito iluminador instantâneo e renovação do viço da pele.",
          price: 210,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  salao: [
    {
      nicheKey: "salao",
      modelName: "Studio Hair & Visagismo Pro",
      template_id: "clinic-care",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.salao.covers[0].url,
      avatar_url: NICHE_GALLERIES.salao.avatars[0].url,
      generateHeadline: (company, city) => `Referência em Cortes Autorais & Visagismo em ${city}`,
      generateDescription: (company, city) =>
        `No ${company}, valorizamos sua identidade com técnicas modernas de visagismo, mechas iluminadas, corte autoral e tratamento capilar de alta performance em ${city}. Agende seu horário com exclusividade.`,
      whatsapp_button_label: "Agendar Horário no Studio",
      whatsapp_message: (company) => `Olá! Vi o trabalho do ${company} e gostaria de agendar um horário para corte/cabelo.`,
      services: [
        {
          name: "Corte Visagista & Design Capilar",
          description: "Análise de formato do rosto, textura e estilo pessoal para um corte moderno e de fácil manutenção diária.",
          price: 130,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Mechas Criativas & Morena Iluminada",
          description: "Clareamento estratégico preservando a fibra capilar, com esfumado de raiz e brilho tridimensional.",
          price: 460,
          duration_minutes: 180,
          image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Cronograma Capilar & Reconstrução",
          description: "Tratamento intensivo de reposição de massa, aminoácidos e lipídios para cabelos danificados ou quimicamente tratados.",
          price: 180,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Escova Modelada com Tratamento Glow",
          description: "Higienização especial no lavatório, máscara nutritiva e finalização modelada com proteção térmica.",
          price: 85,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "salao",
      modelName: "Terapia & Cachos VIP",
      template_id: "spotlight-neon",
      theme: "emerald",
      cover_url: NICHE_GALLERIES.salao.covers[2].url,
      avatar_url: NICHE_GALLERIES.salao.avatars[1].url,
      generateHeadline: (company, city) => `Especialista em Cachos, Crespos & Transição Capilar em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} é o espaço definitivo para valorizar a textura natural dos seus fios em ${city}. Corte a seco com visagismo, fitagem personalizada e nutrição profunda para liberdade e definição.`,
      whatsapp_button_label: "Agendar Avaliação de Cachos",
      whatsapp_message: (company) => `Olá! Conheci a ${company} e gostaria de agendar um atendimento para meus cachos.`,
      services: [
        {
          name: "Corte a Seco Especialista em Cachos",
          description: "Técnica que respeita o fator encolhimento e o padrão natural de curvatura dos fios, garantindo movimento e volume harmônico.",
          price: 150,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Fitagem & Definição Hidratada",
          description: "Higienização botânica, condicionamento selante e fitagem mecha a mecha com finalizador rico em óleos vegetais.",
          price: 110,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Transição Capilar & Ozonioterapia",
          description: "Desintoxicação do couro cabeludo com vapor de ozônio, estímulo do folículo e nutrição profunda das duas texturas.",
          price: 210,
          duration_minutes: 75,
          image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "salao",
      modelName: "Salão & Produção Glow",
      template_id: "beauty-glow",
      theme: "rose",
      cover_url: NICHE_GALLERIES.salao.covers[1].url,
      avatar_url: NICHE_GALLERIES.salao.avatars[0].url,
      generateHeadline: (company, city) => `Studio de Beleza, Penteados & Produção em ${city}`,
      generateDescription: (company, city) =>
        `No ${company}, você encontra agilidade, excelência e atendimento acolhedor em ${city}. Escovas modeladas, botox capilar, manicure e produções para eventos e ocasiões especiais.`,
      whatsapp_button_label: "Agendar Horário Rápido",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um horário no ${company}.`,
      services: [
        {
          name: "Botox Capilar & Redução de Frizz",
          description: "Alinhamento térmico suave com reposição de aminoácidos, devolvendo o brilho espelhado e maciez aos fios.",
          price: 180,
          duration_minutes: 70,
          image_url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Lavatório Spa & Hidratação Express",
          description: "Massagem craniana relaxante durante a higienização combinada com ampola de nutrição ultrarrápida.",
          price: 90,
          duration_minutes: 35,
          image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Penteado & Make para Festas",
          description: "Penteados modernos (preso, semi-preso, tranças elaboradas) com alta fixação e elegância.",
          price: 160,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Sobrancelha & Acabamento na Navalha",
          description: "Limpeza precisa das sobrancelhas e contorno da linha da nuca para acabamento alinhado.",
          price: 25,
          duration_minutes: 15,
          image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Corte Clássico na Tesoura",
          description: "Técnica tradicional de corte com tesoura, finalizado com pomada modeladora matte.",
          price: 50,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Barboterapia Tradicional com Massagem Facial",
          description: "Espuma densa, navalhete descartável e loção pós-barba refrescante para pele sem irritação.",
          price: 45,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Pigmentação de Barba e Cabelo",
          description: "Preenchimento de falhas e realce de contorno com efeito natural e durabilidade.",
          price: 40,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Platinado Global / Luzes Masculinas",
          description: "Descoloração profissional com protetor de fios para tom uniforme e matizado.",
          price: 120,
          duration_minutes: 90,
          image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Consultoria Tributária & Planejamento Fiscal",
          description: "Recuperação de créditos, enquadramento societário e redução lícita de carga tributária.",
          price: 450,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Contratos Comerciais & Societário",
          description: "Elaboração, revisão e assessoria para acordos de sócios e parcerias estratégicas.",
          price: 400,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Assessoria em Licitações & Órgãos Públicos",
          description: "Impugnações de editais, recursos administrativos e habilitação jurídica para certames.",
          price: 550,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Inventários Judiciais & Extrajudiciais",
          description: "Partilha ágil de bens em cartório, com redução de custos e segurança para herdeiros.",
          price: 500,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Direito do Consumidor & Reparação de Danos",
          description: "Indenizações por negativação indevida, problemas com voos, seguradoras e planos de saúde.",
          price: 250,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Sobremesas Nobres & Carta de Vinhos",
          description: "Finalização perfeita com doces finos artesanais e rótulos selecionados para harmonização.",
          price: 32,
          duration_minutes: 15,
          image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Tábua de Frios & Petiscos Especiais",
          description: "Seleção de queijos artesanais, charcutaria fina, castanhas e geleia da casa.",
          price: 54,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Hambúrguer Artesanal na Brasa",
          description: "Blend de carnes nobres grelhado no fogo forte, queijo derretido e maionese trufada.",
          price: 42,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Porção de Batata Rústica & Molho da Casa",
          description: "Batatas crocantes com alecrim, sal grosso e maionese temperada artesanal.",
          price: 28,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Sobremesa Especial do Dia",
          description: "Doces artesanais frescos preparados diariamente pelo nosso confeiteiro.",
          price: 18,
          duration_minutes: 10,
          image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Avaliação Física com Bioimpedância 3D",
          description: "Mapeamento completo de percentual de gordura, massa magra e metas com profissional credenciado.",
          price: 80,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Pilates em Aparelhos & Postura",
          description: "Fortalecimento do core, flexibilidade e alívio de dores nas costas com fisioterapeuta.",
          price: 180,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Treinamento de Lutas & Boxe Funcional",
          description: "Condicionamento físico de atleta, defesa pessoal e alívio do estresse diário.",
          price: 130,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Aulas de Dança & Ritmos Cardiorrespiratórios",
          description: "Gaste energia e se divirta com coreografias empolgantes em turma animada.",
          price: 110,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Nutricionista Esportivo Acompanhado",
          description: "Cardápio individualizado para acelerar seus objetivos de definição e massa magra.",
          price: 160,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  petshop: [
    {
      nicheKey: "petshop",
      modelName: "Clínica & Bem-Estar Animal",
      template_id: "clinic-care",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.petshop.covers[0].url,
      avatar_url: NICHE_GALLERIES.petshop.avatars[0].url,
      generateHeadline: (company, city) => `Referência em Cuidados Veterinários & Pet em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} oferece atendimento veterinário especializado, consultas preventivas, vacinas e todo o carinho que seu pet merece em ${city}. Agende seu horário pelo WhatsApp.`,
      whatsapp_button_label: "Agendar Consulta Veterinária",
      whatsapp_message: (company) => `Olá! Conheci a página da ${company} e gostaria de agendar uma consulta para meu pet.`,
      services: [
        {
          name: "Consulta Veterinária Clínica",
          description: "Avaliação física completa, orientação nutricional e check-up com carinho e dedicação.",
          price: 150,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Vacinação & Imunização V10 / Antirrábica",
          description: "Protocolo vacinal completo com vacinas importadas de alta proteção para cães e gatos.",
          price: 95,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Banho Terapêutico & Hidratação de Pelagem",
          description: "Higiene profunda com produtos hipoalergênicos e secagem com temperatura controlada.",
          price: 80,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "petshop",
      modelName: "Dark Spotlight Pet VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.petshop.covers[1].url,
      avatar_url: NICHE_GALLERIES.petshop.avatars[1].url,
      generateHeadline: (company, city) => `Estética Pet & Banho e Tosa de Alto Padrão em ${city}`,
      generateDescription: (company, city) =>
        `Experiência premium para o seu melhor amigo na ${company}. Banho, tosa na tesoura e cuidados estéticos com conforto e bem-estar em ${city}.`,
      whatsapp_button_label: "Agendar Banho & Tosa VIP",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um horário de Banho & Tosa na ${company}.`,
      services: [
        {
          name: "Tosa na Tesoura Especializada",
          description: "Acabamento artístico e personalizado conforme a raça e preferência do tutor.",
          price: 130,
          duration_minutes: 75,
          image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Spa Pet com Hidratação de Ozônio",
          description: "Tratamento relaxante para pele e pelo brilhante sem nós e com perfume suave.",
          price: 110,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Corte de Unhas & Limpeza de Ouvidos",
          description: "Higiene essencial feita por profissionais treinados para evitar estresse.",
          price: 45,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "petshop",
      modelName: "Vitrine Pet & Acessórios",
      template_id: "store-showcase",
      theme: "warm",
      cover_url: NICHE_GALLERIES.petshop.covers[3].url,
      avatar_url: NICHE_GALLERIES.petshop.avatars[0].url,
      generateHeadline: (company, city) => `Tudo para Seu Pet com Amor & Rapidez em ${city}`,
      generateDescription: (company, city) =>
        `Rações super premium, brinquedos, medicamentos veterinários e acessórios selecionados na ${company}. Peça pelo WhatsApp e receba em casa.`,
      whatsapp_button_label: "Pedir pelo WhatsApp / Delivery",
      whatsapp_message: (company) => `Olá! Gostaria de ver opções de produtos e fazer um pedido na ${company}.`,
      services: [
        {
          name: "Pacote Mensal de Banhos",
          description: "4 banhos completos com hidratação e tosa higiênica inclusa com desconto especial.",
          price: 260,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Consulta Preventiva Filhotes",
          description: "Primeiro check-up, pesagem, protocolo de vermifugação e guia de cuidados.",
          price: 140,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Hospedagem & Creche Daycare com Monitoramento",
          description: "Ambiente climatizado, recreação com adestradores e fotos em tempo real no WhatsApp para sua tranquilidade.",
          price: 90,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  oficina: [
    {
      nicheKey: "oficina",
      modelName: "Centro Automotivo & Manutenção de Precisão",
      template_id: "clinic-care",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.oficina.covers[0].url,
      avatar_url: NICHE_GALLERIES.oficina.avatars[0].url,
      generateHeadline: (company, city) => `Mecânica de Confiança & Diagnóstico Avançado em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} é especialista em revisão preventiva, freios, suspensão, injeção eletrônica e manutenção automotiva em ${city}. Transparência total e orçamento sem compromisso.`,
      whatsapp_button_label: "Solicitar Orçamento no WhatsApp",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma revisão ou pedir orçamento na ${company}.`,
      services: [
        {
          name: "Revisão Preventiva Completa",
          description: "Checklist com mais de 30 itens: freios, suspensão, fluidos, correias e iluminação.",
          price: 250,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Troca de Óleo & Filtros de Motor",
          description: "Óleo 100% sintético homologado pela montadora e filtros de combustível, ar e óleo novos.",
          price: 190,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Alinhamento 3D & Balanceamento",
          description: "Geometria computadorizada a laser para maior durabilidade dos pneus e estabilidade na direção.",
          price: 120,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "oficina",
      modelName: "Dark Spotlight Auto VIP & Detailing",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.oficina.covers[1].url,
      avatar_url: NICHE_GALLERIES.oficina.avatars[1].url,
      generateHeadline: (company, city) => `Estética Automotiva & Proteção de Pintura em ${city}`,
      generateDescription: (company, city) =>
        `Seu carro tratado como obra de arte na ${company}. Vitrificação cerâmica, polimento técnico, lavagem detalhada e higienização interna premium em ${city}.`,
      whatsapp_button_label: "Agendar Avaliação do Veículo",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um serviço de estética automotiva na ${company}.`,
      services: [
        {
          name: "Polimento Técnico & Espelhamento",
          description: "Eliminação de riscos e marcas de lavagem com brilho espelhado de alta profundidade.",
          price: 450,
          duration_minutes: 120,
          image_url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Vitrificação de Pintura Cerâmica (9H)",
          description: "Proteção contra raios UV, fezes de pássaros e hidro-repelência extrema com garantia de até 3 anos.",
          price: 850,
          duration_minutes: 180,
          image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Higienização Interna & Oxi-sanitização",
          description: "Limpeza profunda de bancos, carpetes e eliminação de fungos e ácaros do ar-condicionado.",
          price: 280,
          duration_minutes: 90,
          image_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "oficina",
      modelName: "Oficina Rápida & Socorro Mecânico",
      template_id: "business-classic",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.oficina.covers[2].url,
      avatar_url: NICHE_GALLERIES.oficina.avatars[0].url,
      generateHeadline: (company, city) => `Atendimento Rápido para o Seu Carro em ${city}`,
      generateDescription: (company, city) =>
        `Diagnóstico eletrônico com scanner de última geração, freios e embreagem com garantia na ${company}. Conte com quem entende de motor.`,
      whatsapp_button_label: "Falar com o Mecânico Responsável",
      whatsapp_message: (company) => `Olá! Meu carro está precisando de revisão e gostaria da ajuda da equipe da ${company}.`,
      services: [
        {
          name: "Diagnóstico Computadorizado via Scanner",
          description: "Leitura de falhas na injeção, ABS, airbag e sensores em tempo real.",
          price: 100,
          duration_minutes: 25,
          image_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Manutenção de Sistema de Freios",
          description: "Substituição de pastilhas, discos, fluido e sangria com componentes originais.",
          price: 220,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Higienização & Carga de Gás de Ar-Condicionado",
          description: "Arrefecimento rápido, eliminação de odores e troca do filtro de cabine antipólen.",
          price: 180,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  imobiliaria: [
    {
      nicheKey: "imobiliaria",
      modelName: "Imóveis de Prestígio & Alto Padrão",
      template_id: "law-authority",
      theme: "sand",
      cover_url: NICHE_GALLERIES.imobiliaria.covers[0].url,
      avatar_url: NICHE_GALLERIES.imobiliaria.avatars[0].url,
      generateHeadline: (company, city) => `Os Melhores Imóveis & Oportunidades Exclusivas em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} conecta você aos melhores lançamentos, casas em condomínio fechado e apartamentos de alto padrão em ${city}. Assessoria jurídica e financeira completa.`,
      whatsapp_button_label: "Falar com Corretor Especialista",
      whatsapp_message: (company) => `Olá! Vi os imóveis da ${company} e gostaria de conhecer as opções disponíveis.`,
      services: [
        {
          name: "Consultoria para Compra & Investimento",
          description: "Análise de perfil, localização estratégica e simulação dos melhores financiamentos bancários.",
          price: 0,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Avaliação Mercadológica Imobiliária",
          description: "Parecer técnico de valor de mercado para venda ou locação rápida com segurança.",
          price: 350,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Gestão Segura de Locação",
          description: "Garantia de recebimento pontual, vistoria minuciosa e suporte jurídico completo ao proprietário.",
          price: 0,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "imobiliaria",
      modelName: "Dark Spotlight Imobiliário VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.imobiliaria.covers[1].url,
      avatar_url: NICHE_GALLERIES.imobiliaria.avatars[1].url,
      generateHeadline: (company, city) => `Lançamentos Residenciais & Condomínios Fechados em ${city}`,
      generateDescription: (company, city) =>
        `Encontre o lar perfeito com atendimento personalizado e sigilo absoluto na ${company}. Agende uma visita guiada aos imóveis mais cobiçados de ${city}.`,
      whatsapp_button_label: "Agendar Visita Exclusiva",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma visita a um imóvel anunciado pela ${company}.`,
      services: [
        {
          name: "Visita Guiada a Condomínios Fechados",
          description: "Tour exclusivo pelas melhores residências com infraestrutura de lazer e segurança.",
          price: 0,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Assessoria em Financiamento Habitacional",
          description: "Aprovação rápida de crédito junto aos principais bancos com as menores taxas do mercado.",
          price: 0,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Consultoria de Investimento em Lançamentos na Planta",
          description: "Análise de valorização, rentabilidade de aluguel e condições especiais com as melhores construtoras.",
          price: 0,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "imobiliaria",
      modelName: "Vitrine Imobiliária & Locação Ágil",
      template_id: "business-modern",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.imobiliaria.covers[2].url,
      avatar_url: NICHE_GALLERIES.imobiliaria.avatars[0].url,
      generateHeadline: (company, city) => `Alugue ou Compre Seu Imóvel sem Burocracia em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} descomplica a locação e a venda do seu imóvel em ${city}. Contratos digitais, sem fiador e com atendimento via WhatsApp.`,
      whatsapp_button_label: "Ver Imóveis Disponíveis",
      whatsapp_message: (company) => `Olá! Gostaria de receber a lista de imóveis disponíveis na ${company}.`,
      services: [
        {
          name: "Locação Sem Fiador com Seguro Fiança",
          description: "Aprovação em até 24 horas para você se mudar sem depender de fiadores.",
          price: 0,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Anuncie Seu Imóvel com Destaque",
          description: "Fotos profissionais, tour virtual e anúncio nos principais portais imobiliários do Brasil.",
          price: 0,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Vistoria Cautelar Imobiliária com Laudo Fotográfico",
          description: "Documentação minuciosa do estado do imóvel para segurança total de locadores e inquilinos.",
          price: 250,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  arquitetura: [
    {
      nicheKey: "arquitetura",
      modelName: "Studio de Arquitetura & Design Sensorial",
      template_id: "therapy-wellbeing",
      theme: "serenity",
      cover_url: NICHE_GALLERIES.arquitetura.covers[0].url,
      avatar_url: NICHE_GALLERIES.arquitetura.avatars[0].url,
      generateHeadline: (company, city) => `Projetos Arquitetônicos & Design de Interiores em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} cria espaços que inspiram, acolhem e valorizam seu patrimônio em ${city}. Projetos residenciais e comerciais pensados para seu estilo de vida.`,
      whatsapp_button_label: "Solicitar Reunião de Briefing",
      whatsapp_message: (company) => `Olá! Conheci os projetos da ${company} e gostaria de conversar sobre meu espaço.`,
      services: [
        {
          name: "Projeto de Interiores Completo",
          description: "Layout 3D realista, paginação de pisos, iluminação luminotécnica e marcenaria detalhada.",
          price: 2500,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Projeto Arquitetônico Residencial",
          description: "Concepção da planta, fachada moderna e aprovação junto aos órgãos da prefeitura.",
          price: 4500,
          duration_minutes: 90,
          image_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Consultoria de Decoração Express",
          description: "Orientação pontual de cores, mobiliário e iluminação para renovar ambientes com agilidade.",
          price: 600,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "arquitetura",
      modelName: "Dark Spotlight Design & Obras VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.arquitetura.covers[1].url,
      avatar_url: NICHE_GALLERIES.arquitetura.avatars[1].url,
      generateHeadline: (company, city) => `Arquitetura Contemporânea & Gestão de Obras em ${city}`,
      generateDescription: (company, city) =>
        `Projetos autorais com sofisticação estética e rigor técnico na ${company}. Do papel à entrega das chaves com total tranquilidade em ${city}.`,
      whatsapp_button_label: "Agendar Apresentação de Portfólio",
      whatsapp_message: (company) => `Olá! Gostaria de agendar uma conversa sobre um projeto com a ${company}.`,
      services: [
        {
          name: "Gerenciamento & Acompanhamento de Obra",
          description: "Supervisão rigorosa de cronograma, compra de materiais e controle de qualidade dos prestadores.",
          price: 1800,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Design Comercial & Lojas",
          description: "Arquitetura estratégica de varejo voltada para experiência do consumidor e aumento de vendas.",
          price: 3200,
          duration_minutes: 75,
          image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Projeto Luminotécnico & Automação Residencial",
          description: "Cenários de iluminação inteligente, fitas LED e valorização estética de cada ambiente.",
          price: 1200,
          duration_minutes: 50,
          image_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "arquitetura",
      modelName: "Engenharia & Reformas Inteligentes",
      template_id: "business-modern",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.arquitetura.covers[2].url,
      avatar_url: NICHE_GALLERIES.arquitetura.avatars[1].url,
      generateHeadline: (company, city) => `Reformas & Construções Sem Estresse em ${city}`,
      generateDescription: (company, city) =>
        `Soluções completas de engenharia civil e reformas planejadas na ${company}. Cumprimento de prazos, contrato transparente e acabamento premium.`,
      whatsapp_button_label: "Pedir Orçamento de Reforma",
      whatsapp_message: (company) => `Olá! Gostaria de um orçamento para reforma ou obra com a ${company}.`,
      services: [
        {
          name: "Reforma Residencial Completa",
          description: "Planejamento hidráulico, elétrico e acabamentos com equipe especializada.",
          price: 3800,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Laudo Estrutural & ART de Reforma",
          description: "Emissão de responsabilidade técnica e laudos exigidos por condomínios.",
          price: 650,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Consultoria e Escolha de Revestimentos & Acabamentos",
          description: "Acompanhamento em lojas de materiais para especificação de porcelanatos, tintas e louças.",
          price: 450,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  contabilidade: [
    {
      nicheKey: "contabilidade",
      modelName: "Assessoria Contábil & Governança",
      template_id: "law-authority",
      theme: "slate",
      cover_url: NICHE_GALLERIES.contabilidade.covers[0].url,
      avatar_url: NICHE_GALLERIES.contabilidade.avatars[0].url,
      generateHeadline: (company, city) => `Contabilidade Estratégica & Planejamento Tributário em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} reduz a carga tributária da sua empresa com segurança jurídica e gestão financeira eficiente em ${city}. Mais lucro e tranquilidade para você focar no seu negócio.`,
      whatsapp_button_label: "Falar com Contador Especialista",
      whatsapp_message: (company) => `Olá! Gostaria de conhecer os serviços contábeis e tributários da ${company}.`,
      services: [
        {
          name: "Abertura Grátis de Empresa (CNPJ)",
          description: "Processo 100% digital, enquadramento no regime tributário mais econômico e alvarás rápidos.",
          price: 0,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Planejamento Tributário para Empresas",
          description: "Estudo comparativo entre Simples Nacional, Lucro Presumido e Real para pagar menos impostos dentro da lei.",
          price: 800,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "BPO Financeiro & Gestão de Caixa",
          description: "Terceirização das contas a pagar e receber, fluxo de caixa e emissão de notas fiscais.",
          price: 950,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "contabilidade",
      modelName: "Dark Spotlight BPO Financeiro VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.contabilidade.covers[1].url,
      avatar_url: NICHE_GALLERIES.contabilidade.avatars[1].url,
      generateHeadline: (company, city) => `Gestão Financeira Digital & Performance para Negócios em ${city}`,
      generateDescription: (company, city) =>
        `Contabilidade moderna, relatórios inteligentes e suporte no WhatsApp sem burocracia na ${company}. Suporte consultivo para empresários de ${city}.`,
      whatsapp_button_label: "Agendar Diagnóstico Tributário",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um diagnóstico contábil gratuito com a ${company}.`,
      services: [
        {
          name: "Diagnóstico Fiscal & Recuperação de Créditos",
          description: "Identificação de tributos pagos a mais nos últimos 5 anos com restituição em conta.",
          price: 0,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Migração de Contador sem Dores de Cabeça",
          description: "Transferência rápida de contabilidade sem você precisar se preocupar com documentações antigas.",
          price: 0,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Gestão de Folha de Pagamento & eSocial Trabalhista",
          description: "Cálculos de admissão, férias, rescisões e cumprimento rigoroso das exigências trabalhistas.",
          price: 350,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "contabilidade",
      modelName: "Contabilidade Consultiva & MEI / PME",
      template_id: "business-classic",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.contabilidade.covers[2].url,
      avatar_url: NICHE_GALLERIES.contabilidade.avatars[0].url,
      generateHeadline: (company, city) => `Assessoria Completa para Médicos, Prestadores e Comércio em ${city}`,
      generateDescription: (company, city) =>
        `Folha de pagamento, pró-labore, obrigações acessórias e suporte contábil com atendimento humanizado na ${company}.`,
      whatsapp_button_label: "Falar com Consultor Fiscal",
      whatsapp_message: (company) => `Olá! Preciso de assessoria para minha empresa com a equipe da ${company}.`,
      services: [
        {
          name: "Contabilidade Mensal para Profissionais PJ",
          description: "Cálculo de DAS, emissão de certidões negativas e livro caixa digital.",
          price: 290,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Declaração de IRPF com Blindagem Fiscal",
          description: "Declaração de Imposto de Renda de pessoa física sem risco de cair na malha fina.",
          price: 220,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Regularização de Pendências e Certidões (CND)",
          description: "Desbloqueio de pendências na Receita Federal, Previdência e prefeituras com emissão de certidões limpas.",
          price: 200,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  tatuagem: [
    {
      nicheKey: "tatuagem",
      modelName: "Studio Tattoo Art & Fineline",
      template_id: "beauty-glow",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.tatuagem.covers[0].url,
      avatar_url: NICHE_GALLERIES.tatuagem.avatars[0].url,
      generateHeadline: (company, city) => `Tatuagens Autorais, Fineline & Realismo em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} transforma suas ideias em arte na pele com biossegurança máxima, agulhas descartáveis e traços delicados em ${city}. Orçamentos via WhatsApp.`,
      whatsapp_button_label: "Pedir Orçamento de Tattoo",
      whatsapp_message: (company) => `Olá! Gostaria de pedir um orçamento para uma tatuagem na ${company}.`,
      services: [
        {
          name: "Tatuagem Fineline & Escrita Delicada",
          description: "Traços ultrafinos com cicatrização suave e alta definição estética.",
          price: 250,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Tatuagem Realista & Preto e Cinza (Black and Grey)",
          description: "Sombreamento profundo, retratos e composições complexas com riqueza de detalhes.",
          price: 800,
          duration_minutes: 180,
          image_url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Aplicação de Body Piercing & Joias em Titânio",
          description: "Perfuração asséptica com joias de grau implante que não causam alergias.",
          price: 120,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "tatuagem",
      modelName: "Dark Spotlight Tattoo VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.tatuagem.covers[1].url,
      avatar_url: NICHE_GALLERIES.tatuagem.avatars[1].url,
      generateHeadline: (company, city) => `Studio Dark VIP de Tatuagem & Body Art em ${city}`,
      generateDescription: (company, city) =>
        `Ambiente privativo, profissionais premiados e experiência exclusiva de tatuagem na ${company} em ${city}. Mande sua referência e garanta sua data.`,
      whatsapp_button_label: "Mandar Referência no WhatsApp",
      whatsapp_message: (company) => `Olá! Tenho uma ideia de tatuagem e gostaria de enviar minha referência para a equipe da ${company}.`,
      services: [
        {
          name: "Criação de Arte Exclusiva & Personalizada",
          description: "Desenho autoral sob medida antes da sessão para você aprovar cada traço.",
          price: 150,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Cobertura de Tatuagem Antiga (Cover-up)",
          description: "Técnicas especializadas para cobrir ou reformar tatuagens antigas com um resultado impecável.",
          price: 600,
          duration_minutes: 120,
          image_url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Aplicação de Piercing com Titânio Grau Implante",
          description: "Perfuração com técnica asséptica e joalheria de topo para cicatrização rápida e sem inflamação.",
          price: 130,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "tatuagem",
      modelName: "Galeria de Arte Corporal & Flash Tattoos",
      template_id: "portfolio-studio",
      theme: "graphite",
      cover_url: NICHE_GALLERIES.tatuagem.covers[2].url,
      avatar_url: NICHE_GALLERIES.tatuagem.avatars[0].url,
      generateHeadline: (company, city) => `Flash Tattoos & Designs Disponíveis em ${city}`,
      generateDescription: (company, city) =>
        `Designs autorais prontos para tatuar com valores promocionais na ${company}. Escolha sua arte e agende sua sessão rápida.`,
      whatsapp_button_label: "Ver Flash Tattoos Disponíveis",
      whatsapp_message: (company) => `Olá! Gostaria de ver os flashes de tatuagem disponíveis na ${company}.`,
      services: [
        {
          name: "Flash Tattoo Autoral",
          description: "Desenho exclusivo de tamanho pequeno/médio com aplicação rápida no mesmo dia.",
          price: 180,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Tatuagem Miniatura & Microrealismo",
          description: "Traços minuciosos de animais, retratos em miniatura ou paisagens minimalistas na pele.",
          price: 280,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Retoque & Revitalização de Tatuagens Antigas",
          description: "Realce de cor, reforço de linhas e recuperação do brilho de artes antigas.",
          price: 200,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],

  otica: [
    {
      nicheKey: "otica",
      modelName: "Ótica Conceito & Especialistas Visuais",
      template_id: "clinic-care",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.otica.covers[0].url,
      avatar_url: NICHE_GALLERIES.otica.avatars[0].url,
      generateHeadline: (company, city) => `Sua Visão em Alta Definição & Armações Exclusivas em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} une tecnologia em lentes oftálmicas, exame de vista computadorizado e as principais marcas de óculos de grau e sol em ${city}.`,
      whatsapp_button_label: "Agendar Exame de Vista / Orçamento",
      whatsapp_message: (company) => `Olá! Gostaria de agendar um exame de vista ou fazer orçamento de óculos na ${company}.`,
      services: [
        {
          name: "Exame de Vista Computadorizado",
          description: "Refração precisa, medição de grau e saúde ocular com equipamentos digitais.",
          price: 80,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Lentes Multifocais Digitais Antirreflexo",
          description: "Visão nítida em todas as distâncias com proteção contra luz azul de telas de computador.",
          price: 490,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Ajuste, Limpeza Ultrassônica & Manutenção",
          description: "Alinhamento das hastes, troca de plaquetas e higienização profunda das suas armações.",
          price: 25,
          duration_minutes: 15,
          image_url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "otica",
      modelName: "Dark Spotlight Óculos & Grifes VIP",
      template_id: "spotlight-neon",
      theme: "midnight",
      cover_url: NICHE_GALLERIES.otica.covers[1].url,
      avatar_url: NICHE_GALLERIES.otica.avatars[1].url,
      generateHeadline: (company, city) => `Armações de Grife & Lentes com Filtro Azul em ${city}`,
      generateDescription: (company, city) =>
        `Estilo e conforto visual na ${company}. Armações leves de titânio, acetato italiano e lentes solares polarizadas em ${city}.`,
      whatsapp_button_label: "Consultar Catálogo de Armações",
      whatsapp_message: (company) => `Olá! Vi as armações da ${company} e gostaria de consultar modelos e valores.`,
      services: [
        {
          name: "Armações em Acetato Premium & Titânio",
          description: "Modelos modernos que combinam leveza extrema, durabilidade e elegância.",
          price: 290,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Adaptação de Lentes de Contato",
          description: "Treinamento de colocação, teste de curvatura e kit higienizador para iniciantes.",
          price: 150,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Lentes com Proteção BlueFilter para Telas",
          description: "Alívio imediato da fadiga ocular, ardência nos olhos e melhora na qualidade do sono.",
          price: 320,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "otica",
      modelName: "Vitrine Ótica & Ofertas da Semana",
      template_id: "store-showcase",
      theme: "warm",
      cover_url: NICHE_GALLERIES.otica.covers[2].url,
      avatar_url: NICHE_GALLERIES.otica.avatars[0].url,
      generateHeadline: (company, city) => `Óculos Completo (Armação + Lentes) com Preço Justo em ${city}`,
      generateDescription: (company, city) =>
        `Ofertas imperdíveis com montagem em laboratório próprio na ${company}. Traga sua receita e saia de óculos novo no mesmo dia.`,
      whatsapp_button_label: "Fazer Orçamento com Minha Receita",
      whatsapp_message: (company) => `Olá! Gostaria de enviar uma foto da minha receita para orçamento na ${company}.`,
      services: [
        {
          name: "Combo Óculos Completo (Armação + Lente com Grau)",
          description: "Pacote econômico completo com lentes antirreflexo e armação resistente à sua escolha.",
          price: 249,
          duration_minutes: 30,
          image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Óculos de Sol com Grau Personalizado",
          description: "Lentes escuras com seu grau exato, filtro UV400 e tratamento antirreflexo traseiro.",
          price: 390,
          duration_minutes: 35,
          image_url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Manutenção & Ajuste Grátis de Armações",
          description: "Reajuste anatômico, troca de plaquetas e higienização em cuba ultrassônica cortesia para clientes.",
          price: 0,
          duration_minutes: 15,
          image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Garantia de Qualidade & Suporte Contínuo",
          description: "Acompanhamento pós-atendimento com suporte dedicado e garantia total de satisfação.",
          price: 280,
          duration_minutes: 45,
          image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
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
        {
          name: "Atendimento Express com Hora Marcada",
          description: "Sem filas de espera, com especialista focado integralmente na sua demanda.",
          price: 320,
          duration_minutes: 40,
          image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Diagnóstico e Consultoria Preliminar",
          description: "Avaliação técnica das necessidades e proposição da melhor solução com excelente custo-benefício.",
          price: 190,
          duration_minutes: 30,
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
        {
          name: "Combo Solução Completa com Desconto",
          description: "Economize contratando a solução integral para suas necessidades com facilidades de pagamento.",
          price: 390,
          duration_minutes: 60,
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Atendimento Personalizado no WhatsApp",
          description: "Tire dúvidas em tempo real com nossa equipe e receba uma proposta sem compromisso.",
          price: 0,
          duration_minutes: 20,
          image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
  ],
  loja: [
    {
      nicheKey: "loja",
      modelName: "Boutique Fashion & Tendências",
      template_id: "store-showcase",
      theme: "aurora",
      cover_url: NICHE_GALLERIES.loja.covers[0].url,
      avatar_url: NICHE_GALLERIES.loja.avatars[0].url,
      generateHeadline: (company, city) => `Coleção Exclusiva & Moda Feminina em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} traz as últimas tendências em looks, conjuntos e peças selecionadas em ${city}. Faça seu pedido pelo catálogo com entrega rápida ou retirada na loja.`,
      whatsapp_button_label: "Fazer Pedido / Ver Sacola",
      whatsapp_message: (company) => `Olá! Vi o catálogo online da ${company} e gostaria de tirar dúvidas sobre as peças.`,
      services: [
        {
          name: "Vestido Midi Fluido Elegance",
          category: "Vestuário",
          description: "Tecido premium com caimento leve, decote suave e amarração ajustável.",
          price: 159.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Conjunto Alfaiataria Chic",
          category: "Conjuntos",
          description: "Blazer estruturado e calça reta em tecido nobre, perfeito para eventos ou trabalho.",
          price: 219.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Cropped Fresh Linho Puro",
          category: "Vestuário",
          description: "Conforto térmico com visual despojado e acabamento refinado com botões forrados.",
          price: 79.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Calça Pantalona Prime",
          category: "Vestuário",
          description: "Cintura alta com elástico anatômico e bolsos laterais funcionais.",
          price: 139.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "loja",
      modelName: "Calçados, Bolsas & Acessórios",
      template_id: "store-showcase",
      theme: "sunset",
      cover_url: NICHE_GALLERIES.loja.covers[1].url,
      avatar_url: NICHE_GALLERIES.loja.avatars[1].url,
      generateHeadline: (company, city) => `Acessórios, Calçados & Bolsas de Estilo em ${city}`,
      generateDescription: (company, city) =>
        `Destaque sua personalidade com os acessórios e calçados exclusivos da ${company} em ${city}. Produtos selecionados a dedo com envio seguro.`,
      whatsapp_button_label: "Fazer Pedido no WhatsApp",
      whatsapp_message: (company) => `Olá! Conheci o catálogo da ${company} e quero fazer um pedido.`,
      services: [
        {
          name: "Bolsa Tote Transversal em Couro",
          category: "Bolsas",
          description: "Amplo espaço interno com divisórias, alça regulável e acabamento dourado antioxidante.",
          price: 189.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Sandália Salto Bloco Confort",
          category: "Calçados",
          description: "Palmilha acolchoada com salto estável de 6cm, ideal para o dia a dia com elegância.",
          price: 149.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Tênis Casual Street White",
          category: "Calçados",
          description: "Solado leve e flexível em material respirável, combina com qualquer ocasião.",
          price: 169.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Óculos de Sol Polarizado UV400",
          category: "Acessórios",
          description: "Proteção máxima contra raios solares com armação leve e design contemporâneo.",
          price: 99.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        },
      ],
    },
    {
      nicheKey: "loja",
      modelName: "Cosméticos, Skincare & Presentes",
      template_id: "store-showcase",
      theme: "ocean",
      cover_url: NICHE_GALLERIES.loja.covers[2].url,
      avatar_url: NICHE_GALLERIES.loja.avatars[0].url,
      generateHeadline: (company, city) => `Cuidados, Fragrâncias & Presentes Especiais em ${city}`,
      generateDescription: (company, city) =>
        `A ${company} oferece cosméticos selecionados, perfumes marcantes e kits para presentear com carinho em ${city}. Atendimento direto no WhatsApp.`,
      whatsapp_button_label: "Fazer Pedido / Chamar Loja",
      whatsapp_message: (company) => `Olá! Vi os produtos da ${company} e quero encomendar.`,
      services: [
        {
          name: "Sérum Facial Vitamina C Glow",
          category: "Skincare",
          description: "Fórmula potente de absorção rápida, uniformiza o tom da pele e combate linhas finas.",
          price: 89.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Kit Spa Corporal Hidratação Intensa",
          category: "Corpo & Banho",
          description: "Esfoliante suave, manteiga corporal de karité e sabonete botânico artesanal.",
          price: 119.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Perfume Floral Amadeirado 100ml",
          category: "Perfumaria",
          description: "Fixação prolongada com notas sofisticadas de bergamota, jasmim e sândalo.",
          price: 169.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Vela Aromática Vanilla & Amber",
          category: "Casa & Bem-Estar",
          description: "Cera vegetal 100% natural com pavio de algodão e aroma acolhedor e relaxante.",
          price: 54.9,
          duration_minutes: 0,
          image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80",
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
  psicologia: NICHE_PRESETS_VARIANTS.psicologia[0],
  estetica: NICHE_PRESETS_VARIANTS.estetica[0],
  salao: NICHE_PRESETS_VARIANTS.salao[0],
  barbearia: NICHE_PRESETS_VARIANTS.barbearia[0],
  advocacia: NICHE_PRESETS_VARIANTS.advocacia[0],
  restaurante: NICHE_PRESETS_VARIANTS.restaurante[0],
  academia: NICHE_PRESETS_VARIANTS.academia[0],
  petshop: NICHE_PRESETS_VARIANTS.petshop[0],
  oficina: NICHE_PRESETS_VARIANTS.oficina[0],
  imobiliaria: NICHE_PRESETS_VARIANTS.imobiliaria[0],
  arquitetura: NICHE_PRESETS_VARIANTS.arquitetura[0],
  contabilidade: NICHE_PRESETS_VARIANTS.contabilidade[0],
  tatuagem: NICHE_PRESETS_VARIANTS.tatuagem[0],
  otica: NICHE_PRESETS_VARIANTS.otica[0],
  loja: NICHE_PRESETS_VARIANTS.loja[0],
  geral: NICHE_PRESETS_VARIANTS.geral[0],
};

/**
 * Detecta a chave do nicho com base no texto do nicho ou nome da empresa.
 * Identifica com precisão os principais nichos comerciais de alta demanda no Brasil.
 */
export function detectNicheKey(nicheRaw?: string | null, companyNameRaw?: string | null): string {
  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();

  // 1. Barbearia e cortes masculinos (tem precedência sobre "cabelo" para que barbearias não virem salão feminino)
  if (/(?:barbe|barba|barber|fade|navalha|corte\s+masculin)/i.test(combined)) return "barbearia";

  // 2. Pet shop, clínicas veterinárias, banho e tosa
  if (/(?:pet\s*shop|veterin[aá]r|\bvet\b|banho\s*e\s*tosa|\btosa\b|canil|\bgat[oa]s?\b|\bcachorr[oa]s?\b|\bra[çc][aã]o\b|\bra[çc][oõ]es\b|cl[ií]nica\s*animal|pet\s*care)/i.test(combined)) return "petshop";

  // 3. Oficina mecânica, auto center, estética automotiva e reparos
  if (/(?:oficina|mec[aâ]nic|auto\s*center|detail|est[eé]tica\s*automot|troca\s*de\s*[oó]leo|funilari|pintura\s*auto|pneu|freio|suspens[aã]o|guincho|auto\s*el[eé]tric|revis[aã]o\s*veicular|martelinho)/i.test(combined)) return "oficina";

  // 4. Imobiliária, corretores de imóveis e locações
  if (/(?:imobili[aá]r|corretor|im[oó]ve|creci|loca[çc][aã]o|aluguel|venda\s*de\s*im[oó]ve|lan[çc]amento\s*residencial|condom[ií]nio|apartamento)/i.test(combined)) return "imobiliaria";

  // 5. Arquitetura, design de interiores e engenharia civil
  if (/(?:arquit|interiores|designer\s*de\s*interiores|engenhar|planta\s*baixa|reforma|constru[çc][aã]o\s*civil|luminot[eé]cnic)/i.test(combined)) return "arquitetura";

  // 6. Contabilidade, assessoria contábil e tributária
  if (/(?:contab|contador|escrit[oó]rio\s*cont[aá]bil|fiscal|tribut|bpo\s*financeiro|abertura\s*de\s*empresa|imposto\s*de\s*renda|auditoria\s*cont[aá]bil)/i.test(combined)) return "contabilidade";

  // 7. Tatuagem, piercing e arte corporal
  if (/(?:tattoo|tatuag|pierc|body\s*art|tatuador)/i.test(combined)) return "tatuagem";

  // 8. Óticas e exames de vista
  if (/(?:[oó]tica|[oó]ticas|[oó]culos|arma[çc][aã]o|lente\s*de\s*contato|oftalmo|oftalmolog)/i.test(combined)) return "otica";

  // 9. Odontologia e dentistas
  if (/(?:odonto|dent|sorris|oral|dente|protese|implant|ortodont|clareament)/i.test(combined)) return "odontologia";

  // 10. Psicologia, psicoterapeutas, psicanálise, saúde mental e acolhimento emocional
  if (/(?:psic[oó]l|terap|psican[aá]lis|sa[uú]de\s*mental|terapeuta|acolhiment|psiquiatr|mindfulness|terapia)/i.test(combined)) return "psicologia";

  // 11. Salão de beleza, cabelos, cachos, estúdios capilares, institutos e centros de beleza
  if (/(?:instituto\s+de\s+beleza|espa[çc]o\s+de\s+beleza|studio\s+de\s+beleza|centro\s+de\s+beleza|sal[aã]o|cacho|cabel|hair|pentead|visagism|mecha|liso|alisament|progressiv|escova|megahair|corte\s+feminino|manicure|pedicure|unha|esmalteri)/i.test(combined)) return "salao";

  // 12. Estética facial/corporal, sobrancelha, spa e harmonização
  if (/(?:est[eé]tic|beleza|\bspa\b|lash|sobrancelha|\bpeles?\b|\bmake(?:up)?\b|harmoniz|botox|depila|drenagem|massagem)/i.test(combined)) return "estetica";

  // 13. Clínicas médicas, saúde geral e consultórios
  if (/(?:cl[ií]nic|m[eé]dic|sa[uú]de|doutor|dra?\b|pediatr|fisioter|laborat[oó]rio|nutri)/i.test(combined)) return "clinica";

  // 14. Advocacia e serviços jurídicos
  if (/(?:advoc|advogad|jur[ií]d|direito|lei|oab)/i.test(combined)) return "advocacia";

  // 14. Gastronomia, restaurantes, bares e delivery
  if (/(?:pizz|restauran|burger|hamburg|lanche|comida|gastr|caf[eé]|bistr[oô]|churrasc|sushi|a[çc]a[ií]|delivery|choperi|bar\b)/i.test(combined)) return "restaurante";

  // 15. Fitness, academias, studios e treinos
  if (/(?:academ|fitness|cross|trein|personal|gym|pilates|muscula[çc][aã]o|luta|boxe|jiu)/i.test(combined)) return "academia";

  // 16. Lojas, boutiques, moda, calçados, bolsas, roupas, cosméticos e varejo
  if (/(?:loja|boutique|moda|vestu[aá]ri|roupa|cal[çc]ad|acess[oó]ri|biju|semijoia|bolsa|e-?commerce|varejo|confec[çc][aã]o|presentes|cosm[eé]tic|perfum|store|shop|vitrine|calcados)/i.test(combined)) return "loja";

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
