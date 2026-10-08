import React, { useRef, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Code2,
  Eye,
  Sparkles,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";

export function CreativeCanvas() {
  const { getActiveProject, previewDevice, setPreviewDevice, isGenerating } =
    useCreativeStudioStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activeProject = getActiveProject();
  const html = activeProject?.html || "";

  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(
        html ||
          `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#09090b;color:#71717a;font-family:sans-serif;font-size:14px;">Aguardando geração do site...</body></html>`,
      );
      doc.close();
    }
  }, [html]);

  const deviceWidths = {
    desktop: "w-full",
    tablet: "max-w-[768px]",
    mobile: "max-w-[390px]",
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08070b] overflow-hidden relative">
      {/* Barra de Ferramentas Superior do Canvas */}
      <div className="h-12 border-b border-white/[0.06] bg-zinc-950/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              previewDevice === "desktop"
                ? "bg-emerald-500/10 text-emerald-400 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Desktop"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setPreviewDevice("tablet")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              previewDevice === "tablet"
                ? "bg-emerald-500/10 text-emerald-400 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Tablet"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setPreviewDevice("mobile")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              previewDevice === "mobile"
                ? "bg-emerald-500/10 text-emerald-400 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Celular"
          >
            <Smartphone size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {html && (
            <>
              <button
                onClick={() => {
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors border border-white/[0.06]"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Aba Cheia</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Área do Iframe */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden relative">
        <div
          className={`h-full ${deviceWidths[previewDevice]} transition-all duration-300 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-zinc-950 flex flex-col`}
        >
          <iframe
            ref={iframeRef}
            title="Prévia do Estúdio Criativo"
            className="w-full h-full border-none bg-zinc-950"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

