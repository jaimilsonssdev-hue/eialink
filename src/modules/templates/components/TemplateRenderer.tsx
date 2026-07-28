import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { Banner } from "@/components/public-profile/Banner";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { ReactNode } from "react";

export function TemplateRenderer({
  bio,
  links,
  onTrack,
  onShare,
  supplemental,
}: {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  onShare: () => void;
  supplemental?: ReactNode;
}) {
  const data: PageData = {
    profile: { name: bio.display_name, description: bio.description, avatarUrl: bio.avatar_url },
    appearance: { coverUrl: bio.cover_url },
    links: links.map((link) => ({ id: link.id, title: link.title, url: link.url })),
    socials: { instagram: bio.instagram ?? undefined },
    whatsapp: bio.whatsapp,
    pix: bio.pix_key,
  };
  const model = TemplateService.render(data, bio.template_id);
  return (
    <main
      className={`bio-theme ${bio.theme || "aurora"} public-profile-shell`}
      style={{ fontFamily: model.theme.typography.fontFamily }}
    >
      <Banner
        name={bio.display_name}
        coverUrl={bio.cover_url}
        coverPosition={bio.cover_position}
        coverFit={bio.cover_fit}
        overlay={bio.cover_overlay}
        overlayOpacity={bio.cover_overlay_opacity}
        onShare={onShare}
      />
      <div className="public-profile-content">
        <ProfileHeader bio={bio} onTrack={onTrack} />
        {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={onTrack} />}
        <ActionButtons bio={bio} links={links} onTrack={onTrack} />
        {supplemental}
        <Footer />
      </div>
    </main>
  );
}
