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
      className={`group relative rounded-xl ${selected ? "ring-2 ring-[color:var(--primary)] ring-offset-2 ring-offset-slate-900" : ""}`}
    >
      <div
        className={`absolute right-2 top-2 z-10 flex gap-1 rounded-lg bg-white/95 p-1 shadow-sm transition-opacity ${selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"}`}
      >
        <button type="button" {...s.attributes} {...s.listeners} aria-label="Reordenar seção">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onSelect} aria-label="Editar seção">
          <Settings2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} aria-label="Remover seção">
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="block w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--primary)]"
      >
        {children}
      </button>
    </div>
  );
}
