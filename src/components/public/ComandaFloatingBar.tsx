import { useState, useEffect } from "react";
import {
  Bell,
  Utensils,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import type { ComandaItem } from "@/modules/comanda/types";

interface ComandaFloatingBarProps {
  bioPageId: string;
  products?: Array<{
    id: string;
    name: string;
    price: number | null;
    description?: string | null;
    image_url?: string | null;
  }>;
}

export function ComandaFloatingBar({ bioPageId, products = [] }: ComandaFloatingBarProps) {
  const [tableParam, setTableParam] = useState<string | null>(null);
  const [waiterParam, setWaiterParam] = useState<string | null>(null);
  const [waiterIdParam, setWaiterIdParam] = useState<string | null>(null);

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Estados do Chamado de Garçom
  const [calling, setCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [selectedReason, setSelectedReason] = useState("Atendimento na Mesa");

  // Estados do Pedido da Comanda
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get("mesa");
    const garcom = params.get("garcom");
    const wid = params.get("wid");

    if (mesa || garcom) {
      setTableParam(mesa || "01");
      setWaiterParam(garcom || null);
      setWaiterIdParam(wid || null);
    }
  }, []);

  // Se o visitante não veio por QR Code/NFC de comanda (sem mesa e sem garçom), NÃO renderiza nada
  if (!tableParam && !waiterParam) {
    return null;
  }

  const callReasons = [
    "Atendimento na Mesa",
    "Pedir a Conta / Maquininha",
    "Gelo e Limão",
    "Dúvida no Cardápio",
  ];

  async function handleCallWaiter() {
    setCalling(true);
    try {
      await ComandaService.callWaiter({
        bioPageId,
        tableNumber: tableParam || "01",
        reason: selectedReason,
        waiterId: waiterIdParam,
        waiterName: waiterParam,
      });

      setCallSuccess(true);
      setTimeout(() => {
        setCallSuccess(false);
        setCallModalOpen(false);
      }, 3500);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao chamar garçom.",
      );
    } finally {
      setCalling(false);
    }
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      return copy;
    });
  }

  const cartItems: ComandaItem[] = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      if (!product) return null;
      return {
        product_id: id,
        title: product.name,
        price: product.price || 0,
        quantity: qty,
      };
    })
    .filter(Boolean) as ComandaItem[];

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido.");
      return;
    }
    setSubmittingOrder(true);
    try {
      await ComandaService.submitOrder({
        bioPageId,
        tableNumber: tableParam || "01",
        waiterId: waiterIdParam,
        waiterName: waiterParam,
        items: cartItems,
        customerName: customerName.trim() || undefined,
        notes: orderNotes.trim() || undefined,
      });

      setOrderSuccess(true);
      setCart({});
      setOrderNotes("");
      setTimeout(() => {
        setOrderSuccess(false);
        setOrderModalOpen(false);
      }, 3500);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar pedido.",
      );
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <>
      {/* Barra Flutuante Fixa no Rodapé */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
        <div className="rounded-2xl border border-white/20 bg-black/85 backdrop-blur-xl p-3 shadow-2xl text-white flex items-center justify-between gap-3">
          {/* Identificação da Mesa / Atendente */}
          <div className="flex items-center gap-2.5 pl-1 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Utensils className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-tight text-white truncate">
                Mesa {tableParam}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {waiterParam ? `Atendente: ${waiterParam}` : "Comanda Digital"}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            {/* Chamar Garçom */}
            <button
              type="button"
              onClick={() => setCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Chamar</span>
            </button>

            {/* Fazer Pedido */}
            <button
              type="button"
              onClick={() => setOrderModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Pedir</span>
              {cartCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-primary text-[10px] font-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Chamar Garçom */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Bell className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-sm text-foreground">
                  Chamar Atendente — Mesa {tableParam}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCallModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {callSuccess ? (
              <div className="py-6 text-center space-y-2 animate-in fade-in">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="font-bold text-base text-foreground">
                  Garçom Notificado!
                </h4>
                <p className="text-xs text-muted-foreground">
                  {waiterParam ? `${waiterParam}` : "O atendente"} já ouviu o alerta sonoro e está vindo até a sua mesa.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Escolha o motivo para avisarmos o garçom imediatamente:
                </p>

                <div className="space-y-2">
                  {callReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        selectedReason === reason
                          ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold"
                          : "border-border bg-background hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCallWaiter}
                  disabled={calling}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {calling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Tocando alarme do garçom...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      <span>Enviar Alerta para o Garçom</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Comanda / Fazer Pedido */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Utensils className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Comanda Digital — Mesa {tableParam}
                  </h3>
                  {waiterParam && (
                    <p className="text-[11px] text-muted-foreground">
                      Atendente responsável: {waiterParam}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo */}
            {orderSuccess ? (
              <div className="p-8 text-center space-y-3 animate-in fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-lg text-foreground">
                  Pedido Enviado com Sucesso!
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seus itens foram registrados na <b>Mesa {tableParam}</b>. O pedido já foi encaminhado para a equipe!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Lista de Produtos do Cardápio */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Selecione os itens do cardápio:
                  </p>

                  {products.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Nenhum produto cadastrado no catálogo desta empresa.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                      {products.map((product) => {
                        const qty = cart[product.id] || 0;
                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-background/50 hover:bg-background transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {product.name}
                              </p>
                              {product.price !== null && (
                                <p className="text-[11px] font-bold text-emerald-400 font-mono">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(product.price)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {qty > 0 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(product.id, -1)}
                                    className="h-7 w-7 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono text-xs font-bold w-5 text-center">
                                    {qty}
                                  </span>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, 1)}
                                className="h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-colors shadow-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Observações do Pedido */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground">
                    Observações do pedido (Opcional):
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex.: Sem cebola, gelo à parte..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Nome do Cliente */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Seu Nome (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex.: João"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Total e Botão de Enviar */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Total do Pedido:</span>
                    <span className="font-bold text-emerald-400 font-mono text-base">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(cartTotal)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={cartItems.length === 0 || submittingOrder}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enviando Pedido...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Confirmar e Enviar Pedido ({cartCount} {cartCount === 1 ? "item" : "itens"})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

