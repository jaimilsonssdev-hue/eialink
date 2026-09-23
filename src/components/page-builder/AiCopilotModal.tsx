import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Palette,
  Layers,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Film,
  FileUp,
  Globe2,
} from "lucide-react";
import {
  generateCopilotSiteFn,
  fetchBusinessFromUrlFn,
  type AiCopilotResult,
} from "@/modules/ai/copilot.functions";
import { PageService } from "@/modules/page/services/PageService";
import { extractAssetsFromPdf } from "@/lib/pdf-extractor";
import { toast } from "sonner";

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: {
    displayName: string;
    niche: string;
    city?: string;
  };
  onApply: (result: AiCopilotResult) => void;
}

interface UploadedMediaItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  isPdf: boolean;
  publicUrl?: string;
  base64?: string;
  role?: "logo" | "cover" | "product" | "general";
  tag?: string;
}

const SAMPLE_BRIEFINGS = [
  {
    label: "Clínica & Odonto",
    text: "Clínica Odontológica Oral Arte em Salvador. Especializada em implantes dentários, facetas de resina e harmonização facial. Queremos passar autoridade médica com atendimento humanizado. Cores azul royal escuro e detalhes em dourado elegante.",
  },
  {
    label: "Hamburgueria & Lanches",
    text: "Hamburgueria artesanal Brasa & Fogo. Smash burgers na brasa, bacon crocante artesanal, batatas rústicas e milkshakes cremosos. Foco em entrega ultrarrápida quentinha no bairro e ingredientes 100% frescos. Cores preto carvão e laranja fogo.",
  },
  {
    label: "Estética & Beleza",
    text: "Studio Glow Estética Avançada. Procedimentos de limpeza de pele profunda, drenagem linfática, microagulhamento e unhas em fibra. Espaço aconchegante para bem-estar e autoestima feminina. Tons de vinho bordô, rosa champagne e iluminação quente.",
  },
  {
    label: "Advocacia & Jurídico",
    text: "Escritório Toledo & Associados Advocacia. Assessoria jurídica empresarial, direito do trabalho e planejamento tributário seguro. Atendimento transparente, ético e ágil sem termos complicados. Cores azul marinho profundo e ouro nobre.",
  },
  {
    label: "Marketing Digital",
    text: "Agência Alavanca Digital. Gestão de tráfego pago para negócios locais, criação de páginas de alta conversão e funis de vendas no WhatsApp. Já geramos mais de R$ 2 milhões em faturamento para clientes. Tons de grafite escuro e ciano neon.",
  },
];

const LOCAL_STORAGE_KEY = "eialink_gemini_override_key";
const MAX_FILES = 6;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona imagens no navegador para no máximo 1024px e converte para JPEG com qualidade 0.82.
 * Reduz arquivos pesados de câmera (8MB-15MB) para apenas ~60-80KB com máxima nitidez visual.
 */
