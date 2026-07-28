# Arquitetura modular

`page` concentra perfil, aparência, contato e links; `templates` somente aparência; `products` somente catálogo; `analytics` somente leitura; `growth` recomendações; `settings` conta e preferências.

As telas chamam Services, que são a única camada com acesso ao Supabase para cada domínio. A página pública compõe `bio_pages` (dados globais) e `bio_links` (links); `page_blocks` permanece apenas como estrutura suplementar legada e não substitui dados globais.

Cada módulo possui pastas `components`, `hooks`, `services`, `types` e `utils`. Pastas sem implementação nesta fase permanecem como pontos de extensão, sem alterar contratos ou banco.
