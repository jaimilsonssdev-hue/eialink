import { supabase } from "@/integrations/supabase/client";

const store = supabase as never as {
  from: (table: "funnel_events") => {
    insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }>;
  };
};

/** Low-risk conversion events. Failure must never interrupt a visitor action. */
export const FunnelService = {
  async track(eventType: string, metadata: Record<string, unknown> = {}) {
    const { data } = await supabase.auth.getUser();
    const { error } = await store.from("funnel_events").insert({
      user_id: data.user?.id ?? null,
      event_type: eventType,
      metadata,
    });
    if (error && import.meta.env.DEV) console.warn("Funnel event was not recorded", error.message);
  },
};
