import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  Instagram,
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
              <span className="niche-beauty-badge niche-beauty-badge-star">
                <Star size={13} className="text-amber-400 fill-amber-400" aria-hidden /> 5.0 no Google
              </span>
            </div>

            <h1 className="niche-beauty-title">{bio.display_name}</h1>
            {bio.description && <p className="niche-beauty-lead">{bio.description}</p>}

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

