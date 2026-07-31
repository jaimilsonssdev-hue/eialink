const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
        Os pagamentos reais ainda não estão configurados nesta versão publicada.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-300">
        Todos os pagamentos feitos na pré-visualização são de teste. Use o cartão 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}
