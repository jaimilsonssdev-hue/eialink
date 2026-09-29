-- ==============================================================================
-- MIGRAÇÃO: SISTEMA DE CUPONS, CASHBACK EXCLUSIVO & TRAVA GLOBAL DIÁRIA (EIA LINK)
-- ==============================================================================

-- 1. Extensão da tabela daily_deals
ALTER TABLE public.daily_deals 
ADD COLUMN IF NOT EXISTS is_flash BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS start_time TIME NULL,
ADD COLUMN IF NOT EXISTS end_time TIME NULL;

-- 2. Tabela de Resgates Globais: public.deal_claims
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

-- Índice composto para consulta ultrarrápida do limite diário por cliente
CREATE INDEX IF NOT EXISTS deal_claims_whatsapp_created_idx 
ON public.deal_claims (customer_whatsapp, created_at);

-- 3. Tabela de Configuração de Cashback da Loja: public.store_cashback_settings
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

-- 4. Tabela de Saldo de Clientes na Loja: public.customer_store_cashback
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

-- 5. Privilégios e GRANTs (PostgREST / Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_claims TO authenticated, anon;
GRANT ALL ON public.deal_claims TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_cashback_settings TO authenticated;
GRANT SELECT ON public.store_cashback_settings TO anon;
GRANT ALL ON public.store_cashback_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_store_cashback TO authenticated;
GRANT SELECT ON public.customer_store_cashback TO anon;
GRANT ALL ON public.customer_store_cashback TO service_role;

-- 6. Habilitação de RLS
ALTER TABLE public.deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cashback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_store_cashback ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Segurança (RLS)
-- deal_claims: anon e authenticated inserem resgates; leitura pública para checar limites
DROP POLICY IF EXISTS "Public insert deal claims" ON public.deal_claims;
CREATE POLICY "Public insert deal claims"
ON public.deal_claims FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public read deal claims" ON public.deal_claims;
CREATE POLICY "Public read deal claims"
ON public.deal_claims FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated update deal claims" ON public.deal_claims;
CREATE POLICY "Authenticated update deal claims"
ON public.deal_claims FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- store_cashback_settings: leitura pública; edição pelo dono da página
DROP POLICY IF EXISTS "Public read store cashback settings" ON public.store_cashback_settings;
CREATE POLICY "Public read store cashback settings"
ON public.store_cashback_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Store owners manage store cashback settings" ON public.store_cashback_settings;
CREATE POLICY "Store owners manage store cashback settings"
ON public.store_cashback_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- customer_store_cashback: leitura pública do próprio saldo; gestão pelo dono da loja
DROP POLICY IF EXISTS "Public read customer cashback" ON public.customer_store_cashback;
CREATE POLICY "Public read customer cashback"
ON public.customer_store_cashback FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Store owners manage customer cashback" ON public.customer_store_cashback;
CREATE POLICY "Store owners manage customer cashback"
ON public.customer_store_cashback FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- 8. Função PostgreSQL Atômica de Resgate com Travas de Limite
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
  -- 1. Limpa o telefone (apenas números)
  p_customer_whatsapp := regexp_replace(p_customer_whatsapp, '\D', '', 'g');

  IF p_customer_whatsapp IS NULL OR length(p_customer_whatsapp) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Número de WhatsApp inválido');
  END IF;
  
  -- 2. Busca e trava a oferta
  SELECT * INTO v_deal
  FROM public.daily_deals
  WHERE id = p_deal_id
    AND is_active = true
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta não encontrada ou inativa');
  END IF;

  -- 3. Verifica se a oferta tem limite e se já esgotou
  IF v_deal.max_claims IS NOT NULL AND v_deal.claims_count >= v_deal.max_claims THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta oferta já esgotou seus cupons de hoje');
  END IF;

  -- 4. Trava 1: O mesmo cliente já pegou ESSA mesma oferta hoje?
  SELECT EXISTS(
    SELECT 1 FROM public.deal_claims
    WHERE deal_id = p_deal_id
      AND customer_whatsapp = p_customer_whatsapp
      AND created_at >= date_trunc('day', now())
  ) INTO v_already_claimed_deal;

  IF v_already_claimed_deal THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este cupom hoje');
  END IF;

  -- 5. Trava 2 (Gênesis de Negócio): Máximo de 2 cupons por dia por cliente na rede toda
  SELECT count(*) INTO v_today_claims
  FROM public.deal_claims
  WHERE customer_whatsapp = p_customer_whatsapp
    AND created_at >= date_trunc('day', now());

  IF v_today_claims >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já atingiu seu limite de 2 cupons de hoje na rede. Volte amanhã!');
  END IF;

  -- 6. Gera código curto único (EIA-XXXX)
  v_claim_code := 'EIA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  -- 7. Insere o resgate
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

  -- 8. Incrementa contador na oferta
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
