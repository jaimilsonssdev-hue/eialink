import React, { useState } from "react";
import { useNavigate } from "@/modules/studiopro/lib/router";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Wand2,
  Trash2,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { useCreativeStudioStore } from "@/modules/studiopro/store/creativeStudioStore";
import { toast } from "sonner";

export function CreativeDashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [mode, setModeState] = useState<"plan" | "build">("plan");
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const {
    projects,
    createProject,
    selectProject,
    deleteProject,
    setMode,
    addChatMessage,
  } = useCreativeStudioStore();

  function handleStart(customPrompt?: string) {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    const projectName = textToUse.split(/\s+/).slice(0, 4).join(" ");
    const id = createProject(projectName);
    selectProject(id);
    setMode(mode);

    // Envia o prompt inicial para o chat
    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: textToUse,
      timestamp: Date.now(),
    });

    navigate("/editor");
  }

  const modeLabels = {
    plan: "Planejar",
    build: "Construir",
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-between p-4 md:p-8 bg-[#09090d] text-zinc-100 relative overflow-hidden">
      {/* Luz ambiente com gradiente suave */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center pt-12 md:pt-16 z-10">
        {/* Badge do topo */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-300 mb-6 backdrop-blur-md shadow-sm">
          <Sparkles size={13} className="text-emerald-400" />
          <span>Estúdio Criativo • Nova Geração IA</span>
        </div>

        {/* Título Principal estilo Lovable */}
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-center text-white mb-8">
          Tem uma ideia para um site?
        </h1>

        {/* Input Card Principal */}
        <div className="w-full rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl p-2.5 backdrop-blur-xl focus-within:border-emerald-500/50 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="Descreva a empresa ou ideia (ex: 'Uma clínica médica de alto padrão com agendamento online e equipe de cirurgiões')..."
            rows={3}
            className="w-full bg-transparent p-3 text-[14px] text-zinc-100 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 px-2 border-t border-white/[0.06]">
            {/* Seletor de Modo no Input */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                <span>{modeLabels[mode]}</span>
                <ChevronDown size={13} />
              </button>

              {showModeDropdown && (
                <div className="absolute left-0 bottom-10 z-50 w-48 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl p-1 text-left">
                  <button
                    onClick={() => {
                      setModeState("plan");
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex flex-col p-2 rounded-lg text-left transition-colors ${
                      mode === "plan" ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span className="text-xs font-semibold">Planejar</span>
                    <span className="text-[10px] text-zinc-400">Monta o conceito para aprovação</span>
                  </button>
                  <button
                    onClick={() => {
                      setModeState("build");
                      setShowModeDropdown(false);
                    }}
                    className={`w-full flex flex-col p-2 rounded-lg text-left transition-colors ${
                      mode === "build" ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span className="text-xs font-semibold">Construir</span>
                    <span className="text-[10px] text-zinc-400">Gera o site diretamente</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleStart()}
              disabled={!prompt.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            >
              <span>Continuar</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Sugestões Rápidas */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {[
            "Clínica de Estética e Saúde",
            "Restaurante e Gastronomia Artesanal",
            "Escritório de Advocacia Premium",
            "Software & Startup Tech",
          ].map((sug) => (
            <button
              key={sug}
              onClick={() => handleStart(sug)}
              className="px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Projetos Recentes */}
      {projects.length > 0 && (
        <div className="w-full max-w-4xl mx-auto pt-12 pb-6 z-10">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Layers size={14} className="text-emerald-400" />
            <span>Seus Sites no Estúdio Criativo</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  selectProject(proj.id);
                  navigate("/editor");
                }}
                className="group p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-emerald-500/40 hover:bg-zinc-900 transition-all cursor-pointer relative shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200 truncate">
                    {proj.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(proj.id);
                      toast.success("Site removido");
                    }}
                    className="p-1 rounded-md text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                  {proj.briefing || "Pronto para continuar no editor..."}
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{new Date(proj.updatedAt).toLocaleDateString("pt-BR")}</span>
                  <span className="text-emerald-400 font-medium group-hover:underline flex items-center gap-1">
                    Abrir <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

