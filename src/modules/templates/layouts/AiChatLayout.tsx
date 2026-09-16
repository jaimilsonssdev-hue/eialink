import type { ReactNode } from "react";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { AiAssistantChat } from "@/components/public/AiAssistantChat";

/**
 * AiChatLayout: Modelo de Atendimento Conversacional Interativo estilo Marrooia.
 * Transforma a bio page em um chat interativo de alta conversão com fluxo guiado
 * (estilo Typebot / Manychat), triagem de orçamentos e disparo formatado para WhatsApp.
 */
export class AiChatLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "ai-chat" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "ai-chat";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, products = [], onTrack } = ctx;

    return (
      <div className="w-full min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-lg min-h-screen flex flex-col shadow-2xl border-x border-border/60">
          <AiAssistantChat
            bio={bio}
            products={products}
            isFullPage={true}
            onTrack={onTrack}
          />
        </div>
      </div>
    );
  }
}

