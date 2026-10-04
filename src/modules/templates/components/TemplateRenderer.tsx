import type { PublicBio, PublicLink, TrackEvent } from "@/components/public-profile/types";
import type { CatalogItem } from "@/modules/products/types";
import { TemplateService } from "../services/TemplateService";
import type { PageData } from "../types";
import type { CSSProperties, ReactNode } from "react";
import { layoutResolver } from "../layouts/LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PublicSocialLinks } from "@/components/public-profile/PublicSocialLinks";
import { safeExternalUrl } from "@/lib/safe-url";
import { findFontPair } from "@/lib/font-pairs";
import { useParallaxScene } from "@/hooks/useParallax";
import { CinematicViewer } from "@/modules/cinematic/CinematicViewer";
import type { CinematicPageData } from "@/modules/cinematic/types";

const NICHE_FALLBACK_COVERS: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  clinic: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
  academy: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  law: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  store: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  spotlight: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
  creator: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  business: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  impact: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
};

function getFallbackCover(templateId: string) {
  if (templateId.includes("impact")) return NICHE_FALLBACK_COVERS.impact;
  if (templateId.includes("restaurant")) return NICHE_FALLBACK_COVERS.restaurant;
  if (templateId.includes("clinic")) return NICHE_FALLBACK_COVERS.clinic;
  if (templateId.includes("academy") || templateId.includes("gym")) return NICHE_FALLBACK_COVERS.academy;
  if (templateId.includes("law")) return NICHE_FALLBACK_COVERS.law;
  if (templateId.includes("store")) return NICHE_FALLBACK_COVERS.store;
  if (templateId.includes("beauty")) return NICHE_FALLBACK_COVERS.beauty;
  if (templateId.includes("spotlight") || templateId.includes("neon")) return NICHE_FALLBACK_COVERS.spotlight;
  if (templateId.includes("creator")) return NICHE_FALLBACK_COVERS.creator;
  if (templateId.includes("business")) return NICHE_FALLBACK_COVERS.business;
  return NICHE_FALLBACK_COVERS.business;
}

