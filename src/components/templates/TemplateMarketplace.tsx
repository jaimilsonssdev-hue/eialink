import { Sparkles } from "lucide-react";
import { TemplateThumbnail } from "@/modules/templates/components/TemplateThumbnail";
import { TemplateService } from "@/modules/templates/services/TemplateService";

export function TemplateMarketplace() {
  const templates = TemplateService.list();
  return (
    <section className="template-marketplace mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Biblioteca de templates</p>
          <h2 className="premium-heading mt-2">Uma identidade para o seu negócio</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Explore aparências pensadas para diferentes momentos e segmentos.
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
                Melhor para: {template.bestFor ?? "uma página clara e profissional"}
              </p>
              <button
                type="button"
                className="mt-5 text-sm font-semibold text-[color:var(--primary)]"
              >
                Visualizar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
