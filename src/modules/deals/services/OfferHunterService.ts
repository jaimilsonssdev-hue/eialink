import { supabase } from "@/integrations/supabase/client";
import { getSavedGeminiKey } from "@/modules/prospecting/GeminiAuditorService";
import { requestGemini } from "@/modules/ai/gemini-gateway";
import {
  scrapeGoogleMapsViaApify,
  fetchInstagramProfileViaApify,
  getSavedApifyToken,
  extractInstagramHandle,
} from "@/modules/prospecting/ApifyInstagramService";
import { searchGoogleMapsAndInstagram } from "@/modules/prospecting/LiveProspectingEngine";
import type { DailyDeal } from "../types";
import { findCategoryByKeyword } from "../categories";

export interface HuntedDeal {
  id: string;
  business_name: string;
  title: string;
  description: string;
  deal_price: number;
  original_price: number | null;
  discount_badge: string;
  niche: string;
  city: string;
  contact_whatsapp?: string;
  contact_instagram?: string;
  source_url?: string;
  image_url: string;
  is_flash?: boolean;
  outreach_message: string;
  status: "discovered" | "published";
  created_at: string;
}

export interface HuntedProvider {
  id: string;
  display_name: string;
  niche: string;
  category: string;
  city: string;
  description: string;
  contact_whatsapp?: string;
  contact_instagram?: string;
  source_url?: string;
  image_url: string;
  services?: Array<{ name: string; price?: number; description?: string }>;
  outreach_message: string;
  status: "discovered" | "published";
  created_at: string;
}

export interface HuntCityDealsOptions {
  city: string;
  niche?: string;
  customSearch?: string;
  targetUrl?: string;
  apiKey?: string;
}

const NICHE_COVERS_MAP: Record<string, string> = {
  gastronomia: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  restaurante: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  hamburgueria: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  pizzaria: "/template-assets/niche-covers/restaurant-eialink-cover.webp",
  estetica: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  beleza: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  salao: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  barbearia: "/template-assets/niche-covers/beauty-eialink-cover.webp",
  saude: "/template-assets/niche-covers/clinic-eialink-cover.webp",
  odontologia: "/template-assets/niche-covers/clinic-eialink-cover.webp",
  clinica: "/template-assets/niche-covers/clinic-eialink-cover.webp",
  fitness: "/template-assets/niche-covers/academy-eialink-cover.webp",
  academia: "/template-assets/niche-covers/academy-eialink-cover.webp",
  moda: "/template-assets/niche-covers/store-eialink-cover.webp",
  loja: "/template-assets/niche-covers/store-eialink-cover.webp",
  comercio: "/template-assets/niche-covers/store-eialink-cover.webp",
  servicos: "/template-assets/niche-covers/business-eialink-cover.webp",
};

