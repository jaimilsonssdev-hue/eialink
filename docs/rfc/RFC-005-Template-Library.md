# RFC-005 — Biblioteca de templates e variaÃ§Ãµes visuais

## DecisÃ£o

A biblioteca registra definiÃ§Ãµes estÃ¡ticas no `templateManifest`. Cada definiÃ§Ã£o possui categoria tipada, tema, layout, componentes compatÃ­veis e variantes de componente. O `TemplateRegistry` Ã© a Ãºnica porta de registro e rejeita IDs ou slugs duplicados.

## Fluxo

1. `TemplateService` consulta o registro.
2. O editor usa a definiÃ§Ã£o apenas para preview e persistÃªncia do `template_id` jÃ¡ existente.
3. `TemplateEngine` cria um modelo imutÃ¡vel, sem permitir acesso do template aos dados da Bio.
4. `LayoutResolver` aplica a ordem do layout e consulta `ComponentVariantRegistry` para a classe visual de cada componente.
5. `TemplateRenderer` continua sendo o Ãºnico compositor de `PageData` e nÃ£o conhece templates concretos.

## Limites

NÃ£o houve migraÃ§Ã£o, alteraÃ§Ã£o de RLS, API, autenticaÃ§Ã£o ou novo campo persistido. A personalizaÃ§Ã£o se limita a temas, layouts e variantes existentes. Recursos como produtos, galeria e regras de elegibilidade continuam fora do escopo.

## Adicionando um template

Adicionar uma definiÃ§Ã£o compatÃ­vel em `src/modules/templates/manifest/templateManifest.ts`, usando um layout e variantes previamente registrados. Nenhuma alteraÃ§Ã£o no renderer ou no banco Ã© necessÃ¡ria.
