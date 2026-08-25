import { MessageCircle, Sparkles } from "lucide-react";
import { FunnelService } from "@/modules/analytics/services/FunnelService";

const FALLBACK_COMMERCIAL_WHATSAPP = "5573997498497";

function commercialWhatsAppNumber() {
  const configured = import.meta.env.VITE_COMMERCIAL_WHATSAPP?.replace(/\D/g, "");
  return configured || FALLBACK_COMMERCIAL_WHATSAPP;
}

const messages = {
  pro: "Olá! Quero assinar o Eialink Pro e liberar os recursos da minha página.",
  help: "Olá! Quero ajuda profissional para configurar meu Eialink.",
  site: "Olá! Conheci a Talento pelo Eialink e quero saber mais sobre um site profissional para minha empresa.",
};

// eslint-disable-next-line react-refresh/only-export-components
export function commercialWhatsAppUrl(kind: keyof typeof messages = "pro") {
  return `https://wa.me/${commercialWhatsAppNumber()}?text=${encodeURIComponent(messages[kind])}`;
}

export function UpgradePrompt({
  title = "Este recurso é do Eialink Pro",
  description = "Desbloqueie recursos profissionais para transformar visitas em contatos e vendas.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-violet-400/30 bg-violet-500/[.08] ${compact ? "p-4" : "p-6"}`}
    >
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/20 text-violet-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <a
            className="btn-primary mt-4"
            href={commercialWhatsAppUrl("pro")}
            target="_blank"
            rel="noreferrer"
            onClick={() => void FunnelService.track("upgrade_click", { source: title })}
          >
            <MessageCircle className="h-4 w-4" /> Desbloquear com o Eialink Pro
          </a>
        </div>
      </div>
    </section>
  );
}
