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
    doc.text("PLAYBOOK COMERCIAL & ESTRATÉGIA DE VENDAS | EIA LINK", margin, 10);
    doc.text("FASE DE TRAÇÃO: PRIMEIROS 5 CLIENTES", pageWidth - margin - 58, 10);
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
  doc.text("GUIA TÁTICO DE ACELERAÇÃO & TRAÇÃO INICIAL", margin + 8, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("PLAYBOOK DE VENDAS — EIA LINK", margin + 8, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Como fechar os primeiros 5 clientes com zero fricção de preço e máxima aderência", margin + 8, y + 26);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Precificação de Tração: R$ 29,90/mês ou R$ 290,00 no Anual | Demos com Fotos Reais e IA", margin + 8, y + 32);

  y += 44;

  // ==================== SEÇÃO 1 ====================
  sectionTitle(1, "A Lógica de Tração: Fechamento sem Fricção", "Por que começar com preço acessível acelera seus primeiros cases e depoimentos");

  const p1 = 
    "Na fase inicial de qualquer plataforma, o objetivo número um NÃO é cobrar preços altos imediatos, mas sim:\n" +
    "  1. Colocar clientes reais no ar usando o sistema em menos de 7 dias.\n" +
    "  2. Gerar cases de sucesso na sua cidade para usar como prova social irresistível.\n" +
    "  3. Eliminar qualquer dúvida ou objeção financeira do dono do estabelecimento.\n\n" +
    "O DIFERENCIAL DO EIA LINK:\n" +
    "Em vez de tentar vender um projeto demorado, você usa o Radar integrado ao Instagram Scraper (Apify) para puxar fotos reais do feed do cliente e gerar uma vitrine moderna em 30 segundos.\n\n" +
    "Com um preço de tração de R$ 29,90/mês (menos de R$ 1,00 por dia) ou R$ 290,00 à vista pelo ano inteiro, o lojista não precisa pensar, comparar com agências ou hesitar: ele fecha na hora pelo Pix.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const p1Lines = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Lines, margin, y);
  y += p1Lines.length * 4.0 + 3;

  calloutBox(
    "A REGRA DE OURO DA ABORDAGEM:",
    "Você não pede reuniões. Você entrega um protótipo pronto no WhatsApp do lojista:\n'Olá [Nome], vi as fotos lindas do Instagram da [Empresa] e montei esse protótipo no ar para você ver como ficaria um site cinematográfico no celular. Dá uma olhada: [link]'.",
    240, 253, 250, 13, 148, 136
  );

  // ==================== SEÇÃO 2 ====================
  sectionTitle(2, "A Esteira de Preços de Tração", "Valores desenhados para fechar 5 clientes rapidamente");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const p2 = "Tabela de precificação oficial para a fase de tração inicial (editável pelo painel /admin/vendas):";
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
  doc.text("VALOR DE TRAÇÃO", margin + 45, y + 4.8);
  doc.text("ENTREGÁVEIS", margin + 85, y + 4.8);
  doc.text("ARGUMENTO DE FECHAMENTO", margin + 140, y + 4.8);
  y += 7;

  const precos = [
    {
      p: "Mensal de Tração",
      v: "R$ 29,90 / mês",
      e: "Site oficial, hospedagem rápida e suporte",
      b: "Custa menos de R$ 1,00 por dia (zero risco)",
    },
    {
      p: "Anual à Vista (Recomendado)",
      v: "R$ 290,00 / ano",
      e: "1 ano inteiro pago + domínio + QR Code",
      b: "Desconto atrativo + Pix integral no seu bolso",
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
    doc.text(item.v, margin + 45, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(item.e, 52)[0], margin + 85, y + 5);
    doc.text(doc.splitTextToSize(item.b, 40)[0], margin + 140, y + 5);

    y += 8;
  });

  y += 4;
  calloutBox(
    "SIMULAÇÃO DOS PRIMEIROS 5 CLIENTES NA TRAÇÃO:",
    "• Se fechar os 5 no Anual (R$ 290,00): R$ 1.450,00 líquidos direto no seu Pix esta semana.\n• Se fechar no Mensal (R$ 29,90/mês): R$ 149,50/mês de receita recorrente para cobrir custos e dar estabilidade.",
    254, 242, 242, 239, 68, 68
  );

  // ==================== SEÇÃO 3 ====================
  sectionTitle(3, "Scripts de Abordagem e Fechamento", "Modelos diretos e calibrados para os preços de R$ 29,90/mês e R$ 290,00 anual");

  scriptBox(
    "1. ABORDAGEM 'VÍDEO DE 25 SEGUNDOS' (A MAIS EFICAZ)",
    "Fala [Nome], tudo bem? Estava admirando as fotos da [Nome da Empresa] no Instagram e o trabalho de vocês é muito caprichado!\n\n" +
    "Como desenvolvo tecnologia para empresas locais, peguei as fotos mais bonitas do feed de vocês e montei um protótipo no ar para você ver como ficaria um site cinematográfico no celular dos seus clientes.\n\n" +
    "👉 Dá uma olhada no celular: [link-da-demo]\n\n" +
    "Coloquei botão de WhatsApp direto e galeria dos melhores trabalhos. Me diz o que achou da apresentação!",
    "UNIVERSAL"
  );

  scriptBox(
    "2. SCRIPT DE FECHAMENTO DIRETO & PREÇO DE TRAÇÃO",
    "Que bom que você curtiu [Nome]! Criar uma vitrine nesse padrão nas agências custa de R$ 1.000 a R$ 2.000.\n\n" +
    "Mas como o seu site já está 100% estruturado na minha plataforma, consigo liberar o link oficial e o painel para você por apenas R$ 29,90 por mês (cobre hospedagem rápida, SSL e suporte).\n\n" +
    "Ou se preferir quitar o ano todo com desconto de tração, fica apenas R$ 290,00 à vista pelo ano inteiro!\n\n" +
    "Posso gerar a chave Pix para colocarmos no seu Instagram hoje ainda?",
    "FECHAMENTO"
  );

  scriptBox(
    "3. QUEBRA DA OBJEÇÃO 'ACHEI CARO / SEM VERBA'",
    "Super compreendo [Nome]! Mas pensa comigo: R$ 29,90 por mês dá menos de R$ 0,99 por dia.\n\n" +
    "Se esse site te trouxer apenas UM novo cliente ou agendamento no mês inteiro, ele já pagou o ano todo e colocou lucro no seu bolso.\n\n" +
    "O risco para você é literalmente zero. Vamos colocar no ar hoje?",
    "OBJEÇÃO PREÇO"
  );

  // ==================== SEÇÃO 4 ====================
  sectionTitle(4, "Matriz de Contorno das Demais Objeções", "Respostas práticas e sem enrolação");

  const objecoes = [
    {
      o: "OBJEÇÃO: 'Já tenho Instagram, não preciso de site.'",
      r: "RESPOSTA: 'Com certeza, seu Instagram é excelente! Mas o Instagram atrai atenção, não organiza fechamentos. Mais de 60% das pessoas querem ver horários, serviços e endereço sem ter que caçar em 50 posts. O site direciona quem visita o perfil direto para o WhatsApp antes que a pessoa se distraia.'",
    },
    {
      o: "OBJEÇÃO: 'Preciso falar com meu sócio / esposa primeiro.'",
      r: "RESPOSTA: 'Perfeito! Faz o seguinte: envia esse link que gerei direto no WhatsApp dele(a). Como ele(a) vai ver a vitrine já funcionando no celular, é muito mais fácil aprovar do que apenas falar. Consigo segurar essa condição de R$ 290 no anual até amanhã!'",
    },
  ];

  objecoes.forEach((item) => {
    checkPageBreak(24);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38);
    doc.text(item.o, margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(30, 41, 59);
    const rLines = doc.splitTextToSize(item.r, contentWidth - 8);
    doc.text(rLines, margin + 4, y + 8.5);

    y += 23;
  });

  // ==================== SEÇÃO 5 ====================
  sectionTitle(5, "Cronograma Operacional: 5 Clientes em 5 Dias", "Checklist de execução diária (Segunda a Sexta)");

  const dias = [
    {
      d: "SEGUNDA-FEIRA — Mineração & Geração das Demos (Volume)",
      t: "• Abra o Radar de Prospecção (/admin/prospeccao) e minere 25 a 30 alvos locais.\n• Clique em 'Gerar com IA' em todas. O sistema puxa as fotos do Instagram e cria as páginas em minutos.",
    },
    {
      d: "TERÇA-FEIRA — Gravação dos Vídeos & Envio Lote 1",
      t: "• Abra os 12 a 15 melhores links no celular.\n• Grave vídeos de 25 segundos rolando o site e elogiando o trabalho.\n• Envie no WhatsApp comercial de cada lead.",
    },
    {
      d: "QUARTA-FEIRA — Envio Lote 2 & Primeiros Fechamentos",
      t: "• Dispare os vídeos restantes.\n• Responda de imediato aos elogios oferecendo a condição de tração: R$ 29,90/mês ou R$ 290,00 anual.",
    },
    {
      d: "QUINTA-FEIRA — Follow-up & Contorno de Objeções",
      t: "• Envie o follow-up de desapego para os que visualizaram e não responderam.\n• Feche mais clientes mostrando que custa menos de R$ 1,00/dia.",
    },
    {
      d: "SEXTA-FEIRA — Conclusão da Meta dos 5 Clientes",
      t: "• Feche os clientes restantes com a oferta especial anual de R$ 290,00.\n• Ative os domínios oficiais na plataforma e marque como 'Oficial' no Radar.",
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
    doc.setTextColor(30, 64, 175);
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
    doc.text("EiaLink — Sistema de Prospecção & Máquina de Sites com IA | Documento Oficial de Tração", margin, pageHeight - 8);
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

