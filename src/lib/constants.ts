export const EIA_WHATSAPP = "5511999999999"; // TODO: substituir pelo número oficial da EIA Digital

export const NICHES = [
  "Alimentação",
  "Beleza & Estética",
  "Saúde",
  "Educação",
  "Moda",
  "Serviços",
  "Comércio",
  "Tecnologia",
  "Imobiliário",
  "Outro",
] as const;

export const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const MAIN_GOALS = [
  { value: "clientes", label: "Conseguir mais clientes" },
  { value: "site", label: "Criar um site" },
  { value: "google", label: "Aparecer no Google" },
  { value: "atendimento", label: "Melhorar atendimento" },
  { value: "whatsapp", label: "Automatizar WhatsApp" },
  { value: "outro", label: "Ainda não sei" },
] as const;

export function whatsappLink(msg: string) {
  return `https://wa.me/${EIA_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
