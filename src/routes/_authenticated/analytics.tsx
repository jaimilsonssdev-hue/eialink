import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsService } from "@/modules/analytics/services/AnalyticsService";
import {
  Eye,
  MousePointerClick,
  MessageCircle,
  QrCode,
  Instagram,
  Smartphone,
  Monitor,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — EIA Digital" }, { name: "robots", content: "noindex" }],
  }),
  component: AnalyticsPage,
});

const EVENT_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  view: { label: "Visualização", icon: Eye, color: "var(--brand-cyan)" },
  link_click: { label: "Clique em link", icon: MousePointerClick, color: "var(--brand-violet)" },
  whatsapp_click: { label: "WhatsApp", icon: MessageCircle, color: "var(--brand-lime)" },
  pix_click: { label: "Pix", icon: QrCode, color: "var(--brand-amber)" },
  instagram_click: { label: "Instagram", icon: Instagram, color: "var(--brand-pink)" },
};

function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: AnalyticsService.getCurrentPageEvents,
  });

  if (!data)
    return <p className="text-muted-foreground">Crie sua bio para começar a coletar analytics.</p>;

  const total = data.events.length;
  const byType = data.events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});
  const bySource = data.events.reduce<Record<string, number>>((acc, e) => {
    const k = e.utm_source ?? "direto";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const byDevice = data.events.reduce<Record<string, number>>((acc, e) => {
    const k = e.device ?? "outro";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  // Last 7 days timeline
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      count: 0,
    });
  }
  data.events.forEach((e) => {
    const key = new Date(e.created_at).toISOString().slice(0, 10);
    const day = days.find((d) => d.key === key);
    if (day) day.count++;
  });
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  const conversionRate = byType.view
    ? Math.round((((byType.whatsapp_click ?? 0) + (byType.pix_click ?? 0)) / byType.view) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Acompanhe o desempenho da sua página em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Visualizações"
          value={byType.view ?? 0}
          icon={Eye}
          color="var(--brand-cyan)"
        />
        <StatCard
          label="Cliques em links"
          value={byType.link_click ?? 0}
          icon={MousePointerClick}
          color="var(--brand-violet)"
        />
        <StatCard
          label="Cliques WhatsApp"
          value={byType.whatsapp_click ?? 0}
          icon={MessageCircle}
          color="var(--brand-lime)"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          icon={QrCode}
          color="var(--brand-amber)"
          sub="Views → Contato"
        />
      </div>

      <div className="card-surface">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Últimos 7 dias</h3>
          <span className="text-xs text-muted-foreground">{total} eventos totais</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-2 h-40">
          {days.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-medium">{d.count > 0 ? d.count : ""}</div>
              <div
                className="w-full rounded-t-lg transition-all min-h-[4px]"
                style={{
                  height: `${(d.count / maxCount) * 100}%`,
                  background: "var(--gradient-primary)",
                  opacity: d.count === 0 ? 0.15 : 1,
                }}
              />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-surface">
          <h3 className="font-semibold mb-4">Tipos de evento</h3>
          <div className="space-y-3">
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => {
                const meta = EVENT_LABELS[k] ?? {
                  label: k,
                  icon: Eye,
                  color: "var(--muted-foreground)",
                };
                const Icon = meta.icon;
                const pct = Math.round((v / total) * 100);
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: meta.color }} /> {meta.label}
                      </span>
                      <span className="font-medium">{v}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            {total === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda não há dados. Compartilhe sua página.
              </p>
            )}
          </div>
        </div>

        <div className="card-surface">
          <h3 className="font-semibold mb-4">Dispositivos</h3>
          <div className="space-y-3">
            {Object.entries(byDevice)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => {
                const pct = Math.round((v / total) * 100);
                const Icon = k === "mobile" ? Smartphone : Monitor;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 capitalize">
                        <Icon className="h-4 w-4 text-[color:var(--brand-cyan)]" /> {k}
                      </span>
                      <span className="font-medium">
                        {v} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
                      />
                    </div>
                  </div>
                );
              })}
            {total === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
          </div>
        </div>
      </div>

      <div className="card-surface">
        <h3 className="font-semibold mb-3">Origem do tráfego (UTM Source)</h3>
        {Object.entries(bySource)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between py-2 border-b border-border last:border-0 text-sm"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        {total === 0 && <p className="text-sm text-muted-foreground">Ainda não há dados.</p>}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
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
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
