import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MessageCircle, QrCode, BarChart3, Sparkles, Globe,
  Zap, Check, Instagram, Smartphone, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EIA Digital — Crie sua presença digital gratuitamente" },
      { name: "description", content: "Tenha uma página profissional com WhatsApp, Pix, redes sociais e analytics. Ferramenta gratuita da EIA Digital para pequenos negócios." },
      { property: "og:title", content: "EIA Digital — Presença digital gratuita" },
      { property: "og:description", content: "Crie uma página profissional em minutos. WhatsApp, Pix, links, analytics — tudo grátis." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <Demo />
      <Growth />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
          </span>
          EIA Digital
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex btn-secondary">Entrar</Link>
          <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary">
            Criar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container-narrow py-24 md:py-32 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-[color:var(--primary)]" />
          Plataforma 100% gratuita
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
          Crie sua <span className="gradient-text">presença digital</span><br/>
          e transforme visitantes em clientes.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Tenha uma página profissional com WhatsApp, Pix, redes sociais e ferramentas para ajudar seu negócio a crescer — sem precisar de site, sem código, sem custo.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary text-base">
            Criar minha página grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#demo" className="btn-secondary text-base">Ver demonstração</a>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {["Sem cartão de crédito", "Pronto em 3 minutos", "Compartilhe em qualquer lugar"].map((t) => (
            <span key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--success)]" /> {t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const dores = [
    { i: Instagram, t: "Instagram limita você", d: "Você depende de uma rede que muda regras o tempo todo." },
    { i: Smartphone, t: "Clientes não te encontram", d: "Informações espalhadas fazem você perder vendas." },
    { i: TrendingUp, t: "Oportunidades escapam", d: "Sem analytics, você não sabe o que funciona." },
  ];
  return (
    <section className="py-24">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Seu negócio merece mais do que uma bio no Instagram.</h2>
          <p className="mt-4 text-muted-foreground">Você trabalha demais para depender de uma única rede social.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {dores.map(({ i: Icon, t, d }) => (
            <div key={t} className="card-surface">
              <Icon className="h-6 w-6 text-[color:var(--accent)]" />
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const feats = [
    { i: Globe, t: "Bio profissional", d: "Sua identidade em uma página bonita e rápida." },
    { i: MessageCircle, t: "WhatsApp integrado", d: "Botão direto para receber pedidos e conversas." },
    { i: QrCode, t: "Pix e QR Code", d: "Receba pagamentos com um clique." },
    { i: BarChart3, t: "Analytics em tempo real", d: "Veja visitas, cliques e origem do tráfego." },
  ];
  return (
    <section className="py-24 border-y border-border bg-surface/40">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Tudo que você precisa <span className="gradient-text">num único link</span>.</h2>
          <p className="mt-4 text-muted-foreground">Bio, contato, pagamento e redes sociais — organizados de forma profissional.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {feats.map(({ i: Icon, t, d }) => (
            <div key={t} className="card-surface hover:border-[color:var(--primary)] transition-colors">
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
                <Icon className="h-5 w-5 text-[color:var(--primary-foreground)]" />
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section id="demo" className="py-24">
      <div className="container-narrow grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Sua página <span className="gradient-text">pronta em minutos</span>.</h2>
          <p className="mt-4 text-muted-foreground">Cadastre-se, personalize sua bio, adicione seus links e compartilhe em qualquer lugar.</p>
          <ul className="mt-6 space-y-3">
            {["Compartilhe pelo WhatsApp, Instagram, cartão de visita", "Cliente clica e vai direto pro seu contato", "Você acompanha resultados em tempo real"].map((x) => (
              <li key={x} className="flex gap-3 text-sm"><Check className="h-5 w-5 text-[color:var(--success)] shrink-0" /> {x}</li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-3xl border border-border p-2 bg-surface-elevated shadow-2xl">
            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--gradient-hero)" }}>
              <div className="mx-auto h-20 w-20 rounded-full" style={{ background: "var(--gradient-primary)" }} />
              <h3 className="mt-4 font-display font-bold text-xl">Seu Negócio</h3>
              <p className="text-xs text-muted-foreground mt-1">São Paulo · Confeitaria</p>
              <div className="mt-6 space-y-3">
                {["Fale no WhatsApp","Pagar com Pix","Instagram","Cardápio"].map((t) => (
                  <div key={t} className="rounded-lg bg-surface border border-border py-3 text-sm font-medium">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Growth() {
  return (
    <section className="py-24 border-t border-border bg-surface/40">
      <div className="container-narrow text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" /> Centro de Crescimento
        </div>
        <h2 className="mt-6 text-3xl md:text-4xl font-bold">A plataforma cresce <span className="gradient-text">com você</span>.</h2>
        <p className="mt-4 text-muted-foreground">
          Conforme seu negócio evolui, identificamos oportunidades — como criar um site próprio, aparecer no Google, ou automatizar seu atendimento — e conectamos você a especialistas da EIA Digital.
        </p>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container-narrow">
        <div className="card-surface text-center py-16" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-3xl md:text-5xl font-bold">Comece <span className="gradient-text">gratuitamente</span> agora.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Junte-se a centenas de pequenos negócios que já estão vendendo mais com uma presença digital profissional.</p>
          <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary mt-8 text-base">
            Criar minha página grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container-narrow flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} EIA Digital. Todos os direitos reservados.</p>
        <p>Feito para pequenos negócios crescerem online.</p>
      </div>
    </footer>
  );
}
