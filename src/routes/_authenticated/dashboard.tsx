import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Link2,
  BarChart3,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Copy,
  Eye,
  MessageCircle,
  PanelsTopLeft,
  Target,
  Globe2,
  Flame,
  Calendar,
  Radio,
  Gift,
  Smartphone,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  BookOpen,
  Download,
} from "lucide-react";

import { TemplateMarketplace } from "@/components/templates/TemplateMarketplace";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { publicPageUrl } from "@/lib/public-page-url";
import { QuickBusinessEditor } from "@/components/dashboard/QuickBusinessEditor";
import { ProductCarouselManager } from "@/components/dashboard/ProductCarouselManager";
import { CrossTrafficManager } from "@/components/dashboard/CrossTrafficManager";
import { CashbackSettingsCard } from "@/components/dashboard/CashbackSettingsCard";
import { CounterValidationCard } from "@/components/dashboard/CounterValidationCard";
import { RetentionGuardianCard } from "@/components/dashboard/RetentionGuardianCard";
import { FlashDealModal } from "@/components/dashboard/FlashDealModal";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EIA Digital" },
      { name: "description", content: "Painel de controle da sua máquina de presença e vendas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const access = usePlanAccess();
  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });
  const { data: bio } = useQuery({
    queryKey: ["bio-me"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("bio_pages")
        .select("*")
        .eq("user_id", u.user.id)
        .order("updated_at", { ascending: false });
      // Exclui páginas de demonstração de clientes para manter o painel limpo
      const realPages = (data ?? []).filter((p) => !(p.social_links as any)?.is_demo);
      return realPages[0] ?? null;
    },
  });
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-dashboard"],
    staleTime: 120_000,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      if (u.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com") return true;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      return !!roles?.some((r) => r.role === "admin");
    },
  });

  const { data: linksCount } = useQuery({
    queryKey: ["links-count", bio?.id],
    enabled: !!bio?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("bio_links")
        .select("*", { count: "exact", head: true })
        .eq("bio_page_id", bio!.id);
      return count ?? 0;
    },
  });
  const { data: stats } = useQuery({
    queryKey: ["stats-me", bio?.id],
    enabled: !!bio?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_events")
        .select("event_type")
        .eq("bio_page_id", bio!.id);
      const rows = data ?? [];
      return {
        views: rows.filter((r) => r.event_type === "view").length,
        clicks: rows.filter((r) => r.event_type === "link_click").length,
        whatsapp: rows.filter((r) => r.event_type === "whatsapp_click").length,
      };
    },
  });
  const { data: requestsCount } = useQuery({
    queryKey: ["requests-count"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { count } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.user!.id);
      return count ?? 0;
    },
  });

  // Recompute lead score client-side (Fase 2)
  useEffect(() => {
    if (!profile || stats === undefined) return;
    let s = 5;
    if (profile.niche) s += 5;
    if (profile.city && profile.state) s += 5;
    if (profile.main_goal) s += 5;
    if (bio?.published) s += 15;
    if (bio?.whatsapp) s += 10;
    if (bio?.pix_key) s += 10;
    if (bio?.instagram) s += 5;
    if ((linksCount ?? 0) > 0) s += 10;
    if ((stats?.views ?? 0) > 0) s += 10;
    if ((stats?.views ?? 0) > 20) s += 5;
    if ((stats?.whatsapp ?? 0) > 0) s += 10;
    if ((requestsCount ?? 0) > 0) s += 10;
    s = Math.min(100, s);
    if (s !== profile.lead_score) {
      void supabase
        .from("profiles")
        .update({ lead_score: s })
        .eq("id", profile.id)
        .then(() => {});
    }
  }, [profile, bio, linksCount, stats, requestsCount]);

  const score = profile?.lead_score ?? 5;
  const scoreLabel = score >= 70 ? "Página forte" : score >= 31 ? "Bom progresso" : "Começando";
  const scoreColor =
    score >= 70 ? "var(--brand-lime)" : score >= 31 ? "var(--brand-amber)" : "var(--brand-cyan)";

  const hasProfessionalSubdomain = Boolean(
    access.data?.isPro && access.data.features.custom_domain,
  );
  const publicUrl = bio ? publicPageUrl(bio.slug, hasProfessionalSubdomain) : "";

  // Diagnóstico dos 5 passos essenciais da Máquina
  const carouselItemsCount = ((bio?.social_links as any)?.product_carousel as any[])?.length ?? 0;
  const onboardingSteps = [
    {
      id: "profile",
      title: "Configurar Nome & WhatsApp",
      desc: "Garante que o cliente fale direto com você.",
      done: Boolean(bio?.display_name?.trim()) && (bio?.whatsapp?.replace(/\D/g, "").length ?? 0) >= 10,
      link: "/studio-pro",
    },
    {
      id: "carousel",
      title: "Criar Carrossel Instagram de Produtos",
      desc: "Fotos 4:5 reais dos seus produtos ou pratos com botão Zap.",
      done: carouselItemsCount > 0,
      link: "/studio-pro",
    },
    {
      id: "agenda",
      title: "Configurar Agendamento 24/7",
      desc: "Sincronize com sua Google Agenda e receba clientes no piloto automático.",
      done: false, // Guia para a rota /agenda
      link: "/agenda",
    },
    {
      id: "nfc",
      title: isAdmin ? "Central de Placas & Gravação NFC" : "Fidelidade, Cupons & Balcão",
      desc: isAdmin
        ? "Imprima ou grave placas para atrair clientes da loja física."
        : "Ative seu programa de fidelidade, gere cupons de desconto e acumule pontos por WhatsApp.",
      done: false,
      link: isAdmin ? "/admin/nfc" : "/fidelidade",
    },
    {
      id: "share",
      title: "Colocar Link na Bio do Instagram",
      desc: "Receba as primeiras visitas e pedidos.",
      done: (stats?.views ?? 0) > 0,
      link: publicUrl || "/studio-pro",
      isExternal: Boolean(publicUrl),
    },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / onboardingSteps.length) * 100);

  const scoreSuggestion = !bio?.published
    ? "Publique sua página para avançar."
    : !bio?.whatsapp
      ? "Configure seu WhatsApp para facilitar contatos."
      : (linksCount ?? 0) === 0
        ? "Adicione seu primeiro link ou botão."
        : (stats?.views ?? 0) === 0
          ? "Compartilhe sua página para receber as primeiras visitas."
          : (stats?.whatsapp ?? 0) === 0
            ? "Destaque seu WhatsApp para gerar conversas."
            : "Continue compartilhando para aumentar seus resultados.";

  return (
    <div className="space-y-8 premium-dashboard">
      {/* Lendora Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            Máquina de Vendas & Presença
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-display leading-tight">
            Olá, {profile?.full_name?.split(" ")[0] ?? "empreendedor"}.<br />
            Sua presença merece <span className="text-zinc-200 underline decoration-emerald-400/40 decoration-2 underline-offset-4">mais destaque.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Crie sites modernos, receba agendamentos no Google Agenda e converta visitas em mensagens de WhatsApp.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/studio-pro"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="h-4 w-4" /> Criar no Estúdio Criativo (Gemini)
            </Link>
            {bio && (
              <FlashDealModal
                bioPageId={bio.id}
                businessName={bio.display_name}
                city={profile?.city || undefined}
                niche={profile?.niche || undefined}
                triggerButton={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/10 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    <Zap className="h-4 w-4 fill-zinc-950 text-zinc-950" />
                    <span>⚡ Publicar Oferta</span>
                  </button>
                }
              />
            )}
            {bio && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Ver página pública <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Checklist Interativo: Roteiro dos Primeiros 3 Minutos */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              <span>Roteiro de Ativação Rápida</span>
            </div>
            <h2 className="text-xl font-bold font-display text-white mt-1.5">
              Complete sua Máquina em 3 Minutos
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Passos essenciais para colocar seus produtos na vitrine e receber pedidos no piloto automático.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Progresso</span>
              <p className="text-base font-bold text-white tabular-nums">{progressPercent}% Concluído</p>
            </div>
            <div className="h-10 w-10 rounded-xl border border-white/[0.08] grid place-items-center font-bold text-xs text-white bg-zinc-800/80">
              {completedSteps}/{onboardingSteps.length}
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-amber-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Grade de Passos */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {onboardingSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/[0.04] text-zinc-400"
                  : "border-white/[0.06] bg-zinc-900/60 hover:border-white/[0.12] hover:bg-zinc-900/90"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-zinc-500">#{idx + 1}</span> {step.title}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex justify-end">
                {step.isExternal ? (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    Abrir Página <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    Configurar <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaque do Radar de Prospecção e Playbook de Vendas (Exclusivo Admin / Super Admin) */}
      {isAdmin && (
        <section className="grid gap-4 md:grid-cols-2">
          {/* Card 1: Radar de Prospecção */}
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <Globe2 className="h-3.5 w-3.5" />
                <span>Motor de Prospecção Ativo</span>
              </div>
              <h2 className="text-xl font-bold font-display text-white">Radar de Prospecção</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Encontre empresas reais no Google Maps e Instagram sem site na sua cidade, crie páginas de demonstração com 1 clique e aborde com taxa recorde de resposta.
              </p>
            </div>
            <Link
              to="/admin/prospeccao"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-100 shadow transition-all w-full sm:w-auto self-start"
            >
              <Target className="h-4 w-4" /> Abrir Radar de Prospecção
            </Link>
          </div>

          {/* Card 2: Playbook Comercial & Gestão de Vendas */}
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Estratégia & Fechamento</span>
              </div>
              <h2 className="text-xl font-bold font-display text-white">Playbook Comercial (PDF)</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Roteiro completo dos primeiros 5 clientes em 7 dias, scripts de WhatsApp prontos para copiar/colar, quebra de objeções e simulador de faturamento.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/admin/vendas"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition-all"
              >
                <BookOpen className="h-4 w-4" /> Acessar Playbook Online
              </Link>
              <a
                href="/Playbook_Comercial_EiaLink.pdf"
                download="Playbook_Comercial_EiaLink.pdf"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs px-3.5 py-2.5 transition-colors"
                title="Baixar arquivo PDF diagramado do Playbook Comercial"
              >
                <Download className="h-3.5 w-3.5" /> Baixar PDF
              </a>
            </div>
          </div>
        </section>
      )}

      {!bio && (
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-semibold text-lg text-white">Você ainda não criou sua página.</h3>
            <p className="text-sm text-zinc-400 mt-1">Leva 1 minuto e já fica no ar.</p>
          </div>
          <Link to="/studio" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-sm shadow-sm transition-all">
            Criar minha página
          </Link>
        </div>
      )}

      {bio && (
        <div className="space-y-6">
          <QuickBusinessEditor bio={bio} publicUrl={publicUrl} />
          <ProductCarouselManager bio={bio} />
        </div>
      )}

      {/* Superpoderes da sua Máquina */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Arsenal de Conversão</p>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display mt-0.5">Superpoderes da sua Conta</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/studio"
            className="group rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 grid place-items-center mb-3">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              Carrossel Instagram <ArrowRight className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Vitrine com fotos 4:5 deslizáveis e botão de pedido direto no WhatsApp com valor e produto selecionado.
            </p>
          </Link>

          <Link
            to="/agenda"
            className="group rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 grid place-items-center mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              Agendamento 24/7 <ArrowRight className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Integração direta com o Google Agenda. Seus clientes agendam serviços sem você precisar responder no manual.
            </p>
          </Link>

          {isAdmin ? (
            <Link
              to="/admin/nfc"
              className="group rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center mb-3">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-sm flex items-center justify-between">
                Plaquinhas NFC & QR <ArrowRight className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Aproxime o celular do cliente no balcão e capture avaliações no Google Meu Negócio ou novos pedidos.
              </p>
            </Link>
          ) : (
            <Link
              to="/fidelidade"
              className="group rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 grid place-items-center mb-3">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-sm flex items-center justify-between">
                Fidelidade & Cupons <ArrowRight className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Recompense clientes frequentes, configure prêmios, gere cupons de desconto e aumente o retorno na sua loja.
              </p>
            </Link>
          )}

          <div className="group rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 grid place-items-center mb-3">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">
              App PWA Instalável
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Sua página pode ser salva na tela inicial do celular de cada cliente com ícone e tela cheia, como um aplicativo nativo.
            </p>
          </div>
        </div>
      </section>

      {/* Panorama Métricas (Lendora CRM Bento Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Panorama Operacional</p>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display mt-0.5">O que acontece na sua página</h2>
          </div>
          <Link to="/analytics" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
            Ver métricas detalhadas <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Eye}
            label="Visualizações"
            value={stats?.views ?? 0}
            color="#38bdf8"
            trend="Ao vivo"
          />
          <Stat
            icon={Link2}
            label="Cliques em links"
            value={stats?.clicks ?? 0}
            color="#a78bfa"
          />
          <Stat
            icon={MessageCircle}
            label="Cliques WhatsApp"
            value={stats?.whatsapp ?? 0}
            color="#34d399"
            trend="Alta conv."
          />

          {/* Força da página card */}
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Força da sua página</span>
                <span
                  className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.06] bg-zinc-800/80"
                  style={{ color: scoreColor }}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-white tabular-nums">{score}</span>
                <span className="text-xs text-zinc-500 font-medium">/100</span>
                <span className="ml-auto text-xs font-semibold" style={{ color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    background: `linear-gradient(90deg, #38bdf8, ${scoreColor})`,
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3 pt-2.5 border-t border-white/[0.06]">{scoreSuggestion}</p>
          </div>
        </div>
      </div>

      {bio && (
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              {hasProfessionalSubdomain ? "Seu subdomínio profissional" : "Sua página pública"}
            </div>
            <div className="mt-1 flex items-center gap-2 text-white font-medium text-sm truncate">
              <span className="truncate text-zinc-200">{publicUrl}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-semibold transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar link
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold transition-colors"
            >
              Abrir <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Acesso Rápido</p>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display mt-0.5">Gerenciamento da sua Presença</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickCard
            icon={Sparkles}
            title="Estúdio Criativo"
            to="/studio-pro"
            desc="Crie e refine sites modernos com IA no padrão Lovable"
            color="#34d399"
          />
          <QuickCard
            icon={PanelsTopLeft}
            title="Minha Página"
            to="/pages"
            desc="Gerencie suas páginas criadas e links públicos"
            color="#38bdf8"
          />
          <QuickCard
            icon={BarChart3}
            title="Métricas & Vendas"
            to="/analytics"
            desc="Acompanhe visualizações e cliques no WhatsApp"
            color="#a78bfa"
          />
          <QuickCard
            icon={Calendar}
            title="Agendamento"
            to="/agenda"
            desc="Configure horários e sincronize com o Google Agenda"
            color="#f59e0b"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.14] hover:bg-zinc-900/70 group shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-zinc-800/80 transition-transform group-hover:scale-105"
          style={{ color }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-3xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  to,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  to: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md transition-all hover:border-white/[0.16] hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm block"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-zinc-800/80 transition-transform group-hover:scale-105"
        style={{ color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3.5 font-bold text-sm text-zinc-100 flex items-center justify-between">
        {title}
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </h3>
      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{desc}</p>
    </Link>
  );
}
