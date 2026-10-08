import { createServerFn } from "@tanstack/react-start";
import type { CinematicPageData } from "@/modules/cinematic/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { invokeGeminiGateway, requestGemini } from "@/modules/ai/gemini-gateway";

export interface IdeationInput {
  businessName: string;
  niche: string;
  city: string;
  whatsapp?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  instagramHandle?: string;
  instagramBio?: string;
  photos: string[];
  captions?: string[];
  userNotes?: string;
}

export interface IdeationDossier {
  archetype: "luxury-editorial" | "clean-biotech" | "cyber-tech" | "dark-brutalist" | "neo-pop-d2c";
  palette: {
    bg: string;
    accent: string;
    secondaryAccent: string;
    fontHeading: string;
    borderStyle: "glass" | "sharp" | "pill" | "subtle";
  };
  valueProposition: string;
  heroHeadline: string;
  heroSubtitle: string;
  manifestoExcerpt: string;
  curatedPhotos: {
    hero: string;
    showcase: string[];
    ambiance: string[];
  };
  serviceIdeas: Array<{
    title: string;
    subtitle: string;
    priceHint: string;
    badge: string;
    photoUrl?: string;
  }>;
  superPrompt: string;
}

function detectArchetype(niche: string): IdeationDossier["archetype"] {
  const n = (niche || "").toLowerCase();
  if (/hamburg|burger|pizza|barbearia|treino|crossfit|luta|açaí|acai|lanche/i.test(n)) {
    return "neo-pop-d2c";
  }
  if (/bistr|café|cafe|restaurante|gastronomia|joia|luxo|vinho|arquitetura/i.test(n)) {
    return "luxury-editorial";
  }
  if (/odonto|dentista|est[eé]tica|cl[ií]nica|dermat|sa[uú]de|fisiot|spa/i.test(n)) {
    return "clean-biotech";
  }
  if (/tatuag|tattoo|arte|moda|advoc|fotograf/i.test(n)) {
    return "dark-brutalist";
  }
  return "luxury-editorial";
}

function getArchetypePalette(archetype: IdeationDossier["archetype"]): IdeationDossier["palette"] {
  switch (archetype) {
    case "neo-pop-d2c":
      return {
        bg: "#070709",
        accent: "#ccff00",
        secondaryAccent: "#ff0055",
        fontHeading: "display",
        borderStyle: "pill",
      };
    case "clean-biotech":
      return {
        bg: "#070b0c",
        accent: "#10b981",
        secondaryAccent: "#06b6d4",
        fontHeading: "sans",
        borderStyle: "glass",
      };
    case "cyber-tech":
      return {
        bg: "#06090e",
        accent: "#00f0ff",
        secondaryAccent: "#38bdf8",
        fontHeading: "mono",
        borderStyle: "sharp",
      };
    case "dark-brutalist":
      return {
        bg: "#09090b",
        accent: "#ffffff",
        secondaryAccent: "#a1a1aa",
        fontHeading: "display",
        borderStyle: "subtle",
      };
    case "luxury-editorial":
    default:
      return {
        bg: "#0a0a0c",
        accent: "#f59e0b",
        secondaryAccent: "#d97706",
        fontHeading: "serif",
        borderStyle: "glass",
      };
  }
}

/**
 * 1. Gera o Dossiê Estratégico e o Super Prompt combinando Google Maps, Instagram e a Skill creative-site-craft
 */
