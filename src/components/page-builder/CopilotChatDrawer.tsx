import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Loader2,
  Bot,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { chatCopilotEditFn } from "@/modules/ai/copilot.functions";
import { saveGeminiKey } from "@/modules/prospecting/GeminiAuditorService";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface CopilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: Record<string, any>;
  onApplyPatch: (patch: Record<string, any>) => void;
  onOpenQuickGenerator?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  "Mudar paleta para cores noturnas e dourado",
  "Reescrever a headline com foco em conversão no WhatsApp",
  "Adicionar 3 diferenciais competitivos do meu nicho",
  "Ativar efeito Parallax cinematográfico na capa",
  "Criar uma mensagem de WhatsApp mais amigável",
];

export function CopilotChatDrawer({
  isOpen,
  onClose,
  currentBio,
  onApplyPatch,
  onOpenQuickGenerator,
}: CopilotChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou seu Copiloto de Design e Vendas. Converse comigo para fazer qualquer alteração no seu site: mudar cores, reescrever textos com foco em vendas, adicionar diferenciais ou ajustar botões. O que você gostaria de mudar agora?",
      timestamp: new Date(),
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [undoHistory, setUndoHistory] = useState<Record<string, any>[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSaveKey = () => {
    const clean = apiKey.trim();
    if (!clean) {
      toast.error("Por favor, informe uma chave válida.");
      return;
    }
    saveGeminiKey(clean);
    setShowKeyConfig(false);
    toast.success("Chave do Google Gemini salva com sucesso!");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const cleanKey = apiKey.trim();
      if (apiKey.trim()) {
        saveGeminiKey(apiKey.trim());
      }

      const response = await chatCopilotEditFn({
        data: {
          currentBio,
          instruction: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          overrideApiKey: cleanKey || undefined,
        },
      });

      if (response.patch && Object.keys(response.patch).length > 0) {
        setUndoHistory((prev) => [...prev, currentBio]);
        onApplyPatch(response.patch);
        toast.success("Alteração aplicada na sua página!");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.assistantReply,
        timestamp: new Date(),
        suggestions: response.suggestions && response.suggestions.length > 0 ? response.suggestions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("[CopilotChat] Erro na conversa:", err);
      const errMsg = err?.message || "Ocorreu um erro ao comunicar com a IA.";

      if (errMsg.toLowerCase().includes("chave") || errMsg.toLowerCase().includes("api key")) {
        setShowKeyConfig(true);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Não consegui aplicar essa alteração: ${errMsg}. Verifique se a sua chave do Gemini está configurada.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const previous = undoHistory[undoHistory.length - 1];
    setUndoHistory((prev) => prev.slice(0, -1));
    onApplyPatch(previous);
    toast.info("Última alteração desfeita.");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3.5 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Copiloto Criativo</h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-muted-foreground">Converse e edite o site em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {undoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              title="Desfazer última alteração"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            title="Configurar chave do Google Gemini"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <KeyRound className="h-4 w-4" />
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Configuração de Chave API Retrátil */}
      {showKeyConfig && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5 mb-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Chave de API do Google AI Studio (Gemini)</p>
              <p>Insira sua chave gratuita para ter velocidade máxima e respostas sem limites.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Cole sua chave AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSaveKey}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
              {msg.role === "user" ? (
                <>
                  <span>Você</span>
                  <User className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-primary" />
                  <span>Copiloto</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted/70 text-foreground border border-border/60 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>

            {/* Quick action chips if available */}
            {msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                {msg.suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-left"
                  >
                    ✨ {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted/60 border border-border/60 px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Pensando e ajustando seu site em tempo real...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input Box */}
      <div className="border-t border-border/80 p-3 bg-muted/20">
        <div className="relative rounded-xl border border-border bg-background shadow-inner focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: 'Troque a cor para preto e dourado' ou 'Melhore o texto do WhatsApp'..."
            className="w-full resize-none bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>Enter para enviar</span>
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {onOpenQuickGenerator && (
          <div className="mt-2 flex items-center justify-between px-1">
            <button
              onClick={onOpenQuickGenerator}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Gerador Completo (Fotos, PDFs, Maps)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
