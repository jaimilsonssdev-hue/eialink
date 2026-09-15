/**
 * Presets de Nicho Profissionais para Geração de Páginas no Radar de Prospecção e Builder.
 * Consolidado exatamente nos 19 nichos comerciais solicitados pelo usuário, com:
 * 1. 3 modelos visuais distintos por nicho (total 57 modelos).
 * 2. Gráficos em HTML/SVG e fotos curadas de altíssima relevância.
 * 3. Copywriting de alta conversão sem textos ou fotos genéricas.
 */

import { generateSvgCover, generateSvgAvatar } from "@/lib/HtmlGraphicGenerator";

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

// ==========================================
// 1. GALERIAS DE FOTOS CURADAS (19 NICHOS)
// ==========================================
export const NICHE_GALLERIES: Record<string, { covers: CuratedPhoto[]; avatars: CuratedPhoto[] }> = {
  loja: {
    covers: [
      { id: "loja-1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", label: "Loja & Vitrine Conceito" },
      { id: "loja-2", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80", label: "Moda & Compras Fashion" },
      { id: "loja-3", url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80", label: "Boutique & Coleção Exclusiva" },
      { id: "loja-4", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80", label: "Vitrine Moderna & Tendências" },
    ],
    avatars: [
      { id: "loja-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Lojista / Diretora Criativa" },
      { id: "loja-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Consultor de Vendas & Estilo" },
    ],
  },
  delivery: {
    covers: [
      { id: "del-1", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80", label: "Burger Artesanal Suculento" },
      { id: "del-2", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", label: "Pizza Saindo do Forno" },
      { id: "del-3", url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80", label: "Embalagem Delivery Rápido" },
      { id: "del-4", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80", label: "Combo de Lanches & Batata" },
    ],
    avatars: [
      { id: "del-av-1", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Mestre Chapeiro / Chef" },
      { id: "del-av-2", url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80", label: "Atendimento Delivery" },
    ],
  },
  restaurante: {
    covers: [
      { id: "rest-1", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80", label: "Salão Gastronômico Iluminado" },
      { id: "rest-2", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", label: "Prato Gourmet À La Carte" },
      { id: "rest-3", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80", label: "Mesa Posta & Bistrô" },
      { id: "rest-4", url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80", label: "Cozinha Contemporânea" },
    ],
    avatars: [
      { id: "rest-av-1", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Chef Executivo" },
      { id: "rest-av-2", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&q=80", label: "Sommelier / Maître" },
    ],
  },
  sorveteria: {
    covers: [
      { id: "sorv-1", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80", label: "Balcão de Gelatos Artesanais" },
      { id: "sorv-2", url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80", label: "Taça de Sorvete Cremoso" },
      { id: "sorv-3", url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=1200&q=80", label: "Tigela de Açaí com Frutas" },
      { id: "sorv-4", url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=80", label: "Gelato Italiano Especial" },
    ],
    avatars: [
      { id: "sorv-av-1", url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80", label: "Emblema Gelato Italiano" },
      { id: "sorv-av-2", url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80", label: "Emblema Açaí & Sorvetes" },
    ],
  },
  bebidas: {
    covers: [
      { id: "beb-1", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80", label: "Adega de Vinhos Selecionados" },
      { id: "beb-2", url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1200&q=80", label: "Chopp Artesanal & Cerveja Gelada" },
      { id: "beb-3", url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80", label: "Destilados & Balcão de Coquetéis" },
      { id: "beb-4", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80", label: "Prateleira de Bebidas & Conveniência" },
    ],
    avatars: [
      { id: "beb-av-1", url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80", label: "Emblema Adega & Cervejas" },
      { id: "beb-av-2", url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80", label: "Emblema Distribuidora Express" },
    ],
  },
  barbearia: {
    covers: [
      { id: "barb-1", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80", label: "Cadeira de Barbearia Vintage" },
      { id: "barb-2", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80", label: "Bancada de Navalha & Tesouras" },
      { id: "barb-3", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80", label: "Ambiente Barber Club Moderno" },
      { id: "barb-4", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80", label: "Luminária & Estilo Clássico" },
    ],
    avatars: [
      { id: "barb-av-1", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80", label: "Emblema Barber Shop" },
      { id: "barb-av-2", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80", label: "Emblema Navalha de Ouro" },
    ],
  },
  beleza: {
    covers: [
      { id: "bel-1", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80", label: "Salão de Beleza & Bancada Iluminada" },
      { id: "bel-2", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80", label: "Studio de Estética & Skincare" },
      { id: "bel-3", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80", label: "Nail Studio & Unhas em Gel" },
      { id: "bel-4", url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80", label: "Spa Relaxante & Cuidados Faciais" },
    ],
    avatars: [
      { id: "bel-av-1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80", label: "Emblema Studio de Beleza" },
      { id: "bel-av-2", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", label: "Emblema Estética & Glow" },
    ],
  },
  oficina: {
    covers: [
      { id: "ofic-1", url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80", label: "Auto Center & Elevador" },
      { id: "ofic-2", url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80", label: "Mecânica & Motor de Precisão" },
      { id: "ofic-3", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80", label: "Pneus, Alinhamento & Rodas" },
      { id: "ofic-4", url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80", label: "Diagnóstico Computadorizado" },
    ],
    avatars: [
      { id: "ofic-av-1", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", label: "Mecânico Chefe Especialista" },
      { id: "ofic-av-2", url: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=400&q=80", label: "Técnico em Injeção & Elétrica" },
    ],
  },
  clinica: {
    covers: [
      { id: "clin-1", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80", label: "Recepção Médica Acolhedora" },
      { id: "clin-2", url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80", label: "Consultório & Estetoscópio" },
      { id: "clin-3", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80", label: "Exame Clínico de Precisão" },
      { id: "clin-4", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80", label: "Estrutura Médica Integrada" },
    ],
    avatars: [
      { id: "clin-av-1", url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80", label: "Dr. Médico Especialista" },
      { id: "clin-av-2", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Clínica" },
    ],
  },
  psicologia: {
    covers: [
      { id: "psi-1", url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=80", label: "Consultório & Poltrona de Acolhimento" },
      { id: "psi-2", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80", label: "Espaço Tranquilo & Luz Natural" },
      { id: "psi-3", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80", label: "Mindfulness & Equilíbrio Mental" },
      { id: "psi-4", url: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80", label: "Apoio Emocional & Escuta Ativa" },
    ],
    avatars: [
      { id: "psi-av-1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", label: "Dra. Psicóloga Clínica" },
      { id: "psi-av-2", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80", label: "Dr. Terapeuta & Psicanalista" },
    ],
  },
  petshop: {
    covers: [
      { id: "pet-1", url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80", label: "Banho & Tosa com Cuidado" },
      { id: "pet-2", url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80", label: "Rações Premium & Loja Pet" },
      { id: "pet-3", url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80", label: "Consultório Veterinário" },
      { id: "pet-4", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80", label: "Espaço Pet Care & Carinho" },
    ],
    avatars: [
      { id: "pet-av-1", url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Veterinária" },
      { id: "pet-av-2", url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=400&q=80", label: "Groomer & Especialista Pet" },
    ],
  },
  advocacia: {
    covers: [
      { id: "adv-1", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80", label: "Sala de Reuniões Jurídica Nobre" },
      { id: "adv-2", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80", label: "Balança da Justiça & Direito" },
      { id: "adv-3", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", label: "Escritório Corporativo Moderno" },
      { id: "adv-4", url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80", label: "Biblioteca & Jurisprudência" },
    ],
    avatars: [
      { id: "adv-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Dr. Advogado Sênior" },
      { id: "adv-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Dra. Advogada Especialista" },
    ],
  },
  odontologia: {
    covers: [
      { id: "odo-1", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80", label: "Consultório Odontológico Moderno" },
      { id: "odo-2", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80", label: "Sorriso & Estética Dental" },
      { id: "odo-3", url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80", label: "Escaneamento & Tecnologia 3D" },
      { id: "odo-4", url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80", label: "Recepção Odontológica Clean" },
    ],
    avatars: [
      { id: "odo-av-1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Dr. Cirurgião-Dentista" },
      { id: "odo-av-2", url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=400&q=80", label: "Dra. Especialista em Estética Dental" },
    ],
  },
  construcao: {
    covers: [
      { id: "cons-1", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80", label: "Obra Residencial & Estrutura" },
      { id: "cons-2", url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80", label: "Planta Executiva & Engenharia" },
      { id: "cons-3", url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80", label: "Reforma & Acabamento de Alto Padrão" },
      { id: "cons-4", url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80", label: "Construção Civil & Ferramentas" },
    ],
    avatars: [
      { id: "cons-av-1", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80", label: "Engenheiro Civil Responsável" },
      { id: "cons-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Gestora de Obras & Reformas" },
    ],
  },
  imobiliaria: {
    covers: [
      { id: "imob-1", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", label: "Residências de Alto Padrão" },
      { id: "imob-2", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", label: "Apartamentos Decorados Exclusivos" },
      { id: "imob-3", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", label: "Condomínios & Mansões" },
      { id: "imob-4", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80", label: "Consultoria Imobiliária" },
    ],
    avatars: [
      { id: "imob-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Corretor de Imóveis CRECI" },
      { id: "imob-av-2", url: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=400&q=80", label: "Corretora Consultora Imobiliária" },
    ],
  },
  seguros: {
    covers: [
      { id: "seg-1", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80", label: "Proteção Familiar & Tranquilidade" },
      { id: "seg-2", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80", label: "Apólice Segura & Confiança" },
      { id: "seg-3", url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80", label: "Seguro Auto & Viagem Segura" },
      { id: "seg-4", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80", label: "Planejamento Patrimonial" },
    ],
    avatars: [
      { id: "seg-av-1", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Corretor de Seguros Especialista" },
      { id: "seg-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Consultora de Benefícios & Saúde" },
    ],
  },
  autonomo: {
    covers: [
      { id: "aut-1", url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80", label: "Ferramentas & Precisão Técnica" },
      { id: "aut-2", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80", label: "Manutenção Especializada" },
      { id: "aut-3", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80", label: "Atendimento Pontual ao Cliente" },
      { id: "aut-4", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80", label: "Planejamento & Orçamento" },
    ],
    avatars: [
      { id: "aut-av-1", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80", label: "Especialista Técnico Autônomo" },
      { id: "aut-av-2", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", label: "Consultora de Serviços" },
    ],
  },
  pessoal: {
    covers: [
      { id: "pes-1", url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80", label: "Mesa Minimalista & Produtividade" },
      { id: "pes-2", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80", label: "Café, Laptop & Criação" },
      { id: "pes-3", url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80", label: "Networking & Autoridade Digital" },
      { id: "pes-4", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80", label: "Portfólio & Projetos Autorais" },
    ],
    avatars: [
      { id: "pes-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Criador(a) de Conteúdo" },
      { id: "pes-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Palestrante & Consultor" },
    ],
  },
  fitness: {
    covers: [
      { id: "fit-1", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80", label: "Studio Fitness & Halteres" },
      { id: "fit-2", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80", label: "Treino Funcional de Alta Intensidade" },
      { id: "fit-3", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80", label: "Musculação & Aparelhos Modernos" },
      { id: "fit-4", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80", label: "Performance Esportiva" },
    ],
    avatars: [
      { id: "fit-av-1", url: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80", label: "Personal Trainer Certificado" },
      { id: "fit-av-2", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", label: "Coach de Treinamento Feminino" },
    ],
  },
  nutricao: {
    covers: [
      { id: "nut-1", url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80", label: "Alimentação Saudável & Equilíbrio" },
      { id: "nut-2", url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80", label: "Consulta Nutricional & Fita Métrica" },
      { id: "nut-3", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80", label: "Frutas Frescas & Detox" },
      { id: "nut-4", url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80", label: "Planejamento Alimentar Individual" },
    ],
    avatars: [
      { id: "nut-av-1", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Dra. Nutricionista Clínica" },
      { id: "nut-av-2", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Nutricionista Esportivo" },
    ],
  },
  costura: {
    covers: [
      { id: "cos-1", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80", label: "Máquina de Costura & Linhas" },
      { id: "cos-2", url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80", label: "Ateliê & Vestido em Confecção" },
      { id: "cos-3", url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1200&q=80", label: "Tecidos Nobres & Tesoura de Alfaiate" },
      { id: "cos-4", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80", label: "Ajuste & Acabamento Sob Medida" },
    ],
    avatars: [
      { id: "cos-av-1", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", label: "Estilista & Mestre de Alta Costura" },
      { id: "cos-av-2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Costureira Especialista em Reformas" },
    ],
  },
  tecnologia: {
    covers: [
      { id: "tec-1", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", label: "Bancada de Manutenção & Circuitos" },
      { id: "tec-2", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80", label: "Setup Tecnológico de TI" },
      { id: "tec-3", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80", label: "Servidores & Infraestrutura" },
      { id: "tec-4", url: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=80", label: "Suporte em Notebooks & Redes" },
    ],
    avatars: [
      { id: "tec-av-1", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80", label: "Técnico Especialista em Hardware" },
      { id: "tec-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Consultor de TI & Infraestrutura" },
    ],
  },
  geral: {
    covers: [
      { id: "ger-1", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80", label: "Fachada Comercial & Recepção" },
      { id: "ger-2", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80", label: "Equipe em Atendimento" },
      { id: "ger-3", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", label: "Sede Corporativa" },
      { id: "ger-4", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80", label: "Balcão Contemporâneo" },
    ],
    avatars: [
      { id: "ger-av-1", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Consultor Executivo" },
      { id: "ger-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Gestora de Negócios" },
    ],
  },
};

export const PRODUCT_CATALOG_NICHES = new Set(["loja", "delivery", "sorveteria", "restaurante", "petshop", "costura", "bebidas"]);
export const HEALTH_BOOKING_NICHES = new Set(["clinica", "odontologia", "psicologia", "nutricao"]);

export function isProductCatalogNiche(nicheKey?: string | null): boolean {
  if (!nicheKey) return false;
  return PRODUCT_CATALOG_NICHES.has(nicheKey.toLowerCase().trim());
}

export function isHealthBookingNiche(nicheKey?: string | null): boolean {
  if (!nicheKey) return false;
  return HEALTH_BOOKING_NICHES.has(nicheKey.toLowerCase().trim());
}

function getNicheWhatsappConfig(key: string, idx: number) {
  if (key === "bebidas") {
    return {
      label: idx === 0 ? "Pedir Bebidas no WhatsApp" : idx === 1 ? "Ver Catálogo & Preços" : "Delivery Rápido",
      message: (name: string) => `Olá! Vi o catálogo da ${name} e gostaria de fazer um pedido de bebidas geladas.`,
    };
  }
  if (key === "barbearia") {
    return {
      label: idx === 0 ? "Agendar Horário no WhatsApp" : idx === 1 ? "Ver Cortes & Barba" : "Agendar Agora",
      message: (name: string) => `Olá! Vi a barbearia ${name} e gostaria de agendar um horário para corte/barba.`,
    };
  }
  if (key === "beleza") {
    return {
      label: idx === 0 ? "Agendar Procedimento no WhatsApp" : idx === 1 ? "Ver Tabela & Procedimentos" : "Falar com Especialista",
      message: (name: string) => `Olá! Vi o estúdio ${name} e gostaria de agendar um horário de atendimento.`,
    };
  }
  if (key === "sorveteria") {
    return {
      label: idx === 0 ? "Fazer Pedido no WhatsApp" : idx === 1 ? "Pedir Açaí & Gelatos" : "Delivery no WhatsApp",
      message: (name: string) => `Olá! Vi o cardápio da ${name} e gostaria de fazer um pedido de sorvetes/açaí.`,
    };
  }
  if (key === "delivery") {
    return {
      label: idx === 0 ? "Fazer Pedido no WhatsApp" : idx === 1 ? "Pedir Lanches" : "Cardápio Delivery",
      message: (name: string) => `Olá! Vi o cardápio da ${name} e gostaria de fazer um pedido para entrega.`,
    };
  }
  if (key === "restaurante") {
    return {
      label: idx === 0 ? "Ver Cardápio & Pedir" : idx === 1 ? "Reservar Mesa" : "Fazer Pedido",
      message: (name: string) => `Olá! Vi o cardápio da ${name} e gostaria de saber mais sobre pratos e reservas.`,
    };
  }
  if (key === "loja") {
    return {
      label: idx === 0 ? "Comprar no WhatsApp" : idx === 1 ? "Ver Catálogo" : "Falar com Vendedora",
      message: (name: string) => `Olá! Vi os produtos da ${name} e gostaria de comprar.`,
    };
  }
  if (key === "petshop") {
    return {
      label: idx === 0 ? "Pedir Rações & Produtos" : idx === 1 ? "Agendar Banho e Tosa" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Vi os produtos e serviços pet da ${name} e gostaria de atendimento.`,
    };
  }
  if (key === "costura") {
    return {
      label: idx === 0 ? "Solicitar Ajuste no WhatsApp" : idx === 1 ? "Consultar Sob Medida" : "Falar com Ateliê",
      message: (name: string) => `Olá! Gostaria de consultar ajustes e confecções na ${name}.`,
    };
  }
  if (key === "clinica") {
    return {
      label: idx === 0 ? "Agendar Consulta Médica" : idx === 1 ? "Falar com Especialista" : "Central de Atendimento",
      message: (name: string) => `Olá! Gostaria de agendar uma consulta na ${name}.`,
    };
  }
  if (key === "odontologia") {
    return {
      label: idx === 0 ? "Agendar Avaliação" : idx === 1 ? "Clareamento & Implantes" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Gostaria de agendar uma avaliação odontológica na ${name}.`,
    };
  }
  if (key === "psicologia") {
    return {
      label: idx === 0 ? "Agendar Sessão" : idx === 1 ? "Atendimento Presencial/Online" : "Falar com Terapeuta",
      message: (name: string) => `Olá! Gostaria de agendar uma sessão terapêutica com ${name}.`,
    };
  }
  if (key === "nutricao") {
    return {
      label: idx === 0 ? "Agendar Consulta Nutricional" : idx === 1 ? "Plano de Emagrecimento" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Gostaria de agendar uma consulta nutricional com ${name}.`,
    };
  }
  if (key === "fitness") {
    return {
      label: idx === 0 ? "Agendar Aula Experimental" : idx === 1 ? "Conhecer Planos" : "Falar com Treinador",
      message: (name: string) => `Olá! Gostaria de informações sobre treinos e planos na ${name}.`,
    };
  }
  if (key === "oficina") {
    return {
      label: idx === 0 ? "Solicitar Orçamento no WhatsApp" : idx === 1 ? "Revisão Preventiva" : "Falar com Mecânico",
      message: (name: string) => `Olá! Gostaria de solicitar um orçamento mecânico na ${name}.`,
    };
  }
  return {
    label: idx === 0 ? "Solicitar Orçamento no WhatsApp" : idx === 1 ? "Falar com Especialista" : "Chamar no WhatsApp",
    message: (name: string) => `Olá! Vi o site da ${name} e gostaria de solicitar um orçamento sem compromisso.`,
  };
}

// ==========================================
// 2. HELPER PARA CRIAÇÃO DAS VARIANTES
// ==========================================
function buildNicheVariants(
  key: string,
  templates: [string, string, string],
  themes: [string, string, string],
  titles: [string, string, string],
  headlines: [
    (name: string, city: string) => string,
    (name: string, city: string) => string,
    (name: string, city: string) => string
  ],
  descriptions: [
    (name: string, city: string) => string,
    (name: string, city: string) => string,
    (name: string, city: string) => string
  ],
  servicesList: NicheServicePreset[][]
): NichePreset[] {
  const gallery = NICHE_GALLERIES[key] || NICHE_GALLERIES.geral;

  return [0, 1, 2].map((idx) => {
    // Variante 0: Foto curada 1
    // Variante 1: Design em SVG puro
    // Variante 2: Foto curada 2
    const coverUrl =
      idx === 1
        ? generateSvgCover(key, "Sua Empresa")
        : gallery.covers[idx % gallery.covers.length]?.url || generateSvgCover(key, "Sua Empresa");

    // Negócios comerciais e empresas NUNCA utilizam fotos de modelos/estranhos.
    // Utilizam sempre o monograma vetorial elegante da marca em SVG de alta fidelidade.
    const isPersonal = key === "pessoal";
    const avatarUrl =
      isPersonal && gallery.avatars.length > 0
        ? gallery.avatars[idx % gallery.avatars.length]?.url
        : generateSvgAvatar("Sua Empresa", key);

    const waConfig = getNicheWhatsappConfig(key, idx);

    return {
      nicheKey: key,
      modelName: titles[idx],
      template_id: templates[idx],
      theme: themes[idx],
      cover_url: coverUrl,
      avatar_url: avatarUrl,
      generateHeadline: headlines[idx],
      generateDescription: descriptions[idx],
      whatsapp_button_label: waConfig.label,
      whatsapp_message: waConfig.message,
      services: servicesList[idx] || servicesList[0],
    };
  });
}

// ==========================================
// 3. MATRIZ DE VARIANTES DOS 19 NICHOS
// ==========================================
export const NICHE_PRESETS_VARIANTS: Record<string, NichePreset[]> = {
  loja: buildNicheVariants(
    "loja",
    ["store-showcase", "spotlight-neon", "store-showcase"],
    ["aurora", "midnight", "sunset"],
    ["Catálogo Digital & Carrinho", "Dark Showcase VIP", "Boutique & Coleções Exclusivas"],
    [
      (name, city) => `A melhor seleção de moda e produtos exclusivos em ${city}`,
      (name, city) => `Coleção exclusiva e novidades da estação na ${name}`,
      (name, city) => `Qualidade, estilo e atendimento personalizado para você em ${city}`,
    ],
    [
      (name, city) => `Explore o catálogo oficial da ${name}. Peças selecionadas, novidades e pedidos organizados direto no WhatsApp em ${city}.`,
      (name, city) => `Design moderno e produtos autênticos na ${name}. Compre com praticidade e receba com rapidez.`,
      (name, city) => `Atendimento consultivo e catálogo completo da ${name} em ${city}.`,
    ],
    [
      [
        { name: "Lookbook Completo & Tendências", category: "Novidades", description: "Peças selecionadas com corte impecável e tecidos confortáveis.", price: 189.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80" },
        { name: "Calçados & Acessórios Premium", category: "Acessórios", description: "Design moderno e durabilidade para complementar seu estilo.", price: 149.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80" },
        { name: "Linha Especial Presentes", category: "Kits", description: "Embalagens sofisticadas com itens prontos para presentear quem você ama.", price: 99.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Drop Exclusivo da Semana", category: "Lançamentos", description: "Edição limitada com os itens mais procurados da temporada.", price: 219.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80" },
        { name: "Bolsas & Carteiras de Luxo", category: "Bolsas", description: "Acabamento primoroso e materiais nobres para todas as ocasiões.", price: 169.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80" },
        { name: "Semi-joias & Detalhes", category: "Joias", description: "Brilho e sofisticação com garantia comprovada de durabilidade.", price: 89.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Seleção Clássica Diária", category: "Básicos", description: "Roupas versáteis para compor looks elegantes todos os dias.", price: 129.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80" },
        { name: "Conjuntos Coordenados", category: "Conjuntos", description: "Harmonia completa em cores e caimento perfeito.", price: 249.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  delivery: buildNicheVariants(
    "delivery",
    ["cinematic-glass", "restaurant-menu", "spotlight-neon"],
    ["sunset", "midnight", "amber"],
    ["Cardápio Cinematográfico & Delivery VIP", "Cardápio Express & Lanches", "Combos & Pizzas Artesanais"],
    [
      (name, city) => `O sabor irresistível de ${name} entregue quentinho em ${city}`,
      (name, city) => `Peça pelo WhatsApp e receba em minutos na sua casa`,
      (name, city) => `Hambúrgueres, pizzas e porções artesanais preparadas na hora`,
    ],
    [
      (name, city) => `Faça seu pedido diretamente pelo cardápio digital da ${name}. Ingredientes frescos, porções generosas e entrega expressa em ${city}.`,
      (name, city) => `Sabor autêntico e atendimento ágil na ${name}. Escolha seus itens favoritos e receba com rapidez.`,
      (name, city) => `Cardápio completo de lanches artesanais da ${name} em ${city}.`,
    ],
    [
      [
        { name: "Smash Burger Duplo Artesanal", category: "Burgers", description: "Dois blends de carne fresca, queijo derretido, bacon e maionese da casa no pão brioche.", price: 34.9, duration_minutes: 25, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80" },
        { name: "Pizza Grande Especial 8 Fatias", category: "Pizzas", description: "Massa artesanal de fermentação lenta com recheio generoso e borda recheada.", price: 62.0, duration_minutes: 35, image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
        { name: "Porção de Batatas Rústicas Crocantes", category: "Porções", description: "Batatas sequinhas temperadas com alecrim, acompanhadas de cheddar e bacon.", price: 28.0, duration_minutes: 20, image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Combo Burger + Fritas + Refrigerante", category: "Combos", description: "A combinação perfeita com economia e sabor em dobro.", price: 44.9, duration_minutes: 25, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80" },
        { name: "Pizza Doce de Nutella com Morango", category: "Sobremesas", description: "Massa leve crocante coberta com Nutella pura e morangos frescos.", price: 39.9, duration_minutes: 25, image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Marmitex Executivo Premium", category: "Almoço", description: "Refeição balanceada com carnes nobres, arroz soltinho e acompanhamentos.", price: 26.9, duration_minutes: 20, image_url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=400&q=80" },
        { name: "Lanche Natural Especial", category: "Leves", description: "Frango desfiado temperado, pasta de ricota e salada fresca no pão integral.", price: 21.0, duration_minutes: 15, image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  restaurante: buildNicheVariants(
    "restaurante",
    ["cinematic-glass", "restaurant-menu", "spotlight-neon"],
    ["sunset", "midnight", "warm"],
    ["Alta Gastronomia Cinematográfica", "Bistrô & Cardápio Completo", "Menu Executivo & Vinhos"],
    [
      (name, city) => `Experiência gastronômica marcante e pratos autorais na ${name}`,
      (name, city) => `Ambiente sofisticado e cardápio refinado para momentos especiais`,
      (name, city) => `O melhor da gastronomia contemporânea em ${city}`,
    ],
    [
      (name, city) => `Conheça os pratos autorais, carta de bebidas e ambiente acolhedor da ${name} em ${city}. Reserve sua mesa ou faça seu pedido via WhatsApp.`,
      (name, city) => `Pratos elaborados por chef executivo e ambiente climatizado na ${name}.`,
      (name, city) => `Almoço executivo e jantar sofisticado na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Prato Principal do Chef", category: "Especiais", description: "Cortes nobres grelhados no ponto certo com risoto especial de acompanhamento.", price: 68.0, duration_minutes: 40, image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80" },
        { name: "Massa Fresca Artesanal", category: "Massas", description: "Massa de fabricação própria com molho pomodoro rústico e parmesão curado.", price: 54.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" },
        { name: "Sobremesa Autoral da Casa", category: "Sobremesas", description: "Petit gâteau artesanal com calda quente de chocolate belga e sorvete de creme.", price: 29.0, duration_minutes: 15, image_url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Menu Degustação em 3 Etapas", category: "Experiência", description: "Entrada refinada, prato principal e sobremesa harmonizada.", price: 110.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80" },
        { name: "Corte Prime de Picanha", category: "Carnes", description: "Picanha maturada fatiada na pedra quente com farofa crocante e chimichurri.", price: 89.0, duration_minutes: 35, image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Almoço Executivo Completo", category: "Executivo", description: "Prato do dia equilibrado com salada de entrada e suco natural.", price: 38.0, duration_minutes: 25, image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  sorveteria: buildNicheVariants(
    "sorveteria",
    ["cinematic-glass", "store-showcase", "restaurant-menu"],
    ["ocean", "midnight", "sunset"],
    ["Gelateria Cinematográfica & Açaí VIP", "Taças Geladas & Vitrine", "Sorvetes Artesanais & Delivery"],
    [
      (name, city) => `Gelatos artesanais, açaí no capricho e sobremesas geladas em ${city}`,
      (name, city) => `Refresque seu dia com as taças e sabores exclusivos da ${name}`,
      (name, city) => `Sorvetes cremosos e açaí com frutas frescas na ${name}`,
    ],
    [
      (name, city) => `Deliciosos gelatos artesanais, açaí montado com seus adicionais favoritos e picolés na ${name} em ${city}. Faça seu pedido pelo WhatsApp.`,
      (name, city) => `Qualidade incomparável, frutas selecionadas e ambiente familiar na ${name}.`,
      (name, city) => `O melhor açaí e sorvete artesanal da região em ${city}.`,
    ],
    [
      [
        { name: "Copo de Gelato Italiano 2 Sabores", category: "Gelatos", description: "Textura cremosa autêntica sem conservantes, com sabores clássicos e especiais.", price: 18.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80" },
        { name: "Tigela de Açaí Especial 500ml", category: "Açaí", description: "Açaí cremoso com leite em pó, leite condensado, morangos e banana fatiada.", price: 24.0, duration_minutes: 10, image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80" },
        { name: "Taça Avalanche de Brigadeiro", category: "Taças", description: "Sorvete de chocolate e baunilha, calda de brigadeiro de panela e raspas nobres.", price: 32.0, duration_minutes: 15, image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Pote Família de Gelato 1L", category: "Para Levar", description: "Escolha até 3 sabores dos nossos gelatos artesanais para levar para casa.", price: 48.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80" },
        { name: "Milkshake Crocante 400ml", category: "Shakes", description: "Batido na hora com sorvete premium e borda recheada de Nutella.", price: 22.0, duration_minutes: 10, image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Picolés Recheados Artesanais", category: "Picolés", description: "Picolés com frutas puras e recheios trufados que derretem na boca.", price: 9.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  bebidas: buildNicheVariants(
    "bebidas",
    ["cinematic-glass", "store-showcase", "restaurant-menu"],
    ["amber", "midnight", "sunset"],
    ["Adega Cinematográfica & Delivery VIP", "Distribuidora Express & Catálogo", "Bebidas Geladas & Chopp"],
    [
      (name, city) => `As melhores cervejas, vinhos finos, destilados e chopp trincando em ${city}`,
      (name, city) => `Bebidas geladas para sua festa ou churrasco entregues em minutos pela ${name}`,
      (name, city) => `Variedade incomparável, combos exclusivos e gelo filtrado na ${name}`,
    ],
    [
      (name, city) => `Na ${name} você pede cervejas puro malte, destilados premium, vinhos selecionados, gelo e carvão com entrega ultrarrápida em ${city}. Faça seu pedido pelo WhatsApp.`,
      (name, city) => `Cervejas geladas, destilados e combos para o seu churrasco na ${name}. Atendimento ágil e entrega na sua porta.`,
      (name, city) => `A distribuidora e adega de confiança para o seu final de semana em ${city}.`,
    ],
    [
      [
        { name: "Fardo Cerveja Puro Malte (12x350ml)", category: "Cervejas", description: "Cerveja puro malte geladíssima, perfeita para churrasco e confraternizações.", price: 48.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80" },
        { name: "Kit Gin Tropical Premium", category: "Destilados", description: "Garrafa de Gin London Dry 750ml acompanhada de 4 tônicas especiais e especiarias.", price: 119.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=400&q=80" },
        { name: "Vinho Tinto Cabernet Sauvignon (750ml)", category: "Vinhos", description: "Vinho fino equilibrado, notas de frutas vermelhas e carvalho tostado.", price: 55.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Combo Churrasco: Gelo 10kg + Carvão 4kg", category: "Conveniência", description: "Gelo em cubo de água filtrada cristalina e carvão vegetal de queima prolongada.", price: 32.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80" },
        { name: "Barril de Chopp Artesanal 5L", category: "Chopp", description: "Chopp pilsen artesanal com serpentina e pressão integrada, pronto para consumo.", price: 110.0, duration_minutes: 10, image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Pack Vodka Importada + 4 Energéticos", category: "Combos", description: "Vodka destilada de alta pureza 1L com 4 latas de energético tradicional 250ml.", price: 98.0, duration_minutes: 5, image_url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  barbearia: buildNicheVariants(
    "barbearia",
    ["cinematic-glass", "spotlight-neon", "business-modern"],
    ["midnight", "amber", "aurora"],
    ["Barber Club Cinematográfico", "Dark Neon Blade VIP", "Barbearia Clássica & Estilo"],
    [
      (name, city) => `Cortes de alta precisão, degradê na navalha e barba terapia em ${city}`,
      (name, city) => `Seu momento de cuidado masculino com toalha quente e estilo na ${name}`,
      (name, city) => `Excelência em cortes masculinos, alinhamento e pigmentação na ${name}`,
    ],
    [
      (name, city) => `Na ${name} você encontra os melhores profissionais para corte degradê, barba terapia com toalha quente, selagem e cuidados masculinos em ${city}. Agende agora pelo WhatsApp.`,
      (name, city) => `Ambiente climatizado, cerveja cortesia e atendimento pontual na ${name}. Seu estilo em outro nível.`,
      (name, city) => `Tradição e modernidade em cortes masculinos e cuidados com a barba na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Corte Degradê & Social", category: "Cortes", description: "Fade milimétrico na navalha ou tesoura com lavagem refrescante e finalização.", price: 45.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80" },
        { name: "Barba Terapia com Toalha Quente", category: "Barba", description: "Alinhamento com navalhete, óleo hidratante, toalha quente e massagem facial.", price: 35.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" },
        { name: "Combo VIP: Corte + Barba + Sobrancelha", category: "Combos", description: "Transformação completa do visual com todos os cuidados integrados.", price: 70.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Pigmentação & Camuflagem de Fios", category: "Tratamentos", description: "Correção de falhas na barba ou cabelo com pigmento natural de longa fixação.", price: 30.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80" },
        { name: "Corte Infantil Estilizado", category: "Cortes", description: "Atendimento paciente e cuidadoso para deixar os pequenos com muito estilo.", price: 40.0, duration_minutes: 35, image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Hidratação Profunda & Detox Capilar", category: "Tratamentos", description: "Limpeza profunda do couro cabeludo e hidratação nutritiva dos fios.", price: 50.0, duration_minutes: 40, image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  beleza: buildNicheVariants(
    "beleza",
    ["beauty-glam", "cinematic-glass", "spotlight-neon"],
    ["sunset", "aurora", "midnight"],
    ["Studio Beauty Glam & Nails", "Estética Facial & Procedimentos VIP", "Dark Showcase Estética & Glamour"],
    [
      (name, city) => `Realce sua beleza natural com procedimentos exclusivos e unhas perfeitas em ${city}`,
      (name, city) => `Design de sobrancelhas, estética avançada e cuidados capilares na ${name}`,
      (name, city) => `Seu momento de autocuidado com conforto e excelência na ${name}`,
    ],
    [
      (name, city) => `No ${name} você conta com manicure e pedicure em gel, lash lifting, design de sobrancelhas e tratamentos faciais de alto padrão em ${city}. Agende seu horário pelo WhatsApp.`,
      (name, city) => `Técnicas modernas para valorizar sua beleza com produtos de alta performance na ${name}.`,
      (name, city) => `Ambiente acolhedor e atendimento personalizado para transformar sua autoestima na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Manicure & Alongamento em Gel", category: "Nails", description: "Alongamento com fibra ou gel moldado, cuticulagem russa e esmaltação duradoura.", price: 120.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
        { name: "Design de Sobrancelhas & Lash Lifting", category: "Olhar", description: "Alinhamento com henna ou tintura e curvatura natural dos cílios com hidratação.", price: 85.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" },
        { name: "Escova Modelada & Hidratação Profunda", category: "Cabelos", description: "Nutrição intensiva com reposição de massa capilar e escovação impecável.", price: 90.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Limpeza de Pele Profunda & Glow Facial", category: "Estética", description: "Extração de impurezas, peeling de diamante e máscara calmante regeneradora.", price: 140.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80" },
        { name: "Drenagem Linfática & Massagem Relaxante", category: "Corpo", description: "Manobras suaves para desinchar o corpo e aliviar tensões musculares.", price: 130.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Mechas Iluminadas & Cronograma Capilar", category: "Cabelos", description: "Clareamento saudável com proteção dos fios e reconstrução profunda imediata.", price: 220.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  oficina: buildNicheVariants(
    "oficina",
    ["business-modern", "spotlight-neon", "business-classic"],
    ["midnight", "amber", "ocean"],
    ["Auto Center & Diagnóstico 3D", "Mecânica Rápida & Revisão", "Especialista em Freios & Suspensão"],
    [
      (name, city) => `Mecânica de precisão, peças com garantia e segurança para seu carro em ${city}`,
      (name, city) => `Revisão preventiva completa e socorro rápido com a equipe da ${name}`,
      (name, city) => `Seu veículo em mãos qualificadas com tecnologia e transparência na ${name}`,
    ],
    [
      (name, city) => `Na ${name} você encontra diagnóstico computadorizado, troca de óleo, revisão de freios, suspensão e alinhamento 3D com orçamento transparente em ${city}.`,
      (name, city) => `Manutenção preventiva e corretiva com peças de qualidade e atendimento ágil na ${name}.`,
      (name, city) => `Equipe técnica certificada para garantir a segurança da sua família na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Revisão Preventiva Completa", category: "Revisão", description: "Check-up em mais de 40 itens essenciais para rodar com total segurança e tranquilidade.", price: 180.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80" },
        { name: "Alinhamento 3D & Balanceamento", category: "Pneus", description: "Geometria digital computadorizada para evitar desgaste irregular dos pneus.", price: 120.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80" },
        { name: "Troca de Óleo & Filtros", category: "Lubrificantes", description: "Óleo sintético recomendado pela montadora e filtros novos para prolongar a vida útil do motor.", price: 195.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Diagnóstico Computadorizado via Scanner", category: "Injeção", description: "Identificação de falhas e luzes do painel com scanner de última geração.", price: 90.0, duration_minutes: 40, image_url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80" },
        { name: "Higienização de Ar Condicionado", category: "Conforto", description: "Limpeza com ozônio e troca do filtro de cabine para eliminar odores e fungos.", price: 85.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Manutenção de Freios & Pastilhas", category: "Freios", description: "Troca de pastilhas, sangria de fluido e retífica de discos com garantia.", price: 160.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  clinica: buildNicheVariants(
    "clinica",
    ["clinic-care", "business-modern", "spotlight-neon"],
    ["ocean", "forest", "midnight"],
    ["Clínica Médica & Saúde Integrada", "Consultório Especializado Clean", "Centro Clínico de Excelência VIP"],
    [
      (name, city) => `Cuidado humanizado, consultas com especialistas e exames em ${city}`,
      (name, city) => `Sua saúde em primeiro lugar com o corpo clínico da ${name}`,
      (name, city) => `Atendimento acolhedor, agilidade e excelência médica na ${name}`,
    ],
    [
      (name, city) => `A ${name} reúne especialistas capacitados, estrutura confortável e atendimento atencioso para toda a sua família em ${city}. Agende sua consulta pelo WhatsApp.`,
      (name, city) => `Consultas preventivas, diagnósticos precisos e acompanhamento contínuo na ${name}.`,
      (name, city) => `Saúde integral e cuidado de alto padrão com a equipe da ${name} em ${city}.`,
    ],
    [
      [
        { name: "Consulta Médica Especializada", category: "Consultas", description: "Avaliação completa com médico especialista, escuta atenta e plano terapêutico.", price: 250.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80" },
        { name: "Check-up Clínico Preventivo", category: "Exames", description: "Bateria de exames e orientações preventivas para manter sua saúde sempre em dia.", price: 380.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80" },
        { name: "Teleconsulta com Especialista", category: "Online", description: "Atendimento por vídeo com envio de receitas e atestados digitais válidos.", price: 180.0, duration_minutes: 40, image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Retorno & Acompanhamento", category: "Consultas", description: "Avaliação da evolução do tratamento e ajuste de medicamentos.", price: 0.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Laudo & Atestado Ocupacional", category: "Exames", description: "Exame admissional, demissional e periódicos com emissão rápida.", price: 95.0, duration_minutes: 20, image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  psicologia: buildNicheVariants(
    "psicologia",
    ["therapy-wellbeing", "business-modern", "spotlight-neon"],
    ["forest", "ocean", "midnight"],
    ["Psicoterapia & Acolhimento Humanizado", "Consultório de Psicologia & Saúde Mental", "Espaço Terapêutico VIP Online"],
    [
      (name, city) => `Acolhimento, escuta sensível e equilíbrio emocional com ${name} em ${city}`,
      (name, city) => `Um espaço seguro e livre de julgamentos para seu autoconhecimento`,
      (name, city) => `Supere a ansiedade e fortaleça sua saúde mental na ${name}`,
    ],
    [
      (name, city) => `Sessões individuais focadas no alívio da ansiedade, estresse, luto e desenvolvimento emocional com ${name}. Atendimento presencial em ${city} e online para todo o Brasil.`,
      (name, city) => `Psicoterapia humanizada e ética para ajudar você a viver com mais leveza na ${name}.`,
      (name, city) => `Cuidado dedicado à sua saúde mental com suporte empático na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Sessão de Psicoterapia Individual", category: "Atendimento", description: "Atendimento individual humanizado de 50 minutos com sigilo ético absoluto.", price: 160.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=400&q=80" },
        { name: "Terapia Online para Ansiedade", category: "Online", description: "Sessão remota segura com técnicas práticas de manejo do estresse e controle da ansiedade.", price: 150.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80" },
        { name: "Terapia de Casal & Relações", category: "Relacionamentos", description: "Espaço mediado para fortalecer o diálogo, resolver conflitos e reconstruir a harmonia.", price: 240.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Primeira Sessão de Acolhimento", category: "Inicial", description: "Conversa inicial para entender suas necessidades e traçar objetivos terapêuticos.", price: 140.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Pacote Mensal de Terapia (4 Sessões)", category: "Planos", description: "Acompanhamento contínuo semanal com economia e foco em resultados duradouros.", price: 560.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  petshop: buildNicheVariants(
    "petshop",
    ["store-showcase", "business-modern", "spotlight-neon"],
    ["forest", "amber", "ocean"],
    ["Pet Shop, Banho & Tosa com Amor", "Rações Premium & Farmácia Pet", "Pet Care Completo & Acessórios VIP"],
    [
      (name, city) => `Carinho, cuidado e tudo o que seu melhor amigo precisa na ${name} em ${city}`,
      (name, city) => `Banho relaxante, tosa higiênica e saúde preventiva na ${name}`,
      (name, city) => `Rações de alta qualidade, vacinas e acessórios pet em ${city}`,
    ],
    [
      (name, city) => `Tratamos seu pet como membro da família na ${name}. Banho com toalhas individuais esterilizadas, tosa na tesoura, rações premium e atendimento veterinário em ${city}.`,
      (name, city) => `Ambiente seguro, profissionais carinhosos e produtos de primeira linha na ${name}.`,
      (name, city) => `Saúde, beleza e bem-estar para cães e gatos na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Banho & Tosa Especializada", category: "Estética Pet", description: "Banho com shampoo hipoalergênico, hidratação dos pelos, corte de unhas e tosa higiênica.", price: 75.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80" },
        { name: "Ração Super Premium 15kg", category: "Alimentação", description: "Nutrição completa com ingredientes nobres para pelagem brilhante e saúde digestiva.", price: 219.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80" },
        { name: "Consulta Veterinária Preventiva", category: "Saúde", description: "Exame clínico geral, pesagem, orientações nutricionais e vacinação em dia.", price: 140.0, duration_minutes: 40, image_url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Tosa na Tesoura com Finalização", category: "Estética Pet", description: "Acabamento delicado para valorizar os traços da raça com total conforto.", price: 95.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Vacina Polivalente V10 Importada", category: "Imunização", description: "Proteção máxima contra as principais doenças caninas com atestado de vacinação.", price: 90.0, duration_minutes: 20, image_url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  advocacia: buildNicheVariants(
    "advocacia",
    ["law-authority", "business-modern", "spotlight-neon"],
    ["midnight", "ocean", "amber"],
    ["Advocacia de Autoridade & Estratégia", "Consultoria Jurídica & Direitos", "Escritório Jurídico Corporativo VIP"],
    [
      (name, city) => `Defesa técnica intransigente e segurança jurídica em ${city}`,
      (name, city) => `Assessoria consultiva e contenciosa com a equipe da ${name}`,
      (name, city) => `Soluções jurídicas estratégicas para você e sua empresa na ${name}`,
    ],
    [
      (name, city) => `Atuação especializada em direito civil, trabalhista, previdenciário e contratos na ${name} em ${city}. Atendimento direto e confidencial via WhatsApp.`,
      (name, city) => `Experiência comprovada, atendimento ético e comunicação clara na ${name}.`,
      (name, city) => `Proteção aos seus direitos e ao patrimônio da sua família na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Consulta Jurídica Especializada", category: "Consultoria", description: "Análise detalhada do seu caso com emissão de parecer técnico e definição de estratégia.", price: 280.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
        { name: "Planejamento Sucessório & Inventário", category: "Família", description: "Resolução ágil de inventários, partilhas e proteção de bens com total discrição.", price: 950.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80" },
        { name: "Defesa Trabalhista & Contratos", category: "Trabalhista", description: "Ações judiciais, cálculos trabalhistas e elaboração de contratos blindados.", price: 450.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Assessoria Preventiva Mensal", category: "Empresarial", description: "Suporte jurídico contínuo para redução de riscos e conformidade legal.", price: 1200.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Revisão Contratual Urgente", category: "Contratos", description: "Leitura de cláusulas e identificação de armadilhas contratuais em 24h.", price: 320.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  odontologia: buildNicheVariants(
    "odontologia",
    ["clinic-care", "business-modern", "spotlight-neon"],
    ["ocean", "forest", "midnight"],
    ["Odontologia de Alto Padrão & Implantes", "Estética Dental & Clareamento a Laser", "Studio Odontológico VIP"],
    [
      (name, city) => `Seu sorriso transformado com conforto e tecnologia de ponta em ${city}`,
      (name, city) => `Tratamentos odontológicos modernos e indolores na ${name}`,
      (name, city) => `Recupere sua autoestima e mastigação perfeita com a equipe da ${name}`,
    ],
    [
      (name, city) => `A ${name} une tecnologia digital, escaneamento 3D e especialistas em implantes, ortodontia e clareamento dental em ${city}. Agende sua avaliação no WhatsApp.`,
      (name, city) => `Procedimentos seguros, ambiente higienizado e atendimento carinhoso na ${name}.`,
      (name, city) => `Excelência estética e saúde bucal completa na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Avaliação Completa & Limpeza Profunda", category: "Prevenção", description: "Exame minucioso da saúde bucal com profilaxia, remoção de tártaro e polimento dental.", price: 160.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80" },
        { name: "Clareamento Dental a Laser", category: "Estética", description: "Dentes visivelmente mais brancos em poucas sessões com conforto e sem dor.", price: 550.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80" },
        { name: "Implante Dentário com Carga Rápida", category: "Implantes", description: "Recupere o dente fixo com material de titânio biocompatível e aspecto 100% natural.", price: 1600.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Alinhador Invisível (Ortodontia Estética)", category: "Ortodontia", description: "Dentes alinhados sem o incômodo dos aparelhos metálicos tradicionais.", price: 2900.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Facetas e Lentes de Resina", category: "Estética", description: "Harmonização do formato e cor dos dentes em sessão única.", price: 600.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  construcao: buildNicheVariants(
    "construcao",
    ["business-modern", "spotlight-neon", "portfolio-studio"],
    ["amber", "midnight", "ocean"],
    ["Construção Civil, Obras & Reformas", "Engenharia & Gestão de Obras VIP", "Empreiteira & Acabamentos Finos"],
    [
      (name, city) => `Sua obra entregue no prazo e com padrão de engenharia impecável em ${city}`,
      (name, city) => `Reformas residenciais e comerciais sem dor de cabeça com a ${name}`,
      (name, city) => `Projetos estruturais, laudos e acabamentos de alto nível na ${name}`,
    ],
    [
      (name, city) => `A ${name} executa construções do zero, reformas completas, alvenaria, instalações elétricas/hidráulicas e pinturas com contrato e garantia em ${city}.`,
      (name, city) => `Mão de obra qualificada e controle de custos para sua reforma na ${name}.`,
      (name, city) => `Segurança estrutural e transparência na entrega da sua obra com a ${name} em ${city}.`,
    ],
    [
      [
        { name: "Gerenciamento & Execução de Obras", category: "Obras", description: "Acompanhamento diário com equipe técnica, controle de compras e cronograma rigoroso.", price: 2500.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
        { name: "Reforma Completa de Apartamento / Casa", category: "Reformas", description: "Troca de pisos, demolição, revestimentos finos, drywall e pintura premium.", price: 3800.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80" },
        { name: "Projeto Estrutural & Laudo Técnico", category: "Engenharia", description: "Cálculo estrutural com ART assinado por engenheiro civil credenciado.", price: 1200.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Pintura Profissional & Texturas", category: "Acabamentos", description: "Preparação impecável de paredes com emassamento e pintura sem sujeira.", price: 1400.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Instalação Elétrica & Padrão de Entrada", category: "Elétrica", description: "Rede dimensionada para segurança contra curtos-circuitos e economia de energia.", price: 900.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  imobiliaria: buildNicheVariants(
    "imobiliaria",
    ["store-showcase", "spotlight-neon", "business-modern"],
    ["ocean", "midnight", "aurora"],
    ["Catálogo de Imóveis & Lançamentos", "Imobiliária de Alto Padrão VIP", "Assessoria Imobiliária & Locação"],
    [
      (name, city) => `Encontre o imóvel dos seus sonhos em ${city} com a ${name}`,
      (name, city) => `Casas em condomínio, apartamentos e terrenos com documentação 100% segura`,
      (name, city) => `Assessoria completa para compra, venda e locação de imóveis na ${name}`,
    ],
    [
      (name, city) => `A ${name} conta com corretores credenciados, portfólio selecionado de imóveis e apoio jurídico para negociações seguras e sem surpresas em ${city}.`,
      (name, city) => `Lançamentos imperdíveis e imóveis de alto padrão na ${name}.`,
      (name, city) => `Seu novo endereço com facilidade e transparência na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Casas em Condomínio Fechado", category: "Venda", description: "Imóveis amplos com segurança 24h, piscina, área gourmet e lazer completo.", price: 850000.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80" },
        { name: "Apartamento 3 Dormitórios com Varanda", category: "Venda", description: "Planta moderna e ensolarada próxima às melhores escolas e comércios da cidade.", price: 490000.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" },
        { name: "Avaliação Mercadológica de Imóveis", category: "Serviços", description: "Laudo com o valor real de mercado para venda rápida e justa do seu patrimônio.", price: 350.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Locação Residencial com Garantia Digital", category: "Locação", description: "Aluguel rápido sem necessidade de fiador tradicional ou caução em dinheiro.", price: 2400.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Salas Comerciais & Lojas", category: "Comercial", description: "Espaços estratégicos para o crescimento da sua empresa ou consultório.", price: 2800.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  seguros: buildNicheVariants(
    "seguros",
    ["business-modern", "spotlight-neon", "business-classic"],
    ["ocean", "midnight", "forest"],
    ["Corretora de Seguros & Proteção", "Seguro Auto, Residencial & Vida VIP", "Consultoria em Benefícios & Planos"],
    [
      (name, city) => `Proteja o que mais importa com as melhores seguradoras do país na ${name}`,
      (name, city) => `Tranquilidade para sua família e patrimônio com cotação sob medida em ${city}`,
      (name, city) => `Seguro auto, residencial e planos de saúde com assistência 24h na ${name}`,
    ],
    [
      (name, city) => `A ${name} compara as principais seguradoras para garantir a apólice mais vantajosa para você, seu carro e sua empresa em ${city}. Cotação gratuita no WhatsApp.`,
      (name, city) => `Atendimento consultivo, agilidade no sinistro e suporte 24 horas na ${name}.`,
      (name, city) => `Segurança financeira e proteção pessoal com a equipe da ${name} em ${city}.`,
    ],
    [
      [
        { name: "Seguro Automóvel Completo", category: "Veículos", description: "Cobertura total contra roubo, colisão, terceiros, guincho ilimitado e carro reserva.", price: 160.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80" },
        { name: "Seguro de Vida & Invalidez", category: "Família", description: "Proteção financeira com indenização rápida para tranquilidade da sua família.", price: 65.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80" },
        { name: "Plano de Saúde Individual & Familiar", category: "Saúde", description: "Rede credenciada de hospitais, laboratórios e clínicas com preços acessíveis.", price: 290.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Seguro Residencial com Serviços Emergenciais", category: "Residencial", description: "Proteção contra incêndio e danos elétricos com eletricista e encanador inclusos.", price: 45.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Seguro Empresarial & Patrimonial", category: "Empresas", description: "Cobertura sob medida para maquinário, estoque e responsabilidade civil do seu negócio.", price: 220.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  autonomo: buildNicheVariants(
    "autonomo",
    ["business-modern", "spotlight-neon", "portfolio-studio"],
    ["midnight", "ocean", "aurora"],
    ["Serviços Técnicos & Profissional Autônomo", "Atendimento Ágil & Reparos de Precisão", "Portfólio de Obras & Serviços"],
    [
      (name, city) => `Serviço pontual, confiável e com garantia comprovada em ${city}`,
      (name, city) => `Mão de obra especializada com atendimento direto pelo WhatsApp com ${name}`,
      (name, city) => `Soluções práticas e orçamento justo para sua necessidade na ${name}`,
    ],
    [
      (name, city) => `Profissional dedicado com ferramentas de precisão, pontualidade e transparência na ${name} em ${city}. Fale comigo agora mesmo e agende seu atendimento.`,
      (name, city) => `Diagnóstico correto e serviço garantido sem desperdício de tempo e material na ${name}.`,
      (name, city) => `Atendimento particular com foco em resolver seu problema com perfeição na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Visita Técnica & Diagnóstico", category: "Atendimento", description: "Avaliação minuciosa no local para identificar a causa e orçar a solução exata.", price: 80.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80" },
        { name: "Manutenção & Reparo Especializado", category: "Serviços", description: "Execução do reparo com peças de qualidade e teste prático de funcionamento.", price: 180.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80" },
        { name: "Instalação & Configuração Técnica", category: "Instalação", description: "Instalação segura seguindo normas técnicas para garantir longa vida útil ao equipamento.", price: 140.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Atendimento de Urgência no Mesmo Dia", category: "Plantão", description: "Prioridade para resolver problemas críticos sem fila de espera.", price: 150.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Revisão Preventiva Geral", category: "Preventiva", description: "Ajustes e limpeza de componentes para evitar panes futuras inesperadas.", price: 110.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  pessoal: buildNicheVariants(
    "pessoal",
    ["portfolio-studio", "spotlight-neon", "creator-bold"],
    ["aurora", "midnight", "minimal"],
    ["Página Pessoal & Portfólio de Autoridade", "BioLink Profissional & Criador", "Perfil Oficial, Projetos & Contatos"],
    [
      (name, city) => `Conheça os projetos, conteúdos e parcerias de ${name}`,
      (name, city) => `Conecte-se comigo: links oficiais, consultorias e novidades`,
      (name, city) => `Autoridade, trabalho autoral e contato direto com ${name} em ${city}`,
    ],
    [
      (name, city) => `Boas-vindas ao meu espaço oficial! Aqui você encontra meus canais, projetos, palestras, mentorias e contato direto via WhatsApp.`,
      (name, city) => `Conteúdos autorais e soluções exclusivas desenvolvidas por ${name}.`,
      (name, city) => `Acesso rápido aos meus melhores projetos e formas de contato direto.`,
    ],
    [
      [
        { name: "Mentoria Individual 1:1", category: "Mentoria", description: "Sessão exclusiva de 1 hora com direcionamento estratégico e plano de ação personalizado.", price: 350.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80" },
        { name: "Palestra & Workshop Presencial", category: "Eventos", description: "Apresentação dinâmica e transformadora para empresas, congressos e equipes.", price: 1800.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80" },
        { name: "Acesso à Comunidade & Materiais", category: "Recursos", description: "Apostilas digitais, e-books e modelos práticos para você aplicar de imediato.", price: 97.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Consultoria de 30 Minutos", category: "Express", description: "Tire dúvidas pontuais e receba orientação rápida para destravar seus projetos.", price: 190.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Parceria Comercial & Divulgação", category: "Comercial", description: "Divulgação estratégica para marcas e produtos nos meus canais oficiais.", price: 900.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  fitness: buildNicheVariants(
    "fitness",
    ["academy-performance", "spotlight-neon", "academy-performance"],
    ["forest", "flame", "midnight"],
    ["Academia & Treinamento de Alta Performance", "Personal Trainer & Consultoria VIP", "Studio Fitness & Treino Funcional"],
    [
      (name, city) => `Transforme seu corpo e conquiste sua melhor versão na ${name} em ${city}`,
      (name, city) => `Treinos personalizados, maquinário ergonômico e resultados reais`,
      (name, city) => `Condicionamento, saúde e energia com a equipe da ${name}`,
    ],
    [
      (name, city) => `A ${name} conta com estrutura de ponta, instrutores dedicados, ambiente motivador e planos sem taxa de cancelamento em ${city}. Agende sua aula experimental gratuita!`,
      (name, city) => `Treinos sob medida com periodização científica e suporte nutricional na ${name}.`,
      (name, city) => `Queime calorias e ganhe massa muscular com acompanhamento de excelência na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Plano Mensal Livre Acesso à Academia", category: "Planos", description: "Musculação completa, cardio e aulas coletivas com instrutores todos os dias.", price: 119.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80" },
        { name: "Consultoria com Personal Trainer (Mês)", category: "Personal", description: "Ficha de treino individualizada com correção de movimentos e metas semanais.", price: 290.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80" },
        { name: "Aula Experimental Gratuita", category: "Experimente", description: "Conheça nosso espaço e treine por 1 dia sem nenhum custo ou compromisso.", price: 0.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Plano Anual com Desconto Especial", category: "Planos", description: "Maior economia para quem tem compromisso sério com o estilo de vida saudável.", price: 89.9, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Bioimpedância & Avaliação Física", category: "Avaliação", description: "Medição de porcentagem de gordura, massa magra e taxa metabólica basal.", price: 60.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  nutricao: buildNicheVariants(
    "nutricao",
    ["clinic-care", "business-modern", "spotlight-neon"],
    ["forest", "ocean", "midnight"],
    ["Nutrição Clínica & Emagrecimento Consciente", "Consultório Nutricional & Esportivo VIP", "Plano Alimentar & Bioimpedância"],
    [
      (name, city) => `Alcançar seu peso ideal com saúde e sem passar fome com ${name} em ${city}`,
      (name, city) => `Reeducação alimentar personalizada para sua rotina e preferências`,
      (name, city) => `Mais disposição, longevidade e equilíbrio com a orientação da ${name}`,
    ],
    [
      (name, city) => `A ${name} desenvolve planos alimentares realistas, saborosos e sem dietas malucas em ${city}. Avaliação física com bioimpedância e suporte via WhatsApp entre as consultas.`,
      (name, city) => `Nutrição com empatia e ciência para transformar sua relação com a comida na ${name}.`,
      (name, city) => `Saúde intestinal, perda de gordura e ganho de massa magra na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Consulta Nutricional Completa + Bioimpedância", category: "Consultas", description: "Avaliação detalhada dos hábitos, exames de sangue e plano alimentar montado na hora.", price: 220.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" },
        { name: "Plano de Emagrecimento Saudável (Acompanhamento)", category: "Planos", description: "3 meses de acompanhamento com ajustes quinzenais e suporte diário de dúvidas.", price: 540.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80" },
        { name: "Guia Prático de Receitas & Lista de Compras", category: "Materiais", description: "Cardápio inteligente com opções fáceis e econômicas para o dia a dia.", price: 47.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Nutrição Esportiva para Performance", category: "Esportiva", description: "Estratégias de pré e pós-treino para ganho acelerado de massa muscular e energia.", price: 240.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Consulta de Retorno & Metas", category: "Retorno", description: "Reavaliação corporal para medir a perda de gordura e novos desafios.", price: 120.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  costura: buildNicheVariants(
    "costura",
    ["store-showcase", "portfolio-studio", "spotlight-neon"],
    ["sunset", "aurora", "midnight"],
    ["Ateliê de Costura & Moda Sob Medida", "Ajustes, Reformas & Alfaiataria Fina", "Vestidos de Festa & Noivas VIP"],
    [
      (name, city) => `Caimento perfeito e reformas delicadas com acabamento de alfaiataria em ${city}`,
      (name, city) => `Suas roupas favoritas renovadas com precisão e cuidado na ${name}`,
      (name, city) => `Vestidos sob medida e ajustes impecáveis com a equipe da ${name}`,
    ],
    [
      (name, city) => `No ateliê da ${name} cada peça é tratada com carinho e técnica de alta costura. Ajustes de vestidos, ternos, barras originais de jeans e confecção sob medida em ${city}.`,
      (name, city) => `Pontualidade na entrega e caimento que valoriza seu corpo na ${name}.`,
      (name, city) => `Transforme ou repare suas roupas com perfeição na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Ajuste & Reforma de Roupas em Geral", category: "Ajustes", description: "Ajustes de cintura, mangas, troca de zíperes e reparos com costura imperceptível.", price: 45.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80" },
        { name: "Barra Original de Calça Jeans", category: "Barras", description: "Acabamento de fábrica preservando a lavagem e costura original da peça.", price: 30.0, duration_minutes: 20, image_url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=400&q=80" },
        { name: "Confecção de Vestido de Festa Sob Medida", category: "Sob Medida", description: "Modelagem anatômica exclusiva desenvolvida especialmente para o seu evento.", price: 480.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Ajuste Fino de Terno / Paletó", category: "Alfaiataria", description: "Alinhamento de ombros e mangas para um visual elegante e corporativo.", price: 95.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Customização & Transformação de Peças", category: "Estilo", description: "Modernize peças antigas do seu guarda-roupa com novos cortes e detalhes.", price: 70.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  tecnologia: buildNicheVariants(
    "tecnologia",
    ["spotlight-neon", "business-modern", "spotlight-neon"],
    ["midnight", "ocean", "aurora"],
    ["Assistência Técnica, PC & Notebooks", "Suporte de TI & Redes para Empresas", "Especialista em Celulares & Placas VIP"],
    [
      (name, city) => `Conserto rápido de computadores, notebooks e celulares com garantia em ${city}`,
      (name, city) => `Suporte técnico em TI e redes sem complicações com a ${name}`,
      (name, city) => `Seus equipamentos recuperados com peças originais e agilidade na ${name}`,
    ],
    [
      (name, city) => `A ${name} é especialista em formatação, troca de telas, reparo em placas-mãe, montagem de computadores e suporte de TI empresarial em ${city}. Diagnóstico rápido pelo WhatsApp!`,
      (name, city) => `Segurança de dados, peças de primeira linha e atendimento pontual na ${name}.`,
      (name, city) => `Tecnologia e suporte descomplicado para você e seu negócio na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Formatação Completa com Backup Seguro", category: "Software", description: "Instalação limpa do Windows/macOS, pacote de programas essenciais e preservação total dos seus arquivos.", price: 120.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80" },
        { name: "Upgrade para SSD Rápido + Limpeza Térmica", category: "Hardware", description: "Deixe seu notebook até 10x mais rápido com novo SSD e troca de pasta térmica de prata.", price: 240.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
        { name: "Troca de Tela & Bateria de Celular", category: "Mobile", description: "Peça de qualidade original trocada em poucas horas com garantia comprovada.", price: 190.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Configuração de Rede Wi-Fi & Servidores", category: "Redes", description: "Sinal estável em todos os cômodos e segurança contra acessos indevidos.", price: 280.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Montagem de PC Gamer / Profissional", category: "Montagem", description: "Cable management impecável, escolha correta de peças e testes de estabilidade.", price: 200.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  geral: buildNicheVariants(
    "geral",
    ["business-modern", "spotlight-neon", "business-classic"],
    ["aurora", "midnight", "ocean"],
    ["Empresa de Autoridade & Negócios", "Dark Showcase Corporativo VIP", "Apresentação Comercial Clean"],
    [
      (name, city) => `Excelência no atendimento e soluções completas na ${name} em ${city}`,
      (name, city) => `Tradição, pontualidade e satisfação garantida com a ${name}`,
      (name, city) => `Conheça nossos produtos e fale conosco direto no WhatsApp`,
    ],
    [
      (name, city) => `A ${name} oferece serviços e produtos com padrão de excelência, transparência e atendimento prioritário em ${city}. Fale conosco!`,
      (name, city) => `Compromisso inegociável com a sua satisfação na ${name}.`,
      (name, city) => `Atendimento personalizado com resposta ágil na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Atendimento & Orçamento Personalizado", category: "Atendimento", description: "Análise sob medida para entregar a solução ideal com agilidade.", price: 0.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80" },
        { name: "Serviço Padrão de Excelência", category: "Soluções", description: "Execução profissional com garantia e acompanhamento contínuo.", price: 150.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80" },
        { name: "Suporte Prioritário ao Cliente", category: "Suporte", description: "Canal direto no WhatsApp para tirar dúvidas e solicitar agendamentos rápidos.", price: 0.0, duration_minutes: 15, image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),
};

// ==========================================
// 4. MAPEAMENTO DE COMPATIBILIDADE (PRESETS)
// ==========================================
export const PRESETS: Record<string, NichePreset> = {
  loja: NICHE_PRESETS_VARIANTS.loja[0],
  delivery: NICHE_PRESETS_VARIANTS.delivery[0],
  restaurante: NICHE_PRESETS_VARIANTS.restaurante[0],
  sorveteria: NICHE_PRESETS_VARIANTS.sorveteria[0],
  oficina: NICHE_PRESETS_VARIANTS.oficina[0],
  clinica: NICHE_PRESETS_VARIANTS.clinica[0],
  psicologia: NICHE_PRESETS_VARIANTS.psicologia[0],
  petshop: NICHE_PRESETS_VARIANTS.petshop[0],
  advocacia: NICHE_PRESETS_VARIANTS.advocacia[0],
  odontologia: NICHE_PRESETS_VARIANTS.odontologia[0],
  construcao: NICHE_PRESETS_VARIANTS.construcao[0],
  imobiliaria: NICHE_PRESETS_VARIANTS.imobiliaria[0],
  seguros: NICHE_PRESETS_VARIANTS.seguros[0],
  autonomo: NICHE_PRESETS_VARIANTS.autonomo[0],
  pessoal: NICHE_PRESETS_VARIANTS.pessoal[0],
  fitness: NICHE_PRESETS_VARIANTS.fitness[0],
  nutricao: NICHE_PRESETS_VARIANTS.nutricao[0],
  costura: NICHE_PRESETS_VARIANTS.costura[0],
  tecnologia: NICHE_PRESETS_VARIANTS.tecnologia[0],
  geral: NICHE_PRESETS_VARIANTS.geral[0],
  bebidas: NICHE_PRESETS_VARIANTS.bebidas[0],
  barbearia: NICHE_PRESETS_VARIANTS.barbearia[0],
  beleza: NICHE_PRESETS_VARIANTS.beleza[0],
  // Mapeamentos complementares para sinônimos e links legados:
  adega: NICHE_PRESETS_VARIANTS.bebidas[0],
  distribuidora: NICHE_PRESETS_VARIANTS.bebidas[0],
  estetica: NICHE_PRESETS_VARIANTS.beleza[0],
  salao: NICHE_PRESETS_VARIANTS.beleza[0],
  manicure: NICHE_PRESETS_VARIANTS.beleza[0],
  academia: NICHE_PRESETS_VARIANTS.fitness[0],
  arquitetura: NICHE_PRESETS_VARIANTS.construcao[0],
  contabilidade: NICHE_PRESETS_VARIANTS.advocacia[0],
  tatuagem: NICHE_PRESETS_VARIANTS.autonomo[0],
  otica: NICHE_PRESETS_VARIANTS.loja[0],
  ecommerce: NICHE_PRESETS_VARIANTS.loja[0],
  dentista: NICHE_PRESETS_VARIANTS.odontologia[0],
  advogado: NICHE_PRESETS_VARIANTS.advocacia[0],
  veterinaria: NICHE_PRESETS_VARIANTS.petshop[0],
  terapeuta: NICHE_PRESETS_VARIANTS.psicologia[0],
};

export interface CanonicalNicheMeta {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const CANONICAL_NICHES: CanonicalNicheMeta[] = [
  { key: "barbearia", label: "Barbearia", icon: "💈", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { key: "beleza", label: "Salão & Estética", icon: "✨", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30" },
  { key: "bebidas", label: "Bebidas & Distribuidora", icon: "🍷", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  { key: "odontologia", label: "Odontologia", icon: "🦷", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30" },
  { key: "clinica", label: "Clínica & Saúde", icon: "🏥", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { key: "psicologia", label: "Psicologia & Mente", icon: "🧠", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { key: "nutricao", label: "Nutrição & Dieta", icon: "🥗", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
  { key: "restaurante", label: "Restaurante & Gastronomia", icon: "🍽️", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { key: "delivery", label: "Delivery & Lanches", icon: "🍔", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  { key: "sorveteria", label: "Sorveteria & Açaí", icon: "🍦", color: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30" },
  { key: "loja", label: "Loja & Moda", icon: "🛍️", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
  { key: "petshop", label: "Pet Shop & Veterinária", icon: "🐾", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  { key: "auto", label: "Oficina & Auto", icon: "🚗", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { key: "advocacia", label: "Advocacia & Jurídico", icon: "⚖️", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  { key: "construcao", label: "Construção & Reformas", icon: "🏗️", color: "bg-amber-600/10 text-amber-800 dark:text-amber-400 border-amber-600/30" },
  { key: "imobiliaria", label: "Imobiliária & Corretor", icon: "🏢", color: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  { key: "energia_solar", label: "Energia Solar", icon: "☀️", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { key: "seguros", label: "Seguros & Planos", icon: "🛡️", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30" },
  { key: "fitness", label: "Academia & Treino", icon: "💪", color: "bg-lime-600/10 text-lime-800 dark:text-lime-400 border-lime-600/30" },
  { key: "tecnologia", label: "Tecnologia & TI", icon: "💻", color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30" },
  { key: "costura", label: "Costura & Ateliê", icon: "🪡", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30" },
  { key: "autonomo", label: "Autônomo & Serviços", icon: "🔧", color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30" },
];

export function getCanonicalNicheMeta(key: string): CanonicalNicheMeta | undefined {
  return CANONICAL_NICHES.find((item) => item.key === key);
}

// ==========================================
// 5. MAPEAMENTO DE ALIASES & DETECÇÃO INTELIGENTE
// ==========================================
export const NICHE_ALIASES: Record<string, string> = {
  barber: "barbearia",
  barbershop: "barbearia",
  barbeiro: "barbearia",
  salao: "beleza",
  estetica: "beleza",
  manicure: "beleza",
  nails: "beleza",
  cabelereiro: "beleza",
  cabeleireiro: "beleza",
  odonto: "odontologia",
  dentista: "odontologia",
  ortodontia: "odontologia",
  medica: "clinica",
  medico: "clinica",
  consultorio: "clinica",
  saude: "clinica",
  psicologo: "psicologia",
  psicologa: "psicologia",
  psicoterapia: "psicologia",
  terapeuta: "terapia",
  academia: "fitness",
  crossfit: "fitness",
  gym: "fitness",
  treino: "fitness",
  personal: "fitness",
  restaurantes: "restaurante",
  gastronomia: "restaurante",
  lanchonete: "delivery",
  pizzaria: "delivery",
  hamburgueria: "delivery",
  adega: "bebidas",
  cervejaria: "bebidas",
  distribuidora: "bebidas",
  lojas: "loja",
  roupas: "loja",
  moda: "loja",
  calcados: "loja",
  acessorios: "loja",
  advogado: "advocacia",
  advogada: "advocacia",
  juridico: "advocacia",
  direito: "advocacia",
  mecanica: "oficina",
  autocenter: "oficina",
  auto: "oficina",
  mecanico: "oficina",
  pet: "petshop",
  veterinaria: "petshop",
  veterinario: "petshop",
  imobiliaria: "imoveis",
  corretor: "imoveis",
  corretora: "imoveis",
  contabil: "contabilidade",
  contador: "contabilidade",
  contadora: "contabilidade",
  otica: "otica",
  oculos: "otica",
  solar: "energia_solar",
  fotovoltaica: "energia_solar",
  ti: "tecnologia",
  software: "tecnologia",
  computadores: "tecnologia",
  costureira: "costura",
  atelie: "costura",
};

export function detectNicheKey(nicheRaw?: string | null, companyNameRaw?: string | null): string {
  // 0. Prioridade máxima: se nicheRaw já for uma tag canônica ou alias conhecido, retorna direto (O(1) determinístico)
  const cleanNiche = (nicheRaw ?? "").trim().toLowerCase();
  if (cleanNiche && NICHE_PRESETS_VARIANTS[cleanNiche]) {
    return cleanNiche;
  }
  if (cleanNiche && NICHE_ALIASES[cleanNiche]) {
    return NICHE_ALIASES[cleanNiche];
  }

  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();

  // 1. Bebidas, Adegas & Distribuidoras
  if (/(?:distribuidora\s*de\s*bebidas|loja\s*de\s*bebidas|dep[oó]sito\s*de\s*bebidas|adega|emp[oó]rio\s*de\s*bebidas|bebidas|chopp|choperia|cervejaria|cerveja|conveni[eê]ncia|destilados|vinhos)/i.test(combined)) {
    return "bebidas";
  }

  // 2. Barbearia & Barber Shop
  if (/(?:barbearia|barber|barba\b|navalha|corte\s*masculino|degrad[eê]|fade\b|bigode|cabelo\s*masculino|barbaterapia)/i.test(combined)) {
    return "barbearia";
  }

  // 3. Salão de Beleza, Estética & Manicure
  if (/(?:sal[aã]o\s*de\s*beleza|est[eé]tica|manicure|pedicure|unhas?\b|nail|lash|alongamento|sobrancelha|cabelereir|cabeleireir|escova|mechas|depila[çc][aã]o|esteticista|spa\b|massagem|massoterapia|terapia\s*capilar|ozonioterapia|harmoniza|limpeza\s*de\s*pele)/i.test(combined)) {
    return "beleza";
  }

  // 4. Lojas / E-commerce
  if (/(?:loja|boutique|moda|vestu[aá]ri|roupa|cal[çc]ad|acess[oó]ri|biju|semijoia|bolsa|e-?commerce|varejo|confec[çc][aã]o|presentes|cosm[eé]tic|perfum|store|shop|vitrine)/i.test(combined)) {
    return "loja";
  }

  // 2. Delivery & Lanches rápidos
  if (/(?:delivery|lanche|burger|hamburg|pizza|pizzaria|marmitex|pastel|disk|fast\s*food|hot\s*dog|batata\s*frita)/i.test(combined)) {
    return "delivery";
  }

  // 3. Sorveteria & Açaí
  if (/(?:sorvet|gelat|a[çc]a[ií]|paleta|picol[eé]|gelateria|doceri)/i.test(combined)) {
    return "sorveteria";
  }

  // 4. Restaurantes & Gastronomia
  if (/(?:restauran|gastr|bistr[oô]|churrasc|sushi|comida|buffet|jantar|almo[çc]o|choperi|bar\b)/i.test(combined)) {
    return "restaurante";
  }

  // 5. Oficina mecânica & Auto center
  if (/(?:oficina|mec[aâ]nic|auto\s*center|detail|est[eé]tica\s*automot|troca\s*de\s*[oó]leo|funilari|pintura\s*auto|pneu|freio|suspens[aã]o|guincho|auto\s*el[eé]tric|revis[aã]o\s*veicular|martelinho)/i.test(combined)) {
    return "oficina";
  }

  // 6. Dentista & Odontologia
  if (/(?:odonto|dent|sorris|oral|dente|protese|implant|ortodont|clareament|endodont|periodont)/i.test(combined)) {
    return "odontologia";
  }

  // 7. Saúde, Medicina & Clínicas (posicionado antes de psicologia para evitar falsos positivos com fisioterapia/terapia)
  if (/(?:cl[ií]nic|m[eé]dic|sa[uú]de|doutor|dra?\b|pediatr|fisioter|fisioterapia|fisioterapeuta|laborat[oó]rio|exames|hospital|fonoaudi|terapia\s*ocupacional|oftalmo|dermatol|ginecolog|cardiolog|ortopedi|urologi|ultrassom|raio-?x)/i.test(combined)) {
    return "clinica";
  }

  // 8. Terapeutas, Psicólogos & Saúde Mental (estritamente focado em psicoterapia e saúde emocional)
  if (/(?:psic[oó]log|psicoterap|psican[aá]lis|sa[uú]de\s*mental|terapeuta\b|acolhimento\s*emocional|psiquiatr|mindfulness|\bterapia\s*(?:online|individual|de\s*casal|cognitiv|infantil|familiar|emocional)?\b|floral\s*de\s*bach|terapia\s*hol[ií]stica)/i.test(combined)) {
    return "psicologia";
  }

  // 9. Nutricionista & Dietas
  if (/(?:nutri|nutri[çc][aã]o|dieta|emagreciment|reeduca[çc][aã]o\s*alimentar|bioimped|nutr[oó]log)/i.test(combined)) {
    return "nutricao";
  }

  // 10. PetShop & Casa de Ração
  if (/(?:pet\s*shop|veterin[aá]r|\bvet\b|banho\s*e\s*tosa|\btosa\b|canil|\bgat[oa]s?\b|\bcachorr[oa]s?\b|\bra[çc][aã]o\b|\bra[çc][oõ]es\b|cl[ií]nica\s*animal|pet\s*care)/i.test(combined)) {
    return "petshop";
  }

  // 11. Advogado & Escritório Jurídico
  if (/(?:advoc|advogad|jur[ií]d|direito|lei|oab|processo|trabalhista|previdenci[aá]r)/i.test(combined)) {
    return "advocacia";
  }

  // 12. Construção Civil & Reformas
  if (/(?:constru[çc]|obra|reforma|engenhar|empreiteir|pedreir|alvenari|acabament|pintor|eletricista\s*predial)/i.test(combined)) {
    return "construcao";
  }

  // 13. Imobiliária & Corretores
  if (/(?:imobili[aá]r|corretor|im[oó]ve|creci|loca[çc][aã]o|aluguel|venda\s*de\s*im[oó]ve|lan[çc]amento\s*residencial|condom[ií]nio|apartamento)/i.test(combined)) {
    return "imobiliaria";
  }

  // 14. Seguros & Corretoras
  if (/(?:seguro|corretora\s*de\s*seguro|sinistro|ap[oó]lice|plano\s*de\s*sa[uú]de|previd[eê]ncia)/i.test(combined)) {
    return "seguros";
  }

  // 15. Costureira & Ateliê de Moda
  if (/(?:costur|atelie|ateli[eê]|alfaiat|ajuste\s*de\s*roupa|vestido\s*sob\s*medida|bainha|alta\s*costura)/i.test(combined)) {
    return "costura";
  }

  // 16. Tecnologia & Informática
  if (/(?:tecnolog|inform[aá]tic|computad|notebook|conserto\s*de\s*celular|suporte\s*ti|placa|redes|software|programador)/i.test(combined)) {
    return "tecnologia";
  }

  // 17. Fitness & Personal Trainer
  if (/(?:academ|fitness|cross|trein|personal|gym|pilates|muscula[çc][aã]o|funcional)/i.test(combined)) {
    return "fitness";
  }

  // 18. Profissional Autônomo & Serviços Gerais
  if (/(?:aut[oô]nomo|prestador|marido\s*de\s*aluguel|t[eé]cnico|manuten[çc][aã]o|reparo|encanador|eletricista)/i.test(combined)) {
    return "autonomo";
  }

  // 19. Página Pessoal & Portfólio
  if (/(?:pessoal|portf[oó]lio|portfolio|criador|influencer|palestrante|perfil\s*pessoal|autoridade\s*pessoal)/i.test(combined)) {
    return "pessoal";
  }

  return "geral";
}

/**
 * Identifica o preset para a empresa.
 */
export function getPresetForCompany(
  nicheRaw?: string | null,
  companyNameRaw?: string | null,
  variantIndex?: number
): NichePreset {
  const key = detectNicheKey(nicheRaw, companyNameRaw);
  const variants = NICHE_PRESETS_VARIANTS[key] || NICHE_PRESETS_VARIANTS.geral;

  const targetVariant =
    typeof variantIndex === "number" && variantIndex >= 0 && variantIndex < variants.length
      ? variants[variantIndex]
      : variants[0];

  const companyName = companyNameRaw?.trim() || "Sua Empresa";
  const isPersonal = key === "pessoal";

  // Se não for perfil pessoal e não houver logo customizado, gera o monograma vetorial oficial da empresa
  const avatar_url =
    isPersonal && targetVariant.avatar_url && !targetVariant.avatar_url.includes("svg")
      ? targetVariant.avatar_url
      : generateSvgAvatar(companyName, key);

  return {
    ...targetVariant,
    avatar_url,
  };
}

/**
 * Retorna a galeria de fotos curadas para o nicho.
 */
export function getGalleryForNiche(nicheKey?: string | null): { covers: CuratedPhoto[]; avatars: CuratedPhoto[] } {
  if (!nicheKey) return NICHE_GALLERIES.geral;
  const key = detectNicheKey(nicheKey, null);
  return NICHE_GALLERIES[key] || NICHE_GALLERIES.geral;
}

/**
 * Retorna as 3 variantes de modelos visuais completas configuradas para o nicho.
 */
export function getVariantsForNiche(nicheKey?: string | null): NichePreset[] {
  if (!nicheKey) return NICHE_PRESETS_VARIANTS.geral;
  const key = detectNicheKey(nicheKey, null);
  return NICHE_PRESETS_VARIANTS[key] || NICHE_PRESETS_VARIANTS.geral;
}
