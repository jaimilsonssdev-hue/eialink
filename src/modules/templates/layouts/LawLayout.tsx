import type { ReactNode } from "react";
import { ArrowUpRight, Landmark, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";

export class LawLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "law" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "law";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const areas = products.filter((item) => item.active).slice(0, 6);
    return (
      <div className="niche-law">
        <header className="niche-law-hero">
          <img src={bio.cover_url || "/template-assets/law-office-cover.png"} alt="" loading="eager" />
          <div className="niche-law-overlay" aria-hidden />
          <button type="button" className="niche-law-share" onClick={onShare}>Compartilhar</button>
          <div className="niche-law-copy"><span><Scale size={14} aria-hidden /> ATUAÇÃO JURÍDICA</span><h1>{bio.display_name}</h1><p>{bio.description || "Orientação estratégica, clara e responsável para cada decisão."}</p><div className="niche-law-trust"><small><ShieldCheck size={14} aria-hidden /> Atendimento reservado</small><small><Landmark size={14} aria-hidden /> Estratégia e confiança</small></div>{whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de agendar uma conversa.")}`} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> Agendar conversa <ArrowUpRight size={16} aria-hidden /></a>}</div>
        </header>
        {areas.length > 0 && <section className="niche-law-section" aria-label="Áreas de atuação"><p>ÁREAS DE ATUAÇÃO</p><h2>Conheça como podemos ajudar</h2><div className="niche-law-grid">{areas.map((item) => <article key={item.id}><Scale size={19} aria-hidden /><h3>{item.name}</h3>{item.description && <p>{item.description}</p>}{item.button_url && <a href={item.button_url} target="_blank" rel="noreferrer">{item.button_label}<ArrowUpRight size={14} aria-hidden /></a>}</article>)}</div></section>}
        {links.filter((link) => link.active).length > 0 && <section className="niche-law-section niche-law-links" aria-label="Informações"><p>INFORMAÇÕES IMPORTANTES</p><div>{links.filter((link) => link.active).map((link: PublicLink) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}>{link.title}<ArrowUpRight size={15} aria-hidden /></a>)}</div></section>}
        {supplemental}
        <Footer />
      </div>
    );
  }
}
