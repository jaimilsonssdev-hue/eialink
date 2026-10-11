import { useState } from "react";
import {
  ShoppingBag,
  Palette,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Type,
  Search,
  Truck,
  Tag,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { LojaData, LojaProductItem, LojaCategory } from "./lojaAiService";

interface LojaVisualEditorProps {
  loja: LojaData;
  onChange: (updated: LojaData) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const PALETTE_COLORS = [
  { name: "Azul Safira", hex: "#3b82f6" },
  { name: "Esmeralda Shop", hex: "#10b981" },
  { name: "Rose Concept", hex: "#ec4899" },
  { name: "Violeta Tech", hex: "#8b5cf6" },
  { name: "Âmbar Luxo", hex: "#f59e0b" },
  { name: "Laranja Sale", hex: "#f97316" },
  { name: "Preto Minimal", hex: "#18181b" },
  { name: "Vermelho Promo", hex: "#ef4444" },
];

const BACKGROUND_COLORS = [
  { name: "Dark Absoluto", hex: "#09090b", isDark: true },
  { name: "Grafite Profundo", hex: "#18181b", isDark: true },
  { name: "Ardósia Chumbo", hex: "#0f172a", isDark: true },
  { name: "Preto Noturno", hex: "#000000", isDark: true },
  { name: "Branco Clean", hex: "#ffffff", isDark: false },
  { name: "Creme Suave", hex: "#fafaf9", isDark: false },
  { name: "Cinza Arejado", hex: "#f4f4f5", isDark: false },
  { name: "Pêssego Quente", hex: "#fff7ed", isDark: false },
];

const VISUAL_EFFECTS = [
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    desc: "Vidro moderno translúcido com reflexos sutis e blur",
    badge: "Moderno",
  },
  {
    id: "elegante",
    name: "Elegante Boutique",
    desc: "Tons escuros nobres, bordas douradas e visual de alta moda",
    badge: "Premium",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalismo",
    desc: "Bordas marcadas, sombras duras e estética streetwear",
    badge: "Street / Pop",
  },
  {
    id: "parallax",
    name: "Parallax 3D",
    desc: "Sensação de profundidade com elevação em vitrines",
    badge: "Dinâmico",
  },
  {
    id: "clean",
    name: "Clean Minimal",
    desc: "Visual leve focado na exibição pura e limpa dos produtos",
    badge: "Minimalista",
  },
] as const;

const FONT_OPTIONS = [
  { id: "Inter", name: "Inter (Padrão do Sistema)" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Moderna & Tech)" },
  { id: "Outfit", name: "Outfit (Geométrica & Fashion)" },
  { id: "Playfair Display", name: "Playfair Display (Sofisticada & Editorial)" },
  { id: "Space Grotesk", name: "Space Grotesk (Street & Urbana)" },
];

export function LojaVisualEditor({
  loja,
  onChange,
  onSave,
  isSaving,
}: LojaVisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"info" | "products" | "design" | "tools">("info");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(loja.items[0]?.id || null);
  const [newCatName, setNewCatName] = useState("");

  function updateField<K extends keyof LojaData>(key: K, value: LojaData[K]) {
    onChange({ ...loja, [key]: value });
  }

  function updateFeature(key: string, enabled: boolean) {
    onChange({
      ...loja,
      features: {
        ...(loja.features || {}),
        [key]: enabled,
      },
    });
  }

  // Produtos
  function handleUpdateProduct(id: string, field: keyof LojaProductItem, value: any) {
    const updated = loja.items.map((it) => (it.id === id ? { ...it, [field]: value } : it));
    onChange({ ...loja, items: updated });
  }

  function handleAddProduct() {
    const newProduct: LojaProductItem = {
      id: `prod-${Date.now()}`,
      name: "Novo Produto da Loja",
      description: "Descreva os detalhes, tecido, especificações ou benefícios.",
      price: 129.9,
      category: loja.categories[0]?.id || "todos",
      isPopular: false,
      badge: "Lançamento",
      stockStatus: "in_stock",
      variations: ["P", "M", "G"],
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    };
    onChange({ ...loja, items: [newProduct, ...loja.items] });
    setExpandedProductId(newProduct.id);
  }

  function handleRemoveProduct(id: string) {
    onChange({ ...loja, items: loja.items.filter((it) => it.id !== id) });
  }

  // Categorias
  function handleAddCategory() {
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newCat: LojaCategory = {
      id: catId,
      name: newCatName.trim(),
      icon: "🛍️",
    };
    onChange({
      ...loja,
      categories: [...loja.categories, newCat],
    });
    setNewCatName("");
  }

  function handleRemoveCategory(catId: string) {
    onChange({
      ...loja,
      categories: loja.categories.filter((c) => c.id !== catId),
    });
  }

  const currentFeatures = {
    search: loja.features?.search ?? true,
    cart: loja.features?.cart ?? true,
    shippingInfo: loja.features?.shippingInfo ?? true,
    stockBadge: loja.features?.stockBadge ?? true,
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Barra de Ação Superior do Editor */}
      {onSave && (
        <div className="px-3 py-2 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span className="text-[11px] text-zinc-400 truncate">
              {isSaving ? "Salvando no banco..." : "Auto-save ativo"}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shrink-0 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}

      {/* Sub-menu do Editor Visual */}
      <div className="grid grid-cols-4 p-1.5 bg-zinc-900/80 border-b border-white/10 gap-1 text-[11px] shrink-0 font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "info"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📋 Dados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "products"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          🛍️ Produtos ({loja.items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "design"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          🎨 Estilos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tools")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "tools"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ⚙️ Recursos
        </button>
      </div>

      {/* Conteúdo Rolável da Aba */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ABA 1: DADOS & INFORMAÇÕES */}
        {activeTab === "info" && (
          <div className="space-y-3.5">
            {/* Logotipo da Loja */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                <span>Logotipo da Loja</span>
                {loja.logoUrl && (
                  <button
                    type="button"
                    onClick={() => updateField("logoUrl", undefined)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Remover Logo
                  </button>
                )}
              </label>

              <div className="flex items-center gap-3">
                {loja.logoUrl ? (
                  <img
                    src={loja.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 bg-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-dashed border-white/20 bg-zinc-800/50 flex items-center justify-center shrink-0 text-zinc-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <Input
                    value={loja.logoUrl || ""}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    placeholder="URL do logotipo (https://...)"
                    className="bg-zinc-900 border-white/10 text-xs h-8"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                      <span>📁 Carregar arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvt) => {
                              const result = uploadEvt.target?.result as string;
                              if (result) updateField("logoUrl", result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Nome da Marca / Loja</label>
              <Input
                value={loja.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
                placeholder="Ex: Aura Concept Store"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Slogan / Tagline</label>
              <Input
                value={loja.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="Ex: Moda contemporânea e alfaiataria elegante"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Apresentação da Marca</label>
              <Textarea
                value={loja.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Conte sobre os tecidos nobres, curadoria e compromisso..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">WhatsApp de Vendas</label>
                <Input
                  value={loja.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="5511999999999"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Horários de Atendimento</label>
                <Input
                  value={loja.openingHours || ""}
                  onChange={(e) => updateField("openingHours", e.target.value)}
                  placeholder="Seg a Sáb 10h às 20h"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Informações de Frete & Envio</label>
              <Input
                value={loja.shippingInfo || ""}
                onChange={(e) => updateField("shippingInfo", e.target.value)}
                placeholder="Ex: Envio para todo o Brasil • Frete grátis acima de R$ 199"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Endereço Físico / Showroom</label>
              <Input
                value={loja.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Av. Paulista, 1000 - Loja 12"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">URL do Banner de Capa</label>
              <Input
                value={loja.bannerImage || ""}
                onChange={(e) => updateField("bannerImage", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>
          </div>
        )}

        {/* ABA 2: PRODUTOS & CATEGORIAS */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Produtos ({loja.items.length})
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Produto
              </Button>
            </div>

            {/* Categorias */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Categorias ({loja.categories.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {loja.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 border border-white/10 text-[11px] text-zinc-200"
                  >
                    <span>{cat.icon || "🛍️"} {cat.name}</span>
                    {loja.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="text-zinc-500 hover:text-red-400 ml-0.5"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 pt-1">
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nova categoria (ex: Bolsas)"
                  className="h-7 text-xs bg-zinc-950 border-white/10"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  className="h-7 text-xs px-2.5 bg-zinc-800 hover:bg-zinc-700"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="space-y-2.5">
              {loja.items.map((prod) => {
                const isExpanded = expandedProductId === prod.id;
                return (
                  <div
                    key={prod.id}
                    className="border border-white/10 rounded-xl bg-zinc-900/40 overflow-hidden transition-all"
                  >
                    <div
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5"
                      onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <span className="text-blue-400 font-bold">
                              R$ {Number(prod.price || 0).toFixed(2).replace(".", ",")}
                            </span>
                            {prod.badge && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-blue-500/30 text-blue-300">
                                {prod.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveProduct(prod.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-white/5 bg-zinc-950/60 space-y-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Nome do Produto</label>
                          <Input
                            value={prod.name}
                            onChange={(e) => handleUpdateProduct(prod.id, "name", e.target.value)}
                            className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Preço (R$)</label>
                            <Input
                              type="number"
                              step="0.5"
                              value={prod.price}
                              onChange={(e) =>
                                handleUpdateProduct(prod.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10 font-bold text-blue-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Selo / Badge</label>
                            <Input
                              value={prod.badge || ""}
                              onChange={(e) => handleUpdateProduct(prod.id, "badge", e.target.value)}
                              placeholder="Ex: Mais Vendido ⭐"
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Categoria</label>
                          <select
                            value={prod.category}
                            onChange={(e) => handleUpdateProduct(prod.id, "category", e.target.value)}
                            className="mt-1 w-full h-8 text-xs bg-zinc-900 border border-white/10 rounded-md px-2 text-zinc-200"
                          >
                            {loja.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">
                            Variações (Separadas por vírgula: ex: P, M, G ou Preto, Branco)
                          </label>
                          <Input
                            value={(prod.variations || []).join(", ")}
                            onChange={(e) =>
                              handleUpdateProduct(
                                prod.id,
                                "variations",
                                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="P, M, G"
                            className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Descrição do Produto</label>
                          <Textarea
                            value={prod.description}
                            onChange={(e) => handleUpdateProduct(prod.id, "description", e.target.value)}
                            rows={2}
                            className="mt-1 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">URL da Foto</label>
                          <Input
                            value={prod.image || ""}
                            onChange={(e) => handleUpdateProduct(prod.id, "image", e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 3: DESIGN, CORES, EFEITOS & FONTES */}
        {activeTab === "design" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Efeito Visual & Acabamento
              </label>
              <div className="space-y-2">
                {VISUAL_EFFECTS.map((eff) => {
                  const isSelected = (loja.visualEffect || "glassmorphism") === eff.id;
                  return (
                    <div
                      key={eff.id}
                      onClick={() => updateField("visualEffect", eff.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500 text-white shadow-xs"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                          {eff.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0 border-white/15">
                          {eff.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        {eff.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cor de Fundo da Loja (Background) */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-blue-400" />
                  Cor de Fundo da Loja
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {loja.backgroundColor || "#09090b"}
                </span>
              </label>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {BACKGROUND_COLORS.map((bg) => {
                  const isBgSelected = (loja.backgroundColor || "#09090b").toLowerCase() === bg.hex.toLowerCase();
                  return (
                    <button
                      key={bg.hex}
                      type="button"
                      onClick={() => updateField("backgroundColor", bg.hex)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all text-center ${
                        isBgSelected
                          ? "bg-blue-600/15 border-blue-500 ring-1 ring-blue-500"
                          : "bg-zinc-900 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/30 shadow-xs flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: bg.hex }}
                      >
                        {isBgSelected && (
                          <Check className={`w-3 h-3 ${bg.isDark ? "text-white" : "text-black"}`} />
                        )}
                      </span>
                      <span className="text-[9px] text-zinc-300 truncate w-full">
                        {bg.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Seletor Customizado Hexadecimal de Fundo */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-white/10 mb-2">
                <input
                  type="color"
                  value={loja.backgroundColor || "#09090b"}
                  onChange={(e) => updateField("backgroundColor", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-400 block font-medium">Cor de Fundo Personalizada</span>
                  <Input
                    value={loja.backgroundColor || "#09090b"}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    placeholder="#09090b"
                    className="h-6 text-xs bg-transparent border-0 p-0 font-mono text-zinc-200 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Paleta de Cores e Seletor Livre */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Palette className="h-3.5 w-3.5 text-blue-400" />
                Cor de Destaque & Botões de Ação
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      updateField("themeColor", col.name.toLowerCase().split(" ")[0]);
                      updateField("buttonColor", col.hex);
                    }}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/30 transition-all text-center"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[9px] text-zinc-300 truncate w-full">
                      {col.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Seletor Customizado Hexadecimal */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-white/10">
                <input
                  type="color"
                  value={loja.buttonColor || "#3b82f6"}
                  onChange={(e) => updateField("buttonColor", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-400 block font-medium">Cor do Botão de Comprar</span>
                  <Input
                    value={loja.buttonColor || "#3b82f6"}
                    onChange={(e) => updateField("buttonColor", e.target.value)}
                    className="h-6 text-xs bg-transparent border-0 p-0 font-mono text-zinc-200 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Família Tipográfica */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Type className="h-3.5 w-3.5 text-blue-400" />
                Família Tipográfica
              </label>
              <div className="space-y-1.5">
                {FONT_OPTIONS.map((font) => {
                  const isFontSelected = (loja.customFont || "Inter") === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => updateField("customFont", font.id)}
                      className={`w-full p-2 text-left text-xs rounded-xl border transition-all flex items-center justify-between ${
                        isFontSelected
                          ? "bg-blue-600/15 border-blue-500 text-white font-semibold"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <span>{font.name}</span>
                      {isFontSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: FERRAMENTAS & RECURSOS */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200">Recursos da Loja Virtual</h4>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-blue-400" />
                    Barra de Busca de Produtos
                  </span>
                  <p className="text-[10px] text-zinc-400">Permite ao cliente pesquisar itens por nome</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.search}
                  onChange={(e) => updateFeature("search", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-blue-400" />
                    Faixa de Informações de Frete
                  </span>
                  <p className="text-[10px] text-zinc-400">Exibe avisos de frete grátis e prazos de entrega</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.shippingInfo}
                  onChange={(e) => updateFeature("shippingInfo", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-blue-400" />
                    Carrinho & Checkout WhatsApp
                  </span>
                  <p className="text-[10px] text-zinc-400">Permite acumular produtos e enviar o pedido completo</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.cart}
                  onChange={(e) => updateFeature("cart", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-400" />
                    Selos de Destaque & Lançamento
                  </span>
                  <p className="text-[10px] text-zinc-400">Exibe tags promocionais nos cards dos produtos</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.stockBadge}
                  onChange={(e) => updateFeature("stockBadge", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

