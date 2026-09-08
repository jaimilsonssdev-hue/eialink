import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
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

/**
 * SpotlightLayout: Design Dark VIP de Alta Conversão.
 * Combina estética noturna moderna, anel neon com brilho elegante,
 * prova social verídica do Google Maps e vitrine visual de procedimentos.
 */
export class SpotlightLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "spotlight" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "spotlight";
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
      <div className="niche-spotlight">
        {/* HERO / CAPA E PERFIL */}
        <header className="niche-spotlight-hero">
          <div className="niche-spotlight-cover-wrapper">
            {bio.cover_url ? (
              <img src={bio.cover_url} alt="" className="niche-spotlight-cover" loading="eager" />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c8?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="niche-spotlight-cover"
                loading="eager"
              />
            )}
            <div className="niche-spotlight-cover-overlay" aria-hidden />
            <button
              type="button"
              onClick={onShare}
              className="niche-spotlight-share-btn"
              aria-label="Compartilhar página"
            >
              Compartilhar
            </button>
          </div>

          <div className="niche-spotlight-profile">
            <div className="niche-spotlight-avatar-ring">
              {bio.avatar_url ? (
                <img src={bio.avatar_url} alt={bio.display_name} className="niche-spotlight-avatar" />
              ) : (
                <div className="niche-spotlight-avatar-fallback">
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* SELOS DE AUTORIDADE COM NOTA REAL DO GOOGLE */}
            <div className="niche-spotlight-badges">
              <span className="niche-spotlight-badge niche-spotlight-badge-glow">
                <Sparkles size={12} aria-hidden /> Atendimento VIP
              </span>
              {rating ? (
                <span className="niche-spotlight-badge niche-spotlight-badge-star">
                  <Star size={13} className="text-amber-400 fill-amber-400" aria-hidden />
                  {rating} no Google {reviewsCount ? `(${reviewsCount} avaliações)` : ""}
                </span>
              ) : null}
            </div>

            <h1 className="niche-spotlight-title">{bio.display_name}</h1>
            {bio.description && <p className="niche-spotlight-lead">{bio.description}</p>}

            {/* INFORMAÇÕES RÁPIDAS DE LOCALIZAÇÃO / HORÁRIO */}
            {(address || openingHours) && (
              <div className="niche-spotlight-meta-row">
                {address && (
                  <span title={address}>
                    <MapPin size={13} className="text-cyan-400" aria-hidden />
                    <span className="truncate max-w-[280px]">{address}</span>
                  </span>
                )}
                {openingHours && (
                  <span>
                    <Clock size={13} className="text-cyan-400" aria-hidden />
                    <span>{openingHours}</span>
                  </span>
                )}
              </div>
            )}

            {/* BARRA DE CONFIANÇA */}
            <div className="niche-spotlight-trust-row">
              <span>
                <ShieldCheck size={14} className="text-cyan-400" aria-hidden /> Procedimentos Certificados
              </span>
              <span>
                <CheckCircle2 size={14} className="text-cyan-400" aria-hidden /> Ficha Verificada
              </span>
            </div>

            {/* BOTÕES DE AÇÃO DE ALTA CONVERSÃO */}
            <div className="niche-spotlight-actions">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={() => onTrack("booking_click")}
                  className="niche-spotlight-cta-primary"
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
                    className="niche-spotlight-cta-primary"
                  >
                    <CalendarCheck size={18} aria-hidden />
                    {bio.whatsapp_button_label || "Agendar no WhatsApp"}
                  </a>
                )
              )}

              {whats && bookingUrl && (
                <a
                  href={whatsappUrl(whats, bio.whatsapp_message || "Olá! Gostaria de tirar algumas dúvidas.")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="niche-spotlight-cta-secondary"
                >
                  <MessageCircle size={18} aria-hidden />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </header>

        {/* VITRINE DE SERVIÇOS EM CARDS MODERNOS */}
        {services.length > 0 && (
          <section className="niche-spotlight-section" aria-label="Procedimentos e Serviços">
            <div className="niche-spotlight-section-head">
              <span className="niche-spotlight-eyebrow">Destaques & Cuidados</span>
              <h2>Procedimentos Especializados</h2>
              <p>Experiência de alto padrão com conforto e excelência</p>
            </div>

            <div className="niche-spotlight-services-grid">
              {services.map((item) => (
                <article key={item.id} className="niche-spotlight-service-card">
                  {item.image_url && (
                    <div className="niche-spotlight-service-media">
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    </div>
                  )}
                  <div className="niche-spotlight-service-body">
                    <div className="niche-spotlight-service-header">
                      <h3>{item.name}</h3>
                      {item.price !== null && (
                        <span className="niche-spotlight-service-price">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="niche-spotlight-service-desc">{item.description}</p>
                    )}
                    <div className="niche-spotlight-service-footer">
                      {bookingUrl ? (
                        <a
                          href={bookingUrl}
                          onClick={() => onTrack("booking_click", item.id)}
                          className="niche-spotlight-service-btn"
                        >
                          <CalendarCheck size={14} aria-hidden /> Agendar
                        </a>
                      ) : whats ? (
                        <a
                          href={whatsappUrl(whats, `Olá! Gostaria de agendar o procedimento ${item.name}.`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onTrack("whatsapp_click", item.id)}
                          className="niche-spotlight-service-btn"
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

        {/* PROVA SOCIAL COM DEPOIMENTOS REAIS DO GOOGLE MAPS */}
        {testimonials.length > 0 && (
          <section className="niche-spotlight-section" aria-label="Avaliações do Google">
            <div className="niche-spotlight-section-head">
              <span className="niche-spotlight-eyebrow">Opinião de Quem Frequenta</span>
              <h2>Avaliações no Google</h2>
              <p>Satisfação e carinho registrados por clientes reais</p>
            </div>

            <div className="niche-spotlight-testimonials-grid">
              {testimonials.slice(0, 3).map((rev: any, idx: number) => (
                <div key={idx} className="niche-spotlight-testimonial-card">
                  <div className="flex items-center gap-3 mb-2.5">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.author} className="w-9 h-9 rounded-full object-cover border border-cyan-400/40" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-400/40 flex items-center justify-center font-bold text-xs">
                        {rev.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 leading-tight">{rev.author}</h4>
                      <div className="flex text-amber-400 text-xs mt-0.5">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{rev.text}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINKS ÚTEIS E REDES SOCIAIS */}
        {secondary.length > 0 && (
          <section className="niche-spotlight-section" aria-label="Mais Informações">
            <span className="niche-spotlight-eyebrow">Links Rápidos</span>
            <ul className="niche-spotlight-links-list">
              {secondary.map((link: PublicLink) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("link_click", link.id)}
                    className="niche-spotlight-link-item"
                  >
                    <span>{link.title}</span>
                    <ArrowUpRight size={16} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* RODAPÉ */}
        <div className="niche-spotlight-footer">
          {insta && (
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("instagram_click")}
              className="niche-spotlight-insta-badge"
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
