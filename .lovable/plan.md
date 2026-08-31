# Galeria de modelos: prévias reais + visual novo

## Problema

Os cartões da galeria ("Modelos por nicho", exibida no Dashboard) usam desenhos
esquemáticos feitos à mão (`TemplateThumbnail`, `NicheTemplateThumbnail`,
`RestaurantTemplateThumbnail`): retângulos e barras coloridas que não têm relação
com a página que o sistema realmente gera. Por isso o cliente escolhe um modelo e
recebe algo diferente do que viu.

## O que vou fazer

### 1. Prévia real de cada modelo

Trocar os mockups desenhados por uma renderização de verdade: o mesmo motor que
monta a página pública (`TemplateRenderer`) passa a rodar dentro de um "celular"
em miniatura no cartão, alimentado por um conteúdo de demonstração por nicho
(nome fictício, descrição, 3–4 links, WhatsApp, 2 produtos, capa e avatar do
nicho). O que aparece no cartão é literalmente o que o cliente vai receber.

- Cada nicho ganha um pacote de conteúdo demo coerente (restaurante, clínica,
  advocacia, academia, loja, beleza, terapia, criador, profissional, imobiliária,
  pet shop).
- A prévia é interativa apenas visualmente: cliques, rastreamento e links ficam
  desativados dentro do cartão.
- A prévia grande (modal "Visualizar prévia") mostra a mesma renderização em
  tamanho maior, com rolagem, em moldura de celular.

### 2. Página mais bonita

- Cabeçalho da seção com fundo em gradiente suave da identidade EIA Link,
  selo de contagem de modelos e texto mais direto.
- Filtros de nicho em "pílulas" com estado ativo destacado e rolagem horizontal
  suave no mobile.
- Cartões com moldura de celular, sombra em profundidade, brilho sutil no hover,
  leve inclinação 3D ao passar o mouse (desktop) e badge do nicho sobre a prévia.
- Rodapé do cartão reorganizado: nome, descrição curta, "ideal para" como
  etiqueta, e botão principal "Usar este visual" em destaque.
- Estados de carregamento/vazio mais cuidados; tudo mobile-first.

### 3. Parallax — sim, dá para aplicar

Vou aplicar em duas camadas, sem pesar o carregamento:

- Fundo da seção com camadas de brilho que se deslocam em velocidades diferentes
  conforme a rolagem.
- Cartões com deslocamento leve da capa dentro da moldura ao rolar/passar o mouse.

Respeitando `prefers-reduced-motion` (quem desativou animações no aparelho vê a
versão estática) e sem parallax em telas pequenas, onde ele costuma travar.

## Detalhes técnicos

- Novo `src/modules/templates/preview/demoContent.ts`: dados demo por
  `TemplateCategory`/`template.id` no formato `PublicBio` + `PublicLink[]` +
  `CatalogItem[]`.
- Novo `TemplateLivePreview.tsx`: envolve `TemplateRenderer` em um contêiner com
  `transform: scale()` e largura fixa de 390px, `pointer-events: none`,
  `aria-hidden`, `onTrack`/`onShare` como no-ops.
- `TemplateThumbnail.tsx` passa a delegar para `TemplateLivePreview`; os
  componentes de mockup antigos são removidos junto com o CSS órfão.
- `TemplateMarketplace.tsx`: só marcação e classes; nenhuma mudança em navegação,
  `createTemplateInstance` ou no destino `/builder?template=`.
- Estilos novos em `src/styles.css` usando tokens existentes (sem cores fixas);
  parallax via `IntersectionObserver` + `requestAnimationFrame` em um hook
  `useParallax`, com guarda de `prefers-reduced-motion`.
- Sem mudanças em banco, RLS, rotas públicas ou regras de negócio.
