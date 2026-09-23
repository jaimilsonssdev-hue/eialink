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
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { PixCard } from "@/components/public-profile/PixCard";
import {
  InstagramProductCarousel,
  type ProductCarouselConfig,
} from "@/components/public-profile/InstagramProductCarousel";
import { whatsappUrl } from "@/lib/whatsapp";
import type { CatalogItem } from "@/modules/products/types";
import {
  detectNicheKey,
  getSignatureHeroArchitectureForNiche,
  NICHE_GALLERIES,
} from "@/modules/prospecting/nichePresets";
import { CommercialSettingsService } from "@/modules/settings/services/CommercialSettingsService";

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
      return 185; // Teal/Azul (Policlínica RMed / Saúde)
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
      return 210; // Azul Corporativo / Tech
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
      return 340; // Rosa/Magenta Elegante
    case "energia_solar":
    case "petshop":
    case "veterinaria":
      return 155; // Verde Sustentável e Vida
    case "barbearia":
    case "oficina":
    case "auto":
      return 38; // Âmbar / Vintage
    default:
      return 185; // Padrão Policlínica RMed (Teal 185)
  }
}

function hexToHue(hex?: string): number | null {
  if (!hex || !hex.startsWith("#")) return null;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max === min) return 0;
  const d = max - min;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }
  return Math.round(h * 60);
}

const NICHE_LABELS: Record<string, string> = {
  clinica: "Clínica Médica",
  odontologia: "Clínica Odontológica",
  psicologia: "Psicologia & Saúde Mental",
  nutricao: "Nutrição Clínica",
  terapia: "Terapia & Bem-Estar",
  restaurante: "Restaurante & Gastronomia",
  delivery: "Delivery & Lanches",
  hamburgueria: "Hamburgueria",
  pizzaria: "Pizzaria",
  cafeteria: "Cafeteria Especial",
  sorveteria: "Sorvetes & Açaí",
  confeitaria: "Doceria & Confeitaria",
  loja: "Loja & Vestuário",
  petshop: "Pet Shop & Veterinária",
  veterinaria: "Clínica Veterinária",
  barbearia: "Barbearia",
  beleza: "Estética & Beleza",
  salao: "Salão de Beleza",
  estetica: "Clínica de Estética",
  fitness: "Academia & Treino",
  pilates: "Estúdio de Pilates",
  advocacia: "Advocacia & Assessoria",
  contabilidade: "Contabilidade & Finanças",
  imobiliaria: "Imobiliária",
  construcao: "Construção & Reformas",
  arquitetura: "Arquitetura & Interiores",
  energia_solar: "Energia Solar Fotovoltaica",
  oficina: "Auto Center & Mecânica",
  tecnologia: "Tecnologia & TI",
  marketing: "Marketing Digital & Tráfego",
  costura: "Ateliê & Alta Costura",
  geral: "Empresa & Atendimento",
};

