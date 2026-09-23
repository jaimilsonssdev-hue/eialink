import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type {
  ComandaSettings,
  ComandaOrder,
  WaiterCall,
  ComandaItem,
  ComandaOrderStatus,
} from "./types";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

async function checkIsAdmin(supabase: any, userId: string, email?: string): Promise<boolean> {
  const isOwner = email?.toLowerCase() === "jaimilsonvendas@gmail.com";
  if (isOwner) return true;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return Boolean(roles?.some((r: any) => r.role === "admin"));
}

const DEFAULT_SETTINGS: ComandaSettings = {
  enabled: true,
  mode: "waiter",
  allow_call_waiter: true,
  call_options: [
    "Atendimento na Mesa",
    "Pedir a Conta",
    "Gelo e Limão",
    "Dúvida no Cardápio",
  ],
  waiters: [
    {
      id: "w-1",
      name: "Garçom 01",
      pin: "1234",
      card_code: "garcom-01",
      active: true,
      color: "#8B5CF6",
    },
  ],
  tables: Array.from({ length: 10 }, (_, i) => ({
    id: `tab-${i + 1}`,
    number: String(i + 1).padStart(2, "0"),
    card_code: `mesa-${String(i + 1).padStart(2, "0")}`,
    active: true,
  })),
};

/**
 * 1. Obter configurações da Comanda Digital para uma bioPage (Apenas dono da página ou Admin)
 */
export const getComandaSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase: userSupabase, userId, claims } = context;
    const supabase = getServiceSupabase();
    if (!supabase) return { settings: DEFAULT_SETTINGS, slug: "" };

    const { data: page } = await supabase
      .from("bio_pages")
      .select("id, user_id, slug, social_links")
      .eq("id", data.bioPageId)
      .maybeSingle();

    if (!page) return { settings: DEFAULT_SETTINGS, slug: "" };

    const isOwner = page.user_id === userId;
    const isAdmin = await checkIsAdmin(userSupabase, userId, claims.email as string);
    if (!isOwner && !isAdmin) {
      throw new Error("Acesso não autorizado.");
    }

    const social = (page.social_links as Record<string, unknown>) || {};
    const settings = (social.comanda_settings as ComandaSettings) || DEFAULT_SETTINGS;

    return {
      settings,
      slug: page.slug,
    };
  });

/**
 * 2. Salvar configurações da Comanda Digital (Mesas, Garçons, Modo) - Apenas dono ou Admin
 */
export const saveComandaSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string; settings: ComandaSettings }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase: userSupabase, userId, claims } = context;
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { data: page, error: fetchErr } = await supabase
      .from("bio_pages")
      .select("id, user_id, social_links")
      .eq("id", data.bioPageId)
      .single();

    if (fetchErr || !page) throw new Error("Página não encontrada.");

    const isOwner = page.user_id === userId;
    const isAdmin = await checkIsAdmin(userSupabase, userId, claims.email as string);
    if (!isOwner && !isAdmin) {
      throw new Error("Acesso não autorizado.");
    }

    const social = (page.social_links as Record<string, unknown>) || {};

    const { error: updateErr } = await supabase
      .from("bio_pages")
      .update({
        social_links: {
          ...social,
          comanda_settings: data.settings,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.bioPageId);

    if (updateErr) throw new Error(updateErr.message);

    return { success: true };
  });

/**
 * 3. Enviar Pedido da Comanda (Pelo cliente na mesa via QR Code/NFC ou pelo Garçom)
 */
