import { ArrowUpRight, ExternalLink, MessageCircle } from "lucide-react";
import type { PublicBio, PublicLink, TrackEvent } from "./types";
import { safeExternalUrl } from "@/lib/safe-url";
import { whatsappUrl } from "@/lib/whatsapp";

interface ActionButtonsProps {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  linkSectionLabel?: string;
}

export function ActionButtons({ bio, links, onTrack, linkSectionLabel }: ActionButtonsProps) {
  const whatsappHref = whatsappUrl(bio.whatsapp, bio.whatsapp_message);
  const whatsappLabel = bio.whatsapp_button_label?.trim() || "Falar no WhatsApp";
  const whatsappSubtitle = bio.whatsapp_button_subtitle?.trim() || "Resposta rápida";
  const validLinks = links
    .map((link) => ({ ...link, href: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { href: string } => Boolean(link.href));

  // A newly created page can legitimately have no contacts yet. Do not leave
  // an empty action container in either the public page or its live preview.
  if (!whatsappHref && validLinks.length === 0) return null;

  return (
    <section className="public-profile-actions" aria-label="Links e formas de contato">
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("whatsapp_click")}
          className="public-profile-action public-profile-action-whatsapp"
        >
          <span className="public-profile-action-icon">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block font-semibold">{whatsappLabel}</span>
            <span className="block text-xs opacity-80">{whatsappSubtitle}</span>
          </span>
          <ArrowUpRight className="h-5 w-5 opacity-80" aria-hidden />
        </a>
      )}

      {linkSectionLabel && validLinks.length > 0 && (
        <div className="public-profile-link-divider" aria-hidden="true">
          <span />
          <b>{linkSectionLabel}</b>
          <span />
        </div>
      )}

      {validLinks.map((link) => {
        return (
          <a
            key={link.id}
            href={link.href}
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
