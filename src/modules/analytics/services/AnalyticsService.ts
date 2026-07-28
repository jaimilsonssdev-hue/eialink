import { supabase } from "@/integrations/supabase/client";
export const AnalyticsService = {
  async getCurrentPageEvents() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão inválida.");
    const { data: bio, error: bioError } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (bioError) throw bioError;
    if (!bio) return null;
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("bio_page_id", bio.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { bio, events: events ?? [] };
  },
};
