import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActionButtons } from "@/components/public-profile/ActionButtons";
import { Banner } from "@/components/public-profile/Banner";
import { Footer } from "@/components/public-profile/Footer";
import { FutureSections } from "@/components/public-profile/FutureSections";
import { PixCard } from "@/components/public-profile/PixCard";
import { ProfileHeader } from "@/components/public-profile/ProfileHeader";
import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import type { PageBlock } from "@/components/page-builder/types";

// The generated Supabase types predate page_blocks; keep the compatibility adapter local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockStore = supabase as never as { from: (table: "page_blocks") => any };

export const Route = createFileRoute("/p/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    const { data: bio } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!bio) throw notFound();
    const { data: links } = await supabase
      .from("bio_links")
      .select("*")
      .eq("bio_page_id", bio.id)
      .eq("active", true)
      .order("position");
    const { data: blocks } = await blockStore
      .from("page_blocks")
      .select("*")
      .eq("bio_page_id", bio.id)
      .eq("enabled", true)
      .order("position");
    return { bio, links: links ?? [], blocks: (blocks ?? []) as PageBlock[] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.bio.display_name} — EIA Digital` },
          {
            name: "description",
            content:
              loaderData.bio.description ??
              `Página profissional de ${loaderData.bio.display_name}.`,
          },
          { property: "og:title", content: loaderData.bio.display_name },
          { property: "og:description", content: loaderData.bio.description ?? "" },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }],
  }),
  component: PublicBio,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold gradient-text">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      </div>
    </div>
  ),
});

const VALID_THEMES = new Set(["aurora", "sunset", "ocean", "midnight", "mono", "forest"]);

function PublicBio() {
  const { bio, links, blocks } = Route.useLoaderData();
  const theme = VALID_THEMES.has(bio.theme) ? bio.theme : "aurora";

  useEffect(() => {
    const url = new URL(window.location.href);
    void supabase.from("analytics_events").insert({
      bio_page_id: bio.id,
      event_type: "view",
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      referrer: document.referrer || null,
      device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });
  }, [bio.id]);

  function track(eventType: string, targetId?: string) {
    void supabase
      .from("analytics_events")
      .insert({ bio_page_id: bio.id, event_type: eventType, target_id: targetId ?? null });
  }

  async function share() {
    const shareData = {
      title: bio.display_name,
      text: bio.description ?? "",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* The visitor cancelled sharing. */
      }
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className={`bio-theme ${theme} public-profile-shell`}>
      {blocks.length ? (
        <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          <Footer />
        </div>
      ) : (
        <>
          <Banner
            name={bio.display_name}
            coverUrl={bio.cover_url}
            coverPosition={bio.cover_position}
            coverFit={bio.cover_fit}
            overlay={bio.cover_overlay}
            overlayOpacity={bio.cover_overlay_opacity}
            onShare={share}
          />
          <div className="public-profile-content">
            <ProfileHeader bio={bio} onTrack={track} />
            {bio.pix_key && <PixCard pixKey={bio.pix_key} onTrack={track} />}
            <ActionButtons bio={bio} links={links} onTrack={track} />
            <FutureSections />
            <Footer />
          </div>
        </>
      )}
    </main>
  );
}
