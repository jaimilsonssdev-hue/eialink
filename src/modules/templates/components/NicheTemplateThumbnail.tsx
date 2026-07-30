import type { TemplateCategory } from "../types";

const content: Partial<Record<TemplateCategory, { label: string; title: string; tone: string; image?: string }>> = {
  clinic: { label: "CLÍNICA", title: "Cuidado que acolhe", tone: "clinic", image: "/template-assets/clinic-demo-cover.png" },
  academy: { label: "ACADEMIA", title: "Força que transforma", tone: "academy", image: "/template-assets/academy-gym-cover.png" },
  law: { label: "ADVOCACIA", title: "Estratégia que protege", tone: "law", image: "/template-assets/law-office-cover.png" },
  store: { label: "LOJA", title: "Novidades da vitrine", tone: "store", image: "/template-assets/store-demo-cover.png" },
  beauty: { label: "BELEZA", title: "Sua melhor versao", tone: "beauty", image: "/template-assets/beauty-demo-cover.png" },
  creator: { label: "CRIADOR", title: "Ideias que conectam", tone: "creator", image: "/template-assets/creator-demo-cover.png" },
  business: { label: "PROFISSIONAL", title: "Atendimento de confiança", tone: "business" },
  portfolio: { label: "ESTUDIO", title: "Projetos autorais", tone: "portfolio" },
};

export function NicheTemplateThumbnail({ category }: { category: TemplateCategory }) {
  const item = content[category];
  if (!item) return null;

  return (
    <div aria-hidden="true" className={`niche-template-thumb niche-template-thumb-${item.tone}`}>
      <div
        className="niche-template-thumb-cover"
        style={item.image ? { backgroundImage: `linear-gradient(90deg, rgb(8 6 12 / .55), rgb(8 6 12 / .05)), url(${item.image})` } : undefined}
      >
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
