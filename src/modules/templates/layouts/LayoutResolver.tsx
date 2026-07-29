import type { ReactNode } from "react";
import { componentRegistry, type TemplateComponentContext } from "../components/ComponentRegistry";
import { componentVariantRegistry } from "../components/ComponentVariantRegistry";
import type { TemplateComponentType, TemplateRenderModel } from "../types";
export interface TemplateLayoutRenderer {
  layoutId(): TemplateRenderModel["template"]["layout"];
  supports(model: TemplateRenderModel): boolean;
  render(model: TemplateRenderModel, context: TemplateComponentContext): ReactNode;
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
  render(model: TemplateRenderModel, context: TemplateComponentContext) {
    return (
      <div className={`template-layout template-layout-${this.id}`}>
        {this.order.map((id) => (
          <div
            key={id}
            className={componentVariantRegistry.resolve(id, model.template.componentVariants[id])}
          >
            {componentRegistry.resolve(id)?.({
              ...context,
              componentVariants: model.template.componentVariants,
            })}
          </div>
        ))}
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
  .register(new OrderedLayout("restaurant", ["banner", "profile", "links", "pix"]))
  .register(new OrderedLayout("clinic", ["banner", "profile", "links", "pix"]))
  .register(new OrderedLayout("storefront", ["banner", "profile", "links", "pix"]));
