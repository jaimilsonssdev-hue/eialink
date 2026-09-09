import { Check, ImagePlus, LinkIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageService } from "@/modules/page/services/PageService";
import { detectNicheKey, getGalleryForNiche, type CuratedPhoto } from "@/modules/prospecting/nichePresets";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const NICHE_GALLERY_LABELS: Record<string, string> = {
  odontologia: "Odontologia & Dentes",
  psicologia: "Psicologia & Terapia",
  clinica: "Clínica & Saúde",
  estetica: "Estética & Beleza",
  salao: "Salão de Cabelo",
  barbearia: "Barbearia",
  advocacia: "Advocacia & Jurídico",
  restaurante: "Gastronomia & Restaurante",
  academia: "Academia & Treino",
  petshop: "Pet Shop & Vet",
  oficina: "Oficina Mecânica & Auto",
  imobiliaria: "Imobiliária & Imóveis",
  arquitetura: "Arquitetura & Interiores",
  contabilidade: "Contabilidade & Finanças",
  tatuagem: "Tatuagem & Piercing",
  otica: "Ótica & Visão",
  geral: "Empresas Gerais",
};

export function MediaUploader({
  label,
  value,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  variant = "square",
  templateId,
  niche,
  onChange,
}: {
  label: string;
  value?: string | null;
  maxSizeBytes?: number;
  variant?: "square" | "cover" | "avatar";
  templateId?: string | null;
  niche?: string | null;
  onChange(url: string | null): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string>();
  const [customUrl, setCustomUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const limitMb = Math.round(maxSizeBytes / 1024 / 1024);

  const isCover = variant === "cover";
  const initialKey = detectNicheKey(niche || templateId, null);
  const [activeGalleryNiche, setActiveGalleryNiche] = useState<string>(initialKey);

  useEffect(() => {
    if (niche || templateId) {
      setActiveGalleryNiche(detectNicheKey(niche || templateId, null));
    }
  }, [niche, templateId]);

  const gallery = getGalleryForNiche(activeGalleryNiche);
  const curatedPhotos = isCover ? gallery.covers : gallery.avatars;

  async function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error("Formato não suportado. Envie JPG, PNG, WEBP ou GIF.");
    }
    if (file.size > maxSizeBytes) {
      throw new Error(`A imagem deve ter no máximo ${limitMb} MB.`);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      await validate(file);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Imagem inválida.");
      return;
    }

    setStatus("uploading");
    setError(undefined);

    try {
      const userId = await PageService.getCurrentUserId();
      const extension = file.name.split(".").pop() || "jpg";
      const publicUrl = await PageService.uploadMedia(
        file,
        `${userId}/${crypto.randomUUID()}.${extension}`,
      );
      onChange(publicUrl);
      setStatus("success");
    } catch (cause) {
      console.warn("Upload no storage falhou, usando FileReader local:", cause);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onChange(reader.result);
          setStatus("success");
        }
      };
      reader.onerror = () => {
        setStatus("error");
        setError("Não foi possível carregar esta imagem.");
      };
      reader.readAsDataURL(file);
    }
  }

  function handleApplyCustomUrl() {
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    setCustomUrl("");
    setShowUrlInput(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {value && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            onClick={() => onChange(null)}
          >
            <Trash2 className="h-3 w-3" />
            <span>Remover</span>
          </button>
        )}
      </div>

      {/* Prévia e Ação de Enviar */}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative group overflow-hidden rounded-xl border border-border shrink-0">
            <img
              src={value}
              alt="Prévia"
              className={
                isCover ? "h-20 w-32 object-cover" : "h-16 w-16 object-cover"
              }
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80";
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

        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated/50 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-all shadow-sm w-full sm:w-auto"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--primary)]" />
                <span>Enviando foto...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                <span>Subir Foto do Celular / PC</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-[color:var(--primary)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              <span>{showUrlInput ? "Ocultar campo de link" : "Colar link de imagem"}</span>
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => void upload(event.target.files?.[0])}
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
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Galeria Curada Unsplash Padrão Ouro */}
      {curatedPhotos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Fotos Prontas em Alta Resolução (1 Clique):</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Nicho:</span>
              <select
                value={activeGalleryNiche}
                onChange={(e) => setActiveGalleryNiche(e.target.value)}
                className="rounded-lg border border-border bg-card/90 px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
              >
                {Object.entries(NICHE_GALLERY_LABELS).map(([k, labelText]) => (
                  <option key={k} value={k} className="bg-popover text-popover-foreground">
                    {labelText}
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
                  className={`group relative overflow-hidden rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 scale-[1.02] shadow-sm"
                      : "border-border/60 hover:border-primary/40 hover:scale-[1.01]"
                  }`}
                  title={photo.label}
                >
                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="h-16 w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-white truncate text-center backdrop-blur-[2px]">
                    {photo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

