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
  Trash2,
  ShoppingBag,
  Upload,
  Loader2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageService } from "@/modules/page/services/PageService";
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
import { z } from "zod";

const TEMPLATE_OPTIONS = [
  { id: "cinematic-glass", name: "Landing Page Cinematográfica", desc: "Visual imersivo de alta conversão, hero marcante e glassmorphism", icon: "✨" },
  { id: "restaurant-menu", name: "Delivery & Cardápio iFood", desc: "Cardápio com fotos, categorias e pedido direto no WhatsApp", icon: "🍔" },
  { id: "store-showcase", name: "Loja & E-commerce (Carrinho)", desc: "Vitrine de produtos com sacola de compras e checkout WhatsApp", icon: "🛍️" },
  { id: "site-maquina", name: "Site Institucional Máquina", desc: "Apresentação de autoridade, diferenciais, serviços e depoimentos", icon: "🏢" },
  { id: "clinic-care", name: "Clínica & Especialidades", desc: "Agendamento, especialidades e bio profissional para saúde", icon: "🩺" },
];

function convertBioPageToCinematic(bio: any): CinematicPageData {
  const socialLinks = (bio.social_links as Record<string, any>) || {};
  const customTheme = socialLinks.custom_theme || {};
  const defaults = createDefaultCinematicData();

  const googlePhotos: string[] = Array.isArray(socialLinks.google_photos) ? socialLinks.google_photos : [];
  const galleryItems: CinematicGalleryItem[] = googlePhotos.map((url: string, i: number) => ({
    id: `photo-${i}`,
    url,
    caption: `${bio.display_name} - Detalhes`,
    category: "Ambiente",
  }));

  const highlights: CinematicHighlight[] = (socialLinks.suggested_services || []).map((s: any, i: number) => ({
    id: `hl-${i}`,
    title: s.name || s.title || "Serviço Especializado",
    description: s.description || "",
    price: s.price ? (typeof s.price === "number" ? `R$ ${s.price.toFixed(2)}` : String(s.price)) : undefined,
    badge: s.badge || "Destaque",
    image: s.image_url || undefined,
  }));

  const reviews = (socialLinks.testimonials || []).map((t: any) => ({
    author: t.author || t.name || "Cliente Satisfeito",
    text: t.text || t.comment || "Excelente atendimento e qualidade incomparável.",
    rating: typeof t.rating === "number" ? t.rating : 5,
    role: "Avaliação Google",
  }));

  return {
    ...defaults,
    id: bio.id,
    businessName: bio.display_name || "Sua Empresa",
    niche: socialLinks.niche || "Negócio Local",
    whatsapp: bio.whatsapp || "",
    address: socialLinks.address || undefined,
    rating: socialLinks.google_rating || 4.9,
    openingHours: socialLinks.opening_hours || undefined,
    marqueeSpeed: socialLinks.cinematic_data?.marqueeSpeed || customTheme.marqueeSpeed || 45,
    theme: {
      ...defaults.theme,
      bg: customTheme.background || defaults.theme.bg,
      accent: customTheme.primary || defaults.theme.accent,
      parallaxEnabled: customTheme.parallax !== false,
      marqueeSpeed: socialLinks.cinematic_data?.marqueeSpeed || customTheme.marqueeSpeed || 45,
    },
    hero: {
      ...defaults.hero,
      title: bio.display_name ? `Bem-vindo(a) à ${bio.display_name}` : defaults.hero.title,
      subtitle: bio.description || defaults.hero.subtitle,
      backgroundImage: bio.cover_url || googlePhotos[0] || defaults.hero.backgroundImage,
      floatingBadge: socialLinks.google_rating ? `★ ${socialLinks.google_rating} NO GOOGLE` : defaults.hero.floatingBadge,
      ctaText: bio.whatsapp_button_label || "Falar no WhatsApp",
      ctaLink: bio.whatsapp ? `https://wa.me/55${bio.whatsapp.replace(/\D/g, "")}` : "#contato",
    },
    gallery: galleryItems.length > 0 ? galleryItems : defaults.gallery,
    highlights: highlights.length > 0 ? highlights : defaults.highlights,
    reviews: reviews.length > 0 ? reviews : defaults.reviews,
  };
}

export const Route = createFileRoute("/_authenticated/studio")({
  component: CinematicStudioPage,
  validateSearch: z.object({
    page: z.string().optional(),
    company: z.string().optional(),
    url: z.string().optional(),
  }),
});

