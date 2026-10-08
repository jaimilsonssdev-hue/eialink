import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search, Layout, Type, Grid3X3, DollarSign, Megaphone, PanelBottom,
  MessageSquare, BarChart3, HelpCircle, Users, Mail, Newspaper, Image,
  Plus, Minus, Flag, FileText, ImageIcon, Play, GalleryHorizontalEnd,
  Sparkles, Layers
} from 'lucide-react'
import { LayersPanel } from './LayersPanel'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { blockMetadata, categories } from "@/modules/studiopro/lib/block-metadata"
import type { BlockType, BlockConfig } from "@/modules/studiopro/blocks/types"

const blockIcons: Record<BlockType, typeof Layout> = {
  navbar: Layout, hero: Type, features: Grid3X3, pricing: DollarSign,
  cta: Megaphone, footer: PanelBottom, testimonials: MessageSquare,
  stats: BarChart3, faq: HelpCircle, team: Users, contact: Mail,
  newsletter: Newspaper, logocloud: Image, divider: Minus, banner: Flag,
  content: FileText, image: ImageIcon, video: Play, gallery: GalleryHorizontalEnd,
}

export function ComponentsPanel({ onBlockAdded }: { onBlockAdded?: () => void }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const addBlock = useConfigStore((s) => s.addBlock)
  const selectBlock = useEditorStore((s) => s.selectBlock)

  const filtered = useMemo(() => {
    return blockMetadata.filter((b) => {
      const matchesSearch =
        b.label.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === 'Todos' || b.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory])

  function handleAdd(type: BlockType) {
    const meta = blockMetadata.find((b) => b.type === type)
    if (!meta) return
    const block: BlockConfig = {
      id: `block-${Date.now()}`,
      type,
      variant: meta.variants[0],
      props: { ...meta.defaultProps },
    }
    addBlock(block)
    selectBlock(block.id)
    toast.success(`Bloco adicionado: ${meta.label}`)
    if (onBlockAdded) onBlockAdded()
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Search Header */}
      <div className="p-3 pb-2 space-y-2.5 shrink-0 border-b border-border-default/50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            placeholder="Pesquisar componentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border-default bg-bg-2/80 text-text-0 text-xs outline-none focus:border-green/80 focus:ring-1 focus:ring-green/30 placeholder:text-text-3 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green/15 text-green border border-green/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                  : 'text-text-2 bg-bg-2/50 border border-border-default/40 hover:text-text-0 hover:bg-bg-3'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5">
          {filtered.map((meta) => {
            const Icon = blockIcons[meta.type] || Layout
            return (
              <button
                key={meta.type}
                onClick={() => handleAdd(meta.type)}
                className="group w-full relative flex items-start gap-3 p-3 rounded-xl border border-border-default/70 bg-bg-2/40 hover:bg-bg-2 hover:border-green/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all text-left active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg border border-border-default bg-bg-3 flex items-center justify-center text-text-2 group-hover:text-green group-hover:border-green/30 group-hover:bg-green/10 transition-colors shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-text-0 group-hover:text-green transition-colors">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-2 leading-snug line-clamp-2">
                    {meta.description}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-md bg-bg-3/80 border border-border-default/60 flex items-center justify-center text-text-3 group-hover:text-green group-hover:border-green/40 group-hover:bg-green/10 transition-all shrink-0">
                  <Plus size={13} />
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-text-3">
            Nenhum componente encontrado para "{search}"
          </div>
        )}
      </div>
    </div>
  )
}

type Tab = 'layers' | 'components'

export function LeftSidebar() {
  const [tab, setTab] = useState<Tab>('components')

  return (
    <aside className="hidden md:flex w-[310px] bg-bg-1 border-r border-border-default flex-col shrink-0 overflow-hidden">
      {/* Segmented Control Tabs */}
      <div className="p-2.5 border-b border-border-default/60 shrink-0">
        <div className="flex bg-bg-2 p-1 rounded-xl border border-border-default/40">
          <button
            onClick={() => setTab('components')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'components'
                ? 'bg-bg-3 text-text-0 shadow-sm border border-border-default/60'
                : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Sparkles size={13} className={tab === 'components' ? 'text-green' : ''} />
            <span>Blocos</span>
          </button>
          <button
            onClick={() => setTab('layers')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'layers'
                ? 'bg-bg-3 text-text-0 shadow-sm border border-border-default/60'
                : 'text-text-2 hover:text-text-0'
            }`}
          >
            <Layers size={13} className={tab === 'layers' ? 'text-green' : ''} />
            <span>Camadas</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'layers' ? <LayersPanel /> : <ComponentsPanel />}
      </div>
    </aside>
  )
}