export const synthesizeSiteIdeationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: IdeationInput) => data)
  .handler(async ({ data, context }): Promise<IdeationDossier> => {
    const archetype = detectArchetype(data.niche);
    const palette = getArchetypePalette(archetype);

    const photos = (data.photos || []).filter((p) => Boolean(p && p.trim()));
    const heroPhoto =
      photos[0] ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
    const showcasePhotos = photos.slice(1, 5);
    const ambiancePhotos = photos.slice(5, 9);

    // Fallback heurístico inteligente caso não haja chave Gemini configurada
    const fallbackDossier: IdeationDossier = {
      archetype,
      palette,
      valueProposition: `Experiência autoral em ${data.city} com nota ${data.rating ?? 4.9} e aprovação máxima.`,
      heroHeadline: `${data.businessName} — O Padrão de ${data.niche} em ${data.city}`,
      heroSubtitle: `Atendimento exclusivo com reserva direta no WhatsApp. Sem filas, com pontualidade e acabamento impecável.`,
      manifestoExcerpt: `Criamos cada detalhe com rigor e respeito ao seu tempo. Uma atmosfera que equilibra precisão técnica e conforto acolhedor.`,
      curatedPhotos: {
        hero: heroPhoto,
        showcase: showcasePhotos.length > 0 ? showcasePhotos : [heroPhoto],
        ambiance: ambiancePhotos,
      },
      serviceIdeas: [
        {
          title: "Atendimento Principal",
          subtitle: "Procedimento exclusivo com protocolo personalizado",
          priceHint: "Consulte opções",
          badge: "Mais Pedido",
          photoUrl: showcasePhotos[0] || heroPhoto,
        },
        {
          title: "Experiência Completa",
          subtitle: "O cuidado integral pensado para o seu bem-estar",
          priceHint: "Sob agendamento",
          badge: "Destaque",
          photoUrl: showcasePhotos[1] || heroPhoto,
        },
      ],
      superPrompt: `Crie um site cinematográfico para "${data.businessName}" (${data.niche} em ${data.city}).
Arquétipo: ${archetype} (Fundo ${palette.bg}, Acento ${palette.accent}).
Ponto de Prova: Nota ${data.rating ?? 4.9} no Google (${data.reviewsCount ?? 120} avaliações reais).
WhatsApp: ${data.whatsapp || "Direto no botão"}.
Regras de Copy: Sem clichês ("o melhor da cidade"). Use tom sensorial, autoridade e elegância.`,
    };

    // Resolve chave segura diretamente do usuário autenticado ou ambiente
    let apiKey: string | undefined;
    try {
      const { data: userData } = await context.supabase.auth.getUser();
      apiKey = userData?.user?.user_metadata?.gemini_api_key;
    } catch {
      // fallback
    }
    if (!apiKey) {
      const { resolveGeminiApiKeyAsync } = await import("@/modules/ai/google-ai.service");
      apiKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }

    if (!apiKey) {
      return fallbackDossier;
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um Diretor de Arte e Copywriter Sênior especializado na Skill 'creative-site-craft'.
Analise os dados do negócio abaixo e sintetize um DOSSIÊ ESTRATÉGICO e um SUPER PROMPT estruturado para a criação de um site de alta conversão.

DADOS MINERADOS DO NEGÓCIO:
- Nome: "${data.businessName}"
- Nicho: "${data.niche}"
- Cidade: "${data.city}"
- WhatsApp: "${data.whatsapp || "Não informado"}"
- Endereço: "${data.address || "Centro"}"
- Avaliação Google Maps: ${data.rating ?? 4.9} (${data.reviewsCount ?? 120} avaliações)
- Instagram: @${data.instagramHandle || "Não informado"}
- Bio do Instagram: "${data.instagramBio || ""}"
- Legendas de posts recentes: ${JSON.stringify(data.captions?.slice(0, 4) || [])}
- Fotos reais extraídas: ${photos.length} fotos disponíveis.

DIRETRIZES DA SKILL CREATIVE-SITE-CRAFT:
1. Arquétipo visual obrigatório: "${archetype}".
2. Copywriting sensorial: PROIBIDO clichês como "o melhor da cidade", "qualidade garantida", "venha conferir". Use vocabulário tátil, comprovação por números e comodidade real.
3. Crie 3 a 4 ideias de produtos/serviços de destaque com badges envolventes.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem blocos \`\`\`):
{
  "valueProposition": "Frase de 1 linha com o diferencial inegociável",
  "heroHeadline": "Título magnético em poucas palavras",
  "heroSubtitle": "Subtítulo envolvente focado no benefício e conveniência do cliente",
  "manifestoExcerpt": "Um parágrafo de manifesto sensorial e autêntico",
  "serviceIdeas": [
    {
      "title": "Nome do serviço/produto",
      "subtitle": "Descrição sensorial em 1 linha",
      "priceHint": "Ex: A partir de R$ 90 ou Sob Consulta",
      "badge": "Ex: Mais Pedido ou Exclusivo"
    }
  ],
  "superPrompt": "Instruções cirúrgicas de design, tom de voz e ordem de blocos para gerar o site final"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.4,
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: "low" as any,
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        const cleanJson = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        const parsed = JSON.parse(cleanJson);
        return {
          archetype,
          palette,
          valueProposition: parsed.valueProposition || fallbackDossier.valueProposition,
          heroHeadline: parsed.heroHeadline || fallbackDossier.heroHeadline,
          heroSubtitle: parsed.heroSubtitle || fallbackDossier.heroSubtitle,
          manifestoExcerpt: parsed.manifestoExcerpt || fallbackDossier.manifestoExcerpt,
          curatedPhotos: {
            hero: heroPhoto,
            showcase: showcasePhotos.length > 0 ? showcasePhotos : [heroPhoto],
            ambiance: ambiancePhotos,
          },
          serviceIdeas: (parsed.serviceIdeas || []).map((s: any, idx: number) => ({
            title: s.title,
            subtitle: s.subtitle,
            priceHint: s.priceHint,
            badge: s.badge,
            photoUrl: showcasePhotos[idx] || heroPhoto,
          })),
          superPrompt: parsed.superPrompt || fallbackDossier.superPrompt,
        };
      }
    } catch (err) {
      console.warn("[IdeationEngine] Erro ao consultar Gemini 3.8 Flash, usando fallback:", err);
    }

    return fallbackDossier;
  });

/**
 * 2. Gera o site final no banco a partir do Dossiê aprovado pelo usuário
 */
export const createSiteFromIdeationDossierFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      businessName: string;
      niche: string;
      city: string;
      whatsapp?: string;
      address?: string;
      rating?: number;
      templateId?: string;
      archetype?: string;
      dossier: IdeationDossier;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { dossier } = data;
    const chosenArchetype = (data.archetype || dossier.archetype) as any;
    const chosenTemplateId = data.templateId || "cinematic-glass";

    const slugBase = (data.businessName || "pagina")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalSlug = `${slugBase}-${randomSuffix}`;

    const cleanWhatsapp = (data.whatsapp || "").replace(/\D/g, "");

    // Monta o CinematicPageData com base estrita no Dossiê
    const cinematicData: CinematicPageData = {
      businessName: data.businessName,
      niche: data.niche,
      whatsapp: cleanWhatsapp,
      address: data.address || `${data.city}, Brasil`,
      rating: data.rating || 4.9,
      openingHours: "Segunda a Sábado com horário marcado",
      archetype: chosenArchetype,
      theme: {
        bg: dossier.palette.bg,
        accent: dossier.palette.accent,
        secondaryAccent: dossier.palette.secondaryAccent,
        fontHeading: dossier.palette.fontHeading as any,
        parallaxEnabled: true,
        borderStyle: dossier.palette.borderStyle,
        archetype: chosenArchetype,
      },
      hero: {
        title: dossier.heroHeadline,
        subtitle: dossier.heroSubtitle,
        tagline: dossier.valueProposition.toUpperCase(),
        floatingBadge: `★ ${data.rating ?? 4.9} NO GOOGLE`,
        backgroundImage: dossier.curatedPhotos.hero,
        ctaText: "Pedir pelo WhatsApp",
        ctaLink: `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
          `Olá! Vim pelo site da ${data.businessName} e gostaria de informações.`,
        )}`,
      },
      marquee: [
        { id: "m1", text: dossier.valueProposition, icon: "⚡" },
        { id: "m2", text: `Nota ${data.rating ?? 4.9} no Google`, icon: "★" },
        { id: "m3", text: "Atendimento com Hora Marcada", icon: "💎" },
        { id: "m4", text: "Acabamento de Alta Fidelidade", icon: "🔥" },
      ],
      bentoGrid: [
        {
          id: "b1",
          title: "Autoridade Local",
          subtitle: `Referência em ${data.city}`,
          description: dossier.manifestoExcerpt,
          size: "large",
          metric: `${data.rating ?? 4.9}★`,
          badge: "Google Verificado",
        },
        {
          id: "b2",
          title: "Atendimento VIP",
          subtitle: "Sem esperas",
          description: "Organização pontual pensada para valorizar a sua rotina.",
          size: "medium",
          metric: "100%",
          badge: "Pontualidade",
        },
        {
          id: "b3",
          title: "Reserva Descomplicada",
          subtitle: "Direto no WhatsApp",
          description: "Tire dúvidas e confirme seu pedido em poucos toques.",
          size: "small",
          metric: "24/7",
          badge: "WhatsApp",
        },
      ],
      manifesto: {
        headline: "Nossa Filosofia de Trabalho",
        bodyText: dossier.manifestoExcerpt,
        quote: dossier.valueProposition,
        author: data.businessName,
      },
      highlights: (dossier.serviceIdeas || []).map((s, idx) => ({
        id: `h_${idx + 1}`,
        title: s.title,
        subtitle: s.subtitle,
        description: s.subtitle,
        price: s.priceHint,
        duration: "Consulte opções",
        badge: s.badge,
        imageUrl: s.photoUrl || dossier.curatedPhotos.hero,
        features: ["Qualidade assegurada", "Atendimento exclusivo", "Sem taxas extras"],
      })),
      gallery: dossier.curatedPhotos.showcase.map((url, idx) => ({
        id: `g_${idx + 1}`,
        title: `${data.businessName} #${idx + 1}`,
        subtitle: data.niche,
        imageUrl: url,
      })),
      faq: [
        {
          question: "Como funciona o agendamento ou pedido?",
          answer:
            "Você pode clicar em qualquer botão para ser atendido diretamente no nosso WhatsApp oficial com prioridade.",
        },
        {
          question: "Onde vocês estão localizados?",
          answer: `Nosso endereço é ${data.address || `em ${data.city}`}. Atendemos com todo conforto e segurança.`,
        },
      ],
    };

    // Salva no banco de dados Supabase na tabela bio_pages
    const { data: page, error } = await supabase
      .from("bio_pages")
      .insert({
        user_id: context.userId,
        slug: finalSlug,
        display_name: data.businessName,
        bio: dossier.heroSubtitle,
        whatsapp: cleanWhatsapp,
        address: data.address || `${data.city}, Brasil`,
        niche: data.niche,
        city: data.city,
        state: "BR",
        google_rating: data.rating || 4.9,
        google_reviews_count: 120,
        published: true,
        template_id: chosenTemplateId,
        background_style: "cinematic",
        social_links: {
          is_demo: false,
          archetype: chosenArchetype,
          theme: {
            ...dossier.palette,
            archetype: chosenArchetype,
          },
          custom_theme: {
            bg: dossier.palette.bg,
            accent: dossier.palette.accent,
            archetype: chosenArchetype,
          },
          cinematicData,
        } as any,
      })
      .select()
      .single();

    if (error) {
      console.error("[createSiteFromIdeationDossierFn] Erro ao salvar página:", error);
      throw new Error(`Falha ao salvar página: ${error.message}`);
    }

    // Cria também os itens de catálogo / destaques na tabela de links/itens
    if (page?.id && dossier.serviceIdeas.length > 0) {
      try {
        const linksToInsert = dossier.serviceIdeas.map((s, idx) => ({
          bio_page_id: page.id,
          title: s.title,
          url: `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
            `Olá! Gostaria de saber mais sobre ${s.title} (${s.priceHint}).`,
          )}`,
          position: idx,
          active: true,
        }));
        await supabase.from("bio_links").insert(linksToInsert as any);

        // Alimenta também a tabela de catálogo para delivery e loja
        const catalogItemsToInsert = dossier.serviceIdeas.map((s) => {
          const rawPrice = parseFloat(s.priceHint.replace(/[^\d,.-]/g, "").replace(",", "."));
          return {
            bio_page_id: page.id,
            title: s.title,
            description: s.subtitle,
            price: isNaN(rawPrice) ? 0 : rawPrice,
            image_url: s.photoUrl || dossier.curatedPhotos.hero,
            category: s.badge || "Destaques",
            active: true,
          };
        });
        await supabase.from("catalog_items" as any).insert(catalogItemsToInsert);
      } catch (errLinks) {
        console.warn("[createSiteFromIdeationDossierFn] Aviso ao salvar itens secundários:", errLinks);
      }
    }

    return {
      success: true,
      pageId: page.id,
      slug: page.slug,
      url: `/p/${page.slug}`,
    };
  });
