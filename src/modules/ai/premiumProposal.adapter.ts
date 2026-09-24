import type { Tables } from "@/integrations/supabase/types";
import type { PageBlock } from "@/components/page-builder/types";
import type { CatalogItem } from "@/modules/products/types";
import type { PublicLink } from "@/components/public-profile/types";
import type { AiCopilotResult } from "./copilot.functions";
import type { PremiumBetaProposal } from "./premiumProposal.schema";

/**
 * ADAPTADOR DETERMINÍSTICO DO GERADOR PREMIUM BETA (NÍVEL 2)
 *
 * Princípios Inegociáveis:
 * 1. Converte a proposta temporária validada nas estruturas canônicas do banco (bio_pages, bio_links, catalog_items, page_blocks).
 * 2. Se um dado tem coluna dedicada em bio_pages, grava na coluna.
 * 3. Produtos e serviços são consolidados na tabela catalog_items (sem duplicação desnecessária).
 * 4. Links e CTAs são consolidados na tabela bio_links.
 * 5. Preenche social_links estritamente com as chaves exigidas pelos renderizadores atuais (TemplateRenderer, ModularSections, SiteMaquinaLayout).
 * 6. NUNCA publica a página de forma abrupta: a propriedade 'published' mantém o estado atual da página ou false.
 * 7. Gera objeto de compatibilidade direta com AiCopilotResult para integração 100% suave com o UnifiedPageEditor.
 */

export interface AdaptedProposalResult {
  updatedBio: Partial<Tables<"bio_pages">>;
  updatedLinks: Array<{
    id?: string;
    title: string;
    url: string;
    active: boolean;
    position: number;
    icon?: string | null;
  }>;
  updatedProducts: Array<Partial<CatalogItem>>;
  updatedPageBlocks: Array<PageBlock>;
  copilotResult: AiCopilotResult;
}

