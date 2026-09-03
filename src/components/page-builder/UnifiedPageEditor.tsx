import {
  CheckCircle2,
  Circle,
  Eye,
  ExternalLink,
  Facebook,
  Globe2,
  Image,
  Instagram,
  Linkedin,
  Link2,
  Palette,
  Save,
  Sparkles,
  UserRound,
  WalletCards,
  Youtube,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { FreeLinkRenderer } from "@/components/public-profile/FreeLinkRenderer";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import type { PublicBio, PublicLink } from "@/components/public-profile/types";
import type { Tables } from "@/integrations/supabase/types";
import { MediaUploader } from "./MediaUploader";
import { CatalogEditor } from "@/modules/products/components/CatalogEditor";
import { parseSocialLinks } from "@/lib/social-links";
import { NICHES } from "@/lib/constants";
import {
  freeTemplateBase,
  freeTemplateWithOptions,
  freeTypographyFromTemplate,
  freeAccentFromTemplate,
  freeButtonShapeFromTemplate,
  FREE_ACCENTS,
  FREE_BUTTON_SHAPES,
  type FreeTypography,
} from "@/lib/free-layout-options";
import type { FreeAccent, FreeButtonShape } from "@/lib/free-layout-options";
import { UpgradePrompt, commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import type { PlanAccess } from "@/modules/billing/types";
import {
  normalizePageSlug,
  publicPageUrl,
  subdomainValidationMessage,
} from "@/lib/public-page-url";

import type { CatalogItem } from "@/modules/products/types";

type BioForm = Pick<
  Tables<"bio_pages">,
  | "slug"
  | "display_name"
  | "description"
  | "avatar_url"
  | "whatsapp"
  | "whatsapp_message"
  | "whatsapp_button_label"
  | "whatsapp_button_subtitle"
  | "pix_key"
  | "instagram"
  | "social_links"
  | "published"
  | "theme"
  | "cover_url"
  | "cover_position"
  | "cover_fit"
  | "cover_overlay"
  | "cover_overlay_opacity"
  | "template_id"
  | "motion_enabled"
  | "motion_entrance"
  | "motion_cta"
  | "motion_ambient"
>;

type EditorSection =
  | "appearance"
  | "motion"
  | "photo"
  | "profile"
  | "social"
  | "contact"
  | "pix"
  | "links"
  | "catalog";

type EditableLink = Pick<PublicLink, "id" | "title" | "url" | "active" | "position">;

const MENU: {
  id: EditorSection;
  group: string;
  label: string;
  description: string;
  icon: typeof Image;
}[] = [
  {
    id: "appearance",
    group: "Aparência",
    label: "Fundo e capa",
    description: "Imagem, posição e tema",
    icon: Image,
  },
  {
    id: "motion",
    group: "Aparência",
    label: "Animações",
    description: "Movimento e destaque",
    icon: Sparkles,
  },
  {
    id: "photo",
    group: "Aparência",
    label: "Foto de perfil",
    description: "Imagem e prévia",
    icon: UserRound,
  },
  {
    id: "profile",
    group: "Informações",
    label: "Nome e descrição",
    description: "Como sua marca aparece",
    icon: UserRound,
  },
  {
    id: "social",
    group: "Informações",
    label: "Redes sociais",
    description: "Instagram e presença online",
    icon: Link2,
  },
  {
    id: "contact",
    group: "Contato",
    label: "WhatsApp",
    description: "Seu contato principal",
    icon: WalletCards,
  },
  {
    id: "pix",
    group: "Contato",
    label: "Pix",
    description: "Receba pagamentos",
    icon: WalletCards,
  },
  {
    id: "links",
    group: "Conteúdo",
    label: "Links e botões",
    description: "Links da sua página",
    icon: Link2,
  },
  {
    id: "catalog",
    group: "Conteúdo",
    label: "Produtos e serviços",
    description: "O que você oferece",
    icon: WalletCards,
  },
];

const WORKFLOW: Array<{
  id: string;
  label: string;
  description: string;
  sections: EditorSection[];
}> = [
  {
    id: "profile",
    label: "Perfil",
    description: "Sua marca",
    sections: ["profile", "photo"],
  },
  {
    id: "contact",
    label: "Contato",
    description: "Como falar com você",
    sections: ["contact", "social", "pix"],
  },
  {
    id: "content",
    label: "Conteúdo",
    description: "Links e ofertas",
    sections: ["links", "catalog"],
  },
  {
    id: "visual",
    label: "Visual",
    description: "Estilo da página",
    sections: ["appearance", "motion"],
  },
];

const THEMES = [
  { id: "aurora", label: "Aurora" },
  { id: "sunset", label: "Pôr do sol" },
  { id: "ocean", label: "Oceano" },
  { id: "forest", label: "Floresta" },
  { id: "midnight", label: "Noite" },
  { id: "mono", label: "Claro" },
];

const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram", placeholder: "@seuperfil", icon: Instagram },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/suapagina",
    icon: Facebook,
  },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@seuperfil", icon: Palette },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/seuperfil",
    icon: Linkedin,
  },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@seucanal", icon: Youtube },
  { id: "website", label: "Seu site", placeholder: "https://seusite.com.br", icon: Globe2 },
] as const;

