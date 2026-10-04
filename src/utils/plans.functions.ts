import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ESSENTIAL_FEATURES, ESSENTIAL_LIMITS, type Plan } from "@/modules/billing/types";

const OWNER_EMAIL = "jaimilsonvendas@gmail.com";

function createServiceSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://gctwvvnjcxnsjiovhmsv.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_7cbVuf-q1wh7nqSeCXM1Ag_FMhRT2fS";

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Planos padrão de tração caso a tabela no banco ainda não tenha registros
const DEFAULT_FALLBACK_PLANS: Plan[] = [
  {
    id: "plan-pro-yearly",
    slug: "pro-yearly",
    name: "EIA Link Pro · Anual",
    description: "Acesso completo com vitrine estilo Instagram, IA e agendamento pelo ano inteiro com super desconto.",
    price_cents: 29000, // R$ 290,00
    billing_interval: "yearly",
    active: true,
    position: 1,
    limits: { bio_pages: -1, links: -1, catalog_items: -1, templates: -1 },
    features: { whatsapp: true, analytics: true, custom_domain: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_product_id: null,
  },
  {
    id: "plan-pro-monthly",
    slug: "pro-monthly",
    name: "EIA Link Pro · Mensal",
    description: "Sem fidelidade. Acesso completo liberado mês a mês para tracionar seu negócio.",
    price_cents: 2990, // R$ 29,90
    billing_interval: "monthly",
    active: true,
    position: 2,
    limits: { bio_pages: -1, links: -1, catalog_items: -1, templates: -1 },
    features: { whatsapp: true, analytics: true, custom_domain: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_product_id: null,
  },
];

/**
 * 1. Retorna todos os planos ativos para exibição pública na página de vendas (/assinar)
 */
export const getPublicPlansFn = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceSupabase();

  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar planos públicos no Supabase, usando padrão:", error.message);
      return DEFAULT_FALLBACK_PLANS;
    }

    if (!data || data.length === 0) {
      // Se a tabela estiver vazia, tenta fazer o seed inicial dos planos padrão
      try {
        for (const p of DEFAULT_FALLBACK_PLANS) {
          await supabase.from("plans").upsert(
            {
              name: p.name,
              slug: p.slug,
              description: p.description,
              price_cents: p.price_cents,
              billing_interval: p.billing_interval,
              active: p.active,
              position: p.position,
              limits: p.limits as any,
              features: p.features as any,
            },
            { onConflict: "slug" }
          );
        }
      } catch (seedErr) {
        console.warn("Erro no seed automático de planos:", seedErr);
      }
      return DEFAULT_FALLBACK_PLANS;
    }

    return (data as unknown as Plan[]).map((p) => ({
      ...p,
      limits: p.limits || ESSENTIAL_LIMITS,
      features: p.features || ESSENTIAL_FEATURES,
    }));
  } catch (e: any) {
    console.error("Falha ao recuperar planos públicos:", e);
    return DEFAULT_FALLBACK_PLANS;
  }
});

/**
 * 2. Retorna todos os planos (ativos e inativos) para o Super Admin
 */
export const adminListAllPlansFn = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceSupabase();

  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("position", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_FALLBACK_PLANS;
    }

    return (data as unknown as Plan[]).map((p) => ({
      ...p,
      limits: p.limits || ESSENTIAL_LIMITS,
      features: p.features || ESSENTIAL_FEATURES,
    }));
  } catch (e) {
    return DEFAULT_FALLBACK_PLANS;
  }
});

/**
 * 3. Cria ou atualiza plano (Super Admin)
 */
export const adminUpsertPlanFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id?: string;
      name: string;
      slug: string;
      description?: string | null;
      price_cents: number;
      billing_interval: "monthly" | "yearly";
      active: boolean;
      position?: number;
      limits?: any;
      features?: any;
    }) => input
  )
  .handler(async ({ data: input }) => {
    const supabase = createServiceSupabase();

    const planData: Record<string, unknown> = {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      price_cents: input.price_cents,
      billing_interval: input.billing_interval,
      active: input.active,
      updated_at: new Date().toISOString(),
    };

    if (input.position !== undefined) {
      planData.position = input.position;
    }
    if (input.limits) {
      planData.limits = input.limits;
    }
    if (input.features) {
      planData.features = input.features;
    }

    if (input.id) {
      const { data, error } = await supabase
        .from("plans")
        .update(planData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as Plan;
    } else {
      const { data, error } = await supabase
        .from("plans")
        .insert(planData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as Plan;
    }
  });

/**
 * 4. Exclui ou desativa plano (Super Admin)
 */
export const adminDeletePlanFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = createServiceSupabase();

    // Primeiro tenta desativar
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", id);

    if (error) {
      // Se tiver foreign key vinculada a subscriptions, apenas desativa
      const { error: deactivateErr } = await supabase
        .from("plans")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (deactivateErr) throw new Error(deactivateErr.message);
      return { success: true, deactivated: true };
    }

    return { success: true, deleted: true };
  });
