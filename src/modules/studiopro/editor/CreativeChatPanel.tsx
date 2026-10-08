import React, { useState, useRef } from "react";
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
  Paperclip,
  Image as ImageIcon,
  X,
  AlertTriangle,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import {
  planSiteBriefing,
  generateSiteHtml,
  getGeminiApiKey,
  type MultimodalAttachment,
} from "@/modules/studiopro/lib/creativeEngineService";
import {
  generateCreativeSiteFn,
  planCreativeSiteBriefingFn,
  syncCreativeStudioProjectFn,
} from "@/modules/studio/studio.functions";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export function CreativeChatPanel() {
  const [input, setInput] = useState("");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
      dataBase64: string;
      previewUrl?: string;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isText = file.type.includes("text") || file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt");

      if (!isImg && !isPdf && !isText) {
        toast.error(`Formato de "${file.name}" não suportado. Envie imagens, PDFs ou textos.`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`O arquivo "${file.name}" excede o limite de 20MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fullDataUrl = uploadEvent.target?.result as string;
        if (fullDataUrl) {
          const base64Pure = fullDataUrl.includes(",") ? fullDataUrl.split(",")[1] : fullDataUrl;
          const mime = file.type || (isPdf ? "application/pdf" : "text/plain");

          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              mimeType: mime,
              size: file.size,
              dataBase64: base64Pure,
              previewUrl: isImg ? fullDataUrl : undefined,
            },
          ]);
          toast.success(`"${file.name}" anexado com sucesso!`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  }

  async function handleSend() {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || isGenerating) return;

    const currentAttachments: MultimodalAttachment[] = attachedFiles.map((f) => ({
      name: f.name,
      mimeType: f.mimeType,
      dataBase64: f.dataBase64,
    }));

    let fullPrompt = text;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map((f) => f.name).join(", ");
      fullPrompt = `${text}\n\n[BASE DE CONHECIMENTO & ARQUIVOS ANEXADOS]:\nForam anexados ${attachedFiles.length} documento(s)/foto(s): ${fileNames}.\nAnalise os documentos/fotos anexados com atenção máxima para extrair produtos, serviços, preços reais e identidade da marca para a geração!`;
    }

    setInput("");
    setAttachedFiles([]);

    const userMsgId = `user-${Date.now()}`;
    addChatMessage({
      id: userMsgId,
      role: "user",
      content: fullPrompt,
      timestamp: Date.now(),
      attachments: currentAttachments,
    });

    try {
      if (mode === "plan" && !currentHtml) {
        setIsGenerating(true, "Elaborando plano estratégico com Gemini 3.8 Flash...");
        let briefing = "";
        const clientApiKey = getGeminiApiKey() || undefined;
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Tempo limite excedido na nuvem")), 35000),
          );
          const res = await Promise.race([
            planCreativeSiteBriefingFn({
              data: {
                prompt: fullPrompt,
                history: messages.map((m) => ({ role: m.role, content: m.content })),
                apiKey: clientApiKey,
                attachments: currentAttachments,
              },
            }),
            timeoutPromise,
          ]);
          briefing = res.briefing;
        } catch (serverErr: any) {
          console.warn("[CreativeChat] Fallback para briefing local:", serverErr);
          briefing = await planSiteBriefing(fullPrompt, messages, clientApiKey, currentAttachments);
        }
        setIsGenerating(false);

        updateActiveProjectBriefing(briefing);
        addChatMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: briefing,
          timestamp: Date.now(),
        });
      } else {
        const isIteration = Boolean(currentHtml);
        setIsGenerating(
          true,
          isIteration
            ? "Aplicando ajustes no site com Gemini 3.8 Flash..."
            : "Gerando site completo com Gemini 3.8 Flash...",
        );

        let newHtml = "";
        const clientApiKey = getGeminiApiKey() || undefined;
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Tempo limite excedido no servidor")), 50000),
          );
          const res = await Promise.race([
            generateCreativeSiteFn({
              data: {
                briefingOrPrompt: fullPrompt,
                existingHtml: isIteration ? currentHtml : undefined,
                projectId: activeProject?.id,
                projectName: activeProject?.name,
                apiKey: clientApiKey,
                attachments: currentAttachments,
              },
            }),
            timeoutPromise,
          ]);
          newHtml = res.html;
        } catch (serverErr) {
          console.warn("[CreativeChat] Fallback para geração direta do cliente:", serverErr);
          newHtml = await generateSiteHtml(fullPrompt, isIteration ? currentHtml : undefined, clientApiKey, currentAttachments);
        }
        setIsGenerating(false);

        if (!newHtml || newHtml.length < 50) {
          throw new Error("A IA retornou uma resposta vazia. Tente clicar em gerar novamente.");
        }

        updateActiveProjectHtml(newHtml);
        addChatMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: isIteration
            ? "✨ Ajuste concluído! Veja o resultado atualizado na tela ao lado."
            : "🎉 Seu site foi gerado com sucesso! Você pode ver a prévia ao lado ou pedir ajustes finos por aqui.",
          timestamp: Date.now(),
        });
        toast.success("Site gerado e sincronizado com sucesso!");
      }
    } catch (err: any) {
      setIsGenerating(false);
      console.error(err);
      const msg = err.message || "Erro ao conectar à API do Google AI Studio.";
      toast.error(msg);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: `⚠️ Não foi possível processar: ${msg}. Por favor, clique novamente ou verifique se sua chave do Google AI Studio está configurada.`,
        timestamp: Date.now(),
      });
    }
  }

  async function handleApproveAndBuild() {
    if (!activeProject?.briefing || isGenerating) return;

    try {
      setIsGenerating(
        true,
        "Construindo o site completo com Gemini 3.8 Flash a partir do plano aprovado...",
      );
      let html = "";
      const clientApiKey = getGeminiApiKey() || undefined;

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Tempo limite excedido no servidor")), 50000),
        );
        const res = await Promise.race([
          generateCreativeSiteFn({
            data: {
              briefingOrPrompt: activeProject.briefing,
              projectId: activeProject.id,
              projectName: activeProject.name,
              apiKey: clientApiKey,
            },
          }),
          timeoutPromise,
        ]);
        html = res.html;
      } catch (serverErr: any) {
        console.warn("[CreativeChat] Fallback para geração direta:", serverErr);
        html = await generateSiteHtml(activeProject.briefing, undefined, clientApiKey);
      }
      setIsGenerating(false);

      if (!html || html.length < 50) {
        throw new Error("O site não pôde ser gerado. Tente novamente.");
      }

      updateActiveProjectHtml(html);
      addChatMessage({
        id: `ai-build-${Date.now()}`,
        role: "assistant",
        content:
          "🚀 O site foi totalmente construído e salvo na nuvem! Você pode pedir refinamentos aqui, usar o editor visual ou clicar em 'Publicar' para subir no Cloudflare.",
        timestamp: Date.now(),
      });
      toast.success("Site gerado e sincronizado com sucesso!");
    } catch (err: any) {
      setIsGenerating(false);
      console.error(err);
      const msg = err.message || "Erro ao gerar site.";
      toast.error(msg);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: `⚠️ Falha ao construir o site: ${msg}. Tente clicar em "Aprovar & Gerar Site" novamente.`,
        timestamp: Date.now(),
      });
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
        {/* Pré-visualização de arquivos e fotos anexadas */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-zinc-900 border border-white/[0.08] overflow-x-auto custom-scrollbar">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="relative flex items-center gap-2 p-1.5 pr-6 rounded-lg bg-zinc-800 border border-white/10 shrink-0 text-left group"
              >
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                )}
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <span className="text-[11px] font-medium text-zinc-200 truncate">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedFiles((prev) => prev.filter((item) => item.id !== file.id))
                  }
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700/80 hover:bg-rose-500/80 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Remover anexo"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <span className="text-[10px] text-zinc-400 shrink-0 pl-1">
              {attachedFiles.length} anexo(s)
            </span>
          </div>
        )}

        <div className="relative rounded-2xl bg-zinc-900 border border-white/[0.09] focus-within:border-emerald-500/60 transition-all shadow-lg">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf,.pdf,.csv,.txt"
            multiple
            className="hidden"
          />

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
                ? "Peça uma alteração (ex: 'atualize o cardápio com os preços do PDF anexado')..."
                : "Descreva a empresa ou anexe fotos/PDF de cardápio para planejar..."
            }
            rows={2}
            className="w-full bg-transparent p-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs transition-colors border border-white/[0.06]"
                title="Anexar fotos, cardápio PDF, tabelas ou documentos"
              >
                <Paperclip size={13} />
                <span className="text-[11px]">Foto / PDF</span>
              </button>

              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Shift+Enter quebra linha
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
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

