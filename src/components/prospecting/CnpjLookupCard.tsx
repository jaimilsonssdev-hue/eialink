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
  ShieldCheck,
  Globe,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { LeadTemperatureBadge } from "./LeadTemperatureBadge";
import { normalizeName, normalizePhone, buildDedupeKey } from "@/modules/prospecting/scoring";
import { detectNicheKey } from "@/modules/prospecting/nichePresets";
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

interface CnpjLookupCardProps {
  onAddCompany: (draft: ProspectDraft) => Promise<{ success: boolean; message?: string }>;
}

export function CnpjLookupCard({ onAddCompany }: CnpjLookupCardProps) {
  const [cnpjInput, setCnpjInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BrasilApiCnpjResponse | null>(null);
  const [added, setAdded] = useState(false);

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

  const handleSearch = async (e?: React.FormEvent) => {
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
        headers: {
          Accept: "application/json",
        },
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

  // Nome comercial mais amigável
  const effectiveName = data?.nome_fantasia?.trim()
    ? normalizeName(data.nome_fantasia)
    : normalizeName(data?.razao_social);

  // Telefone / WhatsApp principal
  const rawPhone = data?.ddd_telefone_1 || data?.ddd_telefone_2 || "";
  const cleanPhone = normalizePhone(rawPhone);

  const websiteEvaluation = data ? evaluateWebsiteStatus(data) : null;

  const handleAddToRadar = async () => {
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
        notesArr.push("⚡ EMPRESA SEM SITE DETECTADA NA RECEITA");
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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Consulte qualquer empresa brasileira pelo CNPJ. O sistema analisa dados oficiais, identifica os sócios/decisores e detecta empresas sem site próprio.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={cnpjInput}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            className="w-full rounded-lg border border-border bg-background/70 px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
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
          {/* Cabeçalho do Resultado */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm tracking-tight">{effectiveName}</h4>
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

          {/* Destaque de Oportunidade Sem Site */}
          {websiteEvaluation?.isOpportunity ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-amber-300">Empresa Sem Site Próprio Detectada</p>
                <p className="text-amber-200/80 text-[11px]">
                  Sem domínio corporativo oficial registrado na Receita. Oportunidade perfeita para apresentar uma página profissional pronta!
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2 text-xs text-blue-300">
              <Globe className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Domínio corporativo oficial identificado: {data.email?.split("@")[1]}</span>
            </div>
          )}

          {/* Dados e Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Localização
              </p>
              <p className="text-white font-medium">
                {[data.bairro, data.municipio, data.uf].filter(Boolean).join(", ")}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {[data.logradouro, data.numero].filter(Boolean).join(", ")} {data.cep ? `· CEP ${data.cep}` : ""}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Contato
              </p>
              <p className="text-white font-medium font-mono">
                {rawPhone || "Não informado"}
              </p>
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                >
                  Abrir WhatsApp <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Sócios / Decisores (QSA) */}
          {data.qsa && data.qsa.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Sócios & Tomadores de Decisão ({data.qsa.length})
              </p>
              <div className="space-y-1">
                {data.qsa.slice(0, 3).map((socio, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-white font-medium">{normalizeName(socio.nome_socio)}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {socio.qualificacao_socio || "Sócio"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Atividade CNAE */}
          {data.cnae_fiscal_descricao && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-white/80">CNAE:</span> {data.cnae_fiscal_descricao}
            </p>
          )}

          {/* Botão de Adição ao Radar */}
          <div className="pt-1 flex items-center justify-end">
            {added ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Adicionado com Sucesso ao Radar!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToRadar}
                disabled={adding}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Adicionar ao Radar de Prospecção
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
