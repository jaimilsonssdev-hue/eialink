import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { NICHES, BR_STATES, MAIN_GOALS } from "@/lib/constants";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Entrar — EIA Digital" },
    { name: "description", content: "Acesse sua conta ou cadastre-se gratuitamente na EIA Digital Platform." },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
  company_name: z.string().trim().min(2).max(120),
  niche: z.string().min(1, "Selecione um segmento"),
  city: z.string().trim().min(2).max(80),
  state: z.string().length(2, "UF"),
  instagram: z.string().trim().max(80).optional().or(z.literal("")),
  has_website: z.boolean(),
  main_goal: z.string().min(1, "Escolha um objetivo"),
  lgpd: z.literal(true, { errorMap: () => ({ message: "Aceite necessário" }) }),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"login" | "signup">(mode ?? "login");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container-narrow py-6">
        <Link to="/" className="inline-flex items-center gap-2 font-display font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
          </span>
          EIA Digital
        </Link>
      </div>
      <div className="flex-1 grid place-items-center px-4 pb-12">
        <div className="w-full max-w-xl">
          <div className="flex gap-2 rounded-lg bg-surface p-1 border border-border mb-6">
            <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "login" ? "bg-surface-elevated" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setTab("signup")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "signup" ? "bg-surface-elevated" : "text-muted-foreground"}`}>Criar conta grátis</button>
          </div>
          {tab === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/dashboard" });
  }
  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4">
      <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
      <div>
        <label className="text-sm text-muted-foreground">Email</label>
        <input className="input-base mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Senha</label>
        <input className="input-base mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-[color:var(--destructive)]">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function SignupForm() {
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", whatsapp: "",
    company_name: "", niche: "", city: "", state: "",
    instagram: "", has_website: false, main_goal: "", lgpd: false,
  });
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function upd<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Verifique os dados");
    setLoading(true);
    const { data, error: signErr } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (signErr || !data.user) { setLoading(false); return setError(signErr?.message ?? "Falha no cadastro"); }
    const { error: profErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: form.full_name, email: form.email, whatsapp: form.whatsapp,
      company_name: form.company_name, niche: form.niche, city: form.city, state: form.state,
      instagram: form.instagram || null, has_website: form.has_website,
      main_goal: form.main_goal, lgpd_accepted_at: new Date().toISOString(),
    });
    setLoading(false);
    if (profErr) return setError(profErr.message);
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4">
      <h1 className="text-2xl font-bold">Crie sua página grátis</h1>
      <p className="text-sm text-muted-foreground">Leva menos de 2 minutos.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome completo"><input className="input-base" value={form.full_name} onChange={(e) => upd("full_name", e.target.value)} required /></Field>
        <Field label="Email"><input className="input-base" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} required /></Field>
        <Field label="Senha"><input className="input-base" type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} required /></Field>
        <Field label="WhatsApp"><input className="input-base" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} required /></Field>
        <Field label="Nome da empresa"><input className="input-base" value={form.company_name} onChange={(e) => upd("company_name", e.target.value)} required /></Field>
        <Field label="Segmento">
          <select className="input-base" value={form.niche} onChange={(e) => upd("niche", e.target.value)} required>
            <option value="">Selecione...</option>
            {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Cidade"><input className="input-base" value={form.city} onChange={(e) => upd("city", e.target.value)} required /></Field>
        <Field label="Estado">
          <select className="input-base" value={form.state} onChange={(e) => upd("state", e.target.value)} required>
            <option value="">UF</option>
            {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Instagram (opcional)"><input className="input-base" placeholder="@seunegocio" value={form.instagram} onChange={(e) => upd("instagram", e.target.value)} /></Field>
        <Field label="Possui site?">
          <select className="input-base" value={form.has_website ? "1" : "0"} onChange={(e) => upd("has_website", e.target.value === "1")}>
            <option value="0">Não</option><option value="1">Sim</option>
          </select>
        </Field>
      </div>
      <Field label="Objetivo principal">
        <select className="input-base" value={form.main_goal} onChange={(e) => upd("main_goal", e.target.value)} required>
          <option value="">Selecione...</option>
          {MAIN_GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={form.lgpd} onChange={(e) => upd("lgpd", e.target.checked)} className="mt-0.5" required />
        <span className="text-muted-foreground">
          Aceito a <a className="underline">Política de Privacidade</a> e concordo com o tratamento dos meus dados conforme a LGPD.
        </span>
      </label>
      {error && <p className="text-sm text-[color:var(--destructive)]">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta grátis <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}
