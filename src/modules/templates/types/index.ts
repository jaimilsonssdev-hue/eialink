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
export type TemplateDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  version: string;
  previewImage?: string;
  theme: ThemeTokens;
  layout: "vertical" | "cards" | "business" | "minimal" | "store" | "creator";
  components: string[];
  supportedFeatures: string[];
  status: "active" | "disabled" | "draft";
};
export type TemplateRenderModel = {
  template: Pick<TemplateDefinition, "id" | "layout" | "components">;
  theme: ThemeTokens;
  data: Readonly<PageData>;
};
export type Template = Pick<
  TemplateDefinition,
  "id" | "name" | "category" | "description" | "previewImage"
>;
