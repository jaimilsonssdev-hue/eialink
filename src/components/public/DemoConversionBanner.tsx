import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface DemoConversionBannerProps {
  companyName: string;
  agencyWhatsApp?: string;
}

export function DemoConversionBanner({
  companyName,
  agencyWhatsApp = (import.meta.env.VITE_AGENCY_WHATSAPP as string) || "5573991487816",
}: DemoConversionBannerProps) {
  const cleanPhone = agencyWhatsApp.replace(/\D/g, "");
  const message = `Olá! Vi a demonstração que vocês criaram para a empresa *${companyName}* no EIA Link e gostaria de ativar nossa presença oficial com domínio próprio. Como podemos fazer?`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <aside
      aria-label="Aviso de demonstração"
      data-no-triage="true"
      className="sticky top-0 z-50 w-full border-b border-[color:var(--primary)]/30 bg-background/85 px-4 py-2.5 backdrop-blur-md shadow-lg shadow-[color:var(--primary)]/5"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--primary)]/20 text-[color:var(--primary)]">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </span>
          <div>
            <p className="font-semibold leading-tight text-foreground">
              Demonstração criada para <span className="text-[color:var(--primary)]">{companyName}</span>
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Exemplo de presença digital profissional com alta conversão.
            </p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-no-triage="true"
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold text-[color:var(--primary-foreground)] shadow-md transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Ativar Meu Link Oficial</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </aside>
  );
}

