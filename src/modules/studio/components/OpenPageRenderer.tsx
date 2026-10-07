import React, { useState } from "react";
import type {
  OpenPageSiteConfig,
  HeroSection,
  ServicesSection,
  StorySection,
  ReviewsSection,
  GallerySection,
  FaqSection,
  ContactSection,
} from "../schema";
import {
  Star,
  MessageCircle,
  Clock,
  MapPin,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface OpenPageRendererProps {
  config: OpenPageSiteConfig;
  onEditSection?: (sectionId: string) => void;
}

export function OpenPageRenderer({ config, onEditSection }: OpenPageRendererProps) {
  const { theme, meta, sections } = config;

  // Monta classe de borda
  const radiusClass =
    theme.borderRadius === "full"
      ? "rounded-3xl"
      : theme.borderRadius === "xl"
        ? "rounded-2xl"
        : theme.borderRadius === "md"
          ? "rounded-xl"
          : "rounded-none";

  const fontHeadingFamily =
    theme.fontHeading === "serif"
      ? "font-serif"
      : theme.fontHeading === "mono"
        ? "font-mono"
        : "font-sans";

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300 selection:bg-amber-500 selection:text-black"
      style={{
        backgroundColor: theme.bg,
        color: theme.textColor,
        fontFamily: theme.fontBody === "serif" ? "Georgia, serif" : "Inter, system-ui, sans-serif",
      }}
    >
      {/* 1. Header Fixo Minimalista */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md px-4 py-3 sm:px-8 transition-colors"
        style={{
          backgroundColor: `${theme.bg}cc`,
          borderColor: theme.border,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {meta.logoUrl ? (
              <img src={meta.logoUrl} alt={meta.businessName} className="h-8 w-auto rounded" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shadow"
                style={{ backgroundColor: theme.accent, color: theme.bg }}
              >
                {meta.businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className={`font-bold text-sm sm:text-base tracking-tight block leading-tight ${fontHeadingFamily}`}>
                {meta.businessName}
              </span>
              <span className="text-[10px] block opacity-70 leading-tight">
                {meta.niche}
              </span>
            </div>
          </div>

          <a
            href={`https://wa.me/55${meta.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de atendimento.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </header>

      {/* 2. Renderização Sequencial das Seções */}
      <main className="w-full">
        {sections.map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <RenderHero
                  key={section.id}
                  section={section}
                  theme={theme}
                  meta={meta}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "services":
              return (
                <RenderServices
                  key={section.id}
                  section={section}
                  theme={theme}
                  meta={meta}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "story":
              return (
                <RenderStory
                  key={section.id}
                  section={section}
                  theme={theme}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "reviews":
              return (
                <RenderReviews
                  key={section.id}
                  section={section}
                  theme={theme}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "gallery":
              return (
                <RenderGallery
                  key={section.id}
                  section={section}
                  theme={theme}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "faq":
              return (
                <RenderFaq
                  key={section.id}
                  section={section}
                  theme={theme}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            case "contact":
              return (
                <RenderContact
                  key={section.id}
                  section={section}
                  theme={theme}
                  radiusClass={radiusClass}
                  fontHeadingFamily={fontHeadingFamily}
                />
              );
            default:
              return null;
          }
        })}
      </main>

      {/* 3. Rodapé Oficial */}
      <footer
        className="border-t py-8 px-4 text-center text-xs opacity-70"
        style={{ borderColor: theme.border }}
      >
        <div className="max-w-4xl mx-auto space-y-2">
          <p>© {new Date().getFullYear()} {meta.businessName}. Todos os direitos reservados.</p>
          <p className="text-[11px]">Desenvolvido com tecnologia de alta conversão EIA Link.</p>
        </div>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// SUBCOMPONENTES DE SEÇÃO (ALTA CONVERSÃO & DESIGN CRO)
// ----------------------------------------------------

function RenderHero({
  section,
  theme,
  meta,
  radiusClass,
  fontHeadingFamily,
}: {
  section: HeroSection;
  theme: OpenPageSiteConfig["theme"];
  meta: OpenPageSiteConfig["meta"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  const whatsappUrl = `https://wa.me/55${meta.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    section.ctaWhatsAppMessage || "Olá! Gostaria de agendar um atendimento.",
  )}`;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      {/* Imagem de Fundo com Overlay Gradiente */}
      {section.backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={section.backgroundImage}
            alt=""
            className="h-full w-full object-cover object-center filter brightness-[0.25]"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${theme.bg}80, ${theme.bg})`,
            }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {section.badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md"
            style={{
              backgroundColor: `${theme.accent}15`,
              borderColor: `${theme.accent}40`,
              color: theme.accent,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{section.badge}</span>
          </div>
        )}

        <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] ${fontHeadingFamily}`}>
          {section.headline}
        </h1>

        <p className="text-base sm:text-lg max-w-2xl mx-auto opacity-90 leading-relaxed font-normal">
          {section.subheadline}
        </p>

        {section.tagline && (
          <p className="text-xs sm:text-sm italic opacity-75 font-serif">
            "{section.tagline}"
          </p>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full sm:w-auto px-8 py-3.5 ${radiusClass} font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95`}
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{section.ctaText}</span>
          </a>

          {section.secondaryCtaText && (
            <a
              href="#servicos"
              className={`w-full sm:w-auto px-6 py-3.5 ${radiusClass} text-sm font-semibold border backdrop-blur-md transition-colors hover:bg-white/10`}
              style={{ borderColor: theme.border }}
            >
              {section.secondaryCtaText}
            </a>
          )}
        </div>

        {/* Métricas / Stats de Confiança */}
        {section.stats && section.stats.length > 0 && (
          <div className="pt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto border-t" style={{ borderColor: theme.border }}>
            {section.stats.map((st, i) => (
              <div key={i} className="text-center">
                <span className={`block text-xl sm:text-2xl font-bold ${fontHeadingFamily}`} style={{ color: theme.accent }}>
                  {st.value}
                </span>
                <span className="text-[11px] sm:text-xs opacity-70 block font-medium">
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RenderServices({
  section,
  theme,
  meta,
  radiusClass,
  fontHeadingFamily,
}: {
  section: ServicesSection;
  theme: OpenPageSiteConfig["theme"];
  meta: OpenPageSiteConfig["meta"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  return (
    <section id="servicos" className="py-16 sm:py-20 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          {section.badge && (
            <span className="text-[11px] font-bold tracking-widest uppercase block" style={{ color: theme.accent }}>
              {section.badge}
            </span>
          )}
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${fontHeadingFamily}`}>
            {section.title}
          </h2>
          <p className="text-sm opacity-75 max-w-xl mx-auto">
            {section.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {section.items.map((item) => (
            <div
              key={item.id}
              className={`p-6 ${radiusClass} border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm`}
              style={{
                backgroundColor: theme.cardBg,
                borderColor: item.highlighted ? theme.accent : theme.border,
              }}
            >
              <div className="space-y-3">
                {item.badge && (
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
                  >
                    {item.badge}
                  </span>
                )}
                <h3 className={`text-lg font-bold leading-snug ${fontHeadingFamily}`}>
                  {item.title}
                </h3>
                <p className="text-xs opacity-75 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 border-t mt-6 flex items-center justify-between" style={{ borderColor: theme.border }}>
                <div>
                  {item.price && (
                    <span className="block font-bold text-base" style={{ color: theme.accent }}>
                      {item.price}
                    </span>
                  )}
                  {item.duration && (
                    <span className="block text-[10px] opacity-60">
                      Duração: {item.duration}
                    </span>
                  )}
                </div>

                <a
                  href={`https://wa.me/55${meta.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse no serviço: ${item.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  style={{ backgroundColor: theme.accent, color: theme.bg }}
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Pedir</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderStory({
  section,
  theme,
  radiusClass,
  fontHeadingFamily,
}: {
  section: StorySection;
  theme: OpenPageSiteConfig["theme"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <span className="text-[11px] font-bold uppercase tracking-widest block text-center" style={{ color: theme.accent }}>
          {section.title}
        </span>
        <h2 className={`text-2xl sm:text-3xl font-bold text-center tracking-tight ${fontHeadingFamily}`}>
          {section.headline}
        </h2>
        <div className="space-y-4 text-sm sm:text-base opacity-85 leading-relaxed max-w-3xl mx-auto">
          {section.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {section.quote && (
          <blockquote
            className={`p-4 ${radiusClass} border-l-4 italic my-6 text-sm opacity-90`}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.accent,
            }}
          >
            "{section.quote}"
          </blockquote>
        )}

        {section.highlightValues && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            {section.highlightValues.map((val, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold opacity-90">
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RenderReviews({
  section,
  theme,
  radiusClass,
  fontHeadingFamily,
}: {
  section: ReviewsSection;
  theme: OpenPageSiteConfig["theme"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400" />
            ))}
            <span className="ml-2 font-bold text-sm text-foreground">
              {section.overallRating.toFixed(1)} / 5.0 ({section.totalReviews} avaliações)
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${fontHeadingFamily}`}>
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm opacity-70">{section.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {section.items.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 ${radiusClass} border flex flex-col justify-between space-y-4`}
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
            >
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(rev.rating || 5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs opacity-85 italic leading-relaxed">
                "{rev.comment}"
              </p>
              <div className="border-t pt-3 flex items-center justify-between text-[11px]" style={{ borderColor: theme.border }}>
                <span className="font-semibold">{rev.author}</span>
                <span className="opacity-60">{rev.role || "Google Maps"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderGallery({
  section,
  theme,
  radiusClass,
  fontHeadingFamily,
}: {
  section: GallerySection;
  theme: OpenPageSiteConfig["theme"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  if (!section.photos || section.photos.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${fontHeadingFamily}`}>
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm opacity-70">{section.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {section.photos.map((ph) => (
            <div
              key={ph.id}
              className={`relative h-44 sm:h-56 ${radiusClass} overflow-hidden border group shadow-sm`}
              style={{ borderColor: theme.border }}
            >
              <img
                src={ph.url}
                alt={ph.caption || ""}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {ph.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-[11px] text-white">
                  {ph.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderFaq({
  section,
  theme,
  radiusClass,
  fontHeadingFamily,
}: {
  section: FaqSection;
  theme: OpenPageSiteConfig["theme"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 px-4 sm:px-8 border-b" style={{ borderColor: theme.border }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${fontHeadingFamily}`}>
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm opacity-70">{section.subtitle}</p>
        </div>

        <div className="space-y-3">
          {section.items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.id}
                className={`${radiusClass} border overflow-hidden transition-colors`}
                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>{item.question}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs opacity-80 leading-relaxed border-t pt-3" style={{ borderColor: theme.border }}>
                    {item.answer}
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

function RenderContact({
  section,
  theme,
  radiusClass,
  fontHeadingFamily,
}: {
  section: ContactSection;
  theme: OpenPageSiteConfig["theme"];
  radiusClass: string;
  fontHeadingFamily: string;
}) {
  const whatsappUrl = `https://wa.me/55${section.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de agendar uma visita/atendimento.")}`;

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${fontHeadingFamily}`}>
          {section.title}
        </h2>
        <p className="text-sm opacity-80 max-w-xl mx-auto">{section.subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          {section.address && (
            <div className={`p-4 ${radiusClass} border flex items-start gap-3`} style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: theme.accent }} />
              <div className="text-xs">
                <span className="font-semibold block">Localização</span>
                <span className="opacity-75">{section.address}</span>
              </div>
            </div>
          )}

          {section.openingHours && (
            <div className={`p-4 ${radiusClass} border flex items-start gap-3`} style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <Clock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: theme.accent }} />
              <div className="text-xs">
                <span className="font-semibold block">Horário de Funcionamento</span>
                <span className="opacity-75">{section.openingHours}</span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-8 py-4 ${radiusClass} font-bold text-sm shadow-xl transition-transform hover:scale-105 active:scale-95`}
            style={{ backgroundColor: theme.accent, color: theme.bg }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{section.ctaText}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

