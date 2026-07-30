export function whatsappUrl(phone?: string | null, message?: string | null) {
  const number = phone?.replace(/\D/g, "");
  if (!number) return undefined;
  const text = message?.trim();
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
