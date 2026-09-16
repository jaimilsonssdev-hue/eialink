import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Dumbbell,
  Gem,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import type { PublicLink } from "@/components/public-profile/types";
import { detectNicheKey } from "@/modules/prospecting/nichePresets";

/**
 * ImpactLayout: Modelo VIP de Altíssimo Impacto Visual e Máxima Conversão.
 * 
 * Destaques:
 * - Ambient radial glow com iluminação da cor primária
 * - Logo flutuante com sombra volumétrica
 * - Selo de garantia com ícone de verificado
 * - Headlines com destaque em cor primária
 * - Grid de 4 diferenciais com cards de vidro
 * - Vitrine de serviços com elevação no hover e botão direto
 * - Card de localização geográfica com rota para Google Maps
 * - Botão flutuante suave com pulso
 */
function renderNicheFallbackIcon(nicheKey: string) {
  switch (nicheKey) {
    case "loja":
      return <ShoppingBag className="h-5 w-5" />;
    case "beleza":
      return <Sparkles className="h-5 w-5" />;
    case "delivery":
    case "restaurante":
      return <UtensilsCrossed className="h-5 w-5" />;
    case "clinica":
    case "odontologia":
      return <Stethoscope className="h-5 w-5" />;
    case "fitness":
      return <Dumbbell className="h-5 w-5" />;
    case "psicologia":
      return <HeartHandshake className="h-5 w-5" />;
    case "oficina":
    case "auto":
      return <Wrench className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
}

function renderDiffIcon(iconName?: string) {
  switch (iconName) {
    case "shield":
      return <ShieldCheck className="h-5 w-5" />;
    case "heart":
      return <HeartHandshake className="h-5 w-5" />;
    case "clock":
      return <Clock className="h-5 w-5" />;
    case "check":
      return <CheckCircle2 className="h-5 w-5" />;
    case "sparkles":
      return <Sparkles className="h-5 w-5" />;
    case "star":
      return <Star className="h-5 w-5" />;
    case "bag":
      return <ShoppingBag className="h-5 w-5" />;
    default:
      return <BadgeCheck className="h-5 w-5" />;
  }
}

function getDefaultDifferentials(nicheKey: string) {
  switch (nicheKey) {
    case "loja":
      return [
        { title: "Envio Seguro", desc: "Entrega ágil com rastreio garantido", icon: "shield" },
        { title: "Produtos Selecionados", desc: "Qualidade de alto padrão e procedência", icon: "bag" },
        { title: "Compra 100% Segura", desc: "Pagamentos facilitados via Pix e cartões", icon: "check" },
        { title: "Atendimento Humanizado", desc: "Suporte dedicado pelo WhatsApp", icon: "heart" },
      ];
    case "beleza":
      return [
        { title: "Hora Marcada", desc: "Pontualidade e respeito total ao seu tempo", icon: "clock" },
        { title: "Produtos Premium", desc: "Cosméticos e linhas de tratamento de ponta", icon: "sparkles" },
        { title: "Ambiente Acolhedor", desc: "Espaço climatizado e confortável", icon: "badge" },
        { title: "Especialistas no Assunto", desc: "Técnicas atualizadas e visagismo sob medida", icon: "heart" },
      ];
    case "delivery":
    case "restaurante":
      return [
        { title: "Ingredientes Selecionados", desc: "Preparo artesanal com frescor diário", icon: "badge" },
        { title: "Entrega Quentinha", desc: "Embalagens térmicas que preservam o sabor", icon: "shield" },
        { title: "Sabor Incomparável", desc: "Receitas exclusivas e aprovadas pelos clientes", icon: "sparkles" },
        { title: "Higiene Impecável", desc: "Rigor absoluto em todas as etapas", icon: "check" },
      ];
    case "clinica":
    case "odontologia":
      return [
        { title: "Corpo Clínico Especializado", desc: "Profissionais certificados e atualizados", icon: "badge" },
        { title: "Tecnologia & Precisão", desc: "Equipamentos modernos para diagnósticos", icon: "shield" },
        { title: "Ambiente Sanitizado", desc: "Biossegurança rigorosa e total conforto", icon: "check" },
        { title: "Cuidado Humanizado", desc: "Atenção individualizada a cada paciente", icon: "heart" },
      ];
    case "fitness":
      return [
        { title: "Equipamentos Modernos", desc: "Aparelhos ergonômicos de última geração", icon: "shield" },
        { title: "Acompanhamento Técnico", desc: "Instrutores preparados para orientar seu treino", icon: "badge" },
        { title: "Ambiente Motivador", desc: "Espaço amplo, climatizado e dinâmico", icon: "sparkles" },
        { title: "Planos Flexíveis", desc: "Condições transparentes sem pegadinhas", icon: "check" },
      ];
    case "psicologia":
      return [
        { title: "Sigilo & Ética Profissional", desc: "Espaço confidencial em conformidade com o CRP", icon: "shield" },
        { title: "Escuta Acolhedora", desc: "Atendimento humanizado e livre de julgamentos", icon: "heart" },
        { title: "Online e Presencial", desc: "Flexibilidade para atendimento de onde preferir", icon: "check" },
        { title: "Abordagem Personalizada", desc: "Terapia focada nas suas demandas e evolução", icon: "sparkles" },
      ];
    case "oficina":
    case "auto":
      return [
        { title: "Diagnóstico Computadorizado", desc: "Precisão na avaliação do seu veículo", icon: "shield" },
        { title: "Peças de Primeira Linha", desc: "Garantia e durabilidade para sua segurança", icon: "badge" },
        { title: "Mecânicos Qualificados", desc: "Experiência comprovada em revisões e reparos", icon: "check" },
        { title: "Orçamento Transparente", desc: "Sem surpresas na hora de retirar seu carro", icon: "heart" },
      ];
    default:
      return [
        { title: "Atendimento de Confiança", desc: "Compromisso com pontualidade e respeito", icon: "badge" },
        { title: "Qualidade Garantida", desc: "Dedicação e materiais de primeira linha", icon: "shield" },
        { title: "Cuidado no Detalhe", desc: "Foco nas suas reais necessidades", icon: "sparkles" },
        { title: "Acabamento Profissional", desc: "Satisfação assegurada em cada entrega", icon: "heart" },
      ];
  }
}

function getDefaultBadge(nicheKey: string) {
  switch (nicheKey) {
    case "loja":
      return "Coleção Exclusiva & Pronta Entrega";
    case "beleza":
      return "Excelência em Beleza & Estética VIP";
    case "delivery":
      return "Sabor Artesanal & Entrega Rápida";
    case "restaurante":
      return "Gastronomia & Experiência de Alto Padrão";
    case "clinica":
    case "odontologia":
      return "Saúde & Cuidado com Excelência";
    case "fitness":
      return "Treinos & Alta Performance";
    case "psicologia":
      return "Espaço Seguro de Acolhimento & Saúde Mental";
    case "oficina":
    case "auto":
      return "Centro Automotivo & Revisão de Precisão";
    default:
      return "Qualidade Premium Garantida";
  }
}

export class ImpactLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "impact" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "impact";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], bookingUrl, supplemental } = ctx;
    const services = products.filter((p) => p.active);
    const secondaryLinks = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    const phone = (bio as any).phone?.replace(/\D/g, "");

    const socialData = (bio.social_links as Record<string, any>) || {};
    const nicheKey = detectNicheKey((bio.social_links as any)?.niche, bio.display_name);
    const vipBadge = socialData.vip_badge || getDefaultBadge(nicheKey);
    const differentials = Array.isArray(socialData.differentials) && socialData.differentials.length > 0
      ? socialData.differentials
      : getDefaultDifferentials(nicheKey);
    const differentialsTitle = socialData.differentials_title || "Nosso Padrão de Atendimento";

    const rating = socialData.google_rating;
    const reviewsCount = socialData.reviews_count;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address;
    const openingHours = socialData.opening_hours;

    const encodedAddress = address ? encodeURIComponent(address) : null;
    const mapsLink = encodedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : null;

    const defaultCover =
      bio.cover_url ||
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80";

    const defaultWaMessage =
      bio.whatsapp_message ||
      `Olá! Encontrei o perfil de ${bio.display_name} e gostaria de agendar um atendimento.`;

    return (
      <main className="relative min-h-screen overflow-x-hidden text-foreground selection:bg-primary selection:text-primary-foreground pb-20 sm:pb-12">
        {/* ILUMINAÇÃO AMBIENTE RADIAL (Adaptada à cor primária da marca) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-70 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 45% at 50% 0%, color-mix(in oklab, var(--primary, #06b6d4) 26%, transparent), transparent 72%), repeating-linear-gradient(115deg, transparent 0 40px, color-mix(in oklab, var(--primary, #06b6d4) 4%, transparent) 40px 41px)",
          }}
        />

        {/* TOPBAR TRANSPARENTE COM BOTÃO COMPARTILHAR */}
        <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Página Oficial</span>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-background/60 backdrop-blur-md text-foreground border border-border/60 hover:bg-background/80 transition-all shadow-sm active:scale-95 cursor-pointer"
            aria-label="Compartilhar página"
          >
            <span>Compartilhar</span>
          </button>
        </div>

        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 pt-6 pb-12 sm:pb-16 text-center max-w-4xl mx-auto">
          {/* LOGO / AVATAR COM GLOW RADIAL */}
          <div className="relative mx-auto flex items-center justify-center max-w-xs mb-6">
            <div className="absolute h-48 w-48 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
            {bio.avatar_url ? (
              <img
                src={bio.avatar_url}
                alt={bio.display_name}
                width={240}
                height={240}
                className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full sm:rounded-3xl object-cover drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)] border-2 border-primary/40 ring-4 ring-primary/10 transition-transform hover:scale-105 duration-300"
                loading="eager"
              />
            ) : (
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-card border-2 border-primary/40 shadow-2xl flex items-center justify-center text-primary font-black text-3xl sm:text-4xl">
                {bio.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* SELO DE QUALIDADE & AVALIAÇÃO DO GOOGLE */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold tracking-wide text-foreground uppercase shadow-xs">
              <BadgeCheck className="h-4 w-4 text-primary" />
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

          {/* TÍTULO PRINCIPAL COM REALCE EM CAIXA ALTA */}
          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-tight max-w-2xl mx-auto">
            {bio.display_name}
          </h1>

          {/* DESCRIÇÃO / SLOGAN */}
          {bio.description && (
            <p className="mt-3.5 max-w-lg mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              {bio.description}
            </p>
          )}

          {/* BOTÕES DE AÇÃO HERO DE ALTA CONVERSÃO */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                onClick={() => onTrack("booking_click")}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-sm sm:text-base font-bold text-primary-foreground uppercase shadow-[0_10px_30px_-10px_var(--primary)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <CalendarCheck className="h-5 w-5" />
                <span>Agendar Horário Online</span>
              </a>
            ) : (
              whats && (
                <a
                  href={whatsappUrl(whats, defaultWaMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-sm sm:text-base font-bold text-primary-foreground uppercase shadow-[0_10px_30px_-10px_var(--primary)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{bio.whatsapp_button_label || "Agendar pelo WhatsApp"}</span>
                </a>
              )
            )}

            {insta && (
              <a
                href={`https://instagram.com/${insta}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("instagram_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/60 hover:bg-card active:scale-[0.98]"
              >
                <Instagram className="h-5 w-5 text-pink-500" />
                <span>Instagram</span>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={() => onTrack("phone_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-5 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary/60 hover:bg-card active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span>Ligar</span>
              </a>
            )}
          </div>
        </section>

        {/* GRID DE 4 DIFERENCIAIS (GLASS CARDS) */}
        <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
              {differentialsTitle}
            </h2>
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-primary" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {differentials.slice(0, 4).map((diff: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-3.5 sm:p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all hover:-translate-y-0.5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  {renderDiffIcon(diff.icon)}
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

        {/* VITRINE DE SERVIÇOS EM CARDS MODERNOS COM HOVER LIFT */}
        {services.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                Nossos <span className="text-primary">Serviços</span>
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-primary" />
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Serviços executados com excelência, dedicação e materiais de primeira linha
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((item) => (
                <article
                  key={item.id}
                  className="group relative rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_18px_40px_-20px_var(--primary)] flex flex-col justify-between"
                >
                  <div>
                    {item.image_url ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3.5 bg-black/20">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="inline-flex rounded-xl bg-primary/15 p-3 text-primary mb-3.5 transition-transform group-hover:scale-110 duration-300">
                        {renderNicheFallbackIcon(nicheKey)}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      {item.price !== null && (
                        <span className="shrink-0 text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    {whats && (
                      <a
                        href={whatsappUrl(
                          whats,
                          `Olá! Gostaria de mais informações sobre o serviço ${item.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrack("whatsapp_click", item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold uppercase py-2.5 px-3 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" />
                        <span>Solicitar Atendimento</span>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÕES COMPLEMENTARES (VÍDEO EM DESTAQUE, HISTÓRIA / SOBRE NÓS) */}
        {supplemental}

        {/* SEÇÃO DE DIFERENCIAIS DA EMPRESA */}
        {differentials.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                {differentialsTitle}
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-primary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {differentials.map((diff: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md px-4 py-3.5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                    {renderDiffIcon(diff.icon)}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">{diff.title}</h4>
                    <p className="text-[11px] text-muted-foreground">{diff.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARD DE LOCALIZAÇÃO GEOGRÁFICA COM GOOGLE MAPS */}
        {(address || openingHours) && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-4xl mx-auto">
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
                <MapPin className="h-6 w-6" />
              </span>

              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                Venha conhecer nosso espaço
              </h2>

              {address && (
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {address}
                </p>
              )}

              {openingHours && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/60">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{openingHours}</span>
                </div>
              )}

              {mapsLink && (
                <div className="mt-5">
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-5 py-3 text-xs font-bold uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Ver localização no Google Maps</span>
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* DEPOIMENTOS DE CLIENTES */}
        {testimonials.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-10 sm:py-14 max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                Avaliações de Clientes
              </h2>
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-primary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {testimonials.slice(0, 4).map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md p-4 space-y-2"
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
                    {t.name || t.author || "Cliente verificado"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINKS SECUNDÁRIOS */}
        {secondaryLinks.length > 0 && (
          <section className="relative border-t border-border/50 px-4 sm:px-6 py-8 max-w-md mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-3">
              Links Rápidos
            </h3>
            <div className="space-y-2">
              {secondaryLinks.map((link: PublicLink) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("link_click", link.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/75 backdrop-blur-md hover:border-primary/50 text-foreground text-xs sm:text-sm font-semibold transition-all hover:bg-card"
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
        <section className="relative mt-8 px-4 sm:px-6 py-12 text-center rounded-3xl max-w-4xl mx-auto overflow-hidden bg-gradient-to-b from-card to-background border border-border/80 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
            Seu atendimento com qualidade e dedicação.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Entre em contato agora mesmo e garanta um serviço impecável com a equipe de {bio.display_name}.
          </p>

          {whats && (
            <div className="mt-6 flex justify-center">
              <a
                href={whatsappUrl(whats, defaultWaMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-sm sm:text-base font-bold text-primary-foreground uppercase shadow-[0_10px_30px_-10px_var(--primary)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Quero agendar meu atendimento</span>
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

        {/* BOTÃO FLUTUANTE WHATSAPP PULSANTE (BOTTOM-RIGHT) */}
        {whats && (
          <a
            href={whatsappUrl(whats, defaultWaMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Agendar pelo WhatsApp"
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

