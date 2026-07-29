import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { Banner } from "@/components/public-profile/Banner";
import { Footer } from "@/components/public-profile/Footer";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import type { ReactNode } from "react";
import type { TemplateComponentContext } from "../components/ComponentRegistry";
import type { SmartTemplateDefinition } from "../types";
import { RestaurantBioLink } from "./RestaurantBioLink";

type SmartContext = TemplateComponentContext & { supplemental?: ReactNode };
type Composition = (context: SmartContext, definition: SmartTemplateDefinition) => ReactNode;

const Hero = ({ context }: { context: SmartContext }) => (
  <Banner
    name={context.bio.display_name}
    coverUrl={context.bio.cover_url}
    coverPosition={context.bio.cover_position}
    coverFit={context.bio.cover_fit}
    overlay={context.bio.cover_overlay}
    overlayOpacity={context.bio.cover_overlay_opacity}
    onShare={context.onShare}
  />
);

const restaurant: Composition = (context) => <RestaurantBioLink {...context} />;
const clinic: Composition = (context) => (
  <div className="smart-site smart-site-clinic">
    <div className="smart-clinic-hero">
      <Hero context={context} />
      <ProfileHeader bio={context.bio} onTrack={context.onTrack} />
    </div>
    <section className="smart-site-content smart-clinic-services">{context.supplemental}</section>
    <ActionButtons bio={context.bio} links={context.links} onTrack={context.onTrack} />
    <Footer />
  </div>
);
const store: Composition = (context) => (
  <div className="smart-site smart-site-store">
    <Hero context={context} />
    <section className="smart-store-head">
      <ProfileHeader bio={context.bio} onTrack={context.onTrack} />
      <ActionButtons bio={context.bio} links={context.links} onTrack={context.onTrack} />
    </section>
    <section className="smart-site-content smart-store-grid">{context.supplemental}</section>
    <Footer />
  </div>
);

const compositions: Record<SmartTemplateDefinition["niche"], Composition> = {
  restaurant,
  clinic,
  store,
};
export const smartTemplateRegistry = {
  render: (definition: SmartTemplateDefinition, context: SmartContext) =>
    compositions[definition.niche](context, definition),
};
