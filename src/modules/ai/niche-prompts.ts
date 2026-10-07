export type NicheCategory = "delivery" | "ecommerce" | "services_health" | "services_beauty" | "services_pro" | "general";

export interface NichePreset {
  category: NicheCategory;
  recommendedLayout: "restaurant" | "storefront" | "cinematic-glass" | "clinic" | "business";
  suggestedTheme: {
    bg: string;
    accent: string;
    mode: "dark" | "light";
    archetype: string;
  };
  sampleHighlights: Array<{
    title: string;
    description: string;
    price?: string;
    badge?: string;
  }>;
  copyGuidelines: string;
}

export function detectNicheCategory(niche: string, businessName = "", prompt = ""): NicheCategory {
  const text = `${niche} ${businessName} ${prompt}`.toLowerCase();

  if (
    /hamb[uú]rguer|burger|pizza|pizzaria|restaurante|delivery|lanche|comida|a[çc]a[íi]|sushi|marmit|gastronom|doceria|confeitaria|cafeteria|churrasco|espeto|bar\b/i.test(
      text,
    )
  ) {
    return "delivery";
  }

  if (
    /loja|roupa|vestu[aá]rio|moda|e-?commerce|cat[aá]logo|sapato|cal[çc]ado|joia|semijoia|bijuteria|acess[oó]rio|suplemento|skincare|cosm[eé]tico/i.test(
      text,
    )
  ) {
    return "ecommerce";
  }

  if (
    /cl[ií]nica|odonto|dentista|m[eé]dic|sa[úu]de|fisioterapia|psic[oó]log|dermatolog|terapia|hospital|laborat[oó]rio/i.test(
      text,
    )
  ) {
    return "services_health";
  }

  if (/barbe|cabelo|sal[aã]o|est[eé]tica|manicure|sobrancelha|lash|tatuagem/i.test(text)) {
    return "services_beauty";
  }

  if (
    /advoc|advogad|jur[íi]dic|cont[aá]bil|engenharia|arquit|consultoria|imobili|corretor|seguro|software|tecnologia/i.test(
      text,
    )
  ) {
    return "services_pro";
  }

  return "general";
}

