import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { ReactNode } from "react";
import { layoutResolver } from "../layouts/LayoutResolver";

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
  const model = TemplateService.render(data, bio.template_id ?? undefined);
  const layout = layoutResolver.resolve(model);
  return (
    <main
      className={`bio-theme ${bio.theme || "aurora"} public-profile-shell`}
      style={{ fontFamily: model.theme.typography.fontFamily }}
    >
      {layout?.render(model, { bio, links, onTrack, onShare })}
      {supplemental}
    </main>
  );
}
