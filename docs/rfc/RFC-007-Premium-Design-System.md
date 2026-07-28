# RFC-007 — Premium Design System

## Objetivo

Padronizar a identidade visual da EIA Digital em uma linguagem SaaS: superfÃ­cies discretas, hierarquia tipogrÃ¡fica clara, contraste acessÃ­vel e movimento curto.

## Tokens e componentes

Os tokens globais ficam em `src/styles.css`: cores semÃ¢nticas, raios, elevaÃ§Ã£o, espaÃ§amento, tipografia, breakpoints e estados de foco. `btn-*`, `card-*`, `input-base`, `template-gallery-card` e `growth-suggestion-card` sÃ£o blocos reutilizÃ¡veis.

## Templates e nichos

Cada template define tema, layout, variantes e metadados de apresentaÃ§Ã£o. A miniatura Ã© gerada por `TemplateThumbnail`, sem imagem genÃ©rica e sem nova fonte de dados. Variantes continuam sendo aplicadas pelo `ComponentVariantRegistry`.

## Growth

`GrowthSuggestionCard` Ã© somente um componente visual. Recebe tipo de negÃ³cio, aÃ§Ã£o e quantidade para sugerir prÃ³ximos passos; nÃ£o bloqueia, nÃ£o mede uso e nÃ£o implementa monetizaÃ§Ã£o.

## Limites

NÃ£o houve alteraÃ§Ã£o em banco, APIs, regras de produto ou persistÃªncia. Componentes especÃ­ficos de nicho permanecem uma extensÃ£o futura, quando houver dados e fluxos reais para sustentÃ¡-los.
