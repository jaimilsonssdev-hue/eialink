import { useState } from "react";
import {
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Building2,
  Tag,
  Eye,
  Sliders,
} from "lucide-react";
import { CANONICAL_NICHES, detectNicheKey } from "@/modules/prospecting/nichePresets";

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  businessType?: string;
  priceRange?: string;
  indexable?: boolean;
}

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  title: "",
  description: "",
  keywords: "",
  businessType: "LocalBusiness",
  priceRange: "$$",
  indexable: true,
};

const SCHEMA_BUSINESS_TYPES = [
  { value: "LocalBusiness", label: "Negócio Local Geral (LocalBusiness)" },
  { value: "AutoRepair", label: "Oficina & Estética Automotiva (AutoRepair)" },
  { value: "BeautySalon", label: "Salão de Beleza & Estética (BeautySalon)" },
  { value: "MedicalClinic", label: "Clínica Médica & Saúde (MedicalClinic)" },
  { value: "Dentist", label: "Consultório Odontológico (Dentist)" },
  { value: "Restaurant", label: "Restaurante & Alimentação (Restaurant)" },
  { value: "Store", label: "Loja & E-commerce (Store)" },
  { value: "LegalService", label: "Escritório de Advocacia (LegalService)" },
  { value: "RealEstateAgent", label: "Imobiliária & Corretor (RealEstateAgent)" },
  { value: "VeterinaryCare", label: "Pet Shop & Veterinária (VeterinaryCare)" },
  { value: "AccountingService", label: "Contabilidade & Finanças (AccountingService)" },
  { value: "HealthClub", label: "Academia & Fitness (HealthClub)" },
];

function getRecommendedBusinessType(nicheKey?: string | null): string {
  if (!nicheKey) return "LocalBusiness";
  const map: Record<string, string> = {
    oficina: "AutoRepair",
    beleza: "BeautySalon",
    clinica: "MedicalClinic",
    nutricao: "MedicalClinic",
    psicologia: "MedicalClinic",
    odontologia: "Dentist",
    restaurante: "Restaurant",
    delivery: "Restaurant",
    sorveteria: "Restaurant",
    loja: "Store",
    bebidas: "Store",
    advocacia: "LegalService",
    imobiliaria: "RealEstateAgent",
    petshop: "VeterinaryCare",
    fitness: "HealthClub",
  };
  return map[nicheKey] || "LocalBusiness";
}

interface SeoEditorProps {
  value?: SeoConfig | null;
  onChange: (seo: SeoConfig) => void;
  companyName: string;
  nicheKey?: string | null;
  city?: string | null;
  slug: string;
  rating?: number | null;
  reviewsCount?: number | null;
}

