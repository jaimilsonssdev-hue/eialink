import type { Json, Tables } from "@/integrations/supabase/types";

export type Plan = Tables<"plans">;
export type PublicPlan = Pick<
  Plan,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "price_cents"
  | "billing_interval"
  | "limits"
  | "features"
  | "active"
  | "position"
>;
export type Subscription = Tables<"subscriptions">;
export type ProfessionalService = Tables<"professional_services">;

export type PlanLimits = {
  bio_pages: number;
  links: number;
  catalog_items: number;
  templates: number;
};

export type PlanFeatures = {
  whatsapp: boolean;
  analytics: boolean;
  custom_domain: boolean;
};

export function toPlanLimits(value: Json): PlanLimits {
  const input = (value ?? {}) as Record<string, unknown>;
  return {
    bio_pages: Number(input.bio_pages ?? 1),
    links: Number(input.links ?? 5),
    catalog_items: Number(input.catalog_items ?? 3),
    templates: Number(input.templates ?? 1),
  };
}

export function toPlanFeatures(value: Json): PlanFeatures {
  const input = (value ?? {}) as Record<string, unknown>;
  return {
    whatsapp: Boolean(input.whatsapp),
    analytics: Boolean(input.analytics),
    custom_domain: Boolean(input.custom_domain),
  };
}

export function formatPlanPrice(priceCents: number, interval: string): string {
  if (priceCents === 0) return "Grátis";

  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);

  if (interval === "yearly") return `${value}/ano`;
  if (interval === "one_time") return value;
  return `${value}/mês`;
}
