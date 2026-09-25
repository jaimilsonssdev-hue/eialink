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

  // Extração de Perguntas Frequentes (FAQ) da proposta
  const faqSection = proposal.sections.find((s) => s.type === "faq");
  const extractedFaq: Array<{ q: string; a: string }> = [];
  const rawFaqItems =
    (faqSection?.content as any)?.items ||
    (faqSection?.content as any)?.faq ||
    (faqSection?.content as any)?.questions ||
    [];
  if (Array.isArray(rawFaqItems)) {
    for (const item of rawFaqItems) {
      if (item && (item.q || item.question) && (item.a || item.answer)) {
        extractedFaq.push({
          q: String(item.q || item.question),
          a: String(item.a || item.answer),
        });
      }
    }
  }

  // Extração de Passos de Atendimento (Steps / Como Funciona)
  const stepsSection = proposal.sections.find((s) => s.type === "steps" || s.type === "how_it_works");
  const extractedSteps: Array<{ num: string; title: string; desc: string }> = [];
  const rawSteps =
    (stepsSection?.content as any)?.items ||
    (stepsSection?.content as any)?.steps ||
    [];
  if (Array.isArray(rawSteps)) {
    for (let i = 0; i < rawSteps.length; i++) {
      const s = rawSteps[i];
      if (s && s.title) {
        extractedSteps.push({
          num: String(s.num || i + 1).padStart(2, "0"),
          title: String(s.title),
          desc: String(s.desc || s.description || ""),
        });
      }
    }
  }

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

  // 7. Mapeamento dinâmico da ordem das seções homologadas
  const mappedSectionsOrder: string[] = [];
  for (const s of proposal.sections) {
    if (s.enabled === false) continue;
    switch (s.type) {
      case "hero":
        if (!mappedSectionsOrder.includes("hero")) mappedSectionsOrder.push("hero");
        break;
      case "catalog_carousel":
      case "products":
        if (!mappedSectionsOrder.includes("product_carousel")) mappedSectionsOrder.push("product_carousel");
        break;
      case "servicos":
      case "services":
      case "catalog_items":
        if (!mappedSectionsOrder.includes("servicos")) mappedSectionsOrder.push("servicos");
        break;
      case "differentials":
      case "features":
        if (!mappedSectionsOrder.includes("diferenciais")) mappedSectionsOrder.push("diferenciais");
        break;
      case "about":
        if (!mappedSectionsOrder.includes("about")) mappedSectionsOrder.push("about");
        break;
      case "video":
        if (!mappedSectionsOrder.includes("video")) mappedSectionsOrder.push("video");
        break;
      case "testimonials":
      case "reviews":
        if (!mappedSectionsOrder.includes("avaliacoes")) mappedSectionsOrder.push("avaliacoes");
        break;
      case "steps":
      case "how_it_works":
        if (!mappedSectionsOrder.includes("steps")) mappedSectionsOrder.push("steps");
        break;
      case "faq":
        if (!mappedSectionsOrder.includes("faq")) mappedSectionsOrder.push("faq");
        break;
      case "contact_map":
      case "contact":
      case "whatsapp_cta":
        if (!mappedSectionsOrder.includes("contato")) mappedSectionsOrder.push("contato");
        break;
      case "credibility":
        if (!mappedSectionsOrder.includes("credibility")) mappedSectionsOrder.push("credibility");
        break;
    }
  }

  // Garante hero no início e contato no fim
  if (!mappedSectionsOrder.includes("hero")) mappedSectionsOrder.unshift("hero");
  if (updatedProducts.length > 0 && !mappedSectionsOrder.includes("product_carousel") && !mappedSectionsOrder.includes("servicos")) {
    const heroIdx = mappedSectionsOrder.indexOf("hero");
    mappedSectionsOrder.splice(heroIdx + 1, 0, "product_carousel", "servicos");
  }
  if (!mappedSectionsOrder.includes("contato")) mappedSectionsOrder.push("contato");

  // Configurações de estilo e visibilidade de cada seção
  const sectionStyles: Record<string, any> = {
    ...(currentSocial.section_styles || {}),
    hero: {
      ...(currentSocial.section_styles?.hero || {}),
      title: proposal.pagePatch.displayName || currentBio?.display_name,
      subtitle: proposal.pagePatch.description || currentBio?.description,
      visible: true,
    },
    product_carousel: {
      ...(currentSocial.section_styles?.product_carousel || {}),
      visible: mappedSectionsOrder.includes("product_carousel") && updatedProducts.length > 0,
    },
    servicos: {
      ...(currentSocial.section_styles?.servicos || {}),
      visible: mappedSectionsOrder.includes("servicos") || updatedProducts.length > 0,
    },
    diferenciais: {
      ...(currentSocial.section_styles?.diferenciais || {}),
      visible: mappedSectionsOrder.includes("diferenciais") && extractedDifferentials.length > 0,
      title: differentialsSection?.title || `Por que nos escolher`,
    },
    about: {
      ...(currentSocial.section_styles?.about || {}),
      visible: mappedSectionsOrder.includes("about") || Boolean(extractedAbout),
      title: aboutSection?.title || "Sobre Nós",
    },
    video: {
      ...(currentSocial.section_styles?.video || {}),
      visible: mappedSectionsOrder.includes("video") && Boolean(extractedVideo),
      title: videoSection?.title || "Vídeo de Apresentação",
    },
    avaliacoes: {
      ...(currentSocial.section_styles?.avaliacoes || {}),
      visible: mappedSectionsOrder.includes("avaliacoes") && extractedTestimonials.length > 0,
      title: testimonialsSection?.title || "Avaliações e Recomendações",
    },
    // Esconde passos genéricos caso a IA não tenha gerado passos específicos para este negócio
    steps: {
      ...(currentSocial.section_styles?.steps || {}),
      visible: mappedSectionsOrder.includes("steps") && extractedSteps.length > 0,
      title: stepsSection?.title || "Como funciona o atendimento",
    },
    // Esconde FAQ caso a IA não tenha gerado dúvidas para este negócio (evita perguntas médicas genéricas)
    faq: {
      ...(currentSocial.section_styles?.faq || {}),
      visible: mappedSectionsOrder.includes("faq") && extractedFaq.length > 0,
      title: faqSection?.title || "Dúvidas Frequentes",
    },
    // Esconde credibilidade a menos que explicitamente requerida
    credibility: {
      ...(currentSocial.section_styles?.credibility || {}),
      visible: mappedSectionsOrder.includes("credibility"),
    },
    contato: {
      ...(currentSocial.section_styles?.contato || {}),
      visible: true,
    },
  };

  // 8. Objeto social_links de compatibilidade (preservando legados)
  const updatedSocial: Record<string, any> = {
    ...currentSocial,
    niche: proposal.strategy.niche || currentSocial.niche || "geral",
    city: proposal.strategy.city || currentSocial.city,
    custom_theme: customTheme,
    tokens_design: tokensDesign,
    sections_order: mappedSectionsOrder,
    section_styles: sectionStyles,
    differentials: extractedDifferentials.length > 0 ? extractedDifferentials : currentSocial.differentials,
    testimonials: extractedTestimonials.length > 0 ? extractedTestimonials : currentSocial.testimonials,
    show_testimonials: extractedTestimonials.length > 0 ? true : currentSocial.show_testimonials,
    about_section: extractedAbout || currentSocial.about_section,
    video_embed: extractedVideo || currentSocial.video_embed,
    faq_items: extractedFaq.length > 0 ? extractedFaq : currentSocial.faq_items,
    steps: extractedSteps.length > 0 ? extractedSteps : currentSocial.steps,
    product_carousel: productCarousel,
    curated_photos: curatedPhotos.length > 0 ? curatedPhotos : currentSocial.curated_photos,
    proposal_strategy: {
      confirmedFacts: proposal.strategy.confirmedFacts,
      missingInformation: proposal.strategy.missingInformation,
      creativeDirection: proposal.creativeDirection.name,
    },
  };

  // 9. Patch do registro canônico bio_pages
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

  // 10. Composição de PageBlocks padronizados para o editor por blocos
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

  // 11. Objeto de compatibilidade direta com AiCopilotResult
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
    faq_items: extractedFaq,
    steps: extractedSteps,
    sections_order: mappedSectionsOrder,
    section_styles: sectionStyles,
  } as any;

  return {
    updatedBio,
    updatedLinks,
    updatedProducts,
    updatedPageBlocks,
    copilotResult,
  };
}

