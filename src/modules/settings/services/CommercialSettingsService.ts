import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "eialink-commercial-whatsapp";
const DEFAULT_COMMERCIAL_FALLBACK = "5573997498497";

export function sanitizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // Se o usuário digitou sem DDD/País (ex: 10 ou 11 dígitos no Brasil), garante prefixo 55
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const withoutCountry = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (withoutCountry.length === 11) {
    return withoutCountry.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (withoutCountry.length === 10) {
    return withoutCountry.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits;
}

export const CommercialSettingsService = {
  getInitialCachedNumber(): string {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim()) return sanitizePhoneDigits(cached);
    }
    const envNum =
      (import.meta.env.VITE_COMMERCIAL_WHATSAPP as string) ||
      (import.meta.env.VITE_AGENCY_WHATSAPP as string);
    if (envNum && envNum.trim()) return sanitizePhoneDigits(envNum);
    return DEFAULT_COMMERCIAL_FALLBACK;
  },

  async getCommercialWhatsApp(): Promise<string> {
    const cached = this.getInitialCachedNumber();

    try {
      // 1. Tenta carregar do plano pro no Supabase (público / aberto via RLS)
      const { data, error } = await supabase
        .from("plans")
        .select("features")
        .eq("slug", "pro")
        .maybeSingle();

      if (!error && data?.features) {
        const features = data.features as Record<string, unknown>;
        const dbPhone = features.commercial_whatsapp as string | undefined;
        if (dbPhone && dbPhone.trim()) {
          const sanitized = sanitizePhoneDigits(dbPhone);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, sanitized);
          }
          return sanitized;
        }
      }
    } catch (err) {
      console.warn("Aviso ao buscar WhatsApp comercial remoto:", err);
    }

    return cached;
  },

  async updateCommercialWhatsApp(newPhone: string): Promise<string> {
    const sanitized = sanitizePhoneDigits(newPhone);
    if (!sanitized) throw new Error("Número de WhatsApp inválido.");

    // Atualiza cache local imediatamente
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, sanitized);
    }

    // 1. Atualiza nos planos cadastrados para que todos os clientes/anônimos leiam
    try {
      const { data: plans } = await supabase
        .from("plans")
        .select("id, slug, features")
        .in("slug", ["pro", "free"]);

      if (plans && plans.length > 0) {
        for (const plan of plans) {
          const currentFeatures = (plan.features as Record<string, unknown>) || {};
          await supabase
            .from("plans")
            .update({
              features: {
                ...currentFeatures,
                commercial_whatsapp: sanitized,
              },
            })
            .eq("id", plan.id);
        }
      }
    } catch (planErr) {
      console.warn("Aviso ao atualizar WhatsApp nos planos:", planErr);
    }

    // 2. Atualiza no perfil do usuário atual (Super Admin)
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase
          .from("profiles")
          .update({ whatsapp: sanitized })
          .eq("id", auth.user.id);
      }
    } catch (profErr) {
      console.warn("Aviso ao atualizar perfil do super admin:", profErr);
    }

    return sanitized;
  },
};

/** Hook React reativo para obter o WhatsApp comercial atual */
export function useCommercialWhatsApp(): string {
  const [phone, setPhone] = useState<string>(() =>
    CommercialSettingsService.getInitialCachedNumber(),
  );

  useEffect(() => {
    let isMounted = true;
    CommercialSettingsService.getCommercialWhatsApp().then((resolved) => {
      if (isMounted && resolved && resolved !== phone) {
        setPhone(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [phone]);

  return phone;
}

