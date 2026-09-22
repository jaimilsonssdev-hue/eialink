import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { GoogleCalendarService } from "@/modules/booking/services/GoogleCalendarService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/google-callback")({
  component: GoogleCallbackPage,
  head: () => ({ meta: [{ title: "Conectando Google Agenda — EIA Link" }] }),
});

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg(
        error === "access_denied"
          ? "A autorização foi cancelada ou negada no Google."
          : `Erro retornado pelo Google: ${error}`
      );
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setErrorMsg("Parâmetros de autenticação inválidos ou ausentes.");
      return;
    }

    GoogleCalendarService.handleCallback(code, state)
      .then((res) => {
        setStatus("success");
        setConnectedEmail(res.email || "");
        setTimeout(() => {
          navigate({ to: "/agenda" });
        }, 2200);
      })
      .catch((err) => {
        console.error("Erro no callback do Google Calendar:", err);
        setStatus("error");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Não foi possível concluir a integração com o Google Calendar."
        );
      });
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg rounded-2xl overflow-hidden text-center">
        <CardContent className="p-8 space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="h-7 w-7" />
          </div>

          {status === "loading" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-foreground font-semibold">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Vinculando seu Google Agenda...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Estamos configurando a sincronização automática de eventos para o seu negócio.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Google Agenda Conectado!
              </h2>
              {connectedEmail && (
                <p className="text-xs font-mono text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-lg inline-block">
                  {connectedEmail}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Tudo pronto! Novos agendamentos cairão diretamente na sua agenda do Google com alertas no celular. Redirecionando para a sua agenda...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                Não foi possível conectar
              </h2>
              <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-lg">
                {errorMsg}
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate({ to: "/agenda" })}
                className="w-full"
              >
                Voltar para a Agenda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

