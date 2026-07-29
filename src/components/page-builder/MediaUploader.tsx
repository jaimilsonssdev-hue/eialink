import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { PageService } from "@/modules/page/services/PageService";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

const COVER_LIBRARY = {
  restaurant: [
    { id: "restaurant-burger", src: "/template-assets/restaurant-demo-cover.png", label: "Hambúrguer" },
    { id: "restaurant-pizza", src: "/template-assets/restaurant-cover-pizza.png", label: "Pizza artesanal" },
    { id: "restaurant-brunch", src: "/template-assets/restaurant-cover-brunch.png", label: "Café e brunch" },
  ],
  clinic: [
    { id: "clinic-reception", src: "/template-assets/clinic-demo-cover.png", label: "Recepção" },
    { id: "clinic-wellness", src: "/template-assets/clinic-cover-wellness.png", label: "Bem-estar" },
    { id: "clinic-consultation", src: "/template-assets/clinic-cover-consultation.png", label: "Consultório" },
  ],
  store: [
    { id: "store-shoes", src: "/template-assets/store-demo-cover.png", label: "Vitrine" },
    { id: "store-boutique", src: "/template-assets/store-cover-boutique.png", label: "Boutique" },
    { id: "store-sneakers", src: "/template-assets/store-cover-sneakers.png", label: "Tênis e acessórios" },
  ],
  beauty: [
    { id: "beauty-studio", src: "/template-assets/beauty-demo-cover.png", label: "Estudio beauty" },
  ],
  creator: [
    { id: "creator-studio", src: "/template-assets/creator-demo-cover.png", label: "Estudio criativo" },
  ],
  business: [
    { id: "business-office", src: "/template-assets/business-demo-cover.png", label: "Atendimento profissional" },
  ],
} as const;

function coverCategory(templateId?: string | null) {
  if (templateId?.includes("clinic")) return "clinic";
  if (templateId?.includes("store")) return "store";
  if (templateId?.includes("beauty")) return "beauty";
  if (templateId?.includes("creator")) return "creator";
  if (templateId?.includes("business")) return "business";
  return "restaurant";
}

export function MediaUploader({
  label,
  value,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  variant = "square",
  templateId,
  onChange,
}: {
  label: string;
  value?: string | null;
  maxSizeBytes?: number;
  variant?: "square" | "cover";
  templateId?: string | null;
  onChange(url: string | null): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string>();
  const limitMb = Math.round(maxSizeBytes / 1024 / 1024);

  async function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Envie JPG, PNG ou WEBP.");
    if (file.size > maxSizeBytes) throw new Error(`A imagem deve ter no máximo ${limitMb} MB.`);

    const source = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
        image.src = source;
      });
      if (!image.naturalWidth || !image.naturalHeight)
        throw new Error("A imagem não possui dimensões válidas.");
      if (image.naturalWidth < 600 || image.naturalHeight < 600)
        throw new Error("Use uma imagem de pelo menos 600 × 600 px.");
    } finally {
      URL.revokeObjectURL(source);
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
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a imagem.");
    }
  }

  const isCover = variant === "cover";
  const category = coverCategory(templateId);
  const coverLibrary = COVER_LIBRARY[category];
  const categoryLabel = category === "clinic" ? "clínica" : category === "store" ? "loja" : "restaurante";

  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Prévia da imagem selecionada"
            className={isCover ? "h-20 w-32 rounded-xl object-cover" : "h-20 w-20 rounded-xl object-cover"}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className={isCover ? "grid h-20 w-32 place-items-center rounded-xl bg-muted" : "grid h-20 w-20 place-items-center rounded-xl bg-muted"}>
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="btn-secondary text-sm"
          >
            {status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {status === "uploading" ? "Enviando..." : "Selecionar imagem"}
          </button>
          {value && (
            <button
              type="button"
              className="ml-3 text-xs text-[color:var(--destructive)]"
              onClick={() => onChange(null)}
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-[color:var(--destructive)]">{error}</p>}
      {status === "success" && <p className="mt-2 text-xs text-[color:var(--success)]">Imagem enviada. Salve a página para concluir.</p>}
      {!isCover && <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP. Até {limitMb} MB; recomendado: 1200 × 1200 px.</p>}
      {isCover && (
        <div className="media-library" aria-label="Biblioteca de capas">
          <p className="media-library-help">Para a capa, use JPG, PNG ou WEBP de até {limitMb} MB. Recomendado: 1600 × 900 px.</p>
          <ol className="media-library-steps" aria-label="Como trocar a capa">
            <li>1. Clique em uma imagem.</li>
            <li>2. Confira a prévia ao centro.</li>
            <li>3. Clique em Salvar no topo.</li>
          </ol>
          <p>Ou escolha uma capa da biblioteca de {categoryLabel}</p>
          <div className="media-library-grid">
            {coverLibrary.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className={value === asset.src ? "is-selected" : ""}
                onClick={() => onChange(asset.src)}
              >
                <img src={asset.src} alt={`Capa de ${asset.label}`} loading="lazy" />
                <span>{asset.label}</span>
              </button>
            ))}
          </div>
          <small>Escolha uma imagem e clique em Salvar, no topo da página, para publicar sua mudança.</small>
        </div>
      )}
    </div>
  );
}
