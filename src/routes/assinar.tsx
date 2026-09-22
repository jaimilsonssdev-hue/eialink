import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  Loader2,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { FunnelService } from "@/modules/analytics/services/FunnelService";
import { toast } from "sonner";

type PlanKey = "pro_yearly" | "pro_yearly_pix" | "pro_monthly";

interface SearchParams {
  plan?: string;
  ref?: string;
}

export const Route = createFileRoute("/assinar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ativação Rápida EIA Link Pro — Checkout Seguro" },
      { name: "description", content: "Finalize a assinatura da sua Máquina de Vendas Digital EIA Link com total segurança." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DirectCheckoutPage,
});

const PLAN_DETAILS: Record<
  PlanKey,
  {
    name: string;
    badge: string;
    headlinePrice: string;
    subPrice: string;
    billingText: string;
    savingsBadge?: string;
    paymentMethod: "card" | "pix";
    stripePriceId: PlanKey;
  }
> = {
  pro_yearly: {
    name: "EIA Link Pro · Anual (Cartão)",
    badge: "Mais Recomendado · 2 Meses Grátis",
    headlinePrice: "R$ 24,16",
    subPrice: "R$ 290 cobrados anualmente no cartão",
    billingText: "Equivale a R$ 24,16/mês. Você economiza R$ 58 por ano.",
    savingsBadge: "ECONOMIZE 17% (2 MESES GRÁTIS)",
    paymentMethod: "card",
    stripePriceId: "pro_yearly",
  },
  pro_yearly_pix: {
    name: "EIA Link Pro · Anual (Pix à Vista)",
    badge: "Sem Cartão · Liberação Imediata",
    headlinePrice: "R$ 290",
    subPrice: "Pagamento único anual de R$ 290 no Pix",
    billingText: "Sem renovação automática no cartão. Acesso liberado por 12 meses.",
    savingsBadge: "2 MESES GRÁTIS NO PIX",
    paymentMethod: "pix",
    stripePriceId: "pro_yearly_pix",
  },
  pro_monthly: {
    name: "EIA Link Pro · Mensal",
    badge: "Sem Fidelidade",
    headlinePrice: "R$ 29",
    subPrice: "R$ 29 cobrados mensalmente",
    billingText: "Cancele a qualquer momento direto pelo painel, sem taxas extras.",
    paymentMethod: "card",
    stripePriceId: "pro_monthly",
  },
};

function normalizePlanKey(raw?: string): PlanKey {
  if (!raw) return "pro_yearly";
  const lower = raw.toLowerCase().replace(/-/g, "_");
  if (lower.includes("pix")) return "pro_yearly_pix";
  if (lower.includes("monthly") || lower.includes("mensal")) return "pro_monthly";
  return "pro_yearly";
}

const PRO_BENEFITS = [
  "BioLinks e Páginas Ilimitadas para o seu negócio",
  "🔥 Vitrine Carrossel estilo Instagram com pedidos no WhatsApp",
  "📅 Agendamento Online 24/7 integrado ao Google Agenda",
  "📱 App PWA Instalável no celular do seu cliente",
  "🏷️ QR Codes Dinâmicos de Balcão e Mesas (Prontos para imprimir)",
  "⭐ Acelerador de Avaliações 5 Estrelas no Google Meu Negócio",
  "📊 Métricas de Visitas e Conversões no WhatsApp",
  "✨ 100% com a sua marca (sem o logo EIA Link)",
  "🛡️ 0% de comissão sobre seus pedidos ou reservas",
];

