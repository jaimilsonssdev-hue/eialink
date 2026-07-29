import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  HeartPulse,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";

export class ClinicLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "clinic" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "clinic";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const treatments = products.filter((p) => p.active);
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    return (
      <div className="niche-clinic">
        <header className="niche-clinic-hero">
          <div className="niche-clinic-hero-copy">
            <span className="niche-clinic-eyebrow">
              <Stethoscope size={14} aria-hidden /> Atendimento humano
            </span>
            <h1 className="niche-clinic-name">{bio.display_name}</h1>
            {bio.description && <p className="niche-clinic-lead">{bio.description}</p>}
            <div className="niche-clinic-trust">
              <span>
                <ShieldCheck size={14} aria-hidden /> Ambiente seguro
              </span>
              <span>
                <HeartPulse size={14} aria-hidden /> Cuidado personalizado
              </span>
            </div>
            <div className="niche-clinic-cta-row">
              {whats && (
                <a
                  href={`https://wa.me/${whats}?text=${encodeURIComponent("Olá, gostaria de agendar uma consulta")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="niche-clinic-cta-primary"
                >
                  <CalendarCheck size={18} aria-hidden />
                  Agendar consulta
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
              <p className="niche-clinic-eyebrow">Especialidades</p>
              <h2>Tratamentos oferecidos</h2>
            </div>
            <ul className="niche-clinic-services">
              {treatments.map((item) => (
                <li key={item.id} className="niche-clinic-service">
                  <div className="niche-clinic-service-icon" aria-hidden>
                    <HeartPulse size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3>{item.name}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="niche-clinic-service-meta">
                      {item.price !== null && (
                        <span>A partir de R$ {item.price.toFixed(2).replace(".", ",")}</span>
                      )}
                      {item.button_url && (
                        <a href={item.button_url} target="_blank" rel="noreferrer">
                          {item.button_label} <ArrowUpRight size={14} aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
              href={`https://wa.me/${whats}`}
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
