import React, { useState, useEffect, useId } from "react";
import {
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  X,
  Bot,
  Send,
  User,
  Clock,
  ShieldCheck,
} from "lucide-react";

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
  titulo: string;
  subtitulo: string;
  bio_curta?: string;
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

/* ==========================================================================
   COMPONENTE PRINCIPAL: BioLinkView
   Renderização 100% dinâmica via CSS Variables (Design Tokens AAA)
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

  const styleId = useId();
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

  const corFundoCard = estilo_botoes.cor_fundo_card || "rgba(255, 255, 255, 0.03)";
  const corBorda = estilo_botoes.cor_borda || "rgba(255, 255, 255, 0.1)";
  const corTexto = estilo_botoes.cor_texto || "#ffffff";
  const corDestaque = estilo_botoes.cor_destaque || "#6366f1";
  const raioBorda = estilo_botoes.raio_borda || "16px";

  /* --------------------------------------------------------------------------
     1. INJEÇÃO DE CSS VARIABLES DIRETAMENTE NO CONTAINER (ZERO JS PESADO)
     -------------------------------------------------------------------------- */
  const customCssVariables: React.CSSProperties = {
    // Design Tokens Nativos
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

    // Resposta contextual rápida e humanizada
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

  return (
    <div
      id={`biolink-${uuid_cliente}`}
      style={customCssVariables}
      className={`relative min-h-screen w-full flex flex-col items-center justify-start text-[var(--cor-texto)] font-sans antialiased selection:bg-[var(--cor-destaque)] selection:text-white pb-24 overflow-x-hidden ${className}`}
    >
      {/* --------------------------------------------------------------------------
          2. ESTILOS KEYFRAMES GPU-ACCELERATED INJETADOS
          -------------------------------------------------------------------------- */}
      <style>{`
        @keyframes biolinkMeshDrift {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate3d(6%, -4%, 0) scale(1.08) rotate(4deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }
        @keyframes biolinkPulseGlow {
          0%, 100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.04);
          }
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

      {/* --------------------------------------------------------------------------
          3. PLANO DE FUNDO CINEMATOGRÁFICO (GPU ACCELERATED)
          -------------------------------------------------------------------------- */}
      {tipo_fundo === "imagem_url" && imagemFundo ? (
        <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
          <img
            src={imagemFundo}
            alt=""
            className="w-full h-full object-cover object-center scale-105"
            loading="eager"
          />
          {/* Overlay de escurecimento + blur para legibilidade AAA */}
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
          {/* Orbe Gradiente 1 */}
          <div
            className="biolink-mesh-orb-1 absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] sm:w-[720px] h-[520px] sm:h-[720px] rounded-full opacity-60 blur-[100px] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${corDestaque} 0%, transparent 68%)`,
            }}
          />
          {/* Orbe Gradiente 2 */}
          <div
            className="biolink-mesh-orb-2 absolute top-1/3 -right-36 w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] rounded-full opacity-40 blur-[110px] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${corGrad2} 0%, transparent 70%)`,
            }}
          />
          {/* Gradiente de Profundidade Vertical */}
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
      <div className="relative w-full max-w-xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 flex flex-col items-center z-10">
        
        {/* --------------------------------------------------------------------------
            4. HEADER / CONTEÚDO DO PERFIL
            -------------------------------------------------------------------------- */}
        <header className="flex flex-col items-center text-center space-y-4 mb-8 w-full">
          {/* Avatar com Halo Luminoso e Anel de Destaque */}
          {conteudo_perfil.avatar_url && (
            <div className="relative group">
              <div
                className="biolink-glow-pulse absolute -inset-1.5 rounded-full blur-xl opacity-70 pointer-events-none transition-all duration-500 group-hover:opacity-100"
                style={{ backgroundColor: corDestaque }}
              />
              <div
                className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden p-1 shadow-2xl transition-transform duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${corDestaque}, rgba(255,255,255,0.2))`,
                }}
              >
                <img
                  src={conteudo_perfil.avatar_url}
                  alt={conteudo_perfil.titulo}
                  className="h-full w-full object-cover rounded-full bg-black/40"
                  loading="eager"
                />
              </div>
            </div>
          )}

          {/* Título & Subtítulo */}
          <div className="space-y-1.5 max-w-md">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
              style={{ color: corTexto }}
            >
              {conteudo_perfil.titulo}
            </h1>
            <p
              className="text-sm sm:text-base font-medium opacity-85 leading-relaxed"
              style={{ color: corTexto }}
            >
              {conteudo_perfil.subtitulo}
            </p>
            {conteudo_perfil.bio_curta && (
              <p
                className="text-xs sm:text-sm opacity-70 mt-2 font-normal leading-relaxed"
                style={{ color: corTexto }}
              >
                {conteudo_perfil.bio_curta}
              </p>
            )}
          </div>
        </header>

        {/* --------------------------------------------------------------------------
            5. MÁSCARAS DE ESTRUTURA: LISTA VERTICAL OU BENTO GRID
            -------------------------------------------------------------------------- */}
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
                  {/* Brilho sutil no hover */}
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
                {/* Indicador lateral para itens destacados */}
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

        {/* --------------------------------------------------------------------------
            6. MÓDULO DE INTEGRAÇÃO: AGENDA EMBED / IFRAME RESPONSIVO
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

            {/* Container Responsivo com Iframe Dinâmico */}
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
            7. MÓDULO DE INTEGRAÇÃO: TYPEBOT / ATENDENTE VIRTUAL IA
            -------------------------------------------------------------------------- */}
        {configuracoes_integracao.exibir_typebot && (
          <div className="w-full">
            {/* Card Chamada para Atendente Virtual */}
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
          8. MODAL DO TYPEBOT / ASSISTENTE IA COM CINEMATIC BACKDROP BLUR
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

  const corDestaque =
    tokensDesignRaw.estilo_botoes?.cor_destaque ||
    customTheme.primary ||
    "#6366f1";

  const corTexto =
    tokensDesignRaw.estilo_botoes?.cor_texto ||
    customTheme.text ||
    "#ffffff";

  const corGrad1 =
    tokensDesignRaw.fundo_valores?.cor_gradiente_1 ||
    customTheme.background ||
    "#0b0c10";

  const corGrad2 =
    tokensDesignRaw.fundo_valores?.cor_gradiente_2 ||
    "#1f2937";

  return {
    uuid_cliente: bio?.id || "usr_default",
    configuracoes_integracao: {
      exibir_agenda: Boolean(socialLinks.booking_enabled || bio?.bookingActive),
      agenda_endpoint_id: bio?.slug || "",
      exibir_typebot: Boolean(socialLinks.ai_chat_enabled),
      typebot_id: socialLinks.typebot_id || "atendente-default",
    },
    tokens_design: {
      layout_esqueleto: tokensDesignRaw.layout_esqueleto || "list_vertical_premium",
      tipo_fundo: tokensDesignRaw.tipo_fundo || (bio?.cover_url ? "imagem_url" : "mesh_gradient"),
      fundo_valores: {
        cor_gradiente_1: corGrad1,
        cor_gradiente_2: corGrad2,
        blur_sobreposicao: tokensDesignRaw.fundo_valores?.blur_sobreposicao || "8px",
        imagem_url: tokensDesignRaw.fundo_valores?.imagem_url || bio?.cover_url || "",
      },
      estilo_botoes: {
        cor_fundo_card: tokensDesignRaw.estilo_botoes?.cor_fundo_card || "rgba(255, 255, 255, 0.04)",
        cor_borda: tokensDesignRaw.estilo_botoes?.cor_borda || "rgba(255, 255, 255, 0.12)",
        cor_texto: corTexto,
        cor_destaque: corDestaque,
        raio_borda: tokensDesignRaw.estilo_botoes?.raio_borda || "16px",
      },
    },
    conteudo_perfil: {
      avatar_url: bio?.avatar_url || "",
      titulo: bio?.display_name || "Seu Nome",
      subtitulo: bio?.description || "Sua especialidade ou negócio",
      bio_curta: socialLinks.bio_curta || "",
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

