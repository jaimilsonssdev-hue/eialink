import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Crown,
  Dumbbell,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Lock,
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
          "Transforme tráfego de redes sociais em faturamento real. Hub comercial com vitrine estilo Instagram, atendente com inteligência artificial, agendamento 24h e cartões de aproximação NFC.",
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

const NICHE_SHOWCASES = [
  {
    id: "gastro",
    label: "Gastronomia & Delivery",
    icon: UtensilsCrossed,
    color: "#f97316",
    brand: "Brasa & Fogo Steakhouse",
    city: "Salvador · Barra",
    headline: "Cortes nobres na brasa viva, chopp artesanal e entrega rápida.",
    badge: "🔥 Zero comissão de 27% do iFood",
    coverImg: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
    productImg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=85",
    productName: "Smash Burger Duplo na Brasa",
    productPrice: "R$ 42,90",
    whatsappCta: "Pedir no WhatsApp",
    statNumber: "3.2x",
    statLabel: "Mais pedidos diretos no WhatsApp",
    chatPrompt: "Boa noite! Quero pedir 2 Smash Burgers com batata rústica.",
    chatReply: "Excelente escolha! O pedido foi formatado e direcionado para a cozinha no WhatsApp com entrega em até 35 min.",
  },
  {
    id: "clinic",
    label: "Clínicas & Odonto",
    icon: Stethoscope,
    color: "#0ea5e9",
    brand: "Instituto Dental Prime",
    city: "São Paulo · Jardins",
    headline: "Implantes sem dor, alinhadores invisíveis e estética do sorriso.",
    badge: "📅 Google Agenda Sincronizada",
    coverImg: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85",
    productImg: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=85",
    productName: "Avaliação 3D com Escaneamento",
    productPrice: "R$ 180,00",
    whatsappCta: "Agendar Avaliação",
    statNumber: "85%",
    statLabel: "Redução de tempo marcando consultas",
    chatPrompt: "Vocês atendem convênio ou apenas particular?",
    chatReply: "Atendemos particular com parcelamento facilitado em até 12x e emitimos recibo para reembolso integral do seu plano.",
  },
  {
    id: "beauty",
    label: "Estética & Bem-Estar",
    icon: Scissors,
    color: "#ec4899",
    brand: "Studio Glow Estética",
    city: "Belo Horizonte · Lourdes",
    headline: "Harmonização, estética facial avançada e protocolos exclusivos.",
    badge: "✨ Alto Padrão Visual",
    coverImg: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=85",
    productImg: "https://images.unsplash.com/photo-1512290900672-1f02e604f58c?auto=format&fit=crop&w=800&q=85",
    productName: "Limpeza de Pele Profunda VIP",
    productPrice: "R$ 210,00",
    whatsappCta: "Reservar Horário VIP",
    statNumber: "+140",
    statLabel: "Novas avaliações 5★ com cartão NFC",
    chatPrompt: "Tem horário disponível para esta sexta à tarde?",
    chatReply: "Temos sim! Sexta-feira às 15h30 e 17h00. Deseja que eu reserve para você?",
  },
  {
    id: "law",
    label: "Advocacia & Negócios",
    icon: ShieldCheck,
    color: "#d97706",
    brand: "Toledo & Associados",
    city: "Brasília · Asa Sul",
    headline: "Assessoria jurídica empresarial, tributária e proteção patrimonial.",
    badge: "⚖️ Triagem Consultiva com IA",
    coverImg: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    productImg: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=85",
    productName: "Diagnóstico Jurídico Preventivo",
    productPrice: "Sob Consulta",
    whatsappCta: "Falar com Advogado",
    statNumber: "100%",
    statLabel: "Leads qualificados antes da reunião",
    chatPrompt: "Gostaria de uma consultoria para reorganização societária da minha empresa.",
    chatReply: "Perfeito! Qual é o faturamento aproximado e quantos sócios compõem o quadro para o advogado responsável te atender?",
  },
  {
    id: "store",
    label: "Lojas & Varejo",
    icon: ShoppingBag,
    color: "#8b5cf6",
    brand: "Aura Concept Store",
    city: "Curitiba · Batel",
    headline: "Moda autoral, alfaiataria contemporânea e acessórios premium.",
    badge: "🛍️ Catálogo Estilo Stories",
    coverImg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85",
    productImg: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=85",
    productName: "Blazer Linho Puro Italiano",
    productPrice: "R$ 389,00",
    whatsappCta: "Pedir Peça no WhatsApp",
    statNumber: "4.8x",
    statLabel: "Mais cliques no link da bio",
    chatPrompt: "Ainda tem o blazer tamanho M na cor areia?",
    chatReply: "Restam apenas 2 unidades no tamanho M! Deseja que eu separe agora para entrega ou retirada?",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Apresentação & Layout",
    oldWay: "Lista vertical cinza e estática de botões",
    eiaWay: "Vitrine dinâmica estilo Instagram com Parallax 60 FPS",
  },
  {
    feature: "Atendimento & Vendas",
    oldWay: "Passivo: o visitante se perde e vai embora",
    eiaWay: "Atendente com Inteligência Artificial que qualifica e vende 24h",
  },
  {
    feature: "Pedidos & Fechamento",
    oldWay: "PDFs pesados de 20MB ou formulários frios",
    eiaWay: "1 clique no WhatsApp com foto, preço e item formatado",
  },
  {
    feature: "Agendamento de Horários",
    oldWay: "Troca manual de dezenas de mensagens no WhatsApp",
    eiaWay: "Sincronizado automaticamente ao Google Agenda sem conflitos",
  },
  {
    feature: "Conexão com Balcão Físico",
    oldWay: "Inexistente: zero integração física",
    eiaWay: "Cartão e Plaquinha de aproximação NFC de alta tecnologia",
  },
  {
    feature: "Domínio & Autoridade",
    oldWay: "linktr.ee/empresa (promove a marca deles)",
    eiaWay: "suaempresa.eialink.com.br ou seu próprio domínio .com.br",
  },
  {
    feature: "Taxas e Comissões",
    oldWay: "Comissões de até 27% em marketplaces de pedidos",
    eiaWay: "0% de comissão: 100% do lucro fica no seu bolso",
  },
];

