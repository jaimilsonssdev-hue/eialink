/**
 * Registro de ferramentas do Agente (somente servidor).
 * Cada ferramenta roda com o cliente Supabase do USUÁRIO LOGADO (RLS) e confere a posse da página.
 * Para dar uma nova capacidade à IA basta adicionar um item em TOOLS.
 */
import type { ToolSchema } from "./providers";

export interface ToolContext {
  supabase: any;
  userId: string;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** "read" executa direto; "write" exige confirmação do usuário (ou permissão permanente) */
  risk: "read" | "write";
  /** Texto exibido ao usuário na confirmação */
  summarize: (args: Record<string, any>) => string;
  execute: (args: Record<string, any>, ctx: ToolContext) => Promise<unknown>;
}

const PAGE_ID_PARAM = {
  type: "string",
  description:
    "ID da página/negócio (UUID). Opcional se o usuário tiver apenas uma página; caso contrário use listar_paginas antes.",
};

async function resolvePage(ctx: ToolContext, pageId?: string) {
  if (pageId) {
    const { data, error } = await ctx.supabase
      .from("bio_pages")
      .select("id, slug, display_name, description, whatsapp, instagram, published, social_links")
      .eq("id", pageId)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Página não encontrada ou não pertence a este usuário.");
    return data;
  }

  const { data, error } = await ctx.supabase
    .from("bio_pages")
    .select("id, slug, display_name, description, whatsapp, instagram, published, social_links")
    .eq("user_id", ctx.userId)
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("O usuário ainda não possui nenhuma página criada.");
  if (data.length > 1) {
    const lista = data.map((p: any) => `${p.display_name} (id: ${p.id})`).join("; ");
    throw new Error(`O usuário tem várias páginas. Pergunte qual usar ou informe pagina_id. Opções: ${lista}`);
  }
  return data[0];
}

