import { useState } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  Palette,
  Plus,
  Trash2,
  Check,
  Type,
  User,
  Scissors,
  ChevronDown,
  ChevronUp,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { AgendaStudioData, AgendaServiceItem, AgendaProfessional } from "./agendaAiService";

interface AgendaVisualEditorProps {
  agenda: AgendaStudioData;
  onChange: (updated: AgendaStudioData) => void;
}

const PALETTE_COLORS = [
  { name: "Violeta / Roxo", hex: "#8b5cf6" },
  { name: "Dourado Nobre", hex: "#f59e0b" },
  { name: "Esmeralda Barber", hex: "#10b981" },
  { name: "Azul Safira", hex: "#3b82f6" },
  { name: "Rose Chic", hex: "#ec4899" },
  { name: "Âmbar Elegance", hex: "#d97706" },
  { name: "Grafite / Dark", hex: "#27272a" },
  { name: "Vermelho Rubi", hex: "#ef4444" },
];

const VISUAL_EFFECTS = [
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    desc: "Vidro fosco moderno, blur e bordas suaves luminosas",
    badge: "Moderno",
  },
  {
    id: "elegante",
    name: "Elegante Dark Gold",
    desc: "Visual luxuoso com detalhes dourados e fundo profundo",
    badge: "Premium",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalismo",
    desc: "Bordas marcadas, alto contraste e personalidade marcante",
    badge: "Pop / Retrô",
  },
  {
    id: "parallax",
    name: "Parallax 3D",
    desc: "Sensação de profundidade com elevação em cartões e banners",
    badge: "Dinâmico",
  },
  {
    id: "clean",
    name: "Clean Minimal",
    desc: "Espaçamento leve e foco total nos horários e serviços",
    badge: "Clássico",
  },
] as const;

const FONT_OPTIONS = [
  { id: "Inter", name: "Inter (Padrão do Sistema)" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Moderna & Arrojada)" },
  { id: "Outfit", name: "Outfit (Geométrica & Descolada)" },
  { id: "Playfair Display", name: "Playfair Display (Sofisticada & Clássica)" },
  { id: "Space Grotesk", name: "Space Grotesk (Urbana & Futurista)" },
];

