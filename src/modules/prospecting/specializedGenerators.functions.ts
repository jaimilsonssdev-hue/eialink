import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";
import { resolveGeminiApiKeyAsync } from "@/modules/ai/google-ai.service";

export type ProspectNicheCategory = "food" | "shop" | "service";

export interface NicheActionMeta {
  category: ProspectNicheCategory;
  label: string;
  icon: string;
  badgeClass: string;
  buttonLabel: string;
  buttonClass: string;
  loadingLabel: string;
}

export function getProspectNicheCategory(niche?: string | null, name?: string | null): NicheActionMeta {
  const combined = `${niche || ""} ${name || ""}`.toLowerCase();

  // 1. Nicho Gastronomia, Restaurante e Delivery (estilo iFood)
  if (
    /hamburg|burger|pizza|lanche|restaurante|delivery|aça[ií]|acai|pastel|doceria|confeitaria|sorvet|caf[eé]|churrasc|espet|sushi|comida|marmita|gastronom|bar|choperia|padaria|alimento/i.test(
      combined,
    )
  ) {
    return {
      category: "food",
      label: "Cardápio Delivery",
      icon: "🍔",
      badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      buttonLabel: "Gerar Cardápio iFood 🍔",
      buttonClass: "border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
      loadingLabel: "Gerando Cardápio iFood...",
    };
  }

  // 2. Nicho Loja, Varejo, Moda e E-commerce (estilo Vitrine/Catálogo)
  if (
    /loja|roupa|moda|vestu[aá]rio|cal[cç]ado|sapato|boutique|[oó]tica|joia|semijoia|acess[oó]rio|celular|eletr[oô]nic|perfum|cosm[eé]tic|varejo|kids|bijuteria|lingerie|praia|otica/i.test(
      combined,
    )
  ) {
    return {
      category: "shop",
      label: "Catálogo & Loja",
      icon: "🛍️",
      badgeClass: "border-pink-500/40 bg-pink-500/10 text-pink-300",
      buttonLabel: "Gerar Loja 🛍️",
      buttonClass: "border-pink-500/50 bg-pink-500/15 text-pink-300 hover:bg-pink-500/25",
      loadingLabel: "Gerando Loja & Catálogo...",
    };
  }

  // 3. Demais nichos (Clínicas, Consultórios, Serviços, SaaS, etc.)
  return {
    category: "service",
    label: "Site Pro",
    icon: "⚡",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    buttonLabel: "Gerar Site Pro ⚡",
    buttonClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
    loadingLabel: "Gerando Site Pro...",
  };
}

export interface GenerateSpecializedInput {
  companyId?: string;
  businessName: string;
  niche: string;
  city: string;
  whatsapp?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  instagram?: string;
  photos?: string[];
  forceCategory?: ProspectNicheCategory;
}

/**
 * Endpoint de Servidor Dedicado: 'Clicou, Gerou'
 * Identifica o nicho, dispara o gerador especializado correspondente (Cardápio iFood, Loja ou Site Pro)
 * com dados reais, salva na nuvem e retorna a rota pronta.
 */