function slugId(label: string, index: number) {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `opcao-${index + 1}`;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const TOOLS: ToolDef[] = [
  /* ------------------------------ LEITURA ------------------------------ */
  {
    name: "listar_paginas",
    description: "Lista as páginas/negócios do usuário (id, nome, slug, se está publicada).",
    risk: "read",
    parameters: { type: "object", properties: {} },
    summarize: () => "Listar páginas do usuário",
    async execute(_args, ctx) {
      const { data, error } = await ctx.supabase
        .from("bio_pages")
        .select("id, slug, display_name, published, template_id, whatsapp")
        .eq("user_id", ctx.userId)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
  {
    name: "consultar_agenda",
    description:
      "Consulta a configuração da agenda de uma página: se está ativa, serviços, horários de atendimento e próximos agendamentos.",
    risk: "read",
    parameters: { type: "object", properties: { pagina_id: PAGE_ID_PARAM } },
    summarize: () => "Consultar a agenda",
    async execute(args, ctx) {
      const page = await resolvePage(ctx, args.pagina_id);
      const [settings, services, availability, appointments] = await Promise.all([
        ctx.supabase.from("booking_settings").select("*").eq("bio_page_id", page.id).maybeSingle(),
        ctx.supabase.from("booking_services").select("*").eq("bio_page_id", page.id).order("position"),
        ctx.supabase.from("booking_availability").select("*").eq("bio_page_id", page.id).order("weekday"),
        ctx.supabase
          .from("appointments")
          .select("client_name, client_phone, start_at, end_at, status, booking_services(name)")
          .eq("bio_page_id", page.id)
          .gte("start_at", new Date().toISOString())
          .order("start_at")
          .limit(20),
      ]);
      return {
        pagina: { id: page.id, nome: page.display_name, slug: page.slug },
        configuracao: settings.data ?? "agenda ainda não inicializada",
        servicos: services.data ?? [],
        horarios: availability.data ?? [],
        proximos_agendamentos: appointments.data ?? [],
      };
    },
  },
  {
    name: "consultar_agente_atendimento",
    description: "Consulta a configuração atual do Agente de Atendimento (chat) da página.",
    risk: "read",
    parameters: { type: "object", properties: { pagina_id: PAGE_ID_PARAM } },
    summarize: () => "Consultar o agente de atendimento",
    async execute(args, ctx) {
      const page = await resolvePage(ctx, args.pagina_id);
      const social = (page.social_links as Record<string, any>) || {};
      return {
        pagina: { id: page.id, nome: page.display_name },
        chat_flow: social.chat_flow ?? "usando configuração padrão (nunca personalizado)",
      };
    },
  },

  /* ------------------------------ ESCRITA ------------------------------ */
  {
    name: "configurar_agenda",
    description:
      "Cria/atualiza a agenda online de uma página: ativa/desativa, define serviços (por nome, não apaga os existentes) e horários de atendimento por dia da semana.",
    risk: "write",
    parameters: {
      type: "object",
      properties: {
        pagina_id: PAGE_ID_PARAM,
        ativa: { type: "boolean", description: "Liga ou desliga os agendamentos online." },
        antecedencia_minima_horas: { type: "number", description: "Antecedência mínima para agendar, em horas." },
        dias_maximos_futuro: { type: "number", description: "Até quantos dias no futuro se pode agendar." },
        servicos: {
          type: "array",
          description: "Serviços a criar ou atualizar (identificados pelo nome).",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              duracao_minutos: { type: "number" },
              preco: { type: "number" },
              descricao: { type: "string" },
            },
            required: ["nome", "duracao_minutos"],
          },
        },
        horarios: {
          type: "array",
          description: "Horários por dia da semana (0=domingo ... 6=sábado).",
          items: {
            type: "object",
            properties: {
              dia_semana: { type: "number" },
              inicio: { type: "string", description: "HH:MM" },
              fim: { type: "string", description: "HH:MM" },
              ativo: { type: "boolean" },
            },
            required: ["dia_semana", "inicio", "fim"],
          },
        },
      },
    },
    summarize(a) {
      const parts: string[] = [];
      if (typeof a.ativa === "boolean") parts.push(a.ativa ? "ativar a agenda online" : "desativar a agenda online");
      if (a.servicos?.length)
        parts.push(`salvar ${a.servicos.length} serviço(s): ${a.servicos.map((s: any) => s.nome).join(", ")}`);
      if (a.horarios?.length) parts.push(`definir horários em ${a.horarios.length} dia(s) da semana`);
      if (a.antecedencia_minima_horas != null) parts.push(`antecedência mínima de ${a.antecedencia_minima_horas}h`);
      if (a.dias_maximos_futuro != null) parts.push(`agendamento até ${a.dias_maximos_futuro} dias à frente`);
      return `Configurar agenda: ${parts.join("; ") || "sem alterações"}`;
    },
    async execute(a, ctx) {
      const page = await resolvePage(ctx, a.pagina_id);
      const db = ctx.supabase;
      const done: string[] = [];

      // 1. Configuração base (preserva valores existentes)
      const { data: current } = await db
        .from("booking_settings")
        .select("*")
        .eq("bio_page_id", page.id)
        .maybeSingle();
      const settings = {
        bio_page_id: page.id,
        timezone: current?.timezone || "America/Bahia",
        active: typeof a.ativa === "boolean" ? a.ativa : (current?.active ?? false),
        min_notice_hours: a.antecedencia_minima_horas ?? current?.min_notice_hours ?? 2,
        max_days_ahead: a.dias_maximos_futuro ?? current?.max_days_ahead ?? 30,
        updated_at: new Date().toISOString(),
      };
      const { error: sErr } = await db.from("booking_settings").upsert(settings, { onConflict: "bio_page_id" });
      if (sErr) throw new Error(`Falha ao salvar configuração: ${sErr.message}`);
      done.push(`agenda ${settings.active ? "ativa" : "inativa"}`);

      // 2. Horários (padrão seg-sex 09-18 se nunca definidos e não informados)
      if (Array.isArray(a.horarios) && a.horarios.length) {
        const rows = a.horarios.map((h: any) => {
          const inicio = String(h.inicio);
          const fim = String(h.fim);
          if (!TIME_RE.test(inicio) || !TIME_RE.test(fim)) throw new Error(`Horário inválido: ${inicio}-${fim} (use HH:MM).`);
          const dia = Number(h.dia_semana);
          if (!Number.isInteger(dia) || dia < 0 || dia > 6) throw new Error(`dia_semana inválido: ${h.dia_semana}.`);
          return { bio_page_id: page.id, weekday: dia, start_time: inicio, end_time: fim, active: h.ativo !== false };
        });
        const { error } = await db.from("booking_availability").upsert(rows, { onConflict: "bio_page_id,weekday" });
        if (error) throw new Error(`Falha ao salvar horários: ${error.message}`);
        done.push(`${rows.length} dia(s) de horário`);
      } else {
        const { data: existing } = await db.from("booking_availability").select("id").eq("bio_page_id", page.id).limit(1);
        if (!existing?.length) {
          const rows = [1, 2, 3, 4, 5].map((weekday) => ({
            bio_page_id: page.id,
            weekday,
            start_time: "09:00",
            end_time: "18:00",
            active: true,
          }));
          await db.from("booking_availability").insert(rows);
          done.push("horário padrão seg-sex 09h-18h criado");
        }
      }

      // 3. Serviços (upsert por nome; nunca apaga)
      if (Array.isArray(a.servicos) && a.servicos.length) {
        const { data: existing } = await db.from("booking_services").select("id, name, position").eq("bio_page_id", page.id);
        const byName = new Map<string, any>((existing ?? []).map((s: any) => [String(s.name).trim().toLowerCase(), s]));
        let position = existing?.length ?? 0;
        for (const s of a.servicos) {
          const name = String(s.nome || "").trim();
          if (!name) continue;
          const duration = Number(s.duracao_minutos);
          if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Duração inválida para "${name}".`);
          const payload = {
            bio_page_id: page.id,
            name,
            description: s.descricao ? String(s.descricao) : null,
            duration_minutes: Math.round(duration),
            price: s.preco == null ? null : Number(s.preco),
            active: true,
            updated_at: new Date().toISOString(),
          };
          const found = byName.get(name.toLowerCase());
          const { error } = found
            ? await db.from("booking_services").update(payload).eq("id", found.id).eq("bio_page_id", page.id)
            : await db.from("booking_services").insert({ ...payload, position: position++ });
          if (error) throw new Error(`Falha ao salvar serviço "${name}": ${error.message}`);
        }
        done.push(`${a.servicos.length} serviço(s) salvos`);
      }

      return { ok: true, pagina: page.display_name, aplicado: done, link_agendamento: `/agendar/${page.slug}` };
    },
  },
  {
    name: "configurar_agente_atendimento",
    description:
      "Configura o Agente de Atendimento (chat) exibido no site: nome do assistente, mensagem de boas-vindas e botões de opção rápida.",
    risk: "write",
    parameters: {
      type: "object",
      properties: {
        pagina_id: PAGE_ID_PARAM,
        nome_assistente: { type: "string" },
        mensagem_boas_vindas: { type: "string" },
        opcoes: {
          type: "array",
          description: "Botões do chat. Substituem os atuais quando informados.",
          items: {
            type: "object",
            properties: {
              rotulo: { type: "string" },
              tipo: {
                type: "string",
                description: "text (resposta fixa), services (lista serviços), budget (orçamento), location (endereço/horários) ou whatsapp.",
              },
              icone: { type: "string", description: "Um emoji." },
              resposta: { type: "string", description: "Texto da resposta do assistente." },
            },
            required: ["rotulo", "tipo"],
          },
        },
      },
    },
    summarize(a) {
      const parts: string[] = [];
      if (a.nome_assistente) parts.push(`nome "${a.nome_assistente}"`);
      if (a.mensagem_boas_vindas) parts.push("nova mensagem de boas-vindas");
      if (a.opcoes?.length) parts.push(`${a.opcoes.length} botão(ões): ${a.opcoes.map((o: any) => o.rotulo).join(", ")}`);
      return `Configurar agente de atendimento: ${parts.join("; ") || "sem alterações"}`;
    },
    async execute(a, ctx) {
      const page = await resolvePage(ctx, a.pagina_id);
      const social = ((page.social_links as Record<string, any>) || {}) as Record<string, any>;
      const flow: Record<string, any> = { ...(social.chat_flow || {}) };

      if (a.nome_assistente) flow.assistantName = String(a.nome_assistente);
      if (a.mensagem_boas_vindas) flow.welcomeMessage = String(a.mensagem_boas_vindas);
      if (Array.isArray(a.opcoes) && a.opcoes.length) {
        const valid = ["text", "services", "budget", "location", "whatsapp"];
        flow.options = a.opcoes.map((o: any, i: number) => {
          const tipo = valid.includes(o.tipo) ? o.tipo : "text";
          return {
            id: slugId(String(o.rotulo), i),
            label: String(o.rotulo),
            icon: o.icone ? String(o.icone) : undefined,
            actionType: tipo,
            replyText: o.resposta ? String(o.resposta) : undefined,
          };
        });
      }

      const { error } = await ctx.supabase
        .from("bio_pages")
        .update({ social_links: { ...social, chat_flow: flow }, updated_at: new Date().toISOString() })
        .eq("id", page.id)
        .eq("user_id", ctx.userId);
      if (error) throw new Error(`Falha ao salvar agente: ${error.message}`);
      return { ok: true, pagina: page.display_name, chat_flow: flow };
    },
  },
  {
    name: "atualizar_dados_pagina",
    description: "Atualiza dados básicos do negócio na página: nome, descrição, WhatsApp, Instagram, endereço e horário de funcionamento.",
    risk: "write",
    parameters: {
      type: "object",
      properties: {
        pagina_id: PAGE_ID_PARAM,
        nome: { type: "string" },
        descricao: { type: "string" },
        whatsapp: { type: "string", description: "Somente números com DDD, ex: 71999998888." },
        instagram: { type: "string" },
        endereco: { type: "string" },
        horario_funcionamento: { type: "string" },
      },
    },
    summarize(a) {
      const campos = ["nome", "descricao", "whatsapp", "instagram", "endereco", "horario_funcionamento"].filter(
        (k) => a[k] != null && a[k] !== "",
      );
      return `Atualizar dados da página: ${campos.join(", ") || "sem alterações"}`;
    },
    async execute(a, ctx) {
      const page = await resolvePage(ctx, a.pagina_id);
      const social = ((page.social_links as Record<string, any>) || {}) as Record<string, any>;
      const update: Record<string, any> = { updated_at: new Date().toISOString() };

      if (a.nome) update.display_name = String(a.nome).trim();
      if (a.descricao != null) update.description = String(a.descricao);
      if (a.whatsapp) update.whatsapp = String(a.whatsapp).replace(/\D/g, "");
      if (a.instagram) update.instagram = String(a.instagram).trim();
      const nextSocial = { ...social };
      if (a.endereco) nextSocial.address = String(a.endereco);
      if (a.horario_funcionamento) nextSocial.opening_hours = String(a.horario_funcionamento);
      update.social_links = nextSocial;

      const { error } = await ctx.supabase.from("bio_pages").update(update).eq("id", page.id).eq("user_id", ctx.userId);
      if (error) throw new Error(`Falha ao atualizar página: ${error.message}`);
      return { ok: true, pagina: update.display_name || page.display_name };
    },
  },
  {
    name: "publicar_pagina",
    description: "Publica ou despublica a página (torna o site visível ou não no link público).",
    risk: "write",
    parameters: {
      type: "object",
      properties: {
        pagina_id: PAGE_ID_PARAM,
        publicada: { type: "boolean", description: "true para publicar, false para tirar do ar." },
      },
      required: ["publicada"],
    },
    summarize: (a) => (a.publicada ? "Publicar a página (ficará visível ao público)" : "Despublicar a página (sairá do ar)"),
    async execute(a, ctx) {
      const page = await resolvePage(ctx, a.pagina_id);
      const { error } = await ctx.supabase
        .from("bio_pages")
        .update({ published: Boolean(a.publicada), updated_at: new Date().toISOString() })
        .eq("id", page.id)
        .eq("user_id", ctx.userId);
      if (error) throw new Error(`Falha ao alterar publicação: ${error.message}`);
      return { ok: true, pagina: page.display_name, publicada: Boolean(a.publicada), link: `/p/${page.slug}` };
    },
  },
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

export const TOOL_SCHEMAS: ToolSchema[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  parameters: t.parameters,
}));

