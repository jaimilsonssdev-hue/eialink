REVOKE INSERT ON TABLE public.analytics_events FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert event" ON public.analytics_events;

DROP POLICY IF EXISTS "public reads published bio media" ON storage.objects;