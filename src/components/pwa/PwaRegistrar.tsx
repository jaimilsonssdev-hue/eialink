import { useEffect } from "react";

/** Registers the offline shell and guarantees hot updates without stale cache locks. */
export function PwaRegistrar() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Force update check on every load
        void reg.update();
      })
      .catch((error) => {
        console.warn("Não foi possível ativar o modo offline da EIA Link.", error);
      });

    // Auto-reload to immediately activate the latest application bundle
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
}

