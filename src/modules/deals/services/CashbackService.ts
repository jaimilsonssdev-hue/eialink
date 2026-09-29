import { supabase } from "@/integrations/supabase/client";
import type {
  StoreCashbackSettings,
  CustomerCashback,
  AddCashbackTransactionResult,
  UseCashbackResult,
} from "../types";

export const CashbackService = {
  /**
   * Obtém as configurações de cashback de uma loja/página.
   */
  async getCashbackSettings(businessPageId: string): Promise<StoreCashbackSettings | null> {
    const { data, error } = await (supabase as any)
      .from("store_cashback_settings")
      .select("*")
      .eq("business_page_id", businessPageId)
      .maybeSingle();

    if (error) {
      console.error("[CashbackService] Erro ao buscar configurações de cashback:", error);
      throw error;
    }

    if (!data) return null;

    return {
      business_page_id: data.business_page_id,
      is_active: Boolean(data.is_active),
      percentage: Number(data.percentage) || 5.0,
      validity_days: Number(data.validity_days) || 30,
      allow_first_purchase_discount: Boolean(data.allow_first_purchase_discount),
      prevent_double_discount: Boolean(data.prevent_double_discount),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Cria ou atualiza as configurações de cashback da loja.
   */
  async updateCashbackSettings(
    settings: Partial<StoreCashbackSettings> & { business_page_id: string }
  ): Promise<StoreCashbackSettings> {
    const payload = {
      business_page_id: settings.business_page_id,
      is_active: settings.is_active ?? false,
      percentage: settings.percentage != null ? Number(settings.percentage) : 5.0,
      validity_days: settings.validity_days != null ? Number(settings.validity_days) : 30,
      allow_first_purchase_discount: settings.allow_first_purchase_discount ?? false,
      prevent_double_discount: settings.prevent_double_discount ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase as any)
      .from("store_cashback_settings")
      .upsert(payload, { onConflict: "business_page_id" })
      .select()
      .single();

    if (error) {
      console.error("[CashbackService] Erro ao atualizar configurações de cashback:", error);
      throw error;
    }

    return {
      business_page_id: data.business_page_id,
      is_active: Boolean(data.is_active),
      percentage: Number(data.percentage),
      validity_days: Number(data.validity_days),
      allow_first_purchase_discount: Boolean(data.allow_first_purchase_discount),
      prevent_double_discount: Boolean(data.prevent_double_discount),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Consulta o saldo de cashback do cliente na loja específica pelo WhatsApp.
   */
  async getCustomerBalance(
    businessPageId: string,
    customerWhatsapp: string
  ): Promise<CustomerCashback | null> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    if (!cleanWhatsapp) return null;

    const { data, error } = await (supabase as any)
      .from("customer_store_cashback")
      .select("*")
      .eq("business_page_id", businessPageId)
      .eq("customer_whatsapp", cleanWhatsapp)
      .maybeSingle();

    if (error) {
      console.error("[CashbackService] Erro ao buscar saldo do cliente:", error);
      throw error;
    }

    if (!data) return null;

    // Checa se o cashback expirou
    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const isExpired = expiresAt && expiresAt < now;

    return {
      id: data.id,
      business_page_id: data.business_page_id,
      customer_whatsapp: data.customer_whatsapp,
      balance: isExpired ? 0 : Number(data.balance) || 0,
      last_visit: data.last_visit,
      expires_at: data.expires_at,
    };
  },

  /**
   * Registra uma compra e credita o cashback para o cliente.
   * Regra 4 de proteção de margem: se isPartnerReferral = true,
   * não aplica desconto na 1ª compra na hora (se prevent_double_discount = true),
   * mas gera saldo futuro para a próxima visita.
   */
  async addCashbackTransaction(
    businessPageId: string,
    customerWhatsapp: string,
    purchaseAmount: number,
    isPartnerReferral: boolean = false
  ): Promise<AddCashbackTransactionResult> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    if (!cleanWhatsapp || cleanWhatsapp.length < 8) {
      throw new Error("Número de WhatsApp do cliente inválido.");
    }
    if (purchaseAmount <= 0) {
      throw new Error("Valor da compra deve ser superior a zero.");
    }

    const settings = await this.getCashbackSettings(businessPageId);
    if (!settings || !settings.is_active) {
      return {
        success: false,
        message: "O programa de cashback está desativado nesta loja.",
        earnedCashback: 0,
        newBalance: 0,
        immediateDiscountApplied: false,
        discountAmount: 0,
        finalPurchaseAmount: purchaseAmount,
      };
    }

    // Regra 4: Proteção de Margem para cupom de parceiro cruzado
    let immediateDiscountApplied = false;
    let discountAmount = 0;
    let finalPurchaseAmount = purchaseAmount;

    if (isPartnerReferral && (settings.prevent_double_discount || !settings.allow_first_purchase_discount)) {
      // Cliente veio de indicação/cupom de parceiro:
      // NÃO recebe desconto imediato na 1ª compra para não canibalizar margem do lojista,
      // mas acumula saldo futuro integral para a 2ª visita!
      immediateDiscountApplied = false;
      discountAmount = 0;
      finalPurchaseAmount = purchaseAmount;
    }

    // Cálculo do cashback gerado (arredondado para 2 casas decimais)
    const earnedCashback = Math.round(purchaseAmount * (settings.percentage / 100) * 100) / 100;

    // Data de expiração baseada na validade da loja
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.validity_days);
    const expiresAtISO = expiresAt.toISOString();

    // Consulta saldo anterior
    const currentCustomer = await this.getCustomerBalance(businessPageId, cleanWhatsapp);
    const prevBalance = currentCustomer ? currentCustomer.balance : 0;
    const newBalance = Math.round((prevBalance + earnedCashback) * 100) / 100;

    // Upsert na tabela customer_store_cashback
    const payload = {
      business_page_id: businessPageId,
      customer_whatsapp: cleanWhatsapp,
      balance: newBalance,
      last_visit: new Date().toISOString(),
      expires_at: expiresAtISO,
    };

    const { error: upsertError } = await (supabase as any)
      .from("customer_store_cashback")
      .upsert(payload, { onConflict: "business_page_id,customer_whatsapp" });

    if (upsertError) {
      console.error("[CashbackService] Erro ao creditar cashback:", upsertError);
      throw upsertError;
    }

    return {
      success: true,
      message: isPartnerReferral
        ? `Parceria validada! Cashback de R$ ${earnedCashback.toFixed(2).replace(".", ",")} creditado para a próxima compra.`
        : `Cashback de R$ ${earnedCashback.toFixed(2).replace(".", ",")} acumulado com sucesso!`,
      earnedCashback,
      newBalance,
      immediateDiscountApplied,
      discountAmount,
      finalPurchaseAmount,
      expiresAt: expiresAtISO,
    };
  },

  /**
   * Resgata/utiliza saldo de cashback do cliente na loja durante um pagamento.
   */
  async useCustomerCashback(
    businessPageId: string,
    customerWhatsapp: string,
    amount: number
  ): Promise<UseCashbackResult> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    if (!cleanWhatsapp) {
      throw new Error("WhatsApp inválido.");
    }
    if (amount <= 0) {
      throw new Error("O valor de resgate deve ser maior que zero.");
    }

    const customer = await this.getCustomerBalance(businessPageId, cleanWhatsapp);
    if (!customer || customer.balance <= 0) {
      return {
        success: false,
        message: "Cliente não possui saldo de cashback ativo nesta loja.",
        usedAmount: 0,
        remainingBalance: 0,
      };
    }

    if (customer.balance < amount) {
      return {
        success: false,
        message: `Saldo insuficiente. Disponível: R$ ${customer.balance.toFixed(2).replace(".", ",")}`,
        usedAmount: 0,
        remainingBalance: customer.balance,
      };
    }

    const remainingBalance = Math.round((customer.balance - amount) * 100) / 100;

    const { error } = await (supabase as any)
      .from("customer_store_cashback")
      .update({
        balance: remainingBalance,
        last_visit: new Date().toISOString(),
      })
      .eq("business_page_id", businessPageId)
      .eq("customer_whatsapp", cleanWhatsapp);

    if (error) {
      console.error("[CashbackService] Erro ao abater cashback:", error);
      throw error;
    }

    return {
      success: true,
      message: `R$ ${amount.toFixed(2).replace(".", ",")} de cashback resgatado com sucesso!`,
      usedAmount: amount,
      remainingBalance,
    };
  },
};

export default CashbackService;
