import type { TemplateDefinition } from "../types";
import { TemplateLivePreview } from "../preview/TemplateLivePreview";

/**
 * Thumbnail of a template. Renders the same engine used by public pages, so the
 * gallery always shows exactly what the system produces.
 */
export function TemplateThumbnail({
  template,
  height,
  scrollable = false,
}: {
  template: TemplateDefinition;
  height?: number;
  scrollable?: boolean;
}) {
  return <TemplateLivePreview template={template} height={height} scrollable={scrollable} />;
}
