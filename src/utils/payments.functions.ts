import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };
type PlanPriceUpdateResult = { priceId: string | null } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      priceId: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      if (!["pro_monthly", "pro_yearly", "pro_yearly_pix"].includes(data.priceId)) {
        throw new Error("Este plano não está disponível para assinatura.");
      }
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: typeof context.claims.email === "string" ? context.claims.email : undefined,
        userId: context.userId,
      });

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string"
            ? stripePrice.product
            : (stripePrice.product as { id: string }).id;
        const product = await stripe.products.retrieve(productId);
        productDescription = (product as { name?: string }).name;
      }

      // Pix only exists for one-off charges in BRL; subscriptions stay card-only.
      const isPix = data.priceId === "pro_yearly_pix";
      if (isPix && (isRecurring || stripePrice.currency !== "brl")) {
        throw new Error("O preço anual via Pix precisa ser uma cobrança avulsa em reais.");
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: `${new URL(getRequest().url).origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        redirect_on_completion: "if_required",
        ...(isPix && { payment_method_types: ["pix"] }),
        customer: customerId,
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        metadata: {
          userId: context.userId,
          managed_payments: "false",
          ...(!isRecurring && { priceLookupKey: data.priceId }),
        },
        ...(isRecurring && {
          subscription_data: { metadata: { userId: context.userId } },
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;

    const { data: sub, error: subError } = await supabase
      .from("payment_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) {
      return { error: "Nenhuma assinatura encontrada para esta conta." };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        return_url: `${new URL(getRequest().url).origin}/billing`,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Stripe prices cannot have their amount changed. An admin price update creates
 * a new price and transfers the stable lookup key used by checkout.
 */
export const updatePlanPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      planId: string;
      name: string;
      description: string | null;
      priceCents: number;
      active: boolean;
      limits: Record<string, unknown>;
      environment: StripeEnv;
    }) => {
      if (!/^[0-9a-f-]{36}$/i.test(data.planId)) throw new Error("Invalid planId");
      if (!Number.isInteger(data.priceCents) || data.priceCents < 0) {
        throw new Error("Invalid priceCents");
      }
      if (!data.name.trim() || data.name.length > 100) throw new Error("Invalid plan name");
      if (data.description && data.description.length > 500) throw new Error("Invalid description");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<PlanPriceUpdateResult> => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (!roles?.some((role) => role.role === "admin")) {
      return { error: "Apenas Super Admin pode alterar valores." };
    }

    const { data: plan, error: planError } = await context.supabase
      .from("plans")
      .select("id, slug, billing_interval, stripe_product_id")
      .eq("id", data.planId)
      .single();

    if (planError || !plan) return { error: "Plano não encontrado." };

    try {
      let stripeProductId = plan.stripe_product_id;
      let stripePriceId: string | null = null;

      if (data.priceCents > 0) {
        const stripe = createStripeClient(data.environment);
        const lookupKey = `${plan.slug}_${plan.billing_interval}`;
        if (stripeProductId) {
          await stripe.products.update(stripeProductId, {
            name: data.name.trim(),
            description: data.description ?? undefined,
            metadata: { planId: plan.id, planSlug: plan.slug },
          });
        } else {
          const existingPrices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            active: true,
            limit: 1,
          });
          const existingProduct = existingPrices.data[0]?.product;
          stripeProductId =
            typeof existingProduct === "string" ? existingProduct : existingProduct?.id;

          if (stripeProductId) {
            await stripe.products.update(stripeProductId, {
              name: data.name.trim(),
              description: data.description ?? undefined,
              metadata: { planId: plan.id, planSlug: plan.slug },
            });
          } else {
            const product = await stripe.products.create({
              name: data.name.trim(),
              description: data.description ?? undefined,
              metadata: { planId: plan.id, planSlug: plan.slug },
            });
            stripeProductId = product.id;
          }
        }

        const price = await stripe.prices.create({
          product: stripeProductId,
          currency: "brl",
          unit_amount: data.priceCents,
          lookup_key: lookupKey,
          transfer_lookup_key: true,
          ...(plan.billing_interval !== "one_time" && {
            recurring: { interval: plan.billing_interval === "yearly" ? "year" : "month" },
          }),
          metadata: { planId: plan.id, planSlug: plan.slug },
        });
        stripePriceId = price.id;
      }

      const { error: updateError } = await context.supabase
        .from("plans")
        .update({
          name: data.name.trim(),
          description: data.description,
          price_cents: data.priceCents,
          active: data.active,
          limits: data.limits as Json,
          stripe_product_id: stripeProductId,
        })
        .eq("id", plan.id);

      if (updateError) throw updateError;
      return { priceId: stripePriceId };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
