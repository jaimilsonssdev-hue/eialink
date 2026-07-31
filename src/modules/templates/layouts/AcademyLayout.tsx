import type { ReactNode } from "react";
import { ArrowUpRight, Check, Dumbbell, Instagram, MapPin, MessageCircle, Sparkles } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { whatsappUrl } from "@/lib/whatsapp";

const starterPlans = [
  { name: "Aula experimental", description: "Conheça a estrutura e encontre o treino ideal.", price: "Primeira aula" },
  { name: "Plano evolução", description: "Treino acompanhado para sua melhor versão.", price: "A partir de R$ 99" },
  { name: "Personal training", description: "Acompanhamento individual para acelerar resultados.", price: "Sob consulta" },
];

export class AcademyLayout implements TemplateLayoutRenderer {
  layoutId() { return "academy" as const; }
  supports(model: TemplateRenderModel) { return model.template.layout === "academy"; }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const instagram = bio.instagram?.replace("@", "");
    const activeItems = products.filter((item) => item.active).slice(0, 6);
    const plans = activeItems.length > 0
      ? activeItems.map((item) => ({ name: item.name, description: item.description || "Uma experiência pensada para a sua evolução.", price: item.price !== null ? `R$ ${item.price.toFixed(2).replace(".", ",")}` : "Saiba mais", url: item.button_url, label: item.button_label }))
      : starterPlans;

    return <div className="niche-academy">
      <header className="niche-academy-hero">
        <img src={bio.cover_url || "/template-assets/academy-gym-cover.png"} alt="" loading="eager" />
        <div className="niche-academy-overlay" aria-hidden />
        <div className="niche-academy-topline"><span><Dumbbell size={15} aria-hidden /> MOVIMENTO QUE TRANSFORMA</span><button type="button" onClick={onShare}>Compartilhar</button></div>
        <div className="niche-academy-hero-content">
          <span className="niche-academy-kicker">ACADEMIA • TREINO • BEM-ESTAR</span>
          <h1>{bio.display_name}</h1>
          <p>{bio.description || "Treinos que respeitam o seu ritmo e levam você mais longe."}</p>
          <div className="niche-academy-proof"><span><Check size={14} aria-hidden /> Treino para todos os níveis</span><span><Check size={14} aria-hidden /> Atendimento próximo</span></div>
          <div className="niche-academy-actions">
            {whatsapp && <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Quero agendar uma aula experimental.")} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> {bio.whatsapp_button_label || "Agendar aula experimental"} <ArrowUpRight size={16} aria-hidden /></a>}
            <a href="#planos">Conhecer planos</a>
          </div>
        </div>
      </header>

      <section className="niche-academy-numbers" aria-label="Diferenciais"><div><b>+500</b><span>alunos em movimento</span></div><div><b>7 dias</b><span>para treinar na semana</span></div><div><b>100%</b><span>foco na sua evolução</span></div></section>
      <section id="planos" className="niche-academy-section" aria-label="Planos e experiências">
        <div className="niche-academy-heading"><span>ESCOLHA SUA JORNADA</span><h2>Planos para evoluir com constância</h2><p>Comece pelo que faz sentido para a sua rotina hoje.</p></div>
        <div className="niche-academy-grid">{plans.map((item, index) => <article key={`${item.name}-${index}`} className="niche-academy-card">
          <span className="niche-academy-card-number">0{index + 1}</span><Sparkles size={19} aria-hidden /><h3>{item.name}</h3><p>{item.description}</p><b>{item.price}</b>
          {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.label || "Quero saber mais"}<ArrowUpRight size={14} aria-hidden /></a> : whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Quero saber mais sobre ${item.name}.`)}`} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}>Quero saber mais<ArrowUpRight size={14} aria-hidden /></a>}
        </article>)}</div>
      </section>
      <section className="niche-academy-section niche-academy-visit" aria-label="Visite a academia"><div><span>PRONTO PARA COMEÇAR?</span><h2>Seu próximo treino começa agora.</h2><p>Fale com a equipe, tire suas dúvidas e marque sua primeira experiência.</p></div>{whatsapp && <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Quero começar a treinar.")} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> Falar com a academia</a>}</section>
      {(instagram || links.length > 0) && <section className="niche-academy-section niche-academy-links" aria-label="Conecte-se"><div className="niche-academy-heading"><span>ACOMPANHE DE PERTO</span><h2>Mais energia todos os dias</h2></div><div>{instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" onClick={() => onTrack("instagram_click")}><Instagram size={17} aria-hidden /> @{instagram}</a>}{links.filter((link) => link.active).map((link: PublicLink) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}>{link.title}<ArrowUpRight size={15} aria-hidden /></a>)}</div></section>}
      {supplemental}<Footer />
    </div>;
  }
}
