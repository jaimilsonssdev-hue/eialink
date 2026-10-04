import React, { useState, useEffect, useRef } from "react";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Save,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Palette,
  FileText,
  ShoppingBag,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Type,
  Layers,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PageService } from "@/modules/page/services/PageService";
import type { CinematicPageData } from "@/modules/cinematic/types";
import { CinematicViewer } from "@/modules/cinematic/CinematicViewer";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";

// Opções oficiais dos 5 Modelos de Site
const TEMPLATE_OPTIONS = [
  {
    id: "restaurant-menu",
    name: "Delivery & Cardápio iFood",
    desc: "Cardápio com fotos, categorias e pedido direto no WhatsApp",
    badge: "Gastronomia",
    icon: "🍔",
  },
  {
    id: "store-showcase",
    name: "Loja & E-commerce (Carrinho)",
    desc: "Vitrine de produtos com sacola de compras e checkout WhatsApp",
    badge: "Varejo",
    icon: "🛍️",
  },
  {
    id: "site-maquina",
    name: "Site Institucional Máquina",
    desc: "Apresentação de autoridade, diferenciais, serviços e depoimentos",
    badge: "Empresas",
    icon: "🏢",
  },
  {
    id: "cinematic-glass",
    name: "Landing Page Cinematográfica",
    desc: "Visual imersivo de alta conversão, hero marcante e glassmorphism",
    badge: "Premium",
    icon: "✨",
  },
  {
    id: "clinic-care",
    name: "Clínica & Especialidades",
    desc: "Agendamento, especialidades e bio profissional para saúde",
    badge: "Saúde & Bem-estar",
    icon: "🩺",
  },
];

// Famílias de Tipografia
const FONT_OPTIONS = [
  { id: "sans", name: "Moderna & Clean", fontName: "Inter / Sans-serif", preview: "Aa - O melhor atendimento" },
  { id: "serif", name: "Luxo & Editorial", fontName: "Playfair Display", preview: "Aa - Elegância e sofisticação" },
  { id: "display", name: "Impacto & Urbano", fontName: "Plus Jakarta Sans", preview: "Aa - Presença forte e direta" },
  { id: "cormorant", name: "Clássica & Confiável", fontName: "Cormorant / Serif", preview: "Aa - Tradição e autoridade" },
];

// 4 Grandes Arquétipos Visuais
const ARCHETYPE_OPTIONS = [
  {
    id: "cinematic",
    name: "Cinematográfico Glass",
    desc: "Vidro fosco profundo, reflexos translúcidos e iluminação neon envolvente",
    badge: "Cinema & Luxo",
    icon: "✨",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalismo Pop",
    desc: "Bordas pretas sólidas 3D, sombras duras sem blur, botões táteis que afundam",
    badge: "Alto Impacto & Tendência",
    icon: "⚡",
  },
  {
    id: "editorial",
    name: "Editorial Suíço",
    desc: "Títulos serifados nobres, linhas finas de 1px, cantos retos e elegância de revista",
    badge: "Vogue & Quiet Luxury",
    icon: "🏛️",
  },
  {
    id: "bento",
    name: "Bento High-Tech",
    desc: "Títulos com gradiente moderno, super arredondamento (rounded-3xl) e chips",
    badge: "SaaS & Futurismo",
    icon: "🍱",
  },
];

// Estilos de Título & Efeitos de Texto
const HEADING_STYLE_OPTIONS = [
  { id: "default", name: "Padrão Harmônico", preview: "Título equilibrado" },
  { id: "uppercase", name: "Caixa Alta Marcante (Brutal)", preview: "TÍTULO EM CAIXA ALTA" },
  { id: "italic", name: "Serifa & Itálico (Editorial)", preview: "Título elegante em itálico" },
  { id: "gradient", name: "Gradiente Metálico (High-Tech)", preview: "Título com gradiente" },
];

