import type { BlockType } from "@/modules/studiopro/blocks/types"

export interface BlockMeta {
  type: BlockType
  label: string
  description: string
  category: string
  variants: string[]
  defaultProps: Record<string, unknown>
}

export const blockMetadata: BlockMeta[] = [
  {
    type: 'navbar',
    label: 'Topo & Menu',
    description: 'Barra de navegação com logotipo, links rápidos e botão de ação',
    category: 'Navegação',
    variants: ['default', 'centered'],
    defaultProps: { logo: 'Minha Empresa', links: ['Início', 'Serviços', 'Depoimentos', 'Contato'], ctaText: 'Fale Conosco' },
  },
  {
    type: 'hero',
    label: 'Destaque Principal (Hero)',
    description: 'Seção de entrada com título marcante, subtítulo convincente e botões de conversão',
    category: 'Destaque',
    variants: ['centered', 'split', 'gradient', 'minimal'],
    defaultProps: {
      headline: 'Soluções de Excelência para o seu Negócio',
      subheadline: 'Conectamos clientes aos melhores serviços com agilidade, autoridade e atendimento exclusivo.',
      primaryCta: 'Chamar no WhatsApp',
      secondaryCta: 'Conhecer Serviços',
    },
  },
  {
    type: 'features',
    label: 'Serviços & Diferenciais',
    description: 'Grade moderna de vantagens e serviços com ícones destacados',
    category: 'Apresentação',
    variants: ['grid', 'list', 'alternating'],
    defaultProps: {
      title: 'Nossos Principais Diferenciais',
      subtitle: 'Por que empresas e clientes escolhem nosso atendimento',
      items: [
        { icon: 'Zap', title: 'Atendimento Ágil', description: 'Resposta imediata e suporte humanizado para o seu dia a dia.' },
        { icon: 'Shield', title: 'Máxima Segurança', description: 'Processos certificados e total transparência em cada etapa.' },
        { icon: 'Award', title: 'Qualidade Comprovada', description: 'Reconhecimento comprovado com notas máximas dos nossos clientes.' },
      ],
    },
  },
  {
    type: 'pricing',
    label: 'Tabela de Preços & Planos',
    description: 'Tabela comparativa com planos, valores e destaques de contratação',
    category: 'Vendas',
    variants: ['simple', 'comparison'],
    defaultProps: {
      title: 'Planos & Condições Especiais',
      subtitle: 'Escolha a opção ideal para a sua necessidade',
    },
  },
  {
    type: 'cta',
    label: 'Chamada para Ação (CTA)',
    description: 'Bloco de alta conversão para incentivar contato direto ou agendamento',
    category: 'Conversão',
    variants: ['simple', 'split'],
    defaultProps: {
      headline: 'Pronto para transformar sua experiência?',
      subheadline: 'Fale diretamente com nossa equipe e garanta as melhores condições hoje mesmo.',
      buttonText: 'Iniciar Atendimento Agora',
    },
  },
  {
    type: 'testimonials',
    label: 'Depoimentos & Avaliações',
    description: 'Prova social com depoimentos reais, estrelas e foto dos clientes',
    category: 'Autoridade',
    variants: ['cards', 'carousel', 'spotlight'],
    defaultProps: {
      title: 'O que Nossos Clientes Dizem',
    },
  },
  {
    type: 'stats',
    label: 'Números de Impacto (Stats)',
    description: 'Contadores e estatísticas comprovando autoridade de mercado',
    category: 'Autoridade',
    variants: ['grid', 'bar', 'counter'],
    defaultProps: {
      title: 'Nossa Trajetória em Números',
    },
  },
  {
    type: 'faq',
    label: 'Perguntas Frequentes (FAQ)',
    description: 'Acordeão interativo respondendo dúvidas comuns para quebrar objeções',
    category: 'Apresentação',
    variants: ['accordion'],
    defaultProps: {
      title: 'Perguntas Frequentes',
    },
  },
  {
    type: 'team',
    label: 'Equipe & Profissionais',
    description: 'Apresentação dos especialistas com fotos, cargos e bio',
    category: 'Apresentação',
    variants: ['grid'],
    defaultProps: {
      title: 'Conheça Nossos Especialistas',
    },
  },
  {
    type: 'gallery',
    label: 'Galeria de Fotos & Portfólio',
    description: 'Exibição fotográfica do ambiente, produtos ou serviços realizados',
    category: 'Mídia',
    variants: ['grid', 'masonry'],
    defaultProps: {
      title: 'Nosso Espaço & Resultados',
    },
  },
  {
    type: 'image',
    label: 'Imagem em Destaque',
    description: 'Banner visual com imagem grande e texto explicativo ao lado',
    category: 'Mídia',
    variants: ['hero-image', 'side-by-side', 'grid'],
    defaultProps: {
      title: 'Ambiente Moderno e Acolhedor',
      subtitle: 'Estrutura completa preparada para oferecer a melhor experiência.',
      imageSide: 'left',
    },
  },
  {
    type: 'video',
    label: 'Vídeo Institucional',
    description: 'Vídeo integrado do YouTube ou Vimeo em player elegante',
    category: 'Mídia',
    variants: ['youtube', 'vimeo'],
    defaultProps: {
      url: '',
      title: 'Conheça Mais Sobre Nossa História',
    },
  },
  {
    type: 'contact',
    label: 'Contato & Localização',
    description: 'Formulário direto, WhatsApp e informações de endereço',
    category: 'Conversão',
    variants: ['form'],
    defaultProps: {
      title: 'Entre em Contato Conosco',
      subtitle: 'Estamos prontos para atender você. Envie uma mensagem agora mesmo.',
    },
  },
  {
    type: 'newsletter',
    label: 'Captura de Leads (Newsletter)',
    description: 'Campo de inscrição rápida para receber novidades e cupons',
    category: 'Conversão',
    variants: ['simple'],
    defaultProps: {
      title: 'Receba Ofertas Exclusivas',
      subtitle: 'Cadastre seu e-mail e não perca nossos lançamentos e novidades.',
      buttonText: 'Cadastrar',
    },
  },
  {
    type: 'logocloud',
    label: 'Marcas Parceiras & Clientes',
    description: 'Carrossel ou grade de logos de clientes e empresas parceiras',
    category: 'Autoridade',
    variants: ['default'],
    defaultProps: {
      title: 'Empresas que Confiam no Nosso Trabalho',
    },
  },
  {
    type: 'content',
    label: 'Artigo / Texto Rico',
    description: 'Seção de texto formatado para explicar história, metodologia ou detalhes',
    category: 'Apresentação',
    variants: ['prose', 'columns', 'highlight'],
    defaultProps: {
      body: '## Nossa Proposta\n\nCompromisso diário com a excelência e inovação constante em cada atendimento.\n\n- Atendimento humanizado e personalizado\n- Tecnologias de ponta\n- Resultados garantidos e satisfação comprovada',
    },
  },
  {
    type: 'banner',
    label: 'Aviso & Faixa Promocional',
    description: 'Faixa colorida no topo ou no meio da página para novidades e avisos',
    category: 'Destaque',
    variants: ['ribbon', 'bar'],
    defaultProps: {
      text: 'Novidade: Agendamentos abertos para este mês com condições especiais!',
      linkText: 'Saiba mais',
    },
  },
  {
    type: 'divider',
    label: 'Espaçador / Separador',
    description: 'Linha divisória ou espaçamento para organizar as seções da página',
    category: 'Estrutura',
    variants: ['line', 'space', 'dots'],
    defaultProps: { height: 60, width: 'full' },
  },
  {
    type: 'footer',
    label: 'Rodapé do Site',
    description: 'Encerramento com direitos reservados, redes sociais e links úteis',
    category: 'Navegação',
    variants: ['simple', 'multi-column', 'minimal'],
    defaultProps: {
      logo: 'Minha Empresa',
      copyright: '© 2026 Todos os direitos reservados.',
      links: ['Privacidade', 'Termos de Uso'],
    },
  },
]

export const categories = ['Todos', ...new Set(blockMetadata.map((b) => b.category))]
