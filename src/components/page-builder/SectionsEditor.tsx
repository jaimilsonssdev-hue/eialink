import { useState } from "react";
import {
  CheckCircle2,
  Layers,
  MessageSquareHeart,
  Plus,
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

const NICHE_SAMPLE_REVIEWS: Record<string, TestimonialItem[]> = {
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

      {/* 4. MICRO-ANIMAÇÕES & BOTÃO PULSANTE */}
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

