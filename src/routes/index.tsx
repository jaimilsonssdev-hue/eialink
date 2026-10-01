import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PublicPricingSection } from "@/components/billing/PublicPricingSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Crown,
  Dumbbell,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Play,
  QrCode,
  Radio,
  Scissors,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wand2,
  Zap,
} from "lucide-react";
import { pageSlugFromHostname } from "@/lib/public-page-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EiaLink — A Infraestrutura de Alta Conversão para Negócios Locais e Criadores" },
      {
        name: "description",
        content:
          "Transforme tráfego de redes sociais e clientes presenciais em vendas reais. Hub comercial com vitrine estilo Instagram, atendente com inteligência artificial, agendamento 24h e cartões de aproximação NFC.",
      },
      { property: "og:title", content: "EiaLink — Plataforma de Presença & Conversão Comercial" },
      {
        property: "og:description",
        content:
          "Vitrine estilo Instagram, atendente com IA para WhatsApp, agendamento Google e subdomínio próprio em uma experiência ultrarrápida.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eialink.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://eialink.com.br/" }],
  }),
  component: LandingPage,
});

/* -------------------------------------------------------------------------- */
/* 1. MODELOS REAIS CRIADOS NO PROJETO                                        */
/* -------------------------------------------------------------------------- */

interface NicheTemplate {
  id: string;
  niche: string;
  name: string;
  icon: typeof UtensilsCrossed;
  color: string;
  badge: string;
  city: string;
  coverImg: string;
  fallbackCover: string;
  headline: string;
  tagline: string;
  highlightProduct: {
    name: string;
    price: string;
    img: string;
    cta: string;
  };
  chatDemo: {
    user: string;
    bot: string;
  };
  statNumber: string;
  statLabel: string;
}

