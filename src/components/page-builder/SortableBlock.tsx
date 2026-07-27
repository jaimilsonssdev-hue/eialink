import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings2, Trash2 } from "lucide-react";
import type { PageBlock } from "./types";
export function SortableBlock({
  block,
  selected,
  onSelect,
  onDelete,
  children,
}: {
  block: PageBlock;
  selected: boolean;
  onSelect(): void;
  onDelete(): void;
  children: React.ReactNode;
}) {
  const s = useSortable({ id: block.id });
  return (
    <div
      ref={s.setNodeRef}
      style={{ transform: CSS.Transform.toString(s.transform), transition: s.transition }}
      className={`relative rounded-xl ${selected ? "ring-2 ring-violet-500" : ""}`}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1 rounded bg-white/90 p-1 shadow">
        <button {...s.attributes} {...s.listeners} aria-label="Reordenar">
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={onSelect} aria-label="Configurar">
          <Settings2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} aria-label="Remover">
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
      <button onClick={onSelect} className="block w-full text-left">
        {children}
      </button>
    </div>
  );
}