export function getNicheDirectives(category: NicheCategory, businessName: string): string {
  switch (category) {
    case "delivery":
      return `
DIRETRIZES DE DELIVERY & GASTRONOMIA (ESTILO IFOOD / CARDÁPIO DIGITAL DE ALTA CONVERSÃO):
- ESTRUTURA DO SITE: Foco em apetite, praticidade e conversão imediata para pedidos pelo WhatsApp.
- TOPBAR & STATUS: Deixe claro o status (Ex: "🟢 Cozinha Aberta · Delivery & Mesa"), tempo médio de preparo/entrega ("30 a 45 min") e raio de entrega ou taxa grátis.
- CARDÁPIO DE PRODUTOS ('highlights'):
  * Crie itens de cardápio com nomes chamativos, descrições ricas em detalhes sensoriais (ingredientes frescos, ponto da carne, queijo derretido, tempero da casa).
  * Preços reais em R$ (Ex: "R$ 42,90", "R$ 68,00").
  * Badges estratégicos: "Mais Pedido", "Combo Especial", "Assinatura do Chef", "Promoção do Dia".
  * Inclua pelo menos 4 a 6 itens divididos em: Combos/Ofertas, Pratos Principais/Lanches, Acompanhamentos e Bebidas/Sobremesas.
- WHATSAPP CTA: "Fazer Pedido pelo WhatsApp" com texto pronto que facilita o pedido.
- PROVA SOCIAL: Destaque nota Google (ex: "★ 4.9 · Mais de 500 pedidos entregues no mês").
- PALETA TÍPICA: Tons apetitosos e nobres: preto profundo (#09090b ou #0d0d11), acentos em âmbar dourado (#f59e0b) ou vermelho brasa (#ef4444).
`;

    case "ecommerce":
      return `
DIRETRIZES DE E-COMMERCE & LOJA VIRTUAL (CATÁLOGO COM CARRINHO):
- ESTRUTURA: Vitrine elegante, foco em estilo de vida, fotos de alta qualidade e facilidade de compra.
- PRODUTOS ('highlights'):
  * Nomes específicos e sofisticados, descrições focadas em benefícios, material e diferenciais.
  * Preços claros (Ex: "R$ 119,90", "R$ 249,00").
  * Badges: "Lançamento", "Frete Grátis", "Destaque", "Últimas Peças".
- BENEFÍCIOS DE COMPRA: Destaque envio rápido para todo o Brasil, parcelamento sem juros e garantia de troca em 7 dias.
- WHATSAPP CTA: "Comprar pelo WhatsApp" ou "Consultar Disponibilidade".
- PALETA TÍPICA: Fundo limpo ou dark minimalista (#0a0a0c), acentos em ouro champanhe (#d97706) ou azul contemporâneo (#38bdf8).
`;

    case "services_health":
      return `
DIRETRIZES DE SAÚDE, CLÍNICAS & ODONTOLOGIA:
- ESTRUTURA: Máxima autoridade, acolhimento, biossegurança e facilidade de agendamento prioritário.
- SERVIÇOS & PROCEDIMENTOS ('highlights'):
  * Nomes claros dos tratamentos, explicando o benefício e transformação na qualidade de vida/sorriso do paciente.
  * Badges: "Procedimento Mais Procurado", "Tecnologia Digital 3D", "Atendimento Sem Dor".
- GATILHOS DE AUTORIDADE: Registro profissional (CRO/CRM), cursos de especialização, tecnologia avançada e conforto clínico.
- PROVA SOCIAL & FAQ: Avaliações reais de pacientes e quebra de dúvidas comuns sobre dor, recuperação e formas de pagamento.
- WHATSAPP CTA: "Agendar Avaliação pelo WhatsApp".
- PALETA TÍPICA: Dark luxury com esmeralda clínico (#10b981) ou azul cyan de alta tecnologia (#00f0ff), fundos em grafite cirúrgico (#09090b).
`;

    case "services_beauty":
      return `
DIRETRIZES DE BARBEARIAS, SALÕES & ESTÉTICA:
- ESTRUTURA: Estilo visual marcante, fotos de alta definição de transformações, clima VIP e exclusividade.
- SERVIÇOS ('highlights'):
  * Combos de estilo (Ex: "Cabelo + Barba Terapia na Toalha Quente", "Harmonização Facial & Glow").
  * Preços claros ou pacotes de assinatura mensal.
  * Badges: "Assinatura VIP", "Mais Escolhido", "Experiência Completa".
- WHATSAPP CTA: "Agendar Horário VIP no WhatsApp".
- PALETA TÍPICA: Barbearia (Preto carvão #09090b + Dourado envelhecido #f59e0b) | Estética (Rose gold, pérola ou dark editorial).
`;

    case "services_pro":
      return `
DIRETRIZES DE ADVOCACIA, ARQUITETURA & SERVIÇOS CORPORATIVOS:
- ESTRUTURA: Rigor técnico inquestionável, posicionamento de alto valor, discrição e segurança jurídica/patrimonial.
- ÁREAS DE ATUAÇÃO ('highlights'):
  * Casos complexos, planejamento preventivo, consultoria sob medida.
  * Badges: "Atuação Nacional", "Especialistas Sênior", "Atendimento Sigiloso".
- PROPOSTA DE VALOR (PUV): Proteger patrimônio, acelerar resultados, evitar prejuízos.
- WHATSAPP CTA: "Falar com Especialista no WhatsApp".
- PALETA TÍPICA: Azul marinho profundo, grafite corporativo (#0c0e14) e acentos em platina ou ouro fino.
`;

    default:
      return `
DIRETRIZES DE NEGÓCIOS GERAIS:
- ESTRUTURA: Comunicação direta, proposta de valor inequívoca, diferenciais competitivos e botão direto para contato.
- PRODUTOS/SERVIÇOS: Itens detalhados com foco na dor do cliente e na solução imediata.
- WHATSAPP CTA: "Solicitar Orçamento no WhatsApp".
`;
  }
}