export const generateSpecializedProspectSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: GenerateSpecializedInput) => input)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const category = data.forceCategory || getProspectNicheCategory(data.niche, data.businessName).category;

    const slugBase = (data.businessName || "pagina")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalSlug = `${slugBase}-${randomSuffix}`;
    const cleanWhatsapp = (data.whatsapp || "").replace(/\D/g, "");
    const destinationAddress = data.address || `${data.city}, Brasil`;
    const encodedAddress = encodeURIComponent(destinationAddress);

    // Resolve chave do Gemini
    let apiKey: string | undefined;
    try {
      const { data: userData } = await supabase.auth.getUser();
      apiKey = userData?.user?.user_metadata?.gemini_api_key;
    } catch {
      // fallback
    }
    if (!apiKey) {
      apiKey = (await resolveGeminiApiKeyAsync()) || undefined;
    }

    let generatedHtml = "";
    let extractedCatalogItems: Array<{
      title: string;
      description: string;
      price: number;
      category: string;
      image_url?: string;
    }> = [];

    const realPhotos = data.photos && data.photos.length > 0 ? data.photos : [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let systemInstruction = "";
        let promptTask = "";

        if (category === "food") {
          systemInstruction = `Você é um Arquiteto Frontend Especialista em Cardápios Digitais e Delivery estilo iFood / Anota AI.
Gere um arquivo HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>) autocontido, ultra responsivo, com Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS OBRIGATÓRIOS DO CARDÁPIO DIGITAL ESTILO IFOOD:
1. Header com banner visual de capa apetitosa, foto de perfil/logo, nome da empresa ("${data.businessName}"), badge "🟢 Aberto Agora", tempo médio ("30 - 45 min"), avaliação ("⭐ ${data.rating ?? 4.9} (${data.reviewsCount ?? 120} avaliações)"), taxa de entrega ("Entrega Grátis ou a partir de R$ 5,00").
2. Navegação Sticky de Categorias com chips deslizáveis (ex: "🍔 Mais Pedidos", "🔥 Combos", "🍟 Porções", "🥤 Bebidas", "🍰 Sobremesas").
3. Lista de itens do cardápio em layout iFood: Card horizontal com imagem apetitosa na direita, título destacado, ingredientes/descrição, preço em destaque verde/âmbar (ex: R$ 34,90), e botão "+ Adicionar".
4. Carrinho de compras reativo funcional em Vanilla JS puro:
   - Adiciona e remove itens com seletor de quantidade (+ / -).
   - Botão flutuante na parte inferior: "🛍️ Ver Sacola (X itens) • R$ XX,XX" que só aparece quando há itens no carrinho.
   - Drawer ou Modal do Carrinho: lista itens, soma subtotal, taxa de entrega, opção de forma de pagamento (Pix, Cartão, Dinheiro), campo de Nome e Endereço, e botão final "Concluir Pedido no WhatsApp".
   - Ao concluir, abre https://wa.me/${cleanWhatsapp}?text=... com mensagem formatada com todos os itens, endereço e total!
5. Seção de Localização com Iframe do Google Maps e botões "Traçar Rota no Google Maps" e "Abrir no Waze".
6. Importante: Adicione a tag <base target="_top"> no <head> para links externos funcionarem.
7. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere o cardápio digital completo estilo iFood para:
Nome: "${data.businessName}"
Nicho: "${data.niche}"
Cidade: "${data.city}"
WhatsApp Oficial: "${cleanWhatsapp}"
Endereço: "${destinationAddress}"
Fotos disponíveis: ${JSON.stringify(realPhotos.slice(0, 5))}`;
        } else if (category === "shop") {
          systemInstruction = `Você é um Arquiteto Frontend Especialista em E-commerce, Lojas e Vitrines de Produtos modernas (estilo Shopify / Zara / Nuvemshop).
Gere um arquivo HTML5 completo (<!DOCTYPE html><html lang="pt-BR">...</html>) autocontido, ultra responsivo, com Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS OBRIGATÓRIOS DA LOJA & VITRINE VIRTUAL:
1. Header elegante com nome da loja ("${data.businessName}"), barra de busca interativa e ícone de Sacola de Compras com contador dinâmico.
2. Hero Banner impactante com chamada de coleção exclusiva e badge "Frete Grátis nas compras acima de R$ 199".
3. Filtro de Categorias em abas (ex: "Novidades", "Mais Vendidos", "Promoção", "Acessórios").
4. Grade de produtos moderna (2 colunas no mobile, 4 no desktop):
   - Imagens com proporção estética e efeito hover zoom.
   - Badges: "🔥 Lançamento", "-20% OFF".
   - Título do produto, preço anterior riscado ("De R$ 159,90") e preço atual ("R$ 119,90"), indicação de parcelamento ("3x sem juros").
   - Botão "Adicionar à Sacola".
5. Sacola de Compras / Carrinho funcional em Vanilla JS:
   - Drawer lateral animado para conferir peças, tamanhos e quantidades.
   - Botão "Finalizar Pedido no WhatsApp" que gera mensagem com lista de itens e total para https://wa.me/${cleanWhatsapp}.
6. Seção de Visite Nossa Loja Física com mapa do Google Maps e botões GPS (Google Maps e Waze).
7. Importante: Adicione a tag <base target="_top"> no <head>.
8. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere a loja e vitrine virtual moderna para:
Nome: "${data.businessName}"
Nicho: "${data.niche}"
Cidade: "${data.city}"
WhatsApp Oficial: "${cleanWhatsapp}"
Endereço: "${destinationAddress}"
Fotos disponíveis: ${JSON.stringify(realPhotos.slice(0, 5))}`;
        } else {
          systemInstruction = `Você é um Arquiteto Frontend Principal do Estúdio Criativo Lovable.
Gere um site institucional cinematográfico, com alta conversão, responsivo, com Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) e Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>).

REQUISITOS:
1. Hero de alto impacto com foto temática, badge de nota ("★ ${data.rating ?? 4.9} no Google") e CTA para WhatsApp.
2. Seção de Serviços / Especialidades em cards modernos.
3. Seção "🗓️ Agendar Horário Online" vinculada ao WhatsApp ou agendamento rápido.
4. Seção de Localização com mapa do Google Maps e botões de GPS Waze e Google Maps.
5. Botão flutuante pulsante de WhatsApp no canto inferior direito.
6. Adicione a tag <base target="_top"> no <head>.
7. Retorne APENAS o código HTML puro, sem markdown e sem explicações.`;

          promptTask = `Gere o site profissional para "${data.businessName}", atuando em ${data.niche} em ${data.city}.
WhatsApp: ${cleanWhatsapp}.
Endereço: ${destinationAddress}.
Fotos: ${JSON.stringify(realPhotos.slice(0, 5))}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            { role: "user", parts: [{ text: `${systemInstruction}\n\n${promptTask}` }] },
          ],
          config: {
            temperature: 0.3,
            thinkingConfig: { thinkingLevel: "low" as any },
          },
        });

        const text = response.text?.trim() || "";
        generatedHtml = text.replace(/^```html\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
      } catch (geminiErr) {
        console.warn("[SpecializedGenerators] Erro na chamada Gemini 3.8 Flash:", geminiErr);
      }
    }

    // Fallback de contingência caso a IA falhe ou não haja chave
    if (!generatedHtml || generatedHtml.length < 100) {
      if (category === "food") {
        generatedHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>Cardápio Digital — ${data.businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-24">
  <div class="relative h-44 sm:h-56 bg-zinc-900 overflow-hidden">
    <img src="${realPhotos[0] || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"}" class="w-full h-full object-cover opacity-60" alt="${data.businessName}">
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
  </div>

  <div class="max-w-xl mx-auto px-4 -mt-16 relative z-10">
    <div class="bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
      <div class="flex items-center gap-2 mb-1">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 Aberto Agora</span>
        <span class="text-xs text-zinc-400">⏱️ 30-45 min</span>
      </div>
      <h1 class="text-2xl font-bold text-white tracking-tight">${data.businessName}</h1>
      <p class="text-xs text-zinc-400 mt-1">${data.niche} · ${destinationAddress}</p>
      <div class="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
        <span class="text-amber-400 font-semibold">★ ${data.rating ?? 4.9} no Google</span>
        <a href="https://wa.me/${cleanWhatsapp}" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">WhatsApp Oficial →</a>
      </div>
    </div>

    <!-- Categorias -->
    <div class="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      <button class="px-3.5 py-1.5 rounded-full bg-amber-500 text-black text-xs font-bold shrink-0">🍔 Mais Pedidos</button>
      <button class="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-medium shrink-0">🍕 Especiais</button>
      <button class="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-medium shrink-0">🍟 Acompanhamentos</button>
      <button class="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-medium shrink-0">🥤 Bebidas</button>
    </div>

    <!-- Pratos do Cardápio -->
    <div class="mt-4 space-y-3">
      <div class="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-white/10 gap-3">
        <div class="flex-1">
          <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Mais Vendido</span>
          <h3 class="font-bold text-sm text-zinc-100 mt-0.5">Especial da Casa</h3>
          <p class="text-xs text-zinc-400 mt-1 line-clamp-2">Preparado artesanalmente com ingredientes selecionados e molho exclusivo.</p>
          <div class="mt-2.5 font-bold text-emerald-400 text-sm">R$ 38,90</div>
        </div>
        <img src="${realPhotos[1] || realPhotos[0] || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"}" class="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10" alt="Prato">
      </div>
      <div class="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-white/10 gap-3">
        <div class="flex-1">
          <h3 class="font-bold text-sm text-zinc-100">Combo Família & Amigos</h3>
          <p class="text-xs text-zinc-400 mt-1 line-clamp-2">Porção generosa para compartilhar com todo sabor e acompanhamentos.</p>
          <div class="mt-2.5 font-bold text-emerald-400 text-sm">R$ 69,90</div>
        </div>
        <img src="${realPhotos[2] || realPhotos[0] || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80"}" class="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10" alt="Combo">
      </div>
    </div>

    <!-- Localização & GPS -->
    <div class="mt-8 p-4 rounded-2xl bg-zinc-900 border border-white/10">
      <h3 class="font-bold text-sm text-zinc-100 mb-2">📍 Onde Estamos</h3>
      <p class="text-xs text-zinc-400 mb-3">${destinationAddress}</p>
      <div class="grid grid-cols-2 gap-2">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" class="py-2 px-3 rounded-xl bg-zinc-800 text-center text-xs font-semibold hover:bg-zinc-700 text-zinc-200">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodedAddress}" class="py-2 px-3 rounded-xl bg-zinc-800 text-center text-xs font-semibold hover:bg-zinc-700 text-cyan-400">Waze</a>
      </div>
    </div>
  </div>

  <!-- Botão Flutuante Pedido WhatsApp -->
  <div class="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-50">
    <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Vim pelo cardápio digital da ${data.businessName} e gostaria de fazer um pedido.`)}" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-500 text-black font-bold text-sm shadow-2xl hover:bg-emerald-400 transition-all">
      <span>Fazer Pedido no WhatsApp</span>
      <span>Abrir Cardápio Completo →</span>
    </a>
  </div>
</body>
</html>`;
      } else {
        generatedHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>${data.businessName} — Vitrine & Loja</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans pb-24">
  <header class="p-4 border-b border-white/10 flex items-center justify-between max-w-2xl mx-auto">
    <div class="font-bold text-lg tracking-tight text-white">${data.businessName}</div>
    <a href="https://wa.me/${cleanWhatsapp}" class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-semibold">Atendimento</a>
  </header>
  <main class="max-w-2xl mx-auto px-4 pt-6 space-y-6">
    <div class="rounded-3xl p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-white/10 text-center space-y-2">
      <span class="text-xs text-pink-400 font-bold uppercase tracking-wider">Coleção em Destaque</span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white">${data.businessName}</h1>
      <p class="text-xs text-zinc-400 max-w-md mx-auto">Os melhores produtos de ${data.niche} em ${data.city} com entrega facilitada.</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
        <img src="${realPhotos[0] || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"}" class="w-full h-36 object-cover rounded-xl" alt="Produto">
        <h3 class="font-bold text-xs text-zinc-200">Destaque da Coleção</h3>
        <p class="text-xs text-emerald-400 font-bold">R$ 119,90</p>
        <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Quero pedir o item Destaque da Coleção da ${data.businessName}.`)}" class="block w-full py-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-black rounded-lg text-center text-xs font-semibold transition-all">Comprar</a>
      </div>
      <div class="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
        <img src="${realPhotos[1] || realPhotos[0] || "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"}" class="w-full h-36 object-cover rounded-xl" alt="Produto">
        <h3 class="font-bold text-xs text-zinc-200">Lançamento Exclusivo</h3>
        <p class="text-xs text-emerald-400 font-bold">R$ 149,90</p>
        <a href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá! Quero pedir o item Lançamento Exclusivo da ${data.businessName}.`)}" class="block w-full py-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-black rounded-lg text-center text-xs font-semibold transition-all">Comprar</a>
      </div>
    </div>
  </main>
