import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import { CatalogSection } from "@/modules/products/components/CatalogSection";

/**
 * CinematicLayout: Design Cinematográfico com Glassmorphism, Ambient Glow e Carrossel Feed.
 * Ideal para restaurantes gourmet, gelaterias, cafés, hamburguerias, estética e marcas premium.
 */
export class CinematicLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "cinematic" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "cinematic";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const secondaryLinks = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    const phone = bio.phone?.replace(/\D/g, "");

    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    const defaultCover =
      bio.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

    const encodedAddress = address ? encodeURIComponent(address) : null;
    const mapsLink = encodedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : null;

    return (
      <div className="niche-cinematic max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans relative">
        {/* AMBIENT MESH GLOW (Iluminação de Fundo Cinematográfica) */}
        <div
          className="fixed top-12 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[420px] rounded-full blur-[110px] pointer-events-none opacity-20 dark:opacity-30 -z-10 bg-gradient-to-tr from-purple-600 via-primary to-amber-500"
          aria-hidden="true"
        />

        {/* HERO CINEMATOGRÁFICO COM PROFUNDIDADE */}
        <header className="relative rounded-3xl overflow-hidden border border-white/15 dark:border-white/10 bg-card/85 backdrop-blur-2xl shadow-2xl">
          {/* Capa Imersiva com Vinheta */}
          <div className="relative w-full h-52 sm:h-72 overflow-hidden bg-black/40">
            <img
              src={defaultCover}
              alt={bio.display_name}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
              loading="eager"
            />
            {/* Gradiente Cinematográfico Escuro */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/40" />

            {/* Topbar Flutuante com Glassmorphism */}
            <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Experiência Exclusiva</span>
              </span>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all shadow-lg active:scale-95"
                aria-label="Compartilhar página"
              >
                <span>Compartilhar</span>
              </button>
            </div>
          </div>

          {/* Conteúdo do Perfil com Emblema da Marca */}
          <div className="p-4 sm:p-7 space-y-4 -mt-14 sm:-mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Emblema / Monograma com Anel Duplo */}
              {bio.avatar_url && (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black/40 backdrop-blur-xl shrink-0 ring-4 ring-black/20">
                  <img
                    src={bio.avatar_url}
                    alt={bio.display_name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              )}

              <div className="min-w-0 space-y-1 flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight line-clamp-2">
                  {bio.display_name}
                </h1>
                {bio.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {bio.description}
                  </p>
                )}
              </div>
            </div>

            {/* Badges de Confiança & Estrelas Reais do Google */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
              {rating ? (
                <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-500/25 shadow-2xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>
                    {rating} no Google {reviewsCount ? `(${reviewsCount} avaliações)` : ""}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/25">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Estabelecimento Verificado</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/40 backdrop-blur-md px-3 py-1 rounded-xl border border-border/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Atendimento Rápido</span>
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/40 backdrop-blur-md px-3 py-1 rounded-xl border border-border/60">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>Padrão de Excelência</span>
              </span>
            </div>

            {/* Endereço & Horário com Acesso Rápido */}
            {(address || openingHours) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                {address && (
                  <a
                    href={mapsLink || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors group truncate max-w-full"
                    title={address}
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate group-hover:underline">{address}</span>
                  </a>
                )}
                {openingHours && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{openingHours}</span>
                  </span>
                )}
              </div>
            )}

            {/* BOTÃO PRINCIPAL COM EFEITO SHIMMER / ILUMINAÇÃO DINÂMICA */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              {whats && (
                <a
                  href={whatsappUrl(
                    whats,
                    bio.whatsapp_message || `Olá! Encontrei a ${bio.display_name} e gostaria de fazer um pedido.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="relative group overflow-hidden flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {/* Feixe de Luz Shimmer */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <MessageCircle className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{bio.whatsapp_button_label || "Fazer Pedido no WhatsApp"}</span>
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  onClick={() => onTrack("phone_click")}
                  className="inline-flex items-center justify-center gap-1.5 border border-border/80 bg-card/80 hover:bg-muted text-foreground font-semibold text-xs px-4 py-3.5 rounded-2xl transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ligar</span>
                </a>
              )}

              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 border border-border/80 bg-card/80 hover:bg-muted text-foreground font-semibold text-xs px-4 py-3.5 rounded-2xl transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Como Chegar</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* VITRINE EM CARROSSEL / FEED HORIZONTAL TOUCH */}
        {products && products.length > 0 && (
          <CatalogSection items={products} whatsapp={bio.whatsapp} />
        )}

        {/* AVALIAÇÕES DE CLIENTES DO GOOGLE MAPS EM CARDS DE VIDRO */}
        {testimonials.length > 0 && (
          <section className="space-y-3.5" aria-label="Avaliações do Google">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
                  Prova Social Real
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <span>Avaliações de Clientes</span>
                  {rating && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{rating} no Google</span>
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {testimonials.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-white/10 dark:border-white/10 bg-card/75 backdrop-blur-xl shadow-sm space-y-2.5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating || 5)].map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {t.date && <span className="text-[11px] text-muted-foreground">{t.date}</span>}
                  </div>
                  <p className="text-xs text-foreground/90 italic leading-relaxed">
                    &ldquo;{t.comment || t.text}&rdquo;
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {t.name || t.author || "Cliente verificado no Google"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINKS SECUNDÁRIOS / REDES */}
        {secondaryLinks.length > 0 && (
          <section className="space-y-2.5" aria-label="Acesso Rápido">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Acesso Rápido
            </h2>
            <div className="space-y-2">
              {secondaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("link_click")}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md hover:border-primary/50 hover:bg-muted/40 text-foreground font-semibold text-xs sm:text-sm transition-all"
                >
                  <span className="truncate">{link.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* CHAVE PIX SE CONFIGURADA */}
        {bio.pix_key && (
          <div className="pt-2">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {/* BLOCOS COMPLEMENTARES */}
        {supplemental}

        {/* RODAPÉ */}
        <div className="pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-4">
            <span className="font-semibold text-foreground">{bio.display_name}</span>
            {insta && (
              <a
                href={`https://instagram.com/${insta}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>@{insta}</span>
              </a>
            )}
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

