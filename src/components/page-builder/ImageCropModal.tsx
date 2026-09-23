import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
  RotateCw,
  Check,
  Crop,
  Loader2,
  Maximize2,
  Minimize2,
  Square,
  RectangleHorizontal,
  Smartphone,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";

export type AspectRatioChoice = "1:1" | "16:9" | "4:3" | "9:16" | "original";
export type FitMode = "cover" | "contain";
export type ResolutionChoice = "hd" | "balanced" | "compact";
export type BackgroundChoice = "blur" | "dark" | "white" | "transparent";

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
  title = "Redimensionar e Enquadrar Foto",
  onCropComplete,
}: ImageCropModalProps) {
  // Configurações de Enquadramento e Redimensionamento
  const defaultChoice: AspectRatioChoice =
    aspectRatio > 1.4 ? "16:9" : aspectRatio === 1 ? "1:1" : "4:3";
  const [aspectChoice, setAspectChoice] = useState<AspectRatioChoice>(defaultChoice);
  const [fitMode, setFitMode] = useState<FitMode>("cover");
  const [bgMode, setBgMode] = useState<BackgroundChoice>("blur");
  const [resolution, setResolution] = useState<ResolutionChoice>("balanced");
  const [rotation, setRotation] = useState<number>(0);

  // Zoom e Posição (Pan)
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Determina a proporção ativa calculada
  const originalRatio = naturalDimensions
    ? naturalDimensions.width / naturalDimensions.height
    : aspectRatio;

  const currentAspect =
    aspectChoice === "1:1"
      ? 1
      : aspectChoice === "16:9"
      ? 16 / 9
      : aspectChoice === "4:3"
      ? 4 / 3
      : aspectChoice === "9:16"
      ? 9 / 16
      : originalRatio;

  // Reseta ao abrir nova imagem
  useEffect(() => {
    if (open) {
      setAspectChoice(defaultChoice);
      setFitMode("cover");
      setResolution("balanced");
      setRotation(0);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [open, imageUrl, defaultChoice]);

  // Manipulação de Arraste (Pan)
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
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Renderiza no Canvas com alta resolução e otimização WebP
  const handleApplyCrop = async (forceOriginalWithoutCrop = false) => {
    if (!imgRef.current) return;
    setIsSaving(true);

    try {
      const img = imgRef.current;
      const naturalW = img.naturalWidth || 800;
      const naturalH = img.naturalHeight || 600;
      const isRotated90 = rotation === 90 || rotation === 270;
      const effectiveW = isRotated90 ? naturalH : naturalW;
      const effectiveH = isRotated90 ? naturalW : naturalH;

      // Resolução limite em pixels baseada na escolha
      const maxDim = resolution === "hd" ? 1600 : resolution === "compact" ? 720 : 1080;

      // Se o usuário quer a foto inteira sem cortar ou no aspecto original
      if (forceOriginalWithoutCrop || aspectChoice === "original") {
        let outW = effectiveW;
        let outH = effectiveH;
        if (outW > maxDim || outH > maxDim) {
          if (outW >= outH) {
            outH = Math.round((outH * maxDim) / outW);
            outW = maxDim;
          } else {
            outW = Math.round((outW * maxDim) / outH);
            outH = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, outW);
        canvas.height = Math.max(1, outH);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const drawImgW = isRotated90 ? outH : outW;
        const drawImgH = isRotated90 ? outW : outH;
        ctx.drawImage(img, -drawImgW / 2, -drawImgH / 2, drawImgW, drawImgH);
        ctx.restore();

        canvas.toBlob(
          async (blob) => {
            try {
              if (!blob) {
                toast.error("Não foi possível gerar a imagem redimensionada.");
                return;
              }
              const croppedUrl = URL.createObjectURL(blob);
              await onCropComplete(blob, croppedUrl);
              onOpenChange(false);
            } catch (cropErr: any) {
              console.error("Erro no processamento da imagem:", cropErr);
              toast.error(cropErr?.message || "Não foi possível salvar a imagem.");
            } finally {
              setIsSaving(false);
            }
          },
          "image/webp",
          0.92,
        );
        return;
      }

      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let outputWidth = maxDim;
      let outputHeight = Math.round(outputWidth / currentAspect);
      if (outputHeight > maxDim) {
        outputHeight = maxDim;
        outputWidth = Math.round(outputHeight * currentAspect);
      }
      outputWidth = Math.max(1, Math.round(outputWidth));
      outputHeight = Math.max(1, Math.round(outputHeight));

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

      // Preenchimento de Fundo no modo Ajustar (Contain)
      if (fitMode === "contain") {
        if (bgMode === "blur") {
          ctx.save();
          ctx.filter = "blur(30px) brightness(0.65)";
          ctx.drawImage(img, -20, -20, outputWidth + 40, outputHeight + 40);
          ctx.restore();
        } else if (bgMode === "dark") {
          ctx.fillStyle = "#030712";
          ctx.fillRect(0, 0, outputWidth, outputHeight);
        } else if (bgMode === "white") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, outputWidth, outputHeight);
        }
      } else {
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      }

      const screenToCanvasRatio = outputWidth / rect.width;

      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.translate(position.x * screenToCanvasRatio, position.y * screenToCanvasRatio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Dimensões base da imagem dentro do container
      const imgAspect = naturalW / naturalH;
      let drawW = rect.width * screenToCanvasRatio;
      let drawH = drawW / imgAspect;

      if (fitMode === "cover") {
        if (drawH < rect.height * screenToCanvasRatio) {
          drawH = rect.height * screenToCanvasRatio;
          drawW = drawH * imgAspect;
        }
      } else {
        // contain
        if (drawH > rect.height * screenToCanvasRatio) {
          drawH = rect.height * screenToCanvasRatio;
          drawW = drawH * imgAspect;
        }
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        async (blob) => {
          try {
            if (!blob) {
              toast.error("Não foi possível gerar a imagem enquadrada.");
              return;
            }
            const croppedUrl = URL.createObjectURL(blob);
            await onCropComplete(blob, croppedUrl);
            onOpenChange(false);
          } catch (cropErr: any) {
            console.error("Erro no processamento da imagem:", cropErr);
            toast.error(cropErr?.message || "Não foi possível salvar a imagem.");
          } finally {
            setIsSaving(false);
          }
        },
        "image/webp",
        0.92,
      );
    } catch (err: any) {
      console.error("Erro ao aplicar recorte/redimensionamento:", err);
      toast.error(err?.message || "Erro ao processar imagem.");
      setIsSaving(false);
    }
  };

  // Dimensões do viewport na interface
  const isLandscape = currentAspect > 1.2;
  const containerHeight = isLandscape ? 240 : 280;
  const containerWidth = Math.min(480, Math.max(180, Math.round(containerHeight * currentAspect)));

  // Resolução estimada
  const estimatedResolutionLabel =
    resolution === "hd" ? "1600px (HD)" : resolution === "compact" ? "720px (Leve)" : "1080px (Equilibrada)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 gap-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Crop className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            </div>
            {naturalDimensions && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                {naturalDimensions.width} × {naturalDimensions.height} px
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Escolha a proporção desejada, ajuste o enquadramento ou use a foto inteira sem cortes.
          </p>
        </DialogHeader>

        {/* 1. SELEÇÃO DE PROPORÇÃO (ASPECT RATIO) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Proporção da Imagem
          </label>
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setAspectChoice("1:1");
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all text-xs font-medium ${
                aspectChoice === "1:1"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <Square className="h-3.5 w-3.5" />
              <span>1:1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspectChoice("16:9");
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all text-xs font-medium ${
                aspectChoice === "16:9"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <RectangleHorizontal className="h-3.5 w-3.5" />
              <span>16:9</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspectChoice("4:3");
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all text-xs font-medium ${
                aspectChoice === "4:3"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>4:3</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspectChoice("9:16");
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all text-xs font-medium ${
                aspectChoice === "9:16"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>9:16</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspectChoice("original");
                setPosition({ x: 0, y: 0 });
                setFitMode("contain");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all text-xs font-medium ${
                aspectChoice === "original"
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Original</span>
            </button>
          </div>
        </div>

        {/* 2. VIEWPORT INTERATIVO DE ENQUADRAMENTO */}
        <div className="flex justify-center py-2 bg-muted/20 rounded-xl border border-border/40 select-none overflow-hidden min-h-[260px] items-center">
          <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-primary/70 shadow-md ${
              cropShape === "round" && currentAspect === 1 && aspectChoice === "1:1"
                ? "rounded-full"
                : "rounded-xl"
            }`}
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              backgroundColor:
                fitMode === "contain"
                  ? bgMode === "white"
                    ? "#ffffff"
                    : bgMode === "dark"
                    ? "#030712"
                    : "#1e293b"
                  : "#000000",
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
              <>
                {/* Imagem de Fundo Desfocada no Modo Contain */}
                {fitMode === "contain" && bgMode === "blur" && (
                  <img
                    src={imageUrl}
                    alt="Background blur"
                    className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 pointer-events-none"
                    draggable={false}
                  />
                )}

                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Prévia de Enquadramento"
                  crossOrigin="anonymous"
                  onLoad={(e) => {
                    const t = e.currentTarget;
                    setNaturalDimensions({ width: t.naturalWidth, height: t.naturalHeight });
                    setImageLoaded(true);
                  }}
                  draggable={false}
                  className="absolute pointer-events-none origin-center transition-transform duration-75"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    minWidth: fitMode === "cover" ? "100%" : "auto",
                    minHeight: fitMode === "cover" ? "100%" : "auto",
                    maxWidth: fitMode === "contain" ? "100%" : "none",
                    maxHeight: fitMode === "contain" ? "100%" : "none",
                    objectFit: fitMode,
                  }}
                />
              </>
            ) : null}

            {/* Linhas de Terço para Guia Visual */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div />
            </div>

            {/* Dica de arraste */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs pointer-events-none flex items-center gap-1.5 shadow-xs">
              <Move className="h-3 w-3" />
              <span>Arraste para posicionar</span>
            </div>
          </div>
        </div>

        {/* 3. CONTROLES DE ZOOM, ENQUADRAMENTO E ROTAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/40 text-xs">
          {/* Zoom e Posição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-primary" />
                Zoom ({Math.round(zoom * 100)}%)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded border border-border/50"
                  title="Girar 90 graus no sentido horário"
                >
                  <RotateCw className="h-3 w-3 text-primary" />
                  <span>Girar 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  title="Redefinir enquadramento e zoom"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Resetar</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.3, Number((prev - 0.1).toFixed(2))))}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Afastar"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0.3}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Aproximar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modo Preencher vs Ajustar */}
          <div className="space-y-2">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-primary" />
              Modo de Ajuste
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFitMode("cover")}
                className={`py-1 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  fitMode === "cover"
                    ? "border-primary bg-primary/10 text-primary shadow-2xs"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Maximize2 className="h-3 w-3" />
                <span>Preencher (Corte)</span>
              </button>

              <button
                type="button"
                onClick={() => setFitMode("contain")}
                className={`py-1 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  fitMode === "contain"
                    ? "border-primary bg-primary/10 text-primary shadow-2xs"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Minimize2 className="h-3 w-3" />
                <span>Conter Foto Inteira</span>
              </button>
            </div>

            {fitMode === "contain" && (
              <div className="flex items-center gap-1.5 text-[11px] pt-1">
                <span className="text-muted-foreground">Fundo:</span>
                <button
                  type="button"
                  onClick={() => setBgMode("blur")}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                    bgMode === "blur" ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/60 text-muted-foreground"
                  }`}
                >
                  Desfocado
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode("dark")}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                    bgMode === "dark" ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/60 text-muted-foreground"
                  }`}
                >
                  Preto
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode("white")}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                    bgMode === "white" ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/60 text-muted-foreground"
                  }`}
                >
                  Branco
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. REDIMENSIONAMENTO / QUALIDADE DE SAÍDA */}
        <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span>Resolução de Saída:</span>
            <span className="font-semibold text-foreground">{estimatedResolutionLabel}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setResolution("hd")}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                resolution === "hd" ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border/50"
              }`}
            >
              HD (1600px)
            </button>
            <button
              type="button"
              onClick={() => setResolution("balanced")}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                resolution === "balanced" ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border/50"
              }`}
            >
              Normal (1080px)
            </button>
            <button
              type="button"
              onClick={() => setResolution("compact")}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                resolution === "compact" ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border/50"
              }`}
            >
              Leve (720px)
            </button>
          </div>
        </div>

        {/* 5. AÇÕES DO RODAPÉ */}
        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Opção rápida para usar a foto inteira sem nenhum corte */}
            <button
              type="button"
              onClick={() => handleApplyCrop(true)}
              disabled={isSaving || !imageLoaded}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-border/70 hover:bg-muted/60 text-foreground text-xs font-medium transition-all shadow-2xs"
              title="Redimensiona e otimiza a foto mantendo a proporção original sem cortar nada"
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Usar Foto Inteira (Sem Corte)</span>
            </button>

            {/* Aplicar o enquadramento configurado */}
            <button
              type="button"
              onClick={() => handleApplyCrop(false)}
              disabled={isSaving || !imageLoaded}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Aplicar Redimensionamento</span>
                </>
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
