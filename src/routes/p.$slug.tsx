import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";
import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import type { PageBlock } from "@/components/page-builder/types";
import type { CatalogItem } from "@/modules/products/types";
import { parseCatalogItemCategory } from "@/modules/products/services/ProductService";
import { BrandingProvider } from "@/components/public-profile/BrandingContext";
import { FreeLinkRenderer } from "@/components/public-profile/FreeLinkRenderer";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";
import { detectNicheKey, isHealthBookingNiche, isProductCatalogNiche } from "@/modules/prospecting/nichePresets";
import { generateSvgAvatar } from "@/lib/HtmlGraphicGenerator";
import { WhatsAppTriageModal, type TriageConfig } from "@/components/public/WhatsAppTriageModal";
import { MobileStickyBar } from "@/components/public-profile/MobileStickyBar";
import { ModularSections } from "@/components/public-profile/ModularSections";
import { AiAssistantChat } from "@/components/public/AiAssistantChat";
import { bioMediaPath } from "@/lib/bio-media";
import {
  recordPublicAnalyticsEventFn,
  signPublishedBioMediaFn,
} from "@/lib/public-page.functions";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { ComandaFloatingBar } from "@/components/public/ComandaFloatingBar";


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
    const nicheKey = detectNicheKey((bio.social_links as any)?.niche, bio.display_name);
    const isHealth = isHealthBookingNiche(nicheKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingStore = supabase as never as { from: (table: "booking_settings") => any };
    const { data: booking } = (renderFullPage && isHealth)
      ? await bookingStore
          .from("booking_settings")
          .select("active")
          .eq("bio_page_id", bio.id)
          .eq("active", true)
          .maybeSingle()
      : { data: null };
    const mediaValues = [
      bio.avatar_url,
      bio.cover_url,
      ...(products ?? []).map((product: { image_url?: string | null }) => product.image_url ?? null),
    ];
    const mediaPaths = mediaValues.map(bioMediaPath);
    const storedPaths = mediaPaths.filter((path): path is string => Boolean(path));
    const { signedUrls } = await signPublishedBioMediaFn({
      data: { bioPageId: bio.id, paths: storedPaths },
    });
    let signedIndex = 0;
    const resolvedMedia = mediaValues.map((value, index) =>
      mediaPaths[index] ? signedUrls[signedIndex++] ?? null : value,
    );
    const [avatarUrl, coverUrl, ...productImageUrls] = resolvedMedia;
    const protectedBio = { ...bio, avatar_url: avatarUrl, cover_url: coverUrl };
    const protectedProducts = (products ?? []).map((product: CatalogItem, index: number) => ({
      ...product,
      image_url: productImageUrls[index] ?? null,
    }));
    return {
      bio: protectedBio,
      links: links ?? [],
      blocks: (blocks ?? []) as PageBlock[],
      products: protectedProducts.map((p: CatalogItem) => {
        const { category, description } = parseCatalogItemCategory(p);
        return { ...p, category, description };
      }),
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
    const { bio, products } = loaderData;
    const socialData = (bio.social_links && typeof bio.social_links === "object" ? bio.social_links : {}) as Record<string, any>;
    const seoConfig = socialData.seo || {};

    const pageTitle = seoConfig.title?.trim() || `${bio.display_name} — Atendimento Oficial`;
    const description = seoConfig.description?.trim() || bio.description || `Página profissional oficial de ${bio.display_name}. Confira nossos serviços e fale conosco pelo WhatsApp.`;
    const image = bio.cover_url ?? bio.avatar_url ?? null;
    const isIndexable = seoConfig.indexable !== false;
    const robotsContent = isIndexable
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, nofollow";

    const businessType = seoConfig.businessType || "LocalBusiness";
    const address = socialData.address || null;
    const rating = socialData.google_rating ? Number(socialData.google_rating) : null;
    const reviewsCount = socialData.reviews_count ? Number(socialData.reviews_count) : null;
    const priceRange = seoConfig.priceRange || "$$";

    // Dados estruturados JSON-LD ricos com suporte a estrelas e catálogo de ofertas
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${url}#profile`,
          name: bio.display_name,
          description,
          url,
          ...(image ? { image } : {}),
        },
        {
          "@type": businessType,
          "@id": `${url}#business`,
          name: bio.display_name,
          description,
          url,
          ...(bio.whatsapp ? { telephone: bio.whatsapp } : {}),
          ...(image ? { image: [image] } : {}),
          ...(address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: address,
                  addressCountry: "BR",
                },
              }
            : {}),
          ...(rating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: rating,
                  reviewCount: reviewsCount || 35,
                  bestRating: "5",
                  worstRating: "1",
                },
              }
            : {}),
          priceRange,
          ...(products && products.length > 0
            ? {
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: "Serviços e Tratamentos",
                  itemListElement: products.slice(0, 10).map((p: CatalogItem, idx: number) => ({
                    "@type": "Offer",
                    position: idx + 1,
                    itemOffered: {
                      "@type": "Service",
                      name: (p as any).title || p.name,
                      description: p.description || undefined,
                      ...(p.image_url ? { image: p.image_url } : {}),
                    },
                    ...(p.price ? { price: Number(p.price), priceCurrency: "BRL" } : {}),
                  })),
                },
              }
            : {}),
        },
      ],
    };

    const companyLogo = bio.avatar_url || bio.cover_url || null;
    const themePrimaryColor =
      socialData.theme_colors?.primary ||
      socialData.custom_theme?.primary ||
      "#10081d";

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: description },
        { name: "robots", content: robotsContent },
        { name: "apple-mobile-web-app-title", content: bio.display_name },
        { name: "application-name", content: bio.display_name },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "theme-color", content: themePrimaryColor },
        ...(seoConfig.keywords ? [{ name: "keywords", content: seoConfig.keywords }] : []),
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "business.business" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: description },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [
        { rel: "canonical", href: url },
        {
          rel: "manifest",
          href: `/api/manifest?slug=${encodeURIComponent(bio.slug)}`,
          key: "pwa-manifest",
        },
        ...(companyLogo
          ? [
              { rel: "apple-touch-icon", href: companyLogo, key: "apple-touch-icon" },
              { rel: "icon", href: companyLogo, key: "favicon-svg" },
              { rel: "icon", href: companyLogo, key: "favicon-png" },
            ]
          : [
              { rel: "apple-touch-icon", href: "/icons/eia-link-icon.svg", key: "apple-touch-icon" },
            ]),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
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
    if (typeof document === "undefined") return;
    // Sincroniza dinamicamente o Web App Manifest e ícones para que o app seja baixado com nome e logo da empresa
    const manifestUrl = `/api/manifest?slug=${encodeURIComponent(bio.slug)}`;
    let manifestEl = document.querySelector('link[rel="manifest"]');
    if (!manifestEl) {
      manifestEl = document.createElement("link");
      manifestEl.setAttribute("rel", "manifest");
      document.head.appendChild(manifestEl);
    }
    manifestEl.setAttribute("href", manifestUrl);

    const logo = bio.avatar_url || bio.cover_url;
    if (logo) {
      let appleIconEl = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIconEl) {
        appleIconEl = document.createElement("link");
        appleIconEl.setAttribute("rel", "apple-touch-icon");
        document.head.appendChild(appleIconEl);
      }
      appleIconEl.setAttribute("href", logo);

      const favicons = document.querySelectorAll('link[rel="icon"]');
      if (favicons.length > 0) {
        favicons.forEach((fav) => {
          fav.setAttribute("href", logo);
          fav.removeAttribute("type");
        });
      } else {
        const newFavicon = document.createElement("link");
        newFavicon.setAttribute("rel", "icon");
        newFavicon.setAttribute("href", logo);
        document.head.appendChild(newFavicon);
      }
    }

    let appleTitleEl = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleEl) {
      appleTitleEl = document.createElement("meta");
      appleTitleEl.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(appleTitleEl);
    }
    appleTitleEl.setAttribute("content", bio.display_name);

    let appNameEl = document.querySelector('meta[name="application-name"]');
    if (!appNameEl) {
      appNameEl = document.createElement("meta");
      appNameEl.setAttribute("name", "application-name");
      document.head.appendChild(appNameEl);
    }
    appNameEl.setAttribute("content", bio.display_name);
  }, [bio.slug, bio.avatar_url, bio.cover_url, bio.display_name]);

  useEffect(() => {
    const url = new URL(window.location.href);
    // The Supabase query builder only issues the request once it is awaited,
    // so the promise must be consumed for the page view to be recorded.
    void recordPublicAnalyticsEventFn({
      data: {
        bioPageId: bio.id,
        eventType: "view",
        utmSource: url.searchParams.get("utm_source")?.slice(0, 200) ?? null,
        utmMedium: url.searchParams.get("utm_medium")?.slice(0, 200) ?? null,
        utmCampaign: url.searchParams.get("utm_campaign")?.slice(0, 200) ?? null,
        referrer: document.referrer.slice(0, 2048) || null,
        device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
      },
    }).catch(() => undefined);
  }, [bio.id]);

  function track(eventType: string, targetId?: string) {
    const device = /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop";
    void recordPublicAnalyticsEventFn({
      data: {
        bioPageId: bio.id,
        eventType,
        targetId: targetId ?? null,
        device,
        referrer: document.referrer.slice(0, 2048) || null,
      },
    }).catch(() => undefined);
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
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  const isDemo = Boolean(
    bio.description?.startsWith("[DEMO]") ||
      (bio.social_links as any)?.is_demo ||
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1"),
  );

  const socialConfig = (bio.social_links as Record<string, any>) || {};
  const isTriageActive = Boolean(socialConfig.triage_enabled);
  const isAiChatActive = Boolean(socialConfig.ai_chat_enabled);

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

    // IMPORTANTE: Links de agendamento online NUNCA devem abrir a triagem de WhatsApp, vão direto para a agenda
    if (href.includes("/agendar/") || href.startsWith("/agendar")) {
      return;
    }

    // Links de conversão da agência (banner demo) ou marcados com data-no-triage NUNCA abrem triagem
    if (
      anchor.closest("[data-no-triage]") ||
      anchor.hasAttribute("data-no-triage") ||
      anchor.closest("aside")
    ) {
      return;
    }

    // Intercepta qualquer botão que aponte para o WhatsApp
    if (
      href.includes("wa.me") ||
      href.includes("whatsapp.com") ||
      anchor.classList.contains("public-profile-action-whatsapp")
    ) {
      e.preventDefault();
      e.stopPropagation();
      setIsTriageOpen(true);
    }
  };

  const isFreeTemplate = !bio.template_id || bio.template_id === "default" || bio.template_id.startsWith("free-");
  const shouldUseTemplate = !isFreeTemplate || hasProPlan || isDemo;

  const nicheKey = detectNicheKey((bio.social_links as any)?.niche, bio.display_name);
  const isProduct = isProductCatalogNiche(nicheKey);
  const isHealth = isHealthBookingNiche(nicheKey);

  const isServiceBookingNiche = isHealth || nicheKey === "barbearia" || nicheKey === "beleza";

  // Auto-correção dinâmica e isolamento estrito de nichos:
  // 1. Template de terapia (therapy-wellbeing) é ESTRITAMENTE reservado para psicologia
  // 2. Template de clínica (clinic-care) é reservado para saúde médica/odontológica/nutrição
  // 3. Template de beleza (beauty-glam) é exclusivo de salão de beleza e estética
  // 4. Templates jurídicos NUNCA aparecem fora de advocacia
  // 5. Template de academia (academy-performance) é ESTRITAMENTE reservado para fitness/academia
  // 6. Template de cardápio/restaurante (restaurant-menu) é exclusivo para gastronomia/alimentação
  // 7. Nichos de produto/delivery (açaí, sorveteria, bebidas, delivery, etc.) renderizam cinematic-glass ou catálogo
  let effectiveTemplateId = bio.template_id;

  if (
    effectiveTemplateId !== "site-maquina" &&
    effectiveTemplateId !== "storefront" &&
    effectiveTemplateId !== "store-showcase"
  ) {
  if (effectiveTemplateId === "therapy-wellbeing" && nicheKey !== "psicologia") {
    effectiveTemplateId = isProduct
      ? "cinematic-glass"
      : isHealth
        ? "clinic-care"
        : nicheKey === "beleza"
          ? "beauty-glam"
          : nicheKey === "advocacia"
            ? "law-authority"
            : "business-modern";
  }

  if (effectiveTemplateId === "clinic-care" && !isHealth) {
    effectiveTemplateId = isProduct
      ? "cinematic-glass"
      : nicheKey === "beleza"
        ? "beauty-glam"
        : nicheKey === "advocacia"
          ? "law-authority"
          : "business-modern";
  }

  if (effectiveTemplateId === "beauty-glam" && nicheKey !== "beleza") {
    effectiveTemplateId = isProduct || nicheKey === "barbearia" ? "cinematic-glass" : "business-modern";
  }

  if (nicheKey !== "advocacia" && effectiveTemplateId === "law-authority") {
    effectiveTemplateId = isProduct ? "cinematic-glass" : "business-modern";
  }

  if (effectiveTemplateId === "academy-performance" && nicheKey !== "fitness") {
    effectiveTemplateId = isProduct
      ? "cinematic-glass"
      : isHealth
        ? "clinic-care"
        : nicheKey === "beleza"
          ? "beauty-glam"
          : nicheKey === "advocacia"
            ? "law-authority"
            : "business-modern";
  }

  const isGastronomyNiche = isProduct || ["restaurante", "delivery", "sorveteria", "bebidas", "hamburgueria", "pizzaria", "cafeteria", "japones"].includes(nicheKey);
  if (effectiveTemplateId === "restaurant-menu" && !isGastronomyNiche) {
    effectiveTemplateId = isHealth
      ? "clinic-care"
      : nicheKey === "beleza"
        ? "beauty-glam"
        : nicheKey === "advocacia"
          ? "law-authority"
          : nicheKey === "fitness"
            ? "academy-performance"
            : "business-modern";
  }

  if (isProduct && (effectiveTemplateId === "business-modern" || effectiveTemplateId === "restaurant-menu" || !effectiveTemplateId)) {
    effectiveTemplateId = "cinematic-glass";
  }
  }

  if (effectiveTemplateId === "storefront") {
    effectiveTemplateId = "store-showcase";
  }

  // Se for uma demonstração de prospecção com template default/business-modern, promove automaticamente
  // para o Site Institucional Máquina de Sites (Landing Page completa)
  if (isDemo && (!effectiveTemplateId || effectiveTemplateId === "business-modern" || effectiveTemplateId === "default")) {
    effectiveTemplateId = "site-maquina";
  }

  // Se o avatar gravado for foto genérica de pessoas do Unsplash e o nicho não for pessoal,
  // substitui dinamicamente pelo monograma oficial vetorial da empresa (evita fotos de pessoas desconhecidas)
  let effectiveAvatarUrl = bio.avatar_url;
  const isGenericPersonPhoto =
    bio.avatar_url &&
    (bio.avatar_url.includes("unsplash.com") || bio.avatar_url.includes("template-assets"));
  if (isGenericPersonPhoto && nicheKey !== "pessoal") {
    effectiveAvatarUrl = generateSvgAvatar(bio.display_name, nicheKey);
  }

  const isSiteMaquina = effectiveTemplateId === "site-maquina";
  const isStore = effectiveTemplateId === "store-showcase" || effectiveTemplateId === "storefront";
  const isFullPageChat = effectiveTemplateId === "ai-chat-agent";
  const shouldShowMobileSticky = !isSiteMaquina && !isStore && !isFullPageChat;

  return (
    <div className={`min-h-screen flex flex-col w-full overflow-x-hidden ${shouldShowMobileSticky ? "pb-16 sm:pb-0" : ""}`}>
      {isDemo && <DemoConversionBanner companyName={bio.display_name} />}
      {!isStore && (
        <div className="w-full max-w-2xl mx-auto px-3 pt-2">
          <PwaInstallBanner companyName={bio.display_name} avatarUrl={effectiveAvatarUrl || bio.avatar_url} />
        </div>
      )}
      <div onClickCapture={handleContainerClickCapture} className="flex-1 w-full overflow-x-hidden">
        <BrandingProvider show={!hasProPlan && !isDemo}>
          {shouldUseTemplate ? (
            <TemplateRenderer
              bio={{ ...bio, template_id: effectiveTemplateId, avatar_url: effectiveAvatarUrl, theme }}
              links={links}
              onTrack={track}
              onShare={share}
              products={products}
              bookingUrl={isServiceBookingNiche && bookingActive ? `/agendar/${bio.slug}` : undefined}
              motionLevel={bio.motion_enabled === false ? "off" : "pro"}
              supplemental={
                isSiteMaquina ? null : (
                  <>
                    <ModularSections bio={{ ...bio, template_id: effectiveTemplateId }} onTrack={track} />
                    {supplementalBlocks.map((block: PageBlock) => (
                      <BlockRenderer key={block.id} block={block} />
                    ))}
                  </>
                )
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
                  <ModularSections bio={bio} onTrack={track} />
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
            bookingUrl={bookingActive ? `/agendar/${bio.slug}` : undefined}
          />
        )}

        {/* Atendente Virtual Interativo (Chat com IA / Typebot) */}
        {isAiChatActive && effectiveTemplateId !== "ai-chat-agent" && (
          <>
            {!isAiChatOpen && (
              <button
                type="button"
                onClick={() => setIsAiChatOpen(true)}
                className="fixed left-4 bottom-20 sm:bottom-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-card/95 hover:bg-card border border-sky-500/50 text-foreground text-xs font-bold shadow-xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Falar com Atendente Virtual"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
                <span>💬 Atendente Virtual</span>
              </button>
            )}

            {isAiChatOpen && (
              <AiAssistantChat
                bio={bio}
                products={products}
                isFullPage={false}
                onClose={() => setIsAiChatOpen(false)}
                onTrack={track}
              />
            )}
          </>
        )}
      </div>

      {/* Barra de Conversão Fixa no Mobile (Apenas para BioLinks, sem poluir Lojas ou Site Completo) */}
      {shouldShowMobileSticky && (
        <MobileStickyBar
          bio={bio}
          bookingUrl={isServiceBookingNiche && bookingActive ? `/agendar/${bio.slug}` : undefined}
          onTrack={track}
          onShare={share}
        />
      )}

      {/* Comanda Digital e Chamar Garçom (Ativo apenas se acessado via QR Code / NFC com mesa ou garçom) */}
      <ComandaFloatingBar bioPageId={bio.id} products={products} />
    </div>
  );
}


