import React, { useEffect, useRef } from "react";
import type { MarqueeItem } from "./types";

interface CinematicMarqueeProps {
  items: MarqueeItem[];
  speed?: number; // duração em segundos (ex: 20s, 50s, 80s, 120s, 180s)
  isLight?: boolean;
  accentColor?: string;
  className?: string;
}

export function CinematicMarquee({
  items,
  speed = 50,
  isLight = false,
  accentColor = "#f59e0b",
  className = "",
}: CinematicMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  // Garante velocidade válida (entre 15s e 240s)
  const effectiveSpeed = Math.max(15, Math.min(Number(speed) || 50, 240));

  // Assegura quantidade suficiente de itens para qualquer resolução de tela
  const rawItems = items && items.length > 0 ? items : [
    { text: "ATENDIMENTO EXCLUSIVO", icon: "★" },
    { text: "PADRÃO DE EXCELÊNCIA", icon: "⚡" },
    { text: "AGENDAMENTO ÁGIL", icon: "💎" },
  ];

  let baseList = [...rawItems];
  while (baseList.length < 5) {
    baseList = [...baseList, ...rawItems];
  }

  // Cria exatamente 2 metades idênticas para loop 100% contínuo de 0% a -50%
  const trackItems = [...baseList, ...baseList];

  // Controla a animação via Web Animations API nativa do navegador (60 FPS GPU, ultra precisa)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // Cancela animação anterior se existir
    if (animRef.current) {
      animRef.current.cancel();
    }

    const durationMs = effectiveSpeed * 1000;

    try {
      const anim = el.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: "translate3d(-50%, 0, 0)" },
        ],
        {
          duration: durationMs,
          iterations: Infinity,
          easing: "linear",
        }
      );

      animRef.current = anim;
    } catch {
      // Fallback gracioso para navegadores antigos sem Web Animations API
      el.style.animation = `cinematicMarqueeFallback_${effectiveSpeed}s ${effectiveSpeed}s linear infinite`;
    }

    return () => {
      if (animRef.current) {
        animRef.current.cancel();
      }
    };
  }, [effectiveSpeed, trackItems.length]);

  const handleMouseEnter = () => {
    if (animRef.current && animRef.current.playState === "running") {
      animRef.current.pause();
    }
  };

  const handleMouseLeave = () => {
    if (animRef.current && animRef.current.playState === "paused") {
      animRef.current.play();
    }
  };

  const itemColor =
    isLight && (accentColor === "#ffffff" || accentColor === "#f8fafc")
      ? "#09090b"
      : accentColor;

  return (
    <section
      className={`relative z-20 w-full overflow-hidden border-y py-3.5 backdrop-blur-md select-none ${
        isLight
          ? "border-zinc-200/90 bg-white/95 text-zinc-900 shadow-xs"
          : "border-white/10 bg-black/60 text-white"
      } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        @keyframes cinematicMarqueeFallback_${effectiveSpeed}s {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
      <div
        ref={trackRef}
        key={`marquee-track-${effectiveSpeed}-${trackItems.length}`}
        className="flex w-max items-center gap-8 will-change-transform cursor-default"
      >
        {trackItems.map((item, idx) => {
          const text = typeof item === "string" ? item : item?.text || "";
          const icon = typeof item === "object" ? item?.icon : "";
          if (!text) return null;
          return (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-3 text-xs md:text-sm font-bold tracking-widest uppercase"
            >
              {icon && <span className="opacity-90">{icon}</span>}
              <span style={{ color: itemColor }}>{text}</span>
              <span className={isLight ? "text-zinc-400" : "text-zinc-600"}>•</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
