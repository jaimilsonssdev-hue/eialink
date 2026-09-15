import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Sparkles,
  ExternalLink,
  Loader2,
  Instagram,
  Bot,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pencil,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Check,
  Ban,
  ArchiveRestore,
  Globe2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import { formatPhone } from "@/modules/prospecting/scoring";
import { buildWhatsAppMessage } from "@/modules/prospecting/copyTemplates";
import type {
  ProspectedCompany,
  ProspectStatus,
} from "@/modules/prospecting/types";

export interface DemoInfoResult {
  url: string | null;
  pageId: string | null;
  slug: string | null;
  modelName: string | null;
  page?: any;
}

export interface ProspectingKanbanProps {
  companies: ProspectedCompany[];
  onStatusChange: (id: string, status: ProspectStatus) => void;
  onGenerateDemo: (company: ProspectedCompany) => void;
  creatingPageId: string | null;
  onRegenerateDemo: (company: ProspectedCompany) => void;
  regeneratingPageId: string | null;
  onMakeOfficial: (company: ProspectedCompany, pageId: string) => void;
  actionLoadingId: string | null;
  onAuditCompany: (company: ProspectedCompany) => void;
  onRegisterApproach: (company: ProspectedCompany) => void;
  onDeleteCompany: (company: ProspectedCompany) => void;
  onSetWhatsApp: (company: ProspectedCompany) => void;
  onInstagramApproach: (company: ProspectedCompany) => void;
  parseDemoInfo: (company: ProspectedCompany) => DemoInfoResult;
  copiedInstagramCompanyId: string | null;
}

interface PipelineColumnConfig {
  key: ProspectStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  borderColor: string;
  description: string;
}

const PIPELINE_COLUMNS: PipelineColumnConfig[] = [
  {
    key: "novo",
    label: "Novo Lead",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/15",
    badgeText: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
    borderColor: "border-blue-500/30",
    description: "Aguardando primeiro contato",
  },
  {
    key: "contatado",
    label: "Abordado",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/15",
    badgeText: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    borderColor: "border-amber-500/30",
    description: "Mensagem ou demo enviada",
  },
  {
    key: "respondeu",
    label: "Em Conversa",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/15",
    badgeText: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
    borderColor: "border-purple-500/30",
    description: "Respondeu à abordagem",
  },
  {
    key: "reuniao",
    label: "Reunião / Demo",
    badgeBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    dotColor: "bg-cyan-500",
    borderColor: "border-cyan-500/30",
    description: "Apresentação de proposta/demo",
  },
  {
    key: "proposta",
    label: "Proposta",
    badgeBg: "bg-orange-500/10 dark:bg-orange-500/15",
    badgeText: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
    borderColor: "border-orange-500/30",
    description: "Valores e condições enviadas",
  },
  {
    key: "cliente",
    label: "Fechou / Cliente",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    borderColor: "border-emerald-500/30",
    description: "Contrato fechado com sucesso!",
  },
];

