import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageService } from "@/modules/page/services/PageService";
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MessageCircle,
  Loader2,
  Lock,
  ExternalLink,
} from "lucide-react";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/resgatar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Resgatar Meu Site Oficial — EIA Link" },
      { name: "description", content: "Assuma o controle da sua presença digital profissional no EIA Link." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClaimPage,
});

interface ClaimPageData {
  id: string;
  displayName: string;
  slug: string;
  theme: string;
  coverUrl?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  targetEmail?: string | null;
}

function ClaimPage() {
  const { token } = useSearch({ from: "/resgatar" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<ClaimPageData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado da sessão do usuário
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Formulário de Cadastro / Login para quem não tem sessão
  const [authTab, setAuthTab] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void checkSessionAndPage();
  }, [token]);

  async function checkSessionAndPage() {
    setLoading(true);
    setErrorMessage(null);

    // 1. Verifica sessão atual
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      setCurrentUser(auth.user);
    }

    // 2. Busca informações do link de resgate
    if (!token) {
      setErrorMessage("Nenhum código de resgate informado. Verifique o link recebido.");
      setLoading(false);
      return;
    }

    try {
      const res = await PageService.getClaimInfo(token);
      if (res.valid && res.page) {
        setPageData(res.page as ClaimPageData);
        if (res.page.targetEmail && !email) {
          setEmail(res.page.targetEmail);
        }
      } else {
        setErrorMessage("Este link de resgate é inválido, expirou ou a página já foi transferida.");
      }
    } catch {
      setErrorMessage("Não foi possível carregar as informações do resgate.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimExistingSession() {
    if (!token) return;
    setClaiming(true);
    setErrorMessage(null);

    try {
      const res = await PageService.claimPage(token);
      setClaimSuccess(true);
      setTimeout(() => {
        navigate({ to: "/builder", search: { page: res.pageId } });
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao resgatar página.";
      setErrorMessage(msg);
      setClaiming(false);
    }
  }

  async function handleSignupAndClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAuthError(null);
    setAuthLoading(true);

    try {
      // 1. Cadastra o novo usuário
      const { data: signUpData, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            whatsapp: whatsapp.trim(),
          },
        },
      });

      if (signErr || !signUpData.user) {
        throw new Error(signErr?.message || "Falha no cadastro.");
      }

      // 2. Cria o registro de perfil
      await supabase.from("profiles").insert({
        id: signUpData.user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        company_name: pageData?.displayName || fullName.trim(),
        niche: "Geral",
        city: "São Paulo",
        state: "SP",
        has_website: true,
        main_goal: "Receber mais clientes",
        lgpd_accepted_at: new Date().toISOString(),
      });

      // 3. Executa o resgate da página imediatamente
      const claimRes = await PageService.claimPage(token);
      setClaimSuccess(true);
      setTimeout(() => {
        navigate({ to: "/builder", search: { page: claimRes.pageId } });
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta e resgatar página.";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLoginAndClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAuthError(null);
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message || "E-mail ou senha incorretos.");
      }

      setCurrentUser(data.user);

      // Executa o resgate da página
      const claimRes = await PageService.claimPage(token);
      setClaimSuccess(true);
      setTimeout(() => {
        navigate({ to: "/builder", search: { page: claimRes.pageId } });
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar e resgatar página.";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[color:var(--primary)]/20">
      {/* Navbar Minimalista */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display font-bold text-lg">
            <span
              className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-md shadow-[color:var(--primary)]/20"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span>EIA Link</span>
          </Link>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Ativação Segura & Oficial
          </span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="mx-auto max-w-5xl w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="text-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--primary)] mx-auto" />
            <p className="text-sm text-muted-foreground">Localizando sua página profissional...</p>
          </div>
        ) : errorMessage || !pageData ? (
          <div className="mx-auto max-w-md text-center py-12 rounded-2xl border border-dashed border-border bg-card/60 p-8 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 grid place-items-center">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold font-display">Link Indisponível</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link
              to="/"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold"
            >
              Ir para a Página Inicial
            </Link>
          </div>
        ) : claimSuccess ? (
          <div className="mx-auto max-w-md text-center py-12 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 space-y-4 animate-in zoom-in-95">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold font-display text-emerald-400">Página Resgatada com Sucesso!</h1>
            <p className="text-sm text-muted-foreground">
              Você agora é o proprietário oficial de <strong>{pageData.displayName}</strong>. Redirecionando para o editor...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mx-auto mt-2" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Lado Esquerdo: Card de Apresentação e Prévia da Página */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Presença Digital Pronta
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight tracking-tight">
                  Seu site oficial está pronto para você assumir o controle.
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Uma presença digital de alta conversão foi criada para{" "}
                  <strong className="text-foreground">{pageData.displayName}</strong>. Crie sua senha de
                  acesso gratuita para receber agendamentos, editar fotos e divulgar seu link oficial.
                </p>
              </div>

              {/* Card de Prévia Visual */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
                <div className="relative aspect-[16/7] w-full bg-muted">
                  {pageData.coverUrl ? (
                    <img src={pageData.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-slate-900 to-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Avatar sobreposto */}
                  <div className="absolute -bottom-4 left-4 h-12 w-12 rounded-full border-2 border-card bg-surface overflow-hidden shadow-lg">
                    {pageData.avatarUrl ? (
                      <img src={pageData.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[color:var(--primary)] text-white font-bold">
                        {pageData.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-6 space-y-2">
                  <h3 className="font-bold text-base text-foreground">{pageData.displayName}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {pageData.description || "Página profissional completa e pronta para converter visitantes em clientes."}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1 border border-border">
                      <Layers className="h-3 w-3 text-[color:var(--primary)]" /> Vitrine de Serviços
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1 border border-border">
                      <Calendar className="h-3 w-3 text-emerald-400" /> Agendamento Online
                    </span>
                    <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1 border border-border">
                      <MessageCircle className="h-3 w-3 text-green-400" /> WhatsApp Integrado
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Link público da sua página:</span>
                <a
                  href={`/p/${pageData.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[color:var(--primary)] hover:underline inline-flex items-center gap-1"
                >
                  eialink.com.br/p/{pageData.slug} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Lado Direito: Ação de Resgate (Logado ou Criação de Conta) */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
                {currentUser ? (
                  /* Usuário já está logado */
                  <div className="space-y-5 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[color:var(--primary)]/15 text-[color:var(--primary)] grid place-items-center">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-display">Vincular à sua conta</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você está conectado como <strong>{currentUser.email}</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimExistingSession}
                      disabled={claiming}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-lg shadow-[color:var(--primary)]/20"
                    >
                      {claiming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {claiming ? "Vinculando página..." : "Assumir e Gerenciar Minha Página"}
                    </button>
                  </div>
                ) : (
                  /* Usuário precisa criar conta ou entrar */
                  <div className="space-y-4">
                    <div className="flex gap-2 rounded-xl bg-surface p-1 border border-border">
                      <button
                        type="button"
                        onClick={() => setAuthTab("signup")}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                          authTab === "signup"
                            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Criar Minha Senha Grátis
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab("login")}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                          authTab === "login"
                            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Já Tenho Conta (Entrar)
                      </button>
                    </div>

                    {authError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                        {authError}
                      </div>
                    )}

                    {authTab === "signup" ? (
                      <form onSubmit={handleSignupAndClaim} className="space-y-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Seu Nome Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Dra. Juliana Souza"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="input-field mt-1 w-full text-xs"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">Seu Melhor E-mail</label>
                            <input
                              type="email"
                              required
                              placeholder="contato@empresa.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="input-field mt-1 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">WhatsApp de Atendimento</label>
                            <input
                              type="tel"
                              required
                              placeholder="(11) 99999-9999"
                              value={whatsapp}
                              onChange={(e) => setWhatsapp(e.target.value)}
                              className="input-field mt-1 w-full text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Crie uma Senha de Acesso</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field mt-1 w-full text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-lg shadow-[color:var(--primary)]/20 mt-2"
                        >
                          {authLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {authLoading ? "Criando conta e vinculando..." : "Ativar Meu Site Grátis & Acessar Painel"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleLoginAndClaim} className="space-y-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
                          <input
                            type="email"
                            required
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field mt-1 w-full text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Senha</label>
                          <input
                            type="password"
                            required
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field mt-1 w-full text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-lg shadow-[color:var(--primary)]/20 mt-2"
                        >
                          {authLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {authLoading ? "Entrando e resgatando..." : "Entrar & Vincular Página à Minha Conta"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EIA Link. Todos os direitos reservados.
      </footer>
    </div>
  );
}

