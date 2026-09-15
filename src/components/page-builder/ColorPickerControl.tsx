import { useState, useEffect } from "react";
import { Check, Palette, RotateCcw, Sparkles } from "lucide-react";

export interface CustomThemeConfig {
  primary?: string;
  background?: string;
  mode?: "default" | "dark" | "light" | "gradient";
}

interface ColorPickerControlProps {
  value?: CustomThemeConfig;
  currentThemeId: string;
  onChange: (config: CustomThemeConfig | undefined) => void;
}

const POPULAR_SWATCHES = [
  { hex: "#D4AF37", label: "Dourado Luxo" },
  { hex: "#DB2777", label: "Rosa Estética" },
  { hex: "#E11D48", label: "Vermelho Rubi" },
  { hex: "#2563EB", label: "Azul Royal" },
  { hex: "#059669", label: "Verde Esmeralda" },
  { hex: "#7C3AED", label: "Roxo Tech" },
  { hex: "#EA580C", label: "Laranja Vivo" },
  { hex: "#0EA5E9", label: "Ciano Oceano" },
  { hex: "#1E293B", label: "Dark Titan" },
];

export function ColorPickerControl({
  value,
  onChange,
}: ColorPickerControlProps) {
  const [hexInput, setHexInput] = useState(value?.primary || "#7C3AED");
  const isCustomActive = Boolean(value?.primary);

  useEffect(() => {
    if (value?.primary) {
      setHexInput(value.primary);
    }
  }, [value?.primary]);

  const handleHexChange = (newHex: string) => {
    let cleanHex = newHex.trim();
    if (!cleanHex.startsWith("#") && cleanHex.length > 0) {
      cleanHex = `#${cleanHex}`;
    }
    setHexInput(cleanHex);
    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      onChange({
        ...value,
        primary: cleanHex,
        mode: value?.mode || "default",
      });
    }
  };

  const selectSwatch = (hex: string) => {
    setHexInput(hex);
    onChange({
      ...value,
      primary: hex,
      mode: value?.mode || "default",
    });
  };

  const handleModeChange = (mode: "default" | "dark" | "light" | "gradient") => {
    let bg: string | undefined = undefined;
    const currentPrimary = value?.primary || hexInput;
    if (mode === "dark") {
      bg = "#090d16";
    } else if (mode === "light") {
      bg = "#f8fafc";
    } else if (mode === "gradient") {
      bg = `radial-gradient(900px 500px at 50% 0%, ${currentPrimary}33 0%, transparent 70%), #090d16`;
    }
    onChange({
      ...value,
      primary: currentPrimary,
      background: bg,
      mode,
    });
  };

  const handleReset = () => {
    onChange(undefined);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Seletor Livre de Cores
          </span>
        </div>
        {isCustomActive && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Voltar às cores padrão do tema selecionado"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar Tema
          </button>
        )}
      </div>

      {/* Seletor da Cor Primária */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground block">
          Cor Principal & Botões de Destaque
        </label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : "#7C3AED"}
              onChange={(e) => handleHexChange(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shadow-xs"
              aria-label="Escolher cor personalizada"
            />
          </div>
          <div className="flex-1">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground font-mono">#</span>
              <input
                type="text"
                value={hexInput.replace(/^#/, "")}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="7C3AED"
                maxLength={6}
                className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-xs font-mono font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
            </div>
          </div>
          <div
            className="h-10 w-12 rounded-lg border border-border shadow-xs shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
            style={{ backgroundColor: hexInput }}
          >
            ABC
          </div>
        </div>
      </div>

      {/* Paleta Rápida */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground block">Cores Mais Usadas em Negócios:</label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SWATCHES.map((swatch) => {
            const isSelected = isCustomActive && value?.primary?.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => selectSwatch(swatch.hex)}
                className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 scale-110 shadow-xs"
                    : "border-black/10 dark:border-white/10 hover:scale-105"
                }`}
                style={{ backgroundColor: swatch.hex }}
                title={swatch.label}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modo de Fundo */}
      {isCustomActive && (
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <label className="text-[11px] text-muted-foreground block">Estilo do Fundo da Página:</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "default", label: "Tema" },
              { id: "dark", label: "Dark" },
              { id: "gradient", label: "Gradiente" },
              { id: "light", label: "Claro" },
            ].map((mode) => {
              const currentMode = value?.mode || "default";
              const isSelected = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeChange(mode.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

