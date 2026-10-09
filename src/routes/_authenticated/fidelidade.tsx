import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift,
  Coins,
  QrCode,
  Settings2,
  Users,
  Tag,
  Plus,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Trash2,
  Flame,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoyaltyCashierPad } from "@/components/loyalty/LoyaltyCashierPad";
import { LoyaltySettingsModal } from "@/components/loyalty/LoyaltySettingsModal";
import { LoyaltyService, type LoyaltyProgramSettings } from "@/modules/loyalty";

export const Route = createFileRoute("/_authenticated/fidelidade")({
  head: () => ({
    meta: [
      { title: "Fidelidade & Cupons — EIA Digital" },
      { name: "description", content: "Gerencie o programa de pontos, caixa e cupons do seu negócio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoyaltyPage,
});

interface CouponItem {
  code: string;
  discount: number; // ex: 10 para 10% ou valor fixo
  type: "percent" | "fixed";
  minOrder?: number;
  description: string;
  active: boolean;
}

function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState("cashier");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Busca as páginas da empresa
  const { data: bioPages = [], isLoading: loadingBio } = useQuery({
    queryKey: ["loyalty-bio-pages"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("bio_pages")
        .select("*")
        .eq("user_id", u.user.id)
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

  const bioPage = useMemo(() => {
    if (selectedPageId) {
      return bioPages.find((p) => p.id === selectedPageId) || bioPages[0] || null;
    }
    const realPages = bioPages.filter((p) => !(p.social_links as any)?.is_demo);
    return realPages[0] || bioPages[0] || null;
  }, [bioPages, selectedPageId]);

  // Configurações do programa de fidelidade
  const [settings, setSettings] = useState<LoyaltyProgramSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cupons promocionais locais (com fallback e persistência)
  const [coupons, setCoupons] = useState<CouponItem[]>([
    {
      code: "BEMVINDO10",
      discount: 10,
      type: "percent",
      minOrder: 30,
      description: "10% de desconto na primeira compra de boas-vindas",
      active: true,
    },
    {
      code: "PRIMEIRACOMPRA",
      discount: 10,
      type: "percent",
      minOrder: 40,
      description: "10% OFF no catálogo e vitrine online",
      active: true,
    },
    {
      code: "FIDELIDADE15",
      discount: 15,
      type: "percent",
      minOrder: 60,
      description: "Cupom especial de fidelidade para clientes VIP",
      active: true,
    },
  ]);

  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("10");
  const [newCouponType, setNewCouponType] = useState<"percent" | "fixed">("percent");
  const [newCouponMin, setNewCouponMin] = useState("0");
  const [newCouponDesc, setNewCouponDesc] = useState("");
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);

  useEffect(() => {
    if (bioPage?.id) {
      LoyaltyService.getProgramSettings(bioPage.id).then((st) => {
        setSettings(st);
      });
    }
  }, [bioPage?.id]);

  const handleCreateCoupon = () => {
    const cleanCode = newCouponCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanCode) {
      toast.error("Informe um código válido para o cupom.");
      return;
    }
    const discountVal = parseFloat(newCouponDiscount.replace(",", ".")) || 0;
    if (discountVal <= 0) {
      toast.error("Informe um valor de desconto válido.");
      return;
    }

    const newCoupon: CouponItem = {
      code: cleanCode,
      discount: discountVal,
      type: newCouponType,
      minOrder: parseFloat(newCouponMin.replace(",", ".")) || 0,
      description: newCouponDesc.trim() || `Desconto de ${discountVal}${newCouponType === "percent" ? "%" : " reais"}`,
      active: true,
    };

    setCoupons((prev) => [newCoupon, ...prev]);
    setIsAddCouponModalOpen(false);
    setNewCouponCode("");
    setNewCouponDiscount("10");
    setNewCouponDesc("");
    toast.success(`Cupom ${cleanCode} criado com sucesso!`);
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c))
    );
  };

  const handleDeleteCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    toast.success(`Cupom ${code} removido.`);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto pb-24">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
            <Gift className="h-3.5 w-3.5" />
            <span>Retenção & Vendas Recorrentes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Fidelidade & Cupons
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Premie seus clientes com pontos a cada compra no balcão e crie cupons atrativos para alavancar seu delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {bioPages.length > 1 && (
            <div className="relative">
              <select
                value={bioPage?.id || ""}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="appearance-none rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none pr-8 cursor-pointer shadow-2xs"
              >
                {bioPages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} ({p.slug})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {bioPage && (
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
              className="gap-2 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              <Settings2 className="h-4 w-4" />
              <span>Regras do Programa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Regra de Pontuação</CardTitle>
            <Coins className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-foreground">
              R$ 1,00 = {settings?.pointsRatio || 1} ponto
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Validade: {settings?.pointsExpirationDays || 180} dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Prêmios Cadastrados</CardTitle>
            <Gift className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-foreground">
              {settings?.rewards?.length || 0} recompensas
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Disponíveis para resgate pelos clientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Cupons Ativos</CardTitle>
            <Tag className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-foreground">
              {coupons.filter((c) => c.active).length} cupons
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aplicáveis no cardápio e sacola
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação em Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border/40">
          <TabsTrigger value="cashier" className="gap-2 text-xs font-semibold">
            <QrCode className="h-3.5 w-3.5" />
            <span>Teclado do Caixa / Balcão</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2 text-xs font-semibold">
            <Tag className="h-3.5 w-3.5" />
            <span>Cupons de Desconto</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2 text-xs font-semibold">
            <Gift className="h-3.5 w-3.5" />
            <span>Catálogo de Prêmios</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: TECLADO DO CAIXA / BALCÃO */}
        <TabsContent value="cashier" className="space-y-4">
          {bioPage ? (
            <LoyaltyCashierPad
              bioPageId={bioPage.id}
              businessName={bioPage.display_name || "Sua Loja"}
              slug={bioPage.slug}
            />
          ) : (
            <Card className="p-8 text-center border-dashed border-border/60">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">Nenhuma página ativa encontrada</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Crie ou publique sua página em "Páginas & Links" para vincular o caixa e pontuar seus clientes.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ABA 2: CUPONS DE DESCONTO */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Cupons Promocionais</h3>
              <p className="text-xs text-muted-foreground">
                Estes cupons podem ser aplicados pelos clientes na sacola de compras do cardápio ou catálogo.
              </p>
            </div>
            <Button
              onClick={() => setIsAddCouponModalOpen(true)}
              className="gap-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Cupom</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {coupons.map((c) => (
              <Card
                key={c.code}
                className={`p-4 border transition-all ${
                  c.active
                    ? "border-pink-500/30 bg-card/60 shadow-md"
                    : "border-border/40 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                        {c.code}
                      </span>
                      <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">
                        {c.active ? "Ativo" : "Pausado"}
                      </Badge>
                    </div>
                    <div className="text-lg font-black text-foreground mt-2">
                      {c.type === "percent" ? `${c.discount}% OFF` : `R$ ${c.discount.toFixed(2)} OFF`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="text-muted-foreground hover:text-red-400 p-1 rounded-md transition-colors"
                    title="Excluir cupom"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                {c.minOrder && c.minOrder > 0 ? (
                  <p className="text-[11px] text-zinc-400 mt-1">Pedido mínimo: R$ {c.minOrder.toFixed(2)}</p>
                ) : null}
                <div className="pt-3 mt-3 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">Status do cupom</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleCoupon(c.code)}
                    className="text-xs h-7 px-2"
                  >
                    {c.active ? "Pausar" : "Ativar"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ABA 3: CATÁLOGO DE PRÊMIOS */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Recompensas do Programa</h3>
              <p className="text-xs text-muted-foreground">
                Prêmios que o cliente pode trocar quando atingir a pontuação necessária.
              </p>
            </div>
            {bioPage && (
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(true)}
                className="gap-2 border-pink-500/30 text-pink-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Prêmio</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings?.rewards && settings.rewards.length > 0 ? (
              settings.rewards.map((reward, i) => (
                <Card key={i} className="p-4 border-border/60 bg-card/60 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Coins className="h-3 w-3" />
                        {reward.pointsCost} pontos
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mt-2">{reward.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{reward.description}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                    Resgate via WhatsApp ou Balcão
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed border-border/60 col-span-full">
                <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h4 className="text-sm font-bold text-foreground">Nenhum prêmio cadastrado ainda</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Clique em "Regras do Programa" no topo para definir os prêmios que seus clientes poderão resgatar.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Novo Cupom */}
      <Dialog open={isAddCouponModalOpen} onOpenChange={setIsAddCouponModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-pink-500" />
              <span>Criar Novo Cupom de Desconto</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Defina o código e as regras de desconto para o seu cardápio ou vitrine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-zinc-200">Código do Cupom (em maiúsculas):</Label>
              <Input
                placeholder="EX: PROMO10, QUEROPIZZA"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="bg-zinc-900 border-white/10 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-200">Tipo de Desconto:</Label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as any)}
                  className="w-full p-2 rounded-md bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none"
                >
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-200">Valor do Desconto:</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(e.target.value)}
                  className="bg-zinc-900 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-200">Pedido Mínimo (R$ opcional):</Label>
              <Input
                type="number"
                placeholder="0"
                value={newCouponMin}
                onChange={(e) => setNewCouponMin(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-200">Descrição / Chamada:</Label>
              <Input
                placeholder="Ex: 10% OFF para novos clientes no cardápio"
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddCouponModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleCreateCoupon} className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs">
              Criar Cupom
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Regras de Fidelidade */}
      {bioPage && (
        <LoyaltySettingsModal
          bioPageId={bioPage.id}
          settings={settings}
          onSaved={(updated) => {
            setSettings(updated);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default LoyaltyPage;

