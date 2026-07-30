# RFC-011 — Planos SaaS e Super Admin

## Objetivo

Adicionar uma fundação segura para monetização do EIA Link sem alterar as
BioLinks existentes. O produto continua simples: a conta escolhe uma presença
digital e publica conteúdo; planos definem somente limites e permissões.

## Fonte de verdade

- `plans`: catálogo central de planos, preço, limites e recursos.
- `subscriptions`: uma assinatura atual por conta (`user_id`).
- `professional_services`: serviços que podem ser oferecidos no crescimento.
- `admin_audit_logs`: trilha de operações administrativas.
- `bio_pages.whatsapp_message`: mensagem inicial específica de cada BioLink.

O papel existente `user_roles.role = 'admin'` é o Super Admin. A tela
`/admin` continua protegida na rota e as tabelas possuem RLS: usuários só
leem sua própria assinatura; apenas administradores criam, editam ou removem
planos, assinaturas e serviços.

## Limites iniciais

| Plano | BioLinks | Links | Itens de catálogo | Templates |
| --- | ---: | ---: | ---: | ---: |
| Grátis | 1 | 5 | 3 | 1 |
| Pro | 3 | 30 | 100 | todos |
| Catálogo | 5 | 50 | 250 | todos |

O valor `-1` representa limite ilimitado. A migration cria uma assinatura
Grátis para perfis existentes e para novos perfis após o cadastro.

## Fase atual e próxima fase

Esta fase cria o contrato, RLS, dados iniciais e a operação manual no Super
Admin. A cobrança real (checkout, webhooks e invoices) deve ser implementada
em uma fase posterior usando um provedor de pagamentos; nunca pelo navegador.
Antes de bloquear uma ação no cliente, a próxima fase deve validar o limite no
servidor/RPC para impedir bypass pelo DevTools.
