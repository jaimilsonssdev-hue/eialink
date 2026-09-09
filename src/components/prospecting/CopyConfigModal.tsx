import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Instagram,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Tag,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Key,
  Bot,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  getSavedCopyTemplates,
  saveCopyTemplates,
  resetCopyTemplates,
  interpolatePitch,
  type ProspectingCopyTemplates,
} from "@/modules/prospecting/copyTemplates";
import {
  getSavedGeminiKey,
  saveGeminiKey,
  removeGeminiKey,
  testGeminiKey,
} from "@/modules/prospecting/GeminiAuditorService";

export type CopyModalTabType =
  | "whatsappWithDemo"
  | "whatsappWithoutDemo"
  | "instagramWithDemo"
  | "instagramWithoutDemo"
  | "geminiApiKey";

interface CopyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialTab?: CopyModalTabType;
}

export function CopyConfigModal({
  isOpen,
  onClose,
  onSaved,
  initialTab = "whatsappWithDemo",
}: CopyConfigModalProps) {
  const [templates, setTemplates] = useState<ProspectingCopyTemplates>(() => getSavedCopyTemplates());
  const [activeTab, setActiveTab] = useState<CopyModalTabType>(initialTab);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [simulateWithReviews, setSimulateWithReviews] = useState(true);

  // Estados específicos para a Chave Gemini
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      const savedKey = getSavedGeminiKey() || "";
      setGeminiKeyInput(savedKey);
      setTestResult(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  function handleTagClick(tag: string) {
    if (activeTab === "geminiApiKey") return;
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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  }

  function handleSaveTemplates() {
    saveCopyTemplates(templates);
    setSavedFeedback(true);
    onSaved?.();
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 900);
  }

  function handleResetTemplates() {
    if (confirm("Deseja restaurar todas as mensagens para os textos padrão recomendados?")) {
      const defaults = resetCopyTemplates();
      setTemplates(defaults);
      onSaved?.();
    }
  }

  async function handleTestGemini() {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiKey(geminiKeyInput);
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao testar conexão.";
      setTestResult({ ok: false, message: msg });
    } finally {
      setTestingKey(false);
    }
  }

  function handleSaveGeminiKey() {
    saveGeminiKey(geminiKeyInput);
    setKeySavedFeedback(true);
    setTimeout(() => setKeySavedFeedback(false), 2000);
  }

  function handleRemoveGeminiKey() {
    if (confirm("Deseja remover a chave da API do Gemini salva neste navegador?")) {
      removeGeminiKey();
      setGeminiKeyInput("");
      setTestResult(null);
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
  const currentPreview =
    activeTab !== "geminiApiKey"
      ? interpolatePitch(templates[activeTab], currentSample)
      : "";

  const isWhatsAppTab = activeTab.startsWith("whatsapp");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                Configurações de Prospecção & IA
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personalize as mensagens de abordagem ou configure a chave gratuita da IA Gemini.
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("whatsappWithDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === "whatsappWithDemo"
                ? "bg-card text-emerald-500 shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Whats (c/ site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whatsappWithoutDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === "whatsappWithoutDemo"
                ? "bg-card text-emerald-500 shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Whats (s/ site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instagramWithDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === "instagramWithDemo"
                ? "bg-card text-pink-500 shadow-sm border border-pink-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Insta (c/ site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instagramWithoutDemo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === "instagramWithoutDemo"
                ? "bg-card text-pink-500 shadow-sm border border-pink-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Insta (s/ site)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("geminiApiKey")}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === "geminiApiKey"
                ? "bg-card text-purple-400 shadow-sm border border-purple-500/30"
                : "text-purple-400/80 hover:text-purple-300"
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-purple-400" />
            <span>🤖 IA Gemini</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico com Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === "geminiApiKey" ? (
            /* Painel de Configuração da Chave Gemini */
            <div className="space-y-4">
              {/* Card de Boas-Vindas e Instruções */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Google Gemini 2.5 / 2.0 Flash (100% Gratuito)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    1.500 requisições / dia grátis
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  O Google AI Studio oferece acesso gratuito às IAs Gemini Flash para desenvolvedores e negócios. Você não precisa cadastrar cartão de crédito.
                </p>

                <div className="rounded-lg bg-background/50 border border-border p-3 space-y-1.5 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    Como obter sua chave em menos de 1 minuto:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                    <li>
                      Acesse o painel do Google AI Studio em{" "}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        aistudio.google.com <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </li>
                    <li>Faça login com sua conta Google e clique no botão azul <strong>"Create API key"</strong>.</li>
                    <li>Copie a chave gerada (iniciada por <code>AIzaSy...</code>) e cole no campo abaixo.</li>
                  </ol>
                </div>

                {/* Box de Segurança e Privacidade */}
                <div className="flex items-start gap-2.5 pt-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">Proteção e Privacidade:</strong> Sua chave é armazenada exclusivamente na memória local do seu navegador (<code>localStorage</code>). Ela jamais é enviada aos nossos servidores, nunca é exposta em repositórios Git e você pode removê-la quando desejar.
                  </p>
                </div>
              </div>

              {/* Input com Máscara e Botão de Olho */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Chave de API do Gemini</span>
                  {geminiKeyInput.trim() && (
                    <span className="text-[10px] text-emerald-400 font-normal">
                      Chave informada
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showKeyPassword ? "text" : "password"}
                    value={geminiKeyInput}
                    onChange={(e) => {
                      setGeminiKeyInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                    className="input-field w-full text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    title={showKeyPassword ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showKeyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Resultado do Teste de Conexão */}
              {testResult && (
                <div
                  className={`rounded-xl border p-3 text-xs leading-relaxed flex items-start gap-2.5 ${
                    testResult.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {testResult.ok ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Ações de Chave */}
              <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={testingKey || !geminiKeyInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testingKey ? "animate-spin" : ""}`} />
                    <span>{testingKey ? "Testando conexão..." : "Testar Conexão"}</span>
                  </button>

                  {getSavedGeminiKey() && (
                    <button
                      type="button"
                      onClick={handleRemoveGeminiKey}
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 transition-colors"
                      title="Excluir chave salva deste navegador"
                    >
                      <Trash2 className="h-3 w-3" /> Remover Chave
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveGeminiKey}
                  disabled={!geminiKeyInput.trim() || keySavedFeedback}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {keySavedFeedback ? <Check className="h-4 w-4 text-white" /> : <Key className="h-4 w-4" />}
                  <span>{keySavedFeedback ? "Chave Salva!" : "Salvar Chave"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Painel de Edição de Mensagens Globais */
            <div className="space-y-4">
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
            </div>
          )}
        </div>

        {/* Rodapé e Ações para Abas de Mensagens */}
        {activeTab !== "geminiApiKey" && (
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleResetTemplates}
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
                onClick={handleSaveTemplates}
                disabled={savedFeedback}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-md transition-all"
              >
                {savedFeedback ? <Check className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
                {savedFeedback ? "Salvo com Sucesso!" : "Salvar Configurações"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
