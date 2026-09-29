import React, { useState, useEffect } from "react";
import {
  HeartHandshake,
  Clock,
  Coins,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Moon,
  Sparkles,
  RefreshCw,
  User,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RetentionService, type AtRiskCustomer } from "@/modules/deals";

export interface RetentionGuardianCardProps {
  bioPageId: string;
  businessName?: string;
  className?: string;
}

function maskPhoneMiddle(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    // (73) 99999-9999 -> (73) 9****-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    // (73) 9999-9999 -> (73) ****-9999
    return `(${digits.slice(0, 2)}) ****-${digits.slice(6)}`;
  }
  return phone;
}

export function RetentionGuardianCard({
  bioPageId,
  businessName = "Nosso Estabelecimento",
  className = "",
}: RetentionGuardianCardProps) {
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!bioPageId) return;
    setLoading(true);
    try {
      const data = await RetentionService.getAtRiskCustomers(bioPageId);
      setCustomers(data);
    } catch (err) {
      console.warn("[RetentionGuardianCard] Erro ao buscar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, [bioPageId]);

  // Contadores das métricas
  const expiringCount = customers.filter((c) => c.status === "expiring_soon").length;
  const atRiskCount = customers.filter((c) => c.status === "at_risk").length;
  const lostCount = customers.filter((c) => c.status === "lost").length;

  const expiringList = customers.filter((c) => c.status === "expiring_soon");
  const missingList = customers.filter((c) => c.status === "at_risk" || c.status === "lost");
  const atRiskOnly = customers.filter((c) => c.status !== "active");

  const handleOpenWhatsApp = (c: AtRiskCustomer) => {
    const { whatsappUrl } = RetentionService.generateReactivationMessage(
      c.customer_name,
      businessName,
      c.balance,
      c.days_since_visit,
      c.status,
      c.customer_whatsapp
    );
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const renderCustomerRow = (c: AtRiskCustomer) => {
    const isExpiring = c.status === "expiring_soon";
    const isLost = c.status === "lost";
    const isAtRisk = c.status === "at_risk";

    return (
      <div
        key={c.customer_whatsapp}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-muted/40 transition-colors gap-3 text-xs"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {c.customer_name || "Cliente"}
            </span>

            <span className="text-[11px] font-mono text-muted-foreground">
              {maskPhoneMiddle(c.customer_whatsapp)}
            </span>

            {isExpiring && (
              <Badge variant="destructive" className="text-[10px] gap-1 py-0">
                <Clock className="h-2.5 w-2.5" />
                Cashback Vencendo
              </Badge>
            )}

            {isAtRisk && (
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 gap-1 py-0">
                <AlertTriangle className="h-2.5 w-2.5" />
                Em Risco
              </Badge>
            )}

            {isLost && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1 py-0">
                <Moon className="h-2.5 w-2.5" />
                Inativo (+45d)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              Última visita há{" "}
              <strong className="text-foreground">
                {c.days_since_visit === 0 ? "hoje" : `${c.days_since_visit} dias`}
              </strong>
            </span>

            {c.balance > 0 && (
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Coins className="h-3 w-3" />
                R$ {c.balance.toFixed(2).replace(".", ",")} em cashback
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => handleOpenWhatsApp(c)}
            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chamar no WhatsApp</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderEmptyState = (msg: string) => (
    <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2 bg-muted/20">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-foreground">{msg}</p>
      <p className="text-[11px] text-muted-foreground">
        Seus clientes estão com visitas recentes e o saldo de cashback em dia!
      </p>
    </div>
  );

  return (
    <Card className={`rounded-xl border border-border bg-card text-foreground shadow-xs overflow-hidden ${className}`}>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <HeartHandshake className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Retenção Ativa
              </p>
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-1">
              Guardião Anti-Abandono (Reativação de Clientes)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Identifique e reative clientes que não voltam há tempos ou que estão prestes a perder o saldo de cashback.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* 3 Métricas no Topo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-destructive flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Cashback Vencendo
            </span>
            <div className="text-xl font-black text-destructive">
              {expiringCount} {expiringCount === 1 ? "cliente" : "clientes"}
            </div>
            <p className="text-[10px] text-muted-foreground">Vencem nos próximos 7 dias</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Clientes em Risco
            </span>
            <div className="text-xl font-black text-amber-400">
              {atRiskCount} {atRiskCount === 1 ? "cliente" : "clientes"}
            </div>
            <p className="text-[10px] text-muted-foreground">De 20 a 45 dias sem visita</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-0.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
              <Moon className="h-3 w-3" />
              Inativos / Sumidos
            </span>
            <div className="text-xl font-black text-foreground">
              {lostCount} {lostCount === 1 ? "cliente" : "clientes"}
            </div>
            <p className="text-[10px] text-muted-foreground">Mais de 45 dias sem retorno</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-4 bg-muted/60 text-xs">
            <TabsTrigger value="all" className="text-xs">
              Todos ({atRiskOnly.length})
            </TabsTrigger>
            <TabsTrigger value="expiring" className="text-xs">
              Vencendo ({expiringCount})
            </TabsTrigger>
            <TabsTrigger value="missing" className="text-xs">
              Sumidos ({missingList.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TODOS EM RISCO */}
          <TabsContent value="all" className="space-y-2 mt-0">
            {loading ? (
              <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">
                Analisando histórico de visitas e cashback...
              </p>
            ) : atRiskOnly.length === 0 ? (
              renderEmptyState("Parabéns! Nenhum cliente em risco de abandono.")
            ) : (
              <div className="space-y-2">{atRiskOnly.map(renderCustomerRow)}</div>
            )}
          </TabsContent>

          {/* TAB 2: CASHBACK VENCENDO */}
          <TabsContent value="expiring" className="space-y-2 mt-0">
            {loading ? (
              <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">
                Carregando saldos prestes a expirar...
              </p>
            ) : expiringList.length === 0 ? (
              renderEmptyState("Nenhum cliente com cashback expirando nesta semana.")
            ) : (
              <div className="space-y-2">{expiringList.map(renderCustomerRow)}</div>
            )}
          </TabsContent>

          {/* TAB 3: CLIENTES SUMIDOS (+20 DIAS) */}
          <TabsContent value="missing" className="space-y-2 mt-0">
            {loading ? (
              <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">
                Carregando clientes inativos...
              </p>
            ) : missingList.length === 0 ? (
              renderEmptyState("Nenhum cliente sumido há mais de 20 dias!")
            ) : (
              <div className="space-y-2">{missingList.map(renderCustomerRow)}</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RetentionGuardianCard;
