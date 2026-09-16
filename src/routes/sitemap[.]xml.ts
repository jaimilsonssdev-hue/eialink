import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://eialink.com.br";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  image?: {
    loc: string;
    title: string;
  };
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];

        const entries: SitemapEntry[] = [
          { loc: `${BASE_URL}/`, lastmod: today, changefreq: "weekly", priority: "1.0" },
          { loc: `${BASE_URL}/privacy`, lastmod: today, changefreq: "yearly", priority: "0.3" },
          { loc: `${BASE_URL}/terms`, lastmod: today, changefreq: "yearly", priority: "0.3" },
          { loc: `${BASE_URL}/refund-policy`, lastmod: today, changefreq: "yearly", priority: "0.3" },
        ];

        const { data: pages } = await supabase
          .from("bio_pages")
          .select("slug, updated_at, display_name, cover_url, avatar_url, social_links")
          .eq("published", true);

        for (const page of pages ?? []) {
          const socialData = (page.social_links && typeof page.social_links === "object" ? page.social_links : {}) as Record<string, any>;
          // Se o usuário explicitamente desativou a indexação no Google pelo painel SEO, não inclui no sitemap
          if (socialData.seo?.indexable === false) {
            continue;
          }

          const lastmod = page.updated_at
            ? new Date(page.updated_at).toISOString().split("T")[0]
            : today;

          const image = page.cover_url || page.avatar_url || null;

          entries.push({
            loc: `${BASE_URL}/p/${page.slug}`,
            lastmod,
            changefreq: "weekly",
            priority: "0.8",
            ...(image && image.startsWith("https://")
              ? {
                  image: {
                    loc: image,
                    title: page.display_name,
                  },
                }
              : {}),
          });
        }

        const urls = entries.map((e) => {
          const lines = [
            `  <url>`,
            `    <loc>${e.loc}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
          ];

          if (e.image) {
            lines.push(
              `    <image:image>`,
              `      <image:loc>${e.image.loc}</image:loc>`,
              `      <image:title>${escapeXml(e.image.title)}</image:title>`,
              `    </image:image>`
            );
          }

          lines.push(`  </url>`);
          return lines.filter(Boolean).join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