const REAL_TEMPLATES: NicheTemplate[] = [
  {
    id: "restaurant-menu",
    niche: "Gastronomia & Restaurantes",
    name: "Casa do Sabor & Brasa",
    icon: UtensilsCrossed,
    color: "#f97316",
    badge: "🔥 Cardápio Digital & Pedidos Diretos",
    city: "Salvador · Barra",
    coverImg: "/template-assets/restaurant-demo-cover.png",
    fallbackCover: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
    headline: "Cortes nobres na brasa, burgers artesanais e pedidos diretos no WhatsApp com zero taxas.",
    tagline: "Cardápio categorizado com fotos apetitosas e fechamento direto no WhatsApp.",
    highlightProduct: {
      name: "Smash Burger Duplo na Brasa",
      price: "R$ 42,90",
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      cta: "Pedir no WhatsApp",
    },
    chatDemo: {
      user: "Boa noite! Quero pedir 2 Smash Burgers com batata rústica.",
      bot: "Excelente escolha! O pedido foi formatado e direcionado para a cozinha no WhatsApp com entrega em até 35 min.",
    },
    statNumber: "3.2x",
    statLabel: "Mais pedidos diretos no WhatsApp",
  },
  {
    id: "clinic-care",
    niche: "Clínicas & Odontologia",
    name: "Instituto Dental Prime",
    icon: Stethoscope,
    color: "#0ea5e9",
    badge: "📅 Google Agenda Sincronizada 24h",
    city: "São Paulo · Jardins",
    coverImg: "/template-assets/clinic-demo-cover.png",
    fallbackCover: "/template-assets/niche-covers/clinic-eialink-cover.webp",
    headline: "Implantes sem dor, alinhadores invisíveis e estética do sorriso com agendamento online 24h.",
    tagline: "Autoridade médica institucional, especialidades e confirmação automática de horários.",
    highlightProduct: {
      name: "Avaliação 3D com Escaneamento",
      price: "R$ 180,00",
      img: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80",
      cta: "Agendar Avaliação",
    },
    chatDemo: {
      user: "Vocês atendem convênio ou apenas particular?",
      bot: "Atendemos particular com parcelamento em até 12x e emitimos recibo para reembolso integral do seu plano.",
    },
    statNumber: "85%",
    statLabel: "Menos tempo gasto marcando consultas",
  },
  {
    id: "beauty-glow",
    niche: "Estética & Bem-Estar",
    name: "Studio Glow Estética & Spa",
    icon: Scissors,
    color: "#ec4899",
    badge: "✨ Vitrine Visual de Procedimentos",
    city: "Belo Horizonte · Lourdes",
    coverImg: "/template-assets/beauty-demo-cover.png",
    fallbackCover: "/template-assets/niche-covers/beauty-eialink-cover.webp",
    headline: "Harmonização, estética facial avançada e protocolos exclusivos com reserva de horário VIP.",
    tagline: "Galeria vertical de procedimentos em alta resolução e antecipação de sinal.",
    highlightProduct: {
      name: "Limpeza de Pele Profunda VIP",
      price: "R$ 210,00",
      img: "https://images.unsplash.com/photo-1512290900672-1f02e604f58c?auto=format&fit=crop&w=400&q=80",
      cta: "Reservar Horário VIP",
    },
    chatDemo: {
      user: "Tem horário disponível para esta sexta à tarde?",
      bot: "Temos sim! Sexta-feira às 15h30 e 17h00. Deseja que eu reserve para você?",
    },
    statNumber: "+140",
    statLabel: "Novas avaliações 5★ com cartão NFC",
  },
  {
    id: "law-authority",
    niche: "Advocacia & Consultoria",
    name: "Toledo & Associados Advocacia",
    icon: ShieldCheck,
    color: "#d97706",
    badge: "⚖️ Triagem Consultiva com Atendente IA",
    city: "Brasília · Asa Sul",
    coverImg: "/template-assets/law-office-cover.png",
    fallbackCover: "/template-assets/niche-covers/law-eialink-cover.webp",
    headline: "Assessoria jurídica empresarial, tributária e proteção patrimonial de alto padrão.",
    tagline: "Posicionamento executivo de autoridade, áreas de atuação e triagem qualificada com IA.",
    highlightProduct: {
      name: "Diagnóstico Jurídico Preventivo",
      price: "Sob Consulta",
      img: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80",
      cta: "Falar com Advogado",
    },
    chatDemo: {
      user: "Gostaria de consultoria para reorganização societária da minha empresa.",
      bot: "Perfeito! Qual é o faturamento aproximado e quantos sócios compõem o quadro para o advogado te atender?",
    },
    statNumber: "100%",
    statLabel: "Leads qualificados antes da reunião",
  },
  {
    id: "store-showcase",
    niche: "Lojas & Catálogos",
    name: "Aura Concept Boutique",
    icon: ShoppingBag,
    color: "#8b5cf6",
    badge: "🛍️ Catálogo Estilo Stories com Sacola",
    city: "Curitiba · Batel",
    coverImg: "/template-assets/store-demo-cover.png",
    fallbackCover: "/template-assets/niche-covers/store-eialink-cover.webp",
    headline: "Moda autoral, alfaiataria contemporânea e catálogo interativo com sacola de compras.",
    tagline: "Fotos verticais estilo Stories com botão de compra imediata no WhatsApp.",
    highlightProduct: {
      name: "Blazer Linho Puro Italiano",
      price: "R$ 389,00",
      img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80",
      cta: "Pedir no WhatsApp",
    },
    chatDemo: {
      user: "Ainda tem o blazer tamanho M na cor areia?",
      bot: "Restam apenas 2 unidades no tamanho M! Deseja que eu separe agora para entrega ou retirada?",
    },
    statNumber: "4.8x",
    statLabel: "Mais cliques no link da sua marca",
  },
  {
    id: "academy-performance",
    niche: "Academia & Performance",
    name: "Power Studio & CrossFit",
    icon: Dumbbell,
    color: "#10b981",
    badge: "⚡ Matrícula Online & Planos",
    city: "Rio de Janeiro · Barra",
    coverImg: "/template-assets/academy-gym-cover.png",
    fallbackCover: "/template-assets/niche-covers/academy-eialink-cover.webp",
    headline: "Treinamento funcional, musculação de alta performance e matrícula instantânea com QR Code.",
    tagline: "Apresentação visual de modalidades, horários de aulas e planos mensais/anuais.",
    highlightProduct: {
      name: "Plano Black VIP (Acesso Livre)",
      price: "R$ 149,90/mês",
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
      cta: "Matricular Agora",
    },
    chatDemo: {
      user: "Quais são os horários das aulas de funcional?",
      bot: "Temos turmas às 06h30, 12h00, 18h30 e 19h30 de segunda a sexta. Quer agendar uma aula experimental?",
    },
    statNumber: "+220",
    statLabel: "Novos alunos matriculados via QR Code",
  },
];

/* -------------------------------------------------------------------------- */
/* 2. AS 4 GRANDES ARQUITETURAS DO SISTEMA                                    */
/* -------------------------------------------------------------------------- */

