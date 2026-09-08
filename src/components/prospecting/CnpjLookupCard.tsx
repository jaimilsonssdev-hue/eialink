import { useState } from "react";
import {
  Building2,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Phone,
  MapPin,
  Users,
  Globe,
  Sparkles,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import { normalizeName, normalizePhone, buildDedupeKey } from "@/modules/prospecting/scoring";
import { detectNicheKey } from "@/modules/prospecting/nichePresets";
import { POPULAR_CNAES, findCnaeByTerm, type CnaeItem } from "@/modules/prospecting/cnaePresets";
import { searchGoogleMapsAndInstagram } from "@/modules/prospecting/LiveProspectingEngine";
import { runLiveProspecting } from "@/modules/prospecting/prospecting.functions";
import type { ProspectDraft } from "@/modules/prospecting/types";

interface BrasilApiQsa {
  nome_socio: string;
  qualificacao_socio: string;
  faixa_etaria?: string;
}

interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  descricao_situacao_cadastral: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  ddd_telefone_1: string | null;
  ddd_telefone_2: string | null;
  email: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  qsa?: BrasilApiQsa[];
}

interface BatchLeadResult {
  data: BrasilApiCnpjResponse;
  effectiveName: string;
  cleanPhone: string | null;
  rawPhone: string | null;
  hasWebsite: boolean;
  score: number;
  isOpportunity: boolean;
  partners: string;
  detectedNiche: string;
}

interface CnpjLookupCardProps {
  onAddCompany: (draft: ProspectDraft) => Promise<{ success: boolean; message?: string }>;
}

