import { supabase } from "@/integrations/supabase/client";
import type { CrossTrafficPartnership } from "../types";

export const CrossTrafficService = {
  /**
   * Busca parceiros ativos para exibição na página pública do host.
   */
  async getPartnershipsForPage(bioPageId: string): Promise<CrossTrafficPartnership[]> {
    const { data, error } = await (supabase as any)
      .from("cross_traffic_partnerships")
      .select(`
        *,
        partner_page:partner_page_id (
          id,
          display_name,
          slug,
          avatar_url
        )
      `)
      .eq("host_page_id", bioPageId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CrossTrafficService] Erro ao buscar parceiros da página:", error);
      throw error;
    }

    if (!data) return [];

    return (data as any[]).map((row) => ({
      id: row.id,
      host_page_id: row.host_page_id,
      partner_page_id: row.partner_page_id,
      benefit_text: row.benefit_text,
      badge_label: row.badge_label || "Parceiro da Rede",
      status: row.status,
      clicks_count: row.clicks_count || 0,
      created_at: row.created_at,
      partner_name: row.partner_page?.display_name,
      partner_slug: row.partner_page?.slug,
      partner_avatar: row.partner_page?.avatar_url,
    }));
  },

  /**
   * Lista páginas publicadas disponíveis na rede para formação de parceria.
   */
  async listAvailablePartnerPages(currentPageId: string): Promise<{ id: string; display_name: string; slug: string; avatar_url: string | null; city?: string | null }[]> {
    const { data, error } = await supabase
      .from("bio_pages")
      .select("id, display_name, slug, avatar_url, social_links")
      .eq("published", true)
      .neq("id", currentPageId)
      .limit(60);

    if (error) {
      console.error("[CrossTrafficService] Erro ao listar páginas parceiras disponíveis:", error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      slug: p.slug,
      avatar_url: p.avatar_url,
      city: p.social_links?.city || null,
    }));
  },

  /**
   * Cadastra parceria mútua entre duas páginas.
   */
  async createPartnership(
    hostPageId: string,
    partnerPageId: string,
    benefitText: string,
    badgeLabel: string = "Parceiro da Rede",
  ): Promise<CrossTrafficPartnership[]> {
    if (hostPageId === partnerPageId) {
      throw new Error("Uma página não pode fazer parceria de tráfego cruzado consigo mesma.");
    }

    const partnerships = [
      {
        host_page_id: hostPageId,
        partner_page_id: partnerPageId,
        benefit_text: benefitText.trim(),
        badge_label: badgeLabel.trim() || "Parceiro da Rede",
        status: "active",
      },
      {
        host_page_id: partnerPageId,
        partner_page_id: hostPageId,
        benefit_text: benefitText.trim(),
        badge_label: badgeLabel.trim() || "Parceiro da Rede",
        status: "active",
      },
    ];

    const { data, error } = await (supabase as any)
      .from("cross_traffic_partnerships")
      .upsert(partnerships, { onConflict: "host_page_id,partner_page_id" })
      .select();

    if (error) {
      console.error("[CrossTrafficService] Erro ao cadastrar parceria mútua:", error);
      throw error;
    }

    return (data || []) as CrossTrafficPartnership[];
  },

  /**
   * Exclui ou revoga uma parceria de tráfego cruzado.
   */
  async deletePartnership(partnershipId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("cross_traffic_partnerships")
      .delete()
      .eq("id", partnershipId);

    if (error) {
      console.error("[CrossTrafficService] Erro ao excluir parceria:", error);
      throw error;
    }
  },

  /**
   * Registra clique no link do parceiro de tráfego cruzado.
   */
  async trackPartnershipClick(partnershipId: string): Promise<void> {
    try {
      await (supabase as any).rpc("increment_partnership_click", {
        _partnership_id: partnershipId,
      });
    } catch (err) {
      console.warn("[CrossTrafficService] Falha ao registrar clique de parceria:", err);
    }
  },
};
