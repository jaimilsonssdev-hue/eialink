import { useState, useEffect } from "react";
import {
  Utensils,
  QrCode,
  Users,
  ChefHat,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Volume2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ComandaService } from "@/modules/comanda/services/ComandaService";
import { SoundAlertService } from "@/modules/comanda/services/SoundAlertService";
import type { ComandaSettings, WaiterProfile, TableItem } from "@/modules/comanda/types";

interface ComandaManagerProps {
  bioPageId: string;
}

export function ComandaManager({ bioPageId }: ComandaManagerProps) {
  const [settings, setSettings] = useState<ComandaSettings | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tab ativa
  const [activeTab, setActiveTab] = useState<"general" | "waiters" | "tables">("waiters");

  // Modal de preview de QR Code
  const [previewItem, setPreviewItem] = useState<{ title: string; subtitle: string; url: string } | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://eialink.com.br";

  useEffect(() => {
    if (!bioPageId) return;
    setLoading(true);
    ComandaService.getSettings(bioPageId)
      .then((res) => {
        setSettings(res.settings);
        setRestaurantSlug(res.slug);
      })
      .catch((err) => {
        console.warn("Erro ao buscar configurações de comanda:", err);
      })
      .finally(() => setLoading(false));
  }, [bioPageId]);

  async function handleSave() {
    if (!settings || !bioPageId) return;
    setSaving(true);
    try {
      await ComandaService.saveSettings(bioPageId, settings);
      toast.success("Configurações da Comanda salvas com sucesso!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar comanda.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCopy(text: string, identifier: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(identifier);
    setTimeout(() => setCopiedCode(null), 3000);
    toast.success("Link copiado! Pronto para gravar no chip NFC ou compartilhar.");
  }

  function addWaiter() {
    if (!settings) return;
    const count = settings.waiters.length + 1;
    const newId = `w-${Date.now()}`;
    const newWaiter: WaiterProfile = {
      id: newId,
      name: `Garçom ${count}`,
      pin: `${Math.floor(1000 + Math.random() * 9000)}`,
      card_code: `garcom-${count}`,
      active: true,
      color: "#8B5CF6",
    };
    setSettings({
      ...settings,
      waiters: [...settings.waiters, newWaiter],
    });
  }

  function removeWaiter(id: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      waiters: settings.waiters.filter((w) => w.id !== id),
    });
  }

  function updateWaiter(id: string, patch: Partial<WaiterProfile>) {
    if (!settings) return;
    setSettings({
      ...settings,
      waiters: settings.waiters.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  }

  function addTable() {
    if (!settings) return;
    const count = settings.tables.length + 1;
    const num = String(count).padStart(2, "0");
    const newTable: TableItem = {
      id: `tab-${Date.now()}`,
      number: num,
      card_code: `mesa-${num}`,
      active: true,
    };
    setSettings({
      ...settings,
      tables: [...settings.tables, newTable],
    });
  }

  function removeTable(id: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      tables: settings.tables.filter((t) => t.id !== id),
    });
  }

  function updateTable(id: string, patch: Partial<TableItem>) {
    if (!settings) return;
    setSettings({
      ...settings,
      tables: settings.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  if (loading || !settings) {
    return (
      <Card className="rounded-2xl border border-border p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Carregando Comanda Digital...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    Comanda Digital & Cartões NFC / QR Code
                  </CardTitle>
                  {settings.enabled ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[11px]">
                      Desativada
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Venda cartões físicos para garçons ou mesas fixas e gerencie pedidos em tempo real.
                </CardDescription>
              </div>
            </div>

            {/* Ações Rápidas: Abrir Garçom e Cozinha */}
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 text-xs border-border">
                <a href="/comanda/garcom" target="_blank" rel="noreferrer">
                  <Smartphone className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                  Painel Garçom <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9 text-xs border-border">
                <a href="/comanda/cozinha" target="_blank" rel="noreferrer">
                  <ChefHat className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                  Cozinha KDS <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Barra de Abas */}
        <div className="flex items-center border-b border-border px-5 gap-4 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("waiters")}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "waiters"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Cartões dos Garçons ({settings.waiters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tables")}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "tables"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Plaquinhas de Mesas ({settings.tables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Regras de Atendimento</span>
          </button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* ABA 1: CARTÕES DOS GARÇONS */}
          {activeTab === "waiters" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Cartões Individuais por Garçom (NFC / QR Code)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O garçom deixa o cartão dele na mesa. O cliente escaneia e os pedidos caem diretamente para ele com som de campainha.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addWaiter}
                  className="bg-primary hover:bg-primary/90 text-white text-xs h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Garçom
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.waiters.map((waiter) => {
                  const dynamicLink = `${origin}/r/${waiter.card_code}`;
                  const qrUrl = ComandaService.getQrCodeImageUrl(dynamicLink, 400);

                  return (
                    <div
                      key={waiter.id}
                      className="p-4 rounded-2xl border border-border/80 bg-background/50 hover:bg-background space-y-3 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-xs"
                            style={{ backgroundColor: waiter.color || "#8B5CF6" }}
                          >
                            {waiter.name.charAt(0)}
                          </span>
                          <div>
                            <input
                              type="text"
                              value={waiter.name}
                              onChange={(e) => updateWaiter(waiter.id, { name: e.target.value })}
                              placeholder="Nome do Garçom"
                              className="font-bold text-sm text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                PIN: <b className="font-mono text-foreground">{waiter.pin}</b>
                              </span>
                              <span className="text-[11px] text-muted-foreground">•</span>
                              <span className="text-[11px] font-mono text-primary">
                                /r/{waiter.card_code}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeWaiter(waiter.id)}
                          className="text-muted-foreground hover:text-rose-400 p-1 transition-colors"
                          title="Excluir Garçom"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Ações do Cartão NFC / QR Code */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreviewItem({
                              title: `Cartão de Atendimento — ${waiter.name}`,
                              subtitle: `Aproxime o celular ou escaneie para ser atendido por ${waiter.name}`,
                              url: dynamicLink,
                            })
                          }
                          className="flex-1 h-8 text-xs gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver QR Code
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(dynamicLink, waiter.id)}
                          className="flex-1 h-8 text-xs gap-1.5"
                        >
                          {copiedCode === waiter.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Link NFC
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: PLAQUINHAS DE MESAS FIXAS */}
          {activeTab === "tables" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Plaquinhas Fixas de Mesas (QR Code & NFC)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cole adesivos ou coloque acrílicos nas mesas. O cliente pede direto e a mesa é identificada automaticamente.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addTable}
                  className="bg-primary hover:bg-primary/90 text-white text-xs h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Mesa
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {settings.tables.map((table) => {
                  const dynamicLink = `${origin}/r/${table.card_code}`;

                  return (
                    <div
                      key={table.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-background/50 hover:bg-background space-y-2.5 transition-all text-center"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          /r/{table.card_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTable(table.id)}
                          className="text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="py-1">
                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-black text-sm">
                          MESA {table.number}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreviewItem({
                              title: `Mesa ${table.number}`,
                              subtitle: `Escaneie para fazer seu pedido pelo celular`,
                              url: dynamicLink,
                            })
                          }
                          className="flex-1 h-7 text-[11px] px-1"
                        >
                          <QrCode className="h-3 w-3 mr-1" /> QR Code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(dynamicLink, table.id)}
                          className="h-7 text-[11px] px-2"
                          title="Copiar Link NFC"
                        >
                          {copiedCode === table.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 3: REGRAS DE ATENDIMENTO */}
          {activeTab === "general" && (
            <div className="space-y-6 max-w-xl">
              {/* Ativar Módulo */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-foreground">
                    Ativar Comanda Digital & Chamar Garçom
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Exibe a barra de comanda e botão de chamado para clientes que acessarem via mesa/garçom.
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              {/* Modo de Operação */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Modo de Operação dos Pedidos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSettings({ ...settings, mode: "waiter" })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      settings.mode === "waiter"
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-background/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>Modo Garçom (Recomendado)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      O cliente pede no celular, o garçom confere na mesa e toca em "Mandar para a Cozinha".
                    </p>
                  </div>

                  <div
                    onClick={() => setSettings({ ...settings, mode: "kitchen_direct" })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      settings.mode === "kitchen_direct"
                        ? "border-amber-500 bg-amber-500/10 shadow-xs"
                        : "border-border bg-background/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <ChefHat className="h-4 w-4 text-amber-400" />
                      <span>Modo Cozinha Express</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      O pedido cai direto na tela KDS da cozinha. O garçom apenas leva o prato pronto à mesa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Teste de Sons do Alarme */}
              <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Testar Efeitos Sonoros do Sistema
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => SoundAlertService.playWaiterCallChime()}
                    className="text-xs h-8"
                  >
                    🔔 Sino de Garçom ("Ding-Dong")
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => SoundAlertService.playKitchenNewOrderChime()}
                    className="text-xs h-8"
                  >
                    🍳 Alerta da Cozinha
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => SoundAlertService.playOrderReadyChime()}
                    className="text-xs h-8"
                  >
                    🍽️ Pedido Pronto
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Botão Salvar Geral */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 px-6 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar Configurações da Comanda
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Visualizador e Impressor de QR Code */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-card p-6 text-foreground text-center shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <h3 className="font-bold text-base text-foreground">
                {previewItem.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {previewItem.subtitle}
              </p>
            </div>

            {/* Imagem do QR Code em alta definição */}
            <div className="mx-auto p-4 rounded-2xl bg-white border border-border shadow-md inline-block">
              <img
                src={ComandaService.getQrCodeImageUrl(previewItem.url, 450)}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="font-mono text-[11px] text-muted-foreground truncate px-2 bg-muted/40 py-1.5 rounded-lg select-all">
              {previewItem.url}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                asChild
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 gap-1.5"
              >
                <a
                  href={ComandaService.getQrCodeImageUrl(previewItem.url, 800)}
                  download="qrcode-comanda.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-4 w-4" /> Baixar Imagem (PNG)
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewItem(null)}
                className="h-10 text-xs px-4"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

