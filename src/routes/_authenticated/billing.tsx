import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BillingService } from "@/modules/billing/services/BillingService";
import { formatPlanPrice } from "@/modules/billing/types";
import { commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [portalLoading, setPortalLoading] = useState(false);
  const startCheckout = (priceId: string) => openCheckout({ priceId });
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: BillingService.listPublicPlans,
  });
  const { data: stripePayment, isLoading: stripePaymentLoading } = useQuery({
    queryKey: ["current-stripe-payment", access.data?.subscription?.user_id],
    enabled: Boolean(access.data?.isPro),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_subscriptions")
        .select("stripe_customer_id, status")
        .eq("user_id", access.data!.subscription!.user_id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const hasStripePayment = Boolean(stripePayment?.stripe_customer_id);
  const displayedPlans = plans.filter((plan) =>
    ["essential", "free", "pro-monthly", "pro-yearly", "pro"].includes(plan.slug),
  );

  async function openPortal() {
    setPortalLoading(true);
    try {
      const result = await createPortalSession({
        data: { environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir sua assinatura.");
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PaymentTestModeBanner />
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
                  <div className="mt-8 space-y-2">
                    {access.data?.isPro && stripePaymentLoading ? (
                      <button type="button" className="btn-primary w-full" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" /> Verificando assinatura
                      </button>
                    ) : access.data?.isPro && hasStripePayment ? (
                      <button
                        type="button"
                        className="btn-primary w-full"
                        disabled={portalLoading}
                        onClick={() => void openPortal()}
                      >
                        {portalLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Gerenciar assinatura"
                        )}
                      </button>
                    ) : access.data?.isPro ? (
                      <button type="button" className="btn-secondary w-full" disabled>
                        Plano Pro ativo
                      </button>
                    ) : annual ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary w-full"
                          onClick={() => startCheckout("pro_yearly")}
                        >
                          <CreditCard className="h-4 w-4" /> Assinar no cartão
                        </button>
                        <button
                          type="button"
                          className="btn-secondary w-full"
                          onClick={() => startCheckout("pro_yearly_pix")}
                        >
                          Pagar 12 meses no Pix
                        </button>
                        <p className="text-xs text-muted-foreground">
                          Pix é pagamento único, sem renovação automática.
                        </p>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary w-full"
                        onClick={() => startCheckout("pro_monthly")}
                      >
                        <CreditCard className="h-4 w-4" /> Assinar mensal
                      </button>
                    )}
                  </div>
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

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeCheckout()}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Finalize seu pagamento</DialogTitle>
            <DialogDescription>
              Ambiente seguro da Stripe. O Pro é liberado após a confirmação do pagamento.
            </DialogDescription>
          </DialogHeader>
          {checkoutElement}
        </DialogContent>
      </Dialog>
    </div>
  );
}
