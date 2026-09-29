-- Adiciona controle de limite e contagem de resgates em daily_deals
ALTER TABLE public.daily_deals 
ADD COLUMN IF NOT EXISTS max_claims integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS claims_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Função atômica e segura para resgatar cupom sem risco de ultrapassar o limite
CREATE OR REPLACE FUNCTION public.claim_daily_deal(p_deal_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal record;
BEGIN
  SELECT id, is_active, expires_at, max_claims, claims_count
  INTO v_deal
  FROM public.daily_deals
  WHERE id = p_deal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Oferta não encontrada');
  END IF;

  IF NOT v_deal.is_active OR v_deal.expires_at <= now() THEN
    RETURN json_build_object('success', false, 'error', 'Oferta expirada ou inativa');
  END IF;

  IF v_deal.max_claims IS NOT NULL AND v_deal.claims_count >= v_deal.max_claims THEN
    RETURN json_build_object('success', false, 'error', 'Cupons esgotados para hoje');
  END IF;

  UPDATE public.daily_deals
  SET claims_count = claims_count + 1,
      clicks_count = clicks_count + 1,
      updated_at = now()
  WHERE id = p_deal_id;

  RETURN json_build_object(
    'success', true, 
    'claims_count', v_deal.claims_count + 1,
    'remaining', CASE WHEN v_deal.max_claims IS NOT NULL THEN v_deal.max_claims - (v_deal.claims_count + 1) ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_deal(uuid) TO anon, authenticated, service_role;
