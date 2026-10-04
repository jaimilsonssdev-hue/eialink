import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
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
  MessageCircle,
  ExternalLink,
  Save,
  Phone,
  Sliders,
  Radio,
  Utensils,
  CalendarDays,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Zap,
  Plus,
  Trash2,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { BillingService } from "@/modules/billing/services/BillingService";
import {
  CommercialSettingsService,
  formatPhoneDisplay,
  sanitizePhoneDigits,
} from "@/modules/settings/services/CommercialSettingsService";
import {
  savePaymentGatewaySettingsFn,
  getAdminPaymentSettingsFn,
} from "@/utils/asaas.functions";
import type { AsaasEnvironment } from "@/modules/billing/services/AsaasService";
import { GoogleApiAdminCard } from "@/components/admin/GoogleApiAdminCard";
import { GooglePlacesAdminCard } from "@/components/admin/GooglePlacesAdminCard";
import { ApifyAdminCard } from "@/components/admin/ApifyAdminCard";

import { WhatsAppCheckoutLinksCard } from "@/components/admin/WhatsAppCheckoutLinksCard";
import { DailyDealsBroadcastCard } from "@/components/admin/DailyDealsBroadcastCard";
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
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      queryClient.invalidateQueries({ queryKey: ["public_plans"] });
      toast.success("Plano atualizado com sucesso! Alterações refletidas na página de vendas (/assinar).");
    },
    onError: (err: any) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar plano.");
    },
  });
  const createPlan = useMutation({
    mutationFn: (input: Parameters<typeof BillingService.createPlan>[0]) =>
      BillingService.createPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      queryClient.invalidateQueries({ queryKey: ["public_plans"] });
      toast.success("Novo plano criado com sucesso! Já disponível para contratação em /assinar.");
    },
    onError: (err: any) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar plano.");
    },
  });
  const deletePlan = useMutation({
    mutationFn: (id: string) => BillingService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      queryClient.invalidateQueries({ queryKey: ["public_plans"] });
      toast.success("Plano removido com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err instanceof Error ? err.message : "Erro ao remover plano.");
    },
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
  const updateBuilderAccess = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      BillingService.setBuilderAccess(userId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });
  const updateComandaAccess = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      BillingService.setComandaAccess(userId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });
  const updateAgendaAccess = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      BillingService.setAgendaAccess(userId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin"] }),
  });

  const activateProMonthlyMutation = useMutation({
    mutationFn: (userId: string) => BillingService.activateProMonthly(userId),
    onSuccess: () => {
      toast.success("Plano Pro (1 Mês) ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao ativar plano Pro mensal."),
  });

  const activateProYearlyMutation = useMutation({
    mutationFn: (userId: string) => BillingService.activateProYearly(userId),
    onSuccess: () => {
      toast.success("Plano Pro (1 Ano) ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao ativar plano Pro anual."),
  });

  const revokeProMutation = useMutation({
    mutationFn: (userId: string) => BillingService.revokePro(userId),
    onSuccess: () => {
      toast.success("Acesso Pro revogado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao revogar plano Pro."),
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Super Admin</h1>
            <Badge variant="outline" className="text-[11px] font-normal border-primary/40 bg-primary/10 text-primary">
              Controle Geral
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Gestão estratégica de leads, solicitações, limites e assinaturas da plataforma.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/vendas"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-2 text-xs shadow-sm transition-all"
            title="Acessar Playbook Comercial, Scripts de Vendas e Simulador de Metas"
          >
            <BookOpen className="h-4 w-4" />
            <span>Playbook de Vendas</span>
            <span className="rounded-full bg-white/20 text-white text-[10px] px-1.5 py-0.2 uppercase font-extrabold">
              PDF
            </span>
          </Link>
          <a
            href="/Playbook_Comercial_EiaLink.pdf"
            download="Playbook_Comercial_EiaLink.pdf"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-2 text-xs transition-colors"
            title="Baixar arquivo PDF diagramado do Playbook Comercial"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar PDF</span>
          </a>
          <Link
            to="/admin/nfc"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/30 border border-emerald-500/30 hover:bg-emerald-600/40 text-emerald-300 px-3.5 py-2 text-xs font-medium shadow-sm transition-all"
          >
            <Radio className="h-4 w-4" />
            <span>Plaquinhas & NFC</span>
          </Link>
          <Link
            to="/admin/prospeccao"
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold px-3.5 py-2 text-xs shadow-sm transition-all"
          >
            <Target className="h-4 w-4" />
            <span>Radar de Prospecção</span>
          </Link>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground px-3.5 py-2 text-xs font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
        <Link
          to="/admin/nfc"
          className="group block"
        >
          <StatCard
            icon={Radio}
            label="Plaquinhas & NFC"
            value="Gerenciar"
            description="Google, Pix & Tags →"
            colorClass="text-teal-400 group-hover:text-teal-300 transition-colors"
          />
        </Link>
      </div>

      {/* WhatsApp Comercial da Plataforma */}
      <PlatformWhatsAppAdminCard />

      {/* Gateway de Pagamentos: Asaas, Pix Direto & Webhook */}
      <PaymentGatewaySettingsCard />

      {/* Links de Checkout Direto para Fechamento no WhatsApp */}
      <WhatsAppCheckoutLinksCard />

      {/* Mural do Dia & Disparo de Ofertas WhatsApp */}
      <DailyDealsBroadcastCard />

      {/* Configurações da Integração Google Agenda */}
      <GoogleApiAdminCard />

      <GooglePlacesAdminCard />

      {/* Configuração Oficial da API Apify (Instagram Scraper) */}
      <ApifyAdminCard />


      {/* Planos da Plataforma */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Planos Comerciais & Precificação
              </p>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-0.5">
                Editar Preços & Criar Planos (Sincronizado com /assinar)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Qualquer novo plano ou alteração de valor é atualizado instantaneamente na página de vendas e checkout.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/assinar"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                title="Abrir página de vendas em nova aba para ver como os clientes enxergam"
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <span>Ver Página de Vendas</span>
              </a>
              <button
                type="button"
                onClick={() => setIsCreatingPlan(!isCreatingPlan)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold px-3 py-1.5 text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isCreatingPlan ? "Fechar" : "Criar Novo Plano"}</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {isCreatingPlan && (
            <CreatePlanCard
              saving={createPlan.isPending}
              onCreate={(input) => {
                createPlan.mutate(input);
                setIsCreatingPlan(false);
              }}
              onCancel={() => setIsCreatingPlan(false)}
            />
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {data?.plans.map((plan) => (
              <PlanEditor
                key={plan.id}
                plan={plan}
                saving={updatePlan.isPending}
                onSave={(id, input) => updatePlan.mutate({ id, input })}
                onDelete={(id) => deletePlan.mutate(id)}
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
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
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
              <span className="font-medium text-foreground">Plano</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
              <span className="font-medium text-foreground">Nicho</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
              <span className="font-medium text-foreground">Cidade</span>
              <input
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="Ex.: Teixeira de Freitas"
              />
            </label>

            <label className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Página</span>
              <select
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                value={publicationFilter}
                onChange={(event) => setPublicationFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                <option value="published">Publicada</option>
                <option value="unpublished">Não publicada</option>
              </select>
            </label>

            <label className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Cadastrado a partir de</span>
              <input
                className="mt-1.5 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
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
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Ações Rápidas</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Sincronização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const subscription = data?.subscriptions.find((item) => item.user_id === profile.id);
                  return (
                    <TableRow key={profile.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-semibold text-foreground tracking-tight text-sm">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          className="h-8 min-w-36 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
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
                          className="h-8 min-w-28 rounded-lg border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
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
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => activateProMonthlyMutation.mutate(profile.id)}
                            disabled={activateProMonthlyMutation.isPending}
                            className="px-2 py-1 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                            title="Ativar Pro por 30 dias (Mensal)"
                          >
                            + 1 Mês
                          </button>
                          <button
                            type="button"
                            onClick={() => activateProYearlyMutation.mutate(profile.id)}
                            disabled={activateProYearlyMutation.isPending}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                            title="Ativar Pro por 12 meses (Anual)"
                          >
                            + 1 Ano
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja revogar o plano Pro de ${profile.full_name}?`)) {
                                revokeProMutation.mutate(profile.id);
                              }
                            }}
                            disabled={revokeProMutation.isPending}
                            className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                            title="Revogar e reverter para Essential"
                          >
                            Revogar
                          </button>
                        </div>
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
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
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
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
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
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Painel do Cliente</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p) => {
                  const sub = data?.subscriptions.find((s) => s.user_id === p.id);
                  const hasBuilderAccess = Boolean(sub?.notes?.includes("builder_access:true"));
                  const hasComandaAccess = Boolean(sub?.notes?.includes("comanda_access:true"));
                  const hasAgendaAccess = !sub?.notes?.includes("agenda_access:false");
                  const isOwner = p.email?.toLowerCase() === "jaimilsonvendas@gmail.com";

                  return (
                    <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3.5 px-4 min-w-[180px]">
                        <p className="font-semibold text-foreground tracking-tight text-sm">{p.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.email}</p>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-sm text-foreground">
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
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        {isOwner ? (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                            Super Admin Total
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5 items-start">
                            <button
                              type="button"
                              disabled={updateBuilderAccess.isPending}
                              onClick={() =>
                                updateBuilderAccess.mutate({
                                  userId: p.id,
                                  enabled: !hasBuilderAccess,
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                                hasBuilderAccess
                                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25"
                                  : "bg-muted/60 text-muted-foreground border border-border/50 hover:text-foreground hover:bg-muted"
                              }`}
                              title={
                                hasBuilderAccess
                                  ? "Clique para reverter para o Modo Simplificado"
                                  : "Clique para liberar o Construtor Visual Avançado para este cliente"
                              }
                            >
                              <Sliders className="h-3 w-3" />
                              <span>{hasBuilderAccess ? "Construtor: Liberado" : "Construtor: Oculto"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={updateComandaAccess.isPending}
                              onClick={() =>
                                updateComandaAccess.mutate({
                                  userId: p.id,
                                  enabled: !hasComandaAccess,
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                                hasComandaAccess
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                                  : "bg-muted/60 text-muted-foreground border border-border/50 hover:text-foreground hover:bg-muted"
                              }`}
                              title={
                                hasComandaAccess
                                  ? "Clique para bloquear a Comanda Digital para este cliente"
                                  : "Clique para liberar a Comanda Digital para este cliente"
                              }
                            >
                              <Utensils className="h-3 w-3" />
                              <span>{hasComandaAccess ? "Comanda: Liberada" : "Comanda: Bloqueada"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={updateAgendaAccess.isPending}
                              onClick={() =>
                                updateAgendaAccess.mutate({
                                  userId: p.id,
                                  enabled: !hasAgendaAccess,
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                                hasAgendaAccess
                                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25"
                                  : "bg-muted/60 text-muted-foreground border border-border/50 hover:text-foreground hover:bg-muted"
                              }`}
                              title={
                                hasAgendaAccess
                                  ? "Clique para bloquear a Agenda para este cliente"
                                  : "Clique para liberar a Agenda para este cliente"
                              }
                            >
                              <CalendarDays className="h-3 w-3" />
                              <span>{hasAgendaAccess ? "Agenda: Liberada" : "Agenda: Bloqueada"}</span>
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProfiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
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
        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
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
  onDelete,
}: {
  plan: Plan;
  saving: boolean;
  onSave: (id: string, input: Parameters<typeof BillingService.updatePlan>[1]) => void;
  onDelete?: (id: string) => void;
}) {
  const baseLimits = toPlanLimits(plan.limits);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [price, setPrice] = useState(String(plan.price_cents / 100));
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    plan.billing_interval === "yearly" ? "yearly" : "monthly"
  );
  const [active, setActive] = useState(plan.active);
  const [limits, setLimits] = useState(baseLimits);
  const priceCents = Math.max(0, Math.round(Number(price.replace(",", ".")) * 100) || 0);

  const save = () =>
    onSave(plan.id, {
      name: name.trim() || plan.name,
      description: description.trim() || null,
      price_cents: priceCents,
      billing_interval: billingInterval,
      active,
      limits,
    });

  return (
    <article className="rounded-xl border border-border bg-background/50 p-4 space-y-3 relative group">
      <div className="flex items-center justify-between gap-2">
        <input
          className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 flex-1 transition-colors"
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

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
          slug: {plan.slug}
        </span>
        <select
          value={billingInterval}
          onChange={(e) => setBillingInterval(e.target.value as "monthly" | "yearly")}
          className="h-7 text-xs rounded border border-border bg-background px-2 text-foreground focus:outline-none focus:border-primary/60 ml-auto"
        >
          <option value="monthly">Cobrança Mensal</option>
          <option value="yearly">Cobrança Anual</option>
        </select>
      </div>

      <label className="block text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Descrição na Landing Page</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors min-h-16 resize-none"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="block text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Valor do plano em R$ ({billingInterval === "yearly" ? "Anual total" : "Mensal"})
        </span>
        <input
          className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold px-3 py-2 text-xs shadow-sm transition-all disabled:opacity-50"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Salvando…" : "Salvar Alterações"}
        </button>

        {onDelete && (
          <button
            type="button"
            className="rounded-lg p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-all cursor-pointer"
            title="Excluir ou desativar plano"
            onClick={() => {
              if (confirm(`Tem certeza que deseja desativar ou excluir o plano "${plan.name}"?`)) {
                onDelete(plan.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function CreatePlanCard({
  saving,
  onCreate,
  onCancel,
}: {
  saving: boolean;
  onCreate: (input: Parameters<typeof BillingService.createPlan>[0]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("29.90");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [limits, setLimits] = useState({
    bio_pages: 10,
    links: 100,
    catalog_items: 50,
    templates: -1,
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "_")) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
      );
    }
  };

  const priceCents = Math.max(0, Math.round(Number(price.replace(",", ".")) * 100) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do plano.");
      return;
    }
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    onCreate({
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      price_cents: priceCents,
      billing_interval: billingInterval,
      active: true,
      limits,
      features: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-primary/40 bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Criar Novo Plano de Assinatura
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Nome do Plano *</span>
          <input
            className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
            placeholder="Ex.: Pro Semestral, Agência, VIP..."
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </label>

        <label className="block text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Slug Único (identificador) *</span>
          <input
            className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors font-mono"
            placeholder="Ex.: pro_semestral"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Preço em R$ *</span>
          <input
            className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
            placeholder="29.90 ou 290.00"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <label className="block text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Intervalo de Cobrança</span>
          <select
            className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
            value={billingInterval}
            onChange={(e) => setBillingInterval(e.target.value as "monthly" | "yearly")}
          >
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </label>
      </div>

      <label className="block text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Descrição / Destaque na Página de Vendas</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors min-h-16 resize-none"
          placeholder="Ex.: Ideal para negócios locais que querem tracionar rápido com IA."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
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
          label="Itens Catálogo"
          value={limits.catalog_items}
          onChange={(value) => setLimits({ ...limits, catalog_items: value })}
        />
        <LimitField
          label="Templates (-1 = ilimitado)"
          value={limits.templates}
          onChange={(value) => setLimits({ ...limits, templates: value })}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold px-4 py-1.5 text-xs shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? "Criando Plano..." : "Salvar e Publicar Plano"}
        </button>
      </div>
    </form>
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
        className="mt-1 w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
        <h3 className="text-sm font-semibold text-foreground">{service.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{service.description}</p>
      </div>
      <button
        type="button"
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          service.active
            ? "border border-border bg-background text-muted-foreground hover:text-foreground"
            : "bg-primary hover:bg-primary/90 text-zinc-950 font-bold shadow-sm"
        }`}
        disabled={saving}
        onClick={() => onToggle(service.id, !service.active)}
      >
        {service.active ? "Pausar" : "Ativar"}
      </button>
    </article>
  );
}

function PlatformWhatsAppAdminCard() {
  const [phoneInput, setPhoneInput] = useState(() =>
    CommercialSettingsService.getInitialCachedNumber(),
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    CommercialSettingsService.getCommercialWhatsApp().then((num) => {
      if (isMounted && num) setPhoneInput(num);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);
    try {
      const sanitized = await CommercialSettingsService.updateCommercialWhatsApp(phoneInput);
      setPhoneInput(sanitized);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erro ao salvar número de WhatsApp.",
      );
    } finally {
      setSaving(false);
    }
  }

  const cleanPhone = sanitizePhoneDigits(phoneInput);
  const displayFormatted = formatPhoneDisplay(cleanPhone);
  const testUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Olá! Este é um teste do canal comercial oficial da plataforma EIA Link.",
  )}`;

  return (
    <Card className="rounded-xl border border-primary/30 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-primary/[0.03] border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  WhatsApp Comercial da Plataforma & Contato Oficial
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                >
                  Canal Oficial
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Número que recebe todos os upgrades para o Plano Pro, contatos comerciais e fallback de sites gerados.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6 space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Número do WhatsApp (com DDD)</span>
                {cleanPhone && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Visualização: {displayFormatted || cleanPhone}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground text-xs font-mono">
                  +55
                </span>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={
                    phoneInput.startsWith("55") && phoneInput.length > 2
                      ? phoneInput.slice(2)
                      : phoneInput
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPhoneInput(digits ? `55${digits}` : "");
                    setSuccess(false);
                  }}
                  className="w-full h-10 pl-11 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-6 flex items-center gap-2 pt-1 sm:pt-0">
              <button
                type="submit"
                disabled={saving || !cleanPhone}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span>Salvando…</span>
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Atualizado!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar WhatsApp</span>
                  </>
                )}
              </button>

              <a
                href={testUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-background hover:bg-muted/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                title="Abrir WhatsApp para testar recebimento de mensagens"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Testar Conversa</span>
              </a>
            </div>
          </div>

          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

          <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <span className="text-base leading-none">💡</span>
            <span>
              <strong>Dica de ouro:</strong> Ao alterar este número, os botões{" "}
              <em>&ldquo;Desbloquear com o Eialink Pro&rdquo;</em> de todos os clientes no sistema, os banners de demonstração pública e os botões de sites gerados sem WhatsApp passarão a conversar diretamente com o seu número novo imediatamente.
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PaymentGatewaySettingsCard() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [environment, setEnvironment] = useState<AsaasEnvironment>("sandbox");
  const [webhookToken, setWebhookToken] = useState("");
  const [showWebhookToken, setShowWebhookToken] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("email");
  const [pixReceiverName, setPixReceiverName] = useState("");
  const [whatsappSupport, setWhatsappSupport] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/payments/asaas-webhook`
      : "https://eialink.com.br/api/public/payments/asaas-webhook";

  useEffect(() => {
    let isMounted = true;
    getAdminPaymentSettingsFn()
      .then((cfg) => {
        if (!isMounted) return;
        setApiKey(cfg.asaasApiKey || "");
        setEnvironment(cfg.asaasEnvironment || "sandbox");
        setWebhookToken(cfg.asaasWebhookToken || "");
        setPixKey(cfg.pixKey || "");
        setPixKeyType(cfg.pixKeyType || "email");
        setPixReceiverName(cfg.pixReceiverName || "EIA Digital Plataforma");
        setWhatsappSupport(cfg.whatsappSupport || "");
      })
      .catch((err) => {
        console.warn("Aviso ao carregar configurações do Asaas:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await savePaymentGatewaySettingsFn({
        data: {
          asaasApiKey: apiKey,
          asaasEnvironment: environment,
          asaasWebhookToken: webhookToken,
          pixKey,
          pixKeyType,
          pixReceiverName,
          whatsappSupport,
        },
      });
      toast.success("Configurações do Checkout Asaas e Pix salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações do gateway.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success("URL do Webhook copiada!");
    setTimeout(() => setCopiedWebhook(false), 3000);
  }

  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-muted/20 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  Gateway de Pagamento Asaas, Pix Oficial & Webhook
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium border-violet-500/40 bg-violet-500/10 text-violet-400"
                >
                  Checkout Híbrido
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Gerencie credenciais da API Asaas v3, o modo Sandbox/Produção, a chave Pix oficial e a URL de retorno automático.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Carregando credenciais de pagamento...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Bloco 1: Integração Asaas API */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Integração Asaas v3 (Pix Dinâmico & Cartão)</span>
              </div>

              <div className="grid sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Chave de API do Asaas (API Key / Access Token)</span>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {showKey ? (
                        <>
                          <EyeOff className="h-3 w-3" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Exibir
                        </>
                      )}
                    </button>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="$aact_YTU5YTE0M2M6N2Z..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Obtida no painel do Asaas em <strong>Configurações da Conta &gt; Integrações &gt; Gerar Chave de API</strong>.
                  </p>
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Ambiente de Operação</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as AsaasEnvironment)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  >
                    <option value="sandbox">🧪 Sandbox (Ambiente de Testes)</option>
                    <option value="production">🚀 Produção (Cobrança Real)</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Alterne para Produção quando sua conta Asaas estiver aprovada.
                  </p>
                </div>
              </div>

              {/* Webhook do Asaas */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>URL do Webhook para Confirmação Automática</span>
                  <span className="text-[10px] text-muted-foreground font-mono">POST /api/public/payments/asaas-webhook</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full h-10 px-3 pr-24 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="absolute right-1.5 h-7 px-3 rounded bg-primary hover:bg-primary/90 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedWebhook ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cadastre esta URL em <strong>Integrações &gt; Webhooks para Cobranças</strong> no Asaas com os eventos <em>Pagamento Recebido</em> e <em>Pagamento Confirmado</em>.
                </p>
              </div>

              {/* Token de Autenticação do Webhook */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Token de Autenticação do Webhook (asaas-access-token)</span>
                  <button
                    type="button"
                    onClick={() => setShowWebhookToken(!showWebhookToken)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {showWebhookToken ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Exibir
                      </>
                    )}
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    type={showWebhookToken ? "text" : "password"}
                    value={webhookToken}
                    onChange={(e) => setWebhookToken(e.target.value)}
                    placeholder="Cole o token de autenticação configurado no Asaas"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Opcional, porém recomendado. Se preenchido, o sistema valida se a requisição contém o cabeçalho <code>asaas-access-token</code> exato para impedir chamadas não autorizadas.
                </p>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-border" />

            {/* Bloco 2: Pix Direto Oficial com Comprovante */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pix Direto com Comprovante (WhatsApp)</span>
              </div>

              <div className="grid sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Chave Pix Oficial da Empresa</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="jaimilsonvendas@gmail.com"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tipo da Chave</label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  >
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="phone">Celular</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">WhatsApp de Suporte</label>
                  <input
                    type="text"
                    value={whatsappSupport}
                    onChange={(e) => setWhatsappSupport(e.target.value)}
                    placeholder="5581999999999"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
                  />
                </div>

                <div className="sm:col-span-12 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nome do Titular / Razão Social</label>
                  <input
                    type="text"
                    value={pixReceiverName}
                    onChange={(e) => setPixReceiverName(e.target.value)}
                    placeholder="EIA Digital Plataforma"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Exibido no checkout como o beneficiário oficial para dar segurança ao cliente durante a transferência bancária.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                    <span>Salvando Configurações...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar Configurações de Pagamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}


