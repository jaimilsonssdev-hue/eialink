import React, { useState, useEffect } from "react";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Save,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Palette,
  FileText,
  ShoppingBag,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageService } from "@/modules/page/services/PageService";
import type { CinematicPageData } from "@/modules/cinematic/types";
import { TemplateRenderer } from "@/modules/templates/components/TemplateRenderer";

export function CleanBuilder() {
  const search = useSearch({ from: "/_authenticated/builder" }) as { page?: string };
  const navigate = useNavigate();
  const pageParam = search.page;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageRecord, setPageRecord] = useState<any>(null);

  // Estados editáveis do site (puro estado React - zero delay, zero custo de IA)
  const [businessName, setBusinessName] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [heroImage, setHeroImage] = useState("");

  // Estilo & Cores
  const [bgColor, setBgColor] = useState("#0a0a0c");
  const [accentColor, setAccentColor] = useState("#f59e0b");

  // Vitrine de Produtos / Serviços
  const [items, setItems] = useState<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      price: string;
      badge?: string;
      imageUrl: string;
    }>
  >([]);

  // Visualização (Mobile ou Desktop)
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  // Aba ativa do Inspetor Lateral: "texts" | "products" | "style" | "contact"
  const [activeTab, setActiveTab] = useState<"texts" | "products" | "style" | "contact">("texts");

  useEffect(() => {
    loadPageData();
  }, [pageParam]);

  async function loadPageData() {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      let query = supabase.from("bio_pages").select("*");
      if (pageParam) {
        query = query.or(`slug.eq.${pageParam},id.eq.${pageParam}`);
      } else {
        query = query.eq("user_id", u.user.id).order("updated_at", { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        toast.error("Nenhuma página encontrada para editar.");
        setLoading(false);
        return;
      }

      setPageRecord(data);
      setBusinessName(data.display_name || "");
      setWhatsapp(data.whatsapp || "");
      setAddress(data.address || "");

      const social = (data.social_links as any) || {};
      const cinematic: CinematicPageData | undefined = social.cinematicData;

      if (cinematic) {
        setHeadline(cinematic.hero?.title || data.display_name || "");
        setSubtitle(cinematic.hero?.subtitle || data.bio || "");
        setValueProp(cinematic.hero?.tagline || "");
        setHeroImage(cinematic.hero?.backgroundImage || "");
        setBgColor(cinematic.theme?.bg || "#0a0a0c");
        setAccentColor(cinematic.theme?.accent || "#f59e0b");

        const loadedItems = (cinematic.highlights || []).map((h, idx) => ({
          id: h.id || `item_${idx}`,
          title: h.title,
          subtitle: h.subtitle || "",
          price: h.price || "Sob Consulta",
          badge: h.badge || "Destaque",
          imageUrl: h.imageUrl || "",
        }));
        setItems(loadedItems);
      } else {
        setHeadline(data.display_name || "");
        setSubtitle(data.bio || "");
      }
    } catch (err) {
      console.error("Erro ao carregar página no Builder Clean:", err);
      toast.error("Erro ao carregar dados da página.");
    } finally {
      setLoading(false);
    }
  }

  // Adiciona novo item na vitrine
  function handleAddItem() {
    const newItem = {
      id: `item_${Date.now()}`,
      title: "Novo Produto / Serviço",
      subtitle: "Descrição objetiva e atrativa",
      price: "R$ 90,00",
      badge: "Novidade",
      imageUrl: heroImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    };
    setItems([...items, newItem]);
    toast.success("Item adicionado na vitrine!");
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
    toast.info("Item removido.");
  }

  function handleItemChange(id: string, field: string, val: string) {
    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  }

  // Salva no banco de dados com velocidade instantânea e custo zero
  async function handleSave() {
    if (!pageRecord?.id) return;
    setSaving(true);
    try {
      const social = (pageRecord.social_links as any) || {};
      const currentCinematic: CinematicPageData = social.cinematicData || {
        businessName,
        niche: pageRecord.niche || "Geral",
        whatsapp,
        rating: pageRecord.google_rating || 4.9,
      };

      const cleanWhatsapp = whatsapp.replace(/\D/g, "");

      const updatedCinematic: CinematicPageData = {
        ...currentCinematic,
        businessName,
        whatsapp: cleanWhatsapp,
        address,
        theme: {
          ...currentCinematic.theme,
          bg: bgColor,
          accent: accentColor,
        },
        hero: {
          ...currentCinematic.hero,
          title: headline,
          subtitle,
          tagline: valueProp,
          backgroundImage: heroImage,
          ctaText: "Pedir pelo WhatsApp",
          ctaLink: `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
            `Olá! Vim pelo site da ${businessName} e gostaria de informações.`
          )}`,
        },
        highlights: items.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.subtitle,
          description: i.subtitle,
          price: i.price,
          duration: "Consulte opções",
          badge: i.badge || "Destaque",
          imageUrl: i.imageUrl || heroImage,
          features: ["Qualidade assegurada", "Atendimento exclusivo"],
        })),
      };

      const { error } = await supabase
        .from("bio_pages")
        .update({
          display_name: businessName,
          bio: subtitle,
          whatsapp: cleanWhatsapp,
          address,
          social_links: {
            ...social,
            theme: {
              ...social.theme,
              bg: bgColor,
              accent: accentColor,
            },
            cinematicData: updatedCinematic,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageRecord.id);

      if (error) throw error;

      toast.success("Site salvo com sucesso! Alterações já estão no ar.");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  // Copia o link público
  function handleCopyPublicLink() {
    if (!pageRecord?.slug) return;
    const url = `${window.location.origin}/p/${pageRecord.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do site copiado para a área de transferência!");
  }

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-medium tracking-wide">Carregando Editor Clean...</span>
      </div>
    );
  }

  if (!pageRecord) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-zinc-400">Nenhum site selecionado para edição.</p>
        <Link
          to="/pages"
          className="px-4 py-2 rounded-xl bg-primary text-zinc-950 font-bold text-xs"
        >
          Ver minhas páginas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#07070a] text-zinc-100">
      {/* Barra Superior do Builder Clean */}
      <header className="h-14 border-b border-white/10 bg-black/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/pages"
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
            title="Voltar para páginas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{businessName || "Meu Site"}</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                /p/{pageRecord.slug}
              </span>
            </h1>
          </div>
        </div>

        {/* Controles Centrais: Alternar Tela */}
        <div className="hidden sm:flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "mobile" ? "bg-white/15 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
            title="Visualização Mobile (Celular)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "desktop" ? "bg-white/15 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
            title="Visualização Desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar Link</span>
          </button>

          <a
            href={`/p/${pageRecord.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver no Ar</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal: Inspetor Lateral (Esquerda) + Preview em Tempo Real (Direita) */}
      <div className="flex-1 flex overflow-hidden">
        {/* PAINEL LATERAL DE EDIÇÃO (INSPECTOR LIMPO & DIRETO) */}
        <aside className="w-full sm:w-[380px] lg:w-[420px] border-r border-white/10 bg-[#09080e] flex flex-col shrink-0 overflow-hidden">
          {/* Abas Superiores do Inspetor */}
          <div className="flex border-b border-white/10 bg-black/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("texts")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "texts"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Textos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "products"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Vitrine</span>
              <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{items.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "style"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Cores</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "contact"
                  ? "bg-white/15 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Contato</span>
            </button>
          </div>

          {/* Conteúdo da Aba Selecionada */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ABA 1: TEXTOS & HERO */}
            {activeTab === "texts" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Nome do Negócio</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Título Principal (Headline)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Alta Gastronomia Artesanal"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Subtítulo / Proposta</label>
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    rows={3}
                    placeholder="Descrição envolvente do negócio..."
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Frase de Destaque (Tagline)</label>
                  <input
                    type="text"
                    value={valueProp}
                    onChange={(e) => setValueProp(e.target.value)}
                    placeholder="Ex: ELEITO O MELHOR HAMBÚRGUER DA REGIÃO"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Foto de Fundo da Hero (URL)</label>
                  <input
                    type="url"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
            )}

            {/* ABA 2: VITRINE & PRODUTOS */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Itens do Cardápio / Serviços ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl p-4">
                    Nenhum item na vitrine. Clique em "Adicionar Item" acima.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2.5 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                            placeholder="Nome do produto ou serviço"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                            placeholder="Preço (Ex: R$ 45)"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/60"
                          />
                          <input
                            type="text"
                            value={item.badge || ""}
                            onChange={(e) => handleItemChange(item.id, "badge", e.target.value)}
                            placeholder="Badge (Ex: Mais Pedido)"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={(e) => handleItemChange(item.id, "subtitle", e.target.value)}
                            placeholder="Descrição breve ou ingredientes"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>

                        <div>
                          <input
                            type="url"
                            value={item.imageUrl}
                            onChange={(e) => handleItemChange(item.id, "imageUrl", e.target.value)}
                            placeholder="URL da foto do item (https://...)"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-[11px] text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/60"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: CORES & ESTILO */}
            {activeTab === "style" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Cor de Destaque (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Paleta rápida de 1 toque */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { name: "Âmbar Nobre", color: "#f59e0b" },
                      { name: "Esmeralda", color: "#10b981" },
                      { name: "Cyan Elétrico", color: "#00f0ff" },
                      { name: "Volt Neon", color: "#ccff00" },
                      { name: "Magenta VIP", color: "#ec4899" },
                    ].map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setAccentColor(p.color)}
                        className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 flex items-center gap-1.5 transition"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Cor de Fundo da Página
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: CONTATO & WHATSAPP */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">WhatsApp de Atendimento</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 73999999999"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Apenas dígitos com DDD. Todos os botões do site encaminham para este número.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Endereço Completo</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Presidente Vargas, 120 - Centro"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ÁREA CENTRAL: PREVIEW EM TEMPO REAL (MOCKUP INTELIGENTE) */}
        <main className="flex-1 bg-[#050408] overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div
            className={`transition-all duration-300 shadow-2xl overflow-hidden rounded-[2.5rem] border-4 border-zinc-800 bg-black flex flex-col ${
              viewMode === "mobile"
                ? "w-[375px] h-[720px] max-h-[85vh]"
                : "w-full max-w-4xl h-[720px] max-h-[85vh] rounded-2xl border-zinc-700"
            }`}
          >
            {/* Notch / Câmera do Smartphone */}
            {viewMode === "mobile" && (
              <div className="h-6 w-full bg-black shrink-0 flex items-center justify-center">
                <div className="w-24 h-4 bg-zinc-900 rounded-b-xl" />
              </div>
            )}

            {/* Simulação em tempo real dos dados atualizados */}
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: bgColor }}>
              <iframe
                title="Preview do Site"
                src={`/p/${pageRecord.slug}`}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
