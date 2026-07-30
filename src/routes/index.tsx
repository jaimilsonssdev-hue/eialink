import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BarChart3, Building2, Check, CircleDollarSign, Dumbbell,
  Heart, Instagram, Link2, MapPin, MessageCircle, Palette, PawPrint,
  QrCode, Scissors, ShieldCheck, ShoppingBag, Sparkles, Stethoscope,
  Store, TrendingUp, UtensilsCrossed, WandSparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EIA Link — Biolinks premium para negócios" },
      { name: "description", content: "Crie uma presença digital profissional para vender mais pelo WhatsApp." },
    ],
  }),
  component: Landing,
});

const templates = [
  { name: "Restaurantes", icon: UtensilsCrossed, cover: "/template-assets/restaurant-demo-cover.png", color: "#8b3ff2" },
  { name: "Clínicas", icon: Stethoscope, cover: "/template-assets/clinic-demo-cover.png", color: "#27b0b8" },
  { name: "Salões", icon: Scissors, cover: "/template-assets/beauty-demo-cover.png", color: "#e44f9e" },
  { name: "Academias", icon: Dumbbell, cover: "/template-assets/business-demo-cover.png", color: "#4dc46b" },
  { name: "Advogados", icon: ShieldCheck, cover: "/template-assets/business-demo-cover.png", color: "#c9983e" },
  { name: "Imobiliárias", icon: Building2, cover: "/template-assets/store-demo-cover.png", color: "#2b9bd2" },
  { name: "Pet Shop", icon: PawPrint, cover: "/template-assets/creator-demo-cover.png", color: "#4cbf72" },
] as const;

const benefits = [
  [MessageCircle, "Mais contatos e pedidos via WhatsApp"],
  [WandSparkles, "Mais credibilidade para o negócio"],
  [TrendingUp, "Mais conversões e vendas"],
  [BarChart3, "Crescimento com escala"],
] as const;

const features = [
  [WandSparkles, "Editor visual intuitivo", "Edite textos, cores, imagens e links com prévia em tempo real."],
  [MessageCircle, "Integração com WhatsApp", "Botão nativo para conversar e receber pedidos."],
  [ShoppingBag, "Produtos em destaque", "Mostre produtos e serviços sem necessidade de e-commerce."],
  [Instagram, "Redes sociais integradas", "Conecte Instagram, TikTok, Facebook e outros canais."],
  [MapPin, "Localização e contato", "Facilite abrir mapa, ligar ou mandar uma mensagem."],
  [BarChart3, "Estatísticas", "Acompanhe visitas, cliques e conversões em tempo real."],
] as const;

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07060b] text-[#f8f5ff]">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_55%_12%,rgba(124,58,237,.13),transparent_22rem),radial-gradient(circle_at_80%_54%,rgba(168,85,247,.06),transparent_26rem)]" />
      <Nav />
      <section className="relative z-10 mx-auto grid max-w-[96rem] gap-9 px-5 pb-12 pt-8 lg:grid-cols-[.82fr_1.05fr_1.45fr] lg:px-8 lg:pt-14">
        <BrandPitch />
        <BusinessIdea />
        <TemplateGallery />
      </section>
      <section className="relative z-10 mx-auto max-w-[96rem] px-5 pb-4 lg:px-8"><DesignSystem /></section>
      <section className="relative z-10 mx-auto grid max-w-[96rem] gap-4 px-5 pb-4 lg:grid-cols-[1.08fr_.9fr_1.1fr] lg:px-8"><RestaurantGuide /><FeatureGuide /><ProductGuide /></section>
      <Guidelines />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="relative z-20 border-b border-white/5 bg-[#08070c]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold"><Link2 className="h-6 w-6 text-violet-400" /> EIA <span className="text-fuchsia-400">LINK</span></Link>
        <div className="flex gap-2"><Link to="/auth" className="btn-secondary hidden sm:inline-flex">Entrar</Link><Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary">Começar grátis <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </header>
  );
}

function BrandPitch() {
  return (
    <aside className="border-b border-white/10 pb-7 lg:border-b-0 lg:border-r lg:pr-8">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500"><Link2 className="h-7 w-7" /></span><div><b className="font-display text-3xl tracking-tight">EIA <span className="text-fuchsia-400">LINK</span></b><p className="text-xs font-semibold tracking-[.28em] text-violet-300">BIOLINKS PREMIUM</p></div></div>
      <h1 className="mt-8 font-display text-3xl font-bold leading-tight">Biolinks que <span className="text-fuchsia-400">vendem</span><br />por você.</h1>
      <p className="mt-4 max-w-xs text-sm leading-6 text-[#c8c0d4]">Páginas lindas, profissionais e estratégicas para transformar visitas em clientes e abrir portas para o próximo nível do seu negócio.</p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[[WandSparkles, "Rápido de criar", "Publique em minutos"], [Palette, "Design Premium", "Modelos por nicho"], [TrendingUp, "Focado em resultados", "Mais contatos e vendas"]].map(([Icon, title, text]) => {
          const ItemIcon = Icon as typeof WandSparkles;
          return <div key={title as string} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><ItemIcon className="h-5 w-5 text-violet-400" /><b className="mt-3 block text-[10px]">{title as string}</b><span className="mt-1 block text-[9px] leading-3 text-[#a99fb6]">{text as string}</span></div>;
        })}
      </div>
    </aside>
  );
}

