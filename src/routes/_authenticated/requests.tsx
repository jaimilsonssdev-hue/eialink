import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Solicitar Serviço — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: RequestsPage,
});

const TYPES = [
  { v: "site", l: "Criação de site" },
  { v: "landing", l: "Landing page" },
  { v: "google", l: "Google Meu Negócio / SEO" },
  { v: "whatsapp", l: "Automação de WhatsApp" },
  { v: "ads", l: "Tráfego pago / Anúncios" },
  { v: "outro", l: "Outro" },
];

function RequestsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState(""); const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); const [feedback, setFeedback] = useState<string | null>(null);

  const { data: reqs } = useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("service_requests").select("*").eq("user_id", u.user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return; setLoading(true); setFeedback(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("service_requests").insert({ user_id: u.user!.id, service_type: type, message: msg });
    setLoading(false);
    if (error) return setFeedback(error.message);
    setFeedback("Solicitação enviada! Entraremos em contato em breve.");
    setType(""); setMsg("");
    qc.invalidateQueries({ queryKey: ["my-requests"] });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Solicitar Serviço</h1>
        <p className="mt-2 text-muted-foreground">Descreva sua necessidade — nossa equipe entrará em contato.</p>
      </div>
      <form onSubmit={submit} className="card-surface space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Tipo de serviço</label>
          <select className="input-base mt-1" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="">Selecione...</option>
            {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Mensagem</label>
          <textarea className="input-base mt-1" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Conte um pouco sobre o que você precisa..." />
        </div>
        {feedback && <p className={`text-sm ${feedback.startsWith("Solicitação") ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>{feedback}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar</>}
        </button>
      </form>
      <div className="card-surface">
        <h3 className="font-semibold mb-3">Suas solicitações</h3>
        {(reqs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>}
        {reqs?.map((r) => (
          <div key={r.id} className="py-2 border-b border-border last:border-0 text-sm">
            <div className="flex justify-between"><span className="font-medium">{r.service_type}</span><span className="text-xs text-muted-foreground">{r.status}</span></div>
            {r.message && <p className="text-muted-foreground text-xs mt-1">{r.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
