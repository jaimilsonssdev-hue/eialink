import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { BlockRenderer } from "./BlockRenderer";
import { SortableBlock } from "./SortableBlock";
import { blockCatalog, newBlock, type PageBlock } from "./types";
export function PageBuilder({
  initial,
  onSave,
}: {
  initial: PageBlock[];
  onSave(blocks: PageBlock[]): Promise<void>;
}) {
  const [blocks, setBlocks] = useState(initial);
  const [selected, setSelected] = useState<string>();
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const active = blocks.find((b) => b.id === selected);
  const update = (data: Record<string, unknown>) =>
    setBlocks((v) => v.map((b) => (b.id === selected ? { ...b, data } : b)));
  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(18rem,1fr)_18rem]">
      <aside className="card-surface h-fit">
        <h2 className="font-semibold">Adicionar conteúdo</h2>
        <div className="mt-3 grid gap-2">
          {blockCatalog.map((x) => (
            <button
              key={x.type}
              onClick={() => setBlocks((v) => [...v, newBlock(x.type, v.length)])}
              className="rounded-lg border p-2 text-left text-sm hover:border-[color:var(--primary)]"
            >
              <b>{x.label}</b>
              <span className="block text-xs text-muted-foreground">{x.description}</span>
            </button>
          ))}
        </div>
      </aside>
      <main>
        <div className="mx-auto max-w-sm rounded-[2rem] bg-slate-900 p-3 shadow-2xl">
          <div className="min-h-[38rem] space-y-3 rounded-[1.5rem] bg-white p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id)
                  setBlocks((v) =>
                    arrayMove(
                      v,
                      v.findIndex((b) => b.id === active.id),
                      v.findIndex((b) => b.id === over.id),
                    ).map((b, i) => ({ ...b, position: i })),
                  );
              }}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks
                  .filter((b) => b.enabled)
                  .map((b) => (
                    <SortableBlock
                      key={b.id}
                      block={b}
                      selected={selected === b.id}
                      onSelect={() => setSelected(b.id)}
                      onDelete={() => setBlocks((v) => v.filter((x) => x.id !== b.id))}
                    >
                      <BlockRenderer block={b} />
                    </SortableBlock>
                  ))}
              </SortableContext>
            </DndContext>
            {!blocks.length && (
              <p className="py-20 text-center text-sm text-slate-400">
                Adicione seu primeiro bloco
              </p>
            )}
          </div>
        </div>
      </main>
      <aside className="card-surface h-fit">
        <h2 className="font-semibold">Editar seção</h2>
        {active ? (
          <>
            <label className="mt-4 flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={active.enabled}
                onChange={(e) =>
                  setBlocks((v) =>
                    v.map((b) => (b.id === active.id ? { ...b, enabled: e.target.checked } : b)),
                  )
                }
              />{" "}
              Bloco ativo
            </label>
            <label className="mt-3 block text-sm">
              Dados do bloco
              <textarea
                className="input-base mt-1 font-mono text-xs"
                rows={12}
                value={JSON.stringify(active.data, null, 2)}
                onChange={(e) => {
                  try {
                    update(JSON.parse(e.target.value));
                  } catch {
                    // Keep the current configuration until the JSON becomes valid.
                  }
                }}
              />
            </label>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Selecione uma seção no preview.</p>
        )}
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(blocks);
            setSaving(false);
          }}
          className="btn-primary mt-5 w-full"
        >
          <Save className="h-4 w-4" />
          Salvar alterações
        </button>
      </aside>
    </div>
  );
}
