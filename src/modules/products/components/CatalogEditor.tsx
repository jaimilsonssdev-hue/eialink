import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MediaUploader } from "@/components/page-builder/MediaUploader";
import type { CatalogItem, CatalogItemType } from "../types";

const blankDraft = (type: CatalogItemType): Omit<CatalogItem, "id" | "position"> => ({
  type,
  name: "",
  description: null,
  price: null,
  image_url: null,
  button_label: "Saiba mais",
  button_url: null,
  active: true,
});

export function CatalogEditor({
  items,
  onChange,
}: {
  items: CatalogItem[];
  onChange(items: CatalogItem[]): void;
}) {
  const [draft, setDraft] = useState<Omit<CatalogItem, "id" | "position">>();
  const [error, setError] = useState<string>();
  const update = (id: string, patch: Partial<CatalogItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const confirm = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Informe o nome antes de adicionar.");
      return;
    }
    onChange([
      ...items,
      {
        ...draft,
        id: `draft-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        position: items.length,
      },
    ]);
    setDraft(undefined);
    setError(undefined);
  };
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="catalog-editor-item">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {item.type === "product" ? "Produto" : "Serviço"}
            </p>
            <label className="text-xs">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) => update(item.id, { active: event.target.checked })}
              />{" "}
              Exibir
            </label>
          </div>
          <CatalogFields item={item} onChange={(patch) => update(item.id, patch)} />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="btn-secondary p-2"
              onClick={() => move(index, -1)}
              aria-label="Mover para cima"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              className="btn-secondary p-2"
              onClick={() => move(index, 1)}
              aria-label="Mover para baixo"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              className="ml-auto text-[color:var(--destructive)]"
              onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
              aria-label="Remover"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {!items.length && (
        <p className="text-sm text-muted-foreground">
          Nenhum produto ou serviço cadastrado ainda.
        </p>
      )}
      {draft ? (
        <div className="catalog-editor-item">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Novo {draft.type === "product" ? "produto" : "serviço"}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraft(undefined);
                setError(undefined);
              }}
              aria-label="Cancelar"
            >
              <X size={18} />
            </button>
          </div>
          <CatalogFields
            item={draft}
            onChange={(patch) =>
              setDraft((current) => (current ? { ...current, ...patch } : current))
            }
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-[color:var(--destructive)]">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-primary" onClick={confirm}>
              Adicionar
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setDraft(undefined);
                setError(undefined);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDraft(blankDraft("product"))}
          >
            <Plus size={16} /> Produto
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDraft(blankDraft("service"))}
          >
            <Plus size={16} /> Serviço
          </button>
        </div>
      )}
    </div>
  );
}

function CatalogFields({
  item,
  onChange,
}: {
  item: Omit<CatalogItem, "id" | "position">;
  onChange(patch: Partial<CatalogItem>): void;
}) {
  return (
    <>
      <input
        className="input-base mt-2"
        value={item.name}
        onChange={(event) => onChange({ name: event.target.value })}
        placeholder="Nome"
        aria-label="Nome"
      />
      <textarea
        className="input-base mt-2"
        value={item.description ?? ""}
        onChange={(event) => onChange({ description: event.target.value || null })}
        placeholder="Descrição"
        aria-label="Descrição"
      />
      <div className="mt-2">
        <MediaUploader
          label="Imagem"
          value={item.image_url}
          maxSizeBytes={3 * 1024 * 1024}
          onChange={(image_url) => onChange({ image_url })}
        />
      </div>
      <input
        className="input-base mt-2"
        type="number"
        min="0"
        step="0.01"
        value={item.price ?? ""}
        onChange={(event) =>
          onChange({ price: event.target.value === "" ? null : Number(event.target.value) })
        }
        placeholder="Preço opcional"
        aria-label="Preço"
      />
      <input
        className="input-base mt-2"
        value={item.button_label}
        onChange={(event) => onChange({ button_label: event.target.value })}
        placeholder="Texto do botão"
        aria-label="Texto do botão"
      />
      <input
        className="input-base mt-2"
        value={item.button_url ?? ""}
        onChange={(event) => onChange({ button_url: event.target.value || null })}
        placeholder="Link do botão (opcional)"
        aria-label="Link do botão"
      />
    </>
  );
}
