import {
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
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import type { PublicBio, PublicLink } from "@/components/public-profile/types";
import type { Tables } from "@/integrations/supabase/types";
import { MediaUploader } from "./MediaUploader";
import { CatalogEditor } from "@/modules/products/components/CatalogEditor";
import { parseSocialLinks } from "@/lib/social-links";
import { UpgradePrompt, commercialWhatsAppUrl } from "@/modules/billing/components/UpgradePrompt";
import type { PlanAccess } from "@/modules/billing/types";

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

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "minha-pagina"
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
  defaults: { displayName: string; whatsapp: string; instagram: string };
  planAccess?: PlanAccess;
  onSave(data: {
    bio: BioForm;
    links: EditableLink[];
    products: CatalogItem[];
  }): Promise<{ products: CatalogItem[] }>;
}) {
  const [bio, setBio] = useState<BioForm>(initialBio);
  const [links, setLinks] = useState<EditableLink[]>(initialLinks);
  const [products, setProducts] = useState<CatalogItem[]>(initialProducts);
  const [selected, setSelected] = useState<EditorSection>();
  const [draftTemplate, setDraftTemplate] = useState(initialBio.template_id ?? "default");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState<string>();
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ initialBio, initialLinks, initialProducts }),
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const snapshot = JSON.stringify({ bio, links, products });
  const hasPendingChanges = snapshot !== savedSnapshot;
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
    if (window.matchMedia("(max-width: 767px)").matches) {
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
        bio: { ...bio, slug: slugify(bio.slug || bio.display_name) },
        links,
        products,
      });
      setProducts(result.products);
      setBio((current) => ({ ...current, slug: slugify(current.slug || current.display_name) }));
      setSavedSnapshot(
        JSON.stringify({
          bio: { ...bio, slug: slugify(bio.slug || bio.display_name) },
          links,
          products: result.products,
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
            Minha Página
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            Personalize como seus clientes encontram você.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Alterações pendentes
            </span>
          )}
          <button
            type="button"
            onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="btn-secondary xl:hidden"
          >
            Ver preview
          </button>
          <a
            href={`/p/${previewBio.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary hidden sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !hasPendingChanges}
            className="btn-primary"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Salvando..."
              : saveState === "error"
                ? "Tentar novamente"
                : hasPendingChanges
                  ? "Salvar"
                  : "Salvo"}
          </button>
        </div>
      </header>

      <div className="builder-layout grid gap-6 xl:grid-cols-[18rem_minmax(25rem,1fr)_22rem]">
        <aside className="builder-menu card-surface h-fit xl:sticky xl:top-24">
          {Array.from(
            new Set(
              MENU.filter((item) => item.id !== "catalog" || planAccess?.features.catalog).map(
                (item) => item.group,
              ),
            ),
          ).map((group) => (
            <div key={group} className="mb-5 last:mb-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
                {group}
              </p>
              <div className="grid gap-1">
                {MENU.filter(
                  (item) =>
                    item.group === group && (item.id !== "catalog" || planAccess?.features.catalog),
                ).map((item) => {
                  const Icon = item.icon;
                  const active = selected === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => select(item.id)}
                      className={`builder-menu-item rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "is-active" : ""}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-[color:var(--primary)]" />
                        {item.label}
                      </span>
                      <span className="mt-0.5 block pl-6 text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <main ref={previewRef} className="builder-preview-stage min-w-0 xl:order-none">
          <p className="builder-preview-label mb-3 text-center text-sm font-medium text-muted-foreground">
            Preview da sua página
          </p>
          <div
            className={`editor-phone-preview bio-theme ${previewBio.theme || "aurora"} mx-auto max-w-[25rem] overflow-hidden bg-background`}
          >
            <TemplateRenderer
              bio={previewBio}
              links={previewLinks.filter((link) => link.active)}
              onTrack={() => undefined}
              onShare={() => undefined}
              products={products}
              motionLevel={
                previewBio.motion_enabled === false
                  ? "off"
                  : planAccess?.features.advanced_appearance
                    ? "pro"
                    : "standard"
              }
            />
          </div>
        </main>

        <aside
          ref={inspectorRef}
          className="builder-inspector card-surface h-fit xl:sticky xl:top-24"
        >
          {!selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
                  Personalize sua página
                </p>
                <h2 className="mt-1 text-xl font-semibold">Por onde quer começar?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escolha uma opção simples para atualizar sua presença.
                </p>
              </div>
              {[
                ["appearance", "Alterar fundo e capa"],
                ["photo", "Adicionar foto"],
                ["profile", "Editar nome e descrição"],
                ["contact", "Configurar WhatsApp"],
                ["links", "Adicionar links"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => select(id as EditorSection)}
                  className="btn-secondary w-full justify-start"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <SectionForm
              section={selected}
              bio={bio}
              links={links}
              defaults={defaults}
              updateBio={updateBio}
              updateLink={updateLink}
              removeLink={(id) => setLinks((current) => current.filter((link) => link.id !== id))}
              addLink={addLink}
              products={products}
              setProducts={setProducts}
              planAccess={planAccess}
              draftTemplate={draftTemplate}
              setDraftTemplate={setDraftTemplate}
            />
          )}
          {saveState === "error" && (
            <p role="alert" className="mt-4 text-sm text-[color:var(--destructive)]">
              {validationMessage ||
                "Não foi possível salvar. Confira sua conexão e tente novamente."}
            </p>
          )}
        </aside>
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
  updateBio,
  updateLink,
  removeLink,
  addLink,
  products,
  setProducts,
  planAccess,
  draftTemplate,
  setDraftTemplate,
}: {
  section: EditorSection;
  bio: BioForm;
  links: EditableLink[];
  defaults: { displayName: string; whatsapp: string; instagram: string };
  updateBio(patch: Partial<BioForm>): void;
  updateLink(id: string, patch: Partial<EditableLink>): void;
  removeLink(id: string): void;
  addLink(): void;
  products: CatalogItem[];
  setProducts(items: CatalogItem[]): void;
  planAccess?: PlanAccess;
  draftTemplate: string;
  setDraftTemplate(id: string): void;
}) {
  const title = MENU.find((item) => item.id === section)?.label ?? "Personalizar";
  const [templateNotice, setTemplateNotice] = useState<string>();
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
          <Field label="Template">
            <div className="grid grid-cols-2 gap-2">
              {TemplateService.list()
                .filter(
                  (template) => planAccess?.features.premium_templates || template.id === "default",
                )
                .map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setDraftTemplate(template.id)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${draftTemplate === template.id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/15 text-[color:var(--primary)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary),transparent_70%)]" : "border-border hover:border-[color:var(--primary)]/50"}`}
                  >
                    {template.name}
                  </button>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  if (draftTemplate === (bio.template_id ?? "default")) return;
                  if (
                    window.confirm("Descartar a prévia deste visual e manter o template atual?")
                  ) {
                    setDraftTemplate(bio.template_id ?? "default");
                    setTemplateNotice("Prévia cancelada. O template atual foi mantido.");
                  }
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={() => {
                  if (TemplateService.get(draftTemplate).status === "active") {
                    updateBio({ template_id: draftTemplate });
                    setTemplateNotice("Visual aplicado à página. Clique em Salvar para publicar.");
                  }
                }}
              >
                Aplicar
              </button>
            </div>
            {templateNotice && (
              <p className="mt-2 text-xs text-[color:var(--primary)]" role="status">
                {templateNotice}
              </p>
            )}
          </Field>
          <MediaUploader
            label="Imagem de capa"
            value={bio.cover_url}
            variant="cover"
            templateId={draftTemplate}
            onChange={(cover_url) => updateBio({ cover_url })}
          />
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
            Escolha movimentos discretos para a sua página. A prévia é atualizada na hora e
            as opções ficam publicadas quando você clicar em Salvar.
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
              checked={bio.motion_enabled ?? true}
              onChange={(event) => updateBio({ motion_enabled: event.target.checked })}
              aria-label="Ativar animações na página"
            />
          </label>
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
          <Field label="Endereço da página">
            <input
              className="input-base"
              value={bio.slug}
              onChange={(event) => updateBio({ slug: event.target.value })}
            />
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
          <CatalogEditor items={products} onChange={setProducts} />
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
