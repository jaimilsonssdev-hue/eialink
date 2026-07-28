import { createFileRoute, redirect } from "@tanstack/react-router";

// Compatibility route: links are edited inside Minha Página.
export const Route = createFileRoute("/_authenticated/links")({
  beforeLoad: () => {
    throw redirect({ to: "/builder" });
  },
  component: () => null,
});
