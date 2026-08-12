import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PublicPricingSection } from "@/components/billing/PublicPricingSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, ArrowRight, BarChart3, Building2, CalendarDays, Check, ChevronRight,
  CircleDollarSign, Dumbbell, Heart, Instagram, Link2, MapPin,
  MessageCircle, Palette, PawPrint, Rocket, Scissors, ShieldCheck,
  ShoppingBag, Sparkles, Stethoscope, Store, TrendingUp, UtensilsCrossed,
  WandSparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EIA Link — Vitrines digitais que vendem" },
      { name: "description", content: "Crie seu Biolink premium em minutos e transforme visitantes em clientes." },
    ],
  }),
  component: Landing,
});

const templates = [
  { name: "Casa do Sabor", niche: "Restaurante", icon: UtensilsCrossed, cover: "/template-assets/restaurant-demo-cover.png", color: "#8b3ff2" },
  { name: "Clínica Harmonia", niche: "Clínica", icon: Stethoscope, cover: "/template-assets/clinic-demo-cover.png", color: "#16a6b8" },
  { name: "Studio Beauty", niche: "Salão", icon: Scissors, cover: "/template-assets/beauty-demo-cover.png", color: "#e64d9b" },
  { name: "Power Gym", niche: "Academia", icon: Dumbbell, cover: "/template-assets/academy-gym-cover.png", color: "#42b966" },
  { name: "Dr. Carlos", niche: "Advogado", icon: ShieldCheck, cover: "/template-assets/law-office-cover.png", color: "#c99a40" },
  { name: "Lar & Sonhos", niche: "Imobiliária", icon: Building2, cover: "/template-assets/store-demo-cover.png", color: "#259ed5" },
  { name: "Amor de Patas", niche: "Pet Shop", icon: PawPrint, cover: "/template-assets/creator-demo-cover.png", color: "#45ba6c" },
] as const;

const benefits = [
  [MessageCircle, "WhatsApp integrado", "Fale com seus clientes na hora que importa."],
  [ShoppingBag, "Catálogo e produtos", "Mostre seus produtos e serviços de forma profissional."],
  [CalendarDays, "Agendamento online", "Permita que clientes agendem serviços diretamente."],
  [Sparkles, "Redes sociais", "Conecte Instagram, TikTok, Facebook e muito mais."],
] as const;

const testimonials = [
  ["Rafael Martins", "Casa do Sabor", "Aumentamos 3x mais pedidos depois que começamos a usar a EIA Link. Transformou nosso negócio!", "#45ba6c"],
  ["Dra. Juliana Alves", "Clínica Harmonia", "Conseguimos mais agendamentos e tratamentos muito mais profissionais para nossos pacientes.", "#16a6b8"],
  ["Mariana Costa", "Studio Beauty", "Meu salão ganhou um novo cara na internet e minhas clientes amaram a facilidade de contato.", "#e64d9b"],
] as const;

