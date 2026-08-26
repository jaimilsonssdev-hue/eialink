import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  BookingAvailability,
  BookingService as Service,
  BookingSettings,
  BookingSlot,
} from "./types";

// Booking tables are introduced by the Agenda Essencial migration.
/* eslint-disable @typescript-eslint/no-explicit-any */
const store = supabase as never as {
  from: (table: string) => any;
  rpc: (name: string, args: any) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const DEFAULT_AVAILABILITY = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start_time: "09:00",
  end_time: "18:00",
  active: true,
}));

export const BookingService = {
  async getWorkspace(bioPageId: string) {
    const [
      { data: settings, error: settingsError },
      { data: services, error: servicesError },
      { data: availability, error: availabilityError },
    ] = await Promise.all([
      store.from("booking_settings").select("*").eq("bio_page_id", bioPageId).maybeSingle(),
      store.from("booking_services").select("*").eq("bio_page_id", bioPageId).order("position"),
      store.from("booking_availability").select("*").eq("bio_page_id", bioPageId).order("weekday"),
    ]);
    const error = settingsError || servicesError || availabilityError;
    if (error) throw new Error(error.message);
    return {
      settings: settings as BookingSettings | null,
      services: (services ?? []) as Service[],
      availability: (availability ?? []) as BookingAvailability[],
    };
  },

  async initialize(bioPageId: string) {
    const { error: settingsError } = await store
      .from("booking_settings")
      .upsert(
        { bio_page_id: bioPageId, active: false, timezone: "America/Bahia" },
        { onConflict: "bio_page_id", ignoreDuplicates: true },
      );
    if (settingsError) throw new Error(settingsError.message);
    const { data: existing } = await store
      .from("booking_availability")
      .select("id")
      .eq("bio_page_id", bioPageId)
      .limit(1);
    if (!existing?.length) {
      const { error } = await store
        .from("booking_availability")
        .insert(DEFAULT_AVAILABILITY.map((day) => ({ ...day, bio_page_id: bioPageId })));
      if (error) throw new Error(error.message);
    }
    return this.getWorkspace(bioPageId);
  },

  async saveSettings(
    bioPageId: string,
    input: Pick<BookingSettings, "active" | "min_notice_hours" | "max_days_ahead">,
  ) {
    const { error } = await store.from("booking_settings").upsert(
      {
        bio_page_id: bioPageId,
        timezone: "America/Bahia",
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bio_page_id" },
    );
    if (error) throw new Error(error.message);
  },

  async saveAvailability(bioPageId: string, days: BookingAvailability[]) {
    const payload = days.map(({ weekday, start_time, end_time, active }) => ({
      bio_page_id: bioPageId,
      weekday,
      start_time,
      end_time,
      active,
    }));
    const { error } = await store
      .from("booking_availability")
      .upsert(payload, { onConflict: "bio_page_id,weekday" });
    if (error) throw new Error(error.message);
  },

  async saveServices(bioPageId: string, services: Service[]) {
    const existing = await this.getWorkspace(bioPageId);
    const retained = new Set(
      services.filter((item) => !item.id.startsWith("draft-")).map((item) => item.id),
    );
    const removed = existing.services
      .filter((item) => !retained.has(item.id))
      .map((item) => item.id);
    if (removed.length) {
      const { error } = await store
        .from("booking_services")
        .delete()
        .in("id", removed)
        .eq("bio_page_id", bioPageId);
      if (error)
        throw new Error(
          "Não é possível excluir um serviço que já possui agendamentos. Desative-o.",
        );
    }
    for (const [position, service] of services.entries()) {
      const payload = {
        bio_page_id: bioPageId,
        name: service.name.trim(),
        description: service.description?.trim() || null,
        duration_minutes: Number(service.duration_minutes),
        price: service.price === null ? null : Number(service.price),
        active: service.active,
        position,
        updated_at: new Date().toISOString(),
      };
      const query = service.id.startsWith("draft-")
        ? store.from("booking_services").insert(payload)
        : store
            .from("booking_services")
            .update(payload)
            .eq("id", service.id)
            .eq("bio_page_id", bioPageId);
      const { error } = await query;
      if (error) throw new Error(error.message);
    }
  },

  async listAppointments(bioPageId: string): Promise<Appointment[]> {
    const { data, error } = await store
      .from("appointments")
      .select("*, booking_services(name,duration_minutes)")
      .eq("bio_page_id", bioPageId)
      .gte("start_at", new Date(Date.now() - 86_400_000).toISOString())
      .order("start_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as Appointment[];
  },

  async updateAppointment(id: string, status: Appointment["status"]) {
    const { error } = await store
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getPublicConfig(bioPageId: string) {
    const [{ data: settings }, { data: services }, { data: availability }] = await Promise.all([
      store
        .from("booking_settings")
        .select("*")
        .eq("bio_page_id", bioPageId)
        .eq("active", true)
        .maybeSingle(),
      store
        .from("booking_services")
        .select("*")
        .eq("bio_page_id", bioPageId)
        .eq("active", true)
        .order("position"),
      store
        .from("booking_availability")
        .select("*")
        .eq("bio_page_id", bioPageId)
        .eq("active", true)
        .order("weekday"),
    ]);
    return {
      settings: settings as BookingSettings | null,
      services: (services ?? []) as Service[],
      availability: (availability ?? []) as BookingAvailability[],
    };
  },

  async getSlots(bioPageId: string, serviceId: string, date: string): Promise<BookingSlot[]> {
    const { data, error } = await store.rpc("get_booking_slots", {
      _bio_page_id: bioPageId,
      _service_id: serviceId,
      _date: date,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as BookingSlot[];
  },

  async createAppointment(input: {
    bioPageId: string;
    serviceId: string;
    startAt: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
  }) {
    const { data, error } = await store.rpc("create_public_appointment", {
      _bio_page_id: input.bioPageId,
      _service_id: input.serviceId,
      _start_at: input.startAt,
      _client_name: input.clientName,
      _client_phone: input.clientPhone,
      _client_email: input.clientEmail || null,
      _notes: input.notes || null,
    });
    if (error) throw new Error(error.message);
    return data?.[0] as { appointment_id: string; confirmation_token: string; end_at: string };
  },
};
