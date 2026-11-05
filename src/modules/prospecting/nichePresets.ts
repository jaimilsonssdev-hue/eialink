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
  hero_architecture?: "immersive" | "asymmetric" | "split" | "centered" | "typographic";
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
// 1. GALERIAS DE FOTOS CURADAS (26 NICHOS COM 5 FOTOS HD AUTÊNTICAS CADA)
// ==========================================
export const NICHE_GALLERIES: Record<string, { covers: CuratedPhoto[]; avatars: CuratedPhoto[] }> = {
  loja: {
    covers: [
      { id: "loja-1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85", label: "Loja & Vitrine Conceito de Moda" },
      { id: "loja-2", url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=85", label: "Interior de Boutique & Araras de Roupas" },
      { id: "loja-3", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85", label: "Moda Feminina & Compras Fashion" },
      { id: "loja-4", url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=85", label: "Vitrine Boutique & Coleção Exclusiva" },
      { id: "loja-5", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=85", label: "Shopping & Tendências da Estação" },
      { id: "loja-6", url: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=85", label: "Closet & Curadoria de Roupas" },
      { id: "loja-7", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85", label: "Peças Selecionadas & Alfaiataria" },
    ],
    avatars: [
      { id: "loja-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Lojista / Diretora Criativa" },
      { id: "loja-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Consultor de Vendas & Estilo" },
    ],
  },
  delivery: {
    covers: [
      { id: "del-1", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85", label: "Burger Artesanal Suculento" },
      { id: "del-2", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=85", label: "Combo de Lanches Artesanais & Batata" },
      { id: "del-3", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85", label: "Pizza Artesanal Saindo do Forno" },
      { id: "del-4", url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=85", label: "Entrega Expressa & Embalagem Térmica" },
      { id: "del-5", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85", label: "Pizza Gourmet Fatiada" },
      { id: "del-6", url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=85", label: "Cheeseburger Gourmet na Chapa" },
      { id: "del-7", url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1200&q=85", label: "Smash Burger Duplo & Bacon Crocante" },
    ],
    avatars: [
      { id: "del-av-1", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Mestre Chapeiro / Chef" },
      { id: "del-av-2", url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80", label: "Atendimento Delivery" },
    ],
  },
  hamburgueria: {
    covers: [
      { id: "hamb-1", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=85", label: "Hamburgueria Artesanal & Batatas Crocantes" },
      { id: "hamb-2", url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=85", label: "Bancada & Cozinha de Burgers Artesanais" },
      { id: "hamb-3", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85", label: "Smash Burger Duplo Artesanal" },
      { id: "hamb-4", url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=85", label: "Cheeseburger Gourmet & Cebola Caramelizada" },
      { id: "hamb-5", url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1200&q=85", label: "Burger Duplo com Bacon & Cheddar" },
      { id: "hamb-6", url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=85", label: "Burger Grelhado no Fogo com Fritas" },
    ],
    avatars: [],
  },
  pizzaria: {
    covers: [
      { id: "piz-1", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85", label: "Pizza Artesanal Assada no Forno a Lenha" },
      { id: "piz-2", url: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=85", label: "Forneria Italiana & Ambiente de Pizzaria" },
      { id: "piz-3", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85", label: "Pizza Especial com Borda Dourada" },
      { id: "piz-4", url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85", label: "Pizza Margherita Napolitana" },
      { id: "piz-5", url: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1200&q=85", label: "Mesa de Pizzas Artesanais para Família" },
      { id: "piz-6", url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=85", label: "Pizza Pepperoni & Queijo Derretido" },
    ],
    avatars: [],
  },
  churrascaria: {
    covers: [
      { id: "chur-1", url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=85", label: "Cortes Nobres de Picanha na Brasa" },
      { id: "chur-2", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85", label: "Salão Principal da Churrascaria & Steakhouse" },
      { id: "chur-3", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85", label: "Costela & Carnes Grelhadas no Fogo" },
      { id: "chur-4", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85", label: "Buffet Gourmet & Mesa Posta" },
      { id: "chur-5", url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=85", label: "Parrilla & Bife Ancho Suculento" },
      { id: "chur-6", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85", label: "Drinks & Bebidas da Steakhouse" },
    ],
    avatars: [],
  },
  japones: {
    covers: [
      { id: "jap-1", url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=85", label: "Sushi Bar & Combinado de Salmão Fresco" },
      { id: "jap-2", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Intimista de Restaurante Oriental" },
      { id: "jap-3", url: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=85", label: "Sashimi, Niguiri & Hot Rolls" },
      { id: "jap-4", url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=85", label: "Barca Oriental Premium" },
      { id: "jap-5", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85", label: "Yakisoba & Cozinha Quente Oriental" },
      { id: "jap-6", url: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&w=1200&q=85", label: "Alta Gastronomia Japonesa & Omakase" },
    ],
    avatars: [],
  },
  cafeteria: {
    covers: [
      { id: "caf-1", url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Aconchegante de Cafeteria & Confeitaria" },
      { id: "caf-2", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85", label: "Bancada de Cafés Especiais & Barista" },
      { id: "caf-3", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85", label: "Cappuccino Italiano & Latte Art" },
      { id: "caf-4", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85", label: "Pães Artesanais & Fornada Quente" },
      { id: "caf-5", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=85", label: "Croissants Folhados & Confeitaria Fina" },
      { id: "caf-6", url: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=85", label: "Vitrine de Doces & Padaria Artesanal" },
    ],
    avatars: [],
  },
  restaurante: {
    covers: [
      { id: "rest-1", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85", label: "Salão Gastronômico Iluminado" },
      { id: "rest-2", url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Gastronômico Sofisticado & Bistrô" },
      { id: "rest-3", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85", label: "Prato Gourmet À La Carte" },
      { id: "rest-4", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85", label: "Mesa Posta & Gastronomia Autoral" },
      { id: "rest-5", url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=85", label: "Cozinha Contemporânea & Chef" },
      { id: "rest-6", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85", label: "Alta Gastronomia & Empratamento Fino" },
    ],
    avatars: [
      { id: "rest-av-1", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80", label: "Chef Executivo" },
      { id: "rest-av-2", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&q=80", label: "Sommelier / Maître" },
    ],
  },
  sorveteria: {
    covers: [
      { id: "sorv-1", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=85", label: "Vitrine de Gelatos Artesanais" },
      { id: "sorv-2", url: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?auto=format&fit=crop&w=1200&q=85", label: "Gelateria Artesanal & Taças Geladas" },
      { id: "sorv-3", url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=85", label: "Taça de Sorvete Cremoso com Calda" },
      { id: "sorv-4", url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=1200&q=85", label: "Tigela de Açaí Puro com Frutas Frescas" },
      { id: "sorv-5", url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=85", label: "Gelato Italiano na Casquinha Crocante" },
      { id: "sorv-6", url: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1200&q=85", label: "Sorvete Artesanal Colorido & Refrescante" },
    ],
    avatars: [
      { id: "sorv-av-1", url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80", label: "Emblema Gelato Italiano" },
      { id: "sorv-av-2", url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80", label: "Emblema Açaí & Sorvetes" },
    ],
  },
  bebidas: {
    covers: [
      { id: "beb-1", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85", label: "Adega de Vinhos & Rótulos Selecionados" },
      { id: "beb-2", url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85", label: "Ambiente de Adega, Choperia & Distribuidora" },
      { id: "beb-3", url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1200&q=85", label: "Chopp Artesanal & Cerveja Trincando" },
      { id: "beb-4", url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=85", label: "Destilados Premium & Coquetelaria" },
      { id: "beb-5", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85", label: "Combos de Bebidas & Conveniência" },
      { id: "beb-6", url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=1200&q=85", label: "Cervejas Especiais Geladas" },
    ],
    avatars: [
      { id: "beb-av-1", url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=400&q=80", label: "Emblema Adega & Cervejas" },
      { id: "beb-av-2", url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=400&q=80", label: "Emblema Distribuidora Express" },
    ],
  },
  barbearia: {
    covers: [
      { id: "barb-1", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Barber Club Clássico & Cadeiras" },
      { id: "barb-2", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=85", label: "Estrutura de Barbearia & Estilo Masculino" },
      { id: "barb-3", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85", label: "Corte Degradê & Bancada de Navalha" },
      { id: "barb-4", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85", label: "Barbaterapia com Toalha Quente" },
      { id: "barb-5", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85", label: "Acabamento de Barba & Navalhete" },
      { id: "barb-6", url: "https://images.unsplash.com/photo-1517832607067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=85", label: "Corte Masculino na Tesoura & Fade" },
    ],
    avatars: [
      { id: "barb-av-1", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80", label: "Emblema Barber Shop" },
      { id: "barb-av-2", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80", label: "Emblema Navalha de Ouro" },
    ],
  },
  beleza: {
    covers: [
      { id: "bel-1", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85", label: "Salão de Beleza & Bancada Iluminada" },
      { id: "bel-2", url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85", label: "Interior de Studio de Beleza & Poltronas" },
      { id: "bel-3", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=85", label: "Nail Studio & Alongamento de Unhas em Gel" },
      { id: "bel-4", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85", label: "Cabelos, Mechas & Finalização" },
      { id: "bel-5", url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=85", label: "Hair Stylist & Escova Modelada" },
      { id: "bel-6", url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=85", label: "Maquiagem Profissional & Design de Sobrancelhas" },
    ],
    avatars: [
      { id: "bel-av-1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80", label: "Emblema Studio de Beleza" },
      { id: "bel-av-2", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", label: "Emblema Hair & Nails" },
    ],
  },
  estetica_corporal: {
    covers: [
      { id: "ec-1", url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=85", label: "Clínica de Estética Corporal & Bem-Estar" },
      { id: "ec-2", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85", label: "Sala Climatizada de Procedimentos Corporais" },
      { id: "ec-3", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85", label: "Drenagem Linfática & Massoterapia Corporal" },
      { id: "ec-4", url: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=1200&q=85", label: "Massagem Modeladora & Redutora de Medidas" },
      { id: "ec-5", url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=85", label: "Protocolos Corporais & Pós-Operatório" },
      { id: "ec-6", url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85", label: "Tecnologia Estética Avançada" },
    ],
    avatars: [
      { id: "ec-av-1", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80", label: "Especialista em Estética Corporal" },
      { id: "ec-av-2", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Clínica Corporal & Saúde" },
    ],
  },
  estetica_facial: {
    covers: [
      { id: "ef-1", url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85", label: "Clínica de Estética Facial & Harmonização" },
      { id: "ef-2", url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=85", label: "Consultório de Dermatologia & Skincare" },
      { id: "ef-3", url: "https://images.unsplash.com/photo-1512290900672-1f41e05d0e2e?auto=format&fit=crop&w=1200&q=85", label: "Limpeza de Pele Profunda & Glow" },
      { id: "ef-4", url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=85", label: "Rejuvenescimento & Bioestimuladores de Colágeno" },
      { id: "ef-5", url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=85", label: "Protocolos Estéticos Faciais Personalizados" },
      { id: "ef-6", url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=85", label: "Séruns & Ativos Dermatológicos de Alta Performance" },
    ],
    avatars: [
      { id: "ef-av-1", url: "https://images.unsplash.com/photo-1594824813524-42b8e3e488fb?auto=format&fit=crop&w=400&q=80", label: "Dra. Esteta Facial" },
      { id: "ef-av-2", url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80", label: "Clínica de Harmonização Facial" },
    ],
  },
  spa: {
    covers: [
      { id: "spa-1", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Zen de Spa & Aromaterapia" },
      { id: "spa-2", url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85", label: "Refúgio de Bem-Estar, Velas & Relaxamento" },
      { id: "spa-3", url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=85", label: "Terapia com Pedras Quentes Vulcânicas" },
      { id: "spa-4", url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=85", label: "Day Spa & Rituais de Imersão" },
      { id: "spa-5", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85", label: "Massoterapia Relaxante Corporal" },
      { id: "spa-6", url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=85", label: "Óleos Essenciais & Cuidado Sensorial" },
    ],
    avatars: [
      { id: "spa-av-1", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80", label: "Terapeuta Spa & Massagem" },
      { id: "spa-av-2", url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80", label: "Emblema Spa & Equilíbrio" },
    ],
  },
  oficina: {
    covers: [
      { id: "ofic-1", url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=85", label: "Auto Center Moderno & Elevador Automotivo" },
      { id: "ofic-2", url: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1200&q=85", label: "Box de Revisão & Estrutura de Oficina Mecânica" },
      { id: "ofic-3", url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=85", label: "Mecânica de Precisão, Motor & Óleo" },
      { id: "ofic-4", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=85", label: "Pneus, Alinhamento 3D & Suspensão" },
      { id: "ofic-5", url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85", label: "Diagnóstico Eletrônico Computadorizado" },
      { id: "ofic-6", url: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1200&q=85", label: "Manutenção de Freios & Ferramentas Automotivas" },
    ],
    avatars: [
      { id: "ofic-av-1", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", label: "Mecânico Chefe Especialista" },
      { id: "ofic-av-2", url: "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=400&q=80", label: "Técnico em Injeção & Elétrica" },
    ],
  },
  clinica: {
    covers: [
      { id: "clin-1", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85", label: "Recepção Médica Hospitalar & Clínica" },
      { id: "clin-2", url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85", label: "Centro Médico & Consultório Clínico Moderno" },
      { id: "clin-3", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85", label: "Consulta Médica Especializada" },
      { id: "clin-4", url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=85", label: "Check-up Clínico & Estetoscópio" },
      { id: "clin-5", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85", label: "Teleconsulta & Prontuário Médico Digital" },
      { id: "clin-6", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85", label: "Exames & Diagnóstico de Alta Precisão" },
    ],
    avatars: [
      { id: "clin-av-1", url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80", label: "Dr. Médico Especialista" },
      { id: "clin-av-2", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Clínica" },
    ],
  },
  fisioterapia: {
    covers: [
      { id: "fis-1", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85", label: "Clínica de Fisioterapia & Reabilitação" },
      { id: "fis-2", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85", label: "Estúdio de Pilates Clínico & Movimento" },
      { id: "fis-3", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85", label: "Liberação Miofascial & Terapia Manual" },
      { id: "fis-4", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85", label: "Fisioterapia Esportiva & Biomecânica" },
      { id: "fis-5", url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=85", label: "Sala de Atendimento Fisioterapêutico" },
      { id: "fis-6", url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85", label: "Equipamentos de Reabilitação Funcional" },
    ],
    avatars: [],
  },
  psicologia: {
    covers: [
      { id: "psi-1", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=85", label: "Psicóloga Clínica & Acolhimento Terapêutico Humanizado" },
      { id: "psi-2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85", label: "Espaço Terapêutico Privativo, Iluminado e Confortável" },
      { id: "psi-3", url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=85", label: "Sessão de Psicoterapia Individual & Escuta Ética" },
      { id: "psi-4", url: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=85", label: "Terapia Online Segura por Videochamada" },
      { id: "psi-5", url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85", label: "Terapia de Casal, Relacionamentos & Diálogo Afetivo" },
      { id: "psi-6", url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=85", label: "Primeira Sessão de Acolhimento & Planejamento Terapêutico" },
      { id: "psi-7", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=85", label: "Atendimento Psicológico com Sigilo e Empatia" },
    ],
    avatars: [
      { id: "psi-av-1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", label: "Dra. Psicóloga Clínica" },
      { id: "psi-av-2", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80", label: "Dr. Terapeuta & Psicanalista" },
    ],
  },
  petshop: {
    covers: [
      { id: "pet-1", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=85", label: "Espaço Pet Care & Clínica Veterinária" },
      { id: "pet-2", url: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=1200&q=85", label: "Estrutura Pet Shop & Atendimento Carinhoso" },
      { id: "pet-3", url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=85", label: "Banho & Tosa Especializada" },
      { id: "pet-4", url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=85", label: "Rações Super Premium & Acessórios Pet" },
      { id: "pet-5", url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=85", label: "Consulta Veterinária Preventiva & Vacinas" },
      { id: "pet-6", url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=85", label: "Tosa na Tesoura & Estética Animal" },
    ],
    avatars: [
      { id: "pet-av-1", url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80", label: "Dra. Médica Veterinária" },
      { id: "pet-av-2", url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=400&q=80", label: "Groomer & Especialista Pet" },
    ],
  },
  advocacia: {
    covers: [
      { id: "adv-1", url: "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?auto=format&fit=crop&w=1200&q=85", label: "Balança da Justiça, Códigos & Direito" },
      { id: "adv-2", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85", label: "Sala de Reuniões do Escritório de Advocacia" },
      { id: "adv-3", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=85", label: "Consultoria Jurídica & Parecer Estratégico" },
      { id: "adv-4", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=85", label: "Acordos, Inventários & Proteção Patrimonial" },
      { id: "adv-5", url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=85", label: "Biblioteca Jurídica & Jurisprudência" },
      { id: "adv-6", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85", label: "Análise de Contratos & Assessoria Empresarial" },
    ],
    avatars: [
      { id: "adv-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Dr. Advogado Sênior" },
      { id: "adv-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Dra. Advogada Especialista" },
    ],
  },
  odontologia: {
    covers: [
      { id: "odo-1", url: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=85", label: "Clínica Odontológica Moderna & Cadeira Dental" },
      { id: "odo-2", url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=1200&q=85", label: "Consultório Odontológico Digital & Biossegurança" },
      { id: "odo-3", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85", label: "Avaliação Odontológica & Profilaxia" },
      { id: "odo-4", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=85", label: "Sorriso Radiante & Clareamento Dental" },
      { id: "odo-5", url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=85", label: "Implantes Dentários & Escaneamento 3D" },
      { id: "odo-6", url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1200&q=85", label: "Lentes de Contato Dental & Ortodontia" },
      { id: "odo-7", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85", label: "Atendimento Odontológico Humanizado" },
    ],
    avatars: [
      { id: "odo-av-1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Dr. Cirurgião-Dentista" },
      { id: "odo-av-2", url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=400&q=80", label: "Dra. Especialista em Estética Dental" },
    ],
  },
  construcao: {
    covers: [
      { id: "cons-1", url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=85", label: "Engenharia Civil & Canteiro de Obras" },
      { id: "cons-2", url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=85", label: "Estrutura Arquitetônica & Construção de Alto Padrão" },
      { id: "cons-3", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=85", label: "Gerenciamento & Execução de Obras" },
      { id: "cons-4", url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=85", label: "Reformas Residenciais & Acabamentos Finos" },
      { id: "cons-5", url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=85", label: "Planta Executiva & Projeto Estrutural" },
      { id: "cons-6", url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85", label: "Pintura, Iluminação & Interiores Reformados" },
    ],
    avatars: [
      { id: "cons-av-1", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80", label: "Engenheiro Civil Responsável" },
      { id: "cons-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Gestora de Obras & Reformas" },
    ],
  },
  imobiliaria: {
    covers: [
      { id: "imob-1", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85", label: "Mansão Contemporânea de Alto Padrão" },
      { id: "imob-2", url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85", label: "Living Arquitetônico & Imóveis Exclusivos" },
      { id: "imob-3", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85", label: "Casas em Condomínio Fechado" },
      { id: "imob-4", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85", label: "Apartamentos Decorados & Varanda Gourmet" },
      { id: "imob-5", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85", label: "Consultoria Imobiliária & Entrega de Chaves" },
      { id: "imob-6", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85", label: "Locação e Venda de Imóveis Selecionados" },
    ],
    avatars: [
      { id: "imob-av-1", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80", label: "Corretor de Imóveis CRECI" },
      { id: "imob-av-2", url: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=400&q=80", label: "Corretora Consultora Imobiliária" },
    ],
  },
  seguros: {
    covers: [
      { id: "seg-1", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=85", label: "Corretora de Seguros & Confiança Patrimonial" },
      { id: "seg-2", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85", label: "Atendimento Consultivo de Seguros e Planos" },
      { id: "seg-3", url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=85", label: "Seguro Automóvel Completo & Assistência 24h" },
      { id: "seg-4", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85", label: "Seguro de Vida & Proteção Familiar" },
      { id: "seg-5", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85", label: "Planos de Saúde & Consultoria de Benefícios" },
      { id: "seg-6", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85", label: "Seguro Residencial & Patrimonial" },
    ],
    avatars: [
      { id: "seg-av-1", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Corretor de Seguros Especialista" },
      { id: "seg-av-2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Consultora de Benefícios & Saúde" },
    ],
  },
  autonomo: {
    covers: [
      { id: "aut-1", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=85", label: "Serviços Técnicos de Instalação & Manutenção" },
      { id: "aut-2", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85", label: "Profissional Especialista em Reparos & Precisão" },
      { id: "aut-3", url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=85", label: "Visita Técnica & Ferramentas Profissionais" },
      { id: "aut-4", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85", label: "Manutenção Preventiva & Corretiva" },
      { id: "aut-5", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=85", label: "Atendimento com Hora Marcada & Garantia" },
      { id: "aut-6", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85", label: "Orçamento Transparente & Planejamento" },
    ],
    avatars: [
      { id: "aut-av-1", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80", label: "Especialista Técnico Autônomo" },
      { id: "aut-av-2", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", label: "Consultora de Serviços" },
    ],
  },
  pessoal: {
    covers: [
      { id: "pes-1", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=85", label: "Portfólio & Projetos Autorais" },
      { id: "pes-2", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85", label: "Palestras, Workshops & Presença Executiva" },
      { id: "pes-3", url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85", label: "Mentoria Individual 1:1 & Estratégia" },
      { id: "pes-4", url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85", label: "Networking, Eventos & Treinamentos" },
      { id: "pes-5", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85", label: "Comunidade Digital, Cursos & Materiais" },
      { id: "pes-6", url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85", label: "Consultoria Executiva & Liderança" },
    ],
    avatars: [
      { id: "pes-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Criador(a) de Conteúdo" },
      { id: "pes-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Palestrante & Consultor" },
    ],
  },
  fitness: {
    covers: [
      { id: "fit-1", url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85", label: "Academia Completa & Aparelhos de Musculação" },
      { id: "fit-2", url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=85", label: "Espaço de Treinamento & Studio Fitness Climatizado" },
      { id: "fit-3", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85", label: "Musculação & Halteres de Alta Performance" },
      { id: "fit-4", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85", label: "Personal Trainer & Treino Funcional" },
      { id: "fit-5", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85", label: "Treino de Força & Condicionamento" },
      { id: "fit-6", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85", label: "Avaliação Física & Performance Esportiva" },
    ],
    avatars: [
      { id: "fit-av-1", url: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80", label: "Personal Trainer Certificado" },
      { id: "fit-av-2", url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", label: "Coach de Treinamento Feminino" },
    ],
  },
  nutricao: {
    covers: [
      { id: "nut-1", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85", label: "Gastronomia Funcional, Saladas & Nutrição Viva" },
      { id: "nut-2", url: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=85", label: "Alimentos Naturais, Longevidade & Equilíbrio" },
      { id: "nut-3", url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85", label: "Consulta Nutricional & Plano Alimentar" },
      { id: "nut-4", url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85", label: "Reeducação Alimentar & Emagrecimento Saudável" },
      { id: "nut-5", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85", label: "Cardápio Inteligente & Ingredientes Frescos" },
      { id: "nut-6", url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=85", label: "Nutrição Esportiva & Hipertrofia" },
    ],
    avatars: [
      { id: "nut-av-1", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", label: "Dra. Nutricionista Clínica" },
      { id: "nut-av-2", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80", label: "Nutricionista Esportivo" },
    ],
  },
  costura: {
    covers: [
      { id: "cos-1", url: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=1200&q=85", label: "Ateliê de Alta Costura, Tecidos & Modelagem" },
      { id: "cos-2", url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85", label: "Arara de Peças Sob Medida & Alfaiataria" },
      { id: "cos-3", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=85", label: "Máquina de Costura, Ajustes & Reformas" },
      { id: "cos-4", url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1200&q=85", label: "Barras Originais, Jeans & Acabamento Fino" },
      { id: "cos-5", url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85", label: "Confecção de Vestidos Sob Medida" },
      { id: "cos-6", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85", label: "Ajuste Fino de Terno & Alfaiataria" },
    ],
    avatars: [
      { id: "cos-av-1", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", label: "Estilista & Mestre de Alta Costura" },
      { id: "cos-av-2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Costureira Especialista em Reformas" },
    ],
  },
  tecnologia: {
    covers: [
      { id: "tec-1", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=85", label: "Laboratório de Tecnologia, TI & Segurança Digital" },
      { id: "tec-2", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=85", label: "Workstation de Suporte Técnico & Sistemas" },
      { id: "tec-3", url: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=85", label: "Formatação, Notebooks & Computadores" },
      { id: "tec-4", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85", label: "Upgrade de SSD, Placa-Mãe & Hardware" },
      { id: "tec-5", url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85", label: "Manutenção Especializada em Bancada Técnica" },
      { id: "tec-6", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85", label: "Redes Wi-Fi Corporativas & Servidores" },
    ],
    avatars: [
      { id: "tec-av-1", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80", label: "Técnico Especialista em Hardware" },
      { id: "tec-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Consultor de TI & Infraestrutura" },
    ],
  },
  marketing: {
    covers: [
      { id: "mkt-1", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85", label: "Agência de Marketing Digital & Estratégia" },
      { id: "mkt-2", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85", label: "Equipe Criativa de Performance & Growth" },
      { id: "mkt-3", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85", label: "Gestão de Tráfego Pago & Analytics" },
      { id: "mkt-4", url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85", label: "Criação de Landing Pages de Alta Conversão" },
      { id: "mkt-5", url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=85", label: "Branding & Gestão de Redes Sociais" },
      { id: "mkt-6", url: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=85", label: "Consultoria de Escala & Funis de Vendas" },
    ],
    avatars: [
      { id: "mkt-av-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", label: "Estrategista de Marketing Digital" },
      { id: "mkt-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Gestor de Tráfego Pago & Growth" },
    ],
  },
  contabilidade: {
    covers: [
      { id: "cnt-1", url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=85", label: "Auditoria Contábil & Inteligência Financeira" },
      { id: "cnt-2", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85", label: "Sede Executiva do Escritório de Contabilidade" },
      { id: "cnt-3", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85", label: "Abertura de Empresas & Balanço Patrimonial" },
      { id: "cnt-4", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85", label: "Assessoria Contábil e Fiscal Mensal" },
      { id: "cnt-5", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85", label: "Planejamento Tributário & BPO Financeiro" },
      { id: "cnt-6", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85", label: "Consultoria Empresarial & Societária" },
    ],
    avatars: [
      { id: "cnt-av-1", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", label: "Contadora Consultiva" },
      { id: "cnt-av-2", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", label: "Perito Contábil & Tributário" },
    ],
  },
  energia_solar: {
    covers: [
      { id: "sol-1", url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=85", label: "Módulos Fotovoltaicos & Captação de Energia Solar" },
      { id: "sol-2", url: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=1200&q=85", label: "Engenharia Solar & Instalação Fotovoltaica" },
      { id: "sol-3", url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=85", label: "Painéis Solares Residenciais de Alta Eficiência" },
      { id: "sol-4", url: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=85", label: "Usinas Solares Comerciais & Rurais" },
      { id: "sol-5", url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=85", label: "Homologação & Projeto de Engenharia Solar" },
      { id: "sol-6", url: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=85", label: "Telhado Solar Residencial & Economia na Conta" },
    ],
    avatars: [
      { id: "sol-av-1", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&q=80", label: "Engenheiro de Energia Solar" },
      { id: "sol-av-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", label: "Consultor de Projetos Solares" },
    ],
  },
  geral: {
    covers: [
      { id: "ger-1", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85", label: "Fachada Comercial & Recepção" },
      { id: "ger-2", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=85", label: "Espaço Executivo & Atendimento" },
      { id: "ger-3", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85", label: "Equipe em Atendimento" },
      { id: "ger-4", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85", label: "Sede Corporativa" },
      { id: "ger-5", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85", label: "Sede Executiva & Sala de Reunião" },
      { id: "ger-6", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85", label: "Ambiente Profissional Moderno" },
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
  if (key === "estetica_corporal") {
    return {
      label: idx === 0 ? "Agendar Avaliação Corporal" : idx === 1 ? "Ver Tratamentos Corporais" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Vi a clínica ${name} e gostaria de agendar uma avaliação para tratamentos corporais.`,
    };
  }
  if (key === "estetica_facial") {
    return {
      label: idx === 0 ? "Agendar Procedimento Facial" : idx === 1 ? "Ver Protocolos Faciais" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Vi a ${name} e gostaria de agendar uma avaliação estética facial.`,
    };
  }
  if (key === "spa") {
    return {
      label: idx === 0 ? "Reservar Sessão no Spa" : idx === 1 ? "Ver Rituais & Massagens" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Vi o ${name} e gostaria de reservar uma experiência de spa e relaxamento.`,
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
  if (key === "marketing") {
    return {
      label: idx === 0 ? "Falar com Especialista em Tráfego" : idx === 1 ? "Solicitar Proposta Digital" : "Chamar no WhatsApp",
      message: (name: string) => `Olá! Vi o perfil da ${name} e gostaria de acelerar o marketing e as vendas do meu negócio.`,
    };
  }
  if (key === "contabilidade") {
    return {
      label: idx === 0 ? "Falar com um Contador" : idx === 1 ? "Abrir Empresa ou Migrar" : "Solicitar Proposta Contábil",
      message: (name: string) => `Olá! Vi o escritório contábil ${name} e gostaria de consultoria contábil/fiscal.`,
    };
  }
  if (key === "energia_solar") {
    return {
      label: idx === 0 ? "Simular Economia Solar" : idx === 1 ? "Solicitar Orçamento Fotovoltaico" : "Falar no WhatsApp",
      message: (name: string) => `Olá! Gostaria de simular a economia de energia solar para meu imóvel com a ${name}.`,
    };
  }
  return {
    label: idx === 0 ? "Solicitar Orçamento no WhatsApp" : idx === 1 ? "Falar com Especialista" : "Chamar no WhatsApp",
    message: (name: string) => `Olá! Vi o site da ${name} e gostaria de solicitar um orçamento sem compromisso.`,
  };
}
/**
 * Retorna a arquitetura de hero assinada para o nicho específico.
 */
export function getSignatureHeroArchitectureForNiche(
  nicheKey: string,
  variantIndex = 0
): "immersive" | "asymmetric" | "split" | "centered" | "typographic" {
  if (variantIndex === 1) {
    return "immersive"; // Modelo VIP / Spotlight sempre tem experiência imersiva
  }

  switch (nicheKey) {
    case "clinica":
    case "odontologia":
    case "psicologia":
    case "nutricao":
      return "immersive";

    case "fitness":
    case "beleza":
    case "estetica_corporal":
    case "estetica_facial":
    case "spa":
    case "barbearia":
    case "oficina":
      return "asymmetric";

    case "loja":
    case "delivery":
    case "restaurante":
    case "sorveteria":
    case "bebidas":
      return "centered";

    case "advocacia":
    case "contabilidade":
    case "seguros":
    case "tecnologia":
      return "typographic";

    case "imobiliaria":
    case "construcao":
    case "petshop":
    case "energia_solar":
    case "autonomo":
    case "costura":
    case "marketing":
    case "pessoal":
    default:
      return "split";
  }
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
      hero_architecture: getSignatureHeroArchitectureForNiche(key, idx),
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
    ["Studio Beauty Glam & Nails", "Salão de Beleza & Cabelos VIP", "Dark Showcase Nails & Estilo"],
    [
      (name, city) => `Realce sua beleza natural com procedimentos exclusivos e unhas perfeitas em ${city}`,
      (name, city) => `Design de sobrancelhas, corte, mechas e cuidados capilares na ${name}`,
      (name, city) => `Seu momento de autocuidado com conforto e excelência na ${name}`,
    ],
    [
      (name, city) => `No ${name} você conta com manicure e pedicure em gel, lash lifting, design de sobrancelhas e tratamentos capilares de alto padrão em ${city}. Agende seu horário pelo WhatsApp.`,
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
        { name: "Manicure & Alongamento em Gel", category: "Nails", description: "Alongamento com fibra ou gel moldado, cuticulagem russa e esmaltação duradoura.", price: 120.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
        { name: "Escova Modelada & Hidratação Profunda", category: "Cabelos", description: "Nutrição intensiva com reposição de massa capilar e escovação impecável.", price: 90.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Mechas Iluminadas & Cronograma Capilar", category: "Cabelos", description: "Clareamento saudável com proteção dos fios e reconstrução profunda imediata.", price: 220.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
        { name: "Manicure & Alongamento em Gel", category: "Nails", description: "Alongamento com fibra ou gel moldado, cuticulagem russa e esmaltação duradoura.", price: 120.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  estetica_corporal: buildNicheVariants(
    "estetica_corporal",
    ["cinematic-glass", "impact-showcase", "beauty-glam"],
    ["emerald", "midnight", "aurora"],
    ["Clínica Corporal & Drenagem", "Estética Avançada VIP", "Massoterapia & Bem-Estar"],
    [
      (name, city) => `Tratamentos corporais de alta performance e bem-estar na ${name} em ${city}.`,
      (name, city) => `Drenagem linfática pós-operatório e protocolos corporais avançados na ${name}`,
      (name, city) => `Redução de medidas, saúde corporal e bem-estar exclusivo na ${name} em ${city}`,
    ],
    [
      (name, city) => `Na ${name} você conta com drenagem linfática especializada, pós-operatório e protocolos corporais de alta tecnologia em ${city}. Agende sua avaliação personalizada pelo WhatsApp.`,
      (name, city) => `Tecnologia estética de ponta, criolipólise e massoterapia para esculpir seu corpo e renovar sua saúde na ${name}.`,
      (name, city) => `Ambiente acolhedor, protocolos corporais integrados e atendimento de excelência na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Drenagem Linfática & Pós-Operatório", category: "Corporal", description: "Eliminação de toxinas, redução de edemas e aceleração da recuperação pós-cirúrgica.", price: 150.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=400&q=80" },
        { name: "Massagem Modeladora & Redutora", category: "Corporal", description: "Manobras firmes para redução de medidas, combate à celulite e melhora da circulação.", price: 140.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=400&q=80" },
        { name: "Tratamentos Corporais Avançados", category: "Tecnologia", description: "Protocolos personalizados com criolipólise, radiofrequência e bioestimulação corporal.", price: 250.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Protocolo Detox & Firmeza Corporal", category: "Remodelação", description: "Associação de ativos termogênicos, manta térmica e massoterapia para contorno corporal.", price: 190.0, duration_minutes: 70, image_url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80" },
        { name: "Tratamentos Corporais Avançados", category: "Tecnologia", description: "Protocolos personalizados com criolipólise, radiofrequência e bioestimulação corporal.", price: 250.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Massagem Modeladora & Redutora", category: "Corporal", description: "Manobras firmes para redução de medidas, combate à celulite e melhora da circulação.", price: 140.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=400&q=80" },
        { name: "Drenagem Linfática & Pós-Operatório", category: "Corporal", description: "Eliminação de toxinas, redução de edemas e aceleração da recuperação pós-cirúrgica.", price: 150.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=400&q=80" },
        { name: "Tratamentos Corporais Avançados", category: "Tecnologia", description: "Protocolos personalizados com criolipólise, radiofrequência e bioestimulação corporal.", price: 250.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  estetica_facial: buildNicheVariants(
    "estetica_facial",
    ["cinematic-glass", "beauty-glam", "impact-showcase"],
    ["aurora", "sunset", "midnight"],
    ["Estética Facial & Glow", "Harmonização Facial VIP", "Protocolos de Rejuvenescimento"],
    [
      (name, city) => `Rejuvenescimento, harmonia e cuidados faciais personalizados na ${name}.`,
      (name, city) => `Harmonização facial e protocolos estéticos de alta precisão na ${name}`,
      (name, city) => `Pele radiante, rejuvenescimento e autoestima renovada em ${city}`,
    ],
    [
      (name, city) => `Na ${name} você encontra procedimentos faciais modernos, limpeza de pele profunda e harmonização personalizada em ${city}. Agende seu horário pelo WhatsApp.`,
      (name, city) => `Realce a beleza e harmonia do seu rosto com técnicas seguras, bioestimuladores e atendimento de alto padrão na ${name}.`,
      (name, city) => `Cosmetologia avançada, cuidados faciais individualizados e resultados naturais na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Limpeza de Pele Profunda & Glow", category: "Facial", description: "Remoção de impurezas, peeling ultrassônico e hidratação profunda regeneradora.", price: 150.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1512290900672-1f41e05d0e2e?auto=format&fit=crop&w=400&q=80" },
        { name: "Protocolos de Rejuvenescimento Facial", category: "Facial", description: "Estímulo de colágeno, prevenção do envelhecimento e revitalização celular da pele.", price: 220.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=400&q=80" },
        { name: "Harmonização & Estética Facial", category: "Avançada", description: "Procedimentos minimamente invasivos para equilíbrio estético e contorno facial harmônico.", price: 350.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Peeling Revitalizante & Hidratação", category: "Renovação", description: "Renovação celular uniforme para clareamento de manchas, textura de seda e viço imediato.", price: 190.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=400&q=80" },
        { name: "Harmonização & Estética Facial", category: "Avançada", description: "Procedimentos minimamente invasivos para equilíbrio estético e contorno facial harmônico.", price: 350.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Protocolos de Rejuvenescimento Facial", category: "Facial", description: "Estímulo de colágeno, prevenção do envelhecimento e revitalização celular da pele.", price: 220.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=400&q=80" },
        { name: "Limpeza de Pele Profunda & Glow", category: "Facial", description: "Remoção de impurezas, peeling ultrassônico e hidratação profunda regeneradora.", price: 150.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1512290900672-1f41e05d0e2e?auto=format&fit=crop&w=400&q=80" },
        { name: "Harmonização & Estética Facial", category: "Avançada", description: "Procedimentos minimamente invasivos para equilíbrio estético e contorno facial harmônico.", price: 350.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  spa: buildNicheVariants(
    "spa",
    ["cinematic-glass", "beauty-glam", "impact-showcase"],
    ["emerald", "ocean", "midnight"],
    ["Spa & Bem-Estar Terapêutico", "Day Spa & Rituais Exclusivos", "Massagens & Aromaterapia VIP"],
    [
      (name, city) => `Seu refúgio de relaxamento e equilíbrio corporal na ${name}.`,
      (name, city) => `Rituais de bem-estar, terapias manuais e alívio do estresse na ${name}`,
      (name, city) => `Desconecte-se da rotina e renove suas energias em ${city}`,
    ],
    [
      (name, city) => `No ${name} você encontra uma experiência completa de relaxamento, massagens terapêuticas e rituais de bem-estar em ${city}. Reserve seu momento pelo WhatsApp.`,
      (name, city) => `Aromaterapia, pedras quentes e day spa personalizado para revigorar corpo e mente na ${name}.`,
      (name, city) => `Ambiente relaxante com som ambiente, óleos nobres e terapeutas dedicados na ${name} em ${city}.`,
    ],
    [
      [
        { name: "Massagem Relaxante com Aromaterapia", category: "Relaxamento", description: "Óleos essenciais selecionados e toques suaves para alívio imediato do estresse.", price: 160.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80" },
        { name: "Day Spa & Revitalização", category: "Experiência", description: "Pacote completo com esfoliação corporal, banho de imersão e massagem revigorante.", price: 320.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80" },
        { name: "Terapia de Pedras Quentes", category: "Terapia", description: "Termoterapia com pedras vulcânicas para relaxamento muscular profundo e equilíbrio energético.", price: 180.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Ritual Zen & Escalda-Pés Botânico", category: "Ritual", description: "Imersão relaxante com sais minerais, ervas aromáticas e reflexologia podal.", price: 140.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80" },
        { name: "Terapia de Pedras Quentes", category: "Terapia", description: "Termoterapia com pedras vulcânicas para relaxamento muscular profundo e equilíbrio energético.", price: 180.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Day Spa & Revitalização", category: "Experiência", description: "Pacote completo com esfoliação corporal, banho de imersão e massagem revigorante.", price: 320.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80" },
        { name: "Massagem Relaxante com Aromaterapia", category: "Relaxamento", description: "Óleos essenciais selecionados e toques suaves para alívio imediato do estresse.", price: 160.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80" },
        { name: "Terapia de Pedras Quentes", category: "Terapia", description: "Termoterapia com pedras vulcânicas para relaxamento muscular profundo e equilíbrio energético.", price: 180.0, duration_minutes: 75, image_url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  oficina: buildNicheVariants(
    "oficina",
    ["impact-showcase", "spotlight-neon", "business-modern"],
    ["midnight", "amber", "ocean"],
    ["Modelo VIP", "Auto Center & Diagnóstico 3D", "Mecânica Rápida & Revisão"],
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
        { name: "Sessão de Psicoterapia Individual", category: "Atendimento", description: "Atendimento individual humanizado de 50 minutos com sigilo ético absoluto e escuta qualificada.", price: 160.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=85" },
        { name: "Terapia Online para Ansiedade", category: "Online", description: "Sessão remota segura por videochamada com técnicas práticas de manejo do estresse e ansiedade.", price: 150.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=85" },
        { name: "Terapia de Casal & Relações", category: "Relacionamentos", description: "Espaço mediado para fortalecer o diálogo afetivo, resolver conflitos e reconstruir a harmonia.", price: 240.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85" },
      ],
      [
        { name: "Primeira Sessão de Acolhimento", category: "Inicial", description: "Conversa inicial estruturada para compreender suas demandas e traçar objetivos terapêuticos.", price: 140.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=85" },
      ],
      [
        { name: "Pacote Mensal de Terapia (4 Sessões)", category: "Planos", description: "Acompanhamento contínuo semanal com horário fixo reservado e foco em evolução consistente.", price: 560.0, duration_minutes: 50, image_url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=85" },
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
        { name: "Planejamento Sucessório & Inventário", category: "Família", description: "Resolução ágil de inventários, partilhas e proteção de bens com total discrição.", price: 950.0, duration_minutes: 90, image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
        { name: "Defesa Trabalhista & Contratos", category: "Trabalhista", description: "Ações judiciais, cálculos trabalhistas e elaboração de contratos blindados.", price: 450.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Assessoria Preventiva Mensal", category: "Empresarial", description: "Suporte jurídico contínuo para redução de riscos e conformidade legal.", price: 1200.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" },
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
        { name: "Seguro Residencial com Serviços Emergenciais", category: "Residencial", description: "Proteção contra incêndio e danos elétricos com eletricista e encanador inclusos.", price: 45.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Seguro Empresarial & Patrimonial", category: "Empresas", description: "Cobertura sob medida para maquinário, estoque e responsabilidade civil do seu negócio.", price: 220.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" },
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
        { name: "Ajuste Fino de Terno / Paletó", category: "Alfaiataria", description: "Alinhamento de ombros e mangas para um visual elegante e corporativo.", price: 95.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80" },
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
        { name: "Troca de Tela & Bateria de Celular", category: "Mobile", description: "Peça de qualidade original trocada em poucas horas com garantia comprovada.", price: 190.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Configuração de Rede Wi-Fi & Servidores", category: "Redes", description: "Sinal estável em todos os cômodos e segurança contra acessos indevidos.", price: 280.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Montagem de PC Gamer / Profissional", category: "Montagem", description: "Cable management impecável, escolha correta de peças e testes de estabilidade.", price: 200.0, duration_minutes: 120, image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  marketing: buildNicheVariants(
    "marketing",
    ["cinematic-glass", "impact-showcase", "business-modern"],
    ["midnight", "ocean", "aurora"],
    ["Agência Digital & Performance", "Modelo VIP", "Consultoria & Tráfego Pago"],
    [
      (name, city) => `Acelere as vendas e o posicionamento da sua empresa em ${city}`,
      (name, city) => `Tráfego pago, funis de conversão e branding de alto impacto com a ${name}`,
      (name, city) => `Mais leads qualificados e receita previsível para o seu negócio`,
    ],
    [
      (name, city) => `A ${name} desenvolve estratégias completas de tráfego pago, páginas de alta conversão e presença digital para empresas em ${city}.`,
      (name, city) => `Design estratégico, campanhas no Meta/Google Ads e atendimento focado em ROI na ${name}.`,
      (name, city) => `Consultoria sob medida e execução de campanhas digitais de alta performance com a ${name} em ${city}.`,
    ],
    [
      [
        { name: "Gestão de Tráfego Pago (Meta & Google)", category: "Tráfego", description: "Campanhas otimizadas com foco em gerar mensagens e vendas diárias no WhatsApp.", price: 1200.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
        { name: "Criação de Páginas de Alta Conversão", category: "Web Design", description: "Landing pages e biolinks rápidos, responsivos e prontos para converter visitantes em clientes.", price: 890.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80" },
        { name: "Gestão de Redes Sociais & Branding", category: "Social Media", description: "Planejamento editorial, identidade visual e posicionamento de autoridade no Instagram.", price: 950.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Consultoria Estratégica de Crescimento", category: "Consultoria", description: "Diagnóstico comercial e plano de ação em 30 dias para escalar faturamento.", price: 1500.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=400&q=80" },
        { name: "Configuração de Automações & CRM", category: "Automação", description: "Disparos automáticos, triagem inteligente de leads e integração com WhatsApp.", price: 650.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
        { name: "Assessoria Completa de Vendas Online", category: "Assessoria", description: "Acompanhamento semanal de métricas de conversão e custo por aquisição (CPA).", price: 2200.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Setup Inicial de Anúncios Online", category: "Tráfego", description: "Instalação de Pixel, validação de domínio e estruturação de públicos compradores.", price: 500.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80" },
        { name: "Otimização de Perfil & Bio Profissional", category: "Branding", description: "Reestruturação estratégica de bio, destaques e link na bio para vendas.", price: 350.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=80" },
        { name: "Produção de Criativos de Alta Conversão", category: "Criativos", description: "Copywriting e design de anúncios estáticos e em carrossel para campanhas.", price: 450.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  contabilidade: buildNicheVariants(
    "contabilidade",
    ["business-modern", "impact-showcase", "spotlight-neon"],
    ["midnight", "ocean", "amber"],
    ["Escritório Contábil & Gestão Fiscal", "Modelo VIP", "BPO Financeiro & Planejamento"],
    [
      (name, city) => `Assessoria contábil moderna, segura e sem burocracia em ${city}`,
      (name, city) => `Economia tributária, conformidade fiscal e crescimento seguro para sua empresa`,
      (name, city) => `Abra ou migre sua empresa com especialistas dedicados ao seu sucesso`,
    ],
    [
      (name, city) => `A ${name} cuida da gestão contábil, fiscal e trabalhista da sua empresa com tecnologia ágil e atendimento humano em ${city}.`,
      (name, city) => `Segurança fiscal absoluta e planejamento tributário inteligente com a equipe da ${name}.`,
      (name, city) => `Concentre-se em vender enquanto a ${name} descomplica suas obrigações fiscais e financeiras em ${city}.`,
    ],
    [
      [
        { name: "Abertura & Regularização de Empresas", category: "Legalização", description: "Processo 100% digital, rápido e sem complicações para você começar a faturar.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
        { name: "Assessoria Contábil & Fiscal Mensal", category: "Contábil", description: "Emissão de guias, balancetes, folha de pagamento e apuração com precisão.", price: 299.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
        { name: "Planejamento Tributário para Redução de Impostos", category: "Tributário", description: "Enquadramento no melhor regime para economizar impostos de forma 100% legal.", price: 600.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "BPO Financeiro & Gestão de Contas", category: "Financeiro", description: "Terceirização de contas a pagar, receber, conciliação e relatórios de fluxo de caixa.", price: 850.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
        { name: "Migração de MEI para ME", category: "Transição", description: "Assessoria para empresas em expansão que ultrapassaram o teto do MEI.", price: 350.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
        { name: "Declaração de Imposto de Renda (IRPF)", category: "Pessoa Física", description: "Declaração segura, restituição otimizada e blindagem contra malha fina.", price: 180.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Consultoria Contábil para Prestadores de Serviço", category: "Consultoria", description: "Solução sob medida para médicos, advogados, profissionais de TI e consultores.", price: 320.0, duration_minutes: 30, image_url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80" },
        { name: "Certidões Negativas & Conformidade Legal", category: "Conformidade", description: "Monitoramento e emissão de certidões da Receita Federal, FGTS e Prefeitura.", price: 120.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
        { name: "Recuperação de Créditos Tributários", category: "Recuperação", description: "Auditoria fiscal para reaver tributos pagos a mais nos últimos 5 anos.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  energia_solar: buildNicheVariants(
    "energia_solar",
    ["business-modern", "impact-showcase", "spotlight-neon"],
    ["amber", "ocean", "forest"],
    ["Engenharia Solar & Projetos Fotovoltaicos", "Modelo VIP", "Economia Sustentável na Conta de Luz"],
    [
      (name, city) => `Economize até 95% na sua conta de energia em ${city}`,
      (name, city) => `Engenharia de precisão e usinas solares com garantia de 25 anos na ${name}`,
      (name, city) => `Sua própria fonte de energia limpa, valorização do imóvel e retorno garantido`,
    ],
    [
      (name, city) => `A ${name} projeta, homologa e instala sistemas solares de alto rendimento para residências, comércios e indústrias em ${city}.`,
      (name, city) => `Tecnologia fotovoltaica de ponta com monitoramento no celular e homologação completa pela ${name}.`,
      (name, city) => `Livre-se dos aumentos constantes na conta de luz com a energia solar da ${name} em ${city}.`,
    ],
    [
      [
        { name: "Instalação Solar Residencial Completa", category: "Residencial", description: "Projeto sob medida, painéis de alta eficiência e redução imediata na fatura.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80" },
        { name: "Usinas Solares Comerciais & Rurais", category: "Empresarial", description: "Diminua os custos operacionais da sua empresa ou fazenda com energia sustentável.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=400&q=80" },
        { name: "Homologação & Projeto de Engenharia", category: "Engenharia", description: "Aprovação rápida junto à concessionária de energia local sem burocracia.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Limpeza & Manutenção de Painéis Solares", category: "Manutenção", description: "Higienização técnica para restaurar a eficiência máxima de captação solar.", price: 250.0, duration_minutes: 60, image_url: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=400&q=80" },
        { name: "Simulação de Economia Gratuita", category: "Simulação", description: "Cálculo detalhado de geração mensal, tempo de retorno (payback) e economia prevista.", price: 0.0, duration_minutes: 15, image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80" },
        { name: "Instalação de Inversores com Monitoramento Wi-Fi", category: "Equipamentos", description: "Acompanhe a geração de energia em tempo real pelo aplicativo no seu celular.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=400&q=80" },
      ],
      [
        { name: "Consultoria para Financiamento Solar", category: "Financiamento", description: "Parcelamento com economia onde a parcela é paga com o valor que você economiza.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80" },
        { name: "Ampliação de Sistema Solar Existente", category: "Ampliação", description: "Adição de módulos para suprir novo consumo (ar-condicionado, piscina, etc.).", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=400&q=80" },
        { name: "Seguro & Monitoramento de Usinas", category: "Segurança", description: "Proteção contra descargas elétricas, vendavais e roubo de componentes.", price: 0.0, duration_minutes: 0, image_url: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),

  geral: buildNicheVariants(
    "geral",
    ["business-modern", "impact-showcase", "ai-chat-agent"],
    ["aurora", "ocean", "forest"],
    ["Empresa de Autoridade & Negócios", "Modelo VIP", "Atendente Virtual"],
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
      [
        { name: "Consultoria & Acompanhamento Dedicado", category: "Consultoria", description: "Atendimento próximo com equipe preparada para entregar resultados superiores.", price: 180.0, duration_minutes: 45, image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      ],
    ]
  ),
};

// ==========================================
// 4. MAPEAMENTO DE COMPATIBILIDADE (PRESETS)
// ==========================================
export const PRESETS: Record<string, NichePreset> = {
  marketing: NICHE_PRESETS_VARIANTS.marketing[0],
  contabilidade: NICHE_PRESETS_VARIANTS.contabilidade[0],
  energia_solar: NICHE_PRESETS_VARIANTS.energia_solar[0],
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
  estetica_corporal: NICHE_PRESETS_VARIANTS.estetica_corporal[0],
  estetica_facial: NICHE_PRESETS_VARIANTS.estetica_facial[0],
  spa: NICHE_PRESETS_VARIANTS.spa[0],
  // Mapeamentos complementares para sinônimos e links legados:
  adega: NICHE_PRESETS_VARIANTS.bebidas[0],
  distribuidora: NICHE_PRESETS_VARIANTS.bebidas[0],
  estetica: NICHE_PRESETS_VARIANTS.estetica_corporal[0],
  drenagem: NICHE_PRESETS_VARIANTS.estetica_corporal[0],
  criolipolise: NICHE_PRESETS_VARIANTS.estetica_corporal[0],
  harmonizacao: NICHE_PRESETS_VARIANTS.estetica_facial[0],
  facial: NICHE_PRESETS_VARIANTS.estetica_facial[0],
  massagem: NICHE_PRESETS_VARIANTS.spa[0],
  salao: NICHE_PRESETS_VARIANTS.beleza[0],
  manicure: NICHE_PRESETS_VARIANTS.beleza[0],
  academia: NICHE_PRESETS_VARIANTS.fitness[0],
  arquitetura: NICHE_PRESETS_VARIANTS.construcao[0],
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
  { key: "marketing", label: "Marketing Digital & Tráfego", icon: "📢", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
  { key: "barbearia", label: "Barbearia", icon: "💈", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { key: "beleza", label: "Salão & Manicure", icon: "✨", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30" },
  { key: "estetica_corporal", label: "Estética Corporal & Avançada", icon: "💎", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30" },
  { key: "estetica_facial", label: "Estética Facial & Harmonização", icon: "🌸", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  { key: "spa", label: "Spa & Bem-Estar", icon: "🌿", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
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
  { key: "contabilidade", label: "Contabilidade & Finanças", icon: "🧮", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
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
  marketing: "marketing",
  mkt: "marketing",
  trafego: "marketing",
  socialmedia: "marketing",
  agencia: "marketing",
  copywriting: "marketing",
  anuncios: "marketing",
  barber: "barbearia",
  barbershop: "barbearia",
  barbeiro: "barbearia",
  salao: "beleza",
  estetica: "estetica_corporal",
  estetica_corporal: "estetica_corporal",
  drenagem: "estetica_corporal",
  criolipolise: "estetica_corporal",
  corporal: "estetica_corporal",
  massoterapia: "estetica_corporal",
  estetica_facial: "estetica_facial",
  harmonizacao: "estetica_facial",
  facial: "estetica_facial",
  spa: "spa",
  massagem: "spa",
  shiatsu: "spa",
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
  terapeuta: "psicologia",
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
  imobiliaria: "imobiliaria",
  imoveis: "imobiliaria",
  corretor: "imobiliaria",
  corretora: "imobiliaria",
  contabil: "contabilidade",
  contador: "contabilidade",
  contadora: "contabilidade",
  contabilidade: "contabilidade",
  fiscal: "contabilidade",
  tributario: "contabilidade",
  otica: "otica",
  oculos: "otica",
  solar: "energia_solar",
  fotovoltaica: "energia_solar",
  energia: "energia_solar",
  energia_solar: "energia_solar",
  ti: "tecnologia",
  software: "tecnologia",
  computadores: "tecnologia",
  costureira: "costura",
  atelie: "costura",
};

export function detectNicheKey(nicheRaw?: string | null, companyNameRaw?: string | null): string {
  // 0. Prioridade máxima: se nicheRaw já for uma tag canônica ou alias conhecido (exceto fallbacks genéricos), retorna direto
  const cleanNiche = (nicheRaw ?? "").trim().toLowerCase();
  const isGenericTag = !cleanNiche || cleanNiche === "geral" || cleanNiche === "outros" || cleanNiche === "default" || cleanNiche === "outro";
  if (!isGenericTag && NICHE_PRESETS_VARIANTS[cleanNiche]) {
    return cleanNiche;
  }
  if (!isGenericTag && NICHE_ALIASES[cleanNiche]) {
    return NICHE_ALIASES[cleanNiche];
  }

  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();

  // 1. Marketing Digital, Tráfego Pago & Social Media
  if (/(?:marketing|tr[aá]fego|social\s*media|an[uú]ncios|gest[aã]o\s*de\s*tr[aá]fego|copywriting|ag[eê]ncia\s*(?:digital|de\s*marketing|web)?|m[ií]dia\s*social|google\s*ads|meta\s*ads|branding)/i.test(combined)) {
    return "marketing";
  }

  // 2. Contabilidade, Finanças & BPO
  if (/(?:contab|contador|contadora|escrit[oó]rio\s*cont[aá]bil|fiscal|tribut[aá]r|abertura\s*de\s*empresa|bpo\s*financeiro|irpf|balan[çc]o)/i.test(combined)) {
    return "contabilidade";
  }

  // 3. Energia Solar & Projetos Fotovoltaicos
  if (/(?:energia\s*solar|fotovoltaic|placa\s*solar|painel\s*solar|usina\s*solar|inversor\s*solar)/i.test(combined)) {
    return "energia_solar";
  }

  // 4. Bebidas, Adegas & Distribuidoras
  if (/(?:distribuidora\s*de\s*bebidas|loja\s*de\s*bebidas|dep[oó]sito\s*de\s*bebidas|adega|emp[oó]rio\s*de\s*bebidas|bebidas|chopp|choperia|cervejaria|cerveja|conveni[eê]ncia|destilados|vinhos)/i.test(combined)) {
    return "bebidas";
  }

  // 5. Barbearia & Barber Shop
  if (/(?:barbearia|barber|barba\b|navalha|corte\s*masculino|degrad[eê]|fade\b|bigode|cabelo\s*masculino|barbaterapia)/i.test(combined)) {
    return "barbearia";
  }

  // 6. Subdivisão de Estética, Beleza e Spa:
  // 6.a Estética Corporal & Avançada
  if (/(?:corpus|corporal|drenagem|criolipolise|emagrecimento\s*estet|est[eé]tica\s*avan[çc]ada|p[oó]s-?operat[oó]rio|massoterapia|lipo\b|lipocavita[çc][aã]o|radiofrequ[eê]ncia|modeladora|endermologia)/i.test(combined)) {
    return "estetica_corporal";
  }

  // 6.b Estética Facial & Harmonização
  if (/(?:facial|harmoniza[çc][aã]o|botox|toxina\s*botul[ií]nica|bioestimulador|peeling|limpeza\s*de\s*pele|preenchimento|fios\s*de\s*pdo|microagulhamento|rejuvenescimento|dermato\s*funcional)/i.test(combined)) {
    return "estetica_facial";
  }

  // 6.c Spa, Massagens & Bem-Estar
  if (/(?:spa\b|massagem\s*relaxante|shiatsu|aromaterapia|pedras\s*quentes|reflexologia|day\s*spa|banho\s*de\s*imers[aã]o|relaxamento)/i.test(combined)) {
    return "spa";
  }

  // 6.d Salão Tradicional, Manicure & Cabelo
  if (/(?:sal[aã]o|manicure|pedicure|unhas?\b|nail|lash|alongamento|cabelo|cabelereir|cabeleireir|escova|mechas|sobrancelha|depila[çc][aã]o)/i.test(combined)) {
    return "beleza";
  }

  // Fallback para termos genéricos de "estética" ou "esteticista" sem manicure
  if (/(?:est[eé]tica|esteticista)/i.test(combined)) {
    return "estetica_corporal";
  }

  // 7. Lojas / E-commerce
  if (/(?:loja|boutique|moda|vestu[aá]ri|roupa|cal[çc]ad|acess[oó]ri|biju|semijoia|bolsa|e-?commerce|varejo|confec[çc][aã]o|presentes|cosm[eé]tic|perfum|store|shop|vitrine)/i.test(combined)) {
    return "loja";
  }

  // 8. Delivery & Lanches rápidos
  if (/(?:delivery|lanche|burger|hamburg|pizza|pizzaria|marmitex|pastel|disk|fast\s*food|hot\s*dog|batata\s*frita)/i.test(combined)) {
    return "delivery";
  }

  // 9. Sorveteria & Açaí
  if (/(?:sorvet|gelat|a[çc]a[ií]|paleta|picol[eé]|gelateria|doceri)/i.test(combined)) {
    return "sorveteria";
  }

  // 10. Restaurantes & Gastronomia
  if (/(?:restauran|gastr|bistr[oô]|churrasc|sushi|comida|buffet|jantar|almo[çc]o|choperi|bar\b)/i.test(combined)) {
    return "restaurante";
  }

  // 11. Oficina mecânica & Auto center
  if (/(?:oficina|mec[aâ]nic|auto\s*center|detail|est[eé]tica\s*automot|troca\s*de\s*[oó]leo|funilari|pintura\s*auto|pneu|freio|suspens[aã]o|guincho|auto\s*el[eé]tric|revis[aã]o\s*veicular|martelinho)/i.test(combined)) {
    return "oficina";
  }

  // 12. Dentista & Odontologia
  if (/(?:odonto|dent|sorris|oral|dente|protese|implant|ortodont|clareament|endodont|periodont|resina|lente[s]?\s*(?:em\s*)?resina|faceta|alinhador|invisalign|aparelho\s*dent|est[eé]tica\s*dental|bucomaxilo)/i.test(combined)) {
    return "odontologia";
  }

  // 13. Terapeutas, Psicólogos & Saúde Mental (estritamente focado em psicoterapia e saúde emocional)
  if (/(?:psic[oó]log|psicoterap|psican[aá]lis|sa[uú]de\s*mental|terapeuta\b|acolhimento\s*emocional|psiquiatr|mindfulness|\bterapia\s*(?:online|individual|de\s*casal|cognitiv|infantil|familiar|emocional)?\b|floral\s*de\s*bach|terapia\s*hol[ií]stica)/i.test(combined)) {
    return "psicologia";
  }

  // 14. Saúde, Medicina & Clínicas
  if (/(?:cl[ií]nic|m[eé]dic|sa[uú]de|\bdoutor[a-z]*\b|\bdra?\.?\b|pediatr|fisioter|fisioterapia|fisioterapeuta|laborat[oó]rio|exames|hospital|fonoaudi|terapia\s*ocupacional|oftalmo|dermatol|ginecolog|cardiolog|ortopedi|urologi|ultrassom|raio-?x)/i.test(combined)) {
    return "clinica";
  }

  // 15. Nutricionista & Dietas
  if (/(?:nutri|nutri[çc][aã]o|dieta|emagreciment|reeduca[çc][aã]o\s*alimentar|bioimped|nutr[oó]log)/i.test(combined)) {
    return "nutricao";
  }

  // 16. PetShop & Casa de Ração
  if (/(?:pet\s*shop|veterin[aá]r|\bvet\b|banho\s*e\s*tosa|\btosa\b|canil|\bgat[oa]s?\b|\bcachorr[oa]s?\b|\bra[çc][aã]o\b|\bra[çc][oõ]es\b|cl[ií]nica\s*animal|pet\s*care)/i.test(combined)) {
    return "petshop";
  }

  // 17. Advogado & Escritório Jurídico
  if (/(?:advoc|advogad|jur[ií]d|direito|lei|oab|processo|trabalhista|previdenci[aá]r)/i.test(combined)) {
    return "advocacia";
  }

  // 18. Construção Civil & Reformas
  if (/(?:constru[çc]|obra|reforma|engenhar|empreiteir|pedreir|alvenari|acabament|pintor|eletricista\s*predial)/i.test(combined)) {
    return "construcao";
  }

  // 19. Imobiliária & Corretores
  if (/(?:imobili[aá]r|corretor|im[oó]ve|creci|loca[çc][aã]o|aluguel|venda\s*de\s*im[oó]ve|lan[çc]amento\s*residencial|condom[ií]nio|apartamento)/i.test(combined)) {
    return "imobiliaria";
  }

  // 20. Seguros & Corretoras
  if (/(?:seguro|corretora\s*de\s*seguro|sinistro|ap[oó]lice|plano\s*de\s*sa[uú]de|previd[eê]ncia)/i.test(combined)) {
    return "seguros";
  }

  // 21. Costureira & Ateliê de Moda
  if (/(?:costur|atelie|ateli[eê]|alfaiat|ajuste\s*de\s*roupa|vestido\s*sob\s*medida|bainha|alta\s*costura)/i.test(combined)) {
    return "costura";
  }

  // 22. Tecnologia & Informática
  if (/(?:tecnolog|inform[aá]tic|computad|notebook|conserto\s*de\s*celular|suporte\s*ti|placa|redes|software|programador)/i.test(combined)) {
    return "tecnologia";
  }

  // 23. Fitness, Academia & Treino (Blindado: apenas termos reais de fitness para não capturar treinamentos corporativos)
  if (/(?:academ|fitness|crossfit|muscula[çc][aã]o|personal\s*trainer|\bgym\b|studio\s*fitness|treino\s*funcional|pilates|luta|boxe)/i.test(combined)) {
    return "fitness";
  }

  // 24. Profissional Autônomo & Serviços Gerais
  if (/(?:aut[oô]nomo|prestador|marido\s*de\s*aluguel|t[eé]cnico|manuten[çc][aã]o|reparo|encanador|eletricista)/i.test(combined)) {
    return "autonomo";
  }

  // 25. Página Pessoal & Portfólio
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
  const variants = getVariantsForNiche(key);

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

export const getNichePreset = getPresetForCompany;

/**
 * Retorna a galeria de fotos curadas para o nicho.
 */
/**
 * Retorna uma foto de capa rotativa e variada para o nicho,
 * utilizando uma semente (como o nome da empresa) para garantir que
 * duas empresas do mesmo nicho não recebam a mesma foto.
 */
export function getRandomCoverForNiche(nicheKey?: string | null, seed?: string): string {
  const gallery = getGalleryForNiche(nicheKey);
  const covers = gallery.covers || [];
  if (covers.length === 0) {
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
  }
  if (!seed) {
    const randomIndex = Math.floor(Math.random() * covers.length);
    return covers[randomIndex].url;
  }
  const hash = Math.abs(
    seed.split("").reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0),
  );
  const index = hash % covers.length;
  return covers[index].url;
}

export function getGalleryForNiche(nicheKey?: string | null): { covers: CuratedPhoto[]; avatars: CuratedPhoto[] } {
  if (!nicheKey) return NICHE_GALLERIES.geral;
  const key = detectNicheKey(nicheKey, null);
  return NICHE_GALLERIES[key] || NICHE_GALLERIES.geral;
}

/**
 * Retorna as variantes de modelos visuais configuradas para o nicho,
 * garantindo que TODO nicho tenha obrigatoriamente a opção do Modelo VIP.
 */
export function getVariantsForNiche(nicheKey?: string | null): NichePreset[] {
  const key = detectNicheKey(nicheKey, null) || "geral";
  const baseVariants = NICHE_PRESETS_VARIANTS[key] || NICHE_PRESETS_VARIANTS.geral;

  const hasVip = baseVariants.some((v) => v.template_id === "impact-showcase");
  if (!hasVip && baseVariants.length > 0) {
    const primary = baseVariants[0];
    const vipVariant: NichePreset = {
      ...primary,
      modelName: "Modelo VIP",
      template_id: "impact-showcase",
      theme: "ocean",
      hero_architecture: "immersive",
    };
    return [primary, vipVariant, baseVariants[1] || baseVariants[0]];
  }

  return baseVariants;
}

export interface PairedCatalogItem {
  name: string;
  category: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url: string;
  photo_label: string;
}

const SUB_NICHE_PAIRED_CATALOGS: Record<string, PairedCatalogItem[]> = {
  churrascaria: [
    {
      name: "Rodízio & Cortes Nobres na Brasa",
      category: "Carnes Nobres",
      description: "Picanha maturada, bife ancho, costela assada lentamente na brasa e acompanhamentos tradicionais.",
      price: 89.9,
      duration_minutes: 60,
      image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Corte nobre de carne e churrasco grelhado na brasa suculento",
    },
    {
      name: "Picanha Prime & Grelhados Especiais",
      category: "Especialidades",
      description: "Cortes selecionados servidos no ponto perfeito com farofa crocante da casa, vinagrete e pão de alho.",
      price: 119.0,
      duration_minutes: 40,
      image_url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Picanha e bife grelhado suculento em tábua rústica",
    },
    {
      name: "Buffet Gourmet & Guarnições da Casa",
      category: "Buffet & Salão",
      description: "Mesa farta de acompanhamentos quentes, queijos nobres, frios e saladas frescas em ambiente climatizado.",
      price: 64.9,
      duration_minutes: 45,
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Salão gastronômico aconchegante e mesa posta de restaurante",
    },
    {
      name: "Sobremesas Artesanais & Carta de Bebidas",
      category: "Sobremesas & Drinks",
      description: "Petit gâteau artesanal, pudim de leite condensado, chopp trincando e carta de vinhos selecionados.",
      price: 29.0,
      duration_minutes: 20,
      image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Drinks autorais e bebidas geladas em apresentação sofisticada",
    },
  ],
  pizzaria: [
    {
      name: "Pizza Artesanal no Forno a Lenha (8 Fatias)",
      category: "Tradicionais",
      description: "Massa de fermentação lenta por 48h, molho de tomates italianos frescos e mussarela derretida.",
      price: 64.9,
      duration_minutes: 35,
      image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Pizza artesanal assada no forno com queijo derretido e manjericão",
    },
    {
      name: "Sabores Especiais & Borda Recheada",
      category: "Especiais",
      description: "Calabresa artesanal acebolada, quatro queijos nobres, pepperoni crocante e borda recheada com Catupiry.",
      price: 72.9,
      duration_minutes: 35,
      image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Pizza gourmet fatiada com recheio generoso e massa dourada",
    },
    {
      name: "Margherita Clássica Italiana & Napolitana",
      category: "Autorais",
      description: "Mussarela de búfala selecionada, rodelas de tomate fresco, folhas de manjericão e azeite extravirgem.",
      price: 68.0,
      duration_minutes: 30,
      image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Pizza margherita clássica recém-saída do forno",
    },
    {
      name: "Combo Família: Pizza Grande + Brotinho Doce + Bebida",
      category: "Combos",
      description: "A combinação completa para reunir a família com pizza salgada grande, brotinho de chocolate e refrigerante 2L.",
      price: 94.9,
      duration_minutes: 40,
      image_url: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Mesa com pizzas artesanais variadas para compartilhar",
    },
  ],
  hamburgueria: [
    {
      name: "Smash Burger Duplo Artesanal",
      category: "Smash Burgers",
      description: "Dois blends de carne 100% bovina selados na chapa, queijo cheddar derretido, bacon crocante e maionese da casa no brioche.",
      price: 34.9,
      duration_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Hambúrguer artesanal alto com queijo cheddar derretido e pão brioche",
    },
    {
      name: "Cheeseburger Gourmet & Cebola Caramelizada",
      category: "Gourmet",
      description: "Blend suculento de 180g grelhado no fogo, queijo prato, cebola caramelizada no melado e molho defumado.",
      price: 38.9,
      duration_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Cheeseburger gourmet artesanal em close-up apetitoso",
    },
    {
      name: "Combo Burger + Batatas Rústicas + Bebida",
      category: "Combos",
      description: "Seu burger favorito acompanhado de porção de batatas fritas crocantes com alecrim e bebida gelada.",
      price: 46.9,
      duration_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Combo de hambúrguer artesanal acompanhado de batatas fritas crocantes",
    },
    {
      name: "Porções Crocantes & Milkshakes Artesanais",
      category: "Acompanhamentos",
      description: "Batatas com cheddar e bacon, onion rings douradas e milkshakes ultra cremosos para completar a experiência.",
      price: 26.9,
      duration_minutes: 15,
      image_url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Hambúrguer duplo gourmet suculento com bacon e queijo derretido",
    },
  ],
  japones: [
    {
      name: "Combinado Especial do Sushiman (32 Peças)",
      category: "Combinados",
      description: "Seleção fresca de sashimis de salmão, niguiris maçaricados com azeite trufado, uramakis e jyos especiais.",
      price: 114.9,
      duration_minutes: 35,
      image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Combinado de sushi e sashimi fresco de salmão montado pelo sushiman",
    },
    {
      name: "Temaki Filadélfia & Hot Rolls Crocantes",
      category: "Temakis & Hots",
      description: "Alga nori crocante recheada com salmão fresco em cubos, cream cheese e porção de hot rolls dourados com tarê.",
      price: 44.9,
      duration_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Prato de sushi e rolinhos orientais frescos com molho",
    },
    {
      name: "Barca Premium & Festival Japonês",
      category: "Experiência Oriental",
      description: "Barca completa com cortes nobres de peixe branco, atum e salmão para compartilhar no salão ou em casa.",
      price: 159.0,
      duration_minutes: 45,
      image_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Barca japonesa variada com sushis e sashimis de alta gastronomia",
    },
    {
      name: "Yakisoba Clássico & Pratos Quentes da Cozinha Oriental",
      category: "Pratos Quentes",
      description: "Macarrão oriental salteado na wok com legumes frescos, tiras nobres de carne/frango e molho shoyu especial.",
      price: 54.9,
      duration_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Prato oriental quente preparado na wok com ingredientes frescos",
    },
  ],
  cafeteria: [
    {
      name: "Cafés Especiais & Cappuccino Italiano",
      category: "Cafeteria",
      description: "Grãos 100% arábica moídos na hora, espresso encorpado e latte art cremoso preparado por baristas.",
      price: 14.9,
      duration_minutes: 10,
      image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Xícara de café especial com latte art sobre mesa de cafeteria",
    },
    {
      name: "Confeitaria Fina, Tortas & Croissants",
      category: "Confeitaria",
      description: "Fatias de torta belga, croissants folhados na manteiga e doces artesanais assados todos os dias.",
      price: 22.0,
      duration_minutes: 10,
      image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Ambiente acolhedor de cafeteria e confeitaria moderna",
    },
    {
      name: "Combo Brunch & Pães de Fermentação Natural",
      category: "Brunch",
      description: "Tostex no pão levain, ovos mexidos cremosos, suco natural prensado e café coado na hora.",
      price: 39.9,
      duration_minutes: 20,
      image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Mesa de café da manhã e brunch com cafés especiais",
    },
    {
      name: "Pães Artesanais, Doces & Encomendas Especiais",
      category: "Padaria Artesanal",
      description: "Fornadas diárias de pães rústicos, bolos caseiros, salgados finos e cestas especiais sob encomenda.",
      price: 32.0,
      duration_minutes: 15,
      image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Pães artesanais dourados recém-saídos do forno",
    },
  ],
  fisioterapia: [
    {
      name: "Fisioterapia Ortopédica & Reabilitação Funcional",
      category: "Reabilitação",
      description: "Avaliação biomecânica e tratamento individualizado para dores na coluna, articulações e pós-operatório.",
      price: 150.0,
      duration_minutes: 55,
      image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Consultório clínico moderno de fisioterapia e reabilitação em saúde",
    },
    {
      name: "Pilates Clínico & Correção Postural",
      category: "Pilates & Movimento",
      description: "Sessões guiadas em aparelhos e solo para fortalecimento do core, mobilidade articular e prevenção de lesões.",
      price: 140.0,
      duration_minutes: 55,
      image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Estúdio de pilates e exercícios de reabilitação postural",
    },
    {
      name: "Liberação Miofascial & Terapia Manual",
      category: "Terapia Manual",
      description: "Manobras terapêuticas para alívio imediato de tensões musculares, contraturas e recuperação esportiva.",
      price: 160.0,
      duration_minutes: 50,
      image_url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Atendimento de terapia manual corporal e alívio de tensão",
    },
    {
      name: "Fisioterapia Esportiva & Recovery Avançado",
      category: "Performance",
      description: "Prevenção e recuperação acelerada de lesões para atletas e praticantes de atividade física.",
      price: 170.0,
      duration_minutes: 55,
      image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85",
      photo_label: "Acompanhamento de reabilitação física e movimento funcional",
    },
  ],
};

/**
 * Detecta sub-nichos especializados (ex: churrascaria, pizzaria, hamburgueria, sushi, cafeteria, fisioterapia)
 * ou retorna a chave canônica dos 26 nichos.
 */
export function detectSpecializedSubNicheKey(
  nicheRaw?: string | null,
  companyNameRaw?: string | null,
): string {
  const combined = `${nicheRaw ?? ""} ${companyNameRaw ?? ""}`.toLowerCase();
  if (/churrasc|espet|picanha|casa\s*de\s*carne|steakhous|rod[ií]zio\s*de\s*carne|parrill/i.test(combined)) {
    return "churrascaria";
  }
  if (/pizza|pizzari|forneria/i.test(combined)) {
    return "pizzaria";
  }
  if (/burger|hamburg|smash\s*burger/i.test(combined)) {
    return "hamburgueria";
  }
  if (/sushi|japon[eê]s|temaki|sashimi|oriental|izakaya/i.test(combined)) {
    return "japones";
  }
  if (/caf[eé]|cafeteria|padaria|panificadora|confeitari|doceri|bistr[oô]/i.test(combined)) {
    return "cafeteria";
  }
  if (/fisioter|pilates|osteopat|quiroprax|reabilita[çc][aã]o\s*f[ií]sica/i.test(combined)) {
    return "fisioterapia";
  }
  return detectNicheKey(nicheRaw, companyNameRaw);
}

/**
 * Retorna o catálogo oficial de produtos/serviços pareados 1:1 com suas respectivas fotos em alta resolução
 * e rótulos semânticos exatos para evitar qualquer troca de fotos pela IA.
 */
export function getPairedCatalogForBusiness(
  nicheRaw?: string | null,
  companyNameRaw?: string | null,
): PairedCatalogItem[] {
  const subKey = detectSpecializedSubNicheKey(nicheRaw, companyNameRaw);
  if (SUB_NICHE_PAIRED_CATALOGS[subKey]) {
    return SUB_NICHE_PAIRED_CATALOGS[subKey];
  }

  const baseKey = detectNicheKey(nicheRaw, companyNameRaw);
  const variants = NICHE_PRESETS_VARIANTS[baseKey] || NICHE_PRESETS_VARIANTS.geral;
  const gallery = NICHE_GALLERIES[subKey] || NICHE_GALLERIES[baseKey] || NICHE_GALLERIES.geral;

  // Coleta todos os serviços únicos das variantes deste nicho mantendo a foto pareada e garantindo zero duplicação de foto entre os 4 cards
  const seenNames = new Set<string>();
  const usedBasePhotos = new Set<string>();
  const items: PairedCatalogItem[] = [];

  for (const variant of variants) {
    for (const srv of variant.services || []) {
      const normName = srv.name.trim().toLowerCase();
      if (seenNames.has(normName)) continue;
      seenNames.add(normName);

      let rawUrl = srv.image_url || "";
      let basePhotoId = rawUrl.split("?")[0];

      // Se a foto deste serviço já foi usada por outro card anterior, pega a próxima foto exclusiva da galeria do nicho
      if (!rawUrl || usedBasePhotos.has(basePhotoId)) {
        const unusedCover = gallery.covers.find((c) => !usedBasePhotos.has(c.url.split("?")[0]));
        if (unusedCover) {
          rawUrl = unusedCover.url;
          basePhotoId = rawUrl.split("?")[0];
        }
      }

      usedBasePhotos.add(basePhotoId);

      const hdUrl = rawUrl
        .replace(/w=\d+/g, "w=1200")
        .replace(/q=\d+/g, "q=85");

      const matchingCover = gallery.covers.find((c) => c.url.split("?")[0] === basePhotoId);

      items.push({
        name: srv.name,
        category: srv.category || "Destaque",
        description: srv.description,
        price: srv.price,
        duration_minutes: srv.duration_minutes,
        image_url: hdUrl,
        photo_label: matchingCover
          ? `${srv.name} — ${matchingCover.label}`
          : `${srv.name}: ${srv.description}`,
      });

      if (items.length >= 4) break;
    }
    if (items.length >= 4) break;
  }

  // Se o preset tinha apenas 3 serviços, adiciona um 4º serviço usando a próxima foto única da galeria do nicho
  if (items.length < 4 && gallery.covers.length > items.length) {
    const nextCover = gallery.covers.find((c) => !usedBasePhotos.has(c.url.split("?")[0])) || gallery.covers[0];
    if (nextCover) {
      items.push({
        name: nextCover.label,
        category: "Exclusivo",
        description: `Experiência personalizada de alto padrão com estrutura dedicada e atendimento exclusivo.`,
        price: items[0]?.price || 150,
        duration_minutes: items[0]?.duration_minutes || 50,
        image_url: nextCover.url.replace(/w=\d+/g, "w=1200").replace(/q=\d+/g, "q=85"),
        photo_label: nextCover.label,
      });
    }
  }

  return items;
}

export interface NicheDesignDirection {
  nicheKey: string;
  canonicalTagLabel: string;
  variantName: string;
  positioning: string;
  atmosphere: string;
  palette: string;
  fonts: string;
  navbar: string;
  heroConcept: string;
  servicesLayout: string;
  signatureSection: string;
  locationLayout: string;
  trustBadges: string[];
  heroPhotoUrl: string;
  ambientPhotoUrl: string;
  pairedServices: PairedCatalogItem[];
}

interface NicheAestheticProfile {
  label: string;
  positioning: string;
  atmosphere: string;
  palettes: [string, string, string];
  fonts: string;
  trustBadges: string[];
}

const NICHE_AESTHETIC_PROFILES: Record<string, NicheAestheticProfile> = {
  psicologia: {
    label: "Psicologia, Terapia & Saúde Emocional",
    positioning: "Acolhimento humano, escuta ética com sigilo absoluto, serenidade clínica e transformação emocional.",
    atmosphere: "Warm Organic Sanctuary — atmosfera serena, acolhedora, iluminada com luz natural, tons terrosos orgânicos, verde-sálvia e areia suave. PROIBIDO visual frio hospitalar ou corporativo escuro.",
    palettes: [
      "Areia Orgânica (#FAF7F2), Verde Sálvia Profundo (#2E4F4F), Terracota Suave (#C87D55) e Carvão Suave (#1E242B)",
      "Marfim Acolhedor (#FDFBF7), Oliva Nobre (#3F4E4F), Bronze Quente (#A27B5C) e Grafite Sereno (#2C3639)",
      "Off-White Linho (#F9F6F0), Azul Sereno Profundo (#1D3557), Dourado Champanhe (#D4A373) e Ardósia (#2B2D42)",
    ],
    fonts: "Títulos em 'Cormorant Garamond' ou 'Playfair Display' (serifa editorial acolhedora) + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Escuta Ética & Sigilo Absoluto (CRP)", "Atendimento Presencial & Online", "Ambiente Acolhedor & Climatizado", "Abordagem Científica Individualizada"],
  },
  odontologia: {
    label: "Odontologia Estética & Reabilitação Oral",
    positioning: "Alta precisão digital, estética do sorriso natural, biossegurança hospitalar e conforto sem dor.",
    atmosphere: "Swiss Clinical Luxury — arquitetura clínica minimalista de altíssimo padrão, branco puro, pérola, azul meia-noite ou champanhe dourado.",
    palettes: [
      "Branco Pérola (#F8FAFC), Azul Royal Profundo (#0F172A), Ciano Tecnológico (#0284C7) e Prata Nobre",
      "Marfim Clínico (#FCFBF9), Grafite Profundo (#18181B), Champagne Dourado (#C5A059) e Branco Puro (#FFFFFF)",
      "Dark Luxury Odontológico: Grafite Meia-Noite (#090D16), Dourado Acetinado (#D4AF37) e Branco Cristal (#F8FAFC)",
    ],
    fonts: "Títulos em 'Plus Jakarta Sans' ou 'Playfair Display' + Corpo em 'Inter'",
    trustBadges: ["Planejamento Digital 3D do Sorriso", "Biossegurança Rigorosa & Conforto", "Materiais Importados de Alta Estética", "Especialistas Certificados (CRO)"],
  },
  clinica: {
    label: "Clínica Médica, Saúde & Diagnóstico",
    positioning: "Excelência médica, diagnóstico preciso, corpo clínico especializado e atendimento humanizado.",
    atmosphere: "Premium Healthcare Institute — estilo Hospital Albert Einstein / Mayo Clinic, limpidez visual, confiança imediata e sofisticação médica.",
    palettes: [
      "Branco Clínico (#F8FAFC), Azul Marinho Médico (#0A2540), Verde Esmeralda Saúde (#0D9488) e Ardósia (#334155)",
      "Gelo Suave (#F4F7FB), Azul Petróleo (#113F67), Azul Celeste (#38BDF8) e Grafite (#1E293B)",
      "Areia Médica (#FAF9F6), Verde Floresta Nobre (#14532D), Dourado Suave (#B45309) e Carvão (#1C1917)",
    ],
    fonts: "Títulos em 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Corpo Clínico Especializado (CRM)", "Equipamentos de Diagnóstico Modernos", "Atendimento Humanizado com Hora Marcada", "Estrutura Completa & Acessível"],
  },
  fisioterapia: {
    label: "Fisioterapia, Pilates Clínico & Reabilitação",
    positioning: "Recuperação funcional acelerada, alívio definitivo da dor, biomecânica e movimento sem limites.",
    atmosphere: "Vitality & Precision Studio — equilíbrio entre ciência da reabilitação, movimento fluido e bem-estar físico.",
    palettes: [
      "Branco Gelo (#F8FAFC), Verde Esmeralda Vital (#047857), Azul Oceano (#0369A1) e Grafite (#0F172A)",
      "Areia Clara (#FAF8F5), Terracota Vitalidade (#C2410C), Verde Sálvia (#15803D) e Carvão (#18181B)",
      "Ardósia Clara (#F1F5F9), Azul Cobalto (#1D4ED8), Ciano Ativo (#06B6D4) e Preto Profundo (#09090B)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Avaliação Biomecânica Individual", "Fisioterapeutas Especializados (CREFITO)", "Protocolos de Alívio Rápido da Dor", "Aparelhos de Pilates & Reabilitação"],
  },
  nutricao: {
    label: "Nutrição Clínica, Esportiva & Emagrecimento",
    positioning: "Nutrição inteligente sem terrorismo alimentar, bioimpedância de precisão e longevidade saudável.",
    atmosphere: "Botanical Fresh & Longevity — frescor orgânico, vitalidade natural, elegância botânica e ciência nutricional.",
    palettes: [
      "Creme Botânico (#FAFDF7), Verde Folha Profundo (#166534), Laranja Cítrico (#EA580C) e Carvão (#1C1917)",
      "Marfim Orgânico (#FEFCE8), Verde Oliva (#3F6212), Dourado Mel (#D97706) e Grafite (#1F2937)",
      "Branco Puro (#FFFFFF), Esmeralda Vivo (#059669), Coral Suave (#F43F5E) e Ardósia (#0F172A)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Plus Jakarta Sans' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Exame de Bioimpedância Incluso", "Plano Alimentar 100% Personalizado", "Acompanhamento Contínuo (CRN)", "Sem Dietas Restritivas Impossíveis"],
  },
  estetica_facial: {
    label: "Estética Facial & Harmonização Avançada",
    positioning: "Rejuvenescimento elegante, naturalidade absoluta, gerenciamento da pele e alta tecnologia dermatológica.",
    atmosphere: "Haute Beauté & Luxury Maison — estética digna de clínica parisiense/suíça, tons nude, champagne, rose gold e marfim.",
    palettes: [
      "Marfim Seda (#FDFBF9), Champagne Rose (#C89D7C), Bronze Nobre (#5C4033) e Carvão (#1C1917)",
      "Nude Rosé (#FFF8F6), Ouro Velho (#B8860B), Grafite Intenso (#18181B) e Branco Puro (#FFFFFF)",
      "Dark Maison: Ônix Profundo (#12100E), Champagne Dourado (#D4AF37), Nude Suave (#F5EBE6)",
    ],
    fonts: "Títulos em 'Cormorant Garamond' ou 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Resultados Naturais & Sem Exageros", "Ativos e Tecnologias Homologadas ANVISA", "Protocolos Exclusivos Personalizados", "Biossegurança e Conforto Absoluto"],
  },
  estetica_corporal: {
    label: "Estética Corporal, Contorno & Bem-Estar",
    positioning: "Remodelação corporal de alta performance, drenagem especializada e tecnologias redutoras.",
    atmosphere: "Sculpt & Glow Boutique Clinic — atmosfera luminosa, sofisticada, transmite autoestima, leveza e ciência estética.",
    palettes: [
      "Areia Rosada (#FDF8F5), Terracota Nobre (#9A3412), Champagne (#D4A373) e Grafite (#1C1917)",
      "Branco Pérola (#FAFAFA), Esmeralda Spa (#0F766E), Dourado Suave (#CA8A04) e Ardósia (#1E293B)",
      "Marfim (#FEFDFB), Bronze Acetinado (#A16207), Carvão Profundo (#18181B)",
    ],
    fonts: "Títulos em 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Avaliação Corporal Personalizada", "Equipamentos de Alta Tecnologia", "Protocolos Pós-Operatório & Redução", "Ambiente Climatizado e Privativo"],
  },
  spa: {
    label: "Day Spa, Massoterapia & Rituais de Relaxamento",
    positioning: "Refúgio sensorial urbano, alívio profundo do estresse, terapias orientais e renovação corpo-mente.",
    atmosphere: "Zen Luxury Resort Spa — inspirado no Aman Resorts, pedra natural, bambu, luz de velas, silêncio visual.",
    palettes: [
      "Pedra Quente (#F5F2EB), Verde Musgo Zen (#2D4A3E), Âmbar Suave (#B45309) e Carvão (#1C1917)",
      "Areia do Deserto (#FAF6F0), Marrom Cacau (#4A3728), Dourado Solar (#D97706) e Ônix (#18181B)",
      "Dark Sanctuary: Verde Floresta Noturno (#0D1F18), Dourado Champagne (#D4AF37) e Linho Claro (#F5F5F0)",
    ],
    fonts: "Títulos em 'Cormorant Garamond' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Óleos Essenciais 100% Puros", "Salas Climatizadas com Aromaterapia", "Terapeutas Certificados em Massoterapia", "Experiência Sensorial Completa"],
  },
  beleza: {
    label: "Salão de Beleza, Hair Studio & Nail Design",
    positioning: "Visagismo moderno, mechas perfeitas, saúde capilar, manicure em gel de alta durabilidade e produção impecável.",
    atmosphere: "Vogue Beauty Lounge — glamour contemporâneo, iluminação de camarim, sofisticação fashion.",
    palettes: [
      "Off-White Glamour (#FCF9F8), Rose Gold (#B76E79), Preto Couture (#111111) e Champagne (#F3E5AB)",
      "Dark Beauty Lounge: Preto Ônix (#09090B), Dourado Champagne (#E5C158), Branco Seda (#FAFAFA)",
      "Creme Parisiense (#FAF7F5), Borgonha Nobre (#881337), Dourado (#CA8A04) e Grafite (#18181B)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Syne' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Produtos Importados de Linha Profissional", "Especialistas em Visagismo & Colorimetria", "Biossegurança 100% Esterilizada (Autoclave)", "Atendimento com Hora Marcada"],
  },
  barbearia: {
    label: "Barbearia Clássica & Barber Club",
    positioning: "Estilo masculino de respeito, visagismo de barba na toalha quente, degradê navalhado perfeito e resenha premium.",
    atmosphere: "Gentlemen's Leather & Whiskey Club — madeira nobre, couro escuro, aço escovado, âmbar dourado, estética masculina imponente.",
    palettes: [
      "Preto Carvão (#09090B), Âmbar Whiskey (#D97706), Couro Envelhecido (#78350F) e Prata Acetinado (#F4F4F5)",
      "Grafite Navalha (#111827), Dourado Ouro Velho (#CA8A04), Vermelho Barber (#991B1B) e Branco (#F9FAFB)",
      "Verde Inglês Escuro (#062C1E), Bronze Nobre (#B45309), Creme Clássico (#FAF7F2) e Preto (#09090B)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Syne' (peso extra-bold masculino) + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Barbaterapia com Toalha Quente & Ozônio", "Mestres Barbeiros Especialistas em Fade", "Cerveja Gelada, Café & Ambiente Climatizado", "Agendamento Online Sem Fila de Espera"],
  },
  churrascaria: {
    label: "Churrascaria, Steakhouse & Parrilla",
    positioning: "Cortes nobres maturados, fogo de chão e brasa viva, suculência incomparável e tradição gaúcha/parrilla.",
    atmosphere: "Prime Fire Steakhouse — brasa ardente, madeira rústica nobre, ferro fundido, iluminação dramática que abre o apetite.",
    palettes: [
      "Preto Brasa (#0C0A09), Vermelho Rubi Carnes (#B91C1C), Âmbar Fogo (#D97706) e Creme (#FAFAF9)",
      "Carvão Defumado (#18181B), Bronze Grelha (#B45309), Dourado Chopp (#EAB308) e Branco Quente (#FAF7F2)",
      "Marfim Rústico (#FAF6F0), Borgonha Steakhouse (#7F1D1D), Carvão (#1C1917) e Cobre (#C2410C)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Cortes Nobres 100% Selecionados", "Assado na Brasa no Ponto Perfeito", "Salão Climatizado & Espaço Família", "Chopp Trincando & Carta de Bebidas"],
  },
  pizzaria: {
    label: "Pizzaria Artesanal & Forneria Italiana",
    positioning: "Massa de fermentação lenta 48h, forno a lenha de alta temperatura, ingredientes importados e borda dourada.",
    atmosphere: "Artisanal Napoli Trattoria — calor do forno a lenha, vermelho tomate San Marzano, manjericão fresco e massa crocante.",
    palettes: [
      "Creme Farinha (#FDFBF7), Vermelho Napolitano (#DC2626), Verde Manjericão (#15803D) e Carvão Forno (#1C1917)",
      "Noite Italiana: Carvão Forno (#141210), Laranja Forno a Lenha (#EA580C), Dourado Queijo (#FACC15) e Branco (#FAFAFA)",
      "Marfim Toscano (#FAF6F0), Terracota Forneria (#B91C1C), Oliva (#3F6212) e Grafite (#18181B)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Massa Artesanal de Fermentação Natural", "Ingredientes Nobres & Queijos Selecionados", "Forno de Alta Temperatura & Entrega Quente", "Pedidos Rápidos Direto no WhatsApp"],
  },
  hamburgueria: {
    label: "Hamburgueria Artesanal & Smash Burger",
    positioning: "Blend 100% bovino moído no dia, crosta maillard perfeita na chapa, cheddar derretido, bacon crocante e pão brioche amanteigado.",
    atmosphere: "Urban Craft Burger Joint — visual vibrante, apetitoso, alto contraste, fotografia suculenta em primeiro plano.",
    palettes: [
      "Preto Chapa (#09090B), Amarelo Cheddar (#FACC15), Laranja Brasa (#EA580C) e Branco (#FAFAFA)",
      "Grafite Urbano (#18181B), Vermelho Ketchup (#DC2626), Âmbar Brioche (#D97706) e Creme (#FEFCE8)",
      "Off-White Craft (#FAF8F5), Laranja Smash (#C2410C), Preto Puro (#09090B) e Mostarda (#CA8A04)",
    ],
    fonts: "Títulos em 'Syne' ou 'Outfit' (impacto urbano) + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Blend Artesanal 100% Carne Fresca", "Pão Brioche Selado na Manteiga", "Batatas Crocantes & Molhos da Casa", "Delivery Rápido com Embalagem Térmica"],
  },
  japones: {
    label: "Restaurante Japonês, Sushi Bar & Oriental",
    positioning: "Peixes frescos recebidos diariamente, cortes precisos do sushiman, alta gastronomia oriental e ambiente intimista.",
    atmosphere: "Tokyo Izakaya & Omakase Luxury — minimalismo japonês contemporâneo, preto laca, vermelho carmim, madeira hinoki e ouro.",
    palettes: [
      "Preto Laca (#09090B), Vermelho Torii (#DC2626), Dourado Omakase (#D4AF37) e Branco Arroz (#FAFAFA)",
      "Carvão Oriental (#141416), Coral Salmão (#F97316), Bambu Dourado (#CA8A04) e Marfim (#FAF8F5)",
      "Off-White Washi (#FAF8F5), Preto Nanquim (#111111), Vermelho Carmim (#991B1B) e Ouro (#B45309)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Salmão & Peixes Frescos Selecionados", "Sushimen Especialistas em Cortes Nobres", "Barcas, Combinados & Rodízio Premium", "Delivery com Embalagem Premium"],
  },
  cafeteria: {
    label: "Cafeteria Especial, Confeitaria & Padaria Artesanal",
    positioning: "Grãos 100% arábica de torra fresca, pães de fermentação natural levain, confeitaria fina e ambiente acolhedor.",
    atmosphere: "Artisanal Roastery & Patisserie — aroma de café passado, tons caramelo, espresso, manteiga e aconchego parisiense.",
    palettes: [
      "Creme Latte (#FDFBF7), Marrom Espresso (#3E2723), Caramelo Tostado (#B45309) e Carvão (#1C1917)",
      "Areia Croissant (#FAF6F0), Verde Matcha (#3F6212), Bronze Torra (#92400E) e Grafite (#18181B)",
      "Dark Roastery: Café Torrado (#1A120E), Dourado Crema (#D97706), Creme Baunilha (#FEFCE8)",
    ],
    fonts: "Títulos em 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Grãos Especiais 100% Arábica", "Fornadas Frescas Todos os Dias", "Confeitaria Artesanal & Brunch", "Espaço Aconchegante com Wi-Fi"],
  },
  restaurante: {
    label: "Restaurante, Gastronomia & Bistrô",
    positioning: "Cozinha autoral com ingredientes frescos selecionados, pratos generosos, hospitalidade calorosa e experiência gastronômica memorável.",
    atmosphere: "Contemporary Fine Dining & Bistro — iluminação quente, pratos fotografados com brilho apetitoso, charme gastronômico.",
    palettes: [
      "Creme Bistrô (#FDFBF7), Terracota Gourmet (#C2410C), Verde Oliva (#15803D) e Carvão (#1C1917)",
      "Noite Gastronômica: Grafite Profundo (#121214), Âmbar Dourado (#D97706), Vinho Nobre (#991B1B) e Branco (#FAFAFA)",
      "Linho Natural (#FAF8F5), Borgonha Reserva (#7F1D1D), Ouro Velho (#B45309) e Preto (#18181B)",
    ],
    fonts: "Títulos em 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Ingredientes Frescos Selecionados", "Cozinha Autoral & Receitas da Casa", "Ambiente Climatizado & Acolhedor", "Reserva de Mesas & Delivery"],
  },
  delivery: {
    label: "Delivery Gastronômico & Lanches Artesanais",
    positioning: "Sabor irresistível que chega quentinho e rápido na sua porta, ingredientes caprichados e pedido sem burocracia.",
    atmosphere: "High-Conversion Food Lover — cores quentes que estimulam a fome instantaneamente, botões de pedido rápido em destaque.",
    palettes: [
      "Preto Gourmet (#09090B), Laranja Fogo (#EA580C), Amarelo Ouro (#FACC15) e Branco (#FFFFFF)",
      "Branco Quente (#FFFDF9), Vermelho Sabor (#DC2626), Âmbar Crocante (#D97706) e Grafite (#18181B)",
      "Grafite Escuro (#141417), Vermelho Pimenta (#E11D48), Amarelo Mostarda (#EAB308) e Creme (#FAFAFA)",
    ],
    fonts: "Títulos em 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Entrega Rápida com Embalagem Térmica", "Ingredientes Frescos & Porções Generosas", "Pedido Fácil Direto no WhatsApp", "Campeão de Avaliações 5 Estrelas"],
  },
  sorveteria: {
    label: "Gelateria Artesanal, Sorveteria & Açaí",
    positioning: "Gelatos ultra cremosos produzidos diariamente, açaí puro da Amazônia com acompanhamentos nobres e sabor refrescante.",
    atmosphere: "Artisanal Gelato & Berry Lounge — alegre, cremoso, refrescante e irresistível.",
    palettes: [
      "Creme Baunilha (#FFFDF9), Roxo Açaí Profundo (#581C87), Rosa Framboesa (#DB2777) e Carvão (#18181B)",
      "Branco Gelato (#FAFAFA), Verde Pistache (#15803D), Caramelo Doce (#D97706) e Grafite (#1E293B)",
      "Roxo Açaí Premium (#2E1065), Amarelo Manga (#FACC15), Rosa Morango (#EC4899) e Branco (#FFFFFF)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Receita Artesanal Ultra Cremosa", "Açaí Puro Selecionado & Frutas Frescas", "Ambiente Climatizado para a Família", "Delivery com Embalagem Isotérmica"],
  },
  bebidas: {
    label: "Adega, Distribuidora de Bebidas & Choperia",
    positioning: "Bebidas trincando de geladas entregues em minutos, rótulos selecionados de vinhos, destilados importados e cervejas especiais.",
    atmosphere: "Premium Cellar & Cold Brew — contraste entre o dourado do malte/whisky, o rubi do vinho e o frescor de bebida trincando.",
    palettes: [
      "Preto Adega (#09090B), Âmbar Malte (#F59E0B), Borgonha Vinho (#881337) e Branco Gelo (#F8FAFC)",
      "Grafite Gelo (#0F172A), Amarelo Chopp (#EAB308), Ciano Gelado (#06B6D4) e Branco (#FFFFFF)",
      "Creme Rótulo (#FAF8F5), Vinho Reserva (#7F1D1D), Dourado Rolha (#B45309) e Preto (#111111)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Cervejas & Bebidas Trincando de Geladas", "Entrega Expressa para Eventos e Casa", "Destilados, Vinhos e Rótulos 100% Originais", "Preços de Distribuidora & Combos"],
  },
  advocacia: {
    label: "Escritório de Advocacia & Consultoria Jurídica",
    positioning: "Defesa intransigente dos direitos do cliente, estratégia processual de elite, sigilo absoluto e alta taxa de êxito.",
    atmosphere: "Sovereign Legal Chambers — imponência institucional, sobriedade clássica, azul marinho profundo, mogno, ouro antigo e marfim.",
    palettes: [
      "Azul Marinho Soberano (#0A192F), Dourado Imperador (#C5A059), Marfim Papel (#FAF8F5) e Grafite (#1E293B)",
      "Ônix Jurídico (#090D16), Bronze Clássico (#B45309), Prata Sóbrio (#E2E8F0) e Branco (#FFFFFF)",
      "Marfim Clássico (#FDFBF7), Borgonha Tribunal (#7F1D1D), Ouro Velho (#A16207) e Carvão (#18181B)",
    ],
    fonts: "Títulos em 'Cormorant Garamond' ou 'Playfair Display' (autoridade jurídica clássica) + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Inscrito na Ordem dos Advogados (OAB)", "Atendimento Estratégico & Sigilo Absoluto", "Análise Processual Personalizada", "Atuação Presencial e Digital em Todo o Brasil"],
  },
  contabilidade: {
    label: "Contabilidade Consultiva, Gestão Fiscal & BPO",
    positioning: "Redução legal de impostos, blindagem fiscal, contabilidade digital sem burocracia e inteligência financeira para crescer.",
    atmosphere: "Executive Wealth & Financial Advisory — precisão executiva, confiança corporativa, clareza estratégica.",
    palettes: [
      "Branco Executivo (#F8FAFC), Azul Marinho Corporativo (#0F172A), Verde Lucro (#059669) e Dourado (#D97706)",
      "Grafite Wall Street (#090D16), Esmeralda Financeiro (#10B981), Azul Royal (#2563EB) e Gelo (#F1F5F9)",
      "Marfim Corporativo (#FAF9F6), Azul Petróleo (#1E3A8A), Bronze Executivo (#B45309) e Ardósia (#1E293B)",
    ],
    fonts: "Títulos em 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Contadores Registrados no CRC", "Planejamento Tributário & Economia Fiscal", "Abertura de Empresa e Regularização Rápida", "Atendimento Consultivo Direto no WhatsApp"],
  },
  imobiliaria: {
    label: "Imobiliária, Corretor de Imóveis & Alto Padrão",
    positioning: "Curadoria de imóveis exclusivos, segurança jurídica em cada escritura, avaliação patrimonial precisa e negociação transparente.",
    atmosphere: "Architectural Living & Luxury Real Estate — estilo Sotheby's International Realty, fotografia arquitetônica ampla, linhas limpas.",
    palettes: [
      "Branco Arquitetura (#FAFAFA), Grafite Concreto (#18181B), Dourado Cobertura (#C5A059) e Areia (#F5F3EF)",
      "Azul Noite Patrimonial (#0B132B), Champagne Luxo (#D4AF37), Branco Puro (#FFFFFF) e Ardósia (#334155)",
      "Areia Travertino (#FAF7F2), Verde Jardim (#14532D), Bronze Arquitetônico (#92400E) e Carvão (#1C1917)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Plus Jakarta Sans' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Credenciamento Oficial CRECI", "Assessoria Jurídica e Financiamento Completo", "Curadoria de Imóveis Selecionados", "Visitas Guiadas com Hora Marcada"],
  },
  construcao: {
    label: "Engenharia Civil, Construção & Reformas",
    positioning: "Obras entregues rigorosamente no prazo, responsabilidade técnica CREA/CAU, acabamento impecável e orçamento sem surpresas.",
    atmosphere: "Precision Engineering & Architecture — solidez estrutural, concreto aparente, aço, linhas geométricas precisas.",
    palettes: [
      "Branco Projeto (#F8FAFC), Azul Engenharia (#0F172A), Laranja Segurança (#EA580C) e Cinza Concreto (#334155)",
      "Grafite Estrutural (#111827), Amarelo Obra (#EAB308), Azul Aço (#0284C7) e Gelo (#F1F5F9)",
      "Areia Arquitetura (#FAF8F5), Terracota Tijolo (#C2410C), Carvão (#18181B) e Bronze (#B45309)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Projetos com Responsabilidade Técnica", "Cumprimento Rigoroso de Cronograma", "Acabamento de Alto Padrão Garantido", "Orçamento Detalhado e Transparente"],
  },
  energia_solar: {
    label: "Energia Solar Fotovoltaica & Sustentabilidade",
    positioning: "Redução de até 95% na conta de luz, engenharia fotovoltaica homologada na concessionária e retorno financeiro garantido.",
    atmosphere: "Clean Tech Solar Future — tecnologia limpa, brilho solar, eficiência energética moderna.",
    palettes: [
      "Branco Solar (#F8FAFC), Azul Painel Fotovoltaico (#0F172A), Amarelo Sol (#F59E0B) e Verde Sustentável (#059669)",
      "Dark CleanTech: Azul Meia-Noite (#090D16), Laranja Solar (#EA580C), Esmeralda (#10B981) e Branco (#FFFFFF)",
      "Gelo Tecnológico (#F1F5F9), Azul Royal (#1D4ED8), Ouro Solar (#EAB308) e Grafite (#1E293B)",
    ],
    fonts: "Títulos em 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Economia de Até 95% na Conta de Energia", "Projeto Homologado na Concessionária", "Painéis e Inversores Tier-1 com Garantia", "Simulação Gratuita pelo WhatsApp"],
  },
  oficina: {
    label: "Oficina Mecânica, Auto Center & Estética Automotiva",
    positioning: "Diagnóstico computadorizado preciso, peças genuínas com garantia, transparência mecânica total e revisão de confiança.",
    atmosphere: "Performance Garage & Precision Auto — estilo Porsche Service / Bosch Car Service, oficina limpa, técnica e moderna.",
    palettes: [
      "Grafite Carbono (#09090B), Vermelho Performance (#DC2626), Prata Metálico (#E4E4E7) e Âmbar (#F59E0B)",
      "Branco Oficina Clean (#F8FAFC), Azul Mecânica (#0F172A), Laranja Racing (#EA580C) e Aço (#334155)",
      "Azul Meia-Noite (#0B132B), Amarelo Diagnóstico (#EAB308), Vermelho Sport (#E11D48) e Branco (#FFFFFF)",
    ],
    fonts: "Títulos em 'Outfit' + Corpo em 'Inter'",
    trustBadges: ["Diagnóstico Eletrônico Computadorizado", "Peças Originais & Garantia de Serviço", "Orçamento Transparente Antes do Reparo", "Mecânicos Especializados Multimarcas"],
  },
  petshop: {
    label: "Pet Shop, Clínica Veterinária & Banho e Tosa",
    positioning: "Carinho incondicional pelo seu pet, banho e tosa sem estresse com produtos hipoalergênicos e cuidado veterinário completo.",
    atmosphere: "Warm Pet Care & Vet Boutique — alegre, acolhedor, confiável, higienizado e cheio de afeto.",
    palettes: [
      "Creme Acolhedor (#FFFDF9), Verde Veterinário (#0D9488), Laranja Carinho (#F97316) e Grafite (#1E293B)",
      "Branco Puro (#FFFFFF), Azul Pet Care (#0284C7), Amarelo Alegre (#FACC15) e Ardósia (#0F172A)",
      "Areia Suave (#FAF8F5), Coral Afeto (#E11D48), Esmeralda (#059669) e Carvão (#18181B)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Plus Jakarta Sans' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Banho & Tosa com Produtos Hipoalergênicos", "Ambiente Monitorado e Livre de Estresse", "Consultório Veterinário, Vacinas e Rações", "Táxi Dog & Agendamento pelo WhatsApp"],
  },
  fitness: {
    label: "Academia, Studio Fitness, CrossFit & Personal",
    positioning: "Transformação física real, equipamentos de biomecânica avançada, acompanhamento próximo e energia motivadora.",
    atmosphere: "High-Energy Athletic Club — estilo Equinox / Nike Training, dinamismo, força e resultado.",
    palettes: [
      "Preto Carbono (#09090B), Verde Neon Performance (#10B981), Cinza Titânio (#27272A) e Branco (#FAFAFA)",
      "Grafite Intenso (#111827), Laranja Energia (#F97316), Amarelo Força (#FACC15) e Branco (#FFFFFF)",
      "Branco Atlético (#F8FAFC), Preto Puro (#09090B), Vermelho Pulso (#E11D48) e Aço (#334155)",
    ],
    fonts: "Títulos em 'Syne' ou 'Outfit' + Corpo em 'Inter'",
    trustBadges: ["Profissionais Certificados (CREF)", "Equipamentos Modernos & Climatizados", "Treinos Personalizados por Objetivo", "Agende Sua Aula Experimental"],
  },
  loja: {
    label: "Loja, Boutique de Moda & Varejo",
    positioning: "Curadoria de tendências, peças com caimento impecável, atendimento de personal stylist e envio rápido.",
    atmosphere: "Editorial Fashion Flagship — estilo Zara Studio / Farfetch, fotografia em destaque, tipografia elegante e vitrine irresistível.",
    palettes: [
      "Off-White Editorial (#FAF8F5), Preto Couture (#111111), Champagne (#D4AF37) e Areia (#E7E5E4)",
      "Branco Galeria (#FFFFFF), Terracota Fashion (#C2410C), Bronze (#A16207) e Grafite (#18181B)",
      "Dark Boutique: Ônix (#09090B), Ouro Rose (#E5C158), Marfim Seda (#FAF7F2)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Syne' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Coleção Exclusiva & Peças Selecionadas", "Atendimento Personalizado via WhatsApp", "Troca Fácil & Entrega Rápida", "Parcelamento Facilitado"],
  },
  costura: {
    label: "Ateliê de Alta Costura, Alfaiataria & Ajustes",
    positioning: "Caimento sob medida, acabamento artesanal invisível, reforma de roupas finas e modelagem exclusiva.",
    atmosphere: "Bespoke Atelier & Tailoring — linho natural, tesoura de alfaiate, fita métrica, elegância artesanal.",
    palettes: [
      "Linho Natural (#FAF7F2), Bronze Alfaiate (#92400E), Carvão (#1C1917) e Dourado (#D4AF37)",
      "Marfim Seda (#FDFBF9), Borgonha Veludo (#881337), Ouro Velho (#B45309) e Preto (#18181B)",
      "Branco Ateliê (#FAFAFA), Azul Marinho Alfaiataria (#0F172A), Champagne (#C5A059)",
    ],
    fonts: "Títulos em 'Cormorant Garamond' ou 'Playfair Display' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Acabamento Artesanal de Alta Precisão", "Ajustes em Ternos, Vestidos de Festa e Jeans", "Atendimento com Prova Sob Medida", "Pontualidade Garantida na Entrega"],
  },
  tecnologia: {
    label: "Tecnologia, Assistência Técnica & Soluções de TI",
    positioning: "Reparo avançado em placas, notebooks e smartphones, infraestrutura de TI segura e diagnóstico rápido.",
    atmosphere: "Silicon Valley Hardware & Cyber Lab — precisão eletrônica, visual limpo de estilo Apple Care / Linear.",
    palettes: [
      "Preto Espacial (#09090B), Azul Ciano Tech (#06B6D4), Índigo (#4F46E5) e Branco (#F8FAFC)",
      "Branco Apple (#F8FAFC), Grafite Titânio (#0F172A), Azul Sistema (#2563EB) e Prata (#E2E8F0)",
      "Ardósia Escura (#0B132B), Verde Circuito (#10B981), Ciano (#38BDF8) e Branco (#FFFFFF)",
    ],
    fonts: "Títulos em 'Outfit' ou 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Laboratório Técnico Especializado", "Peças de Alta Qualidade com Garantia", "Diagnóstico Rápido & Backup Seguro", "Atendimento Corporativo e Residencial"],
  },
  marketing: {
    label: "Agência de Marketing Digital, Tráfego & Growth",
    positioning: "Escala previsível de vendas, tráfego pago de alto ROI, posicionamento de marca premium e funis de conversão.",
    atmosphere: "Awwwards Creative Growth Agency — ousado, moderno, métricas de impacto, gradientes sutis de luxo.",
    palettes: [
      "Preto Agência (#09090B), Violeta Growth (#7C3AED), Esmeralda ROI (#10B981) e Branco (#FAFAFA)",
      "Off-White Studio (#FAF8F5), Preto Intenso (#111111), Laranja Criativo (#EA580C) e Índigo (#4F46E5)",
      "Azul Meia-Noite (#0B0F19), Ciano Performance (#06B6D4), Dourado (#F59E0B) e Branco (#FFFFFF)",
    ],
    fonts: "Títulos em 'Syne' ou 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Estratégias Focadas em Vendas e ROI", "Gestão Profissional de Google & Meta Ads", "Relatórios Claros de Performance", "Consultoria Estratégica pelo WhatsApp"],
  },
  seguros: {
    label: "Corretora de Seguros, Planos de Saúde & Patrimônio",
    positioning: "Proteção patrimonial completa, cotação multicálculo nas maiores seguradoras e assistência 24h em sinistros.",
    atmosphere: "Private Banking & Family Shield — segurança, estabilidade, acolhimento familiar e solidez.",
    palettes: [
      "Branco Confiança (#F8FAFC), Azul Seguro (#0A2540), Dourado Proteção (#C5A059) e Esmeralda (#059669)",
      "Marfim Patrimonial (#FAF8F5), Verde Britânico (#14532D), Bronze (#B45309) e Grafite (#1E293B)",
      "Azul Noite Corporativo (#0F172A), Azul Celeste (#0284C7), Ouro (#D97706) e Branco (#FFFFFF)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Plus Jakarta Sans' + Corpo em 'Inter'",
    trustBadges: ["Corretora Habilitada SUSEP", "Cotação nas Maiores Seguradoras do País", "Suporte Ágil e Humanizado em Sinistros", "Seguro Auto, Vida, Saúde e Empresarial"],
  },
  autonomo: {
    label: "Profissional Especialista & Serviços Técnicos",
    positioning: "Atendimento técnico pontual, execução limpa e segura, ferramentas profissionais e garantia total do serviço.",
    atmosphere: "Master Craftsman & Reliable Pro — clareza, confiança imediata, apresentação impecável.",
    palettes: [
      "Branco Profissional (#F8FAFC), Azul Marinho (#0F172A), Âmbar Destaque (#D97706) e Ardósia (#334155)",
      "Grafite Técnico (#18181B), Laranja Ação (#EA580C), Azul Confiança (#0284C7) e Branco (#FFFFFF)",
      "Areia Neutra (#FAF8F5), Verde Segurança (#059669), Carvão (#1C1917) e Ouro (#CA8A04)",
    ],
    fonts: "Títulos em 'Outfit' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Atendimento Rápido com Hora Marcada", "Orçamento Justo e Sem Compromisso", "Serviço Limpo com Garantia de Qualidade", "Avaliação 5 Estrelas pelos Clientes"],
  },
  geral: {
    label: "Excelência em Serviços & Atendimento Premium",
    positioning: "Referência regional em qualidade, atendimento personalizado de alto padrão e soluções sob medida.",
    atmosphere: "Contemporary Flagship Brand — sofisticação atemporal, contraste perfeito e experiência digital fluida.",
    palettes: [
      "Marfim Contemporâneo (#FAF8F5), Grafite Profundo (#18181B), Champagne Dourado (#C5A059) e Ardósia (#334155)",
      "Branco Puro (#F8FAFC), Azul Meia-Noite (#0F172A), Esmeralda Nobre (#059669) e Prata (#E2E8F0)",
      "Dark Luxury: Ônix (#09090B), Dourado Acetinado (#D4AF37), Branco Seda (#FAFAFA)",
    ],
    fonts: "Títulos em 'Playfair Display' ou 'Plus Jakarta Sans' + Corpo em 'Plus Jakarta Sans'",
    trustBadges: ["Referência de Qualidade na Região", "Atendimento Exclusivo & Personalizado", "Compromisso com a Satisfação Total", "Contato Rápido via WhatsApp"],
  },
};

/**
 * Retorna a Direção de Arte e Arquitetura guiada 100% pelo Nicho Canônico/Sub-nicho do Lead,
 * combinando a identidade semântica da Tag com 3 variações arquitetônicas de luxo (para o botão "Trocar Modelo")
 * e entregando os serviços já pareados 1:1 com suas respectivas fotos em alta definição.
 */
export function getNicheDesignDirection(
  nicheRaw?: string | null,
  companyNameRaw?: string | null,
  variantIndex = 0,
): NicheDesignDirection {
  const subKey = detectSpecializedSubNicheKey(nicheRaw, companyNameRaw);
  const baseKey = detectNicheKey(nicheRaw, companyNameRaw);
  const profile =
    NICHE_AESTHETIC_PROFILES[subKey] ||
    NICHE_AESTHETIC_PROFILES[baseKey] ||
    NICHE_AESTHETIC_PROFILES.geral;

  const safeIdx = Math.abs(variantIndex) % 3;
  const palette = profile.palettes[safeIdx] || profile.palettes[0];
  const pairedServices = getPairedCatalogForBusiness(nicheRaw, companyNameRaw);

  // Garante que a foto do Hero e a foto do Ambiente ("Nosso Espaço") NUNCA repitam nenhuma das 4 fotos dos cards de serviços e pertençam 100% ao nicho/sub-nicho exato!
  const gallery = NICHE_GALLERIES[subKey] || NICHE_GALLERIES[baseKey] || NICHE_GALLERIES.geral;
  const serviceBaseUrls = new Set(pairedServices.map((s) => s.image_url.split("?")[0]));
  const distinctGalleryCovers = (gallery.covers || [])
    .map((c) => c.url.replace(/w=\d+/g, "w=1200").replace(/q=\d+/g, "q=85"))
    .filter((u) => !serviceBaseUrls.has(u.split("?")[0]));

  const allNicheCovers = (gallery.covers || []).map((c) =>
    c.url.replace(/w=\d+/g, "w=1200").replace(/q=\d+/g, "q=85"),
  );

  const availableScenePhotos = [...distinctGalleryCovers, ...allNicheCovers];
  const heroPhotoUrl =
    availableScenePhotos[0] ||
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85";
  const ambientPhotoUrl =
    availableScenePhotos.find((u) => u.split("?")[0] !== heroPhotoUrl.split("?")[0]) ||
    heroPhotoUrl;

  const LAYOUT_VARIANTS = [
    {
      variantName: `Editorial Boutique & Vitrine Fotográfica (${profile.label})`,
      navbar:
        "Header fixo de largura total ('sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-black/5 px-6 py-4') com container interno 'max-w-7xl mx-auto flex items-center justify-between'. PROIBIDO criar navbar pill estreita que deixe títulos vazando por trás ao rolar a página!",
      heroConcept:
        "HERO ASSIMÉTRICO DE LUXO (60/40) COM ALINHAMENTO PERFEITO ('py-16 lg:py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'): Coluna esquerda (7 cols) com badge da especialidade do nicho, headline magnética em alta tipografia, subtítulo persuasivo, botões de Agendamento/WhatsApp e selo de avaliação 5 estrelas do Google; Coluna direita (5 cols) com composição fotográfica imponente em moldura 'relative rounded-3xl shadow-2xl overflow-hidden aspect-[4/5]' exibindo a FOTO PRINCIPAL DO HERO com um badge de vidro INTERNO ('absolute bottom-4 left-4 right-4 backdrop-blur-md bg-white/90 p-4 rounded-2xl'). PROIBIDO usar cards com negative right ('-right-8') vazando para fora da foto!",
      servicesLayout:
        "VITRINE FOTOGRÁFICA DE SERVIÇOS NIVELADA (OBRIGATÓRIO ALINHAMENTO HORIZONTAL DE ALTURA): Seção com 'py-24 scroll-mt-24'. Grid responsivo de 4 colunas ('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'). CADA CARD DEVE TER OBRIGATORIAMENTE 'flex flex-col h-full rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all': (1) Topo com imagem 'relative h-52 w-full overflow-hidden shrink-0' e <img src='URL_PAREADA' class='w-full h-full object-cover'> + badge no canto superior esquerdo; (2) Corpo 'flex flex-col flex-1 p-6' com título, descrição e rodapé 'mt-auto pt-4 border-t flex items-center justify-between' para que TODOS os preços e botões fiquem 100% alinhados na mesma linha horizontal!",
      signatureSection:
        "SEÇÃO SOBRE NOSSO ESPAÇO & DIFERENCIAIS ('py-24 scroll-mt-24'): Grid 2 colunas alinhadas pelo centro ('grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'): Coluna da foto usando a FOTO DO AMBIENTE em 'rounded-3xl overflow-hidden shadow-xl aspect-[4/3]' (SEM cards pendurados para fora da borda da imagem!) e Coluna de texto com título editorial, narrativa sobre o espaço e grid 2x2 dos 4 pilares de excelência com ícones Lucide.",
      locationLayout:
        "SPLIT DE LOCALIZAÇÃO & ACOLHIMENTO ('py-24 scroll-mt-24'): Coluna esquerda com endereço verificado, horários de atendimento e os 2 botões oficiais de GPS ('📍 Traçar Rota no Google Maps' e '🚗 Abrir no Waze'); Coluna direita com o iframe do Google Maps em 'rounded-3xl shadow-xl border h-80 w-full'.",
    },
    {
      variantName: `Immersive Flagship & Bento Showcase (${profile.label})`,
      navbar:
        "Header executivo de largura total ('sticky top-0 z-50 w-full backdrop-blur-xl border-b px-6 py-4') com container 'max-w-7xl mx-auto flex items-center justify-between', logotipo tipográfico elegante e botão de ação destacado",
      heroConcept:
        "HERO CINEMATOGRÁFICO COM PAINEL DE VIDRO ('relative py-20 lg:py-28 overflow-hidden'): Grande fotografia de capa (FOTO PRINCIPAL DO HERO) com overlay gradiente calibrado na paleta do nicho; container 'max-w-7xl mx-auto px-6' com headline impactante, CTA principal e 3 cards de vidro alinhados em grid ('grid grid-cols-1 md:grid-cols-3 gap-4 mt-12') destacando reputação Google, especialidade e atendimento.",
      servicesLayout:
        "BENTO GRID FOTOGRÁFICO DE ESPECIALIDADES NIVELADO ('py-24 scroll-mt-24'): Grid 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'. Cada card com 'flex flex-col h-full rounded-3xl border shadow-lg overflow-hidden group', fotografia de alta resolução ('h-52 w-full object-cover shrink-0') no topo, corpo 'flex flex-col flex-1 p-6' e rodapé 'mt-auto pt-4 flex items-center justify-between' alinhado na base.",
      signatureSection:
        "JORNADA DO CLIENTE EM 3 ETAPAS + SOBRE NOSSO ESPAÇO ('py-24 scroll-mt-24'): Bloco duplo alinhado apresentando a FOTO DO AMBIENTE em moldura 'rounded-3xl overflow-hidden aspect-[4/3]' (sem elementos vazando para fora) + 3 etapas claras do atendimento e FAQ em tags '<details class=\"group rounded-2xl border p-5\">'.",
      locationLayout:
        "PAINEL INTEGRADO DE VISITA & MAPA INTERATIVO ('py-24 scroll-mt-24'): Card panorâmico de localização com mapa Google Maps embutido e barra de ação rápida para Waze, Google Maps e WhatsApp.",
    },
    {
      variantName: `Architectural Split & Prestige Gallery (${profile.label})`,
      navbar:
        "Barra superior de largura total ('sticky top-0 z-50 w-full backdrop-blur-xl border-b px-6 py-4') com container 'max-w-7xl mx-auto flex items-center justify-between', selo de avaliação Google e CTA em formato pill",
      heroConcept:
        "HERO ARCHITECTURAL SPLIT ('py-16 lg:py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'): Coluna esquerda com proposta única de valor do nicho, CTAs e prova social; Coluna direita com a FOTO PRINCIPAL DO HERO em 'rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]' e selos alinhados abaixo da foto.",
      servicesLayout:
        "GALERIA DE PROCEDIMENTOS / PRODUTOS COM FOTOS HD NIVELADAS ('py-24 scroll-mt-24'): Grid 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch' onde cada card possui 'flex flex-col h-full rounded-3xl border overflow-hidden', imagem exata pareada ('h-52 w-full object-cover shrink-0'), corpo 'flex flex-col flex-1 p-6' e rodapé de preço/botão com 'mt-auto pt-4 flex items-center justify-between'.",
      signatureSection:
        "ESTRUTURA & PROVA SOCIAL ('py-24 scroll-mt-24'): Apresentação do espaço com a FOTO DO AMBIENTE + 3 depoimentos autênticos contextualizados no nicho com 5 estrelas em cards de mesma altura ('h-full flex flex-col justify-between').",
      locationLayout:
        "ESTAÇÃO DE NAVEGAÇÃO GPS & CONTATO DIRETO ('py-24 scroll-mt-24'): Bloco duplo com iframe do mapa à esquerda e cartão concierge à direita com botões grandes para Google Maps, Waze e WhatsApp.",
    },
  ];

  const chosenLayout = LAYOUT_VARIANTS[safeIdx];

  return {
    nicheKey: subKey,
    canonicalTagLabel: profile.label,
    variantName: chosenLayout.variantName,
    positioning: profile.positioning,
    atmosphere: profile.atmosphere,
    palette: palette,
    fonts: profile.fonts,
    navbar: chosenLayout.navbar,
    heroConcept: chosenLayout.heroConcept,
    servicesLayout: chosenLayout.servicesLayout,
    signatureSection: chosenLayout.signatureSection,
    locationLayout: chosenLayout.locationLayout,
    trustBadges: profile.trustBadges,
    heroPhotoUrl,
    ambientPhotoUrl,
    pairedServices,
  };
}

/**
 * Identifica o rótulo semântico exato de qualquer URL conhecida do acervo curado ou presets de serviços.
 * Permite que o servidor recupere a descrição exata da imagem mesmo quando recebe apenas string[] de URLs.
 */
export function describeKnownPhotoUrl(
  url: string,
  fallbackNiche?: string | null,
  fallbackBusinessName?: string | null,
): { label: string; isClientRealPhoto: boolean } {
  const cleanTarget = (url || "").split("?")[0].trim();
  const isUnsplash = /images\.unsplash\.com/i.test(cleanTarget);

  if (!isUnsplash) {
    return {
      label: "Foto autêntica real do estabelecimento (usar em Hero, Fachada, Ambiente ou Galeria Real)",
      isClientRealPhoto: true,
    };
  }

  // 1. Procura nos sub-nichos especializados
  for (const list of Object.values(SUB_NICHE_PAIRED_CATALOGS)) {
    for (const item of list) {
      if (item.image_url.split("?")[0] === cleanTarget) {
        return {
          label: `${item.photo_label} (Ideal para o card "${item.name}")`,
          isClientRealPhoto: false,
        };
      }
    }
  }

  // 2. Procura no catálogo do nicho atual primeiro (para dar o rótulo mais específico daquele nicho)
  if (fallbackNiche || fallbackBusinessName) {
    const currentCatalog = getPairedCatalogForBusiness(fallbackNiche, fallbackBusinessName);
    for (const item of currentCatalog) {
      if (item.image_url.split("?")[0] === cleanTarget) {
        return {
          label: `${item.photo_label} (Ideal para o card "${item.name}")`,
          isClientRealPhoto: false,
        };
      }
    }
    const currentGallery = getGalleryForNiche(fallbackNiche || fallbackBusinessName);
    for (const cover of currentGallery.covers || []) {
      if (cover.url.split("?")[0] === cleanTarget) {
        return {
          label: cover.label,
          isClientRealPhoto: false,
        };
      }
    }
  }

  // 3. Procura em todas as galerias curadas
  for (const gallery of Object.values(NICHE_GALLERIES)) {
    for (const cover of gallery.covers || []) {
      if (cover.url.split("?")[0] === cleanTarget) {
        return {
          label: cover.label,
          isClientRealPhoto: false,
        };
      }
    }
  }

  // 4. Procura em todas as variantes de presets
  for (const variants of Object.values(NICHE_PRESETS_VARIANTS)) {
    for (const v of variants) {
      for (const s of v.services || []) {
        if (s.image_url && s.image_url.split("?")[0] === cleanTarget) {
          return {
            label: `${s.name} — ${s.description}`,
            isClientRealPhoto: false,
          };
        }
      }
    }
  }

  return {
    label: `Imagem profissional de alta resolução (${fallbackNiche || " institucional"})`,
    isClientRealPhoto: false,
  };
}

