import React, { useState, useEffect, useMemo } from "react";
import {
  Flame,
  Copy,
  Share2,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  MousePointerClick,
  Check,
  Building2,
  Plus,
  Ticket,
  Network,
  Trash2,
  ArrowRightLeft,
  Store,
  Tag,
  MapPin,
  Briefcase,
  Search,
  Zap,
  Send,
  Target,
  Loader2,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  DealsService,
  CrossTrafficService,
  OfferHunterService,
  type DailyDeal,
  type CrossTrafficPartnership,
  type HuntedDeal,
  type HuntedProvider,
} from "@/modules/deals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export function DailyDealsBroadcastCard() {
  const [city, setCity] = useState("Teixeira de Freitas");
  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Caçador de Ofertas & Prestadores (Offer Hunter AI) states
  const [hunterType, setHunterType] = useState<"deals" | "providers">("deals");
  const [hunterCity, setHunterCity] = useState("Teixeira de Freitas");
  const [hunterNiche, setHunterNiche] = useState("Gastronomia & Delivery");
  const [hunterTargetUrl, setHunterTargetUrl] = useState("");
  const [hunterResults, setHunterResults] = useState<HuntedDeal[]>([]);
  const [huntedProviders, setHuntedProviders] = useState<HuntedProvider[]>([]);
  const [isHunting, setIsHunting] = useState(false);
  const [publishingDealId, setPublishingDealId] = useState<string | null>(null);
  const [publishingProviderId, setPublishingProviderId] = useState<string | null>(null);
  const [publishedDealsMap, setPublishedDealsMap] = useState<
    Record<string, { muralUrl: string; pageUrl: string; slug: string }>
  >({});
  const [publishedProvidersMap, setPublishedProvidersMap] = useState<
    Record<string, { muralUrl: string; pageUrl: string; slug: string }>
  >({});

  // Modal para criação de oferta
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPages, setUserPages] = useState<{ id: string; display_name: string; slug: string }[]>([]);

  // Form states - Oferta
  const [selectedBioPageId, setSelectedBioPageId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [discountBadge, setDiscountBadge] = useState("30% OFF");
  const [maxClaims, setMaxClaims] = useState("10");
  const [dealCity, setDealCity] = useState("Teixeira de Freitas");
  const [dealNiche, setDealNiche] = useState("");

  // Parcerias Cruzadas states
  const [hostPageId, setHostPageId] = useState("");
  const [partnerPageId, setPartnerPageId] = useState("");
  const [benefitText, setBenefitText] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("Parceiro da Rede");
  const [savingPartnership, setSavingPartnership] = useState(false);
  const [partnerships, setPartnerships] = useState<CrossTrafficPartnership[]>([]);
  const [loadingPartnerships, setLoadingPartnerships] = useState(false);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const data = await DealsService.getActiveCityDeals(city);
      setDeals(data);
    } catch (err) {
      console.error("[DailyDealsBroadcastCard] Erro ao buscar ofertas:", err);
      toast.error("Erro ao carregar ofertas de hoje.");
    } finally {
      setLoading(false);
    }
  };

  const handleHuntDeals = async () => {
    setIsHunting(true);
    try {
      const results = await OfferHunterService.huntCityDeals({
        city: hunterCity || city,
        niche: hunterNiche,
        targetUrl: hunterTargetUrl,
      });
      setHunterResults(results);
      if (results.length > 0) {
        toast.success(`${results.length} oportunidades rastreadas com sucesso!`);
      } else {
        toast.info("Nenhuma promoção rastreada com esses filtros. Tente outro nicho ou cidade.");
      }
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao caçar ofertas:", err);
      toast.error(err?.message || "Erro ao rastrear ofertas.");
    } finally {
      setIsHunting(false);
    }
  };

  const handlePublishHuntedDeal = async (deal: HuntedDeal) => {
    setPublishingDealId(deal.id);
    try {
      const res = await OfferHunterService.publishHuntedDeal(deal);
      setPublishedDealsMap((prev) => ({
        ...prev,
        [deal.id]: {
          muralUrl: res.muralUrl,
          pageUrl: res.pageUrl,
          slug: res.slug,
        },
      }));
      setHunterResults((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, status: "published" as const } : d))
      );
      toast.success(`Oferta da ${deal.business_name} publicada no Mural de Hoje!`);
      fetchDeals();
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao publicar oferta garimpada:", err);
      toast.error(err?.message || "Erro ao publicar oferta no mural.");
    } finally {
      setPublishingDealId(null);
    }
  };

  const handleHuntProviders = async () => {
    setIsHunting(true);
    try {
      const results = await OfferHunterService.huntCityProviders({
        city: hunterCity || city,
        niche: hunterNiche,
        targetUrl: hunterTargetUrl,
      });
      setHuntedProviders(results);
      if (results.length > 0) {
        toast.success(`${results.length} prestadores e negócios locais rastreados com sucesso!`);
      } else {
        toast.info("Nenhum profissional encontrado com os filtros informados. Tente outro nicho ou termo.");
      }
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao rastrear prestadores:", err);
      toast.error(err?.message || "Erro ao rastrear prestadores de serviços.");
    } finally {
      setIsHunting(false);
    }
  };

  const handlePublishProvider = async (provider: HuntedProvider) => {
    setPublishingProviderId(provider.id);
    try {
      const res = await OfferHunterService.publishHuntedProvider(provider);
      setPublishedProvidersMap((prev) => ({
        ...prev,
        [provider.id]: res,
      }));
      setHuntedProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, status: "published" as const } : p))
      );
      toast.success(`Profissional "${provider.display_name}" publicado no Guia com sucesso!`);
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao publicar prestador:", err);
      toast.error(err?.message || "Erro ao publicar prestador de serviços.");
    } finally {
      setPublishingProviderId(null);
    }
  };

  const fetchUserPages = async () => {
    try {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, display_name, slug")
        .order("created_at", { ascending: false })
        .limit(50);

      const pages = (data || []) as { id: string; display_name: string; slug: string }[];
      setUserPages(pages);
      if (pages.length > 0) {
        if (!selectedBioPageId) setSelectedBioPageId(pages[0].id);
        if (!hostPageId) setHostPageId(pages[0].id);
        if (pages.length > 1 && !partnerPageId) setPartnerPageId(pages[1].id);
      }
    } catch (err) {
      console.warn("[DailyDealsBroadcastCard] Erro ao buscar páginas:", err);
    }
  };

  const fetchHostPartnerships = async (pageId: string) => {
    if (!pageId) {
      setPartnerships([]);
      return;
    }
    setLoadingPartnerships(true);
    try {
      const data = await CrossTrafficService.getPartnershipsForPage(pageId);
      setPartnerships(data);
    } catch (err) {
      console.error("[DailyDealsBroadcastCard] Erro ao buscar parcerias:", err);
    } finally {
      setLoadingPartnerships(false);
    }
  };

  useEffect(() => {
    void fetchDeals();
    void fetchUserPages();
  }, [city]);

  useEffect(() => {
    if (hostPageId) {
      void fetchHostPartnerships(hostPageId);
    }
  }, [hostPageId]);

  useEffect(() => {
    setDealCity(city);
  }, [city]);

  const formattedBroadcastMessage = useMemo(() => {
    return DealsService.formatDailyWhatsAppBroadcast(deals, city);
  }, [deals, city]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedBroadcastMessage);
      setCopied(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Não foi possível copiar o texto automaticamente.");
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(formattedBroadcastMessage);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBioPageId) {
      toast.error("Selecione a empresa dona da oferta.");
      return;
    }
    if (!title.trim() || !dealPrice.trim()) {
      toast.error("Preencha o título e o valor da oferta.");
      return;
    }

    const parsedDealPrice = parseFloat(dealPrice.replace(",", "."));
    if (isNaN(parsedDealPrice) || parsedDealPrice <= 0) {
      toast.error("O preço da oferta deve ser maior que zero.");
      return;
    }

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null;
    if (parsedOriginalPrice !== null && (isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0)) {
      toast.error("O preço normal deve ser maior que zero se informado.");
      return;
    }

    const parsedMaxClaims = maxClaims.trim() ? parseInt(maxClaims.trim(), 10) : null;
    if (parsedMaxClaims !== null && (isNaN(parsedMaxClaims) || parsedMaxClaims <= 0)) {
      toast.error("O limite de cupons deve ser um número inteiro positivo.");
      return;
    }

    setSaving(true);
    try {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      await DealsService.createDailyDeal({
        bio_page_id: selectedBioPageId,
        title: title.trim(),
        description: description.trim() || null,
        original_price: parsedOriginalPrice,
        deal_price: parsedDealPrice,
        discount_badge: discountBadge.trim() || null,
        max_claims: parsedMaxClaims,
        city: dealCity.trim() || city,
        niche: dealNiche.trim() || null,
        expires_at: endOfDay.toISOString(),
      });

      toast.success("🎉 Oferta com limite de cupons publicada com sucesso!");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setOriginalPrice("");
      setDealPrice("");
      setDealNiche("");
      await fetchDeals();
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao criar oferta:", err);
      toast.error(err.message || "Erro ao criar oferta.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostPageId || !partnerPageId) {
      toast.error("Selecione as duas empresas da parceria.");
      return;
    }
    if (hostPageId === partnerPageId) {
      toast.error("Selecione empresas diferentes para a parceria mútua.");
      return;
    }
    if (!benefitText.trim()) {
      toast.error("Informe o benefício que o parceiro oferece aos clientes.");
      return;
    }

    setSavingPartnership(true);
    try {
      await CrossTrafficService.createPartnership(
        hostPageId,
        partnerPageId,
        benefitText.trim(),
        badgeLabel.trim() || "Parceiro da Rede"
      );
      toast.success("🤝 Parceria mútua de tráfego cruzado ativada com sucesso!");
      setBenefitText("");
      await fetchHostPartnerships(hostPageId);
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao criar parceria:", err);
      toast.error(err.message || "Erro ao conectar parceria cruzada.");
    } finally {
      setSavingPartnership(false);
    }
  };

  const handleDeletePartnership = async (id: string) => {
    try {
      await CrossTrafficService.deletePartnership(id);
      toast.success("Parceria removida com sucesso.");
      setPartnerships((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error("Erro ao remover parceria.");
    }
  };

  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                <Flame className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Mural do Dia & Tráfego Cruzado
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Central de Oportunidades & Parcerias Locais
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Gerencie ofertas com gatilhos de escassez, disparos no WhatsApp e conecte parcerias cruzadas entre lojistas.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeals}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 text-xs gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Oferta do Dia
            </Button>
            <a
              href="/hoje"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium"
            >
              <span>Ver Mural /hoje</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <Tabs defaultValue="broadcast" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-xl mb-4 bg-muted/60">
            <TabsTrigger value="broadcast" className="text-xs gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              Mural & Disparo
            </TabsTrigger>
            <TabsTrigger value="hunter" className="text-xs gap-1.5 font-semibold text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Caçador de Ofertas (IA)
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="text-xs gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
              Parcerias Cruzadas
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MURAL & DISPARO WHATSAPP */}
          <TabsContent value="broadcast" className="space-y-5 mt-0">
            {/* Barra de Status e Cidades */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Cidade ativa:</span>
                <div className="flex items-center gap-1.5">
                  {["Teixeira de Freitas", "Itamaraju", "Eunápolis", "Porto Seguro"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        city === c
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <Badge variant="outline" className="bg-background/80 text-[11px] gap-1">
                <Clock className="h-3 w-3 text-amber-400" />
                {deals.length} {deals.length === 1 ? "oferta ativa" : "ofertas ativas"} hoje
              </Badge>
            </div>

            {/* Prévia da Mensagem do WhatsApp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <span>Prévia da Mensagem Formatada</span>
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Gatilhos de escassez e links gerados automaticamente
                </span>
              </div>

              <div className="relative rounded-xl border border-emerald-500/30 bg-[#0c1410] p-4 text-xs font-mono text-emerald-200/95 leading-relaxed whitespace-pre-wrap shadow-inner overflow-x-auto max-h-56">
                {formattedBroadcastMessage}
              </div>

              {/* Botões de Ação do Disparo */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={handleCopyMessage}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 hover:bg-muted/80"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar Mensagem
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleShareWhatsApp}
                  size="sm"
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </div>

            {/* Lista resumida de ofertas ativas */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ofertas cadastradas no banco ({deals.length})
              </h4>

              {loading ? (
                <p className="text-xs text-muted-foreground animate-pulse py-2">Carregando ofertas...</p>
              ) : deals.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Nenhuma oferta ativa cadastrada hoje para {city}.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="text-xs gap-1.5 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Cadastrar Primeira Oferta
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {deals.map((deal) => {
                    const maxClaimsNum = deal.max_claims;
                    const claimsCount = deal.claims_count || 0;
                    const isSoldOut = maxClaimsNum != null && claimsCount >= maxClaimsNum;

                    return (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 transition-colors text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{deal.business_name || "Lojista"}</span>
                          </p>
                          <p className="text-muted-foreground truncate">{deal.title}</p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-emerald-400 font-bold">
                              R$ {Number(deal.deal_price).toFixed(2).replace(".", ",")}
                            </span>
                            {deal.original_price && (
                              <span className="line-through text-muted-foreground">
                                R$ {Number(deal.original_price).toFixed(2).replace(".", ",")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isSoldOut ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              ⚠️ Esgotado
                            </span>
                          ) : maxClaimsNum != null ? (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 gap-1">
                              <Ticket className="h-2.5 w-2.5" />
                              {claimsCount}/{maxClaimsNum} cupons
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                              <MousePointerClick className="h-2.5 w-2.5" />
                              {deal.clicks_count || 0} cliques
                            </Badge>
                          )}

                          {deal.discount_badge && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {deal.discount_badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: CAÇADOR DE OFERTAS & PRESTADORES DE SERVIÇO COM IA */}
          <TabsContent value="hunter" className="space-y-5 mt-0">
            {/* Seletor de Tipo de Caça */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border w-fit">
              <button
                type="button"
                onClick={() => setHunterType("deals")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  hunterType === "deals"
                    ? "bg-emerald-500 text-black shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Ofertas do Comércio ({hunterResults.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setHunterType("providers")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  hunterType === "providers"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Prestadores & Autônomos ({huntedProviders.length})</span>
              </button>
            </div>

            {/* Banner Explicativo */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-purple-950/20 border border-emerald-500/30 text-xs text-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <Target className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold">
                  {hunterType === "deals"
                    ? "Caçador de Ofertas & Radar de Prospecção"
                    : "Radar de Prestadores de Serviços & Negócios Locais"}
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  IA + Web Scraper
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {hunterType === "deals"
                  ? "Varra posts do Instagram, anúncios locais e ofertas de qualquer cidade. A IA estrutura a oportunidade com preços e regras, gera uma página digital para a empresa e publica no Mural de Hoje com 1 clique — pronta para você abordar o lojista no WhatsApp com um benefício concreto!"
                  : "Descubra eletricistas, diaristas, técnicos, mecânicos e prestadores de serviços de qualquer cidade. A IA formata o perfil profissional, sugere os serviços prestados e cadastra no Guia Oficial de Serviços com 1 clique — gerando o link pronto para você enviar no WhatsApp dele!"}
              </p>
            </div>

            {/* Painel de Filtros e Busca */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/60 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hunterCityInput" className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    Cidade Alvo
                  </Label>
                  <Input
                    id="hunterCityInput"
                    value={hunterCity}
                    onChange={(e) => setHunterCity(e.target.value)}
                    placeholder="Ex: Teixeira de Freitas"
                    className="text-xs h-9"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Teixeira de Freitas", "Itamaraju", "Eunápolis", "Porto Seguro"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setHunterCity(c)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          hunterCity === c
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hunterNicheSelect" className="text-xs font-semibold flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-teal-400" />
                    Nicho / Categoria
                  </Label>
                  <select
                    id="hunterNicheSelect"
                    value={hunterNiche}
                    onChange={(e) => setHunterNiche(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Gastronomia & Delivery">Gastronomia & Delivery (Pizzas, Hamburguers, Sushi)</option>
                    <option value="Reformas & Serviços Gerais">Reformas & Construção (Eletricista, Pintor, Pedreiro)</option>
                    <option value="Estética, Beleza & Barbearia">Estética, Beleza, Unhas & Barbearias</option>
                    <option value="Saúde & Bem-Estar">Saúde, Clínicas, Dentistas & Fisioterapia</option>
                    <option value="Automotivo & Mecânica">Automotivo (Mecânica, Auto Elétrica, Lavajato)</option>
                    <option value="Serviços Profissionais">Serviços Profissionais (Contabilidade, TI, Advocacia)</option>
                    <option value="Fitness & Academia">Academias, Crossfit & Personal</option>
                    <option value="Comércio Geral">Comércio Geral & Varejo</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="hunterTargetUrlInput" className="text-xs font-semibold flex items-center gap-1">
                    <Search className="h-3.5 w-3.5 text-purple-400" />
                    Instagram / Perfil (@nome) ou URL Opcional
                  </Label>
                  <Input
                    id="hunterTargetUrlInput"
                    value={hunterTargetUrl}
                    onChange={(e) => setHunterTargetUrl(e.target.value)}
                    placeholder="Ex: @nomedaempresa ou link do post"
                    className="text-xs h-9"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Deixe em branco para o radar varrer toda a cidade no nicho escolhido.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-border/60">
                <Button
                  type="button"
                  onClick={hunterType === "deals" ? handleHuntDeals : handleHuntProviders}
                  disabled={isHunting || !hunterCity}
                  className={`h-9 px-4 text-xs font-bold gap-2 shadow-md ${
                    hunterType === "deals"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                  }`}
                >
                  {isHunting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>
                        {hunterType === "deals"
                          ? "Varrendo Promoções na Região..."
                          : "Auditando Prestadores de Serviços..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Target className="h-3.5 w-3.5" />
                      <span>
                        {hunterType === "deals"
                          ? "Rastrear Oportunidades com IA"
                          : "Rastrear Prestadores de Serviços com IA"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* FEED DE OPORTUNIDADES RASTREADAS */}
            {isHunting ? (
              <div className="py-12 px-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-950/10 text-center space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 animate-pulse">
                  <Search className="h-5 w-5 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {hunterType === "deals"
                      ? `Auditando ofertas do comércio em ${hunterCity}...`
                      : `Mapeando profissionais e prestadores em ${hunterCity}...`}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Conectando com o radar de redes sociais e estruturando as informações com o Gemini 2.0 Flash.
                  </p>
                </div>
              </div>
            ) : hunterType === "deals" ? (
              /* MODO 1: RESULTADOS DE OFERTAS */
              hunterResults.length === 0 ? (
                <div className="py-10 px-4 rounded-xl border border-dashed border-border text-center space-y-2">
                  <Flame className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                  <h4 className="text-xs font-semibold text-foreground">Nenhuma oferta rastreada ainda</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Clique no botão acima para ativar o radar e caçar ofertas ativas em {hunterCity}. Você poderá publicá-las no mural e notificar o lojista com 1 clique!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <span>Oportunidades Encontradas ({hunterResults.length})</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                        Prontas para Publicar
                      </Badge>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hunterResults.map((deal) => {
                      const isPublished = deal.status === "published";
                      const isPublishing = publishingDealId === deal.id;
                      const publishedInfo = publishedDealsMap[deal.id];
                      const whatsappUrl = OfferHunterService.getWhatsAppOutreachLink(deal, publishedInfo?.slug);

                      return (
                        <div
                          key={deal.id}
                          className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                            isPublished
                              ? "bg-emerald-950/20 border-emerald-500/40 shadow-sm"
                              : "bg-background/80 hover:bg-muted/20 border-border/80"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={deal.image_url}
                                alt={deal.title}
                                className="h-16 w-20 rounded-lg object-cover border border-border/60 shrink-0 bg-muted"
                                loading="lazy"
                              />
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 font-bold">
                                    {deal.discount_badge}
                                  </Badge>
                                  {deal.is_flash && (
                                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 gap-1">
                                      <Zap className="h-2.5 w-2.5" />
                                      Relâmpago
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {deal.niche}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-foreground line-clamp-1">
                                  {deal.business_name}
                                </h4>
                                <p className="text-xs font-semibold text-emerald-400 line-clamp-1">
                                  {deal.title}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {deal.description}
                            </p>

                            <div className="flex items-baseline gap-2 pt-1 border-t border-border/60">
                              <span className="text-sm font-extrabold text-foreground">
                                R$ {deal.deal_price.toFixed(2).replace(".", ",")}
                              </span>
                              {deal.original_price && (
                                <span className="text-xs line-through text-muted-foreground">
                                  R$ {deal.original_price.toFixed(2).replace(".", ",")}
                                </span>
                              )}
                              {deal.contact_whatsapp && (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  WhatsApp: {deal.contact_whatsapp}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/60 flex flex-wrap items-center gap-2 justify-between">
                            {isPublished ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span>No Ar no Mural!</span>
                                {publishedInfo?.pageUrl && (
                                  <a
                                    href={publishedInfo.pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                                  >
                                    <span>Ver Página</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPublishing}
                                onClick={() => handlePublishHuntedDeal(deal)}
                                className="h-8 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black gap-1.5 shadow-xs"
                              >
                                {isPublishing ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Publicando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3" />
                                    <span>Publicar no Mural</span>
                                  </>
                                )}
                              </Button>
                            )}

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs ml-auto"
                            >
                              <Send className="h-3 w-3" />
                              <span>Abordar no WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              /* MODO 2: RESULTADOS DE PRESTADORES DE SERVIÇOS */
              huntedProviders.length === 0 ? (
                <div className="py-10 px-4 rounded-xl border border-dashed border-border text-center space-y-2">
                  <Briefcase className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                  <h4 className="text-xs font-semibold text-foreground">Nenhum prestador rastreado ainda</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Selecione o nicho e a cidade acima e clique no botão roxo para rastrear profissionais autônomos e cadastrá-los no Guia de Serviços do EIA Link!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <span>Profissionais & Prestadores Encontrados ({huntedProviders.length})</span>
                      <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30">
                        Prontos para o Guia
                      </Badge>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {huntedProviders.map((provider) => {
                      const isPublished = provider.status === "published";
                      const isPublishing = publishingProviderId === provider.id;
                      const publishedInfo = publishedProvidersMap[provider.id];
                      const whatsappUrl = OfferHunterService.getWhatsAppProviderOutreachLink(
                        provider,
                        publishedInfo?.slug
                      );

                      return (
                        <div
                          key={provider.id}
                          className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                            isPublished
                              ? "bg-indigo-950/20 border-indigo-500/40 shadow-sm"
                              : "bg-background/80 hover:bg-muted/20 border-border/80"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              {provider.image_url ? (
                                <img
                                  src={provider.image_url}
                                  alt={provider.display_name}
                                  className="h-16 w-16 rounded-xl object-cover border border-border/60 shrink-0 bg-muted"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                                  {provider.display_name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30 font-semibold">
                                    {provider.niche || provider.category}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <MapPin className="h-2.5 w-2.5 text-emerald-400" />
                                    {provider.city}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-foreground line-clamp-1">
                                  {provider.display_name}
                                </h4>
                                {provider.contact_whatsapp && (
                                  <p className="text-xs text-emerald-400 font-mono">
                                    WhatsApp: {provider.contact_whatsapp}
                                  </p>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {provider.description}
                            </p>

                            {/* Tags de Serviços Oferecidos */}
                            {provider.suggested_services && provider.suggested_services.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {provider.suggested_services.map((srv, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border"
                                  >
                                    {srv.name} {srv.price ? `(R$ ${srv.price})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/60 flex flex-wrap items-center gap-2 justify-between">
                            {isPublished ? (
                              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                                <span>No Ar no Guia!</span>
                                {publishedInfo?.pageUrl && (
                                  <a
                                    href={publishedInfo.pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                                  >
                                    <span>Ver Cartão PWA</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPublishing}
                                onClick={() => handlePublishProvider(provider)}
                                className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-xs"
                              >
                                {isPublishing ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Cadastrando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Wrench className="h-3 w-3" />
                                    <span>Publicar no Guia</span>
                                  </>
                                )}
                              </Button>
                            )}

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs ml-auto"
                            >
                              <Send className="h-3 w-3" />
                              <span>Abordar no WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </TabsContent>

          {/* TAB 3: CONECTAR PARCERIAS CRUZADAS */}
          <TabsContent value="partnerships" className="space-y-5 mt-0">
            <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
                <Network className="h-4 w-4" />
                <span>Como funciona o Tráfego Cruzado Mútuo:</span>
              </div>
              Ao conectar duas empresas da rede, um banner exclusivo com o benefício é exibido automaticamente no rodapé da página de cada uma. Ambas trocam visitantes qualificados sem custo de mídia paga!
            </div>

            {/* Formulário de Conexão */}
            <form onSubmit={handleCreatePartnership} className="p-4 rounded-xl border border-border bg-background/60 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
                Criar Nova Parceria Mútua
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="hostPageSelect" className="text-xs font-semibold flex items-center gap-1">
                    <Store className="h-3 w-3 text-muted-foreground" />
                    Página Anfitriã (Página A)
                  </Label>
                  <select
                    id="hostPageSelect"
                    value={hostPageId}
                    onChange={(e) => setHostPageId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>Selecione a Empresa A...</option>
                    {userPages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} (/p/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="partnerPageSelect" className="text-xs font-semibold flex items-center gap-1">
                    <Store className="h-3 w-3 text-blue-400" />
                    Página Parceira (Página B)
                  </Label>
                  <select
                    id="partnerPageSelect"
                    value={partnerPageId}
                    onChange={(e) => setPartnerPageId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>Selecione a Empresa B...</option>
                    {userPages
                      .filter((p) => p.id !== hostPageId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.display_name} (/p/{p.slug})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="benefitInput" className="text-xs font-semibold">
                  Benefício Oferecido aos Clientes do Parceiro *
                </Label>
                <Input
                  id="benefitInput"
                  value={benefitText}
                  onChange={(e) => setBenefitText(e.target.value)}
                  placeholder="Ex: Apresente seu comprovante e ganhe 15% OFF na Barbearia VIP"
                  className="text-xs h-9"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Texto curto e atrativo que estimula o cliente da Empresa A a visitar a Empresa B.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="badgeLabelInput" className="text-xs font-semibold">
                    Rótulo / Etiqueta do Parceiro
                  </Label>
                  <Input
                    id="badgeLabelInput"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder="Ex: Parceiro da Rede ou Parceria VIP"
                    className="text-xs h-9"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingPartnership || !hostPageId || !partnerPageId}
                  className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-1.5 shadow-xs"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {savingPartnership ? "Ativando Parceria..." : "Ativar Parceria Mútua"}
                </Button>
              </div>
            </form>

            {/* Listagem de Parcerias Ativas da Host Page */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parcerias Ativas na Página Selecionada ({partnerships.length})
                </h4>
                {hostPageId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchHostPartnerships(hostPageId)}
                    disabled={loadingPartnerships}
                    className="h-7 text-[11px] gap-1 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingPartnerships ? "animate-spin" : ""}`} />
                    Recarregar
                  </Button>
                )}
              </div>

              {loadingPartnerships ? (
                <p className="text-xs text-muted-foreground animate-pulse py-2">Carregando parcerias...</p>
              ) : partnerships.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Nenhuma parceria ativa vinculada para a empresa selecionada como anfitriã.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {partnerships.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 transition-colors text-xs"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {p.partner_name || "Parceiro"}
                          </span>
                          {p.partner_slug && (
                            <a
                              href={`/p/${p.partner_slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>/p/{p.partner_slug}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                            {p.badge_label || "Parceiro"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">{p.benefit_text}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3 text-emerald-400" />
                            {p.clicks_count} cliques recebidos
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePartnership(p.id)}
                        className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0 shrink-0"
                        title="Remover parceria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* MODAL DE CRIAÇÃO DE OFERTA COM LIMITE DE CUPONS */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateDeal}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-orange-400">
                <Flame className="h-5 w-5" />
                <DialogTitle>Nova Oferta do Dia ({dealCity || city})</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Cadastre uma oportunidade diária com limite de cupons e gatilho de escassez automático.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pageSelect" className="text-xs font-semibold flex items-center gap-1">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Empresa / Perfil do EIA Link *
                </Label>
                <select
                  id="pageSelect"
                  value={selectedBioPageId}
                  onChange={(e) => setSelectedBioPageId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                  required
                >
                  <option value="" disabled>Selecione a empresa...</option>
                  {userPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name} (/p/{p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dealTitle" className="text-xs font-semibold">
                  Título da Oferta do Dia *
                </Label>
                <Input
                  id="dealTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Corte + Barba com 35% de desconto"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="originalPrice" className="text-xs font-semibold">
                    Preço Normal (R$)
                  </Label>
                  <Input
                    id="originalPrice"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 80,00"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dealPrice" className="text-xs font-semibold">
                    Preço com Desconto (R$) *
                  </Label>
                  <Input
                    id="dealPrice"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    placeholder="Ex: 52,00"
                    className="text-xs h-9 font-bold text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="discountBadge" className="text-xs font-semibold flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    Etiqueta de Destaque
                  </Label>
                  <Input
                    id="discountBadge"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="Ex: 35% OFF ou Relâmpago"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxClaims" className="text-xs font-semibold flex items-center justify-between">
                    <span>Limite de Cupons</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
                  </Label>
                  <Input
                    id="maxClaims"
                    type="number"
                    min="1"
                    value={maxClaims}
                    onChange={(e) => setMaxClaims(e.target.value)}
                    placeholder="Ex: 10 (vazio = ilimitado)"
                    className="text-xs h-9 text-amber-400 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="dealCity" className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    Cidade
                  </Label>
                  <Input
                    id="dealCity"
                    value={dealCity}
                    onChange={(e) => setDealCity(e.target.value)}
                    placeholder="Ex: Teixeira de Freitas"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dealNiche" className="text-xs font-semibold flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    Nicho
                  </Label>
                  <Input
                    id="dealNiche"
                    value={dealNiche}
                    onChange={(e) => setDealNiche(e.target.value)}
                    placeholder="Ex: Barbearia, Gastronomia..."
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs bg-orange-500 hover:bg-orange-400 text-black font-semibold"
              >
                {saving ? "Publicando..." : "Publicar Oferta Hoje"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default DailyDealsBroadcastCard;
