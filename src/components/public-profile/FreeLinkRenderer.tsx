import type { ReactNode } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { CatalogItem } from "@/modules/products/types";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import { safeExternalUrl } from "@/lib/safe-url";
import { ActionButtons } from "./ActionButtons";
import { Banner } from "./Banner";
import { Footer } from "./Footer";
import { PixCard } from "./PixCard";
import { ProfileHeader } from "./ProfileHeader";
import { PublicSocialLinks } from "./PublicSocialLinks";
import type { PublicBio, PublicLink, TrackEvent } from "./types";

/** Compact, mobile-first public presence used by the free Eialink plan. */
export function FreeLinkRenderer({
  bio,
  links,
  products = [],
  onTrack,
  onShare,
  supplemental,
}: {
  bio: PublicBio;
  links: PublicLink[];
  products?: CatalogItem[];
  onTrack: TrackEvent;
  onShare: () => void;
  supplemental?: ReactNode;
}) {
  const safeLinks = links
    .map((link) => ({ ...link, url: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { url: string } => Boolean(link.url));
  const safeProducts = products.slice(0, 3).map((product) => ({
    ...product,
    button_url: safeExternalUrl(product.button_url) ?? null,
  }));

  return (
    <main className={`bio-theme ${bio.theme || "aurora"} free-link-shell`}>
      <div className="free-link-frame">
        <Banner
          coverUrl={bio.cover_url}
          coverPosition={bio.cover_position ?? "center"}
          coverFit={bio.cover_fit ?? "cover"}
          overlay={bio.cover_overlay ?? true}
          overlayOpacity={bio.cover_overlay_opacity ?? 45}
          name={bio.display_name}
          onShare={onShare}
        />

        <div className="free-link-card">
          <ProfileHeader bio={bio} onTrack={onTrack} />
          <ActionButtons bio={bio} links={safeLinks} onTrack={onTrack} />
          <PublicSocialLinks bio={bio} onTrack={onTrack} />
          {safeProducts.length > 0 && <CatalogSection items={safeProducts} />}
          {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={onTrack} />}
          {supplemental}

          <a href="/#precos" className="free-link-upgrade">
            <span className="free-link-upgrade-icon">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <strong>Quer uma presença ainda mais completa?</strong>
              <small>Conheça o mini-site Eialink Pro</small>
            </span>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>

          <Footer />
        </div>
      </div>
    </main>
  );
}
