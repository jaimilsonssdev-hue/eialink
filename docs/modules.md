# Módulos

| Módulo | Responsabilidade | Dados | Pode alterar | Rotas | Service | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Page | Página, perfil, aparência, links e mídia | `bio_pages`, `bio_links`, Storage | Página e links | `/builder`, `/p/$slug` | `PageService` | Parcial: builder ainda é legado direto |
| Templates | Aparência | Nenhum persistido | Nenhum | Marketplace no dashboard | — | Contrato criado |
| Products | Catálogo | Nenhum | Nenhum | — | — | Contrato criado |
| Analytics | Leitura de métricas | `analytics_events` | Nenhum conteúdo | `/analytics` | `AnalyticsService` | Em uso |
| Growth | Recomendações | Estático | Nenhum | `/growth` | — | Isolado |
| Settings | Conta | `profiles` | Perfil | `/settings` | `SettingsService` | Parcial: rota legada direta |
