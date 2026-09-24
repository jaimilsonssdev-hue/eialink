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
 */

export const StrategySchema = z.object({
  businessType: z.string().nullable().default(null),
  niche: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  audience: z.string().nullable().default(null),
  primaryGoal: z.enum(["whatsapp", "booking", "catalog", "delivery", "custom"]).default("whatsapp"),
  primaryCta: z.string().nullable().default(null),
  tone: z.string().nullable().default(null),
  confirmedFacts: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export const CreativeDirectionSchema = z.object({
  id: z.string().default("cinematic-noir"),
  name: z.string().default("Cinematográfico Premium"),
  referenceIds: z.array(z.string()).default([]),
  visualPrinciples: z.array(z.string()).default([]),
  motionIntensity: z.enum(["off", "subtle", "standard", "cinematic"]).default("subtle"),
});

export const ThemeProposalSchema = z.object({
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
});

export const PagePatchSchema = z.object({
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
});

export const LinkProposalSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string(),
  active: z.boolean().default(true),
  position: z.number().default(0),
  icon: z.string().nullable().optional(),
});

export const CatalogItemProposalSchema = z.object({
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
});

export const SectionMediaSchema = z.object({
  url: z.string(),
  role: z.string().optional(),
  caption: z.string().optional(),
});

export const SectionProposalSchema = z.object({
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
});

export const MediaAssignmentSchema = z.object({
  fileIndex: z.number().optional(),
  fileName: z.string(),
  assignedUrl: z.string(),
  assignedSectionId: z.string(),
  assignedRole: z.enum(["logo", "cover", "product", "gallery", "ambient", "testimonial"]),
  qualityScore: z.number().min(0).max(100).default(85),
  reasoning: z.string().optional(),
});

export const ProposalAuditSchema = z.object({
  criticalIssues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  unconfirmedContent: z.array(z.string()).default([]),
});

export const PremiumBetaProposalSchema = z.object({
  schemaVersion: z.literal(2).default(2),
  generator: z.literal("premium-beta").default("premium-beta"),
  status: z.literal("proposal").default("proposal"),
  strategy: StrategySchema,
  creativeDirection: CreativeDirectionSchema,
  theme: ThemeProposalSchema,
  pagePatch: PagePatchSchema,
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
});

export type PremiumBetaProposal = z.infer<typeof PremiumBetaProposalSchema>;
export type SectionProposal = z.infer<typeof SectionProposalSchema>;
export type MediaAssignment = z.infer<typeof MediaAssignmentSchema>;

