import { useState } from "react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Layers,
  MessageSquareHeart,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import type { VideoConfig, TestimonialItem, AboutConfig } from "@/components/public-profile/ModularSections";
import { parseVideoEmbedUrl } from "@/components/public-profile/ModularSections";

interface SectionsEditorProps {
  nicheKey: string;
  companyName: string;
  socialLinks: Record<string, any>;
  onUpdateSocialLinks: (updated: Record<string, any>) => void;
}

export interface DifferentialItem {
  title: string;
  desc: string;
  icon: string;
}

const NICHE_SAMPLE_REVIEWS: Record<string, TestimonialItem[]> = {
  marketing: [
    {
      id: "1",
      author: "Renato Silveira",
      rating: 5,
      text: "Triplicamos o número de orçamentos no primeiro mês de tráfego pago! Gestão séria, transparente e que realmente gera vendas.",
      role: "Diretor Comercial",
    },
    {
      id: "2",
      author: "Camila Guimarães",
      rating: 5,
      text: "Os criativos e as páginas de vendas ficaram surreais. Nosso custo por lead despencou e o faturamento disparou.",
      role: "Fundadora E-commerce",
    },
    {
      id: "3",
      author: "Diego Albuquerque",
      rating: 5,
      text: "Relatórios semanais objetivos e equipe sempre proativa propondo novas ideias. Parceria indispensável para nossa empresa.",
      role: "CEO Startup",
    },
  ],
  contabilidade: [
    {
      id: "1",
      author: "Leandro Vasconcelos",
      rating: 5,
      text: "Abriram meu CNPJ em tempo recorde e o planejamento tributário reduziu nossos impostos em mais de 30% dentro da lei.",
      role: "Empresário",
    },
    {
      id: "2",
      author: "Juliana Barreto",
      rating: 5,
      text: "Atendimento pelo WhatsApp super ágil e sem enrolação. A plataforma online facilita muito o envio de notas e guias.",
      role: "Sócia Administradora",
    },
    {
      id: "3",
      author: "Marcelo Faria",
      rating: 5,
      text: "Segurança total e tranquilidade na gestão fiscal da minha empresa. Recomendo de olhos fechados!",
      role: "Prestador de Serviços",
    },
  ],
  energia_solar: [
    {
      id: "1",
      author: "Carlos Alberto Dias",
      rating: 5,
      text: "Minha conta de luz caiu de R$ 980 para a taxa mínima de R$ 90! Instalação rápida, limpa e homologada sem dor de cabeça.",
      role: "Residencial",
    },
    {
      id: "2",
      author: "Patrícia Viana",
      rating: 5,
      text: "Equipe técnica muito competente e transparente. O aplicativo de monitoramento mostra a economia diária em tempo real.",
      role: "Proprietária Comercial",
    },
    {
      id: "3",
      author: "Rogério Prado",
      rating: 5,
      text: "Melhor investimento que fiz no meu sítio. Painéis de alta eficiência e suporte nota dez em todo o processo.",
      role: "Produtor Rural",
    },
  ],
  advocacia: [
    {
      id: "1",
      author: "Gustavo Pinheiro",
      rating: 5,
      text: "Profissionais extremamente preparados e atenciosos. Resolveram minha causa com agilidade e clareza absoluta.",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Marina Toledo",
      rating: 5,
      text: "Assessoria jurídica impecável. Explicaram cada etapa sem juridiquês e transmitiram segurança total desde o primeiro contato.",
      role: "Empresária",
    },
    {
      id: "3",
      author: "Fernando Castilho",
      rating: 5,
      text: "Excelente escritório! Atuação ética, transparente e com resultado favorável. Recomendo com toda certeza.",
      role: "Cliente",
    },
  ],
  fitness: [
    {
      id: "1",
      author: "Lucas Ferreira",
      rating: 5,
      text: "Estrutura fantástica e aparelhos de ponta! O ambiente é super motivador e os professores acompanham de perto cada treino.",
      role: "Aluno Frequente",
    },
    {
      id: "2",
      author: "Bruna Zanetti",
      rating: 5,
      text: "Perdi 12kg em 6 meses com o acompanhamento dos personais. Espaço amplo, climatizado e muito bem higienizado.",
      role: "Aluna",
    },
    {
      id: "3",
      author: "Matheus Nogueira",
      rating: 5,
      text: "Melhor academia da região. Horários flexíveis e aulas dinâmicas que não deixam a rotina cair na mesmice.",
      role: "Aluno VIP",
    },
  ],
  psicologia: [
    {
      id: "1",
      author: "Ana Beatriz",
      rating: 5,
      text: "A terapia mudou minha relação com a ansiedade. O ambiente é seguro, acolhedor e a profissional tem uma sensibilidade ímpar.",
      role: "Paciente",
    },
    {
      id: "2",
      author: "Rodrigo Diniz",
      rating: 5,
      text: "Atendimento online com a mesma profundidade do presencial. Me ajudou a superar um momento muito desafiador da minha carreira.",
      role: "Paciente Online",
    },
    {
      id: "3",
      author: "Clarice Fontes",
      rating: 5,
      text: "Escuta atenta, sem julgamentos e com técnicas práticas que me ajudam no dia a dia. Recomendo de coração.",
      role: "Paciente",
    },
  ],
  petshop: [
    {
      id: "1",
      author: "Sabrina Meireles",
      rating: 5,
      text: "Meu golden volta do banho e tosa super feliz e perfumado! Dá para ver o carinho e o cuidado que eles têm com cada animal.",
      role: "Tutora do Thor",
    },
    {
      id: "2",
      author: "Fábio Cunha",
      rating: 5,
      text: "Veterinários excelentes e produtos de primeira qualidade. Atendimento rápido e espaço muito limpo.",
      role: "Tutor da Luna",
    },
    {
      id: "3",
      author: "Carla Esteves",
      rating: 5,
      text: "Entrega de ração sempre pontual e os preços são ótimos. É o petshop oficial da minha família há anos.",
      role: "Cliente",
    },
  ],
  construcao: [
    {
      id: "1",
      author: "Eduardo Camargo",
      rating: 5,
      text: "Entregaram minha reforma 5 dias antes do prazo previsto e exatamente dentro do orçamento combinado! Equipe muito caprichosa.",
      role: "Proprietário Residencial",
    },
    {
      id: "2",
      author: "Renata Barcellos",
      rating: 5,
      text: "Acabamento de alto padrão e acompanhamento diário com fotos e relatórios da obra. Zero estresse!",
      role: "Arquiteta Parceira",
    },
    {
      id: "3",
      author: "Hélio Morais",
      rating: 5,
      text: "Profissionais responsáveis e organizados. O canteiro ficava sempre limpo e os materiais foram aproveitados ao máximo.",
      role: "Comerciante",
    },
  ],
  imobiliaria: [
    {
      id: "1",
      author: "Tiago Sampaio",
      rating: 5,
      text: "Encontrei o apartamento dos meus sonhos em menos de duas semanas. Assessoria jurídica ágil e negociação impecável.",
      role: "Comprador",
    },
    {
      id: "2",
      author: "Luciana Paiva",
      rating: 5,
      text: "Venderam meu imóvel pelo valor de avaliação de mercado sem enrolação. Muito profissionais e transparentes.",
      role: "Vendedora",
    },
    {
      id: "3",
      author: "André Valente",
      rating: 5,
      text: "Excelente carteira de lançamentos e corretores que realmente entendem do perfil e da rentabilidade do investimento.",
      role: "Investidor Imobiliário",
    },
  ],
  seguros: [
    {
      id: "1",
      author: "Priscila Monteiro",
      rating: 5,
      text: "Quando bati o carro, a assistência da corretora resolveu tudo no mesmo dia! Carro reserva liberado e guincho em 20 minutos.",
      role: "Segurada Auto",
    },
    {
      id: "2",
      author: "Wagner Bastos",
      rating: 5,
      text: "Cotação clara e sem letras miúdas. Conseguiram uma apólice mais completa pagando menos do que eu pagava antes.",
      role: "Empresário",
    },
    {
      id: "3",
      author: "Flávia Rezende",
      rating: 5,
      text: "Contratei o plano de saúde empresarial da minha equipe com eles. Atendimento consultivo e suporte exemplar.",
      role: "Diretora de RH",
    },
  ],
  tecnologia: [
    {
      id: "1",
      author: "Guilherme Peixoto",
      rating: 5,
      text: "Recuperaram todos os dados do meu notebook que não ligava mais. Serviço rápido, profissional e com garantia!",
      role: "Designer Gráfico",
    },
    {
      id: "2",
      author: "Tatiane Duarte",
      rating: 5,
      text: "Estruturaram a rede e o servidor da nossa empresa. Zero quedas e suporte técnico sempre pronto para atender.",
      role: "Gerente de Operações",
    },
    {
      id: "3",
      author: "Danilo Antunes",
      rating: 5,
      text: "Troca de tela e bateria do meu celular feita em menos de 1 hora com peça de qualidade original. Recomendo muito!",
      role: "Cliente",
    },
  ],
  nutricao: [
    {
      id: "1",
      author: "Viviane Soares",
      rating: 5,
      text: "Primeira vez que consigo seguir uma dieta sem passar fome! Emagreci 8kg de forma saudável e comendo o que gosto.",
      role: "Paciente",
    },
    {
      id: "2",
      author: "Caio Figueiredo",
      rating: 5,
      text: "Melhorou meu rendimento nos treinos e minha disposição no trabalho. O acompanhamento no WhatsApp faz toda a diferença.",
      role: "Atleta Amador",
    },
    {
      id: "3",
      author: "Beatriz Lins",
      rating: 5,
      text: "Exame de bioimpedância detalhado e plano super prático de preparar na correria do dia a dia. Excelente nutricionista!",
      role: "Advogada",
    },
  ],
  sorveteria: [
    {
      id: "1",
      author: "Cláudio Meneses",
      rating: 5,
      text: "O melhor açaí da cidade disparado! Textura perfeita, cremosa e os acompanhamentos são sempre frescos e de qualidade.",
      role: "Cliente Frequente",
    },
    {
      id: "2",
      author: "Mirian Barbosa",
      rating: 5,
      text: "Gelatos artesanais no nível das melhores gelaterias italianas. O de pistache é simplesmente divino!",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Vitor Fagundes",
      rating: 5,
      text: "Ambiente muito agradável para ir com as crianças no final da tarde. Atendimento simpático e rápido.",
      role: "Pai de Família",
    },
  ],
  bebidas: [
    {
      id: "1",
      author: "Otávio Bueno",
      rating: 5,
      text: "Cerveja trincando de gelada entregue em menos de 25 minutos no churrasco de domingo! Salvou a festa dos amigos.",
      role: "Cliente Frequente",
    },
    {
      id: "2",
      author: "Silvana Brandão",
      rating: 5,
      text: "Ótima carta de vinhos e espumantes para eventos e preços muito competitivos. Peço toda semana pelo WhatsApp.",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Igor Brandão",
      rating: 5,
      text: "Combo de destilados e gelo no ponto certo. Praticidade total e atendimento de primeira linha.",
      role: "Cliente",
    },
  ],
  costura: [
    {
      id: "1",
      author: "Eliane Castelo",
      rating: 5,
      text: "Ajustou meu vestido de madrinha e o caimento ficou perfeito no meu corpo! Nem dava para perceber a costura de tão caprichosa.",
      role: "Madrinha de Casamento",
    },
    {
      id: "2",
      author: "Márcia Godoy",
      rating: 5,
      text: "Profissional extremamente pontual e atenciosa. Deixou minhas calças e ternos na medida exata.",
      role: "Executiva",
    },
    {
      id: "3",
      author: "Débora Naves",
      rating: 5,
      text: "Ateliê maravilhoso! Fez a barra e o forro de peças delicadas com perfeição. Recomendo a todos.",
      role: "Cliente",
    },
  ],
  oficina: [
    {
      id: "1",
      author: "Marcos Ribeiro",
      rating: 5,
      text: "Diagnóstico preciso sem enrolação. Identificaram o barulho na suspensão que outras duas oficinas não achavam. Preço justo!",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Patrícia Moura",
      rating: 5,
      text: "Mecânica de total confiança. Explicaram tudo o que precisava ser trocado e entregaram o carro limpo e no prazo.",
      role: "Motorista",
    },
    {
      id: "3",
      author: "Sérgio Abreu",
      rating: 5,
      text: "Revisão preventiva completa para viajar com a família. Peças de primeira linha e atendimento nota 10.",
      role: "Cliente Fiel",
    },
  ],
  auto: [
    {
      id: "1",
      author: "Marcos Ribeiro",
      rating: 5,
      text: "Diagnóstico preciso sem enrolação. Identificaram o barulho na suspensão que outras duas oficinas não achavam. Preço justo!",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Patrícia Moura",
      rating: 5,
      text: "Mecânica de total confiança. Explicaram tudo o que precisava ser trocado e entregaram o carro limpo e no prazo.",
      role: "Motorista",
    },
    {
      id: "3",
      author: "Sérgio Abreu",
      rating: 5,
      text: "Revisão preventiva completa para viajar com a família. Peças de primeira linha e atendimento nota 10.",
      role: "Cliente Fiel",
    },
  ],
  autonomo: [
    {
      id: "1",
      author: "Jorge Aragão",
      rating: 5,
      text: "Serviço impecável! Chegou no horário marcado, fez a instalação com muita perícia e limpou tudo ao final. Nota 10!",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Denise Amaral",
      rating: 5,
      text: "Profissional educado, transparente e que realmente entende do ofício. Orçamento justo e sem surpresas na entrega.",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Paulo Sérgio",
      rating: 5,
      text: "Resolveu o problema elétrico que vinha dando dor de cabeça há meses. Rapidez e garantia no que faz.",
      role: "Comerciante",
    },
  ],
  barbearia: [
    {
      id: "1",
      author: "Lucas Silveira",
      rating: 5,
      text: "Melhor corte da cidade! Ambiente de primeira, atendimento pontual e a cerveja sempre gelada. Sou cliente fiel há mais de um ano.",
      role: "Cliente Frequente",
    },
    {
      id: "2",
      author: "Rodrigo Martins",
      rating: 5,
      text: "Profissionais excelentes que realmente entendem de barba e visagismo. O acabamento fica impecável e dura bastante.",
      role: "Empresário",
    },
    {
      id: "3",
      author: "Gabriel Souza",
      rating: 5,
      text: "Atendimento top do início ao fim. Agendamento super prático pelo WhatsApp e sem filas de espera.",
      role: "Cliente",
    },
  ],
  beleza: [
    {
      id: "1",
      author: "Juliana Ferreira",
      rating: 5,
      text: "Espaço maravilhoso e acolhedor! Fiz mechas e hidratação e o resultado superou todas as minhas expectativas. Me senti renovada!",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Carolina Lima",
      rating: 5,
      text: "Profissionais super capacitadas e produtos de altíssima qualidade. Minhas unhas e cabelo nunca estiveram tão saudáveis.",
      role: "Advogada",
    },
    {
      id: "3",
      author: "Amanda Costa",
      rating: 5,
      text: "Atendimento impecável com hora marcada. Café delicioso e um carinho enorme com cada detalhe.",
      role: "Cliente VIP",
    },
  ],
  odontologia: [
    {
      id: "1",
      author: "Marcos Vinícius",
      rating: 5,
      text: "Excelente clínica! Fiz clareamento e restauração com zero dor e muita precisão. Equipe extremamente cuidadosa.",
      role: "Paciente",
    },
    {
      id: "2",
      author: "Tatiana Neves",
      rating: 5,
      text: "Doutor super atencioso, explicou cada etapa do tratamento com muita clareza. Estrutura moderna e muito higienizada.",
      role: "Professora",
    },
    {
      id: "3",
      author: "Bruno Henrique",
      rating: 5,
      text: "Tinha receio de ir ao dentista mas aqui me senti super seguro e acolhido. Atendimento pontual e nota 10!",
      role: "Paciente",
    },
  ],
  clinica: [
    {
      id: "1",
      author: "Dra. Fernanda Ramos",
      rating: 5,
      text: "Pontualidade britânica e profissionais muito humanos. Consulta detalhada e ambiente muito seguro e confortável.",
      role: "Paciente",
    },
    {
      id: "2",
      author: "Marcelo Tavares",
      rating: 5,
      text: "Estrutura de ponta com exames rápidos e diagnóstico preciso. Faz toda a diferença no acompanhamento da minha família.",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Paula Medeiros",
      rating: 5,
      text: "Atendimento acolhedor desde a recepção até o consultório médico. Passa muita seriedade e tranquilidade.",
      role: "Paciente",
    },
  ],
  restaurante: [
    {
      id: "1",
      author: "Felipe Alencar",
      rating: 5,
      text: "Comida espetacular com ingredientes frescos e tempero no ponto certo! A sobremesa é simplesmente inesquecível.",
      role: "Crítico Gastronômico",
    },
    {
      id: "2",
      author: "Larissa Pires",
      rating: 5,
      text: "Ambiente aconchegante, carta de vinhos incrível e atendimento impecável. Perfeito para comemorações e jantares.",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Eduardo Rocha",
      rating: 5,
      text: "Uma das melhores experiências gastronômicas da cidade. Pratos muito bem servidos e sabor marcante.",
      role: "Cliente",
    },
  ],
  delivery: [
    {
      id: "1",
      author: "Thiago Mendes",
      rating: 5,
      text: "Chegou super rápido, quentinho e crocante! Embalagem impecável que mantém o lanche intacto.",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Jéssica Andrade",
      rating: 5,
      text: "Sabor maravilhoso e recheio super caprichado. O atendimento no WhatsApp foi rápido e muito cordial.",
      role: "Cliente Frequente",
    },
    {
      id: "3",
      author: "Rafael Gomes",
      rating: 5,
      text: "Melhor opção da região para pedir no fim de semana! A qualidade é sempre impecável.",
      role: "Cliente",
    },
  ],
  loja: [
    {
      id: "1",
      author: "Beatriz Fonseca",
      rating: 5,
      text: "Peças de altíssima qualidade com caimento perfeito! O envio foi super rápido e a embalagem veio cheirosa.",
      role: "Cliente",
    },
    {
      id: "2",
      author: "Vanessa Cruz",
      rating: 5,
      text: "Atendimento maravilhoso, tiraram todas as minhas dúvidas de tamanho com muita paciência. Amei tudo!",
      role: "Cliente",
    },
    {
      id: "3",
      author: "Gabriela Motta",
      rating: 5,
      text: "Produtos originais, entrega rápida e pós-venda exemplar. Com certeza comprarei novamente.",
      role: "Cliente Fiel",
    },
  ],
};

