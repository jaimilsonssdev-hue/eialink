import { z } from "zod";

/**
 * SCHEMA ZOD OFICIAL DO GERADOR PREMIUM BETA (NÍVEL 2 - COMPOSIÇÃO LIVRE CONTROLADA)
 * Versão do Schema: 2.0.0
 * 
 * Regras Fundamentais:
 * 1. Ancoragem Rígida (Grounding): Separação explícita de fatos confirmados vs lacunas.
 * 2. Composição Estruturada: A IA escolhe e ordena blocos homologados, sem React/HTML solto.
 * 3. Alocação Rigorosa de Mídias: Cada foto fornecida é explicitamente atribuída a uma seção.
 * 4. Prévia Segura: A proposta é um documento temporário; publicação requer ação humana explícita.
 * 5. Normalização Universal (Tolerância & Resiliência): Aceita tanto camelCase quanto snake_case gerados pela IA.
 */

export const StrategySchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return {};
  let goal = (val.primaryGoal || val.primary_goal || "whatsapp").toLowerCase();
  const validGoals = ["whatsapp", "booking", "catalog", "delivery", "custom"];
  if (!validGoals.includes(goal)) goal = "whatsapp";

  return {
    businessType: val.businessType || val.business_type || null,
    niche: val.niche || null,
    city: val.city || null,
    audience: val.audience || null,
    primaryGoal: goal,
    primaryCta: val.primaryCta || val.primary_cta || null,
    tone: val.tone || null,
    confirmedFacts: Array.isArray(val.confirmedFacts)
      ? val.confirmedFacts
      : Array.isArray(val.confirmed_facts)
        ? val.confirmed_facts
        : [],
    missingInformation: Array.isArray(val.missingInformation)
      ? val.missingInformation
      : Array.isArray(val.missing_information)
        ? val.missing_information
        : [],
  };
}, z.object({
  businessType: z.string().nullable().default(null),
  niche: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  audience: z.string().nullable().default(null),
  primaryGoal: z.enum(["whatsapp", "booking", "catalog", "delivery", "custom"]).default("whatsapp"),
  primaryCta: z.string().nullable().default(null),
  tone: z.string().nullable().default(null),
  confirmedFacts: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
}));

export const CreativeDirectionSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return {};
  let motion = (val.motionIntensity || val.motion_intensity || "subtle").toLowerCase();
  const validMotions = ["off", "subtle", "standard", "cinematic"];
  if (!validMotions.includes(motion)) motion = "subtle";

  return {
    id: val.id || val.style_id || "cinematic-noir",
    name: val.name || val.title || val.style_name || "Cinematográfico Premium",
    referenceIds: Array.isArray(val.referenceIds)
      ? val.referenceIds
      : Array.isArray(val.reference_ids)
        ? val.reference_ids
        : [],
    visualPrinciples: Array.isArray(val.visualPrinciples)
      ? val.visualPrinciples
      : Array.isArray(val.visual_principles)
        ? val.visual_principles
        : [],
    motionIntensity: motion,
  };
}, z.object({
  id: z.string().default("cinematic-noir"),
  name: z.string().default("Cinematográfico Premium"),
  referenceIds: z.array(z.string()).default([]),
  visualPrinciples: z.array(z.string()).default([]),
  motionIntensity: z.enum(["off", "subtle", "standard", "cinematic"]).default("subtle"),
}));

export const ThemeProposalSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return {};
  return {
    paletteId: val.paletteId || val.palette_id || null,
    primary: val.primary || val.primary_color || val.primaryColor || "#10b981",
    background: val.background || val.bg || val.bg_color || "#030712",
    card_bg: val.card_bg || val.cardBg || val.card_color || "#0b0f19",
    border_color: val.border_color || val.borderColor || "#1e293b",
    title: val.title || val.title_color || "#ffffff",
    text: val.text || val.text_color || "#cbd5e1",
    mode: val.mode === "light" ? "light" : "dark",
    radius: val.radius || val.border_radius || "16px",
    density: ["compact", "comfortable", "spacious"].includes(val.density) ? val.density : "comfortable",
  };
}, z.object({
  paletteId: z.string().nullable().default(null),
  primary: z.string().default("#10b981"),
  background: z.string().default("#030712"),
  card_bg: z.string().default("#0b0f19"),
  border_color: z.string().default("#1e293b"),
  title: z.string().default("#ffffff"),
  text: z.string().default("#cbd5e1"),
  mode: z.enum(["dark", "light"]).default("dark"),
  radius: z.string().default("16px"),
  density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
}));

