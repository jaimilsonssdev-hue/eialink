import { useState } from 'react'
import { ChevronDown, ChevronRight, Code, Plus, Trash2 } from 'lucide-react'
import type { BlockConfig, BlockType } from "@/modules/studiopro/blocks/types"
import { useConfigStore } from "@/modules/studiopro/store/configStore"

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'array-strings' | 'array-items'
  options?: string[]
}

const blockFields: Partial<Record<BlockType, { sections: { title: string; fields: FieldDef[] }[] }>> = {
  navbar: {
    sections: [
      {
        title: 'Conteúdo',
        fields: [
          { key: 'logo', label: 'Nome / Logo', type: 'text' },
          { key: 'logoImage', label: 'URL da Imagem da Logo', type: 'text' },
          { key: 'ctaText', label: 'Texto do Botão de Ação', type: 'text' },
          { key: 'links', label: 'Itens do Menu', type: 'array-strings' },
        ],
      },
      {
        title: 'Estilo do Topo',
        fields: [
          { key: 'variant', label: 'Alinhamento', type: 'select', options: ['default', 'centered'] },
        ],
      },
    ],
  },
  hero: {
    sections: [
      {
        title: 'Conteúdo Principal',
        fields: [
          { key: 'badge', label: 'Etiqueta de Destaque (Badge)', type: 'text' },
          { key: 'headline', label: 'Título Principal', type: 'text' },
          { key: 'subheadline', label: 'Subtítulo Explicativo', type: 'textarea' },
          { key: 'primaryCta', label: 'Botão Principal (CTA)', type: 'text' },
          { key: 'primaryCtaUrl', label: 'Link do Botão Principal', type: 'text' },
          { key: 'secondaryCta', label: 'Botão Secundário', type: 'text' },
          { key: 'secondaryCtaUrl', label: 'Link do Botão Secundário', type: 'text' },
          { key: 'heroImage', label: 'URL da Imagem / Foto', type: 'text' },
        ],
      },
      {
        title: 'Estilo Visual',
        fields: [
          { key: 'variant', label: 'Layout do Hero', type: 'select', options: ['centered', 'split', 'gradient', 'minimal'] },
        ],
      },
    ],
  },
  features: {
    sections: [
      {
        title: 'Apresentação',
        fields: [
          { key: 'label', label: 'Selo / Categoria', type: 'text' },
          { key: 'title', label: 'Título da Seção', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
        ],
      },
      {
        title: 'Lista de Serviços / Diferenciais',
        fields: [
          { key: 'items', label: 'Cards de Serviços', type: 'array-items' },
        ],
      },
      {
        title: 'Estilo dos Cards',
        fields: [
          { key: 'variant', label: 'Disposição', type: 'select', options: ['grid', 'list', 'alternating'] },
        ],
      },
    ],
  },
  pricing: {
    sections: [
      {
        title: 'Conteúdo',
        fields: [
          { key: 'title', label: 'Título da Tabela', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
        ],
      },
      {
        title: 'Estilo dos Planos',
        fields: [
          { key: 'variant', label: 'Tipo de Tabela', type: 'select', options: ['simple', 'comparison'] },
        ],
      },
    ],
  },
  cta: {
    sections: [
      {
        title: 'Mensagem de Conversão',
        fields: [
          { key: 'headline', label: 'Título da Chamada', type: 'text' },
          { key: 'subheadline', label: 'Subtítulo', type: 'text' },
          { key: 'buttonText', label: 'Texto do Botão', type: 'text' },
          { key: 'buttonUrl', label: 'Link ou WhatsApp', type: 'text' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Layout', type: 'select', options: ['simple', 'split'] },
        ],
      },
    ],
  },
  footer: {
    sections: [
      {
        title: 'Rodapé',
        fields: [
          { key: 'logo', label: 'Nome da Empresa', type: 'text' },
          { key: 'logoImage', label: 'URL da Logo', type: 'text' },
          { key: 'copyright', label: 'Texto de Direitos Autorais', type: 'text' },
          { key: 'links', label: 'Links Rápidos', type: 'array-strings' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Modelo', type: 'select', options: ['simple', 'multi-column', 'minimal'] },
        ],
      },
    ],
  },
  testimonials: {
    sections: [
      {
        title: 'Depoimentos',
        fields: [
          { key: 'title', label: 'Título da Seção', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
          { key: 'items', label: 'Avaliações de Clientes', type: 'array-items' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Formato', type: 'select', options: ['cards', 'carousel', 'spotlight'] },
        ],
      },
    ],
  },
  stats: {
    sections: [
      {
        title: 'Métricas e Números',
        fields: [
          { key: 'title', label: 'Título da Seção', type: 'text' },
          { key: 'items', label: 'Estatísticas', type: 'array-items' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Disposição', type: 'select', options: ['grid', 'bar', 'counter'] },
        ],
      },
    ],
  },
  faq: {
    sections: [
      {
        title: 'Perguntas e Respostas',
        fields: [
          { key: 'title', label: 'Título do FAQ', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
          { key: 'items', label: 'Perguntas', type: 'array-items' },
        ],
      },
    ],
  },
  team: {
    sections: [
      {
        title: 'Equipe',
        fields: [
          { key: 'title', label: 'Título da Equipe', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
          { key: 'members', label: 'Membros', type: 'array-items' },
        ],
      },
    ],
  },
  contact: {
    sections: [
      {
        title: 'Contato',
        fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo / Instruções', type: 'text' },
        ],
      },
    ],
  },
  newsletter: {
    sections: [
      {
        title: 'Captura',
        fields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
          { key: 'buttonText', label: 'Texto do Botão', type: 'text' },
          { key: 'socialProof', label: 'Texto de Apoio', type: 'text' },
        ],
      },
    ],
  },
  logocloud: {
    sections: [
      {
        title: 'Marcas',
        fields: [
          { key: 'title', label: 'Título da Seção', type: 'text' },
          { key: 'logos', label: 'Nomes ou URLs das Marcas', type: 'array-strings' },
        ],
      },
    ],
  },
  content: {
    sections: [
      {
        title: 'Texto',
        fields: [
          { key: 'body', label: 'Conteúdo (Suporta Markdown)', type: 'textarea' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Disposição', type: 'select', options: ['prose', 'columns', 'highlight'] },
        ],
      },
    ],
  },
  image: {
    sections: [
      {
        title: 'Imagem & Textos',
        fields: [
          { key: 'src', label: 'URL da Imagem', type: 'text' },
          { key: 'alt', label: 'Texto Alternativo (Acessibilidade)', type: 'text' },
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'subtitle', label: 'Subtítulo', type: 'text' },
          { key: 'imageSide', label: 'Lado da Imagem', type: 'select', options: ['left', 'right'] },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Disposição', type: 'select', options: ['hero-image', 'side-by-side', 'grid'] },
        ],
      },
    ],
  },
  video: {
    sections: [
      {
        title: 'Vídeo',
        fields: [
          { key: 'url', label: 'URL do Vídeo (YouTube ou Vimeo)', type: 'text' },
          { key: 'title', label: 'Título do Vídeo', type: 'text' },
        ],
      },
      {
        title: 'Plataforma',
        fields: [
          { key: 'variant', label: 'Plataforma', type: 'select', options: ['youtube', 'vimeo'] },
        ],
      },
    ],
  },
  gallery: {
    sections: [
      {
        title: 'Galeria',
        fields: [
          { key: 'title', label: 'Título da Galeria', type: 'text' },
          { key: 'images', label: 'Fotos da Galeria', type: 'array-items' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Modelo de Grade', type: 'select', options: ['grid', 'masonry'] },
        ],
      },
    ],
  },
  divider: {
    sections: [
      {
        title: 'Espaçamento & Estilo',
        fields: [
          { key: 'variant', label: 'Tipo', type: 'select', options: ['line', 'space', 'dots'] },
          { key: 'width', label: 'Largura', type: 'select', options: ['full', 'centered', 'narrow'] },
          { key: 'height', label: 'Altura (pixels)', type: 'text' },
        ],
      },
    ],
  },
  banner: {
    sections: [
      {
        title: 'Aviso',
        fields: [
          { key: 'text', label: 'Texto do Aviso', type: 'text' },
          { key: 'linkText', label: 'Texto do Link', type: 'text' },
          { key: 'linkUrl', label: 'URL de Destino', type: 'text' },
        ],
      },
      {
        title: 'Estilo',
        fields: [
          { key: 'variant', label: 'Formato', type: 'select', options: ['ribbon', 'bar'] },
        ],
      },
    ],
  },
}

function PropertyField({ field, block }: { field: FieldDef; block: BlockConfig }) {
  const updateBlockProps = useConfigStore((s) => s.updateBlockProps)
  const updateBlock = useConfigStore((s) => s.updateBlock)

  const value = field.key === 'variant'
    ? block.variant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (block.props as any)[field.key]

  const onChange = (newValue: unknown) => {
    if (field.key === 'variant') {
      updateBlock(block.id, { variant: newValue as string })
    } else {
      updateBlockProps(block.id, { [field.key]: newValue })
    }
  }

  switch (field.type) {
    case 'text':
      return (
        <div className="mb-3">
          <label className="block text-xs text-text-2 mb-1 font-medium">{field.label}</label>
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-2 text-text-0 text-xs outline-none focus:border-green/80 focus:ring-1 focus:ring-green/30 transition-all"
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="mb-3">
          <label className="block text-xs text-text-2 mb-1 font-medium">{field.label}</label>
          <textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-2 text-text-0 text-xs outline-none focus:border-green/80 focus:ring-1 focus:ring-green/30 resize-y transition-all"
          />
        </div>
      )

    case 'select':
      return (
        <div className="mb-3">
          <label className="block text-xs text-text-2 mb-1 font-medium">{field.label}</label>
          <select
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-2 text-text-0 text-xs outline-none focus:border-green/80 cursor-pointer transition-all"
          >
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )

    case 'array-strings': {
      const items = (Array.isArray(value) ? value : []) as string[]
      return (
        <div className="mb-3">
          <label className="block text-xs text-text-2 mb-1 font-medium">{field.label}</label>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const updated = [...items]
                    updated[i] = e.target.value
                    onChange(updated)
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-2 text-text-0 text-xs outline-none focus:border-green/80"
                />
                <button
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="w-7 h-7 rounded-lg border border-border-default/60 bg-bg-2/50 flex items-center justify-center text-text-3 hover:text-status-red hover:border-status-red/30 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onChange([...items, ''])}
            className="text-xs text-green hover:underline font-medium inline-flex items-center gap-1 mt-2"
          >
            <Plus size={12} />
            <span>Adicionar item</span>
          </button>
        </div>
      )
    }

    case 'array-items': {
      const items = (Array.isArray(value) ? value : []) as Array<Record<string, string>>

      function createEmptyItem(): Record<string, string> {
        if (items.length > 0) {
          const template: Record<string, string> = {}
          for (const key of Object.keys(items[0])) template[key] = ''
          return template
        }
        const blockTemplates: Partial<Record<string, Record<string, Record<string, string>>>> = {
          testimonials: { items: { name: '', role: '', quote: '' } },
          stats: { items: { value: '', label: '' } },
          faq: { items: { question: '', answer: '' } },
          team: { members: { name: '', role: '' } },
          features: { items: { title: '', description: '' } },
          image: { images: { src: '', alt: '' } },
          gallery: { images: { src: '', alt: '', caption: '' } },
        }
        return blockTemplates[block.type]?.[field.key] || { title: '', description: '' }
      }

      return (
        <div className="mb-3">
          <label className="block text-xs text-text-2 mb-1.5 font-medium">{field.label}</label>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="bg-bg-2/60 border border-border-default/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">Item #{i + 1}</span>
                  <button
                    onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    className="text-[11px] text-text-3 hover:text-status-red transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Remover</span>
                  </button>
                </div>
                {Object.entries(item).map(([key, val]) => (
                  <div key={key} className="mb-2">
                    <label className="block text-[11px] text-text-3 mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={String(val)}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[i] = { ...updated[i], [key]: e.target.value }
                        onChange(updated)
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-3 text-text-0 text-xs outline-none focus:border-green/80"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button
            onClick={() => onChange([...items, createEmptyItem()])}
            className="text-xs text-green hover:underline font-medium inline-flex items-center gap-1 mt-2.5"
          >
            <Plus size={12} />
            <span>Adicionar novo item</span>
          </button>
        </div>
      )
    }

    default:
      return null
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-border-subtle">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-text-1 hover:text-text-0 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

export function PropertiesPanel({ block }: { block: BlockConfig }) {
  const [showJson, setShowJson] = useState(false)
  const schema = blockFields[block.type]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-default/70 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-2">
          Propriedades do Bloco
        </span>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20 font-semibold">
          {block.type}
        </span>
      </div>

      {/* Property sections */}
      {schema?.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.fields.map((field) => (
            <PropertyField key={field.key} field={field} block={block} />
          ))}
        </Section>
      )) || (
        <div className="p-6 text-xs text-text-3 text-center">
          Nenhuma propriedade editável configurada para este bloco.
        </div>
      )}

      {/* View JSON toggle */}
      <div className="border-t border-border-subtle p-2">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs text-text-3 hover:text-text-1 hover:bg-bg-2 transition-all"
        >
          <Code size={13} />
          <span>{showJson ? 'Ocultar' : 'Ver'} JSON do Bloco</span>
        </button>
        {showJson && (
          <pre className="p-3 bg-bg-3 rounded-xl border border-border-default text-[10px] font-mono text-text-1 leading-relaxed overflow-x-auto max-h-48 overflow-y-auto mt-2">
            {JSON.stringify({ id: block.id, type: block.type, variant: block.variant, props: block.props }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

export default PropertiesPanel
