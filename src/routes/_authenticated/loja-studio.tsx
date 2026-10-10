import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Send,
  Paperclip,
  Share2,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Clock,
  MapPin,
  MessageCircle,
  Loader2,
  Image as ImageIcon,
  Truck,
  Tag,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  processLojaAiChat,
  saveLojaToBioPage,
  type LojaData,
  type LojaAiMessage,
  type LojaProductItem,
} from "@/modules/loja/lojaAiService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/loja-studio")({
  component: LojaStudioPage,
});

const DEFAULT_LOJA: LojaData = {
  storeName: "Aura Concept Store",
  niche: "moda_feminina",
  tagline: "Moda contemporânea, alfaiataria elegante e tendências exclusivas",
  description: "Peças selecionadas com tecidos nobres, acabamento impecável e caimento perfeito para o seu dia a dia.",
  whatsapp: "5511999999999",
  address: "Av. Paulista, 1000 - Loja 12 - Bela Vista",
  shippingInfo: "Envio para todo o Brasil • Frete grátis acima de R$ 199",
  openingHours: "Segunda a Sábado das 10h às 20h",
  themeColor: "blue",
  styleVariant: "store-modern",
  categories: [
    { id: "todos", name: "Todos", icon: "🛍️" },
    { id: "novidades", name: "Novidades", icon: "✨" },
    { id: "vestidos", name: "Vestidos & Conjuntos", icon: "👗" },
    { id: "alfaiataria", name: "Alfaiataria", icon: "🧥" },
    { id: "acessorios", name: "Bolsas & Acessórios", icon: "👜" },
  ],
  items: [
    {
      id: "prod-1",
      name: "Vestido Midi Alfaiataria Breeze",
      description: "Tecido estruturado com fenda lateral sutil, decote em V clássico e cinto forrado no mesmo tom.",
      price: 249.9,
      category: "vestidos",
      badge: "Lançamento",
      isPopular: true,
      variations: ["P", "M", "G"],
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-2",
      name: "Blazer Oversized Crepe Milano",
      description: "Modelagem alongada com ombreiras leves e forro em cetim maquinetado. Perfeito para compor looks casuais ou executivos.",
      price: 299.0,
      category: "alfaiataria",
      badge: "Best Seller ⭐",
      isPopular: true,
      variations: ["38", "40", "42"],
      image: "https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-3",
      name: "Bolsa Baguette Couro Legítimo",
      description: "Design italiano minimalista com alça regulável, fechamento magnético e ferragens douradas banhadas.",
      price: 189.9,
      category: "acessorios",
      badge: "Destaque",
      isPopular: false,
      variations: ["Caramelo", "Preto", "Off White"],
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-4",
      name: "Calça Wide Leg Linho Puro",
      description: "Cós alto anatômico com bolsos faca e caimento reto e solto. Máximo frescor e elegância.",
      price: 219.0,
      category: "alfaiataria",
      isPopular: false,
      variations: ["36", "38", "40", "42"],
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
    },
  ],
};

function LojaStudioPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loja, setLoja] = useState<LojaData>(DEFAULT_LOJA);
  const [messages, setMessages] = useState<LojaAiMessage[]>([
    {
      id: "msg-1",
      role: "assistant",
      content:
        "Catálogo gerado! Diga quais produtos, preços ou categorias deseja alterar ou incluir.",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; mimeType: string; dataBase64: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPageUrl, setSavedPageUrl] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Se veio parâmetro da prospecção ou ID de página salva
  useEffect(() => {
    if (searchParams?.page) {
      supabase
        .from("bio_pages")
        .select("id, slug, display_name, description, whatsapp, social_links")
        .eq("id", searchParams.page)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const rawSocial = (data.social_links as Record<string, any>) || {};
            if (rawSocial.store_data) {
              setLoja(rawSocial.store_data);
              setSavedPageUrl(`/p/${data.slug}`);
            } else {
              setLoja((prev) => ({
                ...prev,
                storeName: data.display_name || prev.storeName,
                whatsapp: data.whatsapp || prev.whatsapp,
                tagline: data.description || prev.tagline,
                address: rawSocial.address || prev.address,
              }));
              setSavedPageUrl(`/p/${data.slug}`);
            }
          }
        });
    } else if (searchParams?.name) {
      setLoja((prev) => ({
        ...prev,
        storeName: searchParams.name,
        address: searchParams.address || prev.address,
        whatsapp: searchParams.whatsapp || prev.whatsapp,
        tagline: searchParams.niche ? `Produtos e novidades em ${searchParams.niche}` : prev.tagline,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || "image/jpeg",
            dataBase64: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSendMessage() {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (isProcessing) return;

    const userMsg: LojaAiMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: inputMessage || "Analise estes produtos/documentos e monte a vitrine da loja.",
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setAttachments([]);
    setIsProcessing(true);

    try {
      const result = await processLojaAiChat(
        [...messages, userMsg],
        userMsg.content,
        userMsg.attachments,
        loja,
      );

      const assistantMsg: LojaAiMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: result.replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (result.updatedLoja) {
        setLoja(result.updatedLoja);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Tive uma oscilação na resposta da IA: ${err?.message || "Tente novamente"}. Pode clicar para reenviar!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSavePage() {
    setIsSaving(true);
    try {
      const res = await saveLojaToBioPage(loja, searchParams?.page || undefined);
      setSavedPageUrl(res.publicUrl);
    } catch (err: any) {
      alert(`Erro ao publicar loja: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function addToCart(itemId: string) {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  }

  const totalCartPrice = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = loja.items.find((it) => it.id === id);
    return acc + (item?.price || 0) * qty;
  }, 0);

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const filteredItems = loja.items.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "todos") return true;
    if (activeTab === "novidades") return item.isPopular || item.badge;
    return item.category === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Header Superior */}
      <header className="h-16 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                Gerador de Lojas & Catálogo Virtual
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-mono border border-blue-500/30">
                  Super Admin
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">
                E-commerce de alta conversão para Varejo, Roupas, Produtos & Vendas via WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Alternador Mobile / Web */}
        {/* Mobile Toggle: Chat vs Prévia */}
        <div className="flex lg:hidden items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              mobileTab === "chat"
                ? "bg-blue-600 text-white font-bold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              mobileTab === "preview"
                ? "bg-blue-600 text-white font-bold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Ver Prévia</span>
          </button>
        </div>

        {/* Desktop ViewMode: Mobile frame vs Desktop full */}
        <div className="hidden lg:flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              viewMode === "mobile"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              viewMode === "desktop"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {savedPageUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs hidden sm:inline-flex"
            >
              <a href={savedPageUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir Loja
              </a>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSavePage}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Publicar
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal Dividido: Chat + Prévia da Loja */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Painel Esquerdo: Chat IA Multimodal */}
        <div
          className={`w-full lg:w-[400px] xl:w-[440px] shrink-0 border-r border-white/10 flex flex-col bg-zinc-950/80 backdrop-blur-xl h-full z-10 ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="p-3 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-blue-400">
              <Sparkles className="h-3.5 w-3.5" /> Editor com IA
            </span>
            {/* Atalho mobile para ver prévia */}
            <button
              onClick={() => setMobileTab("preview")}
              className="lg:hidden text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Ver Prévia →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-bl-xs shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {m.attachments.map((att, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-zinc-300"
                        >
                          <Paperclip className="h-2.5 w-2.5" /> {att.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-blue-400 p-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Atualizando catálogo...</span>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Anexos */}
          {attachments.length > 0 && (
            <div className="p-2 border-t border-white/10 bg-zinc-900/40 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg border border-white/10"
                >
                  <Paperclip className="h-3 w-3 text-blue-400" />
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-zinc-500 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input do Chat */}
          <div className="p-3 border-t border-white/10 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <label
                htmlFor="loja-file-upload"
                className="cursor-pointer h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 grid place-items-center text-zinc-400 hover:text-white transition-colors"
                title="Subir foto de produto ou catálogo em PDF"
              >
                <Paperclip className="h-4 w-4" />
                <input
                  id="loja-file-upload"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ex: Adicione uma bolsa preta por R$ 180..."
                className="bg-zinc-950 border-white/10 h-10 text-xs rounded-xl focus-visible:ring-blue-500"
              />

              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={isProcessing || (!inputMessage.trim() && attachments.length === 0)}
                className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-3.5 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Painel Direito: A Loja ao Vivo */}
        <div
          className={`flex-1 min-w-0 bg-zinc-950 overflow-y-auto flex flex-col items-center justify-start p-3 sm:p-5 lg:p-8 h-full ${
            mobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div
            className={`transition-all duration-300 w-full ${
              viewMode === "mobile"
                ? "max-w-[400px] rounded-[36px] border-[6px] border-zinc-800 shadow-2xl bg-zinc-900 overflow-hidden my-auto"
                : "max-w-4xl rounded-2xl border border-white/10 shadow-2xl bg-zinc-900 overflow-hidden my-auto"
            }`}
          >
            {/* Header da Loja */}
            <div className="relative bg-gradient-to-b from-blue-950/60 to-zinc-900 p-6 border-b border-white/10">
              <Badge className="bg-blue-600 text-white mb-2 text-[10px] font-bold tracking-wider uppercase">
                Vitrine Online Aberta 🟢
              </Badge>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {loja.storeName}
              </h2>
              <p className="text-xs text-blue-200/90 mt-1 font-medium">
                {loja.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-300">
                {loja.shippingInfo && (
                  <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                    <Truck className="h-3 w-3 text-blue-400" />
                    {loja.shippingInfo}
                  </span>
                )}
                {loja.address && (
                  <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    {loja.address}
                  </span>
                )}
              </div>

              {/* Busca em Tempo Real */}
              <div className="mt-3.5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos, modelos ou cores..."
                  className="w-full pl-9 pr-4 h-9 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="px-4 py-3 bg-zinc-900/90 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-10 backdrop-blur-md">
              {loja.categories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <span>{cat.icon || "🛍️"}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Grade de Produtos */}
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const quantity = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="group bg-zinc-950/80 border border-white/5 hover:border-blue-500/30 rounded-2xl p-3.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {item.image ? (
                        <div className="relative mb-3 h-40 w-full rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.badge && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-md">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3 h-32 w-full rounded-xl bg-zinc-800 grid place-items-center text-zinc-600">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}

                      <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {item.variations && item.variations.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {item.variations.map((v, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="text-base font-black text-blue-400">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </div>

                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Comprar +
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-zinc-800 border border-blue-500/40 rounded-lg p-0.5">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 rounded-md bg-zinc-700 hover:bg-zinc-600 grid place-items-center text-xs font-bold text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-blue-400 px-1">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="h-6 w-6 rounded-md bg-blue-600 hover:bg-blue-500 grid place-items-center text-xs font-bold text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra Flutuante do Carrinho / WhatsApp */}
            {totalCartCount > 0 && (
              <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md p-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Total da Sacola</span>
                  <span className="text-base font-black text-white">
                    R$ {totalCartPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-[10px] text-blue-400 ml-1.5">
                    ({totalCartCount} {totalCartCount === 1 ? "peça" : "peças"})
                  </span>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  <a
                    href={`https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(
                      `Olá! Gostaria de comprar pelo catálogo virtual da loja:\n${Object.entries(cart)
                        .map(([id, qty]) => {
                          const it = loja.items.find((x) => x.id === id);
                          return `• ${qty}x ${it?.name} - R$ ${((it?.price || 0) * qty).toFixed(2)}`;
                        })
                        .join("\n")}\n\nTotal: R$ ${totalCartPrice.toFixed(2)}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Enviar Pedido pelo WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão Flutuante Mobile: Voltar ao Chat quando estiver na Prévia */}
      {mobileTab === "preview" && (
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xl border border-blue-400/40 active:scale-95 transition-all"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Voltar ao Chat IA</span>
        </button>
      )}
    </div>
  );
}

