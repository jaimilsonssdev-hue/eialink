import type { ReactNode } from "react";
import { componentRegistry, type TemplateComponentContext } from "../components/ComponentRegistry";
import { componentVariantRegistry } from "../components/ComponentVariantRegistry";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import type { CatalogItem } from "@/modules/products/types";
import type { TemplateComponentType, TemplateRenderModel } from "../types";
import { RestaurantLayout } from "./RestaurantLayout";
import { ClinicLayout } from "./ClinicLayout";
import { StorefrontLayout } from "./StorefrontLayout";

export type LayoutRenderContext = TemplateComponentContext & {
  products?: CatalogItem[];
  supplemental?: ReactNode;
};

export interface TemplateLayoutRenderer {
  layoutId(): TemplateRenderModel["template"]["layout"];
  supports(model: TemplateRenderModel): boolean;
  render(model: TemplateRenderModel, context: LayoutRenderContext): ReactNode;
}

class OrderedLayout implements TemplateLayoutRenderer {
  constructor(
    private readonly id: TemplateRenderModel["template"]["layout"],
    private readonly order: TemplateComponentType[],
  ) {}
  layoutId() {
    return this.id;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === this.id;
  }
  render(model: TemplateRenderModel, context: LayoutRenderContext) {
    const renderComponent = (id: TemplateComponentType) => (
      <div
        key={id}
        className={componentVariantRegistry.resolve(id, model.template.componentVariants[id])}
      >
        {componentRegistry.resolve(id)?.({
          ...context,
          componentVariants: model.template.componentVariants,
        })}
      </div>
    );
    const banner = this.order.includes("banner") ? renderComponent("banner") : null;
    const content = this.order.filter((id) => id !== "banner");

    return (
      <div className={`template-layout template-layout-${this.id}`}>
        {banner}
        <div className="public-profile-content template-layout-content">
          {content.map(renderComponent)}
          {context.products && context.products.length > 0 && (
            <CatalogSection items={context.products} />
          )}
          {context.supplemental}
        </div>
      </div>
    );
  }
}

export class LayoutResolver {
  private readonly values = new Map<string, TemplateLayoutRenderer>();
  register(layout: TemplateLayoutRenderer) {
    this.values.set(layout.layoutId(), layout);
    return this;
  }
  resolve(model: TemplateRenderModel) {
    return this.values.get(model.template.layout) ?? this.values.get("vertical");
  }
}

export const layoutResolver = new LayoutResolver()
  .register(new OrderedLayout("vertical", ["banner", "profile", "pix", "links", "footer"]))
  .register(new OrderedLayout("minimal", ["profile", "links", "footer"]))
  .register(new OrderedLayout("cards", ["banner", "profile", "links", "pix", "footer"]))
  .register(new OrderedLayout("business", ["banner", "profile", "links", "pix", "footer"]))
  .register(new OrderedLayout("store", ["banner", "links", "profile", "pix", "footer"]))
  .register(new OrderedLayout("creator", ["profile", "banner", "links", "footer"]))
  .register(new RestaurantLayout())
  .register(new ClinicLayout())
  .register(new StorefrontLayout());
