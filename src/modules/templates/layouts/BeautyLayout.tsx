import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

export class BeautyLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "beauty" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "beauty";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], bookingUrl, supplemental } = ctx;
    const services = products.filter((p) => p.active);
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
      <div className="niche-beauty">
        <header className="niche-beauty-hero">
          <div className="niche-beauty-cover-wrapper">
            {bio.cover_url ? (
              <img src={bio.cover_url} alt="" className="niche-beauty-cover" loading="eager" />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="niche-beauty-cover"
                loading="eager"
              />
            )}
            <div className="niche-beauty-cover-overlay" aria-hidden />
            <button
              type="button"
              onClick={onShare}
              className="niche-beauty-share-btn"
              aria-label="Compartilhar perfil"
            >
              Compartilhar
            </button>
          </div>

          <div className="niche-beauty-profile">
            <div className="niche-beauty-avatar-ring">
              {bio.avatar_url ? (
                <img src={bio.avatar_url} alt={bio.display_name} className="niche-beauty-avatar" />
              ) : (
                <div className="niche-beauty-avatar-fallback">
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="niche-beauty-badges">
              <span className="niche-beauty-badge">
                <Sparkles size={13} aria-hidden /> Estética & Bem-estar
              </span>
              {rating ? (
                <span className="niche-beauty-badge niche-beauty-badge-star">
                  <Star size={13} className="text-amber-400 fill-amber-400" aria-hidden />
                  {rating} no Google {reviewsCount ? `(${reviewsCount} avaliações)` : ""}
                </span>
              ) : null}
            </div>

            <h1 className="niche-beauty-title">{bio.display_name}</h1>
            {bio.description && <p className="niche-beauty-lead">{bio.description}</p>}

            {(address || openingHours) && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-pink-900/80 my-2 px-2">
                {address && (
                  <span className="inline-flex items-center gap-1 max-w-[280px] truncate" title={address}>
                    <MapPin size={13} className="text-pink-600 flex-shrink-0" aria-hidden />
                    <span className="truncate">{address}</span>
                  </span>
                )}
                {openingHours && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-pink-600 flex-shrink-0" aria-hidden />
                    <span>{openingHours}</span>
                  </span>
                )}
              </div>
            )}

            <div className="niche-beauty-trust-row">
              <span>
                <ShieldCheck size={14} aria-hidden /> Atendimento VIP & Exclusivo
              </span>
              <span>
                <Sparkles size={14} aria-hidden /> Procedimentos de Alta Performance
              </span>
            </div>

            <div className="niche-beauty-actions">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={() => onTrack("booking_click")}
                  className="niche-beauty-cta-primary"
                >
                  <CalendarCheck size={18} aria-hidden />
                  Agendar Horário Online
                </a>
              ) : (
                whats && (
                  <a
                    href={whatsappUrl(whats, bio.whatsapp_message || "Olá! Gostaria de agendar um horário de atendimento.")}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="niche-beauty-cta-primary"
                  >
                    <CalendarCheck size={18} aria-hidden />
                    {bio.whatsapp_button_label || "Agendar Horário no WhatsApp"}
                  </a>
                )
              )}

              {whats && bookingUrl && (
                <a
                  href={whatsappUrl(whats, bio.whatsapp_message || "Olá! Gostaria de tirar algumas dúvidas.")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="niche-beauty-cta-secondary"
                >
                  <MessageCircle size={18} aria-hidden />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </header>

        {services.length > 0 && (
          <section className="niche-beauty-section" aria-label="Procedimentos e Serviços">
            <div className="niche-beauty-section-head">
              <span className="niche-beauty-eyebrow">Menu de Cuidados</span>
              <h2>Procedimentos em Destaque</h2>
              <p>Tratamentos personalizados para valorizar a sua melhor versão</p>
            </div>

            <div className="niche-beauty-services-grid">
              {services.map((item) => (
                <article key={item.id} className="niche-beauty-service-card">
                  {item.image_url && (
                    <div className="niche-beauty-service-media">
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    </div>
                  )}
                  <div className="niche-beauty-service-body">
                    <div className="niche-beauty-service-header">
                      <h3>{item.name}</h3>
                      {item.price !== null && (
                        <span className="niche-beauty-service-price">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="niche-beauty-service-desc">{item.description}</p>
                    )}
                    <div className="niche-beauty-service-footer">
                      {bookingUrl ? (
                        <a
                          href={bookingUrl}
                          onClick={() => onTrack("booking_click", item.id)}
                          className="niche-beauty-service-btn"
                        >
                          <CalendarCheck size={14} aria-hidden /> Agendar
                        </a>
                      ) : whats ? (
                        <a
                          href={whatsappUrl(whats, `Olá! Gostaria de agendar o procedimento ${item.name}.`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onTrack("whatsapp_click", item.id)}
                          className="niche-beauty-service-btn"
                        >
                          <MessageCircle size={14} aria-hidden /> Agendar
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="niche-beauty-section" aria-label="Avaliações do Google">
            <div className="niche-beauty-section-head">
              <span className="niche-beauty-eyebrow">Opinião de Quem Frequenta</span>
              <h2>Avaliações no Google</h2>
              <p>Depoimentos reais deixados por nossos clientes</p>
            </div>

            <div className="grid gap-3">
              {testimonials.slice(0, 3).map((rev: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.author} className="w-8 h-8 rounded-full object-cover border border-pink-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center font-bold text-xs">
                        {rev.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{rev.author}</h4>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {secondary.length > 0 && (
          <section className="niche-beauty-section" aria-label="Links Úteis">
            <span className="niche-beauty-eyebrow">Mais Informações</span>
            <ul className="niche-beauty-links-list">
              {secondary.map((link: PublicLink) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("link_click", link.id)}
                    className="niche-beauty-link-item"
                  >
                    <span>{link.title}</span>
                    <ArrowUpRight size={16} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="niche-beauty-footer">
          {insta && (
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("instagram_click")}
              className="niche-beauty-insta-badge"
            >
              <Instagram size={16} aria-hidden /> @{insta}
            </a>
          )}
          {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={onTrack} />}
          {supplemental}
          <Footer />
        </div>
      </div>
    );
  }
}

