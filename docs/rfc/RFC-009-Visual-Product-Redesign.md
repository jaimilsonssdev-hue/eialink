# RFC-009 — Visual Product Redesign

## DireÃ§Ã£o

A experiÃªncia pÃºblica usa um sistema editorial leve: hero de maior presenÃ§a, perfil sobreposto, hierarquia tipogrÃ¡fica compacta e superfÃ­cies translÃºcidas. A fonte de interface Ã© Manrope, com DM Sans para tÃ­tulos, sempre com fallbacks do sistema.

## Templates e preview

`TemplateRenderer` continua genÃ©rico. Ele aplica tokens de tema como propriedades CSS e o mesmo renderer Ã© usado pelo preview e pela rota pÃºblica. NÃ£o hÃ¡ ramificaÃ§Ã£o por ID de template.

## CatÃ¡logo

`CatalogSection` recebeu cards responsivos: produtos em grade e serviÃ§os em apresentaÃ§Ã£o horizontal, com imagem, fallback, tipo, preÃ§o e CTA. O carregamento de imagens permanece lazy.

## Limites

Componentes de nicho que exigem dados (horÃ¡rio, equipe, depoimentos, agenda) continuam fora da persistÃªncia atual e devem ser adicionados quando houver um contrato de dados real.
