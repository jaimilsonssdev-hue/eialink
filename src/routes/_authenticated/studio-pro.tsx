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
    name: z.string().optional(),
    address: z.string().optional(),
    whatsapp: z.string().optional(),
    niche: z.string().optional(),
  }),
  head: () => ({
    meta: [
      {
        title: "Estúdio Criativo — Criador de Sites com IA (Google Gemini)",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const isQuota = String(error?.message || "").toLowerCase().includes("quota");
    const handleCleanAndRetry = () => {
      try {
        localStorage.removeItem("eialink_estudio_criativo_storage");
      } catch (_) {}
      reset();
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Algo deu errado ao carregar o Estúdio</h2>
        <p className="text-zinc-400 text-sm max-w-md mb-4">
          {isQuota
            ? "O armazenamento local do seu navegador atingiu o limite com dados de sessões antigas."
            : error?.message || "Ocorreu um erro inesperado."}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCleanAndRetry}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            {isQuota ? "Liberar Memória e Recarregar" : "Tentar novamente"}
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-all"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  },
});

function StudioProRoutePage() {
  const search = Route.useSearch();
  const cleanParam = (val?: string) => {
    if (!val) return undefined;
    const trimmed = val.replace(/^["']|["']$/g, "").trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const cleanName = cleanParam(search.name);

  return (
    <StudioProApp
      pageId={cleanParam(search.page)}
      projectId={cleanParam(search.project)}
      leadData={
        cleanName
          ? {
              name: cleanName,
              address: cleanParam(search.address),
              whatsapp: cleanParam(search.whatsapp),
              niche: cleanParam(search.niche),
            }
          : undefined
      }
    />
  );
}


