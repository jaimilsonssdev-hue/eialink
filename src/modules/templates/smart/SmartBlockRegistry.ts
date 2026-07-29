import type { BlockDefinition, SmartTemplateDefinition, TemplateInstance } from "../types";

export class SmartBlockRegistry {
  getAllowed(definition: SmartTemplateDefinition) {
    return definition.blocks.filter(
      (block) => !block.restrictedTo || block.restrictedTo.includes(definition.niche),
    );
  }
  getVisible(definition: SmartTemplateDefinition, instance: TemplateInstance): BlockDefinition[] {
    const allowed = new Map(this.getAllowed(definition).map((block) => [block.id, block]));
    return instance.blockOrder
      .map((id) => allowed.get(id))
      .filter((block): block is BlockDefinition =>
        Boolean(block && !instance.hiddenBlockIds.includes(block.id)),
      );
  }
  canHide(block: BlockDefinition) {
    return block.canHide && !block.required;
  }
}
export const smartBlockRegistry = new SmartBlockRegistry();
