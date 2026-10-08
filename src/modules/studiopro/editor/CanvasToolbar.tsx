import { useState, useRef, useEffect } from 'react'
import { useNavigate } from "@/modules/studiopro/lib/router"
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Code,
  Clock,
  Eye,
  Plus,
  HelpCircle,
  Download,
  Loader2,
  CloudUpload,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEditorStore, type Viewport } from "@/modules/studiopro/store/editorStore"
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { useProjectsStore } from "@/modules/studiopro/store/projectsStore"
import type { PageConfig } from "@/modules/studiopro/blocks/types"
import { exportToHTML, downloadHTML } from "@/modules/studiopro/lib/export-html"
import { supabase } from "@/integrations/supabase/client"

const viewports: { value: Viewport; icon: typeof Monitor; label: string }[] = [
  { value: 'desktop', icon: Monitor, label: 'Computador' },
  { value: 'tablet', icon: Tablet, label: 'Tablet' },
  { value: 'mobile', icon: Smartphone, label: 'Celular' },
]

function AddPagePopover({ onAdd, onClose }: { onAdd: (name: string, path: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('/')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    const cleanPath = path.trim() || `/${trimmed.toLowerCase().replace(/\s+/g, '-')}`
    onAdd(trimmed, cleanPath)
    onClose()
  }

  return (
    <div className="absolute top-full left-0 mt-1 bg-bg-2 border border-border-default rounded-xl p-3 shadow-2xl z-30 w-60 animate-fade-in-up">
      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] text-text-2 mb-1 font-medium">Nome da página</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!path || path === '/') setPath(`/${e.target.value.toLowerCase().replace(/\s+/g, '-')}`)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
            placeholder="Ex: Sobre Nós"
            className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-3 text-text-0 text-xs outline-none focus:border-green transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] text-text-2 mb-1 font-medium">Caminho (URL)</label>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
            placeholder="/sobre"
            className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-3 text-text-0 text-xs outline-none focus:border-green font-mono transition-colors"
          />
        </div>
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg border border-border-default text-text-2 text-xs font-medium hover:bg-bg-3 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 py-1.5 rounded-lg bg-green text-black text-xs font-semibold hover:bg-green-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  )
}

