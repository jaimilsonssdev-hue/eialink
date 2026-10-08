import { create } from 'zustand'

export type Viewport = 'desktop' | 'tablet' | 'mobile'

interface EditorState {
  selectedBlockId: string | null
  viewport: Viewport
  jsonDrawerOpen: boolean
  historyOpen: boolean
  shortcutsModalOpen: boolean
  previewMode: boolean
  activeProjectId: string | null
  // EiaLink Page link
  eialinkPageId: string | null
  eialinkPageSlug: string | null
  eialinkPageTitle: string | null
  // Generation state
  isGenerating: boolean
  generationPrompt: string | null
  generationError: string | null
  selectBlock: (id: string | null) => void
  setViewport: (vp: Viewport) => void
  toggleJsonDrawer: () => void
  toggleHistory: () => void
  toggleShortcutsModal: () => void
  togglePreview: () => void
  setActiveProject: (id: string | null) => void
  setEialinkPage: (info: { id: string; slug: string; title: string } | null) => void
  setGenerating: (prompt: string | null) => void
  setGenerationError: (err: string | null) => void
  clearGeneration: () => void
}

export const useEditorStore = create<EditorState>()((set) => ({
  selectedBlockId: null,
  viewport: 'desktop',
  jsonDrawerOpen: false,
  historyOpen: false,
  shortcutsModalOpen: false,
  previewMode: false,
  activeProjectId: null,
  eialinkPageId: null,
  eialinkPageSlug: null,
  eialinkPageTitle: null,
  isGenerating: false,
  generationPrompt: null,
  generationError: null,
  selectBlock: (id) => set({ selectedBlockId: id }),
  setViewport: (vp) => set({ viewport: vp }),
  toggleJsonDrawer: () => set((s) => ({ jsonDrawerOpen: !s.jsonDrawerOpen })),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  toggleShortcutsModal: () => set((s) => ({ shortcutsModalOpen: !s.shortcutsModalOpen })),
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode, ...(!s.previewMode ? { selectedBlockId: null } : {}) })),
  setActiveProject: (id) => set({ activeProjectId: id }),
  setEialinkPage: (info) =>
    set({
      eialinkPageId: info?.id ?? null,
      eialinkPageSlug: info?.slug ?? null,
      eialinkPageTitle: info?.title ?? null,
    }),
  setGenerating: (prompt) => set({ isGenerating: !!prompt, generationPrompt: prompt, generationError: null }),
  setGenerationError: (err) => set({ generationError: err }),
  clearGeneration: () => set({ isGenerating: false, generationPrompt: null }),
}))
