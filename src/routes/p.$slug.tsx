import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, QrCode, Instagram, ExternalLink, Sparkles, Share2, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/p/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    const { data: bio } = await supabase.from("bio_pages").select("*").eq("slug", params.slug).eq("published", true).maybeSingle();
    if (!bio) throw notFound();
    const { data: links } = await supabase.from("bio_links").select("*").eq("bio_page_id", bio.id).eq("active", true).order("position");
    return { bio, links: links ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.bio.display_name} — EIA Digital` },
      { name: "description", content: loaderData.bio.description ?? `Página profissional de ${loaderData.bio.display_name}.` },
      { property: "og:title", content: loaderData.bio.display_name },
      { property: "og:description", content: loaderData.bio.description ?? "" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ] : [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }],
  }),
  component: PublicBio,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div><h1 className="text-4xl font-bold gradient-text">404</h1><p className="mt-2 text-muted-foreground">Página não encontrada.</p></div>
    </div>
  ),
});

const VALID_THEMES = new Set(["aurora", "sunset", "ocean", "midnight", "mono", "forest"]);

function PublicBio() {
  const { bio, links } = Route.useLoaderData();
  const [pixCopied, setPixCopied] = useState(false);

  const theme = VALID_THEMES.has(bio.theme) ? bio.theme : "aurora";

  useEffect(() => {
    const url = new URL(window.location.href);
    supabase.from("analytics_events").insert({
      bio_page_id: bio.id, event_type: "view",
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      referrer: document.referrer || null,
      device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });
  }, [bio.id]);

  function track(event_type: string, target_id?: string) {
    supabase.from("analytics_events").insert({ bio_page_id: bio.id, event_type, target_id: target_id ?? null });
  }

  function copyPix() {
    if (!bio.pix_key) return;
    navigator.clipboard.writeText(bio.pix_key);
    setPixCopied(true);
    track("pix_click");
    setTimeout(() => setPixCopied(false), 2200);
  }

  async function share() {
    const shareData = { title: bio.display_name, text: bio.description ?? "", url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch {} }
    else { await navigator.clipboard.writeText(window.location.href); alert("Link copiado!"); }
  }

  return (
    <div className={`bio-theme ${theme} min-h-screen relative overflow-hidden`}>
      {/* animated aurora blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40 animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />
      <div className="pointer-events-none absolute bottom-0 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30" style={{ background: "rgba(255,255,255,0.10)" }} />

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* share button */}
          <div className="flex justify-end mb-4">
            <button onClick={share} aria-label="Compartilhar"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur"
              style={{ background: "var(--bio-card)", border: "1px solid var(--bio-border)", color: "var(--bio-fg)" }}>
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>

          <div className="text-center">
            <div className="inline-block relative">
              <span className="absolute -inset-1.5 rounded-full blur-md opacity-60"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))" }} aria-hidden />
              {bio.avatar_url ? (
                <img src={bio.avatar_url} alt={bio.display_name} className="relative h-28 w-28 rounded-full object-cover ring-4"
                  style={{ ["--tw-ring-color" as string]: "rgba(255,255,255,0.4)" }} />
              ) : (
                <div className="relative h-28 w-28 rounded-full grid place-items-center ring-4 text-3xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.10))",
                    color: "var(--bio-fg)",
                    ["--tw-ring-color" as string]: "rgba(255,255,255,0.35)",
                  }}>
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="mt-5 text-3xl font-bold font-display" style={{ color: "var(--bio-fg)" }}>{bio.display_name}</h1>
            {bio.description && (
              <p className="mt-2 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--bio-muted)" }}>
                {bio.description}
              </p>
            )}
            {bio.instagram && (
              <a href={`https://instagram.com/${bio.instagram.replace("@", "")}`} target="_blank" rel="noopener"
                onClick={() => track("instagram_click")}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--bio-muted)" }}>
                <Instagram className="h-3.5 w-3.5" /> @{bio.instagram.replace("@", "")}
              </a>
            )}
          </div>

          <div className="mt-10 space-y-3">
            {bio.whatsapp && (
              <BioAction onClick={() => track("whatsapp_click")}
                as="a" href={`https://wa.me/${bio.whatsapp}`} target="_blank" rel="noopener"
                iconBg="#25D366" icon={<MessageCircle className="h-5 w-5 text-white" />}
                title="Falar no WhatsApp" subtitle="Resposta rápida" accent />
            )}
            {bio.pix_key && (
              <BioAction onClick={copyPix} as="button"
                iconBg="rgba(255,255,255,0.15)"
                icon={pixCopied ? <Check className="h-5 w-5" style={{ color: "var(--bio-fg)" }} /> : <QrCode className="h-5 w-5" style={{ color: "var(--bio-fg)" }} />}
                title={pixCopied ? "Chave Pix copiada!" : "Pagar com Pix"} subtitle={pixCopied ? "Cole no seu app do banco" : "Copiar chave Pix"} />
            )}
            {links.map((l: { id: string; url: string; title: string }) => (
              <BioAction key={l.id} onClick={() => track("link_click", l.id)}
                as="a" href={l.url} target="_blank" rel="noopener"
                iconBg="rgba(255,255,255,0.15)"
                icon={<ExternalLink className="h-4 w-4" style={{ color: "var(--bio-fg)" }} />}
                title={l.title} />
            ))}
          </div>

          <a href="/" className="mt-14 flex items-center justify-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: "var(--bio-fg)" }}>
            <Sparkles className="h-3 w-3" /> Feito com EIA Digital
          </a>
        </div>
      </div>
    </div>
  );
}

function BioAction({ as: As, icon, iconBg, title, subtitle, accent, ...props }: {
  as: "a" | "button"; icon: React.ReactNode; iconBg: string; title: string; subtitle?: string; accent?: boolean;
  [k: string]: unknown;
}) {
  const Comp = As as React.ElementType;
  return (
    <Comp {...props}
      className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left backdrop-blur transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: accent ? "linear-gradient(90deg, rgba(37,211,102,0.18), rgba(255,255,255,0.06))" : "var(--bio-card)",
        border: "1px solid var(--bio-border)",
      }}>
      <span className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: iconBg }}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate" style={{ color: "var(--bio-fg)" }}>{title}</span>
        {subtitle && <span className="block text-xs truncate" style={{ color: "var(--bio-muted)" }}>{subtitle}</span>}
      </span>
      <Copy className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--bio-fg)" }} aria-hidden />
    </Comp>
  );
}
