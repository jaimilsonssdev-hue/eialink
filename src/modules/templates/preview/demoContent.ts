import type { PublicBio, PublicLink } from "@/components/public-profile/types";
import type { CatalogItem } from "@/modules/products/types";
import type { TemplateCategory, TemplateDefinition } from "../types";

type DemoContent = {
  bio: PublicBio;
  links: PublicLink[];
  products: CatalogItem[];
};

type DemoSpec = {
  name: string;
  description: string;
  cover: string;
  links: string[];
  whatsappLabel: string;
  products: Array<{ name: string; description: string; price: number; label: string }>;
};

const COVERS = {
  restaurant: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  clinic: "/template-assets/niche-covers/clinic-eialink-cover.webp",
  therapy: "/template-assets/niche-covers/therapy-eialink-cover.webp",
  academy: "/template-assets/niche-covers/academy-eialink-cover.webp",
  law: "/template-assets/niche-covers/law-eialink-cover.webp",
  store: "/template-assets/niche-covers/store-eialink-cover.webp",
  beauty: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  business: "/template-assets/niche-covers/business-eialink-cover.webp",
  creator: "/template-assets/niche-covers/creator-eialink-cover.webp",
  portfolio: "/template-assets/niche-covers-v2/real-estate-cover.webp",
  premium: "/template-assets/niche-covers-v2/pet-shop-cover.webp",
  minimal: "/template-assets/niche-covers-v2/technology-cover.webp",
} satisfies Record<TemplateCategory, string>;

const SPECS: Record<TemplateCategory, DemoSpec> = {
  restaurant: {
    name: "Casa Brasa",
    description: "Cozinha afetiva, fogo lento e entrega rápida no seu bairro.",
    cover: COVERS.restaurant,
    links: ["Cardápio completo", "Pedir pelo iFood", "Reservar mesa"],
    whatsappLabel: "Pedir agora",
    products: [
      { name: "Costela na brasa", description: "8h de fogo lento, serve 2", price: 89.9, label: "Pedir" },
      { name: "Combo executivo", description: "Prato + bebida + sobremesa", price: 39.9, label: "Pedir" },
    ],
  },
  clinic: {
    name: "Clínica Vitalis",
    description: "Cuidado humano e diagnóstico preciso para toda a família.",
    cover: COVERS.clinic,
    links: ["Agendar consulta", "Convênios atendidos", "Nossa equipe"],
    whatsappLabel: "Falar com a recepção",
    products: [
      { name: "Check-up completo", description: "Exames + retorno incluso", price: 320, label: "Agendar" },
      { name: "Consulta clínica", description: "Atendimento em até 48h", price: 180, label: "Agendar" },
    ],
  },
  therapy: {
    name: "Espaço Respirar",
    description: "Psicoterapia online e presencial com acolhimento de verdade.",
    cover: COVERS.therapy,
    links: ["Como funciona", "Primeira sessão", "Depoimentos"],
    whatsappLabel: "Marcar conversa inicial",
    products: [
      { name: "Sessão individual", description: "50 minutos, online", price: 150, label: "Reservar" },
      { name: "Pacote mensal", description: "4 sessões com desconto", price: 540, label: "Reservar" },
    ],
  },
  academy: {
    name: "Studio Força",
    description: "Treinos guiados, avaliação física e resultado em 90 dias.",
    cover: COVERS.academy,
    links: ["Planos e horários", "Aula experimental", "Treino online"],
    whatsappLabel: "Quero treinar",
    products: [
      { name: "Plano trimestral", description: "Treino + avaliação física", price: 249, label: "Assinar" },
      { name: "Personal 1:1", description: "8 sessões no mês", price: 480, label: "Assinar" },
    ],
  },
  law: {
    name: "Ribeiro & Advogados",
    description: "Estratégia jurídica para famílias e empresas em todo o Brasil.",
    cover: COVERS.law,
    links: ["Áreas de atuação", "Consulta inicial", "Artigos e guias"],
    whatsappLabel: "Falar com um advogado",
    products: [
      { name: "Consultoria trabalhista", description: "Análise de caso em 24h", price: 350, label: "Solicitar" },
      { name: "Revisão contratual", description: "Parecer completo por escrito", price: 690, label: "Solicitar" },
    ],
  },
  store: {
    name: "Loja Aurora",
    description: "Novidades da vitrine com entrega em toda a cidade.",
    cover: COVERS.store,
    links: ["Ver catálogo", "Promoções da semana", "Trocas e envios"],
    whatsappLabel: "Comprar pelo WhatsApp",
    products: [
      { name: "Kit verão", description: "3 peças selecionadas", price: 149.9, label: "Comprar" },
      { name: "Bolsa artesanal", description: "Edição limitada", price: 219.9, label: "Comprar" },
    ],
  },
  beauty: {
    name: "Studio Lumi",
    description: "Beleza, autoestima e horários que cabem na sua rotina.",
    cover: COVERS.beauty,
    links: ["Tabela de serviços", "Agendar horário", "Antes e depois"],
    whatsappLabel: "Agendar horário",
    products: [
      { name: "Dia de noiva", description: "Cabelo, make e prova", price: 890, label: "Agendar" },
      { name: "Combo cabelo", description: "Corte + hidratação", price: 160, label: "Agendar" },
    ],
  },
  business: {
    name: "Marina Duarte",
    description: "Consultoria financeira para pequenos negócios crescerem com clareza.",
    cover: COVERS.business,
    links: ["Serviços", "Cases de clientes", "Agenda de diagnóstico"],
    whatsappLabel: "Solicitar orçamento",
    products: [
      { name: "Diagnóstico financeiro", description: "Relatório em 7 dias", price: 490, label: "Contratar" },
      { name: "Mentoria mensal", description: "2 encontros por mês", price: 980, label: "Contratar" },
    ],
  },
  creator: {
    name: "Duda Prado",
    description: "Conteúdo diário sobre criatividade, rotina e bastidores.",
    cover: COVERS.creator,
    links: ["Último vídeo", "Newsletter semanal", "Parcerias e mídia kit"],
    whatsappLabel: "Falar comigo",
    products: [
      { name: "Ebook criativo", description: "60 páginas + templates", price: 47, label: "Baixar" },
      { name: "Mentoria express", description: "1h de call individual", price: 320, label: "Reservar" },
    ],
  },
  portfolio: {
    name: "Atelier Norte",
    description: "Projetos autorais de arquitetura e interiores sob medida.",
    cover: COVERS.portfolio,
    links: ["Projetos selecionados", "Processo de trabalho", "Orçamento"],
    whatsappLabel: "Conversar sobre um projeto",
    products: [
      { name: "Projeto de interiores", description: "Planta + 3D + execução", price: 4900, label: "Solicitar" },
      { name: "Consultoria rápida", description: "Visita técnica de 2h", price: 690, label: "Solicitar" },
    ],
  },
  premium: {
    name: "Pet House",
    description: "Banho, tosa e hospedagem com carinho de segunda a domingo.",
    cover: COVERS.premium,
    links: ["Serviços e preços", "Leva e traz", "Hospedagem"],
    whatsappLabel: "Agendar banho",
    products: [
      { name: "Banho & tosa", description: "Porte pequeno e médio", price: 89, label: "Agendar" },
      { name: "Day care", description: "Diária com recreação", price: 120, label: "Agendar" },
    ],
  },
  minimal: {
    name: "Eia Link",
    description: "Sua presença digital completa em um único endereço.",
    cover: COVERS.minimal,
    links: ["Sobre mim", "Portfólio", "Fale comigo"],
    whatsappLabel: "Chamar no WhatsApp",
    products: [
      { name: "Consultoria digital", description: "Diagnóstico da sua presença", price: 290, label: "Contratar" },
      { name: "Setup completo", description: "Página pronta em 3 dias", price: 690, label: "Contratar" },
    ],
  },
};