const ARCHITECTURES = [
  {
    badge: "🏛️ Alta Autoridade Local",
    title: "Site Institucional Completo (Máquina de Sites)",
    desc: "A estrutura mais completa para empresas locais, clínicas e escritórios que querem dominar sua região. Inclui barra utilitária de contato rápido, 5 opções de hero, vitrine Bento Grid, prova social do Google Maps com avaliações reais, diferenciais de bairro, mapa interativo de localização e FAQ sanfonado.",
    features: [
      "Barra utilitária com telefone e horário",
      "Bento Grid de diferenciais e serviços",
      "Avaliações 5 estrelas do Google Maps",
      "Mapa interativo com cálculo de rota",
    ],
    tag: "Modelo 'Site Máquina'",
  },
  {
    badge: "🎬 Alto Padrão Visual 60 FPS",
    title: "Landing Page Cinematográfica (Scrollytelling)",
    desc: "Projetada para marcas de luxo, estética nobre, alta gastronomia e especialistas de alto ticket. Uma experiência imersiva em 4 capítulos de tela cheia com efeito Parallax acelerado por GPU a 60 FPS, tipografia nobre editorial e estúdio escuro que transmite sofisticação imediata.",
    features: [
      "4 atos narrativos em tela cheia",
      "Efeito Parallax suave a 60 FPS via GPU",
      "Tipografia editorial nobre e sombras de estúdio",
      "Botão magnético de fechamento no WhatsApp",
    ],
    tag: "Modelo 'Cinematic Glass'",
  },
  {
    badge: "🛍️ Máxima Conversão de Vendas",
    title: "Vitrine & Catálogo Dinâmico Estilo Instagram",
    desc: "Elimine cardápios em PDF pesados de 20MB e formulários chatos. Seus produtos, pratos ou procedimentos são exibidos em carrossel vertical deslizante com fotos em proporção 4:5 (Stories), tags de 'Mais Vendido', preços claros, sacola de compras e fechamento em 1 clique direto no WhatsApp.",
    features: [
      "Carrossel vertical estilo Stories (4:5)",
      "Badges: 'Mais Pedido', 'Destaque', 'Promoção'",
      "Sacola flutuante de compras inteligente",
      "Mensagem já formatada para o atendente no WhatsApp",
    ],
    tag: "Modelo 'Storefront & Vitrine'",
  },
  {
    badge: "🤖 Atendimento & Agendamento 24h",
    title: "Bio Link Inteligente com IA & Google Agenda",
    desc: "A evolução definitiva do link da bio. Muito mais que meros botões: um atendente virtual com IA treinado para responder dúvidas do seu negócio, qualificar clientes, sincronizar agendamentos em tempo real no Google Calendar e conectar-se a cartões físicos por aproximação NFC.",
    features: [
      "Atendente Virtual IA conversacional integrado",
      "Agendamento direto no Google Calendar 24h",
      "Aproximação física com Cartões e Placas NFC",
      "Subdomínio exclusivo (suaempresa.eialink.com.br)",
    ],
    tag: "Modelo 'BioLink AAA & IA'",
  },
];

/* -------------------------------------------------------------------------- */
/* 3. COMPARATIVO DIRETO (SEM MENÇÃO A CONCORRENTES)                          */
/* -------------------------------------------------------------------------- */

const COMPARISON_ROWS = [
  {
    feature: "Apresentação & Layout",
    oldWay: "Lista fria e estática de botões cinzas empilhados",
    eiaWay: "Vitrines dinâmicas, Bento Grid e Parallax 60 FPS",
  },
  {
    feature: "Atendimento & Vendas",
    oldWay: "Visitante se perde, não é atendido e vai embora",
    eiaWay: "Atendente com Inteligência Artificial que qualifica e vende 24h",
  },
  {
    feature: "Pedidos & Fechamento",
    oldWay: "PDFs pesados de 20MB ou formulários frios",
    eiaWay: "1 clique no WhatsApp com foto, preço e pedido pronto",
  },
  {
    feature: "Agendamento de Horários",
    oldWay: "Troca interminável de mensagens manuais no chat",
    eiaWay: "Sincronizado automaticamente à Google Agenda sem conflitos",
  },
  {
    feature: "Conexão com Balcão Físico",
    oldWay: "Inexistente: nenhuma integração com o mundo real",
    eiaWay: "Cartão e Plaquinha de aproximação NFC de alta tecnologia",
  },
  {
    feature: "Domínio & Autoridade",
    oldWay: "plataforma-estranha.com/suamarca (fortalece marcas de terceiros)",
    eiaWay: "suaempresa.eialink.com.br ou seu próprio domínio .com.br",
  },
  {
    feature: "Taxas e Comissões",
    oldWay: "Comissões abusivas de até 27% sobre cada pedido",
    eiaWay: "0% de comissão: 100% do lucro é do seu negócio",
  },
];

