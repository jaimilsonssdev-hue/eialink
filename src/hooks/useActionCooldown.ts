import { useCallback, useRef } from "react";

/**
 * Trava lógica de cliques repetidos. Retorna `false` quando a ação foi
 * disparada há menos de `delayMs`, evitando chamadas duplicadas (acidentais
 * ou intencionais) para o backend.
 */
export function useActionCooldown(delayMs = 3000) {
  const lastRunRef = useRef<Record<string, number>>({});

  const canRun = useCallback(
    (key = "default") => {
      const now = Date.now();
      const last = lastRunRef.current[key] ?? 0;
      if (now - last < delayMs) return false;
      lastRunRef.current[key] = now;
      return true;
    },
    [delayMs],
  );

  const remainingSeconds = useCallback(
    (key = "default") => {
      const last = lastRunRef.current[key] ?? 0;
      return Math.max(0, Math.ceil((delayMs - (Date.now() - last)) / 1000));
    },
    [delayMs],
  );

  return { canRun, remainingSeconds };
}
