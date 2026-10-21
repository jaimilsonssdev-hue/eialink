import { useState, useEffect, useRef } from 'react'
import {
  Settings2, Search as SearchIcon, Key, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useProjectsStore, type ProjectSettings } from "@/modules/studiopro/store/projectsStore"
import { useEditorStore } from "@/modules/studiopro/store/editorStore"

type SettingsTab = 'general' | 'seo' | 'api'

const tabDefs: { value: SettingsTab; label: string; icon: typeof Settings2 }[] = [
  { value: 'general', label: 'Geral', icon: Settings2 },
  { value: 'seo', label: 'SEO & Google', icon: SearchIcon },
  { value: 'api', label: 'Chaves de API', icon: Key },
]

function useSettingsState() {
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const projects = useProjectsStore((s) => s.projects)
  const updateProjectSettings = useProjectsStore((s) => s.updateProjectSettings)

  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null
  const projectSettings = activeProject?.settings || {}

  const [showSaved, setShowSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const data: Record<string, string> = Object.fromEntries(
    Object.entries(projectSettings).map(([k, v]) => [k, v || ''])
  )

  const update = (key: string, value: string) => {
    if (activeProjectId) {
      updateProjectSettings(activeProjectId, { [key]: value } as Partial<ProjectSettings>)
    }
    setShowSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setShowSaved(false), 2000)
  }

  useEffect(() => {
    return () => { if (savedTimer.current) clearTimeout(savedTimer.current) }
  }, [])

  return { data, update, showSaved }
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[12px] text-neutral-400 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  )
}

