import React, { useEffect, useState } from "react";
import {
  StudioProRouterProvider,
  useLocation,
} from "@/modules/studiopro/lib/router";
import { CreativeTopNav } from "@/modules/studiopro/layout/CreativeTopNav";
import { CreativeDashboard } from "@/modules/studiopro/routes/CreativeDashboard";
import { CreativeChatPanel } from "@/modules/studiopro/editor/CreativeChatPanel";
import { CreativeCanvas } from "@/modules/studiopro/editor/CreativeCanvas";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { supabase } from "@/integrations/supabase/client";

function CreativeEditorView() {
  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Chat / Copiloto à esquerda (estilo Lovable) */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-[45%] md:h-full shrink-0">
        <CreativeChatPanel />
      </div>

      {/* Canvas / Preview Iframe à direita */}
      <div className="flex-1 h-[55%] md:h-full">
        <CreativeCanvas />
      </div>
    </div>
  );
}

function StudioContent() {
  const { pathname } = useLocation();

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
  const { createProject, selectProject, updateActiveProjectHtml } =
    useCreativeStudioStore();

  // Carrega lead da prospecção automaticamente caso venha com ?page=UUID
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
        const existingHtml = rawSocial.custom_html || "";

        const projId = createProject(data.display_name, data.id, data.slug);
        selectProject(projId);

        if (existingHtml) {
          updateActiveProjectHtml(existingHtml);
        }
      } catch (e) {
        console.warn("Aviso ao carregar página da prospecção:", e);
      }
    }

    loadPageFromProspecting();
  }, [pageId, createProject, selectProject, updateActiveProjectHtml]);

  return (
    <StudioProRouterProvider>
      <StudioContent />
    </StudioProRouterProvider>
  );
}

export default StudioProApp;
