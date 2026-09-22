import { useState } from "react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  HeartHandshake,
  ImagePlus,
  Layers,
  MessageSquareHeart,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Type,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import type { VideoConfig, TestimonialItem, AboutConfig } from "@/components/public-profile/ModularSections";
import { parseVideoEmbedUrl } from "@/components/public-profile/ModularSections";
import { MediaUploader } from "./MediaUploader";
import { ProductCarouselManager } from "@/components/dashboard/ProductCarouselManager";

interface SectionsEditorProps {
  nicheKey: string;
  companyName: string;
  socialLinks: Record<string, any>;
  onUpdateSocialLinks: (updated: Record<string, any>) => void;
  coverUrl?: string | null;
  avatarUrl?: string | null;
  onUpdateCover?: (url: string | null) => void;
  onUpdateAvatar?: (url: string | null) => void;
  templateId?: string | null;
  aiUsageCount?: number;
  onAiUsageIncrement?: () => void;
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

interface SiteSectionMeta {
  id: string;
  label: string;
  badge: string;
  icon: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

const SITE_SECTIONS: SiteSectionMeta[] = [
  {
    id: "hero",
    label: "Apresentação & Hero",
    badge: "Topo do Site",
    icon: "🎯",
    defaultTitle: "Apresentação e Destaque Principal",
    defaultSubtitle: "Frase de impacto e chamada para o WhatsApp",
  },
  {
    id: "product_carousel",
    label: "Carrossel de Produtos (Instagram)",
    badge: "🔥 Destaques",
    icon: "🔥",
    defaultTitle: "Destaques & Mais Pedidos",
    defaultSubtitle: "Carrossel deslizante estilo Instagram com pedido direto no WhatsApp",
  },
  {
    id: "credibility",
    label: "Credibilidade & Selos",
    badge: "Garantia",
    icon: "🛡️",
    defaultTitle: "Faixa de Garantia e Confiança",
    defaultSubtitle: "4 selos de reputação e agilidade",
  },
  {
    id: "steps",
    label: "Como Funciona (4 Passos)",
    badge: "Processo",
    icon: "📋",
    defaultTitle: "Como funciona o atendimento",
    defaultSubtitle: "Passo a passo transparente até a entrega",
  },
  {
    id: "servicos",
    label: "Serviços (Bento Grid)",
    badge: "Vitrine",
    icon: "🌟",
    defaultTitle: "Soluções e Especialidades",
    defaultSubtitle: "Cards de serviços com botão WhatsApp",
  },
  {
    id: "diferenciais",
    label: "Diferenciais da Empresa",
    badge: "Destaques",
    icon: "💎",
    defaultTitle: "Por Que Nos Escolher",
    defaultSubtitle: "Vantagens exclusivas e nota do Google Maps",
  },
  {
    id: "avaliacoes",
    label: "Avaliações & Prova Social",
    badge: "Google Maps",
    icon: "⭐",
    defaultTitle: "Avaliação Pública e Depoimentos",
    defaultSubtitle: "Reputação verificada com nota e comentários",
  },
  {
    id: "faq",
    label: "Dúvidas Frequentes (FAQ)",
    badge: "Accordion",
    icon: "❓",
    defaultTitle: "Perguntas Frequentes",
    defaultSubtitle: "Respostas diretas para dúvidas de clientes",
  },
  {
    id: "contato",
    label: "Localização & Contato",
    badge: "Mapa ao Vivo",
    icon: "📍",
    defaultTitle: "Venha nos visitar ou mande uma mensagem",
    defaultSubtitle: "Endereço, WhatsApp e rota no Google Maps",
  },
];

const FONT_OPTIONS = [
  { value: "Inter, sans-serif", label: "Inter (Padrão Moderno)" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans (Corporativo / Tech)" },
  { value: "'Poppins', sans-serif", label: "Poppins (Amigável / Arredondado)" },
  { value: "'Montserrat', sans-serif", label: "Montserrat (Forte / Impacto)" },
  { value: "'Playfair Display', serif", label: "Playfair Display (Sofisticado / Luxo)" },
  { value: "'Outfit', sans-serif", label: "Outfit (Minimalista / Tendência)" },
  { value: "'Roboto', sans-serif", label: "Roboto (Neutro / Direto)" },
];

const FONT_SIZE_OPTIONS: Array<{ value: "sm" | "base" | "lg" | "xl"; label: string; sizeHint: string }> = [
  { value: "sm", label: "P", sizeHint: "Pequeno (24px)" },
  { value: "base", label: "M", sizeHint: "Médio (32px)" },
  { value: "lg", label: "G", sizeHint: "Grande (40px)" },
  { value: "xl", label: "XG", sizeHint: "Extra Grande (48px)" },
];

export function SectionsEditor({
  nicheKey,
  companyName,
  socialLinks,
  onUpdateSocialLinks,
  coverUrl,
  avatarUrl,
  onUpdateCover,
  onUpdateAvatar,
  templateId,
  aiUsageCount = 0,
  onAiUsageIncrement,
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

  const customTheme = socialLinks.custom_theme || {};
  const sectionColors = customTheme.sections || {
    bg: customTheme.card_bg || "",
    text: customTheme.text || "",
    accent: customTheme.primary || "",
    border: customTheme.border_color || "",
  };

  const updateSectionColors = (patch: Partial<typeof sectionColors>) => {
    const nextSections = { ...sectionColors, ...patch };
    const nextTheme = {
      ...customTheme,
      sections: nextSections,
      card_bg: nextSections.bg || customTheme.card_bg,
      border_color: nextSections.border || customTheme.border_color,
    };
    onUpdateSocialLinks({
      ...socialLinks,
      custom_theme: nextTheme,
    });
  };

  // Gerenciamento e customização de seções em tempo real
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const rawOrder = Array.isArray(socialLinks.sections_order) && socialLinks.sections_order.length > 0
    ? socialLinks.sections_order
    : SITE_SECTIONS.map((s) => s.id);

  const sectionsOrder = [
    ...rawOrder,
    ...SITE_SECTIONS.map((s) => s.id).filter((id) => !rawOrder.includes(id)),
  ];

  const orderedSections = sectionsOrder
    .map((id) => SITE_SECTIONS.find((s) => s.id === id))
    .filter(Boolean) as SiteSectionMeta[];

  const sectionStyles = (socialLinks.section_styles as Record<string, any>) || {};

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionsOrder.length) return;
    const newOrder = [...sectionsOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);
    onUpdateSocialLinks({
      ...socialLinks,
      sections_order: newOrder,
    });
  };

  const toggleSectionVisibility = (id: string) => {
    const current = sectionStyles[id] || {};
    const isVisible = current.visible !== false;
    onUpdateSocialLinks({
      ...socialLinks,
      section_styles: {
        ...sectionStyles,
        [id]: {
          ...current,
          visible: !isVisible,
        },
      },
    });
  };

  const updateSectionStyle = (id: string, patch: Record<string, any>) => {
    const current = sectionStyles[id] || {};
    onUpdateSocialLinks({
      ...socialLinks,
      section_styles: {
        ...sectionStyles,
        [id]: {
          ...current,
          ...patch,
        },
      },
    });
  };

  const resetSectionStyle = (id: string) => {
    const next = { ...sectionStyles };
    delete next[id];
    onUpdateSocialLinks({
      ...socialLinks,
      section_styles: next,
    });
  };

  const resetSectionsOrder = () => {
    onUpdateSocialLinks({
      ...socialLinks,
      sections_order: SITE_SECTIONS.map((s) => s.id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
          Mídia & Estrutura
        </p>
        <h2 className="text-lg font-bold text-foreground">
          Gerenciamento de Seções & Mídia Visual
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suba seu logotipo, altere a imagem de capa, organize a ordem das seções e personalize fontes e cores.
        </p>
      </div>

      {/* 📸 MÍDIA PRINCIPAL: LOGOTIPO & IMAGENS DO NEGÓCIO */}
      <div className="rounded-2xl border border-border bg-card/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-foreground">
              Mídia Principal & Identidade da Marca
            </h3>
            <p className="text-xs text-muted-foreground">
              Suba o logotipo oficial, a foto de capa (Hero) e imagens do estabelecimento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Campo de Logotipo Oficial */}
          {onUpdateAvatar && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                🏷️ Logotipo Oficial da Empresa
              </span>
              <MediaUploader
                label="Logotipo da Marca (PNG transparente ou Quadrado)"
                value={avatarUrl}
                variant="avatar"
                templateId={templateId}
                niche={nicheKey}
                companyName={companyName}
                aiUsageCount={aiUsageCount}
                onAiUsageIncrement={onAiUsageIncrement}
                onChange={onUpdateAvatar}
              />
              <p className="text-[11px] text-muted-foreground">
                Exibido na barra superior de navegação, cabeçalho e ícone do PWA.
              </p>
            </div>
          )}

          {/* Campo de Imagem de Capa / Hero */}
          {onUpdateCover && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                🌄 Imagem de Capa / Hero (Banner Principal)
              </span>
              <MediaUploader
                label="Foto de Capa / Fachada (Formato Horizontal 16:9)"
                value={coverUrl}
                variant="cover"
                templateId={templateId}
                niche={nicheKey}
                companyName={companyName}
                aiUsageCount={aiUsageCount}
                onAiUsageIncrement={onAiUsageIncrement}
                onChange={onUpdateCover}
              />
              <p className="text-[11px] text-muted-foreground">
                Foto principal exibida no topo do site (Hero) com overlay escuro e botão de contato.
              </p>
            </div>
          )}
        </div>

        {/* Foto Secundária / Ambiente do Estabelecimento */}
        <div className="pt-2 border-t border-border/60">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              🏢 Foto Secundária do Estabelecimento / Ambiente
            </span>
            <MediaUploader
              label="Foto Secundária (Fachada, Consultório, Loja ou Equipe)"
              value={socialLinks.secondary_image}
              variant="square"
              templateId={templateId}
              niche={nicheKey}
              companyName={companyName}
              aiUsageCount={aiUsageCount}
              onAiUsageIncrement={onAiUsageIncrement}
              onChange={(url) => onUpdateSocialLinks({ ...socialLinks, secondary_image: url })}
            />
            <p className="text-[11px] text-muted-foreground">
              Utilizada na vitrine Bento Grid, nos cards de serviços e diferenciais da empresa.
            </p>
          </div>
        </div>
      </div>

      {/* 🗂️ GERENCIADOR DE SEÇÕES, TIPOGRAFIA & CORES EM TEMPO REAL */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xl shadow-xs">
              🗂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Gerenciador de Seções em Tempo Real</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Altere a ordem com ⬆️ e ⬇️, oculte seções e clique em qualquer uma para editar texto, fontes e cores instantaneamente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetSectionsOrder}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Ordem Padrão</span>
          </button>
        </div>

        {/* Lista Reordenável de Seções */}
        <div className="space-y-2.5">
          {orderedSections.map((sec, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === orderedSections.length - 1;
            const currentStyle = sectionStyles[sec.id] || {};
            const isVisible = currentStyle.visible !== false;
            const isExpanded = expandedSectionId === sec.id;
            const hasCustomStyles = Boolean(
              currentStyle.title ||
              currentStyle.subtitle ||
              currentStyle.font_family ||
              currentStyle.font_size ||
              currentStyle.title_color ||
              currentStyle.text_color ||
              currentStyle.bg_color
            );

            return (
              <div
                key={sec.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  !isVisible
                    ? "opacity-50 border-dashed border-border/60 bg-muted/20"
                    : isExpanded
                    ? "border-primary/50 bg-card shadow-md ring-1 ring-primary/20"
                    : "border-border/80 bg-card/80 hover:border-primary/30 hover:bg-card"
                }`}
              >
                {/* Linha do Cabeçalho da Seção */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botões de Reordenação */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveSection(idx, "up")}
                        className="p-1 rounded bg-muted/60 hover:bg-primary/20 hover:text-primary text-muted-foreground disabled:opacity-20 disabled:hover:bg-muted/60 disabled:hover:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Subir posição"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveSection(idx, "down")}
                        className="p-1 rounded bg-muted/60 hover:bg-primary/20 hover:text-primary text-muted-foreground disabled:opacity-20 disabled:hover:bg-muted/60 disabled:hover:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Descer posição"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Informações da Seção e Botão para Abrir Edição */}
                  <button
                    type="button"
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                    className="flex-1 min-w-0 text-left flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span className="text-lg shrink-0">{sec.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {currentStyle.title || sec.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-muted text-muted-foreground shrink-0 hidden xs:inline">
                          {sec.badge}
                        </span>
                        {hasCustomStyles && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Customizado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {currentStyle.subtitle || sec.defaultSubtitle}
                      </p>
                    </div>
                  </button>

                  {/* Ações Rápidas: Olho e Expandir */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sec.id)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isVisible
                          ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                      }`}
                      title={isVisible ? "Ocultar seção" : "Mostrar seção"}
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? "Fechar" : "Editar"}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Bloco Expandido: Editor Detalhado da Seção */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-3 border-t border-border/80 bg-muted/10 space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5" />
                        <span>Tipografia & Textos de: {sec.label}</span>
                      </span>
                      {hasCustomStyles && (
                        <button
                          type="button"
                          onClick={() => resetSectionStyle(sec.id)}
                          className="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restaurar Padrão</span>
                        </button>
                      )}
                    </div>

                    {/* Título Personalizado */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Título da Seção
                      </label>
                      <input
                        type="text"
                        value={currentStyle.title || ""}
                        onChange={(e) => updateSectionStyle(sec.id, { title: e.target.value })}
                        placeholder={sec.defaultTitle}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    {/* Subtítulo / Descrição */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Subtítulo / Descrição da Seção
                      </label>
                      <textarea
                        rows={2}
                        value={currentStyle.subtitle || ""}
                        onChange={(e) => updateSectionStyle(sec.id, { subtitle: e.target.value })}
                        placeholder={sec.defaultSubtitle}
                        className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                      />
                    </div>

                    {/* Família da Fonte & Tamanho */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Família da Fonte
                        </label>
                        <select
                          value={currentStyle.font_family || ""}
                          onChange={(e) => updateSectionStyle(sec.id, { font_family: e.target.value || undefined })}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                        >
                          <option value="">Padrão do Modelo (Inter)</option>
                          {FONT_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Tamanho do Título
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {FONT_SIZE_OPTIONS.map((fs) => (
                            <button
                              key={fs.value}
                              type="button"
                              onClick={() => updateSectionStyle(sec.id, { font_size: fs.value })}
                              className={`h-9 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                (currentStyle.font_size || "base") === fs.value
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted"
                              }`}
                              title={fs.sizeHint}
                            >
                              {fs.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cores Específicas da Seção */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Cor do Título */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Cor do Título
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentStyle.title_color || (sec.id === "contato" || sec.id === "credibility" ? "#ffffff" : "#0f172a")}
                            onChange={(e) => updateSectionStyle(sec.id, { title_color: e.target.value })}
                            className="h-8 w-8 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={currentStyle.title_color || ""}
                            onChange={(e) => updateSectionStyle(sec.id, { title_color: e.target.value })}
                            placeholder="Automático"
                            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-xs text-foreground"
                          />
                        </div>
                      </div>

                      {/* Cor do Subtítulo / Texto */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Cor do Texto
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentStyle.text_color || (sec.id === "contato" || sec.id === "credibility" ? "#ffffff" : "#475569")}
                            onChange={(e) => updateSectionStyle(sec.id, { text_color: e.target.value })}
                            className="h-8 w-8 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={currentStyle.text_color || ""}
                            onChange={(e) => updateSectionStyle(sec.id, { text_color: e.target.value })}
                            placeholder="Automático"
                            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-xs text-foreground"
                          />
                        </div>
                      </div>

                      {/* Cor de Fundo da Seção */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Fundo da Seção
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentStyle.bg_color || "#ffffff"}
                            onChange={(e) => updateSectionStyle(sec.id, { bg_color: e.target.value })}
                            className="h-8 w-8 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={currentStyle.bg_color || ""}
                            onChange={(e) => updateSectionStyle(sec.id, { bg_color: e.target.value })}
                            placeholder="Automático"
                            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-xs text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Imagens Específicas da Seção */}
                    {sec.id === "hero" && onUpdateCover && (
                      <div className="pt-3 border-t border-border/60 space-y-1.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          🌄 Imagem de Fundo / Capa do Hero (Banner Principal)
                        </span>
                        <MediaUploader
                          label="Foto de Capa do Hero (16:9)"
                          value={coverUrl}
                          variant="cover"
                          templateId={templateId}
                          niche={nicheKey}
                          companyName={companyName}
                          aiUsageCount={aiUsageCount}
                          onAiUsageIncrement={onAiUsageIncrement}
                          onChange={onUpdateCover}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Esta imagem preenche o topo do site com destaque visual imediato.
                        </p>
                      </div>
                    )}

                    {sec.id === "about" && (
                      <div className="pt-3 border-t border-border/60 space-y-1.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          🏢 Imagem da Seção Sobre Nós / Ambiente
                        </span>
                        <MediaUploader
                          label="Foto de Ambiente ou Fachada da Empresa"
                          value={socialLinks.secondary_image}
                          variant="square"
                          templateId={templateId}
                          niche={nicheKey}
                          companyName={companyName}
                          aiUsageCount={aiUsageCount}
                          onAiUsageIncrement={onAiUsageIncrement}
                          onChange={(url) => onUpdateSocialLinks({ ...socialLinks, secondary_image: url })}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Exibida no grid visual e na apresentação da história da sua empresa.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎨 SELETOR DE CORES E ESTILO DAS SEÇÕES */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cores & Estilos Visuais das Seções</h3>
              <p className="text-[11px] text-muted-foreground">
                Personalize o fundo dos cards, textos, detalhes e bordas das seções
              </p>
            </div>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Temas Rápidos para Seções:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() =>
                updateSectionColors({
                  bg: "#18181b",
                  text: "#ffffff",
                  accent: "#6366f1",
                  border: "rgba(255,255,255,0.12)",
                })
              }
              className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-zinc-900 text-white text-xs font-semibold hover:border-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-3 w-3 rounded-full bg-zinc-950 border border-zinc-700 shrink-0" />
              <span className="truncate">Dark Grafite</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSectionColors({
                  bg: "#ffffff",
                  text: "#0f172a",
                  accent: "#2563eb",
                  border: "#e2e8f0",
                })
              }
              className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-white text-zinc-900 text-xs font-semibold hover:border-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-3 w-3 rounded-full bg-white border border-zinc-300 shrink-0" />
              <span className="truncate">Clean / Claro</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSectionColors({
                  bg: "#0b0c10",
                  text: "#fef08a",
                  accent: "#d4af37",
                  border: "rgba(212,175,55,0.3)",
                })
              }
              className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-black text-amber-300 text-xs font-semibold hover:border-amber-400 transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-3 w-3 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">Ouro & Luxo</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSectionColors({
                  bg: "rgba(255,255,255,0.05)",
                  text: "#ffffff",
                  accent: "#10b981",
                  border: "rgba(255,255,255,0.15)",
                })
              }
              className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-white/5 text-emerald-400 text-xs font-semibold hover:border-emerald-400 transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Glassmorphism</span>
            </button>
          </div>
        </div>

        {/* Inputs de Cor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Cor de Fundo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Fundo dos Cards/Seções</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sectionColors.bg?.startsWith("#") ? sectionColors.bg : "#18181b"}
                onChange={(e) => updateSectionColors({ bg: e.target.value })}
                className="h-8 w-9 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={sectionColors.bg || ""}
                onChange={(e) => updateSectionColors({ bg: e.target.value })}
                placeholder="#18181b"
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cor do Texto */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Texto das Seções</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sectionColors.text?.startsWith("#") ? sectionColors.text : "#ffffff"}
                onChange={(e) => updateSectionColors({ text: e.target.value })}
                className="h-8 w-9 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={sectionColors.text || ""}
                onChange={(e) => updateSectionColors({ text: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cor de Destaque */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Destaque & Ícones</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sectionColors.accent?.startsWith("#") ? sectionColors.accent : "#6366f1"}
                onChange={(e) => updateSectionColors({ accent: e.target.value })}
                className="h-8 w-9 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={sectionColors.accent || ""}
                onChange={(e) => updateSectionColors({ accent: e.target.value })}
                placeholder="#6366f1"
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cor da Borda */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Borda das Seções</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sectionColors.border?.startsWith("#") ? sectionColors.border : "#27272a"}
                onChange={(e) => updateSectionColors({ border: e.target.value })}
                className="h-8 w-9 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={sectionColors.border || ""}
                onChange={(e) => updateSectionColors({ border: e.target.value })}
                placeholder="#27272a"
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 0. CARROSSEL DE PRODUTOS & DESTAQUES ESTILO INSTAGRAM */}
      <ProductCarouselManager
        socialLinks={socialLinks}
        onUpdateSocialLinks={onUpdateSocialLinks}
      />

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

