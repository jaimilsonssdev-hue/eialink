import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  Eye,
  Sliders,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/page-builder/MediaUploader";
import {
  InstagramProductCarousel,
  type ProductCarouselConfig,
  type CarouselProductItem,
} from "@/components/public-profile/InstagramProductCarousel";
import type { PublicBio } from "@/components/public-profile/types";

interface ProductCarouselManagerProps {
  bio?: PublicBio;
  socialLinks?: Record<string, any>;
  onUpdateSocialLinks?: (newSocialLinks: Record<string, any>) => void;
}

const DEFAULT_DEMO_ITEMS: CarouselProductItem[] = [
  {
    id: "item-1",
    name: "Burger Especial da Casa",
    price: "38,90",
    badge: "🔥 Mais Pedido",
    description: "Pão brioche selado na manteiga, blend artesanal 180g, queijo cheddar derretido e bacon crocante.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    button_label: "Pedir pelo WhatsApp",
  },
  {
    id: "item-2",
    name: "Pizza Artesanal 8 Fatias",
    price: "64,90",
    badge: "⭐ Destaque",
    description: "Massa de fermentação lenta 48h, molho de tomate pelado italiano e queijo mussarela especial.",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    button_label: "Pedir pelo WhatsApp",
  },
  {
    id: "item-3",
    name: "Sobremesa Petit Gâteau",
    price: "24,90",
    badge: "Delícia",
    description: "Bolo quente de chocolate com recheio cremoso e bola de sorvete de baunilha artesanal.",
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
    button_label: "Pedir pelo WhatsApp",
  },
];

