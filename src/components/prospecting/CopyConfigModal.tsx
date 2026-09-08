import { useState, useRef } from "react";
import {
  MessageCircle,
  Instagram,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Copy,
  Tag,
  Eye,
  Info,
} from "lucide-react";
import {
  getSavedCopyTemplates,
  saveCopyTemplates,
  resetCopyTemplates,
  interpolatePitch,
  type ProspectingCopyTemplates,
} from "@/modules/prospecting/copyTemplates";

interface CopyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type TabType =
  | "whatsappWithDemo"
  | "whatsappWithoutDemo"
  | "instagramWithDemo"
  | "instagramWithoutDemo";

export function CopyConfigModal({ isOpen, onClose, onSaved }: CopyConfigModalProps) {
  const [templates, setTemplates] = useState<ProspectingCopyTemplates>(() => getSavedCopyTemplates());
  const [activeTab, setActiveTab] = useState<TabType>("whatsappWithDemo");
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [simulateWithReviews, setSimulateWithReviews] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  function handleTagClick(tag: string) {
    const textarea = textareaRef.current;
    const currentText = templates[activeTab];

    if (!textarea) {
      setTemplates((prev) => ({ ...prev, [activeTab]: currentText + tag }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    setTemplates((prev) => ({ ...prev, [activeTab]: newText }));

    // Reposiciona o cursor após a tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  }

  function handleSave() {
    saveCopyTemplates(templates);
    setSavedFeedback(true);
    onSaved?.();
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 900);
  }

  function handleReset() {
    if (confirm("Deseja restaurar todas as mensagens para os textos padrão recomendados?")) {
      const defaults = resetCopyTemplates();
      setTemplates(defaults);
      onSaved?.();
    }
  }

  // Amostras para pré-visualização em tempo real
  const sampleWithReviews = {
    name: "Clínica Inove",
    city: "Teixeira de Freitas",
    niche: "Clínica Médica",
    rating: 3.8,
    reviewsCount: 93,
    demoUrl: "https://eialink.com.br/p/clinica-inove-demo",
    modelVariant: "Modelo Clínico Pro",
  };

  const sampleWithoutReviews = {
    name: "Studio Bella Estética",
    city: "São Paulo",
    niche: "Estética & Beleza",
    rating: null,
    reviewsCount: null,
    demoUrl: "https://eialink.com.br/p/studio-bella-demo",
    modelVariant: "Modelo Estética Glow",
  };

  const currentSample = simulateWithReviews ? sampleWithReviews : sampleWithoutReviews;
  const currentPreview = interpolatePitch(templates[activeTab], currentSample);

  const isWhatsAppTab = activeTab.startsWith("whatsapp");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                Configurar Mensagens de Prospecção
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personalize as mensagens globais enviadas no WhatsApp e no Instagram com dados reais do Google Maps.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seletor de Abas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("whatsappWithDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "whatsappWithDemo"
                ? "bg-card text-emerald-500 shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp (com site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whatsappWithoutDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "whatsappWithoutDemo"
                ? "bg-card text-emerald-500 shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp (sem site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instagramWithDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "instagramWithDemo"
                ? "bg-card text-pink-500 shadow-sm border border-pink-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram (com site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instagramWithoutDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "instagramWithoutDemo"
                ? "bg-card text-pink-500 shadow-sm border border-pink-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram (sem site)</span>
          </button>
        </div>

        {/* Tags Dinâmicas Disponíveis */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Inserir Tag Dinâmica (clique para adicionar)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { tag: "{empresa}", label: "Nome da Empresa", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
              { tag: "{cidade}", label: "Cidade", color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
              { tag: "{nota}", label: "Nota Google", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
              { tag: "{avaliacoes}", label: "Total Avaliações", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
              { tag: "{contexto_google}", label: "Nota + Avaliações Adaptável", color: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
              { tag: "{link_demo}", label: "Link do Site Gerado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
              { tag: "{modelo}", label: "Modelo Visual", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
            ].map(({ tag, label, color }) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-mono font-medium hover:scale-105 active:scale-95 transition-transform ${color}`}
                title={`Inserir ${label}`}
              >
                <span>+</span>
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Área de Edição */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Texto da Mensagem
          </label>
          <textarea
            ref={textareaRef}
            rows={5}
            value={templates[activeTab]}
            onChange={(e) => setTemplates((prev) => ({ ...prev, [activeTab]: e.target.value }))}
            className="input-field w-full text-xs font-sans resize-y leading-relaxed"
            placeholder="Digite sua mensagem usando as tags acima..."
          />
        </div>

        {/* Simulador / Pré-visualização em Tempo Real */}
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-primary" /> Pré-visualização com dados reais
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Cenário de teste:</span>
              <button
                type="button"
                onClick={() => setSimulateWithReviews(true)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                  simulateWithReviews
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                Com 3.8 estrelas e 93 avaliações
              </button>
              <button
                type="button"
                onClick={() => setSimulateWithReviews(false)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                  !simulateWithReviews
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                Sem avaliações no Google
              </button>
            </div>
          </div>

          <div
            className={`rounded-xl p-3 text-xs leading-relaxed border shadow-inner ${
              isWhatsAppTab
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100"
                : "bg-pink-950/20 border-pink-500/30 text-pink-100"
            }`}
          >
            <p className="whitespace-pre-wrap">{currentPreview}</p>
          </div>
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar Padrão Oficial
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={savedFeedback}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-md transition-all"
            >
              {savedFeedback ? <Check className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
              {savedFeedback ? "Salvo com Sucesso!" : "Salvar Configurações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
