-- ==============================================================================
-- EIA LINK: HARDENING DE SEGURANÇA E POLÍTICAS RLS (FASE 3)
-- ==============================================================================
-- Esta migração é 100% IDEMPOTENTE e NÃO-DESTRUTIVA:
-- 1. NÃO apaga nem altera colunas ou tabelas de clientes existentes.
-- 2. Mantém o acesso público (anon) a páginas publicadas, cardápio e agendamentos.
-- 3. Garante que cada cliente acesse exclusivamente seus próprios registros.
-- 4. Permite que administradores gerenciem com segurança o sistema.
-- ==============================================================================

-- 1. USER_ROLES: Proteção estrita contra elevação de privilégios
-- Garante que RLS esteja ativo
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Usuários leem seu próprio papel; administradores podem inspecionar papéis
DROP POLICY IF EXISTS "users see their own roles" ON public.user_roles;
CREATE POLICY "users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Apenas administradores podem inserir, alterar ou remover papéis via client
DROP POLICY IF EXISTS "admins manage user roles" ON public.user_roles;
CREATE POLICY "admins manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 2. PROFILES: Blindagem de dados cadastrais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário ou admin podem atualizar perfil
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));


-- 3. BIO_PAGES: Proteção da titularidade das páginas
ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;

-- Leitura pública para visitantes (ESSENCIAL para não quebrar links públicos /p/$slug)
DROP POLICY IF EXISTS "public read published bio" ON public.bio_pages;
CREATE POLICY "public read published bio" ON public.bio_pages
  FOR SELECT TO anon
  USING (published = true);

-- Leitura autenticada (própria, publicada ou admin)
DROP POLICY IF EXISTS "auth read own or published" ON public.bio_pages;
CREATE POLICY "auth read own or published" ON public.bio_pages
  FOR SELECT TO authenticated
  USING (published = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Edição apenas pelo dono ou admin
DROP POLICY IF EXISTS "own bio update" ON public.bio_pages;
CREATE POLICY "own bio update" ON public.bio_pages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Exclusão apenas pelo dono ou admin
DROP POLICY IF EXISTS "own bio delete" ON public.bio_pages;
CREATE POLICY "own bio delete" ON public.bio_pages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));


-- 4. BIO_LINKS: Links da Bio (Leitura pública preservada)
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active links of published bio" ON public.bio_links;
CREATE POLICY "public read active links of published bio" ON public.bio_links
  FOR SELECT TO anon
  USING (
    active = true AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = bio_links.bio_page_id AND b.published = true
    )
  );

DROP POLICY IF EXISTS "own links update" ON public.bio_links;
CREATE POLICY "own links update" ON public.bio_links
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = bio_links.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = bio_links.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "own links delete" ON public.bio_links;
CREATE POLICY "own links delete" ON public.bio_links
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = bio_links.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );


-- 5. CATALOG_ITEMS: Produtos e Serviços do Catálogo
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Leitura pública para visitantes de páginas publicadas
DROP POLICY IF EXISTS "public reads active catalog items" ON public.catalog_items;
CREATE POLICY "public reads active catalog items" ON public.catalog_items
  FOR SELECT TO anon
  USING (
    active = true AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = catalog_items.bio_page_id AND b.published = true
    )
  );

-- Gestão pelo dono ou admin
DROP POLICY IF EXISTS "owner manages catalog items" ON public.catalog_items;
CREATE POLICY "owner manages catalog items" ON public.catalog_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = catalog_items.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = catalog_items.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );


-- 6. PAGE_BLOCKS: Blocos modulares do construtor
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads enabled blocks" ON public.page_blocks;
CREATE POLICY "public reads enabled blocks" ON public.page_blocks
  FOR SELECT TO anon
  USING (
    enabled = true AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = page_blocks.bio_page_id AND b.published = true
    )
  );

DROP POLICY IF EXISTS "owners update blocks" ON public.page_blocks;
CREATE POLICY "owners update blocks" ON public.page_blocks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = page_blocks.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = page_blocks.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "owners delete blocks" ON public.page_blocks;
CREATE POLICY "owners delete blocks" ON public.page_blocks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = page_blocks.bio_page_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );


-- 7. SERVICE_REQUESTS: Pedidos e Chamados (Comanda Digital e Serviços)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own requests select" ON public.service_requests;
CREATE POLICY "own requests select" ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (bio_page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = service_requests.bio_page_id AND b.user_id = auth.uid()
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "own requests insert" ON public.service_requests;
CREATE POLICY "own requests insert" ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (bio_page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = service_requests.bio_page_id AND b.user_id = auth.uid()
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "owners and admins update requests" ON public.service_requests;
DROP POLICY IF EXISTS "admin updates requests" ON public.service_requests;
CREATE POLICY "owners and admins update requests" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (bio_page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = service_requests.bio_page_id AND b.user_id = auth.uid()
    ))
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (bio_page_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bio_pages b
      WHERE b.id = service_requests.bio_page_id AND b.user_id = auth.uid()
    ))
    OR public.has_role(auth.uid(), 'admin')
  );


-- 8. BOOKING & AGENDAMENTOS (Confirmação de isolamento)
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Garante que agendamentos de clientes reais fiquem restritos ao proprietário e administradores
DROP POLICY IF EXISTS "Owners manage appointments" ON public.appointments;
CREATE POLICY "Owners manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    public.owns_bio_page(bio_page_id) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.owns_bio_page(bio_page_id) OR public.has_role(auth.uid(), 'admin')
  );


-- 9. NOTIFICAÇÃO DE RECARGA DE SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';

