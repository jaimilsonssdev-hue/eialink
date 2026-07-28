import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CatalogItem, CatalogItemType } from "../types";
import { MediaUploader } from "@/components/page-builder/MediaUploader";

export function CatalogEditor({
  items,
  onChange,
}: {
  items: CatalogItem[];
  onChange(items: CatalogItem[]): void;
}) {
  const add = (type: CatalogItemType) =>
    onChange([
      ...items,
      {
        id: `draft-${crypto.randomUUID()}`,
        type,
        name: type === "product" ? "Novo produto" : "Novo serviÃ§o",
        description: null,
        price: null,
        image_url: null,
        button_label: "Saiba mais",
        button_url: null,
        position: items.length,
        active: true,
      },
    ]);
  const update = (id: string, patch: Partial<CatalogItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="catalog-editor-item">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {item.type === "product" ? "Produto" : "ServiÃ§o"}
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
          <input
            className="input-base mt-2"
            value={item.name}
            onChange={(event) => update(item.id, { name: event.target.value })}
            aria-label="Nome"
          />
          <input
            className="input-base mt-2"
            value={item.button_label}
            onChange={(event) => update(item.id, { button_label: event.target.value })}
            placeholder="Texto do botÃ£o"
            aria-label="Texto do botÃ£o"
          />
          <input
            className="input-base mt-2"
            value={item.button_url ?? ""}
            onChange={(event) => update(item.id, { button_url: event.target.value || null })}
            placeholder="Link do botÃ£o (opcional)"
            aria-label="Link do botÃ£o"
          />
          <textarea
            className="input-base mt-2"
            value={item.description ?? ""}
            onChange={(event) => update(item.id, { description: event.target.value || null })}
            placeholder="DescriÃ§Ã£o"
            aria-label="DescriÃ§Ã£o"
          />
          <div className="mt-2">
            <MediaUploader
              label="Imagem"
              value={item.image_url}
              onChange={(image_url) => update(item.id, { image_url })}
            />
          </div>
          <input
            className="input-base mt-2"
            type="number"
            min="0"
            step="0.01"
            value={item.price ?? ""}
            onChange={(event) =>
              update(item.id, {
                price: event.target.value === "" ? null : Number(event.target.value),
              })
            }
            placeholder="PreÃ§o opcional"
            aria-label="PreÃ§o"
          />
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
          Nenhum produto ou serviÃ§o cadastrado ainda.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary" onClick={() => add("product")}>
          <Plus size={16} /> Produto
        </button>
        <button type="button" className="btn-secondary" onClick={() => add("service")}>
          <Plus size={16} /> ServiÃ§o
        </button>
      </div>
    </div>
  );
}
