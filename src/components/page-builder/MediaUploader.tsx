import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function MediaUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange(url: string): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string>();
  async function upload(file?: File) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
      setError("Envie PNG, JPG ou WEBP de até 5 MB.");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setError(undefined);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setStatus("error");
      setError("Sua sessão expirou. Entre novamente.");
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("bio-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setStatus("error");
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("bio-media").getPublicUrl(path);
    onChange(data.publicUrl);
    setStatus("idle");
  }
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Prévia da imagem selecionada"
            className="h-14 w-14 rounded-xl object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted">
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
    </div>
  );
}
