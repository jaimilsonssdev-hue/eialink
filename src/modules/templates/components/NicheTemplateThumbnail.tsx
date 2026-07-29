import type { TemplateCategory } from "../types";

const content: Partial<Record<TemplateCategory, { label: string; title: string; tone: string }>> = {
  clinic: { label: "CLINICA", title: "Cuidado que acolhe", tone: "clinic" },
  store: { label: "LOJA", title: "Novidades da vitrine", tone: "store" },
  beauty: { label: "BELEZA", title: "Sua melhor versao", tone: "beauty" },
  creator: { label: "CRIADOR", title: "Ideias que conectam", tone: "creator" },
  business: { label: "PROFISSIONAL", title: "Atendimento de confiança", tone: "business" },
  portfolio: { label: "ESTUDIO", title: "Projetos autorais", tone: "portfolio" },
};

export function NicheTemplateThumbnail({ category }: { category: TemplateCategory }) {
  const item = content[category];
  if (!item) return null;

  return (
    <div aria-hidden="true" className={`niche-template-thumb niche-template-thumb-${item.tone}`}>
      <div className="niche-template-thumb-cover">
        <span>{item.label}</span>
        <i />
      </div>
      <div className="niche-template-thumb-profile">
        <b>{item.title}</b>
        <small>Uma pagina feita para o seu negocio</small>
      </div>
      <div className="niche-template-thumb-cta">Falar pelo WhatsApp</div>
      <div className="niche-template-thumb-cards"><i /><i /><i /></div>
    </div>
  );
}
