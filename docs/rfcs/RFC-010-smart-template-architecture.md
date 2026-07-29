# RFC-010 — Smart Template Architecture

## Conceitos

`TemplateDefinition` descreve identidade, layout e, quando presente, uma `SmartTemplateDefinition`. A definiÃ§Ã£o Ã© imutÃ¡vel e nunca recebe dados do cliente.

`BlockDefinition` descreve um bloco permitido: ordem, obrigatoriedade, visibilidade, reordenaÃ§Ã£o, variantes e restriÃ§Ã£o de nicho. `SmartBlockRegistry` filtra blocos incoerentes antes da interface os utilizar.

`TemplateInstance` representa a personalizaÃ§Ã£o local de uma pÃ¡gina: blocos ativos, ordem, visibilidade e preferÃªncias. Nesta Sprint ela nÃ£o Ã© persistida, pois o banco e os contratos existentes permanecem inalterados.

## RenderizaÃ§Ã£o

`TemplateRenderer` continua sendo o Ãºnico ponto de renderizaÃ§Ã£o. Quando um template possui `smart`, ele delega Ã  `SmartTemplateRegistry`; templates legados seguem pelo `LayoutResolver` existente. NÃ£o hÃ¡ condicionais por ID no renderer.

## Nichos iniciais

Restaurante usa hero fotogrÃ¡fico, perfil integrado, cardÃ¡pio e delivery. ClÃ­nica usa hero institucional, perfil de confianÃ§a, especialidades e agendamento. Loja usa hero promocional, marca e vitrine. Todos usam somente os dados jÃ¡ existentes; blocos que exigem dados inexistentes sÃ£o definidos, mas omitidos da pÃ¡gina real.

## ExtensÃ£o

Um novo nicho deve registrar sua `SmartTemplateDefinition`, composiÃ§Ã£o no `SmartTemplateRegistry` e blocos permitidos. Ele nÃ£o exige alteraÃ§Ã£o no renderer, banco ou componentes de outros nichos.
