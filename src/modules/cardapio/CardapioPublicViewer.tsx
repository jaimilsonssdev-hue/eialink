import { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
  ShoppingBag,
  Search,
  MessageCircle,
  Plus,
  Minus,
  Sparkles,
  Bike,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Gift,
  Star,
  Flame,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CardapioData, CardapioItem } from "./cardapioAiService";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";
import { toast } from "sonner";

interface CardapioPublicViewerProps {
  cardapio: CardapioData;
  companyName: string;
  isDemo?: boolean;
}

export function CardapioPublicViewer({
  cardapio,
  companyName,
  isDemo = false,
}: CardapioPublicViewerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{
    [itemId: string]: {
      qty: number;
      addons: string[];
      notes: string;
    };
  }>({});

  // Modal 1: Detalhes do Produto estilo iFood
  const [detailItem, setDetailItem] = useState<CardapioItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailSelectedAddons, setDetailSelectedAddons] = useState<string[]>([]);
  const [detailNotes, setDetailNotes] = useState("");

  // Modal 2: Sacola / Checkout WhatsApp
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isDeliveryMode, setIsDeliveryMode] = useState(true);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  const [clientNotes, setClientNotes] = useState("");

  // Modal 3: Clube de Fidelidade
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [loyaltyResultText, setLoyaltyResultText] = useState<string | null>(null);

  // Cores dinâmicas e contraste
  const bgColor = cardapio.backgroundColor || "#09090b";
  const btnColor = cardapio.buttonColor || "#f97316";

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

  // Itens em destaque para o carrossel horizontal "Mais Pedidos da Casa"
  const popularItems = useMemo(() => {
    const list = (cardapio.items || []).filter((it) => it.isPopular || it.badge);
    return list.length > 0 ? list : (cardapio.items || []).slice(0, 4);
  }, [cardapio.items]);

  // Itens filtrados por busca e categoria
  const filteredItems = useMemo(() => {
    return (cardapio.items || []).filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === "todos") return true;
      if (activeCategory === "destaques") return item.isPopular || item.badge;
      return item.category === activeCategory;
    });
  }, [cardapio.items, activeCategory, searchQuery]);

  // Cálculos da sacola
  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((acc, curr) => acc + curr.qty, 0);
  }, [cart]);

  const subtotalCart = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, data]) => {
      const item = cardapio.items.find((x) => x.id === id);
      const base = item ? item.price * data.qty : 0;
      // Adicionais somam R$ 4 por item opcional
      const addonsPrice = data.addons.length * 4 * data.qty;
      return acc + base + addonsPrice;
    }, 0);
  }, [cart, cardapio.items]);

  const deliveryFeeNumber = useMemo(() => {
    const raw = String(cardapio.deliveryFee || "5").replace(/[^0-9,.]/g, "").replace(",", ".");
    return parseFloat(raw) || 5.0;
  }, [cardapio.deliveryFee]);

  const effectiveDeliveryFee = isDeliveryMode ? deliveryFeeNumber : 0;
  const couponDiscount = isCouponApplied ? subtotalCart * 0.1 : 0;
  const totalCart = Math.max(0, subtotalCart - couponDiscount + (cartItemCount > 0 ? effectiveDeliveryFee : 0));

  // Abertura do modal de detalhe do produto
  function handleOpenItemDetail(item: CardapioItem) {
    setDetailItem(item);
    setDetailQty(1);
    setDetailSelectedAddons([]);
    setDetailNotes("");
  }

  // Adicionar do modal de detalhe para a sacola
  function handleConfirmAddToCart() {
    if (!detailItem) return;
    setCart((prev) => {
      const existing = prev[detailItem.id];
      if (existing) {
        return {
          ...prev,
          [detailItem.id]: {
            qty: existing.qty + detailQty,
            addons: Array.from(new Set([...existing.addons, ...detailSelectedAddons])),
            notes: detailNotes ? `${existing.notes ? existing.notes + " | " : ""}${detailNotes}` : existing.notes,
          },
        };
      }
      return {
        ...prev,
        [detailItem.id]: {
          qty: detailQty,
          addons: [...detailSelectedAddons],
          notes: detailNotes,
        },
      };
    });

    toast.success(`${detailQty}x ${detailItem.name} adicionado à sacola!`);
    setDetailItem(null);
  }

  // Aumentar/diminuir na sacola
  function handleUpdateCartQty(itemId: string, delta: number) {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const nextQty = current.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          qty: nextQty,
        },
      };
    });
  }

  // Aplicar cupom 10% OFF
  function handleApplyCoupon() {
    setIsCouponApplied(true);
    toast.success("Cupom BEMVINDO10 aplicado! 10% de desconto concedido.");
  }

  // Consulta de fidelidade
  function handleCheckLoyalty() {
    if (!loyaltyPhone.trim()) {
      toast.error("Informe seu número de WhatsApp");
      return;
    }
    setLoyaltyResultText("🎉 Você possui 45 pontos acumulados! Apenas 5 pontos para resgatar sua recompensa.");
  }

  // Enviar pedido no WhatsApp
  function handleCheckoutWhatsApp() {
    if (cartItemCount === 0) return;

    let msg = `🍔 *NOVO PEDIDO - ${cardapio.restaurantName.toUpperCase()}*\n`;
    msg += `---------------------------------\n`;
    if (customerName) msg += `👤 *Cliente:* ${customerName}\n`;
    msg += `🛵 *Tipo:* ${isDeliveryMode ? `Entrega (+R$ ${deliveryFeeNumber.toFixed(2)})` : "Retirada no Balcão"}\n`;
    if (isDeliveryMode && deliveryAddress) {
      msg += `📍 *Endereço:* ${deliveryAddress}\n`;
    }
    msg += `---------------------------------\n`;
    msg += `*ITENS DO PEDIDO:*\n`;

    Object.entries(cart).forEach(([id, data]) => {
      const it = cardapio.items.find((x) => x.id === id);
      if (it) {
        msg += `• *${data.qty}x ${it.name}* (R$ ${(it.price * data.qty).toFixed(2)})\n`;
        if (data.addons.length > 0) {
          msg += `   ↳ Adicionais: ${data.addons.join(", ")}\n`;
        }
        if (data.notes) {
          msg += `   ↳ Obs: ${data.notes}\n`;
        }
      }
    });

    msg += `---------------------------------\n`;
    msg += `💰 *Subtotal:* R$ ${subtotalCart.toFixed(2)}\n`;
    if (isCouponApplied) {
      msg += `🎟️ *Cupom BEMVINDO10 (-10%):* -R$ ${couponDiscount.toFixed(2)}\n`;
    }
    if (isDeliveryMode) {
      msg += `🛵 *Taxa de Entrega:* R$ ${deliveryFeeNumber.toFixed(2)}\n`;
    }
    msg += `🔥 *TOTAL:* R$ ${totalCart.toFixed(2)}\n`;
    msg += `---------------------------------\n`;
    msg += `💳 *Forma de Pagamento:* ${paymentMethod}\n`;
    if (clientNotes) msg += `📝 *Observações:* ${clientNotes}\n`;
    msg += `\n_Pedido realizado pelo Cardápio Digital EIA Link_`;

    const cleanPhone = (cardapio.whatsapp || "").replace(/\D/g, "");
    const targetPhone = cleanPhone.length >= 10 ? cleanPhone : "5511999999999";
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
  }

  // Foto de capa (banner) ou primeira foto de comida com boa resolução
  const coverImage =
    cardapio.bannerImage ||
    cardapio.items[0]?.image ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

  // Foto de avatar/logo do restaurante
  const logoImage =
    cardapio.logoUrl ||
    cardapio.items[1]?.image ||
    cardapio.items[0]?.image ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80";

  return (
    <div
      className={`min-h-screen w-full font-sans pb-32 transition-colors duration-300 ${
        isLight ? "text-zinc-900" : "text-zinc-100"
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Banner de Demonstração quando ativado */}
      {isDemo && companyName && <DemoConversionBanner companyName={companyName} />}

      {/* 1. BANNER DE CAPA COM FOTO E GRADIENTE DE TRANSIÇÃO */}
      <div className="relative h-44 sm:h-60 overflow-hidden bg-zinc-950">
        <img
          src={coverImage}
          alt={cardapio.restaurantName}
          className="w-full h-full object-cover opacity-70 scale-105 transition-transform duration-700"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t"
          style={{
            backgroundImage: isLight
              ? `linear-gradient(to top, ${bgColor} 0%, rgba(255,255,255,0.4) 60%, transparent 100%)`
              : `linear-gradient(to top, ${bgColor} 0%, rgba(9,9,11,0.6) 60%, transparent 100%)`,
          }}
        />
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 space-y-4">
        {/* 2. CARD PRINCIPAL DO ESTABELECIMENTO ESTILO IFOOD (Sobreposto com foto) */}
        <div
          className={`rounded-3xl p-5 border shadow-2xl relative backdrop-blur-md transition-all ${
            isLight
              ? "bg-white/95 border-zinc-200/80 shadow-zinc-300/60"
              : "bg-zinc-900/95 border-white/10 shadow-black/80"
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Foto / Logotipo Quadrado com Borda que sobe */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden shadow-2xl shrink-0 -mt-10 sm:-mt-12 relative z-20 ${
                isLight ? "border-white bg-zinc-100" : "border-zinc-950 bg-zinc-800"
              }`}
            >
              <img
                src={logoImage}
                alt={cardapio.restaurantName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aberto Agora
                </span>
                <span className="text-[11px] opacity-75 flex items-center gap-1">
                  ⏱️ 30-45 min
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate leading-tight">
                {cardapio.restaurantName || companyName}
              </h1>
            </div>
          </div>

          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {cardapio.tagline || cardapio.description || "O melhor sabor da região. Peça agora pelo cardápio digital."}
            {cardapio.address && ` • ${cardapio.address}`}
          </p>

          <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-white/10">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>★</span> 4.7 <span className="opacity-60 font-normal">(120 avaliações)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Bike className="h-3.5 w-3.5" /> Entrega R$ {deliveryFeeNumber.toFixed(2)}
              </span>
              <a
                href={`https://wa.me/${(cardapio.whatsapp || "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="opacity-80 hover:opacity-100 hover:underline flex items-center gap-1 text-[11px]"
              >
                WhatsApp →
              </a>
            </div>
          </div>
        </div>

        {/* 3. FAIXA DOURADA COM ESTRELAS "RECEITA EXCLUSIVA DA CASA" */}
        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-black text-amber-400 py-1 tracking-wider uppercase">
          <span>⭐ RECEITA EXCLUSIVA DA CASA</span>
          <span>✦</span>
          <span>🏆 ELEITO O FAVORITO</span>
        </div>

        {/* 4. CARD DE CUPOM ESTILO TICKET DOURADO (10% OFF BEMVINDO10) */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-lg transition-all ${
            isCouponApplied
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : isLight
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-amber-500/10 border-amber-500/25 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg">
              🎟️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black">10% OFF no seu Pedido</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-black uppercase">
                  NOVO
                </span>
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Cupom: <span className="font-mono font-bold tracking-wider">BEMVINDO10</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleApplyCoupon}
            disabled={isCouponApplied}
            className={`h-8 px-4 rounded-xl text-xs font-black shadow-md ${
              isCouponApplied
                ? "bg-emerald-500 text-black cursor-default"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            {isCouponApplied ? "✓ Aplicado" : "Aplicar"}
          </Button>
        </div>

        {/* 5. CARD DO CLUBE DE FIDELIDADE & PONTOS */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-lg ${
            isLight
              ? "bg-purple-50 border-purple-200 text-purple-950"
              : "bg-zinc-900/90 border-white/10 text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
              🎁
            </div>
            <div>
              <h4 className="text-xs font-black">Clube de Fidelidade & Pontos</h4>
              <p className="text-[11px] opacity-70 mt-0.5">
                Ganhe 1 ponto a cada R$ 1 gasto aqui
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsLoyaltyModalOpen(true)}
            className="h-8 px-3.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 shadow-sm"
          >
            Ver Saldo
          </Button>
        </div>

        {/* 6. CARROSSEL HORIZONTAL "MAIS PEDIDOS DA CASA" (DESTAQUES) */}
        {popularItems.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                <span>⭐</span> Mais Pedidos da Casa
              </h3>
              <span className="text-[10px] opacity-60 font-semibold tracking-wider uppercase">
                Toque para ver
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
              {popularItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenItemDetail(item)}
                  className={`min-w-[240px] sm:min-w-[270px] max-w-[280px] rounded-2xl border overflow-hidden cursor-pointer snap-start transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between ${
                    isLight
                      ? "bg-white border-zinc-200"
                      : "bg-zinc-900/90 border-white/10"
                  }`}
                >
                  <div className="relative h-36 w-full bg-zinc-800 overflow-hidden">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-black shadow-md flex items-center gap-1">
                      <span>MAIS VENDIDO</span> 🏆
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-sm font-black truncate">{item.name}</h4>
                      <p className="text-[11px] opacity-70 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm font-black text-amber-400">
                        R$ {Number(item.price).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemDetail(item);
                        }}
                        className="h-7 px-3 rounded-xl text-[11px] font-black text-white shadow-md"
                        style={{ backgroundColor: btnColor }}
                      >
                        Pedir +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BARRA DE BUSCA EM TEMPO REAL */}
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por prato, lanche, ingrediente ou bebida..."
              className={`pl-10 h-11 rounded-2xl text-xs sm:text-sm ${
                isLight
                  ? "bg-white border-zinc-300 text-zinc-900 shadow-sm"
                  : "bg-zinc-900/90 border-white/10 text-zinc-100 placeholder:text-zinc-500"
              }`}
            />
          </div>
        </div>

        {/* 8. CATEGORIAS EM PILLS ROLÁVEIS */}
        {cardapio.categories && cardapio.categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
            {cardapio.categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm ${
                    isActive
                      ? "text-black shadow-md scale-[1.02]"
                      : isLight
                      ? "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      : "bg-zinc-900/80 text-zinc-300 border-white/10 hover:bg-zinc-800"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "#f59e0b", borderColor: "#f59e0b" }
                      : {}
                  }
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 9. LISTA DE PRATOS E LANCHES */}
        <div className="space-y-3 pt-2">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center opacity-60">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhum item encontrado nesta categoria</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItemDetail(item)}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3.5 cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-lg ${
                  isLight
                    ? "bg-white border-zinc-200 hover:border-zinc-300"
                    : "bg-zinc-900/90 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm sm:text-base font-black truncate">{item.name}</h4>
                  </div>
                  {item.badge && (
                    <span className="inline-block px-2 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5">
                      {item.badge}
                    </span>
                  )}
                  <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2.5 text-sm sm:text-base font-black text-amber-400">
                    R$ {Number(item.price).toFixed(2).replace(".", ",")}
                  </div>
                </div>

                {item.image && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 relative shadow-md">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItemDetail(item);
                      }}
                      className="absolute bottom-1.5 right-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black text-white shadow-lg flex items-center gap-1"
                      style={{ backgroundColor: btnColor }}
                    >
                      Pedir +
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 10. BARRA FLUTUANTE INFERIOR DA SACOLA */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl text-black font-black text-sm shadow-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all bg-emerald-400 hover:bg-emerald-300"
            >
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-black text-emerald-400 flex items-center justify-center text-xs font-black">
                  {cartItemCount}
                </span>
                <span>Ver Sacola</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>R$ {totalCart.toFixed(2).replace(".", ",")}</span>
                <ShoppingBag className="h-4 w-4 ml-1" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 11. MODAL 1: DETALHES DO PRODUTO ESTILO IFOOD (Foto grande, Adicionais e Observação) */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border overflow-hidden flex flex-col max-h-[92vh] shadow-2xl ${
              isLight ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-900 text-zinc-100 border-white/10"
            }`}
          >
            {/* Foto Grande do Produto com Botão Fechar */}
            <div className="relative h-48 sm:h-56 bg-zinc-950 shrink-0">
              <img
                src={
                  detailItem.image ||
                  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
                }
                alt={detailItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center text-sm cursor-pointer z-10"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                {detailItem.badge && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500 text-black uppercase tracking-wider inline-block mb-1">
                    {detailItem.badge}
                  </span>
                )}
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {detailItem.name}
                </h2>
              </div>
            </div>

            {/* Conteúdo com Scroll: Descrição + Adicionais + Observação */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                  {detailItem.description}
                </p>
                <div className="mt-2 text-sm font-black text-emerald-400">
                  A partir de: R$ {Number(detailItem.price).toFixed(2).replace(".", ",")}
                </div>
              </div>

              {/* Adicionais & Acompanhamentos */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨ Adicionais & Acompanhamentos</span>
                  </h3>
                  <span className="text-[10px] opacity-60">Opcional</span>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "add-1", name: "Bacon Crocante Extra", price: 4.0 },
                    { id: "add-2", name: "Queijo Cheddar Cremoso Duplo", price: 4.0 },
                    { id: "add-3", name: "Maionese Defumada Especial", price: 3.5 },
                    { id: "add-4", name: "Cebola Caramelizada na Chapa", price: 3.0 },
                  ].map((addon) => {
                    const isSelected = detailSelectedAddons.includes(addon.name);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => {
                          setDetailSelectedAddons((prev) =>
                            isSelected ? prev.filter((x) => x !== addon.name) : [...prev, addon.name]
                          );
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                            : "bg-white/5 border-white/5 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span className="text-xs font-semibold">{addon.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-400">
                            + R$ {addon.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                              isSelected ? "bg-amber-500 border-amber-500 text-black" : "border-white/30"
                            }`}
                          >
                            {isSelected && "✓"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observações do Item */}
              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <label className="block text-xs font-bold">Alguma observação?</label>
                <textarea
                  rows={2}
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="Ex: Sem talher plástico, caprichar na maionese, sem cebola..."
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 resize-none ${
                    isLight
                      ? "bg-zinc-50 border-zinc-200 text-zinc-900"
                      : "bg-zinc-800 border-white/10 text-white placeholder-zinc-500"
                  }`}
                />
              </div>
            </div>

            {/* Rodapé Fixo do Modal de Produto (Quantidade + Botão Adicionar) */}
            <div
              className={`p-4 border-t flex items-center gap-3 shrink-0 ${
                isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-950 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-black text-white">{detailQty}</span>
                <button
                  type="button"
                  onClick={() => setDetailQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-between cursor-pointer active:scale-95"
              >
                <span>Adicionar ao Pedido</span>
                <span className="font-black">
                  R${" "}
                  {(
                    (detailItem.price + detailSelectedAddons.length * 4) *
                    detailQty
                  )
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL 2: SACOLA & CHECKOUT WHATSAPP */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl ${
              isLight ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-900 text-zinc-100 border-white/10"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-black flex items-center gap-2">
                <span>🛍️ Sua Sacola de Pedido</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCartModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tipo de Pedido: Entrega vs Retirada */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDeliveryMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isDeliveryMode
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-white/10 opacity-70"
                }`}
              >
                <span>🛵 Entrega (+R$ {deliveryFeeNumber.toFixed(2)})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeliveryMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !isDeliveryMode
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-white/10 opacity-70"
                }`}
              >
                <span>🏪 Retirar no Balcão</span>
              </button>
            </div>

            {/* Lista dos Itens na Sacola */}
            <div className="space-y-2 py-1">
              {Object.entries(cart).map(([id, data]) => {
                const item = cardapio.items.find((x) => x.id === id);
                if (!item) return null;
                const itemTotal = (item.price + data.addons.length * 4) * data.qty;
                return (
                  <div
                    key={id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black truncate">{item.name}</h4>
                      {data.addons.length > 0 && (
                        <p className="text-[10px] text-amber-400">
                          +{data.addons.join(", ")}
                        </p>
                      )}
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">
                        {data.qty}x R$ {item.price.toFixed(2)} = R$ {itemTotal.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10">
                      <button
                        onClick={() => handleUpdateCartQty(id, -1)}
                        className="w-6 h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-black">{data.qty}</span>
                      <button
                        onClick={() => handleUpdateCartQty(id, 1)}
                        className="w-6 h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cupom Aplicado na Sacola */}
            {isCouponApplied && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <span>🎟️</span>
                  <span>Cupom BEMVINDO10 (10% OFF)</span>
                </span>
                <span className="font-black">- R$ {couponDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Subtotal, Taxa e Total */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between opacity-70">
                <span>Subtotal:</span>
                <span className="font-semibold">R$ {subtotalCart.toFixed(2)}</span>
              </div>
              {isDeliveryMode && (
                <div className="flex justify-between opacity-70">
                  <span>Taxa de Entrega:</span>
                  <span className="text-emerald-400 font-semibold">
                    R$ {deliveryFeeNumber.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-white/10">
                <span>Total a Pagar:</span>
                <span className="text-emerald-400 font-black">
                  R$ {totalCart.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulário de Dados do Cliente */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block opacity-75 mb-1 font-semibold">Seu Nome:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {isDeliveryMode && (
                <div>
                  <label className="block opacity-75 mb-1 font-semibold">
                    Endereço de Entrega Completo:
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, bairro e ponto de referência"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block opacity-75 mb-1 font-semibold">Forma de Pagamento:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Pix">PIX (Chave enviada no WhatsApp)</option>
                  <option value="Cartão">Cartão na Entrega (Maquininha)</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block opacity-75 mb-1 font-semibold">Observações Gerais:</label>
                <input
                  type="text"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ex: Troco para 50, tocar interfone..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Botão de Envio WhatsApp */}
            <button
              type="button"
              onClick={handleCheckoutWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Concluir Pedido no WhatsApp</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* 13. MODAL 3: CLUBE DE FIDELIDADE */}
      {isLoyaltyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/10 p-5 space-y-4 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black text-sm flex items-center gap-2">
                <span>🎁 Clube de Fidelidade</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLoyaltyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="opacity-80">
                A cada <strong>R$ 1,00</strong> em compras você ganha <strong>1 ponto</strong>.
              </p>
              <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-1">
                <div className="font-bold text-amber-300">Prêmios para Resgate:</div>
                <div className="text-[11px] opacity-75">• 50 pts: Bebida ou Sobremesa Grátis</div>
                <div className="text-[11px] opacity-75">• 100 pts: R$ 15,00 de Desconto no Pedido</div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] opacity-75 mb-1">
                  Consulte seus pontos pelo WhatsApp:
                </label>
                <input
                  type="tel"
                  value={loyaltyPhone}
                  onChange={(e) => setLoyaltyPhone(e.target.value)}
                  placeholder="(DDD) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <Button
              onClick={handleCheckLoyalty}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-md"
            >
              Verificar Saldo
            </Button>

            {loyaltyResultText && (
              <div className="text-center text-xs text-purple-300 font-bold pt-1">
                {loyaltyResultText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
