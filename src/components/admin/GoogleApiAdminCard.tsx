import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Loader2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleCalendarService } from "@/modules/booking/services/GoogleCalendarService";

export function GoogleApiAdminCard() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isFromEnv, setIsFromEnv] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/_authenticated/google-callback`
      : "https://seusite.com/_authenticated/google-callback";

  useEffect(() => {
    GoogleCalendarService.getApiCredentials()
      .then((res) => {
        if (res.clientId) setClientId(res.clientId);
        setIsFromEnv(Boolean(res.isFromEnv));
      })
      .catch((err) => {
        console.warn("Aviso ao carregar credenciais Google do admin:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await GoogleCalendarService.saveApiCredentials(clientId, clientSecret);
      toast.success("Credenciais da API do Google salvas com sucesso!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar credenciais do Google."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyRedirect() {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 3000);
      toast.success("URI de Redirecionamento copiada!");
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  }

  const isConfigured = Boolean(clientId.trim());

  return (
    <Card className="rounded-xl border border-blue-500/30 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-blue-500/[0.03] border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  API Google Agenda (OAuth 2.0)
                </CardTitle>
                {isConfigured ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[11px]">
                    Configuração Necessária
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Permite que todos os clientes do Eia Link sincronizem seus agendamentos diretamente na conta do Google.
              </CardDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Como configurar no Google Cloud?
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Instruções passo a passo expansíveis */}
        {showInstructions && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4 text-xs text-muted-foreground space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <ShieldCheck className="h-4 w-4" /> Passo a Passo Rápido (Google Cloud Console):
            </div>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              <li>
                Acesse o{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLink className="h-3 w-3 inline" />
                </a>{" "}
                e selecione ou crie um projeto gratuito.
              </li>
              <li>Em <b>APIs e Serviços &gt; Biblioteca</b>, ative a <b>Google Calendar API</b>.</li>
              <li>
                Em <b>Credenciais &gt; Criar Credenciais &gt; ID do cliente OAuth</b>:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-foreground/80">
                  <li>Tipo de aplicativo: <b>Aplicativo da Web</b></li>
                  <li>Nome: <b>Eia Link Agenda</b></li>
                  <li>
                    Em <b>URIs de redirecionamento autorizados</b>, adicione a URL abaixo:
                  </li>
                </ul>
              </li>
              <li>Copie o <b>Client ID</b> e o <b>Client Secret</b> gerados e cole nos campos abaixo.</li>
            </ol>
          </div>
        )}

        {/* URI de Redirecionamento com Cópia Rápida */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>URI de Redirecionamento Autorizado (Cole no Google Cloud Console)</span>
            <span className="text-[11px] text-muted-foreground font-normal">Exigido pelo Google</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={redirectUri}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyRedirect}
              className="shrink-0 h-8 gap-1.5 text-xs"
            >
              {copiedRedirect ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Formulário de Credenciais */}
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Google Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ex.: 123456789-abc.apps.googleusercontent.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Google Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Cole o Client Secret aqui"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors"
              />
            </div>
          </div>

          {isFromEnv && (
            <p className="text-[11px] text-muted-foreground">
              💡 As variáveis de ambiente do servidor já possuem um Client ID configurado.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold h-8 px-4 gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Salvar Credenciais da API
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

