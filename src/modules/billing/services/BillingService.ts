import { supabase } from "@/integrations/supabase/client";
import type { Plan, ProfessionalService, Subscription } from "../types";

/** Single access point for subscription and monetisation data. */
export const BillingService = {
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase.from("plans").select("*").order("position");
    if (error) throw error;
    return data;
  },

  /** Public landing pages may only read plans that are currently available. */
  async listPublicPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
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
