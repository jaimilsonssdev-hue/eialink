import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveBioMediaUrl, bioMediaPath } from "@/lib/bio-media";

export const Route = createFileRoute("/api/manifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug")?.trim();
        const id = url.searchParams.get("id")?.trim();

        // Se não houver identificador, retorna o manifest padrão da plataforma
        if (!slug && !id) {
          return getDefaultManifestResponse();
        }

        try {
          let query = supabase
            .from("bio_pages")
            .select("id, slug, display_name, description, avatar_url, cover_url, theme, template_id, social_links");

          if (slug) {
            query = query.eq("slug", slug);
          } else if (id) {
            query = query.eq("id", id);
          }

          const { data: bio, error } = await query.maybeSingle();

          if (error || !bio) {
            return getDefaultManifestResponse();
          }

          const socialData = (bio.social_links && typeof bio.social_links === "object" ? bio.social_links : {}) as Record<string, any>;
          const themeConfig = socialData.theme_colors || socialData.custom_theme || {};

          const companyName = (bio.display_name || "Vitrines Digitais").trim();
          // Short name para caber perfeitamente embaixo do ícone no Android e iOS (máximo 18 caracteres)
          const shortName = companyName.length > 18 ? companyName.slice(0, 18).trim() : companyName;
          const description = (
            bio.description ||
            `Aplicativo oficial de ${companyName}. Confira nossos produtos, serviços e faça pedidos direto pelo celular.`
          ).trim();

          const primaryColor = themeConfig.primary || "#10081d";
          const backgroundColor = themeConfig.background || "#090611";

          // Resolve a URL da logo da empresa (prioridade total para a logo/avatar do cliente)
          let resolvedIcon: string | null = null;
          const rawIcon = bio.avatar_url || bio.cover_url || null;

          if (rawIcon) {
            const path = bioMediaPath(rawIcon);
            if (path) {
              try {
                const { data: publicData } = supabase.storage.from("bio-media").getPublicUrl(path);
                if (publicData?.publicUrl) {
                  resolvedIcon = publicData.publicUrl;
                } else {
                  const { data: signed } = await supabase.storage
                    .from("bio-media")
                    .createSignedUrl(path, 60 * 60 * 24 * 365); // 365 dias
                  resolvedIcon = signed?.signedUrl || null;
                }
              } catch {
                resolvedIcon = await resolveBioMediaUrl(rawIcon);
              }
            } else {
              resolvedIcon = rawIcon;
            }
          }

          const icons: Array<{ src: string; sizes: string; type?: string; purpose?: string }> = [];

          if (resolvedIcon) {
            const ext = resolvedIcon.split("?")[0].split(".").pop()?.toLowerCase();
            const mimeType =
              ext === "png"
                ? "image/png"
                : ext === "webp"
                ? "image/webp"
                : ext === "svg"
                ? "image/svg+xml"
                : "image/jpeg";

            // Ícones exclusivos da marca do cliente para instalação do PWA
            icons.push(
              {
                src: resolvedIcon,
                sizes: "192x192",
                type: mimeType,
                purpose: "any",
              },
              {
                src: resolvedIcon,
                sizes: "512x512",
                type: mimeType,
                purpose: "any",
              },
              {
                src: resolvedIcon,
                sizes: "192x192",
                type: mimeType,
                purpose: "maskable",
              },
              {
                src: resolvedIcon,
                sizes: "512x512",
                type: mimeType,
                purpose: "maskable",
              }
            );
          } else {
            // Apenas se o cliente não cadastrou NENHUMA imagem, usa o ícone neutro da plataforma como último recurso
            icons.push(
              {
                src: "/icons/eia-link-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
              },
              {
                src: "/icons/eia-link-icon-maskable.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
              }
            );
          }

          const manifest = {
            name: `${companyName} — App Oficial`,
            short_name: shortName,
            description,
            lang: "pt-BR",
            start_url: `/p/${encodeURIComponent(bio.slug)}?source=pwa`,
            scope: "/",
            display: "standalone",
            orientation: "portrait",
            background_color: backgroundColor,
            theme_color: primaryColor,
            categories: ["shopping", "food", "business", "lifestyle"],
            icons,
          };

          return new Response(JSON.stringify(manifest, null, 2), {
            headers: {
              "Content-Type": "application/manifest+json; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          });
        } catch (err) {
          console.error("Erro ao gerar manifest dinâmico do PWA:", err);
          return getDefaultManifestResponse();
        }
      },
    },
  },
});

function getDefaultManifestResponse() {
  const defaultManifest = {
    name: "EIA Link — Vitrines Digitais",
    short_name: "EIA Link",
    description: "Crie, personalize e acompanhe vitrines digitais para o seu negócio.",
    lang: "pt-BR",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#090611",
    theme_color: "#10081d",
    icons: [
      {
        src: "/icons/eia-link-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/eia-link-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };

  return new Response(JSON.stringify(defaultManifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

