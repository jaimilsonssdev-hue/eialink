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
  Flame,
  Star,
  Clock,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
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

export default function CinematicStudioPage() {
  const [data, setData] = useState<CinematicPageData>(() => createDefaultCinematicData());
  const [userId, setUserId] = useState<string>("");
  const [pageId, setPageId] = useState<string | undefined>(undefined);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // Estados dos controles
  const [mapsQuery, setMapsQuery] = useState("");
  const [isLookingUpMaps, setIsLookingUpMaps] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isRefiningAi, setIsRefiningAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("controls");
  const [copiedLink, setCopiedLink] = useState(false);
  const [publishedModalOpen, setPublishedModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca o usuário atual
  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData }) => {
      if (authData.user) {
        setUserId(authData.user.id);
      }
    });
  }, []);

  // 1. Puxar Dados do Google Maps
  const handleLookupMaps = async () => {
    if (!mapsQuery.trim()) {
      toast.error("Cole um link do Google Maps ou o nome do local.");
      return;
    }

    setIsLookingUpMaps(true);
    try {
      const result = await lookupMapsForCinematicFn({ data: { urlOrQuery: mapsQuery } });
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

        // Se houver fotos do Google Maps, integra na galeria
        if (result.photos && result.photos.length > 0) {
          const newGallery: CinematicGalleryItem[] = (result.photos || []).slice(0, 6).map((url: string, i: number) => ({
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

      toast.success(`Dados de "${result.name}" importados do Google Maps com sucesso!`);
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

    toast.info("Processando fotos reais...");
    const newItems: CinematicGalleryItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Tenta upload no Supabase Storage se conectado
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

        // Fallback para Data URL local instantânea
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
          // Se for a primeira foto enviada, define como capa do Hero
          backgroundImage: prev.hero.backgroundImage.includes("unsplash.com/photo-1501339847302")
            ? newItems[0].url
            : prev.hero.backgroundImage,
        },
      }));
      toast.success(`${newItems.length} foto(s) adicionada(s) à galeria!`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Comandar IA (Direção de Arte com Gemini)
  const handleRefineWithAi = async (promptOverride?: string) => {
    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse.trim()) {
      toast.error("Digite o que você deseja mudar ou escolha uma sugestão.");
      return;
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
      toast.success("✨ Direção de arte cinematográfica aplicada pela IA!");
      if (!promptOverride) setAiPrompt("");
    } catch (err: any) {
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
        toast.success("🎬 Landing Page Cinematográfica publicada com sucesso!");
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
    <div className="cinematic-studio flex h-screen w-full flex-col overflow-hidden bg-[#070709] text-zinc-100">
      {/* TopBar do Cockpit */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20">
            🎬
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">Cinematic Studio</span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                NOVO MOTOR
              </span>
            </div>
          </div>
        </div>

        {/* Alternador Mobile (Abas: Controles vs Prévia) */}
        <div className="flex lg:hidden items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setMobileTab("controls")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mobileTab === "controls" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Comandar IA
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mobileTab === "preview" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Ver Prévia
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
            {isSaving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? "Publicando..." : "Salvar & Publicar"}</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal Dividido (Split Cockpit) */}
      <div className="flex flex-1 overflow-hidden">
        {/* PAINEL LATERAL ESQUERDO: CONTROLES & CHAT STUDIO (420px) */}
        <aside
          className={`w-full lg:w-[420px] shrink-0 flex flex-col border-r border-white/10 bg-[#0a0a0d] overflow-y-auto ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-5 space-y-6">
            {/* 1. CARD DE CONEXÃO COM GOOGLE MAPS */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <MapPin className="h-4 w-4" />
                  <span>1. Link do Google Maps</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">Extração Automática</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Cole a URL do Google Maps para extrair nome, horários, endereço, avaliação e fotos reais.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookupMaps()}
                  placeholder="Ex: https://maps.app.goo.gl/... ou Nome"
                  className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleLookupMaps}
                  disabled={isLookingUpMaps}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                >
                  {isLookingUpMaps ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Puxar"}
                </button>
              </div>

              {data.businessName && (
                <div className="rounded-xl border border-white/5 bg-black/40 p-2.5 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{data.businessName}</span>
                    {data.rating && (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        ★ {data.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {data.address && <p className="text-[11px] text-zinc-400 line-clamp-1">{data.address}</p>}
                </div>
              )}
            </div>

            {/* 2. UPLOADER DE FOTOS REAIS */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <ImageIcon className="h-4 w-4" />
                  <span>2. Fotos Reais em Alta Definição</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">{data.gallery.length} fotos</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Anexe fotos reais do estabelecimento, pratos, produtos ou atmosfera.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-xs font-semibold text-zinc-300 hover:border-amber-400/50 hover:bg-white/10 transition-all group"
              >
                <Upload className="h-4 w-4 text-amber-400 transition-transform group-hover:-translate-y-0.5" />
                <span>Clique para selecionar fotos locais</span>
              </button>

              {/* Grid de Miniaturas da Galeria */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {data.gallery.slice(0, 8).map((photo: CinematicGalleryItem, idx: number) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => {
                      setData((prev: CinematicPageData) => ({
                        ...prev,
                        hero: { ...prev.hero, backgroundImage: photo.url },
                      }));
                      toast.success("Foto definida como capa do Hero!");
                    }}
                    title="Clique para definir como capa do Hero"
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

            {/* VÍDEO DE FUNDO CINEMATOGRÁFICO */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>Vídeo de Fundo no Hero (Loop Opcional)</span>
                </label>
                {data.hero.backgroundVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      setData((prev: CinematicPageData) => ({
                        ...prev,
                        hero: { ...prev.hero, backgroundVideo: undefined },
                      }));
                      toast.info("Vídeo de fundo removido. Usando foto de capa.");
                    }}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Remover Vídeo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Cole a URL direta de um vídeo em alta definição (.mp4 ou .webm) ou reel sem áudio para transformar a capa em cinema vivo.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={data.hero.backgroundVideo || ""}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setData((prev: CinematicPageData) => ({
                      ...prev,
                      hero: { ...prev.hero, backgroundVideo: val || undefined },
                    }));
                  }}
                  placeholder="https://exemplo.com/video-ambiente.mp4"
                  className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              {data.hero.backgroundVideo && (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Vídeo ativo na prévia ao vivo
                </p>
              )}
            </div>

            {/* 3. CHAT DE DIREÇÃO DE ARTE (IA GEMINI) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>3. Chat de Direção de Arte (IA)</span>
                </label>
                <span className="text-[10px] text-zinc-400">Gemini 2.5 Flash</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Instrua a IA sobre a atmosfera, narrativa, público ou cardápio desejado.
              </p>

              {/* Chips Rápidos de Inspiração */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "🍷 Intimista & Vinhos", prompt: "Transforme em uma experiência intimista noturna, realçando luzes baixas, alta gastronomia e carta de vinhos nobres." },
                  { label: "☀️ Minimalista Solar", prompt: "Crie uma atmosfera minimalista contemporânea com estética clara, formas puras e textos poéticos sobre bem-estar." },
                  { label: "☕ Cafeteria Sensorial", prompt: "Enfatize cafés especiais colhidos a 1.200m, torra artesanal fresca, métodos filtrados e confeitaria autoral." },
                  { label: "✂️ Ateliê & Alta Costura", prompt: "Destaque alfaiataria sob medida, tecidos nobres, exclusividade de peças e atendimento personalizado com hora marcada." },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleRefineWithAi(chip.prompt)}
                    className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-amber-400/40 hover:text-white transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: 'Mude para um tom mais rústico com madeira e destaque a parrilla argentina com preços'..."
                  className="w-full rounded-xl border border-white/10 bg-black/50 p-3 pr-12 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-hidden resize-none"
                />
                <button
                  type="button"
                  onClick={() => handleRefineWithAi()}
                  disabled={isRefiningAi || !aiPrompt.trim()}
                  className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black transition-transform hover:scale-105 disabled:opacity-40"
                >
                  {isRefiningAi ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 4. CONTROLES RÁPIDOS DE ESTILO & PALETA */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Palette className="h-4 w-4" />
                <span>4. Paleta de Luxo & Tipografia</span>
              </label>

              {/* Seletor de Paleta */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Paleta de Cores:</span>
                <div className="grid grid-cols-5 gap-2">
                  {LUXURY_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() =>
                        setData((prev: CinematicPageData) => ({
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

              {/* Seletor de Tipografia */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Tipografia dos Títulos:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "serif", label: "Editorial", font: "font-serif" },
                    { id: "sans", label: "Moderna", font: "font-sans" },
                    { id: "display", label: "Marcante", font: "font-display" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setData((prev: CinematicPageData) => ({
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
                    Profundidade 3D suave acelerada por hardware ao rolar a página.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={data.theme.parallaxEnabled}
                  onChange={(e) =>
                    setData((prev: CinematicPageData) => ({
                      ...prev,
                      theme: { ...prev.theme, parallaxEnabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 text-amber-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Botão de Salvar no Rodapé do Painel Mobile */}
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
        </aside>

        {/* PAINEL DIREITO: LIVE PREVIEW 100% IMERSIVO */}
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

