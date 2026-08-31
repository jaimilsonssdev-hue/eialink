import {
  BriefcaseBusiness,
  Brain,
  Building2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  PawPrint,
  Scissors,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateThumbnail } from "@/modules/templates/components/TemplateThumbnail";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { createTemplateInstance } from "@/modules/templates/smart/TemplateInstanceFactory";
import type { TemplateDefinition } from "@/modules/templates/types";

const FILTERS = [
  { id: "all", label: "Todos", icon: Sparkles },
  { id: "restaurant", label: "Restaurantes", icon: UtensilsCrossed },
  { id: "clinic", label: "Clínicas", icon: HeartPulse },
  { id: "therapy", label: "Terapia", icon: Brain },
  { id: "academy", label: "Academias", icon: Dumbbell },
  { id: "law", label: "Advocacia", icon: BriefcaseBusiness },
  { id: "store", label: "Lojas", icon: ShoppingBag },
  { id: "beauty", label: "Salões", icon: Scissors },
  { id: "business", label: "Profissionais", icon: BriefcaseBusiness },
  { id: "portfolio", label: "Imobiliárias", icon: Building2 },
  { id: "creator", label: "Criadores", icon: Sparkles },
  { id: "premium", label: "Pet Shop", icon: PawPrint },
] as const;

export function TemplateMarketplace() {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const parallaxRef = useParallax<HTMLElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(
    () =>
      [...TemplateService.list()]
        .sort((a, b) => Number(Boolean(b.smart)) - Number(Boolean(a.smart)))
        .filter((template) => activeFilter === "all" || template.category === activeFilter),
    [activeFilter],
  );

  useEffect(() => {
    setActiveTemplateIndex(0);
    gridRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [activeFilter]);

  const showTemplate = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, templates.length - 1));
    const card = gridRef.current?.children.item(nextIndex) as HTMLElement | null;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveTemplateIndex(nextIndex);
  };

  const activateTemplate = (template: TemplateDefinition) => {
    if (template.smart) {
      sessionStorage.setItem(
        "eia-template-instance",
        JSON.stringify(createTemplateInstance(template.id, template.smart)),
      );
    }
    window.location.assign(`/builder?template=${encodeURIComponent(template.id)}`);
  };

  return (
    <section className="template-marketplace" aria-labelledby="templates-heading" ref={parallaxRef}>
      <span className="template-marketplace-glow" data-layer="1" aria-hidden="true" />
      <span className="template-marketplace-glow" data-layer="2" aria-hidden="true" />
      <div className="template-marketplace-heading">
        <div>
          <p className="eyebrow">Modelos por nicho</p>
          <h2 id="templates-heading" className="premium-heading">
            Escolha uma página que já nasceu para vender
          </h2>
          <p>
            As prévias abaixo são geradas pelo mesmo motor da sua página pública: o que você vê aqui
            é exatamente o que o seu cliente recebe.
          </p>
        </div>
        <span className="template-marketplace-count">
          <Sparkles aria-hidden="true" />
          {templates.length} modelos
        </span>
      </div>


      <div className="template-niche-filters" role="tablist" aria-label="Filtrar modelos por nicho">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeFilter === id}
            className={activeFilter === id ? "is-active" : ""}
            onClick={() => setActiveFilter(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {templates.length > 0 && (
        <div className="template-carousel-controls" aria-label="Navegação entre modelos">
          <span>
            <b>{activeTemplateIndex + 1}</b> de {templates.length}
          </span>
          <div>
            <button
              type="button"
              onClick={() => showTemplate(activeTemplateIndex - 1)}
              disabled={activeTemplateIndex === 0}
              aria-label="Modelo anterior"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => showTemplate(activeTemplateIndex + 1)}
              disabled={activeTemplateIndex === templates.length - 1}
              aria-label="Próximo modelo"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className="template-marketplace-grid"
        onScroll={(event) => {
          const container = event.currentTarget;
          if (container.clientWidth === 0) return;
          const index = Math.round(container.scrollLeft / container.clientWidth);
          setActiveTemplateIndex(Math.max(0, Math.min(index, templates.length - 1)));
        }}
      >
        {templates.map((template) => (
          <article key={template.id} className="template-gallery-card">
            <button
              type="button"
              className="template-preview-trigger"
              onClick={() => setPreviewTemplate(template)}
              aria-label={`Visualizar prévia do template ${template.name}`}
            >
              <TemplateThumbnail template={template} />
              <span>Visualizar prévia</span>
            </button>
            <div className="template-gallery-card-body">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{template.name}</p>
                {template.badge && <span className="template-badge">{template.badge}</span>}
              </div>
              <p className="template-gallery-description">{template.description}</p>
              <p className="template-gallery-best-for">
                Ideal para: {template.bestFor ?? "uma presença profissional"}
              </p>
              <button
                type="button"
                className="template-use-button"
                onClick={() => activateTemplate(template)}
              >
                Usar este visual
              </button>
            </div>
          </article>
        ))}
      </div>

      {templates.length === 0 && (
        <p className="template-marketplace-empty">
          Ainda não há um modelo para este nicho. Escolha outro segmento.
        </p>
      )}

      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <DialogContent className="template-preview-dialog max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <p className="eyebrow">Prévia do template</p>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogDescription>{previewTemplate.description}</DialogDescription>
            </DialogHeader>
            <div className="template-preview-large">
              <TemplateThumbnail template={previewTemplate} />
            </div>
            <p className="template-gallery-best-for">
              Ideal para: {previewTemplate.bestFor ?? "uma presença profissional"}
            </p>
            <DialogFooter>
              <button
                type="button"
                className="btn-primary"
                onClick={() => activateTemplate(previewTemplate)}
              >
                Usar este visual
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
