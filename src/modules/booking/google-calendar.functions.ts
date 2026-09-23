import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

export interface GoogleCalendarTokenData {
  connected: boolean;
  email?: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  connected_at?: string;
  calendar_id?: string;
}

export interface GoogleOAuthPlatformConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

// Escopos necessários para acessar e criar eventos no Google Calendar
const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

/**
 * Helper para obter as credenciais OAuth do Google da plataforma
 * (primeiro verifica variáveis de ambiente, depois configurações no banco de dados)
 */
async function resolveGoogleOAuthCredentials(): Promise<GoogleOAuthPlatformConfig> {
  let clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  // Se não estiver nas variáveis de ambiente, busca nas features do plano 'pro' ou tabela plans
  if (!clientId || !clientSecret) {
    const supabase = getServiceSupabase();
    if (supabase) {
      try {
        const { data: plan } = await supabase
          .from("plans")
          .select("features")
          .eq("slug", "pro")
          .maybeSingle();

        if (plan?.features && typeof plan.features === "object") {
          const features = plan.features as Record<string, unknown>;
          if (!clientId && typeof features.google_client_id === "string") {
            clientId = features.google_client_id;
          }
          if (!clientSecret && typeof features.google_client_secret === "string") {
            clientSecret = features.google_client_secret;
          }
        }
      } catch (err) {
        console.warn("Aviso ao ler credenciais do Google no banco:", err);
      }
    }
  }

  return { clientId, clientSecret };
}

/**
 * 1. Gera a URL de autorização OAuth2 do Google
 */
export const getGoogleAuthUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string; redirectOrigin: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Confirma que a página pertence ao usuário autenticado
    const { data: page, error: pageErr } = await supabase
      .from("bio_pages")
      .select("id, user_id")
      .eq("id", data.bioPageId)
      .maybeSingle();

    if (pageErr || !page || page.user_id !== userId) {
      throw new Error("Página não encontrada ou sem autorização para integrar o Google Agenda.");
    }

    const { clientId } = await resolveGoogleOAuthCredentials();
    if (!clientId) {
      throw new Error(
        "A integração com Google Agenda ainda não possui o Client ID configurado no sistema. Solicite ao Super Admin a configuração no painel.",
      );
    }

    const redirectUri = `${data.redirectOrigin.replace(/\/$/, "")}/_authenticated/google-callback`;

    // Empacota o estado com bioPageId e userId do solicitante
    const statePayload = JSON.stringify({
      bioPageId: data.bioPageId,
      userId,
      ts: Date.now(),
    });
    const state = Buffer.from(statePayload).toString("base64");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_CALENDAR_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  });

/**
 * 2. Processa o callback de autorização do Google, troca o code por tokens e armazena na página
 */
export const handleGoogleAuthCallbackFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { code: string; state: string; redirectOrigin: string }) => {
      if (!data.code) throw new Error("Código de autorização não informado.");
      if (!data.state) throw new Error("Estado de sessão inválido.");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { clientId, clientSecret } = await resolveGoogleOAuthCredentials();
    if (!clientId || !clientSecret) {
      throw new Error("Credenciais do Google OAuth incompletas no servidor.");
    }

    let bioPageId: string;
    let stateUserId: string | undefined;
    try {
      const decoded = JSON.parse(Buffer.from(data.state, "base64").toString("utf-8"));
      bioPageId = decoded.bioPageId;
      stateUserId = decoded.userId;
    } catch {
      throw new Error("Estado OAuth inválido ou expirado.");
    }

    // Se o state registrou um userId, garante que é da mesma sessão autenticada
    if (stateUserId && stateUserId !== userId) {
      throw new Error("Sessão de autorização inválida para este usuário.");
    }

    const redirectUri = `${data.redirectOrigin.replace(/\/$/, "")}/_authenticated/google-callback`;

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Conexão com banco de dados indisponível.");

    // Recupera e valida titularidade da bio_page antes de salvar
    const { data: page, error: pageErr } = await supabase
      .from("bio_pages")
      .select("id, user_id, social_links")
      .eq("id", bioPageId)
      .maybeSingle();

    if (pageErr || !page || page.user_id !== userId) {
      throw new Error("Página não encontrada ou sem permissão para vincular a agenda.");
    }

    // Troca o code por access_token e refresh_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Erro na troca de token do Google:", errorText);
      throw new Error("Falha ao autenticar com o Google. Tente novamente.");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const expiresIn = (tokenData.expires_in as number) || 3600;

    // Busca o e-mail da conta do Google conectada
    let userEmail = "";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        userEmail = userInfo.email || "";
      }
    } catch (e) {
      console.warn("Aviso ao buscar e-mail do Google:", e);
    }

    const currentSocial =
      (page.social_links && typeof page.social_links === "object"
        ? page.social_links
        : {}) as Record<string, unknown>;

    // Mantém o refresh_token antigo se o Google não tiver enviado um novo
    const existingGoogle = (currentSocial.google_calendar || {}) as GoogleCalendarTokenData;
    const finalRefreshToken = refreshToken || existingGoogle.refresh_token;

    if (!finalRefreshToken) {
      throw new Error(
        "O Google não retornou permissão de atualização offline. Desconecte e tente novamente garantindo acesso total.",
      );
    }

    const googleCalendarData: GoogleCalendarTokenData = {
      connected: true,
      email: userEmail || existingGoogle.email || "Conta Google Conectada",
      refresh_token: finalRefreshToken,
      access_token: accessToken,
      expires_at: Date.now() + expiresIn * 1000,
      connected_at: new Date().toISOString(),
      calendar_id: "primary",
    };

    const updatedSocial = {
      ...currentSocial,
      google_calendar: googleCalendarData,
    };

    const { error: updateErr } = await supabase
      .from("bio_pages")
      .update({
        social_links: updatedSocial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bioPageId);

    if (updateErr) throw new Error(`Erro ao salvar conexão: ${updateErr.message}`);

    return {
      success: true,
      email: googleCalendarData.email,
      bioPageId,
    };
  });

/**
 * 3. Obtém o status da conexão da Google Agenda para a página (sem expor tokens sensíveis)
 */
export const getGoogleCalendarStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: page } = await supabase
      .from("bio_pages")
      .select("user_id, social_links")
      .eq("id", data.bioPageId)
      .maybeSingle();

    if (!page || page.user_id !== userId) {
      return { connected: false };
    }

    if (!page?.social_links || typeof page.social_links !== "object") {
      return { connected: false };
    }

    const social = page.social_links as Record<string, unknown>;
    const gCal = social.google_calendar as GoogleCalendarTokenData | undefined;

    if (!gCal || !gCal.connected || !gCal.refresh_token) {
      return { connected: false };
    }

    return {
      connected: true,
      email: gCal.email || "Conta conectada",
      connectedAt: gCal.connected_at,
      calendarId: gCal.calendar_id || "primary",
    };
  });

/**
 * 4. Desconecta a Google Agenda da página
 */
export const disconnectGoogleCalendarFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: page, error: pageErr } = await supabase
      .from("bio_pages")
      .select("id, user_id, social_links")
      .eq("id", data.bioPageId)
      .maybeSingle();

    if (pageErr || !page || page.user_id !== userId) {
      throw new Error("Página não encontrada ou sem permissão para desconectar.");
    }

    const currentSocial =
      (page.social_links && typeof page.social_links === "object"
        ? page.social_links
        : {}) as Record<string, unknown>;

    const updatedSocial = { ...currentSocial };
    delete updatedSocial.google_calendar;

    const adminSupabase = getServiceSupabase() || supabase;
    const { error } = await adminSupabase
      .from("bio_pages")
      .update({
        social_links: updatedSocial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.bioPageId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Helper interno para obter um access_token válido para uma bio_page
 */
async function getValidAccessTokenForPage(
  bioPageId: string,
): Promise<{ accessToken: string; calendarId: string } | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data: page } = await supabase
    .from("bio_pages")
    .select("social_links")
    .eq("id", bioPageId)
    .single();

  if (!page?.social_links || typeof page.social_links !== "object") return null;

  const social = page.social_links as Record<string, unknown>;
  const gCal = social.google_calendar as GoogleCalendarTokenData | undefined;

  if (!gCal || !gCal.connected || !gCal.refresh_token) return null;

  const now = Date.now();
  // Se o access_token ainda for válido (com 60s de folga), reutiliza
  if (gCal.access_token && gCal.expires_at && gCal.expires_at > now + 60000) {
    return {
      accessToken: gCal.access_token,
      calendarId: gCal.calendar_id || "primary",
    };
  }

  // Renova o access_token usando o refresh_token
  const { clientId, clientSecret } = await resolveGoogleOAuthCredentials();
  if (!clientId || !clientSecret) return null;

  try {
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: gCal.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      console.warn("Falha ao renovar token do Google Agenda:", await refreshRes.text());
      return null;
    }

    const refreshData = await refreshRes.json();
    const newAccessToken = refreshData.access_token as string;
    const expiresIn = (refreshData.expires_in as number) || 3600;

    // Atualiza o token renovado no banco de dados silenciosamente
    const updatedGCal: GoogleCalendarTokenData = {
      ...gCal,
      access_token: newAccessToken,
      expires_at: now + expiresIn * 1000,
    };

    await supabase
      .from("bio_pages")
      .update({
        social_links: {
          ...social,
          google_calendar: updatedGCal,
        },
      })
      .eq("id", bioPageId);

    return {
      accessToken: newAccessToken,
      calendarId: gCal.calendar_id || "primary",
    };
  } catch (err) {
    console.error("Erro na renovação do token do Google:", err);
    return null;
  }
}

/**
 * 5. Criação automática de evento na Google Agenda do Dono do Negócio
 * Executado quando um cliente final confirma o agendamento no site!
 */
export const syncGoogleCalendarEventFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      bioPageId: string;
      serviceName: string;
      durationMinutes: number;
      startAt: string;
      endAt: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string | null;
      notes?: string | null;
      appointmentId?: string;
    }) => {
      if (!data.bioPageId || !data.startAt || !data.clientName) {
        throw new Error("Dados insuficientes para sincronização de evento.");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    // 1. Obtém credencial do Google para esta página
    const auth = await getValidAccessTokenForPage(data.bioPageId);
    if (!auth) {
      // Se não estiver conectado, retorna sem erro (não bloqueia o cliente)
      return { synced: false, reason: "google_calendar_not_connected" };
    }

    const { accessToken, calendarId } = auth;

    // Formata descrição detalhada e limpa
    const descriptionLines = [
      `📅 Agendamento confirmado via EIA Link`,
      ``,
      `👤 Cliente: ${data.clientName}`,
      `📱 WhatsApp / Telefone: ${data.clientPhone}`,
      data.clientEmail ? `✉️ E-mail: ${data.clientEmail}` : null,
      `✂️ Serviço: ${data.serviceName} (${data.durationMinutes} minutos)`,
      data.notes ? `📝 Observações do cliente: ${data.notes}` : null,
      ``,
      `Link do atendimento gerado automaticamente pela plataforma.`,
    ].filter(Boolean);

    const eventPayload: Record<string, unknown> = {
      summary: `Agendamento: ${data.clientName} - ${data.serviceName}`,
      description: descriptionLines.join("\n"),
      start: {
        dateTime: data.startAt,
      },
      end: {
        dateTime: data.endAt,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    // Se o cliente informou e-mail válido, convida como participante
    if (data.clientEmail && data.clientEmail.includes("@")) {
      eventPayload.attendees = [{ email: data.clientEmail, displayName: data.clientName }];
    }

    try {
      const eventRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId,
        )}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        },
      );

      if (!eventRes.ok) {
        const errorBody = await eventRes.text();
        console.error("Falha ao criar evento no Google Calendar:", errorBody);
        return { synced: false, error: errorBody };
      }

      const eventCreated = await eventRes.json();

      return {
        synced: true,
        eventId: eventCreated.id as string,
        htmlLink: eventCreated.htmlLink as string,
      };
    } catch (err: unknown) {
      console.error("Erro inesperado ao sincronizar evento Google:", err);
      return {
        synced: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      };
    }
  });