export default function CinematicStudioPage() {
  const searchParams = Route.useSearch();
  const requestedPageId = searchParams.page;
  const requestedCompanyId = searchParams.company;
  const requestedUrl = searchParams.url;

  const [data, setData] = useState<CinematicPageData>(() => createDefaultCinematicData());
  const [userId, setUserId] = useState<string>("");
  const [pageId, setPageId] = useState<string | undefined>(requestedPageId);
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

  // Sub-abas do Painel de Ajustes (Unificado com o Clean Builder)
  const [adjustmentTab, setAdjustmentTab] = useState<"texts" | "products" | "design" | "media" | "contact">("texts");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const publicUrl = await PageService.uploadAsset(file);
      setData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      toast.success("Logotipo atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar logotipo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const publicUrl = await PageService.uploadAsset(file);
      setData((prev) => ({
        ...prev,
        hero: { ...prev.hero, backgroundImage: publicUrl },
      }));
      toast.success("Foto de capa atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar capa.");
    } finally {
      setUploadingCover(false);
    }
  };

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

  // Carrega página pelo ID se informado na URL (?page=...)
  useEffect(() => {
    if (!requestedPageId) return;
    setPageId(requestedPageId);

    supabase
      .from("bio_pages")
      .select("*")
      .eq("id", requestedPageId)
      .single()
      .then(({ data: bio, error }) => {
        if (error || !bio) return;
        setSavedSlug(bio.slug);
        const socialLinks = (bio.social_links as Record<string, any>) || {};
        if (socialLinks.cinematic_data) {
          setData(socialLinks.cinematic_data as CinematicPageData);
          setMessages([
            {
              id: "page-loaded",
              sender: "agent",
              text: `Página "${bio.display_name}" carregada no Studio com sucesso! O que você gostaria de ajustar ou aprimorar?`,
              timestamp: "Agora",
            },
          ]);
        } else {
          const converted = convertBioPageToCinematic(bio);
          setData(converted);
          setMessages([
            {
              id: "page-adapted",
              sender: "agent",
              text: `Importei a página "${bio.display_name}" para o Studio! Você pode ajustar o visual, trocar cores ou me pedir alterações diretamente aqui no chat.`,
              timestamp: "Agora",
            },
          ]);
        }
      });
  }, [requestedPageId]);

  // Carrega dados da empresa prospectada pelo ID (?company=...)
  useEffect(() => {
    if (!requestedCompanyId) return;
    supabase
      .from("prospected_companies")
      .select("*")
      .eq("id", requestedCompanyId)
      .single()
      .then(({ data: company, error }) => {
        if (error || !company) return;
        const query = company.name ? `${company.name} ${company.city || ""}` : "";
        if (query) {
          handleLookupMaps(query);
        }
      });
  }, [requestedCompanyId]);

  // Processa link direto do Google Maps se informado (?url=...)
  useEffect(() => {
    if (requestedUrl) {
      handleLookupMaps(requestedUrl);
    }
  }, [requestedUrl]);

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
    const searchIntentMatch = /(?:busque|procure|pesquise|puxe|encontre)\s+(?:fotos?|imagens?|dados|informaç[^\s]*|card[^\s]*|ficha|do\s+local|da\s+empresa)/i.test(trimmedPrompt);

    if (mapsUrlMatch || mapsCommandMatch || searchIntentMatch) {
      let queryToLookup = mapsUrlMatch ? mapsUrlMatch[0] : (mapsCommandMatch ? mapsCommandMatch[1].trim() : "");
      if (!queryToLookup && searchIntentMatch) {
        queryToLookup = trimmedPrompt
          .replace(/(?:busque|procure|pesquise|puxe|encontre)\s+(?:fotos?|imagens?|dados|informaç[^\s]*|card[^\s]*|ficha|do\s+local|da\s+empresa)?/gi, "")
          .trim() || data.businessName || data.niche;
      }

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

  // 5. Salvar & Publicar (Direto no Supabase com Autenticação Ativa)
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      // 1. Assegura identificação do usuário logado
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          activeUserId = authData.user.id;
          setUserId(activeUserId);
        }
      }

      if (!activeUserId) {
        toast.error("Sessão de usuário não identificada. Faça login novamente.");
        setIsSaving(false);
        return;
      }

      const cleanWhatsapp = (data.whatsapp || "").replace(/\D/g, "");
      const effectiveTemplate = "cinematic-glass";
      const effectiveFont = (data.theme as any)?.fontFamily || data.theme?.fontHeading || "sans";
      const effectiveMode = data.theme?.mode || (data.theme?.bg?.includes("#fff") || data.theme?.bg?.includes("#f8") ? "light" : "dark");
      const effectiveRadius = (data.theme as any)?.borderRadius || data.theme?.borderStyle || "rounded";
      const effectiveBoxEffect = (data.theme as any)?.boxEffect || "glass";
      const effectiveArchetype = (data.archetype || (data.theme as any)?.archetype || "cinematic");
      const effectiveSpeed = data.marqueeSpeed || 50;

      const customThemeObj = {
        parallax: Boolean(data.theme.parallaxEnabled),
        hero_style: "cinematic",
        font: effectiveFont,
        fontFamily: effectiveFont,
        font_pair: effectiveFont,
        primary: data.theme.accent,
        accent: data.theme.accent,
        background: data.theme.bg,
        bg: data.theme.bg,
        mode: effectiveMode,
        archetype: effectiveArchetype,
        headingStyle: (data.theme as any)?.headingStyle || "default",
        borderRadius: effectiveRadius,
        border_radius: effectiveRadius === "sharp" ? "0px" : effectiveRadius === "pill" ? "28px" : "16px",
        boxEffect: effectiveBoxEffect,
        marqueeSpeed: effectiveSpeed,
      };

      const socialLinks = {
        is_demo: false,
        cinematic_data: {
          ...data,
          templateId: effectiveTemplate,
          marqueeSpeed: effectiveSpeed,
          archetype: effectiveArchetype,
          theme: {
            ...data.theme,
            marqueeSpeed: effectiveSpeed,
            archetype: effectiveArchetype,
            fontFamily: effectiveFont,
            mode: effectiveMode,
            borderRadius: effectiveRadius,
            boxEffect: effectiveBoxEffect,
          },
        },
        cinematicData: {
          ...data,
          templateId: effectiveTemplate,
          marqueeSpeed: effectiveSpeed,
          archetype: effectiveArchetype,
          theme: {
            ...data.theme,
            marqueeSpeed: effectiveSpeed,
            archetype: effectiveArchetype,
            fontFamily: effectiveFont,
            mode: effectiveMode,
            borderRadius: effectiveRadius,
            boxEffect: effectiveBoxEffect,
          },
        },
        niche: data.niche,
        address: data.address,
        opening_hours: data.openingHours,
        google_rating: data.rating,
        archetype: effectiveArchetype,
        theme: customThemeObj,
        custom_theme: customThemeObj,
      };

      let finalPageId = pageId;
      let finalSlug = savedSlug || "";

      if (finalPageId) {
        // Atualiza página existente
        const { data: updated, error: updateError } = await supabase
          .from("bio_pages")
          .update({
            display_name: data.businessName || data.hero?.headline || "Minha Empresa",
            whatsapp: cleanWhatsapp || null,
            template_id: "cinematic-glass",
            cover_url: data.hero.backgroundImage,
            avatar_url: data.avatarUrl || null,
            description: data.hero.subtitle ? data.hero.subtitle.slice(0, 300) : null,
            published: true,
            motion_enabled: true,
            motion_entrance: "rise",
            motion_ambient: "spotlight",
            motion_cta: "glow",
            social_links: socialLinks as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", finalPageId)
          .select("id, slug")
          .single();

        if (updateError) {
          throw new Error(`Erro ao atualizar página: ${updateError.message}`);
        }
        finalSlug = updated.slug;
      } else {
        // Cria nova página
        const baseSlug = (data.businessName || "minha-pagina")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 32) || "pagina";
        const suffix = crypto.randomUUID().slice(0, 5);
        const newSlug = `${baseSlug}-${suffix}`;

        const { data: created, error: createError } = await supabase
          .from("bio_pages")
          .insert({
            user_id: activeUserId,
            display_name: data.businessName || data.hero?.headline || "Minha Empresa",
            slug: newSlug,
            whatsapp: cleanWhatsapp || null,
            template_id: "cinematic-glass",
            cover_url: data.hero.backgroundImage,
            avatar_url: data.avatarUrl || null,
            description: data.hero.subtitle ? data.hero.subtitle.slice(0, 300) : null,
            published: true,
            theme: "midnight",
            motion_enabled: true,
            motion_entrance: "rise",
            motion_ambient: "spotlight",
            motion_cta: "glow",
            social_links: socialLinks as any,
          })
          .select("id, slug")
          .single();

        if (createError || !created) {
          throw new Error(`Erro ao criar página: ${createError?.message || "falha desconhecida"}`);
        }
        finalPageId = created.id;
        finalSlug = created.slug;
      }

      // Sincroniza produtos/serviços na tabela catalog_items
      if (finalPageId && data.highlights && Array.isArray(data.highlights)) {
        try {
          await supabase.from("catalog_items").delete().eq("page_id", finalPageId);

          if (data.highlights.length > 0) {
            const catalogRows = data.highlights.map((item, idx) => {
              const rawPrice = item.price
                ? parseFloat(item.price.replace(/[^\d,.-]/g, "").replace(",", "."))
                : 0;
              return {
                page_id: finalPageId,
                title: item.title,
                description: item.description || null,
                price: isNaN(rawPrice) ? 0 : rawPrice,
                image_url: item.image || data.hero.backgroundImage || null,
                category: item.badge || "Destaques",
                active: true,
                position: idx,
              };
            });
            await supabase.from("catalog_items").insert(catalogRows);
          }
        } catch (catErr) {
          console.warn("Aviso ao sincronizar catálogo:", catErr);
        }
      }

      setPageId(finalPageId);
      setSavedSlug(finalSlug);
      setPublishedModalOpen(true);
      toast.success("Site salvo e publicado com sucesso no ar!");

      // Atualiza URL no navegador para manter ?page=ID sem recarregar a página
      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("page", finalPageId);
        window.history.replaceState({}, "", newUrl.toString());
      }
    } catch (err: any) {
      console.error("Erro no salvamento direto, tentando fallback:", err);
      try {
        const fallbackRes = await saveCinematicPageFn({
          data: {
            data,
            userId: userId || "",
            pageId,
            publish: true,
          },
        });
        if (fallbackRes.success) {
          setPageId(fallbackRes.pageId);
          setSavedSlug(fallbackRes.slug);
          setPublishedModalOpen(true);
          toast.success("Site salvo e publicado com sucesso!");
          return;
        }
      } catch {
        // Ignora erro do fallback e lança o erro principal
      }
      toast.error(err.message || "Erro ao salvar e publicar página.");
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
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
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

          {/* 3. Conteúdo da Aba 2: AJUSTES MANUAIS (UNIFICADO & EXECUTIVO) */}
          {activeTab === "adjustments" && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40">
              {/* Barra de Sub-Abas do Editor (Clean, Executivo & Prático) */}
              <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
                <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/80 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAdjustmentTab("texts")}
                    className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustmentTab === "texts"
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Textos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentTab("products")}
                    className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustmentTab === "products"
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Vitrine</span>
                    {data.highlights && data.highlights.length > 0 && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                        {data.highlights.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentTab("design")}
                    className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustmentTab === "design"
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <Palette className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Design</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentTab("media")}
                    className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustmentTab === "media"
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mídia</span>
                    {data.gallery && data.gallery.length > 0 && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded-full">
                        {data.gallery.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentTab("contact")}
                    className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      adjustmentTab === "contact"
                        ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Contato</span>
                  </button>
                </div>
              </div>

              {/* Área com Scroll do Conteúdo da Sub-Aba Ativa */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 1. SUB-ABA: TEXTOS & CONTEÚDO */}
                {adjustmentTab === "texts" && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    {/* Logotipo da Marca */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
                        Logotipo da Marca
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {data.avatarUrl ? (
                            <img src={data.avatarUrl} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer disabled:opacity-50"
                          >
                            {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            <span>{data.avatarUrl ? "Trocar Logotipo" : "Enviar Logotipo"}</span>
                          </button>
                          <input
                            type="url"
                            value={data.avatarUrl || ""}
                            onChange={(e) => setData({ ...data, avatarUrl: e.target.value })}
                            placeholder="Ou cole o link direto da imagem..."
                            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Foto de Capa do Hero */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
                        Foto de Capa Principal (Hero)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {data.hero.backgroundImage ? (
                            <img src={data.hero.backgroundImage} alt="Capa" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer disabled:opacity-50"
                          >
                            {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            <span>Trocar Foto de Capa</span>
                          </button>
                          <input
                            type="url"
                            value={data.hero.backgroundImage || ""}
                            onChange={(e) =>
                              setData({ ...data, hero: { ...data.hero, backgroundImage: e.target.value } })
                            }
                            placeholder="Ou cole a URL da imagem de capa..."
                            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dados Básicos da Marca */}
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Nome do Negócio</label>
                      <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData({ ...data, businessName: e.target.value })}
                        placeholder="Ex: Studio Alpha, Dra. Helena, Bistrô..."
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
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
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">Texto do Botão CTA</label>
                        <input
                          type="text"
                          value={data.hero.ctaText || "Solicitar Atendimento VIP"}
                          onChange={(e) =>
                            setData({ ...data, hero: { ...data.hero, ctaText: e.target.value } })
                          }
                          placeholder="Ex: Pedir no WhatsApp"
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">Link / Destino do Botão</label>
                        <input
                          type="text"
                          value={data.hero.ctaLink || "#vitrine"}
                          onChange={(e) =>
                            setData({ ...data, hero: { ...data.hero, ctaLink: e.target.value } })
                          }
                          placeholder="#vitrine, #contato ou https://..."
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* História / Sobre Nós / Manifesto */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
                        Sobre Nós / História / Manifesto
                      </label>
                      <div>
                        <input
                          type="text"
                          value={data.manifesto?.headline || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              manifesto: {
                                ...(data.manifesto || { headline: "", bodyText: "" }),
                                headline: e.target.value,
                              },
                            })
                          }
                          placeholder="Título da História (Ex: O Legado de Criação)"
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={3}
                          value={data.manifesto?.bodyText || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              manifesto: {
                                ...(data.manifesto || { headline: "", bodyText: "" }),
                                bodyText: e.target.value,
                              },
                            })
                          }
                          placeholder="Conte a história, os diferenciais e a essência da sua marca..."
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SUB-ABA: VITRINE & PRODUTOS */}
                {adjustmentTab === "products" && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">
                          Produtos ou Serviços ({data.highlights?.length || 0})
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Exibidos na vitrine e sincronizados com o catálogo
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newItemId = `hl_${Date.now()}`;
                          setData((prev) => ({
                            ...prev,
                            highlights: [
                              ...(prev.highlights || []),
                              {
                                id: newItemId,
                                title: "Novo Item",
                                description: "Descrição dos diferenciais e benefícios.",
                                price: "R$ 0,00",
                                badge: "Destaque",
                                image: prev.hero?.backgroundImage || "",
                              },
                            ],
                          }));
                          toast.success("Novo item adicionado à vitrine!");
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar Item</span>
                      </button>
                    </div>

                    {(!data.highlights || data.highlights.length === 0) ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-400 text-xs space-y-2">
                        <ShoppingBag className="h-8 w-8 mx-auto text-zinc-600" />
                        <p className="font-medium text-zinc-300">Nenhum item na vitrine ainda</p>
                        <p className="text-[11px] text-zinc-500">Clique em "+ Adicionar Item" para cadastrar pratos, produtos ou serviços.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.highlights.map((item, idx) => (
                          <div key={item.id || idx} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Item #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setData((prev) => ({
                                    ...prev,
                                    highlights: (prev.highlights || []).filter((_, i) => i !== idx),
                                  }));
                                  toast.info("Item removido da vitrine.");
                                }}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-zinc-900 cursor-pointer"
                                title="Remover este item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase font-semibold">Nome do Produto / Serviço</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newTitle = e.target.value;
                                  setData((prev) => {
                                    const list = [...(prev.highlights || [])];
                                    list[idx] = { ...list[idx], title: newTitle };
                                    return { ...prev, highlights: list };
                                  });
                                }}
                                placeholder="Nome do produto ou prato"
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-zinc-400 uppercase font-semibold">Preço ou Valor</label>
                                <input
                                  type="text"
                                  value={item.price || ""}
                                  onChange={(e) => {
                                    const newPrice = e.target.value;
                                    setData((prev) => {
                                      const list = [...(prev.highlights || [])];
                                      list[idx] = { ...list[idx], price: newPrice };
                                      return { ...prev, highlights: list };
                                    });
                                  }}
                                  placeholder="Ex: R$ 45,00"
                                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:border-zinc-700 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-zinc-400 uppercase font-semibold">Selo / Badge</label>
                                <input
                                  type="text"
                                  value={item.badge || ""}
                                  onChange={(e) => {
                                    const newBadge = e.target.value;
                                    setData((prev) => {
                                      const list = [...(prev.highlights || [])];
                                      list[idx] = { ...list[idx], badge: newBadge };
                                      return { ...prev, highlights: list };
                                    });
                                  }}
                                  placeholder="Ex: Mais Pedido"
                                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-700 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase font-semibold">Descrição / Ingredientes</label>
                              <textarea
                                rows={2}
                                value={item.description || ""}
                                onChange={(e) => {
                                  const newDesc = e.target.value;
                                  setData((prev) => {
                                    const list = [...(prev.highlights || [])];
                                    list[idx] = { ...list[idx], description: newDesc };
                                    return { ...prev, highlights: list };
                                  });
                                }}
                                placeholder="Detalhes, benefícios ou ingredientes do item..."
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-300 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none resize-none leading-relaxed"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase font-semibold">Foto do Produto (URL)</label>
                              <div className="mt-1 flex items-center gap-2">
                                {item.image && (
                                  <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-zinc-800 shrink-0" />
                                )}
                                <input
                                  type="url"
                                  value={item.image || ""}
                                  onChange={(e) => {
                                    const newImg = e.target.value;
                                    setData((prev) => {
                                      const list = [...(prev.highlights || [])];
                                      list[idx] = { ...list[idx], image: newImg };
                                      return { ...prev, highlights: list };
                                    });
                                  }}
                                  placeholder="https://exemplo.com/foto.jpg"
                                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 font-mono focus:border-zinc-700 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SUB-ABA: DESIGN & ESTILO */}
                {adjustmentTab === "design" && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    {/* Modelo de Site Ativo */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Modelo de Site Ativo:</span>
                      <div className="relative">
                        <select
                          value={(data as any).templateId || "cinematic-glass"}
                          onChange={(e) => {
                            setData((prev) => ({
                              ...prev,
                              templateId: e.target.value,
                            } as any));
                            toast.success("Modelo de site atualizado!");
                          }}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none cursor-pointer"
                        >
                          {TEMPLATE_OPTIONS.map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id} className="bg-zinc-900 text-zinc-100">
                              {tmpl.icon} {tmpl.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Modo Visual (Dark vs Light) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Modo Visual:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setData((prev) => ({
                              ...prev,
                              theme: {
                                ...prev.theme,
                                mode: "dark",
                                bg: prev.theme.bg && (prev.theme.bg === "#ffffff" || prev.theme.bg.startsWith("#f")) ? "#09090b" : prev.theme.bg || "#09090b",
                              },
                            }));
                            toast.success("Modo Escuro ativado.");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                            data.theme?.mode !== "light" && (!data.theme?.bg || !data.theme?.bg.startsWith("#f"))
                              ? "border-amber-400/80 bg-zinc-800 text-amber-300 shadow-sm"
                              : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>🌙</span>
                          <span>Modo Escuro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setData((prev) => ({
                              ...prev,
                              theme: {
                                ...prev.theme,
                                mode: "light",
                                bg: "#f8fafc",
                              },
                            }));
                            toast.success("Modo Claro ativado.");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                            data.theme?.mode === "light" || (data.theme?.bg && data.theme?.bg.startsWith("#f"))
                              ? "border-amber-400/80 bg-zinc-100 text-zinc-900 shadow-sm"
                              : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>☀️</span>
                          <span>Modo Claro</span>
                        </button>
                      </div>
                    </div>

                    {/* Seletor de Arquétipo Visual */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Arquétipo de Design:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            id: "cinematic",
                            label: "Cinemático Glass",
                            desc: "Glassmorphism, desfoque e profundidade",
                            icon: "🎬",
                            setup: { headingStyle: "default", borderRadius: "rounded", boxEffect: "glass" },
                          },
                          {
                            id: "neobrutalism",
                            label: "Neobrutalismo Pop",
                            desc: "Bordas pretas 3D, sombras duras e alta energia",
                            icon: "⚡",
                            setup: { headingStyle: "uppercase", borderRadius: "rounded", boxEffect: "solid" },
                          },
                          {
                            id: "editorial",
                            label: "Editorial Suíço",
                            desc: "Cantos retos, itálico nobre e minimalismo Vogue",
                            icon: "🏛️",
                            setup: { headingStyle: "italic", borderRadius: "sharp", fontFamily: "serif", fontHeading: "serif" },
                          },
                          {
                            id: "bento",
                            label: "Bento High-Tech",
                            desc: "Pílulas arredondadas, gradientes e SaaS moderno",
                            icon: "🍱",
                            setup: { headingStyle: "gradient", borderRadius: "pill", fontFamily: "display", fontHeading: "display" },
                          },
                        ].map((arq) => {
                          const isSelected =
                            data.archetype === arq.id ||
                            (arq.id === "editorial" && (data.archetype === "luxury-editorial" as any)) ||
                            (arq.id === "neobrutalism" && ((data.archetype as any) === "neo-pop-d2c" || (data.archetype as any) === "dark-brutalist")) ||
                            (arq.id === "bento" && ((data.archetype as any) === "clean-biotech" || (data.archetype as any) === "cyber-tech"));

                          return (
                            <button
                              key={arq.id}
                              type="button"
                              onClick={() => {
                                setData((prev) => ({
                                  ...prev,
                                  archetype: arq.id as any,
                                  theme: {
                                    ...prev.theme,
                                    archetype: arq.id as any,
                                    headingStyle: arq.setup.headingStyle as any,
                                    borderRadius: (arq.setup as any).borderRadius || prev.theme?.borderRadius || "rounded",
                                    boxEffect: (arq.setup as any).boxEffect || prev.theme?.boxEffect || "glass",
                                    ...(arq.setup as any).fontFamily ? { fontFamily: (arq.setup as any).fontFamily, fontHeading: (arq.setup as any).fontHeading } : {},
                                  },
                                }));
                                toast.success(`Arquétipo ${arq.label} aplicado!`);
                              }}
                              className={`rounded-lg border p-2.5 text-left transition-all ${
                                isSelected
                                  ? "border-amber-400 bg-zinc-800 text-zinc-100 ring-1 ring-amber-400/40"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{arq.icon}</span>
                                <span className="block text-xs font-semibold text-zinc-200">{arq.label}</span>
                              </div>
                              <span className="block text-[9px] text-zinc-400 mt-1 leading-tight">{arq.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seletor de Paleta */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Paleta de Cores:</span>
                      <div className="grid grid-cols-6 gap-2">
                        {(data.theme?.mode === "light"
                          ? [
                              { id: "light-amber", name: "Branco & Âmbar", bg: "#f8fafc", accent: "#f59e0b" },
                              { id: "light-emerald", name: "Gelo & Esmeralda", bg: "#f0fdf4", accent: "#059669" },
                              { id: "light-gold", name: "Marfim & Ouro", bg: "#faf7f2", accent: "#b45309" },
                              { id: "light-sapphire", name: "Nuvem & Safira", bg: "#f8fafc", accent: "#2563eb" },
                              { id: "light-violet", name: "Lavanda & Violeta", bg: "#faf5ff", accent: "#7c3aed" },
                              { id: "light-mono", name: "Minimal Preto & Branco", bg: "#ffffff", accent: "#09090b" },
                            ]
                          : [
                              { id: "dark-gold", name: "Âmbar Solar", bg: "#0a0a0c", accent: "#f59e0b" },
                              { id: "dark-emerald", name: "Esmeralda Nobre", bg: "#06130d", accent: "#10b981" },
                              { id: "dark-titanium", name: "Grafite & Titânio", bg: "#09090b", accent: "#d4d4d8" },
                              { id: "dark-champagne", name: "Champagne Sóbrio", bg: "#0c0a09", accent: "#d4af37" },
                              { id: "dark-violet", name: "Cyber Violeta", bg: "#0c0714", accent: "#a855f7" },
                              { id: "dark-sapphire", name: "Safira Noturno", bg: "#080c16", accent: "#3b82f6" },
                            ]
                        ).map((pal) => (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => {
                              setData((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, bg: pal.bg, accent: pal.accent },
                              }));
                              toast.success(`Paleta ${pal.name} selecionada!`);
                            }}
                            title={pal.name}
                            className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                              data.theme.accent === pal.accent
                                ? "border-amber-400 ring-2 ring-amber-400/40 scale-105"
                                : "border-zinc-800 hover:border-zinc-600"
                            }`}
                            style={{ backgroundColor: pal.bg }}
                          >
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: pal.accent }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seletor de Tipografia Completa */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Tipografia Global:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "sans", label: "Inter (Moderna)", sample: "Aa Sans" },
                          { id: "serif", label: "Playfair (Editorial)", sample: "Aa Serif" },
                          { id: "display", label: "Plus Jakarta (Marcante)", sample: "Aa Display" },
                          { id: "cormorant", label: "Cormorant (Poética)", sample: "Aa Cormorant" },
                          { id: "mono", label: "Courier (Cyber Mono)", sample: "Aa Mono" },
                        ].map((f) => {
                          const currentFont = (data.theme as any)?.fontFamily || data.theme?.fontHeading || "sans";
                          const isSelected = currentFont === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setData((prev) => ({
                                  ...prev,
                                  theme: {
                                    ...prev.theme,
                                    fontFamily: f.id as any,
                                    fontHeading: f.id as any,
                                  },
                                }));
                                toast.success(`Fonte ${f.label} ativada!`);
                              }}
                              className={`rounded-lg border p-2 text-left transition-all ${
                                isSelected
                                  ? "border-amber-400 bg-zinc-800 text-zinc-100 font-semibold"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <span className="block text-[11px] font-semibold text-zinc-200 truncate">{f.label}</span>
                              <span className="block text-[9px] text-zinc-400 mt-0.5">{f.sample}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Efeitos dos Cards & Arredondamento */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">Efeito dos Cards:</span>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { id: "glass", label: "Vidro / Glass" },
                            { id: "solid", label: "Sólido Minimal" },
                            { id: "glow", label: "Brilho / Glow" },
                          ].map((eff) => (
                            <button
                              key={eff.id}
                              type="button"
                              onClick={() =>
                                setData((prev) => ({
                                  ...prev,
                                  theme: { ...prev.theme, boxEffect: eff.id as any },
                                }))
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all ${
                                ((data.theme as any)?.boxEffect || "glass") === eff.id
                                  ? "border-amber-400 bg-zinc-800 text-zinc-100 font-semibold"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {eff.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">Arredondamento:</span>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { id: "rounded", label: "Suave (16px)" },
                            { id: "pill", label: "Pílula (28px)" },
                            { id: "sharp", label: "Reto (0px Suíço)" },
                          ].map((rad) => (
                            <button
                              key={rad.id}
                              type="button"
                              onClick={() =>
                                setData((prev) => ({
                                  ...prev,
                                  theme: { ...prev.theme, borderRadius: rad.id as any, borderStyle: rad.id as any },
                                }))
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all ${
                                ((data.theme as any)?.borderRadius || "rounded") === rad.id
                                  ? "border-amber-400 bg-zinc-800 text-zinc-100 font-semibold"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {rad.label}
                            </button>
                          ))}
                        </div>
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
                        className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                      />
                    </label>

                    {/* Faixa Animada (Divisor Hero / Marquee) */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Faixa Animada (Divisor Hero)</span>
                          </span>
                          <span className="block text-[10px] text-zinc-400">
                            Frases que rolam na tela em loop infinito
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(data.marquee && data.marquee.length > 0)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const defaultItems = [
                                { id: "m1", text: "ATENDIMENTO VIP E PERSONALIZADO", icon: "💎" },
                                { id: "m2", text: "PADRÃO DE ALTA QUALIDADE", icon: "★" },
                                { id: "m3", text: "EXPERIÊNCIA EXCLUSIVA", icon: "✦" },
                                { id: "m4", text: "SATISFAÇÃO COMPROVADA", icon: "✨" },
                              ];
                              setData((prev) => ({
                                ...prev,
                                marquee: defaultItems,
                              }));
                              toast.success("Faixa animada ativada!");
                            } else {
                              setData((prev) => ({
                                ...prev,
                                marquee: [],
                              }));
                              toast.info("Faixa animada desativada.");
                            }
                          }}
                          className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                        />
                      </div>

                      {data.marquee && data.marquee.length > 0 && (
                        <div className="space-y-3.5 pt-2 border-t border-zinc-800/60">
                          {/* Controle de Velocidade da Animação */}
                          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase text-zinc-300">
                                Velocidade de Rolagem
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                {data.marqueeSpeed || 50}s{" "}
                                <span className="text-[9px] font-sans font-normal text-zinc-400">
                                  ({(data.marqueeSpeed || 50) >= 100
                                    ? "Ultra Lenta & Editorial"
                                    : (data.marqueeSpeed || 50) >= 70
                                    ? "Lenta & Elegante"
                                    : (data.marqueeSpeed || 50) >= 40
                                    ? "Suave (Recomendado)"
                                    : (data.marqueeSpeed || 50) >= 25
                                    ? "Moderada"
                                    : "Rápida"})
                                </span>
                              </span>
                            </div>

                            {/* Presets Rápidos */}
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { speed: 120, label: "Ultra", desc: "120s" },
                                { speed: 80, label: "Lenta", desc: "80s" },
                                { speed: 50, label: "Suave", desc: "50s" },
                                { speed: 30, label: "Média", desc: "30s" },
                                { speed: 18, label: "Rápida", desc: "18s" },
                              ].map((p) => {
                                const currentSpeed = data.marqueeSpeed || 50;
                                const isSelected = Math.abs(currentSpeed - p.speed) <= 4;
                                return (
                                  <button
                                    key={p.speed}
                                    type="button"
                                    onClick={() => {
                                      setData((prev) => ({
                                        ...prev,
                                        marqueeSpeed: p.speed,
                                        theme: { ...prev.theme, marqueeSpeed: p.speed },
                                      }));
                                      toast.success(`Velocidade da faixa: ${p.label} (${p.speed}s)!`);
                                    }}
                                    className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                                      isSelected
                                        ? "border border-amber-400/80 bg-zinc-800 text-amber-300 font-semibold shadow-xs"
                                        : "border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                                    }`}
                                  >
                                    <span className="block text-[10px] leading-tight font-medium truncate">{p.label}</span>
                                    <span className="block text-[9px] text-zinc-500 font-mono">{p.desc}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Slider Deslizante de Precisão */}
                            <div className="space-y-1 pt-1">
                              <input
                                type="range"
                                min={15}
                                max={150}
                                step={5}
                                value={data.marqueeSpeed || 50}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setData((prev) => ({
                                    ...prev,
                                    marqueeSpeed: val,
                                    theme: { ...prev.theme, marqueeSpeed: val },
                                  }));
                                }}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                              />
                              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                                <span>18s (Rápida)</span>
                                <span>50s (Recomendado)</span>
                                <span>150s (Ultra Lenta)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-zinc-400">
                              Frases ativas ({data.marquee.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newId = `m_${Date.now()}`;
                                setData((prev) => ({
                                  ...prev,
                                  marquee: [
                                    ...(prev.marquee || []),
                                    { id: newId, text: "NOVO DIFERENCIAL EXCLUSIVO", icon: "✦" },
                                  ],
                                }));
                                toast.success("Nova frase adicionada!");
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Adicionar Frase</span>
                            </button>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {data.marquee.map((item, idx) => {
                              const textVal = typeof item === "string" ? item : item.text;
                              const iconVal = typeof item === "object" ? item.icon || "" : "";
                              return (
                                <div key={item.id || idx} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                                  <input
                                    type="text"
                                    value={iconVal}
                                    placeholder="★"
                                    title="Emoji ou Ícone"
                                    onChange={(e) => {
                                      const newIcon = e.target.value;
                                      setData((prev) => {
                                        const nextMarquee = [...(prev.marquee || [])];
                                        const current = nextMarquee[idx];
                                        if (typeof current === "string") {
                                          nextMarquee[idx] = { id: `m_${idx}`, text: current, icon: newIcon };
                                        } else {
                                          nextMarquee[idx] = { ...current, icon: newIcon };
                                        }
                                        return { ...prev, marquee: nextMarquee };
                                      });
                                    }}
                                    className="w-10 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-center text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={textVal}
                                    placeholder="Digite a frase..."
                                    onChange={(e) => {
                                      const newText = e.target.value;
                                      setData((prev) => {
                                        const nextMarquee = [...(prev.marquee || [])];
                                        const current = nextMarquee[idx];
                                        if (typeof current === "string") {
                                          nextMarquee[idx] = { id: `m_${idx}`, text: newText };
                                        } else {
                                          nextMarquee[idx] = { ...current, text: newText };
                                        }
                                        return { ...prev, marquee: nextMarquee };
                                      });
                                    }}
                                    className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setData((prev) => ({
                                        ...prev,
                                        marquee: (prev.marquee || []).filter((_, i) => i !== idx),
                                      }));
                                      toast.info("Frase removida.");
                                    }}
                                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-zinc-800 cursor-pointer"
                                    title="Remover frase"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-1">
                            <span className="block text-[10px] text-zinc-500 mb-1.5">Sugestões rápidas para adicionar:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { text: "★ 4.9 NO GOOGLE", icon: "★" },
                                { text: "ATENDIMENTO PERSONALIZADO", icon: "💎" },
                                { text: "SATISFAÇÃO GARANTIDA", icon: "🛡️" },
                                { text: "EXPERIÊNCIA PREMIUM", icon: "✦" },
                                { text: "EQUIPE QUALIFICADA", icon: "⚡" },
                              ].map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => {
                                    setData((prev) => ({
                                      ...prev,
                                      marquee: [
                                        ...(prev.marquee || []),
                                        { id: `sug_${Date.now()}_${sIdx}`, text: sug.text, icon: sug.icon },
                                      ],
                                    }));
                                    toast.success(`"${sug.text}" adicionada!`);
                                  }}
                                  className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-[10px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
                                >
                                  +{sug.icon} {sug.text}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. SUB-ABA: MÍDIA & GALERIA */}
                {adjustmentTab === "media" && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    {/* Vídeo em Loop */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase text-zinc-400 flex items-center gap-1.5 tracking-wider">
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
                            className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            Remover Vídeo
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
                          <CheckCircle2 className="h-3 w-3" /> Vídeo ativo em loop no Hero (substitui foto de fundo)
                        </p>
                      )}
                    </div>

                    {/* Galeria de Fotos */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block">
                            Fotos do Acervo ({data.gallery.length})
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Clique em uma foto para defini-la como Capa do Hero
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-zinc-200 hover:text-white font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar Fotos</span>
                        </button>
                      </div>

                      {data.gallery.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-400 text-xs space-y-2">
                          <ImageIcon className="h-8 w-8 mx-auto text-zinc-600" />
                          <p className="font-medium text-zinc-300">Nenhuma foto no acervo</p>
                          <p className="text-[11px] text-zinc-500">Clique em "+ Adicionar Fotos" para enviar fotos do negócio.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
                              className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                                data.hero.backgroundImage === photo.url
                                  ? "border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                                  : "border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <img src={photo.url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                              {data.hero.backgroundImage === photo.url && (
                                <span className="absolute top-1.5 right-1.5 rounded-full bg-amber-400 text-zinc-950 text-[8px] font-bold px-1.5 py-0.5 shadow">
                                  Capa
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SUB-ABA: CONTATO & LOCALIZAÇÃO */}
                {adjustmentTab === "contact" && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    {/* WhatsApp */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
                          WhatsApp de Atendimento
                        </label>
                        {data.whatsapp && (
                          <a
                            href={`https://wa.me/55${data.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Testar wa.me</span>
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={data.whatsapp}
                        onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                        placeholder="Ex: 11999998888"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Usado nos botões de conversão e pedidos diretos do site.
                      </p>
                    </div>

                    {/* Endereço */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
                          Endereço Completo
                        </label>
                        {data.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Abrir no Maps</span>
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={data.address || ""}
                        onChange={(e) => setData({ ...data, address: e.target.value })}
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>

                    {/* Horário de Atendimento */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Horário de Funcionamento</span>
                      </label>
                      <input
                        type="text"
                        value={data.openingHours || ""}
                        onChange={(e) => setData({ ...data, openingHours: e.target.value })}
                        placeholder="Ex: Seg a Sex: 08h às 19h | Sáb: 08h às 14h"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>

                    {/* Avaliação Google */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>Avaliação no Google (Nota de Autoridade)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={data.rating || 5.0}
                          onChange={(e) => setData({ ...data, rating: parseFloat(e.target.value) || 5.0 })}
                          className="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-amber-400 text-center focus:border-zinc-600 focus:outline-none"
                        />
                        <div className="flex items-center gap-1 text-amber-400 text-sm">
                          {"★".repeat(Math.round(data.rating || 5))}
                          <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                            Exibido nos selos de confiança do site
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Salvar & Publicar Fixo no Rodapé dos Ajustes (Desktop & Mobile) */}
              <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky bottom-0 z-20">
                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 px-4 text-xs shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{isSaving ? "Salvando & Publicando..." : "Salvar & Publicar Alterações"}</span>
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