export function CleanBuilder() {
  const search = useSearch({ from: "/_authenticated/builder" }) as { page?: string };
  const navigate = useNavigate();
  const pageParam = search.page;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageRecord, setPageRecord] = useState<any>(null);
  const [previewKey, setPreviewKey] = useState<number>(Date.now());

  // 1. Textos & Marca
  const [businessName, setBusinessName] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [ctaText, setCtaText] = useState("Pedir pelo WhatsApp");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // 2. Contato & Localização
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");

  // 3. Estilo, Cores, Fontes, Arquétipos e Modelo
  const [templateId, setTemplateId] = useState("cinematic-glass");
  const [archetype, setArchetype] = useState<"cinematic" | "neobrutalism" | "editorial" | "bento">("cinematic");
  const [headingStyle, setHeadingStyle] = useState<"default" | "uppercase" | "italic" | "gradient">("default");
  const [fontFamily, setFontFamily] = useState("sans");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [bgColor, setBgColor] = useState("#0a0a0c");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [boxEffect, setBoxEffect] = useState<"glass" | "solid" | "glow">("glass");
  const [borderRadius, setBorderRadius] = useState<"rounded" | "pill" | "sharp">("rounded");

  // 4. Vitrine / Cardápio / Produtos
  const [items, setItems] = useState<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      price: string;
      badge?: string;
      imageUrl: string;
    }>
  >([]);

  // Estados de Upload
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Visualização e Abas
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [activeTab, setActiveTab] = useState<"texts" | "products" | "style" | "contact">("texts");
  const [previewEngine, setPreviewEngine] = useState<"live" | "server">("live");

  useEffect(() => {
    loadPageData();
  }, [pageParam]);

  async function loadPageData() {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      let query = supabase.from("bio_pages").select("*");
      if (pageParam) {
        query = query.or(`slug.eq.${pageParam},id.eq.${pageParam}`);
      } else {
        query = query.eq("user_id", u.user.id).order("updated_at", { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        toast.error("Nenhuma página encontrada para editar.");
        setLoading(false);
        return;
      }

      setPageRecord(data);
      setBusinessName(data.display_name || "");
      setWhatsapp(data.whatsapp || "");
      setAddress(data.address || "");
      setAvatarUrl(data.avatar_url || "");
      setCoverUrl(data.cover_url || "");
      setTemplateId(data.template_id || "cinematic-glass");
      setAboutText(data.bio || "");

      const social = (data.social_links as any) || {};
      const cinematic: CinematicPageData | undefined = social.cinematicData || social.cinematic_data;
      const customTheme = social.custom_theme || social.theme || {};

      if (cinematic) {
        setHeadline(cinematic.hero?.title || data.display_name || "");
        setSubtitle(cinematic.hero?.subtitle || data.bio || "");
        setValueProp(cinematic.hero?.tagline || "");
        setCtaText(cinematic.hero?.ctaText || "Pedir pelo WhatsApp");
        if (cinematic.hero?.backgroundImage && !data.cover_url) {
          setCoverUrl(cinematic.hero.backgroundImage);
        }
        if (cinematic.avatarUrl && !data.avatar_url) {
          setAvatarUrl(cinematic.avatarUrl);
        }
        setBgColor(cinematic.theme?.bg || customTheme.bg || "#0a0a0c");
        setAccentColor(cinematic.theme?.accent || customTheme.accent || "#f59e0b");
        setFontFamily(customTheme.font || "sans");
        setThemeMode(customTheme.mode || (cinematic.theme?.bg?.includes("#fff") || cinematic.theme?.bg?.includes("#f8") ? "light" : "dark"));
        setBoxEffect(customTheme.boxEffect || "glass");
        setBorderRadius(customTheme.borderRadius || "rounded");

        const rawArch = customTheme.archetype || cinematic.archetype || (cinematic.theme as any)?.archetype || "cinematic";
        if (rawArch === "neobrutalism" || rawArch === "neo-pop-d2c" || rawArch === "dark-brutalist") {
          setArchetype("neobrutalism");
        } else if (rawArch === "editorial" || rawArch === "luxury-editorial") {
          setArchetype("editorial");
        } else if (rawArch === "bento" || rawArch === "clean-biotech" || rawArch === "cyber-tech") {
          setArchetype("bento");
        } else {
          setArchetype("cinematic");
        }
        setHeadingStyle(customTheme.headingStyle || (cinematic.theme as any)?.headingStyle || "default");

        const loadedItems = (cinematic.highlights || []).map((h, idx) => ({
          id: h.id || `item_${idx}`,
          title: h.title,
          subtitle: h.subtitle || "",
          price: h.price || "Sob Consulta",
          badge: h.badge || "Destaque",
          imageUrl: h.imageUrl || "",
        }));
        setItems(loadedItems);
      } else {
        setHeadline(data.display_name || "");
        setSubtitle(data.bio || "");
        setBgColor(customTheme.bg || "#0a0a0c");
        setAccentColor(customTheme.accent || "#f59e0b");
        const rawArch = customTheme.archetype || "cinematic";
        if (rawArch === "neobrutalism" || rawArch === "neo-pop-d2c" || rawArch === "dark-brutalist") {
          setArchetype("neobrutalism");
        } else if (rawArch === "editorial" || rawArch === "luxury-editorial") {
          setArchetype("editorial");
        } else if (rawArch === "bento" || rawArch === "clean-biotech" || rawArch === "cyber-tech") {
          setArchetype("bento");
        } else {
          setArchetype("cinematic");
        }
        setHeadingStyle(customTheme.headingStyle || "default");
      }
    } catch (err) {
      console.error("Erro ao carregar página no Builder Clean:", err);
      toast.error("Erro ao carregar dados da página.");
    } finally {
      setLoading(false);
    }
  }

  // Upload de Logo
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const publicUrl = await PageService.uploadAsset(file);
      setAvatarUrl(publicUrl);
      toast.success("Logotipo atualizado!");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro no upload do logotipo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  // Upload de Capa / Banner
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const publicUrl = await PageService.uploadAsset(file);
      setCoverUrl(publicUrl);
      toast.success("Foto de capa atualizada!");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro no upload da capa.");
    } finally {
      setUploadingCover(false);
    }
  }

  // Adiciona novo item na vitrine
  function handleAddItem() {
    const newItem = {
      id: `item_${Date.now()}`,
      title: "Novo Produto / Serviço",
      subtitle: "Descrição objetiva com ingredientes ou diferenciais",
      price: "R$ 49,90",
      badge: "Destaque",
      imageUrl: coverUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    };
    setItems([...items, newItem]);
    toast.success("Item adicionado à vitrine!");
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
    toast.info("Item removido.");
  }

  function handleItemChange(id: string, field: string, val: string) {
    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  }

  // Salva no banco de dados com velocidade instantânea e custo zero de IA
  async function handleSave() {
    if (!pageRecord?.id) return;
    setSaving(true);
    try {
      const social = (pageRecord.social_links as any) || {};
      const cleanWhatsapp = whatsapp.replace(/\D/g, "");

      const currentCinematic: CinematicPageData = social.cinematicData || social.cinematic_data || {
        businessName,
        niche: pageRecord.niche || "Geral",
        whatsapp: cleanWhatsapp,
        rating: pageRecord.google_rating || 4.9,
      };

      const updatedCinematic: CinematicPageData = {
        ...currentCinematic,
        businessName,
        avatarUrl,
        whatsapp: cleanWhatsapp,
        address,
        archetype,
        theme: {
          ...currentCinematic.theme,
          bg: bgColor,
          accent: accentColor,
          mode: themeMode,
          fontFamily,
          boxEffect,
          borderRadius,
          archetype,
          headingStyle,
        },
        hero: {
          ...currentCinematic.hero,
          title: headline,
          subtitle,
          tagline: valueProp,
          backgroundImage: coverUrl,
          ctaText: ctaText || "Pedir pelo WhatsApp",
          ctaLink: `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
            `Olá! Vim pelo site da ${businessName} e gostaria de informações.`
          )}`,
        },
        highlights: items.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.subtitle,
          description: i.subtitle,
          price: i.price,
          duration: "Consulte opções",
          badge: i.badge || "Destaque",
          imageUrl: i.imageUrl || coverUrl,
          features: ["Qualidade assegurada", "Atendimento exclusivo"],
        })),
      };

      const customThemeObj = {
        bg: bgColor,
        background: bgColor,
        accent: accentColor,
        primary: accentColor,
        font: fontFamily,
        font_pair: fontFamily,
        mode: themeMode,
        boxEffect,
        borderRadius,
        border_radius: borderRadius === "sharp" ? "0px" : borderRadius === "pill" ? "28px" : "16px",
        archetype,
        headingStyle,
      };

      // 1. Atualiza a tabela bio_pages
      const { error: pageError } = await supabase
        .from("bio_pages")
        .update({
          display_name: businessName,
          bio: aboutText || subtitle,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          whatsapp: cleanWhatsapp,
          address,
          template_id: templateId,
          social_links: {
            ...social,
            theme: customThemeObj,
            custom_theme: customThemeObj,
            cinematicData: updatedCinematic,
            cinematic_data: updatedCinematic,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageRecord.id);

      if (pageError) throw pageError;

      // 2. Sincroniza os itens na tabela catalog_items (para alimentar loja e delivery nativamente)
      if (items.length > 0) {
        await supabase.from("catalog_items").delete().eq("page_id", pageRecord.id);

        const catalogRows = items.map((item) => {
          const rawPrice = parseFloat(
            item.price.replace(/[^\d,.-]/g, "").replace(",", ".")
          );
          return {
            page_id: pageRecord.id,
            title: item.title,
            description: item.subtitle,
            price: isNaN(rawPrice) ? 0 : rawPrice,
            image_url: item.imageUrl || coverUrl,
            category: item.badge || "Destaques",
            active: true,
          };
        });

        await supabase.from("catalog_items").insert(catalogRows);
      }

      setPreviewKey(Date.now());
      toast.success("Site salvo com sucesso! Alterações sincronizadas no ar.");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  // Copia o link público
  function handleCopyPublicLink() {
    if (!pageRecord?.slug) return;
    const url = `${window.location.origin}/p/${pageRecord.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do site copiado para a área de transferência!");
  }

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-medium tracking-wide">Carregando Editor Clean...</span>
      </div>
    );
  }

  if (!pageRecord) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-zinc-400">Nenhum site selecionado para edição.</p>
        <Link
          to="/pages"
          className="px-4 py-2 rounded-xl bg-primary text-zinc-950 font-bold text-xs"
        >
          Ver minhas páginas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#07070a] text-zinc-100">
      {/* Inputs ocultos de Upload */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Barra Superior do Builder Clean */}
      <header className="h-14 border-b border-white/10 bg-black/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/pages"
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Voltar para páginas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{businessName || "Meu Site"}</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                /p/{pageRecord.slug}
              </span>
            </h1>
          </div>
        </div>

        {/* Controles Centrais: Alternar Tela & Modo de Prévia */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "mobile" ? "bg-white/15 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
              title="Visualização Mobile (Celular)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "desktop" ? "bg-white/15 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
              title="Visualização Desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewEngine("live")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                previewEngine === "live"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Prévia reativa em tempo real (0ms de delay)"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ao Vivo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewEngine("server");
                setPreviewKey(Date.now());
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                previewEngine === "server"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Prévia direta do servidor (Iframe publicado)"
            >
              <span>Servidor</span>
            </button>
          </div>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewKey(Date.now())}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Recarregar Pré-visualização"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar Link</span>
          </button>

          <a
            href={`/p/${pageRecord.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver no Ar</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal: Inspetor Lateral + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* PAINEL LATERAL DE EDIÇÃO */}
        <aside className="w-full sm:w-[380px] lg:w-[440px] border-r border-white/10 bg-[#09080e] flex flex-col shrink-0 overflow-hidden">
          {/* Abas Superiores do Inspetor */}
          <div className="flex border-b border-white/10 bg-black/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("texts")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "texts"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Textos & Marca</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "products"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Vitrine</span>
              <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{items.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "style"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Design & Estilos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "contact"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Contato</span>
            </button>
          </div>

          {/* Conteúdo da Aba Selecionada */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ABA 1: TEXTOS & MARCA */}
            {activeTab === "texts" && (
              <div className="space-y-4">
                {/* 1. Logotipo / Marca */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                    Logotipo da Marca
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-white/20 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{avatarUrl ? "Trocar Logotipo" : "Enviar Imagem da Logo"}</span>
                      </button>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Ou cole a URL do Logo (https://...)"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Banner da Hero / Capa */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                    Banner de Capa da Hero
                  </label>
                  {coverUrl && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-white/10 relative group">
                      <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>{coverUrl ? "Alterar Foto de Capa" : "Enviar Banner de Capa"}</span>
                    </button>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Ou cole a URL da Imagem de Capa (https://...)"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>

                {/* 3. Textos Principais */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Nome do Negócio</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Título Principal (Headline)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Alta Gastronomia Artesanal"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Subtítulo / Proposta Breve</label>
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    rows={2}
                    placeholder="Descrição envolvente do negócio..."
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Sobre Nós / História / Descrição Completa
                  </label>
                  <textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    rows={4}
                    placeholder="Conte a história, os diferenciais e a paixão por trás do seu negócio..."
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 leading-relaxed"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Esse texto é exibido na seção institucional ("Sobre a Empresa / Nossa História").
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Frase de Destaque (Tagline)</label>
                    <input
                      type="text"
                      value={valueProp}
                      onChange={(e) => setValueProp(e.target.value)}
                      placeholder="Ex: ELEITO O MELHOR DA CIDADE"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Texto do Botão (CTA)</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Ex: Fazer Pedido no WhatsApp"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: VITRINE & PRODUTOS */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Itens do Cardápio / Vitrine ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl p-4">
                    Nenhum item na vitrine. Clique em "Adicionar Item" acima.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2.5 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Item #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                            placeholder="Nome do produto ou prato"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                            placeholder="Preço (Ex: R$ 45,00)"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/60"
                          />
                          <input
                            type="text"
                            value={item.badge || ""}
                            onChange={(e) => handleItemChange(item.id, "badge", e.target.value)}
                            placeholder="Badge (Ex: Mais Vendido)"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={(e) => handleItemChange(item.id, "subtitle", e.target.value)}
                            placeholder="Descrição dos ingredientes ou detalhes"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          )}
                          <input
                            type="url"
                            value={item.imageUrl}
                            onChange={(e) => handleItemChange(item.id, "imageUrl", e.target.value)}
                            placeholder="URL da foto (https://...)"
                            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: DESIGN, FONTES, ESTILOS & MODELO */}
            {activeTab === "style" && (
              <div className="space-y-5">
                {/* 1. Trocar Modelo de Site */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Modelo de Site Ativo
                  </label>
                  <div className="space-y-1.5">
                    {TEMPLATE_OPTIONS.map((tmpl) => {
                      const isSelected = templateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setTemplateId(tmpl.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition relative flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{tmpl.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">{tmpl.name}</p>
                              <p className="text-[10px] text-zinc-400 line-clamp-1">{tmpl.desc}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="h-4 w-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Arquétipo Visual & Atmosfera */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-purple-400" /> Arquétipo Visual & Design
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Design System</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ARCHETYPE_OPTIONS.map((arch) => {
                      const isSelected = archetype === arch.id;
                      return (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => {
                            setArchetype(arch.id as any);
                            if (arch.id === "neobrutalism") {
                              setHeadingStyle("uppercase");
                              setBorderRadius("rounded");
                              setBoxEffect("solid");
                            } else if (arch.id === "editorial") {
                              setHeadingStyle("italic");
                              setBorderRadius("sharp");
                              setFontFamily("serif");
                            } else if (arch.id === "bento") {
                              setHeadingStyle("gradient");
                              setBorderRadius("pill");
                            } else if (arch.id === "cinematic") {
                              setHeadingStyle("default");
                              setBorderRadius("rounded");
                              setBoxEffect("glass");
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/50 shadow-md"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-lg">{arch.icon}</span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isSelected
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                    : "bg-white/5 text-zinc-400 border border-white/10"
                                }`}
                              >
                                {arch.badge}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white leading-tight">{arch.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {arch.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] text-purple-300 font-bold">
                              <span>Ativo no Site</span>
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Estilo dos Títulos & Efeito Tipográfico */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-pink-400" /> Estilo & Efeito dos Títulos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEADING_STYLE_OPTIONS.map((opt) => {
                      const isSelected = headingStyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHeadingStyle(opt.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-pink-950/40 border-pink-500/80 ring-1 ring-pink-500/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-xs font-bold text-white">{opt.name}</p>
                          <p
                            className={`text-[10px] mt-1 line-clamp-1 ${
                              opt.id === "uppercase"
                                ? "uppercase font-black text-amber-300"
                                : opt.id === "italic"
                                ? "italic font-serif text-zinc-200"
                                : opt.id === "gradient"
                                ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {opt.preview}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Tipografia / Família de Fontes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-blue-400" /> Tipografia & Fontes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((font) => {
                      const isSelected = fontFamily === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFontFamily(font.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-xs font-bold text-white">{font.name}</p>
                          <p className="text-[10px] text-zinc-400">{font.fontName}</p>
                          <p className="text-[10px] text-zinc-300 mt-1 italic opacity-80">{font.preview}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Modo do Fundo: Dark vs Light */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-violet-400" /> Modo Visual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("dark");
                        if (bgColor === "#ffffff" || bgColor === "#f8fafc") setBgColor("#0a0a0c");
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                        themeMode === "dark"
                          ? "bg-zinc-800 border-white/30 text-white shadow"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Modo Escuro (Dark)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("light");
                        if (bgColor === "#0a0a0c" || bgColor === "#09080e") setBgColor("#f8fafc");
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                        themeMode === "light"
                          ? "bg-white text-zinc-900 border-white shadow"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      <span>Modo Claro (Light)</span>
                    </button>
                  </div>
                </div>

                {/* 6. Cor de Destaque (Accent) */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Cor de Destaque (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Presets de Cor */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      { name: "Âmbar Nobre", color: "#f59e0b" },
                      { name: "Esmeralda", color: "#10b981" },
                      { name: "Cyan Elétrico", color: "#00f0ff" },
                      { name: "Volt Neon", color: "#ccff00" },
                      { name: "Laranja Delivery", color: "#ea580c" },
                      { name: "Rosa Glamour", color: "#ec4899" },
                    ].map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setAccentColor(p.color)}
                        className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Cor de Fundo */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Cor de Fundo da Página
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* 8. Efeito dos Cards & Arredondamento */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Efeito dos Cards
                    </label>
                    <select
                      value={boxEffect}
                      onChange={(e) => setBoxEffect(e.target.value as any)}
                      className="w-full rounded-xl border border-white/15 bg-zinc-900 px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="glass">Glassmorphism (Vidro)</option>
                      <option value="solid">Sólido Minimalista</option>
                      <option value="glow">Glow Iluminado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Arredondamento
                    </label>
                    <select
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value as any)}
                      className="w-full rounded-xl border border-white/15 bg-zinc-900 px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="rounded">Moderno (Suave)</option>
                      <option value="pill">Pílula (Curvo)</option>
                      <option value="sharp">Reto (Minimalista)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: CONTATO & WHATSAPP */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">WhatsApp de Atendimento</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 73999999999"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Apenas dígitos com DDD. Todos os botões de pedido e contato do site abrem este número.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Endereço Completo</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Presidente Vargas, 120 - Centro"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ÁREA CENTRAL: PREVIEW EM TEMPO REAL */}
        <main className="flex-1 bg-[#050408] overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div
            className={`transition-all duration-300 shadow-2xl overflow-hidden rounded-[2.5rem] border-4 border-zinc-800 bg-black flex flex-col ${
              viewMode === "mobile"
                ? "w-[375px] h-[720px] max-h-[85vh]"
                : "w-full max-w-4xl h-[720px] max-h-[85vh] rounded-2xl border-zinc-700"
            }`}
          >
            {/* Notch do Smartphone */}
            {viewMode === "mobile" && (
              <div className="h-6 w-full bg-black shrink-0 flex items-center justify-center">
                <div className="w-24 h-4 bg-zinc-900 rounded-b-xl" />
              </div>
            )}

            {/* Simulação do Visualizador Vivo ou Iframe */}
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: bgColor }}>
              {previewEngine === "live" ? (
                templateId === "cinematic-glass" || templateId === "cinematic-scrolly" ? (
                  <CinematicViewer
                    data={{
                      businessName: businessName || "Sua Marca",
                      niche: pageRecord?.niche || "Geral",
                      whatsapp: whatsapp.replace(/\D/g, ""),
                      address,
                      rating: pageRecord?.google_rating || 4.9,
                      archetype: archetype as any,
                      theme: {
                        bg: bgColor,
                        accent: accentColor,
                        mode: themeMode,
                        fontFamily: fontFamily,
                        boxEffect: boxEffect,
                        borderRadius: borderRadius,
                        fontHeading: fontFamily === "serif" ? "serif" : fontFamily === "display" ? "display" : fontFamily === "mono" ? "mono" : "sans",
                        parallaxEnabled: false,
                        borderStyle: borderRadius === "sharp" ? "sharp" : borderRadius === "pill" ? "pill" : "glass",
                        headingStyle,
                        archetype: archetype as any,
                      },
                      hero: {
                        title: headline || businessName || "Sua Marca",
                        subtitle: subtitle || "Atendimento exclusivo e produtos de qualidade para você.",
                        tagline: valueProp || "O MELHOR DA CIDADE",
                        backgroundImage: coverUrl,
                        ctaText: ctaText || "Pedir pelo WhatsApp",
                        ctaLink: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
                        floatingBadge: "★ 4.9 NO GOOGLE",
                      },
                      highlights: items.map((i) => ({
                        id: i.id,
                        title: i.title,
                        description: i.subtitle,
                        price: i.price,
                        badge: i.badge || "Destaque",
                        image: i.imageUrl || coverUrl,
                      })),
                      bentoGrid: [
                        {
                          id: "b1",
                          title: "Atendimento Rápido",
                          description: "Peça e receba atendimento instantâneo pelo WhatsApp.",
                          size: "large",
                          metric: "100%",
                          badge: "Garantia",
                        },
                        {
                          id: "b2",
                          title: "Qualidade Comprovada",
                          description: "Aprovado pelos clientes mais exigentes.",
                          size: "medium",
                          metric: "4.9★",
                          badge: "Destaque",
                        },
                        {
                          id: "b3",
                          title: "Facilidade de Pagamento",
                          description: "Aceitamos Pix, cartões e entrega rápida.",
                          size: "small",
                          badge: "Prático",
                        },
                      ],
                      gallery: items.filter((i) => i.imageUrl).map((i, idx) => ({
                        id: `gal_${idx}`,
                        url: i.imageUrl,
                        caption: i.title,
                        category: i.badge || "Vitrine",
                      })),
                    }}
                    isEmbedded={true}
                  />
                ) : (
                  <TemplateRenderer
                    bio={
                      {
                        id: pageRecord?.id || "preview_id",
                        slug: pageRecord?.slug || "preview",
                        display_name: businessName || "Sua Marca",
                        description: subtitle || aboutText,
                        avatar_url: avatarUrl,
                        cover_url: coverUrl,
                        whatsapp: whatsapp.replace(/\D/g, ""),
                        whatsapp_message: `Olá! Vim pelo site da ${businessName || "empresa"} e gostaria de informações.`,
                        template_id: templateId,
                        theme: "aurora",
                        motion_enabled: false,
                        social_links: {
                          address,
                          google_rating: pageRecord?.google_rating || 4.9,
                          archetype,
                          theme: {
                            bg: bgColor,
                            accent: accentColor,
                            archetype,
                            headingStyle,
                          },
                          custom_theme: {
                            bg: bgColor,
                            background: bgColor,
                            accent: accentColor,
                            primary: accentColor,
                            font: fontFamily,
                            font_pair: fontFamily,
                            archetype,
                            headingStyle,
                            borderRadius,
                            border_radius: borderRadius === "sharp" ? "0px" : borderRadius === "pill" ? "28px" : "16px",
                            boxEffect,
                            mode: themeMode,
                          },
                        },
                      } as any
                    }
                    links={[]}
                    onTrack={() => {}}
                    onShare={() => {}}
                    products={items.map((i) => {
                      const rawPrice = parseFloat(i.price.replace(/[^\d,.-]/g, "").replace(",", "."));
                      return {
                        id: i.id,
                        page_id: pageRecord?.id || "",
                        title: i.title,
                        description: i.subtitle,
                        price: isNaN(rawPrice) ? 0 : rawPrice,
                        image_url: i.imageUrl || coverUrl,
                        category: i.badge || "Destaques",
                        active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                    })}
                  />
                )
              ) : (
                <iframe
                  key={previewKey}
                  title="Preview do Site"
                  src={`/p/${pageRecord?.slug || ""}?t=${previewKey}`}
                  className="w-full h-full border-none"
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CleanBuilder;

