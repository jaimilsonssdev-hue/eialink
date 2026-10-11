import { useState } from "react";
import {
  Utensils,
  Palette,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Type,
  Layers,
  Search,
  Bike,
  ShoppingBag,
  CreditCard,
  QrCode,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { CardapioData, CardapioItem, CardapioCategory } from "./cardapioAiService";

interface CardapioVisualEditorProps {
  cardapio: CardapioData;
  onChange: (updated: CardapioData) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const PALETTE_COLORS = [
  { name: "Laranja Delivery", hex: "#f97316" },
  { name: "Âmbar & Ouro", hex: "#f59e0b" },
  { name: "Esmeralda Fresco", hex: "#10b981" },
  { name: "Vermelho Fogo", hex: "#ef4444" },
  { name: "Violeta Gourmet", hex: "#8b5cf6" },
  { name: "Azul Royal", hex: "#3b82f6" },
  { name: "Rosa Berry", hex: "#ec4899" },
  { name: "Dark Absoluto", hex: "#18181b" },
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
    desc: "Vidro translúcido, blur cristalino e bordas iluminadas",
    badge: "Moderno",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalismo",
    desc: "Bordas pretas marcadas, sombras duras e alto contraste",
    badge: "Pop / Destaque",
  },
  {
    id: "elegante",
    name: "Elegante Dark",
    desc: "Tons escuros nobres, toques dourados e visual refinado",
    badge: "Premium",
  },
  {
    id: "parallax",
    name: "Parallax 3D",
    desc: "Sensação de profundidade, banner amplo e elevação suave",
    badge: "Dinâmico",
  },
  {
    id: "clean",
    name: "Clean Minimal",
    desc: "Estilo leve, espaçamento arejado e foco total nos pratos",
    badge: "Clássico",
  },
] as const;

const FONT_OPTIONS = [
  { id: "Inter", name: "Inter (Padrão do Sistema)" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Moderna & Tech)" },
  { id: "Outfit", name: "Outfit (Geométrica & Descolada)" },
  { id: "Playfair Display", name: "Playfair Display (Sofisticada & Clássica)" },
  { id: "Space Grotesk", name: "Space Grotesk (Urbana & Futurista)" },
];

export function CardapioVisualEditor({
  cardapio,
  onChange,
  onSave,
  isSaving,
}: CardapioVisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"info" | "items" | "design" | "tools">("info");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(cardapio.items[0]?.id || null);
  const [newCatName, setNewCatName] = useState("");

  // Helpers para atualização imutável
  function updateField<K extends keyof CardapioData>(key: K, value: CardapioData[K]) {
    onChange({ ...cardapio, [key]: value });
  }

  function updateFeature(featureKey: string, enabled: boolean) {
    onChange({
      ...cardapio,
      features: {
        ...(cardapio.features || {}),
        [featureKey]: enabled,
      },
    });
  }

  function handleUpdateItem(itemId: string, field: keyof CardapioItem, value: any) {
    const updatedItems = cardapio.items.map((it) =>
      it.id === itemId ? { ...it, [field]: value } : it
    );
    onChange({ ...cardapio, items: updatedItems });
  }

  function handleAddItem() {
    const newItem: CardapioItem = {
      id: `item-${Date.now()}`,
      name: "Novo Prato / Item",
      description: "Descreva os ingredientes saborosos deste prato.",
      price: 29.9,
      category: cardapio.categories[0]?.id || "todos",
      isPopular: false,
      badge: "Novidade",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    };
    onChange({
      ...cardapio,
      items: [newItem, ...cardapio.items],
    });
    setExpandedItemId(newItem.id);
  }

  function handleRemoveItem(itemId: string) {
    onChange({
      ...cardapio,
      items: cardapio.items.filter((it) => it.id !== itemId),
    });
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newCat: CardapioCategory = {
      id: catId,
      name: newCatName.trim(),
      icon: "🍽️",
    };
    onChange({
      ...cardapio,
      categories: [...cardapio.categories, newCat],
    });
    setNewCatName("");
  }

  function handleRemoveCategory(catId: string) {
    onChange({
      ...cardapio,
      categories: cardapio.categories.filter((c) => c.id !== catId),
    });
  }

  const currentFeatures = {
    search: cardapio.features?.search ?? true,
    deliveryCep: cardapio.features?.deliveryCep ?? true,
    cart: cardapio.features?.cart ?? true,
    popularSection: cardapio.features?.popularSection ?? true,
    pix: cardapio.features?.pix ?? true,
    card: cardapio.features?.card ?? true,
    money: cardapio.features?.money ?? true,
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Barra de Ação Superior do Editor */}
      {onSave && (
        <div className="px-3 py-2 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] text-zinc-400 truncate">
              {isSaving ? "Salvando no banco..." : "Auto-save ativo"}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shrink-0 shadow-sm"
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
              ? "bg-orange-500 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📋 Dados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "items"
              ? "bg-orange-500 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          🍔 Pratos ({cardapio.items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            activeTab === "design"
              ? "bg-orange-500 text-white font-bold shadow-xs"
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
              ? "bg-orange-500 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ⚙️ Recursos
        </button>
      </div>

      {/* Conteúdo Rolável da Aba Ativa */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ABA 1: DADOS GERAIS & TEXTOS */}
        {activeTab === "info" && (
          <div className="space-y-3.5">
            {/* Logotipo do Estabelecimento */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                <span>Logotipo do Estabelecimento</span>
                {cardapio.logoUrl && (
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
                {cardapio.logoUrl ? (
                  <img
                    src={cardapio.logoUrl}
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
                    value={cardapio.logoUrl || ""}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    placeholder="URL do logotipo (https://...)"
                    className="bg-zinc-900 border-white/10 text-xs h-8"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-[11px] font-medium text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1">
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
              <label className="text-[11px] font-semibold text-zinc-300">Nome do Estabelecimento</label>
              <Input
                value={cardapio.restaurantName}
                onChange={(e) => updateField("restaurantName", e.target.value)}
                placeholder="Ex: Burger & Co. Artesanal"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Slogan / Tagline de Impacto</label>
              <Input
                value={cardapio.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="Ex: O melhor smash burger da cidade"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Descrição / História</label>
              <Textarea
                value={cardapio.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Conte sobre os ingredientes frescos e qualidade..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">WhatsApp de Pedidos</label>
                <Input
                  value={cardapio.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="5511999999999"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Taxa de Entrega</label>
                <Input
                  value={cardapio.deliveryFee || ""}
                  onChange={(e) => updateField("deliveryFee", e.target.value)}
                  placeholder="Ex: R$ 6,90"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Pedido Mínimo (R$)</label>
                <Input
                  type="number"
                  value={cardapio.minOrder || 0}
                  onChange={(e) => updateField("minOrder", parseFloat(e.target.value) || 0)}
                  placeholder="20.00"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Horários de Funcionamento</label>
                <Input
                  value={cardapio.openingHours || ""}
                  onChange={(e) => updateField("openingHours", e.target.value)}
                  placeholder="Terça a Dom, 18h às 23h30"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Endereço Completo</label>
              <Input
                value={cardapio.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Rua, número, bairro e cidade"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">URL da Foto de Capa / Banner</label>
              <Input
                value={cardapio.bannerImage || ""}
                onChange={(e) => updateField("bannerImage", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>
          </div>
        )}

        {/* ABA 2: ITENS & PRATOS */}
        {activeTab === "items" && (
          <div className="space-y-4">
            {/* Cabeçalho de Itens */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Cardápio ({cardapio.items.length} itens)
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItem}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Prato
              </Button>
            </div>

            {/* Gerenciador de Categorias Rápido */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Categorias ({cardapio.categories.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {cardapio.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 border border-white/10 text-[11px] text-zinc-200"
                  >
                    <span>{cat.icon || "🍽️"} {cat.name}</span>
                    {cardapio.categories.length > 1 && (
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
                  placeholder="Nova categoria (ex: Sobremesas)"
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

            {/* Lista de Pratos Cadastrados */}
            <div className="space-y-2.5">
              {cardapio.items.map((item, index) => {
                const isExpanded = expandedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-white/10 rounded-xl bg-zinc-900/40 overflow-hidden transition-all"
                  >
                    {/* Linha Resumo do Item */}
                    <div
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                            <Utensils className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {item.name || "Prato sem nome"}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <span className="text-orange-400 font-bold">
                              R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}
                            </span>
                            {item.badge && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-orange-500/30 text-orange-400">
                                {item.badge}
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
                            handleRemoveItem(item.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                          title="Remover Prato"
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

                    {/* Formulário Expandido */}
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-white/5 bg-zinc-950/60 space-y-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Título do Prato</label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                            className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Preço (R$)</label>
                            <Input
                              type="number"
                              step="0.5"
                              value={item.price}
                              onChange={(e) =>
                                handleUpdateItem(item.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10 font-bold text-orange-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Selo / Badge</label>
                            <Input
                              value={item.badge || ""}
                              onChange={(e) => handleUpdateItem(item.id, "badge", e.target.value)}
                              placeholder="Ex: Mais Pedido ⭐"
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Categoria</label>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, "category", e.target.value)}
                            className="mt-1 w-full h-8 text-xs bg-zinc-900 border border-white/10 rounded-md px-2 text-zinc-200"
                          >
                            {cardapio.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Descrição dos Ingredientes</label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                            rows={2}
                            className="mt-1 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">URL da Foto</label>
                          <Input
                            value={item.image || ""}
                            onChange={(e) => handleUpdateItem(item.id, "image", e.target.value)}
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
            {/* Efeitos Visuais (Parallax, Glassmorphism, Neobrutalismo, etc.) */}
            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                Efeito Visual & Acabamento
              </label>
              <div className="grid grid-cols-1 gap-2">
                {VISUAL_EFFECTS.map((eff) => {
                  const isSelected =
                    (cardapio.visualEffect || "glassmorphism") === eff.id;
                  return (
                    <div
                      key={eff.id}
                      onClick={() => updateField("visualEffect", eff.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-orange-500/15 border-orange-500 text-white shadow-xs"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {isSelected && <Check className="h-3.5 w-3.5 text-orange-400" />}
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

            {/* Cor de Fundo da Página (Background) */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-orange-400" />
                  Cor de Fundo da Página
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {cardapio.backgroundColor || "#09090b"}
                </span>
              </label>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {BACKGROUND_COLORS.map((bg) => {
                  const isBgSelected = (cardapio.backgroundColor || "#09090b").toLowerCase() === bg.hex.toLowerCase();
                  return (
                    <button
                      key={bg.hex}
                      type="button"
                      onClick={() => updateField("backgroundColor", bg.hex)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all text-center ${
                        isBgSelected
                          ? "bg-orange-500/15 border-orange-500 ring-1 ring-orange-500"
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
                  value={cardapio.backgroundColor || "#09090b"}
                  onChange={(e) => updateField("backgroundColor", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-400 block font-medium">Cor de Fundo Personalizada</span>
                  <Input
                    value={cardapio.backgroundColor || "#09090b"}
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
                <Palette className="h-3.5 w-3.5 text-orange-400" />
                Cor de Destaque & Botões de Ação
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      updateField("themeColor", col.name.toLowerCase().split(" ")[0] as any);
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
                  value={cardapio.buttonColor || "#f97316"}
                  onChange={(e) => updateField("buttonColor", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-400 block font-medium">Cor Personalizada do Botão</span>
                  <Input
                    value={cardapio.buttonColor || "#f97316"}
                    onChange={(e) => updateField("buttonColor", e.target.value)}
                    className="h-6 text-xs bg-transparent border-0 p-0 font-mono text-zinc-200 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Tipografia & Fontes */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Type className="h-3.5 w-3.5 text-orange-400" />
                Família Tipográfica
              </label>
              <div className="space-y-1.5">
                {FONT_OPTIONS.map((font) => {
                  const isFontSelected = (cardapio.customFont || "Inter") === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => updateField("customFont", font.id)}
                      className={`w-full p-2 text-left text-xs rounded-xl border transition-all flex items-center justify-between ${
                        isFontSelected
                          ? "bg-orange-500/15 border-orange-500 text-white font-semibold"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <span>{font.name}</span>
                      {isFontSelected && <Check className="h-3.5 w-3.5 text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: FERRAMENTAS & RECURSOS (LIGAR / DESLIGAR) */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200">Recursos de Interação & Venda</h4>

              {/* Busca de pratos */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-orange-400" />
                    Barra de Busca de Pratos
                  </span>
                  <p className="text-[10px] text-zinc-400">Permite ao cliente filtrar itens pelo nome</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.search}
                  onChange={(e) => updateFeature("search", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Cálculo de entrega por CEP */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Bike className="h-3.5 w-3.5 text-orange-400" />
                    Cálculo Automático por CEP (ViaCEP)
                  </span>
                  <p className="text-[10px] text-zinc-400">Calcula endereço e taxa para o cliente</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.deliveryCep}
                  onChange={(e) => updateFeature("deliveryCep", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Carrinho de compras */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-orange-400" />
                    Carrinho & Checkout WhatsApp
                  </span>
                  <p className="text-[10px] text-zinc-400">Gera o pedido pronto com itens e total</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.cart}
                  onChange={(e) => updateFeature("cart", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Seção Mais Pedidos */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                    Destaque "Mais Pedidos"
                  </span>
                  <p className="text-[10px] text-zinc-400">Exibe carrossel de topo com pratos estrela</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.popularSection}
                  onChange={(e) => updateFeature("popularSection", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200">Formas de Pagamento Aceitas</h4>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-emerald-400" /> PIX Instantâneo
                </span>
                <input
                  type="checkbox"
                  checked={currentFeatures.pix}
                  onChange={(e) => updateFeature("pix", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-400" /> Cartão de Crédito / Débito
                </span>
                <input
                  type="checkbox"
                  checked={currentFeatures.card}
                  onChange={(e) => updateFeature("card", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-amber-400" /> Dinheiro Físico (com troco)
                </span>
                <input
                  type="checkbox"
                  checked={currentFeatures.money}
                  onChange={(e) => updateFeature("money", e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

