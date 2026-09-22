import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Utensils, AlertCircle } from "lucide-react";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/r/$code")({
  component: DynamicRedirectPage,
  head: () => ({ meta: [{ title: "Comanda Digital — EIA Link" }] }),
});

function DynamicRedirectPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setErrorMsg("Código inválido.");
      return;
    }

    ComandaService.resolveDynamicCode(code)
      .then((res) => {
        if (res?.targetUrl) {
          // Redireciona na hora para a página pública com os parâmetros de mesa/garçom
          window.location.replace(res.targetUrl);
        } else {
          setErrorMsg("Destino não encontrado para este cartão.");
        }
      })
      .catch((err) => {
        console.error("Erro na resolução de QR/NFC:", err);
        setErrorMsg(
          err instanceof Error ? err.message : "Código de mesa ou cartão não encontrado.",
        );
      });
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm border-border bg-card shadow-lg rounded-2xl text-center overflow-hidden">
        <CardContent className="p-8 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
            <Utensils className="h-7 w-7" />
          </div>

          {!errorMsg ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-foreground font-semibold text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Abrindo Cardápio Digital...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conectando à comanda da sua mesa. Aguarde um instante...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-rose-300 bg-rose-500/10 p-3 rounded-lg">
                {errorMsg}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.replace("/")}
                className="w-full text-xs"
              >
                Ir para o Início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