function Landing() {
  const [previewTemplate, setPreviewTemplate] = useState<(typeof templates)[number] | null>(null);
  const landingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = landingRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={landingRef} className="landing-motion-root min-h-screen overflow-hidden bg-[#07060b] text-[#f8f5ff]">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_55%_0,rgba(124,58,237,.16),transparent_24rem),radial-gradient(circle_at_95%_90%,rgba(217,70,239,.11),transparent_30rem)]" />
      <Nav />
      <Hero />
      <div data-reveal><Difference /></div>
      <div data-reveal><Templates onPreview={setPreviewTemplate} /></div>
      <div data-reveal><Benefits /></div>
      <div data-reveal><HowItWorks /></div>
      <div data-reveal><Testimonials /></div>
      <div data-reveal><PublicPricingSection /></div>
      <div data-reveal><FinalCta /></div>
      <Footer />
      <Dialog open={Boolean(previewTemplate)} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        {previewTemplate && (
          <DialogContent className="template-preview-dialog max-h-[90vh] max-w-sm overflow-y-auto">
            <DialogHeader>
              <p className="eyebrow">Prévia do modelo</p>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogDescription>Exemplo visual de uma página para {previewTemplate.niche.toLowerCase()}.</DialogDescription>
            </DialogHeader>
            <TemplatePhone template={previewTemplate} featured />
            <Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary justify-center">Criar com este estilo <ArrowRight className="h-4 w-4" /></Link>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

function Nav() {
  return <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07060b]/85 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5"><Brand compact /><nav className="hidden items-center gap-6 text-xs text-[#c6bdd0] md:flex"><a href="#templates" className="hover:text-white">Templates</a><a href="#exemplos" className="hover:text-white">Exemplos</a><a href="#beneficios" className="hover:text-white">Benefícios</a><a href="#como-funciona" className="hover:text-white">Como funciona</a></nav><div className="flex gap-2"><Link to="/auth" className="btn-secondary hidden text-xs sm:inline-flex">Entrar</Link><Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary text-xs">Criar meu BioLink grátis</Link></div></div></header>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"><Link2 className="h-5 w-5" /></span><div><b className={compact ? "font-display text-lg" : "font-display text-3xl"}>EIA <span className="text-fuchsia-400">LINK</span></b>{!compact && <p className="text-[10px] font-bold tracking-[.2em] text-violet-300">VITRINES DIGITAIS QUE VENDEM.</p>}</div></div>;
}

function Hero() {
  return (
    <section data-reveal className="landing-motion-section landing-motion-section-1 relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-12 lg:pb-20 lg:pt-16">
      <div className="landing-hero-surface rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(29,15,50,.94),rgba(9,7,15,.97))] p-6 shadow-[0_20px_80px_rgba(0,0,0,.3)] md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="landing-hero-copy">
            <p className="eyebrow">Biolinks premium para negócios</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.06] tracking-tight md:text-6xl">Seu negócio merece mais do que um <span className="text-fuchsia-400">link na bio.</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-[#cbc2d7] md:text-base">Crie um BioLink Premium em poucos minutos e transforme visitantes em clientes todos os dias.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary">Criar meu BioLink grátis <ArrowRight className="h-4 w-4" /></Link><a href="#exemplos" className="btn-secondary">Ver exemplos</a></div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#c6bdd0]"><span><Check className="mr-1 inline h-3.5 w-3.5 text-green-400" />Grátis para começar</span><span><Check className="mr-1 inline h-3.5 w-3.5 text-violet-300" />Sem cartão de crédito</span><span><Check className="mr-1 inline h-3.5 w-3.5 text-fuchsia-300" />Publique em 1 minuto</span></div>
          </div>
          <div className="landing-hero-visual relative">
            <div className="landing-hero-orbit landing-hero-orbit-one" aria-hidden />
            <div className="landing-hero-orbit landing-hero-orbit-two" aria-hidden />
            <div className="absolute inset-x-12 bottom-0 h-20 rounded-full bg-violet-600/35 blur-3xl" />
            <TemplateRail featured />
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateRail({ featured = false, onPreview }: { featured?: boolean; onPreview?: (template: typeof templates[number]) => void }) {
  const items = featured ? templates.slice(0, 5) : templates;
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [paused, setPaused] = useState(false);
  const activeIndexRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);

  const changeSlide = useCallback((nextIndex: number, nextDirection: "next" | "previous") => {
    const currentIndex = activeIndexRef.current;
    if (currentIndex === nextIndex) return;
    activeIndexRef.current = nextIndex;
    setPreviousIndex(currentIndex);
    setDirection(nextDirection);
    setActiveIndex(nextIndex);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setPreviousIndex(null), 460);
  }, []);

  const nextSlide = () => changeSlide((activeIndex + 1) % items.length, "next");
  const previousSlide = () => changeSlide((activeIndex - 1 + items.length) % items.length, "previous");

  useEffect(() => {
    if (!featured || paused) return;
    const timer = window.setInterval(() => {
      changeSlide((activeIndexRef.current + 1) % items.length, "next");
    }, 4200);
    return () => window.clearInterval(timer);
  }, [changeSlide, featured, items.length, paused]);

  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
  }, []);

  if (featured) {
    const current = items[activeIndex];
    return (
      <div
        className="relative mx-auto max-w-[18rem]"
        aria-roledescription="carrossel"
        aria-label="Exemplos de BioLinks por nicho"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="landing-template-carousel"
          onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (startX === null || endX === undefined || Math.abs(startX - endX) < 42) return;
            if (startX > endX) nextSlide(); else previousSlide();
          }}
        >
          {previousIndex !== null && <div aria-hidden="true" className={`landing-template-carousel-slide landing-template-carousel-exit-${direction}`}><TemplatePhone template={items[previousIndex]} featured /></div>}
          <div key={current.name} className={`landing-template-carousel-slide landing-template-carousel-enter-${direction}`}><TemplatePhone template={current} featured /></div>
        </div>
        <button type="button" aria-label="Exemplo anterior" className="absolute left-[-1rem] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0812]/90 text-white" onClick={previousSlide}><ArrowLeft className="h-4 w-4" /></button>
        <button type="button" aria-label="Próximo exemplo" className="absolute right-[-1rem] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0812]/90 text-white" onClick={nextSlide}><ArrowRight className="h-4 w-4" /></button>
        <div className="mt-3 flex justify-center gap-1.5" aria-label="Indicadores do carrossel">{items.map((template, index) => <button key={template.name} type="button" aria-label={`Ver ${template.niche}`} aria-current={index === activeIndex} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-fuchsia-400" : "w-1.5 bg-white/30"}`} onClick={() => changeSlide(index, index > activeIndex ? "next" : "previous")} />)}</div>
      </div>
    );
  }
  return <div className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none]">{items.map((template, index) => <TemplatePhone key={template.name} template={template} featured={featured && index === 0} onPreview={onPreview} />)}</div>;
}

