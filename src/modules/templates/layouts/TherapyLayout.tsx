import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Brain,
  CalendarCheck,
  Check,
  HeartHandshake,
  Instagram,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";

const starterServices = [
  ["Psicoterapia individual", "Um espaço de escuta, autoconhecimento e cuidado com o seu tempo."],
  ["Atendimento online", "Acolhimento profissional onde você estiver, com a mesma presença."],
  ["Acompanhamento terapêutico", "Caminhos possíveis para viver com mais clareza e bem-estar."],
] as const;

export class TherapyLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "therapy" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "therapy";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], bookingUrl, onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const instagram = bio.instagram?.replace("@", "");
    const bookingHref = bookingUrl || (whatsapp
      ? whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de agendar uma conversa.")
      : undefined);
    const activeServices = products.filter((item) => item.active).slice(0, 6);
    const services = activeServices.length > 0
      ? activeServices.map((item) => [item.name, item.description || "Um atendimento cuidadoso, respeitoso e pensado para você.", item.button_url, item.button_label] as const)
      : starterServices;

    return (
      <div className="niche-therapy">
        <header className="niche-therapy-hero">
          <img src={bio.cover_url || "/template-assets/therapy-cover-serenity.png"} alt="" loading="eager" />
          <div className="niche-therapy-overlay" aria-hidden />
          <div className="niche-therapy-topline">
            <span><HeartHandshake size={16} aria-hidden /> CUIDADO QUE ACOLHE</span>
            <button type="button" onClick={onShare}>Compartilhar</button>
          </div>
          <div className="niche-therapy-hero-copy">
            <p><Brain size={15} aria-hidden /> TERAPIA • PSICOLOGIA • BEM-ESTAR</p>
            <h1>{bio.display_name}</h1>
            <span>{bio.description || "Um espaço seguro para você se escutar com mais gentileza."}</span>
            <div className="niche-therapy-trust">
              <small><ShieldCheck size={14} aria-hidden /> Escuta qualificada</small>
              <small><Check size={14} aria-hidden /> Atendimento personalizado</small>
            </div>
            {bookingHref && (
              <a
                href={bookingHref}
                target={bookingUrl ? undefined : "_blank"}
                rel={bookingUrl ? undefined : "noreferrer"}
                onClick={() => onTrack(bookingUrl ? "booking_click" : "whatsapp_click")}
                className="niche-therapy-primary-action"
              >
                <CalendarCheck size={18} aria-hidden />
                {bookingUrl ? "Agendar uma conversa" : bio.whatsapp_button_label || "Falar pelo WhatsApp"}
                <ArrowUpRight size={16} aria-hidden />
              </a>
            )}
          </div>
        </header>

        <section className="niche-therapy-intro" aria-label="Sobre o atendimento">
          <p>SEU MOMENTO IMPORTA</p>
          <h2>Um encontro para olhar com mais cuidado para a sua história.</h2>
          <span>Com acolhimento, ética e respeito ao seu ritmo, cada conversa pode abrir espaço para novos caminhos.</span>
        </section>

        <section className="niche-therapy-section" aria-label="Formas de cuidado">
          <div className="niche-therapy-heading"><p>COMO POSSO TE ACOMPANHAR</p><h2>Formas de cuidado</h2></div>
          <div className="niche-therapy-grid">
            {services.map(([title, description, url, label], index) => (
              <article key={title}>
                <span className="niche-therapy-service-icon"><Brain size={20} aria-hidden /></span>
                <small>0{index + 1}</small>
                <h3>{title}</h3>
                <p>{description}</p>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">{label || "Saiba mais"}<ArrowUpRight size={14} aria-hidden /></a>
                ) : whatsapp ? (
                  <a href={whatsappUrl(whatsapp, `Olá! Gostaria de saber mais sobre ${title}.`)} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}>Quero saber mais<ArrowUpRight size={14} aria-hidden /></a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {links.filter((link) => link.active).length > 0 && (
          <section className="niche-therapy-section niche-therapy-links" aria-label="Informações e links">
            <div className="niche-therapy-heading"><p>INFORMAÇÕES</p><h2>Conheça meu trabalho</h2></div>
            <div>{links.filter((link: PublicLink) => link.active).map((link: PublicLink) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}><span>{link.title}</span><ArrowUpRight size={16} aria-hidden /></a>
            ))}</div>
          </section>
        )}

        <section className="niche-therapy-cta" aria-label="Agendamento">
          <div><p>VAMOS CONVERSAR?</p><h2>O primeiro passo pode ser uma conversa tranquila.</h2><span>Entre em contato para tirar dúvidas e conhecer as possibilidades de atendimento.</span></div>
          {whatsapp && <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de agendar uma conversa.")} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}><MessageCircle size={18} aria-hidden /> Falar pelo WhatsApp</a>}
        </section>

        <div className="niche-therapy-footer-links">
          {instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" onClick={() => onTrack("instagram_click")}><Instagram size={15} aria-hidden /> @{instagram}</a>}
          {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={onTrack} />}
        </div>
        {supplemental}
        <Footer />
      </div>
    );
  }
}
