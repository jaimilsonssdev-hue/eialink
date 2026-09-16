import { useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Settings2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

export interface ChatQuickOption {
  id: string;
  label: string;
  icon?: string;
  actionType: "text" | "services" | "budget" | "location" | "whatsapp";
  replyText?: string;
}

export interface ChatFlowConfig {
  assistantName?: string;
  welcomeMessage?: string;
  enablePhotoInQuote?: boolean;
  enableCityInQuote?: boolean;
  options: ChatQuickOption[];
}

export const DEFAULT_CHAT_FLOW: ChatFlowConfig = {
  assistantName: "Atendente Virtual",
  welcomeMessage:
    "Olá! Seja muito bem-vindo(a) ao nosso atendimento oficial! 👋✨ Como posso te ajudar hoje? Escolha uma das opções abaixo:",
  enablePhotoInQuote: true,
  enableCityInQuote: true,
  options: [
    {
      id: "servicos",
      label: "Ver Serviços",
      icon: "🎨",
      actionType: "services",
      replyText: "Aqui estão nossos principais serviços. Toque em qualquer um para solicitar:",
    },
    {
      id: "orcamento",
      label: "Pedir Orçamento",
      icon: "💰",
      actionType: "budget",
      replyText: "Perfeito! Vou te fazer algumas perguntas rápidas para montar seu orçamento sem compromisso.",
    },
    {
      id: "localizacao",
      label: "Endereço e Horários",
      icon: "📍",
      actionType: "location",
    },
    {
      id: "whatsapp",
      label: "Falar no WhatsApp",
      icon: "📱",
      actionType: "whatsapp",
      replyText: "Toque no botão abaixo para conversar diretamente com nossa equipe no WhatsApp:",
    },
  ],
};

interface ChatFlowEditorProps {
  value?: ChatFlowConfig | null;
  onChange: (flow: ChatFlowConfig) => void;
  companyName: string;
}

export function ChatFlowEditor({ value, onChange, companyName }: ChatFlowEditorProps) {
  const flow: ChatFlowConfig = {
    ...DEFAULT_CHAT_FLOW,
    ...(value || {}),
    options: value?.options && value.options.length > 0 ? value.options : DEFAULT_CHAT_FLOW.options,
  };

  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const updateFlow = (patch: Partial<ChatFlowConfig>) => {
    onChange({
      ...flow,
      ...patch,
    });
  };

  const handleOptionChange = (id: string, patch: Partial<ChatQuickOption>) => {
    const updatedOptions = flow.options.map((opt) => (opt.id === id ? { ...opt, ...patch } : opt));
    updateFlow({ options: updatedOptions });
  };

  const handleAddOption = () => {
    const newId = `custom_${Date.now()}`;
    const newOption: ChatQuickOption = {
      id: newId,
      label: "Nova Resposta Rápida",
      icon: "💬",
      actionType: "text",
      replyText: `Com certeza! Em ${companyName} prezamos pela sua comodidade e atendimento de alto padrão. Como podemos ajudar?`,
    };
    updateFlow({ options: [...flow.options, newOption] });
    setExpandedOptionId(newId);
  };

  const handleRemoveOption = (id: string) => {
    updateFlow({ options: flow.options.filter((opt) => opt.id !== id) });
    if (expandedOptionId === id) setExpandedOptionId(null);
  };

  const handleReset = () => {
    onChange(DEFAULT_CHAT_FLOW);
    setExpandedOptionId(null);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sky-500/20">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/20 text-sky-400">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Configurações do Atendente (Typebot Simplificado)
            </h3>
            <p className="text-xs text-muted-foreground">
              Personalize o nome, a saudação e crie respostas automáticas sob medida.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restaurar Padrão</span>
        </button>
      </div>

      {/* Nome do Atendente & Saudação Inicial */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Nome de Exibição do Atendente
          </label>
          <input
            type="text"
            value={flow.assistantName || "Atendente Virtual"}
            onChange={(e) => updateFlow({ assistantName: e.target.value })}
            placeholder="Ex: Atendente Virtual, Sofia, Equipe Oficial..."
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Mensagem de Boas-Vindas do Atendente
          </label>
          <textarea
            rows={3}
            value={flow.welcomeMessage || ""}
            onChange={(e) => updateFlow({ welcomeMessage: e.target.value })}
            placeholder="Digite a mensagem que o atendente enviará assim que o cliente abrir o chat..."
            className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:border-sky-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Regras do Fluxo de Orçamento */}
      <div className="space-y-2 pt-2 border-t border-sky-500/20">
        <label className="block text-xs font-semibold text-foreground">
          Etapas da Triagem de Orçamento
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70 bg-card/60 cursor-pointer">
            <input
              type="checkbox"
              checked={flow.enableCityInQuote ?? true}
              onChange={(e) => updateFlow({ enableCityInQuote: e.target.checked })}
              className="rounded border-border text-sky-500"
            />
            <span className="text-muted-foreground">Perguntar cidade / bairro</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70 bg-card/60 cursor-pointer">
            <input
              type="checkbox"
              checked={flow.enablePhotoInQuote ?? true}
              onChange={(e) => updateFlow({ enablePhotoInQuote: e.target.checked })}
              className="rounded border-border text-sky-500"
            />
            <span className="text-muted-foreground">Oferecer envio de foto opcional</span>
          </label>
        </div>
      </div>

      {/* Lista de Respostas / Botões do Typebot */}
      <div className="space-y-3 pt-2 border-t border-sky-500/20">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            Botões e Respostas Interativas ({flow.options.length})
          </label>
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Resposta</span>
          </button>
        </div>

        <div className="space-y-2">
          {flow.options.map((opt, idx) => {
            const isExpanded = expandedOptionId === opt.id;
            return (
              <div
                key={opt.id}
                className="rounded-xl border border-border/80 bg-card/80 overflow-hidden shadow-2xs transition-all"
              >
                {/* Linha Resumo do Botão */}
                <div
                  className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedOptionId(isExpanded ? null : opt.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{opt.icon || "💬"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Ação:{" "}
                        {opt.actionType === "text"
                          ? "Texto Personalizado"
                          : opt.actionType === "services"
                          ? "Vitrine de Serviços"
                          : opt.actionType === "budget"
                          ? "Fluxo de Orçamento"
                          : opt.actionType === "location"
                          ? "Endereço e Horários"
                          : "WhatsApp Direto"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {flow.options.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveOption(opt.id);
                        }}
                        className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir resposta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </div>
                </div>

                {/* Painel de Edição Expandido */}
                {isExpanded && (
                  <div className="p-3 bg-background/50 border-t border-border/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] text-muted-foreground mb-1">Ícone</label>
                        <input
                          type="text"
                          value={opt.icon || "💬"}
                          onChange={(e) => handleOptionChange(opt.id, { icon: e.target.value })}
                          className="w-full text-center rounded-lg border border-border bg-card py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] text-muted-foreground mb-1">Texto do Botão</label>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => handleOptionChange(opt.id, { label: e.target.value })}
                          placeholder="Ex: Formas de Pagamento..."
                          className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Tipo de Ação</label>
                      <select
                        value={opt.actionType}
                        onChange={(e) =>
                          handleOptionChange(opt.id, { actionType: e.target.value as any })
                        }
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        <option value="text">Enviar Resposta em Texto Personalizada</option>
                        <option value="services">Apresentar Vitrine de Serviços</option>
                        <option value="budget">Iniciar Formulário de Orçamento / Agendamento</option>
                        <option value="location">Exibir Endereço e Horários com Google Maps</option>
                        <option value="whatsapp">Redirecionar para o WhatsApp</option>
                      </select>
                    </div>

                    {opt.actionType === "text" && (
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">
                          Resposta que o Atendente enviará
                        </label>
                        <textarea
                          rows={3}
                          value={opt.replyText || ""}
                          onChange={(e) => handleOptionChange(opt.id, { replyText: e.target.value })}
                          placeholder="Digite a resposta que o bot enviará quando o cliente clicar neste botão..."
                          className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

