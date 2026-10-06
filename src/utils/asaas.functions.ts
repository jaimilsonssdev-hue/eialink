import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  AsaasService,
  type AsaasCreditCardInput,
  type AsaasCreditCardHolderInfo,
  type AsaasEnvironment,
} from "@/modules/billing/services/AsaasService";

const OWNER_EMAIL = "jaimilsonvendas@gmail.com";

function createServiceSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://nitzhrmcbotdriajaxhw.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_wSndRFAjfVECz_RjpTa-LQ_qvKyX2GM";

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(context: {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: Record<string, unknown>;
}) {
  const isOwner = (context.claims?.["email"] as string)?.toLowerCase() === OWNER_EMAIL;
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const isAdmin = isOwner || Boolean(roles?.some((r) => r.role === "admin"));

  if (!isAdmin) {
    throw new Error("Acesso negado: apenas administradores podem alterar essas configurações.");
  }
}

const PLAN_PRICES: Record<string, { value: number; isYearly: boolean; name: string }> = {
  pro_yearly: { value: 290.0, isYearly: true, name: "EIA Link Pro Anual" },
  pro_yearly_pix: { value: 290.0, isYearly: true, name: "EIA Link Pro Anual (Pix à Vista)" },
  pro_monthly: { value: 29.0, isYearly: false, name: "EIA Link Pro Mensal" },
};

/**
 * 1. Retorna configurações públicas de pagamento (Asaas status + Pix oficial)
 */
export const getAsaasPublicConfigFn = createServerFn({ method: "GET" }).handler(async () => {
  const asaasConfig = await AsaasService.resolveConfig();
  const publicSettings = await AsaasService.getPublicSettings();

  return {
    isAsaasConfigured: asaasConfig.isConfigured,
    asaasEnvironment: asaasConfig.environment,
    pixKey: publicSettings.pix_key || "jaimilsonvendas@gmail.com",
    pixKeyType: publicSettings.pix_key_type || "email",
    pixReceiverName: publicSettings.pix_receiver_name || "EIA Digital Plataforma",
    whatsappSupport: publicSettings.whatsapp_support || "5581999999999",
  };
});

/**
 * 2. Cria cobrança Pix no Asaas e retorna QR Code Dinâmico
 */
export const createAsaasPixCheckoutFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      planKey: "pro_yearly" | "pro_yearly_pix" | "pro_monthly";
      userId: string;
      customerName: string;
      customerEmail: string;
      customerCpfCnpj?: string;
      customerPhone?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const plan = PLAN_PRICES[data.planKey] || PLAN_PRICES.pro_yearly;

    // 1. Cria ou busca cliente no Asaas
    const customer = await AsaasService.createOrGetCustomer({
      name: data.customerName,
      email: data.customerEmail,
      cpfCnpj: data.customerCpfCnpj,
      mobilePhone: data.customerPhone,
    });

    // 2. Data de vencimento = amanhã
    const due = new Date();
    due.setDate(due.getDate() + 1);
    const dueDate = due.toISOString().split("T")[0];

    // 3. Cria cobrança Pix
    const payment = await AsaasService.createPayment({
      customerId: customer.id,
      billingType: "PIX",
      value: plan.value,
      dueDate,
      description: `Assinatura ${plan.name} - EIA Digital`,
      externalReference: data.userId,
    });

    // 4. Obtém o QR Code e código Copia e Cola
    const qrCode = await AsaasService.getPixQrCode(payment.id);

    return {
      paymentId: payment.id,
      qrCodeBase64: qrCode.encodedImage,
      pixCopiaECola: qrCode.payload,
      expirationDate: qrCode.expirationDate,
      value: payment.value,
      planKey: data.planKey,
    };
  });

/**
 * 3. Cria cobrança Cartão de Crédito no Asaas
 */
export const createAsaasCardCheckoutFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      planKey: "pro_yearly" | "pro_monthly";
      userId: string;
      customerName: string;
      customerEmail: string;
      creditCard: AsaasCreditCardInput;
      holderInfo: AsaasCreditCardHolderInfo;
    }) => data
  )
  .handler(async ({ data }) => {
    const plan = PLAN_PRICES[data.planKey] || PLAN_PRICES.pro_yearly;

    // 1. Cria ou busca cliente no Asaas
    const customer = await AsaasService.createOrGetCustomer({
      name: data.customerName,
      email: data.customerEmail,
      cpfCnpj: data.holderInfo.cpfCnpj,
      mobilePhone: data.holderInfo.mobilePhone || data.holderInfo.phone,
      postalCode: data.holderInfo.postalCode,
      addressNumber: data.holderInfo.addressNumber,
    });

    const dueDate = new Date().toISOString().split("T")[0];

    // 2. Cria cobrança no Cartão
    const payment = await AsaasService.createPayment({
      customerId: customer.id,
      billingType: "CREDIT_CARD",
      value: plan.value,
      dueDate,
      description: `Assinatura ${plan.name} - EIA Digital`,
      externalReference: data.userId,
      creditCard: data.creditCard,
      creditCardHolderInfo: data.holderInfo,
    });

    // 3. Se aprovado imediatamente (CONFIRMED ou RECEIVED), ativa o Pro no banco
    const isApproved = payment.status === "CONFIRMED" || payment.status === "RECEIVED";
    if (isApproved) {
      const supabase = createServiceSupabase();
      const isYearly = plan.isYearly;
      const periodEnd = new Date();
      if (isYearly) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + 30);
      }

      const { data: proPlan } = await supabase
        .from("plans")
        .select("id")
        .eq("slug", isYearly ? "pro-yearly" : "pro-monthly")
        .maybeSingle();

      const proPlanId = proPlan?.id || "pro-monthly";

      await supabase.from("subscriptions").upsert(
        {
          user_id: data.userId,
          plan_id: proPlanId,
          status: "active",
          billing_interval: isYearly ? "yearly" : "monthly",
          current_period_end: periodEnd.toISOString(),
          notes: `Ativado via Cartão Asaas (${payment.id})`,
        },
        { onConflict: "user_id" }
      );
    }

    return {
      success: isApproved,
      status: payment.status,
      paymentId: payment.id,
      value: payment.value,
    };
  });

