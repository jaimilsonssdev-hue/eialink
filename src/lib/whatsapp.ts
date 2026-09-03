import { buildAttributedWhatsAppUrl } from "./attribution";

export function whatsappUrl(phone?: string | null, message?: string | null) {
  const number = phone?.replace(/\D/g, "");
  if (!number) return undefined;
  return buildAttributedWhatsAppUrl(number, message);
}
