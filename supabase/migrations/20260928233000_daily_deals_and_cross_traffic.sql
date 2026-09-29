-- 1. Tabela de Ofertas do Dia (Mural Público)
CREATE TABLE IF NOT EXISTS public.daily_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bio_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    original_price NUMERIC(10,2),
    deal_price NUMERIC(10,2) NOT NULL,
    discount_badge VARCHAR(50),
    image_url TEXT,
    claim_action_url TEXT,
    city VARCHAR(100) DEFAULT 'Teixeira de Freitas',
    niche VARCHAR(80),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    clicks_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Parcerias de Tráfego Cruzado
CREATE TABLE IF NOT EXISTS public.cross_traffic_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    partner_page_id UUID REFERENCES public.bio_pages(id) ON DELETE CASCADE NOT NULL,
    benefit_text VARCHAR(160) NOT NULL,
    badge_label VARCHAR(60) DEFAULT 'Parceiro da Rede',
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
    clicks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(host_page_id, partner_page_id)
);

-- 3. Concessão de Privilégios (GRANTs obrigatórios para PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_deals TO authenticated;
GRANT SELECT ON public.daily_deals TO anon;
GRANT ALL ON public.daily_deals TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cross_traffic_partnerships TO authenticated;
GRANT SELECT ON public.cross_traffic_partnerships TO anon;
GRANT ALL ON public.cross_traffic_partnerships TO service_role;

-- 4. Habilitação de RLS
ALTER TABLE public.daily_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_traffic_partnerships ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_deals' AND policyname = 'Public read active daily deals') THEN
    CREATE POLICY "Public read active daily deals"
    ON public.daily_deals FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE AND expires_at > NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_deals' AND policyname = 'Users manage own daily deals') THEN
    CREATE POLICY "Users manage own daily deals"
    ON public.daily_deals FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_deals' AND policyname = 'Admins have full access to daily deals') THEN
    CREATE POLICY "Admins have full access to daily deals"
    ON public.daily_deals FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_traffic_partnerships' AND policyname = 'Public read active partnerships') THEN
    CREATE POLICY "Public read active partnerships"
    ON public.cross_traffic_partnerships FOR SELECT
    TO anon, authenticated
    USING (status = 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_traffic_partnerships' AND policyname = 'Hosts manage own partnerships') THEN
    CREATE POLICY "Hosts manage own partnerships"
    ON public.cross_traffic_partnerships FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_pages
            WHERE id = cross_traffic_partnerships.host_page_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bio_pages
            WHERE id = cross_traffic_partnerships.host_page_id
            AND user_id = auth.uid()
        )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_traffic_partnerships' AND policyname = 'Admins have full access to partnerships') THEN
    CREATE POLICY "Admins have full access to partnerships"
    ON public.cross_traffic_partnerships FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
