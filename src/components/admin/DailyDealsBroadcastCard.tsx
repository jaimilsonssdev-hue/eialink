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
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DealsService, type DailyDeal } from "@/modules/deals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Modal para criação de oferta
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPages, setUserPages] = useState<{ id: string; display_name: string; slug: string }[]>([]);

  // Form states
  const [selectedBioPageId, setSelectedBioPageId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [discountBadge, setDiscountBadge] = useState("30% OFF");
  const [maxClaims, setMaxClaims] = useState("10");

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

  const fetchUserPages = async () => {
    try {
      const { data } = await supabase
        .from("bio_pages")
        .select("id, display_name, slug")
        .order("created_at", { ascending: false })
        .limit(30);

      const pages = (data || []) as { id: string; display_name: string; slug: string }[];
      setUserPages(pages);
      if (pages.length > 0 && !selectedBioPageId) {
        setSelectedBioPageId(pages[0].id);
      }
    } catch (err) {
      console.warn("[DailyDealsBroadcastCard] Erro ao buscar páginas:", err);
    }
  };

  useEffect(() => {
    void fetchDeals();
    void fetchUserPages();
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

    setSaving(true);
    try {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      await DealsService.createDailyDeal({
        bio_page_id: selectedBioPageId,
        title: title.trim(),
        description: description.trim() || null,
        original_price: originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null,
        deal_price: parseFloat(dealPrice.replace(",", ".")),
        discount_badge: discountBadge.trim() || null,
        max_claims: maxClaims ? parseInt(maxClaims, 10) : null,
        city: city,
        expires_at: endOfDay.toISOString(),
      });

      toast.success("🎉 Oferta com limite de cupons publicada com sucesso!");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setOriginalPrice("");
      setDealPrice("");
      await fetchDeals();
    } catch (err: any) {
      console.error("[DailyDealsBroadcastCard] Erro ao criar oferta:", err);
      toast.error(err.message || "Erro ao criar oferta.");
    } finally {
      setSaving(false);
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
                Mural do Dia & Disparo WhatsApp
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Transmissão de Ofertas & Cupons ({city})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Gere e dispare a lista de ofertas com limites e gatilhos de escassez diretamente nos grupos locais.
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
              Nova Oferta
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

      <CardContent className="p-5 pt-2 space-y-5">
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
              Válidas somente até as 23:59 de hoje
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
                const maxClaims = deal.max_claims;
                const claimsCount = deal.claims_count || 0;
                const isSoldOut = maxClaims != null && claimsCount >= maxClaims;

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
                          Esgotado
                        </span>
                      ) : maxClaims != null ? (
                        <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 gap-1">
                          <Ticket className="h-2.5 w-2.5" />
                          {claimsCount}/{maxClaims} cupons
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
      </CardContent>

      {/* MODAL DE CRIAÇÃO DE OFERTA COM LIMITE DE CUPONS */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateDeal}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-orange-400">
                <Flame className="h-5 w-5" />
                <DialogTitle>Publicar Oferta no Mural ({city})</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Cadastre uma oportunidade diária com limite de cupons e gatilho de escassez automático.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pageSelect" className="text-xs font-semibold">
                  Empresa / Perfil do EIA Link
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
                  Título da Oferta do Dia
                </Label>
                <Input
                  id="dealTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pizza Família 2 Sabores + Refrigerante Grátis"
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
                    placeholder="Ex: 70,00"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dealPrice" className="text-xs font-semibold">
                    Preço de Hoje (R$) *
                  </Label>
                  <Input
                    id="dealPrice"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    placeholder="Ex: 49,90"
                    className="text-xs h-9 font-bold text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="discountBadge" className="text-xs font-semibold">
                    Selo de Desconto
                  </Label>
                  <Input
                    id="discountBadge"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="Ex: 30% OFF ou Combo VIP"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxClaims" className="text-xs font-semibold flex items-center justify-between">
                    <span>Limite de Cupons</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(Escassez)</span>
                  </Label>
                  <Input
                    id="maxClaims"
                    type="number"
                    min="1"
                    value={maxClaims}
                    onChange={(e) => setMaxClaims(e.target.value)}
                    placeholder="Ex: 10 (vazio = livre)"
                    className="text-xs h-9 text-amber-400 font-semibold"
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
