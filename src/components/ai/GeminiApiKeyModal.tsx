import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getGeminiApiKey,
  resolveCreativeStudioApiKeyAsync,
} from "@/modules/studiopro/lib/creativeEngineService";
import {
  testGeminiApiKeyFn,
  saveGeminiApiKeyFn,
  getResolvedGeminiKeyFn,
} from "@/modules/ai/gemini-admin.functions";

interface GeminiApiKeyModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  compact?: boolean;
}

export function GeminiApiKeyModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerClassName,
  compact = false,
}: GeminiApiKeyModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Sincroniza e resolve chave na montagem e abertura
  useEffect(() => {
    async function checkKeyStatus() {
      setIsLoading(true);
      try {
        // 1. Tenta pegar do cache local
        let key = getGeminiApiKey();

        // 2. Se não estiver no cache local, tenta resolver do Supabase Auth e do Banco
        if (!key) {
          try {
            const resolved = await resolveCreativeStudioApiKeyAsync();
            if (resolved) key = resolved;
          } catch {
            // Chave ainda não configurada
          }
        }

        if (key && key.trim().length > 8) {
          const clean = key.trim();
          setIsConfigured(true);
          setMaskedKey(`${clean.slice(0, 4)}••••••••${clean.slice(-4)}`);
        } else {
          setIsConfigured(false);
          setMaskedKey("");
        }
      } catch (err) {
        console.warn("[GeminiApiKeyModal] Erro ao verificar chave:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void checkKeyStatus();
  }, [isOpen]);

  async function handleSaveKey(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) {
      toast.error("Por favor, cole sua chave de API do Google AI Studio.");
      return;
    }

    if (!cleanKey.startsWith("AIzaSy")) {
      toast.warning("Atenção: A chave do Google costuma começar com 'AIzaSy'. Verifique se copiou a chave correta.");
    }

    setIsSaving(true);
    setStatusMessage("Validando chave com Google Gemini 3.8 Flash...");

    try {
      // 1. Testa a chave contra o Google AI Studio
      const testResult = await testGeminiApiKeyFn({ data: { apiKey: cleanKey } });
      if (!testResult.ok) {
        throw new Error(testResult.message || "Chave inválida segundo o Google AI Studio.");
      }

      setStatusMessage("Salvando e sincronizando para todos os dispositivos...");

      // 2. Salva no localStorage imediatamente
      if (typeof window !== "undefined") {
        localStorage.setItem("eialink_gemini_api_key", cleanKey);
        localStorage.setItem("openpage-gemini-key", cleanKey);
        localStorage.setItem("gemini_api_key", cleanKey);
      }

      // 3. Salva no Supabase Auth (user_metadata) para sincronização permanente entre abas e dispositivos
      try {
        await supabase.auth.updateUser({
          data: { gemini_api_key: cleanKey },
        });
      } catch (authErr) {
        console.warn("[GeminiApiKeyModal] Aviso ao atualizar user_metadata:", authErr);
      }

      // 4. Salva no banco de dados através da server function
      try {
        await saveGeminiApiKeyFn({ data: { apiKey: cleanKey } });
      } catch (dbErr) {
        console.warn("[GeminiApiKeyModal] Server save notice:", dbErr);
      }

      setIsConfigured(true);
      setMaskedKey(`${cleanKey.slice(0, 4)}••••••••${cleanKey.slice(-4)}`);
      setApiKeyInput("");
      setShowKey(false);
      setOpen(false);
      toast.success("✨ Chave do Google Gemini conectada e salva permanentemente!");
    } catch (err: any) {
      const msg = err?.message || "Falha ao salvar a chave. Verifique o Google AI Studio.";
      toast.error(msg);
      setStatusMessage(`Erro: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveKey() {
    if (!confirm("Deseja realmente remover a chave da API do Google Gemini deste dispositivo e da sua conta?")) {
      return;
    }

    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eialink_gemini_api_key");
        localStorage.removeItem("openpage-gemini-key");
        localStorage.removeItem("gemini_api_key");
      }

      try {
        await supabase.auth.updateUser({
          data: { gemini_api_key: null },
        });
      } catch {}

      try {
        await saveGeminiApiKeyFn({ data: { apiKey: "" } });
      } catch {}

      setIsConfigured(false);
      setMaskedKey("");
      setApiKeyInput("");
      setOpen(false);
      toast.success("Chave removida do sistema.");
    } catch (err) {
      toast.error("Erro ao remover chave.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Botão de Trigger visível no cabeçalho */}
      {controlledOpen === undefined && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            triggerClassName ||
            `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isConfigured
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse"
            }`
          }
          title={isConfigured ? `Gemini Conectado (${maskedKey})` : "Conectar Chave Gemini"}
        >
          {isConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {!compact && <span>Gemini 3.8 Flash • Conectado</span>}
              {compact && <span>Gemini Ativo</span>}
            </>
          ) : (
            <>
              <KeyRound size={12} className="text-amber-400" />
              <span>Conectar Chave Gemini</span>
            </>
          )}
        </button>
      )}

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/10 text-white p-6 shadow-2xl rounded-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-500 to-amber-400 p-[1px]">
                <div className="w-full h-full rounded-[11px] bg-zinc-950 flex items-center justify-center text-white">
                  <Sparkles size={16} className="text-amber-300" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Google AI Studio • Chave do Gemini
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Conecte sua API Key oficial para criação autônoma de sites e copiloto IA.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Status atual */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConfigured ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    {isConfigured ? "Status: Conectado e Ativo" : "Status: Desconectado"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {isConfigured ? `Chave salva: ${maskedKey}` : "Nenhuma chave ativa nesta sessão"}
                  </p>
                </div>
              </div>
              {isConfigured && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.8
                </span>
              )}
            </div>

            {/* Explicação de Persistência Garantida */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-2.5 items-start">
              <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-zinc-300 leading-relaxed">
                <span className="font-semibold text-white">Persistência Permanente:</span> Ao salvar, sua chave é sincronizada no seu perfil autenticado da nuvem e no navegador. Ela nunca se desconecta ao recarregar a página ou atualizar código.
              </div>
            </div>

            {/* Formulário para Inserir / Atualizar Chave */}
            <form onSubmit={handleSaveKey} className="space-y-3">
              <label className="block text-xs font-medium text-zinc-300">
                {isConfigured ? "Substituir Chave da API:" : "Cole sua chave da API (API Key):"}
              </label>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={isConfigured ? maskedKey : "AIzaSy..."}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {statusMessage && (
                <p className="text-[11px] text-zinc-400 italic">{statusMessage}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                >
                  <span>Obter chave gratuita no Google AI Studio</span>
                  <ExternalLink size={11} />
                </a>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 size={11} />
                    <span>Desconectar</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !apiKeyInput.trim()}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-black" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Salvar & Conectar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
