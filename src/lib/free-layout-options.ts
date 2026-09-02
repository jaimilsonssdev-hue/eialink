export type FreeTypography = "modern" | "elegant" | "strong";
export type FreeAccent = "aurora" | "sunset" | "ocean" | "emerald" | "gold";
export type FreeButtonShape = "rounded" | "pill" | "square";

const TYPOGRAPHY_SUFFIX = /--font-(modern|elegant|strong)/;
const ACCENT_SUFFIX = /--accent-(aurora|sunset|ocean|emerald|gold)/;
const SHAPE_SUFFIX = /--btn-(rounded|pill|square)/;

export const FREE_ACCENTS: Array<{ id: FreeAccent; label: string; colors: [string, string, string] }> = [
  { id: "aurora", label: "Aurora", colors: ["#34d399", "#22d3ee", "#a78bfa"] },
  { id: "sunset", label: "Pôr do sol", colors: ["#fb923c", "#f472b6", "#a855f7"] },
  { id: "ocean", label: "Oceano", colors: ["#38bdf8", "#3b82f6", "#6366f1"] },
  { id: "emerald", label: "Esmeralda", colors: ["#4ade80", "#10b981", "#14b8a6"] },
  { id: "gold", label: "Ouro", colors: ["#fcd34d", "#f59e0b", "#f97316"] },
];

export const FREE_BUTTON_SHAPES: Array<{ id: FreeButtonShape; label: string }> = [
  { id: "rounded", label: "Arredondado" },
  { id: "pill", label: "Pílula" },
  { id: "square", label: "Reto" },
];

export function freeTemplateBase(templateId?: string | null) {
  return (templateId || "default")
    .replace(TYPOGRAPHY_SUFFIX, "")
    .replace(ACCENT_SUFFIX, "")
    .replace(SHAPE_SUFFIX, "");
}

export function freeTypographyFromTemplate(templateId?: string | null): FreeTypography {
  const match = templateId?.match(TYPOGRAPHY_SUFFIX);
  return (match?.[1] as FreeTypography | undefined) ?? "modern";
}

export function freeAccentFromTemplate(templateId?: string | null): FreeAccent {
  const match = templateId?.match(ACCENT_SUFFIX);
  return (match?.[1] as FreeAccent | undefined) ?? "aurora";
}

export function freeButtonShapeFromTemplate(templateId?: string | null): FreeButtonShape {
  const match = templateId?.match(SHAPE_SUFFIX);
  return (match?.[1] as FreeButtonShape | undefined) ?? "rounded";
}

export function freeTemplateWithOptions(
  templateId: string | null | undefined,
  options: { typography?: FreeTypography; accent?: FreeAccent; shape?: FreeButtonShape },
) {
  const base = freeTemplateBase(templateId);
  const typography = options.typography ?? freeTypographyFromTemplate(templateId);
  const accent = options.accent ?? freeAccentFromTemplate(templateId);
  const shape = options.shape ?? freeButtonShapeFromTemplate(templateId);
  return `${base}--font-${typography}--accent-${accent}--btn-${shape}`;
}

export function freeTemplateWithTypography(
  templateId: string | null | undefined,
  typography: FreeTypography,
) {
  return freeTemplateWithOptions(templateId, { typography });
}