export function CnpjLookupCard({ onAddCompany }: CnpjLookupCardProps) {
  const [activeTab, setActiveTab] = useState<"batch" | "single">("batch");

  // === MODO 1: CONSULTA INDIVIDUAL ===
  const [cnpjInput, setCnpjInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BrasilApiCnpjResponse | null>(null);
  const [added, setAdded] = useState(false);

  // === MODO 2: SCANNER EM LOTE / GERADOR AUTOMÁTICO POR CNAE ===
  const [selectedCnae, setSelectedCnae] = useState<string>("");
  const [cityContext, setCityContext] = useState("");
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [batchRawText, setBatchRawText] = useState("");
  const [isScanningBatch, setIsScanningBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchLeadResult[]>([]);
  const [batchFilter, setBatchFilter] = useState<"no_website" | "has_website" | "all">("no_website");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [batchAddFeedback, setBatchAddFeedback] = useState<string | null>(null);

  // Formata CNPJ enquanto o usuário digita
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
    let formatted = raw;
    if (raw.length > 2) formatted = `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length > 5) formatted = `${formatted.slice(0, 6)}.${raw.slice(5)}`;
    if (raw.length > 8) formatted = `${formatted.slice(0, 10)}/${raw.slice(8)}`;
    if (raw.length > 12) formatted = `${formatted.slice(0, 15)}-${raw.slice(12)}`;
    setCnpjInput(formatted);
    setError(null);
  };

  // Avaliação inteligente de presença de site
  const evaluateWebsiteStatus = (info: BrasilApiCnpjResponse) => {
    const email = (info.email || "").toLowerCase().trim();
    const genericMailProviders = [
      "gmail.com",
      "hotmail.com",
      "outlook.com",
      "yahoo.com",
      "bol.com.br",
      "uol.com.br",
      "icloud.com",
      "live.com",
      "terra.com.br",
    ];

    const hasGenericEmail =
      !email || genericMailProviders.some((provider) => email.endsWith(`@${provider}`));

    const hasWebsite = !hasGenericEmail && email.includes("@");
    return {
      hasWebsite,
      suggestedScore: hasWebsite ? 55 : 95,
      isOpportunity: !hasWebsite,
    };
  };

  // === GERADOR AUTOMÁTICO DE EMPRESAS POR CNAE & CIDADE ===
  const handleAutoDiscoverByCnae = async () => {
    if (!selectedCnae) {
      setError("Selecione um CNAE de referência na lista para gerar as empresas.");
      return;
    }
    if (!cityContext.trim()) {
      setError("Informe a Cidade / Região para localizar as empresas.");
      return;
    }

    setIsAutoSearching(true);
    setError(null);
    setBatchAddFeedback(null);
    setBatchResults([]);
    setSelectedIndices(new Set());
    setAddedIndices(new Set());

    const cnaeItem = POPULAR_CNAES.find((c) => c.code === selectedCnae);
    const nicheTerm = cnaeItem ? cnaeItem.niche : "Empresas";
    const cnaeDesc = cnaeItem ? `${cnaeItem.code} · ${cnaeItem.popularTerm}` : selectedCnae;

    try {
      let leads: ProspectDraft[] = [];
      try {
        leads = await searchGoogleMapsAndInstagram(nicheTerm, cityContext.trim(), 20);
      } catch (clientErr) {
        console.warn("[CNAE Auto Search] Tentando fallback para servidor:", clientErr);
        leads = await runLiveProspecting({
          data: { niche: nicheTerm, city: cityContext.trim(), limit: 20 },
        });
      }

      if (!leads.length) {
        setError(`Nenhuma empresa localizada para "${nicheTerm}" em "${cityContext.trim()}". Tente verificar o nome da cidade.`);
        return;
      }

      // Converte os leads gerados para o formato de resultados da tabela CNAE
      const results: BatchLeadResult[] = leads.map((lead) => ({
        data: {
          cnpj: lead.dedupe_key?.startsWith("insta:") ? "Pendente" : "Base Oficial",
          razao_social: lead.name,
          nome_fantasia: lead.name,
          descricao_situacao_cadastral: "ATIVA",
          cnae_fiscal: cnaeItem ? parseInt(cnaeItem.cleanCode.slice(0, 5), 10) : 0,
          cnae_fiscal_descricao: cnaeDesc,
          ddd_telefone_1: lead.phone || lead.whatsapp || null,
          ddd_telefone_2: null,
          email: lead.email || null,
          logradouro: null,
          numero: null,
          bairro: null,
          municipio: lead.city || cityContext.trim(),
          uf: lead.state || null,
          cep: null,
        },
        effectiveName: lead.name,
        cleanPhone: lead.whatsapp || lead.phone,
        rawPhone: lead.phone || lead.whatsapp,
        hasWebsite: lead.has_website,
        score: lead.score,
        isOpportunity: !lead.has_website,
        partners: lead.instagram ? `Instagram: ${lead.instagram}` : "Decisor local",
        detectedNiche: cnaeItem ? cnaeItem.niche : (lead.niche ?? "Outros"),
      }));

      setBatchResults(results);

      // Auto-seleciona as oportunidades sem site
      const initialSelected = new Set<number>();
      results.forEach((r, idx) => {
        if (!r.hasWebsite) initialSelected.add(idx);
      });
      setSelectedIndices(initialSelected);
    } catch (err: any) {
      setError(err?.message || "Erro ao gerar lista de empresas por CNAE.");
    } finally {
      setIsAutoSearching(false);
    }
  };

  const handleSearchSingle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = cnpjInput.replace(/\D/g, "");
    if (clean.length !== 14) {
      setError("Digite um CNPJ válido com 14 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setAdded(false);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("CNPJ não encontrado na base da Receita Federal.");
        }
        throw new Error("Não foi possível consultar este CNPJ no momento. Tente novamente.");
      }

      const json = (await res.json()) as BrasilApiCnpjResponse;
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Erro ao consultar CNPJ.");
    } finally {
      setLoading(false);
    }
  };

  const effectiveName = data?.nome_fantasia?.trim()
    ? normalizeName(data.nome_fantasia)
    : normalizeName(data?.razao_social);

  const rawPhone = data?.ddd_telefone_1 || data?.ddd_telefone_2 || "";
  const cleanPhone = normalizePhone(rawPhone);
  const websiteEvaluation = data ? evaluateWebsiteStatus(data) : null;

  const handleAddToRadarSingle = async () => {
    if (!data || !effectiveName) return;
    setAdding(true);
    try {
      const partners = (data.qsa || [])
        .map((s) => `${s.nome_socio} (${s.qualificacao_socio || "Sócio"})`)
        .slice(0, 3)
        .join(", ");

      const detectedNiche = detectNicheKey(data.cnae_fiscal_descricao || "");

      const notesArr = [
        `CNPJ: ${data.cnpj}`,
        `Situação: ${data.descricao_situacao_cadastral}`,
        `CNAE: ${data.cnae_fiscal_descricao}`,
      ];
      if (partners) notesArr.push(`Sócios/Decisores: ${partners}`);
      if (websiteEvaluation?.isOpportunity) {
        notesArr.push("⚡ EMPRESA SEM SITE DETECTADA");
      }

      const draft: ProspectDraft = {
        name: effectiveName,
        niche: detectedNiche || "Outros",
        city: data.municipio ? normalizeName(data.municipio) : null,
        state: data.uf || null,
        phone: rawPhone ? rawPhone.replace(/\D/g, "") : null,
        whatsapp: cleanPhone,
        email: data.email ? data.email.toLowerCase().trim() : null,
        instagram: null,
        website: websiteEvaluation?.hasWebsite && data.email ? `https://${data.email.split("@")[1]}` : null,
        has_website: Boolean(websiteEvaluation?.hasWebsite),
        rating: null,
        reviews_count: null,
        source: "Busca CNPJ / Receita Federal",
        score: websiteEvaluation?.suggestedScore ?? 95,
        priority: (websiteEvaluation?.suggestedScore ?? 95) >= 80 ? "alta" : "media",
        status: "novo",
        notes: notesArr.join(" | "),
        dedupe_key: buildDedupeKey({
          name: effectiveName,
          city: data.municipio,
          whatsapp: cleanPhone,
        }),
      };

      const result = await onAddCompany(draft);
      if (result.success) {
        setAdded(true);
      } else {
        setError(result.message || "Erro ao adicionar ao radar.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao salvar empresa.");
    } finally {
      setAdding(false);
    }
  };

  // === PROCESSAMENTO EM LOTE DE CNPJs (QUANDO COLADOS) ===
  const extractCnpjsFromText = (text: string): string[] => {
    const formatted = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g) || [];
    const rawDigits = text.match(/\b\d{14}\b/g) || [];
    const all = [...formatted.map((c) => c.replace(/\D/g, "")), ...rawDigits];
    return Array.from(new Set(all)).slice(0, 30);
  };

  const detectedCnpjs = extractCnpjsFromText(batchRawText);

  const handleStartBatchScan = async () => {
    if (!detectedCnpjs.length) {
      setError("Cole pelo menos um CNPJ válido no campo abaixo.");
      return;
    }

    setIsScanningBatch(true);
    setError(null);
    setBatchAddFeedback(null);
    setBatchResults([]);
    setSelectedIndices(new Set());
    setAddedIndices(new Set());
    setBatchProgress({ current: 0, total: detectedCnpjs.length });

    const results: BatchLeadResult[] = [];

    for (let i = 0; i < detectedCnpjs.length; i++) {
      const cnpj = detectedCnpjs[i];
      setBatchProgress({ current: i + 1, total: detectedCnpjs.length });

      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = (await res.json()) as BrasilApiCnpjResponse;
          const evalResult = evaluateWebsiteStatus(json);
          const name = json.nome_fantasia?.trim()
            ? normalizeName(json.nome_fantasia)
            : normalizeName(json.razao_social);

          const rPhone = json.ddd_telefone_1 || json.ddd_telefone_2 || "";
          const cPhone = normalizePhone(rPhone);
          const partners = (json.qsa || [])
            .map((s) => s.nome_socio)
            .slice(0, 2)
            .join(", ");
          const niche = detectNicheKey(json.cnae_fiscal_descricao || "") || "Outros";

          results.push({
            data: json,
            effectiveName: name || json.razao_social,
            cleanPhone: cPhone,
            rawPhone: rPhone,
            hasWebsite: evalResult.hasWebsite,
            score: evalResult.suggestedScore,
            isOpportunity: evalResult.isOpportunity,
            partners,
            detectedNiche: niche,
          });
        }
      } catch (e) {
        console.warn(`Erro ao consultar CNPJ ${cnpj}:`, e);
      }

      if (i < detectedCnpjs.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    setBatchResults(results);
    setIsScanningBatch(false);
    setBatchProgress(null);

    const initialSelected = new Set<number>();
    results.forEach((r, idx) => {
      if (!r.hasWebsite) initialSelected.add(idx);
    });
    setSelectedIndices(initialSelected);
  };

  const filteredBatchResults = batchResults.filter((r) => {
    if (batchFilter === "no_website") return !r.hasWebsite;
    if (batchFilter === "has_website") return r.hasWebsite;
    return true;
  });

  const handleAddSingleFromBatch = async (item: BatchLeadResult, globalIndex: number) => {
    const notesArr = [
      `CNPJ: ${item.data.cnpj}`,
      `CNAE: ${item.data.cnae_fiscal_descricao}`,
    ];
    if (item.partners) notesArr.push(`Sócios: ${item.partners}`);
    if (!item.hasWebsite) notesArr.push("⚡ EMPRESA SEM SITE DETECTADA");

    const draft: ProspectDraft = {
      name: item.effectiveName,
      niche: item.detectedNiche,
      city: item.data.municipio ? normalizeName(item.data.municipio) : null,
      state: item.data.uf || null,
      phone: item.rawPhone ? item.rawPhone.replace(/\D/g, "") : null,
      whatsapp: item.cleanPhone,
      email: item.data.email ? item.data.email.toLowerCase().trim() : null,
      instagram: null,
      website: item.hasWebsite && item.data.email ? `https://${item.data.email.split("@")[1]}` : null,
      has_website: item.hasWebsite,
      rating: null,
      reviews_count: null,
      source: "Scanner CNAE/CNPJ",
      score: item.score,
      priority: item.score >= 80 ? "alta" : "media",
      status: "novo",
      notes: notesArr.join(" | "),
      dedupe_key: buildDedupeKey({
        name: item.effectiveName,
        city: item.data.municipio,
        whatsapp: item.cleanPhone,
      }),
    };

    try {
      const res = await onAddCompany(draft);
      if (res.success) {
        setAddedIndices((prev) => new Set(prev).add(globalIndex));
      }
    } catch (err) {
      console.warn("Erro ao inserir item individual do lote:", err);
    }
  };

  const handleAddBatchToRadar = async () => {
    if (!selectedIndices.size) return;
    setIsAddingBatch(true);
    setBatchAddFeedback(null);
    let insertedCount = 0;

    for (const idx of Array.from(selectedIndices)) {
      const item = batchResults[idx];
      if (!item) continue;

      const notesArr = [
        `CNPJ: ${item.data.cnpj}`,
        `CNAE: ${item.data.cnae_fiscal_descricao}`,
      ];
      if (item.partners) notesArr.push(`Sócios: ${item.partners}`);
      if (!item.hasWebsite) notesArr.push("⚡ EMPRESA SEM SITE DETECTADA");

      const draft: ProspectDraft = {
        name: item.effectiveName,
        niche: item.detectedNiche,
        city: item.data.municipio ? normalizeName(item.data.municipio) : null,
        state: item.data.uf || null,
        phone: item.rawPhone ? item.rawPhone.replace(/\D/g, "") : null,
        whatsapp: item.cleanPhone,
        email: item.data.email ? item.data.email.toLowerCase().trim() : null,
        instagram: null,
        website: item.hasWebsite && item.data.email ? `https://${item.data.email.split("@")[1]}` : null,
        has_website: item.hasWebsite,
        rating: null,
        reviews_count: null,
        source: "Scanner CNAE/CNPJ",
        score: item.score,
        priority: item.score >= 80 ? "alta" : "media",
        status: "novo",
        notes: notesArr.join(" | "),
        dedupe_key: buildDedupeKey({
          name: item.effectiveName,
          city: item.data.municipio,
          whatsapp: item.cleanPhone,
        }),
      };

      try {
        const res = await onAddCompany(draft);
        if (res.success) insertedCount++;
      } catch (err) {
        console.warn("Erro ao inserir item em lote:", err);
      }
    }

    setIsAddingBatch(false);
    setBatchAddFeedback(`${insertedCount} empresa(s) adicionada(s) ao Radar com sucesso!`);
    setAddedIndices((prev) => {
      const next = new Set(prev);
      selectedIndices.forEach((i) => next.add(i));
      return next;
    });
    setSelectedIndices(new Set());
  };

  const handleLoadSampleCnpjs = () => {
    const samples = [
      "33.000.167/0001-01", // Petrobras
      "00.000.000/0001-91", // Banco do Brasil
      "07.526.557/0001-00", // Ambev
      "58.119.199/0001-51", // Bradesco Saúde / Odontoprev
      "47.960.950/0001-21", // Magazine Luiza
    ];
    setBatchRawText(samples.join("\n"));
  };

  return (
    <div className="space-y-4">
      {/* Sub-navegação: Gerador de Empresas por CNAE vs Consulta Individual de CNPJ */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/80 bg-background/50 text-xs max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("batch")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all ${
            activeTab === "batch"
              ? "bg-primary text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> Gerador & Scanner por CNAE
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("single")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all ${
            activeTab === "single"
              ? "bg-primary text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-3.5 w-3.5" /> Consulta Individual
        </button>
      </div>

      {/* ===================== MODO 1: SCANNER POR CNAE & EMPRESAS ===================== */}
      {activeTab === "batch" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Selecione o CNAE e a cidade para <strong>gerar automaticamente a lista de empresas</strong>, identificar quem <strong>NÃO TEM SITE</strong> e importar para seu funil de prospecção.
            </p>
          </div>

          {/* Grade com CNAE + Cidade + Botão Gerar Lista */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Atividade Econômica / CNAE:
                </span>
                <span className="text-primary font-mono text-[10px]">Mais Lucrativos</span>
              </label>
              <select
                value={selectedCnae}
                onChange={(e) => setSelectedCnae(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/60 transition-colors"
              >
                <option value="">Selecione a atividade comercial...</option>
                {POPULAR_CNAES.map((cnae) => (
                  <option key={cnae.code} value={cnae.code}>
                    {cnae.code} · {cnae.popularTerm}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" /> Cidade / Região:
              </label>
              <input
                type="text"
                value={cityContext}
                onChange={(e) => setCityContext(e.target.value)}
                placeholder="Ex: Curitiba, PR"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="button"
                onClick={handleAutoDiscoverByCnae}
                disabled={isAutoSearching || !selectedCnae || !cityContext.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all disabled:opacity-50"
              >
                {isAutoSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando Lista...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-200" />
                    Gerar Lista de Empresas
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opção Secundária: Colar lista própria de CNPJs */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualPaste(!showManualPaste)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              <span>{showManualPaste ? "Ocultar auditoria manual de CNPJs" : "Ou auditar uma lista manual de CNPJs (Base da Receita / Planilha)..."}</span>
            </button>

            {showManualPaste && (
              <div className="mt-3 p-4 rounded-xl border border-border/80 bg-background/40 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Cole os CNPJs para Auditar:</label>
                  <div className="flex items-center gap-2">
                    {detectedCnpjs.length > 0 && (
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {detectedCnpjs.length} CNPJ(s) detectados
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleLoadSampleCnpjs}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Exemplo Rápido
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={batchRawText}
                  onChange={(e) => setBatchRawText(e.target.value)}
                  placeholder="Cole aqui os CNPJs para auditar presença de site e sócios (separados por vírgula, espaço ou linhas)..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors resize-y"
                  disabled={isScanningBatch}
                />
                <button
                  type="button"
                  onClick={handleStartBatchScan}
                  disabled={isScanningBatch || detectedCnpjs.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-all disabled:opacity-50"
                >
                  {isScanningBatch ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Auditando {batchProgress?.current}/{batchProgress?.total}...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Auditar {detectedCnpjs.length > 0 ? `${detectedCnpjs.length} CNPJ(s)` : "CNPJs"} na Receita Federal
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Feedback de Erro */}
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Barra de Progresso do Scanner */}
          {isScanningBatch && batchProgress && (
            <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cruzando Base da Receita Federal e Domínios Corporativos...</span>
                <span className="font-mono text-foreground">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Feedback de Inserção */}
          {batchAddFeedback && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{batchAddFeedback}</span>
            </div>
          )}

          {/* Tabela Enterprise de Resultados Gerados */}
          {batchResults.length > 0 && (
            <div className="space-y-3 pt-1">
              {/* Filtro de Visualização: Sem Site vs Com Site */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setBatchFilter("no_website")}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 ${
                      batchFilter === "no_website"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🔥 Sem Site ({batchResults.filter((r) => !r.hasWebsite).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilter("has_website")}
                    className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                      batchFilter === "has_website"
                        ? "bg-muted text-foreground border border-border shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🌐 Com Site ({batchResults.filter((r) => r.hasWebsite).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilter("all")}
                    className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                      batchFilter === "all"
                        ? "bg-muted text-foreground border border-border shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todas ({batchResults.length})
                  </button>
                </div>

                {/* Seleção e Ação em Massa */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    onClick={() => {
                      const displayedIndices = filteredBatchResults.map((r) => batchResults.indexOf(r));
                      const allSelected = displayedIndices.length > 0 && displayedIndices.every((i) => selectedIndices.has(i));
                      const next = new Set(selectedIndices);
                      if (allSelected) {
                        displayedIndices.forEach((i) => next.delete(i));
                      } else {
                        displayedIndices.forEach((i) => next.add(i));
                      }
                      setSelectedIndices(next);
                    }}
                  >
                    {filteredBatchResults.length > 0 &&
                    filteredBatchResults.every((r) => selectedIndices.has(batchResults.indexOf(r)))
                      ? "Desmarcar visíveis"
                      : "Selecionar visíveis"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBatchToRadar}
                    disabled={isAddingBatch || selectedIndices.size === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-all"
                  >
                    {isAddingBatch ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Adicionar {selectedIndices.size} ao Radar
                  </button>
                </div>
              </div>

              {/* Tabela com Colunas Profissionais */}
              <div className="max-h-96 overflow-auto rounded-xl border border-border bg-background/30">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="px-3.5 py-2.5 w-8">
                        <input
                          type="checkbox"
                          className="rounded border-border bg-background"
                          checked={
                            filteredBatchResults.length > 0 &&
                            filteredBatchResults.every((r) => selectedIndices.has(batchResults.indexOf(r)))
                          }
                          onChange={(e) => {
                            const displayedIndices = filteredBatchResults.map((r) => batchResults.indexOf(r));
                            const next = new Set(selectedIndices);
                            if (e.target.checked) {
                              displayedIndices.forEach((i) => next.add(i));
                            } else {
                              displayedIndices.forEach((i) => next.delete(i));
                            }
                            setSelectedIndices(next);
                          }}
                        />
                      </TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Empresa & Atividade</TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Sócios / Decisores (QSA)</TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Contato / WhatsApp</TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Status do Site</TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Score</TableHead>
                      <TableHead className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {filteredBatchResults.map((lead) => {
                      const globalIndex = batchResults.indexOf(lead);
                      const isChecked = selectedIndices.has(globalIndex);
                      const isIndividualAdded = addedIndices.has(globalIndex);

                      return (
                        <TableRow
                          key={lead.data.cnpj || globalIndex}
                          className={`transition-colors border-border/40 ${isChecked ? "bg-primary/10" : "hover:bg-muted/20"}`}
                        >
                          <TableCell className="px-3.5 py-2.5">
                            <input
                              type="checkbox"
                              className="rounded border-border bg-background"
                              checked={isChecked}
                              onChange={() => {
                                const next = new Set(selectedIndices);
                                if (next.has(globalIndex)) next.delete(globalIndex);
                                else next.add(globalIndex);
                                setSelectedIndices(next);
                              }}
                            />
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5">
                            <p className="font-semibold text-foreground tracking-tight text-xs sm:text-sm">
                              {lead.effectiveName}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {lead.data.cnpj && lead.data.cnpj.length === 14 ? `CNPJ: ${lead.data.cnpj}` : lead.detectedNiche}
                              </span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">
                                {[lead.data.municipio, lead.data.uf].filter(Boolean).join(" - ")}
                              </span>
                            </div>
                            <p className="text-[11px] text-primary/80 truncate max-w-[280px] mt-0.5" title={lead.data.cnae_fiscal_descricao}>
                              {lead.data.cnae_fiscal_descricao}
                            </p>
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 text-xs">
                            {lead.partners ? (
                              <div className="flex items-center gap-1.5 text-purple-300">
                                <Users className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                                <span className="font-medium">{lead.partners}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 text-xs font-mono">
                            {lead.cleanPhone ? (
                              <a
                                href={`https://wa.me/55${lead.cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{lead.rawPhone || lead.cleanPhone}</span>
                              </a>
                            ) : lead.rawPhone ? (
                              <span className="text-muted-foreground">{lead.rawPhone}</span>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 whitespace-nowrap">
                            {lead.isOpportunity ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                                <Sparkles className="h-3 w-3" /> Sem site
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                                Já tem site
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5">
                            <LeadTemperatureBadge score={lead.score} />
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 text-right">
                            {isIndividualAdded ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> No Radar
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddSingleFromBatch(lead, globalIndex)}
                                className="rounded-lg border border-border/70 hover:border-primary/50 bg-background hover:bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-foreground hover:text-primary transition-all shadow-xs"
                              >
                                + Radar
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODO 2: CONSULTA INDIVIDUAL ===================== */}
      {activeTab === "single" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Consulte um CNPJ específico para puxar sócios, telefones e presença de site em alta resolução.
            </p>
          </div>

          <form onSubmit={handleSearchSingle} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={cnpjInput}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || cnpjInput.replace(/\D/g, "").length < 14}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-white transition-all shadow-xs shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Consultar
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-sm tracking-tight">{effectiveName}</h4>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        data.descricao_situacao_cadastral === "ATIVA"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                      }`}
                    >
                      {data.descricao_situacao_cadastral}
                    </span>
                  </div>
                  {data.nome_fantasia && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Razão Social: <span className="font-mono">{data.razao_social}</span>
                    </p>
                  )}
                </div>

                <LeadTemperatureBadge score={websiteEvaluation?.suggestedScore ?? 95} />
              </div>

              {websiteEvaluation?.isOpportunity ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-amber-300">Empresa Sem Site Próprio Detectada</p>
                    <p className="text-amber-200/80 text-[11px]">
                      Sem domínio corporativo oficial registrado. Oportunidade perfeita para gerar uma página profissional pronta!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2 text-xs text-blue-300">
                  <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Domínio corporativo oficial identificado: {data.email?.split("@")[1]}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Localização
                  </p>
                  <p className="text-foreground font-medium">
                    {[data.bairro, data.municipio, data.uf].filter(Boolean).join(", ")}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Contato
                  </p>
                  <p className="text-foreground font-medium font-mono">{rawPhone || "Não informado"}</p>
                </div>
              </div>

              {data.qsa && data.qsa.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Sócios & Decisores ({data.qsa.length})
                  </p>
                  <div className="space-y-1">
                    {data.qsa.slice(0, 3).map((socio, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground font-medium">{normalizeName(socio.nome_socio)}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {socio.qualificacao_socio || "Sócio"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                {added ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Adicionado com Sucesso!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToRadarSingle}
                    disabled={adding}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Adicionar ao Radar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
