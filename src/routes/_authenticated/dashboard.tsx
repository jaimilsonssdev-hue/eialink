import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Link2, BarChart3, Sparkles, ExternalLink, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EIA Digital" }, { name: "description", content: "Painel de controle da sua presença digital." }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });
  const { data: bio } = useQuery({
    queryKey: ["bio-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("bio_pages").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });
  const { data: stats } = useQuery({
    queryKey: ["stats-me", bio?.id],
    enabled: !!bio?.id,
    queryFn: async () => {
      const { data } = await supabase.from("analytics_events").select("event_type").eq("bio_page_id", bio!.id);
      const rows = data ?? [];
      return {
        views: rows.filter((r) => r.event_type === "view").length,
        clicks: rows.filter((r) => r.event_type === "link_click").length,
        whatsapp: rows.filter((r) => r.event_type === "whatsapp_click").length,
      };
    },
  });

  const score = profile?.lead_score ?? 5;
  const scoreLabel = score >= 70 ? "Lead Quente" : score >= 31 ? "Interessado" : "Novo Lead";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Olá, {profile?.full_name?.split(" ")[0] ?? "empresário"} 👋</h1>
        <p className="mt-2 text-muted-foreground">Aqui está o resumo da sua presença digital.</p>
      </div>

      {!bio && (
        <div className="card-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "var(--gradient-hero)" }}>
          <div>
            <h3 className="font-semibold">Você ainda não criou sua página.</h3>
            <p className="text-sm text-muted-foreground mt-1">Leva 1 minuto e já fica no ar.</p>
          </div>
          <Link to="/bio" className="btn-primary">Criar minha bio</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BarChart3} label="Visualizações" value={stats?.views ?? 0} />
        <Stat icon={Link2} label="Cliques em links" value={stats?.clicks ?? 0} />
        <Stat icon={TrendingUp} label="Cliques WhatsApp" value={stats?.whatsapp ?? 0} />
        <Stat icon={Sparkles} label={scoreLabel} value={score} sub="Lead Score" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickCard icon={User} title="Editar Bio" to="/bio" desc="Foto, descrição, WhatsApp, Pix" />
        <QuickCard icon={Link2} title="Gerenciar Links" to="/links" desc="Adicione ou reordene seus links" />
        <QuickCard icon={Sparkles} title="Centro de Crescimento" to="/growth" desc="Oportunidades para o seu negócio" />
      </div>

      {bio && (
        <div className="card-surface">
          <h3 className="font-semibold">Sua página pública</h3>
          <p className="text-sm text-muted-foreground mt-1">Compartilhe este link com seus clientes:</p>
          <a href={`/p/${bio.slug}`} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-2 text-[color:var(--primary)] font-medium">
            {typeof window !== "undefined" ? window.location.origin : ""}/p/{bio.slug} <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub?: string }) {
  return (
    <div className="card-surface">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{sub ?? label}</span>
        <Icon className="h-4 w-4 text-[color:var(--primary)]" />
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{label}</div>}
    </div>
  );
}

function QuickCard({ icon: Icon, title, to, desc }: { icon: React.ElementType; title: string; to: string; desc: string }) {
  return (
    <Link to={to} className="card-surface hover:border-[color:var(--primary)] transition-colors block">
      <Icon className="h-5 w-5 text-[color:var(--primary)]" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
