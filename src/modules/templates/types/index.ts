export type ColorTokens = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
};
export type SpacingTokens = { xs: string; sm: string; md: string; lg: string; xl: string };
export type RadiusTokens = { sm: string; md: string; lg: string; full: string };
export type ShadowTokens = { sm: string; md: string; lg: string };
export type TypographyTokens = { fontFamily: string; headingSize: string; bodySize: string };
export type ThemeTokens = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  typography: TypographyTokens;
  iconStyle: "rounded" | "minimal";
};
export type PageData = {
  profile: { name: string; description?: string | null; avatarUrl?: string | null };
  appearance: { coverUrl?: string | null };
  links: Array<{ id: string; title: string; url: string }>;
  socials: Record<string, string | undefined>;
  whatsapp?: string | null;
  pix?: string | null;
  products?: never[];
};
export type TemplateComponentType = "banner" | "profile" | "links" | "pix" | "footer";
export type TemplateCategory =
  | "minimal"
  | "creator"
  | "business"
  | "store"
  | "restaurant"
  | "clinic"
  | "therapy"
  | "academy"
  | "law"
  | "beauty"
  | "portfolio"
  | "premium";
export type ComponentVariants = Partial<Record<TemplateComponentType, string>>;
export type SmartBlockType =
  | "hero"
  | "profile"
  | "menu"
  | "catalog"
  | "delivery"
  | "specialties"
  | "treatments"
  | "team"
  | "convenios"
  | "offers"
  | "categories"
  | "contact"
  | "social"
  | "footer";
export type BlockDefinition = {
  id: string;
  type: SmartBlockType;
  name: string;
  description: string;
  required: boolean;
  defaultOrder: number;
  canHide: boolean;
  canReorder: boolean;
  variants: string[];
  restrictedTo?: TemplateCategory[];
};
export type SmartTemplateDefinition = {
  niche: "restaurant" | "clinic" | "store";
  blocks: BlockDefinition[];
  demo: { name: string; description: string; heroLabel: string };
};
export type TemplateInstance = {
  templateId: string;
  activeBlockIds: string[];
  blockOrder: string[];
  hiddenBlockIds: string[];
  preferences: Record<string, string | boolean>;
};
export type TemplateDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  version: string;
  previewImage?: string;
  badge?: "Novo" | "Popular" | "Mais usado" | "Premium";
  bestFor?: string;
  benefits?: string[];
  theme: ThemeTokens;
  layout:
    | "vertical"
    | "cards"
    | "business"
    | "minimal"
    | "store"
    | "creator"
    | "restaurant"
    | "clinic"
    | "therapy"
    | "academy"
    | "law"
    | "storefront"
    | "spotlight"
    | "beauty";
  components: TemplateComponentType[];
  componentVariants: ComponentVariants;
  smart?: SmartTemplateDefinition;
  supportedFeatures: string[];
  status: "active" | "disabled" | "draft";
};
export type TemplateRenderModel = {
  template: Pick<
    TemplateDefinition,
    "id" | "layout" | "components" | "componentVariants" | "smart"
  >;
  theme: ThemeTokens;
  data: Readonly<PageData>;
};
export type Template = Pick<
  TemplateDefinition,
  "id" | "name" | "category" | "description" | "previewImage"
>;