const FAQ_ITEMS = [
  {
    q: "O EiaLink é apenas mais um agregador de links?",
    a: "Não. As árvores de links tradicionais são cemitérios de cliques: colocam botões feios empilhados que fazem 70% dos visitantes desistirem. O EiaLink é um Hub de Conversão de Alto Padrão. Ele reúne vitrine de produtos estilo Instagram, Atendente Virtual com IA para tirar dúvidas e qualificar clientes, agendamento 24h integrado à sua agenda, cartões de aproximação física NFC e subdomínio próprio em uma infraestrutura ultraveloz.",
  },
  {
    q: "Eu pago comissão sobre as minhas vendas ou agendamentos?",
    a: "Zero! Ao contrário de marketplaces (iFood, plataformas de agendamento externas) que mordem de 15% a 27% de tudo o que você vende, no EiaLink 100% das receitas e transações vão direto para a sua conta via WhatsApp ou Pix.",
  },
  {
    q: "Como o Atendente Virtual com IA funciona no meu link?",
    a: "É como ter um atendente comercial sênior trabalhando 24 horas por dia, 7 dias por semana. Ele conversa amigavelmente com os visitantes do seu link, responde dúvidas sobre preços, cardápios ou tratamentos, tira as principais objeções e entrega a pessoa qualificada na conversa do seu WhatsApp com o resumo do que ela deseja.",
  },
  {
    q: "Como funciona a tecnologia de aproximação NFC?",
    a: "Você pode vincular o seu link a um cartão de visitas de aproximação ou plaquinha de balcão NFC. Quando qualquer pessoa encosta o celular (iPhone ou Android) no cartão, a sua página abre em menos de 1 segundo na tela dela, sem necessidade de instalar aplicativos ou digitar endereços.",
  },
  {
    q: "Preciso ter conhecimento técnico ou saber programar?",
    a: "Absolutamente nenhum. O sistema possui modelos prontos para cada nicho e um Copiloto Criativo inteligente: você pode simplesmente conversar com o assistente ('mude a cor para dourado e adicione meus 3 pratos') e a página se ajusta em tempo real.",
  },
  {
    q: "Posso testar gratuitamente?",
    a: "Sim! Você pode criar sua conta gratuita, escolher o modelo ideal para a sua área e colocar sua vitrine profissional no ar em menos de 5 minutos, sem nenhum cadastro de cartão de crédito.",
  },
];

