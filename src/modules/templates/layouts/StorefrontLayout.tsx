import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Flame,
  Instagram,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { PublicLink } from "@/components/public-profile/types";
import type { TemplateRenderModel } from "../types";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import { parseCatalogItemCategory } from "@/modules/products/services/ProductService";
import type { CatalogItem } from "@/modules/products/types";

export class StorefrontLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "storefront" as const;
  }
  supports(model: TemplateRenderModel) {
    return model.template.layout === "storefront";
  }
  render(model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    return <StorefrontView model={model} ctx={ctx} />;
  }
}

interface ParsedProduct extends CatalogItem {
  cleanCategory: string;
  cleanDesc: string | null;
}

function StorefrontView({
  model: _model,
  ctx,
}: {
  model: TemplateRenderModel;
  ctx: LayoutRenderContext;
}) {
  const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;

  const activeItems = useMemo(() => products.filter((p) => p.active), [products]);

  // Separa produtos e serviços com categoria tratada
  const parsedProducts = useMemo<ParsedProduct[]>(() => {
    return activeItems
      .filter((i) => i.type === "product")
      .map((item) => {
        const { category, description } = parseCatalogItemCategory(item);
        return {
          ...item,
          cleanCategory: category || "Destaques",
          cleanDesc: description,
        };
      });
  }, [activeItems]);

  const serviceItems = useMemo(() => {
    return activeItems
      .filter((i) => i.type !== "product")
      .map((item) => {
        const { category, description } = parseCatalogItemCategory(item);
        return {
          ...item,
          cleanCategory: category || "Serviços",
          cleanDesc: description,
        };
      });
  }, [activeItems]);

  const secondaryLinks = useMemo(() => links.filter((l) => l.active), [links]);

  // Lista de categorias únicas para os tabs
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of parsedProducts) {
      if (p.cleanCategory) set.add(p.cleanCategory);
    }
    return Array.from(set);
  }, [parsedProducts]);

  // Estados do catálogo e carrinho
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados de fechamento do pedido no carrinho
  const [customerName, setCustomerName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
  const [orderNotes, setOrderNotes] = useState("");

  const whats = bio.whatsapp?.replace(/\D/g, "") || "";
  const insta = bio.instagram?.replace("@", "") || "";

  const socialData = (bio.social_links as Record<string, any>) || {};
  const googleRating = socialData.google_rating;
  const reviewsCount = socialData.reviews_count;
  const address = socialData.address;
  const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];

  // Itens filtrados
  const filteredProducts = useMemo(() => {
    return parsedProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.cleanCategory === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.cleanDesc && p.cleanDesc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.cleanCategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [parsedProducts, selectedCategory, searchQuery]);

  // Itens atualmente no carrinho
  const cartItems = useMemo(() => {
    return parsedProducts
      .filter((p) => (cart[p.id] ?? 0) > 0)
      .map((p) => ({
        ...p,
        quantity: cart[p.id] ?? 0,
        subtotal: (p.price ?? 0) * (cart[p.id] ?? 0),
      }));
  }, [parsedProducts, cart]);

  const totalCartCount = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + q, 0),
    [cart],
  );

  const totalCartPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems],
  );

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const currentQty = current[itemId] ?? 0;
      const nextQty = Math.max(0, currentQty + delta);
      if (nextQty === 0) {
        const copy = { ...current };
        delete copy[itemId];
        return copy;
      }
      return { ...current, [itemId]: nextQty };
    });
  };

  const handleCheckoutWhatsApp = () => {
    if (!whats) return;

    onTrack("order_checkout" as any);
    onTrack("whatsapp_click");

    const storeName = bio.display_name.trim();
    const formattedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const paymentLabel =
      paymentMethod === "pix"
        ? "⚡ Pix"
        : paymentMethod === "card"
        ? "💳 Cartão de Crédito/Débito"
        : "💵 Dinheiro / Troco";

    const deliveryLabel =
      deliveryType === "delivery"
        ? `🛵 Entrega (${deliveryAddress.trim() || "Endereço a informar"})`
        : "🏬 Retirada no Local";

    const lines: string[] = [];
    lines.push(`🛍️ *NOVO PEDIDO - ${storeName.toUpperCase()}*`);
    lines.push(`📅 _${formattedDate}_`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    if (customerName.trim()) {
      lines.push(`👤 *Cliente:* ${customerName.trim()}`);
    }
    lines.push(`📍 *Recebimento:* ${deliveryLabel}`);
    lines.push(`💳 *Pagamento:* ${paymentLabel}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📦 *ITENS DO PEDIDO:*`);

    cartItems.forEach((item) => {
      const unit =
        item.price !== null
          ? ` (R$ ${item.price.toFixed(2).replace(".", ",")} un)`
          : "";
      const itemSub =
        item.price !== null
          ? ` — R$ ${item.subtotal.toFixed(2).replace(".", ",")}`
          : "";
      lines.push(`• *${item.quantity}x* ${item.name}${unit}${itemSub}`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *VALOR TOTAL:* R$ ${totalCartPrice.toFixed(2).replace(".", ",")}`);

    if (orderNotes.trim()) {
      lines.push(`📝 *Observações:* ${orderNotes.trim()}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Pedido gerado pelo catálogo Eia Link. Aguardo confirmação!_ ✨`);

    const message = lines.join("\n");
    const url = `https://wa.me/${whats}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="niche-store relative min-h-screen pb-28">
      {/* 1. Header / Hero da Loja */}
      <header className="niche-store-hero">
        <div className="niche-store-hero-banner relative">
          {bio.cover_url ? (
            <img
              src={bio.cover_url}
              alt={`Capa da ${bio.display_name}`}
              className="niche-store-hero-img"
              loading="eager"
            />
          ) : (
            <img
              src="/template-assets/store-demo-cover.png"
              alt=""
              className="niche-store-hero-img"
              loading="eager"
            />
          )}
          <div className="niche-store-hero-gradient" aria-hidden />

          {/* Botões do Topo da Capa */}
          <div className="niche-store-top-actions">
            <span className="niche-store-status-pill">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Loja Aberta</span>
            </span>
            <button
              type="button"
              onClick={onShare}
              className="niche-store-share-btn"
              aria-label="Compartilhar catálogo"
            >
              <Share2 size={15} />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Perfil & Identidade da Loja */}
        <div className="niche-store-profile-wrap max-w-2xl mx-auto px-4 -mt-12 relative z-10">
          <div className="niche-store-profile-card">
            <div className="flex items-start gap-3.5">
              {bio.avatar_url ? (
                <img
                  src={bio.avatar_url}
                  alt={bio.display_name}
                  className="niche-store-avatar-img"
                />
              ) : (
                <div className="niche-store-avatar-img niche-store-avatar-fallback">
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {bio.display_name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    title="Loja com atendimento verificado"
                  >
                    <ShieldCheck size={12} /> Verificada
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                  <Tag size={12} className="text-primary" /> Catálogo & Loja Online
                </p>
              </div>
            </div>

            {bio.description && (
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {bio.description}
              </p>
            )}

            {/* Badges de Destaque & Confiança */}
            <div className="niche-store-badges mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
              <span className="niche-store-badge">
                <Truck size={13} className="text-primary" /> Envio Rápido & Seguro
              </span>
              <span className="niche-store-badge">
                <MessageCircle size={13} className="text-emerald-500" /> Pedidos via WhatsApp
              </span>
              {googleRating && (
                <span className="niche-store-badge">
                  <Star size={13} className="text-amber-400 fill-amber-400" /> {googleRating}{" "}
                  {reviewsCount ? `(${reviewsCount})` : ""}
                </span>
              )}
              {insta && (
                <a
                  href={`https://instagram.com/${insta}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("instagram_click")}
                  className="niche-store-badge hover:border-primary/50 transition-colors"
                >
                  <Instagram size={13} className="text-pink-500" /> @{insta}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Barra de Busca e Navegação por Categorias */}
      {parsedProducts.length > 0 && (
        <section
          className="niche-store-catalog max-w-2xl mx-auto px-4 mt-6"
          aria-label="Catálogo de produtos"
        >
          {/* Campo de Busca Rápida */}
          <div className="relative mb-3.5">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos na loja..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-surface-elevated/70 border border-border focus:border-primary focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tabs / Pílulas de Categorias */}
          {categories.length > 0 && (
            <div className="niche-store-category-bar no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`niche-store-cat-pill ${
                  selectedCategory === "all" ? "is-active" : ""
                }`}
              >
                <Flame size={12} />
                <span>Todos</span>
                <span className="niche-store-cat-count">{parsedProducts.length}</span>
              </button>
              {categories.map((cat) => {
                const count = parsedProducts.filter((p) => p.cleanCategory === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`niche-store-cat-pill ${
                      selectedCategory === cat ? "is-active" : ""
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="niche-store-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cabeçalho da Seção */}
          <div className="flex items-center justify-between mt-3 mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package size={15} />
              <span>
                {selectedCategory === "all" ? "Todos os Produtos" : selectedCategory}
              </span>
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {/* Grade de Produtos Moderna */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border/80 bg-surface-elevated/20 p-6">
              <ShoppingBag size={32} className="mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-sm text-foreground">Nenhum produto encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente buscar com outro termo ou selecionar outra categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredProducts.map((item) => {
                const qtyInCart = cart[item.id] ?? 0;
                return (
                  <article key={item.id} className="niche-store-card group">
                    {/* Imagem do Produto */}
                    <div className="niche-store-card-media relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="niche-store-card-fallback" aria-hidden>
                          <ShoppingBag size={28} />
                        </div>
                      )}

                      {/* Tag de Categoria */}
                      {item.cleanCategory && (
                        <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white">
                          {item.cleanCategory}
                        </span>
                      )}

                      {/* Badge de Quantidade se já adicionado */}
                      {qtyInCart > 0 && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                          {qtyInCart} na sacola
                        </span>
                      )}
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="niche-store-card-body flex-1 flex flex-col justify-between p-3">
                      <div>
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                        {item.cleanDesc && (
                          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.cleanDesc}
                          </p>
                        )}
                      </div>

                      {/* Preço e Ação */}
                      <div className="mt-3 pt-2 border-t border-border/50">
                        {item.price !== null ? (
                          <div>
                            <p className="text-sm sm:text-base font-bold text-foreground">
                              R$ {item.price.toFixed(2).replace(".", ",")}
                            </p>
                            {item.price >= 30 && (
                              <p className="text-[10px] text-muted-foreground">
                                ou até 3x de R$ {(item.price / 3).toFixed(2).replace(".", ",")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-muted-foreground">
                            Sob consulta
                          </p>
                        )}

                        {/* Botão de Carrinho / Quantidade */}
                        <div className="mt-2.5">
                          {item.button_url ? (
                            <a
                              href={item.button_url}
                              target="_blank"
                              rel="noreferrer"
                              className="niche-store-btn-action w-full"
                            >
                              <span>{item.button_label || "Comprar"}</span>
                              <ArrowUpRight size={13} />
                            </a>
                          ) : qtyInCart === 0 ? (
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="niche-store-btn-action w-full flex items-center justify-center gap-1.5"
                            >
                              <ShoppingBag size={14} />
                              <span>Adicionar</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-1 text-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 rounded hover:bg-primary/20 text-primary font-bold transition-colors"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="font-bold text-primary px-2">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 rounded hover:bg-primary/20 text-primary font-bold transition-colors"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. Seção de Serviços e Procedimentos Adicionais (se houver) */}
      {serviceItems.length > 0 && (
        <section
          className="niche-store-services-wrap max-w-2xl mx-auto px-4 mt-8"
          aria-label="Serviços"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Serviços & Atendimentos
            </h2>
          </div>
          <div className="space-y-2">
            {serviceItems.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-primary block">
                    {svc.cleanCategory}
                  </span>
                  <p className="font-semibold text-sm text-foreground">{svc.name}</p>
                  {svc.cleanDesc && (
                    <p className="text-xs text-muted-foreground mt-0.5">{svc.cleanDesc}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {svc.price !== null && (
                    <p className="font-bold text-sm text-foreground">
                      R$ {svc.price.toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  {svc.button_url ? (
                    <a
                      href={svc.button_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1"
                    >
                      <span>{svc.button_label}</span>
                      <ArrowUpRight size={12} />
                    </a>
                  ) : whats ? (
                    <a
                      href={`https://wa.me/${whats}?text=${encodeURIComponent(
                        `Olá! Gostaria de agendar ou tirar dúvidas sobre o serviço: ${svc.name}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                    >
                      <MessageCircle size={12} />
                      <span>Contratar</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Avaliações de Clientes / Prova Social (se houver) */}
      {testimonials.length > 0 && (
        <section
          className="max-w-2xl mx-auto px-4 mt-8"
          aria-label="Depoimentos de clientes"
        >
          <div className="text-center mb-3.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
              Opinião de Quem Compra
            </span>
            <h2 className="text-base font-bold text-foreground">Depoimentos de Clientes</h2>
          </div>
          <div className="grid gap-2.5">
            {testimonials.slice(0, 3).map((rev: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-card border border-border/80 shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {rev.author ? rev.author.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{rev.author}</h4>
                    <div className="flex text-amber-400 text-xs">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Contato, Links Adicionais & Pix */}
      <section className="max-w-2xl mx-auto px-4 mt-8 space-y-4" aria-label="Contato e Links">
        {(secondaryLinks.length > 0 || whats || insta || address) && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Atendimento & Contato
            </h2>

            {whats && (
              <a
                href={whatsappUrl(bio.whatsapp, bio.whatsapp_message || "Olá! Gostaria de falar com a loja.")}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <span>{bio.whatsapp_button_label || "Chamar no WhatsApp"}</span>
                </span>
                <ArrowRight size={16} />
              </a>
            )}

            {secondaryLinks.map((link: PublicLink) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrack("link_click", link.id)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-surface-elevated border border-border text-foreground font-medium text-xs sm:text-sm transition-colors"
              >
                <span>{link.title}</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </a>
            ))}

            {address && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated/50 border border-border/70 text-xs text-muted-foreground">
                <MapPin size={15} className="text-primary shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            )}
          </div>
        )}

        {bio.pix_key && (
          <div className="niche-store-pix">
            <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
          </div>
        )}
      </section>

      {supplemental}

      {/* 6. Dock Flutuante do Carrinho (Sticky Bottom Bar) */}
      {totalCartCount > 0 && (
        <aside
          className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
          aria-label="Resumo do carrinho"
        >
          <div className="bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 pl-1">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <ShoppingBag size={20} />
                </div>
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-background">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] opacity-80 leading-none">Total da sacola</p>
                <p className="text-base font-bold leading-tight mt-0.5">
                  R$ {totalCartPrice.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md hover:opacity-95 transition-opacity"
            >
              <span>Ver Sacola</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      )}

      {/* 7. Modal / Drawer do Carrinho de Compras */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated/40">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                <h3 id="cart-modal-title" className="font-bold text-base text-foreground">
                  Sua Sacola ({totalCartCount} {totalCartCount === 1 ? "item" : "itens"})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCart({})}
                  className="text-xs text-muted-foreground hover:text-destructive font-medium px-2 py-1 rounded transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar carrinho"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Lista de Itens */}
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-surface-elevated/30"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <ShoppingBag size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.price !== null
                          ? `R$ ${item.price.toFixed(2).replace(".", ",")} un`
                          : "Sob consulta"}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-surface-elevated rounded text-muted-foreground hover:text-foreground"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-surface-elevated rounded text-muted-foreground hover:text-foreground"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -item.quantity)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Opções de Entrega */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/20 space-y-3">
                <p className="text-xs font-bold text-foreground">Como deseja receber?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      deliveryType === "delivery"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Truck size={14} />
                    <span>Entrega</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      deliveryType === "pickup"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MapPin size={14} />
                    <span>Retirar na Loja</span>
                  </button>
                </div>

                {deliveryType === "delivery" && (
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Endereço Completo de Entrega:
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade e ponto de referência"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/20 space-y-2.5">
                <p className="text-xs font-bold text-foreground">Forma de Pagamento:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      paymentMethod === "pix"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <QrCode size={13} />
                    <span>Pix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      paymentMethod === "card"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CreditCard size={13} />
                    <span>Cartão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      paymentMethod === "cash"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Dados do Cliente & Observações */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Seu Nome (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated/50 border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Observações / Tamanho / Cor:
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: Tamanho M, cor terracota, etc."
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated/50 border border-border focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Rodapé do Modal com Total e Botão de WhatsApp */}
            <div className="p-4 border-t border-border bg-surface-elevated/40 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Subtotal dos Produtos:</span>
                <span className="font-bold text-foreground">
                  R$ {totalCartPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {whats ? (
                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <MessageCircle size={18} />
                  <span>Enviar Pedido no WhatsApp</span>
                </button>
              ) : (
                <p className="text-xs text-center text-amber-500 font-medium">
                  WhatsApp não configurado nesta página para recebimento de pedidos.
                </p>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                <Check size={12} className="inline text-emerald-500 mr-1" />
                Seu pedido será enviado formatado diretamente no WhatsApp da loja para confirmação.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
