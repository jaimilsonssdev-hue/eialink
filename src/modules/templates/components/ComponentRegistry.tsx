import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { Banner } from "@/components/public-profile/Banner";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import type { ReactNode } from "react";
import type { TemplateComponentType } from "../types";

export type TemplateComponentContext = {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  onShare: () => void;
};
type Renderer = (context: TemplateComponentContext) => ReactNode;
export class ComponentRegistry {
  private readonly values = new Map<TemplateComponentType, Renderer>();
  register(id: TemplateComponentType, renderer: Renderer) {
    this.values.set(id, renderer);
    return this;
  }
  resolve(id: TemplateComponentType) {
    return this.values.get(id);
  }
  exists(id: TemplateComponentType) {
    return this.values.has(id);
  }
  list() {
    return [...this.values.keys()];
  }
}
export const componentRegistry = new ComponentRegistry()
  .register("banner", ({ bio, onShare }) => (
    <Banner
      name={bio.display_name}
      coverUrl={bio.cover_url}
      coverPosition={bio.cover_position}
      coverFit={bio.cover_fit}
      overlay={bio.cover_overlay}
      overlayOpacity={bio.cover_overlay_opacity}
      onShare={onShare}
    />
  ))
  .register("profile", ({ bio, onTrack }) => <ProfileHeader bio={bio} onTrack={onTrack} />)
  .register("links", ({ bio, links, onTrack }) => (
    <ActionButtons bio={bio} links={links} onTrack={onTrack} />
  ))
  .register("pix", ({ bio, onTrack }) =>
    bio.pix_key ? <PixCard pixKey={bio.pix_key} onTrack={onTrack} /> : null,
  )
  .register("footer", () => <Footer />);
