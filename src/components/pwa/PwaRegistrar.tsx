import { useEffect } from "react";

/** Registers the offline shell only in a production browser context. */
export function PwaRegistrar() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      // A PWA failure must never prevent the SaaS from loading normally.
      console.warn("Não foi possível ativar o modo offline da EIA Link.", error);
    });
  }, []);

  return null;
}