const DEFAULT_REVIEWS: TestimonialItem[] = [
  {
    id: "1",
    author: "Mariana Santos",
    rating: 5,
    text: "Experiência impecável do início ao fim! Profissionalismo, atenção aos detalhes e excelente custo-benefício.",
    role: "Cliente",
  },
  {
    id: "2",
    author: "Carlos Eduardo",
    rating: 5,
    text: "Serviço de altíssimo nível. Resolveram tudo com muita rapidez e cordialidade. Recomendo com certeza!",
    role: "Cliente",
  },
  {
    id: "3",
    author: "Fernanda Silveira",
    rating: 5,
    text: "Superou todas as minhas expectativas tanto no atendimento quanto no resultado entregue. Nota dez!",
    role: "Cliente",
  },
];

const NICHE_SAMPLE_DIFFERENTIALS: Record<string, { badge: string; title: string; items: DifferentialItem[] }> = {
  marketing: {
    badge: "Alta Performance em Vendas & Tráfego",
    title: "Pilares da Nossa Assessoria",
    items: [
      { title: "Estratégia Orientada a Dados", desc: "Foco em ROI e geração contínua de novos clientes qualificados", icon: "badge" },
      { title: "Criativos de Alta Conversão", desc: "Copywriting persuasivo e anúncios audiovisuais envolventes", icon: "sparkles" },
      { title: "Gestão Ativa de Tráfego", desc: "Otimização diária no Google, Meta Ads e TikTok", icon: "shield" },
      { title: "Relatórios Transparentes", desc: "Acompanhamento claro das principais métricas do seu negócio", icon: "check" },
    ],
  },
  contabilidade: {
    badge: "Contabilidade Estratégica & Finanças",
    title: "Diferenciais do Nosso Escritório",
    items: [
      { title: "Planejamento Tributário", desc: "Redução legal de impostos para você faturar com tranquilidade", icon: "shield" },
      { title: "Abertura e Regularização Ágil", desc: "Processo 100% digital, sem burocracia e com rapidez", icon: "check" },
      { title: "Atendimento Consultivo", desc: "Tire dúvidas direto com contadores especialistas pelo WhatsApp", icon: "heart" },
      { title: "Tecnologia e Zero Papel", desc: "Gestão financeira moderna integrada à nuvem", icon: "badge" },
    ],
  },
  energia_solar: {
    badge: "Energia Solar Inteligente & Sustentável",
    title: "Por Que Escolher Nossa Energia",
    items: [
      { title: "Economia de até 95% na Conta", desc: "Gere sua própria energia limpa e livre-se dos aumentos", icon: "sparkles" },
      { title: "Equipamentos de Primeira Linha", desc: "Painéis e inversores de alta eficiência certificados pelo Inmetro", icon: "shield" },
      { title: "Instalação Homologada", desc: "Engenharia especializada com aprovação rápida na concessionária", icon: "badge" },
      { title: "Garantia de Longo Prazo", desc: "Até 25 anos de eficiência garantida e suporte pós-venda", icon: "check" },
    ],
  },
  advocacia: {
    badge: "Excelência & Segurança Jurídica",
    title: "Nossa Atuação Jurídica",
    items: [
      { title: "Atuação Especializada", desc: "Foco em soluções jurídicas assertivas e preventivas", icon: "badge" },
      { title: "Sigilo e Confidencialidade", desc: "Rigor ético absoluto e proteção total dos seus interesses", icon: "shield" },
      { title: "Comunicação Clara e Direta", desc: "Acompanhe seu processo sem juridiquês e com transparência", icon: "heart" },
      { title: "Compromisso com o Seu Direito", desc: "Dedicação integral para alcançar o melhor resultado jurídico", icon: "check" },
    ],
  },
  construcao: {
    badge: "Engenharia, Reformas & Construção Civil",
    title: "Nosso Compromisso com Sua Obra",
    items: [
      { title: "Projetos com Rigor Técnico", desc: "Engenharia de precisão com cumprimento integral de normas", icon: "shield" },
      { title: "Gestão de Prazos e Custos", desc: "Planejamento detalhado para sua obra sem atrasos ou surpresas", icon: "badge" },
      { title: "Mão de Obra Qualificada", desc: "Profissionais experientes em reformas e construções civis", icon: "check" },
      { title: "Acabamento de Alto Padrão", desc: "Cuidado milimétrico em cada detalhe construtivo", icon: "sparkles" },
    ],
  },
  imobiliaria: {
    badge: "Imóveis Selecionados & Assessoria VIP",
    title: "Sua Conquista em Boas Mãos",
    items: [
      { title: "Carteira Exclusiva de Imóveis", desc: "Lançamentos, residenciais e oportunidades de alto potencial", icon: "badge" },
      { title: "Avaliação Precisa de Mercado", desc: "Segurança para comprar, vender ou alugar no valor ideal", icon: "shield" },
      { title: "Assessoria Jurídica Completa", desc: "Análise documental rigorosa para uma negociação 100% segura", icon: "check" },
      { title: "Atendimento Personalizado", desc: "Consultores dedicados a entender exatamente o que você busca", icon: "heart" },
    ],
  },
  seguros: {
    badge: "Proteção Completa & Tranquilidade Familiar",
    title: "Por Que Escolher Nossa Corretora",
    items: [
      { title: "Consultoria Especializada", desc: "Análise precisa do seu perfil para escolher a melhor apólice", icon: "shield" },
      { title: "As Maiores Seguradoras", desc: "Parceria com as principais companhias do mercado nacional", icon: "badge" },
      { title: "Suporte Total em Sinistros", desc: "Atendimento rápido e descomplicado na hora que você mais precisa", icon: "heart" },
      { title: "Planos Sob Medida", desc: "Coberturas personalizadas para sua vida, família ou patrimônio", icon: "check" },
    ],
  },
  tecnologia: {
    badge: "Soluções em TI & Assistência Especializada",
    title: "Excelência Técnica para Seu Negócio",
    items: [
      { title: "Diagnóstico Rápido e Preciso", desc: "Análise técnica aprofundada para resolver na raiz do problema", icon: "shield" },
      { title: "Técnicos Certificados", desc: "Equipe capacitada em hardware, sistemas, redes e segurança", icon: "badge" },
      { title: "Peças de Primeira Linha", desc: "Garantia comprovada de procedência e durabilidade", icon: "check" },
      { title: "Garantia e Suporte Ágil", desc: "Segurança e atendimento contínuo para você e sua empresa", icon: "heart" },
    ],
  },
  nutricao: {
    badge: "Nutrição Clínica & Estilo de Vida Saudável",
    title: "Pilares do Acompanhamento Nutricional",
    items: [
      { title: "Plano Individualizado", desc: "Dieta sob medida sem extremismos, respeitando sua rotina", icon: "badge" },
      { title: "Avaliação Bioimpedância", desc: "Análise completa de composição corporal e métricas", icon: "shield" },
      { title: "Acompanhamento Contínuo", desc: "Tire dúvidas direto pelo WhatsApp durante seu processo", icon: "heart" },
      { title: "Foco em Saúde e Longevidade", desc: "Metodologia científica para resultados duradouros", icon: "sparkles" },
    ],
  },
  petshop: {
    badge: "Amor, Cuidado & Saúde Para Seu Pet",
    title: "O Melhor Para o Seu Melhor Amigo",
    items: [
      { title: "Carinho e Cuidado Animal", desc: "Tratamento humanizado com amor, paciência e respeito", icon: "heart" },
      { title: "Produtos e Rações Premium", desc: "As melhores marcas e linhas terapêuticas do mercado", icon: "bag" },
      { title: "Ambiente Seguro e Limpo", desc: "Espaço higienizado para banho, tosa e bem-estar pet", icon: "shield" },
      { title: "Equipe Apaixonada por Pets", desc: "Profissionais dedicados ao conforto do seu melhor amigo", icon: "badge" },
    ],
  },
  barbearia: {
    badge: "Estilo Masculino & Barbearia Premium",
    title: "Nossos Diferenciais Barber",
    items: [
      { title: "Visagismo Masculino", desc: "Cortes e barba alinhados ao formato do seu rosto e estilo", icon: "sparkles" },
      { title: "Barba Terapia Completa", desc: "Relaxamento com toalha quente, óleos essenciais e hidratação", icon: "heart" },
      { title: "Ambiente Clássico e Exclusivo", desc: "Espaço climatizado com café, cerveja e boa conversa", icon: "badge" },
      { title: "Hora Marcada sem Espera", desc: "Agendamento rápido e respeito absoluto ao seu tempo", icon: "clock" },
    ],
  },
  sorveteria: {
    badge: "Gelatos Artesanais & O Melhor Açaí",
    title: "Sabor Incomparável em Cada Taça",
    items: [
      { title: "Receitas Artesanais", desc: "Preparo diário com ingredientes nobres e frutas selecionadas", icon: "badge" },
      { title: "Açaí Puro e Cremoso", desc: "Sabor incomparável com dezenas de opções de toppings frescos", icon: "sparkles" },
      { title: "Opções Especiais", desc: "Delícias sem açúcar e sem lactose para todos aproveitarem", icon: "check" },
      { title: "Ambiente para a Família", desc: "Espaço acolhedor e refrescante para momentos especiais", icon: "heart" },
    ],
  },
  bebidas: {
    badge: "Distribuidora & Adega Selecionada",
    title: "Sua Comemoração Começa Aqui",
    items: [
      { title: "Bebidas Trincando de Geladas", desc: "Cervejas, chopps e refrigerantes na temperatura ideal", icon: "badge" },
      { title: "Adega e Rótulos Especiais", desc: "Vinhos, destilados e drinks para qualquer celebração", icon: "sparkles" },
      { title: "Entrega Expressa e Segura", desc: "Seu pedido chega rápido para sua festa nunca parar", icon: "shield" },
      { title: "Preço Justo e Promoções", desc: "Economia garantida para festas, eventos e finais de semana", icon: "check" },
    ],
  },
  costura: {
    badge: "Alta Costura, Ajustes & Ateliê Sob Medida",
    title: "Cuidado no Detalhe de Cada Peça",
    items: [
      { title: "Ajustes com Acabamento Perfeito", desc: "Costuras invisíveis e caimento impecável nas suas roupas", icon: "badge" },
      { title: "Alta Costura e Sob Medida", desc: "Vestidos de festa, ternos e peças exclusivas", icon: "sparkles" },
      { title: "Atendimento Cuidadoso", desc: "Prova detalhada de peças para valorizar seu estilo", icon: "heart" },
      { title: "Pontualidade na Entrega", desc: "Seu look pronto no prazo prometido, sem atrasos", icon: "clock" },
    ],
  },
  auto: {
    badge: "Centro Automotivo & Revisão de Precisão",
    title: "Por Que Confiar Seu Veículo Aqui",
    items: [
      { title: "Diagnóstico Computadorizado", desc: "Scanner automotivo de última geração para precisão máxima", icon: "shield" },
      { title: "Peças de Primeira Linha", desc: "Componentes com garantia de procedência e durabilidade", icon: "badge" },
      { title: "Mecânicos Especialistas", desc: "Equipe capacitada em revisões preventivas e reparos avançados", icon: "check" },
      { title: "Orçamento Transparente", desc: "Aprovação prévia detalhada sem serviços desnecessários", icon: "heart" },
    ],
  },
  autonomo: {
    badge: "Serviços Especializados & Confiança",
    title: "Compromisso com o Seu Projeto",
    items: [
      { title: "Serviço com Garantia e Rapidez", desc: "Execução profissional com responsabilidade e precisão", icon: "shield" },
      { title: "Orçamento Transparente", desc: "Preço justo e sem cobranças indevidas ou surpresas", icon: "check" },
      { title: "Pontualidade e Compromisso", desc: "Atendimento ágil cumprindo estritamente o combinado", icon: "clock" },
      { title: "Materiais de Primeira Linha", desc: "Durabilidade e acabamento que valorizam seu patrimônio", icon: "badge" },
    ],
  },
  loja: {
    badge: "Coleção Exclusiva & Pronta Entrega",
    title: "Diferenciais da Nossa Loja",
    items: [
      { title: "Envio Rápido & Seguro", desc: "Entrega garantida para todo o Brasil com código de rastreamento", icon: "shield" },
      { title: "Produtos Selecionados", desc: "Peças originais, alta durabilidade e procedência certificada", icon: "bag" },
      { title: "Compra 100% Segura", desc: "Pagamentos facilitados via Pix e cartões em ambiente protegido", icon: "check" },
      { title: "Atendimento Humanizado", desc: "Tire dúvidas de medidas e pedidos direto pelo WhatsApp", icon: "heart" },
    ],
  },
  beleza: {
    badge: "Excelência em Beleza & Estética VIP",
    title: "Nosso Padrão de Cuidado",
    items: [
      { title: "Hora Marcada", desc: "Pontualidade, sem filas e com respeito total ao seu tempo", icon: "clock" },
      { title: "Cosméticos de Ponta", desc: "Tratamentos com marcas consagradas de alta performance", icon: "sparkles" },
      { title: "Ambiente Acolhedor", desc: "Espaço exclusivo, climatizado e pensado para o seu relaxamento", icon: "badge" },
      { title: "Especialistas em Visagismo", desc: "Procedimentos personalizados que valorizam sua beleza natural", icon: "heart" },
    ],
  },
  delivery: {
    badge: "Sabor Artesanal & Entrega Rápida",
    title: "Nosso Padrão de Qualidade",
    items: [
      { title: "Ingredientes Frescos", desc: "Receitas artesanais preparadas na hora com rigor e carinho", icon: "badge" },
      { title: "Entrega Quentinha", desc: "Embalagens térmicas especiais que conservam a crocância e o sabor", icon: "shield" },
      { title: "Sabor Incomparável", desc: "Tempero exclusivo e ponto perfeito aprovado pelos clientes", icon: "sparkles" },
      { title: "Higiene Impecável", desc: "Cozinha com rigor absoluto em normas de segurança alimentar", icon: "check" },
    ],
  },
  restaurante: {
    badge: "Gastronomia & Experiência de Alto Padrão",
    title: "Nossos Diferenciais Gastronômicos",
    items: [
      { title: "Culinária Autoral", desc: "Pratos elaborados pelo chef com ingredientes selecionados", icon: "badge" },
      { title: "Carta Selecionada", desc: "Harmonização de bebidas, vinhos e drinks artesanais", icon: "sparkles" },
      { title: "Ambiente Sofisticado", desc: "Espaço intimista ideal para comemorações e momentos especiais", icon: "heart" },
      { title: "Atendimento de Excelência", desc: "Equipe treinada para proporcionar uma experiência memorável", icon: "check" },
    ],
  },
  clinica: {
    badge: "Saúde & Cuidado com Excelência",
    title: "Por Que Escolher Nossa Clínica",
    items: [
      { title: "Especialistas Certificados", desc: "Corpo médico altamente qualificado e em constante atualização", icon: "badge" },
      { title: "Tecnologia e Precisão", desc: "Equipamentos modernos para diagnósticos rápidos e assertivos", icon: "shield" },
      { title: "Biossegurança Total", desc: "Protocolos rigorosos de higienização e esterilização", icon: "check" },
      { title: "Atendimento Humanizado", desc: "Escuta atenta e plano de saúde individualizado", icon: "heart" },
    ],
  },
  odontologia: {
    badge: "Odontologia Moderna & Humanizada",
    title: "Seu Sorriso em Boas Mãos",
    items: [
      { title: "Tratamentos Confortáveis", desc: "Técnicas e anestesias modernas para o seu conforto total", icon: "shield" },
      { title: "Estética & Função", desc: "Alinhamento, clareamento e implantes com precisão milimétrica", icon: "sparkles" },
      { title: "Equipamentos Digitais", desc: "Planejamento virtual do sorriso e radiografia digital", icon: "badge" },
      { title: "Facilidade de Pagamento", desc: "Condições acessíveis para você realizar seu tratamento", icon: "check" },
    ],
  },
  fitness: {
    badge: "Treinos & Alta Performance",
    title: "Estrutura para Seus Resultados",
    items: [
      { title: "Maquinário de Ponta", desc: "Equipamentos ergonômicos e biomecânica avançada", icon: "shield" },
      { title: "Orientação Técnica", desc: "Acompanhamento de instrutores para treinar com segurança", icon: "badge" },
      { title: "Espaço Climatizado", desc: "Ambiente amplo, energizante e focado na sua evolução", icon: "sparkles" },
      { title: "Planos Flexíveis", desc: "Liberdade para treinar no seu ritmo com planos sob medida", icon: "check" },
    ],
  },
  psicologia: {
    badge: "Espaço Seguro de Acolhimento & Saúde Mental",
    title: "Pilares do Nosso Atendimento",
    items: [
      { title: "Sigilo & Ética (CRP)", desc: "Ambiente seguro e confidencialidade assegurada por lei", icon: "shield" },
      { title: "Atendimento Acolhedor", desc: "Escuta empática, sem julgamentos e focada no seu bem-estar", icon: "heart" },
      { title: "Presencial & Online", desc: "Flexibilidade para realizar sua sessão onde preferir", icon: "check" },
      { title: "Abordagem Científica", desc: "Técnicas baseadas em evidências para o seu desenvolvimento", icon: "sparkles" },
    ],
  },
  oficina: {
    badge: "Centro Automotivo & Revisão de Precisão",
    title: "Por Que Confiar Seu Veículo Aqui",
    items: [
      { title: "Diagnóstico Computadorizado", desc: "Scanner automotivo de última geração para precisão máxima", icon: "shield" },
      { title: "Peças de Primeira Linha", desc: "Componentes com garantia de procedência e durabilidade", icon: "badge" },
      { title: "Mecânicos Especialistas", desc: "Equipe capacitada em revisões preventivas e reparos avançados", icon: "check" },
      { title: "Orçamento Transparente", desc: "Aprovação prévia detalhada sem serviços desnecessários", icon: "heart" },
    ],
  },
  geral: {
    badge: "Qualidade Premium Garantida",
    title: "Nosso Padrão de Atendimento",
    items: [
      { title: "Atendimento de Confiança", desc: "Compromisso com pontualidade, seriedade e respeito", icon: "badge" },
      { title: "Qualidade Comprovada", desc: "Serviço executado com esmero e materiais de primeira linha", icon: "shield" },
      { title: "Cuidado no Detalhe", desc: "Atenção máxima às suas reais necessidades", icon: "sparkles" },
      { title: "Garantia e Satisfação", desc: "Suporte dedicado antes, durante e depois da entrega", icon: "heart" },
    ],
  },
};

