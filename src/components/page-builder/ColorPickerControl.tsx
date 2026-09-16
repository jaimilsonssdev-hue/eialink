import { useState, useEffect } from "react";
import { Check, Moon, Palette, RotateCcw, Sparkles, Sun, Type } from "lucide-react";

export interface CustomThemeConfig {
  primary?: string;
  background?: string;
  text?: string;
  mode?: "default" | "dark" | "light" | "gradient" | "custom";
}

interface ColorPickerControlProps {
  value?: CustomThemeConfig;
  currentThemeId: string;
  onChange: (config: CustomThemeConfig | undefined) => void;
}

const PRIMARY_PRESETS = [
  { hex: "#D4AF37", label: "Dourado Nobre" },
  { hex: "#9F1239", label: "Vinho & Bordô" },
  { hex: "#EC4899", label: "Rosa & Estética" },
  { hex: "#EF4444", label: "Vermelho Rubi" },
  { hex: "#2563EB", label: "Azul Royal" },
  { hex: "#06B6D4", label: "Ciano Turquesa" },
  { hex: "#10B981", label: "Verde Esmeralda" },
  { hex: "#8B5CF6", label: "Roxo Moderno" },
  { hex: "#F97316", label: "Laranja Quente" },
  { hex: "#18181B", label: "Preto Carbono" },
];

export function ColorPickerControl({
  value,
  onChange,
}: ColorPickerControlProps) {
  const currentPrimary = value?.primary || "#2563EB";
  const [primaryHex, setPrimaryHex] = useState(currentPrimary);
  const [bgHex, setBgHex] = useState(value?.background?.startsWith("#") ? value.background : "#090D16");
  const [textHex, setTextHex] = useState(value?.text || (value?.mode === "light" ? "#0F172A" : "#FFFFFF"));
  const [showCustomBg, setShowCustomBg] = useState(value?.mode === "custom");
  const [showCustomText, setShowCustomText] = useState(Boolean(value?.text && value.text !== "#FFFFFF" && value.text !== "#0F172A"));

  const hasAnyCustom = Boolean(value?.primary || value?.background || value?.text || value?.mode);

  useEffect(() => {
    if (value?.primary) setPrimaryHex(value.primary);
  }, [value?.primary]);

  useEffect(() => {
    if (value?.text) setTextHex(value.text);
  }, [value?.text]);

  const applyPrimaryColor = (hex: string) => {
    setPrimaryHex(hex);
    onChange({
      ...value,
      primary: hex,
      mode: value?.mode || "default",
    });
  };

  const applyBackgroundMode = (mode: "default" | "dark" | "light" | "gradient" | "custom", customBg?: string) => {
    setShowCustomBg(mode === "custom");
    let bg: string | undefined = undefined;
    let text: string | undefined = value?.text;

    if (mode === "dark") {
      bg = "#090d16";
      text = text || "#ffffff";
    } else if (mode === "light") {
      bg = "#ffffff";
      text = text || "#0f172a";
    } else if (mode === "gradient") {
      bg = `radial-gradient(900px 500px at 50% 0%, ${primaryHex}35 0%, transparent 70%), #090d16`;
      text = text || "#ffffff";
    } else if (mode === "custom") {
      bg = customBg || bgHex;
    }

    onChange({
      ...value,
      primary: primaryHex,
      background: bg,
      text,
      mode,
    });
  };

  const applyTextColor = (hex: string) => {
    setTextHex(hex);
    onChange({
      ...value,
      primary: primaryHex,
      text: hex,
    });
  };

  const handleReset = () => {
    onChange(undefined);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Personalização das Cores</h3>
            <p className="text-[11px] text-muted-foreground">
              Altere botões, destaques, fundo e textos em tempo real
            </p>
          </div>
        </div>

        {hasAnyCustom && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
            title="Restaurar padrão do tema"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar
          </button>
        )}
      </div>

      {/* 1. COR PRINCIPAL / BOTÕES & DESTAQUES */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryHex }} />
            1. Cor dos Botões, WhatsApp & Destaques
          </label>
          <span className="text-[11px] font-mono font-bold text-muted-foreground">
            {primaryHex.toUpperCase()}
          </span>
        </div>

        {/* Swatches Rápidos de 1 Clique */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {PRIMARY_PRESETS.map((p) => {
            const isSelected = value?.primary?.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => applyPrimaryColor(p.hex)}
                className={`group relative h-9 w-full rounded-xl border flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-white ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-sm"
                    : "border-black/10 dark:border-white/15 hover:scale-105"
                }`}
                style={{ backgroundColor: p.hex }}
                title={p.label}
              >
                {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>

        {/* Seletor Livre de Cor Primária (Color Picker + Hex Input) */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative shrink-0">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(primaryHex) ? primaryHex : "#2563EB"}
              onChange={(e) => applyPrimaryColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              aria-label="Escolher cor personalizada para botões"
            />
          </div>
          <div className="relative flex items-center flex-1">
            <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">#</span>
            <input
              type="text"
              value={primaryHex.replace(/^#/, "")}
              onChange={(e) => {
                const clean = `#${e.target.value.trim().replace(/^#/, "")}`;
                setPrimaryHex(clean);
                if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
                  applyPrimaryColor(clean);
                }
              }}
              placeholder="2563EB"
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">Outra Cor</span>
        </div>
      </div>

      {/* 2. COR DO FUNDO DA PÁGINA */}
      <div className="space-y-2.5 pt-3 border-t border-border/50">
        <label className="text-xs font-bold text-foreground block">
          2. Estilo de Fundo da Página
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "default", label: "Tema Padrão", icon: Sparkles },
            { id: "dark", label: "Escuro Puro", icon: Moon },
            { id: "gradient", label: "Gradiente Glow", icon: Sparkles },
            { id: "light", label: "Claro / Branco", icon: Sun },
          ].map((m) => {
            const isSelected = (value?.mode || "default") === m.id && !showCustomBg;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => applyBackgroundMode(m.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30 shadow-2xs"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fundo Personalizado */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative shrink-0">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(bgHex) ? bgHex : "#090D16"}
              onChange={(e) => {
                setBgHex(e.target.value);
                applyBackgroundMode("custom", e.target.value);
              }}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              aria-label="Escolher cor personalizada para o fundo"
            />
          </div>
          <button
            type="button"
            onClick={() => applyBackgroundMode("custom", bgHex)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              showCustomBg
                ? "border-primary bg-primary/10 text-primary font-bold"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Definir Cor Livre de Fundo ({bgHex})
          </button>
        </div>
      </div>

      {/* 3. COR DOS TEXTOS & TÍTULOS */}
      <div className="space-y-2.5 pt-3 border-t border-border/50">
        <label className="text-xs font-bold text-foreground block">
          3. Cor dos Textos & Títulos
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyTextColor("#FFFFFF")}
            className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              value?.text === "#FFFFFF" || (!value?.text && value?.mode !== "light")
                ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className="h-3 w-3 rounded-full bg-white border border-black/20" />
            <span>Texto Branco</span>
          </button>

          <button
            type="button"
            onClick={() => applyTextColor("#0F172A")}
            className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              value?.text === "#0F172A" || (!value?.text && value?.mode === "light")
                ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className="h-3 w-3 rounded-full bg-slate-900 border border-white/20" />
            <span>Texto Escuro</span>
          </button>

          <div className="relative shrink-0">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(textHex) ? textHex : "#FFFFFF"}
              onChange={(e) => applyTextColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              title="Cor livre para textos"
              aria-label="Cor livre para textos"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
