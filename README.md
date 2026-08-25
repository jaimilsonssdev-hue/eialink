# Eialink

Plataforma brasileira de BioLinks e mini-catálogos para negócios locais e profissionais. O plano Essencial publica uma presença simples gratuitamente e o Pro libera catálogo, analytics, visuais premium e personalização avançada.

## Stack

- TanStack Start, React e TypeScript
- Tailwind CSS
- Supabase (autenticação, banco e analytics)
- Stripe (infraestrutura disponível para cobrança)
- Lovable (sincronização e publicação)

## Desenvolvimento local

O repositório usa Bun e mantém `bun.lock` como lockfile.

```sh
bun install
bun run dev
```

Antes de abrir um PR:

```sh
bun run lint
bun run build
```

## Configuração

Credenciais devem permanecer fora do Git. O WhatsApp comercial pode ser configurado com:

```sh
VITE_COMMERCIAL_WHATSAPP=5573999999999
```

Use somente dígitos, incluindo código do país e DDD. Sem essa variável, a aplicação mantém o número legado para preservar o funcionamento atual.

## Planos e operação

A decisão comercial está em [`docs/rfc/RFC-012-Freemium-Essential-Pro.md`](docs/rfc/RFC-012-Freemium-Essential-Pro.md).

Ao alterar planos ou regras de acesso:

1. atualize a migration correspondente;
2. sincronize os tipos do Supabase;
3. valide cadastro, publicação, downgrade e upgrade;
4. teste os CTAs de WhatsApp e Pix em celular;
5. confirme o recebimento dos eventos do funil.

## Publicação

Commits enviados ao GitHub sincronizam com o projeto conectado no Lovable. Não reescreva o histórico publicado e não faça force push.
