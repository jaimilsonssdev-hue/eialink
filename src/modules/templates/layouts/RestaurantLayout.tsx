import type { ReactNode } from "react";
import { ArrowUpRight, CalendarCheck, Check, Clock, Instagram, MapPin, MessageCircle, ShieldCheck, Star, UtensilsCrossed } from "lucide-react";
import type { CatalogItem } from "@/modules/products/types";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

export class RestaurantLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "restaurant" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "restaurant";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], bookingUrl, supplemental } = ctx;
    const menu = products.filter((p) => p.active);
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    return (
      <div className="niche-restaurant">
        <header className="niche-restaurant-hero">
          {bio.cover_url ? (
            <img src={bio.cover_url} alt="" className="niche-restaurant-hero-img" loading="eager" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              alt=""
              className="niche-restaurant-hero-img"
              loading="eager"
            />
          )}
          <div className="niche-restaurant-hero-overlay" aria-hidden />
          <button
            type="button"
            onClick={onShare}
            className="niche-restaurant-share"
            aria-label="Compartilhar página"
          >
            Compartilhar
          </button>
          <div className="niche-restaurant-hero-content">
            <span className="niche-eyebrow">
              <UtensilsCrossed size={14} aria-hidden /> Gastronomia & Sabor
            </span>
            <h1 className="niche-restaurant-name">{bio.display_name}</h1>
            {bio.description && (
              <p className="niche-restaurant-lead">{bio.description}</p>
            )}
            <div className="niche-restaurant-meta">
              {rating ? (
                <span>
                  <Star size={14} className="text-amber-400 fill-amber-400 inline" aria-hidden /> {rating} no Google {reviewsCount ? `(${reviewsCount})` : ""}
                </span>
              ) : (
                <span className="opacity-80">
                  <Check size={14} aria-hidden className="inline" /> Atendimento Verificado
                </span>
              )}
              {insta && (
                <a
                  href={`https://instagram.com/${insta}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("instagram_click")}
                >
                  <Instagram size={14} aria-hidden /> @{insta}
                </a>
              )}
              {(address || openingHours) && (
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-amber-200/80 mt-1">
                  {address && (
                    <span className="inline-flex items-center gap-1 max-w-[260px] truncate" title={address}>
                      <MapPin size={12} className="text-amber-400 flex-shrink-0" />
                      <span className="truncate">{address}</span>
                    </span>
                  )}
                  {openingHours && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-amber-400 flex-shrink-0" />
                      <span>{openingHours}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-2.5 my-3">
          {bookingUrl && (
            <a
              href={bookingUrl}
              onClick={() => onTrack("booking_click")}
              className="niche-restaurant-cta bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              <CalendarCheck size={20} aria-hidden />
              <span className="flex-1 text-left">
                <span className="block text-sm font-bold uppercase tracking-wider">Reservar Mesa / Horário Online</span>
                <span className="block text-xs opacity-90">Escolha o melhor dia e horário</span>
              </span>
              <ArrowUpRight size={20} aria-hidden />
            </a>
          )}
          {whats && (
            <a
              href={whatsappUrl(whats, bio.whatsapp_message || "Olá, gostaria de fazer um pedido")}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("whatsapp_click")}
              className="niche-restaurant-cta"
            >
              <MessageCircle size={20} aria-hidden />
              <span className="flex-1 text-left">
                <span className="block text-sm font-bold uppercase tracking-wider">Fazer pedido pelo WhatsApp</span>
                <span className="block text-xs opacity-90">Cardápio completo e resposta rápida</span>
              </span>
              <ArrowUpRight size={20} aria-hidden />
            </a>
          )}
        </div>

        {menu.length > 0 && (
          <section className="niche-restaurant-menu" aria-label="Cardápio">
            <div className="niche-section-title">
              <span className="niche-section-rule" aria-hidden />
              <h2>Cardápio</h2>
              <span className="niche-section-rule" aria-hidden />
            </div>
            <ul className="niche-restaurant-menu-list">
              {menu.map((item) => (
                <li key={item.id} className="niche-restaurant-dish">
                  <div className="niche-restaurant-dish-img">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="niche-restaurant-dish-fallback" aria-hidden>
                        <UtensilsCrossed size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="niche-restaurant-dish-name">{item.name}</h3>
                      <span className="niche-restaurant-dots" aria-hidden />
                      {item.price !== null && (
                        <span className="niche-restaurant-dish-price">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="niche-restaurant-dish-desc">{item.description}</p>
                    )}
                    {item.button_url && (
                      <a
                        href={item.button_url}
                        target="_blank"
                        rel="noreferrer"
                        className="niche-restaurant-dish-cta"
                      >
                        {item.button_label} <ArrowUpRight size={14} aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="niche-restaurant-section my-6 px-4 max-w-2xl mx-auto" aria-label="Avaliações do Google">
            <div className="text-center mb-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400">Opinião de Quem Frequenta</span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">Avaliações no Google</h2>
              <p className="text-xs text-muted-foreground">Depoimentos reais deixados por nossos clientes</p>
            </div>

            <div className="grid gap-3">
              {testimonials.slice(0, 3).map((rev: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/80 shadow-xs backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.author} className="w-8 h-8 rounded-full object-cover border border-amber-400/40" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        {rev.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{rev.author}</h4>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {secondary.length > 0 && (
          <section className="niche-restaurant-links" aria-label="Mais">
            <p className="niche-eyebrow">Mais da casa</p>
            <ul>
              {secondary.map((link: PublicLink) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("link_click", link.id)}
                  >
                    <span>{link.title}</span>
                    <ArrowUpRight size={16} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {bio.pix_key && (
          <div className="niche-restaurant-pix">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {supplemental}
        <Footer />
      </div>
    );
  }
}

export type _Ref = CatalogItem;