/**
 * 4. Consulta status de um pagamento Pix/Cartão e ativa assinatura se confirmado
 */
export const checkAsaasPaymentStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: { paymentId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const payment = await AsaasService.getPayment(data.paymentId);
      const isPaid = payment.status === "CONFIRMED" || payment.status === "RECEIVED";

      if (isPaid && data.userId) {
        const supabase = createServiceSupabase();
        const isYearly = payment.value >= 197;
        const periodEnd = new Date();
        if (isYearly) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setDate(periodEnd.getDate() + 30);
        }

        const { data: proPlan } = await supabase
          .from("plans")
          .select("id")
          .eq("slug", isYearly ? "pro-yearly" : "pro-monthly")
          .maybeSingle();

        const proPlanId = proPlan?.id;

        if (proPlanId) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: data.userId,
              plan_id: proPlanId,
              status: "active",
              billing_interval: isYearly ? "yearly" : "monthly",
              current_period_end: periodEnd.toISOString(),
              notes: `Ativado via Asaas (${payment.billingType} - ${payment.id})`,
            },
            { onConflict: "user_id" }
          );
        }
      }

      return {
        isPaid,
        status: payment.status,
      };
    } catch (e: any) {
      console.warn("[checkAsaasPaymentStatusFn] Erro ao consultar pagamento:", e);
      return {
        isPaid: false,
        status: "PENDING",
      };
    }
  });

/**
 * 5. Salva configurações de pagamento no banco (apenas Super Admin)
 */
export const savePaymentGatewaySettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      asaasApiKey?: string;
      asaasEnvironment: AsaasEnvironment;
      asaasWebhookToken?: string;
      pixKey?: string;
      pixKeyType?: string;
      pixReceiverName?: string;
      whatsappSupport?: string;
    }) => data
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const supabase = (context as any).supabase || createServiceSupabase();

    const updatePayload: Record<string, any> = {
      id: "default",
      asaas_environment: data.asaasEnvironment,
      pix_key: data.pixKey?.trim() || null,
      pix_key_type: data.pixKeyType || "email",
      pix_receiver_name: data.pixReceiverName?.trim() || "EIA Digital Plataforma",
      whatsapp_support: data.whatsappSupport?.replace(/\D/g, "") || null,
      updated_at: new Date().toISOString(),
    };

    if (data.asaasApiKey !== undefined && data.asaasApiKey !== null) {
      updatePayload.asaas_api_key = data.asaasApiKey.trim() || null;
    }

    if (data.asaasWebhookToken !== undefined && data.asaasWebhookToken !== null) {
      updatePayload.asaas_webhook_token = data.asaasWebhookToken.trim() || null;
    }

    const { error } = await supabase
      .from("payment_gateway_settings" as any)
      .upsert(updatePayload, { onConflict: "id" });

    if (error) {
      console.error("[savePaymentGatewaySettingsFn] Erro ao salvar configurações:", error);
      throw new Error(`Falha ao salvar configurações de pagamento: ${error.message}`);
    }

    return { success: true };
  });

/**
 * 6. Carrega configurações completas para o Super Admin
 */
export const getAdminPaymentSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const supabase = (context as any).supabase || createServiceSupabase();

    const { data } = await supabase
      .from("payment_gateway_settings" as any)
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    return {
      asaasApiKey: (data as any)?.asaas_api_key || "",
      asaasEnvironment: ((data as any)?.asaas_environment as AsaasEnvironment) || "sandbox",
      asaasWebhookToken: (data as any)?.asaas_webhook_token || "",
      pixKey: (data as any)?.pix_key || "",
      pixKeyType: (data as any)?.pix_key_type || "email",
      pixReceiverName: (data as any)?.pix_receiver_name || "EIA Digital Plataforma",
      whatsappSupport: (data as any)?.whatsapp_support || "",
    };
  });