/* -------------------------------------------------------------------------- */
/* 4. PERGUNTAS FREQUENTES                                                    */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "Por que o EiaLink é superior aos formatos tradicionais de links na bio?",
    a: "Formatos tradicionais são meras listas de botões estáticos que não transmitem autoridade e fazem 70% dos visitantes desistirem. O EiaLink é uma Infraestrutura de Conversão Comercial completa: reúne vitrines dinâmicas estilo Instagram, Atendente Virtual com IA para tirar dúvidas e qualificar clientes, agendamento 24h conectado ao Google Calendar, cartões de aproximação física NFC e subdomínio próprio em uma experiência ultraveloz.",
  },
  {
    q: "Eu pago comissão sobre as minhas vendas ou agendamentos?",
    a: "Zero! Ao contrário de plataformas e intermediários de delivery que cobram de 15% a 27% de taxas sobre tudo o que você vende, no EiaLink 100% das receitas e pagamentos vão diretamente para a sua conta via WhatsApp ou Pix.",
  },
  {
    q: "Como o Atendente Virtual com IA funciona na prática?",
    a: "É como ter um atendente comercial sênior trabalhando 24 horas por dia, 7 dias por semana. Ele conversa amigavelmente com quem acessa sua página, responde perguntas sobre produtos, serviços, preços ou procedimentos e entrega a pessoa qualificada na conversa do seu WhatsApp com o resumo exato do pedido ou solicitação.",
  },
  {
    q: "Como funciona a tecnologia de aproximação NFC no balcão?",
    a: "Você pode vincular sua página a um cartão de visitas de aproximação ou plaquinha de balcão NFC. Quando o cliente aproxima o smartphone (iPhone ou Android) do cartão, sua página abre em menos de 1 segundo na tela dele, sem necessidade de baixar aplicativos ou digitar endereços.",
  },
  {
    q: "Preciso ter conhecimento técnico para criar e editar minha página?",
    a: "Nenhum. O sistema disponibiliza modelos prontos de alto padrão para o seu ramo e conta com um Copiloto Criativo inteligente: você pode simplesmente solicitar ajustes em linguagem natural ('ajuste o preço do burger e mude a foto principal') e o sistema atualiza instantaneamente.",
  },
  {
    q: "Posso testar gratuitamente?",
    a: "Sim! Você pode criar sua conta gratuita, escolher o modelo ideal para a sua área e colocar sua vitrine profissional no ar em menos de 5 minutos, sem nenhum cadastro de cartão de crédito.",
  },
];

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL: LANDING PAGE                                         */
/* -------------------------------------------------------------------------- */

