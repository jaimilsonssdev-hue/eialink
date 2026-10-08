import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Save,
  Loader2,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getGeminiApiKeyStatusFn,
  saveGeminiApiKeyFn,
  testGeminiApiKeyFn,
} from "@/modules/ai/gemini-admin.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GoogleGeminiAdminCard() {
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState("");
  const [configured, setConfigured] = useState(false);
  const [isFromEnv, setIsFromEnv] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [canManage, setCanManage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        // Permite gerenciar se estiver autenticado no painel
        setCanManage(Boolean(user));

        // 1. Busca status seguro do servidor (banco de dados / service role)
        const statusRes = await getGeminiApiKeyStatusFn();
        if (statusRes && statusRes.configured) {
          setConfigured(true);
          setMasked(statusRes.masked);
          setIsFromEnv(Boolean(statusRes.isFromEnv));
        } else {
          // 2. Fallback de verificação local do operador
          const localKey =
            typeof window !== "undefined"
              ? localStorage.getItem("eialink_gemini_api_key") ||
                localStorage.getItem("openpage-gemini-key")
              : null;
          if (localKey && localKey.trim().length > 8) {
            setConfigured(true);
            const clean = localKey.trim();
            setMasked(`${clean.slice(0, 4)}••••••••${clean.slice(-4)}`);
          } else {
            setConfigured(false);
            setMasked("");
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido.";
        console.warn("[GoogleGeminiAdminCard] Falha ao consultar status:", message);
        // Fallback local caso a rede falhe
        const localKey =
          typeof window !== "undefined" ? localStorage.getItem("eialink_gemini_api_key") : null;
        if (localKey && localKey.trim().length > 8) {
          setConfigured(true);
          const clean = localKey.trim();
          setMasked(`${clean.slice(0, 4)}••••••••${clean.slice(-4)}`);
        } else {
          setStatusError(`Não foi possível verificar a configuração Gemini: ${message}`);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadStatus();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusError("");
    try {
      const clean = apiKey.trim();
      if (typeof window !== "undefined") {
        if (clean) {
          localStorage.setItem("eialink_gemini_api_key", clean);
          localStorage.setItem("openpage-gemini-key", clean);
        } else {
          localStorage.removeItem("eialink_gemini_api_key");
          localStorage.removeItem("openpage-gemini-key");
        }
      }

      // Salva no banco de dados através da server function com validação do Google AI Studio
      const res = await saveGeminiApiKeyFn({ data: { apiKey: clean } });
      setConfigured(res.configured);
      if (res.configured) {
        const newMask = res.masked || `${clean.slice(0, 4)}••••••••${clean.slice(-4)}`;
        setMasked(newMask);
        setApiKey("");
        setShowKey(false);
        toast.success(
          res.message || "Chave do Google Gemini (3.8 Flash) validada e gravada no banco de dados!",
        );
      } else {
        setMasked("");
        toast.success("Chave removida do banco de dados.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar a chave.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await testGeminiApiKeyFn({
        data: { apiKey: apiKey.trim() || undefined },
      });
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Não foi possível testar agora.");
    } finally {
      setTesting(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eialink_gemini_api_key");
        localStorage.removeItem("openpage-gemini-key");
      }
      await saveGeminiApiKeyFn({ data: { apiKey: "" } });
      setConfigured(false);
      setMasked("");
      setApiKey("");
      toast.info("Chave do Gemini removida do banco de dados.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover chave.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-xl border border-amber-500/30 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-amber-500/[0.03] border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  Google Gemini AI (Cérebro Generativo)
                </CardTitle>
                {configured ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo no Banco
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-amber-400 border-amber-500/30 text-[11px]"
                  >
                    Não Configurado
                  </Badge>
                )}
                {isFromEnv && (
                  <Badge variant="secondary" className="text-[10px]">
                    .env
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Alimenta o Agente Copiloto do Studio, auditoria de empresas e geração criativa com
                IA em toda a plataforma.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions((prev) => !prev)}
            className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1.5"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showInstructions ? "Ocultar instruções" : "Como obter chave gratuita"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {statusError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            {statusError}
          </p>
        )}
        {!loading && !canManage && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
            Somente o superadministrador pode alterar a chave Gemini.
          </p>
        )}
        {showInstructions && (
          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-xs space-y-2 text-muted-foreground animate-in fade-in-50 duration-200">
            <p className="font-semibold text-foreground">
              Como obter sua chave no Google AI Studio (100% gratuita):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>
                Acesse o{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline inline-flex items-center gap-0.5 font-medium"
                >
                  Google AI Studio <ExternalLink className="h-3 w-3 inline" />
                </a>{" "}
                e faça login com sua conta Google.
              </li>
              <li>
                Clique no botão azul <strong>"Create API key"</strong>.
              </li>
              <li>Copie a chave gerada e cole no campo abaixo.</li>
            </ol>
            <div className="pt-2 text-[11px] border-t border-border/60 flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                A chave é gravada diretamente no banco de dados com segurança do lado do servidor.
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Verificando credenciais no banco de dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            {configured && masked && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Chave ativa no banco:</span>
                <span className="font-mono text-emerald-400 text-xs font-semibold">{masked}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="gemini-admin-key" className="text-xs font-medium text-foreground">
                {configured
                  ? "Substituir chave existente"
                  : "Cole a Chave da API do Google AI Studio"}
              </label>
              <div className="relative">
                <input
                  id="gemini-admin-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!canManage}
                  placeholder={
                    configured ? "Cole uma nova chave para atualizar" : "Cole sua chave aqui..."
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                {configured && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    disabled={saving || !canManage}
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remover</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={!canManage || testing || (!apiKey.trim() && !configured)}
                  className="text-xs gap-1.5"
                >
                  {testing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                  <span>Testar Conexão</span>
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!canManage || saving || !apiKey.trim()}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Salvar no Banco</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
