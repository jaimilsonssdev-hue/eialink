import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Clock,
  Flame,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { CatalogItem } from "@/modules/products/types";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * RestaurantLayout: Modelo Exclusivo de Alto Padrão para Restaurantes, Hamburguerias, Pizzarias & Delivery.
 * 
 * Design refinado, moderno e apetitoso:
 * - Ambient glow em tons âmbar e terracota
 * - Topbar com status ao vivo "Cozinha Aberta · Delivery & Mesa"
 * - Capa ampla cinematográfica com pratos artesanais
 * - Grid de 4 diferenciais gastronômicos (Ingredientes Frescos, Entrega Quentinha, Sabor Exclusivo, Rigor Sanitário)
 * - Cardápio categorizado com fotos de dar água na boca, valores e pedido instantâneo no WhatsApp
 * - Seção de Depoimentos e Prova Social com estrelas
 * - Card de localização com rota para o Google Maps
 * - Botão flutuante pulsante de pedidos no WhatsApp
 */
export class RestaurantLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "restaurant" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "restaurant";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], bookingUrl, supplemental } = ctx;
    const menu = products.filter((p) => p.active);
    const secondary = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    const phone = (bio as any).phone?.replace(/\D/g, "");

    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    const vipBadge = socialData.vip_badge || "Sabor Artesanal & Entrega Rápida";
    const differentialsTitle = socialData.differentials_title || "Nosso Padrão de Sabor & Cuidado";
    const differentials = Array.isArray(socialData.differentials) && socialData.differentials.length > 0
      ? socialData.differentials
      : [
          { title: "Ingredientes Selecionados", desc: "Preparo artesanal com frescor diário e rigor", icon: "flame" },
          { title: "Entrega Quentinha", desc: "Embalagens térmicas especiais que mantêm a qualidade", icon: "truck" },
          { title: "Sabor Incomparável", desc: "Receitas exclusivas e aprovadas pelos melhores clientes", icon: "sparkles" },
          { title: "Higiene Impecável", desc: "Cozinha com rigor absoluto em segurança alimentar", icon: "shield" },
        ];

    const encodedAddress = address ? encodeURIComponent(address) : null;
    const mapsLink = encodedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : null;

    const defaultCover =
      bio.cover_url ||
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

    const defaultWaMessage =
      bio.whatsapp_message ||
      `Olá! Gostaria de consultar o cardápio e fazer um pedido com ${bio.display_name}.`;

    return (
      <main className="relative min-h-screen overflow-x-hidden text-foreground selection:bg-amber-500 selection:text-black pb-20 sm:pb-12 bg-gradient-to-b from-amber-950/20 via-background to-background">
        {/* ILUMINAÇÃO AMBIENTE RADIAL EM TONS ÂMBAR / DOURADO */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-50 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 45% at 50% 0%, color-mix(in oklab, #f59e0b 20%, transparent), transparent 70%), repeating-linear-gradient(115deg, transparent 0 40px, color-mix(in oklab, #d97706 3%, transparent) 40px 41px)",
          }}
        />

        {/* TOPBAR TRANSLÚCIDA COM BOTÃO COMPARTILHAR */}
        <header className="max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cozinha Aberta &middot; Delivery &amp; Salão</span>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card/70 backdrop-blur-md text-foreground border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-sm active:scale-95 cursor-pointer"
            aria-label="Compartilhar página"
          >
            <span>Compartilhar</span>
          </button>
        </header>

        {/* HERO SECTION CINEMATOGRÁFICA */}
        <section className="relative px-4 sm:px-6 pt-4 pb-10 sm:pb-14 text-center max-w-5xl mx-auto">
          {/* BANNER DE CAPA COM SOBREPOSIÇÃO SUAVE */}
          <div className="relative w-full h-44 sm:h-64 rounded-3xl overflow-hidden border border-border/80 shadow-xl mb-6">
            <img
              src={defaultCover}
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
          </div>

          {/* AVATAR OU MONOGRAMA DO RESTAURANTE */}
          <div className="relative mx-auto -mt-20 sm:-mt-24 flex items-center justify-center max-w-xs mb-4">
            <div className="absolute h-40 w-40 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />
            {bio.avatar_url ? (
              <img
                src={bio.avatar_url}
                alt={bio.display_name}
                width={200}
                height={200}
                className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover shadow-2xl border-4 border-background ring-4 ring-amber-500/30 transition-transform hover:scale-105 duration-300"
                loading="eager"
              />
            ) : (
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-card border-4 border-background ring-4 ring-amber-500/30 shadow-2xl flex items-center justify-center text-amber-500 font-black text-3xl sm:text-4xl">
                {bio.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* BADGES SUPERIORES */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold tracking-wide text-amber-600 dark:text-amber-300 uppercase shadow-xs">
              <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
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
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto text-foreground">
            {bio.display_name}
          </h1>

          {/* SLOGAN / DESCRIÇÃO */}
          {bio.description && (
            <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              {bio.description}
            </p>
          )}

          {/* ENDEREÇO & HORÁRIO */}
          {(address || openingHours) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {address && (
                <span className="inline-flex items-center gap-1 bg-card/60 border border-border/80 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[280px]">{address}</span>
                </span>
              )}
              {openingHours && (
                <span className="inline-flex items-center gap-1 bg-card/60 border border-border/80 px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{openingHours}</span>
                </span>
              )}
            </div>
          )}

          {/* BOTÕES PRINCIPAIS DE CONVERSÃO HERO */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {whats && (
              <a
                href={whatsappUrl(whats, defaultWaMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-6 py-3.5 text-sm sm:text-base font-bold uppercase shadow-[0_10px_30px_-10px_rgba(245,158,11,0.6)] transition-all active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{bio.whatsapp_button_label || "Fazer Pedido no WhatsApp"}</span>
              </a>
            )}

            {bookingUrl && (
              <a
                href={bookingUrl}
                onClick={() => onTrack("booking_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-amber-500/20 active:scale-[0.98]"
              >
                <CalendarCheck className="h-5 w-5 text-amber-500" />
                <span>Reservar Mesa</span>
              </a>
            )}

            {insta && (
              <a
                href={`https://instagram.com/${insta}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("instagram_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-amber-500/60 hover:bg-card active:scale-[0.98]"
              >
                <Instagram className="h-5 w-5 text-pink-500" />
                <span>Instagram</span>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={() => onTrack("phone_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-amber-500/60 hover:bg-card active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-amber-500" />
                <span>Ligar</span>
              </a>
            )}
          </div>
        </section>

        {/* GRID DE 4 DIFERENCIAIS GASTRONÔMICOS */}
        <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {differentialsTitle}
            </h2>
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-amber-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {differentials.slice(0, 4).map((diff: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-amber-500/50 transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  {diff.icon === "truck" ? (
                    <Truck className="h-5 w-5" />
                  ) : diff.icon === "flame" ? (
                    <Flame className="h-5 w-5" />
                  ) : diff.icon === "shield" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : diff.icon === "sparkles" ? (
                    <Sparkles className="h-5 w-5" />
                  ) : (
                    <UtensilsCrossed className="h-5 w-5" />
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

        {/* CARDÁPIO GASTRONÔMICO COM PREÇOS E PEDIDOS */}
        {menu.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Cardápio Selecionado
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Nossos Pratos &amp; Destaques
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-amber-500" />
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Receitas preparadas artesanalmente na hora para você
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {menu.map((item) => (
                <article
                  key={item.id}
                  className="group relative rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:shadow-[0_16px_36px_-15px_rgba(245,158,11,0.35)] flex flex-col justify-between"
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
                      <div className="inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-500 mb-3.5 transition-transform group-hover:scale-110 duration-300">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-amber-500 transition-colors">
                        {item.name}
                      </h3>
                      {item.price !== null && (
                        <span className="shrink-0 text-xs font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
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
                    {whats ? (
                      <a
                        href={whatsappUrl(
                          whats,
                          `Olá! Gostaria de pedir: ${item.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("whatsapp_click", item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-foreground text-xs font-bold uppercase py-2.5 px-3 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-amber-500 group-hover:text-black" />
                        <span>Pedir este Prato</span>
                      </a>
                    ) : item.button_url ? (
                      <a
                        href={item.button_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase py-2.5 px-3 transition-colors shadow-sm"
                      >
                        <span>{item.button_label || "Pedir Agora"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÕES COMPLEMENTARES (VÍDEOS, HISTÓRIA / SOBRE O RESTAURANTE) */}
        {supplemental}

        {/* AVALIAÇÕES DE CLIENTES */}
        {testimonials.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Opinião de Quem Provou
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                O que Nossos Clientes Dizem
              </h2>
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.slice(0, 4).map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-amber-500/20 bg-card/80 backdrop-blur-md p-5 space-y-2 shadow-sm"
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
                    {t.name || t.author || "Cliente"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARD DE LOCALIZAÇÃO GEOGRÁFICA COM GOOGLE MAPS */}
        {(address || openingHours) && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto mb-3">
                <MapPin className="h-6 w-6" />
              </span>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Venha nos conhecer
              </h2>

              {address && (
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {address}
                </p>
              )}

              {openingHours && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/60">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>{openingHours}</span>
                </div>
              )}

              {mapsLink && (
                <div className="mt-5">
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-3 text-xs font-bold uppercase transition-colors hover:bg-amber-500 hover:text-black text-amber-500"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Ver localização no Google Maps</span>
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
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md hover:border-amber-500/50 text-foreground text-xs sm:text-sm font-semibold transition-all hover:bg-card"
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

        {/* BANNER FINAL DE FECHAMENTO */}
        <section className="relative mt-8 px-4 sm:px-6 py-12 text-center rounded-3xl max-w-5xl mx-auto overflow-hidden bg-gradient-to-b from-card to-background border border-border/80 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bateu aquela vontade? Peça agora mesmo!
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Preparamos seu pedido na hora com todo o capricho da equipe de {bio.display_name}.
          </p>

          {whats && (
            <div className="mt-6 flex justify-center">
              <a
                href={whatsappUrl(whats, defaultWaMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 text-sm sm:text-base font-bold uppercase shadow-[0_10px_30px_-10px_rgba(245,158,11,0.6)] active:scale-[0.98] transition-all"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Pedir no WhatsApp</span>
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
        {whats && (
          <a
            href={whatsappUrl(whats, defaultWaMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fazer Pedido no WhatsApp"
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

export type _Ref = CatalogItem;
