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

  // Flash deals (relâmpago)
  is_flash?: boolean;
  start_time?: string | null;
  end_time?: string | null;

  // Campos opcionais do join com bio_pages
  business_name?: string;
  slug?: string;
  avatar_url?: string | null;
  whatsapp_number?: string | null;
}

export interface ClaimDealResult {
  success: boolean;
  error?: string;
  claim_code?: string;
  remaining_global_today?: number;
  deal_title?: string;
  claims_count?: number;
  remaining?: number | null;
}

export interface DealClaim {
  id: string;
  deal_id: string;
  business_page_id: string;
  customer_whatsapp: string;
  customer_name?: string | null;
  claim_code: string;
  status: "claimed" | "used" | "expired";
  created_at: string;
  used_at?: string | null;
  referred_by_page_id?: string | null;

  // Campos opcionais de join
  deal_title?: string;
  business_name?: string;
  business_slug?: string;
}

export interface StoreCashbackSettings {
  business_page_id: string;
  is_active: boolean;
  percentage: number;
  validity_days: number;
  allow_first_purchase_discount: boolean;
  prevent_double_discount: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerCashback {
  id: string;
  business_page_id: string;
  customer_whatsapp: string;
  balance: number;
  last_visit: string;
  expires_at?: string | null;
}

export interface AddCashbackTransactionResult {
  success: boolean;
  message?: string;
  earnedCashback: number;
  newBalance: number;
  immediateDiscountApplied: boolean;
  discountAmount: number;
  finalPurchaseAmount: number;
  expiresAt?: string | null;
}

export interface UseCashbackResult {
  success: boolean;
  message?: string;
  usedAmount: number;
  remainingBalance: number;
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
  is_flash?: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

export interface CreatePartnershipInput {
  host_page_id: string;
  partner_page_id: string;
  benefit_text: string;
  badge_label?: string;
}

export interface AtRiskCustomer {
  customer_whatsapp: string;
  customer_name?: string;
  balance: number;
  last_visit: string;
  days_since_visit: number;
  expires_at?: string | null;
  status: "expiring_soon" | "at_risk" | "lost" | "active";
}

export interface ReactivationMessageResult {
  text: string;
  whatsappUrl: string;
}

export interface ServiceProvider {
  id: string;
  display_name: string;
  slug: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  description?: string | null;
  category: string;
  niche?: string | null;
  city: string;
  whatsapp?: string | null;
  instagram?: string | null;
  is_verified?: boolean;
  featured?: boolean;
  services?: Array<{ name: string; price?: number; description?: string }>;
  created_at: string;
}
