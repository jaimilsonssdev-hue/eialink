import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, QrCode, Instagram, ExternalLink, Sparkles } from "lucide-react";

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
    ] : [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }],
  }),
  component: PublicBio,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div><h1 className="text-4xl font-bold gradient-text">404</h1><p className="mt-2 text-muted-foreground">Página não encontrada.</p></div>
    </div>
  ),
});

function PublicBio() {
  const { bio, links } = Route.useLoaderData();

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

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-md mx-auto text-center">
        {bio.avatar_url ? (
          <img src={bio.avatar_url} alt={bio.display_name} className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-border" />
        ) : (
          <div className="h-24 w-24 rounded-full mx-auto grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <span className="text-2xl font-bold text-[color:var(--primary-foreground)]">{bio.display_name.charAt(0)}</span>
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold font-display">{bio.display_name}</h1>
        {bio.description && <p className="mt-2 text-sm text-muted-foreground">{bio.description}</p>}

        <div className="mt-8 space-y-3">
          {bio.whatsapp && (
            <a href={`https://wa.me/${bio.whatsapp}`} target="_blank" rel="noopener" onClick={() => track("whatsapp_click")}
              className="flex items-center justify-center gap-2 rounded-xl bg-[color:var(--success)] text-[color:var(--success-foreground)] py-3 font-medium">
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          )}
          {bio.pix_key && (
            <button onClick={() => { navigator.clipboard.writeText(bio.pix_key!); track("pix_click"); alert("Chave Pix copiada!"); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border py-3 font-medium">
              <QrCode className="h-4 w-4" /> Pagar com Pix
            </button>
          )}
          {bio.instagram && (
            <a href={`https://instagram.com/${bio.instagram.replace("@", "")}`} target="_blank" rel="noopener" onClick={() => track("instagram_click")}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border py-3 font-medium">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          )}
          {links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener" onClick={() => track("link_click", l.id)}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-border py-3 font-medium hover:border-[color:var(--primary)] transition-colors">
              {l.title} <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>

        <a href="/" className="mt-12 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Feito com EIA Digital
        </a>
      </div>
    </div>
  );
}
