import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  ExternalLink,
  Flame,
  Zap,
  ShoppingBag,
  MapPin,
  ArrowRight,
  Ticket,
  Clock,
  Search,
  Briefcase,
  ShieldCheck,
  MessageCircle,
  Instagram,
  Wrench,
  X,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DealsService,
  CATEGORIES,
  getCategoryById,
  type DailyDeal,
  type ClaimDealResult,
  type ServiceProvider,
} from "@/modules/deals";
import { ClaimDealModal } from "@/components/public-profile/ClaimDealModal";
import { MuralLoyaltyLookupModal } from "@/components/loyalty/MuralLoyaltyLookupModal";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/hoje")({
  head: () => ({
    meta: [
      { title: "Mural de Oportunidades & Guia de Serviços de Hoje | EIA Link" },
      {
        name: "description",
        content:
          "Ofertas exclusivas, cupons do comércio local e os melhores prestadores de serviços da sua cidade em um só lugar.",
      },
      { property: "og:title", content: "Mural de Oportunidades & Guia de Serviços | EIA Link" },
      {
        property: "og:description",
        content:
          "Ofertas válidas hoje e profissionais recomendados na sua região.",
      },
      { name: "theme-color", content: "#07070d" },
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
  const seconds = Math.floor((diff % 1000) / 1000);
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function FlashCountdown({ expiresAt }: { expiresAt: string }) {
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % 1000) / 1000);
      setRemainingTime(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
      <Clock className="h-3 w-3 text-amber-400" />
      <span>Termina em {remainingTime || "00h 00m 00s"}</span>
    </span>
  );
}

function HojePage() {
  const [selectedCity, setSelectedCity] = useState("Teixeira de Freitas");
  const [activeTab, setActiveTab] = useState<"deals" | "providers">("deals");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(getTimeLeftToday());
  const [selectedDealForModal, setSelectedDealForModal] = useState<DailyDeal | null>(null);

  // Relógio regressivo em tempo real até 23:59:59
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeftToday());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca de ofertas e prestadores
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      DealsService.getActiveCityDeals(selectedCity, selectedCategory, searchQuery),
      DealsService.getActiveCityProviders(selectedCity, selectedCategory, searchQuery),
    ])
      .then(([dealsData, providersData]) => {
        if (isMounted) {
          setDeals(dealsData);
          setProviders(providersData);
        }
      })
      .catch((err) => {
        console.error("[HojePage] Falha ao carregar oportunidades:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedCategory, searchQuery]);

  const handleOpenClaimModal = (deal: DailyDeal) => {
    const isSoldOut = deal.max_claims != null && deal.claims_count >= deal.max_claims;
    if (isSoldOut) {
      toast.error("Ops! Os cupons desta oferta estão esgotados para hoje.");
      return;
    }
    setSelectedDealForModal(deal);
  };

  const handleClaimSuccess = (_res: ClaimDealResult) => {
    if (!selectedDealForModal) return;
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === selectedDealForModal.id) {
          const newCount = (d.claims_count || 0) + 1;
          return { ...d, claims_count: newCount };
        }
        return d;
      })
    );
  };

  const currentCategoryInfo = useMemo(
    () => getCategoryById(selectedCategory),
    [selectedCategory]
  );

  return (
    <div className="dark min-h-screen bg-[#07070d] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
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
              <span className="text-[10px] text-slate-400 -mt-0.5 hidden sm:inline">
                Mural Local de Oportunidades & Serviços
              </span>
            </div>
          </Link>

          {/* Ações do Topo: Meus Pontos VIP + Badge de Contagem Regressiva */}
          <div className="flex items-center gap-2.5">
            <MuralLoyaltyLookupModal />

            {/* Badge de Contagem Regressiva */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-slate-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden sm:inline font-medium text-slate-200">
                Ofertas válidas até 23:59:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO & SELEÇÃO DE CIDADE */}
      <section className="pt-8 pb-4 px-4 sm:px-6 max-w-6xl mx-auto w-full text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400 animate-pulse" />
          Mural Oficial de Oportunidades & Serviços
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
          O Que Você Procura em{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            {selectedCity}
          </span>
          ?
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Cupons limitados do comércio local e profissionais autônomos recomendados diretamente no WhatsApp.
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
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/15"
              }`}
            >
              <MapPin className="h-3 w-3" />
              {cityName}
            </button>
          ))}
        </div>
      </section>

      {/* NAVEGAÇÃO PRINCIPAL (TABS) & BUSCA & CATEGORIAS */}
      <section className="sticky top-16 z-30 w-full bg-[#07070d]/90 backdrop-blur-xl border-y border-white/10 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Alternador de Modo: Ofertas vs Prestadores */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.06] border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab("deals")}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "deals"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>Ofertas & Cupons ({deals.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("providers")}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "providers"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Profissionais & Serviços ({providers.length})</span>
              </button>
            </div>

            {/* Input de Busca em Tempo Real */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "deals"
                    ? `Buscar promoções em ${selectedCity}...`
                    : `Buscar eletricista, diarista, salão em ${selectedCity}...`
                }
                className="pl-9 pr-8 h-9 text-xs bg-white/[0.05] border-white/15 rounded-xl placeholder:text-slate-500 focus-visible:ring-emerald-500/40 text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Carrossel de Categorias */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white text-black font-bold shadow-md shadow-white/10 scale-105"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Banner Promocional do Clube de Pontos & Recompensas */}
          <div className="pt-2">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                  <Coins className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Clube de Pontos & Prêmios do Comércio Local
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] py-0">
                      100% Grátis
                    </Badge>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pontue ao comprar nas lojas participantes escaneando o QR Code da notinha ou balcão. Sem baixar nenhum app!
                  </p>
                </div>
              </div>
              <MuralLoyaltyLookupModal
                triggerButton={
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 shadow-md h-9 gap-1.5"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>Consultar Meus Pontos</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEED PRINCIPAL */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">
              Buscando oportunidades em {selectedCity}...
            </p>
          </div>
        ) : activeTab === "deals" ? (
          /* TAB 1: OFERTAS & CUPONS */
          deals.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto rounded-3xl border border-dashed border-white/10 bg-white/[0.02] space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="h-7 w-7 text-emerald-400/80" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">
                  Nenhuma oferta encontrada em {selectedCity}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCategory !== "todas"
                    ? `Não há ofertas ativas na categoria "${currentCategoryInfo.label}" hoje. Tente outra categoria ou remova os filtros.`
                    : "Novas oportunidades são cadastradas pelos lojistas todas as manhãs. Volte mais tarde ou anuncie seu negócio!"}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {selectedCategory !== "todas" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("todas")}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Ver Todas as Categorias
                  </button>
                )}
                <Link
                  to="/pages"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  <span>Anunciar Minha Loja</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* SEÇÃO FLASH / OFERTAS RELÂMPAGO */}
              {(() => {
                const flashDeals = deals.filter(
                  (d) => d.is_flash && (!d.expires_at || new Date(d.expires_at) > new Date())
                );
                if (flashDeals.length === 0) return null;

                return (
                  <section className="p-5 sm:p-7 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/[0.03] to-transparent backdrop-blur-md shadow-2xl shadow-amber-500/5 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                          <span>Vagas Imediatas & Horários Ociosos</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                          ⚡ Ofertas Relâmpago das Próximas Horas
                        </h2>
                        <p className="text-xs text-amber-200/80">
                          Horários ociosos com super desconto. Expira logo!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {flashDeals.map((deal) => {
                        const companyUrl = deal.slug ? `/p/${deal.slug}` : "#";
                        const isSoldOut =
                          deal.max_claims != null && deal.claims_count >= deal.max_claims;
                        const remaining =
                          deal.max_claims != null
                            ? Math.max(0, deal.max_claims - deal.claims_count)
                            : null;
                        const percentage =
                          deal.max_claims != null
                            ? Math.min(
                                100,
                                Math.round((deal.claims_count / deal.max_claims) * 100)
                              )
                            : null;

                        return (
                          <div
                            key={deal.id}
                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-amber-500/40 bg-[#120a1c]/95 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300"
                          >
                            {/* Foto ou Ilustração */}
                            <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03]">
                              {deal.image_url ? (
                                <img
                                  src={deal.image_url}
                                  alt={deal.title}
                                  className={`h-full w-full object-cover transition-transform duration-500 ${
                                    isSoldOut
                                      ? "grayscale filter brightness-75"
                                      : "group-hover:scale-105"
                                  }`}
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-indigo-950/20 text-muted-foreground">
                                  <Zap className="h-10 w-10 text-amber-400/70 mb-2 animate-bounce" />
                                  <span className="text-xs font-medium text-white/70 text-center">
                                    {deal.business_name || "Comércio Local"}
                                  </span>
                                </div>
                              )}

                              {/* Badge de Relâmpago */}
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-amber-500 text-black font-extrabold text-[11px] px-2.5 py-0.5 shadow-lg shadow-amber-500/40 border-0 flex items-center gap-1">
                                  <Zap className="h-3 w-3 fill-black text-black" />
                                  RELÂMPAGO
                                </Badge>
                              </div>

                              {/* Contador regressivo */}
                              {deal.expires_at && (
                                <div className="absolute bottom-3 right-3">
                                  <FlashCountdown expiresAt={deal.expires_at} />
                                </div>
                              )}
                            </div>

                            {/* Conteúdo */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-amber-300/80">
                                  <span className="font-semibold truncate">
                                    {deal.business_name || "Empresa Local"}
                                  </span>
                                  {deal.niche && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
                                      {deal.niche}
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                                  {deal.title}
                                </h3>

                                {deal.description && (
                                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                    {deal.description}
                                  </p>
                                )}
                              </div>

                              {/* Preços e Gatilho */}
                              <div className="space-y-3 pt-2 border-t border-amber-500/20">
                                <div className="flex items-baseline justify-between gap-2">
                                  <div>
                                    {deal.original_price && deal.original_price > deal.deal_price && (
                                      <span className="text-xs text-slate-400 line-through mr-2">
                                        {formatPrice(deal.original_price)}
                                      </span>
                                    )}
                                    <span className="text-xl font-black text-amber-400">
                                      {formatPrice(deal.deal_price)}
                                    </span>
                                  </div>

                                  {deal.discount_badge && (
                                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                                      {deal.discount_badge}
                                    </Badge>
                                  )}
                                </div>

                                {/* Barra de Escassez */}
                                {percentage != null && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300">
                                        {isSoldOut ? (
                                          <span className="text-red-400 font-bold">
                                            Esgotado por hoje
                                          </span>
                                        ) : (
                                          `${remaining} vaga(s) disponível(is)`
                                        )}
                                      </span>
                                      <span className="text-amber-400/80 font-mono">
                                        {percentage}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          isSoldOut
                                            ? "bg-red-500"
                                            : "bg-gradient-to-r from-amber-500 to-amber-300"
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Ações */}
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenClaimModal(deal)}
                                    disabled={isSoldOut}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                                      isSoldOut
                                        ? "bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed"
                                        : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/20 hover:scale-[1.02]"
                                    }`}
                                  >
                                    <Ticket className="h-4 w-4" />
                                    <span>{isSoldOut ? "Esgotado" : "Resgatar Desconto"}</span>
                                  </button>

                                  {deal.slug && (
                                    <Link
                                      to={companyUrl}
                                      className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-white transition-colors"
                                      title="Ver página da empresa"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* SEÇÃO GERAL DE OFERTAS & BENEFÍCIOS */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      Todas as Ofertas de Hoje em {selectedCity}
                    </h2>
                    <p className="text-xs text-slate-300">
                      Resgate seu cupom e apresente diretamente no atendimento.
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    Exibindo <span className="text-white font-bold">{deals.length}</span>{" "}
                    {deals.length === 1 ? "oferta" : "ofertas"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deals.map((deal) => {
                    const companyUrl = deal.slug ? `/p/${deal.slug}` : "#";
                    const isSoldOut =
                      deal.max_claims != null && deal.claims_count >= deal.max_claims;
                    const remaining =
                      deal.max_claims != null
                        ? Math.max(0, deal.max_claims - deal.claims_count)
                        : null;
                    const percentage =
                      deal.max_claims != null
                        ? Math.min(
                            100,
                            Math.round((deal.claims_count / deal.max_claims) * 100)
                          )
                        : null;

                    return (
                      <div
                        key={deal.id}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all duration-300 shadow-xl"
                      >
                        {/* Imagem do Produto/Oferta */}
                        <div className="relative aspect-video w-full overflow-hidden bg-white/[0.02]">
                          {deal.image_url ? (
                            <img
                              src={deal.image_url}
                              alt={deal.title}
                              className={`h-full w-full object-cover transition-transform duration-500 ${
                                isSoldOut
                                  ? "grayscale filter brightness-75"
                                  : "group-hover:scale-105"
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-950/20 via-purple-950/20 to-indigo-950/20 text-muted-foreground">
                              <ShoppingBag className="h-10 w-10 text-emerald-400/60 mb-2" />
                              <span className="text-xs font-medium text-white/70 text-center">
                                {deal.business_name || "Comércio Local"}
                              </span>
                            </div>
                          )}

                          {deal.discount_badge && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-emerald-500 text-black font-extrabold text-[11px] px-2.5 py-0.5 shadow-lg shadow-emerald-500/30 border-0">
                                {deal.discount_badge}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span className="font-semibold text-emerald-400 truncate">
                                {deal.business_name || "Empresa Local"}
                              </span>
                              {deal.niche && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
                                  {deal.niche}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                              {deal.title}
                            </h3>

                            {deal.description && (
                              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                {deal.description}
                              </p>
                            )}
                          </div>

                          {/* Preços e Ações */}
                          <div className="space-y-3 pt-2 border-t border-white/10">
                            <div className="flex items-baseline justify-between gap-2">
                              <div>
                                {deal.original_price && deal.original_price > deal.deal_price && (
                                  <span className="text-xs text-slate-400 line-through mr-2">
                                    {formatPrice(deal.original_price)}
                                  </span>
                                )}
                                <span className="text-xl font-black text-white">
                                  {formatPrice(deal.deal_price)}
                                </span>
                              </div>

                              <span className="text-[11px] text-emerald-400/90 font-medium">
                                Válido hoje
                              </span>
                            </div>

                            {percentage != null && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-300">
                                    {isSoldOut ? (
                                      <span className="text-red-400 font-bold">
                                        Cupons esgotados
                                      </span>
                                    ) : (
                                      `${remaining} cupons restantes`
                                    )}
                                  </span>
                                  <span className="text-slate-400 font-mono">{percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isSoldOut ? "bg-red-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenClaimModal(deal)}
                                disabled={isSoldOut}
                                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                                  isSoldOut
                                    ? "bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 hover:scale-[1.02]"
                                }`}
                              >
                                <Ticket className="h-4 w-4" />
                                <span>{isSoldOut ? "Esgotado" : "Pegar Cupom Grátis"}</span>
                              </button>

                              {deal.slug && (
                                <Link
                                  to={companyUrl}
                                  className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-white transition-colors"
                                  title="Ver página da empresa"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )
        ) : (
          /* TAB 2: GUIA DE PROFISSIONAIS & PRESTADORES DE SERVIÇO */
          providers.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto rounded-3xl border border-dashed border-white/10 bg-white/[0.02] space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Briefcase className="h-7 w-7 text-indigo-400/80" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">
                  Nenhum profissional encontrado em {selectedCity}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCategory !== "todas"
                    ? `Ainda não temos profissionais listados na categoria "${currentCategoryInfo.label}" nesta cidade.`
                    : "Você presta serviços ou é profissional autônomo? Cadastre seu perfil e receba contatos diretos no WhatsApp!"}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {selectedCategory !== "todas" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("todas")}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Ver Todas as Categorias
                  </button>
                )}
                <Link
                  to="/pages"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Cadastrar Meu Serviço Grátis</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-400" />
                    Profissionais & Serviços Recomendados em {selectedCity}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Fale diretamente no WhatsApp com prestadores de serviços verificados.
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  Exibindo <span className="text-white font-bold">{providers.length}</span>{" "}
                  {providers.length === 1 ? "prestador" : "prestadores"}
                </span>
              </div>

              {/* Grid de Cards de Prestadores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => {
                  const profileUrl = provider.slug ? `/p/${provider.slug}` : "#";
                  const cleanWhatsApp = provider.whatsapp
                    ? provider.whatsapp.replace(/\D/g, "")
                    : "";
                  const waNumber = cleanWhatsApp.startsWith("55")
                    ? cleanWhatsApp
                    : `55${cleanWhatsApp}`;
                  const waMessage = encodeURIComponent(
                    `Olá ${provider.display_name}! Vi seu perfil no Mural do EIA Link em ${provider.city} e gostaria de solicitar um orçamento sobre os seus serviços.`
                  );
                  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

                  return (
                    <div
                      key={provider.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] hover:border-indigo-500/50 hover:bg-white/[0.05] transition-all duration-300 shadow-xl"
                    >
                      {/* Banner de Capa */}
                      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900">
                        {provider.cover_url ? (
                          <img
                            src={provider.cover_url}
                            alt={provider.display_name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center opacity-30">
                            <Wrench className="h-10 w-10 text-indigo-300" />
                          </div>
                        )}

                        {/* Tag de Categoria */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/75 backdrop-blur-md text-white border border-white/20 text-[10px] px-2.5 py-0.5">
                            {provider.niche || provider.category}
                          </Badge>
                        </div>

                        {provider.is_verified && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-black shadow-sm">
                              <ShieldCheck className="h-3 w-3 fill-black text-black" />
                              Verificado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Foto / Avatar em Overlay */}
                      <div className="px-5 -mt-8 flex items-end justify-between">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#07070d] bg-slate-800 shadow-xl">
                          {provider.avatar_url ? (
                            <img
                              src={provider.avatar_url}
                              alt={provider.display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-black text-white text-lg bg-indigo-600">
                              {provider.display_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          <span>{provider.city}</span>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors">
                              {provider.display_name}
                            </h3>
                            <p className="text-xs text-indigo-300/90 font-medium">
                              {provider.niche || "Prestador de Serviços"}
                            </p>
                          </div>

                          {provider.description && (
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {provider.description}
                            </p>
                          )}

                          {/* Chips de Serviços Oferecidos */}
                          {provider.services && provider.services.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1.5">
                              {provider.services.slice(0, 3).map((srv, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-200 border border-white/10"
                                >
                                  {srv.name}
                                </span>
                              ))}
                              {provider.services.length > 3 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{provider.services.length - 3} mais
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="flex items-center gap-2">
                            {provider.whatsapp ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>Chamar no WhatsApp</span>
                              </a>
                            ) : (
                              <Link
                                to={profileUrl}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
                              >
                                <span>Ver Contato</span>
                              </Link>
                            )}

                            {provider.slug && (
                              <Link
                                to={profileUrl}
                                className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-white transition-colors"
                                title="Ver Perfil Completo PWA"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}

                            {provider.instagram && (
                              <a
                                href={
                                  provider.instagram.startsWith("http")
                                    ? provider.instagram
                                    : `https://instagram.com/${provider.instagram.replace(/^@/, "")}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-pink-400 hover:text-pink-300 transition-colors"
                                title="Ver Instagram"
                              >
                                <Instagram className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </main>

      {/* Modal Inteligente de Resgate com Travas de Limite e Código EIA-XXXX */}
      <ClaimDealModal
        isOpen={!!selectedDealForModal}
        onClose={() => setSelectedDealForModal(null)}
        deal={selectedDealForModal}
        onSuccess={handleClaimSuccess}
      />

      {/* RODAPÉ EXECUTIVO */}
      <footer className="mt-auto border-t border-white/10 bg-[#050508] py-8 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-slate-300">
            É lojista ou prestador de serviços e quer divulgar sua empresa ou profissão aqui?{" "}
            <Link
              to="/pages"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Crie seu EIA Link grátis
            </Link>{" "}
            e anuncie para milhares de pessoas na sua cidade.
          </p>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} EIA Link — O ecossistema de alta conversão para o comércio local.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HojePage;

