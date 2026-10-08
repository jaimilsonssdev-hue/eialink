import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/modules/studiopro/lib/creativeEngineService";

export interface CreativeProject {
  id: string;
  name: string;
  html: string;
  briefing?: string;
  eialinkPageId?: string;
  slug?: string;
  createdAt: number;
  updatedAt: number;
  status: "draft" | "published";
  messages: ChatMessage[];
}

interface CreativeEngineState {
  projects: CreativeProject[];
  activeProjectId: string | null;
  mode: "build" | "chat" | "plan";
  isGenerating: boolean;
  statusMessage: string;
  previewDevice: "desktop" | "tablet" | "mobile";
  
  // Ações
  setMode: (mode: "build" | "chat" | "plan") => void;
  setPreviewDevice: (device: "desktop" | "tablet" | "mobile") => void;
  setIsGenerating: (isGenerating: boolean, statusMessage?: string) => void;
  createProject: (name: string, eialinkPageId?: string, slug?: string) => string;
  selectProject: (id: string | null) => void;
  updateActiveProjectHtml: (html: string) => void;
  updateActiveProjectBriefing: (briefing: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  deleteProject: (id: string) => void;
  getActiveProject: () => CreativeProject | null;
}

export const useCreativeStudioStore = create<CreativeEngineState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      mode: "plan",
      isGenerating: false,
      statusMessage: "",
      previewDevice: "desktop",

      setMode: (mode) => set({ mode }),
      setPreviewDevice: (previewDevice) => set({ previewDevice }),
      setIsGenerating: (isGenerating, statusMessage = "") =>
        set({ isGenerating, statusMessage }),

      createProject: (name, eialinkPageId, slug) => {
        const id = `project-${Date.now()}`;
        const newProj: CreativeProject = {
          id,
          name: name || "Novo Site Criativo",
          html: "",
          eialinkPageId,
          slug,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "draft",
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content:
                "Olá! Sou seu arquiteto de criação no Estúdio Criativo. Descreva a empresa ou envie um lead e eu vou planejar a estrutura ideal de alta conversão para você aprovar.",
              timestamp: Date.now(),
            },
          ],
        };

        set((state) => ({
          projects: [newProj, ...state.projects],
          activeProjectId: id,
        }));
        return id;
      },

      selectProject: (id) => set({ activeProjectId: id }),

      updateActiveProjectHtml: (html) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, html, updatedAt: Date.now() }
              : p,
          ),
        })),

      updateActiveProjectBriefing: (briefing) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, briefing, updatedAt: Date.now() }
              : p,
          ),
        })),

      addChatMessage: (msg) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, messages: [...p.messages, msg], updatedAt: Date.now() }
              : p,
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        })),

      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId) || null;
      },
    }),
    {
      name: "eialink_estudio_criativo_storage",
    },
  ),
);

