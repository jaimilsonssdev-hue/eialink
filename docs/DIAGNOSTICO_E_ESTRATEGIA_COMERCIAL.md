# 📑 Diagnóstico Técnico & Estratégia Comercial — EIA Link

> **Arquivo de Consulta e Transição de Contexto**  
> *Data:* Novembro/2026 | *Status do Sistema:* Compilado e Operacional em Produção (Vite + Nitro SSR)

---

## 1. 🔍 Diagnóstico Técnico do Sistema (O Que Funciona vs. Pontos de Atenção)

### A. Recursos 100% Funcionais e Validados no Build
* **Criação e Publicação de Páginas/Hubs:** Editor visual, bio links, templates responsivos e rotas públicas (`/p/$slug`).
* **Estúdio Criativo (Studio Pro):** Construtor de landing pages com IA (Google Gemini 3.8 Flash), com blindagem contra estouro de memória no `localStorage` e botão de recuperação em caso de cota excedida.
* **Cardápio Digital & Vitrine:** Carrinho de compras, cálculo de adicionais, frete/taxa e envio de pedido formatado direto para o WhatsApp (0% de comissão).
* **Agenda Online 24/7:** Configuração de serviços, duração, preços, horários de atendimento, agendamento público (`/agendar/$slug`) e painel de remarcação/cancelamento.
* **Módulo Comanda & Gastronomia:** Chamada de garçom com alerta sonoro instantâneo, `/comanda.garcom` com PIN rápido e `/comanda.cozinha` (KDS) em tempo real via tabela `service_requests`.
* **Clube de Fidelidade & Cashback de Balcão:**
  * Modo Pontos Tradicional (R$ 1 = 1 Ponto) com níveis e catálogo de brindes.
  * Modo Cashback em Reais (Circuito Fechado): saldo atrelado ao WhatsApp do cliente para abater na próxima compra, sem necessidade de conciliação bancária ou custódia de valores.
  * Validador de Balcão (`CounterValidationCard`) para operar via WhatsApp do cliente.
* **Tráfego Cruzado Local (Cross-Traffic):** Criação de parcerias mútuas entre empresas vizinhas na rede EIA Link, com exibição de cards bilaterais e contagem de cliques.
* **Gerador de Gabarito de Impressão:** Geração de arte para placas físicas em acrílico 10x15cm / A6 com QR Code HD 600px e temas (Google Clean, Luxury Black, PIX Emerald, Instagram Vibe) com download em PNG 300 DPI e impressão direta.
* **Motor de Prospecção e Demos com IA (Automatizado em 1 Clique):**
  * Varredura unificada por Nicho + Cidade.
  * Integração nativa com o Apify Google Maps Scraper (`compass/crawler-google-places`): extrai de uma só vez Nome, WhatsApp, Endereço, Instagram e até 6 **Fotos Reais em Alta Resolução da Fachada e do Google Maps**.
  * A esteira de geração do site agora consome diretamente as fotos reais já carregadas no lead (`company.photos`), sem exigir que o operador procure ou digite arroba de Instagram manualmente.
  * Fallback gracioso para Jina Maps e Unsplash caso a chave do Apify não esteja configurada.
  * Geração instantânea de demonstração personalizada com resgate via token (`/resgatar?token=...`).

### B. Pontos de Atenção e Pendências Futuras Mapeadas

> 🚨 **AVISO CRÍTICO PARA O DESENVOLVEDOR / PRÓXIMO AGENTE:**  
> **NÃO CRIAR E NÃO CORRIGIR NADA DO GRAVADOR DE PLAQUINHAS AGORA.**  
> O foco atual do projeto é 100% comercial e de vendas. Quando o momento de corrigir chegar, **é estritamente proibido quebrar o restante do sistema** (roteador de links `/r/$code`, tabela de placas já emitidas e páginas públicas).

#### 1. Diagnóstico do Gravador de Plaquinhas NFC (O Que Acontece e Como Corrigir Depois):
* **Sintoma Real:** O usuário tenta gravar a plaquinha física pelo modal e percebe que ela **não salva**.
* **Causa Raiz Técnica:** O modal (`WebNfcWriterModal.tsx`) e o serviço (`WebNfcService.ts`) foram implementados apenas no frontend usando a API Web NFC (`window.NDEFReader.write()`). Ele tenta conversar direto com a antena NFC do hardware do celular para gravar os dados na tag física, mas **não existe uma amarração ponta a ponta com o backend (Supabase)** para persistir o evento, atualizar o status da placa na tabela `dynamic_links` ou salvar o vínculo de gravação confirmada.
* **Plano de Correção Futuro (Blindado contra Quebras):**
  1. **NÃO alterar a rota `/r/$code` nem o `DynamicLinkService.resolve()`**: o redirecionamento dos links já criados e dos QR Codes impressos está perfeito e deve continuar intacto.
  2. **Criar uma Server Function isolada no backend** (ex: `recordNfcPlaqueWriteFn` em `src/modules/nfc/nfc.functions.ts`): esta função será chamada após o evento de sucesso de gravação física para registrar no banco a data de gravação, o ID do operador e o status `active`/`written`.
  3. **Adicionar tratamento de compatibilidade no client:** Caso o dispositivo não suporte Web NFC (ex: iPhone/Safari ou desktops), manter a interface amigável informando que a gravação direta por navegador exige Chrome no Android ou aplicativo gravador padrão (NFC Tools), sem travar a tela.

