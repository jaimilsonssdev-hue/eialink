import { useState } from "react";
import { ArrowUpRight, ImageOff, PackageOpen, ShoppingCart, Minus, Plus, X } from "lucide-react";
import type { CatalogItem } from "../types";
import { safeExternalUrl } from "@/lib/safe-url";

export function CatalogSection({ items, whatsapp }: { items: CatalogItem[]; whatsapp?: string | null }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const activeItems = items.filter((item) => item.active);
  if (!activeItems.length) return null;
  const cartItems = activeItems.filter((item) => (cart[item.id] ?? 0) > 0);
  const total = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.id] ?? 0), 0);
  const checkout = () => {
    if (!whatsapp) return;
    const lines = cartItems.map((item) => `• ${item.name} x${cart[item.id]}${item.price != null ? ` — R$ ${(item.price * (cart[item.id] ?? 0)).toFixed(2).replace(".", ",")}` : ""}`);
    const message = `Olá! Gostaria de fazer este pedido:\n${lines.join("\n")}\nTotal: R$ ${total.toFixed(2).replace(".", ",")}`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  return (
    <section className="public-catalog" aria-label="Produtos e serviços">
      <p className="public-catalog-title">Produtos e serviços</p>
      <div className="public-catalog-grid">
        {activeItems.map((item) => {
          const href = safeExternalUrl(item.button_url);
          return (
            <article
              key={item.id}
              className={`public-catalog-card public-catalog-card-${item.type}`}
            >
              <CatalogImage imageUrl={item.image_url} name={item.name} />
              <div>
                <span className="public-catalog-type">
                  {item.type === "product" ? "Produto" : "Serviço"}
                </span>
                <p className="font-semibold">{item.name}</p>
                {item.description && <p className="mt-1 text-sm opacity-75">{item.description}</p>}
                {item.price !== null && (
                  <p className="mt-2 text-sm font-semibold">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${item.button_label}: ${item.name}`}
                >
                  <span>{item.button_label}</span>
                  <ArrowUpRight size={17} />
                </a>
              )}
              <button type="button" className="btn-secondary" onClick={() => setCart((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + 1 }))}><ShoppingCart size={16} /> Adicionar</button>
            </article>
          );
        })}
      </div>
      {cartItems.length > 0 && <aside className="card-surface mt-5 space-y-3" aria-label="Carrinho de compras"><div className="flex items-center justify-between"><strong className="flex items-center gap-2"><ShoppingCart size={18} /> Seu pedido</strong><button type="button" onClick={() => setCart({})} aria-label="Limpar carrinho"><X size={18} /></button></div>{cartItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 text-sm"><span>{item.name}</span><span className="flex items-center gap-2"><button type="button" onClick={() => setCart((c) => ({ ...c, [item.id]: Math.max(0, (c[item.id] ?? 1) - 1) }))}><Minus size={14} /></button>{cart[item.id]}<button type="button" onClick={() => setCart((c) => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }))}><Plus size={14} /></button></span></div>)}<div className="flex items-center justify-between border-t pt-3 font-semibold"><span>Total</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>{whatsapp ? <button type="button" className="btn-primary w-full" onClick={checkout}>Finalizar pedido no WhatsApp</button> : <p className="text-xs opacity-70">Configure um WhatsApp para receber pedidos.</p>}</aside>}
    </section>
  );
}

function CatalogImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl) return <PackageOpen aria-hidden="true" />;
  if (failed) {
    return (
      <span
        className="public-catalog-image-fallback"
        aria-label={`Imagem indisponível para ${name}`}
      >
        <ImageOff aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

