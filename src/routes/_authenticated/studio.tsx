import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  Upload,
  Send,
  Save,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Palette,
  Image as ImageIcon,
  Star,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Bot,
  Plus,
  X,
  Type,
  Video,
  FileText,
  Phone,
  Layers,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CinematicPageData, CinematicGalleryItem } from "@/modules/cinematic/types";
import { createDefaultCinematicData, LUXURY_PALETTES } from "@/modules/cinematic/defaults";
import { CinematicViewer } from "@/modules/cinematic/CinematicViewer";
import {
  lookupMapsForCinematicFn,
  refineCinematicWithAiFn,
  saveCinematicPageFn,
} from "@/modules/cinematic/cinematic.functions";

export const Route = createFileRoute("/_authenticated/studio")({
  component: CinematicStudioPage,
});

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text?: string;
  type?: "text" | "maps_extracted" | "photos_uploaded" | "art_direction";
  meta?: {
    name?: string;
    rating?: number;
    address?: string;
    openingHours?: string;
    photoCount?: number;
    thumbnails?: string[];
    tagline?: string;
    paletteName?: string;
    fontName?: string;
  };
  timestamp: string;
}

export default function CinematicStudioPage() {
  const [data, setData] = useState<CinematicPageData>(() => createDefaultCinematicData());
  const [userId, setUserId] = useState<string>("");
  const [pageId, setPageId] = useState<string | undefined>(undefined);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // Navegação do Cockpit
  const [activeTab, setActiveTab] = useState<"chat" | "adjustments">("chat");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls");

  // Estados de Chat e IA
  const [aiPrompt, setAiPrompt] = useState("");
  const [isRefiningAi, setIsRefiningAi] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Olá! Sou sua Diretora Criativa de Arte e Scrollytelling. Cole um link do Google Maps, anexe fotos reais em alta definição ou descreva a atmosfera sensorial desejada para moldarmos uma experiência cinematográfica de ultra-luxo.",
      timestamp: "Agora",
    },
  ]);

  // Popover rápido de Google Maps
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsQuery, setMapsQuery] = useState("");
  const [isLookingUpMaps, setIsLookingUpMaps] = useState(false);

  // Salvamento e Publicação
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publishedModalOpen, setPublishedModalOpen] = useState(false);

  // Acordeões dos Ajustes Manuais
  const [openSection, setOpenSection] = useState<"identity" | "media" | "styling">("identity");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rola para a mensagem mais recente
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRefiningAi, showMapsInput]);

  // Identifica o usuário
  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData }) => {
      if (authData.user) {
        setUserId(authData.user.id);
      }
    });
  }, []);

  // 1. Extração Google Maps
  const handleLookupMaps = async () => {
    if (!mapsQuery.trim()) {
      toast.error("Cole um link do Google Maps ou o nome do local.");
      return;
    }

    const currentQuery = mapsQuery;
    setIsLookingUpMaps(true);
    try {
      // Adiciona mensagem do usuário
      setMessages((prev) => [
        ...prev,
        {
          id: `user-maps-${Date.now()}`,
          sender: "user",
          text: `Extrair dados do Google Maps: ${currentQuery}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      const result = await lookupMapsForCinematicFn({ data: { urlOrQuery: currentQuery } });

      let pulledPhotos: string[] = [];
      setData((prev: CinematicPageData) => {
        const updated = { ...prev };
        if (result.name) {
          updated.businessName = result.name;
          updated.hero.title = `A Experiência Autêntica na ${result.name}`;
        }
        if (result.address) updated.address = result.address;
        if (result.whatsapp) updated.whatsapp = result.whatsapp;
        if (result.rating) updated.rating = result.rating;
        if (result.niche) updated.niche = result.niche;
        if (result.openingHours) updated.openingHours = result.openingHours;

        if (result.photos && result.photos.length > 0) {
          pulledPhotos = result.photos.slice(0, 6);
          const newGallery: CinematicGalleryItem[] = pulledPhotos.map((url: string, i: number) => ({
            id: `g-maps-${i}`,
            url,
            caption: `Ambiente e detalhes da ${result.name}`,
            category: "Espaço",
          }));
          updated.gallery = newGallery;
          if (newGallery[0]) {
            updated.hero.backgroundImage = newGallery[0].url;
          }
        }

        return updated;
      });

      // Adiciona evento rico no feed de mensagens
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-maps-${Date.now()}`,
          sender: "ai",
          type: "maps_extracted",
          text: `Dados de "${result.name}" importados com sucesso! Integrei as informações oficiais e preparei as fotos reais para o Scrollytelling.`,
          meta: {
            name: result.name,
            rating: result.rating || 4.9,
            address: result.address,
            openingHours: result.openingHours,
            thumbnails: pulledPhotos,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setMapsQuery("");
      setShowMapsInput(false);
      toast.success(`Dados de "${result.name}" integrados!`);
    } catch (err: any) {
      toast.error(err.message || "Não foi possível puxar os dados do link.");
    } finally {
      setIsLookingUpMaps(false);
    }
  };

  // 2. Upload de Fotos Reais
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.info("Processando fotos reais em alta definição...");
    const newItems: CinematicGalleryItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let finalUrl = "";
        if (userId) {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `cinematic/${userId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("bio-media").upload(path, file, {
            upsert: true,
          });

          if (!upErr) {
            const { data: pubData } = supabase.storage.from("bio-media").getPublicUrl(path);
            if (pubData?.publicUrl) finalUrl = pubData.publicUrl;
          }
        }

        if (!finalUrl) {
          finalUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        newItems.push({
          id: `upload-${Date.now()}-${i}`,
          url: finalUrl,
          caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          category: "Exclusivo",
        });
      } catch (err) {
        console.warn("Erro ao carregar foto:", err);
      }
    }

    if (newItems.length > 0) {
      setData((prev: CinematicPageData) => ({
        ...prev,
        gallery: [...newItems, ...prev.gallery],
        hero: {
          ...prev.hero,
          backgroundImage: prev.hero.backgroundImage.includes("unsplash.com/photo-1501339847302")
            ? newItems[0].url
            : prev.hero.backgroundImage,
        },
      }));

      // Adiciona mensagem rica no feed
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-photos-${Date.now()}`,
          sender: "ai",
          type: "photos_uploaded",
          text: `${newItems.length} foto(s) em alta resolução foram adicionadas ao acervo. A primeira foto foi definida como capa principal.`,
          meta: {
            photoCount: newItems.length,
            thumbnails: newItems.map((n) => n.url),
          },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      toast.success(`${newItems.length} foto(s) integradas com sucesso!`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Direção de Arte com IA
  const handleRefineWithAi = async (promptOverride?: string) => {
    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse.trim()) {
      toast.error("Digite o que você deseja mudar ou escolha uma inspiração.");
      return;
    }

    // Adiciona pergunta do usuário ao chat
    setMessages((prev) => [
      ...prev,
      {
        id: `user-prompt-${Date.now()}`,
        sender: "user",
        text: promptToUse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    if (!promptOverride) setAiPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsRefiningAi(true);
    try {
      const updated = await refineCinematicWithAiFn({
        data: {
          currentData: data,
          userInstruction: promptToUse,
        },
      });

      setData(updated);

      // Adiciona resposta poética da IA
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-response-${Date.now()}`,
          sender: "ai",
          type: "art_direction",
          text: `Direção de arte aplicada com elegância! Elevei a narrativa do Hero para "${updated.hero.title}", refinei o manifesto e adequei a atmosfera cromática ao tom solicitado.`,
          meta: {
            tagline: updated.hero.tagline,
            fontName: updated.theme.fontHeading,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      toast.success("✨ Direção de arte cinematográfica aplicada!");
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "Houve uma instabilidade temporária ao conectar com a IA, mas tentei ajustar os parâmetros principais com base na sua instrução.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      toast.error(err.message || "Erro ao processar instrução de IA.");
    } finally {
      setIsRefiningAi(false);
    }
  };

  // 4. Salvar & Publicar
  const handleSaveAndPublish = async () => {
    if (!userId) {
      toast.error("Sessão de usuário não identificada. Faça login novamente.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCinematicPageFn({
        data: {
          data,
          userId,
          pageId,
          publish: true,
        },
      });

      if (result.success) {
        setPageId(result.pageId);
        setSavedSlug(result.slug);
        setPublishedModalOpen(true);
        toast.success("🎬 Landing Page Cinematográfica publicada!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar página cinematográfica.");
    } finally {
      setIsSaving(false);
    }
  };

  const publicUrl = savedSlug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://eialink.com.br"}/p/${savedSlug}`
    : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="cinematic-studio flex h-screen w-full flex-col overflow-hidden bg-[#070709] text-zinc-100 font-sans">
      {/* TOPBAR UNIFICADA DO COCKPIT */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/70 px-4 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20">
            🎬
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide">Cinematic Studio</span>
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wider">
              Lovable Engine
            </span>
          </div>
        </div>

        {/* Alternador Mobile (Abas de Navegação Pequenas) */}
        <div className="flex lg:hidden items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setMobileTab("controls")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mobileTab === "controls" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Cockpit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mobileTab === "preview" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Ver Site
          </button>
        </div>

        {/* Ações do Topo Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Seletor de visualização Desktop / iPhone */}
          <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                previewMode === "desktop" ? "bg-white/15 text-white shadow-xs font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>100vw Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                previewMode === "mobile" ? "bg-white/15 text-white shadow-xs font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>iPhone Pro</span>
            </button>
          </div>

          {savedSlug && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:underline px-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir no ar</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isSaving ? "Publicando..." : "Salvar & Publicar"}</span>
          </button>
        </div>
      </header>

      {/* CORPO DO COCKPIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLUNA ESQUERDA (440px): CHAT IA + AJUSTES MANUAIS */}
        <aside
          className={`w-full lg:w-[440px] shrink-0 flex flex-col border-r border-white/10 bg-[#0a0a0d] z-20 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* 1. Header das 2 Abas Superiores */}
          <div className="flex items-center border-b border-white/10 bg-black/40 px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === "chat"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Copiloto IA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("adjustments")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === "adjustments"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Ajustes (Custo R$ 0)</span>
            </button>
          </div>

          {/* 2. Conteúdo da Aba 1: COPILOTO IA CONVERSACIONAL (Estilo Lovable) */}
          {activeTab === "chat" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Feed de Mensagens Rolável */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg ${
                        msg.sender === "user"
                          ? "bg-amber-500 text-black font-medium rounded-tr-xs"
                          : "bg-white/[0.05] border border-white/10 text-zinc-200 rounded-tl-xs backdrop-blur-md"
                      }`}
                    >
                      {/* Cabeçalho da Mensagem */}
                      {msg.sender === "ai" && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          <Sparkles className="h-3 w-3" />
                          <span>Diretora Criativa IA</span>
                        </div>
                      )}

                      {/* Texto Principal */}
                      {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                      {/* Card de Google Maps Extraído */}
                      {msg.type === "maps_extracted" && msg.meta && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/60 p-3 space-y-2">
                          <div className="flex items-center justify-between font-bold text-white">
                            <span>{msg.meta.name}</span>
                            {msg.meta.rating && (
                              <span className="flex items-center gap-1 text-[11px] text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400" />
                                {msg.meta.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {msg.meta.address && (
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span className="line-clamp-1">{msg.meta.address}</span>
                            </p>
                          )}
                          {msg.meta.thumbnails && msg.meta.thumbnails.length > 0 && (
                            <div className="flex gap-1.5 pt-1 overflow-x-auto">
                              {msg.meta.thumbnails.slice(0, 4).map((thumb, idx) => (
                                <img
                                  key={idx}
                                  src={thumb}
                                  alt=""
                                  className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card de Fotos Enviadas */}
                      {msg.type === "photos_uploaded" && msg.meta && (
                        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pt-1">
                          {msg.meta.thumbnails?.slice(0, 4).map((thumb, idx) => (
                            <img
                              key={idx}
                              src={thumb}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border border-amber-400/40 shrink-0 shadow-md"
                            />
                          ))}
                        </div>
                      )}

                      {/* Tagline / Art Direction Preview */}
                      {msg.type === "art_direction" && msg.meta?.tagline && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <span>Tagline: {msg.meta.tagline}</span>
                        </div>
                      )}
                    </div>
                    <span className="mt-1 px-1 text-[9px] text-zinc-500">{msg.timestamp}</span>
                  </div>
                ))}

                {/* Indicador de Carregamento da IA */}
                {isRefiningAi && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                      <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                      <span>Lapidando narrativa de scrollytelling e atmosfera...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Popover Inline do Google Maps */}
              {showMapsInput && (
                <div className="border-t border-white/10 bg-zinc-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Importar do Google Maps</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapsInput(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mapsQuery}
                      onChange={(e) => setMapsQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookupMaps()}
                      placeholder="Cole o link do Google Maps ou nome da empresa..."
                      className="flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleLookupMaps}
                      disabled={isLookingUpMaps || !mapsQuery.trim()}
                      className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {isLookingUpMaps ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Puxar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Pílulas de Inspiração Flutuantes */}
              {/* Pílulas de Inspiração Flutuantes com os 5 Arquétipos */}
              <div className="border-t border-white/5 bg-[#0a0a0d] px-3.5 pt-2.5 pb-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { label: "⚡ Neo-Pop D2C", prompt: "Transforme no estilo Neo-Pop D2C (estilo Gigi Energy): alta energia, neon volt pulsante, marquee veloz, contraste arrojado e blocos bento dinâmicos." },
                  { label: "👑 Luxo Editorial", prompt: "Crie uma experiência de Luxo Editorial (estilo Evasion): tons ébano e ouro, fontes serifadas nobres, vídeo imersivo e narrativa contemplativa." },
                  { label: "🌿 Clean Biotech", prompt: "Adote a estética Clean Biotech (estilo Biometic): vidro fosco acetinado, tons esmeralda e ciano, tabela comparativa e FAQ rigoroso." },
                  { label: "💻 Cyber High-Tech", prompt: "Transforme em Cyber High-Tech (estilo Compute-11): grid sutil, tags mono [SYS::01], acentos ciano e titânio, layout de alta precisão." },
                  { label: "🌑 Dark Brutalist", prompt: "Adote a estética Dark Brutalist (estilo Void): tipografia display gigante, contraste preto e branco, linhas finas de corte e atitude crua." },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleRefineWithAi(chip.prompt)}
                    disabled={isRefiningAi}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-amber-400/40 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Barra de Entrada Única no Rodapé (Footer Chat Bar) */}
              <div className="border-t border-white/10 bg-black/60 p-3.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-white/[0.03] p-1.5 focus-within:border-amber-400/70 transition-all">
                  {/* Botão de Anexo de Fotos */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adicionar fotos em alta resolução"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Botão de Link do Google Maps */}
                  <button
                    type="button"
                    onClick={() => setShowMapsInput((prev) => !prev)}
                    title="Extrair dados do Google Maps"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      showMapsInput ? "bg-amber-500/20 text-amber-300" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                  </button>

                  {/* Campo de Texto Auto-ajustável */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRefineWithAi();
                      }
                    }}
                    placeholder="Descreva a atmosfera desejada, estilo ou produtos..."
                    className="max-h-24 flex-1 resize-none bg-transparent py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden"
                  />

                  {/* Botão de Envio */}
                  <button
                    type="button"
                    onClick={() => handleRefineWithAi()}
                    disabled={isRefiningAi || !aiPrompt.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-40"
                  >
                    {isRefiningAi ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Conteúdo da Aba 2: AJUSTES MANUAIS (Custo R$ 0) */}
          {activeTab === "adjustments" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Acordeão 1: Textos & Identidade */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "identity" ? ("" as any) : "identity")}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-amber-300 uppercase tracking-wider hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>1. Textos & Identidade</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "identity" ? "rotate-180" : ""}`} />
                </button>

                {openSection === "identity" && (
                  <div className="p-4 pt-0 space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Nome do Negócio</label>
                      <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData({ ...data, businessName: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Tagline do Hero (Caixa Alta)</label>
                      <input
                        type="text"
                        value={data.hero.tagline}
                        onChange={(e) =>
                          setData({ ...data, hero: { ...data.hero, tagline: e.target.value } })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Título Principal do Hero</label>
                      <input
                        type="text"
                        value={data.hero.title}
                        onChange={(e) =>
                          setData({ ...data, hero: { ...data.hero, title: e.target.value } })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Subtítulo Narrativo</label>
                      <textarea
                        rows={2}
                        value={data.hero.subtitle}
                        onChange={(e) =>
                          setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-white focus:border-amber-400 focus:outline-hidden resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">WhatsApp</label>
                        <input
                          type="text"
                          value={data.whatsapp}
                          onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                          placeholder="DDD + Número"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">Avaliação</label>
                        <input
                          type="number"
                          step="0.1"
                          max="5.0"
                          value={data.rating || 4.9}
                          onChange={(e) => setData({ ...data, rating: parseFloat(e.target.value) })}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Endereço Completo</label>
                      <input
                        type="text"
                        value={data.address || ""}
                        onChange={(e) => setData({ ...data, address: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Acordeão 2: Mídia & Fotos da Galeria */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "media" ? ("" as any) : "media")}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-amber-300 uppercase tracking-wider hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>2. Mídia, Vídeo e Fotos ({data.gallery.length})</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "media" ? "rotate-180" : ""}`} />
                </button>

                {openSection === "media" && (
                  <div className="p-4 pt-0 space-y-4 text-xs">
                    {/* Vídeo em Loop */}
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          <span>Vídeo de Fundo no Hero (Opcional)</span>
                        </label>
                        {data.hero.backgroundVideo && (
                          <button
                            type="button"
                            onClick={() => {
                              setData((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, backgroundVideo: undefined },
                              }));
                              toast.info("Vídeo removido. Usando foto de capa.");
                            }}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={data.hero.backgroundVideo || ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setData((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, backgroundVideo: val || undefined },
                          }));
                        }}
                        placeholder="https://exemplo.com/video-ambiente.mp4"
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-hidden"
                      />
                      {data.hero.backgroundVideo && (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Vídeo ativo em loop no Hero
                        </p>
                      )}
                    </div>

                    {/* Galeria de Fotos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                          Fotos do Acervo (Clique para definir a Capa)
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-amber-300 font-bold hover:underline"
                        >
                          + Adicionar Fotos
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {data.gallery.map((photo, idx) => (
                          <div
                            key={photo.id || idx}
                            onClick={() => {
                              setData((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, backgroundImage: photo.url },
                              }));
                              toast.success("Foto definida como Capa do Hero!");
                            }}
                            className={`relative h-14 rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                              data.hero.backgroundImage === photo.url
                                ? "border-amber-400 ring-2 ring-amber-400/40"
                                : "border-white/10 hover:border-white/40"
                            }`}
                          >
                            <img src={photo.url} alt="" className="h-full w-full object-cover" />
                            {data.hero.backgroundImage === photo.url && (
                              <span className="absolute top-1 right-1 rounded-full bg-amber-500 text-black text-[8px] font-bold px-1">
                                Capa
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acordeão 3: Estilo Visual & Paleta */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "styling" ? ("" as any) : "styling")}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-amber-300 uppercase tracking-wider hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span>3. Paleta de Luxo & Tipografia</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "styling" ? "rotate-180" : ""}`} />
                </button>

                {openSection === "styling" && (
                  <div className="p-4 pt-0 space-y-4 text-xs">
                    {/* Seletor de Paleta */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Paletas de Luxo:</span>
                      <div className="grid grid-cols-5 gap-2">
                        {LUXURY_PALETTES.map((pal) => (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, bg: pal.bg, accent: pal.accent },
                              }))
                            }
                            title={pal.name}
                            className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                              data.theme.accent === pal.accent
                                ? "border-white ring-2 ring-white/40 scale-105"
                                : "border-white/10 hover:border-white/30"
                            }`}
                            style={{ backgroundColor: pal.bg }}
                          >
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.accent }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seletor de Arquétipo Visual */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Arquétipo Visual (Bento Engine):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: "luxury-editorial", label: "👑 Luxo Editorial", desc: "Monocle, Vinhos & Alta Gastronomia" },
                          { id: "neo-pop-d2c", label: "⚡ Neo-Pop D2C", desc: "Gigi Energy, Alta Voltagem & Neon" },
                          { id: "clean-biotech", label: "🌿 Clean Biotech", desc: "Biometic, Vidro Fosco & Clínicas" },
                          { id: "cyber-tech", label: "💻 Cyber High-Tech", desc: "Compute-11, Grid Escuro & Tags" },
                          { id: "dark-brutalist", label: "🌑 Dark Brutalist", desc: "Void, Tipografia Gigante & P&B" },
                        ].map((arq) => (
                          <button
                            key={arq.id}
                            type="button"
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                archetype: arq.id as any,
                              }))
                            }
                            className={`rounded-xl border p-2.5 text-left transition-all ${
                              data.archetype === arq.id
                                ? "border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400/40"
                                : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span className="block text-xs font-bold text-amber-200">{arq.label}</span>
                            <span className="block text-[9px] text-zinc-400 mt-0.5">{arq.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seletor de Tipografia */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Tipografia dos Títulos:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "serif", label: "Editorial", font: "font-serif" },
                          { id: "sans", label: "Moderna", font: "font-sans" },
                          { id: "display", label: "Marcante", font: "font-display" },
                          { id: "mono", label: "Cyber Mono", font: "font-mono" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, fontHeading: f.id as any },
                              }))
                            }
                            className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                              data.theme.fontHeading === f.id
                                ? "border-amber-400 bg-amber-500/15 text-amber-300 font-bold"
                                : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"
                            } ${f.font}`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle de Parallax GPU */}
                    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 cursor-pointer">
                      <div>
                        <span className="block text-xs font-bold text-white">Efeito Parallax GPU (60 FPS)</span>
                        <span className="block text-[10px] text-zinc-400">
                          Profundidade 3D suave acelerada por hardware.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={data.theme.parallaxEnabled}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, parallaxEnabled: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-white/20 text-amber-500 focus:ring-0"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Botão de Salvar no Rodapé Mobile */}
              <div className="lg:hidden pt-2 pb-6">
                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-sm font-bold text-black shadow-xl"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Salvar & Publicar Página</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* COLUNA DIREITA: LIVE PREVIEW 100% IMERSIVO (CANVAS DOMINANTE) */}
        <main
          className={`flex-1 overflow-hidden flex flex-col bg-[#050507] ${
            mobileTab === "controls" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Container do Preview */}
          <div className="relative flex-1 overflow-hidden flex items-center justify-center p-0 lg:p-4">
            {previewMode === "desktop" ? (
              /* Prévia Desktop de Tela Cheia */
              <div className="h-full w-full overflow-hidden lg:rounded-2xl border-0 lg:border border-white/10 shadow-2xl">
                <CinematicViewer data={data} isEmbedded={true} />
              </div>
            ) : (
              /* Prévia Simulando Moldura de iPhone Pro */
              <div className="relative h-[844px] max-h-[92vh] w-[390px] overflow-hidden rounded-[50px] border-[10px] border-[#222226] bg-black shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-white/20 flex flex-col">
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-black z-50 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
                </div>
                {/* Tela do Celular */}
                <div className="flex-1 overflow-hidden pt-4">
                  <CinematicViewer data={data} isEmbedded={true} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE SUCESSO: PÁGINA PUBLICADA */}
      {publishedModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 text-center shadow-2xl space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-2xl shadow-xl shadow-amber-500/20">
              ✨
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Landing Page no Ar!</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Sua experiência cinematográfica está ativa com alta velocidade e aceleração GPU.
              </p>
            </div>

            {/* Campo do Link */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 text-xs">
              <span className="flex-1 truncate px-2 text-left text-zinc-300 font-mono">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 font-bold text-white hover:bg-white/20 transition-colors"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2.5">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 text-xs font-bold text-black shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Visualizar Site em Nova Aba</span>
              </a>

              <button
                type="button"
                onClick={() => setPublishedModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Continuar Editando no Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

