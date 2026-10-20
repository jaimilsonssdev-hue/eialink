/**
 * Camada de provedores de LLM (somente servidor).
 * Interface única: dado histórico neutro + ferramentas, devolve texto e/ou chamadas de ferramenta.
 * Para adicionar outro provedor basta implementar `LlmProvider` e registrá-lo em PROVIDERS.
 */
import type { AgentMessage, ProviderId, ToolCall } from "./types";

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema simples (type/properties/required)
}

export interface LlmRequest {
  apiKey: string;
  system: string;
  messages: AgentMessage[];
  tools: ToolSchema[];
  temperature?: number;
}

export interface LlmResponse {
  text: string;
  toolCalls: ToolCall[];
  providerRaw?: unknown;
}

export interface LlmProvider {
  id: ProviderId;
  model: string;
  chat(req: LlmRequest): Promise<LlmResponse>;
}

const TIMEOUT_MS = 55_000;

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // resposta não-JSON
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || raw.slice(0, 300) || `HTTP ${res.status}`;
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return data;
}

let callCounter = 0;
function newCallId() {
  callCounter += 1;
  return `call_${Date.now().toString(36)}_${callCounter}`;
}

/* ------------------------------------------------------------------ */
/* GEMINI (generateContent + functionDeclarations)                     */
/* ------------------------------------------------------------------ */

export const GEMINI_AGENT_MODEL = "gemini-3.8-flash";

function toGeminiContents(messages: AgentMessage[]) {
  const contents: Array<{ role: "user" | "model"; parts: any[] }> = [];
  const push = (role: "user" | "model", parts: any[]) => {
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push(...parts);
    else contents.push({ role, parts: [...parts] });
  };

  for (const m of messages) {
    if (m.role === "user") {
      push("user", [{ text: m.content }]);
    } else if (m.role === "assistant") {
      if (m.providerRaw?.provider === "gemini" && Array.isArray(m.providerRaw.data)) {
        push("model", m.providerRaw.data as any[]);
      } else {
        const parts: any[] = [];
        if (m.content) parts.push({ text: m.content });
        for (const tc of m.toolCalls || []) {
          parts.push({
            functionCall: { name: tc.name, args: tc.args },
            thoughtSignature: "skip_thought_signature_validator",
          });
        }
        if (parts.length) push("model", parts);
      }
    } else {
      push("user", [
        {
          functionResponse: {
            name: m.toolName || "ferramenta",
            response: { result: m.content },
          },
        },
      ]);
    }
  }
  return contents;
}

const geminiProvider: LlmProvider = {
  id: "gemini",
  model: GEMINI_AGENT_MODEL,
  async chat({ apiKey, system, messages, tools, temperature }) {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: system }] },
      contents: toGeminiContents(messages),
      generationConfig: { temperature: temperature ?? 0.4 },
    };
    if (tools.length) {
      body.tools = [
        {
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const data = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_AGENT_MODEL}:generateContent`,
      { "x-goog-api-key": apiKey },
      body,
    );

    const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
    if (!parts.length) {
      const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
      throw new Error(`Gemini não retornou conteúdo${reason ? ` (${reason})` : ""}.`);
    }

    const text = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();
    const toolCalls: ToolCall[] = parts
      .filter((p) => p.functionCall)
      .map((p) => ({
        id: p.functionCall.id || newCallId(),
        name: p.functionCall.name,
        args: (p.functionCall.args || {}) as Record<string, unknown>,
      }));

    return { text, toolCalls, providerRaw: parts };
  },
};

/* ------------------------------------------------------------------ */
/* ANTHROPIC (Claude - Messages API com tool_use)                      */
/* ------------------------------------------------------------------ */

function toAnthropicMessages(messages: AgentMessage[]) {
  const out: Array<{ role: "user" | "assistant"; content: any[] }> = [];
  const push = (role: "user" | "assistant", blocks: any[]) => {
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(...blocks);
    else out.push({ role, content: [...blocks] });
  };

  for (const m of messages) {
    if (m.role === "user") {
      push("user", [{ type: "text", text: m.content }]);
    } else if (m.role === "assistant") {
      const blocks: any[] = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls || []) {
        blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      }
      if (blocks.length) push("assistant", blocks);
    } else {
      push("user", [
        {
          type: "tool_result",
          tool_use_id: m.toolCallId,
          content: m.content,
          is_error: m.toolOk === false,
        },
      ]);
    }
  }
  return out;
}

const anthropicProvider: LlmProvider = {
  id: "anthropic",
  model: process.env.AGENT_ANTHROPIC_MODEL || "claude-sonnet-4-5",
  async chat({ apiKey, system, messages, tools, temperature }) {
    const body: Record<string, unknown> = {
      model: anthropicProvider.model,
      max_tokens: 4096,
      temperature: temperature ?? 0.4,
      system,
      messages: toAnthropicMessages(messages),
    };
    if (tools.length) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const data = await postJson(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body,
    );

    const blocks: any[] = data?.content || [];
    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const toolCalls: ToolCall[] = blocks
      .filter((b) => b.type === "tool_use")
      .map((b) => ({ id: b.id, name: b.name, args: (b.input || {}) as Record<string, unknown> }));

    return { text, toolCalls };
  },
};

/* ------------------------------------------------------------------ */
/* OPENAI (GPT - Chat Completions com tools)                           */
/* ------------------------------------------------------------------ */

function toOpenAiMessages(system: string, messages: AgentMessage[]) {
  const out: any[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      const msg: any = { role: "assistant", content: m.content || null };
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }));
      }
      out.push(msg);
    } else {
      out.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
    }
  }
  return out;
}

const openaiProvider: LlmProvider = {
  id: "openai",
  model: process.env.AGENT_OPENAI_MODEL || "gpt-4.1",
  async chat({ apiKey, system, messages, tools, temperature }) {
    const body: Record<string, unknown> = {
      model: openaiProvider.model,
      temperature: temperature ?? 0.4,
      messages: toOpenAiMessages(system, messages),
    };
    if (tools.length) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const data = await postJson(
      "https://api.openai.com/v1/chat/completions",
      { Authorization: `Bearer ${apiKey}` },
      body,
    );

    const msg = data?.choices?.[0]?.message;
    if (!msg) throw new Error("OpenAI não retornou mensagem.");
    const toolCalls: ToolCall[] = (msg.tool_calls || []).map((tc: any) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function?.arguments || "{}");
      } catch {
        // argumentos inválidos -> vazio
      }
      return { id: tc.id, name: tc.function?.name, args };
    });

    return { text: (msg.content || "").trim(), toolCalls };
  },
};

export const PROVIDERS: Record<ProviderId, LlmProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
};

