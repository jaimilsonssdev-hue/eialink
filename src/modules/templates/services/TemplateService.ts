import { TemplateEngine } from "../engine/TemplateEngine";
import { templateRegistry } from "../registry/defaultRegistry";
import type { PageData } from "../types";
export const TemplateService = {
  list: () => templateRegistry.list(),
  get: (id?: string) => (id && templateRegistry.find(id)) || templateRegistry.getDefault(),
  render: (data: PageData, id?: string) =>
    new TemplateEngine().render(data, TemplateService.get(id)),
};
