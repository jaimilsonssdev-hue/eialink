import { Check, Copy, QrCode } from "lucide-react";
import { useState } from "react";
import type { TrackEvent } from "./types";

interface PixCardProps {
  pixKey: string;
  onTrack: TrackEvent;
}

export function PixCard({ pixKey, onTrack }: PixCardProps) {
  const [copied, setCopied] = useState(false);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&margin=0&data=${encodeURIComponent(pixKey)}`;

  async function copyPix() {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    onTrack("pix_click");
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="public-profile-pix" aria-label="Pagamento por Pix">
      <div className="flex items-start gap-3">
        <span className="public-profile-pix-icon">
          <QrCode className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">Pague com Pix</h2>
          <p className="mt-0.5 text-sm text-[var(--bio-muted)]">
            Escaneie o QR Code ou copie a chave.
          </p>
          <p
            className="mt-3 break-all rounded-xl bg-black/10 px-3 py-2 text-sm font-medium"
            title={pixKey}
          >
            {pixKey}
          </p>
        </div>
        <img
          src={qrCodeUrl}
          alt="QR Code para pagamento Pix"
          width="80"
          height="80"
          loading="lazy"
          className="public-profile-qr"
        />
      </div>
      <button type="button" onClick={copyPix} className="public-profile-copy-pix">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Chave Pix copiada" : "Copiar chave Pix"}
      </button>
    </section>
  );
}
