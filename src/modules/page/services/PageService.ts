import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type OwnedPage = Tables<"bio_pages">;

function slugify(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return normalized || "minha-pagina";
}
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
        supabase
          .from("bio_pages")
          .select("*")
          .eq("user_id", auth.user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
      ]);
    if (bioError || profileError) throw new Error(bioError?.message ?? profileError?.message);
    const { data: links, error: linksError } = bio
      ? await supabase.from("bio_links").select("*").eq("bio_page_id", bio.id).order("position")
      : { data: [], error: null };
    if (linksError) throw new Error(linksError.message);
    return { userId: auth.user.id, bio, profile, links: links ?? [] };
  },
  async listOwnedPages(): Promise<OwnedPage[]> {
    const userId = await this.getCurrentUserId();
    const { data, error } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async createPage({ displayName, templateId }: { displayName: string; templateId?: string }) {
    const userId = await this.getCurrentUserId();
    const suffix = crypto.randomUUID().slice(0, 6);
    const { data, error } = await supabase
      .from("bio_pages")
      .insert({
        user_id: userId,
        display_name: displayName.trim() || "Minha nova página",
        slug: `${slugify(displayName)}-${suffix}`,
        template_id: templateId ?? null,
        description: "Conte em poucas palavras o que torna seu negócio especial.",
        theme: "aurora",
        published: true,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a página.");
    return data;
  },
  async createProspectDemoPage({
    companyName,
    whatsapp,
    niche,
    city,
    instagram,
  }: {
    companyName: string;
    whatsapp?: string | null;
    niche?: string | null;
    city?: string | null;
    instagram?: string | null;
  }) {
    const userId = await this.getCurrentUserId();
    const cleanSlug = slugify(companyName);
    const suffix = crypto.randomUUID().slice(0, 4);
    const slug = `${cleanSlug}-${suffix}`;
    const description = `${companyName} em ${city || "sua região"}. Agendamentos e atendimento rápido pelo WhatsApp.`;

    const { data, error } = await supabase
      .from("bio_pages")
      .insert({
        user_id: userId,
        display_name: companyName,
        slug,
        whatsapp: whatsapp ?? null,
        whatsapp_button_label: "Agendar Atendimento",
        whatsapp_message: `Olá! Vi a página da ${companyName} e gostaria de mais informações.`,
        instagram: instagram ?? null,
        template_id: "spotlight-neon",
        description: `[DEMO] ${description}`,
        social_links: {
          instagram: instagram ?? undefined,
          is_demo: true,
          demo_company: companyName,
          triage_enabled: true,
        },
        theme: "aurora",
        published: true,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a demonstração.");

    // Cria links iniciais demonstrativos de alta conversão
    const reviewSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyName + " " + (city || "") + " avaliar")}`;
    const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(companyName + " " + (city || ""))}`;

    await supabase.from("bio_links").insert([
      {
        bio_page_id: data.id,
        title: "⭐ Avaliar Atendimento no Google",
        url: reviewSearchUrl,
        position: 0,
        active: true,
      },
      {
        bio_page_id: data.id,
        title: "📍 Como Chegar (Google Maps)",
        url: mapsSearchUrl,
        position: 1,
        active: true,
      },
    ]);

    return data;
  },

  async uploadMedia(file: File, path: string) {
    const { error } = await supabase.storage
      .from("bio-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("bio-media").getPublicUrl(path).data.publicUrl;
  },
};

