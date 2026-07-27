export type BlockType =
  "banner" | "about" | "buttons" | "whatsapp" | "pix" | "social" | "contact" | "divider" | "spacer";
export type PageBlock = {
  id: string;
  type: BlockType;
  enabled: boolean;
  position: number;
  data: Record<string, unknown>;
};
export const blockCatalog: { type: BlockType; label: string; description: string }[] = [
  { type: "banner", label: "Banner", description: "Capa, título e subtítulo" },
  { type: "about", label: "Sobre", description: "Avatar, nome e descrição" },
  { type: "buttons", label: "Botões", description: "Links e chamadas" },
  { type: "whatsapp", label: "WhatsApp", description: "Contato prioritário" },
  { type: "pix", label: "Pix", description: "Chave e pagamento" },
  { type: "social", label: "Redes sociais", description: "Seus canais" },
  { type: "contact", label: "Contato", description: "Telefone, e-mail e endereço" },
  { type: "divider", label: "Divisor", description: "Separador visual" },
  { type: "spacer", label: "Espaçador", description: "Respiro entre blocos" },
];
export const newBlock = (type: BlockType, position: number): PageBlock => ({
  id: crypto.randomUUID(),
  type,
  enabled: true,
  position,
  data:
    type === "banner"
      ? { title: "Sua presença digital", subtitle: "Bem-vindo" }
      : type === "about"
        ? { name: "Seu negócio", description: "Conte sua história" }
        : type === "whatsapp"
          ? { number: "", message: "Olá!" }
          : type === "pix"
            ? { title: "Pague com Pix", key: "" }
            : type === "buttons"
              ? { items: [] }
              : {},
});