function hexLuminance(hex?: string): number {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return 100;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
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
  const nicheLabel = NICHE_LABELS[nicheKey] || "Empresa";
  const city = socialData.city || "sua região";
  const address = socialData.address || `${city} - Centro`;
  const rating = Number(socialData.google_rating || socialData.rating || 4.9);
  const reviewsCount = Number(socialData.reviews_count || 73);

  const customTheme = (socialData.custom_theme as Record<string, any>) || {};
  const customPrimary = customTheme.primary;
  const customBg = customTheme.background;
  const isLightMode = customTheme.mode === "light" || (!customTheme.mode && !customBg) || (customBg && hexLuminance(customBg) > 140);
  const customTitle = customTheme.title || (isLightMode ? "#111827" : "#ffffff");
  const customText = customTheme.text || (isLightMode ? "#374151" : "#e2e8f0");
  const hue = customTheme.hue || (customTheme.primary ? hexToHue(customTheme.primary) : null) || getNicheHue(nicheKey);

  // Customizações individuais por seção e reordenação
  const sectionStyles = (socialData.section_styles as Record<string, any>) || {};
  const DEFAULT_SECTIONS_ORDER = useMemo(
    () => ["hero", "product_carousel", "credibility", "steps", "servicos", "diferenciais", "avaliacoes", "faq", "contato"],
    []
  );

  const sectionsOrder: string[] = useMemo(() => {
    if (Array.isArray(socialData.sections_order) && socialData.sections_order.length > 0) {
      const order = [...socialData.sections_order];
      // Se product_carousel não estiver explicitamente em order, insere na posição #2 (logo após 'hero')
      if (!order.includes("product_carousel")) {
        const heroIdx = order.indexOf("hero");
        if (heroIdx !== -1) {
          order.splice(heroIdx + 1, 0, "product_carousel");
        } else {
          order.unshift("product_carousel");
        }
      }
      for (const def of DEFAULT_SECTIONS_ORDER) {
        if (!order.includes(def)) order.push(def);
      }
      return order;
    }
    return DEFAULT_SECTIONS_ORDER;
  }, [socialData.sections_order, DEFAULT_SECTIONS_ORDER]);

  const getSectionConfig = (key: string, defaultTitleColor?: string, defaultTextColor?: string) => {
    const s = sectionStyles[key] || {};
    return {
      title: s.title as string | undefined,
      subtitle: s.subtitle as string | undefined,
      titleColor: s.title_color || defaultTitleColor,
      textColor: s.text_color || defaultTextColor,
      bgColor: s.bg_color as string | undefined,
      fontFamily: s.font_family as string | undefined,
      fontSize: s.font_size as "sm" | "base" | "lg" | "xl" | undefined,
      visible: s.visible !== false,
    };
  };

  const getHeadingSizeClass = (size?: string, defaultClass = "text-2xl sm:text-3xl lg:text-4xl") => {
    switch (size) {
      case "sm":
        return "text-xl sm:text-2xl lg:text-3xl";
      case "base":
        return "text-2xl sm:text-3xl lg:text-4xl";
      case "lg":
        return "text-3xl sm:text-4xl lg:text-5xl";
      case "xl":
        return "text-4xl sm:text-5xl lg:text-6xl";
      default:
        return defaultClass;
    }
  };

  // Arquitetura da Hero
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
    (socialData.secondary_image as string) ||
    curated.covers?.[1]?.url ||
    curated.covers?.[2]?.url ||
    heroCover;
  const avatarImage = bio.avatar_url || curated.avatars?.[0]?.url;

  // Telefone formatado e WhatsApp
  const phone =
    bio.whatsapp?.replace(/\D/g, "") ||
    CommercialSettingsService.getInitialCachedNumber();
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
        desc: "Equipe acolhedora e atenta, focada em resolver sua necessidade com conforto.",
      },
      {
        icon: "shield",
        title: `Localização Acessível em ${city}`,
        desc: "Ambiente moderno e preparado para receber você com máxima comodidade.",
      },
    ];
  }, [socialData.differentials, city]);

  // Passos de atendimento ("Como funciona")
  const steps = useMemo(() => {
    return [
      {
        num: "01",
        title: "Contato no WhatsApp",
        desc: `Você clica no botão e fala direto com a recepção da ${companyName} sem intermediários.`,
        icon: MessageCircle,
      },
      {
        num: "02",
        title: "Entendimento da Necessidade",
        desc: "Ouvimos com atenção o que você procura para direcionar o melhor serviço ou procedimento.",
        icon: Clock,
      },
      {
        num: "03",
        title: "Horário Reservado",
        desc: "Agendamento ágil e pontual em dia e horário mais convenientes para você.",
        icon: CalendarCheck,
      },
      {
        num: "04",
        title: "Cuidado Completo",
        desc: "Experiência tranquila, ambiente confortável e resultados que superam suas expectativas.",
        icon: CheckCircle2,
      },
    ];
  }, [companyName]);

  // Perguntas Frequentes por Nicho
  const faqItems = useMemo(() => {
    return [
      {
        q: `Como faço para agendar um horário de atendimento na ${companyName}?`,
        a: `Basta clicar em qualquer botão de WhatsApp deste site. Você será direcionado diretamente para nossa equipe, que informará os dias e horários livres mais convenientes para você em ${city}.`,
      },
      {
        q: "Quais são as formas de pagamento aceitas?",
        a: "Aceitamos cartões de crédito (com possibilidade de parcelamento facilitado), débito, PIX e dinheiro. Caso você possua convênio ou benefício, nossa equipe confirma a cobertura imediatamente pelo WhatsApp.",
      },
      {
        q: `Onde a ${companyName} fica localizada?`,
        a: `Estamos situados em ${address}. Você pode conferir o mapa interativo no final desta página para traçar a melhor rota até nós pelo Google Maps ou Waze.`,
      },
      {
        q: "É necessário levar algum documento no primeiro comparecimento?",
        a: "Recomendamos trazer um documento de identificação com foto (RG ou CNH). Caso possua exames recentes ou histórico prévio, você também pode trazê-los para enriquecer seu atendimento.",
      },
    ];
  }, [companyName, address, city]);

  // Lista de serviços para o Bento Grid
  const displayServices: CatalogItem[] = useMemo(() => {
    if (products.length > 0) return products;
    return [
      {
        id: "serv-1",
        bio_page_id: bio.id,
        type: "service",
        name: "Consultas & Avaliações Especializadas",
        description: "Avaliação completa com profissionais de referência, diagnóstico seguro e ambiente acolhedor.",
        price: null,
        image_url: heroCover,
        button_label: "Agendar este Procedimento",
        button_url: null,
        position: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "serv-2",
        bio_page_id: bio.id,
        type: "service",
        name: "Procedimentos de Rotina & Cuidados",
        description: "Agilidade na realização de procedimentos para você iniciar seus cuidados sem esperas desnecessárias.",
        price: null,
        image_url: secondaryImage,
        button_label: "Tirar dúvidas pelo WhatsApp",
        button_url: null,
        position: 1,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "serv-3",
        bio_page_id: bio.id,
        type: "service",
        name: "Acompanhamento Contínuo",
        description: "Planos de cuidado personalizado para garantir sua tranquilidade, disposição e bem-estar permanente.",
        price: null,
        image_url: null,
        button_label: "Consultar horários",
        button_url: null,
        position: 2,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }, [products, bio.id, heroCover, secondaryImage]);

  const renderSection = (sectionKey: string): ReactNode => {
    switch (sectionKey) {
      case "hero": {
        const heroCfg = sectionStyles.hero || {};
        const isGenericTemplateTitle = (t?: string) =>
          !t ||
          t.toLowerCase().includes("policlínica rmed") ||
          t.toLowerCase().includes("empresa local") ||
          t.startsWith("[DEMO]");
        const heroTitle =
          (!isGenericTemplateTitle(heroCfg.title) ? heroCfg.title : null) || companyName;
        const heroSubtitle =
          heroCfg.subtitle ||
          bio.description ||
          `Atendimento humanizado e infraestrutura completa em ${city}. Experiência diferenciada para quem valoriza pontualidade e excelência.`;
        const heroFont = heroCfg.font_family || undefined;

        return (
          <section
            id="hero"
            className="relative overflow-hidden border-b border-gray-100"
            style={{ backgroundColor: heroCfg.bg_color || undefined }}
          >
            {heroArchitecture === "asymmetric" ? (
              /* Hero Asymmetric: 2 colunas com diagonal e foto */
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-100)] text-[var(--color-600)] text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Atendimento Ativo Hoje em {city}</span>
                    </div>
                    <h1
                      className={`font-heading font-black tracking-tight leading-tight ${getHeadingSizeClass(
                        heroCfg.font_size,
                        "text-3xl sm:text-5xl lg:text-6xl"
                      )}`}
                      style={{ color: heroCfg.title_color || customTitle, fontFamily: heroFont }}
                    >
                      {heroTitle}
                    </h1>
                    <p
                      className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0"
                      style={{ color: heroCfg.text_color || customText, fontFamily: heroFont }}
                    >
                      {heroSubtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("whatsapp_click")}
                        style={{ backgroundColor: customPrimary || undefined }}
                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <MessageCircle className="h-5 w-5 text-emerald-300" />
                        <span>Iniciar Conversa no WhatsApp</span>
                      </a>
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>★ {rating.toFixed(1)} no Google</span>
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-5 relative">
                    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
                      <img src={heroCover} alt={companyName} className="w-full h-72 sm:h-96 object-cover" />
                    </div>
                    <div className="absolute -bottom-4 left-4 sm:-bottom-6 sm:-left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 max-w-[calc(100%-2rem)]">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center font-black text-lg shrink-0">
                        ★
                      </div>
                      <div className="min-w-0">
                        <div className="font-heading font-black text-lg text-gray-900 leading-tight">
                          {rating.toFixed(1)} / 5.0
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {reviewsCount} avaliações reais no Google
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : heroArchitecture === "immersive" ? (
              /* Hero Immersive: Full-bleed com Overlay Dark Garantido e Alto Contraste */
              <div className="relative isolate min-h-[480px] sm:min-h-[580px] flex items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <img src={heroCover} alt={companyName} className="w-full h-full object-cover scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-gray-950/60 backdrop-blur-[1px]" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Referência de Atendimento em {city}</span>
                  </div>

                  <h1
                    className={`font-heading font-black tracking-tight leading-tight text-white drop-shadow-md ${getHeadingSizeClass(
                      heroCfg.font_size,
                      "text-3xl sm:text-5xl lg:text-6xl"
                    )}`}
                    style={{
                      color: (heroCfg.title_color && hexLuminance(heroCfg.title_color) > 130)
                        ? heroCfg.title_color
                        : "#ffffff",
                      fontFamily: heroFont,
                    }}
                  >
                    {heroTitle}
                  </h1>

                  <p
                    className="text-base sm:text-xl font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-sm text-white/90"
                    style={{
                      color: (heroCfg.text_color && hexLuminance(heroCfg.text_color) > 120)
                        ? heroCfg.text_color
                        : "rgba(255, 255, 255, 0.9)",
                      fontFamily: heroFont,
                    }}
                  >
                    {heroSubtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                      style={{ backgroundColor: customPrimary || undefined }}
                      className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <MessageCircle className="h-5 w-5 text-emerald-300" />
                      <span>Falar com Atendente Agora</span>
                    </a>
                    <a
                      href="#servicos"
                      className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-base backdrop-blur-md border border-white/40 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>Conhecer Serviços</span>
                      <ChevronDown className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* Hero Centered (Padrão de policlinica-rmed/index.html & template_base.html) */
              <div className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20 lg:py-28 text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-100)] text-[var(--color-600)] text-xs font-bold uppercase tracking-wider mb-6">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Autoridade em {nicheLabel} em {city}</span>
                  </div>
                  <h1
                    className={`font-heading font-black tracking-tight leading-tight ${getHeadingSizeClass(
                      heroCfg.font_size,
                      "text-3xl sm:text-5xl lg:text-6xl"
                    )}`}
                    style={{ color: heroCfg.title_color || customTitle, fontFamily: heroFont }}
                  >
                    {heroTitle}
                  </h1>
                  <p
                    className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
                    style={{ color: heroCfg.text_color || customText, fontFamily: heroFont }}
                  >
                    {heroSubtitle}
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                      style={{ backgroundColor: customPrimary || undefined }}
                      className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <MessageCircle className="h-5 w-5 text-emerald-300" />
                      <span>Solicitar Informações no WhatsApp</span>
                    </a>
                  </div>
                  <div className="mt-10 sm:mt-12 rounded-3xl overflow-hidden shadow-2xl max-w-3xl mx-auto border-4 border-white bg-gray-100">
                    <img src={heroCover} alt={companyName} className="w-full h-64 sm:h-80 lg:h-96 object-cover" />
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      }

      case "product_carousel": {
        const carouselConfig = socialData.product_carousel as ProductCarouselConfig | undefined;
        const hasCarousel = Boolean(
          carouselConfig?.enabled &&
          Array.isArray(carouselConfig.items) &&
          carouselConfig.items.some((i) => i.name && i.image_url)
        );
        if (!hasCarousel) return null;

        const pcfg = getSectionConfig("product_carousel");
        return (
          <section
            id="product_carousel"
            style={{ backgroundColor: pcfg.bgColor || undefined }}
            className="w-full py-8 sm:py-12 border-b border-gray-100/80 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <InstagramProductCarousel
                bio={bio}
                config={{
                  ...carouselConfig!,
                  title: pcfg.title || carouselConfig?.title || "Destaques & Mais Pedidos",
                  subtitle: pcfg.subtitle || carouselConfig?.subtitle || "Arraste para o lado e faça seu pedido direto no WhatsApp",
                }}
                onTrack={onTrack}
              />
            </div>
          </section>
        );
      }

      case "credibility": {
        const credCfg = sectionStyles.credibility || {};
        return (
          <section
            id="credibilidade"
            className="bg-gray-900 text-white py-6 sm:py-8 border-y border-gray-800"
            style={{ backgroundColor: credCfg.bg_color || undefined }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[var(--color-300)] text-lg shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs sm:text-sm text-white">Excelência no Atendimento</div>
                    <div className="text-[11px] sm:text-xs text-gray-400">Padrão humanizado e ético</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 text-lg shrink-0">
                    <Star className="h-5 w-5 fill-amber-400" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs sm:text-sm text-white">{rating.toFixed(1)} no Google Maps</div>
                    <div className="text-[11px] sm:text-xs text-gray-400">Reputação verificada</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs sm:text-sm text-white">Confirmação Rápida</div>
                    <div className="text-[11px] sm:text-xs text-gray-400">Direto via WhatsApp</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[var(--color-300)] text-lg shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs sm:text-sm text-white">Fácil Acesso</div>
                    <div className="text-[11px] sm:text-xs text-gray-400 truncate max-w-[140px] sm:max-w-none">{address.split("-")[0] || city}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "steps": {
        const stepsCfg = sectionStyles.steps || {};
        return (
          <section
            id="como-funciona"
            className="py-16 sm:py-20 border-b border-gray-100"
            style={{ backgroundColor: stepsCfg.bg_color || (isLightMode ? "#ffffff" : "#0d1117") }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                  Passo a Passo
                </span>
                <h2
                  className={`font-heading font-black mt-3 ${getHeadingSizeClass(stepsCfg.font_size)}`}
                  style={{
                    color: stepsCfg.title_color || (isLightMode ? "#111827" : "#ffffff"),
                    fontFamily: stepsCfg.font_family || undefined,
                  }}
                >
                  {stepsCfg.title || "Como funciona o atendimento"}
                </h2>
                <p
                  className="mt-2 text-sm sm:text-base"
                  style={{
                    color: stepsCfg.text_color || (isLightMode ? "#4b5563" : "#cbd5e1"),
                    fontFamily: stepsCfg.font_family || undefined,
                  }}
                >
                  {stepsCfg.subtitle || `Do primeiro contato no WhatsApp até a entrega com excelência em ${city}.`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, idx) => {
                  const IconComponent = step.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-[var(--color-400)] transition-all group hover:shadow-md relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-3xl font-black text-gray-200 group-hover:text-[var(--color-200)] transition-colors mb-3">
                          {step.num}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-[var(--color-600)] text-xl mb-4 border border-gray-100">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      case "servicos": {
        if (displayServices.length === 0) return null;
        const servCfg = sectionStyles.servicos || {};
        return (
          <section
            id="servicos"
            className="py-16 sm:py-20 border-b border-gray-100"
            style={{ backgroundColor: servCfg.bg_color || (isLightMode ? "#f9fafb" : "#0b0f19") }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                  Especialidades & Soluções
                </span>
                <h2
                  className={`font-heading font-black mt-3 ${getHeadingSizeClass(servCfg.font_size)}`}
                  style={{
                    color: servCfg.title_color || (isLightMode ? "#111827" : "#ffffff"),
                    fontFamily: servCfg.font_family || undefined,
                  }}
                >
                  {servCfg.title || `Soluções da ${companyName}`}
                </h2>
                <p
                  className="mt-2 text-sm sm:text-base"
                  style={{
                    color: servCfg.text_color || (isLightMode ? "#4b5563" : "#cbd5e1"),
                    fontFamily: servCfg.font_family || undefined,
                  }}
                >
                  {servCfg.subtitle || `Conheça as principais áreas e solicite atendimento rápido no WhatsApp em ${city}.`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Destaque Principal (Bento Grid Span 2) */}
                {displayServices[0] && (
                  <div className="md:col-span-2 bg-gradient-to-br from-white to-gray-50/80 p-6 sm:p-10 rounded-3xl border-2 border-[var(--color-300)] shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-100)] rounded-full blur-3xl opacity-60 pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--color-600)] text-white flex items-center justify-center text-xl sm:text-2xl shadow-md">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3.5 py-1.5 rounded-full border border-[var(--color-200)]">
                          ⭐ Serviço em Alta
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-xl sm:text-3xl text-gray-900 mb-3">
                        {displayServices[0].name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                        {displayServices[0].description?.replace(/^\[.*?\]\s*/, "") ||
                          "Avaliação completa com corpo profissional qualificado, diagnóstico assertivo e ambiente acolhedor."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Equipe dedicada e atenciosa</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Estrutura moderna e confortável</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Garantia e acompanhamento</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <a
                        href={whatsappUrl(
                          phone,
                          `Olá! Gostaria de agendar ou saber mais sobre o serviço: *${displayServices[0].name}* que vi no site.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("service_click", displayServices[0].id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[var(--color-600)] hover:bg-[var(--color-700)] px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-300" />
                        <span>Agendar este Procedimento</span>
                      </a>
                      <span className="text-xs text-gray-500 font-medium">Atendimento com hora marcada</span>
                    </div>
                  </div>
                )}

                {/* Cards Secundários (Bento Grid Col 1) */}
                {displayServices.slice(1, 3).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-100)] text-[var(--color-600)] flex items-center justify-center text-xl mb-6 shadow-inner">
                        {idx === 0 ? <HeartPulse className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                      </div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-gray-900 mb-3">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {item.description?.replace(/^\[.*?\]\s*/, "") ||
                          "Agilidade na realização de procedimentos para você iniciar seus cuidados sem esperas desnecessárias."}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <a
                        href={whatsappUrl(phone, `Olá! Gostaria de mais informações sobre: *${item.name}*.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("service_click", item.id)}
                        className="text-[var(--color-600)] font-bold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        <span>Tirar dúvidas pelo WhatsApp</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demais serviços se houver mais de 3 */}
              {displayServices.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {displayServices.slice(3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-heading font-bold text-base text-gray-900 mb-2">{item.name}</h4>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                          {item.description?.replace(/^\[.*?\]\s*/, "")}
                        </p>
                      </div>
                      <a
                        href={whatsappUrl(phone, `Olá! Vi o serviço *${item.name}* no site e gostaria de agendar.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("service_click", item.id)}
                        className="text-xs font-bold text-[var(--color-600)] flex items-center gap-1.5 hover:underline"
                      >
                        <span>Consultar no WhatsApp</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }

      case "diferenciais": {
        const diffCfg = sectionStyles.diferenciais || {};
        return (
          <section
            id="diferenciais"
            className="py-16 sm:py-20 border-b border-gray-100"
            style={{ backgroundColor: diffCfg.bg_color || (isLightMode ? "#ffffff" : "#0d1117") }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                    Diferenciais
                  </span>
                  <h2
                    className={`font-heading font-black mt-4 leading-tight ${getHeadingSizeClass(diffCfg.font_size)}`}
                    style={{
                      color: diffCfg.title_color || (isLightMode ? "#111827" : "#ffffff"),
                      fontFamily: diffCfg.font_family || undefined,
                    }}
                  >
                    {diffCfg.title || `Por que a ${companyName} se destaca em ${address.split("-")[0] || city}`}
                  </h2>
                  <p
                    className="mt-4 text-base leading-relaxed"
                    style={{
                      color: diffCfg.text_color || (isLightMode ? "#4b5563" : "#cbd5e1"),
                      fontFamily: diffCfg.font_family || undefined,
                    }}
                  >
                    {diffCfg.subtitle || `Nosso compromisso é entregar excelência com foco na satisfação, segurança e conforto de quem nos procura em ${city}.`}
                  </p>

                  <div className="mt-8 space-y-4">
                    {differentials.map((diff: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-600)] text-white flex items-center justify-center shrink-0">
                          {diff.icon === "shield" ? (
                            <ShieldCheck className="h-5 w-5" />
                          ) : diff.icon === "heart" ? (
                            <HeartPulse className="h-5 w-5" />
                          ) : (
                            <Award className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-gray-900 text-base">{diff.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{diff.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
                    <img src={secondaryImage} alt={companyName} className="w-full h-72 sm:h-[420px] lg:h-[450px] object-cover" />
                  </div>
                  <div className="absolute -bottom-4 left-4 sm:-bottom-6 sm:-left-6 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 max-w-[calc(100%-2rem)]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0">
                      ★
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-black text-xl sm:text-2xl text-gray-900 leading-tight">
                        {rating.toFixed(1)} / 5.0
                      </div>
                      <div className="text-xs text-gray-500 truncate">Nota oficial no Google Maps</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "avaliacoes": {
        const avalCfg = sectionStyles.avaliacoes || {};
        return (
          <section
            id="avaliacoes"
            className="py-16 sm:py-20 border-b border-gray-100"
            style={{ backgroundColor: avalCfg.bg_color || (isLightMode ? "#f9fafb" : "#0b0f19") }}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-100 shadow-xl text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-100)] rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Perfil Verificado no Google Maps</span>
                </div>

                <h2
                  className={`font-heading font-black leading-tight ${getHeadingSizeClass(avalCfg.font_size)}`}
                  style={{
                    color: avalCfg.title_color || (isLightMode ? "#111827" : "#ffffff"),
                    fontFamily: avalCfg.font_family || undefined,
                  }}
                >
                  {avalCfg.title || `Avaliação Pública de ${companyName}`}
                </h2>
                <p
                  className="mt-3 max-w-xl mx-auto text-sm sm:text-base"
                  style={{
                    color: avalCfg.text_color || (isLightMode ? "#4b5563" : "#cbd5e1"),
                    fontFamily: avalCfg.font_family || undefined,
                  }}
                >
                  {avalCfg.subtitle || `Transparência total com a reputação de quem frequenta nosso espaço no bairro ${address.split("-")[0] || city} e em toda a região de ${city}.`}
                </p>

                <div className="my-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6 px-6 sm:px-8 rounded-2xl bg-gray-50 border border-gray-100 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="font-heading font-black text-4xl sm:text-5xl text-gray-900 tracking-tight">
                      {rating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-amber-400 text-lg mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">Escala de 1 a 5 estrelas</span>
                  </div>

                  <div className="w-px h-16 bg-gray-200 hidden sm:block" />

                  <div className="text-center sm:text-left">
                    <div className="font-heading font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2 justify-center sm:justify-start">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span>{reviewsCount} Avaliações Verificadas</span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      Comentários e notas registradas diretamente por usuários na ficha oficial do Google Maps.
                    </p>
                  </div>
                </div>

                {/* Depoimentos reais e personalizados configurados */}
                {Array.isArray(socialData.testimonials) && socialData.testimonials.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left my-8">
                    {socialData.testimonials.map((t: any) => (
                      <div key={t.id || t.author} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 shadow-xs flex flex-col justify-between">
                        <p className="text-gray-700 text-sm italic mb-4 leading-relaxed line-clamp-4">"{t.text}"</p>
                        <div className="flex items-center gap-3 border-t border-gray-200/60 pt-3 mt-auto">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-100)] text-[var(--color-600)] flex items-center justify-center font-bold text-xs shrink-0">
                            {(t.author || "C").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-heading font-bold text-xs text-gray-900 truncate">{t.author}</div>
                            <div className="text-[10px] text-gray-400 truncate">{t.role || "Cliente Verificado"}</div>
                          </div>
                          <div className="flex text-amber-400 text-xs shrink-0">
                            {"★".repeat(Math.min(5, Math.max(1, t.rating || 5)))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-200 hover:border-gray-900 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs hover:shadow"
                  >
                    <ExternalLink className="h-4 w-4 text-red-500" />
                    <span>Conferir Avaliações no Google Maps</span>
                  </a>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white px-6 sm:px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Agendar Atendimento</span>
                  </a>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                  * Dados sincronizados diretamente com a ficha de localização da {companyName}.
                </p>
              </div>
            </div>
          </section>
        );
      }

      case "faq": {
        const faqCfg = sectionStyles.faq || {};
        return (
          <section
            id="faq"
            className="py-16 sm:py-20 border-b border-gray-100"
            style={{ backgroundColor: faqCfg.bg_color || (isLightMode ? "#ffffff" : "#0d1117") }}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-600)] bg-[var(--color-100)] px-3 py-1 rounded-full">
                  Dúvidas Comuns
                </span>
                <h2
                  className={`font-heading font-black mt-3 ${getHeadingSizeClass(faqCfg.font_size)}`}
                  style={{
                    color: faqCfg.title_color || (isLightMode ? "#111827" : "#ffffff"),
                    fontFamily: faqCfg.font_family || undefined,
                  }}
                >
                  {faqCfg.title || `Perguntas Frequentes sobre ${companyName}`}
                </h2>
                <p
                  className="mt-2 text-sm sm:text-base"
                  style={{
                    color: faqCfg.text_color || (isLightMode ? "#4b5563" : "#cbd5e1"),
                    fontFamily: faqCfg.font_family || undefined,
                  }}
                >
                  {faqCfg.subtitle || `Tire suas dúvidas antes de agendar sua visita conosco em ${city}.`}
                </p>
              </div>

              <div className="space-y-4">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-5 sm:p-6 flex items-center justify-between text-left font-heading font-bold text-gray-900 text-base sm:text-lg hover:text-[var(--color-600)] transition-colors cursor-pointer"
                      >
                        <span className="pr-4">{item.q}</span>
                        <span
                          className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm transition-transform duration-300 shrink-0 ${
                            isOpen ? "rotate-180 bg-[var(--color-600)] text-white" : "text-gray-700"
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 sm:px-6 pb-6 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4 animate-fade-in">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      case "contato": {
        const contCfg = sectionStyles.contato || {};
        return (
          <section
            id="contato"
            className="py-16 sm:py-20"
            style={{ backgroundColor: contCfg.bg_color || (isLightMode ? "#f9fafb" : "#0d1117") }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-[var(--color-900)] rounded-3xl text-white overflow-hidden shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Lado Esquerdo: Dados de Contato com Contraste 100% Blindado */}
                  <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-between space-y-6 sm:space-y-8">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-300)] bg-white/10 px-3 py-1 rounded-full">
                        Fale Conosco
                      </span>
                      <h2
                        className={`font-heading font-black mt-4 leading-tight text-white ${getHeadingSizeClass(
                          contCfg.font_size
                        )}`}
                        style={{
                          color: (contCfg.title_color && hexLuminance(contCfg.title_color) > 130)
                            ? contCfg.title_color
                            : "#ffffff",
                          fontFamily: contCfg.font_family || undefined,
                        }}
                      >
                        {contCfg.title || "Venha nos visitar ou mande uma mensagem"}
                      </h2>
                      <p
                        className="mt-4 text-sm sm:text-base leading-relaxed text-white/85"
                        style={{
                          color: (contCfg.text_color && hexLuminance(contCfg.text_color) > 120)
                            ? contCfg.text_color
                            : "rgba(255, 255, 255, 0.85)",
                          fontFamily: contCfg.font_family || undefined,
                        }}
                      >
                        {contCfg.subtitle ||
                          `Estamos localizados em ${address.split("-")[0] || city}, prontos para lhe atender com todo o cuidado e atenção que você merece em ${city}.`}
                      </p>

                      <div className="mt-8 space-y-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                            <MapPin className="h-5 w-5 text-[var(--color-300)]" />
                          </div>
                          <div>
                            <div className="text-xs text-white/70 font-medium">Endereço</div>
                            <div className="font-semibold text-sm sm:text-base text-white">{address}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                            <MessageCircle className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs text-white/70 font-medium">WhatsApp Oficial</div>
                            <div className="font-semibold text-sm sm:text-base text-white">{cleanPhoneFormatted}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                          </div>
                          <div>
                            <div className="text-xs text-white/70 font-medium">Google Maps</div>
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
                        className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>Falar no WhatsApp Agora</span>
                      </a>
                    </div>
                  </div>

                  {/* Lado Direito: Mapa Interativo ao Vivo */}
                  <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center bg-gray-950/60 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-heading font-bold text-sm text-white">Localização no Google Maps</span>
                      </div>
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-300)] hover:underline flex items-center gap-1 font-semibold shrink-0"
                      >
                        <span>Abrir Rota</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 h-64 sm:h-80 w-full relative bg-gray-900">
                      <iframe
                        title={`Localização de ${companyName}`}
                        className="w-full h-full border-0"
                        src={`https://maps.google.com/maps?q=${mapsQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    <p className="text-white/60 text-xs text-center mt-3 truncate px-2">{address}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="site-maquina-root relative min-h-screen font-sans selection:bg-emerald-500/20 selection:text-emerald-900 scroll-smooth pb-20 sm:pb-0 w-full overflow-x-hidden"
      style={
        {
          fontFamily: "'Inter', sans-serif",
          backgroundColor: customBg || (isLightMode ? "#ffffff" : "#080a11"),
          "--hue": hue,
          "--primary-exact": customPrimary || `hsl(${hue}, 75%, 45%)`,
          "--site-title": customTitle,
          "--site-text": customText,
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
      <div className="bg-[var(--color-900)] text-white text-[11px] sm:text-xs py-2 px-4 border-b border-[var(--color-800)] z-40 relative">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="flex items-center gap-1.5 opacity-90 truncate max-w-[220px] sm:max-w-none">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-300)] shrink-0" />
              <span className="truncate">{address}</span>
            </span>
            <span className="hidden sm:inline-block text-white/30">|</span>
            <span className="hidden sm:flex items-center gap-1.5 opacity-90 shrink-0">
              <Clock className="h-3.5 w-3.5 text-[var(--color-300)]" />
              <span>Atendimento: Aberto Hoje</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 text-white/90 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3 w-3 text-[var(--color-300)]" />
              <span className="hidden xs:inline sm:inline">Ver Ficha no Google Maps</span>
              <span className="xs:hidden sm:hidden">Maps</span>
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
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b shadow-xs transition-all duration-300"
        style={{
          backgroundColor: isLightMode ? "rgba(255, 255, 255, 0.94)" : "rgba(10, 12, 18, 0.94)",
          borderColor: isLightMode ? "rgba(243, 244, 246, 1)" : "rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={companyName}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover shadow-sm border border-gray-200 shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center font-black text-base sm:text-xl shadow-sm shrink-0"
                style={{ backgroundColor: customPrimary || "var(--color-600)" }}
              >
                {companyName.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <span
                className="font-heading font-black text-base sm:text-xl tracking-tight block leading-tight truncate max-w-[170px] sm:max-w-none"
                style={{ color: customTitle }}
              >
                {companyName}
              </span>
              <span
                className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase block truncate"
                style={{ color: customPrimary || "var(--color-600)" }}
              >
                {nicheLabel} · {city}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold opacity-85">
            {displayServices.length > 0 && (
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

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrack("whatsapp_click")}
              style={{ backgroundColor: customPrimary || undefined }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 shrink-0"
            >
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              <span className="hidden sm:inline">Agendar no WhatsApp</span>
              <span className="sm:hidden">Agendar</span>
            </a>
          </div>
        </div>
      </header>

      {/* RENDERIZAÇÃO DINÂMICA DAS SEÇÕES DE ACORDO COM SECTIONS_ORDER */}
      {sectionsOrder.map((sectionKey) => {
        const cfg = getSectionConfig(sectionKey);
        if (!cfg.visible) return null;

        const rendered = renderSection(sectionKey);
        if (!rendered) return null;

        return (
          <div key={sectionKey} data-section={sectionKey} className="w-full">
            {rendered}
          </div>
        );
      })}

      {/* SEÇÕES MODULARES EXTRAS (VÍDEO / SOBRE / BLOCOS ADICIONAIS) */}
      {supplemental && (
        <section className="py-10 bg-gray-50/50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            {supplemental}
          </div>
        </section>
      )}

      {/* LINKS ADICIONAIS / PIX SE CONFIGURADO */}
      {bio.pix_key && (
        <div className="max-w-md mx-auto px-4 py-8">
          <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
        </div>
      )}

      {/* 11. FOOTER INSTITUCIONAL */}
      <footer className="bg-gray-950 text-white/60 text-xs py-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
            <div className="w-6 h-6 rounded bg-[var(--color-600)] flex items-center justify-center text-xs text-white">
              ★
            </div>
            <span>{companyName}</span>
          </div>
          <div>
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </div>
          <div className="text-white/40 text-[11px]">
            Desenvolvido com tecnologia de alta conversão
          </div>
        </div>
      </footer>

      {/* 12. BOTÃO FLUTUANTE WHATSAPP DESKTOP COM PULSE */}
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
      <div
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden backdrop-blur-md border-t px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3"
        style={{
          backgroundColor: isLightMode ? "rgba(255, 255, 255, 0.95)" : "rgba(12, 14, 22, 0.95)",
          borderColor: isLightMode ? "#e5e7eb" : "rgba(255, 255, 255, 0.12)",
        }}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="font-heading font-black text-xs truncate"
            style={{ color: customTitle }}
          >
            {companyName}
          </span>
          <span className="text-[11px] flex items-center gap-1 opacity-75">
            <span className="text-amber-500 font-bold">★ {rating.toFixed(1)}</span>
            <span className="truncate">· {address.split("-")[0] || city}</span>
          </span>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("whatsapp_click")}
          style={{ backgroundColor: customPrimary || undefined }}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Agendar</span>
        </a>
      </div>
    </div>
  );
}
