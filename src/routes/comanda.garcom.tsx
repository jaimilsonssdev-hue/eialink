import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Utensils,
  CheckCircle2,
  Clock,
  LogOut,
  Send,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import { SoundAlertService } from "@/modules/comanda/services/SoundAlertService";
import type { WaiterCall, ComandaOrder, WaiterProfile } from "@/modules/comanda/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/comanda/garcom")({
  component: WaiterAppPage,
  head: () => ({ meta: [{ title: "Painel do Garçom — Comanda Digital" }] }),
});

function WaiterAppPage() {
  const [bioPages, setBioPages] = useState<{ id: string; display_name: string; slug: string }[]>([]);
  const [selectedBioId, setSelectedBioId] = useState("");
  const [pin, setPin] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estado do garçom logado
  const [waiter, setWaiter] = useState<{ id: string; name: string; card_code: string; color: string } | null>(null);
  const [restaurantName, setRestaurantName] = useState("");

  // Chamados e Pedidos
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [orders, setOrders] = useState<ComandaOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCallsCountRef = useRef(0);

  // Carrega lista de restaurantes na inicialização
  useEffect(() => {
    supabase
      .from("bio_pages")
      .select("id, display_name, slug")
      .eq("published", true)
      .order("display_name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBioPages(data);
          setSelectedBioId(data[0].id);
        }
      });
  }, []);

  // Login do garçom com PIN
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBioId || pin.length < 4) {
      toast.error("Informe o PIN de 4 dígitos.");
      return;
    }
    setAuthenticating(true);
    setLoginError(null);
    try {
      const res = await ComandaService.waiterLogin(selectedBioId, pin);
      setWaiter(res.waiter);
      setRestaurantName(res.restaurantName);
      toast.success(`Bem-vindo, ${res.waiter.name}!`);
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : "PIN incorreto. Tente novamente.",
      );
    } finally {
      setAuthenticating(false);
    }
  }

  // Atualização periódica dos chamados e pedidos a cada 4 segundos
  useEffect(() => {
    if (!waiter || !selectedBioId) return;

    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const res = await ComandaService.listWaiterDashboard(selectedBioId, waiter.id);
        if (!isMounted) return;

        setCalls(res.calls);
        setOrders(res.orders);

        // Se houver novos chamados de mesa, toca o alarme
        if (res.calls.length > prevCallsCountRef.current && soundEnabled) {
          SoundAlertService.playWaiterCallChime();
        }
        prevCallsCountRef.current = res.calls.length;
      } catch (err) {
        console.warn("Erro ao buscar dados do garçom:", err);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      SoundAlertService.stopLoopingAlert();
    };
  }, [waiter, selectedBioId, soundEnabled]);

  // Atender chamado
  async function handleDismissCall(callId: string) {
    try {
      await ComandaService.dismissWaiterCall(callId, selectedBioId);
      setCalls((prev) => prev.filter((c) => c.id !== callId));
      SoundAlertService.stopLoopingAlert();
      toast.success("Chamado atendido!");
    } catch (err) {
      toast.error("Erro ao atender chamado.");
    }
  }

  // Aprovar pedido e mandar para a cozinha
  async function handleApproveOrder(orderId: string) {
    try {
      await ComandaService.updateOrderStatus(orderId, "in_kitchen", selectedBioId);
      SoundAlertService.playKitchenNewOrderChime();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "in_kitchen" } : o)),
      );
      toast.success("Pedido aprovado e enviado para a cozinha!");
    } catch (err) {
      toast.error("Erro ao aprovar pedido.");
    }
  }

  // Marcar pedido pronto como entregue na mesa
  async function handleDeliverOrder(orderId: string) {
    try {
      await ComandaService.updateOrderStatus(orderId, "delivered", selectedBioId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Pedido entregue na mesa!");
    } catch (err) {
      toast.error("Erro ao atualizar entrega.");
    }
  }

  // Cancelar pedido
  async function handleCancelOrder(orderId: string) {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
    try {
      await ComandaService.updateOrderStatus(orderId, "cancelled", selectedBioId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Pedido cancelado.");
    } catch (err) {
      toast.error("Erro ao cancelar.");
    }
  }

  // Tela 1: Login do Garçom por PIN
  if (!waiter) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Utensils className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Painel do Atendente
            </h1>
            <p className="text-xs text-zinc-400">
              Acesse suas comandas e chamados de mesa em tempo real.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Restaurante */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Restaurante / Estabelecimento
              </label>
              <select
                value={selectedBioId}
                onChange={(e) => setSelectedBioId(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {bioPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN de 4 dígitos */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Seu PIN (4 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-center font-mono text-2xl tracking-widest text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authenticating || pin.length < 4}
              className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Entrar no Meu Turno
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela 2: Dashboard do Garçom Logado
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 pb-20 space-y-6 max-w-lg mx-auto">
      {/* Header do Garçom */}
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold text-sm">
            {waiter.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{waiter.name}</h2>
            <p className="text-[11px] text-zinc-400">{restaurantName || "Restaurante"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternar som */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) SoundAlertService.playWaiterCallChime();
            }}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${
              soundEnabled
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
            title={soundEnabled ? "Som Ativo" : "Som Desativado"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Sair */}
          <button
            type="button"
            onClick={() => {
              setWaiter(null);
              setPin("");
              SoundAlertService.stopLoopingAlert();
            }}
            className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors"
            title="Sair do Turno"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Seção 1: Chamados de Mesa Urgentes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Chamados de Mesa ({calls.length})
            </h3>
          </div>
          {calls.length > 0 && (
            <span className="animate-pulse px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              Alerta Ativo
            </span>
          )}
        </div>

        {calls.length === 0 ? (
          <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center text-xs text-zinc-500">
            Nenhuma mesa chamando no momento.
          </div>
        ) : (
          <div className="space-y-2.5">
            {calls.map((call) => (
              <div
                key={call.id}
                className="p-4 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 shadow-lg space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-xs">
                      MESA {call.table_number}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {call.reason}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(call.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissCall(call.id)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Estou a Caminho (Atender)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seção 2: Pedidos da Comanda */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Pedidos das Mesas ({orders.length})
            </h3>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center text-xs text-zinc-500">
            Nenhum pedido aberto no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isPending = order.status === "pending_waiter";
              const isInKitchen = order.status === "in_kitchen";
              const isReady = order.status === "ready";

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border bg-zinc-900 shadow-sm space-y-3 ${
                    isReady
                      ? "border-emerald-500 bg-emerald-500/[0.08]"
                      : isPending
                      ? "border-purple-500/50"
                      : "border-zinc-800"
                  }`}
                >
                  {/* Topo do Pedido */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                        MESA {order.table_number}
                      </span>
                      {order.customer_name && (
                        <span className="text-xs text-zinc-400">
                          {order.customer_name}
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                        Aguardando Garçom
                      </span>
                    )}
                    {isInKitchen && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                        Em Preparo (Cozinha)
                      </span>
                    )}
                    {isReady && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black animate-pulse">
                        Pronto para Entrega!
                      </span>
                    )}
                  </div>

                  {/* Itens do Pedido */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-zinc-300">
                        <span>
                          <b className="text-purple-400 font-mono">{item.quantity}x</b>{" "}
                          {item.title}
                        </span>
                        <span className="font-mono text-zinc-400">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  {order.notes && (
                    <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      📝 Obs: {order.notes}
                    </p>
                  )}

                  {/* Total e Ações */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <span className="text-xs text-zinc-400 font-medium">
                      Total:{" "}
                      <b className="text-emerald-400 font-mono text-sm">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(order.total)}
                      </b>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400"
                            title="Recusar pedido"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all active:scale-95"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Mandar Cozinha</span>
                          </button>
                        </>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleDeliverOrder(order.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-md transition-all active:scale-95"
                        >
                          <Check className="h-4 w-4" />
                          <span>Entregar na Mesa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