function ControlledInput({ settingsKey, placeholder, settings }: { settingsKey: string; placeholder?: string; settings: ReturnType<typeof useSettingsState> }) {
  return (
    <input
      type="text"
      value={settings.data[settingsKey] || ''}
      placeholder={placeholder}
      onChange={(e) => settings.update(settingsKey, e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[13px] outline-none focus:border-emerald-500 placeholder:text-neutral-500 transition-colors"
    />
  )
}

function ControlledTextarea({ settingsKey, rows = 3, settings }: { settingsKey: string; rows?: number; settings: ReturnType<typeof useSettingsState> }) {
  return (
    <textarea
      value={settings.data[settingsKey] || ''}
      rows={rows}
      onChange={(e) => settings.update(settingsKey, e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[13px] outline-none focus:border-emerald-500 resize-y transition-colors placeholder:text-neutral-500"
    />
  )
}

function GeneralPanel({ settings }: { settings: ReturnType<typeof useSettingsState> }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-neutral-100 mb-4">Configurações Gerais</h2>
      <FieldGroup label="Nome do Site ou Empresa">
        <ControlledInput settingsKey="siteName" placeholder="Ex: Minha Empresa Link" settings={settings} />
      </FieldGroup>
      <FieldGroup label="Descrição Curta do Negócio">
        <ControlledTextarea settingsKey="siteDescription" settings={settings} />
      </FieldGroup>
      <FieldGroup label="URL do Ícone (Favicon)">
        <ControlledInput settingsKey="faviconUrl" placeholder="https://exemplo.com/favicon.ico" settings={settings} />
      </FieldGroup>
      <FieldGroup label="Idioma Principal do Site">
        <select
          value={settings.data.language || 'Português (Brasil)'}
          onChange={(e) => settings.update('language', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[13px] outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="Português (Brasil)">Português (Brasil)</option>
          <option value="English">English</option>
          <option value="Español">Español</option>
          <option value="Deutsch">Deutsch</option>
          <option value="Français">Français</option>
        </select>
      </FieldGroup>
    </div>
  )
}

function SeoPanel({ settings }: { settings: ReturnType<typeof useSettingsState> }) {
  const title = settings.data.seoTitle || 'Meu Site Profissional'
  const description = settings.data.seoDescription || 'Conheça nossos produtos e serviços de excelência com atendimento rápido.'
  const domain = settings.data.customDomain || 'minhaempresa.eialink.com.br'

  return (
    <div>
      <h2 className="text-lg font-bold text-neutral-100 mb-4">SEO & Buscas do Google</h2>
      <FieldGroup label="Título da Página (Tag Title)">
        <ControlledInput settingsKey="seoTitle" placeholder="Ex: Minha Empresa | Especialista no Setor" settings={settings} />
      </FieldGroup>
      <FieldGroup label="Descrição para Buscas (Meta Description)">
        <ControlledTextarea settingsKey="seoDescription" settings={settings} />
      </FieldGroup>
      <FieldGroup label="URL da Imagem de Compartilhamento (OpenGraph Image)">
        <ControlledInput settingsKey="ogImageUrl" placeholder="https://exemplo.com/preview.png" settings={settings} />
      </FieldGroup>

      {/* Live Google preview */}
      <div className="mt-6 p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Prévia no Google</div>
        <div className="text-[#8ab4f8] text-sm hover:underline cursor-pointer font-medium">{title}</div>
        <div className="text-[#bdc1c6] text-[11px] mt-0.5">https://{domain}</div>
        <div className="text-[#9aa0a6] text-[12px] mt-1 leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  )
}

function ApiPanel({ settings }: { settings: ReturnType<typeof useSettingsState> }) {
  const [geminiKey, setGeminiKey] = useState(
    () => (typeof window !== 'undefined' ? (localStorage.getItem('openpage-gemini-key') || localStorage.getItem('eialink_gemini_api_key') || '') : '')
  )
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  function handleKeyChange(value: string) {
    setGeminiKey(value)
    if (value) {
      localStorage.setItem('openpage-gemini-key', value.trim())
      localStorage.setItem('eialink_gemini_api_key', value.trim())
    } else {
      localStorage.removeItem('openpage-gemini-key')
      localStorage.removeItem('eialink_gemini_api_key')
    }
  }

  async function handleTest() {
    if (!geminiKey) return
    setTesting(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`,
      )
      if (res.ok) {
        toast.success('Chave da API do Google AI Studio válida e conectada!')
      } else {
        toast.error(`Chave inválida ou não autorizada: Status ${res.status}`)
      }
    } catch {
      toast.error('Falha ao conectar com o serviço do Google Gemini')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-neutral-100 mb-4">Chaves de API & Conexões</h2>

      <FieldGroup label="Chave de Implementação Direta (Cloudflare)">
        <ControlledInput
          settingsKey="deployAccessKey"
          placeholder="Chave de acesso automático de deploy"
          settings={settings}
        />
        <p className="text-[11px] text-neutral-500 mt-1.5">
          Permite a publicação imediata de sites em 1 clique hospedados na infraestrutura Cloudflare.
        </p>
      </FieldGroup>

      <FieldGroup label="Chave de API Gemini (Google AI Studio)">
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiKey}
            placeholder="AIza..."
            onChange={(e) => handleKeyChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[13px] outline-none focus:border-emerald-500 placeholder:text-neutral-500 transition-colors font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 text-[12px] hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            {showKey ? 'Ocultar' : 'Exibir'}
          </button>
          <button
            onClick={handleTest}
            disabled={!geminiKey || testing}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/20 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>
        <p className="text-[11px] text-neutral-500 mt-1.5">
          Utilizada para gerar e personalizar sites em tempo real via IA. Obtenha gratuitamente em{' '}
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            aistudio.google.com
          </a>
        </p>
      </FieldGroup>

    </div>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const settings = useSettingsState()

  const panels: Record<SettingsTab, React.ReactNode> = {
    general: <GeneralPanel settings={settings} />,
    seo: <SeoPanel settings={settings} />,
    api: <ApiPanel settings={settings} />,
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-neutral-950">
      {/* Sidebar */}
      <div className="md:w-56 bg-neutral-900/60 border-b md:border-b-0 md:border-r border-neutral-800 p-3 shrink-0 flex md:flex-col gap-1.5 overflow-x-auto">
        {tabDefs.map(({ value, label, icon: Icon }, i) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all text-left animate-fade-in-up ${
              activeTab === value
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl relative custom-scrollbar">
        {settings.showSaved && (
          <div className="absolute top-4 right-8 flex items-center gap-1.5 text-emerald-400 text-[12px] font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-fade-in">
            <Check size={13} />
            Salvo com sucesso
          </div>
        )}
        <div key={activeTab} className="animate-fade-in-up">
          {panels[activeTab]}
        </div>
      </div>
    </div>
  )
}
