import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Loader2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookingService } from "@/modules/booking/BookingService";
import type {
  BookingAvailability,
  BookingService as Service,
  BookingSettings,
  BookingSlot,
} from "@/modules/booking/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bookingStore = supabase as never as { from: (table: string) => any };

export const Route = createFileRoute("/agendar/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    const { data: bio } = await supabase
      .from("bio_pages")
      .select("id,slug,display_name,description,avatar_url,theme,published")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!bio) throw notFound();
    const [{ data: settings }, { data: services }, { data: availability }] = await Promise.all([
      bookingStore
        .from("booking_settings")
        .select("*")
        .eq("bio_page_id", bio.id)
        .eq("active", true)
        .maybeSingle(),
      bookingStore
        .from("booking_services")
        .select("*")
        .eq("bio_page_id", bio.id)
        .eq("active", true)
        .order("position"),
      bookingStore
        .from("booking_availability")
        .select("*")
        .eq("bio_page_id", bio.id)
        .eq("active", true)
        .order("weekday"),
    ]);
    return {
      bio,
      settings: settings as BookingSettings | null,
      services: (services ?? []) as Service[],
      availability: (availability ?? []) as BookingAvailability[],
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Agendar com ${loaderData.bio.display_name} — EIA Link`
          : "Agenda indisponível",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PublicBookingPage,
});

function PublicBookingPage() {
  const { bio, settings, services, availability } = Route.useLoaderData();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const availableDays = useMemo(() => {
    const enabled = new Set(availability.map((day) => day.weekday));
    const max = Math.min(settings?.max_days_ahead ?? 60, 60);
    return Array.from({ length: max + 1 }, (_, index) => addDays(new Date(), index))
      .filter((date) => enabled.has(date.getDay()))
      .slice(0, 14);
  }, [availability, settings?.max_days_ahead]);
  const [selectedDate, setSelectedDate] = useState(() =>
    availableDays[0] ? format(availableDays[0], "yyyy-MM-dd") : "",
  );
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<BookingSlot>();
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{ start: string; end: string; service: Service }>();

  useEffect(() => {
    if (!serviceId || !selectedDate) return;
    setLoadingSlots(true);
    setSlot(undefined);
    setError("");
    BookingService.getSlots(bio.id, serviceId, selectedDate)
      .then(setSlots)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Não foi possível carregar os horários.",
        ),
      )
      .finally(() => setLoadingSlots(false));
  }, [bio.id, selectedDate, serviceId]);

  if (!settings || !services.length || !availability.length)
    return (
      <main className="public-booking-shell">
        <section className="public-booking-empty">
          <CalendarCheck />
          <h1>Agenda temporariamente indisponível</h1>
          <p>Entre em contato diretamente com {bio.display_name}.</p>
          <Link to="/p/$slug" params={{ slug: bio.slug }} className="btn-primary">
            Voltar para a página
          </Link>
        </section>
      </main>
    );

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!slot || form.name.trim().length < 2 || form.phone.replace(/\D/g, "").length < 8) {
      setError("Escolha um horário e informe seu nome e WhatsApp.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await BookingService.createAppointment({
        bioPageId: bio.id,
        serviceId,
        startAt: slot.slot_start,
        clientName: form.name,
        clientPhone: form.phone,
        clientEmail: form.email,
        notes: form.notes,
      });
      setConfirmed({ start: slot.slot_start, end: result.end_at, service });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "O horário acabou de ser ocupado. Escolha outro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed)
    return (
      <Confirmation
        bioName={bio.display_name}
        slug={bio.slug}
        start={confirmed.start}
        end={confirmed.end}
        service={confirmed.service}
      />
    );

  return (
    <main className={`public-booking-shell bio-theme ${bio.theme || "aurora"}`}>
      <header className="public-booking-header">
        <Link to="/p/$slug" params={{ slug: bio.slug }} aria-label="Voltar">
          <ArrowLeft />
        </Link>
        <div className="public-booking-avatar">
          {bio.avatar_url ? (
            <img src={bio.avatar_url} alt="" />
          ) : (
            <span>{bio.display_name.charAt(0)}</span>
          )}
        </div>
        <div>
          <span>Agende com</span>
          <h1>{bio.display_name}</h1>
        </div>
      </header>
      <div className="public-booking-progress">
        <span className={serviceId ? "done" : "active"}>1</span>
        <i />
        <span className={selectedDate ? "done" : ""}>2</span>
        <i />
        <span className={slot ? "done" : ""}>3</span>
      </div>
      <form className="public-booking-card" onSubmit={(event) => void submit(event)}>
        <section>
          <p className="public-booking-step">1 · Escolha o serviço</p>
          <div className="public-service-options">
            {services.map((item) => (
              <button
                type="button"
                className={serviceId === item.id ? "is-selected" : ""}
                key={item.id}
                onClick={() => setServiceId(item.id)}
              >
                <div>
                  <b>{item.name}</b>
                  {item.description && <span>{item.description}</span>}
                  <small>
                    <Clock3 /> {item.duration_minutes} min{" "}
                    {item.price !== null && (
                      <>
                        ·{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price)}
                      </>
                    )}
                  </small>
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="public-booking-step">2 · Escolha o dia</p>
          <div className="public-date-strip">
            {availableDays.map((date) => {
              const value = format(date, "yyyy-MM-dd");
              return (
                <button
                  type="button"
                  key={value}
                  className={selectedDate === value ? "is-selected" : ""}
                  onClick={() => setSelectedDate(value)}
                >
                  <span>{format(date, "EEE", { locale: ptBR }).replace(".", "")}</span>
                  <b>{format(date, "dd")}</b>
                  <small>{format(date, "MMM", { locale: ptBR }).replace(".", "")}</small>
                </button>
              );
            })}
          </div>
        </section>
        <section>
          <p className="public-booking-step">3 · Escolha o horário</p>
          {loadingSlots ? (
            <div className="public-slots-loading">
              <Loader2 className="animate-spin" /> Buscando horários...
            </div>
          ) : slots.length ? (
            <div className="public-slot-grid">
              {slots.map((item) => (
                <button
                  type="button"
                  className={slot?.slot_start === item.slot_start ? "is-selected" : ""}
                  key={item.slot_start}
                  onClick={() => setSlot(item)}
                >
                  {new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Bahia",
                  }).format(new Date(item.slot_start))}
                </button>
              ))}
            </div>
          ) : (
            <p className="public-no-slots">Não há horários livres neste dia. Escolha outra data.</p>
          )}
        </section>
        {slot && (
          <section className="public-booking-contact">
            <p className="public-booking-step">4 · Seus dados</p>
            <label>
              Nome
              <input
                className="input-base"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Como podemos chamar você?"
              />
            </label>
            <label>
              WhatsApp
              <input
                className="input-base"
                required
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(73) 99999-9999"
              />
            </label>
            <label>
              E-mail <small>(opcional)</small>
              <input
                className="input-base"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Para receber a confirmação"
              />
            </label>
            <label>
              Observação <small>(opcional)</small>
              <textarea
                className="input-base"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Alguma informação importante?"
              />
            </label>
          </section>
        )}
        {error && (
          <p className="public-booking-error" role="alert">
            {error}
          </p>
        )}
        <button className="public-booking-submit" disabled={!slot || submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <CalendarCheck />}{" "}
          {submitting ? "Confirmando..." : "Confirmar agendamento"}
        </button>
        <p className="public-booking-powered">
          Agendamento seguro por <b>EiaLink</b>
        </p>
      </form>
    </main>
  );
}

function Confirmation({
  bioName,
  slug,
  start,
  end,
  service,
}: {
  bioName: string;
  slug: string;
  start: string;
  end: string;
  service: Service;
}) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const calendarDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: `${service.name} - ${bioName}`,
    dates: `${calendarDate(startDate)}/${calendarDate(endDate)}`,
    details: "Agendamento confirmado pelo EiaLink",
  }).toString()}`;

  function downloadCalendar() {
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EiaLink//Agenda//PT-BR",
      "BEGIN:VEVENT",
      `DTSTART:${calendarDate(startDate)}`,
      `DTEND:${calendarDate(endDate)}`,
      `SUMMARY:${service.name} - ${bioName}`,
      `DESCRIPTION:Agendamento confirmado pelo EiaLink`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/calendar" }));
    link.download = "agendamento-eialink.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <main className="public-booking-shell">
      <section className="public-booking-confirmation">
        <span className="confirmation-check">
          <Check />
        </span>
        <p className="eyebrow">Tudo certo!</p>
        <h1>Agendamento confirmado</h1>
        <p>
          Seu horário com <b>{bioName}</b> foi reservado.
        </p>
        <div className="confirmation-summary">
          <CalendarCheck />
          <div>
            <b>{service.name}</b>
            <span>
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Bahia",
              }).format(startDate)}
            </span>
          </div>
        </div>
        <a
          className="btn-primary"
          href={googleCalendarUrl}
          target="_blank"
          rel="noreferrer"
        >
          <CalendarCheck /> Adicionar ao Google Agenda
        </a>
        <button className="btn-secondary" onClick={downloadCalendar}>
          <Download /> Apple, Outlook ou outra agenda (.ics)
        </button>
        <Link to="/p/$slug" params={{ slug }} className="btn-secondary">
          Voltar para a página
        </Link>
        <p className="public-booking-powered">
          Agendamento seguro por <b>EiaLink</b>
        </p>
      </section>
    </main>
  );
}