export function SectionsEditor({
  nicheKey,
  companyName,
  socialLinks,
  onUpdateSocialLinks,
}: SectionsEditorProps) {
  const videoConfig: VideoConfig = socialLinks.video_embed || {
    enabled: false,
    url: "",
    title: "Conheça Nosso Espaço",
    caption: "",
  };

  const testimonials: TestimonialItem[] = Array.isArray(socialLinks.testimonials)
    ? socialLinks.testimonials
    : [];
  const showTestimonials = socialLinks.show_testimonials !== false;

  const aboutConfig: AboutConfig = socialLinks.about_section || {
    enabled: false,
    title: `Sobre a ${companyName}`,
    text: "",
    highlights: ["Atendimento personalizado", "Profissionais qualificados", "Garantia de qualidade"],
  };

  const ctaPulse: boolean = Boolean(socialLinks.cta_pulse_glow);

  const vipBadge: string = socialLinks.vip_badge || "";
  const differentialsTitle: string = socialLinks.differentials_title || "";
  const differentials: DifferentialItem[] = Array.isArray(socialLinks.differentials) && socialLinks.differentials.length > 0
    ? socialLinks.differentials
    : (NICHE_SAMPLE_DIFFERENTIALS[nicheKey] || NICHE_SAMPLE_DIFFERENTIALS.geral).items;

  // Updates
  const updateVideo = (partial: Partial<VideoConfig>) => {
    onUpdateSocialLinks({
      ...socialLinks,
      video_embed: { ...videoConfig, ...partial },
    });
  };

  const updateTestimonials = (items: TestimonialItem[], enabled = showTestimonials) => {
    onUpdateSocialLinks({
      ...socialLinks,
      testimonials: items,
      show_testimonials: enabled,
    });
  };

  const updateAbout = (partial: Partial<AboutConfig>) => {
    onUpdateSocialLinks({
      ...socialLinks,
      about_section: { ...aboutConfig, ...partial },
    });
  };

  const toggleCtaPulse = () => {
    onUpdateSocialLinks({
      ...socialLinks,
      cta_pulse_glow: !ctaPulse,
    });
  };

  const updateVipBadge = (badge: string) => {
    onUpdateSocialLinks({
      ...socialLinks,
      vip_badge: badge,
    });
  };

  const updateDifferentialsTitle = (title: string) => {
    onUpdateSocialLinks({
      ...socialLinks,
      differentials_title: title,
    });
  };

  const updateDifferentialItem = (index: number, field: keyof DifferentialItem, value: string) => {
    const next = [...differentials];
    next[index] = { ...next[index], [field]: value };
    onUpdateSocialLinks({
      ...socialLinks,
      differentials: next,
    });
  };

  const handleGenerateSampleDifferentials = () => {
    const preset = NICHE_SAMPLE_DIFFERENTIALS[nicheKey] || NICHE_SAMPLE_DIFFERENTIALS.geral;
    onUpdateSocialLinks({
      ...socialLinks,
      vip_badge: preset.badge,
      differentials_title: preset.title,
      differentials: preset.items,
    });
  };

  const handleGenerateSampleReviews = () => {
    const list = NICHE_SAMPLE_REVIEWS[nicheKey] || DEFAULT_REVIEWS;
    updateTestimonials(list, true);
  };

  const handleAddReview = () => {
    const newRev: TestimonialItem = {
      id: crypto.randomUUID(),
      author: "Novo Cliente",
      rating: 5,
      text: "Atendimento excepcional e resultado fantástico. Recomendo muito!",
      role: "Cliente",
    };
    updateTestimonials([...testimonials, newRev], true);
  };

  const handleRemoveReview = (index: number) => {
    const next = testimonials.filter((_, i) => i !== index);
    updateTestimonials(next);
  };

  const handleReviewChange = (index: number, field: keyof TestimonialItem, value: any) => {
    const next = [...testimonials];
    next[index] = { ...next[index], [field]: value };
    updateTestimonials(next);
  };

  const parsedVideo = videoConfig.url ? parseVideoEmbedUrl(videoConfig.url) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
          Mídia & Blocos Extras
        </p>
        <h2 className="text-lg font-bold text-foreground">
          Seções Modulares de Conversão
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adicione vídeos de apresentação, depoimentos com estrelas e história da empresa para aumentar o valor percebido do seu BioLink.
        </p>
      </div>

      {/* 1. SEÇÃO DE VÍDEO */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vídeo em Destaque</h3>
              <p className="text-[11px] text-muted-foreground">
                YouTube, Shorts, Vimeo ou link direto MP4
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={videoConfig.enabled}
              onChange={(e) => updateVideo({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {videoConfig.enabled && (
          <div className="space-y-3 pt-2 border-t border-border/50 animate-fade-in-up">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Link do Vídeo
              </label>
              <input
                type="text"
                value={videoConfig.url}
                onChange={(e) => updateVideo({ url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {parsedVideo && (
                <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Link reconhecido ({parsedVideo.type.toUpperCase()})
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Título da Seção
                </label>
                <input
                  type="text"
                  value={videoConfig.title || ""}
                  onChange={(e) => updateVideo({ title: e.target.value })}
                  placeholder="Conheça nosso espaço"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Legenda (Opcional)
                </label>
                <input
                  type="text"
                  value={videoConfig.caption || ""}
                  onChange={(e) => updateVideo({ caption: e.target.value })}
                  placeholder="Assista ao vídeo e veja como funciona"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SEÇÃO DE DEPOIMENTOS & AVALIAÇÕES */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <MessageSquareHeart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Depoimentos & Avaliações</h3>
              <p className="text-[11px] text-muted-foreground">
                Prova social com estrelas de satisfação e comentários
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateSampleReviews}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
              title="Gerar 3 avaliações autênticas para este nicho"
            >
              <Wand2 className="h-3 w-3" />
              Auto-Preencher ({nicheKey})
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          {testimonials.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-border rounded-xl space-y-2">
              <Star className="h-6 w-6 text-amber-400 mx-auto fill-amber-400/20" />
              <p className="text-xs text-muted-foreground">Nenhum depoimento cadastrado ainda.</p>
              <button
                type="button"
                onClick={handleGenerateSampleReviews}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Gerar 3 Depoimentos Automáticos para {nicheKey}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map((rev, idx) => (
                <div
                  key={rev.id || idx}
                  className="rounded-lg border border-border bg-background/70 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={rev.author}
                        onChange={(e) => handleReviewChange(idx, "author", e.target.value)}
                        placeholder="Nome do cliente"
                        className="font-bold text-foreground bg-transparent border-b border-border/70 focus:border-primary focus:outline-none px-1 py-0.5 w-36"
                      />
                      <input
                        type="text"
                        value={rev.role || ""}
                        onChange={(e) => handleReviewChange(idx, "role", e.target.value)}
                        placeholder="Contexto (ex: Cliente VIP)"
                        className="text-[11px] text-muted-foreground bg-transparent border-b border-border/70 focus:border-primary focus:outline-none px-1 py-0.5 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={rev.rating || 5}
                        onChange={(e) => handleReviewChange(idx, "rating", Number(e.target.value))}
                        className="bg-background border border-border rounded text-[11px] px-1 py-0.5 text-amber-400 font-bold"
                      >
                        <option value={5}>5 ★★★★★</option>
                        <option value={4}>4 ★★★★☆</option>
                        <option value={3}>3 ★★★☆☆</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveReview(idx)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Remover depoimento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={rev.text}
                    onChange={(e) => handleReviewChange(idx, "text", e.target.value)}
                    placeholder="Texto do depoimento..."
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddReview}
                className="w-full py-2 border border-dashed border-border/80 hover:border-primary/60 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Outro Depoimento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SEÇÃO SOBRE NÓS & DIFERENCIAIS */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sobre Nós & Diferenciais</h3>
              <p className="text-[11px] text-muted-foreground">
                Card institucional com história e destaques competitivos
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aboutConfig.enabled}
              onChange={(e) => updateAbout({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {aboutConfig.enabled && (
          <div className="space-y-3 pt-2 border-t border-border/50 animate-fade-in-up">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Título Institucional
              </label>
              <input
                type="text"
                value={aboutConfig.title || ""}
                onChange={(e) => updateAbout({ title: e.target.value })}
                placeholder={`Sobre a ${companyName}`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Breve Apresentação ou História
              </label>
              <textarea
                rows={3}
                value={aboutConfig.text || ""}
                onChange={(e) => updateAbout({ text: e.target.value })}
                placeholder="Conte a história, tempo de atuação ou propósito do negócio..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Diferenciais com Ícone de Check (Até 3)
              </label>
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <input
                      type="text"
                      value={(aboutConfig.highlights && aboutConfig.highlights[i]) || ""}
                      onChange={(e) => {
                        const next = [...(aboutConfig.highlights || ["", "", ""])];
                        next[i] = e.target.value;
                        updateAbout({ highlights: next });
                      }}
                      placeholder={`Diferencial ${i + 1} (ex: Atendimento com hora marcada)`}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. DIFERENCIAIS DA EMPRESA & SELO DE DESTAQUE VIP */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Diferenciais da Empresa & Selo VIP</h3>
              <p className="text-[11px] text-muted-foreground">
                Personalize os 4 cards de diferenciais e o selo de garantia do topo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateSampleDifferentials}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
            title="Preencher diferenciais perfeitos para este nicho"
          >
            <Wand2 className="h-3 w-3" />
            Auto-Preencher ({nicheKey})
          </button>
        </div>

        <div className="space-y-4 pt-2 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Selo de Destaque Superior (Hero Badge)
              </label>
              <input
                type="text"
                value={vipBadge}
                onChange={(e) => updateVipBadge(e.target.value)}
                placeholder="Ex: Qualidade Premium Garantida"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Título da Seção de Diferenciais
              </label>
              <input
                type="text"
                value={differentialsTitle}
                onChange={(e) => updateDifferentialsTitle(e.target.value)}
                placeholder="Ex: Nosso Padrão de Atendimento"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-2">
              4 Cards de Diferenciais Competitivos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const item = differentials[idx] || { title: "", desc: "", icon: "badge" };
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-background/70 p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[11px] text-muted-foreground">
                        Card #{idx + 1}
                      </span>
                      <select
                        value={item.icon || "badge"}
                        onChange={(e) => updateDifferentialItem(idx, "icon", e.target.value)}
                        className="bg-background border border-border rounded text-[11px] px-1.5 py-0.5 text-foreground font-medium"
                      >
                        <option value="badge">Selo / Qualidade</option>
                        <option value="shield">Escudo / Segurança</option>
                        <option value="clock">Relógio / Pontualidade</option>
                        <option value="sparkles">Brilho / Excelência</option>
                        <option value="heart">Coração / Atendimento</option>
                        <option value="bag">Sacola / Compras</option>
                        <option value="check">Check / Confiança</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateDifferentialItem(idx, "title", e.target.value)}
                      placeholder={`Título do Diferencial ${idx + 1}`}
                      className="w-full font-semibold text-foreground bg-transparent border-b border-border/70 focus:border-primary focus:outline-none px-1 py-1 text-xs"
                    />

                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => updateDifferentialItem(idx, "desc", e.target.value)}
                      placeholder="Descrição curta (ex: Atendimento no horário)"
                      className="w-full text-muted-foreground bg-transparent border-b border-border/70 focus:border-primary focus:outline-none px-1 py-1 text-[11px]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MICRO-ANIMAÇÕES & BOTÃO PULSANTE */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Pulso Luminoso no WhatsApp</h3>
              <p className="text-[11px] text-muted-foreground">
                Efeito de brilho pulsante no botão principal para atrair o olhar e elevar os cliques
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={ctaPulse}
              onChange={toggleCtaPulse}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>
    </div>
  );
}

