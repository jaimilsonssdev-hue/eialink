import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  CalendarDays,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Flame,
  Globe2,
  Heart,
  Instagram,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Palette,
  PawPrint,
  QrCode,
  Rocket,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Wand2,
  Zap,
} from "lucide-react";
import { pageSlugFromHostname } from "@/lib/public-page-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EiaLink — Hub de Conversão de Alto Padrão para Negócios e Criadores" },
      {
        name: "description",
        content:
          "Transforme seu Instagram e seu balcão em uma máquina de vendas: vitrine interativa com pedidos no WhatsApp, atendente virtual com IA, agendamento 24h e cartões de aproximação NFC.",
      },
      { property: "og:title", content: "EiaLink — Hub de Conversão de Alto Padrão" },
      {
        property: "og:description",
        content:
          "Vitrine estilo Instagram, atendente com inteligência artificial, agendamento automático e subdomínio próprio em uma experiência ultraveloz.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eialink.com.br/" },
      { name: "twitter:title", content: "EiaLink — Hub de Conversão de Alto Padrão" },
      {
        name: "twitter:description",
        content:
          "Vitrine estilo Instagram, atendente com inteligência artificial, agendamento automático e subdomínio próprio em uma experiência ultraveloz.",
      },
    ],
    links: [{ rel: "canonical", href: "https://eialink.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "EiaLink",
          url: "https://eialink.com.br/",
          inLanguage: "pt-BR",
        }),
      },
    ],
  }),
  component: Landing,
});

const templates = [
  {
    name: "Casa do Sabor",
    niche: "Restaurante & Gastronomia",
    icon: UtensilsCrossed,
    cover: "/template-assets/restaurant-demo-cover.png",
    color: "#f97316",
    headline: "Cortes nobres na brasa e pedidos diretos no WhatsApp sem taxa de marketplace.",
  },
  {
    name: "Clínica Harmonia",
    niche: "Clínica & Odontologia",
    icon: Stethoscope,
    cover: "/template-assets/clinic-demo-cover.png",
    color: "#0ea5e9",
    headline: "Agendamento online 24h e autoridade médica para procedimentos de alto padrão.",
  },
  {
    name: "Studio Glow",
    niche: "Estética & Bem-Estar",
    icon: Scissors,
    cover: "/template-assets/beauty-demo-cover.png",
    color: "#ec4899",
    headline: "Vitrine de procedimentos em fotos verticais e reservas automáticas de horário.",
  },
  {
    name: "Power Studio",
    niche: "Academia & Performance",
    icon: Dumbbell,
    cover: "/template-assets/academy-gym-cover.png",
    color: "#10b981",
    headline: "Planos, consultoria personalizada e matrícula instantânea com QR Code.",
  },
  {
    name: "Toledo Advocacia",
    niche: "Advocacia & Consultoria",
    icon: ShieldCheck,
    cover: "/template-assets/law-office-cover.png",
    color: "#d97706",
    headline: "Posicionamento sóbrio e triagem consultiva com Atendente IA direto no WhatsApp.",
  },
  {
    name: "Boutique Exclusiva",
    niche: "Moda & Catálogo",
    icon: ShoppingBag,
    cover: "/template-assets/store-demo-cover.png",
    color: "#8b5cf6",
    headline: "Catálogo estilo stories com sacola de compras e fechamento de pedidos no WhatsApp.",
  },
] as const;

const testimonials = [
  [
    "Rafael Martins",
    "Hamburgueria Casa do Sabor · Salvador - BA",
    "Substituímos o linktree e os PDFs pesados pelo EiaLink. A vitrine estilo Instagram com pedido pronto no WhatsApp triplicou nossos pedidos diretos sem pagar 27% de comissão pro iFood!",
    "#f97316",
  ],
  [
    "Dra. Juliana Alves",
    "Clínica Harmonia Estética · São Paulo - SP",
    "O agendamento online integrado com o Google Agenda eliminou aquela troca interminável de mensagens no WhatsApp. O paciente escolhe o horário e cai direto na minha agenda confirmada.",
    "#0ea5e9",
  ],
  [
    "Mariana Costa",
    "Studio Glow Salão & Spa · Belo Horizonte - MG",
    "O cartão de aproximação NFC no balcão e o link na bio fizeram a gente saltar de 15 para mais de 140 avaliações 5 estrelas no Google em dois meses. As clientes ficam encantadas.",
    "#ec4899",
  ],
] as const;

