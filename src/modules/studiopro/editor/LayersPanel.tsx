import { useState } from 'react'
import { toast } from 'sonner'
import {
  Layout, Type, Grid3X3, DollarSign, Megaphone, PanelBottom,
  MessageSquare, BarChart3, HelpCircle, Users, Mail, Newspaper, Image,
  Copy, Trash2, GripVertical, Plus, Search, Minus, Flag,
  FileText, ImageIcon, Play, GalleryHorizontalEnd,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { blockMetadata } from "@/modules/studiopro/lib/block-metadata"
import type { BlockType, BlockConfig } from "@/modules/studiopro/blocks/types"

const blockIcons: Record<BlockType, typeof Layout> = {
  navbar: Layout, hero: Type, features: Grid3X3, pricing: DollarSign,
  cta: Megaphone, footer: PanelBottom, testimonials: MessageSquare,
  stats: BarChart3, faq: HelpCircle, team: Users, contact: Mail,
  newsletter: Newspaper, logocloud: Image, divider: Minus, banner: Flag,
  content: FileText, image: ImageIcon, video: Play, gallery: GalleryHorizontalEnd,
}

const blockLabels: Record<BlockType, string> = {
  navbar: 'Topo & Menu',
  hero: 'Destaque Principal',
  features: 'Serviços & Recursos',
  pricing: 'Planos & Preços',
  cta: 'Chamada para Ação',
  footer: 'Rodapé',
  testimonials: 'Depoimentos',
  stats: 'Estatísticas & Métricas',
  faq: 'Perguntas Frequentes',
  team: 'Nossa Equipe',
  contact: 'Contato & Localização',
  newsletter: 'Inscrição Newsletter',
  logocloud: 'Logos & Clientes',
  divider: 'Divisor de Seção',
  banner: 'Faixa Informativa',
  content: 'Texto & Artigo',
  image: 'Imagem em Destaque',
  video: 'Vídeo Apresentação',
  gallery: 'Galeria de Fotos',
}

function SortableLayer({ block, isSelected, onSelect, onDuplicate, onRemove }: {
  block: BlockConfig
  isSelected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const Icon = blockIcons[block.type] || Layout

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group px-2.5 py-2 rounded-lg text-[13px] flex items-center gap-2.5 transition-all cursor-pointer select-none relative ${
        isSelected ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white border border-transparent'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 cursor-grab active:cursor-grabbing"
        aria-label={`Arrastar para reordenar ${blockLabels[block.type]}`}
      >
        <GripVertical size={13} />
      </div>

      <div className={`w-[28px] h-[28px] rounded-md flex items-center justify-center text-[11px] shrink-0 border ${
        isSelected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-neutral-800 bg-neutral-900 text-neutral-400'
      }`}>
        <Icon size={14} />
      </div>

      <span className="font-medium flex-1 truncate">{blockLabels[block.type]}</span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="w-[24px] h-[24px] rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
          title={`Duplicar ${blockLabels[block.type]}`}
        >
          <Copy size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="w-[24px] h-[24px] rounded flex items-center justify-center text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          title={`Remover ${blockLabels[block.type]}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function AddComponentPopover({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = blockMetadata.filter((b) =>
    b.label.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, typeof blockMetadata>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {})

  return (
    <div className="absolute bottom-[52px] left-2 right-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 shadow-[0_12px_32px_rgba(0,0,0,0.6)] z-20 max-h-[300px] overflow-y-auto custom-scrollbar">
      <input
        autoFocus
        type="text"
        placeholder="Buscar componente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-100 text-[12px] outline-none focus:border-emerald-500 mb-2 placeholder:text-neutral-500"
      />
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1.5 py-1">
            {category}
          </div>
          {items.map((meta) => {
            const Icon = blockIcons[meta.type] || Layout
            return (
              <button
                key={meta.type}
                onClick={() => { onAdd(meta.type); onClose() }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-left"
              >
                <div className="w-[24px] h-[24px] rounded border border-neutral-750 bg-neutral-950 flex items-center justify-center text-[10px] shrink-0 text-neutral-400">
                  <Icon size={12} />
                </div>
                <span className="font-medium truncate">{meta.label}</span>
                <span className="ml-auto text-[10px] text-neutral-500 font-mono">{meta.variants.length} var</span>
              </button>
            )
          })}
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="px-2 py-4 text-center text-[12px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Search size={13} />
          Nenhum componente encontrado para "{search}"
        </div>
      )}
    </div>
  )
}

export function LayersPanel() {
  const blocks = useConfigStore((s) => {
    const pages = s.config.pages
    if (!pages || pages.length === 0) return s.config.blocks
    const page = pages.find((p) => p.id === s.activePageId) ?? pages[0]
    return page.blocks
  })
  const { duplicateBlock, removeBlock, moveBlock, addBlock } = useConfigStore()
  const { selectedBlockId, selectBlock } = useEditorStore()
  const [showPopover, setShowPopover] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      moveBlock(oldIndex, newIndex)
    }
  }

  function handleAddBlock(type: BlockType) {
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
    toast.success(`${meta.label} adicionado à página`)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Camadas da Página
        </span>
        <span className="text-[10px] font-medium bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">{blocks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <SortableLayer
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={() => selectBlock(block.id)}
                onDuplicate={() => { duplicateBlock(block.id); toast.success('Bloco duplicado com sucesso') }}
                onRemove={() => {
                  if (selectedBlockId === block.id) selectBlock(null)
                  removeBlock(block.id)
                  toast('Bloco removido', {
                    action: {
                      label: 'Desfazer',
                      onClick: () => {
                        useConfigStore.getState().undo()
                        toast.success('Bloco restaurado')
                      },
                    },
                    duration: 3000,
                  })
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add component */}
      <div className="p-2 border-t border-neutral-800/80 relative">
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="w-full py-2.5 rounded-xl border border-dashed border-neutral-700 text-neutral-400 text-xs font-medium flex items-center justify-center gap-2 transition-all hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 active:scale-[0.98]"
        >
          <Plus size={14} />
          Adicionar Componente
        </button>
        {showPopover && (
          <AddComponentPopover onAdd={handleAddBlock} onClose={() => setShowPopover(false)} />
        )}
      </div>
    </div>
  )
}
