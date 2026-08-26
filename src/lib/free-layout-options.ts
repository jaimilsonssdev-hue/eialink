export type FreeTypography = "modern" | "elegant" | "strong";

const TYPOGRAPHY_SUFFIX = /--font-(modern|elegant|strong)$/;

export function freeTemplateBase(templateId?: string | null) {
  return (templateId || "default").replace(TYPOGRAPHY_SUFFIX, "");
}

export function freeTypographyFromTemplate(templateId?: string | null): FreeTypography {
  const match = templateId?.match(TYPOGRAPHY_SUFFIX);
  return (match?.[1] as FreeTypography | undefined) ?? "modern";
}

export function freeTemplateWithTypography(
  templateId: string | null | undefined,
  typography: FreeTypography,
) {
  return `${freeTemplateBase(templateId)}--font-${typography}`;
}