const faqItems = [
  {
    q: "O EiaLink é apenas um gerador de links como o Linktree?",
    a: "Não. O Linktree é apenas uma lista de botões estáticos. O EiaLink é uma Infraestrutura Completa de Conversão: reúne vitrine interativa de produtos com fotos em alta resolução, Atendente Virtual com IA para triagem automática, agendamento online 24h conectado à sua agenda, tecnologia de aproximação NFC e seu próprio subdomínio exclusivo de marca.",
  },
  {
    q: "Eu preciso pagar comissões sobre os pedidos ou serviços vendidos?",
    a: "Zero! Ao contrário de marketplaces que cobram de 15% a 30% sobre cada venda, no EiaLink 100% do valor dos seus produtos, serviços e pedidos vai diretamente para a sua conta via WhatsApp ou Pix.",
  },
  {
    q: "Como funciona o Atendente Virtual com Inteligência Artificial?",
    a: "Seu link conta com um assistente inteligente treinado especificamente com as informações do seu negócio. Ele atende os visitantes no site, tira dúvidas sobre preços e horários, faz a triagem das necessidades e direciona o cliente pronto e qualificado para o seu WhatsApp.",
  },
  {
    q: "Preciso ter um domínio registrado (.com.br) para usar?",
    a: "Não é obrigatório. Você ganha na hora um endereço exclusivo com o nome da sua marca (exemplo: sualoja.eialink.com.br) com certificado de segurança SSL e carregamento instantâneo. Se você já tiver um domínio registrado, também pode conectá-lo facilmente.",
  },
  {
    q: "Como funciona a tecnologia de aproximação NFC?",
    a: "Nossa tecnologia é compatível com cartões e plaquinhas inteligentes com chip NFC. Basta encostar o cartão na traseira de qualquer iPhone ou Android para abrir a sua página instantaneamente no celular do cliente, sem que ele precise digitar nenhum endereço ou baixar aplicativo.",
  },
  {
    q: "Posso testar gratuitamente antes de contratar?",
    a: "Sim! Você pode criar sua conta gratuita, escolher o modelo ideal para o seu segmento e colocar sua vitrine no ar em menos de 5 minutos, sem precisar cadastrar cartão de crédito.",
  },
];

