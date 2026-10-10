import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Utensils,
  Sparkles,
  ArrowLeft,
  Send,
  Paperclip,
  Share2,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  MessageCircle,
  Loader2,
  Image as ImageIcon,
  Flame,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  processCardapioAiChat,
  saveCardapioToBioPage,
  type CardapioData,
  type CardapioAiMessage,
  type CardapioItem,
} from "@/modules/cardapio/cardapioAiService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cardapio-studio")({
  component: CardapioStudioPage,
});

const DEFAULT_CARDAPIO: CardapioData = {
  restaurantName: "Burger & Co. Artesanal",
  niche: "hamburgueria",
  tagline: "O melhor smash e burger artesanal da cidade",
  description: "Ingredientes frescos, pão brioche amanteigado selado e molhos especiais feitos diariamente.",
  whatsapp: "5511999999999",
  address: "Rua das Delícias, 150 - Centro",
  deliveryFee: "A partir de R$ 6,90",
  minOrder: 25.0,
  openingHours: "Terça a Domingo das 18h às 23h30",
  themeColor: "orange",
  styleVariant: "ifood-modern",
  categories: [
    { id: "todos", name: "Todos", icon: "🍽️" },
    { id: "destaques", name: "Mais Pedidos", icon: "⭐" },
    { id: "burgers", name: "Burgers Artesanais", icon: "🍔" },
    { id: "porcoes", name: "Porções & Fritas", icon: "🍟" },
    { id: "bebidas", name: "Bebidas Geladas", icon: "🥤" },
  ],
  items: [
    {
      id: "item-1",
      name: "Smash Bacon Especial",
      description: "2x carnes smash 90g crocantes, dobro de queijo cheddar derretido, farofa de bacon crocante e maionese defumada no pão brioche.",
      price: 36.9,
      category: "burgers",
      badge: "Mais Pedido ⭐",
      isPopular: true,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "item-2",
      name: "Truffled Gorgonzola Burger",
      description: "Blend 180g de costela angus, creme suave de gorgonzola, cebola caramelizada e toque de azeite trufado.",
      price: 42.0,
      category: "burgers",
      badge: "Chef's Choice",
      isPopular: true,
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "item-3",
      name: "Batata Crinkle com Cheddar & Bacon",
      description: "Batatas crocantes onduladas cobertas com creme de queijo cheddar e cubos de bacon dourado.",
      price: 24.9,
      category: "porcoes",
      badge: "Para Compartilhar",
      isPopular: false,
      image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "item-4",
      name: "Refrigerante Lata 350ml",
      description: "Coca-Cola, Guaraná Antarctica ou Zero Açúcar bem gelados.",
      price: 7.0,
      category: "bebidas",
      isPopular: false,
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    },
  ],
};

function CardapioStudioPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [activeTab, setActiveTab] = useState<"todos" | string>("todos");
  const [cardapio, setCardapio] = useState<CardapioData>(DEFAULT_CARDAPIO);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<CardapioAiMessage[]>([
    {
      id: "msg-1",
      role: "assistant",
      content:
        "Cardápio gerado! Digite o que deseja alterar ou envie fotos do cardápio/PDF para atualizar automaticamente.",
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
            if (rawSocial.cardapio_data) {
              setCardapio(rawSocial.cardapio_data);
              setSavedPageUrl(`/p/${data.slug}`);
            } else {
              setCardapio((prev) => ({
                ...prev,
                restaurantName: data.display_name || prev.restaurantName,
                whatsapp: data.whatsapp || prev.whatsapp,
                tagline: data.description || prev.tagline,
                address: rawSocial.address || prev.address,
              }));
              setSavedPageUrl(`/p/${data.slug}`);
            }
          }
        });
    } else if (searchParams?.name) {
      setCardapio((prev) => ({
        ...prev,
        restaurantName: searchParams.name,
        address: searchParams.address || prev.address,
        whatsapp: searchParams.whatsapp || prev.whatsapp,
        tagline: searchParams.niche ? `Especialidades em ${searchParams.niche}` : prev.tagline,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Upload multimodal
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

  // Enviar mensagem para a IA
  async function handleSendMessage(customText?: string) {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() && attachments.length === 0) return;

    const userMsg: CardapioAiMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setAttachments([]);
    setIsProcessing(true);

    try {
      const result = await processCardapioAiChat(
        [...messages, userMsg],
        textToSend,
        userMsg.attachments,
        cardapio,
      );

      const assistantMsg: CardapioAiMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: result.replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (result.updatedCardapio) {
        setCardapio(result.updatedCardapio);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Opa, deu uma oscilação aqui na resposta: ${err?.message || "Tente novamente"}. Pode clicar para reenviar!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  // Salvar cardápio como página viva
  async function handleSavePage() {
    setIsSaving(true);
    try {
      const res = await saveCardapioToBioPage(cardapio, searchParams?.page || undefined);
      setSavedPageUrl(res.publicUrl);
    } catch (err: any) {
      alert(`Erro ao publicar cardápio: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Funções do carrinho de simulação
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
    const item = cardapio.items.find((it) => it.id === id);
    return acc + (item?.price || 0) * qty;
  }, 0);

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const filteredItems = cardapio.items.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "todos") return true;
    if (activeTab === "destaques") return item.isPopular || item.badge;
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
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Utensils className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Cardápio Studio <span className="text-orange-400">IA</span>
                <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-300 border-orange-500/20">
                  Gastronomia
                </Badge>
              </h1>
              <p className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                {cardapio.restaurantName}
              </p>
            </div>
          </div>
        </div>

        {/* Controles Centrais / Dispositivo */}
        {/* Mobile Toggle: Chat vs Prévia */}
        <div className="flex lg:hidden items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              mobileTab === "chat"
                ? "bg-orange-500 text-white font-semibold shadow-xs"
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
                ? "bg-orange-500 text-white font-semibold shadow-xs"
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
                ? "bg-orange-500 text-white shadow-xs font-semibold"
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
                ? "bg-orange-500 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
        </div>

        {/* Ações Direitas */}
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
                Abrir Cardápio
              </a>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSavePage}
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20"
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

      {/* Conteúdo Principal Dividido: Chat + Visualizador */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Painel Esquerdo: Chat IA Especializada */}
        <div
          className={`w-full lg:w-[400px] xl:w-[440px] shrink-0 border-r border-white/10 flex flex-col bg-zinc-950/80 backdrop-blur-xl h-full z-10 ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="p-3 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-orange-400">
              <Sparkles className="h-3.5 w-3.5" /> Editor com IA
            </span>
            {/* Atalho mobile para ver prévia */}
            <button
              onClick={() => setMobileTab("preview")}
              className="lg:hidden text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              Ver Prévia →
            </button>
          </div>

          {/* Lista de Mensagens */}
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
                      ? "bg-orange-600 text-white rounded-br-xs"
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
              <div className="flex items-center gap-2 text-xs text-orange-400 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Atualizando cardápio...</span>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Atalhos Rápidos */}
          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage("Crie uma sobremesa especial irresistível para aumentar o ticket médio.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-orange-500/40 hover:text-orange-400 transition-all"
            >
              🍮 Adicionar Sobremesa
            </button>
            <button
              onClick={() => handleSendMessage("Monte um combo promocional com burger, fritas e refrigerante.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-orange-500/40 hover:text-orange-400 transition-all"
            >
              🔥 Criar Combo Casal
            </button>
            <button
              onClick={() => handleSendMessage("Mude o tema visual para um estilo bistro dark elegante.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-orange-500/40 hover:text-orange-400 transition-all"
            >
              🎨 Tema Bistro Dark
            </button>
          </div>

          {/* Barra de Entrada com Suporte Multimodal */}
          <div className="p-3 border-t border-white/10 bg-zinc-900/60">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px]"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-colors border border-white/5">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Peça alterações ou envie fotos do cardápio..."
                className="bg-zinc-950 border-white/10 text-xs h-10 rounded-xl"
              />

              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={isProcessing || (!inputMessage.trim() && attachments.length === 0)}
                className="bg-orange-600 hover:bg-orange-500 text-white h-10 px-3.5 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Painel Direito: O Cardápio Interativo ao Vivo */}
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
            {/* Topo do Restaurante */}
            <div className="relative bg-gradient-to-b from-orange-950/60 to-zinc-900 p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-orange-500 text-white mb-2 text-[10px] font-bold tracking-wider uppercase">
                    Aberto para Pedidos 🟢
                  </Badge>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {cardapio.restaurantName}
                  </h2>
                  <p className="text-xs text-orange-200/90 mt-1 font-medium">
                    {cardapio.tagline}
                  </p>
                </div>
              </div>

              {/* Informações de Entrega */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300">
                <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                  <Clock className="h-3 w-3 text-orange-400" />
                  {cardapio.openingHours}
                </span>
                <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                  <ShoppingBag className="h-3 w-3 text-orange-400" />
                  Taxa: {cardapio.deliveryFee}
                </span>
                {cardapio.address && (
                  <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                    <MapPin className="h-3 w-3 text-orange-400" />
                    {cardapio.address}
                  </span>
                )}
              </div>

              {/* 🔍 Barra de Busca em Tempo Real no Preview */}
              <div className="mt-3.5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar pratos, lanches ou bebidas..."
                  className="w-full pl-9 pr-4 h-9 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Categorias em Abas Roláveis */}
            <div className="px-4 py-3 bg-zinc-900/90 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-10 backdrop-blur-md">
              {cardapio.categories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <span>{cat.icon || "🍽️"}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Lista de Itens do Cardápio */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {filteredItems.map((item) => {
                const quantity = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="group bg-zinc-950/80 border border-white/5 hover:border-orange-500/30 rounded-2xl p-3.5 transition-all flex gap-3.5 items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white truncate">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-2 text-sm font-black text-orange-400">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </div>
                    </div>

                    {/* Foto do Prato e Botão de Adicionar */}
                    <div className="relative shrink-0 flex flex-col items-end gap-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-zinc-800 grid place-items-center text-zinc-600">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}

                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Adicionar +
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-zinc-800 border border-orange-500/40 rounded-lg p-0.5">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 rounded-md bg-zinc-700 hover:bg-zinc-600 grid place-items-center text-xs font-bold text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-orange-400 px-1">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="h-6 w-6 rounded-md bg-orange-600 hover:bg-orange-500 grid place-items-center text-xs font-bold text-white"
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

            {/* Barra Flutuante da Sacola / Enviar para WhatsApp */}
            {totalCartCount > 0 && (
              <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md p-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Total do Pedido</span>
                  <span className="text-base font-black text-white">
                    R$ {totalCartPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-[10px] text-orange-400 ml-1.5">
                    ({totalCartCount} {totalCartCount === 1 ? "item" : "itens"})
                  </span>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  <a
                    href={`https://wa.me/${cardapio.whatsapp}?text=${encodeURIComponent(
                      `Olá! Gostaria de fazer um pedido pelo cardápio:\n${Object.entries(cart)
                        .map(([id, qty]) => {
                          const it = cardapio.items.find((x) => x.id === id);
                          return `• ${qty}x ${it?.name} - R$ ${((it?.price || 0) * qty).toFixed(2)}`;
                        })
                        .join("\n")}\n\nTotal: R$ ${totalCartPrice.toFixed(2)}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Enviar pelo WhatsApp
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
          className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-2xl border border-orange-400/40 active:scale-95 transition-all"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Voltar ao Chat IA</span>
        </button>
      )}
    </div>
  );
}

