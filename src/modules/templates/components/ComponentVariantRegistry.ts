import type { TemplateComponentType } from "../types";
export class ComponentVariantRegistry {
  private readonly variants = new Map<string, string>();
  register(component: TemplateComponentType, variant: string, className: string) {
    const key = `${component}:${variant}`;
    if (this.variants.has(key)) throw new Error(`Duplicate variant '${key}'.`);
    this.variants.set(key, className);
    return this;
  }
  resolve(component: TemplateComponentType, variant?: string) {
    return (
      this.variants.get(`${component}:${variant}`) ??
      this.variants.get(`${component}:default`) ??
      ""
    );
  }
}
export const componentVariantRegistry = new ComponentVariantRegistry()
  .register("banner", "default", "")
  .register("banner", "compact", "template-variant-banner-compact")
  .register("profile", "default", "")
  .register("profile", "business", "template-variant-profile-business")
  .register("profile", "overlapping-banner", "template-variant-profile-overlap")
  .register("links", "default", "")
  .register("links", "glass", "template-variant-links-glass")
  .register("links", "elevated", "template-variant-links-elevated")
  .register("links", "minimal", "template-variant-links-minimal")
  .register("pix", "default", "")
  .register("pix", "highlighted", "template-variant-pix-highlighted")
  .register("footer", "default", "")
  .register("footer", "discreet", "template-variant-footer-discreet");
