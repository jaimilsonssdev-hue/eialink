/**
 * enrichAndParseScrapedData.ts
 * 
 * Função integradora do ecossistema Lovable / EiaLink.
 * Transforma dados brutos extraídos do Google (Google Maps, Google Places, Jina Reader)
 * no formato JSON estrito dos BioLinks Cinematográficos AAA (BioLinkConfig).
 * 
 * Regras implementadas:
 * 1. Inteligência de Nicho (Bento, Glassmorphism, Minimal)
 * 2. Paletas de Cores Inteligentes por Nicho
 * 3. Tratamento de Imagens e Garante-Design (Avatar + Foto de Fundo com Blur)
 * 4. Auto-Preenchimento de Serviços e Grid Bento Assimétrico (col-span-1 / col-span-2)
 * 5. Botões de Conversão Fixos (WhatsApp Oficial Destaque + Rotas + Redes)
 */

import type {
  BioLinkConfig,
  ConteudoPerfil,
  LinkItem,
  TokensDesign,
  ConfiguracoesIntegracao,
} from "@/pages/BioLinkView";
import { detectNicheKey, getPresetForCompany, getSignatureHeroArchitectureForNiche, NICHE_GALLERIES } from "./nichePresets";
import { extractBrazilianPhone, normalizeName, normalizePhone, stripAccents } from "./scoring";
import { formatPrice, parsePrice } from "@/lib/utils";

export interface GoogleRawDataInput {
  name?: string;
  empresa?: string;
  title?: string;
  companyName?: string;
  displayName?: string;
  niche?: string;
  category?: string;
  categoria?: string;
  types?: string[] | string;
  phone?: string;
  whatsapp?: string;
  telefone?: string;
  formatted_phone_number?: string;
  photos?: (string | { url?: string })[];
  fotos?: string[];
  images?: string[];
  google_photos?: string[];
  avatar_url?: string;
  avatar?: string;
  foto_hero?: string;
  cover_url?: string;
  foto_secundaria?: string;
  address?: string;
  endereco?: string;
  city?: string;
  cidade?: string;
  state?: string;
  rating?: number | string;
  reviews_count?: number | string;
  reviewsCount?: number | string;
  avaliacoes?: number | string;
  website?: string;
  site?: string;
  instagram?: string;
  description?: string;
  bio?: string;
  about?: string;
  services?: Array<{ name?: string; title?: string; price?: number; description?: string; icon?: string }> | string[];
  servicos?: Array<{ name?: string; title?: string; price?: number; description?: string; icon?: string }> | string[];
  subcategories?: string[];
  products?: Array<{ name?: string; title?: string; price?: number; description?: string; icon?: string }> | string[];
  produtos?: Array<{ name?: string; title?: string; price?: number; description?: string; icon?: string }> | string[];
  id?: string;
  uuid_cliente?: string;
  cid?: string;
}

/**
 * Filtra e normaliza URLs de imagens do Google Maps em alta resolução.
 */
function cleanAndExtractPhotos(rawData: GoogleRawDataInput): string[] {
  const photoCandidates: string[] = [];

  const addCandidate = (val: unknown) => {
    if (!val) return;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("http")) photoCandidates.push(trimmed);
    } else if (typeof val === "object" && val !== null && "url" in val) {
      const u = (val as { url?: unknown }).url;
      if (typeof u === "string" && u.startsWith("http")) photoCandidates.push(u.trim());
    }
  };

  if (Array.isArray(rawData.photos)) rawData.photos.forEach(addCandidate);
  if (Array.isArray(rawData.fotos)) rawData.fotos.forEach(addCandidate);
  if (Array.isArray(rawData.images)) rawData.images.forEach(addCandidate);
  if (Array.isArray(rawData.google_photos)) rawData.google_photos.forEach(addCandidate);
  if (rawData.foto_hero) addCandidate(rawData.foto_hero);
  if (rawData.foto_secundaria) addCandidate(rawData.foto_secundaria);
  if (rawData.cover_url) addCandidate(rawData.cover_url);
  if (rawData.avatar_url) addCandidate(rawData.avatar_url);

  const blockedPatterns = [
    "/a/",
    "/a-/",
    "/al/",
    "default_user",
    "mapslogo",
    "photo.jpg",
    "contrib",
    "profile_photos",
    "result-no-thumbnail",
    "=s32",
    "=s40",
    "=s48",
    "=s64",
    "=w36",
    "=w48",
    "tactile",
  ];

  const seen = new Set<string>();
  const cleanUrls: string[] = [];

  for (const url of photoCandidates) {
    if (blockedPatterns.some((bad) => url.includes(bad))) continue;

    let elevatedUrl = url;
    if (url.includes("googleusercontent.com")) {
      elevatedUrl = url.replace(/=w\d+.*$/, "=w1200-h800-k-no");
      if (!elevatedUrl.includes("=w1200")) {
        elevatedUrl = `${elevatedUrl}=w1200-h800-k-no`;
      }
    } else if (url.includes("streetviewpixels-pa.googleapis.com")) {
      elevatedUrl = url.replace(/&w=\d+&h=\d+/, "&w=1200&h=800");
    }

    if (!seen.has(elevatedUrl)) {
      seen.add(elevatedUrl);
      cleanUrls.push(elevatedUrl);
    }
  }

  return cleanUrls;
}

