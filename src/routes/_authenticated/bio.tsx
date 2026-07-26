import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bio")({
  head: () => ({ meta: [{ title: "Minha Bio — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: BioEditor,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "minha-bio";
}

function BioEditor() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "", display_name: "", description: "", avatar_url: "",
    whatsapp: "", pix_key: "", instagram: "", published: true,
  });

  const { data: bio, isLoading } = useQuery({
    queryKey: ["bio-me-editor"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
      const { data: b } = await supabase.from("bio_pages").select("*").eq("user_id", u.user!.id).maybeSingle();
      return { profile: p, bio: b };
    },
  });

  useEffect(() => {
    if (!bio) return;
    if (bio.bio) {
      setForm({
        slug: bio.bio.slug, display_name: bio.bio.display_name, description: bio.bio.description ?? "",
        avatar_url: bio.bio.avatar_url ?? "", whatsapp: bio.bio.whatsapp ?? "",
        pix_key: bio.bio.pix_key ?? "", instagram: bio.bio.instagram ?? "", published: bio.bio.published,
      });
    } else if (bio.profile) {
      setForm((f) => ({
        ...f,
        display_name: bio.profile.company_name,
        slug: slugify(bio.profile.company_name),
        whatsapp: bio.profile.whatsapp ?? "",
        instagram: bio.profile.instagram ?? "",
      }));
    }
  }, [bio]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const { data: u } = await supabase.auth.getUser();
    const payload = { ...form, user_id: u.user!.id, slug: slugify(form.slug) };
    const { error } = bio?.bio
      ? await supabase.from("bio_pages").update(payload).eq("id", bio.bio.id)
      : await supabase.from("bio_pages").insert(payload);
    setSaving(false);
    if (error) return setMsg(error.message);
    setMsg("Salvo com sucesso!");
    qc.invalidateQueries();
  }

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Bio</h1>
        <p className="mt-2 text-muted-foreground">Personalize sua página pública.</p>
      </div>
      {bio?.bio && (
        <a href={`/p/${bio.bio.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-sm text-[color:var(--primary)]">
          Ver página pública <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <form onSubmit={onSave} className="card-surface space-y-4">
        <F label="URL da sua página">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">/p/</span>
            <input className="input-base" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
        </F>
        <F label="Nome exibido"><input className="input-base" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required /></F>
        <F label="Descrição curta"><textarea className="input-base" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></F>
        <F label="URL do avatar/logo (opcional)"><input className="input-base" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></F>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="WhatsApp (só números com DDD)"><input className="input-base" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" /></F>
          <F label="Chave Pix"><input className="input-base" value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} /></F>
        </div>
        <F label="Instagram (@)"><input className="input-base" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></F>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Página publicada (visível ao público)
        </label>
        {msg && <p className={`text-sm ${msg.includes("sucesso") ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>{msg}</p>}
        <button className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar</>}
        </button>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}
