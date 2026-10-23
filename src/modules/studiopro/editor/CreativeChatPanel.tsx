import React, { useState, useRef, useEffect } from "react";
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
  FileText,
  MapPin,
  Loader2,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import {
  planSiteBriefing,
  generateSiteHtml,
  getGeminiApiKey,
  resolveCreativeStudioApiKeyAsync,
  type MultimodalAttachment,
} from "@/modules/studiopro/lib/creativeEngineService";
import {
  generateCreativeSiteFn,
  planCreativeSiteBriefingFn,
  syncCreativeStudioProjectFn,
} from "@/modules/studio/studio.functions";
import { fetchPlaceDetailsFn } from "@/modules/prospecting/places.functions";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import { toast } from "sonner";

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

  // Estados para inclusão rápida de dados do Google Maps no chat
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsQuery, setMapsQuery] = useState("");
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);

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
    updateActiveProjectMeta,
  } = useCreativeStudioStore();

  const activeProject = getActiveProject();
  const messages = activeProject?.messages || [];
  const currentHtml = activeProject?.html || "";

  const hasTriggeredInitialRef = useRef<string | null>(null);

  useEffect(() => {
    setIsGenerating(false, "");
  }, [setIsGenerating]);

  // Auto-inicia a geração quando um novo projeto chega do dashboard com prompt inicial e sem HTML/Briefing
  useEffect(() => {
    if (!activeProject) return;
    if (
      messages.length === 2 &&
      messages[1].role === "user" &&
      !currentHtml &&
      !activeProject.briefing &&
      !isGenerating &&
      hasTriggeredInitialRef.current !== activeProject.id
    ) {
      hasTriggeredInitialRef.current = activeProject.id;
      const initialUserMsg = messages[1];
      void executePromptGeneration(
        initialUserMsg.content,
        initialUserMsg.attachments || [],
        false,
      );
    }
  }, [activeProject?.id, messages.length, currentHtml, isGenerating]);

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

  async function handleSearchMapsFromChat() {
    const raw = mapsQuery.trim();
    if (!raw) return;

    setIsSearchingMaps(true);
    try {
      const norm = normalizeBusinessQuery(raw);
      const queryName = norm.name || norm.query || raw;
      const queryCity = norm.city || null;

      const place = await fetchPlaceDetailsFn({
        data: {
          companyName: queryName,
          city: queryCity,
        },
      });

      if (place) {
        const mapsText = `[Google Maps: ${place.companyName} | Endereço: ${place.address || raw} | Avaliação: ★ ${place.rating || "4.9"} | Tel: ${place.whatsapp || place.phone || "Zap"}${place.photos?.length ? ` | Fotos: ${place.photos.slice(0, 3).join(", ")}` : ""}]`;
        setInput((prev) => (prev ? `${prev}\n${mapsText}` : mapsText));
        toast.success(`Dados do Google Maps inseridos para ${place.companyName}!`);
      } else {
        const fallbackText = `[Endereço Google Maps: ${raw}]`;
        setInput((prev) => (prev ? `${prev}\n${fallbackText}` : fallbackText));
        toast.info("Endereço adicionado ao comando.");
      }
      setShowMapsInput(false);
      setMapsQuery("");
    } catch {
      const fallbackText = `[Endereço Google Maps: ${raw}]`;
      setInput((prev) => (prev ? `${prev}\n${fallbackText}` : fallbackText));
      setShowMapsInput(false);
      setMapsQuery("");
    } finally {
      setIsSearchingMaps(false);
    }
  }

  async function getResolvedApiKeyHelper(): Promise<string | undefined> {
    const direct = getGeminiApiKey();
    if (direct) return direct;
    try {
      const synced = await resolveCreativeStudioApiKeyAsync();
      if (synced) return synced;
    } catch {
      // segue sem chave local
    }
    return undefined;
  }

  async function executePromptGeneration(
    fullPrompt: string,
    currentAttachments: MultimodalAttachment[],
    isNewUserMsg = false,
  ) {
    if (isNewUserMsg) {
      addChatMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: fullPrompt,
        timestamp: Date.now(),
        attachments: currentAttachments,
      });
    }

    try {
      if (mode === "plan" && !currentHtml) {
        setIsGenerating(true, "Elaborando plano estratégico com Google Gemini...");
        let briefing = "";
        const clientApiKey = await getResolvedApiKeyHelper();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        try {
          const res = await planCreativeSiteBriefingFn({
            data: {
              prompt: fullPrompt,
              history: messages.map((m) => ({ role: m.role, content: m.content })),
              apiKey: clientApiKey,
              attachments: currentAttachments,
            },
            signal: controller.signal,
          });
          briefing = res.briefing;
        } catch (serverErr: any) {
          if (controller.signal.aborted || serverErr?.name === "AbortError") {
            throw new Error("Tempo limite de 90 segundos excedido ao elaborar o plano. Tente novamente.");
          }
          throw serverErr;
        } finally {
          clearTimeout(timeoutId);
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
        const isIteration = Boolean(currentHtml && currentHtml.length > 50);
        setIsGenerating(
          true,
          isIteration
            ? "Copiloto IA aplicando ajustes com Google Gemini..."
            : "Gerando site completo com Google Gemini...",
        );

        let newHtml = "";
        let aiExplanation = "";
        const clientApiKey = await getResolvedApiKeyHelper();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        try {
          const res = await generateCreativeSiteFn({
            data: {
              briefingOrPrompt: fullPrompt,
              existingHtml: isIteration ? currentHtml : undefined,
              projectId: activeProject?.eialinkPageId || activeProject?.id,
              businessSlug: activeProject?.slug,
              projectName: activeProject?.name,
              apiKey: clientApiKey,
              attachments: currentAttachments,
              conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
            },
            signal: controller.signal,
          });
          newHtml = res.html;
          aiExplanation = res.explanation;
          if (res.pageId || res.slug) {
            updateActiveProjectMeta({
              eialinkPageId: res.pageId,
              slug: res.slug,
            });
          }
        } catch (serverErr: any) {
          if (controller.signal.aborted || serverErr?.name === "AbortError") {
            throw new Error("Tempo limite de 90 segundos excedido ao gerar o site. Tente novamente.");
          }
          throw serverErr;
        } finally {
          clearTimeout(timeoutId);
        }
        setIsGenerating(false);

        const hasValidHtmlTags = Boolean(
          newHtml &&
          newHtml.length > 50 &&
          /<(?:!doctype|html|body|div|section|main|head)/i.test(newHtml) &&
          /<\/html>/i.test(newHtml),
        );

        if (!hasValidHtmlTags) {
          throw new Error("A IA retornou uma resposta incompleta ou sem a tag </html>. Tente clicar em gerar novamente.");
        }

        updateActiveProjectHtml(newHtml);

        // Persiste as alterações no Supabase imediatamente para salvar a edição do site
        if (activeProject) {
          syncCreativeStudioProjectFn({
            data: {
              project: {
                ...activeProject,
                html: newHtml,
              },
              eialinkPageId: activeProject.eialinkPageId,
            },
          }).catch((syncErr) => {
            console.warn("[CreativeChat] Aviso ao persistir no Supabase:", syncErr);
          });
        }

        addChatMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: aiExplanation || (isIteration
            ? "✨ Ajuste concluído! Apliquei as alterações que você solicitou e salvei no sistema. Veja o resultado atualizado na tela ao lado."
            : "🎉 Seu site foi gerado e salvo com sucesso! Você pode ver a prévia ao lado ou pedir ajustes finos por aqui."),
          timestamp: Date.now(),
        });
        toast.success(isIteration ? "Ajuste aplicado e salvo com sucesso!" : "Site gerado e salvo com sucesso!");
      }
    } catch (err: any) {
      setIsGenerating(false);
      console.error(err);
      const msg = err.message || "Erro ao conectar à API do Google AI Studio.";
      toast.error(msg);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: `⚠️ Não foi possível processar: ${msg}. Por favor, tente novamente ou verifique as configurações da chave de API.`,
        timestamp: Date.now(),
      });
    }
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

    await executePromptGeneration(fullPrompt, currentAttachments, true);
  }

  async function handleApproveAndBuild() {
    if (!activeProject?.briefing || isGenerating) return;

    try {
      setIsGenerating(
        true,
        "Construindo o site completo com Google Gemini a partir do plano aprovado...",
      );
      let html = "";
      let explanation = "";
      const clientApiKey = await getResolvedApiKeyHelper();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      try {
        const res = await generateCreativeSiteFn({
          data: {
            briefingOrPrompt: activeProject.briefing,
            projectId: activeProject.eialinkPageId || activeProject.id,
            businessSlug: activeProject.slug,
            projectName: activeProject.name,
            apiKey: clientApiKey,
          },
          signal: controller.signal,
        });
        html = res.html;
        explanation = res.explanation;
        if (res.pageId || res.slug) {
          updateActiveProjectMeta({
            eialinkPageId: res.pageId,
            slug: res.slug,
          });
        }
      } catch (serverErr: any) {
        if (controller.signal.aborted || serverErr?.name === "AbortError") {
          throw new Error("Tempo limite de 90 segundos excedido ao gerar o site. Tente novamente.");
        }
        throw serverErr;
      } finally {
        clearTimeout(timeoutId);
      }
      setIsGenerating(false);

      const hasValidHtmlTags = Boolean(
        html &&
        html.length > 50 &&
        /<(?:!doctype|html|body|div|section|main|head)/i.test(html) &&
        /<\/html>/i.test(html),
      );

      if (!hasValidHtmlTags) {
        throw new Error("A IA retornou uma resposta incompleta ou sem a tag </html>. Tente clicar em gerar novamente.");
      }

      updateActiveProjectHtml(html);

      // Persiste no Supabase
      syncCreativeStudioProjectFn({
        data: {
          project: {
            ...activeProject,
            html,
          },
          eialinkPageId: activeProject.eialinkPageId,
        },
      }).catch((syncErr) => {
        console.warn("[CreativeChat] Aviso ao persistir no Supabase:", syncErr);
      });

      addChatMessage({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content:
          explanation ||
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

      {/* Histórico de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-500 text-black font-medium rounded-tr-sm shadow-sm"
                  : msg.role === "system"
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-sm"
                  : "bg-zinc-900 border border-white/[0.08] text-zinc-200 rounded-tl-sm shadow-sm"
              }`}
            >
              {/* Se a mensagem do usuário possuir anexos */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-black/10">
                  {msg.attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/15 text-[10px] font-semibold"
                    >
                      <Paperclip size={10} />
                      <span className="max-w-[120px] truncate">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Botão de aprovação de briefing do modo 'plan' */}
              {mode === "plan" &&
                msg.role === "assistant" &&
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
        {/* Painel de busca rápida no Google Maps (se ativado) */}
        {showMapsInput && (
          <div className="mb-2 p-2 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in duration-150">
            <MapPin size={14} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchMapsFromChat();
                }
              }}
              placeholder="Cole o link do Maps ou digite o endereço..."
              className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSearchMapsFromChat()}
              disabled={isSearchingMaps || !mapsQuery.trim()}
              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold disabled:opacity-40"
            >
              {isSearchingMaps ? <Loader2 size={11} className="animate-spin" /> : "Inserir"}
            </button>
            <button
              type="button"
              onClick={() => setShowMapsInput(false)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

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

              <button
                type="button"
                onClick={() => setShowMapsInput((prev) => !prev)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs transition-colors border border-white/[0.06]"
                title="Puxar dados ou fotos do Google Maps"
              >
                <MapPin size={13} />
                <span className="text-[11px]">Maps</span>
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
