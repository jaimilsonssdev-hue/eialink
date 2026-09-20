import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2 } from "lucide-react";

interface PwaInstallBannerProps {
  companyName: string;
  avatarUrl?: string | null;
}

export function PwaInstallBanner({ companyName, avatarUrl }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como PWA instalado (standalone)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Detecta se é mobile e se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /iphone|ipad|ipod|android|mobile|touch/.test(userAgent);
    setIsIos(isIosDevice);
    setIsMobileDevice(isMobile);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (isStandalone || isDismissed) return null;
  // Exibe se houver evento nativo de instalação, se for iOS ou se for dispositivo móvel
  if (!deferredPrompt && !isIos && !isMobileDevice) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
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
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-primary/30 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 font-black text-sm shadow-xs">
                📲
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold truncate flex items-center gap-1.5">
                <span>Instalar App de {companyName}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                  Logo & Nome Oficial
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Acesse direto da sua tela inicial com ícone exclusivo
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Fechar banner de instalação"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal com Instruções de Instalação (iOS ou Android sem prompt nativo) */}
      {showInstructions && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInstructions(false);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-3xl bg-surface-elevated p-6 border border-border text-foreground space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm">Instalar Aplicativo Oficial</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview do App que será instalado na tela do celular */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={companyName}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-primary/40 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 font-black text-lg">
                  📲
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{companyName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Ícone personalizado pronto para download
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ícone e Nome Oficiais</span>
                </span>
              </div>
            </div>

            {isIos ? (
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <Share size={18} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    1. Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <PlusSquare size={18} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    2. Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
                <p className="text-center text-[11px] text-muted-foreground pt-1">
                  O ícone oficial de <strong>{companyName}</strong> aparecerá na tela do seu iPhone.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <span className="text-primary font-bold text-base leading-none shrink-0 mt-0.5">⋮</span>
                  <p>
                    1. Toque nos <strong>3 pontinhos</strong> no canto superior direito do Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <Download size={18} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                </div>
                <p className="text-center text-[11px] text-muted-foreground pt-1">
                  O app de <strong>{companyName}</strong> será instalado com a sua marca na tela inicial.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
