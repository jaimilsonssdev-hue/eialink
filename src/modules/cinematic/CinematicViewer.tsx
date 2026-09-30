import { useState, useEffect, useRef } from "react";
import type { CinematicPageData, CinematicGalleryItem, CinematicHighlight } from "./types";
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
  Compass,
} from "lucide-react";

interface CinematicViewerProps {
  data: CinematicPageData;
  isEmbedded?: boolean;
  className?: string;
}

export function CinematicViewer({ data, isEmbedded = false, className = "" }: CinematicViewerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CinematicGalleryItem | null>(null);
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

  const fontHeadingClass =
    data.theme.fontHeading === "serif"
      ? "font-serif tracking-tight"
      : data.theme.fontHeading === "display"
      ? "font-display uppercase tracking-wider"
      : "font-sans font-extrabold tracking-tight";

  const accentColor = data.theme.accent || "#f59e0b";
  const bgColor = data.theme.bg || "#0a0a0c";

  // Profundidade aprofundada: o fundo desce com parallax amplo enquanto o texto sobe sutilmente em 3D
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
      className={`cinematic-experience relative w-full text-zinc-100 selection:bg-amber-500/30 selection:text-white ${
        isEmbedded ? "h-full overflow-y-auto" : "min-h-screen overflow-x-hidden"
      } ${className}`}
      style={{
        backgroundColor: bgColor,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Luzes Volumétricas de Fundo (Mesh Glows 60 FPS) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60">
        <div
          className="absolute -top-[20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[140px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
            transform: `translate3d(-50%, ${scrollY * 0.1}px, 0)`,
          }}
        />
        <div
          className="absolute top-[40%] -left-[10%] h-[500px] w-[500px] rounded-full blur-[160px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
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
          <a href="#hero" className="group flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-xs font-bold transition-transform group-hover:scale-105"
              style={{ color: accentColor }}
            >
              {data.businessName.slice(0, 2).toUpperCase()}
            </span>
            <span className={`text-sm sm:text-base font-bold tracking-wide text-white ${fontHeadingClass}`}>
              {data.businessName}
            </span>
          </a>

          {/* Links de navegação interna */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest text-zinc-400">
            <button
              type="button"
              onClick={() => scrollToSection("manifesto")}
              className="hover:text-white transition-colors"
            >
              O Manifesto
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("galeria")}
              className="hover:text-white transition-colors"
            >
              A Experiência
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("destaques")}
              className="hover:text-white transition-colors"
            >
              Destaques
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("localizacao")}
              className="hover:text-white transition-colors"
            >
              Localização
            </button>
          </nav>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
            style={{ borderColor: `${accentColor}50` }}
          >
            <MessageCircle className="h-3.5 w-3.5" style={{ color: accentColor }} />
            <span>Falar no WhatsApp</span>
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
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,#0a0a0c_90%] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/60 to-black/75" />
          <div
            className="absolute inset-0 opacity-30 mix-blend-color pointer-events-none"
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
          {/* Badge Refinado */}
          {data.hero.tagline && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-white shadow-2xl backdrop-blur-md">
              <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
              <span className="tracking-widest" style={{ color: accentColor }}>
                {data.hero.tagline}
              </span>
            </div>
          )}

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
              onClick={() => scrollToSection("manifesto")}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15"
            >
              <span>Conhecer o Manifesto</span>
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

      {/* 2. SEÇÃO ORIGEM & MANIFESTO NARRATIVO */}
      <section id="manifesto" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-24 sm:py-32">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 sm:p-14 md:p-16 backdrop-blur-2xl shadow-2xl">
          {/* Detalhe de iluminação no card */}
          <div
            className="absolute -top-12 left-1/2 h-24 w-64 -translate-x-1/2 rounded-full blur-2xl"
            style={{ backgroundColor: `${accentColor}30` }}
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

            {/* Citação em Destaque */}
            {data.manifesto.quote && (
              <blockquote className="mt-10 border-l-2 border-amber-500/60 pl-6 text-left max-w-2xl bg-black/30 p-6 rounded-r-2xl">
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

      {/* 3. SEÇÃO A EXPERIÊNCIA (GALERIA COM LIGHTBOX) */}
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
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />

              {/* Botão de expansão no canto superior */}
              <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4 text-white" />
              </div>

              {/* Legenda inferior */}
              <div className="absolute bottom-0 inset-x-0 p-5">
                {item.category && (
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: accentColor }}
                  >
                    {item.category}
                  </span>
                )}
                <p className="text-xs sm:text-sm font-medium text-zinc-200 line-clamp-2">
                  {item.caption || "Contemplar detalhes"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SEÇÃO DESTAQUES DA CASA / CARDÁPIO ASSINATURA */}
      {data.highlights && data.highlights.length > 0 && (
        <section id="destaques" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8 py-24">
          <div className="text-center mb-14">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Capítulo III — Assinaturas
            </span>
            <h2 className={`mt-2 text-3xl sm:text-5xl font-bold text-white ${fontHeadingClass}`}>
              Destaques Selecionados
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
              Criações autorais e serviços nobres com ingredientes de alta proveniência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.highlights.map((item: CinematicHighlight, index: number) => (
              <div
                key={item.id || index}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-2xl"
              >
                {item.image && (
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    {item.price && (
                      <div className="absolute bottom-3 right-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                        {item.price}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className={`text-lg font-bold text-white ${fontHeadingClass}`}>
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                  </div>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/15 hover:border-white/30"
                  >
                    <MessageCircle className="h-3.5 w-3.5" style={{ color: accentColor }} />
                    <span>Pedir / Reservar</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. SEÇÃO LOCALIZAÇÃO & RODAPÉ VIP */}
      <section id="localizacao" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/60 p-8 sm:p-12 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                Capítulo IV — O Encontro
              </span>
              <h2 className={`mt-2 text-2xl sm:text-4xl font-bold text-white ${fontHeadingClass}`}>
                Visite Nosso Espaço
              </h2>
              <p className="mt-3 text-sm text-zinc-400">
                Uma atmosfera criada exclusivamente para desconectar da rotina e apreciar cada instante.
              </p>

              <div className="mt-8 space-y-4">
                {data.address && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <MapPin className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-zinc-400 tracking-wider">Endereço</span>
                      <span className="text-sm font-medium text-white">{data.address}</span>
                    </div>
                  </div>
                )}

                {data.openingHours && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <Clock className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-zinc-400 tracking-wider">Horário</span>
                      <span className="text-sm font-medium text-white">{data.openingHours}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-black shadow-xl transition-all hover:scale-105"
                  style={{ backgroundColor: accentColor }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Agendar Experiência</span>
                </a>
              </div>
            </div>

            {/* Card Visual de Localização */}
            <div className="relative h-64 sm:h-80 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 flex flex-col justify-end p-6">
              <img
                src={data.gallery[0]?.url || data.hero.backgroundImage}
                alt="Ambiente"
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-300">Presença VIP</span>
                <h4 className="text-lg font-bold text-white mt-1">{data.businessName}</h4>
                <p className="text-xs text-zinc-300 mt-1">{data.niche}</p>
                {data.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.businessName} ${data.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:underline"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Abrir rota no Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura Rodapé */}
        <footer className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {data.businessName}. Todos os direitos reservados.</p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Landing Page Cinematográfica desenvolvida no Cinematic Studio • Powered by EIA Digital
          </p>
        </footer>
      </section>

      {/* Botão Flutuante de WhatsApp Fixo no Mobile/Desktop */}
      <aside className="fixed bottom-6 right-6 z-40">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-full border border-white/20 bg-black/80 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black"
          style={{ borderColor: `${accentColor}70` }}
        >
          <span
            className="flex h-3 w-3 rounded-full animate-ping"
            style={{ backgroundColor: accentColor }}
          />
          <MessageCircle className="h-4 w-4" style={{ color: accentColor }} />
          <span className="hidden sm:inline">Atendimento Imediato</span>
        </a>
      </aside>

      {/* Modal Lightbox de Foto em Tela Cheia */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || "Visualização ampliada"}
              className="max-h-[75vh] w-auto object-contain mx-auto"
            />
            {selectedPhoto.caption && (
              <div className="p-4 sm:p-6 bg-zinc-900/90 border-t border-white/10 text-center">
                {selectedPhoto.category && (
                  <span
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: accentColor }}
                  >
                    {selectedPhoto.category}
                  </span>
                )}
                <p className="text-sm font-medium text-zinc-200">
                  {selectedPhoto.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
