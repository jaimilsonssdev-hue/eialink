# Auditor de Prospecção com IA (AI SDR) & Proteção de Credenciais

Implementamos com sucesso o **Auditor de Prospecção Comercial com IA (AI SDR)** para analisar empresas locais do Google Maps e gerar diagnósticos comerciais e pitches consultivos de alto impacto, utilizando a **API gratuita do Google Gemini** com **modo duplo resiliente (fallback local)** e **proteção rigorosa de senhas e credenciais**.

---

## 🚀 Principais Entregas

### 1. Motor de Auditoria Comercial (`GeminiAuditorService.ts`)
Localizado em `src/modules/prospecting/GeminiAuditorService.ts`:
- **Dual-Mode Transparente**:
  - **Modo IA Nuvem**: Se o usuário fornecer uma chave do Google Gemini, o motor se conecta diretamente aos modelos **Gemini 1.5 Flash** e **Gemini 2.0 Flash** no Google AI Studio (100% gratuitos, até 1.500 requisições/dia).
  - **Modo Heurístico Inteligente (Fallback 5ms)**: Se nenhuma chave estiver configurada ou a rede oscilar, o sistema executa um diagnóstico comercial local instantâneo com base na nota, avaliações, presença de site, canal de WhatsApp e Instagram da empresa. O usuário **nunca vê tela de erro**.
- **Diagnóstico Estruturado**:
  - **Pontos Fortes**: Reputação real no Google Maps, canal direto de atendimento, presença social.
  - **Gargalos de Venda**: Ausência de site oficial mobile, perda de clientes que pesquisam no celular, falta de agendamento automático 24h no WhatsApp.
  - **Resumo Executivo**: Diagnóstico em 2 frases para leitura rápida.
  - **Pitch Consultivo**: Mensagem personalizada, respeitosa e orientada a valor para WhatsApp ou Instagram Direct, já com o link demonstrativo inserido quando disponível.

---

### 2. Modal Interativo de Auditoria (`ProspectAuditorModal.tsx`)
Localizado em `src/components/prospecting/ProspectAuditorModal.tsx`:
- **Acesso em 1 Clique**:
  - Botão **"Auditoria IA"** presente nos cards do Google Maps (Live Search), na tabela do Pipeline de Prospecção e na aba de Demos Gerados.
- **Visual Moderno e Responsivo**:
  - Badges de nota, total de avaliações, status de site e telefone.
  - Cards verdes para **Pontos Fortes**.
  - Cards âmbar/vermelhos para **Gargalos de Venda**.
  - Área de texto para o **Pitch Consultivo** (100% editável antes de enviar).
- **Ações Rápidas**:
  - 📲 **Enviar no WhatsApp**: Abre diretamente o WhatsApp Web/App com a mensagem pronta.
  - 📋 **Copiar Pitch**: Copia o texto do pitch com feedback visual imediato.
  - 📄 **Copiar Diagnóstico**: Copia o relatório completo com forças, fraquezas e pitch para anotações em CRM.
  - 🔄 **Reanalisar**: Permite regenerar a auditoria em tempo real.
  - ⚙️ **Configurar Chave**: Atalho para gerenciar a chave gratuita do Gemini.

---

### 3. Gerenciamento Seguro da Chave Gemini (`CopyConfigModal.tsx`)
Localizado em `src/components/prospecting/CopyConfigModal.tsx`:
- Adicionada a aba **"🤖 IA Gemini"** na central de configurações.
- **Passo a Passo Guiado**: Link direto para `https://aistudio.google.com/app/apikey` com instruções de como gerar a chave gratuita em 30 segundos.
- **Campo Mascarado**: Entrada protegida com `type="password"` e alternador de visibilidade (ícone de olho).
- **Teste de Conexão em Tempo Real**: Botão "Testar Conexão" que valida a chave com chamada leve na API do Google antes de salvar.

---

### 4. Processo de QA e Segurança de Credenciais
Seguindo os padrões rígidos de qualidade solicitados:
- **Proteção no Git**: Arquivo `.gitignore` atualizado para bloquear `.env`, `.env.*`, `*.env`, `*.env.local` e `.dev.vars.*`.
- **Armazenamento Seguro no Cliente**: A chave do Gemini é gravada apenas no `localStorage` do navegador do operador (`eialink_gemini_api_key`). **NUNCA** é enviada aos nossos servidores, **NUNCA** trafega em logs de backend e **NUNCA** é versionada no Git.
- **Garantia de Não Exposição**: Nenhuma chave foi solicitada ou inserida no chat.
- **Verificação de Contratos Supabase**: `npm run types:verify` executado com sucesso (`Supabase type contracts verified`).
- **Validação Sintática**: Balanceamento léxico e JSX 100% íntegro (`curly=0, paren=0, square=0`).

---

### 5. Extração e Links Diretos de WhatsApp
- **Extração Precisa**: Suporte a DDDs de 2 dígitos e números de 8 ou 9 dígitos no Brasil (`scoring.ts` com `extractBrazilianPhone` e `formatPhone`).
- **Link Direto na Lista**: Link clicável do WhatsApp logo abaixo do nome da empresa em todas as tabelas para facilitar a abordagem no celular.
- **Sincronização de Contato**: Ao gerar ou regenerar uma demonstração para um lead, o WhatsApp da página é automaticamente salvo no cadastro da empresa no radar.

---

## 📦 Histórico de Commits

- `370e93f`: *feat(prospecting): WhatsApp extraction, mobile 1-tap link, and demo phone synchronization*
- `c7e576b`: *feat(prospecting): AI SDR auditor with free Gemini API, local dual-mode fallback, and protected credentials*

