import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  PanelsTopLeft,
  CreditCard,
  CalendarDays,
  Target,
  Utensils,
  Clapperboard,
  BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    }
    return { user: session.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: access } = usePlanAccess();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const isOwner = data.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setIsAdmin(isOwner || !!roles?.some((r) => r.role === "admin"));
    });
  }, []);

  const canAccessComanda = isAdmin || Boolean(access?.canAccessComanda);

  const navGroups = useMemo(() => {
    return [
      {
        title: "Criação & Destaque",
        items: [
          { to: "/dashboard", label: "Início", icon: LayoutDashboard },
          {
            to: "/studio-pro",
            label: "Studio Pro",
            icon: Sparkles,
            badge: "Novo (Lovable)",
            badgeClassName: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md",
          },
          {
            to: "/studio",
            label: "Studio Clássico",
            icon: Clapperboard,
            badge: "IA",
            badgeClassName: "bg-zinc-800 text-zinc-300 border border-white/10 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md",
          },
          { to: "/pages", label: "Páginas & Links", icon: PanelsTopLeft },
        ],
      },
      {
        title: "Operação",
        items: [
          { to: "/agenda", label: "Agenda", icon: CalendarDays },
          ...(canAccessComanda
            ? [{ to: "/comanda", label: "Comanda & NFC", icon: Utensils }]
            : []),
        ],
      },
      {
        title: "Gestão",
        items: [
          { to: "/analytics", label: "Métricas & Vendas", icon: BarChart3 },
          { to: "/settings", label: "Empresa", icon: Settings },
          { to: "/billing", label: "Assinatura", icon: CreditCard },
        ],
      },
    ];
  }, [canAccessComanda]);

  const mobileNavItems = useMemo(() => {
    const homeItem = { to: "/dashboard", label: "Início", icon: LayoutDashboard };
    const studioItem = { to: "/studio", label: "Studio", icon: Clapperboard };
    const pagesItem = { to: "/pages", label: "Páginas", icon: PanelsTopLeft };

    let salesItem = { to: "/agenda", label: "Agenda", icon: CalendarDays };
    if (canAccessComanda) {
      salesItem = { to: "/comanda", label: "Comanda", icon: Utensils };
    }

    return [homeItem, studioItem, pagesItem, salesItem];
  }, [canAccessComanda]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isStudio = pathname.startsWith("/studio");

  // Layout isolado para o Cinematic Studio (Sem cascas móveis extras, flush bottom)
  if (isStudio) {
    return (
      <div className="fixed inset-0 z-30 h-dvh w-full bg-zinc-950 flex flex-col overflow-hidden md:static md:inset-auto md:min-h-screen md:h-screen md:flex-row">
        {/* Sidebar no Desktop */}
        <aside className="app-sidebar hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 z-40 bg-[#08070d] border-r border-white/[0.08]">
          <div className="app-sidebar-header p-5 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="app-brand flex items-center gap-2 font-display font-bold text-zinc-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                EIA <b>LINK</b>
              </span>
            </Link>
          </div>
          <div className="px-3 pb-4">
            <ThemeToggle />
          </div>
          <nav className="px-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </p>
                {group.items.map(({ to, label, icon: Icon, badge, badgeClassName }) => {
                  const active = pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to as any}
                      className={`app-nav-link flex items-center justify-between rounded-xl px-3 py-2 text-sm ${active ? "is-active" : ""}`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                      {badge && (
                        <span className={badgeClassName || "rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium px-2 py-0.5 border border-white/10"}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {isAdmin && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Super Admin
                </p>
                <Link
                  to="/admin"
                  className={`app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/admin" ? "is-active" : ""}`}
                >
                  <Shield className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>Painel Admin</span>
                </Link>
                <Link
                  to="/admin/prospeccao"
                  className={`app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/admin/prospeccao" ? "is-active" : ""}`}
                >
                  <Target className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span>Prospecção</span>
                </Link>
                <Link
                  to="/admin/vendas"
                  className={`app-nav-link flex items-center justify-between rounded-xl px-3 py-2 text-sm ${pathname === "/admin/vendas" ? "is-active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Playbook Vendas</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 border border-emerald-500/30">
                    PDF
                  </span>
                </Link>
              </div>
            )}
          </nav>
          <div className="absolute bottom-4 left-3 right-3">
            <button
              onClick={signOut}
              className="app-nav-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </aside>

        {/* Studio Content: tela cheia nativa no mobile, sem containers aninhados */}
        <div className="w-full h-full flex-1 md:ml-64 flex flex-col overflow-hidden bg-zinc-950">
          <Outlet />
        </div>
      </div>
    );
  }

  // Layout padrão do Dashboard
  return (
    <div className="app-shell min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 w-64 transform transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="app-sidebar-header p-5 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="app-brand flex items-center gap-2 font-display font-bold"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            </span>
            <span>
              EIA <b>LINK</b>
            </span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3 pb-4">
          <ThemeToggle />
        </div>
        <nav className="px-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
              {group.items.map(({ to, label, icon: Icon, badge, badgeClassName }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to as any}
                    onClick={() => setOpen(false)}
                    className={`app-nav-link flex items-center justify-between rounded-xl px-3 py-2 text-sm ${active ? "is-active" : ""}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                    {badge && (
                      <span className={badgeClassName || "rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium px-2 py-0.5 border border-white/10"}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {isAdmin && (
            <div className="border-t border-border pt-3 space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Super Admin
              </p>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className={`app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/admin" ? "is-active" : ""}`}
              >
                <Shield className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>Painel Admin</span>
              </Link>
              <Link
                to="/admin/prospeccao"
                onClick={() => setOpen(false)}
                className={`app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${pathname === "/admin/prospeccao" ? "is-active" : ""}`}
              >
                <Target className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>Prospecção</span>
              </Link>
              <Link
                to="/admin/vendas"
                onClick={() => setOpen(false)}
                className={`app-nav-link flex items-center justify-between rounded-xl px-3 py-2 text-sm ${pathname === "/admin/vendas" ? "is-active" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Playbook Vendas</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 border border-emerald-500/30">
                  PDF
                </span>
              </Link>
            </div>
          )}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <button
            onClick={signOut}
            className="app-nav-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 md:ml-64">
        <header className="app-mobile-header md:hidden sticky top-0 z-30 glass flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold">
            EIA <b>LINK</b>
          </span>
          <ThemeToggle compact />
        </header>
        <main
          className={
            pathname.startsWith("/studio-pro")
              ? "w-full h-[calc(100vh-3.5rem)] md:h-screen p-0 m-0 overflow-hidden"
              : pathname === "/studio"
              ? "app-content mx-auto p-4 sm:p-5 md:p-8 max-w-[1600px]"
              : "app-content mx-auto p-4 sm:p-5 md:p-8 max-w-7xl"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

