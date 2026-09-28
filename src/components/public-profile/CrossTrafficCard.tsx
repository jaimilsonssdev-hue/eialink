import React, { useEffect, useState } from "react";
import { Gift, ExternalLink, Sparkles } from "lucide-react";
import { CrossTrafficService, type CrossTrafficPartnership } from "@/modules/deals";

export interface CrossTrafficCardProps {
  bioPageId: string;
  className?: string;
}

export function CrossTrafficCard({ bioPageId, className = "" }: CrossTrafficCardProps) {
  const [partnerships, setPartnerships] = useState<CrossTrafficPartnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPartnerships() {
      if (!bioPageId) {
        setLoading(false);
        return;
      }
      try {
        const data = await CrossTrafficService.getPartnershipsForPage(bioPageId);
        if (isMounted) {
          setPartnerships(data);
        }
      } catch (err) {
        console.warn("[CrossTrafficCard] Falha ao carregar parcerias:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPartnerships();

    return () => {
      isMounted = false;
    };
  }, [bioPageId]);

  if (loading || partnerships.length === 0) {
    return null;
  }

  const handlePartnerClick = (partnership: CrossTrafficPartnership) => {
    void CrossTrafficService.trackPartnershipClick(partnership.id);
  };

  return (
    <div className={`w-full max-w-xl mx-auto space-y-4 my-6 ${className}`}>
      {partnerships.map((partnership) => {
        const partnerUrl = partnership.partner_slug
          ? `/p/${partnership.partner_slug}`
          : "#";
        const badgeLabel = partnership.badge_label || "Cortesia de Parceiro da Rede";

        return (
          <div
            key={partnership.id}
            className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-card/80 to-purple-500/10 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl"
          >
            {/* Linha decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-500 opacity-60" />

            {/* Cabeçalho do Card */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 shadow-inner">
                <Gift className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-amber-300/90 flex items-center gap-1">
                {badgeLabel}
                <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
              </span>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {partnership.partner_avatar ? (
                  <img
                    src={partnership.partner_avatar}
                    alt={partnership.partner_name || "Parceiro"}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover border border-white/10 shadow-sm"
                  />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {(partnership.partner_name || "P").slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                    {partnership.partner_name || "Parceiro da Rede"}
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-400 font-medium leading-snug">
                    {partnership.benefit_text}
                  </p>
                </div>
              </div>

              {/* Botão de Ação */}
              <a
                href={partnerUrl}
                onClick={() => handlePartnerClick(partnership)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 active:scale-95 text-foreground border border-white/15 hover:border-amber-400/30 transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <span>Ver Perfil do Parceiro</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CrossTrafficCard;
