import React, { useMemo } from "react";
import type { SiteConfig } from "./blocks/types";
import { RenderBlock } from "./blocks/registry";
import { resolveTheme, themeToCSS } from "./lib/theme-presets";
import { useGoogleFonts } from "./lib/useGoogleFonts";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";
import "./studiopro.css";

export function StudioProPublicViewer({
  config,
  isDemo,
  companyName,
}: {
  config: SiteConfig;
  isDemo?: boolean;
  companyName?: string;
}) {
  const theme = useMemo(() => resolveTheme(config.theme), [config.theme]);
  const cssVars = useMemo(() => themeToCSS(theme), [theme]);

  const fontsToLoad = useMemo(() => {
    return [theme.fontSans, theme.fontDisplay, theme.fontMono].filter(Boolean) as string[];
  }, [theme.fontSans, theme.fontDisplay, theme.fontMono]);

  useGoogleFonts(fontsToLoad);

  const blocks = config.pages?.[0]?.blocks || config.blocks || [];

  return (
    <div
      className="studiopro-viewer scroll-revealed min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...cssVars,
        backgroundColor: theme.bg0,
        color: theme.text0,
        fontFamily: theme.fontSans,
      }}
    >
      {isDemo && companyName && <DemoConversionBanner companyName={companyName} />}
      <main className="w-full">
        {blocks.map((block) => (
          <RenderBlock key={block.id} block={block} />
        ))}
      </main>
    </div>
  );
}

export default StudioProPublicViewer;

