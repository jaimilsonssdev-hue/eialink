# Diretriz para Adição de Componentes Visuais (shadcn/ui)

Sempre que o usuário solicitar um componente visual (como botões, carrosséis, modais, drawers, tabs, cards, tabelas, efeitos visuais ou animações):

1. **Execução Automática via CLI**: Execute diretamente no terminal o comando nativo:
   ```bash
   npx shadcn@latest add <componente> -y
   ```
   *(ou `npx shadcn@latest add <url-do-registro> -y` para registries open-source como Magic UI, Aceternity ou 21st.dev)*.

2. **Injeção Direta da Nuvem**: O CLI busca e injeta o código TypeScript/Tailwind automaticamente na pasta `@/components/ui`, instalando dependências necessárias sem exigir que o usuário precise baixar ou copiar nada manualmente.

3. **Integração Imediata**: Utilize o componente importando de `@/components/ui/<nome-do-componente>` no layout ou página indicada.

# Regra Inviolável de Inteligência Artificial (Google AI Studio / Gemini)

1. **Modelos Oficiais Permitidos e Obrigatórios**:
   - **Modelo Principal**: `gemini-3.8-flash` (sempre a primeira opção em qualquer geração, briefing, copiloto, auditoria ou análise).
   - **Modelo de Fallback / Alta Velocidade**: `gemini-3.5-flash-lite` (e opcionalmente `gemini-3.5-flash`).
   - Se o projeto do usuário tiver autorização para modelos legados, `gemini-2.5-flash` pode atuar apenas como terceiro nível de contingência.

2. **Modelos Terminantemente Proibidos (Proibição Absoluta)**:
   - **NUNCA** utilizar `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`, `gemini-1.0` ou suas variantes. Eles foram descontinuados pela Google na API `v1beta` e causam erro imediato `HTTP 404 - NOT_FOUND`.
   - **NUNCA** regredir código para chamar a série 1.5 ou colocar 1.5 como fallback.

3. **Descoberta Dinâmica de Modelos (`getAvailableGeminiModels`)**:
   - Sempre que possível, utilize `getAvailableGeminiModels(apiKey)` de `@/modules/ai/google-ai.service`, pois ele consulta a API `ListModels` em tempo real para obter os modelos ativos e autorizados para a chave do usuário, garantindo 100% de compatibilidade sem risco de 404.
