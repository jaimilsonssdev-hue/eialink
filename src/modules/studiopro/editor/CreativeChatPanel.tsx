import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Wand2,
  Paperclip,
  X,
  AlertTriangle,
  FileText,
  MapPin,
  Loader2,
  Star,
  Phone,
  MessageSquare,
  ChevronDown,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import {
  getGeminiApiKey,
  resolveCreativeStudioApiKeyAsync,
  type MultimodalAttachment,
} from "@/modules/studiopro/lib/creativeEngineService";
import {
  generateCreativeSiteFn,
  syncCreativeStudioProjectFn,
} from "@/modules/studio/studio.functions";
import { fetchPlaceDetailsFn } from "@/modules/prospecting/places.functions";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import { GeminiApiKeyModal } from "@/components/ai/GeminiApiKeyModal";
import { GoogleBusinessLeadDrawer } from "@/modules/studiopro/components/GoogleBusinessLeadDrawer";
import { toast } from "sonner";

const QUICK_GEMINI_PROMPTS = [
  "✨ Gerar Demonstração Completa de Alto Padrão",
  "🎨 Tema Dark Sofisticado com Dourado e Grafite",
  "⭐ Destacar Avaliação 5 Estrelas no Google",
  "💬 Adicionar Botão Flutuante de WhatsApp",
  "📅 Integrar Agendamento de Horário Online",
  "📋 Inserir Tabela de Preços e Serviços",
  "📍 Trazer Mapa Interativo e Horário de Funcionamento",
  "📱 Otimizar Conversão Mobile",
];

