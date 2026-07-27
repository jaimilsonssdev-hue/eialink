import type { Tables } from "@/integrations/supabase/types";

export type PublicBio = Tables<"bio_pages">;
export type PublicLink = Tables<"bio_links">;

export type TrackEvent = (eventType: string, targetId?: string) => void;
