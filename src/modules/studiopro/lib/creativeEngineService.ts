import { GoogleGenAI } from "@google/genai";
import { getResolvedGeminiKeyFn } from "@/modules/ai/gemini-admin.functions";
import { getAvailableGeminiModels } from "@/modules/ai/google-ai.service";

export interface MultimodalAttachment {
  name: string;
  mimeType: string;
  dataBase64: string; // base64 puro sem data:...;base64,
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: MultimodalAttachment[];
}

export interface GenerationStep {
  step: "briefing" | "planning" | "generating" | "complete" | "error";
  message: string;
}

export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    const localKey =
      localStorage.getItem("eialink_gemini_api_key") ||
      localStorage.getItem("openpage-gemini-key") ||
      localStorage.getItem("gemini_api_key");
    if (localKey && localKey.trim().length > 10) return localKey.trim();
  }

  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 10) return envKey.trim();
  }

  return "";
}

import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a chave de forma assíncrona, sincronizando do Supabase (user_metadata)
 * caso o navegador/dispositivo ainda não a tenha em cache local.
 */
export async function resolveCreativeStudioApiKeyAsync(customKey?: string): Promise<string> {
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }

  const local = getGeminiApiKey();
  if (local) return local;

  // 1. Tenta recuperar dos metadados do usuário logado no Supabase (sincronização Desktop <-> Mobile)
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userKey = userData?.user?.user_metadata?.gemini_api_key;
    if (userKey && typeof userKey === "string" && userKey.trim().length > 10) {
      const clean = userKey.trim();
      if (typeof window !== "undefined") {
        localStorage.setItem("eialink_gemini_api_key", clean);
        localStorage.setItem("openpage-gemini-key", clean);
      }
      return clean;
    }
  } catch (authErr) {
    console.warn("[CreativeEngine] Não foi possível obter chave via auth metadata:", authErr);
  }

  // 2. Busca a chave salva pelo endpoint do servidor
  try {
    const remote = await getResolvedGeminiKeyFn();
    if (remote?.apiKey && remote.apiKey.trim().length > 10) {
      const clean = remote.apiKey.trim();
      if (typeof window !== "undefined") {
        localStorage.setItem("eialink_gemini_api_key", clean);
        localStorage.setItem("openpage-gemini-key", clean);
      }
      return clean;
    }
  } catch (err) {
    console.warn("[CreativeEngine] Falha ao sincronizar chave remota do servidor:", err);
  }

  throw new Error(
    "Chave da API do Google AI Studio não encontrada. Configure sua chave no painel de Configurações.",
  );
}

/**
 * Cria ou retorna cliente oficial do Google AI Studio usando @google/genai
 */
export async function createGoogleAiClientAsync(customKey?: string) {
  const key = await resolveCreativeStudioApiKeyAsync(customKey);
  return new GoogleGenAI({ apiKey: key });
}

