import { useState } from "react";
import { MessageCircle, Check, X, ArrowRight, Sparkles } from "lucide-react";
import { buildAttributedWhatsAppUrl } from "@/lib/attribution";

export interface TriageQuestion {
  title: string;
  options: string[];
}

export interface TriageConfig {
  enabled: boolean;
  headerTitle?: string;
  questions: TriageQuestion[];
}

interface WhatsAppTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  config: TriageConfig;
  baseMessage?: string | null;
}

export function WhatsAppTriageModal({
  isOpen,
  onClose,
  phone,
  config,
  baseMessage,
}: WhatsAppTriageModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  const questions = config.questions?.length > 0 ? config.questions : [
    {
      title: "Como podemos te ajudar?",
      options: ["Agendar Atendimento", "Saber Preços e Valores", "Tirar Dúvidas Gerais"],
    },
    {
      title: "Qual o melhor período para você?",
      options: ["Manhã", "Tarde", "Noite / Horário Comercial"],
    },
  ];

  const isComplete = questions.every((_, idx) => Boolean(selectedAnswers[idx]));

  const handleSelectOption = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleFinish = () => {
    const formattedSummary = questions
      .map((q, idx) => `• ${q.title}: *${selectedAnswers[idx] || "Não especificado"}*`)
      .join("\n");

    const message = `Olá! Gostaria de atendimento com as seguintes informações:\n${formattedSummary}\n\nPodemos prosseguir?`;
    const finalUrl = buildAttributedWhatsAppUrl(phone, message);

    window.open(finalUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-foreground leading-none">
                {config.headerTitle || "Atendimento Rápido"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Selecione para agilizar seu atendimento no WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {qIndex + 1}. {q.title}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((option, optIndex) => {
                  const isSelected = selectedAnswers[qIndex] === option;
                  return (
                    <button
                      key={optIndex}
                      type="button"
                      onClick={() => handleSelectOption(qIndex, option)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all text-left ${
                        isSelected
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-foreground shadow-sm"
                          : "border-border/70 bg-surface-elevated/30 text-muted-foreground hover:border-border hover:bg-surface-elevated/60"
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[color:var(--primary)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinish}
            disabled={!isComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isComplete
                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                : "var(--surface-elevated)",
            }}
          >
            <span>Continuar para o WhatsApp</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          {!isComplete && (
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Selecione uma opção de cada pergunta para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
