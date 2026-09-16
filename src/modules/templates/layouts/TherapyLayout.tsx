import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Heart,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";

/**
 * TherapyLayout: Modelo Exclusivo de Alto Padrão para Psicólogos, Terapeutas & Saúde Mental.
 * 
 * Design refinado, acolhedor, sereno e de extrema empatia:
 * - Ambient glow em tons suaves de lavanda e sálvia
 * - Topbar com "Espaço Seguro &middot; Cuidado Humanizado &middot; Sigilo CRP"
 * - Capa relaxante com avatar acolhedor
 * - Grid de 4 pilares do atendimento terapêutico
 * - Vitrine de abordagens e áreas de atuação com valores e agendamento
 * - Prova social ética e acolhedora
 * - Card de localização do consultório com rota no Google Maps
 * - Botão flutuante suave no WhatsApp
 */
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
    const phone = (bio as any).phone?.replace(/\D/g, "");

    const activeServices = products.filter((item) => item.active);
    const secondary = links.filter((l) => l.active);

    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    const vipBadge = socialData.vip_badge || "Espaço Seguro de Acolhimento & Saúde Mental";
    const differentialsTitle = socialData.differentials_title || "Pilares do Nosso Atendimento";
    const differentials = Array.isArray(socialData.differentials) && socialData.differentials.length > 0
      ? socialData.differentials
      : [
          { title: "Sigilo & Ética (CRP)", desc: "Ambiente seguro e confidencialidade assegurada por lei e pelo código de ética", icon: "shield" },
          { title: "Escuta Acolhedora", desc: "Atendimento empático, sem julgamentos e focado no seu bem-estar", icon: "heart" },
          { title: "Presencial & Online", desc: "Flexibilidade para realizar sua sessão onde você se sentir mais confortável", icon: "check" },
          { title: "Abordagem Científica", desc: "Técnicas baseadas em evidências para o seu autoconhecimento e evolução", icon: "sparkles" },
        ];

    const encodedAddress = address ? encodeURIComponent(address) : null;
    const mapsLink = encodedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : null;

    const defaultCover =
      bio.cover_url ||
      "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&w=1200&q=80";

    const defaultWaMessage =
      bio.whatsapp_message ||
      `Olá! Gostaria de agendar uma primeira sessão de conversa com ${bio.display_name}.`;

    return (
      <main className="relative min-h-screen overflow-x-hidden text-foreground selection:bg-purple-500 selection:text-white pb-20 sm:pb-12 bg-gradient-to-b from-purple-950/20 via-background to-background">
        {/* ILUMINAÇÃO AMBIENTE RADIAL EM TONS LAVANDA / VIOLETA SUAVE */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-40 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 45% at 50% 0%, color-mix(in oklab, #a855f7 20%, transparent), transparent 70%), repeating-linear-gradient(115deg, transparent 0 40px, color-mix(in oklab, #8b5cf6 3%, transparent) 40px 41px)",
          }}
        />

        {/* TOPBAR TRANSLÚCIDA COM BOTÃO COMPARTILHAR */}
        <header className="max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Consultório &middot; Escuta Terapêutica</span>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card/70 backdrop-blur-md text-foreground border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-sm active:scale-95 cursor-pointer"
            aria-label="Compartilhar página"
          >
            <span>Compartilhar</span>
          </button>
        </header>

        {/* HERO SECTION ACOLHEDORA */}
        <section className="relative px-4 sm:px-6 pt-4 pb-10 sm:pb-14 text-center max-w-5xl mx-auto">
          {/* BANNER DE CAPA SUAVE */}
          <div className="relative w-full h-44 sm:h-64 rounded-3xl overflow-hidden border border-border/80 shadow-xl mb-6">
            <img
              src={defaultCover}
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
          </div>

          {/* AVATAR COM GLOW SUAVE */}
          <div className="relative mx-auto -mt-20 sm:-mt-24 flex items-center justify-center max-w-xs mb-4">
            <div className="absolute h-40 w-40 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />
            {bio.avatar_url ? (
              <img
                src={bio.avatar_url}
                alt={bio.display_name}
                width={200}
                height={200}
                className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover shadow-2xl border-4 border-background ring-4 ring-purple-500/30 transition-transform hover:scale-105 duration-300"
                loading="eager"
              />
            ) : (
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-card border-4 border-background ring-4 ring-purple-500/30 shadow-2xl flex items-center justify-center text-purple-500 font-black text-3xl sm:text-4xl">
                {bio.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* BADGES SUPERIORES */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1 text-xs font-bold tracking-wide text-purple-700 dark:text-purple-300 uppercase shadow-xs">
              <Brain className="h-3.5 w-3.5 text-purple-500" />
              <span>{vipBadge}</span>
            </span>

            {rating && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-500 shadow-xs">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>
                  {rating} no Google {reviewsCount ? `(${reviewsCount})` : ""}
                </span>
              </span>
            )}
          </div>

          {/* TÍTULO PRINCIPAL */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto text-foreground font-serif">
            {bio.display_name}
          </h1>

          {/* DESCRIÇÃO */}
          {bio.description && (
            <p className="mt-3.5 max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              {bio.description}
            </p>
          )}

          {/* ENDEREÇO & HORÁRIO */}
          {(address || openingHours) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {address && (
                <span className="inline-flex items-center gap-1 bg-card/60 border border-border/80 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="truncate max-w-[280px]">{address}</span>
                </span>
              )}
              {openingHours && (
                <span className="inline-flex items-center gap-1 bg-card/60 border border-border/80 px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>{openingHours}</span>
                </span>
              )}
            </div>
          )}

          {/* BOTÕES DE AÇÃO HERO DE ALTA CONVERSÃO */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                onClick={() => onTrack("booking_click")}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 text-sm sm:text-base font-bold uppercase shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)] transition-all active:scale-[0.98]"
              >
                <CalendarCheck className="h-5 w-5" />
                <span>Agendar Sessão Online</span>
              </a>
            ) : (
              whatsapp && (
                <a
                  href={whatsappUrl(whatsapp, defaultWaMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 text-sm sm:text-base font-bold uppercase shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)] transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{bio.whatsapp_button_label || "Falar com a Terapeuta"}</span>
                </a>
              )
            )}

            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("instagram_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-purple-500/60 hover:bg-card active:scale-[0.98]"
              >
                <Instagram className="h-5 w-5 text-pink-500" />
                <span>Instagram</span>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={() => onTrack("phone_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-purple-500/60 hover:bg-card active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-purple-500" />
                <span>Ligar</span>
              </a>
            )}
          </div>
        </section>

        {/* 4 PILARES DO ATENDIMENTO TERAPÊUTICO */}
        <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              {differentialsTitle}
            </h2>
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-purple-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {differentials.slice(0, 4).map((diff: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-500">
                  {diff.icon === "shield" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : diff.icon === "heart" ? (
                    <HeartHandshake className="h-5 w-5" />
                  ) : diff.icon === "check" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : diff.icon === "badge" ? (
                    <BadgeCheck className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {diff.title}
                </span>
                {diff.desc && (
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {diff.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* VITRINE DE ABORDAGENS & SESSÕES */}
        {activeServices.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Áreas de Atuação
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-serif mt-1">
                Serviços &amp; Acolhimento
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-purple-500" />
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Processos psicoterapêuticos pensados para a sua demanda individual
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeServices.map((item) => (
                <article
                  key={item.id}
                  className="group relative rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-[0_16px_36px_-15px_rgba(168,85,247,0.35)] flex flex-col justify-between"
                >
                  <div>
                    {item.image_url ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3.5 bg-black/20">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-500 mb-3.5 transition-transform group-hover:scale-110 duration-300">
                        <HeartHandshake className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-purple-500 transition-colors">
                        {item.name}
                      </h3>
                      {item.price !== null && (
                        <span className="shrink-0 text-xs font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    {bookingUrl ? (
                      <a
                        href={bookingUrl}
                        onClick={() => onTrack("booking_click", item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase py-2.5 px-3 transition-colors shadow-sm"
                      >
                        <CalendarCheck className="h-3.5 w-3.5" />
                        <span>Agendar Sessão</span>
                      </a>
                    ) : whatsapp ? (
                      <a
                        href={whatsappUrl(
                          whatsapp,
                          `Olá! Gostaria de informações sobre o atendimento de ${item.name} com ${bio.display_name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("whatsapp_click", item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-600 hover:text-white text-foreground text-xs font-bold uppercase py-2.5 px-3 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-purple-500 group-hover:text-white" />
                        <span>Conversar no WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÕES COMPLEMENTARES (SOBRE A TERAPEUTA, HISTÓRIA, VÍDEOS) */}
        {supplemental}

        {/* PROVA SOCIAL ÉTICA & DEPOIMENTOS */}
        {testimonials.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Experiências
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-serif mt-1">
                Relatos de Acolhimento
              </h2>
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.slice(0, 4).map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-purple-200/50 dark:border-purple-500/20 bg-card/80 backdrop-blur-md p-5 space-y-2 shadow-sm"
                >
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-xs italic text-muted-foreground leading-relaxed">
                    &ldquo;{t.comment || t.text}&rdquo;
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {t.name || t.author || "Paciente"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LOCALIZAÇÃO GEOGRÁFICA COM GOOGLE MAPS */}
        {(address || openingHours) && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-500 mx-auto mb-3">
                <MapPin className="h-6 w-6" />
              </span>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-foreground">
                Consultório Presencial
              </h2>

              {address && (
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {address}
                </p>
              )}

              {openingHours && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/60">
                  <Clock className="h-3.5 w-3.5 text-purple-500" />
                  <span>{openingHours}</span>
                </div>
              )}

              {mapsLink && (
                <div className="mt-5">
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/50 bg-purple-500/10 px-5 py-3 text-xs font-bold uppercase transition-colors hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-400"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Ver no Google Maps</span>
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* LINKS SECUNDÁRIOS */}
        {secondary.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-8 max-w-md mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-3">
              Links Rápidos
            </h3>
            <div className="space-y-2">
              {secondary.map((link: PublicLink) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("link_click", link.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md hover:border-purple-500/50 text-foreground text-xs sm:text-sm font-semibold transition-all hover:bg-card"
                >
                  <span className="truncate">{link.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* CHAVE PIX */}
        {bio.pix_key && (
          <div className="max-w-md mx-auto px-4 py-4">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}

        {/* BANNER FINAL DE CONVERSÃO */}
        <section className="relative mt-8 px-4 sm:px-6 py-12 text-center rounded-3xl max-w-5xl mx-auto overflow-hidden bg-gradient-to-b from-card to-background border border-border/80 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-foreground">
            Você não precisa passar por isso sozinho(a).
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Dê o primeiro passo para o seu autocuidado. Converse com {bio.display_name} e encontre seu espaço de escuta.
          </p>

          {whatsapp && (
            <div className="mt-6 flex justify-center">
              <a
                href={whatsappUrl(whatsapp, defaultWaMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 text-sm sm:text-base font-bold uppercase shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)] active:scale-[0.98] transition-all"
              >
                <CalendarCheck className="h-5 w-5" />
                <span>Iniciar Minha Terapia</span>
              </a>
            </div>
          )}
        </section>

        {/* RODAPÉ */}
        <footer className="mt-12 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p className="font-bold uppercase text-foreground">{bio.display_name}</p>
          {address && <p className="mt-1 text-[11px]">{address}</p>}
          <div className="mt-4">
            <Footer />
          </div>
        </footer>

        {/* BOTÃO FLUTUANTE WHATSAPP */}
        {whatsapp && (
          <a
            href={whatsappUrl(whatsapp, defaultWaMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            onClick={() => onTrack("whatsapp_click")}
            className="fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 active:scale-95 animate-pulse"
          >
            <MessageCircle className="h-7 w-7" />
          </a>
        )}
      </main>
    );
  }
}
