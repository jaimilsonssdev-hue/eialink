import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import type { CatalogItem } from "@/modules/products/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { CSSProperties, ReactNode } from "react";
import { layoutResolver } from "../layouts/LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { smartTemplateRegistry } from "../smart/SmartTemplateRegistry";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import { safeExternalUrl } from "@/lib/safe-url";

const NICHE_FALLBACK_COVERS: Record<string, string> = {
  restaurant: "/template-assets/restaurant-demo-cover.png",
  clinic: "/template-assets/clinic-demo-cover.png",
  academy: "/template-assets/academy-gym-cover.png",
  law: "/template-assets/law-office-cover.png",
  store: "/template-assets/store-demo-cover.png",
  beauty: "/template-assets/beauty-demo-cover.png",
  creator: "/template-assets/creator-demo-cover.png",
  business: "/template-assets/business-demo-cover.png",
};

function getFallbackCover(templateId: string) {
  if (templateId.includes("restaurant")) return NICHE_FALLBACK_COVERS.restaurant;
  if (templateId.includes("clinic")) return NICHE_FALLBACK_COVERS.clinic;
  if (templateId.includes("academy")) return NICHE_FALLBACK_COVERS.academy;
  if (templateId.includes("law")) return NICHE_FALLBACK_COVERS.law;
  if (templateId.includes("store")) return NICHE_FALLBACK_COVERS.store;
  if (templateId.includes("beauty")) return NICHE_FALLBACK_COVERS.beauty;
  if (templateId.includes("creator")) return NICHE_FALLBACK_COVERS.creator;
  if (templateId.includes("business")) return NICHE_FALLBACK_COVERS.business;
  return null;
}

export function TemplateRenderer({
  bio,
  links,
  onTrack,
  onShare,
  products,
  supplemental,
}: {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  onShare: () => void;
  products?: CatalogItem[];
  supplemental?: ReactNode;
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
        <CatalogSection items={safeProducts} />
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
          {layout?.render(model, { bio: renderedBio, links: safeLinks, onTrack, onShare, products: safeProducts, supplemental })}
          {!model.template.components.includes("footer") && <Footer />}
        </>
      )}
    </main>
  );
}
