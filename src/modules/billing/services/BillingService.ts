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
    const isOwner = auth.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    const isAdmin = isOwner || Boolean(roles?.some((r) => r.role === "admin"));
    const isPro = Boolean(
      active &&
        plan &&
        (["pro", "pro-monthly", "pro-yearly", "catalog"].includes(plan.slug) ||
          (plan.price_cents > 0 && plan.slug !== "essential")),
    );
    const notes = subscription?.notes || "";
    const hasBuilderAccessNote = notes.includes("builder_access:true");
    const canAccessBuilder = isAdmin || hasBuilderAccessNote;
    const hasComandaAccessNote = notes.includes("comanda_access:true");
    const canAccessComanda = isAdmin || hasComandaAccessNote;
    // A Agenda fica liberada por padrão; o Super Admin pode desligá-la por cliente.
    const canAccessAgenda = isAdmin || !notes.includes("agenda_access:false");

    return {
      plan,
      subscription,
      limits: plan ? toPlanLimits(plan.limits) : ESSENTIAL_LIMITS,
      features: plan ? toPlanFeatures(plan.features) : ESSENTIAL_FEATURES,
      isPro,
      canAccessBuilder,
      canAccessComanda,
      canAccessAgenda,
    };
  },
  async setBuilderAccess(userId: string, enabled: boolean) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, notes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub) return;

    let currentNotes = sub.notes || "";
    currentNotes = currentNotes.replace(/builder_access:(true|false)/g, "").trim();
    const newNotes = currentNotes
      ? `${currentNotes} builder_access:${enabled}`
      : `builder_access:${enabled}`;

    const { error } = await supabase
      .from("subscriptions")
      .update({ notes: newNotes })
      .eq("id", sub.id);

    if (error) throw error;
  },
  async setComandaAccess(userId: string, enabled: boolean) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, notes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub) return;

    let currentNotes = sub.notes || "";
    currentNotes = currentNotes.replace(/comanda_access:(true|false)/g, "").trim();
    const newNotes = currentNotes
      ? `${currentNotes} comanda_access:${enabled}`
      : `comanda_access:${enabled}`;

    const { error } = await supabase
      .from("subscriptions")
      .update({ notes: newNotes })
      .eq("id", sub.id);

    if (error) throw error;
  },
  async setAgendaAccess(userId: string, enabled: boolean) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, notes")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub) return;

    let currentNotes = sub.notes || "";
    currentNotes = currentNotes.replace(/agenda_access:(true|false)/g, "").trim();
    const newNotes = currentNotes
      ? `${currentNotes} agenda_access:${enabled}`
      : `agenda_access:${enabled}`;

    const { error } = await supabase
      .from("subscriptions")
      .update({ notes: newNotes })
      .eq("id", sub.id);

    if (error) throw error;
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

  async activateProMonthly(userId: string) {
    const { data: plans } = await supabase.from("plans").select("id, slug");
    const proPlan = plans?.find((p) => p.slug === "pro-monthly" || p.slug === "pro") || plans?.[0];
    if (!proPlan) throw new Error("Plano Pro não encontrado.");

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: proPlan.id,
          status: "active",
          billing_interval: "monthly",
          current_period_end: periodEnd.toISOString(),
          notes: "Ativação manual Pro (1 Mês) via Super Admin",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async activateProYearly(userId: string) {
    const { data: plans } = await supabase.from("plans").select("id, slug");
    const proPlan = plans?.find((p) => p.slug === "pro-yearly" || p.slug === "pro") || plans?.[0];
    if (!proPlan) throw new Error("Plano Pro não encontrado.");

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: proPlan.id,
          status: "active",
          billing_interval: "yearly",
          current_period_end: periodEnd.toISOString(),
          notes: "Ativação manual Pro (1 Ano) via Super Admin",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async revokePro(userId: string) {
    const { data: plans } = await supabase.from("plans").select("id, slug");
    const freePlan = plans?.find((p) => p.slug === "essential" || p.slug === "free") || plans?.[0];
    if (!freePlan) throw new Error("Plano Essencial não encontrado.");

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: freePlan.id,
          status: "cancelled",
          billing_interval: "monthly",
          current_period_end: null,
          notes: "Assinatura Pro revogada manualmente via Super Admin",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
