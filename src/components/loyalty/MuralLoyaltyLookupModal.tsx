import React, { useState, useEffect } from "react";
import {
  Coins,
  Crown,
  Sparkles,
  Search,
  Store,
  ArrowRight,
  ShieldCheck,
  Star,
  ExternalLink,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoyaltyService } from "@/modules/loyalty";

export interface MuralLoyaltyLookupModalProps {
  triggerButton?: React.ReactNode;
}

export function MuralLoyaltyLookupModal({ triggerButton }: MuralLoyaltyLookupModalProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loyalty_global_phone") || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [balances, setBalances] = useState<
    Array<{ businessPageId: string; businessName: string; slug: string; points: number }>
  >([]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Digite seu WhatsApp com DDD para consultar.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("loyalty_global_phone", clean);
      }
      const results = await LoyaltyService.getCustomerAllStoresBalances(clean);
      setBalances(results);
      if (results.length === 0) {
        toast.info("Nenhum ponto encontrado para este número ainda.");
      }
    } catch (err: any) {
      toast.error("Erro ao buscar pontuação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && phone.replace(/\D/g, "").length >= 10 && !searched) {
      handleSearch();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-sm"
          >
            <Coins className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>Meus Pontos VIP</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-extrabold text-zinc-100">
                Central de Fidelidade & Pontos
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Consulte seus pontos acumulados no comércio local pelo WhatsApp.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* CAMPO DE BUSCA POR WHATSAPP */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              Seu WhatsApp com DDD:
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="(DDD) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 h-10 font-mono"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs h-10 px-4 gap-1.5 shadow-md"
              >
                <Search className="h-3.5 w-3.5" />
                {loading ? "Buscando..." : "Consultar"}
              </Button>
            </div>
          </form>

          {/* RESULTADOS DA CONSULTA */}
          {searched && (
            <div className="space-y-3 pt-2 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Suas Lojas & Pontuações:
                </span>
                <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800">
                  {balances.length} {balances.length === 1 ? "loja" : "lojas"}
                </Badge>
              </div>

              {balances.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center space-y-2 text-xs text-zinc-400">
                  <Coins className="h-6 w-6 text-zinc-600 mx-auto" />
                  <p className="font-semibold text-zinc-300">Nenhum ponto registrado ainda</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Você ainda não pontuou com este número. Ao visitar uma loja parceira, peça seu QR Code ou nota térmica no caixa para pontuar!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {balances.map((item) => (
                    <div
                      key={item.businessPageId}
                      className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
                          <Store className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-100 truncate">
                            {item.businessName}
                          </h4>
                          <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {item.points} pontos acumulados
                          </span>
                        </div>
                      </div>

                      {item.slug && (
                        <a
                          href={`/p/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Abrir Cartão Digital da Loja"
                        >
                          <span>Abrir Cartão</span>
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BENEFÍCIOS & COMO PONTUAR */}
          <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px] uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Como acumular mais pontos?</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>No Caixa:</strong> Peça seu QR Code de pontos na tela ou na notinha impressa a cada compra.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Com a Câmera:</strong> Basta apontar a câmera do celular no QR Code, sem precisar baixar aplicativo.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Missões:</strong> Avaliações 5 estrelas no Google e posts no Instagram rendem pontos bônus instantâneos.</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