export function CreativeChatPanel() {
  const [input, setInput] = useState("");
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para inclusão rápida de dados do Google Maps no chat
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsQuery, setMapsQuery] = useState("");
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [showGoogleLeads, setShowGoogleLeads] = useState(false);

  const {
    getActiveProject,
    isGenerating,
    statusMessage,
    setIsGenerating,
    addChatMessage,
    updateActiveProjectHtml,
    updateActiveProjectMeta,
    createProject,
    selectProject,
  } = useCreativeStudioStore();

  const activeProject = getActiveProject();
  const messages = activeProject?.messages || [];
  const currentHtml = activeProject?.html || "";

  const hasTriggeredInitialRef = useRef<string | null>(null);

  // Scroll automático
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  // Limpa estado de geração se ficou preso
  useEffect(() => {
    setIsGenerating(false, "");
  }, [setIsGenerating]);

  // Extrai dados do Google Meu Negócio caso disponíveis no briefing do projeto
  const googleBusinessData = React.useMemo(() => {
    const text = activeProject?.briefing || "";
    if (!text) return null;

    const nameMatch = text.match(/Empresa:\s*([^\n\r]+)/i);
    const phoneMatch = text.match(/(?:WhatsApp|Telefone):\s*([^\n\r]+)/i);
    const addressMatch = text.match(/(?:Endereço|Local|Cidade):\s*([^\n\r]+)/i);
    const nicheMatch = text.match(/Nicho:\s*([^\n\r]+)/i);

    if (!nameMatch && !activeProject?.name) return null;

    return {
      name: nameMatch ? nameMatch[1].trim() : activeProject?.name || "Empresa",
      whatsapp: phoneMatch ? phoneMatch[1].trim() : "",
      address: addressMatch ? addressMatch[1].trim() : "",
      niche: nicheMatch ? nicheMatch[1].trim() : "Comércio / Serviços",
    };
  }, [activeProject?.briefing, activeProject?.name]);

  // Auto-inicia a geração quando um novo projeto chega do dashboard com prompt inicial e sem HTML
  useEffect(() => {
    if (!activeProject) return;
    if (
      messages.length === 2 &&
      messages[1].role === "user" &&
      !currentHtml &&
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
      reader.onload = (event) => {
        const resultStr = event.target?.result as string;
        if (!resultStr) return;

        const base64Data = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
        const newAttachment = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          size: file.size,
          dataBase64: base64Data,
          previewUrl: isImg ? resultStr : undefined,
        };

        setAttachedFiles((prev) => [...prev, newAttachment]);
        toast.success(`"${file.name}" anexado com visão multimodal do Gemini.`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSearchMapsFromChat() {
    const raw = mapsQuery.trim();
    if (!raw) return;

    setIsSearchingMaps(true);
    try {
      const parsed = normalizeBusinessQuery(raw);
      if (parsed.placeId || parsed.query) {
        const details = await fetchPlaceDetailsFn({
          data: {
            placeId: parsed.placeId,
            query: parsed.query,
          },
        });

        if (details.data) {
          const d = details.data;
          let appendText = `\n\n[DADOS GOOGLE MEU NEGÓCIO]:\n- Empresa: ${d.name}\n- Endereço: ${d.formatted_address || d.address || ""}\n- WhatsApp/Telefone: ${d.phone || ""}\n- Avaliação: ${d.rating || 5.0} estrelas (${d.user_ratings_total || 50} avaliações)`;
          if (d.photos && d.photos.length > 0) {
            appendText += `\n- Fotos do Google: ${d.photos.slice(0, 5).join(", ")}`;
          }
          setInput((prev) => (prev ? `${prev}${appendText}` : appendText.trim()));
          toast.success("Dados reais do Google Meu Negócio inseridos no comando!");
        } else {
          const fallbackText = `[Endereço Google Maps: ${raw}]`;
          setInput((prev) => (prev ? `${prev}\n${fallbackText}` : fallbackText));
          toast.info("Endereço adicionado ao comando.");
        }
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

    const isIteration = Boolean(currentHtml && currentHtml.length > 50);
    setIsGenerating(
      true,
      isIteration
        ? "Google Gemini aplicando alterações na demonstração..."
        : "Google Gemini criando demonstração completa de site...",
    );

    try {
      let newHtml = "";
      let aiExplanation = "";
      const clientApiKey = await getResolvedApiKeyHelper();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

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
          throw new Error("Tempo limite de 3 minutos excedido ao gerar o site. Tente novamente.");
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
        throw new Error(
          "O Gemini retornou uma resposta incompleta ou sem a tag </html>. Envie seu comando novamente.",
        );
      }

      updateActiveProjectHtml(newHtml);

      // Persiste automaticamente no Supabase
      syncCreativeStudioProjectFn({
        data: {
          project: {
            ...activeProject,
            html: newHtml,
          },
          eialinkPageId: activeProject?.eialinkPageId,
        },
      }).catch((syncErr) => {
        console.warn("[CreativeChat] Aviso ao sincronizar com Supabase:", syncErr);
      });

      const defaultMsg = isIteration
        ? "✨ Apliquei suas alterações diretamente na demonstração! O resultado já está visível na tela ao lado. Me diga se quer refinar cores, blocos ou adicionar novos recursos."
        : `🚀 Criei a demonstração completa para **${activeProject?.name || "sua empresa"}** com padrão visual de alta conversão, tipografia editorial moderna e integração com WhatsApp.\n\nConfira na tela ao lado! Você pode me pedir qualquer alteração livremente.`;

      addChatMessage({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiExplanation || defaultMsg,
        timestamp: Date.now(),
      });

      toast.success(isIteration ? "Demonstração refinada com sucesso!" : "Demonstração criada com sucesso!");
    } catch (err: any) {
      setIsGenerating(false);
      console.error(err);
      const msg = err.message || "Erro ao conectar com Google Gemini.";
      toast.error(msg);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: `⚠️ Não foi possível processar a instrução: ${msg}. Verifique sua chave do Google AI Studio ou tente novamente.`,
        timestamp: Date.now(),
      });
    }
  }

  async function handleSend(customText?: string) {
    const text = (customText || input).trim();
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

  return (
    <div className="flex flex-col h-full bg-[#09090b] border-r border-white/[0.08] relative">
      {/* CABEÇALHO PADRÃO GOOGLE GEMINI */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-zinc-950/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-500 to-amber-400 p-[1.5px] shadow-md shadow-purple-500/10">
            <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center text-white">
              <Sparkles size={15} className="text-amber-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-zinc-100 tracking-tight">
                Google Gemini
              </h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                3.8 Flash
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Criador Autônomo de Demonstrações</p>
          </div>
        </div>

        {/* Status da Chave da API com Modal Integrado */}
        <GeminiApiKeyModal compact />
      </div>

      {/* BARRA DE AÇÕES RÁPIDAS (NOVO SITE & CARREGAR LEAD) */}
      <div className="px-3 py-2 border-b border-white/[0.06] bg-zinc-950/60 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            const id = createProject("Nova Demonstração");
            selectProject(id);
            toast.success("Nova demonstração iniciada com Gemini!");
          }}
          className="flex-1 py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
        >
          <span>+ Novo Site</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGoogleLeads(true)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
        >
          <MapPin size={11} className="text-amber-400" />
          <span>Google Meu Negócio</span>
        </button>
      </div>

      {/* CARD DE DADOS DO GOOGLE MEU NEGÓCIO (SE EXISTIR LEAD NO CONTEXTO) */}
      {googleBusinessData && (
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 shadow-sm shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              Google Meu Negócio Sincronizado
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Nota 4.9 ★★★★★</span>
          </div>

          <p className="text-xs font-bold text-white truncate">{googleBusinessData.name}</p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400 mt-1">
            {googleBusinessData.niche && <span>Nicho: {googleBusinessData.niche}</span>}
            {googleBusinessData.address && (
              <span className="truncate max-w-[200px]">Local: {googleBusinessData.address}</span>
            )}
            {googleBusinessData.whatsapp && <span>WhatsApp: {googleBusinessData.whatsapp}</span>}
          </div>

          {!currentHtml && (
            <button
              type="button"
              onClick={() =>
                handleSend(
                  `Crie um site moderno e completo para ${googleBusinessData.name} (${googleBusinessData.niche}) destacando o endereço ${googleBusinessData.address}, botão de contato para WhatsApp ${googleBusinessData.whatsapp} e as avaliações 5 estrelas do Google.`,
                )
              }
              disabled={isGenerating}
              className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={13} />
              <span>Gerar Demonstração com Dados do Google</span>
            </button>
          )}
        </div>
      )}

      {/* HISTÓRICO DE MENSAGENS CONVERSACIONAIS */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-500 to-amber-400 p-[1px] shrink-0 mt-0.5">
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center text-white">
                  <Sparkles size={13} className="text-amber-300" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white font-normal rounded-tr-sm border border-white/10 shadow-sm"
                  : msg.role === "system"
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-sm"
                  : "bg-zinc-900/90 border border-white/[0.08] text-zinc-200 rounded-tl-sm shadow-sm"
              }`}
            >
              {/* Se a mensagem do usuário possuir anexos */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-white/10">
                  {msg.attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-zinc-300"
                    >
                      <Paperclip size={10} />
                      <span className="max-w-[120px] truncate">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Indicador de Demonstração atualizada no Canvas */}
              {msg.role === "assistant" && currentHtml && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>Demonstração atualizada no Canvas ao lado</span>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-300 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-2.5 items-center p-3 rounded-2xl bg-zinc-900/90 border border-purple-500/30 text-purple-300 text-xs shadow-lg animate-pulse">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0">
              <RefreshCw size={11} className="animate-spin text-white" />
            </div>
            <span>{statusMessage || "Google Gemini criando demonstração ao lado..."}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGESTÕES RÁPIDAS DE INSTRUÇÃO (PILLS ESTILO GEMINI) */}
      <div className="px-3 pt-2 pb-1 border-t border-white/[0.04] bg-zinc-950/60 overflow-x-auto custom-scrollbar flex gap-1.5 shrink-0">
        {QUICK_GEMINI_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(promptText)}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 hover:text-white shrink-0 transition-all hover:border-emerald-500/40 active:scale-95 disabled:opacity-40"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* INPUT FLUTUANTE ESTILO GOOGLE GEMINI */}
      <div className="p-3 border-t border-white/[0.08] bg-zinc-950/90 backdrop-blur-md shrink-0">
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
              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold disabled:opacity-40 cursor-pointer"
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

        {/* CONTAINER DO INPUT ESTILO GEMINI APP */}
        <div className="relative rounded-2xl bg-zinc-900/90 border border-white/[0.12] focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all shadow-xl">
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
                void handleSend();
              }
            }}
            placeholder={
              currentHtml
                ? "Peça uma alteração ao Gemini (ex: 'mude a cor para dourado escuro', 'adicione tabela de serviços')..."
                : "Descreva a empresa ou peça: 'Crie uma landing page de alta conversão para...'"
            }
            rows={2}
            className="w-full bg-transparent p-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs transition-colors border border-white/[0.06] cursor-pointer"
                title="Anexar fotos da empresa, logotipo ou PDF"
              >
                <Paperclip size={13} />
                <span className="text-[11px]">Foto / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMapsInput((prev) => !prev)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs transition-colors border border-white/[0.06] cursor-pointer"
                title="Inserir dados ou link do Google Meu Negócio"
              >
                <MapPin size={13} />
                <span className="text-[11px]">Google Maps</span>
              </button>

              <span className="text-[10px] text-zinc-500 hidden sm:inline ml-1">
                Enter para enviar
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center text-black font-semibold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95 cursor-pointer"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer de Leads do Google Meu Negócio */}
      <GoogleBusinessLeadDrawer
        open={showGoogleLeads}
        onOpenChange={setShowGoogleLeads}
      />
    </div>
  );
}
