-- Funções para Tornar Oficial, Transferir e Reivindicar Páginas (Security Definer para bypass seguro de RLS)

-- 1. Função para transferir página para um cliente existente através do e-mail
CREATE OR REPLACE FUNCTION public.transfer_bio_page(
  _page_id UUID,
  _target_email TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user RECORD;
  _current_page RECORD;
BEGIN
  -- 1. Verifica permissão: o chamador precisa ser o dono atual da página ou admin
  SELECT * INTO _current_page FROM public.bio_pages
  WHERE id = _page_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

  IF _current_page.id IS NULL THEN
    RAISE EXCEPTION 'Página não encontrada ou sem autorização para transferir.';
  END IF;

  -- 2. Localiza o perfil do cliente pelo e-mail
  SELECT id, full_name, email INTO _target_user FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(_target_email))
  LIMIT 1;

  IF _target_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Nenhum usuário cadastrado com este e-mail no EIA Link.'
    );
  END IF;

  -- 3. Transfere a titularidade e remove status de demo
  UPDATE public.bio_pages
  SET user_id = _target_user.id,
      social_links = (
        COALESCE(social_links, '{}'::jsonb) - 'is_demo' - 'claim_token' - 'claim_email'
      ) || jsonb_build_object(
        'is_demo', false,
        'transferred_at', now()::text,
        'transferred_from', auth.uid()::text
      ),
      updated_at = now()
  WHERE id = _page_id;

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', _target_user.id,
    'target_name', _target_user.full_name,
    'target_email', _target_user.email
  );
END;
$$;

-- 2. Função para resgatar página com token de reivindicação
CREATE OR REPLACE FUNCTION public.claim_bio_page(
  _claim_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_page RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário precisa estar autenticado para resgatar a página.';
  END IF;

  SELECT * INTO _target_page FROM public.bio_pages
  WHERE social_links->>'claim_token' = _claim_token
  LIMIT 1;

  IF _target_page.id IS NULL THEN
    RAISE EXCEPTION 'Link de resgate inválido ou página já reivindicada.';
  END IF;

  -- Transfere a página para o usuário logado
  UPDATE public.bio_pages
  SET user_id = auth.uid(),
      social_links = (
        COALESCE(social_links, '{}'::jsonb) - 'is_demo' - 'claim_token' - 'claim_email'
      ) || jsonb_build_object(
        'is_demo', false,
        'claimed_at', now()::text,
        'claimed_by', auth.uid()::text
      ),
      updated_at = now()
  WHERE id = _target_page.id;

  RETURN jsonb_build_object(
    'success', true,
    'page_id', _target_page.id,
    'slug', _target_page.slug,
    'display_name', _target_page.display_name
  );
END;
$$;

-- 3. Função para obter informações públicas e seguras de prévia do resgate
CREATE OR REPLACE FUNCTION public.get_claim_page_info(
  _claim_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_page RECORD;
BEGIN
  SELECT id, display_name, slug, theme, cover_url, avatar_url, description, social_links
  INTO _target_page FROM public.bio_pages
  WHERE social_links->>'claim_token' = _claim_token
  LIMIT 1;

  IF _target_page.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', _target_page.id,
    'display_name', _target_page.display_name,
    'slug', _target_page.slug,
    'theme', _target_page.theme,
    'cover_url', _target_page.cover_url,
    'avatar_url', _target_page.avatar_url,
    'description', _target_page.description,
    'claim_email', _target_page.social_links->>'claim_email'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_bio_page(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_bio_page(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_claim_page_info(TEXT) TO anon, authenticated;

