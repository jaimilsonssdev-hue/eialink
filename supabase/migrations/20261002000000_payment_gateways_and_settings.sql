-- ==============================================================================
-- MIGRAÇÃO: CONFIGURAÇÕES DE PAGAMENTO (ASAAS & PIX DIRETO) (EIA LINK)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payment_gateway_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    asaas_api_key TEXT NULL,
    asaas_environment TEXT NOT NULL DEFAULT 'sandbox',
    asaas_webhook_token TEXT NULL,
    pix_key TEXT NULL,
    pix_key_type TEXT NULL DEFAULT 'email',
    pix_receiver_name TEXT NULL DEFAULT 'EIA Digital Plataforma',
    whatsapp_support TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante a coluna se a tabela já existia anteriormente
ALTER TABLE public.payment_gateway_settings ADD COLUMN IF NOT EXISTS asaas_webhook_token TEXT NULL;

-- Permissões essenciais
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateway_settings TO authenticated;
GRANT ALL ON public.payment_gateway_settings TO service_role;
GRANT SELECT ON public.payment_gateway_settings TO anon;

-- Habilita RLS
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Leitura pública para checkout identificar se o Asaas e Pix Direto estão ativos
DROP POLICY IF EXISTS "Allow public read payment settings" ON public.payment_gateway_settings;
CREATE POLICY "Allow public read payment settings"
ON public.payment_gateway_settings FOR SELECT
USING (true);

-- Modificação restrita a Super Admin
DROP POLICY IF EXISTS "Allow admin modify payment settings" ON public.payment_gateway_settings;
CREATE POLICY "Allow admin modify payment settings"
ON public.payment_gateway_settings FOR ALL
USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.jwt()->>'email' = 'jaimilsonvendas@gmail.com'
);

-- Registro padrão inicial
INSERT INTO public.payment_gateway_settings (id, asaas_environment, pix_key, pix_key_type, pix_receiver_name)
VALUES ('default', 'sandbox', 'jaimilsonvendas@gmail.com', 'email', 'EIA Digital Plataforma')
ON CONFLICT (id) DO NOTHING;