function LandingPage() {
  const [activeNiche, setActiveNiche] = useState<NicheTemplate>(REAL_TEMPLATES[0]);
  const [previewTemplate, setPreviewTemplate] = useState<NicheTemplate | null>(null);

  const subdomainSlug =
    typeof window === "undefined" ? null : pageSlugFromHostname(window.location.hostname);

  useEffect(() => {
    if (!subdomainSlug || window.location.pathname !== "/") return;
    window.location.replace(`/p/${subdomainSlug}${window.location.search}${window.location.hash}`);
  }, [subdomainSlug]);

  if (subdomainSlug && window.location.pathname === "/") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050508] px-5 text-center text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">EiaLink</p>
          <h1 className="mt-3 text-xl font-semibold">Abrindo sua página oficial...</h1>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-[#f4f4f7] selection:bg-purple-500/30 selection:text-purple-200 font-sans antialiased overflow-x-hidden">
      {/* Background Matrix & Subtle Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#1e1f2b_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-purple-700/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-cyan-600/10 blur-[130px] pointer-events-none" />
      </div>

      {/* Header / Navbar com a LOGO ORIGINAL PWA */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#06070a]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/icons/eia-link-icon.svg"
              alt="EIA Link"
              className="h-9 w-9 rounded-xl shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform object-contain"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center">
                EIA <span className="ml-1 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">LINK</span>
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] text-purple-300 uppercase leading-none mt-1">
                Hub de Conversão
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold text-zinc-400 lg:flex">
            <a href="#arquiteturas" className="hover:text-white transition-colors">
              Arquiteturas
            </a>
            <a href="#modelos" className="hover:text-white transition-colors">
              Modelos por Nicho
            </a>
            <a href="#diferenciais" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#comparativo" className="hover:text-white transition-colors">
              Por que EiaLink?
            </a>
            <a href="#precos" className="hover:text-white transition-colors">
              Planos
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="relative inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Criar Página Grátis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 mb-8 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Engenharia de Conversão Comercial com IA & NFC</span>
            <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
            Transforme seguidores em{" "}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent">
              clientes pagantes no WhatsApp.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg leading-relaxed">
            Abandone páginas genéricas e desorganizadas. Tenha um{" "}
            <strong className="text-white font-semibold">Hub Comercial de Alto Padrão</strong> com vitrine estilo Instagram, Atendente com IA para triagem automática, agendamento 24h e cartão de aproximação física NFC.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-105 active:scale-95"
            >
              <span>Criar Minha Página Grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#modelos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md"
            >
              <Eye className="h-4 w-4 text-purple-400" />
              <span>Ver Modelos Prontos</span>
            </a>
          </div>

          {/* Metrics & Proof Bar */}
          <div className="mt-14 pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold text-white">0.28s</b>
              <span className="text-xs text-zinc-400">Carregamento Instantâneo</span>
            </div>
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold text-white">24/7</b>
              <span className="text-xs text-zinc-400">Atendente IA Ativo</span>
            </div>
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold text-white">1 Toque</b>
              <span className="text-xs text-zinc-400">Aproximação NFC</span>
            </div>
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">0%</b>
              <span className="text-xs text-zinc-400">Taxas ou Comissões</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Showcase Studio Mockup */}
      <section className="relative -mt-6 pb-20 max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl border border-white/10 bg-[#0a0c14]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-3.5 bg-black/40">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-medium text-zinc-400 hidden sm:inline">
                https://seunegocio.eialink.com.br
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Página Oficial Ativa</span>
            </div>
          </div>

          {/* Split Mockup Content */}
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] items-center">
            {/* Left Side: Business Highlights in Real Studio */}
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-1.5 text-xs text-zinc-300">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Mais de 12.000 pedidos e agendamentos processados</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Toda a sua operação comercial reunida em uma página impecável.
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
                    <Flame className="h-4 w-4" />
                    <span>Vitrine Instagram</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Fotos em formato Stories com preços e fechamento direto no WhatsApp em 1 clique.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1.5">
                    <Bot className="h-4 w-4" />
                    <span>Atendente com IA</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Responde dúvidas, recomenda produtos e entrega o cliente pronto no seu WhatsApp.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1.5">
                    <CalendarCheck className="h-4 w-4" />
                    <span>Google Agenda 24h</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Seus clientes marcam horários sem você perder tempo trocando mensagens manuais.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm mb-1.5">
                    <Radio className="h-4 w-4" />
                    <span>Cartão & Placa NFC</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Aproxime o cartão físico e abra sua página no celular do cliente em 1 segundo.
                  </p>
                </div>
              </div>

              {/* Floating Notification */}
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <strong className="block text-white font-semibold">Novo Pedido no WhatsApp:</strong>
                  <span>"Smash Burger Duplo na Brasa + Batata Rústica · Mesa 04"</span>
                </div>
              </div>
            </div>

            {/* Right Side: Realistic Phone Mockup of Active Site */}
            <div className="relative mx-auto w-full max-w-[320px]">
              <div className="rounded-[2.5rem] border-[6px] border-[#1e2230] bg-[#0b0c12] p-3.5 shadow-2xl shadow-black">
                {/* Speaker Notch */}
                <div className="mx-auto h-4 w-28 rounded-full bg-[#1e2230] mb-3" />

                {/* Profile & Header com Capa Real */}
                <div className="relative rounded-2xl overflow-hidden mb-3.5">
                  <img
                    src="/template-assets/restaurant-demo-cover.png"
                    alt="Capa de demonstração"
                    className="h-28 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <div className="text-left text-white">
                      <b className="text-xs block leading-tight">Casa do Sabor & Brasa</b>
                      <span className="text-[10px] text-orange-300">suaempresa.eialink.com.br</span>
                    </div>
                  </div>
                </div>

                {/* Mini Product Carousel Card */}
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left mb-3">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                    <span>Destaque de Hoje</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Disponível
                    </span>
                  </div>
                  <div className="flex gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80"
                      alt="Prato"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div>
                      <b className="text-xs text-white block">Smash Burger Duplo</b>
                      <span className="text-xs font-bold text-orange-400">R$ 42,90</span>
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        <MessageCircle className="h-2.5 w-2.5" /> Pedir no Zap
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-[11px] font-medium">Reservar Mesa Online</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-medium">Atendente com IA</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 2. AS 4 GRANDES ARQUITETURAS DO SISTEMA                              */}
      {/* -------------------------------------------------------------------- */}
      <section id="arquiteturas" className="py-20 border-t border-white/[0.07] bg-[#07080e]/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">
              Estruturas de Engenharia Comercial
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              As 4 Grandes Arquiteturas Criadas no EiaLink
            </h2>
            <p className="text-sm text-zinc-400">
              Cada negócio exige um formato ideal de fechamento. Do site institucional completo à landing page cinematográfica de 60 FPS.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {ARCHITECTURES.map((arch, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#10121d] to-[#0a0b12] p-8 shadow-xl hover:border-purple-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                      {arch.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {arch.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                    {arch.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {arch.desc}
                  </p>

                  <div className="mt-6 pt-5 border-t border-white/[0.07] space-y-2">
                    {arch.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="#modelos"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>Explorar modelos com esta tecnologia</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. SHOWCASE DE MODELOS REAIS POR NICHO (COM PRÉVIA INTERATIVA)       */}
      {/* -------------------------------------------------------------------- */}
      <section id="modelos" className="py-20 border-t border-white/[0.07] bg-[#06070b]">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="space-y-3 max-w-3xl mx-auto mb-10">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Modelos Oficiais do Sistema</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Modelos de Alta Conversão Criados para o Seu Ramo
            </h2>
            <p className="text-sm text-zinc-400">
              Clique nos nichos abaixo para inspecionar os modelos reais desenvolvidos para a sua área.
            </p>
          </div>

          {/* Segment Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {REAL_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = activeNiche.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setActiveNiche(tpl)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105"
                      : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tpl.niche}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Showcase Stage */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080e] p-6 md:p-10 shadow-2xl text-left">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 mb-4">
                  <span>{activeNiche.badge}</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                  {activeNiche.name}
                </h3>
                <p className="text-xs text-purple-400 font-medium mt-1">{activeNiche.city}</p>

                <p className="text-sm sm:text-base text-zinc-300 mt-4 leading-relaxed">
                  {activeNiche.headline}
                </p>

                {/* Simulated Conversational IA Dialog */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Bot className="h-3.5 w-3.5" />
                      <span>Atendente IA em Ação</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Conversão Automática</span>
                  </div>

                  {/* Customer Question */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      C
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2 text-xs text-zinc-200">
                      {activeNiche.chatDemo.user}
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="rounded-2xl rounded-tr-sm bg-purple-600/30 border border-purple-500/30 px-3.5 py-2 text-xs text-purple-200 max-w-sm text-right">
                      {activeNiche.chatDemo.bot}
                    </div>
                    <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      IA
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => setPreviewTemplate(activeNiche)}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 text-white font-bold px-6 py-3.5 text-xs shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition-all hover:scale-105 active:scale-95"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Abrir Simulador do Modelo</span>
                  </button>

                  <Link
                    to="/auth"
                    search={{ mode: "signup" } as never}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-zinc-200 font-semibold px-5 py-3.5 text-xs hover:bg-white/[0.08] hover:text-white transition-all"
                  >
                    <span>Usar Este Modelo Grátis</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Showcase Cover & Mockup Card */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl group">
                  <img
                    src={activeNiche.coverImg}
                    alt={activeNiche.name}
                    className="h-80 sm:h-96 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = activeNiche.fallbackCover;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Overlaid Product Highlight */}
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-black/60 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                          Destaque de Conversão
                        </span>
                        <b className="text-sm font-bold text-white block">{activeNiche.highlightProduct.name}</b>
                        <span className="text-xs font-extrabold text-emerald-400">
                          {activeNiche.highlightProduct.price}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <b className="text-xl font-extrabold text-white">{activeNiche.statNumber}</b>
                        <span className="text-[10px] text-zinc-400">{activeNiche.statLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 4. OS 6 PILARES EXCLUSIVOS DE CONVERSÃO                              */}
      {/* -------------------------------------------------------------------- */}
      <section id="diferenciais" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Diferenciais Competitivos</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tudo o que uma Empresa Precisa para Vender Mais
          </h2>
          <p className="text-sm text-zinc-400">
            Muito além de uma lista estática. Uma infraestrutura comercial moderna que gera vendas reais.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Atendente IA */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-emerald-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Bot className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Atendimento 24/7
            </span>
            <h3 className="text-lg font-bold text-white">Atendente Virtual com IA</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tira dúvidas sobre procedimentos, cardápios e valores, qualifica o lead e direciona a conversa pronta para o WhatsApp.
            </p>
          </div>

          {/* Card 2: NFC & Do Físico ao Digital */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-pink-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1">
              Do Físico ao Digital
            </span>
            <h3 className="text-lg font-bold text-white">Tecnologia NFC & QR Code</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Basta encostar o smartphone no cartão físico ou plaquinha de balcão para sua vitrine abrir instantaneamente.
            </p>
          </div>

          {/* Card 3: Google Agenda */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-sky-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
              Sem Conflitos
            </span>
            <h3 className="text-lg font-bold text-white">Google Agenda Integrada</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Seus pacientes ou clientes escolhem horários disponíveis na sua agenda e o compromisso é gravado automaticamente.
            </p>
          </div>

          {/* Card 4: Vitrine Instagram */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-purple-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <Flame className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
              Alto Desejo
            </span>
            <h3 className="text-lg font-bold text-white">Vitrine Estilo Stories</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Fotos em proporção 4:5 com preço, badge de disponibilidade e botão direto de fechamento no WhatsApp.
            </p>
          </div>

          {/* Card 5: Scrollytelling Parallax */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-amber-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Layers className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Visual Cinematográfico
            </span>
            <h3 className="text-lg font-bold text-white">Parallax GPU a 60 FPS</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Movimentos fluidos e iluminação de estúdio que transmitem imediatamente a sensação de serviço de alto valor.
            </p>
          </div>

          {/* Card 6: Subdomínio Próprio */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f111a] to-[#07080d] p-7 hover:border-indigo-500/30 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <Globe className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
              Sua Própria Marca
            </span>
            <h3 className="text-lg font-bold text-white">Subdomínio & Domínio Próprio</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Receba um endereço oficial gratuito (suaempresa.eialink.com.br) ou conecte seu domínio .com.br com SSL bancário.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 5. TABELA COMPARATIVA (SEM MENÇÃO A CONCORRENTES)                    */}
      {/* -------------------------------------------------------------------- */}
      <section id="comparativo" className="py-20 border-t border-white/[0.07] bg-[#07080d]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Comparativo Direto</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              O Fim dos Links Antigos e Amadores
            </h2>
            <p className="text-sm text-zinc-400">
              Veja por que manter uma página estática ultrapassada está custando vendas todos os dias.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0c0e15] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-5 px-6 font-semibold">Critério Comercial</th>
                  <th className="py-5 px-6 font-semibold text-rose-400 bg-rose-950/20">Formatos Antigos & Estáticos</th>
                  <th className="py-5 px-6 font-semibold text-emerald-300 bg-emerald-950/30 border-l border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>A Máquina EiaLink</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{row.feature}</td>
                    <td className="py-4 px-6 text-rose-300/80 bg-rose-950/10">
                      <span className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✕</span> {row.oldWay}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-emerald-200 font-semibold bg-emerald-950/20 border-l border-emerald-500/20">
                      <span className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{row.eiaWay}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 6. ENGENHARIA PROPRIETÁRIA DE ALTA PERFORMANCE                       */}
      {/* -------------------------------------------------------------------- */}
      <section id="infraestrutura" className="py-20 max-w-7xl mx-auto px-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1017] to-[#07080d] p-8 md:p-14 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Engenharia Proprietária</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Nuvem de Alta Performance & Blindagem
            </h2>
            <p className="text-sm text-zinc-400">
              Sua página nunca cai, carrega instantaneamente e garante segurança absoluta para os dados dos seus clientes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Zap className="h-8 w-8 text-amber-400 mb-3" />
              <h4 className="font-bold text-white text-sm">Carregamento 0.28s</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Servidores distribuídos globalmente para abrir na velocidade da luz em qualquer rede móvel.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Lock className="h-8 w-8 text-purple-400 mb-3" />
              <h4 className="font-bold text-white text-sm">Criptografia SSL</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Certificados de segurança automáticos com blindagem de dados padrão bancário.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <ShieldCheck className="h-8 w-8 text-emerald-400 mb-3" />
              <h4 className="font-bold text-white text-sm">Uptime 99.9%</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Estrutura em nuvem redundante que suporta milhares de acessos simultâneos sem lentidão.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Smartphone className="h-8 w-8 text-cyan-400 mb-3" />
              <h4 className="font-bold text-white text-sm">Tecnologia PWA</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Seu cliente pode instalar o seu link como um app nativo na tela inicial do smartphone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 7. PREÇOS & PLANOS                                                   */}
      {/* -------------------------------------------------------------------- */}
      <section id="precos" className="py-20 border-t border-white/[0.07] bg-[#07080d]/60">
        <PublicPricingSection />
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 8. PERGUNTAS FREQUENTES                                              */}
      {/* -------------------------------------------------------------------- */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Perguntas Frequentes</p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Tudo o Que Você Precisa Saber
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 data-[state=open]:bg-white/[0.05] transition-all"
            >
              <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline text-left py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-zinc-400 pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 9. CHAMADA FINAL PARA AÇÃO (CTA)                                    */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950 via-[#0d1020] to-[#07080d] p-8 md:p-14 shadow-2xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Comece agora mesmo em menos de 5 minutos</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Seu próximo cliente está a um toque do seu WhatsApp.
              </h2>
              <p className="mt-3 text-sm text-zinc-300 max-w-xl">
                Crie sua presença de alto padrão com vitrine, atendente IA e agendamento online hoje mesmo.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" } as never}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 font-bold px-7 py-4 text-sm shadow-xl hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Criar Minha Página Grátis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 10. FOOTER COM A LOGO ORIGINAL PWA                                   */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-white/[0.08] bg-[#050608] py-14">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/icons/eia-link-icon.svg"
                alt="EIA Link"
                className="h-8 w-8 rounded-xl shadow-md shadow-purple-600/30 object-contain"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center">
                  EIA <span className="ml-1 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">LINK</span>
                </span>
                <span className="text-[9px] font-bold tracking-[0.22em] text-purple-300 uppercase leading-none mt-0.5">
                  Hub de Conversão
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
              Infraestrutura de alta conversão comercial para negócios locais e criadores. Conecte seu público físico e digital ao faturamento real.
            </p>
          </div>

          <div>
            <b className="text-xs uppercase tracking-wider text-white block mb-3">Recursos</b>
            <div className="grid gap-2 text-xs text-zinc-400">
              <a href="#diferenciais" className="hover:text-white transition-colors">Atendente com IA</a>
              <a href="#diferenciais" className="hover:text-white transition-colors">Vitrine de Produtos</a>
              <a href="#diferenciais" className="hover:text-white transition-colors">Google Agenda</a>
              <a href="#diferenciais" className="hover:text-white transition-colors">Cartão NFC</a>
            </div>
          </div>

          <div>
            <b className="text-xs uppercase tracking-wider text-white block mb-3">Segmentos</b>
            <div className="grid gap-2 text-xs text-zinc-400">
              <a href="#modelos" className="hover:text-white transition-colors">Gastronomia & Restaurantes</a>
              <a href="#modelos" className="hover:text-white transition-colors">Clínicas & Odonto</a>
              <a href="#modelos" className="hover:text-white transition-colors">Estética & Spa</a>
              <a href="#modelos" className="hover:text-white transition-colors">Advocacia & Consultoria</a>
            </div>
          </div>

          <div>
            <b className="text-xs uppercase tracking-wider text-white block mb-3">Legal & Suporte</b>
            <div className="grid gap-2 text-xs text-zinc-400">
              <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link>
              <Link to="/refund-policy" className="hover:text-white transition-colors">Reembolso</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Área do Cliente</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-6 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-3">
          <span>© 2026 EiaLink — Todos os direitos reservados.</span>
          <span>Tecnologia Proprietária de Conversão Digital · Feito com excelência no Brasil</span>
        </div>
      </footer>

      {/* -------------------------------------------------------------------- */}
      {/* 11. MODAL DE PRÉVIA INTERATIVA DO MODELO (SMARTPHONE SIMULATOR)       */}
      {/* -------------------------------------------------------------------- */}
      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <DialogContent className="max-h-[92vh] max-w-sm overflow-y-auto bg-[#0b0d14] border-white/10 text-white rounded-3xl p-5 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="inline-flex items-center gap-1.5 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 text-[10px] font-bold text-purple-300 mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Simulador Oficial do Modelo</span>
              </div>
              <DialogTitle className="text-white text-lg font-bold">
                {previewTemplate.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                {previewTemplate.tagline}
              </DialogDescription>
            </DialogHeader>

            {/* Simulated Phone Shell */}
            <div className="rounded-[2.2rem] border-[4px] border-[#222838] bg-[#07080d] p-3 shadow-xl my-2">
              <div className="mx-auto h-3 w-16 rounded-full bg-[#222838] mb-3" />

              {/* Cover & Brand Badge */}
              <div className="relative rounded-xl overflow-hidden mb-3">
                <img
                  src={previewTemplate.coverImg}
                  alt={previewTemplate.name}
                  className="h-28 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = previewTemplate.fallbackCover;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
                    style={{ backgroundColor: previewTemplate.color }}
                  >
                    <previewTemplate.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left text-white leading-tight">
                    <b className="text-xs block font-bold">{previewTemplate.name}</b>
                    <span className="text-[10px] text-zinc-300">{previewTemplate.niche}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Mockup */}
              <div className="space-y-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{previewTemplate.highlightProduct.cta}</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                  <span>Agendar Horário Online 24h</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>Atendente IA (Tirar Dúvidas)</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ver Localização & Rotas</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 text-center">
                <span className="text-[9px] text-zinc-500 font-semibold">⚡ Carregamento Ultrarrápido em 0.28s</span>
              </div>
            </div>

            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-pink-500 transition-all mt-2"
            >
              <span>Começar com Este Modelo Grátis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
