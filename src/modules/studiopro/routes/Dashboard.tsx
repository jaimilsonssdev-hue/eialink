import { useState, useRef, useEffect } from 'react'
import { useNavigate } from "@/modules/studiopro/lib/router"
import { toast } from 'sonner'
import { Search, Sparkles, Trash2, FolderOpen, Copy, Pencil, Layers, Briefcase, UtensilsCrossed, Building2, BookOpen } from 'lucide-react'
import { NavLink } from "@/modules/studiopro/lib/router"
import { useProjectsStore, type Project } from "@/modules/studiopro/store/projectsStore"
import { useConfigStore, defaultConfig } from "@/modules/studiopro/store/configStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"
import { hexToRgb } from "@/modules/studiopro/lib/theme-presets"
import { templateMeta, buildTemplate } from "@/modules/studiopro/lib/templates"

const templateIcons: Record<string, typeof Briefcase> = {
  Briefcase, UtensilsCrossed, Building2, BookOpen,
}

const suggestions = [
  {
    label: 'Landing page SaaS',
    prompt: 'Crie uma landing page de alta conversão para um software de gestão de equipes chamado "FlowBoard". Inclua um destaque persuasivo sobre produtividade, grade de recursos com quadros de tarefas e colaboração em tempo real, além de tabela de preços e tema escuro com detalhes em verde.',
  },
  {
    label: 'Portfólio Profissional',
    prompt: 'Crie um site moderno de portfólio para um consultor e arquiteto de soluções. Inclua seção de apresentação, galeria de projetos e estudos de caso, depoimentos de clientes e botão direto para contato via WhatsApp.',
  },
  {
    label: 'Restaurante & Gastronomia',
    prompt: 'Crie uma página elegante para uma pizzaria e restaurante artesanal chamado "La Cantina". Destaque as massas e forno a lenha, ambiente aconchegante, avaliações dos clientes e chamada clara para reservas e delivery.',
  },
  {
    label: 'Startup de IA',
    prompt: 'Crie uma página futurista e confiável para uma startup de inteligência artificial que automatiza documentos e processos. Inclua métricas impressionantes, integração, planos empresariais e chamada para demonstração gratuita.',
  },
]

const filters = ['Todos', 'Publicados', 'Rascunhos'] as const
type Filter = (typeof filters)[number]

const fallbackAccents = ['#22c55e', '#3b82f6', '#f472b6', '#8b5cf6', '#e8a838', '#06b6d4', '#10b981', '#ef4444']

