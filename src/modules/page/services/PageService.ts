import { supabase } from "@/integrations/supabase/client";
export const PageService = {
  async getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error(error?.message ?? "Sessão inválida.");
    return data.user.id;
  },
  async getCurrentPage() {
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) throw new Error(error?.message ?? "Sessão inválida.");
    const [{ data: bio, error: bioError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase.from("bio_pages").select("*").eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
      ]);
    if (bioError || profileError) throw new Error(bioError?.message ?? profileError?.message);
    const { data: links, error: linksError } = bio
      ? await supabase.from("bio_links").select("*").eq("bio_page_id", bio.id).order("position")
      : { data: [], error: null };
    if (linksError) throw new Error(linksError.message);
    return { userId: auth.user.id, bio, profile, links: links ?? [] };
  },
  async uploadMedia(file: File, path: string) {
    const { error } = await supabase.storage
      .from("bio-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("bio-media").getPublicUrl(path).data.publicUrl;
  },
};
