# RFC-003: Template Integration

O Builder mantém um template em preview local. Cancelar restaura o template persistido; aplicar o inclui no estado de página e o salvamento existente persiste somente `bio_pages.template_id`. O `TemplateRenderer` é compartilhado por preview e página pública e usa o Registry com fallback padrão. Conteúdo continua em `bio_pages` e `bio_links`.

Limitação: a seleção atual usa templates registrados localmente; catálogo remoto e versões de template serão tratados em Sprint 04.
