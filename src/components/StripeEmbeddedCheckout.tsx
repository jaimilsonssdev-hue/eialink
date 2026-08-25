import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
}

export function StripeEmbeddedCheckout({ priceId }: StripeEmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  function friendlyError(message: string) {
    if (message.toLowerCase().includes("price not found")) {
      return "Este preço ainda não foi sincronizado no ambiente de teste da Stripe. Abra Payments no Lovable e confirme se os produtos foram criados.";
    }
    if (message.toLowerCase().includes("unauthorized")) {
      return "Sua sessão expirou. Entre novamente na conta antes de iniciar o pagamento.";
    }
    return message;
  }

  const fetchClientSecret = async (): Promise<string> => {
    try {
      const result = await createCheckoutSession({
        data: {
          priceId,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error("A Stripe não retornou uma sessão de pagamento.");
      return result.clientSecret;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Não foi possível abrir o pagamento.";
      setError(friendlyError(message));
      throw checkoutError;
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
        <p className="font-semibold text-red-300">Não foi possível iniciar o pagamento</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={() => {
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider key={attempt} stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
