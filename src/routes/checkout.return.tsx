import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { getStripeEnvironment } from "@/lib/stripe";
import { syncLatestCheckoutCompletion } from "@/utils/payments.functions";

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
  validateSearch: (search: Record<string, unknown>): { session_id?: string; completed?: boolean } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    completed: search.completed === true || search.completed === "true",
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId, completed } = Route.useSearch();
  const paymentCompleted = Boolean(sessionId || completed);
  const sync = useQuery({
    queryKey: ["sync-checkout-completion", sessionId],
    enabled: paymentCompleted,
    retry: 3,
    retryDelay: 1500,
    queryFn: async () => {
      const result = await syncLatestCheckoutCompletion({
        data: { environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      return result;
    },
  });

  const activated = sync.isSuccess;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      {sync.isPending && paymentCompleted ? (
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--primary)]" />
      ) : (
        <CheckCircle2 className="h-12 w-12 text-[color:var(--success)]" />
      )}
      <h1 className="text-3xl font-bold">
        {activated
          ? "Plano Pro liberado!"
          : paymentCompleted
            ? sync.isError
              ? "Pagamento recebido"
              : "Confirmando seu plano..."
            : "Sessão não encontrada"}
      </h1>
      <p className="text-muted-foreground">
        {activated
          ? "Tudo certo. Os recursos Pro já estão disponíveis na sua conta."
          : paymentCompleted && sync.isError
            ? "O pagamento foi concluído, mas a liberação automática ainda não foi confirmada. Tente verificar novamente."
            : paymentCompleted
              ? "Estamos confirmando o pagamento diretamente com a Stripe."
          : "Não encontramos informações do pagamento nesta página."}
      </p>
      {sync.isError ? (
        <button type="button" className="btn-primary" onClick={() => void sync.refetch()}>
          <RefreshCw className="h-4 w-4" /> Verificar novamente
        </button>
      ) : (
        <Link to="/dashboard" className="btn-primary" disabled={!activated}>
          Ir para o painel
        </Link>
      )}
    </main>
  );
}
