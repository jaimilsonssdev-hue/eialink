import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageService } from "@/modules/page/services/PageService";
import { BookingService } from "@/modules/booking/BookingService";
import type { BookingAvailability, BookingService as Service } from "@/modules/booking/types";
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

  if (pages.isLoading || access.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (!access.data?.isPro)
    return (
      <div className="premium-page">
        <div className="premium-page-heading">
          <p className="eyebrow">Agenda Essencial</p>
          <h1>Receba agendamentos pelo Eialink</h1>
          <p>Serviços, horários e confirmações organizados em um só lugar.</p>
        </div>
        <div className="mt-6 max-w-2xl">
          <UpgradePrompt
            title="Agenda incluída no Eialink Pro"
            description="Ative sua agenda e permita que clientes escolham um serviço e um horário disponível."
          />
        </div>
      </div>
    );
  if (!pages.data?.length)
    return (
      <div className="premium-panel">
        <h1>Crie sua página primeiro</h1>
        <Link to="/pages" className="btn-primary mt-4">
          Criar página
        </Link>
      </div>
    );

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

  return (
    <div className="premium-page booking-admin-page">
      <header className="booking-admin-header">
        <div className="premium-page-heading">
          <p className="eyebrow">Eialink Pro</p>
          <h1>Agenda Essencial</h1>
          <p>Configure uma vez e deixe seus clientes escolherem os melhores horários.</p>
        </div>
        <div className="booking-admin-actions">
          <select className="input-base" value={pageId} onChange={(e) => setPageId(e.target.value)}>
            {pages.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name}
              </option>
            ))}
          </select>
          {page && (
            <a
              className="btn-secondary"
              href={`/agendar/${page.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" /> Ver agenda
            </a>
          )}
        </div>
      </header>
      <div className="booking-tabs" role="tablist">
        <button className={tab === "setup" ? "is-active" : ""} onClick={() => setTab("setup")}>
          <Clock3 /> Configurar
        </button>
        <button
          className={tab === "bookings" ? "is-active" : ""}
          onClick={() => setTab("bookings")}
        >
          <CalendarDays /> Agendamentos
        </button>
      </div>

      {tab === "setup" ? (
        <>
          <section className="premium-panel booking-enable-card">
            <div>
              <b>Agenda pública</b>
              <p>Quando ativada, o botão “Agendar horário” aparece na sua página.</p>
            </div>
            <label className="booking-switch">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>{active ? "Ativa" : "Inativa"}</span>
            </label>
          </section>
          <div className="booking-admin-grid">
            <section className="premium-panel">
              <div className="booking-section-title">
                <div>
                  <p className="eyebrow">Etapa 1</p>
                  <h2>Serviços</h2>
                </div>
                <button className="btn-secondary" onClick={addService}>
                  <Plus className="h-4 w-4" /> Adicionar
                </button>
              </div>
              <div className="booking-service-list">
                {services.map((service) => (
                  <article className="booking-service-editor" key={service.id}>
                    <div className="booking-service-main">
                      <input
                        className="input-base"
                        placeholder="Ex.: Consulta inicial"
                        value={service.name}
                        onChange={(e) => updateService(service.id, { name: e.target.value })}
                      />
                      <input
                        className="input-base"
                        placeholder="Descrição breve (opcional)"
                        value={service.description ?? ""}
                        onChange={(e) => updateService(service.id, { description: e.target.value })}
                      />
                    </div>
                    <label>
                      Duração
                      <select
                        className="input-base"
                        value={service.duration_minutes}
                        onChange={(e) =>
                          updateService(service.id, { duration_minutes: Number(e.target.value) })
                        }
                      >
                        {[30, 45, 60, 90, 120].map((value) => (
                          <option key={value} value={value}>
                            {value} min
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Preço
                      <input
                        className="input-base"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Opcional"
                        value={service.price ?? ""}
                        onChange={(e) =>
                          updateService(service.id, {
                            price: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </label>
                    <button
                      className="booking-icon-button"
                      aria-label="Remover serviço"
                      onClick={() =>
                        setServices((current) => current.filter((item) => item.id !== service.id))
                      }
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
              {!services.length && (
                <div className="booking-empty">
                  <CalendarDays />
                  <p>Adicione o primeiro serviço que seus clientes poderão agendar.</p>
                </div>
              )}
            </section>
            <section className="premium-panel">
              <div className="booking-section-title">
                <div>
                  <p className="eyebrow">Etapa 2</p>
                  <h2>Horários semanais</h2>
                </div>
              </div>
              <div className="booking-week">
                {DAYS.map((label, weekday) => {
                  const day = availability.find((item) => item.weekday === weekday);
                  return (
                    <div className="booking-day" key={label}>
                      <label>
                        <input
                          type="checkbox"
                          checked={day?.active ?? false}
                          onChange={(e) => updateDay(weekday, { active: e.target.checked })}
                        />
                        <b>{label}</b>
                      </label>
                      <input
                        type="time"
                        value={(day?.start_time ?? "09:00").slice(0, 5)}
                        disabled={!day?.active}
                        onChange={(e) => updateDay(weekday, { start_time: e.target.value })}
                      />
                      <span>até</span>
                      <input
                        type="time"
                        value={(day?.end_time ?? "18:00").slice(0, 5)}
                        disabled={!day?.active}
                        onChange={(e) => updateDay(weekday, { end_time: e.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="booking-rules">
                <label>
                  Antecedência mínima
                  <select
                    className="input-base"
                    value={notice}
                    onChange={(e) => setNotice(Number(e.target.value))}
                  >
                    <option value={0}>Sem limite</option>
                    <option value={2}>2 horas</option>
                    <option value={6}>6 horas</option>
                    <option value={24}>1 dia</option>
                  </select>
                </label>
                <label>
                  Agenda disponível por
                  <select
                    className="input-base"
                    value={ahead}
                    onChange={(e) => setAhead(Number(e.target.value))}
                  >
                    <option value={30}>30 dias</option>
                    <option value={60}>60 dias</option>
                    <option value={90}>90 dias</option>
                  </select>
                </label>
              </div>
            </section>
          </div>
          <button
            className="btn-primary booking-save"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
            {saving ? "Salvando..." : "Salvar e publicar agenda"}
          </button>
        </>
      ) : (
        <section className="premium-panel">
          <div className="booking-section-title">
            <div>
              <p className="eyebrow">Próximos</p>
              <h2>Agendamentos</h2>
            </div>
            <span className="booking-count">
              {appointments.data?.filter((item) => item.status === "confirmed").length ?? 0}{" "}
              confirmados
            </span>
          </div>
          {appointments.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : appointments.data?.length ? (
            <div className="appointment-list">
              {appointments.data.map((item) => (
                <article className={`appointment-row is-${item.status}`} key={item.id}>
                  <div className="appointment-date">
                    <b>
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(
                        new Date(item.start_at),
                      )}
                    </b>
                    <span>
                      {new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
                        new Date(item.start_at),
                      )}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <b>
                      {new Intl.DateTimeFormat("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(item.start_at))}{" "}
                      · {item.booking_services?.name}
                    </b>
                    <span>
                      <UserRound /> {item.client_name} · {item.client_phone}
                    </span>
                  </div>
                  {item.status === "confirmed" && (
                    <div className="appointment-actions">
                      <button
                        aria-label="Concluir"
                        onClick={() => void changeStatus(item.id, "completed")}
                      >
                        <Check />
                      </button>
                      <button
                        aria-label="Cancelar"
                        onClick={() => void changeStatus(item.id, "cancelled")}
                      >
                        <X />
                      </button>
                    </div>
                  )}
                  <span className="appointment-status">
                    {item.status === "confirmed"
                      ? "Confirmado"
                      : item.status === "completed"
                        ? "Concluído"
                        : "Cancelado"}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="booking-empty">
              <CalendarDays />
              <p>Os próximos agendamentos aparecerão aqui.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
