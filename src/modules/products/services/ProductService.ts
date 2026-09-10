import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogStore = supabase as never as { from: (table: "catalog_items") => any };

export function parseCatalogItemCategory(raw: { description?: string | null; category?: string | null }): {
  category: string | null;
  description: string | null;
} {
  let category = raw.category?.trim() || null;
  let description = raw.description || null;
  if (description) {
    const match = description.match(/^\[(?:categoria|cat):\s*([^\]]+)\]\s*\n?/i);
    if (match) {
      if (!category) category = match[1].trim();
      description = description.slice(match[0].length).trim() || null;
    }
  }
  return { category, description };
}

export function formatCatalogDescription(
  description: string | null | undefined,
  category: string | null | undefined,
): string | null {
  const cleanCat = category?.trim();
  let cleanDesc = description || null;
  if (cleanDesc) {
    const match = cleanDesc.match(/^\[(?:categoria|cat):\s*([^\]]+)\]\s*\n?/i);
    if (match) {
      cleanDesc = cleanDesc.slice(match[0].length).trim() || null;
    }
  }
  if (cleanCat) {
    return cleanDesc ? `[Categoria: ${cleanCat}]\n${cleanDesc}` : `[Categoria: ${cleanCat}]`;
  }
  return cleanDesc;
}

const toPayload = (item: CatalogItem, position: number) => ({
  type: item.type,
  name: item.name.trim(),
  description: formatCatalogDescription(item.description, item.category),
  price: item.price,
  image_url: item.image_url || null,
  button_label: item.button_label.trim() || "Saiba mais",
  button_url: item.button_url || null,
  position,
  active: item.active,
});

export const ProductService = {
  async list(bioPageId: string, activeOnly = false): Promise<CatalogItem[]> {
    let query = catalogStore
      .from("catalog_items")
      .select("*")
      .eq("bio_page_id", bioPageId)
      .order("position");
    if (activeOnly) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as CatalogItem[]).map((item) => {
      const { category, description } = parseCatalogItemCategory(item);
      return {
        ...item,
        category,
        description,
      };
    });
  },
  async sync(bioPageId: string, items: CatalogItem[]): Promise<CatalogItem[]> {
    const invalid = items.find(
      (item) => !item.name.trim() || !["product", "service"].includes(item.type),
    );
    if (invalid) throw new Error("Existem itens do catÃ¡logo sem nome ou tipo vÃ¡lido.");
    const existing = await ProductService.list(bioPageId);
    const savedItems = items.filter((item) => !item.id.startsWith("draft-"));
    const retained = new Set(savedItems.map((item) => item.id));
    for (const [position, item] of savedItems.entries()) {
      const { error } = await catalogStore
        .from("catalog_items")
        .update(toPayload(item, position))
        .eq("id", item.id)
        .eq("bio_page_id", bioPageId);
      if (error) throw new Error(`Falha ao atualizar ${item.name}: ${error.message}`);
    }
    const newItems = items.filter((item) => item.id.startsWith("draft-"));
    if (newItems.length) {
      const { error } = await catalogStore.from("catalog_items").insert(
        newItems.map((item) => ({
          ...toPayload(item, items.indexOf(item)),
          bio_page_id: bioPageId,
        })),
      );
      if (error) throw new Error(`Falha ao criar item: ${error.message}`);
    }
    const removedIds = existing.filter((item) => !retained.has(item.id)).map((item) => item.id);
    if (removedIds.length) {
      const { error } = await catalogStore
        .from("catalog_items")
        .delete()
        .in("id", removedIds)
        .eq("bio_page_id", bioPageId);
      if (error) throw new Error(`Falha ao remover item: ${error.message}`);
    }
    return ProductService.list(bioPageId);
  },
};
