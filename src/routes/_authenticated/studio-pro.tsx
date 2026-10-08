import { createFileRoute } from "@tanstack/react-router";
import { StudioProApp } from "@/modules/studiopro/StudioProApp";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/studio-pro")({
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
