import type { ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarCheck, Landmark, MessageCircle, Scale, ShieldCheck, Star } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { whatsappUrl } from "@/lib/whatsapp";

const starterAreas = [
  { title: "Consultoria jurídica", description: "Orientação clara para decisões importantes.", imageUrl: null, url: null, label: null },
  { title: "Direito empresarial", description: "Estratégia e segurança para o seu negócio.", imageUrl: null, url: null, label: null },
  { title: "Direito civil", description: "Atuação responsável e atenção aos detalhes.", imageUrl: null, url: null, label: null },
];

export class LawLayout implements TemplateLayoutRenderer {
  layoutId() { return "law" as const; }
  supports(model: TemplateRenderModel) { return model.template.layout === "law"; }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], bookingUrl, onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const areas = products.filter((item) => item.active).slice(0, 6);
    const practiceAreas = areas.length > 0
      ? areas.map((item) => ({
          title: item.name,
          description: item.description || "Atendimento estratégico e personalizado.",
          imageUrl: item.image_url,
          url: item.button_url,
          label: item.button_label,
        }))
      : starterAreas;

    return (
      <div className="niche-law">
        <header className="niche-law-hero">
          <img src={bio.cover_url || "/template-assets/law-office-cover.png"} alt="" loading="eager" />
          <div className="niche-law-overlay" aria-hidden />
          <div className="niche-law-nav">
            <span><Scale size={16} aria-hidden /> ESCRITÓRIO JURÍDICO</span>
            <button type="button" className="niche-law-share" onClick={onShare}>Compartilhar</button>
          </div>
          <div className="niche-law-copy">
            <span><Landmark size={14} aria-hidden /> ATUAÇÃO JURÍDICA</span>
            <h1>{bio.display_name}</h1>
            <p>{bio.description || "Orientação estratégica, clara e responsável para cada decisão."}</p>
            <div className="niche-law-trust">
              <small><Star size={14} className="text-amber-400 fill-amber-400" aria-hidden /> 5.0 no Google</small>
              <small><ShieldCheck size={14} aria-hidden /> Atendimento reservado</small>
              <small><BriefcaseBusiness size={14} aria-hidden /> Estratégia sob medida</small>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-4">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={() => onTrack("booking_click")}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 text-sm transition-all shadow-lg shadow-amber-400/20"
                >
                  <CalendarCheck size={18} aria-hidden /> Agendar Consulta Online
                </a>
              ) : (
                whatsapp && (
                  <a
                    href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de agendar uma consulta.")}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 text-sm transition-all shadow-lg shadow-amber-400/20"
                  >
                    <MessageCircle size={18} aria-hidden /> {bio.whatsapp_button_label || "Agendar consulta"} <ArrowUpRight size={16} aria-hidden />
                  </a>
                )
              )}
              {whatsapp && bookingUrl && (
                <a
                  href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de falar com o escritório.")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-xs"
                >
                  <MessageCircle size={16} aria-hidden /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="niche-law-intro">
          <p>CONFIANÇA EM CADA ETAPA</p>
          <div>
            <h2>Orientação jurídica com linguagem clara e estratégica.</h2>
            <span>Seu caso merece atenção integral, estratégia robusta e condução ética do início ao fim.</span>
          </div>
        </section>

        <section className="niche-law-section" aria-label="Áreas de atuação">
          <p>ÁREAS DE ATUAÇÃO</p>
          <h2>Como podemos ajudar você ou sua empresa</h2>
          <div className="niche-law-grid">
            {practiceAreas.map((area) => (
              <article key={area.title} className="niche-law-card">
                {area.imageUrl && (
                  <div className="h-36 w-full overflow-hidden rounded-xl mb-3">
                    <img src={area.imageUrl} alt={area.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <Scale size={19} aria-hidden />
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                {bookingUrl ? (
                  <a href={bookingUrl} onClick={() => onTrack("booking_click")}>
                    Agendar atendimento <ArrowUpRight size={14} aria-hidden />
                  </a>
                ) : area.url ? (
                  <a href={area.url} target="_blank" rel="noreferrer">
                    {area.label || "Conhecer área"} <ArrowUpRight size={14} aria-hidden />
                  </a>
                ) : (
                  whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre ${area.title}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                    >
                      Falar com especialista <ArrowUpRight size={14} aria-hidden />
                    </a>
                  )
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="niche-law-cta">
          <div>
            <span>ATENDIMENTO PERSONALIZADO</span>
            <h2>Vamos conversar sobre o seu caso?</h2>
            <p>Inicie um atendimento com total discrição e receba a orientação adequada.</p>
          </div>
          {whatsapp && (
            <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Gostaria de iniciar um atendimento jurídico.")} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden /> Iniciar atendimento
            </a>
          )}
        </section>

        {links.filter((link) => link.active).length > 0 && (
          <section className="niche-law-section niche-law-links" aria-label="Informações">
            <p>INFORMAÇÕES IMPORTANTES</p>
            <div>
              {links.filter((link: PublicLink) => link.active).map((link: PublicLink) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => onTrack("link_click", link.id)}>
                  {link.title} <ArrowUpRight size={15} aria-hidden />
                </a>
              ))}
            </div>
          </section>
        )}
        {supplemental}
        <Footer />
      </div>
    );
  }
}
