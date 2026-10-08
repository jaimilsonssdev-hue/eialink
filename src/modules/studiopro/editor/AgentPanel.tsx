import { useState, useRef, useEffect } from 'react'
import { Send, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useConfigStore } from "@/modules/studiopro/store/configStore"
import { blockMetadata } from "@/modules/studiopro/lib/block-metadata"
import { themePresets } from "@/modules/studiopro/lib/theme-presets"
import type { BlockConfig } from "@/modules/studiopro/blocks/types"

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  applied?: boolean
  patch?: {
    path: string
    blockId?: string
    propKey?: string
    value?: string
    added?: string[]
    removed?: string[]
  }
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    text: 'Olá! Sou o assistente de IA do Studio Pro. Posso criar novas seções, ajustar textos, trocar temas de cores e formatar seu site instantaneamente. Como posso te ajudar hoje?',
  },
]

function TypingIndicator() {
  return (
    <div className="self-start flex gap-1 px-4 py-3 bg-emerald-500/10 rounded-xl rounded-bl-sm border border-emerald-500/20">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-40"
          style={{
            animation: 'typeDot 1.4s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typeDot {
          0%, 60%, 100% { opacity: 0.4; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

// Pattern matching for agent responses (PT-BR and EN)
function generateResponse(input: string, blocks: { id: string; type: string; variant: string; props: Record<string, unknown> }[]): ChatMessage | { action: 'addBlock'; block: BlockConfig; message: string } | { action: 'removeBlock'; blockId: string; message: string } | { action: 'changeVariant'; blockId: string; variant: string; message: string } | { action: 'changeTheme'; themeId: string; message: string } {
  const lower = input.toLowerCase()
  const heroBlock = blocks.find((b) => b.type === 'hero')

  // Change headline: "mudar título para ...", "alterar headline para ...", "change headline to ..."
  if ((lower.includes('título') || lower.includes('titulo') || lower.includes('headline')) && (lower.includes('mudar') || lower.includes('alterar') || lower.includes('trocar') || lower.includes('change')) && heroBlock) {
    const match = input.match(/["'](.+?)["']/) || input.match(/(?:para|to)\s+(.+)/i)
    const newHeadline = match?.[1]?.trim() || 'Transforme seu Negócio Hoje'
    const oldHeadline = String(heroBlock.props.headline || 'Construa sites rápidos')
    return {
      id: `msg-${Date.now()}`,
      role: 'agent',
      text: `Vou atualizar o título principal do destaque para você.`,
      patch: {
        path: `blocks[${blocks.indexOf(heroBlock)}].props.headline`,
        blockId: heroBlock.id,
        propKey: 'headline',
        value: newHeadline,
        removed: [`"${oldHeadline}"`],
        added: [`"${newHeadline}"`],
      },
    }
  }

  // Add block: "adicionar precos", "adicionar depoimentos", "add pricing"
  const addMatch = lower.match(/(?:adicionar|colocar|criar|add)\s+(?:um\s+|uma\s+|a\s+)?(\w+)/)
  if (addMatch) {
    let key = addMatch[1].replace(/s$/, '')
    if (key === 'preco' || key === 'preço' || key === 'plano') key = 'pricing'
    if (key === 'depoimento') key = 'testimonials'
    if (key === 'servico' || key === 'serviço' || key === 'recurso') key = 'features'
    if (key === 'contato') key = 'contact'
    if (key === 'duvida' || key === 'dúvida' || key === 'pergunta') key = 'faq'
    if (key === 'equipe') key = 'team'
    if (key === 'rodape' || key === 'rodapé') key = 'footer'
    if (key === 'topo' || key === 'menu') key = 'navbar'

    const meta = blockMetadata.find((b) => b.type === key || b.label.toLowerCase().includes(key))
    if (meta) {
      const block: BlockConfig = {
        id: `block-${Date.now()}`,
        type: meta.type,
        variant: meta.variants[0],
        props: { ...meta.defaultProps },
      }
      return { action: 'addBlock', block, message: `Adicionando o bloco ${meta.label} à página.` }
    }
  }

  // Remove block: "remover faq", "excluir precos", "delete pricing"
  const removeMatch = lower.match(/(?:remover|excluir|deletar|remove|delete)\s+(?:o\s+|a\s+|the\s+)?(\w+)/)
  if (removeMatch) {
    let key = removeMatch[1].replace(/s$/, '')
    if (key === 'preco' || key === 'preço' || key === 'plano') key = 'pricing'
    if (key === 'depoimento') key = 'testimonials'
    if (key === 'faq') key = 'faq'
    const found = blocks.find((b) => b.type === key || b.type.includes(key))
    if (found) {
      return { action: 'removeBlock', blockId: found.id, message: `Removendo o bloco ${found.type} da página.` }
    }
  }

  // Change theme: "tema escuro", "tema azul", "switch to midnight"
  if (lower.includes('tema') || lower.includes('theme') || lower.includes('cor')) {
    if (lower.includes('escuro') || lower.includes('dark') || lower.includes('midnight') || lower.includes('noite')) {
      const preset = themePresets.find((p) => p.id === 'midnight' || p.id === 'dark') || themePresets[1]
      return { action: 'changeTheme', themeId: preset.id, message: `Aplicando o tema escuro (${preset.name}).` }
    }
    if (lower.includes('azul') || lower.includes('ocean')) {
      const preset = themePresets.find((p) => p.id === 'ocean') || themePresets[0]
      return { action: 'changeTheme', themeId: preset.id, message: `Aplicando a paleta de cores oceano.` }
    }
  }

  return {
    id: `msg-${Date.now()}`,
    role: 'agent',
    text: "Posso ajudar a transformar seu site! Experimente pedir:\n- \"Mudar título para 'Sua Empresa em Destaque'\"\n- \"Adicionar seção de preços\"\n- \"Adicionar depoimentos\"\n- \"Remover perguntas frequentes\"\n- \"Mudar para tema escuro\"",
  }
}

export function AgentPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [showTyping, setShowTyping] = useState(false)
  const updateBlockProps = useConfigStore((s) => s.updateBlockProps)
  const addBlock = useConfigStore((s) => s.addBlock)
  const removeBlock = useConfigStore((s) => s.removeBlock)
  const updateBlock = useConfigStore((s) => s.updateBlock)
  const setTheme = useConfigStore((s) => s.setTheme)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  function handleApply(msg: ChatMessage) {
    if (!msg.patch?.blockId || !msg.patch?.propKey || !msg.patch?.value) {
      toast.error('Não foi possível aplicar: dados ausentes')
      return
    }
    updateBlockProps(msg.patch.blockId, { [msg.patch.propKey]: msg.patch.value })
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m))
    )
    toast.success('Alteração aplicada com sucesso')
  }

  function handleReject(msg: ChatMessage) {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, applied: false, patch: undefined } : m))
    )
    toast('Alteração descartada')
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setShowTyping(true)

    // Simulate agent thinking (read fresh blocks inside timeout)
    setTimeout(() => {
      const state = useConfigStore.getState()
      const pages = state.config.pages
      const currentBlocks = pages && pages.length > 0
        ? (pages.find((p) => p.id === state.activePageId) ?? pages[0]).blocks
        : state.config.blocks
      const response = generateResponse(text, currentBlocks)
      setShowTyping(false)

      // Handle action-based responses
      if ('action' in response) {
        const agentMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'agent', text: response.message }
        setMessages((prev) => [...prev, agentMsg])

        if (response.action === 'addBlock') {
          addBlock(response.block)
          toast.success(`Bloco ${response.block.type} adicionado`)
        } else if (response.action === 'removeBlock') {
          removeBlock(response.blockId)
          toast('Bloco removido da página')
        } else if (response.action === 'changeVariant') {
          updateBlock(response.blockId, { variant: response.variant })
          toast.success(`Estilo alterado para ${response.variant}`)
        } else if (response.action === 'changeTheme') {
          const preset = themePresets.find((p) => p.id === response.themeId)
          if (preset) {
            setTheme(preset.theme)
            toast.success(`Tema atualizado para ${preset.name}`)
          }
        }
      } else {
        setMessages((prev) => [...prev, response])
      }
    }, 800 + Math.random() * 600)
  }

  function handleHint(hint: string) {
    setInput(hint)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[94%] px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed ${
              msg.role === 'user'
                ? 'self-end bg-neutral-800 text-white rounded-br-sm'
                : 'self-start bg-emerald-500/10 text-neutral-150 rounded-bl-sm border border-emerald-500/20 shadow-sm'
            }`}
          >
            {msg.text}

            {/* JSON patch diff */}
            {msg.patch && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 mt-2 font-mono text-[11px] leading-relaxed">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Ajuste Sugerido
                  </span>
                  {!msg.applied && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApply(msg)}
                        className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1"
                      >
                        <Check size={10} /> Aplicar
                      </button>
                      <button
                        onClick={() => handleReject(msg)}
                        className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                      >
                        <X size={10} /> Recusar
                      </button>
                    </div>
                  )}
                  {msg.applied && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check size={10} /> Aplicado com sucesso
                    </span>
                  )}
                </div>
                <div className="text-neutral-500 text-[10px] mb-1">{msg.patch.path}</div>
                {msg.patch.removed?.map((line, i) => (
                  <div key={`r-${i}`} className="text-red-400 line-through opacity-70">
                    - {line}
                  </div>
                ))}
                {msg.patch.added?.map((line, i) => (
                  <div key={`a-${i}`} className="text-emerald-400 font-medium">
                    + {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Diga à IA o que alterar na página..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            className="flex-1 px-3 py-2 rounded-xl border border-neutral-750 bg-neutral-900 text-neutral-100 text-[12.5px] outline-none focus:border-emerald-500 placeholder:text-neutral-500"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black shrink-0 hover:bg-emerald-400 transition-colors shadow-sm active:scale-95"
            aria-label="Enviar mensagem"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {['Mudar título', 'Adicionar preços', 'Adicionar depoimentos', 'Mudar tema'].map((hint) => (
            <span
              key={hint}
              onClick={() => handleHint(hint)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 border border-neutral-800 bg-neutral-900/80 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