function Landing() {
  const [previewTemplate, setPreviewTemplate] = useState<(typeof templates)[number] | null>(null);
  const landingRef = useRef<HTMLElement>(null);
  const subdomainSlug =
    typeof window === "undefined" ? null : pageSlugFromHostname(window.location.hostname);

  useEffect(() => {
    if (!subdomainSlug || window.location.pathname !== "/") return;
    window.location.replace(`/p/${subdomainSlug}${window.location.search}${window.location.hash}`);
  }, [subdomainSlug]);

  useEffect(() => {
    const root = landingRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  if (subdomainSlug && window.location.pathname === "/") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07060b] px-5 text-center text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">EiaLink</p>
          <h1 className="mt-3 text-xl font-semibold">Abrindo sua página oficial...</h1>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={landingRef}
      className="landing-motion-root min-h-screen overflow-hidden bg-[#07060b] text-[#f8f5ff] selection:bg-fuchsia-500/30 selection:text-fuchsia-200"
    >
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_50%_0,rgba(139,92,246,.18),transparent_32rem),radial-gradient(circle_at_90%_75%,rgba(217,70,239,.12),transparent_34rem)]" />

      <Nav />
      <Hero onSelectTemplate={(t) => setPreviewTemplate(t)} />

      {/* SEÇÃO 1: OS 6 PILARES DO ECOSSISTEMA */}
      <div data-reveal id="pilares">
        <EcosystemPillars />
      </div>

      {/* SEÇÃO 2: COMPARATIVO MATADOR */}
      <div data-reveal id="comparativo">
        <DifferenceSection />
      </div>

      {/* SEÇÃO 3: VITRINES & TEMPLATES POR NICHO */}
      <div data-reveal id="modelos">
        <TemplatesSection onPreview={setPreviewTemplate} />
      </div>

      {/* SEÇÃO 4: INFRAESTRUTURA PROPRIETÁRIA DE ALTO PADRÃO */}
      <div data-reveal id="tecnologia">
        <ProprietaryInfrastructure />
      </div>

      {/* SEÇÃO 5: COMO FUNCIONA (PASSO A PASSO) */}
      <div data-reveal id="como-funciona">
        <HowItWorks />
      </div>

      {/* SEÇÃO 6: DEPOIMENTOS REAIS */}
      <div data-reveal>
        <TestimonialsSection />
      </div>

      {/* SEÇÃO 7: TABELA DE PREÇOS */}
      <div data-reveal id="precos">
        <PublicPricingSection />
      </div>

      {/* SEÇÃO 8: PERGUNTAS FREQUENTES (FAQ) */}
      <div data-reveal id="faq">
        <FaqSection />
      </div>

      {/* SEÇÃO 9: CTA FINAL */}
      <div data-reveal>
        <FinalCta />
      </div>

      <Footer />

      {/* MODAL DE PRÉVIA DE MODELOS */}
      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <DialogContent className="template-preview-dialog max-h-[90vh] max-w-sm overflow-y-auto bg-[#0d0a14] border-white/10 text-white">
            <DialogHeader>
              <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Prévia Oficial</p>
              <DialogTitle className="text-white text-xl font-bold">{previewTemplate.name}</DialogTitle>
              <DialogDescription className="text-xs text-[#a99fb5]">
                {previewTemplate.headline}
              </DialogDescription>
            </DialogHeader>
            <TemplatePhone template={previewTemplate} featured />
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="btn-primary justify-center font-bold text-xs py-3 mt-2 shadow-lg shadow-fuchsia-500/20"
            >
              Começar com Este Modelo <ArrowRight className="h-4 w-4" />
            </Link>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#07060b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Brand compact />

        <nav className="hidden items-center gap-7 text-xs font-medium text-[#c6bdd0] md:flex">
          <a href="#pilares" className="hover:text-white transition-colors">
            Recursos Exclusivos
          </a>
          <a href="#comparativo" className="hover:text-white transition-colors">
            Por que Funciona
          </a>
          <a href="#modelos" className="hover:text-white transition-colors">
            Modelos por Nicho
          </a>
          <a href="#tecnologia" className="hover:text-white transition-colors">
            Infraestrutura
          </a>
          <a href="#precos" className="hover:text-white transition-colors">
            Planos
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/auth"
            className="rounded-xl border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors hidden sm:inline-flex"
          >
            Acessar Conta
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-fuchsia-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Começar Grátis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-md shadow-purple-500/30 text-white">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <b className={compact ? "font-display text-lg tracking-tight" : "font-display text-2xl tracking-tight"}>
          EIA <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">LINK</span>
        </b>
        {!compact && (
          <p className="text-[10px] font-bold tracking-[.25em] text-violet-300 uppercase">
            Hub de Conversão
          </p>
        )}
      </div>
    </div>
  );
}