function socialValues(value: BioForm["social_links"]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function UnifiedPageEditor({
  initialBio,
  initialLinks,
  initialProducts = [],
  defaults,
  planAccess,
  onSave,
}: {
  initialBio: BioForm;
  initialLinks: EditableLink[];
  initialProducts?: CatalogItem[];
  defaults: { displayName: string; whatsapp: string; instagram: string; niche: string };
  planAccess?: PlanAccess;
  onSave(data: {
    bio: BioForm;
    links: EditableLink[];
    products: CatalogItem[];
    niche: string;
  }): Promise<{ products: CatalogItem[] }>;
}) {
  const [bio, setBio] = useState<BioForm>(initialBio);
  const [links, setLinks] = useState<EditableLink[]>(initialLinks);
  const [products, setProducts] = useState<CatalogItem[]>(initialProducts);
  const [niche, setNiche] = useState(defaults.niche);
  const [selected, setSelected] = useState<EditorSection>("profile");
  const [draftTemplate, setDraftTemplate] = useState(
    freeTemplateBase(initialBio.template_id ?? "default"),
  );
  const [freeTypography, setFreeTypography] = useState<FreeTypography>(() =>
    freeTypographyFromTemplate(initialBio.template_id),
  );
  const [freeAccent, setFreeAccent] = useState<FreeAccent>(() =>
    freeAccentFromTemplate(initialBio.template_id),
  );
  const [freeShape, setFreeShape] = useState<FreeButtonShape>(() =>
    freeButtonShapeFromTemplate(initialBio.template_id),
  );
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      bio: initialBio,
      links: initialLinks,
      products: initialProducts,
      niche: defaults.niche,
    }),
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const snapshot = JSON.stringify({ bio, links, products, niche });
  const hasPendingChanges = snapshot !== savedSnapshot;
  const setupSteps: Array<{
    id: EditorSection;
    label: string;
    help: string;
    complete: boolean;
  }> = [
    {
      id: "profile",
      label: "Apresente seu negócio",
      help: "Nome e descrição",
      complete: bio.display_name.trim().length >= 2 && Boolean(bio.description?.trim()),
    },
    {
      id: "contact",
      label: "Conecte o WhatsApp",
      help: "Canal principal de contato",
      complete: (bio.whatsapp ?? "").replace(/\D/g, "").length >= 10,
    },
    {
      id: "links",
      label: "Adicione uma ação",
      help: "Link, rede ou botão",
      complete: links.some((link) => link.title.trim() && link.url.replace("https://", "").trim()),
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.complete).length;
  const activeWorkflowIndex = Math.max(
    0,
    WORKFLOW.findIndex((item) => item.sections.includes(selected)),
  );
  const activeWorkflow = WORKFLOW[activeWorkflowIndex];
  const previewBio = useMemo(
    () =>
      ({
        id: "preview",
        user_id: "preview",
        created_at: "",
        updated_at: "",
        ...bio,
        display_name: bio.display_name || defaults.displayName || "Seu negócio",
        slug: bio.slug || "minha-pagina",
      }) as PublicBio,
    [bio, defaults.displayName],
  );
  const previewLinks = useMemo(
    () =>
      links.map(
        (link) =>
          ({
            ...link,
            bio_page_id: "preview",
            created_at: "",
            updated_at: "",
            icon: null,
          }) as PublicLink,
      ),
    [links],
  );
  const hasProfessionalSubdomain = Boolean(planAccess?.isPro && planAccess.features.custom_domain);
  const normalizedSlug = normalizePageSlug(bio.slug || bio.display_name);
  const pageUrl = publicPageUrl(normalizedSlug, hasProfessionalSubdomain);
  const addressError = hasProfessionalSubdomain
    ? subdomainValidationMessage(bio.slug || bio.display_name)
    : null;

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasPendingChanges]);

  const updateBio = (patch: Partial<BioForm>) => setBio((current) => ({ ...current, ...patch }));
  const select = (section: EditorSection) => {
    setSelected(section);
    setSaveState("idle");
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.setTimeout(
        () => inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0,
      );
    }
  };
  const addLink = () => {
    if ((planAccess?.limits.links ?? 4) !== -1 && links.length >= (planAccess?.limits.links ?? 4)) {
      setValidationMessage(
        "O Eialink Essencial permite até quatro links. Faça upgrade para adicionar mais.",
      );
      setSaveState("error");
      return;
    }
    setLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "Novo link",
        url: "https://",
        active: true,
        position: current.length,
      },
    ]);
  };
  const updateLink = (id: string, patch: Partial<EditableLink>) =>
    setLinks((current) => current.map((link) => (link.id === id ? { ...link, ...patch } : link)));

  async function save() {
    if (addressError) {
      setValidationMessage(addressError);
      setSaveState("error");
      return;
    }
    const socialValidation = parseSocialLinks(bio.social_links);
    if (!socialValidation.success) {
      setValidationMessage(
        socialValidation.error.issues[0]?.message ?? "Revise os links das redes sociais.",
      );
      setSaveState("error");
      return;
    }
    setValidationMessage(undefined);
    setSaving(true);
    setSaveState("idle");
    try {
      const result = await onSave({
        bio: { ...bio, slug: normalizedSlug },
        links,
        products,
        niche,
      });
      setProducts(result.products);
      setBio((current) => ({
        ...current,
        slug: normalizePageSlug(current.slug || current.display_name),
      }));
      setSavedSnapshot(
        JSON.stringify({
          bio: { ...bio, slug: normalizedSlug },
          links,
          products: result.products,
          niche,
        }),
      );
      setSaveState("success");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Catalog save failed", error);
      setValidationMessage(
        error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.",
      );
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="premium-builder space-y-5">
      <header className="builder-topbar sticky top-0 z-20 -mx-6 flex flex-wrap items-center justify-between gap-3 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="builder-heading">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
            Minha Página
          </p>
          <h1 className="mt-1 text-2xl font-bold">Edite, confira e publique.</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Alterações pendentes
            </span>
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="btn-secondary xl:hidden"
          >
            <Eye className="h-4 w-4" /> Ver prévia
          </button>
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary hidden sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
          {hasPendingChanges || saveState === "error" ? (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Salvando..."
                : saveState === "error"
                  ? "Tentar novamente"
                  : "Salvar e publicar"}
            </button>
          ) : (
            <span className="builder-save-status">
              <CheckCircle2 aria-hidden /> Salvo
            </span>
          )}
        </div>
      </header>

      <section className="editor-readiness" aria-label="Progresso da página">
        <div className="editor-readiness-copy">
          <span className={completedSetupSteps === 3 ? "is-ready" : ""}>
            {completedSetupSteps === 3 ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />}
          </span>
          <div>
            <b>
              {completedSetupSteps === 3
                ? "Sua página está pronta"
                : "Vamos deixar sua página pronta"}
            </b>
            <small>{completedSetupSteps}/3 itens essenciais concluídos</small>
          </div>
        </div>
        <div className="editor-readiness-track" aria-hidden="true">
          <span style={{ width: `${(completedSetupSteps / 3) * 100}%` }} />
        </div>
      </section>

      <div className="builder-layout">
        <section className="builder-control-panel">
          <nav className="editor-workflow" aria-label="Etapas de edição">
            {WORKFLOW.map((workflow, index) => {
              const active = index === activeWorkflowIndex;
              return (
                <button
                  key={workflow.id}
                  type="button"
                  className={active ? "is-active" : ""}
                  aria-current={active ? "step" : undefined}
                  onClick={() => {
                    const firstAvailable = workflow.sections.find(
                      (section) => section !== "catalog" || planAccess?.features.catalog,
                    );
                    if (firstAvailable) select(firstAvailable);
                  }}
                >
                  <span>{index + 1}</span>
                  <b>{workflow.label}</b>
                  <small>{workflow.description}</small>
                </button>
              );
            })}
          </nav>

          <div className="editor-section-tabs" aria-label={`Opções de ${activeWorkflow.label}`}>
            {activeWorkflow.sections
              .filter((section) => section !== "catalog" || planAccess?.features.catalog)
              .map((section) => {
                const item = MENU.find((menuItem) => menuItem.id === section)!;
                const Icon = item.icon;
                return (
                  <button
                    key={section}
                    type="button"
                    className={selected === section ? "is-active" : ""}
                    onClick={() => select(section)}
                  >
                    <Icon aria-hidden />
                    {item.label}
                  </button>
                );
              })}
          </div>

          <aside ref={inspectorRef} className="builder-inspector card-surface">
            <SectionForm
              section={selected}
              bio={bio}
              links={links}
              defaults={defaults}
              niche={niche}
              setNiche={setNiche}
              updateBio={updateBio}
              updateLink={updateLink}
              removeLink={(id) => setLinks((current) => current.filter((link) => link.id !== id))}
              addLink={addLink}
              products={products}
              setProducts={setProducts}
              planAccess={planAccess}
              draftTemplate={draftTemplate}
              setDraftTemplate={setDraftTemplate}
              freeTypography={freeTypography}
              setFreeTypography={setFreeTypography}
              freeAccent={freeAccent}
              setFreeAccent={setFreeAccent}
              freeShape={freeShape}
              setFreeShape={setFreeShape}
            />
            {saveState === "error" && (
              <p role="alert" className="mt-4 text-sm text-[color:var(--destructive)]">
                {validationMessage ||
                  "Não foi possível salvar. Confira sua conexão e tente novamente."}
              </p>
            )}
          </aside>
        </section>

        <main
          ref={previewRef}
          className={`builder-preview-stage min-w-0 xl:order-none ${previewOpen ? "is-mobile-open" : ""}`}
        >
          <div className="builder-preview-mobile-header">
            <div>
              <b>Prévia da sua página</b>
              <small>As mudanças aparecem aqui na hora</small>
            </div>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar prévia">
              <X aria-hidden />
            </button>
          </div>
          <p className="builder-preview-label mb-3 text-center text-sm font-medium text-muted-foreground">
            Sua página enquanto você edita
          </p>
          <div
            className={`editor-phone-preview bio-theme ${previewBio.theme || "aurora"} mx-auto max-w-[25rem] overflow-hidden bg-background`}
          >
            {planAccess?.isPro ? (
              <TemplateRenderer
                bio={previewBio}
                links={previewLinks.filter((link) => link.active)}
                onTrack={() => undefined}
                onShare={() => undefined}
                products={products}
                motionLevel={previewBio.motion_enabled === false ? "off" : "pro"}
              />
            ) : (
              <FreeLinkRenderer
                bio={previewBio}
                links={previewLinks.filter((link) => link.active)}
                onTrack={() => undefined}
                onShare={() => undefined}
                products={products}
              />
            )}
          </div>
        </main>
      </div>
      {saveState === "success" && bio.published && (
        <section className="card-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Seu Eialink está publicado.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quer que a Talento configure sua página profissionalmente ou avalie o próximo passo do
              seu negócio?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="btn-secondary"
              href={commercialWhatsAppUrl("help")}
              target="_blank"
              rel="noreferrer"
            >
              Quero ajuda
            </a>
            <a
              className="btn-primary"
              href={commercialWhatsAppUrl("pro")}
              target="_blank"
              rel="noreferrer"
            >
              Conhecer o Pro
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionForm({
  section,
  bio,
  links,
  defaults,
  niche,
  setNiche,
  updateBio,
  updateLink,
  removeLink,
  addLink,
  products,
  setProducts,
  planAccess,
  draftTemplate,
  setDraftTemplate,
  freeTypography,
  setFreeTypography,
  freeAccent,
  setFreeAccent,
  freeShape,
  setFreeShape,
}: {
  section: EditorSection;
  bio: BioForm;
  links: EditableLink[];
  defaults: { displayName: string; whatsapp: string; instagram: string; niche: string };
  niche: string;
  setNiche(niche: string): void;
  updateBio(patch: Partial<BioForm>): void;
  updateLink(id: string, patch: Partial<EditableLink>): void;
  removeLink(id: string): void;
  addLink(): void;
  products: CatalogItem[];
  setProducts(items: CatalogItem[]): void;
  planAccess?: PlanAccess;
  draftTemplate: string;
  setDraftTemplate(id: string): void;
  freeTypography: FreeTypography;
  setFreeTypography(typography: FreeTypography): void;
  freeAccent: FreeAccent;
  setFreeAccent(accent: FreeAccent): void;
  freeShape: FreeButtonShape;
  setFreeShape(shape: FreeButtonShape): void;
}) {
  const title = MENU.find((item) => item.id === section)?.label ?? "Personalizar";
  const hasProfessionalSubdomain = Boolean(planAccess?.isPro && planAccess.features.custom_domain);
  const normalizedSlug = normalizePageSlug(bio.slug || bio.display_name);
  const addressError = hasProfessionalSubdomain
    ? subdomainValidationMessage(bio.slug || bio.display_name)
    : null;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
          Personalização
        </p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
      {section === "appearance" && (
        <>
          <Field label={planAccess?.isPro ? "Template" : "Estilo da página Free"}>
            <div className="grid grid-cols-2 gap-2">
              {(planAccess?.isPro
                ? TemplateService.list()
                : [
                    { id: "default", name: "Essencial", status: "active" as const },
                    { id: "free-showcase", name: "Vitrine", status: "active" as const },
                    { id: "free-social", name: "Social", status: "active" as const },
                    { id: "free-neon", name: "Neon", status: "active" as const },
                  ]
              ).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    const isFreeLayout = [
                      "default",
                      "free-showcase",
                      "free-social",
                      "free-neon",
                    ].includes(template.id);
                    if (isFreeLayout || TemplateService.get(template.id).status === "active") {
                      setDraftTemplate(template.id);
                      updateBio({
                        template_id: isFreeLayout || template.id === "spotlight-neon"
                          ? freeTemplateWithOptions(template.id, {
                              typography: freeTypography,
                              accent: freeAccent,
                              shape: freeShape,
                            })
                          : template.id,
                      });

                    }
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm transition-all ${draftTemplate === template.id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary),transparent_70%)]" : "border-border hover:border-[color:var(--primary)]/50"}`}
                >
                  {template.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Toque em um estilo para visualizar imediatamente.
            </p>
          </Field>
          {!planAccess?.isPro && (
            <Field label="Tipografia dos cards">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["modern", "Moderna", "font-sans"],
                    ["elegant", "Elegante", "font-serif"],
                    ["strong", "Marcante", "font-display"],
                  ] as const
                ).map(([id, label, fontClass]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFreeTypography(id);
                      updateBio({
                        template_id: freeTemplateWithOptions(draftTemplate, {
                          typography: id,
                          accent: freeAccent,
                          shape: freeShape,
                        }),
                      });
                    }}
                    className={`${fontClass} rounded-lg border px-2 py-3 text-sm transition-all ${freeTypography === id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]" : "border-border hover:border-[color:var(--primary)]/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                A escolha vale para os títulos e chamadas de todos os cards.
              </p>
            </Field>
          )}
          {(!planAccess?.isPro || draftTemplate === "spotlight-neon") && (
            <>
              <Field label="Cor de destaque">
                <div className="grid grid-cols-5 gap-2">
                  {FREE_ACCENTS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.label}
                      onClick={() => {
                        setFreeAccent(option.id);
                        updateBio({
                          template_id: freeTemplateWithOptions(draftTemplate, {
                            typography: freeTypography,
                            accent: option.id,
                            shape: freeShape,
                          }),
                        });
                      }}
                      className={`rounded-lg border p-1.5 transition-all ${freeAccent === option.id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10" : "border-border hover:border-[color:var(--primary)]/50"}`}
                    >
                      <span
                        className="block h-6 w-full rounded-md"
                        style={{
                          background: `linear-gradient(110deg, ${option.colors[0]}, ${option.colors[1]}, ${option.colors[2]})`,
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Define os brilhos dos botões e das bordas.
                </p>
              </Field>
              <Field label="Formato dos botões">
                <div className="grid grid-cols-3 gap-2">
                  {FREE_BUTTON_SHAPES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setFreeShape(option.id);
                        updateBio({
                          template_id: freeTemplateWithOptions(draftTemplate, {
                            typography: freeTypography,
                            accent: freeAccent,
                            shape: option.id,
                          }),
                        });
                      }}
                      className={`border px-2 py-3 text-sm transition-all ${option.id === "pill" ? "rounded-full" : option.id === "square" ? "rounded-none" : "rounded-lg"} ${freeShape === option.id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]" : "border-border hover:border-[color:var(--primary)]/50"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          <MediaUploader
            label="Imagem de capa"
            value={bio.cover_url}
            variant="cover"
            templateId={draftTemplate}
            niche={niche}
            onChange={(cover_url) => updateBio({ cover_url })}
          />
          <details className="editor-advanced-settings">
            <summary>Ajustes avançados da capa</summary>
            <div className="space-y-4 pt-4">
              <Field label="Posição da imagem">
                <select
                  className="input-base"
                  value={bio.cover_position}
                  onChange={(event) => updateBio({ cover_position: event.target.value })}
                >
                  <option value="top">Topo</option>
                  <option value="center">Centro</option>
                  <option value="bottom">Base</option>
                </select>
              </Field>
              <Field label="Ajuste">
                <select
                  className="input-base"
                  value={bio.cover_fit}
                  onChange={(event) => updateBio({ cover_fit: event.target.value })}
                >
                  <option value="cover">Preencher a capa</option>
                  <option value="contain">Mostrar a imagem inteira</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bio.cover_overlay}
                  onChange={(event) => updateBio({ cover_overlay: event.target.checked })}
                />
                Melhorar leitura com sobreposição
              </label>
              {bio.cover_overlay && (
                <Field label={`Opacidade (${bio.cover_overlay_opacity}%)`}>
                  <input
                    className="w-full"
                    type="range"
                    min="0"
                    max="100"
                    value={bio.cover_overlay_opacity}
                    onChange={(event) =>
                      updateBio({ cover_overlay_opacity: Number(event.target.value) })
                    }
                  />
                </Field>
              )}
            </div>
          </details>
          <Field label="Tema">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateBio({ theme: theme.id })}
                  className={`rounded-lg border px-3 py-2 text-sm ${bio.theme === theme.id ? "border-[color:var(--primary)] bg-surface-elevated" : "border-border"}`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}
      {section === "motion" && (
        <>
          <p className="text-sm text-muted-foreground">
            Escolha movimentos discretos para a sua página. A prévia é atualizada na hora e as
            opções ficam publicadas quando você clicar em Salvar.
          </p>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated p-4 text-sm">
            <span>
              <b className="block">Ativar animações</b>
              <span className="mt-1 block text-xs text-muted-foreground">
                Você pode desligar todos os efeitos da sua página a qualquer momento.
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-border bg-surface transition-colors checked:bg-[color:var(--primary)] relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-foreground before:transition-transform checked:before:translate-x-5 checked:before:bg-white"
              checked={bio.motion_enabled ?? true}
              onChange={(event) => updateBio({ motion_enabled: event.target.checked })}
              aria-label="Ativar animações na página"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Ao desligar, sua página publicada fica totalmente estática — útil para quem prefere
            leitura sem movimento.
          </p>
          {bio.motion_enabled !== false && (
            <>
              <Field label="Entrada da página">
                <MotionChoices
                  value={bio.motion_entrance ?? "gentle"}
                  choices={[
                    ["gentle", "Suave"],
                    ["rise", "Surgir de baixo"],
                    ["none", "Sem entrada"],
                  ]}
                  onChange={(motion_entrance) => updateBio({ motion_entrance })}
                />
              </Field>
              <Field label="Botão principal">
                {planAccess?.features.advanced_appearance ? (
                  <MotionChoices
                    value={bio.motion_cta ?? "none"}
                    choices={[
                      ["none", "Sem efeito"],
                      ["pulse", "Pulso suave"],
                      ["glow", "Brilho"],
                    ]}
                    onChange={(motion_cta) => updateBio({ motion_cta })}
                  />
                ) : (
                  <UpgradePrompt
                    compact
                    title="Destaque do botão é um recurso Pro"
                    description="Dê mais vida à sua ação principal com pulso ou brilho discreto."
                  />
                )}
              </Field>
              <Field label="Capa e fundo">
                {planAccess?.features.advanced_appearance ? (
                  <MotionChoices
                    value={bio.motion_ambient ?? "soft"}
                    choices={[
                      ["none", "Sem efeito"],
                      ["soft", "Brilho suave"],
                      ["spotlight", "Destaque ambiente"],
                    ]}
                    onChange={(motion_ambient) => updateBio({ motion_ambient })}
                  />
                ) : (
                  <UpgradePrompt
                    compact
                    title="Efeito na capa é um recurso Pro"
                    description="Use movimento ambiente para valorizar a sua imagem de capa."
                  />
                )}
              </Field>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Respeitamos a preferência do visitante por reduzir movimento no dispositivo.
          </p>
        </>
      )}
      {section === "photo" && (
        <>
          <MediaUploader
            label="Foto de perfil"
            value={bio.avatar_url}
            onChange={(avatar_url) => updateBio({ avatar_url })}
          />
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou WEBP até 5 MB. Uma imagem quadrada funciona melhor.
          </p>
        </>
      )}
      {section === "profile" && (
        <>
          <Field label="Nicho do negócio">
            <select
              className="input-base"
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
            >
              {NICHES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Usamos o nicho para recomendar capas mais adequadas ao seu negócio.
            </p>
          </Field>
          <Field label="Nome exibido">
            <input
              className="input-base"
              value={bio.display_name}
              placeholder={defaults.displayName}
              onChange={(event) => updateBio({ display_name: event.target.value })}
            />
          </Field>
          <Field label="Descrição">
            <textarea
              className="input-base"
              rows={4}
              value={bio.description ?? ""}
              placeholder="Conte brevemente o que você faz"
              onChange={(event) => updateBio({ description: event.target.value })}
            />
          </Field>
          <Field
            label={hasProfessionalSubdomain ? "Seu subdomínio profissional" : "Endereço da página"}
          >
            <input
              className="input-base"
              value={bio.slug}
              onChange={(event) => updateBio({ slug: event.target.value })}
              aria-invalid={Boolean(addressError)}
            />
            <p
              className={`mt-2 text-xs ${addressError ? "text-[color:var(--destructive)]" : "text-muted-foreground"}`}
            >
              {addressError ??
                (hasProfessionalSubdomain
                  ? `${normalizedSlug}.eialink.com.br`
                  : `eialink.com.br/p/${normalizedSlug}`)}
            </p>
            {hasProfessionalSubdomain && (
              <p className="mt-1 text-xs text-muted-foreground">
                Exclusivo do Pro. O endereço antigo continuará funcionando normalmente.
              </p>
            )}
          </Field>
        </>
      )}
      {section === "social" && (
        <div className="space-y-4">
          <p className="rounded-xl border border-border bg-surface-elevated/40 p-3 text-xs text-muted-foreground">
            Adicione somente os perfis que você usa. Eles aparecerão junto aos seus links quando o
            visual escolhido oferecer esse espaço.
          </p>
          {SOCIAL_NETWORKS.map(({ id, label, placeholder, icon: Icon }) => {
            const values = socialValues(bio.social_links);
            const value =
              id === "instagram" ? (values.instagram ?? bio.instagram ?? "") : (values[id] ?? "");
            return (
              <Field key={id} label={label}>
                <div className="relative">
                  <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[color:var(--primary)]" />
                  <input
                    className="input-base pl-9"
                    value={value}
                    placeholder={
                      id === "instagram" ? defaults.instagram || placeholder : placeholder
                    }
                    onChange={(event) => {
                      const next = { ...values };
                      const nextValue = event.target.value.trim();
                      if (nextValue) next[id] = nextValue;
                      else delete next[id];
                      updateBio({
                        social_links: next,
                        ...(id === "instagram" ? { instagram: event.target.value.trim() } : {}),
                      });
                    }}
                  />
                </div>
              </Field>
            );
          })}
        </div>
      )}
      {section === "contact" && (
        <>
          <Field label="WhatsApp">
            <input
              className="input-base"
              value={bio.whatsapp ?? ""}
              placeholder={defaults.whatsapp || "5511999999999"}
              onChange={(event) => updateBio({ whatsapp: event.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use apenas números, incluindo DDD e código do país.
            </p>
          </Field>
          <Field label="Mensagem inicial do WhatsApp">
            <textarea
              className="input-base min-h-24 resize-y"
              value={bio.whatsapp_message ?? ""}
              maxLength={1000}
              placeholder="Olá! Gostaria de saber mais sobre seus serviços."
              onChange={(event) => updateBio({ whatsapp_message: event.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Esta mensagem será preenchida para o visitante antes de abrir o WhatsApp.
            </p>
          </Field>
          <Field label="Texto do botão">
            <input
              className="input-base"
              value={bio.whatsapp_button_label ?? ""}
              maxLength={60}
              placeholder="Falar no WhatsApp"
              onChange={(event) => updateBio({ whatsapp_button_label: event.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use uma chamada curta e clara, por exemplo: “Pedir orçamento”.
            </p>
          </Field>
          <Field label="Texto de apoio do botão">
            <input
              className="input-base"
              value={bio.whatsapp_button_subtitle ?? ""}
              maxLength={80}
              placeholder="Resposta rápida"
              onChange={(event) => updateBio({ whatsapp_button_subtitle: event.target.value })}
            />
          </Field>
        </>
      )}
      {section === "pix" && (
        <Field label="Chave Pix">
          <input
            className="input-base"
            value={bio.pix_key ?? ""}
            placeholder="CPF, e-mail, celular ou chave aleatória"
            onChange={(event) => updateBio({ pix_key: event.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Chaves comuns exibem o botão de copiar. Para mostrar também um QR Code, cole um código
            Pix Copia e Cola completo.
          </p>
        </Field>
      )}
      {section === "links" && (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-border p-3">
              <input
                className="input-base mb-2"
                value={link.title}
                aria-label="Título do link"
                onChange={(event) => updateLink(link.id, { title: event.target.value })}
              />
              <input
                className="input-base"
                value={link.url}
                aria-label="Endereço do link"
                onChange={(event) => updateLink(link.id, { url: event.target.value })}
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="text-xs">
                  <input
                    type="checkbox"
                    checked={link.active}
                    onChange={(event) => updateLink(link.id, { active: event.target.checked })}
                  />{" "}
                  Exibir
                </label>
                <button
                  type="button"
                  className="text-xs text-[color:var(--destructive)]"
                  onClick={() => removeLink(link.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary w-full" onClick={addLink}>
            Adicionar link
          </button>
        </div>
      )}
      {section === "catalog" &&
        (planAccess?.features.catalog ? (
          <CatalogEditor
            items={products}
            onChange={setProducts}
            maxItems={planAccess.limits.catalog_items}
          />
        ) : (
          <UpgradePrompt
            compact
            title="Produtos e serviços ficam no Pro"
            description="Seu catálogo completo será liberado sem apagar nada que você já criou."
          />
        ))}
    </div>
  );
}

function MotionChoices({
  value,
  choices,
  onChange,
}: {
  value: string;
  choices: readonly (readonly [string, string])[];
  onChange(value: string): void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {choices.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            value === id
              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)]"
              : "border-border hover:border-[color:var(--primary)]/50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
