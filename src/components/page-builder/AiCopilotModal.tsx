import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Palette,
  HeartHandshake,
  MessageSquareQuote,
  Layers,
  ChevronRight,
} from "lucide-react";
import { generateCopilotSiteFn, type AiCopilotResult } from "@/modules/ai/copilot.functions";

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: {
    displayName: string;
    niche: string;
    city?: string;
  };
  onApply: (result: AiCopilotResult) => void;
}

const SAMPLE_BRIEFINGS = [
  {
    label: "Clínica & Odonto",
    text: "Clínica Odontológica Oral Arte em Salvador. Especializada em implantes dentários, facetas de resina e harmonização facial. Queremos passar autoridade médica com atendimento humanizado. Cores azul royal escuro e detalhes em dourado elegante.",
  },
  {
    label: "Hamburgueria & Lanches",
    text: "Hamburgueria artesanal Brasa & Fogo. Smash burgers na brasa, bacon crocante artesanal, batatas rústicas e milkshakes cremosos. Foco em entrega ultrarrápida quentinha no bairro e ingredientes 100% frescos. Cores preto carvão e laranja fogo.",
  },
  {
    label: "Estética & Beleza",
    text: "Studio Glow Estética Avançada. Procedimentos de limpeza de pele profunda, drenagem linfática, microagulhamento e unhas em fibra. Espaço aconchegante para bem-estar e autoestima feminina. Tons de vinho bordô, rosa champagne e iluminação quente.",
  },
  {
    label: "Advocacia & Jurídico",
    text: "Escritório Toledo & Associados Advocacia. Assessoria jurídica empresarial, direito do trabalho e planejamento tributário seguro. Atendimento transparente, ético e ágil sem termos complicados. Cores azul marinho profundo e ouro nobre.",
  },
  {
    label: "Marketing Digital",
    text: "Agência Alavanca Digital. Gestão de tráfego pago para negócios locais, criação de páginas de alta conversão e funis de vendas no WhatsApp. Já geramos mais de R$ 2 milhões em faturamento para clientes. Tons de grafite escuro e ciano neon.",
  },
];

const LOCAL_STORAGE_KEY = "eialink_gemini_override_key";

export function AiCopilotModal({
  isOpen,
  onClose,
  currentContext,
  onApply,
}: AiCopilotModalProps) {
  const [briefing, setBriefing] = useState("");
  const [overrideKey, setOverrideKey] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AiCopilotResult | null>(null);

  useEffect(() => {
    if (overrideKey) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, overrideKey.trim());
      } catch {
        // ignore
      }
    }
  }, [overrideKey]);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!briefing.trim() || briefing.trim().length < 3) {
      setError("Por favor, digite ou cole um briefing de pelo menos 3 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);
    setGeneratedResult(null);

    try {
      const result = await generateCopilotSiteFn({
        data: {
          briefing: briefing.trim(),
          currentContext: {
            displayName: currentContext.displayName,
            niche: currentContext.niche,
            city: currentContext.city,
          },
          overrideApiKey: overrideKey.trim() || undefined,
        },
      });

      setGeneratedResult(result);
    } catch (err: any) {
      console.error("Erro no Copiloto IA:", err);
      setError(
        err?.message || "Ocorreu um erro ao comunicar com a IA do Google AI Studio. Verifique os dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmApply() {
    if (!generatedResult) return;
    onApply(generatedResult);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-foreground space-y-6 my-8">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header do Copiloto */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Google AI Studio · Gemini Flash</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Copiloto IA no Construtor
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Cole as informações brutas do cliente (bio do Instagram, cores, serviços, fotos, história). A inteligência artificial organizará os textos persuasivos, cores e diferenciais <b>sem alterar o modelo ou layout</b>.
          </p>
        </div>

        {/* Banner de Segurança Nível Sênior */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3 text-xs text-emerald-300">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-emerald-200">
              Segurança Máxima de Credenciais
            </span>
            <span className="text-emerald-400/90 text-[11px] leading-relaxed block">
              As requisições são processadas diretamente no servidor seguro. Suas chaves de API nunca são expostas publicamente no navegador dos visitantes e nunca são enviadas ao GitHub.
            </span>
          </div>
        </div>

        {/* Formulário do Briefing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Briefing / Informações do Negócio
            </label>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
            >
              <KeyRound className="h-3 w-3" />
              {showKeyConfig ? "Ocultar Chave de API" : "Chave de API Personalizada"}
            </button>
          </div>

          {/* Campo opcional de Chave de API */}
          {showKeyConfig && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 space-y-2 animate-fade-in text-xs">
              <label className="text-zinc-300 font-semibold block">
                Chave da API do Google AI Studio (Opcional caso configurada no servidor):
              </label>
              <input
                type="password"
                value={overrideKey}
                onChange={(e) => setOverrideKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-lg border border-zinc-700 bg-black/60 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500">
                A chave é salva apenas no seu navegador localmente e transmitida por canal criptografado de servidor.
              </p>
            </div>
          )}

          <textarea
            rows={5}
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="Exemplo: Clínica estética em Salvador especializada em botox, preenchimento e hidratação. O tom deve ser acolhedor e luxuoso. Queremos cores em vinho e dourado, fotos limpas e botão para agendar avaliação gratuita no WhatsApp..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-y"
          />

          {/* Chips de Exemplo Rápido */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium block">
              Ou escolha um briefing pronto para testar instantaneamente:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_BRIEFINGS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBriefing(sample.text);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-purple-500/50 hover:bg-purple-950/30 text-[11px] text-zinc-300 transition-all cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-xs text-red-300 animate-shake">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Prévia do Resultado Gerado pela IA */}
        {generatedResult && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Conteúdo & Identidade Gerados com Sucesso!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block font-semibold">Nome & Descrição:</span>
                <b className="text-white block text-sm">{generatedResult.display_name}</b>
                <p className="text-zinc-300 text-[11px] line-clamp-2">{generatedResult.description}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block font-semibold">Paleta de Cores Harmônica:</span>
                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: generatedResult.custom_theme?.primary }}
                    title="Primária"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: generatedResult.custom_theme?.background }}
                    title="Fundo"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: generatedResult.custom_theme?.card_bg }}
                    title="Card"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 ml-1">
                    {generatedResult.custom_theme?.primary} · {generatedResult.custom_theme?.mode}
                  </span>
                </div>
              </div>
            </div>

            {generatedResult.differentials && generatedResult.differentials.length > 0 && (
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                <span className="text-purple-400 font-bold">✓</span>
                <span>{generatedResult.differentials.length} Diferenciais de alta autoridade prontos</span>
                <span className="mx-1 text-zinc-700">·</span>
                <span>{generatedResult.testimonials?.length || 0} Depoimentos gerados</span>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            Cancelar
          </button>

          {!generatedResult ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Analisando e Criando Identidade...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Gerar com Inteligência Artificial</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Aplicar no Site Agora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

