import React, { useState } from "react";
import type { TechnicalBlueprintSection as TechnicalBlueprintSectionType } from "../types";
import { Crosshair, Cpu, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

interface TechnicalBlueprintProps {
  blueprint: TechnicalBlueprintSectionType;
  accentColor?: string;
  isLight?: boolean;
  businessName?: string;
}

export function TechnicalBlueprintSection({
  blueprint,
  accentColor = "#f59e0b",
  isLight = false,
  businessName = "Produto de Alta Performance",
}: TechnicalBlueprintProps) {
  const [activeSpecId, setActiveSpecId] = useState<string>(
    blueprint.specs && blueprint.specs.length > 0 ? blueprint.specs[0].id : ""
  );

  if (!blueprint || !blueprint.specs || blueprint.specs.length === 0) {
    return null;
  }

  const activeSpec = blueprint.specs.find((s) => s.id === activeSpecId) || blueprint.specs[0];

  return (
    <section
      id="blueprint"
      className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-8 py-20 sm:py-32 select-none overflow-hidden ${
        isLight ? "text-zinc-900" : "text-white"
      }`}
    >
      {/* Luz volumétrica de fundo (Spotlight estilo estúdio 3D Reebok) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] sm:w-[900px] rounded-full opacity-15 blur-[120px] mix-blend-screen"
        style={{ backgroundColor: accentColor }}
      />

      {/* 1. Header da Seção de Engenharia */}
      <div className="text-center mb-12 sm:mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-3">
          <Crosshair className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <span style={{ color: accentColor }}>
            {blueprint.tagline || "[SPEC::BLUEPRINT] ARQUITETURA & PRECISÃO"}
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight">
          {blueprint.headline || "Engenharia de Alta Performance"}
        </h2>
        <p
          className={`mt-3 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${
            isLight ? "text-zinc-600" : "text-zinc-400"
          }`}
        >
          {blueprint.subtitle ||
            `Cada detalhe da ${businessName} foi milimetricamente desenhado para superar os limites do padrão convencional.`}
        </p>
      </div>

      {/* 2. Palco Central: Produto com Pins de Raio-X & Mira Laser */}
      <div className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-8 lg:p-12 shadow-2xl overflow-hidden">
        {/* Linhas de Grid Milimétrico de Fundo (Blueprint Grid) */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Coluna da Esquerda / Centro: Imagem com Pins Flutuantes */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[300px] sm:min-h-[420px]">
            {blueprint.productImage ? (
              <img
                src={blueprint.productImage}
                alt={blueprint.headline || "Produto em Raio-X"}
                className="max-h-[380px] w-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)] transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5">
                <Cpu className="h-16 w-16 opacity-30 text-white" />
              </div>
            )}

            {/* Pins Interativos Conectados ao Produto */}
            {blueprint.specs.map((spec, idx) => {
              const isActive = spec.id === activeSpecId;
              const defaultPositions = [
                { top: "25%", left: "20%" },
                { top: "45%", right: "15%" },
                { bottom: "20%", left: "30%" },
                { bottom: "35%", right: "25%" },
              ];
              const pos = defaultPositions[idx % defaultPositions.length];

              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setActiveSpecId(spec.id)}
                  style={pos as React.CSSProperties}
                  className={`absolute group flex items-center gap-2 p-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "scale-110 z-20"
                      : "opacity-75 hover:opacity-100 hover:scale-105 z-10"
                  }`}
                  title={spec.title}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3 w-3 border-2 border-black"
                      style={{ backgroundColor: accentColor }}
                    />
                  </span>
                  <span
                    className={`hidden sm:inline-block font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border backdrop-blur-md transition-all ${
                      isActive
                        ? "bg-black/90 text-white border-white/40 shadow-lg"
                        : "bg-black/60 text-zinc-300 border-white/10"
                    }`}
                  >
                    {spec.tag || `[SPEC::0${idx + 1}]`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Coluna da Direita: Card de Foco da Especificação Ativa */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-black/40 border border-white/10"
                  style={{ color: accentColor }}
                >
                  {activeSpec.tag || "[SPEC::ACTUAL]"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                  SISTEMA VALIDADO
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white leading-snug">
                  {activeSpec.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activeSpec.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Calibragem de precisão para performance máxima</span>
              </div>
            </div>

            {/* Seletor Rápido em Pílulas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {blueprint.specs.map((spec, idx) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setActiveSpecId(spec.id)}
                  className={`text-[11px] font-mono uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    spec.id === activeSpecId
                      ? "bg-white text-zinc-950 font-bold border-white shadow-md scale-102"
                      : "bg-black/40 text-zinc-400 border-white/10 hover:text-white hover:border-white/20"
                  }`}
                >
                  {spec.tag || `0${idx + 1}`} • {spec.title.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grade Inferior de Detalhes de Engenharia (Bento Specs) */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {blueprint.specs.map((spec, idx) => {
          const isSelected = spec.id === activeSpecId;
          return (
            <div
              key={spec.id}
              onClick={() => setActiveSpecId(spec.id)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                isSelected
                  ? "border-white/40 bg-white/[0.08] shadow-lg -translate-y-1"
                  : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
                <span>{spec.tag || `[0${idx + 1}]`}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-tight text-white line-clamp-1">
                {spec.title}
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {spec.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