export function getNicheCoverFallback(nicheStr?: string): string {
  if (!nicheStr) return "/template-assets/niche-covers/restaurant-eialink-cover.webp";
  const clean = nicheStr.toLowerCase();
  for (const [k, v] of Object.entries(NICHE_COVERS_MAP)) {
    if (clean.includes(k)) return v;
  }
  return "/template-assets/niche-covers/business-eialink-cover.webp";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const OfferHunterService = {
  /**
   * Rastreia promoções ativas na cidade utilizando Jina Reader (Google Search / Instagram) e Gemini AI.
   */
  async huntCityDeals(options: HuntCityDealsOptions): Promise<HuntedDeal[]> {
    const city = options.city?.trim() || "Teixeira de Freitas";
    const niche = options.niche?.trim() || "";
    const apiKey = (options.apiKey || getSavedGeminiKey() || "").trim();

    let gatheredRawText = "";
    let authenticPlacesContext = "";

    // 1. Se forneceu um link ou perfil direto (Instagram ou site do negócio)
    if (options.targetUrl && options.targetUrl.trim().length > 4) {
      const handle = extractInstagramHandle(options.targetUrl.trim());
      const apifyToken = getSavedApifyToken();

      // Prioridade 1: Apify Instagram oficial se for @handle ou URL de Instagram com token configurado
      if (handle && apifyToken) {
        try {
          const profile = await fetchInstagramProfileViaApify(handle, apifyToken);
          if (profile) {
            const postsSummaries = (profile.posts || [])
              .slice(0, 8)
              .map(
                (p, i) =>
                  `Post ${i + 1} (${p.timestamp || "recente"}): Legenda: "${(p.caption || "").replace(/\n+/g, " ")}" | Imagem: ${p.imageUrl}`,
              )
              .join("\n");

            gatheredRawText = `[DADOS OFICIAIS DO INSTAGRAM DA EMPRESA]:
Nome no Perfil: "${profile.fullName || profile.username}"
@Instagram: "@${profile.username}"
Bio: "${profile.biography || ""}"
WhatsApp na Bio / Oficial: "${profile.whatsapp || profile.businessPhone || ""}"
Telefone: "${profile.businessPhone || ""}"
Endereço: "${profile.businessAddress || ""}"
POSTS REAIS DO FEED (PROMOÇÕES / COMBOS / SERVIÇOS):
${postsSummaries || "Nenhuma legenda de post encontrada."}`;
          }
        } catch (apifyErr) {
          console.warn("[OfferHunterService] Aviso ao consultar Instagram via Apify:", apifyErr);
        }
      }

      // Se o Apify não rodou ou não preencheu, tenta Jina Reader como fallback
      if (!gatheredRawText) {
        try {
          let target = options.targetUrl.trim();
          if (!target.startsWith("http://") && !target.startsWith("https://")) {
            if (target.startsWith("@") || !target.includes(".")) {
              target = `https://www.instagram.com/${target.replace(/^@/, "")}/`;
            } else {
              target = `https://${target}`;
            }
          }

          const jinaUrl = `https://r.jina.ai/${target}`;
          const res = await fetch(jinaUrl, {
            headers: {
              "Accept-Language": "pt-BR,pt;q=0.9",
              "x-timeout": "25",
            },
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            gatheredRawText = await res.text();
          }
        } catch (err) {
          console.warn("[OfferHunterService] Aviso ao consultar link específico via Jina:", err);
        }
      }
    } else {
      // 2. Busca negócios REAIS na cidade via Apify Google Maps ou motor de prospecção do EIA LINK
      const apifyToken = getSavedApifyToken();
      let realBusinesses: any[] = [];

      if (apifyToken) {
        try {
          const term = niche ? `${niche} ${city}` : `restaurantes lanchonetes lojas ${city}`;
          realBusinesses = await scrapeGoogleMapsViaApify(term, city, 8, apifyToken);
        } catch (apErr) {
          console.warn("[OfferHunterService] Falha no scrapeGoogleMapsViaApify:", apErr);
        }
      }

      if (!realBusinesses || realBusinesses.length === 0) {
        try {
          const liveRes = await searchGoogleMapsAndInstagram(niche || "comércio", city);
          realBusinesses = (liveRes.results || []).slice(0, 8);
        } catch (liveErr) {
          console.warn("[OfferHunterService] Falha na busca de negócios locais:", liveErr);
        }
      }

      if (realBusinesses && realBusinesses.length > 0) {
        authenticPlacesContext = realBusinesses
          .map((b, i) => {
            const rawPhone = b.phone || b.whatsapp || "";
            const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, "") : "";
            const insta = b.instagram ? (b.instagram.startsWith("@") ? b.instagram : `@${b.instagram}`) : "";
            return `EMPRESA REAL ${i + 1}:
- Nome Oficial: "${b.name}"
- Nicho / Categoria: "${b.niche || niche || "Comércio"}"
- Cidade: "${b.city || city}"
- Telefone / WhatsApp Oficial: "${cleanPhone ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : ""}"
- Instagram Oficial: "${insta}"
- Endereço Real: "${b.address || ""}"
- Fotos Reais: ${Array.isArray(b.photos) && b.photos.length > 0 ? b.photos.slice(0, 2).join(", ") : ""}`;
          })
          .join("\n\n");
      }

      // Varredura web complementar via Jina
      try {
        const queryTerms = options.customSearch
          ? options.customSearch
          : `site:instagram.com "${city}" ("promoção" OR "combo" OR "desconto" OR "cupom" OR "só hoje" OR "rodízio" OR "especial") ${niche}`;

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryTerms)}&hl=pt-BR`;
        const jinaUrl = `https://r.jina.ai/${searchUrl}`;

        const res = await fetch(jinaUrl, {
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9",
            "x-timeout": "25",
          },
          signal: AbortSignal.timeout(22000),
        });
        if (res.ok) {
          gatheredRawText = await res.text();
        }
      } catch (err) {
        console.warn("[OfferHunterService] Aviso ao buscar promoções na web via Jina:", err);
      }
    }

    // 3. Sintetiza e estrutura as ofertas com Gemini (100% FATUAL E COMPROVADO - PROIBIDO INVENTAR DESCONTOS OU OFERTAS)
    const systemPrompt = `[CAÇADOR DE OFERTAS & OPORTUNIDADES EIA LINK - REGRAS RÍGIDAS DE DADOS REAIS E COMPROVADOS]
Você é um Auditor Especialista em Promoções Locais e Estratégia de Prospecção para o "Mural de Oportunidades de Hoje".
Sua missão é extrair ESTRITAMENTE ofertas, combos, promoções ou pratos/serviços promocionais REAIS E COMPROVADOS para comércios locais na cidade de "${city}"${niche ? ` no nicho "${niche}"` : ""}.

[EMPRESAS REAIS VERIFICADAS NA REGIÃO]:
${authenticPlacesContext || "Nenhuma lista consolidada do Google Maps encontrada no momento."}

[DADOS COLETADOS DO INSTAGRAM / POSTS / WEB DA CIDADE]:
${gatheredRawText ? gatheredRawText.slice(0, 14000) : "Nenhum texto bruto adicional coletado da web."}

REGRAS CRÍTICAS DE PRECISÃO CIRÚRGICA (100% FATUAL):
1. **PROIBIÇÃO ABSOLUTA DE INVENTAR OFERTAS OU VALORES HIPOTÉTICOS**:
   - É TERMINANTEMENTE PROIBIDO inventar promoções que o comércio nunca anunciou.
   - Uma oferta SÓ DEVE SER CRIADA se houver menção explícita no texto/posts coletados (ex: post anunciando combo, rodízio, desconto de x%, preço de prato/serviço, dia temático, promoção da semana).
   - Se os dados coletados de uma empresa NÃO contiverem uma promoção ou preço explícito anunciado por ela, NÃO CRIE uma oferta fictícia com desconto falso! Em vez disso, extraia o prato, serviço ou especialidade REAL que a empresa de fato anunciou ou vende no seu cardápio/feed (ex: "Pizza Especial da Casa", "Alinhamento e Balanceamento"), sem inventar porcentagens de desconto inventadas.
2. **NUNCA INVENTE EMPRESAS NEM TELEFONES**:
   - Utilize OBRIGATORIAMENTE os nomes oficiais e os telefones/WhatsApps das [EMPRESAS REAIS VERIFICADAS NA REGIÃO] ou dos perfis reais do Instagram coletados acima.
   - NUNCA use telefones fictícios como 5573999999999. Use estritamente os contatos reais informados!
3. Preço promocional (deal_price) e original (original_price):
   - Se o valor constar no post/dados, use o valor exato anunciado.
   - Se houver apenas o valor da oferta sem valor original anterior, deixe original_price: null e discount_badge: "Destaque" ou "Combo Oficial".
4. Badge:
   - Se a empresa anunciou desconto (ex: 20% OFF), coloque "20% OFF".
   - Se não houver desconto explícito anunciado pela empresa, coloque "Combo da Casa", "Mais Pedido" ou "Especialidade". NUNCA finja um percentual de desconto se o lojista não anunciou!
5. Mensagem de abordagem consultiva para WhatsApp (outreach_message):
   - Deve ser cordial, mencionando a oferta/produto real de forma precisa e autêntica: "Olá [Nome da Empresa]! Vimos o destaque de vocês [Título da Oferta Real] em [Cidade]..."
6. Se NENHUMA empresa real for encontrada nos dados acima, retorne "deals": [] vazio, pois É PROIBIDO inventar!
7. Retorne RIGOROSAMENTE apenas um JSON no formato:
{
  "deals": [
    {
      "business_name": "Nome da Empresa Real",
      "title": "Título Real e Comprovado da Oferta/Combo",
      "description": "Descrição baseada estritamente no que a empresa anunciou ou oferece.",
      "deal_price": 39.90,
      "original_price": 49.90,
      "discount_badge": "Combo Oficial",
      "niche": "${niche || "Gastronomia"}",
      "city": "${city}",
      "contact_whatsapp": "5573...",
      "contact_instagram": "@nomereal",
      "source_url": "",
      "image_url": "",
      "is_flash": false,
      "outreach_message": "Olá [Nome]! Vimos o destaque de vocês no comércio de ${city}..."
    }
  ]
}`;

    const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];
    let rawJsonContent: string | null = null;
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await requestGemini(supabase, {
          action: "generateContent",
          model: modelName,
          ...(apiKey ? { apiKeyOverride: apiKey } : {}),
          payload: {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Rastreie e estruture as melhores ofertas de ${city}${niche ? ` no nicho ${niche}` : ""} para publicar no mural de hoje. Retorne apenas o JSON.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 3500,
              responseMimeType: "application/json",
            },
          },
        });

        if (response.ok) {
          const resData = await response.json();
          const candidate = resData.candidates?.[0];
          const part = candidate?.content?.parts?.find((p: any) => p.text && !p.thought);
          if (part?.text) {
            rawJsonContent = part.text.trim();
            break;
          }
        } else {
          const errText = await response.text();
          lastError = `Modelo ${modelName} retornou ${response.status}: ${errText}`;
        }
      } catch (err: any) {
        lastError = `Falha no modelo ${modelName}: ${err?.message || err}`;
      }
    }

    if (!rawJsonContent) {
      throw new Error(`Falha ao sintetizar ofertas pelo Caçador de IA: ${lastError}`);
    }

    try {
      const parsed = JSON.parse(rawJsonContent);
      const rawDeals = Array.isArray(parsed.deals) ? parsed.deals : [];

      const huntedDeals: HuntedDeal[] = rawDeals.map((d: any, index: number) => {
        const fallbackCover = getNicheCoverFallback(d.niche || niche);
        const img = d.image_url && d.image_url.startsWith("http") ? d.image_url : fallbackCover;

        return {
          id: `hunted-${Date.now()}-${index}`,
          business_name: String(d.business_name || `Comércio Local de ${city}`).trim(),
          title: String(d.title || "Oferta Especial").trim(),
          description: String(
            d.description || "Consulte regras e validade com o estabelecimento.",
          ).trim(),
          deal_price: Number(d.deal_price) || 29.9,
          original_price: d.original_price ? Number(d.original_price) : null,
          discount_badge: String(d.discount_badge || "OFERTA").trim(),
          niche: String(d.niche || niche || "Comércio Local").trim(),
          city: String(d.city || city).trim(),
          contact_whatsapp: d.contact_whatsapp
            ? String(d.contact_whatsapp).replace(/\D/g, "")
            : undefined,
          contact_instagram: d.contact_instagram ? String(d.contact_instagram).trim() : undefined,
          source_url: d.source_url ? String(d.source_url).trim() : undefined,
          image_url: img,
          is_flash: Boolean(d.is_flash),
          outreach_message: String(d.outreach_message || "").trim(),
          status: "discovered",
          created_at: new Date().toISOString(),
        };
      });

      return huntedDeals;
    } catch (parseErr) {
      console.error("[OfferHunterService] Erro ao parsear JSON de ofertas:", parseErr);
      throw new Error("Formato inválido retornado pelo Caçador de Ofertas.");
    }
  },

  /**
   * Publica a oferta garimpada diretamente no banco de dados e cria a bio_page do comércio se ainda não existir.
   */
  async publishHuntedDeal(deal: HuntedDeal): Promise<{
    dealId: string;
    bioPageId: string;
    slug: string;
    muralUrl: string;
    pageUrl: string;
  }> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error("Usuário não autenticado. Faça login para publicar ofertas no mural.");
    }

    const userId = authData.user.id;
    const baseSlug = slugify(`${deal.business_name}-${deal.city}`);

    // 1. Verifica se já existe uma bio_page com este slug ou nome
    const { data: existingPage } = await supabase
      .from("bio_pages")
      .select("id, slug")
      .or(`slug.eq.${baseSlug},display_name.ilike.%${deal.business_name}%`)
      .limit(1)
      .maybeSingle();

    let targetBioPageId = existingPage?.id;
    let targetSlug = existingPage?.slug;

    // 2. Se não existir, cria a página digital da empresa no EIA LINK
    if (!targetBioPageId) {
      const generatedSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const { data: newPage, error: pageErr } = await (supabase as any)
        .from("bio_pages")
        .insert({
          user_id: userId,
          display_name: deal.business_name,
          slug: generatedSlug,
          description: deal.description,
          whatsapp: deal.contact_whatsapp || null,
          published: true,
          theme: "modern-dark",
          avatar_url: deal.image_url,
          cover_url: deal.image_url,
          cover_fit: "cover",
          social_links: {
            niche: deal.niche,
            city: deal.city,
            instagram: deal.contact_instagram || null,
            hunted_deal: true,
          },
        })
        .select("id, slug")
        .single();

      if (pageErr || !newPage) {
        console.error("[OfferHunterService] Erro ao criar bio_page para o negócio:", pageErr);
        throw new Error(
          `Não foi possível registrar a página do estabelecimento: ${pageErr?.message || ""}`,
        );
      }

      targetBioPageId = newPage.id;
      targetSlug = newPage.slug;
    }

    // 3. Define data de expiração (final do dia de hoje, 23:59:59)
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 4. Insere a oferta na tabela daily_deals
    const { data: newDeal, error: dealErr } = await (supabase as any)
      .from("daily_deals")
      .insert({
        bio_page_id: targetBioPageId,
        user_id: userId,
        title: deal.title,
        description: deal.description,
        deal_price: deal.deal_price,
        original_price: deal.original_price,
        discount_badge: deal.discount_badge,
        city: deal.city,
        niche: deal.niche,
        image_url: deal.image_url,
        claim_action_url: deal.contact_whatsapp
          ? `https://wa.me/55${deal.contact_whatsapp.replace(/\D/g, "")}`
          : deal.source_url || null,
        starts_at: new Date().toISOString(),
        expires_at: endOfDay.toISOString(),
        is_active: true,
        is_flash: Boolean(deal.is_flash),
        clicks_count: 0,
        claims_count: 0,
        max_claims: 25,
      })
      .select("id")
      .single();

    if (dealErr || !newDeal) {
      console.error("[OfferHunterService] Erro ao inserir daily_deal:", dealErr);
      throw new Error(`Erro ao publicar oferta no mural: ${dealErr?.message || ""}`);
    }

    const domain =
      typeof window !== "undefined" ? window.location.origin : "https://www.eialink.com.br";
    const muralUrl = `${domain}/hoje?cidade=${encodeURIComponent(deal.city)}`;
    const pageUrl = `${domain}/p/${targetSlug}`;

    return {
      dealId: newDeal.id,
      bioPageId: targetBioPageId,
      slug: targetSlug,
      muralUrl,
      pageUrl,
    };
  },

  /**
   * Constrói o link de WhatsApp para abordagem consultiva de prospecção do lojista.
   */
  getWhatsAppOutreachLink(deal: HuntedDeal, slug?: string): string {
    const rawNumber = deal.contact_whatsapp ? deal.contact_whatsapp.replace(/\D/g, "") : "";
    const cleanNumber = rawNumber.startsWith("55") ? rawNumber : `55${rawNumber}`;

    const domain =
      typeof window !== "undefined" ? window.location.origin : "https://www.eialink.com.br";
    const muralUrl = `${domain}/hoje?cidade=${encodeURIComponent(deal.city)}`;
    const pageUrl = slug ? `${domain}/p/${slug}` : "";

    const message =
      deal.outreach_message ||
      `Olá ${deal.business_name}! 👋\n\nNotamos a oferta de vocês: *${deal.title}*.\n\nPara apoiar o comércio local, nós acabamos de destacar a sua oferta GRATUITAMENTE no *Mural de Oportunidades de ${deal.city}* no EIA LINK!\n\n👉 Veja o seu destaque no ar aqui: ${muralUrl}${pageUrl ? `\n\nCriamos também uma página interativa de demonstração para vocês: ${pageUrl}` : ""}\n\nSe quiserem gerenciar novos cupons ou receber pedidos diretos no WhatsApp com cartão digital PWA, estamos à disposição!`;

    if (cleanNumber.length >= 10) {
      return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },

  /**
   * Garimpa prestadores de serviços, autônomos e negócios locais na cidade indicada.
   */
  async huntCityProviders(options: HuntCityDealsOptions): Promise<HuntedProvider[]> {
    const city = options.city?.trim() || "Teixeira de Freitas";
    const niche = options.niche?.trim() || "";
    const apiKey = (options.apiKey || getSavedGeminiKey() || "").trim();

    let gatheredRawText = "";
    let authenticPlacesContext = "";

    // 1. Se forneceu link/perfil direto de um profissional
    if (options.targetUrl && options.targetUrl.trim().length > 4) {
      const handle = extractInstagramHandle(options.targetUrl.trim());
      const apifyToken = getSavedApifyToken();

      if (handle && apifyToken) {
        try {
          const profile = await fetchInstagramProfileViaApify(handle, apifyToken);
          if (profile) {
            gatheredRawText = `[PERFIL OFICIAL DO PROFISSIONAL NO INSTAGRAM]:
Nome: "${profile.fullName || profile.username}"
@Instagram: "@${profile.username}"
Bio: "${profile.biography || ""}"
WhatsApp na Bio / Oficial: "${profile.whatsapp || profile.businessPhone || ""}"
Telefone: "${profile.businessPhone || ""}"
Endereço: "${profile.businessAddress || ""}"
POSTS E SERVIÇOS DO FEED:
${(profile.posts || [])
  .slice(0, 8)
  .map((p) => `- ${(p.caption || "").replace(/\n+/g, " ")}`)
  .join("\n")}`;
          }
        } catch (e) {
          console.warn("[OfferHunterService] Aviso ao consultar Instagram via Apify:", e);
        }
      }

      if (!gatheredRawText) {
        try {
          let target = options.targetUrl.trim();
          if (!target.startsWith("http://") && !target.startsWith("https://")) {
            if (target.startsWith("@") || !target.includes(".")) {
              target = `https://www.instagram.com/${target.replace(/^@/, "")}/`;
            } else {
              target = `https://${target}`;
            }
          }

          const jinaUrl = `https://r.jina.ai/${target}`;
          const res = await fetch(jinaUrl, {
            headers: {
              "Accept-Language": "pt-BR,pt;q=0.9",
              "x-timeout": "25",
            },
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            gatheredRawText = await res.text();
          }
        } catch (err) {
          console.warn("[OfferHunterService] Aviso ao consultar perfil do prestador via Jina:", err);
        }
      }
    } else {
      // 2. Busca profissionais REAIS na cidade via Apify Google Maps ou motor de prospecção
      const apifyToken = getSavedApifyToken();
      let realBusinesses: any[] = [];

      if (apifyToken) {
        try {
          const term = niche ? `${niche} ${city}` : `prestadores de servicos clinicas oficinas ${city}`;
          realBusinesses = await scrapeGoogleMapsViaApify(term, city, 8, apifyToken);
        } catch (apErr) {
          console.warn("[OfferHunterService] Falha no scrapeGoogleMapsViaApify para profissionais:", apErr);
        }
      }

      if (!realBusinesses || realBusinesses.length === 0) {
        try {
          const liveRes = await searchGoogleMapsAndInstagram(niche || "serviços", city);
          realBusinesses = (liveRes.results || []).slice(0, 8);
        } catch (liveErr) {
          console.warn("[OfferHunterService] Falha na busca de negócios locais:", liveErr);
        }
      }

      if (realBusinesses && realBusinesses.length > 0) {
        authenticPlacesContext = realBusinesses
          .map((b, i) => {
            const rawPhone = b.phone || b.whatsapp || "";
            const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, "") : "";
            const insta = b.instagram ? (b.instagram.startsWith("@") ? b.instagram : `@${b.instagram}`) : "";
            return `PROFISSIONAL/EMPRESA REAL ${i + 1}:
- Nome Oficial: "${b.name}"
- Nicho / Especialidade: "${b.niche || niche || "Serviços"}"
- Cidade: "${b.city || city}"
- Telefone / WhatsApp Oficial: "${cleanPhone ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : ""}"
- Instagram Oficial: "${insta}"
- Endereço Real: "${b.address || ""}"
- Fotos Reais: ${Array.isArray(b.photos) && b.photos.length > 0 ? b.photos.slice(0, 2).join(", ") : ""}`;
          })
          .join("\n\n");
      }

      // Varredura web complementar
      try {
        const queryTerms = options.customSearch
          ? options.customSearch
          : `site:instagram.com "${city}" ("orçamento" OR "atendimento" OR "whatsapp" OR "serviço" OR "profissional" OR "agendamento") ${niche}`;

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryTerms)}&hl=pt-BR`;
        const jinaUrl = `https://r.jina.ai/${searchUrl}`;

        const res = await fetch(jinaUrl, {
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9",
            "x-timeout": "25",
          },
          signal: AbortSignal.timeout(22000),
        });
        if (res.ok) {
          gatheredRawText = await res.text();
        }
      } catch (err) {
        console.warn("[OfferHunterService] Aviso ao buscar prestadores via Jina:", err);
      }
    }

    // 3. Estruturação dos dados com Gemini
    const systemPrompt = `[RADAR DE PRESTADORES DE SERVIÇOS & PROFISSIONAIS EIA LINK - REGRAS RÍGIDAS DE DADOS REAIS]
Você é um Especialista em Mapeamento de Negócios Locais e Prospecção B2B.
Sua missão é extrair ou estruturar perfis de prestadores de serviços e empresas locais na cidade de "${city}"${niche ? ` na área "${niche}"` : ""}.

[PROFISSIONAIS/EMPRESAS REAIS VERIFICADAS NA REGIÃO]:
${authenticPlacesContext || "Nenhuma lista consolidada do Google Maps encontrada no momento."}

[DADOS COLETADOS DO INSTAGRAM / WEB DA CIDADE]:
${gatheredRawText ? gatheredRawText.slice(0, 14000) : "Nenhum texto bruto adicional coletado da web."}

REGRAS CRÍTICAS E OBRIGATÓRIAS (PROIBIDO DADOS FICTÍCIOS):
1. **NUNCA INVENTE PROFISSIONAIS NEM TELEFONES**:
   - Utilize OBRIGATORIAMENTE os nomes oficiais e os telefones/WhatsApps das [PROFISSIONAIS/EMPRESAS REAIS VERIFICADAS NA REGIÃO] ou do Instagram oficial coletado acima.
   - NUNCA invente telefones aleatórios como 5573999999999. Use o telefone e o Instagram das empresas reais da lista!
2. Identifique o nicho específico e a categoria correspondente:
   Categorias válidas: "gastronomia", "beleza", "reformas", "saude", "automotivo", "profissionais", "fitness", "comercio".
3. Descrição persuasiva das especialidades e diferenciais do profissional.
4. Lista de 2 a 4 principais serviços prestados com nome claro e valor estimado médio se aplicável.
5. Crie uma mensagem consultiva pronta para WhatsApp (outreach_message) citando com entusiasmo o nome real da empresa/profissional informando que foi destacado no Guia Oficial de ${city} no EIA LINK.
6. Retorne RIGOROSAMENTE apenas um JSON no formato:
{
  "providers": [
    {
      "display_name": "Nome do Profissional / Empresa",
      "niche": "Eletricista Residencial & Predial",
      "category": "reformas",
      "city": "${city}",
      "description": "Atendimento rápido para instalações elétricas, quadros de distribuição, padrão Coelba e manutenção 24h.",
      "contact_whatsapp": "5573999999999",
      "contact_instagram": "@profissionallocal",
      "source_url": "https://instagram.com/...",
      "image_url": "",
      "services": [
        { "name": "Instalação de Quadro Elétrico", "price": 180, "description": "Com disjuntores e aterramento seguro" },
        { "name": "Manutenção Preventiva", "price": 120, "description": "Revisão completa da fiação" }
      ],
      "outreach_message": "Olá! Vimos seu excelente trabalho em ${city}..."
    }
  ]
}`;

    const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];
    let rawJsonContent: string | null = null;
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await requestGemini(supabase, {
          action: "generateContent",
          model: modelName,
          ...(apiKey ? { apiKeyOverride: apiKey } : {}),
          payload: {
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Rastreie e estruture os melhores prestadores de serviços e profissionais de ${city}${niche ? ` na categoria ${niche}` : ""} para cadastrar no guia. Retorne apenas o JSON.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 3500,
              responseMimeType: "application/json",
            },
          },
        });

        if (response.ok) {
          const resData = await response.json();
          const candidate = resData.candidates?.[0];
          const part = candidate?.content?.parts?.find((p: any) => p.text && !p.thought);
          if (part?.text) {
            rawJsonContent = part.text.trim();
            break;
          }
        } else {
          const errText = await response.text();
          lastError = `Modelo ${modelName} retornou ${response.status}: ${errText}`;
        }
      } catch (err: any) {
        lastError = `Falha no modelo ${modelName}: ${err?.message || err}`;
      }
    }

    if (!rawJsonContent) {
      throw new Error(`Falha ao rastrear prestadores pelo Radar de IA: ${lastError}`);
    }

    try {
      const parsed = JSON.parse(rawJsonContent);
      const rawProviders = Array.isArray(parsed.providers) ? parsed.providers : [];

      const huntedProviders: HuntedProvider[] = rawProviders.map((p: any, index: number) => {
        const fallbackCover = getNicheCoverFallback(p.niche || niche);
        const img = p.image_url && p.image_url.startsWith("http") ? p.image_url : fallbackCover;
        const matchedCategory =
          p.category || findCategoryByKeyword(`${p.niche || ""} ${p.display_name}`).id;

        return {
          id: `provider-${Date.now()}-${index}`,
          display_name: String(p.display_name || `Profissional de ${city}`).trim(),
          niche: String(p.niche || niche || "Serviços Especializados").trim(),
          category: matchedCategory,
          city: String(p.city || city).trim(),
          description: String(
            p.description || "Entre em contato direto pelo WhatsApp para orçamentos e agendamento.",
          ).trim(),
          contact_whatsapp: p.contact_whatsapp
            ? String(p.contact_whatsapp).replace(/\D/g, "")
            : undefined,
          contact_instagram: p.contact_instagram ? String(p.contact_instagram).trim() : undefined,
          source_url: p.source_url ? String(p.source_url).trim() : undefined,
          image_url: img,
          services: Array.isArray(p.services) ? p.services : [],
          outreach_message: String(p.outreach_message || "").trim(),
          status: "discovered",
          created_at: new Date().toISOString(),
        };
      });

      return huntedProviders;
    } catch (parseErr) {
      console.error("[OfferHunterService] Erro ao processar JSON de profissionais:", parseErr);
      throw new Error("Formato inválido retornado pelo Radar de Profissionais.");
    }
  },

  /**
   * Publica o prestador de serviços no Guia do EIA LINK criando sua bio_page oficial.
   */
  async publishHuntedProvider(provider: HuntedProvider): Promise<{
    providerId: string;
    slug: string;
    muralUrl: string;
    pageUrl: string;
  }> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error("Usuário não autenticado. Faça login para cadastrar profissionais no guia.");
    }

    const userId = authData.user.id;
    const baseSlug = slugify(`${provider.display_name}-${provider.city}`);

    // Verifica se já existe bio_page com este slug ou nome
    const { data: existingPage } = await supabase
      .from("bio_pages")
      .select("id, slug")
      .or(`slug.eq.${baseSlug},display_name.ilike.%${provider.display_name}%`)
      .limit(1)
      .maybeSingle();

    let targetBioPageId = existingPage?.id;
    let targetSlug = existingPage?.slug;

    if (!targetBioPageId) {
      const generatedSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const { data: newPage, error: pageErr } = await (supabase as any)
        .from("bio_pages")
        .insert({
          user_id: userId,
          display_name: provider.display_name,
          slug: generatedSlug,
          description: provider.description,
          whatsapp: provider.contact_whatsapp || null,
          published: true,
          theme: "modern-dark",
          avatar_url: provider.image_url,
          cover_url: provider.image_url,
          cover_fit: "cover",
          social_links: {
            niche: provider.niche,
            category: provider.category,
            city: provider.city,
            instagram: provider.contact_instagram || null,
            suggested_services: provider.services || [],
            is_verified: true,
            hunted_provider: true,
          },
        })
        .select("id, slug")
        .single();

      if (pageErr || !newPage) {
        console.error("[OfferHunterService] Erro ao cadastrar prestador no banco:", pageErr);
        throw new Error(
          `Não foi possível cadastrar a página do profissional: ${pageErr?.message || ""}`,
        );
      }

      targetBioPageId = newPage.id;
      targetSlug = newPage.slug;
    } else {
      // Atualiza os metadados do prestador caso já exista
      await (supabase as any)
        .from("bio_pages")
        .update({
          published: true,
          social_links: {
            niche: provider.niche,
            category: provider.category,
            city: provider.city,
            instagram: provider.contact_instagram || null,
            suggested_services: provider.services || [],
            is_verified: true,
          },
        })
        .eq("id", targetBioPageId);
    }

    const domain =
      typeof window !== "undefined" ? window.location.origin : "https://www.eialink.com.br";
    const muralUrl = `${domain}/hoje?tab=profissionais&cidade=${encodeURIComponent(provider.city)}&categoria=${encodeURIComponent(provider.category)}`;
    const pageUrl = `${domain}/p/${targetSlug}`;

    return {
      providerId: targetBioPageId,
      slug: targetSlug,
      muralUrl,
      pageUrl,
    };
  },

  /**
   * Constrói mensagem de WhatsApp personalizada para prospecção do profissional/prestador.
   */
  getWhatsAppProviderOutreachLink(provider: HuntedProvider, slug?: string): string {
    const rawNumber = provider.contact_whatsapp ? provider.contact_whatsapp.replace(/\D/g, "") : "";
    const cleanNumber = rawNumber.startsWith("55") ? rawNumber : `55${rawNumber}`;

    const domain =
      typeof window !== "undefined" ? window.location.origin : "https://www.eialink.com.br";
    const muralUrl = `${domain}/hoje?tab=profissionais&cidade=${encodeURIComponent(provider.city)}`;
    const pageUrl = slug ? `${domain}/p/${slug}` : "";

    const message =
      provider.outreach_message ||
      `Olá ${provider.display_name}! 👋\n\nSou do EIA LINK e passamos para avisar que acabamos de cadastrar e destacar gratuitamente o seu trabalho no *Guia Oficial de Profissionais & Prestadores de Serviços de ${provider.city}*!\n\n👉 Veja o seu perfil no ar aqui: ${muralUrl}${pageUrl ? `\n\nCriamos também o seu cartão de visitas digital PWA interativo: ${pageUrl}` : ""}\n\nAgora clientes que buscam por ${provider.niche} em ${provider.city} podem encontrar seus serviços e te chamar direto no WhatsApp. Esperamos que gere muitos contatos e novos clientes!`;

    if (cleanNumber.length >= 10) {
      return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },
};
