export type DynamicLinkType =
  | "google_review" // Plaquinha de Avaliação 5 Estrelas no Google Maps
  | "pix"           // Plaquinha de Pagamento Pix Balcão
  | "instagram"     // Plaquinha Siga-nos no Instagram
  | "whatsapp"      // Contato direto no WhatsApp
  | "menu_comanda"  // Cardápio & Comanda Digital
  | "vcard"         // Cartão de Visitas Inteligente
  | "custom";       // Link Personalizado

export interface VCardData {
  fullName?: string;
  phone?: string;
  email?: string;
  company?: string;
  role?: string;
  website?: string;
}

export interface DynamicLink {
  id: string;
  code: string; // Slug curto único (ex: "padaria-google", "barbearia-pix")
  title: string; // Nome da plaquinha (ex: "Plaquinha Balcão 1 - Padaria Central")
  company_name: string;
  type: DynamicLinkType;
  target_url: string; // Destino real atual (pode ser alterado a qualquer momento)
  active: boolean;
  clicks_count: number; // Quantas vezes foi aproximado via NFC ou escaneado via QR Code
  last_accessed_at?: string | null;
  google_place_id?: string | null; // Place ID do Google Meu Negócio
  pix_key?: string | null;
  pix_receiver_name?: string | null;
  pix_city?: string | null;
  instagram_username?: string | null;
  whatsapp_number?: string | null;
  vcard_data?: VCardData | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export type PlaqueSize = "10x15" | "7x10";

export type PlaqueColorTheme =
  | "google_clean"     // Fundo branco com cores Google
  | "luxury_black"     // Preto fosco com detalhes dourados
  | "pix_emerald"      // Fundo escuro com teal/verde oficial Pix
  | "instagram_vibe"   // Gradiente oficial do Instagram
  | "acrylic_transparent"; // Estilo acrílico cristal minimalista

export interface PlaqueTemplateConfig {
  type: DynamicLinkType;
  size: PlaqueSize;
  theme: PlaqueColorTheme;
  title: string;
  subtitle: string;
  ctaText: string;
  companyName: string;
  showNfcIcon: boolean;
  showQrCode: boolean;
  showStars: boolean;
}