function PageTab({ page, isActive, onClick, onRename, onDelete, canDelete }: {
  page: PageConfig
  isActive: boolean
  onClick: () => void
  onRename: (name: string) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(page.name)
  const [showContext, setShowContext] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commitRename() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== page.name) onRename(trimmed)
    else setName(page.name)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename()
          if (e.key === 'Escape') { setName(page.name); setEditing(false) }
        }}
        className="h-7 px-2 rounded-lg border border-green bg-bg-3 text-text-0 text-xs outline-none font-medium w-24"
      />
    )
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onContextMenu={(e) => { e.preventDefault(); setShowContext(true) }}
        className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
          isActive
            ? 'bg-bg-3 text-text-0 border border-border-default/60 shadow-sm'
            : 'text-text-2 hover:text-text-0 hover:bg-bg-2'
        }`}
        title={`${page.name} (${page.path})`}
      >
        <span>{page.name}</span>
      </button>
      {showContext && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowContext(false)} />
          <div className="absolute top-full left-0 mt-1 bg-bg-2 border border-border-default rounded-xl p-1 shadow-2xl z-20 min-w-[120px] animate-fade-in-up">
            <button
              onClick={() => { setShowContext(false); setEditing(true) }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-text-1 hover:bg-bg-3 hover:text-text-0 transition-colors"
            >
              Renomear
            </button>
            {canDelete && (
              <button
                onClick={() => { setShowContext(false); onDelete() }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-status-red hover:bg-status-red/10 transition-colors"
              >
                Excluir
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function CanvasToolbar() {
  const navigate = useNavigate()
  const { viewport, setViewport, toggleJsonDrawer, jsonDrawerOpen, toggleHistory, togglePreview, toggleShortcutsModal, previewMode, activeProjectId } = useEditorStore()
  const { undo, redo, canUndo, canRedo } = useConfigStore()
  const undoStack = useConfigStore((s) => s.undoStack)
  const redoStack = useConfigStore((s) => s.redoStack)
  const pages = useConfigStore((s) => s.config.pages) ?? []
  const activePageId = useConfigStore((s) => s.activePageId)
  const setActivePage = useConfigStore((s) => s.setActivePage)
  const addPage = useConfigStore((s) => s.addPage)
  const removePage = useConfigStore((s) => s.removePage)
  const renamePage = useConfigStore((s) => s.renamePage)
  const projects = useProjectsStore((s) => s.projects)
  const configName = useConfigStore((s) => s.config.name)
  const config = useConfigStore((s) => s.config)
  const [showAddPage, setShowAddPage] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [savingEialink, setSavingEialink] = useState(false)

  const eialinkPageId = useEditorStore((s) => s.eialinkPageId)
  const eialinkPageSlug = useEditorStore((s) => s.eialinkPageSlug)
  const eialinkPageTitle = useEditorStore((s) => s.eialinkPageTitle)

  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null
  const projectName = eialinkPageTitle || activeProject?.name || configName

  async function handleSaveEialink() {
    if (!eialinkPageId) {
      toast.info('Para salvar no EiaLink, acesse este site a partir da aba Prospecção.')
      return
    }
    setSavingEialink(true)
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('bio_pages')
        .select('social_links')
        .eq('id', eialinkPageId)
        .single()

      if (fetchErr) throw fetchErr

      const currentSocial = (existing?.social_links as Record<string, any>) || {}
      const updatedSocial = {
        ...currentSocial,
        studiopro_config: config,
        model_variant: 'Landing Page Studio Pro (Lovable)',
      }

      const { error: updateErr } = await supabase
        .from('bio_pages')
        .update({
          social_links: updatedSocial,
          template_id: 'studiopro',
          published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eialinkPageId)

      if (updateErr) throw updateErr

      const domain = `${eialinkPageSlug || 'site'}.eialink.com.br`
      const fullUrl = `https://${domain}`
      toast.success(
        `Site publicado no Cloudflare! (${domain})`,
        {
          action: {
            label: 'Abrir site',
            onClick: () => window.open(fullUrl, '_blank'),
          },
          duration: 6000,
        }
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar no EiaLink')
    } finally {
      setSavingEialink(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const html = await exportToHTML(config, { settings: activeProject?.settings })
      const filename = `${(eialinkPageSlug || activeProject?.name || config.name || 'site').toLowerCase().replace(/\s+/g, '-')}.html`
      downloadHTML(html, filename)
      toast.success('Código HTML exportado!')
    } catch {
      toast.error('Falha ao exportar HTML')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-11 bg-bg-1/95 backdrop-blur-md border-b border-border-default/70 flex items-center px-2.5 sm:px-4 gap-1.5 shrink-0 z-20">
      {/* Breadcrumb / Project Identifier */}
      <div className="flex items-center gap-1.5 text-xs text-text-3 shrink-0">
        <span
          className="hidden sm:inline cursor-pointer hover:text-text-1 transition-colors"
          onClick={() => navigate('/')}
        >
          Projetos
        </span>
        <span className="hidden sm:inline">/</span>
        <span className="text-text-0 font-semibold max-w-[110px] sm:max-w-[150px] truncate">
          {projectName}
        </span>
        {eialinkPageSlug && (
          <a
            href={`https://${eialinkPageSlug}.eialink.com.br`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20 text-[10px] font-mono hover:bg-green/20 transition-all shrink-0 ml-0.5"
            title="Abrir no subdomínio Cloudflare"
          >
            <span className="hidden sm:inline">{eialinkPageSlug}.eialink.com.br</span>
            <span className="sm:hidden">.eialink</span>
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      <div className="hidden sm:block w-px h-5 bg-border-default mx-1 shrink-0" />

      {/* Page tabs */}
      <div className="hidden md:flex items-center gap-1 relative overflow-x-auto no-scrollbar">
        {pages.map((page) => (
          <PageTab
            key={page.id}
            page={page}
            isActive={activePageId === page.id}
            onClick={() => setActivePage(page.id)}
            onRename={(name) => renamePage(page.id, name)}
            onDelete={() => removePage(page.id)}
            canDelete={pages.length > 1}
          />
        ))}
        <div className="relative">
          <button
            onClick={() => setShowAddPage(!showAddPage)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-text-3 hover:text-green hover:bg-bg-2 transition-all"
            title="Adicionar página"
            aria-label="Adicionar página"
          >
            <Plus size={13} />
          </button>
          {showAddPage && (
            <AddPagePopover
              onAdd={(name, path) => addPage(name, path)}
              onClose={() => setShowAddPage(false)}
            />
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {/* Viewport switch (Desktop only or tablet) */}
        <div className="hidden sm:flex items-center bg-bg-2 p-0.5 rounded-lg border border-border-default/60">
          {viewports.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              title={label}
              aria-label={label}
              aria-pressed={viewport === value}
              onClick={() => setViewport(value)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all ${
                viewport === value
                  ? 'bg-bg-3 text-text-0 shadow-sm'
                  : 'text-text-3 hover:text-text-1 hover:bg-bg-3/50'
              }`}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Undo/Redo (Hidden on very narrow mobile) */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={() => {
              const label = undoStack[undoStack.length - 1]?.label
              undo()
              if (label) toast(`Desfazer: ${label}`, { duration: 1500 })
            }}
            disabled={!canUndo()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-bg-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => {
              const label = redoStack[redoStack.length - 1]?.label
              redo()
              if (label) toast(`Refazer: ${label}`, { duration: 1500 })
            }}
            disabled={!canRedo()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-bg-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Preview toggle */}
        <button
          onClick={togglePreview}
          className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            previewMode
              ? 'bg-green/15 text-green border border-green/30 shadow-sm'
              : 'text-text-2 hover:text-text-0 hover:bg-bg-2'
          }`}
          title="Prévia do site"
        >
          <Eye size={13} />
          <span className="hidden sm:inline">{previewMode ? 'Editando' : 'Prévia'}</span>
        </button>

        {/* JSON & History desktop buttons */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={toggleJsonDrawer}
            className={`h-7 px-2 rounded-lg flex items-center gap-1 text-xs transition-all ${
              jsonDrawerOpen ? 'bg-green/15 text-green' : 'text-text-3 hover:text-text-1 hover:bg-bg-2'
            }`}
            title="Ver código JSON"
          >
            <Code size={13} />
            <span>JSON</span>
          </button>

          <button
            onClick={toggleHistory}
            className="h-7 px-2 rounded-lg flex items-center gap-1 text-xs text-text-3 hover:text-text-1 hover:bg-bg-2 transition-all"
            title="Histórico de alterações"
          >
            <Clock size={13} />
            <span>Histórico</span>
          </button>

          <button
            onClick={toggleShortcutsModal}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-bg-2 transition-all"
            title="Atalhos do teclado"
          >
            <HelpCircle size={13} />
          </button>
        </div>

        {/* Export HTML */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="hidden sm:flex h-7 px-2.5 rounded-lg border border-border-default text-text-2 text-xs font-medium hover:text-text-0 hover:bg-bg-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed items-center gap-1"
          title="Exportar código fonte HTML autônomo"
        >
          {exporting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          <span>Exportar</span>
        </button>

        {/* Publicar no Cloudflare (Lovable Highlight CTA) */}
        <button
          onClick={handleSaveEialink}
          disabled={savingEialink}
          className="h-7 px-3 rounded-lg bg-green text-black text-xs font-semibold hover:bg-green-dim active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
          title="Publicar alterações no Cloudflare"
        >
          {savingEialink ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <CloudUpload size={13} />
              <span>Publicar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default CanvasToolbar
