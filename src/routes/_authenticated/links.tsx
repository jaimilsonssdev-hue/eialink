import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Links — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: LinksPage,
});

function LinksPage() {
  const qc = useQueryClient();
  const { data: bio } = useQuery({
    queryKey: ["bio-for-links"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("bio_pages").select("*").eq("user_id", u.user!.id).maybeSingle();
      return data;
    },
  });
  const { data: links, isLoading } = useQuery({
    queryKey: ["links", bio?.id],
    enabled: !!bio?.id,
    queryFn: async () => {
      const { data } = await supabase.from("bio_links").select("*").eq("bio_page_id", bio!.id).order("position");
      return data ?? [];
    },
  });
  const [form, setForm] = useState({ title: "", url: "" });

  if (!bio) return (
    <div className="card-surface">
      <p>Você precisa criar sua bio antes de adicionar links.</p>
      <Link to="/bio" className="btn-primary mt-4">Criar bio</Link>
    </div>
  );

  async function add() {
    if (!form.title || !form.url) return;
    const pos = (links?.length ?? 0);
    await supabase.from("bio_links").insert({ bio_page_id: bio!.id, title: form.title, url: form.url, position: pos });
    setForm({ title: "", url: "" });
    qc.invalidateQueries({ queryKey: ["links", bio!.id] });
  }
  async function remove(id: string) {
    await supabase.from("bio_links").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["links", bio!.id] });
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("bio_links").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["links", bio!.id] });
  }
  async function move(id: string, dir: -1 | 1) {
    if (!links) return;
    const idx = links.findIndex((l) => l.id === id);
    const swap = links[idx + dir]; if (!swap) return;
    await Promise.all([
      supabase.from("bio_links").update({ position: swap.position }).eq("id", id),
      supabase.from("bio_links").update({ position: links[idx].position }).eq("id", swap.id),
    ]);
    qc.invalidateQueries({ queryKey: ["links", bio!.id] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Links</h1>
        <p className="mt-2 text-muted-foreground">Adicione, ordene e ative/desative seus links.</p>
      </div>
      <div className="card-surface flex flex-col sm:flex-row gap-2">
        <input className="input-base" placeholder="Título (ex: Cardápio)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input-base" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <button onClick={add} className="btn-primary shrink-0"><Plus className="h-4 w-4" /> Adicionar</button>
      </div>
      {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
      <div className="space-y-2">
        {(links ?? []).map((l, i) => (
          <div key={l.id} className="card-surface flex items-center gap-3 py-3">
            <div className="flex flex-col">
              <button disabled={i === 0} onClick={() => move(l.id, -1)} className="disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button disabled={i === (links!.length - 1)} onClick={() => move(l.id, 1)} className="disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{l.title}</div>
              <div className="text-xs text-muted-foreground truncate">{l.url}</div>
            </div>
            <button onClick={() => toggle(l.id, l.active)} className={`text-xs rounded-full px-3 py-1 border ${l.active ? "border-[color:var(--success)] text-[color:var(--success)]" : "border-border text-muted-foreground"}`}>
              {l.active ? "Ativo" : "Inativo"}
            </button>
            <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-[color:var(--destructive)]"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {links?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum link ainda.</p>}
      </div>
    </div>
  );
}
