import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const analyticsEventSchema = z.object({
  bioPageId: z.string().uuid(),
  eventType: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  targetId: z.string().uuid().nullable().optional(),
  utmSource: z.string().max(200).nullable().optional(),
  utmMedium: z.string().max(200).nullable().optional(),
  utmCampaign: z.string().max(200).nullable().optional(),
  device: z.enum(["mobile", "desktop", "tablet", "unknown"]).nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
});

const mediaRequestSchema = z.object({
  bioPageId: z.string().uuid(),
  paths: z.array(z.string().min(1).max(1024)).max(100),
});

function storagePath(value?: string | null): string | null {
  if (!value) return null;
  const markers = [
    "/storage/v1/object/public/bio-media/",
    "/storage/v1/object/sign/bio-media/",
  ];
  for (const marker of markers) {
    const index = value.indexOf(marker);
    if (index < 0) continue;
    const encoded = value.slice(index + marker.length).split("?")[0];
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return value.includes("://") ? null : value;
}

export const recordPublicAnalyticsEventFn = createServerFn({ method: "POST" })
  .inputValidator((input) => analyticsEventSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: page } = await supabaseAdmin
      .from("bio_pages")
      .select("id")
      .eq("id", data.bioPageId)
      .eq("published", true)
      .maybeSingle();
    if (!page) throw new Error("Página não disponível.");

    if (data.targetId) {
      const [{ data: link }, { data: item }] = await Promise.all([
        supabaseAdmin
          .from("bio_links")
          .select("id")
          .eq("id", data.targetId)
          .eq("bio_page_id", data.bioPageId)
          .eq("active", true)
          .maybeSingle(),
        supabaseAdmin
          .from("catalog_items")
          .select("id")
          .eq("id", data.targetId)
          .eq("bio_page_id", data.bioPageId)
          .eq("active", true)
          .maybeSingle(),
      ]);
      if (!link && !item) throw new Error("Destino inválido.");
    }

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      bio_page_id: data.bioPageId,
      event_type: data.eventType,
      target_id: data.targetId ?? null,
      utm_source: data.utmSource ?? null,
      utm_medium: data.utmMedium ?? null,
      utm_campaign: data.utmCampaign ?? null,
      device: data.device ?? null,
      referrer: data.referrer ?? null,
    });
    if (error) throw new Error("Não foi possível registrar o evento.");
    return { success: true };
  });

export const signPublishedBioMediaFn = createServerFn({ method: "POST" })
  .inputValidator((input) => mediaRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: page } = await supabaseAdmin
      .from("bio_pages")
      .select("user_id, avatar_url, cover_url")
      .eq("id", data.bioPageId)
      .eq("published", true)
      .maybeSingle();
    if (!page) throw new Error("Página não disponível.");

    if (data.paths.length === 0) return { signedUrls: [] as string[] };

    const urls = data.paths.map((path) => {
      const { data: pub } = supabaseAdmin.storage.from("bio-media").getPublicUrl(path);
      return pub.publicUrl;
    });

    return { signedUrls: urls };
  });