export function ProductCarouselManager({ bio, socialLinks, onUpdateSocialLinks }: ProductCarouselManagerProps) {
  const queryClient = useQueryClient();
  const socialData = (bio?.social_links as Record<string, any>) || socialLinks || {};
  const currentConfig: ProductCarouselConfig = socialData.product_carousel || {
    enabled: false,
    title: "Destaques & Mais Pedidos",
    subtitle: "Arraste para o lado e faça seu pedido direto no WhatsApp",
    aspect_ratio: "4:5",
    items: DEFAULT_DEMO_ITEMS,
  };

  const [enabled, setEnabled] = useState(Boolean(currentConfig.enabled));
  const [title, setTitle] = useState(currentConfig.title || "Destaques & Mais Pedidos");
  const [subtitle, setSubtitle] = useState(
    currentConfig.subtitle || "Arraste para o lado e faça seu pedido direto no WhatsApp",
  );
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "16:9">(
    currentConfig.aspect_ratio || "4:5",
  );
  const [items, setItems] = useState<CarouselProductItem[]>(
    currentConfig.items && currentConfig.items.length > 0
      ? currentConfig.items
      : DEFAULT_DEMO_ITEMS,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Sincroniza se o bio ou socialLinks mudar
  useEffect(() => {
    const freshSocial = (bio?.social_links as Record<string, any>) || socialLinks || {};
    if (freshSocial.product_carousel) {
      const cfg = freshSocial.product_carousel as ProductCarouselConfig;
      setEnabled(Boolean(cfg.enabled));
      setTitle(cfg.title || "Destaques & Mais Pedidos");
      setSubtitle(cfg.subtitle || "Arraste para o lado e faça seu pedido direto no WhatsApp");
      setAspectRatio(cfg.aspect_ratio || "4:5");
      if (Array.isArray(cfg.items) && cfg.items.length > 0) {
        setItems(cfg.items);
      }
    }
  }, [bio, socialLinks]);

  const MAX_CAROUSEL_ITEMS = 10;

  function handleAddItem() {
    if (items.length >= MAX_CAROUSEL_ITEMS) return;

    const newItem: CarouselProductItem = {
      id: `prod-${Date.now()}`,
      name: `Novo Item ${items.length + 1}`,
      price: "35,00",
      badge: "Destaque",
      description: "Descrição detalhada do produto ou serviço para despertar o interesse do cliente.",
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      button_label: "Pedir pelo WhatsApp",
    };
    const next = [...items, newItem];
    setItems(next);
    setExpandedIndex(next.length - 1);
  }

  function handleRemoveItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  }

  function handleUpdateItem(index: number, patch: Partial<CarouselProductItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setItems(next);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const updatedConfig: ProductCarouselConfig = {
      enabled,
      title: title.trim(),
      subtitle: subtitle.trim(),
      aspect_ratio: aspectRatio,
      items: items.filter((i) => i.name.trim() && i.image_url.trim()),
    };

    const newSocialLinks = {
      ...socialData,
      product_carousel: updatedConfig,
    };

    if (onUpdateSocialLinks) {
      onUpdateSocialLinks(newSocialLinks);
    }

    if (bio?.id) {
      try {
        const { error } = await supabase
          .from("bio_pages")
          .update({
            social_links: newSocialLinks,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bio.id);

        if (error) throw error;

        setSaveSuccess(true);
        await queryClient.invalidateQueries({ queryKey: ["bio-me"] });
        await queryClient.invalidateQueries({ queryKey: ["public-bio", bio.slug] });
        setTimeout(() => setSaveSuccess(false), 3500);
      } catch (err: unknown) {
        const error = err as Error;
        setSaveError(error.message || "Erro ao salvar carrossel de produtos.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsSaving(false);
    }
  }

  const previewConfig: ProductCarouselConfig = {
    enabled: true,
    title,
    subtitle,
    aspect_ratio: aspectRatio,
    items,
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-6 shadow-sm">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Flame className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Carrossel de Produtos & Destaques (Estilo Instagram)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Apresente seus principais produtos ou pratos em um carrossel horizontal de alta conversão onde o cliente escolhe e faz o pedido direto no WhatsApp.
          </p>
        </div>

        {/* Interruptor Ativar/Desativar */}
        <div className="flex items-center gap-3 bg-muted/40 border border-border px-3.5 py-2 rounded-xl shrink-0">
          <div className="text-right">
            <span className="text-xs font-semibold block text-foreground">
              {enabled ? "Carrossel Ativo" : "Carrossel Desativado"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {enabled ? "Visível no seu site" : "Oculto dos visitantes"}
            </span>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Ativar carrossel de produtos"
          />
        </div>
      </div>

      {enabled && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Configurações Globais da Seção */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Título da Seção
              </label>
              <Input
                placeholder="Ex: Destaques & Mais Pedidos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Subtítulo / Instrução
              </label>
              <Input
                placeholder="Ex: Arraste para o lado e peça no WhatsApp"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Formato das Fotos
              </label>
              <select
                value={aspectRatio}
                onChange={(e) =>
                  setAspectRatio(e.target.value as "1:1" | "4:5" | "16:9")
                }
                className="w-full h-9 text-xs rounded-lg border border-border bg-background px-3 text-foreground"
              >
                <option value="4:5">Vertical Elegante (4:5 — Estilo Feed Instagram)</option>
                <option value="1:1">Quadrado Clássico (1:1 — Padrão Vitrine)</option>
                <option value="16:9">Widescreen Horizontal (16:9)</option>
              </select>
            </div>
          </div>

          {/* Lista de Produtos do Carrossel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Produtos do Carrossel ({items.length}/{MAX_CAROUSEL_ITEMS})
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {items.length >= MAX_CAROUSEL_ITEMS
                    ? "Limite máximo de 10 fotos atingido"
                    : "Até 10 fotos (padrão Instagram)"}
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={items.length >= MAX_CAROUSEL_ITEMS}
                onClick={handleAddItem}
                className="h-8 text-xs rounded-lg border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {items.length >= MAX_CAROUSEL_ITEMS ? "Limite Atingido (10)" : "Adicionar Produto"}
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const isExpanded = expandedIndex === index;

                return (
                  <div
                    key={item.id || index}
                    className="rounded-xl border border-border bg-muted/20 overflow-hidden transition-all"
                  >
                    {/* Linha Resumo / Accordion Header */}
                    <div
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate">
                              {item.name || `Produto ${index + 1}`}
                            </span>
                            {item.badge && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-medium text-emerald-400">
                            {item.price ? `R$ ${item.price}` : "Sem preço definido"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(index);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remover produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Detalhes de Edição do Produto */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-border/50 bg-background/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Imagem do Produto */}
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[11px] font-semibold text-muted-foreground block">
                            Foto do Produto
                          </label>
                          <MediaUploader
                            label="Foto do Produto"
                            value={item.image_url}
                            variant="square"
                            companyName={bio.display_name}
                            onChange={(url) =>
                              handleUpdateItem(index, { image_url: url || "" })
                            }
                          />
                        </div>

                        {/* Campos de Texto */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Nome do Produto / Prato
                              </label>
                              <Input
                                placeholder="Ex: X-Burger Especial"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateItem(index, { name: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Preço (R$)
                              </label>
                              <Input
                                placeholder="Ex: 38,90"
                                value={item.price || ""}
                                onChange={(e) =>
                                  handleUpdateItem(index, { price: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Selo / Badge em Destaque (Opcional)
                              </label>
                              <Input
                                placeholder="Ex: 🔥 Mais Pedido, 20% OFF..."
                                value={item.badge || ""}
                                onChange={(e) =>
                                  handleUpdateItem(index, { badge: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">
                                Texto do Botão de Pedido
                              </label>
                              <Input
                                placeholder="Padrão: Pedir pelo WhatsApp"
                                value={item.button_label || ""}
                                onChange={(e) =>
                                  handleUpdateItem(index, { button_label: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">
                              Descrição / Ingredientes (Curta)
                            </label>
                            <Input
                              placeholder="Ex: Pão brioche, 180g de carne artesanal, cheddar e molho especial."
                              value={item.description || ""}
                              onChange={(e) =>
                                handleUpdateItem(index, { description: e.target.value })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prévia Interativa Ao Vivo */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Prévia Interativa ao Vivo (Deslize com o dedo ou mouse)</span>
            </div>

            <div className="rounded-2xl border border-dashed border-border/80 bg-background/40 p-2 overflow-hidden">
              <InstagramProductCarousel
                bio={
                  bio ||
                  ({
                    display_name: "Sua Empresa",
                    whatsapp: "5511999999999",
                    theme: "ocean",
                  } as any)
                }
                config={previewConfig}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback e Botão de Salvar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="text-xs">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Carrossel de produtos salvo com sucesso!
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-2" />
              Salvar Alterações do Carrossel
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

