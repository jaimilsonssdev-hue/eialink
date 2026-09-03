import type { ReactNode } from "react";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { PixCard } from "@/components/public-profile/PixCard";
import { Footer } from "@/components/public-profile/Footer";
import { CatalogSection } from "@/modules/products/components/CatalogSection";

/**
 * Spotlight: dark editorial bio-link with neon accents, a highlighted WhatsApp
 * card, a labelled link section and a products/services showcase.
 */
export class SpotlightLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "spotlight" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "spotlight";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, products = [], supplemental } = ctx;
    const items = products.filter((item) => item.active);
    return (
      <div className="spotlight-shell">
        <div className="spotlight-frame">
          <ProfileHeader bio={bio} onTrack={onTrack} />
          <ActionButtons
            bio={bio}
            links={links}
            onTrack={onTrack}
            linkSectionLabel="Links e conteúdos"
          />
          {items.length > 0 && <CatalogSection items={items} whatsapp={bio.whatsapp} />}
          {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={onTrack} />}
          {supplemental}
          <Footer />
        </div>
      </div>
    );
  }
}
