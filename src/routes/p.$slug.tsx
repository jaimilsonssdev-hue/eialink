import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import type { PageBlock } from "@/components/page-builder/types";
import type { CatalogItem } from "@/modules/products/types";
import { BrandingProvider } from "@/components/public-profile/BrandingContext";
import { FreeLinkRenderer } from "@/components/public-profile/FreeLinkRenderer";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";
import { WhatsAppTriageModal, type TriageConfig } from "@/components/public/WhatsAppTriageModal";


// The generated Supabase types predate page_blocks; keep the compatibility adapter local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockStore = supabase as never as { from: (table: "page_blocks") => any };
// catalog_items is introduced by the catalog migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogStore = supabase as never as { from: (table: "catalog_items") => any };

const FREE_TEMPLATE_IDS = new Set(["default", "free-showcase", "free-social"]);

function usesPremiumTemplate(templateId?: string | null) {
  return Boolean(templateId && !FREE_TEMPLATE_IDS.has(templateId));
}

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
    // A premium template can only be persisted by an account that had premium
    // template access. Treat that saved choice as a fail-safe so a stale Cloud
    // database function cannot make the public URL fall back to the Free
    // renderer while the builder preview shows the full mini-site.
    const renderFullPage = Boolean(hasProPlan) || usesPremiumTemplate(bio.template_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingStore = supabase as never as { from: (table: "booking_settings") => any };
    const { data: booking } = renderFullPage
      ? await bookingStore
          .from("booking_settings")
          .select("active")
          .eq("bio_page_id", bio.id)
          .eq("active", true)
          .maybeSingle()
      : { data: null };
    return {
      bio,
      links: links ?? [],
      blocks: (blocks ?? []) as PageBlock[],
      products: (products ?? []) as CatalogItem[],
      hasProPlan: renderFullPage,
      bookingActive: Boolean(booking),
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
  const { bio, links, blocks, products, hasProPlan, bookingActive } = Route.useLoaderData();
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

  const [isTriageOpen, setIsTriageOpen] = useState(false);

  const isDemo = Boolean(
    bio.description?.startsWith("[DEMO]") ||
      (bio.social_links as any)?.is_demo ||
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1"),
  );

  const socialConfig = (bio.social_links as Record<string, any>) || {};
  const isTriageActive = Boolean(socialConfig.triage_enabled);

  const triageConfig: TriageConfig = {
    enabled: isTriageActive,
    headerTitle: socialConfig.triage_title || "Atendimento Rápido",
    questions: socialConfig.triage_questions || [
      {
        title: "Como podemos te ajudar hoje?",
        options: ["Agendamento de Consulta / Atendimento", "Saber Preços e Valores", "Tirar Dúvidas Gerais"],
      },
      {
        title: "Qual o melhor período para você?",
        options: ["Manhã", "Tarde", "Horário Comercial"],
      },
    ],
  };

  const handleContainerClickCapture = (e: React.MouseEvent) => {
    if (!isTriageActive || !bio.whatsapp) return;
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    // Intercepta qualquer botão que aponte para o WhatsApp
    if (
      href.includes("wa.me") ||
      href.includes("whatsapp.com") ||
      anchor.classList.contains("public-profile-action-whatsapp") ||
      anchor.classList.contains("niche-clinic-cta-primary")
    ) {
      e.preventDefault();
      e.stopPropagation();
      setIsTriageOpen(true);
    }
  };

  return (
    <div onClickCapture={handleContainerClickCapture}>
      {isDemo && <DemoConversionBanner companyName={bio.display_name} />}
      <BrandingProvider show={!hasProPlan && !isDemo}>
        {hasProPlan ? (
          <TemplateRenderer
            bio={{ ...bio, theme }}
            links={links}
            onTrack={track}
            onShare={share}
            products={products}
            bookingUrl={bookingActive ? `/agendar/${bio.slug}` : undefined}
            motionLevel={bio.motion_enabled === false ? "off" : "pro"}
            supplemental={
              <>
                {supplementalBlocks.map((block: PageBlock) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
              </>
            }
          />
        ) : (
          <FreeLinkRenderer
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
        )}
      </BrandingProvider>

      {/* Modal de Triagem Inteligente para todos os layouts */}
      {isTriageActive && bio.whatsapp && (
        <WhatsAppTriageModal
          isOpen={isTriageOpen}
          onClose={() => setIsTriageOpen(false)}
          phone={bio.whatsapp}
          config={triageConfig}
          baseMessage={bio.whatsapp_message}
        />
      )}
    </div>
  );
}


