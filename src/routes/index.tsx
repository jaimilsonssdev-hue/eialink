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
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Dumbbell,
  Flame,
  Heart,
  Instagram,
  Link2,
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
  WandSparkles,
  Zap,
} from "lucide-react";
import { pageSlugFromHostname } from "@/lib/public-page-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EIA Link — Máquina de Vendas e Agendamentos para Negócios Locais" },
      {
        name: "description",
        content:
          "Transforme seu Instagram e seu balcão em uma máquina de vendas: vitrine estilo Instagram com pedidos no WhatsApp, agendamento online integrado com Google Agenda e QR Codes dinâmicos de balcão (com suporte opcional a plaquinhas NFC).",
      },
      { property: "og:title", content: "EIA Link — Máquina de Vendas e Agendamentos para Negócios Locais" },
      {
        property: "og:description",
        content:
          "Vitrine estilo Instagram com pedidos no WhatsApp, agendamento online integrado com Google Agenda e QR Codes dinâmicos de balcão (com suporte opcional a plaquinhas NFC).",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eialink.com.br/" },
      { name: "twitter:title", content: "EIA Link — Máquina de Vendas e Agendamentos" },
      {
        name: "twitter:description",
        content:
          "Sua vitrine digital estilo Instagram, agendamento com Google Agenda, QR Codes dinâmicos e WhatsApp em um só lugar.",
      },
    ],
    links: [{ rel: "canonical", href: "https://eialink.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "EIA Link",
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
    niche: "Restaurante & Delivery",
    icon: UtensilsCrossed,
    cover: "/template-assets/restaurant-demo-cover.png",
    color: "#f97316",
  },
  {
    name: "Clínica Harmonia",
    niche: "Clínica & Saúde",
    icon: Stethoscope,
    cover: "/template-assets/clinic-demo-cover.png",
    color: "#0ea5e9",
  },
  {
    name: "Studio Beauty",
    niche: "Salão & Estética",
    icon: Scissors,
    cover: "/template-assets/beauty-demo-cover.png",
    color: "#ec4899",
  },
  {
    name: "Power Gym",
    niche: "Academia & Treino",
    icon: Dumbbell,
    cover: "/template-assets/academy-gym-cover.png",
    color: "#10b981",
  },
  {
    name: "Dr. Carlos Advocacia",
    niche: "Advocacia & Consultoria",
    icon: ShieldCheck,
    cover: "/template-assets/law-office-cover.png",
    color: "#d97706",
  },
  {
    name: "Lar & Sonhos",
    niche: "Imobiliária & Loja",
    icon: Building2,
    cover: "/template-assets/store-demo-cover.png",
    color: "#6366f1",
  },
  {
    name: "Amor de Patas",
    niche: "Pet Shop & Veterinária",
    icon: PawPrint,
    cover: "/template-assets/creator-demo-cover.png",
    color: "#14b8a6",
  },
] as const;

