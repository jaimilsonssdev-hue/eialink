import { useState, useEffect } from "react";
import {
  Check,
  LayoutGrid,
  List,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Type,
} from "lucide-react";

export interface CustomThemeConfig {
  primary?: string;
  background?: string;
  text?: string;
  mode?: "default" | "dark" | "light" | "gradient" | "custom";
  card_bg?: string;
  border_color?: string;
  border_radius?: string;
  gradient_1?: string;
  gradient_2?: string;
  layout_esqueleto?: "list_vertical_premium" | "bento_grid";
}

interface ColorPickerControlProps {
  value?: CustomThemeConfig;
  currentThemeId: string;
  onChange: (config: CustomThemeConfig | undefined) => void;
}

const PRIMARY_PRESETS = [
  { hex: "#6366F1", label: "Índigo VIP" },
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

const TEXT_PRESETS = [
  { hex: "#FFFFFF", label: "Branco Puro" },
  { hex: "#F8FAFC", label: "Off-White Gelo" },
  { hex: "#FEF08A", label: "Dourado Champanhe" },
  { hex: "#CBD5E1", label: "Cinza Platina" },
  { hex: "#38BDF8", label: "Azul Céu" },
  { hex: "#0F172A", label: "Escuro Carbono" },
];

export function ColorPickerControl({
  value,
  onChange,
}: ColorPickerControlProps) {
  const currentPrimary = value?.primary || "#6366F1";
  const [primaryHex, setPrimaryHex] = useState(currentPrimary);
  const [textHex, setTextHex] = useState(value?.text || "#FFFFFF");
  const [bgHex, setBgHex] = useState(
    value?.background?.startsWith("#") ? value.background : "#0B0C10"
  );
  const [grad1Hex, setGrad1Hex] = useState(value?.gradient_1 || "#0B0C10");
  const [grad2Hex, setGrad2Hex] = useState(value?.gradient_2 || "#1F2937");
  const [borderRadius, setBorderRadius] = useState(value?.border_radius || "16px");
  const [cardBg, setCardBg] = useState(value?.card_bg || "");
  const [borderColor, setBorderColor] = useState(value?.border_color || "");
  const [layoutEsqueleto, setLayoutEsqueleto] = useState<"list_vertical_premium" | "bento_grid">(
    value?.layout_esqueleto || "list_vertical_premium"
  );

  const hasAnyCustom = Boolean(
    value?.primary ||
      value?.background ||
      value?.text ||
      value?.card_bg ||
      value?.border_color ||
      value?.mode ||
      value?.gradient_1 ||
      value?.layout_esqueleto
  );

  useEffect(() => {
    if (value?.primary) setPrimaryHex(value.primary);
  }, [value?.primary]);

  useEffect(() => {
    if (value?.text) setTextHex(value.text);
  }, [value?.text]);

  useEffect(() => {
    if (value?.background) setBgHex(value.background);
  }, [value?.background]);

  useEffect(() => {
    if (value?.gradient_1) setGrad1Hex(value.gradient_1);
  }, [value?.gradient_1]);

  useEffect(() => {
    if (value?.gradient_2) setGrad2Hex(value.gradient_2);
  }, [value?.gradient_2]);

  useEffect(() => {
    if (value?.border_radius) setBorderRadius(value.border_radius);
  }, [value?.border_radius]);

  useEffect(() => {
    if (value?.card_bg !== undefined) setCardBg(value.card_bg);
  }, [value?.card_bg]);

  useEffect(() => {
    if (value?.border_color !== undefined) setBorderColor(value.border_color);
  }, [value?.border_color]);

  useEffect(() => {
    if (value?.layout_esqueleto) setLayoutEsqueleto(value.layout_esqueleto);
  }, [value?.layout_esqueleto]);

  const updateConfig = (updates: Partial<CustomThemeConfig>) => {
    const updated: CustomThemeConfig = {
      ...value,
      primary: updates.primary !== undefined ? updates.primary : primaryHex,
      text: updates.text !== undefined ? updates.text : textHex,
      background: updates.background !== undefined ? updates.background : bgHex,
      card_bg: updates.card_bg !== undefined ? updates.card_bg : cardBg,
      border_color: updates.border_color !== undefined ? updates.border_color : borderColor,
      gradient_1: updates.gradient_1 !== undefined ? updates.gradient_1 : grad1Hex,
      gradient_2: updates.gradient_2 !== undefined ? updates.gradient_2 : grad2Hex,
      border_radius: updates.border_radius !== undefined ? updates.border_radius : borderRadius,
      layout_esqueleto: updates.layout_esqueleto !== undefined ? updates.layout_esqueleto : layoutEsqueleto,
      mode: updates.mode !== undefined ? updates.mode : (value?.mode || "dark"),
      ...updates,
    };
    onChange(updated);
  };

  const applyPrimaryColor = (hex: string) => {
    setPrimaryHex(hex);
    updateConfig({ primary: hex });
  };

  const applyTextColor = (hex: string) => {
    setTextHex(hex);
    updateConfig({ text: hex });
  };

  const applyCardBg = (val: string) => {
    setCardBg(val);
    updateConfig({ card_bg: val });
  };

  const applyBorderColor = (val: string) => {
    setBorderColor(val);
    updateConfig({ border_color: val });
  };

  const applyBackgroundMode = (
    mode: "default" | "dark" | "light" | "gradient" | "custom",
    customBg?: string
  ) => {
    let bg = bgHex;
    let text = textHex;
    let g1 = grad1Hex;
    let g2 = grad2Hex;
    let card = cardBg;
    let border = borderColor;

    if (mode === "dark") {
      bg = "#080a11";
      text = "#ffffff";
      g1 = "#080a11";
      g2 = primaryHex || "#6366f1";
      card = cardBg || "rgba(255, 255, 255, 0.04)";
      border = borderColor || "rgba(255, 255, 255, 0.12)";
    } else if (mode === "light") {
      bg = "#ffffff";
      text = "#0f172a";
      g1 = "#ffffff";
      g2 = "#f1f5f9";
      card = !cardBg || cardBg === "rgba(255, 255, 255, 0.04)" ? "#ffffff" : cardBg;
      border = !borderColor || borderColor === "rgba(255, 255, 255, 0.12)" ? "rgba(15, 23, 42, 0.12)" : borderColor;
    } else if (mode === "gradient") {
      g1 = grad1Hex || "#0b0c10";
      g2 = primaryHex || "#6366f1";
      bg = `radial-gradient(ellipse at 50% 0%, ${g2}40 0%, ${g1} 75%)`;
      text = "#ffffff";
    } else if (mode === "custom") {
      bg = customBg || (bgHex.startsWith("#") ? bgHex : "#080a11");
    }

    setBgHex(bg);
    setTextHex(text);
    setGrad1Hex(g1);
    setGrad2Hex(g2);
    setCardBg(card);
    setBorderColor(border);
    updateConfig({
      mode,
      background: bg,
      text,
      gradient_1: g1,
      gradient_2: g2,
      card_bg: card,
      border_color: border,
    });
  };

  const applyGradientColors = (g1: string, g2: string) => {
    setGrad1Hex(g1);
    setGrad2Hex(g2);
    const combinedBg = `radial-gradient(ellipse at 50% 0%, ${g2}45 0%, ${g1} 80%)`;
    setBgHex(combinedBg);
    updateConfig({
      mode: "gradient",
      gradient_1: g1,
      gradient_2: g2,
      background: combinedBg,
    });
  };

  const handleReset = () => {
    onChange(undefined);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5 space-y-6 shadow-sm">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Personalização Visual & Design Tokens
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-extrabold uppercase">
                Tempo Real
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Edite botões, textos, fundo mesh e estrutura dos links
            </p>
          </div>
        </div>

        {hasAnyCustom && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
            title="Restaurar padrão do tema"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar
          </button>
        )}
      </div>

      {/* 1. ESTRUTURA / MÁSCARA DO LAYOUT */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            1. Estrutura dos Links (Máscara)
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            {layoutEsqueleto === "bento_grid" ? "Bento Grid" : "Lista Vertical"}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setLayoutEsqueleto("list_vertical_premium");
              updateConfig({ layout_esqueleto: "list_vertical_premium" });
            }}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              layoutEsqueleto === "list_vertical_premium"
                ? "border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <List className="h-4 w-4" />
            <span>Lista Vertical VIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLayoutEsqueleto("bento_grid");
              updateConfig({ layout_esqueleto: "bento_grid" });
            }}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              layoutEsqueleto === "bento_grid"
                ? "border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Bento Grid 2 Colunas</span>
          </button>
        </div>
      </div>

      {/* 2. COR DOS BOTÕES & DESTAQUES */}
      <div className="space-y-2.5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full border border-white/20 shadow-xs"
              style={{ backgroundColor: primaryHex }}
            />
            2. Cor dos Botões, WhatsApp & Destaques
          </label>
          <span className="text-[11px] font-mono font-bold text-primary">
            {primaryHex.toUpperCase()}
          </span>
        </div>

        {/* Swatches Rápidos de 1 Clique */}
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
          {PRIMARY_PRESETS.map((p) => {
            const isSelected = primaryHex.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => applyPrimaryColor(p.hex)}
                className={`group relative h-8 w-full rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-white ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-sm z-10"
                    : "border-black/10 dark:border-white/15 hover:scale-105"
                }`}
                style={{ backgroundColor: p.hex }}
                title={p.label}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>

        {/* Seletor Livre de Cor Primária */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative shrink-0">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(primaryHex) ? primaryHex : "#6366F1"}
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
              placeholder="6366F1"
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">Cor Livre</span>
        </div>
      </div>

      {/* 3. COR DOS TEXTOS & TÍTULOS */}
      <div className="space-y-2.5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-primary" />
            3. Cor dos Textos & Títulos da Página
          </label>
          <span className="text-[11px] font-mono font-bold text-foreground">
            {textHex.toUpperCase()}
          </span>
        </div>

        {/* Swatches Rápidos de Texto */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TEXT_PRESETS.map((t) => {
            const isSelected = textHex.toLowerCase() === t.hex.toLowerCase();
            return (
              <button
                key={t.hex}
                type="button"
                onClick={() => applyTextColor(t.hex)}
                className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40 shadow-2xs"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: t.hex }}
                />
                <span className="truncate">{t.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Seletor Livre de Cor de Texto */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative shrink-0">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(textHex) ? textHex : "#FFFFFF"}
              onChange={(e) => applyTextColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              aria-label="Escolher cor personalizada para textos"
            />
          </div>
          <div className="relative flex items-center flex-1">
            <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">#</span>
            <input
              type="text"
              value={textHex.replace(/^#/, "")}
              onChange={(e) => {
                const clean = `#${e.target.value.trim().replace(/^#/, "")}`;
                setTextHex(clean);
                if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
                  applyTextColor(clean);
                }
              }}
              placeholder="FFFFFF"
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">Cor Livre Texto</span>
        </div>
      </div>

      {/* 4. ESTILO DE FUNDO & GRADIENTE MESH */}
      <div className="space-y-2.5 pt-4 border-t border-border/50">
        <label className="text-xs font-bold text-foreground block">
          4. Estilo de Fundo & Gradientes Mesh
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "dark", label: "Escuro Puro", icon: Moon },
            { id: "gradient", label: "Gradiente Mesh", icon: Sparkles },
            { id: "light", label: "Claro / Branco", icon: Sun },
            { id: "custom", label: "Cor Personalizada", icon: Palette },
          ].map((m) => {
            const isSelected = (value?.mode || "dark") === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => applyBackgroundMode(m.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40 shadow-2xs"
                    : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ajuste Fino do Gradiente Duplo (Mesh) */}
        <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Ajuste de Duas Cores para o Efeito Mesh Glow:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(grad1Hex) ? grad1Hex : "#0B0C10"}
                onChange={(e) => applyGradientColors(e.target.value, grad2Hex)}
                className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                title="Cor Base de Fundo (Gradiente 1)"
              />
              <span className="text-[11px] font-mono text-muted-foreground">Fundo Base</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(grad2Hex) ? grad2Hex : "#1F2937"}
                onChange={(e) => applyGradientColors(grad1Hex, e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                title="Cor da Luz Ambiente (Gradiente 2)"
              />
              <span className="text-[11px] font-mono text-muted-foreground">Luz Mesh</span>
            </div>
          </div>
        </div>

        {/* Seletor Livre de Cor Sólida de Fundo */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative shrink-0">
            <input
              type="color"
              value={bgHex.startsWith("#") ? bgHex : "#080a11"}
              onChange={(e) => applyBackgroundMode("custom", e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              aria-label="Escolher cor sólida personalizada para o fundo"
            />
          </div>
          <div className="relative flex items-center flex-1">
            <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">#</span>
            <input
              type="text"
              value={bgHex.startsWith("#") ? bgHex.replace(/^#/, "") : "080A11"}
              onChange={(e) => {
                const clean = `#${e.target.value.trim().replace(/^#/, "")}`;
                setBgHex(clean);
                if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
                  applyBackgroundMode("custom", clean);
                }
              }}
              placeholder="080A11"
              maxLength={6}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">Fundo Sólido Livre</span>
        </div>
      </div>

      {/* 5. ARREDONDAMENTO DAS BORDAS (RAIO) */}
      <div className="space-y-2.5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Square className="h-3.5 w-3.5 text-primary" />
            5. Formato dos Botões e Cards
          </label>
          <span className="text-[11px] font-mono text-muted-foreground">{borderRadius}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Sutil", val: "8px" },
            { label: "Médio", val: "12px" },
            { label: "Padrão", val: "16px" },
            { label: "Redondo", val: "24px" },
          ].map((r) => {
            const isSelected = borderRadius === r.val;
            return (
              <button
                key={r.val}
                type="button"
                onClick={() => {
                  setBorderRadius(r.val);
                  updateConfig({ border_radius: r.val });
                }}
                className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. COR DOS CARDS E BLOCOS DE INFORMAÇÃO */}
      <div className="space-y-2.5 pt-4 border-t border-border/50">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Square className="h-3.5 w-3.5 text-primary" />
          6. Cor dos Cards e Blocos de Informações
        </label>
        <p className="text-[11px] text-muted-foreground">
          Escolha o tom de fundo e o contorno das caixas, links e vitrines do seu BioLink.
        </p>

        {/* Presets Rápidos de Fundo de Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Vidro Fumê", val: "rgba(255, 255, 255, 0.04)" },
            { label: "Branco Puro", val: "#ffffff" },
            { label: "Preto Profundo", val: "#121216" },
            { label: "Vidro Escuro", val: "rgba(0, 0, 0, 0.50)" },
            { label: "Azul Noturno", val: "rgba(15, 23, 42, 0.75)" },
            { label: "Transparente", val: "transparent" },
          ].map((preset) => {
            const isSelected = (cardBg || "rgba(255, 255, 255, 0.04)") === preset.val;
            return (
              <button
                key={preset.val}
                type="button"
                onClick={() => applyCardBg(preset.val)}
                className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Seletores Livres de Cor do Card e Borda */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-background/50 border border-border/60">
            <input
              type="color"
              value={cardBg.startsWith("#") ? cardBg : "#1e293b"}
              onChange={(e) => applyCardBg(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shrink-0"
              title="Cor livre para o fundo dos cards"
            />
            <span className="text-[11px] text-muted-foreground truncate">Fundo Card</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-background/50 border border-border/60">
            <input
              type="color"
              value={borderColor.startsWith("#") ? borderColor : "#334155"}
              onChange={(e) => applyBorderColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shrink-0"
              title="Cor livre para a borda dos cards"
            />
            <span className="text-[11px] text-muted-foreground truncate">Borda Card</span>
          </div>
        </div>
      </div>
    </div>
  );
}
