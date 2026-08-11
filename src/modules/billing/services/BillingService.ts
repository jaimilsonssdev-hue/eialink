import { supabase } from "@/integrations/supabase/client";
import {
  ESSENTIAL_FEATURES,
  ESSENTIAL_LIMITS,
  toPlanFeatures,
  toPlanLimits,
  type Plan,
  type PlanAccess,
  type ProfessionalService,
  type PublicPlan,
  type Subscription,
} from "../types";

/** Single access point for subscription and monetisation data. */
export const BillingService = {
  async getCurrentAccess(): Promise<PlanAccess> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error(authError?.message ?? "Sessão inválida.");

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;

    const subscription = data as (Subscription & { plans?: Plan | null }) | null;
    const plan = subscription?.plans ?? null;
    const active = subscription?.status === "active" || subscription?.status === "trialing";
    const isPro = Boolean(active && plan && plan.slug !== "essential");

    return {
      plan,
      subscription,
      limits: plan ? toPlanLimits(plan.limits) : ESSENTIAL_LIMITS,
      features: plan ? toPlanFeatures(plan.features) : ESSENTIAL_FEATURES,
      isPro,
    };
  },
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase.from("plans").select("*").order("position");
    if (error) throw error;
    return data;
  },

  /** Public landing pages may only read plans that are currently available. */
  async listPublicPlans(): Promise<PublicPlan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select(
        "id, slug, name, description, price_cents, billing_interval, limits, features, active, position",
      )
      .eq("active", true)
      .order("position");
    if (error) throw error;
    return data;
  },

  async listSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async listServices(): Promise<ProfessionalService[]> {
    const { data, error } = await supabase
      .from("professional_services")
      .select("*")
      .order("position");
    if (error) throw error;
    return data;
  },

  async updateSubscription(
    userId: string,
    input: Pick<
      Subscription,
      "plan_id" | "status" | "billing_interval" | "current_period_end" | "notes"
    >,
  ) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update(input)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePlan(
    id: string,
    input: Partial<
      Pick<Plan, "name" | "description" | "price_cents" | "active" | "limits" | "features">
    >,
  ) {
    const { data, error } = await supabase
      .from("plans")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateService(
    id: string,
    input: Partial<
      Pick<
        ProfessionalService,
        "title" | "description" | "whatsapp_message" | "active" | "position"
      >
    >,
  ) {
    const { data, error } = await supabase
      .from("professional_services")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
