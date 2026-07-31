import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CreditCard, ExternalLink, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/utils/payments.functions";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Planos e pagamento — EIA LINK" },
      {
        name: "description",
        content:
          "Escolha o plano ideal para o seu Biolink e ative recursos avançados de catálogo, resultados e crescimento.",
      },
      { property: "og:title", content: "Planos e pagamento — EIA LINK" },
      {
        property: "og:description",
        content: "Assine um plano do EIA LINK e desbloqueie catálogo, resultados e crescimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const PAID_PLANS = [
  {
    slug: "pro",
    priceId: "pro_monthly",
    name: "Pro",
    price: "R$ 29",
    description: "Para negócios que precisam vender e crescer.",
    features: ["Até 3 Biolinks", "30 links por página", "100 itens de catálogo", "Todos os templates"],
    highlight: true,
  },
  {
    slug: "catalog",
    priceId: "catalog_monthly",
    name: "Catálogo",
    price: "R$ 49",
    description: "Plano focado em uma vitrine digital completa.",
    features: ["Até 5 Biolinks", "50 links por página", "250 itens de catálogo", "Todos os templates"],
    highlight: false,
  },
] as const;

function BillingPage() {
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: account } = useQuery({
    queryKey: ["billing-account"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const { data: subscription } = await supabase
        .from("payment_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { userId: user.id, email: user.email ?? undefined, subscription };
    },
  });

  const activePriceId = account?.subscription?.price_id ?? null;

  async function openPortal() {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const result = await createPortalSession({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : "Não foi possível abrir a gestão da assinatura.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Assinatura
        </p>
        <h1 className="mt-1 text-3xl font-bold">Planos e pagamento</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha o plano ideal e libere mais Biolinks, catálogo e recursos de crescimento.
        </p>
      </header>

      {account?.subscription && (
        <section className="card-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[color:var(--primary)]" />
            <div>
              <p className="font-semibold">
                Assinatura {account.subscription.status === "active" ? "ativa" : account.subscription.status}
              </p>
              <p className="text-sm text-muted-foreground">
                {account.subscription.current_period_end
                  ? `Renova em ${new Date(account.subscription.current_period_end).toLocaleDateString("pt-BR")}`
                  : "Plano atual do seu negócio"}
              </p>
            </div>
          </div>
          <button className="btn-secondary" onClick={openPortal} disabled={portalLoading}>
            {portalLoading ? "Abrindo…" : "Gerenciar assinatura"} <ExternalLink className="h-4 w-4" />
          </button>
        </section>
      )}
      {portalError && <p className="text-sm text-red-400">{portalError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {PAID_PLANS.map((plan) => {
          const current = activePriceId === plan.priceId;
          return (
            <article
              key={plan.slug}
              className={`card-surface flex flex-col ${plan.highlight ? "ring-1 ring-[color:var(--primary)]/40" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
                    <Sparkles className="h-3 w-3" /> Mais escolhido
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-medium text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--success)]" /> {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${plan.highlight ? "btn-primary" : "btn-secondary"} mt-6 w-full`}
                disabled={current}
                onClick={() =>
                  openCheckout({
                    priceId: plan.priceId,
                    quantity: 1,
                    customerEmail: account?.email,
                    userId: account?.userId,
                    returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
                  })
                }
              >
                {current ? "Plano atual" : `Assinar ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>

      {isOpen && (
        <section className="card-surface">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Finalizar assinatura</h2>
            <button className="btn-secondary" onClick={closeCheckout}>
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
          {checkoutElement}
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        Precisa de um plano sob medida?{" "}
        <Link to="/growth" className="underline">
          Fale com o time de crescimento
        </Link>
        .
      </p>
    </div>
  );
}
