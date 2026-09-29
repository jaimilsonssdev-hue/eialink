-- ==============================================================================
-- DRIZZLE MIGRATION: 0003_coupons_cashback_system.sql
-- ==============================================================================

ALTER TABLE public.daily_deals 
ADD COLUMN IF NOT EXISTS is_flash BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS start_time TIME NULL,
ADD COLUMN IF NOT EXISTS end_time TIME NULL;

CREATE TABLE IF NOT EXISTS public.deal_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.daily_deals(id) ON DELETE CASCADE NOT NULL,
    business_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    customer_name TEXT NULL,
    claim_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'used', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ NULL,
    referred_by_page_id UUID REFERENCES public.bio_pages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS deal_claims_whatsapp_created_idx 
ON public.deal_claims (customer_whatsapp, created_at);

CREATE TABLE IF NOT EXISTS public.store_cashback_settings (
    business_page_id UUID PRIMARY KEY REFERENCES public.bio_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    percentage NUMERIC DEFAULT 5.0,
    validity_days INTEGER DEFAULT 30,
    allow_first_purchase_discount BOOLEAN DEFAULT FALSE,
    prevent_double_discount BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_store_cashback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    balance NUMERIC DEFAULT 0.0 CHECK (balance >= 0),
    last_visit TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NULL,
    UNIQUE (business_page_id, customer_whatsapp)
);

CREATE INDEX IF NOT EXISTS customer_store_cashback_search_idx 
ON public.customer_store_cashback (business_page_id, customer_whatsapp);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_claims TO authenticated, anon;
GRANT ALL ON public.deal_claims TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_cashback_settings TO authenticated;
GRANT SELECT ON public.store_cashback_settings TO anon;
GRANT ALL ON public.store_cashback_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_store_cashback TO authenticated;
GRANT SELECT ON public.customer_store_cashback TO anon;
GRANT ALL ON public.customer_store_cashback TO service_role;

ALTER TABLE public.deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cashback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_store_cashback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_deal_with_limits(
  p_deal_id UUID,
  p_customer_whatsapp TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_referred_by_page_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_today_claims INTEGER;
  v_already_claimed_deal BOOLEAN;
  v_claim_code TEXT;
  v_new_claim RECORD;
BEGIN
  p_customer_whatsapp := regexp_replace(p_customer_whatsapp, '\D', '', 'g');

  IF p_customer_whatsapp IS NULL OR length(p_customer_whatsapp) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Número de WhatsApp inválido');
  END IF;
  
  SELECT * INTO v_deal
  FROM public.daily_deals
  WHERE id = p_deal_id
    AND is_active = true
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta não encontrada ou inativa');
  END IF;

  IF v_deal.max_claims IS NOT NULL AND v_deal.claims_count >= v_deal.max_claims THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta oferta já esgotou seus cupons de hoje');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.deal_claims
    WHERE deal_id = p_deal_id
      AND customer_whatsapp = p_customer_whatsapp
      AND created_at >= date_trunc('day', now())
  ) INTO v_already_claimed_deal;

  IF v_already_claimed_deal THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este cupom hoje');
  END IF;

  SELECT count(*) INTO v_today_claims
  FROM public.deal_claims
  WHERE customer_whatsapp = p_customer_whatsapp
    AND created_at >= date_trunc('day', now());

  IF v_today_claims >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já atingiu seu limite de 2 cupons de hoje na rede. Volte amanhã!');
  END IF;

  v_claim_code := 'EIA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  INSERT INTO public.deal_claims (
    deal_id,
    business_page_id,
    customer_whatsapp,
    customer_name,
    claim_code,
    referred_by_page_id
  ) VALUES (
    p_deal_id,
    v_deal.bio_page_id,
    p_customer_whatsapp,
    p_customer_name,
    v_claim_code,
    p_referred_by_page_id
  ) RETURNING * INTO v_new_claim;

  UPDATE public.daily_deals
  SET claims_count = claims_count + 1
  WHERE id = p_deal_id;

  RETURN jsonb_build_object(
    'success', true,
    'claim_code', v_claim_code,
    'remaining_global_today', 1 - v_today_claims,
    'deal_title', v_deal.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_deal_with_limits(UUID, TEXT, TEXT, UUID) TO anon, authenticated, service_role;
