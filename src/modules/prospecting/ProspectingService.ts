import { supabase } from "@/integrations/supabase/client";
import { priorityFromScore, scoreCompany } from "./scoring";
import type {
  ProspectDraft,
  ProspectStatus,
  ProspectedCompany,
  ProspectingActivity,
} from "./types";

export const ProspectingService = {
  async list(): Promise<ProspectedCompany[]> {
    const { data, error } = await supabase
      .from("prospected_companies")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProspectedCompany[];
  },

  async listDedupeKeys(): Promise<Set<string>> {
    const { data, error } = await supabase.from("prospected_companies").select("dedupe_key");
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((row) => row.dedupe_key));
  },

  async listActivities(companyId: string): Promise<ProspectingActivity[]> {
    const { data, error } = await supabase
      .from("prospecting_activities")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProspectingActivity[];
  },

  /** Insere ignorando duplicados já existentes (dedupe_key único). */
  async importMany(drafts: ProspectDraft[]) {
    if (!drafts.length) return { inserted: 0 };
    const { data: user } = await supabase.auth.getUser();
    const payload = drafts.map((draft) => ({ ...draft, created_by: user.user?.id ?? null }));
    const { data, error } = await supabase
      .from("prospected_companies")
      .upsert(payload, { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: data?.length ?? 0 };
  },

  async create(draft: ProspectDraft) {
    const score = scoreCompany(draft);
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("prospected_companies").insert({
      ...draft,
      score,
      priority: priorityFromScore(score),
      created_by: user.user?.id ?? null,
    });
    if (error) {
      throw new Error(
        error.code === "23505" ? "Esta empresa já existe no radar." : error.message,
      );
    }
  },

  async updateStatus(id: string, status: ProspectStatus, nextActionAt?: string | null) {
    const { error } = await supabase
      .from("prospected_companies")
      .update({
        status,
        next_action_at: nextActionAt ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async registerActivity(input: {
    companyId: string;
    channel: ProspectingActivity["channel"];
    outcome: ProspectingActivity["outcome"];
    message?: string | null;
    notes?: string | null;
    status?: ProspectStatus;
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Sessão expirada.");
    const { error } = await supabase.from("prospecting_activities").insert({
      company_id: input.companyId,
      admin_id: user.user.id,
      channel: input.channel,
      outcome: input.outcome,
      message: input.message ?? null,
      notes: input.notes ?? null,
    });
    if (error) throw new Error(error.message);
    const { error: updateError } = await supabase
      .from("prospected_companies")
      .update({
        last_contacted_at: new Date().toISOString(),
        ...(input.status ? { status: input.status } : {}),
      })
      .eq("id", input.companyId);
    if (updateError) throw new Error(updateError.message);
  },

  async remove(id: string) {
    const { error } = await supabase.from("prospected_companies").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async updateNotes(id: string, notes: string) {
    const { error } = await supabase
      .from("prospected_companies")
      .update({ notes })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

