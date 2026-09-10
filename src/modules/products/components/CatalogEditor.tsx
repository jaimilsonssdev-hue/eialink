import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MediaUploader } from "@/components/page-builder/MediaUploader";
import type { CatalogItem, CatalogItemType } from "../types";

const blankDraft = (type: CatalogItemType): Omit<CatalogItem, "id" | "position"> => ({
  type,
  name: "",
  category: null,
  description: null,
  price: null,
  image_url: null,
  button_label: type === "product" ? "Adicionar" : "Saiba mais",
  button_url: null,
  active: true,
});

function priceLabel(price: number | null) {
  return price === null ? "Sob consulta" : `R$ ${price.toFixed(2).replace(".", ",")}`;
}

export function CatalogEditor({
  items,
  onChange,
  maxItems = -1,
}: {
  items: CatalogItem[];
  onChange(items: CatalogItem[]): void;
  maxItems?: number;
}) {
  const [draft, setDraft] = useState<Omit<CatalogItem, "id" | "position">>();
  const [openId, setOpenId] = useState<string>();
  const [error, setError] = useState<string>();
  const atLimit = maxItems !== -1 && items.length >= maxItems;
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
    const id = `draft-${crypto.randomUUID()}`;
    onChange([...items, { ...draft, id, name: draft.name.trim(), position: items.length }]);
    setDraft(undefined);
    setOpenId(id);
    setError(undefined);
  };

  return (
    <div className="catalog-editor">
      <div className="catalog-editor-heading">
        <div>
          <p className="eyebrow">Itens da sua vitrine</p>
          <h2>Produtos e serviços</h2>
        </div>
        <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
      </div>

      <div className="catalog-editor-list">
        {items.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <article className={`catalog-editor-item ${isOpen ? "is-open" : ""}`} key={item.id}>
              <div className="catalog-item-summary">
                <button
                  type="button"
                  className="catalog-item-identity"
                  onClick={() => setOpenId(isOpen ? undefined : item.id)}
                  aria-expanded={isOpen}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" />
                  ) : (
                    <span className="catalog-item-image-fallback"><ImagePlus size={18} /></span>
                  )}
                  <span className="min-w-0 text-left">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <small className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {item.type === "product" ? "Produto" : "Serviço"}
                      </small>
                      {item.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold border border-border">
                          {item.category}
                        </span>
                      )}
                    </span>
                    <b className="block text-sm font-bold text-foreground mt-1 truncate">
                      {item.name || "Item sem nome"}
                    </b>
                    <em className="block not-italic text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {priceLabel(item.price)}
                    </em>
                  </span>
                </button>
                <div className="catalog-item-controls">
                  <label className="catalog-item-switch" title={item.active ? "Visível na página" : "Oculto da página"}>
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) => update(item.id, { active: event.target.checked })}
                    />
                    <span aria-hidden />
                    <i>{item.active ? "Ativo" : "Oculto"}</i>
                  </label>
                  <button type="button" className="btn-secondary p-2" onClick={() => move(index, -1)} aria-label="Mover para cima"><ArrowUp size={15} /></button>
                  <button type="button" className="btn-secondary p-2" onClick={() => move(index, 1)} aria-label="Mover para baixo"><ArrowDown size={15} /></button>
                  <button type="button" className="catalog-item-edit" onClick={() => setOpenId(isOpen ? undefined : item.id)} aria-label={`Editar ${item.name}`}><Pencil size={16} /><ChevronDown size={15} /></button>
                </div>
              </div>
              {isOpen && (
                <div className="catalog-item-fields">
                  <CatalogFields item={item} onChange={(patch) => update(item.id, patch)} />
                  <button type="button" className="catalog-item-delete" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}>
                    <Trash2 size={16} /> Remover item
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!items.length && (
        <div className="catalog-empty-state">
          <ImagePlus size={22} aria-hidden />
          <div><b>Sua vitrine está pronta para começar.</b><p>Adicione o primeiro produto ou serviço que seus clientes podem pedir.</p></div>
        </div>
      )}

      {draft ? (
        <section className="catalog-draft" aria-label="Novo item">
          <div className="catalog-draft-heading">
            <div><p className="eyebrow">Novo item</p><h3>{draft.type === "product" ? "Adicionar produto" : "Adicionar serviço"}</h3></div>
            <button type="button" className="btn-secondary p-2" onClick={() => { setDraft(undefined); setError(undefined); }} aria-label="Cancelar"><X size={18} /></button>
          </div>
          <CatalogFields item={draft} onChange={(patch) => setDraft((current) => current ? { ...current, ...patch } : current)} />
          {error && <p role="alert" className="mt-3 text-sm text-[color:var(--destructive)]">{error}</p>}
          <div className="mt-4 flex gap-2"><button type="button" className="btn-primary" onClick={confirm}>Adicionar à vitrine</button><button type="button" className="btn-secondary" onClick={() => { setDraft(undefined); setError(undefined); }}>Cancelar</button></div>
        </section>
      ) : atLimit ? (
        <p className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-muted-foreground">
          Seu plano permite até {maxItems} produtos ou serviços. No Pro, sua vitrine é ilimitada.
        </p>
      ) : (
        <div className="catalog-add-actions">
          <button type="button" className="btn-primary" onClick={() => setDraft(blankDraft("product"))}><Plus size={17} /> Adicionar produto</button>
          <button type="button" className="btn-secondary" onClick={() => setDraft(blankDraft("service"))}><Plus size={17} /> Adicionar serviço</button>
        </div>
      )}
    </div>
  );
}

