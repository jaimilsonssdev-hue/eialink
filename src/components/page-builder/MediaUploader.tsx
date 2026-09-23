import { Check, ImagePlus, LinkIcon, Loader2, Sparkles, Trash2, Wand2, Palette, Crop } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageService } from "@/modules/page/services/PageService";
import { detectNicheKey, getGalleryForNiche, type CuratedPhoto } from "@/modules/prospecting/nichePresets";
import { generateSvgCover, generateSvgAvatar } from "@/lib/HtmlGraphicGenerator";
import { generateAiImage, MAX_AI_IMAGES_PER_PAGE } from "@/modules/media/services/AiImageService";
import { ImageCropModal } from "./ImageCropModal";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const NICHE_GALLERY_LABELS: Record<string, string> = {
  loja: "Lojas & E-commerce",
  delivery: "Delivery & Lanches",
  restaurante: "Restaurantes & Gastronomia",
  sorveteria: "Sorveteria, Açaí & Gelateria",
  bebidas: "Adega, Bebidas & Distribuidora",
  barbearia: "Barbearia & Barber Shop",
  beleza: "Salão de Beleza & Estética",
  oficina: "Oficina Mecânica & Auto",
  clinica: "Saúde & Clínica Médica",
  psicologia: "Terapeutas & Psicólogos",
  petshop: "Pet Shop & Casa de Ração",
  advocacia: "Advogado & Jurídico",
  odontologia: "Dentista & Odontologia",
  construcao: "Construção Civil & Reformas",
  imobiliaria: "Imobiliária & Corretores",
  seguros: "Corretora de Seguros",
  autonomo: "Profissional Autônomo & Serviços",
  pessoal: "Página Pessoal & Portfólio",
  fitness: "Fitness & Personal Trainer",
  nutricao: "Nutricionista & Dietas",
  costura: "Costureira & Ateliê de Moda",
  tecnologia: "Tecnologia & Informática",
  geral: "Empresas & Negócios Gerais",
};