function BusinessIdea() {
  const points = ["Plataforma intuitiva e rápida para criação de biolinks", "Modelos exclusivos por nicho, prontos para vender", "Integração nativa com WhatsApp, Instagram e localização", "Catálogo de produtos e serviços simples e eficiente", "Estatísticas para acompanhar resultados", "Porta de entrada para outros serviços premium"];
  return (
    <section className="border-b border-white/10 pb-7 lg:border-b-0 lg:border-r lg:pr-8">
      <p className="eyebrow">Ideia de negócio</p>
      <p className="mt-3 text-sm leading-6 text-[#d5cfdf]">A EIA Link é uma plataforma de biolinks premium criada para negócios e profissionais que desejam se apresentar de forma moderna, confiável e estratégica.</p>
      <p className="mt-3 text-sm leading-6 text-[#c8c0d4]">Mais do que um simples link na bio, criamos experiências completas em uma página única que despertam o interesse, geram confiança e levam o cliente a agir.</p>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-violet-400">O que esperamos construir</h2>
      <ul className="mt-3 space-y-2">{points.map((point) => <li key={point} className="flex gap-2 text-xs leading-4 text-[#d5cfdf]"><Check className="h-4 w-4 flex-none text-violet-400" />{point}</li>)}</ul>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-violet-400">Resultado esperado</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">{benefits.map(([Icon, text]) => <div key={text} className="text-center"><Icon className="mx-auto h-5 w-5 text-violet-400" /><p className="mt-2 text-[10px] leading-3 text-[#d5cfdf]">{text}</p></div>)}</div>
    </section>
  );
}

