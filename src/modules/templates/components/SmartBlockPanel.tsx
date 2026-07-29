import { Eye, EyeOff, GripVertical } from "lucide-react";
import { smartBlockRegistry } from "../smart/SmartBlockRegistry";
import type { SmartTemplateDefinition, TemplateInstance } from "../types";

export function SmartBlockPanel({
  definition,
  instance,
  onChange,
}: {
  definition: SmartTemplateDefinition;
  instance: TemplateInstance;
  onChange(instance: TemplateInstance): void;
}) {
  const blocks = smartBlockRegistry.getVisible(definition, instance);
  return (
    <section className="space-y-2" aria-label="SeÃ§Ãµes do modelo">
      {blocks.map((block) => {
        const hidden = instance.hiddenBlockIds.includes(block.id);
        return (
          <div
            key={block.id}
            className="flex items-center gap-2 rounded-xl border border-border p-3"
          >
            <GripVertical className="text-muted-foreground" size={16} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{block.name}</p>
              <p className="text-xs text-muted-foreground">{block.description}</p>
            </div>
            {smartBlockRegistry.canHide(block) && (
              <button
                type="button"
                className="btn-secondary p-2"
                aria-label={hidden ? `Mostrar ${block.name}` : `Ocultar ${block.name}`}
                onClick={() =>
                  onChange({
                    ...instance,
                    hiddenBlockIds: hidden
                      ? instance.hiddenBlockIds.filter((id) => id !== block.id)
                      : [...instance.hiddenBlockIds, block.id],
                  })
                }
              >
                {hidden ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
