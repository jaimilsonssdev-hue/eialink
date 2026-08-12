import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import type { PageBlock } from "@/components/page-builder/types";
import type { CatalogItem } from "@/modules/products/types";
import { BrandingProvider } from "@/components/public-profile/BrandingContext";

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
    const publicStore = supabase as never as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }>;
    };
    const { data: hasProPlan } = await publicStore.rpc("page_has_pro_plan", {
      _bio_page_id: bio.id,
    });
    return {
      bio,
      links: links ?? [],
      blocks: (blocks ?? []) as PageBlock[],
      products: (products ?? []) as CatalogItem[],
      hasProPlan: Boolean(hasProPlan),
    };
  },
  head: ({ params, loaderData }) => {
    const url = `https://eialink.com.br/p/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }],
      };
    }
    const { bio } = loaderData;
    const description = bio.description ?? `Página profissional de ${bio.display_name}.`;
    const image = bio.cover_url ?? bio.avatar_url ?? null;
    return {
      meta: [
        { title: `${bio.display_name} — EIA Link` },
        { name: "description", content: description },
        { property: "og:title", content: bio.display_name },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: bio.display_name },
        { name: "twitter:description", content: description },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            name: bio.display_name,
            description,
            url,
            ...(image ? { image } : {}),
          }),
        },
      ],
    };
  },
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
  const { bio, links, blocks, products, hasProPlan } = Route.useLoaderData();
  const theme = VALID_THEMES.has(bio.theme) ? bio.theme : "aurora";
  // The established bio page remains the canonical source for the public
  // profile. Only additive layout blocks are rendered here, preventing an
  // existing draft block from hiding saved profile, link, and contact data.
  const supplementalBlocks = blocks.filter((block: PageBlock) =>
    ["contact", "divider", "spacer"].includes(block.type),
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    // The Supabase query builder only issues the request once it is awaited,
    // so the promise must be consumed for the page view to be recorded.
    void supabase
      .from("analytics_events")
      .insert({
        bio_page_id: bio.id,
        event_type: "view",
        utm_source: url.searchParams.get("utm_source"),
        utm_medium: url.searchParams.get("utm_medium"),
        utm_campaign: url.searchParams.get("utm_campaign"),
        referrer: document.referrer || null,
        device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
      })
      .then(({ error }) => {
        if (error) console.error("analytics view", error.message);
      });
  }, [bio.id]);

  function track(eventType: string, targetId?: string) {
    const device = /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop";
    void supabase
      .from("analytics_events")
      .insert({
        bio_page_id: bio.id,
        event_type: eventType,
        target_id: targetId ?? null,
        device,
        referrer: document.referrer || null,
      })
      .then(({ error }) => {
        if (error) console.error("analytics event", error.message);
      });
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
    <BrandingProvider show={!hasProPlan}>
      <TemplateRenderer
        bio={{ ...bio, theme }}
        links={links}
        onTrack={track}
        onShare={share}
        products={products}
        motionLevel={bio.motion_enabled === false ? "off" : hasProPlan ? "pro" : "standard"}
        supplemental={
          <>
            {supplementalBlocks.map((block: PageBlock) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </>
        }
      />
    </BrandingProvider>
  );
}
