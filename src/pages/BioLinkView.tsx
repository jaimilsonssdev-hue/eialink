import React, { useState, useId } from "react";
import {
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  X,
  Bot,
  Send,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
} from "lucide-react";
import { detectNicheKey, getSignatureHeroArchitectureForNiche, NICHE_GALLERIES } from "@/modules/prospecting/nichePresets";

/* ==========================================================================
   CONTRATO DE DADOS & INTERFACES TYPESCRIPT (ESTRITO)
   ========================================================================== */

export interface LinkItem {
  titulo: string;
  url: string;
  icone?: string;
  destacado?: boolean;
  tamanho_bento?: "col-span-1" | "col-span-2";
  subtitulo?: string;
}

export interface ConteudoPerfil {
  avatar_url?: string;
  hero_image_url?: string;
  titulo: string;
  subtitulo: string;
  bio_curta?: string;
  categoria?: string;
  cidade?: string;
  nota_google?: string;
  total_avaliacoes?: string;
  whatsapp_url?: string;
  whatsapp_label?: string;
  links: LinkItem[];
}

export interface FundoValores {
  cor_gradiente_1: string;
  cor_gradiente_2: string;
  blur_sobreposicao?: string;
  imagem_url?: string;
}

export interface EstiloBotoes {
  cor_fundo_card: string;
  cor_borda: string;
  cor_texto: string;
  cor_destaque: string;
  raio_borda: string;
}

export interface TokensDesign {
  layout_esqueleto: "list_vertical_premium" | "bento_grid";
  estilo_layout?: "bento" | "glassmorphism" | "minimal";
  hero_architecture?: "immersive" | "asymmetric" | "split" | "centered" | "typographic";
  tipo_fundo: "mesh_gradient" | "imagem_url" | "solido";
  fundo_valores: FundoValores;
  estilo_botoes: EstiloBotoes;
}

export interface ConfiguracoesIntegracao {
  exibir_agenda: boolean;
  agenda_endpoint_id: string;
  exibir_typebot: boolean;
  typebot_id: string;
}

export interface BioLinkConfig {
  uuid_cliente: string;
  configuracoes_integracao: ConfiguracoesIntegracao;
  tokens_design: TokensDesign;
  conteudo_perfil: ConteudoPerfil;
}

interface BioLinkViewProps {
  config: BioLinkConfig;
  className?: string;
  onLinkClick?: (url: string, titulo: string) => void;
  onBookingClick?: () => void;
  onTypebotOpen?: () => void;
}

interface HeroSharedProps {
  titulo: string;
  subtitulo: string;
  bioCurta?: string;
  avatarUrl?: string;
  heroImageUrl?: string;
  categoria?: string;
  cidade?: string;
  notaGoogle?: string;
  totalAvaliacoes?: string;
  whatsappUrl?: string;
  whatsappLabel?: string;
  onCtaClick?: () => void;
  onSecondaryClick?: () => void;
  secondaryLabel?: string;
  corDestaque: string;
  corTexto: string;
  corFundoCard: string;
  corBorda: string;
  raioBorda: string;
}

/* ==========================================================================
   1. HERO IMMERSIVE (Full-Bleed Cinematográfico)
   Padrão de referência para Clínicas, Saúde, Terapia e Modo VIP
   ========================================================================== */