/**
 * Transforma os dados brutos capturados no Google no contrato estrito BioLinkConfig.
 */
export function enrichAndParseScrapedData(googleRawData: any): BioLinkConfig {
  const raw: GoogleRawDataInput = googleRawData || {};

  // 1. Sanitização do Nome da Empresa
  const candidateName =
    raw.name ||
    raw.empresa ||
    raw.title ||
    raw.companyName ||
    raw.displayName ||
    "Empresa Parceira";

  const cleanCompanyName = normalizeName(
    candidateName
      .replace(/\s*[-–|]\s*(?:Matriz|Filial|Teixeira de Freitas|BA|SP|RJ|MG|DF|Brasil|Oficial).*/gi, "")
      .trim()
  ) || candidateName.trim();

  // 2. Inteligência de Nicho (Seleção Automática de Design)
  const categoryTerms = [
    raw.category,
    raw.categoria,
    raw.niche,
    Array.isArray(raw.types) ? raw.types.join(" ") : raw.types,
    cleanCompanyName,
  ]
    .filter(Boolean)
    .join(" ");

  const normalizedCategory = stripAccents(categoryTerms.toLowerCase());

  // Macro-famílias visuais:
  const isBentoNiche =
    /restaurante|lanchonete|burguer|burger|hamburguer|doceria|confeitaria|cafeteria|cafe|bar\b|pub|bistrot|pizzaria|pizza|sushi|comida|gastronom|delivery|moda|store|loja|roupas|calcados|boutique|calcado|acessorios|otica|joalheria|presentes|petshop|sorveteria|acai|acougue|bebidas|adega|distribuidora/i.test(
      normalizedCategory
    );

  const isGlassNiche =
    /psicologo|psicologa|clinica|odontologia|dentista|odonto|medica|medico|estetico|estetica|spa\b|salao|cabeleireiro|barbearia|beleza|massagem|fisioterapia|nutricionista|nutricao|dermatologia|podologia|terapia|pilates|saude|hospital|laboratorio|biomedic/i.test(
      normalizedCategory
    );

  const isMinimalNiche =
    /advogado|advocacia|juridico|direito|oab|contabilidade|contador|escritorio|engenharia|consultoria|corretor|imobiliaria|imoveis|arquitetura|arquiteto|financeiro|seguros|assessoria|despachante|tecnologia|software|informatica|energia\s*solar/i.test(
      normalizedCategory
    );

  let estiloLayout: "bento" | "glassmorphism" | "minimal" = "glassmorphism";
  let layoutEsqueleto: "list_vertical_premium" | "bento_grid" = "list_vertical_premium";

  if (isBentoNiche) {
    estiloLayout = "bento";
    layoutEsqueleto = "bento_grid";
  } else if (isMinimalNiche) {
    estiloLayout = "minimal";
    layoutEsqueleto = "list_vertical_premium";
  } else if (isGlassNiche) {
    estiloLayout = "glassmorphism";
    layoutEsqueleto = "list_vertical_premium";
  } else {
    // Fallback inteligente pelo niche canonical
    const canonicalKey = detectNicheKey(raw.category || raw.niche, cleanCompanyName);
    if (["delivery", "restaurante", "sorveteria", "loja", "bebidas"].includes(canonicalKey)) {
      estiloLayout = "bento";
      layoutEsqueleto = "bento_grid";
    } else if (["advocacia", "contabilidade", "imobiliaria", "arquitetura", "energia_solar"].includes(canonicalKey)) {
      estiloLayout = "minimal";
      layoutEsqueleto = "list_vertical_premium";
    } else {
      estiloLayout = "glassmorphism";
      layoutEsqueleto = "list_vertical_premium";
    }
  }

  // 3. Paletas de Cores Inteligentes Conforme o Nicho
  let corDestaque = "#0EA5E9";
  let corGrad1 = "#070F1E";
  let corGrad2 = "#0E2338";
  let corFundoCard = "rgba(15, 23, 42, 0.65)";
  let corBorda = "rgba(14, 165, 233, 0.25)";
  let corTexto = "#F8FAFC";
  let raioBorda = "1.25rem";

  if (estiloLayout === "glassmorphism") {
    // Sub-divisão entre Saúde/Clínicas vs Estética/VIP/Beleza
    const isBeautyVip = /estet|beleza|salao|spa|nail|unha|sobrancelha|cabelo|harmoniz|massagem/i.test(normalizedCategory);
    if (isBeautyVip) {
      // Tons de Dourado Nobre / Rosé / Preto Absoluto
      corDestaque = "#FEF08A"; // Dourado Nobre Champagne
      corGrad1 = "#090A0C"; // Preto Absoluto
      corGrad2 = "#18181B"; // Dark Slate
      corFundoCard = "rgba(24, 24, 27, 0.75)";
      corBorda = "rgba(254, 240, 138, 0.28)";
      corTexto = "#FFFBEB";
      raioBorda = "1.25rem";
    } else {
      // Clínicas / Saúde: Azul / Verde Soft
      const isGreenHealth = /nutri|fisioter|pilates|natural/i.test(normalizedCategory);
      corDestaque = isGreenHealth ? "#10B981" : "#0EA5E9";
      corGrad1 = "#070F1E";
      corGrad2 = isGreenHealth ? "#06231A" : "#0E2338";
      corFundoCard = "rgba(15, 23, 42, 0.65)";
      corBorda = isGreenHealth ? "rgba(16, 185, 129, 0.25)" : "rgba(14, 165, 233, 0.25)";
      corTexto = "#F8FAFC";
      raioBorda = "1.25rem";
    }
  } else if (estiloLayout === "bento") {
    // Delivery / Lojas: Tons vibrantes de Laranja Sunset, Vermelho ou Roxo Tech
    const isModaStore = /moda|store|loja|roupa|calcado|boutique|acessorio|joia|biju/i.test(normalizedCategory);
    if (isModaStore) {
      corDestaque = "#8B5CF6"; // Roxo Tech
      corGrad1 = "#09080F";
      corGrad2 = "#1F1138";
      corFundoCard = "rgba(22, 17, 36, 0.70)";
      corBorda = "rgba(139, 92, 246, 0.25)";
      corTexto = "#F8FAFC";
      raioBorda = "1.25rem";
    } else {
      // Comida / Gastronomia / Burguer / Pizzaria
      const isPizzaRed = /pizza|carne|churrasco/i.test(normalizedCategory);
      corDestaque = isPizzaRed ? "#EF4444" : "#F97316"; // Laranja Quente ou Vermelho Rubi
      corGrad1 = "#0C0A09";
      corGrad2 = isPizzaRed ? "#2A0E0E" : "#281206";
      corFundoCard = "rgba(28, 25, 23, 0.70)";
      corBorda = isPizzaRed ? "rgba(239, 68, 68, 0.25)" : "rgba(249, 115, 22, 0.25)";
      corTexto = "#FAFAF9";
      raioBorda = "1.25rem";
    }
  } else {
    // Minimal: Advocacia, Contabilidade, Engenharia
    corDestaque = "#38BDF8"; // Azul Corporativo Moderno
    corGrad1 = "#0B0F17";
    corGrad2 = "#111827";
    corFundoCard = "rgba(17, 24, 39, 0.75)";
    corBorda = "rgba(255, 255, 255, 0.12)";
    corTexto = "#F9FAFB";
    raioBorda = "0.875rem";
  }

  // 4. Tratamento de Imagens e Garante-Design
  const cleanPhotos = cleanAndExtractPhotos(raw);
  const canonicalNiche = detectNicheKey(raw.category || raw.niche, cleanCompanyName);
  const nicheGallery = NICHE_GALLERIES[canonicalNiche];

  let avatarUrl = cleanPhotos[0] || raw.avatar_url || raw.avatar || raw.foto_hero;
  if (!avatarUrl && nicheGallery?.avatars?.[0]?.url) {
    avatarUrl = nicheGallery.avatars[0].url;
  }

  let imagemFundo: string | undefined = undefined;
  let tipoFundo: "mesh_gradient" | "imagem_url" | "solido" = "mesh_gradient";

  // Se houver fotos adicionais do local no Google, injeta a melhor em fundo_valores.imagem_url
  if (cleanPhotos.length > 1) {
    imagemFundo = cleanPhotos[1];
    tipoFundo = "imagem_url";
  } else if (raw.foto_secundaria) {
    imagemFundo = raw.foto_secundaria;
    tipoFundo = "imagem_url";
  } else if (raw.cover_url && !raw.cover_url.includes("template-assets")) {
    imagemFundo = raw.cover_url;
    tipoFundo = "imagem_url";
  }

  // 5. Normalização do Telefone & Botão de Conversão WhatsApp
  const rawPhone =
    raw.whatsapp ||
    raw.phone ||
    raw.telefone ||
    raw.formatted_phone_number ||
    extractBrazilianPhone(raw.address) ||
    extractBrazilianPhone(raw.description);

  const normalizedPhoneDigits = normalizePhone(rawPhone);
  const whatsappUrl = normalizedPhoneDigits
    ? `https://wa.me/${normalizedPhoneDigits}?text=${encodeURIComponent(
        `Olá! Encontrei o perfil de ${cleanCompanyName} e gostaria de mais informações.`
      )}`
    : `https://wa.me/55?text=${encodeURIComponent(`Olá! Gostaria de falar com ${cleanCompanyName}.`)}`;

  const links: LinkItem[] = [];

  // Botão Fixo de Destaque (WhatsApp Oficial)
  links.push({
    titulo: "Fale Conosco no WhatsApp",
    subtitulo: "Atendimento imediato e orçamentos",
    url: whatsappUrl,
    icone: "💬",
    destacado: true,
    tamanho_bento: "col-span-2",
  });

  // 6. Popular Serviços e Produtos Automaticamente
  const rawServicesList: Array<{ name: string; price?: number; description?: string }> = [];

  const addServiceCandidate = (item: any) => {
    if (!item) return;
    if (typeof item === "string" && item.trim().length > 1) {
      rawServicesList.push({ name: item.trim() });
    } else if (typeof item === "object") {
      const name = item.name || item.title || item.nome;
      if (name && typeof name === "string") {
        rawServicesList.push({
          name: name.trim(),
          price: parsePrice(item.price) ?? undefined,
          description: typeof item.description === "string" ? item.description : undefined,
        });
      }
    }
  };

  if (Array.isArray(raw.services)) raw.services.forEach(addServiceCandidate);
  if (Array.isArray(raw.servicos)) raw.servicos.forEach(addServiceCandidate);
  if (Array.isArray(raw.subcategories)) raw.subcategories.forEach(addServiceCandidate);
  if (Array.isArray(raw.products)) raw.products.forEach(addServiceCandidate);
  if (Array.isArray(raw.produtos)) raw.produtos.forEach(addServiceCandidate);

  // Se não vieram serviços nos dados brutos do scraper, busca do preset curado do nicho
  if (rawServicesList.length === 0) {
    const preset = getPresetForCompany(canonicalNiche, cleanCompanyName);
    if (preset.services && preset.services.length > 0) {
      preset.services.forEach((s) => {
        rawServicesList.push({
          name: s.name,
          price: parsePrice(s.price) ?? undefined,
          description: s.description,
        });
      });
    }
  }

  // Mapeia serviços para links com alternância assimétrica Bento (col-span-1 e col-span-2)
  rawServicesList.slice(0, 6).forEach((svc, idx) => {
    // Padrão visual bento assimétrico:
    // Posição 0 (WhatsApp): col-span-2
    // Item 1: col-span-1, Item 2: col-span-1 (lado a lado)
    // Item 3: col-span-2 (banner de destaque)
    // Item 4: col-span-1, Item 5: col-span-1
    const isCol2 = idx % 3 === 2;
    const tamanhoBento: "col-span-1" | "col-span-2" = isCol2 ? "col-span-2" : "col-span-1";

    const priceText = formatPrice(svc.price) ?? undefined;
    const subtitulo = priceText || svc.description || "Clique para solicitar este serviço";

    const serviceWaUrl = normalizedPhoneDigits
      ? `https://wa.me/${normalizedPhoneDigits}?text=${encodeURIComponent(
          `Olá! Gostaria de agendar ou saber mais sobre: ${svc.name}.`
        )}`
      : whatsappUrl;

    links.push({
      titulo: svc.name,
      subtitulo,
      url: serviceWaUrl,
      icone: estiloLayout === "bento" ? "✨" : estiloLayout === "minimal" ? "⚖️" : "⭐",
      destacado: false,
      tamanho_bento: tamanhoBento,
    });
  });

  // 7. Links Auxiliares de Localização, Site e Instagram
  const address = raw.address || raw.endereco;
  if (address && typeof address === "string" && address.trim().length > 3) {
    links.push({
      titulo: "Como Chegar (Localização)",
      subtitulo: address.split(",")[0] || address,
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      icone: "📍",
      destacado: false,
      tamanho_bento: "col-span-2",
    });
  }

  const website = raw.website || raw.site;
  if (website && typeof website === "string" && !/whatsapp|wa\.me|instagram|facebook/i.test(website)) {
    links.push({
      titulo: "Visite Nosso Site Oficial",
      subtitulo: website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      url: website.startsWith("http") ? website : `https://${website}`,
      icone: "🌐",
      destacado: false,
      tamanho_bento: "col-span-1",
    });
  }

  const instagram = raw.instagram;
  if (instagram && typeof instagram === "string" && instagram.trim().length > 1) {
    const handle = instagram.replace("@", "").replace(/https?:\/\/(?:www\.)?instagram\.com\//, "").replace(/\/$/, "");
    links.push({
      titulo: "Siga no Instagram",
      subtitulo: `@${handle}`,
      url: `https://instagram.com/${handle}`,
      icone: "📸",
      destacado: false,
      tamanho_bento: "col-span-1",
    });
  }

  // 8. Título, Subtítulo e Bio Curta
  const city = raw.city || raw.cidade || "";
  const rawRatingNum = typeof raw.rating === "number" ? raw.rating : raw.rating ? parseFloat(String(raw.rating)) : null;
  const rating = rawRatingNum !== null && !isNaN(rawRatingNum) ? rawRatingNum : null;
  const reviewsCount =
    typeof raw.reviews_count === "number"
      ? raw.reviews_count
      : raw.reviewsCount || raw.avaliacoes
        ? parseInt(String(raw.reviewsCount || raw.avaliacoes), 10)
        : null;

  const categoryLabel = raw.category || raw.categoria || "Excelência & Qualidade";
  const subtituloPerfil = city ? `${categoryLabel} • ${city}` : categoryLabel;

  let bioCurta = raw.bio || raw.description || raw.about;
  if (!bioCurta && rating) {
    bioCurta = `⭐ ${rating.toFixed(1)} no Google (${reviewsCount || 10}+ avaliações) • Atendimento com excelência e qualidade garantida.`;
  }

  // 9. Montagem do Objeto BioLinkConfig Estrito
  const config: BioLinkConfig = {
    uuid_cliente: raw.uuid_cliente || raw.id || crypto.randomUUID(),
    configuracoes_integracao: {
      exibir_agenda: false,
      agenda_endpoint_id: "",
      exibir_typebot: false,
      typebot_id: "",
    },
    tokens_design: {
      layout_esqueleto: layoutEsqueleto,
      estilo_layout: estiloLayout,
      hero_architecture: getSignatureHeroArchitectureForNiche(canonicalNiche),
      tipo_fundo: tipoFundo,
      fundo_valores: {
        cor_gradiente_1: corGrad1,
        cor_gradiente_2: corGrad2,
        blur_sobreposicao: "8px",
        imagem_url: imagemFundo,
      },
      estilo_botoes: {
        cor_fundo_card: corFundoCard,
        cor_borda: corBorda,
        cor_texto: corTexto,
        cor_destaque: corDestaque,
        raio_borda: raioBorda,
      },
    },
    conteudo_perfil: {
      avatar_url: avatarUrl,
      hero_image_url: imagemFundo || avatarUrl,
      titulo: cleanCompanyName,
      subtitulo: subtituloPerfil,
      bio_curta: bioCurta,
      categoria: raw.category || raw.categoria || "Excelência & Qualidade",
      cidade: city,
      nota_google: rating ? rating.toFixed(1) : "5.0",
      total_avaliacoes: reviewsCount ? `${reviewsCount}+` : "50+",
      whatsapp_url: whatsappUrl,
      whatsapp_label: "Falar no WhatsApp",
      links,
    },
  };

  return config;
}

