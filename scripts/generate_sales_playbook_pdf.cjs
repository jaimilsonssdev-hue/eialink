const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function buildPlaybookPdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > 275) {
      doc.addPage();
      y = 16;
      renderPageHeader();
    }
  }

  function renderPageHeader() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("PLAYBOOK COMERCIAL & ESTRATÉGIA DE VENDAS | EIA LINK 2026", margin, 10);
    doc.text("MÉTODO DOS 5 CLIENTES EM 7 DIAS", pageWidth - margin - 56, 10);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  function sectionTitle(number, title, subtitle) {
    checkPageBreak(18);
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");
    
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(margin, y, 3, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${number}. ${title.toUpperCase()}`, margin + 6, y + 6.8);

    y += 13;

    if (subtitle) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, margin, y);
      y += 5.5;
    }
  }

  function calloutBox(title, bodyText, bgR = 248, bgG = 250, bgB = 252, borderR = 16, borderG = 185, borderB = 129) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(bodyText, contentWidth - 10);
    const boxHeight = 8 + lines.length * 4.2;

    checkPageBreak(boxHeight + 4);

    doc.setFillColor(bgR, bgG, bgB);
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(borderR === 16 ? 5 : borderR, borderG === 185 ? 150 : borderG, borderB === 129 ? 105 : borderB);
    doc.text(title, margin + 5, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(lines, margin + 5, y + 10);

    y += boxHeight + 4;
  }

  function scriptBox(title, scriptContent, tag = "WHATSAPP") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(scriptContent, contentWidth - 10);
    const boxHeight = 10 + lines.length * 4.0;

    checkPageBreak(boxHeight + 4);

    // Fundo escuro premium
    doc.setFillColor(15, 23, 42); // slate-900
    doc.setDrawColor(99, 102, 241); // indigo-500
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    // Tag badge
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin + 4, y + 3, 24, 4.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tag, margin + 6, y + 6.2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(129, 140, 248); // indigo-300
    doc.text(title, margin + 31, y + 6.3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(241, 245, 249); // slate-100
    doc.text(lines, margin + 5, y + 11.5);

    y += boxHeight + 4;
  }

  // ==================== CAPA / BANNER INICIAL ====================
  doc.setFillColor(10, 15, 30);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "F");

  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y, 4, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text("GUIA TÁTICO DE ACELERAÇÃO & FECHAMENTO RÁPIDO", margin + 8, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("PLAYBOOK DE VENDAS — EIA LINK", margin + 8, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Como fechar os primeiros 5 clientes na próxima semana com zero fricção e alto ticket recorrente", margin + 8, y + 26);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Estratégia: Demonstração com IA + Fotos Reais do Instagram (Apify) + Vídeo de 30s + Fechamento Pix", margin + 8, y + 32);

  y += 44;

  // ==================== SEÇÃO 1 ====================
  sectionTitle(1, "A Nova Lógica: Venda Reversa com IA", "Por que tentar vender sites pelo modelo tradicional falha e como a IA muda o jogo");

  const p1 = 
    "O dono de empresa local recebe mensagens todos os dias de 'agências' oferecendo sites. Ele ignora 99% porque:\n" +
    "  1. Acha que custará de R$ 2.000 a R$ 5.000 e vai demorar 3 meses para ficar pronto.\n" +
    "  2. Tem trauma de desenvolvedores que sumiram ou entregaram páginas que ninguém acessa.\n" +
    "  3. Odeia ter que preencher formulários, enviar textos e escolher fotos.\n\n" +
    "O SEU SUPERPODER COM O EIA LINK:\n" +
    "Você não pede nada. Você não agenda reuniões de 1 hora. Você utiliza o Radar de Prospecção integrado com a Apify (Instagram Scraper) e Gemini AI para minerar o perfil do cliente, puxar as melhores fotos do feed real dele e gerar uma vitrine cinematográfica completa em 30 segundos.\n\n" +
    "Quando você aborda o cliente, o produto já existe, tem as fotos dele, tem os pratos/serviços dele e funciona na palma da mão. A venda deixa de ser uma promessa abstrata e vira a entrega de um presente pronto.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const p1Lines = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Lines, margin, y);
  y += p1Lines.length * 4.0 + 3;

  calloutBox(
    "A REGRA DE OURO DA ABORDAGEM:",
    "Nunca envie: 'Olá, você gostaria de criar um site?'.\nSempre envie: 'Olá [Nome], vi seu trabalho impecável no Instagram e montei esse protótipo interativo no ar com as fotos de vocês para vocês verem como ficaria um site cinematográfico no celular. Dá uma olhada: [link]'.",
    240, 253, 250, 13, 148, 136
  );

  // ==================== SEÇÃO 2 ====================
  sectionTitle(2, "A Oferta Irrecusável (No-Brainer)", "A esteira de preços desenhada para fechar 5 clientes em até 5 dias úteis");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const p2 = "Para colocar os primeiros 5 clientes na próxima semana, elimine qualquer barreira financeira de entrada. Apresente duas opções:";
  doc.text(p2, margin, y);
  y += 5;

  // Tabela de Preços
  checkPageBreak(38);
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PLANO", margin + 3, y + 4.8);
  doc.text("INVESTIMENTO", margin + 40, y + 4.8);
  doc.text("ENTREGÁVEIS", margin + 80, y + 4.8);
  doc.text("BENEFÍCIO PARA O DONO", margin + 140, y + 4.8);
  y += 7;

  const precos = [
    {
      p: "Mensalidade Ágil",
      v: "R$ 197 taxa + R$ 67/mês",
      e: "Site IA oficial, domínio, hosting e suporte",
      b: "Custo quase zero para começar imediatamente",
    },
    {
      p: "Anual Especial (Recomendado)",
      v: "R$ 497 à vista / ano",
      e: "Ano inteiro pago + QR Code de balcão",
      b: "Desconto agressivo + caixa rápido para você",
    },
    {
      p: "Combo Presencial + NFC",
      v: "R$ 697 à vista ou 12x",
      e: "Site IA + 2 Plaquinhas NFC/Acrílico balcão",
      b: "Tangibilidade física: o cliente vê e toca",
    },
  ];

  precos.forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.p, margin + 3, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(item.v, margin + 40, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(item.e, 58)[0], margin + 80, y + 5);
    doc.text(doc.splitTextToSize(item.b, 40)[0], margin + 140, y + 5);

    y += 8;
  });

  y += 4;
  calloutBox(
    "PROJEÇÃO FINANCEIRA DOS 5 CLIENTES:",
    "• Se fechar os 5 no Anual (R$ 497): R$ 2.485,00 no seu bolso na mesma semana (Pix imediato).\n• Se fechar no Mensal (R$ 197 + R$ 67/mês): R$ 985,00 de entrada + R$ 335,00/mês de receita recorrente previsível.",
    254, 242, 242, 239, 68, 68
  );

  // ==================== SEÇÃO 3 ====================
  sectionTitle(3, "Scripts de Alta Conversão por Nicho", "Modelos prontos e testados para copiar, colar e disparar via WhatsApp");

  scriptBox(
    "1. ABORDAGEM 'VÍDEO DE 30 SEGUNDOS' (A MAIS PODEROSA)",
    "Fala [Nome], tudo bem? Estava admirando as fotos do trabalho de vocês no Instagram e vi que vocês são referência aqui na cidade.\n\n" +
    "Como trabalho desenvolvendo tecnologia para negócios locais, peguei as fotos mais bonitas do feed de vocês e montei esse protótipo interativo com IA para vocês verem como ficaria um site cinematográfico no celular dos clientes de vocês.\n\n" +
    "👉 Olha como ficou lindo: [link-da-demo]\n\n" +
    "Coloquei botão de WhatsApp direto e galeria dos melhores trabalhos. Me diz o que achou!",
    "UNIVERSAL"
  );

  scriptBox(
    "2. NICHO ESTÉTICA, BELEZA & HARMONIZAÇÃO",
    "Oi [Nome], acompanho os procedimentos que você posta no perfil da [Nome da Clínica] e o nível dos resultados é incrível!\n\n" +
    "Reparei que no link da bio de vocês hoje só tem um link simples. As clientes que buscam procedimentos estéticos decidem pelo impacto visual e sofisticação.\n\n" +
    "Por isso estruturei essa vitrine de luxo para a clínica usando as próprias fotos dos seus procedimentos com efeito vitrine espelhada: [link-da-demo]\n\n" +
    "Ficou com cara de marca internacional. Gostaria de ativar esse link oficial para o seu perfil?",
    "ESTÉTICA / LASH"
  );

  scriptBox(
    "3. NICHO GASTRONOMIA, HAMBURGUERIAS & RESTAURANTES",
    "Fala pessoal da [Nome do Restaurante]! Adoro os pratos de vocês, as fotos do feed dão água na boca.\n\n" +
    "Montei hoje pela manhã um cardápio digital interativo ultrarrápido para vocês, com fotos grandes dos pratos e botão de pedido direto no WhatsApp sem comissão de aplicativo: [link-da-demo]\n\n" +
    "Também dá para gerar o QR Code de balcão e mesa para o cliente pedir e pontuar na fidelidade. O que acharam da apresentação dos pratos?",
    "GASTRONOMIA"
  );

  scriptBox(
    "4. SCRIPT DE FECHAMENTO & APRESENTAÇÃO DE VALOR",
    "Que bom que você curtiu [Nome]! Esse tipo de vitrine com IA e carregamento instantâneo normalmente custa entre R$ 1.500 e R$ 2.500 no mercado tradicional.\n\n" +
    "Mas como eu já deixei o seu site 100% montado e configurado na minha plataforma, consigo liberar o domínio oficial e o painel para você por apenas R$ 197 de ativação e R$ 67/mês (cobre hospedagem, SSL e suporte).\n\n" +
    "Ou se preferir quitar o ano todo com desconto especial, fica R$ 497 à vista pelo ano inteiro.\n\n" +
    "Posso gerar a chave Pix para colocarmos no seu Instagram hoje ainda?",
    "FECHAMENTO"
  );

  // ==================== SEÇÃO 4 ====================
  sectionTitle(4, "Matriz de Contorno de Objeções", "Respostas elegantes que transformam 'não' ou hesitação em fechamento na hora");

  const objecoes = [
    {
      o: "OBJEÇÃO: 'Já tenho Instagram, não preciso de site.'",
      r: "RESPOSTA: 'Com certeza, seu Instagram é fantástico! Mas 68% das pessoas que buscam no Google ou clicam no seu link da bio querem ver serviços, preços e endereço rápido sem ter que caçar nos posts. O site não substitui seu Instagram, ele transforma quem visita seu perfil em agendamento no WhatsApp antes que a pessoa se distraia.'",
    },
    {
      o: "OBJEÇÃO: 'Achei um pouco caro / Não tenho essa verba agora.'",
      r: "RESPOSTA: 'Super compreendo! Mas pensa comigo: R$ 67 por mês dá menos de R$ 2,25 por dia. Se esse site te trouxer apenas UM novo cliente ou agendamento no mês inteiro, ele já pagou a mensalidade e colocou lucro no seu bolso. O risco é literalmente zero.'",
    },
    {
      o: "OBJEÇÃO: 'Preciso falar com meu sócio / esposa primeiro.'",
      r: "RESPOSTA: 'Perfeito! Faz o seguinte: envia esse link que eu gerei direto no WhatsApp dele(a). Como ele já vê o negócio de vocês pronto e funcionando na tela do celular, é muito mais fácil decidir do que explicar em palavras. Me avisa o que ele(a) achou até o fim da tarde!'",
    },
    {
      o: "OBJEÇÃO: 'Não tenho tempo para gerenciar nem atualizar.'",
      r: "RESPOSTA: 'Essa é a melhor parte: você não precisa fazer nada. O site sincroniza com o que você já posta no Instagram e qualquer alteração de telefone ou horário você me manda uma mensagem e eu ajusto em 5 minutos. O trabalho é todo meu.'",
    },
  ];

  objecoes.forEach((item) => {
    checkPageBreak(24);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(item.o, margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(30, 41, 59);
    const rLines = doc.splitTextToSize(item.r, contentWidth - 8);
    doc.text(rLines, margin + 4, y + 8.5);

    y += 23;
  });

  // ==================== SEÇÃO 5 ====================
  sectionTitle(5, "Cronograma Tático: 5 Clientes em 5 Dias", "O checklist passo a passo de execução diária (Segunda a Sexta)");

  const dias = [
    {
      d: "SEGUNDA-FEIRA — Mineração & Criação das Demos (Volume)",
      t: "• Abra o Radar de Prospecção do EiaLink (/admin/prospeccao).\n• Filtre 30 empresas (10 estéticas, 10 hamburguerias/restaurantes, 10 consultórios).\n• Clique em 'Gerar com IA' em todas. O sistema puxa as fotos do Instagram e cria as 30 vitrines em 15 minutos.",
    },
    {
      d: "TERÇA-FEIRA — Gravação dos Vídeos & Primeiro Lote de Disparos",
      t: "• Abra os 15 melhores links no celular.\n• Grave 15 vídeos de tela de 25 segundos rolando a página e elogiando o trabalho.\n• Envie o Script 1 no WhatsApp de cada um com o vídeo e o link da demo.\n• Meta: 15 abordagens entregues.",
    },
    {
      d: "QUARTA-FEIRA — Segundo Lote & Primeiras Respostas",
      t: "• Dispare os 15 vídeos restantes pelo mesmo formato.\n• Responda imediatamente quem responder elogiando: 'Gostou? Quer que eu ative hoje por R$ 197 + R$ 67/mês?'.\n• Fechamento esperado de Quarta: 1 a 2 clientes.",
    },
    {
      d: "QUINTA-FEIRA — Follow-up com Gatilho de Desapego",
      t: "• Para quem visualizou e não respondeu: 'Oi [Nome], vou precisar liberar esse link temporário amanhã, queria checar se você quer manter ativo ou se posso arquivar'.\n• Aplique a quebra de objeções nos indecisos.\n• Fechamento esperado de Quinta: +2 clientes.",
    },
    {
      d: "SEXTA-FEIRA — Fechamento da Meta & Ativação Oficial",
      t: "• Feche o 5º cliente com a condição especial de fim de semana (ex: R$ 497 à vista pelo ano todo).\n• Ative os domínios oficiais na plataforma e marque como 'Oficial' no Radar.\n• Total faturado: entre R$ 1.500 e R$ 2.485 na semana.",
    },
  ];

  dias.forEach((dia) => {
    checkPageBreak(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text(dia.d, margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    const tLines = doc.splitTextToSize(dia.t, contentWidth - 8);
    doc.text(tLines, margin + 4, y + 8.2);

    y += 18.5;
  });

  // ==================== RODAPÉ / FINAL ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text("EiaLink — Sistema de Prospecção & Máquina de Sites com IA | Documento Oficial", margin, pageHeight - 8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 8);
  }

  return doc;
}

const doc = buildPlaybookPdf();

const rootPath = path.resolve(__dirname, "..", "..", "Playbook_Comercial_EiaLink.pdf");
const publicPath = path.resolve(__dirname, "..", "public", "Playbook_Comercial_EiaLink.pdf");

fs.writeFileSync(rootPath, Buffer.from(doc.output("arraybuffer")));
fs.writeFileSync(publicPath, Buffer.from(doc.output("arraybuffer")));

console.log("PDF gerado com sucesso em:");
console.log("- Root:", rootPath);
console.log("- Public Web:", publicPath);
