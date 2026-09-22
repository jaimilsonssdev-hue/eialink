import {
  getGoogleAuthUrlFn,
  handleGoogleAuthCallbackFn,
  getGoogleCalendarStatusFn,
  disconnectGoogleCalendarFn,
  testGoogleCalendarSyncFn,
  syncGoogleCalendarEventFn,
  getGoogleApiCredentialsFn,
  saveGoogleApiCredentialsFn,
} from "../google-calendar.functions";

export interface GoogleCalendarStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  calendarId?: string;
}

export const GoogleCalendarService = {
  /**
   * Obtém a URL de autorização OAuth do Google e redireciona o usuário
   */
  async startGoogleOAuthFlow(bioPageId: string): Promise<string> {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const result = await getGoogleAuthUrlFn({
      data: {
        bioPageId,
        redirectOrigin: origin,
      },
    });
    return result.authUrl;
  },

  /**
   * Processa o código do callback do Google
   */
  async handleCallback(code: string, state: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return handleGoogleAuthCallbackFn({
      data: {
        code,
        state,
        redirectOrigin: origin,
      },
    });
  },

  /**
   * Obtém o status da conexão da Google Agenda para a bioPage especificada
   */
  async getStatus(bioPageId: string): Promise<GoogleCalendarStatus> {
    if (!bioPageId) return { connected: false };
    return getGoogleCalendarStatusFn({
      data: { bioPageId },
    });
  },

  /**
   * Desconecta a Google Agenda da página
   */
  async disconnect(bioPageId: string) {
    return disconnectGoogleCalendarFn({
      data: { bioPageId },
    });
  },

  /**
   * Envia um evento de teste para o Google Calendar do usuário
   */
  async sendTestEvent(bioPageId: string) {
    return testGoogleCalendarSyncFn({
      data: { bioPageId },
    });
  },

  /**
   * Sincronização automática disparada ao confirmar um agendamento
   */
  async syncAppointment(data: {
    bioPageId: string;
    serviceName: string;
    durationMinutes: number;
    startAt: string;
    endAt: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string | null;
    notes?: string | null;
    appointmentId?: string;
  }) {
    return syncGoogleCalendarEventFn({ data });
  },

  /**
   * Obtém as credenciais cadastradas na plataforma (para o Super Admin)
   */
  async getApiCredentials() {
    return getGoogleApiCredentialsFn();
  },

  /**
   * Salva as credenciais da API Google na plataforma (para o Super Admin)
   */
  async saveApiCredentials(clientId: string, clientSecret: string) {
    return saveGoogleApiCredentialsFn({
      data: { clientId, clientSecret },
    });
  },
};

