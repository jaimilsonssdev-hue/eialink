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
} from "lucide-react";
import { toast } from "sonner";
import { DealsService, type DailyDeal } from "@/modules/deals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DailyDealsBroadcastCard() {
  const [city, setCity] = useState("Teixeira de Freitas");
  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    void fetchDeals();
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
              Transmissão de Ofertas Locais ({city})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Gere e dispare a lista de ofertas ativas de hoje diretamente nos grupos e listas de transmissão da cidade.
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
            <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                Nenhuma oferta ativa cadastrada hoje para {city}.
              </p>
              <p className="text-[11px] text-muted-foreground/75 mt-0.5">
                Os lojistas podem cadastrar ofertas diárias através do painel de controle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {deals.map((deal) => (
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
                    <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                      <MousePointerClick className="h-2.5 w-2.5" />
                      {deal.clicks_count || 0} cliques
                    </Badge>
                    {deal.discount_badge && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {deal.discount_badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DailyDealsBroadcastCard;
