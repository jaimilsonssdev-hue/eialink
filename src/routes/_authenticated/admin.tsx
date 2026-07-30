import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Send, Download, CreditCard, ShieldCheck } from "lucide-react";
import { BillingService } from "@/modules/billing/services/BillingService";
import { toPlanLimits } from "@/modules/billing/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Super Admin — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["super-admin"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: reqs } = await supabase.from("service_requests").select("id");
      const [plans, subscriptions, services] = await Promise.all([
        BillingService.listPlans(),
        BillingService.listSubscriptions(),
        BillingService.listServices(),
      ]);
      return { profiles: profiles ?? [], requests: reqs?.length ?? 0, plans, subscriptions, services };
    },
  });

  const updateSubscription = useMutation({
    mutationFn: ({ userId, planId, status }: { userId: string; planId: string; status: string }) =>
      BillingService.updateSubscription(userId, { plan_id: planId, status, billing_interval: "monthly", current_period_end: null, notes: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });

  const total = data?.profiles.length ?? 0;
  const hot = data?.profiles.filter((p) => (p.lead_score ?? 0) >= 70).length ?? 0;

  function exportCSV() {
    if (!data) return;
    const header = ["nome","email","whatsapp","empresa","nicho","cidade","estado","score","objetivo","cadastro"];
    const rows = data.profiles.map((p) => [p.full_name, p.email, p.whatsapp, p.company_name, p.niche, p.city, p.state, p.lead_score, p.main_goal, p.created_at]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "leads-eia.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="mt-2 text-muted-foreground">Gestão de leads e solicitações.</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary"><Download className="h-4 w-4" /> Exportar CSV</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card icon={Users} label="Usuários" v={total} />
        <Card icon={TrendingUp} label="Leads Quentes" v={hot} />
        <Card icon={Send} label="Solicitações" v={data?.requests ?? 0} />
        <Card icon={CreditCard} label="Assinaturas ativas" v={data?.subscriptions.filter((item) => item.status === "active").length ?? 0} />
      </div>
      <section className="card-surface">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Planos da plataforma</p>
            <h2 className="mt-1 text-xl font-bold">Limites centralizados</h2>
          </div>
          <span className="text-sm text-muted-foreground">{data?.services.length ?? 0} serviços profissionais ativos</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {data?.plans.map((plan) => {
            const limits = toPlanLimits(plan.limits);
            return <article key={plan.id} className="rounded-xl border border-border bg-surface-elevated/30 p-4">
              <div className="flex items-center justify-between"><h3 className="font-bold">{plan.name}</h3><span className={plan.active ? "text-xs text-emerald-400" : "text-xs text-muted-foreground"}>{plan.active ? "Ativo" : "Inativo"}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-3 text-lg font-semibold">{plan.price_cents === 0 ? "Grátis" : `R$ ${(plan.price_cents / 100).toFixed(2).replace(".", ",")}/mês`}</p>
              <p className="mt-2 text-xs text-muted-foreground">{limits.bio_pages === -1 ? "BioLinks ilimitados" : `${limits.bio_pages} BioLink(s)`} · {limits.catalog_items === -1 ? "catálogo ilimitado" : `${limits.catalog_items} itens`}</p>
            </article>;
          })}
        </div>
      </section>
      <section className="card-surface overflow-x-auto">
        <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" /><div><h2 className="font-bold">Assinaturas</h2><p className="text-sm text-muted-foreground">Altere o plano ou status de cada conta. A validação é feita pelo banco.</p></div></div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><Th>Cliente</Th><Th>Plano</Th><Th>Status</Th><Th>Ação</Th></tr></thead>
          <tbody>{data?.profiles.map((profile) => {
            const subscription = data.subscriptions.find((item) => item.user_id === profile.id);
            return <tr key={profile.id} className="border-t border-border">
              <Td><div className="font-medium">{profile.full_name}</div><div className="text-xs text-muted-foreground">{profile.email}</div></Td>
              <Td><select className="input-base min-w-36 py-2" defaultValue={subscription?.plan_id} aria-label={`Plano de ${profile.full_name}`} onChange={(event) => updateSubscription.mutate({ userId: profile.id, planId: event.target.value, status: subscription?.status ?? "active" })}>{data.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></Td>
              <Td><select className="input-base min-w-28 py-2" defaultValue={subscription?.status ?? "active"} aria-label={`Status de ${profile.full_name}`} onChange={(event) => subscription && updateSubscription.mutate({ userId: profile.id, planId: subscription.plan_id, status: event.target.value })}><option value="active">Ativa</option><option value="trialing">Teste</option><option value="past_due">Pendente</option><option value="cancelled">Cancelada</option><option value="expired">Expirada</option></select></Td>
              <Td>{updateSubscription.isPending ? <span className="text-xs text-muted-foreground">Salvando…</span> : <span className="text-xs text-muted-foreground">Salva automaticamente</span>}</Td>
            </tr>;
          })}</tbody>
        </table>
        {updateSubscription.isError && <p className="mt-3 text-sm text-red-400">Não foi possível atualizar a assinatura. Confirme se a migration foi aplicada.</p>}
      </section>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr><Th>Nome</Th><Th>Empresa</Th><Th>WhatsApp</Th><Th>Nicho</Th><Th>Cidade/UF</Th><Th>Score</Th><Th>Cadastro</Th></tr>
          </thead>
          <tbody>
            {data?.profiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <Td>{p.full_name}</Td>
                <Td>{p.company_name}</Td>
                <Td>{p.whatsapp}</Td>
                <Td>{p.niche}</Td>
                <Td>{p.city}/{p.state}</Td>
                <Td><span className={`px-2 py-0.5 rounded-full text-xs ${(p.lead_score ?? 0) >= 70 ? "bg-[color:var(--success)]/20 text-[color:var(--success)]" : (p.lead_score ?? 0) >= 31 ? "bg-[color:var(--warning)]/20 text-[color:var(--warning)]" : "bg-surface-elevated text-muted-foreground"}`}>{p.lead_score}</span></Td>
                <Td>{new Date(p.created_at).toLocaleDateString("pt-BR")}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && <p className="text-sm text-muted-foreground p-4">Nenhum lead ainda.</p>}
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, v }: { icon: React.ElementType; label: string; v: number }) {
  return <div className="card-surface"><div className="flex justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-[color:var(--primary)]" /></div><div className="mt-3 text-3xl font-bold">{v}</div></div>;
}
const Th = ({ children }: { children: React.ReactNode }) => <th className="text-left px-3 py-2">{children}</th>;
const Td = ({ children }: { children: React.ReactNode }) => <td className="px-3 py-3">{children}</td>;