function HeroImmersive({
  titulo,
  subtitulo,
  bioCurta,
  heroImageUrl,
  avatarUrl,
  categoria = "Saúde & Excelência",
  cidade,
  notaGoogle = "5.0",
  totalAvaliacoes = "50+",
  whatsappUrl,
  whatsappLabel = "Falar no WhatsApp Agora",
  onCtaClick,
  onSecondaryClick,
  secondaryLabel = "Conhecer Serviços",
  corDestaque,
}: HeroSharedProps) {
  const displayImage = heroImageUrl || avatarUrl || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-8 min-h-[440px] sm:min-h-[500px] flex flex-col justify-end p-6 sm:p-10 border border-white/10 group">
      {/* Imagem de Fundo Full-Bleed com Zoom Sutil */}
      <img
        src={displayImage}
        alt={titulo}
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] scale-105 transition-transform duration-700 group-hover:scale-110"
        loading="eager"
      />

      {/* Overlay Escuro com Gradiente Suave para Legibilidade AAA */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--cor-gradiente-1,#070F1E)] via-black/60 to-black/25 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start max-w-2xl">
        {/* Badge Flutuante de Avaliação Google & Categoria */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20 shadow-md">
          <span className="flex items-center gap-1 text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            {notaGoogle}
          </span>
          <span className="opacity-40">•</span>
          <span>{categoria} {cidade ? `• ${cidade}` : ""}</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md mb-3">
          {titulo}
        </h1>

        {/* Subtítulo / Descrição */}
        <p className="text-sm sm:text-base text-white/90 leading-relaxed drop-shadow mb-6 max-w-xl">
          {bioCurta || subtitulo}
        </p>

        {/* Ações de Conversão Duplas */}
        <div className="flex flex-wrap items-center gap-3 mb-6 w-full">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span>{whatsappLabel}</span>
            </a>
          )}
          {onSecondaryClick && (
            <button
              type="button"
              onClick={onSecondaryClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-md border border-white/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>{secondaryLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Barra de Credibilidade Flutuante com Métricas */}
        <div className="w-full pt-4 border-t border-white/15 grid grid-cols-3 gap-2 sm:gap-4 text-white">
          <div>
            <div className="text-lg sm:text-xl font-black text-amber-400">★ {notaGoogle}</div>
            <div className="text-[10px] sm:text-xs text-white/75">Google Reviews</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black" style={{ color: corDestaque }}>+{totalAvaliacoes}</div>
            <div className="text-[10px] sm:text-xs text-white/75">Atendimentos</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">100%</div>
            <div className="text-[10px] sm:text-xs text-white/75">Compromisso Ético</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. HERO ASYMMETRIC (Editorial com Recorte Angular / Diagonal)
   Padrão para Fitness, Barbearia, Beleza & Estética e Oficinas
   ========================================================================== */
function HeroAsymmetric({
  titulo,
  subtitulo,
  bioCurta,
  heroImageUrl,
  avatarUrl,
  categoria = "Alta Performance",
  cidade,
  notaGoogle = "5.0",
  totalAvaliacoes = "50+",
  whatsappUrl,
  whatsappLabel = "Agendar no WhatsApp",
  onCtaClick,
  onSecondaryClick,
  secondaryLabel = "Conhecer Serviços",
  corDestaque,
  corTexto,
  corFundoCard,
  corBorda,
  raioBorda,
}: HeroSharedProps) {
  const displayImage = heroImageUrl || avatarUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      style={{
        backgroundColor: corFundoCard,
        borderColor: corBorda,
        borderRadius: raioBorda,
      }}
      className="w-full mb-8 p-6 sm:p-8 border shadow-xl backdrop-blur-md overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Coluna Esquerda: Conteúdo e Copywriting */}
        <div className="md:col-span-7 flex flex-col items-start z-10">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10"
            style={{ color: corDestaque }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {categoria} {cidade ? `• ${cidade}` : ""}
          </span>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-3"
            style={{ color: corTexto }}
          >
            {titulo}
          </h1>

          <p
            className="text-sm sm:text-base opacity-85 leading-relaxed mb-6 max-w-lg"
            style={{ color: corTexto }}
          >
            {bioCurta || subtitulo}
          </p>

          <div className="flex flex-wrap items-center gap-3 w-full">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span>{whatsappLabel}</span>
              </a>
            )}
            {onSecondaryClick && (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm transition-all border border-white/15 cursor-pointer"
                style={{ color: corTexto }}
              >
                <span>{secondaryLabel}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Coluna Direita: Imagem Angular com Selo Flutuante */}
        <div className="md:col-span-5 relative">
          <div
            className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 h-64 sm:h-76 w-full transform hover:scale-[1.02] transition-transform duration-500"
            style={{
              clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
            }}
          >
            <img
              src={displayImage}
              alt={titulo}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>

          {/* Selo Flutuante de Autoridade Google */}
          <div className="absolute -bottom-3 -left-3 bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white p-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-white/20 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-sm shadow">
              ★
            </div>
            <div>
              <div className="font-bold text-xs leading-none mb-0.5">{notaGoogle} no Google</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{totalAvaliacoes} avaliações reais</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. HERO SPLIT (Lado a Lado Equilibrado & Corporativo)
   Padrão para Imobiliárias, Construção, Petshops, Energia Solar e Autônomos
   ========================================================================== */
function HeroSplit({
  titulo,
  subtitulo,
  bioCurta,
  heroImageUrl,
  avatarUrl,
  categoria = "Estrutura & Confiança",
  cidade,
  notaGoogle = "5.0",
  totalAvaliacoes = "50+",
  whatsappUrl,
  whatsappLabel = "Solicitar Atendimento",
  onCtaClick,
  onSecondaryClick,
  secondaryLabel = "Onde Estamos",
  corDestaque,
  corTexto,
  corFundoCard,
  corBorda,
  raioBorda,
}: HeroSharedProps) {
  const displayImage = heroImageUrl || avatarUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      style={{
        backgroundColor: corFundoCard,
        borderColor: corBorda,
        borderRadius: raioBorda,
      }}
      className="w-full mb-8 p-6 sm:p-8 border shadow-xl backdrop-blur-md overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Coluna de Texto */}
        <div className="flex flex-col items-start">
          <div
            className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 border"
            style={{
              backgroundColor: `color-mix(in srgb, ${corDestaque} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${corDestaque} 30%, transparent)`,
              color: corDestaque,
            }}
          >
            {categoria} {cidade ? `• ${cidade}` : ""}
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3"
            style={{ color: corTexto }}
          >
            {titulo}
          </h1>

          <p
            className="text-sm sm:text-base opacity-85 leading-relaxed mb-6"
            style={{ color: corTexto }}
          >
            {bioCurta || subtitulo}
          </p>

          <div className="flex flex-wrap items-center gap-3 w-full mb-6">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span>{whatsappLabel}</span>
              </a>
            )}
            {onSecondaryClick && (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm transition-all border border-white/15 cursor-pointer"
                style={{ color: corTexto }}
              >
                <span>{secondaryLabel}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Divisor de Estatísticas Locais */}
          <div className="w-full pt-4 border-t border-white/15 flex items-center gap-6">
            <div>
              <div className="text-xl sm:text-2xl font-black flex items-center gap-1" style={{ color: corTexto }}>
                <span className="text-amber-400">★</span> {notaGoogle}
              </div>
              <div className="text-[11px] opacity-70">Google Reviews</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
              <div className="text-[11px] opacity-70">Compromisso Local</div>
            </div>
          </div>
        </div>

        {/* Coluna da Imagem */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 h-64 sm:h-80 w-full">
          <img
            src={displayImage}
            alt={titulo}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. HERO CENTERED (Bento & Vitrine de Produtos / Cardápio)
   Padrão para Lojas, Delivery, Restaurantes, Sorveterias e Bebidas
   ========================================================================== */
function HeroCentered({
  titulo,
  subtitulo,
  bioCurta,
  heroImageUrl,
  avatarUrl,
  categoria = "Destaque & Sabores",
  cidade,
  whatsappUrl,
  whatsappLabel = "Fazer Pedido no WhatsApp",
  onCtaClick,
  corDestaque,
  corTexto,
  corFundoCard,
  corBorda,
  raioBorda,
}: HeroSharedProps) {
  const displayImage = heroImageUrl || avatarUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      style={{
        backgroundColor: corFundoCard,
        borderColor: corBorda,
        borderRadius: raioBorda,
      }}
      className="w-full mb-8 p-6 sm:p-10 border shadow-xl backdrop-blur-md text-center flex flex-col items-center"
    >
      {/* Badge Flutuante Central */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
        style={{
          backgroundColor: `color-mix(in srgb, ${corDestaque} 18%, transparent)`,
          borderColor: `color-mix(in srgb, ${corDestaque} 35%, transparent)`,
          color: corDestaque,
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>{categoria} • {cidade || "Destaque da Região"}</span>
      </div>

      <h1
        className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3 max-w-xl"
        style={{ color: corTexto }}
      >
        {titulo}
      </h1>

      <p
        className="text-sm sm:text-base opacity-85 leading-relaxed mb-6 max-w-lg"
        style={{ color: corTexto }}
      >
        {bioCurta || subtitulo}
      </p>

      {whatsappUrl && (
        <div className="mb-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCtaClick}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base shadow-xl hover:shadow-emerald-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span>{whatsappLabel}</span>
          </a>
        </div>
      )}

      {/* Card Panorâmico de Imagem (Vitrine / Produto em Alta Resolução) */}
      <div className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 h-64 sm:h-80">
        <img
          src={displayImage}
          alt={titulo}
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   5. HERO TYPOGRAPHIC (Corporativo de Luxo com Tipografia Editorial)
   Padrão para Advocacia, Contabilidade, Seguros e Tecnologia
   ========================================================================== */
function HeroTypographic({
  titulo,
  subtitulo,
  bioCurta,
  categoria = "Consultoria & Autoridade",
  cidade,
  notaGoogle = "5.0",
  whatsappUrl,
  onCtaClick,
  corDestaque,
  corTexto,
  corFundoCard,
  corBorda,
  raioBorda,
}: HeroSharedProps) {
  return (
    <div
      style={{
        backgroundColor: corFundoCard,
        borderColor: corBorda,
        borderRadius: raioBorda,
      }}
      className="w-full mb-8 p-6 sm:p-10 border shadow-xl backdrop-blur-md text-left"
    >
      <div className="max-w-2xl">
        <span
          className="text-xs font-bold tracking-widest uppercase mb-3 block"
          style={{ color: corDestaque }}
        >
          {categoria} {cidade ? `— ${cidade}` : ""}
        </span>

        <h1
          className="text-4xl sm:text-6xl font-black tracking-tighter leading-none mb-4"
          style={{ color: corTexto }}
        >
          {titulo}
        </h1>

        {/* Linha Divisória de Luxo */}
        <div
          className="w-24 h-1.5 rounded-full my-5"
          style={{ backgroundColor: corDestaque }}
        />

        <p
          className="text-base sm:text-xl font-light leading-relaxed opacity-90 max-w-xl mb-8"
          style={{ color: corTexto }}
        >
          {bioCurta || subtitulo}
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span>Atendimento Prioritário</span>
            </a>
          )}
          <span className="text-xs opacity-75 font-medium flex items-center gap-1.5" style={{ color: corTexto }}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ★ {notaGoogle} / 5.0 estrelas verificadas
          </span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: BioLinkView
   Renderização 100% dinâmica via CSS Variables com 5 Heros Assinadas
   ========================================================================== */

export function BioLinkView({
  config,
  className = "",
  onLinkClick,
  onBookingClick,
  onTypebotOpen,
}: BioLinkViewProps) {
  const {
    uuid_cliente,
    configuracoes_integracao,
    tokens_design,
    conteudo_perfil,
  } = config;

  const [isTypebotOpen, setIsTypebotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "bot" | "user"; text: string }>>([
    {
      role: "bot",
      text: `Olá! Sou o assistente virtual de ${conteudo_perfil.titulo}. Como posso te ajudar hoje?`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const {
    layout_esqueleto = "list_vertical_premium",
    tipo_fundo = "mesh_gradient",
    fundo_valores,
    estilo_botoes,
  } = tokens_design;

  const corGrad1 = fundo_valores.cor_gradiente_1 || "#0b0c10";
  const corGrad2 = fundo_valores.cor_gradiente_2 || "#1f2937";
  const blurOverlay = fundo_valores.blur_sobreposicao || "8px";
  const imagemFundo = fundo_valores.imagem_url;

  const corFundoCard = estilo_botoes.cor_fundo_card || "rgba(18, 20, 28, 0.90)";
  const corBorda = estilo_botoes.cor_borda || "rgba(255, 255, 255, 0.12)";
  const corTexto = estilo_botoes.cor_texto || "#ffffff";
  const corDestaque = estilo_botoes.cor_destaque || "#6366f1";
  const raioBorda = estilo_botoes.raio_borda || "16px";

  // Identificação da Arquitetura de Hero
  const heroArchitecture =
    tokens_design.hero_architecture ||
    (tokens_design.estilo_layout === "bento"
      ? "centered"
      : tokens_design.estilo_layout === "minimal"
        ? "typographic"
        : "immersive");

  /* --------------------------------------------------------------------------
     1. INJEÇÃO DE CSS VARIABLES DIRETAMENTE NO CONTAINER (ZERO JS PESADO)
     -------------------------------------------------------------------------- */
  const customCssVariables: React.CSSProperties = {
    ["--cor-principal" as any]: corDestaque,
    ["--cor-destaque" as any]: corDestaque,
    ["--cor-texto" as any]: corTexto,
    ["--cor-fundo-card" as any]: corFundoCard,
    ["--cor-borda" as any]: corBorda,
    ["--raio-borda" as any]: raioBorda,
    ["--cor-gradiente-1" as any]: corGrad1,
    ["--cor-gradiente-2" as any]: corGrad2,
    ["--blur-sobreposicao" as any]: blurOverlay,

    // Compatibilidade com Tailwind v4 Design Tokens
    ["--primary" as any]: corDestaque,
    ["--primary-foreground" as any]: "#ffffff",
    ["--foreground" as any]: corTexto,
    ["--card" as any]: corFundoCard,
    ["--card-foreground" as any]: corTexto,
    ["--border" as any]: corBorda,
    ["--radius" as any]: raioBorda,
    ["--background" as any]: corGrad1,
  };

  const handleOpenTypebot = () => {
    setIsTypebotOpen(true);
    if (onTypebotOpen) onTypebotOpen();
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Perfeito! Registrei sua mensagem: "${userText}". Deseja continuar o atendimento no WhatsApp direto com nossa equipe?`,
        },
      ]);
    }, 600);
  };

  // WhatsApp Link inteligente
  const defaultWaLink = conteudo_perfil.whatsapp_url ||
    conteudo_perfil.links.find((l) => l.destacado || l.url.includes("wa.me"))?.url;

  const heroProps: HeroSharedProps = {
    titulo: conteudo_perfil.titulo,
    subtitulo: conteudo_perfil.subtitulo,
    bioCurta: conteudo_perfil.bio_curta,
    avatarUrl: conteudo_perfil.avatar_url,
    heroImageUrl: conteudo_perfil.hero_image_url || imagemFundo,
    categoria: conteudo_perfil.categoria || "Especialidade",
    cidade: conteudo_perfil.cidade,
    notaGoogle: conteudo_perfil.nota_google || "5.0",
    totalAvaliacoes: conteudo_perfil.total_avaliacoes || "50+",
    whatsappUrl: defaultWaLink,
    whatsappLabel: conteudo_perfil.whatsapp_label || "Falar no WhatsApp",
    onCtaClick: () => defaultWaLink && onLinkClick?.(defaultWaLink, "Hero WhatsApp CTA"),
    onSecondaryClick: configuracoes_integracao.exibir_agenda
      ? onBookingClick
      : () => {
          const el = document.getElementById(`links-${uuid_cliente}`);
          el?.scrollIntoView({ behavior: "smooth" });
        },
    secondaryLabel: configuracoes_integracao.exibir_agenda ? "Agendar Horário" : "Ver Serviços",
    corDestaque,
    corTexto,
    corFundoCard,
    corBorda,
    raioBorda,
  };

  return (
    <div
      id={`biolink-${uuid_cliente}`}
      style={customCssVariables}
      className={`relative min-h-screen w-full flex flex-col items-center justify-start text-[var(--cor-texto)] font-sans antialiased selection:bg-[var(--cor-destaque)] selection:text-white pb-24 overflow-x-hidden ${className}`}
    >
      {/* Keyframes GPU-Accelerated */}
      <style>{`
        @keyframes biolinkMeshDrift {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(6%, -4%, 0) scale(1.08) rotate(4deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }
        @keyframes biolinkPulseGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.04); }
        }
        .biolink-mesh-orb-1 {
          animation: biolinkMeshDrift 18s ease-in-out infinite;
          will-change: transform;
        }
        .biolink-mesh-orb-2 {
          animation: biolinkMeshDrift 24s ease-in-out infinite reverse;
          will-change: transform;
        }
        .biolink-glow-pulse {
          animation: biolinkPulseGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Plano de Fundo Cinematográfico */}
      {tipo_fundo === "imagem_url" && imagemFundo ? (
        <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
          <img
            src={imagemFundo}
            alt=""
            className="w-full h-full object-cover object-center scale-105"
            loading="eager"
          />
          <div
            className="absolute inset-0 bg-black/55"
            style={{ backdropFilter: `blur(${blurOverlay})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>
      ) : tipo_fundo === "mesh_gradient" ? (
        <div
          className="fixed inset-0 -z-20 pointer-events-none overflow-hidden"
          style={{ backgroundColor: corGrad1 }}
        >
          <div
            className="biolink-mesh-orb-1 absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] sm:w-[720px] h-[520px] sm:h-[720px] rounded-full opacity-60 blur-[100px] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${corDestaque} 0%, transparent 68%)`,
            }}
          />
          <div
            className="biolink-mesh-orb-2 absolute top-1/3 -right-36 w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] rounded-full opacity-40 blur-[110px] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${corGrad2} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)`,
            }}
          />
        </div>
      ) : (
        <div
          className="fixed inset-0 -z-20 pointer-events-none"
          style={{ backgroundColor: corGrad1 }}
        />
      )}

      {/* CONTAINER CENTRAL PRINCIPAL */}
      <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 flex flex-col items-center z-10">

        {/* --------------------------------------------------------------------------
            RENDERIZAÇÃO DA HERO SECTION ASSINADA (1 DAS 5 ARQUITETURAS DO KIT)
            -------------------------------------------------------------------------- */}
        {heroArchitecture === "immersive" && <HeroImmersive {...heroProps} />}
        {heroArchitecture === "asymmetric" && <HeroAsymmetric {...heroProps} />}
        {heroArchitecture === "split" && <HeroSplit {...heroProps} />}
        {heroArchitecture === "centered" && <HeroCentered {...heroProps} />}
        {heroArchitecture === "typographic" && <HeroTypographic {...heroProps} />}

        {/* --------------------------------------------------------------------------
            MÁSCARAS DE ESTRUTURA: LISTA VERTICAL OU BENTO GRID
            -------------------------------------------------------------------------- */}
        <div id={`links-${uuid_cliente}`} className="w-full">
          {layout_esqueleto === "bento_grid" ? (
            /* MÁSCARA BENTO GRID ASSIMÉTRICO (MODERNO) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-8">
              {conteudo_perfil.links.map((link, idx) => {
                const isColSpan2 = link.tamanho_bento
                  ? link.tamanho_bento === "col-span-2"
                  : (link.destacado || idx === 0);
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onLinkClick?.(link.url, link.titulo)}
                    style={{
                      backgroundColor: link.destacado ? `color-mix(in srgb, ${corDestaque} 18%, ${corFundoCard})` : corFundoCard,
                      borderColor: link.destacado ? corDestaque : corBorda,
                      borderRadius: raioBorda,
                      color: corTexto,
                    }}
                    className={`group relative p-4 sm:p-5 border shadow-lg backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer overflow-hidden ${
                      isColSpan2 ? "sm:col-span-2 min-h-[110px]" : "min-h-[125px]"
                    }`}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                      style={{ backgroundColor: corDestaque }}
                    />

                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-2xl filter drop-shadow-sm">
                        {link.icone || "✨"}
                      </span>
                      <span
                        className="grid h-8 w-8 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: corDestaque,
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base leading-snug">
                        {link.titulo}
                      </h3>
                      {link.subtitulo && (
                        <p className="text-xs opacity-75 mt-0.5 font-normal line-clamp-2">
                          {link.subtitulo}
                        </p>
                      )}
                      {link.destacado && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold mt-1 uppercase tracking-wider"
                          style={{ color: corDestaque }}
                        >
                          <Sparkles className="h-3 w-3" />
                          Destaque
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            /* MÁSCARA LIST VERTICAL PREMIUM (ALTA CONVERSÃO) */
            <div className="flex flex-col gap-3 w-full mb-8">
              {conteudo_perfil.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link.url, link.titulo)}
                  style={{
                    backgroundColor: link.destacado ? `color-mix(in srgb, ${corDestaque} 20%, ${corFundoCard})` : corFundoCard,
                    borderColor: link.destacado ? corDestaque : corBorda,
                    borderRadius: raioBorda,
                    color: corTexto,
                  }}
                  className="group relative w-full px-5 py-4 border shadow-md backdrop-blur-md flex items-center justify-between transition-all duration-300 hover:scale-[1.015] active:scale-95 cursor-pointer overflow-hidden"
                >
                  {link.destacado && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: corDestaque }}
                    />
                  )}

                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <span className="text-xl shrink-0 filter drop-shadow-sm">
                      {link.icone || "🔗"}
                    </span>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-sm sm:text-base truncate">
                        {link.titulo}
                      </span>
                      {link.subtitulo && (
                        <span className="text-xs opacity-75 truncate font-normal">
                          {link.subtitulo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: corDestaque,
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------------------------------------------
            MÓDULO DE INTEGRAÇÃO: AGENDA EMBED / IFRAME RESPONSIVO
            -------------------------------------------------------------------------- */}
        {configuracoes_integracao.exibir_agenda && configuracoes_integracao.agenda_endpoint_id && (
          <section
            aria-label="Agendamento Online"
            style={{
              backgroundColor: corFundoCard,
              borderColor: corBorda,
              borderRadius: raioBorda,
            }}
            className="w-full mb-8 p-4 sm:p-6 border shadow-xl backdrop-blur-md overflow-hidden transition-all"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className="grid h-9 w-9 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: corDestaque }}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold" style={{ color: corTexto }}>
                    Agendamento Online
                  </h2>
                  <p className="text-[11px] opacity-70 flex items-center gap-1" style={{ color: corTexto }}>
                    <Clock className="h-3 w-3" /> Horários em tempo real
                  </p>
                </div>
              </div>

              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/10"
                style={{ color: corDestaque }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Disponível
              </span>
            </div>

            <div
              className="relative w-full rounded-xl overflow-hidden bg-black/30 border border-white/10"
              style={{ minHeight: "380px" }}
            >
              <iframe
                src={`https://eialink.com.br/agendar/${configuracoes_integracao.agenda_endpoint_id}`}
                title="Agenda de Atendimento"
                className="w-full h-full min-h-[380px] border-0"
                loading="lazy"
                onLoad={() => onBookingClick?.()}
              />
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------------
            MÓDULO DE INTEGRAÇÃO: TYPEBOT / ATENDENTE VIRTUAL IA
            -------------------------------------------------------------------------- */}
        {configuracoes_integracao.exibir_typebot && (
          <div className="w-full">
            <button
              type="button"
              onClick={handleOpenTypebot}
              style={{
                backgroundColor: `color-mix(in srgb, ${corDestaque} 15%, ${corFundoCard})`,
                borderColor: corDestaque,
                borderRadius: raioBorda,
                color: corTexto,
              }}
              className="w-full p-4 border shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-left transition-all duration-300 hover:scale-[1.015] active:scale-95 cursor-pointer mb-6 group"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: corDestaque }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3"
                    style={{ backgroundColor: corDestaque }}
                  />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                    <Bot className="h-4 w-4" style={{ color: corDestaque }} />
                    Falar com Atendente Virtual
                  </p>
                  <p className="text-[11px] opacity-75">
                    Tire dúvidas e receba orientação imediata 24h
                  </p>
                </div>
              </div>

              <span
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-white shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: corDestaque }}
              >
                Conversar
              </span>
            </button>
          </div>
        )}

        {/* RODAPÉ DISCRETO */}
        <footer className="mt-8 text-center text-xs opacity-50 space-y-1">
          <p>© {new Date().getFullYear()} {conteudo_perfil.titulo}</p>
          <p className="text-[10px]">Desenvolvido com padrão cinematográfico de alta conversão</p>
        </footer>
      </div>

      {/* --------------------------------------------------------------------------
          MODAL DO TYPEBOT / ASSISTENTE IA COM CINEMATIC BACKDROP BLUR
          -------------------------------------------------------------------------- */}
      {isTypebotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
        >
          <div
            style={{
              backgroundColor: corGrad1,
              borderColor: corBorda,
              borderRadius: raioBorda,
              color: corTexto,
            }}
            className="relative w-full max-w-md h-[560px] max-h-[90vh] flex flex-col border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header do Chat */}
            <div
              className="px-4 py-3.5 border-b flex items-center justify-between"
              style={{
                backgroundColor: `color-mix(in srgb, ${corDestaque} 12%, ${corFundoCard})`,
                borderColor: corBorda,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-full grid place-items-center text-white text-xs font-bold"
                  style={{ backgroundColor: corDestaque }}
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold">
                    Atendente Virtual • {conteudo_perfil.titulo}
                  </h3>
                  <p className="text-[10px] opacity-75 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online agora
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTypebotOpen(false)}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition-colors cursor-pointer"
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div
                      className="h-6 w-6 rounded-full grid place-items-center text-white shrink-0 text-[10px]"
                      style={{ backgroundColor: corDestaque }}
                    >
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor:
                        msg.role === "user" ? corDestaque : "rgba(255, 255, 255, 0.08)",
                      color: msg.role === "user" ? "#ffffff" : corTexto,
                      borderRadius: "14px",
                    }}
                    className="max-w-[80%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm"
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Envio */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 border-t flex items-center gap-2"
              style={{
                borderColor: corBorda,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 text-white placeholder-white/50"
                style={{ ["--tw-ring-color" as any]: corDestaque }}
              />
              <button
                type="submit"
                className="h-9 w-9 rounded-xl grid place-items-center text-white shadow-md transition-transform duration-200 active:scale-90 cursor-pointer shrink-0"
                style={{ backgroundColor: corDestaque }}
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   FUNÇÃO ADAPTADORA: buildBioLinkConfig
   Converte perfis salvos no banco de dados e bio para a tipagem BioLinkConfig
   ========================================================================== */

export function buildBioLinkConfig(
  bio: any,
  links: any[] = [],
  products: any[] = []
): BioLinkConfig {
  const socialLinks = (bio?.social_links as Record<string, any>) || {};
  const customTheme = socialLinks.custom_theme || {};
  const tokensDesignRaw = socialLinks.tokens_design || {};

  const nicheKey = detectNicheKey(socialLinks.niche || bio?.niche, bio?.display_name);

  const corDestaque =
    customTheme.primary ||
    tokensDesignRaw.estilo_botoes?.cor_destaque ||
    "#6366f1";

  const corTexto =
    customTheme.text ||
    tokensDesignRaw.estilo_botoes?.cor_texto ||
    (customTheme.mode === "light" ? "#0f172a" : "#ffffff");

  const corGrad1 =
    customTheme.background ||
    tokensDesignRaw.fundo_valores?.cor_gradiente_1 ||
    "#0b0c10";

  const corGrad2 =
    customTheme.gradient_2 ||
    tokensDesignRaw.fundo_valores?.cor_gradiente_2 ||
    customTheme.primary ||
    "#1f2937";

  const corCard =
    customTheme.card_bg ||
    tokensDesignRaw.estilo_botoes?.cor_fundo_card ||
    (customTheme.mode === "light" ? "#ffffff" : "rgba(255, 255, 255, 0.04)");

  const corBorda =
    customTheme.border_color ||
    tokensDesignRaw.estilo_botoes?.cor_borda ||
    (customTheme.mode === "light" ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.12)");

  const raioBorda =
    customTheme.border_radius ||
    tokensDesignRaw.estilo_botoes?.raio_borda ||
    "16px";

  const heroArchitecture =
    tokensDesignRaw.hero_architecture ||
    getSignatureHeroArchitectureForNiche(nicheKey);

  const gallery = NICHE_GALLERIES[nicheKey] || NICHE_GALLERIES.geral;

  const defaultHeroImage =
    tokensDesignRaw.fundo_valores?.imagem_url ||
    bio?.cover_url ||
    gallery?.covers?.[0]?.url;

  const whatsappPhone = bio?.whatsapp || socialLinks?.whatsapp || "";
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Vim pelo site da ${bio?.display_name || "empresa"} e gostaria de atendimento.`
      )}`
    : undefined;

  return {
    uuid_cliente: bio?.id || "usr_default",
    configuracoes_integracao: {
      exibir_agenda: Boolean(socialLinks.booking_enabled || bio?.bookingActive),
      agenda_endpoint_id: bio?.slug || "",
      exibir_typebot: Boolean(socialLinks.ai_chat_enabled),
      typebot_id: socialLinks.typebot_id || "atendente-default",
    },
    tokens_design: {
      layout_esqueleto: customTheme.layout_esqueleto || tokensDesignRaw.layout_esqueleto || "list_vertical_premium",
      estilo_layout: tokensDesignRaw.estilo_layout || (heroArchitecture === "centered" ? "bento" : heroArchitecture === "typographic" ? "minimal" : "glassmorphism"),
      hero_architecture: heroArchitecture,
      tipo_fundo: customTheme.mode === "gradient" ? "mesh_gradient" : customTheme.mode === "light" ? "solido" : (tokensDesignRaw.tipo_fundo || (defaultHeroImage ? "imagem_url" : "mesh_gradient")),
      fundo_valores: {
        cor_gradiente_1: corGrad1,
        cor_gradiente_2: corGrad2,
        blur_sobreposicao: tokensDesignRaw.fundo_valores?.blur_sobreposicao || "8px",
        imagem_url: defaultHeroImage || "",
      },
      estilo_botoes: {
        cor_fundo_card: corCard,
        cor_borda: corBorda,
        cor_texto: corTexto,
        cor_destaque: corDestaque,
        raio_borda: raioBorda,
      },
    },
    conteudo_perfil: {
      avatar_url: bio?.avatar_url || gallery?.avatars?.[0]?.url || "",
      hero_image_url: defaultHeroImage,
      titulo: bio?.display_name || "Sua Empresa",
      subtitulo: bio?.description || "Atendimento especializado e exclusivo",
      bio_curta: socialLinks.bio_curta || "",
      categoria: socialLinks.niche || bio?.niche || "Excelência",
      cidade: socialLinks.city || bio?.city || "",
      nota_google: socialLinks.google_rating || "5.0",
      total_avaliacoes: socialLinks.google_reviews || "50+",
      whatsapp_url: whatsappUrl,
      whatsapp_label: "Falar no WhatsApp",
      links: (links || [])
        .filter((l) => l.active)
        .map((l) => ({
          titulo: l.title,
          url: l.url,
          icone: l.icon || "✨",
          destacado: Boolean(l.featured || l.highlighted),
        })),
    },
  };
}

export default BioLinkView;

export { enrichAndParseScrapedData } from "@/modules/prospecting/enrichAndParseScrapedData";
