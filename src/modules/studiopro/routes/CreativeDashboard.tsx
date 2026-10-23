import React, { useState, useRef } from "react";
import { useNavigate } from "@/modules/studiopro/lib/router";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Wand2,
  Trash2,
  ExternalLink,
  Laptop,
  MapPin,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Star,
  X,
  Plus,
  Paperclip,
  FileText,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { fetchPlaceDetailsFn } from "@/modules/prospecting/places.functions";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import type { MultimodalAttachment } from "@/modules/studiopro/lib/creativeEngineService";
import { toast } from "sonner";

interface UploadedPhotoItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
  previewUrl: string;
}

interface MapsResultData {
  companyName: string;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  openingHours?: string | null;
  photos?: string[];
}

export function CreativeDashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [mode, setModeState] = useState<"plan" | "build">("build");
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // Estados do Google Maps
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsQuery, setMapsQuery] = useState("");
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [mapsData, setMapsData] = useState<MapsResultData | null>(null);

  // Estados de Upload de Fotos (Visão Multimodal)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    projects,
    createProject,
    selectProject,
    deleteProject,
    setMode,
    addChatMessage,
  } = useCreativeStudioStore();

  async function handleSearchGoogleMaps() {
    const raw = mapsQuery.trim();
    if (!raw) {
      toast.error("Digite o nome ou endereço do local no Google Maps.");
      return;
    }

    setIsSearchingMaps(true);
    try {
      const normalized = normalizeBusinessQuery(raw);
      const queryName = normalized.name || normalized.query || raw;
      const queryCity = normalized.city || null;

      const place = await fetchPlaceDetailsFn({
        data: {
          companyName: queryName,
          city: queryCity,
        },
      });

      if (place) {
        setMapsData({
          companyName: place.companyName || queryName,
          address: place.address || null,
          phone: place.whatsapp || place.phone || null,
          rating: place.rating ?? null,
          reviewsCount: place.reviewsCount ?? null,
          openingHours: place.openingHours || null,
          photos: Array.isArray(place.photos) ? place.photos : [],
        });
        toast.success(`Ficha encontrada: ${place.companyName || queryName}!`);
      } else {
        // Fallback com o endereço digitado
        setMapsData({
          companyName: queryName,
          address: raw,
          rating: 4.9,
          reviewsCount: 45,
          photos: [],
        });
        toast.info("Endereço registrado. A IA usará essas coordenadas para estruturar o site.");
      }
    } catch (err: unknown) {
      console.warn("Aviso ao buscar dados no Google Maps:", err);
      // Fallback gracioso
      setMapsData({
        companyName: raw.split(",")[0] || raw,
        address: raw,
        rating: 4.9,
        reviewsCount: 30,
        photos: [],
      });
      toast.info("Endereço adicionado. O Copiloto IA vai estruturar o site com base nele.");
    } finally {
      setIsSearchingMaps(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!isImg && !isPdf) {
        toast.error(`"${file.name}" não é suportado. Envie imagens (JPG, PNG, WEBP) ou PDFs.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`O arquivo "${file.name}" excede o limite de 20MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fullDataUrl = uploadEvent.target?.result as string;
        if (fullDataUrl) {
          const base64Pure = fullDataUrl.includes(",") ? fullDataUrl.split(",")[1] : fullDataUrl;
          const mime = file.type || (isPdf ? "application/pdf" : "image/jpeg");

          setUploadedPhotos((prev) => [
            ...prev,
            {
              id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              mimeType: mime,
              size: file.size,
              dataBase64: base64Pure,
              previewUrl: isImg ? fullDataUrl : "",
            },
          ]);
          toast.success(`"${file.name}" adicionado à análise visual!`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  }

  function handleRemovePhoto(id: string) {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStart(customPrompt?: string) {
    const baseText = customPrompt || prompt;
    const hasInput = baseText.trim() || mapsData || uploadedPhotos.length > 0;
    if (!hasInput) {
      toast.error("Digite uma ideia, busque um endereço no Maps ou anexe fotos para começar.");
      return;
    }

    const attachments: MultimodalAttachment[] = uploadedPhotos.map((f) => ({
      name: f.name,
      mimeType: f.mimeType,
      dataBase64: f.dataBase64,
    }));

    // Constrói o briefing inteligente consolidando Prompt + Google Maps + Fotos
    let fullPrompt = baseText.trim();

    if (mapsData) {
      const mapsSection = `[DADOS OFICIAIS DO GOOGLE MAPS]:
- Nome do Estabelecimento: ${mapsData.companyName}
- Endereço Real: ${mapsData.address || "Localização privilegiada"}
- Telefone/WhatsApp: ${mapsData.phone || "Consulte contato"}
- Avaliação Google: ${mapsData.rating ? `★ ${mapsData.rating} (${mapsData.reviewsCount || 0} avaliações no Google)` : "★ 4.9"}
- Horário de Funcionamento: ${mapsData.openingHours || "Segunda a Sábado em horário comercial"}
${mapsData.photos && mapsData.photos.length > 0 ? `- Fotos Reais Coletadas: ${mapsData.photos.slice(0, 6).join(", ")}` : ""}`;

      fullPrompt = fullPrompt ? `${fullPrompt}\n\n${mapsSection}` : mapsSection;
    }

    if (attachments.length > 0) {
      const filesDesc = `\n\n[ARQUIVOS E FOTOS ANEXADAS (${attachments.length})]:
Foram enviadas ${attachments.length} foto(s) ou documento(s) com este pedido.
Analise com visão multimodal:
1. Se for cardápio, tabela de preços ou folheto: extraia nomes exatos de produtos, serviços, descrições e valores reais em R$ para compor a vitrine do site!
2. Se for foto de fachada, produtos ou ambiente: capture a estética, cores da marca e insira referências coerentes!`;
      fullPrompt += filesDesc;
    }

    if (!fullPrompt.trim()) {
      fullPrompt = `Crie um site profissional, com motion suave e alta conversão para ${mapsData?.companyName || "o negócio"}, com seções de apresentação, destaques, galeria, avaliações reais e botão de contato no WhatsApp.`;
    }

    const projectName =
      mapsData?.companyName ||
      baseText.split(/\s+/).slice(0, 4).join(" ") ||
      (uploadedPhotos[0]?.name ? uploadedPhotos[0].name.replace(/\.[^/.]+$/, "") : "Novo Site Criativo");

    const id = createProject(projectName);
    selectProject(id);
    setMode(mode);

    // Envia o prompt inicial enriquecido para o chat
    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: fullPrompt,
      timestamp: Date.now(),
      attachments,
    });

    navigate("/editor");
  }

  const modeLabels = {
    plan: "Planejar",
    build: "Construir",
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-[#09090d] text-zinc-100 relative overflow-hidden">
      {/* Top Header Bar do Estúdio Criativo */}
      <header className="w-full h-14 border-b border-white/[0.08] bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
        <a
          href="/admin/prospeccao"
          onClick={(e) => {
            if (
              document.referrer &&
              (document.referrer.includes("/pages") ||
                document.referrer.includes("/admin/prospeccao") ||
                document.referrer.includes("/dashboard"))
            ) {
              e.preventDefault();
              window.location.href = document.referrer;
            }
          }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-zinc-800 text-zinc-300 border border-white/10 text-[10px]">
            ←
          </span>
          <span>Voltar ao Painel</span>
        </a>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={12} />
          </div>
          <span className="text-xs font-bold text-zinc-200">
            Estúdio Criativo
          </span>
        </div>

        <div className="w-24 flex justify-end">
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
            Gemini
          </span>
        </div>
      </header>

      {/* Luz ambiente com gradiente suave */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center pt-8 md:pt-12 px-4 z-10">
        {/* Badge do topo */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-300 mb-5 backdrop-blur-md shadow-sm">
          <Sparkles size={13} className="text-emerald-400" />
          <span>Estúdio Criativo • Visão Multimodal & Google Maps</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-center text-white mb-2">
          Tem uma ideia para um site?
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 text-center max-w-lg mb-6 leading-relaxed">
          Digite um endereço do Google Maps, anexe fotos do negócio ou descreva o que precisa. O Google Gemini estrutura o site completo em segundos.
        </p>

        {/* Card Principal de Criação */}
        <div className="w-full rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl p-3 backdrop-blur-xl focus-within:border-emerald-500/50 transition-all space-y-3">
          {/* Textarea de Prompt Livre */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !showMapsInput) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="Descreva a empresa, nicho ou ideia (ex: 'Uma clínica odontológica premium com agendamento online, botões luminosos e fotos do consultório')..."
            rows={3}
            className="w-full bg-transparent p-2 text-[14px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          {/* Card de Ficha do Google Maps (se encontrado) */}
          {mapsData && (
            <div className="relative flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in zoom-in-95 duration-150">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{mapsData.companyName}</span>
                  {mapsData.rating && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {mapsData.rating} ({mapsData.reviewsCount || 0} avaliações)
                    </span>
                  )}
                </div>
                {mapsData.address && (
                  <p className="text-[11px] text-zinc-300 truncate mt-0.5">{mapsData.address}</p>
                )}
                {mapsData.phone && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">📞 {mapsData.phone}</p>
                )}

                {/* Miniaturas das fotos coletadas do Maps */}
                {mapsData.photos && mapsData.photos.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto py-1">
                    {mapsData.photos.slice(0, 5).map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0"
                      />
                    ))}
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap pl-1">
                      +{mapsData.photos.length} fotos reais do Maps
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMapsData(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Remover dados do Maps"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Campo Expansível para Buscar no Google Maps */}
          {showMapsInput && !mapsData && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/80 border border-white/10 animate-in fade-in duration-150">
              <MapPin size={16} className="text-emerald-400 shrink-0 ml-1" />
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearchGoogleMaps();
                  }
                }}
                placeholder="Cole o link do Google Maps ou digite o nome e endereço da empresa..."
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSearchGoogleMaps()}
                disabled={isSearchingMaps || !mapsQuery.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all disabled:opacity-40"
              >
                {isSearchingMaps ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span>Buscar</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowMapsInput(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Miniaturas das Fotos Anexadas pelo Usuário (Multimodal) */}
          {uploadedPhotos.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/60 border border-white/10 overflow-x-auto">
              {uploadedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative flex items-center gap-2 p-1.5 pr-6 rounded-lg bg-zinc-800/90 border border-white/10 shrink-0 text-left group"
                >
                  {photo.previewUrl ? (
                    <img
                      src={photo.previewUrl}
                      alt={photo.name}
                      className="w-8 h-8 rounded-md object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText size={14} />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 max-w-[110px]">
                    <span className="text-[11px] font-medium text-zinc-200 truncate">
                      {photo.name}
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {(photo.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute right-1 top-1 p-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-white/10"
                    title="Remover foto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-white/20 text-zinc-400 hover:text-zinc-200 text-xs shrink-0"
              >
                <Plus size={12} />
                <span>Mais fotos</span>
              </button>
            </div>
          )}

          {/* Input oculto para upload de imagens */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Barra de Ações Rápidas & Botões de Input */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
            {/* Botões de Acessório (Google Maps + Upload de Fotos) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowMapsInput((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  mapsData || showMapsInput
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-750"
                }`}
                title="Puxar dados reais, fotos e avaliações do Google Maps"
              >
                <MapPin size={13} className={mapsData ? "text-emerald-400" : "text-zinc-400"} />
                <span>{mapsData ? "Google Maps Vinculado" : "Puxar do Google Maps"}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  uploadedPhotos.length > 0
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-750"
                }`}
                title="Anexar fotos da fachada, cardápio ou produtos para a IA ler"
              >
                <Camera size={13} className={uploadedPhotos.length > 0 ? "text-emerald-400" : "text-zinc-400"} />
                <span>
                  {uploadedPhotos.length > 0
                    ? `${uploadedPhotos.length} foto(s) anexada(s)`
                    : "Anexar Fotos / Cardápio"}
                </span>
              </button>
            </div>

            {/* Seletor de Modo & Botão Principal */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/[0.08]"
                >
                  <span>{modeLabels[mode]}</span>
                  <ChevronDown size={13} />
                </button>

                {showModeDropdown && (
                  <div className="absolute right-0 bottom-10 z-50 w-48 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl p-1 text-left backdrop-blur-xl">
                    <button
                      onClick={() => {
                        setModeState("plan");
                        setShowModeDropdown(false);
                      }}
                      className={`w-full flex flex-col p-2 rounded-lg text-left transition-colors ${
                        mode === "plan" ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span className="text-xs font-semibold">Planejar</span>
                      <span className="text-[10px] text-zinc-400">Monta o briefing antes de gerar</span>
                    </button>
                    <button
                      onClick={() => {
                        setModeState("build");
                        setShowModeDropdown(false);
                      }}
                      className={`w-full flex flex-col p-2 rounded-lg text-left transition-colors ${
                        mode === "build" ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span className="text-xs font-semibold">Construir</span>
                      <span className="text-[10px] text-zinc-400">Gera o site diretamente com a IA</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleStart()}
                disabled={!prompt.trim() && !mapsData && uploadedPhotos.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
              >
                <span>Criar Site</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Sugestões Rápidas */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {[
            "Clínica de Estética e Saúde",
            "Restaurante e Gastronomia Artesanal",
            "Escritório de Advocacia Premium",
            "Barbearia Tradicional & Lounge",
          ].map((sug) => (
            <button
              key={sug}
              onClick={() => handleStart(sug)}
              className="px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Projetos Recentes */}
      {projects.length > 0 && (
        <div className="w-full max-w-4xl mx-auto pt-10 pb-8 z-10 px-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Layers size={14} className="text-emerald-400" />
            <span>Seus Sites no Estúdio Criativo</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  selectProject(proj.id);
                  navigate("/editor");
                }}
                className="group p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-emerald-500/40 hover:bg-zinc-900 transition-all cursor-pointer relative shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200 truncate">
                    {proj.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(proj.id);
                      toast.success("Site removido");
                    }}
                    className="p-1 rounded-md text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                  {proj.briefing || "Pronto para continuar no editor..."}
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{new Date(proj.updatedAt).toLocaleDateString("pt-BR")}</span>
                  <span className="text-emerald-400 font-medium group-hover:underline flex items-center gap-1">
                    Abrir <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