export function AgendaVisualEditor({ agenda, onChange }: AgendaVisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"info" | "services" | "pros" | "design" | "tools">("info");
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(agenda.services[0]?.id || null);

  function updateField<K extends keyof AgendaStudioData>(key: K, value: AgendaStudioData[K]) {
    onChange({ ...agenda, [key]: value });
  }

  function updateFeature(key: string, enabled: boolean) {
    onChange({
      ...agenda,
      features: {
        ...(agenda.features || {}),
        [key]: enabled,
      },
    });
  }

  // Serviços
  function handleUpdateService(id: string, field: keyof AgendaServiceItem, value: any) {
    const updated = agenda.services.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    onChange({ ...agenda, services: updated });
  }

  function handleAddService() {
    const newService: AgendaServiceItem = {
      id: `srv-${Date.now()}`,
      name: "Novo Procedimento / Serviço",
      description: "Descreva o que está incluso e diferenciais.",
      price: 60.0,
      durationMinutes: 45,
      category: "geral",
      badge: "Recomendado",
      popular: false,
    };
    onChange({ ...agenda, services: [newService, ...agenda.services] });
    setExpandedServiceId(newService.id);
  }

  function handleRemoveService(id: string) {
    onChange({ ...agenda, services: agenda.services.filter((s) => s.id !== id) });
  }

  // Profissionais
  function handleUpdatePro(id: string, field: keyof AgendaProfessional, value: any) {
    const updated = agenda.professionals.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    onChange({ ...agenda, professionals: updated });
  }

  function handleAddPro() {
    const newPro: AgendaProfessional = {
      id: `pro-${Date.now()}`,
      name: "Novo Especialista",
      role: "Especialista Master",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    };
    onChange({ ...agenda, professionals: [...agenda.professionals, newPro] });
  }

  function handleRemovePro(id: string) {
    onChange({ ...agenda, professionals: agenda.professionals.filter((p) => p.id !== id) });
  }

  const currentFeatures = {
    selectPro: agenda.features?.selectPro ?? true,
    selectDate: agenda.features?.selectDate ?? true,
    whatsappBooking: agenda.features?.whatsappBooking ?? true,
    mapLocation: agenda.features?.mapLocation ?? true,
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sub-menu de navegação do Editor */}
      <div className="grid grid-cols-5 p-1.5 bg-zinc-900/80 border-b border-white/10 gap-1 text-[10px] shrink-0 font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`py-1.5 px-0.5 rounded-lg transition-all text-center truncate ${
            activeTab === "info"
              ? "bg-purple-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📋 Dados
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`py-1.5 px-0.5 rounded-lg transition-all text-center truncate ${
            activeTab === "services"
              ? "bg-purple-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ✂️ Serviços ({agenda.services.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pros")}
          className={`py-1.5 px-0.5 rounded-lg transition-all text-center truncate ${
            activeTab === "pros"
              ? "bg-purple-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          💈 Equipe ({agenda.professionals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`py-1.5 px-0.5 rounded-lg transition-all text-center truncate ${
            activeTab === "design"
              ? "bg-purple-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          🎨 Estilos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tools")}
          className={`py-1.5 px-0.5 rounded-lg transition-all text-center truncate ${
            activeTab === "tools"
              ? "bg-purple-600 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ⚙️ Recursos
        </button>
      </div>

      {/* Conteúdo Rolável da Aba */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ABA 1: DADOS & INFORMAÇÕES */}
        {activeTab === "info" && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Nome do Negócio / Espaço</label>
              <Input
                value={agenda.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Ex: Dom Barbeiro Studio"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Slogan / Tagline</label>
              <Input
                value={agenda.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="Ex: Corte clássico, barba na toalha quente e atendimento premium"
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Apresentação / Descrição</label>
              <Textarea
                value={agenda.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Conte sobre o ambiente, experiência e diferenciais..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">WhatsApp de Agendamentos</label>
                <Input
                  value={agenda.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="5511999999999"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Instagram</label>
                <Input
                  value={agenda.instagram || ""}
                  onChange={(e) => updateField("instagram", e.target.value)}
                  placeholder="@dombarbeiro"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Horários de Atendimento</label>
                <Input
                  value={agenda.openingHours || ""}
                  onChange={(e) => updateField("openingHours", e.target.value)}
                  placeholder="Ter a Sáb das 9h às 20h"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">Endereço / Unidade</label>
                <Input
                  value={agenda.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Rua das Palmeiras, 120"
                  className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">URL Foto de Capa / Banner</label>
              <Input
                value={agenda.bannerImage || ""}
                onChange={(e) => updateField("bannerImage", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1 bg-zinc-900 border-white/10 text-xs h-9"
              />
            </div>
          </div>
        )}

        {/* ABA 2: SERVIÇOS & VALORES */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Serviços ({agenda.services.length})
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddService}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Serviço
              </Button>
            </div>

            <div className="space-y-2.5">
              {agenda.services.map((srv) => {
                const isExpanded = expandedServiceId === srv.id;
                return (
                  <div
                    key={srv.id}
                    className="border border-white/10 rounded-xl bg-zinc-900/40 overflow-hidden transition-all"
                  >
                    <div
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5"
                      onClick={() => setExpandedServiceId(isExpanded ? null : srv.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {srv.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span className="text-purple-400 font-bold">
                            R$ {Number(srv.price || 0).toFixed(2).replace(".", ",")}
                          </span>
                          <span>•</span>
                          <span>{srv.durationMinutes || 30} min</span>
                          {srv.badge && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-purple-500/30 text-purple-300">
                              {srv.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveService(srv.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-white/5 bg-zinc-950/60 space-y-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Título do Serviço</label>
                          <Input
                            value={srv.name}
                            onChange={(e) => handleUpdateService(srv.id, "name", e.target.value)}
                            className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Valor (R$)</label>
                            <Input
                              type="number"
                              value={srv.price}
                              onChange={(e) =>
                                handleUpdateService(srv.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10 font-bold text-purple-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Duração (min)</label>
                            <Input
                              type="number"
                              value={srv.durationMinutes}
                              onChange={(e) =>
                                handleUpdateService(srv.id, "durationMinutes", parseInt(e.target.value) || 30)
                              }
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-400">Badge / Destaque</label>
                            <Input
                              value={srv.badge || ""}
                              onChange={(e) => handleUpdateService(srv.id, "badge", e.target.value)}
                              placeholder="Ex: Combo ⭐"
                              className="mt-1 h-8 text-xs bg-zinc-900 border-white/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-400">Descrição do Serviço</label>
                          <Textarea
                            value={srv.description}
                            onChange={(e) => handleUpdateService(srv.id, "description", e.target.value)}
                            rows={2}
                            className="mt-1 text-xs bg-zinc-900 border-white/10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 3: PROFISSIONAIS & EQUIPE */}
        {activeTab === "pros" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Profissionais ({agenda.professionals.length})
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddPro}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Profissional
              </Button>
            </div>

            <div className="space-y-2.5">
              {agenda.professionals.map((pro) => (
                <div
                  key={pro.id}
                  className="p-3 rounded-xl border border-white/10 bg-zinc-900/40 space-y-2"
                >
                  <div className="flex items-center gap-2.5 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {pro.avatarUrl ? (
                        <img
                          src={pro.avatarUrl}
                          alt={pro.name}
                          className="w-9 h-9 rounded-full object-cover border border-purple-500/30 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-300 grid place-items-center text-xs font-bold">
                          {pro.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{pro.name}</h4>
                        <span className="text-[11px] text-zinc-400 block truncate">{pro.role}</span>
                      </div>
                    </div>
                    {agenda.professionals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePro(pro.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Remover Profissional"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Input
                      value={pro.name}
                      onChange={(e) => handleUpdatePro(pro.id, "name", e.target.value)}
                      placeholder="Nome"
                      className="h-8 text-xs bg-zinc-900 border-white/10"
                    />
                    <Input
                      value={pro.role}
                      onChange={(e) => handleUpdatePro(pro.id, "role", e.target.value)}
                      placeholder="Cargo/Especialidade"
                      className="h-8 text-xs bg-zinc-900 border-white/10"
                    />
                  </div>

                  <Input
                    value={pro.avatarUrl || ""}
                    onChange={(e) => handleUpdatePro(pro.id, "avatarUrl", e.target.value)}
                    placeholder="URL da Foto do Avatar"
                    className="h-8 text-xs bg-zinc-900 border-white/10"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: DESIGN, CORES, EFEITOS & FONTES */}
        {activeTab === "design" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Efeito Visual & Acabamento
              </label>
              <div className="space-y-2">
                {VISUAL_EFFECTS.map((eff) => {
                  const isSelected = (agenda.visualEffect || "glassmorphism") === eff.id;
                  return (
                    <div
                      key={eff.id}
                      onClick={() => updateField("visualEffect", eff.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-600/15 border-purple-500 text-white shadow-xs"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                          {eff.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0 border-white/15">
                          {eff.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        {eff.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paleta de Cores e Seletor Livre */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Palette className="h-3.5 w-3.5 text-purple-400" />
                Cor de Destaque & Botões de Ação
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      updateField("accentColor", col.name.toLowerCase().split(" ")[0] as any);
                      updateField("buttonColor", col.hex);
                    }}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/30 transition-all text-center"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[9px] text-zinc-300 truncate w-full">
                      {col.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Seletor Customizado Hexadecimal */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-white/10">
                <input
                  type="color"
                  value={agenda.buttonColor || "#8b5cf6"}
                  onChange={(e) => updateField("buttonColor", e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-400 block font-medium">Cor do Botão de Agendamento</span>
                  <Input
                    value={agenda.buttonColor || "#8b5cf6"}
                    onChange={(e) => updateField("buttonColor", e.target.value)}
                    className="h-6 text-xs bg-transparent border-0 p-0 font-mono text-zinc-200 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Família Tipográfica */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
                <Type className="h-3.5 w-3.5 text-purple-400" />
                Família Tipográfica
              </label>
              <div className="space-y-1.5">
                {FONT_OPTIONS.map((font) => {
                  const isFontSelected = (agenda.customFont || "Inter") === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => updateField("customFont", font.id)}
                      className={`w-full p-2 text-left text-xs rounded-xl border transition-all flex items-center justify-between ${
                        isFontSelected
                          ? "bg-purple-600/15 border-purple-500 text-white font-semibold"
                          : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <span>{font.name}</span>
                      {isFontSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: FERRAMENTAS & RECURSOS */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200">Recursos de Agendamento</h4>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-purple-400" />
                    Seleção de Profissional
                  </span>
                  <p className="text-[10px] text-zinc-400">Permite escolher o barbeiro/atendente específico</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.selectPro}
                  onChange={(e) => updateFeature("selectPro", e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    Seletor de Datas e Horários
                  </span>
                  <p className="text-[10px] text-zinc-400">Exibe botões de dias e horários livres</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.selectDate}
                  onChange={(e) => updateFeature("selectDate", e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-purple-400" />
                    Confirmação via WhatsApp
                  </span>
                  <p className="text-[10px] text-zinc-400">Envia resumo do agendamento direto para o seu WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.whatsappBooking}
                  onChange={(e) => updateFeature("whatsappBooking", e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-purple-400" />
                    Endereço & Localização
                  </span>
                  <p className="text-[10px] text-zinc-400">Exibe endereço físico no rodapé e cabeçalho</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentFeatures.mapLocation}
                  onChange={(e) => updateFeature("mapLocation", e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

