import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/pages", label: "Páginas", icon: PanelsTopLeft },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/analytics", label: "Resultados", icon: BarChart3 },
  { to: "/growth", label: "Crescimento", icon: Sparkles },
  { to: "/billing", label: "Planos", icon: CreditCard },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]] as const;

function AuthedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

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
        <nav className="px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`app-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "is-active" : ""}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm mt-4 border-t border-border pt-4 ${pathname.startsWith("/admin") ? "text-foreground" : "text-muted-foreground hover:bg-surface-elevated/60"}`}
            >
              <Shield className="h-4 w-4 text-[color:var(--accent)]" /> Super Admin
            </Link>
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
        <main className="app-content p-4 pb-24 sm:p-5 md:p-10 md:pb-10 max-w-7xl mx-auto">
          <Outlet />
        </main>
        <nav className="app-mobile-nav md:hidden" aria-label="Navegação principal">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} className={active ? "is-active" : ""}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