export const submitComandaOrderFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      bioPageId: string;
      tableNumber: string;
      waiterId?: string | null;
      waiterName?: string | null;
      items: ComandaItem[];
      customerName?: string | null;
      customerPhone?: string | null;
      notes?: string | null;
    }) => {
      if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
      if (!data.tableNumber) throw new Error("Número da mesa é obrigatório.");
      if (!data.items || data.items.length === 0) {
        throw new Error("Selecione pelo menos um item para pedir.");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    // Verifica modo do restaurante (garçom vs cozinha direta)
    const { data: page } = await supabase
      .from("bio_pages")
      .select("user_id, social_links")
      .eq("id", data.bioPageId)
      .single();

    if (!page) throw new Error("Página da empresa não encontrada.");

    const social = (page.social_links as Record<string, unknown>) || {};
    const settings = (social.comanda_settings as ComandaSettings) || DEFAULT_SETTINGS;

    const initialStatus: ComandaOrderStatus =
      settings.mode === "kitchen_direct" ? "in_kitchen" : "pending_waiter";

    const total = data.items.reduce(
      (acc, item) => acc + item.price * (item.quantity || 1),
      0,
    );

    const orderPayload: Omit<ComandaOrder, "id"> = {
      bio_page_id: data.bioPageId,
      table_number: data.tableNumber,
      waiter_id: data.waiterId || null,
      waiter_name: data.waiterName || null,
      items: data.items,
      total,
      customer_name: data.customerName || null,
      customer_phone: data.customerPhone || null,
      status: initialStatus,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data: request, error } = await supabase
      .from("service_requests")
      .insert({
        bio_page_id: data.bioPageId,
        user_id: page.user_id,
        service_type: "comanda_order",
        status: initialStatus,
        message: JSON.stringify(orderPayload),
        notes: `Mesa ${data.tableNumber}${data.waiterName ? ` • Garçom ${data.waiterName}` : ""}`,
        source: data.waiterId ? "waiter_app" : "customer_qr_nfc",
      })
      .select("id, created_at")
      .single();

    if (error) throw new Error(`Falha ao registrar pedido: ${error.message}`);

    return {
      orderId: request.id,
      status: initialStatus,
      total,
      tableNumber: data.tableNumber,
      createdAt: request.created_at,
    };
  });

/**
 * 4. Chamar Garçom (com alerta sonoro instantâneo para a equipe)
 */
export const callWaiterFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      bioPageId: string;
      tableNumber: string;
      reason: string;
      waiterId?: string | null;
      waiterName?: string | null;
    }) => {
      if (!data.bioPageId || !data.tableNumber) {
        throw new Error("Identificação da mesa é obrigatória.");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { data: page } = await supabase
      .from("bio_pages")
      .select("user_id")
      .eq("id", data.bioPageId)
      .single();

    if (!page) throw new Error("Empresa não encontrada.");

    const callPayload: Omit<WaiterCall, "id"> = {
      bio_page_id: data.bioPageId,
      table_number: data.tableNumber,
      waiter_id: data.waiterId || null,
      waiter_name: data.waiterName || null,
      reason: data.reason || "Atendimento na Mesa",
      status: "calling",
      created_at: new Date().toISOString(),
    };

    const { data: request, error } = await supabase
      .from("service_requests")
      .insert({
        bio_page_id: data.bioPageId,
        user_id: page.user_id,
        service_type: "waiter_call",
        status: "calling",
        message: JSON.stringify(callPayload),
        notes: `Chamado da Mesa ${data.tableNumber}: ${data.reason}`,
        source: "customer_bell",
      })
      .select("id, created_at")
      .single();

    if (error) throw new Error(`Falha ao chamar garçom: ${error.message}`);

    return {
      callId: request.id,
      tableNumber: data.tableNumber,
      status: "calling",
      createdAt: request.created_at,
    };
  });

// Rate limiter em memória contra ataques de força bruta no PIN dos garçons
interface WaiterLoginAttempt {
  attempts: number;
  blockedUntil?: number;
}
const waiterLoginAttempts = new Map<string, WaiterLoginAttempt>();

function checkWaiterRateLimit(key: string): { blocked: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = waiterLoginAttempts.get(key);
  if (!record) return { blocked: false };

  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingMs = record.blockedUntil - now;
    const waitMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    return { blocked: true, waitMinutes };
  }

  if (record.blockedUntil && record.blockedUntil <= now) {
    waiterLoginAttempts.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
}

function recordFailedWaiterAttempt(key: string): { blocked: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = waiterLoginAttempts.get(key) || { attempts: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.blockedUntil = now + 5 * 60 * 1000; // Bloqueio temporário de 5 minutos
    waiterLoginAttempts.set(key, record);
    return { blocked: true, waitMinutes: 5 };
  }

  waiterLoginAttempts.set(key, record);
  return { blocked: false };
}

function clearWaiterAttempts(key: string) {
  waiterLoginAttempts.delete(key);
}

/**
 * 5. Login rápido do Garçom por PIN de 4 dígitos (com proteção anti-força bruta)
 */
