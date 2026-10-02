import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  Save,
  ExternalLink,
  Copy,
  Check,
  CheckCheck,
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
  Video,
  FileText,
  ChevronDown,
  Eye,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  CinematicPageData,
  CinematicGalleryItem,
  StudioChatMessage,
  CinematicConceptOption,
  CinematicHighlight,
} from "@/modules/cinematic/types";
import { createDefaultCinematicData, LUXURY_PALETTES } from "@/modules/cinematic/defaults";
import { CinematicViewer } from "@/modules/cinematic/CinematicViewer";
import {
  lookupMapsForCinematicFn,
  createCreativePitchFn,
  saveCinematicPageFn,
  extractServicesFromPdfTextFn,
} from "@/modules/cinematic/cinematic.functions";
import { extractAssetsFromPdf } from "@/lib/pdf-extractor";

export const Route = createFileRoute("/_authenticated/studio")({
  component: CinematicStudioPage,
});

export default function CinematicStudioPage() {
  const [data, setData] = useState<CinematicPageData>(() => createDefaultCinematicData());
  const [userId, setUserId] = useState<string>("");
  const [pageId, setPageId] = useState<string | undefined>(undefined);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // Navegação do Cockpit
  const [activeTab, setActiveTab] = useState<"chat" | "adjustments">("chat");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls");

  // Painel Redimensionável do Studio (Chat)
  const [chatWidth, setChatWidth] = useState<number>(440);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isResizingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      // Limita a largura entre 320px e 720px
      const newWidth = Math.min(Math.max(e.clientX, 320), 720);
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Estados de Chat e IA (Fluxo de Plano Criativo & Aprovação)
  const [aiPrompt, setAiPrompt] = useState("");
  const [isRefiningAi, setIsRefiningAi] = useState(false);
  const [messages, setMessages] = useState<StudioChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Olá! Sou seu Diretor de Arte. Envie fotos, cole o link do Google Maps ou me conte sobre o negócio para eu criar um plano exclusivo para você.",
      timestamp: "Agora",
    },
  ]);

  // Prévia Temporária de Opção (Espiar antes de aprovar)
  const [temporaryPreview, setTemporaryPreview] = useState<{
    optionId: "option_a" | "option_b";
    optionName: string;
    data: CinematicPageData;
  } | null>(null);

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

  // 1. Extração Google Maps Unificada
  const handleLookupMaps = async (targetQuery?: string) => {
    const currentQuery = (targetQuery || mapsQuery).trim();
    if (!currentQuery) {
      toast.error("Cole um link do Google Maps ou o nome do local.");
      return;
    }

    setIsLookingUpMaps(true);
    try {
      // Se não veio pelo chat (veio pelo popover), adiciona a mensagem do usuário
      if (!targetQuery) {
        setMessages((prev) => [
          ...prev,
          {
            id: `user-maps-${Date.now()}`,
            sender: "user",
            text: `Importar ficha do Google Maps: ${currentQuery}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }

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
          pulledPhotos = result.photos.slice(0, 8);
          const newGallery: CinematicGalleryItem[] = pulledPhotos.map((url: string, i: number) => ({
            id: `g-maps-${Date.now()}-${i}`,
            url,
            caption: `Ambiente e detalhes da ${result.name}`,
            category: "Espaço",
          }));
          updated.gallery = [...newGallery, ...prev.gallery.filter((g) => !g.id.startsWith("g-maps-"))];
          if (newGallery[0]) {
            updated.hero.backgroundImage = newGallery[0].url;
          }
        }

        return updated;
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-maps-${Date.now()}`,
          sender: "agent",
          text: `Importei os dados e fotos reais de "${result.name}". O site já está atualizado!\n\n• Endereço: ${result.address || "Confirmado"}\n• WhatsApp: ${result.whatsapp || "Configurado"}\n• Avaliação Google: ${result.rating ? `${result.rating} ★ (${result.reviewsCount || "várias"} avaliações)` : "4.9 ★"}\n\nComo deseja posicionar a marca agora? Você pode pedir ajustes de atmosfera visual, anexar cardápios/PDFs ou aprovar uma das propostas conceituais.`,
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
      toast.success(`Dados e fotos reais de "${result.name}" integrados!`);
    } catch (err: any) {
      toast.error(err.message || "Não foi possível puxar os dados do link.");
    } finally {
      setIsLookingUpMaps(false);
    }
  };

  // 2. Upload de Fotos Reais e Leitura Inteligente de Documentos PDF (Cardápio / Tabela de Preços)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const pdfFiles = fileList.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));

    // A) Processamento Inteligente de Documentos PDF
    for (const pdfFile of pdfFiles) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-pdf-${Date.now()}`,
          sender: "user",
          text: `📎 Documento enviado: ${pdfFile.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      const toastId = toast.loading(`Lendo documento "${pdfFile.name}" com IA...`);

      try {
        const extracted = await extractAssetsFromPdf(pdfFile);

        if (!extracted.extractedText || extracted.extractedText.trim().length < 10) {
          toast.dismiss(toastId);
          toast.error(`Não foi possível extrair texto legível do arquivo "${pdfFile.name}".`);
          continue;
        }

        const res = await extractServicesFromPdfTextFn({
          data: {
            text: extracted.extractedText,
            businessName: data.businessName,
            niche: data.niche,
          },
        });

        if (res.items && res.items.length > 0) {
          const newHighlights: CinematicHighlight[] = res.items.map((it, idx) => ({
            id: `hl-pdf-${Date.now()}-${idx}`,
            title: it.title,
            description: it.description,
            price: it.price,
            badge: it.badge || "Destaque",
          }));

          setData((prev) => ({
            ...prev,
            highlights: newHighlights,
          }));

          const itemsFormatted = res.items
            .map((it) => `• **${it.title}**${it.price ? ` (${it.price})` : ""}\n  _${it.description}_`)
            .join("\n\n");

          setMessages((prev) => [
            ...prev,
            {
              id: `agent-pdf-${Date.now()}`,
              sender: "agent",
              text: `Li o documento "${pdfFile.name}" e extraí os seguintes serviços para o site:\n\n${itemsFormatted}\n\nJá atualizei a vitrine e catálogo da sua página com esses dados!`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          toast.dismiss(toastId);
          toast.success(`Catálogo atualizado com ${res.items.length} itens do documento!`);
        } else {
          toast.dismiss(toastId);
          toast.info("Documento lido, mas nenhum item comercial explícito foi identificado.");
        }
      } catch (pdfErr: any) {
        toast.dismiss(toastId);
        toast.error(`Erro ao ler PDF: ${pdfErr?.message || "falha na leitura"}`);
      }
    }

    // B) Processamento de Fotos em Alta Definição
    if (imageFiles.length > 0) {
      toast.info(`Processando ${imageFiles.length} foto(s) reais em alta definição...`);
      const newItems: CinematicGalleryItem[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
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

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-photos-${Date.now()}`,
            sender: "agent",
            text: `${newItems.length} foto(s) em alta resolução foram adicionadas ao acervo e à galeria da página.`,
            meta: {
              photoCount: newItems.length,
              thumbnails: newItems.map((n) => n.url),
            },
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        toast.success(`${newItems.length} foto(s) integradas com sucesso!`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Diálogo e Plano Criativo com o Agente Diretor de Arte
  const handleSendMessage = async (promptOverride?: string) => {
    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse.trim()) {
      toast.error("Digite o que você deseja mudar ou cole um link do Google Maps.");
      return;
    }

    const trimmedPrompt = promptToUse.trim();

    // 3.1. Detecção Inteligente de Link ou Comando do Google Maps no Chat
    const mapsUrlMatch = trimmedPrompt.match(/https?:\/\/(?:maps\.app\.goo\.gl|[a-z0-9.]*google\.[a-z.]+\/maps|goo\.gl\/maps)[^\s]*/i) ||
      trimmedPrompt.match(/https?:\/\/(?:www\.)?google\.[a-z.]+\/search[^\s]*/i);
    const mapsCommandMatch = /^(?:importar|puxar|extrair|buscar dados|ficha do google|google maps)\s*[:\-]?\s*(.+)/i.exec(trimmedPrompt);

    if (mapsUrlMatch || mapsCommandMatch) {
      const queryToLookup = mapsUrlMatch ? mapsUrlMatch[0] : (mapsCommandMatch ? mapsCommandMatch[1].trim() : trimmedPrompt);

      const userMsg: StudioChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: promptToUse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!promptOverride) setAiPrompt("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      await handleLookupMaps(queryToLookup);
      return;
    }

    // 3.2. Fluxo Normal de Direção Criativa e Delta Inteligente
    const userMsg: StudioChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptToUse,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptOverride) setAiPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsRefiningAi(true);
    try {
      const history = [...messages, userMsg].map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const pitch = await createCreativePitchFn({
        data: {
          businessName: data.businessName,
          niche: data.niche,
          userMessage: promptToUse,
          currentData: data,
          conversationHistory: history,
        },
      });

      const agentMsg: StudioChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: pitch.agentMessage,
        plan: pitch.plan,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      toast.success("Plano criativo elaborado com 2 propostas conceituais!");
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-err-${Date.now()}`,
          sender: "agent",
          text: "Houve uma instabilidade temporária ao conectar com a IA, mas você pode continuar ajustando na aba de Ajustes manuais.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      toast.error(err.message || "Erro ao processar plano criativo.");
    } finally {
      setIsRefiningAi(false);
    }
  };

  // 4. Aplicação e Aprovação do Conceito
  const handleApplyOption = (messageId: string, option: CinematicConceptOption) => {
    setData((prev) => ({
      ...prev,
      ...option.previewData,
      theme: {
        ...prev.theme,
        ...(option.previewData.theme || {}),
      },
      hero: {
        ...prev.hero,
        ...(option.previewData.hero || {}),
        backgroundImage: prev.hero.backgroundImage || option.previewData.hero?.backgroundImage || "",
      },
    }));

    setTemporaryPreview(null);

    // Marca a opção aprovada na mensagem correspondente
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, appliedOptionId: option.id } : m))
    );

    // Envia confirmação carinhosa do Agente
    setMessages((prev) => [
      ...prev,
      {
        id: `agent-confirm-${Date.now()}`,
        sender: "agent",
        text: `O conceito "${option.name}" foi aprovado e aplicado com sucesso na sua página! Os títulos, paleta e blocos foram atualizados ao vivo. O que achou do resultado?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    toast.success(`Conceito "${option.name}" aprovado e aplicado!`);
  };

  // 5. Salvar & Publicar
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
        toast.success("Landing Page publicada com sucesso!");
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

  // Dados em exibição no Canvas (se estiver espiando, renderiza a prévia temporária)
  const activeCanvasData = temporaryPreview ? temporaryPreview.data : data;

  return (
    <div className="cinematic-studio flex h-full w-full flex-1 min-h-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* TOPBAR UNIFICADA (Ultra-slim, estilo Lovable / Claude Code) */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-3 sm:px-4 backdrop-blur-md z-30">
        {/* Esquerda: Voltar para Páginas + Status Ativo + Título do Projeto */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/pages"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
            title="Voltar para Minhas Páginas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-100 truncate max-w-[140px] sm:max-w-[220px]">
                {data.hero?.headline && data.hero.headline !== "Nome da Empresa Aqui"
                  ? data.hero.headline
                  : data.meta?.title || "Novo Site"}
              </span>
            </div>
          </div>
        </div>

        {/* Centro (Mobile): Alternador Simples [Chat | Ver Site] */}
        <div className="flex lg:hidden items-center rounded-lg bg-zinc-900/90 p-0.5 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setMobileTab("controls")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mobileTab === "controls"
                ? "bg-zinc-800 text-zinc-100 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mobileTab === "preview"
                ? "bg-zinc-800 text-zinc-100 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Ver Site</span>
          </button>
        </div>

        {/* Direita: Ações & Publicar */}
        <div className="flex items-center gap-2">
          {/* Seletor Desktop (Desktop vs iPhone Pro) */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-lg bg-zinc-900/90 p-0.5 border border-zinc-800/80">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                previewMode === "desktop" ? "bg-zinc-800 text-zinc-100 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                previewMode === "mobile" ? "bg-zinc-800 text-zinc-100 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {savedSlug && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-900"
              title="Abrir site publicado"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>No ar</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 font-medium text-xs px-3 sm:px-3.5 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isSaving ? "Publicando..." : "Publicar"}</span>
          </button>
        </div>
      </header>

      {/* CORPO DO COCKPIT */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* COLUNA ESQUERDA: CHAT CONVERSACIONAL COM PLANO CRIATIVO + AJUSTES (REDIMENSIONÁVEL) */}
        <aside
          style={{ ["--chat-width" as any]: `${chatWidth}px` }}
          className={`w-full lg:w-[var(--chat-width,440px)] shrink-0 h-full flex flex-col min-h-0 border-r border-zinc-800/80 bg-zinc-950 z-20 ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Header Compacto com Seletor Copiloto / Ajustes */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeTab === "chat"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bot className="h-3 w-3" />
                <span>Copiloto</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("adjustments")}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeTab === "adjustments"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sliders className="h-3 w-3" />
                <span>Ajustes</span>
              </button>
            </div>
            {temporaryPreview && (
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md animate-pulse">
                Modo Espiar
              </span>
            )}
          </div>

          {/* 2. Conteúdo da Aba 1: FLUXO DE PLANO CRIATIVO & APROVAÇÃO */}
          {activeTab === "chat" && (
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-zinc-950">
              {/* Feed de Mensagens Rolável */}
              <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 flex flex-col">
                {messages.length === 1 && messages[0].id === "welcome" ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-8 space-y-3.5 my-auto select-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-lg text-zinc-200">
                      <Sparkles className="h-6 w-6 text-zinc-300" />
                    </div>
                    <div className="space-y-1.5 max-w-xs">
                      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
                        O que vamos criar hoje?
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Cole um link do Google Maps, anexe fotos ou me conte sobre o negócio para criarmos uma vitrine cinematográfica.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`text-[13px] leading-relaxed shadow-sm ${
                        msg.sender === "user"
                          ? "bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[88%] border border-zinc-700/50"
                          : "bg-zinc-900/60 border border-zinc-800/80 text-zinc-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[92%] backdrop-blur-xs"
                      }`}
                    >
                      {/* Cabeçalho da Mensagem da IA */}
                      {msg.sender === "agent" && (
                        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-medium tracking-wide text-zinc-400">
                          <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
                          <span>Direção Criativa</span>
                        </div>
                      )}

                      {/* Texto Principal */}
                      {msg.text && <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>}

                      {/* Card de Google Maps Extraído */}
                      {msg.meta && msg.meta.name && (
                        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-100">
                            <span>{msg.meta.name}</span>
                            {msg.meta.rating && (
                              <span className="flex items-center gap-1 text-[11px] text-amber-200/90 font-medium">
                                <Star className="h-3 w-3 fill-amber-300/80 text-amber-300" />
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
                                  className="h-10 w-10 rounded-lg object-cover border border-zinc-800 shrink-0"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card de Fotos Enviadas */}
                      {msg.meta && msg.meta.photoCount && (
                        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pt-1">
                          {msg.meta.thumbnails?.slice(0, 4).map((thumb, idx) => (
                            <img
                              key={idx}
                              src={thumb}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border border-zinc-800 shrink-0 shadow-sm"
                            />
                          ))}
                        </div>
                      )}

                      {/* CARTOES DE CONCEITO INTERATIVOS DO PLANO CRIATIVO (Opções A e B) */}
                      {msg.plan && (
                        <div className="mt-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-3.5 space-y-3.5 shadow-xl">
                          {/* Resumo e Rationale */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                              <Sparkles className="h-3 w-3 text-zinc-300" />
                              <span>Proposta Conceitual</span>
                            </div>
                            <p className="text-xs text-zinc-200 font-medium">{msg.plan.conceptSummary}</p>
                            {msg.plan.rationale && (
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{msg.plan.rationale}</p>
                            )}
                          </div>

                          {/* Seções Recomendadas */}
                          {msg.plan.recommendedSections && msg.plan.recommendedSections.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {msg.plan.recommendedSections.map((sec, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full border border-zinc-800 bg-zinc-800/60 px-2 py-0.5 text-[9px] font-medium text-zinc-400"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Grade de 2 Colunas para Opção A e Opção B */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {msg.plan.options.map((opt) => {
                              const isApplied = msg.appliedOptionId === opt.id;
                              const isPreviewing = temporaryPreview?.optionId === opt.id;

                              return (
                                <div
                                  key={opt.id}
                                  className={`relative rounded-xl border p-3 flex flex-col justify-between space-y-3 transition-all ${
                                    isApplied
                                      ? "border-zinc-500 bg-zinc-800/90 ring-1 ring-zinc-500/40"
                                      : isPreviewing
                                      ? "border-zinc-400 bg-zinc-800/60 ring-1 ring-zinc-400/40"
                                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="space-y-2">
                                    {/* Header do Card com Tagline e Paleta */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                                        {opt.id === "option_a" ? "Opção A • " : "Opção B • "}
                                        {opt.tagline}
                                      </span>
                                      {/* Amostra de Cores */}
                                      <div className="flex items-center gap-1">
                                        <span
                                          className="h-3 w-3 rounded-full border border-white/20 shadow-xs"
                                          style={{ backgroundColor: opt.palette.bg }}
                                          title={`Fundo: ${opt.palette.bg}`}
                                        />
                                        <span
                                          className="h-3 w-3 rounded-full border border-white/20 shadow-xs"
                                          style={{ backgroundColor: opt.palette.accent }}
                                          title={`Destaque: ${opt.palette.accent}`}
                                        />
                                      </div>
                                    </div>

                                    {/* Nome e Título de Impacto */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-zinc-100 leading-snug">{opt.name}</h4>
                                      <p className="mt-1 text-[11px] text-zinc-300 italic line-clamp-2">
                                        "{opt.heroHeadline}"
                                      </p>
                                    </div>

                                    {/* Vibe e Tipografia */}
                                    <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/80">
                                      <span className="line-clamp-1">{opt.vibe}</span>
                                      <span className="shrink-0 uppercase font-mono text-[9px] text-zinc-400">
                                        {opt.typography}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Ações: Espiar Prévia e Aprovar */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isPreviewing) {
                                          setTemporaryPreview(null);
                                        } else {
                                          setTemporaryPreview({
                                            optionId: opt.id,
                                            optionName: opt.name,
                                            data: {
                                              ...data,
                                              ...opt.previewData,
                                              theme: {
                                                ...data.theme,
                                                ...(opt.previewData.theme || {}),
                                              },
                                              hero: {
                                                ...data.hero,
                                                ...(opt.previewData.hero || {}),
                                              },
                                            },
                                          });
                                          toast.info(`Prévia da "${opt.name}" carregada no canvas`);
                                        }
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                                        isPreviewing
                                          ? "border border-zinc-500 bg-zinc-700 text-zinc-100"
                                          : "border border-zinc-700/80 bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                                      }`}
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span>{isPreviewing ? "Ocultar" : "Espiar"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleApplyOption(msg.id, opt)}
                                      disabled={isApplied}
                                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
                                        isApplied
                                          ? "bg-zinc-800 text-zinc-400 border border-zinc-700/50 cursor-default"
                                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                                      }`}
                                    >
                                      {isApplied ? (
                                        <CheckCheck className="h-3 w-3 text-zinc-300" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                      <span>{isApplied ? "Aprovado" : "Aprovar"}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-zinc-500">{msg.timestamp}</span>
                  </div>
                )))}

                {/* Indicador de Carregamento da IA */}
                {isRefiningAi && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-[13px] text-zinc-300 backdrop-blur-xs">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                      <span>Elaborando proposta de direção criativa...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Barra de Entrada no Rodapé (Footer Chat Bar estilo Lovable / Claude Code) */}
              <div className="shrink-0 bg-zinc-950 px-2.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] border-t border-zinc-800/80">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Popover Inline do Google Maps */}
                {showMapsInput && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 mb-2 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Importar do Google Maps</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapsInput(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mapsQuery}
                        onChange={(e) => setMapsQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLookupMaps()}
                        placeholder="Cole o link do Google Maps ou nome da empresa..."
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupMaps()}
                        disabled={isLookingUpMaps || !mapsQuery.trim()}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-medium text-xs px-3 py-1.5 transition-colors disabled:opacity-40"
                      >
                        {isLookingUpMaps ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Importar"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cápsula de Entrada Estilo Lovable */}
                <div className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-lg shadow-black/40 focus-within:border-zinc-600 transition-all p-2">
                  {/* Área de Texto Auto-expansível */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Cole um link do Maps, anexe um PDF/fotos ou descreva alterações..."
                    className="w-full resize-none bg-transparent px-2.5 py-1.5 text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none [scrollbar-width:none]"
                  />

                  {/* Barra Inferior Interna da Cápsula com Botões */}
                  <div className="flex items-center justify-between pt-1 px-1">
                    <div className="flex items-center gap-1.5">
                      {/* Botão de Anexo */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Anexar fotos ou documento PDF (cardápio, tabela)"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      {/* Botão de Google Maps */}
                      <button
                        type="button"
                        onClick={() => setShowMapsInput((prev) => !prev)}
                        title="Importar do Google Maps"
                        className={`flex h-7 px-2 items-center gap-1.5 rounded-lg text-xs transition-colors ${
                          showMapsInput
                            ? "bg-zinc-800 text-white font-medium"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Maps</span>
                      </button>
                    </div>

                    {/* Botão de Envio (Circular Minimalista estilo Lovable) */}
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={isRefiningAi || !aiPrompt.trim()}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 disabled:opacity-30 transition-all"
                    >
                      {isRefiningAi ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Conteúdo da Aba 2: AJUSTES MANUAIS */}
          {activeTab === "adjustments" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Acordeão 1: Identidade & Conteúdo */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "identity" ? ("" as any) : "identity")}
                  className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Identidade & Conteúdo</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform ${openSection === "identity" ? "rotate-180" : ""}`}
                  />
                </button>

                {openSection === "identity" && (
                  <div className="p-3.5 pt-0 space-y-3 text-xs border-t border-zinc-800/60">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Nome do Negócio</label>
                      <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData({ ...data, businessName: e.target.value })}
                        placeholder="Ex: Studio Alpha, Dra. Helena, Bistrô..."
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        placeholder="Ex: EXPERIÊNCIA EXCLUSIVA"
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        placeholder="Ex: Arquitetura & Interiores de Alto Padrão"
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        placeholder="Ex: Projetos autorais que unem estética contemporânea, conforto e sofisticação."
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
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
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">Avaliação</label>
                        <input
                          type="number"
                          step="0.1"
                          max="5.0"
                          value={data.rating || 5.0}
                          onChange={(e) => setData({ ...data, rating: parseFloat(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Endereço Completo</label>
                      <input
                        type="text"
                        value={data.address || ""}
                        onChange={(e) => setData({ ...data, address: e.target.value })}
                        placeholder="Ex: Av. Brigadeiro Faria Lima, 1000 - São Paulo, SP"
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Acordeão 2: Mídia & Fotos */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "media" ? ("" as any) : "media")}
                  className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Mídia & Fotos ({data.gallery.length})</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform ${openSection === "media" ? "rotate-180" : ""}`}
                  />
                </button>

                {openSection === "media" && (
                  <div className="p-3.5 pt-0 space-y-4 text-xs border-t border-zinc-800/60">
                    {/* Vídeo em Loop */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5 text-zinc-400" />
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
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
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
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                      {data.hero.backgroundVideo && (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
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
                          className="text-[10px] text-zinc-300 font-medium hover:text-white transition-colors"
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
                                ? "border-zinc-300 ring-2 ring-zinc-300/40"
                                : "border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            <img src={photo.url} alt="" className="h-full w-full object-cover" />
                            {data.hero.backgroundImage === photo.url && (
                              <span className="absolute top-1 right-1 rounded-full bg-zinc-100 text-zinc-950 text-[8px] font-bold px-1.5">
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

              {/* Acordeão 3: Arquétipo, Paleta & Tipografia */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "styling" ? ("" as any) : "styling")}
                  className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Arquétipo, Paleta & Tipografia</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform ${openSection === "styling" ? "rotate-180" : ""}`}
                  />
                </button>

                {openSection === "styling" && (
                  <div className="p-3.5 pt-0 space-y-4 text-xs border-t border-zinc-800/60">
                    {/* Seletor de Arquétipo Visual */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Arquétipo Visual (Bento Engine):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: "luxury-editorial", label: "Luxo Editorial", desc: "Monocle, Vinhos & Alta Gastronomia" },
                          { id: "neo-pop-d2c", label: "Neo-Pop D2C", desc: "Gigi Energy, Alta Voltagem & Neon" },
                          { id: "clean-biotech", label: "Clean Biotech", desc: "Biometic, Vidro Fosco & Clínicas" },
                          { id: "cyber-tech", label: "Cyber High-Tech", desc: "Compute-11, Grid Escuro & Tags" },
                          { id: "dark-brutalist", label: "Dark Brutalist", desc: "Void, Tipografia Gigante & P&B" },
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
                            className={`rounded-lg border p-2.5 text-left transition-all ${
                              data.archetype === arq.id
                                ? "border-zinc-300 bg-zinc-800 text-zinc-100 ring-1 ring-zinc-300/30"
                                : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                            }`}
                          >
                            <span className="block text-xs font-semibold text-zinc-200">{arq.label}</span>
                            <span className="block text-[9px] text-zinc-400 mt-0.5">{arq.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seletor de Paleta */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Paletas de Cores:</span>
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
                                : "border-zinc-800 hover:border-zinc-600"
                            }`}
                            style={{ backgroundColor: pal.bg }}
                          >
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.accent }} />
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
                            className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                              data.theme.fontHeading === f.id
                                ? "border-zinc-300 bg-zinc-800 text-zinc-100 font-semibold"
                                : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                            } ${f.font}`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle de Parallax GPU */}
                    <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 cursor-pointer">
                      <div>
                        <span className="block text-xs font-semibold text-zinc-200">Efeito Parallax GPU (60 FPS)</span>
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
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-0"
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 py-3 text-xs font-medium shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Salvar & Publicar Página</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Divisória Arrastável (Splitter) */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingRef.current = true;
            setIsDragging(true);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          className={`group relative hidden lg:flex w-1.5 hover:w-2 cursor-col-resize items-center justify-center bg-zinc-900 hover:bg-zinc-700 transition-all select-none z-30 ${
            isDragging ? "bg-zinc-700 w-2" : ""
          }`}
          title="Arraste para redimensionar o chat"
        >
          <div className="h-8 w-0.5 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors" />
        </div>

        {/* COLUNA DIREITA: LIVE PREVIEW 100% IMERSIVO (CANVAS DOMINANTE) */}
        <main
          className={`flex-1 overflow-hidden flex flex-col bg-zinc-950 ${
            mobileTab === "controls" ? "hidden lg:flex" : "flex"
          } ${isDragging ? "select-none" : ""}`}
        >
          {/* Banner Flutuante de Modo "Espiar Prévia" */}
          {temporaryPreview && (
            <div className="shrink-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-200 backdrop-blur-md z-20">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>
                  Espiando Prévia: <b>{temporaryPreview.optionName}</b> (Demonstração)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemporaryPreview(null)}
                  className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Fechar Prévia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setData(temporaryPreview.data);
                    setTemporaryPreview(null);
                    toast.success(`Conceito "${temporaryPreview.optionName}" aprovado e aplicado!`);
                  }}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 px-3 py-1 text-[11px] font-medium transition-colors shadow-xs"
                >
                  Aprovar & Fixar
                </button>
              </div>
            </div>
          )}

          {/* Container do Preview */}
          <div className="relative flex-1 overflow-hidden flex items-center justify-center p-0">
            {previewMode === "desktop" ? (
              /* Prévia Desktop de Tela Cheia com Escala 100% Real e Scroll Natural */
              <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-zinc-950 p-2 sm:p-6 flex justify-center [scrollbar-width:none]">
                <div className="w-full max-w-[1400px] min-h-full bg-black rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden">
                  <CinematicViewer data={activeCanvasData} isEmbedded={true} />
                </div>
              </div>
            ) : (
              /* Prévia Simulando Moldura de iPhone com Proporção Real */
              <div className="h-full w-full overflow-y-auto flex items-center justify-center p-4 [scrollbar-width:none]">
                <div className="relative h-[780px] w-[390px] shrink-0 overflow-hidden rounded-[48px] border-[8px] border-zinc-800 bg-black shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10 flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black z-50 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-zinc-900 border border-zinc-800" />
                  </div>
                  {/* Tela do Celular */}
                  <div className="flex-1 overflow-hidden pt-3">
                    <CinematicViewer data={activeCanvasData} isEmbedded={true} />
                  </div>
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
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-center shadow-2xl space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-sm">
              <Check className="h-6 w-6 text-zinc-100" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Landing Page no Ar!</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Sua experiência cinematográfica está ativa com alta velocidade e aceleração GPU.
              </p>
            </div>

            {/* Campo do Link */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs">
              <span className="flex-1 truncate px-2 text-left text-zinc-300 font-mono text-[11px]">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 font-medium text-xs text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
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
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 py-2.5 text-xs font-medium shadow-sm transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visualizar Site em Nova Aba</span>
              </a>

              <button
                type="button"
                onClick={() => setPublishedModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
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
