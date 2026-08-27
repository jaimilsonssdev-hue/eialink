CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Remove duplicate active appointments (keep earliest created) before adding the constraint
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY bio_page_id, start_at, end_at ORDER BY created_at
  ) rn
  FROM public.appointments
  WHERE status NOT IN ('cancelled','canceled','no_show')
)
UPDATE public.appointments a
SET status = 'cancelled', updated_at = now()
FROM ranked r
WHERE a.id = r.id AND r.rn > 1;

-- 2) Prevent overlapping active appointments per page
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_overlap;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    bio_page_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled','canceled','no_show'));

-- 3) Slots must consider every active appointment, not only 'confirmed'
CREATE OR REPLACE FUNCTION public.get_booking_slots(_bio_page_id uuid, _service_id uuid, _date date)
 RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cfg public.booking_settings%ROWTYPE;
  svc public.booking_services%ROWTYPE;
  av public.booking_availability%ROWTYPE;
  local_start timestamp;
  local_end timestamp;
BEGIN
  SELECT * INTO cfg FROM public.booking_settings WHERE bio_page_id = _bio_page_id AND active;
  IF NOT FOUND OR _date < current_date OR _date > current_date + cfg.max_days_ahead THEN RETURN; END IF;
  SELECT * INTO svc FROM public.booking_services WHERE id = _service_id AND bio_page_id = _bio_page_id AND active;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO av FROM public.booking_availability
    WHERE bio_page_id = _bio_page_id AND weekday = extract(dow FROM _date)::smallint AND active;
  IF NOT FOUND THEN RETURN; END IF;
  local_start := _date + av.start_time;
  local_end := _date + av.end_time;
  RETURN QUERY
  SELECT candidate AT TIME ZONE cfg.timezone,
         (candidate + make_interval(mins => svc.duration_minutes)) AT TIME ZONE cfg.timezone
  FROM generate_series(local_start, local_end - make_interval(mins => svc.duration_minutes), interval '30 minutes') candidate
  WHERE candidate AT TIME ZONE cfg.timezone >= now() + make_interval(hours => cfg.min_notice_hours)
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.bio_page_id = _bio_page_id
        AND a.status NOT IN ('cancelled','canceled','no_show')
        AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(
          candidate AT TIME ZONE cfg.timezone,
          (candidate + make_interval(mins => svc.duration_minutes)) AT TIME ZONE cfg.timezone,
          '[)'
        )
    )
  ORDER BY 1;
END;
$function$;

-- 4) Friendly error when the slot was just taken
CREATE OR REPLACE FUNCTION public.create_public_appointment(_bio_page_id uuid, _service_id uuid, _start_at timestamp with time zone, _client_name text, _client_phone text, _client_email text DEFAULT NULL::text, _notes text DEFAULT NULL::text)
 RETURNS TABLE(appointment_id uuid, confirmation_token uuid, end_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  svc public.booking_services%ROWTYPE;
  expected_end timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(_bio_page_id::text));
  IF NOT EXISTS (SELECT 1 FROM public.booking_settings WHERE bio_page_id = _bio_page_id AND active) THEN
    RAISE EXCEPTION 'Agenda indisponível.';
  END IF;
  SELECT * INTO svc FROM public.booking_services WHERE id = _service_id AND bio_page_id = _bio_page_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível.'; END IF;
  expected_end := _start_at + make_interval(mins => svc.duration_minutes);
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.bio_page_id = _bio_page_id
      AND a.status NOT IN ('cancelled','canceled','no_show')
      AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(_start_at, expected_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro horário.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.get_booking_slots(_bio_page_id, _service_id, (_start_at AT TIME ZONE 'America/Bahia')::date)
    WHERE slot_start = _start_at
  ) THEN RAISE EXCEPTION 'Este horário não está mais disponível.'; END IF;
  RETURN QUERY
  INSERT INTO public.appointments (bio_page_id, service_id, client_name, client_phone, client_email, start_at, end_at, notes)
  VALUES (_bio_page_id, _service_id, trim(_client_name), trim(_client_phone), nullif(trim(_client_email), ''), _start_at, expected_end, nullif(trim(_notes), ''))
  RETURNING id, appointments.confirmation_token, appointments.end_at;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro horário.';
END;
$function$;

-- 5) Internal trigger-only functions must not be callable through the API
REVOKE EXECUTE ON FUNCTION public.assign_free_subscription() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_bio_page_plan_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_catalog_plan_access() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;