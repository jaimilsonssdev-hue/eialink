-- Eialink Pro: agenda essencial para um profissional.
CREATE TABLE IF NOT EXISTS public.booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL UNIQUE REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'America/Bahia',
  min_notice_hours integer NOT NULL DEFAULT 2 CHECK (min_notice_hours BETWEEN 0 AND 168),
  max_days_ahead integer NOT NULL DEFAULT 60 CHECK (max_days_ahead BETWEEN 1 AND 365),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description text,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 480),
  price numeric(10,2) CHECK (price IS NULL OR price >= 0),
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bio_page_id, weekday),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE RESTRICT,
  client_name text NOT NULL CHECK (char_length(client_name) BETWEEN 2 AND 100),
  client_phone text NOT NULL CHECK (char_length(client_phone) BETWEEN 8 AND 24),
  client_email text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  notes text,
  confirmation_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS booking_services_page_idx ON public.booking_services(bio_page_id, position);
CREATE INDEX IF NOT EXISTS appointments_page_start_idx ON public.appointments(bio_page_id, start_at);

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_bio_page(_page_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.bio_pages WHERE id = _page_id AND user_id = auth.uid());
$$;

DROP POLICY IF EXISTS "Owners manage booking settings" ON public.booking_settings;
CREATE POLICY "Owners manage booking settings" ON public.booking_settings FOR ALL
  USING (public.owns_bio_page(bio_page_id)) WITH CHECK (public.owns_bio_page(bio_page_id));
DROP POLICY IF EXISTS "Public reads active booking settings" ON public.booking_settings;
CREATE POLICY "Public reads active booking settings" ON public.booking_settings FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owners manage booking services" ON public.booking_services;
CREATE POLICY "Owners manage booking services" ON public.booking_services FOR ALL
  USING (public.owns_bio_page(bio_page_id)) WITH CHECK (public.owns_bio_page(bio_page_id));
DROP POLICY IF EXISTS "Public reads active booking services" ON public.booking_services;
CREATE POLICY "Public reads active booking services" ON public.booking_services FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owners manage booking availability" ON public.booking_availability;
CREATE POLICY "Owners manage booking availability" ON public.booking_availability FOR ALL
  USING (public.owns_bio_page(bio_page_id)) WITH CHECK (public.owns_bio_page(bio_page_id));
DROP POLICY IF EXISTS "Public reads active booking availability" ON public.booking_availability;
CREATE POLICY "Public reads active booking availability" ON public.booking_availability FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owners manage appointments" ON public.appointments;
CREATE POLICY "Owners manage appointments" ON public.appointments FOR ALL
  USING (public.owns_bio_page(bio_page_id)) WITH CHECK (public.owns_bio_page(bio_page_id));

-- Returns open slots without exposing client data from existing appointments.
CREATE OR REPLACE FUNCTION public.get_booking_slots(
  _bio_page_id uuid,
  _service_id uuid,
  _date date
) RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      WHERE a.bio_page_id = _bio_page_id AND a.status = 'confirmed'
        AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(
          candidate AT TIME ZONE cfg.timezone,
          (candidate + make_interval(mins => svc.duration_minutes)) AT TIME ZONE cfg.timezone,
          '[)'
        )
    )
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_public_appointment(
  _bio_page_id uuid,
  _service_id uuid,
  _start_at timestamptz,
  _client_name text,
  _client_phone text,
  _client_email text DEFAULT NULL,
  _notes text DEFAULT NULL
) RETURNS TABLE(appointment_id uuid, confirmation_token uuid, end_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  svc public.booking_services%ROWTYPE;
  expected_end timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(_bio_page_id::text || _start_at::text));
  IF NOT EXISTS (SELECT 1 FROM public.booking_settings WHERE bio_page_id = _bio_page_id AND active) THEN
    RAISE EXCEPTION 'Agenda indisponível.';
  END IF;
  SELECT * INTO svc FROM public.booking_services WHERE id = _service_id AND bio_page_id = _bio_page_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível.'; END IF;
  expected_end := _start_at + make_interval(mins => svc.duration_minutes);
  IF NOT EXISTS (
    SELECT 1 FROM public.get_booking_slots(_bio_page_id, _service_id, (_start_at AT TIME ZONE 'America/Bahia')::date)
    WHERE slot_start = _start_at
  ) THEN RAISE EXCEPTION 'Este horário não está mais disponível.'; END IF;
  RETURN QUERY
  INSERT INTO public.appointments (bio_page_id, service_id, client_name, client_phone, client_email, start_at, end_at, notes)
  VALUES (_bio_page_id, _service_id, trim(_client_name), trim(_client_phone), nullif(trim(_client_email), ''), _start_at, expected_end, nullif(trim(_notes), ''))
  RETURNING id, appointments.confirmation_token, appointments.end_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_slots(uuid, uuid, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid, uuid, timestamptz, text, text, text, text) TO anon, authenticated;

-- Agenda Essencial é um recurso do Pro.
UPDATE public.plans
SET features = jsonb_set(features, '{booking}', 'true'::jsonb, true)
WHERE slug IN ('pro', 'pro-monthly', 'pro-yearly');

UPDATE public.plans
SET features = jsonb_set(features, '{booking}', 'false'::jsonb, true)
WHERE slug IN ('essential', 'free');
