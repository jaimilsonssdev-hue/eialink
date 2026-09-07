import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  TrendingUp,
  Send,
  Download,
  CreditCard,
  ShieldCheck,
  Target,
  Briefcase,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { BillingService } from "@/modules/billing/services/BillingService";
import { toPlanLimits, type Plan, type ProfessionalService } from "@/modules/billing/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeadTemperatureBadge } from "@/components/prospecting/LeadTemperatureBadge";

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
        supabase.from("bio_pages").select("user_id, published, social_links"),
      ]);
      const [plans, subscriptions, services] = await Promise.all([
        BillingService.listPlans(),
        BillingService.listSubscriptions(),
        BillingService.listServices(),
      ]);
      const demoPagesCount = (pages ?? []).filter((p) => Boolean((p.social_links as any)?.is_demo)).length;
      return {
        profiles: profiles ?? [],
        pages: pages ?? [],
        demoPagesCount,
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
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Super Admin</h1>
            <Badge variant="outline" className="text-[11px] font-normal border-primary/40 bg-primary/10 text-primary">
              Controle Geral
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Gestão estratégica de leads, solicitações, limites e assinaturas da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/prospeccao"
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white px-3.5 py-2 text-xs font-medium shadow-sm transition-all"
          >
            <Target className="h-4 w-4" />
            <span>Radar de Prospecção</span>
          </Link>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-white px-3.5 py-2 text-xs font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Users}
          label="Usuários"
          value={total}
          description="Contas totais na base"
          colorClass="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Leads Quentes"
          value={hot}
          description="Score de qualificação ≥ 70"
          colorClass="text-emerald-400"
        />
        <StatCard
          icon={Send}
          label="Solicitações"
          value={data?.requests ?? 0}
          description="Demandas de serviços"
          colorClass="text-blue-400"
        />
        <StatCard
          icon={CreditCard}
          label="Assinaturas Ativas"
          value={data?.subscriptions.filter((item) => item.status === "active").length ?? 0}
          description="Contas com plano ativo"
          colorClass="text-amber-400"
        />
        <Link
          to="/admin/prospeccao"
          search={{ tab: "demos" } as any}
          className="group block"
        >
          <StatCard
            icon={Target}
            label="Demos de Clientes"
            value={data?.demoPagesCount ?? 0}
            description="Isoladas na prospecção →"
            colorClass="text-primary group-hover:text-purple-300 transition-colors"
          />
        </Link>
      </div>

      {/* Planos da Plataforma */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Planos da Plataforma
              </p>
              <CardTitle className="text-base font-semibold tracking-tight text-white mt-0.5">
                Limites e Modelos Comerciais
              </CardTitle>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">
              {data?.services.length ?? 0} serviços profissionais ativos
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
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
            <p className="mt-3 text-xs text-rose-400">
              {updatePlan.error instanceof Error
                ? updatePlan.error.message
                : "Não foi possível salvar o plano. Verifique a conexão e tente novamente."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtros de Oportunidades */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-white">
                Filtros de Oportunidades
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Encontre contas por plano, nicho, cidade ou data para abordagem assertiva.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <div className="grid gap-3 sm:grid-cols-5">
            <label className="text-xs text-muted-foreground">
              <span className="font-medium text-white/90">Plano</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
              <span className="font-medium text-white/90">Nicho</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
              <span className="font-medium text-white/90">Cidade</span>
              <input
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background/60 px-3 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="Ex.: Teixeira de Freitas"
              />
            </label>

            <label className="text-xs text-muted-foreground">
              <span className="font-medium text-white/90">Página</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                value={publicationFilter}
                onChange={(event) => setPublicationFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                <option value="published">Publicada</option>
                <option value="unpublished">Não publicada</option>
              </select>
            </label>

            <label className="text-xs text-muted-foreground">
              <span className="font-medium text-white/90">Cadastrado a partir de</span>
              <input
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background/60 px-3 text-xs text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                type="date"
                value={registeredAfter}
                onChange={(event) => setRegisteredAfter(event.target.value)}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Assinaturas */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-white">
                Assinaturas e Controle de Acesso
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Altere o plano ou status de cada conta. Atualizações são sincronizadas no banco.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Cliente</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Plano</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Status</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Sincronização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const subscription = data?.subscriptions.find((item) => item.user_id === profile.id);
                  return (
                    <TableRow key={profile.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-medium text-white tracking-tight text-sm">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          className="h-8 min-w-36 rounded-lg border border-border/60 bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
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
                      </TableCell>
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          className="h-8 min-w-28 rounded-lg border border-border/60 bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
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
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {updateSubscription.isPending ? (
                          <span className="text-primary animate-pulse">Salvando…</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" /> Salvo no banco
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {updateSubscription.isError && (
            <p className="p-4 text-xs text-rose-400">
              Não foi possível atualizar a assinatura. Confirme se a migration foi aplicada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Serviços Profissionais */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-white">
                Serviços Profissionais
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Ofertas exibidas na área de crescimento. Você pode ativar ou pausar quando quiser.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
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
        </CardContent>
      </Card>

      {/* Base de Leads CRM */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold tracking-tight text-white">
                Base de Usuários & Leads Cadastrados
              </CardTitle>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? "lead" : "leads"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Nome</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Empresa</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">WhatsApp</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Nicho</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Cidade/UF</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Score</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p) => (
                  <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <TableCell className="py-3.5 px-4 min-w-[180px]">
                      <p className="font-medium text-white tracking-tight text-sm">{p.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.email}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-sm text-white/90">
                      {p.company_name || "—"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {p.whatsapp || "—"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {p.niche ? (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs bg-muted/60 text-muted-foreground border border-border/40">
                          {p.niche}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {[p.city, p.state].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 whitespace-nowrap">
                      <LeadTemperatureBadge score={p.lead_score ?? 0} />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProfiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum lead encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  colorClass = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  description?: string;
  trend?: string;
  colorClass?: string;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/50 ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/80 flex items-center gap-1.5">
            {trend && <span className="font-medium text-primary">{trend}</span>}
            <span>{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
    <article className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          className="h-8 rounded-lg border border-border bg-background/60 px-3 text-xs font-semibold text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 transition-colors"
          value={name}
          aria-label="Nome do plano"
          onChange={(event) => setName(event.target.value)}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="rounded border-border text-primary focus:ring-primary/40"
          />
          <span>Ativo</span>
        </label>
      </div>
      <label className="block text-xs text-muted-foreground">
        <span className="font-medium text-white/90">Descrição na Landing Page</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-background/60 p-2.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors min-h-16 resize-none"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="block text-xs text-muted-foreground">
        <span className="font-medium text-white/90">Valor mensal (R$)</span>
        <input
          className="mt-1 w-full h-8 rounded-lg border border-border bg-background/60 px-3 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
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
      <p className="text-[11px] text-muted-foreground">
        Use <strong>-1</strong> para limites ilimitados.
      </p>
      <button
        type="button"
        className="w-full rounded-lg bg-primary hover:bg-primary/90 text-white px-3 py-2 text-xs font-medium shadow-sm transition-all disabled:opacity-50"
        disabled={saving}
        onClick={save}
      >
        {saving ? "Salvando…" : "Salvar Plano"}
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
    <label className="block text-xs text-muted-foreground">
      <span>{label}</span>
      <input
        className="mt-1 w-full h-8 rounded-lg border border-border bg-background/60 px-2.5 text-xs text-white focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
    <article className="rounded-xl border border-border bg-background/50 p-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{service.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{service.description}</p>
      </div>
      <button
        type="button"
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          service.active
            ? "border border-border bg-background/60 text-muted-foreground hover:text-white"
            : "bg-primary hover:bg-primary/90 text-white shadow-sm"
        }`}
        disabled={saving}
        onClick={() => onToggle(service.id, !service.active)}
      >
        {service.active ? "Pausar" : "Ativar"}
      </button>
    </article>
  );
}

