import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import { SoundAlertService } from "@/modules/comanda/services/SoundAlertService";
import type { ComandaOrder } from "@/modules/comanda/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/comanda/cozinha")({
  component: KitchenKdsPage,
  head: () => ({ meta: [{ title: "Cozinha KDS — Comanda Digital" }] }),
});

function KitchenKdsPage() {
  const [bioPages, setBioPages] = useState<{ id: string; display_name: string; slug: string }[]>([]);
  const [selectedBioId, setSelectedBioId] = useState("");
  const [orders, setOrders] = useState<ComandaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);

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

  // Busca pedidos da cozinha periodicamente a cada 5 segundos
  useEffect(() => {
    if (!selectedBioId) return;

    let isMounted = true;

    const fetchKitchen = async () => {
      try {
        const res = await ComandaService.listKitchenDashboard(selectedBioId);
        if (!isMounted) return;

        setOrders(res.orders);

        // Se chegaram novos pedidos para a cozinha, toca o som
        if (res.orders.length > prevCountRef.current && soundEnabled) {
          SoundAlertService.playKitchenNewOrderChime();
        }
        prevCountRef.current = res.orders.length;
      } catch (err) {
        console.warn("Erro ao buscar fila da cozinha:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchKitchen();
    const interval = setInterval(fetchKitchen, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedBioId, soundEnabled]);

  // Marcar pedido como pronto
  async function handleMarkReady(orderId: string) {
    try {
      await ComandaService.updateOrderStatus(orderId, "ready", selectedBioId);
      SoundAlertService.playOrderReadyChime();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "ready" } : o)),
      );
      toast.success("Pedido pronto! Garçom foi notificado para levar à mesa.");
    } catch (err) {
      toast.error("Erro ao atualizar status do pedido.");
    }
  }

  function getTimeAgo(dateStr: string) {
    const mins = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
    if (mins === 0) return "Agora mesmo";
    if (mins === 1) return "1 min atrás";
    return `${mins} min atrás`;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 space-y-6">
      {/* Topo do KDS */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ChefHat className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Cozinha & Produção (KDS)
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {orders.length} na fila
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Fila de pratos em tempo real por ordem de chegada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Restaurante */}
          <select
            value={selectedBioId}
            onChange={(e) => setSelectedBioId(e.target.value)}
            className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {bioPages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.display_name}
              </option>
            ))}
          </select>

          {/* Toggle de Alerta Sonoro */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) SoundAlertService.playKitchenNewOrderChime();
            }}
            className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              soundEnabled
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4" /> Som Ativo
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Mudo
              </>
            )}
          </button>
        </div>
      </header>

      {/* Grid de Pedidos */}
      {orders.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-zinc-800 text-center space-y-3 max-w-md mx-auto my-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-zinc-300">
            Fila Limpa!
          </h2>
          <p className="text-xs text-zinc-500">
            Nenhum pedido em aberto para a cozinha no momento. Quando um cliente ou garçom enviar pedidos, eles aparecerão aqui com alerta sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const isReady = order.status === "ready";

            return (
              <div
                key={order.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-md transition-all ${
                  isReady
                    ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                    : "border-zinc-800 bg-zinc-900/90"
                }`}
              >
                {/* Header do Card */}
                <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-amber-500 text-black font-black text-sm tracking-wide">
                      MESA {order.table_number}
                    </span>
                    {order.waiter_name && (
                      <span className="text-xs text-zinc-400">
                        {order.waiter_name}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {getTimeAgo(order.created_at)}
                  </span>
                </div>

                {/* Lista de Itens do Pedido */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 border-b border-zinc-800/40 pb-2 last:border-0"
                      >
                        <div className="text-sm font-semibold text-white">
                          <span className="text-amber-400 font-black font-mono mr-1.5 text-base">
                            {item.quantity}x
                          </span>
                          <span>{item.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observação / Personalização */}
                  {order.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                      ⚠️ <b>Obs:</b> {order.notes}
                    </div>
                  )}

                  {order.customer_name && (
                    <p className="text-[11px] text-zinc-500">
                      Cliente: {order.customer_name}
                    </p>
                  )}
                </div>

                {/* Ação */}
                <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20">
                  {isReady ? (
                    <div className="py-2.5 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Pronto! Aguardando Garçom Levar</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Check className="h-4 w-4" />
                      <span>PRONTO PARA ENTREGA</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

