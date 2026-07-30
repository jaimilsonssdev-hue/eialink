-- Bootstrap the account owner as the initial EIA Link Super Admin.
-- The role remains protected by RLS and can be changed later only through
-- an administrator-controlled database operation.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE lower(email) = 'jaimilsonvendas@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
