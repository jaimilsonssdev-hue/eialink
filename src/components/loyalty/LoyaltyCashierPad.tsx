import React, { useState, useEffect } from "react";
import {
  QrCode,
  Printer,
  Sparkles,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Star,
  Camera,
  Flame,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LoyaltyService,
  type LoyaltyPointToken,
  type LoyaltyProgramSettings,
} from "@/modules/loyalty";
import { ThermalReceiptPrint } from "./ThermalReceiptPrint";
import { LoyaltySettingsModal } from "./LoyaltySettingsModal";

export interface LoyaltyCashierPadProps {
  bioPageId: string;
  businessName?: string;
  slug?: string;
  className?: string;
}

export function LoyaltyCashierPad({
  bioPageId,
  businessName = "Sua Empresa",
  slug = "",
  className = "",
}: LoyaltyCashierPadProps) {
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [customPoints, setCustomPoints] = useState<number | null>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal QR Code na Tela
  const [activeToken, setActiveToken] = useState<LoyaltyPointToken | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutos

  // Modal Impressão Térmica
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Configurações da Loja
  const [settings, setSettings] = useState<LoyaltyProgramSettings | null>(null);

  useEffect(() => {
    if (bioPageId) {
      LoyaltyService.getProgramSettings(bioPageId).then(setSettings);
    }
  }, [bioPageId]);

  // Contagem regressiva de expiração do QR Code na tela
  useEffect(() => {
    let timer: any;
    if (isQrModalOpen && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isQrModalOpen, countdown]);

  const numAmount = parseFloat(purchaseAmount.replace(",", ".")) || 0;
  const ratio = settings?.pointsRatio || 1;
  const computedPoints = customPoints !== null ? customPoints : Math.round(numAmount * ratio);

  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://eialink.com.br";
  const claimUrl = activeToken
    ? `${baseOrigin}/p/${slug || "loja"}?claim=${activeToken.tokenId}&page=${bioPageId}`
    : "";

  // 1. Gera QR Code para a Tela do Caixa (Cliente no balcão)
  const handleGenerateScreenQr = async () => {
    if (computedPoints <= 0) {
      toast.error("Informe o valor da compra ou selecione uma missão com pontos.");
      return;
    }

    setLoading(true);
    try {
      const token = await LoyaltyService.createPointToken({
        businessPageId: bioPageId,
        businessName,
        points: computedPoints,
        purchaseAmount: numAmount > 0 ? numAmount : undefined,
        source: selectedMission ? "mission" : "cashier",
        description: selectedMission || "Compra no Balcão",
        validityMinutes: 5,
      });

      const url = `${baseOrigin}/p/${slug || "loja"}?claim=${token.tokenId}&page=${bioPageId}`;
      const qrDataUrl = await LoyaltyService.getQrCodeUrl(url, 400);

      setActiveToken(token);
      setQrCodeDataUrl(qrDataUrl);
      setCountdown(300);
      setIsQrModalOpen(true);
      toast.success(`QR Code de +${computedPoints} pontos gerado na tela!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar pontos.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Gera Cupom para Impressão Térmica (Delivery / Retirada)
  const handleGenerateThermalPrint = async () => {
    if (computedPoints <= 0) {
      toast.error("Informe o valor da compra ou pontos para imprimir o cupom.");
      return;
    }

    setLoading(true);
    try {
      const token = await LoyaltyService.createPointToken({
        businessPageId: bioPageId,
        businessName,
        points: computedPoints,
        purchaseAmount: numAmount > 0 ? numAmount : undefined,
        source: "thermal_receipt",
        description: selectedMission || "Pedido Delivery / Cupom Térmico",
        validityMinutes: 60 * 24 * 7, // 7 dias para delivery
      });

      const url = `${baseOrigin}/p/${slug || "loja"}?claim=${token.tokenId}&page=${bioPageId}`;
      const qrDataUrl = await LoyaltyService.getQrCodeUrl(url, 400);

      setActiveToken(token);
      setQrCodeDataUrl(qrDataUrl);
      setIsPrintModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar cupom térmico.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMission = (missionTitle: string, pts: number) => {
    if (selectedMission === missionTitle) {
      setSelectedMission(null);
      setCustomPoints(null);
    } else {
      setSelectedMission(missionTitle);
      setCustomPoints(pts);
    }
  };

  const handleClear = () => {
    setPurchaseAmount("");
    setCustomPoints(null);
    setSelectedMission(null);
  };

  return (
    <Card className={`border-zinc-800 bg-zinc-950/70 shadow-lg text-zinc-100 ${className}`}>
      <CardHeader className="pb-3 border-b border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-zinc-100">
                Caixa & Emissão de Pontos VIP
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Emita pontos instantâneos para o cliente no balcão ou imprima na térmica para delivery
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
              {settings?.pointsRatio === 1
                ? "R$ 1,00 = 1 Ponto"
                : settings?.pointsRatio === 2
                ? "R$ 1,00 = 2 Pontos"
                : `R$ ${(1 / (settings?.pointsRatio || 1)).toFixed(2).replace(".", ",")} = 1 Ponto`}
            </Badge>
            <LoyaltySettingsModal
              bioPageId={bioPageId}
              settings={settings}
              onSaved={(updated) => setSettings(updated)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* ENTRADA DE VALOR OU PONTOS */}
        <div>
          <Label className="text-xs font-semibold text-zinc-300">
            Valor da Compra (R$)
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
              R$
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={purchaseAmount}
              onChange={(e) => {
                setPurchaseAmount(e.target.value);
                if (selectedMission) setSelectedMission(null);
                setCustomPoints(null);
              }}
              className="pl-9 text-lg font-bold bg-zinc-900/90 border-zinc-800 text-zinc-100 focus:border-amber-400 h-12"
            />
          </div>
        </div>

        {/* ATALHOS RÁPIDOS DE MISSÕES DO ENGGAJA */}
        <div>
          <Label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Ou bonificar por Missão Concluída:
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
            {(settings?.missions || []).slice(0, 3).map((m, idx) => (
              <button
                key={m.id || idx}
                type="button"
                onClick={() => handleSelectMission(m.title, m.pointsReward)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMission === m.title
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> +{m.pointsReward} pts
                </div>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{m.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RESUMO DOS PONTOS A EMITIR */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-zinc-400 block font-medium">Pontuação Calculada:</span>
            <span className="text-xl font-extrabold text-amber-400 tracking-tight">
              +{computedPoints} Pontos VIP
            </span>
          </div>
          {computedPoints > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Limpar
            </button>
          )}
        </div>

        {/* BOTÕES DE EMISSÃO: TELA DO BALCÃO OU IMPRESSORA TÉRMICA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* MODO 1: QR CODE NA TELA */}
          <Button
            type="button"
            disabled={computedPoints <= 0 || loading}
            onClick={handleGenerateScreenQr}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-11 text-xs gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span>Exibir QR Code na Tela</span>
          </Button>

          {/* MODO 2: IMPRIMIR CUPOM TÉRMICO */}
          <Button
            type="button"
            variant="outline"
            disabled={computedPoints <= 0 || loading}
            onClick={handleGenerateThermalPrint}
            className="border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white font-bold h-11 text-xs gap-2"
            title="Imprime na impressora de cupom 58mm/80mm para grampear na entrega ou entregar no balcão"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Imprimir Cupom Térmico</span>
          </Button>
        </div>
      </CardContent>

      {/* MODAL 1: EXIBIÇÃO DO QR CODE NA TELA DO BALCÃO */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-sm border-zinc-800 bg-zinc-950 text-zinc-100 text-center p-6">
          <DialogHeader className="space-y-1">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 grid place-items-center mb-1">
              <QrCode className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-100">
              Escaneie para Ganhar +{activeToken?.points} Pontos
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Aponte a câmera do seu celular para registrar seus pontos na {businessName}
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border-4 border-amber-500/30">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="QR Code de Pontos"
                className="w-52 h-52 object-contain mx-auto block"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Código temporário expira em:{" "}
                <b className="text-zinc-200 font-mono">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                </b>
              </span>
            </div>

            <p className="text-[10px] text-zinc-500">
              * Válido para 1 único resgate. Os pontos serão creditados diretamente na conta do cliente.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: IMPRESSÃO DO CUPOM TÉRMICO (58mm/80mm) */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 p-6">
          {activeToken && (
            <ThermalReceiptPrint
              token={activeToken}
              claimUrl={claimUrl}
              qrCodeUrl={qrCodeDataUrl}
              onClose={() => setIsPrintModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
