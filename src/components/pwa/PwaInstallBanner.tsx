import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

interface PwaInstallBannerProps {
  companyName: string;
  avatarUrl?: string | null;
}

export function PwaInstallBanner({ companyName, avatarUrl }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando como PWA instalado (standalone)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (isStandalone || isDismissed) return null;
  // Exibe se houver suporte nativo (Chrome/Android) ou se for dispositivo iOS
  if (!deferredPrompt && !isIos) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosInstructions(true);
    }
  };

  return (
    <>
      <aside
        className="w-full max-w-2xl mx-auto px-4 py-2 my-2 transition-all animate-in fade-in slide-in-from-top-2"
        aria-label="Instalação do Aplicativo"
      >
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-elevated/95 border border-primary/30 shadow-lg text-foreground backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={companyName}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 font-black text-sm">
                📲
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Instalar App de {companyName}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Peça mais rápido e acesse direto da sua tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 transition-all active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              <span>Instalar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar banner de instalação"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal com Instruções para iOS */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-surface-elevated p-6 border border-border text-foreground space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Como instalar no seu iPhone</h4>
              <button
                type="button"
                onClick={() => setShowIosInstructions(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <Share size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  1. Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <PlusSquare size={18} className="text-primary shrink-0 mt-0.5" />
                <p>
                  2. Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
              <p className="text-center text-[11px] text-muted-foreground pt-1">
                Pronto! O ícone da loja aparecerá como um aplicativo no seu celular.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIosInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

