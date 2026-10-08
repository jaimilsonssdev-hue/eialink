import { useMemo, useState, useEffect } from 'react'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { CanvasEmpty } from './CanvasEmpty'
import { BlockWrapper } from "@/modules/studiopro/blocks/BlockWrapper"
import { RenderBlock } from "@/modules/studiopro/blocks/registry"
import { resolveTheme, themeToCSS } from "@/modules/studiopro/lib/theme-presets"
import { useGoogleFonts } from "@/modules/studiopro/lib/useGoogleFonts"

export function Canvas() {
  const blocks = useConfigStore((s) => {
    const pages = s.config.pages
    if (!pages || pages.length === 0) return s.config.blocks
    const page = pages.find((p) => p.id === s.activePageId) ?? pages[0]
    return page.blocks
  })
  const theme = useConfigStore((s) => s.config.theme)
  const { selectedBlockId, selectBlock, viewport } = useEditorStore()

  const [isMobileScreen, setIsMobileScreen] = useState(false)
  useEffect(() => {
    function checkWidth() {
      setIsMobileScreen(window.innerWidth < 768)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const resolved = useMemo(() => resolveTheme(theme), [theme])
  const cssVars = useMemo(() => themeToCSS(resolved), [resolved])
  useGoogleFonts([resolved.fontSans, resolved.fontDisplay, resolved.fontMono])

  const targetMaxWidth = viewport === 'desktop' ? '920px' : viewport === 'tablet' ? '768px' : '390px'
  const maxWidth = isMobileScreen ? '100%' : targetMaxWidth

  if (blocks.length === 0) {
    return <CanvasEmpty />
  }

  const canvasContent = (
    <div
      className="@container rounded-2xl min-h-[400px] relative z-[1] overflow-hidden transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-border-default/70"
      style={{
        width: '100%',
        maxWidth,
        ...cssVars,
        color: 'var(--color-text-0)',
        backgroundColor: resolved.bg0 || 'var(--color-bg-1)',
      } as React.CSSProperties}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectBlock(null)
      }}
      role="region"
      aria-label={`Visualização do site, ${blocks.length} blocos`}
    >
      {blocks.map((block) => (
        <BlockWrapper
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          onSelect={() => selectBlock(block.id)}
        >
          <RenderBlock block={block} />
        </BlockWrapper>
      ))}
    </div>
  )

  return (
    <div className="flex-1 flex items-start justify-center p-2.5 sm:p-5 md:p-8 pb-24 md:pb-8 overflow-auto relative">
      {/* Subtle modern dot grid background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-bg-4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {viewport === 'tablet' && !isMobileScreen ? (
        <div className="relative z-[1]">
          {/* Tablet frame */}
          <div className="border-[12px] border-bg-3 rounded-3xl bg-bg-3 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            <div className="rounded-xl overflow-hidden">
              {canvasContent}
            </div>
          </div>
        </div>
      ) : viewport === 'mobile' && !isMobileScreen ? (
        <div className="relative z-[1]">
          {/* Phone frame */}
          <div className="border-[10px] border-bg-3 rounded-[2.5rem] bg-bg-3 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            {/* Notch */}
            <div className="flex justify-center -mt-[4px] mb-1">
              <div className="w-24 h-4 bg-bg-3 rounded-b-xl" />
            </div>
            <div className="rounded-2xl overflow-hidden">
              {canvasContent}
            </div>
            {/* Home indicator */}
            <div className="flex justify-center mt-2 pb-1">
              <div className="w-24 h-1 bg-bg-5 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        canvasContent
      )}
    </div>
  )
}

export default Canvas
