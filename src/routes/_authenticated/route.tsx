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
} from "lucide-react";

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
  { to: "/builder", label: "Minha Página", icon: LayoutDashboard },
  { to: "/analytics", label: "Resultados", icon: BarChart3 },
  { to: "/growth", label: "Crescimento", icon: Sparkles },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transform transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-5 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            </span>
            EIA Digital
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:bg-surface-elevated/60"}`}
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
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      {/* Content */}
      <div className="flex-1 md:ml-64">
        <header className="md:hidden sticky top-0 z-30 glass flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold">EIA Digital</span>
          <span className="w-5" />
        </header>
        <main className="p-6 md:p-10 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
