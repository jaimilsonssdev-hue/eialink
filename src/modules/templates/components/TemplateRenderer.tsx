import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import type { CatalogItem } from "@/modules/products/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { CSSProperties, ReactNode } from "react";
import { layoutResolver } from "../layouts/LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PublicSocialLinks } from "@/components/public-profile/PublicSocialLinks";
import { smartTemplateRegistry } from "../smart/SmartTemplateRegistry";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import { safeExternalUrl } from "@/lib/safe-url";

const NICHE_FALLBACK_COVERS: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  clinic: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
  academy: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  law: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  store: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  spotlight: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
  creator: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  business: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
};

function getFallbackCover(templateId: string) {
  if (templateId.includes("restaurant")) return NICHE_FALLBACK_COVERS.restaurant;
  if (templateId.includes("clinic")) return NICHE_FALLBACK_COVERS.clinic;
  if (templateId.includes("academy") || templateId.includes("gym")) return NICHE_FALLBACK_COVERS.academy;
  if (templateId.includes("law")) return NICHE_FALLBACK_COVERS.law;
  if (templateId.includes("store")) return NICHE_FALLBACK_COVERS.store;
  if (templateId.includes("beauty")) return NICHE_FALLBACK_COVERS.beauty;
  if (templateId.includes("spotlight") || templateId.includes("neon")) return NICHE_FALLBACK_COVERS.spotlight;
  if (templateId.includes("creator")) return NICHE_FALLBACK_COVERS.creator;
  if (templateId.includes("business")) return NICHE_FALLBACK_COVERS.business;
  return NICHE_FALLBACK_COVERS.business;
}

export function TemplateRenderer({
  bio,
  links,
  onTrack,
  onShare,
  products,
  bookingUrl,
  supplemental,
  motionLevel = "standard",
}: {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  onShare: () => void;
  products?: CatalogItem[];
  bookingUrl?: string;
  supplemental?: ReactNode;
  /** Public pages keep essential feedback for everyone; Pro unlocks ambient presentation motion. */
  motionLevel?: "off" | "standard" | "pro";
}) {
  const safeLinks = links
    .map((link) => ({ ...link, url: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { url: string } => Boolean(link.url));
  const safeProducts = products?.map((product) => ({
    ...product,
    button_url: safeExternalUrl(product.button_url) ?? null,
  }));
  const data: PageData = {
    profile: { name: bio.display_name, description: bio.description, avatarUrl: bio.avatar_url },
    appearance: { coverUrl: bio.cover_url },
    links: safeLinks.map((link) => ({ id: link.id, title: link.title, url: link.url })),
    socials: {
      ...(bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links)
        ? bio.social_links
        : {}),
      instagram:
        (bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links) && typeof bio.social_links.instagram === "string"
          ? bio.social_links.instagram
          : bio.instagram) ?? undefined,
    },
    whatsapp: bio.whatsapp,
    pix: bio.pix_key,
  };
  const model = TemplateService.render(data, bio.template_id ?? undefined);
  const layout = layoutResolver.resolve(model);
  const fallbackCover = getFallbackCover(model.template.id);
  const renderedBio = bio.cover_url || !fallbackCover ? bio : { ...bio, cover_url: fallbackCover };
  const smartSupplemental =
    safeProducts && safeProducts.length > 0 ? (
      <>
        <CatalogSection items={safeProducts} whatsapp={bio.whatsapp} />
        {supplemental}
      </>
    ) : (
      supplemental
    );
  return (
    <main
      className={`bio-theme ${bio.theme || "aurora"} public-profile-shell`}
      data-template={bio.template_id ?? "default"}
      data-layout={model.template.layout}
      data-template-layout={model.template.layout}
      data-motion={motionLevel}
      data-motion-entrance={bio.motion_enabled === false ? "none" : bio.motion_entrance ?? "gentle"}
      data-motion-cta={bio.motion_enabled === false ? "none" : bio.motion_cta ?? "none"}
      data-motion-ambient={bio.motion_enabled === false ? "none" : bio.motion_ambient ?? "soft"}
      style={
        {
          fontFamily: model.theme.typography.fontFamily,
          "--template-bg": model.theme.colors.background,
          "--template-surface": model.theme.colors.surface,
          "--template-text": model.theme.colors.text,
          "--template-muted": model.theme.colors.muted,
          "--template-primary": model.theme.colors.primary,
        } as CSSProperties
      }
    >
      {model.template.smart?.niche === "restaurant" ? (
        smartTemplateRegistry.render(model.template.smart, {
          bio: renderedBio,
          links: safeLinks,
          onTrack,
          onShare,
          products: safeProducts,
          supplemental: smartSupplemental,
        })
      ) : (
        <>
          {layout?.render(model, { bio: renderedBio, links: safeLinks, onTrack, onShare, products: safeProducts, bookingUrl, supplemental })}
          <PublicSocialLinks bio={renderedBio} onTrack={onTrack} />
          {!model.template.components.includes("footer") && <Footer />}
        </>
      )}
    </main>
  );
}

