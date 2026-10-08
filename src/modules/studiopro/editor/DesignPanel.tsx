import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import type { ThemeConfig } from "@/modules/studiopro/blocks/types"
import { themePresets, resolveTheme, googleFontOptions } from "@/modules/studiopro/lib/theme-presets"

function ColorInput({ value, onInput, onChange }: { value: string; onInput: (v: string) => void; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-border-default bg-bg-2 cursor-pointer p-0.5 shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
        }}
        onBlur={(e) => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
        }}
        className="w-[72px] px-1.5 py-1 rounded border border-border-default bg-bg-2 text-text-1 text-[10px] font-mono outline-none focus:border-green"
      />
    </div>
  )
}

function ColorSection({ title, colors, defaultOpen = false }: {
  title: string
  colors: { key: keyof ThemeConfig; label: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const theme = useConfigStore((s) => s.config.theme)
  const previewTheme = useConfigStore((s) => s.previewTheme)
  const updateTheme = useConfigStore((s) => s.updateTheme)
  const resolved = useMemo(() => resolveTheme(theme), [theme])

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-2 hover:bg-bg-3 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{title}</span>
          <div className="flex gap-0.5">
            {colors.slice(0, 4).map((c) => (
              <div
                key={c.key}
                className="w-3 h-3 rounded-sm border border-border-subtle"
                style={{ backgroundColor: resolved[c.key] as string }}
              />
            ))}
          </div>
        </div>
        <ChevronDown size={12} className={`text-text-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 py-2.5 space-y-2.5 bg-bg-1">
          {colors.map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <span className="text-[10.5px] text-text-2">{c.label}</span>
              <ColorInput
                value={resolved[c.key] as string}
                onInput={(v) => previewTheme({ [c.key]: v })}
                onChange={(v) => updateTheme({ [c.key]: v })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DesignPanel() {
  const theme = useConfigStore((s) => s.config.theme)
  const setTheme = useConfigStore((s) => s.setTheme)
  const updateTheme = useConfigStore((s) => s.updateTheme)
  const resolved = useMemo(() => resolveTheme(theme), [theme])

  const activePresetId = useMemo(() => {
    for (const preset of themePresets) {
      const match = Object.keys(preset.theme).every(
        (k) => resolved[k as keyof ThemeConfig] === preset.theme[k as keyof ThemeConfig]
      )
      if (match) return preset.id
    }
    return null
  }, [resolved])

  return (
    <div className="px-3.5 py-3.5">
      {/* Preset grid */}
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
          Paletas de Cores Prontas
        </div>
        <div className="grid grid-cols-2 gap-2">
          {themePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.theme)}
              className={`p-2.5 rounded-xl border transition-all text-left ${
                activePresetId === preset.id
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-850'
              }`}
            >
              <div className="flex gap-1 mb-2">
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{ backgroundColor: preset.theme.bg0 }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{ backgroundColor: preset.theme.bg2 }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{ backgroundColor: preset.theme.accent }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{ backgroundColor: preset.theme.text0 }} />
              </div>
              <div className="text-[11px] font-semibold text-neutral-200 truncate">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color sections */}
      <div className="space-y-2.5 mb-5">
        <ColorSection
          title="Cores de Fundo"
          defaultOpen
          colors={[
            { key: 'bg0', label: 'Fundo Principal' },
            { key: 'bg1', label: 'Superfície Card 1' },
            { key: 'bg2', label: 'Superfície Card 2' },
            { key: 'bg3', label: 'Superfície Card 3' },
            { key: 'bg4', label: 'Fundo Flutuante' },
            { key: 'bg5', label: 'Fundo Destaque' },
          ]}
        />
        <ColorSection
          title="Tipografia & Textos"
          colors={[
            { key: 'text0', label: 'Texto Principal' },
            { key: 'text1', label: 'Texto Secundário' },
            { key: 'text2', label: 'Texto Suave' },
            { key: 'text3', label: 'Texto Apagado' },
          ]}
        />
        <ColorSection
          title="Destaque & Botões (Accent)"
          defaultOpen
          colors={[
            { key: 'accent', label: 'Cor de Destaque' },
            { key: 'accentDim', label: 'Destaque Translúcido' },
          ]}
        />
        <ColorSection
          title="Bordas & Divisores"
          colors={[
            { key: 'borderDefault', label: 'Borda Padrão' },
            { key: 'borderSubtle', label: 'Borda Sutil' },
            { key: 'borderHover', label: 'Borda Hover' },
          ]}
        />
      </div>

      {/* Fonts */}
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Fontes do Google</div>
        <div className="space-y-3">
          {([
            { key: 'fontSans' as const, label: 'Corpo do Texto (Sans)' },
            { key: 'fontDisplay' as const, label: 'Títulos & Destaques (Display)' },
            { key: 'fontMono' as const, label: 'Numerais & Códigos (Mono)' },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">{label}</label>
              <select
                value={resolved[key]}
                onChange={(e) => updateTheme({ [key]: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[12px] outline-none focus:border-emerald-500 cursor-pointer"
                style={{ fontFamily: `"${resolved[key]}", sans-serif` }}
              >
                {googleFontOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Arredondamento de Cantos</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Padrão (px)</label>
            <input
              type="number"
              min={0}
              max={24}
              value={resolved.radius}
              onChange={(e) => updateTheme({ radius: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[12px] outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Cards Grandes (px)</label>
            <input
              type="number"
              min={0}
              max={32}
              value={resolved.radiusLg}
              onChange={(e) => updateTheme({ radiusLg: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 text-[12px] outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