#### 2. Chatbot Web vs. Bot WhatsApp Nativo:
* O `AiAssistantChat` é um assistente de triagem que roda **dentro da página web** do cliente e entrega o lead qualificado no WhatsApp via link `wa.me`. Não é uma automação passiva operando via webhook de WhatsApp (Evolution API / Meta Cloud API). A venda deve focar no "Funil de Triagem Inteligente".

#### 3. Google Agenda (OAuth2):
* O fluxo de código está pronto, mas exige credenciais ativas de `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configuradas no Google Cloud Console com o redirect autorizado.

---

## 2. 🏷️ O Mecanismo Único de Vendas

* **Nome Comercial:** **"Circuito Phygital de Retenção Local" (CPRL)** ou **"Sistema de Balcão Conectado"**.
* **O Inimigo Comum:**
  * A "Agência do Canva" (que cobra R$ 1.500/mês para postar imagens estáticas que não trazem ninguém ao balcão).
  * O "Site Cemitério" (WordPress de R$ 2.000 que ninguém acessa).
  * O "Mercado de Pedágio" (iFood e marketplaces cobrando 25% a 27% por pedido).
* **A Diferenciação:** O EIA Link conecta a presença física (o cliente que já está na loja ou no balcão) diretamente com o algoritmo do Google (avaliações 5 estrelas) e com o WhatsApp, criando um ciclo contínuo onde quem consome no balcão atrai os próximos clientes de graça.

---

## 3. 💎 A Proposta Única de Valor (PUV)

### PUV Central:
> **"Nós transformamos o balcão físico e o Instagram da sua empresa em uma máquina automática de agendamentos e vendas no WhatsApp — sem você precisar pagar mensalidade para agência, gravar dancinhas ou perder margem com comissões."**

### Variações por Nicho:
* **Clínicas / Consultórios / Estética:** *"Recepção digital 24/7 com agendamento direto na sua Google Agenda e acelerador de avaliações 5 estrelas para colocar sua clínica no topo das buscas da cidade."*
* **Gastronomia / Bares / Restaurantes:** *"Cardápio digital próprio e comanda na mesa com 0% de comissão, chamador de garçom e cashback de retorno para o cliente voltar todo mês."*
* **Serviços Locais / Lojas:** *"Vitrine ultra-rápida no WhatsApp com triagem automática de orçamentos e parceria de tráfego cruzado com comércios vizinhos."*

---

## 4. 💰 Pacotes e Ofertas Comerciais Prontas

1. **Kit de Balcão 5 Estrelas (Oferta de Entrada - R$ 197 a R$ 350):**  
   Plaquinhas físicas em acrílico com NFC e QR Code direcionando para avaliação instantânea no Google Maps.
2. **Plataforma EIA Link Pro (Recorrência SaaS - R$ 29 a R$ 49/mês):**  
   Site oficial, agendamento online 24h, cardápio digital, clube de cashback e links dinâmicos sem marca d'água.
3. **Setup de Presença de Ouro (Serviço de Implantação - R$ 600 a R$ 1.500):**  
   Otimização do Google Meu Negócio, subida do site no EIA Link, configuração de fotos, catálogo e plaquinhas.
4. **Gestão de Tráfego Pago Local (R$ 400 a R$ 800/mês):**  
   Anúncios no Google Ads e Meta Ads direcionando o raio da cidade para o WhatsApp do cliente.

---

## 5. 🎤 Script do "Cavalo de Troia" (Abordagem de 30 Segundos)

> *"Olá [Nome do Proprietário]! Tudo bem?*  
> *Eu vi que a sua empresa tem um trabalho incrível aqui na nossa cidade, mas notei que vocês ainda têm poucas avaliações no Google em relação à qualidade do serviço de vocês.*  
> 
> *A gente desenvolveu uma solução local que coloca uma plaquinha inteligente no seu balcão: o cliente encosta o celular e avalia sua empresa com 5 estrelas em 3 segundos, além de ter um site que agenda horários e tira dúvidas sozinho pelo WhatsApp até de madrugada.*  
> 
> *Eu tomei a liberdade de gerar uma **demonstração gratuita já com a logo e os serviços da sua empresa** para você ver como funciona na prática.*  
> *Posso te enviar o link de teste aqui para você dar uma olhada no celular? Leva 15 segundos."*

