/**
 * Skill de Animações, Micro-Interações e Componentes Dinâmicos (Motion Kit)
 * Injeta movimento, elegância e ritmo visual aos sites gerados, eliminando o aspecto de página estática.
 */

export interface MotionKitOptions {
  speedSeconds?: number;
  direction?: "left" | "right";
  bgClass?: string;
  textClass?: string;
}

/**
 * Retorna as regras de CSS essenciais para animações fluidas em qualquer página HTML
 */
export function getMotionStyles(): string {
  return `
    @keyframes marqueeScroll {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee-infinite {
      display: flex;
      width: max-content;
      animation: marqueeScroll 28s linear infinite;
    }
    .animate-marquee-infinite:hover {
      animation-play-state: paused;
    }
    @keyframes subtlePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(1.03); }
    }
    .pulse-subtle {
      animation: subtlePulse 3s ease-in-out infinite;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
}

/**
 * Renderiza uma faixa de novidades / destaques infinita (Marquee)
 */
export function renderMarquee(phrases: string[], opts: MotionKitOptions = {}): string {
  if (!phrases || phrases.length === 0) return "";

  const items = [...phrases, ...phrases]; // Duplica para criar o loop visual perfeito sem saltos
  const bgClass = opts.bgClass || "bg-zinc-900/90 border-y border-white/10";
  const textClass = opts.textClass || "text-zinc-300";

  return `
  <!-- Faixa Dinâmica Contínua (Marquee Motion Kit) -->
  <div class="relative w-full overflow-hidden py-2.5 ${bgClass} select-none">
    <div class="animate-marquee-infinite flex items-center gap-6 text-xs font-black tracking-wider uppercase ${textClass}">
      ${items
        .map(
          (text) => `
        <span class="inline-flex items-center gap-2 whitespace-nowrap">
          <span>${text}</span>
          <span class="text-white/20">✦</span>
        </span>
      `,
        )
        .join("")}
    </div>
  </div>
  `;
}

/**
 * Renderiza o bloco de prova social e selos de credibilidade
 */
export function renderSocialProof(rating: number, reviewsCount: number, badges: string[] = []): string {
  const stars = "★".repeat(Math.round(rating));

  return `
  <!-- Bloco de Prova Social & Autoridade (Motion Kit) -->
  <div class="flex flex-wrap items-center justify-center gap-2 py-1">
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold shadow-xs">
      <span class="text-amber-400 font-bold">${stars}</span>
      <span>${rating.toFixed(1)} no Google</span>
      <span class="text-amber-500/40">·</span>
      <span>(${reviewsCount} avaliações)</span>
    </div>
    ${badges
      .map(
        (b) => `
      <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-medium">
        <span>${b}</span>
      </div>
    `,
      )
      .join("")}
  </div>
  `;
}

