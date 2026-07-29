import { Sparkles } from "lucide-react";
import { TemplateThumbnail } from "@/modules/templates/components/TemplateThumbnail";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { createTemplateInstance } from "@/modules/templates/smart/TemplateInstanceFactory";

export function TemplateMarketplace() {
  const templates = TemplateService.list();
  const useTemplate = (id: string) => {
    const template = TemplateService.get(id);
    if (template.smart)
      sessionStorage.setItem(
        "eia-template-instance",
        JSON.stringify(createTemplateInstance(template.id, template.smart)),
      );
    window.location.assign(`/builder?template=${encodeURIComponent(template.id)}`);
  };
  return (
    <section className="template-marketplace mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Biblioteca de templates</p>
          <h2 className="premium-heading mt-2">Uma identidade para o seu negocio</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Explore aparencias pensadas para diferentes momentos e segmentos.
          </p>
        </div>
        <Sparkles className="text-[color:var(--primary)]" aria-hidden="true" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="template-gallery-card">
            <TemplateThumbnail template={template} />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{template.name}</p>
                {template.badge && <span className="template-badge">{template.badge}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
              <p className="mt-4 text-xs font-medium text-muted-foreground">
                Melhor para: {template.bestFor ?? "uma pagina clara e profissional"}
              </p>
              <button
                type="button"
                className="mt-5 text-sm font-semibold text-[color:var(--primary)]"
              >
                Visualizar
              </button>
              {template.smart && (
                <button
                  type="button"
                  className="ml-4 text-sm font-semibold"
                  onClick={() => useTemplate(template.id)}
                >
                  Usar este template
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
