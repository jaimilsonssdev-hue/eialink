import type { ReactNode } from "react";
import { ArrowUpRight, CalendarCheck, Check, Clock, Dumbbell, Instagram, MapPin, MessageCircle, Sparkles, Star } from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { whatsappUrl } from "@/lib/whatsapp";

type AcademyPlan = {
  name: string;
  description: string;
  price: string;
  imageUrl?: string | null;
  url?: string | null;
  label?: string | null;
};

const starterPlans: AcademyPlan[] = [
  { name: "Aula experimental", description: "Conheça a estrutura e encontre o treino ideal.", price: "Primeira aula grátis", imageUrl: null },
  { name: "Plano evolução", description: "Treino acompanhado para sua melhor versão.", price: "A partir de R$ 99/mês", imageUrl: null },
  { name: "Personal training", description: "Acompanhamento individual para acelerar resultados.", price: "Sob consulta", imageUrl: null },
];

export class AcademyLayout implements TemplateLayoutRenderer {
  layoutId() { return "academy" as const; }
  supports(model: TemplateRenderModel) { return model.template.layout === "academy"; }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, products = [], bookingUrl, onShare, onTrack, supplemental } = ctx;
    const whatsapp = bio.whatsapp?.replace(/\D/g, "");
    const instagram = bio.instagram?.replace("@", "");
    const activeItems = products.filter((item) => item.active).slice(0, 6);
    const plans: AcademyPlan[] = activeItems.length > 0
      ? activeItems.map((item) => ({
          name: item.name,
          description: item.description || "Uma experiência pensada para a sua evolução.",
          price: item.price !== null ? `R$ ${item.price.toFixed(2).replace(".", ",")}` : "Saiba mais",
          imageUrl: item.image_url,
          url: item.button_url,
          label: item.button_label,
        }))
      : starterPlans;
    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    return (
      <div className="niche-academy">
        <header className="niche-academy-hero">
          <img src={bio.cover_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"} alt="" loading="eager" />
          <div className="niche-academy-overlay" aria-hidden />
          <div className="niche-academy-topline">
            <span><Dumbbell size={15} aria-hidden /> PERFORMANCE & BEM-ESTAR</span>
            <button type="button" onClick={onShare}>Compartilhar</button>
          </div>
          <div className="niche-academy-hero-content">
            <span className="niche-academy-kicker">ACADEMIA • TREINO • RESULTADOS</span>
            <h1>{bio.display_name}</h1>
            <p>{bio.description || "Treinos que respeitam o seu ritmo e levam você mais longe."}</p>
            {(address || openingHours) && (
              <div className="flex flex-wrap gap-2 text-xs text-emerald-200/90 my-2">
                {address && (
                  <span className="inline-flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <MapPin size={12} className="text-emerald-400" /> {address}
                  </span>
                )}
                {openingHours && (
                  <span className="inline-flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <Clock size={12} className="text-emerald-400" /> {openingHours}
                  </span>
                )}
              </div>
            )}
            <div className="niche-academy-proof">
              {rating ? (
                <span><Star size={14} className="text-amber-400 fill-amber-400" aria-hidden /> {rating} no Google {reviewsCount ? `(${reviewsCount})` : ""}</span>
              ) : (
                <span><Check size={14} aria-hidden /> Atendimento Verificado</span>
              )}
              <span><Check size={14} aria-hidden /> Treino para todos os níveis</span>
              <span><Check size={14} aria-hidden /> Atendimento próximo</span>
            </div>
            <div className="niche-academy-actions">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={() => onTrack("booking_click")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2.5 text-sm transition-all shadow-lg shadow-emerald-400/25"
                >
                  <CalendarCheck size={18} aria-hidden /> Agendar Aula Experimental Online
                </a>
              ) : (
                whatsapp && (
                  <a
                    href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Quero agendar uma aula experimental.")}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("whatsapp_click")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2.5 text-sm transition-all shadow-lg shadow-emerald-400/25"
                  >
                    <MessageCircle size={18} aria-hidden /> {bio.whatsapp_button_label || "Agendar aula experimental"} <ArrowUpRight size={16} aria-hidden />
                  </a>
                )
              )}
              {whatsapp && bookingUrl && (
                <a
                  href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Quero saber mais sobre a academia.")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 text-white px-3 py-2 text-xs"
                >
                  <MessageCircle size={16} aria-hidden /> WhatsApp
                </a>
              )}
              <a href="#planos">Conhecer planos</a>
            </div>
          </div>
        </header>

        <section className="niche-academy-numbers" aria-label="Diferenciais">
          <div><b>+500</b><span>alunos em movimento</span></div>
          <div><b>7 dias</b><span>para treinar na semana</span></div>
          <div><b>100%</b><span>foco na sua evolução</span></div>
        </section>

        <section id="planos" className="niche-academy-section" aria-label="Planos e experiências">
          <div className="niche-academy-heading">
            <span>ESCOLHA SUA JORNADA</span>
            <h2>Planos para evoluir com constância</h2>
            <p>Comece pelo que faz sentido para a sua rotina hoje.</p>
          </div>
          <div className="niche-academy-grid">
            {plans.map((item, index) => (
              <article key={`${item.name}-${index}`} className="niche-academy-card">
                {item.imageUrl && (
                  <div className="h-36 w-full overflow-hidden rounded-xl mb-3">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <span className="niche-academy-card-number">0{index + 1}</span>
                <Sparkles size={19} aria-hidden />
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <b>{item.price}</b>
                {bookingUrl ? (
                  <a href={bookingUrl} onClick={() => onTrack("booking_click")}>
                    Agendar agora <ArrowUpRight size={14} aria-hidden />
                  </a>
                ) : item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.label || "Quero saber mais"} <ArrowUpRight size={14} aria-hidden />
                  </a>
                ) : (
                  whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Quero saber mais sobre ${item.name}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                    >
                      Quero saber mais <ArrowUpRight size={14} aria-hidden />
                    </a>
                  )
                )}
              </article>
            ))}
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="niche-academy-section my-6" aria-label="Avaliações do Google">
            <div className="niche-academy-heading">
              <span>QUEM TREINA, RECOMENDA</span>
              <h2>Avaliações no Google</h2>
            </div>
            <div className="grid gap-3 mt-4">
              {testimonials.slice(0, 3).map((rev: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 shadow-xs">
                  <div className="flex items-center gap-3 mb-2">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.author} className="w-8 h-8 rounded-full object-cover border border-emerald-400/40" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {rev.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{rev.author}</h4>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="niche-academy-section niche-academy-visit" aria-label="Visite a academia">
          <div>
            <span>PRONTO PARA COMEÇAR?</span>
            <h2>Seu próximo treino começa agora.</h2>
            <p>Fale com a equipe, tire suas dúvidas e marque sua primeira experiência.</p>
          </div>
          {whatsapp && (
            <a href={whatsappUrl(whatsapp, bio.whatsapp_message || "Olá! Quero começar a treinar.")} target="_blank" rel="noreferrer" onClick={() => onTrack("whatsapp_click")}>
              <MessageCircle size={18} aria-hidden /> Falar com a academia
            </a>
          )}
        </section>

        {(instagram || links.length > 0) && (
          <section className="niche-academy-section niche-academy-links" aria-label="Conecte-se">
            <div className="niche-academy-heading">
              <span>ACOMPANHE DE PERTO</span>
              <h2>Mais energia todos os dias</h2>
            </div>
            <div>
              {instagram && (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" onClick={() => onTrack("instagram_click")}>
                  <Instagram size={17} aria-hidden /> @{instagram}
                </a>
              )}
              {links.filter((link) => link.active).map((link: PublicLink) => (
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
