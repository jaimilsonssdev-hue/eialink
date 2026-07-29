import type { PageData, TemplateDefinition, TemplateRenderModel } from "../types";
export class TemplateEngine {
  render(data: PageData, template: TemplateDefinition): TemplateRenderModel {
    if (template.status !== "active")
      throw new Error(`Template '${template.id}' is not available.`);
    return {
      template: {
        id: template.id,
        layout: template.layout,
        components: [...template.components],
        componentVariants: { ...template.componentVariants },
        smart: template.smart,
      },
      theme: template.theme,
      data: Object.freeze({ ...data, links: [...data.links], socials: { ...data.socials } }),
    };
  }
}
