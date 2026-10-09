import React, { useState, useEffect } from "react";
import {
  Type,
  Palette,
  Sparkles,
  Phone,
  Image as ImageIcon,
  Check,
  Upload,
  RefreshCw,
  Sliders,
  ExternalLink,
  Layers,
  Zap,
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

interface DesignStyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GOOGLE_FONTS = [
  { id: "inter", name: "Inter", category: "Moderna & Clean", fontUrl: "Inter:wght@400;500;600;700;800", family: "'Inter', sans-serif" },
  { id: "poppins", name: "Poppins", category: "Geométrica & Comercial", fontUrl: "Poppins:wght@400;500;600;700;800", family: "'Poppins', sans-serif" },
  { id: "plus-jakarta", name: "Plus Jakarta Sans", category: "SaaS & Premium", fontUrl: "Plus+Jakarta+Sans:wght@400;500;600;700;800", family: "'Plus Jakarta Sans', sans-serif" },
  { id: "montserrat", name: "Montserrat", category: "Elegante & Corporativo", fontUrl: "Montserrat:wght@400;500;600;700;800", family: "'Montserrat', sans-serif" },
  { id: "playfair", name: "Playfair Display", category: "Luxo & Serifada", fontUrl: "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400", family: "'Playfair Display', serif" },
  { id: "space-grotesk", name: "Space Grotesk", category: "Tech & Futurista", fontUrl: "Space+Grotesk:wght@400;500;600;700", family: "'Space Grotesk', sans-serif" },
  { id: "syne", name: "Syne", category: "Design Arrojado & Trendy", fontUrl: "Syne:wght@500;700;800", family: "'Syne', sans-serif" },
  { id: "outfit", name: "Outfit", category: "Minimalista & Estilosa", fontUrl: "Outfit:wght@400;500;600;700", family: "'Outfit', sans-serif" },
];

const COLOR_PRESETS = [
  { name: "Esmeralda Tech", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-400" },
  { name: "Azul Royal", hex: "#2563eb", bg: "bg-blue-600", text: "text-blue-400" },
  { name: "Roxo Neon", hex: "#8b5cf6", bg: "bg-purple-500", text: "text-purple-400" },
  { name: "Laranja Vibrante", hex: "#ea580c", bg: "bg-orange-600", text: "text-orange-400" },
  { name: "Dourado Luxo", hex: "#eab308", bg: "bg-yellow-500", text: "text-yellow-400" },
  { name: "Vermelho Carmim", hex: "#dc2626", bg: "bg-red-600", text: "text-red-400" },
  { name: "Rosa Shock", hex: "#db2777", bg: "bg-pink-600", text: "text-pink-400" },
  { name: "Ciano Cyber", hex: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-400" },
];

const BACKGROUND_PRESETS = [
  {
    id: "dark-obsidian",
    name: "Dark Obsidian (Padrão Luxo)",
    description: "Fundo preto puro com contraste cirúrgico para delivery e tecnologia.",
    css: "body { background-color: #09090b !important; color: #f4f4f5 !important; }",
  },
  {
    id: "cyber-mesh",
    name: "Cyber Mesh (Gradiente Tech)",
    description: "Luzes volumétricas de ciano e violeta nos cantos da tela.",
    css: "body { background: radial-gradient(ellipse at 15% 15%, rgba(139, 92, 246, 0.22) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(6, 182, 212, 0.18) 0%, transparent 45%), #09090b !important; color: #f4f4f5 !important; }",
  },
  {
    id: "sunset-glow",
    name: "Sunset Ember (Gastronomia & Calor)",
    description: "Gradiente quente que desperta apetite e destaca produtos.",
    css: "body { background: radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.2) 0%, transparent 55%), #0c0a09 !important; color: #fafaf9 !important; }",
  },
  {
    id: "gold-luxury",
    name: "Gold Champagne (Barbearia & Joalheria)",
    description: "Luminosidade dourada refinada com tons escuros.",
    css: "body { background: radial-gradient(ellipse at 50% 0%, rgba(234, 179, 8, 0.18) 0%, transparent 50%), #0c0b06 !important; color: #fefce8 !important; }",
  },
  {
    id: "emerald-forest",
    name: "Emerald Glow (Alta Conversão)",
    description: "Destaque verde esmeralda para vendas rápidas e delivery.",
    css: "body { background: radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.22) 0%, transparent 50%), #06120d !important; color: #ecfdf5 !important; }",
  },
  {
    id: "clean-light",
    name: "Clean Light (Moda & Editorial)",
    description: "Fundo branco puro com tipografia escura elegante.",
    css: "body { background: #fdfdfd !important; color: #18181b !important; } .text-white { color: #18181b !important; } .bg-zinc-900, .bg-black { background: #f4f4f5 !important; color: #18181b !important; border-color: #e4e4e7 !important; }",
  },
];

export function DesignStyleModal({ open, onOpenChange }: DesignStyleModalProps) {
  const { getActiveProject, updateActiveProjectHtml } = useCreativeStudioStore();
  const activeProject = getActiveProject();

  const [activeTab, setActiveTab] = useState<"typography" | "colors" | "effects" | "contacts" | "images">("typography");

  // Estado de personalização
  const [selectedFont, setSelectedFont] = useState<string>("inter");
  const [selectedBg, setSelectedBg] = useState<string>("dark-obsidian");
  const [selectedPrimaryColor, setSelectedPrimaryColor] = useState<string>("#10b981");

  // Toggles de Efeitos
  const [effects, setEffects] = useState({
    glassmorphism: false,
    neobrutalism: false,
    parallax: false,
  });

  // Contatos
  const [contacts, setContacts] = useState({
    whatsapp: "",
    phone: "",
    instagram: "",
    address: "",
  });

  // Imagens extraídas do HTML
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [replacingImgIndex, setReplacingImgIndex] = useState<number | null>(null);
  const [newImgInputUrl, setNewImgInputUrl] = useState<string>("");

  // Analisa o HTML atual e extrai imagens e contatos existentes
  useEffect(() => {
    if (!open || !activeProject?.html) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(activeProject.html, "text/html");

      // Extrai imagens
      const imgs: string[] = [];
      doc.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("data:image/svg") && !imgs.includes(src)) {
          imgs.push(src);
        }
      });
      setPageImages(imgs);

      // Tenta detectar WhatsApp existente nos links
      const waLink = doc.querySelector('a[href*="wa.me/"]');
      if (waLink) {
        const href = waLink.getAttribute("href") || "";
        const match = href.match(/wa\.me\/(\d+)/);
        if (match && match[1]) {
          setContacts((prev) => ({ ...prev, whatsapp: match[1] }));
        }
      }

      // Tenta detectar Instagram existente
      const instaLink = doc.querySelector('a[href*="instagram.com/"]');
      if (instaLink) {
        const href = instaLink.getAttribute("href") || "";
        const match = href.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
        if (match && match[1]) {
          setContacts((prev) => ({ ...prev, instagram: `@${match[1]}` }));
        }
      }

      // Tenta identificar efeitos já ativos
      if (activeProject.html.includes("id=\"eialink-neobrutalism-style\"")) {
        setEffects((prev) => ({ ...prev, neobrutalism: true }));
      }
      if (activeProject.html.includes("id=\"eialink-glassmorphism-style\"")) {
        setEffects((prev) => ({ ...prev, glassmorphism: true }));
      }
      if (activeProject.html.includes("id=\"eialink-parallax-style\"")) {
        setEffects((prev) => ({ ...prev, parallax: true }));
      }
    } catch (e) {
      console.warn("Erro ao inspecionar HTML no modal de design:", e);
    }
  }, [open, activeProject?.html]);

  // Função utilitária para substituir ou injetar uma tag de estilo específica no HTML
  function injectStyleTag(sourceHtml: string, styleId: string, cssContent: string | null): string {
    if (!sourceHtml) return sourceHtml;

    // Se cssContent for nulo ou vazio, apenas remove o estilo
    const regex = new RegExp(`<style id="${styleId}">[\\s\\S]*?<\\/style>`, "gi");
    let cleaned = sourceHtml.replace(regex, "");

    if (!cssContent) return cleaned;

    const newTag = `<style id="${styleId}">${cssContent}</style>`;
    if (cleaned.includes("</head>")) {
      return cleaned.replace("</head>", `${newTag}\n</head>`);
    }
    return `${newTag}\n${cleaned}`;
  }

  // 1. Aplica Tipografia
  function handleApplyFont(font: typeof GOOGLE_FONTS[0]) {
    setSelectedFont(font.id);
    if (!activeProject?.html) return;

    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${font.fontUrl}&display=swap');`;
    const css = `
      ${fontImport}
      body, button, input, select, textarea, p, h1, h2, h3, h4, h5, h6, span, a, li, label, strong, b {
        font-family: ${font.family} !important;
      }
    `;

    const updatedHtml = injectStyleTag(activeProject.html, "eialink-typography-style", css);
    updateActiveProjectHtml(updatedHtml);
    toast.success(`Tipografia alterada para ${font.name}!`);
  }

  // 2. Aplica Paleta / Fundo
  function handleApplyBackground(preset: typeof BACKGROUND_PRESETS[0]) {
    setSelectedBg(preset.id);
    if (!activeProject?.html) return;

    const updatedHtml = injectStyleTag(activeProject.html, "eialink-background-style", preset.css);
    updateActiveProjectHtml(updatedHtml);
    toast.success(`Fundo alterado para ${preset.name}!`);
  }

  // 3. Aplica Cor Primária de Botões e Destaques
  function handleApplyPrimaryColor(colorHex: string) {
    setSelectedPrimaryColor(colorHex);
    if (!activeProject?.html) return;

    const css = `
      :root {
        --primary-color: ${colorHex} !important;
      }
      .bg-emerald-500, .bg-emerald-600, .bg-blue-600, .bg-blue-500, [data-color="primary"], .btn-primary, button.primary {
        background-color: ${colorHex} !important;
      }
      .text-emerald-400, .text-emerald-500, .text-blue-400 {
        color: ${colorHex} !important;
      }
      .border-emerald-500, .border-emerald-400 {
        border-color: ${colorHex} !important;
      }
      .ring-emerald-500 {
        --tw-ring-color: ${colorHex} !important;
      }
    `;

    const updatedHtml = injectStyleTag(activeProject.html, "eialink-color-style", css);
    updateActiveProjectHtml(updatedHtml);
    toast.success("Cor de botões e destaques atualizada!");
  }

  // 4. Alterna Efeitos (Neobrutalismo, Glassmorphism, Parallax)
  function handleToggleEffect(effectKey: keyof typeof effects) {
    const nextState = !effects[effectKey];
    setEffects((prev) => ({ ...prev, [effectKey]: nextState }));

    if (!activeProject?.html) return;
    let html = activeProject.html;

    if (effectKey === "neobrutalism") {
      const css = nextState
        ? `
          /* Efeito Neobrutalismo Moderno */
          div[class*="rounded-"], section, .card, div[class*="border"] {
            border: 2px solid #000000 !important;
            box-shadow: 4px 4px 0px #000000 !important;
          }
          button, a[class*="rounded-"], .btn-primary {
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            transition: transform 0.1s ease, box-shadow 0.1s ease !important;
          }
          button:active, a[class*="rounded-"]:active {
            transform: translate(2px, 2px) !important;
            box-shadow: 1px 1px 0px #000000 !important;
          }
        `
        : null;
      html = injectStyleTag(html, "eialink-neobrutalism-style", css);
    }

    if (effectKey === "glassmorphism") {
      const css = nextState
        ? `
          /* Efeito Glassmorphism (Vidro Fosco) */
          div[class*="bg-zinc-900"], div[class*="bg-black"], div[class*="bg-stone-900"], div[class*="bg-zinc-950"], .card {
            background: rgba(255, 255, 255, 0.05) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
        `
        : null;
      html = injectStyleTag(html, "eialink-glassmorphism-style", css);
    }

    if (effectKey === "parallax") {
      const css = nextState
        ? `
          /* Efeito de Profundidade e Rolagem Suave */
          html {
            scroll-behavior: smooth !important;
          }
          header, [class*="hero"], img {
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          img:hover {
            transform: scale(1.02) !important;
          }
        `
        : null;
      html = injectStyleTag(html, "eialink-parallax-style", css);
    }

    updateActiveProjectHtml(html);
    toast.success(nextState ? `Efeito ativado!` : `Efeito desativado!`);
  }

  // 5. Aplica Contatos (WhatsApp, Telefone, Instagram)
  function handleApplyContacts() {
    if (!activeProject?.html) return;
    let html = activeProject.html;

    const rawWa = contacts.whatsapp.replace(/\D/g, "");
    if (rawWa && rawWa.length >= 10) {
      // Substitui links de WhatsApp wa.me/X
      html = html.replace(/https?:\/\/wa\.me\/\d+/g, `https://wa.me/55${rawWa.replace(/^55/, "")}`);
      html = html.replace(/api\.whatsapp\.com\/send\?phone=\d+/g, `api.whatsapp.com/send?phone=55${rawWa.replace(/^55/, "")}`);
    }

    if (contacts.instagram) {
      const user = contacts.instagram.replace(/^@/, "").trim();
      if (user) {
        html = html.replace(/https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+/g, `https://instagram.com/${user}`);
      }
    }

    if (contacts.phone) {
      const phoneClean = contacts.phone.replace(/\D/g, "");
      if (phoneClean) {
        html = html.replace(/tel:\+?\d+/g, `tel:+55${phoneClean.replace(/^55/, "")}`);
      }
    }

    updateActiveProjectHtml(html);
    toast.success("Contatos e redes sociais atualizados em todos os botões do site!");
  }

  // 6. Troca de Foto Selecionada
  function handleReplaceImage(oldSrc: string, newSrc: string) {
    if (!activeProject?.html || !newSrc.trim()) return;

    // Substitui a imagem no HTML
    const escapedOld = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedOld, "g");
    const updated = activeProject.html.replace(regex, newSrc.trim());

    updateActiveProjectHtml(updated);

    // Atualiza lista local
    setPageImages((prev) => prev.map((img) => (img === oldSrc ? newSrc.trim() : img)));
    setReplacingImgIndex(null);
    setNewImgInputUrl("");
    toast.success("Foto atualizada com sucesso no site!");
  }

  function handleUploadImageFile(e: React.ChangeEvent<HTMLInputElement>, oldSrc: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        handleReplaceImage(oldSrc, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 text-zinc-100 max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-white/[0.08] bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Palette size={16} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Design & Estilo Visual
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  No-Code
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Personalize tipografia, gradientes de fundo, botões e efeitos modernos sem depender de IA.
              </DialogDescription>
            </div>
          </div>

          {/* Abas Superiores de Navegação */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("typography")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === "typography"
                  ? "bg-emerald-500 text-black shadow-sm font-bold"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Type size={13} />
              <span>Tipografia & Fontes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("colors")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === "colors"
                  ? "bg-emerald-500 text-black shadow-sm font-bold"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Palette size={13} />
              <span>Cores & Gradientes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("effects")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === "effects"
                  ? "bg-emerald-500 text-black shadow-sm font-bold"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Sparkles size={13} />
              <span>Efeitos Modernos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("contacts")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === "contacts"
                  ? "bg-emerald-500 text-black shadow-sm font-bold"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Phone size={13} />
              <span>Contatos & Redes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === "images"
                  ? "bg-emerald-500 text-black shadow-sm font-bold"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <ImageIcon size={13} />
              <span>Fotos do Site ({pageImages.length})</span>
            </button>
          </div>
        </DialogHeader>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ABA 1: TIPOGRAFIA */}
          {activeTab === "typography" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Fontes Consagradas do Google Fonts
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Clique em qualquer família tipográfica para aplicar instantaneamente a todo o site.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOOGLE_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleApplyFont(font)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
                      selectedFont === font.id
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                        : "bg-zinc-900/60 border-white/[0.08] hover:bg-zinc-800/80 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {font.name}
                      </span>
                      {selectedFont === font.id && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1">{font.category}</span>
                    <p
                      className="text-xs text-zinc-300 mt-3 pt-2 border-t border-white/5 truncate"
                      style={{ fontFamily: font.family }}
                    >
                      A melhor experiência para seus clientes comprar e agendar.
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: CORES & GRADIENTES */}
          {activeTab === "colors" && (
            <div className="space-y-6">
              {/* Presets de Cor Primária (Botões e Destaques) */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Cor dos Botões de Compra e Destaques
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Modifica a cor dos botões principais, sacola, botões de WhatsApp e selos de oferta.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleApplyPrimaryColor(color.hex)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        selectedPrimaryColor === color.hex
                          ? "bg-zinc-800 border-white/40 ring-1 ring-white/30"
                          : "bg-zinc-900/60 border-white/[0.08] hover:bg-zinc-800"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${color.bg} shadow-sm shrink-0`} />
                      <span className="text-xs font-semibold text-zinc-200 truncate">{color.name}</span>
                    </button>
                  ))}
                </div>

                {/* Seletor Customizado Hex */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-zinc-400">Ou defina cor exata:</span>
                  <input
                    type="color"
                    value={selectedPrimaryColor}
                    onChange={(e) => handleApplyPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Escolher cor personalizada"
                  />
                  <span className="text-xs font-mono text-zinc-300">{selectedPrimaryColor}</span>
                </div>
              </div>

              {/* Presets de Fundo e Gradientes */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Gradientes de Fundo & Iluminação de 1 Clique
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Troque a atmosfera do site entre ultra-moderno, quente apetitoso, minimalista ou luxuoso.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BACKGROUND_PRESETS.map((bgPreset) => (
                    <button
                      key={bgPreset.id}
                      type="button"
                      onClick={() => handleApplyBackground(bgPreset)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        selectedBg === bgPreset.id
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                          : "bg-zinc-900/60 border-white/[0.08] hover:bg-zinc-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{bgPreset.name}</span>
                        {selectedBg === bgPreset.id && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{bgPreset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: EFEITOS MODERNOS */}
          {activeTab === "effects" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Chaves de Efeitos Especiais (1 Clique)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ative visuais consagrados na web moderna sem escrever nenhuma linha de CSS.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Neobrutalismo */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Neobrutalismo Moderno</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Tendência 2026
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Bordas pretas marcantes de 2px, sombras sólidas e cantos limpos que dão personalidade jovem e moderna.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEffect("neobrutalism")}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                      effects.neobrutalism ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        effects.neobrutalism ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Glassmorphism */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Glassmorphism (Vidro Fosco)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        High-End
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Cards translúcidos com desfoque de fundo (backdrop-blur) e bordas finas com brilho suave.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEffect("glassmorphism")}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                      effects.glassmorphism ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        effects.glassmorphism ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Parallax / Suavização */}
                <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Parallax & Motion Suave</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Cinemático
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Rolagem fluida da página e efeito de zoom com profundidade ao passar o mouse sobre fotos e banners.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEffect("parallax")}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                      effects.parallax ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        effects.parallax ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: CONTATOS & REDES */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Contatos & Redes Sociais da Empresa
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Altere aqui os números e links. Ao salvar, todos os botões do site serão atualizados instantaneamente.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    WhatsApp para Pedidos e Atendimento:
                  </label>
                  <input
                    type="text"
                    value={contacts.whatsapp}
                    onChange={(e) => setContacts((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="Ex: 11999998888"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Atualiza todos os botões de "Pedir no WhatsApp", "Fazer Pedido" e links wa.me/.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Instagram da Empresa:
                  </label>
                  <input
                    type="text"
                    value={contacts.instagram}
                    onChange={(e) => setContacts((prev) => ({ ...prev, instagram: e.target.value }))}
                    placeholder="Ex: @suaempresa"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Telefone Fixo / Ligação:
                  </label>
                  <input
                    type="text"
                    value={contacts.phone}
                    onChange={(e) => setContacts((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ex: 1133334444"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyContacts}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 mt-4"
                >
                  <Zap size={14} />
                  <span>Aplicar Contatos em Todo o Site</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 5: FOTOS DO SITE */}
          {activeTab === "images" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Galeria de Fotos do Site
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Veja todas as imagens utilizadas na página e substitua qualquer uma por upload ou link de internet.
                </p>
              </div>

              {pageImages.length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-white/5">
                  <p className="text-xs text-zinc-500">Nenhuma imagem detectada no HTML deste projeto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pageImages.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative h-28 w-full bg-zinc-950 overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={`Imagem ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                          Foto #{idx + 1}
                        </span>
                      </div>

                      <div className="p-2 space-y-1.5 bg-zinc-900">
                        {replacingImgIndex === idx ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newImgInputUrl}
                              onChange={(e) => setNewImgInputUrl(e.target.value)}
                              placeholder="Cole o link da foto..."
                              className="w-full bg-zinc-950 border border-white/20 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleReplaceImage(imgSrc, newImgInputUrl)}
                                className="flex-1 py-1 rounded bg-emerald-500 text-black font-bold text-[10px]"
                              >
                                Salvar Link
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplacingImgIndex(null)}
                                className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <label className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors">
                              <Upload size={11} />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadImageFile(e, imgSrc)}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setReplacingImgIndex(idx);
                                setNewImgInputUrl(imgSrc);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors"
                              title="Substituir por URL de imagem"
                            >
                              URL
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

