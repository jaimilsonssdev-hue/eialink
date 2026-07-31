-- The public landing page may show only active plan names, descriptions,
-- prices and limits. Plan management remains restricted to administrators.

GRANT SELECT ON public.plans TO anon;

DROP POLICY IF EXISTS "public read active plans" ON public.plans;
CREATE POLICY "public read active plans" ON public.plans
  FOR SELECT
  TO anon
  USING (active = true);
