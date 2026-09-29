import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Ticket,
  CheckCircle2,
  Copy,
  AlertCircle,
  Sparkles,
  Phone,
  User,
  ShieldCheck,
  Check,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DealsService, type DailyDeal, type ClaimDealResult } from "@/modules/deals";
import { useActionCooldown } from "@/hooks/useActionCooldown";

export interface ClaimDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DailyDeal | null;
  refPageId?: string;
  onSuccess?: (result: ClaimDealResult) => void;
}

// Validação com Zod: WhatsApp brasileiro de 10 a 13 dígitos numéricos
const claimFormSchema = z.object({
  whatsapp: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length >= 10 && val.length <= 13, {
      message: "WhatsApp deve ter DDD + número (10 ou 11 dígitos).",
    }),
  name: z.string().optional(),
  lgpdAccepted: z.literal(true, {
    errorMap: () => ({ message: "É obrigatório aceitar os termos de recebimento." }),
  }),
});

function maskPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function ClaimDealModal({
  isOpen,
  onClose,
  deal,
  refPageId,
  onSuccess,
}: ClaimDealModalProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [dailyClaimsCount, setDailyClaimsCount] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Estado de Sucesso
  const [claimedResult, setClaimedResult] = useState<ClaimDealResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const { canRun } = useActionCooldown(4000);

  // Reseta o estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setWhatsapp("");
      setName("");
      setLgpdAccepted(false);
      setLoading(false);
      setCheckingLimit(false);
      setDailyClaimsCount(null);
      setFormError(null);
      setClaimedResult(null);
      setCopiedCode(false);
    }
  }, [isOpen, deal?.id]);

  // Consulta limite diário assim que o WhatsApp atingir 10 ou 11 dígitos
  useEffect(() => {
    const rawDigits = whatsapp.replace(/\D/g, "");
    if (rawDigits.length >= 10 && rawDigits.length <= 13) {
      let isMounted = true;
      setCheckingLimit(true);

      DealsService.checkCustomerDailyClaimsCount(rawDigits)
        .then((count) => {
          if (isMounted) {
            setDailyClaimsCount(count);
          }
        })
        .catch(() => {
          if (isMounted) {
            setDailyClaimsCount(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setCheckingLimit(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setDailyClaimsCount(null);
    }
  }, [whatsapp]);

  if (!deal) return null;

  const isSoldOut = deal.max_claims != null && deal.claims_count >= deal.max_claims;
  const isGlobalLimitReached = dailyClaimsCount !== null && dailyClaimsCount >= 2;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhoneBR(e.target.value);
    setWhatsapp(masked);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSoldOut) {
      setFormError("Esta oferta esgotou os cupons de hoje.");
      return;
    }

    if (isGlobalLimitReached) {
      setFormError("Você atingiu o limite de 2 cupons de hoje na rede. Volte amanhã!");
      return;
    }

    // Validação com Zod
    const validation = claimFormSchema.safeParse({
      whatsapp,
      name: name.trim() || undefined,
      lgpdAccepted,
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message;
      setFormError(firstIssue || "Verifique os dados informados.");
      return;
    }

    // Trava de clique duplo com hook useActionCooldown
    if (!canRun(`claim-${deal.id}`)) {
      toast.info("Aguarde alguns segundos antes de tentar novamente.");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = validation.data.whatsapp;
      const res = await DealsService.claimDealWithLimits(
        deal.id,
        cleanPhone,
        name.trim() || undefined,
        refPageId
      );

      if (!res.success) {
        setFormError(res.error || "Não foi possível resgatar o cupom.");
        return;
      }

      setClaimedResult(res);
      toast.success("🎉 Cupom reservado com sucesso!");
      onSuccess?.(res);
    } catch (err: any) {
      console.error("[ClaimDealModal] Erro ao resgatar:", err);
      setFormError(err.message || "Erro inesperado ao resgatar cupom. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!claimedResult?.claim_code) return;
    try {
      await navigator.clipboard.writeText(claimedResult.claim_code);
      setCopiedCode(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  };

  const handleSaveToWhatsApp = () => {
    if (!claimedResult?.claim_code) return;
    const storePhone = deal.whatsapp_number ? deal.whatsapp_number.replace(/\D/g, "") : "";
    const msg = `Olá! Acabei de resgatar o cupom *${claimedResult.claim_code}* para a oferta: *${deal.title}* no EIA Link!`;
    const targetUrl = storePhone
      ? `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-foreground border-border">
        {/* TELA DE SUCESSO APÓS RESGATE */}
        {claimedResult?.success ? (
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Cupom Garantido!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apresente este código no estabelecimento para receber seu benefício.
              </DialogDescription>
            </div>

            {/* Caixa com o Código EIA-XXXX */}
            <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Código Exclusivo
              </p>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-primary drop-shadow-sm">
                {claimedResult.claim_code}
              </div>
              <p className="text-xs font-semibold text-foreground/90 truncate">
                {deal.title}
              </p>
            </div>

            {/* Aviso de Limite Global Restante */}
            {claimedResult.remaining_global_today != null && (
              <p className="text-xs text-muted-foreground">
                {claimedResult.remaining_global_today > 0 ? (
                  <span>
                    ⚡ Você ainda pode resgatar mais <strong>1 cupom</strong> hoje na rede EIA Link.
                  </span>
                ) : (
                  <span>
                    🔒 Você utilizou seus <strong>2 cupons diários</strong> na rede hoje.
                  </span>
                )}
              </p>
            )}

            {/* Ações de Salvar e Copiar */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                onClick={handleSaveToWhatsApp}
                className="w-full h-11 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-md cursor-pointer"
              >
                <span>Salvar no meu WhatsApp</span>
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCode}
                className="w-full h-10 text-xs font-semibold gap-1.5 border-border hover:bg-muted"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Código Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Código</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Concluir e Fechar
              </Button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE RESGATE */
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="text-left space-y-1.5">
              <div className="flex items-center gap-2 text-primary">
                <Ticket className="h-5 w-5 text-emerald-400" />
                <DialogTitle className="text-lg font-bold text-foreground">
                  Garantir Cupom de Hoje
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Informe seu WhatsApp para reservar o desconto exclusivo da oferta:
              </DialogDescription>
            </DialogHeader>

            {/* Resumo da Oferta */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <p className="text-xs font-bold text-foreground truncate">{deal.title}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">
                  {deal.business_name || "Comércio Local"}
                </span>
                <span className="font-bold text-emerald-400">
                  R$ {Number(deal.deal_price).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {/* Aviso de Erro Geral */}
            {formError && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{formError}</span>
              </div>
            )}

            {/* Campos do Formulário */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="whatsappInput" className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Seu WhatsApp *
                  </span>
                  {checkingLimit && (
                    <span className="text-[10px] text-muted-foreground animate-pulse">
                      Consultando limite...
                    </span>
                  )}
                </Label>
                <Input
                  id="whatsappInput"
                  type="tel"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  placeholder="(73) 99999-9999"
                  className="h-10 text-xs bg-background border-border"
                  autoFocus
                  required
                />
              </div>

              {/* Status do Limite Diário */}
              {dailyClaimsCount !== null && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                    dailyClaimsCount >= 2
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-muted/50 border-border text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Você resgatou <strong>{dailyClaimsCount} de 2</strong> cupons hoje na rede.
                  </span>
                  {dailyClaimsCount >= 2 ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Limite Atingido
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                      Disponível
                    </Badge>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nameInput" className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Seu Nome <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="nameInput"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="h-10 text-xs bg-background border-border"
                />
              </div>

              {/* Checkbox LGPD Obrigatório */}
              <div className="pt-1 flex items-start gap-2.5">
                <Checkbox
                  id="lgpdConsent"
                  checked={lgpdAccepted}
                  onCheckedChange={(checked) => setLgpdAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="lgpdConsent"
                  className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none"
                >
                  Aceito receber este cupom e comunicações desta empresa pelo WhatsApp.
                </label>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || isSoldOut || isGlobalLimitReached || !lgpdAccepted}
                className="w-full h-11 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gerando seu Cupom...</span>
                  </>
                ) : isSoldOut ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Cupons Esgotados</span>
                  </>
                ) : isGlobalLimitReached ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Limite Diário Atingido (2/2)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Pegar Meu Cupom Agora</span>
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

export default ClaimDealModal;
