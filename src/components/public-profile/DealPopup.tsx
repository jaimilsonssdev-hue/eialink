import React, { useState, useEffect } from "react";
import { Gift, X, Sparkles, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type DailyDeal } from "@/modules/deals";
import { ClaimDealModal } from "./ClaimDealModal";

export interface DealPopupProps {
  bioPageId: string;
  businessName: string;
  refPageId?: string;
}

export function DealPopup({ bioPageId, businessName, refPageId }: DealPopupProps) {
  const [deal, setDeal] = useState<DailyDeal | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  // Busca a oferta ativa da própria página
  useEffect(() => {
    let isMounted = true;

    async function loadPageDeal() {
      if (!bioPageId) return;

      try {
        const { data, error } = await (supabase as any)
          .from("daily_deals")
          .select("*")
          .eq("bio_page_id", bioPageId)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn("[DealPopup] Falha ao carregar oferta da página:", error);
          return;
        }

        if (data && isMounted) {
          setDeal({
            id: data.id,
            bio_page_id: data.bio_page_id,
            user_id: data.user_id,
            title: data.title,
            description: data.description,
            original_price: data.original_price != null ? Number(data.original_price) : null,
            deal_price: Number(data.deal_price),
            discount_badge: data.discount_badge,
            image_url: data.image_url,
            claim_action_url: data.claim_action_url,
            city: data.city,
            niche: data.niche,
            starts_at: data.starts_at,
            expires_at: data.expires_at,
            clicks_count: data.clicks_count || 0,
            max_claims: data.max_claims != null ? Number(data.max_claims) : null,
            claims_count: data.claims_count ?? 0,
            is_active: Boolean(data.is_active),
            created_at: data.created_at,
            business_name: businessName,
          });
        }
      } catch (err) {
        console.warn("[DealPopup] Erro inesperado:", err);
      }
    }

    void loadPageDeal();

    return () => {
      isMounted = false;
    };
  }, [bioPageId, businessName]);

  // Checa localStorage para ver se foi dispensado nas últimas 24h
  // Executado exclusivamente no useEffect para evitar hydration mismatch no SSR
  useEffect(() => {
    if (!bioPageId) return;

    try {
      const storageKey = `eia_popup_dismissed_${bioPageId}`;
      const dismissedTimestamp = localStorage.getItem(storageKey);
      if (dismissedTimestamp) {
        const diff = Date.now() - Number(dismissedTimestamp);
        // 24 horas = 86.400.000 ms
        if (diff < 24 * 60 * 60 * 1000) {
          setIsDismissed(true);
          return;
        }
      }
      setIsDismissed(false);
    } catch {
      setIsDismissed(false);
    }
  }, [bioPageId]);

  // Timer para aparecer 4 segundos após carregar a página
  useEffect(() => {
    if (!deal || isDismissed) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [deal, isDismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    try {
      const storageKey = `eia_popup_dismissed_${bioPageId}`;
      localStorage.setItem(storageKey, String(Date.now()));
    } catch (err) {
      console.warn("[DealPopup] Falha ao gravar localStorage:", err);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  if (!deal || isDismissed || !isVisible) {
    return isModalOpen && deal ? (
      <ClaimDealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deal={deal}
        refPageId={refPageId}
      />
    ) : null;
  }

  const isSoldOut = deal.max_claims != null && deal.claims_count >= deal.max_claims;
  const remaining = deal.max_claims != null ? Math.max(0, deal.max_claims - deal.claims_count) : null;

  return (
    <>
      <div
        className="fixed z-40 left-4 bottom-20 sm:bottom-6 sm:left-6 transition-all duration-300 motion-reduce:transition-none"
        role="region"
        aria-label="Cupom de desconto disponível"
      >
        <div
          onClick={handleOpenModal}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-card/95 hover:bg-card border border-border shadow-xl backdrop-blur-xl text-foreground text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 hover:border-emerald-500/40"
        >
          {/* Ícone de presente com badge pulsante */}
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Gift className="h-3.5 w-3.5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          {/* Texto descritivo */}
          <div className="flex flex-col pr-1">
            <span className="text-[11px] sm:text-xs font-bold text-foreground flex items-center gap-1">
              <span>{deal.discount_badge || "🎁 Cupom disponível"}</span>
              <Sparkles className="h-3 w-3 text-emerald-400" />
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[170px] sm:max-w-[210px]">
              {isSoldOut ? (
                <span className="text-destructive font-semibold">Cupons esgotados hoje</span>
              ) : remaining != null ? (
                <span>Restam apenas <strong>{remaining}</strong> cupons</span>
              ) : (
                <span>{deal.title}</span>
              )}
            </span>
          </div>

          {/* Botão X para fechar e gravar 24h no localStorage */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar pop-up de cupom"
            className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Modal de Resgate */}
      <ClaimDealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deal={deal}
        refPageId={refPageId}
        onSuccess={() => {
          setIsVisible(false);
          setIsDismissed(true);
        }}
      />
    </>
  );
}

export default DealPopup;
