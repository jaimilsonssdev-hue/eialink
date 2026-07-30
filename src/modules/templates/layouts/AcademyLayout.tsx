import type { ReactNode } from "react";
import { ArrowUpRight, Dumbbell, Instagram, MessageCircle, Sparkles } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";

export class AcademyLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "academy" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "academy";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const instagram = bio.instagram?.replace("@", "");
    const activeItems = products.filter((item) => item.active).slice(0, 6);

    return (
      <div className="niche-academy">
        <header className="niche-academy-hero">
          <img src={bio.cover_url || "/template-assets/academy-gym-cover.png"} alt="" loading="eager" />
          <div className="niche-academy-overlay" aria-hidden />
          <div className="niche-academy-hero-content">
            <span className="niche-academy-kicker"><Dumbbell size={14} aria-hidden /> TREINO COM PROPÓSITO</span>
            <h1>{bio.display_name}</h1>
            <p>{bio.description || "Evolua com um plano feito para a sua rotina."}</p>
            <div className="niche-academy-actions">
              {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Quero conhecer os planos.")}`} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> Agendar aula experimental <ArrowUpRight size={16} aria-hidden /></a>}
              <button type="button" onClick={onShare}>Compartilhar</button>
            </div>
          </div>
        </header>

        {activeItems.length > 0 && <section className="niche-academy-section" aria-label="Planos e serviços">
          <div className="niche-academy-heading"><span>PLANOS E EXPERIÊNCIAS</span><h2>Comece do seu jeito</h2></div>
          <div className="niche-academy-grid">{activeItems.map((item, index) => <article key={item.id} className="niche-academy-card">
            <span className="niche-academy-card-number">0{index + 1}</span>
            <Sparkles size={19} aria-hidden />
            <h3>{item.name}</h3>
            {item.description && <p>{item.description}</p>}
            {item.price !== null && <b>R$ {item.price.toFixed(2).replace(".", ",")}</b>}
            {item.button_url && <a href={item.button_url} target="_blank" rel="noreferrer">{item.button_label}<ArrowUpRight size={14} aria-hidden /></a>}
          </article>)}</div>
        </section>}

        {(instagram || links.length > 0) && <section className="niche-academy-section niche-academy-links" aria-label="Conecte-se">
          <div className="niche-academy-heading"><span>ACOMPANHE DE PERTO</span><h2>Mais da nossa energia</h2></div>
          <div>{instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" onClick={() => onTrack("instagram_click")}><Instagram size={17} aria-hidden /> @{instagram}</a>}{links.filter((link) => link.active).map((link: PublicLink) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}>{link.title}<ArrowUpRight size={15} aria-hidden /></a>)}</div>
        </section>}
        {supplemental}
        <Footer />
      </div>
    );
  }
}
