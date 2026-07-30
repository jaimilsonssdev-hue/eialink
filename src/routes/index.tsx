import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MessageCircle, QrCode, BarChart3, Sparkles, Globe,
  Zap, Check, Instagram, Smartphone, TrendingUp, Star, Rocket,
  ShieldCheck, LineChart, MousePointerClick, Palette, Heart, UtensilsCrossed,
  Stethoscope, Scissors, Dumbbell, Scale, Building2, PawPrint,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EIA Digital — Crie sua presença digital gratuitamente" },
      { name: "description", content: "Tenha uma página profissional com WhatsApp, Pix, redes sociais e analytics. Ferramenta gratuita da EIA Digital para pequenos negócios." },
      { property: "og:title", content: "EIA Digital — Crie sua presença digital gratuitamente" },
      { property: "og:description", content: "Tenha uma página profissional com WhatsApp, Pix, redes sociais e analytics. Ferramenta gratuita da EIA Digital para pequenos negócios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <NicheShowcase />
      <Marquee />
      <Problem />
      <Solution />
      <Demo />
      <HowItWorks />
      <Testimonials />
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
          <span className="grid h-9 w-9 place-items-center rounded-xl shadow-lg" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
          </span>
          EIA <span className="rainbow-text">LINK</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
          <a href="#como" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#depoimentos" className="hover:text-foreground transition-colors">Clientes</a>
          <a href="#crescimento" className="hover:text-foreground transition-colors">Crescimento</a>
        </nav>
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
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      {/* floating orbs */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl opacity-40" style={{ background: "var(--brand-violet)" }} />
      <div className="pointer-events-none absolute top-40 -right-16 h-80 w-80 rounded-full blur-3xl opacity-30" style={{ background: "var(--brand-cyan)" }} />

      <div className="container-narrow relative py-24 md:py-32 grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
        <div>
          <div className="chip">
            <Zap className="h-3.5 w-3.5 text-[color:var(--brand-amber)]" />
            Plataforma 100% gratuita · Sem cartão
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-bold leading-[1.05]">
            Sua <span className="rainbow-text">presença digital</span>,<br className="hidden sm:block" />
            pronta em <span className="gradient-text">3 minutos</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Crie uma página profissional com WhatsApp, Pix, redes sociais e analytics. Feita para pequenos negócios que querem crescer online — sem site, sem código, sem custo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary text-base">
              Criar minha página grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#demo" className="btn-secondary text-base">Ver demonstração</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {[
              { i: Check, t: "Sem cartão de crédito" },
              { i: ShieldCheck, t: "Dados protegidos (LGPD)" },
              { i: Rocket, t: "Pronto para compartilhar" },
            ].map(({ i: Icon, t }) => (
              <span key={t} className="flex items-center gap-2"><Icon className="h-4 w-4 text-[color:var(--success)]" /> {t}</span>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["#22d3ee", "#a78bfa", "#f472b6", "#facc15"].map((c) => (
                <span key={c} className="h-8 w-8 rounded-full border-2 border-background" style={{ background: c }} />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-[color:var(--brand-amber)]">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                <span className="text-foreground font-medium ml-1">4.9/5</span>
              </div>
              <div className="text-xs text-muted-foreground">+800 negócios já criaram sua bio</div>
            </div>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[23rem]">
      <div className="absolute -inset-6 rounded-3xl opacity-40 blur-2xl" style={{ background: "var(--gradient-rainbow)" }} aria-hidden />
      <div className="relative rounded-[2.3rem] border-[6px] border-[#26212d] p-2 shadow-2xl" style={{ background: "linear-gradient(180deg, #1a1a2e, #09070f)" }}>
        <div className="rounded-[1.85rem] p-6 pt-36 text-center relative overflow-hidden"
             style={{ background: "linear-gradient(180deg, transparent 0 27%, #09070f 49%), radial-gradient(circle at 30% 0%, #6b3fff 0%, transparent 55%), #0a0a1f" }}>
          <img src="/template-assets/restaurant-burger-evening-cover.png" alt="Página de restaurante EIA Link" className="absolute inset-x-0 top-0 h-40 w-full object-cover" />
          <span className="absolute left-4 top-8 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/40 px-2 py-1 text-[10px] text-white"><i className="h-1.5 w-1.5 rounded-full bg-[#25d366]" /> Aberto agora</span>
          <div className="mx-auto h-20 w-20 rounded-full ring-4 ring-white/20" style={{ background: "linear-gradient(135deg,#7432ec,#c52ce8)" }} />
          <h3 className="mt-4 font-display font-bold text-xl text-white">Doceria da Ana</h3>
          <p className="text-xs text-white/70 mt-1">São Paulo · Confeitaria artesanal</p>
          <div className="mt-6 space-y-2.5 text-left">
            {[
              { t: "Falar no WhatsApp", c: "#8b3ff2", i: MessageCircle },
              { t: "Pagar com Pix", c: "#ffffff20", i: QrCode },
              { t: "Instagram", c: "#ffffff20", i: Instagram },
              { t: "Cardápio completo", c: "#ffffff20", i: Globe },
            ].map(({ t, c, i: Icon }) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-white/15 py-3 px-4 text-sm font-medium text-white backdrop-blur"
                   style={{ background: c === "#8b3ff2" ? "linear-gradient(100deg,#7432ec,#c52ce8)" : "rgba(255,255,255,0.08)" }}>
                <Icon className="h-4 w-4" /> {t}
              </div>
            ))}
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-white/50">eiadigital · /p/ana</p>
        </div>
      </div>
      {/* floating badges */}
      <div className="absolute -left-6 top-24 hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/90 backdrop-blur px-3 py-2 shadow-lg">
        <MousePointerClick className="h-4 w-4 text-[color:var(--brand-cyan)]" />
        <span className="text-xs font-medium">+27 cliques hoje</span>
      </div>
      <div className="absolute -right-4 bottom-16 hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/90 backdrop-blur px-3 py-2 shadow-lg">
        <TrendingUp className="h-4 w-4 text-[color:var(--brand-lime)]" />
        <span className="text-xs font-medium">Lead score subiu</span>
      </div>
    </div>
  );
}

function NicheShowcase() {
  const niches = [
    { label: "Restaurantes", icon: UtensilsCrossed, cover: "/template-assets/restaurant-demo-cover.png", tone: "#8b3ff2" },
    { label: "Clínicas", icon: Stethoscope, cover: "/template-assets/clinic-demo-cover.png", tone: "#28a9b5" },
    { label: "Salões", icon: Scissors, cover: "/template-assets/beauty-demo-cover.png", tone: "#e652a7" },
    { label: "Academias", icon: Dumbbell, cover: "/template-assets/business-demo-cover.png", tone: "#45b760" },
    { label: "Advogados", icon: Scale, cover: "/template-assets/business-demo-cover.png", tone: "#bb8c32" },
    { label: "Imobiliárias", icon: Building2, cover: "/template-assets/store-demo-cover.png", tone: "#2a9ed5" },
    { label: "Pet Shop", icon: PawPrint, cover: "/template-assets/creator-demo-cover.png", tone: "#50b86a" },
  ];
  return (
    <section className="border-b border-border bg-[#09070f] py-12">
      <div className="container-narrow">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow">Templates por nicho</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Uma página feita para cada negócio.</h2></div>
          <p className="max-w-md text-sm text-muted-foreground">Você escolhe uma estrutura profissional e personaliza apenas o que é seu.</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {niches.map(({ label, icon: Icon, cover, tone }) => (
            <article key={label} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#120e18] transition duration-200 hover:-translate-y-1 hover:border-white/30">
              <img src={cover} alt="" loading="lazy" className="h-24 w-full object-cover opacity-90 transition duration-200 group-hover:scale-105" />
              <div className="p-3"><Icon className="h-4 w-4" style={{ color: tone }} /><p className="mt-2 text-xs font-semibold text-white">{label}</p><span className="mt-2 block h-1 rounded-full" style={{ background: tone }} /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Confeitarias", "Salões de beleza", "Barbearias", "Clínicas", "Personal trainers", "Restaurantes", "Lojas", "Freelancers", "Consultórios"];
  return (
    <section className="border-y border-border py-6 overflow-hidden">
      <div className="container-narrow flex items-center gap-3 justify-center text-xs uppercase tracking-widest text-muted-foreground flex-wrap">
        <span className="text-[color:var(--brand-cyan)]">●</span> Usado por
        {items.map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const dores = [
    { i: Instagram, t: "Instagram limita você", d: "Você depende de uma rede que muda regras o tempo todo.", c: "var(--brand-pink)" },
    { i: Smartphone, t: "Clientes não te encontram", d: "Informações espalhadas fazem você perder vendas.", c: "var(--brand-cyan)" },
    { i: TrendingUp, t: "Oportunidades escapam", d: "Sem analytics, você não sabe o que funciona.", c: "var(--brand-amber)" },
  ];
  return (
    <section className="py-24">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <div className="chip mx-auto"><Heart className="h-3 w-3 text-[color:var(--brand-pink)]" /> Feito por quem entende sua rotina</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">Seu negócio merece <span className="gradient-text">mais</span> do que uma bio no Instagram.</h2>
          <p className="mt-4 text-muted-foreground">Você trabalha demais para depender de uma única rede social.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {dores.map(({ i: Icon, t, d, c }) => (
            <div key={t} className="card-glow">
              <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c} 20%, transparent)`, color: c }}>
                <Icon className="h-5 w-5" />
              </div>
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
    { i: Globe, t: "Bio profissional", d: "Página bonita, rápida e no seu domínio de link.", c: "var(--brand-cyan)" },
    { i: MessageCircle, t: "WhatsApp integrado", d: "Botão direto pra receber pedidos e conversas.", c: "var(--brand-lime)" },
    { i: QrCode, t: "Pix com um clique", d: "Copia a chave, gera pagamento — sem fricção.", c: "var(--brand-violet)" },
    { i: BarChart3, t: "Analytics em tempo real", d: "Visitas, cliques e origem do tráfego.", c: "var(--brand-pink)" },
    { i: Palette, t: "Temas visuais", d: "Personalize sua bio com paletas exclusivas.", c: "var(--brand-amber)" },
    { i: Sparkles, t: "Diagnóstico digital", d: "Descubra seu score e o que melhorar.", c: "var(--brand-cyan)" },
  ];
  return (
    <section id="solucao" className="py-24 border-y border-border relative">
      <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
      <div className="container-narrow relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="chip mx-auto"><Sparkles className="h-3 w-3 text-[color:var(--brand-cyan)]" /> A plataforma completa</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">Tudo que você precisa <span className="rainbow-text">num único link</span>.</h2>
          <p className="mt-4 text-muted-foreground">Bio, contato, pagamento, redes e insights — organizados de forma profissional.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map(({ i: Icon, t, d, c }) => (
            <div key={t} className="card-surface group hover:-translate-y-1 transition-transform">
              <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c} 20%, transparent)`, color: c }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{t}</h3>
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
      <div className="container-narrow grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="chip"><LineChart className="h-3 w-3 text-[color:var(--brand-lime)]" /> Feito pra converter</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">Sua página <span className="gradient-text">pronta em minutos</span>.</h2>
          <p className="mt-4 text-muted-foreground">Cadastre-se, personalize sua bio, adicione seus links e compartilhe em qualquer lugar. Simples assim.</p>
          <ul className="mt-6 space-y-3">
            {[
              "Compartilhe pelo WhatsApp, Instagram, cartão de visita",
              "Cliente clica e vai direto pro seu contato",
              "Você acompanha resultados em tempo real",
              "Recebe recomendações para crescer mais rápido",
            ].map((x) => (
              <li key={x} className="flex gap-3 text-sm">
                <span className="grid place-items-center h-5 w-5 rounded-full mt-0.5" style={{ background: "var(--gradient-primary)" }}>
                  <Check className="h-3 w-3 text-[color:var(--primary-foreground)]" />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Crie sua conta", d: "Cadastro rápido em 30 segundos.", c: "var(--brand-cyan)" },
    { n: "02", t: "Personalize sua bio", d: "Escolha um tema, adicione seus links, WhatsApp e Pix.", c: "var(--brand-violet)" },
    { n: "03", t: "Compartilhe e cresça", d: "Divulgue seu link único e acompanhe os resultados.", c: "var(--brand-pink)" },
  ];
  return (
    <section id="como" className="py-24 border-y border-border">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <div className="chip mx-auto"><Rocket className="h-3 w-3 text-[color:var(--brand-pink)]" /> Simples de verdade</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">Do zero ao ar em <span className="gradient-text">3 passos</span>.</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card-surface relative overflow-hidden">
              <div className="text-6xl font-display font-bold" style={{ color: s.c, opacity: 0.35 }}>{s.n}</div>
              <h3 className="mt-2 font-semibold text-lg">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { n: "Ana Beatriz", r: "Confeitaria", q: "Em 1 semana já tinha triplicado os pedidos pelo WhatsApp. O link ficou lindo!", c: "linear-gradient(135deg,#fbbf24,#f472b6)" },
    { n: "Carlos Menezes", r: "Barbearia", q: "Finalmente consigo ver quantas pessoas clicam. Isso mudou como divulgo meu negócio.", c: "linear-gradient(135deg,#22d3ee,#6366f1)" },
    { n: "Juliana Reis", r: "Personal Trainer", q: "Grátis, bonito e fácil. Não precisa mais de site pra parecer profissional.", c: "linear-gradient(135deg,#84cc16,#22d3ee)" },
  ];
  return (
    <section id="depoimentos" className="py-24">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <div className="chip mx-auto"><Heart className="h-3 w-3 text-[color:var(--brand-pink)]" /> +800 negócios ativos</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">Quem usa, <span className="rainbow-text">recomenda</span>.</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.map((x) => (
            <div key={x.n} className="card-glow">
              <div className="flex items-center gap-1 text-[color:var(--brand-amber)]">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{x.q}"</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="h-10 w-10 rounded-full" style={{ background: x.c }} />
                <div>
                  <div className="text-sm font-semibold">{x.n}</div>
                  <div className="text-xs text-muted-foreground">{x.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Growth() {
  return (
    <section id="crescimento" className="py-24 border-t border-border">
      <div className="container-narrow grid lg:grid-cols-[1fr_auto] gap-10 items-center">
        <div>
          <div className="chip"><Sparkles className="h-3 w-3 text-[color:var(--accent)]" /> Centro de Crescimento</div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold">A plataforma <span className="gradient-text">cresce com você</span>.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Conforme seu negócio evolui, identificamos oportunidades — site próprio, aparecer no Google, automatizar atendimento — e conectamos você a especialistas da EIA Digital.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 min-w-[280px]">
          {[
            { t: "Site próprio", c: "var(--brand-cyan)" },
            { t: "Google Meu Negócio", c: "var(--brand-amber)" },
            { t: "Automação WhatsApp", c: "var(--brand-lime)" },
            { t: "Anúncios online", c: "var(--brand-pink)" },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-border p-4 text-sm font-medium" style={{ background: `color-mix(in oklab, ${x.c} 12%, transparent)` }}>
              <div className="h-2 w-8 rounded-full mb-3" style={{ background: x.c }} />
              {x.t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container-narrow">
        <div className="relative overflow-hidden rounded-3xl border border-border py-16 px-6 text-center" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-[80%] rounded-full blur-3xl opacity-30" style={{ background: "var(--gradient-rainbow)" }} aria-hidden />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold">Comece <span className="rainbow-text">gratuitamente</span> agora.</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Junte-se a centenas de pequenos negócios vendendo mais com uma presença digital de verdade.</p>
            <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary mt-8 text-base">
              Criar minha página grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[color:var(--success)]" /> Sem cartão</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[color:var(--success)]" /> Sem instalação</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[color:var(--success)]" /> Suporte humano</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container-narrow flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-3 w-3 text-[color:var(--primary-foreground)]" />
          </span>
          © {new Date().getFullYear()} EIA Digital · Feito com <Heart className="h-3 w-3 inline text-[color:var(--brand-pink)]" /> para pequenos negócios.
        </div>
        <div className="flex gap-4">
          <a href="#solucao" className="hover:text-foreground">Solução</a>
          <a href="#como" className="hover:text-foreground">Como funciona</a>
          <Link to="/auth" className="hover:text-foreground">Entrar</Link>
        </div>
      </div>
    </footer>
  );
}