export const PagePatchSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return {};
  return {
    displayName: val.displayName || val.display_name || val.name || null,
    description: val.description || val.desc || null,
    whatsapp: val.whatsapp || val.phone || null,
    whatsappMessage: val.whatsappMessage || val.whatsapp_message || null,
    whatsappButtonLabel: val.whatsappButtonLabel || val.whatsapp_button_label || null,
    pixKey: val.pixKey || val.pix_key || null,
    instagram: val.instagram || null,
    avatarUrl: val.avatarUrl || val.avatar_url || val.logo_url || null,
    coverUrl: val.coverUrl || val.cover_url || val.banner_url || null,
    seo: val.seo && typeof val.seo === "object" ? {
      metaTitle: val.seo.metaTitle || val.seo.meta_title || val.metaTitle || val.meta_title || null,
      metaDescription: val.seo.metaDescription || val.seo.meta_description || val.metaDescription || val.meta_description || null,
    } : {},
  };
}, z.object({
  displayName: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  whatsapp: z.string().nullable().default(null),
  whatsappMessage: z.string().nullable().default(null),
  whatsappButtonLabel: z.string().nullable().default(null),
  pixKey: z.string().nullable().default(null),
  instagram: z.string().nullable().default(null),
  avatarUrl: z.string().nullable().default(null),
  coverUrl: z.string().nullable().default(null),
  seo: z
    .object({
      metaTitle: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
    })
    .default({}),
}));

export const LinkProposalSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  return {
    id: val.id || crypto.randomUUID(),
    title: val.title || val.name || "Link",
    url: val.url || "#",
    active: val.active !== false,
    position: typeof val.position === "number" ? val.position : 0,
    icon: val.icon || null,
  };
}, z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string(),
  active: z.boolean().default(true),
  position: z.number().default(0),
  icon: z.string().nullable().optional(),
}));

export const CatalogItemProposalSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  let price: number | null = null;
  if (typeof val.price === "number") {
    price = val.price;
  } else if (val.price) {
    const parsed = parseFloat(String(val.price).replace(/[^\d.,]/g, "").replace(",", "."));
    price = isNaN(parsed) ? null : parsed;
  }

  return {
    ...val,
    id: val.id || crypto.randomUUID(),
    name: val.name || val.title || "Item do Catálogo",
    description: val.description || val.desc || "",
    price,
    imageUrl: val.imageUrl || val.image_url || val.image || val.photo || null,
    category: val.category || val.cat || "Destaques",
    buttonLabel: val.buttonLabel || val.button_label || "Pedir no WhatsApp",
    buttonUrl: val.buttonUrl || val.button_url || null,
    active: val.active !== false,
    position: typeof val.position === "number" ? val.position : 0,
  };
}, z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().default(""),
  price: z.number().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  category: z.string().default("Destaques"),
  buttonLabel: z.string().default("Pedir no WhatsApp"),
  buttonUrl: z.string().nullable().default(null),
  active: z.boolean().default(true),
  position: z.number().default(0),
}));

export const SectionMediaSchema = z.preprocess((val: any) => {
  if (typeof val === "string") return { url: val };
  if (!val || typeof val !== "object") return { url: "" };
  return {
    url: val.url || val.imageUrl || val.image_url || "",
    role: val.role,
    caption: val.caption || val.alt || val.title,
  };
}, z.object({
  url: z.string(),
  role: z.string().optional(),
  caption: z.string().optional(),
}));

