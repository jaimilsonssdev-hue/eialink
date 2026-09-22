import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, Radio, Store } from "lucide-react";
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
    name: "EIA Link Grátis",
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
    name: "EIA Link Pro",
    description: "A Máquina Completa: Carrossel Instagram, Agendamento Google e QR Codes.",
    price_cents: 2900,
    billing_interval: "monthly",
    limits: { bio_pages: -1, links: -1, catalog_items: -1, templates: -1 },
    features: {
      whatsapp: true,
      analytics: true,
      custom_domain: false,
      catalog: true,
      premium_templates: true,
      advanced_appearance: true,
      remove_branding: true,
    },
    active: true,
    position: 1,
  },
];

export function PublicPricingSection() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const { data: plans, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: BillingService.listPublicPlans,
    staleTime: 60_000,
  });

  const proPlan = (plans || fallbackPlans).find(
    (p) => p.slug === "pro-monthly" || p.slug === "pro"
  ) || fallbackPlans[1];

  const freePlan = (plans || fallbackPlans).find(
    (p) => p.slug === "essential" || p.slug === "free"
  ) || fallbackPlans[0];

  const freeBenefits = [
    "1 BioLink Profissional no ar",
    "Até 3 Produtos ou Serviços cadastrados",
    "Botão WhatsApp com mensagem pré-formatada",
    "QR Code digital básico para balcão",
    "Templates e temas clássicos gratuitos",
    "Marca d'água discreta EIA Link",
  ];

  const proBenefits = [
    "BioLinks e Páginas Ilimitadas",
    "🔥 Carrossel Estilo Instagram (Pedido direto no Zap)",
    "📅 Agendamento Online 24/7 integrado ao Google Agenda",
    "📱 App PWA Instalável no celular do cliente",
    "🏷️ QR Codes Dinâmicos de Balcão (Pronto para imprimir)",
    "⭐ Acelerador de Avaliações no Google Meu Negócio",
    "📊 Métricas de Visitas e Conversões no WhatsApp",
    "✨ Sem a marca EIA Link (100% com a sua marca)",
    "🛡️ 0% de comissão sobre seus pedidos ou reservas",
  ];

  const nfcPlanBenefits = [
    "Tudo o que está incluído no Plano Pro",
    "🏷️ Kit de Plaquinhas Físicas em Acrílico Premium",
    "⚡ Chip NFC Inteligente por aproximação de celular",
    "⭐ Acelerador Físico de Avaliações 5 Estrelas no Google",
    "🛠️ Configuração assistida por especialista da equipe",
    "📦 Envio direto para o seu endereço comercial",
    "💎 Ideal para mesas de restaurantes, balcões e clínicas",
  ];

  return (
    <section id="precos" className="relative z-10 mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.92),rgba(11,8,16,.98))] p-6 md:p-10 shadow-2xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Zap className="h-3.5 w-3.5 text-fuchsia-400" /> Planos Transparentes & Sem Pegadinhas
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold text-white">
            Escolha o plano ideal para transformar seguidores em clientes
          </h2>
          <p className="mt-3 text-base text-[#c4bacf]">
            Comece 100% grátis, evolua para a Máquina Pro ou solicite o Kit Físico de Placas NFC para o seu balcão.
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

        {/* Seletor Interativo: Mensal vs Anual */}
        <div className="mt-8 flex flex-col items-center justify-center gap-2">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`cursor-pointer rounded-full px-5 py-2 text-xs font-bold transition-all ${
                billingInterval === "monthly"
                  ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`cursor-pointer relative flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                billingInterval === "yearly"
                  ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Anual
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                2 Meses Grátis
              </span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            {billingInterval === "yearly"
              ? "Economize R$ 58 por ano assinando o plano anual no Pix ou Cartão."
              : "Sem fidelidade, cancele a qualquer momento direto pelo painel."}
          </p>
        </div>

        {/* Grade com os 3 Planos */}
        <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
          {/* 1. PLANO GRÁTIS */}
          <article className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d0a12]/90 p-6 hover:border-white/20 transition-all">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Para Começar
              </div>
              <h3 className="font-display text-2xl font-bold text-white">EIA Link Grátis</h3>
              <p className="mt-2 min-h-10 text-xs text-[#c4bacf] leading-relaxed">
                Para pequenos negócios e profissionais que querem uma presença digital profissional gratuita.
              </p>

              <div className="mt-5 pb-5 border-b border-white/10">
                <p className="font-display text-3xl font-extrabold text-white">R$ 0</p>
                <p className="text-[11px] text-zinc-400 mt-1">Grátis para sempre. Sem cartão de crédito.</p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-[#ddd5e8]">
                {freeBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 font-bold" />
                    <span className="leading-tight">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                to="/auth"
                search={{ mode: "signup" } as never}
                className="btn-secondary w-full justify-center text-sm font-semibold py-3"
                onClick={() =>
                  void FunnelService.track("signup_click", {
                    source: "public_pricing",
                    plan_slug: "free",
                  })
                }
              >
                Criar Meu EIA Link Grátis
              </Link>
            </div>
          </article>

          {/* 2. PLANO PRO */}
          <article className="relative flex flex-col justify-between rounded-2xl border border-fuchsia-400/80 bg-gradient-to-b from-violet-500/[.16] to-[#120a1f] p-6 shadow-[0_0_40px_rgba(168,85,247,.2)] scale-105 z-10">
            <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
              <Sparkles className="h-3 w-3" /> Mais Escolhido
            </span>

            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider mb-2">
                Máquina Completa
              </div>
              <h3 className="font-display text-2xl font-bold text-white">EIA Link Pro</h3>
              <p className="mt-2 text-xs text-[#c4bacf] leading-relaxed">
                Carrossel Instagram com pedidos no WhatsApp, Agendamento Google 24h e QR Codes Dinâmicos.
              </p>

              {/* Seletor Mensal / Anual NO PRÓPRIO CARD DO PLANO */}
              <div className="mt-3 mb-2 rounded-xl bg-black/60 p-1 border border-violet-400/30 grid grid-cols-2 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-bold transition-all text-center ${
                    billingInterval === "monthly"
                      ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md ring-1 ring-fuchsia-400"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    billingInterval === "yearly"
                      ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md ring-1 ring-fuchsia-400"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>Anual</span>
                  <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                    2 Meses Grátis
                  </span>
                </button>
              </div>

              <div className="mt-3 pb-5 border-b border-white/10">
                {billingInterval === "yearly" ? (
                  <>
                    <p className="font-display text-3xl font-extrabold text-white">
                      R$ 24,16<span className="text-base font-normal text-zinc-400">/mês</span>
                    </p>
                    <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                      R$ 290 cobrados anualmente (2 meses 100% grátis!)
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Disponível no Cartão ou Pix à vista</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-extrabold text-white">
                      R$ 29<span className="text-base font-normal text-zinc-400">/mês</span>
                    </p>
                    <p className="text-[11px] text-fuchsia-300 font-medium mt-1">
                      Cobrança mensal no cartão de crédito
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Sem fidelidade · Cancele quando quiser</p>
                  </>
                )}
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-[#ddd5e8]">
                {proBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 font-bold" />
                    <span className="leading-tight">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                to="/assinar"
                search={{ plan: billingInterval === "yearly" ? "pro-yearly" : "pro-monthly" } as never}
                className="w-full justify-center text-sm font-bold py-3 inline-flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.02] bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-fuchsia-500/25"
                onClick={() =>
                  void FunnelService.track("upgrade_click", {
                    source: "public_pricing",
                    plan_slug: billingInterval === "yearly" ? "pro-yearly" : "pro-monthly",
                  })
                }
              >
                {billingInterval === "yearly"
                  ? "Ativar Pro Anual (2 Meses Grátis)"
                  : "Ativar Pro Mensal"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* 3. PLANO PRESENÇA TOTAL + KIT FÍSICO NFC (SOB CONSULTA) */}
          <article className="relative flex flex-col justify-between rounded-2xl border border-violet-500/40 bg-gradient-to-b from-[#180d2e] to-[#0c0816] p-6 hover:border-violet-400/60 transition-all shadow-xl">
            <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-violet-600/90 px-3.5 py-1 text-xs font-bold text-white shadow">
              <Radio className="h-3 w-3 text-fuchsia-300" /> Físico + Digital
            </span>

            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 uppercase tracking-wider mb-2">
                Para Balcão & Mesas
              </div>
              <h3 className="font-display text-2xl font-bold text-white">Presença Total + NFC</h3>
              <p className="mt-2 min-h-10 text-xs text-[#c4bacf] leading-relaxed">
                A experiência phygital: software Pro completo + kit de plaquinhas físicas em acrílico com chip NFC gravado.
              </p>

              <div className="mt-5 pb-5 border-b border-white/10">
                <p className="font-display text-2xl font-extrabold text-white">Sob Consulta</p>
                <p className="text-[11px] text-zinc-400 mt-1">Orçamento personalizado de acordo com seu número de mesas/pontos.</p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-[#ddd5e8]">
                {nfcPlanBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 font-bold" />
                    <span className="leading-tight">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <a
                href={commercialWhatsAppUrl("nfc")}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full justify-center text-sm font-bold py-3 inline-flex items-center gap-2 border-violet-400/40 hover:bg-violet-500/20 text-white"
                onClick={() =>
                  void FunnelService.track("service_click", {
                    source: "public_pricing",
                    service: "nfc_kit_plan",
                  })
                }
              >
                Falar com Consultor no WhatsApp <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </article>
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
