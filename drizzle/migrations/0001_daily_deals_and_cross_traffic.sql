-- ============================================================
-- Mural do Dia (daily_deals) & Rede de Trafego Cruzado
-- ============================================================

CREATE TABLE public.daily_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  original_price numeric(10,2),
  deal_price numeric(10,2) NOT NULL,
  discount_badge text,
  image_url text,
  claim_action_url text,
  city text NOT NULL DEFAULT 'Teixeira de Freitas',
  niche text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  clicks_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_deals_active_city ON public.daily_deals (city, is_active, expires_at DESC);
CREATE INDEX idx_daily_deals_page ON public.daily_deals (bio_page_id);
CREATE INDEX idx_daily_deals_user ON public.daily_deals (user_id);

GRANT SELECT ON public.daily_deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_deals TO authenticated;
GRANT ALL ON public.daily_deals TO service_role;

ALTER TABLE public.daily_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ofertas ativas sao publicas"
ON public.daily_deals
FOR SELECT
TO anon, authenticated
USING (is_active = true AND expires_at > now());

CREATE POLICY "Dono le suas ofertas"
ON public.daily_deals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Dono cria suas ofertas"
ON public.daily_deals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = daily_deals.bio_page_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Dono atualiza suas ofertas"
ON public.daily_deals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono remove suas ofertas"
ON public.daily_deals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin gerencia todas as ofertas"
ON public.daily_deals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Parcerias de trafego cruzado
-- ============================================================

CREATE TABLE public.cross_traffic_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  partner_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  benefit_text text NOT NULL,
  badge_label text NOT NULL DEFAULT 'Cortesia de Parceiro da Rede',
  status text NOT NULL DEFAULT 'active',
  clicks_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cross_traffic_status_check CHECK (status IN ('active','paused','expired')),
  CONSTRAINT cross_traffic_distinct_pages CHECK (host_page_id <> partner_page_id),
  CONSTRAINT cross_traffic_unique_pair UNIQUE (host_page_id, partner_page_id)
);

CREATE INDEX idx_cross_traffic_host ON public.cross_traffic_partnerships (host_page_id, status);

GRANT SELECT ON public.cross_traffic_partnerships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cross_traffic_partnerships TO authenticated;
GRANT ALL ON public.cross_traffic_partnerships TO service_role;

ALTER TABLE public.cross_traffic_partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parcerias ativas sao publicas"
ON public.cross_traffic_partnerships
FOR SELECT
TO anon, authenticated
USING (status = 'active');

CREATE POLICY "Dono da pagina le suas parcerias"
ON public.cross_traffic_partnerships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = cross_traffic_partnerships.host_page_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Dono da pagina cria parcerias"
ON public.cross_traffic_partnerships
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = cross_traffic_partnerships.host_page_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Dono da pagina atualiza parcerias"
ON public.cross_traffic_partnerships
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = cross_traffic_partnerships.host_page_id AND bp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = cross_traffic_partnerships.host_page_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Dono da pagina remove parcerias"
ON public.cross_traffic_partnerships
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bio_pages bp
    WHERE bp.id = cross_traffic_partnerships.host_page_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Admin gerencia todas as parcerias"
ON public.cross_traffic_partnerships
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Contadores de cliques (seguros, sem expor dados)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_deal_click(_deal_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.daily_deals
  SET clicks_count = clicks_count + 1
  WHERE id = _deal_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_partnership_click(_partnership_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.cross_traffic_partnerships
  SET clicks_count = clicks_count + 1
  WHERE id = _partnership_id AND status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.increment_deal_click(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_partnership_click(uuid) TO anon, authenticated;
