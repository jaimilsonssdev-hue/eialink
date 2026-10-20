/**
 * Tipos compartilhados (cliente + servidor) do Agente Autônomo EiaLink.
 * Este arquivo NÃO pode importar nada que seja exclusivo de servidor.
 */

export type ProviderId = "gemini" | "anthropic" | "openai";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Gemini 3.8 Flash",
  anthropic: "Claude",
  openai: "GPT",
};

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AgentMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  /** Chamadas de ferramenta pedidas pela IA (somente role=assistant) */
  toolCalls?: ToolCall[];
  /** Resultado de ferramenta (somente role=tool) */
  toolCallId?: string;
  toolName?: string;
  toolOk?: boolean;
  /** Payload original do provedor (necessário p/ assinaturas de raciocínio do Gemini 3) */
  providerRaw?: { provider: ProviderId; data: unknown };
}

export type ApprovalDecision = "once" | "always" | "deny";

export interface PendingApproval {
  callId: string;
  toolName: string;
  summary: string;
  args: Record<string, unknown>;
}

export interface AgentTurnResult {
  status: "done" | "needs_approval" | "error";
  messages: AgentMessage[];
  pending?: PendingApproval[];
  error?: string;
}

export interface AgentDiagnosticResult {
  ok: boolean;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  reply?: string;
  error?: string;
  keys: Record<ProviderId, boolean>;
}

