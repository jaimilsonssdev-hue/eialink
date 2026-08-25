import { createServerFn } from "@tanstack/react-start";
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
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      userId?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, {
              email: data.customerEmail,
              userId: data.userId,
            })
          : undefined;

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
      const supportsPix = !isRecurring && stripePrice.currency === "brl";

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        ...(supportsPix && { payment_method_types: ["card", "pix"] }),
        ...(customerId && { customer: customerId }),
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        ...(data.userId && {
          metadata: {
            userId: data.userId,
            managed_payments: "false",
            ...(!isRecurring && { priceLookupKey: data.priceId }),
          },
          ...(isRecurring && { subscription_data: { metadata: { userId: data.userId } } }),
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
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
        ...(data.returnUrl && { return_url: data.returnUrl }),
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
