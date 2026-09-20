import { TemplateEngine } from "../engine/TemplateEngine";
import { templateRegistry } from "../registry/defaultRegistry";
import { freeTemplateBase } from "@/lib/free-layout-options";
import type { PageData } from "../types";

function resolveTemplateId(id?: string): string | undefined {
  if (!id) return undefined;
  if (id === "storefront") return "store-showcase";
  return id;
}

export const TemplateService = {
  list: () => templateRegistry.list(),
  get: (id?: string) => {
    const targetId = resolveTemplateId(id);
    return (
      (targetId && (templateRegistry.find(targetId) || templateRegistry.find(freeTemplateBase(targetId)))) ||
      (id && (templateRegistry.find(id) || templateRegistry.find(freeTemplateBase(id)))) ||
      templateRegistry.getDefault()
    );
  },
  render: (data: PageData, id?: string) =>
    new TemplateEngine().render(data, TemplateService.get(id)),
};
