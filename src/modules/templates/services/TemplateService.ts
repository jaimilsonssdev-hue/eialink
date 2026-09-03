import { TemplateEngine } from "../engine/TemplateEngine";
import { templateRegistry } from "../registry/defaultRegistry";
import { freeTemplateBase } from "@/lib/free-layout-options";
import type { PageData } from "../types";

export const TemplateService = {
  list: () => templateRegistry.list(),
  get: (id?: string) =>
    (id && (templateRegistry.find(id) || templateRegistry.find(freeTemplateBase(id)))) ||
    templateRegistry.getDefault(),
  render: (data: PageData, id?: string) =>
    new TemplateEngine().render(data, TemplateService.get(id)),
};
