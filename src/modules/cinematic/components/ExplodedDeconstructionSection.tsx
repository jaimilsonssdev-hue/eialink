import React, { useEffect, useRef, useState } from "react";
import { Layers, Sparkles, Eye, RotateCcw, ChevronRight } from "lucide-react";
import { animate } from "animejs";
import type { ExplodedDeconstructionSection as ExplodedDeconstructionType, DeconstructedLayer } from "../types";

interface Props {
  data: ExplodedDeconstructionType;
}

export function ExplodedDeconstructionSection({ data }: Props) {
  const [isExploded, setIsExploded] = useState(true);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const layerElements = layersRef.current.filter(Boolean);
    if (!layerElements.length) return;

    if (isExploded) {
      // Explode layers outwards with elastic spring
      layerElements.forEach((el, index) => {
        if (!el) return;
        const total = layerElements.length;
        const offset = (index - (total - 1) / 2) * 55;
        try {
          animate(el, {
            translateY: offset,
            scale: 1,
            opacity: 1,
            rotateX: -15,
            duration: 900,
            ease: "outElastic(1, .75)",
          });
        } catch {
          // fallback if anime animate encounters any issue
          el.style.transform = `translateY(${offset}px) scale(1) rotateX(-15deg)`;
          el.style.opacity = "1";
        }
      });
    } else {
      // Assemble layers back into unified product
      layerElements.forEach((el) => {
        if (!el) return;
        try {
          animate(el, {
            translateY: 0,
            scale: 0.98,
            opacity: 0.85,
            rotateX: 0,
            duration: 650,
            ease: "outCubic",
          });
        } catch {
          el.style.transform = "translateY(0px) scale(0.98) rotateX(0deg)";
          el.style.opacity = "0.85";
        }
      });
    }
  }, [isExploded]);

  const activeLayer = data.layers.find((l) => l.id === activeLayerId) || data.layers[0];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-zinc-950 text-white border-t border-white/[0.08]">
      {/* Background blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/[0.08]">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>{data.kicker || "Engenharia & Desconstrução"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-display">
              {data.title}
            </h2>
            {data.subtitle && (
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {data.subtitle}
              </p>
            )}
          </div>

          {/* Toggle Controls */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => setIsExploded(false)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isExploded
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Vista Montada</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExploded(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isExploded
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Vista Explodida (Anime.js)</span>
            </button>
          </div>
        </div>

        {/* Interactive Stage */}
        <div className="mt-12 grid lg:grid-cols-12 gap-8 items-center" ref={containerRef}>
          {/* Exploded Visual Stack (Anime.js Stage) */}
          <div className="lg:col-span-7 relative min-h-[420px] sm:min-h-[500px] flex items-center justify-center p-6 rounded-2xl border border-white/[0.08] bg-zinc-900/30 backdrop-blur-md">
            <div
              className="relative w-full max-w-sm h-72 sm:h-80 flex flex-col items-center justify-center"
              style={{ perspective: "1000px" }}
            >
              {data.layers.map((layer, index) => {
                const isSelected = (activeLayerId || data.layers[0].id) === layer.id;
                return (
                  <div
                    key={layer.id}
                    ref={(el) => {
                      layersRef.current[index] = el;
                    }}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`absolute inset-x-0 mx-auto w-full max-w-[280px] p-4 rounded-xl border backdrop-blur-xl cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-400 bg-zinc-900/95 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/40 z-20"
                        : "border-white/[0.08] bg-zinc-900/70 hover:border-white/20 z-10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-500">#{layer.order || index + 1}</span>
                      <span className="font-bold text-white text-xs">{layer.name}</span>
                      {layer.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                          {layer.badge}
                        </span>
                      )}
                    </div>
                    {layer.imageUrl && (
                      <div className="mt-2 h-20 w-full overflow-hidden rounded-lg bg-zinc-950/60">
                        <img
                          src={layer.imageUrl}
                          alt={layer.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer Detail HUD Inspector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  Camada {activeLayer.order || 1} de {data.layers.length}
                </span>
                {activeLayer.badge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 font-semibold">
                    {activeLayer.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{activeLayer.name}</h3>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  {activeLayer.description}
                </p>
              </div>

              {activeLayer.specs && activeLayer.specs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Especificações Técnicas
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {activeLayer.specs.map((spec, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg border border-white/[0.06] bg-zinc-950/40 text-xs"
                      >
                        <span className="text-zinc-500 block text-[10px] uppercase font-mono">{spec.label}</span>
                        <span className="text-white font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick layer selector list */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                Todas as Camadas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.layers.map((layer, index) => {
                  const isSelected = (activeLayerId || data.layers[0].id) === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayerId(layer.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-amber-400/50 bg-amber-400/10 text-white font-semibold"
                          : "border-white/[0.06] bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span className="truncate">#{index + 1} {layer.name}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