const money = (value: number) => value;

function makeLinks(titles: string[]): PublicLink[] {
  return titles.map((title, index) => ({
    id: `demo-link-${index}`,
    bio_page_id: "demo",
    title,
    url: "https://eialink.com.br",
    icon: null,
    position: index,
    active: true,
    clicks: 0,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  })) as unknown as PublicLink[];
}

function makeProducts(spec: DemoSpec): CatalogItem[] {
  return spec.products.map((product, index) => ({
    id: `demo-product-${index}`,
    bio_page_id: "demo",
    type: index === 0 ? "product" : "service",
    name: product.name,
    description: product.description,
    price: money(product.price),
    image_url: null,
    button_label: product.label,
    button_url: null,
    position: index,
    active: true,
  }));
}

/** Demo content used to render a faithful, non-interactive preview of a template. */
export function templateDemoContent(template: TemplateDefinition): DemoContent {
  const spec = SPECS[template.category] ?? SPECS.minimal;
  const bio = {
    id: `demo-${template.id}`,
    user_id: "demo",
    slug: "demo",
    display_name: spec.name,
    description: spec.description,
    avatar_url: null,
    cover_url: spec.cover,
    cover_position: "center",
    cover_fit: "cover",
    cover_overlay: true,
    cover_overlay_opacity: 45,
    theme: "aurora",
    template_id: template.id,
    published: true,
    whatsapp: "5571999999999",
    whatsapp_message: "Olá! Vim pelo seu Eia Link.",
    whatsapp_button_label: spec.whatsappLabel,
    whatsapp_button_subtitle: "Resposta rápida em horário comercial",
    pix_key: null,
    instagram: "eialink",
    social_links: { instagram: "eialink", facebook: "eialink", youtube: "eialink" },
    motion_enabled: false,
    motion_entrance: "none",
    motion_cta: "none",
    motion_ambient: "none",
    views: 0,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  } as unknown as PublicBio;

  return { bio, links: makeLinks(spec.links), products: makeProducts(spec) };
}
