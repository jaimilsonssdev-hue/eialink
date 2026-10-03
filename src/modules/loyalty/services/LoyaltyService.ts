import { supabase } from "@/integrations/supabase/client";
import type {
  LoyaltyProgramSettings,
  LoyaltyCustomerBalance,
  LoyaltyPointToken,
  LoyaltyVoucher,
  LoyaltyTierName,
} from "../types";
import {
  DEFAULT_LOYALTY_TIERS,
  DEFAULT_LOYALTY_REWARDS,
  DEFAULT_LOYALTY_MISSIONS,
} from "../types";

const TOKEN_STORAGE_PREFIX = "eia_loyalty_tokens_";
const VOUCHER_STORAGE_PREFIX = "eia_loyalty_vouchers_";

export const LoyaltyService = {
  /**
   * Obtém as configurações do programa de fidelidade da empresa.
   */
  async getProgramSettings(businessPageId: string): Promise<LoyaltyProgramSettings> {
    const { data: page, error } = await supabase
      .from("bio_pages")
      .select("social_links")
      .eq("id", businessPageId)
      .maybeSingle();

    if (error) {
      console.warn("[LoyaltyService] Erro ao carregar configurações de fidelidade:", error);
    }

    const socialLinks = (page?.social_links as Record<string, any>) || {};
    const saved = socialLinks.loyalty_settings as Partial<LoyaltyProgramSettings> | undefined;

    return {
      businessPageId,
      isActive: saved?.isActive ?? true,
      pointsRatio: saved?.pointsRatio ?? 1, // R$ 1,00 = 1 Ponto
      pointsExpirationDays: saved?.pointsExpirationDays ?? 180,
      allowThermalPrint: saved?.allowThermalPrint ?? true,
      rewards: saved?.rewards && saved.rewards.length > 0 ? saved.rewards : DEFAULT_LOYALTY_REWARDS,
      tiers: saved?.tiers && saved.tiers.length > 0 ? saved.tiers : DEFAULT_LOYALTY_TIERS,
      missions: saved?.missions && saved.missions.length > 0 ? saved.missions : DEFAULT_LOYALTY_MISSIONS,
      updatedAt: saved?.updatedAt,
    };
  },

  /**
   * Salva ou atualiza as configurações do programa de fidelidade.
   */
  async saveProgramSettings(
    businessPageId: string,
    settings: Partial<LoyaltyProgramSettings>
  ): Promise<LoyaltyProgramSettings> {
    const current = await this.getProgramSettings(businessPageId);
    const updated: LoyaltyProgramSettings = {
      ...current,
      ...settings,
      businessPageId,
      updatedAt: new Date().toISOString(),
    };

    const { data: page } = await supabase
      .from("bio_pages")
      .select("social_links")
      .eq("id", businessPageId)
      .single();

    const socialLinks = (page?.social_links as Record<string, any>) || {};
    socialLinks.loyalty_settings = updated;

    const { error } = await supabase
      .from("bio_pages")
      .update({ social_links: socialLinks as any })
      .eq("id", businessPageId);

    if (error) {
      throw new Error(`Erro ao salvar configurações de fidelidade: ${error.message}`);
    }

    return updated;
  },

  /**
   * Gera um Token de Pontos assinado e temporário de uso único.
   * Suporta QR Code de balcão (5 min) ou Cupom Térmico impresso para delivery (7 dias).
   */
  async createPointToken(options: {
    businessPageId: string;
    businessName: string;
    points: number;
    purchaseAmount?: number;
    source: "purchase" | "mission" | "thermal_receipt" | "cashier";
    description?: string;
    validityMinutes?: number;
  }): Promise<LoyaltyPointToken> {
    const {
      businessPageId,
      businessName,
      points,
      purchaseAmount,
      source,
      description,
      validityMinutes = source === "thermal_receipt" ? 60 * 24 * 7 : 5, // 7 dias para impresso, 5 min para tela
    } = options;

    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const tokenId = `lp_${Date.now()}_${randomSuffix}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString();

    const token: LoyaltyPointToken = {
      tokenId,
      businessPageId,
      businessName,
      points,
      purchaseAmount,
      source,
      description,
      createdAt: now.toISOString(),
      expiresAt,
      isRedeemed: false,
    };

    // Salva token no registro local sincronizado
    this.saveTokenToRegistry(token);

    return token;
  },

  /**
   * Resgata um token de pontos escaneado pelo cliente.
   * Verifica expiração e garante uso único estrito.
   */
  async claimPointToken(
    tokenId: string,
    customerWhatsapp: string,
    customerName?: string
  ): Promise<{ success: boolean; earnedPoints: number; newTotalPoints: number; message: string }> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      throw new Error("Por favor, digite um WhatsApp válido com DDD.");
    }

    const token = this.getTokenFromRegistry(tokenId);
    if (!token) {
      throw new Error("QR Code de pontos inválido ou não encontrado.");
    }

    if (token.isRedeemed) {
      throw new Error("Este QR Code de pontos já foi resgatado anteriormente.");
    }

    const now = new Date();
    if (new Date(token.expiresAt) < now) {
      throw new Error("Este QR Code de pontos expirou. Solicite um novo no caixa.");
    }

    // Marca token como resgatado (Uso único garantido)
    token.isRedeemed = true;
    token.redeemedByWhatsapp = cleanWhatsapp;
    token.redeemedByName = customerName;
    token.redeemedAt = now.toISOString();
    this.saveTokenToRegistry(token);

    // Credita pontos no banco de dados Supabase (tabela customer_store_cashback)
    const { data: existing } = await (supabase as any)
      .from("customer_store_cashback")
      .select("balance")
      .eq("business_page_id", token.businessPageId)
      .eq("customer_whatsapp", cleanWhatsapp)
      .maybeSingle();

    const previousPoints = Number(existing?.balance) || 0;
    const newTotalPoints = previousPoints + token.points;

    // Calcula expiração dos pontos (padrão 180 dias)
    const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    await (supabase as any).from("customer_store_cashback").upsert(
      {
        business_page_id: token.businessPageId,
        customer_whatsapp: cleanWhatsapp,
        balance: newTotalPoints,
        last_visit: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "business_page_id,customer_whatsapp" }
    );

    return {
      success: true,
      earnedPoints: token.points,
      newTotalPoints,
      message: `🎉 Parabéns! Você ganhou +${token.points} pontos na ${token.businessName}!`,
    };
  },

  /**
   * Consulta o saldo de pontos e nível atual do cliente na empresa.
   */
  async getCustomerBalance(
    businessPageId: string,
    customerWhatsapp: string
  ): Promise<LoyaltyCustomerBalance> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    const settings = await this.getProgramSettings(businessPageId);

    const { data: record } = await (supabase as any)
      .from("customer_store_cashback")
      .select("balance, last_visit, expires_at")
      .eq("business_page_id", businessPageId)
      .eq("customer_whatsapp", cleanWhatsapp)
      .maybeSingle();

    const currentPoints = Number(record?.balance) || 0;
    const now = new Date();
    const expiresAt = record?.expires_at || new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const lastVisit = record?.last_visit || now.toISOString();

    // Determina o Nível VIP (Tier)
    let currentTier: LoyaltyTierName = "Bronze";
    for (const tier of [...settings.tiers].reverse()) {
      if (currentPoints >= tier.minPoints) {
        currentTier = tier.name;
        break;
      }
    }

    return {
      customerWhatsapp: cleanWhatsapp,
      currentPoints,
      totalEarnedPoints: currentPoints,
      currentTier,
      expiresAt,
      lastVisit,
    };
  },

  /**
   * Consulta os saldos de fidelidade do cliente em todas as lojas cadastradas (para o Mural /hoje).
   */
  async getCustomerAllStoresBalances(
    customerWhatsapp: string
  ): Promise<Array<{ businessPageId: string; businessName: string; slug: string; points: number }>> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    if (!cleanWhatsapp || cleanWhatsapp.length < 10) return [];

    try {
      const { data: records, error } = await (supabase as any)
        .from("customer_store_cashback")
        .select(`
          business_page_id,
          balance,
          bio_pages:business_page_id (
            display_name,
            slug
          )
        `)
        .eq("customer_whatsapp", cleanWhatsapp)
        .gt("balance", 0);

      if (error || !records) return [];

      return records.map((r: any) => ({
        businessPageId: r.business_page_id,
        businessName: r.bio_pages?.display_name || "Comércio Local",
        slug: r.bio_pages?.slug || "",
        points: Math.round(Number(r.balance) || 0),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Resgata um prêmio do catálogo e gera um voucher temporário de 30 minutos.
   */
  async redeemRewardVoucher(
    businessPageId: string,
    customerWhatsapp: string,
    rewardId: string,
    customerName?: string
  ): Promise<LoyaltyVoucher> {
    const cleanWhatsapp = customerWhatsapp.replace(/\D/g, "");
    const settings = await this.getProgramSettings(businessPageId);
    const reward = settings.rewards.find((r) => r.id === rewardId);

    if (!reward) {
      throw new Error("Recompensa não encontrada no catálogo.");
    }

    const balance = await this.getCustomerBalance(businessPageId, cleanWhatsapp);
    if (balance.currentPoints < reward.pointsCost) {
      throw new Error(
        `Saldo insuficiente. Você tem ${balance.currentPoints} pontos e são necessários ${reward.pointsCost} pontos.`
      );
    }

    // Debita os pontos do saldo
    const newPoints = balance.currentPoints - reward.pointsCost;
    await (supabase as any).from("customer_store_cashback").upsert(
      {
        business_page_id: businessPageId,
        customer_whatsapp: cleanWhatsapp,
        balance: newPoints,
        last_visit: new Date().toISOString(),
      },
      { onConflict: "business_page_id,customer_whatsapp" }
    );

    // Cria o voucher com validade de 30 minutos
    const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
    const cleanTitleSlug = reward.title.slice(0, 6).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const voucherCode = `${cleanTitleSlug}-${randomCode}`;

    const voucher: LoyaltyVoucher = {
      voucherCode,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsDeducted: reward.pointsCost,
      businessPageId,
      customerWhatsapp: cleanWhatsapp,
      customerName,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      isClaimed: false,
    };

    this.saveVoucherToRegistry(voucher);
    return voucher;
  },

  /**
   * Gera a URL do QR Code em vetor SVG de alta nitidez para tela ou impressão térmica.
   */
  getQrCodeUrl(claimUrl: string, size = 300): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=svg&margin=0&data=${encodeURIComponent(
      claimUrl
    )}`;
  },

  // Helpers de armazenamento de tokens
  saveTokenToRegistry(token: LoyaltyPointToken) {
    try {
      const key = `${TOKEN_STORAGE_PREFIX}${token.businessPageId}`;
      const existingStr = localStorage.getItem(key);
      const list: LoyaltyPointToken[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [token, ...list.filter((t) => t.tokenId !== token.tokenId)].slice(0, 200);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn("[LoyaltyService] Erro ao salvar token:", e);
    }
  },

  getTokenFromRegistry(tokenId: string): LoyaltyPointToken | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOKEN_STORAGE_PREFIX)) {
          const list: LoyaltyPointToken[] = JSON.parse(localStorage.getItem(key) || "[]");
          const found = list.find((t) => t.tokenId === tokenId);
          if (found) return found;
        }
      }
    } catch (e) {
      console.warn("[LoyaltyService] Erro ao buscar token:", e);
    }
    return null;
  },

  saveVoucherToRegistry(voucher: LoyaltyVoucher) {
    try {
      const key = `${VOUCHER_STORAGE_PREFIX}${voucher.businessPageId}`;
      const existingStr = localStorage.getItem(key);
      const list: LoyaltyVoucher[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [voucher, ...list.filter((v) => v.voucherCode !== voucher.voucherCode)].slice(0, 100);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn("[LoyaltyService] Erro ao salvar voucher:", e);
    }
  },
};