const testimonials = [
  [
    "Rafael Martins",
    "Hamburgueria Casa do Sabor",
    "Substituímos o cardápio em PDF e o Linktree pelo EIA Link. O carrossel estilo Instagram com pedido direto no WhatsApp triplicou nossos pedidos sem pagar 27% de taxa pro iFood!",
    "#f97316",
  ],
  [
    "Dra. Juliana Alves",
    "Clínica Harmonia Estética",
    "O agendamento online sincronizado com meu Google Calendar foi um divisor de águas. Meus pacientes escolhem o horário no site e eu recebo tudo no WhatsApp. Economizei R$ 140/mês que pagava em outro app.",
    "#0ea5e9",
  ],
  [
    "Mariana Costa",
    "Studio Beauty Salão",
    "A plaquinha NFC no balcão fez a gente saltar de 18 para mais de 120 avaliações 5 estrelas no Google em 2 meses! As clientes adoram a experiência.",
    "#ec4899",
  ],
] as const;

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
          <p className="eyebrow">EIA Link</p>
          <h1 className="mt-3 text-xl font-semibold">Abrindo sua página...</h1>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={landingRef}
      className="landing-motion-root min-h-screen overflow-hidden bg-[#07060b] text-[#f8f5ff]"
    >
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_55%_0,rgba(124,58,237,.16),transparent_24rem),radial-gradient(circle_at_95%_90%,rgba(217,70,239,.11),transparent_30rem)]" />
      <Nav />
      <Hero />

      {/* SEÇÃO 1: OS 4 PILARES DA MÁQUINA DE VENDAS */}
      <div data-reveal id="superpoderes">
        <Superpowers />
      </div>

      {/* SEÇÃO 2: COMPARATIVO JEITO ANTIGO VS JEITO NOVO */}
      <div data-reveal id="comparativo">
        <Difference />
      </div>

      {/* SEÇÃO 3: TEMPLATES POR NICHO */}
      <div data-reveal id="templates">
        <Templates onPreview={setPreviewTemplate} />
      </div>

      {/* SEÇÃO 4: COMO FUNCIONA */}
      <div data-reveal id="como-funciona">
        <HowItWorks />
      </div>

      {/* SEÇÃO 5: DEPOIMENTOS DE EMPREENDEDORES */}
      <div data-reveal>
        <Testimonials />
      </div>

      {/* SEÇÃO 6: TABELA DE PREÇOS */}
      <div data-reveal id="precos">
        <PublicPricingSection />
      </div>

      {/* SEÇÃO 7: CTA FINAL */}
      <div data-reveal>
        <FinalCta />
      </div>

      <Footer />

      {/* MODAL DE PRÉVIA DO TEMPLATE */}
      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <DialogContent className="template-preview-dialog max-h-[90vh] max-w-sm overflow-y-auto">
            <DialogHeader>
              <p className="eyebrow">Prévia do modelo</p>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogDescription>
                Exemplo visual de vitrine para {previewTemplate.niche.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <TemplatePhone template={previewTemplate} featured />
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="btn-primary justify-center font-bold"
            >
              Criar com este estilo <ArrowRight className="h-4 w-4" />
            </Link>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07060b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Brand compact />
        <nav className="hidden items-center gap-6 text-xs text-[#c6bdd0] md:flex">
          <a href="#superpoderes" className="hover:text-white transition-colors">
            4 Superpoderes
          </a>
          <a href="#comparativo" className="hover:text-white transition-colors">
            Por que Funciona
          </a>
          <a href="#templates" className="hover:text-white transition-colors">
            Modelos
          </a>
          <a href="#como-funciona" className="hover:text-white transition-colors">
            Como Funciona
          </a>
          <a href="#precos" className="hover:text-white transition-colors">
            Planos
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="btn-secondary hidden text-xs sm:inline-flex">
            Entrar
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="btn-primary text-xs font-bold shadow-md shadow-fuchsia-500/20"
          >
            Criar Minha Máquina Grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-md shadow-purple-500/30">
        <Sparkles className="h-5 w-5 text-white" />
      </span>
      <div>
        <b className={compact ? "font-display text-lg tracking-tight" : "font-display text-3xl tracking-tight"}>
          EIA <span className="text-fuchsia-400">LINK</span>
        </b>
        {!compact && (
          <p className="text-[10px] font-bold tracking-[.2em] text-violet-300">
            MÁQUINA DE VENDAS LOCAL
          </p>
        )}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      data-reveal
      className="landing-motion-section landing-motion-section-1 relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-10 lg:pb-20 lg:pt-14"
    >
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(29,15,50,.94),rgba(9,7,15,.97))] p-6 shadow-[0_20px_80px_rgba(0,0,0,.4)] md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3.5 py-1 text-xs font-semibold text-fuchsia-300 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-400 animate-pulse" />
              <span>A Revolução da Presença Comercial (Físico + Digital)</span>
            </div>
            <h1 className="mt-2 max-w-xl font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
              Transforme seu Instagram e seu Balcão em uma{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Máquina de Vendas e Agendamentos.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-sm sm:text-base leading-relaxed text-[#cbc2d7]">
              Esqueça links de bio feios e sites lentos que ninguém lê. Tenha uma <strong>vitrine interativa com fotos estilo Instagram</strong>, <strong>agendamento online com Google Agenda</strong>, pedidos diretos no WhatsApp e <strong>QR Codes dinâmicos de balcão</strong> para explodir suas notas 5 estrelas no Google.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" } as never}
                className="btn-primary text-sm px-6 py-3.5 font-bold shadow-xl shadow-fuchsia-500/25 transition-all hover:scale-105"
              >
                Criar Minha Máquina Grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#superpoderes" className="btn-secondary text-sm px-5 py-3.5">
                Conhecer os 4 Superpoderes
              </a>
            </div>
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/10 text-[11px] text-[#d6cde0]">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                Carrega em 0.5s
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                Google Agenda
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                Carrossel Instagram
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <QrCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                QR Code Balcão
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-x-12 bottom-0 h-24 rounded-full bg-violet-600/35 blur-3xl pointer-events-none" />
            <TemplateRail featured />
          </div>
        </div>
      </div>
    </section>
  );
}

function Superpowers() {
  const pillars = [
    {
      icon: Flame,
      iconColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      badge: "🔥 Zero Comissões",
      title: "Carrossel de Produtos Estilo Instagram",
      subtitle: "Desperte desejo com fotos no formato 4:5 e pedidos diretos no WhatsApp.",
      desc: "Seus produtos ou pratos em fotos verticais deslizantes com preço destacado, etiquetas de destaque ('Mais Vendido', 'Promoção') e botão de 1 clique que já abre o WhatsApp do seu negócio com o pedido pronto.",
      benefit: "Economize milhares de reais em taxas de 27% de marketplaces.",
    },
    {
      icon: CalendarClock,
      iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      badge: "📅 Sincronizado Google",
      title: "Agendamento Online 24 Horas",
      subtitle: "Agenda inteligente conectada em tempo real com seu Google Calendar.",
      desc: "O cliente escolhe o serviço, profissional e horário vago pelo link. Os agendamentos bloqueiam seus horários no Google Agenda na mesma hora e enviam lembrete automático no WhatsApp.",
      benefit: "Economize mais de R$ 120/mês eliminando aplicativos como Calendly ou Trinks.",
    },
    {
      icon: QrCode,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: "🏷️ Do Balcão ao Digital",
      title: "QR Codes Dinâmicos & Tecnologia NFC",
      subtitle: "Conecte o cliente que está na sua loja física direto ao catálogo e avaliações.",
      desc: "Gere QR Codes dinâmicos para imprimir em mesas, cardápios e balcões com links que você redireciona quando quiser. O software inclui gravação Web NFC nativa para quem adquirir plaquinhas físicas (recurso adicional opcional sob consulta).",
      benefit: "Multiplique suas notas no Google Meu Negócio e atraia clientes da sua cidade.",
    },
    {
      icon: Smartphone,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      badge: "📲 Aplicativo de Bolso",
      title: "Instalação PWA na Tela do Celular",
      subtitle: "Seu negócio no bolso do cliente com ícone próprio e sem App Store.",
      desc: "Com 1 toque, seu cliente instala seu site como um aplicativo de verdade na tela principal do celular dele. Carrega na velocidade da luz, funciona sem digitar links e sem pagar US$ 99 para a Apple.",
      benefit: "Fidelização máxima: seus clientes nunca mais esquecem o seu negócio.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(20,10,35,.85),rgba(9,7,15,.95))] p-6 md:p-10 shadow-xl">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="eyebrow">DIFERENCIAIS EXCLUSIVOS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Os 4 Superpoderes da Sua Máquina de Vendas
          </h2>
          <p className="text-sm sm:text-base text-[#c4bacf]">
            Tudo o que uma empresa local precisa para vender mais no balcão físico e no digital, reunido em uma única tecnologia.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-white/10 bg-[#0d0a14] p-6 transition-all duration-200 hover:border-violet-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/30 flex flex-col justify-between"
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
                  <h3 className="font-display text-xl font-bold text-foreground text-white group-hover:text-fuchsia-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#cfc5d8] mt-1">
                    {item.subtitle}
                  </p>
                  <p className="text-xs leading-relaxed text-[#a99fb5] mt-3">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{item.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Difference() {
  const oldWay = [
    "Botões empilhados cinzas sem fotos dos produtos",
    "Cliente não vê preços e desiste da compra",
    "Sem agendamento online: dezenas de mensagens no WhatsApp",
    "Zero conexão com o balcão físico do estabelecimento",
    "70% dos visitantes saem em 5 segundos sem pedir nada",
  ];
  const newWay = [
    "Fotos no formato do Instagram que despertam desejo imediato",
    "Pedido em 1 clique no WhatsApp com nome e preço do item",
    "Agendamento automático 24/7 conectado ao Google Agenda",
    "Plaquinhas NFC inteligentes que explodem avaliações 5★ no Google",
    "O cliente instala seu negócio como aplicativo no celular dele",
    "Carregamento instantâneo em 0.5s sem burocracia nem lentidão",
  ];

  return (
    <section id="comparativo" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="grid items-stretch gap-6 rounded-3xl border border-white/10 bg-[#0d0a12] p-6 lg:grid-cols-2 md:p-8">
        {/* O JEITO ANTIGO */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold mb-4">
              <span>✕ O Jeito Antigo (Linktree / Sites Lentos)</span>
            </div>
            <h3 className="text-2xl font-bold font-display text-white">
              Por que os links comuns perdem vendas todos os dias:
            </h3>
            <ul className="mt-5 space-y-3.5 text-xs text-[#cfc5d8]">
              {oldWay.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-[11px] text-rose-300/80 font-medium italic border-t border-rose-500/20 pt-3">
            Resultado: visitantes entram, não entendem o que você vende e vão para o seu concorrente.
          </p>
        </div>

        {/* O JEITO EIA LINK */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-[#0d0a12] to-violet-950/20 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>✓ A Máquina de Vendas EIA Link</span>
            </div>
            <h3 className="text-2xl font-bold font-display text-white">
              Uma experiência visual que converte visitas em dinheiro:
            </h3>
            <ul className="mt-5 space-y-3.5 text-xs text-[#f0ebf5]">
              {newWay.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 border-t border-emerald-500/20 pt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-emerald-400">
              Vendas no WhatsApp + Reservas no Google
            </span>
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Quero Essa Vitrine
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Templates({ onPreview }: { onPreview: (template: (typeof templates)[number]) => void }) {
  return (
    <section id="templates" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.86),rgba(11,8,16,.95))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Padrão Ouro por Nicho</p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              Modelos Profissionais Testados para o Seu Ramo
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#c4bacf]">
            Com carrossel de produtos, agendamento Google e rotas locais já estruturados para o seu tipo de negócio.
          </p>
        </div>
        <div className="mt-7">
          <TemplateRail onPreview={onPreview} />
        </div>
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
        <button
          type="button"
          aria-label="Exemplo anterior"
          className="absolute left-[-1rem] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0812]/90 text-white"
          onClick={previousSlide}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo exemplo"
          className="absolute right-[-1rem] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0812]/90 text-white"
          onClick={nextSlide}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="mt-3 flex justify-center gap-1.5" aria-label="Indicadores do carrossel">
          {items.map((template, index) => (
            <button
              key={template.name}
              type="button"
              aria-label={`Ver ${template.niche}`}
              aria-current={index === activeIndex}
              className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-fuchsia-400" : "w-1.5 bg-white/30"}`}
              onClick={() => changeSlide(index, index > activeIndex ? "next" : "previous")}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none]">
      {items.map((template, index) => (
        <TemplatePhone
          key={template.name}
          template={template}
          featured={featured && index === 0}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

function getTemplateDemo(template: (typeof templates)[number]) {
  switch (template.name) {
    case "Casa do Sabor":
      return {
        eyebrow: "ABERTO AGORA",
        subtitle: "Hamburgueria artesanal",
        action: "Pedir pelo WhatsApp",
        items: ["Smash Burger", "Pizza 8 Fatias", "Brownie"],
      };
    case "Clínica Harmonia":
      return {
        eyebrow: "AGENDA ABERTA",
        subtitle: "Cuidado & Estética",
        action: "Agendar com Google",
        items: ["Limpeza de Pele", "Botox", "Harmonização"],
      };
    case "Studio Beauty":
      return {
        eyebrow: "HORÁRIO ONLINE",
        subtitle: "Sua melhor versão",
        action: "Agendar horário",
        items: ["Cabelo", "Unhas", "Make"],
      };
    case "Power Gym":
      return {
        eyebrow: "TREINO & SAÚDE",
        subtitle: "Seu próximo nível",
        action: "Agendar aula experimental",
        items: ["Musculação", "Cross", "Spinning"],
      };
    case "Dr. Carlos Advocacia":
      return {
        eyebrow: "CONSULTORIA JURÍDICA",
        subtitle: "Orientação com clareza",
        action: "Falar com advogado",
        items: ["Trabalhista", "Cível", "Empresarial"],
      };
    case "Lar & Sonhos":
      return {
        eyebrow: "IMÓVEIS SELECIONADOS",
        subtitle: "Encontre seu lugar",
        action: "Ver catálogo de imóveis",
        items: ["Comprar", "Alugar", "Falar no Zap"],
      };
    default:
      return {
        eyebrow: "CUIDADO ESPECIAL",
        subtitle: "Tudo para seu pet",
        action: "Agendar banho e tosa",
        items: ["Banho", "Vacinas", "Hotel Pet"],
      };
  }
}

function TemplatePhone({
  template,
  featured,
  onPreview,
}: {
  template: (typeof templates)[number];
  featured?: boolean;
  onPreview?: (template: (typeof templates)[number]) => void;
}) {
  const Icon = template.icon;
  const interactive = !featured && Boolean(onPreview);
  const demo = getTemplateDemo(template);
  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onPreview?.(template) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPreview?.(template);
              }
            }
          : undefined
      }
      aria-label={interactive ? `Ver prévia de ${template.name}` : undefined}
      className={`landing-template-phone ${featured ? "landing-template-phone-featured w-full" : "w-[10rem]"} flex-none snap-center overflow-hidden rounded-2xl border bg-[#0d0a12] shadow-xl transition duration-200 hover:-translate-y-1 ${interactive ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400" : ""} ${featured ? "border-violet-400/75" : "border-white/10"}`}
    >
      <div className={`landing-template-demo ${featured ? "landing-template-demo-featured" : ""}`}>
        <div
          className="landing-template-cover"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8,5,12,.08), rgba(8,5,12,.82)), url(${template.cover})`,
          }}
        >
          <span>{demo.eyebrow}</span>
          <small>{template.niche}</small>
        </div>
        <div className="landing-template-content">
          <span className="landing-template-avatar" style={{ background: template.color }}>
            <Icon />
          </span>
          <b>{template.name}</b>
          <p>{demo.subtitle}</p>
          <span className="landing-template-action" style={{ background: template.color }}>
            <MessageCircle />
            {demo.action}
            <ArrowRight />
          </span>
          <div className="landing-template-items">
            {demo.items.map((item, index) => (
              <span key={item}>
                <i style={{ background: index === 1 ? template.color : undefined }} />
                {item}
              </span>
            ))}
          </div>
          <small className="landing-template-footer">WhatsApp · Google Agenda · Localização</small>
        </div>
      </div>
      {interactive && (
        <span className="landing-template-preview-hint">Clique para ver a prévia</span>
      )}
    </article>
  );
}

function HowItWorks() {
  const steps = [
    [Store, "1. Escolha seu nicho", "Modelos pré-configurados com serviços, cores e argumentos de venda prontos."],
    [Flame, "2. Suba fotos no Carrossel", "Cadastre fotos em formato 4:5 estilo Instagram com preços e botão WhatsApp."],
    [CalendarClock, "3. Ative seu Agendamento", "Conecte seu Google Calendar para clientes agendarem horários sem conflitos."],
    [QrCode, "4. Ative seus QR Codes", "Compartilhe na bio do Instagram e gere QR Codes dinâmicos para mesas e balcão."],
  ];
  return (
    <section id="como-funciona" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a12] p-6 md:p-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow">PASSO A PASSO SIMPLES</p>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Sua Máquina de Vendas no Ar em Menos de 5 Minutos
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#b8aeca]">
            Sem precisar saber programar, sem designers caros e sem complicação.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map(([Icon, title, description], index) => {
            const StepIcon = Icon as typeof Store;
            return (
              <div key={title as string} className="relative text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/40 bg-violet-500/10 shadow-lg shadow-violet-950/40">
                  <StepIcon className="h-8 w-8 text-violet-400" />
                </span>
                {index < 3 && (
                  <ChevronRight className="absolute right-[-1.35rem] top-6 hidden h-7 w-7 text-violet-400/60 md:block" />
                )}
                <h3 className="mt-4 font-semibold text-white">{title as string}</h3>
                <p className="mx-auto mt-2 max-w-[13rem] text-xs leading-relaxed text-[#bdb3c7]">
                  {description as string}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a12] p-6 md:p-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow">PROVA SOCIAL REAL</p>
          <h2 className="mt-2 font-display text-3xl font-bold">O Que Quem Já Usa Está Dizendo</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map(([name, business, quote, color]) => (
            <article key={name} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ background: color }}
                  >
                    {name.slice(0, 1)}
                  </span>
                  <div>
                    <b className="text-sm text-white block">{name}</b>
                    <p className="text-[11px] text-[#b9afc4]">{business}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#d2c8dc]">“{quote}”</p>
              </div>
              <div className="mt-4 text-amber-400 text-xs font-bold">★★★★★ Avaliação Verificada</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-violet-300/30 bg-[linear-gradient(115deg,#47149b,#8124be_55%,#271051)] px-6 py-10 md:px-12 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-300/25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Comece hoje sem cartão de crédito</span>
            </div>
            <h2 className="max-w-xl font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
              Seu próximo cliente está a um toque do seu WhatsApp.
            </h2>
            <p className="mt-3 text-sm text-violet-100 max-w-md">
              Crie sua vitrine profissional com carrossel estilo Instagram e agendamento online em menos de 5 minutos.
            </p>
          </div>
          <div className="grid gap-3 shrink-0">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-violet-950 shadow-lg hover:bg-violet-50 transition-all text-sm"
            >
              Criar Minha Máquina Grátis <ArrowRight className="h-4 w-4" />
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
    <footer className="relative z-10 border-t border-white/10 bg-[#09070d] py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1.3fr_.7fr_.7fr_.7fr]">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-xs leading-5 text-[#bcb2c8]">
            Mais que um link na bio: a máquina híbrida de vendas, agendamentos e avaliações no Google para negócios locais.
          </p>
          <div className="mt-4 flex gap-3 text-xs text-[#a99fb5]">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> Carrossel</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-sky-400" /> Agenda</span>
            <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5 text-emerald-400" /> NFC</span>
          </div>
        </div>
        {[
          ["Superpoderes", "Carrossel Instagram", "Agendamento Google", "QR Codes & Balcão", "Aplicativo PWA"],
          ["Nichos", "Restaurantes & Bares", "Clínicas & Médicos", "Salões & Barbearias", "Lojas & Varejo"],
          ["Plataforma", "Planos & Preços", "Área do Cliente", "Central de Ajuda", "Termos & Privacidade"],
        ].map(([title, ...links]) => (
          <div key={title}>
            <b className="text-sm text-white font-semibold">{title}</b>
            <div className="mt-3 grid gap-2">
              {links.map((item) => (
                <a key={item} href="#superpoderes" className="text-xs text-[#bcb2c8] hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col sm:flex-row items-center justify-between border-t border-white/10 px-5 pt-6 text-[11px] text-[#8f859d] gap-2">
        <span>© 2026 EIA Link — A Máquina de Vendas Local. Todos os direitos reservados.</span>
        <span>Tecnologia Phygital + Web Nativa · Feito com excelência no Brasil</span>
      </div>
    </footer>
  );
}
