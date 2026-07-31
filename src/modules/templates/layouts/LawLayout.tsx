import type { ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, Landmark, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { whatsappUrl } from "@/lib/whatsapp";

const starterAreas = [
  ["Consultoria jurídica", "Orientação clara para decisões importantes."],
  ["Direito empresarial", "Estratégia e segurança para o seu negócio."],
  ["Direito civil", "Atuação responsável e atenção aos detalhes."],
];

export class LawLayout implements TemplateLayoutRenderer {
  layoutId() { return "law" as const; }
  supports(model: TemplateRenderModel) { return model.template.layout === "law"; }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const areas = products.filter((item) => item.active).slice(0, 6);
    const practiceAreas = areas.length > 0 ? areas.map((item) => [item.name, item.description || "Atendimento estratégico e personalizado.", item.button_url, item.button_label] as const) : starterAreas;
    return <div className="niche-law">
      <header className="niche-law-hero"><img src={bio.cover_url || "/template-assets/law-office-cover.png"} alt="" loading="eager" /><div className="niche-law-overlay" aria-hidden />
        <div className="niche-law-nav"><span><Scale size={16} aria-hidden /> ESCRITÓRIO JURÍDICO</span><button type="button" className="niche-law-share" onClick={onShare}>Compartilhar</button></div>
        <div className="niche-law-copy"><span><Landmark size={14} aria-hidden /> ATUAÇÃO JURÍDICA</span><h1>{bio.display_name}</h1><p>{bio.description || "Orientação estratégica, clara e responsável para cada decisão."}</p><div className="niche-law-trust"><small><ShieldCheck size={14} aria-hidden /> Atendimento reservado</small><small><BriefcaseBusiness size={14} aria-hidden /> Estratégia sob medida</small></div>{whatsapp && <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de agendar uma conversa.")} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> {bio.whatsapp_button_label || "Agendar conversa"} <ArrowUpRight size={16} aria-hidden /></a>}</div>
      </header>
      <section className="niche-law-intro"><p>CONFIANÇA EM CADA ETAPA</p><div><h2>Orientação jurídica com linguagem clara.</h2><span>Seu caso merece atenção, estratégia e uma condução responsável do início ao fim.</span></div></section>
      <section className="niche-law-section" aria-label="Áreas de atuação"><p>ÁREAS DE ATUAÇÃO</p><h2>Como podemos ajudar</h2><div className="niche-law-grid">{practiceAreas.map(([title, description, url, label]) => <article key={title}><Scale size={19} aria-hidden /><h3>{title}</h3><p>{description}</p>{url ? <a href={url} target="_blank" rel="noreferrer">{label || "Conhecer área"}<ArrowUpRight size={14} aria-hidden /></a> : whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre ${title}.`)}`} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}>Falar com especialista<ArrowUpRight size={14} aria-hidden /></a>}</article>)}</div></section>
      <section className="niche-law-cta"><div><span>ATENDIMENTO PERSONALIZADO</span><h2>Vamos conversar sobre o seu caso?</h2><p>Inicie um atendimento com discrição e receba a orientação adequada.</p></div>{whatsapp && <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de iniciar um atendimento jurídico.")} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden /> Iniciar atendimento</a>}</section>
      {links.filter((link) => link.active).length > 0 && <section className="niche-law-section niche-law-links" aria-label="Informações"><p>INFORMAÇÕES IMPORTANTES</p><div>{links.filter((link: PublicLink) => link.active).map((link: PublicLink) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}>{link.title}<ArrowUpRight size={15} aria-hidden /></a>)}</div></section>}
      {supplemental}<Footer />
    </div>;
  }
}
