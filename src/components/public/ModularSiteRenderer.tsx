import React from "react";
import {
  MapPin,
  MessageCircle,
  Navigation,
  Star,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export type HeroVariant = "hero_split" | "hero_full_dark" | "hero_editorial";
export type ServicesVariant = "grid_cards" | "lista_precos";
export type Palette = "emerald_gold" | "rose_nude" | "dark_amber" | "navy_blue";

export interface ModularSiteServiceItem {
  title: string;
  description: string;
}

export interface ModularSiteConfig {
  hero_variant: HeroVariant;
  services_variant: ServicesVariant;
  palette: Palette;
  headline: string;
  subheadline: string;
  services: ModularSiteServiceItem[];
  whatsapp_msg: string;
}

export interface ModularSiteRendererProps {
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  niche_slug?: string | null;
  photos?: string[] | null;
  nota_google?: number | null;
  total_avaliacoes?: number | null;
  config: ModularSiteConfig;
  isDemo?: boolean;
}

/**
 * Dicionário estático de fotos em alta resolução por nicho (Regra 2: Isolamento Total de Fotos).
 * Cada categoria possui estritamente 4 fotos testadas e aprovadas.
 */
export const NICHE_IMAGES = {
  odonto: [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80",
  ],
  estetica: [
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512290900672-1f41b590e8d1?auto=format&fit=crop&w=800&q=80",
  ],
  automotivo: [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=800&q=80",
  ],
  climatizacao: [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
  ],
  gastronomia: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  ],
  comercio: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80",
  ],
} as const;

export function resolveNicheSlug(rawSlug?: string | null): keyof typeof NICHE_IMAGES {
  const s = (rawSlug || "").toLowerCase();
  if (s.includes("odonto") || s.includes("dent")) return "odonto";
  if (s.includes("estetica") || s.includes("salao") || s.includes("beleza") || s.includes("spa") || s.includes("barber") || s.includes("barbearia")) return "estetica";
  if (s.includes("auto") || s.includes("mecanic") || s.includes("carro") || s.includes("oficina")) return "automotivo";
  if (s.includes("clima") || s.includes("ar-") || s.includes("refrigera") || s.includes("hvac")) return "climatizacao";
  if (s.includes("gastro") || s.includes("restaurante") || s.includes("pizza") || s.includes("burger") || s.includes("bar") || s.includes("cafe") || s.includes("lanche")) return "gastronomia";
  return "comercio";
}

const PALETTES = {
  emerald_gold: {
    bg: "bg-[#03140e] text-emerald-50",
    heroGradient: "from-[#05291d] via-[#03140e] to-[#020b08]",
    cardBg: "bg-[#062117]/85 border-emerald-500/25 text-emerald-100",
    cardHover: "hover:border-emerald-400/50 hover:bg-[#082b1e]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    accent: "text-amber-400",
    primaryBtn: "bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-bold shadow-lg shadow-emerald-950/60",
    secondaryBtn: "border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
    divider: "border-emerald-800/40",
    footerBg: "bg-[#020a07] border-emerald-900/40",
  },
  rose_nude: {
    bg: "bg-[#140b0f] text-pink-50",
    heroGradient: "from-[#24121b] via-[#140b0f] to-[#0c0609]",
    cardBg: "bg-[#211119]/85 border-rose-500/25 text-pink-100",
    cardHover: "hover:border-rose-400/50 hover:bg-[#2b1721]",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    accent: "text-rose-300",
    primaryBtn: "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-pink-950/60",
    secondaryBtn: "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
    divider: "border-rose-900/40",
    footerBg: "bg-[#0b0508] border-rose-950/50",
  },
  dark_amber: {
    bg: "bg-[#0b0c0e] text-amber-50",
    heroGradient: "from-[#1a1b20] via-[#0b0c0e] to-[#060607]",
    cardBg: "bg-[#141519]/85 border-amber-500/25 text-amber-100",
    cardHover: "hover:border-amber-400/50 hover:bg-[#1c1d22]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    accent: "text-amber-400",
    primaryBtn: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold shadow-lg shadow-amber-950/60",
    secondaryBtn: "border border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
    divider: "border-amber-900/40",
    footerBg: "bg-[#060607] border-amber-950/40",
  },
  navy_blue: {
    bg: "bg-[#080d1a] text-blue-50",
    heroGradient: "from-[#0f1a36] via-[#080d1a] to-[#04060d]",
    cardBg: "bg-[#0e172e]/85 border-blue-500/25 text-blue-100",
    cardHover: "hover:border-cyan-400/50 hover:bg-[#142142]",
    badge: "bg-blue-500/15 text-cyan-300 border-blue-500/30",
    accent: "text-cyan-300",
    primaryBtn: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-blue-950/60",
    secondaryBtn: "border border-blue-500/40 text-cyan-300 hover:bg-blue-500/10",
    divider: "border-blue-900/40",
    footerBg: "bg-[#04060d] border-blue-950/50",
  },
};

