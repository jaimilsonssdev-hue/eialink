import { useEffect, useRef, useState } from 'react'
import { useNavigate } from "@/modules/studiopro/lib/router"
import { toast } from 'sonner'
import {
  FolderOpen, Layers, Briefcase, UtensilsCrossed, Building2, BookOpen,
  Plus, Sliders, Palette, Bot, X, Sparkles, ChevronUp, Trash2, ArrowUp, ArrowDown
} from 'lucide-react'
import { CanvasToolbar } from './CanvasToolbar'
import { LeftSidebar, ComponentsPanel } from './LeftSidebar'
import { Canvas } from './Canvas'
import { RightSidebar } from './RightSidebar'
import { LayersPanel } from './LayersPanel'
import { DesignPanel } from './DesignPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { AgentPanel } from './AgentPanel'
import { JsonDrawer } from './JsonDrawer'
import { VersionHistory } from './VersionHistory'
import { GenerationOverlay } from './GenerationOverlay'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { useProjectsStore } from "@/modules/studiopro/store/projectsStore"
import { generateSiteConfig } from "@/modules/studiopro/lib/generate-site"
import { templateMeta, buildTemplate } from "@/modules/studiopro/lib/templates"
import { hexToRgb } from "@/modules/studiopro/lib/theme-presets"

const templateIcons: Record<string, typeof Briefcase> = {
  Briefcase, UtensilsCrossed, Building2, BookOpen,
}

function useAutoSaveToProject() {
  const config = useConfigStore((s) => s.config)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const updateProjectConfig = useProjectsStore((s) => s.updateProjectConfig)
  const loadedConfigRef = useRef<string | null>(null)

  // Snapshot the config at load time so we can diff
  useEffect(() => {
    loadedConfigRef.current = JSON.stringify(config)
  }, [activeProjectId])

  useEffect(() => {
    if (!activeProjectId) return
    const serialized = JSON.stringify(config)
    // Only save when config actually differs from what was loaded
    if (serialized === loadedConfigRef.current) return
    updateProjectConfig(activeProjectId, config)
  }, [config, activeProjectId, updateProjectConfig])
}

function useGenerationOrchestration() {
  const isGenerating = useEditorStore((s) => s.isGenerating)
  const generationPrompt = useEditorStore((s) => s.generationPrompt)
  const clearGeneration = useEditorStore((s) => s.clearGeneration)
  const setGenerationError = useEditorStore((s) => s.setGenerationError)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const setConfig = useConfigStore((s) => s.setConfig)
  const updateProjectConfig = useProjectsStore((s) => s.updateProjectConfig)
  const renameProject = useProjectsStore((s) => s.renameProject)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isGenerating || !generationPrompt) return

    const controller = new AbortController()
    abortRef.current = controller

    // Timeout after 30s to prevent infinite loading
    const timeout = setTimeout(() => {
      controller.abort()
      setGenerationError('Tempo limite esgotado')
      toast.error('A geração excedeu o tempo limite. Tente novamente.')
      clearGeneration()
    }, 30000)

    generateSiteConfig(generationPrompt, controller.signal)
      .then(({ config, source }) => {
        clearTimeout(timeout)
        if (controller.signal.aborted) return
        setConfig(config)
        if (activeProjectId) {
          updateProjectConfig(activeProjectId, config)
          if (config.name) renameProject(activeProjectId, config.name)
        }
        clearGeneration()
        if (source === 'template') {
          toast.info('Gerado a partir de modelo inteligente.')
        } else {
          toast.success('Site gerado com IA Gemini!')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        if (err instanceof Error && err.name === 'AbortError') return
        setGenerationError(err instanceof Error ? err.message : 'Falha na geração')
        toast.error(err instanceof Error ? err.message : 'Falha na geração')
        clearGeneration()
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
      abortRef.current = null
    }
  }, [isGenerating, generationPrompt])
}

