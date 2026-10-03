import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Target,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Bot,
  Video,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  RotateCcw,
  Save,
  Users,
  Store,
  Share2,
  Briefcase,
  ChevronRight,
  Calculator,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin_/vendas")({
  head: () => ({
    meta: [
      { title: "Playbook & Gestão de Vendas — EiaLink" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const isOwner = u.user.email?.toLowerCase() === "jaimilsonvendas@gmail.com";
    if (isOwner) return;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: AdminVendasPage,
});

interface ScriptTemplate {
  id: string;
  category: "abordagem" | "nichos" | "fechamento" | "objecoes";
  title: string;
  subtitle: string;
  tag: string;
  badgeColor: string;
  defaultText: string;
}

const DEFAULT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "video-30s",
    category: "abordagem",
    title: "1. O Cavalo de Troia (Vídeo de 30s + Demo IA)",
    subtitle: "A abordagem com maior taxa de resposta (> 40%). Gere a demo, grave a tela por 25s e envie.",
    tag: "MAIOR CONVERSÃO",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    defaultText: `Fala {nome}, tudo bem? Estava admirando o trabalho de vocês no Instagram da {empresa} aqui em {cidade} e o nível das fotos é excelente!

Como eu desenvolvo tecnologia para negócios locais, peguei as fotos mais bonitas do feed de vocês e montei um protótipo no ar para você ver como ficaria um site cinematográfico no celular:

👉 Dá uma olhada no celular: {link_demo}

Coloquei botão de WhatsApp direto e galeria dos melhores trabalhos. Me diz o que achou da apresentação visual!`,
  },
  {
    id: "estetica",
    category: "nichos",
    title: "2. Estética, Harmonização & Clínicas de Luxo",
    subtitle: "Foco no apelo visual sofisticado e na conversão de quem visita o Instagram em agendamento no WhatsApp.",
    tag: "ESTÉTICA & LASH",
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    defaultText: `Oi {nome}, acompanho os procedimentos que você posta no perfil da {empresa} e o acabamento dos resultados é impecável!

Reparei que no link da bio de vocês hoje só tem um link genérico. As pacientes que buscam procedimentos estéticos decidem por impacto visual, confiança e exclusividade.

Montei hoje de manhã uma vitrine cinematográfica de luxo para a clínica usando as próprias fotos dos seus procedimentos com efeito vitrine:

👉 {link_demo}

Ficou com padrão de marca internacional. Se fizer sentido para vocês ativarem esse link oficial, me avisa aqui!`,
  },
  {
    id: "gastronomia",
    category: "nichos",
    title: "3. Gastronomia, Hamburguerias & Restaurantes",
    subtitle: "Foco nas fotos apetitosas dos pratos, cardápio sem taxas de aplicativo e QR Code de mesa.",
    tag: "GASTRONOMIA",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    defaultText: `Fala pessoal da {empresa}! Adoro os pratos de vocês, as fotos do feed dão água na boca.

Montei hoje um cardápio digital interativo e ultrarrápido para vocês, com fotos grandes dos pratos e botão de pedido direto no WhatsApp sem pagar comissão para aplicativo:

👉 {link_demo}

Também já deixei configurado para gerar a plaquinha com QR Code para o cliente escanear na mesa ou no balcão. O que acharam da apresentação dos pratos?`,
  },
  {
    id: "saude",
    category: "nichos",
    title: "4. Saúde, Consultórios & Profissionais Liberais",
    subtitle: "Dentistas, psicólogos, médicos e advogados que precisam transmitir autoridade imediata.",
    tag: "SAÚDE & AUTORIDADE",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    defaultText: `Olá {nome}, tudo bem? Estava pesquisando profissionais de referência em {cidade} e encontrei o perfil da {empresa}.

Hoje a grande maioria dos pacientes pesquisa no Google ou clica no link da bio buscando credenciais, especialidades e endereço de forma limpa.

Desenvolvi esse modelo de autoridade profissional para vocês, com apresentação dos tratamentos e botão para a secretária agendar consultas:

👉 {link_demo}

Ficou extremamente sóbrio e profissional. O que você achou?`,
  },
  {
    id: "fechamento-preco",
    category: "fechamento",
    title: "5. Apresentação de Preço & Fechamento Pix",
    subtitle: "Enviado logo após o cliente elogiar o protótipo ('Ficou lindo! Quanto custa?').",
    tag: "FECHAMENTO IMEDIATO",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    defaultText: `Que bom que você curtiu {nome}! Esse nível de vitrine com IA e carregamento instantâneo normalmente custa caro no mercado tradicional.

Como eu já deixei o seu site 100% estruturado na minha plataforma, consigo liberar o domínio oficial e o painel para você por apenas R$ {preco_mensal}/mês (cobre hospedagem rápida, SSL e suporte).

Ou se preferir quitar o ano todo com desconto de tração, fica apenas R$ {preco_anual} pelo ano inteiro à vista!

Posso gerar a chave Pix para colocarmos no seu Instagram hoje ainda?`,
  },
  {
    id: "obj-caro",
    category: "objecoes",
    title: "6. Objeção: 'Achei caro / Sem verba agora'",
    subtitle: "Quebra a barreira de preço dividindo o valor em custo diário imperceptível.",
    tag: "CONTORNO DE PREÇO",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
    defaultText: `Super compreendo {nome}! Mas pensa comigo: R$ {preco_mensal} por mês dá menos de R$ {preco_diario} por dia.

Se esse site te trouxer apenas UM novo cliente ou agendamento no mês inteiro, ele já pagou o ano todo e colocou lucro no seu bolso.

O risco para você é literalmente zero. Vamos ativar esta semana?`,
  },
  {
    id: "obj-instagram",
    category: "objecoes",
    title: "7. Objeção: 'Já tenho Instagram, não preciso de site'",
    subtitle: "Explica a diferença entre rede social (distração) e vitrine de fechamento (conversão direta).",
    tag: "CONTORNO DE CANAL",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    defaultText: `Com certeza {nome}, seu Instagram é excelente! Mas o Instagram é para atrair atenção, não para fechar. Mais de 60% das pessoas não querem rolar dezenas de posts para achar horário, endereço ou lista de serviços.

O site não substitui seu Instagram, ele complementa: quem clica no link da sua bio é direcionado direto para o WhatsApp antes que se distraia com notificações de outros perfis. É mais fechamentos no mesmo tráfego que você já recebe.`,
  },
  {
    id: "obj-socio",
    category: "objecoes",
    title: "8. Objeção: 'Preciso falar com meu sócio / esposa'",
    subtitle: "Dá a ferramenta certa para o lead apresentar para a outra parte sem você estar presente.",
    tag: "CONTORNO DE DECISOR",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    defaultText: `Perfeito {nome}! Faz o seguinte: encaminha esse link que montei ({link_demo}) direto no WhatsApp dele(a).

Como ele(a) vai ver o negócio de vocês já funcionando ao vivo na palma da mão, é muito mais fácil de aprovar do que apenas falar.

Se quiser, consigo segurar essa condição promocional de R$ {preco_anual} no anual para vocês até amanhã. Me dá um retorno assim que conversar com ele(a)?`,
  },
  {
    id: "followup-48h",
    category: "fechamento",
    title: "9. Follow-up de 48h (Gatilho do Desapego & Escassez)",
    subtitle: "Para quem visualizou o protótipo e sumiu. Acelera a decisão sem parecer insistente.",
    tag: "DESAPEGO",
    badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
    defaultText: `Oi {nome}, tudo bem? Passando só para avisar que como o servidor de demonstração tem limite de páginas temporárias, vou precisar arquivar esse link teste da {empresa} amanhã.

Queria checar se você quer que eu ative ele oficialmente no seu Instagram ou se posso deletar o protótipo?`,
  },
];