function TemplateGallery() {
  return (
    <section><p className="eyebrow">Templates por nicho (exemplos)</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">{templates.map(({ name, icon: Icon, cover, color }) => <article key={name} className="group overflow-hidden rounded-xl border border-white/10 bg-[#100d16] shadow-xl transition hover:-translate-y-1 hover:border-white/30"><div className="flex items-center gap-1 p-2"><Icon className="h-3.5 w-3.5" style={{ color }} /><span className="text-[9px] font-semibold">{name}</span></div><img src={cover} alt={`Template para ${name}`} loading="lazy" className="h-32 w-full object-cover" /><div className="p-2"><p className="text-[9px] text-[#b7adc5]">Página pronta para vender</p><span className="mt-2 block rounded-md py-1 text-center text-[9px] font-bold text-white" style={{ background: color }}>Usar modelo</span></div></article>)}</div><p className="mt-5 text-center text-xs text-[#c8c0d4]">Todos os templates seguem a mesma identidade visual da EIA Link, com personalidades únicas para uma ação principal.</p></section>
  );
}

function DesignSystem() {
  const swatches = ["#7c3aed", "#a855f7", "#d946ef", "#25d366", "#09070f", "#1a1625", "#241e33", "#f8f5ff"];
  return <section className="rounded-2xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(23,13,38,.92),rgba(8,7,13,.94))] p-5 lg:p-7"><h2 className="text-sm font-bold uppercase tracking-wide text-violet-400">Design system EIA Link</h2><div className="mt-5 grid gap-7 md:grid-cols-4"><div><b className="text-xs text-violet-300">Cores</b><div className="mt-3 grid grid-cols-4 gap-2">{swatches.map((color) => <span key={color} className="aspect-square rounded-lg border border-white/10" style={{ background: color }} title={color} />)}</div><p className="mt-3 text-[10px] text-[#aaa0b7]">Roxo, magenta e verde WhatsApp com neutros profundos.</p></div><div><b className="text-xs text-violet-300">Tipografia</b><p className="mt-3 font-display text-4xl font-bold">Aa</p><p className="text-sm font-semibold">Poppins — títulos</p><p className="mt-3 text-3xl">Aa</p><p className="text-sm text-[#d2cbdc]">Inter — textos</p></div><div><b className="text-xs text-violet-300">Botões</b><button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-bold"><MessageCircle className="h-4 w-4" /> Pedir pelo WhatsApp <ArrowRight className="h-4 w-4" /></button><button className="mt-3 w-full rounded-lg border border-violet-400 px-4 py-3 text-sm font-semibold text-violet-300">Ver Cardápio Completo</button><div className="mt-3 flex gap-2">{[Instagram, MessageCircle, MapPin, Link2].map((Icon) => <span key={Icon.displayName} className="grid h-9 w-9 place-items-center rounded-lg border border-violet-400/50"><Icon className="h-4 w-4 text-fuchsia-400" /></span>)}</div></div><ProductCard /></div></section>;
}

function ProductCard() { return <div><b className="text-xs text-violet-300">Cards</b><article className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#120f18]"><img src="/template-assets/restaurant-demo-cover.png" alt="Hambúrguer artesanal" className="h-28 w-full object-cover" /><div className="p-3"><h3 className="font-semibold">Smash Bacon</h3><p className="mt-1 text-[10px] leading-4 text-[#bdb3ca]">Pão brioche, blend 160g, cheddar e molho especial.</p><b className="mt-2 block text-sm">R$ 34,90</b><button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 py-2 text-xs font-bold"><MessageCircle className="h-3.5 w-3.5" /> Pedir</button></div></article></div>; }

function RestaurantPhone() { return <div className="mx-auto w-full max-w-[19rem] overflow-hidden rounded-[2rem] border-[5px] border-[#322b39] bg-[#09070f] shadow-2xl"><div className="relative"><img src="/template-assets/restaurant-burger-evening-cover.png" alt="Exemplo de Biolink para restaurante" className="h-40 w-full object-cover" /><div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09070f]" /><span className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[9px]"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />Aberto agora</span></div><div className="relative -mt-8 px-4 pb-5 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-violet-400 bg-black text-xs font-bold">CS</div><h3 className="mt-2 font-display text-2xl font-bold">Casa do Sabor</h3><p className="text-xs text-fuchsia-300">Hamburgueria Artesanal</p><p className="mt-2 text-[10px] text-[#bfb4c9]">Sabor que conquista, momentos que ficam.</p><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-sm font-bold"><MessageCircle className="h-4 w-4" /> Pedir pelo WhatsApp</button><button className="mt-2 w-full rounded-xl border border-violet-400/70 py-2.5 text-xs text-violet-200">Ver Cardápio Completo</button><div className="mt-4 grid grid-cols-3 gap-2 text-left">{["Smash", "Pizza", "Brownie"].map((item) => <span key={item} className="rounded-lg border border-white/10 bg-white/5 p-2 text-[9px]">{item}</span>)}</div><div className="mt-4 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 p-3 text-left"><b className="text-xs">Está com fome? 🍟</b><p className="mt-1 text-[9px] text-white/80">Peça agora e receba o conforto da sua casa.</p></div></div></div>; }

function RestaurantGuide() { const steps = [["1", "Hero", "Primeira impressão forte com imagem, identidade e CTA principal."], ["2", "Informações rápidas", "Dados essenciais em ícones e textos curtos."], ["3", "Produtos em destaque", "Apenas três itens para gerar desejo."], ["4", "Links importantes", "Redes sociais, localização e telefone."], ["5", "CTA final", "Reforço da ação principal."], ["6", "Footer", "Informações básicas e segurança."]]; return <section className="rounded-2xl border border-violet-300/20 bg-[#100d16] p-5"><h2 className="text-sm font-bold uppercase text-violet-400">Template restaurante — estrutura da página pública</h2><div className="mt-4 grid grid-cols-[.72fr_1.28fr] items-start gap-3"><ol className="space-y-3">{steps.map(([n,t,d]) => <li key={n} className="flex gap-2"><span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-violet-600 text-[10px] font-bold">{n}</span><div><b className="text-[10px] uppercase text-violet-200">{t}</b><p className="mt-1 text-[9px] leading-3 text-[#b9afc4]">{d}</p></div></li>)}</ol><RestaurantPhone /></div></section>; }

function FeatureGuide() { return <section className="rounded-2xl border border-violet-300/20 bg-[#100d16] p-5"><h2 className="text-sm font-bold uppercase text-violet-400">Funcionalidades principais</h2><div className="mt-4 space-y-4">{features.map(([Icon,title,text]) => <div key={title} className="flex gap-3"><Icon className="h-5 w-5 flex-none text-fuchsia-400" /><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] leading-4 text-[#bdb3ca]">{text}</p></div></div>)}</div><div className="mt-7 rounded-xl border border-violet-400/25 bg-violet-500/10 p-4"><p className="text-xs font-bold uppercase text-violet-300">Foco principal</p><p className="mt-2 text-sm text-[#d8d0e3]">Levar o visitante a realizar uma ação principal: <b className="text-fuchsia-300">pedir no WhatsApp.</b></p></div></section>; }

function ProductGuide() { const rows = ["Smash Bacon", "Pizza Calabresa", "Brownie com Sorvete", "Batata Rústica"]; return <section className="rounded-2xl border border-violet-300/20 bg-[#100d16] p-5"><h2 className="text-sm font-bold uppercase text-violet-400">Telas do sistema</h2><div className="mt-4 rounded-xl border border-white/10 bg-[#0c0a11] p-3"><div className="flex items-center justify-between"><b className="text-sm">Dashboard</b><span className="text-[10px] text-violet-300">Visão geral</span></div><div className="mt-3 grid grid-cols-4 gap-2">{["8.763", "1.256", "342", "24,6%"].map((metric) => <div key={metric} className="rounded-lg bg-white/5 p-2"><span className="text-[8px] text-[#aaa0b7]">Métrica</span><b className="mt-1 block text-sm">{metric}</b></div>)}</div><div className="mt-3 h-20 rounded-lg bg-[linear-gradient(180deg,rgba(124,58,237,.22),transparent),repeating-linear-gradient(0deg,transparent,transparent_18px,rgba(255,255,255,.05)_19px)]" /></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 p-3"><b className="text-xs">Meus Biolinks</b>{["Casa do Sabor", "Clínica Harmonia", "Studio Beauty"].map((item) => <p key={item} className="mt-2 rounded bg-white/5 p-2 text-[9px]">{item}</p>)}</div><div className="rounded-xl border border-white/10 p-3"><b className="text-xs">Editor da Bio</b><div className="mt-3 flex gap-1">{["#7c3aed", "#d946ef", "#25d366"].map((color) => <i key={color} className="h-5 flex-1 rounded" style={{ background: color }} />)}</div><img src="/template-assets/restaurant-demo-cover.png" alt="" className="mt-3 h-20 w-full rounded object-cover" /></div></div><div className="mt-3 rounded-xl border border-white/10 p-3"><div className="flex items-center justify-between"><b className="text-xs">Catálogo de Produtos</b><span className="rounded bg-violet-600 px-2 py-1 text-[9px]">+ Adicionar</span></div>{rows.map((row, index) => <div key={row} className="mt-2 flex items-center justify-between rounded bg-white/5 p-2 text-[9px]"><span>{row}</span><span>R$ {index === 0 ? "34,90" : "18,90"}</span><i className="h-3 w-6 rounded-full bg-green-500" /></div>)}</div></section>; }

function Guidelines() { const columns = [["Instruções técnicas", ["Mobile-first sempre", "Componentes reutilizáveis", "Performance otimizada", "Acessibilidade", "Código limpo e organizado"]], ["Boas práticas", ["Componentes pequenos e focados", "Nomes claros", "Evitar re-renderizações", "Lazy loading de imagens", "Estados de loading e erro"]], ["Regras importantes", ["A página pública não é um site completo", "Máximo de blocos principais", "Sempre ter uma ação principal", "Não exibir campos vazios"]], ["Metas de qualidade", ["Design premium e moderno", "Experiência rápida", "Fácil de usar e editar", "Alta conversão"]]]; return <section className="relative z-10 mx-auto max-w-[96rem] px-5 pb-4 lg:px-8"><div className="grid gap-5 rounded-2xl border border-violet-300/20 bg-[#0d0b12] p-5 md:grid-cols-4">{columns.map(([title,items]) => <div key={title as string}><h2 className="text-sm font-bold uppercase text-violet-400">{title as string}</h2><ul className="mt-4 space-y-2">{(items as string[]).map((item) => <li key={item} className="flex gap-2 text-[11px] text-[#c7bdd2]"><Check className="h-3.5 w-3.5 flex-none text-green-400" />{item}</li>)}</ul></div>)}</div></section>; }

function Footer() { return <footer className="relative z-10 border-t border-white/10 bg-[#08070c] py-6"><div className="mx-auto flex max-w-[96rem] flex-col items-center justify-between gap-4 px-5 text-sm md:flex-row lg:px-8"><div className="flex items-center gap-2 font-display text-lg font-bold"><Link2 className="h-6 w-6 text-violet-400" /> EIA LINK</div><p className="text-[#c2b8cd]">Mais que um link na bio. Uma experiência que <span className="text-fuchsia-400">vende.</span></p><div className="flex items-center gap-3"><Instagram className="h-5 w-5 text-fuchsia-400" /><MessageCircle className="h-5 w-5 text-green-400" /><Link to="/auth" search={{ mode: "signup" } as never} className="btn-primary">Começar grátis</Link></div></div></footer>; }
