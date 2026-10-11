import type { CardapioData, CardapioItem } from "./cardapioAiService";
import { getMotionStyles, renderMarquee } from "../prospecting/skills";

/**
 * Construtor Oficial de Cardápio Digital Estilo iFood (Padrão Zequinha)
 * Gera o HTML completo de alta conversão com:
 * - Capa e Card flutuante sobreposto com logo
 * - Status Aberto Agora + Tempo estimado + Avaliações
 * - Faixa Animada Marquee contínua
 * - Cupom de Boas-Vindas 10% OFF (BEMVINDO10)
 * - Clube de Fidelidade & Pontos integrado com modal de saldo
 * - Carrossel horizontal "Mais Pedidos da Casa" com badge Mais Vendido
 * - Grade de pratos por categoria
 * - Modal 1 estilo iFood com foto grande, adicionais e observações
 * - Modal 2 Sacola de Pedidos com entrega vs retirada e checkout WhatsApp
 * - Modal 3 Consulta do Clube de Fidelidade
 * - Adaptação dinâmica para a cor de fundo escolhida no seletor
 */
export function generateIfoodCardapioHtml(
  cardapio: CardapioData,
  opts?: { slug?: string; isDemo?: boolean }
): string {
  const businessName = cardapio.restaurantName || "Cardápio Digital";
  const cleanWhatsapp = (cardapio.whatsapp || "").replace(/\D/g, "");
  const address = cardapio.address || "Consulte taxa para sua região";
  const tagline = cardapio.tagline || cardapio.description || "O melhor sabor artesanal da região";
  const deliveryFee = cardapio.deliveryFee || "A partir de R$ 5,00";
  const openingHours = cardapio.openingHours || "Terça a Domingo das 18h às 23h30";
  const bgColor = cardapio.backgroundColor || "#09090b";
  const btnColor = cardapio.buttonColor || "#f59e0b";

  function isLightColor(hexColor?: string) {
    if (!hexColor) return false;
    const hex = hexColor.replace("#", "");
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140;
  }

  const isLight = isLightColor(bgColor);

  const coverImage =
    cardapio.bannerImage ||
    cardapio.items[0]?.image ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

  const logoImage =
    cardapio.logoUrl ||
    cardapio.items[1]?.image ||
    cardapio.items[0]?.image ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80";

  // Mapeia os itens para o formato do script cliente
  const items = (cardapio.items || []).map((it, idx) => ({
    title: it.name,
    desc: it.description || "",
    price: Number(it.price) || 0,
    img: it.image || coverImage,
    category: it.category || "Geral",
    badge: it.badge || (it.isPopular ? "Mais Vendido 🏆" : undefined),
    isFeatured: Boolean(it.isPopular || it.badge || idx < 3),
    options: [
      { name: "Bacon Crocante Extra", price: 4.0 },
      { name: "Queijo Cheddar Cremoso Duplo", price: 4.0 },
      { name: "Maionese Defumada Especial", price: 3.5 },
      { name: "Cebola Caramelizada na Chapa", price: 3.0 },
    ],
  }));

  const itemsJson = JSON.stringify(items);

  const featuredItems = items.filter((it, idx) => it.isFeatured || idx < 3);

  const categories = cardapio.categories && cardapio.categories.length > 0
    ? cardapio.categories.map((c) => c.name)
    : ["Todos", "Mais Pedidos", "Burgers Artesanais", "Porções & Fritas", "Bebidas"];

  const customFont = cardapio.customFont || "Inter";
  const fontGoogleUrl = {
    "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
    "Plus Jakarta Sans": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    "Outfit": "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap",
    "Playfair Display": "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Inter:wght@400;600&display=swap",
    "Space Grotesk": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  }[customFont] || "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";

  // Classes dinâmicas de acordo com o efeito visual selecionado
  const visualEffect = cardapio.visualEffect || "glassmorphism";
  let cardClass = "";
  let cardStyle = "";
  if (visualEffect === "neobrutalism") {
    cardClass = "border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5 transition-all";
    cardStyle = isLight ? "background-color: #ffffff; border-color: #000000;" : "background-color: #18181b; border-color: #ffffff; box-shadow: 4px 4px 0px 0px #ffffff;";
  } else if (visualEffect === "glassmorphism") {
    cardClass = "backdrop-blur-xl border rounded-3xl shadow-xl hover:border-amber-500/40 hover:shadow-2xl transition-all";
    cardStyle = isLight ? "background-color: rgba(255,255,255,0.85); border-color: rgba(0,0,0,0.08);" : "background-color: rgba(24,24,27,0.75); border-color: rgba(255,255,255,0.12);";
  } else if (visualEffect === "elegante") {
    cardClass = "border rounded-2xl shadow-xl hover:border-amber-400/60 transition-all";
    cardStyle = isLight ? "background-color: #fafaf9; border-color: rgba(217,119,6,0.3); box-shadow: 0 10px 25px -5px rgba(217,119,6,0.1);" : "background-color: #121214; border-color: rgba(245,158,11,0.25); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.8);";
  } else if (visualEffect === "clean") {
    cardClass = "border rounded-xl shadow-none hover:border-zinc-500 transition-all";
    cardStyle = isLight ? "background-color: #ffffff; border-color: #e4e4e7;" : "background-color: #18181b; border-color: #27272a;";
  } else {
    // Parallax 3D / Dinâmico
    cardClass = "border rounded-3xl shadow-2xl hover:-translate-y-1 hover:shadow-amber-500/10 transition-all duration-300";
    cardStyle = isLight ? "background-color: #ffffff; border-color: rgba(0,0,0,0.08);" : "background-color: #18181b; border-color: rgba(255,255,255,0.1);";
  }

  const marqueePhrases = [
    "🔥 INGREDIENTES FRESCOS SELECIONADOS",
    "🛵 ENTREGA RÁPIDA E EMBALAGEM TÉRMICA",
    "🍔 O SABOR ARTESANAL MAIS ELOGIADO DA CIDADE",
    "🎟️ USE O CUPOM BEMVINDO10 PARA 10% OFF",
    "🎁 ACUMULE PONTOS NO CLUBE DE FIDELIDADE",
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_top">
  <title>Cardápio Digital — ${businessName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontGoogleUrl}" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${getMotionStyles()}
    :root {
      --font-family: '${customFont}', sans-serif;
      --btn-primary: ${btnColor};
    }
    body, h1, h2, h3, h4, button, input, select {
      font-family: var(--font-family);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="text-zinc-100 pb-28 selection:bg-amber-500 selection:text-black" style="background-color: ${bgColor}; color: ${isLight ? "#18181b" : "#f4f4f5"};">
  <!-- Banner de Capa -->
  <div class="relative h-44 sm:h-56 overflow-hidden" style="background-color: #18181b;">
    <img src="${coverImage}" class="w-full h-full object-cover opacity-60" alt="${businessName}">
    <div class="absolute inset-0" style="background-image: linear-gradient(to top, ${bgColor} 0%, rgba(0,0,0,0.4) 60%, transparent 100%);"></div>
  </div>

  <div class="max-w-xl mx-auto px-4 -mt-14 relative z-10 space-y-4">
    <!-- Card Principal do Estabelecimento (Estilo iFood) -->
    <div class="backdrop-blur-md rounded-3xl p-5 border shadow-2xl relative" style="background-color: ${isLight ? "rgba(255,255,255,0.95)" : "rgba(24,24,27,0.95)"}; border-color: ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"};">
      <div class="flex items-center gap-3">
        <div class="w-16 h-16 rounded-2xl border-2 overflow-hidden shadow-xl shrink-0 -mt-10 relative z-20" style="background-color: #27272a; border-color: ${bgColor};">
          <img src="${logoImage}" class="w-full h-full object-cover" alt="Logo">
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">🟢 Aberto Agora</span>
            <span class="text-[11px] opacity-70">⏱️ 30-45 min</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black tracking-tight truncate" style="color: ${isLight ? "#09090b" : "#ffffff"};">${businessName}</h1>
        </div>
      </div>

      <p class="text-xs opacity-70 mt-2.5 leading-relaxed">${tagline} · ${address}</p>

      <div class="mt-3 flex items-center justify-between text-xs pt-3 border-t" style="border-color: ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"};">
        <span class="text-amber-400 font-bold flex items-center gap-1">
          <span>★</span> 4.7 <span class="opacity-60 font-normal">(120 avaliações)</span>
        </span>
        <div class="flex items-center gap-3">
          <span class="text-emerald-400 font-semibold flex items-center gap-1">🛵 Entrega ${deliveryFee}</span>
          <a href="https://wa.me/${cleanWhatsapp}" target="_blank" class="opacity-80 hover:opacity-100 hover:underline flex items-center gap-1 text-[11px]">WhatsApp →</a>
        </div>
      </div>
    </div>

    <!-- Faixa Dourada com Estrelas "RECEITA EXCLUSIVA DA CASA" -->
    <div class="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-black text-amber-400 py-1 tracking-wider uppercase">
      <span>⭐ RECEITA EXCLUSIVA DA CASA</span>
      <span>✦</span>
      <span>🏆 ELEITO O FAVORITO</span>
    </div>

    <!-- Faixa Animada Contínua (Marquee) -->
    ${renderMarquee(marqueePhrases, { bgClass: isLight ? "bg-white/90 border border-zinc-200 rounded-2xl shadow-sm" : "bg-zinc-900/90 border border-white/10 rounded-2xl", textClass: "text-amber-400 font-bold" })}

    <!-- Faixa de Cupom de Boas-Vindas (10% OFF BEMVINDO10) -->
    <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-lg" style="background-color: ${isLight ? "rgba(254,243,199,0.7)" : "rgba(245,158,11,0.12)"}; border-color: rgba(245,158,11,0.3);">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg shrink-0 border border-amber-500/30">
          🎟️
        </div>
        <div class="min-w-0">
          <div class="text-xs font-black flex items-center gap-1.5" style="color: ${isLight ? "#78350f" : "#ffffff"};">
            <span>10% OFF no seu Pedido</span>
            <span class="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold uppercase">Novo</span>
          </div>
          <div class="text-[10px] opacity-75 mt-0.5">Cupom: <span class="font-mono font-bold text-amber-400">BEMVINDO10</span></div>
        </div>
      </div>
      <button type="button" id="btn-coupon" onclick="toggleWelcomeCoupon()" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md">
        Aplicar
      </button>
    </div>

    <!-- Banner do Programa de Fidelidade Integrado -->
    <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-lg" style="background-color: ${isLight ? "rgba(255,255,255,0.95)" : "rgba(24,24,27,0.9)"}; border-color: ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"};">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-base shrink-0 border border-purple-500/30">
          🎁
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold truncate" style="color: ${isLight ? "#18181b" : "#ffffff"};">Clube de Fidelidade & Pontos</div>
          <div class="text-[10px] opacity-70">Ganhe 1 ponto a cada R$ 1 gasto aqui</div>
        </div>
      </div>
      <button type="button" onclick="openLoyaltyModal()" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold transition-all shrink-0 cursor-pointer">
        Ver Saldo
      </button>
    </div>

    <!-- Carrossel de Destaques (Mais Vendidos da Casa) -->
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2.5 px-0.5">
        <div class="flex items-center gap-1.5">
          <span class="text-base">⭐</span>
          <h2 class="text-sm font-black tracking-tight" style="color: ${isLight ? "#18181b" : "#ffffff"};">Mais Pedidos da Casa</h2>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Destaques</span>
        </div>
        <span class="text-[10px] opacity-60 font-medium">Toque para ver</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
        ${featuredItems
          .map((item, idx) => `
          <div onclick="openProductDetailModal(${idx})" class="snap-start w-56 shrink-0 p-3 flex flex-col justify-between cursor-pointer group ${cardClass}" style="${cardStyle}">
            <div class="space-y-2">
              <div class="relative h-28 rounded-xl overflow-hidden bg-zinc-950">
                <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${item.title}">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-md" style="background-color: var(--btn-primary); color: #000;">Mais Vendido 🏆</span>
              </div>
              <div>
                <h3 class="font-bold text-xs line-clamp-1" style="color: ${isLight ? "#18181b" : "#f4f4f5"};">${item.title}</h3>
                <p class="text-[10px] opacity-70 line-clamp-2 mt-0.5">${item.desc}</p>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between pt-2 border-t" style="border-color: ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"};">
              <span class="font-black text-emerald-400 text-xs">R$ ${item.price.toFixed(2).replace(".", ",")}</span>
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all" style="background-color: var(--btn-primary); color: #000;">+ Opções</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Navegação de Categorias Funcional -->
    <div class="pt-2">
      <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="category-pills">
        <button type="button" onclick="filterCategory('Todos', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer font-bold shadow-md" style="background-color: var(--btn-primary); color: #000;">Todos</button>
        <button type="button" onclick="filterCategory('Mais Pedidos', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">🔥 Mais Pedidos</button>
        ${categories
          .filter((c) => c !== "Todos" && c !== "Mais Pedidos")
          .map(
            (cat) =>
              `<button type="button" onclick="filterCategory('${cat}', this)" class="category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">${cat}</button>`
          )
          .join("")}
      </div>
    </div>

    <!-- Lista de Produtos / Pratos -->
    <div class="space-y-3 pt-1" id="products-list">
      ${items
        .map(
          (item, idx) => `
        <div onclick="openProductDetailModal(${idx})" data-category="${item.category}" data-featured="${item.isFeatured}" class="product-card p-3.5 flex items-center justify-between gap-3.5 cursor-pointer group ${cardClass}" style="${cardStyle}">
          <div class="min-w-0 flex-1">
            ${item.badge ? `<span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-black border mb-1" style="background-color: rgba(245,158,11,0.15); color: var(--btn-primary); border-color: rgba(245,158,11,0.3);">${item.badge}</span>` : ""}
            <h3 class="font-bold text-sm line-clamp-1 group-hover:opacity-80 transition-opacity" style="color: ${isLight ? "#18181b" : "#f4f4f5"};">${item.title}</h3>
            <p class="text-xs opacity-70 line-clamp-2 mt-1 leading-relaxed">${item.desc}</p>
            <div class="mt-2.5 font-black text-emerald-400 text-sm">
              R$ ${item.price.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10">
            <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${item.title}">
            <div class="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-md flex items-center gap-0.5" style="background-color: var(--btn-primary); color: #000;">
              <span>+</span>
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>

  <!-- BARRA INFERIOR FLUTUANTE DA SACOLA -->
  <div id="cart-bar" style="display: none;" class="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
    <div class="max-w-md mx-auto">
      <button type="button" onclick="openCartModal()" class="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-all">
        <div class="flex items-center gap-2">
          <span id="cart-badge-count" class="w-6 h-6 rounded-full bg-black text-emerald-400 flex items-center justify-center text-xs font-black">0</span>
          <span>Ver Sacola do Pedido</span>
        </div>
        <div class="flex items-center gap-2">
          <span id="cart-total-display" class="font-black">R$ 0,00</span>
          <span>→</span>
        </div>
      </button>
    </div>
  </div>

  <!-- MODAL 1: DETALHES DO PRODUTO ESTILO IFOOD (Foto Grande, Adicionais e Observação) -->
  <div id="product-detail-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
      <div class="relative h-48 sm:h-56 bg-zinc-950 shrink-0">
        <img id="detail-modal-img" src="" class="w-full h-full object-cover" alt="">
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40"></div>
        <button type="button" onclick="closeProductDetailModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center text-sm cursor-pointer z-10">✕</button>
        <div class="absolute bottom-3 left-4 right-4">
          <span id="detail-modal-badge" class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black uppercase tracking-wider inline-block mb-1">Destaque</span>
          <h2 id="detail-modal-title" class="text-lg sm:text-xl font-black text-white leading-tight"></h2>
        </div>
      </div>

      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        <div>
          <p id="detail-modal-desc" class="text-xs sm:text-sm text-zinc-300 leading-relaxed"></p>
          <div class="mt-2 text-sm font-black text-emerald-400">
            A partir de: <span id="detail-modal-base-price">R$ 0,00</span>
          </div>
        </div>

        <div id="detail-addons-section" class="pt-3 border-t border-white/10 space-y-2.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>✨ Adicionais & Acompanhamentos</span>
            </h3>
            <span class="text-[10px] text-zinc-400">Opcional</span>
          </div>
          <div id="detail-addons-list" class="space-y-2"></div>
        </div>

        <div class="pt-3 border-t border-white/10 space-y-1.5">
          <label class="block text-xs font-bold text-white">Alguma observação?</label>
          <textarea id="detail-item-notes" rows="2" placeholder="Ex: Sem talher plástico, caprichar no molho, sem cebola..." class="w-full p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"></textarea>
        </div>
      </div>

      <div class="p-4 bg-zinc-950 border-t border-white/10 flex items-center gap-3 shrink-0">
        <div class="flex items-center gap-2 bg-zinc-800 rounded-xl p-1 border border-white/10">
          <button type="button" onclick="changeDetailQty(-1)" class="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95">-</button>
          <span id="detail-qty-display" class="w-6 text-center text-xs font-black text-white">1</span>
          <button type="button" onclick="changeDetailQty(1)" class="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95">+</button>
        </div>
        <button type="button" onclick="confirmAddProductToCart()" class="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-between cursor-pointer active:scale-95">
          <span>Adicionar ao Pedido</span>
          <span id="detail-total-btn-price" class="font-black">R$ 0,00</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: SACOLA & CHECKOUT WHATSAPP -->
  <div id="cart-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <span>🛍️ Sua Sacola de Pedido</span>
        </h2>
        <button type="button" onclick="closeCartModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm cursor-pointer">✕</button>
      </div>

      <div class="flex gap-2">
        <label class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer" id="label-delivery">
          <input type="radio" name="delivery-type" value="delivery" checked onchange="toggleDelivery(true)" class="hidden">
          <span>🛵 Entrega (+R$ 5)</span>
        </label>
        <label class="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer" id="label-pickup">
          <input type="radio" name="delivery-type" value="pickup" onchange="toggleDelivery(false)" class="hidden">
          <span>🏪 Retirar no Balcão</span>
        </label>
      </div>

      <div id="cart-items-list" class="space-y-2"></div>

      <div id="cart-coupon-row" style="display: none;" class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
        <span class="flex items-center gap-1.5 font-bold">
          <span>🎟️</span>
          <span>Cupom BEMVINDO10 (10% OFF)</span>
        </span>
        <span id="modal-coupon-discount" class="font-black">- R$ 0,00</span>
      </div>

      <div class="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5 text-xs">
        <div class="flex justify-between text-zinc-400">
          <span>Subtotal:</span>
          <span id="modal-subtotal" class="text-zinc-200 font-semibold">R$ 0,00</span>
        </div>
        <div class="flex justify-between text-zinc-400">
          <span>Taxa de Entrega:</span>
          <span id="modal-delivery-fee" class="text-emerald-400 font-semibold">R$ 5,00</span>
        </div>
        <div class="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
          <span>Total a Pagar:</span>
          <span id="modal-total" class="text-emerald-400 font-black">R$ 5,00</span>
        </div>
      </div>

      <div class="space-y-2.5 text-xs">
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Seu Nome:</label>
          <input id="client-name" type="text" placeholder="Ex: João Silva" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div id="address-container">
          <label class="block text-zinc-400 mb-1 font-semibold">Endereço de Entrega:</label>
          <input id="client-address" type="text" placeholder="Rua, número, bairro e ponto de referência" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Forma de Pagamento:</label>
          <select id="client-payment" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500">
            <option value="Pix">PIX (Chave enviada no WhatsApp)</option>
            <option value="Cartão de Crédito">Cartão de Crédito na Entrega</option>
            <option value="Cartão de Débito">Cartão de Débito na Entrega</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
        <div>
          <label class="block text-zinc-400 mb-1 font-semibold">Observações Gerais do Pedido:</label>
          <input id="client-notes" type="text" placeholder="Ex: Troco para 50, tocar campainha..." class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500">
        </div>
      </div>

      <button type="button" onclick="checkoutWhatsApp('${cleanWhatsapp}', '${businessName}')" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
        <span>Concluir Pedido no WhatsApp</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <!-- MODAL 3: CONSULTA DO CLUBE DE FIDELIDADE -->
  <div id="loyalty-modal" style="display: none;" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4">
    <div class="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/10 p-5 space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="font-bold text-white text-sm flex items-center gap-2">
          <span>🎁 Clube de Fidelidade</span>
        </h3>
        <button type="button" onclick="closeLoyaltyModal()" class="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs">✕</button>
      </div>
      <div class="space-y-2 text-xs text-zinc-300">
        <p>A cada <strong>R$ 1,00</strong> em compras você ganha <strong>1 ponto</strong>.</p>
        <div class="p-3 rounded-xl bg-zinc-800 border border-white/5 space-y-1">
          <div class="font-bold text-amber-300">Prêmios para Resgate:</div>
          <div class="text-[11px] text-zinc-400">• 50 pts: Bebida ou Sobremesa Grátis</div>
          <div class="text-[11px] text-zinc-400">• 100 pts: R$ 15,00 de Desconto no Pedido</div>
        </div>
        <div class="pt-2">
          <label class="block text-[11px] text-zinc-400 mb-1">Consulte seus pontos pelo WhatsApp:</label>
          <input id="loyalty-phone-input" type="tel" placeholder="(DDD) 99999-9999" class="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500">
        </div>
      </div>
      <button type="button" onclick="checkLoyaltyPoints()" class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md">
        Verificar Saldo
      </button>
      <div id="loyalty-result" class="text-center text-xs text-purple-300 font-bold pt-1" style="display: none;"></div>
    </div>
  </div>

  <script>
    const availableItems = ${itemsJson};
    let cart = [];
    let isDeliveryMode = true;
    let isCouponApplied = false;

    let activeProductIdx = null;
    let activeProductQty = 1;

    function filterCategory(cat, btn) {
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white';
      });
      if (btn) {
        btn.className = 'category-pill px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer bg-amber-500 text-black font-bold shadow-md';
      }

      document.querySelectorAll('.product-card').forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        const isFeatured = card.getAttribute('data-featured') === 'true';

        if (cat === 'Todos' || !cat) {
          card.style.display = 'flex';
        } else if (cat === 'Mais Pedidos') {
          card.style.display = isFeatured ? 'flex' : 'none';
        } else if (itemCat.toLowerCase() === cat.toLowerCase()) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function toggleWelcomeCoupon() {
      const btn = document.getElementById('btn-coupon');
      isCouponApplied = !isCouponApplied;
      if (isCouponApplied) {
        btn.textContent = '✓ Aplicado';
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md';
      } else {
        btn.textContent = 'Aplicar';
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-black transition-all shrink-0 cursor-pointer shadow-md';
      }
      updateCartUI();
    }

    function openProductDetailModal(idx) {
      const item = availableItems[idx];
      if (!item) return;

      activeProductIdx = idx;
      activeProductQty = 1;

      document.getElementById('detail-modal-img').src = item.img || '';
      document.getElementById('detail-modal-title').textContent = item.title;
      document.getElementById('detail-modal-desc').textContent = item.desc || '';
      document.getElementById('detail-modal-badge').textContent = item.badge || 'Destaque';
      document.getElementById('detail-modal-base-price').textContent = 'R$ ' + item.price.toFixed(2).replace('.', ',');
      document.getElementById('detail-qty-display').textContent = '1';
      document.getElementById('detail-item-notes').value = '';

      const addonsListEl = document.getElementById('detail-addons-list');
      addonsListEl.innerHTML = '';

      if (item.options && item.options.length > 0) {
        document.getElementById('detail-addons-section').style.display = 'block';
        item.options.forEach((opt, optIdx) => {
          const optDiv = document.createElement('label');
          optDiv.className = 'flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/80 border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all';
          optDiv.innerHTML = \`
            <div class="flex items-center gap-2">
              <input type="checkbox" name="detail-addon-check" value="\${optIdx}" onchange="recalcDetailTotal()" class="rounded border-zinc-700 text-amber-500 focus:ring-0">
              <span class="text-xs text-zinc-200 font-medium">\${opt.name}</span>
            </div>
            <span class="text-xs font-black text-emerald-400">+ R$ \${opt.price.toFixed(2).replace('.', ',')}</span>
          \`;
          addonsListEl.appendChild(optDiv);
        });
      } else {
        document.getElementById('detail-addons-section').style.display = 'none';
      }

      recalcDetailTotal();
      const modal = document.getElementById('product-detail-modal');
      modal.style.display = 'flex';
    }

    function closeProductDetailModal() {
      document.getElementById('product-detail-modal').style.display = 'none';
      activeProductIdx = null;
    }

    function changeDetailQty(delta) {
      activeProductQty = Math.max(1, activeProductQty + delta);
      document.getElementById('detail-qty-display').textContent = activeProductQty;
      recalcDetailTotal();
    }

    function recalcDetailTotal() {
      if (activeProductIdx === null) return;
      const item = availableItems[activeProductIdx];
      let unitPrice = item.price;

      const checkedBoxes = document.querySelectorAll('input[name="detail-addon-check"]:checked');
      checkedBoxes.forEach(chk => {
        const optIdx = parseInt(chk.value, 10);
        if (item.options && item.options[optIdx]) {
          unitPrice += item.options[optIdx].price;
        }
      });

      const total = unitPrice * activeProductQty;
      document.getElementById('detail-total-btn-price').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    }

    function confirmAddProductToCart() {
      if (activeProductIdx === null) return;
      const item = availableItems[activeProductIdx];

      const selectedAddons = [];
      let addonsCost = 0;
      const checkedBoxes = document.querySelectorAll('input[name="detail-addon-check"]:checked');
      checkedBoxes.forEach(chk => {
        const optIdx = parseInt(chk.value, 10);
        if (item.options && item.options[optIdx]) {
          selectedAddons.push(item.options[optIdx].name);
          addonsCost += item.options[optIdx].price;
        }
      });

      const notes = document.getElementById('detail-item-notes').value.trim();
      const unitTotal = item.price + addonsCost;

      cart.push({
        title: item.title,
        basePrice: item.price,
        unitPrice: unitTotal,
        qty: activeProductQty,
        addons: selectedAddons,
        notes: notes
      });

      closeProductDetailModal();
      updateCartUI();
    }

    function updateCartUI() {
      const bar = document.getElementById('cart-bar');
      const badge = document.getElementById('cart-badge-count');
      const totalDisplay = document.getElementById('cart-total-display');

      const totalItems = cart.reduce((acc, it) => acc + it.qty, 0);
      const subtotal = cart.reduce((acc, it) => acc + (it.unitPrice * it.qty), 0);

      const discount = isCouponApplied ? subtotal * 0.1 : 0;
      const deliveryFee = isDeliveryMode ? 5.00 : 0.00;
      const total = Math.max(0, subtotal - discount + deliveryFee);

      if (totalItems > 0) {
        bar.style.display = 'block';
        badge.textContent = totalItems;
        totalDisplay.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
      } else {
        bar.style.display = 'none';
      }

      const cartList = document.getElementById('cart-items-list');
      if (cartList) {
        cartList.innerHTML = '';
        cart.forEach((it, idx) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-white/5 text-xs';
          itemEl.innerHTML = \`
            <div class="min-w-0 flex-1 pr-2">
              <div class="font-bold text-white">\${it.qty}x \${it.title}</div>
              \${it.addons.length > 0 ? \`<div class="text-[10px] text-amber-400 mt-0.5">+ \${it.addons.join(', ')}</div>\` : ''}
              \${it.notes ? \`<div class="text-[10px] text-zinc-400 italic">Obs: \${it.notes}</div>\` : ''}
              <div class="text-emerald-400 font-black mt-1">R$ \${(it.unitPrice * it.qty).toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" onclick="updateItemCartQty(\${idx}, -1)" class="w-6 h-6 rounded-lg bg-zinc-700 text-white font-black flex items-center justify-center">-</button>
              <span class="text-white font-black w-4 text-center">\${it.qty}</span>
              <button type="button" onclick="updateItemCartQty(\${idx}, 1)" class="w-6 h-6 rounded-lg bg-zinc-700 text-white font-black flex items-center justify-center">+</button>
            </div>
          \`;
          cartList.appendChild(itemEl);
        });

        document.getElementById('modal-subtotal').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
        document.getElementById('modal-delivery-fee').textContent = 'R$ ' + deliveryFee.toFixed(2).replace('.', ',');
        document.getElementById('modal-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');

        const couponRow = document.getElementById('cart-coupon-row');
        if (couponRow) {
          couponRow.style.display = isCouponApplied ? 'flex' : 'none';
          document.getElementById('modal-coupon-discount').textContent = '- R$ ' + discount.toFixed(2).replace('.', ',');
        }
      }
    }

    function updateItemCartQty(idx, delta) {
      if (!cart[idx]) return;
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
      updateCartUI();
    }

    function openCartModal() {
      // Carrega dados salvos do cliente para conveniência
      try {
        const savedName = localStorage.getItem('eialink_client_name');
        const savedAddress = localStorage.getItem('eialink_client_address');
        const nameInput = document.getElementById('client-name');
        const addrInput = document.getElementById('client-address');
        if (savedName && nameInput && !nameInput.value) nameInput.value = savedName;
        if (savedAddress && addrInput && !addrInput.value) addrInput.value = savedAddress;
      } catch (e) {}

      updateCartUI();
      document.getElementById('cart-modal').style.display = 'flex';
    }

    function closeCartModal() {
      document.getElementById('cart-modal').style.display = 'none';
    }

    function toggleDelivery(isDelivery) {
      isDeliveryMode = isDelivery;
      const addrContainer = document.getElementById('address-container');
      const labelDelivery = document.getElementById('label-delivery');
      const labelPickup = document.getElementById('label-pickup');

      if (isDelivery) {
        addrContainer.style.display = 'block';
        labelDelivery.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer';
        labelPickup.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer';
      } else {
        addrContainer.style.display = 'none';
        labelDelivery.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold cursor-pointer';
        labelPickup.className = 'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 border border-emerald-500 text-emerald-400 text-xs font-semibold cursor-pointer';
      }
      updateCartUI();
    }

    function checkoutWhatsApp(phone, business) {
      if (cart.length === 0) {
        alert('Sua sacola está vazia.');
        return;
      }

      const clientName = document.getElementById('client-name').value.trim();
      const clientAddress = document.getElementById('client-address').value.trim();
      const clientPayment = document.getElementById('client-payment').value;
      const clientNotes = document.getElementById('client-notes').value.trim();

      if (isDeliveryMode && !clientAddress) {
        alert('Por favor, informe seu endereço para entrega.');
        return;
      }

      // Salva no localStorage para as próximas compras
      try {
        if (clientName) localStorage.setItem('eialink_client_name', clientName);
        if (clientAddress) localStorage.setItem('eialink_client_address', clientAddress);
      } catch (e) {}

      const subtotal = cart.reduce((acc, it) => acc + (it.unitPrice * it.qty), 0);
      const discount = isCouponApplied ? subtotal * 0.1 : 0;
      const deliveryFee = isDeliveryMode ? 5.00 : 0.00;
      const total = Math.max(0, subtotal - discount + deliveryFee);

      let msg = '🍔 *NOVO PEDIDO - ' + business.toUpperCase() + '*\\n';
      msg += '---------------------------------\\n';
      if (clientName) msg += '👤 *Cliente:* ' + clientName + '\\n';
      msg += '🛵 *Tipo:* ' + (isDeliveryMode ? 'Entrega (+R$ 5)' : 'Retirada no Balcão') + '\\n';
      if (isDeliveryMode) msg += '📍 *Endereço:* ' + clientAddress + '\\n';
      msg += '---------------------------------\\n';
      msg += '*ITENS DO PEDIDO:*\\n';

      cart.forEach(it => {
        msg += '• *' + it.qty + 'x ' + it.title + '* (R$ ' + (it.unitPrice * it.qty).toFixed(2).replace('.', ',') + ')\\n';
        if (it.addons && it.addons.length > 0) {
          msg += '   ↳ *Adicionais:* ' + it.addons.join(', ') + '\\n';
        }
        if (it.notes) {
          msg += '   ↳ *Obs:* ' + it.notes + '\\n';
        }
      });

      msg += '---------------------------------\\n';
      msg += '💰 *Subtotal:* R$ ' + subtotal.toFixed(2).replace('.', ',') + '\\n';
      if (isCouponApplied) {
        msg += '🎟️ *Cupom BEMVINDO10 (-10%):* -R$ ' + discount.toFixed(2).replace('.', ',') + '\\n';
      }
      if (isDeliveryMode) {
        msg += '🛵 *Taxa de Entrega:* R$ ' + deliveryFee.toFixed(2).replace('.', ',') + '\\n';
      }
      msg += '🔥 *TOTAL:* R$ ' + total.toFixed(2).replace('.', ',') + '\\n';
      msg += '---------------------------------\\n';
      msg += '💳 *Forma de Pagamento:* ' + clientPayment + '\\n';
      if (clientNotes) msg += '📝 *Obs:* ' + clientNotes + '\\n';
      msg += '\\n_Pedido gerado via Cardápio Digital EIA Link_';

      const cleanNum = (phone || '').replace(/\\D/g, '');
      const target = cleanNum.length >= 10 ? cleanNum : '5511999999999';
      window.open('https://wa.me/' + target + '?text=' + encodeURIComponent(msg), '_blank');
    }

    function openLoyaltyModal() {
      document.getElementById('loyalty-modal').style.display = 'flex';
      document.getElementById('loyalty-result').style.display = 'none';
    }

    function closeLoyaltyModal() {
      document.getElementById('loyalty-modal').style.display = 'none';
    }

    function checkLoyaltyPoints() {
      const phone = document.getElementById('loyalty-phone-input').value.trim();
      if (!phone) {
        alert('Digite seu número de WhatsApp.');
        return;
      }
      const res = document.getElementById('loyalty-result');
      res.style.display = 'block';
      res.textContent = '🎉 Saldo: 45 pontos acumulados! Faltam apenas 5 pontos para resgatar sua recompensa.';
    }
  </script>
</body>
</html>`;
}

