import React, { useState } from "react";
import {
  Zap,
  Clock,
  Ticket,
  Copy,
  Check,
  Share2,
  AlertCircle,
  Sparkles,
  ExternalLink,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DealsService } from "@/modules/deals";

export interface FlashDealModalProps {
  bioPageId: string;
  businessName?: string;
  city?: string;
  niche?: string;
  onCreated?: () => void;
  triggerButton?: React.ReactNode;
}

type DurationOption = "2h" | "3h" | "afternoon" | "night";

export function FlashDealModal({
  bioPageId,
  businessName = "Nosso Estabelecimento",
  city = "Teixeira de Freitas",
  niche,
  onCreated,
  triggerButton,
}: FlashDealModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [maxClaims, setMaxClaims] = useState("3");
  const [durationOption, setDurationOption] = useState<DurationOption>("2h");
  const [loading, setLoading] = useState(false);

  // Estado de Sucesso
  const [createdDealData, setCreatedDealData] = useState<{
    title: string;
    vagas: number;
    horaLimite: string;
    shareText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateExpiresAt = (option: DurationOption): { date: Date; horaFormatada: string } => {
    const now = new Date();
    const expiry = new Date(now);

    if (option === "2h") {
      expiry.setHours(expiry.getHours() + 2);
    } else if (option === "3h") {
      expiry.setHours(expiry.getHours() + 3);
    } else if (option === "afternoon") {
      expiry.setHours(18, 0, 0, 0);
      if (expiry <= now) expiry.setHours(20, 0, 0, 0);
    } else if (option === "night") {
      expiry.setHours(23, 59, 59, 999);
    }

    const hours = String(expiry.getHours()).padStart(2, "0");
    const minutes = String(expiry.getMinutes()).padStart(2, "0");

    return {
      date: expiry,
      horaFormatada: `${hours}:${minutes}`,
    };
  };

  const handleReset = () => {
    setTitle("");
    setOriginalPrice("");
    setDealPrice("");
    setMaxClaims("3");
    setDurationOption("2h");
    setCreatedDealData(null);
    setCopied(false);
  };

  const handleCreateFlashDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioPageId) {
      toast.error("Página do estabelecimento não encontrada.");
      return;
    }

    if (!title.trim() || !dealPrice.trim()) {
      toast.error("Preencha o título e o valor da oferta flash.");
      return;
    }

    const parsedDealPrice = parseFloat(dealPrice.replace(",", "."));
    if (isNaN(parsedDealPrice) || parsedDealPrice <= 0) {
      toast.error("O valor promocional deve ser maior que zero.");
      return;
    }

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null;
    const parsedClaims = parseInt(maxClaims, 10);
    const vagas = isNaN(parsedClaims) || parsedClaims <= 0 ? 3 : parsedClaims;

    const { date: expiryDate, horaFormatada } = calculateExpiresAt(durationOption);

    setLoading(true);
    try {
      await DealsService.createDailyDeal({
        bio_page_id: bioPageId,
        title: title.trim(),
        original_price: parsedOriginalPrice,
        deal_price: parsedDealPrice,
        discount_badge: "⚡ OFERTA FLASH",
        max_claims: vagas,
        is_flash: true,
        starts_at: new Date().toISOString(),
        expires_at: expiryDate.toISOString(),
        city: city || "Teixeira de Freitas",
        niche: niche || null,
      });

      const shareText = `⚡ ALERTA DE OFERTA RELÂMPAGO NO ${businessName.toUpperCase()}!\nApenas ${vagas} vagas disponíveis até às ${horaFormatada}: ${title.trim()} por apenas R$ ${parsedDealPrice.toFixed(2).replace(".", ",")}!\n\n👉 Garanta a sua antes que esgote: eialink.com.br/hoje`;

      setCreatedDealData({
        title: title.trim(),
        vagas,
        horaLimite: horaFormatada,
        shareText,
      });

      toast.success("⚡ Oferta Flash publicada no Mural /hoje!");
      onCreated?.();
    } catch (err: any) {
      console.error("[FlashDealModal] Erro ao criar oferta flash:", err);
      toast.error(err.message || "Erro ao publicar oferta flash.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareText = async () => {
    if (!createdDealData?.shareText) return;
    try {
      await navigator.clipboard.writeText(createdDealData.shareText);
      setCopied(true);
      toast.success("Texto copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o texto.");
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdDealData?.shareText) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(createdDealData.shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="sm"
            className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black gap-1.5 shadow-sm cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 fill-black" />
            <span>⚡ Oferta Flash de Ociosidade</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card text-foreground border-border">
        {createdDealData ? (
          /* SUCESSO & DISPARO NO WHATSAPP */
          <div className="space-y-4 py-2 text-center text-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap className="h-6 w-6 fill-amber-400" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                Oferta Flash no Ar!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sua oferta relâmpago foi ativada com destaque no Mural <strong>/hoje</strong> até às {createdDealData.horaLimite}.
              </DialogDescription>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-left space-y-1.5 font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap select-all">
              {createdDealData.shareText}
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>📲 Compartilhar no Status / WhatsApp</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyShareText}
                className="w-full h-9 text-xs font-semibold gap-1.5 border-border hover:bg-muted"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Texto Pronto</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO DA OFERTA FLASH */
          <form onSubmit={handleCreateFlashDeal} className="space-y-4">
            <DialogHeader className="text-left space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="h-4 w-4 fill-amber-400" />
                </span>
                <DialogTitle className="text-base font-bold text-foreground">
                  Ativar Oferta Flash de Ociosidade
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Cadeiras vazias ou horário parado hoje? Lance uma oferta relâmpago válida apenas pelas próximas horas para atrair clientes imediatos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1 text-xs">
              <div className="space-y-1">
                <Label htmlFor="flashTitle" className="text-xs font-semibold">
                  Título da Oferta Relâmpago *
                </Label>
                <Input
                  id="flashTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: 35% OFF em corte ou pizza até às 17h"
                  className="text-xs h-9 bg-background border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="flashOrigPrice" className="text-xs font-semibold">
                    Preço Normal (R$)
                  </Label>
                  <Input
                    id="flashOrigPrice"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 90,00"
                    className="text-xs h-9 bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="flashDealPrice" className="text-xs font-semibold">
                    Preço Relâmpago (R$) *
                  </Label>
                  <Input
                    id="flashDealPrice"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    placeholder="Ex: 59,90"
                    className="text-xs h-9 font-bold text-emerald-400 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    Duração da Oferta (Válida Hoje)
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono font-bold">
                    Até às {calculateExpiresAt(durationOption).horaFormatada}
                  </span>
                </Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "2h", label: "2 Horas" },
                    { id: "3h", label: "3 Horas" },
                    { id: "afternoon", label: "Até 18h" },
                    { id: "night", label: "Até 23:59" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDurationOption(opt.id as DurationOption)}
                      className={`h-8 rounded-lg text-[11px] font-semibold transition-all border ${
                        durationOption === opt.id
                          ? "bg-amber-500 text-black border-amber-400 shadow-xs"
                          : "bg-background text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="flashClaims" className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-amber-400" />
                    Limite de Vagas / Cupons
                  </span>
                  <span className="text-[10px] text-muted-foreground">Escassez máxima</span>
                </Label>
                <Input
                  id="flashClaims"
                  type="number"
                  min="1"
                  max="20"
                  value={maxClaims}
                  onChange={(e) => setMaxClaims(e.target.value)}
                  placeholder="Ex: 3"
                  className="text-xs h-9 font-bold text-amber-400 bg-background border-border"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Garante que o desconto relâmpago atenda apenas a ociosidade imediata.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-9 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black gap-1.5 shadow-sm cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 fill-black" />
                {loading ? "Ativando..." : "Ativar Oferta Flash Agora"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FlashDealModal;
