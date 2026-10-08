import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Wand2,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import {
  planSiteBriefing,
  generateSiteHtml,
} from "@/modules/studiopro/lib/creativeEngineService";
import { toast } from "sonner";

export function CreativeChatPanel() {
  const [input, setInput] = useState("");
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const {
    getActiveProject,
    mode,
    setMode,
    isGenerating,
    statusMessage,
    setIsGenerating,
    addChatMessage,
    updateActiveProjectHtml,
    updateActiveProjectBriefing,
  } = useCreativeStudioStore();

  const activeProject = getActiveProject();
  const messages = activeProject?.messages || [];
  const currentHtml = activeProject?.html || "";

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput("");
    const userMsgId = `user-${Date.now()}`;
    addChatMessage({
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });

    try {
      if (mode === "plan" && !currentHtml) {
        // MODO 1: Planejar primeiro
        setIsGenerating(true, "Elaborando plano estratégico de design...");
        const briefing = await planSiteBriefing(text, messages);
        setIsGenerating(false);

        updateActiveProjectBriefing(briefing);
        addChatMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: briefing,
          timestamp: Date.now(),
        });
      } else {
        // MODO 2: Construir / Ajustar
        const isIteration = Boolean(currentHtml);
        setIsGenerating(
          true,
          isIteration
            ? "Aplicando ajustes e refinando visual..."
            : "Gerando código completo do site no padrão Lovable...",
        );

        const newHtml = await generateSiteHtml(text, isIteration ? currentHtml : undefined);
        setIsGenerating(false);

        updateActiveProjectHtml(newHtml);
        addChatMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: isIteration
            ? "✨ Ajuste concluído! Veja o resultado atualizado na tela ao lado."
            : "🎉 Seu site foi gerado com sucesso! Você pode ver a prévia ao lado ou pedir ajustes finos por aqui.",
          timestamp: Date.now(),
        });
        toast.success("Site atualizado na tela!");
      }
    } catch (err: any) {
      setIsGenerating(false);
      console.error(err);
      const msg = err.message || "Erro ao conectar à API do Google AI Studio.";
      toast.error(msg);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: `⚠️ Não foi possível processar: ${msg}`,
        timestamp: Date.now(),
      });
    }
  }

  async function handleApproveAndBuild() {
    if (!activeProject?.briefing || isGenerating) return;

    try {
      setIsGenerating(true, "Construindo o site completo a partir do plano aprovado...");
      const html = await generateSiteHtml(activeProject.briefing);
      setIsGenerating(false);

      updateActiveProjectHtml(html);
      addChatMessage({
        id: `ai-build-${Date.now()}`,
        role: "assistant",
        content:
          "🚀 O site foi totalmente construído e aplicado! Diga o que deseja refinar ou clique em 'Publicar' para subir no Cloudflare.",
        timestamp: Date.now(),
      });
      toast.success("Site gerado com sucesso!");
    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err.message || "Erro ao gerar site.");
    }
  }

  const modeLabels = {
    plan: "Planejar",
    build: "Construir",
    chat: "Conversar",
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e12] border-r border-white/[0.08] relative">
      {/* Cabeçalho do Chat */}
      <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100">
              Copiloto do Estúdio
            </h2>
            <p className="text-[10px] text-zinc-400">Google AI Studio • Gemini</p>
          </div>
        </div>

        {/* Seletor de Modo */}
        <div className="relative">
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition-all hover:bg-zinc-850"
          >
            <span>{modeLabels[mode]}</span>
            <ChevronDown size={12} className="text-zinc-500" />
          </button>

          {showModeDropdown && (
            <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl p-1 text-left backdrop-blur-xl">
              <button
                onClick={() => {
                  setMode("plan");
                  setShowModeDropdown(false);
                }}
                className={`w-full flex flex-col px-2.5 py-2 rounded-lg text-left transition-colors ${
                  mode === "plan" ? "bg-emerald-500/10 text-emerald-300" : "hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                <span className="text-xs font-semibold">Planejar</span>
                <span className="text-[10px] text-zinc-400">Cria briefing para você aprovar</span>
              </button>
              <button
                onClick={() => {
                  setMode("build");
                  setShowModeDropdown(false);
                }}
                className={`w-full flex flex-col px-2.5 py-2 rounded-lg text-left transition-colors ${
                  mode === "build" ? "bg-emerald-500/10 text-emerald-300" : "hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                <span className="text-xs font-semibold">Construir</span>
                <span className="text-[10px] text-zinc-400">Gera ou altera diretamente</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-[12.5px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-100 rounded-br-xs border border-white/[0.08]"
                  : "bg-zinc-900/80 text-zinc-200 rounded-bl-xs border border-white/[0.06] shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Botão de aprovação caso seja um plano */}
              {msg.role === "assistant" &&
                activeProject?.briefing &&
                !currentHtml && (
                  <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Pronto para gerar?</span>
                    <button
                      onClick={handleApproveAndBuild}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Wand2 size={13} />
                      Aprovar & Gerar Site
                    </button>
                  </div>
                )}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-2.5 items-center p-3 rounded-xl bg-zinc-900/60 border border-emerald-500/20 text-emerald-400 text-xs animate-pulse">
            <RefreshCw size={13} className="animate-spin text-emerald-400" />
            <span>{statusMessage || "Processando com Google Gemini..."}</span>
          </div>
        )}
      </div>

      {/* Input de Comando Lovable */}
      <div className="p-3 border-t border-white/[0.08] bg-zinc-950/80 backdrop-blur-md">
        <div className="relative rounded-2xl bg-zinc-900 border border-white/[0.09] focus-within:border-emerald-500/60 transition-all shadow-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              currentHtml
                ? "Peça uma alteração (ex: 'coloque fundo escuro e troque a foto')..."
                : "Descreva a empresa para planejar o site..."
            }
            rows={2}
            className="w-full bg-transparent p-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500">
                Shift+Enter para quebrar linha
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-semibold hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

