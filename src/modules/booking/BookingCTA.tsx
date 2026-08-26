import { CalendarDays, ChevronRight } from "lucide-react";

export function BookingCTA({ slug, onTrack }: { slug: string; onTrack?: () => void }) {
  return (
    <a className="public-booking-cta" href={`/agendar/${slug}`} onClick={onTrack}>
      <span>
        <CalendarDays />
      </span>
      <div>
        <b>Agendar horário</b>
        <small>Escolha o serviço, dia e horário</small>
      </div>
      <ChevronRight />
    </a>
  );
}
