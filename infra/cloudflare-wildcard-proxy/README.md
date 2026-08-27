# Subdomínios wildcard (`cliente01.eialink.com.br`)

A hospedagem da Lovable não provisiona wildcard de domínio: cada domínio precisa
ser conectado manualmente. Para ter subdomínio automático por cliente, o tráfego
do domínio passa a entrar por um Cloudflare Worker que reescreve o host em rota.

```
cliente01.eialink.com.br/  ->  https://eialink.com.br/p/cliente01
```

A aplicação **não muda**: a bio continua sendo servida por `/p/$slug`, com o
`canonical` apontando para `https://eialink.com.br/p/<slug>` (evita conteúdo
duplicado no Google).

## Passos

1. Mova o DNS de `eialink.com.br` para a Cloudflare (nameservers da Cloudflare).
2. Mantenha `eialink.com.br` e `www` conectados na Lovable, em **modo proxy**
   (Project Settings → Domains → Advanced → "Domain uses Cloudflare or a similar proxy").
3. Na Cloudflare, crie o registro wildcard:
   - Tipo `CNAME`, Nome `*`, Conteúdo `eialink.com.br`, **Proxied (nuvem laranja)**.
4. Ative **Total TLS** / certificado wildcard (SSL/TLS → Edge Certificates) para
   cobrir `*.eialink.com.br`.
5. Publique o Worker deste diretório e adicione a rota:
   - `*.eialink.com.br/*` → este Worker.

```bash
npx wrangler deploy infra/cloudflare-wildcard-proxy/worker.js --name eialink-subdomains
```

## Regras aplicadas pelo Worker

- Apenas o caminho `/` do subdomínio vira a bio; assets, `/api/*` e demais rotas
  seguem para a origem sem alteração.
- Subdomínios reservados (`www`, `app`, `admin`, `api`, ...) não viram slug.
- Slug inválido cai na rota normal (o app responde 404 da própria bio).

## Ao criar a conta

O slug escolhido no cadastro já é o endereço final:
`https://<slug>.eialink.com.br`. Não é preciso nenhum provisionamento por
cliente — o wildcard cobre todos automaticamente.