async function getOptimizedBase64(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return fileToBase64(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1024;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fileToBase64(file).then(resolve);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      fileToBase64(file).then(resolve);
    };
    img.src = url;
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AiCopilotModal({ isOpen, onClose, currentContext, onApply }: AiCopilotModalProps) {
  const [briefing, setBriefing] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  async function handleImportFromUrl() {
    if (!importUrl.trim()) return;
    setIsImportingUrl(true);
    setError(null);
    try {
      const res = await fetchBusinessFromUrlFn({
        data: { url: importUrl.trim() },
      });

      if (
        res.name &&
        (!currentContext.displayName || currentContext.displayName === "Empresa Local")
      ) {
        currentContext.displayName = res.name;
      }

      if (res.formattedBriefing) {
        setBriefing((prev) => {
          const header = `\n\n🔗 ${res.formattedBriefing}\n`;
          if (prev.includes(res.formattedBriefing)) return prev;
          return prev ? `${prev}${header}` : res.formattedBriefing;
        });
      }

      // Adiciona imagens importadas do Google Drive diretamente à lista de mídias
      if (res.importedImages && res.importedImages.length > 0) {
        const newMedia: UploadedMediaItem[] = [];
        for (const img of res.importedImages) {
          try {
            const byteString = atob(img.base64.split(",")[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: img.mimeType });
            const file = new File([blob], img.name, { type: img.mimeType });
            const isPdf = img.mimeType === "application/pdf";

            newMedia.push({
              id: crypto.randomUUID(),
              file,
              name: img.name,
              size: file.size,
              type: img.mimeType,
              previewUrl: isPdf ? "" : img.publicUrl || URL.createObjectURL(file),
              isPdf,
              role: isPdf
                ? "general"
                : mediaItems.length + newMedia.length === 0
                  ? "cover"
                  : "general",
              tag: isPdf ? "📄 PDF Google Drive" : "📷 Google Drive",
            });
          } catch (blobErr) {
            console.warn("Aviso ao processar foto importada:", blobErr);
          }
        }
        if (newMedia.length > 0) {
          setMediaItems((prev) => [...prev, ...newMedia]);
        }
      }

      toast.success(
        res.source === "google_drive"
          ? `✨ ${res.importedImages?.length || 0} foto(s) do Google Drive importada(s) com sucesso!`
          : res.source === "instagram"
            ? "✨ Perfil do Instagram extraído com sucesso!"
            : res.source === "google_maps"
              ? "⭐ Dados do Google Maps (nota, endereço e avaliações) extraídos com sucesso!"
              : "✨ Dados da página extraídos com sucesso!",
      );
    } catch (err: any) {
      console.error("Erro ao importar URL:", err);
      toast.error(err?.message || "Não foi possível extrair dados automaticamente deste link.");
    } finally {
      setIsImportingUrl(false);
    }
  }
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [overrideKey, setOverrideKey] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AiCopilotResult | null>(null);

  useEffect(() => {
    if (overrideKey) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, overrideKey.trim());
      } catch {
        // ignore
      }
    }
  }, [overrideKey]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setLoadingStep("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  function handleAddFiles(filesList: FileList | File[]) {
    setError(null);
    const incoming = Array.from(filesList);

    if (mediaItems.length + incoming.length > MAX_FILES) {
      setError(`Você pode anexar no máximo ${MAX_FILES} arquivos por vez (fotos ou PDFs).`);
      return;
    }

    const acceptedItems: UploadedMediaItem[] = [];

    for (const file of incoming) {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!isImg && !isPdf) {
        setError(
          `O arquivo "${file.name}" possui formato não suportado. Envie imagens (JPG, PNG, WEBP) ou PDFs.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`O arquivo "${file.name}" excede o limite máximo de 15MB.`);
        continue;
      }

      const previewUrl = isImg ? URL.createObjectURL(file) : "";

      acceptedItems.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: isPdf ? "application/pdf" : file.type,
        previewUrl,
        isPdf,
        role: isPdf ? "general" : mediaItems.length === 0 ? "cover" : "general",
      });

      if (isPdf) {
        // Extrai imagens nativas e catálogo do PDF automaticamente em alta resolução
        setLoadingStep("Extraindo fotos reais e catálogo do PDF...");
        extractAssetsFromPdf(file)
          .then((assets) => {
            const extractedItems: UploadedMediaItem[] = [];

            // 1. Caso haja fotos nativas isoladas extraídas (XObjects)
            if (assets.embeddedImages && assets.embeddedImages.length > 0) {
              const hasLogo = assets.embeddedImages.some((img) => img.isLikelyLogo);
              assets.embeddedImages.forEach((img, idx) => {
                const isLogo =
                  img.isLikelyLogo || (!hasLogo && idx === 0 && assets.embeddedImages.length > 1);
                const isCover = !isLogo && idx === (isLogo ? 1 : 0);

                extractedItems.push({
                  id: crypto.randomUUID(),
                  file: img.file,
                  name: img.name,
                  size: img.file.size,
                  type: "image/png",
                  previewUrl: img.previewUrl,
                  isPdf: false,
                  role: isLogo ? "logo" : isCover ? "cover" : "product",
                  tag: isLogo
                    ? "🏷️ Logotipo (PDF)"
                    : isCover
                      ? "👑 Capa Hero (PDF)"
                      : `🍽️ Item #${idx + 1} (${img.width}x${img.height})`,
                });
              });
            } else {
              // 2. Fallback caso seja um PDF escaneado/achatado sem objetos vetoriais isolados
              if (assets.logoFile) {
                extractedItems.push({
                  id: crypto.randomUUID(),
                  file: assets.logoFile,
                  name: `Logo - ${file.name.replace(/\.[^.]+$/, "")}`,
                  size: assets.logoFile.size,
                  type: "image/png",
                  previewUrl: assets.logoPreview || "",
                  isPdf: false,
                  role: "logo",
                  tag: "🏷️ Logotipo do PDF",
                });
              }
              if (assets.coverFile) {
                extractedItems.push({
                  id: crypto.randomUUID(),
                  file: assets.coverFile,
                  name: `Capa - ${file.name.replace(/\.[^.]+$/, "")}`,
                  size: assets.coverFile.size,
                  type: "image/png",
                  previewUrl: assets.coverPreview || "",
                  isPdf: false,
                  role: "cover",
                  tag: "🌄 Capa do PDF",
                });
              }
              if (assets.pageImages && assets.pageImages.length > 1) {
                for (const pg of assets.pageImages.slice(1)) {
                  extractedItems.push({
                    id: crypto.randomUUID(),
                    file: pg.file,
                    name: `Pág ${pg.pageNumber} - ${file.name.replace(/\.[^.]+$/, "")}`,
                    size: pg.file.size,
                    type: "image/png",
                    previewUrl: pg.previewUrl,
                    isPdf: false,
                    role: "product",
                    tag: `🍽️ Pratos / Pág ${pg.pageNumber}`,
                  });
                }
              }
            }

            if (extractedItems.length > 0) {
              setMediaItems((curr) => [...curr, ...extractedItems]);
            }

            if (assets.extractedText && assets.extractedText.trim().length > 0) {
              setBriefing((prev) => {
                const header = `\n\n📄 [DADOS EXTRAÍDOS DO DOCUMENTO / CARDÁPIO / TABELA: ${file.name}]:\n`;
                if (prev.includes(file.name)) return prev;
                return prev
                  ? `${prev}${header}${assets.extractedText}`
                  : `${header}${assets.extractedText}`;
              });
              toast.success(
                assets.embeddedImages.length > 0
                  ? `✨ ${assets.embeddedImages.length} fotos nativas e catálogo do PDF "${file.name}" extraídos com sucesso!`
                  : `✨ Logotipo, fotos e catálogo completo do PDF "${file.name}" extraídos com sucesso!`,
              );
            } else if (extractedItems.length > 0) {
              toast.success(
                `✨ ${extractedItems.length} foto(s) e imagem(ns) do PDF "${file.name}" preparadas!`,
              );
            }
          })
          .catch((err) => {
            console.warn("Aviso ao extrair dados do PDF:", err);
          })
          .finally(() => {
            setLoadingStep("");
          });
      }
    }

    setMediaItems((curr) => [...curr, ...acceptedItems]);
  }

  function handleRemoveMediaItem(id: string) {
    setMediaItems((curr) => {
      const target = curr.find((item) => item.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore
        }
      }
      return curr.filter((item) => item.id !== id);
    });
  }

  function handleSetRole(id: string, role: "logo" | "cover" | "product" | "general") {
    setMediaItems((curr) =>
      curr.map((item) => {
        if (item.id === id) {
          return { ...item, role };
        }
        if (role === "logo" && item.role === "logo") {
          return { ...item, role: "general" };
        }
        if (role === "cover" && item.role === "cover") {
          return { ...item, role: "general" };
        }
        return item;
      }),
    );
  }

  async function handleGenerate() {
    const hasText = briefing.trim().length >= 3;
    const hasFiles = mediaItems.length > 0;
    const hasVideo = videoUrl.trim().length > 0;

    if (!hasText && !hasFiles && !hasVideo) {
      setError("Por favor, digite um briefing, anexe fotos/PDFs ou informe um link de vídeo.");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setError(null);
    setLoading(true);
    setGeneratedResult(null);

    try {
      // 1. Processa e sobe as imagens para obter URL pública perene se possível
      setLoadingStep("Salvando fotos no armazenamento e preparando arquivos...");
      const preparedFiles: Array<{
        name: string;
        mimeType: string;
        base64: string;
        publicUrl?: string;
        role?: "logo" | "cover" | "product" | "general";
      }> = [];

      for (const item of mediaItems) {
        if (abortController.signal.aborted) return;

        // Se for PDF e os dados de texto/imagens já tiverem sido extraídos localmente para o briefing/mídias,
        // não reenviamos o arquivo binário bruto para evitar estouro de limite de corpo HTTP (413).
        if (item.isPdf) {
          if (item.file.size > 2 * 1024 * 1024 || briefing.includes(item.name)) {
            continue;
          }
        }

        // Gera base64 otimizado (Canvas 1024px JPEG) para envio rápido e leve ao Gemini
        const base64Data = await getOptimizedBase64(item.file);
        let publicUrl = item.publicUrl;

        // Se for imagem e ainda não tem URL pública, faz upload seguro via PageService
        if (!item.isPdf && !publicUrl) {
          try {
            publicUrl = await PageService.uploadAsset(item.file);
          } catch (uploadErr) {
            console.warn(
              `Aviso: falha ao salvar ${item.name} no storage, usando envio direto por base64.`,
              uploadErr,
            );
          }
        }

        preparedFiles.push({
          name: item.name,
          mimeType: item.type.startsWith("image/") ? "image/jpeg" : item.type,
          base64: base64Data,
          publicUrl,
          role: item.role,
        });
      }

      if (abortController.signal.aborted) return;

      // 2. Chama a IA Multimodal
      setLoadingStep("Analisando documentos, fotos e extraindo catálogo com Gemini...");
      const result = await generateCopilotSiteFn({
        data: {
          briefing: briefing.trim(),
          files: preparedFiles,
          videoUrl: videoUrl.trim() || undefined,
          currentContext: {
            displayName: currentContext.displayName,
            niche: currentContext.niche,
            city: currentContext.city,
          },
          overrideApiKey: overrideKey.trim() || undefined,
        },
      });

      if (abortController.signal.aborted) return;
      setGeneratedResult(result);
    } catch (err: any) {
      if (abortController.signal.aborted || err?.name === "AbortError") {
        return;
      }
      console.error("Erro no Copiloto IA Multimodal:", err);
      const msg =
        err?.message ||
        "Ocorreu um erro ao comunicar com a IA do Google AI Studio. Verifique os dados e tente novamente.";
      setError(msg);
      if (
        msg.toLowerCase().includes("chave") ||
        msg.toLowerCase().includes("api key") ||
        msg.toLowerCase().includes("não configurada") ||
        msg.toLowerCase().includes("inválida")
      ) {
        setShowKeyConfig(true);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setLoadingStep("");
    }
  }

  function handleConfirmApply() {
    if (!generatedResult) return;
    onApply(generatedResult);
    onClose();
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-border/80 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-foreground space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header do Copiloto */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Google AI Studio · Gemini • Modo Cinematográfico Premium</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Agente Copiloto IA (Site Cinematográfico)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Peça alterações ou anexe <b>fotos, logotipo, cardápios em PDF ou links (Google Drive, Instagram, Maps)</b>.
            O Agente atua como <b>Diretor de Arte & Designer de Elite</b>: identifica as cores reais da sua marca,
            elimina dados genéricos e monta o site completo em <b>Dark Mode Cinematográfico de luxo</b>.
          </p>
        </div>

        {/* Banner de Segurança Nível Sênior */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3 text-xs text-emerald-300">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-emerald-200">
              Processamento Seguro e Confidencial
            </span>
            <span className="text-emerald-400/90 text-[11px] leading-relaxed block">
              Documentos e chaves são processados de ponta a ponta no servidor seguro. Suas
              credenciais e mídias nunca são expostas publicamente no navegador dos visitantes.
            </span>
          </div>
        </div>

        {/* IMPORTAÇÃO AUTOMÁTICA POR LINK: GOOGLE DRIVE, GOOGLE MAPS OU INSTAGRAM */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-purple-400" />
              <span>Importar por Link (Google Drive, Instagram ou Maps)</span>
            </label>
            <span className="text-[10px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              ⚡ Extração Inteligente
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Cole o link de uma <b>pasta ou foto do Google Drive</b>, perfil do <b>Instagram</b> ou
            do <b>Google Maps</b>. O sistema baixa fotos em alta resolução e extrai dados comerciais
            automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="Ex: drive.google.com/drive/folders/... ou instagram.com/empresa ou link do Maps"
                disabled={isImportingUrl}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImportFromUrl();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleImportFromUrl}
              disabled={isImportingUrl || !importUrl.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              {isImportingUrl ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Extraindo dados...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Puxar Dados</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ÁREA MULTIMODAL: DROPZONE DE FOTOS E PDFS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-purple-400" />
              <span>Fotos & Documentos PDF (Cardápio / Tabela / Fachada)</span>
            </label>
            <span className="text-[11px] text-zinc-500">
              {mediaItems.length}/{MAX_FILES} arquivos anexados
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) {
                handleAddFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? "border-purple-400 bg-purple-950/30 scale-[1.01]"
                : "border-zinc-800 bg-zinc-900/40 hover:border-purple-500/40 hover:bg-zinc-900/70"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleAddFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                Arraste fotos e PDFs aqui, ou{" "}
                <span className="text-purple-400 underline underline-offset-2">
                  clique para escolher
                </span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Fotos do local/pratos (PNG, JPG, WEBP) ou cardápio/tabela em PDF (até 15MB por
                arquivo)
              </p>
            </div>
          </div>

          {/* Grade de Arquivos Selecionados */}
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 flex flex-col gap-2 overflow-hidden text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {item.isPdf ? (
                      <div className="h-11 w-11 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex flex-col items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                        <span className="text-[8px] font-black uppercase">PDF</span>
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700 relative">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-white font-medium truncate text-[11px]" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-zinc-500 text-[10px]">{formatFileSize(item.size)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMediaItem(item.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remover arquivo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Badges e seletor de destinação do arquivo */}
                  {!item.isPdf ? (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 shrink-0 font-medium">
                        Usar como:
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => handleSetRole(item.id, "logo")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors cursor-pointer ${
                            item.role === "logo"
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          🏷️ Logo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRole(item.id, "cover")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors cursor-pointer ${
                            item.role === "cover"
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          🌄 Capa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRole(item.id, "product")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors cursor-pointer ${
                            item.role === "product"
                              ? "bg-emerald-600 text-white font-bold"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          🍽️ Item
                        </button>
                      </div>
                    </div>
                  ) : item.tag ? (
                    <div className="pt-0.5 border-t border-zinc-800/60">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[9px]">
                        {item.tag}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link de Vídeo Opcional */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-purple-400" />
            <span>Vídeo Institucional (Opcional)</span>
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Link do YouTube, Vimeo ou vídeo institucional (ex: https://youtube.com/watch?v=...)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Formulário do Briefing e Chave de API */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Instruções ao Agente / Briefing do Negócio</span>
            </label>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <KeyRound className="h-3 w-3" />
              {showKeyConfig ? "Ocultar Chave" : "Chave Própria Google AI"}
            </button>
          </div>

          {/* Campo opcional de Chave de API */}
          {showKeyConfig && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 space-y-2 animate-fade-in text-xs">
              <label className="text-zinc-300 font-semibold block">
                Chave da API do Google AI Studio (Opcional):
              </label>
              <input
                type="password"
                value={overrideKey}
                onChange={(e) => setOverrideKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-lg border border-zinc-700 bg-black/60 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500">
                A chave é salva apenas no seu navegador localmente e transmitida por canal
                criptografado do servidor.
              </p>
            </div>
          )}

          <textarea
            rows={4}
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="Digite aqui o que você deseja (apenas pedindo): Ex: Monte o site completo com as fotos e dados em anexo, mude a cor principal para azul marinho, adicione os pratos do cardápio e configure botão de WhatsApp..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-y"
          />

          {/* Chips de Exemplo Rápido */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium block">
              Sugestões rápidas de briefing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_BRIEFINGS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBriefing(sample.text);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-purple-500/50 hover:bg-purple-950/30 text-[11px] text-zinc-300 transition-all cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-xs text-red-300 animate-shake">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Prévia do Resultado Gerado pela IA */}
        {generatedResult && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3.5 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Análise Concluída com Sucesso!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block font-semibold">Negócio Real Identificado:</span>
                <b className="text-white block text-sm">{generatedResult.display_name}</b>
                <div className="flex flex-wrap gap-2 text-[10px] text-purple-300">
                  {generatedResult.niche && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/40">
                      Nicho: {generatedResult.niche}
                    </span>
                  )}
                  {generatedResult.city && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700">
                      📍 {generatedResult.city}
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 text-[11px] line-clamp-2">
                  {generatedResult.description}
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block font-semibold">
                  Cor da Marca & Identidade Visual:
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white/40 shadow-md shrink-0"
                    style={{ backgroundColor: generatedResult.custom_theme?.primary }}
                    title="Cor Primária da Marca"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: generatedResult.custom_theme?.background }}
                    title="Fundo Dark Obsidian"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: generatedResult.custom_theme?.card_bg }}
                    title="Superfície Card"
                  />
                  <div className="text-[11px] font-mono text-zinc-300 ml-1">
                    <span className="font-bold text-white">{generatedResult.custom_theme?.primary}</span>
                    <span className="text-zinc-500 text-[10px] block">Tom primário da marca</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mídias Alocadas Inteligente */}
            {(generatedResult.avatar_url ||
              generatedResult.cover_url ||
              generatedResult.video_embed?.enabled) && (
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[10px]">
                  Mídias Alocadas Automaticamente:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {generatedResult.avatar_url && (
                    <div className="flex items-center gap-2">
                      <img
                        src={generatedResult.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
                      />
                      <span className="text-[11px] text-zinc-300">Foto de Perfil/Logo</span>
                    </div>
                  )}
                  {generatedResult.cover_url && (
                    <div className="flex items-center gap-2">
                      <img
                        src={generatedResult.cover_url}
                        alt="Capa"
                        className="w-12 h-8 rounded-md object-cover border border-purple-500/40"
                      />
                      <span className="text-[11px] text-zinc-300">Foto de Capa/Hero</span>
                    </div>
                  )}
                  {generatedResult.video_embed?.enabled && (
                    <div className="flex items-center gap-1.5 text-purple-300 text-[11px]">
                      <Film className="h-4 w-4" />
                      <span>Vídeo Institucional configurado</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Curadoria Visual por IA (Diretor de Arte) */}
            {generatedResult.curated_photos && generatedResult.curated_photos.length > 0 && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>Curadoria Visual de Fotos (Diretor de Arte IA)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {generatedResult.curated_photos.length} fotos avaliadas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {generatedResult.curated_photos.map((item, cIdx) => {
                    const isDiscard = item.role === "discard";
                    const isCover = item.role === "cover";
                    const isLogo = item.role === "logo";
                    const isProduct = item.role === "product";

                    const badgeColor = isCover
                      ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                      : isLogo
                        ? "bg-purple-600/30 text-purple-300 border-purple-500/40"
                        : isProduct
                          ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700";

                    const roleLabel = isCover
                      ? "👑 Capa de Autoridade"
                      : isLogo
                        ? "🏷️ Logotipo Oficial"
                        : isProduct
                          ? "🍽️ Carrossel / Vitrine"
                          : "⚠️ Descartada";

                    return (
                      <div
                        key={cIdx}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                          isDiscard
                            ? "bg-black/40 border-zinc-800/80 opacity-60"
                            : "bg-zinc-900/90 border-zinc-800"
                        }`}
                      >
                        {item.url ? (
                          <img
                            src={item.url}
                            alt={item.name || "Foto"}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-700 bg-zinc-950"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500 text-base">
                            📷
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold ${badgeColor}`}
                            >
                              {roleLabel}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                              <span title="Autoridade" className="text-indigo-400 font-bold">
                                A:{item.scores?.authority || 0}
                              </span>
                              <span
                                title="Qualidade Técnica"
                                className="text-emerald-400 font-bold"
                              >
                                Q:{item.scores?.quality || 0}
                              </span>
                              <span title="Posicionamento" className="text-amber-400 font-bold">
                                P:{item.scores?.positioning || 0}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                            {item.critique}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Serviços e Itens Extraídos */}
            {generatedResult.suggested_services &&
              generatedResult.suggested_services.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[10px]">
                      Catálogo de Serviços / Itens Extraídos (
                      {generatedResult.suggested_services.length}):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {generatedResult.suggested_services.map((svc, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {svc.image_url && (
                            <img
                              src={svc.image_url}
                              alt={svc.name}
                              className="w-7 h-7 rounded object-cover shrink-0 border border-zinc-700"
                            />
                          )}
                          <div className="min-w-0 truncate">
                            <p className="text-white font-medium text-[11px] truncate">
                              {svc.name}
                            </p>
                            <p className="text-zinc-500 text-[10px] truncate">{svc.description}</p>
                          </div>
                        </div>
                        {svc.price ? (
                          <span className="text-emerald-400 font-mono font-bold text-[11px] shrink-0">
                            R$ {svc.price.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {generatedResult.differentials && generatedResult.differentials.length > 0 && (
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                <span className="text-purple-400 font-bold">✓</span>
                <span>
                  {generatedResult.differentials.length} Diferenciais de alta autoridade prontos
                </span>
                <span className="mx-1 text-zinc-700">·</span>
                <span>{generatedResult.testimonials?.length || 0} Depoimentos gerados</span>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {!generatedResult ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{loadingStep || "Processando com Inteligência Artificial..."}</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Organizar e Gerar com IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Montar e Publicar Site Agora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
