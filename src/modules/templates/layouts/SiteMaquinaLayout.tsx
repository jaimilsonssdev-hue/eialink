import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  HeartPulse,
  HelpCircle,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import type { CatalogItem } from "@/modules/products/types";
import {
  detectNicheKey,
  getSignatureHeroArchitectureForNiche,
  NICHE_GALLERIES,
} from "@/modules/prospecting/nichePresets";

export class SiteMaquinaLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "site-maquina" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "site-maquina";
  }
  render(model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    return <SiteMaquinaView model={model} ctx={ctx} />;
  }
}

/**
 * Retorna o HUE (0-360) padrão do Design System para cada nicho
 */
function getNicheHue(nicheKey: string): number {
  switch (nicheKey) {
    case "clinica":
    case "odontologia":
    case "medica":
    case "psicologia":
    case "nutricao":
    case "terapia":
      return 190; // Teal/Azul (Saúde e Bem-estar)
    case "restaurante":
    case "delivery":
    case "hamburgueria":
    case "pizzaria":
    case "cafeteria":
    case "sorveteria":
    case "confeitaria":
      return 30; // Laranja/Gastronomia
    case "imobiliaria":
    case "construcao":
    case "arquitetura":
    case "tecnologia":
      return 200; // Azul Corporativo / Tech
    case "advocacia":
    case "contabilidade":
      return 280; // Púrpura/Índigo Jurídico e Finanças
    case "fitness":
    case "pilates":
      return 250; // Violeta / Alta Performance
    case "beleza":
    case "salao":
    case "estetica":
    case "costura":
      return 345; // Rosa/Magenta Elegante
    case "energia_solar":
    case "petshop":
    case "veterinaria":
      return 155; // Verde Sustentável e Vida
    case "barbearia":
    case "oficina":
    case "auto":
      return 38; // Âmbar / Vintage
    default:
      return 220; // Azul Royal neutro
  }
}

