import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Check,
  Crop,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  aspectRatio?: number; // 1 para quadrado/avatar, 16/9 para capa
  cropShape?: "rect" | "round";
  title?: string;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => Promise<void> | void;
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageUrl,
  aspectRatio = 1,
  cropShape = "rect",
  title = "Dimensionar e Enquadrar Foto",
  onCropComplete,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reseta zoom e posição ao abrir nova imagem
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [open, imageUrl]);

  // Manipulação de Arraste (Pan / Enquadramento)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Suporte a Toque em Dispositivos Móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Renderiza o recorte no Canvas HTML5 com alta resolução
  const handleApplyCrop = async () => {
    if (!imgRef.current || !containerRef.current) return;
    setIsSaving(true);

    try {
      const img = imgRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Dimensão de saída em alta definição
      const outputWidth = aspectRatio === 1 ? 800 : 1600;
      const outputHeight = Math.round(outputWidth / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

      // Escala entre a exibição na tela e o canvas final
      const screenToCanvasRatio = outputWidth / rect.width;

      // Limpa canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Aplica transformações (zoom e posição)
      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.translate(position.x * screenToCanvasRatio, position.y * screenToCanvasRatio);
      ctx.scale(zoom, zoom);

      // Dimensões da imagem proporcional ao container
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW = rect.width * screenToCanvasRatio;
      let drawH = drawW / imgAspect;

      if (drawH < rect.height * screenToCanvasRatio) {
        drawH = rect.height * screenToCanvasRatio;
        drawW = drawH * imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Exporta como blob WebP ou JPEG
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsSaving(false);
            return;
          }
          const croppedUrl = URL.createObjectURL(blob);
          await onCropComplete(blob, croppedUrl);
          setIsSaving(false);
          onOpenChange(false);
        },
        "image/webp",
        0.92,
      );
    } catch (err) {
      console.error("Erro ao aplicar recorte:", err);
      setIsSaving(false);
    }
  };

  // Calcula formato do container na interface
  const isLandscape = aspectRatio > 1.2;
  const containerWidthClass = isLandscape ? "w-full max-w-[500px]" : "w-[280px] sm:w-[320px]";
  const containerHeight = isLandscape ? 280 : 320;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto p-5 gap-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Crop className="h-4 w-4" />
            </span>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Arraste a foto para enquadrar a melhor área e ajuste a barra de zoom para dimensionar.
          </p>
        </DialogHeader>

        {/* Viewport Interativo de Enquadramento */}
        <div className="flex justify-center py-2 bg-muted/20 rounded-xl border border-border/40 select-none overflow-hidden">
          <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-primary/60 shadow-md ${containerWidthClass} ${
              cropShape === "round" ? "rounded-full" : "rounded-xl"
            }`}
            style={{
              height: `${containerHeight}px`,
              aspectRatio: `${aspectRatio}`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageUrl ? (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Enquadramento"
                crossOrigin="anonymous"
                onLoad={() => setImageLoaded(true)}
                draggable={false}
                className="absolute max-w-none transition-transform pointer-events-none origin-center"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  minWidth: "100%",
                  minHeight: "100%",
                  objectFit: "cover",
                }}
              />
            ) : null}

            {/* Guia de Alinhamento (Linhas de Terços) */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
              <div />
            </div>

            {/* Dica de arraste */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs pointer-events-none flex items-center gap-1.5 shadow-xs">
              <Move className="h-3 w-3" />
              <span>Arraste para posicionar</span>
            </div>
          </div>
        </div>

        {/* Controles de Dimensionamento (Zoom e Reset) */}
        <div className="space-y-3 px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <ZoomIn className="h-3.5 w-3.5 text-primary" />
              Dimensionar / Zoom
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground text-[11px]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Redefinir enquadramento"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Resetar</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))))}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Diminuir"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Aumentar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving || !imageLoaded}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enquadrando…</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Aplicar Enquadramento</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