function getTemplateDemo(template: (typeof templates)[number]) {
  switch (template.name) {
    case "Casa do Sabor": return { eyebrow: "ABERTO AGORA", subtitle: "Hamburgueria artesanal", action: "Pedir pelo WhatsApp", items: ["Smash", "Pizza", "Brownie"] };
    case "Clínica Harmonia": return { eyebrow: "ATENDIMENTO HUMANO", subtitle: "Cuidado que acolhe", action: "Agendar consulta", items: ["Tratamentos", "Equipe", "Horários"] };
    case "Studio Beauty": return { eyebrow: "BELEZA & BEM-ESTAR", subtitle: "Sua melhor versão", action: "Agendar horário", items: ["Cabelo", "Unhas", "Make"] };
    case "Power Gym": return { eyebrow: "TREINO & PERFORMANCE", subtitle: "Seu próximo nível", action: "Agendar aula", items: ["Planos", "Aulas", "Equipe"] };
    case "Dr. Carlos": return { eyebrow: "ATUAÇÃO JURÍDICA", subtitle: "Orientação com clareza", action: "Falar com advogado", items: ["Áreas", "Equipe", "Contato"] };
    case "Lar & Sonhos": return { eyebrow: "IMÓVEIS SELECIONADOS", subtitle: "Encontre seu lugar", action: "Ver imóveis", items: ["Comprar", "Alugar", "Falar"] };
    default: return { eyebrow: "CUIDADO ESPECIAL", subtitle: "Tudo para seu pet", action: "Agendar serviço", items: ["Banho", "Consulta", "Loja"] };
  }
}

function TemplatePhone({ template, featured, onPreview }: { template: typeof templates[number]; featured?: boolean; onPreview?: (template: typeof templates[number]) => void }) {
  const Icon = template.icon;
  const interactive = !featured && Boolean(onPreview);
  const demo = getTemplateDemo(template);
  return <article role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} onClick={interactive ? () => onPreview?.(template) : undefined} onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPreview?.(template); } } : undefined} aria-label={interactive ? `Ver prévia de ${template.name}` : undefined} className={`landing-template-phone ${featured ? "landing-template-phone-featured w-full" : "w-[10rem]"} flex-none snap-center overflow-hidden rounded-2xl border bg-[#0d0a12] shadow-xl transition duration-200 hover:-translate-y-1 ${interactive ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400" : ""} ${featured ? "border-violet-400/75" : "border-white/10"}`}>
    <div className={`landing-template-demo ${featured ? "landing-template-demo-featured" : ""}`}>
      <div className="landing-template-cover" style={{ backgroundImage: `linear-gradient(180deg, rgba(8,5,12,.08), rgba(8,5,12,.82)), url(${template.cover})` }}>
        <span>{demo.eyebrow}</span><small>{template.niche}</small>
      </div>
      <div className="landing-template-content">
        <span className="landing-template-avatar" style={{ background: template.color }}><Icon /></span>
        <b>{template.name}</b><p>{demo.subtitle}</p>
        <span className="landing-template-action" style={{ background: template.color }}><MessageCircle />{demo.action}<ArrowRight /></span>
        <div className="landing-template-items">{demo.items.map((item, index) => <span key={item}><i style={{ background: index === 1 ? template.color : undefined }} />{item}</span>)}</div>
        <small className="landing-template-footer">Instagram · Localização · Contato</small>
      </div>
    </div>
    {interactive && <span className="landing-template-preview-hint">Clique para ver a prévia</span>}
  </article>;
}

