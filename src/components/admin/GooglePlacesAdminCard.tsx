import { useEffect, useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Save,
  Loader2,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPlacesApiKeyStatusFn,
  savePlacesApiKeyFn,
  testPlacesApiKeyFn,
} from "@/modules/prospecting/places-admin.functions";

export function GooglePlacesAdminCard() {
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState("");
  const [configured, setConfigured] = useState(false);
  const [isFromEnv, setIsFromEnv] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    getPlacesApiKeyStatusFn()
      .then((res) => {
        setConfigured(Boolean(res.configured));
        setMasked(res.masked || "");
        setIsFromEnv(Boolean(res.isFromEnv));
      })
      .catch((err) => console.warn("Aviso ao carregar chave do Google Places:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await savePlacesApiKeyFn({ data: { apiKey } });
      setConfigured(Boolean(res.configured));
      if (res.configured) {
        setMasked(`${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`);
        setApiKey("");
        setShowKey(false);
        toast.success("Chave do Google Maps salva com sucesso!");
      } else {
        setMasked("");
        toast.success("Chave removida.");
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
      const res = await testPlacesApiKeyFn({ data: {} as never });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Não foi possível testar agora.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="rounded-xl border border-emerald-500/30 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 bg-emerald-500/[0.03] border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  Google Maps & Places
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
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Com a chave salva aqui, o sistema busca nome, endereço, telefone, nota, avaliações e fotos
                reais do Google — funcionando também no seu domínio próprio.
              </CardDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Onde pegar a chave?
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {showInstructions && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-xs text-muted-foreground space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Passo a passo rápido:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              <li>Abra o Google Cloud Console e escolha (ou crie) um projeto.</li>
              <li>
                Em <strong>APIs e serviços &gt; Biblioteca</strong>, ative a <strong>Places API (New)</strong>.
              </li>
              <li>
                Em <strong>Credenciais</strong>, clique em <strong>Criar credenciais &gt; Chave de API</strong>.
              </li>
              <li>
                Copie a chave e cole no campo abaixo. Como a consulta é feita pelo nosso servidor, você
                <strong> não precisa</strong> liberar endereços de site nas restrições.
              </li>
              <li>Clique em Salvar e depois em Testar conexão.</li>
            </ol>
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Abrir Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando configuração...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {configured && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Chave atual: <span className="font-mono text-foreground">{masked}</span>
                {isFromEnv && " (definida no ambiente do servidor)"}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="places-key" className="text-xs font-medium text-foreground">
                Chave da API do Google Maps / Places
              </label>
              <div className="relative">
                <input
                  id="places-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={configured ? "Cole uma nova chave para substituir" : "AIza..."}
                  autoComplete="off"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                A chave fica guardada com segurança no servidor e nunca aparece nas páginas dos clientes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || (!apiKey.trim() && !configured)} size="sm">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" /> Salvar chave
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testing || !configured}
                onClick={handleTest}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Testando...
                  </>
                ) : (
                  <>
                    <PlugZap className="h-4 w-4 mr-1.5" /> Testar conexão
                  </>
                )}
              </Button>

              {configured && !isFromEnv && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={async () => {
                    setApiKey("");
                    setSaving(true);
                    try {
                      await savePlacesApiKeyFn({ data: { apiKey: "" } });
                      setConfigured(false);
                      setMasked("");
                      toast.success("Chave removida.");
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Erro ao remover a chave.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remover
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
