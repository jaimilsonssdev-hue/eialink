import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Unlink,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GoogleCalendarService,
  type GoogleCalendarStatus,
} from "@/modules/booking/services/GoogleCalendarService";

interface GoogleCalendarIntegrationCardProps {
  bioPageId: string;
}

export function GoogleCalendarIntegrationCard({ bioPageId }: GoogleCalendarIntegrationCardProps) {
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!bioPageId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    GoogleCalendarService.getStatus(bioPageId)
      .then((res) => {
        if (isMounted) setStatus(res);
      })
      .catch((err) => {
        console.warn("Aviso ao carregar status do Google Calendar:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bioPageId]);

  async function handleConnect() {
    if (!bioPageId) {
      toast.error("Nenhuma página selecionada.");
      return;
    }
    setConnecting(true);
    setErrorMsg(null);
    try {
      const authUrl = await GoogleCalendarService.startGoogleOAuthFlow(bioPageId);
      window.location.href = authUrl;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao iniciar conexão com o Google Agenda.";
      setErrorMsg(msg);
      toast.error(msg);
      setConnecting(false);
    }
  }

  async function handleTestSync() {
    if (!bioPageId) return;
    setTesting(true);
    try {
      const res = await GoogleCalendarService.sendTestEvent(bioPageId);
      toast.success("🎉 Evento teste criado no seu Google Agenda com sucesso! Abra o app do Google no celular para conferir.");
      if (res?.htmlLink) {
        window.open(res.htmlLink, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar evento de teste."
      );
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!bioPageId) return;
    if (!confirm("Tem certeza que deseja desconectar o Google Agenda desta página? Novos agendamentos deixarão de ser sincronizados automaticamente.")) {
      return;
    }
    setDisconnecting(true);
    try {
      await GoogleCalendarService.disconnect(bioPageId);
      setStatus({ connected: false });
      toast.success("Google Agenda desconectado.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao desconectar Google Agenda."
      );
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <Card className="rounded-xl border border-border/80 bg-card p-4">
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Verificando integração com o Google Agenda...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/[0.03] shadow-sm overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Google Agenda
                </h3>
                {status.connected ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold gap-1 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[11px]">
                    Não conectado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sincronização 100% automática com a agenda do seu celular (Android e iOS).
              </p>
            </div>
          </div>

          {status.connected && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSync}
                disabled={testing}
                className="h-8 text-xs font-medium border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Enviando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Testar Sincronização
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="h-8 text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                title="Desconectar conta do Google"
              >
                {disconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Corpo do Card */}
        {status.connected ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-medium">Conta conectada:</span>
                <p className="font-mono font-semibold text-emerald-300">{status.email}</p>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium shrink-0 ml-2"
              >
                Abrir Google Agenda <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              🎉 <b>Tudo pronto:</b> Quando qualquer cliente agendar um horário no seu site, o compromisso entrará <b>automaticamente</b> no seu Google Agenda e você receberá uma notificação no celular, sem precisar clicar em nada.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao conectar sua conta, cada novo agendamento feito por um cliente no seu site cria automaticamente um evento com os dados de atendimento no seu <b>Google Agenda</b>. Você recebe notificações nativas no seu celular sem precisar de nenhum clique manual.
            </p>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all gap-2 h-10 px-5"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Conectando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#ffffff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Conectar com o Google Agenda
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

