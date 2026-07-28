import { Share2 } from "lucide-react";

interface BannerProps {
  coverUrl?: string | null;
  coverPosition?: string;
  coverFit?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  name: string;
  onShare: () => void;
}

/** A cover image can be supplied when the profile model gains banner support. */
export function Banner({
  coverUrl,
  coverPosition = "center",
  coverFit = "cover",
  overlay = true,
  overlayOpacity = 45,
  name,
  onShare,
}: BannerProps) {
  return (
    <section className="public-profile-banner" aria-label={`Capa de ${name}`}>
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          className="public-profile-banner-image"
          style={{ objectPosition: coverPosition, objectFit: coverFit as "cover" | "contain" }}
          loading="eager"
          fetchPriority="high"
        />
      )}
      {overlay && (
        <div
          className="public-profile-banner-overlay"
          style={{ opacity: overlayOpacity / 100 }}
          aria-hidden
        />
      )}
      <div className="public-profile-banner-shine" aria-hidden />
      <div className="relative mx-auto flex h-full w-full max-w-2xl justify-end px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={onShare}
          className="public-profile-share"
          aria-label="Compartilhar página"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </button>
      </div>
    </section>
  );
}
