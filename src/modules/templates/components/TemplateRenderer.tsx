import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import type { CatalogItem } from "@/modules/products/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { CSSProperties, ReactNode } from "react";
import { layoutResolver } from "../layouts/LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { smartTemplateRegistry } from "../smart/SmartTemplateRegistry";
import { CatalogSection } from "@/modules/products/components/CatalogSection";

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
  const smartSupplemental =
    products && products.length > 0 ? (
      <>
        <CatalogSection items={products} />
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
          bio,
          links,
          onTrack,
          onShare,
          products,
          supplemental: smartSupplemental,
        })
      ) : (
        <>
          {layout?.render(model, { bio, links, onTrack, onShare, products, supplemental })}
          {!model.template.components.includes("footer") && <Footer />}
        </>
      )}
    </main>
  );
}
