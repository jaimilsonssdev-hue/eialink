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