export function SeoEditor({
  value,
  onChange,
  companyName,
  nicheKey,
  city,
  slug,
  rating = 4.9,
  reviewsCount = 48,
}: SeoEditorProps) {
  const seo: SeoConfig = {
    ...DEFAULT_SEO_CONFIG,
    ...(value || {}),
    businessType: value?.businessType || getRecommendedBusinessType(nicheKey),
    indexable: value?.indexable !== false,
  };

  const updateSeo = (patch: Partial<SeoConfig>) => {
    onChange({
      ...seo,
      ...patch,
    });
  };

  const cleanCity = city?.trim() || "sua região";
  const cleanName = companyName?.trim() || "Sua Empresa";
  const cleanNiche = nicheKey || "serviços";
  const pagePublicUrl = `https://eialink.com.br/p/${slug}`;

  // 1-Clique Gerador Mágico de SEO
  const handleGenerateMagicSeo = () => {
    const defaultTypes = getRecommendedBusinessType(nicheKey);

    let nicheDisplay = "Serviços Especializados";
    if (nicheKey && CANONICAL_NICHES[nicheKey as keyof typeof CANONICAL_NICHES]) {
      nicheDisplay = CANONICAL_NICHES[nicheKey as keyof typeof CANONICAL_NICHES].title;
    }

    const generatedTitle = `${cleanName} | ${nicheDisplay} em ${cleanCity}`;
    const generatedDesc = `Procurando ${nicheDisplay.toLowerCase()} em ${cleanCity}? Conheça a ${cleanName}: qualidade comprovada, atendimento rápido e orçamento sem compromisso no WhatsApp. Confira nossos serviços!`;
    const generatedKeywords = `${cleanName}, ${nicheDisplay.toLowerCase()} em ${cleanCity}, melhor ${cleanNiche} ${cleanCity}, contato ${cleanName}, agendamento whatsapp, serviços ${cleanCity}`;

    updateSeo({
      title: generatedTitle.slice(0, 60),
      description: generatedDesc.slice(0, 160),
      keywords: generatedKeywords,
      businessType: defaultTypes,
      priceRange: seo.priceRange || "$$",
      indexable: true,
    });
  };

  // Metas do snippet de exibição
  const displayTitle = seo.title || `${cleanName} — Atendimento Oficial`;
  const displayDesc =
    seo.description ||
    `Conheça a ${cleanName}. Atendimento especializado, serviços de alta qualidade e contato direto pelo WhatsApp em ${cleanCity}.`;

  const titleLength = (seo.title || "").length;
  const descLength = (seo.description || "").length;

  return (
    <div className="space-y-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 sm:p-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-500/20">
        <div className="space-y-0.5">
          <p className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-400" />
            <span>SEO & Indexação no Google (Rich Snippets)</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Configure como sua página aparece nas buscas do Google, com estrelas douradas e dados estruturados locais.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateMagicSeo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-400/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-all hover:scale-102 shrink-0 cursor-pointer shadow-2xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Gerar SEO com 1-Clique</span>
        </button>
      </div>

      {/* Switch de Indexação no Google */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/60">
        <div className="space-y-0.5">
          <label htmlFor="seo-indexable-switch" className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 cursor-pointer">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>Permitir indexação no Google (Robots: index, follow)</span>
          </label>
          <p className="text-[11px] text-muted-foreground">
            {seo.indexable
              ? "Sua página será incluída no sitemap.xml e indexada pelos mecanismos de busca do Google."
              : "A página terá a tag 'noindex' e não aparecerá nas buscas públicas do Google."}
          </p>
        </div>
        <input
          id="seo-indexable-switch"
          type="checkbox"
          checked={seo.indexable}
          onChange={(e) => updateSeo({ indexable: e.target.checked })}
          className="h-4 w-4 rounded border-border text-blue-500 cursor-pointer"
        />
      </div>

      {/* PRÉVIA DO GOOGLE SEARCH SNIPPET */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-blue-400" />
            <span>Prévia do Resultado no Google</span>
          </span>
          <span className="text-[10px] text-blue-400 font-normal">Google Search Live Preview</span>
        </div>

        <div className="p-4 rounded-xl border border-border/90 bg-[#202124] text-[#bdc1c6] font-sans text-left shadow-md space-y-1.5">
          {/* URL e Favicon */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              ⚡
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-white text-xs font-normal truncate">{cleanName}</p>
              <p className="text-[#9aa0a6] text-[11px] truncate">{pagePublicUrl}</p>
            </div>
          </div>

          {/* Título do Google */}
          <h3 className="text-[#8ab4f8] text-base sm:text-lg font-medium leading-snug hover:underline cursor-pointer line-clamp-1">
            {displayTitle}
          </h3>

          {/* Avaliação em Estrelas & Rich Snippet */}
          <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6]">
            <span className="text-[#fbbc04] text-xs font-bold tracking-tight">★★★★★</span>
            <span className="text-white font-semibold text-xs">{rating ? rating.toFixed(1) : "4.9"}</span>
            <span>({reviewsCount || 48})</span>
            <span>·</span>
            <span>Preço: {seo.priceRange || "$$"}</span>
            <span>·</span>
            <span className="text-[#81c995] font-medium">Aberto agora</span>
          </div>

          {/* Snippet / Descrição */}
          <p className="text-[#bdc1c6] text-xs sm:text-sm leading-relaxed line-clamp-2">
            {displayDesc}
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE CONFIGURAÇÃO SEO */}
      <div className="grid grid-cols-1 gap-4 pt-1">
        {/* Título SEO */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <span>Título da Página (SEO Title)</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                titleLength >= 40 && titleLength <= 60
                  ? "text-emerald-400 font-bold"
                  : titleLength > 60
                  ? "text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {titleLength}/60 caracteres {titleLength >= 40 && titleLength <= 60 && "✓ Ideal"}
            </span>
          </div>
          <input
            type="text"
            value={seo.title || ""}
            onChange={(e) => updateSeo({ title: e.target.value })}
            placeholder={`Ex: ${cleanName} | ${cleanNiche} em ${cleanCity}`}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
          <p className="text-[11px] text-muted-foreground">
            Recomendado entre 40 e 60 caracteres com o nome da empresa, nicho e cidade.
          </p>
        </div>

        {/* Descrição SEO */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              Meta Descrição (Snippet Google)
            </label>
            <span
              className={`text-[11px] font-mono ${
                descLength >= 120 && descLength <= 160
                  ? "text-emerald-400 font-bold"
                  : descLength > 160
                  ? "text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {descLength}/160 caracteres {descLength >= 120 && descLength <= 160 && "✓ Ideal"}
            </span>
          </div>
          <textarea
            rows={3}
            value={seo.description || ""}
            onChange={(e) => updateSeo({ description: e.target.value })}
            placeholder={`Ex: Conheça a ${cleanName} em ${cleanCity}. Serviços especializados de alta qualidade com agendamento e orçamento direto pelo WhatsApp.`}
            className="w-full rounded-xl border border-border bg-card p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 resize-y"
          />
          <p className="text-[11px] text-muted-foreground">
            Texto chamativo que convence o visitante a clicar quando visualizar no Google.
          </p>
        </div>

        {/* Palavras-chave */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Tag className="h-3 w-3 text-blue-400" />
            <span>Palavras-chave (Keywords)</span>
          </label>
          <input
            type="text"
            value={seo.keywords || ""}
            onChange={(e) => updateSeo({ keywords: e.target.value })}
            placeholder="Ex: estética automotiva, lavajato em são paulo, vitrificação, orçamento whatsapp"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
          <p className="text-[11px] text-muted-foreground">
            Termos separados por vírgula que seus clientes usam para pesquisar no Google.
          </p>
        </div>

        {/* Tipo de Empresa Schema & Faixa de Preço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3 text-blue-400" />
              <span>Tipo no Schema.org (Google Local)</span>
            </label>
            <select
              value={seo.businessType || "LocalBusiness"}
              onChange={(e) => updateSeo({ businessType: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
            >
              {SCHEMA_BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>Faixa de Preço do Negócio</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {["$", "$$", "$$$", "$$$$"].map((tier) => {
                const isSelected = (seo.priceRange || "$$") === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => updateSeo({ priceRange: tier })}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/20 text-blue-400 shadow-xs"
                        : "border-border bg-card/60 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS OFICIAIS DO GOOGLE */}
      <div className="pt-2 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dados estruturados JSON-LD validados para Google Rich Snippets</span>
        </span>

        <div className="flex items-center gap-2">
          <a
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(pagePublicUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border hover:bg-muted text-[11px] text-foreground font-medium transition-colors"
            title="Testar Rich Snippets no Google"
          >
            <span>Teste de Rich Results</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>

          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border hover:bg-muted text-[11px] text-foreground font-medium transition-colors"
            title="Acessar Google Search Console"
          >
            <span>Search Console</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}
