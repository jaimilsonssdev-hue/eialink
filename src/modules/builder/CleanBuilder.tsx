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

  // 5. Faixa Animada (Marquee / Divisor)
  const [marqueeEnabled, setMarqueeEnabled] = useState(true);
  const [marqueeItems, setMarqueeItems] = useState<
    Array<{ id: string; text: string; icon?: string }>
  >([
    { id: "m1", text: "ATENDIMENTO VIP E PERSONALIZADO", icon: "💎" },
    { id: "m2", text: "PADRÃO DE ALTA QUALIDADE", icon: "★" },
    { id: "m3", text: "EXPERIÊNCIA EXCLUSIVA", icon: "✦" },
    { id: "m4", text: "SATISFAÇÃO COMPROVADA", icon: "✨" },
  ]);

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

        if (cinematic.marquee && Array.isArray(cinematic.marquee)) {
          if (cinematic.marquee.length > 0) {
            setMarqueeEnabled(true);
            setMarqueeItems(
              cinematic.marquee.map((m: any, idx: number) => ({
                id: m.id || `m_${idx}`,
                text: typeof m === "string" ? m : m.text || "",
                icon: typeof m === "object" ? m.icon || "✦" : "✦",
              }))
            );
          } else {
            setMarqueeEnabled(false);
          }
        }
      } else {
        setHeadline(data.display_name || "");
        setSubtitle(data.bio || "");
        setBgColor(customTheme.bg || customTheme.background || "#0a0a0c");
        setAccentColor(customTheme.accent || customTheme.primary || "#f59e0b");
        setFontFamily(customTheme.font || customTheme.font_pair || "sans");
        setThemeMode(customTheme.mode || (customTheme.bg?.includes("#fff") || customTheme.bg?.includes("#f8") ? "light" : "dark"));
        setBoxEffect(customTheme.boxEffect || "glass");
        setBorderRadius(customTheme.borderRadius || "rounded");
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
        marquee: marqueeEnabled
          ? marqueeItems.filter((m) => m.text.trim().length > 0)
          : [],
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

      {/* Barra Superior do Builder Clean - Linear/Apple Style */}
      <header className="h-13 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        {/* Lado Esquerdo: Voltar + Nome do Site + Slug */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/pages"
            className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition shrink-0"
            title="Voltar para páginas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-zinc-100 truncate max-w-[160px] sm:max-w-[240px]" title={businessName}>
              {businessName || "Meu Site"}
            </h1>
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              title="Copiar link público do site"
            >
              <span className="text-zinc-600">/p/</span>
              <span className="truncate max-w-[120px]">{pageRecord.slug}</span>
              <Copy className="h-3 w-3 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Centro: Controles de Dispositivo & Engine */}
        <div className="flex items-center gap-2">
          {/* Segmented Switch: Mobile vs Desktop */}
          <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "mobile"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Visualização Mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "desktop"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Visualização Desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          {/* Engine: Ao Vivo vs Servidor */}
          <div className="hidden lg:flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => setPreviewEngine("live")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                previewEngine === "live"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Prévia em tempo real instantânea"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Ao Vivo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewEngine("server");
                setPreviewKey(Date.now());
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                previewEngine === "server"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Visualização via iframe publicado"
            >
              <span>Servidor</span>
            </button>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPreviewKey(Date.now())}
            className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition cursor-pointer"
            title="Recarregar Prévia"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <a
            href={`/p/${pageRecord.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver no Ar</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-3.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-900" />
                <span>Salvando</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-zinc-900" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal: Inspetor Lateral + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* PAINEL LATERAL DE EDIÇÃO - Minimal & Modern */}
        <aside className="w-full sm:w-[380px] lg:w-[420px] border-r border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 overflow-hidden">
          {/* Abas Superiores do Inspetor */}
          <div className="p-1.5 bg-zinc-950 border-b border-zinc-800/80 grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("texts")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "texts"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-750 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Textos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "products"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-750 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Vitrine</span>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1 rounded-full">{items.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "style"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-750 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Design</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === "contact"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-750 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Contato</span>
            </button>
          </div>

          {/* Conteúdo da Aba Selecionada */}
          <div key={activeTab} className="flex-1 overflow-y-auto p-4 space-y-5 animate-in fade-in-50 duration-200">
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

            {/* ABA 3: DESIGN, ESTILOS, ARQUÉTIPOS & CORES - Clean & Executive */}
            {activeTab === "style" && (
              <div className="space-y-5">
                {/* 1. Modelo de Site Ativo - Dropdown Compacto e Elegante */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">Modelo de Site Ativo</label>
                  <div className="relative">
                    <select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 cursor-pointer"
                    >
                      {TEMPLATE_OPTIONS.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id} className="bg-zinc-900 text-zinc-100">
                          {tmpl.icon} {tmpl.name} ({tmpl.badge})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 text-xs">
                      ▼
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    {TEMPLATE_OPTIONS.find((t) => t.id === templateId)?.desc}
                  </p>
                </div>

                {/* 2. Arquétipo Visual de Design - Grid 2x2 Clean */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">Arquétipo Visual</label>
                    <span className="text-[10px] text-zinc-500 font-mono">Direção de Arte</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-zinc-850 border-zinc-400 text-white shadow-xs ring-1 ring-zinc-500/20"
                              : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{arch.icon}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-zinc-200 stroke-[2.5]" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-tight text-zinc-100">{arch.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{arch.badge}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Modo Visual: Escuro vs Claro */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">Modo Visual</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("dark");
                        if (bgColor === "#ffffff" || bgColor === "#f8fafc") setBgColor("#0a0a0c");
                      }}
                      className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        themeMode === "dark"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Modo Escuro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("light");
                        if (bgColor === "#0a0a0c" || bgColor === "#09080e") setBgColor("#f8fafc");
                      }}
                      className={`py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        themeMode === "light"
                          ? "bg-zinc-800 text-zinc-100 shadow-xs"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                      <span>Modo Claro</span>
                    </button>
                  </div>
                </div>

                {/* 4. Tipografia & Fontes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">Tipografia & Família de Fonte</label>
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
                              ? "bg-zinc-850 border-zinc-400 text-white shadow-xs"
                              : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-zinc-100">{font.name}</p>
                            {isSelected && <Check className="h-3 w-3 text-zinc-200" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{font.fontName}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Estilo dos Títulos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">Estilo dos Títulos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEADING_STYLE_OPTIONS.map((opt) => {
                      const isSelected = headingStyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHeadingStyle(opt.id as any)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-zinc-850 border-zinc-400 text-white shadow-xs"
                              : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
                          }`}
                        >
                          <p className="text-xs font-semibold text-zinc-100 truncate">{opt.name}</p>
                          <p
                            className={`text-[10px] mt-0.5 truncate ${
                              opt.id === "uppercase"
                                ? "uppercase font-bold text-zinc-300"
                                : opt.id === "italic"
                                ? "italic font-serif text-zinc-300"
                                : opt.id === "gradient"
                                ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400"
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

                {/* 6. Cores & Paleta */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-850">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Cor de Destaque (Botões e Destaques)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    {/* Paletas de Cores Nobres */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        { name: "Âmbar", color: "#f59e0b" },
                        { name: "Esmeralda", color: "#10b981" },
                        { name: "Azul Real", color: "#2563eb" },
                        { name: "Violeta", color: "#8b5cf6" },
                        { name: "Laranja", color: "#ea580c" },
                        { name: "Monocromático", color: "#ffffff" },
                      ].map((p) => (
                        <button
                          key={p.color}
                          type="button"
                          onClick={() => setAccentColor(p.color)}
                          className="px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-[11px] text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: p.color }} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Cor de Fundo da Página
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Efeito dos Cards & Arredondamento */}
                <div className="space-y-3 pt-2 border-t border-zinc-850">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">Estilo dos Cards</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      {[
                        { id: "glass", label: "Vidro" },
                        { id: "solid", label: "Sólido" },
                        { id: "glow", label: "Glow" },
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          type="button"
                          onClick={() => setBoxEffect(eff.id as any)}
                          className={`py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                            boxEffect === eff.id
                              ? "bg-zinc-800 text-zinc-100 shadow-xs"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {eff.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">Arredondamento das Bordas</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      {[
                        { id: "rounded", label: "Curvo" },
                        { id: "pill", label: "Pílula" },
                        { id: "sharp", label: "Reto" },
                      ].map((rad) => (
                        <button
                          key={rad.id}
                          type="button"
                          onClick={() => setBorderRadius(rad.id as any)}
                          className={`py-1.5 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                            borderRadius === rad.id
                              ? "bg-zinc-800 text-zinc-100 shadow-xs"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {rad.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 8. Faixa Animada (Marquee / Divisor de Sessão) */}
                <div className="space-y-3 pt-3 border-t border-zinc-850">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block">Faixa Animada (Divisor Hero)</label>
                      <span className="text-[10px] text-zinc-500">Loop contínuo com frases de impacto abaixo da Hero</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marqueeEnabled}
                        onChange={(e) => setMarqueeEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {marqueeEnabled && (
                    <div className="space-y-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                          Frases na Faixa ({marqueeItems.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newId = `m_${Date.now()}`;
                            setMarqueeItems((prev) => [
                              ...prev,
                              { id: newId, text: "NOVO DIFERENCIAL EXCLUSIVO", icon: "✦" },
                            ]);
                            toast.success("Frase adicionada!");
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {marqueeItems.map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={item.icon || ""}
                              placeholder="★"
                              title="Ícone / Emoji"
                              onChange={(e) => {
                                const newIcon = e.target.value;
                                setMarqueeItems((prev) =>
                                  prev.map((m, i) => (i === idx ? { ...m, icon: newIcon } : m))
                                );
                              }}
                              className="w-8 rounded-lg border border-zinc-800 bg-zinc-950 px-1 py-1.5 text-center text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={item.text}
                              placeholder="Frase de destaque..."
                              onChange={(e) => {
                                const newText = e.target.value;
                                setMarqueeItems((prev) =>
                                  prev.map((m, i) => (i === idx ? { ...m, text: newText } : m))
                                );
                              }}
                              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMarqueeItems((prev) => prev.filter((_, i) => i !== idx));
                                toast.info("Frase removida.");
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 transition cursor-pointer rounded"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Sugestões Rápidas */}
                      <div className="pt-1">
                        <span className="block text-[9px] text-zinc-500 mb-1">Sugestões de 1 clique:</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { text: "★ 4.9 NO GOOGLE", icon: "★" },
                            { text: "ATENDIMENTO VIP", icon: "💎" },
                            { text: "100% ARTESANAL", icon: "🌿" },
                            { text: "ENTREGA RÁPIDA", icon: "⚡" },
                          ].map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                setMarqueeItems((prev) => [
                                  ...prev,
                                  { id: `sug_${Date.now()}_${sIdx}`, text: sug.text, icon: sug.icon },
                                ]);
                                toast.success(`"${sug.text}" adicionada!`);
                              }}
                              className="rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[9px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition cursor-pointer"
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

        {/* ÁREA CENTRAL: PREVIEW MODERNO & REFINADO */}
        <main className="flex-1 bg-[#09090b] overflow-y-auto p-4 sm:p-6 flex items-center justify-center relative">
          <div
            className={`transition-all duration-300 ease-out flex flex-col will-change-[width,height] ${
              viewMode === "mobile"
                ? "w-[380px] h-[740px] max-h-[85vh] rounded-[48px] bg-zinc-900 p-2.5 shadow-2xl ring-1 ring-zinc-800 border border-zinc-700/50"
                : "w-full max-w-4xl h-[740px] max-h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950"
            }`}
          >
            {/* Topbar de Janela Desktop (Estilo macOS / Navegador Minimalista) */}
            {viewMode === "desktop" && (
              <div className="h-9 w-full bg-zinc-900/80 border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
                </div>
                <div className="px-3 py-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 w-72 justify-center">
                  <span className="text-zinc-600">https://</span>
                  <span className="truncate">{businessName?.toLowerCase().replace(/\s+/g, "") || "empresa"}.com.br</span>
                </div>
                <div className="w-12" />
              </div>
            )}

            {/* Frame Interno do Smartphone com Dynamic Island Fina */}
            <div
              className={`flex-1 overflow-hidden relative flex flex-col ${
                viewMode === "mobile" ? "rounded-[38px] bg-black shadow-inner" : ""
              }`}
            >
              {viewMode === "mobile" && (
                <div className="h-6 w-full bg-transparent absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pointer-events-none">
                  <span className="text-[10px] font-semibold text-zinc-400 font-mono">09:41</span>
                  <div className="w-20 h-3.5 bg-black/90 rounded-full border border-white/10 shadow-xs" />
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>5G</span>
                  </div>
                </div>
              )}

              {/* Conteúdo Renderizado (Live ou Iframe) */}
              <div className="flex-1 overflow-y-auto transition-colors duration-200" style={{ backgroundColor: bgColor }}>
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
                      marquee: marqueeEnabled
                        ? marqueeItems.filter((m) => m.text.trim().length > 0)
                        : [],
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
                            background: bgColor,
                            accent: accentColor,
                            primary: accentColor,
                            archetype,
                            headingStyle,
                            mode: themeMode,
                            fontFamily,
                            font: fontFamily,
                            boxEffect,
                            borderRadius,
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

            {/* Home indicator sutil do mobile */}
            {viewMode === "mobile" && (
              <div className="h-4 w-full bg-transparent absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-1 bg-white/30 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  </div>
);
}

export default CleanBuilder;

