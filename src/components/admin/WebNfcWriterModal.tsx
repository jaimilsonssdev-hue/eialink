import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  RotateCw,
  Zap,
} from "lucide-react";
import { WebNfcService } from "@/modules/nfc/services/WebNfcService";
import { DynamicLinkService } from "@/modules/nfc/services/DynamicLinkService";
import type { DynamicLink } from "@/modules/nfc/types";

interface WebNfcWriterModalProps {
  link: DynamicLink | null;
  isOpen: boolean;
  onClose: () => void;
}

type WriteStatus = "idle" | "ready" | "writing" | "success" | "error";

export function WebNfcWriterModal({ link, isOpen, onClose }: WebNfcWriterModalProps) {
  const [status, setStatus] = useState<WriteStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const shortUrl = link ? DynamicLinkService.getShortUrl(link.code) : "";

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
      setCopied(false);
      setIsSupported(WebNfcService.isSupported());
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  async function handleStartWrite() {
    if (!link) return;
    setStatus("ready");
    setErrorMessage("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setStatus("writing");
      await WebNfcService.writeUrl(shortUrl, {
        signal: abortController.signal,
        overwrite: true,
      });
      setStatus("success");
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        setStatus("error");
        setErrorMessage(
          error.message || "Falha ao gravar na tag NFC. Tente aproximar novamente.",
        );
      } else {
        setStatus("idle");
      }
    } finally {
      abortControllerRef.current = null;
    }
  }

  function handleCancelWrite() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
  }

  function handleCopyUrl() {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!link) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-2xl">
        <DialogHeader className="text-center sm:text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-primary/30 text-primary bg-primary/10"
            >
              Gravação Nativa Web NFC
            </Badge>
            {isSupported ? (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                NFC Disponível no Aparelho
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-400">
                Suportado no Chrome Android
              </span>
            )}
          </div>
          <DialogTitle className="text-lg font-bold">
            Gravar Plaquinha / Tag NFC
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {link.company_name} — Plaquinha <strong>{link.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Caixa de URL Dinâmica */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              URL Dinâmica que será gravada no chip:
            </span>
            <div className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2 font-mono text-[11px] text-primary select-all">
              <span className="truncate">{shortUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="Copiar URL"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Destino atual: <span className="text-foreground">{link.target_url || "Configurado"}</span>
            </p>
          </div>

          {/* Estado de Suporte Nativo Web NFC */}
          {isSupported ? (
            <div className="space-y-4 text-center">
              {status === "idle" && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Radio className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Pronto para Gravar</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Clique no botão abaixo e encoste a plaquinha ou cartão de acrílico na traseira do celular.
                    </p>
                  </div>
                  <Button
                    onClick={handleStartWrite}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Iniciar Gravação NFC Agora
                  </Button>
                </div>
              )}

              {(status === "ready" || status === "writing") && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative flex items-center justify-center h-24 w-24">
                    <span className="absolute h-full w-full rounded-full bg-primary/20 animate-ping" />
                    <span className="absolute h-20 w-20 rounded-full bg-primary/30 animate-pulse" />
                    <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white shadow-lg">
                      <Smartphone className="h-8 w-8 animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-primary">
                      Aproxime a Plaquinha NFC
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Encoste a plaquinha de acrílico ou adesivo NFC na parte traseira do seu celular e segure por 1 segundo...
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelWrite}
                    className="text-xs rounded-lg"
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {status === "success" && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-emerald-400">
                      Plaquinha Gravada com Sucesso!
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      O chip NFC foi programado com sucesso. Qualquer celular que encostar nela abrirá o link dinâmico automaticamente.
                    </p>
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    <Button
                      variant="outline"
                      onClick={handleStartWrite}
                      className="flex-1 text-xs rounded-xl"
                    >
                      <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                      Gravar Outra
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Concluir
                    </Button>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-rose-400">
                      Não foi possível gravar
                    </h4>
                    <p className="text-xs text-rose-300/90 bg-rose-500/10 p-3 rounded-lg max-w-xs">
                      {errorMessage}
                    </p>
                  </div>
                  <Button
                    onClick={handleStartWrite}
                    className="w-full text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Fallback informativo para Desktop / iPhone / Outros Navegadores */
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <Smartphone className="h-4 w-4 shrink-0" />
                  <span>Dica para Gravação 100% Nativa</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Para gravar <strong>direto pelo navegador sem nenhum app</strong>, abra esta mesma tela no <strong>Google Chrome do seu celular Android</strong> (com NFC ativado).
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold block text-foreground">
                  Opção 2: Gravação via App NFC Tools (iPhone ou Android)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-[11px]">
                  <li>
                    Clique no botão abaixo para copiar a URL curta dinâmica.
                  </li>
                  <li>
                    Abra o app <strong>NFC Tools</strong> (grátis na Play Store e App Store).
                  </li>
                  <li>
                    Toque em <strong>Escrever &gt; Adicionar um registro &gt; URL/URI</strong> e cole.
                  </li>
                  <li>
                    Toque em <strong>Escrever</strong> e encoste a plaquinha de acrílico.
                  </li>
                </ol>
              </div>

              <Button
                onClick={handleCopyUrl}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    URL Curta Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar URL para NFC Tools
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