function projectHash(name: string): number {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function projectAccent(project: Project): string {
  if (project.config?.theme?.accent) return project.config.theme.accent
  return fallbackAccents[projectHash(project.name) % fallbackAccents.length]
}

function PromptSection() {
  const navigate = useNavigate()
  const addProject = useProjectsStore((s) => s.addProject)
  const setConfig = useConfigStore((s) => s.setConfig)
  const setActiveProject = useEditorStore((s) => s.setActiveProject)
  const editorSetGenerating = useEditorStore((s) => s.setGenerating)

  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function startBlank() {
    const id = addProject('Novo Projeto')
    setActiveProject(id)
    setConfig(defaultConfig)
    navigate('/editor')
  }

  function startFromTemplate(tplId: string, tplName: string) {
    const id = addProject(tplName)
    setActiveProject(id)
    setConfig(buildTemplate(tplId, tplName))
    navigate('/editor')
  }

  function generate(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Create placeholder project, set generation state, navigate immediately
    const placeholderName = trimmed.split(/\s+/).slice(0, 4).join(' ')
    const id = addProject(placeholderName.charAt(0).toUpperCase() + placeholderName.slice(1))
    setActiveProject(id)
    setConfig(defaultConfig)
    editorSetGenerating(trimmed)
    navigate('/editor')
  }

  const hasGeminiKey = !!(typeof window !== 'undefined' && (localStorage.getItem('openpage-gemini-key') || localStorage.getItem('eialink_gemini_api_key')))
  const isFocused = prompt.length > 0

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/[0.08] rounded-full blur-[150px]" />
      </div>

      <div className="relative flex flex-col items-center pt-14 pb-6 px-4 md:px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
          <Sparkles size={12} />
          <span>Criador Inteligente de Sites & Landing Pages</span>
        </div>
        <h1 className="text-[32px] md:text-[40px] font-display font-bold tracking-tight mb-2.5 text-center text-white animate-fade-in-up">
          O que você gostaria de criar hoje?
        </h1>
        <p className="text-neutral-400 text-[14px] md:text-[15px] mb-7 text-center max-w-xl animate-fade-in-up">
          Descreva seu negócio e a inteligência artificial criará o layout completo, textos de alta conversão e tema visual sob medida.
        </p>

        {/* Prompt card - gradient border wrapper */}
        <div className={`w-full max-w-[680px] rounded-2xl p-px transition-all duration-300 shadow-2xl ${
          isFocused
            ? 'bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-emerald-500/5 shadow-[0_0_80px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
            : 'bg-gradient-to-b from-neutral-750 via-neutral-800 to-neutral-900 hover:from-emerald-500/30 hover:via-neutral-800 hover:to-neutral-900'
        }`}>
          <div className="bg-neutral-925 rounded-[15px] overflow-hidden border border-neutral-800/80">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  generate(prompt)
                }
              }}
              rows={3}
              placeholder="Ex: Uma landing page moderna para uma consultoria financeira com destaque para resultados, depoimentos e botão para WhatsApp..."
              className="w-full px-5 pt-5 pb-3 bg-transparent text-white text-[14px] placeholder:text-neutral-500 resize-none leading-relaxed outline-none"
            />

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 pb-3 pt-1 gap-2 border-t border-neutral-850">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setPrompt(s.prompt); textareaRef.current?.focus() }}
                    className="px-2.5 py-1 rounded-full text-neutral-400 text-[11px] font-medium border border-neutral-800 bg-neutral-900/60 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-all shrink-0 active:scale-95"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {prompt.trim() && (
                  <span className="text-[10px] text-neutral-500 hidden sm:inline font-mono">
                    {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
                  </span>
                )}
                <button
                  onClick={() => generate(prompt)}
                  disabled={!prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-[13px] font-bold hover:bg-emerald-400 active:scale-[0.97] transition-all disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                  <Sparkles size={14} />
                  Gerar Site
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template cards */}
        <div className="w-full max-w-[680px] mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up">
          {templateMeta.map((tpl) => {
            const rgb = hexToRgb(tpl.accent)
            const Icon = templateIcons[tpl.icon] || Layers
            return (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl.id, tpl.name)}
                className="group relative bg-neutral-900/70 border border-neutral-800 rounded-xl p-3.5 text-left transition-all hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.98]"
              >
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                      style={{ background: `rgba(${rgb}, 0.15)`, color: tpl.accent }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="text-[12.5px] font-semibold text-neutral-200 truncate">{tpl.name}</div>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-snug line-clamp-2">{tpl.description}</div>
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                    <Layers size={10} />
                    {tpl.blockCount} seções
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Start blank + API key hint */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button
            onClick={startBlank}
            className="text-neutral-400 text-[12px] hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            ou começar com página em branco
          </button>
          {!hasGeminiKey && (
            <p className="text-neutral-500 text-[11px] text-center">
              Modo padrão ativo.{' '}
              <NavLink to="/settings" className="text-emerald-400 hover:underline font-medium">
                Conecte sua chave Gemini gratuita
              </NavLink>
              {' '}para desbloquear a criação total com IA.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const renameProject = useProjectsStore((s) => s.renameProject)
  const deleteProject = useProjectsStore((s) => s.deleteProject)
  const duplicateProject = useProjectsStore((s) => s.duplicateProject)
  const setConfig = useConfigStore((s) => s.setConfig)
  const setActiveProject = useEditorStore((s) => s.setActiveProject)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [name, setName] = useState(project.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    return () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }
  }, [])

  function commitRename() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== project.name) {
      renameProject(project.id, trimmed)
    } else {
      setName(project.name)
    }
    setEditing(false)
  }

  function openProject() {
    setActiveProject(project.id)
    setConfig(project.config || defaultConfig)
    navigate('/editor')
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirming) {
      deleteProject(project.id)
    } else {
      setConfirming(true)
      confirmTimer.current = setTimeout(() => setConfirming(false), 2000)
    }
  }

  const accent = projectAccent(project)
  const rgb = hexToRgb(accent)
  const layout = projectHash(project.name) % 3

  return (
    <div
      onClick={openProject}
      className="group bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-neutral-700 hover:bg-neutral-850 hover:shadow-xl hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="h-32 bg-neutral-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300"
          style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }}
        />

        {/* Action buttons */}
        <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); toast.success('Projeto duplicado') }}
            aria-label={`Duplicar ${project.name}`}
            className="p-1.5 rounded-lg border bg-neutral-900/90 border-neutral-750 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={handleDelete}
            aria-label={confirming ? `Confirmar exclusão de ${project.name}` : `Excluir ${project.name}`}
            className={`rounded-lg border transition-all ${
              confirming
                ? 'px-2.5 py-1 bg-red-600 border-red-500 text-white text-[11px] font-bold opacity-100 shadow-md'
                : 'p-1.5 bg-neutral-900/90 border-neutral-750 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/40'
            }`}
          >
            {confirming ? 'Excluir?' : <Trash2 size={13} />}
          </button>
        </div>

        {/* Wireframe preview */}
        <div className="absolute inset-3 flex flex-col gap-1.5 p-2">
          {layout === 0 && (
            <>
              <div className="h-2 rounded-sm w-2/3" style={{ background: `rgba(${rgb}, 0.25)` }} />
              <div className="h-1.5 bg-neutral-800 rounded-sm w-1/2" />
              <div className="flex gap-1.5 mt-auto">
                <div className="flex-1 h-6 rounded-md" style={{ background: `rgba(${rgb}, 0.1)` }} />
                <div className="flex-1 h-6 rounded-md" style={{ background: `rgba(${rgb}, 0.1)` }} />
                <div className="flex-1 h-6 rounded-md" style={{ background: `rgba(${rgb}, 0.1)` }} />
              </div>
            </>
          )}
          {layout === 1 && (
            <>
              <div className="flex gap-2 flex-1">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-2 rounded-sm w-3/4" style={{ background: `rgba(${rgb}, 0.25)` }} />
                  <div className="h-1.5 bg-neutral-800 rounded-sm w-full" />
                  <div className="h-1.5 bg-neutral-800 rounded-sm w-2/3" />
                  <div className="h-4 rounded-md w-1/2 mt-auto" style={{ background: `rgba(${rgb}, 0.15)` }} />
                </div>
                <div className="w-16 rounded-md" style={{ background: `rgba(${rgb}, 0.1)` }} />
              </div>
            </>
          )}
          {layout === 2 && (
            <>
              <div className="flex justify-center mt-1">
                <div className="h-2 rounded-sm w-1/3" style={{ background: `rgba(${rgb}, 0.25)` }} />
              </div>
              <div className="flex justify-center">
                <div className="h-1.5 bg-neutral-800 rounded-sm w-2/3" />
              </div>
              <div className="flex gap-1.5 mt-auto justify-center">
                <div className="w-12 h-4 rounded-md" style={{ background: `rgba(${rgb}, 0.15)` }} />
                <div className="w-12 h-4 rounded-md bg-neutral-800" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-neutral-900/40">
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setName(project.name); setEditing(false) }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] font-semibold mb-1 bg-transparent border-b border-emerald-500 outline-none w-full text-white"
          />
        ) : (
          <div
            className="text-[13px] font-semibold mb-1 transition-colors text-neutral-200 flex items-center gap-1.5 group/name"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
            title="Clique duplo para renomear"
          >
            <span className="truncate">{project.name}</span>
            <Pencil size={11} className="text-neutral-500 opacity-0 group-hover:opacity-100 group-hover/name:opacity-70 transition-opacity shrink-0" />
          </div>
        )}
        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                project.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {project.status === 'published' ? 'Publicado' : 'Rascunho'}
          </span>
          <span className="text-neutral-500">{project.updatedAt}</span>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const projects = useProjectsStore((s) => s.projects)
  const [filter, setFilter] = useState<Filter>('Todos')
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) => {
    if (filter === 'Publicados' && p.status !== 'published') return false
    if (filter === 'Rascunhos' && p.status !== 'draft') return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-neutral-950">
      <PromptSection />

      {/* Projects section */}
      {projects.length > 0 && (
        <>
          <div className="px-4 md:px-12 pt-4">
            <div className="border-t border-neutral-800/80" />
          </div>

          <div className="px-4 md:px-12 pt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[14px] font-bold text-neutral-200 animate-fade-in">
                Seus Projetos
                <span className="text-neutral-500 font-normal ml-1.5">({projects.length})</span>
              </h2>
              <div className="flex gap-1.5">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                      filter === f
                        ? 'text-white bg-neutral-800 border border-neutral-700 shadow-sm'
                        : 'text-neutral-400 border border-transparent hover:text-white hover:bg-neutral-800/60'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[12px] w-full sm:w-52 outline-none focus:border-emerald-500 placeholder:text-neutral-500"
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="px-4 md:px-12 pt-4 pb-14 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
              {filtered.map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 md:px-12 pt-10 pb-16 flex flex-col items-center text-center">
              <FolderOpen size={32} className="text-neutral-600 mb-2.5" />
              <p className="text-neutral-400 text-[13px]">Nenhum projeto encontrado para este filtro</p>
              <button
                onClick={() => { setFilter('Todos'); setSearch('') }}
                className="mt-2.5 text-emerald-400 text-[12px] font-medium hover:underline transition-colors"
              >
                Limpar filtros de busca
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
