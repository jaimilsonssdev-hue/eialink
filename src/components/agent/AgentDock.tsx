import { useEffect, useRef, useState } from "react";
import { Activity, Ban, Bot, Check, Loader2, Send, Settings2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { agentDiagnosticFn, agentTurnFn } from "@/modules/agent/agent.functions";
import {
  PROVIDER_LABELS,
  type AgentDiagnosticResult,
  type AgentMessage,
  type ApprovalDecision,
  type PendingApproval,
  type ProviderId,
} from "@/modules/agent/types";

const PROVIDER_KEY = "eialink_agent_provider";

const TOOL_LABELS: Record<string, string> = {
  listar_paginas: "Listar páginas",
  consultar_agenda: "Consultar agenda",
  consultar_agente_atendimento: "Consultar agente de atendimento",
  configurar_agenda: "Configurar agenda",
  configurar_agente_atendimento: "Configurar agente de atendimento",
  atualizar_dados_pagina: "Atualizar dados da página",
  publicar_pagina: "Publicar página",
};

export function AgentDock() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingApproval[] | null>(null);
  const [decisions, setDecisions] = useState<Record<string, ApprovalDecision>>({});
  const [alwaysAllow, setAlwaysAllow] = useState<string[]>([]);
  const [diag, setDiag] = useState<AgentDiagnosticResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(PROVIDER_KEY) : null;
    if (saved === "gemini" || saved === "anthropic" || saved === "openai") setProvider(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      const list = data.user?.user_metadata?.agent_always_allow;
      if (Array.isArray(list)) setAlwaysAllow(list.filter((x) => typeof x === "string"));
    });
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, loading]);

  function changeProvider(next: ProviderId) {
    setProvider(next);
    setDiag(null);
    if (typeof window !== "undefined") localStorage.setItem(PROVIDER_KEY, next);
  }

  async function persistAlwaysAllow(next: string[]) {
    setAlwaysAllow(next);
    try {
      await supabase.auth.updateUser({ data: { agent_always_allow: next } });
    } catch {
      // mantém apenas em memória nesta sessão
    }
  }

  async function run(history: AgentMessage[], decided?: Record<string, ApprovalDecision>, allow = alwaysAllow) {
    setLoading(true);
    setError("");
    setPending(null);
    setDecisions({});
    try {
      const res = await agentTurnFn({
        data: { provider, messages: history, decisions: decided, alwaysAllow: allow },
      });
      setMessages(res.messages);
      if (res.status === "needs_approval") setPending(res.pending || []);
      if (res.status === "error") setError(res.error || "Falha desconhecida.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao falar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || pending) return;
    setInput("");
    const next: AgentMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    await run(next);
  }

  async function decide(call: PendingApproval, decision: ApprovalDecision) {
    if (!pending) return;
    let allow = alwaysAllow;
    if (decision === "always" && !alwaysAllow.includes(call.toolName)) {
      allow = [...alwaysAllow, call.toolName];
      void persistAlwaysAllow(allow);
    }
    const nextDecisions = { ...decisions, [call.callId]: decision };
    setDecisions(nextDecisions);
    if (pending.every((p) => nextDecisions[p.callId] || allow.includes(p.toolName))) {
      await run(messages, nextDecisions, allow);
    }
  }

  async function runDiagnostic() {
    setDiagLoading(true);
    try {
      setDiag(await agentDiagnosticFn({ data: { provider } }));
    } catch (err) {
      setDiag({
        ok: false,
        provider,
        model: "-",
        latencyMs: 0,
        error: err instanceof Error ? err.message : "Falha ao executar o diagnóstico.",
        keys: { gemini: false, "gemini-lite": false, "gemini-3.8": false, anthropic: false, openai: false },
      });
    } finally {
      setDiagLoading(false);
    }
  }

  async function saveKeys() {
    const data: Record<string, string | null> = {};
    if (geminiKey.trim()) data.gemini_api_key = geminiKey.trim();
    if (anthropicKey.trim()) data.anthropic_api_key = anthropicKey.trim();
    if (openaiKey.trim()) data.openai_api_key = openaiKey.trim();
    if (!Object.keys(data).length) return;
    await supabase.auth.updateUser({ data });
    setGeminiKey("");
    setAnthropicKey("");
    setOpenaiKey("");
    await runDiagnostic();
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-black shadow-2xl shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
          aria-label="Abrir Agente IA"
        >
          <Bot className="h-4 w-4" /> Agente IA
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 z-[60] flex h-[min(640px,100dvh)] w-full flex-col overflow-hidden border border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl sm:bottom-5 sm:right-5 sm:w-[400px] sm:rounded-2xl">
          <header className="flex items-center justify-between border-b border-white/10 bg-zinc-900/80 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold">Agente EiaLink</span>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={provider}
                onChange={(e) => changeProvider(e.target.value as ProviderId)}
                className="rounded-md border border-white/10 bg-zinc-950 px-1.5 py-1 text-[11px] text-zinc-200"
                aria-label="Provedor de IA"
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="Configurações do agente"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {showSettings && (
            <div className="space-y-3 border-b border-white/10 bg-zinc-900/60 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={runDiagnostic} disabled={diagLoading} className="h-8 text-xs">
                  {diagLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1.5 h-3.5 w-3.5" />}
                  Testar conexão ({PROVIDER_LABELS[provider]})
                </Button>
              </div>
              {diag && (
                <div
                  className={`rounded-lg border p-2 ${diag.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}
                >
                  {diag.ok ? (
                    <p>
                      ✅ Conectado · modelo <b>{diag.model}</b> · {diag.latencyMs} ms · resposta: “{diag.reply}”
                    </p>
                  ) : (
                    <p className="break-words">
                      ❌ {diag.error} <span className="opacity-70">(modelo {diag.model})</span>
                    </p>
                  )}
                  <p className="mt-1 opacity-70">
                    Chaves: Gemini {diag.keys.gemini ? "✓" : "✗"} · Claude {diag.keys.anthropic ? "✓" : "✗"} · GPT{" "}
                    {diag.keys.openai ? "✓" : "✗"}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="font-semibold text-zinc-300">Chaves de API (opcional)</p>
                <Input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Chave própria Gemini (AIzaSy...)"
                  className="h-8 border-white/10 bg-zinc-950 text-xs"
                />
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="Chave Claude (Anthropic) sk-ant-..."
                  className="h-8 border-white/10 bg-zinc-950 text-xs"
                />
                <Input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="Chave GPT (OpenAI) sk-..."
                  className="h-8 border-white/10 bg-zinc-950 text-xs"
                />
                <Button size="sm" onClick={saveKeys} className="h-8 text-xs">
                  Salvar chaves e testar
                </Button>
                <p className="text-[10px] text-zinc-500">Se deixar em branco, o sistema usa a chave global do Gemini.</p>
              </div>

              <div className="space-y-1">
                <p className="flex items-center gap-1 font-semibold text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ações permitidas sempre
                </p>
                {alwaysAllow.length === 0 ? (
                  <p className="text-zinc-500">Nenhuma. O agente sempre pedirá confirmação.</p>
                ) : (
                  alwaysAllow.map((name) => (
                    <div key={name} className="flex items-center justify-between rounded-md bg-zinc-950 px-2 py-1">
                      <span>{TOOL_LABELS[name] || name}</span>
                      <button
                        type="button"
                        onClick={() => persistAlwaysAllow(alwaysAllow.filter((n) => n !== name))}
                        className="text-red-300 hover:text-red-200"
                      >
                        revogar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-zinc-300">
                <p className="font-semibold text-white">Olá! Eu opero o sistema por você.</p>
                <p className="mt-1">
                  Exemplos: “Conecte a agenda com corte, barba e combo, de segunda a sábado das 9h às 19h”, “Configure o
                  agente de atendimento com boas-vindas e botão de orçamento”, “Publique minha página”.
                </p>
              </div>
            )}

            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-emerald-600 px-3 py-2 text-white">
                      {m.content}
                    </div>
                  </div>
                );
              }
              if (m.role === "tool") {
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-[11px] ${m.toolOk === false ? "text-red-300" : "text-emerald-300"}`}
                  >
                    {m.toolOk === false ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    {TOOL_LABELS[m.toolName || ""] || m.toolName}
                    {m.toolOk === false && <span className="truncate text-red-200/80">— {m.content.slice(0, 90)}</span>}
                  </div>
                );
              }
              return m.content ? (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-200">
                    {m.content}
                  </div>
                </div>
              ) : null;
            })}

            {pending && (
              <div className="space-y-2">
                {pending.map((call) => {
                  const decided = decisions[call.callId];
                  return (
                    <div key={call.callId} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="font-semibold text-amber-200">O agente quer executar:</p>
                      <p className="mt-1 text-zinc-100">{call.summary}</p>
                      {decided ? (
                        <p className="mt-2 text-zinc-400">Decisão registrada…</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Button size="sm" className="h-7 text-[11px]" onClick={() => decide(call, "once")}>
                            Permitir desta vez
                          </Button>
                          <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={() => decide(call, "always")}>
                            Permitir sempre
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[11px] text-red-300" onClick={() => decide(call, "deny")}>
                            Negar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-emerald-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Trabalhando…
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-200 break-words">⚠️ {error}</div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 bg-zinc-900/60 p-2.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={pending ? "Responda a confirmação acima…" : "Peça algo ao agente…"}
              disabled={loading || Boolean(pending)}
              className="h-10 border-white/10 bg-zinc-950 text-xs"
            />
            <Button size="sm" onClick={send} disabled={loading || Boolean(pending) || !input.trim()} className="h-10 px-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

