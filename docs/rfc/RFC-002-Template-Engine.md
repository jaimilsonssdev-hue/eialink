# RFC-002: Template Engine

## Objetivo

Disponibilizar contratos reutilizáveis para separar conteúdo de aparência. A Engine recebe `PageData` e `TemplateDefinition` e retorna `TemplateRenderModel` imutável.

## Arquitetura

`TemplateRegistry` registra e valida definições; `TemplateEngine` produz o modelo; `TemplateService` expõe listagem, fallback e renderização; hooks reutilizam o Service. Themes contêm somente tokens. Templates contêm layout e componentes, nunca conteúdo.

## Limitações e roadmap

Nesta Sprint não há persistência, editor, preview ou página pública integrados. A Sprint 03 adicionará `template_id`, seleção e o renderer compartilhado, mantendo `PageData` intacto.
