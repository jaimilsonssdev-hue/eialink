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
  Smartphone,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
} from "lucide-react";

import { TemplateMarketplace } from "@/components/templates/TemplateMarketplace";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { publicPageUrl } from "@/lib/public-page-url";
import { QuickBusinessEditor } from "@/components/dashboard/QuickBusinessEditor";
import { ProductCarouselManager } from "@/components/dashboard/ProductCarouselManager";

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
      link: "/builder",
    },
    {
      id: "carousel",
      title: "Criar Carrossel Instagram de Produtos",
      desc: "Fotos 4:5 reais dos seus produtos ou pratos com botão Zap.",
      done: carouselItemsCount > 0,
      link: "/builder?tab=carousel",
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
      title: "Gerar QR Code de Balcão / NFC",
      desc: "Imprima ou grave placas para atrair clientes da loja física.",
      done: false,
      link: "/admin/nfc",
    },
    {
      id: "share",
      title: "Colocar Link na Bio do Instagram",
      desc: "Receba as primeiras visitas e pedidos.",
      done: (stats?.views ?? 0) > 0,
      link: publicUrl || "/builder",
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
      <section className="premium-welcome">
        <div>
          <p className="eyebrow">Máquina de Vendas & Presença</p>
          <h1>
            Olá, {profile?.full_name?.split(" ")[0] ?? "empreendedor"}.<br />
            Sua presença merece <span>mais destaque.</span>
          </h1>
          <p>Seus produtos no estilo Instagram, agendamento 24h e integração de balcão com WhatsApp.</p>
          <div className="premium-welcome-actions flex-wrap gap-2.5">
            <Link to="/builder" className="premium-cta">
              <PanelsTopLeft className="h-4 w-4" /> Personalizar minha página
            </Link>
            <Link
              to="/builder"
              search={{ copilot: true }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
              title="Gerar proposta de site completa com briefing e fotos via IA Gateway"
            >
              <Sparkles className="h-4 w-4 text-purple-200 animate-pulse" />
              <span>Gerar Proposta com Fotos (IA Gateway)</span>
            </Link>
            {bio && (
              <a href={publicUrl} target="_blank" rel="noopener" className="premium-text-action">
                Ver página <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <div className="premium-phone-teaser" aria-hidden="true">
          <div className="premium-phone-island" />
          <div className="premium-phone-cover" />
          <div className="premium-phone-avatar">{(bio?.display_name ?? "E").slice(0, 1)}</div>
          <span className="premium-phone-line is-title" />
          <span className="premium-phone-line" />
          <span className="premium-phone-cta">Pedir no WhatsApp</span>
          <span className="premium-phone-link" />
          <span className="premium-phone-link" />
        </div>
      </section>

      {/* Checklist Interativo: Roteiro dos Primeiros 3 Minutos */}
      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-card to-background p-6 shadow-md backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              <Zap className="h-3.5 w-3.5 text-fuchsia-400" />
              <span>Roteiro de Ativação Rápida</span>
            </div>
            <h2 className="text-xl font-bold font-display text-foreground mt-1.5">
              Complete sua Máquina em 3 Minutos
            </h2>
            <p className="text-sm text-muted-foreground">
              Passos essenciais para colocar seus produtos na vitrine e receber pedidos no piloto automático.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Progresso</span>
              <p className="text-base font-extrabold text-violet-400">{progressPercent}% Concluído</p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 grid place-items-center font-bold text-xs text-foreground bg-surface-elevated">
              {completedSteps}/{onboardingSteps.length}
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Grade de Passos */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {onboardingSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                  : "border-border/80 bg-card hover:border-violet-500/50 hover:bg-violet-500/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="text-zinc-500">#{idx + 1}</span> {step.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                {step.isExternal ? (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Abrir Página <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Configurar <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaque do Radar de Prospecção (Exclusivo Admin / Super Admin) */}
      {isAdmin && (
        <section className="rounded-2xl border border-[color:var(--primary)]/30 bg-card p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <Globe2 className="h-3.5 w-3.5" />
              <span>Motor de Prospecção Ativo (Admin)</span>
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">Radar de Prospecção de Clientes</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Encontre empresas reais no Google Maps e Instagram sem site na sua cidade, crie páginas de demonstração com 1 clique e envie proposta no WhatsApp.
            </p>
          </div>
          <Link
            to="/admin/prospeccao"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Target className="h-4 w-4" /> Abrir Prospecção
          </Link>
        </section>
      )}

      {!bio && (
        <div
          className="card-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div>
            <h3 className="font-semibold text-lg">Você ainda não criou sua página.</h3>
            <p className="text-sm text-muted-foreground mt-1">Leva 1 minuto e já fica no ar.</p>
          </div>
          <Link to="/builder" className="btn-primary">
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
        <div className="premium-section-heading">
          <div>
            <p className="eyebrow">Arsenal de Conversão</p>
            <h2>Superpoderes da sua Conta</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/builder?tab=carousel"
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-fuchsia-500/50 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 grid place-items-center mb-3">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm flex items-center justify-between">
              Carrossel Instagram <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Vitrine com fotos 4:5 deslizáveis e botão de pedido direto no WhatsApp com valor e produto selecionado.
            </p>
          </Link>

          <Link
            to="/agenda"
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-violet-500/50 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 grid place-items-center mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm flex items-center justify-between">
              Agendamento 24/7 <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Integração direta com o Google Agenda. Seus clientes agendam serviços sem você precisar responder no manual.
            </p>
          </Link>

          <Link
            to="/admin/nfc"
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-3">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm flex items-center justify-between">
              Plaquinhas NFC & QR <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Aproxime o celular do cliente no balcão e capture avaliações no Google Meu Negócio ou novos pedidos.
            </p>
          </Link>

          <div className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-blue-500/50">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 grid place-items-center mb-3">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm">
              App PWA Instalável
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Sua página pode ser salva na tela inicial do celular de cada cliente com ícone e tela cheia, como um aplicativo nativo.
            </p>
          </div>
        </div>
      </section>

      <div className="premium-section-heading">
        <div>
          <p className="eyebrow">Panorama</p>
          <h2>O que acontece na sua página</h2>
        </div>
        <Link to="/analytics" className="premium-text-action">
          Ver resultados <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 premium-stats">
        <Stat
          icon={Eye}
          label="Visualizações"
          value={stats?.views ?? 0}
          color="var(--brand-cyan)"
        />
        <Stat
          icon={Link2}
          label="Cliques em links"
          value={stats?.clicks ?? 0}
          color="var(--brand-violet)"
        />
        <Stat
          icon={MessageCircle}
          label="Cliques WhatsApp"
          value={stats?.whatsapp ?? 0}
          color="var(--brand-lime)"
        />
        <div className="card-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Força da sua página</span>
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{
                background: `color-mix(in oklab, ${scoreColor} 20%, transparent)`,
                color: scoreColor,
              }}
            >
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold">
            {score}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, var(--brand-cyan), ${scoreColor})`,
              }}
            />
          </div>
          <div className="text-xs mt-2" style={{ color: scoreColor }}>
            {scoreLabel}
          </div>
          <p className="page-score-suggestion">{scoreSuggestion}</p>
          <details className="page-score-details">
            <summary>Como é calculado?</summary>
            <p>
              Considera configuração do perfil, publicação, contatos, links e os primeiros
              resultados da página.
            </p>
          </details>
        </div>
      </div>

      {bio && (
        <div className="premium-public-link flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {hasProfessionalSubdomain ? "Seu subdomínio profissional" : "Sua página pública"}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[color:var(--primary)] font-medium truncate">
              <span className="truncate">{publicUrl}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
              }}
              className="btn-secondary"
            >
              <Copy className="h-4 w-4" /> Copiar
            </button>
            <a href={publicUrl} target="_blank" rel="noopener" className="btn-primary">
              Abrir <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      <div className="premium-section-heading">
        <div>
          <p className="eyebrow">Comece por aqui</p>
          <h2>Deixe sua página pronta para vender</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 premium-quick-actions">
        <QuickCard
          icon={PanelsTopLeft}
          title="Minha Página"
          to="/builder"
          desc="Personalize capa, perfil, contato e links"
          color="var(--brand-pink)"
        />
        <QuickCard
          icon={BarChart3}
          title="Ver Analytics"
          to="/analytics"
          desc="Gráficos e origem do tráfego"
          color="var(--brand-pink)"
        />
        <QuickCard
          icon={Sparkles}
          title="Diagnóstico"
          to="/diagnostic"
          desc="Descubra seu score digital"
          color="var(--brand-amber)"
        />
        <QuickCard
          icon={TrendingUp}
          title="Centro de Crescimento"
          to="/growth"
          desc="Oportunidades para crescer"
          color="var(--brand-lime)"
        />
      </div>
      <TemplateMarketplace />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="card-glow">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
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
      className="card-surface hover:border-[color:var(--primary)] hover:-translate-y-0.5 transition-all block"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-lg"
        style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
