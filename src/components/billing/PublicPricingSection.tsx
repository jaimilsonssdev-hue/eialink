import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, Zap, Calendar, ShoppingBag, Radio, ShieldCheck, ArrowRight } from "lucide-react";
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
    description: "Para pequenos negócios começarem com presença profissional gratuita.",
    price_cents: 0,
    billing_interval: "monthly",
    limits: { bio_pages: 1, links: 4, catalog_items: 3, templates: 3 },
    features: {
      whatsapp: true,
      analytics: false,
      custom_domain: false,
      catalog: true,
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
    description: "A Máquina Completa: Carrossel Instagram, Agendamento Google e QR Codes Dinâmicos.",
    price_cents: 2900,
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
    name: "Eialink Pro Anual",
    description: "Economia máxima de 2 meses grátis. Acesso ilimitado a todo o ecossistema.",
    price_cents: 29000,
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
  const isPro = plan.slug.includes("pro");

  if (isPro) {
    return [
      "BioLinks e Páginas Ilimitadas",
      "🔥 Carrossel Estilo Instagram (Pedido direto no Zap)",
      "📅 Agendamento Online 24/7 integrado ao Google Agenda",
      "📱 App PWA Instalável no celular do cliente",
      "🏷️ QR Codes Dinâmicos de Balcão (Imprima para mesas e balcões)",
      "⭐ Acelerador de Avaliações no Google Meu Negócio",
      "📊 Métricas de Visitas e Conversões no WhatsApp",
      "✨ Sem marca EIA Link + Domínio Próprio liberado",
      "🛡️ 0% de comissão sobre seus pedidos ou reservas",
    ];
  }

  return [
    `${limits.bio_pages} BioLink Profissional no ar`,
    "Até 3 Produtos ou Serviços cadastrados",
    "Botão WhatsApp com mensagem pré-formatada",
    "QR Code Dinâmico básico para balcão",
    "Templates e temas clássicos gratuitos",
    "Marca d\'água discreta EIA Link",
  ];
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
    <section id="precos" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.92),rgba(11,8,16,.98))] p-6 md:p-10 shadow-2xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Zap className="h-3.5 w-3.5 text-fuchsia-400" /> Planos Transparentes & Sem Pegadinhas
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold text-white">
            Quanto custa transformar seguidores em clientes fiéis?
          </h2>
          <p className="mt-3 text-base text-[#c4bacf]">
            Comece 100% grátis. Ative os superpoderes Pro quando seu negócio estiver pronto para faturar alto.
          </p>
        </div>

        {/* Ancoragem de Custo vs Mercado */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400">
                A Economia Real da Máquina EIA Link
              </span>
              <h4 className="text-lg font-bold text-white">
                Contratar tudo isso separado custaria mais de R$ 3.800 por ano:
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-center">
                <p className="text-[11px] text-zinc-400">Site Tradicional</p>
                <p className="text-xs font-bold text-red-400 line-through">R$ 2.500 taxa única</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-center">
                <p className="text-[11px] text-zinc-400">App de Agenda</p>
                <p className="text-xs font-bold text-red-400 line-through">R$ 99/mês</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-center">
                <p className="text-[11px] text-zinc-400">Apps de Delivery</p>
                <p className="text-xs font-bold text-red-400 line-through">Até 27% por pedido</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <p className="text-[11px] font-semibold text-emerald-300">EIA Link Pro</p>
                <p className="text-xs font-bold text-emerald-400">A partir de R$ 29/mês</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade de Planos */}
        <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-2xl border border-white/10 bg-white/[.04]"
                />
              ))
            : visiblePlans.map((plan) => {
                const featured = plan.slug === "pro-monthly" || plan.slug === "pro";
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 ${
                      featured
                        ? "border-fuchsia-400/80 bg-gradient-to-b from-violet-500/[.16] to-[#120a1f] shadow-[0_0_40px_rgba(168,85,247,.2)] scale-105 z-10"
                        : "border-white/10 bg-[#0d0a12]/90 hover:border-white/20"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                        <Sparkles className="h-3 w-3" /> Máquina Mais Vendida
                      </span>
                    )}

                    <div>
                      <h3 className="font-display text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="mt-2 min-h-12 text-xs text-[#c4bacf] leading-relaxed">
                        {plan.description || "Uma presença digital pronta para vender."}
                      </p>

                      <div className="mt-5 pb-5 border-b border-white/10">
                        <p className="font-display text-3xl font-extrabold text-white">
                          {formatPlanPrice(plan.price_cents, plan.billing_interval)}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {plan.price_cents === 0
                            ? "Grátis para sempre. Sem cartão de crédito."
                            : plan.billing_interval === "yearly"
                            ? "Cobrado anualmente (2 meses de bônus)"
                            : "Cancele quando quiser sem fidelidade"}
                        </p>
                      </div>

                      <ul className="mt-6 space-y-2.5 text-xs text-[#ddd5e8]">
                        {planBenefits(plan).map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 font-bold" />
                            <span className="leading-tight">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      {plan.price_cents === 0 ? (
                        <Link
                          to="/auth"
                          search={{ mode: "signup" } as never}
                          className="btn-secondary w-full justify-center text-sm font-semibold py-3"
                          onClick={() =>
                            void FunnelService.track("signup_click", {
                              source: "public_pricing",
                              plan_slug: plan.slug,
                            })
                          }
                        >
                          Criar Meu EIA Link Grátis
                        </Link>
                      ) : (
                        <Link
                          to="/auth"
                          search={{ mode: "signup", next: "billing" } as never}
                          className={`w-full justify-center text-sm font-bold py-3 inline-flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.02] ${
                            featured
                              ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-fuchsia-500/25"
                              : "btn-secondary"
                          }`}
                          onClick={() =>
                            void FunnelService.track("upgrade_click", {
                              source: "public_pricing",
                              plan_slug: plan.slug,
                            })
                          }
                        >
                          Ativar Minha Máquina Pro <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
        </div>

                {/* Recurso Adicional Opcional: Plaquinhas Físicas NFC sob Consulta */}
        <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-950/25 p-5 flex flex-col md:flex-row items-center justify-between gap-5 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="h-12 w-12 rounded-xl bg-violet-500/15 border border-violet-500/30 grid place-items-center text-violet-300 shrink-0 shadow-inner">
              <Radio className="h-6 w-6 text-fuchsia-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h5 className="text-sm font-bold text-white">Kit Físico de Plaquinhas NFC & Displays de Balcão</h5>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                  Opcional · Sob Consulta
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Deseja plaquinhas físicas em acrílico premium com chip NFC por aproximação para mesas ou balcão da sua loja? O sistema de software gera os links inteligentes por padrão, e fornecemos as placas físicas sob encomenda personalizada.
              </p>
            </div>
          </div>
          <a
            href={commercialWhatsAppUrl("nfc")}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl border border-violet-400/40 bg-violet-500/15 hover:bg-violet-500/30 text-white text-xs font-bold whitespace-nowrap transition-all shadow-md shrink-0 cursor-pointer"
          >
            Consultar Valores do Kit NFC
          </a>
        </div>

        {/* Garantia & Atendimento Personalizado */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Garantia Incondicional de 7 Dias</p>
              <p className="text-xs text-zinc-400">Assine o Pro, teste à vontade. Se não dobrar sua percepção de valor, devolvemos 100%.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#c4bacf]">
            <span>Precisa de um projeto sob medida?</span>
            <a
              className="font-semibold text-violet-300 hover:text-violet-200 underline underline-offset-4"
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
              Fale com nosso time no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
