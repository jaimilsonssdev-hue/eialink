-- Função segura para o limite diário público (não expõe dados de outros clientes)
CREATE OR REPLACE FUNCTION public.count_customer_daily_claims(p_whatsapp text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(*), 0)::integer
  FROM public.deal_claims
  WHERE customer_whatsapp = regexp_replace(COALESCE(p_whatsapp, ''), '\D', '', 'g')
    AND regexp_replace(COALESCE(p_whatsapp, ''), '\D', '', 'g') <> ''
    AND created_at >= date_trunc('day', now());
$$;

GRANT EXECUTE ON FUNCTION public.count_customer_daily_claims(text) TO anon, authenticated;

-- deal_claims: remove acesso irrestrito
DROP POLICY IF EXISTS "Public read deal claims" ON public.deal_claims;
DROP POLICY IF EXISTS "Public insert deal claims" ON public.deal_claims;
DROP POLICY IF EXISTS "Authenticated update deal claims" ON public.deal_claims;

CREATE POLICY "Store owners read deal claims"
ON public.deal_claims FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = deal_claims.business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Store owners update deal claims"
ON public.deal_claims FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = deal_claims.business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_pages b
    WHERE b.id = deal_claims.business_page_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

REVOKE INSERT ON public.deal_claims FROM anon;

-- customer_store_cashback: apenas o dono da loja enxerga os saldos
DROP POLICY IF EXISTS "Public read customer cashback" ON public.customer_store_cashback;
REVOKE SELECT ON public.customer_store_cashback FROM anon;