export function TemplateRenderer({
  bio,
  links,
  onTrack,
  onShare,
  products,
  bookingUrl,
  supplemental,
  motionLevel = "standard",
}: {
  bio: PublicBio;
  links: PublicLink[];
  onTrack: TrackEvent;
  onShare: () => void;
  products?: CatalogItem[];
  bookingUrl?: string;
  supplemental?: ReactNode;
  /** Public pages keep essential feedback for everyone; Pro unlocks ambient presentation motion. */
  motionLevel?: "off" | "standard" | "pro";
}) {
  const socialObj = (bio.social_links as Record<string, any>) || {};
  const cinematicData = (socialObj.cinematic_data || socialObj.cinematicData) as CinematicPageData | undefined;

  if (cinematicData) {
    const customTheme = socialObj.custom_theme || socialObj.theme || {};
    const appliedArchetype = customTheme.archetype || cinematicData.archetype || (cinematicData.theme as any)?.archetype || "cinematic";
    const appliedHeadingStyle = customTheme.headingStyle || (cinematicData.theme as any)?.headingStyle || "default";

    const appliedMarqueeSpeed =
      cinematicData.marqueeSpeed ||
      (cinematicData.theme as any)?.marqueeSpeed ||
      customTheme.marqueeSpeed ||
      50;

    const hydratedCinematicData: CinematicPageData = {
      ...cinematicData,
      archetype: appliedArchetype as any,
      marqueeSpeed: appliedMarqueeSpeed,
      theme: {
        ...cinematicData.theme,
        archetype: appliedArchetype as any,
        headingStyle: appliedHeadingStyle as any,
        bg: customTheme.bg || cinematicData.theme?.bg || (customTheme.mode === "light" ? "#f8fafc" : "#0a0a0c"),
        accent: customTheme.accent || cinematicData.theme?.accent || "#f59e0b",
        mode: customTheme.mode || (cinematicData.theme as any)?.mode || (cinematicData.theme?.bg?.includes("#fff") || cinematicData.theme?.bg?.includes("#f8") ? "light" : "dark"),
        fontFamily: customTheme.font || customTheme.font_pair || (cinematicData.theme as any)?.fontFamily || "sans",
        boxEffect: customTheme.boxEffect || (cinematicData.theme as any)?.boxEffect || "glass",
        borderRadius: customTheme.borderRadius || (cinematicData.theme as any)?.borderRadius || "rounded",
        marqueeSpeed: appliedMarqueeSpeed,
      },
    };

    return (
      <div className="w-full" style={{ backgroundColor: hydratedCinematicData.theme.bg }}>
        <CinematicViewer data={hydratedCinematicData} isEmbedded={true} />
        {supplemental}
      </div>
    );
  }

  const safeLinks = links
    .map((link) => ({ ...link, url: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { url: string } => Boolean(link.url));

  const effectiveProducts: CatalogItem[] = (products && products.length > 0)
    ? products
    : (cinematicData?.highlights || []).map((h, i) => {
        const rawPrice = typeof h.price === "string" ? parseFloat(h.price.replace(/[^\d,.-]/g, "").replace(",", ".")) : (h.price || 0);
        return {
          id: h.id || `item-${i}`,
          title: h.title,
          description: h.subtitle || h.description || null,
          price: isNaN(rawPrice) ? 0 : rawPrice,
          image_url: h.imageUrl || null,
          active: true,
          category: h.badge || "Destaques",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          page_id: bio.id,
        };
      });

  const safeProducts = effectiveProducts.map((product) => ({
    ...product,
    button_url: safeExternalUrl(product.button_url) ?? null,
  }));
  const data: PageData = {
    profile: { name: bio.display_name, description: bio.description, avatarUrl: bio.avatar_url },
    appearance: { coverUrl: bio.cover_url },
    links: safeLinks.map((link) => ({ id: link.id, title: link.title, url: link.url })),
    socials: {
      ...(bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links)
        ? bio.social_links
        : {}),
      instagram:
        (bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links) && typeof bio.social_links.instagram === "string"
          ? bio.social_links.instagram
          : bio.instagram) ?? undefined,
    },
    whatsapp: bio.whatsapp,
    pix: bio.pix_key,
  };
  const model = TemplateService.render(data, bio.template_id ?? undefined);
  const layout = layoutResolver.resolve(model);
  const fallbackCover = getFallbackCover(model.template.id);
  const renderedBio = bio.cover_url || !fallbackCover ? bio : { ...bio, cover_url: fallbackCover };

  const socialData = (bio.social_links && typeof bio.social_links === "object" && !Array.isArray(bio.social_links)
    ? bio.social_links
    : {}) as Record<string, any>;
  const tokensDesign = socialData.tokens_design;
  const customTheme = (socialData.custom_theme || socialData.theme) as {
    primary?: string;
    accent?: string;
    background?: string;
    bg?: string;
    text?: string;
    title?: string;
    mode?: string;
    card_bg?: string;
    border_color?: string;
    border_radius?: string;
    borderRadius?: string;
    boxEffect?: string;
    font?: string;
    font_pair?: string;
    archetype?: string;
    headingStyle?: string;
    gradient_1?: string;
    gradient_2?: string;
    layout_esqueleto?: string;
    navigation_bg?: string;
    info_badge_bg?: string;
    parallax?: boolean;
  } | undefined;

  const rawFontChoice = customTheme?.font || customTheme?.font_pair;
  const resolvedFontFamily =
    rawFontChoice === "serif"
      ? "'Playfair Display', Georgia, serif"
      : rawFontChoice === "display"
      ? "'Plus Jakarta Sans', system-ui, sans-serif"
      : rawFontChoice === "cormorant"
      ? "'Cormorant Garamond', serif"
      : rawFontChoice === "mono"
      ? "'Courier New', monospace"
      : rawFontChoice === "sans"
      ? "'Inter', sans-serif"
      : findFontPair(customTheme?.font_pair)?.body || model.theme.typography.fontFamily;

  const fontPair = findFontPair(customTheme?.font_pair);
  const parallaxEnabled =
    (customTheme?.parallax === true ||
      socialData?.custom_theme?.parallax === true ||
      (bio as any)?.custom_theme?.parallax === true ||
      (bio as any)?.parallax === true) &&
    bio.motion_enabled !== false;
  const parallaxRef = useParallaxScene<HTMLElement>(parallaxEnabled);

  const customPrimary = customTheme?.accent || customTheme?.primary || tokensDesign?.estilo_botoes?.cor_destaque;
  const customText = customTheme?.text || tokensDesign?.estilo_botoes?.cor_texto;
  const isLightMode = customTheme?.mode === "light" || bio.theme === "mono" || (customTheme?.bg && (customTheme.bg === "#ffffff" || customTheme.bg === "#f8fafc"));
  const customTitle = customTheme?.title || tokensDesign?.estilo_botoes?.cor_titulo || (isLightMode ? "#0f172a" : "#ffffff");
  const customBg = customTheme?.bg || customTheme?.background || tokensDesign?.fundo_valores?.cor_gradiente_1;
  const customCard = customTheme?.card_bg || tokensDesign?.estilo_botoes?.cor_fundo_card;
  const customBorder = customTheme?.border_color || tokensDesign?.estilo_botoes?.cor_borda;
  const customRadius = customTheme?.borderRadius === "sharp" ? "0px" : customTheme?.borderRadius === "pill" ? "28px" : customTheme?.border_radius || (customTheme?.borderRadius === "rounded" ? "16px" : undefined) || tokensDesign?.estilo_botoes?.raio_borda;

  const rawArchetype = (customTheme as any)?.archetype || socialData?.archetype || cinematicData?.archetype || "cinematic";
  const resolvedArchetype =
    rawArchetype === "neobrutalism" || rawArchetype === "neo-pop-d2c" || rawArchetype === "dark-brutalist"
      ? "neobrutalism"
      : rawArchetype === "editorial" || rawArchetype === "luxury-editorial"
      ? "editorial"
      : rawArchetype === "bento" || rawArchetype === "clean-biotech" || rawArchetype === "cyber-tech"
      ? "bento"
      : "cinematic";

  return (
    <main
      ref={parallaxRef}
      data-parallax={parallaxEnabled ? "on" : undefined}
      data-mode={isLightMode ? "light" : "dark"}
      data-radius={customTheme?.borderRadius || "rounded"}
      data-box-effect={customTheme?.boxEffect || "glass"}
      className={`bio-theme ${bio.theme || "aurora"} public-profile-shell archetype-${resolvedArchetype}`}
      data-template={bio.template_id ?? "default"}
      data-layout={model.template.layout}
      data-template-layout={model.template.layout}
      data-custom-primary={Boolean(customPrimary) ? "true" : undefined}
      data-custom-text={Boolean(customText) ? "true" : undefined}
      data-custom-title={Boolean(customTitle) ? "true" : undefined}
      data-custom-bg={Boolean(customBg) ? "true" : undefined}
      data-custom-card={Boolean(customCard) ? "true" : undefined}
      data-custom-border={Boolean(customBorder) ? "true" : undefined}
      data-motion={motionLevel}
      data-motion-entrance={bio.motion_enabled === false ? "none" : bio.motion_entrance ?? "gentle"}
      data-motion-cta={bio.motion_enabled === false ? "none" : bio.motion_cta ?? "none"}
      data-motion-ambient={bio.motion_enabled === false ? "none" : bio.motion_ambient ?? "soft"}
      style={
        {
          fontFamily: resolvedFontFamily || fontPair?.body || model.theme.typography.fontFamily,
          "--template-font-family": resolvedFontFamily || fontPair?.body || "inherit",
          ...(fontPair
            ? { "--font-sans": resolvedFontFamily || fontPair.body, "--font-display": resolvedFontFamily || fontPair.display }
            : { "--font-sans": resolvedFontFamily, "--font-display": resolvedFontFamily }),
          // Tailwind v4 Design Tokens Bridge
          "--primary": customPrimary || model.theme.colors.primary,
          "--primary-foreground": "#ffffff",
          "--primary-glow": customPrimary || model.theme.colors.primary,
          "--foreground": customText || (isLightMode ? "#0f172a" : model.theme.colors.text),
          "--card": customCard || (isLightMode ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
          "--card-foreground": customText || (isLightMode ? "#0f172a" : model.theme.colors.text),
          "--border": customBorder || (isLightMode ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),
          "--muted-foreground": isLightMode
            ? "#64748b"
            : customText
              ? `color-mix(in srgb, ${customText} 65%, transparent)`
              : model.theme.colors.muted,
          "--radius": customRadius || "16px",
          color: customText || (isLightMode ? "#0f172a" : model.theme.colors.text),

          // Tokens Nativos
          "--cor-destaque": customPrimary || model.theme.colors.primary,
          "--cor-principal": customPrimary || model.theme.colors.primary,
          "--cor-texto": customText || (isLightMode ? "#0f172a" : model.theme.colors.text),
          "--cor-titulo": customTitle,
          "--title-color": customTitle,
          "--cor-fundo-card": customCard || (isLightMode ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
          "--cor-borda": customBorder || (isLightMode ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),
          "--raio-borda": customRadius || "16px",

          "--bio-fg": customText || (isLightMode ? "#0f172a" : model.theme.colors.text),
          "--bio-title": customTitle,
          "--bio-muted": isLightMode
            ? "#64748b"
            : customText
              ? `color-mix(in srgb, ${customText} 65%, transparent)`
              : model.theme.colors.muted,
          "--bio-card": customCard || (isLightMode ? "#ffffff" : "rgba(255, 255, 255, 0.04)"),
          "--bio-border": customBorder || (isLightMode ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.1)"),

          "--template-bg": customBg || (isLightMode ? "#f8fafc" : "#090a10"),
          "--template-surface": customCard || model.theme.colors.surface,
          "--template-text": customText || (isLightMode ? "#0f172a" : model.theme.colors.text),
          "--template-title": customTitle,
          "--template-muted": isLightMode ? "#64748b" : model.theme.colors.muted,
          "--template-primary": customPrimary || model.theme.colors.primary,
          ...(customBg ? { background: customBg } : {}),
          ...(customText ? { "--bio-fg": customText } : {}),
        } as CSSProperties
      }
    >
      <style>{`
        /* 0. TIPOGRAFIA UNIVERSAL REATIVA */
        .public-profile-shell,
        .public-profile-shell *:not(svg):not(path) {
          font-family: var(--template-font-family) !important;
        }

        /* 1. MODO ESCURO (DARK MODE) UNIVERSAL */
        .public-profile-shell[data-mode="dark"] {
          background-color: var(--template-bg, #090a10) !important;
          color: #e4e4e7 !important;
        }
        .public-profile-shell[data-mode="dark"] section,
        .public-profile-shell[data-mode="dark"] .bg-white,
        .public-profile-shell[data-mode="dark"] .bg-gray-50,
        .public-profile-shell[data-mode="dark"] .bg-gray-100,
        .public-profile-shell[data-mode="dark"] [class*="bg-gray-50"],
        .public-profile-shell[data-mode="dark"] [class*="bg-slate-50"] {
          background-color: rgba(18, 22, 34, 0.9) !important;
          color: #f4f4f5 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        .public-profile-shell[data-mode="dark"] h1,
        .public-profile-shell[data-mode="dark"] h2,
        .public-profile-shell[data-mode="dark"] h3,
        .public-profile-shell[data-mode="dark"] h4,
        .public-profile-shell[data-mode="dark"] .font-heading,
        .public-profile-shell[data-mode="dark"] .text-gray-900,
        .public-profile-shell[data-mode="dark"] .text-gray-800,
        .public-profile-shell[data-mode="dark"] .text-slate-900 {
          color: #ffffff !important;
        }
        .public-profile-shell[data-mode="dark"] p,
        .public-profile-shell[data-mode="dark"] .text-gray-600,
        .public-profile-shell[data-mode="dark"] .text-gray-700,
        .public-profile-shell[data-mode="dark"] .text-gray-500,
        .public-profile-shell[data-mode="dark"] .text-slate-600 {
          color: #a1a1aa !important;
        }

        /* 2. MODO CLARO (LIGHT MODE) UNIVERSAL */
        .public-profile-shell[data-mode="light"] {
          background-color: var(--template-bg, #f8fafc) !important;
          color: #18181b !important;
        }
        .public-profile-shell[data-mode="light"] section {
          background-color: transparent !important;
        }
        .public-profile-shell[data-mode="light"] h1,
        .public-profile-shell[data-mode="light"] h2,
        .public-profile-shell[data-mode="light"] h3,
        .public-profile-shell[data-mode="light"] h4,
        .public-profile-shell[data-mode="light"] .font-heading {
          color: #09090b !important;
        }

        /* 3. NEOBRUTALISMO POP */
        .archetype-neobrutalism [class*="rounded-2xl"],
        .archetype-neobrutalism [class*="rounded-xl"],
        .archetype-neobrutalism [class*="rounded-3xl"],
        .archetype-neobrutalism .bg-white,
        .archetype-neobrutalism .bg-gray-50,
        .archetype-neobrutalism .bg-card,
        .archetype-neobrutalism article,
        .archetype-neobrutalism div[class*="shadow-"],
        .archetype-neobrutalism div[class*="border"] {
          border-width: 3px !important;
          border-style: solid !important;
          border-color: #000000 !important;
          box-shadow: 5px 5px 0px #000000 !important;
          border-radius: 12px !important;
        }
        .archetype-neobrutalism a,
        .archetype-neobrutalism button,
        .archetype-neobrutalism .public-profile-action-whatsapp {
          border: 3px solid #000000 !important;
          box-shadow: 4px 4px 0px #000000 !important;
          text-transform: uppercase !important;
          font-weight: 900 !important;
          border-radius: 8px !important;
          transition: transform 0.1s ease, box-shadow 0.1s ease !important;
        }
        .archetype-neobrutalism a:active,
        .archetype-neobrutalism button:active {
          transform: translate(2px, 2px) !important;
          box-shadow: 1px 1px 0px #000000 !important;
        }
        .archetype-neobrutalism h1,
        .archetype-neobrutalism h2,
        .archetype-neobrutalism h3 {
          text-transform: uppercase !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
        }

        /* 4. EDITORIAL SUÍÇO / QUIET LUXURY */
        .archetype-editorial [class*="rounded-"],
        .archetype-editorial .bg-card,
        .archetype-editorial article,
        .archetype-editorial a,
        .archetype-editorial button,
        .archetype-editorial img {
          border-radius: 0px !important;
        }
        .archetype-editorial h1,
        .archetype-editorial h2,
        .archetype-editorial h3 {
          font-style: italic !important;
          font-weight: 400 !important;
          letter-spacing: 0.02em !important;
        }
        .archetype-editorial a,
        .archetype-editorial button {
          letter-spacing: 0.15em !important;
          text-transform: uppercase !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* 5. BENTO HIGH-TECH */
        .archetype-bento [class*="rounded-2xl"],
        .archetype-bento [class*="rounded-xl"],
        .archetype-bento [class*="rounded-3xl"],
        .archetype-bento .bg-card,
        .archetype-bento article {
          border-radius: 28px !important;
        }
        .archetype-bento a,
        .archetype-bento button {
          border-radius: 9999px !important;
          font-weight: 700 !important;
        }

        /* 6. CINEMATOGRÁFICO GLASS */
        .archetype-cinematic [class*="rounded-2xl"],
        .archetype-cinematic [class*="rounded-3xl"],
        .archetype-cinematic .bg-card {
          border-radius: 1.25rem !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5) !important;
        }

        /* 7. ARREDONDAMENTO ESPECÍFICO (data-radius) */
        .public-profile-shell[data-radius="sharp"] [class*="rounded-"],
        .public-profile-shell[data-radius="sharp"] button,
        .public-profile-shell[data-radius="sharp"] img,
        .public-profile-shell[data-radius="sharp"] a,
        .public-profile-shell[data-radius="sharp"] .bg-card,
        .public-profile-shell[data-radius="sharp"] article {
          border-radius: 0px !important;
        }
        .public-profile-shell[data-radius="pill"] [class*="rounded-2xl"],
        .public-profile-shell[data-radius="pill"] [class*="rounded-3xl"],
        .public-profile-shell[data-radius="pill"] [class*="rounded-xl"],
        .public-profile-shell[data-radius="pill"] .bg-card,
        .public-profile-shell[data-radius="pill"] article {
          border-radius: 28px !important;
        }
        .public-profile-shell[data-radius="pill"] button,
        .public-profile-shell[data-radius="pill"] a[class*="rounded-"],
        .public-profile-shell[data-radius="pill"] a[class*="bg-"] {
          border-radius: 9999px !important;
        }
        .public-profile-shell[data-radius="rounded"] [class*="rounded-2xl"],
        .public-profile-shell[data-radius="rounded"] [class*="rounded-3xl"],
        .public-profile-shell[data-radius="rounded"] .bg-card,
        .public-profile-shell[data-radius="rounded"] article {
          border-radius: 16px !important;
        }

        /* 8. EFEITOS DOS CARDS ESPECÍFICOS (data-box-effect) */
        .public-profile-shell[data-box-effect="solid"] [class*="rounded-2xl"],
        .public-profile-shell[data-box-effect="solid"] [class*="rounded-3xl"],
        .public-profile-shell[data-box-effect="solid"] [class*="rounded-xl"],
        .public-profile-shell[data-box-effect="solid"] .bg-white,
        .public-profile-shell[data-box-effect="solid"] .bg-gray-50,
        .public-profile-shell[data-box-effect="solid"] .bg-card,
        .public-profile-shell[data-box-effect="solid"] article {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important;
        }
        .public-profile-shell[data-box-effect="glow"] [class*="rounded-2xl"],
        .public-profile-shell[data-box-effect="glow"] [class*="rounded-3xl"],
        .public-profile-shell[data-box-effect="glow"] [class*="rounded-xl"],
        .public-profile-shell[data-box-effect="glow"] .bg-white,
        .public-profile-shell[data-box-effect="glow"] .bg-gray-50,
        .public-profile-shell[data-box-effect="glow"] .bg-card,
        .public-profile-shell[data-box-effect="glow"] article {
          box-shadow: 0 0 25px var(--cor-destaque, var(--primary, #f59e0b)) !important;
          border-color: var(--cor-destaque, var(--primary, #f59e0b)) !important;
        }
      `}</style>
      {layout?.render(model, { bio: renderedBio, links: safeLinks, onTrack, onShare, products: safeProducts, bookingUrl, supplemental })}
      {model.template.layout !== "site-maquina" && model.template.layout !== "cinematic" && <PublicSocialLinks bio={renderedBio} onTrack={onTrack} />}
      {!model.template.components.includes("footer") && <Footer />}
    </main>
  );
}
