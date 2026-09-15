DROP POLICY IF EXISTS "Public reads active booking availability" ON public.booking_availability;
CREATE POLICY "Public reads active booking availability"
ON public.booking_availability
FOR SELECT
TO anon, authenticated
USING (
  active = true
  AND EXISTS (
    SELECT 1
    FROM public.bio_pages AS b
    WHERE b.id = booking_availability.bio_page_id
      AND b.published = true
  )
);

DROP POLICY IF EXISTS "Public reads active booking services" ON public.booking_services;
CREATE POLICY "Public reads active booking services"
ON public.booking_services
FOR SELECT
TO anon, authenticated
USING (
  active = true
  AND EXISTS (
    SELECT 1
    FROM public.bio_pages AS b
    WHERE b.id = booking_services.bio_page_id
      AND b.published = true
  )
);

DROP POLICY IF EXISTS "Public reads active booking settings" ON public.booking_settings;
CREATE POLICY "Public reads active booking settings"
ON public.booking_settings
FOR SELECT
TO anon, authenticated
USING (
  active = true
  AND EXISTS (
    SELECT 1
    FROM public.bio_pages AS b
    WHERE b.id = booking_settings.bio_page_id
      AND b.published = true
  )
);