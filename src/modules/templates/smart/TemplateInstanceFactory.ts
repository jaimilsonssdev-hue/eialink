import type { SmartTemplateDefinition, TemplateInstance } from "../types";

export const createTemplateInstance = (
  templateId: string,
  definition: SmartTemplateDefinition,
): TemplateInstance => ({
  templateId,
  activeBlockIds: definition.blocks
    .filter((block) => block.required || !block.canHide)
    .map((block) => block.id),
  blockOrder: [...definition.blocks]
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((block) => block.id),
  hiddenBlockIds: [],
  preferences: {},
});
