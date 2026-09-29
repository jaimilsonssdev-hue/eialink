import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Flame,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { LayoutRenderContext, TemplateLayoutRenderer } from "./LayoutResolver";
import type { TemplateRenderModel } from "../types";
import { Footer } from "@/components/public-profile/Footer";
import { PixCard } from "@/components/public-profile/PixCard";
import { whatsappUrl } from "@/lib/whatsapp";
import { CatalogSection } from "@/modules/products/components/CatalogSection";
import { detectNicheKey, NICHE_GALLERIES } from "@/modules/prospecting/nichePresets";

export interface StoryChapter {
  id: string;
  actBadge: string;
  kicker: string;
  title: string;
  serifAccent?: string;
  subtitle: string;
  statBadge?: string;
  imageUrl: string;
  quote?: string;
}

/**
 * Roteiros de Scrollytelling de Alta Conversão por Nicho (Inspirados no padrão Café Estilo / Apple)
 */
function getNicheStoryChapters(nicheKey: string, companyName: string, city: string, covers: string[]): StoryChapter[] {
  const isGastronomy = [
    "restaurante",
    "delivery",
    "hamburgueria",
    "pizzaria",
    "cafeteria",
    "sorveteria",
    "confeitaria",
    "bebidas",
    "japones",
  ].includes(nicheKey);

  const isBeauty = [
    "beleza",
    "salao",
    "estetica",
    "barbearia",
    "unhas",
    "costura",
  ].includes(nicheKey);

  const isHealth = [
    "clinica",
    "odontologia",
    "medica",
    "psicologia",
    "nutricao",
    "terapia",
    "veterinaria",
    "petshop",
  ].includes(nicheKey);

  const isFashion = ["loja", "varejo", "moda"].includes(nicheKey);

  if (isGastronomy) {
    return [
      {
        id: "abertura",
        actBadge: "O RITUAL DE SABOR",
        kicker: "Extraído com Maestria",
        title: "A Arte do Primeiro Encontro com a",
        serifAccent: companyName,
        subtitle:
          "O tempo para. O aroma preenche o ar antes mesmo do primeiro toque. Criamos uma atmosfera onde cada receita é executada como uma obra de arte gastronômica.",
        statBadge: "EXPERIÊNCIA EXCLUSIVA · FEITO SOB ENCOMENDA",
        imageUrl: covers[0],
      },
      {
        id: "origem",
        actBadge: "01 — A ORIGEM",
        kicker: "Matéria-Prima Selecionada",
        title: "A Pureza em Seu",
        serifAccent: "Estado Nobre",
        subtitle:
          "Insumos frescos selecionados rigorosamente no auge do sabor. Respeitamos a origem de cada ingrediente para entregar textura inigualável e pureza extrema a cada garfada.",
        statBadge: "PRODUTORES SELECIONADOS · 100% ARTESANAL",
        imageUrl: covers[1],
        quote: "O verdadeiro luxo não é inventar o novo, mas exaltar a perfeição do ingrediente.",
      },
      {
        id: "processo",
        actBadge: "02 — A FUSÃO · TÉCNICA PRECISA",
        kicker: "Alquimia & Temperatura",
        title: "O Ponto Exato da",
        serifAccent: "Transformação",
        subtitle:
          "O controle milimétrico de temperatura, o repouso das massas e o equilíbrio de notas aromáticas. Nossa cozinha combina herança artesanal com precisão contemporânea.",
        statBadge: "EQUILÍBRIO DE NOTAS · PREPARO MINUCIOSO",
        imageUrl: covers[2],
      },
      {
        id: "experiencia",
        actBadge: "03 — O MOMENTO",
        kicker: "Consagração à Mesa",
        title: "Seu Instante de",
        serifAccent: "Puro Deleite",
        subtitle:
          `Servido na temperatura ideal em ${city}, com apresentação impecável. Permita-se fazer uma pausa e desfrutar do que a vida tem de mais prazeroso.`,
        statBadge: "SABOR INCONFUNDÍVEL · ATENDIMENTO VIP",
        imageUrl: covers[3],
        quote: "Cada detalhe foi desenhado para que a sua única preocupação seja desfrutar.",
      },
    ];
  }

  if (isBeauty) {
    return [
      {
        id: "abertura",
        actBadge: "A PRESENÇA",
        kicker: "Estilo & Autoestima",
        title: "A Assinatura Visual de",
        serifAccent: companyName,
        subtitle:
          "Sua imagem comunica antes de qualquer palavra. Desenvolvemos uma experiência privativa onde a técnica de ponta revela a sua versão mais confiante e magnética.",
        statBadge: "VISAGISMO EXCLUSIVO · AMBIENTE VIP",
        imageUrl: covers[0],
      },
      {
        id: "origem",
        actBadge: "01 — O DIAGNÓSTICO",
        kicker: "Harmonia dos Traços",
        title: "A Geometria que Revela sua",
        serifAccent: "Identidade",
        subtitle:
          "Antes de iniciar qualquer procedimento, realizamos uma análise individualizada das suas proporções para que o corte, a barba ou o tratamento se integrem ao seu estilo de vida.",
        statBadge: "CONSULTORIA INDIVIDUAL · ATENÇÃO TOTAL",
        imageUrl: covers[1],
        quote: "A beleza autêntica não segue moldes: ela valoriza a singularidade que já existe em você.",
      },
      {
        id: "processo",
        actBadge: "02 — O RITUAL",
        kicker: "Toalha Quente & Precisão",
        title: "O Cuidado nos",
        serifAccent: "Mínimos Detalhes",
        subtitle:
          "Cosméticos importados de alta performance, lâminas esterilizadas e massagem relaxante. Um intervalo de descompressão que renova a mente e a energia.",
        statBadge: "PRODUTOS DE ELITE · ACABAMENTO ARTESANAL",
        imageUrl: covers[2],
      },
      {
        id: "experiencia",
        actBadge: "03 — O RESULTADO",
        kicker: "Impecável Para Vencer",
        title: "Pronto Para Marcar",
        serifAccent: "Presença",
        subtitle:
          `Finalização de alto padrão com fixação natural e brilho equilibrado em ${city}. Saia renovado e pronto para liderar suas maiores conquistas.`,
        statBadge: "PADRÃO INTERNACIONAL · FIDELIDADE ABSOLUTA",
        imageUrl: covers[3],
        quote: "O homem e a mulher que investem em sua imagem conquistam o respeito antes de falar.",
      },
    ];
  }

  if (isHealth) {
    return [
      {
        id: "abertura",
        actBadge: "O CUIDADO HUMANIZADO",
        kicker: "Saúde & Excelência",
        title: "A Medicina com Alma da",
        serifAccent: companyName,
        subtitle:
          "Um novo horizonte para o atendimento à sua saúde: tecnologia diagnóstica avançada associada à escuta ativa, sem pressa e com respeito irrestrito ao paciente.",
        statBadge: "INFRAESTRUTURA COMPLETA · ESCUTA DEDICADA",
        imageUrl: covers[0],
      },
      {
        id: "origem",
        actBadge: "01 — O ACOLHIMENTO",
        kicker: "Ambiente de Conforto",
        title: "A Serenidade de Estar em",
        serifAccent: "Boas Mãos",
        subtitle:
          `Salas climatizadas, silenciosas e projetadas para o seu relaxamento no coração de ${city}. Aqui, pontualidade e tranquilidade são valores inegociáveis.`,
        statBadge: "PONTUALIDADE RIGOROSA · PRIVACIDADE TOTAL",
        imageUrl: covers[1],
        quote: "Curar quando possível, aliviar com frequência, confortar sempre.",
      },
      {
        id: "processo",
        actBadge: "02 — A PRECISÃO",
        kicker: "Protocolos Baseados em Evidências",
        title: "A Exatidão que Garante sua",
        serifAccent: "Segurança",
        subtitle:
          "Equipamentos calibrados e condutas alinhadas às diretrizes mundiais mais atualizadas. Tratamentos minimamente invasivos com recuperação rápida.",
        statBadge: "DIAGNÓSTICO ASSERTIVO · TECNOLOGIA DE PONTA",
        imageUrl: covers[2],
      },
      {
        id: "experiencia",
        actBadge: "03 — A VIDA PLENA",
        kicker: "Vitalidade Restaurada",
        title: "Seu Bem-Estar no",
        serifAccent: "Pico Máximo",
        subtitle:
          "Acompanhamento contínuo para que você viva com vigor, autonomia e paz de espírito ao lado de quem você ama.",
        statBadge: "RESULTADOS COMPROVADOS · CONFIANÇA GARANTIDA",
        imageUrl: covers[3],
        quote: "Investir na sua saúde hoje é garantir a liberdade dos seus próximos 30 anos.",
      },
    ];
  }

  if (isFashion) {
    return [
      {
        id: "abertura",
        actBadge: "A ESSÊNCIA DO ESTILO",
        kicker: "Design Contemporâneo",
        title: "Vestir é Declarar a Força da",
        serifAccent: companyName,
        subtitle:
          "Curadoria exclusiva de peças que unem elegância clássica e versatilidade urbana. Roupas pensadas para vestir com atitude em qualquer ocasião.",
        statBadge: "COLEÇÃO EXCLUSIVA · QUANTIDADES LIMITADAS",
        imageUrl: covers[0],
      },
      {
        id: "origem",
        actBadge: "01 — AS FIBRAS NOBRES",
        kicker: "Toque & Sensação",
        title: "A Nobreza dos",
        serifAccent: "Melhores Tecidos",
        subtitle:
          "Algodões de fibra longa, linhos encorpados e texturas que respiram. Durabilidade real e caimento fluido que resistem ao teste do tempo.",
        statBadge: "MATÉRIA-PRIMA DE ELITE · RESPIRABILIDADE",
        imageUrl: covers[1],
        quote: "O luxo autêntico é aquele que você sente na pele e reconhece no caimento.",
      },
      {
        id: "processo",
        actBadge: "02 — A MODELAGEM",
        kicker: "Alfaiataria Moderna",
        title: "O Encaixe Natural e",
        serifAccent: "Harmônico",
        subtitle:
          "Costuras estruturadas e acabamentos internos impecáveis. Peças desenhadas para abraçar sua rotina sem limitar seus movimentos.",
        statBadge: "CORTE PRECISO · ACABAMENTO MINUCIOSO",
        imageUrl: covers[2],
      },
      {
        id: "experiencia",
        actBadge: "03 — O VISUAL",
        kicker: "Pronto Para Conquistar",
        title: "Eleve Seu Estilo",
        serifAccent: "Agora",
        subtitle:
          `Peça sua seleção com atendimento rápido e envio dedicado para ${city}. Vista a autenticidade que reflete seu posicionamento.`,
        statBadge: "ENTREGA ÁGIL · EXPERIÊNCIA IMPECÁVEL",
        imageUrl: covers[3],
        quote: "Esteja bem vestido em qualquer lugar e o mundo abrirá as portas para você.",
      },
    ];
  }

  // Padrão Geral / Serviços Corporativos
  return [
    {
      id: "abertura",
      actBadge: "O PADRÃO DE EXCELÊNCIA",
      kicker: "Soluções de Alto Desempenho",
      title: "A Força e Credibilidade da",
      serifAccent: companyName,
      subtitle:
        `Compromisso inegociável com rigor técnico, prazos pontuais e entrega de resultados que superam qualquer expectativa em ${city}.`,
      statBadge: "PADRÃO PREMIUM · EXPERIÊNCIA COMPROVADA",
      imageUrl: covers[0],
    },
    {
      id: "origem",
      actBadge: "01 — OS FUNDAMENTOS",
      kicker: "Base Sólida & Visão Clara",
      title: "O Ponto de Partida da sua",
      serifAccent: "Tranquilidade",
      subtitle:
        "Estruturamos cada etapa do serviço com diagnóstico minucioso. Sem atalhos, sem improvisos: apenas método comprovado e integridade absoluta.",
      statBadge: "DIAGNÓSTICO PRECISO · TRANSPARÊNCIA TOTAL",
      imageUrl: covers[1],
      quote: "Grandes conquistas nascem de fundamentos inegociáveis.",
    },
    {
      id: "processo",
      actBadge: "02 — A EXECUÇÃO",
      kicker: "Rigor em Cada Fase",
      title: "A Precisão que Faz a",
      serifAccent: "Diferença",
      subtitle:
        "Equipe técnica altamente qualificada com ferramentas de última geração para garantir eficiência máxima com custo-benefício inteligente.",
      statBadge: "EFICIÊNCIA COMPROVADA · ATENDIMENTO ÁGIL",
      imageUrl: covers[2],
    },
    {
      id: "experiencia",
      actBadge: "03 — A ENTREGA",
      kicker: "Sucesso Concretizado",
      title: "O Resultado que Alavanca seus",
      serifAccent: "Objetivos",
      subtitle:
        `Estamos prontos para atender você com exclusividade hoje em ${city}. Inicie uma conversa direta no WhatsApp e descubra a diferença.`,
      statBadge: "SATISFAÇÃO MÁXIMA · SUPORTE DIRETO",
      imageUrl: covers[3],
      quote: "Qualidade não é um ato ocasional, é o nosso hábito diário.",
    },
  ];
}

