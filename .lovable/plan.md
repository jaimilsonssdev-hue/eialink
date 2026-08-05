# Novo favicon + otimização de SEO

## 1. Favicon com a logo EIA Link

Hoje o site ainda serve o `favicon.ico` padrão da Lovable, enquanto a logo criada
para o projeto (círculo roxo/magenta com o monograma de elos) já existe em
`public/icons/eia-link-icon.svg`.

- Copiar a logo para `public/favicon.svg` e gerar uma versão PNG 64x64
  (`public/favicon.png`) para navegadores que não leem SVG.
- Trocar o `links` do `__root.tsx`: `icon` apontando para `/favicon.svg` e
  `/favicon.png`, mantendo o `apple-touch-icon` da logo.
- Remover o `public/favicon.ico` antigo para não servir o ícone genérico a
  crawlers que ignoram a tag `<link>`.

## 2. SEO

Correções pontuais no que hoje está incompleto:

- **Home (`/`)**: título/descrição existem, mas faltam `og:title`,
  `og:description`, `og:type`, `og:url`, `twitter:*`, `canonical` e JSON-LD.
  Adicionar tudo, com título até 60 caracteres e descrição até 160.
- **Canonical + og:url** em todas as rotas públicas (`/`, `/privacy`, `/terms`,
  `/refund-policy`) apontando para elas mesmas em `https://eialink.com.br`.
- **Página pública de bio (`/p/$slug`)**: garantir título, descrição e og:image
  a partir dos dados da página, mais canonical próprio e JSON-LD de
  `LocalBusiness`/`ProfilePage`.
- **`__root.tsx`**: manter só defaults sitewide (viewport, og:site_name,
  JSON-LD de Organization) e tirar dele o og:image de screenshot temporário,
  que hoje vira preview de todas as páginas.
- **robots.txt**: adicionar a linha `Sitemap: https://eialink.com.br/sitemap.xml`.
- **sitemap.xml**: incluir as páginas públicas de bio publicadas (`/p/{slug}`),
  além das rotas estáticas atuais, e remover `/auth` (é `noindex`).
- **Acessibilidade/semântica**: conferir H1 único e `alt` nas imagens da landing.

## Detalhes técnicos

- Metadados via `head()` de cada `createFileRoute`; `canonical` apenas nas
  rotas folha (o root concatena links e duplicaria a tag).
- Sitemap de bios: consulta `bio_pages` com `published = true` no handler já
  existente em `src/routes/sitemap[.]xml.ts`, com cache de 1 hora.
- Nenhuma regra de negócio, schema ou RLS é alterada.

Depois de aplicar, é preciso publicar para o Google enxergar as mudanças.
