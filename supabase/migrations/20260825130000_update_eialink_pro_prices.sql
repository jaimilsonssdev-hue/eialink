UPDATE public.plans
SET price_cents = 2900,
    updated_at = now()
WHERE slug = 'pro-monthly';

UPDATE public.plans
SET price_cents = 29000,
    updated_at = now()
WHERE slug = 'pro-yearly';