export const SectionProposalSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  const id = val.id || crypto.randomUUID();
  let type = (val.type || "hero").toLowerCase();
  const validTypes = [
    "hero",
    "differentials",
    "services_grid",
    "catalog_carousel",
    "about",
    "testimonials",
    "video",
    "contact_map",
    "links",
    "pix",
    "whatsapp_cta",
    "divider",
    "spacer",
  ];
  if (!validTypes.includes(type)) {
    if (type.includes("hero") || type.includes("banner")) type = "hero";
    else if (type.includes("servi") || type.includes("grid")) type = "services_grid";
    else if (type.includes("catal") || type.includes("carrousel") || type.includes("carousel") || type.includes("vitrine")) type = "catalog_carousel";
    else if (type.includes("diff") || type.includes("diferen") || type.includes("bento")) type = "differentials";
    else if (type.includes("depo") || type.includes("testim") || type.includes("review")) type = "testimonials";
    else if (type.includes("sobre") || type.includes("about")) type = "about";
    else if (type.includes("contat") || type.includes("map") || type.includes("local")) type = "contact_map";
    else if (type.includes("whats") || type.includes("cta")) type = "whatsapp_cta";
    else type = "services_grid";
  }

  const source = ["bio_pages", "catalog_items", "bio_links", "custom"].includes(val.source)
    ? val.source
    : "custom";

  return {
    ...val,
    id,
    type,
    variant: val.variant || "default",
    enabled: val.enabled !== false,
    position: typeof val.position === "number" ? val.position : 0,
    source,
    title: val.title,
    subtitle: val.subtitle,
    content: val.content && typeof val.content === "object" ? val.content : {},
    media: Array.isArray(val.media) ? val.media : [],
    appearance: val.appearance && typeof val.appearance === "object" ? val.appearance : {},
    motion: val.motion && typeof val.motion === "object" ? val.motion : {},
    visibility:
      val.visibility && typeof val.visibility === "object"
        ? val.visibility
        : { desktop: true, mobile: true },
  };
}, z.object({
  id: z.string(),
  type: z.enum([
    "hero",
    "differentials",
    "services_grid",
    "catalog_carousel",
    "about",
    "testimonials",
    "video",
    "contact_map",
    "links",
    "pix",
    "whatsapp_cta",
    "divider",
    "spacer",
  ]),
  variant: z.string().default("default"),
  enabled: z.boolean().default(true),
  position: z.number().default(0),
  source: z.enum(["bio_pages", "catalog_items", "bio_links", "custom"]).default("custom"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.record(z.any()).default({}),
  media: z.array(SectionMediaSchema).default([]),
  appearance: z.record(z.any()).default({}),
  motion: z.record(z.any()).default({}),
  visibility: z
    .object({
      desktop: z.boolean().default(true),
      mobile: z.boolean().default(true),
    })
    .default({ desktop: true, mobile: true }),
}));

export const MediaAssignmentSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  const fileName = val.fileName || val.file_name || val.name || "imagem";
  const assignedUrl = val.assignedUrl || val.assigned_url || val.url || "";
  const assignedSectionId =
    val.assignedSectionId ||
    val.assigned_section_id ||
    val.sectionId ||
    val.section_id ||
    val.section ||
    "hero";

  let rawRole = (val.assignedRole || val.assigned_role || val.role || "product").toLowerCase();
  const validRoles = ["logo", "cover", "product", "gallery", "ambient", "testimonial"];
  if (!validRoles.includes(rawRole)) {
    if (rawRole.includes("capa") || rawRole.includes("hero") || rawRole.includes("banner")) {
      rawRole = "cover";
    } else if (rawRole.includes("logo") || rawRole.includes("avatar") || rawRole.includes("perfil")) {
      rawRole = "logo";
    } else if (rawRole.includes("prato") || rawRole.includes("servico") || rawRole.includes("item") || rawRole.includes("produto")) {
      rawRole = "product";
    } else if (rawRole.includes("depoimento") || rawRole.includes("review")) {
      rawRole = "testimonial";
    } else {
      rawRole = "gallery";
    }
  }

  const qualityScore =
    typeof val.qualityScore === "number"
      ? val.qualityScore
      : typeof val.quality_score === "number"
        ? val.quality_score
        : typeof val.score === "number"
          ? val.score
          : 85;

  const reasoning = val.reasoning || val.reason || val.critique || `Foto atribuída para ${rawRole}.`;

  return {
    ...val,
    fileName,
    assignedUrl,
    assignedSectionId,
    assignedRole: rawRole,
    qualityScore,
    reasoning,
  };
}, z.object({
  fileIndex: z.number().optional(),
  fileName: z.string().default("imagem"),
  assignedUrl: z.string().default(""),
  assignedSectionId: z.string().default("hero"),
  assignedRole: z.enum(["logo", "cover", "product", "gallery", "ambient", "testimonial"]).default("product"),
  qualityScore: z.number().min(0).max(100).default(85),
  reasoning: z.string().optional(),
}));

