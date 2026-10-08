import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getPresetForCompany, isProductCatalogNiche, isHealthBookingNiche } from "@/modules/prospecting/nichePresets";
import {
  generateAiPageBlueprintFromScrapedData,
  resolveNicheArchetype,
  generateNicheBentoCards,
  generateNicheFaq,
  generateNicheComparison,
  generateNicheMarquee,
} from "@/modules/prospecting/aiDemoGenerator.service";
import { NICHE_GALLERIES } from "@/modules/prospecting/nichePresets";
import { fetchInstagramProfileViaApify } from "@/modules/prospecting/ApifyInstagramService";
import { formatCatalogDescription } from "@/modules/products/services/ProductService";
import { type GoogleMapsPlaceDetails } from "@/modules/prospecting/LiveProspectingEngine";
import { fetchPlaceDetailsFn } from "@/modules/prospecting/places.functions";
import {
  makePageOfficialFn,
  transferPageOwnershipFn,
  getClaimPageInfoFn,
  claimPageFn,
} from "@/modules/page/page.functions";
import { resolveBioMediaUrl } from "@/lib/bio-media";
import { CommercialSettingsService } from "@/modules/settings/services/CommercialSettingsService";
import { buildStudioProConfigFromLead } from "@/modules/studiopro/lib/buildStudioProConfigFromLead";

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
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error(authError?.message ?? "Sessão inválida.");
    const [{ data: bios, error: bioError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase
          .from("bio_pages")
          .select("*")
          .eq("user_id", auth.user.id)
          .order("updated_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
      ]);
    if (bioError || profileError) throw new Error(bioError?.message ?? profileError?.message);
    // Prioriza estritamente páginas reais/oficiais (não-demo)
    const realBio = (bios ?? []).find((b) => !(b.social_links as any)?.is_demo) ?? null;
    const { data: links, error: linksError } = realBio
      ? await supabase.from("bio_links").select("*").eq("bio_page_id", realBio.id).order("position")
      : { data: [], error: null };
    if (linksError) throw new Error(linksError.message);
    return { userId: auth.user.id, bio: realBio, profile, links: links ?? [] };
  },
  async listOwnedPages({ includeDemos = false }: { includeDemos?: boolean } = {}): Promise<OwnedPage[]> {
    const userId = await this.getCurrentUserId();
    const { data, error } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const pages = data ?? [];
    if (includeDemos) return pages;
    return pages.filter((p) => !(p.social_links as any)?.is_demo);
  },
  async listDemoPages(): Promise<OwnedPage[]> {
    const userId = await this.getCurrentUserId();
    const { data, error } = await supabase
      .from("bio_pages")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).filter((p) => Boolean((p.social_links as any)?.is_demo));
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
    variantIndex,
    placeDetails,
    rating,
    reviewsCount,
    cid,
    preferredTemplateId,
    photos,
    avatarUrl,
  }: {
    companyName: string;
    whatsapp?: string | null;
    niche?: string | null;
    city?: string | null;
    instagram?: string | null;
    photos?: string[] | null;
    avatarUrl?: string | null;
    isDemo?: boolean;
    variantIndex?: number;
    placeDetails?: GoogleMapsPlaceDetails | null;
    rating?: number | null;
    reviewsCount?: number | null;
    cid?: string | null;
    preferredTemplateId?: string | null;
  }) {
    const userId = await this.getCurrentUserId();
    const sanitizedCompanyName = companyName
      .replace(/clinical\s+innovate/gi, "Clínica Inove")
      .replace(/^clinical\s+/gi, "Clínica ")
      .trim();
    const cleanSlug = slugify(sanitizedCompanyName);
    const suffix = crypto.randomUUID().slice(0, 4);
    const slug = `${cleanSlug}-${suffix}`;

    // Busca dados 100% reais do Google Maps se não fornecidos
    let realPlace = placeDetails;
    if (!realPlace) {
      try {
        realPlace = await fetchPlaceDetailsFn({
          data: { companyName: sanitizedCompanyName, city: city ?? null, cid: cid ?? null },
        });
      } catch (placeErr) {
        console.warn("Aviso ao buscar detalhes reais do Google Maps:", placeErr);
      }
    }

    // Se houver Instagram fornecido, extrai perfil autêntico e fotos reais do feed via Apify
    let apifyInstagramData: Awaited<ReturnType<typeof fetchInstagramProfileViaApify>> | null = null;
    if (instagram) {
      try {
        apifyInstagramData = await fetchInstagramProfileViaApify(instagram);
      } catch (apifyErr) {
        console.warn("Aviso ao buscar perfil Instagram com Apify:", apifyErr);
      }
    }

    const realRating = realPlace?.rating ?? rating ?? null;
    const realReviewsCount = realPlace?.reviewsCount ?? reviewsCount ?? null;
    const finalWhatsapp = whatsapp || realPlace?.whatsapp || apifyInstagramData?.whatsapp || null;
    const realAddress = realPlace?.address || null;
    const realHours = realPlace?.openingHours || null;
    const realReviews = realPlace?.reviews || [];

    // Esteira Inteligente: Análise profunda da ficha e reviews com IA Gemini
    const aiBlueprint = await generateAiPageBlueprintFromScrapedData({
      companyName: sanitizedCompanyName,
      city: city ?? null,
      niche: niche ?? null,
      address: realAddress,
      rating: realRating,
      reviewsCount: realReviewsCount,
      openingHours: realHours,
      whatsapp: finalWhatsapp,
      phone: finalWhatsapp,
      reviews: realReviews,
      photos: realPlace?.photos || apifyInstagramData?.photos || null,
    });

    // Identifica preset Pro de alta conversão correspondente à especialidade autêntica detectada
    const effectiveNicheKey = aiBlueprint.nicheKey || niche || "geral";
    const preset = getPresetForCompany(effectiveNicheKey, sanitizedCompanyName, variantIndex);

    // Prioriza fotos reais autênticas: Instagram (Apify) > Fotos passadas > Google Maps
    const igPhotos = apifyInstagramData?.photos && Array.isArray(apifyInstagramData.photos) ? apifyInstagramData.photos : [];
    const passedPhotos = photos && Array.isArray(photos) ? photos : [];
    const mapsPhotos = realPlace?.photos && Array.isArray(realPlace.photos) ? realPlace.photos : [];

    const combinedRealPhotos = Array.from(new Set([...igPhotos, ...passedPhotos, ...mapsPhotos])).filter(Boolean);
    const realPhotos: string[] = combinedRealPhotos.length > 0 ? combinedRealPhotos : [];

    const realCover = realPhotos[0] || preset.cover_url;
    const realAvatar = avatarUrl || apifyInstagramData?.profilePicUrlHD || apifyInstagramData?.profilePicUrl || preset.avatar_url;

    // Copywriting inteligente estruturado pela IA
    const description = `${aiBlueprint.headline}\n\n${aiBlueprint.manifesto}`;

    // Constrói estrutura Modular / Cinematic nativa para renderização moderna sem moldes rígidos
    const activeHighlights = (aiBlueprint.services.length > 0 ? aiBlueprint.services : preset.services).map((srv: any, idx: number) => ({
      id: `hl-${idx}`,
      title: srv.name || srv.title || "Serviço Especializado",
      description: srv.description || "",
      price: srv.price ? (typeof srv.price === "number" ? `R$ ${srv.price.toFixed(2)}` : String(srv.price)) : undefined,
      badge: "Destaque",
      image: srv.image_url || realPhotos[idx + 1] || undefined,
    }));

    const activeReviews = (aiBlueprint.testimonials.length > 0 ? aiBlueprint.testimonials : realReviews).map((r: any) => ({
      author: r.author || r.name || "Cliente Verificado",
      text: r.text || r.comment || "Excelente experiência e atendimento de primeira.",
      rating: typeof r.rating === "number" ? r.rating : 5,
      role: "Avaliação Google",
    }));

    // 1. Arquétipo Visual e Paleta de Cores Dinâmica (elimina cinza genérico)
    const archetypeConfig = resolveNicheArchetype(effectiveNicheKey);

    // 2. Galeria Visual Autêntica (combina fotos reais com acervo curado em HD do nicho)
    const nicheGallery = NICHE_GALLERIES[effectiveNicheKey] || NICHE_GALLERIES.geral;
    const curatedCovers = nicheGallery?.covers || NICHE_GALLERIES.geral.covers;

    const finalGalleryItems = realPhotos.length >= 4
      ? realPhotos.slice(0, 8).map((url, i) => ({
          id: `g-${i}`,
          url,
          caption: `${sanitizedCompanyName} - Detalhes`,
          category: "Ambiente",
        }))
      : [
          ...realPhotos.map((url, i) => ({
            id: `real-${i}`,
            url,
            caption: `${sanitizedCompanyName} - Espaço`,
            category: "Ambiente",
          })),
          ...curatedCovers.slice(0, Math.max(4, 6 - realPhotos.length)).map((c, i) => ({
            id: `curated-${i}`,
            url: c.url,
            caption: c.label || `${sanitizedCompanyName} - Atendimento`,
            category: "Experiência",
          })),
        ].slice(0, 8);

    // 3. Bento Grid estruturado com autoridade e números reais
    const bentoCards = generateNicheBentoCards(
      sanitizedCompanyName,
      effectiveNicheKey,
      city,
      realRating,
      realReviewsCount,
      aiBlueprint.differentials
    );

    // 4. FAQ interativo
    const faqItems = generateNicheFaq(
      sanitizedCompanyName,
      effectiveNicheKey,
      city,
      realAddress
    );

    // 5. Comparativo transparente
    const comparisonData = generateNicheComparison(
      sanitizedCompanyName,
      effectiveNicheKey
    );

    // 6. Marquee Ticker
    const marqueeBadges = generateNicheMarquee(
      sanitizedCompanyName,
      effectiveNicheKey,
      realRating
    );

    const cinematicData = {
      businessName: sanitizedCompanyName,
      niche: effectiveNicheKey,
      whatsapp: finalWhatsapp || "",
      address: realAddress || "",
      rating: realRating || 4.9,
      openingHours: realHours || "",
      archetype: archetypeConfig.archetype,
      theme: archetypeConfig.theme,
      hero: {
        title: aiBlueprint.headline || `A Experiência Autêntica na ${sanitizedCompanyName}`,
        subtitle: aiBlueprint.manifesto || description,
        tagline: effectiveNicheKey.toUpperCase(),
        floatingBadge: realRating ? `★ ${realRating} NO GOOGLE (${realReviewsCount || "100+"} avaliações)` : "★ 4.9 NO GOOGLE",
        backgroundImage: realCover,
        ctaText: preset.whatsapp_button_label || "Falar no WhatsApp",
        ctaLink: finalWhatsapp ? `https://wa.me/55${finalWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(aiBlueprint.whatsappMessage || preset.whatsapp_message(sanitizedCompanyName))}` : "#contato",
      },
      marquee: marqueeBadges,
      manifesto: aiBlueprint.manifesto || preset.generateDescription(sanitizedCompanyName, city || "sua região"),
      gallery: finalGalleryItems,
      highlights: activeHighlights,
      reviews: activeReviews,
      bentoGrid: bentoCards,
      comparison: comparisonData,
      faq: faqItems,
    };

    const studioproConfig = buildStudioProConfigFromLead({
      companyName: sanitizedCompanyName,
      niche: effectiveNicheKey,
      city: city || null,
      address: realAddress,
      whatsapp: finalWhatsapp,
      rating: realRating,
      reviewsCount: realReviewsCount,
      openingHours: realHours,
      reviews: activeReviews,
      photos: realPhotos,
      coverUrl: realCover,
      avatarUrl: realAvatar,
    });

    const { data, error } = await supabase
      .from("bio_pages")
      .insert({
        user_id: userId,
        display_name: sanitizedCompanyName,
        slug,
        whatsapp: finalWhatsapp,
        whatsapp_button_label: preset.whatsapp_button_label,
        whatsapp_message: aiBlueprint.whatsappMessage || preset.whatsapp_message(sanitizedCompanyName),
        instagram: instagram ?? null,
        template_id: preferredTemplateId || "studiopro",
        theme: aiBlueprint.theme || preset.theme,
        cover_url: realCover,
        avatar_url: realAvatar,
        description,
        social_links: {
          instagram: instagram ?? undefined,
          is_demo: isDemo,
          triage_enabled: true,
          niche: effectiveNicheKey,
          specialty: aiBlueprint.detectedSpecialty,
          city: city || null,
          google_rating: realRating,
          reviews_count: realReviewsCount,
          model_variant: "Landing Page Studio Pro (Lovable)",
          studiopro_config: studioproConfig,
          cinematic_data: cinematicData,
          custom_theme: {
            parallax: true,
            hero_style: "cinematic",
            font_pair: "moderna",
            background: "#09090b",
            primary: "#d4d4d8",
          },
          address: realAddress,
          opening_hours: realHours,
          testimonials: activeReviews,
          differentials: aiBlueprint.differentials,
          google_photos: realPhotos,
          instagram_photos: realPhotos,
          apify_scraped: Boolean(apifyInstagramData),
        },
        published: true,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a página demonstrativa.");

    // 1. Cadastra Vitrine de Serviços Premium ou Produtos de Loja (catalog_items)
    const isProduct = isProductCatalogNiche(effectiveNicheKey);
    const isHealth = isHealthBookingNiche(effectiveNicheKey);

    // Prioriza os serviços gerados pela IA (3 a 5 itens específicos e coerentes)
    const activeServices = aiBlueprint.services.length > 0
      ? aiBlueprint.services
      : preset.services;

    if (activeServices.length > 0) {
      const getProductBtnLabel = (nicheKey: string) => {
        switch (nicheKey) {
          case "sorveteria": return "Pedir no WhatsApp";
          case "delivery": return "Pedir no Delivery";
          case "restaurante": return "Fazer Pedido";
          case "loja": return "Comprar no WhatsApp";
          case "petshop": return "Pedir no WhatsApp";
          case "costura": return "Encomendar no WhatsApp";
          default: return "Fazer Pedido";
        }
      };

      const defaultBtnLabel = isProduct
        ? getProductBtnLabel(effectiveNicheKey)
        : isHealth
          ? "Agendar Procedimento"
          : "Solicitar Orçamento";

      const defaultBtnUrl = isHealth ? `/agendar/${data.slug}` : null;

      const catalogInserts = activeServices.map((srv, idx) => ({
        bio_page_id: data.id,
        name: srv.name,
        description: formatCatalogDescription(srv.description, srv.category),
        price: srv.price,
        image_url: srv.image_url || (realPhotos.length > 0 ? realPhotos[idx % realPhotos.length] : null),
        button_label: defaultBtnLabel,
        button_url: defaultBtnUrl,
        type: isProduct ? "product" : "service",
        position: idx,
        active: true,
      }));
      await supabase.from("catalog_items").insert(catalogInserts);
    }

    // 2. Configura e Ativa o Sistema de Agendamentos SOMENTE para nichos de saúde/clínica
    if (isHealth) {
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
    }

    // 3. Links de Autoridade e Prova Social (Google Reviews & Maps)
    const reviewSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(companyName + " " + (city || "") + " avaliar")}`;
    const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(companyName + " " + (city || ""))}`;

    const reviewTitle = realReviewsCount
      ? `⭐ Avaliações no Google (${realRating} • ${realReviewsCount} avaliações)`
      : `⭐ Avaliações no Google (${realRating} Estrelas)`;

    const locationTitle = realAddress
      ? `📍 ${realAddress}`
      : "📍 Localização & Como Chegar (GPS)";

    const thirdLink = isHealth
      ? {
          bio_page_id: data.id,
          title: "📅 Agendar Horário Online",
          url: `/agendar/${data.slug}`,
          position: 2,
          active: true,
        }
      : isProduct
      ? {
          bio_page_id: data.id,
          title: "🛒 Fazer Pedido no WhatsApp",
          url: `https://wa.me/${(finalWhatsapp || CommercialSettingsService.getInitialCachedNumber()).replace(/\D/g, "")}?text=${encodeURIComponent(preset.whatsapp_message(companyName))}`,
          position: 2,
          active: true,
        }
      : {
          bio_page_id: data.id,
          title: "💬 Solicitar Orçamento no WhatsApp",
          url: `https://wa.me/${(finalWhatsapp || CommercialSettingsService.getInitialCachedNumber()).replace(/\D/g, "")}?text=${encodeURIComponent(preset.whatsapp_message(companyName))}`,
          position: 2,
          active: true,
        };

    await supabase.from("bio_links").insert([
      {
        bio_page_id: data.id,
        title: reviewTitle,
        url: reviewSearchUrl,
        position: 0,
        active: true,
      },
      {
        bio_page_id: data.id,
        title: locationTitle,
        url: mapsSearchUrl,
        position: 1,
        active: true,
      },
      thirdLink,
    ]);

    return data;
  },


  async uploadMedia(file: File, path: string) {
    const { error } = await supabase.storage
      .from("bio-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage
      .from("bio-media")
      .getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error("Não foi possível obter a URL da imagem enviada.");
    }
    return data.publicUrl;
  },

  async uploadAsset(file: File) {
    const userId = await this.getCurrentUserId();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return this.uploadMedia(file, `${userId}/${crypto.randomUUID()}.${extension}`);
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
  async makePageOfficial(pageId: string) {
    try {
      return await makePageOfficialFn({ data: { pageId } });
    } catch {
      // Fallback local via cliente autenticado
      const userId = await this.getCurrentUserId();
      const { data: page, error: fetchErr } = await supabase
        .from("bio_pages")
        .select("*")
        .eq("id", pageId)
        .eq("user_id", userId)
        .single();
      if (fetchErr || !page) throw new Error("Página não encontrada ou sem permissão.");

      const currentSocial = (page.social_links as Record<string, any>) || {};
      const updatedSocial: Record<string, any> = { ...currentSocial, is_demo: false };
      delete updatedSocial.claim_token;

      let description = page.description || "";
      if (description.startsWith("[DEMO] ")) {
        description = description.replace("[DEMO] ", "").trim();
      } else if (description.startsWith("[DEMO]")) {
        description = description.replace("[DEMO]", "").trim();
      }

      const { error: updateErr } = await supabase
        .from("bio_pages")
        .update({
          social_links: updatedSocial,
          description,
          published: true,
        })
        .eq("id", pageId)
        .eq("user_id", userId);

      if (updateErr) throw new Error(updateErr.message);

      try {
        await supabase
          .from("prospected_companies")
          .update({ status: "cliente" })
          .ilike("notes", `%${pageId}%`);
      } catch (radarErr) {
        console.warn("Aviso ao atualizar radar:", radarErr);
      }

      return { success: true, slug: page.slug, displayName: page.display_name };
    }
  },

  async createClaimLink(pageId: string, targetEmail?: string) {
    const userId = await this.getCurrentUserId();

    const { data: page, error: fetchErr } = await supabase
      .from("bio_pages")
      .select("social_links, slug, display_name")
      .eq("id", pageId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !page) throw new Error("Página não encontrada.");

    const currentSocial = (page.social_links as Record<string, any>) || {};
    const existingToken =
      typeof currentSocial.claim_token === "string" && currentSocial.claim_token.trim()
        ? currentSocial.claim_token.trim()
        : null;
    const claimToken = existingToken || crypto.randomUUID();
    const updatedSocial: Record<string, any> = {
      ...currentSocial,
      claim_token: claimToken,
      claim_email: targetEmail?.trim().toLowerCase() || undefined,
    };

    const { error: updateErr } = await supabase
      .from("bio_pages")
      .update({ social_links: updatedSocial })
      .eq("id", pageId)
      .eq("user_id", userId);

    if (updateErr) throw new Error(updateErr.message);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://eialink.com.br";
    const claimUrl = `${origin}/resgatar?token=${claimToken}`;

    return {
      claimToken,
      claimUrl,
      companyName: page.display_name,
      slug: page.slug,
    };
  },

  async transferOwnership(pageId: string, targetEmail: string) {
    return await transferPageOwnershipFn({ data: { pageId, targetEmail } });
  },

  async getClaimInfo(token: string) {
    try {
      return await getClaimPageInfoFn({ data: { token } });
    } catch {
      // Fallback via consulta direta
      const { data: page, error } = await supabase
        .from("bio_pages")
        .select("id, display_name, slug, theme, cover_url, avatar_url, description, social_links")
        .filter("social_links->>claim_token", "eq", token)
        .maybeSingle();

      if (error || !page) return { valid: false };

      const social = (page.social_links as Record<string, any>) || {};
      return {
        valid: true,
        page: {
          id: page.id,
          displayName: page.display_name,
          slug: page.slug,
          theme: page.theme,
          coverUrl: page.cover_url,
          avatarUrl: page.avatar_url,
          description: page.description,
          targetEmail: social.claim_email || null,
        },
      };
    }
  },

  async claimPage(token: string) {
    return await claimPageFn({ data: { token } });
  },
};


