import React, { useEffect, useState } from "react";
import {
  StudioProRouterProvider,
  useLocation,
  useNavigate,
} from "@/modules/studiopro/lib/router";
import { CreativeTopNav } from "@/modules/studiopro/layout/CreativeTopNav";
import { CreativeDashboard } from "@/modules/studiopro/routes/CreativeDashboard";
import { CreativeChatPanel } from "@/modules/studiopro/editor/CreativeChatPanel";
import { CreativeCanvas } from "@/modules/studiopro/editor/CreativeCanvas";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { supabase } from "@/integrations/supabase/client";
import { listCreativeStudioProjectsFn } from "@/modules/studio/studio.functions";
import { MessageSquare, Eye, PanelLeftClose, PanelLeftOpen } from "lucide-react";

function CreativeEditorView() {
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [desktopChatOpen, setDesktopChatOpen] = useState(true);
  const { getActiveProject } = useCreativeStudioStore();
  const activeProject = getActiveProject();

  // Se o site acabou de ser gerado e não estávamos no preview no mobile, facilita a transição
  useEffect(() => {
    if (activeProject?.html && activeProject.html.length > 100) {
      // Deixa disponível para o usuário ver o site
    }
  }, [activeProject?.html]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Barra de Alternância de Abas Exclusiva para Mobile (< md) */}
      <div className="flex md:hidden items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-white/10 w-full max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === "chat"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare size={13} />
            <span>Copiloto IA</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === "preview"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye size={13} />
            <span>Prévia do Site</span>
            {activeProject?.html && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo do Editor com Responsividade Completa */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        {/* Chat / Copiloto: No mobile exibe se mobileTab === 'chat'; no desktop controla com desktopChatOpen */}
        <div
          className={`${
            mobileTab === "chat" ? "flex" : "hidden"
          } md:flex flex-col ${
            desktopChatOpen ? "md:w-[380px] lg:w-[420px]" : "md:hidden"
          } w-full h-full shrink-0 border-r border-white/[0.06] bg-zinc-950 transition-all`}
        >
          <CreativeChatPanel />
        </div>

        {/* Canvas / Prévia do Site: No mobile exibe se mobileTab === 'preview'; no desktop ocupa 100% ou restante */}
        <div
          className={`${
            mobileTab === "preview" ? "flex" : "hidden"
          } md:flex flex-1 flex-col h-full bg-[#08070b] overflow-hidden relative`}
        >
          <CreativeCanvas
            desktopChatOpen={desktopChatOpen}
            onToggleDesktopChat={() => setDesktopChatOpen((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}

function StudioContent({ pageId }: { pageId?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Se veio com pageId e está na raiz inicial, direciona para o editor diretamente
  useEffect(() => {
    if (pageId && (pathname === "/" || pathname === "")) {
      navigate("/editor");
    }
  }, [pageId]);

  if (pathname === "/editor" || pathname.startsWith("/editor")) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden pt-12 bg-[#09090b]">
        <CreativeTopNav />
        <CreativeEditorView />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#09090b]">
      <CreativeDashboard />
    </div>
  );
}

interface CreativeStudioAppProps {
  pageId?: string;
  projectId?: string;
}

export function StudioProApp({ pageId }: CreativeStudioAppProps) {
  const {
    projects,
    createProject,
    selectProject,
    updateActiveProjectHtml,
    updateActiveProjectBriefing,
    addChatMessage,
    setProjects,
  } = useCreativeStudioStore();

  // Sincroniza projetos da nuvem para que o que foi feito no Mobile apareça no Desktop e vice-versa
  useEffect(() => {
    async function syncCloudProjects() {
      try {
        const res = await listCreativeStudioProjectsFn();
        if (res?.projects && res.projects.length > 0) {
          setProjects(res.projects as any);
        }
      } catch (err) {
        console.warn("[StudioProApp] Não foi possível carregar projetos da nuvem:", err);
      }
    }
    syncCloudProjects();
  }, [setProjects]);

  // Carrega lead da prospecção automaticamente caso venha com ?page=UUID com DEDUPLICAÇÃO
  useEffect(() => {
    if (!pageId) return;

    async function loadPageFromProspecting() {
      try {
        const { data, error } = await supabase
          .from("bio_pages")
          .select("*")
          .eq("id", pageId)
          .single();

        if (error || !data) return;

        const rawSocial = (data.social_links as Record<string, any>) || {};
        const existingHtml = (data as any).custom_html || rawSocial.custom_html || "";

        const leadBriefing = `[CONTEXTO DO LEAD / SITE EXISTENTE]:\n- Empresa: ${data.display_name}\n- Slug: ${data.slug}\n- WhatsApp: ${data.whatsapp || rawSocial.whatsapp || "Não informado"}\n- Instagram: ${data.instagram || rawSocial.instagram || "Não informado"}\n- Cidade: ${rawSocial.address || "Local"}\n- Nicho: ${rawSocial.niche || "Comércio/Serviço"}\n- Descrição: ${data.description || "Página demonstrativa"}`;

        // Deduplica: procura se já existe projeto registrado para esta página
        const existingProj = projects.find(
          (p) => p.eialinkPageId === data.id || (data.slug && p.slug === data.slug),
        );

        if (existingProj) {
          selectProject(existingProj.id);
          // Se o banco tiver HTML mais recente, atualiza o projeto ativo
          if (existingHtml && (!existingProj.html || existingProj.html.length < 50)) {
            updateActiveProjectHtml(existingHtml);
          }
          if (!existingProj.briefing) {
            updateActiveProjectBriefing(leadBriefing);
          }
        } else {
          // Cria apenas se realmente não existir projeto para este lead
          const projId = createProject(data.display_name, data.id, data.slug);
          selectProject(projId);
          updateActiveProjectBriefing(leadBriefing);
          if (existingHtml) {
            updateActiveProjectHtml(existingHtml);
          }

          addChatMessage({
            id: `welcome-${data.id}-${Date.now()}`,
            role: "assistant",
            content: `👋 Olá! Carreguei o projeto de **${data.display_name}** (${data.slug}).\n\n📌 **Dados do Lead:**\n- **WhatsApp:** ${data.whatsapp || rawSocial.whatsapp || "Não informado"}\n- **Instagram:** ${data.instagram || rawSocial.instagram || "Não informado"}\n- **Nicho:** ${rawSocial.niche || "Geral"}\n\nA prévia já está visível na tela ao lado. Como gostaria de aprimorá-la? Você pode pedir alterações de layout, novos blocos, ajustar fotos e cores ou gerar um site 100% customizado!`,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.warn("Aviso ao carregar página da prospecção:", e);
      }
    }

    loadPageFromProspecting();
  }, [pageId, createProject, selectProject, updateActiveProjectHtml, updateActiveProjectBriefing, addChatMessage, projects]);

  return (
    <StudioProRouterProvider>
      <StudioContent pageId={pageId} />
    </StudioProRouterProvider>
  );
}

export default StudioProApp;