export function AdminVendasPage() {
  // Preços Editáveis da Plataforma
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem("eialink_sales_pricing");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      monthly: 29.9,
      annual: 290.0,
      setupFee: 0.0,
    };
  });

  // Salva preços no localStorage
  useEffect(() => {
    localStorage.setItem("eialink_sales_pricing", JSON.stringify(pricing));
  }, [pricing]);

  // Cálculos dinâmicos de preço
  const dailyPrice = useMemo(() => {
    return (pricing.monthly / 30).toFixed(2).replace(".", ",");
  }, [pricing.monthly]);

  const formattedMonthly = useMemo(() => {
    return pricing.monthly.toFixed(2).replace(".", ",");
  }, [pricing.monthly]);

  const formattedAnnual = useMemo(() => {
    return pricing.annual.toFixed(2).replace(".", ",");
  }, [pricing.annual]);

  // Dados de teste do lead
  const [leadVars, setLeadVars] = useState({
    nome: "Carlos",
    empresa: "Hamburgueria do Vale",
    cidade: "Minha Cidade",
    link_demo: "https://eialink.com.br/p/hamburgueria-do-vale",
  });

  // Scripts customizados salvos no localStorage
  const [templates, setTemplates] = useState<ScriptTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedScriptId, setSelectedScriptId] = useState<string>("video-30s");
  const [activeTab, setActiveTab] = useState<string>("abordagem");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Metas da Semana (inicia em ZERO de faturamento / leads reais)
  const [sprintState, setSprintState] = useState(() => {
    const saved = localStorage.getItem("eialink_sprint_metas_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      minedLeads: 0,
      generatedDemos: 0,
      sentPitches: 0,
      replies: 0,
      closedClients: 0,
      targetGoal: 5,
      pricingMode: "anual" as "anual" | "mensal",
    };
  });

  // Checklist Semanal (localStorage)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("eialink_sales_checklist_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      "seg-radar": false,
      "seg-ia": false,
      "ter-video": false,
      "ter-whats": false,
      "qua-lote2": false,
      "qua-fechamento": false,
      "qui-followup": false,
      "qui-negociacao": false,
      "sex-meta": false,
      "sex-ativacao": false,
    };
  });

  // Carrega templates customizados
  useEffect(() => {
    const savedTemplates = localStorage.getItem("eialink_custom_sales_scripts_v2");
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      } catch {
        // fallback
      }
    }
  }, []);

  // Salva sprint no localStorage
  useEffect(() => {
    localStorage.setItem("eialink_sprint_metas_v2", JSON.stringify(sprintState));
  }, [sprintState]);

  // Salva checklist no localStorage
  useEffect(() => {
    localStorage.setItem("eialink_sales_checklist_v2", JSON.stringify(checklist));
  }, [checklist]);

  const selectedScript = useMemo(() => {
    return templates.find((t) => t.id === selectedScriptId) || templates[0];
  }, [templates, selectedScriptId]);

  // Renderiza texto com variáveis de lead E variáveis dinâmicas de preço
  const resolvedScriptText = useMemo(() => {
    if (!selectedScript) return "";
    return selectedScript.defaultText
      .replace(/{nome}/g, leadVars.nome || "[Nome]")
      .replace(/{empresa}/g, leadVars.empresa || "[Empresa]")
      .replace(/{cidade}/g, leadVars.cidade || "[Cidade]")
      .replace(/{link_demo}/g, leadVars.link_demo || "[Link da Demo]")
      .replace(/{preco_mensal}/g, formattedMonthly)
      .replace(/{preco_anual}/g, formattedAnnual)
      .replace(/{preco_diario}/g, dailyPrice);
  }, [selectedScript, leadVars, formattedMonthly, formattedAnnual, dailyPrice]);

  function handleUpdateScriptText(newText: string) {
    const updated = templates.map((t) => (t.id === selectedScriptId ? { ...t, defaultText: newText } : t));
    setTemplates(updated);
    localStorage.setItem("eialink_custom_sales_scripts_v2", JSON.stringify(updated));
  }

  function handleResetScript(id: string) {
    const original = DEFAULT_TEMPLATES.find((t) => t.id === id);
    if (!original) return;
    const updated = templates.map((t) => (t.id === id ? { ...t, defaultText: original.defaultText } : t));
    setTemplates(updated);
    localStorage.setItem("eialink_custom_sales_scripts_v2", JSON.stringify(updated));
    toast.success("Modelo restaurado para o padrão original!");
  }

  function handleCopyResolved() {
    navigator.clipboard.writeText(resolvedScriptText);
    setCopiedId(selectedScriptId);
    toast.success("Mensagem pronta copiada com sucesso!");
    setTimeout(() => setCopiedId(null), 2500);
  }

  function handleOpenWhatsApp() {
    const encoded = encodeURIComponent(resolvedScriptText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  function toggleCheck(key: string) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Faturamento projetado em tempo real com base nos preços editáveis pelo usuário
  const projectedRevenue = useMemo(() => {
    const count = sprintState.closedClients;
    if (sprintState.pricingMode === "anual") {
      return {
        avista: count * pricing.annual,
        recorrente: 0,
        label: `${count} de ${sprintState.targetGoal} clientes no Plano Anual (R$ ${formattedAnnual} à vista)`,
      };
    } else {
      return {
        avista: count * pricing.setupFee,
        recorrente: count * pricing.monthly,
        label: `${count} de ${sprintState.targetGoal} clientes no Plano Mensal (R$ ${formattedMonthly}/mês)`,
      };
    }
  }, [sprintState.closedClients, sprintState.targetGoal, sprintState.pricingMode, pricing, formattedAnnual, formattedMonthly]);

  const targetProgress = Math.min(100, Math.round((sprintState.closedClients / sprintState.targetGoal) * 100));

  return (
    <div className="space-y-8 pb-16 print:p-0 print:space-y-4">
      {/* CABEÇALHO EXECUTIVO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <TrendingUp className="h-7 w-7 text-emerald-400" /> Playbook & Gestão de Vendas
            </h1>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold text-xs">
              Sprint de Tração: Primeiros 5 Clientes
            </Badge>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Acelerador de vendas para negócios locais. Modelos de mensagens 100% editáveis e precificação dinâmica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/Playbook_Comercial_EiaLink.pdf"
            download="Playbook_Comercial_EiaLink.pdf"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 text-xs shadow-md shadow-emerald-900/20 transition-all"
            title="Baixar arquivo PDF diagramado do Playbook Comercial"
          >
            <Download className="h-4 w-4" />
            <span>Baixar Playbook PDF</span>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs border-border bg-card hover:bg-muted/40 font-medium"
            title="Imprimir ou Salvar versão A4 limpa"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span>Imprimir / PDF A4</span>
          </Button>

          <Link
            to="/admin/prospeccao"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground px-3.5 py-2 text-xs font-semibold transition-all hover:border-primary/40"
          >
            <Target className="h-4 w-4 text-purple-400" />
            <span>Radar de Prospecção</span>
          </Link>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground px-3 py-2 text-xs transition-colors"
          >
            <span>Painel Admin</span>
          </Link>
        </div>
      </div>

      {/* BLOCO 1: DEFINIÇÃO DE PREÇOS EDITÁVEIS (A REALIDADE DE TRAÇÃO) */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-emerald-400" /> Configuração da Sua Oferta de Tração
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Defina quanto você vai cobrar dos seus primeiros clientes. Todos os scripts e cálculos atualizam automaticamente.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-400 self-start sm:self-center">
              Preços aplicados nos scripts em tempo real
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Plano Mensal (R$/mês)</label>
                <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">Tração Rápida</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.10"
                  value={pricing.monthly}
                  onChange={(e) => setPricing((prev: typeof pricing) => ({ ...prev, monthly: Number(e.target.value) || 0 }))}
                  className="font-bold text-sm bg-card"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Equivale a apenas <span className="text-emerald-400 font-bold">R$ {dailyPrice}/dia</span> para o lojista.
              </p>
            </div>

            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Plano Anual à Vista (R$)</label>
                <Badge className="bg-emerald-500 text-zinc-950 font-black text-[10px]">Caixa Imediato</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="1.00"
                  value={pricing.annual}
                  onChange={(e) => setPricing((prev: typeof pricing) => ({ ...prev, annual: Number(e.target.value) || 0 }))}
                  className="font-bold text-sm bg-card"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Economia anual para o cliente e Pix integral para você no dia.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Taxa de Ativação / Setup</label>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Opcional</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="1.00"
                  value={pricing.setupFee}
                  onChange={(e) => setPricing((prev: typeof pricing) => ({ ...prev, setupFee: Number(e.target.value) || 0 }))}
                  className="font-bold text-sm bg-card"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Para tração rápida, recomendamos R$ 0 de setup inicial para zerar a fricção.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 2: METAS DA SEMANA (COMEÇANDO DO ZERO) */}
      <Card className="border-border bg-card shadow-sm overflow-hidden print:border print:border-zinc-300">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" /> Sprint Semanal: Primeiros 5 Clientes
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Controle do seu funil comercial do zero até os 5 primeiros fechamentos.
              </CardDescription>
            </div>

            {/* Alternador de Modo de Projeção */}
            <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border text-xs print:hidden">
              <span className="text-[11px] text-muted-foreground px-2 font-medium">Calcular sobre:</span>
              <button
                type="button"
                onClick={() => setSprintState((prev: typeof sprintState) => ({ ...prev, pricingMode: "anual" }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  sprintState.pricingMode === "anual"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual (R$ {formattedAnnual})
              </button>
              <button
                type="button"
                onClick={() => setSprintState((prev: typeof sprintState) => ({ ...prev, pricingMode: "mensal" }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  sprintState.pricingMode === "mensal"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensal (R$ {formattedMonthly}/mês)
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Barra de Progresso Principal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <span>Progresso da Meta:</span>
                <span className="text-emerald-400 font-bold">{sprintState.closedClients} de {sprintState.targetGoal} clientes fechados</span>
              </span>
              <span className="font-extrabold text-foreground tabular-nums">{targetProgress}%</span>
            </div>
            <Progress value={targetProgress} className="h-3 bg-muted/60" />
          </div>

          {/* Os 5 Passos do Funil */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                step: "1. Mineração",
                label: "Leads no Radar",
                val: sprintState.minedLeads,
                meta: "Meta: 25 a 30",
                icon: Target,
                color: "text-purple-400",
                key: "minedLeads",
              },
              {
                step: "2. Efeito Uau",
                label: "Demos com IA",
                val: sprintState.generatedDemos,
                meta: "Meta: 20 a 25",
                icon: Sparkles,
                color: "text-pink-400",
                key: "generatedDemos",
              },
              {
                step: "3. Abordagem",
                label: "Vídeos / Whats",
                val: sprintState.sentPitches,
                meta: "Meta: 20 a 25",
                icon: Video,
                color: "text-blue-400",
                key: "sentPitches",
              },
              {
                step: "4. Interesse",
                label: "Respostas Recebidas",
                val: sprintState.replies,
                meta: "Meta: ~8 a 10",
                icon: MessageCircle,
                color: "text-amber-400",
                key: "replies",
              },
              {
                step: "5. Fechamento",
                label: "Clientes Fechados",
                val: sprintState.closedClients,
                meta: `Meta: ${sprintState.targetGoal}`,
                icon: DollarSign,
                color: "text-emerald-400",
                key: "closedClients",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.step}
                  className="rounded-xl border border-border bg-background/50 p-3.5 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{f.step}</span>
                    <Icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-foreground tabular-nums">{f.val}</span>
                      <div className="flex flex-col gap-0.5 print:hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setSprintState((prev: typeof sprintState) => ({
                              ...prev,
                              [f.key]: (prev[f.key as keyof typeof sprintState] as number) + 1,
                            }))
                          }
                          className="h-4 w-4 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold flex items-center justify-center text-foreground"
                          title="Aumentar"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSprintState((prev: typeof sprintState) => ({
                              ...prev,
                              [f.key]: Math.max(0, (prev[f.key as keyof typeof sprintState] as number) - 1),
                            }))
                          }
                          className="h-4 w-4 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold flex items-center justify-center text-foreground"
                          title="Diminuir"
                        >
                          -
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-foreground mt-0.5">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{f.meta}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Destaque de Faturamento Real Calculado */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Calculator className="h-4 w-4" /> Faturamento dos Fechamentos Atuais
              </span>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium">
                {projectedRevenue.label}
              </p>
            </div>

            <div className="flex items-baseline gap-4 sm:text-right">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">À Vista (Pix)</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                  R$ {projectedRevenue.avista.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {projectedRevenue.recorrente > 0 && (
                <div className="border-l border-emerald-500/30 pl-4">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Recorrente Mensal</p>
                  <p className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
                    + R$ {projectedRevenue.recorrente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CENTRAL DE SCRIPTS & MODELOS EDITÁVEIS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-emerald-400" /> Central de Scripts & Modelos de Abordagem
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalize qualquer mensagem. Os valores de preço (R$ {formattedMonthly}/mês e R$ {formattedAnnual}/ano) são inseridos automaticamente.
          </p>
        </div>

        {/* Variáveis Dinâmicas de Teste */}
        <Card className="border-border bg-card/60 p-4 print:hidden">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Variáveis Dinâmicas do Lead
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">{"{nome}"} (Dono ou Contato)</label>
              <Input
                value={leadVars.nome}
                onChange={(e) => setLeadVars((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Carlos"
                className="mt-1 h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">{"{empresa}"} (Empresa)</label>
              <Input
                value={leadVars.empresa}
                onChange={(e) => setLeadVars((prev) => ({ ...prev, empresa: e.target.value }))}
                placeholder="Ex: Hamburgueria do Vale"
                className="mt-1 h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">{"{cidade}"} (Localidade)</label>
              <Input
                value={leadVars.cidade}
                onChange={(e) => setLeadVars((prev) => ({ ...prev, cidade: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="mt-1 h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">{"{link_demo}"} (Link da Página)</label>
              <Input
                value={leadVars.link_demo}
                onChange={(e) => setLeadVars((prev) => ({ ...prev, link_demo: e.target.value }))}
                placeholder="Ex: eialink.com.br/p/empresa"
                className="mt-1 h-8 text-xs bg-background"
              />
            </div>
          </div>
        </Card>

        {/* Abas e Lista de Scripts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Lista de Modelos */}
          <div className="lg:col-span-5 space-y-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-muted/40 p-1 rounded-xl text-xs">
                <TabsTrigger value="abordagem" className="text-xs">Principal</TabsTrigger>
                <TabsTrigger value="nichos" className="text-xs">Nichos</TabsTrigger>
                <TabsTrigger value="fechamento" className="text-xs">Fechamento</TabsTrigger>
                <TabsTrigger value="objecoes" className="text-xs">Objeções</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              {templates
                .filter((t) => (activeTab === "all" ? true : t.category === activeTab))
                .map((script) => {
                  const isSelected = selectedScriptId === script.id;
                  return (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => setSelectedScriptId(script.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "border-emerald-500/60 bg-emerald-500/10 shadow-sm shadow-emerald-950/20"
                          : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground line-clamp-1">{script.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${script.badgeColor}`}>
                          {script.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {script.subtitle}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Coluna Direita: Editor & Preview Pronto */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {selectedScript.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {selectedScript.subtitle}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetScript(selectedScript.id)}
                    className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 print:hidden self-start sm:self-center"
                    title="Restaurar texto padrão deste modelo"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restaurar Padrão</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-5">
                {/* Textarea para Edição da Template Base */}
                <div className="space-y-1.5 print:hidden">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Save className="h-3.5 w-3.5 text-primary" /> Editar Modelo Base (Salvo Automaticamente)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Suporta {"{preco_mensal}"}, {"{preco_anual}"}, {"{preco_diario}"}
                    </span>
                  </div>
                  <Textarea
                    value={selectedScript.defaultText}
                    onChange={(e) => handleUpdateScriptText(e.target.value)}
                    rows={7}
                    className="text-xs leading-relaxed font-mono bg-background resize-y"
                    placeholder="Digite o modelo de mensagem..."
                  />
                </div>

                {/* Caixa de Visualização Pronta para Envio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Mensagem Pronta para Disparo
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {resolvedScriptText.length} caracteres
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-slate-950 p-4 text-xs font-sans text-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-emerald-500 selection:text-black">
                    {resolvedScriptText}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 print:hidden">
                  <Button
                    onClick={handleCopyResolved}
                    className="bg-primary text-zinc-950 hover:bg-primary/90 font-bold text-xs gap-1.5 shadow-sm"
                  >
                    {copiedId === selectedScript.id ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar Mensagem Pronta</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleOpenWhatsApp}
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Disparar no WhatsApp</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROTEIRO OPERACIONAL SEMANAL */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" /> Roteiro Operacional: Passo a Passo (Segunda a Sexta)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            A rotina diária para fechar os primeiros 5 clientes com menor fricção.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {[
            {
              day: "SEGUNDA-FEIRA",
              title: "Mineração de 25 Alvos & Geração das Vitrines com IA",
              items: [
                {
                  key: "seg-radar",
                  text: "Abrir o Radar de Prospecção (/admin/prospeccao) e minerar 25 a 30 empresas com boa nota no Google.",
                },
                {
                  key: "seg-ia",
                  text: "Clicar em 'Gerar com IA' em cada uma. O sistema usa Apify para buscar as fotos do Instagram e monta as demos em minutos.",
                },
              ],
            },
            {
              day: "TERÇA-FEIRA",
              title: "Gravação dos Mini-Vídeos de 25s & Envio do Lote 1",
              items: [
                {
                  key: "ter-video",
                  text: "Abrir os 12 a 15 melhores links no celular e gravar telas rápidas de 25 segundos rolando o site.",
                },
                {
                  key: "ter-whats",
                  text: "Disparar o Script 1 (O Cavalo de Troia) no WhatsApp comercial de cada uma.",
                },
              ],
            },
            {
              day: "QUARTA-FEIRA",
              title: "Envio do Lote 2 & Primeiros Fechamentos",
              items: [
                {
                  key: "qua-lote2",
                  text: "Gravar e disparar os vídeos do segundo lote para completar as 25 abordagens.",
                },
                {
                  key: "qua-fechamento",
                  text: `Responder prontamente quem elogiar oferecendo a condição de tração: R$ ${formattedMonthly}/mês ou R$ ${formattedAnnual} anual à vista.`,
                },
              ],
            },
            {
              day: "QUINTA-FEIRA",
              title: "Follow-up dos Visualizados & Negociação",
              items: [
                {
                  key: "qui-followup",
                  text: "Mandar mensagem de follow-up (Gatilho do Desapego) para quem visualizou e não respondeu.",
                },
                {
                  key: "qui-negociacao",
                  text: `Aplicar a quebra de objeções nos indecisos (ex: menos de R$ ${dailyPrice}/dia).`,
                },
              ],
            },
            {
              day: "SEXTA-FEIRA",
              title: "Fechamento da Meta (5 Clientes) & Ativação",
              items: [
                {
                  key: "sex-meta",
                  text: `Fechar os clientes restantes com a oferta especial de tração anual de R$ ${formattedAnnual}.`,
                },
                {
                  key: "sex-ativacao",
                  text: "Ativar os links oficiais no sistema e transferir para os clientes.",
                },
              ],
            },
          ].map((bloco) => (
            <div key={bloco.day} className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                  {bloco.day}
                </Badge>
                <span className="text-xs sm:text-sm font-bold text-foreground">{bloco.title}</span>
              </div>

              <div className="space-y-1.5 pl-1">
                {bloco.items.map((it) => (
                  <label
                    key={it.key}
                    className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[it.key])}
                      onChange={() => toggleCheck(it.key)}
                      className="mt-0.5 rounded border-border text-emerald-500 focus:ring-emerald-500/40 h-4 w-4 bg-background"
                    />
                    <span className={checklist[it.key] ? "line-through text-muted-foreground/60" : "text-foreground/90 font-medium"}>
                      {it.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
export default AdminVendasPage;

