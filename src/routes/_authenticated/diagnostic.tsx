import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnóstico Digital — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: DiagnosticPage,
});

const Q: { k: string; label: string; hint?: string }[] = [
  { k: "site", label: "Possui site próprio?", hint: "Um domínio próprio (ex: meunegocio.com.br)" },
  { k: "domain", label: "Possui domínio próprio?" },
  { k: "gmb", label: "Possui Google Meu Negócio?" },
  { k: "wpp", label: "Usa WhatsApp Business?" },
  { k: "ads", label: "Faz anúncios online?" },
  { k: "auto", label: "Possui automação de atendimento?" },
  { k: "brand", label: "Possui identidade visual definida?" },
];

const KEY = "eia_diagnostic_v1";

function DiagnosticPage() {
  const [ans, setAns] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); setAns(s.ans ?? {}); setDone(!!s.done); }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (Object.keys(ans).length) localStorage.setItem(KEY, JSON.stringify({ ans, done }));
  }, [ans, done]);

  const answered = Object.keys(ans).length;
  const score = Math.round((Object.values(ans).filter(Boolean).length / Q.length) * 100);
  const status = score >= 70 ? { label: "Excelente", color: "var(--brand-lime)" }
    : score >= 40 ? { label: "Em desenvolvimento", color: "var(--brand-amber)" }
    : { label: "Início da jornada", color: "var(--brand-pink)" };

  const recs: { title: string; desc: string; cta: string; color: string }[] = [];
  if (!ans.site) recs.push({ title: "Criar um site profissional", desc: "Amplie sua presença e credibilidade com um site próprio.", cta: "Ver oportunidade", color: "var(--brand-cyan)" });
  if (!ans.gmb) recs.push({ title: "Configurar Google Meu Negócio", desc: "Apareça nas buscas locais e no Google Maps.", cta: "Ver oportunidade", color: "var(--brand-amber)" });
  if (!ans.wpp) recs.push({ title: "Ativar WhatsApp Business", desc: "Use catálogo, respostas rápidas e etiquetas.", cta: "Ver oportunidade", color: "var(--brand-lime)" });
  if (!ans.ads) recs.push({ title: "Iniciar tráfego pago", desc: "Acelere resultados com anúncios segmentados.", cta: "Ver oportunidade", color: "var(--brand-pink)" });
  if (!ans.auto) recs.push({ title: "Automatizar atendimento", desc: "Não perca leads fora do horário comercial.", cta: "Ver oportunidade", color: "var(--brand-violet)" });

  function reset() { setAns({}); setDone(false); localStorage.removeItem(KEY); }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico Digital</h1>
        <p className="mt-2 text-muted-foreground">Responda 7 perguntas e descubra o quão preparado seu negócio está.</p>
      </div>

      {!done && (
        <div className="card-surface space-y-1">
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span><span>{answered}/{Q.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden mb-6">
            <div className="h-full transition-all" style={{ width: `${(answered / Q.length) * 100}%`, background: "var(--gradient-primary)" }} />
          </div>
          <div className="space-y-3">
            {Q.map((q) => (
              <div key={q.k} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{q.label}</div>
                  {q.hint && <div className="text-xs text-muted-foreground">{q.hint}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setAns({ ...ans, [q.k]: true })}
                    className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1.5 border transition-all ${ans[q.k] === true ? "border-[color:var(--success)] bg-[color:var(--success)]/15 text-[color:var(--success)]" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    <CheckCircle2 className="h-3 w-3" /> Sim
                  </button>
                  <button onClick={() => setAns({ ...ans, [q.k]: false })}
                    className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1.5 border transition-all ${ans[q.k] === false ? "border-[color:var(--destructive)] bg-[color:var(--destructive)]/15 text-[color:var(--destructive)]" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    <XCircle className="h-3 w-3" /> Não
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setDone(true)} disabled={answered < Q.length} className="btn-primary mt-6 disabled:opacity-50">
            Ver meu diagnóstico <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {done && (
        <>
          <div className="card-glow relative overflow-hidden text-center py-10" style={{ background: "var(--gradient-hero)" }}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sua maturidade digital</div>
            <div className="mt-3 relative inline-flex items-center justify-center">
              <svg width="180" height="180" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * (2 * Math.PI * 52)} 999`} />
                <defs>
                  <linearGradient id="g" x1="0" x2="1">
                    <stop offset="0%" stopColor="var(--brand-cyan)" />
                    <stop offset="50%" stopColor="var(--brand-violet)" />
                    <stop offset="100%" stopColor="var(--brand-pink)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <div className="text-5xl font-bold rainbow-text">{score}%</div>
                  <div className="text-xs mt-1" style={{ color: status.color }}>{status.label}</div>
                </div>
              </div>
            </div>
            <button onClick={reset} className="btn-secondary mt-6 mx-auto"><RotateCcw className="h-4 w-4" /> Refazer diagnóstico</button>
          </div>

          {recs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Suas próximas oportunidades</h3>
              {recs.map((r) => (
                <Link key={r.title} to="/growth" className="card-surface flex items-center justify-between gap-4 hover:border-[color:var(--primary)] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in oklab, ${r.color} 20%, transparent)`, color: r.color }}>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[color:var(--primary)] shrink-0">{r.cta}</span>
                </Link>
              ))}
            </div>
          )}
          {recs.length === 0 && (
            <div className="card-surface text-center">
              <p className="font-semibold">Parabéns! Seu negócio já está bem estruturado digitalmente.</p>
              <p className="mt-2 text-sm text-muted-foreground">Continue evoluindo com o Centro de Crescimento.</p>
              <Link to="/growth" className="btn-primary mt-4">Ver oportunidades avançadas</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