function SiteMaquinaView({
  model: _model,
  ctx,
}: {
  model: TemplateRenderModel;
  ctx: LayoutRenderContext;
}) {
  const { bio, links, onTrack, products = [], supplemental } = ctx;
  const socialData = (bio.social_links as Record<string, any>) || {};

  const companyName = bio.display_name?.replace(/^\[DEMO\]\s*/i, "").trim() || "Empresa Local";
  const nicheKey = detectNicheKey(socialData.niche, companyName);
  const city = socialData.city || "sua região";
  const address = socialData.address || `${city} - Centro`;
  const rating = Number(socialData.google_rating || socialData.rating || 4.9);
  const reviewsCount = Number(socialData.reviews_count || 128);

  const customTheme = socialData.custom_theme || {};
  const hue = customTheme.hue || getNicheHue(nicheKey);

  // Arquitetura do Hero
  const heroArchitecture =
    socialData.tokens_design?.hero_architecture ||
    getSignatureHeroArchitectureForNiche(nicheKey, 0);

  // Galeria de fotos curadas do nicho
  const curated = NICHE_GALLERIES[nicheKey] || NICHE_GALLERIES.clinica || { covers: [], avatars: [] };
  const heroCover =
    bio.cover_url ||
    curated.covers?.[0]?.url ||
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=85";
  const secondaryImage =
    curated.covers?.[1]?.url ||
    curated.covers?.[2]?.url ||
    heroCover;
  const avatarImage = bio.avatar_url || curated.avatars?.[0]?.url;

  // Telefone formatado e WhatsApp
  const phone = bio.whatsapp || "5573998608747";
  const whatsappHref = whatsappUrl(
    phone,
    bio.whatsapp_message || `Olá! Vim pelo site da ${companyName} e gostaria de mais informações.`
  );

  const cleanPhoneFormatted = phone.replace(/^55/, "").replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");

  const mapsQuery = encodeURIComponent(`${companyName} ${address}`);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Estado para acordeão de FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Diferenciais contextuais
  const differentials = useMemo(() => {
    if (Array.isArray(socialData.differentials) && socialData.differentials.length > 0) {
      return socialData.differentials.slice(0, 3);
    }
    return [
      {
        icon: "award",
        title: "Qualidade & Compromisso",
        desc: "Padrão de excelência rigoroso com materiais e métodos de ponta.",
      },
      {
        icon: "heart",
        title: "Atendimento Humanizado",
        desc: "Equipe dedicada e acolhedora, focada em resolver sua necessidade.",
      },
      {
        icon: "shield",
        title: `Localização Acessível em ${city}`,
        desc: "Ambiente moderno e preparado para receber você com total conforto.",
      },
    ];
  }, [socialData.differentials, city]);

  // Passos de atendimento ("Como funciona")
  const steps = useMemo(() => {
    return [
      {
        num: "01",
        title: "Contato no WhatsApp",
        desc: `Você clica no botão e fala direto com a equipe da ${companyName} sem intermediários.`,
        icon: MessageCircle,
      },
      {
        num: "02",
        title: "Entendimento da Necessidade",
        desc: "Ouvimos com atenção o que você procura para direcionar o melhor serviço ou produto.",
        icon: Clock,
      },
      {
        num: "03",
        title: "Horário ou Pedido Confirmado",
        desc: "Agendamento ágil ou separação imediata com total flexibilidade e pontualidade.",
        icon: CalendarCheck,
      },
      {
        num: "04",
        title: "Experiência Completa",
        desc: "Ambiente confortável, máxima transparência e resultados que superam suas expectativas.",
        icon: CheckCircle2,
      },
    ];
  }, [companyName]);

  // Perguntas Frequentes por Nicho
  const faqItems = useMemo(() => {
    return [
      {
        q: `Como faço para agendar um horário ou atendimento na ${companyName}?`,
        a: `Basta clicar em qualquer botão de WhatsApp deste site. Você será direcionado diretamente para a nossa recepção, que informará os dias e horários livres mais convenientes para você em ${city}.`,
      },
      {
        q: "Quais são as formas de pagamento aceitas?",
        a: "Aceitamos cartões de crédito (com possibilidade de parcelamento facilitado), débito, PIX e dinheiro. Caso você possua convênio ou plano, nossa equipe confirma a cobertura imediatamente pelo WhatsApp.",
      },
      {
        q: `Onde a ${companyName} fica localizada?`,
        a: `Estamos situados em ${address}. Você pode conferir o mapa interativo no final desta página para traçar a melhor rota até nós pelo Google Maps ou Waze.`,
      },
      {
        q: "Como funciona a garantia e o suporte dos serviços?",
        a: "Todos os nossos atendimentos e serviços seguem rigorosos protocolos de qualidade e satisfação garantida. Prestamos acompanhamento contínuo para garantir sua máxima tranquilidade.",
      },
    ];
  }, [companyName, address, city]);

  // Links secundários do perfil
  const secondaryLinks = links.filter((l) => l.active);

  return (
    <div
      className="site-maquina-root relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary scroll-smooth pb-20 sm:pb-0"
      style={
        {
          "--hue": hue,
          "--color-900": `hsl(${hue}, 75%, 15%)`,
          "--color-800": `hsl(${hue}, 75%, 25%)`,
          "--color-700": `hsl(${hue}, 75%, 35%)`,
          "--color-600": `hsl(${hue}, 75%, 45%)`,
          "--color-500": `hsl(${hue}, 75%, 55%)`,
          "--color-400": `hsl(${hue}, 75%, 65%)`,
          "--color-300": `hsl(${hue}, 75%, 75%)`,
          "--color-200": `hsl(${hue}, 75%, 85%)`,
          "--color-100": `hsl(${hue}, 75%, 95%)`,
        } as React.CSSProperties
      }
    >
      {/* 1. BARRA UTILITÁRIA SUPERIOR */}
      <div className="bg-[var(--color-900)] text-white text-xs py-2.5 px-4 border-b border-[var(--color-800)] z-50 relative">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 opacity-90">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-300)] shrink-0" />
              <span className="truncate max-w-[260px] sm:max-w-none">{address}</span>
            </span>
            <span className="hidden sm:inline-block text-white/30">|</span>
            <span className="hidden sm:flex items-center gap-1.5 opacity-90">
              <Clock className="h-3.5 w-3.5 text-[var(--color-300)] shrink-0" />
              <span>Atendimento: Aberto Hoje</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[var(--color-300)]" />
              <span>Ver no Google Maps</span>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrack("whatsapp_click")}
              className="font-bold text-[var(--color-300)] hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>{cleanPhoneFormatted}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR PRINCIPAL STICKY COM GLASSMORPHISM */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/70 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={companyName}
                className="w-11 h-11 rounded-xl object-cover shadow-md border border-border"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-[var(--color-600)] text-white flex items-center justify-center font-black text-xl shadow-md">
                {companyName.slice(0, 1)}
              </div>
            )}
            <div>
              <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-foreground block leading-tight">
                {companyName}
              </span>
              <span className="text-xs text-[var(--color-600)] font-semibold tracking-wide uppercase">
                {nicheKey.toUpperCase()} · {city}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            {products.length > 0 && (
              <a href="#servicos" className="hover:text-[var(--color-600)] transition-colors">
                Serviços
              </a>
            )}
            <a href="#diferenciais" className="hover:text-[var(--color-600)] transition-colors">
              Diferenciais
            </a>
            <a href="#avaliacoes" className="hover:text-[var(--color-600)] transition-colors">
              Avaliações Google
            </a>
            <a href="#faq" className="hover:text-[var(--color-600)] transition-colors">
              Dúvidas
            </a>
            <a href="#contato" className="hover:text-[var(--color-600)] transition-colors">
              Localização
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrack("whatsapp_click")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              <span>Agendar no WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION COM PARALLAX SUTIL E ARQUITETURA ASSINADA */}
      <section className="relative overflow-hidden border-b border-border/60">
        {/* Ambient Radial Lighting Glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[var(--color-600)]/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {heroArchitecture === "immersive" ? (
          /* Hero Immersive: Full-bleed + Dark Overlay + Micro-stats */
          <div className="relative min-h-[540px] sm:min-h-[620px] flex items-center justify-center text-center text-white px-4 sm:px-6 py-20">
            <div className="absolute inset-0 -z-10">
              <img
                src={heroCover}
                alt={companyName}
                className="w-full h-full object-cover scale-105 transform motion-safe:animate-pulse-slow"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-gray-950/50 backdrop-blur-[2px]" />
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Referência de Atendimento em {city}</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                {companyName}
              </h1>

              <p className="text-base sm:text-xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
                {bio.description ||
                  `Atendimento humanizado e infraestrutura completa em ${city}. Experiência diferenciada para quem valoriza pontualidade e excelência.`}
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="px-8 py-4 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95"
                >
                  <MessageCircle className="h-5 w-5 text-emerald-300" />
                  <span>Falar com Atendente Agora</span>
                </a>
                <a
                  href="#servicos"
                  className="px-7 py-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-base backdrop-blur-md border border-white/30 transition-all flex items-center gap-2"
                >
                  <span>Conhecer Serviços</span>
                  <ChevronDown className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ) : heroArchitecture === "asymmetric" ? (
          /* Hero Asymmetric: Grid 2 colunas com diagonal clip-path */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-100)] text-[var(--color-600)] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Atendimento Ativo Hoje em {city}</span>
                </div>
                <h1 className="font-heading text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-none">
                  {companyName}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {bio.description ||
                    `Excelência comprovada, agendamento ágil e compromisso inegociável com a sua satisfação em ${city}.`}
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="px-8 py-4 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl transition-all flex items-center gap-3"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-300" />
                    <span>Iniciar Conversa no WhatsApp</span>
                  </a>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-4 rounded-xl border border-border bg-card/80 hover:bg-card text-foreground font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span>★ {rating.toFixed(1)} no Google</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div
                  className="rounded-3xl overflow-hidden shadow-2xl border-4 border-card/80 bg-muted"
                  style={{ clipPath: "polygon(0 0, 100% 0, 93% 100%, 0 100%)" }}
                >
                  <img src={heroCover} alt={companyName} className="w-full h-[400px] object-cover" />
                </div>
                <div className="absolute -bottom-5 -left-5 bg-card/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                    ★
                  </div>
                  <div>
                    <div className="font-heading font-black text-lg leading-tight">{rating.toFixed(1)} / 5.0</div>
                    <div className="text-[11px] text-muted-foreground">{reviewsCount} avaliações reais no Google</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Hero Padrão (Split / Centered / Typographic) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-100)] text-[var(--color-600)] text-xs font-bold uppercase tracking-wider">
                <Award className="h-3.5 w-3.5" />
                <span>Autoridade em {nicheKey} em {city}</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-tight">
                {companyName}
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {bio.description ||
                  `Atendimento de alto nível e estrutura completa em ${city}. Fale diretamente conosco e experimente a diferença.`}
              </p>
              <div className="flex justify-center pt-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="px-8 py-4 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
                >
                  <MessageCircle className="h-5 w-5 text-emerald-300" />
                  <span>Agendar Atendimento no WhatsApp</span>
                </a>
              </div>
              <div className="mt-10 rounded-3xl overflow-hidden shadow-2xl max-w-3xl mx-auto border-4 border-card/80">
                <img src={heroCover} alt={companyName} className="w-full h-80 sm:h-96 object-cover" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. FAIXA DE CREDIBILIDADE & SELOS DE CONFIANÇA */}
      <section className="bg-gray-950 text-white py-8 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[var(--color-300)] text-lg shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-white">Excelência no Atendimento</div>
                <div className="text-xs text-gray-400">Padrão humanizado e ético</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 text-lg shrink-0">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-white">{rating.toFixed(1)} no Google Maps</div>
                <div className="text-xs text-gray-400">Reputação oficial comprovada</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-white">Confirmação Rápida</div>
                <div className="text-xs text-gray-400">Direto via WhatsApp</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[var(--color-300)] text-lg shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-white">Fácil Acesso</div>
                <div className="text-xs text-gray-400">{address.split("-")[0] || city}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FLUXO DE 4 PASSOS ("COMO FUNCIONA O ATENDIMENTO") */}
      <section className="py-20 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
              Passo a Passo
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
              Como funciona o atendimento
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Do primeiro contato no WhatsApp até a entrega com excelência em {city}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-[var(--color-500)]/60 transition-all group hover:shadow-lg relative flex flex-col justify-between"
                >
                  <div>
                    <div className="text-3xl font-black text-muted-foreground/30 group-hover:text-[var(--color-500)]/40 transition-colors mb-4">
                      {step.num}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-100)] text-[var(--color-600)] flex items-center justify-center text-xl mb-4">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. VITRINE DE SERVIÇOS & ESPECIALIDADES EM BENTO GRID */}
      {products.length > 0 && (
        <section id="servicos" className="py-20 bg-background border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                Soluções & Procedimentos
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
                Serviços da {companyName}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Conheça as principais opções e solicite atendimento rápido no WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item: CatalogItem) => {
                const itemWhatsapp = whatsappUrl(
                  phone,
                  `Olá! Gostaria de agendar ou saber mais sobre o serviço: *${item.name}* que vi no site.`
                );
                return (
                  <div
                    key={item.id}
                    className="group bg-card rounded-2xl border border-border hover:border-[var(--color-600)]/70 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {item.image_url ? (
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {item.category && (
                            <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                              {item.category}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-[var(--color-100)] flex items-center justify-center text-[var(--color-600)] font-bold">
                          <Sparkles className="h-8 w-8 opacity-60" />
                        </div>
                      )}
                      <div className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-[var(--color-600)] transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.price && Number(item.price) > 0 && (
                          <div className="text-sm font-bold text-[var(--color-600)] pt-1">
                            R$ {Number(item.price).toFixed(2).replace(".", ",")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <a
                        href={itemWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("service_click", item.id)}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--color-100)] text-[var(--color-600)] hover:bg-[var(--color-600)] hover:text-white font-bold text-xs sm:text-sm transition-all duration-200"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{item.button_label || "Solicitar via WhatsApp"}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. DIFERENCIAIS ("POR QUE NOS ESCOLHER") + CARD FLUTUANTE GOOGLE */}
      <section id="diferenciais" className="py-20 bg-card/30 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                Diferenciais
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground leading-tight">
                Por que a {companyName} se destaca em {city}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Nosso compromisso é entregar máxima excelência com foco no conforto, satisfação e segurança de quem nos procura.
              </p>

              <div className="space-y-4 pt-2">
                {differentials.map((diff: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4.5 rounded-2xl bg-card border border-border shadow-2xs hover:border-[var(--color-500)]/50 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-600)] text-white flex items-center justify-center shrink-0 shadow-sm">
                      {diff.icon === "shield" ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : diff.icon === "heart" ? (
                        <HeartPulse className="h-5 w-5" />
                      ) : (
                        <Award className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-foreground text-base">{diff.title}</h4>
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{diff.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-card bg-muted">
                <img src={secondaryImage} alt={companyName} className="w-full h-[460px] object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-2xl font-black">
                  ★
                </div>
                <div>
                  <div className="font-heading font-black text-2xl text-foreground leading-tight">
                    {rating.toFixed(1)} / 5.0
                  </div>
                  <div className="text-xs text-muted-foreground">Nota oficial no Google Maps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PROVA SOCIAL OFICIAL GOOGLE MAPS */}
      <section id="avaliacoes" className="py-20 bg-background border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-3xl p-8 sm:p-14 border border-border shadow-xl text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-muted/80 text-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>Perfil Verificado no Google Maps</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground leading-tight">
              Avaliação Pública da {companyName}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Transparência com a reputação real de quem frequenta nosso espaço em {city}.
            </p>

            <div className="my-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6 px-8 rounded-2xl bg-muted/40 border border-border max-w-2xl mx-auto">
              <div className="text-center">
                <div className="font-heading font-black text-5xl text-foreground tracking-tight">
                  {rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 text-amber-400 text-lg mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">Escala de 1 a 5 estrelas</span>
              </div>

              <div className="w-px h-16 bg-border hidden sm:block" />

              <div className="text-center sm:text-left">
                <div className="font-heading font-bold text-lg text-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>{reviewsCount} Avaliações Verificadas</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Notas registradas diretamente por clientes na ficha oficial do Google Maps.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-card text-foreground border-2 border-border hover:border-foreground/80 px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-2xs"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Conferir Avaliações no Google Maps</span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Agendar Atendimento</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PERGUNTAS FREQUENTES (FAQ ACCORDION INTERATIVO) */}
      <section id="faq" className="py-20 bg-card/30 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
              Dúvidas Comuns
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Tire suas dúvidas antes de agendar sua visita conosco em {city}.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 flex items-center justify-between text-left font-heading font-bold text-foreground text-base sm:text-lg hover:text-[var(--color-600)] transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm transition-transform duration-300 ${
                        isOpen ? "rotate-180 bg-[var(--color-600)] text-white" : ""
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-4 animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. LOCALIZAÇÃO E CONTATO COM MAPA INTERATIVO EMBED */}
      <section id="contato" className="py-20 bg-background border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-950 text-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Lado Esquerdo: Dados de Contato */}
              <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-300)] bg-white/10 px-3 py-1 rounded-full">
                    Fale Conosco
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl font-black mt-4 leading-tight">
                    Venha nos visitar ou mande uma mensagem
                  </h2>
                  <p className="text-gray-300 mt-3 text-sm sm:text-base leading-relaxed">
                    Estamos à sua disposição em {city}, prontos para lhe atender com dedicação.
                  </p>

                  <div className="mt-8 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                        <MapPin className="h-5 w-5 text-[var(--color-300)]" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Endereço</div>
                        <div className="font-semibold text-sm sm:text-base text-white">{address}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                        <MessageCircle className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">WhatsApp Oficial</div>
                        <div className="font-semibold text-sm sm:text-base text-white">{cleanPhoneFormatted}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Google Maps</div>
                        <div className="font-semibold text-sm sm:text-base text-white">
                          {rating.toFixed(1)} Estrelas Verificadas ({reviewsCount} opiniões)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Falar no WhatsApp Agora</span>
                  </a>
                </div>
              </div>

              {/* Lado Direito: Mapa Interativo ao Vivo */}
              <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-gray-900/60 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="font-heading font-bold text-sm text-white">Localização no Google Maps</span>
                  </div>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-300)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Abrir Rota</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 h-80 w-full relative bg-gray-900">
                  <iframe
                    title={`Mapa de localização da ${companyName}`}
                    className="w-full h-full border-0"
                    src={`https://maps.google.com/maps?q=${mapsQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <p className="text-gray-400 text-xs text-center mt-3">{address}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LINKS ADICIONAIS / PIX SE CONFIGURADO */}
      {bio.pix_key && (
        <div className="max-w-md mx-auto px-4 py-8">
          <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
        </div>
      )}

      {/* Módulos Suplementares (Agenda / Atendente) */}
      {supplemental && <div className="max-w-5xl mx-auto px-4">{supplemental}</div>}

      {/* 11. FOOTER INSTITUCIONAL */}
      <footer className="bg-gray-950 text-gray-400 text-xs py-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
            <div className="w-6 h-6 rounded bg-[var(--color-600)] flex items-center justify-center text-xs">
              ★
            </div>
            <span>{companyName}</span>
          </div>
          <div>
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </div>
          <div className="text-gray-500 text-[11px]">
            Desenvolvido com tecnologia de alta conversão
          </div>
        </div>
      </footer>

      {/* 12. BOTÃO FLUTUANTE WHATSAPP PARA DESKTOP */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onTrack("whatsapp_click")}
        className="hidden sm:flex fixed bottom-6 right-6 z-50 items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white p-4 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group"
        aria-label="Falar no WhatsApp"
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <MessageCircle className="h-6 w-6 relative" />
        </div>
        <span className="font-heading font-bold text-sm">Atendimento Online</span>
      </a>

      {/* 13. MOBILE ACTION DOCK (BARRA FIXA INFERIOR NO CELULAR) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-black text-xs text-foreground truncate">{companyName}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="text-amber-500 font-bold">★ {rating.toFixed(1)}</span>
            <span>· {city}</span>
          </span>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("whatsapp_click")}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Agendar</span>
        </a>
      </div>
    </div>
  );
}

