import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: bio } = await supabase.from("bio_pages").select("*").eq("user_id", u.user!.id).maybeSingle();
      if (!bio) return null;
      const { data: events } = await supabase.from("analytics_events").select("*").eq("bio_page_id", bio.id).order("created_at", { ascending: false }).limit(200);
      return { bio, events: events ?? [] };
    },
  });

  if (!data) return <p className="text-muted-foreground">Crie sua bio para começar a coletar analytics.</p>;

  const total = data.events.length;
  const byType = data.events.reduce<Record<string, number>>((acc, e) => { acc[e.event_type] = (acc[e.event_type] ?? 0) + 1; return acc; }, {});
  const bySource = data.events.reduce<Record<string, number>>((acc, e) => { const k = e.utm_source ?? "direto"; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">Últimos 200 eventos da sua página.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Total eventos" v={total} />
        <Card label="Visualizações" v={byType.view ?? 0} />
        <Card label="Cliques WhatsApp" v={byType.whatsapp_click ?? 0} />
      </div>
      <div className="card-surface">
        <h3 className="font-semibold mb-3">Origem do tráfego (UTM Source)</h3>
        {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
            <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
          </div>
        ))}
        {total === 0 && <p className="text-sm text-muted-foreground">Ainda não há dados. Compartilhe sua página para começar.</p>}
      </div>
      <div className="card-surface">
        <h3 className="font-semibold mb-3">Eventos recentes</h3>
        <div className="space-y-1">
          {data.events.slice(0, 20).map((e) => (
            <div key={e.id} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
              <span>{e.event_type}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, v }: { label: string; v: number }) {
  return <div className="card-surface"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-3xl font-bold">{v}</div></div>;
}
