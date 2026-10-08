import { Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { blockMetadata } from "@/modules/studiopro/lib/block-metadata"
import type { BlockConfig } from "@/modules/studiopro/blocks/types"

export function CanvasEmpty() {
  const addBlock = useConfigStore((s) => s.addBlock)
  const selectBlock = useEditorStore((s) => s.selectBlock)

  function handleAddBlock() {
    const heroMeta = blockMetadata.find((b) => b.type === 'hero')!
    const block: BlockConfig = {
      id: `block-${Date.now()}`,
      type: heroMeta.type,
      variant: heroMeta.variants[0],
      props: { ...heroMeta.defaultProps },
    }
    addBlock(block)
    selectBlock(block.id)
    toast.success('Bloco de Destaque adicionado!')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 relative z-[1]">
      <div className="w-12 h-12 rounded-2xl bg-bg-2 border border-border-default flex items-center justify-center text-green shadow-[0_0_20px_rgba(34,197,94,0.15)]">
        <Sparkles size={22} />
      </div>
      <h3 className="text-base font-display font-semibold text-text-0">Comece a construir seu site</h3>
      <p className="text-xs text-text-2 max-w-xs leading-relaxed">
        Adicione seu primeiro bloco da biblioteca ou explore os componentes para estruturar sua página.
      </p>
      <button
        onClick={handleAddBlock}
        className="px-4 py-2 rounded-xl bg-green text-black text-xs font-semibold hover:bg-green-dim active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md"
      >
        <Plus size={14} />
        Adicionar Destaque Principal
      </button>
    </div>
  )
}
