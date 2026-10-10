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
  ExternalLink,
  Bike,
  CheckCircle2,
  ChevronRight,
  Info,
  X,
  CreditCard,
  Banknote,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CardapioData, CardapioItem } from "./cardapioAiService";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";

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
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [selectedItem, setSelectedItem] = useState<CardapioItem | null>(null);
  const [itemNotes, setItemNotes] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [deliveryCep, setDeliveryCep] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryComplement, setDeliveryComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [changeFor, setChangeFor] = useState("");
  const [calculatedFee, setCalculatedFee] = useState<number>(
    parseFloat(String(cardapio.deliveryFee).replace(/[^0-9,.]/g, "").replace(",", ".")) || 7.0
  );
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Simular busca de CEP real via ViaCEP
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
          // Taxa estimada proporcional ou base fixa
          setCalculatedFee((prev) => (prev > 0 ? prev : 8.5));
        }
      } catch (err) {
        console.warn("Falha na consulta do CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  }

  // Carrinho
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

  const subtotalCart = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, qty]) => {
      const item = cardapio.items.find((it) => it.id === id);
      return acc + (item?.price || 0) * qty;
    }, 0);
  }, [cart, cardapio.items]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }, [cart]);

  const totalFinal = subtotalCart + (totalCartCount > 0 ? calculatedFee : 0);

  // Filtros de busca e categoria
  const filteredItems = useMemo(() => {
    return cardapio.items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === "todos") return true;
      if (activeCategory === "destaques") return item.isPopular || item.badge;
      return item.category === activeCategory;
    });
  }, [cardapio.items, activeCategory, searchQuery]);

  // Mensagem final formatada para o WhatsApp
  function generateWhatsappMessage(): string {
    const itemsList = Object.entries(cart)
      .map(([id, qty]) => {
        const it = cardapio.items.find((x) => x.id === id);
        return `• *${qty}x* ${it?.name} - R$ ${((it?.price || 0) * qty).toFixed(2).replace(".", ",")}`;
      })
      .join("\n");

    const paymentText =
      paymentMethod === "pix"
        ? "PIX"
        : paymentMethod === "cartao"
        ? "Cartão (Levar maquininha)"
        : `Dinheiro${changeFor ? ` (Troco para R$ ${changeFor})` : " (Sem troco)"}`;

    return [
      `🍔 *NOVO PEDIDO - ${cardapio.restaurantName.toUpperCase()}*`,
      `---------------------------------`,
      `*Cliente:* ${customerName || "Cliente do Cardápio"}`,
      `*Endereço:* ${deliveryAddress || "A retirar no balcão"}${deliveryNumber ? `, Nº ${deliveryNumber}` : ""}${deliveryComplement ? ` (${deliveryComplement})` : ""}`,
      `---------------------------------`,
      `*ITENS DO PEDIDO:*`,
      itemsList,
      `---------------------------------`,
      `*Subtotal:* R$ ${subtotalCart.toFixed(2).replace(".", ",")}`,
      `*Taxa de Entrega:* R$ ${calculatedFee.toFixed(2).replace(".", ",")}`,
      `*TOTAL:* R$ ${totalFinal.toFixed(2).replace(".", ",")}`,
      `---------------------------------`,
      `*Pagamento:* ${paymentText}`,
      itemNotes ? `*Observações:* ${itemNotes}\n---------------------------------` : "",
      `_Pedido feito via cardápio digital EiaLink_`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const cleanPhone = (cardapio.whatsapp || "").replace(/\D/g, "");
  const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(generateWhatsappMessage())}`;

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans pb-28 selection:bg-orange-500 selection:text-white">
      {isDemo && <DemoConversionBanner companyName={companyName} />}

      {/* Topo / Capa do Estabelecimento */}
      <header className="relative bg-gradient-to-b from-orange-950/70 via-zinc-900 to-zinc-950 border-b border-white/10 pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wide uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aberto para Pedidos
                </span>
                <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Delivery Oficial
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {cardapio.restaurantName}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                {cardapio.tagline || cardapio.description}
              </p>
            </div>
          </div>

          {/* Badges de Informações e Horários */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
            {cardapio.openingHours && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
                {cardapio.openingHours}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl">
              <Bike className="h-3.5 w-3.5 text-orange-400" />
              Taxa: R$ {calculatedFee.toFixed(2).replace(".", ",")}
            </span>
            {cardapio.address && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                {cardapio.address}
              </span>
            )}
          </div>

          {/* 🔍 Barra de Busca em Tempo Real */}
          <div className="mt-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por prato, lanche, ingrediente ou bebida..."
              className="pl-10 pr-10 h-11 bg-zinc-900/90 border-white/15 focus-visible:border-orange-500 rounded-2xl text-sm placeholder:text-zinc-500 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Categorias Roláveis (Tabs estilo iFood) */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 py-3 px-4 shadow-lg shadow-black/40">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {cardapio.categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/5"
                }`}
              >
                <span>{cat.icon || "🍽️"}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listagem de Pratos */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
            <Search className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Nenhum prato encontrado</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Tente buscar por outro termo ou escolha outra categoria acima.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const quantity = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="group bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/30 rounded-2xl p-4 transition-all duration-200 flex gap-4 items-center justify-between shadow-sm"
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                      {item.name}
                    </h3>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {item.badge}
                      </span>
                    )}
                    {item.isPopular && !item.badge && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⭐ Mais Vendido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2.5 text-sm sm:text-base font-black text-orange-400">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>

                {/* Foto do Prato e Ação */}
                <div className="relative shrink-0 flex flex-col items-end gap-2">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-white/10 shadow-inner group-hover:scale-[1.02] transition-transform"
                    />
                  )}

                  {quantity === 0 ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
                    >
                      Pedir +
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-orange-500/50 rounded-xl p-1 shadow-md">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 grid place-items-center text-xs font-bold text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-orange-400 px-1.5">
                        {quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="h-6 w-6 rounded-lg bg-orange-600 hover:bg-orange-500 grid place-items-center text-xs font-bold text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Barra Inferior Fixa da Sacola / Finalizar Pedido */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-3.5 sm:p-4 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <ShoppingBag className="h-3.5 w-3.5 text-orange-400" />
                <span>
                  {totalCartCount} {totalCartCount === 1 ? "item" : "itens"} na sacola
                </span>
              </div>
              <div className="text-lg font-black text-white">
                R$ {totalFinal.toFixed(2).replace(".", ",")}
                <span className="text-[11px] font-normal text-zinc-400 ml-1.5">
                  (com entrega)
                </span>
              </div>
            </div>

            <Button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 h-11 rounded-2xl shadow-lg shadow-emerald-600/30 text-sm flex items-center gap-2"
            >
              <span>Ver Pedido</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Checkout / Dados de Entrega e Pagamento */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-black text-white">Finalizar Pedido</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 grid place-items-center text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Resumo dos Itens */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Itens Selecionados
              </h4>
              <div className="bg-zinc-950/80 rounded-2xl p-3 border border-white/5 divide-y divide-white/5 space-y-2">
                {Object.entries(cart).map(([id, qty]) => {
                  const it = cardapio.items.find((x) => x.id === id);
                  if (!it) return null;
                  return (
                    <div key={id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{qty}x</span> {it.name}
                      </div>
                      <span className="font-bold text-orange-400">
                        R$ {((it.price || 0) * qty).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dados do Cliente e Entrega */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Endereço de Entrega
              </h4>

              <Input
                type="text"
                placeholder="Seu Nome Completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="CEP (ex: 01001-000)"
                    value={deliveryCep}
                    onChange={(e) => handleCepLookup(e.target.value)}
                    maxLength={9}
                    className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl"
                  />
                  {isSearchingCep && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-orange-400 animate-pulse">
                      Buscando...
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Número"
                  value={deliveryNumber}
                  onChange={(e) => setDeliveryNumber(e.target.value)}
                  className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl"
                />
              </div>

              <Input
                type="text"
                placeholder="Rua, Bairro e Cidade"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl"
              />

              <Input
                type="text"
                placeholder="Complemento / Ponto de Referência (opcional)"
                value={deliveryComplement}
                onChange={(e) => setDeliveryComplement(e.target.value)}
                className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl"
              />
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Forma de Pagamento
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === "pix"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <QrCode className="h-4 w-4 mb-1 text-emerald-400" />
                  PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cartao")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === "cartao"
                      ? "bg-orange-500/20 border-orange-500 text-orange-300 shadow-sm"
                      : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="h-4 w-4 mb-1 text-orange-400" />
                  Cartão
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("dinheiro")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === "dinheiro"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                      : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Banknote className="h-4 w-4 mb-1 text-amber-400" />
                  Dinheiro
                </button>
              </div>

              {paymentMethod === "dinheiro" && (
                <Input
                  type="text"
                  placeholder="Precisa de troco para quanto? (ex: 50)"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl mt-2"
                />
              )}
            </div>

            {/* Total Geral e Botão Final */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Subtotal</span>
                <span>R$ {subtotalCart.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Taxa de Entrega</span>
                <span>R$ {calculatedFee.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-white/5">
                <span>Total a Pagar</span>
                <span className="text-orange-400 text-base">
                  R$ {totalFinal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <Button
                asChild
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/30 mt-3 flex items-center justify-center gap-2"
              >
                <a href={waUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Confirmar e Enviar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

