import React, { useState } from "react";
import {
  Zap,
  Flame,
  Clock,
  Ticket,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  Tag,
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
import { Textarea } from "@/components/ui/textarea";
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

type DealType = "flash" | "daily";
type DurationOption = "2h" | "3h" | "afternoon" | "night";

const SUGGESTED_BADGES = [
  "20% OFF",
  "30% OFF",
  "50% OFF",
  "Compre 1 Leve 2",
  "Brinde Exclusivo",
  "Combo Especial",
];

export function FlashDealModal({
  bioPageId,
  businessName = "Nosso Estabelecimento",
  city = "Teixeira de Freitas",
  niche,
  onCreated,
  triggerButton,
}: FlashDealModalProps) {
  const [open, setOpen] = useState(false);
  const [dealType, setDealType] = useState<DealType>("flash");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [discountBadge, setDiscountBadge] = useState("");
  const [maxClaims, setMaxClaims] = useState("3");
  const [durationOption, setDurationOption] = useState<DurationOption>("2h");
  const [loading, setLoading] = useState(false);

  // Estado de Sucesso
  const [createdDealData, setCreatedDealData] = useState<{
    dealType: DealType;
    title: string;
    vagas: number | null;
    horaLimite: string;
    shareText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const calculateExpiresAt = (type: DealType, option: DurationOption): { date: Date; horaFormatada: string } => {
    const now = new Date();
    if (type === "daily") {
      const expiry = new Date(now);
      expiry.setHours(23, 59, 59, 999);
      return {
        date: expiry,
        horaFormatada: "23:59",
      };
    }

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
    setDealType("flash");
    setTitle("");
    setDescription("");
    setOriginalPrice("");
    setDealPrice("");
    setDiscountBadge("");
    setMaxClaims("3");
    setDurationOption("2h");
    setCreatedDealData(null);
    setCopied(false);
    setCopiedUrl(false);
  };

  const handleTypeChange = (type: DealType) => {
    setDealType(type);
    if (type === "flash") {
      setMaxClaims((prev) => (prev && prev !== "10" ? prev : "3"));
    } else {
      setMaxClaims((prev) => (prev === "3" ? "10" : prev));
    }
  };

  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioPageId) {
      toast.error("Página do estabelecimento não encontrada.");
      return;
    }

    if (!title.trim() || !dealPrice.trim()) {
      toast.error("Preencha o título e o valor promocional da oferta.");
      return;
    }

    const parsedDealPrice = parseFloat(dealPrice.replace(",", "."));
    if (isNaN(parsedDealPrice) || parsedDealPrice <= 0) {
      toast.error("O valor promocional deve ser maior que zero.");
      return;
    }

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice.replace(",", ".")) : null;

    const parsedClaims = maxClaims.trim() ? parseInt(maxClaims, 10) : null;
    const finalClaims = parsedClaims != null && !isNaN(parsedClaims) && parsedClaims > 0 ? parsedClaims : null;

    const { date: expiryDate, horaFormatada } = calculateExpiresAt(dealType, durationOption);

    const isFlash = dealType === "flash";
    const badge = isFlash
      ? "⚡ OFERTA FLASH"
      : discountBadge.trim() || "OFERTA DO DIA";

    setLoading(true);
    try {
      await DealsService.createDailyDeal({
        bio_page_id: bioPageId,
        title: title.trim(),
        description: description.trim() || null,
        original_price: parsedOriginalPrice,
        deal_price: parsedDealPrice,
        discount_badge: badge,
        max_claims: finalClaims,
        is_flash: isFlash,
        starts_at: new Date().toISOString(),
        expires_at: expiryDate.toISOString(),
        city: city || "Teixeira de Freitas",
        niche: niche || null,
      });

      const formattedPriceStr = parsedDealPrice.toFixed(2).replace(".", ",");
      const vagasInfo = finalClaims ? `Apenas ${finalClaims} cupons/vagas disponíveis` : "Cupons limitados";

      const shareText = isFlash
        ? `⚡ ALERTA DE OFERTA RELÂMPAGO NO ${businessName.toUpperCase()}!\n${vagasInfo} até às ${horaFormatada}: ${title.trim()} por apenas R$ ${formattedPriceStr}!\n\n👉 Garanta a sua antes que esgote no Mural: https://eialink.com.br/hoje`
        : `🔥 OFERTA DO DIA NO ${businessName.toUpperCase()}!\nVálida somente hoje (até 23:59): ${title.trim()} por apenas R$ ${formattedPriceStr}!\n${finalClaims ? `⚡ Restam apenas ${finalClaims} cupons!\n` : ""}\n👉 Resgate o seu no Mural da cidade: https://eialink.com.br/hoje`;

      setCreatedDealData({
        dealType,
        title: title.trim(),
        vagas: finalClaims,
        horaLimite: horaFormatada,
        shareText,
      });

      toast.success(
        isFlash
          ? "⚡ Oferta Flash publicada no Mural /hoje!"
          : "🔥 Oferta do Dia publicada no Mural da sua cidade!"
      );
      onCreated?.();
    } catch (err: any) {
      console.error("[FlashDealModal] Erro ao criar oferta:", err);
      toast.error(err.message || "Erro ao publicar oferta.");
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

  const handleCopyBoardUrl = async () => {
    try {
      await navigator.clipboard.writeText("https://eialink.com.br/hoje");
      setCopiedUrl(true);
      toast.success("Link do Mural copiado!");
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link.");
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
            <span>⚡ Publicar Oferta no Mural</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-card text-foreground border-border max-h-[90vh] overflow-y-auto">
        {createdDealData ? (
          /* SUCESSO & DISPARO NO WHATSAPP */
          <div className="space-y-4 py-2 text-center text-xs">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg ${
                createdDealData.dealType === "flash"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
              }`}
            >
              {createdDealData.dealType === "flash" ? (
                <Zap className="h-7 w-7 fill-amber-400" />
              ) : (
                <Flame className="h-7 w-7 fill-emerald-400" />
              )}
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-foreground">
                {createdDealData.dealType === "flash"
                  ? "Oferta Flash no Ar!"
                  : "Oferta do Dia Publicada!"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {createdDealData.dealType === "flash" ? (
                  <>
                    Sua oferta relâmpago foi ativada com destaque no topo do Mural{" "}
                    <strong>/hoje</strong> em {city} até às {createdDealData.horaLimite}.
                  </>
                ) : (
                  <>
                    Sua oferta do dia está ativa e visível para todos os clientes em{" "}
                    <strong>{city}</strong> até às 23:59 de hoje.
                  </>
                )}
              </DialogDescription>
            </div>

            {/* Prévia do Texto WhatsApp */}
            <div className="space-y-1.5 text-left">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Texto de Divulgação (Status / Grupos):
              </span>
              <div className="p-3.5 rounded-xl bg-muted/70 border border-border text-left font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap select-all">
                {createdDealData.shareText}
              </div>
            </div>

            {/* Link direto do Mural */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border text-left gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Link da Vitrine Pública
                </span>
                <span className="text-xs font-mono font-medium text-emerald-400 truncate block">
                  https://eialink.com.br/hoje
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBoardUrl}
                  className="h-8 px-2.5 text-xs gap-1 border-border"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedUrl ? "Copiado" : "Copiar Link"}</span>
                </Button>
                <a
                  href="/hoje"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Ações */}
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
                    <span>Copiar Texto Completo</span>
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
          /* FORMULÁRIO DE CRIAÇÃO DA OFERTA */
          <form onSubmit={handleSubmitDeal} className="space-y-4">
            <DialogHeader className="text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    dealType === "flash"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {dealType === "flash" ? (
                    <Zap className="h-4 w-4 fill-amber-400" />
                  ) : (
                    <Flame className="h-4 w-4 fill-emerald-400" />
                  )}
                </span>
                <DialogTitle className="text-base font-bold text-foreground">
                  Publicar Oferta no Mural ({city})
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Atraia clientes locais hoje mesmo. Escolha entre uma oportunidade relâmpago de poucas horas ou uma promoção do dia.
              </DialogDescription>
            </DialogHeader>

            {/* SELETOR DO TIPO DE OFERTA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Publicação</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("flash")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    dealType === "flash"
                      ? "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/50"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                    <Zap className="h-3.5 w-3.5 fill-amber-400" />
                    <span>⚡ Oferta Flash</span>
                  </div>
                  <p className="text-[11px] leading-snug">
                    Ociosidade rápida (2h, 3h ou até 18h). Foco em urgência imediata.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("daily")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    dealType === "daily"
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/50"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                    <Flame className="h-3.5 w-3.5 fill-emerald-400" />
                    <span>🔥 Oferta do Dia</span>
                  </div>
                  <p className="text-[11px] leading-snug">
                    Válida até as 23:59 de hoje. Exibida no feed geral da cidade.
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-3 py-1 text-xs">
              {/* Título */}
              <div className="space-y-1">
                <Label htmlFor="dealTitle" className="text-xs font-semibold">
                  Título da Oferta *
                </Label>
                <Input
                  id="dealTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    dealType === "flash"
                      ? "Ex: 35% OFF em corte ou pizza até às 17h"
                      : "Ex: Corte + Barba com 30% OFF hoje"
                  }
                  className="text-xs h-9 bg-background border-border"
                  required
                />
              </div>

              {/* Descrição breve (opcional) */}
              <div className="space-y-1">
                <Label htmlFor="dealDescription" className="text-xs font-semibold flex items-center justify-between">
                  <span>Descrição / Regras do Benefício</span>
                  <span className="text-[10px] text-muted-foreground">Opcional</span>
                </Label>
                <Textarea
                  id="dealDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Válido para pagamentos via Pix ou dinheiro. Apresente o código EIA no balcão."
                  className="text-xs min-h-[56px] resize-none bg-background border-border"
                  rows={2}
                />
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="origPrice" className="text-xs font-semibold">
                    Preço Normal (R$)
                  </Label>
                  <Input
                    id="origPrice"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 90,00"
                    className="text-xs h-9 bg-background border-border"
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
                    placeholder="Ex: 59,90"
                    className="text-xs h-9 font-bold text-emerald-400 bg-background border-border"
                    required
                  />
                </div>
              </div>

              {/* DURAÇÃO (Se for Flash) */}
              {dealType === "flash" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Duração da Oferta Relâmpago
                    </span>
                    <span className="text-[11px] text-amber-300 font-mono font-bold">
                      Até às {calculateExpiresAt("flash", durationOption).horaFormatada}
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
                        className={`h-8 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
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
              ) : (
                /* BADGE DE DESTAQUE (Se for Oferta do Dia) */
                <div className="space-y-1.5">
                  <Label htmlFor="dealBadge" className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-400" />
                      Etiqueta de Destaque
                    </span>
                    <span className="text-[10px] text-muted-foreground">Opcional</span>
                  </Label>
                  <Input
                    id="dealBadge"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="Ex: 30% OFF, Combo VIP"
                    className="text-xs h-9 bg-background border-border"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {SUGGESTED_BADGES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setDiscountBadge(b)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border cursor-pointer transition-all ${
                          discountBadge === b
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Limite de Cupons / Vagas */}
              <div className="space-y-1">
                <Label htmlFor="claimsLimit" className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-amber-400" />
                    {dealType === "flash" ? "Limite de Vagas Imediatas" : "Limite de Cupons Promocionais"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {dealType === "flash" ? "Gatilho de escassez" : "Vazio = Ilimitado"}
                  </span>
                </Label>
                <Input
                  id="claimsLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={maxClaims}
                  onChange={(e) => setMaxClaims(e.target.value)}
                  placeholder={dealType === "flash" ? "Ex: 3" : "Deixe em branco para ilimitado, ou ex: 10"}
                  className="text-xs h-9 font-bold text-amber-400 bg-background border-border"
                  required={dealType === "flash"}
                />
                <p className="text-[10px] text-muted-foreground">
                  {dealType === "flash"
                    ? "Garante que o desconto atenda estritamente a ociosidade das próximas horas."
                    : "Evita que você venda além da sua capacidade operacional no dia."}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/60">
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
                className={`h-9 text-xs font-bold text-black gap-1.5 shadow-sm cursor-pointer ${
                  dealType === "flash"
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                {dealType === "flash" ? (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-black" />
                    <span>{loading ? "Ativando..." : "Ativar Oferta Flash Agora"}</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-3.5 w-3.5 fill-black" />
                    <span>{loading ? "Publicando..." : "Publicar Oferta do Dia"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FlashDealModal;
