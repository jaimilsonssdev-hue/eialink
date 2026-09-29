import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
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
  Copy,
  ExternalLink,
  Clock,
  Smartphone,
  Building2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { FunnelService } from "@/modules/analytics/services/FunnelService";
import {
  getAsaasPublicConfigFn,
  createAsaasPixCheckoutFn,
  createAsaasCardCheckoutFn,
  checkAsaasPaymentStatusFn,
} from "@/utils/asaas.functions";
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

  const onSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCheckoutStarted(false);
  };

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

        {/* Grid de 2 Colunas: Resumo do Pedido + Formulário/Checkout */}
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
                <span>Processamento com criptografia e segurança de nível bancário.</span>
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
                    onClick={onSignOut}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Trocar conta
                  </button>
                </div>

                <HybridCheckoutSection
                  currentUser={currentUser}
                  selectedPlan={selectedPlan}
                  planInfo={planInfo}
                  onSignOut={onSignOut}
                />
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

interface HybridCheckoutSectionProps {
  currentUser: { id: string; email: string };
  selectedPlan: PlanKey;
  planInfo: (typeof PLAN_DETAILS)[PlanKey];
  onSignOut: () => void;
}

function HybridCheckoutSection({
  currentUser,
  selectedPlan,
  planInfo,
}: HybridCheckoutSectionProps) {
  const [config, setConfig] = useState<{
    isAsaasConfigured: boolean;
    asaasEnvironment: string;
    pixKey: string;
    pixKeyType: string;
    pixReceiverName: string;
    whatsappSupport: string;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Tabs: "pix_auto" | "card" | "pix_direct"
  const [paymentTab, setPaymentTab] = useState<"pix_auto" | "card" | "pix_direct">("pix_auto");
  const [showStripe, setShowStripe] = useState(false);

  // Pix Auto state
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCodeBase64: string;
    pixCopiaECola: string;
    expirationDate?: string;
    value: number;
  } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Card form state
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCcv, setCardCcv] = useState("");
  const [cardCpfCnpj, setCardCpfCnpj] = useState("");
  const [cardPhone, setCardPhone] = useState("");
  const [cardPostalCode, setCardPostalCode] = useState("");
  const [cardAddressNum, setCardAddressNum] = useState("");
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Pix Direto copy state
  const [directPixCopied, setDirectPixCopied] = useState(false);

  // 1. Carrega configurações públicas do gateway
  useEffect(() => {
    let mounted = true;
    getAsaasPublicConfigFn()
      .then((cfg) => {
        if (!mounted) return;
        setConfig(cfg);
        if (!cfg.isAsaasConfigured) {
          setPaymentTab("pix_direct");
        } else if (selectedPlan === "pro_yearly_pix") {
          setPaymentTab("pix_auto");
        } else {
          setPaymentTab("pix_auto");
        }
      })
      .catch((err) => {
        console.warn("Erro ao obter configurações de pagamento:", err);
        if (mounted) setPaymentTab("pix_direct");
      })
      .finally(() => {
        if (mounted) setConfigLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedPlan]);

  // Pré-carrega dados do perfil
  useEffect(() => {
    if (currentUser.id) {
      supabase
        .from("profiles")
        .select("full_name, whatsapp")
        .eq("id", currentUser.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.full_name) setCardHolderName(data.full_name);
            if (data.whatsapp) setCardPhone(data.whatsapp);
          }
        });
    }
  }, [currentUser.id]);

  // Reseta pixData quando o plano muda
  useEffect(() => {
    setPixData(null);
    setPixPaid(false);
    setTimeLeft(15 * 60);
  }, [selectedPlan]);

  // Cronômetro do Pix
  useEffect(() => {
    if (!pixData || pixPaid || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData, pixPaid, timeLeft]);

  // Polling leve a cada 5s para verificar confirmação automática do Pix
  useEffect(() => {
    if (!pixData?.paymentId || pixPaid) return;
    const interval = setInterval(async () => {
      try {
        const res = await checkAsaasPaymentStatusFn({
          data: { paymentId: pixData.paymentId, userId: currentUser.id },
        });
        if (res.isPaid) {
          setPixPaid(true);
          toast.success("Pagamento confirmado via Pix! Bem-vindo ao EIA Link Pro!");
          setTimeout(() => {
            window.location.assign("/dashboard");
          }, 1500);
        }
      } catch (e) {
        console.warn("Polling Pix:", e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData?.paymentId, pixPaid, currentUser.id]);

  // Gerar QR Code Pix no Asaas
  async function handleGeneratePix() {
    setPixLoading(true);
    setPixError(null);
    try {
      const res = await createAsaasPixCheckoutFn({
        data: {
          planKey: selectedPlan,
          userId: currentUser.id,
          customerName: cardHolderName.trim() || currentUser.email.split("@")[0],
          customerEmail: currentUser.email,
          customerPhone: cardPhone.trim() || undefined,
          customerCpfCnpj: cardCpfCnpj.trim() || undefined,
        },
      });
      setPixData(res);
      setTimeLeft(15 * 60);
      toast.success("QR Code Pix gerado com sucesso!");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar cobrança Pix.";
      setPixError(msg);
      toast.error(msg);
    } finally {
      setPixLoading(false);
    }
  }

  // Consulta manual
  async function handleManualCheck() {
    if (!pixData?.paymentId) return;
    setCheckingStatus(true);
    try {
      const res = await checkAsaasPaymentStatusFn({
        data: { paymentId: pixData.paymentId, userId: currentUser.id },
      });
      if (res.isPaid) {
        setPixPaid(true);
        toast.success("Pagamento confirmado! Redirecionando para seu painel...");
        setTimeout(() => window.location.assign("/dashboard"), 1200);
      } else {
        toast.info("Aguardando confirmação bancária do Pix...");
      }
    } catch (err: any) {
      toast.error("Não foi possível consultar agora. Tente em alguns segundos.");
    } finally {
      setCheckingStatus(false);
    }
  }

  // Copiar código Pix copia e cola
  function handleCopyPixCode() {
    if (!pixData?.pixCopiaECola) return;
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setPixCopied(true);
    toast.success("Código Pix Copia e Cola copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  }

  // Enviar pagamento com Cartão
  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCardError(null);

    const cleanNumber = cardNumber.replace(/\D/g, "");
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      setCardError("Número de cartão inválido.");
      return;
    }

    const [month, year] = cardExpiry.split("/").map((s) => s.trim());
    if (!month || !year || month.length !== 2 || year.length < 2) {
      setCardError("Validade inválida. Use o formato MM/AA.");
      return;
    }
    const cleanYear = year.length === 2 ? `20${year}` : year;

    const cleanCpfCnpj = cardCpfCnpj.replace(/\D/g, "");
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      setCardError("CPF ou CNPJ inválido. Digite 11 dígitos para CPF ou 14 para CNPJ.");
      return;
    }

    setCardLoading(true);
    try {
      const planSlug = selectedPlan === "pro_yearly_pix" ? "pro_yearly" : selectedPlan;
      const res = await createAsaasCardCheckoutFn({
        data: {
          planKey: planSlug as "pro_yearly" | "pro_monthly",
          userId: currentUser.id,
          customerName: cardHolderName.trim(),
          customerEmail: currentUser.email,
          creditCard: {
            holderName: cardHolderName.trim(),
            number: cleanNumber,
            expiryMonth: month,
            expiryYear: cleanYear,
            ccv: cardCcv.trim(),
          },
          holderInfo: {
            name: cardHolderName.trim(),
            email: currentUser.email,
            cpfCnpj: cleanCpfCnpj,
            postalCode: cardPostalCode.replace(/\D/g, "") || "01001000",
            addressNumber: cardAddressNum.trim() || "SN",
            phone: cardPhone.replace(/\D/g, "") || "11999999999",
            mobilePhone: cardPhone.replace(/\D/g, "") || "11999999999",
          },
        },
      });

      if (res.success) {
        toast.success("Pagamento aprovado com sucesso! Redirecionando para seu painel...");
        setTimeout(() => window.location.assign("/dashboard"), 1500);
      } else {
        setCardError(
          `Pagamento não aprovado (Status: ${res.status}). Verifique os dados ou limite disponível.`
        );
      }
    } catch (err: any) {
      setCardError(err instanceof Error ? err.message : "Erro ao processar cartão.");
    } finally {
      setCardLoading(false);
    }
  }

  // Copiar chave Pix direto
  function handleCopyDirectPix() {
    if (!config?.pixKey) return;
    navigator.clipboard.writeText(config.pixKey);
    setDirectPixCopied(true);
    toast.success("Chave Pix copiada!");
    setTimeout(() => setDirectPixCopied(false), 3000);
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const whatsappDirectUrl = `https://wa.me/${(config?.whatsappSupport || "5581999999999").replace(/\D/g, "")}?text=${encodeURIComponent(
    `Olá! Acabei de realizar o pagamento do plano *${planInfo.name}* (${planInfo.subPrice}) via Pix Direto.\n\nE-mail da minha conta: *${currentUser.email}*\nSeguem os dados/comprovante para liberação do meu acesso Pro!`
  )}`;

  return (
    <div className="space-y-6">
      {/* Abas de Pagamento Híbrido */}
      <div>
        <div className="flex flex-wrap gap-2 rounded-xl bg-black/50 p-1 border border-white/10">
          {config?.isAsaasConfigured && (
            <>
              <button
                type="button"
                onClick={() => setPaymentTab("pix_auto")}
                className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentTab === "pix_auto"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                Pix Automático
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentTab === "card"
                    ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Cartão de Crédito
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setPaymentTab("pix_direct")}
            className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              paymentTab === "pix_direct"
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Pix com Comprovante
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: PIX AUTOMÁTICO (ASAAS) */}
      {paymentTab === "pix_auto" && config?.isAsaasConfigured && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-400" />
              Pix Automático com Liberação Imediata
            </h4>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Asaas v3
            </span>
          </div>

          {!pixData ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Gere o QR Code dinâmico do valor <strong>{planInfo.subPrice}</strong>. A ativação do seu plano Pro é detectada e liberada automaticamente em segundos.
              </p>

              {pixError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {pixError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGeneratePix}
                disabled={pixLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {pixLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code Pix ({planInfo.headlinePrice})
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pixPaid ? (
                <div className="text-center py-8 space-y-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 grid place-items-center text-emerald-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">Pagamento Confirmado!</h3>
                  <p className="text-xs text-emerald-200">
                    Sua assinatura Pro está ativa. Redirecionando para seu painel...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <img
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="w-48 h-48 mx-auto rounded-xl border-2 border-emerald-500/40 bg-white p-2 shadow-2xl"
                    />
                    <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Válido por {formatCountdown(timeLeft)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Código Pix (Copia e Cola)</span>
                      <span className="text-[10px] text-zinc-400">Abra o app do seu banco e cole</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={pixData.pixCopiaECola}
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 pr-28 text-xs text-zinc-300 font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPixCode}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {pixCopied ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
                      <span>Aguardando pagamento... A detecção é automática.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualCheck}
                      disabled={checkingStatus}
                      className="shrink-0 text-[11px] font-bold text-white bg-emerald-600/40 hover:bg-emerald-600/60 px-2.5 py-1 rounded-md border border-emerald-500/40 transition cursor-pointer"
                    >
                      {checkingStatus ? "Verificando..." : "Já paguei"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CARTÃO DE CRÉDITO (ASAAS) */}
      {paymentTab === "card" && config?.isAsaasConfigured && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300">Nome no Cartão (como impresso)</label>
            <input
              type="text"
              required
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
              placeholder="JOAO S SILVA"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300">Número do Cartão</label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(v);
                }}
                placeholder="0000 0000 0000 0000"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono"
              />
              <CreditCard className="absolute right-3 top-3 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300">Validade (MM/AA)</label>
              <input
                type="text"
                required
                maxLength={5}
                value={cardExpiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                  setCardExpiry(v);
                }}
                placeholder="12/28"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono text-center"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">CVV</label>
              <input
                type="text"
                required
                maxLength={4}
                value={cardCcv}
                onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, ""))}
                placeholder="123"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300">CPF ou CNPJ do Titular</label>
              <input
                type="text"
                required
                value={cardCpfCnpj}
                onChange={(e) => setCardCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">WhatsApp / Telefone</label>
              <input
                type="tel"
                required
                value={cardPhone}
                onChange={(e) => setCardPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-300">CEP de Cobrança</label>
              <input
                type="text"
                required
                value={cardPostalCode}
                onChange={(e) => setCardPostalCode(e.target.value)}
                placeholder="00000-000"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Nº Residência</label>
              <input
                type="text"
                required
                value={cardAddressNum}
                onChange={(e) => setCardAddressNum(e.target.value)}
                placeholder="123"
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-fuchsia-500 focus:outline-none text-center"
              />
            </div>
          </div>

          {cardError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {cardError}
            </div>
          )}

          <button
            type="submit"
            disabled={cardLoading}
            className="w-full justify-center text-sm font-bold py-3.5 inline-flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.01] bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-fuchsia-500/25 cursor-pointer disabled:opacity-50"
          >
            {cardLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pagar {planInfo.headlinePrice} & Ativar Acesso Pro
              </>
            )}
          </button>
        </form>
      )}

      {/* CONTEÚDO DA ABA 3: PIX DIRETO COM COMPROVANTE */}
      {paymentTab === "pix_direct" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              Transferência Pix Direta + Envio de Comprovante
            </h4>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Ativação Rápida
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Transfira o valor de <strong>{planInfo.subPrice}</strong> para a chave Pix oficial abaixo e envie o comprovante para liberação imediata da sua conta.
          </p>

          <div className="rounded-xl border border-white/10 bg-black/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Chave Pix Oficial ({config?.pixKeyType || "E-mail"})</span>
                <p className="text-sm font-mono font-bold text-emerald-300 select-all">
                  {config?.pixKey || "jaimilsonvendas@gmail.com"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyDirectPix}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
              >
                {directPixCopied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Chave Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Chave
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap justify-between text-xs text-zinc-400 gap-2">
              <div>
                <span className="text-zinc-500">Beneficiário:</span>{" "}
                <strong className="text-zinc-200">{config?.pixReceiverName || "EIA Digital Plataforma"}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Valor:</span>{" "}
                <strong className="text-emerald-400">{planInfo.headlinePrice}</strong>
              </div>
            </div>
          </div>

          <a
            href={whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Smartphone className="h-4 w-4" />
            Já paguei, enviar comprovante via WhatsApp
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>
        </div>
      )}

      {/* Opção secundária: Stripe Internacional */}
      <div className="pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowStripe(!showStripe)}
          className="text-xs text-zinc-400 hover:text-white underline cursor-pointer inline-flex items-center gap-1.5"
        >
          <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
          {showStripe
            ? "Ocultar opção Stripe Internacional"
            : "Prefere pagar via Stripe Internacional / Cartão Estrangeiro?"}
        </button>

        {showStripe && (
          <div className="mt-3 min-h-[380px] rounded-xl border border-white/10 bg-black/60 p-3">
            <StripeEmbeddedCheckout
              key={`${selectedPlan}-${currentUser.id}`}
              priceId={selectedPlan}
              onComplete={() => {
                window.location.assign("/checkout/return?completed=true");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

