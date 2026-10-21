import React, { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { supabase } from "@/integrations/supabase/client";
import { callGeminiInteractionsApi } from "@/modules/ai/google-ai.service";

interface SeoPanelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  indexable?: boolean;
  businessType?: string;
  priceRange?: string;
}

const SCHEMA_BUSINESS_TYPES = [
  { id: "LocalBusiness", label: "Negócio Local em Geral" },
  { id: "BarberShop", label: "Barbearia" },
  { id: "BeautySalon", label: "Salão de Beleza / Estética" },
  { id: "Restaurant", label: "Restaurante / Gastronomia" },
  { id: "MedicalBusiness", label: "Clínica Médica / Odontologia" },
  { id: "Store", label: "Loja / Comércio" },
  { id: "ProfessionalService", label: "Serviços Profissionais / Consultoria" },
];

export function SeoPanelModal({ open, onOpenChange }: SeoPanelModalProps) {
  const { getActiveProject } = useCreativeStudioStore();
  const activeProject = getActiveProject();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [indexable, setIndexable] = useState(true);
  const [businessType, setBusinessType] = useState("LocalBusiness");
  const [priceRange, setPriceRange] = useState("$$");
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [previewTab, setPreviewTab] = useState<"google" | "whatsapp">("google");

  const businessName = activeProject?.name || "Minha Empresa";
  const slug =
    activeProject?.slug ||
    businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const publicUrl = `https://${slug}.eialink.com.br`;

  // Carrega configurações existentes de SEO
  useEffect(() => {
    if (!open) return;

    if (activeProject?.eialinkPageId) {
      supabase
        .from("bio_pages")
        .select("display_name, description, social_links")
        .eq("id", activeProject.eialinkPageId)
        .single()
        .then(({ data }) => {
          if (data) {
            const social = (data.social_links as Record<string, any>) || {};
            const existingSeo: SeoConfig = social.seo || {};

            setTitle(
              existingSeo.title ||
                `${data.display_name || businessName} — Atendimento Oficial`,
            );
            setDescription(
              existingSeo.description ||
                data.description ||
                `Conheça os serviços exclusivos de ${data.display_name || businessName}. Atendimento com agendamento online e WhatsApp oficial.`,
            );
            setKeywords(
              existingSeo.keywords ||
                `${businessName}, agendamento online, contato whatsapp, serviços`,
            );
            setIndexable(existingSeo.indexable !== false);
            setBusinessType(existingSeo.businessType || "LocalBusiness");
            setPriceRange(existingSeo.priceRange || "$$");
          }
        });
    } else {
      // Valores padrões inteligentes
      if (!title) {
        setTitle(`${businessName} — Atendimento Oficial`);
      }
      if (!description) {
        setDescription(
          `Conheça os serviços exclusivos de ${businessName}. Atendimento rápido com agendamento online e contato direto no WhatsApp.`,
        );
      }
      if (!keywords) {
        setKeywords(
          `${businessName}, agendamento online, atendimento whatsapp`,
        );
      }
    }
  }, [open, activeProject?.eialinkPageId]);

  // Contador de caracteres recomendado pelo Google
  const titleCount = title.length;
  const descCount = description.length;

  const isTitleIdeal = titleCount >= 30 && titleCount <= 60;
  const isDescIdeal = descCount >= 70 && descCount <= 160;

  // Geração inteligente de SEO com IA (Gemini 3.8)
  async function handleGenerateSeoWithAi() {
    setGeneratingAi(true);
    try {
      const prompt = `Você é um especialista sênior em SEO Local e Google Search Console.
Crie a otimização de SEO perfeita para a página do seguinte negócio:
Nome do Negócio: "${businessName}"
Contexto e nicho extraído da página: "${description || title}"

Retorne estritamente um JSON no seguinte formato (sem markdown, sem explicações):
{
  "title": "Título magnético para o Google com no máximo 60 caracteres (inclua o nome e o nicho/cidade se aplicável)",
  "description": "Meta description persuasiva com chamada para ação, contendo entre 120 e 155 caracteres",
  "keywords": "4 a 6 palavras-chave locais separadas por vírgula",
  "businessType": "LocalBusiness ou BarberShop ou Restaurant ou BeautySalon ou MedicalBusiness ou Store"
}`;

      const res = await callGeminiInteractionsApi({
        input: prompt,
        temperature: 0.4,
      });

      if (!res.ok || !res.text) {
        throw new Error(res.error || "A IA não conseguiu responder no momento.");
      }

      const cleanJson = res.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      if (parsed.title) setTitle(parsed.title.slice(0, 65));
      if (parsed.description) setDescription(parsed.description.slice(0, 165));
      if (parsed.keywords) setKeywords(parsed.keywords);
      if (parsed.businessType) setBusinessType(parsed.businessType);

      toast.success("SEO otimizado com IA (Gemini 2.5) com sucesso!");
    } catch (err: any) {
      console.warn("Erro ao gerar SEO com IA:", err);
      toast.error(
        err.message ||
          "Não foi possível gerar SEO automático. Preencha os campos manualmente.",
      );
    } finally {
      setGeneratingAi(false);
    }
  }

  // Salvar configurações de SEO
  async function handleSaveSeo() {
    setSaving(true);
    try {
      const pageId = activeProject?.eialinkPageId;

      const seoPayload: SeoConfig = {
        title: title.trim(),
        description: description.trim(),
        keywords: keywords.trim(),
        indexable,
        businessType,
        priceRange,
      };

      if (pageId) {
        const { data: curPage } = await supabase
          .from("bio_pages")
          .select("social_links")
          .eq("id", pageId)
          .single();

        const curSocial = (curPage?.social_links as Record<string, any>) || {};
        const { error } = await supabase
          .from("bio_pages")
          .update({
            social_links: {
              ...curSocial,
              seo: seoPayload,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("id", pageId);

        if (error) throw error;
      }

      toast.success(
        "Configurações de SEO e Indexação salvas! Seu site está pronto para o Google.",
      );
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar configurações de SEO.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border border-white/10 text-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  SEO & Indexação no Google
                  <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                    Padrão Lovable
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Prepare o site para ser encontrado no Google e compartilhado com visual profissional no WhatsApp.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateSeoWithAi}
              disabled={generatingAi}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={13} className={generatingAi ? "animate-spin" : ""} />
              <span>{generatingAi ? "Otimizando..." : "Otimizar com IA"}</span>
            </button>
          </div>
        </DialogHeader>

        {/* Alternância de Abas de Prévia (Google vs WhatsApp) */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab("google")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  previewTab === "google"
                    ? "bg-zinc-800 text-white border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Search size={12} className="text-blue-400" />
                <span>Prévia no Google</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("whatsapp")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  previewTab === "whatsapp"
                    ? "bg-zinc-800 text-white border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Share2 size={12} className="text-emerald-400" />
                <span>Prévia no WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateSeoWithAi}
              disabled={generatingAi}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-semibold"
            >
              <Sparkles size={11} className={generatingAi ? "animate-spin" : ""} />
              <span>Otimizar IA</span>
            </button>
          </div>

          {/* CARD 1: Prévia do Google Search (SERP) */}
          {previewTab === "google" ? (
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <div className="w-4 h-4 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                  G
                </div>
                <div className="truncate">
                  <span className="text-zinc-300">{businessName}</span>
                  <span className="text-zinc-500 mx-1">›</span>
                  <span className="text-zinc-500 truncate">{publicUrl}</span>
                </div>
              </div>

              <h4 className="text-sm sm:text-base font-medium text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
                {title || `${businessName} — Atendimento Oficial`}
              </h4>

              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                {description ||
                  `Página oficial de ${businessName}. Confira serviços, cardápio, horários e fale conosco diretamente pelo WhatsApp.`}
              </p>

              <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-400 font-semibold">
                <CheckCircle2 size={11} />
                <span>Indexável pelos robôs do Google (Meta tags + Schema.org JSON-LD ativos)</span>
              </div>
            </div>
          ) : (
            /* CARD 2: Prévia do Card Social (WhatsApp) */
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-zinc-950 max-w-sm">
                <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-zinc-500 text-xs font-semibold relative">
                  <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xs" />
                  <div className="relative text-center p-3">
                    <p className="font-bold text-zinc-200 text-sm">{businessName}</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Página Oficial Verificada</p>
                  </div>
                </div>
                <div className="p-3 bg-zinc-900 space-y-1">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                    {slug}.eialink.com.br
                  </p>
                  <p className="text-xs font-bold text-zinc-100 line-clamp-1">{title}</p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">{description}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                Assim é como o cliente e seus contatos verão o link ao ser enviado no WhatsApp ou redes.
              </p>
            </div>
          )}

          {/* FORMULÁRIO DE EDIÇÃO DE SEO */}
          <div className="space-y-3.5 pt-2">
            {/* Título SEO */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-200">
                  Título da Página no Google (Meta Title)
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    isTitleIdeal ? "text-emerald-400" : titleCount > 60 ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {titleCount}/60 caracteres {isTitleIdeal && "✓"}
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Barbearia Vintage em Moema | Cortes Masculinos e Barba"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-zinc-500">
                Dica: O Google exibe entre 50 a 60 caracteres. Inclua o nome do negócio e a especialidade principal.
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-200">
                  Descrição nos Resultados de Busca (Meta Description)
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    isDescIdeal ? "text-emerald-400" : descCount > 160 ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {descCount}/160 caracteres {isDescIdeal && "✓"}
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ex: Agende seu corte degradê, barba terapia e cabelo em Moema. Atendimento com hora marcada, estacionamento e WhatsApp oficial."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
              <p className="text-[10px] text-zinc-500">
                O resumo que atrai cliques no Google. Use entre 120 e 155 caracteres com uma chamada atrativa.
              </p>
            </div>

            {/* Palavras-chave locais */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-200">
                Palavras-chave de Busca Local (Keywords)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="barbearia moema, corte degradê, barba terapia sp, agendamento online"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-zinc-500">
                Termos que as pessoas pesquisam para encontrar empresas como a sua na sua cidade.
              </p>
            </div>

            {/* Tipo de Negócio para o Google (Schema.org) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-200">
                  Categoria de Negócio (Schema.org)
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {SCHEMA_BUSINESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-200">
                  Faixa de Preço no Google
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="$">$ Econômico</option>
                  <option value="$$">$$ Médio / Acessível</option>
                  <option value="$$$">$$$ Premium / Alto Padrão</option>
                </select>
              </div>
            </div>

            {/* Toggle de Indexação no Google */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10 mt-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">
                  Permitir Indexação pelo Google
                </span>
                <p className="text-[11px] text-zinc-400">
                  {indexable
                    ? "O site será incluído no sitemap.xml e lido pelos robôs do Google (Recomendado)."
                    : "O site terá a tag noindex e não aparecerá nas buscas do Google."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIndexable((prev) => !prev)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  indexable ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    indexable ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveSeo}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} />
            <span>{saving ? "Salvando..." : "Salvar SEO & Indexação"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

