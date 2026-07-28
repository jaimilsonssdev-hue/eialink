import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { UnifiedPageEditor } from "@/components/page-builder/UnifiedPageEditor";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/builder")({
  component: BuilderPage,
  head: () => ({ meta: [{ title: "Minha Página — EIA Digital" }] }),
});

function BuilderPage() {
  const page = useQuery({
    queryKey: ["unified-page-editor"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error(authError?.message ?? "Sessão inválida.");

      const [{ data: bio, error: bioError }, { data: profile, error: profileError }] =
        await Promise.all([
          supabase.from("bio_pages").select("*").eq("user_id", auth.user.id).maybeSingle(),
          supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
        ]);
      if (bioError) throw new Error(bioError.message);
      if (profileError) throw new Error(profileError.message);

      const { data: links, error: linksError } = bio
        ? await supabase.from("bio_links").select("*").eq("bio_page_id", bio.id).order("position")
        : { data: [], error: null };
      if (linksError) throw new Error(linksError.message);
      return { userId: auth.user.id, bio, profile, links: links ?? [] };
    },
  });

  if (page.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (page.isError || !page.data) {
    return (
      <p role="alert" className="text-sm text-[color:var(--destructive)]">
        Não foi possível carregar sua página. {page.error?.message}
      </p>
    );
  }

  const { bio, profile, links, userId } = page.data;
  const initialBio = bio
    ? {
        slug: bio.slug,
        display_name: bio.display_name,
        description: bio.description,
        avatar_url: bio.avatar_url,
        whatsapp: bio.whatsapp,
        pix_key: bio.pix_key,
        instagram: bio.instagram,
        published: bio.published,
        theme: bio.theme,
        cover_url: bio.cover_url,
        cover_position: bio.cover_position,
        cover_fit: bio.cover_fit,
        cover_overlay: bio.cover_overlay,
        cover_overlay_opacity: bio.cover_overlay_opacity,
        template_id: bio.template_id,
      }
    : {
        slug: "",
        display_name: profile?.company_name ?? "",
        description: "",
        avatar_url: null,
        whatsapp: profile?.whatsapp ?? "",
        pix_key: "",
        instagram: profile?.instagram ?? "",
        published: true,
        theme: "aurora",
        cover_url: null,
        cover_position: "center",
        cover_fit: "cover",
        cover_overlay: true,
        cover_overlay_opacity: 45,
        template_id: null,
      };

  return (
    <UnifiedPageEditor
      initialBio={initialBio}
      initialLinks={links}
      defaults={{
        displayName: profile?.company_name ?? "",
        whatsapp: profile?.whatsapp ?? "",
        instagram: profile?.instagram ?? "",
      }}
      onSave={async ({ bio: form, links: editedLinks }) => {
        const payload = { ...form, user_id: userId };
        let bioPageId = bio?.id;
        if (bioPageId) {
          const { error } = await supabase.from("bio_pages").update(payload).eq("id", bioPageId);
          if (error) throw new Error(error.message);
        } else {
          const { data, error } = await supabase
            .from("bio_pages")
            .insert(payload)
            .select("id")
            .single();
          if (error || !data)
            throw new Error(error?.message ?? "Não foi possível criar sua página.");
          bioPageId = data.id;
        }

        const savedLinks = editedLinks.map((link, position) => ({
          ...link,
          bio_page_id: bioPageId!,
          position,
        }));
        if (savedLinks.length) {
          const { error: upsertError } = await supabase
            .from("bio_links")
            .upsert(savedLinks, { onConflict: "id" });
          if (upsertError) throw new Error(upsertError.message);
          const ids = savedLinks.map((link) => `"${link.id}"`).join(",");
          const { error: cleanupError } = await supabase
            .from("bio_links")
            .delete()
            .eq("bio_page_id", bioPageId)
            .not("id", "in", `(${ids})`);
          if (cleanupError) throw new Error(cleanupError.message);
        } else {
          const { error } = await supabase.from("bio_links").delete().eq("bio_page_id", bioPageId);
          if (error) throw new Error(error.message);
        }
        await page.refetch();
      }}
    />
  );
}
