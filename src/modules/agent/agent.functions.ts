/**
 * Server functions do Agente Autônomo EiaLink.
 * - agentDiagnosticFn: testa de ponta a ponta a conexão com o provedor escolhido
 * - agentTurnFn: executa o loop de raciocínio + ferramentas com confirmação do usuário
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveGeminiApiKeyAsync } from "@/modules/ai/google-ai.service";
import { PROVIDERS } from "./providers";
import { TOOLS, TOOL_MAP, TOOL_SCHEMAS } from "./tools";
import type {
  AgentDiagnosticResult,
  AgentMessage,
  AgentTurnResult,
  ApprovalDecision,
  PendingApproval,
  ProviderId,
} from "./types";

const MAX_STEPS = 8;
const VALID_PROVIDERS: ProviderId[] = ["gemini", "gemini-lite", "gemini-3.8", "anthropic", "openai"];

const AGENT_SYSTEM_PROMPT = `Você é o Agente EiaLink: um assistente autônomo que opera as ferramentas da plataforma EiaLink em nome do dono do negócio (agenda online, agente de atendimento, dados e publicação das páginas).

REGRAS:
1. Fale sempre em português do Brasil, de forma direta e amigável. Respostas curtas.
2. Para agir, USE AS FERRAMENTAS. Nunca diga que fez algo sem ter chamado a ferramenta correspondente e recebido sucesso.
3. Nunca invente IDs. Se o usuário tiver mais de uma página e não disser qual, use listar_paginas e pergunte.
4. Antes de configurar, consulte o estado atual (consultar_agenda / consultar_agente_atendimento) quando isso evitar sobrescrever algo.
5. Ferramentas que alteram dados pedem confirmação do usuário automaticamente; você não precisa pedir de novo. Se o usuário negar, aceite e proponha uma alternativa.
6. Se faltar informação essencial (ex.: duração e preço dos serviços), pergunte em vez de chutar.
7. Ao terminar, resuma em 1-3 linhas o que foi feito e, se houver, informe o link (ex.: /agendar/slug).
8. Use as informações do negócio já cadastradas para adaptar serviços, textos e horários ao nicho do cliente.`;

/* ---------------------------- helpers ---------------------------- */

async function getUserMeta(context: { supabase: any; accessToken: string; claims: any }) {
  try {
    const { data } = await context.supabase.auth.getUser(context.accessToken);
    if (data?.user?.user_metadata) return data.user.user_metadata as Record<string, any>;
  } catch {
    // cai para claims
  }
  return (context.claims?.user_metadata || {}) as Record<string, any>;
}

async function resolveKey(provider: ProviderId, meta: Record<string, any>): Promise<string | null> {
  const clean = (v: unknown) => (typeof v === "string" && v.trim().length > 8 ? v.trim() : null);
  if (provider === "gemini" || provider === "gemini-lite" || provider === "gemini-3.8") {
    return clean(meta.gemini_api_key) || clean(await resolveGeminiApiKeyAsync());
  }
  if (provider === "anthropic") {
    return clean(meta.anthropic_api_key) || clean(process.env.ANTHROPIC_API_KEY);
  }
  return clean(meta.openai_api_key) || clean(process.env.OPENAI_API_KEY);
}

async function keyStatus(meta: Record<string, any>): Promise<Record<ProviderId, boolean>> {
  const hasGemini = Boolean(await resolveKey("gemini", meta));
  return {
    gemini: hasGemini,
    "gemini-lite": hasGemini,
    "gemini-3.8": hasGemini,
    anthropic: Boolean(await resolveKey("anthropic", meta)),
    openai: Boolean(await resolveKey("openai", meta)),
  };
}

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

/* ---------------------------- diagnóstico ---------------------------- */

export const agentDiagnosticFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { provider: ProviderId }) => d)
  .handler(async ({ data, context }): Promise<AgentDiagnosticResult> => {
    const provider = VALID_PROVIDERS.includes(data.provider) ? data.provider : "gemini";
    const llm = PROVIDERS[provider];
    const meta = await getUserMeta(context as any);
    const keys = await keyStatus(meta);
    const started = Date.now();

    const apiKey = await resolveKey(provider, meta);
    if (!apiKey) {
      return {
        ok: false,
        provider,
        model: llm.model,
        latencyMs: 0,
        error: `Nenhuma chave de API encontrada para ${provider}. Cadastre a chave no painel do agente.`,
        keys,
      };
    }

    try {
      const res = await llm.chat({
        apiKey,
        system: "Você é um teste de conexão. Responda exatamente com a palavra: OK",
        messages: [{ role: "user", content: "Teste de conexão." }],
        tools: [],
        temperature: 0,
      });
      return { ok: true, provider, model: llm.model, latencyMs: Date.now() - started, reply: res.text.slice(0, 200), keys };
    } catch (err) {
      return { ok: false, provider, model: llm.model, latencyMs: Date.now() - started, error: errMessage(err), keys };
    }
  });

