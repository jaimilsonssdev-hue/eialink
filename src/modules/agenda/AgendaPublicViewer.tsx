import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  User,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Scissors,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgendaData, AgendaServiceItem, AgendaProfessional } from "./agendaAiService";
import { DemoConversionBanner } from "@/components/public/DemoConversionBanner";

interface AgendaPublicViewerProps {
  agenda: AgendaData;
  companyName: string;
  isDemo?: boolean;
}

export function AgendaPublicViewer({
  agenda,
  companyName,
  isDemo = false,
}: AgendaPublicViewerProps) {
  const [selectedService, setSelectedService] = useState<AgendaServiceItem | null>(
    agenda.services[0] || null
  );
  const [selectedPro, setSelectedPro] = useState<AgendaProfessional | null>(
    agenda.professionals[0] || null
  );
  const [selectedDate, setSelectedDate] = useState<string>("Hoje");
  const [selectedTime, setSelectedTime] = useState<string>("14:00");
  const [clientName, setClientName] = useState<string>("");

  const dates = ["Hoje", "Amanhã", "Quinta", "Sexta", "Sábado"];
  const times = ["09:00", "10:30", "13:00", "14:00", "15:30", "17:00", "18:30"];

  function generateWhatsappBookingUrl(): string {
    const rawDigits = (agenda.whatsapp || "").replace(/\D/g, "");
    let cleanPhone = rawDigits;
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith("55")) {
      cleanPhone = `55${cleanPhone}`;
    }

    const msg = [
      `📅 *NOVO AGENDAMENTO - ${agenda.businessName.toUpperCase()}*`,
      `---------------------------------`,
      `*Cliente:* ${clientName.trim() || "Cliente do Site"}`,
      `*Serviço:* ${selectedService?.name || "Não especificado"} (R$ ${(selectedService?.price || 0).toFixed(2).replace(".", ",")})`,
      `*Profissional:* ${selectedPro?.name || "Qualquer disponível"}`,
      `*Data:* ${selectedDate}`,
      `*Horário:* ${selectedTime}`,
      `---------------------------------`,
      `_Gostaria de confirmar a disponibilidade para esse horário!_`,
    ].join("\n");

    if (!cleanPhone) {
      return "#";
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }

  // Configurações visuais dinâmicas
  const effect = agenda.visualEffect || "glassmorphism";
  const btnColor = agenda.buttonColor || "#8b5cf6";
  const customFont = agenda.customFont;
  const features = {
    selectPro: agenda.features?.selectPro ?? true,
    selectDate: agenda.features?.selectDate ?? true,
    whatsappBooking: agenda.features?.whatsappBooking ?? true,
    mapLocation: agenda.features?.mapLocation ?? true,
  };

  const cardEffectClass =
    effect === "neobrutalism"
      ? "bg-white text-zinc-950 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none"
      : effect === "glassmorphism"
      ? "backdrop-blur-xl bg-white/[0.06] border border-white/15 shadow-xl shadow-black/30 rounded-2xl"
      : effect === "elegante"
      ? "bg-zinc-950/90 border border-amber-500/30 text-amber-50 shadow-xl shadow-amber-950/20 rounded-2xl"
      : effect === "parallax"
      ? "bg-zinc-900/90 border border-white/10 shadow-2xl rounded-2xl hover:scale-[1.01] transition-transform duration-300"
      : "bg-zinc-900/80 border border-white/10 rounded-2xl shadow-sm";

  return (
    <div
      className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-purple-500 selection:text-white"
      style={{ fontFamily: customFont ? `"${customFont}", sans-serif` : undefined }}
    >
      {isDemo && <DemoConversionBanner companyName={companyName} />}

      {/* Header do Estabelecimento */}
      <header
        className="relative bg-gradient-to-b from-purple-950/60 via-zinc-900 to-zinc-950 border-b border-white/10 pt-8 pb-6 px-4 sm:px-6 overflow-hidden"
        style={
          agenda.bannerImage
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(9,9,11,0.85), rgba(9,9,11,0.95)), url(${agenda.bannerImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-bold tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Agenda Aberta
            </span>
            <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Agendamento Inteligente
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {agenda.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
            {agenda.tagline || agenda.description}
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
            {agenda.openingHours && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                {agenda.openingHours}
              </span>
            )}
            {features.mapLocation && agenda.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agenda.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white"
                title="Abrir no Google Maps"
              >
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
                <span>{agenda.address}</span>
                <ExternalLink className="h-3 w-3 text-zinc-400 ml-0.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Seção Principal */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Escolha de Profissional (Respeita feature toggle) */}
        {features.selectPro && agenda.professionals && agenda.professionals.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-purple-400" /> Escolha o Profissional
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {agenda.professionals.map((pro) => {
                const isSelected = selectedPro?.id === pro.id;
                return (
                  <button
                    key={pro.id}
                    onClick={() => setSelectedPro(pro)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-600/10 scale-[1.02]"
                        : "bg-zinc-900/80 border-white/5 hover:border-white/20 text-zinc-300"
                    }`}
                  >
                    {pro.avatarUrl ? (
                      <img
                        src={pro.avatarUrl}
                        alt={pro.name}
                        className="h-10 w-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-purple-500/20 text-purple-300 grid place-items-center font-bold shrink-0">
                        {pro.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{pro.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{pro.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Catálogo de Serviços */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5 text-purple-400" /> Escolha o Serviço
          </h3>
          <div className="space-y-2.5">
            {agenda.services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`cursor-pointer p-4 transition-all flex items-center justify-between gap-4 ${cardEffectClass} ${
                    isSelected ? "ring-2 ring-purple-500/80 shadow-md scale-[1.005]" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{service.name}</h4>
                      {service.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{service.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-black text-purple-400">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" /> {service.durationMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`h-6 w-6 rounded-full border grid place-items-center transition-colors ${
                        isSelected
                          ? "text-white"
                          : "border-white/20 text-transparent"
                      }`}
                      style={isSelected ? { backgroundColor: btnColor, borderColor: btnColor } : undefined}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Seleção de Dia & Horário (Respeita feature toggle) */}
        {features.selectDate && (
          <section className={`space-y-3 p-4 sm:p-5 ${cardEffectClass}`}>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-400" /> Escolha o Dia & Horário
            </h3>

            {/* Dias */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {dates.map((d) => {
                const active = selectedDate === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "text-white shadow-md shadow-purple-600/25"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                    style={active ? { backgroundColor: btnColor } : undefined}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Horários */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2">
              {times.map((t) => {
                const active = selectedTime === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "text-white shadow-md shadow-purple-600/25"
                        : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800"
                    }`}
                    style={active ? { backgroundColor: btnColor } : undefined}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Nome do Cliente */}
        <section className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Seu Nome (Para a reserva)
          </label>
          <input
            type="text"
            placeholder="Digite seu nome completo"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </section>
      </main>

      {/* Barra Inferior Fixa de Confirmação */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-3.5 sm:p-4 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-400">Resumo do Agendamento</div>
            <div className="text-sm font-black text-white">
              {selectedService?.name || "Serviço"} • {selectedDate} às {selectedTime}
            </div>
            <div className="text-xs text-purple-400 font-bold">
              R$ {(selectedService?.price || 0).toFixed(2).replace(".", ",")}
            </div>
          </div>

          {features.whatsappBooking && (
            <Button
              asChild
              className="text-white font-bold px-5 h-11 rounded-2xl shadow-lg text-xs sm:text-sm flex items-center gap-2"
              style={{ backgroundColor: btnColor }}
            >
              <a
                href={generateWhatsappBookingUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  const url = generateWhatsappBookingUrl();
                  if (url === "#") {
                    e.preventDefault();
                    alert("O número de WhatsApp deste estabelecimento ainda não foi configurado.");
                  }
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Confirmar no WhatsApp</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

