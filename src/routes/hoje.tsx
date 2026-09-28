import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Clock,
  ExternalLink,
  MessageCircle,
  Building2,
  ChevronRight,
  Flame,
  Zap,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { DealsService, type DailyDeal } from "@/modules/deals";

export const Route = createFileRoute("/hoje")({
  head: () => ({
    meta: [
      { title: "Mural de Oportunidades de Hoje | EIA Link" },
      {
        name: "description",
        content: "Ofertas exclusivas e válidas apenas hoje no comércio local. Economize com benefícios reais no WhatsApp.",
      },
      { property: "og:title", content: "Mural de Oportunidades de Hoje | EIA Link" },
      {
        property: "og:description",
        content: "Ofertas exclusivas e válidas apenas hoje no comércio local.",
      },
      { name: "theme-color", content: "#10081d" },
    ],
  }),
  component: HojePage,
});

const POPULAR_CITIES = [
  "Teixeira de Freitas",
  "Itamaraju",
  "Eunápolis",
  "Porto Seguro",
];

function getTimeLeftToday() {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const diff = Math.max(0, endOfDay.getTime() - now.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function formatPrice(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function HojePage() {
  const [selectedCity, setSelectedCity] = useState("Teixeira de Freitas");
  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(getTimeLeftToday());

  // Relógio regressivo em tempo real até 23:59:59
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeftToday());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca de ofertas ativas
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    DealsService.getActiveCityDeals(selectedCity)
      .then((data) => {
        if (isMounted) {
          setDeals(data);
        }
      })
      .catch((err) => {
        console.error("[HojePage] Falha ao carregar ofertas:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const handleClaim = (deal: DailyDeal) => {
    void DealsService.trackDealClick(deal.id);

    const message = `Olá! Vi a oferta "${deal.title}" no Mural do EIA Link e quero resgatar!`;

    if (deal.claim_action_url) {
      window.open(deal.claim_action_url, "_blank", "noopener,noreferrer");
      return;
    }

    const cleanPhone = deal.whatsapp_number ? deal.whatsapp_number.replace(/\D/g, "") : "";
    if (cleanPhone) {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (deal.slug) {
      window.open(`/p/${deal.slug}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-foreground flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Glow de Iluminação Superior */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-900/15 via-emerald-950/10 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* CABEÇALHO EXECUTIVO */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07070d]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo EIA Link */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="EIA Link Início"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-[#10081d] rounded-[11px] flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                EIA Link
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
                  Hoje
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:inline">
                Mural Local de Oportunidades
              </span>
            </div>
          </Link>

          {/* Badge de Contagem Regressiva */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-muted-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline font-medium text-foreground">Ofertas válidas até 23:59:</span>
            <span className="font-mono font-bold text-emerald-400">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </span>
          </div>
        </div>
      </header>

      {/* HERO & SELEÇÃO DE CIDADE */}
      <section className="pt-8 pb-6 px-4 sm:px-6 max-w-6xl mx-auto w-full text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400 animate-pulse" />
          Mural Oficial de Oportunidades
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
          As Melhores Ofertas do Dia em{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            {selectedCity}
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Condições exclusivas negociadas diretamente com lojistas locais. Resgate seu desconto pelo WhatsApp sem intermediários.
        </p>

        {/* Seletor de Cidades em Chips Modernos */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {POPULAR_CITIES.map((cityName) => (
            <button
              key={cityName}
              type="button"
              onClick={() => setSelectedCity(cityName)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedCity === cityName
                  ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/25 scale-105"
                  : "bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground hover:text-white border border-white/10"
              }`}
            >
              <MapPin className="h-3 w-3" />
              {cityName}
            </button>
          ))}
        </div>
      </section>

      {/* FEED DE OFERTAS EM GRID */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Buscando as oportunidades ativas de hoje...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto rounded-3xl border border-dashed border-white/10 bg-white/[0.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="h-7 w-7 text-emerald-400/80" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Nenhuma oferta ativa hoje em {selectedCity}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Novas oportunidades são cadastradas pelos lojistas todas as manhãs. Volte mais tarde ou anuncie o seu negócio!
              </p>
            </div>
            <Link
              to="/pages"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/15 transition-all"
            >
              <span>Cadastrar Minha Loja</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const companyUrl = deal.slug ? `/p/${deal.slug}` : "#";
              const discountText = deal.discount_badge || (deal.original_price ? "CONDIÇÃO DO DIA" : "OFERTA VIP");

              return (
                <div
                  key={deal.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#10081d]/90 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
                >
                  {/* Foto do Produto/Serviço ou Imagem Padrão */}
                  <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03]">
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-emerald-950/20 text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 text-emerald-400/50 mb-2" />
                        <span className="text-xs font-medium text-white/60 text-center">
                          {deal.business_name || "Comércio Local"}
                        </span>
                      </div>
                    )}

                    {/* Gradiente Escuro de Sobreposição para Leitura */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10081d] via-[#10081d]/30 to-transparent" />

                    {/* Badge de Desconto / Destaque */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-500 text-black shadow-lg shadow-emerald-500/30">
                        <Sparkles className="h-3 w-3 fill-black" />
                        {discountText}
                      </span>
                    </div>

                    {/* Cidade & Nicho */}
                    <div className="absolute bottom-2.5 left-3.5 flex items-center gap-2 text-[11px] font-medium text-white/80">
                      <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 text-emerald-400" />
                        {deal.city || selectedCity}
                      </span>
                      {deal.niche && (
                        <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-muted-foreground capitalize">
                          {deal.niche}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Empresa Responsável com Link Oficial */}
                      <a
                        href={companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 group/company focus:outline-none"
                      >
                        {deal.avatar_url ? (
                          <img
                            src={deal.avatar_url}
                            alt={deal.business_name || "Loja"}
                            className="h-6 w-6 rounded-full object-cover border border-white/15"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
                            {(deal.business_name || "L").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-muted-foreground group-hover/company:text-emerald-300 transition-colors flex items-center gap-1">
                          {deal.business_name || "Empresa Verificada"}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </span>
                      </a>

                      {/* Título da Oferta */}
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                        {deal.title}
                      </h3>

                      {/* Descrição */}
                      {deal.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {deal.description}
                        </p>
                      )}
                    </div>

                    {/* Preços e Botão de Resgate */}
                    <div className="pt-2 border-t border-white/10 space-y-3">
                      <div className="flex items-baseline gap-2.5">
                        {deal.original_price != null && deal.original_price > deal.deal_price && (
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">De</span>
                            <span className="text-xs line-through text-muted-foreground">
                              {formatPrice(deal.original_price)}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Hoje por</span>
                          <span className="text-2xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
                            {formatPrice(deal.deal_price)}
                          </span>
                        </div>
                      </div>

                      {/* Botão de Ação: Resgatar no WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleClaim(deal)}
                        className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Zap className="h-4 w-4 fill-black" />
                        <span>Resgatar Oferta no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* RODAPÉ EXECUTIVO */}
      <footer className="mt-auto border-t border-white/10 bg-[#050508] py-8 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-muted-foreground">
            É lojista ou prestador de serviços e quer divulgar sua oferta aqui?{" "}
            <Link
              to="/pages"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Crie seu EIA Link grátis
            </Link>{" "}
            e anuncie para milhares de pessoas na sua cidade.
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} EIA Link — O ecossistema de alta conversão para o comércio local.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HojePage;