export const waiterLoginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { bioPageId: string; pin: string }) => {
    if (!data.bioPageId) throw new Error("Página da empresa não informada.");
    if (!data.pin || data.pin.length < 4) throw new Error("Informe o PIN de 4 dígitos.");
    return data;
  })
  .handler(async ({ data }) => {
    const rateCheck = checkWaiterRateLimit(data.bioPageId);
    if (rateCheck.blocked) {
      throw new Error(
        `Muitas tentativas com PIN incorreto. Por segurança, aguarde ${rateCheck.waitMinutes} minuto(s) antes de tentar novamente.`,
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { data: page } = await supabase
      .from("bio_pages")
      .select("id, display_name, social_links")
      .eq("id", data.bioPageId)
      .single();

    if (!page) throw new Error("Empresa não encontrada.");

    const social = (page.social_links as Record<string, unknown>) || {};
    const settings = (social.comanda_settings as ComandaSettings) || DEFAULT_SETTINGS;

    const waiter = settings.waiters.find(
      (w) => w.active && String(w.pin).trim() === String(data.pin).trim(),
    );

    if (!waiter) {
      const lockResult = recordFailedWaiterAttempt(data.bioPageId);
      if (lockResult.blocked) {
        throw new Error(
          `Limite de tentativas excedido (5 erros). O acesso a este painel foi temporariamente bloqueado por ${lockResult.waitMinutes} minutos por segurança.`,
        );
      }
      throw new Error("PIN incorreto ou garçom desativado.");
    }

    // Sucesso: reseta histórico de falhas
    clearWaiterAttempts(data.bioPageId);

    return {
      authenticated: true,
      restaurantName: page.display_name,
      waiter: {
        id: waiter.id,
        name: waiter.name,
        card_code: waiter.card_code,
        color: waiter.color || "#8B5CF6",
      },
    };
  });

/**
 * 6. Listagem do Dashboard do Garçom (Chamados e Pedidos ativos)
 */
export const listWaiterDashboardFn = createServerFn({ method: "POST" })
  .inputValidator((data: { bioPageId: string; waiterId?: string | null }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) return { calls: [], orders: [] };

    // Busca chamados das últimas 12 horas
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: records } = await supabase
      .from("service_requests")
      .select("id, service_type, status, message, notes, created_at, updated_at")
      .eq("bio_page_id", data.bioPageId)
      .in("service_type", ["waiter_call", "comanda_order"])
      .gte("created_at", twelveHoursAgo)
      .order("created_at", { ascending: false });

    const calls: WaiterCall[] = [];
    const orders: ComandaOrder[] = [];

    for (const row of records ?? []) {
      try {
        const payload = JSON.parse(row.message || "{}");
        if (row.service_type === "waiter_call") {
          calls.push({
            id: row.id,
            bio_page_id: data.bioPageId,
            table_number: payload.table_number || "Mesa",
            waiter_id: payload.waiter_id || null,
            waiter_name: payload.waiter_name || null,
            reason: payload.reason || "Atendimento",
            status: row.status as any,
            created_at: row.created_at,
          });
        } else if (row.service_type === "comanda_order") {
          orders.push({
            id: row.id,
            bio_page_id: data.bioPageId,
            table_number: payload.table_number || "Mesa",
            waiter_id: payload.waiter_id || null,
            waiter_name: payload.waiter_name || null,
            items: payload.items || [],
            total: payload.total || 0,
            customer_name: payload.customer_name || null,
            customer_phone: payload.customer_phone || null,
            status: row.status as ComandaOrderStatus,
            notes: payload.notes || null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }
      } catch (e) {
        console.warn("Erro ao fazer parse do pedido:", e);
      }
    }

    return {
      calls: calls.filter((c) => c.status === "calling"),
      orders: orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    };
  });

/**
 * 7. Listagem da Cozinha (KDS)
 */
export const listKitchenDashboardFn = createServerFn({ method: "POST" })
  .inputValidator((data: { bioPageId: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) return { orders: [] };

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: records } = await supabase
      .from("service_requests")
      .select("id, status, message, created_at, updated_at")
      .eq("bio_page_id", data.bioPageId)
      .eq("service_type", "comanda_order")
      .in("status", ["in_kitchen", "ready"])
      .gte("created_at", twelveHoursAgo)
      .order("created_at", { ascending: true }); // Mais antigos primeiro para fila da cozinha

    const orders: ComandaOrder[] = [];

    for (const row of records ?? []) {
      try {
        const payload = JSON.parse(row.message || "{}");
        orders.push({
          id: row.id,
          bio_page_id: data.bioPageId,
          table_number: payload.table_number || "Mesa",
          waiter_id: payload.waiter_id || null,
          waiter_name: payload.waiter_name || null,
          items: payload.items || [],
          total: payload.total || 0,
          customer_name: payload.customer_name || null,
          customer_phone: payload.customer_phone || null,
          status: row.status as ComandaOrderStatus,
          notes: payload.notes || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      } catch (e) {
        console.warn("Erro ao fazer parse do pedido:", e);
      }
    }

    return { orders };
  });

/**
 * 8. Atualizar Status do Pedido (Ex: Garçom aprova para Cozinha, Cozinha marca Pronto, Garçom entrega)
 */
export const updateComandaOrderStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      orderId: string;
      status: ComandaOrderStatus;
      bioPageId: string;
    }) => {
      if (!data.orderId) throw new Error("ID do pedido é obrigatório.");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: data.status,
      })
      .eq("id", data.orderId)
      .eq("bio_page_id", data.bioPageId);

    if (error) throw new Error(error.message);

    return { success: true, status: data.status };
  });

