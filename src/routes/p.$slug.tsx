import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import type { PageBlock } from "@/components/page-builder/types";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import type { CatalogItem } from "@/modules/products/types";

// The generated Supabase types predate page_blocks; keep the compatibility adapter local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockStore = supabase as never as { from: (table: "page_blocks") => any };
// catalog_items is introduced by the catalog migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogStore = supabase as never as { from: (table: "catalog_items") => any };

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
    const { data: products } = await catalogStore
      .from("catalog_items")
      .select("*")
      .eq("bio_page_id", bio.id)
      .eq("active", true)
      .order("position");
    return {
      bio,
      links: links ?? [],
      blocks: (blocks ?? []) as PageBlock[],
      products: (products ?? []) as CatalogItem[],
    };
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
  const { bio, links, blocks, products } = Route.useLoaderData();
  const theme = VALID_THEMES.has(bio.theme) ? bio.theme : "aurora";
  // The established bio page remains the canonical source for the public
  // profile. Only additive layout blocks are rendered here, preventing an
  // existing draft block from hiding saved profile, link, and contact data.
  const supplementalBlocks = blocks.filter((block: PageBlock) =>
    ["contact", "divider", "spacer"].includes(block.type),
  );

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
    <TemplateRenderer
      bio={{ ...bio, theme }}
      links={links}
      onTrack={track}
      onShare={share}
      products={products}
      supplemental={
        <>
          {supplementalBlocks.map((block: PageBlock) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </>
      }
    />
  );
}