function LandingPage() {
  const [activeNiche, setActiveNiche] = useState(NICHE_SHOWCASES[0]);
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
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">EiaLink</p>
          <h1 className="mt-3 text-xl font-semibold">Abrindo sua página oficial...</h1>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-[#f4f4f7] selection:bg-indigo-500/30 selection:text-indigo-200 font-sans antialiased overflow-x-hidden">
      {/* Background Matrix & Subtle Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#1f2430_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-cyan-600/10 blur-[130px] pointer-events-none" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#06070a]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-xl tracking-tight text-white">EIA</span>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                LINK
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold text-zinc-400 lg:flex">
            <a href="#solucoes" className="hover:text-white transition-colors">
              Soluções
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Experiência Interativa
            </a>
            <a href="#comparativo" className="hover:text-white transition-colors">
              Por que EiaLink?
            </a>
            <a href="#infraestrutura" className="hover:text-white transition-colors">
              Infraestrutura
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
              className="relative inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-95"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-8 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>O Novo Padrão de Presença Digital Comercial</span>
            <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
            Transforme seguidores em{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              clientes pagantes no WhatsApp.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg leading-relaxed">
            Elimine links de bio feios e genéricos que vazam tráfego. Tenha um{" "}
            <strong className="text-white font-semibold">Hub de Conversão de Alto Padrão</strong> com vitrine estilo Instagram, Atendente com IA para triagem automática, agendamento 24h e cartão de aproximação NFC.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Começar Minha Página Grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md"
            >
              <Play className="h-4 w-4 text-indigo-400 fill-indigo-400/20" />
              <span>Ver Demonstração Interativa</span>
            </a>
          </div>

          {/* Highlights Mini-Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Carregamento em 0.28s</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span>Atendente com IA 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>Tecnologia NFC Integrada</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>0% de comissões sobre vendas</span>
            </div>
          </div>
        </div>

        {/* Studio Canvas Showcase (Hero Preview) */}
        <div className="mx-auto mt-16 max-w-6xl px-6">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#11131a] to-[#090a0f] p-3 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-[#0d0f17]/60 rounded-t-xl">
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
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1.5">
                      <Flame className="h-4 w-4" />
                      <span>Vitrine Instagram</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Fotos de alta qualidade com preços e fechamento direto no WhatsApp em 1 clique.
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
                    <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
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

                  {/* Profile & Header */}
                  <div className="relative rounded-2xl overflow-hidden mb-3.5">
                    <img
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
                      alt="Capa de demonstração"
                      className="h-28 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="text-left text-white">
                        <b className="text-xs block leading-tight">Brasa & Fogo Steak</b>
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
        </div>
      </section>

      {/* Interactive Segment Showcase */}
      <section id="showcase" className="py-20 border-t border-white/[0.07] bg-[#07080d]/60">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="space-y-3 max-w-3xl mx-auto mb-10">
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Experiência Interativa</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Modelos de Alta Conversão Criados para o Seu Ramo
            </h2>
            <p className="text-sm text-zinc-400">
              Clique nos nichos abaixo para ver como a sua presença comercial ganha autoridade instantânea.
            </p>
          </div>

          {/* Segment Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {NICHE_SHOWCASES.map((niche) => {
              const Icon = niche.icon;
              const isSelected = activeNiche.id === niche.id;
              return (
                <button
                  key={niche.id}
                  onClick={() => setActiveNiche(niche)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                      : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{niche.label}</span>
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
                  {activeNiche.brand}
                </h3>
                <p className="text-xs text-indigo-400 font-medium mt-1">{activeNiche.city}</p>

                <p className="text-sm sm:text-base text-zinc-300 mt-4 leading-relaxed">
                  {activeNiche.headline}
                </p>

                {/* Simulated AI Agent Dialog */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-[#090a10] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Bot className="h-4 w-4" />
                    <span>Atendente Virtual IA em Ação:</span>
                  </div>

                  <div className="rounded-xl bg-white/[0.04] p-3 text-xs text-zinc-300">
                    <strong className="block text-zinc-400 text-[10px] uppercase mb-0.5">Cliente:</strong>
                    “{activeNiche.chatPrompt}”
                  </div>

                  <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/20 p-3 text-xs text-indigo-200">
                    <strong className="block text-indigo-400 text-[10px] uppercase mb-0.5">IA da Loja:</strong>
                    “{activeNiche.chatReply}”
                  </div>
                </div>

                {/* Metric Box */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-6">
                  <div>
                    <span className="text-3xl font-extrabold text-white block">{activeNiche.statNumber}</span>
                    <span className="text-xs text-zinc-400">{activeNiche.statLabel}</span>
                  </div>
                  <Link
                    to="/auth"
                    search={{ mode: "signup" } as never}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-white text-zinc-950 font-bold px-4 py-2.5 text-xs hover:bg-zinc-200 transition-colors shadow-md"
                  >
                    <span>Usar Este Modelo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stage Image Visual */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={activeNiche.coverImg}
                  alt={activeNiche.brand}
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Floating Product Card */}
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-black/75 p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeNiche.productImg}
                      alt={activeNiche.productName}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                    <div>
                      <b className="text-xs text-white block">{activeNiche.productName}</b>
                      <span className="text-xs font-bold text-emerald-400">{activeNiche.productPrice}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shrink-0">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{activeNiche.whatsappCta}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Pillars (Bento Grid) */}
      <section id="solucoes" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">O Ecossistema Completo</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Projetado de Ponta a Ponta para Gerar Vendas
          </h2>
          <p className="text-base text-zinc-400">
            A tecnologia mais avançada do mercado para quem não pode se dar ao luxo de queimar clientes.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Atendente com IA (Large Span 2) */}
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#10121d] to-[#07080d] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Bot className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Inteligência Artificial Exclusiva
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white tracking-tight">
                Atendente Virtual com IA: Seu Vendedor 24/7
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                O visitante entra na sua página com dúvidas e é atendido na hora por uma IA treinada com os dados do seu negócio. Ela responde sobre cardápios, planos ou procedimentos e transfere a conversa estruturada direto para o seu WhatsApp.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-4 max-w-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Conversão em Tempo Real</span>
              </div>
              <p className="text-xs text-zinc-400">
                “Cliente qualificado pela IA com interesse no procedimento de Harmonização Facial para agendar nesta quinta-feira.”
              </p>
            </div>
          </div>

          {/* Card 2: Cartão e Plaquinha NFC (Span 1) */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#10121d] to-[#07080d] p-8 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Radio className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-300">
                  NFC Phygital
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Cartão & Plaquinha de Balcão NFC
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Aproxime o cartão físico de qualquer smartphone e abra seu link instantaneamente, sem digitar nada.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/15 bg-gradient-to-tr from-zinc-900 to-black p-4 text-center">
              <div className="h-8 w-12 rounded bg-amber-400/80 mx-auto mb-2 flex items-center justify-center text-[9px] font-bold text-black">
                CHIP
              </div>
              <span className="text-xs text-zinc-300 font-semibold block">Cartão Inteligente EiaLink</span>
              <span className="text-[10px] text-zinc-500">Aproximou, abriu seu catálogo</span>
            </div>
          </div>

          {/* Card 3: Google Agenda 24h (Span 1) */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#10121d] to-[#07080d] p-8 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400">
                  Google Calendar
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Agendamento Online 24 Horas
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seus horários livres sincronizados em tempo real. O cliente escolhe, confirma e bloqueia na sua agenda sem conflitos.
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-300 space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Horários de Hoje:</span>
                <span className="text-emerald-400 font-bold">3 vagos</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold">14:00</span>
                <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold">15:30</span>
                <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold">17:00</span>
              </div>
            </div>
          </div>

          {/* Card 4: Vitrine Estilo Instagram (Large Span 2) */}
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#10121d] to-[#07080d] p-8 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  0% de Comissões
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white tracking-tight">
                Vitrine & Catálogo Interativo com Fotos em Alta Resolução
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                Apresente seus produtos e serviços em formato vertical deslizante com tags de preço e botão de pedido pronto para o WhatsApp. Venda direta para o cliente sem intermediários e sem taxas de marketplace.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="h-4 w-4" /> Checkout Direto no WhatsApp ou Pix
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="h-4 w-4" /> Fotos em Proporção de Stories (4:5)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparativo" className="py-20 border-t border-white/[0.07] bg-[#07080d]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Comparativo Direto</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              O Fim do Linktree Tradicional
            </h2>
            <p className="text-sm text-zinc-400">
              Por que manter um link antigo está custando caro para o seu negócio todos os dias.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0c0e15] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-5 px-6 font-semibold">Critério</th>
                  <th className="py-5 px-6 font-semibold text-rose-400 bg-rose-950/20">Links Tradicionais (Linktree / Comum)</th>
                  <th className="py-5 px-6 font-semibold text-emerald-300 bg-emerald-950/30 border-l border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>EiaLink Pro</span>
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

      {/* Proprietary Infrastructure Section */}
      <section id="infraestrutura" className="py-20 max-w-7xl mx-auto px-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1017] to-[#07080d] p-8 md:p-14 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Engenharia Proprietária</p>
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
              <Lock className="h-8 w-8 text-indigo-400 mb-3" />
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
                Seu cliente pode instalar o seu link como um app direto na tela inicial do celular dele.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 border-t border-white/[0.07] bg-[#07080d]/60">
        <PublicPricingSection />
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Perguntas Frequentes</p>
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

      {/* Final Call to Action */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950 via-[#0d1020] to-[#07080d] p-8 md:p-14 shadow-2xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
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

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050608] py-14">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white font-bold">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-extrabold text-lg text-white">EIALINK</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
              Infraestrutura de alta conversão comercial para negócios locais e criadores. Conecte seu público físico e digital ao faturamento real.
            </p>
          </div>

          <div>
            <b className="text-xs uppercase tracking-wider text-white block mb-3">Recursos</b>
            <div className="grid gap-2 text-xs text-zinc-400">
              <a href="#solucoes" className="hover:text-white transition-colors">Atendente com IA</a>
              <a href="#solucoes" className="hover:text-white transition-colors">Vitrine de Produtos</a>
              <a href="#solucoes" className="hover:text-white transition-colors">Google Agenda</a>
              <a href="#solucoes" className="hover:text-white transition-colors">Cartão NFC</a>
            </div>
          </div>

          <div>
            <b className="text-xs uppercase tracking-wider text-white block mb-3">Segmentos</b>
            <div className="grid gap-2 text-xs text-zinc-400">
              <a href="#showcase" className="hover:text-white transition-colors">Gastronomia & Bares</a>
              <a href="#showcase" className="hover:text-white transition-colors">Clínicas & Odonto</a>
              <a href="#showcase" className="hover:text-white transition-colors">Estética & Salões</a>
              <a href="#showcase" className="hover:text-white transition-colors">Advocacia & Serviços</a>
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
          <span>Tecnologia Proprietária de Conversão Digital · Feito no Brasil</span>
        </div>
      </footer>
    </div>
  );
}
