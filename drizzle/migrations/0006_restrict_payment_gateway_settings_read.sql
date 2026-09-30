-- Remove a leitura pública que expunha a chave de API do gateway de pagamento
DROP POLICY IF EXISTS "Allow public read payment settings" ON public.payment_gateway_settings;

-- Leitura permitida apenas para administradores (o app usa service_role no servidor)
CREATE POLICY "Admins can read payment settings"
ON public.payment_gateway_settings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (auth.jwt() ->> 'email') = 'jaimilsonvendas@gmail.com'
);

REVOKE SELECT ON public.payment_gateway_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateway_settings TO authenticated;
GRANT ALL ON public.payment_gateway_settings TO service_role;