import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  Heart,
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
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Utensils,
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
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { formatPrice, parsePrice } from "@/lib/utils";

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

function readableTextColor(background?: string): string {
  if (!background) return "#ffffff";
  let hex = background.trim();
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const red = Number.parseInt(hex.slice(0, 2), 16) || 0;
    const green = Number.parseInt(hex.slice(2, 4), 16) || 0;
    const blue = Number.parseInt(hex.slice(4, 6), 16) || 0;
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    return luminance > 140 ? "#0f172a" : "#ffffff";
  }
  return "#ffffff";
}

function StorefrontView({
  model: _model,
  ctx,
}: {
  model: TemplateRenderModel;
  ctx: LayoutRenderContext;
}) {
  const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
  const socialData = (bio.social_links as Record<string, any>) || {};
  const navigationBg = socialData.custom_theme?.navigation_bg as string | undefined;
  const infoBadgeBg = socialData.custom_theme?.info_badge_bg as string | undefined;

  const companyName = bio.display_name.trim();
  const avatarImage = bio.avatar_url;

  // Detecção inteligente de nicho gastronômico/delivery vs loja em geral
  const rawNiche = ((bio.social_links as any)?.niche || "").toLowerCase();
  const isDelivery =
    rawNiche === "delivery" ||
    rawNiche === "hamburgueria" ||
    rawNiche === "pizzaria" ||
    rawNiche === "restaurante" ||
    rawNiche === "lanchonete" ||
    rawNiche === "acai" ||
    rawNiche === "sorveteria" ||
    rawNiche === "bebidas" ||
    bio.template_id === "store-showcase" ||
    bio.template_id === "storefront";

  const activeItems = useMemo(() => products.filter((p) => p.active), [products]);

  // Separa produtos e serviços com categoria tratada
  const parsedProducts = useMemo<ParsedProduct[]>(() => {
    return activeItems
      .filter((i) => i.type === "product")
      .map((item) => {
        const { category, description } = parseCatalogItemCategory(item);
        return {
          ...item,
          cleanCategory: category || (isDelivery ? "Mais Pedidos" : "Destaques"),
          cleanDesc: description,
        };
      });
  }, [activeItems, isDelivery]);

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
  const [coverImgError, setCoverImgError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados de fechamento do pedido no carrinho
  const [customerName, setCustomerName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const whats = bio.whatsapp?.replace(/\D/g, "") || "";
  const insta = bio.instagram?.replace("@", "") || "";

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
        subtotal: (parsePrice(p.price) ?? 0) * (cart[p.id] ?? 0),
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
        ? "⚡ Pix (Chave / QR Code)"
        : paymentMethod === "card"
        ? "💳 Cartão de Crédito/Débito (Levar Máquina)"
        : cashChangeFor.trim()
        ? `💵 Dinheiro (Troco para R$ ${cashChangeFor.trim()})`
        : "💵 Dinheiro (Não precisa de troco)";

    const deliveryLabel =
      deliveryType === "delivery"
        ? `🛵 Entrega (${deliveryAddress.trim() || "Endereço a combinar"})`
        : "🏬 Retirada no Balcão";

    const lines: string[] = [];
    const iconHeader = isDelivery ? "🍔" : "🛍️";
    lines.push(`${iconHeader} *NOVO PEDIDO - ${storeName.toUpperCase()}*`);
    lines.push(`📅 _${formattedDate}_`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    if (customerName.trim()) {
      lines.push(`👤 *Cliente:* ${customerName.trim()}`);
    }
    lines.push(`📍 *Modalidade:* ${deliveryLabel}`);
    lines.push(`💳 *Pagamento:* ${paymentLabel}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📦 *ITENS DO PEDIDO:*`);

    cartItems.forEach((item) => {
      const unit = formatPrice(item.price)
        ? ` (${formatPrice(item.price)} un)`
        : "";
      const itemSub = formatPrice(item.subtotal)
        ? ` — ${formatPrice(item.subtotal)}`
        : "";
      lines.push(`• *${item.quantity}x* ${item.name}${unit}${itemSub}`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *VALOR TOTAL:* ${formatPrice(totalCartPrice) ?? "R$ 0,00"}`);

    if (orderNotes.trim()) {
      lines.push(`📝 *Observações:* ${orderNotes.trim()}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Pedido gerado via Aplicativo Eia Link. Aguardo confirmação!_ ✨`);

    const message = lines.join("\n");
    const url = `https://wa.me/${whats}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const storeDifferentials =
    Array.isArray(socialData.differentials) && socialData.differentials.length > 0
      ? socialData.differentials
      : isDelivery
      ? [
          { title: "Entrega Ágil", desc: "Motoboy rápido e embalagem térmica", icon: "truck" },
          { title: "Ingredientes Frescos", desc: "Preparo artesanal com máxima qualidade", icon: "heart" },
          { title: "Pagamento Facilitado", desc: "Pix na hora ou maquininha na entrega", icon: "shield" },
          { title: "Atendimento WhatsApp", desc: "Acompanhe seu pedido em tempo real", icon: "bag" },
        ]
      : [
          { title: "Envio Seguro", desc: "Entrega ágil com rastreamento", icon: "truck" },
          { title: "Produtos Selecionados", desc: "Qualidade garantida e procedência", icon: "bag" },
          { title: "Compra 100% Segura", desc: "Pagamento facilitado no Pix e cartões", icon: "shield" },
          { title: "Atendimento Rápido", desc: "Tire suas dúvidas pelo WhatsApp", icon: "heart" },
        ];

  return (
    <div className="niche-store relative min-h-screen pb-32 overflow-x-hidden">
      {/* 0. Top Bar de Anúncios / Status Rápido */}
      <div className="bg-primary text-primary-foreground py-2 px-3 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {isDelivery
            ? "🛵 Pedidos Online com Entrega Ágil • Pix & Cartões • Peça Agora"
            : "✨ Envio Rápido • Pagamento Facilitado no Pix • Compre pelo WhatsApp"}
        </span>
      </div>

      {/* 1. Header do Delivery / Loja (Responsivo & Estilo App) */}
      <header className="niche-store-hero w-full">
        {/* Capa com altura nobre e imponente idêntica no mobile e desktop */}
        <div className="niche-store-hero-banner relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-muted">
          {!coverImgError && typeof bio.cover_url === "string" && bio.cover_url.trim().length > 5 ? (
            <img
              src={bio.cover_url.trim()}
              alt={`Capa de ${bio.display_name}`}
              className="w-full h-full object-cover"
              loading="eager"
              onError={() => setCoverImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary/30 via-primary/10 to-primary/20 flex items-center justify-center">
              {isDelivery ? (
                <Utensils className="h-12 w-12 text-primary/40" />
              ) : (
                <ShoppingBag className="h-12 w-12 text-primary/40" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" aria-hidden />

          {/* Botões do Topo da Capa */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isDelivery ? "Recebendo Pedidos" : "Loja Aberta"}</span>
            </span>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs hover:bg-black/80 transition-colors"
              aria-label="Compartilhar"
            >
              <Share2 size={13} />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Card do Perfil / Estabelecimento estilo App */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 -mt-8 sm:-mt-10 relative z-10">
          <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              {bio.avatar_url ? (
                <img
                  src={bio.avatar_url}
                  alt={bio.display_name}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-background shadow-md shrink-0 ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground truncate">
                    {bio.display_name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0"
                    title="Atendimento Verificado"
                  >
                    <ShieldCheck size={12} /> Oficial
                  </span>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium truncate">
                  <Tag size={12} className="text-primary shrink-0" />
                  <span>{isDelivery ? "Cardápio Digital & Delivery" : "Catálogo & Compras Online"}</span>
                </p>

                {/* Badges de Destaque / Avaliação / Tempo */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {isDelivery ? (
                      <>
                        <Clock size={12} /> 30-45 min
                      </>
                    ) : (
                      <>
                        <Truck size={12} /> Envio Rápido
                      </>
                    )}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      infoBadgeBg
                        ? "shadow-2xs"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    }`}
                    style={
                      infoBadgeBg
                        ? {
                            backgroundColor: infoBadgeBg,
                            color: readableTextColor(infoBadgeBg) || "#ffffff",
                            border: "none",
                          }
                        : undefined
                    }
                  >
                    {isDelivery ? (
                      <>
                        <Bike size={12} /> Entrega &amp; Retirada
                      </>
                    ) : (
                      <>
                        <Package size={12} /> Pronta Entrega
                      </>
                    )}
                  </span>

                  {googleRating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      <Star size={12} className="text-amber-400 fill-amber-400" /> {googleRating}{" "}
                      <span className="text-[10px] opacity-80">({reviewsCount})</span>
                    </span>
                  )}

                  {insta && (
                    <a
                      href={`https://instagram.com/${insta}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("instagram_click")}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/10 text-pink-500 border border-pink-500/25 hover:border-pink-500/50 transition-colors"
                    >
                      <Instagram size={12} /> @{insta}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {bio.description && (
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2.5 border-t border-border/50">
                {bio.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Banner de Instalação do Aplicativo PWA */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-3">
        <PwaInstallBanner companyName={companyName} avatarUrl={avatarImage} />
      </div>

      {/* Grid de Diferenciais */}
      <section className="max-w-4xl mx-auto px-3 sm:px-4 mt-3" aria-label="Diferenciais">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {storeDifferentials.slice(0, 4).map((diff: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl border border-border/80 bg-card/75 backdrop-blur-md p-2.5 sm:p-3 text-center flex flex-col items-center justify-center gap-1 shadow-2xs hover:border-primary/40 transition-all"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                {diff.icon === "shield" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : diff.icon === "bag" ? (
                  <ShoppingBag className="h-4 w-4" />
                ) : diff.icon === "heart" ? (
                  <Heart className="h-4 w-4" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">{diff.title}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-1">{diff.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Catálogo & Cardápio com Barra de Busca e Tabs Sticky */}
      {parsedProducts.length > 0 && (
        <section
          className="niche-store-catalog max-w-4xl mx-auto px-3 sm:px-4 mt-5"
          aria-label={isDelivery ? "Cardápio do Delivery" : "Catálogo de Produtos"}
        >
          {/* Campo de Busca Rápida */}
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isDelivery ? "Buscar lanches, pizzas, bebidas..." : "Buscar produtos na loja..."}
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors shadow-2xs"
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

          {/* Categorias Horizontais Sticky Estilo iFood */}
          {categories.length > 0 && (
            <div
              className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-border/40 shadow-xs mb-3"
              style={navigationBg ? { backgroundColor: navigationBg } : undefined}
            >
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto scroll-smooth">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`niche-store-cat-pill shrink-0 ${
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
                      className={`niche-store-cat-pill shrink-0 ${
                        selectedCategory === cat ? "is-active" : ""
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="niche-store-cat-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cabeçalho da Seção */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              {isDelivery ? <Utensils size={14} /> : <Package size={14} />}
              <span>
                {selectedCategory === "all"
                  ? isDelivery
                    ? "Cardápio Completo"
                    : "Todos os Produtos"
                  : selectedCategory}
              </span>
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {/* Grade / Lista de Produtos e Pratos */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-6">
              <ShoppingBag size={32} className="mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-sm text-foreground">Nenhum item encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente buscar por outro termo ou selecione outra categoria acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => {
                const qtyInCart = cart[item.id] ?? 0;
                return (
                  <article
                    key={item.id}
                    className="niche-store-card group w-full flex flex-col justify-between bg-card rounded-2xl sm:rounded-3xl border border-border/80 overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    {/* Imagem Nobre do Produto/Prato */}
                    <div className="niche-store-card-media relative aspect-4/3 bg-muted overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60 bg-linear-to-br from-primary/10 to-primary/5">
                          {isDelivery ? <Utensils size={36} /> : <ShoppingBag size={36} />}
                        </div>
                      )}

                      {item.cleanCategory && (
                        <span className="absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white shadow-xs">
                          {item.cleanCategory}
                        </span>
                      )}

                      {qtyInCart > 0 && (
                        <span className="absolute top-2.5 right-2.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
                          {qtyInCart} na sacola
                        </span>
                      )}
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                        {item.cleanDesc && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.cleanDesc}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60">
                        <div className="flex items-baseline justify-between mb-2.5">
                          {formatPrice(item.price) ? (
                            <div>
                              <p className="text-lg font-black text-foreground">
                                {formatPrice(item.price)}
                              </p>
                              {(parsePrice(item.price) ?? 0) >= 30 && (
                                <p className="text-[10px] text-muted-foreground">
                                  ou até 3x de {formatPrice((parsePrice(item.price) ?? 0) / 3)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-muted-foreground">
                              Sob consulta
                            </p>
                          )}
                        </div>

                        {/* Ações */}
                        {item.button_url ? (
                          <a
                            href={item.button_url}
                            target="_blank"
                            rel="noreferrer"
                            className="niche-store-btn-action w-full flex items-center justify-center gap-1.5 py-2.5"
                          >
                            <span>{item.button_label || (isDelivery ? "Pedir Agora" : "Comprar")}</span>
                            <ArrowUpRight size={14} />
                          </a>
                        ) : qtyInCart === 0 ? (
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="niche-store-btn-action w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
                          >
                            <Plus size={15} />
                            <span>{isDelivery ? "Adicionar ao Pedido" : "Adicionar à Sacola"}</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl p-1 text-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 rounded-lg hover:bg-primary/20 text-primary font-bold transition-colors"
                              aria-label="Diminuir"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-black text-primary px-3 text-xs">
                              {qtyInCart} na sacola
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 rounded-lg hover:bg-primary/20 text-primary font-bold transition-colors"
                              aria-label="Aumentar"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
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
          className="max-w-4xl mx-auto px-3 sm:px-4 mt-8"
          aria-label="Serviços & Atendimentos"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Serviços &amp; Atendimentos
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
                  {formatPrice(svc.price) && (
                    <p className="font-bold text-sm text-foreground">
                      {formatPrice(svc.price)}
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
                        `Olá! Gostaria de agendar ou tirar dúvidas sobre: ${svc.name}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                    >
                      <MessageCircle size={12} />
                      <span>Agendar</span>
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
          className="max-w-4xl mx-auto px-3 sm:px-4 mt-8"
          aria-label="Depoimentos de clientes"
        >
          <div className="text-center mb-3.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
              Avaliações Reais
            </span>
            <h2 className="text-base font-bold text-foreground">O Que Nossos Clientes Dizem</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* 5. Contato, Links & Pix */}
      <section className="max-w-4xl mx-auto px-3 sm:px-4 mt-8 space-y-4" aria-label="Contato e Links">
        {(secondaryLinks.length > 0 || whats || insta || address) && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Atendimento &amp; Localização
            </h2>

            {whats && (
              <a
                href={whatsappUrl(bio.whatsapp, bio.whatsapp_message || "Olá! Gostaria de falar com o atendimento.")}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrack("whatsapp_click")}
                className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <span>{bio.whatsapp_button_label || "Falar com Atendimento no WhatsApp"}</span>
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
                className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm transition-colors"
              >
                <span>{link.title}</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </a>
            ))}

            {address && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/70 text-xs text-muted-foreground">
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

      {/* 6. Dock Flutuante da Sacola (Bottom Bar Estilo iFood) */}
      {totalCartCount > 0 && (
        <aside
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
          aria-label="Resumo da sacola"
        >
          <div className="bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 pl-1">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <ShoppingBag size={20} />
                </div>
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-background">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] opacity-80 leading-none">Total da sacola</p>
                <p className="text-base font-black leading-tight mt-0.5">
                  {formatPrice(totalCartPrice) ?? "R$ 0,00"}
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

      {/* 7. Bottom-Sheet / Modal Deslizante da Sacola */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
        >
          <div className="w-full max-w-lg bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drag Handle para Mobile */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Cabeçalho */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
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
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar sacola"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Lista de Itens */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-muted/30"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {isDelivery ? <Utensils size={18} /> : <ShoppingBag size={18} />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatPrice(item.price)
                          ? `${formatPrice(item.price)} un`
                          : "Sob consulta"}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        aria-label="Diminuir"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        aria-label="Aumentar"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -item.quantity)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover item"
                      aria-label="Remover"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Opções de Recebimento (Entrega ou Retirada) */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                <p className="text-xs font-bold text-foreground">Como deseja receber seu pedido?</p>
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
                    <Bike size={14} />
                    <span>Entrega (Delivery)</span>
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
                    <span>Retirar no Balcão</span>
                  </button>
                </div>

                {deliveryType === "delivery" ? (
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Endereço Completo de Entrega:
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, bairro, complemento e ponto de referência"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg">
                    📍 {address || "Você retirará o pedido diretamente no balcão do estabelecimento."}
                  </p>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                <p className="text-xs font-bold text-foreground">Forma de Pagamento:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
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
                    className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
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
                    className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      paymentMethod === "cash"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Dinheiro</span>
                  </button>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Precisa de troco para quanto?
                    </label>
                    <input
                      type="text"
                      value={cashChangeFor}
                      onChange={(e) => setCashChangeFor(e.target.value)}
                      placeholder="Ex: Troco para R$ 50,00 ou Não preciso"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
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
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Observações do Pedido:
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={
                      isDelivery
                        ? "Ex: Sem cebola, carne bem passada, enviar maionese à parte..."
                        : "Ex: Tamanho, cor ou preferência de embalagem..."
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Rodapé do Modal com Total e Botão de WhatsApp */}
            <div className="p-4 border-t border-border bg-card space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Subtotal dos Itens:</span>
                <span className="font-bold text-foreground">
                  {formatPrice(totalCartPrice) ?? "R$ 0,00"}
                </span>
              </div>

              {whats ? (
                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <MessageCircle size={18} />
                  <span>Enviar Pedido pelo WhatsApp</span>
                </button>
              ) : (
                <p className="text-xs text-center text-amber-500 font-medium">
                  WhatsApp não configurado nesta página para recebimento de pedidos.
                </p>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                <Check size={12} className="inline text-emerald-500 mr-1" />
                Seu pedido será enviado formatado com todos os detalhes direto no WhatsApp da loja.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