function EditorEmptyState() {
  const navigate = useNavigate()
  const addProject = useProjectsStore((s) => s.addProject)
  const setConfig = useConfigStore((s) => s.setConfig)
  const setActiveProject = useEditorStore((s) => s.setActiveProject)

  function startFromTemplate(tplId: string, tplName: string) {
    const id = addProject(tplName)
    setActiveProject(id)
    setConfig(buildTemplate(tplId, tplName))
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-bg-2 border border-border-default flex items-center justify-center mb-4 text-green shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <FolderOpen size={24} />
        </div>
        <h2 className="text-xl font-display font-bold text-text-0 mb-1.5">Nenhum projeto em edição</h2>
        <p className="text-text-2 text-xs mb-6 max-w-xs leading-relaxed">
          Abra um projeto a partir do Início, ou comece com um modelo pronto abaixo.
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-green text-black text-xs font-semibold hover:bg-green-dim active:scale-[0.98] transition-all mb-8 shadow-md"
        >
          Voltar ao Início
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
          {templateMeta.map((tpl) => {
            const rgb = hexToRgb(tpl.accent)
            const Icon = templateIcons[tpl.icon] || Layers
            return (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl.id, tpl.name)}
                className="group relative bg-bg-1 border border-border-default/70 rounded-xl p-3.5 transition-all hover:border-green/40 hover:bg-bg-2/50 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${rgb}, 0.15)`, color: tpl.accent }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="text-xs font-semibold text-text-0 group-hover:text-green transition-colors">
                    {tpl.name}
                  </div>
                </div>
                <div className="text-[11px] text-text-2 leading-snug mb-2 line-clamp-2">
                  {tpl.description}
                </div>
                <div className="text-[10px] text-text-3 flex items-center gap-1 font-mono">
                  <Layers size={10} />
                  {tpl.blockCount} blocos
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type MobileDrawerTab = 'components' | 'layers' | 'design' | 'properties' | 'agent' | null

export function EditorLayout() {
  useAutoSaveToProject()
  useGenerationOrchestration()

  const previewMode = useEditorStore((s) => s.previewMode)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const eialinkPageId = useEditorStore((s) => s.eialinkPageId)
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)

  const [mobileDrawer, setMobileDrawer] = useState<MobileDrawerTab>(null)

  const blocks = useConfigStore((s) => {
    const pages = s.config.pages
    if (!pages || pages.length === 0) return s.config.blocks
    const page = pages.find((p) => p.id === s.activePageId) ?? pages[0]
    return page.blocks
  })
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)

  // Auto-open properties on mobile when a block is selected if desired
  useEffect(() => {
    if (selectedBlock && mobileDrawer === 'components') {
      setMobileDrawer('properties')
    }
  }, [selectedBlockId])

  // Check if either a project or an eialinkPage is loaded
  if (!activeProjectId && !eialinkPageId) {
    return <EditorEmptyState />
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Sidebar */}
        {!previewMode && <LeftSidebar />}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <CanvasToolbar />
          <div className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
            <Canvas />
            <JsonDrawer />
            <GenerationOverlay />

            {/* Mobile Block Quick Action Floating Bar */}
            {selectedBlock && !previewMode && (
              <div className="md:hidden fixed bottom-20 left-4 right-4 z-30 animate-fade-in-up">
                <div className="bg-bg-1/95 backdrop-blur-md border border-border-default/80 rounded-2xl p-2 px-3 shadow-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-text-0 truncate">
                      {selectedBlock.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setMobileDrawer('properties')}
                      className="px-2.5 py-1 rounded-lg bg-green text-black text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Sliders size={12} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => selectBlock(null)}
                      className="w-7 h-7 rounded-lg bg-bg-2 border border-border-default flex items-center justify-center text-text-3 hover:text-text-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Sidebar */}
        {!previewMode && <RightSidebar />}
      </div>

      {/* Version History Drawer */}
      <VersionHistory />

      {/* MOBILE BOTTOM NAVIGATION BAR (Lovable Style) */}
      {!previewMode && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-1/95 backdrop-blur-xl border-t border-border-default/80 flex items-center justify-around px-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
          aria-label="Navegação do editor mobile"
        >
          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'components' ? null : 'components')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileDrawer === 'components' ? 'text-green scale-105' : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Plus size={18} className={mobileDrawer === 'components' ? 'text-green' : ''} />
            <span className="text-[10px] font-medium mt-0.5">Blocos</span>
          </button>

          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'layers' ? null : 'layers')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileDrawer === 'layers' ? 'text-green scale-105' : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Layers size={18} className={mobileDrawer === 'layers' ? 'text-green' : ''} />
            <span className="text-[10px] font-medium mt-0.5">Camadas</span>
          </button>

          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'design' ? null : 'design')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileDrawer === 'design' ? 'text-green scale-105' : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Palette size={18} className={mobileDrawer === 'design' ? 'text-green' : ''} />
            <span className="text-[10px] font-medium mt-0.5">Design</span>
          </button>

          <button
            onClick={() => {
              if (selectedBlock) {
                setMobileDrawer(mobileDrawer === 'properties' ? null : 'properties')
              } else {
                toast.info('Toque em um bloco no site para editá-lo.')
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all ${
              mobileDrawer === 'properties' ? 'text-green scale-105' : selectedBlock ? 'text-text-0' : 'text-text-3'
            }`}
          >
            {selectedBlock && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-green animate-pulse" />
            )}
            <Sliders size={18} className={mobileDrawer === 'properties' ? 'text-green' : ''} />
            <span className="text-[10px] font-medium mt-0.5">Editar</span>
          </button>

          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'agent' ? null : 'agent')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileDrawer === 'agent' ? 'text-green scale-105' : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Sparkles size={18} className={mobileDrawer === 'agent' ? 'text-green' : ''} />
            <span className="text-[10px] font-medium mt-0.5">IA Chat</span>
          </button>
        </nav>
      )}

      {/* MOBILE BOTTOM SHEET DRAWER (Lovable Style) */}
      {mobileDrawer && !previewMode && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawer(null)}
          />

          {/* Drawer Container */}
          <div className="relative bg-bg-1 border-t border-border-default rounded-t-[1.75rem] shadow-2xl max-h-[82vh] flex flex-col z-10 animate-fade-in-up">
            {/* Drag Handle & Header */}
            <div className="p-3 pb-2 flex flex-col items-center shrink-0 border-b border-border-default/60">
              <div className="w-10 h-1 rounded-full bg-border-default mb-2" />
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-sm font-semibold text-text-0">
                  {mobileDrawer === 'components' && 'Adicionar Blocos'}
                  {mobileDrawer === 'layers' && 'Camadas & Ordem dos Blocos'}
                  {mobileDrawer === 'design' && 'Aparência, Cores & Tipografia'}
                  {mobileDrawer === 'properties' && (selectedBlock ? `Editar: ${selectedBlock.type}` : 'Editar Bloco')}
                  {mobileDrawer === 'agent' && 'Assistente com IA (Gemini)'}
                </span>
                <button
                  onClick={() => setMobileDrawer(null)}
                  className="w-7 h-7 rounded-full bg-bg-2 border border-border-default flex items-center justify-center text-text-2 hover:text-text-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {mobileDrawer === 'components' && (
                <ComponentsPanel onBlockAdded={() => setMobileDrawer(null)} />
              )}
              {mobileDrawer === 'layers' && <LayersPanel />}
              {mobileDrawer === 'design' && <DesignPanel />}
              {mobileDrawer === 'properties' && (
                selectedBlock ? (
                  <div className="p-2">
                    <PropertiesPanel block={selectedBlock} />
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-text-2">
                    Nenhum bloco selecionado. Toque em uma seção do site para editar.
                  </div>
                )
              )}
              {mobileDrawer === 'agent' && <AgentPanel />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
