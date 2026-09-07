export interface CnaeItem {
  code: string;
  cleanCode: string;
  title: string;
  niche: string;
  popularTerm: string;
  conversionRank: number; // 1 = mais quente para venda de site
}

export const POPULAR_CNAES: CnaeItem[] = [
  {
    code: "8630-5/04",
    cleanCode: "8630504",
    title: "Atividade odontológica",
    niche: "Odontologia",
    popularTerm: "Dentista / Odontologia",
    conversionRank: 1,
  },
  {
    code: "5611-2/01",
    cleanCode: "5611201",
    title: "Restaurantes e similares",
    niche: "Restaurante",
    popularTerm: "Restaurante / Gastronomia",
    conversionRank: 1,
  },
  {
    code: "9602-5/01",
    cleanCode: "9602501",
    title: "Cabeleireiros, barbearias e manicure",
    niche: "Barbearia",
    popularTerm: "Barbearia / Salão de Beleza",
    conversionRank: 1,
  },
  {
    code: "9602-5/02",
    cleanCode: "9602502",
    title: "Atividades de estética e outros serviços de cuidados de beleza",
    niche: "Estética",
    popularTerm: "Clínica de Estética / Harmonização",
    conversionRank: 1,
  },
  {
    code: "8630-5/01",
    cleanCode: "8630501",
    title: "Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos",
    niche: "Clínica",
    popularTerm: "Clínica Médica / Especialidades",
    conversionRank: 2,
  },
  {
    code: "4520-0/01",
    cleanCode: "4520001",
    title: "Serviços de manutenção e reparação mecânica de veículos automotores",
    niche: "Mecânica",
    popularTerm: "Oficina Mecânica / Auto Center",
    conversionRank: 2,
  },
  {
    code: "6821-8/01",
    cleanCode: "6821801",
    title: "Corretagem na compra e venda e avaliação de imóveis",
    niche: "Imobiliária",
    popularTerm: "Imobiliária / Corretor de Imóveis",
    conversionRank: 2,
  },
  {
    code: "9313-1/00",
    cleanCode: "9313100",
    title: "Atividades de condicionamento físico",
    niche: "Academia",
    popularTerm: "Academia / Crossfit / Pilates",
    conversionRank: 2,
  },
  {
    code: "7500-1/00",
    cleanCode: "7500100",
    title: "Atividades veterinárias e pet shops com atendimento",
    niche: "Pet",
    popularTerm: "Clínica Veterinária / Pet Shop",
    conversionRank: 2,
  },
  {
    code: "6911-7/01",
    cleanCode: "6911701",
    title: "Serviços advocatícios",
    niche: "Advocacia",
    popularTerm: "Escritório de Advocacia",
    conversionRank: 3,
  },
  {
    code: "6920-6/01",
    cleanCode: "6920601",
    title: "Atividades de contabilidade",
    niche: "Contabilidade",
    popularTerm: "Escritório de Contabilidade",
    conversionRank: 3,
  },
  {
    code: "7111-1/00",
    cleanCode: "7111100",
    title: "Serviços de arquitetura",
    niche: "Arquitetura",
    popularTerm: "Arquiteto / Design de Interiores",
    conversionRank: 3,
  },
  {
    code: "4120-4/00",
    cleanCode: "4120400",
    title: "Construção de edifícios e reformas",
    niche: "Engenharia",
    popularTerm: "Construtora / Reformas",
    conversionRank: 3,
  },
  {
    code: "8599-6/03",
    cleanCode: "8599603",
    title: "Treinamento em desenvolvimento profissional e gerencial",
    niche: "Cursos",
    popularTerm: "Cursos / Escola Profissionalizante",
    conversionRank: 3,
  },
  {
    code: "7420-0/01",
    cleanCode: "7420001",
    title: "Atividades de produção de fotografias",
    niche: "Fotografia",
    popularTerm: "Fotógrafo / Estúdio Fotográfico",
    conversionRank: 3,
  },
];

export function findCnaeByTerm(term: string): CnaeItem[] {
  const clean = term.toLowerCase().trim();
  if (!clean) return POPULAR_CNAES;
  return POPULAR_CNAES.filter(
    (c) =>
      c.code.includes(clean) ||
      c.cleanCode.includes(clean.replace(/\D/g, "")) ||
      c.title.toLowerCase().includes(clean) ||
      c.popularTerm.toLowerCase().includes(clean) ||
      c.niche.toLowerCase().includes(clean)
  );
}