</body>
</html>`;
      }
    }

    // Salva a página oficial no banco de dados na tabela bio_pages
    const templateId = category === "food" ? "restaurant-menu" : category === "shop" ? "store-showcase" : "creative-pro";

    const { data: page, error: pageErr } = await supabase
      .from("bio_pages")
      .insert({
        user_id: context.userId,
        slug: finalSlug,
        display_name: data.businessName,
        bio: `${data.niche} em ${data.city}`,
        whatsapp: cleanWhatsapp,
        address: destinationAddress,
        niche: data.niche,
        city: data.city,
        state: "BR",
        google_rating: data.rating || 4.9,
        google_reviews_count: data.reviewsCount || 120,
        published: true,
        template_id: templateId,
        custom_html: generatedHtml,
        background_style: category === "food" ? "warm" : "modern",
        social_links: {
          is_demo: false,
          category,
          photos: realPhotos,
        } as any,
      })
      .select()
      .single();

    if (pageErr) {
      console.error("[generateSpecializedProspectSiteFn] Erro ao salvar página:", pageErr);
      throw new Error(`Falha ao salvar página: ${pageErr.message}`);
    }

    // Se houver lead na prospecção, atualiza notas com a demo gerada
    if (data.companyId) {
      try {
        await supabase
          .from("prospected_companies")
          .update({
            notes: `[Demo Gerada: /p/${finalSlug}] [Modelo: ${templateId}]`,
            status: "contatado" as any,
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", data.companyId);
      } catch (leadErr) {
        console.warn("[generateSpecializedProspectSiteFn] Aviso ao atualizar lead:", leadErr);
      }
    }

    return {
      success: true,
      pageId: page.id,
      slug: page.slug,
      url: `/p/${page.slug}`,
      category,
    };
  });