export const ProposalAuditSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return {};
  return {
    criticalIssues: Array.isArray(val.criticalIssues)
      ? val.criticalIssues
      : Array.isArray(val.critical_issues)
        ? val.critical_issues
        : [],
    warnings: Array.isArray(val.warnings) ? val.warnings : [],
    suggestions: Array.isArray(val.suggestions) ? val.suggestions : [],
    unconfirmedContent: Array.isArray(val.unconfirmedContent)
      ? val.unconfirmedContent
      : Array.isArray(val.unconfirmed_content)
        ? val.unconfirmed_content
        : [],
  };
}, z.object({
  criticalIssues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  unconfirmedContent: z.array(z.string()).default([]),
}));

export const PremiumBetaProposalSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;

  // Normalização do root: suporta snake_case e camelCase
  const strategy = val.strategy || {};
  const creativeDirection = val.creativeDirection || val.creative_direction || {};
  const theme = val.theme || val.custom_theme || {};
  const pagePatch = val.pagePatch || val.page_patch || {
    displayName: val.displayName || val.display_name || val.name,
    description: val.description || val.desc,
    whatsapp: val.whatsapp,
    whatsappMessage: val.whatsappMessage || val.whatsapp_message,
    whatsappButtonLabel: val.whatsappButtonLabel || val.whatsapp_button_label,
    avatarUrl: val.avatarUrl || val.avatar_url,
    coverUrl: val.coverUrl || val.cover_url,
  };
  const links = Array.isArray(val.links) ? val.links : [];
  const catalogItems = Array.isArray(val.catalogItems)
    ? val.catalogItems
    : Array.isArray(val.catalog_items)
      ? val.catalog_items
      : Array.isArray(val.suggested_services)
        ? val.suggested_services
        : [];
  const sections = Array.isArray(val.sections) ? val.sections : [];
  const mediaAssignments = Array.isArray(val.mediaAssignments)
    ? val.mediaAssignments
    : Array.isArray(val.media_assignments)
      ? val.media_assignments
      : Array.isArray(val.curated_photos)
        ? val.curated_photos
        : [];
  const audit = val.audit || {};

  return {
    schemaVersion: 2,
    generator: "premium-beta",
    status: "proposal",
    strategy,
    creativeDirection,
    theme,
    pagePatch,
    links,
    catalogItems,
    sections,
    mediaAssignments,
    audit,
  };
}, z.object({
  schemaVersion: z.literal(2).default(2),
  generator: z.literal("premium-beta").default("premium-beta"),
  status: z.literal("proposal").default("proposal"),
  strategy: StrategySchema.default({}),
  creativeDirection: CreativeDirectionSchema.default({}),
  theme: ThemeProposalSchema.default({}),
  pagePatch: PagePatchSchema.default({}),
  links: z.array(LinkProposalSchema).default([]),
  catalogItems: z.array(CatalogItemProposalSchema).default([]),
  sections: z.array(SectionProposalSchema).default([]),
  mediaAssignments: z.array(MediaAssignmentSchema).default([]),
  audit: ProposalAuditSchema.default({
    criticalIssues: [],
    warnings: [],
    suggestions: [],
    unconfirmedContent: [],
  }),
}));

export type PremiumBetaProposal = z.infer<typeof PremiumBetaProposalSchema>;
export type SectionProposal = z.infer<typeof SectionProposalSchema>;
export type MediaAssignment = z.infer<typeof MediaAssignmentSchema>;
