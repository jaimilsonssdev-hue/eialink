import { supabase } from "@/integrations/supabase/client";
import type { DailyDeal, CreateDailyDealInput } from "../types";
import { formatPrice } from "@/lib/utils";

export const DealsService = {
  /**
   * Consulta daily_deals ativas (is_active = true e expires_at > now),
   * trazendo os dados da bio_pages relacionada.
   */
  async getActiveCityDeals(city?: string): Promise<DailyDeal[]> {
    let query = (supabase as any)
      .from("daily_deals")
      .select(`
        *,
        bio_pages:bio_page_id (
          id,
          display_name,
          slug,
          avatar_url,
          whatsapp_number
        )
      `)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (city && city.trim()) {
      query = query.ilike("city", `%${city.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[DealsService] Erro ao buscar ofertas ativas:", error);
      throw error;
    }

    if (!data) return [];

    return (data as any[]).map((row) => ({
      id: row.id,
      bio_page_id: row.bio_page_id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      original_price: row.original_price != null ? Number(row.original_price) : null,
      deal_price: Number(row.deal_price),
      discount_badge: row.discount_badge,
      image_url: row.image_url,
      claim_action_url: row.claim_action_url,
      city: row.city,
      niche: row.niche,
      starts_at: row.starts_at,
      expires_at: row.expires_at,
      clicks_count: row.clicks_count || 0,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      business_name: row.bio_pages?.display_name,
      slug: row.bio_pages?.slug,
      avatar_url: row.bio_pages?.avatar_url,
      whatsapp_number: row.bio_pages?.whatsapp_number,
    }));
  },

  /**
   * Insere uma oferta no banco vinculada ao usuário logado.
   */
  async createDailyDeal(dealData: CreateDailyDealInput): Promise<DailyDeal> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error("Usuário não autenticado.");
    }

    const payload = {
      bio_page_id: dealData.bio_page_id,
      user_id: authData.user.id,
      title: dealData.title.trim(),
      description: dealData.description?.trim() || null,
      original_price: dealData.original_price != null ? Number(dealData.original_price) : null,
      deal_price: Number(dealData.deal_price),
      discount_badge: dealData.discount_badge?.trim() || null,
      image_url: dealData.image_url || null,
      claim_action_url: dealData.claim_action_url || null,
      city: dealData.city?.trim() || "Teixeira de Freitas",
      niche: dealData.niche?.trim() || null,
      starts_at: dealData.starts_at || new Date().toISOString(),
      expires_at: dealData.expires_at,
      is_active: dealData.is_active !== false,
      clicks_count: 0,
    };

    const { data, error } = await (supabase as any)
      .from("daily_deals")
      .insert(payload)
      .select(`
        *,
        bio_pages:bio_page_id (
          id,
          display_name,
          slug,
          avatar_url,
          whatsapp_number
        )
      `)
      .single();

    if (error) {
      console.error("[DealsService] Erro ao criar oferta:", error);
      throw error;
    }

    return {
      id: data.id,
      bio_page_id: data.bio_page_id,
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      original_price: data.original_price != null ? Number(data.original_price) : null,
      deal_price: Number(data.deal_price),
      discount_badge: data.discount_badge,
      image_url: data.image_url,
      claim_action_url: data.claim_action_url,
      city: data.city,
      niche: data.niche,
      starts_at: data.starts_at,
      expires_at: data.expires_at,
      clicks_count: data.clicks_count || 0,
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      business_name: data.bio_pages?.display_name,
      slug: data.bio_pages?.slug,
      avatar_url: data.bio_pages?.avatar_url,
      whatsapp_number: data.bio_pages?.whatsapp_number,
    };
  },

  /**
   * Incrementa o contador de cliques de uma oferta.
   */
  async trackDealClick(dealId: string): Promise<void> {
    try {
      const { data } = await (supabase as any)
        .from("daily_deals")
        .select("clicks_count")
        .eq("id", dealId)
        .single();

      if (data) {
        await (supabase as any)
          .from("daily_deals")
          .update({ clicks_count: (data.clicks_count || 0) + 1 })
          .eq("id", dealId);
      }
    } catch (err) {
      console.warn("[DealsService] Falha ao rastrear clique da oferta:", err);
    }
  },

  /**
   * Gera texto formatado com emojis, lista de ofertas e links encurtados
   * pronto para disparar no WhatsApp.
   */
  formatDailyWhatsAppBroadcast(deals: DailyDeal[], city: string = "Teixeira de Freitas"): string {
    const formattedCity = city.trim() || "Teixeira de Freitas";

    if (!deals || deals.length === 0) {
      return `🔥 *OPORTUNIDADES DE HOJE EM ${formattedCity.toUpperCase()}* 🔥\n\nNenhuma oferta ativa no momento.\nAcompanhe as próximas em: eialink.com.br/hoje`;
    }

    const lines: string[] = [
      `🔥 *OPORTUNIDADES DE HOJE EM ${formattedCity.toUpperCase()}* 🔥`,
      `Ofertas válidas somente até 23:59:\n`,
    ];

    deals.forEach((deal, index) => {
      const numEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"][index] || `*#${index + 1}*`;
      const company = deal.business_name || "Comércio Local";
      const title = deal.title;
      let priceDetail = "";
      if (deal.original_price) {
        priceDetail = `: ${title} de ${formatPrice(deal.original_price)} por ${formatPrice(deal.deal_price)}!`;
      } else {
        priceDetail = `: ${title} por apenas ${formatPrice(deal.deal_price)}!`;
      }
      if (deal.discount_badge) {
        priceDetail += ` (${deal.discount_badge})`;
      }

      lines.push(`${numEmoji} *${company}*${priceDetail}`);
      lines.push(`👉 Resgatar: eialink.com.br/hoje\n`);
    });

    return lines.join("\n").trim();
  },
};