export function MediaUploader({
  label,
  value,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  variant = "square",
  templateId,
  niche,
  companyName = "Sua Empresa",
  aiUsageCount = 0,
  onAiUsageIncrement,
  onChange,
}: {
  label: string;
  value?: string | null;
  maxSizeBytes?: number;
  variant?: "square" | "cover" | "avatar";
  templateId?: string | null;
  niche?: string | null;
  companyName?: string;
  aiUsageCount?: number;
  onAiUsageIncrement?: () => void;
  onChange(url: string | null): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "generating_ai" | "success" | "error">("idle");
  const [error, setError] = useState<string>();
  const [customUrl, setCustomUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const limitMb = Math.round(maxSizeBytes / 1024 / 1024);

  const isCover = variant === "cover";
  const aspectRatio = isCover ? 16 / 9 : 1;
  const cropShape = variant === "avatar" ? "round" : "rect";

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);

  const initialKey = detectNicheKey(niche || templateId, null);
  const [activeGalleryNiche, setActiveGalleryNiche] = useState<string>(initialKey);

  useEffect(() => {
    if (niche || templateId) {
      setActiveGalleryNiche(detectNicheKey(niche || templateId, null));
    }
  }, [niche, templateId]);

  const gallery = getGalleryForNiche(activeGalleryNiche);
  const curatedPhotos = isCover ? gallery.covers : gallery.avatars;
  const remainingAiQuota = Math.max(0, MAX_AI_IMAGES_PER_PAGE - aiUsageCount);

  async function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error("Formato não suportado. Envie JPG, PNG, WEBP ou GIF.");
    }
    if (file.size > maxSizeBytes) {
      throw new Error(`A imagem deve ter no máximo ${limitMb} MB.`);
    }
  }

  async function handleFileSelected(file?: File) {
    if (!file) return;
    try {
      await validate(file);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Arquivo inválido");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSourceUrl(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleCropSave(croppedBlob: Blob) {
    setStatus("uploading");
    setError(undefined);
    try {
      const fileToUpload = new File([croppedBlob], `crop_${Date.now()}.webp`, {
        type: "image/webp",
      });
      const publicUrl = await PageService.uploadAsset(fileToUpload);
      onChange(publicUrl);
      setStatus("success");
      toast.success("Foto atualizada e redimensionada com sucesso!");
    } catch (cause) {
      setStatus("error");
      const msg = cause instanceof Error ? cause.message : "Falha no upload da imagem enquadrada";
      setError(msg);
      toast.error(msg);
      throw cause;
    }
  }

  function handleOpenCropForCurrent() {
    if (!value) return;
    setCropSourceUrl(value);
    setIsCropOpen(true);
  }

  function handleApplyCustomUrl() {
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    setCustomUrl("");
    setShowUrlInput(false);
  }

  function handleGenerateHtmlSvg() {
    if (isCover) {
      const svgUrl = generateSvgCover(activeGalleryNiche, companyName);
      onChange(svgUrl);
    } else {
      const svgUrl = generateSvgAvatar(companyName, activeGalleryNiche);
      onChange(svgUrl);
    }
  }

  async function handleGenerateAi() {
    if (remainingAiQuota <= 0) {
      setError(`Limite de ${MAX_AI_IMAGES_PER_PAGE} fotos por IA atingido para esta página.`);
      return;
    }

    setStatus("generating_ai");
    setError(undefined);

    try {
      const result = await generateAiImage({
        niche: activeGalleryNiche,
        companyName,
        currentUsageCount: aiUsageCount,
        type: isCover ? "cover" : "avatar",
      });

      onChange(result.url);
      onAiUsageIncrement?.();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Falha ao gerar imagem com IA");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span>Remover</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          <div
            className={
              isCover
                ? "relative h-20 w-32 overflow-hidden rounded-xl border border-border bg-muted/20 shrink-0 shadow-xs"
                : "relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted/20 shrink-0 shadow-xs"
            }
          >
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback para SVG se quebrar
                e.currentTarget.src = isCover
                  ? generateSvgCover(activeGalleryNiche, companyName)
                  : generateSvgAvatar(companyName, activeGalleryNiche);
              }}
            />
          </div>
        ) : (
          <div
            className={
              isCover
                ? "grid h-20 w-32 place-items-center rounded-xl border border-dashed border-border bg-surface-elevated/40 text-muted-foreground shrink-0"
                : "grid h-16 w-16 place-items-center rounded-xl border border-dashed border-border bg-surface-elevated/40 text-muted-foreground shrink-0"
            }
          >
            <ImagePlus className="h-5 w-5" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. Subir do celular / PC */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading" || status === "generating_ai"}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-all shadow-2xs"
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--primary)]" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                  <span>Subir Foto</span>
                </>
              )}
            </button>

            {/* 1.1 Redimensionar / Enquadrar foto existente */}
            {value && (
              <button
                type="button"
                onClick={handleOpenCropForCurrent}
                disabled={status === "uploading" || status === "generating_ai"}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-2xs"
                title="Ajustar zoom, proporções, rotação e redimensionamento da foto"
              >
                <Crop className="h-3.5 w-3.5" />
                <span>Redimensionar / Enquadrar</span>
              </button>
            )}

            {/* 2. Gerar Gráfico em HTML/SVG (Zero Custo & Nítido) */}
            <button
              type="button"
              onClick={handleGenerateHtmlSvg}
              title="Gera visual limpo e profissional sem modelos ou fotos falsas"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--primary)]/20 transition-all shadow-2xs"
            >
              <Palette className="h-3.5 w-3.5 text-[color:var(--primary)]" />
              <span>{isCover ? "Design em HTML/SVG" : "Monograma Oficial"}</span>
            </button>

            {/* 3. Gerar com IA (Limite Estrito de 3) */}
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={status === "generating_ai" || status === "uploading" || remainingAiQuota <= 0}
              title={
                remainingAiQuota <= 0
                  ? "Limite de 3 fotos por IA atingido para esta página"
                  : `Gera foto realista via IA contextualizada no nicho (Restam ${remainingAiQuota} de ${MAX_AI_IMAGES_PER_PAGE})`
              }
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
                remainingAiQuota > 0
                  ? "border-purple-500/30 bg-purple-500/10 text-foreground hover:bg-purple-500/20"
                  : "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60"
              }`}
            >
              {status === "generating_ai" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span>Gerando com IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Gerar IA</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                    {remainingAiQuota}/3
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-[color:var(--primary)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              <span>{showUrlInput ? "Ocultar link" : "Colar link de imagem"}</span>
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => {
            void handleFileSelected(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {showUrlInput && (
        <div className="flex gap-2 animate-fade-in">
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Cole o link da foto (https://...)"
            className="input-field text-xs py-1.5 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyCustomUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyCustomUrl}
            disabled={!customUrl.trim()}
            className="btn-primary text-xs px-3 py-1.5 shrink-0 rounded-xl"
          >
            Aplicar
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-400 font-medium">
          {error}
        </p>
      )}

      {/* Galeria Curada de Alta Resolução por Nicho */}
      {curatedPhotos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Fotos Curadas por Nicho (1 Clique):</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Nicho:</span>
              <select
                value={activeGalleryNiche}
                onChange={(e) => setActiveGalleryNiche(e.target.value)}
                className="text-[11px] bg-surface-elevated border border-border rounded-lg px-2 py-1 text-foreground"
              >
                {Object.entries(NICHE_GALLERY_LABELS).map(([k, name]) => (
                  <option key={k} value={k}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {curatedPhotos.map((photo) => {
              const isSelected = value === photo.url;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onChange(photo.url)}
                  className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                    isCover ? "h-20" : "h-16"
                  } ${
                    isSelected
                      ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/50"
                      : "border-border/60 hover:border-border hover:opacity-90"
                  }`}
                  title={photo.label}
                >
                  <img src={photo.url} alt={photo.label} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                    <span className="text-[10px] font-medium text-white line-clamp-1 leading-tight">
                      {photo.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[color:var(--primary)] text-white flex items-center justify-center shadow-xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ImageCropModal
        open={isCropOpen}
        onOpenChange={setIsCropOpen}
        imageUrl={cropSourceUrl}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        title={`Redimensionar e Enquadrar: ${label}`}
        onCropComplete={handleCropSave}
      />
    </div>
  );
}
