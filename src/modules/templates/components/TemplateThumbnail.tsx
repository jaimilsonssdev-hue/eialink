import type { TemplateDefinition } from "../types";
import { RestaurantTemplateThumbnail } from "./RestaurantTemplateThumbnail";
import { NicheTemplateThumbnail } from "./NicheTemplateThumbnail";

export function TemplateThumbnail({ template }: { template: TemplateDefinition }) {
  const { colors } = template.theme;
  const layout = template.layout;

  if (template.id === "restaurant-menu") return <RestaurantTemplateThumbnail />;
  if (["clinic", "store", "beauty", "creator", "business", "portfolio"].includes(template.category))
    return <NicheTemplateThumbnail category={template.category} />;

  if (layout === "restaurant") {
    return (
      <div
        aria-hidden="true"
        className="template-thumbnail"
        data-layout="restaurant"
        style={{ background: colors.background, color: colors.text }}
      >
        <div
          className="template-thumbnail-restaurant-hero"
          style={{
            background: `linear-gradient(160deg, ${colors.primary}88, ${colors.surface})`,
          }}
        >
          <span style={{ color: colors.primary }}>Cardápio</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="template-thumbnail-menu-row">
            <div style={{ background: colors.surface }} />
            <div className="template-thumbnail-menu-line" style={{ background: colors.muted }} />
            <span style={{ color: colors.primary }}>R$</span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "clinic") {
    return (
      <div
        aria-hidden="true"
        className="template-thumbnail"
        data-layout="clinic"
        style={{ background: colors.background, color: colors.text }}
      >
        <div className="template-thumbnail-clinic-hero">
          <div>
            <div className="template-thumbnail-clinic-title" style={{ background: colors.text }} />
            <div className="template-thumbnail-clinic-sub" style={{ background: colors.muted }} />
            <div className="template-thumbnail-clinic-cta" style={{ background: colors.primary }} />
          </div>
          <div
            className="template-thumbnail-clinic-media"
            style={{ background: `${colors.primary}22` }}
          />
        </div>
        <div className="template-thumbnail-clinic-services">
          {[0, 1].map((i) => (
            <div key={i} style={{ background: colors.surface, borderColor: `${colors.primary}33` }}>
              <span style={{ background: colors.primary }} />
              <span style={{ background: colors.muted }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "storefront") {
    return (
      <div
        aria-hidden="true"
        className="template-thumbnail"
        data-layout="storefront"
        style={{ background: colors.background, color: colors.text }}
      >
        <div
          className="template-thumbnail-store-hero"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.text})` }}
        />
        <div className="template-thumbnail-store-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ background: colors.surface }}>
              <div style={{ background: `${colors.primary}22` }} />
              <span style={{ background: colors.muted }} />
              <span style={{ background: colors.primary }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="template-thumbnail"
      data-layout={layout}
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
