import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar,
  Upload,
  Flame,
  ArrowLeft,
  MessageCircle,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { ProspectingService } from "@/modules/prospecting/ProspectingService";
import { buildPreview, type CsvRowPreview } from "@/modules/prospecting/csv";
import {
  buildDedupeKey,
  normalizeName,
  normalizePhone,
  normalizeText,
  normalizeWebsite,
  priorityFromScore,
  scoreCompany,
} from "@/modules/prospecting/scoring";
import {
  CHANNEL_LABEL,
  OUTCOME_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type ProspectChannel,
  type ProspectOutcome,
  type ProspectPriority,
  type ProspectStatus,
  type ProspectedCompany,
} from "@/modules/prospecting/types";

export const Route = createFileRoute("/_authenticated/admin_/prospeccao")({
  head: () => ({
    meta: [
      { title: "Radar de Prospecção — EIA Digital" },
      {
        name: "description",
        content:
          "Motor interno de demanda: importe listas, priorize empresas por score e registre abordagens.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: ProspectingPage,
});

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as ProspectStatus[];
const CHANNEL_OPTIONS = Object.keys(CHANNEL_LABEL) as ProspectChannel[];
const OUTCOME_OPTIONS = Object.keys(OUTCOME_LABEL) as ProspectOutcome[];

const PRIORITY_STYLE: Record<ProspectPriority, string> = {
  alta: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
  media: "bg-[color:var(--primary)]/15 text-[color:var(--primary)]",
  baixa: "bg-surface-elevated text-muted-foreground",
};

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function whatsappLink(company: ProspectedCompany) {
  const phone = company.whatsapp ?? company.phone;
  if (!phone) return null;
  const text = `Olá, ${company.name}! Aqui é da EIA Digital. Vi que a empresa ainda não tem uma página profissional na internet e preparei uma sugestão gratuita de presença digital para vocês. Posso te mostrar?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function ProspectingPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ProspectStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | ProspectPriority>("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<CsvRowPreview[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<ProspectedCompany | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["prospecting", "companies"],
    queryFn: ProspectingService.list,
  });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["prospecting", "companies"] });

  const importMutation = useMutation({
    mutationFn: (drafts: Parameters<typeof ProspectingService.importMany>[0]) =>
      ProspectingService.importMany(drafts),
    onSuccess: ({ inserted }) => {
      setFeedback(`${inserted} empresa(s) importada(s) com sucesso.`);
      setPreview(null);
      invalidate();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProspectStatus }) =>
      ProspectingService.updateStatus(id, status),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => ProspectingService.remove(id),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: ProspectingService.create,
    onSuccess: () => {
      setFeedback("Empresa adicionada ao radar.");
      invalidate();
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchStatus = statusFilter === "all" || company.status === statusFilter;
      const matchPriority = priorityFilter === "all" || company.priority === priorityFilter;
      const matchTerm =
        !term ||
        [company.name, company.niche, company.city, company.whatsapp]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchStatus && matchPriority && matchTerm;
    });
  }, [companies, priorityFilter, search, statusFilter]);

  const metrics = useMemo(() => {
    const untouched = companies.filter((item) => item.status === "novo");
    return {
      total: companies.length,
      high: companies.filter((item) => item.priority === "alta").length,
      untouched: untouched.length,
      answered: companies.filter((item) =>
        ["respondeu", "reuniao", "proposta", "cliente"].includes(item.status),
      ).length,
      clients: companies.filter((item) => item.status === "cliente").length,
      todayDone: companies.filter((item) => isToday(item.last_contacted_at)).length,
    };
  }, [companies]);

  const attackList = useMemo(
    () =>
      companies
        .filter(
          (item) =>
            ["novo", "contatado", "respondeu"].includes(item.status) &&
            !isToday(item.last_contacted_at),
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    [companies],
  );

  async function handleFile(file: File) {
    setFeedback(null);
    const content = await file.text();
    const keys = await ProspectingService.listDedupeKeys();
    setPreview(buildPreview(content, keys));
  }

  const importable = (preview ?? []).filter((row) => row.draft && !row.duplicateOf);

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = normalizeName(String(form.get("name") ?? ""));
    if (!name) {
      setFeedback("Informe o nome da empresa.");
      return;
    }
    const whatsapp = normalizePhone(String(form.get("whatsapp") ?? ""));
    const website = normalizeWebsite(String(form.get("website") ?? ""));
    const city = normalizeText(String(form.get("city") ?? ""));
    const base = {
      name,
      niche: normalizeText(String(form.get("niche") ?? "")),
      city,
      state: null,
      phone: whatsapp,
      whatsapp,
      email: null,
      instagram: null,
      website,
      has_website: Boolean(website),
      rating: null,
      reviews_count: null,
      notes: null,
      source: "manual",
      status: "novo" as const,
    };
    const score = scoreCompany(base);
    createMutation.mutate({
      ...base,
      score,
      priority: priorityFromScore(score),
      dedupe_key: buildDedupeKey({
        name: base.name,
        city: base.city,
        whatsapp: base.whatsapp,
        phone: base.phone,
        instagram: null,
      }),
    });
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Super Admin
          </Link>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 mt-1">
            <Radar className="h-6 w-6 text-[color:var(--accent)]" /> Radar de Prospecção
          </h1>
          <p className="text-sm text-muted-foreground">
            Motor de demanda: importe listas, priorize por score e registre cada abordagem.
          </p>
        </div>
      </header>

      {feedback && (
        <div className="rounded-xl border border-border bg-surface-elevated/60 px-4 py-3 text-sm">
          {feedback}
        </div>
      )}

      {/* Radar */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Empresas", value: metrics.total },
          { label: "Prioridade alta", value: metrics.high },
          { label: "Sem abordagem", value: metrics.untouched },
          { label: "Em conversa", value: metrics.answered },
          { label: "Clientes", value: metrics.clients },
          { label: "Contatos hoje", value: metrics.todayDone },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-display text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Ataque de hoje */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 text-[color:var(--accent)]" /> Ataque de Hoje
        </h2>
        <p className="text-sm text-muted-foreground">
          As 10 melhores oportunidades ainda não trabalhadas hoje.
        </p>
        <ul className="mt-4 space-y-2">
          {attackList.map((company) => (
            <li
              key={company.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{company.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[company.niche, company.city].filter(Boolean).join(" · ") || "Sem detalhes"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLE[company.priority]}`}>
                  {company.score}
                </span>
                {whatsappLink(company) && (
                  <a
                    href={whatsappLink(company)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                  onClick={() => setActiveCompany(company)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registrar
                </button>
              </div>
            </li>
          ))}
          {!attackList.length && (
            <li className="text-sm text-muted-foreground">
              Nenhuma oportunidade pendente. Importe uma nova lista.
            </li>
          )}
        </ul>
      </section>

      {/* Importação CSV */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Upload className="h-5 w-5" /> Importar lista (CSV)
        </h2>
        <p className="text-sm text-muted-foreground">
          Colunas reconhecidas: nome, nicho, cidade, estado, telefone, whatsapp, email, instagram,
          site, nota, avaliações, observação. Os dados são normalizados, deduplicados e pontuados
          antes de salvar.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {preview && (
          <div className="space-y-3">
            <p className="text-sm">
              {importable.length} nova(s) · {preview.filter((r) => r.duplicateOf).length}{" "}
              duplicada(s) · {preview.filter((r) => r.error).length} com erro
            </p>
            <div className="max-h-80 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Empresa</th>
                    <th className="px-3 py-2">Nicho</th>
                    <th className="px-3 py-2">Cidade</th>
                    <th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.line} className="border-t border-border/60">
                      <td className="px-3 py-2">{row.draft?.name ?? `Linha ${row.line}`}</td>
                      <td className="px-3 py-2">{row.draft?.niche ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.city ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.whatsapp ?? "—"}</td>
                      <td className="px-3 py-2">{row.draft?.score ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {row.error
                          ? row.error
                          : row.duplicateOf
                            ? `Duplicada (${row.duplicateOf})`
                            : "Pronta para importar"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)]"
                style={{ background: "var(--gradient-primary)" }}
                disabled={!importable.length || importMutation.isPending}
                onClick={() =>
                  importMutation.mutate(importable.map((row) => row.draft!).filter(Boolean))
                }
              >
                {importMutation.isPending ? "Importando..." : `Importar ${importable.length}`}
              </button>
              <button
                className="rounded-xl border border-border px-4 py-2 text-sm"
                onClick={() => setPreview(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Cadastro manual */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Adicionar empresa
        </h2>
        <form onSubmit={handleManualSubmit} className="mt-3 grid gap-3 sm:grid-cols-5">
          <input name="name" placeholder="Nome" className="input-field" />
          <input name="niche" placeholder="Nicho" className="input-field" />
          <input name="city" placeholder="Cidade" className="input-field" />
          <input name="whatsapp" placeholder="WhatsApp" className="input-field" />
          <input name="website" placeholder="Site (se tiver)" className="input-field" />
          <button
            type="submit"
            className="rounded-xl border border-border px-4 py-2 text-sm sm:col-span-5 sm:w-fit"
          >
            Salvar no radar
          </button>
        </form>
      </section>

      {/* Pipeline */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold mr-auto">Pipeline</h2>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
            className="input-field"
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="all">Todas as etapas</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
          >
            <option value="all">Todas as prioridades</option>
            {(Object.keys(PRIORITY_LABEL) as ProspectPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Etapa</th>
                <th className="px-3 py-2">Último contato</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[company.niche, company.city, company.has_website ? "tem site" : "sem site"]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-semibold">{company.score}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLE[company.priority]}`}
                    >
                      {PRIORITY_LABEL[company.priority]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input-field"
                      value={company.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          id: company.id,
                          status: event.target.value as ProspectStatus,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {company.last_contacted_at
                      ? new Date(company.last_contacted_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => setActiveCompany(company)}
                      >
                        Abordagem
                      </button>
                      <button
                        className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground"
                        onClick={() => removeMutation.mutate(company.id)}
                        aria-label={`Remover ${company.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {activeCompany && (
        <ActivityDialog
          company={activeCompany}
          onClose={() => setActiveCompany(null)}
          onSaved={() => {
            setActiveCompany(null);
            setFeedback("Abordagem registrada.");
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function ActivityDialog({
  company,
  onClose,
  onSaved,
}: {
  company: ProspectedCompany;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [channel, setChannel] = useState<ProspectChannel>("whatsapp");
  const [outcome, setOutcome] = useState<ProspectOutcome>("enviado");
  const [status, setStatus] = useState<ProspectStatus>(
    company.status === "novo" ? "contatado" : company.status,
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["prospecting", "activities", company.id],
    queryFn: () => ProspectingService.listActivities(company.id),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      ProspectingService.registerActivity({
        companyId: company.id,
        channel,
        outcome,
        notes: notes.trim() || null,
        status,
      }),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-lg font-bold">Registrar abordagem</h3>
        <p className="text-sm text-muted-foreground">{company.name}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            className="input-field"
            value={channel}
            onChange={(event) => setChannel(event.target.value as ProspectChannel)}
          >
            {CHANNEL_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {CHANNEL_LABEL[item]}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as ProspectOutcome)}
          >
            {OUTCOME_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {OUTCOME_LABEL[item]}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProspectStatus)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="input-field w-full"
          rows={3}
          placeholder="Observações da conversa"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {error && <p className="text-sm text-[color:var(--destructive)]">{error}</p>}

        <div className="max-h-40 overflow-auto text-xs text-muted-foreground space-y-1">
          {(historyQuery.data ?? []).map((activity) => (
            <p key={activity.id}>
              {new Date(activity.created_at).toLocaleString("pt-BR")} ·{" "}
              {CHANNEL_LABEL[activity.channel]} · {OUTCOME_LABEL[activity.outcome]}
              {activity.notes ? ` · ${activity.notes}` : ""}
            </p>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded-xl border border-border px-4 py-2 text-sm" onClick={onClose}>
            Fechar
          </button>
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)]"
            style={{ background: "var(--gradient-primary)" }}
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
