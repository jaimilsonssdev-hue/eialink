import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import { FunnelService } from "@/modules/analytics/services/FunnelService";
import { BillingService } from "@/modules/billing/services/BillingService";
import {
  formatPlanPrice,
  toPlanFeatures,
  toPlanLimits,
  type PublicPlan,
} from "@/modules/billing/types";

const fallbackPlans: PublicPlan[] = [
  {
    id: "fallback-essential",
    slug: "essential",
    name: "Eialink Essencial",
    description: "Para publicar sua presença profissional gratuitamente.",
    price_cents: 0,
    billing_interval: "monthly",
    limits: { bio_pages: 1, links: 4, catalog_items: 0, templates: 1 },
    features: {
      whatsapp: true,
      analytics: false,
      custom_domain: false,
      catalog: false,
      premium_templates: false,
      advanced_appearance: false,
      remove_branding: false,
    },
    active: true,
    position: 0,
  },
  {
    id: "fallback-pro-monthly",
    slug: "pro-monthly",
    name: "Eialink Pro",
    description: "Para negócios que querem vender, medir resultados e crescer.",
    price_cents: 1990,
    billing_interval: "monthly",
    limits: { bio_pages: -1, links: -1, catalog_items: -1, templates: -1 },
    features: {
      whatsapp: true,
      analytics: true,
      custom_domain: true,
      catalog: true,
      premium_templates: true,
      advanced_appearance: true,
      remove_branding: true,
    },
    active: true,
    position: 1,
  },
  {
    id: "fallback-pro-yearly",
    slug: "pro-yearly",
    name: "Eialink Pro anual",
    description: "Todos os recursos Pro com economia no plano anual.",
    price_cents: 19700,
    billing_interval: "yearly",
    limits: { bio_pages: -1, links: -1, catalog_items: -1, templates: -1 },
    features: {
      whatsapp: true,
      analytics: true,
      custom_domain: true,
      catalog: true,
      premium_templates: true,
      advanced_appearance: true,
      remove_branding: true,
    },
    active: true,
    position: 2,
  },
];

function planBenefits(plan: PublicPlan) {
  const limits = toPlanLimits(plan.limits);
  const features = toPlanFeatures(plan.features);
  return [
    limits.bio_pages === -1 ? "BioLinks ilimitados" : `${limits.bio_pages} BioLink`,
    limits.templates === -1 ? "Todos os templates" : "1 template gratuito",
    features.catalog ? "Catálogo de produtos e serviços" : null,
    features.analytics ? "Resultados da página" : null,
    features.remove_branding ? "Sem a marca Eialink" : "Marca Eialink na página",
    features.whatsapp ? "WhatsApp integrado" : null,
  ].filter(Boolean) as string[];
}

export function PublicPricingSection() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: BillingService.listPublicPlans,
    staleTime: 60_000,
  });
  const visiblePlans = (plans?.length ? plans : fallbackPlans).filter((plan) =>
    ["essential", "free", "pro-monthly", "pro-yearly"].includes(plan.slug),
  );

  return (
    <section id="precos" className="relative z-10 mx-auto max-w-7xl px-5 pb-14">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.86),rgba(11,8,16,.95))] p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Planos</p>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Comece grátis. Evolua quando seu negócio pedir.
          </h2>
          <p className="mt-3 text-sm text-[#c4bacf]">
            Uma página bonita desde o início, com recursos Pro para quando fizer sentido crescer.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-[310px] animate-pulse rounded-2xl border border-white/10 bg-white/[.04]"
                />
              ))
            : visiblePlans.map((plan) => {
                const featured = plan.slug === "pro-monthly" || plan.slug === "pro";
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-6 ${featured ? "border-fuchsia-400/70 bg-violet-500/[.11] shadow-[0_0_35px_rgba(168,85,247,.14)]" : "border-white/10 bg-[#0d0a12]"}`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-bold">
                        <Sparkles className="h-3 w-3" /> Mais escolhido
                      </span>
                    )}
                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-2 min-h-10 text-sm text-[#c4bacf]">
                      {plan.description || "Uma presença digital pronta para vender."}
                    </p>
                    <p className="mt-5 font-display text-3xl font-bold">
                      {formatPlanPrice(plan.price_cents, plan.billing_interval)}
                    </p>
                    <ul className="mt-6 space-y-2.5 text-sm text-[#ddd5e8]">
                      {planBenefits(plan).map((benefit) => (
                        <li key={benefit} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    {plan.price_cents === 0 ? (
                      <Link
                        to="/auth"
                        search={{ mode: "signup" } as never}
                        className="btn-secondary mt-7 justify-center"
                        onClick={() =>
                          void FunnelService.track("signup_click", {
                            source: "public_pricing",
                            plan_slug: plan.slug,
                          })
                        }
                      >
                        Criar meu Eialink grátis
                      </Link>
                    ) : (
                      <a
                        href={commercialWhatsAppUrl("pro")}
                        target="_blank"
                        rel="noreferrer"
                        className={`${featured ? "btn-primary" : "btn-secondary"} mt-7 justify-center`}
                        onClick={() =>
                          void FunnelService.track("upgrade_click", {
                            source: "public_pricing",
                            plan_slug: plan.slug,
                          })
                        }
                      >
                        Assinar Eialink Pro
                      </a>
                    )}
                  </article>
                );
              })}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-[#c4bacf]">
          <span>Precisa de algo além do Eialink?</span>
          <a
            className="font-semibold text-violet-300 hover:text-violet-200"
            href={commercialWhatsAppUrl("site")}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              void FunnelService.track("service_click", {
                source: "public_pricing",
                service: "professional_site",
              })
            }
          >
            Quero um site profissional
          </a>
        </div>
      </div>
    </section>
  );
}
