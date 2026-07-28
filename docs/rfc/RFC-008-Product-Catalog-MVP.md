# RFC-008 — Product Catalog MVP

## Estrutura

`catalog_items` Ã© uma tabela Ãºnica, relacionada a `bio_pages`, que diferencia itens por `type` (`product` ou `service`). Ela armazena descriÃ§Ã£o, preÃ§o opcional, imagem, botÃ£o, posiÃ§Ã£o e visibilidade.

## Fluxo

O Builder carrega e salva o catÃ¡logo por `ProductService`. O mesmo estado local alimenta o preview. A pÃ¡gina pÃºblica busca somente itens ativos e os entrega ao `CatalogSection` como conteÃºdo suplementar do `TemplateRenderer`; assim nenhum template precisa conhecer regras de produtos.

## SeguranÃ§a

A migration habilita RLS: o proprietÃ¡rio da `bio_page` gerencia seus itens e visitantes anÃ´nimos leem apenas itens ativos de pÃ¡ginas publicadas.

## Limites

NÃ£o hÃ¡ limite gratuito nesta Sprint. A prÃ³xima Sprint pode interceptar a quinta inclusÃ£o antes de alterar o estado e apresentar a Growth Engine.

## DÃ­vida tÃ©cnica

Os tipos gerados do Supabase precisam ser regenerados depois de aplicar a migration no ambiente remoto. Enquanto isso, `ProductService` usa um adaptador local de compatibilidade, sem vazar `any` para os componentes.
