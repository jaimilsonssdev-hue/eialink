import { useState, useEffect } from "react";
import {
  Camera,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PlugZap,
  Save,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSavedApifyToken,
  saveApifyToken,
  removeApifyToken,
  testApifyToken,
  APIFY_TOKEN_UPDATED_EVENT,
} from "@/modules/prospecting/ApifyInstagramService";

export function ApifyAdminCard() {
  const [token, setToken] = useState("");
  const [masked, setMasked] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [accountInfo, setAccountInfo] = useState<string | null>(null);

  useEffect(() => {
    function loadToken() {
      const saved = getSavedApifyToken() || "";
      if (saved) {
        setToken(saved);
        setMasked(saved.slice(0, 10) + "•".repeat(Math.max(0, saved.length - 14)) + saved.slice(-4));
        setConfigured(true);
      } else {
        setToken("");
        setMasked("");
        setConfigured(false);
      }
    }
    loadToken();

    window.addEventListener(APIFY_TOKEN_UPDATED_EVENT, loadToken);
    return () => window.removeEventListener(APIFY_TOKEN_UPDATED_EVENT, loadToken);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const clean = token.trim();
    if (!clean) {
      toast.error("Informe o token da API Apify.");
      return;
    }
    setSaving(true);
    try {
      saveApifyToken(clean);
      setConfigured(true);
      setMasked(clean.slice(0, 10) + "•".repeat(Math.max(0, clean.length - 14)) + clean.slice(-4));
      toast.success("Token da Apify salvo com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar o token.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    const targetToken = token.trim() || getSavedApifyToken() || "";
    if (!targetToken) {
      toast.error("Informe um token para testar.");
      return;
    }
    setTesting(true);
    setAccountInfo(null);
    try {
      const res = await testApifyToken(targetToken);
      if (res.ok) {
        toast.success(res.message);
        if (res.username) setAccountInfo(res.username);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao testar conexão com a Apify.");
    } finally {
      setTesting(false);
    }
  }

  function handleRemove() {
    if (confirm("Deseja remover o token da Apify salvo? O sistema deixará de raspar fotos autênticas do Instagram.")) {
      removeApifyToken();
      setToken("");
      setMasked("");
      setConfigured(false);
      setAccountInfo(null);
      toast.success("Token da Apify removido.");
    }
  }

  return (
    <Card className="rounded-xl border border-amber-500/30 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-amber-500/[0.03] border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  Apify Instagram Scraper (Fotos Reais do Feed)
                </CardTitle>
                {configured ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[11px]">
                    Configuração Necessária
                  </Badge>
                )}
                {accountInfo && (
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30 text-[11px]">
                    Conta: {accountInfo}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Raspa as fotos em alta resolução do feed do Instagram do cliente, avatar em HD, biografia e telefone comercial para gerar sites 100% autênticos com as fotos reais do estabelecimento.
              </CardDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Como pegar o token grátis?
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {showInstructions && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs text-muted-foreground space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Sparkles className="h-4 w-4" /> Passo a passo gratuito na Apify:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              <li>
                Acesse o console oficial em{" "}
                <a
                  href="https://console.apify.com/account/integrations"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                >
                  console.apify.com/account/integrations <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Faça login (pode usar sua conta Google ou GitHub). A Apify disponibiliza <strong>US$ 5,00 grátis todo mês</strong>.</li>
              <li>Na aba <strong>"API tokens"</strong>, copie seu <strong>Personal API token</strong> (começa com <code>apify_api_...</code>).</li>
              <li>Cole no campo abaixo e clique em <strong>Salvar Token</strong>.</li>
            </ol>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>O token fica seguro no seu navegador e é compartilhado automaticamente com todas as ferramentas de prospecção e IA.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Personal API Token da Apify</span>
              {configured && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {masked}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu token aqui (ex: apify_api_...)"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title={showPassword ? "Ocultar token" : "Mostrar token"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="submit"
              disabled={saving || !token.trim()}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-zinc-950 font-bold text-xs h-8 px-4"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar Token
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing || (!token.trim() && !configured)}
              onClick={handleTest}
              className="text-xs h-8"
            >
              {testing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Testando conexão...
                </>
              ) : (
                <>
                  <PlugZap className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Testar Conexão
                </>
              )}
            </Button>

            {configured && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs h-8 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-400" /> Remover
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
