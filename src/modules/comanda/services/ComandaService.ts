import {
  getComandaSettingsFn,
  saveComandaSettingsFn,
  submitComandaOrderFn,
  callWaiterFn,
  waiterLoginFn,
  listWaiterDashboardFn,
  listKitchenDashboardFn,
  updateComandaOrderStatusFn,
  dismissWaiterCallFn,
  resolveDynamicCodeFn,
} from "../comanda.functions";
import type {
  ComandaSettings,
  ComandaItem,
  ComandaOrderStatus,
} from "../types";

export const ComandaService = {
  /**
   * Obtém as configurações da Comanda Digital para a página
   */
  async getSettings(bioPageId: string) {
    return getComandaSettingsFn({ data: { bioPageId } });
  },

  /**
   * Salva as configurações de mesas, garçons e modo
   */
  async saveSettings(bioPageId: string, settings: ComandaSettings) {
    return saveComandaSettingsFn({ data: { bioPageId, settings } });
  },

  /**
   * Envia o pedido da mesa
   */
  async submitOrder(input: {
    bioPageId: string;
    tableNumber: string;
    waiterId?: string | null;
    waiterName?: string | null;
    items: ComandaItem[];
    customerName?: string | null;
    customerPhone?: string | null;
    notes?: string | null;
  }) {
    return submitComandaOrderFn({ data: input });
  },

  /**
   * Dispara o chamado do garçom com som de campainha
   */
  async callWaiter(input: {
    bioPageId: string;
    tableNumber: string;
    reason: string;
    waiterId?: string | null;
    waiterName?: string | null;
  }) {
    return callWaiterFn({ data: input });
  },

  /**
   * Login rápido de garçom por PIN de 4 dígitos
   */
  async waiterLogin(bioPageId: string, pin: string) {
    return waiterLoginFn({ data: { bioPageId, pin } });
  },

  /**
   * Lista chamados e pedidos ativos para o garçom
   */
  async listWaiterDashboard(bioPageId: string, waiterId?: string | null) {
    return listWaiterDashboardFn({ data: { bioPageId, waiterId } });
  },

  /**
   * Lista pedidos em preparo ou prontos para a Cozinha KDS
   */
  async listKitchenDashboard(bioPageId: string) {
    return listKitchenDashboardFn({ data: { bioPageId } });
  },

  /**
   * Atualiza status do pedido
   */
  async updateOrderStatus(orderId: string, status: ComandaOrderStatus, bioPageId: string) {
    return updateComandaOrderStatusFn({ data: { orderId, status, bioPageId } });
  },

  /**
   * Silencia / atende o chamado do garçom
   */
  async dismissWaiterCall(callId: string, bioPageId: string) {
    return dismissWaiterCallFn({ data: { callId, bioPageId } });
  },

  /**
   * Resolve o código curto do QR Code ou NFC
   */
  async resolveDynamicCode(code: string) {
    return resolveDynamicCodeFn({ data: { code } });
  },

  /**
   * Gera a URL da imagem do QR Code em alta definição (para visualização e download)
   */
  getQrCodeImageUrl(contentUrl: string, size = 400): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&margin=10&data=${encodeURIComponent(
      contentUrl,
    )}`;
  },
};

