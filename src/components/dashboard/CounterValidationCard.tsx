import React, { useState, useEffect } from "react";
import {
  Ticket,
  Coins,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  DollarSign,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CashbackService, type CustomerCashback } from "@/modules/deals";

export interface CounterValidationCardProps {
  bioPageId: string;
  className?: string;
}

interface CouponDetail {
  id: string;
  claim_code: string;
  customer_whatsapp: string;
  customer_name: string | null;
  status: "claimed" | "used" | "expired";
  created_at: string;
  used_at: string | null;
  referred_by_page_id: string | null;
  deal_title?: string;
  deal_price?: number;
}

function maskPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function CounterValidationCard({ bioPageId, className = "" }: CounterValidationCardProps) {
  // Estado Aba 1: Validação de Cupom
  const [couponCode, setCouponCode] = useState("");
  const [searchingCoupon, setSearchingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponDetail | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [markingUsed, setMarkingUsed] = useState(false);

  // Estado Aba 2: Registrar Compra & Cashback
  const [customerPhone, setCustomerPhone] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<CustomerCashback | null>(null);
  const [isPartnerReferral, setIsPartnerReferral] = useState(false);
  const [processingTransaction, setProcessingTransaction] = useState(false);

  // Consulta saldo do cliente ao digitar WhatsApp na Aba 2
  useEffect(() => {
    const rawDigits = customerPhone.replace(/\D/g, "");
    if (rawDigits.length >= 10 && bioPageId) {
      let isMounted = true;
      setLoadingBalance(true);

      CashbackService.getCustomerBalance(bioPageId, rawDigits)
        .then((balance) => {
          if (isMounted) setCustomerBalance(balance);
        })
        .catch(() => {
          if (isMounted) setCustomerBalance(null);
        })
        .finally(() => {
          if (isMounted) setLoadingBalance(false);
        });

      // Checa se o cliente resgatou cupom de parceiro cruzado hoje
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      (supabase as any)
        .from("deal_claims")
        .select("id, referred_by_page_id")
        .eq("business_page_id", bioPageId)
        .eq("customer_whatsapp", rawDigits)
        .gte("created_at", startOfDay.toISOString())
        .not("referred_by_page_id", "is", null)
        .limit(1)
        .then(({ data }: any) => {
          if (isMounted && data && data.length > 0) {
            setIsPartnerReferral(true);
          } else if (isMounted) {
            setIsPartnerReferral(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setCustomerBalance(null);
      setIsPartnerReferral(false);
    }
  }, [customerPhone, bioPageId]);

  // ABA 1: Buscar Cupom
  const handleSearchCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Digite o código do cupom.");
      return;
    }

    setSearchingCoupon(true);
    setCouponError(null);
    setCouponResult(null);

    try {
      const { data, error } = await (supabase as any)
        .from("deal_claims")
        .select(`
          id,
          claim_code,
          customer_whatsapp,
          customer_name,
          status,
          created_at,
          used_at,
          referred_by_page_id,
          daily_deals:deal_id (
            title,
            deal_price
          )
        `)
        .eq("claim_code", cleanCode)
        .eq("business_page_id", bioPageId)
        .maybeSingle();

      if (error) {
        console.error("[CounterValidationCard] Erro ao buscar cupom:", error);
        setCouponError("Erro ao consultar o cupom no banco de dados.");
        return;
      }

      if (!data) {
        setCouponError("Cupom não encontrado para este estabelecimento. Verifique o código digitado.");
        return;
      }

      setCouponResult({
        id: data.id,
        claim_code: data.claim_code,
        customer_whatsapp: data.customer_whatsapp,
        customer_name: data.customer_name,
        status: data.status,
        created_at: data.created_at,
        used_at: data.used_at,
        referred_by_page_id: data.referred_by_page_id,
        deal_title: data.daily_deals?.title,
        deal_price: data.daily_deals?.deal_price != null ? Number(data.daily_deals.deal_price) : undefined,
      });
    } catch (err: any) {
      setCouponError(err.message || "Erro inesperado.");
    } finally {
      setSearchingCoupon(false);
    }
  };

  // ABA 1: Marcar Cupom como Usado
  const handleMarkAsUsed = async () => {
    if (!couponResult) return;

    if (couponResult.status === "used") {
      toast.info("Este cupom já foi marcado como utilizado anteriormente.");
      return;
    }

    setMarkingUsed(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await (supabase as any)
        .from("deal_claims")
        .update({
          status: "used",
          used_at: nowIso,
        })
        .eq("id", couponResult.id)
        .eq("business_page_id", bioPageId);

      if (error) {
        console.error("[CounterValidationCard] Erro ao validar cupom:", error);
        toast.error("Erro ao marcar cupom como usado.");
        return;
      }

      setCouponResult((prev) => (prev ? { ...prev, status: "used", used_at: nowIso } : null));
      toast.success("✅ Cupom validado e marcado como USADO no balcão!");
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado.");
    } finally {
      setMarkingUsed(false);
    }
  };

  // ABA 2: Usar Saldo de Cashback
  const handleUseCashback = async () => {
    const rawDigits = customerPhone.replace(/\D/g, "");
    if (!rawDigits || !customerBalance || customerBalance.balance <= 0) {
      toast.error("Cliente não possui saldo de cashback disponível.");
      return;
    }

    const parsedPurchase = parseFloat(purchaseAmount.replace(",", "."));
    if (isNaN(parsedPurchase) || parsedPurchase <= 0) {
      toast.error("Informe o valor total da compra antes de abater o cashback.");
      return;
    }

    // O valor a abater é o menor entre o saldo disponível e o valor da compra
    const amountToUse = Math.min(customerBalance.balance, parsedPurchase);

    setProcessingTransaction(true);
    try {
      const res = await CashbackService.useCustomerCashback(bioPageId, rawDigits, amountToUse);
      if (res.success) {
        toast.success(`🎉 R$ ${amountToUse.toFixed(2).replace(".", ",")} de cashback abatido com sucesso!`);
        // Atualiza saldo local
        setCustomerBalance((prev) => (prev ? { ...prev, balance: res.remainingBalance } : null));
        // Ajusta o valor restante da compra
        const remainingPurchase = Math.max(0, parsedPurchase - amountToUse);
        setPurchaseAmount(remainingPurchase.toFixed(2).replace(".", ","));
      } else {
        toast.error(res.message || "Não foi possível utilizar o cashback.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao utilizar cashback.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  // ABA 2: Lançar Compra e Gerar Novo Cashback
  const handleAddTransaction = async () => {
    const rawDigits = customerPhone.replace(/\D/g, "");
    if (!rawDigits) {
      toast.error("Informe o WhatsApp do cliente.");
      return;
    }

    const parsedPurchase = parseFloat(purchaseAmount.replace(",", "."));
    if (isNaN(parsedPurchase) || parsedPurchase <= 0) {
      toast.error("Informe o valor da compra maior que zero.");
      return;
    }

    setProcessingTransaction(true);
    try {
      const res = await CashbackService.addCashbackTransaction(
        bioPageId,
        rawDigits,
        parsedPurchase,
        isPartnerReferral
      );

      if (res.success) {
        toast.success(res.message);
        setCustomerBalance((prev) =>
          prev
            ? { ...prev, balance: res.newBalance }
            : {
                id: "temp",
                business_page_id: bioPageId,
                customer_whatsapp: rawDigits,
                balance: res.newBalance,
                last_visit: new Date().toISOString(),
              }
        );
        setPurchaseAmount("");
      } else {
        toast.error(res.message || "Não foi possível registrar o cashback.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar transação.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  return (
    <Card className={`rounded-xl border border-border bg-card text-foreground shadow-xs overflow-hidden ${className}`}>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Frente de Caixa
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Validação no Balcão & Gestão de Cashback
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Valide cupons apresentados pelo cliente e lance compras com crédito ou débito de cashback.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <Tabs defaultValue="validate-coupon" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-4 bg-muted/60">
            <TabsTrigger value="validate-coupon" className="text-xs gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-emerald-400" />
              Validar Cupom
            </TabsTrigger>
            <TabsTrigger value="register-cashback" className="text-xs gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Registrar Compra / Cashback
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: VALIDAR CUPOM */}
          <TabsContent value="validate-coupon" className="space-y-4 mt-0">
            <form onSubmit={handleSearchCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código (ex: EIA-7821)"
                  className="h-10 text-xs font-mono uppercase pl-3 pr-8 bg-background border-border"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={searchingCoupon}
                className="h-10 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                {searchingCoupon ? "Buscando..." : "Buscar Cupom"}
              </Button>
            </form>

            {couponError && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{couponError}</span>
              </div>
            )}

            {couponResult && (
              <div className="p-4 rounded-xl border border-border bg-background/60 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-primary">
                      {couponResult.claim_code}
                    </span>
                    {couponResult.referred_by_page_id && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 gap-1">
                        <Gift className="h-3 w-3" />
                        Parceria Cruzada
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant={
                      couponResult.status === "used"
                        ? "secondary"
                        : couponResult.status === "expired"
                          ? "destructive"
                          : "default"
                    }
                    className="text-xs"
                  >
                    {couponResult.status === "used"
                      ? "Já Utilizado"
                      : couponResult.status === "expired"
                        ? "Expirado"
                        : "Válido / Pendente"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-foreground">Oferta:</span>
                    <p className="text-foreground font-bold truncate">
                      {couponResult.deal_title || "Oferta do Dia"}
                    </p>
                    {couponResult.deal_price != null && (
                      <p className="text-emerald-400 font-bold text-xs">
                        Valor promocional: R$ {couponResult.deal_price.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-foreground">Cliente:</span>
                    <p className="text-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {couponResult.customer_name || "Não informado"}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {maskPhoneBR(couponResult.customer_whatsapp)}
                    </p>
                  </div>
                </div>

                {couponResult.used_at && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Utilizado em: {new Date(couponResult.used_at).toLocaleString("pt-BR")}
                  </p>
                )}

                {couponResult.status === "claimed" && (
                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button
                      onClick={handleMarkAsUsed}
                      disabled={markingUsed}
                      className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {markingUsed ? "Validando..." : "Marcar como Usado no Balcão"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ABA 2: REGISTRAR COMPRA & CASHBACK */}
          <TabsContent value="register-cashback" className="space-y-4 mt-0 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="counterPhone" className="text-xs font-semibold flex items-center justify-between">
                  <span>WhatsApp do Cliente *</span>
                  {loadingBalance && (
                    <span className="text-[10px] text-muted-foreground animate-pulse">
                      Consultando saldo...
                    </span>
                  )}
                </Label>
                <Input
                  id="counterPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhoneBR(e.target.value))}
                  placeholder="(73) 99999-9999"
                  className="h-10 text-xs bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="counterPurchase" className="text-xs font-semibold">
                  Valor da Compra (R$) *
                </Label>
                <Input
                  id="counterPurchase"
                  type="text"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="Ex: 85,00"
                  className="h-10 text-xs bg-background border-border font-bold text-foreground"
                />
              </div>
            </div>

            {/* Painel Informativo de Saldo do Cliente */}
            {customerBalance && (
              <div className="p-3.5 rounded-xl border border-border bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Saldo disponível nesta loja:
                  </span>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ {customerBalance.balance.toFixed(2).replace(".", ",")}
                  </div>
                  {customerBalance.expires_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Expira em: {new Date(customerBalance.expires_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                {customerBalance.balance > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCashback}
                    disabled={processingTransaction || !purchaseAmount}
                    className="h-9 text-xs font-bold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5 shrink-0"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    Abater Saldo da Compra
                  </Button>
                )}
              </div>
            )}

            {/* Alerta Anti-acúmulo de Parceria Cruzada */}
            {isPartnerReferral && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Cliente com Cupom de Parceria Cruzada Ativa</span>
                </div>
                <p className="text-[11px]">
                  Regra de Proteção de Margem: O cliente não recebe desconto imediato na 1ª compra, mas o cashback acumulado ficará como saldo para a próxima visita!
                </p>
              </div>
            )}

            {/* Ação de Lançar Compra */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleAddTransaction}
                disabled={processingTransaction || !customerPhone || !purchaseAmount}
                className="h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                {processingTransaction ? "Processando..." : "Lançar Compra & Gerar Cashback"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CounterValidationCard;
