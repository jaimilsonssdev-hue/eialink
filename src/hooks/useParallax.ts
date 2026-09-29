import { useEffect, useRef } from "react";

/**
 * Sets a `--parallax` custom property (-1..1) on the element while it is visible,
 * so CSS can offset decorative layers as the page scrolls.
 * Disabled on small screens and when the user prefers reduced motion.
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 640px)");
    if (reduced.matches || small.matches) return;

    let frame = 0;
    let visible = false;

    const apply = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const progress = 1 - (rect.top + rect.height / 2) / window.innerHeight;
      element.style.setProperty("--parallax", Math.max(-1, Math.min(1, progress)).toFixed(3));
    };

    const onScroll = () => {
      if (!visible || frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) apply();
      },
      { threshold: 0 },
    );
    observer.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

/**
 * Immersive parallax scene: observes every decorative layer inside the returned
 * container and keeps a `--parallax` custom property (-1..1) updated while it is
 * visible. Works on any template because it targets generic depth hooks
 * (`[data-parallax-layer]`, cover images) instead of layout-specific markup.
 * Only GPU-friendly transforms are driven from CSS, and it stays off when the
 * visitor prefers reduced motion.
 */
export function useParallaxScene<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const SELECTOR = "[data-parallax-layer], header img, .parallax-hero-image, .parallax-layer";
    let frame = 0;
    const visible = new Set<HTMLElement>();

    const apply = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      visible.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const progress = 1 - (rect.top + rect.height / 2) / viewport;
        element.style.setProperty("--parallax", Math.max(-1, Math.min(1, progress)).toFixed(3));
      });
    };

    const onScroll = () => {
      if (frame || visible.size === 0) return;
      frame = window.requestAnimationFrame(apply);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(element);
          else visible.delete(element);
        }
        apply();
      },
      { threshold: 0 },
    );

    const observeAll = () => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => observer.observe(element));
    };

    observeAll();
    const mutations = new MutationObserver(observeAll);
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      visible.forEach((element) => element.style.removeProperty("--parallax"));
    };
  }, [enabled]);

  return ref;
}
