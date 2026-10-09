import React, { useState, useEffect } from "react";
import { Link } from "@/modules/studiopro/lib/router";
import {
  Sparkles,
  CloudUpload,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Copy,
  SlidersHorizontal,
  Calendar,
  Bot,
  MapPin,
  MessageCircle,
  Palette,
} from "lucide-react";
import { DesignStyleModal } from "@/modules/studiopro/editor/DesignStyleModal";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function CreativeTopNav() {
  const { getActiveProject, updateActiveProjectHtml } = useCreativeStudioStore();
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Modal de Ferramentas / Features
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [features, setFeatures] = useState({
    agenda_enabled: true,
    ai_concierge_enabled: true,
    gps_enabled: true,
    whatsapp_enabled: true,
  });

  const activeProject = getActiveProject();
  const hasHtml = Boolean(activeProject?.html);

  // Retorno seguro ao painel ou páginas sem ficar preso no desktop
  const handleBack = () => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const pageId = params.get("page") || activeProject?.eialinkPageId;
      const projectId = params.get("project");

      if (document.referrer) {
        if (document.referrer.includes("/pages")) {
          window.location.href = "/pages";
          return;
        }
        if (document.referrer.includes("/admin/prospeccao")) {
          window.location.href = "/admin/prospeccao";
          return;
        }
        if (document.referrer.includes("/dashboard")) {
          window.location.href = "/dashboard";
          return;
        }
      }

      if (pageId) {
        window.location.href = "/pages";
        return;
      }

      if (projectId) {
        window.location.href = "/admin/prospeccao";
        return;
      }

      window.location.href = "/admin/prospeccao";
    } catch {
      window.location.href = "/pages";
    }
  };

  // Carrega configurações de ferramentas caso a página já tenha salva
  useEffect(() => {
    if (!activeProject?.eialinkPageId) return;

    supabase
      .from("bio_pages")
      .select("social_links")
      .eq("id", activeProject.eialinkPageId)
      .single()
      .then(({ data }) => {
        if (data?.social_links) {
          const s = data.social_links as Record<string, any>;
          setFeatures({
            agenda_enabled: s.agenda_enabled !== false,
            ai_concierge_enabled: s.ai_concierge_enabled !== false,
            gps_enabled: s.gps_enabled !== false,
            whatsapp_enabled: s.whatsapp_enabled !== false,
          });
        }
      });
  }, [activeProject?.eialinkPageId]);

