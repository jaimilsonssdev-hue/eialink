import { createFileRoute, redirect } from "@tanstack/react-router";

// Compatibility route: profile editing now lives in the single Minha Página editor.
export const Route = createFileRoute("/_authenticated/bio")({
  beforeLoad: () => {
    throw redirect({ to: "/builder" });
  },
  component: () => null,
});
