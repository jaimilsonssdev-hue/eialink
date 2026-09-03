import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Send, Download, CreditCard, ShieldCheck, Target } from "lucide-react";
import { BillingService } from "@/modules/billing/services/BillingService";
import { toPlanLimits, type Plan, type ProfessionalService } from "@/modules/billing/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Super Admin — EIA Digital" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const isOwner = u.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
    if (isOwner) return;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});


function AdminPage() {
  const queryClient = useQueryClient();
  const [planFilter, setPlanFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("all");
  const [registeredAfter, setRegisteredAfter] = useState("");
  const { data } = useQuery({
    queryKey: ["super-admin"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      const [{ data: reqs }, { data: pages }] = await Promise.all([
        supabase.from("service_requests").select("id"),
        supabase.from("bio_pages").select("user_id, published"),
      ]);
      const [plans, subscriptions, services] = await Promise.all([
        BillingService.listPlans(),
        BillingService.listSubscriptions(),
        BillingService.listServices(),
      ]);
      return {
        profiles: profiles ?? [],
        pages: pages ?? [],
        requests: reqs?.length ?? 0,
        plans,
        subscriptions,
        services,
      };
    },
  });

  const updateSubscription = useMutation({
    mutationFn: ({ userId, planId, status }: { userId: string; planId: string; status: string }) =>
      BillingService.updateSubscription(userId, {
        plan_id: planId,
        status,
        billing_interval: "monthly",
        current_period_end: null,
        notes: null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });
  const updatePlan = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof BillingService.updatePlan>[1];
    }) => BillingService.updatePlan(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });
  const updateService = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof BillingService.updateService>[1];
    }) => BillingService.updateService(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });

  const total = data?.profiles.length ?? 0;
  const hot = data?.profiles.filter((p) => (p.lead_score ?? 0) >= 70).length ?? 0;
  const filteredProfiles = useMemo(() => {
    if (!data) return [];
    return data.profiles.filter((profile) => {
      const subscription = data.subscriptions.find((item) => item.user_id === profile.id);
      const plan = data.plans.find((item) => item.id === subscription?.plan_id);
      const hasPublishedPage = data.pages.some(
        (page) => page.user_id === profile.id && page.published,
      );
      const registrationMatches =
        !registeredAfter || new Date(profile.created_at) >= new Date(registeredAfter);
      return (
        (planFilter === "all" || plan?.slug === planFilter) &&
        (nicheFilter === "all" || profile.niche === nicheFilter) &&
        (!cityFilter || (profile.city ?? "").toLowerCase().includes(cityFilter.toLowerCase())) &&
        (publicationFilter === "all" || (publicationFilter === "published") === hasPublishedPage) &&
        registrationMatches
      );
    });
  }, [cityFilter, data, nicheFilter, planFilter, publicationFilter, registeredAfter]);

  function exportCSV() {
    if (!data) return;
    const header = [
      "nome",
      "email",
      "whatsapp",
      "empresa",
      "nicho",
      "cidade",
      "estado",
      "score",
      "objetivo",
      "cadastro",
    ];
    const rows = filteredProfiles.map((p) => [
      p.full_name,
      p.email,
      p.whatsapp,
      p.company_name,
      p.niche,
      p.city,
      p.state,
      p.lead_score,
      p.main_goal,
      p.created_at,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-eia.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="mt-2 text-muted-foreground">Gestão de leads e solicitações.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/prospeccao"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Target className="h-4 w-4" /> Radar de Prospecção
          </Link>
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card icon={Users} label="Usuários" v={total} />
        <Card icon={TrendingUp} label="Leads Quentes" v={hot} />
        <Card icon={Send} label="Solicitações" v={data?.requests ?? 0} />
        <Card
          icon={CreditCard}
          label="Assinaturas ativas"
          v={data?.subscriptions.filter((item) => item.status === "active").length ?? 0}
        />
      </div>
      <section className="card-surface">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Planos da plataforma
            </p>
            <h2 className="mt-1 text-xl font-bold">Limites centralizados</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {data?.services.length ?? 0} serviços profissionais ativos
          </span>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {data?.plans.map((plan) => (
            <PlanEditor
              key={plan.id}
              plan={plan}
              saving={updatePlan.isPending}
              onSave={(id, input) => updatePlan.mutate({ id, input })}
            />
          ))}
        </div>
        {updatePlan.isError && (
          <p className="mt-3 text-sm text-red-400">
            {updatePlan.error instanceof Error
              ? updatePlan.error.message
              : "Não foi possível salvar o plano. Verifique a conexão e tente novamente."}
          </p>
        )}
      </section>
      <section className="card-surface">
        <div className="mb-4">
          <h2 className="font-bold">Filtros de oportunidades</h2>
          <p className="text-sm text-muted-foreground">
            Encontre contas pelo plano, nicho e cidade para um atendimento mais útil.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          <label className="text-xs text-muted-foreground">
            Plano
            <select
              className="input-base mt-1"
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
            >
              <option value="all">Todos os planos</option>
              {data?.plans.map((plan) => (
                <option key={plan.id} value={plan.slug}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Nicho
            <select
              className="input-base mt-1"
              value={nicheFilter}
              onChange={(event) => setNicheFilter(event.target.value)}
            >
              <option value="all">Todos os nichos</option>
              {[...new Set(data?.profiles.map((profile) => profile.niche).filter(Boolean))].map(
                (niche) => (
                  <option key={niche} value={niche ?? ""}>
                    {niche}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Cidade
            <input
              className="input-base mt-1"
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              placeholder="Ex.: Teixeira de Freitas"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Página
            <select
              className="input-base mt-1"
              value={publicationFilter}
              onChange={(event) => setPublicationFilter(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="published">Publicada</option>
              <option value="unpublished">Não publicada</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Cadastrado a partir de
            <input
              className="input-base mt-1"
              type="date"
              value={registeredAfter}
              onChange={(event) => setRegisteredAfter(event.target.value)}
            />
          </label>
        </div>
      </section>
      <section className="card-surface overflow-x-auto">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
          <div>
            <h2 className="font-bold">Assinaturas</h2>
            <p className="text-sm text-muted-foreground">
              Altere o plano ou status de cada conta. A validação é feita pelo banco.
            </p>
          </div>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <Th>Cliente</Th>
              <Th>Plano</Th>
              <Th>Status</Th>
              <Th>Ação</Th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => {
              const subscription = data?.subscriptions.find((item) => item.user_id === profile.id);
              return (
                <tr key={profile.id} className="border-t border-border">
                  <Td>
                    <div className="font-medium">{profile.full_name}</div>
                    <div className="text-xs text-muted-foreground">{profile.email}</div>
                  </Td>
                  <Td>
                    <select
                      className="input-base min-w-36 py-2"
                      defaultValue={subscription?.plan_id}
                      aria-label={`Plano de ${profile.full_name}`}
                      onChange={(event) =>
                        updateSubscription.mutate({
                          userId: profile.id,
                          planId: event.target.value,
                          status: subscription?.status ?? "active",
                        })
                      }
                    >
                      {data?.plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <select
                      className="input-base min-w-28 py-2"
                      defaultValue={subscription?.status ?? "active"}
                      aria-label={`Status de ${profile.full_name}`}
                      onChange={(event) =>
                        subscription &&
                        updateSubscription.mutate({
                          userId: profile.id,
                          planId: subscription.plan_id,
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="active">Ativa</option>
                      <option value="trialing">Teste</option>
                      <option value="past_due">Pendente</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="expired">Expirada</option>
                    </select>
                  </Td>
                  <Td>
                    {updateSubscription.isPending ? (
                      <span className="text-xs text-muted-foreground">Salvando…</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Salva automaticamente</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {updateSubscription.isError && (
          <p className="mt-3 text-sm text-red-400">
            Não foi possível atualizar a assinatura. Confirme se a migration foi aplicada.
          </p>
        )}
      </section>
      <section className="card-surface">
        <div className="mb-4">
          <h2 className="font-bold">Serviços profissionais</h2>
          <p className="text-sm text-muted-foreground">
            Ofertas exibidas na área de crescimento. Você pode ativar ou pausar quando quiser.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data?.services.map((service) => (
            <ServiceAdminCard
              key={service.id}
              service={service}
              saving={updateService.isPending}
              onToggle={(id, active) => updateService.mutate({ id, input: { active } })}
            />
          ))}
        </div>
      </section>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr>
              <Th>Nome</Th>
              <Th>Empresa</Th>
              <Th>WhatsApp</Th>
              <Th>Nicho</Th>
              <Th>Cidade/UF</Th>
              <Th>Score</Th>
              <Th>Cadastro</Th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <Td>{p.full_name}</Td>
                <Td>{p.company_name}</Td>
                <Td>{p.whatsapp}</Td>
                <Td>{p.niche}</Td>
                <Td>
                  {p.city}/{p.state}
                </Td>
                <Td>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${(p.lead_score ?? 0) >= 70 ? "bg-[color:var(--success)]/20 text-[color:var(--success)]" : (p.lead_score ?? 0) >= 31 ? "bg-[color:var(--warning)]/20 text-[color:var(--warning)]" : "bg-surface-elevated text-muted-foreground"}`}
                  >
                    {p.lead_score}
                  </span>
                </Td>
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
  return (
    <div className="card-surface">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-[color:var(--primary)]" />
      </div>
      <div className="mt-3 text-3xl font-bold">{v}</div>
    </div>
  );
}
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-3 py-2">{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-3 py-3">{children}</td>
);

function PlanEditor({
  plan,
  saving,
  onSave,
}: {
  plan: Plan;
  saving: boolean;
  onSave: (id: string, input: Parameters<typeof BillingService.updatePlan>[1]) => void;
}) {
  const baseLimits = toPlanLimits(plan.limits);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [price, setPrice] = useState(String(plan.price_cents / 100));
  const [active, setActive] = useState(plan.active);
  const [limits, setLimits] = useState(baseLimits);
  const priceCents = Math.max(0, Math.round(Number(price.replace(",", ".")) * 100) || 0);
  const save = () =>
    onSave(plan.id, {
      name: name.trim() || plan.name,
      description: description.trim() || null,
      price_cents: priceCents,
      active,
      limits,
    });
  return (
    <article className="rounded-2xl border border-border bg-surface-elevated/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          className="input-base font-semibold"
          value={name}
          aria-label="Nome do plano"
          onChange={(event) => setName(event.target.value)}
        />
        <label className="flex shrink-0 items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />{" "}
          Ativo
        </label>
      </div>
      <label className="block text-xs text-muted-foreground">
        Descrição exibida na landing page
        <textarea
          className="input-base mt-1 min-h-20"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="block text-xs text-muted-foreground">
        Valor mensal (R$)
        <input
          className="input-base mt-1"
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        Este valor aparece nas telas comerciais. A ativação do Pro é feita manualmente pelo Super
        Admin.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <LimitField
          label="BioLinks"
          value={limits.bio_pages}
          onChange={(value) => setLimits({ ...limits, bio_pages: value })}
        />
        <LimitField
          label="Links"
          value={limits.links}
          onChange={(value) => setLimits({ ...limits, links: value })}
        />
        <LimitField
          label="Itens"
          value={limits.catalog_items}
          onChange={(value) => setLimits({ ...limits, catalog_items: value })}
        />
        <LimitField
          label="Templates"
          value={limits.templates}
          onChange={(value) => setLimits({ ...limits, templates: value })}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Use <strong>-1</strong> para ilimitado.
      </p>
      <button type="button" className="btn-primary mt-4 w-full" disabled={saving} onClick={save}>
        {saving ? "Salvando…" : "Salvar plano"}
      </button>
    </article>
  );
}

function LimitField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        className="input-base mt-1"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ServiceAdminCard({
  service,
  saving,
  onToggle,
}: {
  service: ProfessionalService;
  saving: boolean;
  onToggle: (id: string, active: boolean) => void;
}) {
  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{service.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
        </div>
        <button
          type="button"
          className={service.active ? "btn-secondary shrink-0" : "btn-primary shrink-0"}
          disabled={saving}
          onClick={() => onToggle(service.id, !service.active)}
        >
          {service.active ? "Pausar" : "Ativar"}
        </button>
      </div>
    </article>
  );
}
