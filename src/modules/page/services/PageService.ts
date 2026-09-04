import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getPresetForCompany } from "@/modules/prospecting/nichePresets";

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
    isDemo = true,
  }: {
    companyName: string;
    whatsapp?: string | null;
    niche?: string | null;
    city?: string | null;
    instagram?: string | null;
    isDemo?: boolean;
  }) {
    const userId = await this.getCurrentUserId();
    const cleanSlug = slugify(companyName);
    const suffix = crypto.randomUUID().slice(0, 4);
    const slug = `${cleanSlug}-${suffix}`;

    // Identifica preset Pro completo de alta conversão
    const preset = getPresetForCompany(niche, companyName);
    const description = preset.generateDescription(companyName, city || "sua região");

    const { data, error } = await supabase
      .from("bio_pages")
      .insert({
        user_id: userId,
        display_name: companyName,
        slug,
        whatsapp: whatsapp ?? null,
        whatsapp_button_label: preset.whatsapp_button_label,
        whatsapp_message: preset.whatsapp_message(companyName),
        instagram: instagram ?? null,
        template_id: preset.template_id,
        theme: preset.theme,
        cover_url: preset.cover_url,
        avatar_url: preset.avatar_url,
        description,
        social_links: {
          instagram: instagram ?? undefined,
          is_demo: isDemo,
          demo_company: companyName,
          triage_enabled: true,
          google_rating: 5,
        },
        published: true,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a página demonstrativa.");

    // 1. Cadastra Vitrine de Serviços Premium (catalog_items)
    if (preset.services.length > 0) {
      const catalogInserts = preset.services.map((srv, idx) => ({
        bio_page_id: data.id,
        name: srv.name,
        description: srv.description,
        price: srv.price,
        image_url: srv.image_url,
        button_label: "Agendar Procedimento",
        button_url: `/agendar/${data.slug}`,
        type: "service",
        position: idx,
        active: true,
      }));
      await supabase.from("catalog_items").insert(catalogInserts);
    }

    // 2. Configura e Ativa o Sistema de Agendamentos / Agenda Interativa
    try {
      await supabase.from("booking_settings").insert({
        bio_page_id: data.id,
        active: true,
        timezone: "America/Sao_Paulo",
        min_notice_hours: 2,
        max_days_ahead: 30,
      });

      const bookingServicesInserts = preset.services.map((srv, idx) => ({
        bio_page_id: data.id,
        name: srv.name,
        description: srv.description,
        duration_minutes: srv.duration_minutes,
        price: srv.price,
        position: idx,
        active: true,
      }));
      await supabase.from("booking_services").insert(bookingServicesInserts);

      const weekdays = [1, 2, 3, 4, 5, 6];
      const availabilityInserts = weekdays.map((day) => ({
        bio_page_id: data.id,
        weekday: day,
        start_time: "08:00",
        end_time: day === 6 ? "12:00" : "18:00",
        active: true,
      }));
      await supabase.from("booking_availability").insert(availabilityInserts);
    } catch (bookingErr) {
      console.warn("Aviso ao inicializar agenda demonstrativa:", bookingErr);
    }

    // 3. Links de Autoridade e Prova Social (Google Reviews & Maps)
    const reviewSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyName + " " + (city || "") + " avaliar")}`;
    const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(companyName + " " + (city || ""))}`;

    await supabase.from("bio_links").insert([
      {
        bio_page_id: data.id,
        title: "⭐ Avaliações no Google (5 Estrelas)",
        url: reviewSearchUrl,
        position: 0,
        active: true,
      },
      {
        bio_page_id: data.id,
        title: "📍 Localização & Como Chegar (GPS)",
        url: mapsSearchUrl,
        position: 1,
        active: true,
      },
      {
        bio_page_id: data.id,
        title: "📅 Agendar Horário Online",
        url: `/agendar/${data.slug}`,
        position: 2,
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

  async deletePage(pageId: string) {
    const userId = await this.getCurrentUserId();

    // 1. Remove registros vinculados primeiro para garantir que nenhuma restrição de chave estrangeira falhe
    await Promise.allSettled([
      supabase.from("bio_links").delete().eq("bio_page_id", pageId),
      supabase.from("catalog_items").delete().eq("bio_page_id", pageId),
      supabase.from("booking_availability").delete().eq("bio_page_id", pageId),
      supabase.from("booking_services").delete().eq("bio_page_id", pageId),
      supabase.from("booking_settings").delete().eq("bio_page_id", pageId),
      supabase.from("appointments").delete().eq("bio_page_id", pageId),
      supabase.from("page_blocks").delete().eq("bio_page_id", pageId),
      supabase.from("analytics_events").delete().eq("bio_page_id", pageId),
    ]);

    // 2. Remove a página da tabela bio_pages
    const { error } = await supabase
      .from("bio_pages")
      .delete()
      .eq("id", pageId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return true;
  },
};


