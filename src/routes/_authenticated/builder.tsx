import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/builder")({
  validateSearch: z.object({
    template: z.string().optional(),
    page: z.string().optional(),
    tab: z.string().optional(),
    copilot: z.coerce.boolean().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/studio",
      search: {
        page: search.page,
      },
    });
  },
  component: BuilderRedirectPage,
  head: () => ({ meta: [{ title: "Studio IA — EIA Digital" }] }),
});

function BuilderRedirectPage() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center gap-3 text-zinc-400">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      <span className="text-xs font-medium tracking-wide">Abrindo Studio com IA...</span>
    </div>
  );
}
