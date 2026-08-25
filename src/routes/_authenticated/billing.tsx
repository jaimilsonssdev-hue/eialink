import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { BillingService } from "@/modules/billing/services/BillingService";
import { formatPlanPrice } from "@/modules/billing/types";
import { commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Eialink" },
      { name: "description", content: "Compare o Eialink Essencial e o Eialink Pro." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const FALLBACK_FEATURES = {
  essential: [
    "1 página publicada",
    "Até 4 links",
    "WhatsApp",
    "Template Essencial",
    "Marca Eialink visível",
  ],
  pro: [
    "Páginas e links sem limite",
    "Todos os templates",
    "Catálogo de produtos e serviços",
    "Analytics",
    "Personalização avançada e sem marca",
  ],
};

function BillingPage() {
  const access = usePlanAccess();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const { data: account } = useQuery({
    queryKey: ["billing-account"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return { id: data.user?.id, email: data.user?.email };
    },
  });
  const startCheckout = (priceId: string) =>
    openCheckout({
      priceId,
      customerEmail: account?.email,
      userId: account?.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: BillingService.listPublicPlans,
  });
  const displayedPlans = plans.filter((plan) =>
    ["essential", "free", "pro-monthly", "pro-yearly", "pro"].includes(plan.slug),
  );

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Assinatura
        </p>
        <h1 className="mt-1 text-3xl font-bold">Escolha como seu Eialink evolui</h1>
        <p className="mt-2 text-muted-foreground">
          Comece sem custo. Quando precisar de vitrine, visual completo e dados para crescer, avance
          para o Pro.
        </p>
      </header>

      <section className="card-surface flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Seu plano atual</p>
          <p className="mt-1 text-xl font-bold">{access.data?.plan?.name ?? "Eialink Essencial"}</p>
        </div>
        <span className="rounded-full bg-[color:var(--primary)]/15 px-3 py-1 text-sm font-semibold text-[color:var(--primary)]">
          {access.data?.isPro ? "Recursos Pro liberados" : "Comece no Essencial"}
        </span>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="card-surface h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {displayedPlans.map((plan) => {
            const essential = plan.slug === "essential" || plan.slug === "free";
            const current = access.data?.plan?.id === plan.id;
            const annual = plan.billing_interval === "yearly";
            const features = essential ? FALLBACK_FEATURES.essential : FALLBACK_FEATURES.pro;
            return (
              <article
                key={plan.id}
                className={`card-surface flex flex-col ${!essential ? "ring-1 ring-[color:var(--primary)]/40" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  {!essential && (
                    <Sparkles
                      className="h-5 w-5 text-[color:var(--accent)]"
                      aria-label="Plano Pro"
                    />
                  )}
                </div>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-6 text-3xl font-bold">
                  {formatPlanPrice(plan.price_cents, plan.billing_interval)}
                </p>
                {annual && (
                  <p className="mt-1 text-xs font-medium text-[color:var(--success)]">
                    Economize dois meses no plano anual.
                  </p>
                )}
                <ul className="mt-6 space-y-3 text-sm">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {essential ? (
                  <Link to="/pages" className="btn-secondary mt-8 w-full">
                    {current ? "Plano atual" : "Usar Eialink Essencial"}
                  </Link>
                ) : (
                  <a
                    className="btn-primary mt-8 w-full"
                    href={commercialWhatsAppUrl("pro")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {current ? "Plano atual" : "Assinar Eialink Pro"}
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="card-surface flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">Precisa de uma presença ainda mais completa?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A Talento Marketing Digital cria o site profissional da sua empresa.
          </p>
        </div>
        <a
          className="btn-secondary"
          href={commercialWhatsAppUrl("site")}
          target="_blank"
          rel="noreferrer"
        >
          Quero um site profissional
        </a>
      </section>
    </div>
  );
}
