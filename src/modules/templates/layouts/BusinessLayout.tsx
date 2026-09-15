import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * BusinessLayout: Layout Corporativo & Serviços de Alta Conversão.
 * Desenvolvido especialmente para empresas, comércios, oficinas, construção, imobiliárias e prestadores de serviços.
 * Focado em autoridade, confiança, avaliações reais do Google e orçamento rápido no WhatsApp.
 */
export class BusinessLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "business" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "business";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const services = products.filter((p) => p.active);
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
      bio.cover_url || "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80";

    const encodedAddress = address ? encodeURIComponent(address) : null;
    const mapsLink = encodedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : null;

    return (
      <div className="niche-business max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans">
        {/* HERO / APRESENTAÇÃO CORPORATIVA */}
        <header className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 bg-card shadow-sm">
          {/* Imagem de Capa */}
          <div className="relative w-full h-44 sm:h-64 bg-muted/40 overflow-hidden">
            <img
              src={defaultCover}
              alt={bio.display_name}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

            {/* Topbar Flutuante na Capa */}
            <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/15">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Empresa & Serviços</span>
              </span>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/15 hover:bg-black/80 transition-colors"
                aria-label="Compartilhar página"
              >
                <span>Compartilhar</span>
              </button>
            </div>
          </div>

          {/* Dados do Perfil */}
          <div className="p-4 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {bio.avatar_url && (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md bg-muted shrink-0">
                  <img
                    src={bio.avatar_url}
                    alt={bio.display_name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight line-clamp-2">
                  {bio.display_name}
                </h1>
                {bio.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {bio.description}
                  </p>
                )}
              </div>
            </div>

            {/* Badges de Confiança Corporativos */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-[11px] sm:text-xs">
              {rating ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>
                    {rating} no Google {reviewsCount ? `(${reviewsCount} avaliações)` : ""}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Empresa Verificada</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Orçamento Sem Compromisso</span>
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>Atendimento Especializado</span>
              </span>
            </div>

            {/* Linha de Endereço & Horário */}
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

            {/* Linha de CTAs Principais */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              {whats && (
                <a
                  href={whatsappUrl(
                    whats,
                    bio.whatsapp_message || `Olá! Encontrei a ${bio.display_name} e gostaria de solicitar um orçamento.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{bio.whatsapp_button_label || "Solicitar Orçamento no WhatsApp"}</span>
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  onClick={() => onTrack("phone_click")}
                  className="inline-flex items-center justify-center gap-1.5 border border-border bg-card hover:bg-muted/40 text-foreground font-semibold text-xs px-3.5 py-3 rounded-xl transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ligar Agora</span>
                </a>
              )}

              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 border border-border bg-card hover:bg-muted/40 text-foreground font-semibold text-xs px-3.5 py-3 rounded-xl transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ver no Mapa</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* VITRINE DE SERVIÇOS E SOLUÇÕES */}
        {services.length > 0 && (
          <section className="space-y-3.5" aria-label="Nossos Serviços">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                  Soluções & Especialidades
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Nossos Serviços
                </h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {services.length} {services.length === 1 ? "serviço" : "serviços"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {services.map((item) => {
                const serviceWhatsMsg = `Olá! Gostaria de mais informações e um orçamento para o serviço "${item.name}" da ${bio.display_name}.`;
                const serviceLink = item.button_url || (whats ? whatsappUrl(whats, serviceWhatsMsg) : undefined);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      {item.image_url ? (
                        <div className="w-full h-32 rounded-xl overflow-hidden bg-muted/30">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                            {item.name}
                          </h3>
                          {item.price !== null && item.price !== undefined && (
                            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 shrink-0">
                              {item.price > 0 ? `R$ ${item.price.toFixed(2).replace(".", ",")}` : "Sob Consulta"}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {serviceLink && (
                      <a
                        href={serviceLink}
                        target={item.button_url ? "_blank" : undefined}
                        rel="noreferrer"
                        onClick={() => onTrack("product_click")}
                        className="inline-flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                      >
                        <span>{item.button_label || "Pedir Orçamento"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* AVALIAÇÕES DE CLIENTES DO GOOGLE MAPS */}
        {testimonials.length > 0 && (
          <section className="space-y-3.5" aria-label="Avaliações de Clientes">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                Depoimentos Reais
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span>O Que Dizem os Nossos Clientes</span>
                {rating && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{rating} no Google</span>
                  </span>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {testimonials.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-2.5"
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
                    {t.name || t.author || "Cliente verificado"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINKS E BOTÕES SECUNDÁRIOS */}
        {secondaryLinks.length > 0 && (
          <section className="space-y-2.5" aria-label="Links Úteis">
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
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground font-semibold text-xs sm:text-sm transition-all"
                >
                  <span className="truncate">{link.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* CARD PIX (SE DISPONÍVEL) */}
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
