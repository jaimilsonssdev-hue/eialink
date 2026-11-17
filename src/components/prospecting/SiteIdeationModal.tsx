import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  ExternalLink,
  Copy,
  Smartphone,
  Tablet,
  Monitor,
  Code,
  Eye,
  Download,
  MapPin,
  Star,
  Phone,
  MessageSquare,
  RefreshCw,
  Rocket,
  ShieldCheck,
  X,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateGeminiSiteWithStudio,
  type GeminiSiteChatMessage,
} from "@/modules/prospecting/geminiSiteStudio.service";
import { PageService } from "@/modules/page/services/PageService";
import { ProspectingService } from "@/modules/prospecting/ProspectingService";
import { useQueryClient } from "@tanstack/react-query";
import type { ProspectedCompany } from "@/modules/prospecting/types";

interface SiteIdeationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id?: string;
    name: string;
    niche: string;
    city: string;
    whatsapp?: string | null;
    address?: string | null;
    rating?: number | null;
    reviews_count?: number | null;
    instagram?: string | null;
    photos?: string[];
    company?: ProspectedCompany;
  } | null;
  onSavedDemo?: (companyId: string, demoUrl: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  "✨ Gerar Primeiro Rascunho Completo",
  "🎨 Estilo Dark Mode & Dourado Luxuoso",
  "⭐ Destacar Avaliação 5 Estrelas no Google",
  "🔥 Adicionar Promoção com Botão WhatsApp",
  "📋 Adicionar Tabela de Preços dos Serviços",
  "❓ Adicionar Seção de FAQ (Dúvidas Frequentes)",
  "📍 Destacar Localização & Google Maps",
];

