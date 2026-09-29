import React, { useEffect, useState } from "react";
import { Coins, Sparkles, ShieldCheck, Check, Clock, Percent, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CashbackService } from "@/modules/deals";

export interface CashbackSettingsCardProps {
  bioPageId: string;
  className?: string;
}

export function CashbackSettingsCard({ bioPageId, className = "" }: CashbackSettingsCardProps) {
  const [isActive, setIsActive] = useState(false);
  const [percentage, setPercentage] = useState(5);
  const [validityDays, setValidityDays] = useState(30);
  const [discountTiming, setDiscountTiming] = useState<"next" | "first">("next");
  const [preventDoubleDiscount, setPreventDoubleDiscount] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadSettings() {
      try {
        const settings = await CashbackService.getCashbackSettings(bioPageId);
        if (settings && isMounted) {
          setIsActive(settings.is_active);
          setPercentage(settings.percentage || 5);
          setValidityDays(settings.validity_days || 30);
          setDiscountTiming(settings.allow_first_purchase_discount ? "first" : "next");
          setPreventDoubleDiscount(settings.prevent_double_discount !== false);
        }
      } catch (err) {
        console.warn("[CashbackSettingsCard] Falha ao carregar configurações:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (bioPageId) {
      void loadSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [bioPageId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioPageId) return;

    setSaving(true);
    try {
      await CashbackService.updateCashbackSettings({
        business_page_id: bioPageId,
        is_active: isActive,
        percentage: Number(percentage),
        validity_days: Number(validityDays),
        allow_first_purchase_discount: discountTiming === "first",
        prevent_double_discount: preventDoubleDiscount,
      });

      toast.success("Configurações de cashback salvas com sucesso!");
    } catch (err: any) {
      console.error("[CashbackSettingsCard] Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar configurações de cashback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`rounded-xl border border-border bg-card text-foreground shadow-xs overflow-hidden ${className}`}>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Coins className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Fidelização & Margem
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Programa de Cashback Exclusivo da Loja
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Defina o percentual retornado aos seus clientes para garantir recompra e fidelização.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`text-xs ${isActive ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {isActive ? "Ativo" : "Desativado"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
            Carregando configurações de cashback...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Switch Principal: Ativar Cashback */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
              <div className="space-y-0.5">
                <Label htmlFor="cashbackActiveSwitch" className="text-xs font-bold text-foreground cursor-pointer">
                  Ativar programa de cashback
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Quando ligado, seus clientes acumulam saldo em cada compra para usar na loja.
                </p>
              </div>
              <Switch
                id="cashbackActiveSwitch"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Configurações Avançadas (Visíveis ou ativas quando ligado) */}
            <div className={`space-y-4 transition-opacity ${isActive ? "opacity-100" : "opacity-60 pointer-events-none"}`}>
              {/* Percentual de Cashback */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-background/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-emerald-400" />
                    Percentual Retornado ao Cliente
                  </Label>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[percentage]}
                    onValueChange={(vals) => setPercentage(vals[0] ?? 5)}
                    min={1}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={percentage}
                    onChange={(e) => setPercentage(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-16 h-8 text-xs text-center font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ex: Em uma compra de R$ 100,00 com {percentage}%, o cliente ganha R$ {(100 * (percentage / 100)).toFixed(2).replace(".", ",")} de saldo.
                </p>
              </div>

              {/* Validade em Dias */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-background/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    Validade do Saldo de Cashback
                  </Label>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {validityDays} dias
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[validityDays]}
                    onValueChange={(vals) => setValidityDays(vals[0] ?? 30)}
                    min={7}
                    max={180}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={7}
                    max={180}
                    value={validityDays}
                    onChange={(e) => setValidityDays(Math.min(180, Math.max(7, Number(e.target.value) || 7)))}
                    className="w-16 h-8 text-xs text-center font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Estimula o cliente a retornar dentro desse período antes que o saldo expire.
                </p>
              </div>

              {/* Momento de Aplicação do Desconto */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-background/60">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Aplicação do Benefício
                </Label>
                <RadioGroup
                  value={discountTiming}
                  onValueChange={(val) => setDiscountTiming(val as "next" | "first")}
                  className="space-y-2 pt-1"
                >
                  <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                    <RadioGroupItem value="next" id="discountTimingNext" className="mt-0.5" />
                    <label htmlFor="discountTimingNext" className="cursor-pointer text-xs space-y-0.5">
                      <span className="font-bold text-foreground">Usar na próxima compra (Fidelização / Recomendado)</span>
                      <p className="text-[11px] text-muted-foreground">
                        O cliente paga o valor total hoje e acumula o crédito para retornar à loja na próxima visita.
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                    <RadioGroupItem value="first" id="discountTimingFirst" className="mt-0.5" />
                    <label htmlFor="discountTimingFirst" className="cursor-pointer text-xs space-y-0.5">
                      <span className="font-bold text-foreground">Usar na primeira compra (Desconto imediato)</span>
                      <p className="text-[11px] text-muted-foreground">
                        Aplica o percentual de desconto no ato do pagamento inicial.
                      </p>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Trava Anti-acúmulo com Cupom de Parceiro */}
              <div className="flex items-start justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Não acumular com cupom de parceiro</span>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                      Proteção de Margem
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Quando ativo, clientes que resgataram cupom de parceiro da rede <strong>não recebem desconto imediato na 1ª compra</strong>, gerando saldo apenas para a próxima visita. Isso impede que a margem do lojista seja canibalizada por descontos duplos.
                  </p>
                </div>
                <Switch
                  checked={preventDoubleDiscount}
                  onCheckedChange={setPreventDoubleDiscount}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-xs"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default CashbackSettingsCard;
