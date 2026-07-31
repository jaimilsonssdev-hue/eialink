import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { BillingService } from "@/modules/billing/services/BillingService";
import { formatPlanPrice, toPlanFeatures, toPlanLimits } from "@/modules/billing/types";

function planBenefits(plan: Awaited<ReturnType<typeof BillingService.listPublicPlans>>[number]) {
  const limits = toPlanLimits(plan.limits);
  const features = toPlanFeatures(plan.features);
  const pageLimit =
    limits.bio_pages === -1
      ? "BioLinks ilimitados"
      : `${limits.bio_pages} BioLink${limits.bio_pages === 1 ? "" : "s"}`;
  const catalogLimit =
    limits.catalog_items === -1
      ? "Catálogo ilimitado"
      : `${limits.catalog_items} itens no catálogo`;
  const templateLimit =
    limits.templates === -1
      ? "Todos os templates"
      : `${limits.templates} template${limits.templates === 1 ? "" : "s"}`;

  return [
    pageLimit,
    catalogLimit,
    templateLimit,
    features.whatsapp ? "WhatsApp integrado" : null,
    features.analytics ? "Resultados da página" : null,
  ].filter(Boolean) as string[];
}

export function PublicPricingSection() {
  const {
    data: plans,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-plans"],
    queryFn: BillingService.listPublicPlans,
    staleTime: 60_000,
  });

  if (isError || (!isLoading && !plans?.length)) return null;

  return (
    <section id="precos" className="relative z-10 mx-auto max-w-7xl px-5 pb-14">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.86),rgba(11,8,16,.95))] p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Planos</p>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Comece grátis. Evolua quando seu negócio pedir.
          </h2>
          <p className="mt-3 text-sm text-[#c4bacf]">
            Valores e limites definidos diretamente pela equipe EIA Link.
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
            : plans?.map((plan, index) => {
                const featured = index === 1;
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
                    <Link
                      to="/auth"
                      search={{ mode: "signup" } as never}
                      className={`${featured ? "btn-primary" : "btn-secondary"} mt-7 justify-center`}
                    >
                      {plan.price_cents === 0 ? "Começar grátis" : `Escolher ${plan.name}`}
                    </Link>
                  </article>
                );
              })}
        </div>
      </div>
    </section>
  );
}
