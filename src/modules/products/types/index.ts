export type CatalogItemType = "product" | "service";

export type CatalogItem = {
  id: string;
  bio_page_id?: string;
  type: CatalogItemType;
  name: string;
  category?: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  button_label: string;
  button_url: string | null;
  position: number;
  active: boolean;
};