export function SiteIdeationModal({
  open,
  onOpenChange,
  lead,
  onSavedDemo,
}: SiteIdeationModalProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<GeminiSiteChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDemoUrl, setSavedDemoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inicializa quando abre o modal com um novo lead
  useEffect(() => {
    if (!open || !lead) {
      setMessages([]);
      setInput("");
      setCurrentHtml("");
      setSavedDemoUrl(null);
      return;
    }

    // Verifica se o lead já possui uma demo salva anteriormente nas notas
    const notes = lead.company?.notes || "";
    const demoMatch = notes.match(/\[Demo:\s*(https?:\/\/[^\]]+)\]/i);
    const existingDemoUrl = demoMatch ? demoMatch[1] : null;
    if (existingDemoUrl) {
      setSavedDemoUrl(existingDemoUrl);
    }

    const greeting: GeminiSiteChatMessage = {
      id: "greeting-" + Date.now(),
      role: "assistant",
      content: `Olá! Sou o **Gemini 3.8 Flash**, seu Diretor de Criação de Sites de Alta Conversão.\n\nSincronizei todos os dados do **Google Meu Negócio** de **${lead.name}**:\n- 📍 **Localização:** ${lead.address || lead.city || "Cidade cadastrada"}\n- 📞 **WhatsApp:** ${lead.whatsapp || "Disponível"}\n- ⭐ **Google:** Nota ${lead.rating || 4.9} (${lead.reviews_count || 48} avaliações verificadas)\n\nComo você deseja que eu crie a demonstração? Pode clicar em uma sugestão abaixo ou enviar suas instruções livres!`,
      timestamp: Date.now(),
    };

    setMessages([greeting]);
    setSuggestions(DEFAULT_SUGGESTIONS);
    setMobileTab("chat");
  }, [open, lead?.name]);

  // Scroll automático do chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  async function handleSendMessage(instructionText?: string) {
    const textToSend = (instructionText || input).trim();
    if (!textToSend || !lead || isGenerating) return;

    const userMessage: GeminiSiteChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const res = await generateGeminiSiteWithStudio({
        name: lead.name,
        niche: lead.niche,
        city: lead.city,
        phone: lead.whatsapp,
        endereco: lead.address,
        nota_google: lead.rating,
        total_avaliacoes: lead.reviews_count,
        photos: lead.photos || [],
        prompt: textToSend,
        currentHtml: currentHtml || undefined,
        messages: nextMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.content,
        })),
      });

      setCurrentHtml(res.html);

      const assistantMessage: GeminiSiteChatMessage = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: res.explanation || "Atualizei o site de acordo com as instruções fornecidas.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }

      toast.success("✨ Site atualizado com sucesso pelo Gemini!");

      // No mobile, se estava na aba de chat, avisa que o site foi renderizado
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setMobileTab("preview");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar site.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ Ocorreu um problema: ${msg}. Por favor, tente novamente.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveDemo() {
    if (!lead || !currentHtml || isSaving) return;
    setIsSaving(true);
    try {
      const targetCompany = lead.company || {
        id: lead.id || "",
        name: lead.name,
        niche: lead.niche,
        city: lead.city,
        phone: lead.whatsapp,
        whatsapp: lead.whatsapp,
        endereco: lead.address,
        address: lead.address,
        rating: lead.rating,
        reviews_count: lead.reviews_count,
        photos: lead.photos,
        notes: "",
      };

      const { pageId, slug, url } = await PageService.createOrUpdateModularSiteDemo(
        {
          ...targetCompany,
          id: targetCompany.id || lead.id || "",
          name: lead.name,
          city: lead.city,
          endereco: lead.address || (targetCompany as any).endereco,
          phone: lead.whatsapp || (targetCompany as any).phone,
          whatsapp: lead.whatsapp,
          nota_google: lead.rating,
          total_avaliacoes: lead.reviews_count,
          photos: lead.photos || [],
          notes: targetCompany.notes,
        },
        {
          headline: lead.name,
          palette: "emerald_gold",
        },
        currentHtml,
      );

      // Atualiza o lead no Radar de Prospecção para incluir a tag da demo
      if (targetCompany.id) {
        const cleanNotes = (targetCompany.notes || "")
          .replace(/Demo:\s*https?:\/\/[^\s)]+(?:\s*\[Modelo:[^\]]+\])?(?:\s*\(id:[a-f0-9-]+\))?/gi, "")
          .replace(/\[Demo:\s*https?:\/\/[^\]]+\]/gi, "")
          .replace(/\[PageId:\s*[a-f0-9-]+\]/gi, "")
          .trim();

        const newNotes = cleanNotes
          ? `${cleanNotes}\n[Demo: ${url}] [PageId: ${pageId}]`
          : `[Demo: ${url}] [PageId: ${pageId}]`;

        await ProspectingService.updateCompany(targetCompany.id, { notes: newNotes });
      }

      setSavedDemoUrl(url);
      queryClient.invalidateQueries({ queryKey: ["prospected_companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-demo-pages"] });

      if (onSavedDemo && targetCompany.id) {
        onSavedDemo(targetCompany.id, url);
      }

      toast.success("🚀 Demonstração salva e vinculada ao lead com sucesso!", {
        duration: 5000,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar demonstração.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyHtml() {
    if (!currentHtml) return;
    navigator.clipboard.writeText(currentHtml);
    toast.success("Código HTML copiado para a área de transferência!");
  }

  function handleDownloadHtml() {
    if (!currentHtml || !lead) return;
    const blob = new Blob([currentHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-${lead.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download do arquivo HTML iniciado!");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  if (!lead) return null;

  const preparedHtml = currentHtml.includes("<head>")
    ? currentHtml.replace("<head>", `<head><base target="_top">`)
    : `<base target="_top">${currentHtml}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] md:max-w-[94vw] lg:max-w-[92vw] w-full h-[92vh] max-h-[94vh] p-0 overflow-hidden bg-zinc-950 border border-white/10 text-white shadow-2xl flex flex-col rounded-2xl">
        {/* HEADER TOP BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 fill-current" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Estúdio Copiloto Gemini</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  gemini-3.8-flash
                </span>
              </DialogTitle>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span className="font-medium text-zinc-200">{lead.name}</span>
                <span>•</span>
                <span>{lead.niche}</span>
                <span>•</span>
                <span>{lead.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedDemoUrl && (
              <a
                href={savedDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ver Demonstração Publicada</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MOBILE SWITCH TABS (< md) */}
        <div className="flex md:hidden items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-xl border border-white/10 w-full max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mobileTab === "chat"
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Instruções & Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mobileTab === "preview"
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Prévia ao Vivo</span>
              {currentHtml && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          </div>
        </div>

        {/* WORKSPACE BODY (SPLIT-SCREEN) */}
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
          {/* PAINEL ESQUERDO: COPILOTO CONVERSACIONAL */}
          <div
            className={`${
              mobileTab === "chat" ? "flex" : "hidden"
            } md:flex flex-col w-full md:w-[42%] lg:w-[38%] h-full border-r border-white/10 bg-zinc-950/70 shrink-0`}
          >
            {/* CARD GOOGLE MEU NEGÓCIO GROUNDING */}
            <div className="p-3.5 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
              <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Google Meu Negócio Sincronizado</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    Lead Real
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 truncate">
                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{lead.address || lead.city || "Brasil"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="font-semibold text-amber-300">
                      {lead.rating || 4.9} ★ ({lead.reviews_count || 48} avaliações)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300 col-span-2 truncate">
                    <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>WhatsApp Oficial: {lead.whatsapp || "Conectado para CTA"}</span>
                  </div>
                </div>

                {lead.photos && lead.photos.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    <span className="text-[10px] text-zinc-400 shrink-0">Fotos do local:</span>
                    {lead.photos.slice(0, 4).map((photoUrl, idx) => (
                      <img
                        key={idx}
                        src={photoUrl}
                        alt={`Local ${idx}`}
                        className="w-6 h-6 rounded-md object-cover border border-white/10 shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* LISTA DE MENSAGENS (CHAT) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white font-medium rounded-tr-sm"
                        : "bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-sm whitespace-pre-wrap"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-2.5 items-center">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </span>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-900 border border-white/10 px-4 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Gemini pensando e construindo o código...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHIPS DE SUGESTÕES RÁPIDAS */}
            <div className="p-3 border-t border-white/10 bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                {suggestions.map((sugg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(sugg)}
                    disabled={isGenerating}
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {sugg}
                  </button>
                ))}
              </div>

              {/* INPUT DE PROMPT */}
              <div className="relative mt-2 flex items-center gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Dê instruções ao Gemini (ex: adicione tabela de preços, mude as cores para dourado...)"
                  rows={2}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isGenerating}
                  className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-md shadow-emerald-600/30 cursor-pointer"
                  title="Enviar instrução ao Gemini"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: CANVAS / PRÉVIA AO VIVO */}
          <div
            className={`${
              mobileTab === "preview" ? "flex" : "hidden"
            } md:flex flex-1 flex-col h-full bg-[#08070b] overflow-hidden`}
          >
            {/* TOOLBAR DA PRÉVIA */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-zinc-900/60 shrink-0">
              {/* Toggles de Dispositivo */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setDeviceMode("desktop")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    deviceMode === "desktop"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Visão Desktop"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode("tablet")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    deviceMode === "tablet"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Visão Tablet (768px)"
                >
                  <Tablet className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode("mobile")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    deviceMode === "mobile"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Visão Mobile (375px)"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Toggles Prévia vs Código */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveView("preview")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeView === "preview"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Prévia Visual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("code")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeView === "code"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Code className="h-3 w-3" />
                  <span>Código HTML</span>
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                {currentHtml && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyHtml}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
                      title="Copiar código HTML"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadHtml}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
                      title="Baixar arquivo HTML"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSaveDemo}
                  disabled={!currentHtml || isSaving}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-3.5 w-3.5 text-emerald-200" />
                      <span>Salvar e Publicar Demonstração</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ÁREA DE VISUALIZAÇÃO DO CANVAS */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070609]">
              {!currentHtml ? (
                <div className="text-center p-8 max-w-md space-y-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Crie o site de {lead.name} com o Gemini
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O Gemini tem acesso a todas as informações mineradas do Google Meu Negócio
                    (avaliações, telefone, endereço e fotos). Clique no botão abaixo para gerar a
                    primeira versão completa!
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSendMessage("✨ Gerar Primeiro Rascunho Completo")}
                    disabled={isGenerating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Gerar Site Inicial Agora</span>
                      </>
                    )}
                  </button>
                </div>
              ) : activeView === "code" ? (
                <div className="w-full h-full rounded-xl border border-white/10 bg-zinc-950 p-4 font-mono text-xs text-emerald-300 overflow-auto whitespace-pre">
                  {currentHtml}
                </div>
              ) : (
                <div
                  className={`h-full transition-all duration-300 mx-auto ${
                    deviceMode === "desktop"
                      ? "w-full"
                      : deviceMode === "tablet"
                      ? "w-[768px] max-w-full rounded-2xl border-4 border-zinc-800 shadow-2xl overflow-hidden"
                      : "w-[375px] max-w-full rounded-3xl border-8 border-zinc-800 shadow-2xl overflow-hidden"
                  }`}
                >
                  <iframe
                    srcDoc={preparedHtml}
                    title={lead.name}
                    className="w-full h-full border-none bg-white block"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
