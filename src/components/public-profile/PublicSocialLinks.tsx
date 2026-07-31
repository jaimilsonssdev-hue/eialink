import { Facebook, Globe2, Instagram, Linkedin, Music2, Youtube } from "lucide-react";
import type { PublicBio, TrackEvent } from "./types";
import { socialEntries, type SocialNetwork } from "@/lib/social-links";

const SOCIAL_META: Record<SocialNetwork, { label: string; icon: typeof Instagram }> = {
  instagram: { label: "Instagram", icon: Instagram },
  facebook: { label: "Facebook", icon: Facebook },
  tiktok: { label: "TikTok", icon: Music2 },
  linkedin: { label: "LinkedIn", icon: Linkedin },
  youtube: { label: "YouTube", icon: Youtube },
  website: { label: "Site", icon: Globe2 },
};

export function PublicSocialLinks({ bio, onTrack }: { bio: PublicBio; onTrack: TrackEvent }) {
  const entries = socialEntries(bio.social_links, bio.instagram);
  if (!entries.length) return null;

  return (
    <nav
      className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 px-5 pb-7"
      aria-label="Redes sociais"
    >
      {entries.map(({ network, href }) => {
        const { icon: Icon, label } = SOCIAL_META[network];
        return (
          <a
            key={network}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrack(`${network}_click`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            aria-label={`Abrir ${label}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
