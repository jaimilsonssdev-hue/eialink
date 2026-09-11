import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { TalentoDemandEngine } from "@/components/admin/TalentoDemandEngine";

export const Route = createFileRoute("/_authenticated/talento")({
  head: () => ({ meta: [{ title: "Talento Demand Engine" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: TalentoPage,
});

function TalentoPage() {
  return <main className="mx-auto max-w-7xl px-4 py-6"><TalentoDemandEngine /></main>;
}
