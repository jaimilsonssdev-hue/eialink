import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Coffee,
  Ban,
  ExternalLink,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageService } from "@/modules/page/services/PageService";
import { BookingService } from "@/modules/booking/BookingService";
import type {
  Appointment,
  BookingAvailability,
  BookingService as Service,
} from "@/modules/booking/types";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { UpgradePrompt } from "@/modules/billing/components/UpgradePrompt";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
  head: () => ({ meta: [{ title: "Agenda — EIA Link" }] }),
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function AgendaPage() {
  const access = usePlanAccess();
  const client = useQueryClient();
  const pages = useQuery({
    queryKey: ["owned-bio-pages"],
    queryFn: () => PageService.listOwnedPages(),
  });
  const [pageId, setPageId] = useState("");
  const [tab, setTab] = useState<"setup" | "bookings">("setup");
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [active, setActive] = useState(false);
  const [notice, setNotice] = useState(2);
  const [ahead, setAhead] = useState(60);
  const [saving, setSaving] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<
    { slot_start: string; slot_end: string }[]
  >([]);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [loadingReschedule, setLoadingReschedule] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [blockingModalOpen, setBlockingModalOpen] = useState(false);
  const [blockingDate, setBlockingDate] = useState("");
  const [blockingAllDay, setBlockingAllDay] = useState(true);
  const [blockingStartTime, setBlockingStartTime] = useState("08:00");
  const [blockingEndTime, setBlockingEndTime] = useState("18:00");
  const [blockingReason, setBlockingReason] = useState("Folga programada");
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    if (!pageId && pages.data?.[0]) setPageId(pages.data[0].id);
  }, [pageId, pages.data]);
  const workspace = useQuery({
    queryKey: ["booking-workspace", pageId],
    enabled: Boolean(pageId && access.data?.isPro),
    queryFn: async () => {
      const current = await BookingService.getWorkspace(pageId);
      return current.settings ? current : BookingService.initialize(pageId);
    },
  });
  const appointments = useQuery({
    queryKey: ["appointments", pageId],
    enabled: Boolean(pageId && access.data?.isPro),
    queryFn: () => BookingService.listAppointments(pageId),
  });

  useEffect(() => {
    if (!workspace.data) return;
    setServices(workspace.data.services);
    setAvailability(workspace.data.availability);
    setActive(Boolean(workspace.data.settings?.active));
    setNotice(workspace.data.settings?.min_notice_hours ?? 2);
    setAhead(workspace.data.settings?.max_days_ahead ?? 60);
  }, [workspace.data]);

  const page = useMemo(() => pages.data?.find((item) => item.id === pageId), [pageId, pages.data]);

  function applyBusinessHours() {
    setAvailability((current) => {
      return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
        const isWeekday = weekday >= 1 && weekday <= 5;
        const existing = current.find((d) => d.weekday === weekday);
        return {
          id: existing?.id || `avail-${weekday}`,
          bio_page_id: pageId,
          weekday,
          start_time: "08:00",
          end_time: "18:00",
          active: isWeekday,
        };
      });
    });
    toast.success("Horário comercial aplicado (Seg a Sex das 08:00 às 18:00).");
  }

  function addService() {
    setServices((current) => [
      ...current,
      {
        id: `draft-${crypto.randomUUID()}`,
        bio_page_id: pageId,
        name: "",
        description: null,
        duration_minutes: 60,
        price: null,
        active: true,
        position: current.length,
      },
    ]);
  }
  function updateService(id: string, patch: Partial<Service>) {
    setServices((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  function updateDay(weekday: number, patch: Partial<BookingAvailability>) {
    setAvailability((current) => {
      const found = current.find((day) => day.weekday === weekday);
      if (found)
        return current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day));
      return [
        ...current,
        {
          id: `draft-${weekday}`,
          bio_page_id: pageId,
          weekday,
          start_time: "09:00",
          end_time: "18:00",
          active: false,
          ...patch,
        },
      ];
    });
  }
  async function save() {
    if (!services.length || services.some((item) => item.name.trim().length < 2)) {
      toast.error("Adicione pelo menos um serviço com nome.");
      return;
    }
    if (active && !availability.some((day) => day.active)) {
      toast.error("Escolha pelo menos um dia de atendimento.");
      return;
    }
    setSaving(true);
    try {
      await BookingService.saveServices(pageId, services);
      await BookingService.saveAvailability(pageId, availability);
      await BookingService.saveSettings(pageId, {
        active,
        min_notice_hours: notice,
        max_days_ahead: ahead,
      });
      await client.invalidateQueries({ queryKey: ["booking-workspace", pageId] });
      toast.success("Agenda salva e atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(id: string, status: "completed" | "cancelled") {
    await BookingService.updateAppointment(id, status);
    await client.invalidateQueries({ queryKey: ["appointments", pageId] });
    toast.success(status === "completed" ? "Atendimento concluído." : "Agendamento cancelado.");
  }

  function appointmentDate(item: Appointment) {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(item.start_at));
  }

  function whatsappMessage(
    item: Appointment,
    kind: "confirmation" | "reminder" | "reschedule" | "rescheduled" | "cancellation",
  ) {
    const service = item.booking_services?.name || "seu atendimento";
    const date = appointmentDate(item);
    const professional = page?.display_name || "o profissional";
    const messages = {
      confirmation: `Olá, ${item.client_name}! Seu agendamento de ${service} com ${professional} está confirmado para ${date}. Se precisar alterar, responda esta mensagem.`,
      reminder: `Olá, ${item.client_name}! Passando para lembrar do seu agendamento de ${service} com ${professional}, marcado para ${date}. Esperamos você!`,
      reschedule: `Olá, ${item.client_name}! Precisamos ajustar o horário do seu agendamento de ${service}, atualmente marcado para ${date}. Pode nos responder para combinarmos um novo horário?`,
      rescheduled: `Olá, ${item.client_name}! Seu agendamento de ${service} com ${professional} foi remarcado para ${date}. Se precisar de mais alguma alteração, responda esta mensagem.`,
      cancellation: `Olá, ${item.client_name}. Informamos que seu agendamento de ${service}, marcado para ${date}, foi cancelado. Responda esta mensagem caso queira escolher um novo horário.`,
    };
    return messages[kind];
  }

  function openWhatsApp(
    item: Appointment,
    kind: "confirmation" | "reminder" | "reschedule" | "rescheduled" | "cancellation",
  ) {
    let phone = item.client_phone.replace(/\D/g, "");
    if (phone.length === 10 || phone.length === 11) phone = `55${phone}`;
    if (phone.length < 12) {
      toast.error("O WhatsApp deste cliente parece estar incompleto.");
      return false;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(item, kind))}`,
      "_blank",
      "noopener,noreferrer",
    );
    return true;
  }

  async function cancelAndNotify(item: Appointment) {
    try {
      await changeStatus(item.id, "cancelled");
      openWhatsApp(item, "cancellation");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar.");
    }
  }

  function openReschedule(item: Appointment) {
    setSelectedAppointment(null);
    setEditing(item);
    setRescheduleDate("");
    setRescheduleSlots([]);
    setRescheduleStart("");
  }

  async function loadRescheduleSlots(date: string) {
    if (!editing) return;
    setRescheduleDate(date);
    setRescheduleStart("");
    setLoadingReschedule(true);
    try {
      setRescheduleSlots(await BookingService.getSlots(pageId, editing.service_id, date));
    } catch (error) {
      setRescheduleSlots([]);
      toast.error(error instanceof Error ? error.message : "Não foi possível buscar horários.");
    } finally {
      setLoadingReschedule(false);
    }
  }

  async function confirmReschedule() {
    if (!editing || !rescheduleStart) return;
    setSavingReschedule(true);
    try {
      const updated = await BookingService.rescheduleAppointment({
        id: editing.id,
        bioPageId: pageId,
        startAt: rescheduleStart,
        durationMinutes: editing.booking_services?.duration_minutes ?? 60,
      });
      await client.invalidateQueries({ queryKey: ["appointments", pageId] });
      setEditing(null);
      toast.success("Agendamento remarcado e horário anterior liberado.");
      openWhatsApp(updated, "rescheduled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remarcar.");
      if (rescheduleDate) await loadRescheduleSlots(rescheduleDate);
    } finally {
      setSavingReschedule(false);
    }
  }

  async function updateFromDetails(item: Appointment, status: "completed" | "cancelled") {
    if (status === "cancelled") await cancelAndNotify(item);
    else await changeStatus(item.id, status);
    setSelectedAppointment(null);
  }

  function getLocalDateStr(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function openBlockModal(date?: string | null) {
    const today = getLocalDateStr(new Date());
    setBlockingDate(date || today);
    setBlockingAllDay(true);
    setBlockingStartTime("08:00");
    setBlockingEndTime("18:00");
    setBlockingReason("Folga programada");
    setBlockingModalOpen(true);
  }

  async function confirmBlock() {
    if (!blockingDate || !blockingReason.trim()) return;
    setSavingBlock(true);
    try {
      await BookingService.blockTime({
        bioPageId: pageId,
        date: blockingDate,
        allDay: blockingAllDay,
        startTime: blockingStartTime,
        endTime: blockingEndTime,
        reason: blockingReason.trim(),
      });
      await client.invalidateQueries({ queryKey: ["appointments", pageId] });
      setBlockingModalOpen(false);
      toast.success("Bloqueio de agenda criado. Horários protegidos contra novos agendamentos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o bloqueio.");
    } finally {
      setSavingBlock(false);
    }
  }

  async function unblockAppointment(id: string) {
    try {
      await BookingService.unblockTime(id);
      await client.invalidateQueries({ queryKey: ["appointments", pageId] });
      if (selectedAppointment?.id === id) setSelectedAppointment(null);
      toast.success("Folga/bloqueio cancelado. Horário liberado para agendamentos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar a folga.");
    }
  }

  function prevMonth() {
    setCalendarMonth((curr) => new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCalendarMonth((curr) => new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(getLocalDateStr(now));
  }

  function applySchedulePreset(type: "commercial" | "morning" | "afternoon" | "night") {
    const presets = {
      commercial: { start: "08:00", end: "18:00", label: "Comercial (08h-18h)" },
      morning: { start: "08:00", end: "12:00", label: "Apenas Manhã (08h-12h)" },
      afternoon: { start: "13:00", end: "18:00", label: "Apenas Tarde (13h-18h)" },
      night: { start: "18:00", end: "22:00", label: "Apenas Noite (18h-22h)" },
    };
    const config = presets[type];
    setAvailability((current) => {
      return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
        const isWeekday = weekday >= 1 && weekday <= 5;
        const existing = current.find((d) => d.weekday === weekday);
        return {
          id: existing?.id || `avail-${weekday}`,
          bio_page_id: pageId,
          weekday,
          start_time: config.start,
          end_time: config.end,
          active: isWeekday,
        };
      });
    });
    toast.success(`Horário aplicado para Seg-Sex: ${config.label}.`);
  }

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayWeekday = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarMonth);
  }, [calendarMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!appointments.data) return map;
    for (const item of appointments.data) {
      const key = getLocalDateStr(item.start_at);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [appointments.data]);

  const calendarCells = useMemo(() => {
    const cells: {
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasConfirmed: boolean;
      hasBlocked: boolean;
      hasCompleted: boolean;
      count: number;
    }[] = [];

    const todayStr = getLocalDateStr(new Date());

    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = getLocalDateStr(prevDate);
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasConfirmed: false,
        hasBlocked: false,
        hasCompleted: false,
        count: 0,
      });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = getLocalDateStr(curDate);
      const dayApps = appointmentsByDate.get(dateStr) ?? [];
      const hasBlocked = dayApps.some((a) => a.client_name?.startsWith("[BLOQUEIO]") && a.status !== "cancelled");
      const hasConfirmed = dayApps.some((a) => !a.client_name?.startsWith("[BLOQUEIO]") && a.status === "confirmed");
      const hasCompleted = dayApps.some((a) => a.status === "completed");

      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasConfirmed,
        hasBlocked,
        hasCompleted,
        count: dayApps.filter((a) => a.status !== "cancelled").length,
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = getLocalDateStr(nextDate);
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasConfirmed: false,
        hasBlocked: false,
        hasCompleted: false,
        count: 0,
      });
    }

    return cells;
  }, [year, month, firstDayWeekday, prevMonthTotalDays, totalDaysInMonth, appointmentsByDate, selectedDate]);

  const filteredAppointments = useMemo(() => {
    if (!appointments.data) return [];
    if (!selectedDate) return appointments.data;
    return appointments.data.filter((item) => getLocalDateStr(item.start_at) === selectedDate);
  }, [appointments.data, selectedDate]);



  if (pages.isLoading || access.isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!access.data?.isPro)
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            <CalendarClock className="h-3.5 w-3.5" /> Agenda Interativa
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">
            Receba Agendamentos pelo seu Biolink
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Serviços, horários disponíveis e confirmações organizadas em um só lugar.
          </p>
        </div>
        <UpgradePrompt
          title="Agenda incluída no EIA Link PRO"
          description="Ative sua agenda e permita que clientes escolham um serviço e um horário disponível diretamente no seu site."
        />
      </div>
    );
  if (!pages.data?.length)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Crie sua página primeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Para ativar o sistema de agendamentos, você precisa ter pelo menos um biolink criado.
          </p>
        </div>
        <Link to="/pages" className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold shadow transition-all">
          <Plus className="h-4 w-4" /> Criar Minha Primeira Página
        </Link>
      </div>
    );


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Page Selector */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27233a]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-400" />
              Eialink Pro
            </Badge>
            <span className="text-xs text-muted-foreground">Gestão de Agendamentos</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Agenda Essencial
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Configure horários e serviços uma única vez. Clientes e pacientes agendam sozinhos diretamente pelo seu biolink.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-lg bg-card border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors shadow-sm"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          >
            {pages.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name}
              </option>
            ))}
          </select>
          {page && (
            <Button asChild variant="outline" className="border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-purple-200">
              <a href={`/agendar/${page.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver agenda pública
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-card border border-border w-fit shadow-inner">
        <button
          type="button"
          onClick={() => setTab("setup")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "setup"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Clock3 className="h-4 w-4" />
          <span>Configurar Serviços & Horários</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("bookings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "bookings"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Agendamentos Marcados</span>
          {appointments.data && appointments.data.filter((item) => item.status === "confirmed").length > 0 && (
            <Badge className="ml-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-1.5 py-0 h-5 font-semibold">
              {appointments.data.filter((item) => item.status === "confirmed").length}
            </Badge>
          )}
        </button>
      </div>

      {tab === "setup" ? (
        <div className="space-y-6">
          {/* Agenda Pública Switch Card */}
          <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#160d29] to-[#120a22] shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-lg text-foreground">Agenda Pública no Biolink</h3>
                  {active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ativa no Biolink
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs">
                      Inativa
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-400">
                  Quando ativada, o botão interativo “Agendar horário” é exibido com destaque na sua página de perfil.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="text-xs font-medium text-zinc-300">
                  {active ? "Exibindo na página" : "Oculto na página"}
                </span>
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Setup Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Serviços Ofertados */}
            <Card className="lg:col-span-6 bg-card border-border shadow-lg flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#27233a]">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
                    <Settings2 className="h-3.5 w-3.5" />
                    Etapa 1
                  </div>
                  <CardTitle className="text-xl text-foreground">Vitrine de Serviços</CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-0.5">
                    Cadastre os serviços e durações que seus clientes poderão agendar.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Novo Serviço
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 flex-1">
                {services.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-[#27233a] rounded-xl bg-[#10081d]/50">
                    <CalendarDays className="h-10 w-10 text-zinc-500 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-medium text-zinc-300">Nenhum serviço cadastrado ainda</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Clique em &quot;Novo Serviço&quot; acima para adicionar opções como Consulta Inicial, Mentoria, etc.
                    </p>
                  </div>
                ) : (
                  services.map((service, index) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl border border-[#27233a] bg-[#10081d]/80 hover:border-purple-500/40 transition-all space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                              #{index + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="Ex.: Consulta Inicial ou Mentoria 1h"
                              value={service.name}
                              onChange={(e) => updateService(service.id, { name: e.target.value })}
                              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Descrição breve ou instruções (opcional)"
                            value={service.description ?? ""}
                            onChange={(e) => updateService(service.id, { description: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover serviço"
                          onClick={() => setServices((curr) => curr.filter((item) => item.id !== service.id))}
                          className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#27233a]/60">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Duração</label>
                          <select
                            value={service.duration_minutes}
                            onChange={(e) => updateService(service.id, { duration_minutes: Number(e.target.value) })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            {[15, 30, 45, 60, 90, 120].map((v) => (
                              <option key={v} value={v}>
                                {v} minutos
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Preço (R$)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00 (ou grátis)"
                              value={service.price ?? ""}
                              onChange={(e) =>
                                updateService(service.id, {
                                  price: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Column 2: Horários Semanais & Regras */}
            <div className="lg:col-span-6 space-y-6">
              {/* Grade Semanal */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="flex flex-col gap-3 pb-4 border-b border-[#27233a]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        Etapa 2
                      </div>
                      <CardTitle className="text-xl text-foreground">Disponibilidade Semanal</CardTitle>
                      <CardDescription className="text-zinc-400 text-xs mt-0.5">
                        Configure os dias e turnos de atendimento. Se atender apenas em um período, escolha o turno abaixo.
                      </CardDescription>
                    </div>
                  </div>
                  {/* Presets de Turnos / Períodos */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#27233a]/60">
                    <span className="text-[11px] text-zinc-400 font-medium mr-1">Atalhos de Turno:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySchedulePreset("commercial")}
                      className="border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 text-xs h-7 px-2.5 flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3 text-yellow-400" />
                      Comercial (08h-18h)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySchedulePreset("morning")}
                      className="border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 text-xs h-7 px-2.5 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3 text-amber-400" />
                      Só Manhã (08h-12h)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySchedulePreset("afternoon")}
                      className="border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/40 text-blue-200 text-xs h-7 px-2.5 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3 text-blue-400" />
                      Só Tarde (13h-18h)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySchedulePreset("night")}
                      className="border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200 text-xs h-7 px-2.5 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3 text-indigo-400" />
                      Só Noite (18h-22h)
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-2.5">
                  {DAYS.map((label, weekday) => {
                    const day = availability.find((item) => item.weekday === weekday);
                    const isDayActive = day?.active ?? false;
                    return (
                      <div
                        key={label}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isDayActive
                            ? "bg-[#10081d]/80 border-[#27233a]"
                            : "bg-black/20 border-[#1f192b] opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-[110px]">
                          <input
                            type="checkbox"
                            id={`day-${weekday}`}
                            checked={isDayActive}
                            onChange={(e) => updateDay(weekday, { active: e.target.checked })}
                            className="h-4 w-4 rounded border-border bg-background text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <label
                            htmlFor={`day-${weekday}`}
                            className={`text-sm font-semibold cursor-pointer ${
                              isDayActive ? "text-foreground font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            {label}
                          </label>
                          {isDayActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0">
                              Aberto
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] px-1.5 py-0">
                              Fechado
                            </Badge>
                          )}
                        </div>

                        {isDayActive ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={(day?.start_time ?? "08:00").slice(0, 5)}
                              onChange={(e) => updateDay(weekday, { start_time: e.target.value })}
                              className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-xs text-zinc-500">até</span>
                            <input
                              type="time"
                              value={(day?.end_time ?? "18:00").slice(0, 5)}
                              onChange={(e) => updateDay(weekday, { end_time: e.target.value })}
                              className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 italic">Sem atendimentos</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Regras de Agendamento */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-3 border-b border-[#27233a]">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-purple-400" />
                    Regras de Agendamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                      Antecedência mínima
                    </label>
                    <select
                      value={notice}
                      onChange={(e) => setNotice(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value={0}>Sem limite (imediato)</option>
                      <option value={2}>2 horas de antecedência</option>
                      <option value={6}>6 horas de antecedência</option>
                      <option value={24}>24 horas (1 dia antes)</option>
                    </select>
                    <p className="text-[11px] text-zinc-500 mt-1">Evita clientes agendando em cima da hora.</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                      Agenda disponível por
                    </label>
                    <select
                      value={ahead}
                      onChange={(e) => setAhead(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value={30}>Próximos 30 dias</option>
                      <option value={60}>Próximos 60 dias</option>
                      <option value={90}>Próximos 90 dias</option>
                    </select>
                    <p className="text-[11px] text-zinc-500 mt-1">Limite máximo de dias no calendário futuro.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-end pt-4">
            <Button
              type="button"
              size="lg"
              onClick={() => void save()}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-900/30 px-8 py-2.5 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Salvando configurações..." : "Salvar e Publicar Agenda"}
            </Button>
          </div>
        </div>
      ) : (
        /* Bookings Tab */
        <div className="space-y-6">
          {/* Active Folgas / Bloqueios Card with Cancel Action */}
          {appointments.data?.some(item => item.client_name?.startsWith("[BLOQUEIO]") && item.status !== "cancelled") && (
            <Card className="border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#160d29] to-[#120a22] shadow-lg overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#27233a] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base text-amber-200 flex items-center gap-2 font-semibold">
                    <Coffee className="h-4 w-4 text-amber-400" />
                    Folgas e Bloqueios de Agenda Ativos
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-0.5">
                    Estes períodos estão fechados para agendamentos. Para liberar o horário aos clientes, clique em Cancelar Folga.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {appointments.data
                  ?.filter(item => item.client_name?.startsWith("[BLOQUEIO]") && item.status !== "cancelled")
                  .map((block) => {
                    const reason = block.client_name.replace("[BLOQUEIO] ", "");
                    return (
                      <div
                        key={block.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-950/40 hover:bg-amber-950/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                            <Coffee className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <span>{reason}</span>
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                                Folga Ativa
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {appointmentDate(block)}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void unblockAppointment(block.id)}
                          className="border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs self-end sm:self-center shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Cancelar Folga (Liberar Horário)
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-4">
              <div className="text-xs text-zinc-400 font-medium">Total Ativos</div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {appointments.data?.filter((item) => item.status !== "cancelled").length ?? 0}
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
                <span>Confirmados</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {appointments.data?.filter((item) => !item.client_name?.startsWith("[BLOQUEIO]") && item.status === "confirmed").length ?? 0}
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-xs text-purple-400 font-medium flex items-center justify-between">
                <span>Concluídos</span>
                <span className="h-2 w-2 rounded-full bg-purple-400" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {appointments.data?.filter((item) => item.status === "completed").length ?? 0}
              </div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
                <span>Folgas & Bloqueios</span>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {appointments.data?.filter((item) => item.client_name?.startsWith("[BLOQUEIO]") && item.status !== "cancelled").length ?? 0}
              </div>
            </Card>
          </div>

          {/* Interactive Calendar & Appointments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna 1: Calendário Interativo */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <Card className="bg-card border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-3 border-b border-[#27233a] px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground capitalize font-semibold flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-purple-400" />
                      {monthName}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                        title="Mês anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-md font-medium"
                      >
                        Hoje
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                        title="Próximo mês"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                      <span key={i} className="text-[11px] font-semibold text-zinc-500 py-1">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Grade de dias */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                        className={`relative flex flex-col items-center justify-center h-10 rounded-lg text-xs transition-all ${
                          cell.isSelected
                            ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-900/50 ring-2 ring-purple-400/60"
                            : cell.isCurrentMonth
                              ? "text-foreground hover:bg-muted/40 hover:text-foreground"
                              : "text-zinc-600 hover:bg-white/5 opacity-40"
                        } ${
                          cell.isToday && !cell.isSelected
                            ? "border border-purple-500/50 bg-purple-950/30 text-purple-200 font-semibold"
                            : ""
                        }`}
                      >
                        <span>{cell.day}</span>
                        {/* Indicadores de bolinhas */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {cell.hasConfirmed && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Atendimento confirmado" />
                          )}
                          {cell.hasBlocked && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Bloqueio / Folga" />
                          )}
                          {cell.hasCompleted && !cell.hasConfirmed && (
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" title="Atendimento concluído" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Legenda */}
                  <div className="flex items-center justify-center gap-3 pt-3 mt-3 border-t border-[#27233a] text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Confirmado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Folga/Bloqueio</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      <span>Concluído</span>
                    </div>
                  </div>

                  {/* Botão de Ação Rápida: Bloquear Folga */}
                  <div className="pt-3 mt-3 border-t border-[#27233a]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openBlockModal(selectedDate)}
                      className="w-full border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      <Coffee className="h-3.5 w-3.5 text-amber-400" />
                      + Bloquear Data / Folga
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Lista Filtrada de Agendamentos */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <Card className="bg-card border-border shadow-lg flex flex-col min-h-[420px]">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27233a]">
                  <div>
                    <CardTitle className="text-xl text-foreground">
                      {selectedDate
                        ? `Atendimentos em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${selectedDate}T12:00:00`))}`
                        : "Todos os Próximos Atendimentos"}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs mt-0.5">
                      {selectedDate
                        ? "Exibindo apenas os horários e bloqueios programados para esta data."
                        : "Clique em qualquer atendimento para ver detalhes, gerenciar pelo WhatsApp ou reagendar."}
                    </CardDescription>
                  </div>
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-purple-200 border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 shrink-0"
                    >
                      Ver todos
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 flex-1">
                  {appointments.isLoading ? (
                    <div className="flex items-center justify-center py-16 text-zinc-400">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
                      Carregando agendamentos...
                    </div>
                  ) : filteredAppointments.length ? (
                    <div className="space-y-3">
                      {filteredAppointments.map((item) => {
                        const isBlock = item.client_name?.startsWith("[BLOQUEIO]");
                        const start = new Date(item.start_at);
                        const dayNum = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(start);
                        const monthStr = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(start);
                        const timeStr = new Intl.DateTimeFormat("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(start);

                        if (isBlock) {
                          const reason = item.client_name.replace("[BLOQUEIO] ", "");
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedAppointment(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setSelectedAppointment(item);
                              }}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/30 hover:border-amber-500/50 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-200 shrink-0">
                                  <Coffee className="h-5 w-5 text-amber-400" />
                                  <span className="text-[10px] font-bold text-amber-300 mt-0.5">{dayNum}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-200">
                                      Bloqueio: {reason}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-amber-300/80 mt-1">
                                    <span>Agenda protegida contra novos agendamentos</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs">
                                  Folga / Indisponível
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void unblockAppointment(item.id);
                                  }}
                                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs h-7"
                                >
                                  Desbloquear
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedAppointment(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") setSelectedAppointment(item);
                            }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-purple-500/40 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-200 shrink-0">
                                <span className="text-base font-bold leading-none">{dayNum}</span>
                                <span className="text-[10px] uppercase font-semibold text-purple-300 leading-tight">
                                  {monthStr}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {timeStr} · {item.booking_services?.name || "Atendimento"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                  <UserRound className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>{item.client_name}</span>
                                  <span>·</span>
                                  <span>{item.client_phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {item.status === "confirmed" && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                  Confirmado
                                </Badge>
                              )}
                              {item.status === "completed" && (
                                <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                                  Concluído
                                </Badge>
                              )}
                              {item.status === "cancelled" && (
                                <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-xs">
                                  Cancelado
                                </Badge>
                              )}

                              <span className="text-xs text-zinc-400 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                                Gerenciar
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4 border border-dashed border-[#27233a] rounded-xl bg-[#10081d]/50 space-y-3">
                      <CalendarDays className="h-10 w-10 text-zinc-500 mx-auto opacity-60" />
                      <p className="text-sm font-medium text-zinc-300">
                        {selectedDate ? "Nenhum agendamento para esta data" : "Nenhum agendamento registrado"}
                      </p>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {selectedDate
                          ? "Deseja tirar este dia de folga ou bloquear os horários de atendimento?"
                          : "Assim que seus clientes agendarem horários pelo seu biolink, eles aparecerão aqui."}
                      </p>
                      {selectedDate && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openBlockModal(selectedDate)}
                          className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs mt-2"
                        >
                          <Coffee className="h-3.5 w-3.5 mr-1.5" />
                          Bloquear este dia (Folga)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Selected Appointment / Block Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAppointment(null);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-card-foreground"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#27233a]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-[10px]">
                    {selectedAppointment.client_name?.startsWith("[BLOQUEIO]") ? "Bloqueio" : "Atendimento"}
                  </Badge>
                  {selectedAppointment.client_name?.startsWith("[BLOQUEIO]") ? (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                      Folga / Indisponível
                    </Badge>
                  ) : (
                    <>
                      {selectedAppointment.status === "confirmed" && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Confirmado
                        </Badge>
                      )}
                      {selectedAppointment.status === "completed" && (
                        <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">
                          Concluído
                        </Badge>
                      )}
                      {selectedAppointment.status === "cancelled" && (
                        <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-[10px]">
                          Cancelado
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedAppointment.client_name?.startsWith("[BLOQUEIO]")
                    ? selectedAppointment.client_name.replace("[BLOQUEIO] ", "")
                    : selectedAppointment.client_name}
                </h2>
                {!selectedAppointment.client_name?.startsWith("[BLOQUEIO]") && (
                  <p className="text-xs text-zinc-400">{selectedAppointment.client_phone}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAppointment(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary Info */}
            <div className="bg-[#10081d] border border-[#27233a] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">
                  {selectedAppointment.client_name?.startsWith("[BLOQUEIO]") ? "Tipo:" : "Serviço:"}
                </span>
                <span className="font-semibold text-foreground">
                  {selectedAppointment.client_name?.startsWith("[BLOQUEIO]")
                    ? "Bloqueio de Agenda / Folga"
                    : selectedAppointment.booking_services?.name || "Atendimento"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Data e Horário:</span>
                <span className="font-semibold text-purple-300">
                  {appointmentDate(selectedAppointment)}
                </span>
              </div>
              {selectedAppointment.notes && (
                <div className="pt-2 border-t border-[#27233a]/60 text-xs">
                  <span className="text-zinc-400 block mb-1">Observações:</span>
                  <p className="text-foreground bg-muted/40 p-2 rounded-lg border border-border">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions for Block vs Normal Appointment */}
            {selectedAppointment.client_name?.startsWith("[BLOQUEIO]") ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-medium text-xs">
                    <Coffee className="h-4 w-4" />
                    Horário Fechado para Clientes
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Nenhum cliente consegue agendar compromissos neste intervalo pelo seu Biolink público.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27233a]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedAppointment(null)}
                    className="border-zinc-700 text-zinc-300 text-xs"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void unblockAppointment(selectedAppointment.id)}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Desbloquear e Liberar Horário
                  </Button>
                </div>
              </div>
            ) : selectedAppointment.status === "confirmed" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Ações Rápidas & WhatsApp
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openWhatsApp(selectedAppointment, "confirmation")}
                    className="justify-start border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-xs h-12"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">Confirmar no WhatsApp</div>
                      <div className="text-[10px] opacity-70">Enviar confirmação pronta</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openWhatsApp(selectedAppointment, "reminder")}
                    className="justify-start border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30 text-blue-300 text-xs h-12"
                  >
                    <Bell className="h-4 w-4 mr-2 text-blue-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">Enviar Lembrete</div>
                      <div className="text-[10px] opacity-70">Relembrar horário</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openWhatsApp(selectedAppointment, "reschedule")}
                    className="justify-start border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-xs h-12"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">Solicitar Mudança</div>
                      <div className="text-[10px] opacity-70">Combinar novo horário</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openReschedule(selectedAppointment)}
                    className="justify-start border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs h-12"
                  >
                    <CalendarClock className="h-4 w-4 mr-2 text-purple-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">Reagendar Direto</div>
                      <div className="text-[10px] opacity-70">Escolher horário livre</div>
                    </div>
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#27233a] flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void updateFromDetails(selectedAppointment, "cancelled")}
                    className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancelar Agendamento
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void updateFromDetails(selectedAppointment, "completed")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Concluir Atendimento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#10081d] border border-[#27233a] text-center text-xs text-zinc-400">
                Este agendamento já está {selectedAppointment.status === "completed" ? "concluído" : "cancelado"}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bloquear Data / Folga Modal */}
      {blockingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBlockingModalOpen(false);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-card-foreground animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#27233a]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
                  <Coffee className="h-3.5 w-3.5" />
                  Indisponibilidade
                </div>
                <h2 className="text-xl font-bold text-foreground">Bloquear Horário / Folga</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tranque horários para que clientes não possam agendar.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBlockingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                  Data do Bloqueio:
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={blockingDate}
                  onChange={(e) => setBlockingDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                  Duração do Bloqueio:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockingAllDay(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      blockingAllDay
                        ? "bg-purple-600 border-purple-400 text-white shadow"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Dia Inteiro (Folga)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockingAllDay(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      !blockingAllDay
                        ? "bg-purple-600 border-purple-400 text-white shadow"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Horário Específico
                  </button>
                </div>
              </div>

              {!blockingAllDay && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#10081d] border border-[#27233a]">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Início</label>
                    <input
                      type="time"
                      value={blockingStartTime}
                      onChange={(e) => setBlockingStartTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Término</label>
                    <input
                      type="time"
                      value={blockingEndTime}
                      onChange={(e) => setBlockingEndTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                  Motivo / Observação:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Folga programada", "Férias", "Consulta médica", "Compromisso pessoal"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBlockingReason(m)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        blockingReason === m
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ex.: Folga de sexta ou Atestado"
                  value={blockingReason}
                  onChange={(e) => setBlockingReason(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27233a]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockingModalOpen(false)}
                className="border-zinc-700 text-zinc-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={savingBlock || !blockingDate || !blockingReason}
                onClick={() => void confirmBlock()}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
              >
                {savingBlock ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Coffee className="h-3.5 w-3.5 mr-1.5" />}
                {savingBlock ? "Bloqueando..." : "Confirmar Bloqueio"}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Reschedule Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-card-foreground"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#27233a]">
              <div>
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
                  Reagendar Horário
                </p>
                <h2 className="text-xl font-bold text-foreground">{editing.client_name}</h2>
                <p className="text-xs text-zinc-400">{editing.booking_services?.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Current slot info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200">
              <CalendarClock className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <div className="text-[11px] text-zinc-400">Horário Atual:</div>
                <div className="text-xs font-semibold text-foreground">{appointmentDate(editing)}</div>
              </div>
            </div>

            {/* Pick date */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                Selecione a nova data:
              </label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={rescheduleDate}
                onChange={(e) => void loadRescheduleSlots(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Slots display */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                Horários livres disponíveis:
              </label>
              {loadingReschedule ? (
                <div className="flex items-center justify-center py-8 text-zinc-400 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400 mr-2" />
                  Buscando horários disponíveis...
                </div>
              ) : rescheduleDate && rescheduleSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleStart === slot.slot_start;
                    const label = new Intl.DateTimeFormat("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Bahia",
                    }).format(new Date(slot.slot_start));
                    return (
                      <button
                        key={slot.slot_start}
                        type="button"
                        onClick={() => setRescheduleStart(slot.slot_start)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-900/50"
                            : "bg-[#10081d] border-[#27233a] text-zinc-300 hover:border-purple-500/50 hover:bg-purple-950/30"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : rescheduleDate ? (
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-800/30 p-3 rounded-lg text-center">
                  Não há horários livres nessa data.
                </p>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">
                  Selecione uma data acima para visualizar os horários disponíveis.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27233a]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="border-zinc-700 text-zinc-300 text-xs"
              >
                Manter Atual
              </Button>
              <Button
                type="button"
                disabled={!rescheduleStart || savingReschedule}
                onClick={() => void confirmReschedule()}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
              >
                {savingReschedule ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                {savingReschedule ? "Remarcando..." : "Confirmar Novo Horário"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
