import { useState } from "react";
import { Star, ShieldAlert, Sparkles, MessageSquareHeart, ExternalLink, ThumbsUp } from "lucide-react";

interface GoogleReputationBoosterProps {
  businessName: string;
  googleReviewUrl?: string | null;
  ownerWhatsApp?: string | null;
}

export function GoogleReputationBooster({
  businessName,
  googleReviewUrl,
  ownerWhatsApp,
}: GoogleReputationBoosterProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const cleanReviewUrl = googleReviewUrl?.trim() || `https://www.google.com/search?q=${encodeURIComponent(businessName + " avaliar")}`;
  const cleanPhone = (ownerWhatsApp || "").replace(/\D/g, "");

  const handleLowRatingWhatsApp = () => {
    const message = `Olá! Estive na *${businessName}* recentemente e gostaria de falar diretamente com a gerência sobre meu atendimento.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="my-6 w-full rounded-2xl border border-amber-500/20 bg-gradient-to-b from-card to-card/60 p-5 shadow-lg text-center space-y-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sua Opinião Importa</span>
        </div>
        <h3 className="text-base font-bold font-display text-foreground">
          Como foi sua experiência com a gente?
        </h3>
        <p className="text-xs text-muted-foreground">
          Toque nas estrelas para avaliar nosso atendimento
        </p>
      </div>

      {/* Seletor de Estrelas */}
      <div className="flex items-center justify-center gap-2 py-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hoverRating ?? selectedRating ?? 0) >= star;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setSelectedRating(star)}
              className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
              aria-label={`Avaliar com ${star} estrela(s)`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : "text-muted-foreground/40 hover:text-amber-400/60"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Cenário A: 4 ou 5 Estrelas -> Envia para o Google Maps */}
      {selectedRating !== null && selectedRating >= 4 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <ThumbsUp className="h-4 w-4" />
            <span>Ficamos muito felizes com a sua nota!</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Poderia nos ajudar dedicando 30 segundos para compartilhar essa avaliação no nosso Google oficial?
          </p>
          <a
            href={cleanReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <span>Publicar Avaliação no Google ⭐⭐⭐⭐⭐</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Cenário B: 1, 2 ou 3 Estrelas -> Filtro Anti-Hater (SAC Privado no WhatsApp) */}
      {selectedRating !== null && selectedRating < 4 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Sentimos muito por não superar suas expectativas!</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Queremos corrigir isso imediatamente. Fale diretamente com a nossa gerência pelo canal exclusivo abaixo:
          </p>
          {cleanPhone ? (
            <button
              type="button"
              onClick={handleLowRatingWhatsApp}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <MessageSquareHeart className="h-3.5 w-3.5" />
              <span>Falar com a Gerência no WhatsApp</span>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Por favor, informe nosso balcão para que possamos te atender melhor.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

