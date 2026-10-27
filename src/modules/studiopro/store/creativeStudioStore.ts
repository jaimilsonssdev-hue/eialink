import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { ChatMessage } from "@/modules/studiopro/lib/creativeEngineService";

const safeLocalStorage: StateStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("[creativeStudioStore] Erro ao ler localStorage:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn("[creativeStudioStore] QuotaExceeded ao salvar no localStorage, aplicando expurgo seguro:", e);
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state?.projects && Array.isArray(parsed.state.projects)) {
          const activeId = parsed.state.activeProjectId;
          parsed.state.projects = parsed.state.projects
            .filter((p: any) => p.id === activeId)
            .slice(0, 1)
            .map((p: any) => ({
              ...p,
              messages: (p.messages || []).slice(-5).map((m: any) => ({
                ...m,
                attachments: undefined,
              })),
            }));
          window.localStorage.setItem(key, JSON.stringify(parsed));
          return;
        }
      } catch (innerErr) {
        try {
          window.localStorage.removeItem(key);
        } catch (_) {}
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn("[creativeStudioStore] Erro ao remover do localStorage:", e);
    }
  },
};

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
  setProjects: (projects: CreativeProject[]) => void;
  createProject: (name: string, eialinkPageId?: string, slug?: string) => string;
  selectProject: (id: string | null) => void;
  updateActiveProjectHtml: (html: string) => void;
  updateActiveProjectBriefing: (briefing: string) => void;
  updateActiveProjectMeta: (meta: { eialinkPageId?: string; slug?: string; name?: string }) => void;
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
      setProjects: (projects) => {
        set((state) => {
          // Merge mantendo projetos existentes e priorizando os remotos atualizados
          const map = new Map<string, CreativeProject>();
          projects.forEach((p) => map.set(p.id, p));
          state.projects.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );
          return {
            projects: merged,
            activeProjectId: state.activeProjectId || (merged[0]?.id ?? null),
          };
        });
      },

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

      updateActiveProjectHtml: (html) => {
        set((state) => {
          const updated = state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, html, updatedAt: Date.now() }
              : p,
          );
          const active = updated.find((p) => p.id === state.activeProjectId);
          if (active && active.html && active.html.trim().length > 50) {
            import("@/modules/studio/studio.functions").then(({ syncCreativeStudioProjectFn }) => {
              syncCreativeStudioProjectFn({ data: { project: active } }).catch(() => {});
            });
          }
          return { projects: updated };
        });
      },

      updateActiveProjectBriefing: (briefing) => {
        set((state) => {
          const updated = state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, briefing, updatedAt: Date.now() }
              : p,
          );
          const active = updated.find((p) => p.id === state.activeProjectId);
          if (active && active.html && active.html.trim().length > 50) {
            import("@/modules/studio/studio.functions").then(({ syncCreativeStudioProjectFn }) => {
              syncCreativeStudioProjectFn({ data: { project: active } }).catch(() => {});
            });
          }
          return { projects: updated };
        });
      },

      updateActiveProjectMeta: (meta) => {
        set((state) => {
          const updated = state.projects.map((p) =>
            p.id === state.activeProjectId
              ? {
                  ...p,
                  eialinkPageId: meta.eialinkPageId || p.eialinkPageId,
                  slug: meta.slug || p.slug,
                  name: meta.name || p.name,
                  updatedAt: Date.now(),
                }
              : p,
          );
          return { projects: updated };
        });
      },

      addChatMessage: (msg) => {
        set((state) => {
          const updated = state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, messages: [...p.messages, msg], updatedAt: Date.now() }
              : p,
          );
          const active = updated.find((p) => p.id === state.activeProjectId);
          if (active && active.html && active.html.trim().length > 50) {
            import("@/modules/studio/studio.functions").then(({ syncCreativeStudioProjectFn }) => {
              syncCreativeStudioProjectFn({ data: { project: active } }).catch(() => {});
            });
          }
          return { projects: updated };
        });
      },

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
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        // Salva apenas os 3 projetos mais recentes para economizar cota no mobile/desktop
        projects: (state.projects || []).slice(0, 3).map((proj) => ({
          ...proj,
          // Mantém apenas as últimas 15 mensagens e NUNCA salva base64 no localStorage
          messages: (proj.messages || []).slice(-15).map((m) => ({
            ...m,
            attachments: m.attachments?.map((att) => ({
              name: att.name,
              mimeType: att.mimeType,
              dataBase64: "",
            })),
          })),
        })),
        activeProjectId: state.activeProjectId,
        mode: state.mode,
        previewDevice: state.previewDevice,
      }),
    },
  ),
);

