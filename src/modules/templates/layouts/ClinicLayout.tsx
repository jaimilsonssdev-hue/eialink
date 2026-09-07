import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock,
  HeartPulse,
  Instagram,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

export class ClinicLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "clinic" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "clinic";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], bookingUrl, supplemental } = ctx;
    const treatments = products.filter((p) => p.active);
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");

    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating ?? 5.0;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    return (
      <div className="niche-clinic">
        <header className="niche-clinic-hero">
          <div className="niche-clinic-hero-copy">
            <span className="niche-clinic-eyebrow">
              <Stethoscope size={14} aria-hidden /> Atendimento humano & acolhedor
            </span>
            <h1 className="niche-clinic-name">{bio.display_name}</h1>
            {bio.description && <p className="niche-clinic-lead">{bio.description}</p>}
            <div className="niche-clinic-trust">
              <span>
                <Star size={14} className="text-amber-400 fill-amber-400" aria-hidden />
                {rating} no Google {reviewsCount ? `(${reviewsCount} avaliações)` : ""}
              </span>
              <span>
                <ShieldCheck size={14} aria-hidden /> Ambiente seguro
              </span>
              <span>
                <HeartPulse size={14} aria-hidden /> Cuidado personalizado
              </span>
            </div>
            {(address || openingHours) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                {address && (
                  <span className="inline-flex items-center gap-1 max-w-[280px] truncate" title={address}>
                    <MapPin size={13} className="text-teal-600 flex-shrink-0" aria-hidden />
                    <span className="truncate">{address}</span>
                  </span>
                )}
                {openingHours && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-teal-600 flex-shrink-0" aria-hidden />
                    <span>{openingHours}</span>
                  </span>
                )}
              </div>
            )}
            <div className="niche-clinic-cta-row">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={() => onTrack("booking_click")}
                  className="niche-clinic-cta-primary"
                >
                  <CalendarCheck size={18} aria-hidden />
                  Agendar Horário Online
                </a>
              ) : (
                whats && (
                  <a
                    href={whatsappUrl(whats, bio.whatsapp_message || "Olá, gostaria de agendar uma consulta")}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="niche-clinic-cta-primary"
                  >
                    <CalendarCheck size={18} aria-hidden />
                    {bio.whatsapp_button_label || "Agendar consulta"}
                  </a>
                )
              )}
              {whats && bookingUrl && (
                <a
                  href={whatsappUrl(whats, bio.whatsapp_message || "Olá! Gostaria de tirar algumas dúvidas.")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="niche-clinic-cta-secondary"
                >
                  <MessageCircle size={18} aria-hidden />
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={onShare}
                className="niche-clinic-cta-ghost"
                aria-label="Compartilhar página"
              >
                Compartilhar
              </button>
            </div>
          </div>
          <div className="niche-clinic-hero-media">
            {bio.cover_url ? (
              <img src={bio.cover_url} alt="" loading="eager" />
            ) : (
              <img src="/template-assets/clinic-demo-cover.png" alt="" loading="eager" />
            )}
          </div>
        </header>

        {treatments.length > 0 && (
          <section className="niche-clinic-section" aria-label="Especialidades">
            <div className="niche-clinic-section-head">
              <p className="niche-clinic-eyebrow">Especialidades & Procedimentos</p>
              <h2>Tratamentos oferecidos</h2>
            </div>
            <ul className="niche-clinic-services">
              {treatments.map((item) => (
                <li key={item.id} className="niche-clinic-service">
                  {item.image_url ? (
                    <div className="niche-clinic-service-media">
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                    </div>
                  ) : (
                    <div className="niche-clinic-service-icon" aria-hidden>
                      <HeartPulse size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3>{item.name}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="niche-clinic-service-meta">
                      {item.price !== null && (
                        <span>A partir de R$ {item.price.toFixed(2).replace(".", ",")}</span>
                      )}
                      {bookingUrl ? (
                        <a href={bookingUrl} onClick={() => onTrack("booking_click", item.id)}>
                          Agendar <ArrowUpRight size={14} aria-hidden />
                        </a>
                      ) : item.button_url ? (
                        <a href={item.button_url} target="_blank" rel="noreferrer">
                          {item.button_label} <ArrowUpRight size={14} aria-hidden />
                        </a>
                      ) : whats ? (
                        <a
                          href={whatsappUrl(whats, `Olá! Gostaria de agendar o atendimento para ${item.name}.`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onTrack("whatsapp_click", item.id)}
                        >
                          Agendar <ArrowUpRight size={14} aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="niche-clinic-section" aria-label="Avaliações do Google">
            <div className="niche-clinic-section-head">
              <p className="niche-clinic-eyebrow">Opinião de Pacientes</p>
              <h2>Avaliações no Google</h2>
            </div>

            <div className="grid gap-3">
              {testimonials.slice(0, 3).map((rev: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.author} className="w-8 h-8 rounded-full object-cover border border-teal-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
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
          <section className="niche-clinic-section" aria-label="Informações">
            <p className="niche-clinic-eyebrow">Informações</p>
            <ul className="niche-clinic-links">
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

        <div className="niche-clinic-footer">
          {insta && (
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("instagram_click")}
              className="niche-clinic-insta"
            >
              <Instagram size={14} aria-hidden /> @{insta}
            </a>
          )}
          {whats && (
            <a
              href={whatsappUrl(whats, bio.whatsapp_message)}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("whatsapp_click")}
              className="niche-clinic-whats"
            >
              <MessageCircle size={14} aria-hidden /> Falar agora
            </a>
          )}
        </div>

        {bio.pix_key && (
          <div className="niche-clinic-pix">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {supplemental}
        <Footer />
      </div>
    );
  }
}
