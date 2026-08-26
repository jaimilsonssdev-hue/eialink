-- Keep the public page renderer aligned with the authenticated builder preview.
--
-- The old function used remove_branding as a proxy for Pro access. That is
-- only one feature flag and can legitimately be false on a Pro/demo plan,
-- causing the public route to fall back to FreeLinkRenderer while the builder
-- correctly renders the full TemplateRenderer.
CREATE OR REPLACE FUNCTION public.page_has_pro_plan(_bio_page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bio_pages b
    JOIN public.subscriptions s ON s.user_id = b.user_id
    JOIN public.plans p ON p.id = s.plan_id
    WHERE b.id = _bio_page_id
      AND s.status IN ('active', 'trialing')
      AND (
        p.slug IN ('pro', 'pro-monthly', 'pro-yearly')
        OR COALESCE((p.features->>'premium_templates')::boolean, false)
        OR COALESCE((p.features->>'advanced_appearance')::boolean, false)
      )
  );
$$;

COMMENT ON FUNCTION public.page_has_pro_plan(uuid) IS
  'Returns whether a published page belongs to an active Pro-capable plan. Used to select the same full renderer shown in the builder preview.';

GRANT EXECUTE ON FUNCTION public.page_has_pro_plan(uuid) TO anon, authenticated;