const CATEGORY_SUGGESTIONS = [
  "Vestuário",
  "Calçados",
  "Acessórios",
  "Novidades",
  "Ofertas",
  "Geral",
];

function CatalogFields({ item, onChange }: { item: Omit<CatalogItem, "id" | "position">; onChange(patch: Partial<CatalogItem>): void }) {
  return (
    <div className="catalog-fields-grid">
      <div className="catalog-fields-main">
        <label>
          Nome
          <input className="input-base mt-1" value={item.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Ex.: Vestido Midi Fluido / Smash Bacon" />
        </label>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Categoria (opcional)
            <input
              className="input-base mt-1"
              value={item.category ?? ""}
              onChange={(event) => onChange({ category: event.target.value || null })}
              placeholder="Ex.: Vestuário, Calçados, Acessórios..."
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] font-semibold text-foreground/80">Sugestões:</span>
            {CATEGORY_SUGGESTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onChange({ category: cat })}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  item.category === cat
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                    : "bg-card border-border hover:border-primary/50 text-foreground font-medium shadow-2xs hover:bg-muted/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <label>Descrição<textarea className="input-base mt-1" value={item.description ?? ""} onChange={(event) => onChange({ description: event.target.value || null })} placeholder="Conte brevemente o que torna este item especial." /></label>
        <div className="catalog-fields-row"><label>Preço<input className="input-base mt-1" type="number" min="0" step="0.01" value={item.price ?? ""} onChange={(event) => onChange({ price: event.target.value === "" ? null : Number(event.target.value) })} placeholder="Opcional" /></label><label>Texto do botão<input className="input-base mt-1" value={item.button_label} onChange={(event) => onChange({ button_label: event.target.value })} placeholder="Adicionar / Comprar" /></label></div>
        <label>Link do botão<input className="input-base mt-1" value={item.button_url ?? ""} onChange={(event) => onChange({ button_url: event.target.value || null })} placeholder="Opcional (se vazio, usa o carrinho e WhatsApp da loja)" /></label>
      </div>
      <MediaUploader label="Imagem do item" value={item.image_url} maxSizeBytes={3 * 1024 * 1024} onChange={(image_url) => onChange({ image_url })} />
    </div>
  );
}
