/**
 * WebNfcService
 * Gravação e leitura nativa de Tags NFC diretamente no navegador
 * Utiliza a API W3C Web NFC (window.NDEFReader)
 * Sem necessidade de instalar aplicativos externos como NFC Tools.
 */

export interface NfcWriteResult {
  success: boolean;
  message: string;
}

export interface NfcReadResult {
  serialNumber?: string;
  records: Array<{
    recordType: string;
    mediaType?: string;
    id?: string;
    data?: string;
  }>;
}

export const WebNfcService = {
  /**
   * Verifica se a API Web NFC é suportada no ambiente e navegador atual.
   * Suportado nativamente no Google Chrome, Edge e Opera em dispositivos Android sob HTTPS.
   */
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "NDEFReader" in window;
  },

  /**
   * Grava uma URL NDEF diretamente na tag ou plaquinha NFC aproximada.
   * Vibra o aparelho ao concluir e lança erros explicativos em caso de falha.
   */
  async writeUrl(
    targetUrl: string,
    options?: { signal?: AbortSignal; overwrite?: boolean },
  ): Promise<NfcWriteResult> {
    if (!this.isSupported()) {
      throw new Error(
        "Seu navegador não suporta a gravação direta Web NFC. Use o Google Chrome no Android ou utilize o link curto para gravar com o app NFC Tools.",
      );
    }

    if (!targetUrl || !targetUrl.trim()) {
      throw new Error("A URL de destino para gravação não pode estar vazia.");
    }

    try {
      const NDEFReaderClass = (window as unknown as { NDEFReader: new () => {
        write: (
          message: { records: Array<{ recordType: string; data: string }> },
          options?: { signal?: AbortSignal; overwrite?: boolean },
        ) => Promise<void>;
      } }).NDEFReader;

      const ndef = new NDEFReaderClass();

      // Escreve o registro de URL oficial NDEF
      await ndef.write(
        {
          records: [
            {
              recordType: "url",
              data: targetUrl.trim(),
            },
          ],
        },
        {
          signal: options?.signal,
          overwrite: options?.overwrite ?? true,
        },
      );

      // Feedback háptico tátil de sucesso
      this.triggerHapticFeedback("success");

      return {
        success: true,
        message: "Plaquinha/Tag NFC gravada com sucesso!",
      };
    } catch (err: unknown) {
      this.triggerHapticFeedback("error");

      const error = err as Error;
      if (error.name === "AbortError") {
        throw new Error("A operação de gravação foi cancelada pelo usuário.");
      }
      if (error.name === "NotAllowedError") {
        throw new Error(
          "Permissão de NFC negada. Ative o NFC nas configurações do seu celular e autorize a permissão no navegador.",
        );
      }
      if (error.name === "NotSupportedError") {
        throw new Error("O tipo de tag NFC aproximada não é compatível para gravação NDEF.");
      }
      if (error.name === "NetworkError") {
        throw new Error("Não foi possível transferir dados para a tag. Tente aproximar novamente.");
      }

      throw new Error(
        error.message || "Erro desconhecido ao tentar gravar na plaquinha NFC.",
      );
    }
  },

  /**
   * Lê o conteúdo de uma tag NFC aproximada para teste ou verificação
   */
  async scanTag(options?: {
    signal?: AbortSignal;
    onReading?: (data: NfcReadResult) => void;
  }): Promise<{ stop: () => void }> {
    if (!this.isSupported()) {
      throw new Error("Leitura Web NFC não suportada neste dispositivo/navegador.");
    }

    const NDEFReaderClass = (window as unknown as { NDEFReader: new () => {
      scan: (options?: { signal?: AbortSignal }) => Promise<void>;
      onreading: ((event: { serialNumber?: string; message: { records: Array<{ recordType: string; mediaType?: string; id?: string; data?: ArrayBuffer | string }> } }) => void) | null;
      onreadingerror: ((event: unknown) => void) | null;
    } }).NDEFReader;

    const ndef = new NDEFReaderClass();
    const abortController = new AbortController();
    const activeSignal = options?.signal || abortController.signal;

    await ndef.scan({ signal: activeSignal });

    ndef.onreading = (event) => {
      WebNfcService.triggerHapticFeedback("success");
      const records = event.message.records.map((r) => {
        let textData = "";
        if (r.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          textData = decoder.decode(r.data);
        } else if (typeof r.data === "string") {
          textData = r.data;
        }
        return {
          recordType: r.recordType,
          mediaType: r.mediaType,
          id: r.id,
          data: textData,
        };
      });

      if (options?.onReading) {
        options.onReading({
          serialNumber: event.serialNumber,
          records,
        });
      }
    };

    return {
      stop: () => {
        abortController.abort();
      },
    };
  },

  /**
   * Feedback tátil háptico (vibração no dispositivo móvel)
   */
  triggerHapticFeedback(type: "success" | "error" | "pulse") {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      if (type === "success") {
        navigator.vibrate([80, 60, 120]); // Dois toques curtos firmes
      } else if (type === "error") {
        navigator.vibrate([200, 100, 200]); // Alerta de erro
      } else if (type === "pulse") {
        navigator.vibrate(50); // Pulso sutil de aproximação
      }
    } catch {
      // Ignora navegadores sem permissão de vibração
    }
  },
};
