import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Eye, Save, Smartphone } from "lucide-react";
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
    <div className="grid gap-6 xl:grid-cols-[19rem_minmax(24rem,1fr)_22rem]">
      <aside className="card-surface h-fit xl:sticky xl:top-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
          Seções da sua página
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">Adicionar uma seção</h2>
        <div className="mt-3 grid gap-2">
          {blockCatalog.map((x) => (
            <button
              key={x.type}
              onClick={() => setBlocks((v) => [...v, newBlock(x.type, v.length)])}
              className="rounded-xl border border-border p-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--primary)]"
            >
              <b>{x.label}</b>
              <span className="block text-xs text-muted-foreground">{x.description}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="min-w-0">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          Preview da sua página
        </div>
        <div className="mx-auto max-w-[25rem] rounded-[2.4rem] bg-slate-900 p-2.5 shadow-[0_24px_55px_-25px_rgba(0,0,0,.7)]">
          <div className="h-[min(70vh,46rem)] min-h-[34rem] space-y-3 overflow-y-auto rounded-[2rem] bg-white p-4">
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
                Sua página começa aqui. Adicione uma seção ao lado.
              </p>
            )}
          </div>
        </div>
      </main>
      <aside className="card-surface h-fit xl:sticky xl:top-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
          Personalização
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">Editar seção</h2>
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
              Seção visível
            </label>
            <label className="mt-3 block text-sm">
              Conteúdo da seção
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
          <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Eye className="mb-2 h-5 w-5 text-[color:var(--primary)]" />
            Escolha uma seção no preview para personalizá-la.
          </div>
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
