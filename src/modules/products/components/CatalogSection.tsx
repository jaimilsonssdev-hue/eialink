import { useState } from "react";
import { ArrowUpRight, ImageOff, PackageOpen, ShoppingCart, Minus, Plus, X, Sparkles, ChevronRight } from "lucide-react";
import type { CatalogItem } from "../types";
import { safeExternalUrl } from "@/lib/safe-url";

export function CatalogSection({ items, whatsapp }: { items: CatalogItem[]; whatsapp?: string | null }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const activeItems = items.filter((item) => item.active);
  if (!activeItems.length) return null;

  const cartItems = activeItems.filter((item) => (cart[item.id] ?? 0) > 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0);
  const total = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.id] ?? 0), 0);

  const checkout = () => {
    if (!whatsapp) return;
    const lines = cartItems.map(
      (item) =>
        `• ${item.name} x${cart[item.id]}${
          item.price != null ? ` — R$ ${(item.price * (cart[item.id] ?? 0)).toFixed(2).replace(".", ",")}` : ""
        }`
    );
    const message = `Olá! Gostaria de fazer este pedido:\n\n${lines.join("\n")}\n\n*Total: R$ ${total
      .toFixed(2)
      .replace(".", ",")}*`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="my-6 space-y-3.5" aria-label="Produtos e Cardápio">
      {/* Cabeçalho da Seção com Dica de Rolagem Lateral */}
      <div className="flex items-end justify-between px-1">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            <Sparkles size={12} className="text-primary" /> Destaques & Cardápio
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            Nossos Produtos & Sabores
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <span>{activeItems.length} opções</span>
          <ChevronRight size={14} className="text-muted-foreground/70" />
        </div>
        <span className="sm:hidden text-[11px] text-muted-foreground font-medium flex items-center gap-0.5">
          <span>Deslize</span> <ChevronRight size={12} />
        </span>
      </div>

      {/* FEED HORIZONTAL / CARROSSEL COM TOUCH SNAP */}
      <div className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-3 pt-1 px-1">
        {activeItems.map((item) => {
          const href = safeExternalUrl(item.button_url);
          const quantity = cart[item.id] ?? 0;

          return (
            <article
              key={item.id}
              className="group relative snap-start w-[250px] sm:w-[280px] shrink-0 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-200 flex flex-col justify-between overflow-hidden p-3"
            >
              {/* Mídia do Produto */}
              <div>
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-muted/40 shrink-0 mb-2.5">
                  <CatalogImage imageUrl={item.image_url} name={item.name} />
                  <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/15">
                    {item.category || (item.type === "product" ? "Produto" : "Especial")}
                  </span>
                </div>

                {/* Informações */}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2rem]">
                      {item.description}
                    </p>
                  )}
                  {item.price !== null && (
                    <p className="text-sm font-extrabold text-primary pt-0.5">
                      {item.price > 0 ? `R$ ${item.price.toFixed(2).replace(".", ",")}` : "Sob Consulta"}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-col gap-1.5">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-all"
                  >
                    <span>{item.button_label || "Ver Detalhes"}</span>
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}

                {quantity > 0 ? (
                  <div className="flex items-center justify-between bg-primary/15 border border-primary/30 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setCart((c) => ({ ...c, [item.id]: Math.max(0, quantity - 1) }))}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-card text-foreground hover:bg-muted transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-xs font-extrabold text-primary tabular-nums">
                      {quantity} no pedido
                    </span>
                    <button
                      type="button"
                      onClick={() => setCart((c) => ({ ...c, [item.id]: quantity + 1 }))}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCart((current) => ({ ...current, [item.id]: 1 }))}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <ShoppingCart size={14} />
                    <span>Adicionar ao Pedido</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* BARRA FIXA OU RESUMO FLUTUANTE DO PEDIDO */}
      {cartItems.length > 0 && (
        <aside
          className="rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl p-4 shadow-xl space-y-3 transition-all animate-in fade-in slide-in-from-bottom-2"
          aria-label="Resumo do Pedido"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <ShoppingCart size={16} />
              </span>
              <div>
                <strong className="text-xs sm:text-sm font-bold text-foreground block">
                  Seu Pedido ({totalItemsCount} {totalItemsCount === 1 ? "item" : "itens"})
                </strong>
                <span className="text-[11px] text-muted-foreground">Pronto para enviar no WhatsApp</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCart({})}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Limpar carrinho"
            >
              <X size={14} />
              <span>Limpar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1">
                <span className="font-medium text-foreground truncate max-w-[180px]">
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-bold tabular-nums">
                    {cart[item.id]}x
                  </span>
                  {item.price != null && (
                    <span className="text-foreground font-bold tabular-nums">
                      R$ {(item.price * (cart[item.id] ?? 0)).toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm font-extrabold text-foreground">
            <span>Total do Pedido:</span>
            <span className="text-primary text-base font-black">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {whatsapp ? (
            <button
              type="button"
              onClick={checkout}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg active:scale-98"
            >
              <ShoppingCart size={16} />
              <span>Finalizar Pedido no WhatsApp</span>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Configure um WhatsApp na página para receber os pedidos.
            </p>
          )}
        </aside>
      )}
    </section>
  );
}

function CatalogImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
        <PackageOpen size={24} aria-hidden="true" />
      </div>
    );
  }
  if (failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"
        aria-label={`Imagem indisponível para ${name}`}
      >
        <ImageOff size={22} aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}
