import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnóstico Digital — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: DiagnosticPage,
});

const Q = [
  { k: "site", label: "Possui site próprio?" },
  { k: "domain", label: "Possui domínio próprio?" },
  { k: "gmb", label: "Possui Google Meu Negócio?" },
  { k: "wpp", label: "Usa WhatsApp Business?" },
  { k: "ads", label: "Faz anúncios online?" },
  { k: "auto", label: "Possui automação de atendimento?" },
  { k: "brand", label: "Possui identidade visual definida?" },
];

function DiagnosticPage() {
  const [ans, setAns] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const score = Math.round((Object.values(ans).filter(Boolean).length / Q.length) * 100);

  const recs: string[] = [];
  if (!ans.site) recs.push("Crie um site profissional para ampliar sua presença.");
  if (!ans.gmb) recs.push("Configure o Google Meu Negócio para aparecer nas buscas locais.");
  if (!ans.wpp) recs.push("Ative o WhatsApp Business e catálogos.");
  if (!ans.ads) recs.push("Considere iniciar tráfego pago para acelerar resultados.");
  if (!ans.auto) recs.push("Automatize respostas para não perder leads fora do horário.");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico Digital</h1>
        <p className="mt-2 text-muted-foreground">Responda 7 perguntas para descobrir o quão preparado seu negócio está.</p>
      </div>
      {!done && (
        <div className="card-surface space-y-3">
          {Q.map((q) => (
            <div key={q.k} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{q.label}</span>
              <div className="flex gap-2">
                <button onClick={() => setAns({ ...ans, [q.k]: true })} className={`text-xs rounded-full px-3 py-1 border ${ans[q.k] === true ? "bg-[color:var(--success)]/20 border-[color:var(--success)]" : "border-border"}`}>Sim</button>
                <button onClick={() => setAns({ ...ans, [q.k]: false })} className={`text-xs rounded-full px-3 py-1 border ${ans[q.k] === false ? "bg-[color:var(--destructive)]/20 border-[color:var(--destructive)]" : "border-border"}`}>Não</button>
              </div>
            </div>
          ))}
          <button onClick={() => setDone(true)} disabled={Object.keys(ans).length < Q.length} className="btn-primary disabled:opacity-50">
            Ver meu diagnóstico
          </button>
        </div>
      )}
      {done && (
        <div className="card-surface" style={{ background: "var(--gradient-hero)" }}>
          <p className="text-sm text-muted-foreground">Seu negócio está</p>
          <div className="text-6xl font-bold gradient-text mt-2">{score}%</div>
          <p className="mt-2 text-muted-foreground">preparado digitalmente.</p>
          {recs.length > 0 && (
            <>
              <h3 className="mt-6 font-semibold">Recomendações:</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                {recs.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </>
          )}
          <button onClick={() => { setAns({}); setDone(false); }} className="btn-secondary mt-6">Refazer</button>
        </div>
      )}
    </div>
  );
}
