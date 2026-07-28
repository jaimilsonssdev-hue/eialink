import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { PageService } from "@/modules/page/services/PageService";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export function MediaUploader({
  label,
  value,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  onChange,
}: {
  label: string;
  value?: string | null;
  maxSizeBytes?: number;
  onChange(url: string | null): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string>();
  const limitMb = Math.round(maxSizeBytes / 1024 / 1024);
  async function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Envie JPG, PNG ou WEBP.");
    if (file.size > maxSizeBytes) throw new Error(`A imagem deve ter no mÃ¡ximo ${limitMb} MB.`);
    const source = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("NÃ£o foi possÃ­vel ler esta imagem."));
        image.src = source;
      });
      if (!image.naturalWidth || !image.naturalHeight)
        throw new Error("A imagem nÃ£o possui dimensÃµes vÃ¡lidas.");
      if (image.naturalWidth < 600 || image.naturalHeight < 600)
        throw new Error("Use uma imagem de pelo menos 600 x 600 px.");
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
      setError(cause instanceof Error ? cause.message : "Imagem invÃ¡lida.");
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
      setError(cause instanceof Error ? cause.message : "NÃ£o foi possÃ­vel enviar a imagem.");
    }
  }
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="PrÃ©via da imagem selecionada"
            className="h-20 w-20 rounded-xl object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-muted">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className="btn-secondary text-sm"
        >
          {status === "uploading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {status === "uploading" ? "Enviando..." : "Selecionar imagem"}
        </button>
        {value && (
          <button
            type="button"
            className="text-xs text-[color:var(--destructive)]"
            onClick={() => onChange(null)}
          >
            Remover
          </button>
        )}
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-[color:var(--destructive)]">
          {error}
        </p>
      )}
      {status === "success" && (
        <p className="mt-2 text-xs text-[color:var(--success)]">
          Imagem enviada. Salve a pÃ¡gina para concluir.
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG ou WEBP. AtÃ© {limitMb} MB; recomendado: 1200 x 1200 px.
      </p>
    </div>
  );
}
