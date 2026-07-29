import type { TemplateDefinition } from "../types";

export function TemplateThumbnail({ template }: { template: TemplateDefinition }) {
  const { colors } = template.theme;
  return (
    <div
      aria-hidden="true"
      className="template-thumbnail"
      data-layout={template.layout}
      style={{
        background: `linear-gradient(145deg, ${colors.background}, ${colors.surface})`,
        color: colors.text,
      }}
    >
      <div className="template-thumbnail-cover" style={{ backgroundColor: colors.primary }} />
      <div className="template-thumbnail-avatar" style={{ borderColor: colors.surface }} />
      <div className="template-thumbnail-name" style={{ backgroundColor: colors.text }} />
      <div className="template-thumbnail-copy" style={{ backgroundColor: colors.muted }} />
      <div className="template-thumbnail-link" style={{ backgroundColor: colors.primary }} />
      <div className="template-thumbnail-link is-muted" style={{ backgroundColor: colors.muted }} />
    </div>
  );
}
