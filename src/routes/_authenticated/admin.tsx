import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Send, Download } from "lucide-react";

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
  const { data } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: reqs } = await supabase.from("service_requests").select("id");
      return { profiles: profiles ?? [], requests: reqs?.length ?? 0 };
    },
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
      </div>
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
