import { supabase } from "@/integrations/supabase/client";
export const AnalyticsService = {
  async getCurrentPageEvents(pageId?: string | null) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão inválida.");
    const { data: rawPages, error: bioError } = await supabase
      .from("bio_pages")
      .select("id, display_name, slug, updated_at, published, social_links")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });
    if (bioError) throw bioError;
    const pages = (rawPages ?? []).filter((page) => pageId ? true : !(page.social_links as any)?.is_demo);
    const bio = (rawPages ?? []).find((page) => page.id === pageId) ?? pages[0] ?? null;
    if (!bio) return { bio: null, pages: [], events: [] };
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("bio_page_id", bio.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { bio, pages: pages ?? [], events: events ?? [] };
  },
};