function applyFeaturesToHtml(
  sourceHtml: string,
  featureFlags: {
    agenda_enabled: boolean;
    ai_concierge_enabled: boolean;
    gps_enabled: boolean;
    whatsapp_enabled: boolean;
  },
): string {
  if (!sourceHtml) return sourceHtml;

  let styleRules = "";
  if (!featureFlags.agenda_enabled) {
    styleRules += `[data-feature="agenda"], a[href*="/agendar"], .feature-agenda { display: none !important; } `;
  }
  if (!featureFlags.ai_concierge_enabled) {
    styleRules += `[data-feature="concierge"], [data-feature="ai-chat"], .feature-concierge { display: none !important; } `;
  }
  if (!featureFlags.gps_enabled) {
    styleRules += `[data-feature="gps"], [data-feature="map"], iframe[src*="maps"], a[href*="maps.google"], a[href*="waze.com"], .feature-gps { display: none !important; } `;
  }
  if (!featureFlags.whatsapp_enabled) {
    styleRules += `[data-feature="whatsapp"], a[href*="wa.me"], a[href*="whatsapp.com"], .feature-whatsapp { display: none !important; } `;
  }

  const styleTag = `<style id="eialink-feature-overrides">${styleRules}</style>`;

  if (sourceHtml.includes('id="eialink-feature-overrides"')) {
    return sourceHtml.replace(/<style id="eialink-feature-overrides">[\s\S]*?<\/style>/i, styleTag);
  }

  if (sourceHtml.includes("</head>")) {
    return sourceHtml.replace("</head>", `${styleTag}</head>`);
  }
  return `${styleTag}${sourceHtml}`;
}

  async function handleToggleFeature(key: keyof typeof features) {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);

    // Aplica na hora no HTML ativo para o usuário ver o Canvas mudar imediatamente
    let updatedHtml = activeProject?.html || "";
    if (activeProject?.html) {
      updatedHtml = applyFeaturesToHtml(activeProject.html, updated);
      updateActiveProjectHtml(updatedHtml);
    }

    if (activeProject?.eialinkPageId) {
      try {
        const { data: curPage } = await supabase
          .from("bio_pages")
          .select("social_links")
          .eq("id", activeProject.eialinkPageId)
          .single();

        const curSocial = (curPage?.social_links as Record<string, any>) || {};
        await supabase
          .from("bio_pages")
          .update({
            social_links: {
              ...curSocial,
              ...(updatedHtml ? { custom_html: updatedHtml } : {}),
              ...updated,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("id", activeProject.eialinkPageId);

        toast.success("Recurso atualizado no site!");
      } catch (e) {
        console.warn("Aviso ao salvar recurso:", e);
      }
    }
  }

  async function handlePublish() {
    if (!activeProject || !activeProject.html) {
      toast.error("Gere um site antes de publicar.");
      return;
    }

    setPublishing(true);
    try {
      const pageId = activeProject.eialinkPageId;
      let finalSlug = activeProject.slug || activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      if (pageId) {
        // Recupera dados atuais de social_links para não apagar dados anteriores
        const { data: curPage } = await supabase
          .from("bio_pages")
          .select("social_links")
          .eq("id", pageId)
          .single();

        const curSocial = (curPage?.social_links as Record<string, any>) || {};

        const { error } = await supabase
          .from("bio_pages")
          .update({
            social_links: {
              ...curSocial,
              custom_html: activeProject.html,
              is_creative_studio: true,
              ...features,
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
    <header className="h-12 bg-[#0a0a0f] border-b border-white/[0.08] flex items-center justify-between px-3 sm:px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
          title="Voltar ao Painel ou Páginas"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline font-semibold">Voltar</span>
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={11} />
          </div>
          <span className="text-xs font-semibold text-zinc-200 truncate max-w-[120px] sm:max-w-xs">
            {activeProject?.name || "Estúdio Criativo"}
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase hidden md:inline">
            Gemini 3.8
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Botão de Design & Estilo Visual No-Code */}
        <button
          type="button"
          onClick={() => setShowDesignModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer"
          title="Personalizar tipografia, gradientes de fundo, botões e efeitos modernos"
        >
          <Palette size={13} />
          <span className="hidden sm:inline">Design & Estilo</span>
        </button>

        {/* Botão de Controle de Ferramentas / Recursos */}
        <button
          type="button"
          onClick={() => setShowFeaturesModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all border border-white/10"
          title="Ligar ou desligar Agenda, Atendente, GPS e WhatsApp"
        >
          <SlidersHorizontal size={13} className="text-emerald-400" />
          <span className="hidden sm:inline">Recursos</span>
        </button>

        <button
          onClick={handlePublish}
          disabled={!hasHtml || publishing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CloudUpload size={13} />
          <span>{publishing ? "Publicando..." : "Publicar"}</span>
        </button>
      </div>

      {/* Modal de Recursos & Ferramentas Nativas */}
      <Dialog open={showFeaturesModal} onOpenChange={setShowFeaturesModal}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
              Recursos & Ferramentas da Página
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Ligue ou desligue as funcionalidades nativas do site conforme o perfil do cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* 1. Agenda Online */}
            <div className="flex items-start justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">Agenda Online & Reservas</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Permite que os clientes agendem horários no link <code>/agendar</code>.
                </p>
                <div className="pt-1">
                  <a
                    href="/agenda"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Gerenciar Horários no Painel da Agenda <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFeature("agenda_enabled")}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  features.agenda_enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    features.agenda_enabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* 2. Atendente com IA */}
            <div className="flex items-start justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-teal-400" />
                  <span className="text-xs font-bold text-zinc-200">Atendente Virtual com IA</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Chat concierge que tira dúvidas e atende clientes 24/7.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFeature("ai_concierge_enabled")}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  features.ai_concierge_enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    features.ai_concierge_enabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* 3. Mapa Interativo & GPS */}
            <div className="flex items-start justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-cyan-400" />
                  <span className="text-xs font-bold text-zinc-200">Mapa & GPS (Maps / Waze)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Iframe com localização e botões diretos de rota no Google Maps e Waze.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFeature("gps_enabled")}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  features.gps_enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    features.gps_enabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* 4. WhatsApp Flutuante */}
            <div className="flex items-start justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">WhatsApp Oficial Pulsante</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Botão flutuante no canto da tela para contato imediato.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFeature("whatsapp_enabled")}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  features.whatsapp_enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    features.whatsapp_enabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <span>Acessar</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização Visual No-Code (Tipografia, Cores, Efeitos e Fotos) */}
      <DesignStyleModal
        open={showDesignModal}
        onOpenChange={setShowDesignModal}
      />
    </header>
  );
}
