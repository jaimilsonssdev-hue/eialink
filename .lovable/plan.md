# Premium com IA de verdade

## Por que hoje sai "padrão"
1. O gerador Premium depende de uma chave do Google AI Studio que não está configurada no servidor — sem ela, a IA quase não participa.
2. A instrução da IA traz cores fixas por segmento (toda barbearia recebe exatamente a mesma paleta) e um exemplo pronto que ela copia.
3. Depois da resposta, o sistema ainda força o tema pelo segmento, ignora a fonte e as animações e sempre usa a mesma ordem de seções.

## O que vai mudar (só no motor Premium — Máquina Express fica intacto)

**1. Google AI Studio (cota gratuita), sem custo de créditos**
O Premium continua usando o Google AI Studio com a chave que você cola no painel. O Premium passa a ler automaticamente essa chave salva (sem precisar colar de novo no assistente). Se a chave faltar, aparece um aviso claro apontando onde colá-la.

**2. Diretor de arte de verdade**
A IA recebe os dados reais do Google Maps (nota, avaliações, fotos, endereço) e escolhe, para cada negócio:
- um conceito criativo com nome (ex.: "Navalha & Couro", "Brasa Noturna")
- paleta própria (cor principal, fundo, cartões, texto), com checagem automática de contraste
- par de fontes (Moderna, Elegante, Marcante, Corporativa)
- nível de animação (sutil, padrão, cinematográfico)
- estilo de capa, ordem e seleção das seções
- textos específicos do negócio, sem clichês

**3. Variedade garantida**
Cada geração sorteia uma "semente criativa" entre 8 direções de arte (ex.: editorial luxo, neon noturno, minimal claro, orgânico quente, brutalista, cinematográfico…). Botão **"Gerar outra versão"** cria uma alternativa diferente para comparar.

**4. Honestidade mantida**
Nada inventado: depoimentos e nota só do Google; itens do catálogo só se vierem dos dados/briefing; o que faltar aparece como "pendente" no painel.

**5. Continua editável**
O resultado é salvo no formato do editor atual (cores, fontes, seções), então você ajusta tudo manualmente depois, sem gastar IA.

## Economia de créditos
- Uma única chamada por geração (fotos enviadas como links, não arquivos pesados).
- Resposta limitada ao essencial; sem novas tentativas automáticas em erros permanentes.

## Detalhes técnicos
- `copilot.functions.ts` `generatePremiumProposalFn`: manter Google AI Studio (Gemini). `AiCopilotModal` envia a chave salva do painel (`getSavedGeminiKey`) como `overrideApiKey` quando o campo manual estiver vazio; servidor segue aceitando `GEMINI_API_KEY`. Usar `responseMimeType: application/json`, um modelo por vez sem cascata de tentativas em erros 4xx (economiza cota), mensagem clara para 429/cota esgotada.
- Reescrever o system prompt: remover hex fixos por nicho e o exemplo literal; adicionar catálogo de direções de arte + `creativeSeed` aleatório (ou vindo do botão "outra versão"); incluir dados do Places já presentes na página.
- Schema: adicionar `theme.fontPair` (enum dos 4 pares) e `creativeDirection.concept`/`heroStyle`.
- `premiumProposal.adapter.ts`: respeitar `font_pair`, `motionIntensity` e a ordem das seções da IA; não sobrescrever paleta com o mapa por nicho; validação de contraste (WCAG AA) com ajuste automático.
- `AiCopilotModal.tsx`: botão "Gerar outra versão" e chave manual opcional.
- Sem mudanças de banco. Express, Storefront, Delivery, PWA, Agenda, Comanda e páginas existentes não são tocados.
