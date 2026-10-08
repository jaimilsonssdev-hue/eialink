import { useState, useEffect } from 'react'
import { MousePointer2, Sliders, Palette, Bot } from 'lucide-react'
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { PropertiesPanel } from './PropertiesPanel'
import { DesignPanel } from './DesignPanel'
import { AgentPanel } from './AgentPanel'

export type RightTab = 'properties' | 'design' | 'agent'

export function RightSidebar() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId)
  const blocks = useConfigStore((s) => {
    const pages = s.config.pages
    if (!pages || pages.length === 0) return s.config.blocks
    const page = pages.find((p) => p.id === s.activePageId) ?? pages[0]
    return page.blocks
  })
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)
  const [tab, setTab] = useState<RightTab>('properties')

  // Auto-switch to Properties when a block is selected
  useEffect(() => {
    if (selectedBlock) setTab('properties')
  }, [selectedBlock?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="hidden md:flex w-[320px] bg-bg-1 border-l border-border-default flex-col shrink-0 overflow-hidden">
      {/* Segmented Control Tabs */}
      <div className="p-2.5 border-b border-border-default/60 shrink-0">
        <div className="flex bg-bg-2 p-1 rounded-xl border border-border-default/40">
          <button
            onClick={() => setTab('properties')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'properties'
                ? 'bg-bg-3 text-text-0 shadow-sm border border-border-default/60'
                : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Sliders size={13} className={tab === 'properties' ? 'text-green' : ''} />
            <span>Editar</span>
          </button>
          <button
            onClick={() => setTab('design')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'design'
                ? 'bg-bg-3 text-text-0 shadow-sm border border-border-default/60'
                : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Palette size={13} className={tab === 'design' ? 'text-green' : ''} />
            <span>Design</span>
          </button>
          <button
            onClick={() => setTab('agent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'agent'
                ? 'bg-bg-3 text-text-0 shadow-sm border border-border-default/60'
                : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Bot size={13} className={tab === 'agent' ? 'text-green' : ''} />
            <span>IA</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'agent' ? (
          <AgentPanel />
        ) : tab === 'design' ? (
          <DesignPanel />
        ) : selectedBlock ? (
          <div className="flex flex-col h-full">
            <PropertiesPanel block={selectedBlock} />
            <div className="mt-auto px-4 py-2.5 font-mono text-[10px] text-text-3 break-all border-t border-border-subtle bg-bg-2/30">
              bloco: {selectedBlock.type} (#{selectedBlock.id.slice(-6)})
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-bg-2 border border-border-default flex items-center justify-center text-text-3 shadow-inner">
              <MousePointer2 size={18} className="text-green/70" />
            </div>
            <div>
              <p className="text-text-0 text-xs font-semibold">Selecione um bloco</p>
              <p className="text-text-2 text-[11px] mt-1 max-w-[200px] leading-relaxed">
                Clique em qualquer elemento do site para personalizar textos, botões e imagens.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
