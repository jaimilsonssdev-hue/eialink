import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  MessageCircle,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { LojaData, LojaProductItem } from "./lojaAiService";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";

interface LojaPublicViewerProps {
  loja: LojaData;
  companyName: string;
  isDemo?: boolean;
}

export function LojaPublicViewer({
  loja,
  companyName,
  isDemo = false,
}: LojaPublicViewerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [selectedItem, setSelectedItem] = useState<LojaProductItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [itemNotes, setItemNotes] = useState("");

  // Modal de checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryCep, setDeliveryCep] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryComplement, setDeliveryComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Busca de CEP real via ViaCEP
  async function handleCepLookup(cepValue: string) {
    const cleanCep = cepValue.replace(/\D/g, "");
    setDeliveryCep(cleanCep);
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setDeliveryAddress(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
        }
      } catch (err) {
        console.warn("Falha na consulta de CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  }

  function addToCart(itemId: string) {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  }

  const filteredItems = useMemo(() => {
    return (loja.items || []).filter((item) => {
      const matchesCategory =
        activeCategory === "todos" || item.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [loja.items, activeCategory, searchQuery]);

  const cartTotalCount = useMemo(() => {
    return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return Object.entries(cart).reduce((acc, [itemId, qty]) => {
      const it = loja.items.find((i) => i.id === itemId);
      return acc + (it ? it.price * qty : 0);
    }, 0);
  }, [cart, loja.items]);

  const bgColor = loja.backgroundColor || "#09090b";
  const btnColor = loja.buttonColor || "#3b82f6";
  const isLightBg =
    bgColor.toLowerCase().startsWith("#f") ||
    bgColor.toLowerCase().startsWith("#e") ||
    bgColor === "#ffffff";

  // Gerar link e texto do WhatsApp
  function handleSendWhatsAppOrder() {
    if (cartTotalCount === 0) return;

    let msg = `🛍️ *NOVO PEDIDO - ${loja.storeName.toUpperCase()}*\n`;
    msg += `--------------------------------\n`;
    if (customerName) msg += `👤 *Cliente:* ${customerName}\n`;
    msg += `\n📦 *ITENS DO PEDIDO:*\n`;

    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = loja.items.find((i) => i.id === itemId);
      if (item) {
        msg += `• ${qty}x *${item.name}* (R$ ${(item.price * qty).toFixed(2)})\n`;
      }
    });

    msg += `\n--------------------------------\n`;
    msg += `💰 *Subtotal:* R$ ${cartSubtotal.toFixed(2)}\n`;

    if (deliveryAddress) {
      msg += `📍 *Entrega:* ${deliveryAddress}`;
      if (deliveryNumber) msg += `, nº ${deliveryNumber}`;
      if (deliveryComplement) msg += ` (${deliveryComplement})`;
      if (deliveryCep) msg += ` - CEP: ${deliveryCep}`;
      msg += `\n`;
    }

    const payLabel =
      paymentMethod === "pix"
        ? "PIX"
        : paymentMethod === "cartao"
        ? "Cartão de Débito/Crédito"
        : "Dinheiro";
    msg += `💳 *Forma de Pagamento:* ${payLabel}\n`;

    if (itemNotes) {
      msg += `📝 *Observações:* ${itemNotes}\n`;
    }

    msg += `\n_Pedido gerado via Catálogo Digital EIA Link_`;

    const cleanPhone = (loja.whatsapp || "").replace(/\D/g, "");
    const targetPhone = cleanPhone.length >= 10 ? cleanPhone : "5511999999999";
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
  }

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 font-sans pb-28 ${
        isLightBg ? "text-zinc-900" : "text-zinc-100"
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Banner de Demonstração Interativa */}
      {isDemo && companyName && <DemoConversionBanner companyName={companyName} />}

      {/* Header da Loja */}
      <header className="relative border-b border-white/10 overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 relative z-10 flex flex-col items-center text-center">
          {loja.logoUrl ? (
            <div className="relative mb-4">
              <img
                src={loja.logoUrl}
                alt={loja.storeName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover shadow-2xl border-2 border-white/20 p-0.5 bg-black/40"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-blue-500 text-white rounded-full shadow-lg">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
          ) : (
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl border border-white/20"
              style={{ backgroundColor: btnColor }}
            >
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {loja.storeName || companyName}
          </h1>

          {loja.tagline && (
            <p className="mt-2 text-sm sm:text-base font-medium max-w-xl opacity-90">
              {loja.tagline}
            </p>
          )}

          {loja.description && (
            <p className="mt-1 text-xs sm:text-sm max-w-lg opacity-70">
              {loja.description}
            </p>
          )}

          {/* Badges de Destaque / Frete / Horário */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            {loja.shippingInfo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                <Truck className="h-3.5 w-3.5" />
                {loja.shippingInfo}
              </span>
            )}
            {loja.openingHours && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 opacity-90 border border-white/15">
                <Clock className="h-3.5 w-3.5" />
                {loja.openingHours}
              </span>
            )}
            {loja.address && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 opacity-90 border border-white/15">
                <MapPin className="h-3.5 w-3.5" />
                {loja.address}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Barra de Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos por nome ou detalhes..."
            className={`pl-10 h-11 rounded-xl text-sm ${
              isLightBg
                ? "bg-white border-zinc-200 text-zinc-900 shadow-sm"
                : "bg-zinc-900/90 border-white/10 text-zinc-100 placeholder:text-zinc-500"
            }`}
          />
        </div>

        {/* Categorias em Carrossel Horizontal */}
        {loja.categories && loja.categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {loja.categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm ${
                    isActive
                      ? "text-white shadow-md scale-[1.02]"
                      : isLightBg
                      ? "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      : "bg-zinc-900/80 text-zinc-300 border-white/10 hover:bg-zinc-800"
                  }`}
                  style={isActive ? { backgroundColor: btnColor, borderColor: btnColor } : {}}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grade de Produtos */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold">Nenhum produto encontrado</p>
            <p className="text-xs opacity-60 mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-xl ${
                    isLightBg
                      ? "bg-white border-zinc-200 hover:border-zinc-300"
                      : "bg-zinc-900/70 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Imagem do Produto */}
                  {item.image && (
                    <div
                      className="relative h-44 w-full overflow-hidden bg-zinc-800 cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        if (item.variations && item.variations.length > 0) {
                          setSelectedVariation(item.variations[0]);
                        }
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {item.badge && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-black/75 text-white backdrop-blur-md shadow-md border border-white/20">
                          {item.badge}
                        </span>
                      )}
                      {item.isPopular && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 text-black shadow-md">
                          ⭐ Destaque
                        </span>
                      )}
                    </div>
                  )}

                  {/* Informações */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {!item.image && item.badge && (
                        <span className="inline-block mb-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-white/10 border border-white/15">
                          {item.badge}
                        </span>
                      )}
                      <h3
                        className="text-base font-bold line-clamp-1 cursor-pointer hover:underline"
                        onClick={() => {
                          setSelectedItem(item);
                          if (item.variations && item.variations.length > 0) {
                            setSelectedVariation(item.variations[0]);
                          }
                        }}
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs opacity-70 line-clamp-2 mt-1">
                        {item.description}
                      </p>

                      {/* Variações rápidas (ex: P, M, G) */}
                      {item.variations && item.variations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {item.variations.map((v) => (
                            <span
                              key={v}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-medium"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preço e Botão Adicionar */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-xs opacity-50 block leading-tight">Valor</span>
                        <span className="text-lg font-extrabold tracking-tight">
                          R$ {Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/10">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="h-7 w-7 rounded-lg bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{qty}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="h-7 w-7 rounded-lg text-white flex items-center justify-center transition-colors shadow-sm"
                            style={{ backgroundColor: btnColor }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(item.id)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold text-white shadow-md hover:opacity-90"
                          style={{ backgroundColor: btnColor }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Barra Inferior Fixa do Carrinho */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm shadow-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all"
              style={{ backgroundColor: btnColor }}
            >
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-extrabold">
                  {cartTotalCount}
                </span>
                <span>Ver Carrinho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>R$ {cartSubtotal.toFixed(2)}</span>
                <ShoppingBag className="h-4 w-4 ml-1" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
              isLightBg ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-900 text-zinc-100 border-white/10"
            }`}
          >
            {selectedItem.image && (
              <div className="relative h-60 w-full bg-zinc-800">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-6">
              {!selectedItem.image && (
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              {selectedItem.image && (
                <h3 className="text-xl font-bold mb-2">{selectedItem.name}</h3>
              )}
              <p className="text-sm opacity-75 mb-4">{selectedItem.description}</p>

              {selectedItem.variations && selectedItem.variations.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs font-bold block mb-2 opacity-80">
                    Selecione a Variação:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.variations.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariation(v)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedVariation === v
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white/5 border-white/10 opacity-70 hover:opacity-100"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs opacity-50 block">Preço</span>
                  <span className="text-2xl font-extrabold">
                    R$ {Number(selectedItem.price).toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    addToCart(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className="h-11 px-6 rounded-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: btnColor }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalização do Pedido (Checkout WhatsApp) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border ${
              isLightBg ? "bg-white text-zinc-900 border-zinc-200" : "bg-zinc-950 text-zinc-100 border-white/15"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-bold">Seu Pedido</h2>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista dos Itens no Carrinho */}
            <div className="py-4 space-y-3">
              {Object.entries(cart).map(([itemId, qty]) => {
                const item = loja.items.find((i) => i.id === itemId);
                if (!item) return null;
                return (
                  <div
                    key={itemId}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex-1 mr-3">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs opacity-60">
                        {qty}x R$ {Number(item.price).toFixed(2)} = R${" "}
                        {(item.price * qty).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="h-7 w-7 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{qty}</span>
                      <button
                        onClick={() => addToCart(itemId)}
                        className="h-7 w-7 rounded-lg text-white flex items-center justify-center"
                        style={{ backgroundColor: btnColor }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dados de Entrega e Pagamento */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div>
                <label className="text-xs font-bold opacity-80 block mb-1">
                  Seu Nome Completo:
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Maria Clara"
                  className="h-10 text-xs bg-white/5 border-white/10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold opacity-80 block mb-1">
                    CEP de Entrega:
                  </label>
                  <Input
                    value={deliveryCep}
                    onChange={(e) => handleCepLookup(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="h-10 text-xs bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-80 block mb-1">
                    Número:
                  </label>
                  <Input
                    value={deliveryNumber}
                    onChange={(e) => setDeliveryNumber(e.target.value)}
                    placeholder="Ex: 120"
                    className="h-10 text-xs bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold opacity-80 block mb-1">
                  Endereço / Bairro:
                </label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, Bairro, Cidade"
                  className="h-10 text-xs bg-white/5 border-white/10 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold opacity-80 block mb-1">
                  Forma de Pagamento:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                      paymentMethod === "pix"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
                        : "bg-white/5 border-white/10 opacity-70"
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cartao")}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                      paymentMethod === "cartao"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500"
                        : "bg-white/5 border-white/10 opacity-70"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("dinheiro")}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                      paymentMethod === "dinheiro"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500"
                        : "bg-white/5 border-white/10 opacity-70"
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    Dinheiro
                  </button>
                </div>
              </div>
            </div>

            {/* Total e Botão de Envio WhatsApp */}
            <div className="pt-6 border-t border-white/10 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold opacity-70">Total do Pedido:</span>
                <span className="text-2xl font-extrabold">
                  R$ {cartSubtotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleSendWhatsAppOrder}
                className="w-full h-12 rounded-2xl font-bold text-sm text-white shadow-xl flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500"
              >
                <MessageCircle className="h-5 w-5" />
                Finalizar Pedido no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

