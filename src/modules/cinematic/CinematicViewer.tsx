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
  const fontHeading = data.theme?.fontHeading || "serif";
  const borderStyle = data.theme?.borderStyle || "glass";
  const archetype = data.archetype || "luxury-editorial";

  const fontHeadingClass =
    fontHeading === "serif"
      ? "font-serif tracking-tight"
      : fontHeading === "display"
      ? "font-sans font-black tracking-tighter uppercase"
      : fontHeading === "mono"
      ? "font-mono tracking-wide uppercase"
      : "font-sans font-bold tracking-tight";

  // Tokens de Borda / Estilo
  const cardBorderClass =
    borderStyle === "sharp"
      ? "rounded-none border border-white/20 bg-black/60"
      : borderStyle === "pill"
      ? "rounded-3xl border border-white/20 bg-white/[0.04]"
      : borderStyle === "subtle"
      ? "rounded-xl border border-white/5 bg-zinc-950/80"
      : "rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl";

  const accentColor = data.theme?.accent || "#f59e0b";
  const secondaryAccent = data.theme?.secondaryAccent || "#fbbf24";
  const bgColor = data.theme?.bg || "#0a0a0c";
  const isNeoPop = archetype === "neo-pop-d2c";
  const isCyber = archetype === "cyber-tech";

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

  return (
    <div
      ref={containerRef}
      className={`cinematic-experience relative w-full text-zinc-100 selection:bg-white/20 selection:text-white ${
        isEmbedded ? "h-full overflow-y-auto overflow-x-hidden" : "min-h-screen overflow-x-hidden"
      } ${className}`}
      style={{
        backgroundColor: bgColor,
        fontFamily: data.theme.fontHeading === "mono" ? "monospace, sans-serif" : "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Estilos Scoped de Animação do Marquee */}
      <style>{`
        @keyframes cinematicMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          display: flex;
          width: max-content;
          animation: cinematicMarquee ${isNeoPop ? "16s" : isCyber ? "20s" : "28s"} linear infinite;
        }
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Luzes Volumétricas de Fundo (Mesh Glows 60 FPS) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-50">
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

      {/* TopBar Flutuante de Luxo (Glassmorphism) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <a href="#hero" className="group flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-xs font-bold transition-transform group-hover:scale-105"
              style={{ color: accentColor }}
            >
              {data.businessName.slice(0, 2).toUpperCase()}
            </span>
            <span className={`text-sm sm:text-base font-bold tracking-wide text-white truncate max-w-[160px] sm:max-w-xs ${fontHeadingClass}`}>
              {data.businessName}
            </span>
          </a>

          {/* Links de navegação interna */}
          <nav className={`${isEmbedded ? "hidden" : "hidden md:flex"} items-center gap-6 text-xs font-medium uppercase tracking-widest text-zinc-400`}>
            {data.bentoGrid && data.bentoGrid.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection("diferenciais")}
                className="hover:text-white transition-colors"
              >
                Diferenciais
              </button>
            )}
            {data.manifesto && (
              <button
                type="button"
                onClick={() => scrollToSection("manifesto")}
                className="hover:text-white transition-colors"
              >
                O Manifesto
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection("galeria")}
              className="hover:text-white transition-colors"
            >
              Galeria
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("destaques")}
              className="hover:text-white transition-colors"
            >
              Destaques
            </button>
            {data.comparison && (
              <button
                type="button"
                onClick={() => scrollToSection("comparativo")}
                className="hover:text-white transition-colors"
              >
                Comparativo
              </button>
            )}
            {data.faq && data.faq.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection("faq")}
                className="hover:text-white transition-colors"
              >
                FAQ
              </button>
            )}
          </nav>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
            style={{ borderColor: `${accentColor}50` }}
          >
            <MessageCircle className="h-3.5 w-3.5" style={{ color: accentColor }} />
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
              className="h-full w-full object-cover object-center will-change-transform"
              style={{
                transform: `translate3d(0, ${backgroundParallaxY}px, 0) scale(${backgroundZoom})`,
                transition: "transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            >
              <source src={data.hero.backgroundVideo} type="video/mp4" />
              <source src={data.hero.backgroundVideo} type="video/webm" />
            </video>
          ) : (
            <img
              src={data.hero.backgroundImage}
              alt={data.businessName}
              className="h-full w-full object-cover object-center will-change-transform"
              style={{
                transform: `translate3d(0, ${backgroundParallaxY}px, 0) scale(${backgroundZoom})`,
                transition: "transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            />
          )}

          {/* Vinheta Escura de Cinema e Iluminação Mesh nas Bordas */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_25%,#070709_90%] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/60 to-black/75" />
          <div
            className="absolute inset-0 opacity-25 mix-blend-color pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-white shadow-2xl backdrop-blur-md">
                <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
                <span style={{ color: accentColor }}>{data.hero.tagline}</span>
              </div>
            )}
            {data.hero.floatingBadge && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur-md">
                <span>{data.hero.floatingBadge}</span>
              </div>
            )}
          </div>

          {/* Título Principal Imponente */}
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.08] text-white drop-shadow-2xl ${fontHeadingClass}`}
          >
            {data.hero.title}
          </h1>

          {/* Subtítulo Narrativo */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl font-light leading-relaxed text-zinc-300 drop-shadow">
            {data.hero.subtitle}
          </p>

          {/* Ações Hero */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full px-8 py-4 text-sm sm:text-base font-bold text-black shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 35px ${accentColor}60`,
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{data.hero.ctaText || "Solicitar Atendimento VIP"}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>

            <button
              type="button"
              onClick={() => scrollToSection(data.bentoGrid ? "diferenciais" : "manifesto")}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15"
            >
              <span>Descobrir Detalhes</span>
              <ArrowDown className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Avaliação Social Proof no Hero */}
          {data.rating && (
            <div className="mt-12 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white">{data.rating.toFixed(1)}</span>
              <span>• Avaliação de excelência dos clientes</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. BLOCO MARQUEE INFINITO */}
      {data.marquee && data.marquee.length > 0 && (
        <section className="relative z-20 w-full overflow-hidden border-y border-white/10 bg-black/60 py-3.5 backdrop-blur-md">
          <div className="animate-marquee-infinite gap-8 items-center">
            {[...data.marquee, ...data.marquee, ...data.marquee].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs md:text-sm font-bold tracking-widest uppercase">
                {item.icon && <span>{item.icon}</span>}
                <span style={{ color: accentColor }}>{item.text}</span>
                <span className="text-zinc-600">•</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
            <h2 className={`mt-2 text-3xl sm:text-5xl font-bold text-white ${fontHeadingClass}`}>
              Pilares de Distinção
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
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
                  className={`group relative overflow-hidden p-6 sm:p-8 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 ${cardBorderClass} ${colSpan}`}
                >
                  {/* Imagem de Fundo se houver */}
                  {card.imageUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-35"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                  )}

                  <div className="relative z-10 flex h-full flex-col justify-between space-y-6">
                    <div className="flex items-center justify-between">
                      {card.badge ? (
                        <span
                          className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
                        >
                          {card.badge}
                        </span>
                      ) : <span />}
                      {card.metric && (
                        <span
                          className="text-2xl sm:text-3xl font-black tracking-tight"
                          style={{ color: card.accentBg ? accentColor : "#ffffff" }}
                        >
                          {card.metric}
                        </span>
                      )}
                    </div>

                    <div>
                      {card.subtitle && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                          {card.subtitle}
                        </p>
                      )}
                      <h3 className={`text-xl sm:text-2xl font-bold text-white ${fontHeadingClass}`}>
                        {card.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300">
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

              <h2 className={`mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white ${fontHeadingClass}`}>
                {data.manifesto.headline}
              </h2>

              <div className="my-6 h-px w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-zinc-300">
                {data.manifesto.bodyText}
              </p>

              {data.manifesto.quote && (
                <blockquote className="mt-10 border-l-2 border-amber-500/60 pl-6 text-left max-w-2xl bg-black/40 p-6 rounded-r-2xl">
                  <p className="italic text-base sm:text-lg text-zinc-200">
                    "{data.manifesto.quote}"
                  </p>
                  {data.manifesto.author && (
                    <footer className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
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
      <section id="galeria" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-20">
        <div className="text-center mb-14">
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            Capítulo II — O Olhar
          </span>
          <h2 className={`mt-2 text-3xl sm:text-5xl font-bold text-white ${fontHeadingClass}`}>
            A Experiência Visual
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Toque nas imagens para contemplar cada atmosfera em tela cheia e alta definição.
          </p>
        </div>

        {/* Grid de Galeria Cinematográfica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {data.gallery.map((item: CinematicGalleryItem, index: number) => (
            <div
              key={item.id || index}
              onClick={() => setSelectedPhoto(item)}
              className="group relative h-80 sm:h-96 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-2xl"
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
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Ampliar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SEÇÃO DESTAQUES & MENU DE LUXO */}
      <section id="destaques" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-20">
        <div className="text-center mb-14">
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            Capítulo III — Assinatura
          </span>
          <h2 className={`mt-2 text-3xl sm:text-5xl font-bold text-white ${fontHeadingClass}`}>
            Criações em Destaque
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Cada item carrega a dedicação de processos artesanais e ingredientes rigorosamente selecionados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {data.highlights.map((item: CinematicHighlight, index: number) => (
            <div
              key={item.id || index}
              className={`group overflow-hidden transition-all duration-300 hover:border-white/30 hover:-translate-y-1 ${cardBorderClass}`}
            >
              {item.image && (
                <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  {item.badge && (
                    <span
                      className="absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`text-xl font-bold text-white ${fontHeadingClass}`}>
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

                <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
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
            <h2 className={`mt-2 text-3xl sm:text-4xl font-bold text-white ${fontHeadingClass}`}>
              {data.comparison.headline || "O Nosso Padrão vs. O Convencional"}
            </h2>
          </div>

          <div className={`overflow-hidden ${cardBorderClass}`}>
            <div className="grid grid-cols-12 border-b border-white/10 bg-white/[0.04] p-4 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-6 text-zinc-400">Critério / Diferencial</div>
              <div className="col-span-3 text-center" style={{ color: accentColor }}>
                {data.comparison.usLabel}
              </div>
              <div className="col-span-3 text-center text-zinc-500">
                {data.comparison.othersLabel}
              </div>
            </div>

            <div className="divide-y divide-white/5 text-xs sm:text-sm">
              {data.comparison.rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.02]">
                  <div className="col-span-6 font-medium text-zinc-200">
                    {row.feature}
                  </div>
                  <div className="col-span-3 flex justify-center text-center">
                    {typeof row.us === "boolean" ? (
                      row.us ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </div>
                      )
                    ) : (
                      <span className="font-bold" style={{ color: accentColor }}>{row.us}</span>
                    )}
                  </div>
                  <div className="col-span-3 flex justify-center text-center text-zinc-500">
                    {typeof row.others === "boolean" ? (
                      row.others ? (
                        <Check className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-600" />
                      )
                    ) : (
                      <span className="text-zinc-500 text-xs">{row.others}</span>
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
            <h2 className={`mt-2 text-3xl sm:text-4xl font-bold text-white ${fontHeadingClass}`}>
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
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:bg-white/[0.02]"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 text-zinc-400 ${
                        isOpen ? "rotate-180 text-amber-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-zinc-300 border-t border-white/5 pt-3">
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
              <h2 className={`text-3xl sm:text-5xl font-bold text-white ${fontHeadingClass}`}>
                Viva a Experiência Pessoalmente na {data.businessName}
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                Nossa equipe de especialistas está pronta para proporcionar um momento único e inesquecível.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-bold text-black shadow-2xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 35px ${accentColor}60`,
                  }}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Iniciar Atendimento no WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/60 p-6 space-y-5">
              {data.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-white">
                      Endereço
                    </span>
                    <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed">
                      {data.address}
                    </p>
                  </div>
                </div>
              )}

              {data.openingHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-white">
                      Horário de Funcionamento
                    </span>
                    <p className="mt-0.5 text-xs text-zinc-300">
                      {data.openingHours}
                    </p>
                  </div>
                </div>
              )}

              {data.rating && (
                <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Reputação Comprovada:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    ★ {data.rating.toFixed(1)} / 5.0
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simples e Nobre */}
      <footer className="border-t border-white/10 py-10 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} {data.businessName}. Todos os direitos reservados.</p>
        <p className="mt-1 text-[11px] text-zinc-600">Experiência Cinematográfica desenvolvida na plataforma EIA Digital.</p>
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
