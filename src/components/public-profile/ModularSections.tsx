import { memo } from "react";
import { CheckCircle2, Play, Quote, Star, Video } from "lucide-react";
import type { PublicBio, TrackEvent } from "./types";
import {
  InstagramProductCarousel,
  type ProductCarouselConfig,
  type CarouselProductItem,
} from "./InstagramProductCarousel";

export type { ProductCarouselConfig, CarouselProductItem };

export interface VideoConfig {
  enabled: boolean;
  url: string;
  title?: string;
  caption?: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  rating: number;
  text: string;
  role?: string;
  avatar?: string;
}

export interface AboutConfig {
  enabled: boolean;
  title?: string;
  text?: string;
  highlights?: string[];
}

export function parseVideoEmbedUrl(rawUrl: string): { type: "youtube" | "vimeo" | "mp4" | "other"; embedUrl: string } | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();

  // YouTube standard or short
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct MP4 / WebM
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "mp4",
      embedUrl: trimmed,
    };
  }

  return {
    type: "other",
    embedUrl: trimmed,
  };
}

export const ModularSections = memo(function ModularSections({
  bio,
  onTrack,
  hideTestimonialsIfInLayout = false,
  hideProductCarouselIfInLayout = false,
}: {
  bio: PublicBio;
  onTrack?: TrackEvent;
  hideTestimonialsIfInLayout?: boolean;
  hideProductCarouselIfInLayout?: boolean;
}) {
  const socialData = (bio.social_links as Record<string, any>) || {};
  const productCarouselConfig = socialData.product_carousel as ProductCarouselConfig | undefined;
  const videoConfig = socialData.video_embed as VideoConfig | undefined;
  const testimonials = (Array.isArray(socialData.testimonials) ? socialData.testimonials : []) as TestimonialItem[];
  const aboutConfig = socialData.about_section as AboutConfig | undefined;
  const showTestimonials = socialData.show_testimonials !== false;

  const sectionColors = socialData.custom_theme?.sections || {
    bg: socialData.custom_theme?.card_bg,
    text: socialData.custom_theme?.text,
    accent: socialData.custom_theme?.primary,
    border: socialData.custom_theme?.border_color,
  };

  const hasProductCarousel =
    !hideProductCarouselIfInLayout &&
    Boolean(
      productCarouselConfig?.enabled &&
        Array.isArray(productCarouselConfig.items) &&
        productCarouselConfig.items.some((i) => i.name && i.image_url),
    );
  const videoParsed = videoConfig?.enabled && videoConfig.url ? parseVideoEmbedUrl(videoConfig.url) : null;
  const hasAbout = aboutConfig?.enabled && (aboutConfig.text || (aboutConfig.highlights && aboutConfig.highlights.length > 0));
  const hasTestimonials = showTestimonials && testimonials.length > 0 && !hideTestimonialsIfInLayout;

  if (!hasProductCarousel && !videoParsed && !hasAbout && !hasTestimonials) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 px-4 my-6">
      {/* 0. CARROSSEL DE PRODUTOS / DESTAQUES ESTILO INSTAGRAM */}
      {hasProductCarousel && (
        <InstagramProductCarousel
          bio={bio}
          config={productCarouselConfig}
          onTrack={onTrack}
        />
      )}
      {/* 1. SEÇÃO DE VÍDEO EM DESTAQUE */}
      {videoParsed && (
        <section className="space-y-2.5 animate-fade-in-up" aria-label="Vídeo em Destaque">
          {videoConfig?.title && (
            <div className="flex items-center gap-2 px-1">
              <Video
                style={{ color: sectionColors.accent || undefined }}
                className="w-4 h-4 text-[color:var(--template-primary,#22c55e)]"
              />
              <h3
                style={{ color: sectionColors.text || undefined }}
                className="text-sm font-bold text-[color:var(--bio-fg,#fff)] tracking-tight"
              >
                {videoConfig.title}
              </h3>
            </div>
          )}
          <div
            style={{
              borderColor: sectionColors.border || undefined,
            }}
            className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-lg ring-1 ring-white/5"
          >
            {videoParsed.type === "mp4" ? (
              <video
                src={videoParsed.embedUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe
                src={videoParsed.embedUrl}
                title={videoConfig?.title || "Vídeo de Apresentação"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                loading="lazy"
              />
            )}
          </div>
          {videoConfig?.caption && (
            <p className="text-xs text-[color:var(--bio-muted,rgba(255,255,255,0.7))] text-center px-2">
              {videoConfig.caption}
            </p>
          )}
        </section>
      )}

      {/* 2. SEÇÃO SOBRE NÓS & DIFERENCIAIS */}
      {hasAbout && (
        <section
          style={{
            backgroundColor: sectionColors.bg || undefined,
            color: sectionColors.text || undefined,
            borderColor: sectionColors.border || undefined,
          }}
          className="rounded-2xl p-5 bg-card/80 border border-border/80 backdrop-blur-md shadow-sm space-y-3.5 animate-fade-in-up"
          aria-label="Sobre Nós"
        >
          <div className="space-y-1">
            <span
              style={{ color: sectionColors.accent || undefined }}
              className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--template-primary,#22c55e)]"
            >
              Conheça Nossa Empresa
            </span>
            <h3
              style={{ color: sectionColors.text || undefined }}
              className="text-base font-bold text-foreground"
            >
              {aboutConfig?.title || "Sobre Nós"}
            </h3>
          </div>
          {aboutConfig?.text && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {aboutConfig.text}
            </p>
          )}
          {aboutConfig?.highlights && aboutConfig.highlights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50">
              {aboutConfig.highlights.filter(Boolean).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2
                    style={{ color: sectionColors.accent || undefined }}
                    className="w-3.5 h-3.5 text-[color:var(--template-primary,#22c55e)] shrink-0"
                  />
                  <span style={{ color: sectionColors.text || undefined }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. SEÇÃO DE DEPOIMENTOS (Para templates que não tenham nativamente) */}
      {hasTestimonials && (
        <section className="space-y-3 animate-fade-in-up" aria-label="Depoimentos de Clientes">
          <div className="flex items-center justify-between px-1">
            <div>
              <span
                style={{ color: sectionColors.accent || undefined }}
                className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--template-primary,#22c55e)]"
              >
                Opinião de Clientes
              </span>
              <h3
                style={{ color: sectionColors.text || undefined }}
                className="text-sm font-bold text-[color:var(--bio-fg,#fff)]"
              >
                Avaliações & Recomendações
              </h3>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>5.0</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {testimonials.slice(0, 4).map((t, idx) => (
              <div
                key={t.id || idx}
                style={{
                  backgroundColor: sectionColors.bg || undefined,
                  color: sectionColors.text || undefined,
                  borderColor: sectionColors.border || undefined,
                }}
                className="relative rounded-2xl p-4 bg-card/70 border border-border/70 backdrop-blur-md shadow-xs space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {t.avatar ? (
                      <img
                        src={t.avatar}
                        alt={t.author}
                        className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                      />
                    ) : (
                      <div
                        style={{
                          backgroundColor: sectionColors.accent ? `${sectionColors.accent}20` : undefined,
                          color: sectionColors.accent || undefined,
                          borderColor: sectionColors.accent ? `${sectionColors.accent}40` : undefined,
                        }}
                        className="w-8 h-8 rounded-full bg-[color:var(--template-primary,#22c55e)]/20 text-[color:var(--template-primary,#22c55e)] flex items-center justify-center font-bold text-xs shrink-0 border border-[color:var(--template-primary,#22c55e)]/30"
                      >
                        {t.author ? t.author.charAt(0).toUpperCase() : "C"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        style={{ color: sectionColors.text || undefined }}
                        className="text-xs font-bold text-foreground truncate"
                      >
                        {t.author}
                      </p>
                      {t.role && (
                        <p className="text-[10px] text-muted-foreground truncate">{t.role}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex text-amber-400 text-[11px] shrink-0">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>

                <p
                  style={{
                    borderLeftColor: sectionColors.accent || undefined,
                  }}
                  className="text-xs text-muted-foreground italic line-clamp-4 relative pl-3 border-l-2 border-[color:var(--template-primary,#22c55e)]/40"
                >
                  "{t.text}"
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});


