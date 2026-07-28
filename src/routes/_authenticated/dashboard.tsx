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
} from "lucide-react";
import { TemplateMarketplace } from "@/components/templates/TemplateMarketplace";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EIA Digital" },
      { name: "description", content: "Painel de controle da sua presença digital." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
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
        .maybeSingle();
      return data;
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
      supabase.from("profiles").update({ lead_score: s }).eq("id", profile.id);
    }
  }, [profile, bio, linksCount, stats, requestsCount]);

  const score = profile?.lead_score ?? 5;
  const scoreLabel = score >= 70 ? "Lead Quente" : score >= 31 ? "Interessado" : "Novo Lead";
  const scoreColor =
    score >= 70 ? "var(--brand-lime)" : score >= 31 ? "var(--brand-amber)" : "var(--brand-cyan)";

  const publicUrl =
    bio && typeof window !== "undefined" ? `${window.location.origin}/p/${bio.slug}` : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Olá, {profile?.full_name?.split(" ")[0] ?? "empresário"} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">Aqui está o resumo da sua presença digital.</p>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <span className="text-xs text-muted-foreground">Lead Score</span>
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
        </div>
      </div>

      {bio && (
        <div className="card-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Sua página pública
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
            <a href={`/p/${bio.slug}`} target="_blank" rel="noopener" className="btn-primary">
              Abrir <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
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
