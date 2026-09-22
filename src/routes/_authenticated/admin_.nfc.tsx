import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Radio,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Star,
  CreditCard,
  Instagram,
  Phone,
  Utensils,
  UserCheck,
  Globe,
  Printer,
  Trash2,
  Edit2,
  Zap,
  ArrowLeft,
  Filter,
  BarChart3,
  Sparkles,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { DynamicLinkService } from "@/modules/nfc/services/DynamicLinkService";
import { WebNfcService } from "@/modules/nfc/services/WebNfcService";
import { buildGoogleReviewUrl } from "@/modules/nfc/nfc.functions";
import type { DynamicLink, DynamicLinkType } from "@/modules/nfc/types";
import { WebNfcWriterModal } from "@/components/admin/WebNfcWriterModal";
import { PlaquePrintModal } from "@/components/admin/PlaquePrintModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin_/nfc")({
  head: () => ({
    meta: [
      { title: "Central de Plaquinhas & NFC — EIA Digital" },
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
  component: AdminNfcPage,
});

function AdminNfcPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modais
  const [writerLink, setWriterLink] = useState<DynamicLink | null>(null);
  const [printLink, setPrintLink] = useState<DynamicLink | null>(null);
  const [editLink, setEditLink] = useState<Partial<DynamicLink> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Queries
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["nfc-dynamic-links"],
    queryFn: () => DynamicLinkService.list(),
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (link: Partial<DynamicLink> & { code: string; title: string }) =>
      DynamicLinkService.save(link),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfc-dynamic-links"] });
      setIsFormOpen(false);
      setEditLink(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DynamicLinkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfc-dynamic-links"] });
    },
  });

  // KPIs
  const totalLinks = links.length;
  const totalTaps = links.reduce((acc, l) => acc + (l.clicks_count || 0), 0);
  const googlePlaques = links.filter((l) => l.type === "google_review").length;
  const pixPlaques = links.filter((l) => l.type === "pix").length;

  // Filtro
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || l.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [links, searchTerm, typeFilter]);

  function handleOpenCreate() {
    setEditLink({
      type: "google_review",
      title: "",
      company_name: "",
      code: "",
      target_url: "",
      active: true,
      clicks_count: 0,
    });
    setIsFormOpen(true);
  }

  function handleOpenEdit(link: DynamicLink) {
    setEditLink({ ...link });
    setIsFormOpen(true);
  }

  function handleCopyShortUrl(code: string) {
    const url = DynamicLinkService.getShortUrl(code);
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  function getTypeBadge(type: DynamicLinkType) {
    switch (type) {
      case "google_review":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1 text-[11px]">
            <Star className="h-3 w-3 fill-amber-400" />
            Google 5 Estrelas
          </Badge>
        );
      case "pix":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
            <CreditCard className="h-3 w-3" />
            Pix Balcão
          </Badge>
        );
      case "instagram":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 gap-1 text-[11px]">
            <Instagram className="h-3 w-3" />
            Instagram
          </Badge>
        );
      case "whatsapp":
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30 gap-1 text-[11px]">
            <Phone className="h-3 w-3" />
            WhatsApp
          </Badge>
        );
      case "menu_comanda":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30 gap-1 text-[11px]">
            <Utensils className="h-3 w-3" />
            Cardápio & Comanda
          </Badge>
        );
      case "vcard":
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1 text-[11px]">
            <UserCheck className="h-3 w-3" />
            Cartão vCard
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
            <Globe className="h-3 w-3 mr-1" />
            Personalizado
          </Badge>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Painel Admin</span>
            </Link>
            <Badge
              variant="outline"
              className="text-[11px] font-normal border-primary/40 bg-primary/10 text-primary"
            >
              NFC & QR Code Dinâmico
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Central de Plaquinhas & Links Dinâmicos
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            Gere links inteligentes que nunca expiram, grave chips NFC diretamente no navegador sem aplicativos de terceiros e altere os destinos das plaquinhas físicas vendidas a qualquer momento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-xs font-semibold shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Plaquinha / Link</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Plaquinhas & Links</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalLinks}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cadastradas no sistema</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Radio className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Aproximações & Scans</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalTaps}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total de acessos registrados</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Google 5 Estrelas</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{googlePlaques}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Plaquinhas de avaliação</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pix Balcão</p>
              <h3 className="text-2xl font-bold text-teal-400 mt-1">{pixPlaques}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Plaquinhas de pagamento</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Plaquinhas e Links Dinâmicos */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                Plaquinhas e Links Ativos
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Qualquer alteração no link de destino entra em vigor imediatamente sem alterar o acrílico físico.
              </CardDescription>
            </div>

            {/* Barra de Busca e Filtro de Tipo */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar plaquinha ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs w-[200px] sm:w-[240px] rounded-lg"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 text-xs rounded-lg border border-border bg-background px-2.5 text-foreground"
              >
                <option value="all">Todos os Tipos</option>
                <option value="google_review">Google Avaliações</option>
                <option value="pix">Pix Balcão</option>
                <option value="instagram">Instagram</option>
                <option value="menu_comanda">Cardápio/Comanda</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="vcard">vCard</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Plaquinha / Empresa</TableHead>
                  <TableHead className="text-xs font-semibold">Tipo de Produto</TableHead>
                  <TableHead className="text-xs font-semibold">Link Curto (/r/)</TableHead>
                  <TableHead className="text-xs font-semibold">Destino Atual</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Acessos</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      Carregando plaquinhas e links dinâmicos...
                    </TableCell>
                  </TableRow>
                ) : filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Radio className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nenhuma plaquinha cadastrada ainda.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOpenCreate}
                        className="text-xs rounded-lg bg-primary text-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Criar Primeira Plaquinha
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLinks.map((link) => {
                    const shortUrl = DynamicLinkService.getShortUrl(link.code);
                    const isCopied = copiedCode === link.code;

                    return (
                      <TableRow key={link.id} className="hover:bg-muted/30 transition-colors">
                        {/* Plaquinha / Empresa */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-foreground block">
                              {link.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {link.company_name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Tipo */}
                        <TableCell>{getTypeBadge(link.type)}</TableCell>

                        {/* Link Curto */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
                            <span>/r/{link.code}</span>
                            <button
                              onClick={() => handleCopyShortUrl(link.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Copiar Link Curto"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* Destino Atual */}
                        <TableCell className="max-w-[220px]">
                          <div className="truncate text-xs text-muted-foreground" title={link.target_url}>
                            {link.type === "pix"
                              ? `Chave: ${link.pix_key || "Não definida"}`
                              : link.target_url || "Destino não configurado"}
                          </div>
                        </TableCell>

                        {/* Acessos */}
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            {link.clicks_count || 0}
                          </Badge>
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Gravar NFC */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setWriterLink(link)}
                              className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
                              title="Gravar no chip NFC"
                            >
                              <Radio className="h-3.5 w-3.5 mr-1" />
                              Gravar NFC
                            </Button>

                            {/* Plaquinha Acrílico & Impressão */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPrintLink(link)}
                              className="h-8 text-xs rounded-lg"
                              title="Visualizar e Imprimir Plaquinha de Acrílico"
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              Plaquinha
                            </Button>

                            {/* Editar Destino */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(link)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Editar destino da plaquinha"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Excluir */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Tem certeza que deseja excluir a plaquinha '${link.title}'? O link /r/${link.code} deixará de funcionar.`,
                                  )
                                ) {
                                  deleteMutation.mutate(link.id);
                                }
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-400 rounded-lg"
                              title="Excluir plaquinha"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Plaquinha */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editLink?.id ? "Editar Plaquinha Dinâmica" : "Nova Plaquinha / Link Dinâmico"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure os detalhes da plaquinha física e o link de direcionamento.
            </DialogDescription>
          </DialogHeader>

          {editLink && (
            <div className="space-y-4 py-2">
              {/* Tipo de Produto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tipo de Produto / Plaquinha
                </label>
                <select
                  value={editLink.type}
                  onChange={(e) =>
                    setEditLink((prev) => ({
                      ...prev,
                      type: e.target.value as DynamicLinkType,
                    }))
                  }
                  className="w-full h-9 text-xs rounded-lg border border-border bg-background px-3 text-foreground"
                >
                  <option value="google_review">Google Meu Negócio (Avaliação 5 Estrelas)</option>
                  <option value="pix">Plaquinha Pix Balcão (Pagamento Imediato)</option>
                  <option value="instagram">Siga-nos no Instagram</option>
                  <option value="whatsapp">Contato Direto no WhatsApp</option>
                  <option value="menu_comanda">Cardápio & Comanda Digital</option>
                  <option value="vcard">Cartão de Visitas Inteligente (vCard)</option>
                  <option value="custom">Link Personalizado / Outro</option>
                </select>
              </div>

              {/* Nome da Plaquinha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Título da Plaquinha
                </label>
                <Input
                  placeholder="Ex: Plaquinha Balcão Principal"
                  value={editLink.title || ""}
                  onChange={(e) =>
                    setEditLink((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              {/* Nome da Empresa */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Empresa / Estabelecimento
                </label>
                <Input
                  placeholder="Ex: Padaria Central, Dr. Silva..."
                  value={editLink.company_name || ""}
                  onChange={(e) => {
                    const company = e.target.value;
                    setEditLink((prev) => {
                      // Se for criação e o código ainda estiver vazio, gera slug automático
                      const updated: typeof prev = { ...prev, company_name: company };
                      if (!prev?.id && !prev?.code) {
                        updated.code = company
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                          .substring(0, 20);
                      }
                      return updated;
                    });
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Slug / Código Curto */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Código Curto / Slug Dinâmico
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Link: /r/{editLink.code || "slug"}
                  </span>
                </div>
                <div className="flex items-center rounded-lg border border-border bg-background px-3 focus-within:ring-1 focus-within:ring-primary">
                  <span className="text-xs text-muted-foreground font-mono mr-1">/r/</span>
                  <input
                    type="text"
                    placeholder="padaria-central"
                    value={editLink.code || ""}
                    onChange={(e) =>
                      setEditLink((prev) => ({
                        ...prev,
                        code: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "-"),
                      }))
                    }
                    className="h-9 w-full bg-transparent text-xs font-mono text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Campos Contextuais por Tipo */}
              {editLink.type === "google_review" && (
                <div className="space-y-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-300" />
                    <span>Link Direto de Avaliação Google</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Cole o link do perfil do Google Maps ou o Google Place ID. O sistema abrirá a caixa de 5 estrelas instantaneamente!
                  </p>
                  <Input
                    placeholder="Cole o Place ID ou Link do Google Maps"
                    value={editLink.google_place_id || editLink.target_url || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditLink((prev) => ({
                        ...prev,
                        google_place_id: val,
                        target_url: buildGoogleReviewUrl(val),
                      }));
                    }}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              )}

              {editLink.type === "pix" && (
                <div className="space-y-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Configuração do Pix Balcão</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-300 block mb-1">Chave Pix (CPF, CNPJ, Celular, E-mail ou Aleatória):</span>
                      <Input
                        placeholder="Ex: 12.345.678/0001-90 ou contato@empresa.com"
                        value={editLink.pix_key || ""}
                        onChange={(e) =>
                          setEditLink((prev) => ({ ...prev, pix_key: e.target.value }))
                        }
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-300 block mb-1">Nome do Titular / Razão Social:</span>
                      <Input
                        placeholder="Ex: Padaria Central LTDA"
                        value={editLink.pix_receiver_name || ""}
                        onChange={(e) =>
                          setEditLink((prev) => ({ ...prev, pix_receiver_name: e.target.value }))
                        }
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editLink.type === "instagram" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Usuário do Instagram (@perfil)
                  </label>
                  <Input
                    placeholder="Ex: @padariacentral"
                    value={editLink.instagram_username || ""}
                    onChange={(e) => {
                      const u = e.target.value.replace("@", "").trim();
                      setEditLink((prev) => ({
                        ...prev,
                        instagram_username: u,
                        target_url: u ? `https://instagram.com/${u}` : "",
                      }));
                    }}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              {editLink.type === "whatsapp" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Número do WhatsApp (com DDD)
                  </label>
                  <Input
                    placeholder="Ex: 73999998888"
                    value={editLink.whatsapp_number || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setEditLink((prev) => ({
                        ...prev,
                        whatsapp_number: digits,
                        target_url: digits ? `https://wa.me/${digits}` : "",
                      }));
                    }}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              {(editLink.type === "custom" || editLink.type === "menu_comanda") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    URL de Destino Completa
                  </label>
                  <Input
                    placeholder="https://exemplo.com/cardapio"
                    value={editLink.target_url || ""}
                    onChange={(e) =>
                      setEditLink((prev) => ({ ...prev, target_url: e.target.value }))
                    }
                    className="h-9 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={saveMutation.isPending || !editLink?.title || !editLink?.code}
              onClick={() => {
                if (editLink && editLink.title && editLink.code) {
                  saveMutation.mutate(
                    editLink as Partial<DynamicLink> & { code: string; title: string },
                  );
                }
              }}
              className="text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Plaquinha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Gravação Nativa Web NFC */}
      <WebNfcWriterModal
        link={writerLink}
        isOpen={Boolean(writerLink)}
        onClose={() => setWriterLink(null)}
      />

      {/* Modal de Visualização e Impressão de Plaquinha em Acrílico */}
      <PlaquePrintModal
        link={printLink}
        isOpen={Boolean(printLink)}
        onClose={() => setPrintLink(null)}
      />
    </div>
  );
}

