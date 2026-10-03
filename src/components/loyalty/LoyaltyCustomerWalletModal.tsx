import React, { useState, useEffect } from "react";
import {
  Coins,
  Crown,
  Gift,
  Sparkles,
  Star,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  QrCode,
  Flame,
  ShieldCheck,
  Ticket,
  Copy,
  Check,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LoyaltyService,
  type LoyaltyCustomerBalance,
  type LoyaltyProgramSettings,
  type LoyaltyVoucher,
} from "@/modules/loyalty";

export interface LoyaltyCustomerWalletModalProps {
  bioPageId: string;
  businessName: string;
  slug?: string;
  instagram?: string;
  claimTokenId?: string; // Preenchido se veio de ?claim=lp_xxx da câmera do celular
  triggerButton?: React.ReactNode;
}

export function LoyaltyCustomerWalletModal({
  bioPageId,
  businessName,
  slug,
  instagram,
  claimTokenId,
  triggerButton,
}: LoyaltyCustomerWalletModalProps) {
  const [open, setOpen] = useState(Boolean(claimTokenId));
  const [customerWhatsapp, setCustomerWhatsapp] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`loyalty_phone_${bioPageId}`) || "";
    }
    return "";
  });
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`loyalty_name_${bioPageId}`) || "";
    }
    return "";
  });

  const [settings, setSettings] = useState<LoyaltyProgramSettings | null>(null);
  const [balance, setBalance] = useState<LoyaltyCustomerBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<LoyaltyVoucher | null>(null);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [claimingToken, setClaimingToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Carrega configurações da loja
  useEffect(() => {
    if (bioPageId) {
      LoyaltyService.getProgramSettings(bioPageId).then(setSettings);
    }
  }, [bioPageId]);

  // Se veio token de QR Code via URL, abre o modal automaticamente
  useEffect(() => {
    if (claimTokenId) {
      setOpen(true);
    }
  }, [claimTokenId]);

  // Consulta saldo se houver telefone salvo
  useEffect(() => {
    const clean = customerWhatsapp.replace(/\D/g, "");
    if (clean.length >= 10 && bioPageId) {
      setLoadingBalance(true);
      LoyaltyService.getCustomerBalance(bioPageId, clean)
        .then(setBalance)
        .catch(() => setBalance(null))
        .finally(() => setLoadingBalance(false));
    }
  }, [customerWhatsapp, bioPageId]);

  // Se o cliente abriu o site escaneando a notinha/QR code com a câmera (?claim=lp_xxx)
  const handleClaimScannedToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTokenId) return;

    const clean = customerWhatsapp.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Por favor, digite seu WhatsApp com DDD para creditar seus pontos.");
      return;
    }

    setClaimingToken(true);
    try {
      const res = await LoyaltyService.claimPointToken(claimTokenId, clean, customerName);

      // Salva dados no navegador do cliente para visitas futuras
      localStorage.setItem(`loyalty_phone_${bioPageId}`, clean);
      if (customerName) localStorage.setItem(`loyalty_name_${bioPageId}`, customerName);

      // Atualiza saldo na hora
      const updatedBalance = await LoyaltyService.getCustomerBalance(bioPageId, clean);
      setBalance(updatedBalance);

      toast.success(res.message);

      // Limpa query param sem recarregar a página
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("claim");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err: any) {
      toast.error(err.message || "Não foi possível resgatar este QR Code.");
    } finally {
      setClaimingToken(false);
    }
  };

  // Resgate de prêmio do catálogo
  const handleRedeemReward = async (rewardId: string) => {
    const clean = customerWhatsapp.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Digite seu WhatsApp para resgatar.");
      return;
    }

    setRedeemingRewardId(rewardId);
    try {
      const voucher = await LoyaltyService.redeemRewardVoucher(
        bioPageId,
        clean,
        rewardId,
        customerName || undefined
      );
      setActiveVoucher(voucher);

      // Atualiza o saldo restante
      const updated = await LoyaltyService.getCustomerBalance(bioPageId, clean);
      setBalance(updated);

      toast.success(`🎉 Prêmio resgatado! Apresente o código ${voucher.voucherCode} no caixa.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao resgatar recompensa.");
    } finally {
      setRedeemingRewardId(null);
    }
  };

  const handleCopyVoucher = () => {
    if (!activeVoucher) return;
    navigator.clipboard.writeText(activeVoucher.voucherCode);
    setCopiedCode(true);
    toast.success("Código do voucher copiado!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentPoints = balance?.currentPoints || 0;
  const nextReward = settings?.rewards.find((r) => r.pointsCost > currentPoints);
  const pointsToNext = nextReward ? nextReward.pointsCost - currentPoints : 0;
  const progressPercent = nextReward
    ? Math.min(100, Math.round((currentPoints / nextReward.pointsCost) * 100))
    : 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            type="button"
            className="fixed bottom-5 right-5 z-40 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-zinc-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 border border-amber-300/40 gap-2 h-11 px-4 hover:scale-105 transition-all cursor-pointer"
          >
            <Coins className="h-4 w-4 fill-zinc-950 text-zinc-950 animate-bounce" />
            <span>Clube de Pontos VIP</span>
            {balance && balance.currentPoints > 0 && (
              <Badge className="bg-zinc-950 text-amber-400 text-[10px] px-1.5 py-0 h-4">
                {balance.currentPoints} pts
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        {/* CABEÇALHO DO CARTÃO FIDELIDADE VIP */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  {businessName}
                </h3>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                  Cartão Fidelidade Digital
                </span>
              </div>
            </div>

            <Badge
              className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 border"
              style={{
                backgroundColor:
                  balance?.currentTier === "Ouro"
                    ? "rgba(245, 158, 11, 0.15)"
                    : balance?.currentTier === "Prata"
                    ? "rgba(148, 163, 184, 0.15)"
                    : "rgba(205, 127, 50, 0.15)",
                color:
                  balance?.currentTier === "Ouro"
                    ? "#f59e0b"
                    : balance?.currentTier === "Prata"
                    ? "#cbd5e1"
                    : "#cd7f32",
                borderColor: "currentColor",
              }}
            >
              Nível {balance?.currentTier || "Bronze"}
            </Badge>
          </div>

          {/* SALDO EM DESTAQUE */}
          <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-inner">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-zinc-400 block font-medium">Seu Saldo Disponível:</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                    {currentPoints}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Pontos
                  </span>
                </div>
              </div>

              {nextReward && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">Próximo Prêmio:</span>
                  <span className="text-xs font-bold text-zinc-200 truncate max-w-[150px] block">
                    {nextReward.title}
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium">
                    Faltam {pointsToNext} pts
                  </span>
                </div>
              )}
            </div>

            {/* Barra de progresso para a próxima recompensa */}
            <div className="mt-3 space-y-1">
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MODAL DE RESGATE AUTOMÁTICO SE VEIO DE QR CODE ESCANEADO (?claim=lp_xxx) */}
        {claimTokenId && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-center">
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Você escaneou um cupom de pontos!
            </p>
            <p className="text-[11px] text-zinc-300 mt-1">
              Informe seu WhatsApp para creditar estes pontos na sua conta:
            </p>

            <form onSubmit={handleClaimScannedToken} className="mt-3 flex gap-2">
              <Input
                type="tel"
                placeholder="(DDD) 99999-9999"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-xs text-zinc-100 h-9"
              />
              <Button
                type="submit"
                disabled={claimingToken}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs h-9 shrink-0"
              >
                {claimingToken ? "Creditando..." : "Resgatar Pontos"}
              </Button>
            </form>
          </div>
        )}

        {/* VOUCHER GERADO RECENTEMENTE */}
        {activeVoucher && (
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Voucher de Resgate Ativo
                </span>
                <h4 className="text-sm font-bold text-zinc-100">{activeVoucher.rewardTitle}</h4>
              </div>
              <Badge className="bg-emerald-500 text-zinc-950 font-extrabold text-[10px]">
                30 minutos
              </Badge>
            </div>

            <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30">
              <span className="font-mono text-base font-extrabold text-emerald-300 tracking-wider">
                {activeVoucher.voucherCode}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyVoucher}
                className="h-8 text-xs text-zinc-300 hover:text-white"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 text-center">
              Mostre este código para o atendente no balcão para retirar seu prêmio.
            </p>
          </div>
        )}

        {/* ABAS: RECOMPENSAS & MISSÕES */}
        <div className="p-5">
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 p-1 mb-4 h-10">
              <TabsTrigger
                value="rewards"
                className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400"
              >
                <Gift className="h-3.5 w-3.5 mr-1.5" /> Prêmios Disponíveis
              </TabsTrigger>
              <TabsTrigger
                value="missions"
                className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Missões & Desafios
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: CATÁLOGO DE RECOMPENSAS */}
            <TabsContent value="rewards" className="space-y-3 mt-0">
              {settings?.rewards.map((reward) => {
                const canAfford = currentPoints >= reward.pointsCost;
                const isRedeeming = redeemingRewardId === reward.id;

                return (
                  <div
                    key={reward.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      canAfford
                        ? "bg-zinc-900/80 border-amber-500/30 hover:border-amber-500/60"
                        : "bg-zinc-900/30 border-zinc-800 opacity-70"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100 truncate">
                          {reward.title}
                        </span>
                        {reward.badge && (
                          <Badge className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0 border-amber-500/20">
                            {reward.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{reward.description}</p>
                      <span className="text-xs font-extrabold text-amber-400 block pt-0.5">
                        {reward.pointsCost} Pontos
                      </span>
                    </div>

                    <Button
                      type="button"
                      disabled={!canAfford || isRedeeming}
                      onClick={() => handleRedeemReward(reward.id)}
                      size="sm"
                      className={`text-xs font-bold h-8 shrink-0 ${
                        canAfford
                          ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {isRedeeming ? "Gerando..." : canAfford ? "Resgatar" : `Faltam ${reward.pointsCost - currentPoints}`}
                    </Button>
                  </div>
                );
              })}
            </TabsContent>

            {/* ABA 2: MISSÕES & DESAFIOS (ENGGAJA STYLE) */}
            <TabsContent value="missions" className="space-y-3 mt-0">
              {settings?.missions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-100">{mission.title}</span>
                      <Badge className="bg-amber-500/10 text-amber-400 text-[10px] font-extrabold border-amber-500/20">
                        +{mission.pointsReward} pts
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>

                  {mission.actionType === "instagram_story" && instagram && (
                    <a
                      href={`https://instagram.com/${instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20 text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
                      title="Abrir Instagram da loja"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Abrir @</span>
                    </a>
                  )}

                  {mission.actionType === "google_review" && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.info("Avalie a empresa com 5 estrelas e mostre a tela no caixa para pontuar!");
                        window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(businessName)}`,
                          "_blank"
                        );
                      }}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
                      title="Avaliar no Google"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>Avaliar</span>
                    </button>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* CONSULTA RÁPIDA DE WHATSAPP SE NÃO TIVER SALDO SALVO */}
          {!balance && !claimTokenId && (
            <div className="mt-4 pt-3 border-t border-zinc-900 text-center">
              <Label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                Já é cliente? Consulte seus pontos digitando seu WhatsApp:
              </Label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="(DDD) 99999-9999"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={loadingBalance}
                  onClick={() => {
                    const clean = customerWhatsapp.replace(/\D/g, "");
                    if (clean.length >= 10) {
                      localStorage.setItem(`loyalty_phone_${bioPageId}`, clean);
                      LoyaltyService.getCustomerBalance(bioPageId, clean).then(setBalance);
                    } else {
                      toast.error("Digite o DDD e o número completo.");
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold h-9"
                >
                  Consultar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
