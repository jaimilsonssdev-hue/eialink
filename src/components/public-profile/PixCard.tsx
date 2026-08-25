import { Check, Copy, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import type { TrackEvent } from "./types";

interface PixCardProps {
  pixKey: string;
  onTrack: TrackEvent;
}

export function PixCard({ pixKey, onTrack }: PixCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [qrAvailable, setQrAvailable] = useState(true);
  const pixValueRef = useRef<HTMLParagraphElement>(null);
  const isPixPayload = /^000201/.test(pixKey.trim());
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&margin=0&data=${encodeURIComponent(pixKey)}`;

  async function copyPix() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(pixKey);
      setCopyState("copied");
      onTrack("pix_click");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
      const selection = window.getSelection();
      const range = document.createRange();
      if (selection && pixValueRef.current) {
        range.selectNodeContents(pixValueRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  return (
    <section className="public-profile-pix" aria-label="Pagamento por Pix">
      <div className="flex items-start gap-3">
        <span className="public-profile-pix-icon">
          <QrCode className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">Pix</h2>
          <p className="mt-0.5 text-sm text-[var(--bio-muted)]">
            {isPixPayload
              ? "Escaneie o QR Code ou copie o código."
              : "Copie a chave para pagar no aplicativo do seu banco."}
          </p>
          <p
            ref={pixValueRef}
            className="mt-3 break-all rounded-xl bg-black/10 px-3 py-2 text-sm font-medium"
            title={pixKey}
          >
            {pixKey}
          </p>
        </div>
        {isPixPayload && qrAvailable && (
          <img
            src={qrCodeUrl}
            alt="QR Code para pagamento Pix"
            width="80"
            height="80"
            loading="lazy"
            className="public-profile-qr"
            onError={() => setQrAvailable(false)}
          />
        )}
      </div>
      <button type="button" onClick={copyPix} className="public-profile-copy-pix">
        {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copyState === "copied"
          ? "Pix copiado"
          : isPixPayload
            ? "Copiar Pix Copia e Cola"
            : "Copiar chave Pix"}
      </button>
      {copyState === "error" && (
        <p role="status" className="mt-2 text-xs text-[var(--bio-muted)]">
          A cópia automática foi bloqueada. O conteúdo foi selecionado; toque e segure para copiar.
        </p>
      )}
      {isPixPayload && !qrAvailable && (
        <p role="status" className="mt-2 text-xs text-[var(--bio-muted)]">
          O QR Code não carregou. Use o botão para copiar o Pix.
        </p>
      )}
    </section>
  );
}
