import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { UnifiedPageEditor } from "@/components/page-builder/UnifiedPageEditor";
import { supabase } from "@/integrations/supabase/client";
import { ProductService } from "@/modules/products/services/ProductService";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/builder")({
  component: BuilderPage,
  validateSearch: z.object({
    template: z.string().optional(),
    page: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Minha Página — EIA Digital" }] }),
});

function BuilderPage() {
  const { template: requestedTemplateId, page: requestedPageId } = Route.useSearch();
  const appliedTemplateRef = useRef<string | undefined>(undefined);
  const page = useQuery({
    queryKey: ["unified-page-editor", requestedPageId],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error(authError?.message ?? "Sessão inválida.");

      let bioRequest = supabase
        .from("bio_pages")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (requestedPageId) bioRequest = bioRequest.eq("id", requestedPageId);

      const [{ data: bios, error: bioError }, { data: profile, error: profileError }] =
        await Promise.all([
          bioRequest,
          supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
        ]);
      if (bioError) throw new Error(bioError.message);
      if (profileError) throw new Error(profileError.message);

      const bio = bios?.[0] ?? null;
      const { data: links, error: linksError } = bio
        ? await supabase.from("bio_links").select("*").eq("bio_page_id", bio.id).order("position")
        : { data: [], error: null };
      if (linksError) throw new Error(linksError.message);
      const products = bio ? await ProductService.list(bio.id) : [];
      return { userId: auth.user.id, bio, profile, links: links ?? [], products };
    },
  });
  const requestedTemplate = requestedTemplateId
    ? TemplateService.list().find(
        (template) => template.id === requestedTemplateId && template.status === "active",
      )
    : undefined;
  const currentBio = page.data?.bio;
  const { refetch } = page;

  useEffect(() => {
    if (!currentBio || !requestedTemplate || currentBio.template_id === requestedTemplate.id)
      return;
    if (appliedTemplateRef.current === requestedTemplate.id) return;
    appliedTemplateRef.current = requestedTemplate.id;
    void supabase
      .from("bio_pages")
      .update({ template_id: requestedTemplate.id })
      .eq("id", currentBio.id)
      .then(({ error }) => {
        if (!error) void refetch();
      });
  }, [currentBio, refetch, requestedTemplate]);

  if (page.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (page.isError || !page.data) {
    return (
      <p role="alert" className="text-sm text-[color:var(--destructive)]">
        Não foi possível carregar sua página. {page.error?.message}
      </p>
    );
  }

  const { bio, profile, links, products, userId } = page.data;
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
        template_id: requestedTemplate?.id ?? bio.template_id,
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
      initialProducts={products}
      defaults={{
        displayName: profile?.company_name ?? "",
        whatsapp: profile?.whatsapp ?? "",
        instagram: profile?.instagram ?? "",
      }}
      onSave={async ({ bio: form, links: editedLinks, products: editedProducts }) => {
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

        const savedProducts = await ProductService.sync(bioPageId!, editedProducts);

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
        return { products: savedProducts };
      }}
    />
  );
}
