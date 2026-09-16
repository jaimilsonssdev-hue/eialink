import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import type { CatalogItem } from "@/modules/products/types";
import { whatsappUrl } from "@/lib/whatsapp";

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text?: string;
  timestamp: string;
  options?: Array<{ label: string; action: string; icon?: string; payload?: string }>;
  type?:
    | "normal"
    | "service_cards"
    | "budget_step_name"
    | "budget_step_city"
    | "budget_step_description"
    | "budget_step_photo"
    | "budget_step_phone"
    | "budget_summary"
    | "whatsapp_cards"
    | "info_card";
  data?: any;
}

export interface BudgetFormData {
  nome?: string;
  servico?: string;
  cidade?: string;
  descricao?: string;
  fotoUrl?: string;
  fotoNome?: string;
  telefone?: string;
}

export interface AiAssistantChatProps {
  bio: {
    display_name: string;
    description?: string | null;
    avatar_url?: string | null;
    whatsapp?: string | null;
    whatsapp_message?: string | null;
    social_links?: any;
    theme?: string;
  };
  products?: CatalogItem[];
  isFullPage?: boolean;
  onClose?: () => void;
  onTrack?: (event: string, meta?: any) => void;
}

function getTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

export function AiAssistantChat({
  bio,
  products = [],
  isFullPage = false,
  onClose,
  onTrack,
}: AiAssistantChatProps) {
  const whats = bio.whatsapp?.replace(/\D/g, "");
  const socialData = (bio.social_links as Record<string, any>) || {};
  const address = socialData.address;
  const openingHours = socialData.opening_hours;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [budgetData, setBudgetData] = useState<BudgetFormData>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rolagem suave para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Mensagem inicial de boas-vindas
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      const welcomeMessage: ChatMessage = {
        id: "welcome-1",
        sender: "bot",
        text: `Olá! Bem-vindo(a) ao atendimento oficial de *${bio.display_name}*! 👋✨\n\nSou o assistente virtual da empresa. Como posso te ajudar hoje? Escolha uma opção abaixo:`,
        timestamp: getTimeString(),
        options: [
          { label: "Ver Serviços", action: "servicos", icon: "🎨" },
          { label: "Pedir Orçamento", action: "orcamento", icon: "💰" },
          { label: "Endereço e Horários", action: "localizacao", icon: "📍" },
          { label: "Falar no WhatsApp", action: "whatsapp_direto", icon: "📱" },
        ],
      };
      setMessages([welcomeMessage]);
    }, 600);

    return () => clearTimeout(timer);
  }, [bio.display_name]);

  // Enviar resposta simulando o bot
  const botReply = (
    text: string,
    options?: ChatMessage["options"],
    type: ChatMessage["type"] = "normal",
    data?: any,
    delayMs = 500
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text,
          timestamp: getTimeString(),
          options,
          type,
          data,
        },
      ]);
    }, delayMs);
  };

  // Processar cliques em opções rápidas
  const handleOptionClick = (option: { label: string; action: string; payload?: string }) => {
    // Adiciona a escolha do usuário na conversa
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: option.label,
      timestamp: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    onTrack?.("chat_option_click", { action: option.action });

    if (option.action === "servicos") {
      const activeProducts = products.filter((p) => p.active);
      if (activeProducts.length > 0) {
        botReply(
          "Aqui estão nossos principais serviços e opções disponíveis. Você pode tocar em um deles para solicitar atendimento:",
          undefined,
          "service_cards",
          { items: activeProducts }
        );
      } else {
        botReply(
          `Trabalhamos com serviços especializados em *${bio.display_name}* com total dedicação e garantia de qualidade. Deseja solicitar um orçamento personalizado?`,
          [
            { label: "Sim, pedir orçamento", action: "orcamento", icon: "💰" },
            { label: "Falar no WhatsApp", action: "whatsapp_direto", icon: "📱" },
          ]
        );
      }
    } else if (option.action.startsWith("solicitar_servico_")) {
      const servicoNome = option.payload || "Serviço Selecionado";
      setBudgetData((prev) => ({ ...prev, servico: servicoNome }));
      botReply(
        `Ótima escolha! Vamos dar andamento ao serviço *${servicoNome}*. Para iniciarmos seu atendimento, qual é o seu **nome completo**?`,
        undefined,
        "budget_step_name"
      );
      setActiveStep("name");
    } else if (option.action === "orcamento") {
      botReply(
        "Perfeito! Vou te fazer algumas perguntas rápidas para montar seu orçamento sem compromisso. Para começar, qual é o seu **nome completo**?",
        undefined,
        "budget_step_name"
      );
      setActiveStep("name");
    } else if (option.action === "localizacao") {
      let infoText = `📍 *Localização e Funcionamento:*\n\n`;
      if (address) infoText += `🏠 *Endereço:* ${address}\n`;
      if (openingHours) infoText += `⏰ *Horário:* ${openingHours}\n`;
      if (!address && !openingHours) {
        infoText += `Nosso atendimento está disponível através do WhatsApp oficial.`;
      }
      botReply(infoText, [
        { label: "Pedir Orçamento", action: "orcamento", icon: "💰" },
        { label: "Falar no WhatsApp", action: "whatsapp_direto", icon: "📱" },
      ], "info_card", { address, openingHours });
    } else if (option.action === "whatsapp_direto") {
      botReply(
        "Clique no botão abaixo para conversar agora mesmo com nossa equipe no WhatsApp:",
        undefined,
        "whatsapp_cards"
      );
    } else if (option.action === "reiniciar") {
      botReply(
        "Como mais posso te ajudar?",
        [
          { label: "Ver Serviços", action: "servicos", icon: "🎨" },
          { label: "Pedir Orçamento", action: "orcamento", icon: "💰" },
          { label: "Endereço e Horários", action: "localizacao", icon: "📍" },
          { label: "Falar no WhatsApp", action: "whatsapp_direto", icon: "📱" },
        ]
      );
    }
  };

  // Submissão das etapas do orçamento
  const handleStepSubmit = (field: keyof BudgetFormData, value: string, extra?: any) => {
    const updated = { ...budgetData, [field]: value, ...(extra || {}) };
    setBudgetData(updated);

    // Adiciona resposta do usuário na timeline
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: extra?.fotoNome ? `📷 ${extra.fotoNome}` : value,
        timestamp: getTimeString(),
      },
    ]);

    if (field === "nome") {
      setActiveStep("city");
      botReply(
        `Prazer em te conhecer, ${value}! 🤝\nEm qual **cidade ou bairro** será realizado o serviço?`,
        undefined,
        "budget_step_city"
      );
    } else if (field === "cidade") {
      setActiveStep("description");
      botReply(
        `Excelente! Conte em poucas palavras o que você precisa ou qual o detalhe do serviço:`,
        undefined,
        "budget_step_description"
      );
    } else if (field === "descricao") {
      setActiveStep("photo");
      botReply(
        `Anotado! Deseja anexar uma foto do local ou veículo? Isso ajuda nossa equipe a avaliar os detalhes com muito mais precisão. Se não tiver, pode pular!`,
        undefined,
        "budget_step_photo"
      );
    } else if (field === "fotoUrl") {
      setActiveStep("phone");
      botReply(
        `Foto recebida com sucesso! 📸\nPor fim, qual o seu número de **WhatsApp com DDD** para contato?`,
        undefined,
        "budget_step_phone"
      );
    } else if (field === "telefone") {
      setActiveStep("summary");
      botReply(
        `Tudo pronto! Confira o resumo do seu pedido abaixo antes de enviar para nossa equipe:`,
        undefined,
        "budget_summary",
        { summary: updated }
      );
    }
  };

  // Pular envio de foto
  const handleSkipPhoto = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: "Pulei o envio de foto",
        timestamp: getTimeString(),
      },
    ]);
    setActiveStep("phone");
    botReply(
      `Sem problemas! Para finalizar, qual o seu número de **WhatsApp com DDD** para retorno?`,
      undefined,
      "budget_step_phone"
    );
  };

  // Confirmação final do orçamento e disparo para o WhatsApp
  const handleConfirmBudget = () => {
    const nome = budgetData.nome?.trim() || "Não informado";
    const servico = budgetData.servico?.trim() || "Orçamento Geral";
    const cidade = budgetData.cidade?.trim() || "Não informado";
    const tel = budgetData.telefone?.trim() || "Não informado";
    const desc = budgetData.descricao?.trim() || "Solicitação de orçamento pelo site";

    const formattedMessage = `*SOLICITAÇÃO DE ORÇAMENTO — ${bio.display_name.toUpperCase()}* 📋✨

Olá equipe! Finalizei meu atendimento pelo site e gostaria de solicitar um orçamento formal:

👤 *Cliente:* ${nome}
🛠️ *Serviço:* ${servico}
📍 *Local / Cidade:* ${cidade}
📱 *WhatsApp:* ${tel}

📝 *Descrição / Detalhes:*
"${desc}"

Poderiam me informar valores e disponibilidade para atendimento? Aguardo retorno, obrigado! 🤝`;

    if (whats) {
      const url = whatsappUrl(whats, formattedMessage);
      window.open(url, "_blank", "noopener,noreferrer");
    }

    onTrack?.("budget_completed", { budgetData });

    botReply(
      `🎉 Seu orçamento foi formatado com sucesso! Se a conversa no WhatsApp não tiver aberto automaticamente, toque no botão abaixo:`,
      [
        { label: "Abrir no WhatsApp", action: "whatsapp_direto", icon: "📱" },
        { label: "Voltar ao início", action: "reiniciar", icon: "🔄" },
      ],
      "whatsapp_cards",
      { customText: formattedMessage }
    );
  };

  // Envio de texto livre digitado pelo visitante com fallback inteligente
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text) return;

    setUserInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: getTimeString(),
      },
    ]);

    const lower = text.toLowerCase();

    // Fallbacks inteligentes por palavras-chave
    if (lower.includes("preço") || lower.includes("valor") || lower.includes("quanto custa") || lower.includes("tabela")) {
      botReply(
        "Nossos valores variam de acordo com o serviço desejado. Você pode solicitar um orçamento rápido e sem compromisso clicando no botão abaixo:",
        [
          { label: "Pedir Orçamento Agora", action: "orcamento", icon: "💰" },
          { label: "Ver Lista de Serviços", action: "servicos", icon: "🎨" },
        ]
      );
    } else if (lower.includes("onde") || lower.includes("endereço") || lower.includes("rua") || lower.includes("bairro") || lower.includes("local")) {
      handleOptionClick({ label: "Endereço e Localização", action: "localizacao" });
    } else if (lower.includes("horário") || lower.includes("hora") || lower.includes("funciona") || lower.includes("aberto") || lower.includes("fecha")) {
      handleOptionClick({ label: "Horários de Atendimento", action: "localizacao" });
    } else if (lower.includes("orçamento") || lower.includes("agendar") || lower.includes("marcar")) {
      handleOptionClick({ label: "Solicitar Orçamento", action: "orcamento" });
    } else {
      botReply(
        "Entendi sua mensagem! Para agilizar seu atendimento, como prefere continuar?",
        [
          { label: "Pedir Orçamento", action: "orcamento", icon: "💰" },
          { label: "Ver Serviços", action: "servicos", icon: "🎨" },
          { label: "Conversar no WhatsApp", action: "whatsapp_direto", icon: "📱" },
        ]
      );
    }
  };

  return (
    <div
      className={`flex flex-col bg-background text-foreground ${
        isFullPage
          ? "min-h-screen w-full"
          : "fixed inset-0 z-50 sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[420px] sm:h-[680px] sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      }`}
    >
      {/* HEADER DO CHAT ESTILO MARROOIA */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {bio.avatar_url ? (
              <img
                src={bio.avatar_url}
                alt={bio.display_name}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/30">
                {bio.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full shadow-xs" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold truncate leading-tight">{bio.display_name}</h2>
              <span className="shrink-0 text-sky-500" title="Verificado Oficial">
                <BadgeCheck className="w-4 h-4 fill-sky-500 text-white" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              {isTyping ? (
                <span className="text-primary font-medium animate-pulse">digitando...</span>
              ) : (
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Atendimento online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {whats && (
            <a
              href={whatsappUrl(whats, bio.whatsapp_message || "Olá! Vim pelo atendimento do site.")}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full hover:bg-muted text-emerald-500 transition-colors"
              title="Abrir no WhatsApp"
              aria-label="Abrir no WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {!isFullPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              aria-label="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* ÁREA DE MENSAGENS COM ROLAGEM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-xs"
                    : "bg-card border border-border text-foreground rounded-bl-xs"
                }`}
              >
                {msg.text}

                {/* CARDS DE SERVIÇO EMBUTIDOS NO CHAT */}
                {msg.type === "service_cards" && msg.data?.items && (
                  <div className="mt-3 space-y-2">
                    {msg.data.items.slice(0, 6).map((item: CatalogItem) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-background/80 border border-border flex items-center justify-between gap-3 text-foreground"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{item.name}</p>
                          {item.price !== null && (
                            <p className="text-[11px] font-semibold text-primary">
                              R$ {item.price.toFixed(2).replace(".", ",")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOptionClick({
                              label: `Quero: ${item.name}`,
                              action: `solicitar_servico_${item.id}`,
                              payload: item.name,
                            })
                          }
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-colors cursor-pointer"
                        >
                          Solicitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* FORMULÁRIO DE ETAPA: NOME */}
                {msg.type === "budget_step_name" && activeStep === "name" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem("val") as HTMLInputElement).value;
                      if (val.trim()) handleStepSubmit("nome", val.trim());
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      name="val"
                      type="text"
                      required
                      placeholder="Seu nome completo..."
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:brightness-110"
                    >
                      Avançar
                    </button>
                  </form>
                )}

                {/* FORMULÁRIO DE ETAPA: CIDADE */}
                {msg.type === "budget_step_city" && activeStep === "city" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem("val") as HTMLInputElement).value;
                      if (val.trim()) handleStepSubmit("cidade", val.trim());
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      name="val"
                      type="text"
                      required
                      placeholder="Ex: Ribeirão Cascalheira, Centro..."
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:brightness-110"
                    >
                      Avançar
                    </button>
                  </form>
                )}

                {/* FORMULÁRIO DE ETAPA: DESCRIÇÃO */}
                {msg.type === "budget_step_description" && activeStep === "description" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem("val") as HTMLTextAreaElement).value;
                      if (val.trim()) handleStepSubmit("descricao", val.trim());
                    }}
                    className="mt-3 space-y-2"
                  >
                    <textarea
                      name="val"
                      required
                      rows={3}
                      placeholder="Ex: Preciso de lavagem completa com polimento..."
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary resize-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:brightness-110"
                    >
                      Avançar
                    </button>
                  </form>
                )}

                {/* FORMULÁRIO DE ETAPA: FOTO */}
                {msg.type === "budget_step_photo" && activeStep === "photo" && (
                  <div className="mt-3 space-y-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              handleStepSubmit("fotoUrl", reader.result, {
                                fotoNome: file.name,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Anexar Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSkipPhoto}
                        className="py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold cursor-pointer"
                      >
                        Pular
                      </button>
                    </div>
                  </div>
                )}

                {/* FORMULÁRIO DE ETAPA: TELEFONE */}
                {msg.type === "budget_step_phone" && activeStep === "phone" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem("val") as HTMLInputElement).value;
                      if (val.trim()) handleStepSubmit("telefone", val.trim());
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      name="val"
                      type="tel"
                      required
                      placeholder="Ex: (63) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:brightness-110"
                    >
                      Finalizar Orçamento
                    </button>
                  </form>
                )}

                {/* CARD RESUMO DE ORÇAMENTO */}
                {msg.type === "budget_summary" && msg.data?.summary && (
                  <div className="mt-3 p-3.5 rounded-xl bg-background border border-border text-foreground space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border font-bold">
                      <span className="text-primary">📋 Resumo do Orçamento</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Pronto
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <span className="text-muted-foreground">Nome:</span>{" "}
                        <b>{msg.data.summary.nome || "Não informado"}</b>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Serviço:</span>{" "}
                        <b>{msg.data.summary.servico || "Geral"}</b>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Local:</span>{" "}
                        <b>{msg.data.summary.cidade || "Não informado"}</b>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Telefone:</span>{" "}
                        <b>{msg.data.summary.telefone || "Não informado"}</b>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Detalhes:</span>{" "}
                        <span>{msg.data.summary.descricao || "Sem detalhes"}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmBudget}
                      className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Abrir WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* CARDS DE WHATSAPP DIRETO */}
                {msg.type === "whatsapp_cards" && whats && (
                  <div className="mt-3">
                    <a
                      href={whatsappUrl(
                        whats,
                        msg.data?.customText || bio.whatsapp_message || "Olá! Vim pelo site."
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-98"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Falar no WhatsApp Oficial</span>
                    </a>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 text-right ${
                    isUser ? "text-primary-foreground/75" : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* OPÇÕES RÁPIDAS (CHIPS) */}
              {!isUser && msg.options && msg.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionClick(opt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card hover:bg-accent border border-border hover:border-primary/50 text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      {opt.icon && <span>{opt.icon}</span>}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* INDICADOR DE DIGITAÇÃO */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-card border border-border text-muted-foreground px-3.5 py-2.5 rounded-2xl rounded-bl-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-primary/30 animate-bounce" />
            <span className="text-xs ml-1 font-medium">digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* BARRA DE ENTRADA INFERIOR */}
      <form
        onSubmit={handleSendMessage}
        className="sticky bottom-0 z-30 p-3 bg-card/95 backdrop-blur-xl border-t border-border flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Digite sua mensagem ou dúvida..."
          className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-xs focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!userInput.trim()}
          className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition-all cursor-pointer shrink-0"
          aria-label="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