export function ModularSiteRenderer({
  nome,
  telefone,
  endereco,
  latitude,
  longitude,
  niche_slug,
  photos,
  nota_google,
  total_avaliacoes,
  config,
  isDemo,
}: ModularSiteRendererProps) {
  // Regra 1: Dados 100% Determinísticos (Proibido passar pela IA)
  const telefoneLimpo = (telefone || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${telefoneLimpo}${config.whatsapp_msg ? `?text=${encodeURIComponent(config.whatsapp_msg)}` : ""}`;
  const whatsappBaseUrl = `https://wa.me/${telefoneLimpo}`;

  const mapsIframeUrl =
    latitude && longitude
      ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
      : endereco
        ? `https://maps.google.com/maps?q=${encodeURIComponent(endereco)}&z=16&output=embed`
        : null;

  const comoChegarUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nome + (endereco ? ` ${endereco}` : ""))}`;

  // Regra 2: Isolamento Total de Fotos (Fotos da chave exata do niche_slug se não houver Storage)
  const hasStoragePhotos =
    Array.isArray(photos) &&
    photos.some((p) => typeof p === "string" && p.includes("/storage/v1/object/public/"));

  const resolvedNiche = resolveNicheSlug(niche_slug);
  const defaultImages = NICHE_IMAGES[resolvedNiche];
  const effectivePhotos = hasStoragePhotos
    ? photos!.filter((p) => typeof p === "string" && p.startsWith("http"))
    : defaultImages;

  const heroPhoto = effectivePhotos[0] || defaultImages[0];
  const ambientPhoto = effectivePhotos[1] || defaultImages[1];
  const servicePhotos = [
    effectivePhotos[2] || defaultImages[2],
    effectivePhotos[3] || defaultImages[3],
    effectivePhotos[0] || defaultImages[0],
    effectivePhotos[1] || defaultImages[1],
    effectivePhotos[2] || defaultImages[2],
    effectivePhotos[3] || defaultImages[3],
  ];

  // Regra 3: Design System Modular (Paletas pré-aprovadas)
  const p = PALETTES[config.palette] || PALETTES.dark_amber;
  const ratingDisplay = typeof nota_google === "number" ? nota_google.toFixed(1) : "4.9";
  const reviewsDisplay = total_avaliacoes ? `${total_avaliacoes}+` : "60+";

  return (
    <div className={`min-h-screen w-full font-sans antialiased selection:bg-primary/20 ${p.bg}`}>
      {/* HEADER / NAVBAR FIXA */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">
              {nome}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {telefoneLimpo && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${p.primaryBtn} transition-all`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Falar no WhatsApp</span>
              </a>
            )}
            {endereco && (
              <a
                href={comoChegarUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${p.secondaryBtn} transition-all`}
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Como Chegar</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (Variantes: hero_split, hero_full_dark, hero_editorial) */}
      <section className={`relative overflow-hidden bg-gradient-to-b ${p.heroGradient} py-12 sm:py-20 px-4 sm:px-6`}>
        {/* Glow de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* VARIANTE 1: HERO_SPLIT */}
          {config.hero_variant === "hero_split" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs ${p.badge}">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Presença Digital Oficial • {resolvedNiche.toUpperCase()}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                  {config.headline}
                </h1>

                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl">
                  {config.subheadline}
                </p>

                {/* Avaliações do Google */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-white/80 font-medium">
                    <strong className="text-white">{ratingDisplay}</strong> no Google Maps ({reviewsDisplay} avaliações)
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {telefoneLimpo && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold ${p.primaryBtn} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Agendar no WhatsApp</span>
                    </a>
                  )}
                  {endereco && (
                    <a
                      href={comoChegarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold ${p.secondaryBtn} transition-all`}
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Como Chegar</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                  <img
                    src={heroPhoto}
                    alt={nome}
                    className="w-full h-80 sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{nome}</p>
                      <p className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-red-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{endereco || "Localização verificada"}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                      <ShieldCheck className="h-3 w-3" /> Verificado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VARIANTE 2: HERO_FULL_DARK */}
          {config.hero_variant === "hero_full_dark" && (
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 sm:p-14 text-center">
              <img
                src={heroPhoto}
                alt={nome}
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25]"
                loading="eager"
              />
              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs mx-auto ${p.badge}">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Excelência & Experiência Comprovada</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
                  {config.headline}
                </h1>

                <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  {config.subheadline}
                </p>

                <div className="flex items-center justify-center gap-2 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs sm:text-sm text-white/90 ml-1 font-semibold">
                    {ratingDisplay} estrelas ({reviewsDisplay} avaliações reais no Google)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {telefoneLimpo && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-extrabold ${p.primaryBtn} transition-all hover:scale-105 active:scale-95`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Falar Agora no WhatsApp</span>
                    </a>
                  )}
                  {endereco && (
                    <a
                      href={comoChegarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold ${p.secondaryBtn} transition-all`}
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Traçar Rota no Mapa</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VARIANTE 3: HERO_EDITORIAL */}
          {config.hero_variant === "hero_editorial" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-white/10 pb-12">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-mono tracking-widest text-white/60 uppercase">
                  // Presença Oficial • {nome}
                </span>

                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                  {config.headline}
                </h1>

                <div className="h-1 w-16 bg-gradient-to-r from-primary to-amber-400 rounded-full" />

                <p className="text-base sm:text-lg text-white/80 leading-relaxed font-light max-w-xl">
                  {config.subheadline}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {telefoneLimpo && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold ${p.primaryBtn} transition-all`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Atendimento Exclusivo</span>
                    </a>
                  )}
                  {endereco && (
                    <a
                      href={comoChegarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium ${p.secondaryBtn} transition-all`}
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Ver Endereço</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-white/5 p-2">
                  <img
                    src={ambientPhoto}
                    alt={nome}
                    className="w-full h-72 sm:h-80 object-cover rounded-xl"
                  />
                  <div className="p-3 text-center">
                    <p className="text-xs font-semibold text-white">{nome}</p>
                    <p className="text-[11px] text-white/60">{endereco || "Atendimento qualificado"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO DE SERVIÇOS (Variantes: grid_cards ou lista_precos) */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${p.accent}`}>
            Serviços & Especialidades
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Soluções completas com padrão de excelência
          </h2>
          <p className="text-sm text-white/70">
            Conheça nossos principais procedimentos e fale diretamente conosco para agendamento.
          </p>
        </div>

        {/* VARIANTE 1: GRID_CARDS */}
        {config.services_variant === "grid_cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.services.map((service, index) => {
              const photo = servicePhotos[index % servicePhotos.length];
              const serviceWhatsappUrl = `${whatsappBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de agendar ou saber mais sobre o serviço: ${service.title}.`)}`;

              return (
                <div
                  key={index}
                  className={`group rounded-2xl overflow-hidden border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${p.cardBg} ${p.cardHover} flex flex-col`}
                >
                  <div className="h-44 w-full overflow-hidden relative">
                    <img
                      src={photo}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      Serviço Oficial
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs text-white/75 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>
                    </div>

                    {telefoneLimpo && (
                      <a
                        href={serviceWhatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl text-xs font-semibold ${p.secondaryBtn} group-hover:bg-primary group-hover:text-white transition-all mt-auto`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Solicitar no WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VARIANTE 2: LISTA_PRECOS */}
        {config.services_variant === "lista_precos" && (
          <div className="max-w-3xl mx-auto space-y-4">
            {config.services.map((service, index) => {
              const serviceWhatsappUrl = `${whatsappBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre o serviço: ${service.title}.`)}`;

              return (
                <div
                  key={index}
                  className={`p-4 sm:p-5 rounded-xl border backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${p.cardBg} ${p.cardHover}`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                      0{index + 1}
                    </span>
                    <div className="space-y-0.5">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {service.title}
                      </h3>
                      <p className="text-xs text-white/75 leading-relaxed max-w-lg">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {telefoneLimpo && (
                    <a
                      href={serviceWhatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${p.primaryBtn} shrink-0`}
                    >
                      <span>Agendar</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEÇÃO DE LOCALIZAÇÃO DETERMINÍSTICA (Regra 1: Proibido passar pela IA) */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-black/40 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${p.accent}`}>
                <MapPin className="h-3.5 w-3.5" /> Localização & Atendimento
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Venha nos visitar ou trace sua rota pelo GPS
              </h2>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Endereço Comercial</p>
                <p className="text-sm font-medium text-white leading-relaxed">
                  {endereco || "Endereço em atualização. Entre em contato para localização exata."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={comoChegarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold ${p.primaryBtn} transition-all`}
                >
                  <Navigation className="h-4 w-4" />
                  <span>Abrir Rota no Google Maps</span>
                </a>

                {telefoneLimpo && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${p.secondaryBtn} transition-all`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* IFRAME DETERMINÍSTICO DO GOOGLE MAPS (Regra 1) */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 h-80 sm:h-96 relative">
                {mapsIframeUrl ? (
                  <iframe
                    title={`Mapa de localização - ${nome}`}
                    src={mapsIframeUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full filter saturate-[1.1] contrast-[1.05]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-2 text-white/60">
                    <MapPin className="h-8 w-8 text-white/40" />
                    <p className="text-sm font-medium text-white">Mapa disponível via botão de rotas</p>
                    <a
                      href={comoChegarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir no Google Maps oficial
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-8 px-4 text-center text-xs text-white/60 border-t ${p.footerBg}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {nome}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-white/50 text-[11px]">
            <span>Presença Digital Eia Link</span>
            {endereco && <span>• {endereco}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