/**
 * 9. Atender / Silenciar Chamado de Mesa do Garçom
 */
export const dismissWaiterCallFn = createServerFn({ method: "POST" })
  .inputValidator((data: { callId: string; bioPageId: string }) => {
    if (!data.callId) throw new Error("ID do chamado é obrigatório.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "attended",
      })
      .eq("id", data.callId)
      .eq("bio_page_id", data.bioPageId);

    if (error) throw new Error(error.message);

    return { success: true };
  });

/**
 * 10. Resolução de Link Dinâmico (QR Code / NFC Curto)
 * Ex: /r/carlos-01 ou /r/mesa-04
 */
export const resolveDynamicCodeFn = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => {
    if (!data.code) throw new Error("Código dinâmico não informado.");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const cleanCode = data.code.trim().toLowerCase();

    // Busca todas as páginas publicadas que possuem comanda configurada
    const { data: pages } = await supabase
      .from("bio_pages")
      .select("id, slug, display_name, social_links")
      .eq("published", true);

    if (!pages || pages.length === 0) {
      throw new Error("Nenhum restaurante ativo encontrado.");
    }

    for (const page of pages) {
      const social = (page.social_links as Record<string, unknown>) || {};
      const settings = social.comanda_settings as ComandaSettings | undefined;
      if (!settings) continue;

      // 1. Verifica se é o cartão de um garçom específico
      const waiter = settings.waiters?.find(
        (w) => w.active && (w.card_code?.toLowerCase() === cleanCode || w.id === cleanCode),
      );
      if (waiter) {
        return {
          found: true,
          slug: page.slug,
          restaurantName: page.display_name,
          bioPageId: page.id,
          waiterId: waiter.id,
          waiterName: waiter.name,
          tableNumber: null,
          targetUrl: `/p/${page.slug}?garcom=${encodeURIComponent(waiter.name)}&wid=${encodeURIComponent(waiter.id)}`,
        };
      }

      // 2. Verifica se é a plaquinha de uma mesa específica
      const table = settings.tables?.find(
        (t) => t.active && (t.card_code?.toLowerCase() === cleanCode || t.number?.toLowerCase() === cleanCode),
      );
      if (table) {
        // Se a mesa tem um garçom atribuído, inclui
        const assignedWaiter = table.assigned_waiter_id
          ? settings.waiters?.find((w) => w.id === table.assigned_waiter_id)
          : null;

        const params = new URLSearchParams({ mesa: table.number });
        if (assignedWaiter) {
          params.set("garcom", assignedWaiter.name);
          params.set("wid", assignedWaiter.id);
        }

        return {
          found: true,
          slug: page.slug,
          restaurantName: page.display_name,
          bioPageId: page.id,
          waiterId: assignedWaiter?.id || null,
          waiterName: assignedWaiter?.name || null,
          tableNumber: table.number,
          targetUrl: `/p/${page.slug}?${params.toString()}`,
        };
      }
    }

    // Se não encontrou código específico mas coincide com o slug de um restaurante
    const matchedSlugPage = pages.find((p) => p.slug.toLowerCase() === cleanCode);
    if (matchedSlugPage) {
      return {
        found: true,
        slug: matchedSlugPage.slug,
        restaurantName: matchedSlugPage.display_name,
        bioPageId: matchedSlugPage.id,
        waiterId: null,
        waiterName: null,
        tableNumber: null,
        targetUrl: `/p/${matchedSlugPage.slug}`,
      };
    }

    throw new Error(`Código de mesa ou cartão '${cleanCode}' não encontrado.`);
  });

