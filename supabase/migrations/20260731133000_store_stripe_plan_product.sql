-- Stores the non-secret Stripe product reference for each EIA Link plan.
-- The product is used by the admin-only server function when a new price is created.

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
