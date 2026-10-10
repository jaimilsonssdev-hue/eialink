import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/studio")({
  validateSearch: z.object({
    page: z.string().optional(),
    project: z.string().optional(),
    name: z.string().optional(),
    address: z.string().optional(),
    whatsapp: z.string().optional(),
    niche: z.string().optional(),
    tab: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/studio-pro",
      search: {
        page: search.page,
        project: search.project,
        name: search.name,
        address: search.address,
        whatsapp: search.whatsapp,
        niche: search.niche,
        tab: search.tab,
      },
    });
  },
  component: () => null,
});

export default function StudioRedirect() {
  return null;
}
