import {
  NICHE_IMAGES,
  resolveNicheSlug,
  type HeroVariant,
  type ServicesVariant,
  type Palette,
  type ModularSiteServiceItem,
} from "@/components/public/ModularSiteRenderer";

export interface ExportSiteData {
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  niche_slug?: string | null;
  palette?: Palette;
  hero_variant?: HeroVariant;
  services_variant?: ServicesVariant;
  headline?: string | null;
  subheadline?: string | null;
  services?: ModularSiteServiceItem[] | null;
  photos?: string[] | null;
  nota_google?: number | null;
  total_avaliacoes?: number | null;
  whatsapp_msg?: string | null;
  slug?: string | null;
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanDigits(val?: string | null): string {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

const PALETTE_CONFIGS: Record<
  Palette,
  {
    bgClass: string;
    bgHex: string;
    textClass: string;
    heroGradient: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
    cardHoverBorder: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentText: string;
    primaryBtn: string;
    secondaryBtn: string;
    footerBg: string;
    footerBorder: string;
  }
> = {
  emerald_gold: {
    bgClass: "bg-[#03140e]",
    bgHex: "#03140e",
    textClass: "text-emerald-50",
    heroGradient: "from-[#05291d] via-[#03140e] to-[#020b08]",
    cardBg: "bg-[#062117]/85",
    cardBorder: "border-emerald-500/25",
    cardText: "text-emerald-100",
    cardHoverBorder: "hover:border-emerald-400/50 hover:bg-[#082b1e]",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    accentText: "text-amber-400",
    primaryBtn: "bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950",
    secondaryBtn: "border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
    footerBg: "bg-[#020a07]",
    footerBorder: "border-emerald-900/40",
  },
  rose_nude: {
    bgClass: "bg-[#140b0f]",
    bgHex: "#140b0f",
    textClass: "text-pink-50",
    heroGradient: "from-[#24121b] via-[#140b0f] to-[#0c0609]",
    cardBg: "bg-[#211119]/85",
    cardBorder: "border-rose-500/25",
    cardText: "text-pink-100",
    cardHoverBorder: "hover:border-rose-400/50 hover:bg-[#2b1721]",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/30",
    accentText: "text-rose-300",
    primaryBtn: "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white",
    secondaryBtn: "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
    footerBg: "bg-[#0b0508]",
    footerBorder: "border-rose-950/50",
  },
  dark_amber: {
    bgClass: "bg-[#0b0c0e]",
    bgHex: "#0b0c0e",
    textClass: "text-amber-50",
    heroGradient: "from-[#1a1b20] via-[#0b0c0e] to-[#060607]",
    cardBg: "bg-[#141519]/85",
    cardBorder: "border-amber-500/25",
    cardText: "text-amber-100",
    cardHoverBorder: "hover:border-amber-400/50 hover:bg-[#1c1d22]",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
    accentText: "text-amber-400",
    primaryBtn: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black",
    secondaryBtn: "border border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
    footerBg: "bg-[#060607]",
    footerBorder: "border-amber-950/40",
  },
  navy_blue: {
    bgClass: "bg-[#080d1a]",
    bgHex: "#080d1a",
    textClass: "text-blue-50",
    heroGradient: "from-[#0f1a36] via-[#080d1a] to-[#04060d]",
    cardBg: "bg-[#0e172e]/85",
    cardBorder: "border-blue-500/25",
    cardText: "text-blue-100",
    cardHoverBorder: "hover:border-cyan-400/50 hover:bg-[#142142]",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-cyan-300",
    badgeBorder: "border-blue-500/30",
    accentText: "text-cyan-300",
    primaryBtn: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white",
    secondaryBtn: "border border-blue-500/40 text-cyan-300 hover:bg-blue-500/10",
    footerBg: "bg-[#04060d]",
    footerBorder: "border-blue-950/50",
  },
};

// Ícones SVG Inline Autossuficientes (Zero dependência externa)
const ICONS = {
  mapPin: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
  navigation: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="3 11 22 2 13 21 11 13 3 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star: `<svg class="w-4 h-4 shrink-0 fill-amber-400 text-amber-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" stroke-width="1"/></svg>`,
  sparkles: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z"/></svg>`,
  shieldCheck: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  arrowRight: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`,
  whatsapp: `<svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.56 5.37L2 22l4.75-1.52a9.96 9.96 0 005.281 1.5c5.536 0 10.031-4.495 10.031-10.031S17.567 2 12.031 2zm0 18.25c-1.63 0-3.15-.47-4.46-1.28l-.32-.2-3.29 1.05 1.07-3.21-.21-.34a8.19 8.19 0 01-1.25-4.24c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25zm4.84-6.17c-.26-.13-1.56-.77-1.8-.86-.24-.09-.42-.13-.6.13-.17.26-.69.86-.84 1.04-.16.17-.31.2-.57.07-.26-.13-1.11-.41-2.11-1.3-.78-.7-1.31-1.56-1.46-1.82-.16-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.16.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.6-1.45-.83-1.99-.22-.52-.45-.45-.61-.46h-.52c-.17 0-.46.07-.7.33-.24.26-.93.91-.93 2.22s.95 2.58 1.09 2.76c.13.17 1.88 2.87 4.55 4.02.64.27 1.13.44 1.52.56.64.2 1.23.17 1.69.1.52-.08 1.56-.64 1.78-1.25.22-.61.22-1.13.15-1.25-.06-.11-.23-.18-.49-.31z"/></svg>`,
  whatsappFloat: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.56 5.37L2 22l4.75-1.52a9.96 9.96 0 005.281 1.5c5.536 0 10.031-4.495 10.031-10.031S17.567 2 12.031 2zm0 18.25c-1.63 0-3.15-.47-4.46-1.28l-.32-.2-3.29 1.05 1.07-3.21-.21-.34a8.19 8.19 0 01-1.25-4.24c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25zm4.84-6.17c-.26-.13-1.56-.77-1.8-.86-.24-.09-.42-.13-.6.13-.17.26-.69.86-.84 1.04-.16.17-.31.2-.57.07-.26-.13-1.11-.41-2.11-1.3-.78-.7-1.31-1.56-1.46-1.82-.16-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.16.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.6-1.45-.83-1.99-.22-.52-.45-.45-.61-.46h-.52c-.17 0-.46.07-.7.33-.24.26-.93.91-.93 2.22s.95 2.58 1.09 2.76c.13.17 1.88 2.87 4.55 4.02.64.27 1.13.44 1.52.56.64.2 1.23.17 1.69.1.52-.08 1.56-.64 1.78-1.25.22-.61.22-1.13.15-1.25-.06-.11-.23-.18-.49-.31z"/></svg>`,
};

/**
 * Gera um arquivo HTML5 standalone, 100% autossuficiente e white-label,
 * pronto para hospedagem estática direta (Cloudflare Pages, Vercel, Netlify, Apache/Nginx).
 */
export function generateStandaloneSiteHtml(data: ExportSiteData): string {
  const nome = escapeHtml(data.nome);
  const telefoneLimpo = cleanDigits(data.telefone);
  const endereco = escapeHtml(data.endereco || "");
  const headline = escapeHtml(data.headline || `Excelência e Atendimento Especializado na ${data.nome}`);
  const subheadline = escapeHtml(
    data.subheadline ||
      `Presença digital oficial com serviços sob medida e atendimento direto pelo WhatsApp.${data.endereco ? ` Venha nos visitar em ${data.endereco}.` : ""}`,
  );
  const whatsappMsg = data.whatsapp_msg || `Olá! Acessei o site oficial da ${data.nome} e gostaria de agendar um atendimento.`;
  const whatsappUrl = telefoneLimpo
    ? `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(whatsappMsg)}`
    : "#";
  const whatsappBaseUrl = telefoneLimpo ? `https://wa.me/${telefoneLimpo}` : "#";

  const latitude = data.latitude;
  const longitude = data.longitude;
  const mapsIframeUrl =
    latitude && longitude
      ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
      : endereco
        ? `https://maps.google.com/maps?q=${encodeURIComponent(data.endereco || "")}&z=16&output=embed`
        : null;

  const comoChegarUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.nome + (data.endereco ? ` ${data.endereco}` : ""))}`;

  // Fotos de Nicho Determinísticas
  const resolvedNiche = resolveNicheSlug(data.niche_slug);
  const defaultImages = NICHE_IMAGES[resolvedNiche];
  const effectivePhotos =
    Array.isArray(data.photos) && data.photos.length > 0
      ? data.photos.filter((p) => typeof p === "string" && p.startsWith("http"))
      : defaultImages;

  const heroPhoto = escapeHtml(effectivePhotos[0] || defaultImages[0]);
  const ambientPhoto = escapeHtml(effectivePhotos[1] || defaultImages[1]);
  const servicePhotos = [
    escapeHtml(effectivePhotos[2] || defaultImages[2]),
    escapeHtml(effectivePhotos[3] || defaultImages[3]),
    escapeHtml(effectivePhotos[0] || defaultImages[0]),
    escapeHtml(effectivePhotos[1] || defaultImages[1]),
    escapeHtml(effectivePhotos[2] || defaultImages[2]),
    escapeHtml(effectivePhotos[3] || defaultImages[3]),
  ];

  // Paleta e Layout
  const paletteKey = data.palette || "dark_amber";
  const p = PALETTE_CONFIGS[paletteKey] || PALETTE_CONFIGS.dark_amber;
  const heroVariant = data.hero_variant || "hero_split";
  const servicesVariant = data.services_variant || "grid_cards";

  const ratingDisplay = typeof data.nota_google === "number" ? data.nota_google.toFixed(1) : "4.9";
  const reviewsDisplay = data.total_avaliacoes ? `${data.total_avaliacoes}+` : "50+";

  const defaultServices: ModularSiteServiceItem[] = [
    { title: "Atendimento Personalizado", description: "Avaliação detalhada e soluções sob medida para cada cliente." },
    { title: "Serviço Especializado", description: "Profissionais qualificados com rigoroso padrão de qualidade." },
    { title: "Garantia e Confiança", description: "Transparência total em cada etapa com suporte dedicado." },
    { title: "Agendamento Prático", description: "Horários flexíveis e atendimento ágil direto pelo WhatsApp." },
  ];
  const servicesList = data.services && data.services.length > 0 ? data.services : defaultServices;

  // Renderização do Hero
  let heroHtml = "";
  if (heroVariant === "hero_split") {
    heroHtml = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div class="lg:col-span-7 space-y-5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${p.badgeBg} ${p.badgeText} ${p.badgeBorder}">
            ${ICONS.sparkles}
            <span>Presença Digital Oficial • ${resolvedNiche.toUpperCase()}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            ${headline}
          </h1>

          <p class="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl">
            ${subheadline}
          </p>

          <div class="flex items-center gap-3 pt-1">
            <div class="flex items-center gap-1 text-amber-400">
              ${ICONS.star}${ICONS.star}${ICONS.star}${ICONS.star}${ICONS.star}
            </div>
            <span class="text-xs text-white/80 font-medium">
              <strong class="text-white">${ratingDisplay}</strong> no Google Maps (${reviewsDisplay} avaliações)
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-3">
            ${
              telefoneLimpo
                ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold ${p.primaryBtn} shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                    ${ICONS.whatsapp}
                    <span>Agendar no WhatsApp</span>
                  </a>`
                : ""
            }
            ${
              endereco
                ? `<a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold ${p.secondaryBtn} transition-all">
                    ${ICONS.navigation}
                    <span>Como Chegar</span>
                  </a>`
                : ""
            }
          </div>
        </div>

        <div class="lg:col-span-5 relative">
          <div class="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            <img src="${heroPhoto}" alt="${nome}" class="w-full h-80 sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700" loading="eager" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div class="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div>
                <p class="text-xs font-bold text-white">${nome}</p>
                <p class="text-[11px] text-white/70 flex items-center gap-1 mt-0.5">
                  <span class="text-red-400">${ICONS.mapPin}</span>
                  <span class="truncate max-w-[200px]">${endereco || "Localização verificada"}</span>
                </p>
              </div>
              <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                ${ICONS.shieldCheck} Verificado
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (heroVariant === "hero_full_dark") {
    heroHtml = `
      <div class="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 sm:p-14 text-center">
        <img src="${heroPhoto}" alt="${nome}" class="absolute inset-0 w-full h-full object-cover filter brightness-[0.25]" loading="eager" />
        <div class="relative z-10 max-w-3xl mx-auto space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md mx-auto ${p.badgeBg} ${p.badgeText} ${p.badgeBorder}">
            ${ICONS.shieldCheck}
            <span>Excelência & Experiência Comprovada</span>
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            ${headline}
          </h1>

          <p class="text-base sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            ${subheadline}
          </p>

          <div class="flex items-center justify-center gap-2 text-amber-400">
            ${ICONS.star}${ICONS.star}${ICONS.star}${ICONS.star}${ICONS.star}
            <span class="text-xs sm:text-sm text-white/90 ml-1 font-semibold">
              ${ratingDisplay} estrelas (${reviewsDisplay} avaliações reais no Google)
            </span>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
            ${
              telefoneLimpo
                ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-extrabold ${p.primaryBtn} transition-all hover:scale-105 active:scale-95 shadow-lg">
                    ${ICONS.whatsapp}
                    <span>Falar Agora no WhatsApp</span>
                  </a>`
                : ""
            }
            ${
              endereco
                ? `<a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold ${p.secondaryBtn} transition-all">
                    ${ICONS.navigation}
                    <span>Traçar Rota no Mapa</span>
                  </a>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  } else {
    // hero_editorial
    heroHtml = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-white/10 pb-12">
        <div class="lg:col-span-8 space-y-4">
          <span class="text-xs font-mono tracking-widest text-white/60 uppercase">
            // Presença Oficial • ${nome}
          </span>

          <h1 class="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            ${headline}
          </h1>

          <div class="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>

          <p class="text-base sm:text-lg text-white/80 leading-relaxed font-light max-w-xl">
            ${subheadline}
          </p>

          <div class="flex flex-wrap items-center gap-4 pt-2">
            ${
              telefoneLimpo
                ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold ${p.primaryBtn} transition-all shadow-lg">
                    ${ICONS.whatsapp}
                    <span>Atendimento Exclusivo</span>
                  </a>`
                : ""
            }
            ${
              endereco
                ? `<a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium ${p.secondaryBtn} transition-all">
                    ${ICONS.navigation}
                    <span>Ver Endereço</span>
                  </a>`
                : ""
            }
          </div>
        </div>

        <div class="lg:col-span-4">
          <div class="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-white/5 p-2">
            <img src="${ambientPhoto}" alt="${nome}" class="w-full h-72 sm:h-80 object-cover rounded-xl" />
            <div class="p-3 text-center">
              <p class="text-xs font-semibold text-white">${nome}</p>
              <p class="text-[11px] text-white/60">${endereco || "Atendimento qualificado"}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Renderização dos Serviços
  let servicesHtml = "";
  if (servicesVariant === "grid_cards") {
    const cards = servicesList
      .map((service, index) => {
        const photo = servicePhotos[index % servicePhotos.length];
        const itemWaUrl = telefoneLimpo
          ? `${whatsappBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de agendar ou saber mais sobre o serviço: ${service.title}.`)}`
          : "#";

        return `
          <div class="group rounded-2xl overflow-hidden border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${p.cardBg} ${p.cardBorder} ${p.cardText} ${p.cardHoverBorder} flex flex-col">
            <div class="h-44 w-full overflow-hidden relative">
              <img src="${photo}" alt="${escapeHtml(service.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span class="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                Serviço Oficial
              </span>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div class="space-y-1.5">
                <h3 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  ${escapeHtml(service.title)}
                </h3>
                <p class="text-xs text-white/75 leading-relaxed line-clamp-3">
                  ${escapeHtml(service.description)}
                </p>
              </div>

              ${
                telefoneLimpo
                  ? `<a href="${itemWaUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl text-xs font-semibold ${p.secondaryBtn} transition-all mt-auto">
                      ${ICONS.whatsapp}
                      <span>Solicitar no WhatsApp</span>
                    </a>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("\n");

    servicesHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`;
  } else {
    // lista_precos
    const rows = servicesList
      .map((service, index) => {
        const itemWaUrl = telefoneLimpo
          ? `${whatsappBaseUrl}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre o serviço: ${service.title}.`)}`
          : "#";

        return `
          <div class="p-4 sm:p-5 rounded-xl border backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${p.cardBg} ${p.cardBorder} ${p.cardHoverBorder}">
            <div class="flex items-start gap-3.5">
              <span class="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                0${index + 1}
              </span>
              <div class="space-y-0.5">
                <h3 class="text-sm sm:text-base font-bold text-white">
                  ${escapeHtml(service.title)}
                </h3>
                <p class="text-xs text-white/75 leading-relaxed max-w-lg">
                  ${escapeHtml(service.description)}
                </p>
              </div>
            </div>

            ${
              telefoneLimpo
                ? `<a href="${itemWaUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${p.primaryBtn} shrink-0">
                    <span>Agendar</span>
                    ${ICONS.arrowRight}
                  </a>`
                : ""
            }
          </div>
        `;
      })
      .join("\n");

    servicesHtml = `<div class="max-w-3xl mx-auto space-y-4">${rows}</div>`;
  }

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${nome} | Site Oficial</title>
  <meta name="description" content="${subheadline}">
  <meta name="robots" content="index, follow">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN (Autossuficiente) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            serif: ['"Playfair Display"', 'serif'],
          }
        }
      }
    }
  </script>
  <style>
    html { scroll-behavior: smooth; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: ${p.bgHex}; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  </style>
</head>
<body class="min-h-screen w-full font-sans antialiased text-white ${p.bgClass}">

  <!-- NAVBAR FIXA -->
  <header class="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl transition-all">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-extrabold tracking-tight text-base sm:text-lg text-white">
          ${nome}
        </span>
      </div>

      <div class="flex items-center gap-3">
        ${
          telefoneLimpo
            ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${p.primaryBtn} transition-all">
                ${ICONS.whatsapp}
                <span>Falar no WhatsApp</span>
              </a>`
            : ""
        }
        ${
          endereco
            ? `<a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium ${p.secondaryBtn} transition-all">
                ${ICONS.navigation}
                <span>Como Chegar</span>
              </a>`
            : ""
        }
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative overflow-hidden bg-gradient-to-b ${p.heroGradient} py-12 sm:py-20 px-4 sm:px-6">
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="max-w-6xl mx-auto relative z-10">
      ${heroHtml}
    </div>
  </section>

  <!-- SEÇÃO DE SERVIÇOS -->
  <section class="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
    <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
      <span class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${p.accentText}">
        Serviços & Especialidades
      </span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
        Soluções completas com padrão de excelência
      </h2>
      <p class="text-sm text-white/70">
        Conheça nossos principais procedimentos e fale diretamente conosco para agendamento.
      </p>
    </div>

    ${servicesHtml}
  </section>

  <!-- SEÇÃO DE LOCALIZAÇÃO DETERMINÍSTICA -->
  <section class="py-14 sm:py-20 px-4 sm:px-6 bg-black/40 border-t border-white/10">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-5 space-y-5">
          <span class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${p.accentText}">
            ${ICONS.mapPin} Localização & Atendimento
          </span>

          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
            Venha nos visitar ou trace sua rota pelo GPS
          </h2>

          <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <p class="text-xs text-white/60 font-semibold uppercase tracking-wider">Endereço Comercial</p>
            <p class="text-sm font-medium text-white leading-relaxed">
              ${endereco || "Endereço em atualização. Entre em contato para localização exata."}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold ${p.primaryBtn} transition-all">
              ${ICONS.navigation}
              <span>Abrir Rota no Google Maps</span>
            </a>

            ${
              telefoneLimpo
                ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${p.secondaryBtn} transition-all">
                    ${ICONS.whatsapp}
                    <span>WhatsApp</span>
                  </a>`
                : ""
            }
          </div>
        </div>

        <!-- IFRAME DO GOOGLE MAPS -->
        <div class="lg:col-span-7">
          <div class="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 h-80 sm:h-96 relative">
            ${
              mapsIframeUrl
                ? `<iframe
                    title="Mapa de localização - ${nome}"
                    src="${mapsIframeUrl}"
                    width="100%"
                    height="100%"
                    style="border: 0;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full h-full filter saturate-[1.1] contrast-[1.05]"
                  ></iframe>`
                : `<div class="flex flex-col items-center justify-center h-full p-6 text-center space-y-2 text-white/60">
                    ${ICONS.mapPin}
                    <p class="text-sm font-medium text-white">Mapa disponível via botão de rotas</p>
                    <a href="${comoChegarUrl}" target="_blank" rel="noreferrer" class="text-xs text-amber-400 hover:underline">
                      Abrir no Google Maps oficial
                    </a>
                  </div>`
            }
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER WHITE-LABEL -->
  <footer class="py-8 px-4 text-center text-xs text-white/60 border-t ${p.footerBg} ${p.footerBorder}">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <p>© ${currentYear} ${nome}. Todos os direitos reservados.</p>
      <div class="flex items-center gap-4 text-white/50 text-[11px]">
        <span>Presença Digital Oficial</span>
        ${endereco ? `<span>• ${endereco}</span>` : ""}
      </div>
    </div>
  </footer>

  <!-- BOTÃO FLUTUANTE DE WHATSAPP -->
  ${
    telefoneLimpo
      ? `<a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 group font-bold text-sm tracking-wide" aria-label="Falar no WhatsApp">
          ${ICONS.whatsappFloat}
          <span class="hidden sm:inline">WhatsApp</span>
        </a>`
      : ""
  }

</body>
</html>`;
}

/**
 * Dispara o download direto do arquivo .html gerado no navegador do usuário.
 */
export function downloadSiteHtml(data: ExportSiteData, customFilename?: string): void {
  const html = generateStandaloneSiteHtml(data);
  const baseSlug = (data.slug || data.nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const filename = customFilename || `${baseSlug || "site"}-site.html`;
  downloadHtmlString(filename, html);
}

/**
 * Faz download de uma string HTML genérica no navegador.
 */
export function downloadHtmlString(filename: string, htmlContent: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
