import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Pagamento concluído — EIA LINK" },
      { name: "description", content: "Confirmação do pagamento da sua assinatura EIA LINK." },
      { property: "og:title", content: "Pagamento concluído — EIA LINK" },
      { property: "og:description", content: "Confirmação do pagamento da sua assinatura EIA LINK." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-[color:var(--success)]" />
      <h1 className="text-3xl font-bold">
        {sessionId ? "Pagamento concluído!" : "Sessão não encontrada"}
      </h1>
      <p className="text-muted-foreground">
        {sessionId
          ? "Sua assinatura foi registrada. Pode levar alguns segundos até o plano aparecer atualizado no painel."
          : "Não encontramos informações do pagamento nesta página."}
      </p>
      <Link to="/dashboard" className="btn-primary">
        Voltar ao painel
      </Link>
    </main>
  );
}
