import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AsaasEnvironment = "sandbox" | "production";

export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
}

export interface AsaasCreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasCreatePaymentInput {
  customerId: string;
  billingType: "PIX" | "CREDIT_CARD";
  value: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
  externalReference?: string;
  creditCard?: AsaasCreditCardInput;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  remoteIp?: string;
}

export interface AsaasPixQrCodeResult {
  encodedImage: string; // Base64 png
  payload: string; // Copia e Cola
  expirationDate: string;
}

export interface PaymentGatewaySettings {
  id: string;
  asaas_api_key?: string | null;
  asaas_environment: AsaasEnvironment;
  asaas_webhook_token?: string | null;
  pix_key?: string | null;
  pix_key_type?: string | null;
  pix_receiver_name?: string | null;
  whatsapp_support?: string | null;
  updated_at?: string;
}

function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://nitzhrmcbotdriajaxhw.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const AsaasService = {
  getProductionBaseUrl() {
    return "https://api.asaas.com/v3";
  },

  getSandboxBaseUrl() {
    return "https://sandbox.asaas.com/api/v3";
  },

  async resolveConfig(): Promise<{
    apiKey: string;
    environment: AsaasEnvironment;
    isConfigured: boolean;
    webhookToken?: string | null;
  }> {
    // 1. Tenta carregar do banco de dados (payment_gateway_settings)
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await (supabase as any)
        .from("payment_gateway_settings")
        .select("asaas_api_key, asaas_environment, asaas_webhook_token")
        .eq("id", "default")
        .maybeSingle();

      const row = data as any;
      if (row?.asaas_api_key) {
        return {
          apiKey: String(row.asaas_api_key).trim(),
          environment: (row.asaas_environment as AsaasEnvironment) || "sandbox",
          isConfigured: true,
          webhookToken: row.asaas_webhook_token ? String(row.asaas_webhook_token).trim() : (process.env.ASAAS_WEBHOOK_TOKEN || null),
        };
      }
    } catch (e) {
      console.warn("[AsaasService] Falha ao ler payment_gateway_settings do banco:", e);
    }

    // 2. Fallback para variáveis de ambiente
    const envKey = (process.env.ASAAS_API_KEY || (process.env as any).VITE_ASAAS_API_KEY || "").trim();
    const envMode = (
      process.env.ASAAS_ENVIRONMENT ||
      (process.env as any).VITE_ASAAS_ENVIRONMENT ||
      "sandbox"
    ).trim() as AsaasEnvironment;
    const envWebhookToken = (
      process.env.ASAAS_WEBHOOK_TOKEN ||
      (process.env as any).VITE_ASAAS_WEBHOOK_TOKEN ||
      ""
    ).trim() || null;

    return {
      apiKey: envKey,
      environment: envMode === "production" ? "production" : "sandbox",
      isConfigured: Boolean(envKey),
      webhookToken: envWebhookToken,
    };
  },

  async getPublicSettings(): Promise<PaymentGatewaySettings> {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await (supabase as any)
        .from("payment_gateway_settings")
        .select("id, asaas_environment, asaas_webhook_token, pix_key, pix_key_type, pix_receiver_name, whatsapp_support, updated_at")
        .eq("id", "default")
        .maybeSingle();

      const row = data as any;
      if (row) {
        return {
          id: row.id,
          asaas_environment: (row.asaas_environment as AsaasEnvironment) || "sandbox",
          asaas_webhook_token: row.asaas_webhook_token || null,
          pix_key: row.pix_key || "jaimilsonvendas@gmail.com",
          pix_key_type: row.pix_key_type || "email",
          pix_receiver_name: row.pix_receiver_name || "EIA Digital Plataforma",
          whatsapp_support: row.whatsapp_support || "5581999999999",
          updated_at: row.updated_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn("[AsaasService] Falha ao obter configurações públicas de pagamento:", e);
    }

    return {
      id: "default",
      asaas_environment: "sandbox",
      asaas_webhook_token: null,
      pix_key: "jaimilsonvendas@gmail.com",
      pix_key_type: "email",
      pix_receiver_name: "EIA Digital Plataforma",
      whatsapp_support: "5581999999999",
    };
  },

  async requestAsaas<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { apiKey, environment } = await this.resolveConfig();

    if (!apiKey) {
      throw new Error("Chave de API do Asaas não configurada. Configure no Super Admin ou nas variáveis de ambiente.");
    }

    const baseUrl = environment === "production" ? this.getProductionBaseUrl() : this.getSandboxBaseUrl();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "access_token": apiKey,
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        json?.errors?.[0]?.description ||
        json?.message ||
        `Erro ${res.status} ao comunicar com a API do Asaas.`;
      console.error("[AsaasService Error]", { status: res.status, json, url });
      throw new Error(errMsg);
    }

    return json as T;
  },

  /**
   * 1. Cria ou busca cliente por e-mail no Asaas
   */
  async createOrGetCustomer(customer: AsaasCustomerInput): Promise<{ id: string; name: string; email: string }> {
    // Busca cliente existente pelo e-mail
    const searchRes = await this.requestAsaas<{ data: Array<{ id: string; name: string; email: string }> }>(
      `/customers?email=${encodeURIComponent(customer.email.trim())}`,
      { method: "GET" }
    );

    if (searchRes?.data && searchRes.data.length > 0) {
      return searchRes.data[0];
    }

    // Não encontrou, cria um novo
    const cleanPhone = (customer.mobilePhone || customer.phone || "").replace(/\D/g, "");
    const cleanCpfCnpj = (customer.cpfCnpj || "").replace(/\D/g, "");

    const newCustomer = await this.requestAsaas<{ id: string; name: string; email: string }>(
      "/customers",
      {
        method: "POST",
        body: JSON.stringify({
          name: customer.name.trim() || customer.email.split("@")[0],
          email: customer.email.trim().toLowerCase(),
          cpfCnpj: cleanCpfCnpj || undefined,
          mobilePhone: cleanPhone || undefined,
          postalCode: customer.postalCode || undefined,
          address: customer.address || undefined,
          addressNumber: customer.addressNumber || undefined,
          notificationDisabled: false,
        }),
      }
    );

    return newCustomer;
  },

  /**
   * 2. Cria cobrança Pix ou Cartão
   */
  async createPayment(input: AsaasCreatePaymentInput): Promise<{
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    invoiceUrl?: string;
    externalReference?: string;
  }> {
    const payload: Record<string, any> = {
      customer: input.customerId,
      billingType: input.billingType,
      value: input.value,
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
      postalService: false,
    };

    if (input.billingType === "CREDIT_CARD") {
      if (!input.creditCard || !input.creditCardHolderInfo) {
        throw new Error("Dados do cartão e titular são obrigatórios para pagamento via cartão de crédito.");
      }
      payload.creditCard = {
        holderName: input.creditCard.holderName,
        number: input.creditCard.number.replace(/\s+/g, ""),
        expiryMonth: input.creditCard.expiryMonth.padStart(2, "0"),
        expiryYear: input.creditCard.expiryYear.length === 2 ? `20${input.creditCard.expiryYear}` : input.creditCard.expiryYear,
        ccv: input.creditCard.ccv,
      };
      payload.creditCardHolderInfo = {
        name: input.creditCardHolderInfo.name,
        email: input.creditCardHolderInfo.email,
        cpfCnpj: input.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ""),
        postalCode: input.creditCardHolderInfo.postalCode.replace(/\D/g, ""),
        addressNumber: input.creditCardHolderInfo.addressNumber,
        addressComplement: input.creditCardHolderInfo.addressComplement,
        phone: input.creditCardHolderInfo.phone.replace(/\D/g, ""),
        mobilePhone: (input.creditCardHolderInfo.mobilePhone || input.creditCardHolderInfo.phone).replace(/\D/g, ""),
      };
      if (input.remoteIp) {
        payload.remoteIp = input.remoteIp;
      }
    }

    return this.requestAsaas("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * 3. Obtém QR Code e Pix Copia e Cola
   */
  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResult> {
    return this.requestAsaas<AsaasPixQrCodeResult>(`/payments/${paymentId}/pixQrCode`, {
      method: "GET",
    });
  },

  /**
   * 4. Consulta status do pagamento
   */
  async getPayment(paymentId: string): Promise<{
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    externalReference?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
  }> {
    return this.requestAsaas(`/payments/${paymentId}`, {
      method: "GET",
    });
  },
};
