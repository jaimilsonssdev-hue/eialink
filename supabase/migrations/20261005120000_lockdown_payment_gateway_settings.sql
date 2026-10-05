-- ==============================================================================
-- MIGRAÇÃO DE SEGURANÇA E HARDENING: LOCKDOWN DE CHAVES DE PAGAMENTO E RLS
-- ==============================================================================
-- 1. BLINDAGEM TOTAL DA TABELA payment_gateway_settings
-- Impede que chaves secretas (asaas_api_key, asaas_webhook_token) sejam lidas
-- por requisições anônimas ou clientes não-administradores via PostgREST.
-- ==============================================================================

-- Remove permissões públicas de leitura direta
REVOKE ALL ON public.payment_gateway_settings FROM anon;
REVOKE SELECT ON public.payment_gateway_settings FROM authenticated;

-- Garante que service_role tenha acesso total (usado pelas server functions)
GRANT ALL ON public.payment_gateway_settings TO service_role;

-- Garante RLS ativo
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Remove a política antiga que permitia leitura pública
DROP POLICY IF EXISTS "Allow public read payment settings" ON public.payment_gateway_settings;
DROP POLICY IF EXISTS "Allow admin modify payment settings" ON public.payment_gateway_settings;
DROP POLICY IF EXISTS "Only admin manage payment settings" ON public.payment_gateway_settings;

-- Nova política: Apenas Super Admin pode ler ou modificar a tabela diretamente via client autenticado
CREATE POLICY "Only admin manage payment settings"
ON public.payment_gateway_settings FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.jwt()->>'email' = 'jaimilsonvendas@gmail.com'
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    auth.jwt()->>'email' = 'jaimilsonvendas@gmail.com'
);

-- ==============================================================================
-- 2. HARDENING NA TABELA deal_claims (CUPONS E RESGATES)
-- Impede que usuários autenticados comuns atualizem ou manipulem resgates alheios.
-- ==============================================================================
DROP POLICY IF EXISTS "Authenticated update deal claims" ON public.deal_claims;
CREATE POLICY "Store owners and admins update deal claims"
ON public.deal_claims FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.daily_deals d
    JOIN public.bio_pages b ON b.id = d.bio_page_id
    WHERE d.id = deal_claims.deal_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR auth.jwt()->>'email' = 'jaimilsonvendas@gmail.com')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_deals d
    JOIN public.bio_pages b ON b.id = d.bio_page_id
    WHERE d.id = deal_claims.deal_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR auth.jwt()->>'email' = 'jaimilsonvendas@gmail.com')
  )
);
