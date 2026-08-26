export type BookingSettings = {
  id: string;
  bio_page_id: string;
  active: boolean;
  timezone: string;
  min_notice_hours: number;
  max_days_ahead: number;
};

export type BookingService = {
  id: string;
  bio_page_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  active: boolean;
  position: number;
};

export type BookingAvailability = {
  id: string;
  bio_page_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

export type Appointment = {
  id: string;
  bio_page_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  start_at: string;
  end_at: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  confirmation_token: string;
  booking_services?: Pick<BookingService, "name" | "duration_minutes"> | null;
};

export type BookingSlot = { slot_start: string; slot_end: string };
