ALTER TABLE public.payment_gateway_settings
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

REVOKE ALL ON public.payment_gateway_settings FROM anon;
REVOKE SELECT ON public.payment_gateway_settings FROM authenticated;
GRANT ALL ON public.payment_gateway_settings TO service_role;