/**
 * 6. Envio de evento teste para o dono verificar a integração no seu próprio celular
 */
export const testGoogleCalendarSyncFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bioPageId: string }) => {
    if (!data.bioPageId) throw new Error("ID da página é obrigatório.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: page } = await supabase
      .from("bio_pages")
      .select("user_id")
      .eq("id", data.bioPageId)
      .maybeSingle();

    if (!page || page.user_id !== userId) {
      throw new Error("Página não encontrada ou sem autorização.");
    }

    const auth = await getValidAccessTokenForPage(data.bioPageId);
    if (!auth) {
      throw new Error(
        "Sua conta do Google Agenda ainda não está conectada. Clique em 'Conectar com o Google Agenda'.",
      );
    }

    const { accessToken, calendarId } = auth;
    const now = new Date();
    const startTime = new Date(now.getTime() + 10 * 60 * 1000); // Daqui a 10 min
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const testPayload = {
      summary: "🎉 Conexão EIA Link Ativa!",
      description:
        "Parabéns! Sua integração com o Google Agenda está 100% ativa. Todos os novos agendamentos feitos no seu site aparecerão aqui automaticamente, sem você precisar clicar em nada.",
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 5 }],
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Falha na API do Google Calendar: ${err}`);
    }

    const created = await res.json();
    return {
      success: true,
      eventId: created.id,
      htmlLink: created.htmlLink,
    };
  });

/**
 * 7. Gestão de Credenciais da API pelo Super Admin (para configurar Client ID e Secret)
 */
export const getGoogleApiCredentialsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const isOwner = (claims.email as string)?.toLowerCase() === "jaimilsonvendas@gmail.com";
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = isOwner || Boolean(roles?.some((r) => r.role === "admin"));
    if (!isAdmin) {
      throw new Error("Acesso restrito a administradores.");
    }

    const creds = await resolveGoogleOAuthCredentials();
    return {
      hasClientId: Boolean(creds.clientId),
      clientId: creds.clientId || "",
      hasClientSecret: Boolean(creds.clientSecret),
      isFromEnv: Boolean(process.env.GOOGLE_CLIENT_ID),
    };
  });

export const saveGoogleApiCredentialsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { clientId: string; clientSecret: string }) => {
      if (!data.clientId?.trim()) throw new Error("Client ID é obrigatório.");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase: userSupabase, userId, claims } = context;
    const isOwner = (claims.email as string)?.toLowerCase() === "jaimilsonvendas@gmail.com";
    const { data: roles } = await userSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = isOwner || Boolean(roles?.some((r) => r.role === "admin"));
    if (!isAdmin) {
      throw new Error("Apenas administradores podem salvar credenciais do Google.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco de dados indisponível.");

    const { data: plans } = await supabase
      .from("plans")
      .select("id, slug, features")
      .in("slug", ["pro", "free"]);

    if (plans && plans.length > 0) {
      for (const plan of plans) {
        const currentFeatures =
          (plan.features && typeof plan.features === "object"
            ? plan.features
            : {}) as Record<string, unknown>;

        await supabase
          .from("plans")
          .update({
            features: {
              ...currentFeatures,
              google_client_id: data.clientId.trim(),
              google_client_secret: data.clientSecret.trim(),
            },
          })
          .eq("id", plan.id);
      }
    }

    return { success: true };
  });

