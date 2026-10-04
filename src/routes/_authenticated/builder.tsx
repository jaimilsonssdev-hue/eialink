import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CleanBuilder } from "@/modules/builder/CleanBuilder";

export const Route = createFileRoute("/_authenticated/builder")({
  validateSearch: z.object({
    page: z.string().optional(),
    tab: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Editor Clean — EIA Digital" }] }),
  component: CleanBuilder,
});