function Difference() {
  const old = ["WhatsApp", "Instagram", "Cardápio", "Localização"];
  const gains = ["Design profissional", "Mais informações", "WhatsApp integrado", "Produtos e serviços", "Redes sociais", "Localização", "Mais clientes", "Mais vendas"];
  return <section id="exemplos" className="relative z-10 mx-auto max-w-7xl px-5 pb-14"><div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-[#0d0a12] p-6 lg:grid-cols-[.8fr_1fr_.8fr]"><div className="text-center"><p className="eyebrow">Veja a diferença</p><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#bdb3c8]"><Store className="h-6 w-6" /></div><b className="mt-3 block text-sm">Seu negócio</b><p className="text-[10px] text-[#a99fb5]">Bio comum</p><div className="mt-4 space-y-2">{old.map((item) => <div key={item} className="rounded-lg bg-white/[.06] px-3 py-2 text-xs text-[#bdb3c8]">{item}</div>)}</div></div></div><div className="relative"><div className="absolute left-1/2 top-1/2 z-10 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 font-display font-bold shadow-[0_0_35px_rgba(168,85,247,.65)]">VS</div><div className="mx-auto max-w-[17rem] overflow-hidden rounded-[1.7rem] border-4 border-[#2c2633] bg-[#09070f]"><img src="/template-assets/restaurant-demo-cover.png" alt="Exemplo EIA Link Casa do Sabor" className="h-28 w-full object-cover" /><div className="p-4 text-center"><b className="font-display text-xl">Casa do Sabor</b><p className="text-[9px] text-fuchsia-300">Hamburgueria artesanal</p><button className="mt-3 w-full rounded-lg bg-green-500 py-2 text-xs font-bold text-black">Pedir pelo WhatsApp</button><button className="mt-2 w-full rounded-lg border border-fuchsia-400 py-2 text-[10px] text-fuchsia-200">Ver cardápio</button><div className="mt-3 grid grid-cols-3 gap-1">{["Burger", "Pizza", "Brownie"].map((item) => <span key={item} className="rounded bg-white/10 p-1 text-[8px]">{item}</span>)}</div></div></div></div><ul className="grid gap-3 text-sm">{gains.map((gain) => <li key={gain} className="flex items-center gap-2 text-[#d5cbe1]"><Check className="h-4 w-4 text-violet-400" />{gain}</li>)}</ul></div></section>;
}

function Templates({ onPreview }: { onPreview: (template: typeof templates[number]) => void }) {
  return <section id="templates" className="relative z-10 mx-auto max-w-7xl px-5 pb-14"><div className="rounded-3xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(27,14,45,.86),rgba(11,8,16,.95))] p-6 md:p-8"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="eyebrow">Templates por nicho</p><h2 className="mt-2 font-display text-3xl font-bold">Templates feitos para cada tipo de negócio</h2></div><p className="max-w-md text-sm text-[#c4bacf]">Clique em um modelo para abrir sua prévia e personalize somente o que faz sentido para sua marca.</p></div><div className="mt-7"><TemplateRail onPreview={onPreview} /></div></div></section>;
}

function Benefits() {
  return <section id="beneficios" className="relative z-10 mx-auto max-w-7xl px-5 pb-14"><div className="grid gap-4 md:grid-cols-4">{benefits.map(([Icon, title, description]) => <article key={title} className="rounded-2xl border border-white/10 bg-[#0e0b13] p-5 transition hover:-translate-y-1 hover:border-violet-400/45"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/12"><Icon className="h-6 w-6 text-violet-400" /></span><h3 className="mt-4 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-5 text-[#bdb3c7]">{description}</p></article>)}</div></section>;
}

function HowItWorks() {
  const steps = [[Store, "1. Escolha um nicho", "Selecione o template ideal para o seu negócio."], [Palette, "2. Personalize", "Edite textos, cores, imagens e produtos."], [Rocket, "3. Publique", "Seu BioLink fica pronto em menos de 1 minuto."], [TrendingUp, "4. Receba clientes", "Compartilhe seu link e comece a vender mais."]];
  return <section id="como-funciona" className="relative z-10 mx-auto max-w-7xl px-5 pb-14"><div className="rounded-3xl border border-white/10 bg-[#0d0a12] p-6"><div className="text-center"><p className="eyebrow">Como funciona</p><h2 className="mt-2 font-display text-3xl font-bold">Crie seu BioLink em 4 passos simples</h2></div><div className="mt-8 grid gap-6 md:grid-cols-4">{steps.map(([Icon,title,description], index) => { const StepIcon = Icon as typeof Store; return <div key={title as string} className="relative text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/40 bg-violet-500/10"><StepIcon className="h-8 w-8 text-violet-400" /></span>{index < 3 && <ChevronRight className="absolute right-[-1.35rem] top-6 hidden h-7 w-7 text-violet-400/60 md:block" />}<h3 className="mt-4 font-semibold">{title as string}</h3><p className="mx-auto mt-2 max-w-[12rem] text-xs leading-5 text-[#bdb3c7]">{description as string}</p></div>; })}</div></div></section>;
}

function Testimonials() {
  return <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14"><div className="rounded-3xl border border-white/10 bg-[#0d0a12] p-6"><div className="text-center"><p className="eyebrow">Depoimentos</p><h2 className="mt-2 font-display text-3xl font-bold">O que nossos clientes dizem</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{testimonials.map(([name, business, quote, color]) => <article key={name} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold" style={{ background: color }}>{name.slice(0, 1)}</span><div><b className="text-sm">{name}</b><p className="text-[10px] text-[#b9afc4]">{business}</p></div></div><p className="mt-4 text-sm leading-6 text-[#d2c8dc]">“{quote}”</p><div className="mt-4 text-amber-400">★★★★★</div></article>)}</div></div></section>;
}

function FinalCta() {
  return <section className="relative z-10 mx-auto max-w-7xl px-5 pb-10"><div className="relative overflow-hidden rounded-3xl border border-violet-300/30 bg-[linear-gradient(115deg,#47149b,#8124be_55%,#271051)] px-6 py-10 md:px-12"><div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-300/25 blur-3xl" /><div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between"><div><h2 className="max-w-xl font-display text-4xl font-bold leading-tight">Seu próximo cliente pode estar a um clique de distância.</h2><p className="mt-3 text-sm text-violet-100">Crie agora seu BioLink Premium gratuitamente.</p></div><div className="grid gap-3"><Link to="/auth" search={{ mode: "signup" } as never} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-violet-900">Criar meu BioLink grátis <ArrowRight className="h-4 w-4" /></Link><a href="https://wa.me/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-green-300" />Falar no WhatsApp</a></div></div></div></section>;
}

function Footer() {
  return <footer className="relative z-10 border-t border-white/10 bg-[#09070d] py-9"><div className="mx-auto grid max-w-7xl gap-7 px-5 md:grid-cols-[1.2fr_.7fr_.7fr_.7fr]"><div><Brand /><p className="mt-3 max-w-xs text-xs leading-5 text-[#bcb2c8]">Mais que um link na bio. Uma experiência que vende.</p><div className="mt-4 flex gap-3"><Instagram className="h-4 w-4 text-fuchsia-400" /><MessageCircle className="h-4 w-4 text-green-400" /><Link2 className="h-4 w-4 text-violet-400" /></div></div>{[["Produto", "Templates", "Exemplos", "Preços", "Recursos"], ["Empresa", "Sobre nós", "Blog", "Contato", "Parceiros"], ["Suporte", "Central de ajuda", "Tutoriais", "Termos de uso", "Privacidade"]].map(([title,...links]) => <div key={title}><b className="text-sm">{title}</b><div className="mt-3 grid gap-2">{links.map((item) => <a key={item} href="#" className="text-xs text-[#bcb2c8] hover:text-white">{item}</a>)}</div></div>)}</div><div className="mx-auto mt-8 flex max-w-7xl justify-between border-t border-white/10 px-5 pt-5 text-[10px] text-[#8f859d]"><span>© 2026 EIA Link. Todos os direitos reservados.</span><span>Feito com ♥ no Brasil</span></div></footer>;
}
