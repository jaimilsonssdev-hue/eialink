import { useState, useEffect, useRef } from "react";
import type {
  CinematicPageData,
  CinematicGalleryItem,
  CinematicHighlight,
  BentoCard,
  FaqItem,
} from "./types";
import {
  MessageCircle,
  MapPin,
  Clock,
  Star,
  Sparkles,
  ArrowDown,
  X,
  ChevronRight,
  Maximize2,
  Check,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface CinematicViewerProps {
  data: CinematicPageData;
  isEmbedded?: boolean;
  className?: string;
}

// Utilitário de contraste para garantir que botões coloridos ou brancos nunca fiquem ilegíveis
export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor) return "#ffffff";
  const clean = hexColor.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? "#09090b" : "#ffffff";
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? "#09090b" : "#ffffff";
  }
  return "#ffffff";
}

export function CinematicViewer({ data, isEmbedded = false, className = "" }: CinematicViewerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CinematicGalleryItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.theme.parallaxEnabled) return;

    let ticking = false;
    const handleScroll = () => {
      const currentScroll = isEmbedded && containerRef.current
        ? containerRef.current.scrollTop
        : window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(currentScroll);
          ticking = false;
        });
        ticking = true;
      }
    };

    const target = isEmbedded && containerRef.current ? containerRef.current : window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [isEmbedded, data.theme.parallaxEnabled]);

  const cleanPhone = (data.whatsapp || "").replace(/\D/g, "");
  const whatsappHref = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá! Gostaria de vivenciar a experiência da ${data.businessName}.`)}`
    : "#";

  // Tokens de Tipografia e Estilo com fallbacks resilientes
  const rawFont = (data.theme as any)?.fontFamily || data.theme?.fontHeading || "sans";
  const fontCssFamily =
    rawFont === "serif"
      ? "'Playfair Display', Georgia, serif"
      : rawFont === "display"
      ? "'Plus Jakarta Sans', system-ui, sans-serif"
      : rawFont === "cormorant"
      ? "'Cormorant Garamond', 'Playfair Display', serif"
      : rawFont === "mono"
      ? "'Courier New', Courier, monospace"
      : "'Inter', system-ui, -apple-system, sans-serif";

  const fontHeading = data.theme?.fontHeading || "serif";
  const borderStyle = data.theme?.borderStyle || "glass";

  // Modo Visual: Detecção de Claro (Light) vs Escuro (Dark)
  const isLight =
    data.theme?.mode === "light" ||
    (data.theme?.bg &&
      (data.theme.bg === "#ffffff" ||
        data.theme.bg === "#f8fafc" ||
        data.theme.bg.toLowerCase().startsWith("#f") ||
        data.theme.bg.toLowerCase().startsWith("#e")));

  const textPrimaryClass = isLight ? "text-zinc-900" : "text-zinc-100";
  const textSecondaryClass = isLight ? "text-zinc-600" : "text-zinc-300";
  const textMutedClass = isLight ? "text-zinc-500" : "text-zinc-400";
  const textHeadingClass = isLight ? "text-zinc-950" : "text-white";

  // Detecção dos 4 Arquétipos Mestres (com compatibilidade com tags legadas)
  const rawArchetype = ((data.archetype as string) || (data.theme as any)?.archetype || "cinematic").toLowerCase();
  const isNeobrutalism =
    rawArchetype === "neobrutalism" ||
    rawArchetype === "neo-pop-d2c" ||
    rawArchetype === "dark-brutalist";
  const isEditorial =
    rawArchetype === "editorial" ||
    rawArchetype === "luxury-editorial";
  const isBento =
    rawArchetype === "bento" ||
    rawArchetype === "clean-biotech" ||
    rawArchetype === "cyber-tech";
  const isCinematic = !isNeobrutalism && !isEditorial && !isBento;

  const explicitHeadingStyle = (data.theme as any)?.headingStyle;

  let fontHeadingClass = "font-bold tracking-tight";
  let headingEffectClass = textHeadingClass;

  if (explicitHeadingStyle === "uppercase" || (!explicitHeadingStyle && isNeobrutalism)) {
    fontHeadingClass = "font-black tracking-tight uppercase";
    headingEffectClass = isNeobrutalism ? (isLight ? "text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" : "text-white drop-shadow-[3px_3px_0px_#000]") : textHeadingClass;
  } else if (explicitHeadingStyle === "italic" || (!explicitHeadingStyle && isEditorial)) {
    fontHeadingClass = "italic font-normal tracking-tight";
    headingEffectClass = textHeadingClass;
  } else if (explicitHeadingStyle === "gradient" || (!explicitHeadingStyle && isBento)) {
    fontHeadingClass = "font-black tracking-tight";
    headingEffectClass = isLight
      ? "bg-clip-text text-transparent bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600"
      : "bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-400";
  } else {
    // Padrão
    fontHeadingClass = rawFont === "display" ? "font-black tracking-tight" : "font-bold tracking-tight";
    headingEffectClass = isLight ? "text-zinc-950" : "drop-shadow-2xl text-white";
  }

  // Tokens de Arredondamento dos Cards
  const rawRadius = data.theme?.borderRadius || borderStyle;
  const radiusClass =
    rawRadius === "sharp"
      ? "rounded-none"
      : rawRadius === "pill"
      ? "rounded-3xl"
      : isEditorial
      ? "rounded-none"
      : isBento
      ? "rounded-3xl"
      : "rounded-2xl";

  // Tokens de Efeito dos Cards (Glass, Solid, Glow) & Arquétipos
  const rawBoxEffect = data.theme?.boxEffect || "glass";
  const accentColor = data.theme?.accent || "#f59e0b";
  const secondaryAccent = data.theme?.secondaryAccent || "#fbbf24";
  const bgColor = data.theme?.bg || (isLight ? "#f8fafc" : "#0a0a0c");

  let cardBorderClass = "";
  if (isNeobrutalism) {
    cardBorderClass = `${radiusClass} border-[3px] border-black ${
      isLight ? "bg-white text-zinc-900" : "bg-zinc-900/95 text-white"
    } shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000] transition-all`;
  } else if (rawBoxEffect === "solid") {
    cardBorderClass = `${radiusClass} border ${
      isLight
        ? "border-zinc-200 bg-white text-zinc-900 shadow-md hover:border-zinc-300"
        : "border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl hover:border-zinc-700"
    } transition-all`;
  } else if (rawBoxEffect === "glow") {
    cardBorderClass = `${radiusClass} border ${
      isLight
        ? "border-black/10 bg-white text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.12)]"
        : "border-white/20 bg-zinc-950/85 text-white shadow-[0_0_30px_rgba(255,255,255,0.06)] hover:border-white/30"
    } transition-all duration-300`;
  } else {
    // Glassmorphism (Padrão)
    cardBorderClass = `${radiusClass} border ${
      isLight
        ? "border-zinc-200/90 bg-white text-zinc-900 shadow-[0_4px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-zinc-300"
        : isEditorial
        ? "border-white/15 bg-black/60 text-white backdrop-blur-sm hover:border-white/40"
        : isBento
        ? "border-white/10 bg-zinc-950/70 text-white shadow-2xl hover:border-white/20"
        : "border-white/10 bg-white/[0.04] text-white shadow-2xl hover:border-white/25 backdrop-blur-xl"
    } transition-all`;
  }

  // Tokens de Botões CTA por Arquétipo com contraste dinâmico garantido
  const ctaTextColor = getContrastTextColor(accentColor);
  const buttonCtaClass = isNeobrutalism
    ? "rounded-lg border-[3px] border-black font-black uppercase tracking-wider shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-[7px_7px_0px_#000] transition-all cursor-pointer"
    : isEditorial
    ? "rounded-none border border-current uppercase tracking-[0.2em] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
    : isBento
    ? "rounded-full font-bold tracking-tight shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
    : "rounded-full font-bold shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer";


  // Tokens de Taglines & Badges por Arquétipo
  const taglineClass = isNeobrutalism
    ? "inline-block bg-amber-400 text-black px-3 py-1 font-black uppercase tracking-wider -rotate-1 border-2 border-black shadow-[3px_3px_0px_#000]"
    : isEditorial
    ? `tracking-[0.3em] uppercase text-[11px] font-medium ${isLight ? "text-zinc-600 border-b border-black/20" : "text-zinc-300 border-b border-white/25"} pb-1 inline-flex items-center gap-2`
    : isBento
    ? `inline-flex items-center gap-2 font-mono tracking-widest text-[11px] uppercase px-3 py-1 rounded-full border ${isLight ? "border-black/15 bg-black/5 text-zinc-700" : "border-white/15 bg-white/5 text-zinc-200"}`
    : `inline-flex items-center gap-2 rounded-full border ${isLight ? "border-black/15 bg-white/80 text-zinc-800 shadow-sm" : "border-white/15 bg-black/40 text-white shadow-2xl"} px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase backdrop-blur-md`;

  const badgeClass = isNeobrutalism
    ? "rounded-none border-2 border-black bg-white text-black font-black uppercase tracking-wider text-[10px] sm:text-[11px] shadow-[3px_3px_0px_#000] rotate-1 px-3 py-1"
    : isEditorial
    ? `rounded-none border ${isLight ? "border-black/20 text-zinc-700" : "border-white/20 text-zinc-300"} bg-transparent px-3 py-0.5 text-[10px] tracking-[0.25em] uppercase`
    : isBento
    ? `rounded-full border ${isLight ? "border-black/10 bg-black/5 text-zinc-700" : "border-white/10 bg-white/10 text-zinc-200"} px-3 py-1 text-[11px] font-mono tracking-wide`
    : `rounded-full border ${isLight ? "border-black/10 bg-white/90 text-zinc-700" : "border-white/15 bg-white/5 text-zinc-300"} px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md`;

  const isNeoPop = isNeobrutalism;
  const isCyber = isBento;

  // Profundidade do Parallax
  const backgroundParallaxY = data.theme.parallaxEnabled ? Math.min(scrollY * 0.42, 280) : 0;
  const backgroundZoom = data.theme.parallaxEnabled ? 1 + Math.min(scrollY * 0.0005, 0.15) : 1;
  const foregroundParallaxY = data.theme.parallaxEnabled ? -Math.min(scrollY * 0.12, 60) : 0;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Duração da animação do Marquee (segundos) - customizável pelo usuário
  const userSpeed = data.marqueeSpeed || (data.theme as any)?.marqueeSpeed;
  const marqueeDuration = userSpeed ? Number(userSpeed) : (isNeoPop ? 30 : isCyber ? 36 : 45);

  return (
    <div
      ref={containerRef}
      className={`cinematic-experience relative w-full ${textPrimaryClass} selection:bg-white/20 selection:text-white ${
        isEmbedded ? "h-full overflow-y-auto overflow-x-hidden" : "min-h-screen overflow-x-hidden"
      } ${className}`}
      style={{
        backgroundColor: bgColor,
        fontFamily: fontCssFamily,
      }}
    >
      {/* Estilos Scoped de Animação do Marquee */}
      <style>{`
        @keyframes cinematicMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      {/* Luzes Volumétricas de Fundo (Mesh Glows 60 FPS) */}
      <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${isLight ? "opacity-25" : "opacity-50"}`}>
        <div
          className="absolute -top-[20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[140px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
            transform: `translate3d(-50%, ${scrollY * 0.1}px, 0)`,
          }}
        />
        <div
          className="absolute top-[45%] -left-[10%] h-[500px] w-[500px] rounded-full blur-[160px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${secondaryAccent}18 0%, transparent 70%)`,
            transform: `translate3d(0, ${scrollY * -0.08}px, 0)`,
          }}
        />
        <div
          className="absolute top-[75%] -right-[10%] h-[600px] w-[600px] rounded-full blur-[180px]"
          style={{
            background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* TopBar Flutuante de Luxo */}
      <header className={`sticky top-0 z-40 transition-all ${isLight ? "border-b border-zinc-200/90 bg-white/90 backdrop-blur-xl shadow-xs text-zinc-900" : "border-b border-white/10 bg-black/40 backdrop-blur-xl text-white"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <a href="#hero" className="group flex items-center gap-2.5 min-w-0">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-transform group-hover:scale-105 ${isLight ? "border-zinc-200 bg-zinc-100" : "border-white/20 bg-white/5"}`}
              style={{ color: accentColor }}
            >
              {(data.businessName || "Site").slice(0, 2).toUpperCase()}
            </span>
            <span className={`text-sm sm:text-base font-bold tracking-wide truncate max-w-[160px] sm:max-w-xs ${fontHeadingClass} ${textHeadingClass}`}>
              {data.businessName || "Sua Marca"}
            </span>
          </a>

          {/* Links de navegação interna */}
          <nav className={`${isEmbedded ? "hidden" : "hidden md:flex"} items-center gap-6 text-xs font-semibold uppercase tracking-widest ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
            {data.bentoGrid && data.bentoGrid.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection("diferenciais")}
                className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
              >
                Diferenciais
              </button>
            )}
            {data.manifesto && (
              <button
                type="button"
                onClick={() => scrollToSection("manifesto")}
                className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
              >
                O Manifesto
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection("galeria")}
              className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
            >
              Galeria
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("destaques")}
              className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
            >
              Destaques
            </button>
            {data.comparison && (
              <button
                type="button"
                onClick={() => scrollToSection("comparativo")}
                className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
              >
                Comparativo
              </button>
            )}
            {data.faq && data.faq.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection("faq")}
                className={`${isLight ? "hover:text-zinc-950" : "hover:text-white"} transition-colors cursor-pointer`}
              >
                FAQ
              </button>
            )}
          </nav>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${
              isLight
                ? "border-zinc-300 bg-zinc-900 text-white hover:bg-black"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }`}
            style={{ borderColor: isLight ? undefined : `${accentColor}50` }}
          >
            <MessageCircle className="h-3.5 w-3.5" style={{ color: isLight ? "#ffffff" : accentColor }} />
            <span>WhatsApp VIP</span>
          </a>
        </div>
      </header>

      {/* 1. SEÇÃO HERO CINEMATOGRÁFICO COM PARALLAX GPU */}
      <section id="hero" className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 sm:px-8 py-20">
        {/* Capa com Vídeo de Fundo ou Foto com Parallax 3D */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {data.hero.backgroundVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className={`h-full w-full object-cover object-center will-change-transform ${isLight ? "opacity-80" : ""}`}
              style={{
                transform: `translate3d(0, ${backgroundParallaxY}px, 0) scale(${backgroundZoom})`,
                transition: "transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            >
              <source src={data.hero.backgroundVideo} type="video/mp4" />
              <source src={data.hero.backgroundVideo} type="video/webm" />
            </video>
          ) : data.hero.backgroundImage ? (
            <img
              src={data.hero.backgroundImage}
              alt={data.businessName || "Capa"}
              className={`h-full w-full object-cover object-center will-change-transform ${isLight ? "opacity-90" : ""}`}
              style={{
                transform: `translate3d(0, ${backgroundParallaxY}px, 0) scale(${backgroundZoom})`,
                transition: "transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            />
          ) : (
            <div className={`h-full w-full ${isLight ? "bg-gradient-to-br from-zinc-100 via-white to-slate-100" : "bg-gradient-to-br from-zinc-900 via-black to-zinc-950"}`} />
          )}

          {/* Vinheta de Fundo: Luminosa no Modo Claro e Escura no Modo Cinema */}
          {isLight ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-50/90" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_25%,#070709_90%] opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/60 to-black/75" />
              <div
                className="absolute inset-0 opacity-25 mix-blend-color pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />
            </>
          )}
        </div>

        {/* Conteúdo Central Hero */}
        <div
          className="relative z-10 mx-auto max-w-4xl text-center will-change-transform"
          style={{
            transform: `translate3d(0, ${foregroundParallaxY}px, 0)`,
          }}
        >
          {/* Badges do Hero */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {data.hero.tagline && (
              <div className={taglineClass}>
                <Sparkles className="h-3 w-3" style={{ color: isNeobrutalism ? "#000" : accentColor }} />
                <span style={{ color: isNeobrutalism ? "#000" : (isLight ? "#09090b" : accentColor) }}>{data.hero.tagline}</span>
              </div>
            )}
            {data.hero.floatingBadge && (
              <div className={badgeClass}>
                <span>{data.hero.floatingBadge}</span>
              </div>
            )}
          </div>

          {/* Título Principal Imponente */}
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.08] ${fontHeadingClass} ${headingEffectClass}`}
          >
            {data.hero.title || (data.businessName ? `Bem-vindo à ${data.businessName}` : "Sua Experiência Exclusiva")}
          </h1>

          {/* Subtítulo Narrativo */}
          {(data.hero.subtitle || !data.businessName) && (
            <p className={`mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl font-light leading-relaxed ${textSecondaryClass} drop-shadow-sm`}>
              {data.hero.subtitle || "Descreva seu negócio no chat ao lado ou importe sua ficha do Google Maps para gerar sua vitrine cinematográfica completa."}
            </p>
          )}

          {/* Ações Hero */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 px-8 py-4 text-sm sm:text-base ${buttonCtaClass} border ${
                ctaTextColor === "#09090b" ? "border-black/15" : "border-white/20"
              }`}
              style={{
                backgroundColor: accentColor,
                color: ctaTextColor,
                boxShadow: isNeobrutalism ? undefined : `0 0 35px ${accentColor}60`,
              }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: ctaTextColor }} />
              <span style={{ color: ctaTextColor }}>{data.hero.ctaText || "Solicitar Atendimento VIP"}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: ctaTextColor }} />
            </a>

            <button
              type="button"
              onClick={() => scrollToSection(data.bentoGrid ? "diferenciais" : "manifesto")}
              className={`flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-semibold backdrop-blur-md transition-all ${
                isLight
                  ? "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm"
                  : "border-white/20 bg-white/5 text-white hover:bg-white/15"
              }`}
            >
              <span className={isLight ? "text-zinc-900" : "text-white"}>Descobrir Detalhes</span>
              <ArrowDown className={`h-4 w-4 ${isLight ? "text-zinc-600" : textMutedClass}`} />
            </button>
          </div>

          {/* Avaliação Social Proof no Hero */}
          {data.rating && (
            <div className={`mt-12 flex items-center justify-center gap-2 text-xs font-medium ${isLight ? "text-zinc-700" : textMutedClass}`}>
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                ))}
              </div>
              <span className={`font-bold ${isLight ? "text-zinc-900" : textHeadingClass}`}>{data.rating.toFixed(1)}</span>
              <span>• Avaliação de excelência dos clientes</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. BLOCO MARQUEE INFINITO / DIVISOR DE SESSÃO */}
      {data.marquee && data.marquee.length > 0 && (() => {
        // Assegura densidade adequada e cria exatamente 2 metades idênticas para loop contínuo de 0% a -50%
        const baseItems = data.marquee.length < 3
          ? [...data.marquee, ...data.marquee, ...data.marquee]
          : data.marquee.length < 5
          ? [...data.marquee, ...data.marquee]
          : data.marquee;
        const trackItems = [...baseItems, ...baseItems];

        return (
          <section className={`relative z-20 w-full overflow-hidden border-y py-3.5 backdrop-blur-md select-none ${isLight ? "border-zinc-200/90 bg-white/95 text-zinc-900 shadow-xs" : "border-white/10 bg-black/60 text-white"}`}>
            <div
              key={`marquee-track-${marqueeDuration}-${data.marquee.length}`}
              className="flex w-max items-center gap-8 will-change-transform hover:[animation-play-state:paused]"
              style={{
                animation: `cinematicMarquee ${marqueeDuration}s linear infinite`,
                animationDuration: `${marqueeDuration}s`,
              }}
            >
              {trackItems.map((item, idx) => {
                const text = typeof item === "string" ? item : item?.text || "";
                const icon = typeof item === "object" ? item?.icon : "";
                if (!text) return null;
                return (
                  <div key={idx} className="flex shrink-0 items-center gap-3 text-xs md:text-sm font-bold tracking-widest uppercase">
                    {icon && <span>{icon}</span>}
                    <span style={{ color: isLight && (accentColor === "#ffffff" || accentColor === "#f8fafc") ? "#09090b" : accentColor }}>
                      {text}
                    </span>
                    <span className={isLight ? "text-zinc-400" : textMutedClass}>•</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* 3. BLOCO BENTO GRID ASSIMÉTRICO */}
      {data.bentoGrid && data.bentoGrid.length > 0 && (
        <section id="diferenciais" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-24 sm:py-32">
          <div className="text-center mb-14">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Arquitetura & Engenharia
            </span>
            <h2 className={`mt-2 text-3xl sm:text-5xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
              Pilares de Distinção
            </h2>
            <p className={`mt-3 text-sm sm:text-base max-w-xl mx-auto ${textSecondaryClass}`}>
              Cada dimensão desenhada para superar padrões com consistência comprovada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {data.bentoGrid.map((card: BentoCard, idx: number) => {
              const colSpan =
                card.size === "large"
                  ? "md:col-span-2"
                  : card.size === "full"
                  ? "md:col-span-3"
                  : "md:col-span-1";

              return (
                <div
                  key={card.id || idx}
                  className={`group relative overflow-hidden p-6 sm:p-8 transition-all duration-300 hover:border-black/30 dark:hover:border-white/30 hover:-translate-y-1 ${cardBorderClass} ${colSpan}`}
                >
                  {/* Imagem de Fundo se houver */}
                  {card.imageUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt=""
                        className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLight ? "opacity-25" : "opacity-35"}`}
                      />
                      <div className={`absolute inset-0 ${isLight ? "bg-gradient-to-t from-white via-white/85 to-white/40" : "bg-gradient-to-t from-black via-black/80 to-transparent"}`} />
                    </div>
                  )}

                  <div className="relative z-10 flex h-full flex-col justify-between space-y-6">
                    <div className="flex items-center justify-between">
                      {card.badge ? (
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-zinc-900" : "text-white"}`}
                          style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
                        >
                          {card.badge}
                        </span>
                      ) : <span />}
                      {card.metric && (
                        <span
                          className="text-2xl sm:text-3xl font-black tracking-tight"
                          style={{ color: card.accentBg ? accentColor : (isLight ? "#09090b" : "#ffffff") }}
                        >
                          {card.metric}
                        </span>
                      )}
                    </div>

                    <div>
                      {card.subtitle && (
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${textMutedClass}`}>
                          {card.subtitle}
                        </p>
                      )}
                      <h3 className={`text-xl sm:text-2xl font-bold ${fontHeadingClass} ${textHeadingClass}`}>
                        {card.title}
                      </h3>
                      <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${textSecondaryClass}`}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. SEÇÃO MANIFESTO NARRATIVO */}
      {data.manifesto && (
        <section id="manifesto" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-20 sm:py-28">
          <div className={`relative p-8 sm:p-14 md:p-16 ${cardBorderClass}`}>
            <div
              className="absolute -top-12 left-1/2 h-24 w-64 -translate-x-1/2 rounded-full blur-2xl pointer-events-none"
              style={{ backgroundColor: `${accentColor}25` }}
            />

            <div className="flex flex-col items-center text-center">
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                Capítulo I — A Essência
              </span>

              <h2 className={`mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${fontHeadingClass} ${headingEffectClass}`}>
                {data.manifesto.headline}
              </h2>

              <div className={`my-6 h-px w-20 bg-gradient-to-r from-transparent ${isLight ? "via-black/20" : "via-white/30"} to-transparent`} />

              <p className={`max-w-3xl text-base sm:text-lg leading-relaxed ${textSecondaryClass}`}>
                {data.manifesto.bodyText}
              </p>

              {data.manifesto.quote && (
                <blockquote className={`mt-10 border-l-2 border-amber-500/60 pl-6 text-left max-w-2xl ${isLight ? "bg-black/5" : "bg-black/40"} p-6 rounded-r-2xl`}>
                  <p className={`italic text-base sm:text-lg ${textSecondaryClass}`}>
                    "{data.manifesto.quote}"
                  </p>
                  {data.manifesto.author && (
                    <footer className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-500">
                      — {data.manifesto.author}
                    </footer>
                  )}
                </blockquote>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. SEÇÃO A EXPERIÊNCIA (GALERIA COM LIGHTBOX) */}
      {data.gallery && data.gallery.length > 0 && (
        <section id="galeria" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-20">
          <div className="text-center mb-14">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Capítulo II — O Olhar
            </span>
            <h2 className={`mt-2 text-3xl sm:text-5xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
              A Experiência Visual
            </h2>
            <p className={`mt-3 text-sm sm:text-base max-w-xl mx-auto ${textSecondaryClass}`}>
              Toque nas imagens para contemplar cada atmosfera em tela cheia e alta definição.
            </p>
          </div>

          {/* Grid de Galeria Cinematográfica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {data.gallery.map((item: CinematicGalleryItem, index: number) => (
              <div
                key={item.id || index}
                onClick={() => setSelectedPhoto(item)}
                className={`group relative h-80 sm:h-96 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                  isLight
                    ? "border-black/10 bg-zinc-100 hover:border-black/25"
                    : "border-white/10 bg-zinc-900 hover:border-white/30"
                }`}
              >
                <img
                  src={item.url}
                  alt={item.caption || data.businessName}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-0 left-0 right-0 p-5 transform transition-transform duration-300">
                  {item.category && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: accentColor }}
                    >
                      {item.category}
                    </span>
                  )}
                  {item.caption && (
                    <p className="mt-1 text-sm font-medium leading-snug text-white drop-shadow">
                      {item.caption}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Ampliar</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SEÇÃO DESTAQUES & MENU DE LUXO */}
      {data.highlights && data.highlights.length > 0 && (
        <section id="destaques" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-20">
          <div className="text-center mb-14">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Capítulo III — Assinatura
            </span>
            <h2 className={`mt-2 text-3xl sm:text-5xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
              Criações em Destaque
            </h2>
            <p className={`mt-3 text-sm sm:text-base max-w-xl mx-auto ${textSecondaryClass}`}>
              Cada item carrega a dedicação de processos artesanais e ingredientes rigorosamente selecionados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {data.highlights.map((item: CinematicHighlight, index: number) => (
              <div
                key={item.id || index}
                className={`group overflow-hidden transition-all duration-300 hover:border-black/30 dark:hover:border-white/30 hover:-translate-y-1 ${cardBorderClass}`}
              >
                {item.image && (
                  <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    {item.badge && (
                      <span
                        className={`absolute top-4 right-4 ${badgeClass}`}
                        style={{
                          backgroundColor: isNeobrutalism ? "#ffffff" : accentColor,
                          color: "#000000",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`text-xl font-bold ${fontHeadingClass} ${textHeadingClass}`}>
                      {item.title}
                    </h3>
                    {item.price && (
                      <span
                        className="text-base sm:text-lg font-bold shrink-0 font-mono"
                        style={{ color: accentColor }}
                      >
                        {item.price}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed ${textSecondaryClass}`}>
                    {item.description}
                  </p>

                  <a
                    href={`${whatsappHref}&text=${encodeURIComponent(`Olá! Gostaria de pedir/reservar "${item.title}".`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold transition-colors hover:underline"
                    style={{ color: accentColor }}
                  >
                    <span>Pedir ou Reservar este item</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. SEÇÃO COMPARATIVO (CHECKLIST DE VANTAGENS) */}
      {data.comparison && data.comparison.rows && data.comparison.rows.length > 0 && (
        <section id="comparativo" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-20">
          <div className="text-center mb-12">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Transparência & Rigor
            </span>
            <h2 className={`mt-2 text-3xl sm:text-4xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
              {data.comparison.headline || "O Nosso Padrão vs. O Convencional"}
            </h2>
          </div>

          <div className={`overflow-hidden ${cardBorderClass}`}>
            <div className={`grid grid-cols-12 border-b p-4 text-xs font-bold uppercase tracking-wider ${isLight ? "border-zinc-200 bg-zinc-50" : "border-white/10 bg-white/[0.04]"}`}>
              <div className={`col-span-6 ${textMutedClass}`}>Critério / Diferencial</div>
              <div className="col-span-3 text-center" style={{ color: accentColor }}>
                {data.comparison.usLabel}
              </div>
              <div className={`col-span-3 text-center ${textMutedClass}`}>
                {data.comparison.othersLabel}
              </div>
            </div>

            <div className={`divide-y text-xs sm:text-sm ${isLight ? "divide-zinc-200/70" : "divide-white/5"}`}>
              {data.comparison.rows.map((row, idx) => (
                <div key={idx} className={`grid grid-cols-12 p-4 items-center ${isLight ? "hover:bg-zinc-50/70" : "hover:bg-white/[0.02]"}`}>
                  <div className={`col-span-6 font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                    {row.feature}
                  </div>
                  <div className="col-span-3 flex justify-center text-center">
                    {typeof row.us === "boolean" ? (
                      row.us ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </div>
                      )
                    ) : (
                      <span className="font-bold" style={{ color: accentColor }}>{row.us}</span>
                    )}
                  </div>
                  <div className={`col-span-3 flex justify-center text-center ${textMutedClass}`}>
                    {typeof row.others === "boolean" ? (
                      row.others ? (
                        <Check className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-500" />
                      )
                    ) : (
                      <span className="text-xs">{row.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. SEÇÃO FAQ ACCORDION */}
      {data.faq && data.faq.length > 0 && (
        <section id="faq" className="relative z-10 mx-auto max-w-4xl px-4 sm:px-8 py-20">
          <div className="text-center mb-12">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Esclarecimentos
            </span>
            <h2 className={`mt-2 text-3xl sm:text-4xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {data.faq.map((item: FaqItem, idx: number) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`overflow-hidden transition-all ${cardBorderClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold ${textHeadingClass} hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`}
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 text-zinc-400 ${
                        isOpen ? "rotate-180 text-amber-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed ${textSecondaryClass} border-t ${isLight ? "border-zinc-100" : "border-white/5"} pt-3`}>
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. SEÇÃO LOCALIZAÇÃO & AÇÃO VIP */}
      <section id="localizacao" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-24 sm:py-32">
        <div className={`p-8 sm:p-14 md:p-20 ${cardBorderClass}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                Capítulo Final — O Convite
              </span>
              <h2 className={`text-3xl sm:text-5xl font-bold ${fontHeadingClass} ${headingEffectClass}`}>
                Viva a Experiência Pessoalmente na {data.businessName}
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${textSecondaryClass}`}>
                Nossa equipe de especialistas está pronta para proporcionar um momento único e inesquecível.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold ${buttonCtaClass}`}
                  style={{
                    backgroundColor: accentColor,
                    color: ctaTextColor,
                    boxShadow: isNeobrutalism ? undefined : `0 0 35px ${accentColor}60`,
                  }}
                >
                  <MessageCircle className="h-5 w-5" style={{ color: ctaTextColor }} />
                  <span>Iniciar Atendimento no WhatsApp</span>
                </a>
              </div>
            </div>

            <div className={`lg:col-span-5 rounded-2xl border p-6 space-y-5 ${isLight ? "border-zinc-200/90 bg-zinc-50/90 shadow-md text-zinc-900" : "border-white/10 bg-black/60"}`}>
              {data.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <span className={`block text-xs font-bold uppercase tracking-wider ${textHeadingClass}`}>
                      Endereço
                    </span>
                    <p className={`mt-0.5 text-xs leading-relaxed ${textSecondaryClass}`}>
                      {data.address}
                    </p>
                  </div>
                </div>
              )}

              {data.openingHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <span className={`block text-xs font-bold uppercase tracking-wider ${textHeadingClass}`}>
                      Horário de Funcionamento
                    </span>
                    <p className={`mt-0.5 text-xs ${textSecondaryClass}`}>
                      {data.openingHours}
                    </p>
                  </div>
                </div>
              )}

              {data.rating && (
                <div className={`border-t pt-4 flex items-center justify-between text-xs ${isLight ? "border-black/10" : "border-white/10"}`}>
                  <span className={`${textMutedClass} font-medium`}>Reputação Comprovada:</span>
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    ★ {data.rating.toFixed(1)} / 5.0
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simples e Nobre */}
      <footer className={`border-t py-10 text-center text-xs ${isLight ? "border-zinc-200 text-zinc-500" : "border-white/10 text-zinc-500"}`}>
        <p>© {new Date().getFullYear()} {data.businessName}. Todos os direitos reservados.</p>
        <p className={`mt-1 text-[11px] ${isLight ? "text-zinc-400" : "text-zinc-600"}`}>Experiência Cinematográfica desenvolvida na plataforma EIA Digital.</p>
      </footer>

      {/* LIGHTBOX MODAL (IMAGEM EM TELA CHEIA) */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-2xl"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt=""
              className="max-h-[80vh] w-auto object-contain"
            />
            {selectedPhoto.caption && (
              <div className="bg-black/90 p-4 text-center">
                <p className="text-sm font-medium text-white">{selectedPhoto.caption}</p>
                {selectedPhoto.category && (
                  <span
                    className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    {selectedPhoto.category}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
