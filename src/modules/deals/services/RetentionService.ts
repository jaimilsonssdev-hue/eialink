import { supabase } from "@/integrations/supabase/client";
import type { AtRiskCustomer, ReactivationMessageResult } from "../types";

export const RetentionService = {
  /**
   * Identifica clientes em risco de abandono ou com saldo de cashback prestes a expirar.
   */
  async getAtRiskCustomers(businessPageId: string): Promise<AtRiskCustomer[]> {
    if (!businessPageId) return [];

    try {
      // 1. Busca saldos de cashback da loja
      const { data: cashbackRows, error: cashbackError } = await (supabase as any)
        .from("customer_store_cashback")
        .select("customer_whatsapp, balance, last_visit, expires_at")
        .eq("business_page_id", businessPageId);

      if (cashbackError) {
        console.error("[RetentionService] Erro ao buscar cashback:", cashbackError);
      }

      // 2. Busca resgates de cupons da loja (para recuperar nome do cliente e últimas interações)
      const { data: claimRows, error: claimError } = await (supabase as any)
        .from("deal_claims")
        .select("customer_whatsapp, customer_name, created_at, used_at")
        .eq("business_page_id", businessPageId)
        .order("created_at", { ascending: false });

      if (claimError) {
        console.error("[RetentionService] Erro ao buscar resgates:", claimError);
      }

      // Mapa para cruzar informações pelo WhatsApp do cliente
      const customerMap = new Map<
        string,
        {
          whatsapp: string;
          name?: string;
          balance: number;
          lastVisitDate: Date;
          expiresAt?: string | null;
        }
      >();

      // Popula dados a partir do cashback
      (cashbackRows || []).forEach((row: any) => {
        const phone = row.customer_whatsapp;
        if (!phone) return;

        const visitDate = row.last_visit ? new Date(row.last_visit) : new Date();

        customerMap.set(phone, {
          whatsapp: phone,
          balance: Number(row.balance) || 0,
          lastVisitDate: visitDate,
          expiresAt: row.expires_at || null,
        });
      });

      // Cruza e complementa com os resgates de cupons
      (claimRows || []).forEach((row: any) => {
        const phone = row.customer_whatsapp;
        if (!phone) return;

        const claimDate = row.used_at
          ? new Date(row.used_at)
          : row.created_at
            ? new Date(row.created_at)
            : new Date();

        const existing = customerMap.get(phone);

        if (existing) {
          if (!existing.name && row.customer_name?.trim()) {
            existing.name = row.customer_name.trim();
          }
          if (claimDate > existing.lastVisitDate) {
            existing.lastVisitDate = claimDate;
          }
        } else {
          customerMap.set(phone, {
            whatsapp: phone,
            name: row.customer_name?.trim() || undefined,
            balance: 0,
            lastVisitDate: claimDate,
            expiresAt: null,
          });
        }
      });

      const now = Date.now();
      const result: AtRiskCustomer[] = [];

      customerMap.forEach((c) => {
        const daysSinceVisit = Math.max(
          0,
          Math.floor((now - c.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        let status: AtRiskCustomer["status"] = "active";

        // Checa se o cashback está prestes a expirar nos próximos 7 dias
        if (c.balance > 0 && c.expiresAt) {
          const expiryTime = new Date(c.expiresAt).getTime();
          const daysToExpiry = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 7 && daysToExpiry >= -1) {
            status = "expiring_soon";
          }
        }

        // Se não for expiring_soon, avalia o tempo de inatividade
        if (status !== "expiring_soon") {
          if (daysSinceVisit > 45) {
            status = "lost";
          } else if (daysSinceVisit >= 20) {
            status = "at_risk";
          } else {
            status = "active";
          }
        }

        result.push({
          customer_whatsapp: c.whatsapp,
          customer_name: c.name,
          balance: c.balance,
          last_visit: c.lastVisitDate.toISOString(),
          days_since_visit: daysSinceVisit,
          expires_at: c.expiresAt,
          status,
        });
      });

      // Ordena por urgência: expiring_soon primeiro, depois at_risk, depois lost, depois active
      const priorityOrder: Record<AtRiskCustomer["status"], number> = {
        expiring_soon: 1,
        at_risk: 2,
        lost: 3,
        active: 4,
      };

      result.sort((a, b) => {
        const pA = priorityOrder[a.status];
        const pB = priorityOrder[b.status];
        if (pA !== pB) return pA - pB;
        return b.days_since_visit - a.days_since_visit;
      });

      return result;
    } catch (err) {
      console.error("[RetentionService] Erro ao consolidar clientes em risco:", err);
      return [];
    }
  },

  /**
   * Gera uma mensagem humanizada para WhatsApp de reativação com link pronto para disparo.
   */
  generateReactivationMessage(
    customerName: string | undefined,
    businessName: string,
    balance: number,
    daysInactive: number,
    status: string,
    customerWhatsapp: string
  ): ReactivationMessageResult {
    const nameGreeting = customerName?.trim() ? customerName.trim() : "cliente amigo";
    const company = businessName.trim() || "nosso estabelecimento";
    const formattedBalance = `R$ ${balance.toFixed(2).replace(".", ",")}`;

    let text = "";

    if (status === "expiring_soon") {
      text = `Olá ${nameGreeting}! Notamos que você tem ${formattedBalance} de cashback disponível no ${company}. Seu saldo vence em poucos dias! Que tal aproveitar hoje? Venha nos visitar!`;
    } else if (status === "at_risk" || status === "lost") {
      text = `Oi ${nameGreeting}, tudo bem? Sentimos sua falta aqui no ${company}! Já faz ${daysInactive} dias da sua última visita. Preparamos uma condição especial para te receber esta semana. Podemos te esperar?`;
    } else {
      text = `Olá ${nameGreeting}! Passando para agradecer sua preferência no ${company}. Sempre que precisar, estamos à disposição!`;
    }

    const cleanDigits = customerWhatsapp.replace(/\D/g, "");
    const fullPhone =
      cleanDigits.startsWith("55") && cleanDigits.length >= 12
        ? cleanDigits
        : `55${cleanDigits}`;

    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;

    return {
      text,
      whatsappUrl,
    };
  },
};

export default RetentionService;