export function createGoogleAiClient(customKey?: string) {
  const key = customKey || getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Chave da API do Google AI Studio não encontrada. Configure sua chave em Configurações.",
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

export const BRIEFING_SYSTEM_PROMPT = `Você é o Diretor Criativo, Copywriter de Elite e Arquiteto Frontend Principal do "Estúdio Criativo" no EIA Link.
Você pensa como um Webdesigner Premiado (padrão Awwwards / Lovable), escreve como um Copywriter Milionário de Conversão e estrutura tudo como um Engenheiro Sênior.

SEU TOM DE VOZ E POSTURA:
- Converse de forma descontraída, empolgada, humana e muito perspicaz ("Fala, mestre!", "Excelente ideia!", "Deixa comigo, vou estruturar uma página que vai passar uma autoridade absurda").
- NADA de respostas robóticas, protocolares ou respostas automáticas genéricas. Mostre que você entendeu a essência da marca!
- Se o usuário enviar imagens, logos, panfletos ou fotos, analise tudo com sua visão multimodal: extraia as cores, a proposta de valor, os diferenciais e use no planejamento.

OBJETIVO DO BRIEFING:
Apresentar de forma empolgante, visual e estruturada a estratégia da página:
1. 🎯 **Proposta Única de Valor & Posicionamento**: Como essa página vai destacar o cliente da concorrência local.
2. 🎨 **Identidade Visual & Cores Sugeridas**: Paleta moderna de alto contraste (ex: grafite profundo #09090b, toques em esmeralda, dourado ou neon, tipografia limpa e impactante).
3. 📐 **Estrutura das Seções Matadoras**:
   - Hero com headline magnética e botão de ação direto no WhatsApp
   - Prova social, autoridade e diferenciais exclusivos
   - Vitrine de serviços / produtos com chamadas atraentes
   - Localização interativa (GPS Google Maps + Waze)
   - Contato / Concierge ágil
4. 💬 Uma pergunta convidativa no final: *"O que achou dessa direção? Quer aprovar para gerarmos o código ou prefere ajustar algum detalhe antes?"*`;

export const CODE_GENERATION_SYSTEM_PROMPT = `Você é o Diretor de Arte Sênior e Arquiteto Frontend Principal do "Estúdio Criativo" EiaLink (nível Awwwards Site of the Day, Lovable.dev e Pentagram).
Sua missão é criar sites web COMPLETOS, LUXUOSOS, COM IDENTIDADE DE NICHO PROFUNDA e VISUALMENTE IMPECÁVEIS em um único documento HTML5 autocontido, 100% integrado ao ecossistema EiaLink.

DIRETRIZES TÉCNICAS E DE ALTA REFINARIA VISUAL (OBRIGATÓRIAS):
1. **Stack e Tipografia Editorial de Elite**:
   - Documento HTML5 completo (<!DOCTYPE html><html lang="pt-BR" class="scroll-smooth">...</html>).
   - Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Google Fonts (SEMPRE carregue Cormorant Garamond, Playfair Display, Plus Jakarta Sans, Outfit e Inter):
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
   - Lucide Icons via CDN oficial:
     <script src="https://unpkg.com/lucide@latest"></script>
   - **REGRA CRÍTICA DE ÍCONES LUCIDE EM HTML PURO (PROIBIDO SINTAXE JSX)**:
     * NUNCA escreva tags estilo React/JSX como <Award />, <ShieldCheck />, <Star />, <Sparkles /> ou <GraduationCap />! No HTML5 puro, tags auto-fechadas desconhecidas não fecham e quebram todo o layout DOM!
     * Use EXCLUSIVAMENTE a sintaxe oficial do Lucide para HTML:
       <i data-lucide="award" class="w-6 h-6"></i>
       <i data-lucide="shield-check" class="w-5 h-5"></i>
       <i data-lucide="sparkles" class="w-5 h-5"></i>
       <i data-lucide="star" class="w-4 h-4 fill-current"></i>
       <i data-lucide="map-pin" class="w-5 h-5"></i>
       <i data-lucide="calendar" class="w-5 h-5"></i>
       <i data-lucide="phone" class="w-5 h-5"></i>
       <i data-lucide="check-circle-2" class="w-5 h-5"></i>

2. **DIREÇÃO DE ARTE GUIADA PELA TAG DO NICHO (PROIBIDO SITE GENÉRICO OU COM CARA DE IA AMADORA)**:
   - O site DEVE respirar a alma, a atmosfera, a psicologia das cores e o vocabulário técnico do **Nicho Canônico** informado no briefing:
     * **Psicologia / Terapia**: Santuário acolhedor e sereno (tons areia orgânica, verde-sálvia profundo, terracota suave, marfim), tipografia serifada elegante (Cormorant Garamond / Playfair Display), foco em escuta ética, sigilo CRP, terapia individual/online e equilíbrio emocional.
     * **Odontologia / Clínica Médica / Fisioterapia / Nutrição**: Luxo clínico suíço, precisão diagnóstica, biossegurança, estética natural e atendimento humanizado.
     * **Estética Facial & Corporal / Spa / Salão de Beleza**: Haute Beauté parisiense, tons nude/champagne/rose gold/marfim, foco em protocolos personalizados, autoestima e resultados naturais.
     * **Barbearia**: Club masculino clássico de respeito (couro, carvão, âmbar whiskey, navalha, toalha quente e degradê perfeito).
     * **Gastronomia (Churrascaria, Pizzaria, Hamburgueria, Japonês, Cafeteria, Restaurante, Sorveteria, Bebidas)**: Fotografia gastronômica suculenta em destaque absoluto, cores que despertam o apetite e botões de pedido/reserva imediatos.
     * **Advocacia / Contabilidade / Imobiliária / Engenharia / Energia Solar / Seguros**: Autoridade institucional soberana, solidez patrimonial e alta conversão consultiva.
   - **Acabamento de Luxo & Engenharia de Alinhamento Preciso (REGRA CRÍTICA DE LAYOUT)**:
     * **NAVBAR FULL-WIDTH SEM INVADIR TÍTULOS**: Use SEMPRE '<header class="sticky top-0 z-50 w-full backdrop-blur-xl border-b">' ocupando 100% da largura no topo (top-0). **PROIBIDO** criar pílulas flutuantes estreitas com 'sticky top-4' ou 'fixed top-6 max-w-5xl rounded-full', pois ao rolar a página elas cortam os títulos das seções ao meio!
     * **RESPIRO DE SEÇÃO E SCROLL**: Toda '<section>' DEVE ter 'py-20 lg:py-28 scroll-mt-24' para que o cabeçalho fixo nunca encoste ou corte fotos e títulos.
     * **ALINHAMENTO MATEMÁTICO DE CARDS DE SERVIÇOS (ALTURA IGUAL E RODAPÉ ALINHADO)**:
       - Na '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">', CADA card DEVE ter 'class="group flex flex-col h-full rounded-3xl overflow-hidden ..."'.
       - A imagem do topo do card DEVE ter altura fixa uniforme ('h-56 w-full shrink-0 overflow-hidden').
       - O corpo textual do card DEVE ter 'class="p-6 flex flex-col flex-1"'.
       - A linha inferior com Preço / Duração + Botão de Ação DEVE estar dentro de '<div class="mt-auto pt-5 border-t border-current/10 flex items-center justify-between">' para que todos os 4 preços e botões fiquem milimetricamente alinhados na mesma linha horizontal, mesmo quando uma descrição tiver 2 linhas e outra tiver 3 linhas!
     * **PROIBIDO CARDS FLUTUANTES VAZANDO DA IMAGEM**: Na seção "Sobre Nós / Espaço de Transformação", NUNCA use 'absolute -right-6', '-right-8' ou '-bottom-8' pendurado para fora da foto invadindo a coluna de texto ao lado. Se usar um selo sobre a foto, posicione-o **100% dentro** da moldura ('bottom-4 left-4 right-4' ou 'bottom-5 left-5').
     * **ESPAÇO SEGURO NOS CANTOS INFERIORES**: Adicione 'pb-24' no '<body>' ou no '<footer>' para que o botão flutuante de WhatsApp (canto inferior direito) e o widget de Atendimento Online (canto inferior esquerdo) nunca fiquem em cima de botões CTA do Hero ou textos importantes.

3. **PAREAMENTO FOTOGRÁFICO 1:1 E ZERO REPETIÇÃO DE FOTOS (REGRA INVIOLÁVEL)**:
   - **6 FOTOS 100% DISTINTAS (PROIBIDO REPETIR A FOTO DO HERO NOS CARDS)**:
     * A foto usada no **Hero** (Foto Principal 1) e a foto usada na seção **Nosso Espaço / Sobre Nós** (Foto Ambiente 2) NUNCA podem ser repetidas dentro dos 4 cards da seção de Serviços!
     * Cada um dos 6 espaços visuais da página (1 Hero + 1 Ambiente + 4 Cards de Serviços) DEVE ter uma URL única e diferente.
   - **TODO CARD DE SERVIÇO/PRODUTO DEVE TER FOTO REAL OU FOTO HD PAREADA**:
     * NUNCA gere listas de texto secas sem fotos e NUNCA gere tabelas cruas para a vitrine de serviços!
     * Cada card da seção de Serviços/Especialidades/Cardápio DEVE exibir uma fotografia de alta resolução no topo ('<div class="relative h-56 w-full shrink-0 overflow-hidden"><img src="..." alt="..." class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" /></div>').
   - **FIDELIDADE 1:1 AO CATÁLOGO PAREADO DO BRIEFING**:
     * O briefing fornece o bloco **[CATÁLOGO OFICIAL DE SERVIÇOS + FOTO EXATA PAREADA 1:1]**, onde cada Serviço (1, 2, 3, 4) já traz sua URL exata verificada (Imagem Obrigatória do Card).
     * Use EXATAMENTE a URL indicada para cada respectivo serviço! Isso garante 100% de precisão semântica entre a foto e o título do card (ex: Terapia de Casal com foto de casal conversando em terapia — jamais plateia de teatro ou silhuetas aleatórias; Psicoterapia Individual com foto de sessão clínica; Primeira Sessão com consultório acolhedor).
   - **SEÇÃO SOBRE O ESPECIALISTA / NOSSO ESPAÇO (PROIBIDO ROSTO FAKE OU SILHUETA DE PÔR DO SOL)**:
     * Se houver foto real do cliente (Google Maps / Instagram), use-a com destaque!
     * Se NÃO houver foto real confirmada da pessoa, NUNCA use rosto de modelo de banco de imagens fingindo ser o doutor/dono e NUNCA use fotos de paisagem/pôr do sol/praia. Ilustre a seção "Sobre Nós / Estrutura" exclusivamente com a **Foto do Ambiente / Consultório / Espaço de Atendimento** indicada no item 2 do Mapa Fotográfico do briefing.
   - NUNCA invente URLs do Unsplash que não estejam listadas no briefing e NUNCA repita a mesma URL de imagem em dois lugares diferentes da página.

4. **FERRAMENTAS NATIVAS E INTEGRALIDADE DE NEGÓCIO (OBRIGATÓRIO)**:
   - **Agendamento Online / Ação Principal**:
     Inclua botões de alta conversão no Hero, na Navbar e dentro de cada card de serviço apontando para o link oficial indicado no briefing (ex: 'href="/agendar/{slug}"' com 'data-action="agendar"' para negócios de agendamento, ou link direto de WhatsApp para pedidos/orçamentos).
   - **Localização Interativa & GPS (Google Maps + Waze)**:
     Crie uma seção de localização elegante contendo:
     * Card visual com endereço completo verificado e horários de funcionamento.
     * Iframe responsivo do Google Maps: <iframe src="https://maps.google.com/maps?q={ENDERECO_OU_NOME_EMPRESA}&output=embed" class="w-full h-72 md:h-80 rounded-3xl border border-black/10 shadow-lg" loading="lazy"></iframe>
     * Dois botões de rota GPS estilizados com ícones Lucide:
       - "📍 Traçar Rota no Google Maps" (https://www.google.com/maps/dir/?api=1&destination={ENDERECO_URL_ENCODED})
       - "🚗 Abrir no Waze" (https://waze.com/ul?q={ENDERECO_URL_ENCODED})
   - **WhatsApp Oficial com Botão Flutuante**:
     Adicione botão fixo no canto inferior direito (<div class="fixed bottom-6 right-6 z-50">) com link direto:
     https://wa.me/{NUMERO_WHATSAPP}?text=Olá,%20gostaria%20de%20mais%20informações!

5. **Inicialização de Ícones no Final do <body>**:
   - Antes de </body>, inclua obrigatoriamente:
     <script>
       if (window.lucide) { window.lucide.createIcons(); }
     </script>

6. **FORMATO DA RESPOSTA (COPILOTO + CÓDIGO HTML)**:
Sua resposta deve conter OBRIGATORIAMENTE duas partes separadas pelos marcadores:
<<<EXPLANATION>>>
Escreva uma mensagem curta, simpática e humana em português explicando a direção de arte aplicada para o nicho do cliente.
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... Código HTML5 completo, luxuoso e autocontido ...
</html>`;

/**
 * Sanitiza o HTML5 gerado pela IA para corrigir qualquer tag JSX acidental (ex: <Award />, <ShieldCheck />)
 * convertendo-as automaticamente em tags HTML válidas do Lucide (<i data-lucide="award"></i>)
 * e garantindo que o script lucide.createIcons() seja executado.
 */
export function sanitizeGeneratedLuxuryHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return rawHtml;

  const knownLucidePascalTags = [
    "Award",
    "GraduationCap",
    "ShieldCheck",
    "Shield",
    "UserCheck",
    "Sparkles",
    "Star",
    "CheckCircle",
    "CheckCircle2",
    "Check",
    "Calendar",
    "Clock",
    "MapPin",
    "Navigation",
    "Phone",
    "MessageCircle",
    "Heart",
    "HeartHandshake",
    "Smile",
    "Stethoscope",
    "Activity",
    "Flame",
    "Utensils",
    "Coffee",
    "Scissors",
    "Crown",
    "Gem",
    "Zap",
    "Sun",
    "Lock",
    "ArrowRight",
    "ChevronRight",
    "ChevronDown",
    "Users",
    "Building2",
    "Scale",
    "Briefcase",
    "Wrench",
    "Car",
    "PawPrint",
    "ShoppingBag",
    "Truck",
    "BadgeCheck",
    "ThumbsUp",
    "Quote",
  ];

  let html = rawHtml;

  // 1. Substitui fotos desconexas legadas (teatro/ópera lotado, silhueta pôr do sol, praia escura, notebook loja de móveis, poltrona amarela com TV) por fotos clínicas verificadas
  let psychologyHeroCount = 0;
  html = html
    .replace(
      /https:\/\/images\.unsplash\.com\/photo-1516307365426-bea591f05011[^"'\s)]*/gi,
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85",
    )
    .replace(
      /https:\/\/images\.unsplash\.com\/photo-1499209974431-9dddcece7f88[^"'\s)]*/gi,
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",
    )
    .replace(
      /https:\/\/images\.unsplash\.com\/photo-1506126613408-eca07ce68773[^"'\s)]*/gi,
      "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=85",
    )
    .replace(
      /https:\/\/images\.unsplash\.com\/photo-1586023492125-27b2c045efd7[^"'\s)]*/gi,
      "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=85",
    )
    .replace(
      /https:\/\/images\.unsplash\.com\/photo-1573497620053-ea5300f94f21[^"'\s)]*/gi,
      () => {
        psychologyHeroCount += 1;
        if (psychologyHeroCount === 1) {
          return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85";
        }
        return "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=85";
      },
    );

  // 3. Corrige selos/cards absolutos vazando para fora de imagens (-right-6, -right-8, -right-10, -right-12)
  html = html.replace(/\b-right-(?:6|8|10|12)\b/g, "right-4");

  // 4. Converte tags PascalCase auto-fechadas ou abertas/fechadas acidentais em <i data-lucide="..."></i>
  const pascalPattern = new RegExp(
    `<(${knownLucidePascalTags.join("|")})(\\s+[^>]*)?\\s*/>`,
    "g",
  );
  html = html.replace(pascalPattern, (_match, tagName: string, attrs?: string) => {
    const kebab = tagName
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
    const cleanAttrs = (attrs || "").replace(/\bclassName=/g, "class=");
    const hasClass = /\bclass=/i.test(cleanAttrs);
    return `<i data-lucide="${kebab}"${cleanAttrs}${hasClass ? "" : ' class="w-5 h-5"'}></i>`;
  });

  // 5. Injeta guarda CSS de precisão de layout (alinhamento de cards, scroll-margin contra navbar colada e padding inferior seguro)
  const layoutGuardStyle = `<style id="eialink-layout-precision-guard">
    html { scroll-padding-top: 6.5rem; }
    body { padding-bottom: 5.5rem !important; overflow-x: hidden; }
    section { scroll-margin-top: 6.5rem; }
    /* Garante que navbars pílula antigas não cortem títulos ao rolar */
    nav.sticky.top-4, nav.sticky.top-6, header.sticky.top-4, header.sticky.top-6 {
      top: 0.75rem !important;
      z-index: 50 !important;
    }
    /* Alinha todos os cards em grids de 3 ou 4 colunas com a mesma altura e rodapé (preço/seta) na mesma linha horizontal */
    .grid[class*="grid-cols-"] {
      align-items: stretch;
    }
    .grid[class*="lg:grid-cols-4"] > div,
    .grid[class*="lg:grid-cols-3"] > div,
    .grid[class*="md:grid-cols-2"] > div {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .grid[class*="lg:grid-cols-4"] > div > div:last-child,
    .grid[class*="lg:grid-cols-3"] > div > div:last-child {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
    }
    .grid[class*="lg:grid-cols-4"] > div > div:last-child > div:last-child,
    .grid[class*="lg:grid-cols-3"] > div > div:last-child > div:last-child {
      margin-top: auto;
      padding-top: 1rem;
    }
  </style>`;

  if (!html.includes("id=\"eialink-layout-precision-guard\"")) {
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${layoutGuardStyle}\n</head>`);
    } else {
      html = `${layoutGuardStyle}\n${html}`;
    }
  }

  // 6. Garante que lucide.createIcons() esteja presente antes do fechamento do body
  if (!/lucide\.createIcons\s*\(/i.test(html) && /<\/body>/i.test(html)) {
    html = html.replace(
      /<\/body>/i,
      `<script>if(window.lucide){window.lucide.createIcons();}</script>\n</body>`,
    );
  }

  return html;
}

export const SURGICAL_EDIT_SYSTEM_PROMPT = `Você é o Arquiteto Copiloto Especialista em Edição Cirúrgica de Código HTML5 do "Estúdio Criativo".
Sua ÚNICA missão é aplicar com precisão CIRÚRGICA e ESTRITA a alteração solicitada pelo usuário no código HTML5/Tailwind existente, SEM redesenhar o site do zero, SEM alterar o tema ou a paleta de cores e SEM desconfigurar a identidade já aprovada.

REGRAS DE OURO PARA EDIÇÃO CIRÚRGICA:
1. **PRESERVAÇÃO INTEGRAL DE IDENTIDADE VISUAL**:
   - Mantenha RIGOROSAMENTE o mesmo tema de cores (se a página era clara/branca, continue 100% clara/branca; se era escura, continue escura).
   - Mantenha a mesma tipografia, a mesma estrutura de seções, as fotos do Unsplash existentes e todos os blocos que NÃO foram expressamente pedidos para mudar.
   - NUNCA substitua o site por um modelo genérico escuro de 'sua região' ou mude imagens para outros nichos.
   - Modifique APENAS o elemento, texto, botão, estilo ou seção que o usuário especificou na solicitação.

2. **CONTROLE E PRESERVAÇÃO DAS FERRAMENTAS DO SISTEMA**:
   - Se o usuário pediu ajuste na Agenda (ex: 'conectar agenda', 'abrir modal', 'mudar botão de agendar'):
     Mantenha/atualize os botões de agendamento com href="/agendar/{slug}" e data-action="agendar".
   - Preserve sempre:
     * Botão flutuante de WhatsApp (wa.me)
     * Seção de localização (Google Maps + botões Waze/Maps)
     * Scripts de runtime (#eialink-runtime) e Lucide Icons

3. **FORMATO OBRIGATÓRIO DA RESPOSTA**:
Sua resposta DEVE conter impreterivelmente as duas partes separadas por marcadores:
<<<EXPLANATION>>>
Escreva uma mensagem conversacional, simpática e objetiva no chat explicando exatamente o que foi modificado cirurgicamente (em português do Brasil).
<<<HTML>>>
<!DOCTYPE html>
<html lang="pt-BR">
... Código HTML5 completo, limpo e autocontido com a modificação cirúrgica aplicada ...
</html>
<<<END_HTML>>>`;

/**
 * Etapa 1: Planejar e montar o Briefing Estruturado
 */
export async function planSiteBriefing(
  prompt: string,
  history: ChatMessage[] = [],
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<string> {
  const client = await createGoogleAiClientAsync(apiKey);

  const formattedHistory = history.map((msg) => {
    const parts: any[] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64,
          },
        });
      }
    }
    parts.push({ text: msg.content });
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const currentUserParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentUserParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentUserParts.push({ text: prompt });

  // Tenta com gemini-2.5-flash como modelo principal e um único fallback (gemini-2.5-flash-lite)
  let briefingText = "";
  let lastError: any = null;
  const candidateModels = await getAvailableGeminiModels(apiKey);

  for (const modelToTry of candidateModels) {
    if (briefingText) break;
    try {
      const response = await client.models.generateContent({
        model: modelToTry,
        contents: [...formattedHistory, { role: "user", parts: currentUserParts }],
        config: {
          systemInstruction: BRIEFING_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });
      const text = response.text?.trim() || "";
      if (text) {
        briefingText = text;
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[CreativeEngine] Falha no briefing com ${modelToTry}:`, err?.message || err);
    }
  }

  if (!briefingText) {
    const rawMsg = lastError?.message || String(lastError || "Erro desconhecido");
    const lower = rawMsg.toLowerCase();
    if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
      throw new Error(
        `Modelo do Google AI Studio inexistente ou indisponível para a sua chave (${rawMsg}).`,
      );
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      throw new Error(
        `Limite de cota atingido no Google AI Studio (${rawMsg}). Aguarde alguns instantes ou verifique o faturamento da sua chave.`,
      );
    }
    throw new Error(`Falha ao gerar briefing no Google AI Studio: ${rawMsg}`);
  }

  return briefingText;
}

/**
 * Etapa 2: Gerar ou Refinar o Site Completo em HTML/Tailwind nativo
 * Conecta com o modelo gemini-2.5-flash como principal e um único fallback (gemini-2.5-flash-lite)
 */
export async function generateSiteHtml(
  briefingOrPrompt: string,
  existingHtml?: string,
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<string> {
  const client = await createGoogleAiClientAsync(apiKey);

  let userPrompt = briefingOrPrompt;
  if (existingHtml && existingHtml.length > 50) {
    userPrompt = `MODIFICAÇÃO NO SITE EXISTENTE:
O usuário solicitou o seguinte ajuste:
"${briefingOrPrompt}"

Aqui está o código HTML atual da página que deve ser modificado preservando todo o restante da estrutura e melhorando com o novo ajuste:
${existingHtml}

Retorne o HTML completo atualizado com a alteração solicitada.`;
  }

  const currentUserParts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      currentUserParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.dataBase64,
        },
      });
    }
  }
  currentUserParts.push({ text: userPrompt });

  let raw = "";
  let lastCapturedError: any = null;

  const candidateModels = await getAvailableGeminiModels(apiKey);

  for (const modelToTry of candidateModels) {
    if (raw) break;
    try {
      const response = await client.models.generateContent({
        model: modelToTry,
        contents: [{ role: "user", parts: currentUserParts }],
        config: {
          systemInstruction:
            existingHtml && existingHtml.length > 50
              ? SURGICAL_EDIT_SYSTEM_PROMPT
              : CODE_GENERATION_SYSTEM_PROMPT,
          temperature: existingHtml && existingHtml.length > 50 ? 0.2 : 0.85,
        },
      });

      const text = response.text?.trim() || "";
      if (text && text.length > 50) {
        raw = text;
        break;
      }
    } catch (sdkErr: any) {
      lastCapturedError = sdkErr;
      console.warn(`[CreativeEngine] Falha ao gerar com ${modelToTry}:`, sdkErr?.message || sdkErr);
    }
  }

  if (!raw) {
    const errorDetails =
      lastCapturedError?.message ||
      (typeof lastCapturedError === "object"
        ? JSON.stringify(lastCapturedError)
        : "Falha na geração");
    const lower = String(errorDetails).toLowerCase();
    if (lower.includes("404") || lower.includes("not found") || lower.includes("not_found")) {
      throw new Error(
        `Modelo do Google AI Studio inexistente ou indisponível para a sua chave: ${errorDetails}`,
      );
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      throw new Error(
        `Limite de cota atingido no Google AI Studio: ${errorDetails}. Aguarde alguns instantes ou verifique o faturamento da sua chave.`,
      );
    }
    throw new Error(
      `Não foi possível gerar o site no Google AI Studio: ${errorDetails}. Por favor, clique novamente para tentar a geração.`,
    );
  }

  let cleanHtml = raw;
  if (cleanHtml.includes("<<<HTML>>>")) {
    const parts = cleanHtml.split("<<<HTML>>>");
    cleanHtml = parts[1].trim();
  }

  // Limpeza de possíveis envoltórios markdown
  if (cleanHtml.startsWith("```html")) {
    cleanHtml = cleanHtml.replace(/^```html\s*/i, "");
  } else if (cleanHtml.startsWith("```")) {
    cleanHtml = cleanHtml.replace(/^```\s*/, "");
  }
  if (cleanHtml.endsWith("```")) {
    cleanHtml = cleanHtml.replace(/```\s*$/, "");
  }

  return sanitizeGeneratedLuxuryHtml(cleanHtml.trim());
}

export async function generateSiteWithCopilot(
  briefingOrPrompt: string,
  existingHtml?: string,
  apiKey?: string,
  attachments?: MultimodalAttachment[],
): Promise<{ html: string; explanation: string }> {
  const html = await generateSiteHtml(briefingOrPrompt, existingHtml, apiKey, attachments);
  return {
    html,
    explanation: existingHtml
      ? "✨ Ajuste aplicado no site com sucesso! Veja a prévia atualizada na tela ao lado."
      : "🎉 Site construído com sucesso! Veja a prévia e solicite novos ajustes se desejar.",
  };
}