export function ProspectingKanban({
  companies,
  onStatusChange,
  onGenerateDemo,
  creatingPageId,
  onRegenerateDemo,
  regeneratingPageId,
  onMakeOfficial,
  actionLoadingId,
  onAuditCompany,
  onRegisterApproach,
  onDeleteCompany,
  onSetWhatsApp,
  onInstagramApproach,
  parseDemoInfo,
  copiedInstagramCompanyId,
}: ProspectingKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ProspectStatus | null>(null);
  const [showDiscarded, setShowDiscarded] = useState(false);

  // Agrupa empresas por status
  const columnsMap = useMemo(() => {
    const map = new Map<ProspectStatus, ProspectedCompany[]>();
    for (const col of PIPELINE_COLUMNS) {
      map.set(col.key, []);
    }
    map.set("descartado", []);

    for (const c of companies) {
      const list = map.get(c.status) || map.get("novo")!;
      list.push(c);
    }

    // Ordena cada coluna por score decrescente (quentes no topo)
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => b.score - a.score);
      map.set(key, list);
    }

    return map;
  }, [companies]);

  const discardedCompanies = columnsMap.get("descartado") ?? [];

  function getNextStatus(current: ProspectStatus): ProspectStatus | null {
    const idx = PIPELINE_COLUMNS.findIndex((col) => col.key === current);
    if (idx >= 0 && idx < PIPELINE_COLUMNS.length - 1) {
      return PIPELINE_COLUMNS[idx + 1].key;
    }
    return null;
  }

  function getPrevStatus(current: ProspectStatus): ProspectStatus | null {
    const idx = PIPELINE_COLUMNS.findIndex((col) => col.key === current);
    if (idx > 0) {
      return PIPELINE_COLUMNS[idx - 1].key;
    }
    return null;
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (colKey: ProspectStatus) => {
    setDragOverCol(colKey);
  };

  const handleDrop = (e: React.DragEvent, colKey: ProspectStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      onStatusChange(id, colKey);
    }
    setDragOverCol(null);
    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Quadro Horizontal com as 6 Colunas Ativas do Pipeline */}
      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 min-w-[1320px] items-start">
          {PIPELINE_COLUMNS.map((col) => {
            const list = columnsMap.get(col.key) ?? [];
            const isDropActive = dragOverCol === col.key;

            return (
              <div
                key={col.key}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`flex-1 min-w-[210px] max-w-[240px] rounded-2xl border bg-muted/20 flex flex-col transition-all duration-200 ${
                  isDropActive
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5 shadow-lg scale-[1.01]"
                    : "border-border/60 hover:border-border"
                }`}
              >
                {/* Header da Coluna */}
                <div className="p-3 border-b border-border/50 flex items-center justify-between bg-card/60 rounded-t-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor} shrink-0`} />
                    <h3 className="text-xs font-bold text-foreground truncate tracking-tight" title={col.description}>
                      {col.label}
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 ${col.badgeBg} ${col.badgeText}`}
                  >
                    {list.length}
                  </span>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="p-2 space-y-2.5 flex-1 min-h-[460px] max-h-[720px] overflow-y-auto no-scrollbar">
                  {list.length === 0 ? (
                    <div
                      className={`h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-center p-3 transition-colors ${
                        isDropActive ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground/60"
                      }`}
                    >
                      <p className="text-[11px]">Arraste oportunidades para esta etapa</p>
                    </div>
                  ) : (
                    list.map((company) => {
                      const demo = parseDemoInfo(company);
                      const isOfficial = company.notes?.includes("[Página Oficializada]") || company.status === "cliente";
                      const nextStatus = getNextStatus(company.status);
                      const prevStatus = getPrevStatus(company.status);
                      const isBeingDragged = draggedId === company.id;

                      const waText = buildWhatsAppMessage(company);
                      const phone = company.whatsapp || company.phone;
                      const cleanPhone = phone?.replace(/\D/g, "");
                      const waHref = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}` : null;

                      return (
                        <div
                          key={company.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, company.id)}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-xl border bg-card p-3 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? "opacity-40 border-dashed border-primary"
                              : "border-border/70 hover:border-primary/50"
                          }`}
                        >
                          {/* Topo do Card: Temperatura + Setas Rápidas de Avanço */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <LeadTemperatureBadge score={company.score} className="scale-90 origin-left" />

                            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              {prevStatus && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(company.id, prevStatus);
                                  }}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                                  title={`Voltar para: ${prevStatus}`}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {nextStatus && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(company.id, nextStatus);
                                  }}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold"
                                  title={`Avançar para: ${nextStatus}`}
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Nome da Empresa & Local */}
                          <div className="mb-2">
                            <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2" title={company.name}>
                              {company.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground flex-wrap">
                              {company.niche && (
                                <span className="px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium truncate max-w-[120px]">
                                  {company.niche}
                                </span>
                              )}
                              {company.city && (
                                <span className="truncate max-w-[100px] opacity-80">
                                  {company.city}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge de Site */}
                          <div className="flex items-center gap-1.5 mb-2.5">
                            {company.has_website ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                                <Globe2 className="h-2.5 w-2.5 text-blue-400" /> Tem site
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                🔥 Sem site
                              </span>
                            )}
                            {demo.url && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 truncate max-w-[100px]" title={demo.modelName || "Demo Pronta"}>
                                ✨ {demo.modelName ? demo.modelName.slice(0, 14) : "Demo"}
                              </span>
                            )}
                          </div>

                          {/* Botões de Ação Rápida */}
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/50">
                            {/* WhatsApp */}
                            {waHref ? (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold transition-all"
                                title={`WhatsApp: ${formatPhone(phone)}`}
                              >
                                <MessageCircle className="h-3 w-3 shrink-0" />
                                <span className="truncate">Zap</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSetWhatsApp(company);
                                }}
                                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-muted/40 hover:bg-muted/70 text-muted-foreground text-[10px] font-medium transition-colors"
                              >
                                <MessageCircle className="h-3 w-3 shrink-0" />
                                <span className="truncate">+ Zap</span>
                              </button>
                            )}

                            {/* Demo Page */}
                            {demo.url ? (
                              <a
                                href={demo.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-[11px] font-semibold transition-all"
                                title="Ver página demonstrativa"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">Ver Demo</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGenerateDemo(company);
                                }}
                                disabled={creatingPageId === company.id}
                                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:text-white border border-primary/25 text-[10px] font-bold transition-all"
                              >
                                {creatingPageId === company.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                ) : (
                                  <Sparkles className="h-3 w-3 shrink-0 text-purple-400" />
                                )}
                                <span className="truncate">{creatingPageId === company.id ? "Gerando" : "Gerar"}</span>
                              </button>
                            )}

                            {/* Auditoria IA */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAuditCompany(company);
                              }}
                              className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-muted/40 hover:bg-purple-500/15 hover:text-purple-400 text-muted-foreground border border-border/50 text-[10px] font-medium transition-all"
                              title="Auditoria IA de Presença & Pitch"
                            >
                              <Bot className="h-3 w-3 shrink-0 text-purple-400" />
                              <span className="truncate">Auditar</span>
                            </button>

                            {/* Menu Dropdown com mais opções */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center py-1.5 px-2 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/70 text-[11px] transition-colors"
                                  title="Mais opções"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() => onAuditCompany(company)}
                                  className="cursor-pointer text-xs text-purple-400 font-medium"
                                >
                                  <Bot className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                  <span>Auditoria com IA</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => void onInstagramApproach(company)}
                                  className="cursor-pointer text-xs text-pink-400 font-medium"
                                >
                                  {copiedInstagramCompanyId === company.id ? (
                                    <Check className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                                  ) : (
                                    <Instagram className="h-3.5 w-3.5 mr-2 text-pink-400" />
                                  )}
                                  <span>{copiedInstagramCompanyId === company.id ? "Copiado!" : "Direct Instagram"}</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => onRegenerateDemo(company)}
                                  disabled={regeneratingPageId === company.id || creatingPageId === company.id}
                                  className="cursor-pointer text-xs text-purple-300 font-medium"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2 text-purple-400" />
                                  <span>{demo.url ? "Trocar Modelo da Página" : "Gerar Modelo"}</span>
                                </DropdownMenuItem>

                                {demo.pageId && (
                                  <DropdownMenuItem asChild className="cursor-pointer text-xs">
                                    <Link to="/builder" search={{ page: demo.pageId }}>
                                      <Pencil className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                      <span>Editar no Construtor</span>
                                    </Link>
                                  </DropdownMenuItem>
                                )}

                                {demo.url && demo.pageId && (
                                  <DropdownMenuItem
                                    onClick={() => onMakeOfficial(company, demo.pageId!)}
                                    disabled={actionLoadingId === demo.pageId || isOfficial}
                                    className="cursor-pointer text-xs"
                                  >
                                    <CheckCircle
                                      className={`h-3.5 w-3.5 mr-2 ${isOfficial ? "text-emerald-400" : "text-muted-foreground"}`}
                                    />
                                    <span>{isOfficial ? "Página Oficializada" : "Tornar Oficial"}</span>
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => onRegisterApproach(company)}
                                  className="cursor-pointer text-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <span>Registrar Histórico</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => onStatusChange(company.id, "descartado")}
                                  className="cursor-pointer text-xs text-amber-500"
                                >
                                  <Ban className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  <span>Mover para Descartados</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => onDeleteCompany(company)}
                                  className="cursor-pointer text-xs text-rose-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                                  <span>Remover do Radar</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção Dobrável: Oportunidades Descartadas */}
      <div className="rounded-xl border border-border/50 bg-muted/15 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDiscarded(!showDiscarded)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-muted-foreground" />
            <span>Oportunidades Descartadas</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
              {discardedCompanies.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>{showDiscarded ? "Recolher" : "Exibir descartados"}</span>
            {showDiscarded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </button>

        {showDiscarded && (
          <div className="p-3 border-t border-border/50 bg-card/40">
            {discardedCompanies.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma oportunidade descartada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {discardedCompanies.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.city || c.niche || "Sem detalhes"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStatusChange(c.id, "novo")}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-semibold border border-blue-500/20 transition-colors"
                        title="Restaurar para Novo Lead"
                      >
                        <ArchiveRestore className="h-3 w-3" />
                        <span>Restaurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCompany(c)}
                        className="p-1 rounded text-muted-foreground hover:text-rose-400 transition-colors"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

