import React, { useState } from "react";
import { Link } from "@/modules/studiopro/lib/router";
import {
  Sparkles,
  CloudUpload,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CreativeTopNav() {
  const { getActiveProject } = useCreativeStudioStore();
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const activeProject = getActiveProject();
  const hasHtml = Boolean(activeProject?.html);

  async function handlePublish() {
    if (!activeProject || !activeProject.html) {
      toast.error("Gere um site antes de publicar.");
      return;
    }

    setPublishing(true);
    try {
      // Se possui eialinkPageId vinculado (vindo da prospecção ou salvo)
      const pageId = activeProject.eialinkPageId;
      let finalSlug = activeProject.slug || activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      if (pageId) {
        // Atualiza a página no Supabase para renderizar este HTML direto na Cloudflare
        const { error } = await supabase
          .from("bio_pages")
          .update({
            social_links: {
              custom_html: activeProject.html,
              is_creative_studio: true,
              updated_at: new Date().toISOString(),
            },
            published: true,
          })
          .eq("id", pageId);

        if (error) throw error;
      }

      const url = `https://${finalSlug}.eialink.com.br`;
      setPublishedUrl(url);
      setShowPublishModal(true);
      toast.success("Site publicado na Cloudflare!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao publicar no Cloudflare.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <header className="h-12 bg-[#0a0a0f] border-b border-white/[0.08] flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Voltar</span>
        </Link>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={11} />
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            {activeProject?.name || "Estúdio Criativo"}
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase">
            AI Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={handlePublish}
          disabled={!hasHtml || publishing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CloudUpload size={13} />
          <span>{publishing ? "Publicando..." : "Publicar"}</span>
        </button>
      </div>

      {/* Modal de Publicação */}
      {showPublishModal && publishedUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-5 shadow-2xl text-left animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CheckCircle2 size={18} />
              <h3 className="text-sm font-bold text-white">Publicado com Sucesso!</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              O site está ativo e servido pela infraestrutura de borda da Cloudflare no subdomínio:
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-white/10 mb-4">
              <span className="text-xs text-zinc-200 font-mono truncate">{publishedUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publishedUrl);
                  toast.success("Link copiado!");
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-white"
                title="Copiar"
              >
                <Copy size={13} />
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Fechar
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400"
              >
                <span>Acessar Site</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

