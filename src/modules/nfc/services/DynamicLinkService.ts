import {
  listDynamicLinksFn,
  saveDynamicLinkFn,
  deleteDynamicLinkFn,
  resolveDynamicLinkFn,
} from "../nfc.functions";
import type { DynamicLink, VCardData } from "../types";

export const DynamicLinkService = {
  /**
   * Lista todos os links dinâmicos e plaquinhas cadastradas
   */
  async list(): Promise<DynamicLink[]> {
    const res = await listDynamicLinksFn();
    return res?.links || [];
  },

  /**
   * Cria ou atualiza um link dinâmico
   */
  async save(link: Partial<DynamicLink> & { code: string; title: string }) {
    return saveDynamicLinkFn({ data: { link } });
  },

  /**
   * Exclui um link dinâmico
   */
  async delete(id: string) {
    return deleteDynamicLinkFn({ data: { id } });
  },

  /**
   * Resolve o código curto (/r/$code) e incrementa cliques
   */
  async resolve(code: string) {
    return resolveDynamicLinkFn({ data: { code } });
  },

  /**
   * Retorna a URL curta canônica da plaquinha (/r/$code)
   */
  getShortUrl(code: string): string {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://eialink.com";
    return `${origin}/r/${code.toLowerCase().trim()}`;
  },

  /**
   * Gera a URL da imagem de QR Code em alta resolução (PNG)
   */
  getQrCodeUrl(targetUrl: string, size = 500): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&margin=10&data=${encodeURIComponent(
      targetUrl,
    )}`;
  },

  /**
   * Gera e dispara o download de um arquivo vCard (.vcf)
   */
  downloadVCard(data: VCardData, filename = "contato.vcf") {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${data.fullName || "Contato"}`,
      data.company ? `ORG:${data.company}` : "",
      data.role ? `TITLE:${data.role}` : "",
      data.phone ? `TEL;TYPE=CELL:${data.phone}` : "",
      data.email ? `EMAIL:${data.email}` : "",
      data.website ? `URL:${data.website}` : "",
      "END:VCARD",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".vcf") ? filename : `${filename}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
