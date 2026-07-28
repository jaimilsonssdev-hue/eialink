# Arquitetura modular

## Visão geral

Os módulos vivem em `src/modules`. A interface mantém as rotas atuais; Services concentram acesso por domínio sem mudar contratos, banco ou experiência.

## Módulos e responsabilidades

- **page**: `bio_pages`, `bio_links`, mídia e composição da página pública.
- **templates**: contrato de aparência, sem alterar conteúdo do negócio.
- **products**: contrato futuro de catálogo, isolado de perfil e métricas.
- **analytics**: leitura administrativa e registro de eventos, sem alterar conteúdo.
- **growth**: recomendações e CTAs, sem mutações silenciosas.
- **settings**: perfil da conta e preferências gerais.

## Fontes de verdade e fluxo

`bio_pages` é a fonte de perfil, aparência, avatar, capa, WhatsApp e Pix. `bio_links` é a fonte de links. A página pública e o preview compõem esses mesmos dados. `page_blocks` é legado suplementar: não tem prioridade sobre `bio_pages`. Templates, produtos e template ativo não possuem persistência nesta versão. `analytics_events` é a fonte de métricas.

## Dependências

Módulos não importam componentes internos de outros módulos. Dependências permitidas são Types públicos e Services do próprio domínio. São proibidos imports de UI privada entre módulos e Analytics/Growth alterarem Page. Não há imports circulares identificados.

## Acesso ao Supabase

`PageService` centraliza leitura de página e Storage; `AnalyticsService` centraliza a consulta de eventos; `SettingsService` centraliza perfil. Acessos ainda diretos em `builder`, `settings`, `dashboard`, `requests`, `admin`, autenticação e página pública são legados auditados. Os de autenticação e infraestrutura são corretos; `builder`, `settings` e dashboard são dívida de migração para Services, pois ainda contêm queries/mutations de domínio.

## Contratos públicos e dívida técnica

Os Types explícitos ficam em cada `types/index.ts`. Não foram criados diretórios vazios de `components`, `hooks` ou `utils`: eles serão criados apenas quando houver código real. A arquitetura está **pronta com ressalvas** para Templates: o módulo pode evoluir visualmente, mas aplicação persistente de template exige um contrato de aparência persistido no futuro.
