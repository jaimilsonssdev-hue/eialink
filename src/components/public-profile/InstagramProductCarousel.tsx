import { useState, useEffect, useCallback, memo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Sparkles,
  ExternalLink,
  ShoppingBag,
  ChevronRight,
  Flame,
  Star,
  Tag,
} from "lucide-react";
import type { PublicBio, TrackEvent } from "./types";

export interface CarouselProductItem {
  id: string;
  name: string;
  price?: string | number | null;
  badge?: string | null; // ex: "Mais Pedido", "Destaque", "Promoção", "Novidade"
  description?: string | null;
  image_url: string;
  button_label?: string | null;
  button_url?: string | null;
}

export interface ProductCarouselConfig {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  aspect_ratio?: "1:1" | "4:5" | "16:9";
  items: CarouselProductItem[];
}

export function formatCurrencyBRL(val?: string | number | null): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "string") {
    if (val.toLowerCase().includes("r$") || val.toLowerCase().includes("a partir")) {
      return val;
    }
    const num = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!isNaN(num)) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
    }
    return val;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export const InstagramProductCarousel = memo(function InstagramProductCarousel({
  bio,
  config,
  onTrack,
}: {
  bio: PublicBio;
  config?: ProductCarouselConfig;
  onTrack?: TrackEvent;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const items = (config?.items?.filter((item) => item.name && item.image_url) || []).slice(0, 10);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!config?.enabled || items.length === 0) {
    return null;
  }

  const social = (bio.social_links as Record<string, unknown>) || {};
  const whatsappNumber =
    (bio.whatsapp ||
      (social.commercial_whatsapp as string) ||
      "")
      .replace(/\D/g, "");

  const title = config.title?.trim() || "Destaques & Mais Pedidos";
  const subtitle = config.subtitle?.trim() || "Arraste para o lado e escolha o seu favorito";
  const aspectRatioClass =
    config.aspect_ratio === "1:1"
      ? "aspect-square"
      : config.aspect_ratio === "16:9"
      ? "aspect-video"
      : "aspect-[4/5]";

  function handleItemClick(item: CarouselProductItem) {
    if (onTrack) {
      onTrack("carousel_product_click", item.id);
    }

    if (item.button_url && item.button_url.trim()) {
      window.open(item.button_url.trim(), "_blank");
      return;
    }

    // Abertura automática no WhatsApp com mensagem de alta conversão
    if (whatsappNumber) {
      const priceText = item.price ? ` (${formatCurrencyBRL(item.price)})` : "";
      const text = `Olá! Vi o produto *${item.name}*${priceText} no seu site e gostaria de fazer um pedido!`;
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    }
  }

  return (
    <section
      className="w-full max-w-xl mx-auto my-6 px-4 animate-fade-in-up"
      aria-label={title}
    >
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
            <h3 className="text-base font-bold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Contador estilo Instagram (ex: 1/5) */}
        {count > 1 && (
          <Badge
            variant="secondary"
            className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/50"
          >
            {current + 1}/{count}
          </Badge>
        )}
      </div>

      {/* Carrossel Interativo Estilo Instagram */}
      <div className="relative group">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: items.length > 2,
            dragFree: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {items.map((item, index) => {
              const formattedPrice = formatCurrencyBRL(item.price);
              const isSelected = index === current;

              return (
                <CarouselItem
                  key={item.id || index}
                  className="pl-3 basis-[84%] sm:basis-[72%] md:basis-[62%]"
                >
                  <div
                    className="relative rounded-2xl overflow-hidden bg-card border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group/card"
                  >
                    {/* Imagem do Produto com Aspect Ratio Instagram */}
                    <div className={`relative w-full ${aspectRatioClass} overflow-hidden bg-muted`}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
                      />

                      {/* Gradiente sutil inferior */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      {/* Badge / Tag Promocional no topo esquerdo */}
                      {item.badge && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-white shadow-md backdrop-blur-xs">
                            <Sparkles className="h-3 w-3" />
                            {item.badge}
                          </span>
                        </div>
                      )}

                      {/* Informações sobrepostas na imagem estilo Stories/Instagram */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 text-white space-y-1">
                        <h4 className="text-base font-bold leading-tight drop-shadow-sm line-clamp-1">
                          {item.name}
                        </h4>

                        {item.description && (
                          <p className="text-[11px] text-white/90 line-clamp-2 leading-snug drop-shadow-xs">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {formattedPrice ? (
                            <span className="text-sm font-black text-amber-300 tracking-tight drop-shadow-sm">
                              {formattedPrice}
                            </span>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação Direta de Pedido */}
                    <div className="p-2.5 bg-card border-t border-border/50">
                      <Button
                        onClick={() => handleItemClick(item)}
                        className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{item.button_label || "Pedir pelo WhatsApp"}</span>
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Setas para Navegação em Desktop */}
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-3 h-8 w-8 rounded-full border-border bg-background/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="-right-3 h-8 w-8 rounded-full border-border bg-background/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Carousel>

        {/* Bolinhas de Paginação (Dots) Estilo Instagram */}
        {count > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {Array.from({ length: count }).map((_, idx) => {
              const active = idx === current;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => api?.scrollTo(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    active
                      ? "w-5 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});