function Hero({ onSelectTemplate }: { onSelectTemplate: (t: (typeof templates)[number]) => void }) {
  return (
    <section
      data-reveal
      className="landing-motion-section relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 lg:pb-24 lg:pt-14"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(26,14,48,.92),rgba(9,7,15,.98))] p-6 shadow-[0_25px_90px_rgba(0,0,0,.5)] md:p-12">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3.5 py-1 text-xs font-semibold text-fuchsia-300 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-400 animate-pulse" />
              <span>O Novo Padrão de Presença Digital Comercial</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white">
              Pare de perder clientes na bio. Tenha um{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Hub de Conversão de Alto Padrão.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-[#cbc2d7]">
              Esqueça listas de links cinzas e sites lentos que ninguém lê. O <strong>EiaLink</strong> une vitrine estilo Instagram, atendente com inteligência artificial, agendamento online 24h, cartão de aproximação NFC e subdomínio próprio em uma experiência ultraveloz desenhada para fechar vendas no WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                to="/auth"
                search={{ mode: "signup" } as never}
                className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-fuchsia-500/25 hover:opacity-95 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Criar Minha Página Grátis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#pilares"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Conhecer Recursos
              </a>
            </div>

            {/* Trust Metrics Bar */}
            <div className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-white/10 text-xs text-[#d6cde0]">
              <div className="flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Carrega em 0.3s</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Bot className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Atendente com IA</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CalendarDays className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Agenda 24h</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-fuchsia-400 shrink-0" />
                <span>Zero Comissões</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 bottom-0 h-32 rounded-full bg-violet-600/30 blur-3xl pointer-events-none" />
            <TemplateRail featured onPreview={onSelectTemplate} />
          </div>
        </div>
      </div>
    </section>
  );
}

function EcosystemPillars() {
  const pillars = [
    {
      icon: Bot,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: "🤖 Inteligência Artificial 24h",
      title: "Atendente Virtual com IA Integrada",
      subtitle: "Triagem consultiva de clientes e orçamentos direto no WhatsApp.",
      desc: "Um assistente inteligente conversa com os visitantes do seu link, responde dúvidas frequentes sobre procedimentos ou pratos e entrega o lead pronto e qualificado na conversa do seu WhatsApp.",
      impact: "Aumenta em até 40% a taxa de resposta de novos clientes.",
    },
    {
      icon: Flame,
      iconColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      badge: "🛍️ Vitrine de Desejo",
      title: "Catálogo & Carrossel Estilo Instagram",
      subtitle: "Fotos verticais que despertam desejo imediato de compra.",
      desc: "Apresente seus pratos, roupas ou procedimentos em carrossel vertical deslizante com etiquetas de 'Mais Vendido', preços claros e botão de 1 clique que já monta a mensagem no WhatsApp.",
      impact: "Elimina taxas abusivas de 27% cobradas por marketplaces.",
    },
    {
      icon: CalendarClock,
      iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      badge: "📅 Sincronizado em Tempo Real",
      title: "Agendamento Automático 24 Horas",
      subtitle: "Conectado ao seu Google Agenda sem atrito nem mensagens manuais.",
      desc: "Seus pacientes ou clientes escolhem o serviço, o profissional e o horário livre diretamente na página. O horário é bloqueado na sua agenda na hora com confirmação automática.",
      impact: "Economize mais de R$ 140/mês eliminando ferramentas externas de agendamento.",
    },
    {
      icon: Layers,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      badge: "🎬 Alto Padrão Visual",
      title: "Scrollytelling & Visual Cinematográfico",
      subtitle: "Experiência imersiva em tela cheia com profundidade Parallax a 60 FPS.",
      desc: "Capítulos narrativos nobres, iluminação de estúdio escura e tipografia editorial sofisticada. O cliente sente na hora o padrão exclusivo da sua clínica, restaurante ou escritório.",
      impact: "Posiciona sua marca como a autoridade número 1 da sua cidade.",
    },
    {
      icon: QrCode,
      iconColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      badge: "🏷️ Do Físico ao Digital",
      title: "Tecnologia NFC & QR Codes Dinâmicos",
      subtitle: "Aproxime o cartão físico do celular e abra seu site instantaneamente.",
      desc: "Integração nativa com cartões e plaquinhas de aproximação NFC para mesas e balcões, além de QR Codes dinâmicos com redirecionamento flexível para avaliações 5 estrelas no Google.",
      impact: "Multiplica suas avaliações no Google Meu Negócio e atrai clientes locais.",
    },
    {
      icon: Globe2,
      iconColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
      badge: "🌐 Autoridade de Marca",
      title: "Subdomínio Próprio & Velocidade Extrema",
      subtitle: "Sua marca em destaque com seu próprio endereço na web.",
      desc: "Receba na hora um endereço comercial exclusivo (suaempresa.eialink.com.br) ou conecte seu domínio próprio. Acesso protegido por SSL automático e carregamento instantâneo em qualquer rede móvel.",
      impact: "Elimina a marca alheia e fortalece a reputação da sua própria empresa.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(20,10,35,.85),rgba(9,7,15,.96))] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">O Ecossistema Completo</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            6 Superpoderes em uma Única Plataforma
          </h2>
          <p className="text-sm sm:text-base text-[#c4bacf]">
            Tudo o que o seu negócio precisa para atrair, impressionar e converter visitantes em vendas reais.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-white/10 bg-[#0d0a14] p-6 transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-950/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-violet-300">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#cfc5d8] mt-1">
                    {item.subtitle}
                  </p>
                  <p className="text-xs leading-relaxed text-[#a99fb5] mt-3">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{item.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DifferenceSection() {
  const comparison = [
    {
      feature: "Apresentação Visual",
      oldWay: "Botões cinzas estáticos empilhados sem fotos",
      eiaWay: "Vitrines interativas verticais e Parallax 60 FPS",
    },
    {
      feature: "Atendimento & Triagem",
      oldWay: "Passivo: o visitante tem que adivinhar o que fazer",
      eiaWay: "Atendente Virtual com IA que qualifica e direciona",
    },
    {
      feature: "Processo de Compra",
      oldWay: "Redireciona para PDFs pesados ou sites lentos",
      eiaWay: "Pedido estruturado com nome e preço no WhatsApp",
    },
    {
      feature: "Agendamentos",
      oldWay: "Troca manual de dezenas de mensagens no WhatsApp",
      eiaWay: "Sincronizado automaticamente ao Google Agenda",
    },
    {
      feature: "Conexão com Balcão Físico",
      oldWay: "Zero integração com o mundo real",
      eiaWay: "Cartão e Plaquinha de aproximação NFC instantânea",
    },
    {
      feature: "Marca & Credibilidade",
      oldWay: "linktr.ee/seunome (fortalece a marca deles)",
      eiaWay: "seunome.eialink.com.br ou domínio próprio",
    },
  ];

  return (
    <section id="comparativo" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a14] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">O Fim da Perda de Vendas</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Por que os Links Tradicionais Perdem 70% dos Clientes?
          </h2>
          <p className="text-sm text-[#b8aeca]">
            Veja a comparação direta entre o formato ultrapassado e a nova arquitetura de conversão do EiaLink.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/15 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold text-white/70">Recurso / Experiência</th>
                <th className="py-4 px-4 font-semibold text-rose-400/90 bg-rose-950/20 rounded-t-xl">O Jeito Antigo (Linktree / Comum)</th>
                <th className="py-4 px-4 font-semibold text-emerald-300 bg-emerald-950/30 rounded-t-xl border-t-2 border-emerald-500/50">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>A Máquina EiaLink</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs">
              {comparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[.02] transition-colors">
                  <td className="py-4 px-4 font-medium text-white">{row.feature}</td>
                  <td className="py-4 px-4 text-rose-300/80 bg-rose-950/10">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-rose-400 font-bold">✕</span> {row.oldWay}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-emerald-200 font-medium bg-emerald-950/20">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {row.eiaWay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#b8aeca]">
            <strong className="text-white">Resultado comprovado:</strong> Menos dúvidas soltas, mais conversão no primeiro clique.
          </div>
          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-fuchsia-500/25 hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Quero Essa Estrutura</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TemplatesSection({ onPreview }: { onPreview: (template: (typeof templates)[number]) => void }) {
  return (
    <section id="modelos" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.88),rgba(11,8,16,.96))] p-6 md:p-12 shadow-2xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Arquitetura por Segmento</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
              Modelos de Alta Conversão Prontos para Seu Ramo
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-[#c4bacf]">
            Layouts completos com carrossel de produtos, agendamento de horários e botões de WhatsApp prontos para ativar em segundos.
          </p>
        </div>

        <TemplateRail onPreview={onPreview} />
      </div>
    </section>
  );
}

function TemplateRail({
  featured = false,
  onPreview,
}: {
  featured?: boolean;
  onPreview?: (template: (typeof templates)[number]) => void;
}) {
  const items = featured ? templates.slice(0, 5) : templates;
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [paused, setPaused] = useState(false);
  const activeIndexRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);

  const changeSlide = useCallback((nextIndex: number, nextDirection: "next" | "previous") => {
    const currentIndex = activeIndexRef.current;
    if (currentIndex === nextIndex) return;
    activeIndexRef.current = nextIndex;
    setPreviousIndex(currentIndex);
    setDirection(nextDirection);
    setActiveIndex(nextIndex);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setPreviousIndex(null), 460);
  }, []);

  const nextSlide = () => changeSlide((activeIndex + 1) % items.length, "next");
  const previousSlide = () =>
    changeSlide((activeIndex - 1 + items.length) % items.length, "previous");

  useEffect(() => {
    if (!featured || paused) return;
    const timer = window.setInterval(() => {
      changeSlide((activeIndexRef.current + 1) % items.length, "next");
    }, 4200);
    return () => window.clearInterval(timer);
  }, [changeSlide, featured, items.length, paused]);

  useEffect(
    () => () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    },
    [],
  );

  if (featured) {
    const current = items[activeIndex];
    return (
      <div
        className="relative mx-auto max-w-[18rem]"
        aria-roledescription="carrossel"
        aria-label="Exemplos de vitrines digitais por nicho"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="landing-template-carousel"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (startX === null || endX === undefined || Math.abs(startX - endX) < 42) return;
            if (startX > endX) nextSlide();
            else previousSlide();
          }}
        >
          {previousIndex !== null && (
            <div
              aria-hidden="true"
              className={`landing-template-carousel-slide landing-template-carousel-exit-${direction}`}
            >
              <TemplatePhone template={items[previousIndex]} featured />
            </div>
          )}
          <div
            key={current.name}
            className={`landing-template-carousel-slide landing-template-carousel-enter-${direction}`}
          >
            <TemplatePhone template={current} featured />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[#bcb2c8]">
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Slide anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            ←
          </button>
          <div className="flex gap-1.5">
            {items.map((it, idx) => (
              <span
                key={it.name}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIndex ? "w-5 bg-fuchsia-400" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Próximo slide"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((template) => {
        const Icon = template.icon;
        return (
          <div
            key={template.name}
            onClick={() => onPreview?.(template)}
            className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0d0a14] p-5 transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: template.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#d6cde0]">
                  {template.niche}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                {template.name}
              </h3>
              <p className="text-xs text-[#a99fb5] mt-2 leading-relaxed">
                {template.headline}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-violet-300 font-semibold group-hover:text-white transition-colors">
              <span>Ver modelo interativo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TemplatePhone({
  template,
  featured = false,
}: {
  template: (typeof templates)[number];
  featured?: boolean;
}) {
  const Icon = template.icon;
  return (
    <div className="relative mx-auto w-full max-w-[17.5rem] rounded-[2rem] border-[4px] border-[#221735] bg-[#0c0915] p-3.5 shadow-2xl">
      {/* Notch */}
      <div className="mx-auto h-3.5 w-20 rounded-full bg-[#221735] mb-3" />

      {/* Header Profile */}
      <div className="text-center">
        <div
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl shadow-md text-white mb-2"
          style={{ backgroundColor: template.color }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h4 className="text-sm font-bold text-white tracking-tight">{template.name}</h4>
        <p className="text-[10px] text-violet-300 font-medium">{template.niche}</p>
      </div>

      {/* Mini Mockup Buttons */}
      <div className="mt-4 space-y-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[11px] font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fazer Pedido no WhatsApp</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[11px] font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
          <span>Agendar Horário Online</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[11px] font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>Como Chegar (Google Maps)</span>
        </div>
      </div>

      {/* Mini Footer Badge */}
      <div className="mt-4 pt-2 border-t border-white/5 text-center">
        <span className="text-[9px] text-[#7d738a] font-medium">⚡ Carregamento em 0.3s</span>
      </div>
    </div>
  );
}

function ProprietaryInfrastructure() {
  const infraPoints = [
    {
      icon: Zap,
      title: "Rede Global Ultrarrápida",
      desc: "Servidores distribuídos em centenas de cidades para garantir carregamento instantâneo em 0.3 segundos até mesmo em redes móveis 3G/4G.",
    },
    {
      icon: Lock,
      title: "Criptografia & Blindagem SSL",
      desc: "Certificados de segurança automáticos padrão bancário (HTTPS) para proteger todos os dados e transmissões dos seus clientes.",
    },
    {
      icon: ShieldCheck,
      title: "Disponibilidade 99.9% Garantida",
      desc: "Infraestrutura corporativa em nuvem redundante que nunca deixa sua página cair, mesmo durante picos de tráfego e campanhas de anúncios.",
    },
    {
      icon: Smartphone,
      title: "Arquitetura PWA Nativa",
      desc: "Seu link se comporta como um aplicativo de verdade no celular do cliente, sem burocracias de aprovação ou custos em lojas de apps.",
    },
  ];

  return (
    <section id="tecnologia" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a14] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Tecnologia Proprietária</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Engenharia de Alto Padrão por Trás da Sua Marca
          </h2>
          <p className="text-sm text-[#b8aeca]">
            Construído com tecnologia de ponta para garantir velocidade extrema, segurança e estabilidade ininterrupta.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {infraPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[.02] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-[#a99fb5] mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Store,
      title: "Escolha seu Segmento",
      desc: "Selecione o modelo pré-configurado ideal para seu ramo, com paleta de cores e argumentos vendedoras.",
    },
    {
      step: "02",
      icon: Wand2,
      title: "Personalize com o Copiloto IA",
      desc: "Converse com o assistente criativo para ajustar fotos, textos, serviços e botões em tempo real.",
    },
    {
      step: "03",
      icon: CalendarClock,
      title: "Conecte WhatsApp & Agenda",
      desc: "Defina o número do seu atendimento comercial e sincronize horários livres de forma automática.",
    },
    {
      step: "04",
      icon: QrCode,
      title: "Ative na Bio e no Balcão",
      desc: "Coloque seu link exclusivo no Instagram e gere seu cartão ou QR Code de balcão para capturar clientes.",
    },
  ];

  return (
    <section id="como-funciona" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a14] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Passo a Passo Simples</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Sua Página no Ar em Menos de 5 Minutos
          </h2>
          <p className="text-xs sm:text-sm text-[#b8aeca]">
            Sem precisar entender de programação, sem contratar designers caros e sem complicações técnicas.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="relative rounded-2xl border border-white/10 bg-white/[.02] p-6 text-center">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-2">
                  Passo {item.step}
                </span>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-violet-300 shadow-md mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#b9afc4]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a14] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Resultados Reais</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            O Que Nossos Clientes Estão Dizendo
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(([name, business, quote, color]) => (
            <article
              key={name}
              className="rounded-2xl border border-white/10 bg-white/[.025] p-6 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white shadow-sm shrink-0"
                    style={{ background: color }}
                  >
                    {name.slice(0, 1)}
                  </span>
                  <div>
                    <b className="text-sm text-white block">{name}</b>
                    <p className="text-[11px] text-[#b9afc4]">{business}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[#d2c8dc]">“{quote}”</p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1">
                <span>★★★★★</span>
                <span className="text-[11px] text-white/70 font-normal">Avaliação Verificada</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="relative z-10 mx-auto max-w-4xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a14] p-6 md:p-12 shadow-2xl">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">Dúvidas Frequentes</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Tudo o Que Você Precisa Saber
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqItems.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-xl border border-white/10 bg-white/[.02] px-4 data-[state=open]:bg-white/[.04] transition-all"
            >
              <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline text-left py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-[#b9afc4] pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14">
      <div className="relative overflow-hidden rounded-3xl border border-violet-300/30 bg-[linear-gradient(115deg,#47149b,#8124be_55%,#271051)] px-6 py-12 md:px-14 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Comece hoje sem custo e sem cartão</span>
            </div>
            <h2 className="max-w-xl font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
              Seu próximo cliente está a um toque do seu WhatsApp.
            </h2>
            <p className="mt-3 text-sm text-violet-100 max-w-lg leading-relaxed">
              Crie sua vitrine de alta conversão com carrossel estilo Instagram, atendente com IA e agendamento automático em menos de 5 minutos.
            </p>
          </div>

          <div className="grid gap-3 shrink-0">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-violet-950 shadow-xl hover:bg-violet-50 transition-all text-sm hover:scale-105 active:scale-95"
            >
              <span>Criar Minha Página Grátis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Já tenho uma conta · Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#09070d] py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1.3fr_.7fr_.7fr_.7fr]">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#bcb2c8]">
            A infraestrutura definitiva de conversão para negócios locais e criadores. Transforme tráfego de redes sociais e balcão físico em faturamento real.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#a99fb5]">
            <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-emerald-400" /> Atendente IA</span>
            <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400" /> Vitrine</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-sky-400" /> Agenda</span>
            <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-pink-400" /> NFC</span>
          </div>
        </div>

        {[
          ["Recursos", "Atendente Virtual IA", "Catálogo & Vitrine", "Agendamento 24h", "Tecnologia NFC", "Aplicativo PWA"],
          ["Segmentos", "Restaurantes & Bares", "Clínicas & Médicos", "Salões & Estética", "Lojas & Varejo", "Advocacia & Serviços"],
          ["Institucional", "Planos & Preços", "Acessar Conta", "Central de Dúvidas", "Termos de Uso", "Privacidade"],
        ].map(([title, ...links]) => (
          <div key={title}>
            <b className="text-sm text-white font-semibold block mb-3">{title}</b>
            <div className="grid gap-2">
              {links.map((item) => (
                <a key={item} href="#pilares" className="text-xs text-[#bcb2c8] hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col sm:flex-row items-center justify-between border-t border-white/10 px-5 pt-6 text-[11px] text-[#8f859d] gap-3">
        <span>© 2026 EiaLink — Infraestrutura de Conversão Comercial. Todos os direitos reservados.</span>
        <span>Tecnologia Proprietária de Alta Performance · Feito com excelência no Brasil</span>
      </div>
    </footer>
  );
}
