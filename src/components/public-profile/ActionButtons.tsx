import { ArrowUpRight, ExternalLink, MessageCircle } from "lucide-react";
import type { PublicBio, PublicLink, TrackEvent } from "./types";
import { safeExternalUrl } from "@/lib/safe-url";

interface ActionButtonsProps {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
}

export function ActionButtons({ bio, links, onTrack }: ActionButtonsProps) {
  return (
    <section className="public-profile-actions" aria-label="Links e formas de contato">
      {bio.whatsapp && (
        <a
          href={`https://wa.me/${bio.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("whatsapp_click")}
          className="public-profile-action public-profile-action-whatsapp"
        >
          <span className="public-profile-action-icon">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block font-semibold">Falar no WhatsApp</span>
            <span className="block text-xs opacity-80">Resposta rápida</span>
          </span>
          <ArrowUpRight className="h-5 w-5 opacity-80" aria-hidden />
        </a>
      )}

      {links.map((link) => {
        const href = safeExternalUrl(link.url);
        if (!href) return null;
        return (
        <a
          key={link.id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("link_click", link.id)}
          className="public-profile-action"
        >
          <span className="public-profile-action-icon">
            <ExternalLink className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-semibold">{link.title}</span>
          <ArrowUpRight className="h-5 w-5 public-profile-action-arrow" aria-hidden />
        </a>
      );
      })}
    </section>
  );
}
