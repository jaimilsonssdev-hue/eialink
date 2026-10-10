import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Sparkles,
  ArrowLeft,
  Send,
  Paperclip,
  Share2,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Loader2,
  Scissors,
  User,
  Instagram,
  FileText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  processAgendaAiChat,
  saveAgendaToBioPage,
  type AgendaStudioData,
  type AgendaAiMessage,
  type AgendaServiceItem,
} from "@/modules/agenda/agendaAiService";

export const Route = createFileRoute("/_authenticated/agenda-studio")({
  component: AgendaStudioPage,
});

const DEFAULT_AGENDA: AgendaStudioData = {
  businessName: "Barbearia Dom navalha",
  niche: "barbearia",
  tagline: "Tradição, estilo e o cuidado que você merece",
  description: "Ambiente climatizado, cerveja gelada, sinuca e profissionais de alta precisão.",
  whatsapp: "5511999999999",
  address: "Av. dos Estados, 420 - Jardins",
  openingHours: "Segunda a Sábado das 09h às 20h",
  instagram: "@domnavalhabarber",
  themeStyle: "dark-barber",
  accentColor: "amber",
  professionals: [
    { id: "prof-1", name: "Lucas 'Navalha'", role: "Master Barber & Fade" },
    { id: "prof-2", name: "Matheus Silva", role: "Especialista em Barboterapia" },
  ],
  services: [
    {
      id: "srv-1",
      name: "Corte Degradê / Fade Master",
      description: "Corte na tesoura e máquina com degradê suave, acabamento no navalhete e lavagem inclusa.",
      durationMinutes: 40,
      price: 50.0,
      category: "Cabelo",
      badge: "Mais Pedido ⭐",
      popular: true,
    },
    {
      id: "srv-2",
      name: "Barboterapia Relaxante",
      description: "Toalha quente com óleos essenciais, massagem facial, alinhamento milimétrico na navalha e pós-barba refrescante.",
      durationMinutes: 35,
      price: 40.0,
      category: "Barba",
      badge: "Experiência VIP",
      popular: true,
    },
    {
      id: "srv-3",
      name: "Combo Completo (Cabelo + Barboterapia)",
      description: "O combo mais procurado da casa: renovação total com desconto especial e café/cerveja cortesia.",
      durationMinutes: 65,
      price: 80.0,
      category: "Combos",
      badge: "Melhor Custo-Benefício 🔥",
      popular: true,
    },
    {
      id: "srv-4",
      name: "Sobrancelha na Navalha",
      description: "Alinhamento e limpeza rápida com desenho natural.",
      durationMinutes: 15,
      price: 15.0,
      category: "Acabamento",
      popular: false,
    },
  ],
};

function AgendaStudioPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [agenda, setAgenda] = useState<AgendaStudioData>(DEFAULT_AGENDA);
  const [messages, setMessages] = useState<AgendaAiMessage[]>([
    {
      id: "msg-1",
      role: "assistant",
      content:
        "Agenda gerada! Diga quais serviços, valores ou horários ajustar, ou envie fotos da tabela de preços.",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; mimeType: string; dataBase64: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPageUrl, setSavedPageUrl] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<AgendaServiceItem | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Se veio parâmetro da prospecção ou ID de página salva
  useEffect(() => {
    if (searchParams?.page) {
      supabase
        .from("bio_pages")
        .select("id, slug, display_name, description, whatsapp, social_links")
        .eq("id", searchParams.page)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const rawSocial = (data.social_links as Record<string, any>) || {};
            if (rawSocial.agenda_data) {
              setAgenda(rawSocial.agenda_data);
              setSavedPageUrl(`/p/${data.slug}`);
            } else {
              setAgenda((prev) => ({
                ...prev,
                businessName: data.display_name || prev.businessName,
                whatsapp: data.whatsapp || prev.whatsapp,
                tagline: data.description || prev.tagline,
                address: rawSocial.address || prev.address,
              }));
              setSavedPageUrl(`/p/${data.slug}`);
            }
          }
        });
    } else if (searchParams?.name) {
      setAgenda((prev) => ({
        ...prev,
        businessName: searchParams.name,
        address: searchParams.address || prev.address,
        whatsapp: searchParams.whatsapp || prev.whatsapp,
        tagline: searchParams.niche ? `Especialistas em ${searchParams.niche}` : prev.tagline,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || "image/jpeg",
            dataBase64: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSendMessage(customText?: string) {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() && attachments.length === 0) return;

    const userMsg: AgendaAiMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setAttachments([]);
    setIsProcessing(true);

    try {
      const result = await processAgendaAiChat(
        [...messages, userMsg],
        textToSend,
        userMsg.attachments,
        agenda,
      );

      const assistantMsg: AgendaAiMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: result.replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (result.updatedAgenda) {
        setAgenda(result.updatedAgenda);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Tive uma oscilação na resposta da IA: ${err?.message || "Tente novamente"}. Pode clicar para reenviar!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSavePage() {
    setIsSaving(true);
    try {
      const res = await saveAgendaToBioPage(agenda, searchParams?.page || undefined);
      setSavedPageUrl(res.publicUrl);
    } catch (err: any) {
      alert(`Erro ao publicar agenda: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Header Superior */}
      <header className="h-16 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Agenda Studio <span className="text-amber-400">IA</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/20">
                  Beleza & Saúde
                </Badge>
              </h1>
              <p className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                {agenda.businessName}
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Visualização */}
        {/* Mobile Toggle: Chat vs Prévia */}
        <div className="flex lg:hidden items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              mobileTab === "chat"
                ? "bg-amber-500 text-black font-bold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              mobileTab === "preview"
                ? "bg-amber-500 text-black font-bold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Ver Prévia</span>
          </button>
        </div>

        {/* Desktop ViewMode: Mobile frame vs Desktop full */}
        <div className="hidden lg:flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              viewMode === "mobile"
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              viewMode === "desktop"
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
        </div>

        {/* Ações Direitas */}
        <div className="flex items-center gap-2">
          {savedPageUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs hidden sm:inline-flex"
            >
              <a href={savedPageUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Ver Online
              </a>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSavePage}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Publicar
          </Button>
        </div>
      </header>

      {/* Conteúdo Dividido */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Painel Esquerdo: Chat IA */}
        <div
          className={`w-full lg:w-[400px] xl:w-[440px] shrink-0 border-r border-white/10 flex flex-col bg-zinc-950/80 backdrop-blur-xl h-full z-10 ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="p-3 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" /> Editor com IA
            </span>
            {/* Atalho mobile para ver prévia */}
            <button
              onClick={() => setMobileTab("preview")}
              className="lg:hidden text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Ver Prévia →
            </button>
          </div>

          {/* Histórico */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-amber-600 text-white rounded-br-xs"
                      : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-bl-xs shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {m.attachments.map((att, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-zinc-300"
                        >
                          <Paperclip className="h-2.5 w-2.5" /> {att.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-amber-400 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Atualizando agenda...</span>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Atalhos Rápidos */}
          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage("Crie um tratamento facial com toalha quente e massagem relaxante.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition-all"
            >
              💆‍♂️ Barboterapia VIP
            </button>
            <button
              onClick={() => handleSendMessage("Adicione um combo com corte de cabelo e sobrancelha com preço promocional.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition-all"
            >
              ✂️ Combo Cabelo + Sobrancelha
            </button>
            <button
              onClick={() => handleSendMessage("Adapte os serviços para um Salão / Clínica de Estética feminina moderno.")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition-all"
            >
              ✨ Estética & Salão
            </button>
          </div>

          {/* Input com Upload */}
          <div className="p-3 border-t border-white/10 bg-zinc-900/60">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-colors border border-white/5">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ajuste serviços ou envie foto da tabela de preços..."
                className="bg-zinc-950 border-white/10 text-xs h-10 rounded-xl"
              />

              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={isProcessing || (!inputMessage.trim() && attachments.length === 0)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-10 px-3.5 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Painel Direito: A Agenda Interativa ao Vivo */}
        <div
          className={`flex-1 min-w-0 bg-zinc-950 overflow-y-auto h-full p-2 sm:p-4 lg:p-6 flex justify-center items-start ${
            mobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div
            className={`transition-all duration-300 w-full ${
              viewMode === "mobile"
                ? "max-w-[420px] rounded-[36px] border-[6px] border-zinc-800 shadow-2xl bg-zinc-900 overflow-hidden"
                : "max-w-4xl rounded-2xl border border-white/10 shadow-2xl bg-zinc-900 overflow-hidden"
            }`}
          >
            {/* Header do Espaço */}
            <div className="relative bg-gradient-to-b from-amber-950/60 to-zinc-900 p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-amber-500 text-black mb-2 text-[10px] font-bold tracking-wider uppercase">
                    Agendamento Aberto 🗓️
                  </Badge>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    {agenda.businessName}
                  </h2>
                  <p className="text-xs text-amber-200/90 mt-1 font-medium">
                    {agenda.tagline}
                  </p>
                </div>
              </div>

              {/* Informações de Local e Horário */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300">
                <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                  <Clock className="h-3 w-3 text-amber-400" />
                  {agenda.openingHours}
                </span>
                {agenda.address && (
                  <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                    <MapPin className="h-3 w-3 text-amber-400" />
                    {agenda.address}
                  </span>
                )}
                {agenda.instagram && (
                  <span className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-white/5">
                    <Instagram className="h-3 w-3 text-amber-400" />
                    {agenda.instagram}
                  </span>
                )}
              </div>
            </div>

            {/* Profissionais Disponíveis */}
            {agenda.professionals && agenda.professionals.length > 0 && (
              <div className="px-5 py-3 border-b border-white/5 bg-zinc-950/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Profissionais Disponíveis
                </span>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                  {agenda.professionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-white/10"
                    >
                      <div className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-400 grid place-items-center font-bold text-xs">
                        {prof.name.slice(0, 1)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{prof.name}</span>
                        <span className="text-[10px] text-zinc-400 block">{prof.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Serviços */}
            <div className="p-4 sm:p-5 space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Escolha o Serviço Desejado
              </span>

              {agenda.services.map((item) => {
                const isSelected = selectedService?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedService(item)}
                    className={`cursor-pointer group bg-zinc-950/80 border rounded-2xl p-4 transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                        : "border-white/5 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-amber-400 font-black text-sm">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {item.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    <button
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                          : "bg-zinc-800 text-zinc-300 group-hover:bg-amber-500 group-hover:text-black"
                      }`}
                    >
                      {isSelected ? "Selecionado ✓" : "Agendar"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Rodapé de Ação / Confirmar Agendamento no WhatsApp */}
            {selectedService && (
              <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md p-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Serviço Selecionado:</span>
                  <span className="text-sm font-bold text-white truncate max-w-[180px] block">
                    {selectedService.name}
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    R$ {selectedService.price.toFixed(2).replace(".", ",")} • {selectedService.durationMinutes} min
                  </span>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  <a
                    href={`https://wa.me/${agenda.whatsapp}?text=${encodeURIComponent(
                      `Olá! Gostaria de agendar um horário para:\n• ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})\n\nQuais horários disponíveis vocês têm?`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Agendar no WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão Flutuante Mobile: Voltar ao Chat quando estiver na Prévia */}
      {mobileTab === "preview" && (
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-2xl border border-amber-300/40 active:scale-95 transition-all"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Voltar ao Chat IA</span>
        </button>
      )}
    </div>
  );
}

