# RFC-012 — Eialink Essencial e Eialink Pro

## Decisão

O Eialink passa a ter dois níveis comerciais. **Eialink Essencial** é gratuito e permite publicar uma página bonita com foto, nome, descrição, WhatsApp, até quatro links e um único visual gratuito.

**Eialink Pro** custa R$ 19,90 mensais ou R$ 197 anuais e libera todos os visuais, catálogo, analytics, personalização avançada e remoção da marca Eialink.

O serviço **Site Profissional** não tem preço automático: abre o WhatsApp comercial da Talento para uma proposta.

## Fonte de verdade e limites

`plans` armazena nome, preço, limites e recursos; `subscriptions` armazena o plano atual do usuário. `BillingService.getCurrentAccess()` é a fonte de verdade do cliente e os triggers de banco na migration aplicam os limites em `bio_pages`, `bio_links` e `catalog_items` para impedir bypass pela interface.

Os limites ficam no JSON `plans.limits`; recursos em `plans.features`. A interface usa `usePlanAccess()` e mostra um convite de upgrade sem remover dados ao ocorrer downgrade.

## Migração

Execute `supabase/migrations/20260811090000_freemium_essential_and_pro.sql` pelo fluxo de migrations do Lovable/Supabase. Ela é aditiva, não apaga dados e converte o plano grátis em Essencial, cria/atualiza o Pro mensal e anual, preserva contas existentes no Pro, atribui Essencial a novos cadastros e cria bloqueios de banco e eventos de funil.

Reversão comercial: um Super Admin pode alterar manualmente a assinatura de uma conta para Essencial ou Pro. Não apague esta migration nem aplique em ordem inversa em produção; se houver reversão técnica, desative os triggers e restaure os valores dos planos antes de remover regras.

## Operação pelo Super Admin

Em `/admin`, um administrador altera plano, status e limites. O preço e a descrição atualizam a landing. Nesta fase, o CTA do Pro abre o WhatsApp comercial. Um gateway pode substituir esse CTA depois, sem mudar as regras de acesso.

O número comercial é lido de `VITE_COMMERCIAL_WHATSAPP`, no formato internacional e somente com dígitos (ex.: `5573...`). Se a variável não estiver definida, `src/modules/billing/components/UpgradePrompt.tsx` usa o número legado como fallback para não interromper os CTAs atuais. Confirme o valor do ambiente antes de publicar.

## Deliberadamente fora desta etapa

- checkout e recorrência automáticos;
- cobranças, nota fiscal e cancelamento automatizados;
- e-mails ou automações de marketing;
- exclusão automática de catálogo após downgrade.
