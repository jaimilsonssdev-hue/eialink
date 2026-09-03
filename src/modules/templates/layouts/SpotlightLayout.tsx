import type { ReactNode } from "react";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { PixCard } from "@/components/public-profile/PixCard";
import { Footer } from "@/components/public-profile/Footer";
import { Banner } from "@/components/public-profile/Banner";
import { PublicSocialLinks } from "@/components/public-profile/PublicSocialLinks";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import {
  freeAccentFromTemplate,
  freeButtonShapeFromTemplate,
} from "@/lib/free-layout-options";

/**
 * Spotlight: dark editorial bio-link with neon accents, cover banner, social links,
 * a highlighted WhatsApp card, a labelled link section and a products/services showcase.
 */
export class SpotlightLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "spotlight" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "spotlight";
  }
  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const items = products.filter((item) => item.active);
    const accent = freeAccentFromTemplate(bio.template_id);
    const buttonShape = freeButtonShapeFromTemplate(bio.template_id);

    return (
      <div className={`spotlight-shell spotlight-accent-${accent} spotlight-buttons-${buttonShape}`}>
        <div className="spotlight-frame">
          {bio.cover_url && (
            <Banner
              coverUrl={bio.cover_url}
              name={bio.display_name}
              onShare={onShare ?? (() => {})}
            />
          )}
          <ProfileHeader bio={bio} onTrack={onTrack} />
          <PublicSocialLinks bio={bio} onTrack={onTrack} />
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
