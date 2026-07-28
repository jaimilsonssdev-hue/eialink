import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem } from "../types";

// catalog_items is introduced by this Sprint's migration; generated database types are refreshed by the deployment pipeline.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogStore = supabase as never as { from: (table: "catalog_items") => any };

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
    return data as CatalogItem[];
  },
  async replace(bioPageId: string, items: CatalogItem[]) {
    const existing = await ProductService.list(bioPageId);
    const retainedIds = new Set(
      items.filter((item) => !item.id.startsWith("draft-")).map((item) => item.id),
    );
    const removedIds = existing.filter((item) => !retainedIds.has(item.id)).map((item) => item.id);
    if (removedIds.length) {
      const { error } = await catalogStore.from("catalog_items").delete().in("id", removedIds);
      if (error) throw new Error(error.message);
    }
    const payload = items.map(({ id, ...item }, position) => ({
      ...item,
      id: id.startsWith("draft-") ? undefined : id,
      bio_page_id: bioPageId,
      position,
    }));
    if (payload.length) {
      const { error } = await catalogStore.from("catalog_items").upsert(payload);
      if (error) throw new Error(error.message);
    }
  },
};
