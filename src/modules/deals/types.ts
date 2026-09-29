export interface DailyDeal {
  id: string;
  bio_page_id: string;
  user_id: string;
  title: string;
  description: string | null;
  original_price: number | null;
  deal_price: number;
  discount_badge: string | null;
  image_url: string | null;
  claim_action_url: string | null;
  city: string | null;
  niche: string | null;
  starts_at: string;
  expires_at: string;
  clicks_count: number;
  max_claims?: number | null;
  claims_count: number;
  is_active: boolean;
  created_at: string;

  // Campos opcionais do join com bio_pages
  business_name?: string;
  slug?: string;
  avatar_url?: string | null;
  whatsapp_number?: string | null;
}

export interface ClaimDealResult {
  success: boolean;
  error?: string;
  claims_count?: number;
  remaining?: number | null;
}

export interface CrossTrafficPartnership {
  id: string;
  host_page_id: string;
  partner_page_id: string;
  benefit_text: string;
  badge_label: string;
  status: "active" | "paused" | "expired";
  clicks_count: number;
  created_at: string;

  // Dados do parceiro (join ou lookup)
  partner_name?: string;
  partner_slug?: string;
  partner_avatar?: string | null;
}

export interface CreateDailyDealInput {
  bio_page_id: string;
  title: string;
  description?: string | null;
  original_price?: number | null;
  deal_price: number;
  discount_badge?: string | null;
  image_url?: string | null;
  claim_action_url?: string | null;
  city?: string | null;
  niche?: string | null;
  starts_at?: string;
  expires_at: string;
  max_claims?: number | null;
  is_active?: boolean;
}

export interface CreatePartnershipInput {
  host_page_id: string;
  partner_page_id: string;
  benefit_text: string;
  badge_label?: string;
}
