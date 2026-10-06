import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AsaasService } from "@/modules/billing/services/AsaasService";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "https://nitzhrmcbotdriajaxhw.supabase.co";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";

    _supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabase;
}

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    externalReference?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    description?: string;
  };
}

async function handleAsaasEvent(payload: AsaasWebhookPayload) {
  const { event, payment } = payload;
  console.log(`[Asaas Webhook] Evento recebido: ${event}`, payment ? { id: payment.id, value: payment.value, externalReference: payment.externalReference } : {});

  if (!payment) {
    return { received: true, ignored: "no payment data" };
  }

  const userId = payment.externalReference?.trim();
  if (!userId) {
    console.warn(`[Asaas Webhook] Cobrança ${payment.id} sem externalReference (userId). Ignorando.`);
    return { received: true, ignored: "no externalReference" };
  }

  const supabase = getSupabase();

  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    const isYearly = (payment.value || 0) >= 197;
    const periodEnd = new Date();
    if (isYearly) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setDate(periodEnd.getDate() + 30);
    }

    // Busca o plano Pro correspondente
    const targetSlug = isYearly ? "pro-yearly" : "pro-monthly";
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", targetSlug)
      .maybeSingle();

    // Fallback para qualquer plano pro se não encontrar por slug específico
    let proPlanId = plan?.id;
    if (!proPlanId) {
      const { data: fallbackPlan } = await supabase
        .from("plans")
        .select("id")
        .ilike("slug", "%pro%")
        .order("price_cents", { ascending: isYearly ? false : true })
        .limit(1)
        .maybeSingle();
      proPlanId = fallbackPlan?.id;
    }

    if (!proPlanId) {
      console.error("[Asaas Webhook] Nenhum plano Pro encontrado na tabela plans.");
      return { received: true, error: "plan not found" };
    }

    const { error: upsertErr } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: proPlanId,
        status: "active",
        billing_interval: isYearly ? "yearly" : "monthly",
        current_period_end: periodEnd.toISOString(),
        notes: `Ativado automaticamente via Webhook Asaas (${payment.billingType || "PIX"} - ${payment.id})`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      console.error("[Asaas Webhook] Erro ao atualizar subscription:", upsertErr);
      throw upsertErr;
    }

    console.log(`[Asaas Webhook] Assinatura do usuário ${userId} ativada com sucesso até ${periodEnd.toISOString()}`);
    return { received: true, activated: true, userId };
  }

  if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
    // Caso de estorno: busca plano essencial para reverter
    const { data: essentialPlan } = await supabase
      .from("plans")
      .select("id")
      .in("slug", ["essential", "free"])
      .limit(1)
      .maybeSingle();

    if (essentialPlan) {
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          plan_id: essentialPlan.id,
          notes: `Cancelado via Webhook Asaas (${event} - ${payment.id})`,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  return { received: true };
}

export const Route = (createFileRoute as any)("/api/public/payments/asaas-webhook")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          status: "active",
          service: "EIA Digital Asaas Webhook",
          timestamp: new Date().toISOString(),
        });
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          // Validação de segurança: token do webhook configurado no Asaas
          const tokenHeader = request.headers.get("asaas-access-token");
          const asaasConfig = await AsaasService.resolveConfig();
          const configuredToken = asaasConfig.webhookToken;

          if (configuredToken && configuredToken !== tokenHeader) {
            console.warn("[Asaas Webhook] Token inválido ou ausente recebido:", tokenHeader);
            return Response.json({ error: "Unauthorized token" }, { status: 401 });
          }

          const body = await request.json();
          const result = await handleAsaasEvent(body);
          return Response.json(result, { status: 200 });
        } catch (e: any) {
          console.error("[Asaas Webhook Error]", e);
          return Response.json({ error: e?.message || "Webhook processing failed" }, { status: 400 });
        }
      },
    },
  },
});
