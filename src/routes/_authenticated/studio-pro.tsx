import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudioProApp } from "@/modules/studiopro/StudioProApp";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/studio-pro")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const isOwner = user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = isOwner || !!roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: StudioProRoutePage,
  validateSearch: z.object({
    tab: z.string().optional(),
    project: z.string().optional(),
    page: z.string().optional(),
  }),
  head: () => ({
    meta: [
      {
        title: "Estúdio Criativo — Criador de Sites com IA (Google Gemini)",
      },
    ],
  }),
});

function StudioProRoutePage() {
  const { page, project } = Route.useSearch();
  return <StudioProApp pageId={page} projectId={project} />;
}

export default StudioProRoutePage;