function DirectCheckoutPage() {
  const { plan: rawPlan, ref } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(normalizePlanKey(rawPlan));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  // Form states
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUser({
          id: data.session.user.id,
          email: data.session.user.email ?? "",
        });
        setCheckoutStarted(true);
      }
      setAuthChecking(false);
    });
  }, []);

  const planInfo = PLAN_DETAILS[selectedPlan];

  async function handleGuestSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (authMode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error || !data.user) {
        setErrorMsg(error?.message ?? "Falha ao entrar na conta. Verifique os dados.");
        return;
      }
      setCurrentUser({ id: data.user.id, email: data.user.email ?? "" });
      setCheckoutStarted(true);
      toast.success("Login efetuado! Carregando checkout seguro...");
      return;
    }

    if (password.length < 6) {
      setLoading(false);
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/checkout/return`,
        },
      });

      if (signErr || !data.user) {
        throw new Error(signErr?.message ?? "Não foi possível criar sua conta.");
      }

      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName.trim() || email.split("@")[0],
        email: email.trim(),
        whatsapp: whatsapp.trim() || "",
        company_name: fullName.trim() || "Minha Empresa",
        niche: "Geral",
        city: "Brasil",
        state: "BR",
        has_website: false,
        main_goal: "Vendas",
        lgpd_accepted_at: new Date().toISOString(),
      });

      setCurrentUser({ id: data.user.id, email: data.user.email ?? email });
      setCheckoutStarted(true);
      void FunnelService.track("upgrade_click", {
        source: "direct_checkout_whatsapp",
        plan_slug: selectedPlan,
      });
      toast.success("Conta criada com sucesso! Carregando pagamento seguro...");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao processar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07050a] text-zinc-100 selection:bg-fuchsia-500/30">
      {/* Top Bar Minimalista */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </span>
            EIA Link
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Lock className="h-3 w-3" /> Ambiente Seguro & Criptografado
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Banner de Boas-Vindas */}
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            <Sparkles className="h-3 w-3" /> Ativação Imediata da Sua Máquina Digital
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold text-white">
            Finalize sua assinatura do EIA Link Pro
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
            Acesso liberado instantaneamente. Configure sua vitrine no WhatsApp, agendamento Google e QR Codes hoje mesmo.
          </p>
        </div>

        {/* Seletor Rápido de Planos (Tabs de Fechamento) */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPlan("pro_yearly")}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold transition-all border ${
              selectedPlan === "pro_yearly"
                ? "border-fuchsia-500 bg-fuchsia-500/20 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            ⭐ Pro Anual (Cartão) · R$ 290/ano{" "}
            <span className="ml-1 text-emerald-400 font-extrabold">(2 Meses Grátis)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlan("pro_yearly_pix")}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold transition-all border ${
              selectedPlan === "pro_yearly_pix"
                ? "border-violet-500 bg-violet-500/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Pro Anual (Pix à Vista) · R$ 290
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlan("pro_monthly")}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold transition-all border ${
              selectedPlan === "pro_monthly"
                ? "border-fuchsia-500 bg-fuchsia-500/20 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            💳 Pro Mensal · R$ 29/mês
          </button>
        </div>

        {/* Grid de 2 Colunas: Resumo do Pedido + Formulário/Stripe */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Coluna Esquerda: Resumo do Pedido & Benefícios */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-gradient-to-b from-[#130d22] to-[#0a0712] p-6 shadow-xl space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-400">
                Resumo do Pedido
              </span>
              <h2 className="mt-1 font-display text-xl font-bold text-white">{planInfo.name}</h2>
              <p className="text-xs text-zinc-400 mt-1">{planInfo.billingText}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-300">Valor do Plano:</span>
                <span className="font-display text-2xl font-extrabold text-white">
                  {planInfo.headlinePrice}
                  {selectedPlan !== "pro_yearly_pix" && (
                    <span className="text-xs font-normal text-zinc-400">/mês</span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 text-right">{planInfo.subPrice}</p>
              {planInfo.savingsBadge && (
                <div className="pt-2 border-t border-white/10">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Sparkles className="h-3 w-3" /> {planInfo.savingsBadge}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                O que você recebe imediatamente:
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {PRO_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 font-bold" />
                    <span className="leading-tight">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Garantias */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Garantia incondicional de 7 dias ou seu dinheiro de volta.</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="h-4 w-4 text-violet-400 shrink-0" />
                <span>Processamento criptografado via Stripe Payments.</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Acesso Rápido + Checkout */}
          <div className="lg:col-span-7 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-b from-[#180e2b] to-[#0c0816] p-6 shadow-2xl">
            {authChecking ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
                <p className="text-xs text-zinc-400">Preparando ambiente seguro...</p>
              </div>
            ) : currentUser && checkoutStarted ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-200">
                      Conectado como <strong className="text-white">{currentUser.email}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setCurrentUser(null);
                      setCheckoutStarted(false);
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Trocar conta
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-fuchsia-400" />
                      Finalize seu pagamento na Stripe
                    </h3>
                  </div>

                  {/* Componente Stripe Embedded Checkout */}
                  <div className="min-h-[420px] rounded-xl border border-white/10 bg-black/60 p-3">
                    <StripeEmbeddedCheckout
                      key={`${selectedPlan}-${currentUser.id}`}
                      priceId={selectedPlan}
                      onComplete={() => {
                        window.location.assign("/checkout/return?completed=true");
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Formulário Expresso de Criação de Conta (Sem distrações) */
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    1. Identificação para ativação
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Crie seu acesso direto para configurar sua página assim que o pagamento for aprovado.
                  </p>
                </div>

                {/* Alternador Cadastro / Login */}
                <div className="flex gap-2 rounded-xl bg-black/40 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      authMode === "signup"
                        ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Novo Acesso (Rápido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      authMode === "login"
                        ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Já Tenho Conta
                  </button>
                </div>

                <form onSubmit={handleGuestSignUp} className="space-y-4">
                  {authMode === "signup" && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Seu Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300">WhatsApp Comercial</label>
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">E-mail</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      {authMode === "signup" ? "Crie uma Senha de Acesso" : "Sua Senha"}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center text-sm font-bold py-3.5 inline-flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.01] bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-fuchsia-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {authMode === "signup"
                          ? "Criar Conta & Prosseguir para Pagamento"
                          : "Entrar & Prosseguir para Pagamento"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center">
                    Ao prosseguir, você concorda com os Termos de Uso e Política de Privacidade.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