export function adaptProposalToExistingStructures(
  proposal: PremiumBetaProposal,
  currentBio?: Partial<Tables<"bio_pages">>,
  currentLinks?: PublicLink[],
  currentProducts?: CatalogItem[],
): AdaptedProposalResult {
  const currentSocial = ((currentBio?.social_links as Record<string, any>) || {}) as Record<string, any>;

  // 1. Extração e montagem do tema customizado (Design Tokens com contraste WCAG)
  const customTheme = {
    primary: proposal.theme.primary,
    background: proposal.theme.background,
    card_bg: proposal.theme.card_bg,
    border_color: proposal.theme.border_color,
    title: proposal.theme.title,
    text: proposal.theme.text,
    mode: proposal.theme.mode,
    border_radius: proposal.theme.radius,
  };

  const tokensDesign = {
    ...(currentSocial.tokens_design || {}),
    fundo_valores: {
      cor_gradiente_1: customTheme.background,
      cor_gradiente_2: customTheme.primary,
      blur_sobreposicao: "8px",
      imagem_url: proposal.pagePatch.coverUrl || currentBio?.cover_url || "",
    },
    estilo_botoes: {
      cor_fundo_card: customTheme.card_bg,
      cor_borda: customTheme.border_color,
      cor_texto: customTheme.text,
      cor_destaque: customTheme.primary,
      raio_borda: customTheme.border_radius,
    },
  };

  // 2. Extração de seções específicas da proposta para compatibilidade com ModularSections
  const differentialsSection = proposal.sections.find((s) => s.type === "differentials");
  const extractedDifferentials: Array<{ icon: string; title: string; text: string }> = [];
  if (differentialsSection?.content?.items && Array.isArray(differentialsSection.content.items)) {
    for (const item of differentialsSection.content.items) {
      extractedDifferentials.push({
        icon: String(item.icon || "shield"),
        title: String(item.title || ""),
        text: String(item.text || item.description || ""),
      });
    }
  }

  const testimonialsSection = proposal.sections.find((s) => s.type === "testimonials");
  const extractedTestimonials: Array<{
    id: string;
    author: string;
    rating: number;
    text: string;
    role?: string;
    avatar?: string;
  }> = [];
  if (testimonialsSection?.content?.items && Array.isArray(testimonialsSection.content.items)) {
    for (const item of testimonialsSection.content.items) {
      extractedTestimonials.push({
        id: crypto.randomUUID(),
        author: String(item.author || item.name || "Cliente Satisfeito"),
        rating: typeof item.rating === "number" ? item.rating : 5,
        text: String(item.text || item.comment || ""),
        role: item.role ? String(item.role) : undefined,
        avatar: item.avatar ? String(item.avatar) : undefined,
      });
    }
  }

  const aboutSection = proposal.sections.find((s) => s.type === "about");
  const extractedAbout = aboutSection?.content
    ? {
        enabled: true,
        title: aboutSection.title || String(aboutSection.content.title || "Sobre Nós"),
        text: String(aboutSection.content.text || aboutSection.content.description || ""),
        highlights: Array.isArray(aboutSection.content.highlights)
          ? aboutSection.content.highlights.map(String)
          : [],
      }
    : undefined;

  const videoSection = proposal.sections.find((s) => s.type === "video");
  const extractedVideo = videoSection?.content?.url
    ? {
        enabled: true,
        url: String(videoSection.content.url),
        title: videoSection.title || String(videoSection.content.title || "Apresentação Exclusiva"),
        caption: String(videoSection.content.caption || ""),
      }
    : undefined;

  // 3. Catálogo de Serviços e Produtos (Canônico)
  const updatedProducts: Array<Partial<CatalogItem>> = proposal.catalogItems.map((item, idx) => ({
    id: item.id || crypto.randomUUID(),
    bio_page_id: currentBio?.id || "draft",
    name: item.name,
    description: item.description,
    price: item.price,
    image_url: item.imageUrl,
    category: item.category || "Destaques",
    button_label: item.buttonLabel || "Pedir no WhatsApp",
    button_url: item.buttonUrl || null,
    active: item.active !== false,
    position: idx,
    type: "service",
  }));

  // 4. Carrossel estilo Instagram em social_links (para compatibilidade reversa com ModularSections)
  const productCarousel =
    updatedProducts.length > 0
      ? {
          enabled: true,
          title: "Destaques & Mais Pedidos",
          subtitle: "Conheça nossos principais serviços e diferenciais",
          aspect_ratio: "portrait_4_5" as const,
          items: updatedProducts.map((p, idx) => ({
            id: p.id || crypto.randomUUID(),
            name: p.name || "",
            description: p.description || "",
            price: p.price ?? undefined,
            image_url: p.image_url ?? undefined,
            badge: idx === 0 ? "Destaque" : undefined,
            button_text: p.button_label || "Pedir no WhatsApp",
          })),
        }
      : currentSocial.product_carousel;

  // 5. Links e Ações Canônicos
  const updatedLinks = proposal.links.map((link, idx) => ({
    id: link.id || crypto.randomUUID(),
    title: link.title,
    url: link.url,
    active: link.active !== false,
    position: idx,
    icon: link.icon || null,
  }));

  // 6. Curadoria e Atribuição de Fotos (para visualização no editor)
  const curatedPhotos = proposal.mediaAssignments.map((assignment) => ({
    url: assignment.assignedUrl,
    scores: {
      authority: assignment.qualityScore,
      quality: assignment.qualityScore,
      positioning: assignment.qualityScore,
    },
    critique: assignment.reasoning || `Foto atribuída à seção ${assignment.assignedRole}.`,
  }));

  // 7. Objeto social_links de compatibilidade (preservando legados)
  const updatedSocial: Record<string, any> = {
    ...currentSocial,
    niche: proposal.strategy.niche || currentSocial.niche || "geral",
    city: proposal.strategy.city || currentSocial.city,
    custom_theme: customTheme,
    tokens_design: tokensDesign,
    differentials: extractedDifferentials.length > 0 ? extractedDifferentials : currentSocial.differentials,
    testimonials: extractedTestimonials.length > 0 ? extractedTestimonials : currentSocial.testimonials,
    show_testimonials: extractedTestimonials.length > 0 ? true : currentSocial.show_testimonials,
    about_section: extractedAbout || currentSocial.about_section,
    video_embed: extractedVideo || currentSocial.video_embed,
    product_carousel: productCarousel,
    curated_photos: curatedPhotos.length > 0 ? curatedPhotos : currentSocial.curated_photos,
    proposal_strategy: {
      confirmedFacts: proposal.strategy.confirmedFacts,
      missingInformation: proposal.strategy.missingInformation,
      creativeDirection: proposal.creativeDirection.name,
    },
  };

  // 8. Patch do registro canônico bio_pages
  const updatedBio: Partial<Tables<"bio_pages">> = {
    ...currentBio,
    display_name: proposal.pagePatch.displayName || currentBio?.display_name || "Seu Negócio",
    description: proposal.pagePatch.description || currentBio?.description || "",
    whatsapp: proposal.pagePatch.whatsapp || currentBio?.whatsapp,
    whatsapp_message: proposal.pagePatch.whatsappMessage || currentBio?.whatsapp_message || "Olá! Gostaria de saber mais.",
    whatsapp_button_label: proposal.pagePatch.whatsappButtonLabel || currentBio?.whatsapp_button_label,
    pix_key: proposal.pagePatch.pixKey || currentBio?.pix_key,
    instagram: proposal.pagePatch.instagram || currentBio?.instagram,
    avatar_url: proposal.pagePatch.avatarUrl || currentBio?.avatar_url,
    cover_url: proposal.pagePatch.coverUrl || currentBio?.cover_url,
    template_id: currentBio?.template_id || "site-maquina",
    theme: "aurora",
    motion_enabled: proposal.creativeDirection.motionIntensity !== "off",
    motion_entrance: "gentle",
    motion_cta: "gentle",
    motion_ambient: "soft",
    social_links: updatedSocial,
    // REGRA DE SEGURANÇA: nunca força published = true em proposta de IA
    published: currentBio?.published ?? false,
  };

  // 9. Composição de PageBlocks padronizados para o editor por blocos
  const updatedPageBlocks: PageBlock[] = proposal.sections.map((section, idx) => ({
    id: section.id || crypto.randomUUID(),
    type: section.type as any,
    enabled: section.enabled !== false,
    position: idx,
    data: {
      title: section.title,
      subtitle: section.subtitle,
      variant: section.variant,
      ...section.content,
      media: section.media,
    },
  }));

  // 10. Objeto de compatibilidade direta com AiCopilotResult
  const copilotResult: AiCopilotResult = {
    display_name: updatedBio.display_name,
    niche: updatedSocial.niche,
    city: updatedSocial.city,
    description: updatedBio.description,
    whatsapp_message: updatedBio.whatsapp_message,
    avatar_url: updatedBio.avatar_url,
    cover_url: updatedBio.cover_url,
    custom_theme: customTheme,
    differentials: extractedDifferentials,
    testimonials: extractedTestimonials,
    suggested_services: updatedProducts.map((p) => ({
      name: p.name || "",
      description: p.description || "",
      price: p.price ?? null,
      image_url: p.image_url ?? null,
    })),
    curated_photos: curatedPhotos,
    about_section: extractedAbout,
    video_embed: extractedVideo,
  };

  return {
    updatedBio,
    updatedLinks,
    updatedProducts,
    updatedPageBlocks,
    copilotResult,
  };
}

