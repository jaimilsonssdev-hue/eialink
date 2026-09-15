import { memo } from "react";
import { CalendarCheck, MessageCircle, Phone, Share2 } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import type { PublicBio, TrackEvent } from "./types";

interface MobileStickyBarProps {
  bio: PublicBio;
  bookingUrl?: string;
  onTrack?: TrackEvent;
  onShare?: () => void;
}

export const MobileStickyBar = memo(function MobileStickyBar({
  bio,
  bookingUrl,
  onTrack,
  onShare,
}: MobileStickyBarProps) {
  const whats = bio.whatsapp?.replace(/\D/g, "");
  const phone = (bio as any).phone?.replace(/\D/g, "");
  const hasAction = Boolean(whats || bookingUrl);

  if (!hasAction) return null;

  const mainLabel = bookingUrl
    ? "Agendar Horário Online"
    : bio.whatsapp_button_label || "Chamar no WhatsApp";

  const mainHref = bookingUrl
    ? bookingUrl
    : whats
      ? whatsappUrl(whats, bio.whatsapp_message || `Olá! Vim pelo link oficial da ${bio.display_name}.`)
      : "#";

  const handleMainClick = () => {
    if (bookingUrl) {
      onTrack?.("booking_click");
    } else {
      onTrack?.("whatsapp_click");
    }
  };

  return (
    <aside
      aria-label="Ações rápidas de contato"
      className="fixed bottom-0 inset-x-0 z-50 p-2.5 sm:hidden bg-background/95 backdrop-blur-xl border-t border-border/60 shadow-[0_-8px_30px_rgb(0,0,0,0.15)] flex items-center gap-2"
    >
      {/* Botão Principal de Conversão com Brilho Sutil */}
      <a
        href={mainHref}
        target={bookingUrl ? "_self" : "_blank"}
        rel="noreferrer"
        onClick={handleMainClick}
        className={`relative flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-[0.98] ${
          bookingUrl
            ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-primary text-white shadow-purple-500/25"
            : "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-emerald-600/30"
        }`}
      >
        {/* Shimmer / Brilho suave */}
        <span
          className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        {bookingUrl ? (
          <CalendarCheck className="h-4 w-4 shrink-0 animate-bounce" />
        ) : (
          <MessageCircle className="h-4 w-4 shrink-0 fill-current" />
        )}
        <span className="truncate">{mainLabel}</span>
      </a>

      {/* Botão Secundário: Ligar ou Compartilhar */}
      {phone ? (
        <a
          href={`tel:${phone}`}
          aria-label="Ligar para a empresa"
          className="h-12 w-12 rounded-xl border border-border/60 bg-card flex items-center justify-center text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0"
        >
          <Phone className="h-4 w-4 text-primary" />
        </a>
      ) : onShare ? (
        <button
          type="button"
          onClick={onShare}
          aria-label="Compartilhar página"
          className="h-12 w-12 rounded-xl border border-border/60 bg-card flex items-center justify-center text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0"
        >
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : null}
    </aside>
  );
});