/* ---------------------------- loop do agente ---------------------------- */

export interface AgentTurnInput {
  provider: ProviderId;
  messages: AgentMessage[];
  /** Decisões do usuário para chamadas pendentes (callId -> decisão) */
  decisions?: Record<string, ApprovalDecision>;
  /** Ferramentas que o usuário marcou como "permitir sempre" */
  alwaysAllow?: string[];
}

export const agentTurnFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: AgentTurnInput) => d)
  .handler(async ({ data, context }): Promise<AgentTurnResult> => {
    const provider = VALID_PROVIDERS.includes(data.provider) ? data.provider : "gemini";
    const llm = PROVIDERS[provider];
    const messages: AgentMessage[] = Array.isArray(data.messages) ? [...data.messages] : [];
    const decisions = data.decisions || {};
    const alwaysAllow = new Set((data.alwaysAllow || []).filter((n) => TOOL_MAP.has(n)));

    if (!messages.length) return { status: "error", messages, error: "Nenhuma mensagem enviada." };

    const meta = await getUserMeta(context as any);
    const apiKey = await resolveKey(provider, meta);
    if (!apiKey) {
      return {
        status: "error",
        messages,
        error: `Nenhuma chave de API encontrada para ${provider}. Cadastre a chave no painel do agente.`,
      };
    }

    const toolCtx = { supabase: context.supabase, userId: context.userId };

    /** Executa/resolve as chamadas de ferramenta da última mensagem do assistente. */
    async function processPending(): Promise<PendingApproval[]> {
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant" || !last.toolCalls?.length) return [];

      const pending: PendingApproval[] = [];
      const results: AgentMessage[] = [];

      for (const call of last.toolCalls) {
        const tool = TOOL_MAP.get(call.name);
        if (!tool) {
          results.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.name,
            toolOk: false,
            content: `Ferramenta desconhecida: ${call.name}. Ferramentas disponíveis: ${TOOLS.map((t) => t.name).join(", ")}.`,
          });
          continue;
        }

        const decision = decisions[call.id];
        const allowed = tool.risk === "read" || alwaysAllow.has(tool.name) || decision === "once" || decision === "always";

        if (decision === "deny") {
          results.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.name,
            toolOk: false,
            content: "O usuário NEGOU esta ação. Não tente novamente sem que ele peça.",
          });
          continue;
        }

        if (!allowed) {
          pending.push({ callId: call.id, toolName: call.name, summary: tool.summarize(call.args), args: call.args });
          continue;
        }

        try {
          const out = await tool.execute(call.args, toolCtx);
          results.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.name,
            toolOk: true,
            content: JSON.stringify(out).slice(0, 6000),
          });
        } catch (err) {
          results.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.name,
            toolOk: false,
            content: `Erro: ${errMessage(err)}`,
          });
        }
      }

      // Só anexa resultados quando TODAS as chamadas foram resolvidas (mantém a ordem exigida pelos provedores)
      if (pending.length === 0) messages.push(...results);
      return pending;
    }

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const pending = await processPending();
        if (pending.length) return { status: "needs_approval", messages, pending };

        const last = messages[messages.length - 1];
        if (last.role === "assistant" && !last.toolCalls?.length) {
          return { status: "done", messages };
        }

        const res = await llm.chat({
          apiKey,
          system: AGENT_SYSTEM_PROMPT,
          messages,
          tools: TOOL_SCHEMAS,
        });

        messages.push({
          role: "assistant",
          content: res.text,
          toolCalls: res.toolCalls.length ? res.toolCalls : undefined,
          providerRaw: res.providerRaw !== undefined ? { provider, data: res.providerRaw } : undefined,
        });

        if (!res.toolCalls.length) return { status: "done", messages };
      }

      messages.push({
        role: "assistant",
        content: "Cheguei ao limite de passos neste turno. Peça para eu continuar se ainda faltar algo.",
      });
      return { status: "done", messages };
    } catch (err) {
      return { status: "error", messages, error: errMessage(err) };
    }
  });