/**
 * CinematicLayout: Layout Narrativo Scrollytelling de Altíssimo Luxo (Padrão Café Estilo / Apple)
 * Desenvolvido para guiar o visitante em 4 capítulos cinematográficos imersivos.
 */
export class CinematicLayout implements TemplateLayoutRenderer {
  layoutId() {
    return "cinematic" as const;
  }

  supports(model: TemplateRenderModel) {
    return model.template.layout === "cinematic";
  }

  render(_model: TemplateRenderModel, ctx: LayoutRenderContext): ReactNode {
    const { bio, links, onTrack, onShare, products = [], supplemental } = ctx;
    const secondaryLinks = links.filter((l) => l.active);
    const insta = bio.instagram?.replace("@", "");
    const whats = bio.whatsapp?.replace(/\D/g, "");
    const phone = (bio as any).phone?.replace(/\D/g, "");

    const socialData = (bio.social_links as Record<string, any>) || {};
    const rating = Number(socialData.google_rating || socialData.rating) || 4.9;
    const reviewsCount = socialData.reviews_count || 48;
    const testimonials = Array.isArray(socialData.testimonials) ? socialData.testimonials : [];
    const address = socialData.address || "Atendimento Local";
    const city = socialData.city || address.split("-")[0] || "Sua Cidade";
    const openingHours = socialData.opening_hours || "Aberto Hoje";

    const nicheKey = detectNicheKey(socialData.niche || bio.description || "");
    const gallery = NICHE_GALLERIES[nicheKey] || NICHE_GALLERIES.restaurante || { covers: [], avatars: [] };

    // Coleta as 4 melhores fotos para a narrativa
    const rawCovers = [
      bio.cover_url,
      gallery.covers?.[0]?.url,
      gallery.covers?.[1]?.url,
      gallery.covers?.[2]?.url,
      gallery.covers?.[3]?.url,
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85",
    ].filter(Boolean) as string[];

    // Remove duplicatas consecutivas
    const distinctCovers = Array.from(new Set(rawCovers)).slice(0, 4);
    while (distinctCovers.length < 4) {
      distinctCovers.push(distinctCovers[0]);
    }

    // Capítulos da história (personalizados pelo usuário ou gerados pelo motor de roteiro)
    const customChapters = Array.isArray(socialData.story_chapters) && socialData.story_chapters.length >= 4
      ? (socialData.story_chapters as StoryChapter[])
      : null;

    const chapters = customChapters || getNicheStoryChapters(nicheKey, bio.display_name, city, distinctCovers);

    const encodedAddress = address ? encodeURIComponent(`${bio.display_name} ${address}`) : null;
    const mapsLink = encodedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : null;

    const whatsappDefaultMessage =
      bio.whatsapp_message || `Olá! Conheci a experiência da ${bio.display_name} pelo site e gostaria de fazer meu pedido.`;
    const orderWhatsAppUrl = whatsappUrl(whats, whatsappDefaultMessage);

    return (
      <div className="niche-cinematic-scrolly relative w-full min-h-screen bg-[#06070a] text-white font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
        {/* =========================================================================
            1. FUNDO ILUMINADO CINEMATOGRÁFICO (DUPLO MESH GLOW PROFUNDO GPU)
            ========================================================================= */}
        <div
          data-parallax-layer="deep"
          className="fixed -top-32 left-1/4 -translate-x-1/2 w-[340px] sm:w-[720px] h-[340px] sm:h-[720px] rounded-full blur-[140px] pointer-events-none opacity-25 dark:opacity-30 -z-10 bg-gradient-to-tr from-amber-600/40 via-yellow-500/30 to-orange-600/30"
          aria-hidden="true"
        />
        <div
          data-parallax-layer="deep"
          className="fixed top-1/2 right-1/4 translate-x-1/2 w-[340px] sm:w-[680px] h-[340px] sm:h-[680px] rounded-full blur-[160px] pointer-events-none opacity-20 dark:opacity-25 -z-10 bg-gradient-to-bl from-purple-800/30 via-pink-700/20 to-indigo-900/30"
          aria-hidden="true"
        />

        {/* =========================================================================
            2. TOPBAR FLUTUANTE DE LUXO (GLASSMORPHISM)
            ========================================================================= */}
        <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 transition-all duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
            {/* Lado Esquerdo: Identidade da Marca com Monograma ou Avatar */}
            <div className="flex items-center gap-3 min-w-0">
              {bio.avatar_url ? (
                <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-white/20 shadow-md bg-black/40 shrink-0">
                  <img
                    src={bio.avatar_url}
                    alt={bio.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-serif font-black text-lg border border-amber-400/30 shadow-md shrink-0">
                  {bio.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-heading font-black text-sm sm:text-base tracking-tight block leading-tight text-white truncate max-w-[150px] sm:max-w-xs">
                  {bio.display_name}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase block text-amber-400/90 truncate">
                  Experiência Exclusiva · {city}
                </span>
              </div>
            </div>

            {/* Centro: Navegação por Âncoras do Roteiro */}
            <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-widest text-white/70">
              <a href="#origem" className="hover:text-amber-300 transition-colors">
                A Origem
              </a>
              <a href="#processo" className="hover:text-amber-300 transition-colors">
                O Preparo
              </a>
              <a href="#experiencia" className="hover:text-amber-300 transition-colors">
                A Experiência
              </a>
              <a href="#conversao" className="hover:text-amber-300 transition-colors">
                Pedir Agora
              </a>
            </nav>

            {/* Lado Direito: Ação Rápida WhatsApp & Compartilhar */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={onShare}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all shadow-sm active:scale-95"
                aria-label="Compartilhar página"
              >
                <span>Compartilhar</span>
              </button>

              {whats && (
                <a
                  href={orderWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack("whatsapp_click")}
                  className="relative group overflow-hidden inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all hover:scale-102 active:scale-95"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                  <MessageCircle className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Peça Agora</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* =========================================================================
            3. CAPÍTULO 1 — A ABERTURA (O RITUAL / HERO NARRATIVO)
            ========================================================================= */}
        <section
          id="abertura"
          className="relative min-h-[85vh] sm:min-h-[92vh] flex flex-col justify-center items-center text-center px-4 sm:px-8 py-16 sm:py-24 max-w-5xl mx-auto"
        >
          {/* Badge Poético Superior */}
          <div
            data-parallax-layer="float"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-black/60 border border-amber-400/40 text-amber-300 shadow-xl backdrop-blur-md mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>{chapters[0].actBadge}</span>
          </div>

          {/* Título Monumental com Contraste Serif Itálico */}
          <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-7xl text-white tracking-tight leading-[1.1] max-w-4xl drop-shadow-2xl">
            {chapters[0].title}{" "}
            <span className="font-serif italic text-amber-300/95 font-normal underline decoration-amber-500/30 decoration-wavy underline-offset-8">
              {chapters[0].serifAccent || bio.display_name}
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            {chapters[0].subtitle}
          </p>

          {/* Imagem Macro Central da Abertura com Vinheta Suave e Parallax */}
          <div className="relative w-full max-w-3xl mt-10 sm:mt-14 rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] bg-black/60">
            <div className="relative w-full h-64 sm:h-96 overflow-hidden">
              <img
                data-parallax-layer="hero"
                src={chapters[0].imageUrl}
                alt={chapters[0].title}
                className="parallax-hero-image w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/40 to-transparent" />
            </div>

            {/* Tag Flutuante na Imagem */}
            {chapters[0].statBadge && (
              <div
                data-parallax-layer="float"
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-widest shadow-2xl"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>{chapters[0].statBadge}</span>
              </div>
            )}
          </div>

          {/* Indicador Suave de Rolagem */}
          <a
            href="#origem"
            className="mt-10 sm:mt-14 inline-flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors group text-xs uppercase tracking-widest font-semibold"
            aria-label="Rolar para o próximo capítulo"
          >
            <span>Desça para Descobrir</span>
            <ChevronDown className="h-4 w-4 animate-bounce text-amber-400 group-hover:translate-y-1 transition-transform" />
          </a>
        </section>

        {/* =========================================================================
            4. CAPÍTULO 2 — A ORIGEM (A NATUREZA REVELADA)
            ========================================================================= */}
        <section
          id="origem"
          className="relative min-h-[80vh] flex items-center px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto border-t border-white/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
            {/* Lado Esquerdo: Imagem de Detalhe / Insumo */}
            <div className="lg:col-span-6 relative order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/50 relative">
                <img
                  data-parallax-layer="hero"
                  src={chapters[1].imageUrl}
                  alt={chapters[1].title}
                  className="parallax-hero-image w-full h-80 sm:h-[440px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Badge Flutuante no Canto da Foto */}
                <div
                  data-parallax-layer="float"
                  className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest text-amber-300"
                >
                  <Compass className="h-3.5 w-3.5 text-amber-400" />
                  <span>{chapters[1].actBadge}</span>
                </div>
              </div>

              {chapters[1].quote && (
                <div
                  data-parallax-layer="float"
                  className="absolute -bottom-5 right-2 sm:-bottom-6 sm:right-6 max-w-xs p-4 rounded-2xl glass-card-premium shadow-2xl text-xs font-serif italic text-white/90 border border-white/20 leading-relaxed"
                >
                  &ldquo;{chapters[1].quote}&rdquo;
                </div>
              )}
            </div>

            {/* Lado Direito: Texto Narrativo do Ingrediente / Origem */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
                <span>{chapters[1].kicker}</span>
              </div>

              <h2 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                {chapters[1].title}{" "}
                <span className="font-serif italic text-amber-300/90 font-normal">
                  {chapters[1].serifAccent}
                </span>
              </h2>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light">
                {chapters[1].subtitle}
              </p>

              {chapters[1].statBadge && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{chapters[1].statBadge}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. CAPÍTULO 3 — A TRANSFORMAÇÃO (O PROCESSO ARTESANAL)
            ========================================================================= */}
        <section
          id="processo"
          className="relative min-h-[80vh] flex items-center px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto border-t border-white/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
            {/* Lado Esquerdo: Descrição da Técnica */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
                <span>{chapters[2].kicker}</span>
              </div>

              <h2 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                {chapters[2].title}{" "}
                <span className="font-serif italic text-amber-300/90 font-normal">
                  {chapters[2].serifAccent}
                </span>
              </h2>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light">
                {chapters[2].subtitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl glass-card-premium border border-white/15 space-y-1">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider">Padrão de Maestria</div>
                  <div className="text-xs text-white/70">Execução sem pressa, respeitando o tempo de maturação.</div>
                </div>
                <div className="p-3.5 rounded-2xl glass-card-premium border border-white/15 space-y-1">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider">Atenção Extrema</div>
                  <div className="text-xs text-white/70">Equipamentos calibrados e protocolos higiênicos rigorosos.</div>
                </div>
              </div>
            </div>

            {/* Lado Direito: Imagem de Ação e Preparo */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/50 relative">
                <img
                  data-parallax-layer="hero"
                  src={chapters[2].imageUrl}
                  alt={chapters[2].title}
                  className="parallax-hero-image w-full h-80 sm:h-[440px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div
                  data-parallax-layer="float"
                  className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest text-amber-300"
                >
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>{chapters[2].actBadge}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. CAPÍTULO 4 — A CONSAGRAÇÃO & CONVERSÃO (SEU MOMENTO)
            ========================================================================= */}
        <section
          id="experiencia"
          className="relative min-h-[85vh] px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto border-t border-white/10"
        >
          {/* Hero da Consagração */}
          <div className="text-center max-w-3xl mx-auto space-y-5 mb-12 sm:mb-16">
            <div
              data-parallax-layer="float"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-lg"
            >
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>{chapters[3].actBadge}</span>
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
              {chapters[3].title}{" "}
              <span className="font-serif italic text-amber-300/90 font-normal">
                {chapters[3].serifAccent}
              </span>
            </h2>

            <p className="text-sm sm:text-lg text-white/80 leading-relaxed font-light">
              {chapters[3].subtitle}
            </p>
          </div>

          {/* Card Principal de Conversão com Imagem do Produto Final e Botões */}
          <div
            id="conversao"
            className="rounded-3xl overflow-hidden glass-card-premium border border-white/20 shadow-2xl p-6 sm:p-10 mb-14 relative"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Foto de Destaque do Produto Pronto */}
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-white/15 shadow-xl relative h-64 sm:h-80">
                <img
                  data-parallax-layer="hero"
                  src={chapters[3].imageUrl}
                  alt={chapters[3].title}
                  className="parallax-hero-image w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div
                  data-parallax-layer="float"
                  className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/20"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)} no Google Maps</span>
                </div>
              </div>

              {/* Ação de Conversão com WhatsApp e Informações Rápidas */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Atendimento Online Ativo
                  </span>
                  <h3 className="font-heading font-black text-2xl sm:text-3xl text-white mt-3 leading-snug">
                    Faça seu pedido diretamente com a nossa equipe
                  </h3>
                  <p className="text-sm text-white/75 mt-2 leading-relaxed">
                    Sem filas, sem intermediários. Fale diretamente no WhatsApp oficial da {bio.display_name} e receba um atendimento ágil e atencioso em {city}.
                  </p>
                </div>

                {/* Botão de Destaque Shimmer WhatsApp */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {whats && (
                    <a
                      href={orderWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTrack("whatsapp_click")}
                      className="relative group overflow-hidden flex-1 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                      <MessageCircle className="h-5 w-5 relative z-10" />
                      <span className="relative z-10">{bio.whatsapp_button_label || "Chamar no WhatsApp Agora"}</span>
                    </a>
                  )}

                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      onClick={() => onTrack("phone_click")}
                      className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm px-5 py-4 rounded-2xl transition-all"
                    >
                      <Phone className="h-4 w-4 text-white/70" />
                      <span>Ligar</span>
                    </a>
                  )}

                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm px-5 py-4 rounded-2xl transition-all"
                    >
                      <MapPin className="h-4 w-4 text-white/70" />
                      <span>Como Chegar</span>
                    </a>
                  )}
                </div>

                {/* Dados de Endereço & Horário */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 pt-2 border-t border-white/10">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{address}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{openingHours}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VITRINE EM CARROSSEL / FEED HORIZONTAL TOUCH */}
          {products && products.length > 0 && (
            <div className="mb-14">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Seleção Especial
                </span>
                <h3 className="font-heading font-black text-2xl text-white mt-1">
                  Cardápio & Destaques
                </h3>
              </div>
              <CatalogSection items={products} whatsapp={bio.whatsapp} niche={(bio.social_links as any)?.niche} />
            </div>
          )}

          {/* AVALIAÇÕES DO GOOGLE MAPS EM CARDS DE VIDRO */}
          {testimonials.length > 0 && (
            <div className="mb-14 space-y-5" aria-label="Avaliações do Google">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                    Prova Social Verificada
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span>O Que Dizem Nossos Clientes</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{rating.toFixed(1)} no Google ({reviewsCount})</span>
                    </span>
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testimonials.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl glass-card-premium border border-white/10 shadow-lg space-y-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(t.rating || 5)].map((_, idx) => (
                          <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      {t.date && <span className="text-[11px] text-white/50">{t.date}</span>}
                    </div>
                    <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed">
                      &ldquo;{t.comment || t.text}&rdquo;
                    </p>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{t.name || t.author || "Cliente verificado no Google"}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LINKS SECUNDÁRIOS / REDES */}
          {secondaryLinks.length > 0 && (
            <div className="mb-14 space-y-3" aria-label="Acesso Rápido">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60">
                Acesso Rápido & Informações
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {secondaryLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrack("link_click")}
                    className="flex items-center justify-between p-4 rounded-2xl glass-card-premium border border-white/10 hover:border-amber-400/50 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-all group"
                  >
                    <span className="truncate group-hover:text-amber-300 transition-colors">{link.title}</span>
                    <ArrowUpRight className="h-4 w-4 text-white/60 group-hover:text-amber-300 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CHAVE PIX SE CONFIGURADA */}
          {bio.pix_key && (
            <div className="pt-2 mb-10 max-w-md mx-auto">
              <PixCard pixKey={bio.pix_key} onTrack={onTrack} />
            </div>
          )}

          {/* BLOCOS COMPLEMENTARES */}
          {supplemental}
        </section>

        {/* =========================================================================
            7. RODAPÉ CINEMATOGRÁFICO
            ========================================================================= */}
        <footer className="border-t border-white/10 bg-black/80 py-10 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{bio.display_name}</span>
              <span>· Experiência Cinematográfica em {city}</span>
            </div>

            {insta && (
              <a
                href={`https://instagram.com/${insta}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors text-white/80"
              >
                <Instagram className="h-4 w-4" />
                <span>@{insta}</span>
              </a>
            )}
          </div>
          <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-white/5">
            <Footer />
          </div>
        </footer>
      </div>
    );
  }
}

