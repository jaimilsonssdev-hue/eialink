import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  Key,
  ShieldCheck,
  Share2,
} from "lucide-react";
import type { ProspectedCompany } from "@/modules/prospecting/types";
import {
  auditCompany,
  getSavedGeminiKey,
  type CompanyAuditResult,
} from "@/modules/prospecting/GeminiAuditorService";
import { formatPhone } from "@/modules/prospecting/scoring";

interface ProspectAuditorModalProps {
  company: ProspectedCompany | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig?: () => void;
  demoUrl?: string | null;
}

export function ProspectAuditorModal({
  company,
  isOpen,
  onClose,
  onOpenConfig,
  demoUrl,
}: ProspectAuditorModalProps) {
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<CompanyAuditResult | null>(null);
  const [pitchText, setPitchText] = useState("");
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const result = await auditCompany(company, demoUrl || undefined);
      setAudit(result);
      setPitchText(result.consultativePitch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao gerar auditoria.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [company, demoUrl]);

  useEffect(() => {
    if (isOpen && company) {
      setHasApiKey(Boolean(getSavedGeminiKey()));
      void runAudit();
    } else {
      setAudit(null);
      setPitchText("");
      setError(null);
    }
  }, [isOpen, company, runAudit]);

  if (!isOpen || !company) return null;

  const phoneDigits = (company.whatsapp || company.phone || "").replace(/\D/g, "");
  const formattedPhone = formatPhone(company.whatsapp || company.phone);

  function handleCopyPitch() {
    if (!pitchText) return;
    void navigator.clipboard.writeText(pitchText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  }

  function handleCopyFullAudit() {
    if (!audit) return;
    const fullText = `DIAGNÓSTICO COMERCIAL & AUDITORIA DE PRESENÇA DIGITAL
Empresa: ${audit.companyName} (${audit.niche} - ${audit.city})
Avaliação Google: ${audit.rating ? `${audit.rating} ⭐ (${audit.reviewsCount ?? 0} avaliações)` : "Sem nota"}
Possui Site: ${audit.hasWebsite ? "Sim" : "Não (Oportunidade Crítica)"}
${audit.demoUrl ? `Demonstrativo Criado: ${audit.demoUrl}` : ""}

RESUMO EXECUTIVO:
${audit.executiveSummary}

PONTOS FORTES IDENTIFICADOS:
${audit.strengths.map((s) => `• ${s}`).join("\n")}

GARGALOS CRÍTICOS & VULNERABILIDADES:
${audit.vulnerabilities.map((v) => `• ${v}`).join("\n")}

PITCH CONSULTIVO RECOMENDADO:
${pitchText}`;

    void navigator.clipboard.writeText(fullText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  }

  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(pitchText)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-display text-foreground leading-tight">
                  Auditor de Prospecção com IA
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                  AI SDR
                </span>
                {audit?.source === "gemini" ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Gemini AI Ativo
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Diagnóstico Inteligente
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diagnóstico de presença digital e pitch consultivo sob medida para{" "}
                <span className="font-semibold text-foreground">{company.name}</span>.
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

        {/* Informações da Empresa */}
        <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-xl bg-muted/40 border border-border text-xs shrink-0">
          <span className="font-semibold text-foreground">{company.name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{company.niche || "Serviço Local"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{company.city || "Brasil"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-amber-500 dark:text-amber-400">
            ⭐ {company.rating ? `${company.rating} (${company.reviews_count ?? 0} avaliações)` : "Sem avaliações"}
          </span>
          <span className="text-muted-foreground">·</span>
          <span
            className={`font-semibold ${
              company.has_website
                ? "text-blue-500 dark:text-blue-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {company.has_website ? "Possui Site" : "Sem Site Oficial"}
          </span>

          {formattedPhone && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-mono font-medium">
                📲 {formattedPhone}
              </span>
            </>
          )}

          {audit?.demoUrl && (
            <>
              <span className="text-muted-foreground">·</span>
              <a
                href={audit.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Ver Demo <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Analisando presença digital com Inteligência Artificial...
              </p>
              <p className="text-xs text-muted-foreground max-w-sm text-center">
                Avaliando reputação do Google Maps, gargalos de conversão e elaborando pitch consultivo.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Erro ao processar diagnóstico
              </div>
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={runAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 font-medium hover:bg-rose-500/30 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Tentar Novamente
              </button>
            </div>
          ) : audit ? (
            <>
              {/* Resumo Executivo */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Resumo do Diagnóstico Comercial
                </span>
                <p className="text-xs leading-relaxed text-foreground">
                  {audit.executiveSummary}
                </p>
              </div>

              {/* Grid de Forças e Vulnerabilidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Forças */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 space-y-2">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Pontos Fortes Identificados
                  </span>
                  <ul className="space-y-1.5">
                    {audit.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2 leading-tight">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerabilidades */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-3.5 space-y-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Gargalos de Venda & Presença
                  </span>
                  <ul className="space-y-1.5">
                    {audit.vulnerabilities.map((vuln, idx) => (
                      <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2 leading-tight">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pitch Consultivo Customizável */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" /> Pitch Consultivo Recomendado (Editável)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {pitchText.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  className="input-field w-full text-xs font-sans resize-y leading-relaxed bg-muted/30 focus:bg-background"
                  placeholder="Mensagem para enviar ao lead..."
                />
              </div>

              {/* Aviso sobre Chave Gemini se não estiver usando */}
              {!hasApiKey && audit.source === "heuristic_fallback" && (
                <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Key className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>
                      Usando diagnóstico heurístico rápido. Ative a IA do Google Gemini (gratuita) para análises ainda mais profundas e personalizadas.
                    </span>
                  </div>
                  {onOpenConfig && (
                    <button
                      type="button"
                      onClick={onOpenConfig}
                      className="shrink-0 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Configurar Chave
                    </button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              title="Reanalisar com IA"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Reanalisar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFullAudit}
              disabled={loading || !audit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              title="Copiar diagnóstico completo (pontos fortes, vulnerabilidades e pitch)"
            >
              {copiedFull ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedFull ? "Copiado!" : "Copiar Diagnóstico"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPitch}
              disabled={loading || !pitchText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {copiedPitch ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedPitch ? "Copiado!" : "Copiar Pitch"}</span>
            </button>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-md hover:shadow-emerald-500/20 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar no WhatsApp 📲</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-xl bg-muted text-muted-foreground px-4 py-2 text-xs font-semibold opacity-60 cursor-not-allowed"
                title="Sem número de WhatsApp cadastrado para esta empresa"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Sem WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
