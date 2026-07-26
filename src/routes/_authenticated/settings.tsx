import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NICHES, BR_STATES } from "@/lib/constants";
import { Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [form, setForm] = useState({ full_name: "", whatsapp: "", company_name: "", niche: "", city: "", state: "", instagram: "" });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
      if (data) setForm({
        full_name: data.full_name ?? "", whatsapp: data.whatsapp ?? "",
        company_name: data.company_name ?? "", niche: data.niche ?? "",
        city: data.city ?? "", state: data.state ?? "", instagram: data.instagram ?? "",
      });
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update(form).eq("id", u.user!.id);
    setSaving(false);
    setMsg(error ? error.message : "Salvo!");
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="mt-2 text-muted-foreground">Seus dados de perfil.</p>
      </div>
      <form onSubmit={save} className="card-surface space-y-4">
        <F label="Nome"><input className="input-base" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></F>
        <F label="WhatsApp"><input className="input-base" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></F>
        <F label="Empresa"><input className="input-base" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></F>
        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Segmento"><select className="input-base" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>{NICHES.map((n) => <option key={n} value={n}>{n}</option>)}</select></F>
          <F label="Estado"><select className="input-base" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></F>
        </div>
        <F label="Cidade"><input className="input-base" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></F>
        <F label="Instagram"><input className="input-base" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></F>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button className="btn-primary" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar</>}</button>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}
